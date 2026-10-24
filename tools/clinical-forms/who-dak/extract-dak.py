#!/usr/bin/env python3
"""Congela en `dak-snapshot.json` los elementos de datos de los Digital
Adaptation Kits (DAK) de la OMS que usan las fichas.

    git clone --depth 1 https://github.com/WorldHealthOrganization/smart-dak-pnc /tmp/who/smart-dak-pnc
    ... (smart-fp, smart-hiv, smart-sti, smart-anc)
    python3 -I tools/clinical-forms/who-dak/extract-dak.py /tmp/who            # escribe
    python3 -I tools/clinical-forms/who-dak/extract-dak.py /tmp/who --list PNC # lista preguntas

Lee el diccionario de datos (hoja por actividad) y arma cada pregunta de
elección («Select one» / «Select all that apply») con sus opciones, que son
las filas «Input Option» que la siguen. Guarda el texto inglés tal cual: la
traducción la hace la ficha, marcada como propia. No guarda códigos SNOMED,
LOINC ni ICD de las columnas de mapeo.
"""
import json
import subprocess
import sys
from pathlib import Path

import openpyxl

AQUI = Path(__file__).resolve().parent

DAKS = {
    "PNC": {
        "repo": "smart-dak-pnc",
        "file": "input/dictionary/PNC DAK_core data dictionary.xlsx",
        "title": "Digital adaptation kit for postnatal care: operational requirements for implementing WHO recommendations in digital systems",
        "cols": {"id": 1, "label": 2, "desc": 3, "multi": 4, "type": 5, "input": 6},
    },
    "HIV": {
        "repo": "smart-hiv",
        "file": "input/l2/HIV_DAK_2023-Web_Annex_A.Data_dictionary_231117_CLEAN.xlsx",
        "title": "WHO Digital Adaptation Kit for HIV (2023), Web Annex A: core data dictionary",
        "cols": {"id": 1, "label": 2, "desc": 3, "multi": 4, "type": 5, "input": 6},
    },
    "ANC": {
        "repo": "smart-anc",
        "file": "input/l2/WHO-ANC.xlsx",
        "title": "WHO Digital Adaptation Kit for antenatal care: data dictionary",
        "cols": None,  # se detectan por encabezado
    },
    "FP": {
        "repo": "smart-fp",
        "file": "input/datadictionary/WHO-DD.xlsx",
        "title": "WHO Digital Adaptation Kit for family planning and STIs: data dictionary",
        "sheets": ["New DD (Stacked)"],
        "cols": {"id": 1, "label": 2, "desc": 3, "multi": 4, "type": 5, "input": 6},
    },
}

# Los elementos que usan las fichas, por DAK. Se listan con --list.
USADOS = json.loads((AQUI / "usados.json").read_text(encoding="utf-8"))


def limpio(v):
    return None if v is None else " ".join(str(v).split())


def columnas(encabezado):
    """Detecta las columnas por el texto del encabezado (DAK de ANC)."""
    def buscar(*claves):
        for k, h in enumerate(encabezado):
            h = (limpio(h) or "").lower()
            if all(c in h for c in claves):
                return k
        raise ValueError(f"sin columna {claves}: {encabezado}")
    return {
        "id": buscar("data element id"),
        "label": buscar("data element label"),
        "desc": buscar("description"),
        "multi": buscar("multiple choice"),
        "type": buscar("data type"),
        "input": buscar("input options"),
    }


def preguntas(ruta, dak):
    wb = openpyxl.load_workbook(ruta, read_only=True, data_only=True)
    hojas = dak.get("sheets") or [ws.title for ws in wb.worksheets]
    out = []
    for nombre in hojas:
        ws = wb[nombre]
        filas = list(ws.iter_rows(values_only=True))
        if not filas:
            continue
        cols = dak["cols"]
        if cols is None:
            try:
                fila_enc = next(
                    k for k, f in enumerate(filas[:3])
                    if any("data element id" in (limpio(c) or "").lower() for c in f)
                )
            except StopIteration:
                continue
            cols = columnas(filas[fila_enc])
            filas = filas[fila_enc + 1:]
        actual = None
        for f in filas:
            g = lambda k: limpio(f[cols[k]]) if cols[k] < len(f) else None
            multi = (g("multi") or "").lower()
            tipo = (g("type") or "").lower()
            if multi in ("select one", "select all that apply") or (
                tipo == "coding" and multi == ""
            ):
                actual = {
                    "sheet": nombre,
                    "id": g("id"),
                    "label": g("label"),
                    "description": g("desc"),
                    "multiple": multi == "select all that apply",
                    "options": [],
                }
                out.append(actual)
            elif multi == "input option" and actual is not None:
                actual["options"].append(
                    {"id": g("id"), "label": g("label"), "description": g("desc")}
                )
            elif multi not in ("input option",) and tipo not in ("codes",):
                if tipo not in ("string",) or actual is None:
                    actual = None
    return out


def commit(repo):
    return subprocess.run(
        ["git", "-C", str(repo), "log", "-1", "--format=%H %cI"],
        capture_output=True, text=True, check=True,
    ).stdout.strip()


def main():
    raiz = Path(sys.argv[1])
    if "--list" in sys.argv:
        clave = sys.argv[sys.argv.index("--list") + 1]
        dak = DAKS[clave]
        for p in preguntas(raiz / dak["repo"] / dak["file"], dak):
            ops = " | ".join(o["label"] or "" for o in p["options"])
            print(f'{p["id"]}\t{p["sheet"][:22]}\t{"M" if p["multiple"] else "1"}\t{p["label"]}\t{ops[:300]}')
        return
    salida = {}
    for clave, ids in USADOS.items():
        dak = DAKS[clave]
        repo = raiz / dak["repo"]
        todas = {p["id"]: p for p in preguntas(repo / dak["file"], dak)}
        faltan = [i for i in ids if i not in todas]
        if faltan:
            raise SystemExit(f"{clave}: no se encontraron {faltan}")
        salida[clave] = {
            "title": dak["title"],
            "repository": f"https://github.com/WorldHealthOrganization/{dak['repo']}",
            "file": dak["file"],
            "commit": commit(repo),
            "elements": {i: todas[i] for i in ids},
        }
    (AQUI / "dak-snapshot.json").write_text(
        json.dumps(salida, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print({k: len(v["elements"]) for k, v in salida.items()})


if __name__ == "__main__":
    main()
