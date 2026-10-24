"""Convierte una hoja de un .xlsx/.xlsm a NDJSON (una fila por línea, claves = cabecera).

Uso: python3 -I xlsx_to_ndjson.py <entrada.xlsx> <hoja> <salida.ndjson>

Las fechas se escriben como `AAAA-MM-DD`; las celdas vacías como `null`. No
evalúa macros ni fórmulas (lee los valores guardados). Requiere `openpyxl`.
"""

import datetime
import json
import sys

import openpyxl


def cell(v):
    if isinstance(v, (datetime.datetime, datetime.date)):
        return v.strftime("%Y-%m-%d")
    return v


def main(src, sheet, dst):
    wb = openpyxl.load_workbook(src, read_only=True, data_only=True, keep_vba=False)
    rows = wb[sheet].iter_rows(values_only=True)
    header = [str(h) for h in next(rows)]
    n = 0
    with open(dst, "w", encoding="utf-8") as out:
        for row in rows:
            if all(v is None for v in row):
                continue
            out.write(json.dumps({h: cell(v) for h, v in zip(header, row)}, ensure_ascii=False))
            out.write("\n")
            n += 1
    print(f"{sheet}: {n} filas → {dst}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
