"""LINAME 2022-2024 (Lista Nacional de Medicamentos Esenciales de Bolivia) → JSON versionado.

La LINAME la publica el Ministerio de Salud y Deportes (Dirección de Medicamentos y
Tecnología en Salud / AGEMED) como PDF. Sus tablas están en páginas apaisadas: el
texto viene ROTADO 90° (`upright = False`), así que `extract_text` lo devuelve al
revés. Se reconstruye por coordenadas: cada renglón de la tabla es una columna x
de la página, y dentro del renglón se lee de abajo hacia arriba.

Las columnas están en posiciones fijas en todas las páginas (medidas sobre el PDF):
código (letra + grupo + orden), medicamento, forma farmacéutica, concentración,
clasificación ATC y uso restringido («R»). Un nombre partido en dos renglones se
une al renglón del código más cercano.

El PDF lista cada medicamento dos veces: por orden alfabético (págs. 22-62) y
por grupo ATC (desde la 63), cuyas páginas intercalan títulos de grupo
(«ANTIANÉMICOS») que se pegan al renglón vecino. Se deja una fila por código, la
del listado ALFABÉTICO; la del listado por grupo sólo si el código falta en el
alfabético. Nada se corrige: un ATC que la fuente trae mal escrito («104BA»,
«B2BB01») queda tal cual en `atcPublicado` y `atc` sale null.

La columna «A.T.Q.» no siempre es el ATC de la OMS: en cinco principios activos
la LINAME numera la presentación siguiente dentro del mismo subgrupo
(amoxicilina J01CA04 → 05 → 06 → 07; en la OMS J01CA05 es epicilina). Cruzando
cada par (ATC, principio activo) contra los registros sanitarios de CIMA
(España) e INVIMA (Colombia), que traen el ATC de cada producto, el código
correcto queda confirmado; la tabla `CORRECCIONES_ATC` lo aplica, guarda el
publicado en `atcPublicado` y marca `atcCorregido`. Fuera de esos cinco, el ATC
pasa tal cual.

Uso (requiere `pip install pdfplumber`):
  python3 tools/bolivia-datasets/extract_liname.py <LINAME_2022_2024.pdf>
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import unicodedata
from collections import defaultdict
from pathlib import Path

import pdfplumber

PRIMERA_PAGINA_POR_GRUPO = 63  # «SEGÚN CLASIFICACIÓN ANÁTOMO TERAPÉUTICA QUÍMICA»
SALIDA = Path(__file__).with_name("data") / "liname-2022-2024.json"
FUENTE = {
    "nombre": "LINAME 2022-2024 — Lista Nacional de Medicamentos Esenciales",
    "organismo": "Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia",
    "url": "https://www.agemed.gob.bo",
    "licencia": "Documento público del Estado Plurinacional de Bolivia; se cita la fuente.",
}
# (columna, desde, hasta) en coordenada de lectura = -bottom del carácter.
COLUMNAS = (
    ("letra", -999, -400), ("grupo", -400, -380), ("orden", -380, -360), ("nombre", -360, -255),
    ("forma", -255, -170), ("concentracion", -170, -100), ("atc", -100, -70), ("restringido", -70, 999),
)
# (nombre normalizado, ATC publicado) → ATC de la OMS, confirmado contra CIMA e INVIMA.
CORRECCIONES_ATC = {
    ("amoxicilina", "J01CA05"): "J01CA04",
    ("amoxicilina", "J01CA06"): "J01CA04",
    ("amoxicilina", "J01CA07"): "J01CA04",
    ("amoxicilina + inhibidor betalactamasa", "J01CR03"): "J01CR02",  # J01CR03 = ticarcilina + inhibidor
    ("bencilpenicilina benzatinica", "J01CE09"): "J01CE08",  # J01CE09 = bencilpenicilina procaínica
    ("bencilpenicilina benzatinica", "J01CE10"): "J01CE08",  # J01CE10 = fenoximetilpenicilina benzatina
    ("bencilpenicilina procainica", "J01CE10"): "J01CE09",
    ("temozolomida", "L01AX04"): "L01AX03",  # L01AX04 = dacarbazina
    ("temozolomida", "L01AX05"): "L01AX03",
}
ENCABEZADO = re.compile(r"A\.T\.Q\.|MEDICAMENTO|CÓDIGO|CLASIFIC|CONCENTRACIÓN|FORMA FARMAC|RES\.|USO")
ATC_VALIDO = re.compile(r"^[A-Z]\d{2}[A-Z]{2}\d{2}$")
ATC_PUBLICADO = re.compile(r"^[A-Z]\d{2}[A-Z]{0,2}\d{0,2}(\*+)?$")


def normalizado(nombre: str) -> str:
    """Minúsculas, sin tildes y sin el paréntesis aclaratorio: la clave de `CORRECCIONES_ATC`."""
    plano = "".join(c for c in unicodedata.normalize("NFKD", nombre.lower()) if not unicodedata.combining(c))
    return plano.split("(")[0].strip()


def columna(pos: float) -> str:
    return next(n for n, a, b in COLUMNAS if a <= pos < b)


def texto(chars: list[dict]) -> str:
    salida, anterior = "", None
    for c in chars:
        pos = -c["bottom"]
        if anterior is not None and pos - anterior > c["size"] * 0.35:
            salida += " "
        salida += c["text"]
        anterior = pos + c.get("width", 0)
    return salida.strip()


def filas_de_pagina(pagina, numero: int) -> list[dict]:
    renglones: dict[int, list[dict]] = defaultdict(list)
    for c in pagina.chars:
        if not c["upright"]:
            renglones[round(c["x0"] / 2)].append(c)
    leidos = {}
    for k, chars in renglones.items():
        campos: dict[str, list[dict]] = defaultdict(list)
        for c in sorted(chars, key=lambda c: -c["bottom"]):
            campos[columna(-c["bottom"])].append(c)
        leidos[k] = {n: texto(v) for n, v in campos.items()}
    codigos = [
        k for k, v in leidos.items()
        if re.fullmatch(r"[A-Z]", v.get("letra", "")) and re.fullmatch(r"\d{2}", v.get("grupo", ""))
        and re.fullmatch(r"\d{2}", v.get("orden", ""))
    ]
    if not codigos:
        return []
    grupos = {k: [k] for k in codigos}
    for k, v in leidos.items():
        if k in grupos or not any(v.get(n) for n in ("nombre", "forma", "concentracion", "atc")):
            continue
        if ENCABEZADO.search(" ".join(v.values())):
            continue  # el encabezado de la tabla queda pegado a la primera fila
        cercano = min(codigos, key=lambda c: abs(c - k))
        if abs(cercano - k) <= 5:
            grupos[cercano].append(k)
    filas = []
    for k, ks in grupos.items():
        ks.sort()
        campo = {
            n: " ".join(leidos[x][n] for x in ks if leidos[x].get(n)).strip()
            for n in ("nombre", "forma", "concentracion", "atc", "restringido")
        }
        for n in ("nombre", "forma", "concentracion"):
            campo[n] = re.sub(r"(\w)- (\w)", r"\1\2", campo[n]).replace("  ", " ")
        v = leidos[k]
        filas.append({"codigo": f"{v['letra']}-{v['grupo']}-{v['orden']}", "pagina": numero, **campo})
    return filas


def valida(f: dict) -> bool:
    return bool(ATC_PUBLICADO.match(f["atc"].replace(" ", "").rstrip("."))) and f["restringido"] in ("", "R")


def main() -> None:
    pdf_path = Path(sys.argv[1])
    filas: list[dict] = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, pagina in enumerate(pdf.pages):
            filas.extend(filas_de_pagina(pagina, i + 1))
    por_codigo: dict[str, list[dict]] = defaultdict(list)
    for f in filas:
        por_codigo[f["codigo"]].append(f)
    medicamentos = []
    for codigo in sorted(por_codigo):
        alfabetico = [f for f in por_codigo[codigo] if f["pagina"] < PRIMERA_PAGINA_POR_GRUPO]
        candidatas = alfabetico or por_codigo[codigo]
        f = min(candidatas, key=lambda f: (not valida(f), f["pagina"]))
        publicado = f["atc"].replace(" ", "").rstrip(".")
        corregido = CORRECCIONES_ATC.get((normalizado(f["nombre"]), publicado))
        atc = corregido or (publicado if ATC_VALIDO.match(publicado) else None)
        medicamentos.append({
            "codigo": codigo,
            "nombre": f["nombre"],
            "forma": f["forma"],
            "concentracion": f["concentracion"],
            "atcPublicado": publicado,
            "atc": atc,
            "atcCorregido": corregido is not None,
            "usoRestringido": f["restringido"] == "R",
        })
    if len(medicamentos) < 700:
        raise SystemExit(f"La LINAME trajo {len(medicamentos)} medicamentos: se esperaban ~780.")
    SALIDA.parent.mkdir(exist_ok=True)
    SALIDA.write_text(
        json.dumps({"fuente": {**FUENTE, "sha256": hashlib.sha256(pdf_path.read_bytes()).hexdigest()},
                    "medicamentos": medicamentos}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    con_atc = sum(1 for m in medicamentos if m["atc"])
    print(f"{sum(m['atcCorregido'] for m in medicamentos)} ATC corregidos por CORRECCIONES_ATC")
    print(f"{len(medicamentos)} medicamentos ({con_atc} con ATC nivel 5, "
          f"{len({m['atc'] for m in medicamentos if m['atc']})} ATC distintos) → {SALIDA}")


if __name__ == "__main__":
    main()
