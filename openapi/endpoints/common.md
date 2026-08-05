<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `common`

Referencia exhaustiva de 13 operación(es) del módulo `common`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `common/addresses`, `common/contact-points`, `common/files`, `common/identifiers`, `internal/files`
- **Controladores:** `CommonAddressesController`, `CommonContactPointsController`, `CommonFilesController`, `CommonIdentifiersController`, `InternalFilesController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /common/addresses](#1-post-common-addresses) — Registrar una dirección (UC-02-04)
2. [POST /common/contact-points](#2-post-common-contact-points) — Registrar un punto de contacto (UC-02-02)
3. [POST /common/contact-points/{id}/verify](#3-post-common-contact-points-id-verify) — Verificar un punto de contacto (UC-02-03)
4. [POST /common/files](#4-post-common-files) — Crear un archivo con su versión inicial (UC-02-05)
5. [DELETE /common/files/{id}](#5-delete-common-files-id) — Borrar lógicamente un archivo (UC-02-10)
6. [GET /common/files/{id}/content](#6-get-common-files-id-content) — Descargar el contenido vigente de un archivo
7. [POST /common/files/{id}/download-url](#7-post-common-files-id-download-url) — Emitir una URL de descarga firmada (UC-02-11)
8. [POST /common/files/{id}/links](#8-post-common-files-id-links) — Vincular un archivo a un propietario (UC-02-08)
9. [POST /common/files/{id}/versions](#9-post-common-files-id-versions) — Añadir una versión a un archivo (UC-02-06)
10. [POST /common/files/{id}/versions/{vid}/derivatives](#10-post-common-files-id-versions-vid-derivatives) — Generar un derivado de una versión (UC-02-07)
11. [POST /common/files/upload](#11-post-common-files-upload) — Subir el contenido de un archivo (multipart)
12. [POST /common/identifiers](#12-post-common-identifiers) — Registrar un identificador oficial (UC-02-01)
13. [POST /internal/files/versions/{vid}/scan-result](#13-post-internal-files-versions-vid-scan-result) — Registrar resultado de escaneo antimalware (UC-02-09)

---

## 1. POST /common/addresses

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/addresses`
- **Nombre:** Registrar una dirección (UC-02-04)
- **Operation ID:** `CommonAddressesController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonAddressesController.create](../../src/modules/common/controllers/common-addresses.controller.ts)

### Descripción de negocio

Registrar una dirección (UC-02-04). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-04: registra una dirección postal.

### Descripción del sistema

NestJS resuelve `POST /common/addresses` en `CommonAddressesController_create`. El controlador delega en `AddressesService.create`. Valida el body como `CreateAddressDto` y consume `application/json`. El tipo de retorno estático es `Promise<AddressResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAddressDto`; los campos opcionales se omiten.

```http
POST /common/addresses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "lines": [
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
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `ownerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `lines` | Sí | `array<string>` | Sin restricción adicional declarada | Líneas de la dirección. | `["valor-ejemplo"]` |
| `city` | No | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `postalCode` | No | `string` | longitud máxima 32 | Sin descripción específica en el contrato OpenAPI. | `CODIGO_EJEMPLO` |
| `country` | No | `string` | longitud máxima 2 | Código de país ISO. Por defecto 'PE'. | `BO` |
| `use` | No | `string` | valores: `HOME`, `WORK` | Sin descripción específica en el contrato OpenAPI. | `HOME` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/addresses HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "lines": [
    "valor-ejemplo"
  ],
  "city": "valor-ejemplo",
  "postalCode": "CODIGO_EJEMPLO",
  "country": "BO",
  "use": "HOME"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AddressResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AddressResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AddressResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "ownerType": "USER",
  "lines": [
    "valor-ejemplo"
  ],
  "city": "valor-ejemplo",
  "postalCode": "CODIGO_EJEMPLO",
  "country": "BO",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `ownerId` | Sí | `string` | formato `uuid` | Identificador asociado a owner. | `00000000-0000-4000-8000-000000000001` |
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Valor de owner type mantenido por la instancia. | `USER` |
| `lines` | Sí | `array<string>` | Sin restricción adicional declarada | Valor de lines mantenido por la instancia. | `["valor-ejemplo"]` |
| `city` | No | `string` | Sin restricción adicional declarada | Valor de city mantenido por la instancia. | `valor-ejemplo` |
| `postalCode` | No | `string` | Sin restricción adicional declarada | Valor de postal code mantenido por la instancia. | `CODIGO_EJEMPLO` |
| `country` | Sí | `string` | Sin restricción adicional declarada | Código de país. | `BO` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/common/addresses"
}
```

---

## 2. POST /common/contact-points

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/contact-points`
- **Nombre:** Registrar un punto de contacto (UC-02-02)
- **Operation ID:** `CommonContactPointsController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonContactPointsController.create](../../src/modules/common/controllers/common-contact-points.controller.ts)

