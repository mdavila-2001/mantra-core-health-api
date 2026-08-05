#!/usr/bin/env python3
"""generate_postman.py — Genera la colección Postman desde el contrato OpenAPI real.

Consume `openapi/openapi.json` (el contrato que produce `yarn docs:openapi:generate` desde los
decoradores `@nestjs/swagger` de los controllers) y emite una colección Postman v2.1 con **todos**
los endpoints: un folder por dominio (primer segmento de la ruta), subfolders por tag cuando el
dominio es grande, auth Bearer heredada, variables de path, query params documentados, bodies de
ejemplo derivados de los schemas y un test de status por request.

Antes esto parseaba los `.controller.ts` con regex: se perdían query params, respuestas y schemas
anidados. El OpenAPI ya es la fuente de verdad — regenerarlo primero si el contrato cambió.

Uso:  yarn postman:generate       (o: python3 tools/postman/generate_postman.py)
Salida: docs/postman/Salud-API.postman_collection.json
        docs/postman/Salud-Local.postman_environment.json
"""
from __future__ import annotations

import copy
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SPEC = os.path.join(ROOT, 'openapi', 'openapi.json')
OUT_DIR = os.path.join(ROOT, 'docs', 'postman')

METHODS = ('get', 'post', 'put', 'patch', 'delete', 'head', 'options')
MAX_DEPTH = 5          # corta la recursión en schemas profundos/cíclicos
SUBFOLDER_MIN = 10     # a partir de este nº de requests el dominio se parte por tag

# Endpoints cuyos tokens alimentan el entorno: el test guarda la respuesta en variables.
TOKEN_CAPTURE = {
    ('POST', '/iam/auth/login'),
    ('POST', '/iam/auth/token/refresh'),
}

# Cuerpos fijados a mano porque el ejemplo derivado del schema no funciona: `LoginDto` declara
# `email` y `nationalId` como opcionales porque acepta uno **u** otro, y mandar los dos hace que
# el servicio resuelva por documento y devuelva 401. Las claves se validan contra el DTO al generar.
BODY_REPLACE = {
    ('POST', '/iam/auth/login'): {'email': '{{email}}', 'password': '{{password}}'},
    ('POST', '/iam/auth/token/refresh'): {'refreshToken': '{{refreshToken}}'},
}

# Variables de entorno con un valor por defecto útil (el resto se emite vacío).
ENV_DEFAULTS = {
    'baseUrl': 'http://localhost:3000',
    'email': 'admin@redesa.test',
    'password': 'S3cret-passw0rd',
    # `SEED.tenantId` = uuidv5('seed:tenant:default'): determinista, idéntico en cualquier
    # entorno que corra el seed de terminología. Es el tenant que siembra el arranque.
    'tenantId': '1befcfea-44c0-563a-81cd-337ec6acc840',
    # Conceptos del catálogo, también deterministas (uuidv5). El alta de un
    # tenant PROVIDER los exige; cualquier otro se descubre con
    # `GET /terminology/concepts?q=…`.
    'countryConceptId': '340713a7-4d79-519c-b5e0-f1f40b914ac6',
    'jurisdictionConceptId': 'ce6ef0fd-0060-575b-a1b7-15a73f75fd56',
}


# Variables del entorno que el flujo de alta (folder 01) deja pobladas. Un campo de body que se
# llame igual las referencia en vez de inventar un uuid.
SEEDED_VARS = {
    'tenantId', 'userId', 'ownerUserId', 'adminUserId', 'patientUserId', 'practitionerUserId',
    'personId', 'roleId', 'patientProfileId', 'practitionerProfileId',
    'countryConceptId', 'jurisdictionConceptId', 'payerTenantId', 'brokerTenantId',
}

# Variables que el propio recorrido de la colección captura (ver `capture_script`): cualquier
# `xxxId` de un body puede resolverse contra ellas si algún endpoint devolvió ese recurso.
DISCOVERED_VARS: set[str] = set()


def uuid_placeholder(name: str) -> str:
    """Valor de un campo uuid del body.

    Antes todos salían como `00000000-…`, un uuid con forma válida que **no existe en la base**:
    pasa la validación del DTO, llega al INSERT y revienta contra la FK como 500. Peor aún, ese
    500 no dice qué campo estaba mal.

    Ahora, si el campo se llama como una variable que la colección puebla —`tenantId`,
    `practiceId`, `checkId`—, se emite la referencia y el request se encadena solo. Si no, se
    emite un marcador que **no** parece un uuid: así el 400 del pipe de validación te lo señala
    antes de tocar la base, en vez de dejarte un 500 opaco.
    """
    if name in SEEDED_VARS or name in DISCOVERED_VARS:
        return '{{' + name + '}}'
    return f'<{name}: uuid del catálogo, ver GET /terminology/concepts>' \
        if name.endswith('ConceptId') else f'<{name}: uuid existente>'


# --------------------------------------------------------------------- schemas → ejemplos

class Resolver:
    """Resuelve `$ref` y genera valores de ejemplo a partir de los schemas del contrato."""

    def __init__(self, spec: dict):
        self.spec = spec

    def deref(self, node: dict) -> dict:
        """Sigue cadenas de `$ref` internas hasta el schema concreto."""
        seen = set()
        while isinstance(node, dict) and '$ref' in node:
            ref = node['$ref']
            if ref in seen:                      # ciclo: devolver algo inerte
                return {}
            seen.add(ref)
            cursor = self.spec
            for part in ref.lstrip('#/').split('/'):
                cursor = cursor.get(part, {}) if isinstance(cursor, dict) else {}
            node = cursor
        return node if isinstance(node, dict) else {}

    def example(self, schema: dict, name: str = '', depth: int = 0):
        """Valor de ejemplo para un schema, honrando example/enum/default/format."""
        schema = self.deref(schema)
        if not schema or depth > MAX_DEPTH:
            return {}

        if 'example' in schema:
            return schema['example']
        if 'default' in schema:
            return schema['default']
        if schema.get('enum'):
            return schema['enum'][0]

        # composición: quedarse con la primera rama y fusionar allOf
        if 'allOf' in schema:
            merged: dict = {'type': 'object', 'properties': {}, 'required': []}
            for part in schema['allOf']:
                part = self.deref(part)
                merged['properties'].update(part.get('properties', {}))
                merged['required'] += part.get('required', [])
            return self.example(merged, name, depth)
        for key in ('oneOf', 'anyOf'):
            if schema.get(key):
                return self.example(schema[key][0], name, depth)

        stype = schema.get('type')
        if stype == 'array':
            item = self.example(schema.get('items', {}), name, depth + 1)
            return [item] if item not in ({}, None) else []
        if stype == 'object' or 'properties' in schema:
            props = schema.get('properties') or {}
            if not props:
                extra = schema.get('additionalProperties')
                if isinstance(extra, dict):
                    return {'clave': self.example(extra, 'clave', depth + 1)}
                return {}
            return {p: self.example(s, p, depth + 1) for p, s in props.items()}
        if stype == 'boolean':
            return True
        if stype in ('integer', 'number'):
            minimum = schema.get('minimum')
            return minimum if isinstance(minimum, (int, float)) else 1
        return self.string_example(schema, name)

    @staticmethod
    def string_example(schema: dict, name: str) -> str:
        """Cadena de ejemplo por formato declarado y, en su defecto, por nombre de campo."""
        # Credenciales primero: en estos dos campos la variable de entorno vale más que el formato.
        if 'password' in name.lower():
            return '{{password}}'
        if name == 'email':
            return '{{email}}'
        fmt = schema.get('format', '')
        if fmt == 'uuid':
            return uuid_placeholder(name)
        if fmt == 'email':
            return 'usuario@example.test'
        if fmt == 'date-time':
            return '2026-01-01T00:00:00.000Z'
        if fmt == 'date':
            return '2026-01-01'
        if fmt == 'uri' or fmt == 'url':
            return 'https://example.test/recurso'
        if fmt == 'binary':
            return '<binario>'
        low = name.lower()
        # Solo los ids que el contrato declara uuid (1700 de 1766) o los refs de terminología:
        # `nationalId`, `externalAdAccountId`, `samlEntityId`… no son uuid y no deben fingirlo.
        if name == 'id' or name.endswith('ConceptId'):
            return uuid_placeholder(name)
        # Rangos de vigencia. `validFrom`, `effectiveTo`, `startsAt`… los valida `@IsDateString`,
        # pero el contrato no siempre declara `format: date`, así que por nombre no caían aquí y
        # salían como `validFrom-ejemplo`: un 400 en un campo que sí se podía rellenar solo.
        if (low.endswith('at') or 'date' in low or 'fecha' in low
                or re.search(r'(from|to|since|until|start|end|expir)', low)):
            return '2026-01-01T00:00:00.000Z'
        pattern = schema.get('pattern')
        if pattern:
            return f'<{name or "valor"}: {pattern}>'
        return f'{name or "valor"}-ejemplo'


# --------------------------------------------------------------------- operación → request

def success_status(op: dict, method: str) -> int:
    """Primer status 2xx documentado; si no hay, el convencional del método."""
    codes = sorted(int(c) for c in op.get('responses', {}) if c.isdigit() and 200 <= int(c) < 300)
    if codes:
        return codes[0]
    return 201 if method == 'POST' else 200


