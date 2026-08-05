# Controladores de reportes

Capa HTTP. Validan, autorizan y delegan; la transacción vive en el servicio.

## Rutas

Un único controlador (`ReportingController`, prefijo `reporting`) con 12 endpoints sobre
`data-sources`, `definitions`, `executions`, `schedules`, `scheduler`, `dashboards` y
`subscriptions`.

## Autenticación y autorización

`JwtAuthGuard` global + `@Roles(...)`:

| Rol | Alcance |
| --- | --- |
| `REPORTING_ADMIN` | Todo el módulo |
| `DATA_STEWARD` | Registrar fuentes de datos |
| `REPORT_AUTHOR` | Definiciones, versiones, programaciones y tableros |
| `REPORT_VIEWER` | Ejecutar bajo demanda y suscribirse |
| `SYSTEM` | Snapshot, tick del planificador, distribuciones y reintentos |

Es deliberado que `REPORT_AUTHOR` no pueda registrar fuentes: quien diseña reportes no debería poder
ampliar de dónde se leen los datos. Y que sólo `REPORTING_ADMIN` deprece, porque arrastra la
suspensión de todas las programaciones.

## Validaciones HTTP

`ParseUUIDPipe` en todos los parámetros de ruta. `ValidationPipe` global sobre los cuerpos.

## Los dos endpoints de sistema

`POST /reporting/scheduler/tick` y `POST /reporting/executions/:id/snapshot` llevan rol `SYSTEM`, no
`@Public()`: los llama un worker interno con credencial, no un tercero.

El tick no cuelga de ningún recurso —barre todas las programaciones vencidas— y por eso vive en
`scheduler/tick` en vez de bajo `schedules`.

## Códigos de respuesta

`201 Created` en las altas (fuente, definición, versión, ejecución, snapshot, programación,
distribución, suscripción, tablero). `200 OK` en lo que muta algo existente o devuelve un resumen:
el tick, el reintento y la deprecación.

## Nota sobre las rutas del caso de uso

Los casos de uso escriben tres rutas con dos puntos (`/versions:publish`, `/executions/{id}:retry`,
`/definitions/{id}:deprecate`). Aquí se usan segmentos normales por el mismo motivo que en el resto
del proyecto: el enrutador de Nest 11 interpreta `:` como inicio de parámetro en cualquier posición
del segmento.

## Pruebas

`reporting.controller.spec.ts` con ambos servicios mockeados: delegación, argumentos (incluido el
actor y los ids de ruta) y propagación de errores.
