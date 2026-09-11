<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `content_packs`

Referencia exhaustiva de 2 operación(es) del módulo `content_packs`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `content-packs`
- **Controladores:** `ContentPacksController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /admin/content-packs](#1-get-admin-content-packs) — Paquetes de contenido disponibles
2. [POST /admin/content-packs/{code}/apply](#2-post-admin-content-packs-code-apply) — Aplicar un paquete de contenido

---

## 1. GET /admin/content-packs

- **Módulo:** `content_packs`
- **Etiqueta OpenAPI:** `content-packs`
- **Nombre:** Paquetes de contenido disponibles
- **Operation ID:** `ContentPacksController_listar`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ContentPacksController.listar](../../src/modules/content_packs/content-packs.controller.ts)

### Descripción de negocio

Paquetes de contenido disponibles. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: El catálogo de lo aplicable.

### Descripción del sistema

NestJS resuelve `GET /admin/content-packs` en `ContentPacksController_listar`. No se detectó una delegación adicional desde el controlador. No recibe body. El tipo de retorno estático es `ListContentPacksResponseDto`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /admin/content-packs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /admin/content-packs HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `ListContentPacksResponseDto` | No |
| 400 | Consulta completada correctamente. | `ListContentPacksResponseDto` | No |
| 401 | Consulta completada correctamente. | `ListContentPacksResponseDto` | No |
| 403 | Consulta completada correctamente. | `ListContentPacksResponseDto` | No |
| 429 | Consulta completada correctamente. | `ListContentPacksResponseDto` | No |
| 500 | Consulta completada correctamente. | `ListContentPacksResponseDto` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ListContentPacksResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "code": "ARANCEL_BO",
      "name": "Nombre de ejemplo",
      "description": "Texto descriptivo de ejemplo",
      "approxRows": 1,
      "requiresDemoPassword": true
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<ContentPackDto>` | Sin restricción adicional declarada | Los paquetes disponibles. | `[{"code":"ARANCEL_BO","name":"Nombre de ejemplo","description":"Texto descriptivo de ejemplo","approxRows":1,"requiresDemoPassword":true}]` |
| `items[].code` | Sí | `string` | Sin restricción adicional declarada | Código del paquete | `ARANCEL_BO` |
| `items[].name` | Sí | `string` | Sin restricción adicional declarada | Nombre legible del paquete | `Nombre de ejemplo` |
| `items[].description` | Sí | `string` | Sin restricción adicional declarada | Qué contiene el paquete | `Texto descriptivo de ejemplo` |
| `items[].approxRows` | Sí | `number` | Sin restricción adicional declarada | Filas que trae, en orden de magnitud | `1` |
| `items[].requiresDemoPassword` | Sí | `boolean` | Sin restricción adicional declarada | Si el paquete crea cuentas y necesita una contraseña | `true` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/content-packs"
}
```

---

## 2. POST /admin/content-packs/{code}/apply

- **Módulo:** `content_packs`
- **Etiqueta OpenAPI:** `content-packs`
- **Nombre:** Aplicar un paquete de contenido
- **Operation ID:** `ContentPacksController_aplicar`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ContentPacksController.aplicar](../../src/modules/content_packs/content-packs.controller.ts)

### Descripción de negocio

Aplicar un paquete de contenido. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Aplica un paquete. Responde `200` y no `201` a propósito: no crea un recurso identificable, y re-aplicar el mismo paquete es legítimo —devuelve cero filas nuevas—. Un `201` prometería una entidad nueva en cada llamada.

### Descripción del sistema

NestJS resuelve `POST /admin/content-packs/{code}/apply` en `ContentPacksController_aplicar`. El controlador delega en `ContentPacksService.aplicar`. Valida el body como `ApplyContentPackDto` y consume `application/json`. El tipo de retorno estático es `Promise<ApplyContentPackResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `code` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `CODIGO_EJEMPLO` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `ApplyContentPackDto`; los campos opcionales se omiten.

```http
POST /admin/content-packs/CODIGO_EJEMPLO/apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SUPERADMIN`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `demoPassword` | No | `string` | longitud mínima 8; longitud máxima 200 | Contraseña de las cuentas de demostración | `ClaveSegura2026!` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /admin/content-packs/CODIGO_EJEMPLO/apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "demoPassword": "ClaveSegura2026!"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ApplyContentPackResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ApplyContentPackResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "code": "CODIGO_EJEMPLO",
  "inserted": 1,
  "tookMs": 1,
  "counters": {
    "clave": "valor"
  }
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `code` | Sí | `string` | Sin restricción adicional declarada | Código del paquete aplicado | `CODIGO_EJEMPLO` |
| `inserted` | Sí | `number` | admite null | Filas nuevas; cero significa que el contenido ya estaba | `1` |
| `tookMs` | Sí | `number` | Sin restricción adicional declarada | Duración de la aplicación en milisegundos | `1` |
| `counters` | Sí | `object` | Sin restricción adicional declarada | Contadores por tipo de fila, con la forma propia del paquete | `{"clave":"valor"}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SUPERADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Paquete de contenido no encontrado | Excepción explícita en src/modules/content_packs/content-packs.service.ts |
| 409 | `CONFLICT` | El email ya tiene una credencial de contraseña activa | Excepción explícita en src/modules/iam/services/iam-users.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Las cuentas de demostración necesitan una contraseña: declarala en la ' +           'petición o en SEED_DEMO_PASSWORD. | Excepción explícita en src/modules/content_packs/content-packs.service.ts |
| 422 | `PRECONDITION_FAILED` | Las cuentas de demostración no se crean en producción. Si de verdad ' +           'las querés acá, hace falta habilitarlo explícitamente en el entorno. | Excepción explícita en src/modules/content_packs/content-packs.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/admin/content-packs/{code}/apply"
}
```

---