### Descripción de negocio

Registrar un punto de contacto (UC-02-02). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-02: registra un punto de contacto.

### Descripción del sistema

NestJS resuelve `POST /common/contact-points` en `CommonContactPointsController_create`. El controlador delega en `ContactPointsService.create`. Valida el body como `CreateContactPointDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContactPointResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateContactPointDto`; los campos opcionales se omiten.

```http
POST /common/contact-points HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "system": "EMAIL",
  "value": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `ownerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `system` | Sí | `string` | valores: `EMAIL`, `PHONE` | Sin descripción específica en el contrato OpenAPI. | `EMAIL` |
| `value` | Sí | `string` | longitud máxima 255 | Correo o teléfono según el sistema. | `valor-ejemplo` |
| `use` | No | `string` | valores: `HOME`, `WORK` | Sin descripción específica en el contrato OpenAPI. | `HOME` |
| `rank` | No | `number` | mínimo 0 | Orden de preferencia. | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/contact-points HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "system": "EMAIL",
  "value": "valor-ejemplo",
  "use": "HOME",
  "rank": 1
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContactPointResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "ownerType": "USER",
  "system": "EMAIL",
  "value": "valor-ejemplo",
  "verified": true,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `ownerId` | Sí | `string` | formato `uuid` | Identificador asociado a owner. | `00000000-0000-4000-8000-000000000001` |
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Valor de owner type mantenido por la instancia. | `USER` |
| `system` | Sí | `string` | valores: `EMAIL`, `PHONE` | Valor de system mantenido por la instancia. | `EMAIL` |
| `value` | Sí | `string` | Sin restricción adicional declarada | Valor de value mantenido por la instancia. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Valor de verified mantenido por la instancia. | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/common/contact-points"
}
```

---

## 3. POST /common/contact-points/{id}/verify

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/contact-points`
- **Nombre:** Verificar un punto de contacto (UC-02-03)
- **Operation ID:** `CommonContactPointsController_verify`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonContactPointsController.verify](../../src/modules/common/controllers/common-contact-points.controller.ts)

### Descripción de negocio

Verificar un punto de contacto (UC-02-03). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-03: verifica un punto de contacto.

### Descripción del sistema

