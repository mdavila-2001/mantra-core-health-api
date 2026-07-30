#!/usr/bin/env python3
"""generate_postman.py — Genera la colección Postman desde el código real.

Parsea los controllers NestJS (`src/modules/*/controllers/*.controller.ts`) y sus DTOs para
producir una colección Postman v2.1 organizada por módulo, con auth Bearer, variables de
entorno, bodies de ejemplo derivados de los DTOs y un test de código de estado por request.

Determinista y regenerable: cuando se agregan módulos/endpoints, re-correr y la colección se
actualiza. No necesita levantar la app ni node_modules.

Uso:  python tools/postman/generate_postman.py
Salida: docs/postman/Salud-API.postman_collection.json
        docs/postman/Salud-Local.postman_environment.json
"""
from __future__ import annotations

import glob
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODULES = os.path.join(ROOT, 'src', 'modules')
OUT_DIR = os.path.join(ROOT, 'docs', 'postman')

CONTROLLER_RE = re.compile(r"@Controller\(\s*'([^']*)'\s*\)")
ROUTE_RE = re.compile(r"@(Post|Get|Put|Patch|Delete)\(\s*(?:'([^']*)')?\s*\)")
SUMMARY_RE = re.compile(r"@ApiOperation\(\s*\{[^}]*summary:\s*'([^']*)'", re.S)
ROLES_RE = re.compile(r"@Roles\(([^)]*)\)")
UC_RE = re.compile(r"/\*\*\s*(UC-\d+-\d+)")
HTTPCODE_RE = re.compile(r"@HttpCode\(HttpStatus\.(\w+)\)")
PARAM_RE = re.compile(r"@Param\(\s*'([^']*)'")
BODY_RE = re.compile(r"@Body\(\)\s*\w+\s*:\s*(\w+)")

HTTP_STATUS = {'OK': 200, 'CREATED': 201, 'ACCEPTED': 202, 'NO_CONTENT': 204}


# --------------------------------------------------------------------- DTOs → body de ejemplo

def dto_files_index() -> dict:
    """{NombreDto: ruta} sobre todos los dto del proyecto."""
    idx = {}
    for path in glob.glob(os.path.join(MODULES, '*', 'dto', '*.dto.ts')):
        for m in re.finditer(r'export class (\w+)', open(path, encoding='utf-8').read()):
            idx[m.group(1)] = path
    return idx


def example_for(name: str, ts_type: str, decorators: str):
    """Valor de ejemplo por tipo declarado + validadores class-validator."""
    d = decorators
    if '@IsEmail' in d:
        return 'user@example.test'
    if '@IsUUID' in d or name.endswith('Id') or name.endswith('_id'):
        return '00000000-0000-0000-0000-000000000000'
    m = re.search(r"@IsIn\(\[([^\]]*)\]", d)
    if m:
        first = re.findall(r"'([^']*)'", m.group(1))
        return first[0] if first else 'VALUE'
    if '@IsBoolean' in d or ts_type == 'boolean':
        return True
    if '@IsInt' in d or '@IsNumber' in d or ts_type == 'number':
        return 1
    if ts_type.endswith('[]') or '@IsArray' in d:
        return []
    if ts_type not in ('string', 'boolean', 'number') and ts_type[:1].isupper():
        return {}                       # objeto anidado / enum type
    if 'password' in name.lower():
        return 'S3cret-passw0rd'
    if 'date' in name.lower() or 'At' in name:
        return '2026-01-01T00:00:00Z'
    return f'{name}-ejemplo'


def build_body(dto_name: str, dto_idx: dict) -> dict | None:
    path = dto_idx.get(dto_name)
    if not path:
        return None
    text = open(path, encoding='utf-8').read()
    m = re.search(r'export class ' + re.escape(dto_name) + r'\s*(?:extends[^{]*)?\{(.*?)\n\}', text, re.S)
    body_src = m.group(1) if m else text
    body = {}
    # cada propiedad: bloque de decoradores + `nombre[!?]: tipo`
    for pm in re.finditer(r'((?:@\w+\([^\n]*\)\s*)*)\s*(\w+)(\??)!?\s*:\s*([\w\[\]<> |]+?);', body_src):
        decorators, pname, optional, ptype = pm.groups()
        if pname in ('constructor',):
            continue
        body[pname] = example_for(pname, ptype.strip(), decorators)
    return body or None


# --------------------------------------------------------------------- controllers → endpoints

