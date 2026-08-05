<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `app`

Referencia exhaustiva de 4 operación(es) del módulo `app`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `app`
- **Controladores:** `AppController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [GET /](#1-get) — Saludo raíz de verificación de despliegue
2. [GET /health](#2-get-health) — Sonda de liveness (sin autenticación)
3. [GET /liveness](#3-get-liveness) — Sonda de liveness sin dependencias externas
4. [GET /readiness](#4-get-readiness) — Sonda de readiness de dependencias obligatorias

---

## 1. GET /

- **Módulo:** `app`
- **Etiqueta OpenAPI:** `app`
- **Nombre:** Saludo raíz de verificación de despliegue
- **Operation ID:** `AppController_getHello`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AppController.getHello](../../src/app.controller.ts)

### Descripción de negocio

Saludo raíz de verificación de despliegue. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Obtiene get hello.

### Descripción del sistema

NestJS resuelve `GET /` en `AppController_getHello`. El controlador delega en `AppService.getHello`. No recibe body. El tipo de retorno estático es `string`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET / HTTP/1.1
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
GET / HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `string` | No |
| 400 | Consulta completada correctamente. | `string` | No |
| 401 | Consulta completada correctamente. | `string` | No |
| 403 | Consulta completada correctamente. | `string` | No |
| 429 | Consulta completada correctamente. | `string` | No |
| 500 | Consulta completada correctamente. | `string` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `string`. Ejemplo completo derivado de ese DTO:

```json
"valor-ejemplo"
```

Campos de la respuesta:

El DTO de respuesta no declara campos documentables.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "UNAUTHENTICATED",
  "message": "JWT Bearer ausente, vencido o inválido.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/"
}
```

---

## 2. GET /health

- **Módulo:** `app`
- **Etiqueta OpenAPI:** `app`
- **Nombre:** Sonda de liveness (sin autenticación)
- **Operation ID:** `AppController_health`
- **Autenticación:** Pública
- **Implementación:** [AppController.health](../../src/app.controller.ts)

### Descripción de negocio

Sonda de liveness (sin autenticación). Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Sonda de liveness pública para orquestadores (k8s/ECS). No exige JWT ni toca la base: responde 200 mientras el proceso esté vivo y aceptando peticiones. La ruta `/readiness` verifica por separado las dependencias obligatorias.

### Descripción del sistema

NestJS resuelve `GET /health` en `AppController_health`. No se detectó una delegación adicional desde el controlador. No recibe body. El tipo de retorno estático es `{ /** * Valor de status mantenido por la instancia. */ status: string; }`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /health HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /health HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `{ /** * Valor de status mantenido por la instancia. */ status: string; }` | No |
| 400 | Consulta completada correctamente. | `{ /** * Valor de status mantenido por la instancia. */ status: string; }` | No |
| 429 | Consulta completada correctamente. | `{ /** * Valor de status mantenido por la instancia. */ status: string; }` | No |
| 500 | Consulta completada correctamente. | `{ /** * Valor de status mantenido por la instancia. */ status: string; }` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ /** * Valor de status mantenido por la instancia. */ status: string; }`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | Sin restricción adicional declarada | Valor de status mantenido por la instancia. | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "RATE_LIMITED",
  "message": "Se exceden 300 solicitudes por 60 segundos para la instancia.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/health"
}
```

---

## 3. GET /liveness

- **Módulo:** `app`
- **Etiqueta OpenAPI:** `app`
- **Nombre:** Sonda de liveness sin dependencias externas
- **Operation ID:** `AppController_liveness`
- **Autenticación:** Pública
- **Implementación:** [AppController.liveness](../../src/app.controller.ts)

### Descripción de negocio

Sonda de liveness sin dependencias externas. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Alias explícito de liveness para orquestadores.

### Descripción del sistema

NestJS resuelve `GET /liveness` en `AppController_liveness`. No se detectó una delegación adicional desde el controlador. No recibe body. El tipo de retorno estático es `{ status: string }`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /liveness HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /liveness HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `{ status: string }` | No |
| 400 | Consulta completada correctamente. | `{ status: string }` | No |
| 429 | Consulta completada correctamente. | `{ status: string }` | No |
| 500 | Consulta completada correctamente. | `{ status: string }` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `{ status: string }`. Ejemplo completo derivado de ese DTO:

```json
{
  "status": "ok"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `ok` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "RATE_LIMITED",
  "message": "Se exceden 300 solicitudes por 60 segundos para la instancia.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/liveness"
}
```

---

## 4. GET /readiness

- **Módulo:** `app`
- **Etiqueta OpenAPI:** `app`
- **Nombre:** Sonda de readiness de dependencias obligatorias
- **Operation ID:** `AppController_readiness`
- **Autenticación:** Pública
- **Implementación:** [AppController.readiness](../../src/app.controller.ts)

### Descripción de negocio

Sonda de readiness de dependencias obligatorias. Operación pública; no requiere JWT. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: Readiness real: PostgreSQL, MongoDB, Redis y OpenSearch deben responder.

### Descripción del sistema

NestJS resuelve `GET /readiness` en `AppController_readiness`. El controlador delega en `AppReadinessService.check`. No recibe body. El tipo de retorno estático es `Promise<ReadinessResult>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /readiness HTTP/1.1
Host: localhost:3000
```

### Restricciones a considerar

- Endpoint público: no exige JWT según el contrato y `@Public()` del código.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /readiness HTTP/1.1
Host: localhost:3000
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<ReadinessResult>` | No |
| 400 | Consulta completada correctamente. | `Promise<ReadinessResult>` | No |
| 429 | Consulta completada correctamente. | `Promise<ReadinessResult>` | No |
| 500 | Consulta completada correctamente. | `Promise<ReadinessResult>` | No |
| 503 | Consulta completada correctamente. | `Promise<ReadinessResult>` | No |

El controlador declara `ReadinessResult`, pero ese tipo no existe como esquema enlazable en `components.schemas`. No se inventa un body: el consumidor debe tratar la forma exacta como no formalizada hasta añadir el decorador Swagger de respuesta correspondiente.

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "RATE_LIMITED",
  "message": "Se exceden 300 solicitudes por 60 segundos para la instancia.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/readiness"
}
```

---

