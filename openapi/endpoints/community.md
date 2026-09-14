<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `community`

Referencia exhaustiva de 88 operación(es) del módulo `community`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `community`, `community-feed`, `community-groups`, `community-messaging`, `community-moderation`, `community-polls`, `community-public`, `community-reviews`, `community-social`, `community-timeline`
- **Controladores:** `CommunityFeedController`, `CommunityGroupsController`, `CommunityMessagingController`, `CommunityModerationController`, `CommunityPollsController`, `CommunityPublicController`, `CommunityReviewsController`, `CommunitySearchIndexController`, `CommunitySocialController`, `CommunityTimelineController`, `CommunityTopicsController`, `CommunityVerificationController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [DELETE /community/blocks](#1-delete-community-blocks) — Levantar un bloqueo
2. [GET /community/blocks](#2-get-community-blocks) — Bloqueos emitidos por un perfil
3. [POST /community/blocks](#3-post-community-blocks) — Bloquear a un usuario
4. [DELETE /community/bookmarks](#4-delete-community-bookmarks) — Quitar un marcador
5. [GET /community/bookmarks](#5-get-community-bookmarks) — Marcadores guardados por un perfil
6. [POST /community/bookmarks](#6-post-community-bookmarks) — Guardar un bookmark en una colección
7. [POST /community/comments](#7-post-community-comments) — Comentar (hilo anidado) con contadores
8. [GET /community/comments/media/{fileId}/content](#8-get-community-comments-media-fileid-content) — Descargar el adjunto de un comentario (imagen, sticker o GIF)
9. [GET /community/conversations](#9-get-community-conversations) — Conversaciones activas de un perfil
10. [POST /community/conversations](#10-post-community-conversations) — Crear una conversación con participantes
11. [GET /community/conversations/{conversationId}/attachments/{fileId}/content](#11-get-community-conversations-conversationid-attachments-fileid-content) — Descargar el adjunto de una conversación (participante activo)
12. [GET /community/conversations/{conversationId}/messages](#12-get-community-conversations-conversationid-messages) — Mensajes de una conversación
13. [POST /community/conversations/{conversationId}/messages](#13-post-community-conversations-conversationid-messages) — Enviar un mensaje directo en la conversación
14. [DELETE /community/conversations/{conversationId}/messages/{messageId}](#14-delete-community-conversations-conversationid-messages-messageid) — Eliminar un mensaje propio
15. [PATCH /community/conversations/{conversationId}/messages/{messageId}](#15-patch-community-conversations-conversationid-messages-messageid) — Editar el texto de un mensaje propio
16. [PATCH /community/conversations/{conversationId}/participant](#16-patch-community-conversations-conversationid-participant) — Marcar la conversación como favorita, fijada o archivada
17. [DELETE /community/conversations/{conversationId}/pin](#17-delete-community-conversations-conversationid-pin) — Soltar el mensaje fijado de la conversación
18. [POST /community/conversations/{conversationId}/pin](#18-post-community-conversations-conversationid-pin) — Fijar un mensaje de la conversación
19. [GET /community/conversations/{conversationId}/presence](#19-get-community-conversations-conversationid-presence) — Presencia de los demás participantes
20. [POST /community/conversations/{conversationId}/read](#20-post-community-conversations-conversationid-read) — Marcar mensajes como leídos (recibos)
21. [GET /community/feed](#21-get-community-feed) — Timeline de un perfil
22. [DELETE /community/follows](#22-delete-community-follows) — Dejar de seguir un objeto social
23. [GET /community/follows](#23-get-community-follows) — Seguimientos activos de un perfil
24. [POST /community/follows](#24-post-community-follows) — Seguir un objeto social
25. [GET /community/groups](#25-get-community-groups) — Grupos de una organización
26. [POST /community/groups](#26-post-community-groups) — Crear un grupo/comunidad
27. [GET /community/groups/{groupId}](#27-get-community-groups-groupid) — Ficha de un grupo
28. [GET /community/groups/{groupId}/members](#28-get-community-groups-groupid-members) — Integrantes de un grupo
29. [POST /community/groups/{groupId}/members](#29-post-community-groups-groupid-members) — Unirse a un grupo / comunidad
30. [PATCH /community/groups/{groupId}/members/{memberId}](#30-patch-community-groups-groupid-members-memberid) — Aprobar/rechazar un alta o cambiar el rol
31. [DELETE /community/groups/{groupId}/members/{memberProfileId}](#31-delete-community-groups-groupid-members-memberprofileid) — Salir del grupo o dar de baja a un integrante
32. [GET /community/groups/{groupId}/posts](#32-get-community-groups-groupid-posts) — Muro de un grupo
33. [POST /community/groups/{groupId}/posts](#33-post-community-groups-groupid-posts) — Publicar en el muro del grupo
34. [GET /community/moderation/appeals](#34-get-community-moderation-appeals) — Apelaciones presentadas, con su decisión
35. [POST /community/moderation/appeals/{appealId}/resolve](#35-post-community-moderation-appeals-appealid-resolve) — Resolver una apelación de moderación
36. [GET /community/moderation/decisions](#36-get-community-moderation-decisions) — Decisiones de moderación tomadas
37. [POST /community/moderation/decisions/{decisionId}/appeal](#37-post-community-moderation-decisions-decisionid-appeal) — Apelar una decisión de moderación
38. [GET /community/moderation/queue](#38-get-community-moderation-queue) — Cola de moderación con filtros y cursor
39. [POST /community/moderation/queue/{queueId}/decision](#39-post-community-moderation-queue-queueid-decision) — Resolver moderación (decisión + strike)
40. [GET /community/notifications](#40-get-community-notifications) — Notificaciones sociales de un perfil
41. [GET /community/polls/{pollId}](#41-get-community-polls-pollid) — Encuesta con opciones, recuentos y voto propio
42. [POST /community/polls/{pollId}/votes](#42-post-community-polls-pollid-votes) — Votar en una encuesta
43. [GET /community/posts/{postId}](#43-get-community-posts-postid) — Publicación con media, hashtags y menciones
44. [GET /community/posts/{postId}/comments](#44-get-community-posts-postid-comments) — Comentarios de una publicación (hilo anidado)
45. [POST /community/posts/{postId}/polls](#45-post-community-posts-postid-polls) — Crear una encuesta con opciones sobre un post
46. [GET /community/posts/{postId}/reactions](#46-get-community-posts-postid-reactions) — Reacciones de una publicación, agrupadas por tipo
47. [GET /community/profiles/{profileId}](#47-get-community-profiles-profileid) — Ficha de un perfil público
48. [GET /community/profiles/{profileId}/auto-reply](#48-get-community-profiles-profileid-auto-reply) — Respuesta automática por inactividad del perfil
49. [PUT /community/profiles/{profileId}/auto-reply](#49-put-community-profiles-profileid-auto-reply) — Configurar la respuesta automática del perfil
50. [GET /community/profiles/{profileId}/posts](#50-get-community-profiles-profileid-posts) — Publicaciones de un perfil
51. [POST /community/profiles/{profileId}/posts](#51-post-community-profiles-profileid-posts) — Publicar un post con hashtags, media y menciones
52. [GET /community/profiles/{profileId}/reviews](#52-get-community-profiles-profileid-reviews) — Reviews publicadas de un perfil
53. [POST /community/profiles/{profileId}/reviews](#53-post-community-profiles-profileid-reviews) — Publicar una review verificada de servicio
54. [POST /community/profiles/{profileId}/reviews/{reviewId}/responses](#54-post-community-profiles-profileid-reviews-reviewid-responses) — Responder una reseña de la propia vitrina
55. [GET /community/profiles/by-slug/{slug}](#55-get-community-profiles-by-slug-slug) — Ficha de un perfil público por su slug
56. [GET /community/profiles/me](#56-get-community-profiles-me) — Consultar la vitrina pública propia
57. [PUT /community/profiles/me](#57-put-community-profiles-me) — Crear o actualizar la vitrina pública propia
58. [GET /community/profiles/me/stats](#58-get-community-profiles-me-stats) — Estadísticas de la vitrina pública propia
59. [POST /community/public-profiles](#59-post-community-public-profiles) — Crear un perfil público (bootstrap del grafo social)
60. [PUT /community/reactions](#60-put-community-reactions) — Reaccionar a contenido (upsert una reacción por actor/objeto)
61. [POST /community/reports](#61-post-community-reports) — Reportar contenido y encolar moderación
62. [GET /community/topics](#62-get-community-topics) — Temas de la comunidad
63. [GET /f/{slug}](#63-get-f-slug) — Ficha pública de una farmacia
64. [GET /internal/community/feed/pending](#64-get-internal-community-feed-pending) — Publicaciones publicadas sin fan-out
65. [POST /internal/community/feed/rebuild](#65-post-internal-community-feed-rebuild) — Generar feed (fan-out y ranking)
66. [GET /internal/community/search/health](#66-get-internal-community-search-health) — Estado del índice del directorio público
67. [POST /internal/community/search/reindex](#67-post-internal-community-search-reindex) — Reindexar el directorio público
68. [POST /internal/community/verification/badges](#68-post-internal-community-verification-badges) — Emitir un sello a mano (auditado)
69. [POST /internal/community/verification/badges/{targetId}/revoke](#69-post-internal-community-verification-badges-targetid-revoke) — Bajar los sellos de un sujeto (auditado)
70. [POST /internal/community/verification/badges/expire-sweep](#70-post-internal-community-verification-badges-expire-sweep) — Bajar los sellos cuya vigencia ya venció
71. [GET /l/{slug}](#71-get-l-slug) — Ficha pública de un laboratorio
72. [GET /o/{slug}](#72-get-o-slug) — Ficha pública de una organización
73. [GET /p/{slug}](#73-get-p-slug) — Ficha pública de un profesional
74. [GET /public/comments/{commentId}/replies](#74-get-public-comments-commentid-replies) — Respuestas de un comentario público
75. [GET /public/media/{id}](#75-get-public-media-id) — Servir una imagen pública (avatar, portada o post)
76. [GET /public/nearby](#76-get-public-nearby) — Prestadores cercanos, en línea recta
77. [GET /public/posts](#77-get-public-posts) — Últimas publicaciones de todos los profesionales
78. [GET /public/posts/{postId}/comments](#78-get-public-posts-postid-comments) — Comentarios raíz de una publicación pública
79. [GET /public/posts/{postId}/reactions](#79-get-public-posts-postid-reactions) — Quiénes reaccionaron a una publicación pública
80. [GET /public/profiles/{prefijo}/{slug}](#80-get-public-profiles-prefijo-slug) — Ficha pública por prefijo de vertical
81. [GET /public/search](#81-get-public-search) — Buscador público unificado
82. [GET /public/search/diagnostic-units](#82-get-public-search-diagnostic-units) — Laboratorios y centros de diagnóstico
83. [GET /public/search/insurers](#83-get-public-search-insurers) — Aseguradoras en el directorio público
84. [GET /public/search/medications](#84-get-public-search-medications) — Medicamentos ofertados públicamente
85. [GET /public/search/organizations](#85-get-public-search-organizations) — Organizaciones en el directorio público
86. [GET /public/search/pharmacies](#86-get-public-search-pharmacies) — Farmacias en el directorio público
87. [GET /public/search/practitioners](#87-get-public-search-practitioners) — Profesionales en el directorio público
88. [GET /s/{slug}](#88-get-s-slug) — Ficha pública de una aseguradora

---

## 1. DELETE /community/blocks

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Levantar un bloqueo
- **Operation ID:** `CommunitySocialController_unblock`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.unblock](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Levantar un bloqueo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-14, cara inversa.

### Descripción del sistema

NestJS resuelve `DELETE /community/blocks` en `CommunitySocialController_unblock`. El controlador delega en `CommunitySocialService.unblock`. No recibe body. El tipo de retorno estático es `Promise<SocialRemovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `blockerProfileId` | query | Sí | `string` | formato `uuid` | Perfil que bloqueó | `00000000-0000-4000-8000-000000000001` |
| `blockedProfileId` | query | Sí | `string` | formato `uuid` | Perfil bloqueado | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /community/blocks?blockerProfileId=00000000-0000-4000-8000-000000000001&blockedProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /community/blocks?blockerProfileId=00000000-0000-4000-8000-000000000001&blockedProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SocialRemovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "removed": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `removed` | Sí | `boolean` | Sin restricción adicional declarada | Si esta llamada deshizo el vínculo (falso si ya no existía) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/blocks"
}
```

---

## 2. GET /community/blocks

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Bloqueos emitidos por un perfil
- **Operation ID:** `CommunitySocialController_listBlocks`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.listBlocks](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Bloqueos emitidos por un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bloqueos emitidos por el propio perfil.

### Descripción del sistema

NestJS resuelve `GET /community/blocks` en `CommunitySocialController_listBlocks`. El controlador delega en `CommunitySocialReadService.listBlocks`. No recibe body. El tipo de retorno estático es `Promise<BlockPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/blocks?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/blocks?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BlockPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<BlockPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<BlockPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<BlockPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<BlockPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<BlockPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BlockPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "blockedProfileId": "00000000-0000-4000-8000-000000000001",
      "reasonConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<BlockListItemDto>` | Sin restricción adicional declarada | Bloqueos de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","blockedProfileId":"00000000-0000-4000-8000-000000000001","reasonConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del bloqueo. | `00000000-0000-4000-8000-000000000001` |
| `items[].blockedProfileId` | Sí | `string` | formato `uuid` | Perfil bloqueado. | `00000000-0000-4000-8000-000000000001` |
| `items[].reasonConceptId` | No | `string` | formato `uuid`; admite null | Concept id del motivo declarado. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se bloqueó. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/blocks"
}
```

---

## 3. POST /community/blocks

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Bloquear a un usuario
- **Operation ID:** `CommunitySocialController_block`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.block](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Bloquear a un usuario. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/blocks` en `CommunitySocialController_block`. El controlador delega en `CommunitySocialService.block`. Valida el body como `CreateBlockDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBlockDto`; los campos opcionales se omiten.

```http
POST /community/blocks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "blockerProfileId": "00000000-0000-4000-8000-000000000001",
  "blockedProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `blockerProfileId` | Sí | `string` | formato `uuid` | Perfil que bloquea | `00000000-0000-4000-8000-000000000001` |
| `blockedProfileId` | Sí | `string` | formato `uuid` | Perfil bloqueado | `00000000-0000-4000-8000-000000000001` |
| `reason` | No | `string` | valores: `HARASSMENT`, `SPAM`, `OTHER` | Razón del bloqueo | `HARASSMENT` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/blocks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "blockerProfileId": "00000000-0000-4000-8000-000000000001",
  "blockedProfileId": "00000000-0000-4000-8000-000000000001",
  "reason": "HARASSMENT"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 409 | `CONFLICT` | El usuario ya está bloqueado | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede bloquear a uno mismo | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/blocks"
}
```

---

## 4. DELETE /community/bookmarks

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Quitar un marcador
- **Operation ID:** `CommunitySocialController_unbookmark`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.unbookmark](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Quitar un marcador. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-04, cara inversa.

### Descripción del sistema

NestJS resuelve `DELETE /community/bookmarks` en `CommunitySocialController_unbookmark`. El controlador delega en `CommunitySocialService.unbookmark`. No recibe body. El tipo de retorno estático es `Promise<SocialRemovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | query | Sí | `string` | formato `uuid` | Perfil dueño del marcador | `00000000-0000-4000-8000-000000000001` |
| `bookmarkableType` | query | Sí | `string` | valores: `POST`, `COMMENT`, `REVIEW` | Tipo de objeto | `POST` |
| `bookmarkableRefId` | query | Sí | `string` | formato `uuid` | Id del objeto | `00000000-0000-4000-8000-000000000001` |
| `collectionName` | query | No | `string` | Sin restricción adicional declarada | Colección a la que acotar el borrado | `Nombre de ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /community/bookmarks?profileId=00000000-0000-4000-8000-000000000001&bookmarkableType=POST&bookmarkableRefId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /community/bookmarks?profileId=00000000-0000-4000-8000-000000000001&bookmarkableType=POST&bookmarkableRefId=00000000-0000-4000-8000-000000000001&collectionName=Nombre%20de%20ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SocialRemovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "removed": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `removed` | Sí | `boolean` | Sin restricción adicional declarada | Si esta llamada deshizo el vínculo (falso si ya no existía) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/bookmarks"
}
```

---

## 5. GET /community/bookmarks

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Marcadores guardados por un perfil
- **Operation ID:** `CommunitySocialController_listBookmarks`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.listBookmarks](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Marcadores guardados por un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Marcadores del propio perfil.

### Descripción del sistema

NestJS resuelve `GET /community/bookmarks` en `CommunitySocialController_listBookmarks`. El controlador delega en `CommunitySocialReadService.listBookmarks`. No recibe body. El tipo de retorno estático es `Promise<BookmarkPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `collectionName` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `Nombre de ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/bookmarks?profileId=00000000-0000-4000-8000-000000000001&collectionName=Nombre%20de%20ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/bookmarks?profileId=00000000-0000-4000-8000-000000000001&collectionName=Nombre%20de%20ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BookmarkPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<BookmarkPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<BookmarkPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<BookmarkPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<BookmarkPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<BookmarkPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BookmarkPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "bookmarkableTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "bookmarkableRefId": "00000000-0000-4000-8000-000000000001",
      "collectionName": "Nombre de ejemplo",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<BookmarkListItemDto>` | Sin restricción adicional declarada | Marcadores de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","bookmarkableTypeConceptId":"00000000-0000-4000-8000-000000000001","bookmarkableRefId":"00000000-0000-4000-8000-000000000001","collectionName":"Nombre de ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del marcador. | `00000000-0000-4000-8000-000000000001` |
| `items[].bookmarkableTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de contenido guardado. | `00000000-0000-4000-8000-000000000001` |
| `items[].bookmarkableRefId` | Sí | `string` | formato `uuid` | Id del contenido guardado. | `00000000-0000-4000-8000-000000000001` |
| `items[].collectionName` | No | `string` | admite null | Colección en la que se guardó. | `Nombre de ejemplo` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se guardó. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/bookmarks"
}
```

---

## 6. POST /community/bookmarks

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Guardar un bookmark en una colección
- **Operation ID:** `CommunitySocialController_bookmark`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.bookmark](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Guardar un bookmark en una colección. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/bookmarks` en `CommunitySocialController_bookmark`. El controlador delega en `CommunitySocialService.bookmark`. Valida el body como `CreateBookmarkDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateBookmarkDto`; los campos opcionales se omiten.

```http
POST /community/bookmarks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "bookmarkableType": "POST",
  "bookmarkableRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Perfil que guarda | `00000000-0000-4000-8000-000000000001` |
| `bookmarkableType` | Sí | `string` | valores: `POST`, `COMMENT`, `REVIEW` | Tipo de objeto | `POST` |
| `bookmarkableRefId` | Sí | `string` | formato `uuid` | Id del objeto | `00000000-0000-4000-8000-000000000001` |
| `collectionName` | No | `string` | longitud máxima 120 | Colección a la que se añade | `Nombre de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/bookmarks HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "bookmarkableType": "POST",
  "bookmarkableRefId": "00000000-0000-4000-8000-000000000001",
  "collectionName": "Nombre de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 409 | `CONFLICT` | El contenido ya está guardado | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/bookmarks"
}
```

---

## 7. POST /community/comments

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Comentar (hilo anidado) con contadores
- **Operation ID:** `CommunitySocialController_createComment`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.createComment](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Comentar (hilo anidado) con contadores. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/comments` en `CommunitySocialController_createComment`. El controlador delega en `CommunitySocialService.createComment`. Valida el body como `CreateCommentDto` y consume `application/json`. El tipo de retorno estático es `Promise<CommentResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateCommentDto`; los campos opcionales se omiten.

```http
POST /community/comments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "commentableType": "POST",
  "commentableRefId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `authorProfileId` | Sí | `string` | formato `uuid` | Perfil autor del comentario | `00000000-0000-4000-8000-000000000001` |
| `commentableType` | Sí | `string` | valores: `POST`, `COMMENT`, `REVIEW` | Tipo de contenido comentado | `POST` |
| `commentableRefId` | Sí | `string` | formato `uuid` | Id del contenido comentado | `00000000-0000-4000-8000-000000000001` |
| `parentCommentId` | No | `string` | formato `uuid` | Comentario padre (para respuesta anidada) | `00000000-0000-4000-8000-000000000001` |
| `bodyText` | Sí | `string` | longitud mínima 1; longitud máxima 3000 | Texto del comentario | `valor-ejemplo` |
| `mentions` | No | `array<MentionInputDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"mentionedProfileId":"00000000-0000-4000-8000-000000000001","offsetStart":1,"offsetEnd":1}]` |
| `mentions[].mentionedProfileId` | No | `string` | formato `uuid` | Perfil mencionado | `00000000-0000-4000-8000-000000000001` |
| `mentions[].offsetStart` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `mentions[].offsetEnd` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `media` | No | `array<CommentMediaInputDto>` | máximo 4 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"fileId":"00000000-0000-4000-8000-000000000001","mediaRole":"IMAGE","altText":"valor-ejemplo","ordinal":1}]` |
| `media[].fileId` | No | `string` | formato `uuid` | Id del archivo (common.files) | `00000000-0000-4000-8000-000000000001` |
| `media[].mediaRole` | No | `string` | valores: `IMAGE`, `STICKER`, `GIF` | Rol del medio | `IMAGE` |
| `media[].altText` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `media[].ordinal` | No | `number` | mínimo 0 | Orden de despliegue | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/comments HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<CommentResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<CommentResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CommentResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "rootCommentId": "00000000-0000-4000-8000-000000000001",
  "threadDepth": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `rootCommentId` | Sí | `string` | formato `uuid`; admite null | Identificador asociado a root comment. | `00000000-0000-4000-8000-000000000001` |
| `threadDepth` | Sí | `number` | Sin restricción adicional declarada | Valor de thread depth mantenido por la instancia. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Perfil autor no encontrado | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 404 | `NOT_FOUND` | Comentario padre no encontrado | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/comments"
}
```

---

