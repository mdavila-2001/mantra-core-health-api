# Controladores — polyglot_storage

Tres controladores, 15 endpoints. Todos delegan en un servicio y no contienen lógica: el
controlador resuelve la ruta y el rol, el servicio decide.

## `/governance` — `StorageGovernanceController` (11)

| Método · ruta | UC | Rol |
| --- | --- | --- |
| `POST /governance/storage-backends` | 01 | `PLATFORM_ADMIN` |
| `POST /governance/datasets` | 02 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/datasets/:id/versions` | 03 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/collections` | 04 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/placements/approve` | 05 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/consistency-policies` | 06 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/datasets/:id/data-access-policies` | 07 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/tenants/:tenantId/storage-bindings` | 08 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/encryption-profiles` | 09 | `SECURITY_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/policies` | 10 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /governance/placements/:id/failover` | 11 | `PLATFORM_ADMIN` |

Este controlador inyecta los tres servicios: el failover es una operación de marcha, pero se publica
bajo `/governance` porque forzarlo a mano es una decisión de gobierno, no de monitorización.

## `/ops` — `StorageOperationsController` (3)

| Método · ruta | UC | Rol |
| --- | --- | --- |
| `POST /ops/store-health-checks` | 11 | `SYSTEM`, `PLATFORM_ADMIN` |
| `POST /ops/integrity-policies` | 13 | `GOVERNANCE_ADMIN`, `PLATFORM_ADMIN` |
| `POST /ops/integrity/:datasetId/verify` | 13 | `SYSTEM`, `PLATFORM_ADMIN` |

## `/finops` — `StorageFinOpsController` (1)

| Método · ruta | UC | Rol |
| --- | --- | --- |
| `POST /finops/storage-cost-snapshots` | 12 | `SYSTEM`, `FINOPS_ANALYST`, `PLATFORM_ADMIN` |

## Códigos de estado

`201` en todo lo que crea una fila. `200` en las dos operaciones que mutan algo existente: el
failover manual y la verificación de integridad —esta última porque su respuesta es un veredicto
(`matched`), no un recurso nuevo.

## Actor

Sólo `failoverPlacement` recibe `@CurrentUser()`: es la única operación donde *quién* la ordenó
forma parte de lo que hay que poder reconstruir después. El resto toma el actor del contexto de
auditoría como los demás módulos.

## Rutas planas

`placements/:id/failover` e `integrity/:datasetId/verify` usan segmentos separados, no `{id}:accion`.
Nest 11 monta sobre `path-to-regexp` v8, que trata `:` como inicio de parámetro en cualquier
posición del segmento: `placements/{id}:failover` intentaría declarar un parámetro llamado
`id}:failover`.

## Divergencia con el caso de uso

`POST /governance/placements/approve` va **sin `{id}`**: el caso de uso lo escribe con `{id}`, pero
declara `dataset_placements — INSERT/UPSERT` en sus tablas impactadas, así que la colocación se crea
en esta misma llamada y no hay ningún id que poner en la ruta. Detallado en el README del módulo.

## Pruebas

15 pruebas de delegación, una por endpoint, en los tres `*.controller.spec.ts`.