NestJS resuelve `POST /common/contact-points/{id}/verify` en `CommonContactPointsController_verify`. El controlador delega en `ContactPointsService.verify`. Valida el body como `VerifyContactPointDto` y consume `application/json`. El tipo de retorno estático es `Promise<ContactPointResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `VerifyContactPointDto`; los campos opcionales se omiten.

```http
POST /common/contact-points/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | No | `string` | longitud máxima 32 | Código de verificación (OTP). En esta implementación se acepta cualquiera. | `CODIGO_EJEMPLO` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/contact-points/00000000-0000-4000-8000-000000000001/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "code": "CODIGO_EJEMPLO"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ContactPointResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ContactPointResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "ownerType": "USER",
  "system": "EMAIL",
  "value": "valor-ejemplo",
  "verified": true,
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `ownerId` | Sí | `string` | formato `uuid` | Identificador asociado a owner. | `00000000-0000-4000-8000-000000000001` |
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Valor de owner type mantenido por la instancia. | `USER` |
| `system` | Sí | `string` | valores: `EMAIL`, `PHONE` | Valor de system mantenido por la instancia. | `EMAIL` |
| `value` | Sí | `string` | Sin restricción adicional declarada | Valor de value mantenido por la instancia. | `valor-ejemplo` |
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | Valor de verified mantenido por la instancia. | `true` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Punto de contacto no encontrado | Excepción explícita en src/modules/common/services/contact-points.service.ts |
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
  "path": "/common/contact-points/{id}/verify"
}
```

---

## 4. POST /common/files

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Crear un archivo con su versión inicial (UC-02-05)
- **Operation ID:** `CommonFilesController_createFile`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.createFile](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Crear un archivo con su versión inicial (UC-02-05). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-05: crea un archivo y su primera versión.

### Descripción del sistema

NestJS resuelve `POST /common/files` en `CommonFilesController_createFile`. El controlador delega en `FilesService.createFile`. Valida el body como `CreateFileDto` y consume `application/json`. El tipo de retorno estático es `Promise<FileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFileDto`; los campos opcionales se omiten.

```http
POST /common/files HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "originalName": "Nombre de ejemplo",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `originalName` | Sí | `string` | longitud máxima 512 | Sin descripción específica en el contrato OpenAPI. | `Nombre de ejemplo` |
| `category` | Sí | `string` | valores: `DOCUMENT`, `IMAGE` | Sin descripción específica en el contrato OpenAPI. | `DOCUMENT` |
| `sensitivity` | Sí | `string` | valores: `NORMAL`, `PHI` | Sin descripción específica en el contrato OpenAPI. | `NORMAL` |
| `mimeType` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | Sí | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `contentHash` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `storageUri` | Sí | `string` | longitud máxima 2048 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/files HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "originalName": "Nombre de ejemplo",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "currentVersionId": "00000000-0000-4000-8000-000000000001",
  "originalName": "Nombre de ejemplo",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL",
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `currentVersionId` | No | `string` | formato `uuid` | Identificador asociado a current version. | `00000000-0000-4000-8000-000000000001` |
| `originalName` | No | `string` | Sin restricción adicional declarada | Valor de original name mantenido por la instancia. | `Nombre de ejemplo` |
| `category` | Sí | `string` | valores: `DOCUMENT`, `IMAGE` | Valor de category mantenido por la instancia. | `DOCUMENT` |
| `sensitivity` | Sí | `string` | valores: `NORMAL`, `PHI` | Valor de sensitivity mantenido por la instancia. | `NORMAL` |
| `lifecycleStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del ciclo de vida (concept id). | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

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
  "path": "/common/files"
}
```

---

## 5. DELETE /common/files/{id}

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Borrar lógicamente un archivo (UC-02-10)
- **Operation ID:** `CommonFilesController_softDelete`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.softDelete](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Borrar lógicamente un archivo (UC-02-10). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-10: borrado lógico del archivo.

### Descripción del sistema

NestJS resuelve `DELETE /common/files/{id}` en `CommonFilesController_softDelete`. El controlador delega en `FilesService.softDelete`. No recibe body. El tipo de retorno estático es `Promise<DeleteFileResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
DELETE /common/files/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
DELETE /common/files/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DeleteFileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DeleteFileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "deletedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `deletedAt` | Sí | `string` | formato `date-time` | Fecha y hora de la eliminación lógica, si corresponde. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/files.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo está bajo retención legal y no puede borrarse | Excepción explícita en src/modules/common/services/files.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/common/files/{id}"
}
```

---

## 6. GET /common/files/{id}/content

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Descargar el contenido vigente de un archivo
- **Operation ID:** `CommonFilesController_downloadContent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.downloadContent](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Descargar el contenido vigente de un archivo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Devuelve el contenido de la versión vigente de un archivo.

### Descripción del sistema

NestJS resuelve `GET /common/files/{id}/content` en `CommonFilesController_downloadContent`. El controlador delega en `FileUploadService.download`. No recibe body. El tipo de retorno estático es `Promise<void>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /common/files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /common/files/00000000-0000-4000-8000-000000000001/content HTTP/1.1
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
| 403 | `FORBIDDEN` | No tiene acceso a este archivo | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 404 | `NOT_FOUND` | Versión vigente no encontrada | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo está borrado | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo no tiene una versión vigente | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión vigente resultó infectada | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/common/files/{id}/content"
}
```

---

## 7. POST /common/files/{id}/download-url

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Emitir una URL de descarga firmada (UC-02-11)
- **Operation ID:** `CommonFilesController_downloadUrl`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.downloadUrl](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Emitir una URL de descarga firmada (UC-02-11). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-11: emite una URL de descarga firmada.

### Descripción del sistema

NestJS resuelve `POST /common/files/{id}/download-url` en `CommonFilesController_downloadUrl`. El controlador delega en `FilesService.generateDownloadUrl`. No recibe body. El tipo de retorno estático es `Promise<DownloadUrlResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/download-url HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/download-url HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DownloadUrlResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DownloadUrlResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "url": "valor-ejemplo",
  "expiresAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `url` | Sí | `string` | Sin restricción adicional declarada | URL de descarga firmada (simulada). | `valor-ejemplo` |
