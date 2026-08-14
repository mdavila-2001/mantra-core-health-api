<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `community`

Referencia exhaustiva de 38 operación(es) del módulo `community`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `community-feed`, `community-groups`, `community-messaging`, `community-moderation`, `community-polls`, `community-reviews`, `community-social`, `community-timeline`
- **Controladores:** `CommunityFeedController`, `CommunityGroupsController`, `CommunityMessagingController`, `CommunityModerationController`, `CommunityPollsController`, `CommunityReviewsController`, `CommunitySocialController`, `CommunityTimelineController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /community/blocks](#1-get-community-blocks) — Bloqueos emitidos por un perfil
2. [POST /community/blocks](#2-post-community-blocks) — Bloquear a un usuario
3. [GET /community/bookmarks](#3-get-community-bookmarks) — Marcadores guardados por un perfil
4. [POST /community/bookmarks](#4-post-community-bookmarks) — Guardar un bookmark en una colección
5. [POST /community/comments](#5-post-community-comments) — Comentar (hilo anidado) con contadores
6. [GET /community/conversations](#6-get-community-conversations) — Conversaciones activas de un perfil
7. [POST /community/conversations](#7-post-community-conversations) — Crear una conversación con participantes
8. [GET /community/conversations/{conversationId}/messages](#8-get-community-conversations-conversationid-messages) — Mensajes de una conversación
9. [POST /community/conversations/{conversationId}/messages](#9-post-community-conversations-conversationid-messages) — Enviar un mensaje directo en la conversación
10. [POST /community/conversations/{conversationId}/read](#10-post-community-conversations-conversationid-read) — Marcar mensajes como leídos (recibos)
11. [GET /community/feed](#11-get-community-feed) — Timeline de un perfil
12. [GET /community/follows](#12-get-community-follows) — Seguimientos activos de un perfil
13. [POST /community/follows](#13-post-community-follows) — Seguir un objeto social
14. [GET /community/groups](#14-get-community-groups) — Grupos de una organización
15. [POST /community/groups](#15-post-community-groups) — Crear un grupo/comunidad
16. [GET /community/groups/{groupId}/members](#16-get-community-groups-groupid-members) — Integrantes de un grupo
17. [POST /community/groups/{groupId}/members](#17-post-community-groups-groupid-members) — Unirse a un grupo / comunidad
18. [POST /community/moderation/decisions/{decisionId}/appeal](#18-post-community-moderation-decisions-decisionid-appeal) — Apelar una decisión de moderación
19. [POST /community/moderation/queue/{queueId}/decision](#19-post-community-moderation-queue-queueid-decision) — Resolver moderación (decisión + strike)
20. [GET /community/notifications](#20-get-community-notifications) — Notificaciones sociales de un perfil
21. [GET /community/polls/{pollId}](#21-get-community-polls-pollid) — Encuesta con opciones, recuentos y voto propio
22. [POST /community/polls/{pollId}/votes](#22-post-community-polls-pollid-votes) — Votar en una encuesta
23. [GET /community/posts/{postId}](#23-get-community-posts-postid) — Publicación con media, hashtags y menciones
24. [GET /community/posts/{postId}/comments](#24-get-community-posts-postid-comments) — Comentarios de una publicación (hilo anidado)
25. [POST /community/posts/{postId}/polls](#25-post-community-posts-postid-polls) — Crear una encuesta con opciones sobre un post
26. [GET /community/posts/{postId}/reactions](#26-get-community-posts-postid-reactions) — Reacciones de una publicación, agrupadas por tipo
27. [GET /community/profiles/{profileId}](#27-get-community-profiles-profileid) — Ficha de un perfil público
28. [GET /community/profiles/{profileId}/posts](#28-get-community-profiles-profileid-posts) — Publicaciones de un perfil
29. [POST /community/profiles/{profileId}/posts](#29-post-community-profiles-profileid-posts) — Publicar un post con hashtags, media y menciones
30. [GET /community/profiles/{profileId}/reviews](#30-get-community-profiles-profileid-reviews) — Reviews publicadas de un perfil
31. [POST /community/profiles/{profileId}/reviews](#31-post-community-profiles-profileid-reviews) — Publicar una review verificada de servicio
32. [GET /community/profiles/me](#32-get-community-profiles-me) — Consultar la vitrina pública propia
33. [PUT /community/profiles/me](#33-put-community-profiles-me) — Crear o actualizar la vitrina pública propia
34. [POST /community/public-profiles](#34-post-community-public-profiles) — Crear un perfil público (bootstrap del grafo social)
35. [PUT /community/reactions](#35-put-community-reactions) — Reaccionar a contenido (upsert una reacción por actor/objeto)
36. [POST /community/reports](#36-post-community-reports) — Reportar contenido y encolar moderación
37. [GET /internal/community/feed/pending](#37-get-internal-community-feed-pending) — Publicaciones publicadas sin fan-out
38. [POST /internal/community/feed/rebuild](#38-post-internal-community-feed-rebuild) — Generar feed (fan-out y ranking)

---

## 1. GET /community/blocks

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

## 2. POST /community/blocks

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

## 3. GET /community/bookmarks

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

## 4. POST /community/bookmarks

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

## 5. POST /community/comments

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

## 6. GET /community/conversations

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-messaging`
- **Nombre:** Conversaciones activas de un perfil
- **Operation ID:** `CommunityMessagingController_listConversations`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunityMessagingController.listConversations](../../src/modules/community/controllers/community-messaging.controller.ts)

