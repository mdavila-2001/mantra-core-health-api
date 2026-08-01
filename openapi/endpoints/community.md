<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `community`

Referencia exhaustiva de 19 operación(es) del módulo `community`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `community-feed`, `community-groups`, `community-messaging`, `community-moderation`, `community-polls`, `community-reviews`, `community-social`
- **Controladores:** `CommunityFeedController`, `CommunityGroupsController`, `CommunityMessagingController`, `CommunityModerationController`, `CommunityPollsController`, `CommunityReviewsController`, `CommunitySocialController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /community/blocks](#1-post-community-blocks) — Bloquear a un usuario
2. [POST /community/bookmarks](#2-post-community-bookmarks) — Guardar un bookmark en una colección
3. [POST /community/comments](#3-post-community-comments) — Comentar (hilo anidado) con contadores
4. [POST /community/conversations](#4-post-community-conversations) — Crear una conversación con participantes
5. [POST /community/conversations/{conversationId}/messages](#5-post-community-conversations-conversationid-messages) — Enviar un mensaje directo en la conversación
6. [POST /community/conversations/{conversationId}/read](#6-post-community-conversations-conversationid-read) — Marcar mensajes como leídos (recibos)
7. [POST /community/follows](#7-post-community-follows) — Seguir un objeto social
8. [POST /community/groups](#8-post-community-groups) — Crear un grupo/comunidad
9. [POST /community/groups/{groupId}/members](#9-post-community-groups-groupid-members) — Unirse a un grupo / comunidad
10. [POST /community/moderation/decisions/{decisionId}/appeal](#10-post-community-moderation-decisions-decisionid-appeal) — Apelar una decisión de moderación
11. [POST /community/moderation/queue/{queueId}/decision](#11-post-community-moderation-queue-queueid-decision) — Resolver moderación (decisión + strike)
12. [POST /community/polls/{pollId}/votes](#12-post-community-polls-pollid-votes) — Votar en una encuesta
13. [POST /community/posts/{postId}/polls](#13-post-community-posts-postid-polls) — Crear una encuesta con opciones sobre un post
14. [POST /community/profiles/{profileId}/posts](#14-post-community-profiles-profileid-posts) — Publicar un post con hashtags, media y menciones
15. [POST /community/profiles/{profileId}/reviews](#15-post-community-profiles-profileid-reviews) — Publicar una review verificada de servicio
16. [POST /community/public-profiles](#16-post-community-public-profiles) — Crear un perfil público (bootstrap del grafo social)
17. [PUT /community/reactions](#17-put-community-reactions) — Reaccionar a contenido (upsert una reacción por actor/objeto)
18. [POST /community/reports](#18-post-community-reports) — Reportar contenido y encolar moderación
19. [POST /internal/community/feed/rebuild](#19-post-internal-community-feed-rebuild) — Generar feed (fan-out y ranking)

---

## 1. POST /community/blocks

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

## 2. POST /community/bookmarks

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

## 3. POST /community/comments

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
| 404 | `NOT_FOUND` | Perfil autor no encontrado | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 404 | `NOT_FOUND` | Comentario padre no encontrado | Excepción explícita en src/modules/community/services/community-social.service.ts |
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
  "path": "/community/comments"
}
```

---

## 4. POST /community/conversations

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

## 5. POST /community/conversations/{conversationId}/messages

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
| 404 | `NOT_FOUND` | Conversación no encontrada | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El remitente no es participante activo | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
| 422 | `PRECONDITION_FAILED` | Existe un bloqueo entre los participantes | Excepción explícita en src/modules/community/services/community-messaging.service.ts |
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

## 6. POST /community/conversations/{conversationId}/read

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

## 7. POST /community/follows

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

## 8. POST /community/groups

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
  "path": "/community/groups"
}
```

---

## 9. POST /community/groups/{groupId}/members

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

## 10. POST /community/moderation/decisions/{decisionId}/appeal

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

## 11. POST /community/moderation/queue/{queueId}/decision

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
  "decision": "REMOVED"
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
| `rationaleText` | No | `string` | longitud máxima 2000 | Motivación de la decisión | `valor-ejemplo` |
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

## 12. POST /community/polls/{pollId}/votes

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

## 13. POST /community/posts/{postId}/polls

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

## 14. POST /community/profiles/{profileId}/posts

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
| 404 | `NOT_FOUND` | Perfil autor no encontrado | Excepción explícita en src/modules/community/services/community-social.service.ts |
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
  "path": "/community/profiles/{profileId}/posts"
}
```

---

## 15. POST /community/profiles/{profileId}/reviews

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
  "reviewerPatientProfileId": "00000000-0000-4000-8000-000000000001",
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
| `reviewerPatientProfileId` | Sí | `string` | formato `uuid` | Perfil de paciente que reseña | `00000000-0000-4000-8000-000000000001` |
| `verifiedEncounterId` | No | `string` | formato `uuid` | Encuentro verificado (nunca se expone públicamente) | `00000000-0000-4000-8000-000000000001` |
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
  "reviewerPatientProfileId": "00000000-0000-4000-8000-000000000001",
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
| 404 | `NOT_FOUND` | Perfil objetivo no encontrado | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 409 | `CONFLICT` | Ya existe una review verificada para este encuentro | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | El perfil no acepta reviews | Excepción explícita en src/modules/community/services/community-reviews.service.ts |
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

## 16. POST /community/public-profiles

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

## 17. PUT /community/reactions

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

## 18. POST /community/reports

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

## 19. POST /internal/community/feed/rebuild

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
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
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
  "path": "/internal/community/feed/rebuild"
}
```

---

