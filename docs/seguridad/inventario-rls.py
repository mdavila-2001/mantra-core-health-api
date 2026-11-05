#!/usr/bin/env python3
"""Inventario estático de RLS sobre tablas con `tenant_id` en el modelo.

Uso: python3 -I docs/seguridad/inventario-rls.py <raíz con SQL/ y NoSQL/>

Recorre el DDL en el orden en que lo aplica `docker/db-init/init-postgres.sh`
de la API: apply_all.sql (y apply_deferred.sql) -> NoSQL 58 -> NoSQL 59 ->
SQL/patches/*.sql en orden de nombre. Para cada tabla con columna `tenant_id`
registra el tipo, dónde se crea (o se le agrega la columna), si algún archivo
declara `ENABLE ROW LEVEL SECURITY` / `CREATE POLICY` literal sobre ella y si
la cubre el bucle dinámico de `2026-08-05_tenant_rls.sql` en una base nueva.
"""
import os
import re
import sys

root = sys.argv[1]
sql_dir = os.path.join(root, "SQL")
RLS_PATCH = "2026-08-05_tenant_rls.sql"


def ordered_files():
    files = []
    for apply in ("apply_all.sql", "apply_deferred.sql"):
        with open(os.path.join(sql_dir, apply), encoding="utf-8") as fh:
            for line in fh:
                m = re.match(r"\\ir\s+(\S+)", line.strip())
                if m:
                    files.append(os.path.join(sql_dir, m.group(1)))
    files.append(os.path.join(root, "NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql"))
    files.append(os.path.join(root, "NoSQL/59_vector_rag_pgvector/vector_rag.pgvector.sql"))
    patches = sorted(f for f in os.listdir(os.path.join(sql_dir, "patches")) if f.endswith(".sql"))
    files += [os.path.join(sql_dir, "patches", p) for p in patches]
    return files


def strip_comments(text):
    text = re.sub(r"/\*.*?\*/", "", text, flags=re.S)
    return re.sub(r"--[^\n]*", "", text)


IDENT = r'"?([A-Za-z_][A-Za-z0-9_]*)"?'
QUAL = IDENT + r"\s*\.\s*" + IDENT
CREATE_RE = re.compile(r"CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?" + QUAL + r"\s*\(", re.I)
ADD_COL_RE = re.compile(r"ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?" + QUAL +
                        r"[^;]*?ADD\s+COLUMN\s+(?:IF\s+NOT\s+EXISTS\s+)?\"?tenant_id\"?\s+([A-Za-z0-9_]+)", re.I | re.S)
ENABLE_RE = re.compile(r"ALTER\s+TABLE\s+(?:IF\s+EXISTS\s+)?(?:ONLY\s+)?" + QUAL + r"\s+ENABLE\s+ROW\s+LEVEL\s+SECURITY", re.I)
POLICY_RE = re.compile(r"CREATE\s+POLICY\s+\S+\s+ON\s+" + QUAL, re.I)


def body_after(text, start):
    depth, i = 1, start
    while i < len(text) and depth:
        if text[i] == "(":
            depth += 1
        elif text[i] == ")":
            depth -= 1
        i += 1
    return text[start:i - 1]


tables = {}  # (schema, table) -> dict
explicit_enable, explicit_policy = set(), set()
listed = {}  # (schema, table) -> archivo que la nombra en un bucle ENABLE ... RLS
PAIR_RE = re.compile(r"\(\s*'([a-z_][a-z0-9_]*)'\s*,\s*'([a-z_][a-z0-9_]*)'\s*\)")
DOTTED_RE = re.compile(r"'\"?([a-z_][a-z0-9_]*)\"?\.\"?([a-z_][a-z0-9_]*)\"?'")
files = ordered_files()
rls_index = next(i for i, f in enumerate(files) if f.endswith(RLS_PATCH))

for idx, path in enumerate(files):
    if not os.path.exists(path):
        continue
    rel = os.path.relpath(path, root)
    text = strip_comments(open(path, encoding="utf-8").read())
    for m in CREATE_RE.finditer(text):
        key = (m.group(1), m.group(2))
        body = body_after(text, m.end())
        col = re.search(r'(?:^|,|\()\s*"?tenant_id"?\s+([A-Za-z0-9_]+)', body, re.I | re.M)
        if col and key not in tables:
            tables[key] = {"type": col.group(1).lower(), "file": rel, "idx": idx}
    for m in ADD_COL_RE.finditer(text):
        key = (m.group(1), m.group(2))
        if key not in tables:
            tables[key] = {"type": m.group(3).lower(), "file": rel, "idx": idx}
    for m in ENABLE_RE.finditer(text):
        explicit_enable.add((m.group(1), m.group(2)))
    for m in POLICY_RE.finditer(text):
        explicit_policy.add((m.group(1), m.group(2)))
    if re.search(r"ENABLE\s+ROW\s+LEVEL\s+SECURITY", text, re.I) and "tenant_isolation" in text:
        for m in list(PAIR_RE.finditer(text)) + list(DOTTED_RE.finditer(text)):
            listed.setdefault((m.group(1), m.group(2)), []).append((rel, idx))

rows = []
for key in sorted(tables):
    t = tables[key]
    explicit = key in explicit_enable and key in explicit_policy
    dyn = t["type"] == "uuid" and t["idx"] < rls_index
    later = [f for f, i in listed.get(key, []) if i >= t["idx"]]
    t["list"] = later[-1] if later else None
    rows.append((key, t, explicit, dyn))

total = len(rows)
no_literal = [r for r in rows if not r[2]]
not_uuid = [r for r in rows if r[1]["type"] != "uuid"]
after_patch = [r for r in rows if r[1]["type"] == "uuid" and r[1]["idx"] > rls_index and not r[2]]
uncovered_fresh = [r for r in rows if not r[2] and not r[3] and not r[1]["list"]]

print(f"TOTAL_TENANT_TABLES={total}")
print(f"WITH_LITERAL_ENABLE_AND_POLICY={total - len(no_literal)}")
print(f"WITHOUT_LITERAL_ENABLE_OR_POLICY={len(no_literal)}")
print(f"TENANT_ID_NOT_UUID={len(not_uuid)}")
print(f"UUID_CREATED_AFTER_RLS_PATCH_WITHOUT_LITERAL={len(after_patch)}")
print(f"AFTER_PATCH_COVERED_BY_OWN_PATCH_LIST={sum(1 for r in after_patch if r[1]['list'])}")
print(f"UNCOVERED_ON_FRESH_DB={len(uncovered_fresh)}")
print("##NOT_UUID")
for (s, n), t, *_ in not_uuid:
    print(f"{s}.{n}\t{t['type']}\t{t['file']}")
print("##AFTER_PATCH")
for (s, n), t, *_ in after_patch:
    print(f"{s}.{n}\t{t['type']}\t{t['file']}\t{t['list'] or 'SIN-LISTA'}")
print("##LITERAL")
for (s, n), t, e, d in rows:
    if e:
        print(f"{s}.{n}\t{t['type']}\t{t['file']}")
print("##NO_LITERAL")
for (s, n), t, e, d in no_literal:
    cov = 'bucle 2026-08-05' if d else (('lista ' + os.path.basename(t['list'])) if t['list'] else 'SIN-COBERTURA-EN-BASE-NUEVA')
    print(f"{s}.{n}\t{t['type']}\t{t['file']}\t{cov}")
