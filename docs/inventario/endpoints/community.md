<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `community`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 103 (99 en el contrato, 4 sólo en el código)
- **Riesgo:** ALTO 29 · MEDIO 9 · BAJO 65
- **Tablas distintas que tocan:** 68
- **Respuestas de error y detalle contractual:** `openapi/endpoints/community.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | DESCONOCIDO | `/` | Entero de un parámetro de consulta, o `undefined`. Un valor no numérico se ignora en vez de dar 400: el contrato promete que `limit` fuera de rango se **recorta**, y «abc» es tan fuera de rango como 9999. La única excepción son las coordenadas de `nearby`, que sí fallan. | BAJO | 0 | sesión (sin roles) |
| 2 | DESCONOCIDO | `/` | Decimal de un parámetro de consulta, o `undefined`. | BAJO | 0 | sesión (sin roles) |
| 3 | DESCONOCIDO | `/` | El vertical de `nearby`, o `undefined` si no es uno de los cuatro que acepta ese endpoint (ver ). Mismo criterio que `toInt`/`toBool`: un vertical inventado se ignora —el buscador cae a «todos»— en vez de romper la consulta con 400. | BAJO | 0 | sesión (sin roles) |
| 4 | DESCONOCIDO | `/` | Booleano de un parámetro; sólo `'true'` afirma. | BAJO | 0 | sesión (sin roles) |
| 5 | DELETE | `/community/blocks` | Levantar un bloqueo | ALTO | 5 | sesión (sin roles) |
| 6 | GET | `/community/blocks` | Bloqueos emitidos por un perfil | BAJO | 4 | sesión (sin roles) |
| 7 | POST | `/community/blocks` | Bloquear a un usuario | ALTO | 8 | sesión (sin roles) |
| 8 | DELETE | `/community/bookmarks` | Quitar un marcador | ALTO | 5 | sesión (sin roles) |
| 9 | GET | `/community/bookmarks` | Marcadores guardados por un perfil | BAJO | 4 | sesión (sin roles) |
| 10 | POST | `/community/bookmarks` | Guardar un bookmark en una colección | ALTO | 5 | sesión (sin roles) |
| 11 | POST | `/community/comments` | Comentar (hilo anidado) con contadores | ALTO | 10 | sesión (sin roles) |
| 12 | GET | `/community/comments/media/{fileId}/content` | Descargar el adjunto de un comentario (imagen, sticker o GIF) | BAJO | 10 | sesión (sin roles) |
| 13 | GET | `/community/conversations` | Conversaciones activas de un perfil | BAJO | 6 | sesión (sin roles) |
| 14 | POST | `/community/conversations` | Crear una conversación con participantes | ALTO | 8 | sesión (sin roles) |
| 15 | GET | `/community/conversations/{conversationId}/attachments/{fileId}/content` | Descargar el adjunto de una conversación (participante activo) | BAJO | 8 | sesión (sin roles) |
| 16 | GET | `/community/conversations/{conversationId}/messages` | Mensajes de una conversación | BAJO | 7 | sesión (sin roles) |
| 17 | POST | `/community/conversations/{conversationId}/messages` | Enviar un mensaje directo en la conversación | ALTO | 25 | sesión (sin roles) |
| 18 | DELETE | `/community/conversations/{conversationId}/messages/{messageId}` | Eliminar un mensaje propio | ALTO | 8 | sesión (sin roles) |
| 19 | PATCH | `/community/conversations/{conversationId}/messages/{messageId}` | Editar el texto de un mensaje propio | ALTO | 6 | sesión (sin roles) |
| 20 | PATCH | `/community/conversations/{conversationId}/participant` | Marcar la conversación como favorita, fijada o archivada | BAJO | 4 | sesión (sin roles) |
| 21 | DELETE | `/community/conversations/{conversationId}/pin` | Soltar el mensaje fijado de la conversación | ALTO | 6 | sesión (sin roles) |
| 22 | POST | `/community/conversations/{conversationId}/pin` | Fijar un mensaje de la conversación | ALTO | 7 | sesión (sin roles) |
| 23 | GET | `/community/conversations/{conversationId}/presence` | Presencia de los demás participantes | BAJO | 4 | sesión (sin roles) |
| 24 | POST | `/community/conversations/{conversationId}/read` | Marcar mensajes como leídos (recibos) | ALTO | 8 | sesión (sin roles) |
| 25 | POST | `/community/conversations/contacts/search` | Buscar personas para iniciar una conversación | BAJO | 4 | sesión (sin roles) |
| 26 | GET | `/community/feed` | Timeline de un perfil | BAJO | 9 | sesión (sin roles) |
| 27 | DELETE | `/community/follows` | Dejar de seguir un objeto social | ALTO | 5 | sesión (sin roles) |
| 28 | GET | `/community/follows` | Seguimientos activos de un perfil | BAJO | 4 | sesión (sin roles) |
| 29 | POST | `/community/follows` | Seguir un objeto social | ALTO | 6 | sesión (sin roles) |
| 30 | GET | `/community/groups` | Grupos de una organización | BAJO | 5 | sesión (sin roles) |
| 31 | POST | `/community/groups` | Crear un grupo/comunidad | ALTO | 9 | sesión (sin roles) |
| 32 | GET | `/community/groups/{groupId}` | Ficha de un grupo | BAJO | 7 | sesión (sin roles) |
| 33 | GET | `/community/groups/{groupId}/members` | Integrantes de un grupo | BAJO | 7 | sesión (sin roles) |
| 34 | POST | `/community/groups/{groupId}/members` | Unirse a un grupo / comunidad | ALTO | 10 | sesión (sin roles) |
| 35 | DELETE | `/community/groups/{groupId}/members/{member}` | Salir del grupo o dar de baja a un integrante | ALTO | 9 | sesión (sin roles) |
| 36 | PATCH | `/community/groups/{groupId}/members/{member}` | Aprobar/rechazar un alta o cambiar el rol | ALTO | 13 | sesión (sin roles) |
| 37 | GET | `/community/groups/{groupId}/posts` | Muro de un grupo | BAJO | 8 | sesión (sin roles) |
| 38 | POST | `/community/groups/{groupId}/posts` | Publicar en el muro del grupo | ALTO | 15 | sesión (sin roles) |
| 39 | GET | `/community/moderation/appeals` | Apelaciones presentadas, con su decisión | BAJO | 2 | SECURITY_ADMIN |
| 40 | POST | `/community/moderation/appeals/{appealId}/resolve` | Resolver una apelación de moderación | MEDIO | 5 | SECURITY_ADMIN |
| 41 | GET | `/community/moderation/decisions` | Decisiones de moderación tomadas | BAJO | 1 | SECURITY_ADMIN |
| 42 | POST | `/community/moderation/decisions/{decisionId}/appeal` | Apelar una decisión de moderación | ALTO | 9 | sesión (sin roles) |
| 43 | GET | `/community/moderation/decisions/mine` | Mis propias decisiones de moderación | BAJO | 6 | sesión (sin roles) |
| 44 | GET | `/community/moderation/queue` | Cola de moderación con filtros y cursor | BAJO | 2 | SECURITY_ADMIN |
| 45 | POST | `/community/moderation/queue/{queueId}/decision` | Resolver moderación (decisión + strike) | MEDIO | 6 | SECURITY_ADMIN |
| 46 | GET | `/community/notifications` | Notificaciones sociales de un perfil | BAJO | 4 | sesión (sin roles) |
| 47 | GET | `/community/polls/{pollId}` | Encuesta con opciones, recuentos y voto propio | BAJO | 9 | sesión (sin roles) |
| 48 | POST | `/community/polls/{pollId}/votes` | Votar en una encuesta | ALTO | 12 | sesión (sin roles) |
| 49 | GET | `/community/posts/{postId}` | Publicación con media, hashtags y menciones | BAJO | 12 | sesión (sin roles) |
| 50 | GET | `/community/posts/{postId}/comments` | Comentarios de una publicación (hilo anidado) | BAJO | 8 | sesión (sin roles) |
| 51 | POST | `/community/posts/{postId}/polls` | Crear una encuesta con opciones sobre un post | ALTO | 6 | sesión (sin roles) |
| 52 | GET | `/community/posts/{postId}/reactions` | Reacciones de una publicación, agrupadas por tipo | BAJO | 7 | sesión (sin roles) |
| 53 | GET | `/community/profiles/{profileId}` | Ficha de un perfil público | BAJO | 6 | sesión (sin roles) |
| 54 | GET | `/community/profiles/{profileId}/auto-reply` | Respuesta automática por inactividad del perfil | BAJO | 4 | sesión (sin roles) |
| 55 | PUT | `/community/profiles/{profileId}/auto-reply` | Configurar la respuesta automática del perfil | BAJO | 4 | sesión (sin roles) |
| 56 | GET | `/community/profiles/{profileId}/posts` | Publicaciones de un perfil | BAJO | 8 | sesión (sin roles) |
| 57 | POST | `/community/profiles/{profileId}/posts` | Publicar un post con hashtags, media y menciones | ALTO | 12 | sesión (sin roles) |
| 58 | GET | `/community/profiles/{profileId}/reviews` | Reviews publicadas de un perfil | BAJO | 5 | sesión (sin roles) |
| 59 | POST | `/community/profiles/{profileId}/reviews` | Publicar una review verificada de servicio | ALTO | 6 | sesión (sin roles) |
| 60 | POST | `/community/profiles/{profileId}/reviews/{reviewId}/responses` | Responder una reseña de la propia vitrina | ALTO | 6 | sesión (sin roles) |
| 61 | GET | `/community/profiles/by-slug/{slug}` | Ficha de un perfil público por su slug | BAJO | 6 | sesión (sin roles) |
| 62 | GET | `/community/profiles/me` | Consultar la vitrina pública propia | BAJO | 1 | sesión (sin roles) |
| 63 | PUT | `/community/profiles/me` | Crear o actualizar la vitrina pública propia | ALTO | 4 | sesión (sin roles) |
| 64 | GET | `/community/profiles/me/stats` | Estadísticas de la vitrina pública propia | BAJO | 1 | sesión (sin roles) |
| 65 | GET | `/community/profiles/organization-showcases/me` | Vitrinas de organización que la sesión puede atender en el chat | BAJO | 2 | sesión (sin roles) |
| 66 | POST | `/community/public-profiles` | Crear un perfil público (bootstrap del grafo social) | MEDIO | 1 | SECURITY_ADMIN |
| 67 | GET | `/community/ratings` | Calificaciones de un médico, paciente u organización | BAJO | 2 | sesión (sin roles) |
| 68 | PUT | `/community/ratings` | Calificar con estrellas a un médico, paciente u organización | ALTO | 9 | sesión (sin roles) |
| 69 | GET | `/community/ratings/mine` | Mis calificaciones | BAJO | 2 | sesión (sin roles) |
| 70 | GET | `/community/ratings/summary` | Nota media de un médico, paciente u organización | BAJO | 2 | sesión (sin roles) |
| 71 | PUT | `/community/reactions` | Reaccionar a contenido (upsert una reacción por actor/objeto) | ALTO | 6 | sesión (sin roles) |
| 72 | POST | `/community/reports` | Reportar contenido y encolar moderación | ALTO | 3 | sesión (sin roles) |
| 73 | GET | `/community/topics` | Temas de la comunidad | BAJO | 1 | sesión (sin roles) |
| 74 | GET | `/f/{slug}` | Ficha pública de una farmacia | BAJO | 18 | pública |
| 75 | GET | `/internal/community/feed/pending` | Publicaciones publicadas sin fan-out | BAJO | 3 | SYSTEM, SECURITY_ADMIN |
| 76 | POST | `/internal/community/feed/ranking/apply` | Aplicar rank_score recalculado | MEDIO | 1 | SYSTEM, SECURITY_ADMIN |
| 77 | GET | `/internal/community/feed/ranking/pending` | Items de feed pendientes de puntuar | BAJO | 4 | SYSTEM, SECURITY_ADMIN |
| 78 | POST | `/internal/community/feed/rebuild` | Generar feed (fan-out y ranking) | MEDIO | 2 | SYSTEM, SECURITY_ADMIN |
| 79 | GET | `/internal/community/search/health` | Estado del índice del directorio público | BAJO | 1 | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN |
| 80 | POST | `/internal/community/search/reindex` | Reindexar el directorio público | BAJO | 9 | SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN |
| 81 | POST | `/internal/community/verification/badges` | Emitir un sello a mano (auditado) | MEDIO | 6 | SECURITY_ADMIN |
| 82 | POST | `/internal/community/verification/badges/{targetId}/revoke` | Bajar los sellos de un sujeto (auditado) | MEDIO | 5 | SECURITY_ADMIN |
| 83 | POST | `/internal/community/verification/badges/expire-sweep` | Bajar los sellos cuya vigencia ya venció | MEDIO | 5 | SYSTEM, SECURITY_ADMIN |
| 84 | GET | `/l/{slug}` | Ficha pública de un laboratorio | BAJO | 18 | pública |
| 85 | GET | `/o/{slug}` | Ficha pública de una organización | BAJO | 18 | pública |
| 86 | GET | `/p/{slug}` | Ficha pública de un profesional | BAJO | 18 | pública |
| 87 | POST | `/patients/me/reviews` | Calificar una atención recibida | MEDIO | 6 | PATIENT |
| 88 | GET | `/public/comments/{commentId}/replies` | Respuestas de un comentario público | BAJO | 4 | pública |
| 89 | GET | `/public/media/{id}` | Servir una imagen pública (avatar, portada o post) | BAJO | 7 | pública |
| 90 | GET | `/public/nearby` | Prestadores cercanos, en línea recta | BAJO | 7 | pública |
| 91 | GET | `/public/posts` | Últimas publicaciones de todos los profesionales | BAJO | 5 | pública |
| 92 | GET | `/public/posts/{postId}/comments` | Comentarios raíz de una publicación pública | BAJO | 4 | pública |
| 93 | GET | `/public/posts/{postId}/reactions` | Quiénes reaccionaron a una publicación pública | BAJO | 3 | pública |
| 94 | GET | `/public/profiles/{prefijo}/{slug}` | Ficha pública por prefijo de vertical | BAJO | 18 | pública |
| 95 | GET | `/public/profiles/{prefijo}/{slug}/reviews` | Opiniones publicadas de una ficha pública | BAJO | 5 | pública |
| 96 | GET | `/public/search` | Buscador público unificado | BAJO | 12 | pública |
| 97 | GET | `/public/search/diagnostic-units` | Laboratorios y centros de diagnóstico | BAJO | 12 | pública |
| 98 | GET | `/public/search/insurers` | Aseguradoras en el directorio público | BAJO | 12 | pública |
| 99 | GET | `/public/search/medications` | Medicamentos ofertados públicamente | BAJO | 12 | pública |
| 100 | GET | `/public/search/organizations` | Organizaciones en el directorio público | BAJO | 12 | pública |
| 101 | GET | `/public/search/pharmacies` | Farmacias en el directorio público | BAJO | 12 | pública |
| 102 | GET | `/public/search/practitioners` | Profesionales en el directorio público | BAJO | 12 | pública |
| 103 | GET | `/s/{slug}` | Ficha pública de una aseguradora | BAJO | 18 | pública |

---

## 1. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Entero de un parámetro de consulta, o `undefined`. Un valor no numérico se ignora en vez de dar 400: el contrato promete que `limit` fuera de rango se **recorta**, y «abc» es tan fuera de rango como 9999. La única excepción son las coordenadas de `nearby`, que sí fallan.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.toInt` — `src/modules/community/controllers/community-public.controller.ts:582`

### Qué es y para qué sirve (negocio)

Entero de un parámetro de consulta, o `undefined`. Un valor no numérico se ignora en vez de dar 400: el contrato promete que `limit` fuera de rango se **recorta**, y «abc» es tan fuera de rango como 9999. La única excepción son las coordenadas de `nearby`, que sí fallan. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `CommunityPublicController.toInt` (src/modules/community/controllers/community-public.controller.ts:582). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-public.controller.ts:582` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:582` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/community/controllers/community-public.controller.ts:582`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `number | undefined`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Decimal de un parámetro de consulta, o `undefined`.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.toFloat` — `src/modules/community/controllers/community-public.controller.ts:589`

### Qué es y para qué sirve (negocio)

Decimal de un parámetro de consulta, o `undefined`. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `CommunityPublicController.toFloat` (src/modules/community/controllers/community-public.controller.ts:589). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-public.controller.ts:589` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:589` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/community/controllers/community-public.controller.ts:589`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `number | undefined`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** El vertical de `nearby`, o `undefined` si no es uno de los cuatro que acepta ese endpoint (ver ). Mismo criterio que `toInt`/`toBool`: un vertical inventado se ignora —el buscador cae a «todos»— en vez de romper la consulta con 400.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.toNearbyKind` — `src/modules/community/controllers/community-public.controller.ts:602`

### Qué es y para qué sirve (negocio)

El vertical de `nearby`, o `undefined` si no es uno de los cuatro que acepta ese endpoint (ver ). Mismo criterio que `toInt`/`toBool`: un vertical inventado se ignora —el buscador cae a «todos»— en vez de romper la consulta con 400. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `CommunityPublicController.toNearbyKind` (src/modules/community/controllers/community-public.controller.ts:602). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-public.controller.ts:602` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:602` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/community/controllers/community-public.controller.ts:602`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `PublicResultKind | undefined`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. DESCONOCIDO /

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Booleano de un parámetro; sólo `'true'` afirma.
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.toBool` — `src/modules/community/controllers/community-public.controller.ts:607`

### Qué es y para qué sirve (negocio)

Booleano de un parámetro; sólo `'true'` afirma. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DESCONOCIDO /` la atiende `CommunityPublicController.toBool` (src/modules/community/controllers/community-public.controller.ts:607). Exige sesión; el controlador no declara roles. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-public.controller.ts:607` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:607` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/community/controllers/community-public.controller.ts:607`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `boolean | undefined`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. DELETE /community/blocks

- **Origen:** CONTRATO
- **Nombre:** Levantar un bloqueo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.unblock` — `src/modules/community/controllers/community-social.controller.ts:325`

### Qué es y para qué sirve (negocio)

Levantar un bloqueo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/blocks` la atiende `CommunitySocialController.unblock` (src/modules/community/controllers/community-social.controller.ts:325). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.unblock`. Actualiza community.user_blocks. Lee community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:325` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | blockerProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | blockedProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.unblock → CommunitySocialService.unblock → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.unblock → CommunitySocialService.unblock | `src/modules/community/services/community-social.service.ts:1011` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.unblock → CommunitySocialService.unblock → BlocksRepository.findByPair | `src/modules/community/repositories/blocks.repository.ts:48` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.unblock → CommunitySocialService.unblock → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.unblock → CommunitySocialService.unblock → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `blockerProfileId` | query | Sí | `string` | Perfil que bloqueó |
| `blockedProfileId` | query | Sí | `string` | Perfil bloqueado |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SocialRemovalResponseDto>` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:157` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /community/blocks

- **Origen:** CONTRATO
- **Nombre:** Bloqueos emitidos por un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listBlocks` — `src/modules/community/controllers/community-social.controller.ts:534`

### Qué es y para qué sirve (negocio)

Bloqueos emitidos por un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/blocks` la atiende `CommunitySocialController.listBlocks` (src/modules/community/controllers/community-social.controller.ts:534). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listBlocks`. Lee community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:534` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listBlocks → CommunitySocialReadService.listBlocks → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.listBlocks → CommunitySocialReadService.listBlocks → BlocksRepository.listByBlocker | `src/modules/community/repositories/blocks.repository.ts:122` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.listBlocks → CommunitySocialReadService.listBlocks → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.listBlocks → CommunitySocialReadService.listBlocks → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `items` | `array<BlockListItemDto>` | Sí | — | — | Bloqueos de la página. | `src/modules/community/dto/read-social.dto.ts:527` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del bloqueo. | `src/modules/community/dto/read-social.dto.ts:508` |
| `items[].blockedProfileId` | `string` | Sí | formato uuid | — | Perfil bloqueado. | `src/modules/community/dto/read-social.dto.ts:512` |
| `items[].reasonConceptId` | `string` | No | formato uuid; admite null | — | Concept id del motivo declarado. | `src/modules/community/dto/read-social.dto.ts:516` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se bloqueó. | `src/modules/community/dto/read-social.dto.ts:520` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-social.dto.ts:531` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:535` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:539` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /community/blocks

- **Origen:** CONTRATO
- **Nombre:** Bloquear a un usuario
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.block` — `src/modules/community/controllers/community-social.controller.ts:272`

### Qué es y para qué sirve (negocio)

Bloquear a un usuario. Caso de uso UC-19-14: Bloquea a un usuario. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:138`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/blocks` la atiende `CommunitySocialController.block` (src/modules/community/controllers/community-social.controller.ts:272). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateBlockDto` (3 campos, 2 obligatorios). Delega en `CommunitySocialService.block`. Crea filas en community.user_blocks. Actualiza community.social_follows, community.user_blocks. Lee community.public_profiles, community.social_follows, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:272` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_follows` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.block → CommunitySocialService.block | `src/modules/community/services/community-social.service.ts:880` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → FollowsRepository.findMutualBetween | `src/modules/community/repositories/follows.repository.ts:161` |
| `community.user_blocks` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.block → CommunitySocialService.block | `src/modules/community/services/community-social.service.ts:854` |
| `community.user_blocks` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → BlocksRepository.create | `src/modules/community/repositories/blocks.repository.ts:150` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → BlocksRepository.findByPair | `src/modules/community/repositories/blocks.repository.ts:48` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.block → CommunitySocialService.block → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 409 | `CONFLICT` | ConflictException: El usuario ya está bloqueado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede bloquear a uno mismo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:223` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:128` |

### Flujos

- Módulo Community (19) — etapa `UC-19-14`

---

## 8. DELETE /community/bookmarks

- **Origen:** CONTRATO
- **Nombre:** Quitar un marcador
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.unbookmark` — `src/modules/community/controllers/community-social.controller.ts:310`

### Qué es y para qué sirve (negocio)

Quitar un marcador. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/bookmarks` la atiende `CommunitySocialController.unbookmark` (src/modules/community/controllers/community-social.controller.ts:310). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.unbookmark`. Borra de community.bookmarks. Lee community.bookmarks, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:310` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | bookmarkableType (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | bookmarkableRefId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.bookmarks` | BORRA | BORRA | POR_TIPO | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark | `src/modules/community/services/community-social.service.ts:968` |
| `community.bookmarks` | LEE | LEE | DIRECTA | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark → BookmarksRepository.findByProfileTarget | `src/modules/community/repositories/bookmarks.repository.ts:50` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.unbookmark → CommunitySocialService.unbookmark → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:150` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /community/bookmarks

- **Origen:** CONTRATO
- **Nombre:** Marcadores guardados por un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listBookmarks` — `src/modules/community/controllers/community-social.controller.ts:517`

### Qué es y para qué sirve (negocio)

Marcadores guardados por un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/bookmarks` la atiende `CommunitySocialController.listBookmarks` (src/modules/community/controllers/community-social.controller.ts:517). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listBookmarks`. Lee community.bookmarks, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:517` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | collectionName (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.bookmarks` | LEE | LEE | DIRECTA | CommunitySocialController.listBookmarks → CommunitySocialReadService.listBookmarks → BookmarksRepository.listByProfilePage | `src/modules/community/repositories/bookmarks.repository.ts:74` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listBookmarks → CommunitySocialReadService.listBookmarks → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.listBookmarks → CommunitySocialReadService.listBookmarks → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.listBookmarks → CommunitySocialReadService.listBookmarks → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `items` | `array<BookmarkListItemDto>` | Sí | — | — | Marcadores de la página. | `src/modules/community/dto/read-social.dto.ts:489` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del marcador. | `src/modules/community/dto/read-social.dto.ts:466` |
| `items[].bookmarkableTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de contenido guardado. | `src/modules/community/dto/read-social.dto.ts:470` |
| `items[].bookmarkableRefId` | `string` | Sí | formato uuid | — | Id del contenido guardado. | `src/modules/community/dto/read-social.dto.ts:474` |
| `items[].collectionName` | `string` | No | admite null | — | Colección en la que se guardó. | `src/modules/community/dto/read-social.dto.ts:478` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se guardó. | `src/modules/community/dto/read-social.dto.ts:482` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-social.dto.ts:493` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:497` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:501` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /community/bookmarks

- **Origen:** CONTRATO
- **Nombre:** Guardar un bookmark en una colección
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.bookmark` — `src/modules/community/controllers/community-social.controller.ts:240`

### Qué es y para qué sirve (negocio)

Guardar un bookmark en una colección. Caso de uso UC-19-04: Guarda bookmark en colección. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:128`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/bookmarks` la atiende `CommunitySocialController.bookmark` (src/modules/community/controllers/community-social.controller.ts:240). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateBookmarkDto` (4 campos, 3 obligatorios). Delega en `CommunitySocialService.bookmark`. Crea filas en community.bookmarks. Lee community.bookmarks, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:240` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.bookmarks` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → BookmarksRepository.create | `src/modules/community/repositories/bookmarks.repository.ts:100` |
| `community.bookmarks` | LEE | LEE | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → BookmarksRepository.findByProfileTarget | `src/modules/community/repositories/bookmarks.repository.ts:50` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.bookmark → CommunitySocialService.bookmark → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 409 | `CONFLICT` | ConflictException: El contenido ya está guardado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:110` |

### Flujos

- Módulo Community (19) — etapa `UC-19-04`

---

## 11. POST /community/comments

- **Origen:** CONTRATO
- **Nombre:** Comentar (hilo anidado) con contadores
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.createComment` — `src/modules/community/controllers/community-social.controller.ts:207`

### Qué es y para qué sirve (negocio)

