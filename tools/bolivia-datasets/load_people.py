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
import hashlib
import json
import time
import re
import http.client
import sys
import unicodedata
import urllib.error
import urllib.request
import uuid
from pathlib import Path
from typing import Iterable, Iterator

RAIZ_API = Path(__file__).resolve().parents[2]

# Mismo namespace y algoritmo que `deterministicId()` en
# `src/common/constants/concepts.ts` (UUIDv5 local: sha1(namespace + clave),
# RFC 4122 §4.3) — reimplementado acá porque este script no corre bajo Node.
_SALUD_UUID_NAMESPACE = uuid.UUID("3f2b6c14-9d5e-5a41-b7c2-0a1e9f4d8b60")


def deterministic_id(key: str) -> str:
    digest = hashlib.sha1(_SALUD_UUID_NAMESPACE.bytes + key.encode("utf-8")).digest()
    b = bytearray(digest[:16])
    b[6] = (b[6] & 0x0F) | 0x50
    b[8] = (b[8] & 0x3F) | 0x80
    return str(uuid.UUID(bytes=bytes(b)))
# Los padrones viven en el repositorio del modelo, que se clona como hermano de
# este. Se reapunta con `--fuente` si están en otro lado.
FUENTE_POR_DEFECTO = RAIZ_API.parent / "mantra-core-health-model" / "markdown_convertidos"


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
        # 10 altas por minuto → una cada ~7 s deja margen; el reintento espera la ventana entera.
        self.pausa_entre_altas = 7.0
        self.pausa_por_429 = 62.0

    # Neon corta la conexión del backend a mitad de una ráfaga de altas (visto
    # en producción: `Connection terminated unexpectedly` del lado del pooler),
    # y eso tumba el proceso de Nest — la próxima petición llega a un puerto
    # que ya no escucha. Son fallos de SOCKET, no de protocolo HTTP, así que
    # `URLError` no los atrapa: `RemoteDisconnected`/`BadStatusLine` cuelgan de
    # `http.client.HTTPException`, y un timeout de lectura es `TimeoutError`
    # a secas. Sin este segundo `except`, uno solo de estos tumbaba el
    # cargador entero a mitad de padrón, con altas ya confirmadas y el resto
    # sin ni intentar.
    REINTENTOS_POR_CAIDA = 3
    ESPERA_ENTRE_REINTENTOS = 15.0

    def _peticion(self, metodo: str, ruta: str, cuerpo: dict | None) -> tuple[int, dict]:
        datos = json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None
        for intento in range(1, self.REINTENTOS_POR_CAIDA + 1):
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
            except (http.client.HTTPException, TimeoutError, ConnectionError, OSError) as error:
                if intento == self.REINTENTOS_POR_CAIDA:
                    return 0, {"message": f"{type(error).__name__}: {error}"}
                print(
                    f"    aviso: {type(error).__name__} ({error}) — "
                    f"reintento {intento}/{self.REINTENTOS_POR_CAIDA} en "
                    f"{self.ESPERA_ENTRE_REINTENTOS:.0f}s",
                    file=sys.stderr,
                )
                time.sleep(self.ESPERA_ENTRE_REINTENTOS)
        # Inalcanzable: el bucle siempre retorna o agota los reintentos.
        return 0, {"message": "sin respuesta tras los reintentos"}

    def login(self, email: str, password: str) -> None:
        estado, cuerpo = self._peticion(
            "POST", "/iam/auth/login", {"email": email, "password": password}
        )
        if estado != 200 or "accessToken" not in cuerpo:
            raise SystemExit(f"No se pudo autenticar ({estado}): {cuerpo}")
        self.token = cuerpo["accessToken"]

    def post(self, ruta: str, cuerpo: dict) -> tuple[int, dict]:
        # El alta está limitada a 10/min por IP (protección anti-abuso). En vez de
        # apagar esa protección para todo el servidor, el cargador se autolimita:
        # espera entre altas y, si aun así choca con un 429, respeta la ventana y
        # reintenta una vez. Es más lento pero no deja la puerta abierta.
        estado, cuerpo_resp = self._peticion("POST", ruta, cuerpo)
        if estado == 429:
            time.sleep(self.pausa_por_429)
            estado, cuerpo_resp = self._peticion("POST", ruta, cuerpo)
        return estado, cuerpo_resp

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


_INE_LINE_RE = re.compile(r"\{\s*ine:\s*'(\d+)',\s*name:\s*'([^']+)'")


