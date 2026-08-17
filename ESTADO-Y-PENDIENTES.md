# Estado y pendientes

Fuente de continuidad operativa del repositorio. Fecha de corte: **2026-07-30**.

## Estado actual

- **✅ CERRADO (2026-08-17) · `profiles.practitioner_affiliations` ya existe en la
  base.** La tabla se promovió al modelo canónico por el camino de ADR-0021: la declara
  `Mantra Core Health Context/modules/diagram_05_profiles.puml`, la emite `gen_ddl.py 05`
  en `SQL/05_profiles/` y las bases vivas la reciben con
  `SQL/patches/2026-08-17_v410_profiles_practitioner_affiliations.sql`. Los destinos de
  sus 6 FKs quedaron resueltos en el vault (`SALUD/FK/FK profiles.practitioner_affiliations.*`)
  y sus 8 índices en `SALUD/Entidades/E profiles.idxset_practitioner_affiliations.md`, así que
  el generador ya no infiere ninguno. **Ningún cambio de código hizo falta**: regenerar el
  módulo 05 completo reproduce las 19 entidades byte a byte, incluida la que estaba escrita a
  mano. De paso se eliminó `tools/redesa/2026-08-15_c05_practitioner_affiliations.sql`, que
  declaraba la misma tabla **fuera de `SQL/`** y por eso hacía fallar el paso 0/4 de
  `rebuild_stack.py` (`check_ddl_sources.py`) **para todo el equipo** desde el 15/08.
  Evidencia de la reconstrucción en `CARRIL_REPORT-marcelo.md`.

  El texto original del bloqueador, que documenta por qué existía, se conserva abajo.

- **🔴 (histórico) BLOQUEADOR · `profiles.practitioner_affiliations` no existe en la
  base (2026-08-14).** El carril 5 (puntos 8, 9 y 11 del reclamo) trajo el
  **historial laboral del profesional**: dónde trabajó, con qué cargo y en qué
  período. El módulo `profiles` sabía dónde se **formó** alguien
  (`professional_credentials`), qué puede **ejercer** (`jurisdiction_authorizations`,
  `practitioner_specialties`) y en qué idiomas atiende, y **no tenía ninguna tabla
  de empleo o afiliación institucional**: `grep -rli "affiliation|employer|hospital|workplace"
  src/modules/profiles` daba cero. El código está completo y probado —entidad,
  repositorio, DTOs, servicio, `GET`/`POST /profiles/practitioners/me/affiliations`
  y sus pruebas—, pero por ADR-0021 el esquema se declara en los `.puml` del
  modelo canónico y lo materializa `gen_ddl.py`: **este repositorio no escribe
  DDL**, y el workspace con `SQL/` y `salud-db/` no está en el checkout. Hasta
  materializarla, **esos dos endpoints responden 500** y ningún otro camino se ve
  afectado. Los cinco pasos que faltan están enumerados en el vault:
  `SALUD/🧩 Patch v4.1.0 — Historial laboral, consultorios e internación.md`, con la
  tabla y sus dos índices en `SALUD/Entidades/E profiles.practitioner_affiliations.md`.
  Faltan también los tres conceptos —`AFFILIATION_ACTIVE`, `AFFILIATION_RETRACTED`,
  `AFFILIATION_TYPE_EMPLOYMENT`— ya declarados en `profiles.concepts.ts` con UUIDv5
  estable, así que el seed los toma solo cuando corra.

