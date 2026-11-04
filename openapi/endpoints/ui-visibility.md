<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `ui_visibility`

Referencia exhaustiva de 9 operación(es) del módulo `ui_visibility`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `admin-ui-visibility`, `me-ui-visibility`
- **Controladores:** `AdminUiVisibilityController`, `MeUiVisibilityController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/ui-visibility/elements](#1-get-admin-ui-visibility-elements) — Catálogo de elementos de la interfaz (cursor por clave)
2. [POST /admin/ui-visibility/elements](#2-post-admin-ui-visibility-elements) — Alta manual de un elemento (source ADMIN)
3. [POST /admin/ui-visibility/elements/sync](#3-post-admin-ui-visibility-elements-sync) — Sincroniza el registro del front (idempotente por key)
4. [GET /admin/ui-visibility/preview](#4-get-admin-ui-visibility-preview) — Vista previa «ver como»: lo oculto y la regla ganadora de cada elemento
5. [GET /admin/ui-visibility/rules](#5-get-admin-ui-visibility-rules) — Reglas de visibilidad (cursor por fecha de alta)
6. [POST /admin/ui-visibility/rules](#6-post-admin-ui-visibility-rules) — Crear una regla SHOW/HIDE
7. [PATCH /admin/ui-visibility/rules/{id}](#7-patch-admin-ui-visibility-rules-id) — Editar una regla con bloqueo optimista (409 si cambió)
8. [POST /admin/ui-visibility/rules/{id}/end](#8-post-admin-ui-visibility-rules-id-end) — Terminar una regla (validTo = ahora). Idempotente.
9. [GET /me/ui-visibility](#9-get-me-ui-visibility) — Claves ocultas para quien llama

---

## 1. GET /admin/ui-visibility/elements

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Catálogo de elementos de la interfaz (cursor por clave)
- **Operation ID:** `AdminUiVisibilityController_elements`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.elements](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Catálogo de elementos de la interfaz (cursor por clave). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/ui-visibility/elements` en `AdminUiVisibilityController_elements`. El controlador delega en `UiVisibilityAdminService.listElements`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `module` | query | No | `string` | longitud máxima 80 | Código del módulo | `valor-ejemplo` |
| `kind` | query | No | `string` | valores: `MODULE`, `MENU_SECTION`, `SCREEN`, `SECTION`, `WIDGET`, `FIELD`, `ACTION` | Sin descripción específica en OpenAPI. | `MODULE` |
| `q` | query | No | `string` | longitud máxima 120 | Busca en la clave y la etiqueta | `valor-ejemplo` |
| `status` | query | No | `string` | valores: `ACTIVE`, `RETIRED` | Sin descripción específica en OpenAPI. | `ACTIVE` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ui-visibility/elements HTTP/1.1
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
GET /admin/ui-visibility/elements?cursor=valor-ejemplo&limit=50&module=valor-ejemplo&kind=MODULE&q=valor-ejemplo&status=ACTIVE HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/elements"
}
```

---

## 2. POST /admin/ui-visibility/elements

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Alta manual de un elemento (source ADMIN)
- **Operation ID:** `AdminUiVisibilityController_createElement`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.createElement](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Alta manual de un elemento (source ADMIN). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/ui-visibility/elements` en `AdminUiVisibilityController_createElement`. El controlador delega en `UiVisibilityAdminService.createElement`. Valida el body como `CreateElementDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateElementDto`; los campos opcionales se omiten.

```http
POST /admin/ui-visibility/elements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "key": "pharmacy.orders.export-button",
  "kind": "MODULE",
  "moduleCode": "CODIGO_EJEMPLO",
  "label": "valor-ejemplo"
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
| `key` | Sí | `string` | longitud máxima 160; patrón runtime `UI_ELEMENT_KEY_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `pharmacy.orders.export-button` |
| `kind` | Sí | `string` | valores: `MODULE`, `MENU_SECTION`, `SCREEN`, `SECTION`, `WIDGET`, `FIELD`, `ACTION` | Sin descripción específica en el contrato OpenAPI. | `MODULE` |
| `moduleCode` | Sí | `string` | longitud mínima 1; longitud máxima 80 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `parentKey` | No | `object` | longitud máxima 160; patrón runtime `UI_ELEMENT_KEY_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `label` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `description` | No | `object` | longitud máxima 500; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `defaultVisible` | No | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/ui-visibility/elements HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "key": "pharmacy.orders.export-button",
  "kind": "MODULE",
  "moduleCode": "CODIGO_EJEMPLO",
  "parentKey": {},
  "label": "valor-ejemplo",
  "description": {},
  "defaultVisible": true
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/elements"
}
```

---