# Recursos cuyo singular no sale de quitar la `s`, o cuyo nombre natural ya está tomado.
IRREGULAR_SINGULAR = {
    'people': 'person', 'persons': 'person', 'addresses': 'address',
    'batches': 'batch', 'analyses': 'analysis', 'diagnoses': 'diagnosis',
    'policies': 'policy', 'categories': 'category', 'entries': 'entry',
    'queries': 'query', 'series': 'series', 'statuses': 'status',
}


def singularize(segment: str) -> str:
    """Singular aproximado de un segmento de ruta (`accreditations` → `accreditation`)."""
    low = segment.lower()
    if low in IRREGULAR_SINGULAR:
        return IRREGULAR_SINGULAR[low]
    for suffix, replacement in (('ies', 'y'), ('sses', 'ss'), ('xes', 'x'), ('ches', 'ch'),
                                ('shes', 'sh')):
        if low.endswith(suffix):
            return low[: -len(suffix)] + replacement
    if low.endswith('s') and not low.endswith('ss'):
        return low[:-1]
    return low


def camel(text: str) -> str:
    """`diagnostic-unit` → `diagnosticUnit`."""
    head, *rest = re.split(r'[-_]', text)
    return head + ''.join(part.capitalize() for part in rest)


def path_var_name(path: str, raw_name: str) -> str:
    """Nombre de la variable de entorno que respalda una variable de ruta.

    El contrato llama `id` a la variable de 350 rutas distintas. Si todas comparten `{{id}}`,
    el entorno solo puede tener un valor a la vez: pegás el id de una práctica y el request de
    acreditaciones lo manda igual, con lo que la API responde «no encontrado» sin que se vea por
    qué. Cada `{id}` pasa a llamarse por su recurso —`/accreditations/{id}` → `accreditationId`,
    `/identity/checks/{id}` → `checkId`—, así que dos dominios ya no se pisan.

    Las variables que el contrato ya nombra (`practiceId`, `caseId`) se respetan tal cual.
    """
    if raw_name != 'id':
        return raw_name
    # Último segmento estático antes de `{id}`: es el recurso al que pertenece.
    resource = ''
    for segment in path.strip('/').split('/'):
        if segment == '{id}':
            break
        if not re.fullmatch(r'\{\w+\}', segment):
            resource = segment
    if not resource:
        return 'id'
    return camel(singularize(resource)) + 'Id'


def path_var_value(name: str) -> str:
    return '{{' + name + '}}'


def build_url(path: str, query_params: list, resolver: Resolver) -> dict:
    """URL Postman con `:param` para el path y query params documentados."""
    segments = []
    variables = []
    for seg in path.strip('/').split('/'):
        if not seg:
            continue
        m = re.fullmatch(r'\{(\w+)\}', seg)
        if m:
            var = path_var_name(path, m.group(1))
            segments.append(':' + m.group(1))
            variables.append({'key': m.group(1), 'value': path_var_value(var),
                              'description': f'Identificador de ruta · variable `{{{{{var}}}}}`'})
        else:
            segments.append(seg)

    query = []
    for p in query_params:
        schema = p.get('schema', {})
        value = p.get('example', resolver.example(schema, p['name']))
        if isinstance(value, (dict, list)):
            value = ''
        query.append({
            'key': p['name'],
            'value': '' if value is None else str(value),
            'description': p.get('description', ''),
            # los opcionales van deshabilitados: se envían solo si el usuario los activa
            'disabled': not p.get('required', False),
        })

    raw = '{{baseUrl}}/' + '/'.join(segments)
    if query:
        raw += '?' + '&'.join(f"{q['key']}={q['value']}" for q in query if not q['disabled'])
        raw = raw.rstrip('?')
    url = {'raw': raw, 'host': ['{{baseUrl}}'], 'path': segments}
    if variables:
        url['variable'] = variables
    if query:
        url['query'] = query
    return url


def request_schema(op: dict) -> dict | None:
    """Schema del `requestBody`, priorizando JSON."""
    content = (op.get('requestBody') or {}).get('content') or {}
    schema = (content.get('application/json') or {}).get('schema')
    if schema is None:
        for node in content.values():                       # multipart, form-urlencoded, …
            if 'schema' in node:
                return node['schema']
    return schema


def only_required(schema: dict, resolver: Resolver) -> dict:
    """Recorta el schema a sus propiedades obligatorias.

    Los ejemplos de campos opcionales llevan uuid nulos que no existen en la base: mandar un
    `administrativeGenderConceptId` inventado revienta contra la FK. Para los flujos que se
    ejercen tal cual (el alta de usuarios) conviene el cuerpo mínimo que el DTO exige.
    """
    schema = resolver.deref(schema)
    if 'allOf' in schema:
        merged = {'type': 'object', 'properties': {}, 'required': []}
        for part in schema['allOf']:
            part = resolver.deref(part)
            merged['properties'].update(part.get('properties', {}))
            merged['required'] += part.get('required', [])
        schema = merged
    required = schema.get('required') or []
    props = schema.get('properties') or {}
    return {'type': 'object',
            'properties': {k: v for k, v in props.items() if k in required},
            'required': required}


def is_placeholder(value) -> bool:
    """Marcador que el usuario tiene que rellenar a mano (`<algoId: uuid existente>`)."""
    return isinstance(value, str) and value.startswith('<') and value.endswith('>')


def prune_placeholders(schema: dict, example, resolver: Resolver):
    """Quita del ejemplo los campos **opcionales** que quedaron en marcador.

    Un opcional que no se puede rellenar no documenta: rompe. `POST /practices` declara
    `typeConceptId` opcional, y mandarlo con un marcador hace que el request falle entero por un
    campo que el DTO no pedía. Omitirlo deja el alta ejecutable tal cual viene, que es lo que se
    espera de una colección: abrir el request y darle Send.

    Los **obligatorios** se conservan aunque sean marcador: ahí el hueco es real y hay que
    rellenarlo, y el nombre del campo en el 400 dice cuál.
    """
    if not isinstance(example, dict):
        return example
    schema = resolver.deref(schema)
    if 'allOf' in schema:
        merged = {'type': 'object', 'properties': {}, 'required': []}
        for part in schema['allOf']:
            part = resolver.deref(part)
            merged['properties'].update(part.get('properties', {}))
            merged['required'] += part.get('required', [])
        schema = merged
    required = set(schema.get('required') or [])
    props = schema.get('properties') or {}
    pruned = {}
    for key, value in example.items():
        if is_placeholder(value) and key not in required:
            continue
        if isinstance(value, dict) and key in props:
            value = prune_placeholders(props[key], value, resolver)
        pruned[key] = value
    return pruned


def build_body(op: dict, resolver: Resolver, required_only: bool = False):
    """Body raw JSON de ejemplo desde `requestBody`, o None si la operación no lleva cuerpo."""
    schema = request_schema(op)
    if schema is None:
        return None
    example = resolver.example(only_required(schema, resolver) if required_only else schema)
    example = prune_placeholders(schema, example, resolver)
    if example in ({}, None):
        return None
    return {'mode': 'raw',
            'raw': json.dumps(example, indent=2, ensure_ascii=False),
            'options': {'raw': {'language': 'json'}}}


def resource_var_for_path(path: str) -> str | None:
    """Variable donde guardar el id que devuelve una operación sobre esta ruta.

    `/practices` → `practiceId`; `/identity/checks/{id}/attempts` → `attemptId`. Es la misma
    convención que `path_var_name`, así que lo que crea un recurso puebla exactamente la variable
    que después consumen su `GET`, `PATCH` y `DELETE`: registrar algo deja listo el modificarlo.
    """
    segments = [s.split(':')[0] for s in path.strip('/').split('/')
                if not re.fullmatch(r'\{\w+\}', s)]
    segments = [s for s in segments if s and s != 'internal']
    if not segments:
        return None
    # El último segmento no siempre es el recurso: `/checks/dispatchable`,
    # `/deletion-targets/pending` y `/contexts/resolve` terminan en una acción o un filtro.
    # Se toma el último que esté en plural, que es como el contrato nombra las colecciones.
    tail = next((s for s in reversed(segments) if s.endswith('s')), segments[-1])
    var = camel(singularize(tail)) + 'Id'
    return var if var not in ('idId', 'Id') else None


def list_keys_for_path(path: str) -> list:
    """Claves donde un listado puede traer sus elementos.

    Además de las genéricas, el nombre del recurso: `GET /internal/identity/checks/dispatchable`
    responde `{"checks": [...]}`, y sin esto la captura no encontraba nada que guardar.
    """
    keys = ['items', 'data', 'results']
    segments = [s.split(':')[0] for s in path.strip('/').split('/')
                if not re.fullmatch(r'\{\w+\}', s) and s != 'internal']
    plural = next((s for s in reversed(segments) if s.endswith('s')), None)
    if plural:
        keys.insert(0, camel(plural))
    return keys