- **La agenda sabía cuándo se atiende y no dónde (2026-08-14).** `GET /scheduling/resources`
  devolvía el recurso sin ninguna referencia a un sitio, y `booking-new` del portal no
  mostraba ubicación en ningún punto: un turno sin dirección obliga a averiguarla por
  fuera del sistema. El dato existía —`practice.practitioner_role_assignments` guarda
  `practice_site_id` desde siempre— y nadie lo publicaba junto al profesional. Se
  resolvió **sin columna nueva**: `PractitionerSitesService` (en `practice`, exportado)
  deriva la sede de lo que el recurso ya declara —la asignación de rol vigente si apunta
  a un profesional, el espacio de atención si apunta a un box—, la acota al tenant y la
  resuelve **por lote** para que la agenda no encadene una petición por recurso.
  `scheduling` la consume vía `PracticeModule` (la dependencia va en un solo sentido: 
  `practice` no importa `scheduling`) y si esa resolución falla, la agenda **sigue
  listando horarios sin ubicación** en vez de caerse. Se agregó además
  `GET /practitioners/:profileId/sites`, con roles más abiertos que el listado
  administrativo de sedes a propósito: incluye `PATIENT`, porque si no, un paciente ve
  la hora de su turno y no la dirección.

- **Abrir una internación era un acto sin rastro visible (2026-08-14).**
  `POST /clinical/care-episodes` existía desde siempre, pero **ninguna lectura devolvía
  los episodios**: la ficha sólo veía el `episodeId` colgado de un encuentro, y un uuid
  sin fila detrás no dice ni cuándo empezó ni si sigue abierta. Se agregó
  `CareEpisodesRepository.findByPatient` y el bloque `careEpisodes` a
  `GET /clinical/patients/:patientProfileId/summary` —aditivo, con su nombre en
  `truncated` como el resto—. Es lo que hace que dar de alta una internación tenga
  consecuencias: aparece como contexto cada vez que se reabre el expediente.

- **El módulo Community (19) era de sólo escritura (2026-08-13).** 19 endpoints de
  escritura y **cero `@Get`** en toda la API: se podía publicar, comentar,
  reaccionar, seguir y bloquear, y no había forma de volver a leer nada — ni
  siquiera el feed, que `POST /internal/community/feed/rebuild` materializaba en
  `feed_items` para nadie, porque **el «worker interno» que su README declaraba
  no existía** (no había `src/worker-community.ts`, ni jobs, ni servicio en el
  compose). Se añadieron las **16 lecturas** (perfil con sellos y prestigio,
  muro, post, hilo de comentarios, reacciones, follows, marcadores, bloqueos,
  reviews, bandeja y mensajes, grupos y sus integrantes, encuesta, timeline y
  notificaciones), todas con el cursor keyset de `common/pagination`, y el
  **`worker-community`** con el job `feed-fanout`. Dos cosas que el módulo no
  tenía y el fan-out necesitaba: **`GET /internal/community/feed/pending`**
  —`rebuild` recibe la lista de seguidores ya resuelta, así que un worker
  periódico no tenía de dónde sacarla— y el rol `SYSTEM` en `rebuild`, que
  exigía sólo `SECURITY_ADMIN` y le habría devuelto **403** al worker en cada
  tick. Las reglas transversales (propiedad del perfil, bloqueo en ambos
  sentidos, visibilidad `PUBLIC`/`FOLLOWERS`/`PRIVATE`) viven en
  `CommunityVisibilityService`, no repetidas endpoint por endpoint. **Los
  conceptos `POST_VISIBILITY_*` no existían y `publishPost` nunca escribía la
  columna**: se declararon en `community.concepts.ts` y el nulo se lee como
  público, porque esconder ahora las publicaciones previas las borraría de muros
  donde ya estaban. Verificado ejecutando: **952 rutas mapeadas** (eran 827) y
  `test/integration/community-reads.int-spec.ts` **17/17 contra la base real**
  —incluye el ciclo descubrir → repartir → leer el timeline y la idempotencia
  del reparto—; es la única prueba que puede demostrar la visibilidad, porque
  con el `EntityManager` simulado quien decide si un post se ve es el mock.
  Detalle en `src/modules/community/README.md`.

