"""Correcciones revisadas a mano sobre el arancel escaneado.

El corrector automático (`ocr_es.py`) sólo arregla letras sueltas contra un
léxico; no entiende una fila pegada a la siguiente («… (internado) 303.04
Electrocardiograma a domicilio. 6») ni un nombre que el cliente pidió cambiar.
Eso vive en `correcciones-arancel.json`, revisado por una persona, y se aplica
DESPUÉS del corrector, en `extract_datasets.py` y con este guion sobre el
dataset ya generado (`python tools/bolivia-datasets/correcciones_arancel.py`).

Reglas:
- La clave es el código estable: corregir el texto nunca cambia el id de un
  procedimiento que ya está en una base viva.
- Nunca toca importes.
- El texto de origen queda en `conceptoOriginal` / `grupoOriginal`, como hace el
  corrector automático, y la fila se marca con `correccionManual`.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

CORRECCIONES = Path(__file__).with_name("correcciones-arancel.json")
DATASET = Path(__file__).resolve().parents[2] / "src/common/seed/data/bolivia/fee-schedule.dataset.json"

# El mismo patrón que `extract_datasets.PATRON_OCR`; se repite para no importar
# el extractor (que carga el léxico entero) desde este guion.
PATRON_OCR = re.compile(r"[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]\d|\d[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]{2,}|[|©®~¢£¥§¤]")


def cargar() -> dict:
    return json.loads(CORRECCIONES.read_text(encoding="utf-8"))


def aplicar(aranceles: dict, correcciones: dict | None = None) -> int:
    """Aplica las correcciones en sitio. Devuelve cuántas filas cambiaron.

    Rompe si una corrección apunta a un código o a un grupo que ya no existe:
    una corrección huérfana es una corrección que dejó de aplicarse en silencio.
    """
    correcciones = correcciones or cargar()
    conceptos: dict[str, str] = correcciones["conceptos"]
    grupos = {(g["especialidad"], g["grupo"]): g["nuevo"] for g in correcciones["grupos"]}
    vistos_c: set[str] = set()
    vistos_g: set[tuple[str, str]] = set()
    cambiadas = 0

    filas = [(r, r["especialidad"], "uma") for r in aranceles["honorariosMedicos"]]
    filas += [(r, "Odontología", "precioUsd") for r in aranceles["arancelOdontologico"]]
    for fila, especialidad, campo_precio in filas:
        cambio = False
        nuevo = conceptos.get(fila["code"])
        if nuevo is not None:
            vistos_c.add(fila["code"])
            if fila["concepto"] != nuevo:
                fila.setdefault("conceptoOriginal", fila["concepto"])
                fila["concepto"] = nuevo
                fila["ocrSospechoso"] = bool(PATRON_OCR.search(nuevo)) or fila[campo_precio] == 0
                cambio = True
        clave = (especialidad, fila.get("grupo"))
        if clave in grupos:
            vistos_g.add(clave)
            if fila["grupo"] != grupos[clave]:
                fila.setdefault("grupoOriginal", fila["grupo"])
                fila["grupo"] = grupos[clave]
                cambio = True
        if cambio:
            fila["correccionManual"] = True
            cambiadas += 1

    # Un grupo ya corregido en una pasada anterior aparece con su nombre nuevo.
    presentes = {(r["especialidad"], r.get("grupo")) for r in aranceles["honorariosMedicos"]}
    huerfanos = [c for c in conceptos if c not in vistos_c]
    huerfanos += [
        f"{e} / {g}" for (e, g), n in grupos.items() if (e, g) not in vistos_g and (e, n) not in presentes
    ]
    if huerfanos:
        raise SystemExit(f"Correcciones que no encuentran su fila: {huerfanos}")
    return cambiadas


def main() -> int:
    cuerpo = json.loads(DATASET.read_text(encoding="utf-8"))
    n = aplicar(cuerpo["datos"])
    with open(DATASET, "w", encoding="utf-8", newline="") as fh:
        fh.write(json.dumps(cuerpo, ensure_ascii=False, indent=2) + "\n")
    print(f"{n} filas corregidas en {DATASET.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
