# Gates obligatorios aplicables que NO aprobaron

Generado por `consolidar-registro.py` desde `registro-de-checks-consolidado.json`. **No se edita a mano.**

- **Artefacto base:** `mantra-core-health-api@4cc5ea1f`
- **Checks totales:** 37 · **obligatorios y aplicables:** 34 · **no aprobados:** 5

## La regla que se está midiendo

> Todos los checks obligatorios aplicables **del nivel** deben aprobar **para el mismo artefacto y configuración**.

## Por nivel

| Nivel | Obligatorios aplicables | Aprobados | No aplicables | Veredicto del nivel |
|---|---:|---:|---:|---|
| A | 6 | 2 | 0 | **NO APROBADO** |
| B | 23 | 22 | 0 | **NO APROBADO** |
| C | 5 | 5 | 0 | **APROBADO** |

## Los que no aprobaron

| Check | Nivel | Estado | Por qué | De quién depende |
|---|---|---|---|---|
| `A1` | A | **FAIL** | Mapa de resolución sin vecino: el artefacto SÍ resuelve a messaging y community | Itzan |
| `A2` | A | **FAIL** | Typecheck/build delimitado por módulo: no existe de forma nativa (el repo no es un monorepo Nest) | Itzan |
| `A3` | A | **NOT_RUN** | Arranque propio y cierre limpio: bloqueado por A2 | Itzan |
| `A4-A6` | A | **NOT_RUN** | Aceptación local contra el laboratorio de Pablo: bloqueada por A3, que a su vez lo está por A2 | Itzan |
| `H4.S2.M1` | B | **FAIL** | Dos emit() en paralelo con la misma debounceKey crean DOS filas, ambas reportadas como exitosas | Justin / negocio |

## La condición que además no se cumple: «el mismo artefacto»

El nivel B acumula checks de **2 versiones distintas del repo**, porque parte se verificó en el corte anterior y parte hoy:

- `mantra-core-health-api@4cc5ea1f`
- `mantra-core-health-api@5d5007f`

Para declarar el nivel B aprobado hay que **volver a correrlo entero sobre una sola versión**. Ninguno de sus checks está en rojo por código, pero la regla no habla de checks sueltos: habla del nivel, sobre un artefacto y una configuración.

> **Salvedad sobre el campo `artifact`.** En el registro heredado no siempre nombra una versión: en 14 checks nombra el **sujeto bajo prueba** (`AGENDA_NOTICE_PORT en la app compuesta`, `app compuesta desde AppModule`, `canal correo`, `mantra_redesa_health@localhost:5433`, `messaging.message_channels@mantra_redesa_health`, `messaging.notification_requests`, `messaging.notification_requests / in_app_notifications`, `messaging.notification_requests @base recién materializada`, `package.json@5d5007f`, `pg_indexes / SQL/35_messaging/04_indexes.sql`, `src/ completo @5d5007f`, `src/modules/scheduling/adapters/messaging-agenda-notice.adapter.ts@5d5007f`, `test/doubles/strict-agenda-notice-port.double.ts`, `test/integration/agenda-mensajeria-relacion.int-spec.ts`). Esos no son artefactos distintos, es el mismo campo usado con dos sentidos. Vale la pena unificarlo antes del próximo consolidado.
