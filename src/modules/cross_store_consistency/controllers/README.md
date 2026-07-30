# Controladores — cross_store_consistency

Dos controladores, 14 endpoints para 14 casos de uso. Todos delegan en un servicio y no contienen
lógica.

## `/admin` — `CrossStoreAdminController` (8)

Lo que decide una persona.

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /admin/projections/definitions` | 01 | 201 | `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /admin/projections/dead-letters/:id/replay` | 04 | 201 | ídem |
| `POST /admin/reconciliation/runs` | 05, 06 | 201 | `SYSTEM`, `RECONCILIATION_WORKER`, `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /admin/projections/drift/:id/repair-jobs` | 07 | 201 | `DATA_GOVERNANCE_ADMIN`, `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /admin/deletion-requests` | 08 | 201 | `PRIVACY_OFFICER`, `DPO`, `PLATFORM_ADMIN` |
| `PATCH /admin/deletion-requests/:id` | 11 | 200 | ídem |
| `POST /admin/data-movement-jobs` | 13 | 201 | `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /admin/archive-jobs` | 14 | 201 | `SYSTEM`, `DATA_GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |

## `/workers` — `CrossStoreWorkerController` (6)

Lo que ejecuta un proceso.

| Método · ruta | UC | Código | Rol |
| --- | --- | --- | --- |
| `POST /workers/projections/deliveries/process` | 02, 03 | 200 | `SYSTEM`, `PROJECTION_WORKER`, `PLATFORM_ADMIN` |
| `POST /workers/projections/dead-letters` | 04 | 201 | ídem |
| `POST /workers/deletion-requests/:id/expand` | 09 | 201 | `SYSTEM`, `DELETION_WORKER`, `PLATFORM_ADMIN` |
| `POST /workers/deletion-targets/:id/executions` | 10 | 201 | ídem |
| `POST /workers/deletion-targets/:id/verifications` | 11 | 201 | ídem |
| `POST /workers/cache/invalidations` | 12 | 201 | `SYSTEM`, `MAINTENANCE_WORKER`, `PLATFORM_ADMIN` |

## El prefijo `/workers` sí está en el caso de uso

A diferencia de otros módulos, aquí el prefijo lo declara el propio caso de uso y se conserva. Tiene
sentido: la separación entre lo que decide una persona y lo que ejecuta un proceso es exactamente la
que este módulo necesita hacer visible, y los roles la refuerzan.

## Quién puede hacer qué

**Quien ejecuta el borrado no lo cierra.** `DELETION_WORKER` aparece en `/expand`, `/executions` y
`/verifications`, pero el cierre (`PATCH /admin/deletion-requests/:id`) es del DPO. Quien ejecuta no
certifica que se cumplió — y el cierre es el momento en que se declara satisfecho un derecho.

**Quien proyecta no repara.** `PROJECTION_WORKER` no aparece en `/repair-jobs`: reescribir un store
entero desde el canónico es una decisión de gobierno, no un paso más del consumidor.

**Quien reconcilia no repara solo.** `RECONCILIATION_WORKER` puede correr la reconciliación, pero
`/repair-jobs` exige `DATA_GOVERNANCE_ADMIN` o `SYSTEM`: detectar es automático, decidir qué se
reescribe no del todo.

**Sólo el DPO solicita borrados.** `DATA_GOVERNANCE_ADMIN` gobierna proyecciones y almacenamiento,
pero no aparece en `/deletion-requests`.

## Códigos de estado

`201` en casi todo, porque casi todo crea una fila de control: un intento, una entrada de cola
muerta, una corrida, un job.

`200` en dos: `/deliveries/process` —que puede no crear nada si el evento ya estaba aplicado, y ese
es su caso más frecuente— y `PATCH /deletion-requests/:id`, que cierra algo que ya existía.

## Rutas planas

El caso de uso escribe `deliveries:process`, `{id}:replay` y `{id}:expand`. Nest 11 monta sobre
`path-to-regexp` v8, que trata `:` como inicio de parámetro en **cualquier** posición del segmento:
`{id}:replay` declararía un parámetro llamado `id}:replay` y la ruta no montaría.

## Dos rutas de cola muerta, dos controladores

`POST /workers/projections/dead-letters` (mandar) y
`POST /admin/projections/dead-letters/:id/replay` (reprocesar) están separadas a propósito: la
primera la llama el consumidor cuando agota reintentos; la segunda la decide una persona que ha
mirado por qué falló.

## Actor

Todas las rutas reciben `@CurrentUser()`. En `/deletion-requests` el actor **es** quien solicita
(`requestedByUserId`): no se acepta por el cuerpo, porque en un borrado por derecho al olvido hay que
poder decir quién lo pidió.

## Pruebas

14 pruebas de delegación en `cross-store-controllers.spec.ts`.