## 8. GET /community/comments/media/{fileId}/content

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Descargar el adjunto de un comentario (imagen, sticker o GIF)
- **Operation ID:** `CommunitySocialController_getCommentMediaContent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.getCommentMediaContent](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Descargar el adjunto de un comentario (imagen, sticker o GIF). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: FND-01: el contenido de un adjunto de comentario, para quien tiene sesión y puede ver el post del que cuelga — no sólo para quien lo subió. Declarada con un segmento fijo (`media`) antes que nada bajo `comments/` capture `:id`: hoy no hay otra ruta `comments/:algo` en este controlador, pero es la misma cautela que ya deja escrita `listLinks` en `CommonFilesController` para `links` contra `:id/content`.

### Descripción del sistema

NestJS resuelve `GET /community/comments/media/{fileId}/content` en `CommunitySocialController_getCommentMediaContent`. El controlador delega en `CommunitySocialReadService.getCommentMedia`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `fileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/comments/media/00000000-0000-4000-8000-000000000001/content?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `fileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/comments/media/00000000-0000-4000-8000-000000000001/content?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<void>` | No |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | Consulta completada correctamente. | `Promise<void>` | No |
| 404 | Consulta completada correctamente. | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | Publicación no encontrada | Excepción explícita en src/modules/community/services/community-social-read.service.ts |
| 404 | `NOT_FOUND` | Versión vigente no encontrada | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo está borrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo no tiene una versión vigente | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión vigente todavía no está lista para servirse públicamente | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/comments/media/{fileId}/content"
}
```

---

## 9. GET /community/conversations

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Conversaciones activas de un perfil
- **Operation ID:** `CommunityMessagingController_listConversations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.listConversations](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Conversaciones activas de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bandeja del propio perfil, con vista previa y no leídos. F4.3: acepta `cursor` (el `nextCursor` de la página anterior) y `q` (nombre del otro lado o texto del último mensaje).

### Descripción del sistema

NestJS resuelve `GET /community/conversations` en `CommunityMessagingController_listConversations`. El controlador delega en `CommunityMessagingReadService.listConversations`. No recibe body. El tipo de retorno estático es `Promise<ConversationPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/conversations?profileId=00000000-0000-4000-8000-000000000001&limit=1&cursor=valor-ejemplo&q=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/conversations?profileId=00000000-0000-4000-8000-000000000001&limit=1&cursor=valor-ejemplo&q=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConversationPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ConversationPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ConversationPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ConversationPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ConversationPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ConversationPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConversationPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "conversationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "groupId": "00000000-0000-4000-8000-000000000001",
      "lastMessageAt": "2026-07-31T12:00:00.000Z",
      "messageCount": 1,
      "lastMessage": {
        "id": "00000000-0000-4000-8000-000000000001",
        "senderProfileId": "00000000-0000-4000-8000-000000000001",
        "bodyText": "valor-ejemplo",
        "contentTypeConceptId": "00000000-0000-4000-8000-000000000001",
        "attachmentFileId": "00000000-0000-4000-8000-000000000001",
        "deletedAt": "2026-07-31T12:00:00.000Z",
        "sentAt": "2026-07-31T12:00:00.000Z"
      },
      "unreadCount": 1,
      "lastMessageReadByPeer": true,
      "isFavorite": true,
      "isPinned": true,
      "archivedAt": "2026-07-31T12:00:00.000Z",
      "pinnedMessageId": "00000000-0000-4000-8000-000000000001",
      "peers": [
        {
          "profileId": "00000000-0000-4000-8000-000000000001",
          "displayName": "Nombre de ejemplo",
          "avatarUrl": "valor-ejemplo"
        }
      ]
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ConversationListItemDto>` | Sin restricción adicional declarada | Conversaciones de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","conversationTypeConceptId":"00000000-0000-4000-8000-000000000001","groupId":"00000000-0000-4000-8000-000000000001","lastMessageAt":"2026-07-31T12:00:00.000Z","messageCount":1,"lastMessage":{"id":"00000000-0000-4000-8000-000000000001","senderProfileId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","contentTypeConceptId":"00000000-0000-4000-8000-000000000001","attachmentFileId":"00000000-0000-4000-8000-000000000001","deletedAt":"2026-07-31T12:00:00.000Z","sentAt":"2026-07-31T12:00:00.000Z"},"unreadCount":1,"lastMessageReadByPeer":true,"isFavorite":true,"isPinned":true,"archivedAt":"2026-07-31T12:00:00.000Z","pinnedMessageId":"00000000-0000-4000-8000-000000000001","peers":[{"profileId":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","avatarUrl":"valor-ejemplo"}]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la conversación. | `00000000-0000-4000-8000-000000000001` |
| `items[].conversationTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de conversación (directa, grupal). | `00000000-0000-4000-8000-000000000001` |
| `items[].groupId` | No | `string` | formato `uuid`; admite null | Grupo al que pertenece, si es de grupo. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessageAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió el último mensaje. | `2026-07-31T12:00:00.000Z` |
| `items[].messageCount` | No | `number` | admite null | Cuántos mensajes acumula. | `1` |
| `items[].lastMessage` | No | `ConversationPreviewMessageDto` | Sin restricción adicional declarada | Vista previa del último mensaje. | `{"id":"00000000-0000-4000-8000-000000000001","senderProfileId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","contentTypeConceptId":"00000000-0000-4000-8000-000000000001","attachmentFileId":"00000000-0000-4000-8000-000000000001","deletedAt":"2026-07-31T12:00:00.000Z","sentAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].lastMessage.id` | No | `string` | formato `uuid` | Identificador del mensaje. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessage.senderProfileId` | No | `string` | formato `uuid` | Perfil que lo envió. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessage.bodyText` | No | `string` | admite null | Cuerpo del mensaje; `null` si era sólo un adjunto o si se eliminó. | `valor-ejemplo` |
| `items[].lastMessage.contentTypeConceptId` | No | `string` | formato `uuid`; admite null | Concept id del tipo de contenido (texto o media). F4.3: con esto la fila de la bandeja dice «Foto» o «Documento» sin adivinarlo por el cuerpo vacío. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessage.attachmentFileId` | No | `string` | formato `uuid`; admite null | Adjunto en `common.files`, si el último mensaje era uno. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessage.deletedAt` | No | `string` | formato `date-time`; admite null | Cuándo se eliminó, si el último mensaje está eliminado (F4.5). | `2026-07-31T12:00:00.000Z` |
| `items[].lastMessage.sentAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió. | `2026-07-31T12:00:00.000Z` |
| `items[].unreadCount` | Sí | `number` | Sin restricción adicional declarada | Cuántos mensajes le quedan sin leer al actor. | `1` |
| `items[].lastMessageReadByPeer` | No | `boolean` | admite null | Si el otro lado ya leyó el último mensaje, cuando ese mensaje es del actor y la conversación es directa. `null` si no se sabe (grupo, o el último no es propio). Con esto la bandeja pinta el doble tilde sin mentir (F4.3). | `true` |
| `items[].isFavorite` | Sí | `boolean` | Sin restricción adicional declarada | Favorita para el actor (F4.4). | `true` |
| `items[].isPinned` | Sí | `boolean` | Sin restricción adicional declarada | Fijada arriba de la bandeja del actor (F4.4). Las fijadas van primero. | `true` |
| `items[].archivedAt` | No | `string` | formato `date-time`; admite null | Desde cuándo la archivó el actor; `null` si no está archivada (F4.4). | `2026-07-31T12:00:00.000Z` |
| `items[].pinnedMessageId` | No | `string` | formato `uuid`; admite null | El mensaje fijado en la barra superior, si hay uno (F4.6). | `00000000-0000-4000-8000-000000000001` |
| `items[].peers` | Sí | `array<ConversationPeerDto>` | Sin restricción adicional declarada | Los demás participantes, sin el propio. Sin el propio porque la bandeja se lee desde un lado: incluirse a uno mismo obligaría a cada pantalla a filtrarse, y la que se olvide muestra «Conversación con vos». | `[{"profileId":"00000000-0000-4000-8000-000000000001","displayName":"Nombre de ejemplo","avatarUrl":"valor-ejemplo"}]` |
| `items[].peers[].profileId` | Sí | `string` | formato `uuid` | Perfil público del participante. | `00000000-0000-4000-8000-000000000001` |
| `items[].peers[].displayName` | No | `string` | admite null | Cómo se llama, para poder pintar la fila. | `Nombre de ejemplo` |
| `items[].peers[].avatarUrl` | No | `string` | admite null | Su avatar público, o `null` si no subió ninguno. Misma regla que la ficha pública. | `valor-ejemplo` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null` si no hay más (F4.3). Se pagina sobre el orden de la bandeja —fijadas primero, después por último mensaje— y dentro del mismo recorte que aplique `q`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations"
}
```

---

## 10. POST /community/conversations

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Crear una conversación con participantes
- **Operation ID:** `CommunityMessagingController_createConversation`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.createConversation](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Crear una conversación con participantes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bootstrap: crea una conversación con participantes.

### Descripción del sistema

NestJS resuelve `POST /community/conversations` en `CommunityMessagingController_createConversation`. El controlador delega en `CommunityMessagingService.createConversation`. Valida el body como `CreateConversationDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateConversationDto`; los campos opcionales se omiten.

```http
POST /community/conversations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "participantProfileIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `participantProfileIds` | Sí | `array<string>` | formato `uuid`; mínimo 2 elemento(s) | Perfiles participantes | `["valor-ejemplo","valor-ejemplo"]` |
| `conversationType` | No | `string` | valores: `DIRECT`, `GROUP` | Tipo de conversación | `DIRECT` |
| `groupId` | No | `string` | formato `uuid` | Grupo asociado (conversaciones de grupo) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/conversations HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "participantProfileIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ],
  "conversationType": "DIRECT",
  "groupId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations"
}
```

---

## 11. GET /community/conversations/{conversationId}/attachments/{fileId}/content

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Descargar el adjunto de una conversación (participante activo)
- **Operation ID:** `CommunityMessagingController_getAttachmentContent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.getAttachmentContent](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Descargar el adjunto de una conversación (participante activo). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: 5.1 · FT-32-R02: el contenido de un adjunto de la conversación, para quien participa en ella — no sólo para quien lo subió. La conversación forma parte de la ruta: ni conocer el archivo ni conocer una conversación por separado permite mezclar ambos contextos. `no-store` como en toda descarga autenticada: la caché del navegador no debe conservar un adjunto clínico después de cerrar sesión.

### Descripción del sistema

NestJS resuelve `GET /community/conversations/{conversationId}/attachments/{fileId}/content` en `CommunityMessagingController_getAttachmentContent`. El controlador delega en `CommunityMessagingReadService.getAttachmentContent`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `fileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/conversations/00000000-0000-4000-8000-000000000001/attachments/00000000-0000-4000-8000-000000000001/content?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`, `fileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/conversations/00000000-0000-4000-8000-000000000001/attachments/00000000-0000-4000-8000-000000000001/content?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<void>` | No |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | Consulta completada correctamente. | `Promise<void>` | No |
| 404 | Consulta completada correctamente. | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging-read.service.ts |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/attachments/{fileId}/content"
}
```

---

## 12. GET /community/conversations/{conversationId}/messages

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Mensajes de una conversación
- **Operation ID:** `CommunityMessagingController_listMessages`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.listMessages](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Mensajes de una conversación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Mensajes de una conversación en la que se participa.

### Descripción del sistema

NestJS resuelve `GET /community/conversations/{conversationId}/messages` en `CommunityMessagingController_listMessages`. El controlador delega en `CommunityMessagingReadService.listMessages`. No recibe body. El tipo de retorno estático es `Promise<DirectMessagePageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/conversations/00000000-0000-4000-8000-000000000001/messages?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/conversations/00000000-0000-4000-8000-000000000001/messages?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DirectMessagePageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<DirectMessagePageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<DirectMessagePageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<DirectMessagePageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<DirectMessagePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<DirectMessagePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<DirectMessagePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DirectMessagePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "conversationId": "00000000-0000-4000-8000-000000000001",
      "senderProfileId": "00000000-0000-4000-8000-000000000001",
      "replyToMessageId": "00000000-0000-4000-8000-000000000001",
      "contentTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "attachmentFileId": "00000000-0000-4000-8000-000000000001",
      "isEdited": true,
      "deletedAt": "2026-07-31T12:00:00.000Z",
      "sentAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo",
  "peerReadUpTo": "2026-07-31T12:00:00.000Z",
  "pinnedMessage": {
    "id": "00000000-0000-4000-8000-000000000001",
    "conversationId": "00000000-0000-4000-8000-000000000001",
    "senderProfileId": "00000000-0000-4000-8000-000000000001",
    "replyToMessageId": "00000000-0000-4000-8000-000000000001",
    "contentTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "bodyText": "valor-ejemplo",
    "attachmentFileId": "00000000-0000-4000-8000-000000000001",
    "isEdited": true,
    "deletedAt": "2026-07-31T12:00:00.000Z",
    "sentAt": "2026-07-31T12:00:00.000Z"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<DirectMessageDto>` | Sin restricción adicional declarada | Mensajes de la página, del más reciente al más antiguo. | `[{"id":"00000000-0000-4000-8000-000000000001","conversationId":"00000000-0000-4000-8000-000000000001","senderProfileId":"00000000-0000-4000-8000-000000000001","replyToMessageId":"00000000-0000-4000-8000-000000000001","contentTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","attachmentFileId":"00000000-0000-4000-8000-000000000001","isEdited":true,"deletedAt":"2026-07-31T12:00:00.000Z","sentAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del mensaje. | `00000000-0000-4000-8000-000000000001` |
| `items[].conversationId` | Sí | `string` | formato `uuid` | Conversación a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `items[].senderProfileId` | Sí | `string` | formato `uuid` | Perfil que lo envió. | `00000000-0000-4000-8000-000000000001` |
| `items[].replyToMessageId` | No | `string` | formato `uuid`; admite null | Mensaje al que responde, si responde a alguno. | `00000000-0000-4000-8000-000000000001` |
| `items[].contentTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de contenido. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodyText` | No | `string` | admite null | Cuerpo del mensaje. | `valor-ejemplo` |
| `items[].attachmentFileId` | No | `string` | formato `uuid`; admite null | Adjunto en `common.files`. | `00000000-0000-4000-8000-000000000001` |
| `items[].isEdited` | No | `boolean` | admite null | Si fue editado (F4.5). | `true` |
| `items[].deletedAt` | No | `string` | formato `date-time`; admite null | Cuándo se eliminó (F4.5). Un mensaje eliminado **sigue viajando** —con `bodyText` y `attachmentFileId` en `null`— para que el hilo muestre «Se eliminó este mensaje» en su lugar y no un hueco que descoloca las citas. | `2026-07-31T12:00:00.000Z` |
| `items[].sentAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |
| `peerReadUpTo` | No | `string` | formato `date-time`; admite null | Hasta qué `sentAt` leyó el otro lado, en una conversación DIRECT. `null` si es de grupo (no hay "el otro lado") o si el peer no marcó nada todavía como leído. Con esto el frente pinta ✓✓ en los mensajes propios cuyo `sentAt` sea anterior o igual a esta marca. | `2026-07-31T12:00:00.000Z` |
| `pinnedMessage` | No | `DirectMessageDto` | Sin restricción adicional declarada | El mensaje fijado en la conversación, completo, o `null` (F4.6). Viaja con la primera página para que la barra superior se pinte sin otra llamada, aunque el mensaje sea de hace meses y no esté en la página. | `{"id":"00000000-0000-4000-8000-000000000001","conversationId":"00000000-0000-4000-8000-000000000001","senderProfileId":"00000000-0000-4000-8000-000000000001","replyToMessageId":"00000000-0000-4000-8000-000000000001","contentTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","attachmentFileId":"00000000-0000-4000-8000-000000000001","isEdited":true,"deletedAt":"2026-07-31T12:00:00.000Z","sentAt":"2026-07-31T12:00:00.000Z"}` |
| `pinnedMessage.id` | No | `string` | formato `uuid` | Identificador del mensaje. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessage.conversationId` | No | `string` | formato `uuid` | Conversación a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessage.senderProfileId` | No | `string` | formato `uuid` | Perfil que lo envió. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessage.replyToMessageId` | No | `string` | formato `uuid`; admite null | Mensaje al que responde, si responde a alguno. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessage.contentTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de contenido. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessage.bodyText` | No | `string` | admite null | Cuerpo del mensaje. | `valor-ejemplo` |
| `pinnedMessage.attachmentFileId` | No | `string` | formato `uuid`; admite null | Adjunto en `common.files`. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessage.isEdited` | No | `boolean` | admite null | Si fue editado (F4.5). | `true` |
| `pinnedMessage.deletedAt` | No | `string` | formato `date-time`; admite null | Cuándo se eliminó (F4.5). Un mensaje eliminado **sigue viajando** —con `bodyText` y `attachmentFileId` en `null`— para que el hilo muestre «Se eliminó este mensaje» en su lugar y no un hueco que descoloca las citas. | `2026-07-31T12:00:00.000Z` |
| `pinnedMessage.sentAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/messages"
}
```

---

## 13. POST /community/conversations/{conversationId}/messages

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Enviar un mensaje directo en la conversación
- **Operation ID:** `CommunityMessagingController_sendMessage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.sendMessage](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Enviar un mensaje directo en la conversación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/conversations/{conversationId}/messages` en `CommunityMessagingController_sendMessage`. El controlador delega en `CommunityMessagingService.sendMessage`. Valida el body como `SendMessageDto` y consume `application/json`. El tipo de retorno estático es `Promise<MessageResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SendMessageDto`; los campos opcionales se omiten.

```http
POST /community/conversations/00000000-0000-4000-8000-000000000001/messages HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "senderProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `senderProfileId` | Sí | `string` | formato `uuid` | Perfil remitente (participante activo) | `00000000-0000-4000-8000-000000000001` |
| `bodyText` | No | `string` | longitud mínima 1; longitud máxima 4000 | Texto del mensaje | `valor-ejemplo` |
| `contentType` | No | `string` | valores: `TEXT`, `MEDIA` | Tipo de contenido | `TEXT` |
| `replyToMessageId` | No | `string` | formato `uuid` | Mensaje al que responde | `00000000-0000-4000-8000-000000000001` |
| `attachmentFileId` | No | `string` | formato `uuid` | Archivo adjunto (common.files) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/conversations/00000000-0000-4000-8000-000000000001/messages HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "senderProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo",
  "contentType": "TEXT",
  "replyToMessageId": "00000000-0000-4000-8000-000000000001",
  "attachmentFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<MessageResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<MessageResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MessageResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "sentAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `conversationId` | Sí | `string` | formato `uuid` | Identificador asociado a conversation. | `00000000-0000-4000-8000-000000000001` |
| `sentAt` | Sí | `string` | formato `date-time` | Valor de sent at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 404 | `NOT_FOUND` | Archivo adjunto no encontrado | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | El proveedor configurado para el canal in-app no existe | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El remitente no es participante activo | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | Existe un bloqueo entre los participantes | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | No se puede adjuntar un archivo sin un actor que lo autorice | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | No hay canal in-app activo: falta correr el seed de mensajería | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal in-app no tiene configuración de proveedor activa | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/messages"
}
```

---

## 14. DELETE /community/conversations/{conversationId}/messages/{messageId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Eliminar un mensaje propio
- **Operation ID:** `CommunityMessagingController_deleteMessage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.deleteMessage](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Eliminar un mensaje propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.5 · Eliminar un mensaje propio (lógico: queda «Se eliminó este mensaje»).

### Descripción del sistema

NestJS resuelve `DELETE /community/conversations/{conversationId}/messages/{messageId}` en `CommunityMessagingController_deleteMessage`. El controlador delega en `CommunityMessagingService.deleteMessage`. No recibe body. El tipo de retorno estático es `Promise<DeletedMessageResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `messageId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /community/conversations/00000000-0000-4000-8000-000000000001/messages/00000000-0000-4000-8000-000000000001?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`, `messageId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /community/conversations/00000000-0000-4000-8000-000000000001/messages/00000000-0000-4000-8000-000000000001?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeletedMessageResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeletedMessageResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "messageId": "00000000-0000-4000-8000-000000000001",
  "deletedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversationId` | Sí | `string` | formato `uuid` | Conversación. | `00000000-0000-4000-8000-000000000001` |
| `messageId` | Sí | `string` | formato `uuid` | El mensaje eliminado. | `00000000-0000-4000-8000-000000000001` |
| `deletedAt` | Sí | `string` | formato `date-time` | Cuándo. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 404 | `NOT_FOUND` | Mensaje no encontrado | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | Sólo el autor puede editar o eliminar su mensaje | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El mensaje ya fue eliminado | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/messages/{messageId}"
}
```

---

## 15. PATCH /community/conversations/{conversationId}/messages/{messageId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Editar el texto de un mensaje propio
- **Operation ID:** `CommunityMessagingController_editMessage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.editMessage](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Editar el texto de un mensaje propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.5 · Editar el texto de un mensaje propio.

### Descripción del sistema

NestJS resuelve `PATCH /community/conversations/{conversationId}/messages/{messageId}` en `CommunityMessagingController_editMessage`. El controlador delega en `CommunityMessagingService.editMessage`. Valida el body como `EditMessageDto` y consume `application/json`. El tipo de retorno estático es `Promise<DirectMessageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `messageId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `EditMessageDto`; los campos opcionales se omiten.

```http
PATCH /community/conversations/00000000-0000-4000-8000-000000000001/messages/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "senderProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`, `messageId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `senderProfileId` | Sí | `string` | formato `uuid` | Perfil autor del mensaje | `00000000-0000-4000-8000-000000000001` |
| `bodyText` | Sí | `string` | longitud mínima 1; longitud máxima 4000 | Texto nuevo del mensaje | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /community/conversations/00000000-0000-4000-8000-000000000001/messages/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "senderProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DirectMessageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DirectMessageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "senderProfileId": "00000000-0000-4000-8000-000000000001",
  "replyToMessageId": "00000000-0000-4000-8000-000000000001",
  "contentTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo",
  "attachmentFileId": "00000000-0000-4000-8000-000000000001",
  "isEdited": true,
  "deletedAt": "2026-07-31T12:00:00.000Z",
  "sentAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del mensaje. | `00000000-0000-4000-8000-000000000001` |
| `conversationId` | Sí | `string` | formato `uuid` | Conversación a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `senderProfileId` | Sí | `string` | formato `uuid` | Perfil que lo envió. | `00000000-0000-4000-8000-000000000001` |
| `replyToMessageId` | No | `string` | formato `uuid`; admite null | Mensaje al que responde, si responde a alguno. | `00000000-0000-4000-8000-000000000001` |
| `contentTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de contenido. | `00000000-0000-4000-8000-000000000001` |
| `bodyText` | No | `string` | admite null | Cuerpo del mensaje. | `valor-ejemplo` |
| `attachmentFileId` | No | `string` | formato `uuid`; admite null | Adjunto en `common.files`. | `00000000-0000-4000-8000-000000000001` |
| `isEdited` | No | `boolean` | admite null | Si fue editado (F4.5). | `true` |
| `deletedAt` | No | `string` | formato `date-time`; admite null | Cuándo se eliminó (F4.5). Un mensaje eliminado **sigue viajando** —con `bodyText` y `attachmentFileId` en `null`— para que el hilo muestre «Se eliminó este mensaje» en su lugar y no un hueco que descoloca las citas. | `2026-07-31T12:00:00.000Z` |
| `sentAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 404 | `NOT_FOUND` | Mensaje no encontrado | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Sólo el autor puede editar o eliminar su mensaje | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El mensaje ya fue eliminado | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | El mensaje no tiene marca de envío: no se puede editar | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | Pasaron más de 5 minutos: el mensaje ya no se puede editar | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/messages/{messageId}"
}
```

---

## 16. PATCH /community/conversations/{conversationId}/participant

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Marcar la conversación como favorita, fijada o archivada
- **Operation ID:** `CommunityMessagingController_updateParticipant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.updateParticipant](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Marcar la conversación como favorita, fijada o archivada. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.4 · Favorita, fijada o archivada, de mi lado.

### Descripción del sistema

NestJS resuelve `PATCH /community/conversations/{conversationId}/participant` en `CommunityMessagingController_updateParticipant`. El controlador delega en `CommunityMessagingService.updateParticipant`. Valida el body como `UpdateParticipantDto` y consume `application/json`. El tipo de retorno estático es `Promise<ParticipantPreferencesDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateParticipantDto`; los campos opcionales se omiten.

```http
PATCH /community/conversations/00000000-0000-4000-8000-000000000001/participant HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "profileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Perfil que marca | `00000000-0000-4000-8000-000000000001` |
| `isFavorite` | No | `boolean` | Sin restricción adicional declarada | Favorita | `true` |
| `isPinned` | No | `boolean` | Sin restricción adicional declarada | Fijada arriba de la bandeja | `true` |
| `archived` | No | `boolean` | Sin restricción adicional declarada | Archivada | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /community/conversations/00000000-0000-4000-8000-000000000001/participant HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "isFavorite": true,
  "isPinned": true,
  "archived": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ParticipantPreferencesDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ParticipantPreferencesDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "isFavorite": true,
  "isPinned": true,
  "archivedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversationId` | Sí | `string` | formato `uuid` | Conversación. | `00000000-0000-4000-8000-000000000001` |
| `isFavorite` | Sí | `boolean` | Sin restricción adicional declarada | Favorita para este participante. | `true` |
| `isPinned` | Sí | `boolean` | Sin restricción adicional declarada | Fijada arriba de la bandeja de este participante. | `true` |
| `archivedAt` | No | `string` | formato `date-time`; admite null | Desde cuándo está archivada; `null` si no lo está. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/participant"
}
```

---

## 17. DELETE /community/conversations/{conversationId}/pin

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Soltar el mensaje fijado de la conversación
- **Operation ID:** `CommunityMessagingController_unpinMessage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.unpinMessage](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Soltar el mensaje fijado de la conversación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.6 · Soltar el mensaje fijado.

### Descripción del sistema

NestJS resuelve `DELETE /community/conversations/{conversationId}/pin` en `CommunityMessagingController_unpinMessage`. El controlador delega en `CommunityMessagingService.unpinMessage`. No recibe body. El tipo de retorno estático es `Promise<PinnedMessageResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /community/conversations/00000000-0000-4000-8000-000000000001/pin?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /community/conversations/00000000-0000-4000-8000-000000000001/pin?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PinnedMessageResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "pinnedMessageId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversationId` | Sí | `string` | formato `uuid` | Conversación. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessageId` | No | `string` | formato `uuid`; admite null | El mensaje fijado, o `null` si se soltó. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/pin"
}
```

---

## 18. POST /community/conversations/{conversationId}/pin

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Fijar un mensaje de la conversación
- **Operation ID:** `CommunityMessagingController_pinMessage`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.pinMessage](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Fijar un mensaje de la conversación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.6 · Fijar un mensaje en la barra superior del hilo.

### Descripción del sistema

NestJS resuelve `POST /community/conversations/{conversationId}/pin` en `CommunityMessagingController_pinMessage`. El controlador delega en `CommunityMessagingService.pinMessage`. Valida el body como `PinMessageDto` y consume `application/json`. El tipo de retorno estático es `Promise<PinnedMessageResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `PinMessageDto`; los campos opcionales se omiten.

```http
POST /community/conversations/00000000-0000-4000-8000-000000000001/pin HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "messageId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `profileId` | Sí | `string` | formato `uuid` | Perfil que fija | `00000000-0000-4000-8000-000000000001` |
| `messageId` | Sí | `string` | formato `uuid` | Mensaje a fijar | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/conversations/00000000-0000-4000-8000-000000000001/pin HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "profileId": "00000000-0000-4000-8000-000000000001",
  "messageId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PinnedMessageResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PinnedMessageResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "pinnedMessageId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversationId` | Sí | `string` | formato `uuid` | Conversación. | `00000000-0000-4000-8000-000000000001` |
| `pinnedMessageId` | No | `string` | formato `uuid`; admite null | El mensaje fijado, o `null` si se soltó. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 404 | `NOT_FOUND` | Mensaje no encontrado | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/pin"
}
```

---

## 19. GET /community/conversations/{conversationId}/presence

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Presencia de los demás participantes
- **Operation ID:** `CommunityMessagingController_conversationPresence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.conversationPresence](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Presencia de los demás participantes. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.2 · Quién de los otros está en línea, y si no, cuándo se lo vio.

### Descripción del sistema

NestJS resuelve `GET /community/conversations/{conversationId}/presence` en `CommunityMessagingController_conversationPresence`. El controlador delega en `CommunityMessagingReadService.conversationPresence`. No recibe body. El tipo de retorno estático es `Promise<ConversationPresenceDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/conversations/00000000-0000-4000-8000-000000000001/presence?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/conversations/00000000-0000-4000-8000-000000000001/presence?profileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ConversationPresenceDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ConversationPresenceDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ConversationPresenceDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ConversationPresenceDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ConversationPresenceDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ConversationPresenceDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ConversationPresenceDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ConversationPresenceDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "conversationId": "00000000-0000-4000-8000-000000000001",
  "peers": [
    {
      "profileId": "00000000-0000-4000-8000-000000000001",
      "online": true,
      "lastSeenAt": "2026-07-31T12:00:00.000Z"
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `conversationId` | Sí | `string` | formato `uuid` | Conversación consultada. | `00000000-0000-4000-8000-000000000001` |
| `peers` | Sí | `array<ProfilePresenceDto>` | Sin restricción adicional declarada | Los otros participantes, sin el propio. | `[{"profileId":"00000000-0000-4000-8000-000000000001","online":true,"lastSeenAt":"2026-07-31T12:00:00.000Z"}]` |
| `peers[].profileId` | Sí | `string` | formato `uuid` | Perfil público. | `00000000-0000-4000-8000-000000000001` |
| `peers[].online` | Sí | `boolean` | Sin restricción adicional declarada | `true` si tiene la mensajería abierta ahora mismo. | `true` |
| `peers[].lastSeenAt` | No | `string` | formato `date-time`; admite null | Última vez que se lo vio conectado; `null` si nunca, o si la presencia no está disponible (Redis caído: se responde «no se sabe», no un 500). | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/presence"
}
```

---

## 20. POST /community/conversations/{conversationId}/read

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Marcar mensajes como leídos (recibos)
- **Operation ID:** `CommunityMessagingController_markRead`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.markRead](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Marcar mensajes como leídos (recibos). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/conversations/{conversationId}/read` en `CommunityMessagingController_markRead`. El controlador delega en `CommunityMessagingService.markRead`. Valida el body como `MarkReadDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReadReceiptResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `conversationId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `MarkReadDto`; los campos opcionales se omiten.

```http
POST /community/conversations/00000000-0000-4000-8000-000000000001/read HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "recipientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `conversationId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `recipientProfileId` | Sí | `string` | formato `uuid` | Perfil que marca como leído | `00000000-0000-4000-8000-000000000001` |
| `upToMessageId` | No | `string` | formato `uuid` | Último mensaje leído (por defecto el más reciente) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/conversations/00000000-0000-4000-8000-000000000001/read HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "recipientProfileId": "00000000-0000-4000-8000-000000000001",
  "upToMessageId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReadReceiptResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReadReceiptResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "receiptsRecorded": 1,
  "lastReadMessageId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `receiptsRecorded` | Sí | `number` | Sin restricción adicional declarada | Nº de recibos de lectura registrados | `1` |
| `lastReadMessageId` | Sí | `string` | formato `uuid`; admite null | Identificador asociado a last read message. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El perfil no es participante activo | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/conversations/{conversationId}/read"
}
```

---

## 21. GET /community/feed

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-timeline`
- **Nombre:** Timeline de un perfil
- **Operation ID:** `CommunityTimelineController_getFeed`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityTimelineController.getFeed](../../src/modules/community/controllers/community-timeline.controller.ts)

### Descripción de negocio

Timeline de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-13 (cara de lectura). Timeline del propio perfil.

### Descripción del sistema

NestJS resuelve `GET /community/feed` en `CommunityTimelineController_getFeed`. El controlador delega en `CommunityTimelineReadService.getFeed`. No recibe body. El tipo de retorno estático es `Promise<FeedPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/feed?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/feed?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FeedPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<FeedPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<FeedPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<FeedPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<FeedPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<FeedPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FeedPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "itemTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "sourceRefId": "00000000-0000-4000-8000-000000000001",
      "originConceptId": "00000000-0000-4000-8000-000000000001",
      "rankScore": "valor-ejemplo",
      "isSeen": true,
      "createdAt": "2026-07-31T12:00:00.000Z",
      "post": {
        "id": "00000000-0000-4000-8000-000000000001",
        "authorPublicProfileId": "00000000-0000-4000-8000-000000000001",
        "postTypeConceptId": "00000000-0000-4000-8000-000000000001",
        "bodyText": "valor-ejemplo",
        "visibilityConceptId": "00000000-0000-4000-8000-000000000001",
        "commentsEnabled": true,
        "publishedAt": "2026-07-31T12:00:00.000Z",
        "editedAt": "2026-07-31T12:00:00.000Z",
        "reactions": {
          "tallies": [
            {
              "reactionTypeConceptId": "00000000-0000-4000-8000-000000000001",
              "reactionType": "valor-ejemplo",
              "count": 1
            }
          ],
          "total": 1,
          "actorReactionTypeConceptId": "00000000-0000-4000-8000-000000000001",
          "actorReactionType": "valor-ejemplo"
        },
        "commentCount": 1
      }
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<FeedListItemDto>` | Sin restricción adicional declarada | Entradas de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","itemTypeConceptId":"00000000-0000-4000-8000-000000000001","sourceTypeConceptId":"00000000-0000-4000-8000-000000000001","sourceRefId":"00000000-0000-4000-8000-000000000001","originConceptId":"00000000-0000-4000-8000-000000000001","rankScore":"valor-ejemplo","isSeen":true,"createdAt":"2026-07-31T12:00:00.000Z","post":{"id":"00000000-0000-4000-8000-000000000001","authorPublicProfileId":"00000000-0000-4000-8000-000000000001","postTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","visibilityConceptId":"00000000-0000-4000-8000-000000000001","commentsEnabled":true,"publishedAt":"2026-07-31T12:00:00.000Z","editedAt":"2026-07-31T12:00:00.000Z","reactions":{"tallies":[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}],"total":1,"actorReactionTypeConceptId":"00000000-0000-4000-8000-000000000001","actorReactionType":"valor-ejemplo"},"commentCount":1}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la entrada. | `00000000-0000-4000-8000-000000000001` |
| `items[].itemTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de entrada. | `00000000-0000-4000-8000-000000000001` |
| `items[].sourceTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de fuente. | `00000000-0000-4000-8000-000000000001` |
| `items[].sourceRefId` | Sí | `string` | formato `uuid` | Id de la fuente (hoy, la publicación). | `00000000-0000-4000-8000-000000000001` |
| `items[].originConceptId` | Sí | `string` | formato `uuid` | Concept id del origen (seguidos, grupo, sugerido…). | `00000000-0000-4000-8000-000000000001` |
| `items[].rankScore` | No | `string` | admite null | Puntaje de orden (numeric como texto) | `valor-ejemplo` |
| `items[].isSeen` | No | `boolean` | admite null | Si ya se mostró. | `true` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo entró al timeline. | `2026-07-31T12:00:00.000Z` |
| `items[].post` | No | `PostListItemDto` | Sin restricción adicional declarada | La publicación de la entrada, si sigue visible para el lector. Nula cuando la fuente ya no es legible —se retiró, o el autor y el lector se bloquearon después del fan-out—. La entrada igual viaja para que el cliente pueda mostrar el hueco en vez de saltear filas y descuadrar el conteo de la página. | `{"id":"00000000-0000-4000-8000-000000000001","authorPublicProfileId":"00000000-0000-4000-8000-000000000001","postTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","visibilityConceptId":"00000000-0000-4000-8000-000000000001","commentsEnabled":true,"publishedAt":"2026-07-31T12:00:00.000Z","editedAt":"2026-07-31T12:00:00.000Z","reactions":{"tallies":[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}],"total":1,"actorReactionTypeConceptId":"00000000-0000-4000-8000-000000000001","actorReactionType":"valor-ejemplo"},"commentCount":1}` |
| `items[].post.id` | No | `string` | formato `uuid` | Identificador de la publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.authorPublicProfileId` | No | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.postTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.bodyText` | No | `string` | Sin restricción adicional declarada | Cuerpo del texto. | `valor-ejemplo` |
| `items[].post.visibilityConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la visibilidad declarada; nulo se lee como pública. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.commentsEnabled` | No | `boolean` | admite null | Si admite comentarios. | `true` |
| `items[].post.publishedAt` | No | `string` | formato `date-time`; admite null | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `items[].post.editedAt` | No | `string` | formato `date-time`; admite null | Si fue editada, cuándo. | `2026-07-31T12:00:00.000Z` |
| `items[].post.reactions` | No | `ReactionSummaryDto` | Sin restricción adicional declarada | Reacciones de la publicación, con la del propio lector si tiene perfil. **Viaja con la fila y no en una lectura aparte** porque si no, la única forma de saber cuántas reacciones tiene cada publicación era pedir `GET /posts/{id}/reactions` una vez por tarjeta: cincuenta publicaciones, cincuenta peticiones. Sin esto, el conteo de la interfaz sólo podía ser el del gesto que el usuario acababa de hacer, y **al recargar volvía a cero** aunque la reacción estuviera guardada. | `{"tallies":[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}],"total":1,"actorReactionTypeConceptId":"00000000-0000-4000-8000-000000000001","actorReactionType":"valor-ejemplo"}` |
| `items[].post.reactions.tallies` | No | `array<ReactionTallyDto>` | Sin restricción adicional declarada | Recuento por tipo. | `[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}]` |
| `items[].post.reactions.tallies[].reactionTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de reacción. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.reactions.tallies[].reactionType` | No | `string` | admite null | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `valor-ejemplo` |
| `items[].post.reactions.tallies[].count` | No | `number` | Sin restricción adicional declarada | Cantidad de reacciones de ese tipo. | `1` |
| `items[].post.reactions.total` | No | `number` | Sin restricción adicional declarada | Total de reacciones. | `1` |
| `items[].post.reactions.actorReactionTypeConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.reactions.actorReactionType` | No | `string` | admite null | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `valor-ejemplo` |
| `items[].post.commentCount` | No | `number` | Sin restricción adicional declarada | Comentarios vigentes del hilo completo, raíces y respuestas. Por la misma razón que el resumen de reacciones: el contador no existe como columna —y agregarla sería agregar esquema por comodidad de una lectura—, se calcula agrupado al leer la página. | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/feed"
}
```

---

## 22. DELETE /community/follows

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Dejar de seguir un objeto social
- **Operation ID:** `CommunitySocialController_unfollow`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.unfollow](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Dejar de seguir un objeto social. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-05, cara inversa.

### Descripción del sistema

NestJS resuelve `DELETE /community/follows` en `CommunitySocialController_unfollow`. El controlador delega en `CommunitySocialService.unfollow`. No recibe body. El tipo de retorno estático es `Promise<SocialRemovalResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `followerProfileId` | query | Sí | `string` | formato `uuid` | Perfil que deja de seguir | `00000000-0000-4000-8000-000000000001` |
| `followableType` | query | Sí | `string` | valores: `PROFILE`, `TOPIC`, `HASHTAG`, `GROUP` | Tipo de objeto seguido | `PROFILE` |
| `followableRefId` | query | Sí | `string` | formato `uuid` | Id del objeto seguido | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /community/follows?followerProfileId=00000000-0000-4000-8000-000000000001&followableType=PROFILE&followableRefId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /community/follows?followerProfileId=00000000-0000-4000-8000-000000000001&followableType=PROFILE&followableRefId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<SocialRemovalResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SocialRemovalResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "removed": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `removed` | Sí | `boolean` | Sin restricción adicional declarada | Si esta llamada deshizo el vínculo (falso si ya no existía) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/follows"
}
```

---

## 23. GET /community/follows

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Seguimientos activos de un perfil
- **Operation ID:** `CommunitySocialController_listFollows`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.listFollows](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Seguimientos activos de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Seguimientos emitidos por un perfil. Sólo su titular.

### Descripción del sistema

NestJS resuelve `GET /community/follows` en `CommunitySocialController_listFollows`. El controlador delega en `CommunitySocialReadService.listFollows`. No recibe body. El tipo de retorno estático es `Promise<FollowPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `followerProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/follows?followerProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/follows?followerProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FollowPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<FollowPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<FollowPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<FollowPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<FollowPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<FollowPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FollowPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "followerProfileId": "00000000-0000-4000-8000-000000000001",
      "followableTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "followableRefId": "00000000-0000-4000-8000-000000000001",
      "notificationLevelConceptId": "00000000-0000-4000-8000-000000000001",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<FollowListItemDto>` | Sin restricción adicional declarada | Seguimientos de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","followerProfileId":"00000000-0000-4000-8000-000000000001","followableTypeConceptId":"00000000-0000-4000-8000-000000000001","followableRefId":"00000000-0000-4000-8000-000000000001","notificationLevelConceptId":"00000000-0000-4000-8000-000000000001","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del seguimiento. | `00000000-0000-4000-8000-000000000001` |
