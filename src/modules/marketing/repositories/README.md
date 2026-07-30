# Repositorios de marketing

Acceso a `marketing.*` con MikroORM. Sin reglas de negocio.

## Fuente de datos

PostgreSQL, schema `marketing`. Entidades generadas por introspección. Las altas usan
`em.create(..., { partial: true })` **sin flush**: lo cierra la transacción del servicio.

## Repositorios

| Repositorio | Tablas | Métodos destacados |
| --- | --- | --- |
| `MarketingCampaignsRepository` | `segments`, `segment_members`, `marketing_campaigns`, `campaign_members`, `content_templates` | `createSegment`, `findSegmentForUpdate`, `findSegmentByCode`, `createSegmentMember`, `findSegmentMembers`, `findActiveSegmentMembers`, `createCampaign`, `findCampaignForUpdate`, `findCampaignByCode`, `createCampaignMember`, `findCampaignMembers`, `findCampaignMemberByRefForUpdate`, `createContentTemplate`, `findLatestTemplateVersionForUpdate`, `findPublishedTemplate` |
| `MarketingJourneysRepository` | `journeys`, `journey_steps`, `journey_enrollments`, `tracked_links`, `marketing_touchpoints`, `attribution_touches` | `createJourney`, `findJourneyForUpdate`, `findJourneyByCode`, `createJourneyStep`, `findStepsByJourney`, `findStepById`, `findLastStep`, `createEnrollment`, `findActiveEnrollment`, `findEnrollmentForUpdateSkipLocked`, `findEnrollmentForUpdate`, `createTrackedLink`, `findTrackedLinkByCodeForUpdate`, `createTouchpoint`, `findTouchpointsInWindow`, `createAttributionTouch`, `findAttributionTouches`, `removeAttributionTouches` |

La división separa lo que se **planifica** (a quién y con qué contenido) de lo que se **ejecuta y
mide** (el recorrido, el click y el crédito de la conversión).

## Lecturas con bloqueo

`findSegmentForUpdate`, `findCampaignForUpdate`, `findJourneyForUpdate`,
`findLatestTemplateVersionForUpdate`, `findTrackedLinkByCodeForUpdate`,
`findCampaignMemberByRefForUpdate` y `findEnrollmentForUpdate` usan `LockMode.PESSIMISTIC_WRITE`:
todas preceden a una transición o a un contador que no debe intercalarse.

`findEnrollmentForUpdateSkipLocked` usa `LockMode.PESSIMISTIC_PARTIAL_WRITE` (FOR UPDATE SKIP
LOCKED). Es el único caso donde saltar una fila tomada es lo correcto: varios orquestadores avanzan
inscripciones en paralelo y bloquearse mutuamente sólo añadiría latencia.

## Lecturas por clave natural

`findSegmentByCode`, `findCampaignByCode`, `findJourneyByCode` (tenant + código) y
`findTrackedLinkByCode` (código global) anticipan el conflicto de la UNIQUE para devolver un error
de dominio. La constraint sigue siendo la garantía real ante concurrencia.

`findActiveEnrollment` refleja la UNIQUE parcial `WHERE status = active`: comprobarla antes permite
devolver un conteo de omitidos en vez de un error de base a mitad de la cohorte.

## Consultas por ventana

`findTouchpointsInWindow` filtra por miembro y rango de `occurred_at`, ordenado ascendente. El orden
no es cosmético: de él salen las posiciones `first` / `middle` / `last` del reparto de atribución.

## Agregación

`findSegmentMembers`, `findCampaignMembers` y `findStepsByJourney` devuelven la colección completa
de un agregado acotado. El servicio compara en memoria: son conjuntos delimitados por segmento,
campaña o journey.

## Borrado

`removeAttributionTouches` es el único borrado del módulo, y es deliberado: recalcular la atribución
sustituye el reparto anterior del mismo modelo en bloque. Los touchpoints, en cambio, nunca se
borran ni se actualizan.

## Rendimiento

Consultas por PK, FK o clave natural indexada. Sin N+1: nada recorre relaciones fila por fila.

## Pruebas

Se ejercitan desde los specs de servicio, donde van mockeados. La cobertura real de las consultas
—y del comportamiento de los bloqueos y del SKIP LOCKED— llega con las pruebas de integración.
