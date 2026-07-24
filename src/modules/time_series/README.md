# time_series — Módulo 58 del modelo · TimescaleDB

Doce flujos de medición append-only sobre hypertables de TimescaleDB. Se materializaron en
este cambio: el modelo los declara desde v4.0 pero no existían como entidades.

## Por qué son distintas del resto de entidades

**No tienen `id` uuid.** Su clave primaria es compuesta y coincide con la clave de
particionado:

```ts
@PrimaryKey({ columnType: 'timestamptz' })  time!: Date;        // <<TIME_KEY>>
@PrimaryKey({ fieldName: 'tenant_id', ... }) tenantId!: string; // <<PARTITION_KEY>>
@PrimaryKey({ fieldName: 'series_id', ... }) seriesId!: string; // <<SERIES_KEY>>
```

Un uuid sintético no aportaría nada en una serie temporal: nunca se accede a una medición
por identificador, siempre por rango de tiempo y serie.

**Sus tablas se convierten en hypertables** en la capa 07 del arranque del ORM
(`SELECT create_hypertable(..., 'time', if_not_exists => TRUE)`). Una hypertable es una
tabla particionada por tiempo con gestión automática de chunks: PostgreSQL crea, poda y
comprime particiones sin intervención. Sin esa conversión, estas tablas serían tablas planas
que crecen sin límite y cuya consulta por rango temporal acaba escaneándolo todo.

## Las doce series

| Entidad | Qué mide |
|---|---|
| `normalized_vital_series` | Constantes vitales ya normalizadas, con estado de validación clínica |
| `device_raw_reading_series` | Lecturas crudas de dispositivo, antes de normalizar |
| `lab_analyzer_event_series` | Eventos de analizadores de laboratorio |
| `telemetry_event_series` | Telemetría de producto |
| `application_tracking_series` | Trazas de uso de la aplicación |
| `location_ping_series` | Posiciones de seguimiento logístico |
| `ads_delivery_event_series` | Entrega de publicidad |
| `payment_gateway_metric_series` | Latencia y disponibilidad de pasarelas de pago |
| `ingestion_pipeline_metric_series` | Salud de los pipelines de ingesta |
| `ai_runtime_metric_series` | Consumo y latencia de los modelos |
| `audit_access_metric_series` | Volumen de accesos auditados |
| `service_sli_series` | Indicadores de nivel de servicio |

## Qué tener en cuenta al usarlas

- **Son append-only.** No se actualiza una medición; se inserta una corrección con marca de
  tiempo posterior. Varias llevan `validation_state` o `quality_state` para eso.
- **Filtrar siempre por `time`.** Sin predicado temporal, la hypertable no puede podar
  chunks y la consulta recorre todas las particiones.
- **`clinically_promoted_observation_id`** en `normalized_vital_series` es el puente hacia
  `clinical.observations`: una medición que pasa a formar parte del registro clínico se
  promueve, no se mueve.
- **Sin TimescaleDB instalado** las tablas se crean igualmente como tablas normales y el
  arranque registra la omisión. Funciona, pero no escala.

## Deuda pendiente

Las políticas de retención y compresión (qué chunks se comprimen a los N días, cuáles se
descartan) no están declaradas en el modelo. Cuando lo estén, van al `physicalCatalog` de
`src/orm/catalog/physical.catalog.ts` como sentencias idempotentes.