def capture_script(method: str, path: str) -> list:
    """Guarda en el entorno el id que devolvió la respuesta.

    Sin esto, cada `PATCH /recurso/{id}` obliga a copiar a mano el id de la creación anterior —y
    como todas las rutas llamaban `id` a su variable, pegar uno pisaba el de los otros 349
    endpoints. Con la captura, el recorrido queda encadenado: se crea, y lo que sigue ya tiene
    contra qué apuntar.

    Los `GET` de listado capturan el primer elemento: sirve para ejercer las modificaciones sobre
    datos que ya existen, sin tener que crear nada antes.
    """
    var = resource_var_for_path(path)
    if not var:
        return []
    if method == 'POST':
        return [
            '',
            f"// Deja el id en el entorno: los PATCH/PUT/DELETE de este recurso usan {{{{{var}}}}}.",
            'if (pm.response.code < 300) {',
            '  const body = pm.response.json();',
            '  const id = body && (body.id || body.' + var + ');',
            f"  if (id) pm.environment.set('{var}', id);",
            '}',
        ]
    if method == 'GET':
        candidates = ' || '.join(f'body.{k}' for k in list_keys_for_path(path))
        return [
            '',
            '// Toma el primero de la lista para poder ejercer el resto sin crear nada.',
            'if (pm.response.code === 200) {',
            '  const body = pm.response.json();',
            f'  const list = Array.isArray(body) ? body : ({candidates});',
            '  const first = Array.isArray(list) && list.length ? list[0] : null;',
            f"  if (first && first.id) pm.environment.set('{var}', first.id);",
            '}',
        ]
    return []


def test_script(method: str, path: str, status: int) -> list:
    """Test de status + captura de tokens en los endpoints de sesión."""
    lines = [
        f"pm.test('status {status}', function () {{",
        f"  pm.response.to.have.status({status});",
        "});",
    ]
    lines += capture_script(method, path)
    if (method, path) in TOKEN_CAPTURE:
        lines += [
            "",
            "// Guarda la sesión para que el resto de la colección herede el Bearer.",
            "if (pm.response.code === 200 || pm.response.code === 201) {",
            "  const body = pm.response.json();",
            "  if (body.accessToken) pm.environment.set('accessToken', body.accessToken);",
            "  if (body.refreshToken) pm.environment.set('refreshToken', body.refreshToken);",
            "}",
        ]
    return lines


def describe(op: dict, method: str, path: str, status: int, public: bool) -> str:
    parts = [op.get('description') or op.get('summary') or '']
    parts.append(f'`{method} {path}`')
    parts.append(f'Respuesta esperada: **{status}**')
    parts.append('Auth: pública (sin JWT)' if public else 'Auth: Bearer `{{accessToken}}`')
    errors = sorted(c for c in op.get('responses', {}) if c.isdigit() and int(c) >= 400)
    if errors:
        parts.append('Errores documentados: ' + ', '.join(errors))
    if op.get('operationId'):
        parts.append(f"operationId: `{op['operationId']}`")
    return '\n\n'.join(p for p in parts if p)


def to_request(method: str, path: str, op: dict, resolver: Resolver) -> dict:
    params = [resolver.deref(p) if '$ref' in p else p for p in op.get('parameters', [])]
    query_params = [p for p in params if p.get('in') == 'query']
    header_params = [p for p in params if p.get('in') == 'header']
    status = success_status(op, method)
    public = op.get('security') == []

    headers = []
    if op.get('requestBody'):
        headers.append({'key': 'Content-Type', 'value': 'application/json'})
    for p in header_params:
        headers.append({'key': p['name'],
                        'value': '{{' + p['name'].replace('-', '_') + '}}',
                        'description': p.get('description', ''),
                        'disabled': not p.get('required', False)})
    if not public and not any(h['key'].lower() == 'x-tenant-id' for h in headers):
        # Va habilitada: el interceptor solo deriva el tenant de la membresía del actor, y un
        # admin sin membresía (el caso del bootstrap) recibe 403 sin esta cabecera. Para un actor
        # con una sola membresía es redundante pero inocua, siempre que coincida con la suya.
        headers.append({'key': 'X-Tenant-Id', 'value': '{{tenantId}}',
                        'description': 'Tenant del request; debe pertenecer al actor salvo SUPERADMIN',
                        'disabled': False})

    request = {
        'method': method,
        'header': headers,
        'url': build_url(path, query_params, resolver),
        'description': describe(op, method, path, status, public),
    }
    body = build_body(op, resolver)
    replacement = BODY_REPLACE.get((method, path))
    if body and replacement:
        known = json.loads(body['raw'])
        unknown = [k for k in replacement if k not in known]
        if unknown:
            raise SystemExit(f'BODY_REPLACE inválido en {method} {path}: {unknown} no está(n) '
                             f'en el DTO. Campos reales: {sorted(known)}')
        body['raw'] = json.dumps(replacement, indent=2, ensure_ascii=False)
    if body:
        request['body'] = body
    if public:
        request['auth'] = {'type': 'noauth'}

    summary = op.get('summary') or f'{method} {path}'
    return {
        'name': f'{method} {path} · {summary}' if summary != f'{method} {path}' else summary,
        'request': request,
        'response': [],
        'event': [{'listen': 'test',
                   'script': {'type': 'text/javascript',
                              'exec': test_script(method, path, status)}}],
    }


# --------------------------------------------------------------------- organización en folders

def domain_of(path: str) -> str:
    first = path.strip('/').split('/')[0]
    return first if first else 'root'


def tag_of(op: dict) -> str:
    tags = op.get('tags') or []
    return tags[0] if tags else 'sin-tag'


def run_order(method: str, path: str) -> tuple:
    """Clave de orden dentro de un folder, para que correrlo entero tenga sentido.

    El orden del contrato es alfabético por ruta, así que un `PATCH /recurso/{id}` podía quedar
    antes del `POST /recurso` que lo crea: al correr el folder, el `PATCH` no tenía qué modificar
    y fallaba por un id vacío. Con las capturas ya en su sitio, lo único que faltaba era ordenar:

      1. listados sin parámetros — pueblan las variables con lo que ya existe en la base
      2. altas sin parámetros    — crean y capturan su id
      3. sub-altas               — cuelgan de algo creado arriba
      4. lecturas por id
      5. modificaciones
      6. bajas                   — al final, para no borrar lo que el resto todavía usa

    Es el recorrido de un cliente: descubrir, registrar, consultar, modificar y recién ahí borrar.
    """
    has_param = '{' in path
    if method == 'DELETE':
        return (6, path)
    if method in ('PATCH', 'PUT'):
        return (5, path)
    if method == 'GET':
        return (4, path) if has_param else (1, path)
    if method == 'POST':
        return (3, path) if has_param else (2, path)
    return (7, path)


def build_folders(spec: dict, resolver: Resolver) -> tuple[list, int, dict]:
    """Un folder por dominio; los dominios grandes se parten en subfolders por tag."""
    domains: dict[str, list] = {}
    index: dict[tuple, dict] = {}
    total = 0
    for path, methods in spec['paths'].items():
        for method, op in methods.items():
            if method not in METHODS:
                continue
            request = to_request(method.upper(), path, op, resolver)
            index[(method.upper(), path)] = request
            order = run_order(method.upper(), path)
            domains.setdefault(domain_of(path), []).append((tag_of(op), order, request))
            total += 1

    folders = []
    for domain in sorted(domains):
        entries = sorted(domains[domain], key=lambda e: e[1])
        tags = sorted({t for t, _, _ in entries})
        if len(entries) >= SUBFOLDER_MIN and len(tags) > 1:
            items = [{'name': tag, 'item': [r for t, _, r in entries if t == tag]} for tag in tags]
        else:
            items = [r for _, _, r in entries]
        folders.append({'name': f'{domain} ({len(entries)})', 'item': items})
    return folders, total, index


# Atajos que se copian al folder inicial: sin sesión el resto de la colección da 401.
STARTER = [('GET', '/health'), ('POST', '/iam/auth/login'), ('POST', '/iam/auth/token/refresh'),
           ('GET', '/terminology/concepts')]

# Tipos de organización que solo declaran dónde operan: el cuerpo es el mismo y solo cambia
# `tenantType`. Se emiten uno por uno, y no como una nota que diga «cambiá el tipo», porque
# `yarn postman:verify` solo prueba lo que existe como request: un tipo sin request es un tipo
# que nadie comprueba que se pueda registrar.
TERRITORIAL_ORG_TYPES = [
    ('UNIVERSITY', 'UNI', 'Universidad', 'universidad'),
    ('PHARMACY', 'FAR', 'Farmacia', 'farmacia'),
    ('HOSPITAL', 'HOS', 'Hospital', 'hospital'),
    ('MEDICAL_OFFICE', 'CON', 'Consultorio', 'consultorio'),
    ('NURSING', 'ENF', 'Enfermería', 'enfermería'),
    ('HEALTH_OTHER', 'OTR', 'Otra institución de salud', 'institución de salud'),
    ('HEALTH_BUSINESS', 'NEG', 'Negocio de salud', 'negocio de salud'),
]