| `items[].followerProfileId` | Sí | `string` | formato `uuid` | Perfil que sigue. | `00000000-0000-4000-8000-000000000001` |
| `items[].followableTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de objeto seguido. | `00000000-0000-4000-8000-000000000001` |
| `items[].followableRefId` | Sí | `string` | formato `uuid` | Id del objeto seguido. | `00000000-0000-4000-8000-000000000001` |
| `items[].notificationLevelConceptId` | No | `string` | formato `uuid`; admite null | Concept id del nivel de notificación elegido. | `00000000-0000-4000-8000-000000000001` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo empezó a seguir. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/follows"
}
```

---

## 24. POST /community/follows

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Seguir un objeto social
- **Operation ID:** `CommunitySocialController_follow`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.follow](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Seguir un objeto social. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/follows` en `CommunitySocialController_follow`. El controlador delega en `CommunitySocialService.follow`. Valida el body como `CreateFollowDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFollowDto`; los campos opcionales se omiten.

```http
POST /community/follows HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "followerProfileId": "00000000-0000-4000-8000-000000000001",
  "followableType": "PROFILE",
  "followableRefId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `followerProfileId` | Sí | `string` | formato `uuid` | Perfil que sigue | `00000000-0000-4000-8000-000000000001` |
| `followableType` | Sí | `string` | valores: `PROFILE`, `TOPIC`, `HASHTAG`, `GROUP` | Tipo de objeto seguido | `PROFILE` |
| `followableRefId` | Sí | `string` | formato `uuid` | Id del objeto seguido | `00000000-0000-4000-8000-000000000001` |
| `notificationLevel` | No | `string` | valores: `ALL`, `HIGHLIGHTS`, `NONE` | Nivel de notificación | `ALL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/follows HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "followerProfileId": "00000000-0000-4000-8000-000000000001",
  "followableType": "PROFILE",
  "followableRefId": "00000000-0000-4000-8000-000000000001",
  "notificationLevel": "ALL"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 409 | `CONFLICT` | Ya sigue este objeto | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se puede seguir a uno mismo | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/follows"
}
```

---

## 25. GET /community/groups

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Grupos de una organización
- **Operation ID:** `CommunityGroupsController_listGroups`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.listGroups](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Grupos de una organización. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Directorio de grupos de una organización. `tenantId` es obligatorio: `groups` lleva `tenant_id`, y un listado sin acotarlo mostraría los grupos de una organización a otra.

### Descripción del sistema

NestJS resuelve `GET /community/groups` en `CommunityGroupsController_listGroups`. El controlador delega en `CommunityGroupsReadService.listGroups`. No recibe body. El tipo de retorno estático es `Promise<GroupPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `tenantId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `topicId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/groups?tenantId=00000000-0000-4000-8000-000000000001&topicId=00000000-0000-4000-8000-000000000001&q=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/groups?tenantId=00000000-0000-4000-8000-000000000001&topicId=00000000-0000-4000-8000-000000000001&q=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GroupPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<GroupPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<GroupPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<GroupPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<GroupPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<GroupPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tenantId": "00000000-0000-4000-8000-000000000001",
      "slug": "valor-ejemplo",
      "name": "Nombre de ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "visibilityConceptId": "00000000-0000-4000-8000-000000000001",
      "groupTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "ownerProfileId": "00000000-0000-4000-8000-000000000001",
      "coverFileId": "00000000-0000-4000-8000-000000000001",
      "memberCount": 1,
      "statusConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<GroupListItemDto>` | Sin restricción adicional declarada | Grupos de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","tenantId":"00000000-0000-4000-8000-000000000001","slug":"valor-ejemplo","name":"Nombre de ejemplo","description":"Texto descriptivo de ejemplo","visibilityConceptId":"00000000-0000-4000-8000-000000000001","groupTypeConceptId":"00000000-0000-4000-8000-000000000001","ownerProfileId":"00000000-0000-4000-8000-000000000001","coverFileId":"00000000-0000-4000-8000-000000000001","memberCount":1,"statusConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del grupo. | `00000000-0000-4000-8000-000000000001` |
| `items[].tenantId` | No | `string` | formato `uuid`; admite null | Organización a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `items[].slug` | Sí | `string` | Sin restricción adicional declarada | Ruta del grupo. | `valor-ejemplo` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `Nombre de ejemplo` |
| `items[].description` | No | `string` | admite null | Descripción. | `Texto descriptivo de ejemplo` |
| `items[].visibilityConceptId` | Sí | `string` | formato `uuid` | Concept id de la visibilidad (pública, privada). | `00000000-0000-4000-8000-000000000001` |
| `items[].groupTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de grupo. | `00000000-0000-4000-8000-000000000001` |
| `items[].ownerProfileId` | No | `string` | formato `uuid`; admite null | Perfil dueño. | `00000000-0000-4000-8000-000000000001` |
| `items[].coverFileId` | No | `string` | formato `uuid`; admite null | Imagen de portada. | `00000000-0000-4000-8000-000000000001` |
| `items[].memberCount` | No | `number` | admite null | Cuántos integrantes tiene registrados. | `1` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado del grupo. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups"
}
```

---

## 26. POST /community/groups

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Crear un grupo/comunidad
- **Operation ID:** `CommunityGroupsController_createGroup`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.createGroup](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Crear un grupo/comunidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bootstrap: crea un grupo.

### Descripción del sistema

NestJS resuelve `POST /community/groups` en `CommunityGroupsController_createGroup`. El controlador delega en `CommunityGroupsService.createGroup`. Valida el body como `CreateGroupDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateGroupDto`; los campos opcionales se omiten.

```http
POST /community/groups HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "slug": "valor-ejemplo",
  "name": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `slug` | Sí | `string` | longitud mínima 1; longitud máxima 120 | Slug único | `valor-ejemplo` |
| `name` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre del grupo | `Nombre de ejemplo` |
| `description` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |
| `visibility` | No | `string` | valores: `PUBLIC`, `PRIVATE`, `SECRET` | Visibilidad | `PUBLIC` |
| `groupType` | No | `string` | valores: `GENERAL`, `SUPPORT` | Tipo de grupo | `GENERAL` |
| `topicId` | No | `string` | formato `uuid` | Tema del grupo | `00000000-0000-4000-8000-000000000001` |
| `ownerProfileId` | No | `string` | formato `uuid` | Perfil propietario | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/groups HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Tema no encontrado | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 409 | `CONFLICT` | Ya hay un grupo con ese slug | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Para crear un grupo necesitás tu perfil público configurado | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 422 | `PRECONDITION_FAILED` | Para crear un grupo público necesitás tu perfil público configurado | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 422 | `PRECONDITION_FAILED` | Para crear un grupo público, tu perfil público tiene que estar completo | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups"
}
```

---

## 27. GET /community/groups/{groupId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Ficha de un grupo
- **Operation ID:** `CommunityGroupsController_getGroup`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.getGroup](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Ficha de un grupo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P7: ficha del grupo con la posición del lector frente a él.

### Descripción del sistema

NestJS resuelve `GET /community/groups/{groupId}` en `CommunityGroupsController_getGroup`. El controlador delega en `CommunityGroupsReadService.getGroup`. No recibe body. El tipo de retorno estático es `Promise<GroupDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `groupId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/groups/00000000-0000-4000-8000-000000000001?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `groupId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/groups/00000000-0000-4000-8000-000000000001?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GroupDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<GroupDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<GroupDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<GroupDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<GroupDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<GroupDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<GroupDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "visibilityConceptId": "00000000-0000-4000-8000-000000000001",
  "groupTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "topicId": "00000000-0000-4000-8000-000000000001",
  "ownerProfileId": "00000000-0000-4000-8000-000000000001",
  "coverFileId": "00000000-0000-4000-8000-000000000001",
  "memberCount": 1,
  "postCount": 1,
  "pendingCount": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "viewer": {
    "isMember": true,
    "canAdminister": true,
    "canPost": true,
    "membershipId": "00000000-0000-4000-8000-000000000001",
    "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
    "joinStatusConceptId": "00000000-0000-4000-8000-000000000001"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del grupo. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid`; admite null | Organización a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Ruta del grupo. | `valor-ejemplo` |
| `name` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `Nombre de ejemplo` |
| `description` | No | `string` | admite null | Descripción. | `Texto descriptivo de ejemplo` |
| `visibilityConceptId` | Sí | `string` | formato `uuid` | Concept id de la visibilidad. | `00000000-0000-4000-8000-000000000001` |
| `groupTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de grupo. | `00000000-0000-4000-8000-000000000001` |
| `topicId` | No | `string` | formato `uuid`; admite null | Tema por el que se clasifica, si tiene uno. | `00000000-0000-4000-8000-000000000001` |
| `ownerProfileId` | No | `string` | formato `uuid`; admite null | Perfil dueño. | `00000000-0000-4000-8000-000000000001` |
| `coverFileId` | No | `string` | formato `uuid`; admite null | Imagen de portada. | `00000000-0000-4000-8000-000000000001` |
| `memberCount` | No | `number` | admite null | Cuántos integrantes activos tiene. | `1` |
| `postCount` | No | `number` | admite null | Cuántas publicaciones lleva el muro. | `1` |
| `pendingCount` | No | `number` | admite null | Altas esperando aprobación. Sólo se informa a quien administra. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado del grupo. | `00000000-0000-4000-8000-000000000001` |
| `viewer` | Sí | `GroupViewerMembershipDto` | Sin restricción adicional declarada | Cómo se para el lector frente a este grupo. | `{"isMember":true,"canAdminister":true,"canPost":true,"membershipId":"00000000-0000-4000-8000-000000000001","memberRoleConceptId":"00000000-0000-4000-8000-000000000001","joinStatusConceptId":"00000000-0000-4000-8000-000000000001"}` |
| `viewer.isMember` | Sí | `boolean` | Sin restricción adicional declarada | `true` si el lector tiene membresía activa. | `true` |
| `viewer.canAdminister` | Sí | `boolean` | Sin restricción adicional declarada | `true` si puede aprobar altas y moderar el muro. | `true` |
| `viewer.canPost` | Sí | `boolean` | Sin restricción adicional declarada | `true` si puede escribir en el muro. | `true` |
| `viewer.membershipId` | No | `string` | formato `uuid`; admite null | Membresía del lector, si tiene una (aunque esté pendiente). | `00000000-0000-4000-8000-000000000001` |
| `viewer.memberRoleConceptId` | No | `string` | formato `uuid`; admite null | Concept id del rol del lector, o `null`. | `00000000-0000-4000-8000-000000000001` |
| `viewer.joinStatusConceptId` | No | `string` | formato `uuid`; admite null | Concept id del estado de la membresía del lector, o `null`. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Grupo no encontrado | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups/{groupId}"
}
```

---

## 28. GET /community/groups/{groupId}/members

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Integrantes de un grupo
- **Operation ID:** `CommunityGroupsController_listMembers`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.listMembers](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Integrantes de un grupo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Integrantes de un grupo.

### Descripción del sistema

NestJS resuelve `GET /community/groups/{groupId}/members` en `CommunityGroupsController_listMembers`. El controlador delega en `CommunityGroupsReadService.listMembers`. No recibe body. El tipo de retorno estático es `Promise<GroupMemberPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `groupId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `joinStatus` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/groups/00000000-0000-4000-8000-000000000001/members?actorProfileId=00000000-0000-4000-8000-000000000001&joinStatus=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `groupId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/groups/00000000-0000-4000-8000-000000000001/members?actorProfileId=00000000-0000-4000-8000-000000000001&joinStatus=valor-ejemplo&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GroupMemberPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<GroupMemberPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<GroupMemberPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<GroupMemberPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<GroupMemberPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<GroupMemberPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<GroupMemberPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupMemberPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "memberProfileId": "00000000-0000-4000-8000-000000000001",
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "joinStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "joinedAt": "2026-07-31T12:00:00.000Z",
      "invitedByProfileId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<GroupMemberDto>` | Sin restricción adicional declarada | Integrantes de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","memberProfileId":"00000000-0000-4000-8000-000000000001","memberRoleConceptId":"00000000-0000-4000-8000-000000000001","joinStatusConceptId":"00000000-0000-4000-8000-000000000001","joinedAt":"2026-07-31T12:00:00.000Z","invitedByProfileId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la membresía. | `00000000-0000-4000-8000-000000000001` |
| `items[].memberProfileId` | Sí | `string` | formato `uuid` | Perfil integrante. | `00000000-0000-4000-8000-000000000001` |
| `items[].memberRoleConceptId` | Sí | `string` | formato `uuid` | Concept id del rol dentro del grupo. | `00000000-0000-4000-8000-000000000001` |
| `items[].joinStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la membresía. | `00000000-0000-4000-8000-000000000001` |
| `items[].joinedAt` | No | `string` | formato `date-time`; admite null | Cuándo se incorporó. | `2026-07-31T12:00:00.000Z` |
| `items[].invitedByProfileId` | No | `string` | formato `uuid`; admite null | Quién lo invitó, si alguien lo hizo. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Grupo no encontrado | Excepción explícita en src/modules/community/services/community-groups-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups/{groupId}/members"
}
```

---

## 29. POST /community/groups/{groupId}/members

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Unirse a un grupo / comunidad
- **Operation ID:** `CommunityGroupsController_joinGroup`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.joinGroup](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Unirse a un grupo / comunidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/groups/{groupId}/members` en `CommunityGroupsController_joinGroup`. El controlador delega en `CommunityGroupsService.joinGroup`. Valida el body como `JoinGroupDto` y consume `application/json`. El tipo de retorno estático es `Promise<GroupMembershipResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `groupId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `JoinGroupDto`; los campos opcionales se omiten.

```http
POST /community/groups/00000000-0000-4000-8000-000000000001/members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `groupId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `memberProfileId` | Sí | `string` | formato `uuid` | Perfil que se une | `00000000-0000-4000-8000-000000000001` |
| `invitedByProfileId` | No | `string` | formato `uuid` | Perfil que invitó (grupos privados) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/groups/00000000-0000-4000-8000-000000000001/members HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "memberProfileId": "00000000-0000-4000-8000-000000000001",
  "invitedByProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GroupMembershipResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupMembershipResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "joinStatus": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `joinStatus` | Sí | `string` | Sin restricción adicional declarada | Estado de la membresía (activa o pendiente) | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Grupo no encontrado | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 409 | `CONFLICT` | El perfil ya es miembro del grupo | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups/{groupId}/members"
}
```

---

## 30. PATCH /community/groups/{groupId}/members/{memberId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Aprobar/rechazar un alta o cambiar el rol
- **Operation ID:** `CommunityGroupsController_updateMember`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.updateMember](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Aprobar/rechazar un alta o cambiar el rol. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P7: resuelve un alta pendiente y/o cambia el rol de un integrante.

### Descripción del sistema

NestJS resuelve `PATCH /community/groups/{groupId}/members/{memberId}` en `CommunityGroupsController_updateMember`. El controlador delega en `CommunityGroupsService.updateMember`. Valida el body como `UpdateGroupMemberDto` y consume `application/json`. El tipo de retorno estático es `Promise<GroupMemberUpdatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `groupId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `memberId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateGroupMemberDto`; los campos opcionales se omiten.

```http
PATCH /community/groups/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `groupId`, `memberId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `role` | No | `string` | valores: `MEMBER`, `MODERATOR`, `ADMIN` | Rol dentro del grupo | `MEMBER` |
| `decision` | No | `string` | valores: `APPROVE`, `REJECT` | Resolución de la solicitud de ingreso | `APPROVE` |
| `actorProfileId` | No | `string` | formato `uuid` | Perfil administrador | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /community/groups/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "role": "MEMBER",
  "decision": "APPROVE",
  "actorProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupMemberUpdatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "joinStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Membresía afectada. | `00000000-0000-4000-8000-000000000001` |
| `memberRoleConceptId` | Sí | `string` | formato `uuid` | Concept id del rol resultante. | `00000000-0000-4000-8000-000000000001` |
| `joinStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado resultante. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 403 | `FORBIDDEN` | Sólo quien administra el grupo puede resolver sus membresías | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 404 | `NOT_FOUND` | Membresía no encontrada | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 404 | `NOT_FOUND` | Grupo no encontrado | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Hay que indicar una decisión o un rol | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 422 | `PRECONDITION_FAILED` | La solicitud de ingreso ya estaba resuelta | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups/{groupId}/members/{memberId}"
}
```

---

## 31. DELETE /community/groups/{groupId}/members/{memberProfileId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Salir del grupo o dar de baja a un integrante
- **Operation ID:** `CommunityGroupsController_leaveGroup`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.leaveGroup](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Salir del grupo o dar de baja a un integrante. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P7: baja de un integrante. Lleva el **perfil** y no el id de membresía porque quien se da de baja a sí mismo conoce su perfil, no el uuid de su fila en `group_members`.

### Descripción del sistema

NestJS resuelve `DELETE /community/groups/{groupId}/members/{memberProfileId}` en `CommunityGroupsController_leaveGroup`. El controlador delega en `CommunityGroupsService.leaveGroup`. No recibe body. El tipo de retorno estático es `Promise<GroupMemberUpdatedDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `groupId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `memberProfileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /community/groups/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `groupId`, `memberProfileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /community/groups/00000000-0000-4000-8000-000000000001/members/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GroupMemberUpdatedDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupMemberUpdatedDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "joinStatusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Membresía afectada. | `00000000-0000-4000-8000-000000000001` |
| `memberRoleConceptId` | Sí | `string` | formato `uuid` | Concept id del rol resultante. | `00000000-0000-4000-8000-000000000001` |
| `joinStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado resultante. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 403 | `FORBIDDEN` | Sólo quien administra el grupo puede resolver sus membresías | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 404 | `NOT_FOUND` | Grupo no encontrado | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 404 | `NOT_FOUND` | El perfil no es del grupo | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 409 | `CONFLICT` | Al dueño del grupo no lo puede sacar otro: sólo él puede irse, o transferir el grupo antes | Excepción explícita en src/modules/community/services/community-groups.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups/{groupId}/members/{memberProfileId}"
}
```

---

## 32. GET /community/groups/{groupId}/posts

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Muro de un grupo
- **Operation ID:** `CommunityGroupsController_listWall`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.listWall](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Muro de un grupo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P7: muro del grupo.

### Descripción del sistema

NestJS resuelve `GET /community/groups/{groupId}/posts` en `CommunityGroupsController_listWall`. El controlador delega en `CommunityGroupWallService.listWall`. No recibe body. El tipo de retorno estático es `Promise<GroupWallPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `groupId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/groups/00000000-0000-4000-8000-000000000001/posts?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `groupId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/groups/00000000-0000-4000-8000-000000000001/posts?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GroupWallPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<GroupWallPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<GroupWallPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<GroupWallPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<GroupWallPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<GroupWallPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<GroupWallPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupWallPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "authorProfileId": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "parentCommentId": "00000000-0000-4000-8000-000000000001",
      "threadDepth": 1,
      "replyCount": 1,
      "createdAt": "2026-07-31T12:00:00.000Z",
      "replies": [
        "<GroupWallItemDto>"
      ]
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<GroupWallItemDto>` | Sin restricción adicional declarada | Publicaciones de la página, cada una con su hilo. | `[{"id":"00000000-0000-4000-8000-000000000001","authorProfileId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","parentCommentId":"00000000-0000-4000-8000-000000000001","threadDepth":1,"replyCount":1,"createdAt":"2026-07-31T12:00:00.000Z","replies":["<GroupWallItemDto>"]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].authorProfileId` | Sí | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Cuerpo del mensaje. | `valor-ejemplo` |
| `items[].parentCommentId` | No | `string` | formato `uuid`; admite null | Publicación a la que responde, si es una respuesta. | `00000000-0000-4000-8000-000000000001` |
| `items[].threadDepth` | No | `number` | admite null | Profundidad dentro del hilo. | `1` |
| `items[].replyCount` | No | `number` | admite null | Cuántas respuestas tiene registradas. | `1` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `items[].replies` | Sí | `array<GroupWallItemDto>` | Sin restricción adicional declarada | Respuestas anidadas. | `["<GroupWallItemDto>"]` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 403 | `FORBIDDEN` | Hay que ser integrante del grupo para ver su contenido | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 404 | `NOT_FOUND` | Grupo no encontrado | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups/{groupId}/posts"
}
```

---

## 33. POST /community/groups/{groupId}/posts

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Publicar en el muro del grupo
- **Operation ID:** `CommunityGroupsController_createGroupPost`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityGroupsController.createGroupPost](../../src/modules/community/controllers/community-groups.controller.ts)

### Descripción de negocio

Publicar en el muro del grupo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: P7: publica en el muro del grupo, o responde a una publicación.

### Descripción del sistema

NestJS resuelve `POST /community/groups/{groupId}/posts` en `CommunityGroupsController_createGroupPost`. El controlador delega en `CommunityGroupWallService.createPost`. Valida el body como `CreateGroupPostDto` y consume `application/json`. El tipo de retorno estático es `Promise<GroupWallItemDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `groupId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateGroupPostDto`; los campos opcionales se omiten.

