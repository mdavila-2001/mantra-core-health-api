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

El módulo tiene **13 controllers, 92 rutas HTTP, 40 entidades y 29 servicios** (incluye los ya documentados más abajo). La columna _Acceso_ sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso (propiedad, tenant, vínculo) puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Importa (`community.module.ts`): `CommonModule`, `ClinicalModule`, `SearchPlatformModule`, `RedisRuntimeModule`, `MessagingModule`, `TerminologyModule`.

| Método y ruta                                                              | Acceso                               | Controller               |
| -------------------------------------------------------------------------- | ------------------------------------ | ------------------------ |
| `POST /internal/community/feed/rebuild`                                    | SYSTEM, SECURITY_ADMIN               | `community-feed`         |
| `GET /internal/community/feed/pending`                                     | SYSTEM, SECURITY_ADMIN               | `community-feed`         |
| `POST /community/groups`                                                   | sesión                               | `community-groups`       |
| `POST /community/groups/:groupId/members`                                  | sesión                               | `community-groups`       |
| `PATCH /community/groups/:groupId/members/:member`                         | sesión                               | `community-groups`       |
| `DELETE /community/groups/:groupId/members/:member`                        | sesión                               | `community-groups`       |
| `POST /community/groups/:groupId/posts`                                    | sesión                               | `community-groups`       |
| `GET /community/groups`                                                    | sesión                               | `community-groups`       |
| `GET /community/groups/:groupId`                                           | sesión                               | `community-groups`       |
| `GET /community/groups/:groupId/members`                                   | sesión                               | `community-groups`       |
| `GET /community/groups/:groupId/posts`                                     | sesión                               | `community-groups`       |
| `POST /community/conversations`                                            | sesión                               | `community-messaging`    |
| `POST /community/conversations/:conversationId/messages`                   | sesión                               | `community-messaging`    |
| `PATCH /community/conversations/:conversationId/messages/:messageId`       | sesión                               | `community-messaging`    |
| `DELETE /community/conversations/:conversationId/messages/:messageId`      | sesión                               | `community-messaging`    |
| `POST /community/conversations/:conversationId/read`                       | sesión                               | `community-messaging`    |
| `PATCH /community/conversations/:conversationId/participant`               | sesión                               | `community-messaging`    |
| `POST /community/conversations/:conversationId/pin`                        | sesión                               | `community-messaging`    |
| `DELETE /community/conversations/:conversationId/pin`                      | sesión                               | `community-messaging`    |
| `POST /community/conversations/contacts/search`                            | sesión                               | `community-messaging`    |
| `GET /community/conversations/:conversationId/attachments/:fileId/content` | sesión                               | `community-messaging`    |
| `GET /community/conversations`                                             | sesión                               | `community-messaging`    |
| `GET /community/conversations/:conversationId/messages`                    | sesión                               | `community-messaging`    |
| `GET /community/conversations/:conversationId/presence`                    | sesión                               | `community-messaging`    |
| `POST /community/reports`                                                  | sesión                               | `community-moderation`   |
| `POST /community/moderation/queue/:queueId/decision`                       | SECURITY_ADMIN                       | `community-moderation`   |
| `POST /community/moderation/decisions/:decisionId/appeal`                  | sesión                               | `community-moderation`   |
| `POST /community/moderation/appeals/:appealId/resolve`                     | SECURITY_ADMIN                       | `community-moderation`   |
| `GET /community/moderation/queue`                                          | SECURITY_ADMIN                       | `community-moderation`   |
| `GET /community/moderation/decisions/mine`                                 | sesión                               | `community-moderation`   |
| `GET /community/moderation/decisions`                                      | SECURITY_ADMIN                       | `community-moderation`   |
| `GET /community/moderation/appeals`                                        | SECURITY_ADMIN                       | `community-moderation`   |
| `POST /community/posts/:postId/polls`                                      | sesión                               | `community-polls`        |
| `POST /community/polls/:pollId/votes`                                      | sesión                               | `community-polls`        |
| `GET /community/polls/:pollId`                                             | sesión                               | `community-polls`        |
| `GET /public/posts`                                                        | pública                              | `community-public`       |
| `GET /public/posts/:postId/reactions`                                      | pública                              | `community-public`       |
| `GET /public/posts/:postId/comments`                                       | pública                              | `community-public`       |
| `GET /public/comments/:commentId/replies`                                  | pública                              | `community-public`       |
| `GET /public/search`                                                       | pública                              | `community-public`       |
| `GET /public/search/practitioners`                                         | pública                              | `community-public`       |
| `GET /public/search/organizations`                                         | pública                              | `community-public`       |
| `GET /public/search/diagnostic-units`                                      | pública                              | `community-public`       |
| `GET /public/search/insurers`                                              | pública                              | `community-public`       |
| `GET /public/search/pharmacies`                                            | pública                              | `community-public`       |
| `GET /public/search/medications`                                           | pública                              | `community-public`       |
| `GET /public/nearby`                                                       | pública                              | `community-public`       |
| `GET /public/profiles/:prefijo/:slug`                                      | pública                              | `community-public`       |
| `GET /public/profiles/:prefijo/:slug/reviews`                              | pública                              | `community-public`       |
| `GET /public/media/:id`                                                    | pública                              | `community-public`       |
| `GET /p/:slug`                                                             | pública                              | `community-public`       |
| `GET /o/:slug`                                                             | pública                              | `community-public`       |
| `GET /f/:slug`                                                             | pública                              | `community-public`       |
| `GET /l/:slug`                                                             | pública                              | `community-public`       |
| `GET /s/:slug`                                                             | pública                              | `community-public`       |
| `POST /community/profiles/:profileId/reviews`                              | sesión                               | `community-reviews`      |
| `GET /community/profiles/:profileId/reviews`                               | sesión                               | `community-reviews`      |
| `POST /community/profiles/:profileId/reviews/:reviewId/responses`          | sesión                               | `community-reviews`      |
| `POST /internal/community/search/reindex`                                  | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `community-search-index` |
| `GET /internal/community/search/health`                                    | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `community-search-index` |
| `POST /community/public-profiles`                                          | SECURITY_ADMIN                       | `community-social`       |
| `GET /community/profiles/me`                                               | sesión                               | `community-social`       |
| `PUT /community/profiles/me`                                               | sesión                               | `community-social`       |
| `GET /community/profiles/me/stats`                                         | sesión                               | `community-social`       |
| `POST /community/profiles/:profileId/posts`                                | sesión                               | `community-social`       |
| `POST /community/comments`                                                 | sesión                               | `community-social`       |
| `PUT /community/reactions`                                                 | sesión                               | `community-social`       |
| `POST /community/bookmarks`                                                | sesión                               | `community-social`       |
| `POST /community/follows`                                                  | sesión                               | `community-social`       |
| `POST /community/blocks`                                                   | sesión                               | `community-social`       |
| `DELETE /community/follows`                                                | sesión                               | `community-social`       |
| `DELETE /community/bookmarks`                                              | sesión                               | `community-social`       |
| `DELETE /community/blocks`                                                 | sesión                               | `community-social`       |
| `GET /community/profiles/by-slug/:slug`                                    | sesión                               | `community-social`       |
| `GET /community/profiles/:profileId/auto-reply`                            | sesión                               | `community-social`       |
| `PUT /community/profiles/:profileId/auto-reply`                            | sesión                               | `community-social`       |
| `GET /community/profiles/:profileId`                                       | sesión                               | `community-social`       |
| `GET /community/profiles/:profileId/posts`                                 | sesión                               | `community-social`       |
| `GET /community/posts/:postId`                                             | sesión                               | `community-social`       |
| `GET /community/posts/:postId/comments`                                    | sesión                               | `community-social`       |
| `GET /community/comments/media/:fileId/content`                            | sesión                               | `community-social`       |
| `GET /community/posts/:postId/reactions`                                   | sesión                               | `community-social`       |
| `GET /community/follows`                                                   | sesión                               | `community-social`       |
| `GET /community/bookmarks`                                                 | sesión                               | `community-social`       |
| `GET /community/blocks`                                                    | sesión                               | `community-social`       |
| `GET /community/feed`                                                      | sesión                               | `community-timeline`     |
| `GET /community/notifications`                                             | sesión                               | `community-timeline`     |
| `GET /community/topics`                                                    | sesión                               | `community-topics`       |
| `POST /internal/community/verification/badges`                             | SECURITY_ADMIN                       | `community-verification` |
| `POST /internal/community/verification/badges/:targetId/revoke`            | SECURITY_ADMIN                       | `community-verification` |
| `POST /internal/community/verification/badges/expire-sweep`                | SYSTEM, SECURITY_ADMIN               | `community-verification` |
| `POST /patients/me/reviews`                                                | PATIENT                              | `patient-reviews`        |

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

