"""Consolida los checks de los tres niveles de gate (A, B, C) en un solo registro.

H6.S3.M1 y H6.S3.M2 del carril B.

## Por qué un script y no un archivo escrito a mano

Porque los 23 checks del gate B ya existen en el registro del turno anterior, y
volver a tipearlos es la forma más segura de introducir una diferencia que
nadie va a notar. Acá se **leen** de su archivo y se les aplica sólo lo que
cambió hoy, con su evidencia nueva. Lo que se escribe a mano es únicamente lo
que no existía en ningún JSON: los gates del artefacto (nivel A), que Itzan
declaró en prosa en su manifiesto.

## A, B y C son NIVELES, no carriles

Está en el prompt del carril (`DoblesRelacionYRegresionFinal.md:494-503`):
«todos los checks obligatorios aplicables **del nivel** deben aprobar para el
mismo artefacto y configuración».

- **A — artefacto:** el módulo empaquetado. Dueño: Itzan.
- **B — relación:** `agenda → mensajería`. Dueño: yo.
- **C — sistema:** la regresión del candidato. Dueño: yo, con insumo de Pablo.

Un consolidado que mezclara «carril A / carril B / carril C» estaría contando
personas en vez de niveles, y el criterio de aprobación dejaría de significar
nada.

Uso: python docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/consolidar-registro.py
"""

from __future__ import annotations

import io
import json
import os
from typing import Any

AQUI = os.path.dirname(os.path.abspath(__file__))
TRABAJOS = os.path.dirname(AQUI)
ORIGEN_B = os.path.join(
    TRABAJOS, '2026-09-19-relacion-agenda-mensajeria', 'registro-de-checks.json'
)
SALIDA_JSON = os.path.join(AQUI, 'registro-de-checks-consolidado.json')
SALIDA_TABLA = os.path.join(AQUI, 'gates-no-aprobados.md')

ARTEFACTO_HOY = 'mantra-core-health-api@4cc5ea1f'
FUENTE_ITZAN = (
    'AlovidaPromptManager@origin/itzan/daily-noche-2026-09-19:'
    'docs/trabajo/2026-09-20-aislamiento-scheduling'
)

# Lo que cambió hoy en checks que YA existían. Sólo se tocan estos campos.
ACTUALIZACIONES: dict[str, dict[str, Any]] = {
    'H2.S1.M1': {
        'status': 'PASS',
        'artifact': ARTEFACTO_HOY,
        'reason': (
            'Destrabado: Itzan publicó scheduling-module-v0.1.0-transitional '
            '(sha256 6d4e53d2…, origen 5d5007fb). El adaptador se fija por versión, '
            'y el commit de origen se verifica alcanzable desde el corte.'
        ),
        'command': 'yarn test:integration --testPathPatterns=agenda-mensajeria-relacion',
        'exit_code': 0,
        'evidence_paths': [
            'docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h1-fijacion-por-version.txt'
        ],
    },
    'H5.S1.M2': {
        'status': 'PASS',
        'artifact': ARTEFACTO_HOY,
        'reason': (
            'El DoD pide observar el bloqueo, no mandar nada. Se ejerce la política con '
            'NODE_ENV=production (fuera de producción la guarda retorna sin mirar: HALL-10) '
            'y se comprueba que los 26 destinos configurados usan dominios .invalid.'
        ),
        'command': 'yarn test:integration --testPathPatterns=agenda-mensajeria-salida-bloqueada',
        'exit_code': 0,
        'evidence_paths': [
            'docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-regresion-final-integracion.txt'
        ],
    },
    'H3.S2.M3': {
        'status': 'PASS',
        'artifact': ARTEFACTO_HOY,
        'reason': (
            'Ya no se acredita con el booleano chatDelivered: se comprueban las tres cosas '
            'que pide el DoD con filas reales — conversación, dos participantes y el mensaje '
            'sin leer para el destinatario.'
        ),
        'command': 'yarn test:integration --testPathPatterns=agenda-mensajeria-persistencia',
        'exit_code': 0,
        'evidence_paths': [
            'docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-regresion-final-integracion.txt'
        ],
    },
    'H6.etapa2.lint': {
        'status': 'PASS',
        'artifact': ARTEFACTO_HOY,
        'reason': (
            'Los 9 prettier/prettier ajenos se corrigieron con lint --fix, en commit propio. '
            'Etapa 2 de la pirámide en exit 0.'
        ),
        'command': 'yarn lint --max-warnings=0',
        'exit_code': 0,
        'evidence_paths': [
            'docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-etapa2-lint.txt'
        ],
    },
    'H6.etapa1.typecheck': {
        'artifact': ARTEFACTO_HOY,
        'reason': (
            'exit 0, pero con una salvedad de entorno: en dev limpio fallaba por un archivo '
            'corrupto de node_modules (@mikro-orm/core/types/TimeType.d.ts, «import tyxe»). '
            'Se reparó la copia local, que no se versiona.'
        ),
        'command': 'yarn typecheck',
        'exit_code': 0,
        'evidence_paths': [
            'docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-etapa1-typecheck.txt'
        ],
    },
}