| `expiresAt` | Sí | `string` | formato `date-time` | Valor de expires at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/files.service.ts |
| 404 | `NOT_FOUND` | Versión vigente no encontrada | Excepción explícita en src/modules/common/services/files.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo está borrado | Excepción explícita en src/modules/common/services/files.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo no tiene una versión vigente | Excepción explícita en src/modules/common/services/files.service.ts |
| 422 | `PRECONDITION_FAILED` | La versión vigente no ha superado el escaneo antimalware | Excepción explícita en src/modules/common/services/files.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/common/files/{id}/download-url"
}
```

---

## 8. POST /common/files/{id}/links

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Vincular un archivo a un propietario (UC-02-08)
- **Operation ID:** `CommonFilesController_createLink`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.createLink](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Vincular un archivo a un propietario (UC-02-08). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-08: vincula un archivo a un propietario.

### Descripción del sistema

NestJS resuelve `POST /common/files/{id}/links` en `CommonFilesController_createLink`. El controlador delega en `FilesService.createLink`. Valida el body como `CreateFileLinkDto` y consume `application/json`. El tipo de retorno estático es `Promise<FileLinkResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFileLinkDto`; los campos opcionales se omiten.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Sin descripción específica en el contrato OpenAPI. | `USER` |
| `ownerId` | Sí | `string` | formato `uuid` | Sin descripción específica en el contrato OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `linkRole` | No | `string` | valores: `ATTACHMENT` | Sin descripción específica en el contrato OpenAPI. | `ATTACHMENT` |
| `visibility` | No | `string` | valores: `INTERNAL` | Sin descripción específica en el contrato OpenAPI. | `INTERNAL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/links HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "linkRole": "ATTACHMENT",
  "visibility": "INTERNAL"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FileLinkResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FileLinkResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "ownerType": "USER",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fileId` | Sí | `string` | formato `uuid` | Identificador asociado a file. | `00000000-0000-4000-8000-000000000001` |
| `ownerId` | Sí | `string` | formato `uuid` | Identificador asociado a owner. | `00000000-0000-4000-8000-000000000001` |
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Valor de owner type mantenido por la instancia. | `USER` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/files.service.ts |
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
  "path": "/common/files/{id}/links"
}
```

---