```http
POST /community/groups/00000000-0000-4000-8000-000000000001/posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `groupId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `authorProfileId` | Sí | `string` | formato `uuid` | Perfil autor | `00000000-0000-4000-8000-000000000001` |
| `bodyText` | Sí | `string` | longitud mínima 1; longitud máxima 5000 | Cuerpo del mensaje | `valor-ejemplo` |
| `parentCommentId` | No | `string` | formato `uuid` | Publicación del muro a la que responde | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/groups/00000000-0000-4000-8000-000000000001/posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo",
  "parentCommentId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<GroupWallItemDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 404 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GroupWallItemDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GroupWallItemDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "authorProfileId": "00000000-0000-4000-8000-000000000001",
  "bodyText": "valor-ejemplo",
  "parentCommentId": "00000000-0000-4000-8000-000000000001",
  "threadDepth": 1,
  "replyCount": 1,
  "createdAt": "2026-07-31T12:00:00.000Z",
  "replies": [
    "<GroupWallItemDto>"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la publicación. | `00000000-0000-4000-8000-000000000001` |
| `authorProfileId` | Sí | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `bodyText` | Sí | `string` | Sin restricción adicional declarada | Cuerpo del mensaje. | `valor-ejemplo` |
| `parentCommentId` | No | `string` | formato `uuid`; admite null | Publicación a la que responde, si es una respuesta. | `00000000-0000-4000-8000-000000000001` |
| `threadDepth` | No | `number` | admite null | Profundidad dentro del hilo. | `1` |
| `replyCount` | No | `number` | admite null | Cuántas respuestas tiene registradas. | `1` |
| `createdAt` | Sí | `string` | formato `date-time` | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `replies` | Sí | `array<GroupWallItemDto>` | Sin restricción adicional declarada | Respuestas anidadas. | `["<GroupWallItemDto>"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 403 | `FORBIDDEN` | Hay que ser integrante del grupo para publicar en su muro | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 404 | `NOT_FOUND` | Perfil autor no encontrado | Excepción explícita en src/modules/community/services/community-group-wall.service.ts |
| 404 | `NOT_FOUND` | La publicación a la que responde no es de este grupo | Excepción explícita en src/modules/community/services/community-group-wall.service.ts |
| 404 | `NOT_FOUND` | Grupo no encontrado | Excepción explícita en src/modules/community/services/community-group-access.service.ts |
| 404 | `NOT_FOUND` | Canal no encontrado | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 404 | `NOT_FOUND` | Plantilla no encontrada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La notificación necesita destinatario interno o dirección de destino | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | El canal no está activo | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla no está publicada | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 422 | `PRECONDITION_FAILED` | La plantilla es de otro canal | Excepción explícita en src/modules/messaging/services/notifications.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/groups/{groupId}/posts"
}
```

---

## 34. GET /community/moderation/appeals

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-moderation`
- **Nombre:** Apelaciones presentadas, con su decisión
- **Operation ID:** `CommunityModerationController_listAppeals`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityModerationController.listAppeals](../../src/modules/community/controllers/community-moderation.controller.ts)

### Descripción de negocio

Apelaciones presentadas, con su decisión. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Apelaciones, con la decisión que cada una impugna.

### Descripción del sistema

NestJS resuelve `GET /community/moderation/appeals` en `CommunityModerationController_listAppeals`. El controlador delega en `CommunityModerationReadService.listAppeals`. No recibe body. El tipo de retorno estático es `Promise<ModerationAppealPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `status` | query | No | `array<string>` | Sin restricción adicional declarada | Estados admitidos (lista separada por comas) | `["OPEN"]` |
| `appellantProfileId` | query | No | `string` | formato `uuid` | Perfil que apeló | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor de la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1 | Tope de filas | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/moderation/appeals HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/moderation/appeals?status=OPEN&appellantProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ModerationAppealPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ModerationAppealPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ModerationAppealPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ModerationAppealPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ModerationAppealPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ModerationAppealPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModerationAppealPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "moderationDecisionId": "00000000-0000-4000-8000-000000000001",
      "appellantProfileId": "00000000-0000-4000-8000-000000000001",
      "reasonText": "Texto descriptivo de ejemplo",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "resolutionConceptId": "00000000-0000-4000-8000-000000000001",
      "reviewedByUserId": "00000000-0000-4000-8000-000000000001",
      "resolvedAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z",
      "decision": {
        "id": "00000000-0000-4000-8000-000000000001",
        "moderationQueueId": "00000000-0000-4000-8000-000000000001",
        "decisionConceptId": "00000000-0000-4000-8000-000000000001",
        "policyConceptId": "00000000-0000-4000-8000-000000000001",
        "rationaleText": "valor-ejemplo",
        "actionTakenConceptId": "00000000-0000-4000-8000-000000000001",
        "decidedByUserId": "00000000-0000-4000-8000-000000000001",
        "decidedAt": "2026-07-31T12:00:00.000Z"
      }
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ModerationAppealItemDto>` | Sin restricción adicional declarada | Apelaciones de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","moderationDecisionId":"00000000-0000-4000-8000-000000000001","appellantProfileId":"00000000-0000-4000-8000-000000000001","reasonText":"Texto descriptivo de ejemplo","statusConceptId":"00000000-0000-4000-8000-000000000001","resolutionConceptId":"00000000-0000-4000-8000-000000000001","reviewedByUserId":"00000000-0000-4000-8000-000000000001","resolvedAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z","decision":{"id":"00000000-0000-4000-8000-000000000001","moderationQueueId":"00000000-0000-4000-8000-000000000001","decisionConceptId":"00000000-0000-4000-8000-000000000001","policyConceptId":"00000000-0000-4000-8000-000000000001","rationaleText":"valor-ejemplo","actionTakenConceptId":"00000000-0000-4000-8000-000000000001","decidedByUserId":"00000000-0000-4000-8000-000000000001","decidedAt":"2026-07-31T12:00:00.000Z"}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la apelación. | `00000000-0000-4000-8000-000000000001` |
| `items[].moderationDecisionId` | Sí | `string` | formato `uuid` | Decisión impugnada. | `00000000-0000-4000-8000-000000000001` |
| `items[].appellantProfileId` | Sí | `string` | formato `uuid` | Perfil que apeló. | `00000000-0000-4000-8000-000000000001` |
| `items[].reasonText` | Sí | `string` | Sin restricción adicional declarada | Motivo de la apelación. | `Texto descriptivo de ejemplo` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la apelación. | `00000000-0000-4000-8000-000000000001` |
| `items[].resolutionConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la resolución, si ya se resolvió. | `00000000-0000-4000-8000-000000000001` |
| `items[].reviewedByUserId` | No | `string` | formato `uuid`; admite null | Quién la revisó. | `00000000-0000-4000-8000-000000000001` |
| `items[].resolvedAt` | No | `string` | formato `date-time`; admite null | Cuándo se resolvió. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se presentó. | `2026-07-31T12:00:00.000Z` |
| `items[].decision` | No | `ModerationDecisionItemDto` | Sin restricción adicional declarada | La decisión impugnada, resuelta. Va embebida porque resolver una apelación sin leer qué se decidió y por qué es resolverla a ciegas, y pedirla aparte serían N lecturas por pantalla. | `{"id":"00000000-0000-4000-8000-000000000001","moderationQueueId":"00000000-0000-4000-8000-000000000001","decisionConceptId":"00000000-0000-4000-8000-000000000001","policyConceptId":"00000000-0000-4000-8000-000000000001","rationaleText":"valor-ejemplo","actionTakenConceptId":"00000000-0000-4000-8000-000000000001","decidedByUserId":"00000000-0000-4000-8000-000000000001","decidedAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].decision.id` | No | `string` | formato `uuid` | Identificador de la decisión. | `00000000-0000-4000-8000-000000000001` |
| `items[].decision.moderationQueueId` | No | `string` | formato `uuid` | Entrada de cola que resolvió. | `00000000-0000-4000-8000-000000000001` |
| `items[].decision.decisionConceptId` | No | `string` | formato `uuid` | Concept id de la decisión tomada. | `00000000-0000-4000-8000-000000000001` |
| `items[].decision.policyConceptId` | No | `string` | formato `uuid` | Concept id de la política aplicada. | `00000000-0000-4000-8000-000000000001` |
| `items[].decision.rationaleText` | No | `string` | admite null | Motivo escrito por quien decidió. | `valor-ejemplo` |
| `items[].decision.actionTakenConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la acción ejecutada. | `00000000-0000-4000-8000-000000000001` |
| `items[].decision.decidedByUserId` | No | `string` | formato `uuid` | Quién decidió. | `00000000-0000-4000-8000-000000000001` |
| `items[].decision.decidedAt` | No | `string` | formato `date-time`; admite null | Cuándo se decidió. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null` si no hay más. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/moderation/appeals"
}
```

---

## 35. POST /community/moderation/appeals/{appealId}/resolve

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-moderation`
- **Nombre:** Resolver una apelación de moderación
- **Operation ID:** `CommunityModerationController_resolveAppeal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityModerationController.resolveAppeal](../../src/modules/community/controllers/community-moderation.controller.ts)

### Descripción de negocio

Resolver una apelación de moderación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-10, cierre: resuelve una apelación abierta.

### Descripción del sistema

NestJS resuelve `POST /community/moderation/appeals/{appealId}/resolve` en `CommunityModerationController_resolveAppeal`. El controlador delega en `CommunityModerationService.resolveAppeal`. Valida el body como `CommunityResolveAppealDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `appealId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CommunityResolveAppealDto`; los campos opcionales se omiten.

```http
POST /community/moderation/appeals/00000000-0000-4000-8000-000000000001/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resolution": "UPHELD"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `appealId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `resolution` | Sí | `string` | valores: `UPHELD`, `OVERTURNED`, `PARTIAL` | Resolución de la apelación | `UPHELD` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/moderation/appeals/00000000-0000-4000-8000-000000000001/resolve HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "resolution": "UPHELD"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Apelación no encontrada | Excepción explícita en src/modules/community/services/community-moderation.service.ts |
| 409 | `CONFLICT` | La apelación ya está resuelta | Excepción explícita en src/modules/community/services/community-moderation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/moderation/appeals/{appealId}/resolve"
}
```

---

## 36. GET /community/moderation/decisions

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-moderation`
- **Nombre:** Decisiones de moderación tomadas
- **Operation ID:** `CommunityModerationController_listDecisions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityModerationController.listDecisions](../../src/modules/community/controllers/community-moderation.controller.ts)

### Descripción de negocio

Decisiones de moderación tomadas. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Decisiones tomadas, de la más reciente hacia atrás.

### Descripción del sistema

NestJS resuelve `GET /community/moderation/decisions` en `CommunityModerationController_listDecisions`. El controlador delega en `CommunityModerationReadService.listDecisions`. No recibe body. El tipo de retorno estático es `Promise<ModerationDecisionPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `moderationQueueId` | query | No | `string` | formato `uuid` | Entrada de cola | `00000000-0000-4000-8000-000000000001` |
| `decision` | query | No | `array<string>` | Sin restricción adicional declarada | Decisiones admitidas (lista separada por comas) | `["REMOVED"]` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor de la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1 | Tope de filas | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/moderation/decisions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/moderation/decisions?moderationQueueId=00000000-0000-4000-8000-000000000001&decision=REMOVED&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ModerationDecisionPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ModerationDecisionPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ModerationDecisionPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ModerationDecisionPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ModerationDecisionPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ModerationDecisionPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModerationDecisionPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "moderationQueueId": "00000000-0000-4000-8000-000000000001",
      "decisionConceptId": "00000000-0000-4000-8000-000000000001",
      "policyConceptId": "00000000-0000-4000-8000-000000000001",
      "rationaleText": "valor-ejemplo",
      "actionTakenConceptId": "00000000-0000-4000-8000-000000000001",
      "decidedByUserId": "00000000-0000-4000-8000-000000000001",
      "decidedAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ModerationDecisionItemDto>` | Sin restricción adicional declarada | Decisiones de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","moderationQueueId":"00000000-0000-4000-8000-000000000001","decisionConceptId":"00000000-0000-4000-8000-000000000001","policyConceptId":"00000000-0000-4000-8000-000000000001","rationaleText":"valor-ejemplo","actionTakenConceptId":"00000000-0000-4000-8000-000000000001","decidedByUserId":"00000000-0000-4000-8000-000000000001","decidedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la decisión. | `00000000-0000-4000-8000-000000000001` |
| `items[].moderationQueueId` | Sí | `string` | formato `uuid` | Entrada de cola que resolvió. | `00000000-0000-4000-8000-000000000001` |
| `items[].decisionConceptId` | Sí | `string` | formato `uuid` | Concept id de la decisión tomada. | `00000000-0000-4000-8000-000000000001` |
| `items[].policyConceptId` | Sí | `string` | formato `uuid` | Concept id de la política aplicada. | `00000000-0000-4000-8000-000000000001` |
| `items[].rationaleText` | No | `string` | admite null | Motivo escrito por quien decidió. | `valor-ejemplo` |
| `items[].actionTakenConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la acción ejecutada. | `00000000-0000-4000-8000-000000000001` |
| `items[].decidedByUserId` | Sí | `string` | formato `uuid` | Quién decidió. | `00000000-0000-4000-8000-000000000001` |
| `items[].decidedAt` | No | `string` | formato `date-time`; admite null | Cuándo se decidió. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null` si no hay más. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/moderation/decisions"
}
```

---

## 37. POST /community/moderation/decisions/{decisionId}/appeal

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-moderation`
- **Nombre:** Apelar una decisión de moderación
- **Operation ID:** `CommunityModerationController_appeal`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityModerationController.appeal](../../src/modules/community/controllers/community-moderation.controller.ts)

### Descripción de negocio

Apelar una decisión de moderación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/moderation/decisions/{decisionId}/appeal` en `CommunityModerationController_appeal`. El controlador delega en `CommunityModerationService.appeal`. Valida el body como `CreateAppealDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `decisionId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAppealDto`; los campos opcionales se omiten.

```http
POST /community/moderation/decisions/00000000-0000-4000-8000-000000000001/appeal HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "appellantProfileId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `decisionId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `appellantProfileId` | Sí | `string` | formato `uuid` | Perfil que apela (sancionado) | `00000000-0000-4000-8000-000000000001` |
| `reasonText` | Sí | `string` | longitud mínima 1; longitud máxima 2000 | Motivo de la apelación | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/moderation/decisions/00000000-0000-4000-8000-000000000001/appeal HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "appellantProfileId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Decisión no encontrada | Excepción explícita en src/modules/community/services/community-moderation.service.ts |
| 409 | `CONFLICT` | Ya existe una apelación abierta para esta decisión | Excepción explícita en src/modules/community/services/community-moderation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/moderation/decisions/{decisionId}/appeal"
}
```

---

## 38. GET /community/moderation/queue

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-moderation`
- **Nombre:** Cola de moderación con filtros y cursor
- **Operation ID:** `CommunityModerationController_listQueue`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityModerationController.listQueue](../../src/modules/community/controllers/community-moderation.controller.ts)

### Descripción de negocio

Cola de moderación con filtros y cursor. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Cola de moderación con filtros de trabajo.

### Descripción del sistema

NestJS resuelve `GET /community/moderation/queue` en `CommunityModerationController_listQueue`. El controlador delega en `CommunityModerationReadService.listQueue`. No recibe body. El tipo de retorno estático es `Promise<ModerationQueuePageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `status` | query | No | `array<string>` | Sin restricción adicional declarada | Estados admitidos (lista separada por comas) | `["QUEUED"]` |
| `priority` | query | No | `array<string>` | Sin restricción adicional declarada | Prioridades admitidas (lista separada por comas) | `["LOW"]` |
| `contentType` | query | No | `array<string>` | Sin restricción adicional declarada | Tipos de contenido admitidos (lista separada por comas) | `["POST"]` |
| `minAgeHours` | query | No | `number` | mínimo 0 | Sólo lo encolado hace al menos estas horas | `1` |
| `cursor` | query | No | `string` | Sin restricción adicional declarada | Cursor de la página anterior | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1 | Tope de filas | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/moderation/queue HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/moderation/queue?status=QUEUED&priority=LOW&contentType=POST&minAgeHours=1&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ModerationQueuePageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ModerationQueuePageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ModerationQueuePageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ModerationQueuePageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ModerationQueuePageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ModerationQueuePageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModerationQueuePageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "contentTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "contentRefId": "00000000-0000-4000-8000-000000000001",
      "sourceConceptId": "00000000-0000-4000-8000-000000000001",
      "priorityConceptId": "00000000-0000-4000-8000-000000000001",
      "statusConceptId": "00000000-0000-4000-8000-000000000001",
      "assignedToUserId": "00000000-0000-4000-8000-000000000001",
      "queuedAt": "2026-07-31T12:00:00.000Z",
      "reportCount": 1,
      "report": {
        "id": "00000000-0000-4000-8000-000000000001",
        "reasonConceptId": "00000000-0000-4000-8000-000000000001",
        "detailText": "valor-ejemplo",
        "createdAt": "2026-07-31T12:00:00.000Z"
      }
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ModerationQueueItemDto>` | Sin restricción adicional declarada | Entradas de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","contentTypeConceptId":"00000000-0000-4000-8000-000000000001","contentRefId":"00000000-0000-4000-8000-000000000001","sourceConceptId":"00000000-0000-4000-8000-000000000001","priorityConceptId":"00000000-0000-4000-8000-000000000001","statusConceptId":"00000000-0000-4000-8000-000000000001","assignedToUserId":"00000000-0000-4000-8000-000000000001","queuedAt":"2026-07-31T12:00:00.000Z","reportCount":1,"report":{"id":"00000000-0000-4000-8000-000000000001","reasonConceptId":"00000000-0000-4000-8000-000000000001","detailText":"valor-ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la entrada. | `00000000-0000-4000-8000-000000000001` |
| `items[].contentTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de contenido en revisión. | `00000000-0000-4000-8000-000000000001` |
| `items[].contentRefId` | Sí | `string` | formato `uuid` | Identificador del contenido en revisión. | `00000000-0000-4000-8000-000000000001` |
| `items[].sourceConceptId` | Sí | `string` | formato `uuid` | Concept id del origen (reporte de usuario, apelación, automático). | `00000000-0000-4000-8000-000000000001` |
| `items[].priorityConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la prioridad. | `00000000-0000-4000-8000-000000000001` |
| `items[].statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de la entrada. | `00000000-0000-4000-8000-000000000001` |
| `items[].assignedToUserId` | No | `string` | formato `uuid`; admite null | A quién está asignada, si a alguien. | `00000000-0000-4000-8000-000000000001` |
| `items[].queuedAt` | No | `string` | formato `date-time`; admite null | Cuándo entró a la cola. | `2026-07-31T12:00:00.000Z` |
| `items[].reportCount` | Sí | `number` | Sin restricción adicional declarada | Cuántos reportes acumula este contenido. La cola deduplica por contenido, así que sin este número una entrada reportada por diez personas se ve igual que una reportada por una. | `1` |
| `items[].report` | No | `QueueReportContextDto` | Sin restricción adicional declarada | El reporte que abrió la entrada, si lo hubo. | `{"id":"00000000-0000-4000-8000-000000000001","reasonConceptId":"00000000-0000-4000-8000-000000000001","detailText":"valor-ejemplo","createdAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].report.id` | No | `string` | formato `uuid` | Identificador del reporte. | `00000000-0000-4000-8000-000000000001` |
| `items[].report.reasonConceptId` | No | `string` | formato `uuid` | Concept id de la razón declarada. | `00000000-0000-4000-8000-000000000001` |
| `items[].report.detailText` | No | `string` | admite null | Detalle que escribió quien reportó. Es texto libre de un usuario y puede contener datos de terceros; viaja porque el moderador **necesita** leerlo para decidir, y no sale de esta lectura, que exige rol de moderación. | `valor-ejemplo` |
| `items[].report.createdAt` | No | `string` | formato `date-time` | Cuándo se reportó. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null` si no hay más. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/moderation/queue"
}
```

---

## 39. POST /community/moderation/queue/{queueId}/decision

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-moderation`
- **Nombre:** Resolver moderación (decisión + strike)
- **Operation ID:** `CommunityModerationController_decide`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityModerationController.decide](../../src/modules/community/controllers/community-moderation.controller.ts)

### Descripción de negocio

Resolver moderación (decisión + strike). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-09 (moderador / admin de confianza y seguridad).

### Descripción del sistema

NestJS resuelve `POST /community/moderation/queue/{queueId}/decision` en `CommunityModerationController_decide`. El controlador delega en `CommunityModerationService.decide`. Valida el body como `ModerationDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ModerationDecisionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `queueId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ModerationDecisionDto`; los campos opcionales se omiten.

```http
POST /community/moderation/queue/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "REMOVED",
  "rationaleText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `queueId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `decision` | Sí | `string` | valores: `REMOVED`, `RESTRICTED`, `WARNED`, `DISMISSED` | Decisión | `REMOVED` |
| `rationaleText` | Sí | `string` | longitud mínima 1; longitud máxima 2000 | Motivación de la decisión | `valor-ejemplo` |
| `subjectProfileId` | No | `string` | formato `uuid` | Perfil sancionado (si la decisión emite strike) | `00000000-0000-4000-8000-000000000001` |
| `strikeSeverity` | No | `string` | valores: `LOW`, `MEDIUM`, `HIGH` | Severidad del strike | `LOW` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/moderation/queue/00000000-0000-4000-8000-000000000001/decision HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "decision": "REMOVED",
  "rationaleText": "valor-ejemplo",
  "subjectProfileId": "00000000-0000-4000-8000-000000000001",
  "strikeSeverity": "LOW"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ModerationDecisionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModerationDecisionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "strikeId": "00000000-0000-4000-8000-000000000001",
  "decision": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `strikeId` | Sí | `string` | formato `uuid`; admite null | Strike emitido, si aplica | `00000000-0000-4000-8000-000000000001` |
| `decision` | Sí | `string` | Sin restricción adicional declarada | Valor de decision mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entrada de cola no encontrada | Excepción explícita en src/modules/community/services/community-moderation.service.ts |
| 409 | `CONFLICT` | La entrada de cola ya está resuelta | Excepción explícita en src/modules/community/services/community-moderation.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/moderation/queue/{queueId}/decision"
}
```

---

## 40. GET /community/notifications

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-timeline`
- **Nombre:** Notificaciones sociales de un perfil
- **Operation ID:** `CommunityTimelineController_listNotifications`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityTimelineController.listNotifications](../../src/modules/community/controllers/community-timeline.controller.ts)

### Descripción de negocio

Notificaciones sociales de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bandeja de notificaciones del propio perfil, con el total sin leer.

### Descripción del sistema

NestJS resuelve `GET /community/notifications` en `CommunityTimelineController_listNotifications`. El controlador delega en `CommunityTimelineReadService.listNotifications`. No recibe body. El tipo de retorno estático es `Promise<NotificationPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/notifications?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/notifications?profileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<NotificationPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<NotificationPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<NotificationPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<NotificationPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<NotificationPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<NotificationPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `NotificationPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "notificationTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "actorProfileId": "00000000-0000-4000-8000-000000000001",
      "sourceTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "sourceRefId": "00000000-0000-4000-8000-000000000001",
      "previewText": "valor-ejemplo",
      "isRead": true,
      "readAt": "2026-07-31T12:00:00.000Z",
      "createdAt": "2026-07-31T12:00:00.000Z"
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo",
  "unreadCount": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<SocialNotificationDto>` | Sin restricción adicional declarada | Notificaciones de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","notificationTypeConceptId":"00000000-0000-4000-8000-000000000001","actorProfileId":"00000000-0000-4000-8000-000000000001","sourceTypeConceptId":"00000000-0000-4000-8000-000000000001","sourceRefId":"00000000-0000-4000-8000-000000000001","previewText":"valor-ejemplo","isRead":true,"readAt":"2026-07-31T12:00:00.000Z","createdAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la notificación. | `00000000-0000-4000-8000-000000000001` |
| `items[].notificationTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de notificación. | `00000000-0000-4000-8000-000000000001` |
| `items[].actorProfileId` | No | `string` | formato `uuid`; admite null | Perfil que la provocó, si lo hubo. | `00000000-0000-4000-8000-000000000001` |
| `items[].sourceTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de origen. | `00000000-0000-4000-8000-000000000001` |
| `items[].sourceRefId` | Sí | `string` | formato `uuid` | Id del contenido de origen. | `00000000-0000-4000-8000-000000000001` |
| `items[].previewText` | No | `string` | admite null | Texto corto de vista previa. | `valor-ejemplo` |
| `items[].isRead` | Sí | `boolean` | Sin restricción adicional declarada | Si ya se leyó. | `true` |
| `items[].readAt` | No | `string` | formato `date-time`; admite null | Cuándo se leyó. | `2026-07-31T12:00:00.000Z` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se generó. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |
| `unreadCount` | Sí | `number` | Sin restricción adicional declarada | Cuántas hay sin leer en total. Se cuenta sobre la bandeja entera y no sobre la página: el globo de la campana no depende de cuántas notificaciones se estén mostrando. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/notifications"
}
```

---

## 41. GET /community/polls/{pollId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-polls`
- **Nombre:** Encuesta con opciones, recuentos y voto propio
- **Operation ID:** `CommunityPollsController_getPoll`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityPollsController.getPoll](../../src/modules/community/controllers/community-polls.controller.ts)

### Descripción de negocio

Encuesta con opciones, recuentos y voto propio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-17 (cara de lectura). Encuesta con recuentos y el voto del actor.

### Descripción del sistema

NestJS resuelve `GET /community/polls/{pollId}` en `CommunityPollsController_getPoll`. El controlador delega en `CommunityPollsReadService.getPoll`. No recibe body. El tipo de retorno estático es `Promise<PollDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pollId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/polls/00000000-0000-4000-8000-000000000001?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `pollId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/polls/00000000-0000-4000-8000-000000000001?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PollDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PollDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PollDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PollDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PollDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PollDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PollDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PollDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "postId": "00000000-0000-4000-8000-000000000001",
  "question": "valor-ejemplo",
  "allowsMultiple": true,
  "closesAt": "2026-07-31T12:00:00.000Z",
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "options": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "label": "valor-ejemplo",
      "ordinal": 1,
      "voteCount": 1
    }
  ],
  "totalVotes": 1,
  "actorVotedOptionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la encuesta. | `00000000-0000-4000-8000-000000000001` |
| `postId` | Sí | `string` | formato `uuid` | Publicación que la contiene. | `00000000-0000-4000-8000-000000000001` |
| `question` | Sí | `string` | Sin restricción adicional declarada | Pregunta. | `valor-ejemplo` |
| `allowsMultiple` | Sí | `boolean` | Sin restricción adicional declarada | Si admite marcar varias opciones. | `true` |
| `closesAt` | No | `string` | formato `date-time`; admite null | Cuándo cierra. | `2026-07-31T12:00:00.000Z` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado (abierta, cerrada). | `00000000-0000-4000-8000-000000000001` |
| `options` | Sí | `array<PollOptionResultDto>` | Sin restricción adicional declarada | Opciones con su recuento. | `[{"id":"00000000-0000-4000-8000-000000000001","label":"valor-ejemplo","ordinal":1,"voteCount":1}]` |
| `options[].id` | Sí | `string` | formato `uuid` | Identificador de la opción. | `00000000-0000-4000-8000-000000000001` |
| `options[].label` | Sí | `string` | Sin restricción adicional declarada | Texto de la opción. | `valor-ejemplo` |
| `options[].ordinal` | No | `number` | admite null | Orden de presentación. | `1` |
| `options[].voteCount` | Sí | `number` | Sin restricción adicional declarada | Votos contados sobre `poll_votes`. No se devuelve `poll_options.vote_count`: ese contador es denormalizado y si quedó desfasado, mostrarlo haría que los porcentajes de la pantalla no sumen el total de la encuesta. | `1` |
| `totalVotes` | Sí | `number` | Sin restricción adicional declarada | Total de votos emitidos. | `1` |
| `actorVotedOptionIds` | No | `array<string>` | formato `uuid` | Opciones que votó el actor, si preguntó por sí mismo. Un arreglo vacío significa «no votó»; `undefined`, «no preguntó». La distinción importa porque una encuesta de opción múltiple tiene que poder marcar cada casilla elegida. | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Encuesta no encontrada | Excepción explícita en src/modules/community/services/community-polls-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/polls/{pollId}"
}
```

---

## 42. POST /community/polls/{pollId}/votes

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-polls`
- **Nombre:** Votar en una encuesta
- **Operation ID:** `CommunityPollsController_vote`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityPollsController.vote](../../src/modules/community/controllers/community-polls.controller.ts)

### Descripción de negocio

Votar en una encuesta. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/polls/{pollId}/votes` en `CommunityPollsController_vote`. El controlador delega en `CommunityPollsService.vote`. Valida el body como `CreateVoteDto` y consume `application/json`. El tipo de retorno estático es `Promise<VoteResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `pollId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateVoteDto`; los campos opcionales se omiten.

```http
POST /community/polls/00000000-0000-4000-8000-000000000001/votes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pollOptionId": "00000000-0000-4000-8000-000000000001",
  "voterProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `pollId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `pollOptionId` | Sí | `string` | formato `uuid` | Opción elegida | `00000000-0000-4000-8000-000000000001` |
| `voterProfileId` | Sí | `string` | formato `uuid` | Perfil votante | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/polls/00000000-0000-4000-8000-000000000001/votes HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "pollOptionId": "00000000-0000-4000-8000-000000000001",
  "voterProfileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<VoteResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<VoteResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `VoteResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Encuesta no encontrada | Excepción explícita en src/modules/community/services/community-polls.service.ts |
| 404 | `NOT_FOUND` | La opción no pertenece a la encuesta | Excepción explícita en src/modules/community/services/community-polls.service.ts |
| 409 | `CONFLICT` | Ya votó por esta opción | Excepción explícita en src/modules/community/services/community-polls.service.ts |
| 409 | `CONFLICT` | La encuesta admite un único voto por votante | Excepción explícita en src/modules/community/services/community-polls.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La encuesta está cerrada | Excepción explícita en src/modules/community/services/community-polls.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/polls/{pollId}/votes"
}
```

---

## 43. GET /community/posts/{postId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Publicación con media, hashtags y menciones
- **Operation ID:** `CommunitySocialController_getPost`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.getPost](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Publicación con media, hashtags y menciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Publicación con sus adjuntos, etiquetas y menciones.

### Descripción del sistema

NestJS resuelve `GET /community/posts/{postId}` en `CommunitySocialController_getPost`. El controlador delega en `CommunitySocialReadService.getPost`. No recibe body. El tipo de retorno estático es `Promise<PostDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `postId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/posts/00000000-0000-4000-8000-000000000001?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `postId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/posts/00000000-0000-4000-8000-000000000001?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PostDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PostDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PostDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PostDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PostDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PostDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PostDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "media": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "fileId": "00000000-0000-4000-8000-000000000001",
      "mediaRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "altText": "valor-ejemplo",
      "ordinal": 1
    }
  ],
  "hashtags": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "tag": "valor-ejemplo"
    }
  ],
  "mentions": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "mentionedProfileId": "00000000-0000-4000-8000-000000000001",
      "offsetStart": 1,
      "offsetEnd": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `media` | Sí | `array<PostMediaDto>` | Sin restricción adicional declarada | Adjuntos, en orden de despliegue. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","mediaRoleConceptId":"00000000-0000-4000-8000-000000000001","altText":"valor-ejemplo","ordinal":1}]` |
