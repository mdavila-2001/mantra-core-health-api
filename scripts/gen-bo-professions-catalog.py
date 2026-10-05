#!/usr/bin/env python3
"""
Genera `src/common/seed/bo-professions.catalog.generated.ts` desde la
Clasificación de Ocupaciones de Bolivia (COB-2023) del INE.

## Por qué existe

El propietario pidió (2026-10-04) que «Otra profesión» del alta del médico deje
de ser texto libre y sea una lista normalizada. Eligió la COB-2023, que es la
clasificación oficial de ocupaciones de Bolivia (CIUO-08 adaptada). Hasta acá el
proyecto sólo tenía 64 ocupaciones provisionales (`bo-occupations.catalog.ts`),
que declaran explícitamente no ser la COB.

## La fuente

- Página oficial: https://www.ine.gob.bo/index.php/publicaciones/clasificacion-de-ocupaciones-de-bolivia-cob-2023/
- Archivo: https://nimbus.ine.gob.bo/index.php/s/2fNzJdmqaY9a2me/download
  (PDF, 5 683 567 bytes, sha256 c80698ddaaaef7ea1906373c784e9fd353fb84e114f811197c50619754d33914),
  descargado el 2026-10-04.

El PDF no se versiona (5,7 MB): se pasa por argumento.

## Qué se extrae

La «Estructura» de la clasificación (páginas 27 a 54 del PDF, índices 26–53),
que es una tabla de seis columnas: gran grupo, subgrupo principal, subgrupo,
grupo primario, ocupación y descripción. Se lee con `extract_tables()` de
pdfplumber: cada fila trae un único código en su columna, así que el nivel sale
de la longitud del código y no hay que adivinar nada. Sobre la extracción
completa: 10 grandes grupos, 44 subgrupos principales, 131 subgrupos, 449
grupos primarios y 622 ocupaciones, sin filas anómalas ni ocupaciones huérfanas.

Se emiten sólo las ocupaciones (código de 5 dígitos) de los grandes grupos
**2 (profesionales científicos e intelectuales)** y **3 (técnicos y
profesionales de nivel medio)**: son las que corresponden a una carrera, que es
lo que «Otra profesión» pregunta. Los nombres van tal cual los publica el INE
(en plural); no se corrigen ni se singularizan.

Uso: python3 scripts/gen-bo-professions-catalog.py <ruta al COB-2023.pdf>
Requiere: pdfplumber.
"""
import hashlib
import json
import re
import sys
from pathlib import Path

import pdfplumber

SHA256_ESPERADO = "c80698ddaaaef7ea1906373c784e9fd353fb84e114f811197c50619754d33914"
PAGINAS_ESTRUCTURA = range(26, 54)
GRANDES_GRUPOS = ("2", "3")
DESTINO = Path(__file__).resolve().parent.parent / "src/common/seed/bo-professions.catalog.generated.ts"


def leer_estructura(pdf_path: Path) -> dict[str, str]:
    codigos: dict[str, str] = {}
    with pdfplumber.open(pdf_path) as pdf:
        for indice in PAGINAS_ESTRUCTURA:
            for tabla in pdf.pages[indice].extract_tables():
                for fila in tabla:
                    if not fila or fila[0] == "NARG OPURG":
                        continue
                    celdas = [c.strip() for c in fila[:5] if c and c.strip()]
                    if len(celdas) != 1 or not re.fullmatch(r"\d{1,5}", celdas[0]):
                        raise SystemExit(f"Fila inesperada en la página {indice + 1}: {fila}")
                    descripcion = re.sub(r"\s+", " ", (fila[5] or "").replace("Continúa...", "")).strip()
                    codigos.setdefault(celdas[0], descripcion)
    return codigos


def main() -> None:
    pdf_path = Path(sys.argv[1])
    digest = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    if digest != SHA256_ESPERADO:
        raise SystemExit(f"El PDF no es el esperado: sha256 {digest}")

    codigos = leer_estructura(pdf_path)
    ocupaciones = sorted(c for c in codigos if len(c) == 5 and c[0] in GRANDES_GRUPOS)
    huerfanas = [c for c in ocupaciones if c[:4] not in codigos]
    if huerfanas:
        raise SystemExit(f"Ocupaciones sin grupo primario: {huerfanas}")

    filas = [
        "  { code: %s, name: %s, majorGroup: %s, subMajorGroup: %s },"
        % (
            json.dumps(c),
            json.dumps(codigos[c], ensure_ascii=False),
            json.dumps(codigos[c[0]], ensure_ascii=False),
            json.dumps(codigos[c[:2]], ensure_ascii=False),
        )
        for c in ocupaciones
    ]
    DESTINO.write_text(
        "// GENERADO por scripts/gen-bo-professions-catalog.py — no editar a mano.\n"
        "// Fuente: INE, Clasificación de Ocupaciones de Bolivia (COB-2023),\n"
        f"// sha256 {SHA256_ESPERADO}, descargado el 2026-10-04.\n"
        "import type { BoProfessionSeed } from './bo-professions.catalog';\n\n"
        f"/** Las {len(ocupaciones)} ocupaciones de los grandes grupos 2 y 3 de la COB-2023. */\n"
        "export const BO_PROFESSIONS: readonly BoProfessionSeed[] = [\n"
        + "\n".join(filas)
        + "\n];\n",
        encoding="utf-8",
    )
    print(f"{len(ocupaciones)} profesiones → {DESTINO}")


if __name__ == "__main__":
    main()
