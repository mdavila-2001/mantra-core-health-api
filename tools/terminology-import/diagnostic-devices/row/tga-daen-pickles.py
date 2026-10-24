"""Convierte los pickles de TGA DAEN del espejo a JSONL sin ejecutar código ajeno.

Los pickles son listas de dicts con strings. El unpickler rechaza toda clase o
función (find_class siempre falla), así que un pickle con algo más que tipos
básicos aborta en vez de ejecutarse. Solo se copian los campos del dispositivo;
la narrativa del evento (`Event description`) no se exporta.

Uso: python3 -I tga-daen-pickles.py <dir_list_of_reports> <salida.jsonl>
"""

import json
import pathlib
import pickle
import sys

FIELDS = (
    "Report number",
    "Report date",
    "Trade name",
    "Sponsor",
    "Manufacturer",
    "ARTG number",
    "GMDN term",
    "Device classification",
    "Model number",
    "Software version",
)


class NoGlobals(pickle.Unpickler):
    def find_class(self, module, name):
        raise pickle.UnpicklingError(f"global prohibido: {module}.{name}")


def main(source_dir: str, out_path: str) -> None:
    files = sorted(pathlib.Path(source_dir).glob("*.pickle"))
    count = 0
    with open(out_path, "w", encoding="utf-8") as out:
        for path in files:
            with open(path, "rb") as handle:
                reports = NoGlobals(handle).load()
            for report in reports:
                row = {field: report.get(field) for field in FIELDS}
                row["_file"] = path.name
                out.write(json.dumps(row, ensure_ascii=False) + "\n")
                count += 1
    print(f"{count} reportes de {len(files)} archivos")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
