<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `audit`

Referencia exhaustiva de 11 operación(es) del módulo `audit`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `audit`, `audit-compliance`, `audit-moderation`, `audit-privacy`
- **Controladores:** `AuditController`, `ComplianceController`, `ModerationController`, `PrivacyController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /audit/anomaly/scan](#1-post-audit-anomaly-scan) — Detectar acceso anómalo
2. [POST /audit/data-access](#2-post-audit-data-access) — Registrar acceso/lectura clínica (accounting WORM)
3. [POST /audit/events](#3-post-audit-events) — Registrar provenance de un cambio y sellar la cadena hash
4. [GET /audit/history/{entity}/{id}](#4-get-audit-history-entity-id) — Consultar historial / línea de tiempo de un registro
5. [POST /audit/integrity/verify](#5-post-audit-integrity-verify) — Verificar integridad tamper-evidence de la cadena
6. [POST /audit/retention/apply](#6-post-audit-retention-apply) — Aplicar retención / archivado / litigation-hold
7. [POST /audit/third-party-access](#7-post-audit-third-party-access) — Registrar acceso delegado / de tercero gobernado
8. [POST /compliance/audit-export](#8-post-compliance-audit-export) — Exportar evidencia de auditoría para cumplimiento
9. [POST /moderation/decisions](#9-post-moderation-decisions) — Registrar decisión de moderación / gobernanza analítica
10. [POST /privacy/dsar](#10-post-privacy-dsar) — Tramitar DSAR (solicitud del titular)
11. [PATCH /privacy/dsar/{id}](#11-patch-privacy-dsar-id) — Avanzar la máquina de estados de una solicitud DSAR

---

## 1. POST /audit/anomaly/scan

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Detectar acceso anómalo
- **Operation ID:** `AuditController_scanAnomaly`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditController.scanAnomaly](../../src/modules/audit/controllers/audit.controller.ts)

### Descripción de negocio

Detectar acceso anómalo. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /audit/anomaly/scan` en `AuditController_scanAnomaly`. El controlador delega en `AuditEventsService.scanAnomaly`. Valida el body como `AnomalyScanDto` y consume `application/json`. El tipo de retorno estático es `Promise<AnomalyScanResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AnomalyScanDto`; los campos opcionales se omiten.

```http
POST /audit/anomaly/scan HTTP/1.1
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
| `userId` | No | `string` | formato `uuid` | Usuario a evaluar; por defecto el actor | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant del análisis | `00000000-0000-4000-8000-000000000001` |
| `since` | No | `string` | Sin restricción adicional declarada | Ventana: accesos desde esta fecha ISO-8601 | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audit/anomaly/scan HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "since": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AnomalyScanResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "accessCount": 1,
  "anomalous": true,
  "auditLogId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `accessCount` | Sí | `number` | Sin restricción adicional declarada | Nº de accesos evaluados en la ventana | `1` |
| `anomalous` | Sí | `boolean` | Sin restricción adicional declarada | true si se detectó un patrón anómalo | `true` |
| `auditLogId` | Sí | `string` | Sin restricción adicional declarada | Id del hallazgo de auditoría registrado | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/audit/anomaly/scan"
}
```

---

## 2. POST /audit/data-access

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Registrar acceso/lectura clínica (accounting WORM)
- **Operation ID:** `AuditController_recordDataAccess`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditController.recordDataAccess](../../src/modules/audit/controllers/audit.controller.ts)

### Descripción de negocio