### Descripción de negocio

Conversaciones activas de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Bandeja del propio perfil, con vista previa y no leídos.

### Descripción del sistema

NestJS resuelve `GET /community/conversations` en `CommunityMessagingController_listConversations`. El controlador delega en `CommunityMessagingReadService.listConversations`. No recibe body. El tipo de retorno estático es `Promise<ConversationPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `profileId` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/conversations?profileId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
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
GET /community/conversations?profileId=00000000-0000-4000-8000-000000000001&limit=1 HTTP/1.1
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
        "sentAt": "2026-07-31T12:00:00.000Z"
      },
      "unreadCount": 1
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
| `items` | Sí | `array<ConversationListItemDto>` | Sin restricción adicional declarada | Conversaciones de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","conversationTypeConceptId":"00000000-0000-4000-8000-000000000001","groupId":"00000000-0000-4000-8000-000000000001","lastMessageAt":"2026-07-31T12:00:00.000Z","messageCount":1,"lastMessage":{"id":"00000000-0000-4000-8000-000000000001","senderProfileId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","sentAt":"2026-07-31T12:00:00.000Z"},"unreadCount":1}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la conversación. | `00000000-0000-4000-8000-000000000001` |
| `items[].conversationTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de conversación (directa, grupal). | `00000000-0000-4000-8000-000000000001` |
| `items[].groupId` | No | `string` | formato `uuid`; admite null | Grupo al que pertenece, si es de grupo. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessageAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió el último mensaje. | `2026-07-31T12:00:00.000Z` |
| `items[].messageCount` | No | `number` | admite null | Cuántos mensajes acumula. | `1` |
| `items[].lastMessage` | No | `ConversationPreviewMessageDto` | Sin restricción adicional declarada | Vista previa del último mensaje. | `{"id":"00000000-0000-4000-8000-000000000001","senderProfileId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","sentAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].lastMessage.id` | No | `string` | formato `uuid` | Identificador del mensaje. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessage.senderProfileId` | No | `string` | formato `uuid` | Perfil que lo envió. | `00000000-0000-4000-8000-000000000001` |
| `items[].lastMessage.bodyText` | No | `string` | admite null | Cuerpo del mensaje. | `valor-ejemplo` |
| `items[].lastMessage.sentAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió. | `2026-07-31T12:00:00.000Z` |
| `items[].unreadCount` | Sí | `number` | Sin restricción adicional declarada | Cuántos mensajes le quedan sin leer al actor. | `1` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Cuántas trae esta página. | `1` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Tope pedido. | `1` |
| `nextCursor` | No | `string` | admite null | Siempre `null`: la bandeja devuelve las conversaciones activas del actor de una vez, acotadas por el tope. Se mantiene el campo para que la forma de la respuesta sea la misma que la de los demás listados. | `valor-ejemplo` |

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