def parse_controller(path: str, dto_idx: dict) -> list[dict]:
    text = open(path, encoding='utf-8').read()
    cm = CONTROLLER_RE.search(text)
    prefix = cm.group(1) if cm else ''
    endpoints = []
    # posiciones de cada decorador de ruta; el chunk va hasta la próxima ruta o fin
    routes = list(ROUTE_RE.finditer(text))
    for i, rm in enumerate(routes):
        start = rm.start()
        end = routes[i + 1].start() if i + 1 < len(routes) else len(text)
        chunk = text[start:end]
        method = rm.group(1).upper()
        sub = rm.group(2) or ''
        # el comentario UC suele estar en la línea inmediatamente anterior
        pre = text[max(0, start - 120):start]
        uc = (UC_RE.findall(pre) or [''])[-1] if UC_RE.search(pre) else ''
        summary = (SUMMARY_RE.search(chunk) or [None])
        summary = SUMMARY_RE.search(chunk).group(1) if SUMMARY_RE.search(chunk) else ''
        roles_m = ROLES_RE.search(chunk)
        roles = re.findall(r"'([^']*)'", roles_m.group(1)) if roles_m else []
        http_m = HTTPCODE_RE.search(chunk)
        status = HTTP_STATUS.get(http_m.group(1), 200) if http_m else (201 if method == 'POST' else 200)
        params = PARAM_RE.findall(chunk)
        body_m = BODY_RE.search(chunk)
        body = build_body(body_m.group(1), dto_idx) if body_m else None
        full = '/'.join(p for p in [prefix, sub] if p)
        endpoints.append({
            'method': method, 'path': full, 'uc': uc, 'summary': summary,
            'roles': roles, 'status': status, 'params': params, 'body': body,
        })
    return endpoints


# --------------------------------------------------------------------- Postman

def to_request(ep: dict) -> dict:
    # :param → variable Postman {{param}} en el path renderizado, pero Postman usa :param nativo
    segments = [s for s in ep['path'].split('/') if s]
    variables = [{'key': s[1:], 'value': '{{' + (s[1:] + 'Id' if s[1:] in ('id',) else s[1:]) + '}}'}
                 for s in segments if s.startswith(':')]
    url = {
        'raw': '{{baseUrl}}/' + ep['path'],
        'host': ['{{baseUrl}}'],
        'path': segments,
    }
    if variables:
        url['variable'] = variables
    req = {
        'method': ep['method'],
        'header': [{'key': 'Content-Type', 'value': 'application/json'}],
        'url': url,
        'description': _describe(ep),
        'auth': {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{accessToken}}', 'type': 'string'}]},
    }
    if ep['body'] is not None:
        req['body'] = {'mode': 'raw', 'raw': json.dumps(ep['body'], indent=2, ensure_ascii=False),
                       'options': {'raw': {'language': 'json'}}}
    name = (f"{ep['uc']} · " if ep['uc'] else '') + (ep['summary'] or f"{ep['method']} /{ep['path']}")
    return {
        'name': name,
        'request': req,
        'event': [{
            'listen': 'test',
            'script': {'type': 'text/javascript', 'exec': [
                f"pm.test('status {ep['status']}', function () {{ pm.response.to.have.status({ep['status']}); }});",
            ]},
        }],
    }


def _describe(ep: dict) -> str:
    parts = [f"**{ep['uc']}** {ep['summary']}".strip()]
    if ep['roles']:
        parts.append(f"Roles: {', '.join(ep['roles'])}")
    parts.append(f"Respuesta esperada: {ep['status']}")
    return '\n\n'.join(parts)


def main():
    dto_idx = dto_files_index()
    folders = []
    total = 0
    for mod_dir in sorted(glob.glob(os.path.join(MODULES, '*'))):
        module = os.path.basename(mod_dir)
        items = []
        for ctrl in sorted(glob.glob(os.path.join(mod_dir, 'controllers', '*.controller.ts'))):
            if ctrl.endswith('.spec.ts'):
                continue
            for ep in parse_controller(ctrl, dto_idx):
                items.append(to_request(ep))
                total += 1
        if items:
            folders.append({'name': module, 'item': items})

    collection = {
        'info': {
            'name': 'SALUD / REDESA API',
            'description': ('Colección generada desde el código (tools/postman/generate_postman.py).\n'
                           'Un folder por módulo. Auth Bearer via {{accessToken}}. Bodies de ejemplo '
                           'derivados de los DTOs — ajustar valores reales antes de enviar.'),
            'schema': 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
        },
        'item': folders,
        'auth': {'type': 'bearer', 'bearer': [{'key': 'token', 'value': '{{accessToken}}', 'type': 'string'}]},
        'variable': [{'key': 'baseUrl', 'value': 'http://localhost:3000'}],
    }

    environment = {
        'name': 'SALUD Local',
        'values': [
            {'key': 'baseUrl', 'value': 'http://localhost:3000', 'enabled': True},
            {'key': 'accessToken', 'value': '', 'enabled': True},
            {'key': 'refreshToken', 'value': '', 'enabled': True},
            {'key': 'userId', 'value': '', 'enabled': True},
            {'key': 'tenantId', 'value': '', 'enabled': True},
            {'key': 'id', 'value': '', 'enabled': True},
        ],
        '_postman_variable_scope': 'environment',
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    with open(os.path.join(OUT_DIR, 'Salud-API.postman_collection.json'), 'w', encoding='utf-8') as f:
        json.dump(collection, f, indent=2, ensure_ascii=False)
    with open(os.path.join(OUT_DIR, 'Salud-Local.postman_environment.json'), 'w', encoding='utf-8') as f:
        json.dump(environment, f, indent=2, ensure_ascii=False)
    print(f'Colección generada: {len(folders)} módulos · {total} requests')
    print(f'  {OUT_DIR}/Salud-API.postman_collection.json')
    print(f'  {OUT_DIR}/Salud-Local.postman_environment.json')


if __name__ == '__main__':
    main()
