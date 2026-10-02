"""Suma la LINAME 2022-2024 al vademécum de la API (`src/common/seed/data/vademecum/`).

El vademécum es el code system `vademecum`: un concepto por ATC nivel 5, contra el
que se receta y contra el que la farmacia ancla su catálogo universal. Tenía 17
medicamentos tipeados a mano para desarrollo, con nombre y formas en inglés. Este
guion, determinista e idempotente:

- agrega la fuente `LINAME_BO` (Ministerio de Salud y Deportes de Bolivia);
- por cada ATC nivel 5 de la LINAME que el vademécum no tiene, crea el concepto
  con el nombre en castellano tal como lo publica la LINAME, sus formas y
  concentraciones (`dose_forms`, `strengths`) y sus presentaciones oficiales con
  código LINAME y uso restringido (`liname_presentations`);
- a los 17 existentes —mismos ids— les pone el nombre oficial de la LINAME (o,
  si no está, el castellano que ya tenían), como designación preferida; les quita la definición en inglés
  escrita por desarrollo (sin fuente) y, si están en la LINAME, toma de ahí sus
  formas y concentraciones.

Única normalización: los acentos graves («sòdica», «Soluciòn»), que el castellano
no usa, pasan a agudos. Los ATC incompletos de la fuente («A03AC**») no son un
código nivel 5 y no entran.

Uso: python3 tools/bolivia-datasets/build_vademecum_liname.py
"""
from __future__ import annotations

import json
import re
import uuid
from collections import Counter, defaultdict
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
LINAME = Path(__file__).with_name("data") / "liname-2022-2024.json"
DATASET = RAIZ / "src" / "common" / "seed" / "data" / "vademecum" / "vademecum.dataset.json"
NS = uuid.uuid5(uuid.NAMESPACE_URL, "https://mantracore.health/fhir/CodeSystem/vademecum#liname")
ES = "1e0b7669-d4d8-5c0f-9544-182a5fe60651"
EN = "9907bae2-1a46-5346-8d92-4d1d5ca3ec7b"
FUENTE_LINAME = {
    "id": str(uuid.uuid5(NS, "source:LINAME_BO")),
    "code": "LINAME_BO",
    "name": "LINAME 2022-2024 — Lista Nacional de Medicamentos Esenciales de Bolivia",
    "owner": "Ministerio de Salud y Deportes del Estado Plurinacional de Bolivia",
    "official_url": "https://www.agemed.gob.bo",
    "license": "Documento público del Estado Plurinacional de Bolivia; se cita la fuente. "
    "Aporta nombre, forma farmacéutica, concentración, código LINAME, ATC y uso restringido; "
    "no aporta indicaciones, dosis ni contraindicaciones.",
}
GRAVES = str.maketrans("àèìòùÀÈÌÒÙ", "áéíóúÁÉÍÓÚ")
NO_ES_CONCENTRACION = re.compile(r"^Según", re.I)


def uid(*partes: str) -> str:
    return str(uuid.uuid5(NS, ":".join(partes)))


def unicos(valores) -> list[str]:
    vistos: list[str] = []
    for v in valores:
        if v and v not in vistos:
            vistos.append(v)
    return vistos


