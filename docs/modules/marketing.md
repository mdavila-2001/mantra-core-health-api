<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/marketing/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `marketing`

**Fuente:** [`src/modules/marketing/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/master/src/modules/marketing/README.md)
· 2 controllers · 2 services · 2 repositories · 14 entidades · 1 DTO

---

# Módulo 50 — Marketing Automation, Journeys y Atribución

Segmentación de audiencia, campañas multicanal, plantillas de contenido versionadas, journeys con
inscripciones que avanzan paso a paso, enlaces rastreables y atribución multi-touch.

## Casos de uso cubiertos (12)

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

## Entidades

`segments`, `segment_members`, `marketing_campaigns`, `campaign_members`, `content_templates`,
`journeys`, `journey_steps`, `journey_enrollments`, `tracked_links`, `marketing_touchpoints`,
`attribution_touches`.

`campaign_dispatches`, `campaign_dispatch_recipients` y `campaign_schedules` pertenecen al envío
efectivo, que vive en messaging: este módulo no las escribe (ver *Pendiente*).

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

enlace (active) ── GET /r/{code} ──> click_count++ [+ touchpoint si hay miembro]

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

`MARKETING_MANAGER` en todo el módulo. `CONTENT_EDITOR` para publicar plantillas. `SYSTEM` en lo
que ejecutan los workers: refresco de segmento, materialización, avance y salida de inscripciones,
touchpoints y atribución. `GET /r/:code` es **público**: quien hace click es el destinatario del
mensaje, no un usuario con sesión.

## Concurrencia

`FOR UPDATE` sobre segmento (serializa refrescos), campaña, journey, plantilla vigente, enlace
rastreable (para no perder clicks) y miembro de campaña. `FOR UPDATE SKIP LOCKED` en el avance de
inscripciones: varios orquestadores trabajan en paralelo y ninguno debe esperar a la inscripción que
otro ya tiene tomada. `row_version` aporta bloqueo optimista automático.

## Logs

`operation: 'marketing.<área>.<acción>'`. No se loguean identificadores de miembro más allá del UUID
ni el contenido de las plantillas.

## Pruebas

`yarn test --testPathPatterns=marketing` — 66 pruebas de servicio + delegación de los dos
controladores.

## Pendiente

- **Envío real**: `campaign_dispatches`, `campaign_dispatch_recipients` y `campaign_schedules` se
  llenan cuando messaging materialice las peticiones de notificación. Aquí los campos que apuntan a
  ellas (`first_dispatch_id`, `last_dispatch_id`, `notification_request_id`) quedan sin poblar.
- **Outbox**: los eventos que declaran los casos de uso (`SegmentRefreshed`, `CampaignLaunched`,
  `JourneyStepExecuted`, `AttributionComputed`…) se emitirán cuando exista el módulo 35.
- **Consentimiento**: la base legal de marketing (`consent.consents`) y el `do_not_contact` se
  asumen resueltos por quien llama; este módulo respeta la lista de supresión que recibe.