def territorial_org_step(code: str, prefix: str, label: str, noun: str) -> dict:
    """Paso de alta para un tipo de organización territorial."""
    return {
        'name': f'Organización {code} · {label.lower()}',
        'key': ('POST', '/iam/auth/register-organization'),
        'note': (f'Alta de {noun}. Mismo endpoint y mismo cuerpo que el PROVIDER: los tipos '
                 f'territoriales solo exigen país y jurisdicción, que es lo que determina bajo '
                 f'qué regulador operan. No materializan fila propia —operan por sus sedes— a '
                 f'diferencia de PAYER y BROKER.'),
        'patch': {'organization': {'code': f'{prefix}-{{{{$timestamp}}}}',
                                   'legalName': f'{label} de prueba {{{{$timestamp}}}}',
                                   'tenantType': code,
                                   'countryConceptId': '{{countryConceptId}}',
                                   'jurisdictionConceptId': '{{jurisdictionConceptId}}'},
                  'owner': {'email': f'{prefix.lower()}-{{{{$timestamp}}}}@example.test',
                            'password': '{{password}}',
                            'displayName': f'Owner de {noun}'}},
        'capture': [],
    }


# Alta de usuarios por tipo. El contrato solo expone dos roles iniciales (USER y SECURITY_ADMIN);
# los 120 roles de negocio se conceden después, por tenant, vía authz. Cada entrada clona la
# operación de su dominio y le fija el cuerpo del caso concreto — sin inventar endpoints.
SIGNUP_FLOW = [
    {
        'name': 'Organización · autoregistro público (tenant + cuenta owner)',
        'key': ('POST', '/iam/auth/register-organization'),
        'note': ('Alta pública desde cero: crea en una transacción el usuario owner con su '
                 'credencial y rol, el tenant, la membresía que los une y el token de verificación '
                 'de email. La organización queda pendiente de verificación por la plataforma, '
                 'pero el owner puede iniciar sesión de inmediato.\n\n'
                 '`tenantType` es obligatorio y cada tipo exige lo suyo: PAYER el bloque `payer` '
                 '(que crea la aseguradora) y BROKER el bloque `broker` (que crea el corredor); '
                 'los territoriales —PROVIDER, UNIVERSITY, PHARMACY, HOSPITAL, MEDICAL_OFFICE, '
                 'NURSING, HEALTH_OTHER y HEALTH_BUSINESS— país y jurisdicción.'),
        'patch': {'organization': {'code': 'ORG-{{$timestamp}}',
                                   'legalName': 'Organización de prueba {{$timestamp}}',
                                   'tenantType': 'PROVIDER',
                                   'countryConceptId': '{{countryConceptId}}',
                                   'jurisdictionConceptId': '{{jurisdictionConceptId}}'},
                  'owner': {'email': 'owner-{{$timestamp}}@example.test',
                            'password': '{{password}}',
                            'displayName': 'Owner de prueba'}},
        'capture': [('tenantId', ['tenantId']), ('ownerUserId', ['ownerUserId'])],
    },
    {
        'name': 'Organización PAYER · aseguradora (bloque `payer`)',
        'key': ('POST', '/iam/auth/register-organization'),
        'note': ('Mismo endpoint, tipo distinto. `tenantType: PAYER` **exige** el bloque `payer` y '
                 'rechaza el de `broker`: mandar los dos devuelve 422. `carrierCode` y '
                 '`regulatorIdentifier` son obligatorios; `country`/`jurisdictionConceptId` de la '
                 'organización solo los pide PROVIDER.'),
        'patch': {'organization': {'code': 'PAY-{{$timestamp}}',
                                   'legalName': 'Aseguradora de prueba {{$timestamp}}',
                                   'tenantType': 'PAYER',
                                   'payer': {'carrierCode': 'CAR-{{$timestamp}}',
                                             'regulatorIdentifier': 'REG-{{$timestamp}}',
                                             'jurisdictionConceptId': '{{jurisdictionConceptId}}'}},
                  'owner': {'email': 'payer-{{$timestamp}}@example.test',
                            'password': '{{password}}',
                            'displayName': 'Owner de aseguradora'}},
        'capture': [('payerTenantId', ['tenantId'])],
    },
    {
        'name': 'Organización BROKER · corredora (bloque `broker`)',
        'key': ('POST', '/iam/auth/register-organization'),
        'note': ('`tenantType: BROKER` exige el bloque `broker` y rechaza el de `payer`. '
                 '`brokerCode` y `licenseNumber` son obligatorios.'),
        'patch': {'organization': {'code': 'BRK-{{$timestamp}}',
                                   'legalName': 'Corredora de prueba {{$timestamp}}',
                                   'tenantType': 'BROKER',
                                   'broker': {'brokerCode': 'BRO-{{$timestamp}}',
                                              'licenseNumber': 'LIC-{{$timestamp}}',
                                              'jurisdictionConceptId': '{{jurisdictionConceptId}}'}},
                  'owner': {'email': 'broker-{{$timestamp}}@example.test',
                            'password': '{{password}}',
                            'displayName': 'Owner de corredora'}},
        'capture': [('brokerTenantId', ['tenantId'])],
    },
    *[territorial_org_step(*args) for args in TERRITORIAL_ORG_TYPES],
    {
        'name': 'Profesional · autoregistro público (matrícula PENDIENTE)',
        'key': ('POST', '/iam/auth/register-practitioner'),
        'note': ('Alta pública desde cero, sin admin: crea cuenta + credencial + rol + persona + '
                 'perfil profesional + licencia + título + idioma + membresía en una transacción. '
                 'La licencia nace PENDIENTE de verificación: registrarse declara la matrícula, '
                 'no la prueba, así que el perfil no aparece como habilitado ni acepta pacientes.'),
        'patch': {'email': 'medico-{{$timestamp}}@example.test', 'password': '{{password}}',
                  'displayName': 'Dra. de prueba', 'licenseNumber': 'MP-{{$timestamp}}',
                  'credentialNumber': 'TIT-{{$timestamp}}', 'phone': '+591 70012345',
                  'gender': 'FEMALE', 'sexAtBirth': 'FEMALE', 'birthDate': '1985-04-12'},
        'capture': [('practitionerUserId', ['userId']),
                    ('practitionerProfileId', ['practitionerProfileId'])],
    },
    {
        'name': 'Paciente · autoregistro público (sin token)',
        'key': ('POST', '/iam/auth/register-patient'),
        'note': ('Único alta que no exige token. El paciente inicia sesión con su documento '
                 'de identidad, no con email.'),
        'patch': {'nationalId': 'CI-{{$timestamp}}', 'email': 'paciente-{{$timestamp}}@example.test',
                  'password': '{{password}}', 'displayName': 'Paciente de prueba',
                  'phone': '+591 70055555', 'gender': 'MALE', 'sexAtBirth': 'MALE'},
        'capture': [('patientUserId', ['id', 'userId']),
                    ('activationToken', ['activationToken', 'token'])],
    },
    {
        'name': 'Paciente · registro asistido por un clínico',
        'key': ('POST', '/iam/users/assisted-registration'),
        'note': 'Requiere token con rol CLINICIAN o SECURITY_ADMIN. Devuelve el token de activación.',
        'patch': {'email': 'asistido-{{$timestamp}}@example.test',
                  'displayName': 'Paciente asistido', 'reason': 'Alta asistida de prueba'},
        'capture': [('patientUserId', ['id', 'userId']),
                    ('activationToken', ['activationToken', 'token'])],
    },
    {
        'name': 'Paciente · activar cuenta y fijar contraseña',
        'key': ('POST', '/iam/auth/activate'),
        'note': 'Consume `{{activationToken}}` capturado por cualquiera de los dos altas anteriores.',
        'patch': {'activationToken': '{{activationToken}}', 'newPassword': '{{password}}'},
        'capture': [],
    },
    {
        'name': 'Usuario estándar · initialRole USER',
        'key': ('POST', '/iam/users'),
        'note': 'Requiere token SECURITY_ADMIN. Es el alta genérica de personal.',
        'patch': {'email': 'usuario-{{$timestamp}}@example.test', 'password': '{{password}}',
                  'initialRole': 'USER', 'displayName': 'Usuario de prueba'},
        'capture': [('userId', ['id'])],
    },
    {
        'name': 'Administrador de seguridad · initialRole SECURITY_ADMIN',
        'key': ('POST', '/iam/users'),
        'note': 'Mismo endpoint, rol inicial distinto: este usuario ya puede dar de alta a otros.',
        'patch': {'email': 'admin-{{$timestamp}}@example.test', 'password': '{{password}}',
                  'initialRole': 'SECURITY_ADMIN', 'displayName': 'Admin de prueba'},
        'capture': [('adminUserId', ['id'])],
    },
    {
        'name': 'Elevar a SUPERADMIN · rol global',
        'key': ('POST', '/iam/users/{id}/global-roles'),
        'note': ('Los roles globales son USER, SECURITY_ADMIN y SUPERADMIN. SUPERADMIN es el único '
                 'que puede declarar `X-Tenant-Id` de cualquier tenant.'),
        'patch': {'role': 'SUPERADMIN', 'action': 'GRANT'},
        'path_vars': {'id': '{{adminUserId}}'},
        'capture': [],
    },
    {
        'name': 'Perfil de paciente · alta de persona',
        'key': ('POST', '/profiles/patients'),
        'note': ('El usuario IAM y el perfil clínico son entidades distintas: esto crea persona + '
                 'perfil de persona + perfil de paciente, pero **no** una cuenta. Es el alta de un '
                 'paciente que no inicia sesión (ventanilla, menor, registro por MPI).'),
        'patch': {'patientCode': 'PAT-{{$timestamp}}'},
        'capture': [('patientProfileId', ['id', 'profileId']), ('personId', ['personId'])],
    },
    {
        'name': 'Vincular cuenta de portal a la persona',
        'key': ('POST', '/profiles/persons/{personId}/account-links'),
        'note': ('Cierra el hueco anterior: engancha el usuario IAM con la persona clínica. Es un '
                 'paso aparte porque `uq_person_account_links_active_user` solo admite un vínculo '
                 'activo por usuario, y porque hay pacientes que nunca tendrán cuenta.'),
        'patch': {'userId': '{{userId}}'},
        'path_vars': {'personId': '{{personId}}'},
        'capture': [],
    },
    {
        'name': 'Perfil de profesional de salud',
        'key': ('POST', '/profiles/practitioners'),
        'note': 'Perfil workforce del clínico; su licencia se registra aparte (jurisdiction-authorizations).',
        'patch': {'practitionerCode': 'PRC-{{$timestamp}}'},
        'capture': [('practitionerProfileId', ['id', 'profileId'])],
    },
    {
        'name': 'Rol de negocio · componer el rol',
        'key': ('POST', '/authz/roles'),
        'note': ('Los 120 roles que guardan los endpoints (CLINICIAN, ERP_ADMIN, SURGEON…) no son '
                 '`initialRole`: se componen aquí y se asignan por tenant en el paso siguiente.'),
        'patch': {'code': 'ROL-{{$timestamp}}', 'name': 'Rol de prueba'},
        'capture': [('roleId', ['id', 'roleId'])],
    },
    {
        'name': 'Rol de negocio · asignar a un usuario',
        'key': ('POST', '/authz/users/{userId}/role-assignments'),
        'note': 'Cierra el flujo: el usuario pasa a tener el rol dentro del tenant indicado.',
        'patch': {'roleId': '{{roleId}}', 'tenantId': '{{tenantId}}'},
        'path_vars': {'userId': '{{userId}}'},
        'capture': [],
    },
]

