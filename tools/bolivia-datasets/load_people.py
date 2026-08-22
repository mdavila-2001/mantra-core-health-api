#!/usr/bin/env python3
"""Da de alta en la plataforma a los médicos y pacientes del padrón del stakeholder.

## Por qué es un script y no un seed

Los otros catálogos de Bolivia —aranceles, establecimientos, aseguradoras— son
datos institucionales y viven como seeds versionados en `src/common/seed/`. Éste
no puede: `USUARIO_MEDICOS_1.md` y `USUARIO_PACIENTES_1.md` traen **cédula, fecha
de nacimiento, celular, correo y domicilio de personas reales**.

Un seed deja esos datos en el repositorio, y de ahí pasan a la máquina de cada
integrante del equipo y a cada base que alguien levante. Una fila en una tabla se
borra; un archivo en la historia de git, no. Así que esto **lee el markdown en el
momento y no escribe nada a disco**: lo que carga queda sólo en la base a la que
apunta.

## Por qué usa el alta de la API y no INSERT

Porque el alta hace catorce cosas que un INSERT no: hashea la contraseña con
argon2 y sus parámetros, crea persona, perfil, identificador y credencial en una
sola transacción, respeta el registro atómico CTI de la regla 11, y deriva el
código de paciente. Reimplementar eso en SQL sería reimplementarlo mal.

## Uso

    python tools/bolivia-datasets/load_people.py                      # simulación
    python tools/bolivia-datasets/load_people.py --password '…' --yes # alta real

Sin `--yes` no hace nada: sólo cuenta qué haría y qué filas del padrón no
alcanzan para dar de alta. Sin `--password` tampoco.

La contraseña es **una sola para todas las cuentas**, así que elegila pensando en
que estas son personas reales: alcanza con que sea fácil de repartir al equipo,
no con que sea fácil de adivinar. Un `12345678` sobre un padrón con cédulas y
domicilios convierte cualquier exposición accidental de la base —un túnel abierto
para que alguien pruebe, por ejemplo— en una filtración de datos de terceros.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.request
from pathlib import Path
from typing import Iterable, Iterator

RAIZ_API = Path(__file__).resolve().parents[2]
FUENTE_POR_DEFECTO = RAIZ_API.parent / "markdown_convertidos"


# --------------------------------------------------------------------------- #
#  Lectura de las tablas markdown
# --------------------------------------------------------------------------- #

def celdas(linea: str) -> list[str]:
    """Parte una fila markdown en celdas ya recortadas."""
    if not linea.strip().startswith("|"):
        return []
    return [c.strip() for c in linea.strip().strip("|").split("|")]


def es_separador(fila: list[str]) -> bool:
    """Reconoce la fila `| --- | --- |` que separa cabecera de cuerpo."""
    return bool(fila) and all(re.fullmatch(r":?-{2,}:?", c) for c in fila if c)


def filas_de_tabla(lineas: Iterable[str]) -> Iterator[tuple[list[str], list[str]]]:
    """Emite `(cabecera, fila)` por cada fila de dato de cada tabla del archivo."""
    cabecera: list[str] = []
    anterior: list[str] = []
    for linea in lineas:
        fila = celdas(linea)
        if not fila:
            anterior = []
            continue
        if es_separador(fila):
            cabecera = anterior
            continue
        if cabecera:
            yield cabecera, fila
        anterior = fila


def normalizar(texto: str) -> str:
    """Minúsculas sin tildes ni signos, para comparar títulos de columna."""
    plano = unicodedata.normalize("NFKD", texto)
    plano = "".join(c for c in plano if not unicodedata.combining(c))
    return re.sub(r"[^a-z0-9]+", " ", plano.lower()).strip()


def columna(cabecera: list[str], fila: list[str], *nombres: str) -> str:
    """Devuelve la celda de la primera columna cuyo título case con `nombres`."""
    for nombre in nombres:
        objetivo = normalizar(nombre)
        for i, titulo in enumerate(cabecera):
            if normalizar(titulo) == objetivo and i < len(fila):
                return fila[i].strip()
    return ""


def opcional(valor: str) -> str | None:
    return valor.strip() or None


def fecha(valor: str) -> str | None:
    """Sólo fechas ISO completas: el alta valida `IsISO8601` y rechaza el resto."""
    v = valor.strip()
    return v if re.fullmatch(r"\d{4}-\d{2}-\d{2}", v) else None


def telefono(valor: str) -> str | None:
    """El primer número que parezca un celular boliviano."""
    for candidato in re.split(r"[\s/,;]+", valor):
        if re.fullmatch(r"\d{7,10}", candidato.strip()):
            return candidato.strip()
    return None


# --------------------------------------------------------------------------- #
#  Cliente HTTP mínimo
# --------------------------------------------------------------------------- #

class Api:
    """Lo justo para autenticarse y dar de alta. Sin dependencias externas."""

    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.token: str | None = None

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

    def post(self, ruta: str, cuerpo: dict) -> tuple[int, dict]:
        return self._peticion("POST", ruta, cuerpo)

    def get(self, ruta: str) -> tuple[int, dict]:
        return self._peticion("GET", ruta, None)


def mapa_de_departamentos(api: Api) -> dict[str, str]:
    """Sigla del CI (`SC`, `LP`, …) → id del concepto que la representa.

    El alta guarda el departamento emisor como `issuerAdministrativeAreaConceptId`,
    que es un uuid. La sigla del markdown hay que resolverla contra
    `VS_BO_DEPARTMENT`, que es el catálogo que el registro publica.
    """
    estado, cuerpo = api.get("/terminology/value-sets?code=VS_BO_DEPARTMENT&limit=1")
    if estado != 200 or not cuerpo.get("items"):
        print("  aviso: no se pudo leer VS_BO_DEPARTMENT; el CI irá sin departamento")
        return {}
    version = cuerpo["items"][0].get("defaultVersionId")
    identificador = cuerpo["items"][0]["id"]
    ruta = f"/terminology/value-sets/{identificador}/$expand?limit=50"
    if version:
        ruta += f"&valueSetVersionId={version}"
    estado, expansion = api.get(ruta)
    if estado != 200:
        return {}
    mapa: dict[str, str] = {}
    for miembro in expansion.get("items", []):
        codigo = str(miembro.get("code", ""))
        sigla = codigo.rsplit(":", 1)[-1].upper()
        if sigla:
            mapa[sigla] = miembro["conceptId"]
    return mapa


# --------------------------------------------------------------------------- #
#  Altas
# --------------------------------------------------------------------------- #

def cuerpo_comun(cabecera: list[str], fila: list[str], deptos: dict[str, str]) -> dict:
    """Lo que médicos y pacientes comparten: nombre, documento y contacto.

    Las cuatro partes del nombre van separadas porque el registro de procesos lo
    pide así —«3 espacios para guardar nombres y otros que indique Apellido
    paterno y apellido materno (esto para tener los datos correctos)»— y porque
    el modelo las tiene desde v4.0.11.
    """
    emitido = columna(cabecera, fila, "EMITIDO").strip().upper()
    cuerpo: dict = {
        "name": opcional(columna(cabecera, fila, "NOMBRE")),
        "middleName": opcional(columna(cabecera, fila, "NOMBRE 2")),
        "lastName": opcional(columna(cabecera, fila, "APELLIDO PATERNO")),
        "motherLastName": opcional(columna(cabecera, fila, "APELLIDO MATERNO")),
        "birthDate": fecha(columna(cabecera, fila, "FECHA NACIMIENTO")),
        "phone": telefono(columna(cabecera, fila, "NUMERO CELULAR")),
    }
    if emitido in deptos:
        cuerpo["issuerAdministrativeAreaConceptId"] = deptos[emitido]
    return {k: v for k, v in cuerpo.items() if v is not None}


def alta_de_pacientes(
    api: Api, fuente: Path, password: str, deptos: dict[str, str], aplicar: bool
) -> tuple[int, int, list[str]]:
    """Da de alta a los pacientes del padrón. Entra con su cédula."""
    creados = existentes = 0
    problemas: list[str] = []
    for cabecera, fila in filas_de_tabla(
        (fuente / "USUARIO_PACIENTES_1.md").read_text(encoding="utf-8").splitlines()
    ):
        ci = columna(cabecera, fila, "CEDULA IDENTIDAD")
        if not re.fullmatch(r"\d{4,12}", ci):
            continue
        if not aplicar:
            creados += 1
            continue
        cuerpo = cuerpo_comun(cabecera, fila, deptos)
        cuerpo["nationalId"] = ci
        cuerpo["password"] = password
        correo = opcional(columna(cabecera, fila, "CORREO ELECTRONICO"))
        if correo:
            cuerpo["email"] = correo
        ocupacion = opcional(columna(cabecera, fila, "OCUPACION"))
        if ocupacion:
            # Texto libre y no concepto: `VS_BO_OCCUPATION` —las 896 del SEGIP—
            # todavía no existe. El registro de procesos ya prevé esta salida:
            # «dejar uno al final libre para … la ocupación que no encontró».
            cuerpo["occupationFreeText"] = ocupacion[:120]

        estado, respuesta = api.post("/iam/auth/register-patient", cuerpo)
        if estado in (200, 201):
            creados += 1
        elif estado == 409:
            existentes += 1
        else:
            problemas.append(f"CI {ci}: {estado} {respuesta.get('message', '')[:90]}")
    return creados, existentes, problemas


def alta_de_medicos(
    api: Api, fuente: Path, password: str, deptos: dict[str, str], aplicar: bool
) -> tuple[int, int, list[str]]:
    """Da de alta a los médicos del padrón. Entra con su correo.

    `licenseNumber` y `credentialNumber` son obligatorios en el alta, y el padrón
    los trae: la matrícula del Ministerio de Salud y el registro del SEDES de la
    gobernación. Quien no tenga alguno de los dos se informa y se salta — inventar
    una matrícula sería falsificar una credencial profesional.
    """
    creados = existentes = 0
    problemas: list[str] = []
    for cabecera, fila in filas_de_tabla(
        (fuente / "USUARIO_MEDICOS_1.md").read_text(encoding="utf-8").splitlines()
    ):
        ci = columna(cabecera, fila, "CEDULA IDENTIDAD")
        if not re.fullmatch(r"\d{4,12}", ci):
            continue

        correo = opcional(columna(cabecera, fila, "CORREO ELECTRONICO"))
        matricula = opcional(
            columna(cabecera, fila, "MATRICULA MINISTERIO DE SALUD Y DEPORTES")
        )
        sedes = opcional(columna(cabecera, fila, "SEDES GOBERNACION SANTA CRUZ"))
        colegio = opcional(columna(cabecera, fila, "REGISTRO COLEGIO ODONTOLOGOS"))
        credencial = sedes or colegio

        if not correo:
            problemas.append(f"CI {ci}: sin correo, y el alta de médico lo exige")
            continue
        if not matricula or not credencial:
            problemas.append(f"CI {ci}: sin matrícula o sin registro profesional")
            continue
        if not aplicar:
            creados += 1
            continue

        cuerpo = cuerpo_comun(cabecera, fila, deptos)
        cuerpo["email"] = correo
        cuerpo["password"] = password
        cuerpo["nationalId"] = ci
        cuerpo["licenseNumber"] = matricula
        cuerpo["credentialNumber"] = credencial
        titulo = opcional(columna(cabecera, fila, "OCUPACION"))
        if titulo:
            cuerpo["professionalTitle"] = titulo[:120]

        estado, respuesta = api.post("/iam/auth/register-practitioner", cuerpo)
        if estado in (200, 201):
            creados += 1
        elif estado == 409:
            existentes += 1
        else:
            problemas.append(f"CI {ci}: {estado} {respuesta.get('message', '')[:90]}")
    return creados, existentes, problemas


# --------------------------------------------------------------------------- #

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--fuente", type=Path, default=FUENTE_POR_DEFECTO)
    p.add_argument("--api", default="http://localhost:3000")
    p.add_argument("--admin-email", default="admin@redesa.test")
    p.add_argument("--admin-password", default="S3cret-passw0rd")
    p.add_argument("--password", help="La que se le pone a todas las cuentas.")
    p.add_argument(
        "--yes",
        action="store_true",
        help="Sin esto sólo cuenta qué haría, sin dar de alta a nadie.",
    )
    args = p.parse_args()

    if not args.fuente.is_dir():
        print(f"No existe la carpeta de origen: {args.fuente}", file=sys.stderr)
        return 1
    if args.yes and not args.password:
        print("Falta --password: es la contraseña de todas las cuentas.", file=sys.stderr)
        return 1
    if args.password and len(args.password) < 8:
        print("La contraseña necesita al menos 8 caracteres.", file=sys.stderr)
        return 1

    api = Api(args.api)
    api.login(args.admin_email, args.admin_password)
    deptos = mapa_de_departamentos(api)

    modo = "ALTA REAL" if args.yes else "SIMULACIÓN (agregá --yes para dar de alta)"
    print(f"Origen : {args.fuente}")
    print(f"API    : {args.api}")
    print(f"Modo   : {modo}")
    print(f"Departamentos resueltos: {len(deptos)}\n")

    pac_creados, pac_existentes, pac_problemas = alta_de_pacientes(
        api, args.fuente, args.password or "", deptos, args.yes
    )
    print(f"  pacientes  creados {pac_creados:4d} · ya existían {pac_existentes:4d}")

    med_creados, med_existentes, med_problemas = alta_de_medicos(
        api, args.fuente, args.password or "", deptos, args.yes
    )
    print(f"  médicos    creados {med_creados:4d} · ya existían {med_existentes:4d}")

    problemas = pac_problemas + med_problemas
    if problemas:
        print(f"\n  {len(problemas)} filas no se pudieron dar de alta:")
        for linea in problemas[:20]:
            print(f"    · {linea}")
        if len(problemas) > 20:
            print(f"    … y {len(problemas) - 20} más")

    print("\nListo.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
