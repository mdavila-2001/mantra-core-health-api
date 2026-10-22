# ADR-0024: Portal administrativo — catálogo de datos como módulo propio con jobs durables

## Estado
Aceptado (2026-09-18). Incremento 1 del portal administrativo (inspiración: paquete ATLAS).
Contiene un **desvío declarado** de [ADR-0021](ADR-0021-fuente-unica-de-ddl.md), con su salida.

## Contexto

El portal administrativo nuevo tiene que responder, con evidencia, qué tablas y columnas existen,
**por qué existen**, quién responde por ellas y qué cambió. El inventario del backend (ver
`docs/admin-portal/inventario-y-brechas.md`) encontró:

- `system_ops.entity_registry` / `field_registry` son el registro de **gobierno** (retención,
  políticas, PII/PHI), sin lugar para justificación, grano de fila, revisiones ni evidencia, y sus
  entidades son generadas (ADR-0022): no se editan a mano.
- La bóveda describe cada tabla, pero con texto de plantilla ("si esta tabla se eliminara, el
  negocio perdería…"). Sirve como evidencia importada, no como justificación aprobada.
- Los módulos de plataforma (`qa_lab`, `system_ops`, `platform_ops`, `telemetry`) no tienen **ni
  un GET**: todo es escritura por caso de uso. Un portal no tiene qué leer.

## Decisiones

**1. Módulo 67 `data_catalog`, schema propio.** Hechos técnicos (`catalog_objects`,
`catalog_columns`, `catalog_change_events`) separados de la semántica curada
(`catalog_annotations` + `catalog_annotation_revisions` + `catalog_review_decisions` +
`catalog_evidence_items`). Un escaneo nunca escribe en las fichas. El registro de gobierno se
**lee** (se muestra en la ficha), no se copia.

**2. Escaneo como job durable, sin cola nueva.** `POST /admin/catalog/scans` responde 202 sólo
tras insertar la corrida `QUEUED`. El worker `data_catalog` es un reloj (mismo patrón que
`qa_lab`): llama a `POST /internal/catalog/scans/run-next`, que reclama con
`FOR UPDATE SKIP LOCKED` y lease de 5 min. El `lease_owner` hace de fencing: un worker que perdió
el lease no puede cerrar la corrida. Un índice único parcial impide dos corridas vivas por fuente
aunque dos réplicas acepten a la vez. No se añade Kafka/Redis: el volumen (una corrida ocasional,
~10 s para 20 000 columnas medido) no lo justifica.

**3. Introspección con la conexión de la API en transacción `READ ONLY`.** Lee sólo `pg_catalog`
(nunca filas de negocio; las filas estimadas vienen de `reltuples`). Limitación aceptada y
declarada en cada corrida (`APP_CONNECTION_READ_ONLY_TX`): READ ONLY impide escribir pero no
reduce lo que la cuenta ve. Salida: una cuenta de catálogo dedicada cuando exista RLS efectivo
(ver ADR-0023, la app hoy conecta como superusuario).

**4. La aprobación se liga a un número de revisión.** Editar una ficha aprobada crea otra revisión
en `NEEDS_REVIEW`; lo aprobado sigue en el historial pero ya no es lo vigente. La segregación
proponente/aprobador se comprueba **por identidad** contra el autor de esa revisión, no por rol:
`SUPERADMIN` pasa todos los `@Roles` por comodín, pero tampoco se aprueba a sí mismo. Aprobar exige
al menos una evidencia; rechazar exige comentario. Edición con `expectedVersion` (409 al segundo
escritor).

**5. La cobertura la calcula el backend y viaja explicada.** Cinco dimensiones (técnica,
semántica, owner, sensibilidad, revisión) con denominador, `UNKNOWN` sin escaneo terminado,
`NOT_APPLICABLE` con denominador cero y versión del modelo de cálculo (`catalog-coverage/v1`). El
frontend no inventa porcentajes.

## Desvío de ADR-0021 y su salida

El DDL del módulo 67 está escrito a mano en
`database/SQL/patches/2026-09-18_v4219_data_catalog.sql` y reflejado en
`src/orm/catalog/{indexes,foreign-keys}/data_catalog.*.ts`, porque el módulo todavía no tiene
`.puml`. Es el mismo caso que v4.2.6 (`medical_groups`). **Pendiente:** declarar
`diagram_67_data_catalog.puml` con este contenido; entonces `gen_ddl.py` y `yarn orm:catalog`
deben reproducir exactamente el patch y las tuplas, y el patch pasa a ser salida generada.

No hay `CHECK` sobre estados en el patch a propósito: el ORM crea estas tablas en una base vacía
y no emite CHECKs, así que ponerlos sólo en el patch haría que dos bases "iguales" validen
distinto. Los estados se validan en el dominio del módulo.

## Consecuencias

- El catálogo necesita el worker `worker-data_catalog` desplegado; sin él las corridas quedan
  `QUEUED` (visible, no silencioso).
- Un renombre se ve como baja + alta; reasignar historial es decisión humana (pendiente de UI).
- La prueba de integración (`test/integration/data-catalog.int-spec.ts`) corre contra PostgreSQL
  real y aplica el patch; es opt-in por `DATA_CATALOG_IT_DB_URL` y una omisión no es aprobado.
