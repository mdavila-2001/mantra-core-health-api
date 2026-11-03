"""Convierte un data frame de un archivo .rda (paquete R `fdadata`) a NDJSON.

Uso: python3 -I rda_to_ndjson.py <entrada.rda> <objeto> <salida.ndjson>

Las columnas `date_*` vienen como días desde 1970-01-01 (clase R `Date`) y se
escriben como `AAAA-MM-DD`; los NA quedan como `null`. No interpreta ni
corrige ningún otro valor. Requiere `pip install rdata` (no lo usa la API).
"""

import datetime
import json
import math
import sys

import rdata

EPOCH = datetime.date(1970, 1, 1)


def cell(name, value):
    if value is None:
        return None
    try:
        if value != value:  # NaN / NA
            return None
    except (TypeError, ValueError):
        pass
    if name.startswith("date_") and isinstance(value, float):
        if math.isinf(value):
            return None
        return (EPOCH + datetime.timedelta(days=int(value))).isoformat()
    if isinstance(value, float) and value.is_integer():
        return value
    return value if isinstance(value, (int, float, bool)) else str(value)


def main(src, obj, dst):
    frame = rdata.read_rda(src)[obj]
    cols = list(frame.columns)
    n = 0
    with open(dst, "w", encoding="utf-8") as out:
        for row in frame.itertuples(index=False, name=None):
            out.write(json.dumps({c: cell(c, v) for c, v in zip(cols, row)}, ensure_ascii=False))
            out.write("\n")
            n += 1
    print(f"{obj}: {n} filas → {dst}")


if __name__ == "__main__":
    import warnings

    warnings.simplefilter("ignore")
    main(*sys.argv[1:4])
