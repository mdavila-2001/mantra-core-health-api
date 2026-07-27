# DTO de reportes

Contratos de entrada/salida con `class-validator` y anotaciones Swagger, en un único archivo
(`reporting.dto.ts`) porque los 12 casos de uso comparten vocabulario (definición, corrida, formato).

## Convenciones

- **Enums de dominio por código legible** (`READ_MODEL`, `CSV`, `SUM`, `CHART`, `BAR`…); el servicio
  los traduce al `*_concept_id` del catálogo.
- **Fechas** ISO-8601 (`@IsISO8601()`), convertidas a `Date` en el servicio.
- **Colecciones anidadas** (`parameters`, `columns`, `widgets`, `recipients`) con
  `@ValidateNested({ each: true })` y `@Type`. `columns` y `widgets` llevan `@ArrayMinSize(1)`: un
  reporte sin columnas no muestra nada y un tablero sin widgets está vacío.
- **Lotes acotados** (`@Max(500)` en `batchSize`): el tick es transaccional, y un lote sin techo
  mantendría la transacción abierta demasiado.
- **JSON de dominio** (`querySpecJson`, `rowSecurityJson`, `parametersJson`, `layoutJson`,
  `positionJson`) como `@IsObject()`: su forma la fija el motor de consulta o el cliente, no esta
  capa.

## `parametersJson` es un mapa, no una lista

Tanto en la corrida como en la programación, los valores llegan como
`{ "<código del parámetro>": <valor> }`. El servicio recorre **lo declarado** en la definición y
descarta lo que no reconoce; el DTO no puede validarlo porque los parámetros los define cada reporte.

## Lo que no se acepta

- **Derivados**: `currentVersion`, `nextRunAt` tras el primer alta, `rowCount` de la corrida y el
  estado de cualquier entidad se calculan y se devuelven; nunca se reciben.
- **El suscriptor**: sale del token, no del cuerpo. Aceptarlo permitiría suscribir a otro.
- **El siguiente `next_run_at`**: `CreateScheduleDto` recibe `firstRunAt` —un instante concreto— y
  el tick avanza por intervalo. Resolver la expresión cron con su zona horaria vive fuera de la
  transacción, y el DTO lo dice en su descripción.

## DTO por área

| Área | Entrada | Respuesta |
| --- | --- | --- |
| Fuentes | `CreateDataSourceDto` | `DataSourceResponseDto` |
| Definiciones | `CreateDefinitionDto` (+ `ReportParameterDto`, `ReportColumnDto`), `PublishReportVersionDto`, `DeprecateDefinitionDto` | `DefinitionResponseDto`, `ReportVersionResponseDto`, `DeprecateDefinitionResponseDto` |
| Corridas | `CreateExecutionDto`, `MaterializeSnapshotDto`, `RetryExecutionDto` | `ExecutionResponseDto`, `SnapshotResponseDto`, `RetryExecutionResponseDto` |
| Programación | `CreateScheduleDto`, `SchedulerTickDto` | `ScheduleResponseDto`, `SchedulerTickResponseDto` |
| Distribución | `DispatchDistributionDto` (+ `DistributionRecipientDto`), `SubscribeDto` | `DispatchResponseDto`, `SubscriptionResponseDto` |
| Tableros | `CreateDashboardDto` (+ `DashboardWidgetDto`) | `DashboardResponseDto` |

## Respuestas con conteos

`SchedulerTickResponseDto` devuelve `scanned` / `queued` / `skipped`, y `DispatchResponseDto`
`created` / `skipped`. Sin ellos, un operador que ve un tick "correcto" no distinguiría uno que
disparó veinte reportes de uno que no disparó ninguno porque todas las definiciones estaban
deprecadas.

## Ejemplo de solicitud

```json
POST /reporting/definitions/{id}/executions
{
  "parametersJson": {
    "desde": "2026-07-01",
    "hasta": "2026-07-31",
    "practiceId": "11111111-1111-1111-1111-111111111111"
  },
  "outputFormat": "XLSX"
}
```

## Ejemplo de respuesta

```json
{
  "id": "22222222-2222-2222-2222-222222222222",
  "reportVersionId": "33333333-3333-3333-3333-333333333333",
  "statusConceptId": "…",
  "outputFormatConceptId": "…"
}
```

`reportVersionId` es la versión con la que se ejecutará: si la definición cambia mañana, esta
corrida seguirá dando lo mismo.