- Foros (`community.groups`): `visibility_concept_id` guarda el público autorizado
  (ORG-FOR-002, DOC-SOC-015). `PUBLIC` es el público general y `PRIVATE`/`SECRET` el ingreso por
  invitación o aprobación; `VERIFIED_DOCTORS` (profesional con sello de matrícula vigente),
  `ORGANIZATION_STAFF` (membresía activa en la organización del foro) y `ATTENDED_PATIENTS`
  (paciente con una atención terminada en esa organización) restringen el foro a su público. Se
  decide en el servidor con la sesión: quien no pertenece al público recibe el mismo 404 que un id
  inexistente en la ficha, el padrón, el muro, el alta y el directorio, y quien pertenece entra
  activo (no hay cola de aprobación). Un foro de público autorizado sólo lo abre quien pertenece
  a ese público. La plataforma (`SECURITY_ADMIN`, `SUPERADMIN`, `SYSTEM`) los alcanza para moderar.
- Una aseguradora (organización activa de tipo `PAYER`, leída de `directory.tenants` y no del
  claim `tenantTypes`) no crea foros ni inicia debates (ORG-FOR-001, DOC-SOC-010): `POST
/community/groups` y una publicación raíz en el muro responden 403
  (`INSURER_CANNOT_CREATE_GROUP`, `INSURER_CANNOT_START_DEBATE`). Responder en un debate
  existente no se restringe; la organización médica sí puede.
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

