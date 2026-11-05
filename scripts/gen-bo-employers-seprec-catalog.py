#!/usr/bin/env python3
"""
Genera `src/common/seed/bo-employers-seprec.catalog.generated.ts` desde los
extractos del directorio de empresas del SEPREC.

## Por qué existe

El propietario pidió (2026-10-26) sembrar en el buscador «Empresa donde trabaja»
del alta de paciente las empresas de un extracto del directorio del Servicio
Plurinacional de Registro de Comercio (SEPREC). `bo-employers.catalog.ts`
documenta que el SEPREC no publica descarga masiva; estos extractos son tablas
parciales del directorio, obtenidas por consulta y con su fecha.

## La fuente

Cada CSV de `tools/bolivia-datasets/data/seprec/` trae las columnas
`Registro, Nombre, Departamento, Municipio, Dirección declarada, fuente,
consultado`. Se versionan tal cual llegaron (con su BOM) y el generador imprime
el sha256 de cada uno en la cabecera del archivo generado.

## Qué se emite

Una entrada por **número de registro** (si dos extractos repiten un registro,
gana el de fecha de consulta más reciente). El `code` del concepto es
`SEPREC_<registro>`: estable, porque el registro del SEPREC no cambia, y no se
deriva del nombre, que sí puede cambiar. El nombre va tal cual lo publica el
registro, sin corregirlo. La dirección declarada **no** se emite: el buscador
no la usa.

El sector no viene en el directorio, así que no se inventa: va
«Sin sector declarado (directorio SEPREC)».

Uso: python3 scripts/gen-bo-employers-seprec-catalog.py
"""
import csv
import hashlib
import json
import re
import sys
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
FUENTES = RAIZ / "tools/bolivia-datasets/data/seprec"
DESTINO = RAIZ / "src/common/seed/bo-employers-seprec.catalog.generated.ts"
SECTOR = "Sin sector declarado (directorio SEPREC)"
COLUMNAS = ["Registro", "Nombre", "Departamento", "Municipio", "Dirección declarada", "fuente", "consultado"]


def leer(ruta: Path) -> list[dict[str, str]]:
    with ruta.open(encoding="utf-8-sig", newline="") as f:
        lector = csv.DictReader(f)
        if lector.fieldnames != COLUMNAS:
            sys.exit(f"{ruta.name}: columnas inesperadas {lector.fieldnames}")
        filas = []
        for numero, fila in enumerate(lector, start=2):
            registro = fila["Registro"].strip()
            nombre = re.sub(r"\s+", " ", fila["Nombre"]).strip()
            if not registro.isdigit() or nombre == "":
                sys.exit(f"{ruta.name}:{numero}: registro o nombre inválido")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fila["consultado"].strip()):
                sys.exit(f"{ruta.name}:{numero}: fecha de consulta inválida")
            filas.append(
                {
                    "registro": registro,
                    "nombre": nombre,
                    "departamento": fila["Departamento"].strip(),
                    "municipio": fila["Municipio"].strip(),
                    "fuente": fila["fuente"].strip(),
                    "consultado": fila["consultado"].strip(),
                }
            )
        return filas


def main() -> None:
    archivos = sorted(FUENTES.glob("*.csv"))
    if not archivos:
        sys.exit(f"No hay CSV en {FUENTES}")
    por_registro: dict[str, dict[str, str]] = {}
    cabecera = []
    for ruta in archivos:
        sha = hashlib.sha256(ruta.read_bytes()).hexdigest()
        cabecera.append(f"//   {ruta.relative_to(RAIZ)} sha256 {sha}")
        for fila in leer(ruta):
            previa = por_registro.get(fila["registro"])
            if previa is None or fila["consultado"] >= previa["consultado"]:
                por_registro[fila["registro"]] = fila

    filas = sorted(por_registro.values(), key=lambda f: (f["nombre"].lower(), f["registro"]))
    def campo(sangria: str, nombre: str, valor: str) -> list[str]:
        """Una propiedad; si no entra en 80 columnas, el valor baja de línea (como Prettier)."""
        linea = f"{sangria}{nombre}: {valor},"
        if len(linea) <= 80:
            return [linea]
        return [f"{sangria}{nombre}:", f"{sangria}  {valor},"]

    q = lambda texto: json.dumps(texto, ensure_ascii=False).replace("'", "\\'").strip('"').join("''")
    lineas = [
        "// GENERADO por scripts/gen-bo-employers-seprec-catalog.py — no editar a mano.",
        "// Fuente: Servicio Plurinacional de Registro de Comercio (SEPREC), directorio parcial de empresas.",
        "// Extractos:",
        *cabecera,
        "import type { BoEmployerSeed } from './bo-employers.catalog';",
        "",
        f"/** Las {len(filas)} empresas de los extractos del directorio del SEPREC. */",
        "export const BO_EMPLOYERS_SEPREC: readonly BoEmployerSeed[] = [",
    ]
    for f in filas:
        lineas += [
            "  {",
            f"    code: {q('SEPREC_' + f['registro'])},",
            f"    name: {q(f['nombre'])},",
            f"    sector: {q(SECTOR)},",
            "    provenance: {",
            f"      registry: {q(f['registro'])},",
            f"      department: {q(f['departamento'])},",
            f"      municipality: {q(f['municipio'])},",
            *campo("      ", "source", q(f["fuente"])),
            f"      retrievedOn: {q(f['consultado'])},",
            "    },",
            "  },",
        ]
    lineas += ["];", ""]
    DESTINO.write_text("\n".join(lineas), encoding="utf-8")
    print(f"{DESTINO.relative_to(RAIZ)}: {len(filas)} empresas de {len(archivos)} extracto(s)")


if __name__ == "__main__":
    main()