## 9. POST /common/files/{id}/versions

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Añadir una versión a un archivo (UC-02-06)
- **Operation ID:** `CommonFilesController_createVersion`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.createVersion](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Añadir una versión a un archivo (UC-02-06). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-06: añade una nueva versión.

### Descripción del sistema

NestJS resuelve `POST /common/files/{id}/versions` en `CommonFilesController_createVersion`. El controlador delega en `FilesService.createVersion`. Valida el body como `CreateFileVersionDto` y consume `application/json`. El tipo de retorno estático es `Promise<FileVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFileVersionDto`; los campos opcionales se omiten.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `mimeType` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | Sí | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `contentHash` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `storageUri` | Sí | `string` | longitud máxima 2048 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/versions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "storageUri": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FileVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "mimeType": "valor-ejemplo",
  "sizeBytes": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "malwareScanStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fileId` | Sí | `string` | formato `uuid` | Identificador asociado a file. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `mimeType` | Sí | `string` | Sin restricción adicional declarada | Valor de mime type mantenido por la instancia. | `valor-ejemplo` |
| `sizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño en bytes (bigint serializado como string). | `valor-ejemplo` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Valor de content hash mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `malwareScanStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del escaneo antimalware (concept id). | `00000000-0000-4000-8000-000000000001` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Archivo no encontrado | Excepción explícita en src/modules/common/services/files.service.ts |
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
  "path": "/common/files/{id}/versions"
}
```

---

## 10. POST /common/files/{id}/versions/{vid}/derivatives

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Generar un derivado de una versión (UC-02-07)
- **Operation ID:** `CommonFilesController_createDerivative`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.createDerivative](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Generar un derivado de una versión (UC-02-07). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-07: genera un derivado de una versión limpia.

### Descripción del sistema

NestJS resuelve `POST /common/files/{id}/versions/{vid}/derivatives` en `CommonFilesController_createDerivative`. El controlador delega en `FilesService.createDerivative`. Valida el body como `CreateFileDerivativeDto` y consume `application/json`. El tipo de retorno estático es `Promise<FileDerivativeResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `vid` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateFileDerivativeDto`; los campos opcionales se omiten.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/derivatives HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "derivativeType": "THUMBNAIL",
  "storageUri": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Deben ser UUID válidos: `id`, `vid`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `derivativeType` | Sí | `string` | valores: `THUMBNAIL`, `OCR` | Sin descripción específica en el contrato OpenAPI. | `THUMBNAIL` |
| `storageUri` | Sí | `string` | longitud máxima 2048 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `mimeType` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `valor-ejemplo` |
| `sizeBytes` | Sí | `number` | mínimo 0 | Sin descripción específica en el contrato OpenAPI. | `1` |
| `contentHash` | Sí | `string` | longitud máxima 255 | Sin descripción específica en el contrato OpenAPI. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/files/00000000-0000-4000-8000-000000000001/versions/00000000-0000-4000-8000-000000000001/derivatives HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "derivativeType": "THUMBNAIL",
  "storageUri": "valor-ejemplo",
  "mimeType": "valor-ejemplo",
  "sizeBytes": 1,
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FileDerivativeResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FileDerivativeResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "sourceFileVersionId": "00000000-0000-4000-8000-000000000001",
  "derivativeFileVersionId": "00000000-0000-4000-8000-000000000001",
  "derivativeType": "THUMBNAIL",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `sourceFileVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a source file version. | `00000000-0000-4000-8000-000000000001` |
| `derivativeFileVersionId` | Sí | `string` | formato `uuid` | Identificador asociado a derivative file version. | `00000000-0000-4000-8000-000000000001` |
| `derivativeType` | Sí | `string` | valores: `THUMBNAIL`, `OCR` | Valor de derivative type mantenido por la instancia. | `THUMBNAIL` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de archivo no encontrada | Excepción explícita en src/modules/common/services/files.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Solo se pueden generar derivados de versiones con escaneo limpio | Excepción explícita en src/modules/common/services/files.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/common/files/{id}/versions/{vid}/derivatives"
}
```

---

## 11. POST /common/files/upload

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/files`
- **Nombre:** Subir el contenido de un archivo (multipart)
- **Operation ID:** `CommonFilesController_upload`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonFilesController.upload](../../src/modules/common/controllers/common-files.controller.ts)

### Descripción de negocio

Subir el contenido de un archivo (multipart). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Sube el contenido de un archivo y registra su metadata. Es la contraparte de `POST /common/files`: aquel registra un archivo que el llamador ya subió a un proveedor externo y del que sólo aporta la `storageUri`; éste recibe los bytes y deja que el adaptador de almacenamiento decida dónde viven.