Registrar acceso/lectura clínica (accounting WORM). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /audit/data-access` en `AuditController_recordDataAccess`. El controlador delega en `AuditEventsService.recordDataAccess`. Valida el body como `RecordDataAccessDto` y consume `application/json`. El tipo de retorno estático es `Promise<DataAccessResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordDataAccessDto`; los campos opcionales se omiten.

```http
POST /audit/data-access HTTP/1.1
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
| `patientProfileId` | No | `string` | formato `uuid` | Perfil de paciente accedido (FK profiles) | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | No | `string` | formato `uuid` | Tenant del acceso (FK directory) | `00000000-0000-4000-8000-000000000001` |
| `resourceType` | No | `string` | longitud máxima 100 | Tipo lógico de recurso accedido | `valor-ejemplo` |
| `resourceId` | No | `string` | formato `uuid` | Id del recurso accedido | `00000000-0000-4000-8000-000000000001` |
| `resourceVersionId` | No | `string` | formato `uuid` | Versión del recurso accedido | `00000000-0000-4000-8000-000000000001` |
| `purpose` | No | `string` | longitud máxima 200 | Propósito legible del acceso | `valor-ejemplo` |
| `purposeOfUse` | No | `string` | valores: `TREATMENT`, `PAYMENT`, `OPERATIONS`, `COVERAGE`, `VERIFICATION` | Propósito de uso codificado | `TREATMENT` |
| `legalBasis` | No | `string` | valores: `TREATMENT`, `CONSENT`, `LEGAL_OBLIGATION` | Base legal del acceso | `TREATMENT` |
| `requestId` | No | `string` | formato `uuid` | Correlación de petición | `00000000-0000-4000-8000-000000000001` |
| `policyVersion` | No | `string` | longitud máxima 50 | Versión de política aplicada | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audit/data-access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "valor-ejemplo",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "resourceVersionId": "00000000-0000-4000-8000-000000000001",
  "purpose": "valor-ejemplo",
  "purposeOfUse": "TREATMENT",
  "legalBasis": "TREATMENT",
  "requestId": "00000000-0000-4000-8000-000000000001",
  "policyVersion": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DataAccessResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DataAccessResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "auditLogId": "00000000-0000-4000-8000-000000000001",
  "patientContentLogged": true,
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la fila de contabilidad de acceso | `00000000-0000-4000-8000-000000000001` |
| `auditLogId` | Sí | `string` | Sin restricción adicional declarada | Id del evento de auditoría (provenance) sellado | `00000000-0000-4000-8000-000000000001` |
| `patientContentLogged` | Sí | `boolean` | Sin restricción adicional declarada | true si además se registró detalle de contenido del paciente | `true` |
| `recordedAt` | Sí | `string` | formato `date-time` | Momento del registro | `2026-07-31T12:00:00.000Z` |

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
  "path": "/audit/data-access"
}
```

---

## 3. POST /audit/events

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Registrar provenance de un cambio y sellar la cadena hash
- **Operation ID:** `AuditController_recordEvent`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditController.recordEvent](../../src/modules/audit/controllers/audit.controller.ts)

### Descripción de negocio

Registrar provenance de un cambio y sellar la cadena hash. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-10-04 (sella cadena hash, UC-10-03).

### Descripción del sistema

NestJS resuelve `POST /audit/events` en `AuditController_recordEvent`. El controlador delega en `AuditEventsService.recordEvent`. Valida el body como `RecordAuditEventDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuditEventResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordAuditEventDto`; los campos opcionales se omiten.

```http
POST /audit/events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "action": "valor-ejemplo",
  "entity": "valor-ejemplo",
  "outcome": "SUCCESS"
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
| `action` | Sí | `string` | longitud máxima 100 | Acción realizada (verbo de dominio) | `valor-ejemplo` |
| `entity` | Sí | `string` | longitud máxima 100 | Entidad objetivo (nombre lógico de tabla) | `valor-ejemplo` |
| `entityId` | No | `string` | formato `uuid` | Id de la entidad objetivo | `00000000-0000-4000-8000-000000000001` |
| `outcome` | Sí | `string` | valores: `SUCCESS`, `FAILURE` | Resultado del evento | `SUCCESS` |
| `tenantId` | No | `string` | formato `uuid` | Tenant (FK directory) | `00000000-0000-4000-8000-000000000001` |
| `branchId` | No | `string` | formato `uuid` | Sucursal (FK directory) | `00000000-0000-4000-8000-000000000001` |
| `ip` | No | `string` | Sin restricción adicional declarada | IP de origen | `valor-ejemplo` |
| `deviceId` | No | `string` | formato `uuid` | Dispositivo (FK iam.devices) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audit/events HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "action": "valor-ejemplo",
  "entity": "valor-ejemplo",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "outcome": "SUCCESS",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "ip": "valor-ejemplo",
  "deviceId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuditEventResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuditEventResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "previousHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recordHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id del evento de auditoría | `00000000-0000-4000-8000-000000000001` |
