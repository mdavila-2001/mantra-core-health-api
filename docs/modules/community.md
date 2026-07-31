<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/community/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `community`

**Fuente:** [`src/modules/community/README.md`](https://github.com/mdavila-2001/mantra-core-health-redesa-api/blob/master/src/modules/community/README.md)
· 7 controllers · 7 services · 15 repositories · 38 entidades · 16 DTO

---

# Módulo Community (19)

Perfiles públicos, grafo social, mensajería directa, moderación (confianza y
seguridad), reviews verificadas, encuestas, grupos y fan-out de feed. Implementa
los 15 casos de uso `UC-19-01..15` más endpoints de bootstrap para los recursos
padre que ningún UC crea (perfil público, conversación, encuesta, grupo).

## Endpoints

| UC | Método y ruta | Permiso | Descripción |
|----|---------------|---------|-------------|
| bootstrap | `POST /community/public-profiles` | `SECURITY_ADMIN` | Proyecta un sujeto (user/patient/org) como perfil público (nodo raíz social) |
| UC-19-01 | `POST /community/profiles/{profileId}/posts` | auth | Publica post con hashtags, media y menciones |
| UC-19-02 | `POST /community/comments` | auth | Comenta (hilo anidado) con contadores |
| UC-19-03 | `PUT /community/reactions` | auth | Reacciona (upsert una reacción por actor/objeto) |
| UC-19-04 | `POST /community/bookmarks` | auth | Guarda bookmark en colección |
| UC-19-05 | `POST /community/follows` | auth | Sigue objeto social (perfil/tópico/hashtag/grupo) |
| UC-19-06 | `POST /community/conversations/{conversationId}/messages` | auth | Envía mensaje directo |
| UC-19-07 | `POST /community/conversations/{conversationId}/read` | auth | Marca mensajes como leídos (recibos) |
| UC-19-08 | `POST /community/reports` | auth | Reporta contenido y encola moderación |
| UC-19-09 | `POST /community/moderation/queue/{queueId}/decision` | `SECURITY_ADMIN` | Resuelve moderación (decisión + strike) |
| UC-19-10 | `POST /community/moderation/decisions/{decisionId}/appeal` | auth | Apela una decisión |
| UC-19-11 | `POST /community/profiles/{profileId}/reviews` | auth | Publica review verificada de servicio |
| UC-19-12 | `POST /community/polls/{pollId}/votes` | auth | Vota en encuesta |
| UC-19-13 | `POST /community/groups/{groupId}/members` | auth | Se une a grupo/comunidad |
| UC-19-14 | `POST /community/blocks` | auth | Bloquea a un usuario |
| UC-19-15 | `POST /internal/community/feed/rebuild` | `SECURITY_ADMIN` | Fan-out del feed (worker interno) |
| bootstrap | `POST /community/conversations` | auth | Crea conversación con participantes |
| bootstrap | `POST /community/posts/{postId}/polls` | auth | Crea encuesta con opciones |
| bootstrap | `POST /community/groups` | auth | Crea grupo/comunidad |

## Entidades

`public_profiles` (anchor), `social_posts` + `post_media`/`hashtags`/`content_hashtags`/`mentions`,
`comments`, `reactions`, `bookmarks`, `social_follows`, `user_blocks`,
`conversations` + `conversation_participants`/`direct_messages`/`message_receipts`,
`content_reports` + `moderation_queue`/`moderation_decisions`/`moderation_strikes`/`moderation_appeals`,
`service_reviews` + `review_dimension_scores`, `polls` + `poll_options`/`poll_votes`,
`groups` + `group_members`, `feed_items`.

## Reglas de negocio

- Toda FK `*_profile_id` referencia `community.public_profiles`; el bootstrap de
  perfil crea el nodo raíz obligatorio antes de cualquier acción social.
- Reacción: una por actor/objeto; segundo `PUT` actualiza el tipo (idempotente).
- Bookmark/follow/bloqueo/membresía: únicos; el duplicado devuelve 409.
- Auto-follow y auto-bloqueo se rechazan (422).
- Mensaje directo: exige remitente participante activo y ausencia de bloqueo.
- Reporte: dedup por contenido en cola abierta; la decisión cierra cola y reportes,
  y emite strike si se indica sujeto + severidad.
- Una única apelación abierta por decisión.
- Review verificada: exige perfil que acepte reviews y unicidad por encuentro;
  nunca expone `verified_encounter_id`.
- Encuesta: opción debe pertenecer al poll; single-choice admite un voto por votante.

## Concurrencia y persistencia

- Servicios usan `em.transactional`; `flush` del padre antes de los hijos (FK son
  columnas uuid planas, MikroORM no ordena inserts). `em.create(..., { partial: true })`.
- `row_version` nunca se fija (DEFAULT en BD). Auditoría vía `createdBy(actor.id)`/`touch`.
- Contadores derivados (`reply_count`, `message_count`, `vote_count`, `member_count`)
  se incrementan en la misma transacción.

## Conceptos, permisos, logs y tests

- Conceptos en `community.concepts.ts` (`COMMUNITY_CONCEPT_SEEDS`, ids en `COMM`).
  Estados genéricos usan `CONCEPTS.STATE_ACTIVE`/`STATE_PENDING`.
- Auth por guard global; endpoints admin/worker con `@Roles('SECURITY_ADMIN')`.
- Logs Pino estructurados (`operation`, ids); sin PHI ni secretos.
- Tests unitarios `*.spec.ts` (servicios mockean repos/em; controllers mockean
  servicio). Smoke transversal en `test/smoke/modules/community.smoke.ts`
  (`COMMUNITY_SMOKE`).

