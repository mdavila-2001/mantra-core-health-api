# Estado y pendientes

Fuente de continuidad operativa del repositorio. Fecha de corte: **2026-07-28**.

## Estado actual

- La API está organizada en 57 módulos NestJS y expone 852 endpoints detectados por el analizador
  REDESA.
- La trazabilidad canónica y las remediaciones verificadas viven en `REDESA-TRAZABILIDAD.md`.
- El informe estático actual registra 0 endpoints mutantes sin política explícita y 0 entidades
  huérfanas; queda 1 acceso directo entre repositorios de dominios distintos, justificado
  (`billing/repositories/practices-lookup.repository.ts` lee `practice.practices` de solo lectura
  porque `invoices` no tiene `tenant_id` propio — ver `dunning.service.ts`).
- Hay 20 procesos worker separados (`src/worker-<dominio>.ts`, uno por dominio, arrancados vía
  `bootstrapWorker`), cada uno como cliente HTTP autenticado (`SystemApiClient`, rol `SYSTEM`) de
  la propia API — nunca importan servicios de dominio directamente. Cubren scheduling, pharmacy
  inventory, consent, delegated access, identity assurance, promotions, workflow, reporting,
  automation, qa lab, health context, cross-store consistency, messaging, integrations, billing,
  tracking, read models, **vector RAG** (drena la cola de embedding jobs) y **lakehouse** (cierra
  releases de investigación vencidos). `graph_intelligence` no tiene worker: sus endpoints de
  proyección son alimentados por evidencia/eventos externos (no hay nada que "descubrir" en un
  bucle sin fabricar datos de proyección). **time_series** tiene worker de compresión y rollups
  (automáticos) y de retención (`drop_chunks`, irreversible) — la retención es **opt-in por tabla**
  vía `TS_RETENTION_POLICIES`; sin configurarla, no borra nada.
- Los adapters de proveedor externo (envío real de notificaciones, borrado real en el store
  destino de cross-store, cálculo real de embeddings) son stubs que **fallan de forma visible**
  (`PROVIDER_NOT_CONFIGURED`) en vez de fingir éxito: ningún proveedor concreto vive en este repo
  todavía. Conectar uno real es sustituir el adapter (`job.providerAdapter = ...`), no tocar el job.
- Hay pruebas unitarias, de integración y smoke; los cambios sobre persistencia deben validarse
  contra una base real, no sólo con `EntityManager` simulado.

Las cifras anteriores son una fotografía. Regenerar `REDESA-COBERTURA.md` con
`yarn redesa:coverage` cuando cambien controllers, entidades o límites de dominio.

## Cambios transversales ya incorporados

- Auditoría sensible mediante `AuditTrailService`, historial versionado y protección WORM en base
  de datos.
- PDP clínico conjuntivo: un rol por sí solo no concede acceso a PHI; se exige alcance clínico
  vigente.
- Revocación de grants al retirar el consentimiento que los sustenta.
- Comprobación real y cerrada de credenciales profesionales para perioperatorio.
- Emisión idempotente y auditada de solicitudes de medicación.
- Eliminación de escrituras directas de promotions a payments y de scheduling a tablas de audit.
- Worker HTTP autenticado para relay, dispatch, colas y notificaciones de mensajería.

El detalle comprobable de cada punto, con archivos y pruebas, está en
`REDESA-TRAZABILIDAD.md`; las reglas propias de cada dominio están en
`src/modules/<modulo>/README.md`.

## Pendientes priorizados

### P0 · Conectar proveedores externos reales a los workers

Los 20 procesos worker ya existen, corren como proceso separado de la API (`docker-compose.yml`,
un contenedor por dominio) y cada tick tolera solaparse sin duplicar trabajo (claims/locks
`FOR UPDATE`/`SKIP LOCKED` donde hace falta). Lo que falta es sustituir los adapters stub por
proveedores reales:

- mensajería: envío real (SMS/email/push) en `notification-delivery.job.ts`;
- cross-store consistency: borrado real por backend en `deletion-pipeline.job.ts`;
- vector RAG: cálculo real de embeddings en `embedding-drain.job.ts`.

Antes de operar `time_series` en producción, configurar `TS_RETENTION_POLICIES` por tabla según la
política de retención real de cada serie (clínica vs. analítica vs. gobernada por consentimiento —
sin configurarla, el job de retención no borra nada).

`graph_intelligence` sigue sin worker: sus endpoints de proyección (nodos, aristas, corridas)
exigen datos reales de un lector de cambios (change-data-capture) que no existe en este repo;
construir uno es una decisión de arquitectura (qué dominios proyectar, con qué cadencia), no un
adapter que se pueda dejar en modo "falla limpio".

### P0 · Cerrado (mecanismo) — activar por entorno sigue pendiente de decisión de despliegue