def mapa_de_municipios() -> dict[str, str]:
    """Nombre del municipio, en mayúsculas → id del concepto que lo representa.

    `RegisterPatientDto.residenceMunicipalityConceptId` es **obligatorio**
    (`FT-03-R03`, "el alta de paciente exige correo, sexo, teléfono, nacimiento
    y localidad"): sin esto, cada alta de paciente responde `400
    VALIDATION_FAILED` sin importar qué más traiga la fila.

    ## Por qué NO se resuelve contra `/terminology/value-sets`

    Se probó primero por ahí —es como se resuelve el departamento, un poco
    más abajo— y **cada alta volvía `400 El municipio indicado no pertenece
    al catálogo de municipios de Bolivia`**. La razón: hay dos catálogos de
    municipios con el mismo código `VS_BO_MUNICIPALITY` y **uuids distintos**
    para el mismo municipio real. `/terminology/value-sets` expone el que
    sembró el generador del modelo (código `SC-SANTA_CRUZ_DE_LA_SIERRA`,
    conceptId derivado de ESE código); pero `residenceMunicipalityConceptId`
    lo valida `createResidenceAddress` (`common/services/residence-address.ts`)
    contra `boMunicipalityByConceptId()`, que resuelve sobre el catálogo
    ESTÁTICO de `src/common/seed/bo-geography.catalog.ts`
    (`deterministicId('geo:bo:municipality:<ine>')`) — un namespace y una
    clave distintos. Los dos catálogos declaran los mismos 340 municipios,
    pero con dos juegos de uuids que no se cruzan.

    Por eso este mapa se arma leyendo `bo-geography.catalog.ts` **directo del
    disco** y recalculando el mismo hash que usa el backend, en vez de
    preguntarle a la API — es el único camino que produce el uuid que
    `residenceMunicipalityConceptId` de verdad acepta.
    """
    ruta = RAIZ_API / "src" / "common" / "seed" / "bo-geography.catalog.ts"
    if not ruta.is_file():
        print(f"  aviso: no se encontró {ruta}; el alta de paciente fallará sin municipio")
        return {}
    texto = ruta.read_text(encoding="utf-8")
    mapa: dict[str, str] = {}
    for ine, nombre in _INE_LINE_RE.findall(texto):
        mapa[nombre.strip().upper()] = deterministic_id(f"geo:bo:municipality:{ine}")
    return mapa


# --------------------------------------------------------------------------- #
#  Altas
# --------------------------------------------------------------------------- #

def cuerpo_comun(
    cabecera: list[str], fila: list[str], deptos: dict[str, str], municipios: dict[str, str]
) -> dict:
    """Lo que médicos y pacientes comparten: nombre, documento y contacto.

    Las cuatro partes del nombre van separadas porque el registro de procesos lo
    pide así —«3 espacios para guardar nombres y otros que indique Apellido
    paterno y apellido materno (esto para tener los datos correctos)»— y porque
    el modelo las tiene desde v4.0.11.
    """
    emitido = columna(cabecera, fila, "EMITIDO").strip().upper()
    municipio = opcional(columna(cabecera, fila, "MUNICIPIO"))
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
    if municipio and municipio.upper() in municipios:
        cuerpo["residenceMunicipalityConceptId"] = municipios[municipio.upper()]
    return {k: v for k, v in cuerpo.items() if v is not None}


# El sexo asignado al nacer, por cédula. `USUARIO_PACIENTES_1.md` no trae esa
# columna —el padrón no la declara para nadie— y `RegisterPatientDto.sexAtBirth`
# es obligatorio: sin este mapa, ninguna de las 85 personas puede darse de alta.
# Se llenó a mano, nombre por nombre, y lo confirmó quien conoce a esta gente —
# no es una inferencia del script. Dos casos (Yony, Darling) no eran obvios por
# el nombre solo y se confirmaron por separado.
SEXO_POR_CEDULA: dict[str, str] = {
    "7678614": "FEMALE", "2979363": "FEMALE", "6241281": "FEMALE", "4579338": "MALE",
    "14162271": "MALE", "9013389": "FEMALE", "9013388": "MALE", "12890772": "FEMALE",
    "3896477": "FEMALE", "3911972": "MALE", "4627480": "FEMALE", "13720992": "MALE",
    "5870098": "FEMALE", "4579339": "MALE", "14589559": "MALE", "4579340": "MALE",
    "5414404": "FEMALE", "14313263": "MALE", "3191976": "FEMALE", "5375443": "MALE",
    "3262218": "FEMALE", "1998655": "MALE", "5344230": "MALE", "3925540": "FEMALE",
    "9797933": "FEMALE", "12356310": "FEMALE", "13242050": "FEMALE", "3917534": "FEMALE",
    "4616699": "MALE", "76664729": "MALE", "9585923": "FEMALE", "13243289": "FEMALE",
    "8862862": "FEMALE", "5857998": "MALE", "6339033": "FEMALE", "13338616": "FEMALE",
    "17093063": "FEMALE", "3201042": "FEMALE", "13076828": "FEMALE", "4579489": "FEMALE",
    "1983826": "MALE", "11341822": "FEMALE", "11341818": "FEMALE", "3888449": "FEMALE",
    "3888052": "MALE", "6289187": "MALE", "7701116": "MALE", "6289185": "FEMALE",
    "16454581": "FEMALE", "2939625": "FEMALE", "3888046": "MALE", "11387113": "FEMALE",
    "17293863": "FEMALE", "5414405": "FEMALE", "15931208": "FEMALE", "4583390": "MALE",
    "3257233": "FEMALE", "6203122": "FEMALE", "5864864": "MALE", "14871092": "MALE",
    "6203121": "MALE", "7734229": "FEMALE", "8239873": "MALE", "14871880": "MALE",
    "16927193": "MALE", "17651163": "FEMALE", "5846151": "MALE", "6310835": "FEMALE",
    "6226130": "MALE", "8117953": "FEMALE", "8199470": "FEMALE", "8199297": "FEMALE",
    "15202749": "FEMALE", "5874625": "MALE", "9684803": "FEMALE", "3945305": "FEMALE",
    "16684842": "FEMALE", "14473393": "MALE", "3945303": "MALE", "3943926": "MALE",
    "5330937": "FEMALE", "8199296": "MALE", "9644905": "FEMALE", "15203081": "MALE",
    "9802542": "FEMALE",
}


