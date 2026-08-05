#!/usr/bin/env python3
"""verify.py — Corre los folders curados de la colección contra la API y falla si alguno no da su status.

Existe porque el generador no puede saber si un cuerpo *funciona*. El ejemplo que deriva del
schema emite todos los campos opcionales a la vez, y eso rompe cualquier endpoint con requisitos
condicionales: `POST /iam/auth/register-organization` mandaba los bloques `payer` y `broker`
juntos bajo un `tenantType: PROVIDER` (422), uuid de concepto inexistentes (500 por FK) y el
email del admin ya sembrado (409). OpenAPI no expresa «PROVIDER exige país» ni «PAYER exige
payer»: eso vive en el servicio. Por eso los flujos que deben correr llevan cuerpo curado en
`generate_postman.py`, y por eso hace falta ejercerlos de verdad para saber que siguen vivos.

Es un newman mínimo, sin dependencias: sustituye `{{variables}}` desde el entorno, honra las
capturas que el generador escribe en cada test (`const X = body.a || body.b;`) y compara el
status con el que declara el `pm.test`.

Uso:  yarn postman:verify                 (folders 00 y 01 de la colección completa)
      yarn postman:verify 01              (un folder por prefijo de nombre)
      yarn postman:verify --actores       (los recorridos por tipo de usuario)
Requiere la API arriba y el administrador sembrado (`yarn postman:bootstrap`).
Sale con código 1 si algún request no devuelve el status esperado.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
POSTMAN_DIR = os.path.join(ROOT, 'docs', 'postman')
COLLECTION = os.path.join(POSTMAN_DIR, 'Salud-API.postman_collection.json')
ENVIRONMENT = os.path.join(POSTMAN_DIR, 'Salud-Local.postman_environment.json')

DEFAULT_FOLDERS = ('00', '01')
ACTORS_DIR = os.path.join(POSTMAN_DIR, 'actores')
TIMEOUT = 30
RATE_LIMIT_RETRIES = 3     # el throttler de las altas públicas admite 10 por ventana

# `{{$timestamp}}` es una variable dinámica de Postman: cada llamada devuelve un valor distinto.
# Aquí se emula con un contador que arranca en la hora actual, para que reejecutar no choque con
# los 409 de código o email en uso.
_counter = [int(time.time())]


def load(path: str):
    if not os.path.exists(path):
        raise SystemExit(f'No existe {path}. Generarlo con: yarn postman:generate')
    with open(path, encoding='utf-8') as f:
        return json.load(f)


def substitute(text: str, env: dict) -> str:
    """Resuelve `{{var}}` contra el entorno; deja intacto lo que no conoce."""
    def repl(match):
        key = match.group(1)
        if key == '$timestamp':
            _counter[0] += 1
            return str(_counter[0])
        return env.get(key, match.group(0))
    return re.sub(r'\{\{([\w$]+)\}\}', repl, text)


def send(method: str, url: str, headers: dict, payload: bytes | None, attempt: int = 0):
    """Envía el request y espera si el throttler contesta 429.

    Los endpoints públicos de alta van limitados a 10 por ventana: correr la verificación dos
    veces seguidas gasta la cuota y devolvería un fallo que no es de la colección. El 429 trae
    `x-ratelimit-reset` en segundos, así que se espera lo que pide y se reintenta.
    """
    request = urllib.request.Request(url, data=payload, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=TIMEOUT) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        if error.code == 429 and attempt < RATE_LIMIT_RETRIES:
            reset = error.headers.get('x-ratelimit-reset') or error.headers.get('retry-after') or '5'
            delay = min(int(reset) if reset.isdigit() else 5, 60) + 1
            print(f'    · 429 del throttler; esperando {delay}s y reintentando')
            time.sleep(delay)
            return send(method, url, headers, payload, attempt + 1)
        return error.code, error.read()
    except urllib.error.URLError as error:
        raise SystemExit(f'No se pudo hablar con la API ({url}): {error.reason}. '
                         f'¿Está arriba? `yarn docker:api:refresh` o `yarn start:dev`.')


def login(env: dict) -> None:
    """Siembra `accessToken`: sin sesión el resto de la colección devuelve 401."""
    payload = json.dumps({'email': env['email'], 'password': env['password']}).encode()
    status, raw = send('POST', env['baseUrl'] + '/iam/auth/login',
                       {'Content-Type': 'application/json'}, payload)
    if status != 200:
        raise SystemExit(f'Login falló ({status}): {raw.decode(errors="replace")[:300]}\n'
                         f'Sembrar el administrador con: yarn build && yarn postman:bootstrap')
    body = json.loads(raw)
    env['accessToken'] = body['accessToken']
    env['refreshToken'] = body.get('refreshToken', '')


def captures(item: dict) -> list:
    """Variables que el test script guarda en el entorno, con sus campos candidatos."""
    found = []
    for script in item.get('event', []):
        for line in script.get('script', {}).get('exec', []):
            match = re.match(r'\s*const (\w+) = (body\.[\w.]+(?: \|\| body\.[\w.]+)*);', line)
            if match:
                fields = [f.split('.', 1)[1] for f in match.group(2).split(' || ')]
                found.append((match.group(1), fields))
            elif 'body.accessToken' in line:          # el bloque de sesión de login/refresh
                found.append(('accessToken', ['accessToken']))
                found.append(('refreshToken', ['refreshToken']))
            else:
                # Forma corta que usan los recorridos por actor: `if (b.x) pm.environment.set(…)`.
                short = re.search(r"pm\.environment\.set\('(\w+)', b\.(\w+)\)", line)
                if short:
                    found.append((short.group(1), [short.group(2)]))
    return found


def expected_status(item: dict) -> int:
    for script in item.get('event', []):
        for line in script.get('script', {}).get('exec', []):
            match = re.search(r'pm\.response\.to\.have\.status\((\d+)\)', line)
            if match:
                return int(match.group(1))
    return 200


def apply_prerequest(item: dict, env: dict) -> None:
    """Emula los pre-request de los recorridos por actor.

    Son de una sola forma —`pm.environment.set('x', 'prefijo-' + Date.now())`— y existen para que
    el alta y el login usen la misma identidad: si el alta inventa un correo con `{{$timestamp}}`
    y el login lee `{{email}}`, son dos valores distintos y el login devuelve 401.
    """
    for script in item.get('event', []):
        if script.get('listen') != 'prerequest':
            continue
        for line in script.get('script', {}).get('exec', []):
            match = re.search(r"pm\.environment\.set\('(\w+)',\s*'([^']*)'\s*\+\s*Date\.now\(\)"
                              r"(?:\s*\+\s*'([^']*)')?\s*\)", line)
            if match:
                _counter[0] += 1
                prefix, suffix = match.group(2), match.group(3) or ''
                env[match.group(1)] = f'{prefix}{_counter[0]}{suffix}'


def run_request(item: dict, env: dict) -> tuple[bool, str]:
    apply_prerequest(item, env)
    spec = item['request']
    url = substitute(spec['url']['raw'], env)
    for variable in spec['url'].get('variable', []):
        url = url.replace(':' + variable['key'], substitute(variable['value'], env))

    headers = {h['key']: substitute(h['value'], env)
               for h in spec.get('header', []) if not h.get('disabled')}
    if spec.get('auth', {}).get('type') != 'noauth':
        headers['Authorization'] = 'Bearer ' + env.get('accessToken', '')
    payload = substitute(spec['body']['raw'], env).encode() if spec.get('body') else None

    status, raw = send(spec['method'], url, headers, payload)
    wanted = expected_status(item)
    try:
        body = json.loads(raw)
    except ValueError:
        body = {}

    if status != wanted:
        detail = json.dumps(body, ensure_ascii=False)[:200] if body else raw.decode(errors='replace')[:200]
        return False, f'{status} (esperado {wanted}) · {detail}'

    for name, fields in captures(item):
        for field in fields:
            if isinstance(body, dict) and body.get(field):
                env[name] = body[field]
                break
    return True, str(status)


def walk(items: list):
    """Aplana subfolders: los dominios grandes anidan un nivel por tag."""
    for item in items:
        if 'item' in item:
            yield from walk(item['item'])
        else:
            yield item


def run_actor(slug: str) -> tuple:
    """Corre el recorrido completo de un actor con su propio entorno.

    Cada actor va con su entorno para que las sesiones no se pisen: con uno solo, iniciar sesión
    como médico borraría el token del paciente y los pasos siguientes fallarían sin decir por qué.
    Por eso aquí tampoco se reutiliza el entorno entre actores.
    """
    coll = load(os.path.join(ACTORS_DIR, f'Salud-{slug}.postman_collection.json'))
    env = {v['key']: v['value']
           for v in load(os.path.join(ACTORS_DIR, f'Salud-{slug}.postman_environment.json'))['values']}
    env.setdefault('baseUrl', 'http://localhost:3000')
    print(f"\n== {coll['info']['name']} ==")
    ok = 0
    for item in coll['item']:
        passed, detail = run_request(item, env)
        print(f'{"  ok " if passed else "FALLA"} {detail:<46.46} {item["name"][:60]}')
        ok += 1 if passed else 0
    return ok, len(coll['item'])


def main() -> int:
    if '--actores' in sys.argv:
        total = passed = 0
        for slug in ('Paciente', 'Medico', 'Organizacion', 'Administrador'):
            ok, n = run_actor(slug)
            passed += ok
            total += n
        print(f'\n{passed}/{total} pasos de los recorridos por actor')
        return 0 if passed == total else 1

    prefixes = tuple(sys.argv[1:]) or DEFAULT_FOLDERS
    collection = load(COLLECTION)
    env = {v['key']: v['value'] for v in load(ENVIRONMENT)['values']}
    env.setdefault('baseUrl', 'http://localhost:3000')

    folders = [f for f in collection['item'] if f['name'].startswith(prefixes)]
    if not folders:
        raise SystemExit(f'Ningún folder empieza por {prefixes}. Hay: '
                         + ', '.join(f['name'] for f in collection['item'][:6]) + '…')

    login(env)
    failures = []
    total = 0
    for folder in folders:
        print(f'\n== {folder["name"]} ==')
        for item in walk(folder['item']):
            total += 1
            ok, detail = run_request(item, env)
            print(f'{"  ok " if ok else "FALLA"} {detail:<52.52} {item["name"][:70]}')
            if not ok:
                failures.append(f'{folder["name"]} → {item["name"]}: {detail}')

    print(f'\n{total - len(failures)}/{total} requests con el status esperado')
    if failures:
        print('\nFallos:')
        for failure in failures:
            print(f'  · {failure}')
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