# Variables que solo produce el flujo de alta (las de path las recolecta collect_env_keys).
EXTRA_ENV_KEYS = ['adminUserId', 'patientUserId', 'patientProfileId', 'practitionerProfileId',
                  'activationToken', 'roleId', 'personId', 'ownerUserId',
                  'practitionerUserId', 'countryConceptId', 'jurisdictionConceptId',
                  'payerTenantId', 'brokerTenantId']


def starter_folder(index: dict) -> dict | None:
    """Folder de arranque: health + login (que puebla `accessToken`) + refresh."""
    items = [index[key] for key in STARTER if key in index]
    if not items:
        return None
    return {
        'name': '00 · Empezar aquí (sesión)',
        'description': ('Correr **POST /iam/auth/login** antes que nada: su test guarda '
                        '`accessToken` y `refreshToken` en el entorno y el resto de la colección '
                        'los hereda. Son los mismos requests que viven en sus dominios.\n\n'
                        'Si aún no hay ningún administrador en la base, el primero no se puede '
                        'crear por API (`POST /iam/users` exige SECURITY_ADMIN y el seed de '
                        'arranque no siembra ninguno): correr antes `yarn postman:bootstrap`.\n\n'
                        '**GET /terminology/concepts** es la pieza que hace usable el resto de la '
                        'colección: casi 300 campos `*ConceptId` piden un uuid del catálogo, y esta '
                        'búsqueda es la única forma de averiguarlo (`?q=GENDER`, `?q=PHONE`…). '
                        'Los uuid de ejemplo de los bodies **no existen** en la base.'),
        'item': items,
    }


def signup_folder(spec: dict, resolver: Resolver, index: dict) -> dict | None:
    """Folder de alta de usuarios por tipo, encadenado por variables de entorno."""
    items = []
    synced: set[tuple] = set()
    for step in SIGNUP_FLOW:
        source = index.get(step['key'])
        if source is None:
            continue
        request = copy.deepcopy(source)
        request['name'] = step['name']
        method, path = step['key']
        op = spec['paths'][path][method.lower()]
        minimal = build_body(op, resolver, required_only=True)
        if minimal:
            request['request']['body'] = minimal
        body = request['request'].get('body')
        if body and step['patch']:
            payload = json.loads(body['raw'])
            # El pipe global corre con `forbidNonWhitelisted`: un campo que el DTO no declara
            # devuelve 400. Si el contrato renombra una propiedad, esto lo delata al generar
            # en vez de dejar un request roto en la colección.
            # El patch se valida contra el DTO completo (puede fijar un campo opcional que el
            # cuerpo mínimo omite, como el email del autoregistro), no contra el cuerpo recortado.
            full = build_body(op, resolver)
            declared = set(json.loads(full['raw'])) if full else set(payload)
            unknown = [k for k in step['patch'] if k not in declared]
            if unknown:
                raise SystemExit(
                    f"Patch inválido en «{step['name']}»: {unknown} no existe(n) en el DTO de "
                    f"{step['key'][0]} {step['key'][1]}. Campos reales: {sorted(declared)}")
            payload.update(step['patch'])
            body['raw'] = json.dumps(payload, indent=2, ensure_ascii=False)
        for key, value in step.get('path_vars', {}).items():
            for variable in request['request']['url'].get('variable', []):
                if variable['key'] == key:
                    variable['value'] = value
        request['request']['description'] = f"{step['note']}\n\n{request['request']['description']}"
        if step['capture']:
            lines = request['event'][0]['script']['exec']
            lines += ['', '// Encadena el alta: deja los ids en el entorno para los pasos siguientes.',
                      'if (pm.response.code < 300) {', '  const body = pm.response.json();']
            for var, fields in step['capture']:
                candidates = ' || '.join(f'body.{f}' for f in fields)
                lines.append(f"  const {var} = {candidates};")
                lines.append(f"  if ({var}) pm.environment.set('{var}', {var});")
            lines.append('}')

        # El request que vive en su dominio se queda con este mismo cuerpo. El ejemplo derivado
        # del schema emite **todos** los campos opcionales a la vez, y en las altas eso no es
        # documentación: es un request roto. `register-organization` lo enseñaba entero —
        # `payer` y `broker` juntos bajo un `tenantType: PROVIDER` (422), uuid de concepto
        # inexistentes (500 por FK) y `{{email}}`, que es el admin ya registrado (409).
        # Los campos opcionales siguen descritos en el contrato; el body sirve para correrlo.
        if body and step['key'] not in synced:
            synced.add(step['key'])
            source['request']['body'] = copy.deepcopy(body)
            source['request']['description'] = (
                'Cuerpo ejecutable, el mismo del folder «01 · Alta de usuarios (por tipo)», donde '
                'está el flujo completo y sus variantes.\n\n' + source['request']['description'])
        items.append(request)
    if not items:
        return None
    return {
        'name': '01 · Alta de usuarios (por tipo)',
        'description': (
            'Un request por tipo de alta, en orden de dependencia. Los ids se capturan en el '
            'entorno, así que se pueden correr en cadena.\n\n'
            'El contrato solo expone dos roles iniciales — `USER` y `SECURITY_ADMIN` — más '
            '`SUPERADMIN` por concesión de rol global. Los 120 roles que guardan los endpoints '
            '(CLINICIAN, ERP_ADMIN, SURGEON…) **no** son roles de alta: se componen en '
            '`POST /authz/roles` y se asignan por tenant en `POST /authz/users/{userId}/role-assignments`.\n\n'
            'Los emails llevan `{{$timestamp}}` para que reejecutar no choque con el 409 de email en uso.'
        ),
        'item': items,
    }


def collect_env_keys(spec: dict) -> list:
    """Variables de path y de cabecera que la colección referencia."""
    keys = set(DISCOVERED_VARS)
    for path in spec['paths']:
        for raw in re.findall(r'\{(\w+)\}', path):
            keys.add(path_var_name(path, raw))
    for methods in spec['paths'].values():
        for method, op in methods.items():
            if method not in METHODS:
                continue
            for p in op.get('parameters', []):
                if p.get('in') == 'header':
                    keys.add(p['name'].replace('-', '_'))
    return sorted(keys)




# --------------------------------------------------------------------- colecciones por actor