| `previousHash` | Sí | `string` | admite null | Hash del eslabón anterior de la cadena | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `recordHash` | Sí | `string` | Sin restricción adicional declarada | Hash sellado de este registro | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |
| `recordedAt` | Sí | `string` | formato `date-time` | Momento del registro | `2026-07-31T12:00:00.000Z` |

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
  "path": "/audit/events"
}
```

---

## 4. GET /audit/history/{entity}/{id}

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Consultar historial / línea de tiempo de un registro
- **Operation ID:** `AuditController_getHistory`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditController.getHistory](../../src/modules/audit/controllers/audit.controller.ts)

### Descripción de negocio

Consultar historial / línea de tiempo de un registro. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `GET /audit/history/{entity}/{id}` en `AuditController_getHistory`. El controlador delega en `AuditHistoryService.getTimeline`. No recibe body. El tipo de retorno estático es `Promise<HistoryTimelineDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `entity` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `as_of` | query | No | `string` | Sin restricción adicional declarada | Reconstrucción point-in-time: fila vigente a esta fecha ISO-8601 | `2026-01-01T00:00:00.000Z` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /audit/history/valor-ejemplo/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /audit/history/valor-ejemplo/00000000-0000-4000-8000-000000000001?as_of=2026-01-01T00%3A00%3A00.000Z HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<HistoryTimelineDto>` | No |
| 400 | Consulta completada correctamente. | `Promise<HistoryTimelineDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<HistoryTimelineDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<HistoryTimelineDto>` | No |
| 404 | Consulta completada correctamente. | `Promise<HistoryTimelineDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<HistoryTimelineDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<HistoryTimelineDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `HistoryTimelineDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "entity": "valor-ejemplo",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "count": 1,
  "revisions": [
    {
      "revisionNo": 1,
      "operationConceptId": "00000000-0000-4000-8000-000000000001",
      "validFrom": "2026-07-31T12:00:00.000Z",
      "validTo": "2026-07-31T12:00:00.000Z",
      "changedByUserId": "00000000-0000-4000-8000-000000000001",
      "recordedAt": "2026-07-31T12:00:00.000Z",
      "dataSnapshot": {
        "clave": "valor"
      }
    }
  ]
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `entity` | Sí | `string` | Sin restricción adicional declarada | Entidad consultada | `valor-ejemplo` |
| `entityId` | Sí | `string` | Sin restricción adicional declarada | Id del registro | `00000000-0000-4000-8000-000000000001` |
| `count` | Sí | `number` | Sin restricción adicional declarada | Nº de revisiones devueltas | `1` |
| `revisions` | Sí | `array<HistoryRevisionDto>` | Sin restricción adicional declarada | Revisiones ordenadas cronológicamente | `[{"revisionNo":1,"operationConceptId":"00000000-0000-4000-8000-000000000001","validFrom":"2026-07-31T12:00:00.000Z","validTo":"2026-07-31T12:00:00.000Z","changedByUserId":"00000000-0000-4000-8000-000000000001","recordedAt":"2026-07-31T12:00:00.000Z","dataSnapshot":{"clave":"valor"}}]` |
| `revisions[].revisionNo` | No | `number` | Sin restricción adicional declarada | Número de revisión monotónico | `1` |
| `revisions[].operationConceptId` | Sí | `string` | Sin restricción adicional declarada | Operación (INSERT/UPDATE/DELETE) como concepto | `00000000-0000-4000-8000-000000000001` |
| `revisions[].validFrom` | No | `string` | formato `date-time` | Vigente desde | `2026-07-31T12:00:00.000Z` |
| `revisions[].validTo` | No | `string` | formato `date-time` | Vigente hasta | `2026-07-31T12:00:00.000Z` |
| `revisions[].changedByUserId` | No | `string` | Sin restricción adicional declarada | Usuario que efectuó el cambio | `00000000-0000-4000-8000-000000000001` |
| `revisions[].recordedAt` | Sí | `string` | formato `date-time` | Momento del registro | `2026-07-31T12:00:00.000Z` |
| `revisions[].dataSnapshot` | Sí | `object` | Sin restricción adicional declarada | Snapshot del estado en esa revisión | `{"clave":"valor"}` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Entidad de historial no soportada | Excepción explícita en src/modules/audit/services/audit-history.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audit/history/{entity}/{id}"
}
```

