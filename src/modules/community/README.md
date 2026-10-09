# Módulo Community (19)

Perfiles públicos, grafo social, mensajería directa, moderación (confianza y
seguridad), reviews verificadas, encuestas, grupos y fan-out de feed. Implementa
los 15 casos de uso `UC-19-01..15` más endpoints de bootstrap para los recursos
padre que ningún UC crea (perfil público, conversación, encuesta, grupo).

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/community -name '*.controller.ts' | wc -l
  find src/modules/community -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/community -name '*.entity.ts' | wc -l
  find src/modules/community -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **13 controllers, 92 rutas HTTP, 40 entidades y 29 servicios** (incluye los ya documentados más abajo). La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Importa (`community.module.ts`): `CommonModule`, `ClinicalModule`, `SearchPlatformModule`, `RedisRuntimeModule`, `MessagingModule`, `TerminologyModule`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `POST /internal/community/feed/rebuild` | SYSTEM, SECURITY_ADMIN | `community-feed` |
| `GET /internal/community/feed/pending` | SYSTEM, SECURITY_ADMIN | `community-feed` |
| `POST /community/groups` | sesión | `community-groups` |
| `POST /community/groups/:groupId/members` | sesión | `community-groups` |
| `PATCH /community/groups/:groupId/members/:member` | sesión | `community-groups` |
| `DELETE /community/groups/:groupId/members/:member` | sesión | `community-groups` |
| `POST /community/groups/:groupId/posts` | sesión | `community-groups` |
| `GET /community/groups` | sesión | `community-groups` |
| `GET /community/groups/:groupId` | sesión | `community-groups` |
| `GET /community/groups/:groupId/members` | sesión | `community-groups` |
| `GET /community/groups/:groupId/posts` | sesión | `community-groups` |
| `POST /community/conversations` | sesión | `community-messaging` |
| `POST /community/conversations/:conversationId/messages` | sesión | `community-messaging` |
| `PATCH /community/conversations/:conversationId/messages/:messageId` | sesión | `community-messaging` |
| `DELETE /community/conversations/:conversationId/messages/:messageId` | sesión | `community-messaging` |
| `POST /community/conversations/:conversationId/read` | sesión | `community-messaging` |
| `PATCH /community/conversations/:conversationId/participant` | sesión | `community-messaging` |
| `POST /community/conversations/:conversationId/pin` | sesión | `community-messaging` |
| `DELETE /community/conversations/:conversationId/pin` | sesión | `community-messaging` |
| `POST /community/conversations/contacts/search` | sesión | `community-messaging` |
| `GET /community/conversations/:conversationId/attachments/:fileId/content` | sesión | `community-messaging` |
| `GET /community/conversations` | sesión | `community-messaging` |
| `GET /community/conversations/:conversationId/messages` | sesión | `community-messaging` |
| `GET /community/conversations/:conversationId/presence` | sesión | `community-messaging` |
| `POST /community/reports` | sesión | `community-moderation` |
| `POST /community/moderation/queue/:queueId/decision` | SECURITY_ADMIN | `community-moderation` |
| `POST /community/moderation/decisions/:decisionId/appeal` | sesión | `community-moderation` |
| `POST /community/moderation/appeals/:appealId/resolve` | SECURITY_ADMIN | `community-moderation` |
| `GET /community/moderation/queue` | SECURITY_ADMIN | `community-moderation` |
| `GET /community/moderation/decisions/mine` | sesión | `community-moderation` |
| `GET /community/moderation/decisions` | SECURITY_ADMIN | `community-moderation` |
| `GET /community/moderation/appeals` | SECURITY_ADMIN | `community-moderation` |
| `POST /community/posts/:postId/polls` | sesión | `community-polls` |
| `POST /community/polls/:pollId/votes` | sesión | `community-polls` |
| `GET /community/polls/:pollId` | sesión | `community-polls` |
| `GET /public/posts` | pública | `community-public` |
| `GET /public/posts/:postId/reactions` | pública | `community-public` |
| `GET /public/posts/:postId/comments` | pública | `community-public` |
| `GET /public/comments/:commentId/replies` | pública | `community-public` |
| `GET /public/search` | pública | `community-public` |
| `GET /public/search/practitioners` | pública | `community-public` |
| `GET /public/search/organizations` | pública | `community-public` |
| `GET /public/search/diagnostic-units` | pública | `community-public` |
| `GET /public/search/insurers` | pública | `community-public` |
| `GET /public/search/pharmacies` | pública | `community-public` |
| `GET /public/search/medications` | pública | `community-public` |
| `GET /public/nearby` | pública | `community-public` |
| `GET /public/profiles/:prefijo/:slug` | pública | `community-public` |
| `GET /public/profiles/:prefijo/:slug/reviews` | pública | `community-public` |
| `GET /public/media/:id` | pública | `community-public` |
| `GET /p/:slug` | pública | `community-public` |
| `GET /o/:slug` | pública | `community-public` |
| `GET /f/:slug` | pública | `community-public` |
| `GET /l/:slug` | pública | `community-public` |
| `GET /s/:slug` | pública | `community-public` |
| `POST /community/profiles/:profileId/reviews` | sesión | `community-reviews` |
| `GET /community/profiles/:profileId/reviews` | sesión | `community-reviews` |
| `POST /community/profiles/:profileId/reviews/:reviewId/responses` | sesión | `community-reviews` |
| `POST /internal/community/search/reindex` | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `community-search-index` |
| `GET /internal/community/search/health` | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `community-search-index` |
| `POST /community/public-profiles` | SECURITY_ADMIN | `community-social` |
| `GET /community/profiles/me` | sesión | `community-social` |
| `PUT /community/profiles/me` | sesión | `community-social` |
| `GET /community/profiles/me/stats` | sesión | `community-social` |
| `POST /community/profiles/:profileId/posts` | sesión | `community-social` |
| `POST /community/comments` | sesión | `community-social` |
| `PUT /community/reactions` | sesión | `community-social` |
| `POST /community/bookmarks` | sesión | `community-social` |
| `POST /community/follows` | sesión | `community-social` |
| `POST /community/blocks` | sesión | `community-social` |
| `DELETE /community/follows` | sesión | `community-social` |
| `DELETE /community/bookmarks` | sesión | `community-social` |
| `DELETE /community/blocks` | sesión | `community-social` |
| `GET /community/profiles/by-slug/:slug` | sesión | `community-social` |
| `GET /community/profiles/:profileId/auto-reply` | sesión | `community-social` |
| `PUT /community/profiles/:profileId/auto-reply` | sesión | `community-social` |
| `GET /community/profiles/:profileId` | sesión | `community-social` |
| `GET /community/profiles/:profileId/posts` | sesión | `community-social` |
| `GET /community/posts/:postId` | sesión | `community-social` |
| `GET /community/posts/:postId/comments` | sesión | `community-social` |
| `GET /community/comments/media/:fileId/content` | sesión | `community-social` |
| `GET /community/posts/:postId/reactions` | sesión | `community-social` |
| `GET /community/follows` | sesión | `community-social` |
| `GET /community/bookmarks` | sesión | `community-social` |
| `GET /community/blocks` | sesión | `community-social` |
| `GET /community/feed` | sesión | `community-timeline` |
| `GET /community/notifications` | sesión | `community-timeline` |
| `GET /community/topics` | sesión | `community-topics` |
| `POST /internal/community/verification/badges` | SECURITY_ADMIN | `community-verification` |
| `POST /internal/community/verification/badges/:targetId/revoke` | SECURITY_ADMIN | `community-verification` |
| `POST /internal/community/verification/badges/expire-sweep` | SYSTEM, SECURITY_ADMIN | `community-verification` |
| `POST /patients/me/reviews` | PATIENT | `patient-reviews` |