El reparto es siempre _push_, sin umbral híbrido push/pull para autores con
muchísimos seguidores; el tope de seguidores por pasada acota el costo.

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

La revisión ejecutó `corepack yarn test src/modules/community --runInBand --silent`: 41 suites y 616 pruebas aprobadas, con dos advertencias JSON preexistentes.

## Bandeja del equipo de apoyo

Rutas (sin tenant activo; la organización sale de la conversación o del vínculo, nunca del cuerpo):
`GET /me/support-inbox?tenantId&status&doctor`, `GET /me/support-inbox/:conversationId?tenantId`,
`POST /community/conversations/:id/assignment`, `GET|POST /community/conversations/:id/internal-notes`,
`GET /me/support-reply-templates?tenantId` y, para la administración, `GET|POST|PATCH /org/reply-templates`.

**Formas**

- Lista: `{ items, doctors, count }`. Cada ítem trae `conversationId`, `organizationId`/`tenantId`, `organizationName`,
  `practitionerProfileId`, `practitionerName`, `patientLabel`, `status`, `assignedUserId`, `assignedToName`, `assignedToMe`,
  `slaDueAt`, `lastMessageAt`, `lastPatientMessage`, `lastMessagePreview`, `isClinical` (y `clinicalSuspected`, el mismo valor).
  `isClinical` es «hay un mensaje clínico del paciente sin responder por el doctor o su equipo»; si el último mensaje del
  paciente parece clínico, `lastPatientMessage` y `lastMessagePreview` salen con el marcador «Contenido clínico oculto…»
  (`CLINICAL_CONTENT_HIDDEN_TEXT`) en lugar del texto. `doctors[]` va en el orden estable de
  `orderSupportDoctors` (nombre sin acentos, luego perfil), con `id` = asignación de rol del doctor (el de la agenda),
  `practitionerProfileId`, `name`/`displayName` y `specialty`. Con `tenantId`: 403 sin vínculo vivo en esa organización y 403
  con el motivo si no hay doctores a quienes atender; sin `tenantId` reúne las organizaciones con vínculo vivo.
