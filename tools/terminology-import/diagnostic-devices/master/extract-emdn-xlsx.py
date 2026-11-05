#!/usr/bin/env python3
"""
Equipos de diagnóstico · master · EMDN oficial (Excel de la Comisión) → CSV.

La Comisión publica la EMDN completa como Excel (`EMDN v2026_EN..xlsx`,
enlazado desde https://webgate.ec.europa.eu/dyna2/emdn/M90). `build.mjs` lee
CSV, así que este script copia la hoja tal cual a CSV con la cabecera que usa
`lib/emdn.mjs` (`EMDN_COLUMNS`). Solo cambia el nombre de las columnas (se
quita el sufijo de versión «(v.2026)» y los paréntesis de «(YES/NO)»); los
valores van verbatim. Falla si la hoja no tiene las seis columnas esperadas.

Uso (necesita `openpyxl`; lo llama `fetch-sources.mjs`):
  python3 -I tools/terminology-import/diagnostic-devices/master/extract-emdn-xlsx.py <archivo.xlsx> <salida.csv>
"""

import csv
import re
import sys

import openpyxl

# Cabecera publicada (sin sufijo de versión) → columna de `EMDN_COLUMNS`.
HEADERS = {
    "CATEGORY": "CATEGORY",
    "CATEGORY DESCRIPTION": "CATEGORY DESCRIPTION",
    "CODE": "CODE",
    "TERM EMDN": "TERM",
    "LEVEL": "LEVEL",
    "TERMINAL LEVEL YES/NO": "TERMINAL LEVEL YES/NO",
}


def norm(h):
    h = re.sub(r"\(v\.\d{4}\)", "", str(h or ""))
    return re.sub(r"\s+", " ", h.replace("(", "").replace(")", "")).strip().upper()


def main(xlsx, out):
    wb = openpyxl.load_workbook(xlsx, read_only=True, data_only=True)
    if len(wb.sheetnames) != 1:
        raise SystemExit(f"EMDN: se esperaba una hoja, hay {wb.sheetnames}")
    rows = list(wb[wb.sheetnames[0]].iter_rows(values_only=True))
    hi = next(i for i, r in enumerate(rows) if "CODE" in [norm(c) for c in r])
    header = [norm(c) for c in rows[hi]]
    missing = [h for h in HEADERS if h not in header]
    if missing:
        raise SystemExit(f"EMDN: faltan columnas {missing}; cabecera real {rows[hi]}")
    idx = {HEADERS[h]: header.index(h) for h in HEADERS}
    cols = list(HEADERS.values())
    n = 0
    with open(out, "w", encoding="utf-8", newline="") as fh:
        w = csv.writer(fh)
        w.writerow(cols)
        for r in rows[hi + 1 :]:
            if r[idx["CODE"]] is None:
                continue
            w.writerow(["" if r[idx[c]] is None else str(r[idx[c]]).strip() for c in cols])
            n += 1
    print(f"EMDN: {n} términos → {out}")


if __name__ == "__main__":
    main(*sys.argv[1:3])