---

## 5. POST /audit/integrity/verify

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Verificar integridad tamper-evidence de la cadena
- **Operation ID:** `AuditController_verifyIntegrity`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditController.verifyIntegrity](../../src/modules/audit/controllers/audit.controller.ts)

### Descripción de negocio

Verificar integridad tamper-evidence de la cadena. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /audit/integrity/verify` en `AuditController_verifyIntegrity`. El controlador delega en `AuditEventsService.verifyIntegrity`. Valida el body como `AuditVerifyIntegrityDto` y consume `application/json`. El tipo de retorno estático es `Promise<IntegrityReportDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `AuditVerifyIntegrityDto`; los campos opcionales se omiten.

```http
POST /audit/integrity/verify HTTP/1.1
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
| `tenantId` | No | `string` | formato `uuid` | Partición de tenant a verificar | `00000000-0000-4000-8000-000000000001` |
| `limit` | No | `number` | Sin restricción adicional declarada | Máximo de eslabones a recorrer | `1000` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audit/integrity/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "limit": 1000
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 400 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 401 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 403 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 409 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 413 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 422 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 429 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |
| 500 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrityReportDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "verified": true,
  "checkedCount": 1,
  "brokenAt": "valor-ejemplo",
  "attestationId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | true si la cadena está íntegra | `true` |
| `checkedCount` | Sí | `number` | Sin restricción adicional declarada | Nº de eslabones verificados | `1` |
| `brokenAt` | Sí | `string` | admite null | Id del primer eslabón roto, si lo hay | `valor-ejemplo` |
| `attestationId` | Sí | `string` | Sin restricción adicional declarada | Id del evento de atestación registrado | `00000000-0000-4000-8000-000000000001` |

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
  "path": "/audit/integrity/verify"
}
```

---

## 6. POST /audit/retention/apply

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Aplicar retención / archivado / litigation-hold
- **Operation ID:** `AuditController_applyRetention`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditController.applyRetention](../../src/modules/audit/controllers/audit.controller.ts)

### Descripción de negocio

Aplicar retención / archivado / litigation-hold. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /audit/retention/apply` en `AuditController_applyRetention`. El controlador delega en `AuditEventsService.applyRetention`. Valida el body como `RetentionApplyDto` y consume `application/json`. El tipo de retorno estático es `Promise<RetentionResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RetentionApplyDto`; los campos opcionales se omiten.

```http
POST /audit/retention/apply HTTP/1.1
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
| `tenantId` | No | `string` | formato `uuid` | Partición de tenant afectada | `00000000-0000-4000-8000-000000000001` |
| `scope` | No | `string` | longitud máxima 100 | Log/partición lógica objetivo | `valor-ejemplo` |
| `olderThan` | No | `string` | Sin restricción adicional declarada | Archiva/desprende particiones anteriores a esta fecha ISO-8601 | `valor-ejemplo` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audit/retention/apply HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scope": "valor-ejemplo",
  "olderThan": "valor-ejemplo"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `RetentionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "auditLogId": "00000000-0000-4000-8000-000000000001",
  "applied": true,
  "purgedCount": 1,
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `auditLogId` | Sí | `string` | Sin restricción adicional declarada | Id del evento de retención registrado | `00000000-0000-4000-8000-000000000001` |
| `applied` | Sí | `boolean` | Sin restricción adicional declarada | true si la operación quedó registrada | `true` |
| `purgedCount` | Sí | `number` | Sin restricción adicional declarada | Nº real de filas purgadas por la política de retención | `1` |
| `recordedAt` | Sí | `string` | formato `date-time` | Momento del registro | `2026-07-31T12:00:00.000Z` |

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
  "path": "/audit/retention/apply"
}
```