def main() -> None:
    liname = json.loads(LINAME.read_text(encoding="utf-8"))["medicamentos"]
    ds = json.loads(DATASET.read_text(encoding="utf-8"))
    version_id = ds["codeSystemVersion"][0]["id"]

    por_atc: dict[str, list[dict]] = defaultdict(list)
    for m in liname:
        if m["atc"]:
            por_atc[m["atc"]].append({**m, **{k: m[k].translate(GRAVES) for k in ("nombre", "forma", "concentracion")}})

    if not any(s["code"] == FUENTE_LINAME["code"] for s in ds["sources"]):
        ds["sources"].append(FUENTE_LINAME)

    conceptos = {c["code"]: c for c in ds["concepts"]}
    designaciones = {d["id"]: d for d in ds["designations"]}
    propiedades = {p["id"]: p for p in ds["properties"]}

    def propiedad(concept_id: str, atc: str, codigo: str, valor) -> None:
        existente = next((p for p in propiedades.values() if p["concept_id"] == concept_id and p["property_code"] == codigo), None)
        if existente is not None:
            existente["value_json"] = valor
            return
        pid = uid("property", atc, codigo)
        propiedades[pid] = {"id": pid, "concept_id": concept_id, "property_code": codigo, "data_type": "json", "value_json": valor}

    def nombre_liname(atc: str) -> str:
        nombres = Counter(f["nombre"] for f in por_atc[atc])
        return min(nombres, key=lambda n: (-nombres[n], len(n), n))

    # Los 17 de desarrollo: castellano como nombre y designación preferida, sin la
    # definición inventada. Si la LINAME tiene el ATC, manda su nombre oficial
    # (la designación «castellana» de desarrollo de R03AC02 era «Albuterol», el
    # nombre estadounidense; la LINAME dice «Salbutamol»).
    for c in ds["concepts"]:
        if c["code"] in por_atc:
            valor = nombre_liname(c["code"])
            did = uid("designation", c["code"], valor)
            designaciones.setdefault(did, {
                "id": did, "concept_id": c["id"], "language_concept_id": ES,
                "designation_type_concept_id": None, "value": valor, "preferred": True,
            })
            es = designaciones[did]
        else:
            castellanas = [d for d in designaciones.values() if d["concept_id"] == c["id"] and d["language_concept_id"] == ES]
            if not castellanas:
                raise SystemExit(f"El concepto {c['code']} no tiene designación en castellano")
            es = next((d for d in castellanas if d["preferred"]), castellanas[0])
        c["display"] = es["value"]
        c["definition"] = None
        for d in designaciones.values():
            if d["concept_id"] == c["id"] and d["language_concept_id"] in (ES, EN):
                d["preferred"] = d["id"] == es["id"]

    for atc in sorted(por_atc):
        filas = por_atc[atc]
        nombres = Counter(f["nombre"] for f in filas)
        nombre = nombre_liname(atc)
        concepto = conceptos.get(atc)
        if concepto is None:
            concepto = {
                "id": uid("concept", atc),
                "code_system_version_id": version_id,
                "code": atc,
                "display": nombre,
                "definition": None,
                "abstract": False,
                "selectable": True,
            }
            ds["concepts"].append(concepto)
            conceptos[atc] = concepto
            for valor in unicos(nombres):
                did = uid("designation", atc, valor)
                designaciones.setdefault(did, {
                    "id": did, "concept_id": concepto["id"], "language_concept_id": ES,
                    "designation_type_concept_id": None, "value": valor, "preferred": valor == nombre,
                })
        cid = concepto["id"]
        propiedad(cid, atc, "dose_forms", unicos(f["forma"] for f in filas))
        propiedad(cid, atc, "strengths", unicos(f["concentracion"] for f in filas if not NO_ES_CONCENTRACION.match(f["concentracion"])))
        propiedad(cid, atc, "liname_presentations", [
            {"code": f["codigo"], "name": f["nombre"], "form": f["forma"], "strength": f["concentracion"], "restrictedUse": f["usoRestringido"]}
            for f in sorted(filas, key=lambda f: f["codigo"])
        ])

    ds["concepts"].sort(key=lambda c: c["code"])
    ds["designations"] = sorted(designaciones.values(), key=lambda d: (d["concept_id"], d["value"]))
    ds["properties"] = sorted(propiedades.values(), key=lambda p: (p["concept_id"], p["property_code"]))
    DATASET.write_text(json.dumps(ds, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    en_liname = sum(1 for c in ds["concepts"] if c["code"] in por_atc)
    print(f"vademécum: {len(ds['concepts'])} conceptos ({en_liname} con presentaciones LINAME), "
          f"{len(ds['designations'])} designaciones, {len(ds['properties'])} propiedades")


if __name__ == "__main__":
    main()