def participante(nombre: str, kind: str, version: str) -> dict[str, str]:
    return {'name': nombre, 'kind': kind, 'version': version}


def check(
    check_id: str,
    gate: str,
    scope: str,
    artifact: str,
    required: bool,
    applicable: bool,
    status: str,
    reason: str,
    participants: list[dict[str, str]],
    command: str | None,
    exit_code: int | None,
    evidence_paths: list[str],
    limits: str,
) -> dict[str, Any]:
    """Un check con los trece campos del formato (H1.S2.M1). Ninguno es opcional."""
    return {
        'check_id': check_id,
        'gate': gate,
        'scope': scope,
        'artifact': artifact,
        'required': required,
        'applicable': applicable,
        'status': status,
        'reason': reason,
        'participants': participants,
        'command': command,
        'exit_code': exit_code,
        'evidence_paths': evidence_paths,
        'limits': limits,
    }


ITZAN = [participante('scheduling-module', 'artefacto', 'v0.1.0-transitional')]

# --- Nivel A: los gates del artefacto -------------------------------------
# Transcritos de MANIFEST-artefacto-h3.md §H3.S3.M2, tal como los declaró su
# autor. No se reinterpretan ni se completan: A4-A6 va agrupado porque así lo
# entregó, y desagruparlo sería inventar tres resultados donde hay uno.
GATE_A = [
    check(
        'A1', 'A', 'static', 'scheduling-module@v0.1.0-transitional', True, True, 'FAIL',
        'Mapa de resolución sin vecino: el artefacto SÍ resuelve a messaging y community. '
        'Declarado por su autor en vez de empaquetar una versión rota.',
        ITZAN, None, None, [f'{FUENTE_ITZAN}/MANIFEST-artefacto-h3.md'],
        'Evidencia en otro repo y en una rama sin mergear. Los 117 archivos del paquete no viajan.',
    ),
    check(
        'A2', 'A', 'static', 'scheduling-module@v0.1.0-transitional', True, True, 'FAIL',
        'Typecheck/build delimitado por módulo: no existe de forma nativa (el repo no es un '
        'monorepo Nest). Typecheck completo con los vecinos retirados: exit 2, 143 errores, '
        'contra una línea base de exit 0 en la misma copia.',
        ITZAN, 'tsc --noEmit (en copia descartable, sin messaging ni community)', 2,
        [f'{FUENTE_ITZAN}/evidencia/H2.S2-gates-en-la-copia.txt'],
        'Mide la copia aislada, no el repo. 5 de los 143 errores caen dentro de scheduling.',
    ),
    check(
        'A3', 'A', 'integration', 'scheduling-module@v0.1.0-transitional', True, True, 'NOT_RUN',
        'Arranque propio y cierre limpio: bloqueado por A2. No se ejecutó.',
        ITZAN, None, None, [f'{FUENTE_ITZAN}/evidencia/H2.S2-gates-en-la-copia.txt'],
        'Sin evidencia fabricada ni heredada de otra versión.',
    ),
    check(
        'A4-A6', 'A', 'integration', 'scheduling-module@v0.1.0-transitional', True, True, 'NOT_RUN',
        'Aceptación local contra el laboratorio de Pablo: bloqueada por A3, que a su vez lo '
        'está por A2. Su autor la entregó agrupada en una sola fila.',
        ITZAN + [participante('agenda-notice-capability.lab', 'real', 'cd1889bf')],
        None, None, [f'{FUENTE_ITZAN}/evidencia/H2.S3-veredicto-honesto.md'],
        'Cubre tres gates en un solo resultado. Desagruparlos sería inventar dos resultados.',
    ),
    check(
        'A7', 'A', 'static', 'scheduling-module@v0.1.0-transitional', True, True, 'PASS',
        'Escaneo de secretos sobre los 117 archivos: sin coincidencias.',
        ITZAN, None, None, [f'{FUENTE_ITZAN}/MANIFEST-artefacto-h3.md'],
        'El autor no pegó el comando, sólo su resultado.',
    ),
    check(
        'A8', 'A', 'static', 'scheduling-module@v0.1.0-transitional', True, True, 'PASS',
        'Escaneo de datos reales de personas sobre los 117 archivos: sin coincidencias.',
        ITZAN, None, None, [f'{FUENTE_ITZAN}/MANIFEST-artefacto-h3.md'],
        'El autor no pegó el comando, sólo su resultado.',
    ),
]

