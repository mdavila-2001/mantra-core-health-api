# Plan — Sesiones, bitácora de rutas, puntos clave y mapas de calor

- Fecha: 2026-10-21 · Autor: Pablo + Claude · Repos: API (`mantra-core-health-api`), front (`mantra-core-health`), móvil (`mantra_core_health_mobile`), modelo (`SQL/` + `mantra-core-health-model`)
- Predecesor: captura de interacciones del 21/10 (front #1134/#1135/#1136, API #658/#659). Ver
  `mantra-core-health/docs/trabajo/2026-10-21-mapa-de-calor-ux/REPORTE.md`.
- **Resultado observable:** una persona con rol de analítica abre «Mapas de calor», elige una ruta
  (`/schedule`), un tamaño de pantalla (móvil · tableta · escritorio) y un rango de fechas, y ve sobre
  la pantalla real dónde se hizo clic, hasta dónde se bajó, qué puntos clave se usaron y por dónde se
  entró y se salió. Todo sale de datos reales, de personas que consintieron, y sin que ninguna celda
  permita reconocer a alguien.
- **Kill-test:** con 3 cuentas de prueba que consintieron y 1 que no, un recorrido Playwright de
  10 pantallas deja filas en `telemetry.user_activity_events`, `telemetry.route_visits` y
  `time_series.ux_interaction_points` **solo** de las 3, el visor pinta sus clics en la celda correcta
  (±1 celda) y la cuenta que no consintió no aparece en ninguna tabla.

---

## 0. Punto de partida

### Lo que ya existe (no se reinventa)

| Pieza | Dónde | Estado |
|---|---|---|
| Ingesta por lotes con gate de consentimiento e idempotencia | `src/modules/telemetry/services/telemetry-events.service.ts` (`POST /telemetry/activity-events`, UC-28-07) | En `dev`/`test` |
| Sesión de navegación («journey») | `telemetry.session_journeys` + `resolveJourney` | Existe, mal enlazada (B1) |
| Contexto de cliente (dispositivo, viewport, locale; todo con hash) | `telemetry.client_contexts` (UC-28-08) | Existe, el front no lo usa |
| Embudos | `telemetry.funnel_definitions` / `funnel_steps` (`POST /telemetry/funnels`) | Existe, sin uso |
| Consentimiento por propósito, divulgaciones versionadas | `telemetry.tracking_consents`, `tracking_disclosure_versions/acceptances`, `GET /telemetry/tracking-consents/me` | En `dev`/`test` |
| Propósito y esquema `ux_interaccion` sembrados | `src/common/seed/telemetry-ux-heatmap-seed.service.ts` | En `dev`/`test` |
| Sujeto seudónimo con rotación de clave | `telemetry.analytics_subjects` | Existe, el front no lo usa |
| Sesión de login | `iam.sessions` (`user_id`, `device_id`, `token_id`, `geo_location`, `state_concept_id`, `expires_at`) · `GET /iam/me/sessions` · `POST /iam/me/sessions/:id/revoke` | Existe |
| Series temporales con TimescaleDB, retención, compresión y rollups | `src/modules/time_series`, `src/worker/jobs/time_series/*` (`apply-retention`, `compress-chunks`, `refresh-rollups`) | Existe; `timescaledb` instalado en local |
| Captura en el portal: `pagina_vista`, `clic` (con clic repetido), `campo_enfocado`, `pagina_abandonada`; coordenadas normalizadas; descriptor de elemento por lista blanca; lotes con `keepalive` | `mantra-core-health/src/app/core/observability/ux/*` | En `dev`/`test`/`mockup`, **apagada** por defecto |
| Plantilla de ruta (`/pacientes/:id`, nunca la URL) | `src/app/core/observability/routing/route-template.ts` | Existe |
| Catálogo y reglas de datos prohibidos | `mantra-core-health/docs/observability/analytics-events.md` | Existe, manda |
| Pantallas de administración de analítica | `src/app/features/admin/web-analytics`, `admin/observability` | Existen (GA4 y observabilidad) |
| Privacidad de la cuenta | `src/app/features/account/privacy` | Existe, sin el consentimiento de analítica |
| Estados de vista unificados | `shared/components/organisms/view-state-host` | Existe (sitio único para `estado_ux_mostrado`) |
| Móvil | `go_router` 17.5 | **Sin captura de ningún tipo** |

### Bloqueantes encontrados al revisar el código (se arreglan antes que nada)

| # | Problema | Evidencia | Consecuencia |
|---|---|---|---|
| **B1** | `user_activity_events.session_id` y `session_journeys.session_id` tienen **FK real a `iam.sessions(id)`**, pero el front manda como `sessionId` un uuid de **pestaña**. | `database/SQL/28_telemetry/90_fk_deferred.sql` (`fk_user_activity_events_session_id`, `fk_session_journeys_session_id`); en la base local las dos FK existen. | Contra la API real, **todo lote con eventos falla por FK** (500). Por eso el trabajo del 21/10 solo se probó con un doble. |
| **B2** | `userId` (y `tenantId`) llegan **en el cuerpo** y la API los usa para el gate de consentimiento. | `activity-event.dto.ts:128` (`userId?: string`), `captureActivityEvents` usa `item.userId`. | Cualquier usuario autenticado puede escribir eventos a nombre de otro, o mandarlos sin `userId` para saltarse el gate. |
| **B3** | No hay restricción única sobre la clave de idempotencia; la ingesta hace un `SELECT` por evento sobre una columna **sin índice**. | `05_constraints.sql`: `-- TODO UK (event schema + event idempotency key)`; `04_indexes.sql` no indexa `event_idempotency_key`. | Recorrido completo de la tabla por cada evento, y una carrera entre dos reenvíos duplica filas. |
| **B4** | Las propiedades van en una tabla EAV: **un clic ≈ 1 fila de evento + ~12 de propiedades**, con `flush` por evento. | `user_activity_event_properties`; la consulta del mapa en `analytics-events.md` pivota la EAV. | No escala a mapas de calor: la consulta de 7 días pivota millones de filas. |
| **B5** | No hay pantalla de consentimiento; el front manda igual y la API descarta. | REPORTE del 21/10, hallazgo 10. | Hoy no se guarda nada, y se manda lo que no se debería mandar (minimización). |
| **B6** | Las dos FK de sesión hacia `iam.sessions` dependen de que el **`sid` del JWT** se traduzca: el `sid` es `iam.sessions.token_id`, no `iam.sessions.id`. | `token.service.ts:90` (`sid: sessionTokenId`), `iam-auth.service.ts:470` (`tokenId: issued.sessionTokenId`). | La API tiene que resolver la sesión de login por `token_id`; el cliente no puede ni debe mandarla. |

---

## 1. Decisiones de modelado

### D1 · Tres niveles de «sesión», cada uno con su tabla

```
iam.sessions                 sesión de LOGIN: del ingreso al cierre/expiración/revocación
  1 ─── n
telemetry.session_journeys   VISITA: una pestaña del portal o un primer plano de la app
  1 ─── n                    (se abre con la primera vista y se cierra a los 30 min sin eventos)
telemetry.route_visits       VISTA DE RUTA: una entrada a una plantilla de ruta, con su duración
  1 ─── n
time_series.ux_interaction_points   PUNTO: un clic, un clic repetido o un punto clave, con posición
```

- Una visita puede empezar **sin** login (pantallas públicas) y enlazarse a la sesión de login al
  ingresar; una sesión de login puede tener varias visitas (pestañas, la app y la web a la vez).
- **Descartado:** reutilizar `iam.sessions` para las visitas. Mezcla seguridad con analítica, y una
  pestaña no es una credencial.
- **Descartado:** una sola tabla de eventos para todo. Es lo que ya está y no escala (B4).

### D2 · Dos propósitos, dos regímenes legales

| | Bitácora de **seguridad** | Analítica de **producto** (mapas de calor) |
|---|---|---|
| Qué | Ingresos, cierres, revocaciones, última actividad por sesión de login, dispositivo | Visitas, vistas de ruta, clics, puntos clave, profundidad de scroll |
| Base | Interés legítimo / obligación: no requiere consentimiento | **Consentimiento** (propósito `ux_heatmap`, `requiresConsent: true`) |
| Identidad | `user_id` real | **Seudónimo** (`analytics_subject_id`); nunca el `user_id` en las tablas de lectura |
| Dónde | `iam.sessions`, `iam.security_events` | `telemetry.*`, `time_series.ux_interaction_points` |
| Retención | La de seguridad que ya aplica `iam` | 90 días crudo, 13 meses agregados por ruta, 25 meses celdas anónimas |
| Quién lo ve | La persona (`/iam/me/sessions`) y `SECURITY_ADMIN` | Rol de analítica, **solo agregados con k-anonimato** |

> En salud, **la sección visitada es información de salud** (regla 7 de `analytics-events.md`). Por eso
> la bitácora de rutas de producto **nunca** se consulta por persona desde el visor: solo agregada.

### D3 · Crudo + proyecciones

- `telemetry.user_activity_events` (+ propiedades) sigue siendo el **registro crudo**, append-only y con
  el contrato actual. Es la fuente de verdad y lo que se borra en un DSAR.
- Un job del worker **proyecta** el crudo en tablas anchas pensadas para leer:
  `route_visits` (Postgres) y `ux_interaction_points` (hypertable). La ingesta no se vuelve más lenta.
- Otro job **materializa** agregados diarios con k-anonimato: `route_metrics_daily` y
  `ux_heatmap_cells_daily`. **El visor solo lee agregados.**
- **Descartado:** agregados continuos de Timescale para las celdas. No admiten `count(DISTINCT)`, que
  hace falta para el k-anonimato; un job diario es más simple y se prueba igual que `refresh-rollups`.

### D4 · Puntos clave declarados, no adivinados

- Un **punto clave** es un control con significado de negocio («Nueva cita», «Confirmar pago»,
  «Firmar receta»). Se declara en la plantilla con `data-ux-clave="agenda.nueva_cita"`.
- Catálogo versionado en `telemetry.ux_key_points` (código único, ruta, categoría, descripción,
  paso de embudo opcional). Un gate impide usar una clave que no está en el catálogo.
- El selector actual (`data-testid` o ruta de etiquetas) sigue sirviendo para el mapa «de todo»; la
  clave da un nombre estable que **no cambia al rediseñar la pantalla**.

### D5 · La rejilla del mapa

- **X:** fracción del ancho del documento (`x_doc`, 0–1), **50 columnas**.
- **Y:** píxeles del documento (`y_doc_px`), **filas de 20 px**, hasta el alto p90 del documento.
- **Segmentos:** `route_template` × `tamano_pantalla` (móvil < 600 · tableta < 1024 · escritorio) ×
  `portal` (web/móvil) × tipo (`CLICK`, `RAGE`, `KEY_POINT`). **No** se segmenta por rol en v1: con
  pocos usuarios por rol se rompe el k-anonimato.
- **k-anonimato:** una celda con menos de **5 sujetos distintos** en el período se suprime (se
  devuelve como `suppressed`, no con su conteo). Un segmento con menos de 5 sujetos no se dibuja.

### D6 · El visor: superposición en la pantalla real

- Página de administración `/admin/web-analytics/mapas-de-calor`: filtros (ruta, tamaño, rango, tipo)
  en `app-filter-bar` con el estado en la URL, ranking de rutas, flujos de entrada/salida y puntos clave.
- **Vista previa:** un `iframe` del **mismo origen** con la ruta elegida a 390 / 834 / 1440 px y
  `?ux-mapa=<token>`. Dentro, un componente `app-ux-heatmap-overlay` pinta las celdas en un `canvas`
  absoluto sobre el documento. La pantalla se ve con los datos **de quien mira**, no los de los sujetos;
  el mapa es de posiciones, no de contenido.
- **Descartado:** capturas de pantalla o grabación del DOM (tipo Hotjar). Guardar el DOM es guardar
  contenido clínico.

### D7 · Retención y DSAR

| Tabla | Retención | Cómo |
|---|---|---|
| `user_activity_events` (+ propiedades) | 90 días | Job por lotes de 5.000, `DELETE … WHERE created_at < now() - 90 d` (usa el BRIN existente) |
| `route_visits` | 13 meses | Mismo job |
| `ux_interaction_points` | 180 días | `apply-retention` ya existente (drop de chunks), compresión a los 7 días |
| `route_metrics_daily`, `ux_heatmap_cells_daily` | 25 meses | Son anónimos (k ≥ 5); no entran al DSAR |
| Retiro de consentimiento | Inmediato | La ingesta deja de aceptar; el front deja de mandar |
| DSAR de borrado | ≤ 30 días | Borra crudo, `route_visits` y puntos por `analytics_subject_id`; desactiva el sujeto |

### D8 · Quién ve los mapas

Propuesta v1: `PLATFORM_ADMIN` y `SECURITY_ADMIN`. Un rol propio (`UX_ANALYST`) se decide en
**DEC-3** (§10).

---

## 2. Modelo de datos

Todo DDL va en `database/SQL/patches/2026-10-2X_v42NN_<tema>.sql`: idempotente, con bloque `DO` que
verifica, y reflejado en el modelo (`.puml` → `gen_ddl.py` → `SQL/28_telemetry/*`, `SQL/01_iam/*`) y en
`database/SQL` con `yarn db:vendor`. La hypertable de §2.6 vive en el DDL NoSQL del módulo 58
(`database/NoSQL/58_time_series_timescaledb/time_series.timescaledb.sql` y su par en `../NoSQL`). Números libres hoy en `dev` y `test`:
desde **v4247**.

### 2.1 `iam.sessions` — completar la sesión de login (v4247)

| Columna nueva | Tipo | Para qué |
|---|---|---|
| `last_seen_at` | `timestamptz` | Última petición autenticada; se actualiza como mucho cada 5 min por sesión |
| `ended_at` | `timestamptz` | Cierre real (logout, revocación, expiración detectada) |
| `end_reason_concept_id` | `uuid` FK concepto | `LOGOUT` · `REVOKED_BY_USER` · `REVOKED_BY_ADMIN` · `EXPIRED` · `PASSWORD_RESET` · `REPLACED` |
| `client_kind_concept_id` | `uuid` FK concepto | `WEB` · `IOS` · `ANDROID` (de la cabecera `X-Client-Kind`, nunca del UA crudo) |
| `user_agent_hash` | `varchar(64)` | SHA-256 con sal del despliegue, como `client_contexts` |
| `ip_prefix_hash` | `varchar(64)` | /24 en IPv4 o /48 en IPv6, con sal |

Índices: `(user_id, created_at DESC)`, `(state_concept_id, last_seen_at)` para el cierre por inactividad.

### 2.2 `telemetry.session_journeys` — la visita (v4248)

| Cambio | Detalle |
|---|---|
| `client_session_key uuid NOT NULL` **nuevo** | El uuid de pestaña o de primer plano que hoy viaja como `sessionId` |
| `session_id` pasa a **NULL**able y significa **sesión de login** | La API lo resuelve con el `sid` del JWT → `iam.sessions.token_id` (B1, B6). Antes de ingresar queda `NULL` |
| `tenant_id uuid` | El tenant activo del JWT; `NULL` para pacientes sin organización |
| `entry_route_template`, `exit_route_template` | `varchar(300)` |
| `route_visit_count int`, `duration_ms bigint`, `last_event_at timestamptz` | Se mantienen al proyectar |
| `client_context_id uuid` FK | El contexto de cliente de la visita |
| `close_reason varchar(16)` | `idle` · `hidden` · `logout` · `replaced` |
| Índice único parcial | `(client_session_key) WHERE ended_at IS NULL`: una sola visita abierta por pestaña |
| Índices | `(analytics_subject_id, started_at DESC)`, `(last_event_at) WHERE ended_at IS NULL` |

### 2.3 `telemetry.user_activity_events` — el crudo (v4249)

| Cambio | Detalle |
|---|---|
| `session_journey_id uuid` FK **nuevo** | Hoy el evento no sabe a qué visita pertenece |
| `client_session_key uuid` **nuevo** | Para reenvíos que lleguen antes que la visita |
| `session_id` = sesión de **login** resuelta por la API (no la del cliente) | B1 |
| **`UNIQUE (event_schema_definition_id, event_idempotency_key)`** | Cierra el `TODO UK` de `05_constraints.sql` (B3) |
| `projected_at timestamptz` | Marca de proyección para el worker; índice parcial `WHERE projected_at IS NULL` |
| Índices | `(route_template, occurred_at DESC)`, `(event_name, occurred_at DESC)`, `(session_journey_id, occurred_at)` |

Antes del `UNIQUE`: el parche borra duplicados existentes conservando el más antiguo (en local hay 0 filas).

### 2.4 `telemetry.route_visits` — la bitácora de rutas (nueva, v4250)

| Columna | Tipo | Nota |
|---|---|---|
| `id` | `uuid` PK | |
| `session_journey_id` | `uuid` FK NOT NULL | |
| `analytics_subject_id` | `uuid` FK | Seudónimo; **sin `user_id`** |
| `tenant_id` | `uuid` | |
| `portal_type_concept_id` | `uuid` FK | WEB / MOBILE |
| `route_template` | `varchar(300)` NOT NULL | Siempre normalizada |
| `previous_route_template` | `varchar(300)` | Para los flujos |
| `sequence_no` | `int` | Orden dentro de la visita |
| `navigation_kind` | `varchar(16)` | `initial` · `push` · `popstate` · `reload` · `deeplink` |
| `viewport_bucket` | `varchar(16)` | móvil · tableta · escritorio |
| `entered_at`, `left_at` | `timestamptz` | `left_at` NULL si la visita se cortó sin `pagina_abandonada` |
| `duration_ms` | `int` | Visible: descuenta el tiempo con la pestaña oculta |
| `max_scroll_fraction` | `numeric(5,4)` | 0–1 |
| `doc_height_px` | `int` | Para normalizar Y |
| `click_count`, `rage_click_count`, `key_point_count` | `int` | |
| `exit_kind` | `varchar(16)` | `navigated` · `hidden` · `closed` · `timeout` |
| `entry_event_id`, `exit_event_id` | `uuid` FK | Al crudo |
| `created_at` | `timestamptz` | |

Índices: `(route_template, entered_at DESC)`, `(session_journey_id, sequence_no)`, BRIN `(entered_at)`.
Restricción: `UNIQUE (session_journey_id, sequence_no)`.

### 2.5 `telemetry.ux_key_points` — catálogo de puntos clave (nueva, v4251)

| Columna | Tipo | Nota |
|---|---|---|
| `id` | `uuid` PK | |
| `key_code` | `varchar(80)` UNIQUE | `dominio.accion`, `snake_case`: `agenda.nueva_cita` |
| `route_template` | `varchar(300)` | NULL = aparece en varias rutas (barra, menú) |
| `category` | `varchar(16)` | `cta` · `navegacion` · `formulario` · `alerta` · `pago` |
| `label_es` | `varchar(120)` | Lo que se lee en el visor |
| `funnel_step_id` | `uuid` FK `funnel_steps` | Opcional: el punto clave cuenta como paso de embudo |
| `status_concept_id`, `effective_from`, `effective_to` | | Versionado como los esquemas de evento |
| `created_at`, `created_by_user_id`, `updated_at`, `row_version` | | |

### 2.6 `time_series.ux_interaction_points` — los puntos (nueva hypertable, v4252)

Sigue la convención del módulo 58: PK compuesta `(time, tenant_id, series_id)`, estados en `varchar`.

| Columna | Tipo | Nota |
|---|---|---|
| `time` | `timestamptz` | Partición (chunks de 1 día) |
| `tenant_id` | `uuid` NOT NULL | Sin tenant → un uuid fijo de plataforma. **Hoy no existe** en `SEED`: se crea en H4.S1.M2 |
| `series_id` | `varchar` | `<portal>|<route_template>|<viewport_bucket>` |
| `point_id` | `uuid` | Desempata la PK (va en la PK) |
| `ingestion_id`, `source_version`, `quality_state` | | Las tres columnas comunes del módulo |
| `route_template`, `viewport_bucket`, `portal` | | Repetidas para filtrar sin parsear `series_id` |
| `kind` | `varchar(12)` | `click` · `rage` · `key_point` · `focus` |
| `x_doc_frac`, `x_vp_frac`, `y_vp_frac` | `real` | 0–1; NULL si fue con teclado |
| `y_doc_px`, `doc_height_px` | `int` | |
| `target` | `varchar(300)` | Descriptor por lista blanca (`data-testid` o ruta de etiquetas) |
| `key_code` | `varchar(80)` | Si el control tiene `data-ux-clave` |
| `subject_hash` | `varchar(16)` | HMAC truncado del `analytics_subject_id` con sal **rotada cada 30 días**: sirve para contar distintos y no permite volver a la persona |
| `is_keyboard` | `boolean` | |

Política: compresión a los 7 días, retención 180 días (`apply-retention`).

### 2.7 Agregados diarios (nuevos, v4253)

**`telemetry.ux_heatmap_cells_daily`**: `day`, `portal`, `route_template`, `viewport_bucket`, `kind`,
`cell_x` (0–49), `cell_y` (y/20), `hits`, `subjects`, `suppressed boolean`. PK
`(day, portal, route_template, viewport_bucket, kind, cell_x, cell_y)`.

**`telemetry.route_metrics_daily`**: `day`, `portal`, `route_template`, `viewport_bucket`, `visits`,
`subjects`, `entries`, `exits`, `duration_p50_ms`, `duration_p90_ms`, `scroll_p50`, `scroll_p90`,
`rage_clicks`, `key_points`, `doc_height_p90_px`. PK `(day, portal, route_template, viewport_bucket)`.

**`telemetry.route_transitions_daily`**: `day`, `portal`, `from_route`, `to_route`, `transitions`,
`subjects`. Alimenta el diagrama de flujos.

---

## 3. Contrato de la API

### 3.1 Cambios en la ingesta (`POST /telemetry/activity-events`)

| Campo | Hoy | Después |
|---|---|---|
| `userId` | Del cuerpo | **Del JWT** (`sub`). Si viene en el cuerpo y no coincide → **403** `TELEMETRY_SUBJECT_MISMATCH`. Se acepta un release y luego se rechaza |
| `tenantId` | Del cuerpo | Del tenant activo del JWT |
| `sessionId` | uuid de pestaña (falla por FK) | Renombrado **`clientSessionKey`**; `sessionId` se acepta como alias un release |
| Sesión de login | — | La resuelve la API: `sid` → `iam.sessions.token_id` → `session_id` |
| `analyticsSubjectId` | Opcional del cliente | Lo resuelve la API desde el consentimiento vigente (crea el sujeto si falta) |
| Lote | ≤ 500, `flush` por evento | ≤ 500, **un `INSERT` multi-fila** para eventos y otro para propiedades; idempotencia con `ON CONFLICT DO NOTHING` |

Respuesta igual (`inserted`, `skipped`, `eventIds`, `sessionJourneyId`) más `skippedReasons`
(`{ consent: n, duplicate: n }`) para depurar sin adivinar.

### 3.2 Endpoints nuevos

| Método y ruta | Rol | Auditoría | Qué devuelve |
|---|---|---|---|
| `GET /telemetry/heatmaps` `?route&viewport&portal&kind&from&to` | analítica | `@AccessLogged`? **no**: agregados anónimos → sin bitácora de PHI | `{ cells: [{x, y, hits, subjects}], suppressedCells, docHeightP90, totals }` |
| `GET /telemetry/routes/metrics` `?portal&viewport&from&to&sort&limit` | analítica | — | Ranking de rutas con visitas, sujetos, p50/p90 de duración y scroll, clics repetidos |
| `GET /telemetry/routes/transitions` `?route&direction=in\|out&from&to` | analítica | — | Rutas de entrada o salida con conteos (k ≥ 5) |
| `GET /telemetry/key-points` | analítica | — | Catálogo |
| `POST /telemetry/key-points` · `PATCH /telemetry/key-points/:id` | `SECURITY_ADMIN`, `PLATFORM_ADMIN` | `@Audited` | Alta y cambio del catálogo |
| `GET /telemetry/key-points/metrics` `?from&to&route` | analítica | — | Usos por punto clave, sujetos y tasa de clic repetido |
| `GET /telemetry/sessions/summary` `?from&to&portal` | analítica | — | Visitas por día, duración p50/p90, rutas por visita, rebote |
| `POST /internal/telemetry/projections/run` | `SYSTEM` | `@NotAudited` (plomería del worker) | `{ projected, routeVisits, points }` |
| `POST /internal/telemetry/rollups/run` `{ day }` | `SYSTEM` | `@NotAudited` | `{ cells, routes, transitions }` |
| `POST /internal/telemetry/journeys/close-idle` | `SYSTEM` | `@NotAudited` | `{ closed }` |
| `POST /internal/telemetry/retention/run` | `SYSTEM` | `@NotAudited` | `{ deletedEvents, deletedVisits }` |

Toda ruta que muta lleva `@Audited` o `@NotAudited` con motivo (`audit-trail-coverage.spec.ts`).
El visor **no** tiene ninguna lectura por persona.

### 3.3 Bitácora de seguridad (sesiones de login)

- `iam-auth.service` llena `client_kind_concept_id`, `user_agent_hash` e `ip_prefix_hash` al crear
  la sesión, y `ended_at` + `end_reason_concept_id` en logout, revocación y restablecimiento de clave.
- Un interceptor liviano actualiza `last_seen_at` como mucho una vez cada 5 min por sesión (caché en
  Redis con TTL de 5 min por `sid`, para no escribir en cada petición).
- `GET /iam/me/sessions` suma `lastSeenAt`, `clientKind` y `endedAt`. La pantalla de seguridad de la
  cuenta ya existe y solo cambia lo que muestra.

---

## 4. Front (Angular)

| Cambio | Archivos | Nota |
|---|---|---|
| `sessionId` → `clientSessionKey`; dejar de mandar `userId` y `tenantId` | `ux-analytics.service.ts`, `telemetry.types.ts` | Sigue al contrato 3.1 |
| **Gate de consentimiento en el cliente** | Nuevo `core/observability/ux/ux-consent.store.ts` | `GET /telemetry/tracking-consents/me`; la captura arranca solo con `GRANTED` y se apaga en el acto al retirar (resuelve B5 y la minimización) |
| Consentimiento en **Mi cuenta → Privacidad** | `features/account/privacy` | Interruptor «Ayudar a mejorar ALOVIDA con mapas de calor anónimos», con la divulgación versionada y su aceptación (`POST /telemetry/disclosure-acceptances` + `tracking-consents`) |
| Aviso de primera vez (**DEC-1**) | Componente del shell | Texto y momento los decide producto/legal |
| Directiva `uxClave` | Nueva `shared/directives/ux-clave.directive.ts` | `[uxClave]="'agenda.nueva_cita'"` → `data-ux-clave`; `ux-element.ts` la lee **antes** que `data-testid` |
| Evento `punto_clave` | `ux-events.ts` | Además del `clic`: `clave`, `categoria`, sin posición si fue con teclado |
| `pagina_vista` con `secuencia`, `tipo_navegacion`, `es_recarga` | `ux-events.ts`, `ux-analytics.service.ts` | `tipo_navegacion` desde `NavigationStart.navigationTrigger` |
| Tiempo **visible** en `pagina_abandonada` | `ux-analytics.service.ts` | Descuenta los tramos con `document.visibilityState === 'hidden'` |
| `estado_ux_mostrado` | `view-state-host` | Un solo disparador para los estados S3–S9 |
| Catálogo tipado de claves | Nuevo `core/observability/ux/ux-key-points.catalog.ts` | Fuente única; la siembra de la API se genera de acá |
| Gate `check-ux-key-points.mjs` | `scripts/` | Falla si una plantilla usa una clave que no está en el catálogo, o si el catálogo tiene una clave sin uso |
| Visor | `features/admin/web-analytics/heatmaps/*` (carga diferida) | Ver §4.2 |
| Superposición | `core/observability/ux/heatmap-overlay/*` (carga diferida, solo con `?ux-mapa=` y rol) | `canvas` absoluto, `pointer-events: none`, se redibuja al cambiar el alto del documento |

### 4.1 Puntos clave de la primera tanda (≈ 25)

| Clave | Ruta | Categoría |
|---|---|---|
| `auth.ingresar` | `/auth` | formulario |
| `auth.ir_a_registro` | `/auth` | navegacion |
| `registro.enviar` | `/auth/register` | formulario |
| `registro.elegir_tipo` | `/auth/register` | cta |
| `inicio.acceso_rapido` | `/dashboard` | navegacion |
| `sintomas.explicar` | `/symptom-check` | cta |
| `sintomas.ver_especialistas` | `/symptom-check` | cta |
| `directorio.buscar` | `/directory` | formulario |
| `ficha_publica.pedir_cita` | `/p/:slug` | cta |
| `agenda.nueva_cita` | `/schedule` | cta |
| `agenda.confirmar_cita` | `/schedule` | cta |
| `citas.reprogramar` | `/my-account/appointments` | cta |
| `citas.escribir_medico` | `/my-account/appointments` | cta |
| `consulta.iniciar` | `/medical-records/:id` | cta |
| `consulta.firmar_receta` | `/medical-records/:id` | cta |
| `consulta.pedir_estudio` | `/medical-records/:id` | cta |
| `consulta.cobrar` | `/medical-records/:id` | pago |
| `resultados.descargar` | `/my-account/diagnostic-results` | cta |
| `farmacia.agregar_al_pedido` | `/pharmacy/:id` | cta |
| `farmacia.enviar_pedido` | `/pharmacy/:id` | pago |
| `farmacia_admin.aceptar_pedido` | `/administration/pharmacy-orders` | cta |
| `pagos.pagar` | (varias) | pago |
| `menu.abrir` | (varias) | navegacion |
| `organizacion.cambiar` | (varias) | navegacion |
| `alerta.reintentar` | (varias) | alerta |

Las rutas exactas se confirman contra `app.routes.ts` en H3.S2.M1; esta tabla es la propuesta.

### 4.2 Pantallas del visor

Reglas de `alovida-ui`: pestañas centradas a ancho completo, cero cards laterales, filtros en
`app-filter-bar` con el estado en la URL, estados de vista con `view-state-host`.

| Pestaña | Contenido |
|---|---|
| **Rutas** | Ranking: visitas, sujetos, duración p50/p90, scroll p50, clics repetidos, % de salida. Clic en una fila → pestaña Mapa con esa ruta |
| **Mapa** | `iframe` a 390/834/1440 con la superposición; selector de tipo (clics · repetidos · puntos clave); barra de scroll a la derecha (qué % llegó a cada altura); leyenda con los tokens `--heat-1..4-bg/fg` que ya existen |
| **Flujos** | Rutas de entrada → ruta elegida → rutas de salida, con conteos |
| **Puntos clave** | Usos, sujetos, tasa de clic repetido y conversión del embudo si el punto es un paso |
| **Sesiones** | Visitas por día, duración, rutas por visita, rebote, reparto web/móvil |

Ningún número con menos de 5 sujetos: se muestra «menos de 5» y la celda no se pinta.

---

## 5. Móvil (Flutter)

| Pieza | Dónde | Nota |
|---|---|---|
| `UxAnalytics` (buffer, lotes, reintentos, envío al pasar a segundo plano) | `lib/core/analytics/ux_analytics.dart` | Mismo contrato que la web; `portalTypeConceptId` = `TELE.PORTAL_MOBILE` |
| Vistas de pantalla | Un `NavigatorObserver` registrado en `lib/core/router/app_router.dart` | Plantilla = `GoRoute.path` (`/appointments/:id`), nunca la ubicación |
| Toques | `Listener` en la raíz (`MaterialApp.builder`) | Solo `x_vp`/`y_vp` como fracción de la pantalla: el scroll de cada lista no se conoce, así que el mapa móvil es **de pantalla visible** y de puntos clave |
| Puntos clave | Widget `UxClave(clave: 'agenda.nueva_cita', child: …)` | Mismo catálogo que la web |
| Consentimiento | Pantalla de privacidad del perfil + `GET /telemetry/tracking-consents/me` | Sin `GRANTED` no se captura |
| Cabecera `X-Client-Kind: IOS\|ANDROID` | Cliente HTTP (`dio`) | Alimenta `iam.sessions.client_kind_concept_id` |
| Persistencia del buffer | Archivo local con tope de 500 eventos | Sin conexión se acumula y sale al volver |

---

## 6. Worker

| Job | Cada | Qué hace |
|---|---|---|
| `ux-projection` (nuevo, `worker-telemetry` o dentro de `time_series`) | 30 s | `POST /internal/telemetry/projections/run`: toma hasta 2.000 eventos con `projected_at IS NULL`, arma `route_visits` (empareja `pagina_vista` ↔ `pagina_abandonada` por visita y secuencia), inserta puntos, actualiza contadores de la visita y marca `projected_at` |
| `ux-journeys-close-idle` | 5 min | Cierra visitas sin eventos hace 30 min (`close_reason = 'idle'`, `ended_at = last_event_at`) y deja `exit_kind = 'timeout'` en la última vista abierta |
| `ux-rollups` | 1 vez al día (03:00 America/La_Paz) + al pedido | Materializa los tres agregados del día anterior con k-anonimato; idempotente (`DELETE` del día + `INSERT`) |
| `ux-retention` | 1 vez al día | Borra el crudo de más de 90 días y `route_visits` de más de 13 meses, por lotes |
| `apply-retention` / `compress-chunks` (existentes) | — | Se les agrega la política de `ux_interaction_points` |

Todos usan `runTick` y `SystemApiClient`, como `FeedFanoutJob` y `RankingScoreJob`.

---

## 7. Privacidad y seguridad

1. **Nada identificable en los puntos ni en los agregados.** `subject_hash` con sal rotada cada 30 días
   (los distintos se cuentan dentro del período, no a lo largo de meses).
2. **k ≥ 5** en toda lectura del visor, en la API y no en el front: el front nunca recibe un conteo menor.
3. **Lista blanca de propiedades por evento** en `activity_event_schema_definitions.property_schema_json`
   y patrones prohibidos en `prohibited_property_patterns_json`. Se llenan para `ux_interaccion`: hoy
   están vacíos y la API acepta cualquier propiedad.
4. **`data-ux-ignore`** (ya existe) en las zonas clínicas sensibles: notas, diagnósticos, recetas,
   resultados. Ahí no se captura ni el clic. Lista en H5.S2.M3.
5. **Las rutas son plantillas.** `normalizarRuta` en el front y una validación en la API (rechaza un
   segmento con uuid o con más de 6 dígitos) → 400 `TELEMETRY_ROUTE_NOT_TEMPLATE`.
6. **El `userId` sale del token** (B2). La telemetría no puede escribir a nombre de otro.
7. **Reenvío externo (GA4)**: no se reenvían puntos ni vistas de ruta de salud; si se enciende
   `TELEMETRY_WEB_ANALYTICS_ENABLED`, solo salen `pagina_vista` de rutas públicas (`/auth`, `/p/:slug`,
   `/directory`). **DEC-4**.
8. **Muestreo**: `PUBLIC_UX_ANALYTICS_SAMPLE_RATIO` (existe) por visita, no por evento, para no
   cortar recorridos a la mitad.

---

## 8. Hitos, historias y microtareas

Formato: **CA** = criterio de aceptación (binario) · **DoD** = cómo se verifica · Estado inicial `TODO`.
Cada microtarea es un commit con rutas; cada hito cierra con PR a `dev` y su réplica a `test`.

### H0 — Destrabar la ingesta real (B1, B2, B3)

**CA:** dado el front de `dev` con la captura encendida y una cuenta con consentimiento, cuando navega
3 pantallas, entonces la API real guarda los eventos sin 500 y con `user_id` del token.
**DoD:** Playwright contra `yarn start` en un worktree (puerto propio) + `SELECT count(*)` en Postgres.

#### H0.S1 — Contrato y sesión

| ID | Microtarea | CA (binario) | DoD (verificación) | Estado |
|---|---|---|---|---|
| H0.S1.M1 | Prueba roja: un lote con `sessionId` de pestaña hoy da 500 por FK | El spec de integración falla con `fk_user_activity_events_session_id` | `jest test/integration/telemetry-ingest.int-spec.ts` → rojo documentado | TODO |
| H0.S1.M2 | `clientSessionKey` en el DTO, `sessionId` como alias deprecado | El DTO acepta los dos y mapea a `clientSessionKey` | Spec del DTO con `forbidNonWhitelisted` | TODO |
| H0.S1.M3 | Resolver la sesión de login con `sid` → `iam.sessions.token_id` | Evento autenticado → `session_id` = `iam.sessions.id` real; anónimo → `NULL` | Spec del servicio + integración en verde | TODO |
| H0.S1.M4 | `userId`/`tenantId` del JWT; 403 `TELEMETRY_SUBJECT_MISMATCH` si el cuerpo no coincide | Lote con `userId` ajeno → 403; sin `userId` en cuerpo → usa el del token | Spec del controlador + `*.error-reasons.ts` | TODO |
| H0.S1.M5 | Parche v4248/v4249: `client_session_key`, `session_journey_id`, `session_id` NULLable | El parche corre dos veces sin error y el `DO` verifica columnas | `docker exec … psql -f patch` ×2 en una base **temporal** | TODO |

#### H0.S2 — Idempotencia y rendimiento

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H0.S2.M1 | `UNIQUE (event_schema_definition_id, event_idempotency_key)` con limpieza previa de duplicados | Dos lotes iguales en paralelo dejan 1 fila por clave | Spec de integración con `Promise.all` | TODO |
| H0.S2.M2 | Inserción multi-fila + `ON CONFLICT DO NOTHING`; sin `flush` por evento | 500 eventos en < 300 ms en local | `scripts/bench/telemetry-ingest.mjs` (nuevo) → p95 | TODO |
| H0.S2.M3 | `skippedReasons` en la respuesta | La respuesta distingue consentimiento y duplicado | Spec | TODO |
| H0.S2.M4 | Lista blanca de propiedades de `ux_interaccion` en `property_schema_json` y validación en la ingesta | Una propiedad fuera de la lista → el evento se descarta con `skippedReasons.schema` | Spec | TODO |
| H0.S2.M5 | Validación de plantilla de ruta (400 `TELEMETRY_ROUTE_NOT_TEMPLATE`) | `/pacientes/3f2a…` → 400 | Spec | TODO |

#### H0.S3 — Front al contrato nuevo

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H0.S3.M1 | `clientSessionKey` y fuera `userId`/`tenantId` del cuerpo | Ningún cuerpo lleva `userId` | `ng test --include='src/app/core/observability/ux/**'` | TODO |
| H0.S3.M2 | Recorrido real contra la API de un worktree (puerto 3100) | 3 pantallas → filas en `user_activity_events` | `docs/trabajo/…/evidencia/verificar-api-real.mjs` + SQL | TODO |

### H1 — Modelo de sesiones (login y visita)

**CA:** cada ingreso deja una sesión de login con cliente, inicio, última actividad y motivo de cierre;
cada pestaña deja una visita enlazada a esa sesión, con entrada, salida y duración.
**DoD:** integración + `GET /iam/me/sessions` con los campos nuevos.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H1.S1.M1 | Parche v4247 (`iam.sessions`) + entidad + modelo `.puml` | Columnas e índices presentes; `db:vendor:check` limpio | `psql \d iam.sessions` + `yarn db:vendor:check` | TODO |
| H1.S1.M2 | Conceptos `SESSION_END_REASON` y `CLIENT_KIND` en terminología + seed | Los 6 motivos y 3 clientes existen | Spec de seed | TODO |
| H1.S1.M3 | Llenar `client_kind`, `user_agent_hash`, `ip_prefix_hash` al crear la sesión | Login web → `WEB`; con `X-Client-Kind: IOS` → `IOS` | Spec de `iam-auth.service` | TODO |
| H1.S1.M4 | `ended_at` + motivo en logout, revocación propia/admin, restablecimiento de clave y sesión reemplazada | Cada camino deja su motivo | 5 specs | TODO |
| H1.S1.M5 | Interceptor de `last_seen_at` con caché Redis de 5 min por `sid` | 100 peticiones en 1 min → 1 `UPDATE` | Spec con reloj falso + Redis simulado | TODO |
| H1.S1.M6 | `GET /iam/me/sessions` devuelve `lastSeenAt`, `clientKind`, `endedAt` | Contrato OpenAPI regenerado | `openapi/openapi.yaml` diff + spec | TODO |
| H1.S2.M1 | Visita: una abierta por `client_session_key` (índice único parcial) | Dos lotes simultáneos de la misma pestaña → 1 visita | Integración | TODO |
| H1.S2.M2 | Enlazar la visita a la sesión de login al ingresar (la visita anónima de `/auth` se completa) | Visita con `session_id` NULL → tras login, no NULL | Integración | TODO |
| H1.S2.M3 | Job `ux-journeys-close-idle` + endpoint interno | Visita sin eventos 31 min → cerrada con `idle` | Spec del job + del servicio | TODO |
| H1.S2.M4 | Cerrar visitas abiertas al hacer logout (`close_reason = 'logout'`) | Logout → visitas de esa sesión cerradas | Integración | TODO |
| H1.S3.M1 | Pantalla de seguridad de la cuenta muestra cliente y última actividad | Se ve «iPhone · activa hace 3 min» | Playwright 390 y 1440 + captura | TODO |

### H2 — Bitácora de rutas

**CA:** cada entrada a una ruta queda en `route_visits` con su anterior, duración visible, scroll máximo
y forma de salida.
**DoD:** recorrido de 10 pantallas → 10 filas con `sequence_no` 1–10 y sumas que cuadran.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H2.S1.M1 | Parche v4250 (`route_visits`) + entidad + repositorio | Tabla, índices y `UNIQUE (journey, sequence_no)` | `psql` + spec del repositorio | TODO |
| H2.S1.M2 | `projected_at` en el crudo + índice parcial | Eventos nuevos con `projected_at` NULL | Parche + spec | TODO |
| H2.S2.M1 | Servicio de proyección: empareja `pagina_vista` ↔ `pagina_abandonada` | Vista sin abandono → `left_at` NULL hasta el cierre por inactividad | 8 casos en spec (orden normal, desordenado, duplicado, sin abandono, recarga, atrás, bfcache, logout) | TODO |
| H2.S2.M2 | Endpoint interno `projections/run` + job `ux-projection` | 2.000 eventos por pasada; dos pasadas no duplican | Spec del job + integración | TODO |
| H2.S3.M1 | Front: `secuencia`, `tipo_navegacion`, `es_recarga` en `pagina_vista` | Atrás del navegador → `popstate` | Spec de `ux-events` | TODO |
| H2.S3.M2 | Front: tiempo visible en `pagina_abandonada` | 10 s visible + 20 s oculta → `ms_en_pagina` ≈ 10.000 | Spec con reloj falso | TODO |
| H2.S4.M1 | `route_metrics_daily` y `route_transitions_daily` en el job de rollups | Un día con 6 sujetos en `/schedule` → fila con `subjects = 6` | Spec + integración | TODO |
| H2.S4.M2 | `GET /telemetry/routes/metrics` y `/routes/transitions` con k ≥ 5 | Ruta con 4 sujetos → no aparece | Spec del servicio | TODO |

### H3 — Puntos clave

**CA:** los ≈ 25 puntos de §4.1 tienen `data-ux-clave`, están en el catálogo de la API y su uso se cuenta.
**DoD:** `check-ux-key-points.mjs` verde + `GET /telemetry/key-points/metrics` con datos del recorrido.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H3.S1.M1 | Parche v4251 (`ux_key_points`) + entidad + CRUD con `@Audited` | Alta, edición y baja lógica | Specs + `audit-trail-coverage` verde | TODO |
| H3.S1.M2 | Siembra del catálogo desde `ux-key-points.catalog.ts` (script que genera el JSON de seed) | Las 25 claves en la base | `yarn seed` + `SELECT count(*)` | TODO |
| H3.S2.M1 | Confirmar ruta y control de cada clave contra `app.routes.ts` y las plantillas | Tabla §4.1 corregida | Revisión en el PR | TODO |
| H3.S2.M2 | Directiva `uxClave` + lectura en `ux-element.ts` antes que `data-testid` | El descriptor de un control con clave es la clave | Spec de `ux-element` | TODO |
| H3.S2.M3 | Evento `punto_clave` | Clic en «Nueva cita» → `clic` + `punto_clave` con `clave = agenda.nueva_cita` | Spec del servicio | TODO |
| H3.S2.M4 | Poner las 25 claves en sus plantillas (**solo** esos controles, sin barrido) | 25 usos, 25 claves | `check-ux-key-points.mjs` | TODO |
| H3.S2.M5 | Gate `check-ux-key-points.mjs` en `scripts/` y en el gancho de gates | Una clave inventada en una plantilla → exit 1 | Ejecutar con una clave falsa | TODO |
| H3.S3.M1 | `GET /telemetry/key-points/metrics` | Usos y sujetos por clave, con k ≥ 5 | Spec | TODO |
| H3.S3.M2 | Puntos clave como pasos de embudo (`funnel_step_id`) y conversión en el visor | Embudo `pedir_cita` (ficha → agenda → confirmar) con % por paso | Spec + Playwright | TODO |

### H4 — Puntos de interacción y celdas del mapa

**CA:** cada clic con posición queda en la hypertable y el mapa diario tiene sus celdas con k-anonimato.
**DoD:** 1.000 clics sintéticos en una celda conocida → la celda correcta tiene 1.000 hits.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H4.S1.M1 | DDL NoSQL del módulo 58 + parche v4252: `ux_interaction_points` como hypertable (chunks de 1 día), compresión a 7 días | `timescaledb_information.hypertables` la lista | `psql` | TODO |
| H4.S1.M2 | Crear el tenant de plataforma (`SEED.platformTenantId`) para eventos sin tenant | Uuid fijo en `SEED` y en la base | Spec de seed | TODO |
| H4.S1.M3 | `subject_hash` con sal rotada cada 30 días (`TELEMETRY_UX_SUBJECT_SALT_*`) | Mismo sujeto, mismo período → mismo hash; otro período → otro | Spec | TODO |
| H4.S2.M1 | La proyección inserta puntos (`click`, `rage`, `key_point`, `focus`) | Clic con teclado → punto sin X/Y | Spec | TODO |
| H4.S3.M1 | Parche v4253: `ux_heatmap_cells_daily` | Tabla y PK | `psql` | TODO |
| H4.S3.M2 | Rollup de celdas (50 columnas × filas de 20 px) con `subjects` y `suppressed` | Celda con 4 sujetos → `suppressed = true`, `hits` no se expone | Spec + integración con datos sembrados | TODO |
| H4.S3.M3 | `GET /telemetry/heatmaps` | Devuelve celdas, suprimidas y alto p90 | Spec + OpenAPI | TODO |
| H4.S4.M1 | Política de retención de 180 días en `apply-retention` | Chunk de 181 días → se borra | Spec del job | TODO |

### H5 — Consentimiento y minimización

**CA:** sin `GRANTED` no sale ningún evento del navegador ni de la app; al retirar el consentimiento se
apaga en el acto.
**DoD:** Playwright con una cuenta sin consentimiento → 0 peticiones a `/telemetry/activity-events`.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H5.S1.M1 | **DEC-1** resuelta: texto, momento y versión de la divulgación | Texto aprobado por producto/legal | Acta en el PR | `DECISION_REQUIRED` |
| H5.S1.M2 | Divulgación v1 sembrada (`tracking_disclosure_versions`) | Existe con su hash | Seed | TODO |
| H5.S2.M1 | `ux-consent.store.ts`: la captura arranca y para según `tracking-consents/me` | Retirar → no sale el lote siguiente | Spec | TODO |
| H5.S2.M2 | Interruptor en Mi cuenta → Privacidad (aceptar divulgación + otorgar/retirar) | Cambia el estado y persiste tras recargar | Playwright 390/1440, claro/oscuro | TODO |
| H5.S2.M3 | `data-ux-ignore` en notas, diagnósticos, recetas, resultados e historia clínica | Clic en una nota → ningún evento | Spec + lista en el PR | TODO |
| H5.S3.M1 | Aviso de primera vez según DEC-1 | Se muestra una sola vez por versión de divulgación | Playwright | TODO |
| H5.S3.M2 | DSAR: borrado por `analytics_subject_id` en crudo, visitas y puntos | DSAR de una cuenta de prueba → 0 filas suyas | Integración | TODO |

### H6 — Visor

**CA:** con el resultado observable del encabezado.
**DoD:** Playwright del visor a 390 y 1440, claro y oscuro, con datos sembrados por la API real.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H6.S1.M1 | Cliente `TelemetryInsightsClient` (heatmaps, métricas, transiciones, puntos clave, sesiones) | Tipos iguales al OpenAPI | `yarn typecheck` + spec | TODO |
| H6.S1.M2 | Ruta `/admin/web-analytics/mapas-de-calor` con guard de rol y carga diferida | Sin rol → 403 de la vista | Spec del guard | TODO |
| H6.S2.M1 | Pestañas centradas + `app-filter-bar` (ruta, tamaño, rango, tipo) con estado en la URL | Recargar conserva los filtros | Playwright | TODO |
| H6.S2.M2 | Pestaña Rutas (tabla ordenable) | Ordena por visitas y por clics repetidos | Playwright | TODO |
| H6.S3.M1 | `app-ux-heatmap-overlay`: `canvas`, escala de 4 niveles con `--heat-*`, redibujo con `ResizeObserver` | Celda (10, 5) se pinta en x = 20 %, y = 100–120 px | Spec con canvas simulado | TODO |
| H6.S3.M2 | `iframe` del mismo origen a 390/834/1440 con `?ux-mapa=<token de un solo uso>` | La superposición aparece solo con token válido y rol | Playwright | TODO |
| H6.S3.M3 | Barra de scroll (qué % llegó a cada altura) | Coincide con `scroll_p50`/`p90` | Spec | TODO |
| H6.S4.M1 | Pestaña Flujos | Entradas y salidas de la ruta elegida | Playwright | TODO |
| H6.S4.M2 | Pestaña Puntos clave + embudo | % por paso | Playwright | TODO |
| H6.S4.M3 | Pestaña Sesiones | Visitas por día, duración, reparto web/móvil | Playwright | TODO |
| H6.S5.M1 | Gates de diseño, `check-architecture`, `check-bundle-budget` (el visor no entra al paquete inicial) | Todos en verde | `yarn gates:diseno` + scripts | TODO |

### H7 — Móvil

**CA:** la app manda vistas, toques y puntos clave con el mismo contrato, solo con consentimiento.
**DoD:** simulador iOS + `flutter test`, filas con `portal = MOBILE` en la base.

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H7.S1.M1 | `UxAnalytics` con buffer en archivo, lotes y envío al pasar a segundo plano | Sin red → se acumula; al volver → sale | `flutter test` | TODO |
| H7.S1.M2 | `NavigatorObserver` con la plantilla de `GoRoute` | `/appointments/123` → `/appointments/:id` | `flutter test` | TODO |
| H7.S1.M3 | `Listener` raíz con coordenadas como fracción de la pantalla | Toque en el centro → 0,5 / 0,5 | `flutter test` | TODO |
| H7.S2.M1 | `UxClave` en las claves que existen en la app | Mismo catálogo | Gate equivalente en `tool/` | TODO |
| H7.S2.M2 | Consentimiento en Privacidad del perfil | Mismo comportamiento que la web | Simulador + captura | TODO |
| H7.S2.M3 | `X-Client-Kind` en el cliente HTTP | La sesión de login queda `IOS` | Integración | TODO |
| H7.S3.M1 | `flutter analyze` + `flutter test` + recorrido en simulador | Verde | `xcrun simctl io <UDID> screenshot` | TODO |

### H8 — Operación, retención y documentación

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H8.S1.M1 | Job `ux-retention` (90 días crudo, 13 meses visitas) por lotes | Borra sin bloquear la ingesta | Spec + `EXPLAIN` con el BRIN | TODO |
| H8.S1.M2 | Métricas del pipeline en `ingestion_pipeline_metric_series` (lag de proyección, eventos por minuto, descartes) | Se ven en Observabilidad | Spec | TODO |
| H8.S1.M3 | Alerta: lag de proyección > 10 min | Dispara en local con el job parado | Prueba manual documentada | TODO |
| H8.S2.M1 | `analytics-events.md`: catálogo nuevo, consulta sobre agregados en vez de la EAV | Doc al día | Revisión | TODO |
| H8.S2.M2 | `src/modules/telemetry/README.md`: endpoints nuevos y flujo crudo → proyección → agregados | Doc al día | Revisión | TODO |
| H8.S2.M3 | Runbook: encender en un entorno (variables, seed, worker, verificación) | Otra sesión lo enciende siguiéndolo | Ensayo en `test` | TODO |

### H9 — De punta a punta y despliegue

| ID | Microtarea | CA | DoD | Estado |
|---|---|---|---|---|
| H9.S1.M1 | Kill-test del encabezado en local (API + front + worker en worktrees, puertos propios) | Pasa | `evidencia/kill-test.txt` | TODO |
| H9.S1.M2 | Carga: 50 visitas simuladas de 20 pantallas (≈ 15.000 eventos) | Ingesta p95 < 300 ms por lote; lag < 1 min | `scripts/bench/*` | TODO |
| H9.S2.M1 | PRs a `dev` (API, front, móvil) con gates a mano (el CI propio está caído) | Abiertos con evidencia | Links | TODO |
| H9.S2.M2 | Réplica a `test` | Abiertos | Links | TODO |
| H9.S2.M3 | Encender en `test` con muestreo 0,25 durante una semana | Agregados con datos | Visor en `test` | TODO |

---

## 9. Orden y dependencias

```
H0 ──► H1 ──► H2 ──► H4 ──► H6 ──► H9
        │      │      ▲      ▲
        │      └► H3 ─┘      │
        └────────► H5 ───────┘   (H5.S1.M1 = DEC-1 bloquea encender en cualquier entorno)
                   H7 (después de H0–H3, en paralelo con H4–H6)
                   H8 (a lo largo; cierra antes de H9.S2.M3)
```

Tamaño aproximado (una persona, con verificación real): H0 2 d · H1 2 d · H2 2 d · H3 2 d · H4 2 d ·
H5 1,5 d + decisión · H6 4 d · H7 3 d · H8 1,5 d · H9 1,5 d → **≈ 21 días hábiles**. H0–H2 solos ya dan
la bitácora de sesiones y de rutas; el mapa necesita además H4–H6.

## 10. Decisiones que tiene que tomar Pablo

| ID | Pregunta | Recomendación |
|---|---|---|
| **DEC-1** | Texto y momento del consentimiento (aviso al primer ingreso, solo en Privacidad, o ambos) | Ambos: aviso no bloqueante una vez por versión + interruptor en Privacidad. Lo valida legal |
| **DEC-2** | ¿Se capturan las pantallas públicas sin login (ficha pública, directorio, `/auth`)? | Sí, sin `userId` y con aviso de cookies, en una segunda tanda (necesita un endpoint `@Public` con límite de peticiones) |
| **DEC-3** | ¿Quién ve los mapas? | v1 `PLATFORM_ADMIN` + `SECURITY_ADMIN`; rol `UX_ANALYST` si lo va a usar alguien de producto |
| **DEC-4** | ¿Se reenvía algo a GA4? | Solo `pagina_vista` de rutas públicas; nada de salud |
| **DEC-5** | Retenciones (90 d / 13 m / 25 m) | Las propuestas; acortar el crudo a 30 d si legal lo pide |
| **DEC-6** | Muestreo al encender en producción | 0,25 al principio, subir si el volumen lo permite |

## 11. Riesgos

| Riesgo | Mitigación |
|---|---|
| Volumen (un clic = un evento) | Muestreo por visita, inserción multi-fila, proyección asíncrona, hypertable comprimida |
| Romper la ingesta de otros eventos (web vitals, conversiones) al tocar sesión y contrato | Alias de un release para `sessionId`; specs de UC-28-08/09/11 en el mismo PR |
| Selectores inestables | Puntos clave con `data-ux-clave`; el mapa «de todo» se lee como aproximado |
| Re-identificación por combinación (ruta rara + hora + dispositivo) | k ≥ 5, sin segmentación por rol, `subject_hash` rotado, sin lecturas por persona |
| Datos de salud en rutas | Plantillas validadas en API y front; `data-ux-ignore` en zonas clínicas |
| La pantalla del visor no es la que vio el sujeto (otros datos, otro alto) | Y en px del documento + alto p90 mostrado; leyenda que lo explica |
| Árbol y servicios compartidos | Worktrees y puertos propios; parches probados en una base temporal, no en el Postgres compartido |

## 12. Fuera de alcance

- Grabación de sesiones (replay del DOM) y movimiento del ratón.
- Mapas por persona o por rol.
- Experimentos A/B.
- Analítica del backoffice de aseguradoras en el móvil (`insurance_admin/analytics`), que es otra cosa.
