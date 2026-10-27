#!/usr/bin/env python3
"""Open Targets 26.09 · clinical_report (Parquet) -> NDJSON con los informes de la EMA.

Uso: python3 -I extract-opentargets.py <clinical_report.parquet> <salida.ndjson>
Requiere pyarrow. Solo los informes con provider == "EMA" y type == "INDICATION"
(origen: EMA Human Drugs). Los de TTD, PMDA y los derivados de ChEMBL no se extraen
(ver lib/open-sources.mjs). Salida ordenada por id; campos tal cual los publica Open Targets.
"""
import json
import sys

import pyarrow.parquet as pq

src, dst = sys.argv[1], sys.argv[2]
cols = ["id", "clinicalStage", "origin", "type", "source", "provider", "drugs", "diseases", "url", "year"]
rows = [
    r
    for r in pq.read_table(src, columns=cols).to_pylist()
    if r["provider"] == "EMA" and r["type"] == "INDICATION"
]
rows.sort(key=lambda r: r["id"])
with open(dst, "w", encoding="utf-8") as out:
    for r in rows:
        out.write(json.dumps(r, ensure_ascii=False, sort_keys=True) + "\n")
print(f"{len(rows)} informes EMA", file=sys.stderr)