| `media[].id` | Sí | `string` | formato `uuid` | Identificador del adjunto. | `00000000-0000-4000-8000-000000000001` |
| `media[].fileId` | Sí | `string` | formato `uuid` | Archivo en `common.files`. | `00000000-0000-4000-8000-000000000001` |
| `media[].mediaRoleConceptId` | Sí | `string` | formato `uuid` | Concept id del rol del medio (imagen, video, documento). | `00000000-0000-4000-8000-000000000001` |
| `media[].altText` | No | `string` | admite null | Texto alternativo para lectores de pantalla. | `valor-ejemplo` |
| `media[].ordinal` | No | `number` | admite null | Orden de despliegue. | `1` |
| `hashtags` | Sí | `array<PostHashtagDto>` | Sin restricción adicional declarada | Etiquetas resueltas a texto. | `[{"id":"00000000-0000-4000-8000-000000000001","tag":"valor-ejemplo"}]` |
| `hashtags[].id` | Sí | `string` | formato `uuid` | Identificador de la etiqueta. | `00000000-0000-4000-8000-000000000001` |
| `hashtags[].tag` | Sí | `string` | Sin restricción adicional declarada | Texto de la etiqueta, listo para mostrar. | `valor-ejemplo` |
| `mentions` | Sí | `array<PostMentionDto>` | Sin restricción adicional declarada | Menciones activas del cuerpo. | `[{"id":"00000000-0000-4000-8000-000000000001","mentionedProfileId":"00000000-0000-4000-8000-000000000001","offsetStart":1,"offsetEnd":1}]` |
| `mentions[].id` | Sí | `string` | formato `uuid` | Identificador de la mención. | `00000000-0000-4000-8000-000000000001` |
| `mentions[].mentionedProfileId` | Sí | `string` | formato `uuid` | Perfil mencionado. | `00000000-0000-4000-8000-000000000001` |
| `mentions[].offsetStart` | No | `number` | admite null | Posición inicial dentro del texto. | `1` |
| `mentions[].offsetEnd` | No | `number` | admite null | Posición final dentro del texto. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Publicación no encontrada | Excepción explícita en src/modules/community/services/community-social-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/posts/{postId}"
}
```

---

## 44. GET /community/posts/{postId}/comments

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Comentarios de una publicación (hilo anidado)
- **Operation ID:** `CommunitySocialController_listPostComments`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.listPostComments](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Comentarios de una publicación (hilo anidado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Hilo de comentarios de una publicación.

### Descripción del sistema

NestJS resuelve `GET /community/posts/{postId}/comments` en `CommunitySocialController_listPostComments`. El controlador delega en `CommunitySocialReadService.listPostComments`. No recibe body. El tipo de retorno estático es `Promise<CommentThreadPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `postId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/posts/00000000-0000-4000-8000-000000000001/comments?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `postId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/posts/00000000-0000-4000-8000-000000000001/comments?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<CommentThreadPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<CommentThreadPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<CommentThreadPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<CommentThreadPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<CommentThreadPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<CommentThreadPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<CommentThreadPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `CommentThreadPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "authorProfileId": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "parentCommentId": "00000000-0000-4000-8000-000000000001",
      "threadDepth": 1,
      "replyCount": 1,
      "createdAt": "2026-07-31T12:00:00.000Z",
      "replies": [
        "<CommentThreadItemDto>"
      ],
      "media": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "fileId": "00000000-0000-4000-8000-000000000001",
          "mediaRoleConceptId": "00000000-0000-4000-8000-000000000001",
          "altText": "valor-ejemplo",
          "ordinal": 1
        }
      ]
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<CommentThreadItemDto>` | Sin restricción adicional declarada | Comentarios raíz de la página, cada uno con sus respuestas. | `[{"id":"00000000-0000-4000-8000-000000000001","authorProfileId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","parentCommentId":"00000000-0000-4000-8000-000000000001","threadDepth":1,"replyCount":1,"createdAt":"2026-07-31T12:00:00.000Z","replies":["<CommentThreadItemDto>"],"media":[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","mediaRoleConceptId":"00000000-0000-4000-8000-000000000001","altText":"valor-ejemplo","ordinal":1}]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del comentario. | `00000000-0000-4000-8000-000000000001` |
| `items[].authorProfileId` | Sí | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Cuerpo del comentario. | `valor-ejemplo` |
| `items[].parentCommentId` | No | `string` | formato `uuid`; admite null | Comentario padre, si es una respuesta. | `00000000-0000-4000-8000-000000000001` |
| `items[].threadDepth` | No | `number` | admite null | Profundidad dentro del hilo. | `1` |
| `items[].replyCount` | No | `number` | admite null | Cuántas respuestas tiene registradas. | `1` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se creó. | `2026-07-31T12:00:00.000Z` |
| `items[].replies` | Sí | `array<CommentThreadItemDto>` | Sin restricción adicional declarada | Respuestas anidadas de este comentario. | `["<CommentThreadItemDto>"]` |
| `items[].media` | Sí | `array<CommentMediaDto>` | Sin restricción adicional declarada | Adjuntos del comentario (REQ-01-011), en orden de despliegue. | `[{"id":"00000000-0000-4000-8000-000000000001","fileId":"00000000-0000-4000-8000-000000000001","mediaRoleConceptId":"00000000-0000-4000-8000-000000000001","altText":"valor-ejemplo","ordinal":1}]` |
| `items[].media[].id` | Sí | `string` | formato `uuid` | Identificador del adjunto. | `00000000-0000-4000-8000-000000000001` |
| `items[].media[].fileId` | Sí | `string` | formato `uuid` | Archivo en `common.files`. | `00000000-0000-4000-8000-000000000001` |
| `items[].media[].mediaRoleConceptId` | Sí | `string` | formato `uuid` | Concept id del rol del medio (imagen, sticker, GIF). | `00000000-0000-4000-8000-000000000001` |
| `items[].media[].altText` | No | `string` | admite null | Texto alternativo para lectores de pantalla. | `valor-ejemplo` |
| `items[].media[].ordinal` | No | `number` | admite null | Orden de despliegue. | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas raíces trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Publicación no encontrada | Excepción explícita en src/modules/community/services/community-social-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/posts/{postId}/comments"
}
```

---

## 45. POST /community/posts/{postId}/polls

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-polls`
- **Nombre:** Crear una encuesta con opciones sobre un post
- **Operation ID:** `CommunityPollsController_createPoll`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityPollsController.createPoll](../../src/modules/community/controllers/community-polls.controller.ts)

### Descripción de negocio

Crear una encuesta con opciones sobre un post. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bootstrap: crea una encuesta con sus opciones sobre un post.

### Descripción del sistema

NestJS resuelve `POST /community/posts/{postId}/polls` en `CommunityPollsController_createPoll`. El controlador delega en `CommunityPollsService.createPoll`. Valida el body como `CreatePollDto` y consume `application/json`. El tipo de retorno estático es `Promise<PollResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `postId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePollDto`; los campos opcionales se omiten.

```http
POST /community/posts/00000000-0000-4000-8000-000000000001/polls HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "question": "valor-ejemplo",
  "options": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `postId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `question` | Sí | `string` | longitud mínima 1; longitud máxima 300 | Pregunta | `valor-ejemplo` |
| `options` | Sí | `array<string>` | mínimo 2 elemento(s); máximo 10 elemento(s) | Opciones de la encuesta | `["valor-ejemplo","valor-ejemplo"]` |
| `allowsMultiple` | No | `boolean` | Sin restricción adicional declarada | Permite selección múltiple | `true` |
| `closesAt` | No | `string` | Sin restricción adicional declarada | Fecha de cierre | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/posts/00000000-0000-4000-8000-000000000001/polls HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PollResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PollResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PollResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "optionIds": [
    "valor-ejemplo"
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `optionIds` | Sí | `array<string>` | Sin restricción adicional declarada | Ids de las opciones creadas | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Post no encontrado | Excepción explícita en src/modules/community/services/community-polls.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/posts/{postId}/polls"
}
```

---

## 46. GET /community/posts/{postId}/reactions

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Reacciones de una publicación, agrupadas por tipo
- **Operation ID:** `CommunitySocialController_getPostReactions`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.getPostReactions](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Reacciones de una publicación, agrupadas por tipo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Resumen de reacciones de una publicación.

### Descripción del sistema

NestJS resuelve `GET /community/posts/{postId}/reactions` en `CommunitySocialController_getPostReactions`. El controlador delega en `CommunitySocialReadService.getPostReactions`. No recibe body. El tipo de retorno estático es `Promise<ReactionSummaryDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `postId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/posts/00000000-0000-4000-8000-000000000001/reactions?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `postId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/posts/00000000-0000-4000-8000-000000000001/reactions?actorProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReactionSummaryDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReactionSummaryDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ReactionSummaryDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ReactionSummaryDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ReactionSummaryDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReactionSummaryDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReactionSummaryDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReactionSummaryDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "tallies": [
    {
      "reactionTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "reactionType": "valor-ejemplo",
      "count": 1
    }
  ],
  "total": 1,
  "actorReactionTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "actorReactionType": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tallies` | Sí | `array<ReactionTallyDto>` | Sin restricción adicional declarada | Recuento por tipo. | `[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}]` |
| `tallies[].reactionTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de reacción. | `00000000-0000-4000-8000-000000000001` |
| `tallies[].reactionType` | No | `string` | admite null | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `valor-ejemplo` |
| `tallies[].count` | Sí | `number` | Sin restricción adicional declarada | Cantidad de reacciones de ese tipo. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Total de reacciones. | `1` |
| `actorReactionTypeConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `00000000-0000-4000-8000-000000000001` |
| `actorReactionType` | No | `string` | admite null | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Publicación no encontrada | Excepción explícita en src/modules/community/services/community-social-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/posts/{postId}/reactions"
}
```

---

## 47. GET /community/profiles/{profileId}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Ficha de un perfil público
- **Operation ID:** `CommunitySocialController_getProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.getProfile](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Ficha de un perfil público. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha del perfil, con sellos de verificación y prestigio.

### Descripción del sistema

NestJS resuelve `GET /community/profiles/{profileId}` en `CommunitySocialController_getProfile`. El controlador delega en `CommunitySocialReadService.getProfile`. No recibe body. El tipo de retorno estático es `Promise<PublicProfileDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicProfileDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarFileId": "00000000-0000-4000-8000-000000000001",
  "coverFileId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsReviews": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "badges": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "prestige": {
    "totalPoints": "valor-ejemplo",
    "levelConceptId": "00000000-0000-4000-8000-000000000001",
    "rankPosition": 1,
    "calculatedAt": "2026-07-31T12:00:00.000Z"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del perfil. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Organización a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `targetTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de sujeto (usuario, profesional, organización). | `00000000-0000-4000-8000-000000000001` |
| `kind` | No | `object` | valores: `PRACTITIONER`, `ORGANIZATION`, `PHARMACY`, `DIAGNOSTIC_UNIT`, `INSURER` | La vertical en claro, o `null` si este perfil no tiene ficha pública. `targetTypeConceptId` es un uuid de terminología y el cliente **no tiene su tabla**: sin esto tendría que adivinar a qué URL pública lleva un perfil —`/p`, `/o`, `/f`, `/l`, `/s`— o no ofrecer el enlace nunca. Es el mismo valor que publica el buscador anónimo, del mismo mapa. `null` en el perfil de un paciente: no se publica, y decirlo es parte de la respuesta. | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Ruta pública del perfil. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `Nombre de ejemplo` |
| `headline` | No | `string` | admite null | Titular o especialidad declarada. | `valor-ejemplo` |
| `biography` | No | `string` | admite null | Descripción larga. | `valor-ejemplo` |
| `avatarFileId` | No | `string` | formato `uuid`; admite null | Foto de perfil (`common.files`). | `00000000-0000-4000-8000-000000000001` |
| `coverFileId` | No | `string` | formato `uuid`; admite null | Imagen de portada (`common.files`). | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | No | `string` | formato `uuid`; admite null | Concept id del estado de verificación. | `00000000-0000-4000-8000-000000000001` |
| `acceptsReviews` | No | `boolean` | admite null | Si acepta reseñas de servicio. | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado del perfil. | `00000000-0000-4000-8000-000000000001` |
| `badges` | Sí | `array<VerifiedBadgeDto>` | Sin restricción adicional declarada | Sellos de verificación vigentes. | `[{"id":"00000000-0000-4000-8000-000000000001","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `badges[].id` | Sí | `string` | formato `uuid` | Identificador del sello. | `00000000-0000-4000-8000-000000000001` |
| `badges[].badgeTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de sello. | `00000000-0000-4000-8000-000000000001` |
| `badges[].verificationMethodConceptId` | Sí | `string` | formato `uuid` | Concept id del método con que se verificó. | `00000000-0000-4000-8000-000000000001` |
| `badges[].validFrom` | No | `string` | formato `date-time`; admite null | Desde cuándo rige. | `2026-07-31T12:00:00.000Z` |
| `badges[].validTo` | No | `string` | formato `date-time`; admite null | Hasta cuándo rige. | `2026-07-31T12:00:00.000Z` |
| `prestige` | No | `PrestigeScoreDto` | Sin restricción adicional declarada | Prestigio acumulado, si el perfil tiene saldo calculado. | `{"totalPoints":"valor-ejemplo","levelConceptId":"00000000-0000-4000-8000-000000000001","rankPosition":1,"calculatedAt":"2026-07-31T12:00:00.000Z"}` |
| `prestige.totalPoints` | No | `string` | Sin restricción adicional declarada | Puntos acumulados (numeric, viaja como texto) | `valor-ejemplo` |
| `prestige.levelConceptId` | No | `string` | formato `uuid`; admite null | Concept id del nivel alcanzado. | `00000000-0000-4000-8000-000000000001` |
| `prestige.rankPosition` | No | `number` | admite null | Posición en el ranking, si se calculó. | `1` |
| `prestige.calculatedAt` | No | `string` | formato `date-time`; admite null | Cuándo se recalculó por última vez. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Perfil público no encontrado | Excepción explícita en src/modules/community/services/community-social-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}"
}
```

---

## 48. GET /community/profiles/{profileId}/auto-reply

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Respuesta automática por inactividad del perfil
- **Operation ID:** `CommunitySocialController_getAutoReply`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.getAutoReply](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Respuesta automática por inactividad del perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.7 · La respuesta automática por inactividad de un perfil. **Va declarada antes que `profiles/:profileId`**, por el mismo motivo que `by-slug`: el router prueba en orden. `null` cuando nunca se configuró — que no es lo mismo que estar apagada, y la pantalla los dibuja distinto.

### Descripción del sistema

NestJS resuelve `GET /community/profiles/{profileId}/auto-reply` en `CommunitySocialController_getAutoReply`. El controlador delega en `CommunityChatAutoReplyService.get`. No recibe body. El tipo de retorno estático es `Promise<ChatAutoReplyDto | null>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001/auto-reply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001/auto-reply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ChatAutoReplyDto | null>` | No |
| 400 | Consulta completada correctamente. | `Promise<ChatAutoReplyDto | null>` | No |
| 401 | Consulta completada correctamente. | `Promise<ChatAutoReplyDto | null>` | No |
| 403 | Consulta completada correctamente. | `Promise<ChatAutoReplyDto | null>` | No |
| 404 | Consulta completada correctamente. | `Promise<ChatAutoReplyDto | null>` | No |
| 429 | Consulta completada correctamente. | `Promise<ChatAutoReplyDto | null>` | No |
| 500 | Consulta completada correctamente. | `Promise<ChatAutoReplyDto | null>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChatAutoReplyDto | null`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "publicProfileId": "00000000-0000-4000-8000-000000000001",
  "isActive": true,
  "inactivityMinutes": 1,
  "bodyText": "valor-ejemplo",
  "cooldownHours": 1,
  "onlyOutsideBusinessHours": true,
  "businessHoursFrom": "08:00",
  "businessHoursTo": "18:00",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la configuración. | `00000000-0000-4000-8000-000000000001` |
| `publicProfileId` | Sí | `string` | formato `uuid` | De quién es. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `inactivityMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cooldownHours` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `onlyOutsideBusinessHours` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `businessHoursFrom` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `businessHoursTo` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `18:00` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}/auto-reply"
}
```

---

## 49. PUT /community/profiles/{profileId}/auto-reply

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Configurar la respuesta automática del perfil
- **Operation ID:** `CommunitySocialController_upsertAutoReply`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.upsertAutoReply](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Configurar la respuesta automática del perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: F4.7 · Configura la respuesta automática del perfil. `PUT` y no `PATCH`: hay **una sola fila por perfil** y se manda entera, así que quien configura no tiene que saber si ya existía. Sólo el titular del perfil — lo comprueba el servicio, que es donde hay base para comprobarlo.

### Descripción del sistema

NestJS resuelve `PUT /community/profiles/{profileId}/auto-reply` en `CommunitySocialController_upsertAutoReply`. El controlador delega en `CommunityChatAutoReplyService.upsert`. Valida el body como `UpsertChatAutoReplyDto` y consume `application/json`. El tipo de retorno estático es `Promise<ChatAutoReplyDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertChatAutoReplyDto`; los campos opcionales se omiten.

```http
PUT /community/profiles/00000000-0000-4000-8000-000000000001/auto-reply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "isActive": true,
  "inactivityMinutes": 1,
  "bodyText": "valor-ejemplo",
  "cooldownHours": 1,
  "onlyOutsideBusinessHours": true
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Si la respuesta automática está encendida | `true` |
| `inactivityMinutes` | Sí | `number` | mínimo 1; máximo 1440 | Minutos de inactividad antes de contestar solo | `1` |
| `bodyText` | Sí | `string` | longitud mínima 1; longitud máxima 4000 | Texto de la respuesta | `valor-ejemplo` |
| `cooldownHours` | Sí | `number` | mínimo 1; máximo 168 | Horas de descanso antes de repetirle a la misma conversación | `1` |
| `onlyOutsideBusinessHours` | Sí | `boolean` | Sin restricción adicional declarada | Contestar sólo fuera del horario de atención | `true` |
| `businessHoursFrom` | No | `string` | patrón runtime `HORA` | Inicio del horario de atención | `08:00` |
| `businessHoursTo` | No | `string` | patrón runtime `HORA` | Fin del horario de atención | `18:00` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /community/profiles/00000000-0000-4000-8000-000000000001/auto-reply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ChatAutoReplyDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ChatAutoReplyDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "publicProfileId": "00000000-0000-4000-8000-000000000001",
  "isActive": true,
  "inactivityMinutes": 1,
  "bodyText": "valor-ejemplo",
  "cooldownHours": 1,
  "onlyOutsideBusinessHours": true,
  "businessHoursFrom": "08:00",
  "businessHoursTo": "18:00",
  "updatedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador de la configuración. | `00000000-0000-4000-8000-000000000001` |
| `publicProfileId` | Sí | `string` | formato `uuid` | De quién es. | `00000000-0000-4000-8000-000000000001` |
| `isActive` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `inactivityMinutes` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `cooldownHours` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `onlyOutsideBusinessHours` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `businessHoursFrom` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `08:00` |
| `businessHoursTo` | No | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `18:00` |
| `updatedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}/auto-reply"
}
```

---

## 50. GET /community/profiles/{profileId}/posts

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Publicaciones de un perfil
- **Operation ID:** `CommunitySocialController_listProfilePosts`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.listProfilePosts](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Publicaciones de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Muro del perfil, filtrado por lo que el lector puede ver.

### Descripción del sistema

NestJS resuelve `GET /community/profiles/{profileId}/posts` en `CommunitySocialController_listProfilePosts`. El controlador delega en `CommunitySocialReadService.listProfilePosts`. No recibe body. El tipo de retorno estático es `Promise<PostPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `actorProfileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001/posts?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001/posts?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PostPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PostPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PostPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PostPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PostPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PostPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PostPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "authorPublicProfileId": "00000000-0000-4000-8000-000000000001",
      "postTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "visibilityConceptId": "00000000-0000-4000-8000-000000000001",
      "commentsEnabled": true,
      "publishedAt": "2026-07-31T12:00:00.000Z",
      "editedAt": "2026-07-31T12:00:00.000Z",
      "reactions": {
        "tallies": [
          {
            "reactionTypeConceptId": "00000000-0000-4000-8000-000000000001",
            "reactionType": "valor-ejemplo",
            "count": 1
          }
        ],
        "total": 1,
        "actorReactionTypeConceptId": "00000000-0000-4000-8000-000000000001",
        "actorReactionType": "valor-ejemplo"
      },
      "commentCount": 1
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<PostListItemDto>` | Sin restricción adicional declarada | Publicaciones de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","authorPublicProfileId":"00000000-0000-4000-8000-000000000001","postTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","visibilityConceptId":"00000000-0000-4000-8000-000000000001","commentsEnabled":true,"publishedAt":"2026-07-31T12:00:00.000Z","editedAt":"2026-07-31T12:00:00.000Z","reactions":{"tallies":[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}],"total":1,"actorReactionTypeConceptId":"00000000-0000-4000-8000-000000000001","actorReactionType":"valor-ejemplo"},"commentCount":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].authorPublicProfileId` | Sí | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `items[].postTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Cuerpo del texto. | `valor-ejemplo` |
| `items[].visibilityConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la visibilidad declarada; nulo se lee como pública. | `00000000-0000-4000-8000-000000000001` |
| `items[].commentsEnabled` | No | `boolean` | admite null | Si admite comentarios. | `true` |
| `items[].publishedAt` | No | `string` | formato `date-time`; admite null | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `items[].editedAt` | No | `string` | formato `date-time`; admite null | Si fue editada, cuándo. | `2026-07-31T12:00:00.000Z` |
| `items[].reactions` | Sí | `ReactionSummaryDto` | Sin restricción adicional declarada | Reacciones de la publicación, con la del propio lector si tiene perfil. **Viaja con la fila y no en una lectura aparte** porque si no, la única forma de saber cuántas reacciones tiene cada publicación era pedir `GET /posts/{id}/reactions` una vez por tarjeta: cincuenta publicaciones, cincuenta peticiones. Sin esto, el conteo de la interfaz sólo podía ser el del gesto que el usuario acababa de hacer, y **al recargar volvía a cero** aunque la reacción estuviera guardada. | `{"tallies":[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}],"total":1,"actorReactionTypeConceptId":"00000000-0000-4000-8000-000000000001","actorReactionType":"valor-ejemplo"}` |
| `items[].reactions.tallies` | Sí | `array<ReactionTallyDto>` | Sin restricción adicional declarada | Recuento por tipo. | `[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","reactionType":"valor-ejemplo","count":1}]` |
| `items[].reactions.tallies[].reactionTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de reacción. | `00000000-0000-4000-8000-000000000001` |
| `items[].reactions.tallies[].reactionType` | No | `string` | admite null | El código del tipo (`LIKE`, `INSIGHTFUL`, …), el mismo con el que se escribe. Viaja junto al uuid porque el módulo **se escribe con la palabra y se leía sólo con el uuid**, y una interfaz que recibe el uuid no puede marcar el botón que le corresponde sin resolver terminología en cada render. Nulo sólo si la fila guarda un concepto que no está en el enum del módulo —dato viejo o escrito por fuera—: en ese caso se dice que no se pudo resolver, en lugar de inventar un código. | `valor-ejemplo` |
| `items[].reactions.tallies[].count` | Sí | `number` | Sin restricción adicional declarada | Cantidad de reacciones de ese tipo. | `1` |
| `items[].reactions.total` | Sí | `number` | Sin restricción adicional declarada | Total de reacciones. | `1` |
| `items[].reactions.actorReactionTypeConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `00000000-0000-4000-8000-000000000001` |
| `items[].reactions.actorReactionType` | No | `string` | admite null | El código de la reacción del propio actor, resuelto del concepto. Es lo que la interfaz necesita para pintar activo el botón correcto tras recargar. Sigue la misma distinción que el campo de arriba: ausente si no se preguntó, `null` si no reaccionó. | `valor-ejemplo` |
| `items[].commentCount` | Sí | `number` | Sin restricción adicional declarada | Comentarios vigentes del hilo completo, raíces y respuestas. Por la misma razón que el resumen de reacciones: el contador no existe como columna —y agregarla sería agregar esquema por comodidad de una lectura—, se calcula agrupado al leer la página. | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null` si no hay más. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}/posts"
}
```

---

## 51. POST /community/profiles/{profileId}/posts

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Publicar un post con hashtags, media y menciones
- **Operation ID:** `CommunitySocialController_publishPost`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.publishPost](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Publicar un post con hashtags, media y menciones. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/profiles/{profileId}/posts` en `CommunitySocialController_publishPost`. El controlador delega en `CommunitySocialService.publishPost`. Valida el body como `CreatePostDto` y consume `application/json`. El tipo de retorno estático es `Promise<PostResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePostDto`; los campos opcionales se omiten.

```http
POST /community/profiles/00000000-0000-4000-8000-000000000001/posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "bodyText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `bodyText` | Sí | `string` | longitud mínima 1; longitud máxima 5000 | Texto del post (sin PHI identificable) | `valor-ejemplo` |
| `postType` | No | `string` | valores: `TEXT`, `POLL` | Tipo de post | `TEXT` |
| `visibility` | No | `string` | valores: `PUBLIC`, `FOLLOWERS`, `PRIVATE` | Quién puede leer el post. Omitirlo equivale a PUBLIC, que es como se leen las publicaciones anteriores a este campo. | `PUBLIC` |
| `commentsEnabled` | No | `boolean` | Sin restricción adicional declarada | Comentarios habilitados | `true` |
| `media` | No | `array<PostMediaInputDto>` | máximo 20 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"fileId":"00000000-0000-4000-8000-000000000001","mediaRole":"IMAGE","altText":"valor-ejemplo","ordinal":1}]` |
| `media[].fileId` | No | `string` | formato `uuid` | Id del archivo (common.files) | `00000000-0000-4000-8000-000000000001` |
| `media[].mediaRole` | No | `string` | valores: `IMAGE`, `VIDEO`, `DOCUMENT` | Rol del medio | `IMAGE` |
| `media[].altText` | No | `string` | longitud máxima 300 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `media[].ordinal` | No | `number` | mínimo 0 | Orden de despliegue | `1` |
| `hashtags` | No | `array<string>` | máximo 30 elemento(s) | Hashtags (sin #) | `["aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"]` |
| `mentions` | No | `array<MentionInputDto>` | máximo 50 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"mentionedProfileId":"00000000-0000-4000-8000-000000000001","offsetStart":1,"offsetEnd":1}]` |
| `mentions[].mentionedProfileId` | No | `string` | formato `uuid` | Perfil mencionado | `00000000-0000-4000-8000-000000000001` |
| `mentions[].offsetStart` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `mentions[].offsetEnd` | No | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/profiles/00000000-0000-4000-8000-000000000001/posts HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PostResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PostResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PostResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "authorPublicProfileId": "00000000-0000-4000-8000-000000000001",
  "publicationStatus": "valor-ejemplo",
  "mediaCount": 1,
  "hashtagCount": 1,
  "publishedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `authorPublicProfileId` | Sí | `string` | formato `uuid` | Identificador asociado a author public profile. | `00000000-0000-4000-8000-000000000001` |
| `publicationStatus` | Sí | `string` | Sin restricción adicional declarada | Valor de publication status mantenido por la instancia. | `valor-ejemplo` |
| `mediaCount` | Sí | `number` | Sin restricción adicional declarada | Nº de adjuntos persistidos | `1` |
| `hashtagCount` | Sí | `number` | Sin restricción adicional declarada | Nº de hashtags vinculados | `1` |
| `publishedAt` | Sí | `string` | formato `date-time`; admite null | Valor de published at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Perfil autor no encontrado | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}/posts"
}
```

---

## 52. GET /community/profiles/{profileId}/reviews

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-reviews`
- **Nombre:** Reviews publicadas de un perfil
- **Operation ID:** `CommunityReviewsController_listProfileReviews`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityReviewsController.listProfileReviews](../../src/modules/community/controllers/community-reviews.controller.ts)

### Descripción de negocio

Reviews publicadas de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-11 (cara de lectura). Reviews publicadas de un perfil. La respuesta **no** incluye `verifiedEncounterId` ni el perfil del paciente que escribió: ver `ServiceReviewDto`.

### Descripción del sistema

NestJS resuelve `GET /community/profiles/{profileId}/reviews` en `CommunityReviewsController_listProfileReviews`. El controlador delega en `CommunityReviewsReadService.listProfileReviews`. No recibe body. El tipo de retorno estático es `Promise<ServiceReviewPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001/reviews?cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/profiles/00000000-0000-4000-8000-000000000001/reviews?cursor=valor-ejemplo&limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ServiceReviewPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ServiceReviewPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ServiceReviewPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ServiceReviewPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<ServiceReviewPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ServiceReviewPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ServiceReviewPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ServiceReviewPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "targetPublicProfileId": "00000000-0000-4000-8000-000000000001",
      "overallRating": 1,
      "reviewText": "valor-ejemplo",
      "reviewerDisplayModeConceptId": "00000000-0000-4000-8000-000000000001",
      "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
      "publishedAt": "2026-07-31T12:00:00.000Z",
      "editedAt": "2026-07-31T12:00:00.000Z",
      "dimensionScores": [
        {
          "dimensionConceptId": "00000000-0000-4000-8000-000000000001",
          "score": 1
        }
      ],
      "responses": [
        {
          "id": "00000000-0000-4000-8000-000000000001",
          "responderPublicProfileId": "00000000-0000-4000-8000-000000000001",
          "responseText": "valor-ejemplo",
          "publishedAt": "2026-07-31T12:00:00.000Z"
        }
      ]
    }
  ],
  "count": 1,
  "limit": 1,
  "nextCursor": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ServiceReviewDto>` | Sin restricción adicional declarada | Reviews de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","targetPublicProfileId":"00000000-0000-4000-8000-000000000001","overallRating":1,"reviewText":"valor-ejemplo","reviewerDisplayModeConceptId":"00000000-0000-4000-8000-000000000001","verificationStatusConceptId":"00000000-0000-4000-8000-000000000001","publishedAt":"2026-07-31T12:00:00.000Z","editedAt":"2026-07-31T12:00:00.000Z","dimensionScores":[{"dimensionConceptId":"00000000-0000-4000-8000-000000000001","score":1}],"responses":[{"id":"00000000-0000-4000-8000-000000000001","responderPublicProfileId":"00000000-0000-4000-8000-000000000001","responseText":"valor-ejemplo","publishedAt":"2026-07-31T12:00:00.000Z"}]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la review. | `00000000-0000-4000-8000-000000000001` |
| `items[].targetPublicProfileId` | Sí | `string` | formato `uuid` | Perfil calificado. | `00000000-0000-4000-8000-000000000001` |
| `items[].overallRating` | Sí | `number` | Sin restricción adicional declarada | Puntuación general. | `1` |
| `items[].reviewText` | No | `string` | admite null | Texto de la reseña. | `valor-ejemplo` |
| `items[].reviewerDisplayModeConceptId` | No | `string` | formato `uuid`; admite null | Concept id del modo de presentación del autor (con nombre, anónimo). | `00000000-0000-4000-8000-000000000001` |
| `items[].verificationStatusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado de verificación de la reseña. | `00000000-0000-4000-8000-000000000001` |
| `items[].publishedAt` | No | `string` | formato `date-time`; admite null | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `items[].editedAt` | No | `string` | formato `date-time`; admite null | Si fue editada, cuándo. | `2026-07-31T12:00:00.000Z` |
| `items[].dimensionScores` | Sí | `array<ReviewDimensionScoreDto>` | Sin restricción adicional declarada | Puntuaciones por dimensión. | `[{"dimensionConceptId":"00000000-0000-4000-8000-000000000001","score":1}]` |
| `items[].dimensionScores[].dimensionConceptId` | Sí | `string` | formato `uuid` | Concept id de la dimensión evaluada. | `00000000-0000-4000-8000-000000000001` |
| `items[].dimensionScores[].score` | Sí | `number` | Sin restricción adicional declarada | Puntuación otorgada. | `1` |
| `items[].responses` | Sí | `array<ReviewResponseItemDto>` | Sin restricción adicional declarada | Respuestas del calificado. | `[{"id":"00000000-0000-4000-8000-000000000001","responderPublicProfileId":"00000000-0000-4000-8000-000000000001","responseText":"valor-ejemplo","publishedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].responses[].id` | Sí | `string` | formato `uuid` | Identificador de la respuesta. | `00000000-0000-4000-8000-000000000001` |
| `items[].responses[].responderPublicProfileId` | Sí | `string` | formato `uuid` | Perfil que respondió. | `00000000-0000-4000-8000-000000000001` |
| `items[].responses[].responseText` | Sí | `string` | Sin restricción adicional declarada | Texto de la respuesta. | `valor-ejemplo` |
| `items[].responses[].publishedAt` | No | `string` | formato `date-time`; admite null | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Cursor de la página siguiente, o `null`. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Perfil público no encontrado | Excepción explícita en src/modules/community/services/community-reviews-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}/reviews"
}
```

---

## 53. POST /community/profiles/{profileId}/reviews

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-reviews`
- **Nombre:** Publicar una review verificada de servicio
- **Operation ID:** `CommunityReviewsController_publishReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityReviewsController.publishReview](../../src/modules/community/controllers/community-reviews.controller.ts)

### Descripción de negocio

Publicar una review verificada de servicio. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /community/profiles/{profileId}/reviews` en `CommunityReviewsController_publishReview`. El controlador delega en `CommunityReviewsService.publishReview`. Valida el body como `CommunityCreateReviewDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReviewResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CommunityCreateReviewDto`; los campos opcionales se omiten.