- **Ningún usuario médico podía ejercer su rol (2026-08-12).** `RolesGuard`
  autoriza mirando sólo el claim `roles` del token, y ese claim se construía con
  `conceptIdsToRoleCodes`, que **descarta en silencio** todo código que no sea
  uno de los cuatro de `iam.user_global_roles` (`USER`, `PATIENT`,
  `SECURITY_ADMIN`, `SUPERADMIN`). Los otros ~116 códigos que usan los
  `@Roles(...)` del repositorio —incluidos los diez actores clínicos— eran
  inalcanzables: un médico que se registraba por el camino público recibía
  `roles: ["USER"]` y **403 en todo endpoint clínico**, y no existía API alguna
  para concederle `CLINICIAN`. En la práctica sólo `SUPERADMIN` atravesaba los
  guards, por comodín, y por eso el catálogo de flujos "verificados" se había
  generado con el token del administrador. Corregido reutilizando el modelo que
  ya existía y no se usaba (`authz.roles` + `authz.user_role_assignments`, con
  tenant, vigencia y `is_assignable`): `AuthzEffectiveRolesService` resuelve los
  códigos vigentes e `iam` los suma al claim al emitir y al refrescar el token.
  Se sembraron los diez roles asistenciales de sistema
  (`AuthzClinicalRolesSeedService`), se añadió `GET /authz/roles` —sin él,
  asignar un rol exigía conocer un uuid que ninguna operación devolvía—,
  `POST /authz/users/:id/role-assignments` acepta `roleCode` además de `roleId`,
  el alta administrativa de profesional acepta `clinicalRoles` y verificar la
  matrícula concede `PRACTITIONER`. **Nota de vigencia**:
  `findActiveForUser` filtraba sólo por estado, así que un rol con `valid_to`
  vencido seguía concediendo acceso —también en el PDP—; ahora respeta la
  ventana. Verificado con `yarn redesa:personas`, que recorre el flujo de cada
  actor con **su propio** token.

- **El circuito quirúrgico no funcionaba contra una base real (2026-08-12).**
  Cuatro fallos encadenados que ninguna prueba veía porque las unitarias simulan
  el `EntityManager`: (1) `POST /procedure-cases` violaba la FK **siempre** —los
  hijos del caso se creaban sin flush previo del padre, el mismo patrón que ya
  se había corregido en `OutboxService.publishDomainEvent`—, y con él la
  valoración preoperatoria con puntuaciones, el plan anestésico y el registro de
  implantes; (2) `confirmCase` exigía integrantes `TEAM_ACCEPTED` y **nada
  escribía ese estado**, así que ningún caso podía confirmarse jamás; (3) una
  credencial verificada no contaba como vigente porque `verifyCredential`
  escribe `PROF.CRED_VERIFIED` y `hasCurrentCredential` sólo miraba los estados
  transversales; (4) `createOrder` de órdenes preoperatorias existía en el
  repositorio **sin un solo llamador**, así que no había nada que verificar y el
  caso no alcanzaba `READY_FOR_SURGERY`. Detalle en
  `src/modules/procedures_perioperative/README.md`.

- **Errores de integridad mal catalogados (2026-08-12).** Una clave foránea
  inexistente respondía `422` con `code: VALIDATION_FAILED`, que el contrato
  publica como `400`: el cliente recibía el mismo código para "el cuerpo no
  cumple el DTO" y para "el identificador apunta a algo que no existe". Ahora
  `23503` → `422 PRECONDITION_FAILED` y `23502/23514/22P02` → `400
  VALIDATION_FAILED`, por las dos rutas (SQLSTATE crudo y excepción tipada de
  MikroORM), que además discrepaban entre sí. El `details` que llevaba
  `constraint`, `table`, `column` y el `detail` de PostgreSQL —que incluye el
  **valor** de la clave que falló— dejó de viajar al cliente y se registra en el
  log junto al `correlationId`.