# Un recorrido por tipo de usuario, espejo de los smokes `test/smoke/modules/<actor>.smoke.ts`.
#
# La colección completa sirve para explorar los 878 endpoints, pero no para ponerse en la piel de
# alguien: quien prueba «como paciente» no quiere 121 dominios, quiere los diez requests que un
# paciente puede ejecutar, en orden, y con las credenciales de un paciente. Cada actor lleva su
# entorno propio para que las sesiones no se pisen — con un solo entorno, iniciar sesión como
# médico borra el token del paciente y los siguientes requests fallan sin decir por qué.
#
# Los pasos salen de los mismos recorridos que el smoke ejercita contra la API real, así que lo
# que está aquí es lo que se sabe que funciona.
ACTOR_COLLECTIONS = [
    {
        'slug': 'paciente',
        'name': 'Paciente',
        'summary': ('Autoregistro público, sesión con documento de identidad, verificación de '
                    'identidad y datos propios. Es el único actor que inicia sesión con su '
                    'documento y no con un correo.'),
        'env': {'password': 'S3cret-passw0rd', 'nationalId': ''},
        'steps': [
            {'method': 'POST', 'path': '/iam/auth/register-patient', 'public': True,
             'title': '1 · Se registra solo, sin admin ni token',
             'note': ('Alta pública. El pre-request fija el documento en el entorno para que el '
                      'login del paso 2 use exactamente el mismo, y para que reejecutar no choque '
                      'con el 409 de documento en uso.'),
             'prerequest': ["pm.environment.set('nationalId', 'CI-' + Date.now());"],
             'body': {'nationalId': '{{nationalId}}', 'password': '{{password}}',
                      'displayName': 'Paciente de prueba', 'phone': '+591 70055555',
                      'gender': 'MALE', 'sexAtBirth': 'MALE'},
             'status': 201,
             'captures': [('patientUserId', 'userId'), ('personId', 'personId'),
                          ('patientProfileId', 'patientProfileId')]},
            {'method': 'POST', 'path': '/iam/auth/login', 'public': True,
             'title': '2 · Inicia sesión con su documento',
             'note': 'El paciente entra con su documento, no con un correo.',
             'body': {'nationalId': '{{nationalId}}', 'password': '{{password}}'},
             'status': 200,
             'captures': [('accessToken', 'accessToken'), ('refreshToken', 'refreshToken')]},
            {'method': 'POST', 'path': '/common/files',
             'title': '3 · Sube la foto de su documento',
             'note': 'La evidencia con la que se abrirá el caso: sin ella no hay qué contrastar.',
             'body': {'originalName': 'documento.jpg', 'category': 'DOCUMENT',
                      'sensitivity': 'NORMAL', 'mimeType': 'image/jpeg', 'sizeBytes': 4096,
                      'contentHash': 'pac-{{$timestamp}}',
                      'storageUri': 's3://bucket/documento.jpg'},
             'status': 201, 'captures': [('evidenceFileId', 'id')]},
            {'method': 'POST', 'path': '/identity/me/identity-verification',
             'title': '4 · Abre su caso de verificación de identidad',
             'body': {'evidenceFileId': '{{evidenceFileId}}'},
             'status': 201, 'captures': [('caseId', 'id')]},
            {'method': 'GET', 'path': '/identity/me/verification-cases',
             'title': '5 · Lista sus propios casos', 'status': 200},
            {'method': 'GET', 'path': '/identity/me/verification-cases/{caseId}',
             'title': '6 · Ve el detalle de su caso',
             'note': 'Filtra por id **y** titular: el caso de otro paciente responde 404.',
             'status': 200},
            {'method': 'POST', 'path': '/profiles/patients/{patientProfileId}/related-persons',
             'title': '7 · Registra a su familiar responsable',
             'body': {'personId': '{{personId}}', 'displayName': 'Familiar responsable',
                      'isEmergencyContact': True},
             'status': 201},
            {'method': 'POST', 'path': '/iam/auth/logout',
             'title': '8 · Cierra su sesión',
             'body': {'refreshToken': '{{refreshToken}}'}, 'status': 200},
        ],
    },
    {
        'slug': 'medico',
        'name': 'Médico',
        'summary': ('Autoregistro con matrícula, verificación de identidad y de licencia, y perfil '
                    'profesional. La matrícula nace PENDIENTE: registrarse la declara, no la '
                    'prueba, así que el perfil no queda habilitado por el solo hecho de darse de '
                    'alta.'),
        'env': {'password': 'S3cret-passw0rd', 'email': ''},
        'steps': [
            {'method': 'POST', 'path': '/iam/auth/register-practitioner', 'public': True,
             'title': '1 · Se registra declarando su matrícula',
             'note': ('Crea cuenta, persona, perfil profesional y licencia en una transacción. '
                      'La licencia nace PENDIENTE de verificación.'),
             'prerequest': ["pm.environment.set('email', 'medico-' + Date.now() + '@example.test');"],
             'body': {'email': '{{email}}', 'password': '{{password}}',
                      'displayName': 'Dra. de prueba', 'licenseNumber': 'MP-{{$timestamp}}',
                      'credentialNumber': 'TIT-{{$timestamp}}', 'phone': '+591 70012345',
                      'gender': 'FEMALE', 'sexAtBirth': 'FEMALE', 'birthDate': '1985-04-12'},
             'status': 201,
             'captures': [('practitionerUserId', 'userId'), ('personId', 'personId'),
                          ('practitionerProfileId', 'practitionerProfileId')]},
            {'method': 'POST', 'path': '/iam/auth/login', 'public': True,
             'title': '2 · Inicia sesión con su correo',
             'body': {'email': '{{email}}', 'password': '{{password}}'}, 'status': 200,
             'captures': [('accessToken', 'accessToken'), ('refreshToken', 'refreshToken')]},
            {'method': 'POST', 'path': '/common/files',
             'title': '3 · Sube el certificado de su matrícula',
             'body': {'originalName': 'matricula.pdf', 'category': 'DOCUMENT',
                      'sensitivity': 'NORMAL', 'mimeType': 'application/pdf', 'sizeBytes': 8192,
                      'contentHash': 'med-{{$timestamp}}',
                      'storageUri': 's3://bucket/matricula.pdf'},
             'status': 201, 'captures': [('evidenceFileId', 'id')]},
            {'method': 'POST', 'path': '/identity/me/practitioner/identity-verification',
             'title': '4 · Abre su caso de verificación de identidad',
             'body': {'evidenceFileId': '{{evidenceFileId}}'}, 'status': 201},
            {'method': 'POST',
             'path': '/profiles/practitioners/{practitionerProfileId}/jurisdiction-authorizations',
             'title': '5 · Registra la jurisdicción donde puede ejercer',
             'note': ('Tiene que existir antes del paso 6: el caso se abre sobre una matrícula '
                      'concreta, no sobre el profesional en abstracto.'),
             'body': {'licenseNumber': 'MP-JUR-{{$timestamp}}'},
             'status': 201, 'captures': [('jurisdictionAuthorizationId', 'id')]},
            {'method': 'POST', 'path': '/identity/me/practitioner/license-verification',
             'title': '6 · Pide que le verifiquen la matrícula',
             'note': ('El caso que distingue al profesional del paciente: además de probar quién '
                      'es, tiene que probar que puede ejercer.'),
             'body': {'evidenceFileId': '{{evidenceFileId}}',
                      'jurisdictionAuthorizationId': '{{jurisdictionAuthorizationId}}'},
             'status': 201},
            {'method': 'GET', 'path': '/identity/me/verification-cases',
             'title': '7 · Ve sus dos casos abiertos (identidad y matrícula)', 'status': 200},
            {'method': 'POST',
             'path': '/profiles/practitioners/{practitionerProfileId}/specialties',
             'title': '8 · Declara su especialidad',
             'body': {'isPrimary': True, 'boardCertified': False}, 'status': 201},
            {'method': 'POST', 'path': '/iam/auth/logout',
             'title': '9 · Cierra su sesión',
             'body': {'refreshToken': '{{refreshToken}}'}, 'status': 200},
        ],
    },
    {
        'slug': 'organizacion',
        'name': 'Organización',
        'summary': ('Autoregistro del tenant con su cuenta owner, petición de verificación y —una '
                    'vez que la plataforma la activa— sedes y personal. Mientras está PENDIENTE '
                    'puede prepararse pero no operar; el paso 5 fija ese límite.'),
        'env': {'password': 'S3cret-passw0rd', 'email': '', 'staffEmail': '',
                'adminEmail': 'admin@redesa.test', 'adminPassword': 'S3cret-passw0rd',
                'platformToken': ''},
        'steps': [
            {'method': 'POST', 'path': '/iam/auth/register-organization', 'public': True,
             'title': '1 · Se registra con su cuenta owner',
             'note': ('Crea tenant, usuario owner, credencial y la membresía OWNER que los une. '
                      'La organización nace PENDIENTE de verificación.'),
             'prerequest': ["pm.environment.set('email', 'owner-' + Date.now() + '@example.test');",
                            "pm.environment.set('orgCode', 'ORG-' + Date.now());"],
             'body': {'organization': {'code': '{{orgCode}}',
                                       'legalName': 'Organización de prueba',
                                       'tenantType': 'HOSPITAL',
                                       'countryConceptId': '{{countryConceptId}}',
                                       'jurisdictionConceptId': '{{jurisdictionConceptId}}'},
                      'owner': {'email': '{{email}}', 'password': '{{password}}',
                                'displayName': 'Owner de prueba'}},
             'status': 201,
             'captures': [('tenantId', 'tenantId'), ('ownerUserId', 'ownerUserId')]},
            {'method': 'POST', 'path': '/iam/auth/login', 'public': True,
             'title': '2 · El owner inicia sesión de inmediato',
             'note': 'No espera a la verificación: puede entrar y preparar su organización.',
             'body': {'email': '{{email}}', 'password': '{{password}}'}, 'status': 200,
             'captures': [('accessToken', 'accessToken'), ('refreshToken', 'refreshToken')]},
            {'method': 'POST', 'path': '/common/files',
             'title': '3 · Sube su documentación legal',
             'body': {'originalName': 'personeria.pdf', 'category': 'DOCUMENT',
                      'sensitivity': 'NORMAL', 'mimeType': 'application/pdf', 'sizeBytes': 16384,
                      'contentHash': 'org-{{$timestamp}}',
                      'storageUri': 's3://bucket/personeria.pdf'},
             'status': 201, 'captures': [('evidenceFileId', 'id')]},
            {'method': 'POST', 'path': '/identity/me/tenants/{tenantId}/verification',
             'title': '4 · Pide que la plataforma la verifique',
             'note': ('Pedirla es lo máximo que puede hacer: quien contrasta licencia y '
                      'personería es la plataforma. Auto-verificarse sería un agujero '
                      'regulatorio.'),
             'body': {'evidenceFileId': '{{evidenceFileId}}'}, 'status': 201},
            {'method': 'POST', 'path': '/tenants/{tenantId}/branches',
             'title': '5 · LÍMITE · pendiente de verificación no puede abrir sedes',
             'note': ('Este paso **debe** dar 422. Preparase sí, operar no: abrir una sede es '
                      'operar. Se activa en el paso 7.'),
             'body': {'code': 'SEDE-PREMATURA-{{$timestamp}}', 'name': 'Sede prematura'},
             'status': 422},
            {'method': 'POST', 'path': '/iam/auth/login', 'public': True,
             'title': '6 · SETUP · sesión de la plataforma (credenciales de administrador)',
             'note': ('El único paso que no ejecuta el owner. Está aquí para que el recorrido se '
                      'pueda correr entero de una vez, y guarda el token en `platformToken` '
                      'aparte, sin pisar la sesión del owner.'),
             'body': {'email': '{{adminEmail}}', 'password': '{{adminPassword}}'},
             'status': 200, 'captures': [('platformToken', 'accessToken')]},
            {'method': 'POST', 'path': '/admin/tenants/{tenantId}/verification',
             'as': 'plataforma',
             'title': '7 · La plataforma la verifica y queda ACTIVA',
             'status': 200},
            {'method': 'POST', 'path': '/tenants/{tenantId}/branches',
             'title': '8 · Ahora sí, abre su primera sede',
             'note': ('Lo hace el owner con su propio token: su poder viene de la membresía '
                      'OWNER, no de un rol global de plataforma.'),
             'body': {'code': 'SEDE-{{$timestamp}}', 'name': 'Sede Central',
                      'branchType': 'CLINIC'},
             'status': 201, 'captures': [('branchId', 'id')]},
            {'method': 'POST', 'path': '/iam/auth/register-practitioner', 'public': True,
             'title': '9 · SETUP · una persona a quien incorporar',
             'note': ('Se usa el autoregistro público de profesionales para no depender de un '
                      'administrador: el owner no puede crear cuentas IAM, pero sí incorporar a '
                      'quien ya tiene una.'),
             'prerequest': ["pm.environment.set('staffEmail', 'staff-' + Date.now() + '@example.test');"],
             'body': {'email': '{{staffEmail}}', 'password': '{{password}}',
                      'displayName': 'Profesional a incorporar',
                      'licenseNumber': 'MP-ST-{{$timestamp}}',
                      'credentialNumber': 'TIT-ST-{{$timestamp}}'},
             'status': 201, 'captures': [('staffUserId', 'userId')]},
            {'method': 'POST', 'path': '/tenants/{tenantId}/memberships',
             'title': '10 · Lo incorpora a la organización',
             'body': {'userId': '{{staffUserId}}', 'role': 'STAFF',
                      'accessScope': 'ALL_TENANT'},
             'status': 201, 'captures': [('membershipId', 'id')]},
            {'method': 'PATCH', 'path': '/tenants/{tenantId}/memberships/{membershipId}/role',
             'title': '11 · Lo asciende a ADMIN de la organización',
             'body': {'role': 'ADMIN'}, 'status': 200},
            {'method': 'POST',
             'path': '/tenants/{tenantId}/memberships/{membershipId}/branch-assignments',
             'title': '12 · Lo asigna a la sede',
             'body': {'branchId': '{{branchId}}'}, 'status': 201},
            {'method': 'POST',
             'path': '/tenants/{tenantId}/memberships/{membershipId}/offboard',
             'title': '13 · Lo da de baja — la membresía sobrevive',
             'note': ('Baja lógica: la fila no se borra porque de ella cuelga qué pudo ver esa '
                      'persona y cuándo, que es lo que se audita.'),
             'status': 200},
            {'method': 'POST', 'path': '/iam/auth/logout',
             'title': '14 · El owner cierra su sesión',
             'body': {'refreshToken': '{{refreshToken}}'}, 'status': 200},
        ],
    },
    {
        'slug': 'administrador',
        'name': 'Administrador',
        'summary': ('Altas, concesión de roles y las tres bajas lógicas de plataforma: bloquear '
                    'una cuenta, suspender una organización y anonimizar a una persona. Ninguna '
                    'borra: lo que se firmó tiene que seguir existiendo.'),
        'env': {'email': 'admin@redesa.test', 'password': 'S3cret-passw0rd',
                'managedEmail': ''},
        'steps': [
            {'method': 'POST', 'path': '/iam/auth/login', 'public': True,
             'title': '1 · Inicia sesión como administrador',
             'note': ('El primer SECURITY_ADMIN no se puede crear por API: lo siembra '
                      '`yarn postman:bootstrap`.'),
             'body': {'email': '{{email}}', 'password': '{{password}}'}, 'status': 200,
             'captures': [('accessToken', 'accessToken'), ('refreshToken', 'refreshToken')]},
            {'method': 'POST', 'path': '/iam/users',
             'title': '2 · Da de alta una cuenta',
             'note': 'Sólo `USER` y `SECURITY_ADMIN` son roles de alta.',
             'prerequest': ["pm.environment.set('managedEmail', 'gestionado-' + Date.now() + '@example.test');"],
             'body': {'displayName': 'Usuario gestionado', 'email': '{{managedEmail}}',
                      'password': '{{password}}', 'initialRole': 'USER'},
             'status': 201, 'captures': [('managedUserId', 'id')]},
            {'method': 'POST', 'path': '/iam/users/{managedUserId}/global-roles',
             'title': '3 · Le concede SECURITY_ADMIN',
             'body': {'role': 'SECURITY_ADMIN', 'action': 'GRANT'}, 'status': 200},
            {'method': 'POST', 'path': '/iam/users/{managedUserId}/global-roles',
             'title': '4 · Y se lo revoca',
             'body': {'role': 'SECURITY_ADMIN', 'action': 'REVOKE'}, 'status': 200},
            {'method': 'POST', 'path': '/admin/tenants',
             'title': '5 · Aprovisiona una organización con su owner',
             'prerequest': ["pm.environment.set('admTenantCode', 'ADM-' + Date.now());"],
             'body': {'code': '{{admTenantCode}}',
                      'legalName': 'Organización aprovisionada',
                      'tenantType': 'MEDICAL_OFFICE',
                      'countryConceptId': '{{countryConceptId}}',
                      'jurisdictionConceptId': '{{jurisdictionConceptId}}',
                      'ownerUserId': '{{managedUserId}}'},
             'status': 201, 'captures': [('admTenantId', 'id')]},
            {'method': 'POST', 'path': '/admin/tenants/{admTenantId}/verification',
             'title': '6 · La verifica y la deja ACTIVA',
             'note': 'Acto de plataforma: el owner no llega a este endpoint.',
             'status': 200},
            {'method': 'POST', 'path': '/admin/tenants/{admTenantId}/suspend',
             'title': '7 · La suspende — baja lógica, sigue existiendo',
             'note': ('De la organización cuelgan historias clínicas, facturación y '
                      'consentimientos: un borrado dejaría todo eso apuntando al vacío. El '
                      'motivo es obligatorio porque estas decisiones se revisan.'),
             'body': {'reason': 'Motivo de la suspensión'}, 'status': 200},
            {'method': 'POST', 'path': '/iam/users/{managedUserId}/lock',
             'title': '8 · Bloquea la cuenta — baja lógica',
             'note': ('Le corta el acceso; la cuenta sigue existiendo porque de ella cuelgan sus '
                      'actos. Después de esto su login devuelve 401.'),
             'body': {'reason': 'Motivo del bloqueo'}, 'status': 200},
            {'method': 'POST', 'path': '/iam/auth/login', 'public': True,
             'title': '9 · LÍMITE · la cuenta bloqueada ya no entra',
             'note': 'Este paso **debe** dar 401: es la prueba de que el bloqueo sirve.',
             'body': {'email': '{{managedEmail}}', 'password': '{{password}}'},
             'status': 401},
            {'method': 'POST', 'path': '/iam/users/{managedUserId}/anonymize',
             'title': '10 · Derecho al olvido — vacía sin borrar',
             'note': ('No es una baja más: se vacían los datos personales pero la fila queda, '
                      'porque los actos que esa persona firmó son parte de la historia de otros '
                      'pacientes.'),
             'status': 200},
        ],
    },
]