YO = [participante('mantra-core-health-api', 'real', '4cc5ea1f')]

# --- Nivel B: lo que se cerró hoy en la relación --------------------------
GATE_B_NUEVOS = [
    check(
        'H2.S2.M1', 'B', 'integration', ARTEFACTO_HOY, True, True, 'PASS',
        'Los dos extremos fijados por versión: el consumidor por versión declarada y commit '
        'de origen alcanzable; el proveedor por sha256 recalculado en cada corrida.',
        YO + ITZAN + [participante('agenda-notice-capability.lab', 'doble', 'cd1889bf')],
        'yarn test:integration --testPathPatterns=agenda-mensajeria-relacion', 0,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h1-fijacion-por-version.txt'],
        'El sha256 del consumidor se declara, no se recalcula: sus archivos no están en este repo.',
    ),
    check(
        'H2.S3.M1', 'B', 'integration', ARTEFACTO_HOY, True, True, 'PASS',
        'Matriz de combinaciones de versión, con la celda del contrato del piloto declarada '
        'NO_APLICA porque ese artefacto no existe.',
        YO + ITZAN,
        'yarn test:integration --testPathPatterns=agenda-mensajeria-relacion', 0,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h1-fijacion-por-version.txt'],
        'Una fila por eje: es lo que existe. No se inventaron versiones históricas.',
    ),
    check(
        'H4.S3.M1', 'B', 'db', ARTEFACTO_HOY, True, True, 'PASS',
        'HALL-08: medido con ROLLBACK. Emitir dentro de una transacción que se deshace deja 0 '
        'filas; sin transacción ambiente deja 1. El puerto se suma a la transacción de quien '
        'lo llama, así que ADV-09 es alcanzable sin tocarlo.',
        YO, 'yarn test:integration --testPathPatterns=agenda-mensajeria-durabilidad', 0,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-regresion-final-integracion.txt'],
        'Mide el puerto, no el camino de negocio completo. Q-06 sigue sin decidirse: esto es '
        'la observación, no el veredicto.',
    ),
    check(
        'H4.S3.M2', 'B', 'db', ARTEFACTO_HOY, True, True, 'PASS',
        'Reintento idempotente cruzando un reinicio real del proceso: dos composiciones '
        'distintas de la app, una sola fila.',
        YO, 'yarn test:integration --testPathPatterns=agenda-mensajeria-durabilidad', 0,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-regresion-final-integracion.txt'],
        'La idempotencia descansa en la clave de rebote, que no tiene índice único (HALL-03).',
    ),
    check(
        'H4.S3.M3', 'B', 'db', ARTEFACTO_HOY, True, True, 'PASS',
        'HALL-09: un aviso a un destinatario inexistente no deja rastro en ninguna parte — '
        'ni solicitud, ni entrega, ni cola de muertos.',
        YO, 'yarn test:integration --testPathPatterns=agenda-mensajeria-durabilidad', 0,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-regresion-final-integracion.txt'],
        'El check aprueba porque la medición se ejecutó. Que el resultado sea aceptable es Q-06.',
    ),
]