---

## 7. POST /audit/third-party-access

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Registrar acceso delegado / de tercero gobernado
- **Operation ID:** `AuditController_recordThirdPartyAccess`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditController.recordThirdPartyAccess](../../src/modules/audit/controllers/audit.controller.ts)

### Descripción de negocio

Registrar acceso delegado / de tercero gobernado. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /audit/third-party-access` en `AuditController_recordThirdPartyAccess`. El controlador delega en `ThirdPartyAccessService.record`. Valida el body como `RecordThirdPartyAccessDto` y consume `application/json`. El tipo de retorno estático es `Promise<ThirdPartyAccessResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `RecordThirdPartyAccessDto`; los campos opcionales se omiten.

```http
POST /audit/third-party-access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "channel": "DELEGATED",
  "outcome": "SUCCESS"
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
| `channel` | Sí | `string` | valores: `DELEGATED`, `INSURANCE`, `IDENTITY`, `PHARMACY` | Canal de acceso de tercero | `DELEGATED` |
| `outcome` | Sí | `string` | valores: `SUCCESS`, `FAILURE` | Resultado del acceso | `SUCCESS` |
| `purposeOfUse` | No | `string` | valores: `TREATMENT`, `PAYMENT`, `OPERATIONS`, `COVERAGE`, `VERIFICATION` | Propósito de uso | `TREATMENT` |
| `delegatingPractitionerProfileId` | No | `string` | formato `uuid` | DELEGATED: perfil de profesional delegante | `00000000-0000-4000-8000-000000000001` |
| `patientProfileId` | No | `string` | formato `uuid` | DELEGATED/INSURANCE: perfil de paciente | `00000000-0000-4000-8000-000000000001` |
| `delegatedAssignmentId` | No | `string` | formato `uuid` | DELEGATED: asignación de delegación | `00000000-0000-4000-8000-000000000001` |
| `resourceId` | No | `string` | formato `uuid` | Recurso accedido | `00000000-0000-4000-8000-000000000001` |
| `insuranceCarrierId` | No | `string` | formato `uuid` | INSURANCE: aseguradora | `00000000-0000-4000-8000-000000000001` |
| `claimId` | No | `string` | formato `uuid` | INSURANCE: reclamo | `00000000-0000-4000-8000-000000000001` |
| `authorizationRequestId` | No | `string` | formato `uuid` | INSURANCE: solicitud de autorización | `00000000-0000-4000-8000-000000000001` |
| `verificationCaseId` | No | `string` | formato `uuid` | IDENTITY: caso de verificación | `00000000-0000-4000-8000-000000000001` |
| `pharmacyId` | No | `string` | formato `uuid` | PHARMACY: farmacia | `00000000-0000-4000-8000-000000000001` |
| `correlationId` | No | `string` | formato `uuid` | PHARMACY: correlación end-to-end | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audit/third-party-access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "channel": "DELEGATED",
  "outcome": "SUCCESS",
  "purposeOfUse": "TREATMENT",
  "delegatingPractitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "delegatedAssignmentId": "00000000-0000-4000-8000-000000000001",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "insuranceCarrierId": "00000000-0000-4000-8000-000000000001",
  "claimId": "00000000-0000-4000-8000-000000000001",
  "authorizationRequestId": "00000000-0000-4000-8000-000000000001",
  "verificationCaseId": "00000000-0000-4000-8000-000000000001",
  "pharmacyId": "00000000-0000-4000-8000-000000000001",
  "correlationId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ThirdPartyAccessResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "channel": "valor-ejemplo",
  "auditLogId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la fila del log especializado | `00000000-0000-4000-8000-000000000001` |
| `channel` | Sí | `string` | Sin restricción adicional declarada | Canal usado | `valor-ejemplo` |
| `auditLogId` | Sí | `string` | Sin restricción adicional declarada | Id del evento de auditoría (provenance) | `00000000-0000-4000-8000-000000000001` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | Falta el campo requerido para el canal: ${field} | Excepción explícita en src/modules/audit/services/third-party-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audit/third-party-access"
}
```