```http
POST /community/profiles/00000000-0000-4000-8000-000000000001/reviews HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "verifiedEncounterId": "00000000-0000-4000-8000-000000000001",
  "overallRating": 1
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `verifiedEncounterId` | Sí | `string` | formato `uuid` | Atención que respalda la reseña (nunca se expone) | `00000000-0000-4000-8000-000000000001` |
| `overallRating` | Sí | `number` | mínimo 1; máximo 5 | Calificación global 1..5 | `1` |
| `reviewText` | No | `string` | longitud máxima 4000 | Texto de la review | `valor-ejemplo` |
| `displayMode` | No | `string` | valores: `REAL_NAME`, `ANONYMOUS` | Modo de visualización del reviewer | `REAL_NAME` |
| `dimensions` | No | `array<ReviewDimensionInputDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"dimension":"COMMUNICATION","score":1}]` |
| `dimensions[].dimension` | No | `string` | valores: `COMMUNICATION`, `PUNCTUALITY`, `CLEANLINESS`, `OUTCOME` | Dimensión | `COMMUNICATION` |
| `dimensions[].score` | No | `number` | mínimo 1; máximo 5 | Puntuación 1..5 | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/profiles/00000000-0000-4000-8000-000000000001/reviews HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReviewResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReviewResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReviewResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "courseId": "00000000-0000-4000-8000-000000000001",
  "rating": 1,
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `courseId` | Sí | `string` | formato `uuid` | Identificador asociado a course. | `00000000-0000-4000-8000-000000000001` |
| `rating` | Sí | `number` | Sin restricción adicional declarada | Valor de rating mantenido por la instancia. | `1` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Identificador asociado a status concept. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo un paciente con atención registrada puede calificar | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 404 | `NOT_FOUND` | Perfil objetivo no encontrado | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 409 | `CONFLICT` | Ya existe una review verificada para este encuentro | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El perfil no acepta reviews | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 422 | `PRECONDITION_FAILED` | La atención declarada no habilita una reseña | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 422 | `PRECONDITION_FAILED` | La atención todavía no terminó | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 422 | `PRECONDITION_FAILED` | La atención declarada no fue con este profesional | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}/reviews"
}
```

---

## 54. POST /community/profiles/{profileId}/reviews/{reviewId}/responses

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-reviews`
- **Nombre:** Responder una reseña de la propia vitrina
- **Operation ID:** `CommunityReviewsController_respondToReview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityReviewsController.respondToReview](../../src/modules/community/controllers/community-reviews.controller.ts)

### Descripción de negocio

Responder una reseña de la propia vitrina. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-11: el profesional contesta una reseña de su propia vitrina. `community.review_responses` existía como tabla y la lectura ya devolvía las respuestas, pero no había forma de crear ninguna: un profesional podía ser calificado en público sin poder contestar.

### Descripción del sistema

NestJS resuelve `POST /community/profiles/{profileId}/reviews/{reviewId}/responses` en `CommunityReviewsController_respondToReview`. El controlador delega en `CommunityReviewsService.respondToReview`. Valida el body como `CommunityCreateReviewResponseDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `reviewId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CommunityCreateReviewResponseDto`; los campos opcionales se omiten.

```http
POST /community/profiles/00000000-0000-4000-8000-000000000001/reviews/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "responseText": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `profileId`, `reviewId`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `responseText` | Sí | `string` | longitud máxima 4000 | Respuesta del profesional | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/profiles/00000000-0000-4000-8000-000000000001/reviews/00000000-0000-4000-8000-000000000001/responses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "responseText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Perfil objetivo no encontrado | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 404 | `NOT_FOUND` | Reseña no encontrada | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 409 | `CONFLICT` | Ya respondiste esta reseña | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/{profileId}/reviews/{reviewId}/responses"
}
```

---

## 55. GET /community/profiles/by-slug/{slug}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Ficha de un perfil público por su slug
- **Operation ID:** `CommunitySocialController_getProfileBySlug`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.getProfileBySlug](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Ficha de un perfil público por su slug. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La misma ficha, por el slug del directorio público (carril P2). **Va declarada antes que `profiles/:profileId`**, y no es un detalle de estilo: el router prueba en orden, y aunque el parámetro lleva `ParseUUIDPipe` —que rechazaría `by-slug`— dejar que la ruta específica quede después de la genérica es la forma de que un cambio futuro del pipe la apague sin que nadie se entere.

### Descripción del sistema

NestJS resuelve `GET /community/profiles/by-slug/{slug}` en `CommunitySocialController_getProfileBySlug`. El controlador delega en `CommunitySocialReadService.getProfileBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicProfileDetailDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/profiles/by-slug/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/profiles/by-slug/valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicProfileDetailDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicProfileDetailDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarFileId": "00000000-0000-4000-8000-000000000001",
  "coverFileId": "00000000-0000-4000-8000-000000000001",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "acceptsReviews": true,
  "statusConceptId": "00000000-0000-4000-8000-000000000001",
  "badges": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z"
    }
  ],
  "prestige": {
    "totalPoints": "valor-ejemplo",
    "levelConceptId": "00000000-0000-4000-8000-000000000001",
    "rankPosition": 1,
    "calculatedAt": "2026-07-31T12:00:00.000Z"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador del perfil. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Organización a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `targetTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de sujeto (usuario, profesional, organización). | `00000000-0000-4000-8000-000000000001` |
| `kind` | No | `object` | valores: `PRACTITIONER`, `ORGANIZATION`, `PHARMACY`, `DIAGNOSTIC_UNIT`, `INSURER` | La vertical en claro, o `null` si este perfil no tiene ficha pública. `targetTypeConceptId` es un uuid de terminología y el cliente **no tiene su tabla**: sin esto tendría que adivinar a qué URL pública lleva un perfil —`/p`, `/o`, `/f`, `/l`, `/s`— o no ofrecer el enlace nunca. Es el mismo valor que publica el buscador anónimo, del mismo mapa. `null` en el perfil de un paciente: no se publica, y decirlo es parte de la respuesta. | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Ruta pública del perfil. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `Nombre de ejemplo` |
| `headline` | No | `string` | admite null | Titular o especialidad declarada. | `valor-ejemplo` |
| `biography` | No | `string` | admite null | Descripción larga. | `valor-ejemplo` |
| `avatarFileId` | No | `string` | formato `uuid`; admite null | Foto de perfil (`common.files`). | `00000000-0000-4000-8000-000000000001` |
| `coverFileId` | No | `string` | formato `uuid`; admite null | Imagen de portada (`common.files`). | `00000000-0000-4000-8000-000000000001` |
| `verificationStatusConceptId` | No | `string` | formato `uuid`; admite null | Concept id del estado de verificación. | `00000000-0000-4000-8000-000000000001` |
| `acceptsReviews` | No | `boolean` | admite null | Si acepta reseñas de servicio. | `true` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Concept id del estado del perfil. | `00000000-0000-4000-8000-000000000001` |
| `badges` | Sí | `array<VerifiedBadgeDto>` | Sin restricción adicional declarada | Sellos de verificación vigentes. | `[{"id":"00000000-0000-4000-8000-000000000001","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z"}]` |
| `badges[].id` | Sí | `string` | formato `uuid` | Identificador del sello. | `00000000-0000-4000-8000-000000000001` |
| `badges[].badgeTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de sello. | `00000000-0000-4000-8000-000000000001` |
| `badges[].verificationMethodConceptId` | Sí | `string` | formato `uuid` | Concept id del método con que se verificó. | `00000000-0000-4000-8000-000000000001` |
| `badges[].validFrom` | No | `string` | formato `date-time`; admite null | Desde cuándo rige. | `2026-07-31T12:00:00.000Z` |
| `badges[].validTo` | No | `string` | formato `date-time`; admite null | Hasta cuándo rige. | `2026-07-31T12:00:00.000Z` |
| `prestige` | No | `PrestigeScoreDto` | Sin restricción adicional declarada | Prestigio acumulado, si el perfil tiene saldo calculado. | `{"totalPoints":"valor-ejemplo","levelConceptId":"00000000-0000-4000-8000-000000000001","rankPosition":1,"calculatedAt":"2026-07-31T12:00:00.000Z"}` |
| `prestige.totalPoints` | No | `string` | Sin restricción adicional declarada | Puntos acumulados (numeric, viaja como texto) | `valor-ejemplo` |
| `prestige.levelConceptId` | No | `string` | formato `uuid`; admite null | Concept id del nivel alcanzado. | `00000000-0000-4000-8000-000000000001` |
| `prestige.rankPosition` | No | `number` | admite null | Posición en el ranking, si se calculó. | `1` |
| `prestige.calculatedAt` | No | `string` | formato `date-time`; admite null | Cuándo se recalculó por última vez. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | Sólo el titular del perfil puede leer su contenido privado | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 404 | `NOT_FOUND` | Perfil no encontrado | Excepción explícita en src/modules/community/services/community-social-read.service.ts |
| 404 | `NOT_FOUND` | Perfil público no encontrado | Excepción explícita en src/modules/community/services/community-social-read.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/by-slug/{slug}"
}
```

---

## 56. GET /community/profiles/me

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Consultar la vitrina pública propia
- **Operation ID:** `CommunitySocialController_getOwnProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.getOwnProfile](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Consultar la vitrina pública propia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: La vitrina pública propia, o `null` si todavía no creó ninguna. Sin `@Roles`: cualquier sesión autenticada puede pedir la suya, porque el sujeto lo resuelve el servidor y no hay forma de pedir la de otro. Va declarado **antes** que `profiles/:profileId`: Nest resuelve las rutas por orden de declaración y un parámetro capturaría `me`.

### Descripción del sistema

NestJS resuelve `GET /community/profiles/me` en `CommunitySocialController_getOwnProfile`. El controlador delega en `CommunitySocialService.getOwnProfile`. No recibe body. El tipo de retorno estático es `Promise<OwnPublicProfileDto | null>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/profiles/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/profiles/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OwnPublicProfileDto | null>` | No |
| 400 | Consulta completada correctamente. | `Promise<OwnPublicProfileDto | null>` | No |
| 401 | Consulta completada correctamente. | `Promise<OwnPublicProfileDto | null>` | No |
| 403 | Consulta completada correctamente. | `Promise<OwnPublicProfileDto | null>` | No |
| 429 | Consulta completada correctamente. | `Promise<OwnPublicProfileDto | null>` | No |
| 500 | Consulta completada correctamente. | `Promise<OwnPublicProfileDto | null>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OwnPublicProfileDto | null`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "acceptsReviews": true,
  "visibility": "PUBLIC",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "avatarFileId": "00000000-0000-4000-8000-000000000001",
  "coverFileId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetId` | Sí | `string` | formato `uuid` | El sujeto que representa: el perfil profesional, o la cuenta. | `00000000-0000-4000-8000-000000000001` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `acceptsReviews` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `visibility` | Sí | `string` | valores: `PUBLIC`, `PRIVATE` | Si la vitrina está listada en el directorio público. Se devuelve como el código y no como el concept id: es la única forma de que la pantalla de edición muestre el interruptor en la posición correcta sin tener que resolver un uuid contra el catálogo de conceptos. `PRIVATE` cubre también la columna nula — las vitrinas anteriores a este campo. | `PUBLIC` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid`; admite null | Lo otorga la plataforma; se muestra, no se declara. | `00000000-0000-4000-8000-000000000001` |
| `avatarFileId` | Sí | `string` | formato `uuid`; admite null | La foto de la vitrina, o `null` si todavía no subió ninguna. Viaja porque es una de las tres condiciones que hacen a un perfil "completo" para presentar un grupo público (TP-3, regla 06), y sin ella la pantalla no puede anticipar el rechazo: tendría que dejar que la persona llene el formulario entero para enterarse recién al enviar. | `00000000-0000-4000-8000-000000000001` |
| `coverFileId` | Sí | `string` | formato `uuid`; admite null | La portada de la vitrina, o `null` si todavía no subió ninguna. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/me"
}
```

---

## 57. PUT /community/profiles/me

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Crear o actualizar la vitrina pública propia
- **Operation ID:** `CommunitySocialController_upsertOwnProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.upsertOwnProfile](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Crear o actualizar la vitrina pública propia. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Crea o actualiza la vitrina pública propia. Idempotente: la pantalla que la edita no necesita saber si ya existía.

### Descripción del sistema

NestJS resuelve `PUT /community/profiles/me` en `CommunitySocialController_upsertOwnProfile`. El controlador delega en `CommunitySocialService.upsertOwnProfile`. Valida el body como `UpsertOwnPublicProfileDto` y consume `application/json`. El tipo de retorno estático es `Promise<OwnPublicProfileDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpsertOwnPublicProfileDto`; los campos opcionales se omiten.

```http
PUT /community/profiles/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Organización propietaria | `00000000-0000-4000-8000-000000000001` |
| `slug` | Sí | `string` | longitud mínima 3; longitud máxima 120; patrón runtime `/^[a-z0-9]+(?:-[a-z0-9]+)*$/` | Slug único legible | `valor-ejemplo` |
| `displayName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre visible | `Nombre de ejemplo` |
| `headline` | No | `string` | longitud máxima 200 | Titular de una línea | `valor-ejemplo` |
| `biography` | No | `string` | longitud máxima 2000 | Presentación pública | `valor-ejemplo` |
| `acceptsReviews` | No | `boolean` | Sin restricción adicional declarada | Acepta reseñas | `true` |
| `visibility` | No | `string` | valores: `PUBLIC`, `PRIVATE` | Listar la vitrina en el directorio público | `PUBLIC` |
| `avatarFileId` | No | `object` | formato `uuid`; admite null | Archivo ya subido que será el avatar; null lo quita | `{}` |
| `coverFileId` | No | `object` | formato `uuid`; admite null | Archivo ya subido que será la portada; null la quita | `{}` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /community/profiles/me HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 400 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 401 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 403 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 409 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 413 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 422 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 429 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |
| 500 | Operación completada correctamente. | `Promise<OwnPublicProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `OwnPublicProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "acceptsReviews": true,
  "visibility": "PUBLIC",
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "avatarFileId": "00000000-0000-4000-8000-000000000001",
  "coverFileId": "00000000-0000-4000-8000-000000000001",
  "statusConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `targetId` | Sí | `string` | formato `uuid` | El sujeto que representa: el perfil profesional, o la cuenta. | `00000000-0000-4000-8000-000000000001` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `acceptsReviews` | Sí | `boolean` | admite null | Sin descripción específica en el contrato OpenAPI. | `true` |
| `visibility` | Sí | `string` | valores: `PUBLIC`, `PRIVATE` | Si la vitrina está listada en el directorio público. Se devuelve como el código y no como el concept id: es la única forma de que la pantalla de edición muestre el interruptor en la posición correcta sin tener que resolver un uuid contra el catálogo de conceptos. `PRIVATE` cubre también la columna nula — las vitrinas anteriores a este campo. | `PUBLIC` |
| `verificationStatusConceptId` | Sí | `string` | formato `uuid`; admite null | Lo otorga la plataforma; se muestra, no se declara. | `00000000-0000-4000-8000-000000000001` |
| `avatarFileId` | Sí | `string` | formato `uuid`; admite null | La foto de la vitrina, o `null` si todavía no subió ninguna. Viaja porque es una de las tres condiciones que hacen a un perfil "completo" para presentar un grupo público (TP-3, regla 06), y sin ella la pantalla no puede anticipar el rechazo: tendría que dejar que la persona llene el formulario entero para enterarse recién al enviar. | `00000000-0000-4000-8000-000000000001` |
| `coverFileId` | Sí | `string` | formato `uuid`; admite null | La portada de la vitrina, o `null` si todavía no subió ninguna. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | ${labels.subject} no le pertenece | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 404 | `NOT_FOUND` | labels.notFound | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 409 | `CONFLICT` | Ese enlace ya está en uso | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se pudo recuperar el perfil público recién guardado | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} está borrado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no tiene una versión vigente | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} resultó infectado | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 422 | `PRECONDITION_FAILED` | ${labels.subject} no es de un formato admitido para este uso | Excepción explícita en src/modules/common/services/attachable-file.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/me"
}
```

---

## 58. GET /community/profiles/me/stats

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Estadísticas de la vitrina pública propia
- **Operation ID:** `CommunitySocialController_ownProfileStats`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.ownProfileStats](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Visitas y apariciones en búsquedas de los últimos 7 días. Son visitas, no visitantes únicos: no se guarda ningún rastro del visitante.

Contexto declarado en el controlador: «Tu perfil esta semana» (`ORG-PUB-005`). Va declarado **antes** que `profiles/:profileId`, igual que `profiles/me`: Nest resuelve por orden de declaración y un parámetro capturaría `me`. Sin `@Roles`: el sujeto lo resuelve el servidor desde la sesión, así que no hay forma de pedir las estadísticas de otro. Es la misma regla que `GET profiles/me`.

### Descripción del sistema

NestJS resuelve `GET /community/profiles/me/stats` en `CommunitySocialController_ownProfileStats`. El controlador delega en `CommunitySocialService.getOwnProfileStats`. No recibe body. El tipo de retorno estático es `Promise<ProfileStatsDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/profiles/me/stats HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/profiles/me/stats HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ProfileStatsDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<ProfileStatsDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<ProfileStatsDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<ProfileStatsDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<ProfileStatsDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<ProfileStatsDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ProfileStatsDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "windowDays": 1,
  "views": 1,
  "searchAppearances": 1,
  "daily": [
    {
      "date": "valor-ejemplo",
      "views": 1,
      "searchAppearances": 1
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `windowDays` | Sí | `number` | Sin restricción adicional declarada | Días que cubre la ventana | `1` |
| `views` | Sí | `number` | Sin restricción adicional declarada | Visitas a la ficha en la ventana | `1` |
| `searchAppearances` | Sí | `number` | Sin restricción adicional declarada | Apariciones en resultados en la ventana | `1` |
| `daily` | Sí | `array<ProfileStatsDayDto>` | Sin restricción adicional declarada | Del más viejo al más nuevo | `[{"date":"valor-ejemplo","views":1,"searchAppearances":1}]` |
| `daily[].date` | Sí | `string` | Sin restricción adicional declarada | Día en YYYY-MM-DD (UTC) | `valor-ejemplo` |
| `daily[].views` | Sí | `number` | Sin restricción adicional declarada | Visitas a la ficha pública ese día | `1` |
| `daily[].searchAppearances` | Sí | `number` | Sin restricción adicional declarada | Veces que apareció en resultados ese día | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/profiles/me/stats"
}
```

---

## 59. POST /community/public-profiles

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Crear un perfil público (bootstrap del grafo social)
- **Operation ID:** `CommunitySocialController_createProfile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.createProfile](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Crear un perfil público (bootstrap del grafo social). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bootstrap: crea el perfil público (nodo raíz social).

### Descripción del sistema

NestJS resuelve `POST /community/public-profiles` en `CommunitySocialController_createProfile`. El controlador delega en `CommunitySocialService.createProfile`. Valida el body como `CreatePublicProfileDto` y consume `application/json`. El tipo de retorno estático es `Promise<PublicProfileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreatePublicProfileDto`; los campos opcionales se omiten.

```http
POST /community/public-profiles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tenantId` | Sí | `string` | formato `uuid` | Tenant propietario | `00000000-0000-4000-8000-000000000001` |
| `targetId` | Sí | `string` | formato `uuid` | Id del sujeto proyectado (user/patient/org de otro módulo) | `00000000-0000-4000-8000-000000000001` |
| `targetType` | No | `string` | valores: `USER`, `PRACTITIONER`, `ORGANIZATION` | Tipo de sujeto | `USER` |
| `slug` | Sí | `string` | longitud mínima 1; longitud máxima 120 | Slug único legible | `valor-ejemplo` |
| `displayName` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Nombre visible | `Nombre de ejemplo` |
| `headline` | No | `string` | longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | No | `string` | longitud máxima 2000 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `visibility` | No | `string` | valores: `PUBLIC`, `PRIVATE` | Visibilidad de la vitrina; omitirla la deja privada | `PUBLIC` |
| `acceptsReviews` | No | `boolean` | Sin restricción adicional declarada | Acepta reviews de servicio | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/public-profiles HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

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

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<PublicProfileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicProfileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Valor de slug mantenido por la instancia. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Valor de display name mantenido por la instancia. | `Nombre de ejemplo` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/public-profiles"
}
```

---

## 60. PUT /community/reactions

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Reaccionar a contenido (upsert una reacción por actor/objeto)
- **Operation ID:** `CommunitySocialController_react`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.react](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Reaccionar a contenido (upsert una reacción por actor/objeto). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PUT /community/reactions` en `CommunitySocialController_react`. El controlador delega en `CommunitySocialService.react`. Valida el body como `ReactionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReactionResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReactionDto`; los campos opcionales se omiten.

```http
PUT /community/reactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "actorProfileId": "00000000-0000-4000-8000-000000000001",
  "reactableType": "POST",
  "reactableRefId": "00000000-0000-4000-8000-000000000001",
  "reactionType": "LIKE"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `actorProfileId` | Sí | `string` | formato `uuid` | Perfil que reacciona | `00000000-0000-4000-8000-000000000001` |
| `reactableType` | Sí | `string` | valores: `POST`, `COMMENT`, `REVIEW` | Tipo de objeto | `POST` |
| `reactableRefId` | Sí | `string` | formato `uuid` | Id del objeto | `00000000-0000-4000-8000-000000000001` |
| `reactionType` | Sí | `string` | valores: `LIKE`, `LOVE`, `INSIGHTFUL`, `CELEBRATE`, `SUPPORT` | Tipo de reacción | `LIKE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PUT /community/reactions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "actorProfileId": "00000000-0000-4000-8000-000000000001",
  "reactableType": "POST",
  "reactableRefId": "00000000-0000-4000-8000-000000000001",
  "reactionType": "LIKE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReactionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReactionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "created": true,
  "reactionType": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `created` | Sí | `boolean` | Sin restricción adicional declarada | true si se creó, false si se actualizó una existente | `true` |
| `reactionType` | Sí | `string` | Sin restricción adicional declarada | Valor de reaction type mantenido por la instancia. | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 403 | `FORBIDDEN` | No se puede escribir en el grafo social con un perfil ajeno | Excepción explícita en src/modules/community/services/community-visibility.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/reactions"
}
```

---

## 61. POST /community/reports

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-moderation`
- **Nombre:** Reportar contenido y encolar moderación
- **Operation ID:** `CommunityModerationController_report`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityModerationController.report](../../src/modules/community/controllers/community-moderation.controller.ts)

### Descripción de negocio

Reportar contenido y encolar moderación. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-19-08 (cualquier miembro puede reportar).

### Descripción del sistema

NestJS resuelve `POST /community/reports` en `CommunityModerationController_report`. El controlador delega en `CommunityModerationService.report`. Valida el body como `CreateReportDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReportResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateReportDto`; los campos opcionales se omiten.

```http
POST /community/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetType": "POST",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reason": "SPAM"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetType` | Sí | `string` | valores: `POST`, `COMMENT`, `PROFILE`, `MESSAGE`, `REVIEW` | Tipo de contenido reportado | `POST` |
| `targetId` | Sí | `string` | formato `uuid` | Id del contenido reportado | `00000000-0000-4000-8000-000000000001` |
| `reason` | Sí | `string` | valores: `SPAM`, `ABUSE`, `MISINFORMATION`, `PHI`, `OTHER` | Motivo | `SPAM` |
| `detailText` | No | `string` | longitud máxima 2000 | Detalle libre | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /community/reports HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetType": "POST",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "reason": "SPAM",
  "detailText": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ReportResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReportResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReportResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "moderationQueueId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `moderationQueueId` | Sí | `string` | formato `uuid` | Entrada de cola de moderación asociada | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/reports"
}
```

---

## 62. GET /community/topics

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-groups`
- **Nombre:** Temas de la comunidad
- **Operation ID:** `CommunityTopicsController_listTopics`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityTopicsController.listTopics](../../src/modules/community/controllers/community-topics.controller.ts)

### Descripción de negocio

Temas de la comunidad. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Temas activos con los que se clasifican grupos y publicaciones.

### Descripción del sistema