def actor_request(step: dict, index: dict) -> dict:
    """Un paso del recorrido de un actor.

    Dos detalles que hacen la diferencia entre una colección que se lee y una que corre:

    - **La identidad se fija antes de registrarse, no después.** Si el alta usa
      `medico-{{$timestamp}}@…` y el login usa `{{email}}`, son dos valores distintos y el login
      da 401. Aquí un script de pre-request escribe el correo (o el documento) en el entorno y
      tanto el alta como el login leen esa misma variable.
    - **Las variables de ruta se llaman como la variable que las llena.** El contrato llama `id`
      a la variable de 350 rutas; en un recorrido eso obliga a adivinar cuál `id` es. Los pasos
      declaran su placeholder con el nombre real (`{userId}`, `{caseId}`), que es el que la
      captura del paso anterior dejó en el entorno.
    """
    method, path, title = step['method'], step['path'], step['title']
    request = {'name': title,
               'request': {'method': method, 'header': [], 'url': {}},
               'response': [], 'event': []}
    raw = '{{baseUrl}}' + re.sub(r'\{(\w+)\}', r':\1', path)
    request['request']['url'] = {
        'raw': raw, 'host': ['{{baseUrl}}'],
        'path': [s for s in re.sub(r'\{(\w+)\}', r':\1', path).strip('/').split('/') if s],
        'variable': [{'key': m, 'value': '{{' + m + '}}',
                      'description': f'Lo deja en el entorno un paso anterior'}
                     for m in re.findall(r'\{(\w+)\}', path)],
    }
    headers = []
    if step.get('body') is not None:
        headers.append({'key': 'Content-Type', 'value': 'application/json'})
        request['request']['body'] = {
            'mode': 'raw',
            'raw': json.dumps(step['body'], indent=2, ensure_ascii=False),
            'options': {'raw': {'language': 'json'}}}
    if step.get('as') == 'plataforma':
        # Este paso lo ejecuta la plataforma, no el actor: se declara explícito para que se vea
        # en el request de quién es el poder que hace falta.
        headers.append({'key': 'Authorization', 'value': 'Bearer {{platformToken}}'})
        request['request']['auth'] = {'type': 'noauth'}
    if step.get('public'):
        request['request']['auth'] = {'type': 'noauth'}
    request['request']['header'] = headers
    request['request']['description'] = step.get('note', '')

    status = step.get('status', 201)
    lines = [f"pm.test('status {status}', function () {{",
             f"  pm.response.to.have.status({status});", '});']
    if step.get('captures'):
        lines += ['', '// Encadena el recorrido: lo que deja este paso lo consume el siguiente.',
                  'if (pm.response.code < 300) {', '  const b = pm.response.json();']
        for var, field in step['captures']:
            lines.append(f"  if (b.{field}) pm.environment.set('{var}', b.{field});")
        lines.append('}')
    events = [{'listen': 'test', 'script': {'type': 'text/javascript', 'exec': lines}}]
    if step.get('prerequest'):
        events.insert(0, {'listen': 'prerequest',
                          'script': {'type': 'text/javascript', 'exec': step['prerequest']}})
    request['event'] = events
    return request