---

## 8. POST /compliance/audit-export

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit-compliance`
- **Nombre:** Exportar evidencia de auditoría para cumplimiento
- **Operation ID:** `ComplianceController_exportEvidence`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ComplianceController.exportEvidence](../../src/modules/audit/controllers/compliance.controller.ts)

### Descripción de negocio

Exportar evidencia de auditoría para cumplimiento. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /compliance/audit-export` en `ComplianceController_exportEvidence`. El controlador delega en `ComplianceService.exportEvidence`. Valida el body como `CreateAuditExportDto` y consume `application/json`. El tipo de retorno estático es `Promise<AuditExportResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateAuditExportDto`; los campos opcionales se omiten.

```http
POST /compliance/audit-export HTTP/1.1
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
| `entity` | No | `string` | longitud máxima 100 | Entidad cuyo historial se exporta | `valor-ejemplo` |
| `entityId` | No | `string` | formato `uuid` | Id del sujeto/registro exportado | `00000000-0000-4000-8000-000000000001` |
| `purposeDefinitionId` | No | `string` | formato `uuid` | Definición de propósito (FK telemetry) | `00000000-0000-4000-8000-000000000001` |
| `exportReference` | No | `string` | longitud máxima 200 | Referencia externa del paquete de evidencia | `valor-ejemplo` |
| `affectedSubjectCount` | No | `number` | mínimo 0 | Nº de sujetos afectados | `1` |
| `queryHash` | No | `string` | longitud máxima 128 | Hash de la consulta (idempotencia) | `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /compliance/audit-export HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "entity": "valor-ejemplo",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "exportReference": "valor-ejemplo",
  "affectedSubjectCount": 1,
  "queryHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<AuditExportResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `AuditExportResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "exportReference": "valor-ejemplo",
  "auditLogId": "00000000-0000-4000-8000-000000000001",
  "occurredAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la fila de gobernanza | `00000000-0000-4000-8000-000000000001` |
| `exportReference` | Sí | `string` | Sin restricción adicional declarada | Referencia del paquete de evidencia | `valor-ejemplo` |
| `auditLogId` | Sí | `string` | Sin restricción adicional declarada | Id del evento de auditoría (provenance) | `00000000-0000-4000-8000-000000000001` |
| `occurredAt` | Sí | `string` | formato `date-time` | Momento del registro | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 409 | `CONFLICT` | Ya existe una exportación con ese query_hash | Excepción explícita en src/modules/audit/services/compliance.service.ts |
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
  "path": "/compliance/audit-export"
}
```

---

## 9. POST /moderation/decisions

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit-moderation`
- **Nombre:** Registrar decisión de moderación / gobernanza analítica
- **Operation ID:** `ModerationController_recordDecision`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [ModerationController.recordDecision](../../src/modules/audit/controllers/moderation.controller.ts)

### Descripción de negocio

Registrar decisión de moderación / gobernanza analítica. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.


### Descripción del sistema

NestJS resuelve `POST /moderation/decisions` en `ModerationController_recordDecision`. El controlador delega en `ModerationService.recordDecision`. Valida el body como `CreateModerationDecisionDto` y consume `application/json`. El tipo de retorno estático es `Promise<ModerationDecisionResultDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateModerationDecisionDto`; los campos opcionales se omiten.