- **Hardening de resiliencia (2026-08-06).** Se auditaron la API y los 20 workers
  buscando específicamente modos de fallo bajo estrés, y se corrigieron nueve
  hallazgos. Los tres de más impacto: (1) `AllExceptionsFilter.integrityViolation`
  estaba escrito pero `normalize()` **nunca lo llamaba** —código muerto—, así que
  todo error del driver salía como `500 INTERNAL`, incluidos el interbloqueo
  (transitorio: se cura reintentando) y la clave foránea inexistente (error del
  cliente); (2) los 30 jobs usan `@Interval`, que es `setInterval` y **no espera**
  a la ejecución anterior, de modo que con la API lenta se apilaban copias del
  mismo tick sobre las mismas filas; (3) ninguno de los 21 procesos registraba
  `uncaughtException`/`unhandledRejection` ni acotaba su apagado, así que una
  caída no dejaba rastro indexable y un `SIGTERM` atascado terminaba en `SIGKILL`
  mudo a los 10 s. Se añadió un kernel de resiliencia sin dependencias nuevas
  (`src/common/resilience/`: plazo con cancelación real vía `AbortSignal`,
  reintento con jitter completo, cortacircuitos, mamparo, exclusión mutua),
  garantías de ciclo de vida (`src/common/runtime/`), sonda HTTP por worker
  (`/health`, `/readiness`, `/status`) cableada al `healthcheck` de los 20
  servicios del compose, y drenaje de ticks en el apagado. 163 pruebas nuevas;
  suite completa en 4 251. **Cuidado con un detalle no obvio**: cinco jobs anidan
  `runTick` dentro de otro `runTick` con el mismo nombre de operación, así que la
  exclusión mutua distingue modo raíz y modo anidado — un mutex plano por nombre
  los habría silenciado por completo y en silencio. Auditoría completa, matriz de
  riesgos, catálogo de errores, FMEA, árbol de fallos, DR/BCP, plan de caos y
  runbooks en `docs/resilience/`. Lo que **no** está hecho y bloquea declarar
  "listo para producción": copias de seguridad y ensayo de restauración, campaña
  de caos end-to-end, métricas Prometheus (sin ellas no hay alerta sobre el tick
  que falla siempre), dimensionado del pool de Postgres y rate limiting
  compartido para multi-réplica. Ver `docs/resilience/06-checklists.md`.

- La API está organizada en 57 módulos NestJS y expone 852 endpoints detectados por el analizador
  REDESA (cifra anterior a las 17 rutas de lectura de Community del 2026-08-13; el
  arranque real mapea **952**).
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
- Hay 22 procesos worker separados (`src/worker-<dominio>.ts`, uno por dominio, arrancados vía
  `bootstrapWorker`), cada uno como cliente HTTP autenticado (`SystemApiClient`, rol `SYSTEM`) de
  la propia API — nunca importan servicios de dominio directamente. Cubren scheduling, pharmacy
  inventory, consent, delegated access, identity assurance, promotions, workflow, reporting,
  automation, qa lab, health context, cross-store consistency, messaging, integrations, billing,
  tracking, read models, **vector RAG** (drena la cola de embedding jobs), **lakehouse** (cierra
  releases de investigación vencidos), **audio assets** y **community** (fan-out del feed social,
  2026-08-13). `graph_intelligence` no tiene worker: sus endpoints de
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
- **Primer proveedor real conectado (2026-07-30, para desarrollo): Gmail API vía OAuth2** para el
  canal EMAIL de `messaging` (`GoogleEmailClient` +
  `GoogleProviderWiringService`, registrado después del mock para que gane si ambos están
  configurados). Cuenta Gmail normal, sin Workspace — sin delegación de dominio, así que necesita
  un `refresh_token` obtenido una vez con consentimiento interactivo
  (`yarn google:oauth:get-refresh-token`, ver `tools/google-oauth/get-refresh-token.mjs`). El
  proveedor de producción sigue siendo una decisión pendiente del negocio (SendGrid mencionado
  como candidato); Google es explícitamente el adapter de **desarrollo**, no el definitivo.
  Cubierto con integración real opt-in (`google-email-provider.int-spec.ts`, corre sólo si las 4
  variables `GOOGLE_OAUTH_*`/`GOOGLE_SENDER_EMAIL` están configuradas).