NestJS resuelve `GET /community/topics` en `CommunityTopicsController_listTopics`. El controlador delega en `CommunityGroupsReadService.listTopics`. No recibe body. El tipo de retorno estático es `Promise<TopicPageDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/topics HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /community/topics HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<TopicPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<TopicPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<TopicPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<TopicPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<TopicPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<TopicPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `TopicPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "code": "CODIGO_EJEMPLO",
      "name": "Nombre de ejemplo",
      "parentTopicId": "00000000-0000-4000-8000-000000000001",
      "specialtyConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ],
  "count": 1,
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<TopicListItemDto>` | Sin restricción adicional declarada | Temas devueltos. | `[{"id":"00000000-0000-4000-8000-000000000001","code":"CODIGO_EJEMPLO","name":"Nombre de ejemplo","parentTopicId":"00000000-0000-4000-8000-000000000001","specialtyConceptId":"00000000-0000-4000-8000-000000000001"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del tema. | `00000000-0000-4000-8000-000000000001` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código estable. | `CODIGO_EJEMPLO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre visible. | `Nombre de ejemplo` |
| `items[].parentTopicId` | No | `string` | formato `uuid`; admite null | Tema padre, si cuelga de otro. | `00000000-0000-4000-8000-000000000001` |
| `items[].specialtyConceptId` | No | `string` | formato `uuid`; admite null | Especialidad con la que se corresponde, si se declaró. | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántos trae. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/community/topics"
}
```

---

## 63. GET /f/{slug}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Ficha pública de una farmacia
- **Operation ID:** `CommunityPublicController_getPharmacy`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.getPharmacy](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Ficha pública de una farmacia. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha pública de una farmacia.

### Descripción del sistema

NestJS resuelve `GET /f/{slug}` en `CommunityPublicController_getPharmacy`. El controlador delega en `CommunityPublicService.getBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicDirectoryProfileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /f/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /f/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicDirectoryProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarUrl": "valor-ejemplo",
  "coverUrl": "valor-ejemplo",
  "verified": true,
  "city": "valor-ejemplo",
  "address": "valor-ejemplo",
  "location": {
    "lat": 1,
    "lng": 1
  },
  "specialties": [
    "valor-ejemplo"
  ],
  "trajectory": [
    {
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
    }
  ],
  "practiceSites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "location": {
        "lat": 1,
        "lng": 1
      },
      "isOwn": true
    }
  ],
  "ratingAverage": 1,
  "ratingCount": 1,
  "acceptsReviews": true,
  "verifiedBadge": {
    "status": "VERIFIED",
    "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
    "verifiedAt": "valor-ejemplo",
    "validUntil": "valor-ejemplo"
  },
  "hasPublishedAgenda": true,
  "nextAvailableDate": "valor-ejemplo",
  "posts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "publishedAt": "valor-ejemplo",
      "mediaUrls": [
        "valor-ejemplo"
      ],
      "reactionCount": 1,
      "commentCount": 1
    }
  ],
  "updatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `avatarUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `coverUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `location` | No | `PublicLocationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lat":1,"lng":1}` |
| `location.lat` | No | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `location.lng` | No | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `specialties` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `trajectory` | Sí | `array<PublicAffiliationDto>` | Sin restricción adicional declarada | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `[{"organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","startDate":"2026-07-31","endDate":"2026-07-31"}]` |
| `trajectory[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución, tal como la declaró el profesional | `Nombre de ejemplo` |
| `trajectory[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo ejercido | `valor-ejemplo` |
| `trajectory[].departmentText` | Sí | `string` | admite null | Servicio o departamento, si lo declaró | `valor-ejemplo` |
| `trajectory[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo | `2026-07-31` |
| `trajectory[].endDate` | Sí | `string` | formato `date`; admite null | Fin del vínculo, o null si sigue vigente | `2026-07-31` |
| `practiceSites` | Sí | `array<PublicPracticeSiteDto>` | Sin restricción adicional declarada | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","location":{"lat":1,"lng":1},"isOwn":true}]` |
| `practiceSites[].id` | Sí | `string` | formato `uuid` | Identificador de la sede | `00000000-0000-4000-8000-000000000001` |
| `practiceSites[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede | `Nombre de ejemplo` |
| `practiceSites[].addressText` | Sí | `string` | admite null | Dirección en una línea, o null si la sede no cargó ninguna | `valor-ejemplo` |
| `practiceSites[].location` | Sí | `PublicLocationDto` | Sin restricción adicional declarada | Punto de la sede; null si su dirección no tiene coordenadas | `{"lat":1,"lng":1}` |
| `practiceSites[].location.lat` | Sí | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `practiceSites[].location.lng` | Sí | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `practiceSites[].isOwn` | Sí | `boolean` | Sin restricción adicional declarada | Si es un consultorio propio del profesional y no la sede de una organización | `true` |
| `ratingAverage` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `ratingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsReviews` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `verifiedBadge` | Sí | `PublicVerifiedBadgeDto` | Sin restricción adicional declarada | El mismo sello y la misma semántica que en el buscador | `{"status":"VERIFIED","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"valor-ejemplo","validUntil":"valor-ejemplo"}` |
| `verifiedBadge.status` | Sí | `string` | valores: `VERIFIED`, `EXPIRED`, `NONE` | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `VERIFIED` |
| `verifiedBadge.badgeTypeConceptId` | Sí | `string` | admite null | Qué se verificó | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verificationMethodConceptId` | Sí | `string` | admite null | Cómo se verificó (autoridad externa, alta manual auditada) | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verifiedAt` | Sí | `string` | admite null | Desde cuándo vale, ISO | `valor-ejemplo` |
| `verifiedBadge.validUntil` | Sí | `string` | admite null | Hasta cuándo vale, ISO | `valor-ejemplo` |
| `hasPublishedAgenda` | Sí | `boolean` | Sin restricción adicional declarada | Si tiene agenda publicada | `true` |
| `nextAvailableDate` | Sí | `string` | admite null | Primer día con hueco (YYYY-MM-DD) | `valor-ejemplo` |
| `posts` | Sí | `array<PublicPostSummaryDto>` | Sin restricción adicional declarada | Máx. 20 | `[{"id":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","publishedAt":"valor-ejemplo","mediaUrls":["valor-ejemplo"],"reactionCount":1,"commentCount":1}]` |
| `posts[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `posts[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `posts[].publishedAt` | Sí | `string` | Sin restricción adicional declarada | Instante ISO-8601 en UTC | `valor-ejemplo` |
| `posts[].mediaUrls` | Sí | `array<string>` | Sin restricción adicional declarada | Vacío, nunca null | `["valor-ejemplo"]` |
| `posts[].reactionCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `posts[].commentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `updatedAt` | Sí | `string` | Sin restricción adicional declarada | Alimenta el ETag y el <lastmod> del sitemap | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/f/{slug}"
}
```

---

## 64. GET /internal/community/feed/pending

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-feed`
- **Nombre:** Publicaciones publicadas sin fan-out
- **Operation ID:** `CommunityFeedController_pending`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityFeedController.pending](../../src/modules/community/controllers/community-feed.controller.ts)

### Descripción de negocio

Publicaciones publicadas sin fan-out. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lote de publicaciones pendientes de repartir, con sus destinatarios. Es el paso previo de `rebuild`, que necesita la lista de seguidores ya resuelta y no la puede deducir sola.

### Descripción del sistema

NestJS resuelve `GET /internal/community/feed/pending` en `CommunityFeedController_pending`. El controlador delega en `CommunityFeedService.pendingFanout`. No recibe body. El tipo de retorno estático es `Promise<FeedPendingResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /internal/community/feed/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /internal/community/feed/pending?limit=1 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FeedPendingResponseDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<FeedPendingResponseDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<FeedPendingResponseDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<FeedPendingResponseDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<FeedPendingResponseDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<FeedPendingResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FeedPendingResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "postId": "00000000-0000-4000-8000-000000000001",
      "authorProfileId": "00000000-0000-4000-8000-000000000001",
      "followerProfileIds": [
        "valor-ejemplo"
      ]
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<FeedPendingItemDto>` | Sin restricción adicional declarada | Publicaciones pendientes del lote. | `[{"postId":"00000000-0000-4000-8000-000000000001","authorProfileId":"00000000-0000-4000-8000-000000000001","followerProfileIds":["valor-ejemplo"]}]` |
| `items[].postId` | Sí | `string` | formato `uuid` | Post publicado sin fan-out | `00000000-0000-4000-8000-000000000001` |
| `items[].authorProfileId` | Sí | `string` | formato `uuid` | Perfil autor | `00000000-0000-4000-8000-000000000001` |
| `items[].followerProfileIds` | Sí | `array<string>` | Sin restricción adicional declarada | Perfiles destinatarios | `["valor-ejemplo"]` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/community/feed/pending"
}
```

---

## 65. POST /internal/community/feed/rebuild

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-feed`
- **Nombre:** Generar feed (fan-out y ranking)
- **Operation ID:** `CommunityFeedController_rebuild`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityFeedController.rebuild](../../src/modules/community/controllers/community-feed.controller.ts)

### Descripción de negocio

Generar feed (fan-out y ranking). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /internal/community/feed/rebuild` en `CommunityFeedController_rebuild`. El controlador delega en `CommunityFeedService.rebuild`. Valida el body como `RebuildFeedDto` y consume `application/json`. El tipo de retorno estático es `Promise<FeedRebuildResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RebuildFeedDto`; los campos opcionales se omiten.

```http
POST /internal/community/feed/rebuild HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceRefId": "00000000-0000-4000-8000-000000000001",
  "followerProfileIds": [
    "valor-ejemplo"
  ]
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `sourceRefId` | Sí | `string` | formato `uuid` | Post fuente publicado | `00000000-0000-4000-8000-000000000001` |
| `followerProfileIds` | Sí | `array<string>` | formato `uuid` | Perfiles destinatarios (seguidores) | `["valor-ejemplo"]` |
| `origin` | No | `string` | valores: `FOLLOWING`, `GROUP`, `TOPIC`, `SUGGESTED`, `PROMOTED` | Origen del item | `FOLLOWING` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/community/feed/rebuild HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "sourceRefId": "00000000-0000-4000-8000-000000000001",
  "followerProfileIds": [
    "valor-ejemplo"
  ],
  "origin": "FOLLOWING"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FeedRebuildResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FeedRebuildResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "itemsCreated": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `itemsCreated` | Sí | `number` | Sin restricción adicional declarada | Nº de items de feed insertados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/community/feed/rebuild"
}
```

---

## 66. GET /internal/community/search/health

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community`
- **Nombre:** Estado del índice del directorio público
- **Operation ID:** `CommunitySearchIndexController_health`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySearchIndexController.health](../../src/modules/community/controllers/community-search-index.controller.ts)

### Descripción de negocio

Estado del índice del directorio público. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Estado del índice frente a la base: cuántos perfiles hay y cuántos indexados. Es lo que mira el worker antes de decidir si hace falta un barrido, y lo que responde «¿el buscador está sirviendo el índice o el SQL?» sin tener que provocar una búsqueda.

### Descripción del sistema

NestJS resuelve `GET /internal/community/search/health` en `CommunitySearchIndexController_health`. El controlador delega en `CommunitySearchIndexService.health`. No recibe body. El tipo de retorno estático es `Promise<SearchIndexHealthDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /internal/community/search/health HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`, `SEARCH_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /internal/community/search/health HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<SearchIndexHealthDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<SearchIndexHealthDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<SearchIndexHealthDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<SearchIndexHealthDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<SearchIndexHealthDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<SearchIndexHealthDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `SearchIndexHealthDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "available": true,
  "profiles": 1,
  "documents": 1,
  "serving": true
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `available` | Sí | `boolean` | Sin restricción adicional declarada | Si el cluster de búsqueda responde | `true` |
| `profiles` | Sí | `number` | Sin restricción adicional declarada | Perfiles públicos en la base | `1` |
| `documents` | Sí | `number` | admite null | Documentos en el índice; `null` si el índice no responde | `1` |
| `serving` | Sí | `boolean` | Sin restricción adicional declarada | Si el buscador público está sirviéndose del índice (y no del SQL) | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/community/search/health"
}
```

---

## 67. POST /internal/community/search/reindex

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community`
- **Nombre:** Reindexar el directorio público
- **Operation ID:** `CommunitySearchIndexController_reindex`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySearchIndexController.reindex](../../src/modules/community/controllers/community-search-index.controller.ts)

### Descripción de negocio

Recrea el índice y proyecta todos los perfiles públicos. Idempotente.

Contexto declarado en el controlador: Reindexa el directorio público completo. Idempotente: correrlo dos veces deja el índice igual, porque el id del documento es el id del perfil. Devuelve «indexados N de N» y lo que el índice confirma tener, que es lo único que prueba que el barrido sirvió.

### Descripción del sistema

NestJS resuelve `POST /internal/community/search/reindex` en `CommunitySearchIndexController_reindex`. El controlador delega en `CommunitySearchIndexService.reindexAll`. Valida el body como `ReindexRequestDto` y consume `application/json`. El tipo de retorno estático es `Promise<ReindexResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ReindexRequestDto`; los campos opcionales se omiten.

```http
POST /internal/community/search/reindex HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`, `SEARCH_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `recreate` | No | `boolean` | Sin restricción adicional declarada | Recrear el índice antes de indexar. En `false` sólo se hace upsert, lo que conserva documentos de perfiles que ya no son públicos: usarlo sólo para rellenar, nunca para reconstruir. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/community/search/reindex HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "recreate": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ReindexResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ReindexResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "indexed": 1,
  "total": 1,
  "confirmed": 1,
  "errors": true,
  "summary": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `indexed` | Sí | `number` | Sin restricción adicional declarada | Documentos efectivamente indexados | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Perfiles públicos que había que indexar | `1` |
| `confirmed` | Sí | `number` | Sin restricción adicional declarada | Documentos que el índice confirma tener | `1` |
| `errors` | Sí | `boolean` | Sin restricción adicional declarada | Si algún lote reportó errores parciales | `true` |
| `summary` | Sí | `string` | Sin restricción adicional declarada | Rótulo legible: «indexados N de N» | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN, SEARCH_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | El documento trae campos no declarados para este índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/community/search/reindex"
}
```

---

## 68. POST /internal/community/verification/badges

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community`
- **Nombre:** Emitir un sello a mano (auditado)
- **Operation ID:** `CommunityVerificationController_grant`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityVerificationController.grant](../../src/modules/community/controllers/community-verification.controller.ts)

### Descripción de negocio

Escotilla de operación: el camino normal es el puente desde identity_assurance. Queda marcado como manual y anotado en auditoría.

Contexto declarado en el controlador: Alta manual de un sello, sólo para `SECURITY_ADMIN` y siempre auditada. Existe porque una autoridad puede estar caída o no tener API. El sello queda marcado como `BADGE_METHOD_MANUAL_ADMIN`, así que la ficha puede decir cómo se verificó y una auditoría puede separarlos después.

### Descripción del sistema

NestJS resuelve `POST /internal/community/verification/badges` en `CommunityVerificationController_grant`. El controlador delega en `EntityManager.transactional`, `CommunityVerificationService.applyVerified`. Valida el body como `GrantBadgeDto` y consume `application/json`. El tipo de retorno estático es `Promise<GrantBadgeResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `GrantBadgeDto`; los campos opcionales se omiten.

```http
POST /internal/community/verification/badges HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `targetId` | Sí | `string` | formato `uuid` | Sujeto de dominio (profesional, institución) | `00000000-0000-4000-8000-000000000001` |
| `evidenceRef` | No | `string` | Sin restricción adicional declarada | Referencia a la evidencia que justifica el alta manual. Se guarda en el sello y queda en auditoría: es lo que hace revisable la escotilla. | `valor-ejemplo` |
| `validTo` | No | `string` | Sin restricción adicional declarada | Hasta cuándo vale el sello (ISO). Sin esto no vence solo. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/community/verification/badges HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetId": "00000000-0000-4000-8000-000000000001",
  "evidenceRef": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<GrantBadgeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `GrantBadgeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "action": "granted"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `action` | Sí | `string` | valores: `granted`, `renewed`, `no-profile` | `no-profile` si el sujeto no tiene vitrina pública | `granted` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/community/verification/badges"
}
```

---

## 69. POST /internal/community/verification/badges/{targetId}/revoke

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community`
- **Nombre:** Bajar los sellos de un sujeto (auditado)
- **Operation ID:** `CommunityVerificationController_revoke`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityVerificationController.revoke](../../src/modules/community/controllers/community-verification.controller.ts)

### Descripción de negocio

Bajar los sellos de un sujeto (auditado). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Baja los sellos de un sujeto a mano.

### Descripción del sistema

NestJS resuelve `POST /internal/community/verification/badges/{targetId}/revoke` en `CommunityVerificationController_revoke`. El controlador delega en `EntityManager.transactional`, `CommunityVerificationService.applyRevoked`. Valida el body como `RevokeBadgeDto` y consume `application/json`. El tipo de retorno estático es `Promise<{ revoked: number }>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `targetId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RevokeBadgeDto`; los campos opcionales se omiten.

```http
POST /internal/community/verification/badges/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `reason` | No | `string` | valores: `REVOKED`, `EXPIRED` | `REVOKED` = la autoridad retiró el respaldo; `EXPIRED` = sólo venció. No significan lo mismo y la pantalla los muestra distinto. | `REVOKED` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/community/verification/badges/00000000-0000-4000-8000-000000000001/revoke HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "reason": "REVOKED"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 400 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 401 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 403 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 404 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 409 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 413 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 422 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 429 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |
| 500 | Operación completada correctamente. | `Promise<{ revoked: number }>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ revoked: number }`. Ejemplo completo derivado de ese DTO:

```json
{
  "revoked": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `revoked` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/community/verification/badges/{targetId}/revoke"
}
```

---

## 70. POST /internal/community/verification/badges/expire-sweep

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community`
- **Nombre:** Bajar los sellos cuya vigencia ya venció
- **Operation ID:** `CommunityVerificationController_expireSweep`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityVerificationController.expireSweep](../../src/modules/community/controllers/community-verification.controller.ts)

### Descripción de negocio

Sin este barrido, un sello con vencimiento se seguiría mostrando activo hasta que alguien revocara el caso a mano.

Contexto declarado en el controlador: Barrido de sellos vencidos. Lo llama el worker.

### Descripción del sistema

NestJS resuelve `POST /internal/community/verification/badges/expire-sweep` en `CommunityVerificationController_expireSweep`. El controlador delega en `CommunityVerificationService.expireSweep`. No recibe body. El tipo de retorno estático es `Promise<BadgeSweepResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /internal/community/verification/badges/expire-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SYSTEM`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /internal/community/verification/badges/expire-sweep HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<BadgeSweepResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `BadgeSweepResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "expired": 1,
  "profiles": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `expired` | Sí | `number` | Sin restricción adicional declarada | Sellos que cayeron | `1` |
| `profiles` | Sí | `number` | Sin restricción adicional declarada | Perfiles que dejaron de estar verificados | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SYSTEM, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/internal/community/verification/badges/expire-sweep"
}
```

---

## 71. GET /l/{slug}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Ficha pública de un laboratorio
- **Operation ID:** `CommunityPublicController_getDiagnosticUnit`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.getDiagnosticUnit](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Ficha pública de un laboratorio. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha pública de un laboratorio.

### Descripción del sistema

NestJS resuelve `GET /l/{slug}` en `CommunityPublicController_getDiagnosticUnit`. El controlador delega en `CommunityPublicService.getBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicDirectoryProfileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /l/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /l/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicDirectoryProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarUrl": "valor-ejemplo",
  "coverUrl": "valor-ejemplo",
  "verified": true,
  "city": "valor-ejemplo",
  "address": "valor-ejemplo",
  "location": {
    "lat": 1,
    "lng": 1
  },
  "specialties": [
    "valor-ejemplo"
  ],
  "trajectory": [
    {
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
    }
  ],
  "practiceSites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "location": {
        "lat": 1,
        "lng": 1
      },
      "isOwn": true
    }
  ],
  "ratingAverage": 1,
  "ratingCount": 1,
  "acceptsReviews": true,
  "verifiedBadge": {
    "status": "VERIFIED",
    "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
    "verifiedAt": "valor-ejemplo",
    "validUntil": "valor-ejemplo"
  },
  "hasPublishedAgenda": true,
  "nextAvailableDate": "valor-ejemplo",
  "posts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "publishedAt": "valor-ejemplo",
      "mediaUrls": [
        "valor-ejemplo"
      ],
      "reactionCount": 1,
      "commentCount": 1
    }
  ],
  "updatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `avatarUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `coverUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `location` | No | `PublicLocationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lat":1,"lng":1}` |
| `location.lat` | No | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `location.lng` | No | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `specialties` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `trajectory` | Sí | `array<PublicAffiliationDto>` | Sin restricción adicional declarada | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `[{"organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","startDate":"2026-07-31","endDate":"2026-07-31"}]` |
| `trajectory[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución, tal como la declaró el profesional | `Nombre de ejemplo` |
| `trajectory[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo ejercido | `valor-ejemplo` |
| `trajectory[].departmentText` | Sí | `string` | admite null | Servicio o departamento, si lo declaró | `valor-ejemplo` |
| `trajectory[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo | `2026-07-31` |
| `trajectory[].endDate` | Sí | `string` | formato `date`; admite null | Fin del vínculo, o null si sigue vigente | `2026-07-31` |
| `practiceSites` | Sí | `array<PublicPracticeSiteDto>` | Sin restricción adicional declarada | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","location":{"lat":1,"lng":1},"isOwn":true}]` |
| `practiceSites[].id` | Sí | `string` | formato `uuid` | Identificador de la sede | `00000000-0000-4000-8000-000000000001` |
| `practiceSites[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede | `Nombre de ejemplo` |
| `practiceSites[].addressText` | Sí | `string` | admite null | Dirección en una línea, o null si la sede no cargó ninguna | `valor-ejemplo` |
| `practiceSites[].location` | Sí | `PublicLocationDto` | Sin restricción adicional declarada | Punto de la sede; null si su dirección no tiene coordenadas | `{"lat":1,"lng":1}` |
| `practiceSites[].location.lat` | Sí | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `practiceSites[].location.lng` | Sí | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `practiceSites[].isOwn` | Sí | `boolean` | Sin restricción adicional declarada | Si es un consultorio propio del profesional y no la sede de una organización | `true` |
| `ratingAverage` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `ratingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsReviews` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `verifiedBadge` | Sí | `PublicVerifiedBadgeDto` | Sin restricción adicional declarada | El mismo sello y la misma semántica que en el buscador | `{"status":"VERIFIED","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"valor-ejemplo","validUntil":"valor-ejemplo"}` |
| `verifiedBadge.status` | Sí | `string` | valores: `VERIFIED`, `EXPIRED`, `NONE` | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `VERIFIED` |
| `verifiedBadge.badgeTypeConceptId` | Sí | `string` | admite null | Qué se verificó | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verificationMethodConceptId` | Sí | `string` | admite null | Cómo se verificó (autoridad externa, alta manual auditada) | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verifiedAt` | Sí | `string` | admite null | Desde cuándo vale, ISO | `valor-ejemplo` |
| `verifiedBadge.validUntil` | Sí | `string` | admite null | Hasta cuándo vale, ISO | `valor-ejemplo` |
| `hasPublishedAgenda` | Sí | `boolean` | Sin restricción adicional declarada | Si tiene agenda publicada | `true` |
| `nextAvailableDate` | Sí | `string` | admite null | Primer día con hueco (YYYY-MM-DD) | `valor-ejemplo` |
| `posts` | Sí | `array<PublicPostSummaryDto>` | Sin restricción adicional declarada | Máx. 20 | `[{"id":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","publishedAt":"valor-ejemplo","mediaUrls":["valor-ejemplo"],"reactionCount":1,"commentCount":1}]` |
| `posts[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `posts[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `posts[].publishedAt` | Sí | `string` | Sin restricción adicional declarada | Instante ISO-8601 en UTC | `valor-ejemplo` |
| `posts[].mediaUrls` | Sí | `array<string>` | Sin restricción adicional declarada | Vacío, nunca null | `["valor-ejemplo"]` |
| `posts[].reactionCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `posts[].commentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `updatedAt` | Sí | `string` | Sin restricción adicional declarada | Alimenta el ETag y el <lastmod> del sitemap | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/l/{slug}"
}
```

---

## 72. GET /o/{slug}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Ficha pública de una organización
- **Operation ID:** `CommunityPublicController_getOrganization`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.getOrganization](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Ficha pública de una organización. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha pública de una organización.

### Descripción del sistema

NestJS resuelve `GET /o/{slug}` en `CommunityPublicController_getOrganization`. El controlador delega en `CommunityPublicService.getBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicDirectoryProfileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /o/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /o/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicDirectoryProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarUrl": "valor-ejemplo",
  "coverUrl": "valor-ejemplo",
  "verified": true,
  "city": "valor-ejemplo",
  "address": "valor-ejemplo",
  "location": {
    "lat": 1,
    "lng": 1
  },
  "specialties": [
    "valor-ejemplo"
  ],
  "trajectory": [
    {
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
    }
  ],
  "practiceSites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "location": {
        "lat": 1,
        "lng": 1
      },
      "isOwn": true
    }
  ],
  "ratingAverage": 1,
  "ratingCount": 1,
  "acceptsReviews": true,
  "verifiedBadge": {
    "status": "VERIFIED",
    "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
    "verifiedAt": "valor-ejemplo",
    "validUntil": "valor-ejemplo"
  },
  "hasPublishedAgenda": true,
  "nextAvailableDate": "valor-ejemplo",
  "posts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "publishedAt": "valor-ejemplo",
      "mediaUrls": [
        "valor-ejemplo"
      ],
      "reactionCount": 1,
      "commentCount": 1
    }
  ],
  "updatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `avatarUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `coverUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `location` | No | `PublicLocationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lat":1,"lng":1}` |
| `location.lat` | No | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `location.lng` | No | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `specialties` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `trajectory` | Sí | `array<PublicAffiliationDto>` | Sin restricción adicional declarada | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `[{"organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","startDate":"2026-07-31","endDate":"2026-07-31"}]` |
| `trajectory[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución, tal como la declaró el profesional | `Nombre de ejemplo` |
| `trajectory[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo ejercido | `valor-ejemplo` |
| `trajectory[].departmentText` | Sí | `string` | admite null | Servicio o departamento, si lo declaró | `valor-ejemplo` |
| `trajectory[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo | `2026-07-31` |
| `trajectory[].endDate` | Sí | `string` | formato `date`; admite null | Fin del vínculo, o null si sigue vigente | `2026-07-31` |
| `practiceSites` | Sí | `array<PublicPracticeSiteDto>` | Sin restricción adicional declarada | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","location":{"lat":1,"lng":1},"isOwn":true}]` |
| `practiceSites[].id` | Sí | `string` | formato `uuid` | Identificador de la sede | `00000000-0000-4000-8000-000000000001` |
| `practiceSites[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede | `Nombre de ejemplo` |
| `practiceSites[].addressText` | Sí | `string` | admite null | Dirección en una línea, o null si la sede no cargó ninguna | `valor-ejemplo` |
| `practiceSites[].location` | Sí | `PublicLocationDto` | Sin restricción adicional declarada | Punto de la sede; null si su dirección no tiene coordenadas | `{"lat":1,"lng":1}` |
| `practiceSites[].location.lat` | Sí | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `practiceSites[].location.lng` | Sí | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `practiceSites[].isOwn` | Sí | `boolean` | Sin restricción adicional declarada | Si es un consultorio propio del profesional y no la sede de una organización | `true` |
| `ratingAverage` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `ratingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsReviews` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `verifiedBadge` | Sí | `PublicVerifiedBadgeDto` | Sin restricción adicional declarada | El mismo sello y la misma semántica que en el buscador | `{"status":"VERIFIED","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"valor-ejemplo","validUntil":"valor-ejemplo"}` |
| `verifiedBadge.status` | Sí | `string` | valores: `VERIFIED`, `EXPIRED`, `NONE` | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `VERIFIED` |
| `verifiedBadge.badgeTypeConceptId` | Sí | `string` | admite null | Qué se verificó | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verificationMethodConceptId` | Sí | `string` | admite null | Cómo se verificó (autoridad externa, alta manual auditada) | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verifiedAt` | Sí | `string` | admite null | Desde cuándo vale, ISO | `valor-ejemplo` |
| `verifiedBadge.validUntil` | Sí | `string` | admite null | Hasta cuándo vale, ISO | `valor-ejemplo` |
| `hasPublishedAgenda` | Sí | `boolean` | Sin restricción adicional declarada | Si tiene agenda publicada | `true` |
| `nextAvailableDate` | Sí | `string` | admite null | Primer día con hueco (YYYY-MM-DD) | `valor-ejemplo` |
| `posts` | Sí | `array<PublicPostSummaryDto>` | Sin restricción adicional declarada | Máx. 20 | `[{"id":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","publishedAt":"valor-ejemplo","mediaUrls":["valor-ejemplo"],"reactionCount":1,"commentCount":1}]` |
| `posts[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `posts[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `posts[].publishedAt` | Sí | `string` | Sin restricción adicional declarada | Instante ISO-8601 en UTC | `valor-ejemplo` |
| `posts[].mediaUrls` | Sí | `array<string>` | Sin restricción adicional declarada | Vacío, nunca null | `["valor-ejemplo"]` |
| `posts[].reactionCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `posts[].commentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `updatedAt` | Sí | `string` | Sin restricción adicional declarada | Alimenta el ETag y el <lastmod> del sitemap | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/o/{slug}"
}
```

---

## 73. GET /p/{slug}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Ficha pública de un profesional
- **Operation ID:** `CommunityPublicController_getPractitioner`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.getPractitioner](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Ficha pública de un profesional. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha pública de un profesional.

### Descripción del sistema

NestJS resuelve `GET /p/{slug}` en `CommunityPublicController_getPractitioner`. El controlador delega en `CommunityPublicService.getBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicDirectoryProfileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /p/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /p/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicDirectoryProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarUrl": "valor-ejemplo",
  "coverUrl": "valor-ejemplo",
  "verified": true,
  "city": "valor-ejemplo",
  "address": "valor-ejemplo",
  "location": {
    "lat": 1,
    "lng": 1
  },
  "specialties": [
    "valor-ejemplo"
  ],
  "trajectory": [
    {
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
    }
  ],
  "practiceSites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "location": {
        "lat": 1,
        "lng": 1
      },
      "isOwn": true
    }
  ],
  "ratingAverage": 1,
  "ratingCount": 1,
  "acceptsReviews": true,
  "verifiedBadge": {
    "status": "VERIFIED",
    "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
    "verifiedAt": "valor-ejemplo",
    "validUntil": "valor-ejemplo"
  },
  "hasPublishedAgenda": true,
  "nextAvailableDate": "valor-ejemplo",
  "posts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "publishedAt": "valor-ejemplo",
      "mediaUrls": [
        "valor-ejemplo"
      ],
      "reactionCount": 1,
      "commentCount": 1
    }
  ],
  "updatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `avatarUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `coverUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `location` | No | `PublicLocationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lat":1,"lng":1}` |
| `location.lat` | No | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `location.lng` | No | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `specialties` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `trajectory` | Sí | `array<PublicAffiliationDto>` | Sin restricción adicional declarada | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `[{"organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","startDate":"2026-07-31","endDate":"2026-07-31"}]` |
| `trajectory[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución, tal como la declaró el profesional | `Nombre de ejemplo` |
| `trajectory[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo ejercido | `valor-ejemplo` |
| `trajectory[].departmentText` | Sí | `string` | admite null | Servicio o departamento, si lo declaró | `valor-ejemplo` |
| `trajectory[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo | `2026-07-31` |
| `trajectory[].endDate` | Sí | `string` | formato `date`; admite null | Fin del vínculo, o null si sigue vigente | `2026-07-31` |
| `practiceSites` | Sí | `array<PublicPracticeSiteDto>` | Sin restricción adicional declarada | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","location":{"lat":1,"lng":1},"isOwn":true}]` |
| `practiceSites[].id` | Sí | `string` | formato `uuid` | Identificador de la sede | `00000000-0000-4000-8000-000000000001` |
| `practiceSites[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede | `Nombre de ejemplo` |
| `practiceSites[].addressText` | Sí | `string` | admite null | Dirección en una línea, o null si la sede no cargó ninguna | `valor-ejemplo` |
| `practiceSites[].location` | Sí | `PublicLocationDto` | Sin restricción adicional declarada | Punto de la sede; null si su dirección no tiene coordenadas | `{"lat":1,"lng":1}` |
| `practiceSites[].location.lat` | Sí | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `practiceSites[].location.lng` | Sí | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `practiceSites[].isOwn` | Sí | `boolean` | Sin restricción adicional declarada | Si es un consultorio propio del profesional y no la sede de una organización | `true` |
| `ratingAverage` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `ratingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsReviews` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `verifiedBadge` | Sí | `PublicVerifiedBadgeDto` | Sin restricción adicional declarada | El mismo sello y la misma semántica que en el buscador | `{"status":"VERIFIED","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"valor-ejemplo","validUntil":"valor-ejemplo"}` |
| `verifiedBadge.status` | Sí | `string` | valores: `VERIFIED`, `EXPIRED`, `NONE` | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `VERIFIED` |
| `verifiedBadge.badgeTypeConceptId` | Sí | `string` | admite null | Qué se verificó | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verificationMethodConceptId` | Sí | `string` | admite null | Cómo se verificó (autoridad externa, alta manual auditada) | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verifiedAt` | Sí | `string` | admite null | Desde cuándo vale, ISO | `valor-ejemplo` |
| `verifiedBadge.validUntil` | Sí | `string` | admite null | Hasta cuándo vale, ISO | `valor-ejemplo` |
| `hasPublishedAgenda` | Sí | `boolean` | Sin restricción adicional declarada | Si tiene agenda publicada | `true` |
| `nextAvailableDate` | Sí | `string` | admite null | Primer día con hueco (YYYY-MM-DD) | `valor-ejemplo` |
| `posts` | Sí | `array<PublicPostSummaryDto>` | Sin restricción adicional declarada | Máx. 20 | `[{"id":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","publishedAt":"valor-ejemplo","mediaUrls":["valor-ejemplo"],"reactionCount":1,"commentCount":1}]` |
| `posts[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `posts[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `posts[].publishedAt` | Sí | `string` | Sin restricción adicional declarada | Instante ISO-8601 en UTC | `valor-ejemplo` |
| `posts[].mediaUrls` | Sí | `array<string>` | Sin restricción adicional declarada | Vacío, nunca null | `["valor-ejemplo"]` |
| `posts[].reactionCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `posts[].commentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `updatedAt` | Sí | `string` | Sin restricción adicional declarada | Alimenta el ETag y el <lastmod> del sitemap | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/p/{slug}"
}
```

---

## 74. GET /public/comments/{commentId}/replies

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Respuestas de un comentario público
- **Operation ID:** `CommunityPublicController_commentReplies`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.commentReplies](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Respuestas de un comentario público. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Las respuestas de un comentario (AC-01-12, «Ver N respuestas»). Ruta propia y no un parámetro de la anterior: son dos recursos paginados distintos y el desplegable abre varios hilos a la vez. La justificación larga está en `CommunityPublicService.commentReplies`.

### Descripción del sistema

NestJS resuelve `GET /public/comments/{commentId}/replies` en `CommunityPublicController_commentReplies`. El controlador delega en `CommunityPublicService.commentReplies`. No recibe body. El tipo de retorno estático es `Promise<PublicCommentPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `commentId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/comments/00000000-0000-4000-8000-000000000001/replies?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Deben ser UUID válidos: `commentId`.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/comments/00000000-0000-4000-8000-000000000001/replies?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |

El controlador declara `PublicCommentPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Comentario no encontrado | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 404 | `NOT_FOUND` | Publicación no encontrada | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/comments/{commentId}/replies"
}
```

---

## 75. GET /public/media/{id}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Servir una imagen pública (avatar, portada o post)
- **Operation ID:** `CommunityPublicController_getPublicMedia`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.getPublicMedia](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Servir una imagen pública (avatar, portada o post). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Imagen de la superficie pública: el avatar o la portada de una vitrina, o una foto de una de sus publicaciones. La ficha y el buscador devuelven la URL `/public/media/:id` en vez del id de archivo pelado —un uuid interno regalado a un anónimo no se vuelve a esconder—, así que esta ruta es la contraparte que sirve esos bytes. Lo que autoriza es qué es el archivo, no quién lo pide: sin esto, cada foto del directorio es un enlace roto. `ParseUUIDPipe` rechaza con 400 lo que no es un uuid antes de tocar la base; el resto de los «no» son un 404 indistinguible del «no existe».

### Descripción del sistema

NestJS resuelve `GET /public/media/{id}` en `CommunityPublicController_getPublicMedia`. El controlador delega en `CommunityPublicService.getPublicMedia`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/media/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Deben ser UUID válidos: `id`.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/media/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<void>` | No |
| 400 | Consulta completada correctamente. | `Promise<void>` | No |
| 401 | Consulta completada correctamente. | `Promise<void>` | No |
| 403 | Consulta completada correctamente. | `Promise<void>` | No |
| 404 | Consulta completada correctamente. | `Promise<void>` | No |
| 429 | Consulta completada correctamente. | `Promise<void>` | No |
| 500 | Consulta completada correctamente. | `Promise<void>` | No |

La operación no devuelve body según el tipo TypeScript del controlador.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | Versión vigente no encontrada | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo está borrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo no tiene una versión vigente | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión vigente todavía no está lista para servirse públicamente | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/media/{id}"
}
```

---

## 76. GET /public/nearby

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Prestadores cercanos, en línea recta
- **Operation ID:** `CommunityPublicController_nearby`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.nearby](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Prestadores cercanos, en línea recta. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Lo más cercano a un punto.

### Descripción del sistema

NestJS resuelve `GET /public/nearby` en `CommunityPublicController_nearby`. El controlador delega en `CommunityPublicService.nearby`. No recibe body. El tipo de retorno estático es `Promise<PublicNearbyPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `lat` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `lng` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `radiusKm` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/nearby?lat=valor-ejemplo&lng=valor-ejemplo&radiusKm=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/nearby?lat=valor-ejemplo&lng=valor-ejemplo&radiusKm=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicNearbyPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicNearbyPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicNearbyPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicNearbyPageDto>` | No |

El controlador declara `PublicNearbyPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 400 | `VALIDATION_FAILED` | Se requieren coordenadas válidas: lat en [-90,90] y lng en [-180,180] | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/nearby"
}
```

---

## 77. GET /public/posts

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Últimas publicaciones de todos los profesionales
- **Operation ID:** `CommunityPublicController_feedPublico`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.feedPublico](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Últimas publicaciones de todos los profesionales. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El feed de la portada: lo último de todas las vitrinas, mezclado. Va declarado **antes** que `public/search` por la misma razón que todo este controlador va antes que `read_models`: Nest resuelve por orden, y una ruta hermana con parámetro capturaría este segmento.

### Descripción del sistema

NestJS resuelve `GET /public/posts` en `CommunityPublicController_feedPublico`. El controlador delega en `CommunityPublicService.feedPublico`. No recibe body. El tipo de retorno estático es `Promise<PublicFeedPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/posts?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/posts?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicFeedPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicFeedPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicFeedPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicFeedPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicFeedPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicFeedPageDto>` | No |

El controlador declara `PublicFeedPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/posts"
}
```

---

## 78. GET /public/posts/{postId}/comments

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Comentarios raíz de una publicación pública
- **Operation ID:** `CommunityPublicController_postComments`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.postComments](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Comentarios raíz de una publicación pública. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El hilo de comentarios raíz de una publicación (AC-01-11, AC-01-12).

### Descripción del sistema

NestJS resuelve `GET /public/posts/{postId}/comments` en `CommunityPublicController_postComments`. El controlador delega en `CommunityPublicService.postComments`. No recibe body. El tipo de retorno estático es `Promise<PublicCommentPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `postId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/posts/00000000-0000-4000-8000-000000000001/comments?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Deben ser UUID válidos: `postId`.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/posts/00000000-0000-4000-8000-000000000001/comments?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicCommentPageDto>` | No |

