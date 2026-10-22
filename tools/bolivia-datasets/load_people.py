#!/usr/bin/env python3
"""Da de alta cuentas logueables de médicos y pacientes para un entorno de prueba.

## Qué toma del padrón y qué inventa

Del padrón del stakeholder (`USUARIO_MEDICOS_1.md`, `USUARIO_PACIENTES_1.md`)
sale sólo lo que **no se puede inventar sin falsear una credencial o un nombre**:
las cuatro partes del nombre, la matrícula del Ministerio, el registro del SEDES
o del colegio, y la ocupación.

Todo lo demás —**cédula, fecha de nacimiento, celular, correo y domicilio**— se
**inventa de forma determinista** a partir del número de fila (uuid5 con el mismo
namespace que `deterministicId()` del backend), y no se lee del padrón. Es la
decisión del propietario del 26/09/2026, y tiene dos consecuencias que conviene
tener presentes:

- Un entorno de prueba expuesto en internet deja de ser una filtración de datos
  de terceros: no hay una sola cédula, un domicilio ni un teléfono real en la
  base que esto carga.
- **El paciente entra con la cédula inventada**, no con su correo: el alta de
  paciente usa el documento como `external_subject` (ver `LoginDto`). El médico
  entra con el correo. Las dos cosas las verifica este script cuenta por cuenta.

## Por qué es un script y no un seed

Los otros catálogos de Bolivia —aranceles, establecimientos, aseguradoras— son
datos institucionales y viven como datasets versionados en
`src/common/seed/data/bolivia/`. Éste no puede: los nombres son de personas
reales, y un dataset los deja en la historia de git de un repositorio público.
Una fila en una tabla se borra; un archivo en la historia de git, no. Así que
esto **lee el markdown en el momento** y no deja nada en el repositorio.

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

No pide credenciales de administrador: el departamento emisor y el municipio son
uuid deterministas que se derivan acá mismo, así que el alta usa sólo los dos
endpoints públicos de registro.

La contraseña es **una sola para todas las cuentas**. Con la PII inventada, una
clave fácil de repartir al equipo (`12345678` en los entornos de prueba de este
proyecto) ya no expone datos de nadie, pero sigue siendo una credencial conocida:
no la uses en un entorno que tenga datos reales de pacientes.
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

# El dominio de los correos inventados. `.test` está reservado por la RFC 2606:
# no resuelve y no existe forma de que un correo salga hacia una persona real.
DOMINIO_INVENTADO = "alovida.test"

# Departamento emisor y municipio de residencia de las cuentas inventadas.
#
# Son fijos y no se leen del padrón: el documento es inventado, así que su
# departamento emisor no puede ser el del documento real, y el domicilio es
# justamente uno de los datos que no se toman. El padrón es de Santa Cruz.
#
# `issuerAdministrativeAreaConceptId` se deriva acá y no se pregunta a
# `/terminology/value-sets` —que exigiría un token de administrador— porque el
# concepto es determinista: la misma clave que siembra `bo-geography.catalog.ts`.
DEPARTAMENTO_EMISOR = "SC"
MUNICIPIO_RESIDENCIA = "SANTA CRUZ DE LA SIERRA"


def id_de_departamento(sigla: str) -> str:
    """Sigla del CI (`SC`, `LP`, …) → id del concepto que la representa."""
    return deterministic_id(f"geo:bo:department:{sigla}")


def digitos(clave: str, cuantos: int) -> str:
    """Dígitos deterministas para un dato inventado. No reversible a la fila."""
    return str(int(hashlib.sha256(clave.encode("utf-8")).hexdigest(), 16))[:cuantos]


def pii_inventada(clave: str) -> dict:
    """Cédula, nacimiento y celular inventados y estables para una fila.

    Estables: dos corridas sobre el mismo padrón producen los mismos valores, así
    que la segunda encuentra las cuentas ya creadas (409) en vez de duplicarlas.

    La cédula empieza en 9 y tiene 8 dígitos: el rango que el SEGIP usa hoy en
    Santa Cruz es más corto, así que ninguna de estas choca con una real. El
    nacimiento cae entre 1965 y 2002 —adultos, para no fabricar menores— y el día
    no pasa de 28 para no tener que mirar el mes.
    """
    anio = 1965 + int(digitos(clave + ":y", 2)) % 38
    mes = 1 + int(digitos(clave + ":m", 2)) % 12
    dia = 1 + int(digitos(clave + ":d", 2)) % 28
    return {
        "nationalId": "9" + digitos(clave + ":ci", 7),
        "birthDate": f"{anio:04d}-{mes:02d}-{dia:02d}",
        "phone": "7" + digitos(clave + ":tel", 7),
    }


def _sin_tildes(texto: str) -> str:
    plano = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in plano if not unicodedata.combining(c))


class Correos:
    """Reparte correos `<nombre>.<apellido>@alovida.test` sin repetir ninguno.

    El padrón tiene familias enteras —seis Saldías, cuatro Barbery—, así que la
    colisión es la norma y no el caso raro. Al segundo homónimo le toca un sufijo
    numérico, lo cual es fundamental: el alta responde 409 ante un correo repetido
    y la segunda persona se quedaría sin cuenta en silencio.
    """

    def __init__(self) -> None:
        self._dados: set[str] = set()

    def reservar(self, valor: str) -> str:
        self._dados.add(valor)
        return valor

    def para(self, nombre: str, apellido: str) -> str:
        base = f"{self._parte(nombre)}.{self._parte(apellido)}"
        candidato, n = f"{base}@{DOMINIO_INVENTADO}", 2
        while candidato in self._dados:
            candidato, n = f"{base}{n}@{DOMINIO_INVENTADO}", n + 1
        return self.reservar(candidato)

    @staticmethod
    def _parte(texto: str) -> str:
        return re.sub(r"[^a-z]", "", _sin_tildes(texto).lower())


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


# --------------------------------------------------------------------------- #
#  Cliente HTTP mínimo
# --------------------------------------------------------------------------- #

class Api:
    """Lo justo para autenticarse y dar de alta. Sin dependencias externas."""

    def __init__(self, base: str, pausa_entre_altas: float = 13.0) -> None:
        self.base = base.rstrip("/")
        self.token: str | None = None
        # El límite es de 10 peticiones por minuto por IP sobre las rutas de
        # autenticación, y cada cuenta gasta DOS: el alta y la comprobación de
        # login. Con 13 s de pausa salen ~4,6 por minuto y no se toca el techo.
        # Con los 7 s de la primera versión el padrón entero chocaba con 429 a la
        # decena de cuentas, y detrás del 429 venían 503 del backend.
        self.pausa_entre_altas = pausa_entre_altas
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

    def entra(self, credencial: dict, password: str) -> int:
        """Comprueba que la cuenta recién creada puede iniciar sesión de verdad.

        `credencial` es `{"email": …}` para el personal y `{"nationalId": …}` para
        el paciente: el `external_subject` de la credencial es un único valor y el
        alta de paciente guarda ahí el documento, no el correo.

        Que el alta devuelva 201 no prueba que la cuenta sirva —lo de v4.0.9, con
        27 altas en verde y el login en 500, salió justamente de no mirar esto—.
        """
        estado, _ = self.post("/iam/auth/login", {**credencial, "password": password})
        return estado

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


_INE_LINE_RE = re.compile(r"\{\s*ine:\s*'(\d+)',\s*name:\s*'([^']+)'")


def mapa_de_municipios() -> dict[str, str]:
    """Nombre del municipio, en mayúsculas → id del concepto que lo representa.

    `RegisterPatientDto.residenceMunicipalityConceptId` es **obligatorio**
    (`FT-03-R03`, "el alta de paciente exige correo, sexo, teléfono, nacimiento
    y localidad"): sin esto, cada alta de paciente responde `400
    VALIDATION_FAILED` sin importar qué más traiga la fila.

    ## Por qué NO se resuelve contra `/terminology/value-sets`

    Se probó primero por ahí y **cada alta volvía `400 El municipio indicado no pertenece
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

def cuerpo_comun(cabecera: list[str], fila: list[str], clave: str, municipio: str) -> dict:
    """Lo que médicos y pacientes comparten: el nombre del padrón y PII inventada.

    Las cuatro partes del nombre van separadas porque el registro de procesos lo
    pide así —«3 espacios para guardar nombres y otros que indique Apellido
    paterno y apellido materno (esto para tener los datos correctos)»— y porque
    el modelo las tiene desde v4.0.11.

    Las columnas de cédula, nacimiento, celular, correo, domicilio y municipio del
    padrón **no se leen acá**: ver el encabezado del archivo.
    """
    cuerpo: dict = {
        "name": opcional(columna(cabecera, fila, "NOMBRE")),
        "middleName": opcional(columna(cabecera, fila, "NOMBRE 2")),
        "lastName": opcional(columna(cabecera, fila, "APELLIDO PATERNO")),
        "motherLastName": opcional(columna(cabecera, fila, "APELLIDO MATERNO")),
        "issuerAdministrativeAreaConceptId": id_de_departamento(DEPARTAMENTO_EMISOR),
        "residenceMunicipalityConceptId": municipio,
        **pii_inventada(clave),
    }
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


def _nombre_visible(cuerpo: dict) -> str:
    return " ".join(filter(None, (cuerpo.get("name"), cuerpo.get("lastName"))))


def cuentas_de_pacientes(
    fuente: Path, correos: Correos, municipio: str, password: str
) -> tuple[list[dict], list[str]]:
    """Las cuentas de paciente que salen del padrón. Cada una entra con su cédula."""
    cuentas: list[dict] = []
    problemas: list[str] = []
    for cabecera, fila in filas_de_tabla(
        (fuente / "USUARIO_PACIENTES_1.md").read_text(encoding="utf-8").splitlines()
    ):
        numero = columna(cabecera, fila, "NUMERO")
        nombre = opcional(columna(cabecera, fila, "NOMBRE"))
        apellido = opcional(columna(cabecera, fila, "APELLIDO PATERNO"))
        if not numero or not nombre or not apellido:
            continue
        # La cédula del padrón se lee SÓLO como clave de `SEXO_POR_CEDULA` y no
        # se envía a ninguna parte: la que va al alta es la inventada.
        ci_del_padron = columna(cabecera, fila, "CEDULA IDENTIDAD")
        sexo = SEXO_POR_CEDULA.get(ci_del_padron)
        if sexo is None:
            # `sexAtBirth` es obligatorio y el padrón no lo declara. Es un dato
            # clínico de una persona con nombre y apellido reales, así que no se
            # inventa como el resto: sin confirmación, no hay alta.
            problemas.append(f"{nombre} {apellido}: sin sexo confirmado, no se da de alta")
            continue
        cuerpo = cuerpo_comun(cabecera, fila, f"test-account:patient:{numero}", municipio)
        cuerpo["sexAtBirth"] = sexo
        cuerpo["email"] = correos.para(nombre, apellido)
        cuerpo["password"] = password
        ocupacion = opcional(columna(cabecera, fila, "OCUPACION"))
        if ocupacion:
            # Texto libre y no concepto: `VS_BO_OCCUPATION` —las 896 del SEGIP—
            # todavía no existe. El registro de procesos ya prevé esta salida:
            # «dejar uno al final libre para … la ocupación que no encontró».
            cuerpo["occupationFreeText"] = ocupacion[:120]
        cuentas.append({"tipo": "PACIENTE", "ruta": "/iam/auth/register-patient", "cuerpo": cuerpo})
    return cuentas, problemas


def cuentas_de_medicos(
    fuente: Path, correos: Correos, municipio: str, password: str
) -> tuple[list[dict], list[str]]:
    """Las cuentas de médico que salen del padrón. Cada una entra con su correo.

    `licenseNumber` es obligatorio en el alta y el padrón lo trae: la matrícula
    del Ministerio de Salud. Quien no la tenga se informa y se salta — inventar
    una matrícula sería falsificar una credencial profesional, y es lo único del
    padrón que no se puede suplir con un valor inventado.
    """
    cuentas: list[dict] = []
    problemas: list[str] = []
    for cabecera, fila in filas_de_tabla(
        (fuente / "USUARIO_MEDICOS_1.md").read_text(encoding="utf-8").splitlines()
    ):
        numero = columna(cabecera, fila, "NUMERO")
        nombre = opcional(columna(cabecera, fila, "NOMBRE"))
        apellido = opcional(columna(cabecera, fila, "APELLIDO PATERNO"))
        if not numero or not nombre or not apellido:
            continue
        matricula = opcional(
            columna(cabecera, fila, "MATRICULA MINISTERIO DE SALUD Y DEPORTES")
        )
        if not matricula:
            problemas.append(f"{nombre} {apellido}: sin matrícula del Ministerio")
            continue
        sedes = opcional(columna(cabecera, fila, "SEDES GOBERNACION SANTA CRUZ"))
        colegio = opcional(columna(cabecera, fila, "REGISTRO COLEGIO ODONTOLOGOS"))
        # La matrícula del Ministerio ES la credencial que habilita a ejercer, así
        # que sirve para las dos cosas que el alta pide (`licenseNumber` y
        # `credentialNumber`). El SEDES y el registro del colegio son secundarios
        # —muchos médicos del padrón traen sólo uno o ninguno—: se usan como
        # `credentialNumber` cuando están, y si no, la propia matrícula. Exigir
        # los tres a la vez, como hacía la primera versión, rechazaba médicos con
        # matrícula válida sólo porque les faltaba un registro accesorio.
        cuerpo = cuerpo_comun(cabecera, fila, f"test-account:practitioner:{numero}", municipio)
        cuerpo["email"] = correos.para(nombre, apellido)
        cuerpo["password"] = password
        cuerpo["licenseNumber"] = matricula
        cuerpo["credentialNumber"] = sedes or colegio or matricula
        titulo = opcional(columna(cabecera, fila, "OCUPACION"))
        if titulo:
            cuerpo["professionalTitle"] = titulo[:120]
        cuentas.append(
            {"tipo": "MEDICO", "ruta": "/iam/auth/register-practitioner", "cuerpo": cuerpo}
        )
    return cuentas, problemas


# Las dos cuentas con las que la maqueta enseña el producto. Existen para que el
# recorrido del médico y el del paciente se puedan mostrar sin buscar a nadie en
# la lista, y llevan los mismos correos que el backend simulado del frontend
# (`core/mock/`), así que quien venía demostrando sobre la maqueta no tiene que
# aprender otros. Su nombre es inventado, no sale del padrón.
CUENTAS_DEMO = (
    {
        "tipo": "MEDICO",
        "ruta": "/iam/auth/register-practitioner",
        "correo": "medica@alovida.mock",
        # La clave de la PII inventada es un valor fijo y NO se deriva del correo:
        # es la que ya produjo las cuentas vivas del entorno de prueba, y cambiarla
        # daría otra cédula, con lo que una segunda corrida crearía una persona más
        # en vez de encontrarse con la que existe.
        "claveInventada": "test-account:demo:medica",
        "cuerpo": {
            "name": "Valeria",
            "lastName": "Rojas",
            "motherLastName": "Mendoza",
            "licenseNumber": "DEMO-MED-0001",
            "professionalTitle": "Médica cardióloga",
        },
    },
    {
        "tipo": "PACIENTE",
        "ruta": "/iam/auth/register-patient",
        "correo": "paciente@alovida.mock",
        "claveInventada": "test-account:demo:paciente",
        "cuerpo": {
            "name": "Lucía",
            "lastName": "Fernández",
            "motherLastName": "Soliz",
            "sexAtBirth": "FEMALE",
        },
    },
)


def cuentas_de_demostracion(correos: Correos, municipio: str, password: str) -> list[dict]:
    cuentas = []
    for plantilla in CUENTAS_DEMO:
        cuerpo = {
            **plantilla["cuerpo"],
            "email": correos.reservar(plantilla["correo"]),
            "password": password,
            "issuerAdministrativeAreaConceptId": id_de_departamento(DEPARTAMENTO_EMISOR),
            "residenceMunicipalityConceptId": municipio,
            **pii_inventada(plantilla["claveInventada"]),
        }
        if plantilla["tipo"] == "MEDICO":
            cuerpo["credentialNumber"] = cuerpo["licenseNumber"]
        cuentas.append({"tipo": plantilla["tipo"], "ruta": plantilla["ruta"], "cuerpo": cuerpo})
    return cuentas


def dar_de_alta(api: Api, cuentas: list[dict], password: str) -> list[dict]:
    """Crea cada cuenta y comprueba que entre. Devuelve una fila por cuenta."""
    resultados: list[dict] = []
    for cuenta in cuentas:
        cuerpo = cuenta["cuerpo"]
        time.sleep(api.pausa_entre_altas)
        estado, respuesta = api.post(cuenta["ruta"], cuerpo)
        # 409 es una cuenta que ya existía: el alta converge, no aborta.
        credencial = (
            {"nationalId": cuerpo["nationalId"]}
            if cuenta["tipo"] == "PACIENTE"
            else {"email": cuerpo["email"]}
        )
        login = api.entra(credencial, password) if estado in (200, 201, 409) else 0
        resultados.append(
            {
                "tipo": cuenta["tipo"],
                "nombre": _nombre_visible(cuerpo),
                "correo": cuerpo["email"],
                "cedula": cuerpo["nationalId"],
                "alta": estado,
                "login": login,
                "error": None
                if estado in (200, 201, 409)
                else str(respuesta.get("message", ""))[:120],
            }
        )
        ultimo = resultados[-1]
        print(
            f"  {ultimo['tipo']:9s} {ultimo['correo']:44s} alta={estado} login={login}"
            + (f"  {ultimo['error']}" if ultimo["error"] else ""),
            flush=True,
        )
    return resultados


# --------------------------------------------------------------------------- #

def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--fuente", type=Path, default=FUENTE_POR_DEFECTO)
    p.add_argument("--api", default="http://localhost:3000")
    p.add_argument("--password", help="La que se le pone a todas las cuentas.")
    p.add_argument(
        "--pausa",
        type=float,
        default=13.0,
        help="Segundos entre cuentas. Por debajo de 13 se choca con el límite de 10/min.",
    )
    p.add_argument(
        "--salida",
        type=Path,
        help="Archivo JSON con el resultado por cuenta. Lleva nombres reales: "
        "no lo dejes dentro del repositorio.",
    )
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

    municipios = mapa_de_municipios()
    if MUNICIPIO_RESIDENCIA not in municipios:
        print(
            f"No se pudo derivar el municipio {MUNICIPIO_RESIDENCIA}: sin él el alta de "
            "paciente responde 400 en todas las filas.",
            file=sys.stderr,
        )
        return 1
    municipio = municipios[MUNICIPIO_RESIDENCIA]

    correos = Correos()
    password = args.password or ""
    # Las demo primero: son las que alguien va a usar para enseñar el producto, y
    # así se quedan con su correo exacto antes de que un homónimo del padrón se lo
    # lleve.
    cuentas = cuentas_de_demostracion(correos, municipio, password)
    del_padron_pacientes, problemas_pacientes = cuentas_de_pacientes(
        args.fuente, correos, municipio, password
    )
    del_padron_medicos, problemas_medicos = cuentas_de_medicos(
        args.fuente, correos, municipio, password
    )
    cuentas += del_padron_pacientes + del_padron_medicos
    problemas = problemas_pacientes + problemas_medicos

    modo = "ALTA REAL" if args.yes else "SIMULACIÓN (agregá --yes para dar de alta)"
    print(f"Origen : {args.fuente}")
    print(f"API    : {args.api}")
    print(f"Modo   : {modo}")
    print(
        f"Cuentas: {len(cuentas)} "
        f"({sum(c['tipo'] == 'PACIENTE' for c in cuentas)} pacientes, "
        f"{sum(c['tipo'] == 'MEDICO' for c in cuentas)} médicos)\n"
    )

    if not args.yes:
        _informar_problemas(problemas)
        return 0

    resultados = dar_de_alta(api_de(args), cuentas, password)
    entran = [r for r in resultados if r["login"] == 200]
    print(f"\nLOGIN OK {len(entran)}/{len(resultados)}")
    _informar_problemas(problemas)

    if args.salida:
        args.salida.write_text(
            json.dumps({"sinAlta": problemas, "cuentas": resultados}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"Detalle en {args.salida}")

    # Sale distinto de 0 si alguna cuenta no entra: el alta en 201 con el login en
    # rojo es precisamente el caso que este script existe para no dejar pasar.
    return 0 if len(entran) == len(resultados) else 1


def _informar_problemas(problemas: list[str]) -> None:
    if not problemas:
        return
    print(f"\n  {len(problemas)} filas del padrón no se pueden dar de alta:")
    for linea in problemas[:20]:
        print(f"    · {linea}")
    if len(problemas) > 20:
        print(f"    … y {len(problemas) - 20} más")


def api_de(args: argparse.Namespace) -> Api:
    return Api(args.api, pausa_entre_altas=args.pausa)


if __name__ == "__main__":
    raise SystemExit(main())