- **La expansión de conjuntos de valores nunca devolvió un solo miembro (2026-08-01).** Las dos
  mitades del módulo `terminology` estaban en desacuerdo desde siempre: `importConcepts` creaba los
  conceptos **sin estado** (`state_concept_id` nulo) y la expansión sólo selecciona los que están
  en `TERM_ACTIVE`. El resultado es que todo el camino documentado —crear sistema, crear versión,
  importar, publicar, expandir— terminaba en `includedMembers: 0` **sin ningún error**: la versión
  figuraba publicada y no seleccionaba nada. No lo vio ninguna prueba porque las unitarias mockean
  el repositorio y devuelven los conceptos que se les pide devolver. Corregido en los dos extremos:
  los conceptos nacen en `TERM_DRAFT` y publicar la versión los promueve a `TERM_ACTIVE`, saltando
  los que UC-03-10 retiró. Verificado contra la API viva: 25 conceptos importados → publicados →
  `includedMembers: 25`.
- **Lectura de la expansión (`GET /terminology/value-sets/:id/$expand`, 2026-08-01)**, paginada por
  cursor keyset sobre `(ordinal, concept_id)` y **sin exigir rol de administración** — es lo que el
  frontend necesitaba para poder rellenar un campo `*ConceptId`. El `POST` homónimo sigue siendo de
  `SECURITY_ADMIN` porque materializa. Ver `src/modules/terminology/README.md`.
- **Primer `SECURITY_ADMIN` sembrado al arrancar (2026-08-01)**: `BootstrapAdminSeedService`
  (`src/common/seed/`), opt-in por `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD`, idempotente,
  y **se niega en `NODE_ENV=production`** salvo `BOOTSTRAP_ADMIN_ALLOW_PRODUCTION=true`. Reutiliza
  `IamUsersService.createUser`, así que la credencial se hashea con argon2id igual que por API en
  vez de duplicar los parámetros del hash. `yarn postman:bootstrap` pasó a ser un disparador manual
  del mismo servicio: dos caminos, una sola implementación.
- **Recuperación de contraseña (UC-01-13, 2026-08-01)**: `POST /iam/auth/forgot-password` y
  `POST /iam/auth/reset-password`, ambos públicos. No enumera cuentas (202 y el mismo cuerpo exista
  o no), sólo persiste el SHA-256 del token, y restablecer revoca todas las sesiones y refresh
  tokens del usuario. Tabla nueva `iam.password_resets` por migración aditiva
  (`database/SQL/99_migrations/2026-08-01_password_reset.sql`), separada de `email_verifications`
  a propósito: comparten forma pero no consecuencia, y con una sola tabla un token emitido para
  probar un correo serviría para reescribir una credencial.
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

### P1 · Cerrado — lectura del flujo asistencial y actores restantes (2026-08-12)

Los diez actores clínicos completan su flujo de punta a punta con **su propio
rol**, verificado con `yarn redesa:personas`. Lo que faltaba y se añadió:

- **Lecturas del circuito quirúrgico.** `procedures_perioperative` no tenía ni
  un `@Get`: un caso creado sólo era accesible por el uuid que devolvía su
  propio POST. Ahora expone la agenda (`GET /procedure-cases`, acotada por
  paciente, quirófano, cirujano, estado y ventana), el detalle agregado
  (`GET /procedure-cases/:id` con equipo, diagnósticos, hitos, órdenes,
  valoración, plan anestésico e informes) y el equipo del caso.
- **Estructura física descubrible.** `practice` no exponía ninguna lectura y
  todas sus altas eran de `SECURITY_ADMIN`, así que el `operatingRoomId` que
  exige programar una intervención había que pasarlo por fuera del sistema. Se
  añadieron `GET /practices`, `GET /practices/:id/sites` y
  `GET /sites/:id/care-spaces`, abiertos a los actores que programan y operan.
  El quirófano **no** se crea implícitamente a propósito: es infraestructura
  real y hacerlo duplicaría salas.
- **Lecturas de diagnóstico.** `GET /diagnostics/work-orders` (cola del
  laboratorio) y `GET /diagnostics/patients/:id/imaging-studies`.