El controlador declara `PublicCommentPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Publicación no encontrada | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/posts/{postId}/comments"
}
```

---

## 79. GET /public/posts/{postId}/reactions

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Quiénes reaccionaron a una publicación pública
- **Operation ID:** `CommunityPublicController_postReactions`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.postReactions](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Quiénes reaccionaron a una publicación pública. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Quién reaccionó a una publicación (AC-01-9). Va inmediatamente detrás de `public/posts` y comparte todo lo suyo: es `@Public()`, cae bajo el mismo límite de 60 por minuto por IP que declara la clase, se envuelve en `items`/`nextCursor`/`totalHint`/`generatedAt` y gana su `ETag` y su `Cache-Control` de `PublicCacheInterceptor`, que actúa sobre todo `GET` marcado `@Public()`. `ParseUUIDPipe` rechaza con 400 lo que no es un uuid antes de tocar la base —igual que en `public/media/:id`—; el resto de los «no» son un 404 indistinguible del «no existe».

### Descripción del sistema

NestJS resuelve `GET /public/posts/{postId}/reactions` en `CommunityPublicController_postReactions`. El controlador delega en `CommunityPublicService.postReactions`. No recibe body. El tipo de retorno estático es `Promise<PublicPostReactionPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `postId` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/posts/00000000-0000-4000-8000-000000000001/reactions?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Deben ser UUID válidos: `postId`.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/posts/00000000-0000-4000-8000-000000000001/reactions?cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicPostReactionPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicPostReactionPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicPostReactionPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicPostReactionPageDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicPostReactionPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicPostReactionPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicPostReactionPageDto>` | No |

El controlador declara `PublicPostReactionPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Publicación no encontrada | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/posts/{postId}/reactions"
}
```

---

## 80. GET /public/profiles/{prefijo}/{slug}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Ficha pública por prefijo de vertical
- **Operation ID:** `CommunityPublicController_getProfileByPrefix`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.getProfileByPrefix](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Ficha pública por prefijo de vertical. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha pública por vertical, bajo el prefijo `/public`. ## Por qué existe además de las cinco rutas cortas Porque `/p/:slug` es a la vez **la URL de la página** y la de su dato. En el navegador eso choca: el servidor de desarrollo enruta por prefijo de texto, así que mandar `/p` a la API se come la ruta del router y abrir la ficha devuelve JSON en vez de la pantalla; no mandarla deja al cliente pidiendo `/p/:slug` al servidor de Angular, que responde el `index.html` con **200** y el cliente recibe HTML donde espera JSON. Las dos salidas rompen algo, y `check-client-prefixes.mjs` lo denuncia desde el 2026-08-17. Las cinco rutas cortas **se quedan**: son las que alguien pega en un mensaje y las que un rastreador sigue, y su contrato no cambia. Esta es la que llama el cliente, y no es ambigua porque cuelga de `/public`, que ya está enrutado. El comportamiento es idéntico, incluido el 404 del tipo equivocado: es el mismo servicio con el mismo concepto de sujeto, no una segunda implementación que pueda separarse de la primera.

### Descripción del sistema

NestJS resuelve `GET /public/profiles/{prefijo}/{slug}` en `CommunityPublicController_getProfileByPrefix`. El controlador delega en `CommunityPublicService.getBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicDirectoryProfileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `prefijo` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/profiles/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/profiles/valor-ejemplo/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicDirectoryProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarUrl": "valor-ejemplo",
  "coverUrl": "valor-ejemplo",
  "verified": true,
  "city": "valor-ejemplo",
  "address": "valor-ejemplo",
  "location": {
    "lat": 1,
    "lng": 1
  },
  "specialties": [
    "valor-ejemplo"
  ],
  "trajectory": [
    {
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
    }
  ],
  "practiceSites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "location": {
        "lat": 1,
        "lng": 1
      },
      "isOwn": true
    }
  ],
  "ratingAverage": 1,
  "ratingCount": 1,
  "acceptsReviews": true,
  "verifiedBadge": {
    "status": "VERIFIED",
    "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
    "verifiedAt": "valor-ejemplo",
    "validUntil": "valor-ejemplo"
  },
  "hasPublishedAgenda": true,
  "nextAvailableDate": "valor-ejemplo",
  "posts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "publishedAt": "valor-ejemplo",
      "mediaUrls": [
        "valor-ejemplo"
      ],
      "reactionCount": 1,
      "commentCount": 1
    }
  ],
  "updatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `avatarUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `coverUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `location` | No | `PublicLocationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lat":1,"lng":1}` |
| `location.lat` | No | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `location.lng` | No | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `specialties` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `trajectory` | Sí | `array<PublicAffiliationDto>` | Sin restricción adicional declarada | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `[{"organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","startDate":"2026-07-31","endDate":"2026-07-31"}]` |
| `trajectory[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución, tal como la declaró el profesional | `Nombre de ejemplo` |
| `trajectory[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo ejercido | `valor-ejemplo` |
| `trajectory[].departmentText` | Sí | `string` | admite null | Servicio o departamento, si lo declaró | `valor-ejemplo` |
| `trajectory[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo | `2026-07-31` |
| `trajectory[].endDate` | Sí | `string` | formato `date`; admite null | Fin del vínculo, o null si sigue vigente | `2026-07-31` |
| `practiceSites` | Sí | `array<PublicPracticeSiteDto>` | Sin restricción adicional declarada | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","location":{"lat":1,"lng":1},"isOwn":true}]` |
| `practiceSites[].id` | Sí | `string` | formato `uuid` | Identificador de la sede | `00000000-0000-4000-8000-000000000001` |
| `practiceSites[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede | `Nombre de ejemplo` |
| `practiceSites[].addressText` | Sí | `string` | admite null | Dirección en una línea, o null si la sede no cargó ninguna | `valor-ejemplo` |
| `practiceSites[].location` | Sí | `PublicLocationDto` | Sin restricción adicional declarada | Punto de la sede; null si su dirección no tiene coordenadas | `{"lat":1,"lng":1}` |
| `practiceSites[].location.lat` | Sí | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `practiceSites[].location.lng` | Sí | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `practiceSites[].isOwn` | Sí | `boolean` | Sin restricción adicional declarada | Si es un consultorio propio del profesional y no la sede de una organización | `true` |
| `ratingAverage` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `ratingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsReviews` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `verifiedBadge` | Sí | `PublicVerifiedBadgeDto` | Sin restricción adicional declarada | El mismo sello y la misma semántica que en el buscador | `{"status":"VERIFIED","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"valor-ejemplo","validUntil":"valor-ejemplo"}` |
| `verifiedBadge.status` | Sí | `string` | valores: `VERIFIED`, `EXPIRED`, `NONE` | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `VERIFIED` |
| `verifiedBadge.badgeTypeConceptId` | Sí | `string` | admite null | Qué se verificó | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verificationMethodConceptId` | Sí | `string` | admite null | Cómo se verificó (autoridad externa, alta manual auditada) | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verifiedAt` | Sí | `string` | admite null | Desde cuándo vale, ISO | `valor-ejemplo` |
| `verifiedBadge.validUntil` | Sí | `string` | admite null | Hasta cuándo vale, ISO | `valor-ejemplo` |
| `hasPublishedAgenda` | Sí | `boolean` | Sin restricción adicional declarada | Si tiene agenda publicada | `true` |
| `nextAvailableDate` | Sí | `string` | admite null | Primer día con hueco (YYYY-MM-DD) | `valor-ejemplo` |
| `posts` | Sí | `array<PublicPostSummaryDto>` | Sin restricción adicional declarada | Máx. 20 | `[{"id":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","publishedAt":"valor-ejemplo","mediaUrls":["valor-ejemplo"],"reactionCount":1,"commentCount":1}]` |
| `posts[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `posts[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `posts[].publishedAt` | Sí | `string` | Sin restricción adicional declarada | Instante ISO-8601 en UTC | `valor-ejemplo` |
| `posts[].mediaUrls` | Sí | `array<string>` | Sin restricción adicional declarada | Vacío, nunca null | `["valor-ejemplo"]` |
| `posts[].reactionCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `posts[].commentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `updatedAt` | Sí | `string` | Sin restricción adicional declarada | Alimenta el ETag y el <lastmod> del sitemap | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/profiles/{prefijo}/{slug}"
}
```

---

## 81. GET /public/search

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Buscador público unificado
- **Operation ID:** `CommunityPublicController_search`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.search](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Buscador público unificado. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Búsqueda unificada sobre todos los verticales.

### Descripción del sistema

NestJS resuelve `GET /public/search` en `CommunityPublicController_search`. El controlador delega en `CommunityPublicService.search`. No recibe body. El tipo de retorno estático es `Promise<PublicSearchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/search?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/search?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |

El controlador declara `PublicSearchPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/search"
}
```

---

## 82. GET /public/search/diagnostic-units

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Laboratorios y centros de diagnóstico
- **Operation ID:** `CommunityPublicController_searchDiagnosticUnits`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.searchDiagnosticUnits](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Laboratorios y centros de diagnóstico. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Unidades de diagnóstico: laboratorios y centros de imágenes.

### Descripción del sistema

NestJS resuelve `GET /public/search/diagnostic-units` en `CommunityPublicController_searchDiagnosticUnits`. El controlador delega en `CommunityPublicService.search`. No recibe body. El tipo de retorno estático es `Promise<PublicSearchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/search/diagnostic-units?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/search/diagnostic-units?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |

El controlador declara `PublicSearchPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/search/diagnostic-units"
}
```

---

## 83. GET /public/search/insurers

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Aseguradoras en el directorio público
- **Operation ID:** `CommunityPublicController_searchInsurers`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.searchInsurers](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Aseguradoras en el directorio público. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Aseguradoras.

### Descripción del sistema

NestJS resuelve `GET /public/search/insurers` en `CommunityPublicController_searchInsurers`. El controlador delega en `CommunityPublicService.search`. No recibe body. El tipo de retorno estático es `Promise<PublicSearchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/search/insurers?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/search/insurers?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |

El controlador declara `PublicSearchPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/search/insurers"
}
```

---

## 84. GET /public/search/medications

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Medicamentos ofertados públicamente
- **Operation ID:** `CommunityPublicController_searchMedications`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.searchMedications](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Medicamentos ofertados públicamente. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Medicamentos ofertados.

### Descripción del sistema

NestJS resuelve `GET /public/search/medications` en `CommunityPublicController_searchMedications`. El controlador delega en `CommunityPublicService.search`. No recibe body. El tipo de retorno estático es `Promise<PublicSearchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/search/medications?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/search/medications?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |

El controlador declara `PublicSearchPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/search/medications"
}
```

---

## 85. GET /public/search/organizations

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Organizaciones en el directorio público
- **Operation ID:** `CommunityPublicController_searchOrganizations`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.searchOrganizations](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Organizaciones en el directorio público. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Organizaciones de salud: hospitales, clínicas, centros. `city` acota por la ciudad de la dirección vigente, sin distinguir tildes ni mayúsculas. Es el filtro que un directorio de **lugares** necesita antes que ningún otro —a nadie le sirve una clínica excelente en otra ciudad—, y está implementado en los dos caminos, el del índice y el de SQL: uno que sólo funcionara con OpenSearch arriba dejaría de acotar sin avisar el día que se cayera.

### Descripción del sistema

NestJS resuelve `GET /public/search/organizations` en `CommunityPublicController_searchOrganizations`. El controlador delega en `CommunityPublicService.search`. No recibe body. El tipo de retorno estático es `Promise<PublicSearchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `city` | query | No | `string` | Sin restricción adicional declarada | Ciudad a la que acotar; sin tildes ni mayúsculas que valgan | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/search/organizations?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/search/organizations?q=valor-ejemplo&city=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |

El controlador declara `PublicSearchPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/search/organizations"
}
```

---

## 86. GET /public/search/pharmacies

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Farmacias en el directorio público
- **Operation ID:** `CommunityPublicController_searchPharmacies`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.searchPharmacies](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Farmacias en el directorio público. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Farmacias.

### Descripción del sistema

NestJS resuelve `GET /public/search/pharmacies` en `CommunityPublicController_searchPharmacies`. El controlador delega en `CommunityPublicService.search`. No recibe body. El tipo de retorno estático es `Promise<PublicSearchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/search/pharmacies?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/search/pharmacies?q=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |

El controlador declara `PublicSearchPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/search/pharmacies"
}
```

---

## 87. GET /public/search/practitioners

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Profesionales en el directorio público
- **Operation ID:** `CommunityPublicController_searchPractitioners`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.searchPractitioners](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Profesionales en el directorio público. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Profesionales de la salud. `specialty` es el `concept_id` de una especialidad de `VS_MEDICAL_SPECIALTY` —las 36 del patch v4.0.11—, **no** el nombre de la especialidad: el directorio agrupa por catálogo, no por texto libre. El cliente ya lo mandaba (`public-directory.client.ts`, `searchPractitioners`) y el controlador no lo declaraba, así que hasta hoy se perdía entre los dos: la pantalla dibujaba un filtro que no filtraba, que es peor que no dibujarlo. Un uuid que no pertenece al conjunto se rechaza con **422** —el mismo `PreconditionFailedException` y el mismo `MedicalSpecialtyCatalogService` que usa el alta de profesional—, nunca se ignora en silencio (AC-02-8).

### Descripción del sistema

NestJS resuelve `GET /public/search/practitioners` en `CommunityPublicController_searchPractitioners`. El controlador delega en `CommunityPublicService.search`. No recibe body. El tipo de retorno estático es `Promise<PublicSearchPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `q` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `verified` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `specialty` | query | No | `string` | Sin restricción adicional declarada | concept_id de VS_MEDICAL_SPECIALTY al que acotar; uno ajeno al conjunto da 422 | `valor-ejemplo` |
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /public/search/practitioners?q=valor-ejemplo&verified=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /public/search/practitioners?q=valor-ejemplo&verified=valor-ejemplo&specialty=valor-ejemplo&cursor=valor-ejemplo&limit=valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicSearchPageDto>` | No |

El controlador declara `PublicSearchPageDto`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | Índice de búsqueda no reconocido | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Falta el tenant de contexto para la operación de búsqueda | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | Campo de ${kind} no permitido para el índice | Excepción explícita en src/modules/search_platform/services/search-index.service.ts |
| 422 | `PRECONDITION_FAILED` | La especialidad no pertenece al catálogo de especialidades médicas | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | El catálogo de especialidades médicas no está disponible | Excepción explícita en src/modules/profiles/services/medical-specialty-catalog.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/public/search/practitioners"
}
```

---

## 88. GET /s/{slug}

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-public`
- **Nombre:** Ficha pública de una aseguradora
- **Operation ID:** `CommunityPublicController_getInsurer`
- **Autenticación:** Pública
- **Implementación:** [CommunityPublicController.getInsurer](../../src/modules/community/controllers/community-public.controller.ts)

### Descripción de negocio

Ficha pública de una aseguradora. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Ficha pública de una aseguradora.

### Descripción del sistema

NestJS resuelve `GET /s/{slug}` en `CommunityPublicController_getInsurer`. El controlador delega en `CommunityPublicService.getBySlug`. No recibe body. El tipo de retorno estático es `Promise<PublicDirectoryProfileDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `slug` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /s/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit particular: `Throttle(PUBLIC_RATE_LIMIT)`.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /s/valor-ejemplo HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<PublicDirectoryProfileDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `PublicDirectoryProfileDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "kind": {},
  "slug": "valor-ejemplo",
  "displayName": "Nombre de ejemplo",
  "headline": "valor-ejemplo",
  "biography": "valor-ejemplo",
  "avatarUrl": "valor-ejemplo",
  "coverUrl": "valor-ejemplo",
  "verified": true,
  "city": "valor-ejemplo",
  "address": "valor-ejemplo",
  "location": {
    "lat": 1,
    "lng": 1
  },
  "specialties": [
    "valor-ejemplo"
  ],
  "trajectory": [
    {
      "organizationName": "Nombre de ejemplo",
      "roleTitle": "valor-ejemplo",
      "departmentText": "valor-ejemplo",
      "startDate": "2026-07-31",
      "endDate": "2026-07-31"
    }
  ],
  "practiceSites": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "name": "Nombre de ejemplo",
      "addressText": "valor-ejemplo",
      "location": {
        "lat": 1,
        "lng": 1
      },
      "isOwn": true
    }
  ],
  "ratingAverage": 1,
  "ratingCount": 1,
  "acceptsReviews": true,
  "verifiedBadge": {
    "status": "VERIFIED",
    "badgeTypeConceptId": "00000000-0000-4000-8000-000000000001",
    "verificationMethodConceptId": "00000000-0000-4000-8000-000000000001",
    "verifiedAt": "valor-ejemplo",
    "validUntil": "valor-ejemplo"
  },
  "hasPublishedAgenda": true,
  "nextAvailableDate": "valor-ejemplo",
  "posts": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "bodyText": "valor-ejemplo",
      "publishedAt": "valor-ejemplo",
      "mediaUrls": [
        "valor-ejemplo"
      ],
      "reactionCount": 1,
      "commentCount": 1
    }
  ],
  "updatedAt": "valor-ejemplo"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `kind` | Sí | `object` | Sin restricción adicional declarada | Tipo TypeScript no expandido: Exclude<PublicResultKind, 'MEDICATION'> | `{}` |
| `slug` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `displayName` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `headline` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `biography` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `avatarUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `coverUrl` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `city` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `address` | Sí | `string` | admite null | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `location` | No | `PublicLocationDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"lat":1,"lng":1}` |
| `location.lat` | No | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `location.lng` | No | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `specialties` | Sí | `array<string>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `["valor-ejemplo"]` |
| `trajectory` | Sí | `array<PublicAffiliationDto>` | Sin restricción adicional declarada | Trayectoria laboral, de la más reciente a la más antigua. Vacía fuera de un profesional | `[{"organizationName":"Nombre de ejemplo","roleTitle":"valor-ejemplo","departmentText":"valor-ejemplo","startDate":"2026-07-31","endDate":"2026-07-31"}]` |
| `trajectory[].organizationName` | Sí | `string` | Sin restricción adicional declarada | Institución, tal como la declaró el profesional | `Nombre de ejemplo` |
| `trajectory[].roleTitle` | Sí | `string` | Sin restricción adicional declarada | Cargo ejercido | `valor-ejemplo` |
| `trajectory[].departmentText` | Sí | `string` | admite null | Servicio o departamento, si lo declaró | `valor-ejemplo` |
| `trajectory[].startDate` | Sí | `string` | formato `date` | Inicio del vínculo | `2026-07-31` |
| `trajectory[].endDate` | Sí | `string` | formato `date`; admite null | Fin del vínculo, o null si sigue vigente | `2026-07-31` |
| `practiceSites` | Sí | `array<PublicPracticeSiteDto>` | Sin restricción adicional declarada | Dónde atiende: sus sedes vigentes, los consultorios propios primero. Vacía fuera de un profesional | `[{"id":"00000000-0000-4000-8000-000000000001","name":"Nombre de ejemplo","addressText":"valor-ejemplo","location":{"lat":1,"lng":1},"isOwn":true}]` |
| `practiceSites[].id` | Sí | `string` | formato `uuid` | Identificador de la sede | `00000000-0000-4000-8000-000000000001` |
| `practiceSites[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre de la sede | `Nombre de ejemplo` |
| `practiceSites[].addressText` | Sí | `string` | admite null | Dirección en una línea, o null si la sede no cargó ninguna | `valor-ejemplo` |
| `practiceSites[].location` | Sí | `PublicLocationDto` | Sin restricción adicional declarada | Punto de la sede; null si su dirección no tiene coordenadas | `{"lat":1,"lng":1}` |
| `practiceSites[].location.lat` | Sí | `number` | Sin restricción adicional declarada | Latitud en grados decimales | `1` |
| `practiceSites[].location.lng` | Sí | `number` | Sin restricción adicional declarada | Longitud en grados decimales | `1` |
| `practiceSites[].isOwn` | Sí | `boolean` | Sin restricción adicional declarada | Si es un consultorio propio del profesional y no la sede de una organización | `true` |
| `ratingAverage` | Sí | `number` | admite null | Sin descripción específica en el contrato OpenAPI. | `1` |
| `ratingCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `acceptsReviews` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |
| `verifiedBadge` | Sí | `PublicVerifiedBadgeDto` | Sin restricción adicional declarada | El mismo sello y la misma semántica que en el buscador | `{"status":"VERIFIED","badgeTypeConceptId":"00000000-0000-4000-8000-000000000001","verificationMethodConceptId":"00000000-0000-4000-8000-000000000001","verifiedAt":"valor-ejemplo","validUntil":"valor-ejemplo"}` |
| `verifiedBadge.status` | Sí | `string` | valores: `VERIFIED`, `EXPIRED`, `NONE` | `VERIFIED` sólo con respaldo vigente; `EXPIRED` si lo hubo y venció | `VERIFIED` |
| `verifiedBadge.badgeTypeConceptId` | Sí | `string` | admite null | Qué se verificó | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verificationMethodConceptId` | Sí | `string` | admite null | Cómo se verificó (autoridad externa, alta manual auditada) | `00000000-0000-4000-8000-000000000001` |
| `verifiedBadge.verifiedAt` | Sí | `string` | admite null | Desde cuándo vale, ISO | `valor-ejemplo` |
| `verifiedBadge.validUntil` | Sí | `string` | admite null | Hasta cuándo vale, ISO | `valor-ejemplo` |
| `hasPublishedAgenda` | Sí | `boolean` | Sin restricción adicional declarada | Si tiene agenda publicada | `true` |
| `nextAvailableDate` | Sí | `string` | admite null | Primer día con hueco (YYYY-MM-DD) | `valor-ejemplo` |
| `posts` | Sí | `array<PublicPostSummaryDto>` | Sin restricción adicional declarada | Máx. 20 | `[{"id":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","publishedAt":"valor-ejemplo","mediaUrls":["valor-ejemplo"],"reactionCount":1,"commentCount":1}]` |
| `posts[].id` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `posts[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `posts[].publishedAt` | Sí | `string` | Sin restricción adicional declarada | Instante ISO-8601 en UTC | `valor-ejemplo` |
| `posts[].mediaUrls` | Sí | `array<string>` | Sin restricción adicional declarada | Vacío, nunca null | `["valor-ejemplo"]` |
| `posts[].reactionCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `posts[].commentCount` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |
| `updatedAt` | Sí | `string` | Sin restricción adicional declarada | Alimenta el ETag y el <lastmod> del sitemap | `valor-ejemplo` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 404 | `NOT_FOUND` | No encontrado | Excepción explícita en src/modules/community/services/community-public.service.ts |
| 422 | `PRECONDITION_FAILED` | Operación de runtime sin tenant en contexto | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 422 | `PRECONDITION_FAILED` | Clave de runtime vacía | Excepción explícita en src/modules/redis_runtime/services/redis-runtime.service.ts |
| 429 | `RATE_LIMITED` | Se excede el límite particular Throttle(PUBLIC_RATE_LIMIT). | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/s/{slug}"
}
```

---

