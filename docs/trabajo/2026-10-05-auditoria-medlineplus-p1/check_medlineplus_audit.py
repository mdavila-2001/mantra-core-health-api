#!/usr/bin/env python3
"""Audit MedlinePlus review inputs without making clinical equivalence decisions."""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import sys
import unicodedata
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse


def normalized(value: str) -> str:
    value = unicodedata.normalize("NFKD", value.casefold())
    value = "".join(ch for ch in value if not unicodedata.combining(ch))
    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--research-dir",
        required=True,
        type=Path,
        help="Directory containing the preserved MedlinePlus 2026-10-05 inputs",
    )
    args = parser.parse_args()
    root = args.research_dir
    required = (
        "medlineplus-manifest.json",
        "curated-glossary-profile.json",
        "medlineplus-review-queue.csv",
        "medlineplus-topics.jsonl",
    )
    missing = [name for name in required if not (root / name).is_file()]
    if missing:
        print("ERROR missing inputs: " + ", ".join(missing))
        return 2

    manifest = json.loads((root / required[0]).read_text(encoding="utf-8"))
    profile = json.loads((root / required[1]).read_text(encoding="utf-8"))
    with (root / required[2]).open(encoding="utf-8-sig", newline="") as stream:
        queue = list(csv.DictReader(stream))
    with (root / required[3]).open(encoding="utf-8") as stream:
        topics = [json.loads(line) for line in stream if line.strip()]

    errors: list[str] = []
    findings: list[str] = []
    archive_name = manifest.get("archive", "")
    archive_path = root / archive_name
    if not archive_name or not archive_path.is_file():
        errors.append(f"manifest archive is missing: {archive_name!r}")
    else:
        archive_hash = hashlib.sha256(archive_path.read_bytes()).hexdigest()
        if archive_hash != manifest.get("archive_sha256"):
            errors.append("archive SHA-256 differs from manifest")
    if manifest.get("output") != required[3]:
        findings.append(f"manifest output field {manifest.get('output')!r} differs from audited JSONL {required[3]!r}")
    topic_by_id: dict[str, dict] = {}
    duplicate_topic_ids: list[str] = []
    for topic in topics:
        source_id = str(topic.get("source_id", ""))
        if source_id in topic_by_id:
            duplicate_topic_ids.append(source_id)
        topic_by_id[source_id] = topic
    if duplicate_topic_ids:
        errors.append("duplicate source IDs in topic export: " + ", ".join(sorted(set(duplicate_topic_ids))))

    actual_languages = Counter(topic.get("language") for topic in topics)
    actual_releases = Counter(topic.get("source_release") for topic in topics)
    missing_summaries = Counter(
        topic.get("language") for topic in topics if not str(topic.get("summary_text", "")).strip()
    )
    if len(topics) != manifest.get("declared_topics"):
        errors.append(f"topic count {len(topics)} != manifest {manifest.get('declared_topics')}")
    if dict(actual_languages) != manifest.get("topics_by_language"):
        errors.append(f"language counts {dict(actual_languages)} != manifest {manifest.get('topics_by_language')}")
    if set(actual_releases) != {manifest.get("release_date")}:
        errors.append(f"topic release values {dict(actual_releases)} differ from manifest release_date")
    if dict(missing_summaries) != manifest.get("missing_summaries_by_language"):
        errors.append(
            "missing-summary counts "
            f"{dict(missing_summaries)} != manifest {manifest.get('missing_summaries_by_language')}"
        )

    candidate_rows = [row for row in queue if row.get("candidate_source_id", "").strip()]
    candidate_groups: dict[str, list[dict[str, str]]] = defaultdict(list)
    for row in candidate_rows:
        candidate_groups[row["slug"]].append(row)
    profile_terms = profile.get("terms")
    profile_slugs = profile.get("unique_slugs")
    if len({row.get("slug") for row in queue}) != profile_slugs:
        findings.append(
            f"queue has {len({row.get('slug') for row in queue})} distinct slugs; profile reports {profile_slugs}"
        )
    if profile_terms != profile_slugs:
        findings.append(f"profile count inconsistency: terms={profile_terms}, unique_slugs={profile_slugs}")

    seen_rows: Counter[tuple[str, str, str, str]] = Counter()
    unresolved_counterpart_ids: set[str] = set()
    exact_header = "slug,glossary_name,category,candidate_source_id,candidate_source_url,candidate_source_language,candidate_source_name,matched_glossary_field,match_field,candidate_summary,review_status"
    if not queue or set(queue[0]) != set(exact_header.split(",")):
        errors.append("review queue header/columns do not match the expected contract")

    for row in candidate_rows:
        slug = row.get("slug", "")
        source_id = row.get("candidate_source_id", "")
        topic = topic_by_id.get(source_id)
        required_fields = (
            "candidate_source_url",
            "candidate_source_language",
            "candidate_source_name",
            "matched_glossary_field",
            "match_field",
            "review_status",
        )
        empty = [field for field in required_fields if not row.get(field, "").strip()]
        if empty:
            errors.append(f"{slug}/{source_id}: missing fields {','.join(empty)}")
        if not topic:
            errors.append(f"{slug}/{source_id}: source ID absent from topic export")
            continue
        if row.get("candidate_source_url") != topic.get("source_url"):
            errors.append(f"{slug}/{source_id}: queued URL differs from source record URL")
        if row.get("candidate_source_language") != topic.get("language"):
            errors.append(f"{slug}/{source_id}: queued language differs from source record language")
        match_field = row.get("match_field")
        source_label = row.get("candidate_source_name")
        if match_field == "title":
            labels = [topic.get("title", "")]
        elif match_field == "also_called":
            labels = topic.get("also_called", [])
        else:
            errors.append(f"{slug}/{source_id}: unsupported match_field {match_field!r}")
            labels = []
        if normalized(source_label) not in {normalized(label) for label in labels}:
            errors.append(f"{slug}/{source_id}: matched source label is not present in declared source field")
        if normalized(row.get("glossary_name", "")) != normalized(slug):
            errors.append(f"{slug}/{source_id}: slug does not normalize from glossary_name")
        if row.get("review_status") != "needs_human_concept_review":
            findings.append(f"{slug}/{source_id}: queue status is {row.get('review_status')!r}")
        if topic.get("review_status") != "staged_not_clinically_reviewed":
            findings.append(f"{slug}/{source_id}: source status is {topic.get('review_status')!r}")

        row_key = (slug, source_id, row.get("candidate_source_language", ""), row.get("candidate_source_url", ""))
        seen_rows[row_key] += 1
        for paired in topic.get("language_mapped_topics", []):
            paired_id = str(paired.get("id", ""))
            if paired_id and paired_id not in topic_by_id:
                errors.append(f"{slug}/{source_id}: linked language record {paired_id} absent from export")
            elif paired_id and not any(
                other.get("candidate_source_id") == paired_id for other in candidate_groups.get(slug, [])
            ):
                unresolved_counterpart_ids.add(paired_id)

    duplicate_queue_rows = [(key, count) for key, count in seen_rows.items() if count > 1]
    if duplicate_queue_rows:
        findings.append(
            "duplicate candidate queue rows: "
            + "; ".join(f"{key[0]}/{key[1]} x{count}" for key, count in duplicate_queue_rows)
        )
    if unresolved_counterpart_ids:
        findings.append(
            "source-linked language counterpart not separately queued: "
            + ", ".join(sorted(unresolved_counterpart_ids, key=int))
        )
    license_fields = ("source_license", "license", "license_id")
    if not any(manifest.get(field) for field in license_fields):
        findings.append("manifest has rights_page and attribution but no structured source_license/license field")
    if manifest.get("publication_status") != "staging_only":
        findings.append(f"unexpected publication_status: {manifest.get('publication_status')!r}")

    print(
        "INPUTS "
        f"topics={len(topics)}/{manifest.get('declared_topics')} "
        f"languages={dict(actual_languages)} "
        f"archive_sha256={'verified' if archive_path.is_file() and not any('SHA-256' in item for item in errors) else 'not_verified'} "
        f"queue_rows={len(queue)} queue_slugs={len({row.get('slug') for row in queue})} "
        f"profile_terms={profile_terms} profile_unique_slugs={profile_slugs}"
    )
    print(
        f"CANDIDATES rows={len(candidate_rows)} unique_slugs={len(candidate_groups)} "
        f"unique_records={len({row.get('candidate_source_id') for row in candidate_rows})}"
    )
    for item in errors:
        print("ERROR " + item)
    for item in findings:
        print("REVIEW " + item)
    print("CLINICAL_DECISIONS none; this check never approves equivalence or publication")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