- **El flujo del informático clínico no tenía principio.** No existía forma de
  crear una conexión de origen (`health_source_connections` y
  `health_source_systems` sólo podían insertarse a mano), así que no se podía
  abrir un lote, ni proyectar un recurso canónico, ni llegar a las relaciones y
  amarres que son su trabajo. Se añadió `POST /health-data/source-connections`,
  que crea el sistema de origen en la misma llamada, y se le concedió el rol en
  `POST /health-data/versions/:id/validate`, que lo excluía pese a incluirlo en
  las otras dos operaciones del mismo recurso.
- **El flujo del investigador principal tampoco.** Definir una cohorte exige un
  perfil de de-identificación y no había ninguna operación que lo creara: se
  añadió `POST /research/deidentification-profiles`.

### P1 · Cerrado — escrituras que fallaban siempre contra una base real (2026-08-12)

Barrido sistemático de la familia de fallos que las pruebas unitarias no pueden
ver, porque el `EntityManager` simulado acepta cualquier objeto:

- **43 `em.create(...)` sin `createdAt`/`updatedAt`** sobre columnas NOT NULL sin
  default. Es lo que ya había roto `createOutboxMessage`; entre ellas, abrir un
  lote de ingesta (500 garantizado).
- **20 columnas NOT NULL que el repositorio declaraba opcionales** y ningún
  llamador aportaba (`payloadFormatConceptId`, `roleConceptId` de procedencia,
  `exclusionExpression` de cohorte, `protocolReference` de proyecto…). Se
  derivó un valor honesto en cada caso, documentado junto a la línea.
- **17 columnas NOT NULL que describen algo que aún no ha ocurrido**
  (`released_at`, `verified_at`, `current_version_id`, campos DICOM
  opcionales…). Se relajaron por migración aditiva
  (`database/SQL/99_migrations/2026-08-12_*.sql`): rellenarlas con la fecha del
  alta habría afirmado que el bloqueo ya está liberado y la copia verificada.
- **5 hijos insertados antes que su padre** en `health_data` (procedencia,
  versión canónica) y `procedures_perioperative`, el mismo patrón de FK plana.

Los detectores están en el historial de la sesión y son reproducibles; el
resultado actual es 0 en las tres familias.

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

### P1 · Cerrado — lo que el frontend esperaba

Las tres cosas que `PENDIENTES-BACKEND.md` (repo del frontend) marcaba como bloqueo están
entregadas y verificadas contra la API viva, no sólo compilando:

| Pedía | Estado |
| --- | --- |
| Catálogo de formas reales de error | Entregado (`cac7251b`, doce capturas literales) |
| `GET /terminology/value-sets/:id/$expand` paginado por cursor | Entregado y verificado |
| `BootstrapAdminSeedService` con `OnApplicationBootstrap` y guardia de producción | Entregado |
| Recuperación de contraseña (estaba fuera de la cola, decisión abierta) | **Implementada** |

De las tres opciones que el documento del frontend planteaba para la recuperación de contraseña
—implementarla, sacar el enlace de la maqueta, o dejarlo apuntando a un aviso— se tomó la primera,
que es la única que no reduce lo que el diseño ya prometía. **Sigue siendo una decisión revisable
por producto**, y la anotación queda acá para que lo sea a la vista y no por omisión.

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
| `docs/frontend/CATALOGO-FLUJOS-VERIFICADOS.md` | Cuerpos reales para el frontend | Generado con `exercise-front-flows.mjs` (token de administrador) |
| Cobertura por actor clínico (en `REDESA-TRAZABILIDAD.md`) | Qué puede hacer cada rol médico | Verificado con `yarn redesa:personas` (token de cada actor) |
| `src/modules/*/README.md` | Contrato por dominio | Manual, junto al módulo |

No crear documentos de sesión en la raíz. Si una investigación no se convierte en una decisión
vigente, debe permanecer fuera del repositorio; si se convierte, se integra en una de las fuentes
anteriores.