```http
POST /moderation/decisions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetType": "CONTENT",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "action": "REMOVE"
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
| `targetType` | Sí | `string` | valores: `CONTENT`, `USER`, `COMMENT`, `REVIEW` | Tipo de destino moderado | `CONTENT` |
| `targetId` | Sí | `string` | formato `uuid` | Id del destino (validado vía entity_registry) | `00000000-0000-4000-8000-000000000001` |
| `action` | Sí | `string` | valores: `REMOVE`, `FLAG`, `APPROVE`, `RESTRICT`, `DISMISS` | Acción de moderación | `REMOVE` |
| `reason` | No | `string` | valores: `POLICY`, `ABUSE`, `SPAM`, `LEGAL` | Motivo de la decisión | `POLICY` |
| `policyVersion` | No | `string` | longitud máxima 50 | Versión de política aplicada | `valor-ejemplo` |
| `evidence` | No | `object` | Sin restricción adicional declarada | Evidencia estructurada de la decisión | `{}` |
| `governance` | No | `boolean` | Sin restricción adicional declarada | true si la decisión implica uso/gobernanza de datos (registra gobernanza) | `true` |
| `moderationDecisionId` | No | `string` | formato `uuid` | Id REAL de la decisión (FK community.moderation_decisions) para versionar su historial | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /moderation/decisions HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "targetType": "CONTENT",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "action": "REMOVE",
  "reason": "POLICY",
  "policyVersion": "valor-ejemplo",
  "evidence": {},
  "governance": true,
  "moderationDecisionId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 400 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 401 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 403 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 409 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 413 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 422 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 429 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |
| 500 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `ModerationDecisionResultDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "auditLogId": "00000000-0000-4000-8000-000000000001",
  "historyRecorded": true,
  "recordedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id del evento de moderación | `00000000-0000-4000-8000-000000000001` |
| `auditLogId` | Sí | `string` | Sin restricción adicional declarada | Id del evento de auditoría (provenance) | `00000000-0000-4000-8000-000000000001` |
| `historyRecorded` | Sí | `boolean` | Sin restricción adicional declarada | true si se versionó el historial de la decisión | `true` |
| `recordedAt` | Sí | `string` | formato `date-time` | Momento del registro | `2026-07-31T12:00:00.000Z` |

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
  "path": "/moderation/decisions"
}
```

---

## 10. POST /privacy/dsar

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit-privacy`
- **Nombre:** Tramitar DSAR (solicitud del titular)
- **Operation ID:** `PrivacyController_createDsar`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrivacyController.createDsar](../../src/modules/audit/controllers/privacy.controller.ts)

### Descripción de negocio

Tramitar DSAR (solicitud del titular). Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-10-08 (alta).

### Descripción del sistema

NestJS resuelve `POST /privacy/dsar` en `PrivacyController_createDsar`. El controlador delega en `ComplianceService.createDsar`. Valida el body como `CreateDsarDto` y consume `application/json`. El tipo de retorno estático es `Promise<DsarResponseDto>`.

### Parámetros

No hay parámetros de ruta, query ni cabeceras específicos de la operación.

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `CreateDsarDto`; los campos opcionales se omiten.

```http
POST /privacy/dsar HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "type": "ACCESS"
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
| `type` | Sí | `string` | valores: `ACCESS`, `ERASURE`, `RECTIFICATION`, `PORTABILITY`, `OBJECTION` | Tipo de solicitud del titular | `ACCESS` |
| `userId` | No | `string` | formato `uuid` | Titular de los datos (FK iam.users); por defecto el actor | `00000000-0000-4000-8000-000000000001` |
| `jurisdiction` | No | `string` | valores: `PE`, `EU`, `US` | Jurisdicción aplicable | `PE` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /privacy/dsar HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "type": "ACCESS",
  "userId": "00000000-0000-4000-8000-000000000001",
  "jurisdiction": "PE"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 201 | Recurso creado o acción registrada correctamente. | `Promise<DsarResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DsarResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "type": "valor-ejemplo",
  "rowVersion": 1,
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "completedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la solicitud | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | Sin restricción adicional declarada | Titular de los datos | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado actual (concepto) | `ok` |
| `type` | Sí | `string` | Sin restricción adicional declarada | Tipo (concepto) | `valor-ejemplo` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión de fila optimista | `1` |
| `requestedAt` | Sí | `string` | formato `date-time` | Solicitada el | `2026-07-31T12:00:00.000Z` |
| `completedAt` | No | `string` | formato `date-time`; admite null | Completada el | `2026-07-31T12:00:00.000Z` |

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
  "path": "/privacy/dsar"
}
```

---

## 11. PATCH /privacy/dsar/{id}

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit-privacy`
- **Nombre:** Avanzar la máquina de estados de una solicitud DSAR
- **Operation ID:** `PrivacyController_updateDsar`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [PrivacyController.updateDsar](../../src/modules/audit/controllers/privacy.controller.ts)

