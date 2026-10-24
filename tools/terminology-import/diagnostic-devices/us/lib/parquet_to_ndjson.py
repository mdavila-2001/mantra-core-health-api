"""Convierte un .parquet a NDJSON (una fila por línea). Fechas → `AAAA-MM-DD`.

Uso: python3 -I parquet_to_ndjson.py <entrada.parquet> <columnas|*> <salida.ndjson>

`columnas` es una lista separada por comas (o `*` para todas). Requiere pandas y pyarrow.
"""

import json
import sys

import pandas as pd


def cell(v):
    if v is None:
        return None
    if isinstance(v, pd.Timestamp):
        return None if pd.isna(v) else v.strftime("%Y-%m-%d")
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(v, str):
        return v if v.strip() else None
    return v.item() if hasattr(v, "item") else v


def main(src, cols, dst):
    frame = pd.read_parquet(src)
    if cols != "*":
        frame = frame[cols.split(",")]
    n = 0
    with open(dst, "w", encoding="utf-8") as out:
        for row in frame.to_dict(orient="records"):
            out.write(json.dumps({k: cell(v) for k, v in row.items()}, ensure_ascii=False))
            out.write("\n")
            n += 1
    print(f"{n} filas → {dst}")


if __name__ == "__main__":
    main(*sys.argv[1:4])