`test/integration/rls.int-spec.ts` (`RLS_TEST=1 yarn test:integration`) ejecutado y en verde
(2026-07-29) contra Postgres real: aplica `database/SQL/99_rls/01_tenant_rls.sql`, crea el rol
`mantra_app` (sin `BYPASSRLS`) y demuestra, conectado como ese rol, que (1) con
`app.current_tenant_id` fijado sólo se ven las filas del tenant, (2) insertar una fila de otro
tenant se rechaza (`WITH CHECK`), (3) sin el GUC fijado el contexto es de sistema (permisivo,
comportamiento intencional para workers `SYSTEM`), (4) RLS + `FORCE` quedaron activos en las
tablas reales con `tenant_id`. `orm.config.ts` ya soporta `DB_APP_USER`/`DB_APP_PASSWORD` como
override de runtime (cae al propietario si no están definidas). Correr la suite completa después
no mostró regresiones: `mantra` (usuario por defecto) es superusuario y sigue viendo todo, que es
el comportamiento esperado en desarrollo.

Lo que sigue siendo una decisión de despliegue, no de código:

1. crear el rol `mantra_app` en cada entorno real (staging/prod) y fijar
   `DB_APP_USER`/`DB_APP_PASSWORD`/`RLS_ENFORCE=true` ahí — no en desarrollo, donde el rol
   propietario sigue siendo lo esperado;
2. mantener el rol propietario (`DB_USER`) sólo para DDL, migraciones y seed;
3. decidir el rollout (todas las tablas de una vez vs. gradual) y confirmar con el equipo de
   datos que ningún flujo actual depende de que el runtime tenga `BYPASSRLS`.

### P1 · Ampliar integración real

Hechos contra DB real (2026-07-29): RLS con dos tenants y roles distintos
(`rls.int-spec.ts`, opt-in) y los triggers WORM de `audit.audit_log`/`data_access_log`
(`audit-worm.int-spec.ts`, siempre corre — confirma que ni siquiera el rol propietario puede
UPDATE/DELETE una fila real de auditoría). Sigue priorizando escenarios donde un mock no demuestra
el comportamiento:

- `FOR UPDATE`, `SKIP LOCKED`, carreras e idempotencia concurrente (dos conexiones reales
  disputando el mismo lock — ninguna prueba actual lo hace, sólo se confía en el código);
- restricciones `UNIQUE`/FK e historiales (`*_history` vía `HistoryMirrorSubscriber`);
- outbox, reintentos y recuperación tras fallo parcial;
- operaciones sobre MongoDB, Redis y OpenSearch (las importaciones de terminología ya tienen 7
  suites de integración; falta lo mismo para document_store/redis_runtime/search_platform).

### P1 · Cerrado — entidades huérfanas

`ORPHAN_TABLE` está en 0: las 195 candidatas de la foto anterior recibieron cobertura indirecta por
grafo de FK o un repositorio propietario de solo lectura en su módulo. Cada `findById`/`listByX`
nuevo quedó acotado por `tenantId` (mismo patrón defensivo que el resto del repositorio), aunque la
mayoría siguen sin controller que los use todavía — si conectas uno, mantén el parámetro de tenant.

### P2 · Cerrar decisiones funcionales parametrizadas

Continúan abiertas las decisiones marcadas con 🔵 en `REDESA-TRAZABILIDAD.md`, incluyendo crédito
publicitario y valores de negocio configurables. Confirmarlas con producto/compliance y convertir
la decisión en configuración validada, prueba y documentación del módulo.

## Criterio de entrega

Una corrección se considera terminada cuando:

- compila y tiene pruebas del comportamiento normal, error y reintento;
- conserva tenant, autorización, auditoría e idempotencia;
- pasa `yarn redesa:guardrails`;
- actualiza trazabilidad o documentación del módulo si cambia el contrato;
- para persistencia o concurrencia, tiene evidencia de integración contra el almacén real.

## Mapa documental

| Documento | Propósito | Mantenimiento |
| --- | --- | --- |
| `README.md` | Arranque, arquitectura y operación | Manual, cuando cambia el proyecto |
| `ESTADO-Y-PENDIENTES.md` | Foto vigente y backlog transversal | Manual; reemplaza planes fechados |
| `REDESA-TRAZABILIDAD.md` | Reglas, implementación y pruebas | Manual, junto al cambio funcional |
| `REDESA-COBERTURA.md` | Hallazgos estáticos | Generado con `yarn redesa:coverage` |
| `src/modules/*/README.md` | Contrato por dominio | Manual, junto al módulo |

No crear documentos de sesión en la raíz. Si una investigación no se convierte en una decisión
vigente, debe permanecer fuera del repositorio; si se convierte, se integra en una de las fuentes
anteriores.
