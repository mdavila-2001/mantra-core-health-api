<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `community`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 81 (75 en el contrato, 6 sólo en el código)
- **Riesgo:** ALTO 24 · MEDIO 7 · BAJO 50
- **Tablas distintas que tocan:** 57
- **Respuestas de error y detalle contractual:** `openapi/endpoints/community.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/` | Entero de un parámetro de consulta, o `undefined`. Un valor no numérico se ignora en vez de dar 400: el contrato promete que `limit` fuera de rango se **recorta**, y «abc» es tan fuera de rango como 9999. La única excepción son las coordenadas de `nearby`, que sí fallan. | BAJO | 0 | sesión (sin roles) |
| 2 | DESCONOCIDO | `/` | Decimal de un parámetro de consulta, o `undefined`. | BAJO | 0 | sesión (sin roles) |
| 3 | DESCONOCIDO | `/` | Booleano de un parámetro; sólo `'true'` afirma. | BAJO | 0 | sesión (sin roles) |
| 4 | DELETE | `/community/blocks` | Levantar un bloqueo | ALTO | 3 | sesión (sin roles) |
| 5 | GET | `/community/blocks` | Bloqueos emitidos por un perfil | BAJO | 2 | sesión (sin roles) |
| 6 | POST | `/community/blocks` | Bloquear a un usuario | ALTO | 6 | sesión (sin roles) |
| 7 | DELETE | `/community/bookmarks` | Quitar un marcador | ALTO | 3 | sesión (sin roles) |
| 8 | GET | `/community/bookmarks` | Marcadores guardados por un perfil | BAJO | 2 | sesión (sin roles) |
| 9 | POST | `/community/bookmarks` | Guardar un bookmark en una colección | ALTO | 3 | sesión (sin roles) |
| 10 | POST | `/community/comments` | Comentar (hilo anidado) con contadores | ALTO | 5 | sesión (sin roles) |
| 11 | GET | `/community/conversations` | Conversaciones activas de un perfil | BAJO | 4 | sesión (sin roles) |
| 12 | POST | `/community/conversations` | Crear una conversación con participantes | ALTO | 4 | sesión (sin roles) |
| 13 | GET | `/community/conversations/{conversationId}/messages` | Mensajes de una conversación | BAJO | 5 | sesión (sin roles) |
| 14 | POST | `/community/conversations/{conversationId}/messages` | Enviar un mensaje directo en la conversación | ALTO | 16 | sesión (sin roles) |
| 15 | POST | `/community/conversations/{conversationId}/read` | Marcar mensajes como leídos (recibos) | ALTO | 5 | sesión (sin roles) |
| 16 | GET | `/community/feed` | Timeline de un perfil | BAJO | 7 | sesión (sin roles) |
| 17 | DELETE | `/community/follows` | Dejar de seguir un objeto social | ALTO | 3 | sesión (sin roles) |
| 18 | GET | `/community/follows` | Seguimientos activos de un perfil | BAJO | 2 | sesión (sin roles) |
| 19 | POST | `/community/follows` | Seguir un objeto social | ALTO | 4 | sesión (sin roles) |
| 20 | GET | `/community/groups` | Grupos de una organización | BAJO | 1 | sesión (sin roles) |
| 21 | POST | `/community/groups` | Crear un grupo/comunidad | ALTO | 5 | sesión (sin roles) |
| 22 | GET | `/community/groups/{groupId}` | Ficha de un grupo | BAJO | 3 | sesión (sin roles) |
| 23 | GET | `/community/groups/{groupId}/members` | Integrantes de un grupo | BAJO | 3 | sesión (sin roles) |
| 24 | POST | `/community/groups/{groupId}/members` | Unirse a un grupo / comunidad | ALTO | 5 | sesión (sin roles) |
| 25 | PATCH | `/community/groups/{groupId}/members/{memberId}` | Aprobar/rechazar un alta o cambiar el rol | ALTO | 9 | sesión (sin roles) |
| 26 | DELETE | `/community/groups/{groupId}/members/{memberProfileId}` | Salir del grupo o dar de baja a un integrante | ALTO | 5 | sesión (sin roles) |
| 27 | GET | `/community/groups/{groupId}/posts` | Muro de un grupo | BAJO | 4 | sesión (sin roles) |
| 28 | POST | `/community/groups/{groupId}/posts` | Publicar en el muro del grupo | ALTO | 11 | sesión (sin roles) |
| 29 | GET | `/community/moderation/appeals` | Apelaciones presentadas, con su decisión | BAJO | 2 | SECURITY_ADMIN |
| 30 | POST | `/community/moderation/appeals/{appealId}/resolve` | Resolver una apelación de moderación | MEDIO | 5 | SECURITY_ADMIN |
| 31 | GET | `/community/moderation/decisions` | Decisiones de moderación tomadas | BAJO | 1 | SECURITY_ADMIN |
| 32 | POST | `/community/moderation/decisions/{decisionId}/appeal` | Apelar una decisión de moderación | ALTO | 6 | sesión (sin roles) |
| 33 | GET | `/community/moderation/queue` | Cola de moderación con filtros y cursor | BAJO | 2 | SECURITY_ADMIN |
| 34 | POST | `/community/moderation/queue/{queueId}/decision` | Resolver moderación (decisión + strike) | MEDIO | 6 | SECURITY_ADMIN |
| 35 | GET | `/community/notifications` | Notificaciones sociales de un perfil | BAJO | 2 | sesión (sin roles) |
| 36 | GET | `/community/polls/{pollId}` | Encuesta con opciones, recuentos y voto propio | BAJO | 7 | sesión (sin roles) |
| 37 | POST | `/community/polls/{pollId}/votes` | Votar en una encuesta | ALTO | 6 | sesión (sin roles) |
| 38 | GET | `/community/posts/{postId}` | Publicación con media, hashtags y menciones | BAJO | 10 | sesión (sin roles) |
| 39 | GET | `/community/posts/{postId}/comments` | Comentarios de una publicación (hilo anidado) | BAJO | 5 | sesión (sin roles) |
| 40 | POST | `/community/posts/{postId}/polls` | Crear una encuesta con opciones sobre un post | ALTO | 3 | sesión (sin roles) |
| 41 | GET | `/community/posts/{postId}/reactions` | Reacciones de una publicación, agrupadas por tipo | BAJO | 5 | sesión (sin roles) |
| 42 | GET | `/community/profiles/{profileId}` | Ficha de un perfil público | BAJO | 4 | sesión (sin roles) |
| 43 | GET | `/community/profiles/{profileId}/posts` | Publicaciones de un perfil | BAJO | 6 | sesión (sin roles) |
| 44 | POST | `/community/profiles/{profileId}/posts` | Publicar un post con hashtags, media y menciones | ALTO | 10 | sesión (sin roles) |
| 45 | GET | `/community/profiles/{profileId}/reviews` | Reviews publicadas de un perfil | BAJO | 4 | sesión (sin roles) |
| 46 | POST | `/community/profiles/{profileId}/reviews` | Publicar una review verificada de servicio | ALTO | 6 | sesión (sin roles) |
| 47 | POST | `/community/profiles/{profileId}/reviews/{reviewId}/responses` | Responder una reseña de la propia vitrina | ALTO | 4 | sesión (sin roles) |
| 48 | GET | `/community/profiles/by-slug/{slug}` | Ficha de un perfil público por su slug | BAJO | 4 | sesión (sin roles) |
| 49 | GET | `/community/profiles/me` | Consultar la vitrina pública propia | BAJO | 1 | sesión (sin roles) |
| 50 | PUT | `/community/profiles/me` | Crear o actualizar la vitrina pública propia | ALTO | 4 | sesión (sin roles) |
| 51 | GET | `/community/profiles/me/stats` | Estadísticas de la vitrina pública propia | BAJO | 1 | sesión (sin roles) |
| 52 | POST | `/community/public-profiles` | Crear un perfil público (bootstrap del grafo social) | MEDIO | 1 | SECURITY_ADMIN |
| 53 | PUT | `/community/reactions` | Reaccionar a contenido (upsert una reacción por actor/objeto) | ALTO | 4 | sesión (sin roles) |
| 54 | POST | `/community/reports` | Reportar contenido y encolar moderación | ALTO | 3 | sesión (sin roles) |
| 55 | GET | `/community/topics` | Temas de la comunidad | BAJO | 1 | sesión (sin roles) |
| 56 | GET | `/f/{slug}` | Ficha pública de una farmacia | BAJO | 14 | pública |
| 57 | GET | `/internal/community/feed/pending` | Publicaciones publicadas sin fan-out | BAJO | 3 | SYSTEM, SECURITY_ADMIN |
| 58 | POST | `/internal/community/feed/rebuild` | Generar feed (fan-out y ranking) | MEDIO | 2 | SYSTEM, SECURITY_ADMIN |
| 59 | GET | `/internal/community/search/health` | Estado del índice del directorio público | BAJO | 1 | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN |
| 60 | POST | `/internal/community/search/reindex` | Reindexar el directorio público | BAJO | 9 | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN |
| 61 | POST | `/internal/community/verification/badges` | Emitir un sello a mano (auditado) | MEDIO | 6 | SECURITY_ADMIN |
| 62 | POST | `/internal/community/verification/badges/{targetId}/revoke` | Bajar los sellos de un sujeto (auditado) | MEDIO | 5 | SECURITY_ADMIN |
| 63 | POST | `/internal/community/verification/badges/expire-sweep` | Bajar los sellos cuya vigencia ya venció | MEDIO | 5 | SYSTEM, SECURITY_ADMIN |
| 64 | GET | `/l/{slug}` | Ficha pública de un laboratorio | BAJO | 14 | pública |
| 65 | GET | `/o/{slug}` | Ficha pública de una organización | BAJO | 14 | pública |
| 66 | GET | `/p/{slug}` | Ficha pública de un profesional | BAJO | 14 | pública |
| 67 | GET | `/public/comments/{commentId}/replies` | Las respuestas de un comentario (AC-01-12, «Ver N respuestas»). Ruta propia y no un parámetro de la anterior: son dos recursos paginados distintos y el desplegable abre varios hilos a la vez. La justificación larga está en `CommunityPublicService.commentReplies`. | BAJO | 3 | pública |
| 68 | GET | `/public/media/{id}` | Servir una imagen pública (avatar, portada o post) | BAJO | 5 | pública |
| 69 | GET | `/public/nearby` | Prestadores cercanos, en línea recta | BAJO | 7 | pública |
| 70 | GET | `/public/posts` | Últimas publicaciones de todos los profesionales | BAJO | 5 | pública |
| 71 | GET | `/public/posts/{postId}/comments` | El hilo de comentarios raíz de una publicación (AC-01-11, AC-01-12). | BAJO | 3 | pública |
| 72 | GET | `/public/posts/{postId}/reactions` | Quién reaccionó a una publicación (AC-01-9). Va inmediatamente detrás de `public/posts` y comparte todo lo suyo: es `@Public()`, cae bajo el mismo límite de 60 por minuto por IP que declara la clase, se envuelve en `items`/`nextCursor`/`totalHint`/`generatedAt` y gana su `ETag` y su `Cache-Control` de `PublicCacheInterceptor`, que actúa sobre todo `GET` marcado `@Public()`. `ParseUUIDPipe` rechaza con 400 lo que no es un uuid antes de tocar la base —igual que en `public/media/:id`—; el resto de los «no» son un 404 indistinguible del «no existe». | BAJO | 3 | pública |
| 73 | GET | `/public/profiles/{prefijo}/{slug}` | Ficha pública por prefijo de vertical | BAJO | 14 | pública |
| 74 | GET | `/public/search` | Buscador público unificado | BAJO | 12 | pública |
| 75 | GET | `/public/search/diagnostic-units` | Laboratorios y centros de diagnóstico | BAJO | 12 | pública |
| 76 | GET | `/public/search/insurers` | Aseguradoras en el directorio público | BAJO | 12 | pública |
| 77 | GET | `/public/search/medications` | Medicamentos ofertados públicamente | BAJO | 12 | pública |
| 78 | GET | `/public/search/organizations` | Organizaciones en el directorio público | BAJO | 12 | pública |
| 79 | GET | `/public/search/pharmacies` | Farmacias en el directorio público | BAJO | 12 | pública |
| 80 | GET | `/public/search/practitioners` | Profesionales en el directorio público | BAJO | 12 | pública |
| 81 | GET | `/s/{slug}` | Ficha pública de una aseguradora | BAJO | 14 | pública |

---

## 1. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Entero de un parámetro de consulta, o `undefined`. Un valor no numérico se ignora en vez de dar 400: el contrato promete que `limit` fuera de rango se **recorta**, y «abc» es tan fuera de rango como 9999. La única excepción son las coordenadas de `nearby`, que sí fallan.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.toInt` — `src/modules/community/controllers/community-public.controller.ts:460`

### Qué es y para qué sirve (negocio)

Entero de un parámetro de consulta, o `undefined`. Un valor no numérico se ignora en vez de dar 400: el contrato promete que `limit` fuera de rango se **recorta**, y «abc» es tan fuera de rango como 9999. La única excepción son las coordenadas de `nearby`, que sí fallan. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `CommunityPublicController.toInt` (src/modules/community/controllers/community-public.controller.ts:460). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-public.controller.ts:460` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:460` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/community/controllers/community-public.controller.ts:460`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `number | undefined`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 2. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Decimal de un parámetro de consulta, o `undefined`.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.toFloat` — `src/modules/community/controllers/community-public.controller.ts:467`

### Qué es y para qué sirve (negocio)

Decimal de un parámetro de consulta, o `undefined`. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `CommunityPublicController.toFloat` (src/modules/community/controllers/community-public.controller.ts:467). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-public.controller.ts:467` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:467` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/community/controllers/community-public.controller.ts:467`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `number | undefined`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 3. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Booleano de un parámetro; sólo `'true'` afirma.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.toBool` — `src/modules/community/controllers/community-public.controller.ts:474`

### Qué es y para qué sirve (negocio)

Booleano de un parámetro; sólo `'true'` afirma. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `CommunityPublicController.toBool` (src/modules/community/controllers/community-public.controller.ts:474). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-public.controller.ts:474` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:474` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/community/controllers/community-public.controller.ts:474`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `boolean | undefined`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 4. DELETE /community/blocks

- **Origen:** CONTRATO
- **Nombre:** Levantar un bloqueo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.unblock` — `src/modules/community/controllers/community-social.controller.ts:245`

### Qué es y para qué sirve (negocio)

Levantar un bloqueo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/blocks` la atiende `CommunitySocialController.unblock` (src/modules/community/controllers/community-social.controller.ts:245). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.unblock`. Actualiza community.user_blocks. Lee community.public_profiles, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:245` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | blockerProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | blockedProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.unblock → CommunitySocialService.unblock → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.user_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.unblock → CommunitySocialService.unblock | `src/modules/community/services/community-social.service.ts:952` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.unblock → CommunitySocialService.unblock → BlocksRepository.findByPair | `src/modules/community/repositories/blocks.repository.ts:48` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `blockerProfileId` | query | Sí | `string` | Perfil que bloqueó |
| `blockedProfileId` | query | Sí | `string` | Perfil bloqueado |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SocialRemovalResponseDto>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:144` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. GET /community/blocks

- **Origen:** CONTRATO
- **Nombre:** Bloqueos emitidos por un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listBlocks` — `src/modules/community/controllers/community-social.controller.ts:380`

### Qué es y para qué sirve (negocio)

Bloqueos emitidos por un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/blocks` la atiende `CommunitySocialController.listBlocks` (src/modules/community/controllers/community-social.controller.ts:380). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listBlocks`. Lee community.public_profiles, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:380` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listBlocks → CommunitySocialReadService.listBlocks → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.listBlocks → CommunitySocialReadService.listBlocks → BlocksRepository.listByBlocker | `src/modules/community/repositories/blocks.repository.ts:122` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BlockPageDto>` · DTO `BlockPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BlockListItemDto>` | Sí | — | — | Bloqueos de la página. | `src/modules/community/dto/read-social.dto.ts:475` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del bloqueo. | `src/modules/community/dto/read-social.dto.ts:456` |
| `items[].blockedProfileId` | `string` | Sí | formato uuid | — | Perfil bloqueado. | `src/modules/community/dto/read-social.dto.ts:460` |
| `items[].reasonConceptId` | `string` | No | formato uuid; admite null | — | Concept id del motivo declarado. | `src/modules/community/dto/read-social.dto.ts:464` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se bloqueó. | `src/modules/community/dto/read-social.dto.ts:468` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-social.dto.ts:479` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:483` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:487` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /community/blocks

- **Origen:** CONTRATO
- **Nombre:** Bloquear a un usuario
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.block` — `src/modules/community/controllers/community-social.controller.ts:205`

### Qué es y para qué sirve (negocio)

Bloquear a un usuario. Caso de uso UC-19-14: Bloquea a un usuario. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:26`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/blocks` la atiende `CommunitySocialController.block` (src/modules/community/controllers/community-social.controller.ts:205). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateBlockDto` (3 campos, 2 obligatorios). Delega en `CommunitySocialService.block`. Crea filas en community.user_blocks. Actualiza community.social_follows, community.user_blocks. Lee community.public_profiles, community.social_follows, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:205` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.social_follows` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.block → CommunitySocialService.block | `src/modules/community/services/community-social.service.ts:821` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → FollowsRepository.findMutualBetween | `src/modules/community/repositories/follows.repository.ts:161` |
| `community.user_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.block → CommunitySocialService.block | `src/modules/community/services/community-social.service.ts:795` |
| `community.user_blocks` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → BlocksRepository.create | `src/modules/community/repositories/blocks.repository.ts:150` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → BlocksRepository.findByPair | `src/modules/community/repositories/blocks.repository.ts:48` |

### Cuerpo — DTO `CreateBlockDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `blockerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que bloquea | `src/modules/community/dto/block.dto.ts:11` |
| `blockedProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil bloqueado | `src/modules/community/dto/block.dto.ts:18` |
| `reason` | `string` | No | valores: HARASSMENT, SPAM, OTHER | `@IsOptional()` `@IsIn(['HARASSMENT', 'SPAM', 'OTHER'])` | Razón del bloqueo | `src/modules/community/dto/block.dto.ts:29` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "blockerProfileId": "00000000-0000-4000-8000-000000000001",
  "blockedProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "blockerProfileId": "00000000-0000-4000-8000-000000000001",
  "blockedProfileId": "00000000-0000-4000-8000-000000000001",
  "reason": "HARASSMENT"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:212` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:115` |

### Flujos

_Se completa en la fase de flujos._

---

## 7. DELETE /community/bookmarks