# --- Nivel C: la regresión del sistema ------------------------------------
GATE_C_NUEVOS = [
    check(
        'H6.etapa4.integracion', 'C', 'integration', ARTEFACTO_HOY, True, True, 'PASS',
        'Etapa 4: las cuatro suites de la relación, 51 pruebas, exit 0.',
        YO, 'yarn test:integration --testPathPatterns=agenda-mensajeria', 0,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h5-regresion-final-integracion.txt'],
        'Sólo las suites de esta relación. La integración full-app sigue rota por HALL-01.',
    ),
    check(
        'H6.etapa5.e2e', 'C', 'e2e', ARTEFACTO_HOY, True, True, 'PASS',
        'Etapa 5: EJECUTADA con datos reales — 3 passed, exit 0. La suite ya no se saltea: sus '
        'cuatro credenciales P8 existen porque se corrió tools/alovida/p8-avisos-agenda.mjs '
        'contra la API viva (27/27 pasos, exit 0), y para eso hubo que corregirle dos derivas '
        '—el alta de paciente pide seis campos que no mandaba, y elegía un cupo que se pisa con '
        'lo ya sembrado—. El front se sirvió con `ng serve --configuration e2e-real`, que apaga '
        'mockBackend: la pantalla habla con la API, no con el simulador.',
        YO + [participante('mantra-core-health', 'real', 'mockup@68969782')],
        'npx playwright test playwright/carril-p8-avisos-agenda.spec.ts --reporter=list', 0,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h6-etapa5-e2e-ejecutado.txt',
         'docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h6-etapa5-recorrido-p8.json',
         'docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/evidencia/h6-etapa5-e2e-no-ejecutable.txt'],
        'Acredita que la relación se ve en pantalla con datos de la API real. NO acredita la '
        'campana in-app ni su badge: son del carril P1 y todavía no existen en el frontend.',
    ),
    check(
        'H6.etapa7.crossbrowser', 'C', 'e2e', ARTEFACTO_HOY, False, False, 'NOT_RUN',
        'Etapa 7: el proyecto no soporta cross-browser — playwright.config.ts declara un único '
        'project, chromium. NOT_RUN con motivo verificado en archivo, que es lo que su DoD admite.',
        YO + [participante('mantra-core-health', 'real', 'mockup')],
        None, None,
        ['docs/trabajo/2026-09-20-cerrar-pendientes-carril-b/REPORTE.md'],
        'No aplicable: no es una deuda, es una capacidad que el proyecto no tiene.',
    ),
]