## Endpoints por caso de uso (subconjunto)

Los UC-19-01..15 y las altas de bootstrap. El módulo tiene más rutas (lecturas de timeline, grupos, encuestas, moderación, reseñas, verificación y estadísticas de perfil, entre otras); la lista completa está en [Rutas HTTP](#rutas-http-y-alcance-medido).

| UC        | Método y ruta                                              | Permiso                    | Descripción                                                                  |
| --------- | ---------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| bootstrap | `POST /community/public-profiles`                          | `SECURITY_ADMIN`           | Proyecta un sujeto (user/patient/org) como perfil público (nodo raíz social) |
| UC-19-01  | `POST /community/profiles/{profileId}/posts`               | auth                       | Publica post con hashtags, media y menciones                                 |
| UC-19-02  | `POST /community/comments`                                 | auth                       | Comenta (hilo anidado) con contadores                                        |
| UC-19-03  | `PUT /community/reactions`                                 | auth                       | Reacciona (upsert una reacción por actor/objeto)                             |
| UC-19-04  | `POST /community/bookmarks`                                | auth                       | Guarda bookmark en colección                                                 |
| UC-19-05  | `POST /community/follows`                                  | auth                       | Sigue objeto social (perfil/tópico/hashtag/grupo)                            |
| UC-19-06  | `POST /community/conversations/{conversationId}/messages`  | auth                       | Envía mensaje directo                                                        |
| UC-19-07  | `POST /community/conversations/{conversationId}/read`      | auth                       | Marca mensajes como leídos (recibos)                                         |
| UC-19-08  | `POST /community/reports`                                  | auth                       | Reporta contenido y encola moderación                                        |
| UC-19-09  | `POST /community/moderation/queue/{queueId}/decision`      | `SECURITY_ADMIN`           | Resuelve moderación (decisión + strike)                                      |
| UC-19-10  | `POST /community/moderation/decisions/{decisionId}/appeal` | auth                       | Apela una decisión                                                           |
| UC-19-11  | `POST /community/profiles/{profileId}/reviews`             | auth                       | Publica review verificada de servicio                                        |
| UC-19-12  | `POST /community/polls/{pollId}/votes`                     | auth                       | Vota en encuesta                                                             |
| UC-19-13  | `POST /community/groups/{groupId}/members`                 | auth                       | Se une a grupo/comunidad                                                     |
| UC-19-14  | `POST /community/blocks`                                   | auth                       | Bloquea a un usuario                                                         |
| UC-19-15  | `POST /internal/community/feed/rebuild`                    | `SYSTEM`, `SECURITY_ADMIN` | Fan-out del feed (lo dispara `worker-community`)                             |
| UC-19-15  | `GET /internal/community/feed/pending`                     | `SYSTEM`, `SECURITY_ADMIN` | Lote de posts publicados sin repartir, con sus seguidores                    |
| bootstrap | `POST /community/conversations`                            | auth                       | Crea conversación con participantes                                          |
| bootstrap | `POST /community/posts/{postId}/polls`                     | auth                       | Crea encuesta con opciones                                                   |
| bootstrap | `POST /community/groups`                                   | auth                       | Crea grupo/comunidad                                                         |

### Lecturas

Hasta esta rama el módulo era **de sólo escritura**: se podía publicar,
comentar, reaccionar, seguir y bloquear, y no había forma de volver a leer nada
— ni siquiera el feed, que el fan-out materializaba para nadie. Todas exigen
sesión y ninguna lleva `@Roles`; las que exponen contenido privado comprueban
la propiedad del perfil en el servicio.

| Método y ruta                                           | Descripción                                       |
| ------------------------------------------------------- | ------------------------------------------------- |
| `GET /community/profiles/{profileId}`                   | Ficha con sellos de verificación y prestigio      |
| `GET /community/profiles/{profileId}/posts`             | Muro del perfil, filtrado por visibilidad         |
| `GET /community/posts/{postId}`                         | Post con media, hashtags y menciones              |
| `GET /community/posts/{postId}/comments`                | Hilo con respuestas anidadas                      |
| `GET /community/posts/{postId}/reactions`               | Recuento por tipo + reacción del actor            |
| `GET /community/follows?followerProfileId=`             | Seguimientos activos                              |
| `GET /community/bookmarks?profileId=`                   | Marcadores propios                                |
| `GET /community/blocks?profileId=`                      | Bloqueos propios                                  |
| `GET /community/profiles/{profileId}/reviews`           | Reviews publicadas del perfil                     |
| `GET /community/conversations?profileId=`               | Bandeja con vista previa y no leídos              |
| `GET /community/conversations/{id}/messages?profileId=` | Mensajes de la conversación                       |
| `GET /community/groups?tenantId=`                       | Directorio de grupos de la organización           |
| `GET /community/groups/{groupId}/members`               | Integrantes del grupo                             |
| `GET /community/polls/{pollId}`                         | Encuesta con recuentos y voto propio              |
| `GET /community/feed?profileId=`                        | Timeline propio, con las publicaciones hidratadas |
| `GET /community/notifications?profileId=`               | Bandeja social + `unreadCount`                    |

Todas paginan con el cursor keyset opaco de `common/pagination` (default 50
filas). Excepción: la bandeja de conversaciones devuelve las activas de una vez
y su `nextCursor` es siempre `null`.

## Entidades

`public_profiles` (anchor), `social_posts` + `post_media`/`hashtags`/`content_hashtags`/`mentions`,
`comments`, `reactions`, `bookmarks`, `social_follows`, `user_blocks`,
`conversations` + `conversation_participants`/`direct_messages`/`message_receipts`,
`content_reports` + `moderation_queue`/`moderation_decisions`/`moderation_strikes`/`moderation_appeals`,
`service_reviews` + `review_dimension_scores`, `polls` + `poll_options`/`poll_votes`,
`groups` + `group_members`, `feed_items`.

El módulo mapea **40 entidades** (`find src/modules/community -name '*.entity.ts' | wc -l`); las 12 no listadas arriba son `chat_auto_replies`, `comment_media`, `feedback_tickets` (+ `feedback_ticket_comments`, `feedback_ticket_events`), `post_shares`, `prestige_awards`, `prestige_scores`, `review_responses`, `social_notifications`, `topics` y `verified_badges`.

**Tiempo real:** `gateways/community-messaging.gateway.ts` es un gateway socket.io (`@WebSocketGateway()`) con los mensajes `join:inbox`, `join:conversation`, `leave:conversation`, `typing` y `presence:ping`; el CORS lo impone `CorsIoAdapter` en `main.ts`.

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
  nunca expone `verified_encounter_id` **ni `reviewer_patient_profile_id`** — la
  primera columna diría que esa persona se atendió ese día con ese profesional,
  y la segunda permitiría reconstruir quién escribió una reseña anónima. Lo que
  sí viaja es `verification_status_concept_id`, que basta para el sello de
  «paciente verificado».
- Encuesta: opción debe pertenecer al poll; single-choice admite un voto por votante.

### Reglas de las lecturas

Las tres viven en `CommunityVisibilityService` y no repetidas endpoint por
endpoint, porque una regla de visibilidad que se escribe quince veces se olvida
en la decimosexta y el que se olvida es el caso que filtra:

- **Propiedad**: feed, marcadores, bloqueos, conversaciones y notificaciones son
  del titular del perfil. **Limitación conocida**: no existe tabla que ate
  `iam.users` con `community.public_profiles` —el vínculo es polimórfico
  (`target_type_concept_id` + `target_id`)—, así que el titular se reconoce por
  `target_id = actor` o `created_by_user_id = actor`. Un perfil de profesional u
  organización creado por otro administrador no lo reconoce como propio; hasta
  que el modelo declare el vínculo formal, ese caso pasa por rol de plataforma.
  Las escrituras, además, siguen sin comprobar propiedad: aceptan
  `actorProfileId` del cuerpo.
- **Bloqueo**: corta la visibilidad en **ambos** sentidos. En un solo sentido
  dejaría al bloqueado leyendo a quien lo bloqueó.
- **Visibilidad declarada**: `PUBLIC` la ve cualquiera, `FOLLOWERS` sólo quien
  sigue al autor, `PRIVATE` sólo el autor. Un `visibility_concept_id` **nulo se
  lee como pública**: son las publicaciones anteriores a que el módulo declarara
  los conceptos `POST_VISIBILITY_*`, y esconderlas ahora las haría desaparecer
  de muros donde ya estaban.

Un contenido que existe pero el lector no puede ver responde **404, no 403**:
un 403 ya confirmaría que ese perfil publicó algo.

## Worker

`worker-community` (`src/worker-community.ts` → `src/worker/jobs/community/`)
corre tres jobs (`ls src/worker/jobs/community`): `badge-expiry` (cada hora, `EXPIRY_INTERVAL_MS = 3_600_000`: barre sellos vencidos por su propia fecha), `search-indexer` (cada 60 s) y `feed-fanout` (cada 60 s). Lo que sigue describe `feed-fanout`: `GET /internal/community/feed/pending`
descubre el lote y `POST …/rebuild` reparte cada publicación. El reparto es
idempotente en el servidor, así que un tick solapado o un reintento no duplican
entradas.

Dos cosas que no se deducen del código:

- El endpoint de descubrimiento existe porque `rebuild` recibe la lista de
  seguidores ya resuelta —sirve para el fan-out de **un** post— y un worker
  periódico no tiene de dónde sacarla.
- `rebuild` acepta `SYSTEM` además de `SECURITY_ADMIN` porque el
  `SystemApiClient` de los workers firma con rol `SYSTEM`: con sólo
  `SECURITY_ADMIN` el worker recibía 403 y el fan-out no se ejecutaba nunca.

Pendiente declarado: el reparto es siempre _push_. El umbral híbrido push/pull
para autores con muchísimos seguidores es una decisión abierta del equipo; el
tope de seguidores por pasada acota el daño mientras tanto.

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
- **Integración real: `test/integration/community-reads.int-spec.ts`.** Es la
  única prueba que demuestra las reglas de visibilidad: con el `EntityManager`
  simulado, quien decide si un post se ve es el propio mock. Ahí se ejerce el
  ciclo completo del fan-out (descubrir → repartir → leer el timeline), la
  visibilidad `PRIVATE`/`FOLLOWERS` contra filas reales, el bloqueo en los dos
  sentidos y que la review no arrastre el encuentro clínico.