- **Origen:** CONTRATO
- **Nombre:** Quitar un marcador
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.unbookmark` — `src/modules/community/controllers/community-social.controller.ts:234`

### Qué es y para qué sirve (negocio)

Quitar un marcador. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/bookmarks` la atiende `CommunitySocialController.unbookmark` (src/modules/community/controllers/community-social.controller.ts:234). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.unbookmark`. Borra de community.bookmarks. Lee community.bookmarks, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:234` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | bookmarkableType (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | bookmarkableRefId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.bookmarks` | BORRA | BORRA | POR_TIPO | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark | `src/modules/community/services/community-social.service.ts:909` |
| `community.bookmarks` | LEE | LEE | DIRECTA | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark → BookmarksRepository.findByProfileTarget | `src/modules/community/repositories/bookmarks.repository.ts:50` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | Perfil dueño del marcador |
| `bookmarkableType` | query | Sí | `string` | Tipo de objeto |
| `bookmarkableRefId` | query | Sí | `string` | Id del objeto |
| `collectionName` | query | No | `string` | Colección a la que acotar el borrado |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SocialRemovalResponseDto>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:137` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. GET /community/bookmarks

- **Origen:** CONTRATO
- **Nombre:** Marcadores guardados por un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listBookmarks` — `src/modules/community/controllers/community-social.controller.ts:363`

### Qué es y para qué sirve (negocio)

Marcadores guardados por un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/bookmarks` la atiende `CommunitySocialController.listBookmarks` (src/modules/community/controllers/community-social.controller.ts:363). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listBookmarks`. Lee community.bookmarks, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:363` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | collectionName (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.bookmarks` | LEE | LEE | DIRECTA | CommunitySocialController.listBookmarks → CommunitySocialReadService.listBookmarks → BookmarksRepository.listByProfilePage | `src/modules/community/repositories/bookmarks.repository.ts:74` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listBookmarks → CommunitySocialReadService.listBookmarks → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | — |
| `collectionName` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BookmarkPageDto>` · DTO `BookmarkPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<BookmarkListItemDto>` | Sí | — | — | Marcadores de la página. | `src/modules/community/dto/read-social.dto.ts:437` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del marcador. | `src/modules/community/dto/read-social.dto.ts:414` |
| `items[].bookmarkableTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de contenido guardado. | `src/modules/community/dto/read-social.dto.ts:418` |
| `items[].bookmarkableRefId` | `string` | Sí | formato uuid | — | Id del contenido guardado. | `src/modules/community/dto/read-social.dto.ts:422` |
| `items[].collectionName` | `string` | No | admite null | — | Colección en la que se guardó. | `src/modules/community/dto/read-social.dto.ts:426` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se guardó. | `src/modules/community/dto/read-social.dto.ts:430` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-social.dto.ts:441` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:445` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:449` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /community/bookmarks

- **Origen:** CONTRATO
- **Nombre:** Guardar un bookmark en una colección
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.bookmark` — `src/modules/community/controllers/community-social.controller.ts:183`

### Qué es y para qué sirve (negocio)

Guardar un bookmark en una colección. Caso de uso UC-19-04: Guarda bookmark en colección. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/bookmarks` la atiende `CommunitySocialController.bookmark` (src/modules/community/controllers/community-social.controller.ts:183). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateBookmarkDto` (4 campos, 3 obligatorios). Delega en `CommunitySocialService.bookmark`. Crea filas en community.bookmarks. Lee community.bookmarks, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:183` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.bookmarks` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → BookmarksRepository.create | `src/modules/community/repositories/bookmarks.repository.ts:100` |
| `community.bookmarks` | LEE | LEE | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → BookmarksRepository.findByProfileTarget | `src/modules/community/repositories/bookmarks.repository.ts:50` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |

### Cuerpo — DTO `CreateBookmarkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que guarda | `src/modules/community/dto/bookmark.dto.ts:11` |
| `bookmarkableType` | `string` | Sí | valores: POST, COMMENT, REVIEW | `@IsIn(['POST', 'COMMENT', 'REVIEW'])` | Tipo de objeto | `src/modules/community/dto/bookmark.dto.ts:21` |
| `bookmarkableRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del objeto | `src/modules/community/dto/bookmark.dto.ts:28` |
| `collectionName` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Colección a la que se añade | `src/modules/community/dto/bookmark.dto.ts:40` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "bookmarkableType": "POST",
  "bookmarkableRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "bookmarkableType": "POST",
  "bookmarkableRefId": "00000000-0000-4000-8000-000000000001",
  "collectionName": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:97` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /community/comments

- **Origen:** CONTRATO
- **Nombre:** Comentar (hilo anidado) con contadores
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.createComment` — `src/modules/community/controllers/community-social.controller.ts:159`

### Qué es y para qué sirve (negocio)

Comentar (hilo anidado) con contadores. Caso de uso UC-19-02: Comenta (hilo anidado) con contadores. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/comments` la atiende `CommunitySocialController.createComment` (src/modules/community/controllers/community-social.controller.ts:159). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateCommentDto` (9 campos, 4 obligatorios). Delega en `CommunitySocialService.createComment`. Crea filas en community.comments, community.mentions. Actualiza community.comments. Lee community.comments, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.createComment → CommunitySocialService.createComment | `src/modules/community/services/community-social.service.ts:599` |
| `community.comments` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommentsRepository.create | `src/modules/community/repositories/comments.repository.ts:184` |
| `community.comments` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommentsRepository.findById | `src/modules/community/repositories/comments.repository.ts:63` |
| `community.mentions` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → PostsRepository.createMention | `src/modules/community/repositories/posts.repository.ts:410` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |

### Cuerpo — DTO `CreateCommentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil autor del comentario | `src/modules/community/dto/comment.dto.ts:23` |
| `commentableType` | `string` | Sí | valores: POST, COMMENT, REVIEW | `@IsIn(['POST', 'COMMENT', 'REVIEW'])` | Tipo de contenido comentado | `src/modules/community/dto/comment.dto.ts:33` |
| `commentableRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del contenido comentado | `src/modules/community/dto/comment.dto.ts:40` |
| `parentCommentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Comentario padre (para respuesta anidada) | `src/modules/community/dto/comment.dto.ts:51` |
| `bodyText` | `string` | Sí | longitud mínima 1; longitud máxima 3000 | `@IsString()` `@MinLength(1)` `@MaxLength(3000)` | Texto del comentario | `src/modules/community/dto/comment.dto.ts:60` |
| `mentions` | `array<MentionInputDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => MentionInputDto)` | — | `src/modules/community/dto/comment.dto.ts:71` |
| `mentions[].mentionedProfileId` | `string` | No | formato uuid | `@IsUUID()` | Perfil mencionado | `src/modules/community/dto/post.dto.ts:68` |
| `mentions[].offsetStart` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/community/dto/post.dto.ts:77` |
| `mentions[].offsetEnd` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/community/dto/post.dto.ts:86` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "commentableType": "POST",
  "commentableRefId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "commentableType": "POST",
  "commentableRefId": "00000000-0000-4000-8000-000000000001",
  "parentCommentId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo",
  "mentions": [
    {
      "mentionedProfileId": "00000000-0000-4000-8000-000000000001",
      "offsetStart": 1,
      "offsetEnd": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<CommentResponseDto>` · DTO `CommentResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:84` |
| `rootCommentId` | `string` | Sí | formato uuid; admite null | — | Identificador asociado a root comment. | `src/modules/community/dto/responses.dto.ts:90` |
| `threadDepth` | `number` | Sí | — | — | Valor de thread depth mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:96` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:245` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:74` |

### Flujos

_Se completa en la fase de flujos._

---

## 11. GET /community/conversations

- **Origen:** CONTRATO
- **Nombre:** Conversaciones activas de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.listConversations` — `src/modules/community/controllers/community-messaging.controller.ts:90`

### Qué es y para qué sirve (negocio)

Conversaciones activas de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/conversations` la atiende `CommunityMessagingController.listConversations` (src/modules/community/controllers/community-messaging.controller.ts:90). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingReadService.listConversations`. Lee community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → ConversationsRepository.listActiveParticipationsOf | `src/modules/community/repositories/conversations.repository.ts:312` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → ConversationsRepository.listConversationsByIds | `src/modules/community/repositories/conversations.repository.ts:331` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → ConversationsRepository.findLastMessage | `src/modules/community/repositories/conversations.repository.ts:451` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConversationPageDto>` · DTO `ConversationPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ConversationListItemDto>` | Sí | — | — | Conversaciones de la página. | `src/modules/community/dto/read-messaging.dto.ts:89` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la conversación. | `src/modules/community/dto/read-messaging.dto.ts:48` |
| `items[].conversationTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de conversación (directa, grupal). | `src/modules/community/dto/read-messaging.dto.ts:52` |
| `items[].groupId` | `string` | No | formato uuid; admite null | — | Grupo al que pertenece, si es de grupo. | `src/modules/community/dto/read-messaging.dto.ts:56` |
| `items[].lastMessageAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió el último mensaje. | `src/modules/community/dto/read-messaging.dto.ts:60` |
| `items[].messageCount` | `number` | No | admite null | — | Cuántos mensajes acumula. | `src/modules/community/dto/read-messaging.dto.ts:64` |
| `items[].lastMessage` | `ConversationPreviewMessageDto` | No | — | — | Vista previa del último mensaje. | `src/modules/community/dto/read-messaging.dto.ts:68` |
| `items[].lastMessage.id` | `string` | No | formato uuid | — | Identificador del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:7` |
| `items[].lastMessage.senderProfileId` | `string` | No | formato uuid | — | Perfil que lo envió. | `src/modules/community/dto/read-messaging.dto.ts:11` |
| `items[].lastMessage.bodyText` | `string` | No | admite null | — | Cuerpo del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:15` |
| `items[].lastMessage.sentAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió. | `src/modules/community/dto/read-messaging.dto.ts:19` |
| `items[].unreadCount` | `number` | Sí | — | — | Cuántos mensajes le quedan sin leer al actor. | `src/modules/community/dto/read-messaging.dto.ts:72` |
| `items[].peers` | `array<ConversationPeerDto>` | Sí | — | — | Los demás participantes, sin el propio. Sin el propio porque la bandeja se lee desde un lado: incluirse a uno mismo obligaría a cada pantalla a filtrarse, y la que se olvide muestra «Conversación con vos». | `src/modules/community/dto/read-messaging.dto.ts:82` |
| `items[].peers[].profileId` | `string` | Sí | formato uuid | — | Perfil público del participante. | `src/modules/community/dto/read-messaging.dto.ts:33` |
| `items[].peers[].displayName` | `string` | No | admite null | — | Cómo se llama, para poder pintar la fila. | `src/modules/community/dto/read-messaging.dto.ts:37` |
| `items[].peers[].avatarUrl` | `string` | No | admite null | — | Su avatar público, o `null` si no subió ninguno. Misma regla que la ficha pública. | `src/modules/community/dto/read-messaging.dto.ts:41` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-messaging.dto.ts:93` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-messaging.dto.ts:97` |
| `nextCursor` | `string` | No | admite null | — | Siempre `null`: la bandeja devuelve las conversaciones activas del actor de una vez, acotadas por el tope. Se mantiene el campo para que la forma de la respuesta sea la misma que la de los demás listados. | `src/modules/community/dto/read-messaging.dto.ts:105` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 12. POST /community/conversations

- **Origen:** CONTRATO
- **Nombre:** Crear una conversación con participantes
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.createConversation` — `src/modules/community/controllers/community-messaging.controller.ts:53`

### Qué es y para qué sirve (negocio)

Crear una conversación con participantes. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations` la atiende `CommunityMessagingController.createConversation` (src/modules/community/controllers/community-messaging.controller.ts:53). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateConversationDto` (3 campos, 1 obligatorio). Delega en `CommunityMessagingService.createConversation`. Crea filas en community.conversation_participants, community.conversations. Lee community.conversation_participants, community.conversations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:245` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:265` |

### Cuerpo — DTO `CreateConversationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `participantProfileIds` | `array<string>` | Sí | formato uuid; mínimo 2 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@IsUUID('4', { each: true })` | Perfiles participantes | `src/modules/community/dto/conversation.dto.ts:25` |
| `conversationType` | `string` | No | valores: DIRECT, GROUP | `@IsOptional()` `@IsIn(['DIRECT', 'GROUP'])` | Tipo de conversación | `src/modules/community/dto/conversation.dto.ts:36` |
| `groupId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Grupo asociado (conversaciones de grupo) | `src/modules/community/dto/conversation.dto.ts:47` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "participantProfileIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "participantProfileIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ],
  "conversationType": "DIRECT",
  "groupId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:143` |
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:37` |

### Flujos

_Se completa en la fase de flujos._

---

## 13. GET /community/conversations/{conversationId}/messages

- **Origen:** CONTRATO
- **Nombre:** Mensajes de una conversación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.listMessages` — `src/modules/community/controllers/community-messaging.controller.ts:105`

### Qué es y para qué sirve (negocio)

Mensajes de una conversación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/conversations/{conversationId}/messages` la atiende `CommunityMessagingController.listMessages` (src/modules/community/controllers/community-messaging.controller.ts:105). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingReadService.listMessages`. Lee community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:105` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:105` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → CommunityMessagingReadService.resolvePeerReadUpTo → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → ConversationsRepository.listMessagesPage | `src/modules/community/repositories/conversations.repository.ts:356` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → CommunityMessagingReadService.assertNoBlockWithPeers → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |
| `profileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DirectMessagePageDto>` · DTO `DirectMessagePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DirectMessageDto>` | Sí | — | — | Mensajes de la página, del más reciente al más antiguo. | `src/modules/community/dto/read-messaging.dto.ts:151` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:112` |
| `items[].conversationId` | `string` | Sí | formato uuid | — | Conversación a la que pertenece. | `src/modules/community/dto/read-messaging.dto.ts:116` |
| `items[].senderProfileId` | `string` | Sí | formato uuid | — | Perfil que lo envió. | `src/modules/community/dto/read-messaging.dto.ts:120` |
| `items[].replyToMessageId` | `string` | No | formato uuid; admite null | — | Mensaje al que responde, si responde a alguno. | `src/modules/community/dto/read-messaging.dto.ts:124` |
| `items[].contentTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de contenido. | `src/modules/community/dto/read-messaging.dto.ts:128` |
| `items[].bodyText` | `string` | No | admite null | — | Cuerpo del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:132` |
| `items[].attachmentFileId` | `string` | No | formato uuid; admite null | — | Adjunto en `common.files`. | `src/modules/community/dto/read-messaging.dto.ts:136` |
| `items[].isEdited` | `boolean` | No | admite null | — | Si fue editado. | `src/modules/community/dto/read-messaging.dto.ts:140` |
| `items[].sentAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió. | `src/modules/community/dto/read-messaging.dto.ts:144` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-messaging.dto.ts:155` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-messaging.dto.ts:159` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-messaging.dto.ts:163` |
| `peerReadUpTo` | `string` | No | formato date-time; admite null | — | Hasta qué `sentAt` leyó el otro lado, en una conversación DIRECT. `null` si es de grupo (no hay "el otro lado") o si el peer no marcó nada todavía como leído. Con esto el frente pinta ✓✓ en los mensajes propios cuyo `sentAt` sea anterior o igual a esta marca. | `src/modules/community/dto/read-messaging.dto.ts:173` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 14. POST /community/conversations/{conversationId}/messages

- **Origen:** CONTRATO
- **Nombre:** Enviar un mensaje directo en la conversación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.sendMessage` — `src/modules/community/controllers/community-messaging.controller.ts:64`

### Qué es y para qué sirve (negocio)

Enviar un mensaje directo en la conversación. Caso de uso UC-19-06: Envía mensaje directo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations/{conversationId}/messages` la atiende `CommunityMessagingController.sendMessage` (src/modules/community/controllers/community-messaging.controller.ts:64). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SendMessageDto` (5 campos, 1 obligatorio). Delega en `CommunityMessagingService.sendMessage`. Crea filas en community.direct_messages, community.message_receipts, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza community.conversations. Lee community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:64` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage | `src/modules/community/services/community-messaging.service.ts:204` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → ConversationsRepository.createMessage | `src/modules/community/repositories/conversations.repository.ts:422` |
| `community.message_receipts` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → ConversationsRepository.createReceipt | `src/modules/community/repositories/conversations.repository.ts:503` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessageNotificationsService.mensajeNuevo → CommunityMessageNotificationsService.cuentaDe → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |

### Cuerpo — DTO `SendMessageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `senderProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil remitente (participante activo) | `src/modules/community/dto/conversation.dto.ts:60` |
| `bodyText` | `string` | No | longitud mínima 1; longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(4000)` | Texto del mensaje | `src/modules/community/dto/conversation.dto.ts:70` |
| `contentType` | `string` | No | valores: TEXT, MEDIA | `@IsOptional()` `@IsIn(['TEXT', 'MEDIA'])` | Tipo de contenido | `src/modules/community/dto/conversation.dto.ts:81` |
| `replyToMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensaje al que responde | `src/modules/community/dto/conversation.dto.ts:92` |
| `attachmentFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo adjunto (common.files) | `src/modules/community/dto/conversation.dto.ts:103` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "senderProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "senderProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo",
  "contentType": "TEXT",
  "replyToMessageId": "00000000-0000-4000-8000-000000000001",
  "attachmentFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<MessageResponseDto>` · DTO `MessageResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:128` |
| `conversationId` | `string` | Sí | formato uuid | — | Identificador asociado a conversation. | `src/modules/community/dto/responses.dto.ts:134` |
| `sentAt` | `string` | Sí | formato date-time | — | Valor de sent at mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:140` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:221` |
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:44` |

### Flujos

_Se completa en la fase de flujos._

---

## 15. POST /community/conversations/{conversationId}/read

- **Origen:** CONTRATO
- **Nombre:** Marcar mensajes como leídos (recibos)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.markRead` — `src/modules/community/controllers/community-messaging.controller.ts:76`

### Qué es y para qué sirve (negocio)

Marcar mensajes como leídos (recibos). Caso de uso UC-19-07: Marca mensajes como leídos (recibos). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations/{conversationId}/read` la atiende `CommunityMessagingController.markRead` (src/modules/community/controllers/community-messaging.controller.ts:76). Exige sesión; el controlador no declara roles. Valida el cuerpo como `MarkReadDto` (2 campos, 1 obligatorio). Delega en `CommunityMessagingService.markRead`. Crea filas en community.message_receipts. Actualiza community.conversation_participants. Lee community.conversation_participants, community.conversations, community.direct_messages.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:76` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.markRead → CommunityMessagingService.markRead | `src/modules/community/services/community-messaging.service.ts:326` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.findLastMessage | `src/modules/community/repositories/conversations.repository.ts:451` |
| `community.message_receipts` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.createReceipt | `src/modules/community/repositories/conversations.repository.ts:503` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |

### Cuerpo — DTO `MarkReadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recipientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que marca como leído | `src/modules/community/dto/conversation.dto.ts:113` |
| `upToMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Último mensaje leído (por defecto el más reciente) | `src/modules/community/dto/conversation.dto.ts:124` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "recipientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "recipientProfileId": "00000000-0000-4000-8000-000000000001",
  "upToMessageId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ReadReceiptResponseDto>` · DTO `ReadReceiptResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `receiptsRecorded` | `number` | Sí | — | — | Nº de recibos de lectura registrados | `src/modules/community/dto/responses.dto.ts:149` |
| `lastReadMessageId` | `string` | Sí | formato uuid; admite null | — | Identificador asociado a last read message. | `src/modules/community/dto/responses.dto.ts:155` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:271` |
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:51` |

### Flujos

_Se completa en la fase de flujos._

---

## 16. GET /community/feed

- **Origen:** CONTRATO
- **Nombre:** Timeline de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityTimelineController.getFeed` — `src/modules/community/controllers/community-timeline.controller.ts:34`

### Qué es y para qué sirve (negocio)

Timeline de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/feed` la atiende `CommunityTimelineController.getFeed` (src/modules/community/controllers/community-timeline.controller.ts:34). Exige sesión; el controlador no declara roles. Delega en `CommunityTimelineReadService.getFeed`. Lee community.comments, community.feed_items, community.public_profiles, community.reactions, community.social_follows, community.social_posts, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-timeline.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityEngagementService.ofPosts → CommentsRepository.countByTargets | `src/modules/community/repositories/comments.repository.ts:160` |
| `community.feed_items` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → FeedRepository.listPageByOwner | `src/modules/community/repositories/feed.repository.ts:98` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityEngagementService.ofPosts → ReactionsRepository.listByActorTargets | `src/modules/community/repositories/reactions.repository.ts:164` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.filterVisiblePosts → FollowsRepository.listFollowedProfileIds | `src/modules/community/repositories/follows.repository.ts:82` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → PostsRepository.listByIds | `src/modules/community/repositories/posts.repository.ts:157` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.filterVisiblePosts → BlocksRepository.listBlockedPeers | `src/modules/community/repositories/blocks.repository.ts:87` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FeedPageDto>` · DTO `FeedPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<FeedListItemDto>` | Sí | — | — | Entradas de la página. | `src/modules/community/dto/read-timeline.dto.ts:54` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la entrada. | `src/modules/community/dto/read-timeline.dto.ts:8` |
| `items[].itemTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de entrada. | `src/modules/community/dto/read-timeline.dto.ts:12` |
| `items[].sourceTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de fuente. | `src/modules/community/dto/read-timeline.dto.ts:16` |
| `items[].sourceRefId` | `string` | Sí | formato uuid | — | Id de la fuente (hoy, la publicación). | `src/modules/community/dto/read-timeline.dto.ts:20` |
| `items[].originConceptId` | `string` | Sí | formato uuid | — | Concept id del origen (seguidos, grupo, sugerido…). | `src/modules/community/dto/read-timeline.dto.ts:24` |
| `items[].rankScore` | `string` | No | admite null | — | Puntaje de orden (numeric como texto) | `src/modules/community/dto/read-timeline.dto.ts:28` |
| `items[].isSeen` | `boolean` | No | admite null | — | Si ya se mostró. | `src/modules/community/dto/read-timeline.dto.ts:32` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo entró al timeline. | `src/modules/community/dto/read-timeline.dto.ts:36` |
| `items[].post` | `PostListItemDto` | No | — | — | La publicación de la entrada, si sigue visible para el lector. Nula cuando la fuente ya no es legible —se retiró, o el autor y el lector se bloquearon después del fan-out—. La entrada igual viaja para que el cliente pueda mostrar el hueco en vez de saltear filas y descuadrar el conteo de la página. | `src/modules/community/dto/read-timeline.dto.ts:47` |
| `items[].post.id` | `string` | No | formato uuid | — | Identificador de la publicación. | `src/modules/community/dto/read-social.dto.ts:222` |
| `items[].post.authorPublicProfileId` | `string` | No | formato uuid | — | Perfil autor. | `src/modules/community/dto/read-social.dto.ts:226` |
| `items[].post.postTypeConceptId` | `string` | No | formato uuid | — | Concept id del tipo de publicación. | `src/modules/community/dto/read-social.dto.ts:230` |
| `items[].post.bodyText` | `string` | No | — | — | Cuerpo del texto. | `src/modules/community/dto/read-social.dto.ts:234` |
| `items[].post.visibilityConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la visibilidad declarada; nulo se lee como pública. | `src/modules/community/dto/read-social.dto.ts:238` |
| `items[].post.commentsEnabled` | `boolean` | No | admite null | — | Si admite comentarios. | `src/modules/community/dto/read-social.dto.ts:242` |
| `items[].post.publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-social.dto.ts:246` |
| `items[].post.editedAt` | `string` | No | formato date-time; admite null | — | Si fue editada, cuándo. | `src/modules/community/dto/read-social.dto.ts:250` |
| `items[].post.reactions` | `ReactionSummaryDto` | No | — | — | Reacciones de la publicación, con la del propio lector si tiene perfil. **Viaja con la fila y no en una lectura aparte** porque si no, la única forma de saber cuántas reacciones tiene cada publicación era pedir `GET /posts/{id}/reactions` una vez por tarjeta: cincuenta publicaciones, cincuenta peticiones. Sin esto, el conteo de la interfaz sólo podía ser el del gesto que el usuario acababa de hacer, y **al recargar volvía a cero** aunque la reacción estuviera guardada. | `src/modules/community/dto/read-social.dto.ts:263` |
| `items[].post.reactions.tallies` | `array<ReactionTallyDto>` | No | — | — | Recuento por tipo. | `src/modules/community/dto/read-social.dto.ts:191` |
| `items[].post.reactions.tallies[].reactionTypeConceptId` | `string` | No | formato uuid | — | Concept id del tipo de reacción. | `src/modules/community/dto/read-social.dto.ts:166` |
| `items[].post.reactions.tallies[].reactionType` | `string` | No | admite null | — | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `src/modules/community/dto/read-social.dto.ts:180` |
| `items[].post.reactions.tallies[].count` | `number` | No | — | — | Cantidad de reacciones de ese tipo. | `src/modules/community/dto/read-social.dto.ts:184` |
| `items[].post.reactions.total` | `number` | No | — | — | Total de reacciones. | `src/modules/community/dto/read-social.dto.ts:195` |
| `items[].post.reactions.actorReactionTypeConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `src/modules/community/dto/read-social.dto.ts:205` |
| `items[].post.reactions.actorReactionType` | `string` | No | admite null | — | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `src/modules/community/dto/read-social.dto.ts:215` |
| `items[].post.commentCount` | `number` | No | — | — | Comentarios vigentes del hilo completo, raíces y respuestas. Por la misma razón que el resumen de reacciones: el contador no existe como columna —y agregarla sería agregar esquema por comodidad de una lectura—, se calcula agrupado al leer la página. | `src/modules/community/dto/read-social.dto.ts:273` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-timeline.dto.ts:58` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-timeline.dto.ts:62` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-timeline.dto.ts:66` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:374` |

### Flujos

_Se completa en la fase de flujos._

---

## 17. DELETE /community/follows

- **Origen:** CONTRATO
- **Nombre:** Dejar de seguir un objeto social
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.unfollow` — `src/modules/community/controllers/community-social.controller.ts:223`

### Qué es y para qué sirve (negocio)

Dejar de seguir un objeto social. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/follows` la atiende `CommunitySocialController.unfollow` (src/modules/community/controllers/community-social.controller.ts:223). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.unfollow`. Actualiza community.social_follows. Lee community.public_profiles, community.social_follows.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:223` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | followerProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | followableType (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | followableRefId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.unfollow → CommunitySocialService.unfollow → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.social_follows` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.unfollow → CommunitySocialService.unfollow | `src/modules/community/services/community-social.service.ts:868` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.unfollow → CommunitySocialService.unfollow → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `followerProfileId` | query | Sí | `string` | Perfil que deja de seguir |
| `followableType` | query | Sí | `string` | Tipo de objeto seguido |
| `followableRefId` | query | Sí | `string` | Id del objeto seguido |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SocialRemovalResponseDto>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:126` |

### Flujos

_Se completa en la fase de flujos._

---

## 18. GET /community/follows

- **Origen:** CONTRATO
- **Nombre:** Seguimientos activos de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listFollows` — `src/modules/community/controllers/community-social.controller.ts:348`

### Qué es y para qué sirve (negocio)

Seguimientos activos de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/follows` la atiende `CommunitySocialController.listFollows` (src/modules/community/controllers/community-social.controller.ts:348). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listFollows`. Lee community.public_profiles, community.social_follows.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:348` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | followerProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listFollows → CommunitySocialReadService.listFollows → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.listFollows → CommunitySocialReadService.listFollows → FollowsRepository.listByFollowerPage | `src/modules/community/repositories/follows.repository.ts:136` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `followerProfileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FollowPageDto>` · DTO `FollowPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<FollowListItemDto>` | Sí | — | — | Seguimientos de la página. | `src/modules/community/dto/read-social.dto.ts:395` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del seguimiento. | `src/modules/community/dto/read-social.dto.ts:368` |
| `items[].followerProfileId` | `string` | Sí | formato uuid | — | Perfil que sigue. | `src/modules/community/dto/read-social.dto.ts:372` |
| `items[].followableTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de objeto seguido. | `src/modules/community/dto/read-social.dto.ts:376` |
| `items[].followableRefId` | `string` | Sí | formato uuid | — | Id del objeto seguido. | `src/modules/community/dto/read-social.dto.ts:380` |
| `items[].notificationLevelConceptId` | `string` | No | formato uuid; admite null | — | Concept id del nivel de notificación elegido. | `src/modules/community/dto/read-social.dto.ts:384` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo empezó a seguir. | `src/modules/community/dto/read-social.dto.ts:388` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-social.dto.ts:399` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:403` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:407` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 19. POST /community/follows

- **Origen:** CONTRATO
- **Nombre:** Seguir un objeto social
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.follow` — `src/modules/community/controllers/community-social.controller.ts:194`

### Qué es y para qué sirve (negocio)

Seguir un objeto social. Caso de uso UC-19-05: Sigue objeto social (perfil/tópico/hashtag/grupo). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/follows` la atiende `CommunitySocialController.follow` (src/modules/community/controllers/community-social.controller.ts:194). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFollowDto` (4 campos, 3 obligatorios). Delega en `CommunitySocialService.follow`. Crea filas en community.social_follows. Actualiza community.social_follows. Lee community.public_profiles, community.social_follows.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:194` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.social_follows` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.follow → CommunitySocialService.follow | `src/modules/community/services/community-social.service.ts:743` |
| `community.social_follows` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → FollowsRepository.create | `src/modules/community/repositories/follows.repository.ts:178` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |

### Cuerpo — DTO `CreateFollowDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `followerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que sigue | `src/modules/community/dto/follow.dto.ts:11` |
| `followableType` | `string` | Sí | valores: PROFILE, TOPIC, HASHTAG, GROUP | `@IsIn(['PROFILE', 'TOPIC', 'HASHTAG', 'GROUP'])` | Tipo de objeto seguido | `src/modules/community/dto/follow.dto.ts:21` |
| `followableRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del objeto seguido | `src/modules/community/dto/follow.dto.ts:28` |
| `notificationLevel` | `string` | No | valores: ALL, HIGHLIGHTS, NONE | `@IsOptional()` `@IsIn(['ALL', 'HIGHLIGHTS', 'NONE'])` | Nivel de notificación | `src/modules/community/dto/follow.dto.ts:39` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "followerProfileId": "00000000-0000-4000-8000-000000000001",
  "followableType": "PROFILE",
  "followableRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "followerProfileId": "00000000-0000-4000-8000-000000000001",
  "followableType": "PROFILE",
  "followableRefId": "00000000-0000-4000-8000-000000000001",
  "notificationLevel": "ALL"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:173` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:108` |

### Flujos

_Se completa en la fase de flujos._

---

## 20. GET /community/groups

- **Origen:** CONTRATO
- **Nombre:** Grupos de una organización
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.listGroups` — `src/modules/community/controllers/community-groups.controller.ts:142`

### Qué es y para qué sirve (negocio)

Grupos de una organización. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups` la atiende `CommunityGroupsController.listGroups` (src/modules/community/controllers/community-groups.controller.ts:142). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.listGroups`. Lee community.groups.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | topicId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.listGroups → CommunityGroupsReadService.listGroups → GroupsRepository.searchPage | `src/modules/community/repositories/groups.repository.ts:129` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | query | Sí | `string` | — |
| `topicId` | query | Sí | `string` | — |
| `q` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GroupPageDto>` · DTO `GroupPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<GroupListItemDto>` | Sí | — | — | Grupos de la página. | `src/modules/community/dto/read-groups.dto.ts:54` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del grupo. | `src/modules/community/dto/read-groups.dto.ts:7` |
| `items[].tenantId` | `string` | No | formato uuid; admite null | — | Organización a la que pertenece. | `src/modules/community/dto/read-groups.dto.ts:11` |
| `items[].slug` | `string` | Sí | — | — | Ruta del grupo. | `src/modules/community/dto/read-groups.dto.ts:15` |
| `items[].name` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/read-groups.dto.ts:19` |
| `items[].description` | `string` | No | admite null | — | Descripción. | `src/modules/community/dto/read-groups.dto.ts:23` |
| `items[].visibilityConceptId` | `string` | Sí | formato uuid | — | Concept id de la visibilidad (pública, privada). | `src/modules/community/dto/read-groups.dto.ts:27` |
| `items[].groupTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de grupo. | `src/modules/community/dto/read-groups.dto.ts:31` |
| `items[].ownerProfileId` | `string` | No | formato uuid; admite null | — | Perfil dueño. | `src/modules/community/dto/read-groups.dto.ts:35` |
| `items[].coverFileId` | `string` | No | formato uuid; admite null | — | Imagen de portada. | `src/modules/community/dto/read-groups.dto.ts:39` |
| `items[].memberCount` | `number` | No | admite null | — | Cuántos integrantes tiene registrados. | `src/modules/community/dto/read-groups.dto.ts:43` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del grupo. | `src/modules/community/dto/read-groups.dto.ts:47` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-groups.dto.ts:58` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-groups.dto.ts:62` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-groups.dto.ts:66` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:428` |

### Flujos

_Se completa en la fase de flujos._

---

## 21. POST /community/groups

- **Origen:** CONTRATO
- **Nombre:** Crear un grupo/comunidad
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.createGroup` — `src/modules/community/controllers/community-groups.controller.ts:72`

### Qué es y para qué sirve (negocio)

Crear un grupo/comunidad. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/groups` la atiende `CommunityGroupsController.createGroup` (src/modules/community/controllers/community-groups.controller.ts:72). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateGroupDto` (7 campos, 2 obligatorios). Delega en `CommunityGroupsService.createGroup`. Crea filas en community.group_members, community.groups. Lee community.groups, community.public_profiles, community.topics.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.group_members` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.createMember | `src/modules/community/repositories/groups.repository.ts:270` |
| `community.groups` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.create | `src/modules/community/repositories/groups.repository.ts:226` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.findBySlug | `src/modules/community/repositories/groups.repository.ts:180` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |
| `community.topics` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.findTopicById | `src/modules/community/repositories/groups.repository.ts:430` |

### Cuerpo — DTO `CreateGroupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `slug` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@MinLength(1)` `@MaxLength(120)` | Slug único | `src/modules/community/dto/group.dto.ts:23` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del grupo | `src/modules/community/dto/group.dto.ts:32` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/community/dto/group.dto.ts:41` |
| `visibility` | `string` | No | valores: PUBLIC, PRIVATE, SECRET | `@IsOptional()` `@IsIn(['PUBLIC', 'PRIVATE', 'SECRET'])` | Visibilidad | `src/modules/community/dto/group.dto.ts:52` |
| `groupType` | `string` | No | valores: GENERAL, SUPPORT | `@IsOptional()` `@IsIn(['GENERAL', 'SUPPORT'])` | Tipo de grupo | `src/modules/community/dto/group.dto.ts:63` |
| `topicId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tema del grupo | `src/modules/community/dto/group.dto.ts:75` |
| `ownerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil propietario | `src/modules/community/dto/group.dto.ts:83` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "slug": "valor-ejemplo",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "slug": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "visibility": "PUBLIC",
  "groupType": "GENERAL",
  "topicId": "00000000-0000-4000-8000-000000000001",
  "ownerProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:49` |

### Flujos

_Se completa en la fase de flujos._

---

## 22. GET /community/groups/{groupId}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.getGroup` — `src/modules/community/controllers/community-groups.controller.ts:160`

### Qué es y para qué sirve (negocio)

Ficha de un grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups/{groupId}` la atiende `CommunityGroupsController.getGroup` (src/modules/community/controllers/community-groups.controller.ts:160). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.getGroup`. Lee community.group_members, community.groups, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:160` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:160` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → GroupsRepository.countMembersByStatus | `src/modules/community/repositories/groups.repository.ts:395` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:101` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GroupDetailDto>` · DTO `GroupDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del grupo. | `src/modules/community/dto/group-wall.dto.ts:112` |
| `tenantId` | `string` | No | formato uuid; admite null | — | Organización a la que pertenece. | `src/modules/community/dto/group-wall.dto.ts:116` |
| `slug` | `string` | Sí | — | — | Ruta del grupo. | `src/modules/community/dto/group-wall.dto.ts:120` |
| `name` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/group-wall.dto.ts:124` |
| `description` | `string` | No | admite null | — | Descripción. | `src/modules/community/dto/group-wall.dto.ts:128` |
| `visibilityConceptId` | `string` | Sí | formato uuid | — | Concept id de la visibilidad. | `src/modules/community/dto/group-wall.dto.ts:132` |
| `groupTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de grupo. | `src/modules/community/dto/group-wall.dto.ts:136` |
| `topicId` | `string` | No | formato uuid; admite null | — | Tema por el que se clasifica, si tiene uno. | `src/modules/community/dto/group-wall.dto.ts:140` |
| `ownerProfileId` | `string` | No | formato uuid; admite null | — | Perfil dueño. | `src/modules/community/dto/group-wall.dto.ts:144` |
| `coverFileId` | `string` | No | formato uuid; admite null | — | Imagen de portada. | `src/modules/community/dto/group-wall.dto.ts:148` |
| `memberCount` | `number` | No | admite null | — | Cuántos integrantes activos tiene. | `src/modules/community/dto/group-wall.dto.ts:152` |
| `postCount` | `number` | No | admite null | — | Cuántas publicaciones lleva el muro. | `src/modules/community/dto/group-wall.dto.ts:156` |
| `pendingCount` | `number` | No | admite null | — | Altas esperando aprobación. Sólo se informa a quien administra. | `src/modules/community/dto/group-wall.dto.ts:160` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del grupo. | `src/modules/community/dto/group-wall.dto.ts:164` |
| `viewer` | `GroupViewerMembershipDto` | Sí | — | — | Cómo se para el lector frente a este grupo. | `src/modules/community/dto/group-wall.dto.ts:168` |
| `viewer.isMember` | `boolean` | Sí | — | — | `true` si el lector tiene membresía activa. | `src/modules/community/dto/group-wall.dto.ts:85` |
| `viewer.canAdminister` | `boolean` | Sí | — | — | `true` si puede aprobar altas y moderar el muro. | `src/modules/community/dto/group-wall.dto.ts:89` |
| `viewer.canPost` | `boolean` | Sí | — | — | `true` si puede escribir en el muro. | `src/modules/community/dto/group-wall.dto.ts:93` |
| `viewer.membershipId` | `string` | No | formato uuid; admite null | — | Membresía del lector, si tiene una (aunque esté pendiente). | `src/modules/community/dto/group-wall.dto.ts:97` |
| `viewer.memberRoleConceptId` | `string` | No | formato uuid; admite null | — | Concept id del rol del lector, o `null`. | `src/modules/community/dto/group-wall.dto.ts:101` |
| `viewer.joinStatusConceptId` | `string` | No | formato uuid; admite null | — | Concept id del estado de la membresía del lector, o `null`. | `src/modules/community/dto/group-wall.dto.ts:105` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:62` |

### Flujos

_Se completa en la fase de flujos._

---

## 23. GET /community/groups/{groupId}/members

- **Origen:** CONTRATO
- **Nombre:** Integrantes de un grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.listMembers` — `src/modules/community/controllers/community-groups.controller.ts:171`

### Qué es y para qué sirve (negocio)

Integrantes de un grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups/{groupId}/members` la atiende `CommunityGroupsController.listMembers` (src/modules/community/controllers/community-groups.controller.ts:171). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.listMembers`. Lee community.group_members, community.groups, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | joinStatus (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:171` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:259` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:101` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |
| `joinStatus` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GroupMemberPageDto>` · DTO `GroupMemberPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<GroupMemberDto>` | Sí | — | — | Integrantes de la página. | `src/modules/community/dto/read-groups.dto.ts:100` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la membresía. | `src/modules/community/dto/read-groups.dto.ts:73` |
| `items[].memberProfileId` | `string` | Sí | formato uuid | — | Perfil integrante. | `src/modules/community/dto/read-groups.dto.ts:77` |
| `items[].memberRoleConceptId` | `string` | Sí | formato uuid | — | Concept id del rol dentro del grupo. | `src/modules/community/dto/read-groups.dto.ts:81` |
| `items[].joinStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la membresía. | `src/modules/community/dto/read-groups.dto.ts:85` |
| `items[].joinedAt` | `string` | No | formato date-time; admite null | — | Cuándo se incorporó. | `src/modules/community/dto/read-groups.dto.ts:89` |
| `items[].invitedByProfileId` | `string` | No | formato uuid; admite null | — | Quién lo invitó, si alguien lo hizo. | `src/modules/community/dto/read-groups.dto.ts:93` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-groups.dto.ts:104` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-groups.dto.ts:108` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-groups.dto.ts:112` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:95` |

### Flujos

_Se completa en la fase de flujos._

---

## 24. POST /community/groups/{groupId}/members

- **Origen:** CONTRATO
- **Nombre:** Unirse a un grupo / comunidad
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.joinGroup` — `src/modules/community/controllers/community-groups.controller.ts:83`

### Qué es y para qué sirve (negocio)

Unirse a un grupo / comunidad. Caso de uso UC-19-13: Se une a grupo/comunidad. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:25`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/groups/{groupId}/members` la atiende `CommunityGroupsController.joinGroup` (src/modules/community/controllers/community-groups.controller.ts:83). Exige sesión; el controlador no declara roles. Valida el cuerpo como `JoinGroupDto` (2 campos, 1 obligatorio). Delega en `CommunityGroupsService.joinGroup`. Crea filas en community.group_members. Actualiza community.group_members, community.groups. Lee community.group_members, community.groups.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:83` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.group_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup | `src/modules/community/services/community-groups.service.ts:273` |
| `community.group_members` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → GroupsRepository.createMember | `src/modules/community/repositories/groups.repository.ts:270` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:259` |
| `community.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup | `src/modules/community/services/community-groups.service.ts:293` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |

### Cuerpo — DTO `JoinGroupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `memberProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que se une | `src/modules/community/dto/group.dto.ts:93` |
| `invitedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil que invitó (grupos privados) | `src/modules/community/dto/group.dto.ts:104` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "memberProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "memberProfileId": "00000000-0000-4000-8000-000000000001",
  "invitedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<GroupMembershipResponseDto>` · DTO `GroupMembershipResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:258` |
| `joinStatus` | `string` | Sí | — | — | Estado de la membresía (activa o pendiente) | `src/modules/community/dto/responses.dto.ts:264` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:56` |

### Flujos

_Se completa en la fase de flujos._

---

## 25. PATCH /community/groups/{groupId}/members/{memberId}

- **Origen:** CONTRATO
- **Nombre:** Aprobar/rechazar un alta o cambiar el rol
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.updateMember` — `src/modules/community/controllers/community-groups.controller.ts:95`

### Qué es y para qué sirve (negocio)

Aprobar/rechazar un alta o cambiar el rol. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /community/groups/{groupId}/members/{memberId}` la atiende `CommunityGroupsController.updateMember` (src/modules/community/controllers/community-groups.controller.ts:95). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateGroupMemberDto` (3 campos, 0 obligatorios). Delega en `CommunityGroupsService.updateMember`. Crea filas en messaging.notification_requests. Actualiza community.group_members. Lee community.group_members, community.groups, community.public_profiles, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:95` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId, memberId | `src/modules/community/controllers/community-groups.controller.ts:95` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.group_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember | `src/modules/community/services/community-groups.service.ts:477` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → GroupsRepository.findMemberById | `src/modules/community/repositories/groups.repository.ts:301` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:101` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:94` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateGroupMemberDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `role` | `string` | No | valores: MEMBER, MODERATOR, ADMIN | `@IsOptional()` `@IsIn(['MEMBER', 'MODERATOR', 'ADMIN'])` | Rol dentro del grupo | `src/modules/community/dto/group-wall.dto.ts:63` |
| `decision` | `string` | No | valores: APPROVE, REJECT | `@IsOptional()` `@IsIn(['APPROVE', 'REJECT'])` | Resolución de la solicitud de ingreso | `src/modules/community/dto/group-wall.dto.ts:72` |
| `actorProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil administrador | `src/modules/community/dto/group-wall.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "role": "MEMBER",
  "decision": "APPROVE",
  "actorProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<GroupMemberUpdatedDto>` · DTO `GroupMemberUpdatedDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Membresía afectada. | `src/modules/community/dto/group-wall.dto.ts:267` |
| `memberRoleConceptId` | `string` | Sí | formato uuid | — | Concept id del rol resultante. | `src/modules/community/dto/group-wall.dto.ts:271` |
| `joinStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado resultante. | `src/modules/community/dto/group-wall.dto.ts:275` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:75` |

### Flujos

_Se completa en la fase de flujos._

---

## 26. DELETE /community/groups/{groupId}/members/{memberProfileId}

- **Origen:** CONTRATO
- **Nombre:** Salir del grupo o dar de baja a un integrante
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.leaveGroup` — `src/modules/community/controllers/community-groups.controller.ts:112`

### Qué es y para qué sirve (negocio)

Salir del grupo o dar de baja a un integrante. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/groups/{groupId}/members/{memberProfileId}` la atiende `CommunityGroupsController.leaveGroup` (src/modules/community/controllers/community-groups.controller.ts:112). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsService.leaveGroup`. Actualiza community.group_members, community.groups. Lee community.group_members, community.groups, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId, memberProfileId | `src/modules/community/controllers/community-groups.controller.ts:112` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.group_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup | `src/modules/community/services/community-groups.service.ts:368` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:259` |
| `community.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup | `src/modules/community/services/community-groups.service.ts:383` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → GroupsRepository.findByIdForUpdate | `src/modules/community/repositories/groups.repository.ts:347` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |
| `memberProfileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GroupMemberUpdatedDto>` · DTO `GroupMemberUpdatedDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Membresía afectada. | `src/modules/community/dto/group-wall.dto.ts:267` |
| `memberRoleConceptId` | `string` | Sí | formato uuid | — | Concept id del rol resultante. | `src/modules/community/dto/group-wall.dto.ts:271` |
| `joinStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado resultante. | `src/modules/community/dto/group-wall.dto.ts:275` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:68` |

### Flujos

_Se completa en la fase de flujos._

---

## 27. GET /community/groups/{groupId}/posts

- **Origen:** CONTRATO
- **Nombre:** Muro de un grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.listWall` — `src/modules/community/controllers/community-groups.controller.ts:191`

### Qué es y para qué sirve (negocio)

Muro de un grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups/{groupId}/posts` la atiende `CommunityGroupsController.listWall` (src/modules/community/controllers/community-groups.controller.ts:191). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupWallService.listWall`. Lee community.comments, community.group_members, community.groups, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:191` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:191` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommentsRepository.listRootsPage | `src/modules/community/repositories/comments.repository.ts:87` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:259` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:101` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GroupWallPageDto>` · DTO `GroupWallPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<GroupWallItemDto>` | Sí | — | — | Publicaciones de la página, cada una con su hilo. | `src/modules/community/dto/group-wall.dto.ts:210` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la publicación. | `src/modules/community/dto/group-wall.dto.ts:175` |
| `items[].authorProfileId` | `string` | Sí | formato uuid | — | Perfil autor. | `src/modules/community/dto/group-wall.dto.ts:179` |
| `items[].bodyText` | `string` | Sí | — | — | Cuerpo del mensaje. | `src/modules/community/dto/group-wall.dto.ts:183` |
| `items[].parentCommentId` | `string` | No | formato uuid; admite null | — | Publicación a la que responde, si es una respuesta. | `src/modules/community/dto/group-wall.dto.ts:187` |
| `items[].threadDepth` | `number` | No | admite null | — | Profundidad dentro del hilo. | `src/modules/community/dto/group-wall.dto.ts:191` |
| `items[].replyCount` | `number` | No | admite null | — | Cuántas respuestas tiene registradas. | `src/modules/community/dto/group-wall.dto.ts:195` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se publicó. | `src/modules/community/dto/group-wall.dto.ts:199` |
| `items[].replies` | `array<GroupWallItemDto>` | Sí | — | — | Respuestas anidadas. | `src/modules/community/dto/group-wall.dto.ts:203` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/group-wall.dto.ts:214` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/group-wall.dto.ts:218` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/group-wall.dto.ts:222` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:85` |

### Flujos

_Se completa en la fase de flujos._

---

## 28. POST /community/groups/{groupId}/posts

- **Origen:** CONTRATO
- **Nombre:** Publicar en el muro del grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.createGroupPost` — `src/modules/community/controllers/community-groups.controller.ts:123`

### Qué es y para qué sirve (negocio)

Publicar en el muro del grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/groups/{groupId}/posts` la atiende `CommunityGroupsController.createGroupPost` (src/modules/community/controllers/community-groups.controller.ts:123). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateGroupPostDto` (3 campos, 2 obligatorios). Delega en `CommunityGroupWallService.createPost`. Crea filas en community.comments, messaging.notification_requests. Actualiza community.comments. Lee community.comments, community.group_members, community.groups, community.public_profiles, messaging.message_channels, messaging.message_templates, messaging.notification_requests, messaging.recipient_preferences.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:123` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:123` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost | `src/modules/community/services/community-group-wall.service.ts:130` |
| `community.comments` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommentsRepository.create | `src/modules/community/repositories/comments.repository.ts:184` |
| `community.comments` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommentsRepository.findById | `src/modules/community/repositories/comments.repository.ts:63` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.resolve → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:259` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:101` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupNotificationsService.notifyNewPost → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupNotificationsService.notifyNewPost → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupNotificationsService.notifyNewPost → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupNotificationsService.notifyNewPost → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupNotificationsService.notifyNewPost → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateGroupPostDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil autor | `src/modules/community/dto/group-wall.dto.ts:23` |
| `bodyText` | `string` | Sí | longitud mínima 1; longitud máxima 5000 | `@IsString()` `@MinLength(1)` `@MaxLength(5000)` | Cuerpo del mensaje | `src/modules/community/dto/group-wall.dto.ts:30` |
| `parentCommentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Publicación del muro a la que responde | `src/modules/community/dto/group-wall.dto.ts:44` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo",
  "parentCommentId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<GroupWallItemDto>` · DTO `GroupWallItemDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la publicación. | `src/modules/community/dto/group-wall.dto.ts:175` |
| `authorProfileId` | `string` | Sí | formato uuid | — | Perfil autor. | `src/modules/community/dto/group-wall.dto.ts:179` |
| `bodyText` | `string` | Sí | — | — | Cuerpo del mensaje. | `src/modules/community/dto/group-wall.dto.ts:183` |
| `parentCommentId` | `string` | No | formato uuid; admite null | — | Publicación a la que responde, si es una respuesta. | `src/modules/community/dto/group-wall.dto.ts:187` |
| `threadDepth` | `number` | No | admite null | — | Profundidad dentro del hilo. | `src/modules/community/dto/group-wall.dto.ts:191` |
| `replyCount` | `number` | No | admite null | — | Cuántas respuestas tiene registradas. | `src/modules/community/dto/group-wall.dto.ts:195` |
| `createdAt` | `string` | Sí | formato date-time | — | Cuándo se publicó. | `src/modules/community/dto/group-wall.dto.ts:199` |
| `replies` | `array<GroupWallItemDto>` | Sí | — | — | Respuestas anidadas. | `src/modules/community/dto/group-wall.dto.ts:203` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:82` |

### Flujos

_Se completa en la fase de flujos._

---

## 29. GET /community/moderation/appeals

- **Origen:** CONTRATO
- **Nombre:** Apelaciones presentadas, con su decisión
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.listAppeals` — `src/modules/community/controllers/community-moderation.controller.ts:132`

### Qué es y para qué sirve (negocio)

Apelaciones presentadas, con su decisión. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/moderation/appeals` la atiende `CommunityModerationController.listAppeals` (src/modules/community/controllers/community-moderation.controller.ts:132). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CommunityModerationReadService.listAppeals`. Lee community.moderation_appeals, community.moderation_decisions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:132` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_appeals` | LEE | LEE | DIRECTA | CommunityModerationController.listAppeals → CommunityModerationReadService.listAppeals → ModerationRepository.listAppealsPage | `src/modules/community/repositories/moderation.repository.ts:616` |
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.listAppeals → CommunityModerationReadService.listAppeals → ModerationRepository.listDecisionsByIds | `src/modules/community/repositories/moderation.repository.ts:576` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `array<string>` | Estados admitidos (lista separada por comas) |
| `appellantProfileId` | query | No | `string` | Perfil que apeló |
| `cursor` | query | No | `string` | Cursor de la página anterior |
| `limit` | query | No | `number` | Tope de filas |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ModerationAppealPageDto>` · DTO `ModerationAppealPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ModerationAppealItemDto>` | Sí | — | — | Apelaciones de la página. | `src/modules/community/dto/read-moderation.dto.ts:361` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la apelación. | `src/modules/community/dto/read-moderation.dto.ts:313` |
| `items[].moderationDecisionId` | `string` | Sí | formato uuid | — | Decisión impugnada. | `src/modules/community/dto/read-moderation.dto.ts:317` |
| `items[].appellantProfileId` | `string` | Sí | formato uuid | — | Perfil que apeló. | `src/modules/community/dto/read-moderation.dto.ts:321` |
| `items[].reasonText` | `string` | Sí | — | — | Motivo de la apelación. | `src/modules/community/dto/read-moderation.dto.ts:325` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la apelación. | `src/modules/community/dto/read-moderation.dto.ts:329` |
| `items[].resolutionConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la resolución, si ya se resolvió. | `src/modules/community/dto/read-moderation.dto.ts:333` |
| `items[].reviewedByUserId` | `string` | No | formato uuid; admite null | — | Quién la revisó. | `src/modules/community/dto/read-moderation.dto.ts:337` |
| `items[].resolvedAt` | `string` | No | formato date-time; admite null | — | Cuándo se resolvió. | `src/modules/community/dto/read-moderation.dto.ts:341` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se presentó. | `src/modules/community/dto/read-moderation.dto.ts:345` |
| `items[].decision` | `ModerationDecisionItemDto` | No | — | — | La decisión impugnada, resuelta. Va embebida porque resolver una apelación sin leer qué se decidió y por qué es resolverla a ciegas, y pedirla aparte serían N lecturas por pantalla. | `src/modules/community/dto/read-moderation.dto.ts:354` |
| `items[].decision.id` | `string` | No | formato uuid | — | Identificador de la decisión. | `src/modules/community/dto/read-moderation.dto.ts:259` |
| `items[].decision.moderationQueueId` | `string` | No | formato uuid | — | Entrada de cola que resolvió. | `src/modules/community/dto/read-moderation.dto.ts:263` |
| `items[].decision.decisionConceptId` | `string` | No | formato uuid | — | Concept id de la decisión tomada. | `src/modules/community/dto/read-moderation.dto.ts:267` |
| `items[].decision.policyConceptId` | `string` | No | formato uuid | — | Concept id de la política aplicada. | `src/modules/community/dto/read-moderation.dto.ts:271` |
| `items[].decision.rationaleText` | `string` | No | admite null | — | Motivo escrito por quien decidió. | `src/modules/community/dto/read-moderation.dto.ts:275` |
| `items[].decision.actionTakenConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la acción ejecutada. | `src/modules/community/dto/read-moderation.dto.ts:279` |
| `items[].decision.decidedByUserId` | `string` | No | formato uuid | — | Quién decidió. | `src/modules/community/dto/read-moderation.dto.ts:283` |
| `items[].decision.decidedAt` | `string` | No | formato date-time; admite null | — | Cuándo se decidió. | `src/modules/community/dto/read-moderation.dto.ts:287` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-moderation.dto.ts:365` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-moderation.dto.ts:369` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/community/dto/read-moderation.dto.ts:373` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:93` |

### Flujos

_Se completa en la fase de flujos._

---

## 30. POST /community/moderation/appeals/{appealId}/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver una apelación de moderación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.resolveAppeal` — `src/modules/community/controllers/community-moderation.controller.ts:90`

### Qué es y para qué sirve (negocio)

Resolver una apelación de moderación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/moderation/appeals/{appealId}/resolve` la atiende `CommunityModerationController.resolveAppeal` (src/modules/community/controllers/community-moderation.controller.ts:90). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CommunityResolveAppealDto` (1 campo, 1 obligatorio). Delega en `CommunityModerationService.resolveAppeal`. Actualiza community.moderation_appeals, community.moderation_queue. Lee community.moderation_appeals, community.moderation_decisions, community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: appealId | `src/modules/community/controllers/community-moderation.controller.ts:90` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_appeals` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal | `src/modules/community/services/community-moderation.service.ts:300` |
| `community.moderation_appeals` | LEE | LEE | DIRECTA | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal → ModerationRepository.findAppealById | `src/modules/community/repositories/moderation.repository.ts:391` |
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal → ModerationRepository.findDecisionById | `src/modules/community/repositories/moderation.repository.ts:285` |
| `community.moderation_queue` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal | `src/modules/community/services/community-moderation.service.ts:326` |
| `community.moderation_queue` | LEE | LEE | DIRECTA | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal → ModerationRepository.findQueueById | `src/modules/community/repositories/moderation.repository.ts:232` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `appealId` | path | Sí | `string` | — |

### Cuerpo — DTO `CommunityResolveAppealDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `resolution` | `string` | Sí | valores: UPHELD, OVERTURNED, PARTIAL | `@IsIn(['UPHELD', 'OVERTURNED', 'PARTIAL'])` | Resolución de la apelación | `src/modules/community/dto/appeal.dto.ts:63` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "resolution": "UPHELD"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "resolution": "UPHELD"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:65` |

### Flujos

_Se completa en la fase de flujos._

---

## 31. GET /community/moderation/decisions

- **Origen:** CONTRATO
- **Nombre:** Decisiones de moderación tomadas
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.listDecisions` — `src/modules/community/controllers/community-moderation.controller.ts:119`

### Qué es y para qué sirve (negocio)

Decisiones de moderación tomadas. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/moderation/decisions` la atiende `CommunityModerationController.listDecisions` (src/modules/community/controllers/community-moderation.controller.ts:119). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CommunityModerationReadService.listDecisions`. Lee community.moderation_decisions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.listDecisions → CommunityModerationReadService.listDecisions → ModerationRepository.listDecisionsPage | `src/modules/community/repositories/moderation.repository.ts:558` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `moderationQueueId` | query | No | `string` | Entrada de cola |
| `decision` | query | No | `array<string>` | Decisiones admitidas (lista separada por comas) |
| `cursor` | query | No | `string` | Cursor de la página anterior |
| `limit` | query | No | `number` | Tope de filas |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ModerationDecisionPageDto>` · DTO `ModerationDecisionPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ModerationDecisionItemDto>` | Sí | — | — | Decisiones de la página. | `src/modules/community/dto/read-moderation.dto.ts:294` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la decisión. | `src/modules/community/dto/read-moderation.dto.ts:259` |
| `items[].moderationQueueId` | `string` | Sí | formato uuid | — | Entrada de cola que resolvió. | `src/modules/community/dto/read-moderation.dto.ts:263` |
| `items[].decisionConceptId` | `string` | Sí | formato uuid | — | Concept id de la decisión tomada. | `src/modules/community/dto/read-moderation.dto.ts:267` |
| `items[].policyConceptId` | `string` | Sí | formato uuid | — | Concept id de la política aplicada. | `src/modules/community/dto/read-moderation.dto.ts:271` |
| `items[].rationaleText` | `string` | No | admite null | — | Motivo escrito por quien decidió. | `src/modules/community/dto/read-moderation.dto.ts:275` |
| `items[].actionTakenConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la acción ejecutada. | `src/modules/community/dto/read-moderation.dto.ts:279` |
| `items[].decidedByUserId` | `string` | Sí | formato uuid | — | Quién decidió. | `src/modules/community/dto/read-moderation.dto.ts:283` |
| `items[].decidedAt` | `string` | No | formato date-time; admite null | — | Cuándo se decidió. | `src/modules/community/dto/read-moderation.dto.ts:287` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-moderation.dto.ts:298` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-moderation.dto.ts:302` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/community/dto/read-moderation.dto.ts:306` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:90` |

### Flujos

_Se completa en la fase de flujos._

---

## 32. POST /community/moderation/decisions/{decisionId}/appeal

- **Origen:** CONTRATO
- **Nombre:** Apelar una decisión de moderación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.appeal` — `src/modules/community/controllers/community-moderation.controller.ts:78`

### Qué es y para qué sirve (negocio)

Apelar una decisión de moderación. Caso de uso UC-19-10: Apela una decisión. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:22`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/moderation/decisions/{decisionId}/appeal` la atiende `CommunityModerationController.appeal` (src/modules/community/controllers/community-moderation.controller.ts:78). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAppealDto` (2 campos, 2 obligatorios). Delega en `CommunityModerationService.appeal`. Crea filas en community.moderation_appeals, community.moderation_queue. Lee community.moderation_appeals, community.moderation_decisions, community.moderation_queue, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-moderation.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: decisionId | `src/modules/community/controllers/community-moderation.controller.ts:78` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_appeals` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.createAppeal | `src/modules/community/repositories/moderation.repository.ts:348` |
| `community.moderation_appeals` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.findOpenAppealForDecision | `src/modules/community/repositories/moderation.repository.ts:374` |
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.findDecisionById | `src/modules/community/repositories/moderation.repository.ts:285` |
| `community.moderation_queue` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.createQueue | `src/modules/community/repositories/moderation.repository.ts:255` |
| `community.moderation_queue` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.findQueueById | `src/modules/community/repositories/moderation.repository.ts:232` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `decisionId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAppealDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `appellantProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que apela (sancionado) | `src/modules/community/dto/appeal.dto.ts:16` |
| `reasonText` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | Motivo de la apelación | `src/modules/community/dto/appeal.dto.ts:25` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "appellantProfileId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "appellantProfileId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:58` |

### Flujos

_Se completa en la fase de flujos._

---

## 33. GET /community/moderation/queue

- **Origen:** CONTRATO
- **Nombre:** Cola de moderación con filtros y cursor
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.listQueue` — `src/modules/community/controllers/community-moderation.controller.ts:109`

### Qué es y para qué sirve (negocio)

Cola de moderación con filtros y cursor. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/moderation/queue` la atiende `CommunityModerationController.listQueue` (src/modules/community/controllers/community-moderation.controller.ts:109). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CommunityModerationReadService.listQueue`. Lee community.content_reports, community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:109` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.content_reports` | LEE | LEE | DIRECTA | CommunityModerationController.listQueue → CommunityModerationReadService.listQueue → ModerationRepository.listReportsByIds | `src/modules/community/repositories/moderation.repository.ts:488` |
| `community.moderation_queue` | LEE | LEE | DIRECTA | CommunityModerationController.listQueue → CommunityModerationReadService.listQueue → ModerationRepository.listQueuePage | `src/modules/community/repositories/moderation.repository.ts:467` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `status` | query | No | `array<string>` | Estados admitidos (lista separada por comas) |
| `priority` | query | No | `array<string>` | Prioridades admitidas (lista separada por comas) |
| `contentType` | query | No | `array<string>` | Tipos de contenido admitidos (lista separada por comas) |
| `minAgeHours` | query | No | `number` | Sólo lo encolado hace al menos estas horas |
| `cursor` | query | No | `string` | Cursor de la página anterior |
| `limit` | query | No | `number` | Tope de filas |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ModerationQueuePageDto>` · DTO `ModerationQueuePageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ModerationQueueItemDto>` | Sí | — | — | Entradas de la página. | `src/modules/community/dto/read-moderation.dto.ts:240` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la entrada. | `src/modules/community/dto/read-moderation.dto.ts:192` |
| `items[].contentTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de contenido en revisión. | `src/modules/community/dto/read-moderation.dto.ts:196` |
| `items[].contentRefId` | `string` | Sí | formato uuid | — | Identificador del contenido en revisión. | `src/modules/community/dto/read-moderation.dto.ts:200` |
| `items[].sourceConceptId` | `string` | Sí | formato uuid | — | Concept id del origen (reporte de usuario, apelación, automático). | `src/modules/community/dto/read-moderation.dto.ts:204` |
| `items[].priorityConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la prioridad. | `src/modules/community/dto/read-moderation.dto.ts:208` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de la entrada. | `src/modules/community/dto/read-moderation.dto.ts:212` |
| `items[].assignedToUserId` | `string` | No | formato uuid; admite null | — | A quién está asignada, si a alguien. | `src/modules/community/dto/read-moderation.dto.ts:216` |
| `items[].queuedAt` | `string` | No | formato date-time; admite null | — | Cuándo entró a la cola. | `src/modules/community/dto/read-moderation.dto.ts:220` |
| `items[].reportCount` | `number` | Sí | — | — | Cuántos reportes acumula este contenido. La cola deduplica por contenido, así que sin este número una entrada reportada por diez personas se ve igual que una reportada por una. | `src/modules/community/dto/read-moderation.dto.ts:229` |
| `items[].report` | `QueueReportContextDto` | No | — | — | El reporte que abrió la entrada, si lo hubo. | `src/modules/community/dto/read-moderation.dto.ts:233` |
| `items[].report.id` | `string` | No | formato uuid | — | Identificador del reporte. | `src/modules/community/dto/read-moderation.dto.ts:167` |
| `items[].report.reasonConceptId` | `string` | No | formato uuid | — | Concept id de la razón declarada. | `src/modules/community/dto/read-moderation.dto.ts:171` |
| `items[].report.detailText` | `string` | No | admite null | — | Detalle que escribió quien reportó. Es texto libre de un usuario y puede contener datos de terceros; viaja porque el moderador **necesita** leerlo para decidir, y no sale de esta lectura, que exige rol de moderación. | `src/modules/community/dto/read-moderation.dto.ts:181` |
| `items[].report.createdAt` | `string` | No | formato date-time | — | Cuándo se reportó. | `src/modules/community/dto/read-moderation.dto.ts:185` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-moderation.dto.ts:244` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-moderation.dto.ts:248` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/community/dto/read-moderation.dto.ts:252` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:77` |

### Flujos

_Se completa en la fase de flujos._

---

## 34. POST /community/moderation/queue/{queueId}/decision

- **Origen:** CONTRATO
- **Nombre:** Resolver moderación (decisión + strike)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.decide` — `src/modules/community/controllers/community-moderation.controller.ts:65`

### Qué es y para qué sirve (negocio)

Resolver moderación (decisión + strike). Caso de uso UC-19-09: Resuelve moderación (decisión + strike). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:21`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/moderation/queue/{queueId}/decision` la atiende `CommunityModerationController.decide` (src/modules/community/controllers/community-moderation.controller.ts:65). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ModerationDecisionDto` (4 campos, 2 obligatorios). Delega en `CommunityModerationService.decide`. Crea filas en community.moderation_decisions, community.moderation_strikes. Actualiza community.content_reports, community.moderation_queue. Lee community.content_reports, community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:65` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: queueId | `src/modules/community/controllers/community-moderation.controller.ts:65` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.content_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.decide → CommunityModerationService.decide | `src/modules/community/services/community-moderation.service.ts:152` |
| `community.content_reports` | LEE | LEE | DIRECTA | CommunityModerationController.decide → CommunityModerationService.decide → ModerationRepository.findReportsByTarget | `src/modules/community/repositories/moderation.repository.ts:217` |
| `community.moderation_decisions` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.decide → CommunityModerationService.decide → ModerationRepository.createDecision | `src/modules/community/repositories/moderation.repository.ts:299` |
| `community.moderation_queue` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.decide → CommunityModerationService.decide | `src/modules/community/services/community-moderation.service.ts:144` |
| `community.moderation_queue` | LEE | LEE | DIRECTA | CommunityModerationController.decide → CommunityModerationService.decide → ModerationRepository.findQueueById | `src/modules/community/repositories/moderation.repository.ts:232` |
| `community.moderation_strikes` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.decide → CommunityModerationService.decide → ModerationRepository.createStrike | `src/modules/community/repositories/moderation.repository.ts:324` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `queueId` | path | Sí | `string` | — |

### Cuerpo — DTO `ModerationDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: REMOVED, RESTRICTED, WARNED, DISMISSED | `@IsIn(['REMOVED', 'RESTRICTED', 'WARNED', 'DISMISSED'])` | Decisión | `src/modules/community/dto/moderation-decision.dto.ts:21` |
| `rationaleText` | `string` | Sí | longitud mínima 1; longitud máxima 2000 | `@IsString()` `@MinLength(1)` `@MaxLength(2000)` | Motivación de la decisión | `src/modules/community/dto/moderation-decision.dto.ts:39` |
| `subjectProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil sancionado (si la decisión emite strike) | `src/modules/community/dto/moderation-decision.dto.ts:50` |
| `strikeSeverity` | `string` | No | valores: LOW, MEDIUM, HIGH | `@IsOptional()` `@IsIn(['LOW', 'MEDIUM', 'HIGH'])` | Severidad del strike | `src/modules/community/dto/moderation-decision.dto.ts:61` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "REMOVED",
  "rationaleText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "REMOVED",
  "rationaleText": "valor-ejemplo",
  "subjectProfileId": "00000000-0000-4000-8000-000000000001",
  "strikeSeverity": "LOW"
}
```

</details>

### Respuesta — `Promise<ModerationDecisionResponseDto>` · DTO `ModerationDecisionResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:182` |
| `strikeId` | `string` | Sí | formato uuid; admite null | — | Strike emitido, si aplica | `src/modules/community/dto/responses.dto.ts:192` |
| `decision` | `string` | Sí | — | — | Valor de decision mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:198` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:51` |

### Flujos

_Se completa en la fase de flujos._

---

## 35. GET /community/notifications

- **Origen:** CONTRATO
- **Nombre:** Notificaciones sociales de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityTimelineController.listNotifications` — `src/modules/community/controllers/community-timeline.controller.ts:49`

### Qué es y para qué sirve (negocio)

Notificaciones sociales de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/notifications` la atiende `CommunityTimelineController.listNotifications` (src/modules/community/controllers/community-timeline.controller.ts:49). Exige sesión; el controlador no declara roles. Delega en `CommunityTimelineReadService.listNotifications`. Lee community.public_profiles, community.social_notifications.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-timeline.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityTimelineController.listNotifications → CommunityTimelineReadService.listNotifications → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.social_notifications` | LEE | LEE | DIRECTA | CommunityTimelineController.listNotifications → CommunityTimelineReadService.listNotifications → NotificationsRepository.listByRecipientPage | `src/modules/community/repositories/notifications.repository.ts:29` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<NotificationPageDto>` · DTO `NotificationPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SocialNotificationDto>` | Sí | — | — | Notificaciones de la página. | `src/modules/community/dto/read-timeline.dto.ts:112` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la notificación. | `src/modules/community/dto/read-timeline.dto.ts:73` |
| `items[].notificationTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de notificación. | `src/modules/community/dto/read-timeline.dto.ts:77` |
| `items[].actorProfileId` | `string` | No | formato uuid; admite null | — | Perfil que la provocó, si lo hubo. | `src/modules/community/dto/read-timeline.dto.ts:81` |
| `items[].sourceTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de origen. | `src/modules/community/dto/read-timeline.dto.ts:85` |
| `items[].sourceRefId` | `string` | Sí | formato uuid | — | Id del contenido de origen. | `src/modules/community/dto/read-timeline.dto.ts:89` |
| `items[].previewText` | `string` | No | admite null | — | Texto corto de vista previa. | `src/modules/community/dto/read-timeline.dto.ts:93` |
| `items[].isRead` | `boolean` | Sí | — | — | Si ya se leyó. | `src/modules/community/dto/read-timeline.dto.ts:97` |
| `items[].readAt` | `string` | No | formato date-time; admite null | — | Cuándo se leyó. | `src/modules/community/dto/read-timeline.dto.ts:101` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se generó. | `src/modules/community/dto/read-timeline.dto.ts:105` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-timeline.dto.ts:116` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-timeline.dto.ts:120` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-timeline.dto.ts:124` |
| `unreadCount` | `number` | Sí | — | — | Cuántas hay sin leer en total. Se cuenta sobre la bandeja entera y no sobre la página: el globo de la campana no depende de cuántas notificaciones se estén mostrando. | `src/modules/community/dto/read-timeline.dto.ts:133` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:419` |

### Flujos

_Se completa en la fase de flujos._

---

## 36. GET /community/polls/{pollId}

- **Origen:** CONTRATO
- **Nombre:** Encuesta con opciones, recuentos y voto propio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPollsController.getPoll` — `src/modules/community/controllers/community-polls.controller.ts:64`

### Qué es y para qué sirve (negocio)

Encuesta con opciones, recuentos y voto propio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/polls/{pollId}` la atiende `CommunityPollsController.getPoll` (src/modules/community/controllers/community-polls.controller.ts:64). Exige sesión; el controlador no declara roles. Delega en `CommunityPollsReadService.getPoll`. Lee community.poll_options, community.poll_votes, community.polls, community.public_profiles, community.social_follows, community.social_posts, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-polls.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pollId | `src/modules/community/controllers/community-polls.controller.ts:64` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.poll_options` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PollsRepository.listOptions | `src/modules/community/repositories/polls.repository.ts:116` |
| `community.poll_votes` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PollsRepository.listVotedOptionIds | `src/modules/community/repositories/polls.repository.ts:140` |
| `community.polls` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PollsRepository.findPollById | `src/modules/community/repositories/polls.repository.ts:47` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pollId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PollDetailDto>` · DTO `PollDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la encuesta. | `src/modules/community/dto/read-polls.dto.ts:32` |
| `postId` | `string` | Sí | formato uuid | — | Publicación que la contiene. | `src/modules/community/dto/read-polls.dto.ts:36` |
| `question` | `string` | Sí | — | — | Pregunta. | `src/modules/community/dto/read-polls.dto.ts:40` |
| `allowsMultiple` | `boolean` | Sí | — | — | Si admite marcar varias opciones. | `src/modules/community/dto/read-polls.dto.ts:44` |
| `closesAt` | `string` | No | formato date-time; admite null | — | Cuándo cierra. | `src/modules/community/dto/read-polls.dto.ts:48` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado (abierta, cerrada). | `src/modules/community/dto/read-polls.dto.ts:52` |
| `options` | `array<PollOptionResultDto>` | Sí | — | — | Opciones con su recuento. | `src/modules/community/dto/read-polls.dto.ts:56` |
| `options[].id` | `string` | Sí | formato uuid | — | Identificador de la opción. | `src/modules/community/dto/read-polls.dto.ts:7` |
| `options[].label` | `string` | Sí | — | — | Texto de la opción. | `src/modules/community/dto/read-polls.dto.ts:11` |
| `options[].ordinal` | `number` | No | admite null | — | Orden de presentación. | `src/modules/community/dto/read-polls.dto.ts:15` |
| `options[].voteCount` | `number` | Sí | — | — | Votos contados sobre `poll_votes`. No se devuelve `poll_options.vote_count`: ese contador es denormalizado y si quedó desfasado, mostrarlo haría que los porcentajes de la pantalla no sumen el total de la encuesta. | `src/modules/community/dto/read-polls.dto.ts:25` |
| `totalVotes` | `number` | Sí | — | — | Total de votos emitidos. | `src/modules/community/dto/read-polls.dto.ts:60` |
| `actorVotedOptionIds` | `array<string>` | No | formato uuid | — | Opciones que votó el actor, si preguntó por sí mismo. Un arreglo vacío significa «no votó»; `undefined`, «no preguntó». La distinción importa porque una encuesta de opción múltiple tiene que poder marcar cada casilla elegida. | `src/modules/community/dto/read-polls.dto.ts:70` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 37. POST /community/polls/{pollId}/votes

- **Origen:** CONTRATO
- **Nombre:** Votar en una encuesta
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPollsController.vote` — `src/modules/community/controllers/community-polls.controller.ts:52`

### Qué es y para qué sirve (negocio)

Votar en una encuesta. Caso de uso UC-19-12: Vota en encuesta. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:24`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/polls/{pollId}/votes` la atiende `CommunityPollsController.vote` (src/modules/community/controllers/community-polls.controller.ts:52). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateVoteDto` (2 campos, 2 obligatorios). Delega en `CommunityPollsService.vote`. Crea filas en community.poll_votes. Actualiza community.poll_options, community.polls. Lee community.poll_options, community.poll_votes, community.polls.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-polls.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pollId | `src/modules/community/controllers/community-polls.controller.ts:52` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.poll_options` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityPollsController.vote → CommunityPollsService.vote | `src/modules/community/services/community-polls.service.ts:147` |
| `community.poll_options` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.findOptionById | `src/modules/community/repositories/polls.repository.ts:111` |
| `community.poll_votes` | ESCRIBE | CREA | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.createVote | `src/modules/community/repositories/polls.repository.ts:237` |
| `community.poll_votes` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.findVote | `src/modules/community/repositories/polls.repository.ts:190` |
| `community.polls` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityPollsController.vote → CommunityPollsService.vote | `src/modules/community/services/community-polls.service.ts:150` |
| `community.polls` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.findPollById | `src/modules/community/repositories/polls.repository.ts:47` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `pollId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateVoteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pollOptionId` | `string` | Sí | formato uuid | `@IsUUID()` | Opción elegida | `src/modules/community/dto/poll.dto.ts:65` |
| `voterProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil votante | `src/modules/community/dto/poll.dto.ts:72` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pollOptionId": "00000000-0000-4000-8000-000000000001",
  "voterProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pollOptionId": "00000000-0000-4000-8000-000000000001",
  "voterProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VoteResponseDto>` · DTO `VoteResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:249` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-polls.controller.spec.ts:42` |

### Flujos

_Se completa en la fase de flujos._

---

## 38. GET /community/posts/{postId}

- **Origen:** CONTRATO
- **Nombre:** Publicación con media, hashtags y menciones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getPost` — `src/modules/community/controllers/community-social.controller.ts:307`

### Qué es y para qué sirve (negocio)

Publicación con media, hashtags y menciones. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/posts/{postId}` la atiende `CommunitySocialController.getPost` (src/modules/community/controllers/community-social.controller.ts:307). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getPost`. Lee community.comments, community.content_hashtags, community.hashtags, community.mentions, community.post_media, community.public_profiles, community.reactions, community.social_follows y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:307` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-social.controller.ts:307` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityEngagementService.ofPosts → CommentsRepository.countByTargets | `src/modules/community/repositories/comments.repository.ts:160` |
| `community.content_hashtags` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listHashtags | `src/modules/community/repositories/posts.repository.ts:208` |
| `community.hashtags` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listHashtags | `src/modules/community/repositories/posts.repository.ts:213` |
| `community.mentions` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listMentions | `src/modules/community/repositories/posts.repository.ts:221` |
| `community.post_media` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listMedia | `src/modules/community/repositories/posts.repository.ts:187` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityEngagementService.ofPosts → ReactionsRepository.listByActorTargets | `src/modules/community/repositories/reactions.repository.ts:164` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PostDetailDto>` · DTO `PostDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `media` | `array<PostMediaDto>` | Sí | — | — | Adjuntos, en orden de despliegue. | `src/modules/community/dto/read-social.dto.ts:280` |
| `media[].id` | `string` | Sí | formato uuid | — | Identificador del adjunto. | `src/modules/community/dto/read-social.dto.ts:113` |
| `media[].fileId` | `string` | Sí | formato uuid | — | Archivo en `common.files`. | `src/modules/community/dto/read-social.dto.ts:117` |
| `media[].mediaRoleConceptId` | `string` | Sí | formato uuid | — | Concept id del rol del medio (imagen, video, documento). | `src/modules/community/dto/read-social.dto.ts:121` |
| `media[].altText` | `string` | No | admite null | — | Texto alternativo para lectores de pantalla. | `src/modules/community/dto/read-social.dto.ts:125` |
| `media[].ordinal` | `number` | No | admite null | — | Orden de despliegue. | `src/modules/community/dto/read-social.dto.ts:129` |
| `hashtags` | `array<PostHashtagDto>` | Sí | — | — | Etiquetas resueltas a texto. | `src/modules/community/dto/read-social.dto.ts:284` |
| `hashtags[].id` | `string` | Sí | formato uuid | — | Identificador de la etiqueta. | `src/modules/community/dto/read-social.dto.ts:136` |
| `hashtags[].tag` | `string` | Sí | — | — | Texto de la etiqueta, listo para mostrar. | `src/modules/community/dto/read-social.dto.ts:140` |
| `mentions` | `array<PostMentionDto>` | Sí | — | — | Menciones activas del cuerpo. | `src/modules/community/dto/read-social.dto.ts:288` |
| `mentions[].id` | `string` | Sí | formato uuid | — | Identificador de la mención. | `src/modules/community/dto/read-social.dto.ts:147` |
| `mentions[].mentionedProfileId` | `string` | Sí | formato uuid | — | Perfil mencionado. | `src/modules/community/dto/read-social.dto.ts:151` |
| `mentions[].offsetStart` | `number` | No | admite null | — | Posición inicial dentro del texto. | `src/modules/community/dto/read-social.dto.ts:155` |
| `mentions[].offsetEnd` | `number` | No | admite null | — | Posición final dentro del texto. | `src/modules/community/dto/read-social.dto.ts:159` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:152` |

### Flujos

_Se completa en la fase de flujos._

---

## 39. GET /community/posts/{postId}/comments

- **Origen:** CONTRATO
- **Nombre:** Comentarios de una publicación (hilo anidado)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listPostComments` — `src/modules/community/controllers/community-social.controller.ts:318`

### Qué es y para qué sirve (negocio)

Comentarios de una publicación (hilo anidado). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/posts/{postId}/comments` la atiende `CommunitySocialController.listPostComments` (src/modules/community/controllers/community-social.controller.ts:318). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listPostComments`. Lee community.comments, community.public_profiles, community.social_follows, community.social_posts, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:318` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-social.controller.ts:318` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommentsRepository.listRootsPage | `src/modules/community/repositories/comments.repository.ts:87` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunitySocialReadService.assertPostVisible → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CommentThreadPageDto>` · DTO `CommentThreadPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<CommentThreadItemDto>` | Sí | — | — | Comentarios raíz de la página, cada uno con sus respuestas. | `src/modules/community/dto/read-social.dto.ts:349` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del comentario. | `src/modules/community/dto/read-social.dto.ts:314` |
| `items[].authorProfileId` | `string` | Sí | formato uuid | — | Perfil autor. | `src/modules/community/dto/read-social.dto.ts:318` |
| `items[].bodyText` | `string` | Sí | — | — | Cuerpo del comentario. | `src/modules/community/dto/read-social.dto.ts:322` |
| `items[].parentCommentId` | `string` | No | formato uuid; admite null | — | Comentario padre, si es una respuesta. | `src/modules/community/dto/read-social.dto.ts:326` |
| `items[].threadDepth` | `number` | No | admite null | — | Profundidad dentro del hilo. | `src/modules/community/dto/read-social.dto.ts:330` |
| `items[].replyCount` | `number` | No | admite null | — | Cuántas respuestas tiene registradas. | `src/modules/community/dto/read-social.dto.ts:334` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se creó. | `src/modules/community/dto/read-social.dto.ts:338` |
| `items[].replies` | `array<CommentThreadItemDto>` | Sí | — | — | Respuestas anidadas de este comentario. | `src/modules/community/dto/read-social.dto.ts:342` |
| `count` | `number` | Sí | — | — | Cuántas raíces trae esta página. | `src/modules/community/dto/read-social.dto.ts:353` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:357` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:361` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:268` |

### Flujos

_Se completa en la fase de flujos._

---

## 40. POST /community/posts/{postId}/polls

- **Origen:** CONTRATO
- **Nombre:** Crear una encuesta con opciones sobre un post
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPollsController.createPoll` — `src/modules/community/controllers/community-polls.controller.ts:40`

### Qué es y para qué sirve (negocio)

Crear una encuesta con opciones sobre un post. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/posts/{postId}/polls` la atiende `CommunityPollsController.createPoll` (src/modules/community/controllers/community-polls.controller.ts:40). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePollDto` (4 campos, 2 obligatorios). Delega en `CommunityPollsService.createPoll`. Crea filas en community.poll_options, community.polls. Lee community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-polls.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-polls.controller.ts:40` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.poll_options` | ESCRIBE | CREA | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → PollsRepository.createOption | `src/modules/community/repositories/polls.repository.ts:90` |
| `community.polls` | ESCRIBE | CREA | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → PollsRepository.createPoll | `src/modules/community/repositories/polls.repository.ts:58` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePollDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `question` | `string` | Sí | longitud mínima 1; longitud máxima 300 | `@IsString()` `@MinLength(1)` `@MaxLength(300)` | Pregunta | `src/modules/community/dto/poll.dto.ts:28` |
| `options` | `array<string>` | Sí | mínimo 2 elemento(s); máximo 10 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@ArrayMaxSize(10)` `@IsString({ each: true })` | Opciones de la encuesta | `src/modules/community/dto/poll.dto.ts:38` |
| `allowsMultiple` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permite selección múltiple | `src/modules/community/dto/poll.dto.ts:46` |
| `closesAt` | `string` | No | — | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Fecha de cierre | `src/modules/community/dto/poll.dto.ts:55` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "question": "valor-ejemplo",
  "options": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "question": "valor-ejemplo",
  "options": [
    "valor-ejemplo",
    "valor-ejemplo"
  ],
  "allowsMultiple": true,
  "closesAt": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PollResponseDto>` · DTO `PollResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:234` |
| `optionIds` | `array<string>` | Sí | — | — | Ids de las opciones creadas | `src/modules/community/dto/responses.dto.ts:240` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-polls.controller.spec.ts:35` |

### Flujos

_Se completa en la fase de flujos._

---

## 41. GET /community/posts/{postId}/reactions

- **Origen:** CONTRATO
- **Nombre:** Reacciones de una publicación, agrupadas por tipo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getPostReactions` — `src/modules/community/controllers/community-social.controller.ts:335`

### Qué es y para qué sirve (negocio)

Reacciones de una publicación, agrupadas por tipo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/posts/{postId}/reactions` la atiende `CommunitySocialController.getPostReactions` (src/modules/community/controllers/community-social.controller.ts:335). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getPostReactions`. Lee community.public_profiles, community.reactions, community.social_follows, community.social_posts, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:335` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-social.controller.ts:335` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → ReactionsRepository.findByActorTarget | `src/modules/community/repositories/reactions.repository.ts:54` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunitySocialReadService.assertPostVisible → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ReactionSummaryDto>` · DTO `ReactionSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tallies` | `array<ReactionTallyDto>` | Sí | — | — | Recuento por tipo. | `src/modules/community/dto/read-social.dto.ts:191` |
| `tallies[].reactionTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de reacción. | `src/modules/community/dto/read-social.dto.ts:166` |
| `tallies[].reactionType` | `string` | No | admite null | — | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `src/modules/community/dto/read-social.dto.ts:180` |
| `tallies[].count` | `number` | Sí | — | — | Cantidad de reacciones de ese tipo. | `src/modules/community/dto/read-social.dto.ts:184` |
| `total` | `number` | Sí | — | — | Total de reacciones. | `src/modules/community/dto/read-social.dto.ts:195` |
| `actorReactionTypeConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `src/modules/community/dto/read-social.dto.ts:205` |
| `actorReactionType` | `string` | No | admite null | — | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `src/modules/community/dto/read-social.dto.ts:215` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:294` |

### Flujos

_Se completa en la fase de flujos._

---

## 42. GET /community/profiles/{profileId}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un perfil público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getProfile` — `src/modules/community/controllers/community-social.controller.ts:280`

### Qué es y para qué sirve (negocio)

Ficha de un perfil público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/{profileId}` la atiende `CommunitySocialController.getProfile` (src/modules/community/controllers/community-social.controller.ts:280). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getProfile`. Lee community.prestige_scores, community.public_profiles, community.user_blocks, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:280` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:280` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.prestige_scores` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → CommunityPrestigeRepository.findScoreByProfile | `src/modules/community/repositories/community-prestige.repository.ts:44` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → PublicProfilesRepository.listBadgesBySubject | `src/modules/community/repositories/public-profiles.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicProfileDetailDto>` · DTO `PublicProfileDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del perfil. | `src/modules/community/dto/read-social.dto.ts:54` |
| `tenantId` | `string` | Sí | formato uuid | — | Organización a la que pertenece. | `src/modules/community/dto/read-social.dto.ts:58` |
| `targetTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sujeto (usuario, profesional, organización). | `src/modules/community/dto/read-social.dto.ts:62` |
| `slug` | `string` | Sí | — | — | Ruta pública del perfil. | `src/modules/community/dto/read-social.dto.ts:66` |
| `displayName` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/read-social.dto.ts:70` |
| `headline` | `string` | No | admite null | — | Titular o especialidad declarada. | `src/modules/community/dto/read-social.dto.ts:74` |
| `biography` | `string` | No | admite null | — | Descripción larga. | `src/modules/community/dto/read-social.dto.ts:78` |
| `avatarFileId` | `string` | No | formato uuid; admite null | — | Foto de perfil (`common.files`). | `src/modules/community/dto/read-social.dto.ts:82` |
| `coverFileId` | `string` | No | formato uuid; admite null | — | Imagen de portada (`common.files`). | `src/modules/community/dto/read-social.dto.ts:86` |
| `verificationStatusConceptId` | `string` | No | formato uuid; admite null | — | Concept id del estado de verificación. | `src/modules/community/dto/read-social.dto.ts:90` |
| `acceptsReviews` | `boolean` | No | admite null | — | Si acepta reseñas de servicio. | `src/modules/community/dto/read-social.dto.ts:94` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del perfil. | `src/modules/community/dto/read-social.dto.ts:98` |
| `badges` | `array<VerifiedBadgeDto>` | Sí | — | — | Sellos de verificación vigentes. | `src/modules/community/dto/read-social.dto.ts:102` |
| `badges[].id` | `string` | Sí | formato uuid | — | Identificador del sello. | `src/modules/community/dto/read-social.dto.ts:12` |
| `badges[].badgeTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sello. | `src/modules/community/dto/read-social.dto.ts:16` |
| `badges[].verificationMethodConceptId` | `string` | Sí | formato uuid | — | Concept id del método con que se verificó. | `src/modules/community/dto/read-social.dto.ts:20` |
| `badges[].validFrom` | `string` | No | formato date-time; admite null | — | Desde cuándo rige. | `src/modules/community/dto/read-social.dto.ts:24` |
| `badges[].validTo` | `string` | No | formato date-time; admite null | — | Hasta cuándo rige. | `src/modules/community/dto/read-social.dto.ts:28` |
| `prestige` | `PrestigeScoreDto` | No | — | — | Prestigio acumulado, si el perfil tiene saldo calculado. | `src/modules/community/dto/read-social.dto.ts:106` |
| `prestige.totalPoints` | `string` | No | — | — | Puntos acumulados (numeric, viaja como texto) | `src/modules/community/dto/read-social.dto.ts:35` |
| `prestige.levelConceptId` | `string` | No | formato uuid; admite null | — | Concept id del nivel alcanzado. | `src/modules/community/dto/read-social.dto.ts:39` |
| `prestige.rankPosition` | `number` | No | admite null | — | Posición en el ranking, si se calculó. | `src/modules/community/dto/read-social.dto.ts:43` |
| `prestige.calculatedAt` | `string` | No | formato date-time; admite null | — | Cuándo se recalculó por última vez. | `src/modules/community/dto/read-social.dto.ts:47` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:71` |

### Flujos

_Se completa en la fase de flujos._

---

## 43. GET /community/profiles/{profileId}/posts

- **Origen:** CONTRATO
- **Nombre:** Publicaciones de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listProfilePosts` — `src/modules/community/controllers/community-social.controller.ts:290`

### Qué es y para qué sirve (negocio)

Publicaciones de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/{profileId}/posts` la atiende `CommunitySocialController.listProfilePosts` (src/modules/community/controllers/community-social.controller.ts:290). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listProfilePosts`. Lee community.comments, community.public_profiles, community.reactions, community.social_follows, community.social_posts, community.user_blocks.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:290` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:290` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityEngagementService.ofPosts → CommentsRepository.countByTargets | `src/modules/community/repositories/comments.repository.ts:160` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityEngagementService.ofPosts → ReactionsRepository.listByActorTargets | `src/modules/community/repositories/reactions.repository.ts:164` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.filterVisiblePosts → FollowsRepository.listFollowedProfileIds | `src/modules/community/repositories/follows.repository.ts:82` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → PostsRepository.listByAuthorPage | `src/modules/community/repositories/posts.repository.ts:127` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.filterVisiblePosts → BlocksRepository.listBlockedPeers | `src/modules/community/repositories/blocks.repository.ts:87` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PostPageDto>` · DTO `PostPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PostListItemDto>` | Sí | — | — | Publicaciones de la página. | `src/modules/community/dto/read-social.dto.ts:295` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la publicación. | `src/modules/community/dto/read-social.dto.ts:222` |
| `items[].authorPublicProfileId` | `string` | Sí | formato uuid | — | Perfil autor. | `src/modules/community/dto/read-social.dto.ts:226` |
| `items[].postTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de publicación. | `src/modules/community/dto/read-social.dto.ts:230` |
| `items[].bodyText` | `string` | Sí | — | — | Cuerpo del texto. | `src/modules/community/dto/read-social.dto.ts:234` |
| `items[].visibilityConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la visibilidad declarada; nulo se lee como pública. | `src/modules/community/dto/read-social.dto.ts:238` |
| `items[].commentsEnabled` | `boolean` | No | admite null | — | Si admite comentarios. | `src/modules/community/dto/read-social.dto.ts:242` |
| `items[].publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-social.dto.ts:246` |
| `items[].editedAt` | `string` | No | formato date-time; admite null | — | Si fue editada, cuándo. | `src/modules/community/dto/read-social.dto.ts:250` |
| `items[].reactions` | `ReactionSummaryDto` | Sí | — | — | Reacciones de la publicación, con la del propio lector si tiene perfil. **Viaja con la fila y no en una lectura aparte** porque si no, la única forma de saber cuántas reacciones tiene cada publicación era pedir `GET /posts/{id}/reactions` una vez por tarjeta: cincuenta publicaciones, cincuenta peticiones. Sin esto, el conteo de la interfaz sólo podía ser el del gesto que el usuario acababa de hacer, y **al recargar volvía a cero** aunque la reacción estuviera guardada. | `src/modules/community/dto/read-social.dto.ts:263` |
| `items[].reactions.tallies` | `array<ReactionTallyDto>` | Sí | — | — | Recuento por tipo. | `src/modules/community/dto/read-social.dto.ts:191` |
| `items[].reactions.tallies[].reactionTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de reacción. | `src/modules/community/dto/read-social.dto.ts:166` |
| `items[].reactions.tallies[].reactionType` | `string` | No | admite null | — | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `src/modules/community/dto/read-social.dto.ts:180` |
| `items[].reactions.tallies[].count` | `number` | Sí | — | — | Cantidad de reacciones de ese tipo. | `src/modules/community/dto/read-social.dto.ts:184` |
| `items[].reactions.total` | `number` | Sí | — | — | Total de reacciones. | `src/modules/community/dto/read-social.dto.ts:195` |
| `items[].reactions.actorReactionTypeConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `src/modules/community/dto/read-social.dto.ts:205` |
| `items[].reactions.actorReactionType` | `string` | No | admite null | — | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `src/modules/community/dto/read-social.dto.ts:215` |
| `items[].commentCount` | `number` | Sí | — | — | Comentarios vigentes del hilo completo, raíces y respuestas. Por la misma razón que el resumen de reacciones: el contador no existe como columna —y agregarla sería agregar esquema por comodidad de una lectura—, se calcula agrupado al leer la página. | `src/modules/community/dto/read-social.dto.ts:273` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-social.dto.ts:299` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:303` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/community/dto/read-social.dto.ts:307` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:93` |

### Flujos

_Se completa en la fase de flujos._

---

## 44. POST /community/profiles/{profileId}/posts

- **Origen:** CONTRATO
- **Nombre:** Publicar un post con hashtags, media y menciones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.publishPost` — `src/modules/community/controllers/community-social.controller.ts:147`

### Qué es y para qué sirve (negocio)

Publicar un post con hashtags, media y menciones. Caso de uso UC-19-01: Publica post con hashtags, media y menciones. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/profiles/{profileId}/posts` la atiende `CommunitySocialController.publishPost` (src/modules/community/controllers/community-social.controller.ts:147). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePostDto` (14 campos, 1 obligatorio). Delega en `CommunitySocialService.publishPost`. Crea filas en community.content_hashtags, community.hashtags, community.mentions, community.post_media, community.social_posts. Actualiza community.hashtags. Lee common.file_versions, common.files, community.hashtags, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:147` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:147` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → CommunitySocialService.assertMediaFileUsableBy → AttachableFileService.assertUsableBy → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → CommunitySocialService.assertMediaFileUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |
| `community.content_hashtags` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.linkHashtag | `src/modules/community/repositories/posts.repository.ts:362` |
| `community.hashtags` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.upsertHashtag | `src/modules/community/repositories/posts.repository.ts:328` |
| `community.hashtags` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.upsertHashtag | `src/modules/community/repositories/posts.repository.ts:331` |
| `community.hashtags` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.upsertHashtag | `src/modules/community/repositories/posts.repository.ts:325` |
| `community.mentions` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.createMention | `src/modules/community/repositories/posts.repository.ts:410` |
| `community.post_media` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.createMedia | `src/modules/community/repositories/posts.repository.ts:303` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.social_posts` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.create | `src/modules/community/repositories/posts.repository.ts:276` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePostDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bodyText` | `string` | Sí | longitud mínima 1; longitud máxima 5000 | `@IsString()` `@MinLength(1)` `@MaxLength(5000)` | Texto del post (sin PHI identificable) | `src/modules/community/dto/post.dto.ts:101` |
| `postType` | `string` | No | valores: TEXT, POLL | `@IsOptional()` `@IsIn(['TEXT', 'POLL'])` | Tipo de post | `src/modules/community/dto/post.dto.ts:109` |
| `visibility` | `string` | No | valores: PUBLIC, FOLLOWERS, PRIVATE | `@IsOptional()` `@IsIn(['PUBLIC', 'FOLLOWERS', 'PRIVATE'])` | Quién puede leer el post. Omitirlo equivale a PUBLIC, que es como se leen las publicaciones anteriores a este campo. | `src/modules/community/dto/post.dto.ts:125` |
| `commentsEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Comentarios habilitados | `src/modules/community/dto/post.dto.ts:133` |
| `media` | `array<PostMediaInputDto>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => PostMediaInputDto)` | — | `src/modules/community/dto/post.dto.ts:144` |
| `media[].fileId` | `string` | No | formato uuid | `@IsUUID()` | Id del archivo (common.files) | `src/modules/community/dto/post.dto.ts:25` |
| `media[].mediaRole` | `string` | No | valores: IMAGE, VIDEO, DOCUMENT | `@IsOptional()` `@IsIn(['IMAGE', 'VIDEO', 'DOCUMENT'])` | Rol del medio | `src/modules/community/dto/post.dto.ts:40` |
| `media[].altText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/community/dto/post.dto.ts:49` |
| `media[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de despliegue | `src/modules/community/dto/post.dto.ts:58` |
| `hashtags` | `array<string>` | No | máximo 30 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(30)` `@IsString({ each: true })` | Hashtags (sin #) | `src/modules/community/dto/post.dto.ts:154` |
| `mentions` | `array<MentionInputDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => MentionInputDto)` | — | `src/modules/community/dto/post.dto.ts:165` |
| `mentions[].mentionedProfileId` | `string` | No | formato uuid | `@IsUUID()` | Perfil mencionado | `src/modules/community/dto/post.dto.ts:68` |
| `mentions[].offsetStart` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/community/dto/post.dto.ts:77` |
| `mentions[].offsetEnd` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/community/dto/post.dto.ts:86` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "bodyText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "bodyText": "valor-ejemplo",
  "postType": "TEXT",
  "visibility": "PUBLIC",
  "commentsEnabled": true,
  "media": [
    {
      "fileId": "00000000-0000-4000-8000-000000000001",
      "mediaRole": "IMAGE",
      "altText": "valor-ejemplo",
      "ordinal": 1
    }
  ],
  "hashtags": [
    "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  ],
  "mentions": [
    {
      "mentionedProfileId": "00000000-0000-4000-8000-000000000001",
      "offsetStart": 1,
      "offsetEnd": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<PostResponseDto>` · DTO `PostResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:45` |
| `authorPublicProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a author public profile. | `src/modules/community/dto/responses.dto.ts:51` |
| `publicationStatus` | `string` | Sí | — | — | Valor de publication status mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:57` |
| `mediaCount` | `number` | Sí | — | — | Nº de adjuntos persistidos | `src/modules/community/dto/responses.dto.ts:63` |
| `hashtagCount` | `number` | Sí | — | — | Nº de hashtags vinculados | `src/modules/community/dto/responses.dto.ts:69` |
| `publishedAt` | `string` | Sí | formato date-time; admite null | — | Valor de published at mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:75` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:59` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:62` |

### Flujos

_Se completa en la fase de flujos._

---

## 45. GET /community/profiles/{profileId}/reviews

- **Origen:** CONTRATO
- **Nombre:** Reviews publicadas de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityReviewsController.listProfileReviews` — `src/modules/community/controllers/community-reviews.controller.ts:67`

### Qué es y para qué sirve (negocio)

Reviews publicadas de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/{profileId}/reviews` la atiende `CommunityReviewsController.listProfileReviews` (src/modules/community/controllers/community-reviews.controller.ts:67). Exige sesión; el controlador no declara roles. Delega en `CommunityReviewsReadService.listProfileReviews`. Lee community.public_profiles, community.review_dimension_scores, community.review_responses, community.service_reviews.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-reviews.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-reviews.controller.ts:67` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.review_dimension_scores` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → ReviewsRepository.listDimensionScores | `src/modules/community/repositories/reviews.repository.ts:171` |
| `community.review_responses` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → ReviewsRepository.listResponses | `src/modules/community/repositories/reviews.repository.ts:180` |
| `community.service_reviews` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → ReviewsRepository.listByTargetPage | `src/modules/community/repositories/reviews.repository.ts:147` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ServiceReviewPageDto>` · DTO `ServiceReviewPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ServiceReviewDto>` | Sí | — | — | Reviews de la página. | `src/modules/community/dto/read-reviews.dto.ts:91` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la review. | `src/modules/community/dto/read-reviews.dto.ts:48` |
| `items[].targetPublicProfileId` | `string` | Sí | formato uuid | — | Perfil calificado. | `src/modules/community/dto/read-reviews.dto.ts:52` |
| `items[].overallRating` | `number` | Sí | — | — | Puntuación general. | `src/modules/community/dto/read-reviews.dto.ts:56` |
| `items[].reviewText` | `string` | No | admite null | — | Texto de la reseña. | `src/modules/community/dto/read-reviews.dto.ts:60` |
| `items[].reviewerDisplayModeConceptId` | `string` | No | formato uuid; admite null | — | Concept id del modo de presentación del autor (con nombre, anónimo). | `src/modules/community/dto/read-reviews.dto.ts:64` |
| `items[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de verificación de la reseña. | `src/modules/community/dto/read-reviews.dto.ts:68` |
| `items[].publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-reviews.dto.ts:72` |
| `items[].editedAt` | `string` | No | formato date-time; admite null | — | Si fue editada, cuándo. | `src/modules/community/dto/read-reviews.dto.ts:76` |
| `items[].dimensionScores` | `array<ReviewDimensionScoreDto>` | Sí | — | — | Puntuaciones por dimensión. | `src/modules/community/dto/read-reviews.dto.ts:80` |
| `items[].dimensionScores[].dimensionConceptId` | `string` | Sí | formato uuid | — | Concept id de la dimensión evaluada. | `src/modules/community/dto/read-reviews.dto.ts:7` |
| `items[].dimensionScores[].score` | `number` | Sí | — | — | Puntuación otorgada. | `src/modules/community/dto/read-reviews.dto.ts:11` |
| `items[].responses` | `array<ReviewResponseItemDto>` | Sí | — | — | Respuestas del calificado. | `src/modules/community/dto/read-reviews.dto.ts:84` |
| `items[].responses[].id` | `string` | Sí | formato uuid | — | Identificador de la respuesta. | `src/modules/community/dto/read-reviews.dto.ts:18` |
| `items[].responses[].responderPublicProfileId` | `string` | Sí | formato uuid | — | Perfil que respondió. | `src/modules/community/dto/read-reviews.dto.ts:22` |
| `items[].responses[].responseText` | `string` | Sí | — | — | Texto de la respuesta. | `src/modules/community/dto/read-reviews.dto.ts:26` |
| `items[].responses[].publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-reviews.dto.ts:30` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-reviews.dto.ts:95` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-reviews.dto.ts:99` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-reviews.dto.ts:103` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:319` |

### Flujos

_Se completa en la fase de flujos._

---

## 46. POST /community/profiles/{profileId}/reviews

- **Origen:** CONTRATO
- **Nombre:** Publicar una review verificada de servicio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityReviewsController.publishReview` — `src/modules/community/controllers/community-reviews.controller.ts:50`

### Qué es y para qué sirve (negocio)

Publicar una review verificada de servicio. Caso de uso UC-19-11: Publica review verificada de servicio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:23`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/profiles/{profileId}/reviews` la atiende `CommunityReviewsController.publishReview` (src/modules/community/controllers/community-reviews.controller.ts:50). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CommunityCreateReviewDto` (7 campos, 2 obligatorios). Delega en `CommunityReviewsService.publishReview`. Crea filas en community.review_dimension_scores, community.service_reviews. Lee clinical.encounter_participants, clinical.encounters, community.public_profiles, community.service_reviews.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-reviews.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-reviews.controller.ts:50` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → CommunityReviewsService.assertAtencionElegible | `src/modules/community/services/community-reviews.service.ts:138` |
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → CommunityReviewsService.assertAtencionElegible → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:167` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.review_dimension_scores` | ESCRIBE | CREA | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → ReviewsRepository.createDimensionScore | `src/modules/community/repositories/reviews.repository.ts:320` |
| `community.service_reviews` | ESCRIBE | CREA | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → ReviewsRepository.create | `src/modules/community/repositories/reviews.repository.ts:286` |
| `community.service_reviews` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → ReviewsRepository.findByReviewerEncounter | `src/modules/community/repositories/reviews.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `CommunityCreateReviewDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `verifiedEncounterId` | `string` | Sí | formato uuid | `@IsUUID()` | Atención que respalda la reseña (nunca se expone) | `src/modules/community/dto/review.dto.ts:59` |
| `overallRating` | `number` | Sí | mínimo 1; máximo 5 | `@IsInt()` `@Min(1)` `@Max(5)` | Calificación global 1..5 | `src/modules/community/dto/review.dto.ts:72` |
| `reviewText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Texto de la review | `src/modules/community/dto/review.dto.ts:81` |
| `displayMode` | `string` | No | valores: REAL_NAME, ANONYMOUS | `@IsOptional()` `@IsIn(['REAL_NAME', 'ANONYMOUS'])` | Modo de visualización del reviewer | `src/modules/community/dto/review.dto.ts:92` |
| `dimensions` | `array<ReviewDimensionInputDto>` | No | máximo 10 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(10)` `@ValidateNested({ each: true })` `@Type(() => ReviewDimensionInputDto)` | — | `src/modules/community/dto/review.dto.ts:103` |
| `dimensions[].dimension` | `string` | No | valores: COMMUNICATION, PUNCTUALITY, CLEANLINESS, OUTCOME | `@IsIn(['COMMUNICATION', 'PUNCTUALITY', 'CLEANLINESS', 'OUTCOME'])` | Dimensión | `src/modules/community/dto/review.dto.ts:28` |
| `dimensions[].score` | `number` | No | mínimo 1; máximo 5 | `@IsInt()` `@Min(1)` `@Max(5)` | Puntuación 1..5 | `src/modules/community/dto/review.dto.ts:37` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "verifiedEncounterId": "00000000-0000-4000-8000-000000000001",
  "overallRating": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "verifiedEncounterId": "00000000-0000-4000-8000-000000000001",
  "overallRating": 1,
  "reviewText": "valor-ejemplo",
  "displayMode": "REAL_NAME",
  "dimensions": [
    {
      "dimension": "COMMUNICATION",
      "score": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<ReviewResponseDto>` · DTO `ReviewResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:207` |
| `courseId` | `string` | Sí | formato uuid | — | Identificador asociado a course. | sin fuente |
| `rating` | `number` | Sí | — | — | Valor de rating mantenido por la instancia. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:309` |
| CONTROLADOR | `src/modules/community/controllers/community-reviews.controller.spec.ts:24` |

### Flujos

_Se completa en la fase de flujos._

---

## 47. POST /community/profiles/{profileId}/reviews/{reviewId}/responses

- **Origen:** CONTRATO
- **Nombre:** Responder una reseña de la propia vitrina
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityReviewsController.respondToReview` — `src/modules/community/controllers/community-reviews.controller.ts:87`

### Qué es y para qué sirve (negocio)

Responder una reseña de la propia vitrina. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/profiles/{profileId}/reviews/{reviewId}/responses` la atiende `CommunityReviewsController.respondToReview` (src/modules/community/controllers/community-reviews.controller.ts:87). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CommunityCreateReviewResponseDto` (1 campo, 1 obligatorio). Delega en `CommunityReviewsService.respondToReview`. Crea filas en community.review_responses. Lee community.public_profiles, community.review_responses, community.service_reviews.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-reviews.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId, reviewId | `src/modules/community/controllers/community-reviews.controller.ts:87` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.review_responses` | ESCRIBE | CREA | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → ReviewsRepository.createResponse | `src/modules/community/repositories/reviews.repository.ts:99` |
| `community.review_responses` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → ReviewsRepository.findResponseByResponder | `src/modules/community/repositories/reviews.repository.ts:74` |
| `community.service_reviews` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → ReviewsRepository.findById | `src/modules/community/repositories/reviews.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |
| `reviewId` | path | Sí | `string` | — |

### Cuerpo — DTO `CommunityCreateReviewResponseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `responseText` | `string` | Sí | longitud mínima 1; longitud máxima 4000 | `@IsString()` `@MinLength(1)` `@MaxLength(4000)` | Respuesta del profesional | `src/modules/community/dto/review.dto.ts:121` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "responseText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "responseText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-reviews.controller.spec.ts:35` |

### Flujos

_Se completa en la fase de flujos._

---

## 48. GET /community/profiles/by-slug/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un perfil público por su slug
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getProfileBySlug` — `src/modules/community/controllers/community-social.controller.ts:270`

### Qué es y para qué sirve (negocio)

Ficha de un perfil público por su slug. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/by-slug/{slug}` la atiende `CommunitySocialController.getProfileBySlug` (src/modules/community/controllers/community-social.controller.ts:270). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getProfileBySlug`. Lee community.prestige_scores, community.public_profiles, community.user_blocks, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:270` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.prestige_scores` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → CommunityPrestigeRepository.findScoreByProfile | `src/modules/community/repositories/community-prestige.repository.ts:44` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → PublicProfilesRepository.findBySlug | `src/modules/community/repositories/public-profiles.repository.ts:204` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → PublicProfilesRepository.listBadgesBySubject | `src/modules/community/repositories/public-profiles.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicProfileDetailDto>` · DTO `PublicProfileDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del perfil. | `src/modules/community/dto/read-social.dto.ts:54` |
| `tenantId` | `string` | Sí | formato uuid | — | Organización a la que pertenece. | `src/modules/community/dto/read-social.dto.ts:58` |
| `targetTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sujeto (usuario, profesional, organización). | `src/modules/community/dto/read-social.dto.ts:62` |
| `slug` | `string` | Sí | — | — | Ruta pública del perfil. | `src/modules/community/dto/read-social.dto.ts:66` |
| `displayName` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/read-social.dto.ts:70` |
| `headline` | `string` | No | admite null | — | Titular o especialidad declarada. | `src/modules/community/dto/read-social.dto.ts:74` |
| `biography` | `string` | No | admite null | — | Descripción larga. | `src/modules/community/dto/read-social.dto.ts:78` |
| `avatarFileId` | `string` | No | formato uuid; admite null | — | Foto de perfil (`common.files`). | `src/modules/community/dto/read-social.dto.ts:82` |
| `coverFileId` | `string` | No | formato uuid; admite null | — | Imagen de portada (`common.files`). | `src/modules/community/dto/read-social.dto.ts:86` |
| `verificationStatusConceptId` | `string` | No | formato uuid; admite null | — | Concept id del estado de verificación. | `src/modules/community/dto/read-social.dto.ts:90` |
| `acceptsReviews` | `boolean` | No | admite null | — | Si acepta reseñas de servicio. | `src/modules/community/dto/read-social.dto.ts:94` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del perfil. | `src/modules/community/dto/read-social.dto.ts:98` |
| `badges` | `array<VerifiedBadgeDto>` | Sí | — | — | Sellos de verificación vigentes. | `src/modules/community/dto/read-social.dto.ts:102` |
| `badges[].id` | `string` | Sí | formato uuid | — | Identificador del sello. | `src/modules/community/dto/read-social.dto.ts:12` |
| `badges[].badgeTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sello. | `src/modules/community/dto/read-social.dto.ts:16` |
| `badges[].verificationMethodConceptId` | `string` | Sí | formato uuid | — | Concept id del método con que se verificó. | `src/modules/community/dto/read-social.dto.ts:20` |
| `badges[].validFrom` | `string` | No | formato date-time; admite null | — | Desde cuándo rige. | `src/modules/community/dto/read-social.dto.ts:24` |
| `badges[].validTo` | `string` | No | formato date-time; admite null | — | Hasta cuándo rige. | `src/modules/community/dto/read-social.dto.ts:28` |
| `prestige` | `PrestigeScoreDto` | No | — | — | Prestigio acumulado, si el perfil tiene saldo calculado. | `src/modules/community/dto/read-social.dto.ts:106` |
| `prestige.totalPoints` | `string` | No | — | — | Puntos acumulados (numeric, viaja como texto) | `src/modules/community/dto/read-social.dto.ts:35` |
| `prestige.levelConceptId` | `string` | No | formato uuid; admite null | — | Concept id del nivel alcanzado. | `src/modules/community/dto/read-social.dto.ts:39` |
| `prestige.rankPosition` | `number` | No | admite null | — | Posición en el ranking, si se calculó. | `src/modules/community/dto/read-social.dto.ts:43` |
| `prestige.calculatedAt` | `string` | No | formato date-time; admite null | — | Cuándo se recalculó por última vez. | `src/modules/community/dto/read-social.dto.ts:47` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 49. GET /community/profiles/me

- **Origen:** CONTRATO
- **Nombre:** Consultar la vitrina pública propia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getOwnProfile` — `src/modules/community/controllers/community-social.controller.ts:100`

### Qué es y para qué sirve (negocio)

Consultar la vitrina pública propia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/me` la atiende `CommunitySocialController.getOwnProfile` (src/modules/community/controllers/community-social.controller.ts:100). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.getOwnProfile`. Lee community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:100` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getOwnProfile → CommunitySocialService.getOwnProfile → CommunitySocialService.vitrinaDe → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OwnPublicProfileDto | null>` · DTO `OwnPublicProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/community/dto/own-public-profile.dto.ts:166` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/community/dto/own-public-profile.dto.ts:169` |
| `targetId` | `string` | Sí | formato uuid | — | El sujeto que representa: el perfil profesional, o la cuenta. | `src/modules/community/dto/own-public-profile.dto.ts:173` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/own-public-profile.dto.ts:176` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/own-public-profile.dto.ts:179` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/own-public-profile.dto.ts:182` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/own-public-profile.dto.ts:185` |
| `acceptsReviews` | `boolean` | Sí | admite null | — | — | `src/modules/community/dto/own-public-profile.dto.ts:188` |
| `visibility` | `string` | Sí | valores: PUBLIC, PRIVATE | — | Si la vitrina está listada en el directorio público. Se devuelve como el código y no como el concept id: es la única forma de que la pantalla de edición muestre el interruptor en la posición correcta sin tener que resolver un uuid contra el catálogo de conceptos. `PRIVATE` cubre también la columna nula — las vitrinas anteriores a este campo. | `src/modules/community/dto/own-public-profile.dto.ts:199` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid; admite null | — | Lo otorga la plataforma; se muestra, no se declara. | `src/modules/community/dto/own-public-profile.dto.ts:203` |
| `avatarFileId` | `string` | Sí | formato uuid; admite null | — | La foto de la vitrina, o `null` si todavía no subió ninguna. Viaja porque es una de las tres condiciones que hacen a un perfil "completo" para presentar un grupo público (TP-3, regla 06), y sin ella la pantalla no puede anticipar el rechazo: tendría que dejar que la persona llene el formulario entero para enterarse recién al enviar. | `src/modules/community/dto/own-public-profile.dto.ts:214` |
| `coverFileId` | `string` | Sí | formato uuid; admite null | — | La portada de la vitrina, o `null` si todavía no subió ninguna. | `src/modules/community/dto/own-public-profile.dto.ts:218` |
| `statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/community/dto/own-public-profile.dto.ts:221` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 50. PUT /community/profiles/me

- **Origen:** CONTRATO
- **Nombre:** Crear o actualizar la vitrina pública propia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.upsertOwnProfile` — `src/modules/community/controllers/community-social.controller.ts:112`

### Qué es y para qué sirve (negocio)

Crear o actualizar la vitrina pública propia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /community/profiles/me` la atiende `CommunitySocialController.upsertOwnProfile` (src/modules/community/controllers/community-social.controller.ts:112). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpsertOwnPublicProfileDto` (9 campos, 3 obligatorios). Delega en `CommunitySocialService.upsertOwnProfile`. Crea filas en community.public_profiles. Lee common.file_versions, common.files, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → AttachableFileService.assertUsableBy → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:231` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → PublicProfilesRepository.findBySlug | `src/modules/community/repositories/public-profiles.repository.ts:204` |

### Cuerpo — DTO `UpsertOwnPublicProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Organización propietaria | `src/modules/community/dto/own-public-profile.dto.ts:47` |
| `slug` | `string` | Sí | longitud mínima 3; longitud máxima 120; patrón runtime /^[a-z0-9]+(?:-[a-z0-9]+)*$/ | `@IsString()` `@MinLength(3)` `@MaxLength(120)` `@Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, { message: 'El slug sólo admite minúsculas, números y guiones, sin guiones al principio ni al final.', })` | Slug único legible | `src/modules/community/dto/own-public-profile.dto.ts:64` |
| `displayName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre visible | `src/modules/community/dto/own-public-profile.dto.ts:70` |
| `headline` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Titular de una línea | `src/modules/community/dto/own-public-profile.dto.ts:77` |
| `biography` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Presentación pública | `src/modules/community/dto/own-public-profile.dto.ts:83` |
| `acceptsReviews` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Acepta reseñas | `src/modules/community/dto/own-public-profile.dto.ts:89` |
| `visibility` | `string` | No | valores: PUBLIC, PRIVATE | `@IsOptional()` `@IsIn(['PUBLIC', 'PRIVATE'])` | Listar la vitrina en el directorio público | `src/modules/community/dto/own-public-profile.dto.ts:116` |
| `avatarFileId` | `object` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | Archivo ya subido que será el avatar; null lo quita | `src/modules/community/dto/own-public-profile.dto.ts:137` |
| `coverFileId` | `object` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | Archivo ya subido que será la portada; null la quita | `src/modules/community/dto/own-public-profile.dto.ts:153` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "acceptsReviews": true,
  "visibility": "PUBLIC",
  "avatarFileId": {},
  "coverFileId": {}
}
```

</details>

### Respuesta — `Promise<OwnPublicProfileDto>` · DTO `OwnPublicProfileDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/community/dto/own-public-profile.dto.ts:166` |
| `tenantId` | `string` | Sí | formato uuid | — | — | `src/modules/community/dto/own-public-profile.dto.ts:169` |
| `targetId` | `string` | Sí | formato uuid | — | El sujeto que representa: el perfil profesional, o la cuenta. | `src/modules/community/dto/own-public-profile.dto.ts:173` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/own-public-profile.dto.ts:176` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/own-public-profile.dto.ts:179` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/own-public-profile.dto.ts:182` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/own-public-profile.dto.ts:185` |
| `acceptsReviews` | `boolean` | Sí | admite null | — | — | `src/modules/community/dto/own-public-profile.dto.ts:188` |
| `visibility` | `string` | Sí | valores: PUBLIC, PRIVATE | — | Si la vitrina está listada en el directorio público. Se devuelve como el código y no como el concept id: es la única forma de que la pantalla de edición muestre el interruptor en la posición correcta sin tener que resolver un uuid contra el catálogo de conceptos. `PRIVATE` cubre también la columna nula — las vitrinas anteriores a este campo. | `src/modules/community/dto/own-public-profile.dto.ts:199` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid; admite null | — | Lo otorga la plataforma; se muestra, no se declara. | `src/modules/community/dto/own-public-profile.dto.ts:203` |
| `avatarFileId` | `string` | Sí | formato uuid; admite null | — | La foto de la vitrina, o `null` si todavía no subió ninguna. Viaja porque es una de las tres condiciones que hacen a un perfil "completo" para presentar un grupo público (TP-3, regla 06), y sin ella la pantalla no puede anticipar el rechazo: tendría que dejar que la persona llene el formulario entero para enterarse recién al enviar. | `src/modules/community/dto/own-public-profile.dto.ts:214` |
| `coverFileId` | `string` | Sí | formato uuid; admite null | — | La portada de la vitrina, o `null` si todavía no subió ninguna. | `src/modules/community/dto/own-public-profile.dto.ts:218` |
| `statusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/community/dto/own-public-profile.dto.ts:221` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:99` |

### Flujos

_Se completa en la fase de flujos._

---

## 51. GET /community/profiles/me/stats

- **Origen:** CONTRATO
- **Nombre:** Estadísticas de la vitrina pública propia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.ownProfileStats` — `src/modules/community/controllers/community-social.controller.ts:133`

### Qué es y para qué sirve (negocio)

Estadísticas de la vitrina pública propia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/me/stats` la atiende `CommunitySocialController.ownProfileStats` (src/modules/community/controllers/community-social.controller.ts:133). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.getOwnProfileStats`. Lee community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:133` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.ownProfileStats → CommunitySocialService.getOwnProfileStats → CommunitySocialService.vitrinaDe → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:189` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ProfileStatsDto>` · DTO `ProfileStatsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `windowDays` | `number` | Sí | — | — | Días que cubre la ventana | `src/modules/community/dto/profile-stats.dto.ts:25` |
| `views` | `number` | Sí | — | — | Visitas a la ficha en la ventana | `src/modules/community/dto/profile-stats.dto.ts:28` |
| `searchAppearances` | `number` | Sí | — | — | Apariciones en resultados en la ventana | `src/modules/community/dto/profile-stats.dto.ts:31` |
| `daily` | `array<ProfileStatsDayDto>` | Sí | — | — | Del más viejo al más nuevo | `src/modules/community/dto/profile-stats.dto.ts:37` |
| `daily[].date` | `string` | Sí | — | — | Día en YYYY-MM-DD (UTC) | `src/modules/community/dto/profile-stats.dto.ts:6` |
| `daily[].views` | `number` | Sí | — | — | Visitas a la ficha pública ese día | `src/modules/community/dto/profile-stats.dto.ts:9` |
| `daily[].searchAppearances` | `number` | Sí | — | — | Veces que apareció en resultados ese día | `src/modules/community/dto/profile-stats.dto.ts:12` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 52. POST /community/public-profiles

- **Origen:** CONTRATO
- **Nombre:** Crear un perfil público (bootstrap del grafo social)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.createProfile` — `src/modules/community/controllers/community-social.controller.ts:78`

### Qué es y para qué sirve (negocio)

Crear un perfil público (bootstrap del grafo social). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/public-profiles` la atiende `CommunitySocialController.createProfile` (src/modules/community/controllers/community-social.controller.ts:78). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePublicProfileDto` (9 campos, 4 obligatorios). Delega en `CommunitySocialService.createProfile`. Crea filas en community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-social.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.createProfile → CommunitySocialService.createProfile → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:231` |

### Cuerpo — DTO `CreatePublicProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant propietario | `src/modules/community/dto/public-profile.dto.ts:26` |
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del sujeto proyectado (user/patient/org de otro módulo) | `src/modules/community/dto/public-profile.dto.ts:36` |
| `targetType` | `string` | No | valores: USER, PRACTITIONER, ORGANIZATION | `@IsOptional()` `@IsIn(['USER', 'PRACTITIONER', 'ORGANIZATION'])` | Tipo de sujeto | `src/modules/community/dto/public-profile.dto.ts:47` |
| `slug` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@MinLength(1)` `@MaxLength(120)` | Slug único legible | `src/modules/community/dto/public-profile.dto.ts:56` |
| `displayName` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre visible | `src/modules/community/dto/public-profile.dto.ts:65` |
| `headline` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/community/dto/public-profile.dto.ts:74` |
| `biography` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/community/dto/public-profile.dto.ts:83` |
| `visibility` | `string` | No | valores: PUBLIC, PRIVATE | `@IsOptional()` `@IsIn(['PUBLIC', 'PRIVATE'])` | Visibilidad de la vitrina; omitirla la deja privada | `src/modules/community/dto/public-profile.dto.ts:104` |
| `acceptsReviews` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Acepta reviews de servicio | `src/modules/community/dto/public-profile.dto.ts:112` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "targetType": "USER",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "visibility": "PUBLIC",
  "acceptsReviews": true
}
```

</details>

### Respuesta — `Promise<PublicProfileResponseDto>` · DTO `PublicProfileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:18` |
| `slug` | `string` | Sí | — | — | Valor de slug mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:24` |
| `displayName` | `string` | Sí | — | — | Valor de display name mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:30` |
| `status` | `string` | Sí | — | — | Valor de status mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:36` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:41` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:55` |

### Flujos

_Se completa en la fase de flujos._

---

## 53. PUT /community/reactions

- **Origen:** CONTRATO
- **Nombre:** Reaccionar a contenido (upsert una reacción por actor/objeto)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.react` — `src/modules/community/controllers/community-social.controller.ts:170`

### Qué es y para qué sirve (negocio)

Reaccionar a contenido (upsert una reacción por actor/objeto). Caso de uso UC-19-03: Reacciona (upsert una reacción por actor/objeto). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /community/reactions` la atiende `CommunitySocialController.react` (src/modules/community/controllers/community-social.controller.ts:170). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ReactionDto` (4 campos, 4 obligatorios). Delega en `CommunitySocialService.react`. Crea filas en community.reactions. Actualiza community.reactions. Lee community.public_profiles, community.reactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:82` |
| `community.reactions` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.react → CommunitySocialService.react | `src/modules/community/services/community-social.service.ts:658` |
| `community.reactions` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → ReactionsRepository.create | `src/modules/community/repositories/reactions.repository.ts:179` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → ReactionsRepository.findByActorTarget | `src/modules/community/repositories/reactions.repository.ts:54` |

### Cuerpo — DTO `ReactionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `actorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que reacciona | `src/modules/community/dto/reaction.dto.ts:11` |
| `reactableType` | `string` | Sí | valores: POST, COMMENT, REVIEW | `@IsIn(['POST', 'COMMENT', 'REVIEW'])` | Tipo de objeto | `src/modules/community/dto/reaction.dto.ts:21` |
| `reactableRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del objeto | `src/modules/community/dto/reaction.dto.ts:28` |
| `reactionType` | `string` | Sí | valores: LIKE, LOVE, INSIGHTFUL, CELEBRATE, SUPPORT | `@IsIn(['LIKE', 'LOVE', 'INSIGHTFUL', 'CELEBRATE', 'SUPPORT'])` | Tipo de reacción | `src/modules/community/dto/reaction.dto.ts:38` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "actorProfileId": "00000000-0000-4000-8000-000000000001",
  "reactableType": "POST",
  "reactableRefId": "00000000-0000-4000-8000-000000000001",
  "reactionType": "LIKE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "actorProfileId": "00000000-0000-4000-8000-000000000001",
  "reactableType": "POST",
  "reactableRefId": "00000000-0000-4000-8000-000000000001",
  "reactionType": "LIKE"
}
```

</details>

### Respuesta — `Promise<ReactionResponseDto>` · DTO `ReactionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:105` |
| `created` | `boolean` | Sí | — | — | true si se creó, false si se actualizó una existente | `src/modules/community/dto/responses.dto.ts:113` |
| `reactionType` | `string` | Sí | — | — | Valor de reaction type mantenido por la instancia. | `src/modules/community/dto/responses.dto.ts:119` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:283` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:86` |

### Flujos

_Se completa en la fase de flujos._

---

## 54. POST /community/reports

- **Origen:** CONTRATO
- **Nombre:** Reportar contenido y encolar moderación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.report` — `src/modules/community/controllers/community-moderation.controller.ts:54`

### Qué es y para qué sirve (negocio)

Reportar contenido y encolar moderación. Caso de uso UC-19-08: Reporta contenido y encola moderación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:20`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/reports` la atiende `CommunityModerationController.report` (src/modules/community/controllers/community-moderation.controller.ts:54). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateReportDto` (4 campos, 3 obligatorios). Delega en `CommunityModerationService.report`. Crea filas en community.content_reports, community.moderation_queue. Lee community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-moderation.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.content_reports` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.report → CommunityModerationService.report → ModerationRepository.createReport | `src/modules/community/repositories/moderation.repository.ts:190` |
| `community.moderation_queue` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.report → CommunityModerationService.report → ModerationRepository.createQueue | `src/modules/community/repositories/moderation.repository.ts:255` |
| `community.moderation_queue` | LEE | LEE | DIRECTA | CommunityModerationController.report → CommunityModerationService.report → ModerationRepository.findOpenQueueForContent | `src/modules/community/repositories/moderation.repository.ts:241` |

### Cuerpo — DTO `CreateReportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetType` | `string` | Sí | valores: POST, COMMENT, PROFILE, MESSAGE, REVIEW | `@IsIn(['POST', 'COMMENT', 'PROFILE', 'MESSAGE', 'REVIEW'])` | Tipo de contenido reportado | `src/modules/community/dto/report.dto.ts:14` |
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del contenido reportado | `src/modules/community/dto/report.dto.ts:21` |
| `reason` | `string` | Sí | valores: SPAM, ABUSE, MISINFORMATION, PHI, OTHER | `@IsIn(['SPAM', 'ABUSE', 'MISINFORMATION', 'PHI', 'OTHER'])` | Motivo | `src/modules/community/dto/report.dto.ts:31` |
| `detailText` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | Detalle libre | `src/modules/community/dto/report.dto.ts:40` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetType": "POST",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reason": "SPAM"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetType": "POST",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reason": "SPAM",
  "detailText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<ReportResponseDto>` · DTO `ReportResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:164` |
| `moderationQueueId` | `string` | Sí | formato uuid | — | Entrada de cola de moderación asociada | `src/modules/community/dto/responses.dto.ts:173` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:44` |

### Flujos

_Se completa en la fase de flujos._

---

## 55. GET /community/topics

- **Origen:** CONTRATO
- **Nombre:** Temas de la comunidad
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityTopicsController.listTopics` — `src/modules/community/controllers/community-topics.controller.ts:27`

### Qué es y para qué sirve (negocio)

Temas de la comunidad. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/topics` la atiende `CommunityTopicsController.listTopics` (src/modules/community/controllers/community-topics.controller.ts:27). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.listTopics`. Lee community.topics.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-topics.controller.ts:27` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.topics` | LEE | LEE | DIRECTA | CommunityTopicsController.listTopics → CommunityGroupsReadService.listTopics → GroupsRepository.listTopics | `src/modules/community/repositories/groups.repository.ts:414` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<TopicPageDto>` · DTO `TopicPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<TopicListItemDto>` | Sí | — | — | Temas devueltos. | `src/modules/community/dto/group-wall.dto.ts:252` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del tema. | `src/modules/community/dto/group-wall.dto.ts:229` |
| `items[].code` | `string` | Sí | — | — | Código estable. | `src/modules/community/dto/group-wall.dto.ts:233` |
| `items[].name` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/group-wall.dto.ts:237` |
| `items[].parentTopicId` | `string` | No | formato uuid; admite null | — | Tema padre, si cuelga de otro. | `src/modules/community/dto/group-wall.dto.ts:241` |
| `items[].specialtyConceptId` | `string` | No | formato uuid; admite null | — | Especialidad con la que se corresponde, si se declaró. | `src/modules/community/dto/group-wall.dto.ts:245` |
| `count` | `number` | Sí | — | — | Cuántos trae. | `src/modules/community/dto/group-wall.dto.ts:256` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/group-wall.dto.ts:260` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 56. GET /f/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de una farmacia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getPharmacy` — `src/modules/community/controllers/community-public.controller.ts:428`

### Qué es y para qué sirve (negocio)

Ficha pública de una farmacia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /f/{slug}` la atiende `CommunityPublicController.getPharmacy` (src/modules/community/controllers/community-public.controller.ts:428). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:428` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:428` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:547` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1044` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1015` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:808` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1029` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:869` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:655` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:361` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:364` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:367` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:370` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:373` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:376` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:379` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:382` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:385` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:388` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:391` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:394` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:401` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:416` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:419` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:425` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:428` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:431` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 57. GET /internal/community/feed/pending

- **Origen:** CONTRATO
- **Nombre:** Publicaciones publicadas sin fan-out
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityFeedController.pending` — `src/modules/community/controllers/community-feed.controller.ts:69`

### Qué es y para qué sirve (negocio)

Publicaciones publicadas sin fan-out. Caso de uso UC-19-15: Lote de posts publicados sin repartir, con sus seguidores. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:28`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /internal/community/feed/pending` la atiende `CommunityFeedController.pending` (src/modules/community/controllers/community-feed.controller.ts:69). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `CommunityFeedService.pendingFanout`. Lee community.feed_items, community.social_follows, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-feed.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.feed_items` | LEE | LEE | DIRECTA | CommunityFeedController.pending → CommunityFeedService.pendingFanout → FeedRepository.listFannedOutSourceRefs | `src/modules/community/repositories/feed.repository.ts:142` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunityFeedController.pending → CommunityFeedService.pendingFanout → FollowsRepository.listFollowerIdsOf | `src/modules/community/repositories/follows.repository.ts:108` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityFeedController.pending → CommunityFeedService.pendingFanout → PostsRepository.listPublishedSince | `src/modules/community/repositories/posts.repository.ts:175` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FeedPendingResponseDto>` · DTO `FeedPendingResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<FeedPendingItemDto>` | Sí | — | — | Publicaciones pendientes del lote. | `src/modules/community/dto/feed.dto.ts:68` |
| `items[].postId` | `string` | Sí | formato uuid | — | Post publicado sin fan-out | `src/modules/community/dto/feed.dto.ts:43` |
| `items[].authorProfileId` | `string` | Sí | formato uuid | — | Perfil autor | `src/modules/community/dto/feed.dto.ts:47` |
| `items[].followerProfileIds` | `array<string>` | Sí | — | — | Perfiles destinatarios | `src/modules/community/dto/feed.dto.ts:56` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:349` |

### Flujos

_Se completa en la fase de flujos._

---

## 58. POST /internal/community/feed/rebuild

- **Origen:** CONTRATO
- **Nombre:** Generar feed (fan-out y ranking)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityFeedController.rebuild` — `src/modules/community/controllers/community-feed.controller.ts:52`

### Qué es y para qué sirve (negocio)

Generar feed (fan-out y ranking). Caso de uso UC-19-15: Fan-out del feed (lo dispara worker-community). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:27`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/feed/rebuild` la atiende `CommunityFeedController.rebuild` (src/modules/community/controllers/community-feed.controller.ts:52). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `RebuildFeedDto` (3 campos, 2 obligatorios). Delega en `CommunityFeedService.rebuild`. Crea filas en community.feed_items. Lee community.feed_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-feed.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.feed_items` | ESCRIBE | CREA | DIRECTA | CommunityFeedController.rebuild → CommunityFeedService.rebuild → FeedRepository.create | `src/modules/community/repositories/feed.repository.ts:51` |
| `community.feed_items` | LEE | LEE | DIRECTA | CommunityFeedController.rebuild → CommunityFeedService.rebuild → FeedRepository.findByOwnerSource | `src/modules/community/repositories/feed.repository.ts:75` |

### Cuerpo — DTO `RebuildFeedDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Post fuente publicado | `src/modules/community/dto/feed.dto.ts:14` |
| `followerProfileIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@IsUUID('4', { each: true })` | Perfiles destinatarios (seguidores) | `src/modules/community/dto/feed.dto.ts:25` |
| `origin` | `string` | No | valores: FOLLOWING, GROUP, TOPIC, SUGGESTED, PROMOTED | `@IsOptional()` `@IsIn(['FOLLOWING', 'GROUP', 'TOPIC', 'SUGGESTED', 'PROMOTED'])` | Origen del item | `src/modules/community/dto/feed.dto.ts:36` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceRefId": "00000000-0000-4000-8000-000000000001",
  "followerProfileIds": [
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceRefId": "00000000-0000-4000-8000-000000000001",
  "followerProfileIds": [
    "valor-ejemplo"
  ],
  "origin": "FOLLOWING"
}
```

</details>

### Respuesta — `Promise<FeedRebuildResponseDto>` · DTO `FeedRebuildResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `itemsCreated` | `number` | Sí | — | — | Nº de items de feed insertados | `src/modules/community/dto/responses.dto.ts:273` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:363` |
| CONTROLADOR | `src/modules/community/controllers/community-feed.controller.spec.ts:19` |

### Flujos

_Se completa en la fase de flujos._

---

## 59. GET /internal/community/search/health

- **Origen:** CONTRATO
- **Nombre:** Estado del índice del directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySearchIndexController.health` — `src/modules/community/controllers/community-search-index.controller.ts:72`

### Qué es y para qué sirve (negocio)

Estado del índice del directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /internal/community/search/health` la atiende `CommunitySearchIndexController.health` (src/modules/community/controllers/community-search-index.controller.ts:72). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN. Delega en `CommunitySearchIndexService.health`. Lee community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `src/modules/community/controllers/community-search-index.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySearchIndexController.health → CommunitySearchIndexService.health → PublicSearchRepository.countIndexable | `src/modules/community/repositories/public-search.repository.ts:511` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchIndexHealthDto>` · DTO `SearchIndexHealthDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `available` | `boolean` | Sí | — | — | Si el cluster de búsqueda responde | `src/modules/community/dto/search-index.dto.ts:39` |
| `profiles` | `number` | Sí | — | — | Perfiles públicos en la base | `src/modules/community/dto/search-index.dto.ts:42` |
| `documents` | `number` | Sí | admite null | — | Documentos en el índice; `null` si el índice no responde | `src/modules/community/dto/search-index.dto.ts:48` |
| `serving` | `boolean` | Sí | — | — | Si el buscador público está sirviéndose del índice (y no del SQL) | `src/modules/community/dto/search-index.dto.ts:54` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 60. POST /internal/community/search/reindex

- **Origen:** CONTRATO
- **Nombre:** Reindexar el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySearchIndexController.reindex` — `src/modules/community/controllers/community-search-index.controller.ts:47`

### Qué es y para qué sirve (negocio)

Reindexar el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/search/reindex` la atiende `CommunitySearchIndexController.reindex` (src/modules/community/controllers/community-search-index.controller.ts:47). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN. Valida el cuerpo como `ReindexRequestDto` (1 campo, 0 obligatorios). Delega en `CommunitySearchIndexService.reindexAll`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `src/modules/community/controllers/community-search-index.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:547` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → PublicSearchRepository.countIndexable | `src/modules/community/repositories/public-search.repository.ts:511` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |

### Cuerpo — DTO `ReindexRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recreate` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Recrear el índice antes de indexar. En `false` sólo se hace upsert, lo que conserva documentos de perfiles que ya no son públicos: usarlo sólo para rellenar, nunca para reconstruir. | `src/modules/community/dto/search-index.dto.ts:15` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "recreate": true
}
```

</details>

### Respuesta — `Promise<ReindexResponseDto>` · DTO `ReindexResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `indexed` | `number` | Sí | — | — | Documentos efectivamente indexados | `src/modules/community/dto/search-index.dto.ts:21` |
| `total` | `number` | Sí | — | — | Perfiles públicos que había que indexar | `src/modules/community/dto/search-index.dto.ts:24` |
| `confirmed` | `number` | Sí | — | — | Documentos que el índice confirma tener | `src/modules/community/dto/search-index.dto.ts:27` |
| `errors` | `boolean` | Sí | — | — | Si algún lote reportó errores parciales | `src/modules/community/dto/search-index.dto.ts:30` |
| `summary` | `string` | Sí | — | — | Rótulo legible: «indexados N de N» | `src/modules/community/dto/search-index.dto.ts:33` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 61. POST /internal/community/verification/badges

- **Origen:** CONTRATO
- **Nombre:** Emitir un sello a mano (auditado)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityVerificationController.grant` — `src/modules/community/controllers/community-verification.controller.ts:61`

### Qué es y para qué sirve (negocio)

Emitir un sello a mano (auditado). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/verification/badges` la atiende `CommunityVerificationController.grant` (src/modules/community/controllers/community-verification.controller.ts:61). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GrantBadgeDto` (3 campos, 1 obligatorio). Delega en `EntityManager.transactional`, `CommunityVerificationService.applyVerified`. Crea filas en audit.verified_badges_history, community.verified_badges. Actualiza community.public_profiles, community.verified_badges. Lee community.public_profiles, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-verification.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | CommunityVerificationController.grant → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityVerificationController.grant → CommunityVerificationService.applyVerified | `src/modules/community/services/community-verification.service.ts:175` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityVerificationController.grant → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityVerificationController.grant → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:94` |
| `community.verified_badges` | ESCRIBE | CREA | DIRECTA | CommunityVerificationController.grant → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.grant | `src/modules/community/repositories/verified-badges.repository.ts:103` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityVerificationController.grant → CommunityVerificationService.applyVerified → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |

### Cuerpo — DTO `GrantBadgeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | Sujeto de dominio (profesional, institución) | `src/modules/community/dto/verification.dto.ts:11` |
| `evidenceRef` | `string` | No | — | `@IsOptional()` `@IsString()` | Referencia a la evidencia que justifica el alta manual. Se guarda en el sello y queda en auditoría: es lo que hace revisable la escotilla. | `src/modules/community/dto/verification.dto.ts:20` |
| `validTo` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Hasta cuándo vale el sello (ISO). Sin esto no vence solo. | `src/modules/community/dto/verification.dto.ts:27` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "targetId": "00000000-0000-4000-8000-000000000001",
  "evidenceRef": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<GrantBadgeResponseDto>` · DTO `GrantBadgeResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `string` | Sí | valores: granted, renewed, no-profile | — | `no-profile` si el sujeto no tiene vitrina pública | `src/modules/community/dto/verification.dto.ts:36` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-verification.controller.spec.ts:76` |

### Flujos

_Se completa en la fase de flujos._

---

## 62. POST /internal/community/verification/badges/{targetId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Bajar los sellos de un sujeto (auditado)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityVerificationController.revoke` — `src/modules/community/controllers/community-verification.controller.ts:94`

### Qué es y para qué sirve (negocio)

Bajar los sellos de un sujeto (auditado). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/verification/badges/{targetId}/revoke` la atiende `CommunityVerificationController.revoke` (src/modules/community/controllers/community-verification.controller.ts:94). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RevokeBadgeDto` (1 campo, 0 obligatorios). Delega en `EntityManager.transactional`, `CommunityVerificationService.applyRevoked`. Crea filas en audit.verified_badges_history. Actualiza community.public_profiles, community.verified_badges. Lee community.public_profiles, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-verification.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | CommunityVerificationController.revoke → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityVerificationController.revoke → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges | `src/modules/community/services/community-verification.service.ts:249` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityVerificationController.revoke → CommunityVerificationService.applyRevoked → VerifiedBadgesRepository.findProfileByTarget | `src/modules/community/repositories/verified-badges.repository.ts:205` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityVerificationController.revoke → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.revoke | `src/modules/community/repositories/verified-badges.repository.ts:140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityVerificationController.revoke → CommunityVerificationService.applyRevoked → CommunityVerificationService.revokeProfileBadges → VerifiedBadgesRepository.findAllBySubject | `src/modules/community/repositories/verified-badges.repository.ts:73` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `targetId` | path | Sí | `string` | — |

### Cuerpo — DTO `RevokeBadgeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | valores: REVOKED, EXPIRED | `@IsOptional()` `@IsIn(['REVOKED', 'EXPIRED'])` | `REVOKED` = la autoridad retiró el respaldo; `EXPIRED` = sólo venció. No significan lo mismo y la pantalla los muestra distinto. | `src/modules/community/dto/verification.dto.ts:50` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "REVOKED"
}
```

</details>

### Respuesta — `Promise<{ revoked: number }>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-verification.controller.spec.ts:92` |

### Flujos

_Se completa en la fase de flujos._

---

## 63. POST /internal/community/verification/badges/expire-sweep

- **Origen:** CONTRATO
- **Nombre:** Bajar los sellos cuya vigencia ya venció
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityVerificationController.expireSweep` — `src/modules/community/controllers/community-verification.controller.ts:119`

### Qué es y para qué sirve (negocio)

Bajar los sellos cuya vigencia ya venció. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/verification/badges/expire-sweep` la atiende `CommunityVerificationController.expireSweep` (src/modules/community/controllers/community-verification.controller.ts:119). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `CommunityVerificationService.expireSweep`. Crea filas en audit.verified_badges_history. Actualiza community.public_profiles, community.verified_badges. Lee community.public_profiles, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-verification.controller.ts:119` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.verified_badges_history` | ESCRIBE | CREA | DIRECTA | CommunityVerificationController.expireSweep → CommunityVerificationService.expireSweep → VerifiedBadgesRepository.recordHistory | `src/modules/community/repositories/verified-badges.repository.ts:172` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityVerificationController.expireSweep → CommunityVerificationService.expireSweep | `src/modules/community/services/community-verification.service.ts:301` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityVerificationController.expireSweep → CommunityVerificationService.expireSweep | `src/modules/community/services/community-verification.service.ts:299` |
| `community.verified_badges` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityVerificationController.expireSweep → CommunityVerificationService.expireSweep → VerifiedBadgesRepository.revoke | `src/modules/community/repositories/verified-badges.repository.ts:140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityVerificationController.expireSweep → CommunityVerificationService.expireSweep → VerifiedBadgesRepository.findExpired | `src/modules/community/repositories/verified-badges.repository.ts:226` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<BadgeSweepResponseDto>` · DTO `BadgeSweepResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `expired` | `number` | Sí | — | — | Sellos que cayeron | `src/modules/community/dto/verification.dto.ts:56` |
| `profiles` | `number` | Sí | — | — | Perfiles que dejaron de estar verificados | `src/modules/community/dto/verification.dto.ts:59` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 64. GET /l/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de un laboratorio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getDiagnosticUnit` — `src/modules/community/controllers/community-public.controller.ts:436`

### Qué es y para qué sirve (negocio)

Ficha pública de un laboratorio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /l/{slug}` la atiende `CommunityPublicController.getDiagnosticUnit` (src/modules/community/controllers/community-public.controller.ts:436). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:436` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:436` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:547` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1044` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1015` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:808` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1029` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:869` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:655` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:361` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:364` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:367` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:370` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:373` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:376` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:379` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:382` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:385` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:388` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:391` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:394` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:401` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:416` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:419` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:425` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:428` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:431` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 65. GET /o/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de una organización
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getOrganization` — `src/modules/community/controllers/community-public.controller.ts:418`

### Qué es y para qué sirve (negocio)

Ficha pública de una organización. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /o/{slug}` la atiende `CommunityPublicController.getOrganization` (src/modules/community/controllers/community-public.controller.ts:418). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:418` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:418` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:547` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1044` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1015` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:808` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1029` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:869` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:655` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:361` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:364` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:367` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:370` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:373` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:376` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:379` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:382` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:385` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:388` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:391` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:394` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:401` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:416` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:419` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:425` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:428` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:431` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 66. GET /p/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de un profesional
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getPractitioner` — `src/modules/community/controllers/community-public.controller.ts:408`

### Qué es y para qué sirve (negocio)

Ficha pública de un profesional. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /p/{slug}` la atiende `CommunityPublicController.getPractitioner` (src/modules/community/controllers/community-public.controller.ts:408). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:408` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:408` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:547` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1044` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1015` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:808` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1029` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:869` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:655` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:361` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:364` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:367` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:370` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:373` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:376` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:379` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:382` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:385` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:388` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:391` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:394` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:401` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:416` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:419` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:425` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:428` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:431` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 67. GET /public/comments/{commentId}/replies

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Las respuestas de un comentario (AC-01-12, «Ver N respuestas»). Ruta propia y no un parámetro de la anterior: son dos recursos paginados distintos y el desplegable abre varios hilos a la vez. La justificación larga está en `CommunityPublicService.commentReplies`.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.commentReplies` — `src/modules/community/controllers/community-public.controller.ts:137`

### Qué es y para qué sirve (negocio)

Las respuestas de un comentario (AC-01-12, «Ver N respuestas»). Ruta propia y no un parámetro de la anterior: son dos recursos paginados distintos y el desplegable abre varios hilos a la vez. La justificación larga está en `CommunityPublicService.commentReplies`. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/comments/{commentId}/replies` la atiende `CommunityPublicController.commentReplies` (src/modules/community/controllers/community-public.controller.ts:137). Es una ruta pública: no exige token. Delega en `CommunityPublicService.commentReplies`. Lee community.comments, community.public_profiles, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:137` |
| PARAMETRO_RUTA | Deben ser UUID válidos: commentId | `src/modules/community/controllers/community-public.controller.ts:137` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:137` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.commentReplies → CommunityPublicService.commentReplies → PublicSearchRepository.findPostOfPublicComment | `src/modules/community/repositories/public-search.repository.ts:1302` |
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.commentReplies → CommunityPublicService.commentReplies → PublicSearchRepository.findPostOfPublicComment | `src/modules/community/repositories/public-search.repository.ts:1302` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.commentReplies → CommunityPublicService.commentReplies → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1123` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `commentId` | path | Sí | `string` | — |
| `cursor` | query | sin dato | `string` | — |
| `limit` | query | sin dato | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicCommentPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:97` |

### Flujos

_Se completa en la fase de flujos._

---

## 68. GET /public/media/{id}

- **Origen:** CONTRATO
- **Nombre:** Servir una imagen pública (avatar, portada o post)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getPublicMedia` — `src/modules/community/controllers/community-public.controller.ts:379`

### Qué es y para qué sirve (negocio)

Servir una imagen pública (avatar, portada o post). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/media/{id}` la atiende `CommunityPublicController.getPublicMedia` (src/modules/community/controllers/community-public.controller.ts:379). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getPublicMedia`. Lee common.file_versions, common.files, community.post_media, community.public_profiles, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:379` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/community/controllers/community-public.controller.ts:379` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:379` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → FileUploadService.downloadPublicMedia → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → FileUploadService.downloadPublicMedia → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicSearchRepository.isPublicPostMedia | `src/modules/community/repositories/public-search.repository.ts:1071` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicProfilesRepository.isPublicMedia | `src/modules/community/repositories/public-profiles.repository.ts:220` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicSearchRepository.isPublicPostMedia | `src/modules/community/repositories/public-search.repository.ts:1071` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 69. GET /public/nearby

- **Origen:** CONTRATO
- **Nombre:** Prestadores cercanos, en línea recta
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.nearby` — `src/modules/community/controllers/community-public.controller.ts:306`

### Qué es y para qué sirve (negocio)

Prestadores cercanos, en línea recta. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/nearby` la atiende `CommunityPublicController.nearby` (src/modules/community/controllers/community-public.controller.ts:306). Es una ruta pública: no exige token. Delega en `CommunityPublicService.nearby`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:306` |
| PARAMETRO_QUERY | lat (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | lng (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | radiusKm (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:306` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → PublicSearchRepository.nearbyProfiles | `src/modules/community/repositories/public-search.repository.ts:435` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → PublicSearchRepository.nearbyProfiles | `src/modules/community/repositories/public-search.repository.ts:464` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `lat` | query | Sí | `string` | — |
| `lng` | query | Sí | `string` | — |
| `radiusKm` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicNearbyPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 70. GET /public/posts

- **Origen:** CONTRATO
- **Nombre:** Últimas publicaciones de todos los profesionales
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.feedPublico` — `src/modules/community/controllers/community-public.controller.ts:76`

### Qué es y para qué sirve (negocio)

Últimas publicaciones de todos los profesionales. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/posts` la atiende `CommunityPublicController.feedPublico` (src/modules/community/controllers/community-public.controller.ts:76). Es una ruta pública: no exige token. Delega en `CommunityPublicService.feedPublico`. Lee community.comments, community.post_media, community.public_profiles, community.reactions, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:76` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:76` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublico → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1044` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublico → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1015` |
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublico → PublicSearchRepository.listFeedPublico | `src/modules/community/repositories/public-search.repository.ts:944` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublico → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1029` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublico → PublicSearchRepository.listFeedPublico | `src/modules/community/repositories/public-search.repository.ts:944` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicFeedPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 71. GET /public/posts/{postId}/comments

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** El hilo de comentarios raíz de una publicación (AC-01-11, AC-01-12).
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.postComments` — `src/modules/community/controllers/community-public.controller.ts:116`

### Qué es y para qué sirve (negocio)

El hilo de comentarios raíz de una publicación (AC-01-11, AC-01-12). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/posts/{postId}/comments` la atiende `CommunityPublicController.postComments` (src/modules/community/controllers/community-public.controller.ts:116). Es una ruta pública: no exige token. Delega en `CommunityPublicService.postComments`. Lee community.comments, community.public_profiles, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:116` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-public.controller.ts:116` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:116` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.postComments → CommunityPublicService.postComments → PublicSearchRepository.listPublicRootComments → PublicSearchRepository.listPublicComments | `src/modules/community/repositories/public-search.repository.ts:1396` |
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.postComments → CommunityPublicService.postComments → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1123` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.postComments → CommunityPublicService.postComments → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1123` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |
| `cursor` | query | sin dato | `string` | — |
| `limit` | query | sin dato | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicCommentPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:86` |

### Flujos

_Se completa en la fase de flujos._

---

## 72. GET /public/posts/{postId}/reactions

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Quién reaccionó a una publicación (AC-01-9). Va inmediatamente detrás de `public/posts` y comparte todo lo suyo: es `@Public()`, cae bajo el mismo límite de 60 por minuto por IP que declara la clase, se envuelve en `items`/`nextCursor`/`totalHint`/`generatedAt` y gana su `ETag` y su `Cache-Control` de `PublicCacheInterceptor`, que actúa sobre todo `GET` marcado `@Public()`. `ParseUUIDPipe` rechaza con 400 lo que no es un uuid antes de tocar la base —igual que en `public/media/:id`—; el resto de los «no» son un 404 indistinguible del «no existe».
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.postReactions` — `src/modules/community/controllers/community-public.controller.ts:101`

### Qué es y para qué sirve (negocio)

Quién reaccionó a una publicación (AC-01-9). Va inmediatamente detrás de `public/posts` y comparte todo lo suyo: es `@Public()`, cae bajo el mismo límite de 60 por minuto por IP que declara la clase, se envuelve en `items`/`nextCursor`/`totalHint`/`generatedAt` y gana su `ETag` y su `Cache-Control` de `PublicCacheInterceptor`, que actúa sobre todo `GET` marcado `@Public()`. `ParseUUIDPipe` rechaza con 400 lo que no es un uuid antes de tocar la base —igual que en `public/media/:id`—; el resto de los «no» son un 404 indistinguible del «no existe». Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/posts/{postId}/reactions` la atiende `CommunityPublicController.postReactions` (src/modules/community/controllers/community-public.controller.ts:101). Es una ruta pública: no exige token. Delega en `CommunityPublicService.postReactions`. Lee community.public_profiles, community.reactions, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:101` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-public.controller.ts:101` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:101` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.postReactions → CommunityPublicService.postReactions → PublicSearchRepository.listPostReactors | `src/modules/community/repositories/public-search.repository.ts:1184` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.postReactions → CommunityPublicService.postReactions → PublicSearchRepository.listPostReactors | `src/modules/community/repositories/public-search.repository.ts:1184` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.postReactions → CommunityPublicService.postReactions → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1123` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |
| `cursor` | query | sin dato | `string` | — |
| `limit` | query | sin dato | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicPostReactionPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:75` |

### Flujos

_Se completa en la fase de flujos._

---

## 73. GET /public/profiles/{prefijo}/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública por prefijo de vertical
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getProfileByPrefix` — `src/modules/community/controllers/community-public.controller.ts:349`

### Qué es y para qué sirve (negocio)

Ficha pública por prefijo de vertical. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/profiles/{prefijo}/{slug}` la atiende `CommunityPublicController.getProfileByPrefix` (src/modules/community/controllers/community-public.controller.ts:349). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:349` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:349` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:547` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1044` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1015` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:808` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1029` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:869` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:655` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `prefijo` | path | Sí | `string` | — |
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:361` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:364` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:367` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:370` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:373` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:376` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:379` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:382` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:385` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:388` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:391` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:394` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:401` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:416` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:419` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:425` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:428` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:431` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 74. GET /public/search

- **Origen:** CONTRATO
- **Nombre:** Buscador público unificado
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.search` — `src/modules/community/controllers/community-public.controller.ts:152`

### Qué es y para qué sirve (negocio)

Buscador público unificado. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search` la atiende `CommunityPublicController.search` (src/modules/community/controllers/community-public.controller.ts:152). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:152` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:307` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:272` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1344` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:45` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 75. GET /public/search/diagnostic-units

- **Origen:** CONTRATO
- **Nombre:** Laboratorios y centros de diagnóstico
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchDiagnosticUnits` — `src/modules/community/controllers/community-public.controller.ts:238`

### Qué es y para qué sirve (negocio)

Laboratorios y centros de diagnóstico. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/diagnostic-units` la atiende `CommunityPublicController.searchDiagnosticUnits` (src/modules/community/controllers/community-public.controller.ts:238). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:238` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:238` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:307` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:272` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1344` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:45` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 76. GET /public/search/insurers

- **Origen:** CONTRATO
- **Nombre:** Aseguradoras en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchInsurers` — `src/modules/community/controllers/community-public.controller.ts:255`

### Qué es y para qué sirve (negocio)

Aseguradoras en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/insurers` la atiende `CommunityPublicController.searchInsurers` (src/modules/community/controllers/community-public.controller.ts:255). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:255` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:255` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:307` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:272` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1344` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:45` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 77. GET /public/search/medications

- **Origen:** CONTRATO
- **Nombre:** Medicamentos ofertados públicamente
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchMedications` — `src/modules/community/controllers/community-public.controller.ts:289`

### Qué es y para qué sirve (negocio)

Medicamentos ofertados públicamente. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/medications` la atiende `CommunityPublicController.searchMedications` (src/modules/community/controllers/community-public.controller.ts:289). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:289` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:289` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:307` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:272` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1344` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:45` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 78. GET /public/search/organizations

- **Origen:** CONTRATO
- **Nombre:** Organizaciones en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchOrganizations` — `src/modules/community/controllers/community-public.controller.ts:214`

### Qué es y para qué sirve (negocio)

Organizaciones en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/organizations` la atiende `CommunityPublicController.searchOrganizations` (src/modules/community/controllers/community-public.controller.ts:214). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:214` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:214` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:307` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:272` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1344` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:45` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 79. GET /public/search/pharmacies

- **Origen:** CONTRATO
- **Nombre:** Farmacias en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchPharmacies` — `src/modules/community/controllers/community-public.controller.ts:272`

### Qué es y para qué sirve (negocio)

Farmacias en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/pharmacies` la atiende `CommunityPublicController.searchPharmacies` (src/modules/community/controllers/community-public.controller.ts:272). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:272` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:272` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:307` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:272` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1344` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:45` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 80. GET /public/search/practitioners

- **Origen:** CONTRATO
- **Nombre:** Profesionales en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchPractitioners` — `src/modules/community/controllers/community-public.controller.ts:177`

### Qué es y para qué sirve (negocio)

Profesionales en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/practitioners` la atiende `CommunityPublicController.searchPractitioners` (src/modules/community/controllers/community-public.controller.ts:177). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:177` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | verified (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:177` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:307` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:272` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1344` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:45` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `verified` | query | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:42` |

### Flujos

_Se completa en la fase de flujos._

---

## 81. GET /s/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de una aseguradora
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getInsurer` — `src/modules/community/controllers/community-public.controller.ts:446`

### Qué es y para qué sirve (negocio)

Ficha pública de una aseguradora. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:35`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /s/{slug}` la atiende `CommunityPublicController.getInsurer` (src/modules/community/controllers/community-public.controller.ts:446). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:446` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:446` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:547` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1044` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1015` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:808` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1029` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:836` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:869` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:789` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:655` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.señalesDe → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:720` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:610` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:361` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:364` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:367` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:370` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:373` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:376` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:379` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:382` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:385` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:388` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:391` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:394` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:401` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:416` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:419` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:425` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:428` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:431` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