Comentar (hilo anidado) con contadores. Caso de uso UC-19-02: Comenta (hilo anidado) con contadores. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:126`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/comments` la atiende `CommunitySocialController.createComment` (src/modules/community/controllers/community-social.controller.ts:207). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateCommentDto` (14 campos, 4 obligatorios). Delega en `CommunitySocialService.createComment`. Crea filas en community.comment_media, community.comments, community.mentions. Actualiza community.comments. Lee common.file_versions, common.files, community.comments, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:207` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommunitySocialService.assertMediaFileUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommunitySocialService.assertMediaFileUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.comment_media` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommentsRepository.createMedia | `src/modules/community/repositories/comments.repository.ts:273` |
| `community.comments` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.createComment → CommunitySocialService.createComment | `src/modules/community/services/community-social.service.ts:623` |
| `community.comments` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommentsRepository.create | `src/modules/community/repositories/comments.repository.ts:200` |
| `community.comments` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommentsRepository.findById | `src/modules/community/repositories/comments.repository.ts:79` |
| `community.mentions` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → PostsRepository.createMention | `src/modules/community/repositories/posts.repository.ts:410` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.createComment → CommunitySocialService.createComment → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Cuerpo — DTO `CreateCommentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `authorProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil autor del comentario | `src/modules/community/dto/comment.dto.ts:73` |
| `commentableType` | `string` | Sí | valores: POST, COMMENT, REVIEW | `@IsIn(['POST', 'COMMENT', 'REVIEW'])` | Tipo de contenido comentado | `src/modules/community/dto/comment.dto.ts:83` |
| `commentableRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del contenido comentado | `src/modules/community/dto/comment.dto.ts:90` |
| `parentCommentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Comentario padre (para respuesta anidada) | `src/modules/community/dto/comment.dto.ts:101` |
| `bodyText` | `string` | Sí | longitud mínima 1; longitud máxima 3000 | `@IsString()` `@MinLength(1)` `@MaxLength(3000)` | Texto del comentario | `src/modules/community/dto/comment.dto.ts:110` |
| `mentions` | `array<MentionInputDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => MentionInputDto)` | — | `src/modules/community/dto/comment.dto.ts:121` |
| `mentions[].mentionedProfileId` | `string` | No | formato uuid | `@IsUUID()` | Perfil mencionado | `src/modules/community/dto/post.dto.ts:68` |
| `mentions[].offsetStart` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/community/dto/post.dto.ts:77` |
| `mentions[].offsetEnd` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | — | `src/modules/community/dto/post.dto.ts:86` |
| `media` | `array<CommentMediaInputDto>` | No | máximo 4 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(4)` `@ValidateNested({ each: true })` `@Type(() => CommentMediaInputDto)` | — | `src/modules/community/dto/comment.dto.ts:134` |
| `media[].fileId` | `string` | No | formato uuid | `@IsUUID()` | Id del archivo (common.files) | `src/modules/community/dto/comment.dto.ts:31` |
| `media[].mediaRole` | `string` | No | valores: IMAGE, STICKER, GIF | `@IsOptional()` `@IsIn(['IMAGE', 'STICKER', 'GIF'])` | Rol del medio | `src/modules/community/dto/comment.dto.ts:45` |
| `media[].altText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/community/dto/comment.dto.ts:54` |
| `media[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de despliegue | `src/modules/community/dto/comment.dto.ts:63` |

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
  ],
  "media": [
    {
      "fileId": "00000000-0000-4000-8000-000000000001",
      "mediaRole": "IMAGE",
      "altText": "valor-ejemplo",
      "ordinal": 1
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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil autor no encontrado; ResourceNotFoundException: Comentario padre no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:256` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:87` |

### Flujos

- Módulo Community (19) — etapa `UC-19-02`

---

## 12. GET /community/comments/media/{fileId}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar el adjunto de un comentario (imagen, sticker o GIF)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getCommentMediaContent` — `src/modules/community/controllers/community-social.controller.ts:468`

### Qué es y para qué sirve (negocio)

Descargar el adjunto de un comentario (imagen, sticker o GIF). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/comments/media/{fileId}/content` la atiende `CommunitySocialController.getCommentMediaContent` (src/modules/community/controllers/community-social.controller.ts:468). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getCommentMedia`. Lee common.file_versions, common.files, community.comment_media, community.comments, community.public_profiles, community.social_follows, community.social_posts, community.user_blocks y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:468` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: fileId | `src/modules/community/controllers/community-social.controller.ts:468` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → FileUploadService.downloadPublicMedia → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → FileUploadService.downloadPublicMedia → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.comment_media` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommentsRepository.findMediaByFileId | `src/modules/community/repositories/comments.repository.ts:262` |
| `community.comments` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommentsRepository.findById | `src/modules/community/repositories/comments.repository.ts:79` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommunitySocialReadService.assertPostVisible → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.getCommentMediaContent → CommunitySocialReadService.getCommentMedia → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `fileId` | path | Sí | `string` | — |
| `actorProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Publicación no encontrada; ResourceNotFoundException: Versión vigente no encontrada; ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente todavía no está lista para servirse públicamente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.SERVICE_UNAVAILABLE}; Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /community/conversations

- **Origen:** CONTRATO
- **Nombre:** Conversaciones activas de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.listConversations` — `src/modules/community/controllers/community-messaging.controller.ts:283`

### Qué es y para qué sirve (negocio)

Conversaciones activas de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/conversations` la atiende `CommunityMessagingController.listConversations` (src/modules/community/controllers/community-messaging.controller.ts:283). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingReadService.listConversations`. Lee community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:283` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → ConversationsRepository.listActiveParticipationsOf | `src/modules/community/repositories/conversations.repository.ts:353` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → ConversationsRepository.listConversationsByIds | `src/modules/community/repositories/conversations.repository.ts:372` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → ConversationsRepository.findLastMessage | `src/modules/community/repositories/conversations.repository.ts:495` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.listConversations → CommunityMessagingReadService.listConversations → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |
| `cursor` | query | Sí | `string` | — |
| `q` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConversationPageDto>` · DTO `ConversationPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ConversationListItemDto>` | Sí | — | — | Conversaciones de la página. | `src/modules/community/dto/read-messaging.dto.ts:250` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la conversación. | `src/modules/community/dto/read-messaging.dto.ts:185` |
| `items[].conversationTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de conversación (directa, grupal). | `src/modules/community/dto/read-messaging.dto.ts:189` |
| `items[].groupId` | `string` | No | formato uuid; admite null | — | Grupo al que pertenece, si es de grupo. | `src/modules/community/dto/read-messaging.dto.ts:193` |
| `items[].lastMessageAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió el último mensaje. | `src/modules/community/dto/read-messaging.dto.ts:197` |
| `items[].messageCount` | `number` | No | admite null | — | Cuántos mensajes acumula. | `src/modules/community/dto/read-messaging.dto.ts:201` |
| `items[].lastMessage` | `ConversationPreviewMessageDto` | No | — | — | Vista previa del último mensaje. | `src/modules/community/dto/read-messaging.dto.ts:205` |
| `items[].lastMessage.id` | `string` | No | formato uuid | — | Identificador del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:18` |
| `items[].lastMessage.senderProfileId` | `string` | No | formato uuid | — | Perfil que lo envió. | `src/modules/community/dto/read-messaging.dto.ts:22` |
| `items[].lastMessage.bodyText` | `string` | No | admite null | — | Cuerpo del mensaje; `null` si era sólo un adjunto o si se eliminó. | `src/modules/community/dto/read-messaging.dto.ts:26` |
| `items[].lastMessage.contentTypeConceptId` | `string` | No | formato uuid; admite null | — | Concept id del tipo de contenido (texto o media). F4.3: con esto la fila de la bandeja dice «Foto» o «Documento» sin adivinarlo por el cuerpo vacío. | `src/modules/community/dto/read-messaging.dto.ts:33` |
| `items[].lastMessage.attachmentFileId` | `string` | No | formato uuid; admite null | — | Adjunto en `common.files`, si el último mensaje era uno. | `src/modules/community/dto/read-messaging.dto.ts:37` |
| `items[].lastMessage.deletedAt` | `string` | No | formato date-time; admite null | — | Cuándo se eliminó, si el último mensaje está eliminado (F4.5). | `src/modules/community/dto/read-messaging.dto.ts:41` |
| `items[].lastMessage.sentAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió. | `src/modules/community/dto/read-messaging.dto.ts:45` |
| `items[].unreadCount` | `number` | Sí | — | — | Cuántos mensajes le quedan sin leer al actor. | `src/modules/community/dto/read-messaging.dto.ts:209` |
| `items[].lastMessageReadByPeer` | `boolean` | No | admite null | — | Si el otro lado ya leyó el último mensaje, cuando ese mensaje es del actor y la conversación es directa. `null` si no se sabe (grupo, o el último no es propio). Con esto la bandeja pinta el doble tilde sin mentir (F4.3). | `src/modules/community/dto/read-messaging.dto.ts:217` |
| `items[].isFavorite` | `boolean` | Sí | — | — | Favorita para el actor (F4.4). | `src/modules/community/dto/read-messaging.dto.ts:221` |
| `items[].isPinned` | `boolean` | Sí | — | — | Fijada arriba de la bandeja del actor (F4.4). Las fijadas van primero. | `src/modules/community/dto/read-messaging.dto.ts:225` |
| `items[].archivedAt` | `string` | No | formato date-time; admite null | — | Desde cuándo la archivó el actor; `null` si no está archivada (F4.4). | `src/modules/community/dto/read-messaging.dto.ts:229` |
| `items[].pinnedMessageId` | `string` | No | formato uuid; admite null | — | El mensaje fijado en la barra superior, si hay uno (F4.6). | `src/modules/community/dto/read-messaging.dto.ts:233` |
| `items[].peers` | `array<ConversationPeerDto>` | Sí | — | — | Los demás participantes, sin el propio. Sin el propio porque la bandeja se lee desde un lado: incluirse a uno mismo obligaría a cada pantalla a filtrarse, y la que se olvide muestra «Conversación con vos». | `src/modules/community/dto/read-messaging.dto.ts:243` |
| `items[].peers[].profileId` | `string` | Sí | formato uuid | — | Perfil público del participante. | `src/modules/community/dto/read-messaging.dto.ts:118` |
| `items[].peers[].displayName` | `string` | No | admite null | — | Cómo se llama, para poder pintar la fila. | `src/modules/community/dto/read-messaging.dto.ts:122` |
| `items[].peers[].avatarUrl` | `string` | No | admite null | — | Su avatar público, o `null` si no subió ninguno. Misma regla que la ficha pública. | `src/modules/community/dto/read-messaging.dto.ts:126` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-messaging.dto.ts:254` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-messaging.dto.ts:258` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más (F4.3). Se pagina sobre el orden de la bandeja —fijadas primero, después por último mensaje— y dentro del mismo recorte que aplique `q`. | `src/modules/community/dto/read-messaging.dto.ts:267` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-pharmacy-inbox.int-spec.ts:161` |
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:182` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /community/conversations

- **Origen:** CONTRATO
- **Nombre:** Crear una conversación con participantes
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.createConversation` — `src/modules/community/controllers/community-messaging.controller.ts:70`

### Qué es y para qué sirve (negocio)

Crear una conversación con participantes. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations` la atiende `CommunityMessagingController.createConversation` (src/modules/community/controllers/community-messaging.controller.ts:70). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateConversationDto` (2 campos, 1 obligatorio). Delega en `CommunityMessagingService.createConversation`. Crea filas en community.conversation_participants, community.conversations. Lee community.conversation_participants, community.conversations, community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:70` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createParticipant | `src/modules/community/repositories/conversations.repository.ts:161` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:284` |
| `community.conversations` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.createConversation | `src/modules/community/repositories/conversations.repository.ts:136` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → ConversationsRepository.findDirectBetween | `src/modules/community/repositories/conversations.repository.ts:304` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.createConversation → CommunityMessagingService.createConversation → CommunityMessagingService.createDirectConversation → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Cuerpo — DTO `CreateConversationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `participantProfileIds` | `array<string>` | Sí | formato uuid; mínimo 2 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@IsUUID('4', { each: true })` | Perfiles participantes | `src/modules/community/dto/conversation.dto.ts:26` |
| `conversationType` | `string` | No | valores: DIRECT | `@IsOptional()` `@IsIn(['DIRECT'])` | Tipo de conversación (los grupos usan su flujo de membresía) | `src/modules/community/dto/conversation.dto.ts:37` |

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
  "conversationType": "DIRECT"
}
```

</details>

### Respuesta — `Promise<IdResponseDto>` · DTO `IdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/community/dto/responses.dto.ts:9` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: Una organización no inicia conversaciones por este canal |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las conversaciones grupales se crean desde el flujo de grupos; PreconditionFailedException: Los participantes de una conversación deben ser distintos; PreconditionFailedException: Una conversación directa requiere exactamente dos participantes; PreconditionFailedException: La persona no está disponible para iniciar una conversación; PreconditionFailedException: No se puede iniciar una conversación entre perfiles bloqueados |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-pharmacy-inbox.int-spec.ts:138` |
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:156` |
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:66` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. GET /community/conversations/{conversationId}/attachments/{fileId}/content

- **Origen:** CONTRATO
- **Nombre:** Descargar el adjunto de una conversación (participante activo)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.getAttachmentContent` — `src/modules/community/controllers/community-messaging.controller.ts:246`

### Qué es y para qué sirve (negocio)

Descargar el adjunto de una conversación (participante activo). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/conversations/{conversationId}/attachments/{fileId}/content` la atiende `CommunityMessagingController.getAttachmentContent` (src/modules/community/controllers/community-messaging.controller.ts:246). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingReadService.getAttachmentContent`. Lee common.file_versions, common.files, community.conversation_participants, community.direct_messages, community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:246` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId, fileId | `src/modules/community/controllers/community-messaging.controller.ts:246` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → FileUploadService.downloadForAuthorizedContext → FileUploadService.serveCurrentVersion → AttachableFileService.assertUsableForAuthorizedContext → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → FileUploadService.downloadForAuthorizedContext → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → ConversationsRepository.findLiveMessagesByAttachmentFileId | `src/modules/community/repositories/conversations.repository.ts:229` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → CommunityVisibilityService.assertOwnMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → CommunityMessagingReadService.assertNoBlockWithPeers → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.getAttachmentContent → CommunityMessagingReadService.getAttachmentContent → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |
| `fileId` | path | Sí | `string` | — |
| `profileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:86` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /community/conversations/{conversationId}/messages

- **Origen:** CONTRATO
- **Nombre:** Mensajes de una conversación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.listMessages` — `src/modules/community/controllers/community-messaging.controller.ts:300`

### Qué es y para qué sirve (negocio)

Mensajes de una conversación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/conversations/{conversationId}/messages` la atiende `CommunityMessagingController.listMessages` (src/modules/community/controllers/community-messaging.controller.ts:300). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingReadService.listMessages`. Lee community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:300` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:300` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → ConversationsRepository.listMessagesPage | `src/modules/community/repositories/conversations.repository.ts:401` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → CommunityVisibilityService.assertOwnMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → CommunityMessagingReadService.assertNoBlockWithPeers → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.listMessages → CommunityMessagingReadService.listMessages → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `items` | `array<DirectMessageDto>` | Sí | — | — | Mensajes de la página, del más reciente al más antiguo. | `src/modules/community/dto/read-messaging.dto.ts:321` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:274` |
| `items[].conversationId` | `string` | Sí | formato uuid | — | Conversación a la que pertenece. | `src/modules/community/dto/read-messaging.dto.ts:278` |
| `items[].senderProfileId` | `string` | Sí | formato uuid | — | Perfil que lo envió. | `src/modules/community/dto/read-messaging.dto.ts:282` |
| `items[].replyToMessageId` | `string` | No | formato uuid; admite null | — | Mensaje al que responde, si responde a alguno. | `src/modules/community/dto/read-messaging.dto.ts:286` |
| `items[].contentTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de contenido. | `src/modules/community/dto/read-messaging.dto.ts:290` |
| `items[].bodyText` | `string` | No | admite null | — | Cuerpo del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:294` |
| `items[].attachmentFileId` | `string` | No | formato uuid; admite null | — | Adjunto en `common.files`. | `src/modules/community/dto/read-messaging.dto.ts:298` |
| `items[].isEdited` | `boolean` | No | admite null | — | Si fue editado (F4.5). | `src/modules/community/dto/read-messaging.dto.ts:302` |
| `items[].deletedAt` | `string` | No | formato date-time; admite null | — | Cuándo se eliminó (F4.5). Un mensaje eliminado **sigue viajando** —con `bodyText` y `attachmentFileId` en `null`— para que el hilo muestre «Se eliminó este mensaje» en su lugar y no un hueco que descoloca las citas. | `src/modules/community/dto/read-messaging.dto.ts:310` |
| `items[].sentAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió. | `src/modules/community/dto/read-messaging.dto.ts:314` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-messaging.dto.ts:325` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-messaging.dto.ts:329` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-messaging.dto.ts:333` |
| `peerReadUpTo` | `string` | No | formato date-time; admite null | — | Hasta qué `sentAt` leyó el otro lado, en una conversación DIRECT. `null` si es de grupo (no hay "el otro lado") o si el peer no marcó nada todavía como leído. Con esto el frente pinta ✓✓ en los mensajes propios cuyo `sentAt` sea anterior o igual a esta marca. | `src/modules/community/dto/read-messaging.dto.ts:343` |
| `pinnedMessage` | `DirectMessageDto` | No | — | — | El mensaje fijado en la conversación, completo, o `null` (F4.6). Viaja con la primera página para que la barra superior se pinte sin otra llamada, aunque el mensaje sea de hace meses y no esté en la página. | `src/modules/community/dto/read-messaging.dto.ts:351` |
| `pinnedMessage.id` | `string` | No | formato uuid | — | Identificador del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:274` |
| `pinnedMessage.conversationId` | `string` | No | formato uuid | — | Conversación a la que pertenece. | `src/modules/community/dto/read-messaging.dto.ts:278` |
| `pinnedMessage.senderProfileId` | `string` | No | formato uuid | — | Perfil que lo envió. | `src/modules/community/dto/read-messaging.dto.ts:282` |
| `pinnedMessage.replyToMessageId` | `string` | No | formato uuid; admite null | — | Mensaje al que responde, si responde a alguno. | `src/modules/community/dto/read-messaging.dto.ts:286` |
| `pinnedMessage.contentTypeConceptId` | `string` | No | formato uuid | — | Concept id del tipo de contenido. | `src/modules/community/dto/read-messaging.dto.ts:290` |
| `pinnedMessage.bodyText` | `string` | No | admite null | — | Cuerpo del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:294` |
| `pinnedMessage.attachmentFileId` | `string` | No | formato uuid; admite null | — | Adjunto en `common.files`. | `src/modules/community/dto/read-messaging.dto.ts:298` |
| `pinnedMessage.isEdited` | `boolean` | No | admite null | — | Si fue editado (F4.5). | `src/modules/community/dto/read-messaging.dto.ts:302` |
| `pinnedMessage.deletedAt` | `string` | No | formato date-time; admite null | — | Cuándo se eliminó (F4.5). Un mensaje eliminado **sigue viajando** —con `bodyText` y `attachmentFileId` en `null`— para que el hilo muestre «Se eliminó este mensaje» en su lugar y no un hueco que descoloca las citas. | `src/modules/community/dto/read-messaging.dto.ts:310` |
| `pinnedMessage.sentAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió. | `src/modules/community/dto/read-messaging.dto.ts:314` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-pharmacy-inbox.int-spec.ts:169` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /community/conversations/{conversationId}/messages

- **Origen:** CONTRATO
- **Nombre:** Enviar un mensaje directo en la conversación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.sendMessage` — `src/modules/community/controllers/community-messaging.controller.ts:86`

### Qué es y para qué sirve (negocio)

Enviar un mensaje directo en la conversación. Caso de uso UC-19-06: Envía mensaje directo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:130`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations/{conversationId}/messages` la atiende `CommunityMessagingController.sendMessage` (src/modules/community/controllers/community-messaging.controller.ts:86). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SendMessageDto` (5 campos, 1 obligatorio). Delega en `CommunityMessagingService.sendMessage`. Crea filas en community.direct_messages, community.message_receipts, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza community.conversation_participants, community.conversations, iam.devices. Lee common.file_versions, common.files, community.chat_auto_replies, community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles, community.user_blocks y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:86` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:86` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.assertAttachmentCanBeAssociated → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.assertAttachmentCanBeAssociated → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.chat_auto_replies` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.responderOnly → CommunityChatAutoReplyService.textForResponder | `src/modules/community/services/community-chat-auto-reply.service.ts:152` |
| `community.conversation_participants` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.responderOnly → CommunityChatAutoReplyService.textForResponder | `src/modules/community/services/community-chat-auto-reply.service.ts:186` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send | `src/modules/community/services/community-messaging.service.ts:446` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → ConversationsRepository.createMessage | `src/modules/community/repositories/conversations.repository.ts:466` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessagingService.assertAttachmentCanBeAssociated → ConversationsRepository.findLiveMessagesByAttachmentFileId | `src/modules/community/repositories/conversations.repository.ts:229` |
| `community.message_receipts` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → ConversationsRepository.createReceipt | `src/modules/community/repositories/conversations.repository.ts:565` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | CommunityMessagingController.sendMessage → CommunityMessagingService.sendMessage → CommunityMessagingService.send → CommunityMessageNotificationsService.newMessage → CommunityMessageNotificationsService.accounts → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |

### Cuerpo — DTO `SendMessageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `senderProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil remitente (participante activo) | `src/modules/community/dto/conversation.dto.ts:50` |
| `bodyText` | `string` | No | longitud mínima 1; longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(4000)` | Texto del mensaje | `src/modules/community/dto/conversation.dto.ts:60` |
| `contentType` | `string` | No | valores: TEXT, MEDIA | `@IsOptional()` `@IsIn(['TEXT', 'MEDIA'])` | Tipo de contenido | `src/modules/community/dto/conversation.dto.ts:71` |
| `replyToMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Mensaje al que responde | `src/modules/community/dto/conversation.dto.ts:82` |
| `attachmentFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo adjunto (common.files) | `src/modules/community/dto/conversation.dto.ts:93` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: Archivo adjunto no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El remitente no es participante activo; PreconditionFailedException: Existe un bloqueo entre los participantes; PreconditionFailedException: No se puede adjuntar un archivo sin un actor que lo autorice; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-pharmacy-inbox.int-spec.ts:153` |
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:249` |
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:73` |

### Flujos

- Módulo Community (19) — etapa `UC-19-06`

---

## 18. DELETE /community/conversations/{conversationId}/messages/{messageId}

- **Origen:** CONTRATO
- **Nombre:** Eliminar un mensaje propio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.deleteMessage` — `src/modules/community/controllers/community-messaging.controller.ts:121`

### Qué es y para qué sirve (negocio)

Eliminar un mensaje propio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/conversations/{conversationId}/messages/{messageId}` la atiende `CommunityMessagingController.deleteMessage` (src/modules/community/controllers/community-messaging.controller.ts:121). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingService.deleteMessage`. Actualiza community.conversations, community.direct_messages. Lee community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId, messageId | `src/modules/community/controllers/community-messaging.controller.ts:121` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage → CommunityMessagingService.activeOrNotFoundParticipant → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage | `src/modules/community/services/community-messaging.service.ts:873` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage | `src/modules/community/services/community-messaging.service.ts:864` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage → CommunityMessagingService.ownLiveMessage → ConversationsRepository.findMessageInConversation | `src/modules/community/repositories/conversations.repository.ts:530` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.deleteMessage → CommunityMessagingService.deleteMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |
| `messageId` | path | Sí | `string` | — |
| `profileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DeletedMessageResponseDto>` · DTO `DeletedMessageResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversationId` | `string` | Sí | formato uuid | — | Conversación. | `src/modules/community/dto/read-messaging.dto.ts:358` |
| `messageId` | `string` | Sí | formato uuid | — | El mensaje eliminado. | `src/modules/community/dto/read-messaging.dto.ts:362` |
| `deletedAt` | `string` | Sí | formato date-time | — | Cuándo. | `src/modules/community/dto/read-messaging.dto.ts:366` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Mensaje no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo el autor puede editar o eliminar su mensaje; PreconditionFailedException: El mensaje ya fue eliminado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:222` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. PATCH /community/conversations/{conversationId}/messages/{messageId}

- **Origen:** CONTRATO
- **Nombre:** Editar el texto de un mensaje propio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.editMessage` — `src/modules/community/controllers/community-messaging.controller.ts:103`

### Qué es y para qué sirve (negocio)

Editar el texto de un mensaje propio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /community/conversations/{conversationId}/messages/{messageId}` la atiende `CommunityMessagingController.editMessage` (src/modules/community/controllers/community-messaging.controller.ts:103). Exige sesión; el controlador no declara roles. Valida el cuerpo como `EditMessageDto` (2 campos, 2 obligatorios). Delega en `CommunityMessagingService.editMessage`. Actualiza community.direct_messages. Lee community.conversation_participants, community.direct_messages, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:103` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId, messageId | `src/modules/community/controllers/community-messaging.controller.ts:103` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.editMessage → CommunityMessagingService.editMessage → CommunityMessagingService.activeOrNotFoundParticipant → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.direct_messages` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.editMessage → CommunityMessagingService.editMessage | `src/modules/community/services/community-messaging.service.ts:823` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.editMessage → CommunityMessagingService.editMessage → CommunityMessagingService.ownLiveMessage → ConversationsRepository.findMessageInConversation | `src/modules/community/repositories/conversations.repository.ts:530` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.editMessage → CommunityMessagingService.editMessage → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.editMessage → CommunityMessagingService.editMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.editMessage → CommunityMessagingService.editMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |
| `messageId` | path | Sí | `string` | — |

### Cuerpo — DTO `EditMessageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `senderProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil autor del mensaje | `src/modules/community/dto/conversation.dto.ts:155` |
| `bodyText` | `string` | Sí | longitud mínima 1; longitud máxima 4000 | `@IsString()` `@MinLength(1)` `@MaxLength(4000)` | Texto nuevo del mensaje | `src/modules/community/dto/conversation.dto.ts:162` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "senderProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "senderProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<DirectMessageDto>` · DTO `DirectMessageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:274` |
| `conversationId` | `string` | Sí | formato uuid | — | Conversación a la que pertenece. | `src/modules/community/dto/read-messaging.dto.ts:278` |
| `senderProfileId` | `string` | Sí | formato uuid | — | Perfil que lo envió. | `src/modules/community/dto/read-messaging.dto.ts:282` |
| `replyToMessageId` | `string` | No | formato uuid; admite null | — | Mensaje al que responde, si responde a alguno. | `src/modules/community/dto/read-messaging.dto.ts:286` |
| `contentTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de contenido. | `src/modules/community/dto/read-messaging.dto.ts:290` |
| `bodyText` | `string` | No | admite null | — | Cuerpo del mensaje. | `src/modules/community/dto/read-messaging.dto.ts:294` |
| `attachmentFileId` | `string` | No | formato uuid; admite null | — | Adjunto en `common.files`. | `src/modules/community/dto/read-messaging.dto.ts:298` |
| `isEdited` | `boolean` | No | admite null | — | Si fue editado (F4.5). | `src/modules/community/dto/read-messaging.dto.ts:302` |
| `deletedAt` | `string` | No | formato date-time; admite null | — | Cuándo se eliminó (F4.5). Un mensaje eliminado **sigue viajando** —con `bodyText` y `attachmentFileId` en `null`— para que el hilo muestre «Se eliminó este mensaje» en su lugar y no un hueco que descoloca las citas. | `src/modules/community/dto/read-messaging.dto.ts:310` |
| `sentAt` | `string` | No | formato date-time; admite null | — | Cuándo se envió. | `src/modules/community/dto/read-messaging.dto.ts:314` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Mensaje no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo el autor puede editar o eliminar su mensaje; PreconditionFailedException: El mensaje ya fue eliminado; PreconditionFailedException: El mensaje no tiene marca de envío: no se puede editar; PreconditionFailedException: Pasaron más de 5 minutos: el mensaje ya no se puede editar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:214` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. PATCH /community/conversations/{conversationId}/participant

- **Origen:** CONTRATO
- **Nombre:** Marcar la conversación como favorita, fijada o archivada
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.updateParticipant` — `src/modules/community/controllers/community-messaging.controller.ts:161`

### Qué es y para qué sirve (negocio)

Marcar la conversación como favorita, fijada o archivada. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /community/conversations/{conversationId}/participant` la atiende `CommunityMessagingController.updateParticipant` (src/modules/community/controllers/community-messaging.controller.ts:161). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateParticipantDto` (4 campos, 1 obligatorio). Delega en `CommunityMessagingService.updateParticipant`. Lee community.conversation_participants, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:161` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:161` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.updateParticipant → CommunityMessagingService.updateParticipant → CommunityMessagingService.activeOrNotFoundParticipant → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.updateParticipant → CommunityMessagingService.updateParticipant → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.updateParticipant → CommunityMessagingService.updateParticipant → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.updateParticipant → CommunityMessagingService.updateParticipant → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateParticipantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que marca | `src/modules/community/dto/conversation.dto.ts:129` |
| `isFavorite` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Favorita | `src/modules/community/dto/conversation.dto.ts:135` |
| `isPinned` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Fijada arriba de la bandeja | `src/modules/community/dto/conversation.dto.ts:141` |
| `archived` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Archivada | `src/modules/community/dto/conversation.dto.ts:147` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "isFavorite": true,
  "isPinned": true,
  "archived": true
}
```

</details>

### Respuesta — `Promise<ParticipantPreferencesDto>` · DTO `ParticipantPreferencesDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversationId` | `string` | Sí | formato uuid | — | Conversación. | `src/modules/community/dto/read-messaging.dto.ts:81` |
| `isFavorite` | `boolean` | Sí | — | — | Favorita para este participante. | `src/modules/community/dto/read-messaging.dto.ts:85` |
| `isPinned` | `boolean` | Sí | — | — | Fijada arriba de la bandeja de este participante. | `src/modules/community/dto/read-messaging.dto.ts:89` |
| `archivedAt` | `string` | No | formato date-time; admite null | — | Desde cuándo está archivada; `null` si no lo está. | `src/modules/community/dto/read-messaging.dto.ts:93` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:203` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. DELETE /community/conversations/{conversationId}/pin

- **Origen:** CONTRATO
- **Nombre:** Soltar el mensaje fijado de la conversación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.unpinMessage` — `src/modules/community/controllers/community-messaging.controller.ts:197`

### Qué es y para qué sirve (negocio)

Soltar el mensaje fijado de la conversación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/conversations/{conversationId}/pin` la atiende `CommunityMessagingController.unpinMessage` (src/modules/community/controllers/community-messaging.controller.ts:197). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingService.unpinMessage`. Actualiza community.conversations. Lee community.conversation_participants, community.conversations, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:197` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:197` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.unpinMessage → CommunityMessagingService.unpinMessage → CommunityMessagingService.activeOrNotFoundParticipant → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.unpinMessage → CommunityMessagingService.unpinMessage | `src/modules/community/services/community-messaging.service.ts:971` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.unpinMessage → CommunityMessagingService.unpinMessage → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.unpinMessage → CommunityMessagingService.unpinMessage → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.unpinMessage → CommunityMessagingService.unpinMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.unpinMessage → CommunityMessagingService.unpinMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |
| `profileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PinnedMessageResponseDto>` · DTO `PinnedMessageResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversationId` | `string` | Sí | formato uuid | — | Conversación. | `src/modules/community/dto/read-messaging.dto.ts:100` |
| `pinnedMessageId` | `string` | No | formato uuid; admite null | — | El mensaje fijado, o `null` si se soltó. | `src/modules/community/dto/read-messaging.dto.ts:104` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:237` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /community/conversations/{conversationId}/pin

- **Origen:** CONTRATO
- **Nombre:** Fijar un mensaje de la conversación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.pinMessage` — `src/modules/community/controllers/community-messaging.controller.ts:180`

### Qué es y para qué sirve (negocio)

Fijar un mensaje de la conversación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations/{conversationId}/pin` la atiende `CommunityMessagingController.pinMessage` (src/modules/community/controllers/community-messaging.controller.ts:180). Exige sesión; el controlador no declara roles. Valida el cuerpo como `PinMessageDto` (2 campos, 2 obligatorios). Delega en `CommunityMessagingService.pinMessage`. Actualiza community.conversations. Lee community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:180` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:180` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.pinMessage → CommunityMessagingService.pinMessage → CommunityMessagingService.activeOrNotFoundParticipant → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.pinMessage → CommunityMessagingService.pinMessage | `src/modules/community/services/community-messaging.service.ts:941` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.pinMessage → CommunityMessagingService.pinMessage → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.pinMessage → CommunityMessagingService.pinMessage → ConversationsRepository.findMessageInConversation | `src/modules/community/repositories/conversations.repository.ts:530` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.pinMessage → CommunityMessagingService.pinMessage → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.pinMessage → CommunityMessagingService.pinMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.pinMessage → CommunityMessagingService.pinMessage → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |

### Cuerpo — DTO `PinMessageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que fija | `src/modules/community/dto/conversation.dto.ts:170` |
| `messageId` | `string` | Sí | formato uuid | `@IsUUID()` | Mensaje a fijar | `src/modules/community/dto/conversation.dto.ts:175` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "messageId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "messageId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PinnedMessageResponseDto>` · DTO `PinnedMessageResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversationId` | `string` | Sí | formato uuid | — | Conversación. | `src/modules/community/dto/read-messaging.dto.ts:100` |
| `pinnedMessageId` | `string` | No | formato uuid; admite null | — | El mensaje fijado, o `null` si se soltó. | `src/modules/community/dto/read-messaging.dto.ts:104` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada; ResourceNotFoundException: Mensaje no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:234` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /community/conversations/{conversationId}/presence

- **Origen:** CONTRATO
- **Nombre:** Presencia de los demás participantes
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.conversationPresence` — `src/modules/community/controllers/community-messaging.controller.ts:316`

### Qué es y para qué sirve (negocio)

Presencia de los demás participantes. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/conversations/{conversationId}/presence` la atiende `CommunityMessagingController.conversationPresence` (src/modules/community/controllers/community-messaging.controller.ts:316). Exige sesión; el controlador no declara roles. Delega en `CommunityMessagingReadService.conversationPresence`. Lee community.conversation_participants, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:316` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:316` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.conversationPresence → CommunityMessagingReadService.conversationPresence → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.conversationPresence → CommunityMessagingReadService.conversationPresence → CommunityVisibilityService.assertOwnMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.conversationPresence → CommunityMessagingReadService.conversationPresence → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.conversationPresence → CommunityMessagingReadService.conversationPresence → CommunityVisibilityService.assertOwnMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |
| `profileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ConversationPresenceDto>` · DTO `ConversationPresenceDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `conversationId` | `string` | Sí | formato uuid | — | Conversación consultada. | `src/modules/community/dto/read-messaging.dto.ts:70` |
| `peers` | `array<ProfilePresenceDto>` | Sí | — | — | Los otros participantes, sin el propio. | `src/modules/community/dto/read-messaging.dto.ts:74` |
| `peers[].profileId` | `string` | Sí | formato uuid | — | Perfil público. | `src/modules/community/dto/read-messaging.dto.ts:52` |
| `peers[].online` | `boolean` | Sí | — | — | `true` si tiene la mensajería abierta ahora mismo. | `src/modules/community/dto/read-messaging.dto.ts:56` |
| `peers[].lastSeenAt` | `string` | No | formato date-time; admite null | — | Última vez que se lo vio conectado; `null` si nunca, o si la presencia no está disponible (Redis caído: se responde «no se sabe», no un 500). | `src/modules/community/dto/read-messaging.dto.ts:63` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:243` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /community/conversations/{conversationId}/read

- **Origen:** CONTRATO
- **Nombre:** Marcar mensajes como leídos (recibos)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.markRead` — `src/modules/community/controllers/community-messaging.controller.ts:144`

### Qué es y para qué sirve (negocio)

Marcar mensajes como leídos (recibos). Caso de uso UC-19-07: Marca mensajes como leídos (recibos). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:131`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations/{conversationId}/read` la atiende `CommunityMessagingController.markRead` (src/modules/community/controllers/community-messaging.controller.ts:144). Exige sesión; el controlador no declara roles. Valida el cuerpo como `MarkReadDto` (2 campos, 1 obligatorio). Delega en `CommunityMessagingService.markRead`. Crea filas en community.message_receipts. Actualiza community.conversation_participants. Lee community.conversation_participants, community.conversations, community.direct_messages, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:144` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: conversationId | `src/modules/community/controllers/community-messaging.controller.ts:144` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.conversation_participants` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityMessagingController.markRead → CommunityMessagingService.markRead | `src/modules/community/services/community-messaging.service.ts:726` |
| `community.conversation_participants` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.findActiveParticipant | `src/modules/community/repositories/conversations.repository.ts:190` |
| `community.conversations` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.findConversationById | `src/modules/community/repositories/conversations.repository.ts:122` |
| `community.direct_messages` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.findLastMessage | `src/modules/community/repositories/conversations.repository.ts:495` |
| `community.message_receipts` | ESCRIBE | CREA | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → ConversationsRepository.createReceipt | `src/modules/community/repositories/conversations.repository.ts:565` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.markRead → CommunityMessagingService.markRead → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `conversationId` | path | Sí | `string` | — |

### Cuerpo — DTO `MarkReadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recipientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que marca como leído | `src/modules/community/dto/conversation.dto.ts:103` |
| `upToMessageId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Último mensaje leído (por defecto el más reciente) | `src/modules/community/dto/conversation.dto.ts:114` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Conversación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El perfil no es participante activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:302` |
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:174` |

### Flujos

- Módulo Community (19) — etapa `UC-19-07`

---

## 25. POST /community/conversations/contacts/search

- **Origen:** CONTRATO
- **Nombre:** Buscar personas para iniciar una conversación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityMessagingController.searchContacts` — `src/modules/community/controllers/community-messaging.controller.ts:216`

### Qué es y para qué sirve (negocio)

Buscar personas para iniciar una conversación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/conversations/contacts/search` la atiende `CommunityMessagingController.searchContacts` (src/modules/community/controllers/community-messaging.controller.ts:216). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SearchChatContactsRequestDto` (3 campos, 2 obligatorios). Delega en `CommunityMessagingReadService.searchContacts`. Lee community.public_profiles, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-messaging.controller.ts:216` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityMessagingController.searchContacts → CommunityMessagingReadService.searchContacts → PublicProfilesRepository.searchChatContacts | `src/modules/community/repositories/public-profiles.repository.ts:199` |
| `community.user_blocks` | LEE | LEE | POR_SQL | CommunityMessagingController.searchContacts → CommunityMessagingReadService.searchContacts → PublicProfilesRepository.searchChatContacts → PublicProfilesRepository.searchChatContactIds | `src/modules/community/repositories/public-profiles.repository.ts:217` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityMessagingController.searchContacts → CommunityMessagingReadService.searchContacts → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityMessagingController.searchContacts → CommunityMessagingReadService.searchContacts → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Cuerpo — DTO `SearchChatContactsRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/community/dto/read-messaging.dto.ts:134` |
| `q` | `string` | Sí | longitud mínima 2; longitud máxima 80 | `@Transform(({ value }: TransformFnParams): unknown => typeof value === 'string' ? value.trim() : (value as unknown), )` `@IsString()` `@MinLength(2)` `@MaxLength(80)` | — | `src/modules/community/dto/read-messaging.dto.ts:144` |
| `limit` | `object` | No | mínimo 1; máximo 20 | `@Type(() => Number)` `@IsOptional()` `@IsInt()` `@Min(1)` `@Max(20)` | — | `src/modules/community/dto/read-messaging.dto.ts:153` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "q": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "q": "valor-ejemplo",
  "limit": 10
}
```

</details>

### Respuesta — `Promise<ChatContactPageDto>` · DTO `ChatContactPageDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ChatContactDto>` | Sí | — | — | — | `src/modules/community/dto/read-messaging.dto.ts:178` |
| `items[].profileId` | `string` | Sí | formato uuid | — | Perfil interno necesario para crear la conversación. | `src/modules/community/dto/read-messaging.dto.ts:160` |
| `items[].displayName` | `string` | Sí | — | — | Nombre visible en el resultado. | `src/modules/community/dto/read-messaging.dto.ts:164` |
| `items[].headline` | `string` | No | admite null | — | Descripción breve, si la persona la configuró. | `src/modules/community/dto/read-messaging.dto.ts:168` |
| `items[].avatarUrl` | `string` | No | admite null | — | Avatar servido por la ruta pública de archivos, o `null`. | `src/modules/community/dto/read-messaging.dto.ts:172` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-messaging.controller.spec.ts:50` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityMessagingController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. GET /community/feed

- **Origen:** CONTRATO
- **Nombre:** Timeline de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityTimelineController.getFeed` — `src/modules/community/controllers/community-timeline.controller.ts:34`

### Qué es y para qué sirve (negocio)

Timeline de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/feed` la atiende `CommunityTimelineController.getFeed` (src/modules/community/controllers/community-timeline.controller.ts:34). Exige sesión; el controlador no declara roles. Delega en `CommunityTimelineReadService.getFeed`. Lee community.comments, community.feed_items, community.public_profiles, community.reactions, community.social_follows, community.social_posts, community.user_blocks, directory.tenant_memberships y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-timeline.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityEngagementService.ofPosts → CommentsRepository.countByTargets | `src/modules/community/repositories/comments.repository.ts:176` |
| `community.feed_items` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → FeedRepository.listPageByOwner | `src/modules/community/repositories/feed.repository.ts:98` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityEngagementService.ofPosts → ReactionsRepository.listByActorTargets | `src/modules/community/repositories/reactions.repository.ts:164` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.filterVisiblePosts → FollowsRepository.listFollowedProfileIds | `src/modules/community/repositories/follows.repository.ts:82` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → PostsRepository.listByIds | `src/modules/community/repositories/posts.repository.ts:157` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.filterVisiblePosts → BlocksRepository.listBlockedPeers | `src/modules/community/repositories/blocks.repository.ts:87` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityTimelineController.getFeed → CommunityTimelineReadService.getFeed → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `items[].post.id` | `string` | No | formato uuid | — | Identificador de la publicación. | `src/modules/community/dto/read-social.dto.ts:270` |
| `items[].post.authorPublicProfileId` | `string` | No | formato uuid | — | Perfil autor. | `src/modules/community/dto/read-social.dto.ts:274` |
| `items[].post.postTypeConceptId` | `string` | No | formato uuid | — | Concept id del tipo de publicación. | `src/modules/community/dto/read-social.dto.ts:278` |
| `items[].post.bodyText` | `string` | No | — | — | Cuerpo del texto. | `src/modules/community/dto/read-social.dto.ts:282` |
| `items[].post.visibilityConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la visibilidad declarada; nulo se lee como pública. | `src/modules/community/dto/read-social.dto.ts:286` |
| `items[].post.commentsEnabled` | `boolean` | No | admite null | — | Si admite comentarios. | `src/modules/community/dto/read-social.dto.ts:290` |
| `items[].post.publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-social.dto.ts:294` |
| `items[].post.editedAt` | `string` | No | formato date-time; admite null | — | Si fue editada, cuándo. | `src/modules/community/dto/read-social.dto.ts:298` |
| `items[].post.reactions` | `ReactionSummaryDto` | No | — | — | Reacciones de la publicación, con la del propio lector si tiene perfil. **Viaja con la fila y no en una lectura aparte** porque si no, la única forma de saber cuántas reacciones tiene cada publicación era pedir `GET /posts/{id}/reactions` una vez por tarjeta: cincuenta publicaciones, cincuenta peticiones. Sin esto, el conteo de la interfaz sólo podía ser el del gesto que el usuario acababa de hacer, y **al recargar volvía a cero** aunque la reacción estuviera guardada. | `src/modules/community/dto/read-social.dto.ts:311` |
| `items[].post.reactions.tallies` | `array<ReactionTallyDto>` | No | — | — | Recuento por tipo. | `src/modules/community/dto/read-social.dto.ts:239` |
| `items[].post.reactions.tallies[].reactionTypeConceptId` | `string` | No | formato uuid | — | Concept id del tipo de reacción. | `src/modules/community/dto/read-social.dto.ts:214` |
| `items[].post.reactions.tallies[].reactionType` | `string` | No | admite null | — | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `src/modules/community/dto/read-social.dto.ts:228` |
| `items[].post.reactions.tallies[].count` | `number` | No | — | — | Cantidad de reacciones de ese tipo. | `src/modules/community/dto/read-social.dto.ts:232` |
| `items[].post.reactions.total` | `number` | No | — | — | Total de reacciones. | `src/modules/community/dto/read-social.dto.ts:243` |
| `items[].post.reactions.actorReactionTypeConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `src/modules/community/dto/read-social.dto.ts:253` |
| `items[].post.reactions.actorReactionType` | `string` | No | admite null | — | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `src/modules/community/dto/read-social.dto.ts:263` |
| `items[].post.commentCount` | `number` | No | — | — | Comentarios vigentes del hilo completo, raíces y respuestas. Por la misma razón que el resumen de reacciones: el contador no existe como columna —y agregarla sería agregar esquema por comodidad de una lectura—, se calcula agrupado al leer la página. | `src/modules/community/dto/read-social.dto.ts:321` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-timeline.dto.ts:58` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-timeline.dto.ts:62` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-timeline.dto.ts:66` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:422` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityTimelineController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. DELETE /community/follows

- **Origen:** CONTRATO
- **Nombre:** Dejar de seguir un objeto social
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.unfollow` — `src/modules/community/controllers/community-social.controller.ts:295`

### Qué es y para qué sirve (negocio)

Dejar de seguir un objeto social. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/follows` la atiende `CommunitySocialController.unfollow` (src/modules/community/controllers/community-social.controller.ts:295). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.unfollow`. Actualiza community.social_follows. Lee community.public_profiles, community.social_follows, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:295` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | followerProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | followableType (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | followableRefId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.unfollow → CommunitySocialService.unfollow → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_follows` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.unfollow → CommunitySocialService.unfollow | `src/modules/community/services/community-social.service.ts:927` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.unfollow → CommunitySocialService.unfollow → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.unfollow → CommunitySocialService.unfollow → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.unfollow → CommunitySocialService.unfollow → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:139` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. GET /community/follows

- **Origen:** CONTRATO
- **Nombre:** Seguimientos activos de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listFollows` — `src/modules/community/controllers/community-social.controller.ts:502`

### Qué es y para qué sirve (negocio)

Seguimientos activos de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/follows` la atiende `CommunitySocialController.listFollows` (src/modules/community/controllers/community-social.controller.ts:502). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listFollows`. Lee community.public_profiles, community.social_follows, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:502` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | followerProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listFollows → CommunitySocialReadService.listFollows → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.listFollows → CommunitySocialReadService.listFollows → FollowsRepository.listByFollowerPage | `src/modules/community/repositories/follows.repository.ts:136` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.listFollows → CommunitySocialReadService.listFollows → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.listFollows → CommunitySocialReadService.listFollows → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `items` | `array<FollowListItemDto>` | Sí | — | — | Seguimientos de la página. | `src/modules/community/dto/read-social.dto.ts:447` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del seguimiento. | `src/modules/community/dto/read-social.dto.ts:420` |
| `items[].followerProfileId` | `string` | Sí | formato uuid | — | Perfil que sigue. | `src/modules/community/dto/read-social.dto.ts:424` |
| `items[].followableTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de objeto seguido. | `src/modules/community/dto/read-social.dto.ts:428` |
| `items[].followableRefId` | `string` | Sí | formato uuid | — | Id del objeto seguido. | `src/modules/community/dto/read-social.dto.ts:432` |
| `items[].notificationLevelConceptId` | `string` | No | formato uuid; admite null | — | Concept id del nivel de notificación elegido. | `src/modules/community/dto/read-social.dto.ts:436` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo empezó a seguir. | `src/modules/community/dto/read-social.dto.ts:440` |
| `count` | `number` | Sí | — | — | Cuántos trae esta página. | `src/modules/community/dto/read-social.dto.ts:451` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:455` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:459` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /community/follows

- **Origen:** CONTRATO
- **Nombre:** Seguir un objeto social
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.follow` — `src/modules/community/controllers/community-social.controller.ts:256`

### Qué es y para qué sirve (negocio)

Seguir un objeto social. Caso de uso UC-19-05: Sigue objeto social (perfil/tópico/hashtag/grupo). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:129`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/follows` la atiende `CommunitySocialController.follow` (src/modules/community/controllers/community-social.controller.ts:256). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateFollowDto` (4 campos, 3 obligatorios). Delega en `CommunitySocialService.follow`. Crea filas en community.social_follows. Actualiza community.social_follows. Lee community.public_profiles, community.social_follows, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:256` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_follows` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.follow → CommunitySocialService.follow | `src/modules/community/services/community-social.service.ts:797` |
| `community.social_follows` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → FollowsRepository.create | `src/modules/community/repositories/follows.repository.ts:178` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.follow → CommunitySocialService.follow → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 409 | `CONFLICT` | ConflictException: Ya sigue este objeto |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede seguir a uno mismo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:184` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:121` |

### Flujos

- Módulo Community (19) — etapa `UC-19-05`

---

## 30. GET /community/groups

- **Origen:** CONTRATO
- **Nombre:** Grupos de una organización
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.listGroups` — `src/modules/community/controllers/community-groups.controller.ts:188`

### Qué es y para qué sirve (negocio)

Grupos de una organización. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups` la atiende `CommunityGroupsController.listGroups` (src/modules/community/controllers/community-groups.controller.ts:188). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.listGroups`. Lee clinical.encounters, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:188` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | topicId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.listGroups → CommunityGroupsReadService.listGroups → CommunityGroupAudienceService.hiddenFrom → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.listGroups → CommunityGroupsReadService.listGroups → GroupsRepository.searchPage | `src/modules/community/repositories/groups.repository.ts:138` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.listGroups → CommunityGroupsReadService.listGroups → CommunityGroupAudienceService.hiddenFrom → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.listGroups → CommunityGroupsReadService.listGroups → CommunityGroupAudienceService.hiddenFrom → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.listGroups → CommunityGroupsReadService.listGroups → CommunityGroupAudienceService.hiddenFrom → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:476` |
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:62` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /community/groups

- **Origen:** CONTRATO
- **Nombre:** Crear un grupo/comunidad
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.createGroup` — `src/modules/community/controllers/community-groups.controller.ts:78`

### Qué es y para qué sirve (negocio)

Crear un grupo/comunidad. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/groups` la atiende `CommunityGroupsController.createGroup` (src/modules/community/controllers/community-groups.controller.ts:78). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateGroupDto` (7 campos, 2 obligatorios). Delega en `CommunityGroupsService.createGroup`. Crea filas en community.group_members, community.groups. Lee clinical.encounters, community.groups, community.public_profiles, community.topics, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → CommunityGroupAccessService.assertActorBelongsToAudience → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.group_members` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.createMember | `src/modules/community/repositories/groups.repository.ts:286` |
| `community.groups` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.create | `src/modules/community/repositories/groups.repository.ts:242` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.findBySlug | `src/modules/community/repositories/groups.repository.ts:196` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.topics` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → GroupsRepository.findTopicById | `src/modules/community/repositories/groups.repository.ts:507` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → CommunityGroupAccessService.assertActorBelongsToAudience → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → CommunityGroupAccessService.assertActorBelongsToAudience → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroup → CommunityGroupsService.createGroup → CommunityGroupAccessService.assertOrganizationMayStartForums → GroupsRepository.findTenantTypeConceptId | `src/modules/community/repositories/groups.repository.ts:412` |

### Cuerpo — DTO `CreateGroupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `slug` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@MinLength(1)` `@MaxLength(120)` | Slug único | `src/modules/community/dto/group.dto.ts:23` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre del grupo | `src/modules/community/dto/group.dto.ts:32` |
| `description` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | — | `src/modules/community/dto/group.dto.ts:41` |
| `visibility` | `string` | No | valores: PUBLIC, PRIVATE, SECRET, VERIFIED_DOCTORS, ORGANIZATION_STAFF, ATTENDED_PATIENTS | `@IsOptional()` `@IsIn([ 'PUBLIC', 'PRIVATE', 'SECRET', 'VERIFIED_DOCTORS', 'ORGANIZATION_STAFF', 'ATTENDED_PATIENTS', ])` | Visibilidad y público autorizado. `PUBLIC` es el público general y `PRIVATE` el ingreso por invitación o aprobación; `VERIFIED_DOCTORS`, `ORGANIZATION_STAFF` y `ATTENDED_PATIENTS` restringen el foro a ese público: quien no pertenece a él no lo ve (404). | `src/modules/community/dto/group.dto.ts:70` |
| `groupType` | `string` | No | valores: GENERAL, SUPPORT | `@IsOptional()` `@IsIn(['GENERAL', 'SUPPORT'])` | Tipo de grupo | `src/modules/community/dto/group.dto.ts:87` |
| `topicId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tema del grupo | `src/modules/community/dto/group.dto.ts:99` |
| `ownerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil propietario | `src/modules/community/dto/group.dto.ts:107` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; InsufficientRoleException: Para abrir un foro con este público hay que pertenecer a él |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Tema no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya hay un grupo con ese slug |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Para crear un grupo necesita su perfil público configurado; PreconditionFailedException: Para crear un grupo público necesita su perfil público configurado; PreconditionFailedException: Para crear un grupo público, su perfil público tiene que estar completo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:49` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /community/groups/{groupId}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.getGroup` — `src/modules/community/controllers/community-groups.controller.ts:211`

### Qué es y para qué sirve (negocio)

Ficha de un grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups/{groupId}` la atiende `CommunityGroupsController.getGroup` (src/modules/community/controllers/community-groups.controller.ts:211). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.getGroup`. Lee clinical.encounters, community.group_members, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:211` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:211` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → GroupsRepository.countMembersByStatus | `src/modules/community/repositories/groups.repository.ts:472` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:110` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.getGroup → CommunityGroupsReadService.getGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:72` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /community/groups/{groupId}/members

- **Origen:** CONTRATO
- **Nombre:** Integrantes de un grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.listMembers` — `src/modules/community/controllers/community-groups.controller.ts:222`

### Qué es y para qué sirve (negocio)

Integrantes de un grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups/{groupId}/members` la atiende `CommunityGroupsController.listMembers` (src/modules/community/controllers/community-groups.controller.ts:222). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.listMembers`. Lee clinical.encounters, community.group_members, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:222` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | joinStatus (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:222` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:275` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:110` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.listMembers → CommunityGroupsReadService.listMembers → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:105` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /community/groups/{groupId}/members

- **Origen:** CONTRATO
- **Nombre:** Unirse a un grupo / comunidad
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.joinGroup` — `src/modules/community/controllers/community-groups.controller.ts:94`

### Qué es y para qué sirve (negocio)

Unirse a un grupo / comunidad. Caso de uso UC-19-13: Se une a grupo/comunidad. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:137`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/groups/{groupId}/members` la atiende `CommunityGroupsController.joinGroup` (src/modules/community/controllers/community-groups.controller.ts:94). Exige sesión; el controlador no declara roles. Valida el cuerpo como `JoinGroupDto` (2 campos, 1 obligatorio). Delega en `CommunityGroupsService.joinGroup`. Crea filas en community.group_members. Actualiza community.group_members, community.groups. Lee clinical.encounters, community.group_members, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:94` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.group_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup | `src/modules/community/services/community-groups.service.ts:328` |
| `community.group_members` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → GroupsRepository.createMember | `src/modules/community/repositories/groups.repository.ts:286` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:275` |
| `community.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup | `src/modules/community/services/community-groups.service.ts:348` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:110` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.joinGroup → CommunityGroupsService.joinGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |

### Cuerpo — DTO `JoinGroupDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `memberProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil que se une | `src/modules/community/dto/group.dto.ts:117` |
| `invitedByProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil que invitó (grupos privados) | `src/modules/community/dto/group.dto.ts:128` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 409 | `CONFLICT` | ConflictException: El perfil ya es miembro del grupo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:56` |

### Flujos

- Módulo Community (19) — etapa `UC-19-13`

---

## 35. DELETE /community/groups/{groupId}/members/{member}

- **Origen:** CONTRATO
- **Nombre:** Salir del grupo o dar de baja a un integrante
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.leaveGroup` — `src/modules/community/controllers/community-groups.controller.ts:143`

### Qué es y para qué sirve (negocio)

Salir del grupo o dar de baja a un integrante. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`DELETE /community/groups/{groupId}/members/{member}` la atiende `CommunityGroupsController.leaveGroup` (src/modules/community/controllers/community-groups.controller.ts:143). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsService.leaveGroup`. Actualiza community.group_members, community.groups. Lee clinical.encounters, community.group_members, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:143` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId, member | `src/modules/community/controllers/community-groups.controller.ts:143` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.group_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup | `src/modules/community/services/community-groups.service.ts:432` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:275` |
| `community.groups` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup | `src/modules/community/services/community-groups.service.ts:447` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → GroupsRepository.findByIdForUpdate | `src/modules/community/repositories/groups.repository.ts:363` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.leaveGroup → CommunityGroupsService.leaveGroup → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |
| `member` | path | Sí | `string` | Id del perfil del integrante que sale del grupo. |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<GroupMemberUpdatedDto>` · DTO `GroupMemberUpdatedDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Membresía afectada. | `src/modules/community/dto/group-wall.dto.ts:267` |
| `memberRoleConceptId` | `string` | Sí | formato uuid | — | Concept id del rol resultante. | `src/modules/community/dto/group-wall.dto.ts:271` |
| `joinStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado resultante. | `src/modules/community/dto/group-wall.dto.ts:275` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Sólo quien administra el grupo puede resolver sus membresías |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado; ResourceNotFoundException: El perfil no es del grupo |
| 409 | `CONFLICT` | ConflictException: Al dueño del grupo no lo puede sacar otro: sólo él puede irse, o transferir el grupo antes |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:78` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. PATCH /community/groups/{groupId}/members/{member}

- **Origen:** CONTRATO
- **Nombre:** Aprobar/rechazar un alta o cambiar el rol
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.updateMember` — `src/modules/community/controllers/community-groups.controller.ts:111`

### Qué es y para qué sirve (negocio)

Aprobar/rechazar un alta o cambiar el rol. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /community/groups/{groupId}/members/{member}` la atiende `CommunityGroupsController.updateMember` (src/modules/community/controllers/community-groups.controller.ts:111). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateGroupMemberDto` (3 campos, 0 obligatorios). Delega en `CommunityGroupsService.updateMember`. Crea filas en messaging.notification_requests. Actualiza community.group_members. Lee clinical.encounters, community.group_members, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants, messaging.message_channels y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId, member | `src/modules/community/controllers/community-groups.controller.ts:111` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.group_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember | `src/modules/community/services/community-groups.service.ts:543` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → GroupsRepository.findMemberById | `src/modules/community/repositories/groups.repository.ts:317` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:110` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → PublicProfilesRepository.listByIds | `src/modules/community/repositories/public-profiles.repository.ts:135` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | CommunityGroupsController.updateMember → CommunityGroupsService.updateMember → CommunityGroupNotificationsService.notifyJoinApproved → CommunityGroupNotificationsService.emit → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `groupId` | path | Sí | `string` | — |
| `member` | path | Sí | `string` | Id de la membresía (`group_members.id`). |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Sólo quien administra el grupo puede resolver sus membresías |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado; ResourceNotFoundException: Membresía no encontrada; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Hay que indicar una decisión o un rol; PreconditionFailedException: La solicitud de ingreso ya estaba resuelta; PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:85` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. GET /community/groups/{groupId}/posts

- **Origen:** CONTRATO
- **Nombre:** Muro de un grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.listWall` — `src/modules/community/controllers/community-groups.controller.ts:242`

### Qué es y para qué sirve (negocio)

Muro de un grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/groups/{groupId}/posts` la atiende `CommunityGroupsController.listWall` (src/modules/community/controllers/community-groups.controller.ts:242). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupWallService.listWall`. Lee clinical.encounters, community.comments, community.group_members, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:242` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:242` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.comments` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommentsRepository.listRootsPage | `src/modules/community/repositories/comments.repository.ts:103` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:275` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:110` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.listWall → CommunityGroupWallService.listWall → CommunityGroupAccessService.resolve → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Hay que ser integrante del grupo para ver su contenido |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:95` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /community/groups/{groupId}/posts

- **Origen:** CONTRATO
- **Nombre:** Publicar en el muro del grupo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityGroupsController.createGroupPost` — `src/modules/community/controllers/community-groups.controller.ts:164`

### Qué es y para qué sirve (negocio)

Publicar en el muro del grupo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/groups/{groupId}/posts` la atiende `CommunityGroupsController.createGroupPost` (src/modules/community/controllers/community-groups.controller.ts:164). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateGroupPostDto` (3 campos, 2 obligatorios). Delega en `CommunityGroupWallService.createPost`. Crea filas en community.comments, messaging.notification_requests. Actualiza community.comments. Lee clinical.encounters, community.comments, community.group_members, community.groups, community.public_profiles, community.verified_badges, directory.tenant_memberships, directory.tenants y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-groups.controller.ts:164` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: groupId | `src/modules/community/controllers/community-groups.controller.ts:164` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.hasFinishedEncounter | `src/modules/community/repositories/groups.repository.ts:451` |
| `community.comments` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost | `src/modules/community/services/community-group-wall.service.ts:147` |
| `community.comments` | ESCRIBE | CREA | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommentsRepository.create | `src/modules/community/repositories/comments.repository.ts:200` |
| `community.comments` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommentsRepository.findById | `src/modules/community/repositories/comments.repository.ts:79` |
| `community.group_members` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.resolve → GroupsRepository.findMember | `src/modules/community/repositories/groups.repository.ts:275` |
| `community.groups` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.resolve → GroupsRepository.findById | `src/modules/community/repositories/groups.repository.ts:110` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → CommunityGroupAudienceService.isVerifiedPractitioner → VerifiedBadgesRepository.findActive | `src/modules/community/repositories/verified-badges.repository.ts:61` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.resolve → CommunityGroupAccessService.assertAudienceVisible → CommunityGroupAudienceService.isEligible → GroupsRepository.isActiveTenantMember | `src/modules/community/repositories/groups.repository.ts:428` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityGroupsController.createGroupPost → CommunityGroupWallService.createPost → CommunityGroupAccessService.assertOrganizationMayStartForums → GroupsRepository.findTenantTypeConceptId | `src/modules/community/repositories/groups.repository.ts:412` |
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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado; ForbiddenException: Hay que ser integrante del grupo para publicar en su muro |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Grupo no encontrado; ResourceNotFoundException: Perfil autor no encontrado; ResourceNotFoundException: La publicación a la que responde no es de este grupo; ResourceNotFoundException: Canal no encontrado; ResourceNotFoundException: Plantilla no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La notificación a una dirección externa también necesita el usuario destinatario / La notificación necesita el usuario destinatario; PreconditionFailedException: El canal no está activo; PreconditionFailedException: La plantilla no está publicada; PreconditionFailedException: La plantilla es de otro canal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-groups.controller.spec.ts:92` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityGroupsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /community/moderation/appeals

- **Origen:** CONTRATO
- **Nombre:** Apelaciones presentadas, con su decisión
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.listAppeals` — `src/modules/community/controllers/community-moderation.controller.ts:182`

### Qué es y para qué sirve (negocio)

Apelaciones presentadas, con su decisión. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/moderation/appeals` la atiende `CommunityModerationController.listAppeals` (src/modules/community/controllers/community-moderation.controller.ts:182). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CommunityModerationReadService.listAppeals`. Lee community.moderation_appeals, community.moderation_decisions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:182` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_appeals` | LEE | LEE | DIRECTA | CommunityModerationController.listAppeals → CommunityModerationReadService.listAppeals → ModerationRepository.listAppealsPage | `src/modules/community/repositories/moderation.repository.ts:662` |
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.listAppeals → CommunityModerationReadService.listAppeals → ModerationRepository.listDecisionsByIds | `src/modules/community/repositories/moderation.repository.ts:622` |

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
| `items` | `array<ModerationAppealItemDto>` | Sí | — | — | Apelaciones de la página. | `src/modules/community/dto/read-moderation.dto.ts:435` |
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
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-moderation.dto.ts:439` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-moderation.dto.ts:443` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/community/dto/read-moderation.dto.ts:447` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:106` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityModerationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. POST /community/moderation/appeals/{appealId}/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver una apelación de moderación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.resolveAppeal` — `src/modules/community/controllers/community-moderation.controller.ts:112`

### Qué es y para qué sirve (negocio)

Resolver una apelación de moderación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/moderation/appeals/{appealId}/resolve` la atiende `CommunityModerationController.resolveAppeal` (src/modules/community/controllers/community-moderation.controller.ts:112). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CommunityResolveAppealDto` (1 campo, 1 obligatorio). Delega en `CommunityModerationService.resolveAppeal`. Actualiza community.moderation_appeals, community.moderation_queue. Lee community.moderation_appeals, community.moderation_decisions, community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:112` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: appealId | `src/modules/community/controllers/community-moderation.controller.ts:112` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_appeals` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal | `src/modules/community/services/community-moderation.service.ts:338` |
| `community.moderation_appeals` | LEE | LEE | DIRECTA | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal → ModerationRepository.findAppealById | `src/modules/community/repositories/moderation.repository.ts:437` |
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal → ModerationRepository.findDecisionById | `src/modules/community/repositories/moderation.repository.ts:285` |
| `community.moderation_queue` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.resolveAppeal → CommunityModerationService.resolveAppeal | `src/modules/community/services/community-moderation.service.ts:364` |
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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Apelación no encontrada |
| 409 | `CONFLICT` | ConflictException: La apelación ya está resuelta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:66` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityModerationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. GET /community/moderation/decisions

- **Origen:** CONTRATO
- **Nombre:** Decisiones de moderación tomadas
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.listDecisions` — `src/modules/community/controllers/community-moderation.controller.ts:169`

### Qué es y para qué sirve (negocio)

Decisiones de moderación tomadas. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/moderation/decisions` la atiende `CommunityModerationController.listDecisions` (src/modules/community/controllers/community-moderation.controller.ts:169). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CommunityModerationReadService.listDecisions`. Lee community.moderation_decisions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:169` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.listDecisions → CommunityModerationReadService.listDecisions → ModerationRepository.listDecisionsPage | `src/modules/community/repositories/moderation.repository.ts:604` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:103` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityModerationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. POST /community/moderation/decisions/{decisionId}/appeal

- **Origen:** CONTRATO
- **Nombre:** Apelar una decisión de moderación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.appeal` — `src/modules/community/controllers/community-moderation.controller.ts:95`

### Qué es y para qué sirve (negocio)

Apelar una decisión de moderación. Caso de uso UC-19-10: Apela una decisión. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:134`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/moderation/decisions/{decisionId}/appeal` la atiende `CommunityModerationController.appeal` (src/modules/community/controllers/community-moderation.controller.ts:95). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAppealDto` (2 campos, 2 obligatorios). Delega en `CommunityModerationService.appeal`. Crea filas en community.moderation_appeals, community.moderation_queue. Lee community.moderation_appeals, community.moderation_decisions, community.moderation_queue, community.moderation_strikes, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-moderation.controller.ts:95` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: decisionId | `src/modules/community/controllers/community-moderation.controller.ts:95` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_appeals` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.createAppeal | `src/modules/community/repositories/moderation.repository.ts:394` |
| `community.moderation_appeals` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.findOpenAppealForDecision | `src/modules/community/repositories/moderation.repository.ts:420` |
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.findDecisionById | `src/modules/community/repositories/moderation.repository.ts:285` |
| `community.moderation_queue` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.createQueue | `src/modules/community/repositories/moderation.repository.ts:255` |
| `community.moderation_queue` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.findQueueById | `src/modules/community/repositories/moderation.repository.ts:232` |
| `community.moderation_strikes` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → ModerationRepository.findStrikeByDecisionAndSubject | `src/modules/community/repositories/moderation.repository.ts:359` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityModerationController.appeal → CommunityModerationService.appeal → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: Sólo el sancionado por esta decisión puede apelarla |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Decisión no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya existe una apelación abierta para esta decisión |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:59` |

### Flujos

- Módulo Community (19) — etapa `UC-19-10`

---

## 43. GET /community/moderation/decisions/mine

- **Origen:** CONTRATO
- **Nombre:** Mis propias decisiones de moderación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.listMyDecisions` — `src/modules/community/controllers/community-moderation.controller.ts:154`

### Qué es y para qué sirve (negocio)

Mis propias decisiones de moderación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/moderation/decisions/mine` la atiende `CommunityModerationController.listMyDecisions` (src/modules/community/controllers/community-moderation.controller.ts:154). Exige sesión; el controlador no declara roles. Delega en `CommunityModerationReadService.listMyDecisions`. Lee community.moderation_appeals, community.moderation_decisions, community.moderation_strikes, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-moderation.controller.ts:154` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.moderation_appeals` | LEE | LEE | DIRECTA | CommunityModerationController.listMyDecisions → CommunityModerationReadService.listMyDecisions → ModerationRepository.findOpenAppealForDecision | `src/modules/community/repositories/moderation.repository.ts:420` |
| `community.moderation_decisions` | LEE | LEE | DIRECTA | CommunityModerationController.listMyDecisions → CommunityModerationReadService.listMyDecisions → ModerationRepository.listDecisionsByIds | `src/modules/community/repositories/moderation.repository.ts:622` |
| `community.moderation_strikes` | LEE | LEE | DIRECTA | CommunityModerationController.listMyDecisions → CommunityModerationReadService.listMyDecisions → ModerationRepository.listStrikesBySubject | `src/modules/community/repositories/moderation.repository.ts:382` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityModerationController.listMyDecisions → CommunityModerationReadService.listMyDecisions → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityModerationController.listMyDecisions → CommunityModerationReadService.listMyDecisions → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityModerationController.listMyDecisions → CommunityModerationReadService.listMyDecisions → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | query | Sí | `string` | Perfil propio |
| `cursor` | query | No | `string` | Cursor de la página anterior |
| `limit` | query | No | `number` | Tope de filas |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyModerationDecisionPageDto>` · DTO `MyModerationDecisionPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyModerationDecisionItemDto>` | Sí | — | — | Decisiones de la página. | `src/modules/community/dto/read-moderation.dto.ts:416` |
| `items[].decisionId` | `string` | Sí | formato uuid | — | Identificador de la decisión, el que viaja en `POST .../appeal`. | `src/modules/community/dto/read-moderation.dto.ts:389` |
| `items[].policyConceptId` | `string` | Sí | formato uuid | — | Concept id de la política aplicada. | `src/modules/community/dto/read-moderation.dto.ts:393` |
| `items[].decisionConceptId` | `string` | Sí | formato uuid | — | Concept id de la decisión tomada (removido, restringido, advertido). | `src/modules/community/dto/read-moderation.dto.ts:397` |
| `items[].rationaleText` | `string` | No | admite null | — | Motivo escrito por quien decidió. | `src/modules/community/dto/read-moderation.dto.ts:401` |
| `items[].decidedAt` | `string` | No | formato date-time; admite null | — | Cuándo se decidió. | `src/modules/community/dto/read-moderation.dto.ts:405` |
| `items[].appealable` | `boolean` | Sí | — | — | `false` si ya hay una apelación abierta para esta decisión. | `src/modules/community/dto/read-moderation.dto.ts:409` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-moderation.dto.ts:420` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-moderation.dto.ts:424` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/community/dto/read-moderation.dto.ts:428` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:92` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityModerationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. GET /community/moderation/queue

- **Origen:** CONTRATO
- **Nombre:** Cola de moderación con filtros y cursor
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.listQueue` — `src/modules/community/controllers/community-moderation.controller.ts:136`

### Qué es y para qué sirve (negocio)

Cola de moderación con filtros y cursor. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/moderation/queue` la atiende `CommunityModerationController.listQueue` (src/modules/community/controllers/community-moderation.controller.ts:136). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CommunityModerationReadService.listQueue`. Lee community.content_reports, community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.content_reports` | LEE | LEE | DIRECTA | CommunityModerationController.listQueue → CommunityModerationReadService.listQueue → ModerationRepository.listReportsByIds | `src/modules/community/repositories/moderation.repository.ts:534` |
| `community.moderation_queue` | LEE | LEE | DIRECTA | CommunityModerationController.listQueue → CommunityModerationReadService.listQueue → ModerationRepository.listQueuePage | `src/modules/community/repositories/moderation.repository.ts:513` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:78` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityModerationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. POST /community/moderation/queue/{queueId}/decision

- **Origen:** CONTRATO
- **Nombre:** Resolver moderación (decisión + strike)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.decide` — `src/modules/community/controllers/community-moderation.controller.ts:77`

### Qué es y para qué sirve (negocio)

Resolver moderación (decisión + strike). Caso de uso UC-19-09: Resuelve moderación (decisión + strike). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:133`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/moderation/queue/{queueId}/decision` la atiende `CommunityModerationController.decide` (src/modules/community/controllers/community-moderation.controller.ts:77). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ModerationDecisionDto` (4 campos, 2 obligatorios). Delega en `CommunityModerationService.decide`. Crea filas en community.moderation_decisions, community.moderation_strikes. Actualiza community.content_reports, community.moderation_queue. Lee community.content_reports, community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-moderation.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: queueId | `src/modules/community/controllers/community-moderation.controller.ts:77` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.content_reports` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.decide → CommunityModerationService.decide | `src/modules/community/services/community-moderation.service.ts:161` |
| `community.content_reports` | LEE | LEE | DIRECTA | CommunityModerationController.decide → CommunityModerationService.decide → ModerationRepository.findReportsByTarget | `src/modules/community/repositories/moderation.repository.ts:217` |
| `community.moderation_decisions` | ESCRIBE | CREA | DIRECTA | CommunityModerationController.decide → CommunityModerationService.decide → ModerationRepository.createDecision | `src/modules/community/repositories/moderation.repository.ts:299` |
| `community.moderation_queue` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityModerationController.decide → CommunityModerationService.decide | `src/modules/community/services/community-moderation.service.ts:153` |
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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entrada de cola no encontrada |
| 409 | `CONFLICT` | ConflictException: La entrada de cola ya está resuelta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:52` |

### Flujos

- Módulo Community (19) — etapa `UC-19-09`

---

## 46. GET /community/notifications

- **Origen:** CONTRATO
- **Nombre:** Notificaciones sociales de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityTimelineController.listNotifications` — `src/modules/community/controllers/community-timeline.controller.ts:49`

### Qué es y para qué sirve (negocio)

Notificaciones sociales de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/notifications` la atiende `CommunityTimelineController.listNotifications` (src/modules/community/controllers/community-timeline.controller.ts:49). Exige sesión; el controlador no declara roles. Delega en `CommunityTimelineReadService.listNotifications`. Lee community.public_profiles, community.social_notifications, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-timeline.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | profileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityTimelineController.listNotifications → CommunityTimelineReadService.listNotifications → CommunityVisibilityService.assertOwnProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_notifications` | LEE | LEE | DIRECTA | CommunityTimelineController.listNotifications → CommunityTimelineReadService.listNotifications → NotificationsRepository.listByRecipientPage | `src/modules/community/repositories/notifications.repository.ts:29` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityTimelineController.listNotifications → CommunityTimelineReadService.listNotifications → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityTimelineController.listNotifications → CommunityTimelineReadService.listNotifications → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:467` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityTimelineController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 47. GET /community/polls/{pollId}

- **Origen:** CONTRATO
- **Nombre:** Encuesta con opciones, recuentos y voto propio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPollsController.getPoll` — `src/modules/community/controllers/community-polls.controller.ts:74`

### Qué es y para qué sirve (negocio)

Encuesta con opciones, recuentos y voto propio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/polls/{pollId}` la atiende `CommunityPollsController.getPoll` (src/modules/community/controllers/community-polls.controller.ts:74). Exige sesión; el controlador no declara roles. Delega en `CommunityPollsReadService.getPoll`. Lee community.poll_options, community.poll_votes, community.polls, community.public_profiles, community.social_follows, community.social_posts, community.user_blocks, directory.tenant_memberships y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-polls.controller.ts:74` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pollId | `src/modules/community/controllers/community-polls.controller.ts:74` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.poll_options` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PollsRepository.listOptions | `src/modules/community/repositories/polls.repository.ts:116` |
| `community.poll_votes` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PollsRepository.listVotedOptionIds | `src/modules/community/repositories/polls.repository.ts:140` |
| `community.polls` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PollsRepository.findPollById | `src/modules/community/repositories/polls.repository.ts:47` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityPollsController.getPoll → CommunityPollsReadService.getPoll → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuesta no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPollsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. POST /community/polls/{pollId}/votes

- **Origen:** CONTRATO
- **Nombre:** Votar en una encuesta
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPollsController.vote` — `src/modules/community/controllers/community-polls.controller.ts:57`

### Qué es y para qué sirve (negocio)

Votar en una encuesta. Caso de uso UC-19-12: Vota en encuesta. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:136`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/polls/{pollId}/votes` la atiende `CommunityPollsController.vote` (src/modules/community/controllers/community-polls.controller.ts:57). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateVoteDto` (2 campos, 2 obligatorios). Delega en `CommunityPollsService.vote`. Crea filas en community.poll_votes. Actualiza community.poll_options, community.polls. Lee community.poll_options, community.poll_votes, community.polls, community.public_profiles, community.social_follows, community.social_posts, community.user_blocks, directory.tenant_memberships y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-polls.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: pollId | `src/modules/community/controllers/community-polls.controller.ts:57` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.poll_options` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityPollsController.vote → CommunityPollsService.vote | `src/modules/community/services/community-polls.service.ts:193` |
| `community.poll_options` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.findOptionById | `src/modules/community/repositories/polls.repository.ts:111` |
| `community.poll_votes` | ESCRIBE | CREA | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.createVote | `src/modules/community/repositories/polls.repository.ts:237` |
| `community.poll_votes` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.findVote | `src/modules/community/repositories/polls.repository.ts:190` |
| `community.polls` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunityPollsController.vote → CommunityPollsService.vote | `src/modules/community/services/community-polls.service.ts:196` |
| `community.polls` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PollsRepository.findPollById | `src/modules/community/repositories/polls.repository.ts:47` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityPollsController.vote → CommunityPollsService.vote → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Encuesta no encontrada; ResourceNotFoundException: La opción no pertenece a la encuesta |
| 409 | `CONFLICT` | ConflictException: Ya votó por esta opción; ConflictException: La encuesta admite un único voto por votante |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La encuesta está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-polls.controller.spec.ts:42` |

### Flujos

- Módulo Community (19) — etapa `UC-19-12`

---

## 49. GET /community/posts/{postId}

- **Origen:** CONTRATO
- **Nombre:** Publicación con media, hashtags y menciones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getPost` — `src/modules/community/controllers/community-social.controller.ts:432`

### Qué es y para qué sirve (negocio)

Publicación con media, hashtags y menciones. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/posts/{postId}` la atiende `CommunitySocialController.getPost` (src/modules/community/controllers/community-social.controller.ts:432). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getPost`. Lee community.comments, community.content_hashtags, community.hashtags, community.mentions, community.post_media, community.public_profiles, community.reactions, community.social_follows y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:432` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-social.controller.ts:432` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityEngagementService.ofPosts → CommentsRepository.countByTargets | `src/modules/community/repositories/comments.repository.ts:176` |
| `community.content_hashtags` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listHashtags | `src/modules/community/repositories/posts.repository.ts:208` |
| `community.hashtags` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listHashtags | `src/modules/community/repositories/posts.repository.ts:213` |
| `community.mentions` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listMentions | `src/modules/community/repositories/posts.repository.ts:221` |
| `community.post_media` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.listMedia | `src/modules/community/repositories/posts.repository.ts:187` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityEngagementService.ofPosts → ReactionsRepository.listByActorTargets | `src/modules/community/repositories/reactions.repository.ts:164` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.getPost → CommunitySocialReadService.getPost → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `media` | `array<PostMediaDto>` | Sí | — | — | Adjuntos, en orden de despliegue. | `src/modules/community/dto/read-social.dto.ts:328` |
| `media[].id` | `string` | Sí | formato uuid | — | Identificador del adjunto. | `src/modules/community/dto/read-social.dto.ts:138` |
| `media[].fileId` | `string` | Sí | formato uuid | — | Archivo en `common.files`. | `src/modules/community/dto/read-social.dto.ts:142` |
| `media[].mediaRoleConceptId` | `string` | Sí | formato uuid | — | Concept id del rol del medio (imagen, video, documento). | `src/modules/community/dto/read-social.dto.ts:146` |
| `media[].altText` | `string` | No | admite null | — | Texto alternativo para lectores de pantalla. | `src/modules/community/dto/read-social.dto.ts:150` |
| `media[].ordinal` | `number` | No | admite null | — | Orden de despliegue. | `src/modules/community/dto/read-social.dto.ts:154` |
| `hashtags` | `array<PostHashtagDto>` | Sí | — | — | Etiquetas resueltas a texto. | `src/modules/community/dto/read-social.dto.ts:332` |
| `hashtags[].id` | `string` | Sí | formato uuid | — | Identificador de la etiqueta. | `src/modules/community/dto/read-social.dto.ts:184` |
| `hashtags[].tag` | `string` | Sí | — | — | Texto de la etiqueta, listo para mostrar. | `src/modules/community/dto/read-social.dto.ts:188` |
| `mentions` | `array<PostMentionDto>` | Sí | — | — | Menciones activas del cuerpo. | `src/modules/community/dto/read-social.dto.ts:336` |
| `mentions[].id` | `string` | Sí | formato uuid | — | Identificador de la mención. | `src/modules/community/dto/read-social.dto.ts:195` |
| `mentions[].mentionedProfileId` | `string` | Sí | formato uuid | — | Perfil mencionado. | `src/modules/community/dto/read-social.dto.ts:199` |
| `mentions[].offsetStart` | `number` | No | admite null | — | Posición inicial dentro del texto. | `src/modules/community/dto/read-social.dto.ts:203` |
| `mentions[].offsetEnd` | `number` | No | admite null | — | Posición final dentro del texto. | `src/modules/community/dto/read-social.dto.ts:207` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:163` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. GET /community/posts/{postId}/comments

- **Origen:** CONTRATO
- **Nombre:** Comentarios de una publicación (hilo anidado)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listPostComments` — `src/modules/community/controllers/community-social.controller.ts:443`

### Qué es y para qué sirve (negocio)

Comentarios de una publicación (hilo anidado). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/posts/{postId}/comments` la atiende `CommunitySocialController.listPostComments` (src/modules/community/controllers/community-social.controller.ts:443). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listPostComments`. Lee community.comment_media, community.comments, community.public_profiles, community.social_follows, community.social_posts, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:443` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-social.controller.ts:443` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comment_media` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunitySocialReadService.mediaByComment → CommentsRepository.listMediaForComments | `src/modules/community/repositories/comments.repository.ts:238` |
| `community.comments` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommentsRepository.listRootsPage | `src/modules/community/repositories/comments.repository.ts:103` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunitySocialReadService.assertPostVisible → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.listPostComments → CommunitySocialReadService.listPostComments → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `items` | `array<CommentThreadItemDto>` | Sí | — | — | Comentarios raíz de la página, cada uno con sus respuestas. | `src/modules/community/dto/read-social.dto.ts:401` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del comentario. | `src/modules/community/dto/read-social.dto.ts:362` |
| `items[].authorProfileId` | `string` | Sí | formato uuid | — | Perfil autor. | `src/modules/community/dto/read-social.dto.ts:366` |
| `items[].bodyText` | `string` | Sí | — | — | Cuerpo del comentario. | `src/modules/community/dto/read-social.dto.ts:370` |
| `items[].parentCommentId` | `string` | No | formato uuid; admite null | — | Comentario padre, si es una respuesta. | `src/modules/community/dto/read-social.dto.ts:374` |
| `items[].threadDepth` | `number` | No | admite null | — | Profundidad dentro del hilo. | `src/modules/community/dto/read-social.dto.ts:378` |
| `items[].replyCount` | `number` | No | admite null | — | Cuántas respuestas tiene registradas. | `src/modules/community/dto/read-social.dto.ts:382` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se creó. | `src/modules/community/dto/read-social.dto.ts:386` |
| `items[].replies` | `array<CommentThreadItemDto>` | Sí | — | — | Respuestas anidadas de este comentario. | `src/modules/community/dto/read-social.dto.ts:390` |
| `items[].media` | `array<CommentMediaDto>` | Sí | — | — | Adjuntos del comentario (REQ-01-011), en orden de despliegue. | `src/modules/community/dto/read-social.dto.ts:394` |
| `items[].media[].id` | `string` | Sí | formato uuid | — | Identificador del adjunto. | `src/modules/community/dto/read-social.dto.ts:161` |
| `items[].media[].fileId` | `string` | Sí | formato uuid | — | Archivo en `common.files`. | `src/modules/community/dto/read-social.dto.ts:165` |
| `items[].media[].mediaRoleConceptId` | `string` | Sí | formato uuid | — | Concept id del rol del medio (imagen, sticker, GIF). | `src/modules/community/dto/read-social.dto.ts:169` |
| `items[].media[].altText` | `string` | No | admite null | — | Texto alternativo para lectores de pantalla. | `src/modules/community/dto/read-social.dto.ts:173` |
| `items[].media[].ordinal` | `number` | No | admite null | — | Orden de despliegue. | `src/modules/community/dto/read-social.dto.ts:177` |
| `count` | `number` | Sí | — | — | Cuántas raíces trae esta página. | `src/modules/community/dto/read-social.dto.ts:405` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:409` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-social.dto.ts:413` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:279` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 51. POST /community/posts/{postId}/polls

- **Origen:** CONTRATO
- **Nombre:** Crear una encuesta con opciones sobre un post
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPollsController.createPoll` — `src/modules/community/controllers/community-polls.controller.ts:40`

### Qué es y para qué sirve (negocio)

Crear una encuesta con opciones sobre un post. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/posts/{postId}/polls` la atiende `CommunityPollsController.createPoll` (src/modules/community/controllers/community-polls.controller.ts:40). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePollDto` (4 campos, 2 obligatorios). Delega en `CommunityPollsService.createPoll`. Crea filas en community.poll_options, community.polls. Lee community.public_profiles, community.social_posts, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-polls.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-polls.controller.ts:40` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.poll_options` | ESCRIBE | CREA | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → PollsRepository.createOption | `src/modules/community/repositories/polls.repository.ts:90` |
| `community.polls` | ESCRIBE | CREA | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → PollsRepository.createPoll | `src/modules/community/repositories/polls.repository.ts:58` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityPollsController.createPoll → CommunityPollsService.createPoll → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Post no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-polls.controller.spec.ts:35` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPollsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. GET /community/posts/{postId}/reactions

- **Origen:** CONTRATO
- **Nombre:** Reacciones de una publicación, agrupadas por tipo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getPostReactions` — `src/modules/community/controllers/community-social.controller.ts:489`

### Qué es y para qué sirve (negocio)

Reacciones de una publicación, agrupadas por tipo. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/posts/{postId}/reactions` la atiende `CommunitySocialController.getPostReactions` (src/modules/community/controllers/community-social.controller.ts:489). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getPostReactions`. Lee community.public_profiles, community.reactions, community.social_follows, community.social_posts, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:489` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-social.controller.ts:489` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → ReactionsRepository.findByActorTarget | `src/modules/community/repositories/reactions.repository.ts:54` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.followsProfile → FollowsRepository.findByFollowerTarget | `src/modules/community/repositories/follows.repository.ts:54` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunitySocialReadService.assertPostVisible → PostsRepository.findById | `src/modules/community/repositories/posts.repository.ts:103` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunitySocialReadService.assertPostVisible → CommunityVisibilityService.canViewPost → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.getPostReactions → CommunitySocialReadService.getPostReactions → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `tallies` | `array<ReactionTallyDto>` | Sí | — | — | Recuento por tipo. | `src/modules/community/dto/read-social.dto.ts:239` |
| `tallies[].reactionTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de reacción. | `src/modules/community/dto/read-social.dto.ts:214` |
| `tallies[].reactionType` | `string` | No | admite null | — | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `src/modules/community/dto/read-social.dto.ts:228` |
| `tallies[].count` | `number` | Sí | — | — | Cantidad de reacciones de ese tipo. | `src/modules/community/dto/read-social.dto.ts:232` |
| `total` | `number` | Sí | — | — | Total de reacciones. | `src/modules/community/dto/read-social.dto.ts:243` |
| `actorReactionTypeConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `src/modules/community/dto/read-social.dto.ts:253` |
| `actorReactionType` | `string` | No | admite null | — | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `src/modules/community/dto/read-social.dto.ts:263` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:305` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. GET /community/profiles/{profileId}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un perfil público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getProfile` — `src/modules/community/controllers/community-social.controller.ts:405`

### Qué es y para qué sirve (negocio)

Ficha de un perfil público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/{profileId}` la atiende `CommunitySocialController.getProfile` (src/modules/community/controllers/community-social.controller.ts:405). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getProfile`. Lee community.prestige_scores, community.public_profiles, community.user_blocks, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:405` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:405` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.prestige_scores` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → CommunityPrestigeRepository.findScoreByProfile | `src/modules/community/repositories/community-prestige.repository.ts:44` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → PublicProfilesRepository.listBadgesBySubject | `src/modules/community/repositories/public-profiles.repository.ts:281` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.getProfile → CommunitySocialReadService.getProfile → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicProfileDetailDto>` · DTO `PublicProfileDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del perfil. | `src/modules/community/dto/read-social.dto.ts:56` |
| `tenantId` | `string` | Sí | formato uuid | — | Organización a la que pertenece. | `src/modules/community/dto/read-social.dto.ts:60` |
| `targetTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sujeto (usuario, profesional, organización). | `src/modules/community/dto/read-social.dto.ts:64` |
| `kind` | `object` | No | valores: PRACTITIONER, ORGANIZATION, PHARMACY, DIAGNOSTIC_UNIT, INSURER | — | La vertical en claro, o `null` si este perfil no tiene ficha pública. `targetTypeConceptId` es un uuid de terminología y el cliente **no tiene su tabla**: sin esto tendría que adivinar a qué URL pública lleva un perfil —`/p`, `/o`, `/f`, `/l`, `/s`— o no ofrecer el enlace nunca. Es el mismo valor que publica el buscador anónimo, del mismo mapa. `null` en el perfil de un paciente: no se publica, y decirlo es parte de la respuesta. | `src/modules/community/dto/read-social.dto.ts:87` |
| `slug` | `string` | Sí | — | — | Ruta pública del perfil. | `src/modules/community/dto/read-social.dto.ts:91` |
| `displayName` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/read-social.dto.ts:95` |
| `headline` | `string` | No | admite null | — | Titular o especialidad declarada. | `src/modules/community/dto/read-social.dto.ts:99` |
| `biography` | `string` | No | admite null | — | Descripción larga. | `src/modules/community/dto/read-social.dto.ts:103` |
| `avatarFileId` | `string` | No | formato uuid; admite null | — | Foto de perfil (`common.files`). | `src/modules/community/dto/read-social.dto.ts:107` |
| `coverFileId` | `string` | No | formato uuid; admite null | — | Imagen de portada (`common.files`). | `src/modules/community/dto/read-social.dto.ts:111` |
| `verificationStatusConceptId` | `string` | No | formato uuid; admite null | — | Concept id del estado de verificación. | `src/modules/community/dto/read-social.dto.ts:115` |
| `acceptsReviews` | `boolean` | No | admite null | — | Si acepta reseñas de servicio. | `src/modules/community/dto/read-social.dto.ts:119` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del perfil. | `src/modules/community/dto/read-social.dto.ts:123` |
| `badges` | `array<VerifiedBadgeDto>` | Sí | — | — | Sellos de verificación vigentes. | `src/modules/community/dto/read-social.dto.ts:127` |
| `badges[].id` | `string` | Sí | formato uuid | — | Identificador del sello. | `src/modules/community/dto/read-social.dto.ts:14` |
| `badges[].badgeTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sello. | `src/modules/community/dto/read-social.dto.ts:18` |
| `badges[].verificationMethodConceptId` | `string` | Sí | formato uuid | — | Concept id del método con que se verificó. | `src/modules/community/dto/read-social.dto.ts:22` |
| `badges[].validFrom` | `string` | No | formato date-time; admite null | — | Desde cuándo rige. | `src/modules/community/dto/read-social.dto.ts:26` |
| `badges[].validTo` | `string` | No | formato date-time; admite null | — | Hasta cuándo rige. | `src/modules/community/dto/read-social.dto.ts:30` |
| `prestige` | `PrestigeScoreDto` | No | — | — | Prestigio acumulado, si el perfil tiene saldo calculado. | `src/modules/community/dto/read-social.dto.ts:131` |
| `prestige.totalPoints` | `string` | No | — | — | Puntos acumulados (numeric, viaja como texto) | `src/modules/community/dto/read-social.dto.ts:37` |
| `prestige.levelConceptId` | `string` | No | formato uuid; admite null | — | Concept id del nivel alcanzado. | `src/modules/community/dto/read-social.dto.ts:41` |
| `prestige.rankPosition` | `number` | No | admite null | — | Posición en el ranking, si se calculó. | `src/modules/community/dto/read-social.dto.ts:45` |
| `prestige.calculatedAt` | `string` | No | formato date-time; admite null | — | Cuándo se recalculó por última vez. | `src/modules/community/dto/read-social.dto.ts:49` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil público no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:82` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. GET /community/profiles/{profileId}/auto-reply

- **Origen:** CONTRATO
- **Nombre:** Respuesta automática por inactividad del perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getAutoReply` — `src/modules/community/controllers/community-social.controller.ts:372`

### Qué es y para qué sirve (negocio)

Respuesta automática por inactividad del perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/{profileId}/auto-reply` la atiende `CommunitySocialController.getAutoReply` (src/modules/community/controllers/community-social.controller.ts:372). Exige sesión; el controlador no declara roles. Delega en `CommunityChatAutoReplyService.get`. Lee community.chat_auto_replies, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:372` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:372` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.chat_auto_replies` | LEE | LEE | DIRECTA | CommunitySocialController.getAutoReply → CommunityChatAutoReplyService.get | `src/modules/community/services/community-chat-auto-reply.service.ts:60` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getAutoReply → CommunityChatAutoReplyService.get → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.getAutoReply → CommunityChatAutoReplyService.get → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.getAutoReply → CommunityChatAutoReplyService.get → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ChatAutoReplyDto | null>` · DTO `ChatAutoReplyDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la configuración. | `src/modules/community/dto/chat-auto-reply.dto.ts:115` |
| `publicProfileId` | `string` | Sí | formato uuid | — | De quién es. | `src/modules/community/dto/chat-auto-reply.dto.ts:119` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:122` |
| `inactivityMinutes` | `number` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:125` |
| `bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:128` |
| `cooldownHours` | `number` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:131` |
| `onlyOutsideBusinessHours` | `boolean` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:134` |
| `businessHoursFrom` | `string` | No | admite null | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:137` |
| `businessHoursTo` | `string` | No | admite null | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:140` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:143` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. PUT /community/profiles/{profileId}/auto-reply

- **Origen:** CONTRATO
- **Nombre:** Configurar la respuesta automática del perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.upsertAutoReply` — `src/modules/community/controllers/community-social.controller.ts:388`

### Qué es y para qué sirve (negocio)

Configurar la respuesta automática del perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /community/profiles/{profileId}/auto-reply` la atiende `CommunitySocialController.upsertAutoReply` (src/modules/community/controllers/community-social.controller.ts:388). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpsertChatAutoReplyDto` (7 campos, 5 obligatorios). Delega en `CommunityChatAutoReplyService.upsert`. Lee community.chat_auto_replies, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:388` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:388` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.chat_auto_replies` | LEE | LEE | DIRECTA | CommunitySocialController.upsertAutoReply → CommunityChatAutoReplyService.upsert | `src/modules/community/services/community-chat-auto-reply.service.ts:84` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.upsertAutoReply → CommunityChatAutoReplyService.upsert → CommunityVisibilityService.assertActsAsMessagingProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.upsertAutoReply → CommunityChatAutoReplyService.upsert → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.canAttend → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.upsertAutoReply → CommunityChatAutoReplyService.upsert → CommunityVisibilityService.assertActsAsMessagingProfile → CommunityVisibilityService.messagingAccess → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpsertChatAutoReplyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `isActive` | `boolean` | Sí | — | `@IsBoolean()` | Si la respuesta automática está encendida | `src/modules/community/dto/chat-auto-reply.dto.ts:44` |
| `inactivityMinutes` | `number` | Sí | mínimo 1; máximo 1440 | `@IsInt()` `@Min(INACTIVITY_MINUTES_MIN)` `@Max(INACTIVITY_MINUTES_MAX)` | Minutos de inactividad antes de contestar solo | `src/modules/community/dto/chat-auto-reply.dto.ts:57` |
| `bodyText` | `string` | Sí | longitud mínima 1; longitud máxima 4000 | `@IsString()` `@MinLength(1)` `@MaxLength(AUTO_REPLY_MAX_LENGTH)` | Texto de la respuesta | `src/modules/community/dto/chat-auto-reply.dto.ts:67` |
| `cooldownHours` | `number` | Sí | mínimo 1; máximo 168 | `@IsInt()` `@Min(COOLDOWN_HOURS_MIN)` `@Max(COOLDOWN_HOURS_MAX)` | Horas de descanso antes de repetirle a la misma conversación | `src/modules/community/dto/chat-auto-reply.dto.ts:80` |
| `onlyOutsideBusinessHours` | `boolean` | Sí | — | `@IsBoolean()` | Contestar sólo fuera del horario de atención | `src/modules/community/dto/chat-auto-reply.dto.ts:85` |
| `businessHoursFrom` | `string` | No | patrón runtime HOUR | `@IsOptional()` `@Matches(HOUR, { message: 'businessHoursFrom debe tener formato HH:MM' })` | Inicio del horario de atención | `src/modules/community/dto/chat-auto-reply.dto.ts:94` |
| `businessHoursTo` | `string` | No | patrón runtime HOUR | `@IsOptional()` `@Matches(HOUR, { message: 'businessHoursTo debe tener formato HH:MM' })` | Fin del horario de atención | `src/modules/community/dto/chat-auto-reply.dto.ts:108` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "isActive": true,
  "inactivityMinutes": 1,
  "bodyText": "valor-ejemplo",
  "cooldownHours": 1,
  "onlyOutsideBusinessHours": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "isActive": true,
  "inactivityMinutes": 1,
  "bodyText": "valor-ejemplo",
  "cooldownHours": 1,
  "onlyOutsideBusinessHours": true,
  "businessHoursFrom": "08:00",
  "businessHoursTo": "18:00"
}
```

</details>

### Respuesta — `Promise<ChatAutoReplyDto>` · DTO `ChatAutoReplyDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la configuración. | `src/modules/community/dto/chat-auto-reply.dto.ts:115` |
| `publicProfileId` | `string` | Sí | formato uuid | — | De quién es. | `src/modules/community/dto/chat-auto-reply.dto.ts:119` |
| `isActive` | `boolean` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:122` |
| `inactivityMinutes` | `number` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:125` |
| `bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:128` |
| `cooldownHours` | `number` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:131` |
| `onlyOutsideBusinessHours` | `boolean` | Sí | — | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:134` |
| `businessHoursFrom` | `string` | No | admite null | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:137` |
| `businessHoursTo` | `string` | No | admite null | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:140` |
| `updatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/community/dto/chat-auto-reply.dto.ts:143` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 56. GET /community/profiles/{profileId}/posts

- **Origen:** CONTRATO
- **Nombre:** Publicaciones de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listProfilePosts` — `src/modules/community/controllers/community-social.controller.ts:415`

### Qué es y para qué sirve (negocio)

Publicaciones de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/{profileId}/posts` la atiende `CommunitySocialController.listProfilePosts` (src/modules/community/controllers/community-social.controller.ts:415). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listProfilePosts`. Lee community.comments, community.public_profiles, community.reactions, community.social_follows, community.social_posts, community.user_blocks, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:415` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | actorProfileId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:415` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityEngagementService.ofPosts → CommentsRepository.countByTargets | `src/modules/community/repositories/comments.repository.ts:176` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.resolveActorProfileId → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityEngagementService.ofPosts → ReactionsRepository.listByActorTargets | `src/modules/community/repositories/reactions.repository.ts:164` |
| `community.social_follows` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.filterVisiblePosts → FollowsRepository.listFollowedProfileIds | `src/modules/community/repositories/follows.repository.ts:82` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → PostsRepository.listByAuthorPage | `src/modules/community/repositories/posts.repository.ts:127` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.filterVisiblePosts → BlocksRepository.listBlockedPeers | `src/modules/community/repositories/blocks.repository.ts:87` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.listProfilePosts → CommunitySocialReadService.listProfilePosts → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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
| `items` | `array<PostListItemDto>` | Sí | — | — | Publicaciones de la página. | `src/modules/community/dto/read-social.dto.ts:343` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la publicación. | `src/modules/community/dto/read-social.dto.ts:270` |
| `items[].authorPublicProfileId` | `string` | Sí | formato uuid | — | Perfil autor. | `src/modules/community/dto/read-social.dto.ts:274` |
| `items[].postTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de publicación. | `src/modules/community/dto/read-social.dto.ts:278` |
| `items[].bodyText` | `string` | Sí | — | — | Cuerpo del texto. | `src/modules/community/dto/read-social.dto.ts:282` |
| `items[].visibilityConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la visibilidad declarada; nulo se lee como pública. | `src/modules/community/dto/read-social.dto.ts:286` |
| `items[].commentsEnabled` | `boolean` | No | admite null | — | Si admite comentarios. | `src/modules/community/dto/read-social.dto.ts:290` |
| `items[].publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-social.dto.ts:294` |
| `items[].editedAt` | `string` | No | formato date-time; admite null | — | Si fue editada, cuándo. | `src/modules/community/dto/read-social.dto.ts:298` |
| `items[].reactions` | `ReactionSummaryDto` | Sí | — | — | Reacciones de la publicación, con la del propio lector si tiene perfil. **Viaja con la fila y no en una lectura aparte** porque si no, la única forma de saber cuántas reacciones tiene cada publicación era pedir `GET /posts/{id}/reactions` una vez por tarjeta: cincuenta publicaciones, cincuenta peticiones. Sin esto, el conteo de la interfaz sólo podía ser el del gesto que el usuario acababa de hacer, y **al recargar volvía a cero** aunque la reacción estuviera guardada. | `src/modules/community/dto/read-social.dto.ts:311` |
| `items[].reactions.tallies` | `array<ReactionTallyDto>` | Sí | — | — | Recuento por tipo. | `src/modules/community/dto/read-social.dto.ts:239` |
| `items[].reactions.tallies[].reactionTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de reacción. | `src/modules/community/dto/read-social.dto.ts:214` |
| `items[].reactions.tallies[].reactionType` | `string` | No | admite null | — | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `src/modules/community/dto/read-social.dto.ts:228` |
| `items[].reactions.tallies[].count` | `number` | Sí | — | — | Cantidad de reacciones de ese tipo. | `src/modules/community/dto/read-social.dto.ts:232` |
| `items[].reactions.total` | `number` | Sí | — | — | Total de reacciones. | `src/modules/community/dto/read-social.dto.ts:243` |
| `items[].reactions.actorReactionTypeConceptId` | `string` | No | formato uuid; admite null | — | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `src/modules/community/dto/read-social.dto.ts:253` |
| `items[].reactions.actorReactionType` | `string` | No | admite null | — | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `src/modules/community/dto/read-social.dto.ts:263` |
| `items[].commentCount` | `number` | Sí | — | — | Comentarios vigentes del hilo completo, raíces y respuestas. Por la misma razón que el resumen de reacciones: el contador no existe como columna —y agregarla sería agregar esquema por comodidad de una lectura—, se calcula agrupado al leer la página. | `src/modules/community/dto/read-social.dto.ts:321` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-social.dto.ts:347` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-social.dto.ts:351` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null` si no hay más. | `src/modules/community/dto/read-social.dto.ts:355` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:104` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 57. POST /community/profiles/{profileId}/posts

- **Origen:** CONTRATO
- **Nombre:** Publicar un post con hashtags, media y menciones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.publishPost` — `src/modules/community/controllers/community-social.controller.ts:190`

### Qué es y para qué sirve (negocio)

Publicar un post con hashtags, media y menciones. Caso de uso UC-19-01: Publica post con hashtags, media y menciones. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:125`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/profiles/{profileId}/posts` la atiende `CommunitySocialController.publishPost` (src/modules/community/controllers/community-social.controller.ts:190). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePostDto` (14 campos, 1 obligatorio). Delega en `CommunitySocialService.publishPost`. Crea filas en community.content_hashtags, community.hashtags, community.mentions, community.post_media, community.social_posts. Actualiza community.hashtags. Lee common.file_versions, common.files, community.hashtags, community.public_profiles, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:190` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-social.controller.ts:190` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → CommunitySocialService.assertMediaFileUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → CommunitySocialService.assertMediaFileUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.content_hashtags` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.linkHashtag | `src/modules/community/repositories/posts.repository.ts:362` |
| `community.hashtags` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.upsertHashtag | `src/modules/community/repositories/posts.repository.ts:328` |
| `community.hashtags` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.upsertHashtag | `src/modules/community/repositories/posts.repository.ts:331` |
| `community.hashtags` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.upsertHashtag | `src/modules/community/repositories/posts.repository.ts:325` |
| `community.mentions` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.createMention | `src/modules/community/repositories/posts.repository.ts:410` |
| `community.post_media` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.createMedia | `src/modules/community/repositories/posts.repository.ts:303` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.social_posts` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → PostsRepository.create | `src/modules/community/repositories/posts.repository.ts:276` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.publishPost → CommunitySocialService.publishPost → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePostDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `bodyText` | `string` | Sí | longitud mínima 1; longitud máxima 20000 | `@IsString()` `@MinLength(1)` `@MaxLength(POST_BODY_MAX_LENGTH)` | Texto del post (sin PHI identificable) | `src/modules/community/dto/post.dto.ts:113` |
| `postType` | `string` | No | valores: TEXT, POLL | `@IsOptional()` `@IsIn(['TEXT', 'POLL'])` | Tipo de post | `src/modules/community/dto/post.dto.ts:121` |
| `visibility` | `string` | No | valores: PUBLIC, FOLLOWERS, PRIVATE | `@IsOptional()` `@IsIn(['PUBLIC', 'FOLLOWERS', 'PRIVATE'])` | Quién puede leer el post. Omitirlo equivale a PUBLIC, que es como se leen las publicaciones anteriores a este campo. | `src/modules/community/dto/post.dto.ts:137` |
| `commentsEnabled` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Comentarios habilitados | `src/modules/community/dto/post.dto.ts:145` |
| `media` | `array<PostMediaInputDto>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(20)` `@ValidateNested({ each: true })` `@Type(() => PostMediaInputDto)` | — | `src/modules/community/dto/post.dto.ts:156` |
| `media[].fileId` | `string` | No | formato uuid | `@IsUUID()` | Id del archivo (common.files) | `src/modules/community/dto/post.dto.ts:25` |
| `media[].mediaRole` | `string` | No | valores: IMAGE, VIDEO, DOCUMENT | `@IsOptional()` `@IsIn(['IMAGE', 'VIDEO', 'DOCUMENT'])` | Rol del medio | `src/modules/community/dto/post.dto.ts:40` |
| `media[].altText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/community/dto/post.dto.ts:49` |
| `media[].ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de despliegue | `src/modules/community/dto/post.dto.ts:58` |
| `hashtags` | `array<string>` | No | máximo 30 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(30)` `@IsString({ each: true })` | Hashtags (sin #) | `src/modules/community/dto/post.dto.ts:166` |
| `mentions` | `array<MentionInputDto>` | No | máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@ValidateNested({ each: true })` `@Type(() => MentionInputDto)` | — | `src/modules/community/dto/post.dto.ts:177` |
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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil autor no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:70` |
| INTEGRACION | `test/integration/hardening/mch-028.int-spec.ts:58` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:75` |

### Flujos

- Módulo Community (19) — etapa `UC-19-01`

---

## 58. GET /community/profiles/{profileId}/reviews

- **Origen:** CONTRATO
- **Nombre:** Reviews publicadas de un perfil
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityReviewsController.listProfileReviews` — `src/modules/community/controllers/community-reviews.controller.ts:73`

### Qué es y para qué sirve (negocio)

Reviews publicadas de un perfil. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/{profileId}/reviews` la atiende `CommunityReviewsController.listProfileReviews` (src/modules/community/controllers/community-reviews.controller.ts:73). Exige sesión; el controlador no declara roles. Delega en `CommunityReviewsReadService.listProfileReviews`. Lee community.public_profiles, community.review_dimension_scores, community.review_responses, community.service_reviews, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-reviews.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-reviews.controller.ts:73` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.review_dimension_scores` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → CommunityReviewsReadService.projectPage → ReviewsRepository.listDimensionScores | `src/modules/community/repositories/reviews.repository.ts:216` |
| `community.review_responses` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → CommunityReviewsReadService.projectPage → ReviewsRepository.listResponses | `src/modules/community/repositories/reviews.repository.ts:225` |
| `community.service_reviews` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → CommunityReviewsReadService.projectPage → ReviewsRepository.listByTargetPage | `src/modules/community/repositories/reviews.repository.ts:157` |
| `profiles.persons` | LEE | LEE | DIRECTA | CommunityReviewsController.listProfileReviews → CommunityReviewsReadService.listProfileReviews → CommunityReviewsReadService.projectPage → ReviewsRepository.displayNamesByPerson | `src/modules/community/repositories/reviews.repository.ts:198` |

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
| `items` | `array<ServiceReviewDto>` | Sí | — | — | Reviews de la página. | `src/modules/community/dto/read-reviews.dto.ts:107` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la review. | `src/modules/community/dto/read-reviews.dto.ts:48` |
| `items[].targetPublicProfileId` | `string` | Sí | formato uuid | — | Perfil calificado. | `src/modules/community/dto/read-reviews.dto.ts:52` |
| `items[].overallRating` | `number` | Sí | — | — | Puntuación general. | `src/modules/community/dto/read-reviews.dto.ts:56` |
| `items[].reviewText` | `string` | No | admite null | — | Texto de la reseña. | `src/modules/community/dto/read-reviews.dto.ts:60` |
| `items[].reviewerDisplayModeConceptId` | `string` | No | formato uuid; admite null | — | Concept id del modo de presentación del autor (con nombre, anónimo). | `src/modules/community/dto/read-reviews.dto.ts:64` |
| `items[].reviewerDisplayName` | `string` | No | admite null | — | Cómo firma quien escribió, o `null` si la publicó como anónima. Sale del modo que el propio autor eligió al publicarla (`reviewer_display_mode_concept_id`): con nombre real viaja su nombre, y con modo anónimo viaja `null` — nunca el nombre «por si acaso». Es el único dato del autor que sale de acá, y sale porque él decidió que saliera; `reviewer_patient_profile_id` sigue sin publicarse, así que una reseña anónima no se puede reconstruir desde esta respuesta. La pantalla que lo reciba en `null` dice «Paciente verificado», no el nombre vacío. | `src/modules/community/dto/read-reviews.dto.ts:80` |
| `items[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado de verificación de la reseña. | `src/modules/community/dto/read-reviews.dto.ts:84` |
| `items[].publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-reviews.dto.ts:88` |
| `items[].editedAt` | `string` | No | formato date-time; admite null | — | Si fue editada, cuándo. | `src/modules/community/dto/read-reviews.dto.ts:92` |
| `items[].dimensionScores` | `array<ReviewDimensionScoreDto>` | Sí | — | — | Puntuaciones por dimensión. | `src/modules/community/dto/read-reviews.dto.ts:96` |
| `items[].dimensionScores[].dimensionConceptId` | `string` | Sí | formato uuid | — | Concept id de la dimensión evaluada. | `src/modules/community/dto/read-reviews.dto.ts:7` |
| `items[].dimensionScores[].score` | `number` | Sí | — | — | Puntuación otorgada. | `src/modules/community/dto/read-reviews.dto.ts:11` |
| `items[].responses` | `array<ReviewResponseItemDto>` | Sí | — | — | Respuestas del calificado. | `src/modules/community/dto/read-reviews.dto.ts:100` |
| `items[].responses[].id` | `string` | Sí | formato uuid | — | Identificador de la respuesta. | `src/modules/community/dto/read-reviews.dto.ts:18` |
| `items[].responses[].responderPublicProfileId` | `string` | Sí | formato uuid | — | Perfil que respondió. | `src/modules/community/dto/read-reviews.dto.ts:22` |
| `items[].responses[].responseText` | `string` | Sí | — | — | Texto de la respuesta. | `src/modules/community/dto/read-reviews.dto.ts:26` |
| `items[].responses[].publishedAt` | `string` | No | formato date-time; admite null | — | Cuándo se publicó. | `src/modules/community/dto/read-reviews.dto.ts:30` |
| `count` | `number` | Sí | — | — | Cuántas trae esta página. | `src/modules/community/dto/read-reviews.dto.ts:111` |
| `limit` | `number` | Sí | — | — | Tope pedido. | `src/modules/community/dto/read-reviews.dto.ts:115` |
| `nextCursor` | `string` | No | admite null | — | Cursor de la página siguiente, o `null`. | `src/modules/community/dto/read-reviews.dto.ts:119` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil público no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:367` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityReviewsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 59. POST /community/profiles/{profileId}/reviews

- **Origen:** CONTRATO
- **Nombre:** Publicar una review verificada de servicio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityReviewsController.publishReview` — `src/modules/community/controllers/community-reviews.controller.ts:51`

### Qué es y para qué sirve (negocio)

Publicar una review verificada de servicio. Caso de uso UC-19-11: Publica review verificada de servicio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:135`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/profiles/{profileId}/reviews` la atiende `CommunityReviewsController.publishReview` (src/modules/community/controllers/community-reviews.controller.ts:51). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CommunityCreateReviewDto` (7 campos, 2 obligatorios). Delega en `CommunityReviewsService.publishReview`. Crea filas en community.review_dimension_scores, community.service_reviews. Lee clinical.encounter_participants, clinical.encounters, community.public_profiles, community.service_reviews.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-reviews.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/community/controllers/community-reviews.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → CommunityReviewsService.assertEligibleCare | `src/modules/community/services/community-reviews.service.ts:145` |
| `clinical.encounters` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → CommunityReviewsService.assertEligibleCare → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.review_dimension_scores` | ESCRIBE | CREA | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → ReviewsRepository.createDimensionScore | `src/modules/community/repositories/reviews.repository.ts:365` |
| `community.service_reviews` | ESCRIBE | CREA | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → ReviewsRepository.create | `src/modules/community/repositories/reviews.repository.ts:331` |
| `community.service_reviews` | LEE | LEE | DIRECTA | CommunityReviewsController.publishReview → CommunityReviewsService.publishReview → ReviewsRepository.findByReviewerEncounter | `src/modules/community/repositories/reviews.repository.ts:126` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo un paciente con atención registrada puede calificar |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil objetivo no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una review verificada para este encuentro |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El perfil no acepta reviews; PreconditionFailedException: La atención declarada no habilita una reseña; PreconditionFailedException: La atención todavía no terminó; PreconditionFailedException: La atención declarada no fue con este profesional |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:357` |
| CONTROLADOR | `src/modules/community/controllers/community-reviews.controller.spec.ts:24` |

### Flujos

- Módulo Community (19) — etapa `UC-19-11`

---

## 60. POST /community/profiles/{profileId}/reviews/{reviewId}/responses

- **Origen:** CONTRATO
- **Nombre:** Responder una reseña de la propia vitrina
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityReviewsController.respondToReview` — `src/modules/community/controllers/community-reviews.controller.ts:93`

### Qué es y para qué sirve (negocio)

Responder una reseña de la propia vitrina. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/profiles/{profileId}/reviews/{reviewId}/responses` la atiende `CommunityReviewsController.respondToReview` (src/modules/community/controllers/community-reviews.controller.ts:93). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CommunityCreateReviewResponseDto` (1 campo, 1 obligatorio). Delega en `CommunityReviewsService.respondToReview`. Crea filas en community.review_responses. Lee community.public_profiles, community.review_responses, community.service_reviews, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-reviews.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId, reviewId | `src/modules/community/controllers/community-reviews.controller.ts:93` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.review_responses` | ESCRIBE | CREA | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → ReviewsRepository.createResponse | `src/modules/community/repositories/reviews.repository.ts:105` |
| `community.review_responses` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → ReviewsRepository.findResponseByResponder | `src/modules/community/repositories/reviews.repository.ts:80` |
| `community.service_reviews` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → ReviewsRepository.findById | `src/modules/community/repositories/reviews.repository.ts:71` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunityReviewsController.respondToReview → CommunityReviewsService.respondToReview → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil objetivo no encontrado; ResourceNotFoundException: Reseña no encontrada |
| 409 | `CONFLICT` | ConflictException: Ya respondiste esta reseña |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-reviews.controller.spec.ts:35` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityReviewsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 61. GET /community/profiles/by-slug/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha de un perfil público por su slug
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getProfileBySlug` — `src/modules/community/controllers/community-social.controller.ts:354`

### Qué es y para qué sirve (negocio)

Ficha de un perfil público por su slug. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/by-slug/{slug}` la atiende `CommunitySocialController.getProfileBySlug` (src/modules/community/controllers/community-social.controller.ts:354). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.getProfileBySlug`. Lee community.prestige_scores, community.public_profiles, community.user_blocks, community.verified_badges, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:354` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.prestige_scores` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → CommunityPrestigeRepository.findScoreByProfile | `src/modules/community/repositories/community-prestige.repository.ts:44` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → PublicProfilesRepository.findBySlug | `src/modules/community/repositories/public-profiles.repository.ts:365` |
| `community.user_blocks` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → CommunityVisibilityService.isBlockedBetween → BlocksRepository.existsBetween | `src/modules/community/repositories/blocks.repository.ts:58` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → PublicProfilesRepository.listBadgesBySubject | `src/modules/community/repositories/public-profiles.repository.ts:281` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.getProfileBySlug → CommunitySocialReadService.getProfileBySlug → CommunitySocialReadService.getProfile → CommunityVisibilityService.resolveActorProfileId → CommunityVisibilityService.assertOwnProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicProfileDetailDto>` · DTO `PublicProfileDetailDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador del perfil. | `src/modules/community/dto/read-social.dto.ts:56` |
| `tenantId` | `string` | Sí | formato uuid | — | Organización a la que pertenece. | `src/modules/community/dto/read-social.dto.ts:60` |
| `targetTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sujeto (usuario, profesional, organización). | `src/modules/community/dto/read-social.dto.ts:64` |
| `kind` | `object` | No | valores: PRACTITIONER, ORGANIZATION, PHARMACY, DIAGNOSTIC_UNIT, INSURER | — | La vertical en claro, o `null` si este perfil no tiene ficha pública. `targetTypeConceptId` es un uuid de terminología y el cliente **no tiene su tabla**: sin esto tendría que adivinar a qué URL pública lleva un perfil —`/p`, `/o`, `/f`, `/l`, `/s`— o no ofrecer el enlace nunca. Es el mismo valor que publica el buscador anónimo, del mismo mapa. `null` en el perfil de un paciente: no se publica, y decirlo es parte de la respuesta. | `src/modules/community/dto/read-social.dto.ts:87` |
| `slug` | `string` | Sí | — | — | Ruta pública del perfil. | `src/modules/community/dto/read-social.dto.ts:91` |
| `displayName` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/read-social.dto.ts:95` |
| `headline` | `string` | No | admite null | — | Titular o especialidad declarada. | `src/modules/community/dto/read-social.dto.ts:99` |
| `biography` | `string` | No | admite null | — | Descripción larga. | `src/modules/community/dto/read-social.dto.ts:103` |
| `avatarFileId` | `string` | No | formato uuid; admite null | — | Foto de perfil (`common.files`). | `src/modules/community/dto/read-social.dto.ts:107` |
| `coverFileId` | `string` | No | formato uuid; admite null | — | Imagen de portada (`common.files`). | `src/modules/community/dto/read-social.dto.ts:111` |
| `verificationStatusConceptId` | `string` | No | formato uuid; admite null | — | Concept id del estado de verificación. | `src/modules/community/dto/read-social.dto.ts:115` |
| `acceptsReviews` | `boolean` | No | admite null | — | Si acepta reseñas de servicio. | `src/modules/community/dto/read-social.dto.ts:119` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado del perfil. | `src/modules/community/dto/read-social.dto.ts:123` |
| `badges` | `array<VerifiedBadgeDto>` | Sí | — | — | Sellos de verificación vigentes. | `src/modules/community/dto/read-social.dto.ts:127` |
| `badges[].id` | `string` | Sí | formato uuid | — | Identificador del sello. | `src/modules/community/dto/read-social.dto.ts:14` |
| `badges[].badgeTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sello. | `src/modules/community/dto/read-social.dto.ts:18` |
| `badges[].verificationMethodConceptId` | `string` | Sí | formato uuid | — | Concept id del método con que se verificó. | `src/modules/community/dto/read-social.dto.ts:22` |
| `badges[].validFrom` | `string` | No | formato date-time; admite null | — | Desde cuándo rige. | `src/modules/community/dto/read-social.dto.ts:26` |
| `badges[].validTo` | `string` | No | formato date-time; admite null | — | Hasta cuándo rige. | `src/modules/community/dto/read-social.dto.ts:30` |
| `prestige` | `PrestigeScoreDto` | No | — | — | Prestigio acumulado, si el perfil tiene saldo calculado. | `src/modules/community/dto/read-social.dto.ts:131` |
| `prestige.totalPoints` | `string` | No | — | — | Puntos acumulados (numeric, viaja como texto) | `src/modules/community/dto/read-social.dto.ts:37` |
| `prestige.levelConceptId` | `string` | No | formato uuid; admite null | — | Concept id del nivel alcanzado. | `src/modules/community/dto/read-social.dto.ts:41` |
| `prestige.rankPosition` | `number` | No | admite null | — | Posición en el ranking, si se calculó. | `src/modules/community/dto/read-social.dto.ts:45` |
| `prestige.calculatedAt` | `string` | No | formato date-time; admite null | — | Cuándo se recalculó por última vez. | `src/modules/community/dto/read-social.dto.ts:49` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil puede leer su contenido privado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil no encontrado; ResourceNotFoundException: Perfil público no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 62. GET /community/profiles/me

- **Origen:** CONTRATO
- **Nombre:** Consultar la vitrina pública propia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.getOwnProfile` — `src/modules/community/controllers/community-social.controller.ts:115`

### Qué es y para qué sirve (negocio)

Consultar la vitrina pública propia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/me` la atiende `CommunitySocialController.getOwnProfile` (src/modules/community/controllers/community-social.controller.ts:115). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.getOwnProfile`. Lee community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:115` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.getOwnProfile → CommunitySocialService.getOwnProfile → CommunitySocialService.showcaseOf → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 63. PUT /community/profiles/me

- **Origen:** CONTRATO
- **Nombre:** Crear o actualizar la vitrina pública propia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.upsertOwnProfile` — `src/modules/community/controllers/community-social.controller.ts:127`

### Qué es y para qué sirve (negocio)

Crear o actualizar la vitrina pública propia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /community/profiles/me` la atiende `CommunitySocialController.upsertOwnProfile` (src/modules/community/controllers/community-social.controller.ts:127). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpsertOwnPublicProfileDto` (9 campos, 3 obligatorios). Delega en `CommunitySocialService.upsertOwnProfile`. Crea filas en community.public_profiles. Lee common.file_versions, common.files, community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:392` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.upsertOwnProfile → CommunitySocialService.upsertOwnProfile → PublicProfilesRepository.findBySlug | `src/modules/community/repositories/public-profiles.repository.ts:365` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {labels.notFound} |
| 409 | `CONFLICT` | ConflictException: Ese enlace ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: No se pudo recuperar el perfil público recién guardado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-pharmacy-inbox.int-spec.ts:117` |
| INTEGRACION | `test/integration/community-realtime-chat.int-spec.ts:111` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 64. GET /community/profiles/me/stats

- **Origen:** CONTRATO
- **Nombre:** Estadísticas de la vitrina pública propia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.ownProfileStats` — `src/modules/community/controllers/community-social.controller.ts:153`

### Qué es y para qué sirve (negocio)

Estadísticas de la vitrina pública propia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/me/stats` la atiende `CommunitySocialController.ownProfileStats` (src/modules/community/controllers/community-social.controller.ts:153). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialService.getOwnProfileStats`. Lee community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:153` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.ownProfileStats → CommunitySocialService.getOwnProfileStats → CommunitySocialService.showcaseOf → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Operación de runtime sin tenant en contexto; PreconditionFailedException: Clave de runtime vacía |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 65. GET /community/profiles/organization-showcases/me

- **Origen:** CONTRATO
- **Nombre:** Vitrinas de organización que la sesión puede atender en el chat
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.listOwnOrganizationShowcases` — `src/modules/community/controllers/community-social.controller.ts:179`

### Qué es y para qué sirve (negocio)

Vitrinas de organización que la sesión puede atender en el chat. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/profiles/organization-showcases/me` la atiende `CommunitySocialController.listOwnOrganizationShowcases` (src/modules/community/controllers/community-social.controller.ts:179). Exige sesión; el controlador no declara roles. Delega en `CommunitySocialReadService.listAttendableOrganizationShowcases`. Lee community.public_profiles, directory.tenant_memberships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:179` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.listOwnOrganizationShowcases → CommunitySocialReadService.listAttendableOrganizationShowcases → PublicProfilesRepository.listByTargetsTypesAndStatus | `src/modules/community/repositories/public-profiles.repository.ts:175` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.listOwnOrganizationShowcases → CommunitySocialReadService.listAttendableOrganizationShowcases → CommunityOrganizationStaffService.attendableTenantIds → TenantMembershipsRepository.findActiveByUser | `src/modules/directory/repositories/tenant-memberships.repository.ts:99` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OrganizationShowcasesDto>` · DTO `OrganizationShowcasesDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<OrganizationShowcaseDto>` | Sí | — | — | — | `src/modules/community/dto/read-social.dto.ts:579` |
| `items[].profileId` | `string` | Sí | formato uuid | — | Identificador de la vitrina: el `profileId` con el que se actúa. | `src/modules/community/dto/read-social.dto.ts:553` |
| `items[].slug` | `string` | Sí | — | — | Ruta pública de la vitrina. | `src/modules/community/dto/read-social.dto.ts:557` |
| `items[].displayName` | `string` | Sí | — | — | Nombre visible. | `src/modules/community/dto/read-social.dto.ts:561` |
| `items[].avatarFileId` | `string` | Sí | formato uuid; admite null | — | Archivo del avatar, si tiene. | `src/modules/community/dto/read-social.dto.ts:565` |
| `items[].targetTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de sujeto (organización o farmacia). | `src/modules/community/dto/read-social.dto.ts:569` |
| `items[].kind` | `object` | Sí | valores: ORGANIZATION, PHARMACY | — | La vertical en claro (`PHARMACY`, `ORGANIZATION`). | `src/modules/community/dto/read-social.dto.ts:573` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:167` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 66. POST /community/public-profiles

- **Origen:** CONTRATO
- **Nombre:** Crear un perfil público (bootstrap del grafo social)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.createProfile` — `src/modules/community/controllers/community-social.controller.ts:88`

### Qué es y para qué sirve (negocio)

Crear un perfil público (bootstrap del grafo social). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/public-profiles` la atiende `CommunitySocialController.createProfile` (src/modules/community/controllers/community-social.controller.ts:88). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePublicProfileDto` (9 campos, 4 obligatorios). Delega en `CommunitySocialService.createProfile`. Crea filas en community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-social.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.createProfile → CommunitySocialService.createProfile → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:392` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:51` |
| INTEGRACION | `test/integration/hardening/mch-028.int-spec.ts:42` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:68` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySocialController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 67. GET /community/ratings

- **Origen:** CONTRATO
- **Nombre:** Calificaciones de un médico, paciente u organización
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PartyRatingsController.list` — `src/modules/community/controllers/party-ratings.controller.ts:92`

### Qué es y para qué sirve (negocio)

Calificaciones de un médico, paciente u organización. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/ratings` la atiende `PartyRatingsController.list` (src/modules/community/controllers/party-ratings.controller.ts:92). Exige sesión; el controlador no declara roles. Delega en `PartyRatingsReadService.list`. Lee community.party_ratings, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/party-ratings.controller.ts:92` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | targetType (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | targetId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.party_ratings` | LEE | LEE | DIRECTA | PartyRatingsController.list → PartyRatingsReadService.list → PartyRatingsRepository.aggregate | `src/modules/community/repositories/party-ratings.repository.ts:167` |
| `practice.practices` | LEE | LEE | DIRECTA | PartyRatingsController.list → PartyRatingsReadService.list → PartyRatingsReadService.assertCanRead → RatingPartiesService.assertCanReadPatientRatings | `src/modules/community/services/rating-parties.service.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `targetType` | query | Sí | `string` | — |
| `targetId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RatingListDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La calificación de un paciente sólo la ven los profesionales que lo atienden |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:PartyRatingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 68. PUT /community/ratings

- **Origen:** CONTRATO
- **Nombre:** Calificar con estrellas a un médico, paciente u organización
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PartyRatingsController.rate` — `src/modules/community/controllers/party-ratings.controller.ts:45`

### Qué es y para qué sirve (negocio)

Calificar con estrellas a un médico, paciente u organización. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /community/ratings` la atiende `PartyRatingsController.rate` (src/modules/community/controllers/party-ratings.controller.ts:45). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CommunityRatePartyDto` (8 campos, 4 obligatorios). Delega en `PartyRatingsService.rate`. Crea filas en community.party_ratings. Actualiza community.party_ratings. Lee clinical.encounter_participants, clinical.encounters, community.party_ratings, practice.practices, practice.practitioner_role_assignments, scheduling.appointment_bookings, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/party-ratings.controller.ts:45` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsService.assertBasis → PartyRatingsService.assertEncounterJoins → PartyRatingsService.wasInEncounter | `src/modules/community/services/party-ratings.service.ts:293` |
| `clinical.encounters` | LEE | LEE | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsService.assertBasis → PartyRatingsService.assertEncounterJoins → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `community.party_ratings` | ESCRIBE | ACTUALIZA | POR_TIPO | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsRepository.update | `src/modules/community/repositories/party-ratings.repository.ts:122` |
| `community.party_ratings` | ESCRIBE | CREA | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsRepository.create | `src/modules/community/repositories/party-ratings.repository.ts:91` |
| `community.party_ratings` | LEE | LEE | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsRepository.findExisting | `src/modules/community/repositories/party-ratings.repository.ts:75` |
| `practice.practices` | LEE | LEE | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → RatingPartiesService.resolveReviewer → RatingPartiesService.assertAdministers → RatingPartiesService.administers | `src/modules/community/services/rating-parties.service.ts:102` |
| `practice.practitioner_role_assignments` | LEE | LEE | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsService.assertBasis → PartyRatingsService.assertRoleAssignment | `src/modules/community/services/party-ratings.service.ts:371` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsService.assertBasis → PartyRatingsService.assertEncounterJoins → PartyRatingsService.wasInEncounter → PartyRatingsService.practiceOfEncounter | `src/modules/community/services/party-ratings.service.ts:316` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | PartyRatingsController.rate → PartyRatingsService.rate → PartyRatingsService.assertBasis → PartyRatingsService.assertEncounterJoins → PartyRatingsService.wasInEncounter → PartyRatingsService.practiceOfEncounter | `src/modules/community/services/party-ratings.service.ts:322` |

### Cuerpo — DTO `CommunityRatePartyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reviewerType` | `string` | Sí | valores: PATIENT, PRACTITIONER, ORGANIZATION | `@IsIn(RATING_PARTY_TYPES)` | — | `src/modules/community/dto/party-rating.dto.ts:41` |
| `reviewerOrganizationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/community/dto/party-rating.dto.ts:50` |
| `targetType` | `string` | Sí | valores: PATIENT, PRACTITIONER, ORGANIZATION | `@IsIn(RATING_PARTY_TYPES)` | — | `src/modules/community/dto/party-rating.dto.ts:55` |
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/community/dto/party-rating.dto.ts:60` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/community/dto/party-rating.dto.ts:69` |
| `roleAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/community/dto/party-rating.dto.ts:78` |
| `overallRating` | `number` | Sí | mínimo 1; máximo 5 | `@IsInt()` `@Min(1)` `@Max(5)` | — | `src/modules/community/dto/party-rating.dto.ts:85` |
| `commentText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/community/dto/party-rating.dto.ts:92` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reviewerType": "PATIENT",
  "targetType": "PATIENT",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "overallRating": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reviewerType": "PATIENT",
  "reviewerOrganizationId": "00000000-0000-4000-8000-000000000001",
  "targetType": "PATIENT",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "roleAssignmentId": "00000000-0000-4000-8000-000000000001",
  "overallRating": 1,
  "commentText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PartyRatingResultDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra); BadRequestException: Indique en nombre de qué organización califica; BadRequestException: Indique la atención terminada que respalda la calificación; BadRequestException: Indique el vínculo de trabajo que respalda la calificación |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Su cuenta no tiene un perfil de paciente con el cual calificar; ForbiddenException: Su cuenta no tiene un perfil profesional con el cual calificar; ForbiddenException: Sólo quien administra la organización puede calificar en su nombre; ForbiddenException: No puede calificar a una organización que usted administra |
| 409 | `CONFLICT` | ConflictException: Esta calificación se está guardando en otro pedido; vuelva a intentarlo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {BASIS_REJECTED}; PreconditionFailedException: La atención todavía no terminó |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:PartyRatingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 69. GET /community/ratings/mine

- **Origen:** CONTRATO
- **Nombre:** Mis calificaciones
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PartyRatingsController.mine` — `src/modules/community/controllers/party-ratings.controller.ts:77`

### Qué es y para qué sirve (negocio)

Mis calificaciones. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/ratings/mine` la atiende `PartyRatingsController.mine` (src/modules/community/controllers/party-ratings.controller.ts:77). Exige sesión; el controlador no declara roles. Delega en `PartyRatingsReadService.mine`. Lee community.party_ratings, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/party-ratings.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | reviewerType (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.party_ratings` | LEE | LEE | DIRECTA | PartyRatingsController.mine → PartyRatingsReadService.mine → PartyRatingsRepository.findByReviewer | `src/modules/community/repositories/party-ratings.repository.ts:196` |
| `practice.practices` | LEE | LEE | DIRECTA | PartyRatingsController.mine → PartyRatingsReadService.mine → RatingPartiesService.resolveReviewer → RatingPartiesService.assertAdministers → RatingPartiesService.administers | `src/modules/community/services/rating-parties.service.ts:102` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `reviewerType` | query | Sí | `string` | — |
| `reviewerOrganizationId` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyRatingDto[]>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: Indique en nombre de qué organización califica |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Su cuenta no tiene un perfil de paciente con el cual calificar; ForbiddenException: Su cuenta no tiene un perfil profesional con el cual calificar; ForbiddenException: Sólo quien administra la organización puede calificar en su nombre |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:PartyRatingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 70. GET /community/ratings/summary

- **Origen:** CONTRATO
- **Nombre:** Nota media de un médico, paciente u organización
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PartyRatingsController.summary` — `src/modules/community/controllers/party-ratings.controller.ts:64`

### Qué es y para qué sirve (negocio)

Nota media de un médico, paciente u organización. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/ratings/summary` la atiende `PartyRatingsController.summary` (src/modules/community/controllers/party-ratings.controller.ts:64). Exige sesión; el controlador no declara roles. Delega en `PartyRatingsReadService.summary`. Lee community.party_ratings, practice.practices.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/party-ratings.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | targetType (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | targetId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.party_ratings` | LEE | LEE | DIRECTA | PartyRatingsController.summary → PartyRatingsReadService.summary → PartyRatingsRepository.aggregate | `src/modules/community/repositories/party-ratings.repository.ts:167` |
| `practice.practices` | LEE | LEE | DIRECTA | PartyRatingsController.summary → PartyRatingsReadService.summary → PartyRatingsReadService.assertCanRead → RatingPartiesService.assertCanReadPatientRatings | `src/modules/community/services/rating-parties.service.ts:127` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `targetType` | query | Sí | `string` | — |
| `targetId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RatingSummaryDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: La calificación de un paciente sólo la ven los profesionales que lo atienden |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:PartyRatingsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 71. PUT /community/reactions

- **Origen:** CONTRATO
- **Nombre:** Reaccionar a contenido (upsert una reacción por actor/objeto)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySocialController.react` — `src/modules/community/controllers/community-social.controller.ts:223`

### Qué es y para qué sirve (negocio)

Reaccionar a contenido (upsert una reacción por actor/objeto). Caso de uso UC-19-03: Reacciona (upsert una reacción por actor/objeto). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:127`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PUT /community/reactions` la atiende `CommunitySocialController.react` (src/modules/community/controllers/community-social.controller.ts:223). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ReactionDto` (4 campos, 4 obligatorios). Delega en `CommunitySocialService.react`. Crea filas en community.reactions. Actualiza community.reactions. Lee community.public_profiles, community.reactions, directory.tenant_memberships, directory.tenants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-social.controller.ts:223` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → CommunityVisibilityService.assertActsAsProfile → PublicProfilesRepository.findById | `src/modules/community/repositories/public-profiles.repository.ts:123` |
| `community.reactions` | ESCRIBE | ACTUALIZA | POR_TIPO | CommunitySocialController.react → CommunitySocialService.react | `src/modules/community/services/community-social.service.ts:703` |
| `community.reactions` | ESCRIBE | CREA | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → ReactionsRepository.create | `src/modules/community/repositories/reactions.repository.ts:179` |
| `community.reactions` | LEE | LEE | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → ReactionsRepository.findByActorTarget | `src/modules/community/repositories/reactions.repository.ts:54` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.canAdminister → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `directory.tenants` | LEE | LEE | DIRECTA | CommunitySocialController.react → CommunitySocialService.react → CommunityVisibilityService.assertActsAsProfile → CommunityVisibilityService.isHolder → CommunityOrganizationStaffService.isTenantBacked | `src/modules/community/services/community-organization-staff.service.ts:111` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: No se puede escribir en el grafo social con un perfil ajeno |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:294` |
| CONTROLADOR | `src/modules/community/controllers/community-social.controller.spec.ts:99` |

### Flujos

- Módulo Community (19) — etapa `UC-19-03`

---

## 72. POST /community/reports

- **Origen:** CONTRATO
- **Nombre:** Reportar contenido y encolar moderación
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityModerationController.report` — `src/modules/community/controllers/community-moderation.controller.ts:61`

### Qué es y para qué sirve (negocio)

Reportar contenido y encolar moderación. Caso de uso UC-19-08: Reporta contenido y encola moderación. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:132`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /community/reports` la atiende `CommunityModerationController.report` (src/modules/community/controllers/community-moderation.controller.ts:61). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateReportDto` (4 campos, 3 obligatorios). Delega en `CommunityModerationService.report`. Crea filas en community.content_reports, community.moderation_queue. Lee community.moderation_queue.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-moderation.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-moderation.controller.spec.ts:45` |

### Flujos

- Módulo Community (19) — etapa `UC-19-08`

---

## 73. GET /community/topics

- **Origen:** CONTRATO
- **Nombre:** Temas de la comunidad
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityTopicsController.listTopics` — `src/modules/community/controllers/community-topics.controller.ts:27`

### Qué es y para qué sirve (negocio)

Temas de la comunidad. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /community/topics` la atiende `CommunityTopicsController.listTopics` (src/modules/community/controllers/community-topics.controller.ts:27). Exige sesión; el controlador no declara roles. Delega en `CommunityGroupsReadService.listTopics`. Lee community.topics.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/community/controllers/community-topics.controller.ts:27` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.topics` | LEE | LEE | DIRECTA | CommunityTopicsController.listTopics → CommunityGroupsReadService.listTopics → GroupsRepository.listTopics | `src/modules/community/repositories/groups.repository.ts:491` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityTopicsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 74. GET /f/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de una farmacia
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getPharmacy` — `src/modules/community/controllers/community-public.controller.ts:550`

### Qué es y para qué sirve (negocio)

Ficha pública de una farmacia. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /f/{slug}` la atiende `CommunityPublicController.getPharmacy` (src/modules/community/controllers/community-public.controller.ts:550). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:550` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:550` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1347` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1319` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:1112` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1332` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:1173` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practices` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:913` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getPharmacy → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:398` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:401` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:413` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:416` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:419` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:422` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:425` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:428` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:431` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:438` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `practiceSites` | `array<PublicPracticeSiteDto>` | Sí | — | — | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:445` |
| `practiceSites[].id` | `string` | Sí | formato uuid | — | Identificador de la sede | `src/modules/community/dto/public-search.dto.ts:371` |
| `practiceSites[].name` | `string` | Sí | — | — | Nombre de la sede | `src/modules/community/dto/public-search.dto.ts:374` |
| `practiceSites[].addressText` | `string` | Sí | admite null | — | Dirección en una línea, o null si la sede no cargó ninguna | `src/modules/community/dto/public-search.dto.ts:380` |
| `practiceSites[].location` | `PublicLocationDto` | Sí | — | — | Punto de la sede; null si su dirección no tiene coordenadas | `src/modules/community/dto/public-search.dto.ts:387` |
| `practiceSites[].location.lat` | `number` | Sí | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `practiceSites[].location.lng` | `number` | Sí | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `practiceSites[].isOwn` | `boolean` | Sí | — | — | Si es un consultorio propio del profesional y no la sede de una organización | `src/modules/community/dto/public-search.dto.ts:393` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:448` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:451` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:454` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:460` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:463` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:469` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:472` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:475` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 75. GET /internal/community/feed/pending

- **Origen:** CONTRATO
- **Nombre:** Publicaciones publicadas sin fan-out
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityFeedController.pending` — `src/modules/community/controllers/community-feed.controller.ts:79`

### Qué es y para qué sirve (negocio)

Publicaciones publicadas sin fan-out. Caso de uso UC-19-15: Lote de posts publicados sin repartir, con sus seguidores. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:140`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /internal/community/feed/pending` la atiende `CommunityFeedController.pending` (src/modules/community/controllers/community-feed.controller.ts:79). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `CommunityFeedService.pendingFanout`. Lee community.feed_items, community.social_follows, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-feed.controller.ts:79` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.feed_items` | LEE | LEE | DIRECTA | CommunityFeedController.pending → CommunityFeedService.pendingFanout → FeedRepository.listFannedOutSourceRefs | `src/modules/community/repositories/feed.repository.ts:186` |
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
| `items` | `array<FeedPendingItemDto>` | Sí | — | — | Publicaciones pendientes del lote. | `src/modules/community/dto/feed.dto.ts:77` |
| `items[].postId` | `string` | Sí | formato uuid | — | Post publicado sin fan-out | `src/modules/community/dto/feed.dto.ts:52` |
| `items[].authorProfileId` | `string` | Sí | formato uuid | — | Perfil autor | `src/modules/community/dto/feed.dto.ts:56` |
| `items[].followerProfileIds` | `array<string>` | Sí | — | — | Perfiles destinatarios | `src/modules/community/dto/feed.dto.ts:65` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:397` |

### Flujos

- Módulo Community (19) — etapa `UC-19-15`

---

## 76. POST /internal/community/feed/ranking/apply

- **Origen:** CONTRATO
- **Nombre:** Aplicar rank_score recalculado
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityFeedController.rankingApply` — `src/modules/community/controllers/community-feed.controller.ts:111`

### Qué es y para qué sirve (negocio)

Aplicar rank_score recalculado. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/feed/ranking/apply` la atiende `CommunityFeedController.rankingApply` (src/modules/community/controllers/community-feed.controller.ts:111). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `ApplyFeedRankingDto` (3 campos, 3 obligatorios). Delega en `CommunityFeedService.applyRanking`. Actualiza community.feed_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-feed.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.feed_items` | ESCRIBE | ACTUALIZA | DIRECTA | CommunityFeedController.rankingApply → CommunityFeedService.applyRanking → FeedRepository.applyRankScores | `src/modules/community/repositories/feed.repository.ts:162` |

### Cuerpo — DTO `ApplyFeedRankingDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `updates` | `array<FeedRankingUpdateDto>` | Sí | máximo 500 elemento(s) | `@IsArray()` `@ArrayMaxSize(FEED_RANKING_MAX_BATCH)` `@ValidateNested({ each: true })` `@Type(() => FeedRankingUpdateDto)` | — | `src/modules/community/dto/feed.dto.ts:159` |
| `updates[].feedItemId` | `string` | Sí | formato uuid | `@IsUUID()` | Ítem de feed | `src/modules/community/dto/feed.dto.ts:133` |
| `updates[].rankScore` | `string` | Sí | — | `@IsNumberString()` | Nuevo rank_score, como texto decimal | `src/modules/community/dto/feed.dto.ts:142` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "updates": [
    {
      "feedItemId": "00000000-0000-4000-8000-000000000001",
      "rankScore": "valor-ejemplo"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "updates": [
    {
      "feedItemId": "00000000-0000-4000-8000-000000000001",
      "rankScore": "valor-ejemplo"
    }
  ]
}
```

</details>

### Respuesta — `Promise<FeedRankingApplyResponseDto>` · DTO `FeedRankingApplyResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `updated` | `number` | Sí | — | — | Ítems actualizados | `src/modules/community/dto/feed.dto.ts:166` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityFeedController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 77. GET /internal/community/feed/ranking/pending

- **Origen:** CONTRATO
- **Nombre:** Items de feed pendientes de puntuar
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityFeedController.rankingPending` — `src/modules/community/controllers/community-feed.controller.ts:99`

### Qué es y para qué sirve (negocio)

Items de feed pendientes de puntuar. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /internal/community/feed/ranking/pending` la atiende `CommunityFeedController.rankingPending` (src/modules/community/controllers/community-feed.controller.ts:99). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `CommunityFeedService.pendingRanking`. Lee community.comments, community.feed_items, community.reactions, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-feed.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunityFeedController.rankingPending → CommunityFeedService.pendingRanking → CommentsRepository.countByTargets | `src/modules/community/repositories/comments.repository.ts:176` |
| `community.feed_items` | LEE | LEE | DIRECTA | CommunityFeedController.rankingPending → CommunityFeedService.pendingRanking → FeedRepository.listPageForRanking | `src/modules/community/repositories/feed.repository.ts:142` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityFeedController.rankingPending → CommunityFeedService.pendingRanking → ReactionsRepository.summarizeByTargets | `src/modules/community/repositories/reactions.repository.ts:129` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityFeedController.rankingPending → CommunityFeedService.pendingRanking → PostsRepository.listByIds | `src/modules/community/repositories/posts.repository.ts:157` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<FeedRankingPendingResponseDto>` · DTO `FeedRankingPendingResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<FeedRankingPendingItemDto>` | Sí | — | — | Lote de ítems a puntuar. | `src/modules/community/dto/feed.dto.ts:125` |
| `items[].feedItemId` | `string` | Sí | formato uuid | — | Ítem de feed | `src/modules/community/dto/feed.dto.ts:87` |
| `items[].postId` | `string` | Sí | formato uuid | — | Post fuente | `src/modules/community/dto/feed.dto.ts:91` |
| `items[].ownerProfileId` | `string` | Sí | formato uuid | — | Perfil dueño del feed | `src/modules/community/dto/feed.dto.ts:95` |
| `items[].authorProfileId` | `string` | Sí | formato uuid | — | Perfil autor | `src/modules/community/dto/feed.dto.ts:99` |
| `items[].itemCreatedAt` | `string` | Sí | — | — | Alta del ítem | `src/modules/community/dto/feed.dto.ts:103` |
| `items[].postPublishedAt` | `string` | Sí | admite null | — | Publicación del post fuente | `src/modules/community/dto/feed.dto.ts:110` |
| `items[].reactionCount` | `number` | Sí | — | — | Reacciones del post | `src/modules/community/dto/feed.dto.ts:114` |
| `items[].commentCount` | `number` | Sí | — | — | Comentarios del post | `src/modules/community/dto/feed.dto.ts:118` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityFeedController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 78. POST /internal/community/feed/rebuild

- **Origen:** CONTRATO
- **Nombre:** Generar feed (fan-out y ranking)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityFeedController.rebuild` — `src/modules/community/controllers/community-feed.controller.ts:58`

### Qué es y para qué sirve (negocio)

Generar feed (fan-out y ranking). Caso de uso UC-19-15: Fan-out del feed (lo dispara worker-community). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/community/README.md:139`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/feed/rebuild` la atiende `CommunityFeedController.rebuild` (src/modules/community/controllers/community-feed.controller.ts:58). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Valida el cuerpo como `RebuildFeedDto` (3 campos, 2 obligatorios). Delega en `CommunityFeedService.rebuild`. Crea filas en community.feed_items. Lee community.feed_items.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-feed.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.feed_items` | ESCRIBE | CREA | DIRECTA | CommunityFeedController.rebuild → CommunityFeedService.rebuild → FeedRepository.create | `src/modules/community/repositories/feed.repository.ts:51` |
| `community.feed_items` | LEE | LEE | DIRECTA | CommunityFeedController.rebuild → CommunityFeedService.rebuild → FeedRepository.findByOwnerSource | `src/modules/community/repositories/feed.repository.ts:75` |

### Cuerpo — DTO `RebuildFeedDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Post fuente publicado | `src/modules/community/dto/feed.dto.ts:23` |
| `followerProfileIds` | `array<string>` | Sí | formato uuid | `@IsArray()` `@IsUUID('4', { each: true })` | Perfiles destinatarios (seguidores) | `src/modules/community/dto/feed.dto.ts:34` |
| `origin` | `string` | No | valores: FOLLOWING, GROUP, TOPIC, SUGGESTED, PROMOTED | `@IsOptional()` `@IsIn(['FOLLOWING', 'GROUP', 'TOPIC', 'SUGGESTED', 'PROMOTED'])` | Origen del item | `src/modules/community/dto/feed.dto.ts:45` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/community-reads.int-spec.ts:411` |
| CONTROLADOR | `src/modules/community/controllers/community-feed.controller.spec.ts:19` |

### Flujos

- Módulo Community (19) — etapa `UC-19-15`

---

## 79. GET /internal/community/search/health

- **Origen:** CONTRATO
- **Nombre:** Estado del índice del directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySearchIndexController.health` — `src/modules/community/controllers/community-search-index.controller.ts:76`

### Qué es y para qué sirve (negocio)

Estado del índice del directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /internal/community/search/health` la atiende `CommunitySearchIndexController.health` (src/modules/community/controllers/community-search-index.controller.ts:76). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN. Delega en `CommunitySearchIndexService.health`. Lee community.public_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `src/modules/community/controllers/community-search-index.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySearchIndexController.health → CommunitySearchIndexService.health → PublicSearchRepository.countIndexable | `src/modules/community/repositories/public-search.repository.ts:755` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchIndexHealthDto>` · DTO `SearchIndexHealthDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `available` | `boolean` | Sí | — | — | Si el cluster de búsqueda responde | `src/modules/community/dto/search-index.dto.ts:39` |
| `profiles` | `number` | Sí | — | — | Perfiles públicos en la base | `src/modules/community/dto/search-index.dto.ts:42` |
| `documents` | `number` | Sí | admite null | — | Documentos en el índice; `null` si el índice no responde | `src/modules/community/dto/search-index.dto.ts:48` |
| `serving` | `boolean` | Sí | — | — | Si el buscador público está sirviéndose del índice (y no del SQL) | `src/modules/community/dto/search-index.dto.ts:54` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: OpenSearch está en estado red |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySearchIndexController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 80. POST /internal/community/search/reindex

- **Origen:** CONTRATO
- **Nombre:** Reindexar el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunitySearchIndexController.reindex` — `src/modules/community/controllers/community-search-index.controller.ts:47`

### Qué es y para qué sirve (negocio)

Reindexar el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/search/reindex` la atiende `CommunitySearchIndexController.reindex` (src/modules/community/controllers/community-search-index.controller.ts:47). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN. Valida el cuerpo como `ReindexRequestDto` (1 campo, 0 obligatorios). Delega en `CommunitySearchIndexService.reindexAll`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 1 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN | `src/modules/community/controllers/community-search-index.controller.ts:47` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.locationsByOwner | `src/modules/community/repositories/public-search.repository.ts:797` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → PublicSearchRepository.countIndexable | `src/modules/community/repositories/public-search.repository.ts:755` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunitySearchIndexController.reindex → CommunitySearchIndexService.reindexAll → CommunitySearchIndexService.buildDocuments → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: El documento trae campos no declarados para este índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunitySearchIndexController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 81. POST /internal/community/verification/badges

- **Origen:** CONTRATO
- **Nombre:** Emitir un sello a mano (auditado)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityVerificationController.grant` — `src/modules/community/controllers/community-verification.controller.ts:66`

### Qué es y para qué sirve (negocio)

Emitir un sello a mano (auditado). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/verification/badges` la atiende `CommunityVerificationController.grant` (src/modules/community/controllers/community-verification.controller.ts:66). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GrantBadgeDto` (3 campos, 1 obligatorio). Delega en `EntityManager.transactional`, `CommunityVerificationService.applyVerified`. Crea filas en audit.verified_badges_history, community.verified_badges. Actualiza community.public_profiles, community.verified_badges. Lee community.public_profiles, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-verification.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-verification.controller.spec.ts:76` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityVerificationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 82. POST /internal/community/verification/badges/{targetId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Bajar los sellos de un sujeto (auditado)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityVerificationController.revoke` — `src/modules/community/controllers/community-verification.controller.ts:104`

### Qué es y para qué sirve (negocio)

Bajar los sellos de un sujeto (auditado). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/verification/badges/{targetId}/revoke` la atiende `CommunityVerificationController.revoke` (src/modules/community/controllers/community-verification.controller.ts:104). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RevokeBadgeDto` (1 campo, 0 obligatorios). Delega en `EntityManager.transactional`, `CommunityVerificationService.applyRevoked`. Crea filas en audit.verified_badges_history. Actualiza community.public_profiles, community.verified_badges. Lee community.public_profiles, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/community/controllers/community-verification.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-verification.controller.spec.ts:92` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityVerificationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 83. POST /internal/community/verification/badges/expire-sweep

- **Origen:** CONTRATO
- **Nombre:** Bajar los sellos cuya vigencia ya venció
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityVerificationController.expireSweep` — `src/modules/community/controllers/community-verification.controller.ts:133`

### Qué es y para qué sirve (negocio)

Bajar los sellos cuya vigencia ya venció. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /internal/community/verification/badges/expire-sweep` la atiende `CommunityVerificationController.expireSweep` (src/modules/community/controllers/community-verification.controller.ts:133). Exige sesión con alguno de los roles SYSTEM, SECURITY_ADMIN. Delega en `CommunityVerificationService.expireSweep`. Crea filas en audit.verified_badges_history. Actualiza community.public_profiles, community.verified_badges. Lee community.public_profiles, community.verified_badges.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SYSTEM, SECURITY_ADMIN | `src/modules/community/controllers/community-verification.controller.ts:133` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityVerificationController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 84. GET /l/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de un laboratorio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getDiagnosticUnit` — `src/modules/community/controllers/community-public.controller.ts:558`

### Qué es y para qué sirve (negocio)

Ficha pública de un laboratorio. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /l/{slug}` la atiende `CommunityPublicController.getDiagnosticUnit` (src/modules/community/controllers/community-public.controller.ts:558). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:558` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:558` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1347` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1319` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:1112` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1332` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:1173` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practices` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:913` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getDiagnosticUnit → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:398` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:401` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:413` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:416` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:419` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:422` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:425` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:428` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:431` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:438` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `practiceSites` | `array<PublicPracticeSiteDto>` | Sí | — | — | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:445` |
| `practiceSites[].id` | `string` | Sí | formato uuid | — | Identificador de la sede | `src/modules/community/dto/public-search.dto.ts:371` |
| `practiceSites[].name` | `string` | Sí | — | — | Nombre de la sede | `src/modules/community/dto/public-search.dto.ts:374` |
| `practiceSites[].addressText` | `string` | Sí | admite null | — | Dirección en una línea, o null si la sede no cargó ninguna | `src/modules/community/dto/public-search.dto.ts:380` |
| `practiceSites[].location` | `PublicLocationDto` | Sí | — | — | Punto de la sede; null si su dirección no tiene coordenadas | `src/modules/community/dto/public-search.dto.ts:387` |
| `practiceSites[].location.lat` | `number` | Sí | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `practiceSites[].location.lng` | `number` | Sí | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `practiceSites[].isOwn` | `boolean` | Sí | — | — | Si es un consultorio propio del profesional y no la sede de una organización | `src/modules/community/dto/public-search.dto.ts:393` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:448` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:451` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:454` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:460` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:463` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:469` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:472` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:475` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 85. GET /o/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de una organización
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getOrganization` — `src/modules/community/controllers/community-public.controller.ts:540`

### Qué es y para qué sirve (negocio)

Ficha pública de una organización. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /o/{slug}` la atiende `CommunityPublicController.getOrganization` (src/modules/community/controllers/community-public.controller.ts:540). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:540` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:540` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1347` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1319` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:1112` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1332` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:1173` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practices` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:913` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getOrganization → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:398` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:401` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:413` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:416` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:419` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:422` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:425` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:428` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:431` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:438` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `practiceSites` | `array<PublicPracticeSiteDto>` | Sí | — | — | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:445` |
| `practiceSites[].id` | `string` | Sí | formato uuid | — | Identificador de la sede | `src/modules/community/dto/public-search.dto.ts:371` |
| `practiceSites[].name` | `string` | Sí | — | — | Nombre de la sede | `src/modules/community/dto/public-search.dto.ts:374` |
| `practiceSites[].addressText` | `string` | Sí | admite null | — | Dirección en una línea, o null si la sede no cargó ninguna | `src/modules/community/dto/public-search.dto.ts:380` |
| `practiceSites[].location` | `PublicLocationDto` | Sí | — | — | Punto de la sede; null si su dirección no tiene coordenadas | `src/modules/community/dto/public-search.dto.ts:387` |
| `practiceSites[].location.lat` | `number` | Sí | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `practiceSites[].location.lng` | `number` | Sí | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `practiceSites[].isOwn` | `boolean` | Sí | — | — | Si es un consultorio propio del profesional y no la sede de una organización | `src/modules/community/dto/public-search.dto.ts:393` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:448` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:451` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:454` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:460` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:463` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:469` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:472` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:475` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 86. GET /p/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de un profesional
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getPractitioner` — `src/modules/community/controllers/community-public.controller.ts:530`

### Qué es y para qué sirve (negocio)

Ficha pública de un profesional. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /p/{slug}` la atiende `CommunityPublicController.getPractitioner` (src/modules/community/controllers/community-public.controller.ts:530). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:530` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:530` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1347` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1319` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:1112` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1332` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:1173` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practices` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:913` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getPractitioner → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:398` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:401` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:413` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:416` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:419` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:422` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:425` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:428` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:431` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:438` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `practiceSites` | `array<PublicPracticeSiteDto>` | Sí | — | — | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:445` |
| `practiceSites[].id` | `string` | Sí | formato uuid | — | Identificador de la sede | `src/modules/community/dto/public-search.dto.ts:371` |
| `practiceSites[].name` | `string` | Sí | — | — | Nombre de la sede | `src/modules/community/dto/public-search.dto.ts:374` |
| `practiceSites[].addressText` | `string` | Sí | admite null | — | Dirección en una línea, o null si la sede no cargó ninguna | `src/modules/community/dto/public-search.dto.ts:380` |
| `practiceSites[].location` | `PublicLocationDto` | Sí | — | — | Punto de la sede; null si su dirección no tiene coordenadas | `src/modules/community/dto/public-search.dto.ts:387` |
| `practiceSites[].location.lat` | `number` | Sí | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `practiceSites[].location.lng` | `number` | Sí | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `practiceSites[].isOwn` | `boolean` | Sí | — | — | Si es un consultorio propio del profesional y no la sede de una organización | `src/modules/community/dto/public-search.dto.ts:393` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:448` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:451` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:454` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:460` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:463` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:469` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:472` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:475` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 87. POST /patients/me/reviews

- **Origen:** CONTRATO
- **Nombre:** Calificar una atención recibida
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PatientReviewsController.publishOwnReview` — `src/modules/community/controllers/patient-reviews.controller.ts:46`

### Qué es y para qué sirve (negocio)

Calificar una atención recibida. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /patients/me/reviews` la atiende `PatientReviewsController.publishOwnReview` (src/modules/community/controllers/patient-reviews.controller.ts:46). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `CommunityCreateReviewDto` (7 campos, 2 obligatorios). Delega en `CommunityReviewsService.publishOwnReview`. Crea filas en community.review_dimension_scores, community.service_reviews. Lee clinical.encounter_participants, clinical.encounters, community.public_profiles, community.service_reviews.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/community/controllers/patient-reviews.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical.encounter_participants` | LEE | LEE | DIRECTA | PatientReviewsController.publishOwnReview → CommunityReviewsService.publishOwnReview → CommunityReviewsService.publishReview → CommunityReviewsService.assertEligibleCare | `src/modules/community/services/community-reviews.service.ts:145` |
| `clinical.encounters` | LEE | LEE | DIRECTA | PatientReviewsController.publishOwnReview → CommunityReviewsService.publishOwnReview → CommunityReviewsService.resolveTargetOfEncounter → EncountersRepository.findById | `src/modules/clinical/repositories/encounters.repository.ts:169` |
| `community.public_profiles` | LEE | LEE | DIRECTA | PatientReviewsController.publishOwnReview → CommunityReviewsService.publishOwnReview → CommunityReviewsService.resolveTargetOfEncounter → PublicProfilesRepository.findByTarget | `src/modules/community/repositories/public-profiles.repository.ts:350` |
| `community.review_dimension_scores` | ESCRIBE | CREA | DIRECTA | PatientReviewsController.publishOwnReview → CommunityReviewsService.publishOwnReview → CommunityReviewsService.publishReview → ReviewsRepository.createDimensionScore | `src/modules/community/repositories/reviews.repository.ts:365` |
| `community.service_reviews` | ESCRIBE | CREA | DIRECTA | PatientReviewsController.publishOwnReview → CommunityReviewsService.publishOwnReview → CommunityReviewsService.publishReview → ReviewsRepository.create | `src/modules/community/repositories/reviews.repository.ts:331` |
| `community.service_reviews` | LEE | LEE | DIRECTA | PatientReviewsController.publishOwnReview → CommunityReviewsService.publishOwnReview → CommunityReviewsService.publishReview → ReviewsRepository.findByReviewerEncounter | `src/modules/community/repositories/reviews.repository.ts:126` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo un paciente con atención registrada puede calificar |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil objetivo no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe una review verificada para este encuentro |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La atención declarada no habilita una reseña; PreconditionFailedException: El perfil no acepta reviews; PreconditionFailedException: La atención todavía no terminó; PreconditionFailedException: La atención declarada no fue con este profesional |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:PatientReviewsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 88. GET /public/comments/{commentId}/replies

- **Origen:** CONTRATO
- **Nombre:** Respuestas de un comentario público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.commentReplies` — `src/modules/community/controllers/community-public.controller.ts:177`

### Qué es y para qué sirve (negocio)

Respuestas de un comentario público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/comments/{commentId}/replies` la atiende `CommunityPublicController.commentReplies` (src/modules/community/controllers/community-public.controller.ts:177). Es una ruta pública: no exige token. Delega en `CommunityPublicService.commentReplies`. Lee community.comment_media, community.comments, community.public_profiles, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:177` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: commentId | `src/modules/community/controllers/community-public.controller.ts:177` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:177` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comment_media` | LEE | LEE | POR_SQL | CommunityPublicController.commentReplies → CommunityPublicService.commentReplies → PublicSearchRepository.listPublicCommentReplies → PublicSearchRepository.listPublicComments → PublicSearchRepository.listPublicCommentMedia | `src/modules/community/repositories/public-search.repository.ts:1816` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.commentReplies → CommunityPublicService.commentReplies → PublicSearchRepository.findPostOfPublicComment | `src/modules/community/repositories/public-search.repository.ts:1662` |
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.commentReplies → CommunityPublicService.commentReplies → PublicSearchRepository.findPostOfPublicComment | `src/modules/community/repositories/public-search.repository.ts:1662` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.commentReplies → CommunityPublicService.commentReplies → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1483` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `commentId` | path | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicCommentPageDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Comentario no encontrado; ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:204` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 89. GET /public/media/{id}

- **Origen:** CONTRATO
- **Nombre:** Servir una imagen pública (avatar, portada o post)
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getPublicMedia` — `src/modules/community/controllers/community-public.controller.ts:501`

### Qué es y para qué sirve (negocio)

Servir una imagen pública (avatar, portada o post). Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/media/{id}` la atiende `CommunityPublicController.getPublicMedia` (src/modules/community/controllers/community-public.controller.ts:501). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getPublicMedia`. Lee common.file_versions, common.files, community.comment_media, community.comments, community.post_media, community.public_profiles, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:501` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/community/controllers/community-public.controller.ts:501` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:501` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → FileUploadService.downloadPublicMedia → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → FileUploadService.downloadPublicMedia → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `community.comment_media` | LEE | LEE | POR_SQL | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicSearchRepository.isPublicCommentMedia | `src/modules/community/repositories/public-search.repository.ts:1423` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicSearchRepository.isPublicCommentMedia | `src/modules/community/repositories/public-search.repository.ts:1423` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicSearchRepository.isPublicPostMedia | `src/modules/community/repositories/public-search.repository.ts:1374` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicProfilesRepository.isPublicMedia | `src/modules/community/repositories/public-profiles.repository.ts:381` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.getPublicMedia → CommunityPublicService.getPublicMedia → PublicSearchRepository.isPublicPostMedia | `src/modules/community/repositories/public-search.repository.ts:1374` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Archivo no encontrado; ResourceNotFoundException: Versión vigente no encontrada; ResourceNotFoundException: La URI no pertenece al almacenamiento local; ResourceNotFoundException: La URI de almacenamiento local está mal formada; ResourceNotFoundException: El contenido no está disponible en el almacenamiento local; ResourceNotFoundException: La URI no pertenece al bucket configurado; ResourceNotFoundException: La URI S3 está mal formada o fuera del prefijo permitido; ResourceNotFoundException: El contenido no está disponible en el almacenamiento configurado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El archivo está borrado; PreconditionFailedException: El archivo no tiene una versión vigente; PreconditionFailedException: La versión vigente todavía no está lista para servirse públicamente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.SERVICE_UNAVAILABLE}; Error: S3 object body is empty |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-signature-registration.int-spec.ts:57` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 90. GET /public/nearby

- **Origen:** CONTRATO
- **Nombre:** Prestadores cercanos, en línea recta
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.nearby` — `src/modules/community/controllers/community-public.controller.ts:382`

### Qué es y para qué sirve (negocio)

Prestadores cercanos, en línea recta. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/nearby` la atiende `CommunityPublicController.nearby` (src/modules/community/controllers/community-public.controller.ts:382). Es una ruta pública: no exige token. Delega en `CommunityPublicService.nearby`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:382` |
| PARAMETRO_QUERY | lat (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | lng (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | radiusKm (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | kind (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:382` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → PublicSearchRepository.nearbyProfiles | `src/modules/community/repositories/public-search.repository.ts:679` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → PublicSearchRepository.nearbyProfiles | `src/modules/community/repositories/public-search.repository.ts:708` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.nearby → CommunityPublicService.nearby → CommunityPublicService.nearbyFromSql → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `lat` | query | Sí | `string` | — |
| `lng` | query | Sí | `string` | — |
| `radiusKm` | query | Sí | `string` | — |
| `kind` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicNearbyPageDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; BadRequestException: Se requieren coordenadas válidas: lat en [-90,90] y lng en [-180,180] |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:140` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 91. GET /public/posts

- **Origen:** CONTRATO
- **Nombre:** Últimas publicaciones de todos los profesionales
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.feedPublico` — `src/modules/community/controllers/community-public.controller.ts:116`

### Qué es y para qué sirve (negocio)

Últimas publicaciones de todos los profesionales. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/posts` la atiende `CommunityPublicController.feedPublico` (src/modules/community/controllers/community-public.controller.ts:116). Es una ruta pública: no exige token. Delega en `CommunityPublicService.feedPublic`. Lee community.comments, community.post_media, community.public_profiles, community.reactions, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:116` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:116` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublic → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1347` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublic → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1319` |
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublic → PublicSearchRepository.listFeedPublic | `src/modules/community/repositories/public-search.repository.ts:1248` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublic → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1332` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.feedPublico → CommunityPublicService.feedPublic → PublicSearchRepository.listFeedPublic | `src/modules/community/repositories/public-search.repository.ts:1248` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicFeedPageDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/hardening/mch-028.int-spec.ts:69` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 92. GET /public/posts/{postId}/comments

- **Origen:** CONTRATO
- **Nombre:** Comentarios raíz de una publicación pública
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.postComments` — `src/modules/community/controllers/community-public.controller.ts:156`

### Qué es y para qué sirve (negocio)

Comentarios raíz de una publicación pública. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/posts/{postId}/comments` la atiende `CommunityPublicController.postComments` (src/modules/community/controllers/community-public.controller.ts:156). Es una ruta pública: no exige token. Delega en `CommunityPublicService.postComments`. Lee community.comment_media, community.comments, community.public_profiles, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:156` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-public.controller.ts:156` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:156` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.comment_media` | LEE | LEE | POR_SQL | CommunityPublicController.postComments → CommunityPublicService.postComments → PublicSearchRepository.listPublicRootComments → PublicSearchRepository.listPublicComments → PublicSearchRepository.listPublicCommentMedia | `src/modules/community/repositories/public-search.repository.ts:1816` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.postComments → CommunityPublicService.postComments → PublicSearchRepository.listPublicRootComments → PublicSearchRepository.listPublicComments | `src/modules/community/repositories/public-search.repository.ts:1756` |
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.postComments → CommunityPublicService.postComments → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1483` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.postComments → CommunityPublicService.postComments → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1483` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicCommentPageDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:193` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 93. GET /public/posts/{postId}/reactions

- **Origen:** CONTRATO
- **Nombre:** Quiénes reaccionaron a una publicación pública
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.postReactions` — `src/modules/community/controllers/community-public.controller.ts:141`

### Qué es y para qué sirve (negocio)

Quiénes reaccionaron a una publicación pública. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/posts/{postId}/reactions` la atiende `CommunityPublicController.postReactions` (src/modules/community/controllers/community-public.controller.ts:141). Es una ruta pública: no exige token. Delega en `CommunityPublicService.postReactions`. Lee community.public_profiles, community.reactions, community.social_posts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:141` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: postId | `src/modules/community/controllers/community-public.controller.ts:141` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:141` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | POR_SQL | CommunityPublicController.postReactions → CommunityPublicService.postReactions → PublicSearchRepository.listPostReactors | `src/modules/community/repositories/public-search.repository.ts:1544` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.postReactions → CommunityPublicService.postReactions → PublicSearchRepository.listPostReactors | `src/modules/community/repositories/public-search.repository.ts:1544` |
| `community.social_posts` | LEE | LEE | POR_SQL | CommunityPublicController.postReactions → CommunityPublicService.postReactions → CommunityPublicService.assertPostPublic → PublicSearchRepository.isPostPublic | `src/modules/community/repositories/public-search.repository.ts:1483` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `postId` | path | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicPostReactionPageDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios; Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Publicación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:182` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 94. GET /public/profiles/{prefijo}/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública por prefijo de vertical
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getProfileByPrefix` — `src/modules/community/controllers/community-public.controller.ts:427`

### Qué es y para qué sirve (negocio)

Ficha pública por prefijo de vertical. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/profiles/{prefijo}/{slug}` la atiende `CommunityPublicController.getProfileByPrefix` (src/modules/community/controllers/community-public.controller.ts:427). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:427` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:427` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1347` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1319` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:1112` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1332` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:1173` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practices` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:913` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getProfileByPrefix → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |

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
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:398` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:401` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:413` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:416` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:419` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:422` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:425` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:428` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:431` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:438` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `practiceSites` | `array<PublicPracticeSiteDto>` | Sí | — | — | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:445` |
| `practiceSites[].id` | `string` | Sí | formato uuid | — | Identificador de la sede | `src/modules/community/dto/public-search.dto.ts:371` |
| `practiceSites[].name` | `string` | Sí | — | — | Nombre de la sede | `src/modules/community/dto/public-search.dto.ts:374` |
| `practiceSites[].addressText` | `string` | Sí | admite null | — | Dirección en una línea, o null si la sede no cargó ninguna | `src/modules/community/dto/public-search.dto.ts:380` |
| `practiceSites[].location` | `PublicLocationDto` | Sí | — | — | Punto de la sede; null si su dirección no tiene coordenadas | `src/modules/community/dto/public-search.dto.ts:387` |
| `practiceSites[].location.lat` | `number` | Sí | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `practiceSites[].location.lng` | `number` | Sí | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `practiceSites[].isOwn` | `boolean` | Sí | — | — | Si es un consultorio propio del profesional y no la sede de una organización | `src/modules/community/dto/public-search.dto.ts:393` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:448` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:451` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:454` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:460` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:463` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:469` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:472` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:475` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 95. GET /public/profiles/{prefijo}/{slug}/reviews

- **Origen:** CONTRATO
- **Nombre:** Opiniones publicadas de una ficha pública
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.listPublicProfileReviews` — `src/modules/community/controllers/community-public.controller.ts:467`

### Qué es y para qué sirve (negocio)

Opiniones publicadas de una ficha pública. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/profiles/{prefijo}/{slug}/reviews` la atiende `CommunityPublicController.listPublicProfileReviews` (src/modules/community/controllers/community-public.controller.ts:467). Es una ruta pública: no exige token. Delega en `CommunityReviewsReadService.listPublicReviewsBySlug`. Lee community.public_profiles, community.review_dimension_scores, community.review_responses, community.service_reviews, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:467` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:467` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.listPublicProfileReviews → CommunityReviewsReadService.listPublicReviewsBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:1112` |
| `community.review_dimension_scores` | LEE | LEE | DIRECTA | CommunityPublicController.listPublicProfileReviews → CommunityReviewsReadService.listPublicReviewsBySlug → CommunityReviewsReadService.projectPage → ReviewsRepository.listDimensionScores | `src/modules/community/repositories/reviews.repository.ts:216` |
| `community.review_responses` | LEE | LEE | DIRECTA | CommunityPublicController.listPublicProfileReviews → CommunityReviewsReadService.listPublicReviewsBySlug → CommunityReviewsReadService.projectPage → ReviewsRepository.listResponses | `src/modules/community/repositories/reviews.repository.ts:225` |
| `community.service_reviews` | LEE | LEE | DIRECTA | CommunityPublicController.listPublicProfileReviews → CommunityReviewsReadService.listPublicReviewsBySlug → CommunityReviewsReadService.projectPage → ReviewsRepository.listByTargetPage | `src/modules/community/repositories/reviews.repository.ts:157` |
| `profiles.persons` | LEE | LEE | DIRECTA | CommunityPublicController.listPublicProfileReviews → CommunityReviewsReadService.listPublicReviewsBySlug → CommunityReviewsReadService.projectPage → ReviewsRepository.displayNamesByPerson | `src/modules/community/repositories/reviews.repository.ts:198` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `prefijo` | path | Sí | `string` | — |
| `slug` | path | Sí | `string` | — |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicProfileReviewsDto>` · DTO `PublicProfileReviewsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ratingAverage` | `number` | No | admite null | — | Promedio de estrellas del perfil, con una decimal, o `null` si no tiene ninguna reseña publicada. `null` y no `0`: cero estrellas es una calificación pésima y «todavía nadie calificó» no lo es. Quien lo reciba tiene que decir «sin calificaciones». | `src/modules/community/dto/read-reviews.dto.ts:143` |
| `ratingCount` | `number` | Sí | — | — | Cuántas reseñas publicadas tiene el perfil en total. | `src/modules/community/dto/read-reviews.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:227` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 96. GET /public/search

- **Origen:** CONTRATO
- **Nombre:** Buscador público unificado
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.search` — `src/modules/community/controllers/community-public.controller.ts:192`

### Qué es y para qué sirve (negocio)

Buscador público unificado. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search` la atiende `CommunityPublicController.search` (src/modules/community/controllers/community-public.controller.ts:192). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:192` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:192` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:521` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:486` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1704` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.search → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.search → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 97. GET /public/search/diagnostic-units

- **Origen:** CONTRATO
- **Nombre:** Laboratorios y centros de diagnóstico
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchDiagnosticUnits` — `src/modules/community/controllers/community-public.controller.ts:306`

### Qué es y para qué sirve (negocio)

Laboratorios y centros de diagnóstico. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/diagnostic-units` la atiende `CommunityPublicController.searchDiagnosticUnits` (src/modules/community/controllers/community-public.controller.ts:306). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:306` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:306` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:521` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:486` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1704` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchDiagnosticUnits → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 98. GET /public/search/insurers

- **Origen:** CONTRATO
- **Nombre:** Aseguradoras en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchInsurers` — `src/modules/community/controllers/community-public.controller.ts:323`

### Qué es y para qué sirve (negocio)

Aseguradoras en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/insurers` la atiende `CommunityPublicController.searchInsurers` (src/modules/community/controllers/community-public.controller.ts:323). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:323` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:323` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:521` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:486` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1704` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchInsurers → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchInsurers → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 99. GET /public/search/medications

- **Origen:** CONTRATO
- **Nombre:** Medicamentos ofertados públicamente
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchMedications` — `src/modules/community/controllers/community-public.controller.ts:357`

### Qué es y para qué sirve (negocio)

Medicamentos ofertados públicamente. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/medications` la atiende `CommunityPublicController.searchMedications` (src/modules/community/controllers/community-public.controller.ts:357). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:357` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:357` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:521` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:486` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1704` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchMedications → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchMedications → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 100. GET /public/search/organizations

- **Origen:** CONTRATO
- **Nombre:** Organizaciones en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchOrganizations` — `src/modules/community/controllers/community-public.controller.ts:268`

### Qué es y para qué sirve (negocio)

Organizaciones en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/organizations` la atiende `CommunityPublicController.searchOrganizations` (src/modules/community/controllers/community-public.controller.ts:268). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:268` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:268` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:521` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:486` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1704` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchOrganizations → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `city` | query | No | `string` | Ciudad a la que acotar; sin tildes ni mayúsculas que valgan |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |
| `department` | query | No | `string` | concept_id de VS_BO_DEPARTMENT al que acotar; uno ajeno al conjunto da 422 |
| `municipality` | query | No | `string` | concept_id de VS_BO_MUNICIPALITY al que acotar; uno ajeno al conjunto, o de otro departamento que `department`, da 422 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:110` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 101. GET /public/search/pharmacies

- **Origen:** CONTRATO
- **Nombre:** Farmacias en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchPharmacies` — `src/modules/community/controllers/community-public.controller.ts:340`

### Qué es y para qué sirve (negocio)

Farmacias en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/pharmacies` la atiende `CommunityPublicController.searchPharmacies` (src/modules/community/controllers/community-public.controller.ts:340). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:340` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:340` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:521` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:486` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1704` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchPharmacies → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 102. GET /public/search/practitioners

- **Origen:** CONTRATO
- **Nombre:** Profesionales en el directorio público
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.searchPractitioners` — `src/modules/community/controllers/community-public.controller.ts:217`

### Qué es y para qué sirve (negocio)

Profesionales en el directorio público. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /public/search/practitioners` la atiende `CommunityPublicController.searchPractitioners` (src/modules/community/controllers/community-public.controller.ts:217). Es una ruta pública: no exige token. Delega en `CommunityPublicService.search`. Lee common.addresses, community.public_profiles, community.service_reviews, community.verified_badges, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.practitioner_schedules, scheduling.schedulable_resources y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:217` |
| PARAMETRO_QUERY | q (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | verified (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | cursor (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | limit (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:217` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.targetIdsByCity | `src/modules/community/repositories/public-search.repository.ts:521` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicSearchRepository.searchProfiles | `src/modules/community/repositories/public-search.repository.ts:486` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicSearchRepository.searchProfiles → PublicSearchRepository.practitionerIdsBySpecialty | `src/modules/community/repositories/public-search.repository.ts:1704` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → CatalogConceptsRepository.findById | `src/modules/terminology/repositories/catalog-concepts.repository.ts:75` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | CommunityPublicController.searchPractitioners → CommunityPublicService.search → PublicTerritoryFilterService.resolve → PublicTerritoryFilterService.assertMember → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | Sí | `string` | — |
| `verified` | query | Sí | `string` | — |
| `specialty` | query | No | `string` | concept_id de VS_MEDICAL_SPECIALTY al que acotar; uno ajeno al conjunto da 422 |
| `cursor` | query | Sí | `string` | — |
| `limit` | query | Sí | `string` | — |
| `department` | query | No | `string` | concept_id de VS_BO_DEPARTMENT al que acotar; uno ajeno al conjunto da 422 |
| `municipality` | query | No | `string` | concept_id de VS_BO_MUNICIPALITY al que acotar; uno ajeno al conjunto, o de otro departamento que `department`, da 422 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicSearchPageDto>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Índice de búsqueda no reconocido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: El catálogo territorial no está disponible; PreconditionFailedException: {options.mensaje}; PreconditionFailedException: El departamento no tiene una sigla reconocible en el catálogo; PreconditionFailedException: El municipio no pertenece al departamento elegido; PreconditionFailedException: Falta el tenant de contexto para la operación de búsqueda; PreconditionFailedException: Campo de {kind} no permitido para el índice |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/community/controllers/community-public.controller.spec.ts:55` |

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 103. GET /s/{slug}

- **Origen:** CONTRATO
- **Nombre:** Ficha pública de una aseguradora
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CommunityPublicController.getInsurer` — `src/modules/community/controllers/community-public.controller.ts:568`

### Qué es y para qué sirve (negocio)

Ficha pública de una aseguradora. Dentro del módulo (descripción del modelo, en inglés): «A delivery-platform-style discovery and reputation layer for practitioners, practices, hospitals, diagnostic units, pharmacies, clinics and care sites.» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_19_community.puml:38`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /s/{slug}` la atiende `CommunityPublicController.getInsurer` (src/modules/community/controllers/community-public.controller.ts:568). Es una ruta pública: no exige token. Delega en `CommunityPublicService.getBySlug`. Lee common.addresses, community.comments, community.post_media, community.public_profiles, community.reactions, community.service_reviews, community.social_posts, community.verified_badges y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | Ruta pública: no exige token | `src/modules/community/controllers/community-public.controller.ts:568` |
| RATE_LIMIT | Límite propio: Throttle(PUBLIC_RATE_LIMIT) | `src/modules/community/controllers/community-public.controller.ts:568` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `community.comments` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1347` |
| `community.post_media` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1319` |
| `community.public_profiles` | LEE | LEE | DIRECTA | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.findPublicBySlug | `src/modules/community/repositories/public-search.repository.ts:1112` |
| `community.reactions` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.engagementByPost | `src/modules/community/repositories/public-search.repository.ts:1332` |
| `community.service_reviews` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.ratingsByProfile | `src/modules/community/repositories/public-search.repository.ts:1140` |
| `community.social_posts` | LEE | LEE | DIRECTA | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.listPublicPosts | `src/modules/community/repositories/public-search.repository.ts:1173` |
| `community.verified_badges` | LEE | LEE | DIRECTA | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.badgesByProfiles | `src/modules/community/repositories/public-search.repository.ts:1093` |
| `practice.practice_sites` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practices` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `practice.practitioner_role_assignments` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.person_account_links` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.practiceSitesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:960` |
| `profiles.practitioner_affiliations` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.affiliationsByPractitioner | `src/modules/community/repositories/public-search.repository.ts:913` |
| `profiles.practitioner_specialties` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |
| `scheduling.bookable_slots` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.practitioner_schedules` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `scheduling.schedulable_resources` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → CommunityPublicService.signals → PublicSearchRepository.agendaByPractitioner | `src/modules/community/repositories/public-search.repository.ts:1024` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | CommunityPublicController.getInsurer → CommunityPublicService.getBySlug → PublicSearchRepository.specialtiesByPractitioner | `src/modules/community/repositories/public-search.repository.ts:868` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `slug` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PublicDirectoryProfileDto>` · DTO `PublicDirectoryProfileDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `src/modules/community/dto/public-search.dto.ts:398` |
| `slug` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:401` |
| `displayName` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:404` |
| `headline` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:407` |
| `biography` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:410` |
| `avatarUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:413` |
| `coverUrl` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:416` |
| `verified` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:419` |
| `city` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:422` |
| `address` | `string` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:425` |
| `location` | `PublicLocationDto` | No | — | — | — | `src/modules/community/dto/public-search.dto.ts:428` |
| `location.lat` | `number` | No | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `location.lng` | `number` | No | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `specialties` | `array<string>` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:431` |
| `trajectory` | `array<PublicAffiliationDto>` | Sí | — | — | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:438` |
| `trajectory[].organizationName` | `string` | Sí | — | — | Institución, tal como la declaró el profesional | `src/modules/community/dto/public-search.dto.ts:332` |
| `trajectory[].roleTitle` | `string` | Sí | — | — | Cargo ejercido | `src/modules/community/dto/public-search.dto.ts:335` |
| `trajectory[].departmentText` | `string` | Sí | admite null | — | Servicio o departamento, si lo declaró | `src/modules/community/dto/public-search.dto.ts:341` |
| `trajectory[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo | `src/modules/community/dto/public-search.dto.ts:348` |
| `trajectory[].endDate` | `string` | Sí | formato date; admite null | — | Fin del vínculo, o null si sigue vigente | `src/modules/community/dto/public-search.dto.ts:356` |
| `practiceSites` | `array<PublicPracticeSiteDto>` | Sí | — | — | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `src/modules/community/dto/public-search.dto.ts:445` |
| `practiceSites[].id` | `string` | Sí | formato uuid | — | Identificador de la sede | `src/modules/community/dto/public-search.dto.ts:371` |
| `practiceSites[].name` | `string` | Sí | — | — | Nombre de la sede | `src/modules/community/dto/public-search.dto.ts:374` |
| `practiceSites[].addressText` | `string` | Sí | admite null | — | Dirección en una línea, o null si la sede no cargó ninguna | `src/modules/community/dto/public-search.dto.ts:380` |
| `practiceSites[].location` | `PublicLocationDto` | Sí | — | — | Punto de la sede; null si su dirección no tiene coordenadas | `src/modules/community/dto/public-search.dto.ts:387` |
| `practiceSites[].location.lat` | `number` | Sí | — | — | Latitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:37` |
| `practiceSites[].location.lng` | `number` | Sí | — | — | Longitud en grados decimales | `src/modules/community/dto/public-search.dto.ts:40` |
| `practiceSites[].isOwn` | `boolean` | Sí | — | — | Si es un consultorio propio del profesional y no la sede de una organización | `src/modules/community/dto/public-search.dto.ts:393` |
| `ratingAverage` | `number` | Sí | admite null | — | — | `src/modules/community/dto/public-search.dto.ts:448` |
| `ratingCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:451` |
| `acceptsReviews` | `boolean` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:454` |
| `verifiedBadge` | `PublicVerifiedBadgeDto` | Sí | — | — | El mismo sello y la misma semántica que en el buscador | `src/modules/community/dto/public-search.dto.ts:460` |
| `verifiedBadge.status` | `string` | Sí | valores: VERIFIED, EXPIRED, NONE | — | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `src/modules/community/dto/public-search.dto.ts:65` |
| `verifiedBadge.badgeTypeConceptId` | `string` | Sí | admite null | — | Qué se verificó | `src/modules/community/dto/public-search.dto.ts:68` |
| `verifiedBadge.verificationMethodConceptId` | `string` | Sí | admite null | — | Cómo se verificó (autoridad externa, alta manual auditada) | `src/modules/community/dto/public-search.dto.ts:74` |
| `verifiedBadge.verifiedAt` | `string` | Sí | admite null | — | Desde cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:77` |
| `verifiedBadge.validUntil` | `string` | Sí | admite null | — | Hasta cuándo vale, ISO | `src/modules/community/dto/public-search.dto.ts:80` |
| `hasPublishedAgenda` | `boolean` | Sí | — | — | Si tiene agenda publicada | `src/modules/community/dto/public-search.dto.ts:463` |
| `nextAvailableDate` | `string` | Sí | admite null | — | Primer día con hueco (YYYY-MM-DD) | `src/modules/community/dto/public-search.dto.ts:469` |
| `posts` | `array<PublicPostSummaryDto>` | Sí | — | — | Máx. 20 | `src/modules/community/dto/public-search.dto.ts:472` |
| `posts[].id` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:274` |
| `posts[].bodyText` | `string` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:277` |
| `posts[].publishedAt` | `string` | Sí | — | — | Instante ISO-8601 en UTC | `src/modules/community/dto/public-search.dto.ts:280` |
| `posts[].mediaUrls` | `array<string>` | Sí | — | — | Vacío, nunca null | `src/modules/community/dto/public-search.dto.ts:283` |
| `posts[].reactionCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:286` |
| `posts[].commentCount` | `number` | Sí | — | — | — | `src/modules/community/dto/public-search.dto.ts:289` |
| `updatedAt` | `string` | Sí | — | — | Alimenta el ETag y el <lastmod> del sitemap | `src/modules/community/dto/public-search.dto.ts:475` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 404 | `NOT_FOUND` | ResourceNotFoundException: No encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/community.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Community (19) — etapa `ctrl:CommunityPublicController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