## 3. POST /admin/ui-visibility/elements/sync

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Sincroniza el registro del front (idempotente por key)
- **Operation ID:** `AdminUiVisibilityController_syncElements`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.syncElements](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Crea los elementos nuevos, actualiza los que cambiaron y retira los CODE que el lote ya no trae. Un lote vacío se rechaza.


### Descripción del sistema

NestJS resuelve `POST /admin/ui-visibility/elements/sync` en `AdminUiVisibilityController_syncElements`. El controlador delega en `UiVisibilityAdminService.syncElements`. Valida el body como `SyncElementsDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `SyncElementsDto`; los campos opcionales se omiten.

```http
POST /admin/ui-visibility/elements/sync HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "elements": [
    {
      "key": "pharmacy.orders.export-button",
      "kind": "MODULE",
      "moduleCode": "CODIGO_EJEMPLO",
      "label": "valor-ejemplo",
      "defaultVisible": true
    }
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
| `elements` | Sí | `array<UiElementDraftDto>` | máximo 2000 elemento(s) | Sin descripción específica en el contrato OpenAPI. | `[{"key":"pharmacy.orders.export-button","kind":"MODULE","moduleCode":"CODIGO_EJEMPLO","parentKey":{},"label":"valor-ejemplo","description":{},"defaultVisible":true}]` |
| `elements[].key` | Sí | `string` | longitud máxima 160; patrón runtime `UI_ELEMENT_KEY_PATTERN` | Sin descripción específica en el contrato OpenAPI. | `pharmacy.orders.export-button` |
| `elements[].kind` | Sí | `string` | valores: `MODULE`, `MENU_SECTION`, `SCREEN`, `SECTION`, `WIDGET`, `FIELD`, `ACTION` | Sin descripción específica en el contrato OpenAPI. | `MODULE` |
| `elements[].moduleCode` | Sí | `string` | longitud mínima 1; longitud máxima 80 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `elements[].parentKey` | No | `object` | longitud máxima 160; patrón runtime `UI_ELEMENT_KEY_PATTERN`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `elements[].label` | Sí | `string` | longitud mínima 1; longitud máxima 200 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `elements[].description` | No | `object` | longitud máxima 500; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `elements[].defaultVisible` | Sí | `boolean` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `true` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/ui-visibility/elements/sync HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "elements": [
    {
      "key": "pharmacy.orders.export-button",
      "kind": "MODULE",
      "moduleCode": "CODIGO_EJEMPLO",
      "parentKey": {},
      "label": "valor-ejemplo",
      "description": {},
      "defaultVisible": true
    }
  ]
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/elements/sync"
}
```

---

## 4. GET /admin/ui-visibility/preview

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Vista previa «ver como»: lo oculto y la regla ganadora de cada elemento
- **Operation ID:** `AdminUiVisibilityController_preview`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.preview](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Exactamente uno de `userId` o `roleCode`. Se resuelve en la organización activa del request.


### Descripción del sistema

NestJS resuelve `GET /admin/ui-visibility/preview` en `AdminUiVisibilityController_preview`. El controlador delega en `UiVisibilityAdminService.preview`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `userId` | query | No | `string` | formato `uuid` | «Ver como» este usuario | `00000000-0000-4000-8000-000000000001` |
| `roleCode` | query | No | `string` | longitud máxima 160 | «Ver como» este rol | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ui-visibility/preview HTTP/1.1
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
GET /admin/ui-visibility/preview?userId=00000000-0000-4000-8000-000000000001&roleCode=CODIGO_EJEMPLO HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/preview"
}
```

---

## 5. GET /admin/ui-visibility/rules

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Reglas de visibilidad (cursor por fecha de alta)
- **Operation ID:** `AdminUiVisibilityController_rules`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.rules](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Reglas de visibilidad (cursor por fecha de alta). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /admin/ui-visibility/rules` en `AdminUiVisibilityController_rules`. El controlador delega en `UiVisibilityAdminService.listRules`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `cursor` | query | No | `string` | longitud máxima 600 | Cursor opaco (`nextCursor`) | `valor-ejemplo` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `elementKey` | query | No | `string` | longitud máxima 160 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `subjectType` | query | No | `string` | valores: `USER`, `TENANT`, `ROLE`, `ORG_TYPE`, `ALL` | Sin descripción específica en OpenAPI. | `USER` |
| `subjectId` | query | No | `string` | longitud máxima 160 | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `active` | query | No | `boolean` | Sin restricción adicional declarada | true: sólo reglas en vigor ahora; false: terminadas, vencidas o futuras | `true` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/ui-visibility/rules HTTP/1.1
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
GET /admin/ui-visibility/rules?cursor=valor-ejemplo&limit=50&elementKey=valor-ejemplo&subjectType=USER&subjectId=00000000-0000-4000-8000-000000000001&active=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/rules"
}
```

---

## 6. POST /admin/ui-visibility/rules

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Crear una regla SHOW/HIDE
- **Operation ID:** `AdminUiVisibilityController_createRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.createRule](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Crear una regla SHOW/HIDE. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/ui-visibility/rules` en `AdminUiVisibilityController_createRule`. El controlador delega en `UiVisibilityAdminService.createRule`. Valida el body como `CreateRuleDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateRuleDto`; los campos opcionales se omiten.

```http
POST /admin/ui-visibility/rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "elementKey": "valor-ejemplo",
  "effect": "SHOW",
  "subjectType": "USER",
  "reason": "Texto descriptivo de ejemplo"
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
| `elementKey` | Sí | `string` | longitud máxima 160 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `effect` | Sí | `string` | valores: `SHOW`, `HIDE` | Sin descripción específica en el contrato OpenAPI. | `SHOW` |
| `subjectType` | Sí | `string` | valores: `USER`, `TENANT`, `ROLE`, `ORG_TYPE`, `ALL` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `subjectId` | No | `object` | longitud máxima 160; admite null | USER: id de usuario · TENANT: id de organización · ROLE: código de rol · ORG_TYPE: código del tipo de organización · ALL: null | `{}` |
| `validFrom` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `validTo` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `reason` | Sí | `string` | longitud mínima 10; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/ui-visibility/rules HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "elementKey": "valor-ejemplo",
  "effect": "SHOW",
  "subjectType": "USER",
  "subjectId": {},
  "validFrom": {},
  "validTo": {},
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/rules"
}
```

---

## 7. PATCH /admin/ui-visibility/rules/{id}

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Editar una regla con bloqueo optimista (409 si cambió)
- **Operation ID:** `AdminUiVisibilityController_updateRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.updateRule](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Editar una regla con bloqueo optimista (409 si cambió). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `PATCH /admin/ui-visibility/rules/{id}` en `AdminUiVisibilityController_updateRule`. El controlador delega en `UiVisibilityAdminService.updateRule`. Valida el body como `UpdateRuleDto` y consume `application/json`. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `If-Match` | header | Sí | `string` | Sin restricción adicional declarada | Versión de la regla que se leyó | `valor-ejemplo` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateRuleDto`; los campos opcionales se omiten.

```http
PATCH /admin/ui-visibility/rules/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
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
| `effect` | No | `string` | valores: `SHOW`, `HIDE` | Sin descripción específica en el contrato OpenAPI. | `SHOW` |
| `validFrom` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `validTo` | No | `object` | formato `date-time`; admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `reason` | No | `string` | longitud mínima 10; longitud máxima 500 | Sin descripción específica en el contrato OpenAPI. | `Texto descriptivo de ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /admin/ui-visibility/rules/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
If-Match: valor-ejemplo
Content-Type: application/json

{
  "effect": "SHOW",
  "validFrom": {},
  "validTo": {},
  "reason": "Texto descriptivo de ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 413 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/rules/{id}"
}
```

---

## 8. POST /admin/ui-visibility/rules/{id}/end

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `admin-ui-visibility`
- **Nombre:** Terminar una regla (validTo = ahora). Idempotente.
- **Operation ID:** `AdminUiVisibilityController_endRule`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AdminUiVisibilityController.endRule](../../src/modules/ui_visibility/controllers/admin-ui-visibility.controller.ts)

### Descripción de negocio

Terminar una regla (validTo = ahora). Idempotente.. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /admin/ui-visibility/rules/{id}/end` en `AdminUiVisibilityController_endRule`. El controlador delega en `UiVisibilityAdminService.endRule`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /admin/ui-visibility/rules/00000000-0000-4000-8000-000000000001/end HTTP/1.1
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
POST /admin/ui-visibility/rules/00000000-0000-4000-8000-000000000001/end HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Operación completada correctamente. | `no declarado` | No |
| 401 | Operación completada correctamente. | `no declarado` | No |
| 403 | Operación completada correctamente. | `no declarado` | No |
| 404 | Operación completada correctamente. | `no declarado` | No |
| 409 | Operación completada correctamente. | `no declarado` | No |
| 422 | Operación completada correctamente. | `no declarado` | No |
| 429 | Operación completada correctamente. | `no declarado` | No |
| 500 | Operación completada correctamente. | `no declarado` | No |
| 504 | Operación completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/admin/ui-visibility/rules/{id}/end"
}
```

---

## 9. GET /me/ui-visibility

- **Módulo:** `ui_visibility`
- **Etiqueta OpenAPI:** `me-ui-visibility`
- **Nombre:** Claves ocultas para quien llama
- **Operation ID:** `MeUiVisibilityController_mine`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [MeUiVisibilityController.mine](../../src/modules/ui_visibility/controllers/me-ui-visibility.controller.ts)

### Descripción de negocio

Sólo lo oculto; lo demás es visible. La visibilidad no es autorización: la API sigue autorizando cada petición.


### Descripción del sistema

NestJS resuelve `GET /me/ui-visibility` en `MeUiVisibilityController_mine`. El controlador delega en `UiVisibilityMeService.resolveMine`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `x-tenant-id` | header | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /me/ui-visibility HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
x-tenant-id: 00000000-0000-4000-8000-000000000001
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /me/ui-visibility HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
x-tenant-id: 00000000-0000-4000-8000-000000000001
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | No |
| 400 | Consulta completada correctamente. | `no declarado` | No |
| 401 | Consulta completada correctamente. | `no declarado` | No |
| 403 | Consulta completada correctamente. | `no declarado` | No |
| 429 | Consulta completada correctamente. | `no declarado` | No |
| 500 | Consulta completada correctamente. | `no declarado` | No |
| 504 | Consulta completada correctamente. | `no declarado` | No |

El controlador declara `no declarado`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

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
  "path": "/me/ui-visibility"
}
```

---