def main() -> None:
    with io.open(ORIGEN_B, encoding='utf-8') as f:
        previo = json.load(f)

    checks: list[dict[str, Any]] = []
    for original in previo['checks']:
        actualizado = dict(original)
        cambio = ACTUALIZACIONES.get(original['check_id'])
        if cambio:
            actualizado.update(cambio)
            actualizado['limits'] = (
                original['limits'] + ' · Reevaluado el 2026-09-20 sobre ' + ARTEFACTO_HOY + '.'
            )
        checks.append(actualizado)

    checks = GATE_A + checks + GATE_B_NUEVOS + GATE_C_NUEVOS

    consolidado = {
        'registro': 'consolidado de los checks de los niveles A, B y C',
        'fecha': '2026-09-20',
        'responsable': 'Justin (carril B)',
        'artefacto_base': ARTEFACTO_HOY,
        'formato': previo['formato'],
        'estados': ['PASS', 'FAIL', 'BLOCKED', 'NOT_RUN'],
        'niveles': {
            'A': 'artefacto — el módulo empaquetado (dueño: Itzan)',
            'B': 'relación — agenda → mensajería (dueño: Justin)',
            'C': 'sistema — la regresión del candidato (dueño: Justin, con insumo de Pablo)',
        },
        'fuentes': [
            {
                'nivel': 'A',
                'origen': f'{FUENTE_ITZAN}/MANIFEST-artefacto-h3.md §H3.S3.M2',
                'nota': 'Transcrito de prosa: su autor no publicó JSON. Rama sin mergear.',
            },
            {
                'nivel': 'B',
                'origen': 'docs/trabajo/2026-09-19-relacion-agenda-mensajeria/registro-de-checks.json',
                'nota': 'Leído del archivo, no retipeado. Cinco checks reevaluados hoy.',
            },
            {
                'nivel': 'C',
                'origen': 'ídem + las etapas corridas el 2026-09-20',
                'nota': 'La regresión full-app de Pablo (5 rojos por HALL-01) es insumo, no check propio.',
            },
        ],
        'ausencias_declaradas': [
            {
                'quien': 'Ender — propietario del contrato del piloto',
                'estado': '0 / 50 microtareas; su daily nunca se ejecutó',
                'efecto': 'No existe artefacto de contrato, así que el nivel A no tiene su check '
                          'de compatibilidad y la matriz de versiones del gate B tiene una celda NO_APLICA.',
            },
        ],
        'checks': checks,
        'nota_de_revision': previo['nota_de_revision'],
    }

    with io.open(SALIDA_JSON, 'w', encoding='utf-8', newline='\n') as f:
        json.dump(consolidado, f, ensure_ascii=False, indent=2)
        f.write('\n')

    obligatorios = [c for c in checks if c['required'] and c['applicable']]
    no_aprobados = [c for c in obligatorios if c['status'] != 'PASS']

    lineas = [
        '# Gates obligatorios aplicables que NO aprobaron',
        '',
        'Generado por `consolidar-registro.py` desde '
        '`registro-de-checks-consolidado.json`. **No se edita a mano.**',
        '',
        f'- **Artefacto base:** `{ARTEFACTO_HOY}`',
        f'- **Checks totales:** {len(checks)} · **obligatorios y aplicables:** '
        f'{len(obligatorios)} · **no aprobados:** {len(no_aprobados)}',
        '',
        '## La regla que se está midiendo',
        '',
        '> Todos los checks obligatorios aplicables **del nivel** deben aprobar '
        '**para el mismo artefacto y configuración**.',
        '',
        '## Por nivel',
        '',
        '| Nivel | Obligatorios aplicables | Aprobados | No aplicables | Veredicto del nivel |',
        '|---|---:|---:|---:|---|',
    ]
    no_aplicables = [c for c in checks if c['required'] and not c['applicable']]
    for nivel in ('A', 'B', 'C'):
        del_nivel = [c for c in obligatorios if c['gate'] == nivel]
        ok = [c for c in del_nivel if c['status'] == 'PASS']
        na = [c for c in no_aplicables if c['gate'] == nivel]
        veredicto = 'APROBADO' if len(ok) == len(del_nivel) and del_nivel else 'NO APROBADO'
        # Un nivel que aprueba habiendo declarado algo no aplicable no se puede
        # leer igual que uno que aprobó con todo ejercitado.
        if veredicto == 'APROBADO' and na:
            veredicto = 'APROBADO — con salvedad'
        lineas.append(
            f'| {nivel} | {len(del_nivel)} | {len(ok)} | {len(na)} | **{veredicto}** |'
        )

    if no_aplicables:
        lineas += [
            '',
            '### La salvedad: lo que se declaró NO aplicable',
            '',
            'Un check obligatorio marcado no aplicable **no aprobó**: quedó fuera del '
            'denominador. Cada uno con su motivo, para que el veredicto de arriba no se lea '
            'como que se ejercitó todo.',
            '',
            '| Check | Nivel | Estado | Por qué no aplica |',
            '|---|---|---|---|',
        ]
        for c in no_aplicables:
            lineas.append(
                f'| `{c["check_id"]}` | {c["gate"]} | {c["status"]} | {c["limits"]} |'
            )

    lineas += ['', '## Los que no aprobaron', '',
               '| Check | Nivel | Estado | Por qué | De quién depende |', '|---|---|---|---|---|']
    dueno = {'A': 'Itzan', 'B': 'Justin / negocio', 'C': 'Justin / coordinación'}
    for c in no_aprobados:
        # Cortar en el primer '.' partía los motivos que nombran un archivo
        # («…carril-p8-avisos-agenda.spec.ts»). Se corta por fin de oración real.
        motivo = c['reason'].split('. ')[0].strip().rstrip('.')
        lineas.append(
            f'| `{c["check_id"]}` | {c["gate"]} | **{c["status"]}** | {motivo} | {dueno[c["gate"]]} |'
        )

    # El campo `artifact` se usa con dos sentidos en el registro heredado: unas
    # veces nombra la versión del repo, y otras el sujeto bajo prueba («canal
    # correo»). Para «el mismo artefacto» sólo cuentan las referencias de
    # versión; contar las otras infla el problema y lo vuelve ilegible.
    refs_de_version = sorted(
        {
            c['artifact']
            for c in obligatorios
            if c['gate'] == 'B' and '@' in c['artifact'] and c['artifact'].startswith('mantra-core-health-api@')
        }
    )
    sujetos = sorted(
        {
            c['artifact']
            for c in obligatorios
            if c['gate'] == 'B' and not c['artifact'].startswith('mantra-core-health-api@')
        }
    )
    lineas += [
        '',
        '## La condición que además no se cumple: «el mismo artefacto»',
        '',
        f'El nivel B acumula checks de **{len(refs_de_version)} versiones distintas del repo**, '
        'porque parte se verificó en el corte anterior y parte hoy:',
        '',
    ]
    lineas += [f'- `{a}`' for a in refs_de_version]
    lineas += [
        '',
        'Para declarar el nivel B aprobado hay que **volver a correrlo entero sobre una sola '
        'versión**. Ninguno de sus checks está en rojo por código, pero la regla no habla de '
        'checks sueltos: habla del nivel, sobre un artefacto y una configuración.',
        '',
        '> **Salvedad sobre el campo `artifact`.** En el registro heredado no siempre nombra una '
        f'versión: en {len(sujetos)} checks nombra el **sujeto bajo prueba** '
        f'({", ".join("`" + s + "`" for s in sujetos)}). Esos no son artefactos distintos, es el '
        'mismo campo usado con dos sentidos. Vale la pena unificarlo antes del próximo consolidado.',
        '',
    ]

    with io.open(SALIDA_TABLA, 'w', encoding='utf-8', newline='\n') as f:
        f.write('\n'.join(lineas))

    print(f'checks consolidados: {len(checks)} (A={len(GATE_A)}, '
          f'B={len([c for c in checks if c["gate"] == "B"])}, '
          f'C={len([c for c in checks if c["gate"] == "C"])})')
    print(f'obligatorios aplicables: {len(obligatorios)} · no aprobados: {len(no_aprobados)}')
    for c in no_aprobados:
        print(f'  - {c["check_id"]} [{c["gate"]}] {c["status"]}')
    print(f'escritos: {os.path.basename(SALIDA_JSON)}, {os.path.basename(SALIDA_TABLA)}')


if __name__ == '__main__':
    main()
