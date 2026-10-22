#!/usr/bin/env python3
"""Le da sede a las cajas de la seguridad social que ya existen como organización.

## Qué problema resuelve

El vínculo médico–organización está construido de punta a punta: el médico
declara dónde trabaja, la organización aprueba o rechaza, y publicar agenda
exige esa aprobación. Pero **no funciona con nadie**, porque el vínculo apunta a
una *sede* y ninguna de las organizaciones reales tiene una. Las únicas treinta
sedes de la base son andamio de pruebas («Practice sites (caso 09)»).

Este cargador llena ese hueco con datos reales: las siete cajas de la seguridad
social que están **a la vez** en `directory.tenants` y en el padrón oficial, con
la dirección y el teléfono que el padrón declara.

## Por qué un mapeo explícito y no un cruce por nombre

Un cruce difuso por nombre empareja «Caja Nacional de Salud» con las siete
cajas, porque todas empiezan con «Caja». Sería escribir adivinanzas como si
fueran hechos, que es el error que este proyecto viene corrigiendo en otros
lados. Las siete líneas de `CAJAS` se verificaron a mano, una por una, y son
revisables de un vistazo.

## Por qué por la API y no escribiendo en la base

Es el mismo alta que recorrería una organización de verdad: `POST /practices` y
`POST /practices/:id/sites`. Escribir en la base saltearía las reglas del alta y
dejaría filas que ningún flujo produjo.

Idempotente, con dos mecanismos distintos porque la API se comporta distinto en
cada alta: la **sede** rechaza el código repetido con 409 —esa es la señal de «ya
estaba»—, pero la **práctica** no rechaza nada, así que ahí se lee antes de
escribir. Se descubrió corriéndolo dos veces: la segunda duplicó las siete.

Uso:
    python tools/bolivia-datasets/load_org_sites.py --api http://localhost:3000
    python tools/bolivia-datasets/load_org_sites.py --dry-run
"""

from __future__ import annotations

import argparse
import http.client
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
PADRON = RAIZ / "src/common/seed/data/bolivia/health-facilities.dataset.json"

# Las siete cajas, emparejadas a mano contra el padrón. Izquierda: la razón
# social tal como está en `directory.tenants`. Derecha: el código del padrón.
# Ambos lados tienen exactamente siete elementos y se corresponden uno a uno.
CAJAS: dict[str, str] = {
    "Caja Nacional de Salud": "BO_EST_CAJA_NACIONAL_DE_SALUD",
    "Caja Petrolera de Salud": "BO_EST_CAJA_PETROLERA_SANTA_CRUZ",
    "Caja de Salud CORDES": "BO_EST_CAJA_DE_SALUD_CORDES",
    "Caja de Salud de Caminos y Ramas Anexas": "BO_EST_CAJA_DE_SALUD_DE_CAMINOS",
    "Caja de Salud de la Banca Privada": "BO_EST_CAJA_DE_SALUD_DE_LA_BANCA_PRIVADA",
    "Corporación del Seguro Social Militar": "BO_EST_CORPORACION_DEL_SEGURO_SOCIAL_MILITAR",
    "Seguro Social Universitario": "BO_EST_SEGURO_SOCIAL_UNIVERSITARIO",
}

ZONA = "America/La_Paz"


