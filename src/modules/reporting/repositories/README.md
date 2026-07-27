# Repositorios de reportes

Acceso a `reporting.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `reporting`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Tablas | Métodos destacados |
| --- | --- | --- |
| `ReportingDefinitionsRepository` | `report_data_sources`, `report_definitions`, `report_parameters`, `report_columns`, `report_versions`, `dashboards`, `dashboard_widgets` | `createDataSource`, `findDataSourceByCode`, `createDefinition`, `findDefinitionForUpdate`, `findDefinitionByCode`, `createParameter`, `findParametersByDefinition`, `createColumn`, `createVersion`, `findVersion`, `findActiveVersion`, `createDashboard`, `findDashboardByCode`, `createWidget` |
| `ReportingRunsRepository` | `report_executions`, `report_snapshots`, `report_schedules`, `report_distributions`, `report_subscriptions` | `createExecution`, `findExecutionForUpdate`, `createSnapshot`, `findSnapshotByExecution`, `findSnapshotByHash`, `createSchedule`, `findDueSchedules`, `findSchedulesByDefinitionForUpdate`, `createDistribution`, `findDistributionsByExecution`, `createSubscription`, `findSubscription`, `findActiveSubscriptions` |

La división separa lo que se **declara** de lo que se **ejecuta**: la primera cambia cuando alguien
diseña un reporte, la segunda en cada corrida.

## Lecturas con bloqueo

`findDefinitionForUpdate` (serializa el versionado y la deprecación), `findExecutionForUpdate`,
`findSchedulesByDefinitionForUpdate` y `findDistributionsByExecutionForUpdate` usan
`LockMode.PESSIMISTIC_WRITE`.

`findDueSchedules` usa `LockMode.PESSIMISTIC_PARTIAL_WRITE` (FOR UPDATE SKIP LOCKED). Es la consulta
más delicada del módulo: filtra por `is_enabled`, estado activo y `next_run_at <= now`, ordena por
vencimiento y salta lo que otro tick ya tiene tomado. Sin el SKIP LOCKED, dos ticks solapados
dispararían la misma programación dos veces.

## Lecturas por clave natural

`findDataSourceByCode`, `findDefinitionByCode` y `findDashboardByCode` anticipan la UNIQUE para
devolver un error de dominio. `findVersion` (definición + número) hace lo propio con la colisión de
versiones.

## Lecturas de idempotencia

`findSnapshotByExecution` impide un segundo artefacto para la misma corrida.
`findDistributionsByExecution` da las filas ya creadas, con las que el servicio omite destinatarios
repetidos. `findSubscription` (programación + usuario + canal) convierte una segunda suscripción en
reactivación.

## Deduplicación por contenido

`findSnapshotByHash` busca un artefacto con el mismo `content_hash`. No se usa para bloquear el alta
—cada corrida guarda el suyo— sino para informar en la respuesta que el contenido ya existía, que es
lo que permite al almacén reaprovechar el objeto.

## Rendimiento

Consultas por PK, FK, clave natural o hash, todas indexadas. La del tick filtra por `next_run_at`,
que en el modelo lleva índice, y acota con `limit`. Sin N+1: nada recorre relaciones fila por fila.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real del SKIP LOCKED, de
los bloqueos y de las UNIQUE llega con las pruebas de integración.
