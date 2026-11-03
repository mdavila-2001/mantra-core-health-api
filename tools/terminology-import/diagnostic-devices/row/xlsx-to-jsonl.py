"""Vuelca la primera hoja de un .xlsx a JSONL (una lista de celdas por fila).

Lee con openpyxl en modo solo lectura y sin fórmulas evaluadas; no ejecuta
macros. Cada celda sale como texto verbatim (None → null); las fechas, en ISO.

Uso: python3 -I xlsx-to-jsonl.py <archivo.xlsx> <salida.jsonl>
"""

import datetime
import json
import sys

import openpyxl


def cell(value):
    if value is None:
        return None
    if isinstance(value, (datetime.datetime, datetime.date)):
        return value.isoformat()
    return str(value)


def main(source: str, out_path: str) -> None:
    workbook = openpyxl.load_workbook(source, read_only=True, data_only=True)
    sheet = workbook.worksheets[0]
    count = 0
    with open(out_path, "w", encoding="utf-8") as out:
        for row in sheet.iter_rows(values_only=True):
            out.write(json.dumps([cell(v) for v in row], ensure_ascii=False) + "\n")
            count += 1
    print(f"{count} filas de la hoja «{sheet.title}»")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