### Descripción del sistema

NestJS resuelve `POST /common/files/upload` en `CommonFilesController_upload`. El controlador delega en `FileUploadService.upload`. Valida el body como `object` y consume `multipart/form-data`. El tipo de retorno estático es `Promise<FileResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `object`; los campos opcionales se omiten.

```http
POST /common/files/upload HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: multipart/form-data

{
  "file": "<contenido-binario>",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `file` | Sí | `string` | formato `binary` | Sin descripción específica en el contrato OpenAPI. | `<contenido-binario>` |
| `category` | Sí | `string` | valores: `DOCUMENT`, `IMAGE` | Sin descripción específica en el contrato OpenAPI. | `DOCUMENT` |
| `sensitivity` | Sí | `string` | valores: `NORMAL`, `PHI` | Sin descripción específica en el contrato OpenAPI. | `NORMAL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/files/upload HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: multipart/form-data

{
  "file": "<contenido-binario>",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<FileResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FileResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FileResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "currentVersionId": "00000000-0000-4000-8000-000000000001",
  "originalName": "Nombre de ejemplo",
  "category": "DOCUMENT",
  "sensitivity": "NORMAL",
  "lifecycleStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "createdAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `currentVersionId` | No | `string` | formato `uuid` | Identificador asociado a current version. | `00000000-0000-4000-8000-000000000001` |
| `originalName` | No | `string` | Sin restricción adicional declarada | Valor de original name mantenido por la instancia. | `Nombre de ejemplo` |
| `category` | Sí | `string` | valores: `DOCUMENT`, `IMAGE` | Valor de category mantenido por la instancia. | `DOCUMENT` |
| `sensitivity` | Sí | `string` | valores: `NORMAL`, `PHI` | Valor de sensitivity mantenido por la instancia. | `NORMAL` |
| `lifecycleStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del ciclo de vida (concept id). | `00000000-0000-4000-8000-000000000001` |
| `createdAt` | Sí | `string` | formato `date-time` | Fecha y hora en que se creó el registro. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | No se recibió contenido en el campo "file" | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 422 | `PRECONDITION_FAILED` | El archivo excede el tamaño máximo permitido | Excepción explícita en src/modules/common/services/file-upload.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/common/files/upload"
}
```

---

## 12. POST /common/identifiers

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `common/identifiers`
- **Nombre:** Registrar un identificador oficial (UC-02-01)
- **Operation ID:** `CommonIdentifiersController_create`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [CommonIdentifiersController.create](../../src/modules/common/controllers/common-identifiers.controller.ts)

### Descripción de negocio

Registrar un identificador oficial (UC-02-01). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-01: registra un identificador oficial.

### Descripción del sistema

NestJS resuelve `POST /common/identifiers` en `CommonIdentifiersController_create`. El controlador delega en `IdentifiersService.create`. Valida el body como `CreateIdentifierDto` y consume `application/json`. El tipo de retorno estático es `Promise<IdentifierResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateIdentifierDto`; los campos opcionales se omiten.

```http
POST /common/identifiers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "type": "NATIONAL_ID",
  "value": "valor-ejemplo"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `ownerType` | Sí | `string` | valores: `USER`, `PATIENT`, `TENANT` | Tipo de propietario polimórfico. | `USER` |
