# Módulo 50 — Marketing Automation, Journeys y Atribución

Segmentación de audiencia, campañas multicanal, plantillas de contenido versionadas, journeys con
inscripciones que avanzan paso a paso, enlaces rastreables y atribución multi-touch. Además sirve el
dataset de **plataforma** de AloVida Insights (`/marketing/insights/*`, tablas `insights_*` sin
`tenant_id`): sus dos lecturas de campañas (`catalog`, `campaign-facts`) y el flujo de trabajo de las personas (alertas, reglas, preferencias, vistas guardadas e informes).

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-31 sobre origin/dev (f02f6544) más las ramas claude/insights-f3-lecturas y claude/insights-f4-escrituras. Repetir con:
  find src/modules/marketing -name '*.controller.ts' | wc -l
  find src/modules/marketing -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/marketing -name '*.entity.ts' | wc -l
  find src/modules/marketing -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **5 controllers, 31 rutas HTTP, 36 entidades y 5 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 36 de 36 archivos `*.entity.ts`): las 14 del módulo (`attribution_touches`, `campaign_dispatch_recipients`, `campaign_dispatches`, `campaign_members`, `campaign_schedules`, `content_templates`, `journey_enrollments`, `journey_steps`, `journeys`, `marketing_campaigns`, `marketing_touchpoints`, `segment_members`, `segments`, `tracked_links`) y las 22 de AloVida Insights, todas con prefijo `insights_` (`insights_alert_rules`, `insights_alert_transitions`, `insights_alerts`, `insights_app_daily_facts`, `insights_app_onboarding_facts`, `insights_app_screen_daily_facts`, `insights_campaign_daily_facts`, `insights_campaign_hourly_facts`, `insights_campaigns`, `insights_creatives`, `insights_data_sources`, `insights_environment_items`, `insights_mentions`, `insights_milestones`, `insights_notification_preferences`, `insights_reports`, `insights_saved_views`, `insights_search_signals`, `insights_sector_trends`, `insights_social_daily_facts`, `insights_social_posts`, `insights_user_preferences`). Las lecturas de esta franja solo usan `insights_campaigns`, `insights_creatives`, `insights_milestones`, `insights_data_sources` e `insights_campaign_daily_facts`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /marketing/segments` | MARKETING_MANAGER | `marketing` |
| `POST /marketing/segments/:id/refresh` | MARKETING_MANAGER, SYSTEM | `marketing` |
| `POST /marketing/campaigns` | MARKETING_MANAGER | `marketing` |
| `POST /marketing/campaigns/:id/members/materialize` | MARKETING_MANAGER, SYSTEM | `marketing` |
| `POST /marketing/content-templates/:code/versions` | CONTENT_EDITOR, MARKETING_MANAGER | `marketing` |
| `POST /marketing/journeys` | MARKETING_MANAGER | `marketing` |
| `POST /marketing/journeys/:id/steps` | MARKETING_MANAGER | `marketing` |
| `POST /marketing/journeys/:id/activate` | MARKETING_MANAGER | `marketing` |
| `POST /marketing/enrollments/:id/advance` | SYSTEM, MARKETING_MANAGER | `marketing` |
| `POST /marketing/enrollments/:id/exit` | SYSTEM, MARKETING_MANAGER | `marketing` |
| `POST /marketing/tracked-links` | MARKETING_MANAGER | `marketing` |
| `POST /marketing/tracked-links/:id/recipient-tokens` | SYSTEM, MARKETING_MANAGER | `marketing` |
| `POST /marketing/touchpoints` | SYSTEM, MARKETING_MANAGER | `marketing` |
| `POST /marketing/attribution/compute` | SYSTEM, MARKETING_MANAGER | `marketing` |
| `GET /r/:code` | pública | `tracked-link-redirect` |
| `GET /marketing/insights/catalog` | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN (+ SUPERADMIN) | `insights-facts` |
| `GET /marketing/insights/campaign-facts` | MARKETING_MANAGER, PLATFORM_ADMIN, DATA_PLATFORM_ADMIN (+ SUPERADMIN) | `insights-facts` |
| `GET /marketing/insights/alert-workflow` | ídem | `insights-workflow` |
| `PUT /marketing/insights/alert-workflow/:fingerprint` | ídem | `insights-workflow` |
| `GET /marketing/insights/alert-rules` | ídem | `insights-workflow` |
| `PATCH /marketing/insights/alert-rules/:code` | ídem | `insights-workflow` |
| `GET` · `PUT /marketing/insights/notification-preferences` | ídem | `insights-workspace` |
| `GET` · `PUT /marketing/insights/user-preferences` | ídem | `insights-workspace` |
| `GET /marketing/insights/saved-views` · `PUT` · `DELETE /marketing/insights/saved-views/:id` | ídem | `insights-workspace` |
| `GET /marketing/insights/reports` · `PUT` · `DELETE /marketing/insights/reports/:id` | ídem | `insights-workspace` |

## Casos de uso cubiertos (18)

| UC | Endpoint | Descripción |
| --- | --- | --- |
| UC-50-01 | `POST /marketing/segments` | Crear segmento y ligarlo a su read model |
| UC-50-02 | `POST /marketing/segments/:id/refresh` | Recomputar la membresía |
| UC-50-03 | `POST /marketing/campaigns` | Lanzar campaña multicanal desde un segmento |
| UC-50-04 | `POST /marketing/campaigns/:id/members/materialize` | Materializar la audiencia |
| UC-50-05 | `POST /marketing/content-templates/:code/versions` | Publicar versión de plantilla |
| UC-50-06 | `POST /marketing/journeys` · `POST /marketing/journeys/:id/steps` | Diseñar journey con pasos |
| UC-50-07 | `POST /marketing/journeys/:id/activate` | Activar e inscribir la cohorte |
| UC-50-08 | `POST /marketing/enrollments/:id/advance` | Avanzar la inscripción |
| UC-50-09 | `POST /marketing/enrollments/:id/exit` | Cerrar la inscripción |
| UC-50-10 | `POST /marketing/tracked-links` · `GET /r/:code` | Enlace rastreable y click |
| UC-50-11 | `POST /marketing/touchpoints` | Registrar touchpoint (append-only) |
| UC-50-12 | `POST /marketing/attribution/compute` | Atribución multi-touch |
| UC-50-13 | `GET /marketing/insights/catalog` | Catálogo de Insights: campañas (con canales derivados de sus creativos) e hitos |
| UC-50-14 | `GET /marketing/insights/campaign-facts` | Hechos diarios por campaña y canal en una ventana de hasta 92 días, con `meta` (`dataset`, `asOf`, `notMeasured`) |
| UC-50-15 | `GET /marketing/insights/alert-workflow` · `PUT /marketing/insights/alert-workflow/:fingerprint` | Estado, responsable e historial de una alerta detectada por la pantalla: el `PUT` la crea con su `snapshot` la primera vez y escribe una fila de `insights_alert_transitions` solo si cambia el estado o el responsable |
| UC-50-16 | `GET /marketing/insights/alert-rules` · `PATCH /marketing/insights/alert-rules/:code` | Encender, apagar o cambiar el umbral (1 a 500) de una de las siete reglas; `If-Match` obligatorio |
| UC-50-17 | `GET`·`PUT /marketing/insights/notification-preferences` · `user-preferences` | Preferencias de aviso (no se envía nada) y de interfaz del usuario autenticado |
| UC-50-18 | `GET`·`PUT`·`DELETE /marketing/insights/saved-views` · `reports` | Vistas guardadas (nombre único por usuario) e historial de informes (máximo 12 por usuario) |

## Entidades

`segments`, `segment_members`, `marketing_campaigns`, `campaign_members`, `content_templates`,
`journeys`, `journey_steps`, `journey_enrollments`, `tracked_links`, `marketing_touchpoints`,
`attribution_touches`.

`campaign_dispatches`, `campaign_dispatch_recipients` y `campaign_schedules` pertenecen al envío
efectivo, que vive en messaging: este módulo no las escribe (ver *Fuera de este módulo*).

## Flujo general

```
segmento (active) ── refresh ──> membresía (active | removed), estimated_size derivado
     │
     └─ campaña (scheduled) ── members/materialize ──> running + audiencia (targeted)
                                        │
                                        └─ touchpoint ──> opened | clicked | converted

