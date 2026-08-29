#!/usr/bin/env python3
"""Carga como fichas de directorio a los médicos de las redes de las aseguradoras.

## Qué son estas fichas

Alianza y Nacional publican, cada una, la lista de profesionales habilitados en su
red: nombre, especialidad, dirección de consultorio y teléfono. **No traen correo
ni matrícula**, así que estas personas no pueden tener cuenta ni acreditarse — son
fichas de directorio, no altas de usuario. Existen para que la búsqueda de médicos
tenga volumen real mientras se prueban los circuitos: hoy buscar «cardiólogo»
devuelve dos o tres, y con esto devuelve decenas con nombres y direcciones de
Santa Cruz.

## Por qué nacen sin verificar, y qué significa eso

Nacen con `verificationStatusConceptId` en PENDIENTE porque **nadie verificó nada**:
lo único que sabemos es que una aseguradora los listó. En producción eso las deja
fuera de la guía pública, que filtra por verificado. Sólo son visibles donde
`DEV_VERIFICATION_BYPASS=true`, es decir en desarrollo y pruebas — y el arranque
ABORTA si esa variable es `true` con `NODE_ENV=production`. Así «visible sólo para
pruebas internas» no depende de que alguien se acuerde: lo sostiene el arranque.

## Por qué no escribe nada a disco

Mismo motivo que `load_people.py`: son **personas reales**. Un archivo intermedio con
961 nombres, especialidades y direcciones acaba en la máquina de cada quien y en la
historia de git, donde ya no se borra. Esto lee el markdown en el momento y lo que
carga queda sólo en la base a la que apunta.

## Por qué usa la API y no INSERT

El alta respeta el registro atómico CTI de la regla 11 —persona, perfil y perfil
profesional en una sola transacción—, valida cada especialidad contra
`VS_MEDICAL_SPECIALTY` y deriva el código. Reimplementarlo en SQL sería
reimplementarlo mal.

## Uso

    python tools/bolivia-datasets/load_provider_networks.py                 # simulación
    python tools/bolivia-datasets/load_provider_networks.py --yes           # carga real

Sin `--yes` no escribe: cuenta qué haría. Es idempotente por código de profesional,
así que volver a correrlo no duplica.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path

RAIZ_API = Path(__file__).resolve().parents[2]
MARKDOWN_POR_DEFECTO = RAIZ_API.parent / "mantra-core-health-model" / "markdown_convertidos"

sys.path.insert(0, str(Path(__file__).resolve().parent))
from extract_datasets import extraer_redes  # noqa: E402


def normalizar(texto: str) -> str:
    """Sin tildes, sin puntuación, en minúsculas y con los espacios colapsados.

    La puntuación se va porque **la coma decide si dos fichas son la misma
    persona**: Alianza escribe «ABASTO VEGA, ROSEMARY» y Nacional «ABASTO VEGA
    ROSEMARY». Conservándola, la primera versión del cargador creó 215 fichas
    duplicadas de gente real — dos perfiles para una sola doctora, cada uno con
    la mitad de sus especialidades.
    """
    s = unicodedata.normalize("NFD", texto or "")
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^A-Za-z0-9 ]+", " ", s)
    return re.sub(r"\s+", " ", s).strip().lower()


def codigo_de_profesional(nombre: str) -> str:
    """Código estable derivado SÓLO del nombre.

    Deliberadamente **sin la aseguradora**. La primera versión lo prefijaba con
    la red —`RED_ALI_…`, `RED_NAC_…`— y eso creó 215 duplicados: los médicos que
    Alianza y Nacional listan a los dos terminaban con dos fichas, como si fueran
    dos personas. Un profesional es uno aunque lo habiliten cinco aseguradoras;
    lo que cambia por red es su membresía, no su identidad.

    Es también lo que hace idempotente al cargador: el alta rechaza un código
    repetido, así que re-correrlo no duplica a nadie.
    """
    base = re.sub(r"[^A-Z0-9]+", "_", normalizar(nombre).upper()).strip("_")[:44]
    return f"RED_{base}"


class Api:
    """Lo justo para autenticarse y dar de alta. Sin dependencias externas."""

    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.token: str | None = None
        # 300 por minuto es el límite del servidor: 0,25 s deja ~240/min, con
        # margen para que el resto del sistema siga respondiendo durante la carga.
        self.pausa_entre_altas = 0.25
        self.pausa_por_429 = 62.0

    def _peticion(self, metodo: str, ruta: str, cuerpo: dict | None) -> tuple[int, dict]:
        datos = json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None
        peticion = urllib.request.Request(f"{self.base}{ruta}", data=datos, method=metodo)
        peticion.add_header("Content-Type", "application/json")
        if self.token:
            peticion.add_header("Authorization", f"Bearer {self.token}")
        try:
            with urllib.request.urlopen(peticion, timeout=30) as respuesta:
                texto = respuesta.read().decode("utf-8") or "{}"
                return respuesta.status, json.loads(texto)
        except urllib.error.HTTPError as error:
            texto = error.read().decode("utf-8") or "{}"
            try:
                return error.code, json.loads(texto)
            except json.JSONDecodeError:
                return error.code, {"message": texto[:200]}
        except urllib.error.URLError as error:
            return 0, {"message": str(error.reason)}

    def login(self, email: str, password: str) -> None:
        estado, cuerpo = self._peticion(
            "POST", "/iam/auth/login", {"email": email, "password": password}
        )
        if estado != 200 or "accessToken" not in cuerpo:
            raise SystemExit(f"No se pudo autenticar ({estado}): {cuerpo}")
        self.token = cuerpo["accessToken"]

    def get(self, ruta: str) -> tuple[int, dict]:
        return self._peticion("GET", ruta, None)

    def post(self, ruta: str, cuerpo: dict) -> tuple[int, dict]:
        """Se autolimita en vez de pedir que apaguen la protección del servidor.

        El límite es 300 peticiones por minuto y por IP (`ThrottlerModule`), y una
        carga de 961 fichas lo agota en el primer minuto: la primera corrida
        entró 299 y las 662 restantes murieron con 429. En vez de poner
        `RATE_LIMIT_DISABLED=true` —que abre la puerta para todo el servidor
        mientras dure la carga— el cargador espacia sus llamadas y, si aun así
        choca, espera la ventana entera y reintenta una vez.
        """
        time.sleep(self.pausa_entre_altas)
        estado, respuesta = self._peticion("POST", ruta, cuerpo)
        if estado == 429:
            time.sleep(self.pausa_por_429)
            estado, respuesta = self._peticion("POST", ruta, cuerpo)
        return estado, respuesta


def catalogo_de_especialidades(api: Api) -> dict[str, str]:
    """Nombre normalizado → concept id, leído de `VS_MEDICAL_SPECIALTY`.

    Se lee de la API y no se codifica acá: quién es una especialidad lo decide el
    conjunto de valores, no este script.
    """
    estado, cuerpo = api.get("/terminology/value-sets?code=VS_MEDICAL_SPECIALTY")
    if estado != 200:
        raise SystemExit(f"No se pudo leer el conjunto de especialidades ({estado})")
    items = cuerpo.get("items") or cuerpo.get("data") or []
    if not items:
        raise SystemExit("VS_MEDICAL_SPECIALTY no existe en esta base")
    vs_id = items[0]["id"]
    estado, cuerpo = api.get(f"/terminology/value-sets/{vs_id}/$expand?limit=200")
    if estado != 200:
        raise SystemExit(f"No se pudo expandir el conjunto ({estado})")
    return {normalizar(i["display"]): i["conceptId"] for i in cuerpo.get("items", [])}


def cargar_consultorios(api: "Api", profile_id: str | None, ficha: dict) -> int:
    """Registra como afiliaciones los consultorios donde atiende el profesional.

    Un médico que atiende en tres lugares es UNO con tres sedes, no tres fichas.
    El perfil las muestra desde `practitioner_affiliations`, así que sin esto la
    ficha salía sin ningún consultorio y no había forma de ver que tiene más de
    uno — que es justo lo que las redes traen y el registro de procesos pide
    («los horarios en las diferentes clínicas privadas o centros que atiende»).

    La dirección va COMPLETA como nombre de la institución: es lo que la red
    publica, y recortarla al nombre de la clínica perdería la referencia de
    calle que el paciente necesita para llegar.
    """
    if not profile_id:
        return 0
    puestas = 0
    for direccion in ficha["sedes"]:
        estado, _ = api.post(
            f"/profiles/practitioners/{profile_id}/affiliations",
            {
                "organizationName": direccion[:200],
                "roleTitle": "Consultorio de atención",
                "startDate": "2020-01-01",
            },
        )
        if estado in (200, 201):
            puestas += 1
    return puestas


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("--api", default="http://localhost:3000")
    p.add_argument("--fuente", type=Path, default=MARKDOWN_POR_DEFECTO)
    p.add_argument("--admin-email", default="admin@redesa.test")
    p.add_argument("--admin-password", default="S3cret-passw0rd")
    p.add_argument("--yes", action="store_true", help="Sin esto sólo simula.")
    args = p.parse_args()

    if not args.fuente.is_dir():
        print(f"No existe la carpeta de origen: {args.fuente}", file=sys.stderr)
        return 1

    redes = extraer_redes(args.fuente)["redes"]
    total = sum(len(r["profesionales"]) for r in redes)
    print(f"Origen : {args.fuente}")
    print(f"Fichas : {total} profesionales en {len(redes)} redes\n")

    api = Api(args.api)
    api.login(args.admin_email, args.admin_password)
    especialidades = catalogo_de_especialidades(api)
    print(f"Catálogo: {len(especialidades)} especialidades conocidas\n")

    creados = existentes = fallidos = sedes = 0
    sin_especialidad_conocida: set[str] = set()

    # Una ficha por PERSONA, no por fila ni por red: quien está en las dos redes
    # se funde acá y sus especialidades se suman.
    personas: dict[str, dict] = {}
    for red in redes:
        for prof in red["profesionales"]:
            clave = normalizar(prof["nombre"])
            ficha = personas.setdefault(
                clave,
                {"nombre": prof["nombre"], "especialidades": [], "redes": [], "sedes": []},
            )
            ficha["redes"].append(red["aseguradora"])
            for esp in prof["especialidades"]:
                if esp not in ficha["especialidades"]:
                    ficha["especialidades"].append(esp)
            # Los consultorios. Un médico que atiende en tres lugares es UNO con
            # tres sedes, no tres fichas: por eso se acumulan acá y se cargan
            # como afiliaciones, que es donde el perfil las muestra.
            for sede in prof.get("sedes") or []:
                direccion = (sede.get("direccion") or "").strip()
                if direccion and direccion not in ficha["sedes"]:
                    ficha["sedes"].append(direccion)

    en_las_dos = sum(1 for f in personas.values() if len(f["redes"]) > 1)
    print(f"Personas: {len(personas)} distintas ({en_las_dos} habilitadas por las dos redes)\n")

    for ficha in personas.values():
        conceptos = []
        for esp in ficha["especialidades"]:
            cid = especialidades.get(normalizar(esp))
            if cid is None:
                sin_especialidad_conocida.add(esp)
            elif cid not in conceptos:
                conceptos.append(cid)

        cuerpo = {
            "practitionerCode": codigo_de_profesional(ficha["nombre"]),
            "displayName": ficha["nombre"],
            # Sin `licenseNumber` ni `credentialNumber`: la red no los publica y
            # ponerlos inventados afirmaría una credencial que nadie declaró.
            "specialtyConceptIds": conceptos[:3],
            "acceptsNewPatients": False,
            "telehealthAvailable": False,
        }

        if not args.yes:
            creados += 1
            continue

        estado, resp = api.post("/profiles/practitioners", cuerpo)
        if estado in (200, 201):
            creados += 1
            sedes += cargar_consultorios(api, resp.get("profileId"), ficha)
        elif estado == 409:
            existentes += 1
        else:
            fallidos += 1
            if fallidos <= 3:
                print(f"  fallo {estado}: {ficha['nombre']} → {resp.get('message')}")

    print(f"\n{'CARGADOS' if args.yes else 'SE CARGARÍAN'}: {creados}"
          f" · ya existían: {existentes} · fallidos: {fallidos}")
    if args.yes:
        print(f"Consultorios registrados: {sedes}")
    if sin_especialidad_conocida:
        print(f"\nEspecialidades del padrón que NO están en VS_MEDICAL_SPECIALTY "
              f"({len(sin_especialidad_conocida)}):")
        for e in sorted(sin_especialidad_conocida)[:15]:
            print(f"  - {e}")
        print("  La ficha se carga igual, sin esa especialidad. Agregarlas es un "
              "cambio del value set, no de este script.")
    return 0 if fallidos == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