| `ownerId` | Sí | `string` | formato `uuid` | Id del propietario (no FK). | `00000000-0000-4000-8000-000000000001` |
| `type` | Sí | `string` | valores: `NATIONAL_ID`, `MRN`, `PASSPORT` | Sin descripción específica en el contrato OpenAPI. | `NATIONAL_ID` |
| `system` | No | `string` | longitud máxima 255 | Sistema emisor (URI/OID) opcional. | `valor-ejemplo` |
| `value` | Sí | `string` | longitud máxima 255 | Valor del identificador. | `valor-ejemplo` |
| `use` | No | `string` | valores: `OFFICIAL`, `SECONDARY` | Sin descripción específica en el contrato OpenAPI. | `OFFICIAL` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /common/identifiers HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "ownerType": "USER",
  "ownerId": "00000000-0000-4000-8000-000000000001",
  "type": "NATIONAL_ID",
  "system": "valor-ejemplo",
  "value": "valor-ejemplo",
  "use": "OFFICIAL"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IdentifierResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IdentifierResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "canonicalHealthResourceId": "00000000-0000-4000-8000-000000000001",
  "isPrimary": true,
  "supersededIdentifierId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `canonicalHealthResourceId` | Sí | `string` | formato `uuid` | Identificador asociado a canonical health resource. | `00000000-0000-4000-8000-000000000001` |
| `isPrimary` | Sí | `boolean` | Sin restricción adicional declarada | Valor de is primary mantenido por la instancia. | `true` |
| `supersededIdentifierId` | No | `string` | formato `uuid` | Identificador principal que se cerró | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no tiene acceso al tenant o alcance exigido por la operación. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe un identificador activo con ese tipo, sistema y valor | Excepción explícita en src/modules/common/services/identifiers.service.ts |
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
  "path": "/common/identifiers"
}
```

---

## 13. POST /internal/files/versions/{vid}/scan-result

- **Módulo:** `common`
- **Etiqueta OpenAPI:** `internal/files`
- **Nombre:** Registrar resultado de escaneo antimalware (UC-02-09)
- **Operation ID:** `InternalFilesController_scanResult`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [InternalFilesController.scanResult](../../src/modules/common/controllers/internal-files.controller.ts)

### Descripción de negocio

Registrar resultado de escaneo antimalware (UC-02-09). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-02-09: callback del antivirus con el resultado del escaneo.

### Descripción del sistema

NestJS resuelve `POST /internal/files/versions/{vid}/scan-result` en `InternalFilesController_scanResult`. El controlador delega en `FilesService.recordScanResult`. Valida el body como `ScanResultDto` y consume `application/json`. El tipo de retorno estático es `Promise<FileVersionResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `vid` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ScanResultDto`; los campos opcionales se omiten.

```http
POST /internal/files/versions/00000000-0000-4000-8000-000000000001/scan-result HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "result": "CLEAN"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `vid`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `result` | Sí | `string` | valores: `CLEAN`, `INFECTED` | Sin descripción específica en el contrato OpenAPI. | `CLEAN` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /internal/files/versions/00000000-0000-4000-8000-000000000001/scan-result HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "result": "CLEAN"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<FileVersionResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `FileVersionResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "fileId": "00000000-0000-4000-8000-000000000001",
  "versionNumber": 1,
  "mimeType": "valor-ejemplo",
  "sizeBytes": "valor-ejemplo",
  "contentHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "malwareScanStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | formato `uuid` | Identificador único de la instancia. | `00000000-0000-4000-8000-000000000001` |
| `fileId` | Sí | `string` | formato `uuid` | Identificador asociado a file. | `00000000-0000-4000-8000-000000000001` |
| `versionNumber` | Sí | `number` | Sin restricción adicional declarada | Valor de version number mantenido por la instancia. | `1` |
| `mimeType` | Sí | `string` | Sin restricción adicional declarada | Valor de mime type mantenido por la instancia. | `valor-ejemplo` |
| `sizeBytes` | Sí | `string` | Sin restricción adicional declarada | Tamaño en bytes (bigint serializado como string). | `valor-ejemplo` |
| `contentHash` | Sí | `string` | Sin restricción adicional declarada | Valor de content hash mantenido por la instancia. | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `malwareScanStatusConceptId` | Sí | `string` | Sin restricción adicional declarada | Estado del escaneo antimalware (concept id). | `00000000-0000-4000-8000-000000000001` |
| `recordedAt` | Sí | `string` | formato `date-time` | Valor de recorded at mantenido por la instancia. | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Versión de archivo no encontrada | Excepción explícita en src/modules/common/services/files.service.ts |
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
  "path": "/internal/files/versions/{vid}/scan-result"
}
```

---