## 7. POST /community/conversations

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

## 8. GET /community/conversations/{conversationId}/messages

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
      "sentAt": "2026-07-31T12:00:00.000Z"
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
| `items` | Sí | `array<DirectMessageDto>` | Sin restricción adicional declarada | Mensajes de la página, del más reciente al más antiguo. | `[{"id":"00000000-0000-4000-8000-000000000001","conversationId":"00000000-0000-4000-8000-000000000001","senderProfileId":"00000000-0000-4000-8000-000000000001","replyToMessageId":"00000000-0000-4000-8000-000000000001","contentTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","attachmentFileId":"00000000-0000-4000-8000-000000000001","isEdited":true,"sentAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del mensaje. | `00000000-0000-4000-8000-000000000001` |
| `items[].conversationId` | Sí | `string` | formato `uuid` | Conversación a la que pertenece. | `00000000-0000-4000-8000-000000000001` |
| `items[].senderProfileId` | Sí | `string` | formato `uuid` | Perfil que lo envió. | `00000000-0000-4000-8000-000000000001` |
| `items[].replyToMessageId` | No | `string` | formato `uuid`; admite null | Mensaje al que responde, si responde a alguno. | `00000000-0000-4000-8000-000000000001` |
| `items[].contentTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de contenido. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodyText` | No | `string` | admite null | Cuerpo del mensaje. | `valor-ejemplo` |
| `items[].attachmentFileId` | No | `string` | formato `uuid`; admite null | Adjunto en `common.files`. | `00000000-0000-4000-8000-000000000001` |
| `items[].isEdited` | No | `boolean` | admite null | Si fue editado. | `true` |
| `items[].sentAt` | No | `string` | formato `date-time`; admite null | Cuándo se envió. | `2026-07-31T12:00:00.000Z` |
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

## 9. POST /community/conversations/{conversationId}/messages

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

## 10. POST /community/conversations/{conversationId}/read

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

## 11. GET /community/feed

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
        "editedAt": "2026-07-31T12:00:00.000Z"
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
| `items` | Sí | `array<FeedListItemDto>` | Sin restricción adicional declarada | Entradas de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","itemTypeConceptId":"00000000-0000-4000-8000-000000000001","sourceTypeConceptId":"00000000-0000-4000-8000-000000000001","sourceRefId":"00000000-0000-4000-8000-000000000001","originConceptId":"00000000-0000-4000-8000-000000000001","rankScore":"valor-ejemplo","isSeen":true,"createdAt":"2026-07-31T12:00:00.000Z","post":{"id":"00000000-0000-4000-8000-000000000001","authorPublicProfileId":"00000000-0000-4000-8000-000000000001","postTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","visibilityConceptId":"00000000-0000-4000-8000-000000000001","commentsEnabled":true,"publishedAt":"2026-07-31T12:00:00.000Z","editedAt":"2026-07-31T12:00:00.000Z"}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la entrada. | `00000000-0000-4000-8000-000000000001` |
| `items[].itemTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de entrada. | `00000000-0000-4000-8000-000000000001` |
| `items[].sourceTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de fuente. | `00000000-0000-4000-8000-000000000001` |
| `items[].sourceRefId` | Sí | `string` | formato `uuid` | Id de la fuente (hoy, la publicación). | `00000000-0000-4000-8000-000000000001` |
| `items[].originConceptId` | Sí | `string` | formato `uuid` | Concept id del origen (seguidos, grupo, sugerido…). | `00000000-0000-4000-8000-000000000001` |
| `items[].rankScore` | No | `string` | admite null | Puntaje de orden (numeric como texto) | `valor-ejemplo` |
| `items[].isSeen` | No | `boolean` | admite null | Si ya se mostró. | `true` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo entró al timeline. | `2026-07-31T12:00:00.000Z` |
| `items[].post` | No | `PostListItemDto` | Sin restricción adicional declarada | La publicación de la entrada, si sigue visible para el lector. Nula cuando la fuente ya no es legible —se retiró, o el autor y el lector se bloquearon después del fan-out—. La entrada igual viaja para que el cliente pueda mostrar el hueco en vez de saltear filas y descuadrar el conteo de la página. | `{"id":"00000000-0000-4000-8000-000000000001","authorPublicProfileId":"00000000-0000-4000-8000-000000000001","postTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","visibilityConceptId":"00000000-0000-4000-8000-000000000001","commentsEnabled":true,"publishedAt":"2026-07-31T12:00:00.000Z","editedAt":"2026-07-31T12:00:00.000Z"}` |
| `items[].post.id` | No | `string` | formato `uuid` | Identificador de la publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.authorPublicProfileId` | No | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.postTypeConceptId` | No | `string` | formato `uuid` | Concept id del tipo de publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.bodyText` | No | `string` | Sin restricción adicional declarada | Cuerpo del texto. | `valor-ejemplo` |
| `items[].post.visibilityConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la visibilidad declarada; nulo se lee como pública. | `00000000-0000-4000-8000-000000000001` |
| `items[].post.commentsEnabled` | No | `boolean` | admite null | Si admite comentarios. | `true` |
| `items[].post.publishedAt` | No | `string` | formato `date-time`; admite null | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `items[].post.editedAt` | No | `string` | formato `date-time`; admite null | Si fue editada, cuándo. | `2026-07-31T12:00:00.000Z` |
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

## 12. GET /community/follows

- **Módulo:** `community`
- **Etiqueta OpenAPI:** `community-social`
- **Nombre:** Seguimientos activos de un perfil
- **Operation ID:** `CommunitySocialController_listFollows`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommunitySocialController.listFollows](../../src/modules/community/controllers/community-social.controller.ts)

### Descripción de negocio

Seguimientos activos de un perfil. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Seguimientos emitidos por un perfil.

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

## 13. POST /community/follows

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

## 14. GET /community/groups

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
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/groups?tenantId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
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
GET /community/groups?tenantId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
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

## 15. POST /community/groups

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

## 16. GET /community/groups/{groupId}/members

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
| `cursor` | query | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `limit` | query | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `1` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /community/groups/00000000-0000-4000-8000-000000000001/members?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
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
GET /community/groups/00000000-0000-4000-8000-000000000001/members?actorProfileId=00000000-0000-4000-8000-000000000001&cursor=valor-ejemplo&limit=1 HTTP/1.1
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

## 17. POST /community/groups/{groupId}/members

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

## 18. POST /community/moderation/decisions/{decisionId}/appeal

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

## 19. POST /community/moderation/queue/{queueId}/decision

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

## 20. GET /community/notifications

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

## 21. GET /community/polls/{pollId}

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

## 22. POST /community/polls/{pollId}/votes

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

## 23. GET /community/posts/{postId}

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

## 24. GET /community/posts/{postId}/comments

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
| `items` | Sí | `array<CommentThreadItemDto>` | Sin restricción adicional declarada | Comentarios raíz de la página, cada uno con sus respuestas. | `[{"id":"00000000-0000-4000-8000-000000000001","authorProfileId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","parentCommentId":"00000000-0000-4000-8000-000000000001","threadDepth":1,"replyCount":1,"createdAt":"2026-07-31T12:00:00.000Z","replies":["<CommentThreadItemDto>"]}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del comentario. | `00000000-0000-4000-8000-000000000001` |
| `items[].authorProfileId` | Sí | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Cuerpo del comentario. | `valor-ejemplo` |
| `items[].parentCommentId` | No | `string` | formato `uuid`; admite null | Comentario padre, si es una respuesta. | `00000000-0000-4000-8000-000000000001` |
| `items[].threadDepth` | No | `number` | admite null | Profundidad dentro del hilo. | `1` |
| `items[].replyCount` | No | `number` | admite null | Cuántas respuestas tiene registradas. | `1` |
| `items[].createdAt` | Sí | `string` | formato `date-time` | Cuándo se creó. | `2026-07-31T12:00:00.000Z` |
| `items[].replies` | Sí | `array<CommentThreadItemDto>` | Sin restricción adicional declarada | Respuestas anidadas de este comentario. | `["<CommentThreadItemDto>"]` |
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

## 25. POST /community/posts/{postId}/polls

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

## 26. GET /community/posts/{postId}/reactions

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
      "count": 1
    }
  ],
  "total": 1,
  "actorReactionTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `tallies` | Sí | `array<ReactionTallyDto>` | Sin restricción adicional declarada | Recuento por tipo. | `[{"reactionTypeConceptId":"00000000-0000-4000-8000-000000000001","count":1}]` |