- Detalle: `messages[]` con `from`, `bodyText`, `isClinical`, `contentHidden?`, `authoredByName`, `disclosureShown`.
  **El texto clínico solo se lee con acceso clínico temporal aprobado**: mientras `patientContext.clinicalAccess` no sea
  `APPROVED` (vigente), los mensajes que escribió el propio doctor (no su equipo en su nombre) y los del paciente que parecen
  clínicos salen con `bodyText = «Contenido clínico oculto: requiere acceso clínico temporal aprobado.»`, `isClinical: true` y
  `contentHidden: true`, sin el texto; con `APPROVED` salen completos. Lo administrativo y lo que escribió el equipo se
  lee siempre. Además: `notes[]`; `replyAllowed` y `replyBlockedReason`; `replyDisclosure` (`SHOW`/`HIDE`); `assignableTo[]` (quienes pueden responder por ese doctor);
  `patientContext` (`reasonLabel`, `clinicalAccess` `NONE|PENDING|APPROVED`, `delegateId`, `patientProfileId`,
  `requestedPermissionId`). Sin acceso, 404 igual que una inexistente.
- Asignación: dos formas válidas. Con `action` (`TAKE`, `ASSIGN`, `SET_STATUS`; `TAKE` deriva al doctor si hay un mensaje
  clínico pendiente) o con el estado final `{ practitionerProfileId?, assignedUserId?, status }` (sin `assignedUserId` asigna a
  quien pide; no deriva por su cuenta). 409 con `details.assignedToName` si otra persona la tiene; 422 si se asigna a quien no
  puede atender a ese doctor. Responde `{ conversationId, status, assignedUserId, assignedToName, slaDueAt, referredToDoctor }`.

**Reglas**

- La organización de una conversación es la del **perfil público del doctor**. Ve la conversación quien tiene vínculo vivo, la
  aceptación del doctor **con** `may_reply_on_behalf` y un `messages.reply_on_behalf` que cubre al doctor
  (`SupportAccessPolicy.inboxDoctorsOfTenant`, la misma regla que `canReplyOnBehalf` y `replyersOfDoctor`): una aceptación solo
  para la agenda no abre la bandeja del doctor. Por eso `replyAllowed` es siempre `true` en lo que se ve y `assignableTo` es
  la misma lista de quienes ven la conversación.
- Estados `NEW → TAKEN → WAITING_DOCTOR → RESOLVED` (`domain/support-inbox.rules.ts`); plazo `SUPPORT_INBOX_SLA_HOURS`
  (24 h). **Una resuelta se reabre sola (`NEW`, sin dueña) cuando escribe el paciente** (`CommunitySupportReplyService`).
- **Qué id guarda cada campo.** `direct_messages.on_behalf_of_profile_id` (entidad `onBehalfOfProfileId`, y lo que devuelven
  los DTO de lectura) guarda el **perfil profesional** del doctor (`profiles.health_practitioner_profiles.profile_id`). El
  cuerpo del `POST` lleva en `onBehalfOfProfileId` el **perfil público** (igual a `senderProfileId`) y el servicio lo resuelve
  al profesional antes de escribir. El `payload_json` del correo de respuesta conserva el público y por eso se llama
  `onBehalfOfPublicProfileId`.