class Api:
    """Cliente mínimo de la API, con sesión."""

    def __init__(self, base: str) -> None:
        self.base = base.rstrip("/")
        self.token: str | None = None

    # Mismo defecto que los otros cargadores de `bolivia-datasets/`: Neon corta
    # la conexión del backend a mitad de una ráfaga y eso tumba el proceso de
    # Nest. Son fallos de SOCKET, no de protocolo HTTP —`URLError` no los
    # atrapa—, y este método ni siquiera capturaba `URLError`.
    REINTENTOS_POR_CAIDA = 3
    ESPERA_ENTRE_REINTENTOS = 15.0

    def _peticion(
        self, metodo: str, ruta: str, cuerpo: dict | None
    ) -> tuple[int, dict]:
        datos = json.dumps(cuerpo).encode("utf-8") if cuerpo is not None else None
        for intento in range(1, self.REINTENTOS_POR_CAIDA + 1):
            pedido = urllib.request.Request(f"{self.base}{ruta}", data=datos, method=metodo)
            pedido.add_header("Content-Type", "application/json")
            if self.token:
                pedido.add_header("Authorization", f"Bearer {self.token}")
            try:
                with urllib.request.urlopen(pedido, timeout=30) as resp:
                    crudo = resp.read().decode("utf-8")
                    return resp.status, (json.loads(crudo) if crudo else {})
            except urllib.error.HTTPError as error:
                crudo = error.read().decode("utf-8", errors="replace")
                try:
                    return error.code, json.loads(crudo)
                except json.JSONDecodeError:
                    return error.code, {"message": crudo[:300]}
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
        return 0, {"message": "sin respuesta tras los reintentos"}

    def entrar(self, correo: str, clave: str) -> None:
        estado, cuerpo = self._peticion(
            "POST", "/iam/auth/login", {"email": correo, "password": clave}
        )
        if estado != 200 or "accessToken" not in cuerpo:
            raise SystemExit(f"No se pudo entrar ({estado}): {cuerpo}")
        self.token = cuerpo["accessToken"]

    def get(self, ruta: str) -> tuple[int, dict]:
        return self._peticion("GET", ruta, None)

    def post(self, ruta: str, cuerpo: dict) -> tuple[int, dict]:
        return self._peticion("POST", ruta, cuerpo)


def filas_de(respuesta: object) -> list[dict]:
    """Las filas de un listado, venga pelado o envuelto en `items`.

    :param respuesta: Cuerpo de la respuesta.
    :returns: Las filas, o vacío si no se reconoce la forma.
    """
    if isinstance(respuesta, list):
        return [fila for fila in respuesta if isinstance(fila, dict)]
    if isinstance(respuesta, dict):
        items = respuesta.get("items")
        if isinstance(items, list):
            return [fila for fila in items if isinstance(fila, dict)]
    return []


def ficha_del_padron(codigo: str) -> dict | None:
    """La ficha de un establecimiento del padrón.

    :param codigo: Código `BO_EST_…`.
    :returns: La fila del padrón, o `None` si no está.
    """
    datos = json.loads(PADRON.read_text(encoding="utf-8"))["datos"]
    for fila in datos:
        if fila.get("code") == codigo:
            return fila
    return None


def organizaciones(api: Api) -> dict[str, str]:
    """Las organizaciones de la plataforma, por razón social.

    :param api: Cliente autenticado.
    :returns: Mapa `razón social -> id`.
    """
    encontradas: dict[str, str] = {}
    cursor: str | None = None
    while True:
        ruta = "/admin/tenants?limit=100" + (f"&cursor={cursor}" if cursor else "")
        estado, cuerpo = api.get(ruta)
        if estado != 200:
            raise SystemExit(f"No se pudieron listar las organizaciones ({estado})")
        for fila in cuerpo.get("items", []):
            nombre = fila.get("legalName") or fila.get("displayName")
            if nombre:
                encontradas[nombre] = fila["id"]
        cursor = cuerpo.get("nextCursor")
        if not cursor:
            return encontradas


