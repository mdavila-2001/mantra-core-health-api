# Estado y pendientes

Fuente de continuidad operativa del repositorio. Fecha de corte: **2026-07-30**.

## Estado actual

- La API está organizada en 57 módulos NestJS y expone 852 endpoints detectados por el analizador
  REDESA.
- La trazabilidad canónica y las remediaciones verificadas viven en `REDESA-TRAZABILIDAD.md`.
- El informe estático actual registra 0 endpoints mutantes sin política explícita y 0 entidades
  huérfanas; queda 1 acceso directo entre repositorios de dominios distintos, justificado
  (`billing/repositories/practices-lookup.repository.ts` lee `practice.practices` de solo lectura
  porque `invoices` no tiene `tenant_id` propio — ver `dunning.service.ts`).
- **Guardrail nuevo (2026-07-30): `TENANT_SCOPE_MISSING`** en `tools/redesa/guardrails.mjs`. Detecta
  estáticamente un `em.find`/`em.count` sobre una entidad con `tenant_id` que no acota ni por
  `tenantId` ni por un id de principal/recurso puntual — el patrón exacto del bug real de
  `promotions-loyalty.repository.ts:findActivePrograms` (sesión 2026-07-29). Trae una allowlist
  explícita para barridos `SYSTEM` legítimamente cross-tenant (worker discovery) y para módulos
  enteramente globales (`identity_assurance`, `delegated_access`, `pharmacy_inventory`,
  `time_series`). Al escribirlo, encontró y se corrigieron 3 fugas reales más: suscripciones de
  webhook en `messaging` (un tenant podía recibir eventos de otro), catálogo de hitos de `tracking`
  (podía asignarse el hito terminal de otro tenant a un envío) y el presupuesto de asignaciones de
  `forms` (el consumo de un tenant bloqueaba el alta de otro).
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
- **`OutboxService.publishDomainEvent` estaba roto contra una base real (2026-07-30), 100% de las
  veces.** Es la API que "desbloquea a los demás módulos" (70+ call-sites en automation,
  cross_store_consistency, graph_intelligence, lakehouse, time_series, vector_rag, workflow, authz,
  procedures_perioperative) y nunca tuvo una prueba de integración contra Postgres real —los tests
  unitarios mockean el repositorio, así que nunca lo habrían visto. Tres bugs compuestos, todos
  corregidos con evidencia de integración nueva (`test/integration/outbox-relay-race.int-spec.ts`):
  (1) `createOutboxMessage` nunca seteaba `createdAt`/`updatedAt` (columnas `NOT NULL`, sin
  default) — faltaba el `...createdBy(...)` que sí llevan el resto de repositorios; (2)
  `domain_event_id` es un uuid plano (no una relación de MikroORM), así que el ORM no sabía que el
  outbox message depende del evento y podía insertarlos en el orden equivocado en el mismo flush,
  violando la FK — se corrigió con un `await tx.flush()` explícito entre ambos creates (mismo
  patrón que ya usa `accounting/services/ledger.service.ts`); (3) `correlationId` es `NOT NULL` en
  el esquema pero opcional en la firma, y ~85% de los call-sites reales nunca lo pasaban — ahora se
  deriva con `randomUUID()` si el llamador no trae uno de un flujo mayor que propagar.
- **Módulos 55/56/57 (Document Store, Redis Runtime, Search Platform) estaban completamente
  inalcanzables por HTTP (2026-07-30).** Sus tres módulos se importaban en `app.module.ts` con un
  comentario que los describía, pero nunca se agregaron al array `imports: []` — un error de
  copiar/pegar que dejó tres dominios enteros (controllers, servicios, DTOs, README) como código
  muerto pese a que sus stores reales (`mantra-redesa-mongodb-1`, `redis-1`, `opensearch-1`) sí
  corrían en `docker-compose.yml`. Corregido; cubierto ahora con integración real
  (`document-store.int-spec.ts`, `redis-runtime.int-spec.ts`, `search-platform.int-spec.ts`).