def build_actor_collections(spec: dict, index: dict, base_url: str) -> list:
    """Emite colección + entorno por actor. Devuelve lo escrito."""
    written = []
    actors_dir = os.path.join(OUT_DIR, 'actores')
    os.makedirs(actors_dir, exist_ok=True)
    for actor in ACTOR_COLLECTIONS:
        items = [actor_request(step, index) for step in actor['steps']]
        collection = {
            'info': {
                'name': f"SALUD · {actor['name']}",
                'description': (
                    f"Recorrido de un usuario **{actor['name'].lower()}**, en orden y encadenado "
                    f"por el entorno.\n\n{actor['summary']}\n\n"
                    f"Importar junto a `Salud-{actor['slug'].capitalize()}."
                    f"postman_environment.json` y correr los pasos de arriba abajo. Cada actor "
                    f"tiene su propio entorno: con uno solo, iniciar sesión como otro borraría "
                    f"este token.\n\n"
                    f"Los pasos son los mismos que ejercita "
                    f"`test/smoke/modules/{actor['slug']}.smoke.ts` contra la API real, y "
                    f"`yarn postman:verify:actores` los vuelve a correr sobre esta colección."),
                'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
            },
            'item': items,
            'auth': {'type': 'bearer',
                     'bearer': [{'key': 'token', 'value': '{{accessToken}}', 'type': 'string'}]},
            'variable': [{'key': 'baseUrl', 'value': base_url, 'type': 'string'}],
        }
        env_values = {'baseUrl': base_url, 'accessToken': '', 'refreshToken': ''}
        env_values.update({k: ENV_DEFAULTS.get(k, '') for k in
                           ('countryConceptId', 'jurisdictionConceptId')})
        env_values.update(actor.get('env', {}))
        for step in actor['steps']:
            for var, _f in step.get('captures', []):
                env_values.setdefault(var, '')
            for m in re.findall(r'\{(\w+)\}', step['path']):
                env_values.setdefault(m, '')
        environment = {
            'name': f"SALUD {actor['name']}",
            'values': [{'key': k, 'value': v,
                        'type': 'secret' if k in ('accessToken', 'refreshToken', 'password',
                                                  'platformToken') else 'default',
                        'enabled': True}
                       for k, v in env_values.items()],
            '_postman_variable_scope': 'environment',
        }
        cap = actor['slug'].capitalize()
        coll_path = os.path.join(actors_dir, f'Salud-{cap}.postman_collection.json')
        env_path = os.path.join(actors_dir, f'Salud-{cap}.postman_environment.json')
        for target, payload in ((coll_path, collection), (env_path, environment)):
            with open(target, 'w', encoding='utf-8') as f:
                json.dump(payload, f, indent=2, ensure_ascii=False)
                f.write('\n')
        written.append((actor['name'], len(items), coll_path, env_path))
    return written


# --------------------------------------------------------------------- salida

def main():
    if not os.path.exists(SPEC):
        raise SystemExit(f'No existe {SPEC}. Generarlo con: yarn docs:openapi:generate')
    with open(SPEC, encoding='utf-8') as f:
        spec = json.load(f)

    resolver = Resolver(spec)

    # Pasada previa: qué variables va a poblar el recorrido. Tiene que correr ANTES de generar
    # los cuerpos, porque `uuid_placeholder` decide con esto si un campo `practiceId` se emite
    # como `{{practiceId}}` —encadenado— o como marcador a rellenar a mano.
    for path in spec['paths']:
        for raw in re.findall(r'\{(\w+)\}', path):
            DISCOVERED_VARS.add(path_var_name(path, raw))
        var = resource_var_for_path(path)
        if var:
            DISCOVERED_VARS.add(var)

    folders, total, index = build_folders(spec, resolver)
    extras = [f for f in (signup_folder(spec, resolver, index), starter_folder(index)) if f]
    for folder in extras:                       # se insertan al frente en orden 00, 01
        folders.insert(0, folder)
    base_url = (spec.get('servers') or [{}])[0].get('url', 'http://localhost:3000')

    collection = {
        'info': {
            'name': f"{spec['info'].get('title', 'REDESA Health API')} · {total} endpoints",
            'description': (
                f"Colección generada desde `openapi/openapi.json` con "
                f"`yarn postman:generate` — **no editar a mano**.\n\n"
                f"- {total} requests en {len(folders) - len(extras)} dominios; un folder por primer "
                f"segmento de ruta (los dominios grandes se parten por tag).\n"
                f"- Auth Bearer heredada de la colección: correr **POST /iam/auth/login** y el test "
                f"guarda `accessToken`/`refreshToken` en el entorno automáticamente.\n"
                f"- Los query params opcionales van deshabilitados. `X-Tenant-Id` va habilitada con "
                f"el tenant sembrado: sin ella, un actor sin membresía recibe 403.\n"
                f"- Los bodies son ejemplos derivados de los schemas: revisar los valores antes de enviar.\n\n"
                f"Contrato v{spec['info'].get('version', '?')}."
            ),
            'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        'item': folders,
        'auth': {'type': 'bearer',
                 'bearer': [{'key': 'token', 'value': '{{accessToken}}', 'type': 'string'}]},
        'variable': [{'key': 'baseUrl', 'value': base_url, 'type': 'string'}],
    }

    env_keys = ['baseUrl', 'accessToken', 'refreshToken', 'email', 'password', 'tenantId']
    env_keys += EXTRA_ENV_KEYS
    env_keys += [k for k in collect_env_keys(spec) if k not in env_keys]
    environment = {
        'name': 'SALUD Local',
        'values': [{'key': k,
                    'value': ENV_DEFAULTS.get(k, ''),
                    'type': 'secret' if k in ('accessToken', 'refreshToken', 'password') else 'default',
                    'enabled': True}
                   for k in env_keys],
        '_postman_variable_scope': 'environment',
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    coll_path = os.path.join(OUT_DIR, 'Salud-API.postman_collection.json')
    env_path = os.path.join(OUT_DIR, 'Salud-Local.postman_environment.json')
    with open(coll_path, 'w', encoding='utf-8') as f:
        json.dump(collection, f, indent=2, ensure_ascii=False)
        f.write('\n')
    with open(env_path, 'w', encoding='utf-8') as f:
        json.dump(environment, f, indent=2, ensure_ascii=False)
        f.write('\n')

    print(f'Colección generada: {len(folders) - len(extras)} dominios · {total} requests '
          f'· {len(env_keys)} variables')
    print(f'  {coll_path}')
    print(f'  {env_path}')

    for name, steps, cpath, epath in build_actor_collections(spec, index, base_url):
        print(f'Colección por actor · {name}: {steps} pasos')
        print(f'  {cpath}')
        print(f'  {epath}')


if __name__ == '__main__':
    main()