def practica_de(api: Api, tenant_id: str, nombre: str) -> str | None:
    """La práctica de una organización, creándola sólo si no tiene.

    Una organización sin práctica no puede tener sedes: la sede cuelga de la
    práctica, no del tenant.

    **Se lee antes de escribir, y no al revés.** El alta de práctica no rechaza
    duplicados —dos con el mismo nombre y distinto código conviven sin
    problema—, así que confiar en un 409 que nunca llega hace que cada corrida
    cree una práctica más. Se comprobó ejecutándolo: la segunda corrida duplicó
    las siete.

    :param api: Cliente autenticado.
    :param tenant_id: La organización.
    :param nombre: Su razón social, para nombrar la práctica.
    :returns: El id de la práctica, o `None` si no se pudo.
    """
    codigo = f"PR-{tenant_id[:8].upper()}"

    # `GET /practices` responde una lista pelada y `GET /practices/:id/sites`
    # también; otros listados del proyecto envuelven en `{items}`. Se acepta
    # cualquiera de las dos formas en vez de fiarse de una.
    leido, listado = api.get(f"/practices?tenantId={tenant_id}")
    if leido == 200:
        for fila in filas_de(listado):
            if fila.get("code") == codigo or fila.get("name") == nombre:
                return fila["id"]

    estado, cuerpo = api.post(
        "/practices",
        {"tenantId": tenant_id, "code": codigo, "name": nombre, "timeZone": ZONA},
    )
    if estado in (200, 201):
        return cuerpo.get("id")
    print(f"    ⚠ no se pudo resolver la práctica ({estado}): {cuerpo.get('message')}")
    return None


def main() -> int:
    """Punto de entrada.

    :returns: 0 si terminó, 1 si algo quedó sin cargar.
    """
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--api", default=os.environ.get("API", "http://localhost:3000"))
    parser.add_argument("--email", default=os.environ.get("BOOTSTRAP_ADMIN_EMAIL"))
    parser.add_argument("--password", default=os.environ.get("BOOTSTRAP_ADMIN_PASSWORD"))
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Muestra qué se crearía, sin escribir nada.",
    )
    args = parser.parse_args()

    if not PADRON.exists():
        print(f"No encuentro el padrón en {PADRON}", file=sys.stderr)
        return 1

    if args.dry_run:
        print("Sedes que se crearían (nada se escribe):\n")
        for razon, codigo in CAJAS.items():
            ficha = ficha_del_padron(codigo)
            direccion = (ficha or {}).get("direccion") or "sin dirección en el padrón"
            print(f"  {razon}")
            print(f"    ← {codigo}")
            print(f"    {direccion}\n")
        return 0

    if not args.email or not args.password:
        print(
            "Faltan credenciales: pasá --email/--password o exportá "
            "BOOTSTRAP_ADMIN_EMAIL y BOOTSTRAP_ADMIN_PASSWORD",
            file=sys.stderr,
        )
        return 1

    api = Api(args.api)
    api.entrar(args.email, args.password)
    print(f"Sesión abierta contra {args.api}\n")

    tenants = organizaciones(api)
    creadas = 0
    ya_estaban = 0
    problemas: list[str] = []

    for razon, codigo in CAJAS.items():
        tenant_id = tenants.get(razon)
        if tenant_id is None:
            problemas.append(f"{razon}: no existe como organización en la plataforma")
            continue

        ficha = ficha_del_padron(codigo)
        if ficha is None:
            problemas.append(f"{razon}: {codigo} no está en el padrón")
            continue

        practice_id = practica_de(api, tenant_id, razon)
        if practice_id is None:
            problemas.append(f"{razon}: sin práctica donde colgar la sede")
            continue

        estado, cuerpo = api.post(
            f"/practices/{practice_id}/sites",
            {
                # El código sale del padrón: estable, y cotejable contra el
                # listado oficial por un humano.
                "code": codigo,
                "name": ficha.get("nombre") or razon,
                "timeZone": ZONA,
                "managingTenantId": tenant_id,
            },
        )
        if estado in (200, 201):
            creadas += 1
            print(f"  ✓ {razon} → {ficha.get('nombre')}")
        elif estado == 409:
            # El alta de sede SÍ rechaza el código repetido, así que el 409 es
            # la señal de «ya estaba» y no un fallo. (El alta de práctica no lo
            # hace; por eso allá la comprobación va antes del POST.)
            ya_estaban += 1
            print(f"  · {razon} ya tenía su sede")
        else:
            problemas.append(f"{razon}: {estado} {cuerpo.get('message')}")

    print(f"\nSedes creadas: {creadas} · ya existían: {ya_estaban}")
    if problemas:
        print(f"\nQuedaron {len(problemas)} sin cargar:")
        for linea in problemas:
            print(f"  - {linea}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
