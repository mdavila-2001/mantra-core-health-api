"""Laboratorio e imagenología del Arancel FONASA 2026 (Chile, Modalidad Libre Elección) → JSON versionado.

Bolivia no publica un arancel oficial de estudios de imagen: el del Colegio Médico
de Santa Cruz trae el HONORARIO del médico en UMA, no el precio del estudio, e
INLASA es un laboratorio. FONASA (Fondo Nacional de Salud, Ministerio de Salud de
Chile) sí publica el valor de cada estudio —radiología, tomografía, ecografía,
resonancia— y de cada análisis de laboratorio, y es la referencia oficial más
cercana con dato. Se toman sus Grupos 03 «Laboratorio» (para los análisis que el
arancel de INLASA no trae) y 04 «Imagenología» verbatim, en pesos chilenos; la conversión a bolivianos la hace
`tools/terminology-import/lib/glossary-es/fonasa.mjs`, con los tipos de cambio
oficiales y su fecha, para que el dato de origen no se mezcle con la cuenta.

Qué columna: «NIVEL 1 · TOTAL», el valor de la prestación en el nivel base (los
niveles 2 y 3 son el mismo estudio con un recargo por la categoría del prestador;
«BENEF» es la parte que paga FONASA, no el precio). Las prestaciones que el
arancel publica con un solo valor (resonancias, elastografía…) traen ese.

Nombres en varias líneas: el PDF no los distingue de los subtítulos («CUELLO»,
«TORAX») por fuente ni sangría, sí por la distancia vertical: una continuación
queda pegada a la línea anterior (≈ −2 pt), un subtítulo a 11 pt.

Uso (requiere `pip install pdfplumber`):
  curl -sSL https://redsalud.ssmso.cl/wp-content/uploads/2026/05/1-Libro-Arancel-MLE-2026.pdf -o /tmp/mle.pdf
  python3 tools/bolivia-datasets/extract_fonasa.py /tmp/mle.pdf

fonasa.gob.cl responde 403 a clientes que no son navegador; la copia del Servicio
de Salud Metropolitano Sur Oriente (organismo público chileno) es el mismo libro.
El SHA-256 del PDF leído queda en la salida.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

import pdfplumber

DATOS = Path(__file__).with_name("data")
# Grupo del arancel → (nombre del archivo, mínimo de prestaciones esperado).
GRUPOS = {"03": ("laboratorio", 300), "04": ("imagenologia", 140)}
FUENTE = {
    "nombre": "FONASA — Arancel de Prestaciones de Salud 2026, Modalidad Libre Elección",
    "organismo": "Fondo Nacional de Salud, Ministerio de Salud de Chile",
    "url": "https://www.fonasa.gob.cl/wp-content/uploads/sites/3/2026/03/1-Libro-Arancel-MLE-2026.pdf",
    "copiaLeida": "https://redsalud.ssmso.cl/wp-content/uploads/2026/05/1-Libro-Arancel-MLE-2026.pdf",
    "vigencia": "2026-03-16",
    "moneda": "CLP",
    "columna": "NIVEL 1 · TOTAL",
    "licencia": "Documento público del Estado de Chile (FONASA); se cita la fuente.",
}
FILA_DE = lambda grupo: re.compile(rf"^({grupo} \d{{2}} \d{{3}})\s+(.*?)((?:\s+\d{{1,3}}(?:\.\d{{3}})*)+)$")
SECCION = re.compile(r"^([IVX]+)\.-\s*(.*)$")
ENCABEZADOS = re.compile(r"^(NIVEL 1|CÓDIGO|PRESTC)")
SEPARACION_CONTINUACION = 3.0  # pt; la de un subtítulo es ~11


def lineas_del_grupo(pdf, grupo: str) -> list[dict]:
    salida, dentro = [], False
    for pagina in pdf.pages:
        anterior = None
        for linea in pagina.extract_text_lines():
            texto = linea["text"].strip()
            if texto.startswith(f"GRUPO : {grupo}"):
                dentro = True
            elif dentro and texto.startswith("GRUPO :"):
                return salida
            elif dentro:
                pegada = anterior is not None and linea["top"] - anterior["bottom"] < SEPARACION_CONTINUACION
                salida.append({"texto": texto, "pegada": pegada})
            anterior = linea
    return salida


def filas(lineas: list[dict], grupo: str) -> list[dict]:
    fila = FILA_DE(grupo)
    salida, seccion, ultima = [], None, None
    for l in lineas:
        texto = l["texto"]
        m = fila.match(texto)
        if m:
            numeros = [int(x.replace(".", "")) for x in m.group(3).split()]
            nombre = m.group(2).strip()
            # «… SIMPLES PREVIAS, 3 43.520 …»: el «3» es del nombre, no un importe.
            while len(numeros) not in (2, 6) and len(numeros) > 2:
                nombre = f"{nombre} {numeros.pop(0)}"
            ultima = {
                "codigo": m.group(1).replace(" ", "-"),
                "nombre": nombre,
                "seccion": seccion,
                "valorClp": numeros[0],
                "valoresPublicados": numeros,
            }
            salida.append(ultima)
            continue
        if ENCABEZADOS.match(texto):
            continue
        s = SECCION.match(texto)
        if s:
            seccion = s.group(2).split("(")[0].strip().rstrip(".")
            ultima = None
            continue
        if l["pegada"] and ultima is not None:
            ultima["nombre"] = f"{ultima['nombre']} {texto}"
        else:
            ultima = None  # subtítulo o nota: corta la continuación
    return salida


def main() -> None:
    pdf_path = Path(sys.argv[1])
    sha = hashlib.sha256(pdf_path.read_bytes()).hexdigest()
    DATOS.mkdir(exist_ok=True)
    with pdfplumber.open(pdf_path) as pdf:
        for grupo, (nombre, minimo) in GRUPOS.items():
            prestaciones = filas(lineas_del_grupo(pdf, grupo), grupo)
            if len(prestaciones) < minimo:
                raise SystemExit(f"El Grupo {grupo} trajo {len(prestaciones)} prestaciones: ¿cambió el libro? Se esperaban ≥ {minimo}.")
            codigos = [p["codigo"] for p in prestaciones]
            if len(set(codigos)) != len(codigos):
                raise SystemExit(f"Códigos repetidos en el Grupo {grupo}.")
            salida = DATOS / f"fonasa-mle-2026-{nombre}.json"
            salida.write_text(
                json.dumps(
                    {"fuente": {**FUENTE, "grupo": grupo, "sha256": sha}, "prestaciones": prestaciones},
                    ensure_ascii=False,
                    indent=2,
                )
                + "\n",
                encoding="utf-8",
            )
            por_seccion: dict[str, int] = {}
            for p in prestaciones:
                por_seccion[p["seccion"]] = por_seccion.get(p["seccion"], 0) + 1
            print(f"Grupo {grupo}: {len(prestaciones)} prestaciones → {salida.name}")
            for s, n in por_seccion.items():
                print(f"  {n:4} {s}")


if __name__ == "__main__":
    main()