plantilla vN (published) ── nueva versión ──> vN archived, vN+1 published

journey (draft) ── steps ── activate ──> active + inscripciones (active) en el primer paso
                                              ├─ advance ──> siguiente paso  [+ touchpoint si SEND]
                                              ├─ advance sin siguiente ──> completed
                                              └─ exit ──> completed (meta) | exited (baja, rebote)

enlace (active) ── GET /r/{code}?t=<token> ──> click_count++ [+ touchpoint si el token es válido]

touchpoints del miembro en ventana ── attribution/compute ──> reparto con SUM(weight) = 1
```

## Reglas de negocio

- **El refresco recibe la membresía completa**: quien no viene en el cuerpo sale del segmento. La
  baja es lógica (`removed`), no borrado, para conservar a quién se contactó alguna vez; y quien
  vuelve se reactiva en vez de duplicarse.
- **`estimated_size` es derivado** (REC 3.3): se recalcula en el refresco, no se acepta del cliente.
- **La campaña nace `scheduled`** y sólo pasa a `running` al materializar la audiencia: una campaña
  sin destinatarios no está corriendo.
- **Materializar es idempotente**: repetir la llamada incorpora lo nuevo y omite lo ya presente. La
  supresión (do-not-contact, preferencias de mensajería) llega resuelta y se respeta.
- **Una sola versión publicada por código de plantilla**: publicar archiva la anterior en la misma
  transacción, y la versión se deriva de ella (`prev + 1`), nunca se recibe.
- **Un journey activo no cambia de forma**: añadir pasos exige que siga en borrador; alterar el
  grafo bajo inscripciones que ya lo recorren las dejaría apuntando a pasos inexistentes.
- **Un paso `SEND` exige plantilla publicada**, `WAIT` exige duración y `BRANCH` exige condición: un
  paso incompleto bloquearía la inscripción al llegar a él.
- **No hay doble inscripción activa**: la cohorte omite a quien ya está dentro, en línea con la
  UNIQUE parcial `WHERE status = active`.
- **La espera se cuenta desde el último movimiento** de la inscripción; avanzar antes de tiempo se
  rechaza.
- **Los touchpoints son inmutables**: se insertan y nunca se corrigen. Lo que cambia es el estado
  del miembro de campaña, y sólo cuando el contacto dice algo de él (`open`, `click`, `conversion`).
- **La atribución reemplaza, no acumula**: recalcular borra el reparto previo del mismo modelo,
  porque dos repartos superpuestos romperían `SUM(weight) = 1`. En el modelo lineal el resto de la
  división cae en el último touchpoint para que la suma dé exactamente 1.

## Permisos

**AloVida Insights** (`/marketing/insights/*`, decisión D-7): `@Roles('MARKETING_MANAGER',
'PLATFORM_ADMIN', 'DATA_PLATFORM_ADMIN')` en cada handler (`SUPERADMIN` entra por el comodín de
`RolesGuard`) y `@PlatformTenantOptional('SUPERADMIN', 'PLATFORM_ADMIN', 'DATA_PLATFORM_ADMIN')` en
la clase. Nunca `BUSINESS_ADMIN`. Las escrituras (`INSIGHTS_WRITE_ROLES`) usan los mismos roles que las
lecturas y todas llevan `@Audited` (`MARKETING_INSIGHTS_*`). `PLATFORM_ADMIN` y `DATA_PLATFORM_ADMIN` son roles globales y leen
sin cabecera. `MARKETING_MANAGER` está sembrado con ámbito de **tenant**: no está en la lista
tenant-opcional a propósito, así que necesita `X-Tenant-Id` (o una sola membresía) y solo autoriza
en el tenant donde se le concedió (`403 ROLE_INSUFFICIENT` en otro; `403 TENANT_AMBIGUOUS` /
`TENANT_REQUIRED` sin cabecera con varias o ninguna membresía). Esa cadena está fijada por
`insights-access.spec.ts`, que ejecuta `TenantScopeGuard` y `RolesGuard` reales contra los 16 handlers de
Insights (lecturas y escrituras).

**Resto del módulo:**

`MARKETING_MANAGER` en todo el módulo. `CONTENT_EDITOR` para publicar plantillas. `SYSTEM` en lo
que ejecutan los workers: refresco de segmento, materialización, avance y salida de inscripciones,
touchpoints y atribución. `GET /r/:code` es **público**: quien hace click es el destinatario del
mensaje, no un usuario con sesión; por eso no declara quién es: presenta el token que emite
`POST /marketing/tracked-links/:id/recipient-tokens` (firmado, con vencimiento y ligado al enlace y
al destinatario).

## Alcance por tenant

**Excepción: AloVida Insights es «plataforma, sin tenant».** Las tablas `marketing.insights_*` no
llevan `tenant_id` y las lecturas de `/marketing/insights/*` no se filtran por tenant: lo que
protege el dato es el rol (ver *Permisos*), no la fila. Para `MARKETING_MANAGER` el tenant solo
sirve para pasar los guards; el contenido devuelto es el mismo en cualquier tenant. Las alertas y las
reglas son **compartidas** por todo el portal. Lo que es de la persona (preferencias de aviso y de
interfaz, vistas guardadas, informes) se acota por `user_id` = **id del usuario autenticado**
(`@CurrentUser()`): ninguna ruta recibe un `userId`, todo SQL filtra por él, y un `id` de vista o
informe que es de otro usuario responde `404 MARKETING_INSIGHTS_RESOURCE_NOT_AVAILABLE` (igual que
uno inexistente); `DELETE` es idempotente y no toca filas ajenas. Lo que sigue
describe el resto del módulo.

El tenant sale del contexto autenticado (`requireTenantId()`), nunca del cuerpo: `tenantId` en los
DTO de alta es opcional y, si llega, debe coincidir con el activo (`412 MARKETING_TENANT_MISMATCH`).
Segmentos, campañas, journeys y plantillas se buscan y bloquean por `id + tenantId`; las
inscripciones heredan el tenant de su journey y los enlaces y touchpoints, el de su campaña. Un
recurso de otro tenant responde igual que uno inexistente (`404`, mismo mensaje y `reason`
`MARKETING_*_NOT_AVAILABLE`, sin `details`). Los endpoints `SYSTEM` también exigen un tenant activo
(`X-Tenant-Id`). Los códigos de segmento, campaña y journey son únicos por tenant; la violación de
unicidad de la base responde `409 MARKETING_CODE_ALREADY_EXISTS`
(`database/SQL/patches/2026-10-24_marketing_code_unique_per_tenant.sql`).

## Concurrencia

`FOR UPDATE` sobre segmento (serializa refrescos), campaña, journey, plantilla vigente, enlace
rastreable (para no perder clicks) y miembro de campaña. `FOR UPDATE SKIP LOCKED` en el avance de
inscripciones: varios orquestadores trabajan en paralelo y ninguno debe esperar a la inscripción que
otro ya tiene tomada. `row_version` aporta bloqueo optimista automático.

### Concurrencia de Insights (`If-Match`)

- **Alertas** (`PUT alert-workflow/:fingerprint`): `SELECT … FOR UPDATE` por `fingerprint`. Alta sin
  `If-Match` (si viene, solo vale `0`); si la alerta existe, `If-Match` con su `rowVersion` o
  `412 MARKETING_INSIGHTS_VERSION_MISMATCH` (también si falta). Dos altas simultáneas: una crea
  (`ON CONFLICT (fingerprint) DO NOTHING`), la otra recibe 412. Un PUT sin cambio de estado ni de
  responsable no sube `rowVersion` ni escribe transición.
- **Reglas** (`PATCH alert-rules/:code`): `If-Match` obligatorio (`428 MARKETING_INSIGHTS_IF_MATCH_REQUIRED`
  si falta, `412` si está vieja). Umbral fuera de 1 a 500 → `422 MARKETING_INSIGHTS_RULE_THRESHOLD_OUT_OF_RANGE`
  (lo valida el servicio, no el `ValidationPipe`, que respondería 400).
- **Preferencias**: igual que las alertas; mientras el usuario no guardó nada, el `GET` devuelve valores
  por defecto con `rowVersion` 0.
- **Vistas e informes**: `PUT` idempotente por `id` del cliente, sin `If-Match`. Un
  `pg_advisory_xact_lock` por usuario serializa sus escrituras: el nombre de vista repetido en otro
  `id` es `409 MARKETING_INSIGHTS_VIEW_NAME_TAKEN` y el informe 13.º expulsa el más viejo (borra lo que
  pase de 12, ordenado por `created_at`).

## Logs

`operation: 'marketing.<área>.<acción>'`. No se loguean identificadores de miembro más allá del UUID
ni el contenido de las plantillas.

## Pruebas

`corepack yarn test src/modules/marketing --runInBand --silent` — incluye, para Insights,
`insights-access.spec.ts` (guards reales, casos a-f de D-7), `insights-facts.controller.spec.ts`
(metadatos de rol y de tenant-opcional, ningún handler sin rol), `insights-facts.service.spec.ts`
(ventana, `NULL` a `notMeasured`, mapeos) y `insights-query.dto.spec.ts`. La integración opt-in con
PostgreSQL real es `test/integration/marketing-insights.int-spec.ts` (`DATA_CATALOG_IT_DB_URL`, base
desechable).

Para el flujo de trabajo: `insights-workflow.service.spec.ts` y `insights-workspace.service.spec.ts`
(transición solo con cambio, 412, 422, 409, límite de 12, aislamiento por usuario),
`insights-workflow.controller.spec.ts` (`@Roles`, `@PlatformTenantOptional`, `@Audited` en cada
handler) e `insights-workspace.dto.spec.ts`. Integración opt-in:
`test/integration/marketing-insights-workflow.int-spec.ts` (PUT alerta → fila + transición, 412 con
`If-Match` viejo, vista ×2 = una fila, informe 13.º expulsa el 1.º, aislamiento entre usuarios).

## Revisión backend 2026-10-04

El módulo expone roles de marketing y bloqueos de concurrencia, pero actualmente recibe el tenant
en el cuerpo y carga recursos por UUID sin comprobar la pertenencia del actor. También hay
desacuerdo entre la unicidad por tenant que usa el servicio y los índices globales de `code`, y la
ruta pública de enlaces permite aportar el miembro al que atribuir un click.

## Fuera de este módulo

- **Envío real**: `campaign_dispatches`, `campaign_dispatch_recipients` y `campaign_schedules` los
  llena messaging al materializar las peticiones de notificación. Este módulo no escribe los campos
  que apuntan a ellas (`first_dispatch_id`, `last_dispatch_id`, `notification_request_id`).
- **Consentimiento**: la base legal de marketing (`consent.consents`) y el `do_not_contact` se
  asumen resueltos por quien llama; este módulo respeta la lista de supresión que recibe.