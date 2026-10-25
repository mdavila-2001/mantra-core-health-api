#!/usr/bin/env python3
"""
Equipos de diagnóstico · master · suplemento del PCD de la FDA.

`bjoleary/fdadata` publica el `foiclass` de la FDA más nuevo (refresco del
2026-10-20), pero en `.rda` de R y ya transformado: los paneles van con su
nombre y la regulación como número (`868.5820` → `868.582`). No es una copia
literal, así que NO reemplaza al `foiclass.csv` literal de `lib/sources.mjs`.
Este script saca de ahí solo los product codes que la copia literal no tiene y
los escribe en `data/fda-pcd-supplement.json`, con la procedencia y la
transformación declaradas. La regulación se reconstruye con la sección a cuatro
dígitos (convención del 21 CFR para las secciones de clasificación).

Uso (necesita `pyreadr` y `pandas`; no corre código del repo bajado):
  python3 -I tools/terminology-import/diagnostic-devices/master/extract-pcd-supplement.py \\
      <ruta a data/product_codes.rda> <ruta al foiclass.csv literal> <salida.json>
"""

import csv
import hashlib
import json
import math
import sys

import pyreadr

REPO = "https://github.com/bjoleary/fdadata"
COMMIT = "227bdaa24aec8565e333cc67689ff2c63ce5cea7"
COMMIT_DATE = "2026-10-20T17:14:47+00:00"
PATH = "data/product_codes.rda"


def nz(v):
    if v is None or (isinstance(v, float) and math.isnan(v)):
        return None
    s = str(v).strip()
    return s or None


def regulation(v):
    """`862.1354` → `862.1354`; `868.582` → `868.5820` (sección a 4 dígitos)."""
    s = nz(v)
    if s is None:
        return None
    part, _, section = s.partition(".")
    return f"{part}.{section.ljust(4, '0')}" if section else part


def main(rda, foiclass, out):
    raw = open(rda, "rb").read()
    sha = hashlib.sha256(raw).hexdigest()
    df = pyreadr.read_r(rda)["product_codes"]
    literal = {r["PRODUCTCODE"] for r in csv.DictReader(open(foiclass, encoding="utf-8"), delimiter="|")}
    rows = []
    for _, r in df.iterrows():
        code = nz(r["product_code"])
        if not code or code in literal:
            continue
        rows.append(
            {
                "PRODUCTCODE": code,
                "DEVICENAME": nz(r["device_type_name"]),
                "DEVICECLASS": nz(r["device_class"]),
                "REGULATIONNUMBER": regulation(r["regulation"]),
                "DEFINITION": nz(r["definition"]),
                "reviewPanelName": nz(r["review_panel"]),
                "medicalSpecialtyName": nz(r["medical_specialty"]),
                "submissionType": nz(r["submission_type"]),
            }
        )
    rows.sort(key=lambda x: x["PRODUCTCODE"])
    doc = {
        "source": "fda-pcd",
        "via": {"repo": REPO, "commit": COMMIT, "commitDate": COMMIT_DATE, "path": PATH, "sha256": sha, "license": "MIT (repositorio); datos de la FDA, dominio público"},
        "transformation": "bjoleary/fdadata limpia el foiclass: paneles por nombre, regulación numérica; aquí la sección se reconstruye a 4 dígitos. Solo códigos ausentes en la copia literal.",
        "officialUrl": "https://www.fda.gov/medical-devices/classify-your-medical-device/download-product-code-classification-files",
        "rows": rows,
    }
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, ensure_ascii=False, indent=2)
        fh.write("\n")
    print(f"{len(rows)} product codes suplementarios → {out} (rda sha256 {sha[:12]})")


if __name__ == "__main__":
    main(*sys.argv[1:4])