- Los adapters de proveedor externo (envío real de notificaciones, borrado real en el store
  destino de cross-store, cálculo real de embeddings) son stubs que **fallan de forma visible**
  (`PROVIDER_NOT_CONFIGURED`) en vez de fingir éxito: ningún proveedor concreto vive en este repo
  todavía. Conectar uno real es sustituir el adapter (`job.providerAdapter = ...`), no tocar el
  job — verificado de punta a punta (2026-07-30) contra `mock-provider-server` real, no sólo por
  lectura de código: `test/integration/worker-provider-adapter-swap.int-spec.ts` demuestra que (1)
  sin el proveedor configurado el job falla visible con `PROVIDER_NOT_CONFIGURED`, y (2) con
  `MOCK_PROVIDER_BASE_URL` fijado, el `OnModuleInit` de wiring reemplaza `job.providerAdapter` y la
  siguiente llamada es una petición HTTP real (no un stub), sin tocar el job. El mismo patrón
  (tipo `XxxProviderAdapter` + default fail-closed + propiedad mutable + `*WiringService`) ya
  existe en los 3 puntos de extensión reales (`messaging`, `cross_store_consistency`,
  `vector_rag`): conectar Twilio/SendGrid/OpenAI/etc. es escribir un adapter que cumpla el tipo y
  un `OnModuleInit` que lo registre según una variable de entorno — nada más.
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
- Guardrail estático de aislamiento por tenant (`TENANT_SCOPE_MISSING`) + 3 fugas reales cerradas
  (messaging, tracking, forms) + reparación del barrido de puntos de loyalty (rotación por
  `updatedAt` para que un programa con más miembros que el lote sí llegue a barrerlos todos).
- `OutboxService.publishDomainEvent` reparado (createdAt, orden de FK, correlationId) y los
  módulos 55/56/57 reconectados a `AppModule` — ver detalle arriba.

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

Hechos contra DB real: RLS con dos tenants y roles distintos (`rls.int-spec.ts`, opt-in, 2026-07-29)
y los triggers WORM de `audit.audit_log`/`data_access_log` (`audit-worm.int-spec.ts`, siempre corre
— confirma que ni siquiera el rol propietario puede UPDATE/DELETE una fila real de auditoría).

**Cerrado 2026-07-30** (los tres ítems que este documento marcaba como pendientes el 29):

- `FOR UPDATE`/`SKIP LOCKED` con dos conexiones reales disputando el mismo lote —
  `outbox-relay-race.int-spec.ts` dispara dos `POST /internal/outbox/relay/run` concurrentes y
  confirma que cada mensaje sembrado lo reclama exactamente una de las dos pasadas (encontró, de
  paso, los 3 bugs de `publishDomainEvent` ya descritos arriba);
- MongoDB, Redis y OpenSearch — `document-store.int-spec.ts`, `redis-runtime.int-spec.ts`,
  `search-platform.int-spec.ts` (encontraron, de paso, que los tres módulos nunca estaban
  registrados en `AppModule` — ver arriba);
- el punto de extensión de proveedores — `worker-provider-adapter-swap.int-spec.ts` contra
  `mock-provider-server` real.

Sigue priorizando escenarios donde un mock no demuestra el comportamiento:

- restricciones `UNIQUE`/FK e historiales (`*_history` vía `HistoryMirrorSubscriber`);
- outbox: reintentos y recuperación tras fallo parcial (el relay/dispatch ya tiene cobertura real;
  falta el camino de reintento agotado → cola muerta con datos reales);
- el resto de los 70+ call-sites de `publishDomainEvent` (automation, cross_store_consistency,
  graph_intelligence, lakehouse, time_series, vector_rag, workflow, authz,
  procedures_perioperative) siguen sin una prueba de integración propia — sólo se verificó el
  mecanismo genérico, no cada evento de negocio específico que publican.

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