def alta_de_pacientes(
    api: Api,
    fuente: Path,
    password: str,
    deptos: dict[str, str],
    municipios: dict[str, str],
    aplicar: bool,
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
        # `sexAtBirth` es obligatorio y el padrón no lo declara: sin una
        # confirmación explícita en `SEXO_POR_CEDULA`, no se inventa — se
        # informa y se sigue con el resto.
        sexo = SEXO_POR_CEDULA.get(ci)
        if sexo is None:
            problemas.append(f"CI {ci}: sin sexo confirmado, no se intenta el alta")
            continue
        cuerpo = cuerpo_comun(cabecera, fila, deptos, municipios)
        cuerpo["nationalId"] = ci
        cuerpo["password"] = password
        cuerpo["sexAtBirth"] = sexo
        correo = opcional(columna(cabecera, fila, "CORREO ELECTRONICO"))
        if correo:
            cuerpo["email"] = correo
        ocupacion = opcional(columna(cabecera, fila, "OCUPACION"))
        if ocupacion:
            # Texto libre y no concepto: `VS_BO_OCCUPATION` —las 896 del SEGIP—
            # todavía no existe. El registro de procesos ya prevé esta salida:
            # «dejar uno al final libre para … la ocupación que no encontró».
            cuerpo["occupationFreeText"] = ocupacion[:120]

        time.sleep(api.pausa_entre_altas)
        estado, respuesta = api.post("/iam/auth/register-patient", cuerpo)
        if estado in (200, 201):
            creados += 1
        elif estado == 409:
            existentes += 1
        else:
            problemas.append(f"CI {ci}: {estado} {respuesta.get('message', '')[:90]}")
    return creados, existentes, problemas


def alta_de_medicos(
    api: Api,
    fuente: Path,
    password: str,
    deptos: dict[str, str],
    municipios: dict[str, str],
    aplicar: bool,
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
        # La matrícula del Ministerio ES la credencial que habilita a ejercer, así
        # que sirve para las dos cosas que el alta pide (`licenseNumber` y
        # `credentialNumber`). El SEDES y el registro del colegio son secundarios
        # —muchos médicos del padrón traen sólo uno o ninguno—: se usan como
        # `credentialNumber` cuando están, y si no, la propia matrícula. Exigir
        # los tres a la vez, como hacía la primera versión, rechazaba médicos con
        # matrícula válida sólo porque les faltaba un registro accesorio.
        credencial = sedes or colegio or matricula

        if not correo:
            problemas.append(f"CI {ci}: sin correo, y el alta de médico lo exige")
            continue
        if not matricula:
            problemas.append(f"CI {ci}: sin matrícula del Ministerio")
            continue
        if not aplicar:
            creados += 1
            continue

        cuerpo = cuerpo_comun(cabecera, fila, deptos, municipios)
        cuerpo["email"] = correo
        cuerpo["password"] = password
        cuerpo["nationalId"] = ci
        cuerpo["licenseNumber"] = matricula
        cuerpo["credentialNumber"] = credencial
        titulo = opcional(columna(cabecera, fila, "OCUPACION"))
        if titulo:
            cuerpo["professionalTitle"] = titulo[:120]

        time.sleep(api.pausa_entre_altas)
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
    municipios = mapa_de_municipios()

    modo = "ALTA REAL" if args.yes else "SIMULACIÓN (agregá --yes para dar de alta)"
    print(f"Origen : {args.fuente}")
    print(f"API    : {args.api}")
    print(f"Modo   : {modo}")
    print(f"Departamentos resueltos: {len(deptos)}")
    print(f"Municipios resueltos: {len(municipios)}\n")

    pac_creados, pac_existentes, pac_problemas = alta_de_pacientes(
        api, args.fuente, args.password or "", deptos, municipios, args.yes
    )
    print(f"  pacientes  creados {pac_creados:4d} · ya existían {pac_existentes:4d}")

    med_creados, med_existentes, med_problemas = alta_de_medicos(
        api, args.fuente, args.password or "", deptos, municipios, args.yes
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