| `tallies[].reactionTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de reacción. | `00000000-0000-4000-8000-000000000001` |
| `tallies[].count` | Sí | `number` | Sin restricción adicional declarada | Cantidad de reacciones de ese tipo. | `1` |
| `total` | Sí | `number` | Sin restricción adicional declarada | Total de reacciones. | `1` |
| `actorReactionTypeConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la reacción del propio actor, si preguntó por sí mismo. `null` distingue «no reaccionó» de `undefined` «no preguntó»: la interfaz necesita saber si puede pintar el botón como activo o si directamente no tiene esa información. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
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

## 27. GET /community/profiles/{profileId}

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

## 28. GET /community/profiles/{profileId}/posts

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
      "editedAt": "2026-07-31T12:00:00.000Z"
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
| `items` | Sí | `array<PostListItemDto>` | Sin restricción adicional declarada | Publicaciones de la página. | `[{"id":"00000000-0000-4000-8000-000000000001","authorPublicProfileId":"00000000-0000-4000-8000-000000000001","postTypeConceptId":"00000000-0000-4000-8000-000000000001","bodyText":"valor-ejemplo","visibilityConceptId":"00000000-0000-4000-8000-000000000001","commentsEnabled":true,"publishedAt":"2026-07-31T12:00:00.000Z","editedAt":"2026-07-31T12:00:00.000Z"}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador de la publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].authorPublicProfileId` | Sí | `string` | formato `uuid` | Perfil autor. | `00000000-0000-4000-8000-000000000001` |
| `items[].postTypeConceptId` | Sí | `string` | formato `uuid` | Concept id del tipo de publicación. | `00000000-0000-4000-8000-000000000001` |
| `items[].bodyText` | Sí | `string` | Sin restricción adicional declarada | Cuerpo del texto. | `valor-ejemplo` |
| `items[].visibilityConceptId` | No | `string` | formato `uuid`; admite null | Concept id de la visibilidad declarada; nulo se lee como pública. | `00000000-0000-4000-8000-000000000001` |
| `items[].commentsEnabled` | No | `boolean` | admite null | Si admite comentarios. | `true` |
| `items[].publishedAt` | No | `string` | formato `date-time`; admite null | Cuándo se publicó. | `2026-07-31T12:00:00.000Z` |
| `items[].editedAt` | No | `string` | formato `date-time`; admite null | Si fue editada, cuándo. | `2026-07-31T12:00:00.000Z` |
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

## 29. POST /community/profiles/{profileId}/posts

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

## 30. GET /community/profiles/{profileId}/reviews

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

## 31. POST /community/profiles/{profileId}/reviews

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

## 32. GET /community/profiles/me

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
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
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
| `verificationStatusConceptId` | Sí | `string` | formato `uuid`; admite null | Lo otorga la plataforma; se muestra, no se declara. | `00000000-0000-4000-8000-000000000001` |
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

## 33. PUT /community/profiles/me

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
  "acceptsReviews": true
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
  "verificationStatusConceptId": "00000000-0000-4000-8000-000000000001",
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
| `verificationStatusConceptId` | Sí | `string` | formato `uuid`; admite null | Lo otorga la plataforma; se muestra, no se declara. | `00000000-0000-4000-8000-000000000001` |
| `statusConceptId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ese enlace ya está en uso | Excepción explícita en src/modules/community/services/community-social.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se pudo recuperar el perfil público recién guardado | Excepción explícita en src/modules/community/services/community-social.service.ts |
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

## 34. POST /community/public-profiles

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

## 35. PUT /community/reactions

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

## 36. POST /community/reports

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

## 37. GET /internal/community/feed/pending

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

## 38. POST /internal/community/feed/rebuild

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