- **Responder en nombre del doctor** (`POST /community/conversations/:id/messages` con `onBehalfOfProfileId`): 403 sin permiso
  o sin aceptación; 404 `CONVERSATION_NOT_FOUND` si la conversación no está en la bandeja de ese doctor y organización (que el
  perfil del doctor participe no basta: `guardReply` repite la lectura de la bandeja); 409 si otra persona tiene la conversación; 422 `CLINICAL_REQUIRES_DERIVATION` (también en
  `details.reason`) si hay un mensaje clínico del paciente sin derivar; 422 `SUPPORT_CLINICAL_CONTENT` para el texto saliente
  clínico. Responder es hacerse cargo de la conversación.
- **Canal de correo**: `channels: ['CHAT','EMAIL']` en ese mismo POST. Crea una solicitud contra el canal `EMAIL` de
  mensajería (`notification_requests`; la entrega es del worker, sin proveedor queda pendiente) con el doctor como remitente
  visible (`fromName`; la dirección es la de la plataforma), «Respondido por su equipo» solo si el doctor lo dejó en `SHOW`,
  pie administrativo, organización del doctor, respeto de las preferencias del paciente y la autora real en
  `authorized_by_user_id` y `payload_json`. El correo no nombra a la autora. El `payload_json` lleva el doctor como
  `onBehalfOfPublicProfileId`: el id de su **perfil público** (`community.public_profiles`), no el de la columna
  `direct_messages.on_behalf_of_profile_id`. Respuesta: `email: { queued, requestId?,
skippedReason? }`. Solo con `onBehalfOfProfileId`. El destino es solo una dirección **verificada** (verificación de correo
  consumida, `SupportInboxRepository.emailOfUser`) de una cuenta con credencial activa: una credencial revocada o un correo
  escrito y nunca confirmado no cuentan; sin dirección verificada no se encola, `skippedReason` dice «La cuenta del paciente no
  tiene un correo verificado con credencial activa» y queda un registro solo con ids. Un fallo al encolar se registra con tipo,
  código y un mensaje saneado, nunca con el error completo del driver.
- **Lo que ven el paciente y el doctor en el chat de siempre**: `GET /community/conversations/:id/messages` agrega
  `repliedByTeam` (lo que el doctor decidió mostrar, sin nombre) y `teamAuthorName` (solo el doctor dueño del perfil);
  `GET /community/conversations` agrega `awaitingDoctor` solo para el doctor (`CommunitySupportTeamViewService`). La autora
  real, la delegación y las notas internas no salen en el DTO del paciente ni en el payload del socket.
- **Solo mensajes administrativos**: heurística de palabras (`delegated_access/domain/clinical-content.ts`), configurable con
  `SUPPORT_CLINICAL_KEYWORDS` (reemplaza) y `SUPPORT_CLINICAL_KEYWORDS_EXTRA` (suma). Las respuestas preparadas tampoco pueden
  ser clínicas (título ni texto), su doctor dueño debe ser de la organización y la respuesta expone `version`
  (`row_version`); `PATCH` con `expectedVersion` desactualizada responde 409. No hay historial de versiones de una respuesta.
- **RLS**: las rutas `me/*` no tienen organización activa. Con `RLS_ENFORCE=true` cada lectura corre en una transacción y
  entra a UNA organización con vínculo vivo a la vez (`withPersonScope`, en `delegated_access/services/tenant-context.ts`);
  las conversaciones y mensajes, que no llevan organización anclada, se leen acotados por los doctores ya autorizados.
  Probado contra Postgres como `mantra_app` en `test/integration/support-me-rls.int-spec.ts` (`SUPPORT_RLS_TEST=1`).
- Las notas internas se anclan a la organización de la conversación. `effective_support_access` usa el mismo criterio; un
  doctor dado de baja o vencido deja de ser «doctor de la organización».