### Descripción de negocio

Avanzar la máquina de estados de una solicitud DSAR. Requiere JWT y los roles o alcances declarados por el controlador. Todas las respuestas de error usan el envelope ErrorResponse.

Contexto declarado en el controlador: UC-10-08 (transición de estado).

### Descripción del sistema

NestJS resuelve `PATCH /privacy/dsar/{id}` en `PrivacyController_updateDsar`. El controlador delega en `ComplianceService.updateDsar`. Valida el body como `UpdateDsarDto` y consume `application/json`. El tipo de retorno estático es `Promise<DsarResponseDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `id` | path | Sí | `string` | Sin restricción adicional declarada | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

Incluye únicamente los campos obligatorios del DTO `UpdateDsarDto`; los campos opcionales se omiten.

```http
PATCH /privacy/dsar/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "IN_PROGRESS"
}
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `SECURITY_ADMIN`.
- Deben ser UUID válidos: `id`.
- El body no puede superar 1 MB; propiedades no declaradas se rechazan (`whitelist` + `forbidNonWhitelisted`).
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `status` | Sí | `string` | valores: `IN_PROGRESS`, `COMPLETED`, `REJECTED` | Nuevo estado de la máquina DSAR | `IN_PROGRESS` |
| `resultFileId` | No | `string` | formato `uuid` | Paquete DSAR resultante (FK common.files) | `00000000-0000-4000-8000-000000000001` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
PATCH /privacy/dsar/00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "status": "IN_PROGRESS",
  "resultFileId": "00000000-0000-4000-8000-000000000001"
}
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 400 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 401 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 403 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 404 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 409 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 413 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 422 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 429 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |
| 500 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `DsarResponseDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "id": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "status": "ok",
  "type": "valor-ejemplo",
  "rowVersion": 1,
  "requestedAt": "2026-07-31T12:00:00.000Z",
  "completedAt": "2026-07-31T12:00:00.000Z"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `id` | Sí | `string` | Sin restricción adicional declarada | Id de la solicitud | `00000000-0000-4000-8000-000000000001` |
| `userId` | Sí | `string` | Sin restricción adicional declarada | Titular de los datos | `00000000-0000-4000-8000-000000000001` |
| `status` | Sí | `string` | Sin restricción adicional declarada | Estado actual (concepto) | `ok` |
| `type` | Sí | `string` | Sin restricción adicional declarada | Tipo (concepto) | `valor-ejemplo` |
| `rowVersion` | Sí | `number` | Sin restricción adicional declarada | Versión de fila optimista | `1` |
| `requestedAt` | Sí | `string` | formato `date-time` | Solicitada el | `2026-07-31T12:00:00.000Z` |
| `completedAt` | No | `string` | formato `date-time`; admite null | Completada el | `2026-07-31T12:00:00.000Z` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Solicitud DSAR no encontrada | Excepción explícita en src/modules/audit/services/compliance.service.ts |
| 413 | `PAYLOAD_TOO_LARGE` | El body supera el límite global de 1 MB. | Parser JSON/urlencoded global y filtro global de excepciones |
| 422 | `PRECONDITION_FAILED` | La solicitud DSAR ya está en estado terminal | Excepción explícita en src/modules/audit/services/compliance.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/privacy/dsar/{id}"
}
```

---

