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
            return '00000000-0000-0000-0000-000000000000'
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
            return '00000000-0000-0000-0000-000000000000'
        if low.endswith('at') or 'date' in low or 'fecha' in low:
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
            segments.append(':' + m.group(1))
            variables.append({'key': m.group(1), 'value': path_var_value(m.group(1)),
                              'description': 'Identificador de ruta'})
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


def build_body(op: dict, resolver: Resolver, required_only: bool = False):
    """Body raw JSON de ejemplo desde `requestBody`, o None si la operación no lleva cuerpo."""
    schema = request_schema(op)
    if schema is None:
        return None
    example = resolver.example(only_required(schema, resolver) if required_only else schema)
    if example in ({}, None):
        return None
    return {'mode': 'raw',
            'raw': json.dumps(example, indent=2, ensure_ascii=False),
            'options': {'raw': {'language': 'json'}}}


def test_script(method: str, path: str, status: int) -> list:
    """Test de status + captura de tokens en los endpoints de sesión."""
    lines = [
        f"pm.test('status {status}', function () {{",
        f"  pm.response.to.have.status({status});",
        "});",
    ]
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
            domains.setdefault(domain_of(path), []).append((tag_of(op), request))
            total += 1

    folders = []
    for domain in sorted(domains):
        entries = domains[domain]
        tags = sorted({t for t, _ in entries})
        if len(entries) >= SUBFOLDER_MIN and len(tags) > 1:
            items = [{'name': tag, 'item': [r for t, r in entries if t == tag]} for tag in tags]
        else:
            items = [r for _, r in entries]
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
    keys = set()
    for path in spec['paths']:
        keys.update(re.findall(r'\{(\w+)\}', path))
    for methods in spec['paths'].values():
        for method, op in methods.items():
            if method not in METHODS:
                continue
            for p in op.get('parameters', []):
                if p.get('in') == 'header':
                    keys.add(p['name'].replace('-', '_'))
    return sorted(keys)


# --------------------------------------------------------------------- salida

def main():
    if not os.path.exists(SPEC):
        raise SystemExit(f'No existe {SPEC}. Generarlo con: yarn docs:openapi:generate')
    with open(SPEC, encoding='utf-8') as f:
        spec = json.load(f)

    resolver = Resolver(spec)
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


if __name__ == '__main__':
    main()
