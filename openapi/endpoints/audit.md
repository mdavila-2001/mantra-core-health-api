<!-- AUTOGENERADO por tools/docs/generate-endpoint-markdown.mjs. No editar manualmente. -->

# Endpoints del módulo `audit`

Referencia exhaustiva de 14 operación(es) del módulo `audit`, derivada del contrato OpenAPI y del código TypeScript.

- **Etiquetas OpenAPI:** `audit`, `audit-compliance`, `audit-me`, `audit-moderation`, `audit-privacy`
- **Controladores:** `AuditController`, `AuditMeController`, `AuditQueryController`, `ComplianceController`, `ModerationController`, `PrivacyController`
- **Contrato fuente:** [openapi.json](../openapi.json)
- **Convenciones transversales:** [README.md](README.md)

## Índice del módulo

1. [POST /audit/anomaly/scan](#1-post-audit-anomaly-scan) — Detectar acceso anómalo
2. [GET /audit/data-access](#2-get-audit-data-access) — Lecturas de datos sensibles (`audit.data_access_log`), con filtros
3. [POST /audit/data-access](#3-post-audit-data-access) — Registrar acceso/lectura clínica (accounting WORM)
4. [POST /audit/events](#4-post-audit-events) — Registrar provenance de un cambio y sellar la cadena hash
5. [GET /audit/history/{entity}/{id}](#5-get-audit-history-entity-id) — Consultar historial / línea de tiempo de un registro
6. [POST /audit/integrity/verify](#6-post-audit-integrity-verify) — Verificar integridad tamper-evidence de la cadena
7. [GET /audit/log](#7-get-audit-log) — Bitácora de acciones que mutaron, con filtros y riesgo para la seguridad de la salud
8. [GET /audit/me/data-access](#8-get-audit-me-data-access) — Quién accedió a mi historia y con qué finalidad
9. [POST /audit/retention/apply](#9-post-audit-retention-apply) — Aplicar retención / archivado / litigation-hold
10. [POST /audit/third-party-access](#10-post-audit-third-party-access) — Registrar acceso delegado / de tercero gobernado
11. [POST /compliance/audit-export](#11-post-compliance-audit-export) — Exportar evidencia de auditoría para cumplimiento
12. [POST /moderation/decisions](#12-post-moderation-decisions) — Registrar decisión de moderación / gobernanza analítica
13. [POST /privacy/dsar](#13-post-privacy-dsar) — Tramitar DSAR (solicitud del titular)
14. [PATCH /privacy/dsar/{id}](#14-patch-privacy-dsar-id) — Avanzar la máquina de estados de una solicitud DSAR

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
| 504 | Operación completada correctamente. | `Promise<AnomalyScanResultDto>` | No |

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

## 2. GET /audit/data-access

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Lecturas de datos sensibles (`audit.data_access_log`), con filtros
- **Operation ID:** `AuditQueryController_dataAccess`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditQueryController.dataAccess](../../src/modules/audit/controllers/audit-query.controller.ts)

### Descripción de negocio

Filtra por actor, rango de fechas, tenant, paciente, tipo de recurso y operación. Sin rango, mira los últimos 30 días.


### Descripción del sistema

NestJS resuelve `GET /audit/data-access` en `AuditQueryController_dataAccess`. El controlador delega en `AuditQueryService.dataAccess`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | Sin restricción adicional declarada | Desde (ISO 8601, incluido). Sin rango, la consulta mira los últimos 30 días | `2026-10-01T00:00:00.000Z` |
| `to` | query | No | `string` | Sin restricción adicional declarada | Hasta (ISO 8601, excluido) | `2026-10-24T00:00:00.000Z` |
| `userId` | query | No | `string` | formato `uuid` | Quién actuó | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `operation` | query | No | `string` | valores: `READ`, `CREATE`, `UPDATE`, `DELETE`, `EXPORT` | Sin descripción específica en OpenAPI. | `READ` |
| `resourceType` | query | No | `string` | longitud máxima 100 | Sin descripción específica en OpenAPI. | `valor-ejemplo` |
| `patientProfileId` | query | No | `string` | formato `uuid` | Paciente cuyo dato se leyó | `00000000-0000-4000-8000-000000000001` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /audit/data-access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUDITOR`, `DPO`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /audit/data-access?from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-24T00%3A00%3A00.000Z&userId=00000000-0000-4000-8000-000000000001&tenantId=00000000-0000-4000-8000-000000000001&limit=50&cursor=valor-ejemplo&operation=READ&resourceType=valor-ejemplo&patientProfileId=00000000-0000-4000-8000-000000000001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUDITOR, DPO, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
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

## 3. POST /audit/data-access

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
| 504 | Operación completada correctamente. | `Promise<DataAccessResultDto>` | No |

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

## 4. POST /audit/events

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
| 504 | Operación completada correctamente. | `Promise<AuditEventResultDto>` | No |

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

## 5. GET /audit/history/{entity}/{id}

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
| 504 | Consulta completada correctamente. | `Promise<HistoryTimelineDto>` | No |

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

## 6. POST /audit/integrity/verify

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
| `limit` | No | `number` | Sin restricción adicional declarada | Modo diagnóstico acotado: máximo de eslabones a recorrer. Si se omite, se verifica la partición completa. Un límite menor al total devuelve un resultado parcial (`complete: false`) sin atestación positiva. Debe ser un entero entre 1 y 100000 (`400 AUDIT_INTEGRITY_RANGE_INVALID`). | `1` |

### Payload completo de ejemplo

Incluye todos los campos documentados, tanto obligatorios como opcionales. Los identificadores y valores son ilustrativos y deben sustituirse por datos existentes del tenant.

```http
POST /audit/integrity/verify HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
Content-Type: application/json

{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "limit": 1
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
| 504 | Operación completada correctamente. | `Promise<IntegrityReportDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `IntegrityReportDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "verified": true,
  "complete": true,
  "checkedCount": 1,
  "brokenAt": "valor-ejemplo",
  "attestationId": "00000000-0000-4000-8000-000000000001"
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `verified` | Sí | `boolean` | Sin restricción adicional declarada | true sólo si se recorrió la partición completa y está íntegra. Un | `true` |
| `complete` | Sí | `boolean` | Sin restricción adicional declarada | true si se examinaron todos los eslabones de la partición; false si el | `true` |
| `checkedCount` | Sí | `number` | Sin restricción adicional declarada | Nº de eslabones verificados | `1` |
| `brokenAt` | Sí | `string` | admite null | Id del primer eslabón roto, si lo hay | `valor-ejemplo` |
| `attestationId` | Sí | `string` | admite null | Id del evento de atestación registrado. null cuando el resultado es | `00000000-0000-4000-8000-000000000001` |

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

## 7. GET /audit/log

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit`
- **Nombre:** Bitácora de acciones que mutaron, con filtros y riesgo para la seguridad de la salud
- **Operation ID:** `AuditQueryController_log`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditQueryController.log](../../src/modules/audit/controllers/audit-query.controller.ts)

### Descripción de negocio

Filtra por actor, rango de fechas, resultado, tenant, acción, verbo y ruta. El verbo y la ruta se derivan de la acción; para las acciones de negocio, del mapa de rutas armado al arrancar (`null` si la acción sella varias rutas). El riesgo se deriva al leer y no se guarda. Sin rango, mira los últimos 30 días.


### Descripción del sistema

NestJS resuelve `GET /audit/log` en `AuditQueryController_log`. El controlador delega en `AuditQueryService.log`. No recibe body. El tipo de retorno estático es `no declarado`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | Sin restricción adicional declarada | Desde (ISO 8601, incluido). Sin rango, la consulta mira los últimos 30 días | `2026-10-01T00:00:00.000Z` |
| `to` | query | No | `string` | Sin restricción adicional declarada | Hasta (ISO 8601, excluido) | `2026-10-24T00:00:00.000Z` |
| `userId` | query | No | `string` | formato `uuid` | Quién actuó | `00000000-0000-4000-8000-000000000001` |
| `tenantId` | query | No | `string` | formato `uuid` | Sin descripción específica en OpenAPI. | `00000000-0000-4000-8000-000000000001` |
| `limit` | query | No | `number` | mínimo 1; máximo 200 | Sin descripción específica en OpenAPI. | `50` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |
| `result` | query | No | `string` | valores: `SUCCESS`, `FAILURE` | Sin descripción específica en OpenAPI. | `SUCCESS` |
| `action` | query | No | `string` | longitud máxima 200 | Acción exacta: el código de negocio (`CATALOG_ANNOTATION_SAVED`) o `HTTP <VERBO> <plantilla>` | `valor-ejemplo` |
| `method` | query | No | `string` | valores: `POST`, `PUT`, `PATCH`, `DELETE` | Verbo HTTP, derivado de la acción; las acciones de negocio salen del mapa de rutas armado al arrancar | `POST` |
| `route` | query | No | `string` | longitud máxima 300 | Plantilla exacta de la ruta, con `:parámetros` | `/admin/catalog/objects/:id/annotation` |
| `entity` | query | No | `string` | longitud máxima 100 | Entidad afectada | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /audit/log HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `AUDITOR`, `DPO`, `SECURITY_ADMIN`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /audit/log?from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-24T00%3A00%3A00.000Z&userId=00000000-0000-4000-8000-000000000001&tenantId=00000000-0000-4000-8000-000000000001&limit=50&cursor=valor-ejemplo&result=SUCCESS&action=valor-ejemplo&method=POST&route=%2Fadmin%2Fcatalog%2Fobjects%2F%3Aid%2Fannotation&entity=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `no declarado` | Sí |
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
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: AUDITOR, DPO, SECURITY_ADMIN. | Roles/tenant/guards de autorización |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audit/log"
}
```

---

## 8. GET /audit/me/data-access

- **Módulo:** `audit`
- **Etiqueta OpenAPI:** `audit-me`
- **Nombre:** Quién accedió a mi historia y con qué finalidad
- **Operation ID:** `AuditMeController_list`
- **Autenticación:** JWT Bearer obligatoria
- **Implementación:** [AuditMeController.list](../../src/modules/audit/controllers/audit-me.controller.ts)

### Descripción de negocio

Del más reciente al más antiguo, paginado por cursor. Cada acceso trae quién lo hizo (tipo y nombre), cuándo, la operación, el tipo de dato y la finalidad declarada. No trae contenido clínico, IP ni identificadores de otras cuentas. Consultar este registro es en sí un acceso y queda anotado.

Contexto declarado en el controlador: Quién accedió a mi historia, cuándo, qué tipo de dato y con qué finalidad.

### Descripción del sistema

NestJS resuelve `GET /audit/me/data-access` en `AuditMeController_list`. El controlador delega en `MyDataAccessService.list`. No recibe body. El tipo de retorno estático es `Promise<MyDataAccessPageDto>`.

### Parámetros

| Parámetro | Ubicación | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|---|:---:|---|---|---|---|
| `from` | query | No | `string` | Sin restricción adicional declarada | Desde (ISO 8601, incluido). Sin él, desde el primer acceso | `2026-10-01T00:00:00.000Z` |
| `to` | query | No | `string` | Sin restricción adicional declarada | Hasta (ISO 8601, excluido) | `2026-10-25T00:00:00.000Z` |
| `excludeOwn` | query | No | `boolean` | Sin restricción adicional declarada | Si es `true`, omite los accesos del propio titular y deja sólo los de terceros | `false` |
| `limit` | query | No | `number` | mínimo 1; máximo 100 | Sin descripción específica en OpenAPI. | `25` |
| `cursor` | query | No | `string` | longitud máxima 400 | `nextCursor` de la página anterior | `valor-ejemplo` |

### Payload mínimo aceptable

La operación no define body. La solicitud mínima solo incluye la ruta, los parámetros obligatorios y la autenticación cuando corresponda.

```http
GET /audit/me/data-access HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Restricciones a considerar

- Requiere `Authorization: Bearer <JWT>`.
- Roles admitidos por `@Roles`: `PATIENT`.
- Rate limit global: 300 solicitudes por cada 60 segundos por instancia.
- CORS está denegado por defecto; llamadas desde navegador requieren una allowlist configurada en el despliegue.



### Payload completo de ejemplo

No existe body para completar; se muestran todos los parámetros opcionales documentados, si los hubiera.

```http
GET /audit/me/data-access?from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-25T00%3A00%3A00.000Z&excludeOwn=false&limit=25&cursor=valor-ejemplo HTTP/1.1
Host: localhost:3000
Authorization: Bearer <access_token_jwt>
```

### Respuestas generales esperadas

| HTTP | Significado | Tipo devuelto por el controlador | Cuerpo formal en OpenAPI |
|---:|---|---|---|
| 200 | Operación completada correctamente. | `Promise<MyDataAccessPageDto>` | Sí |
| 400 | Consulta completada correctamente. | `Promise<MyDataAccessPageDto>` | No |
| 401 | Consulta completada correctamente. | `Promise<MyDataAccessPageDto>` | No |
| 403 | Consulta completada correctamente. | `Promise<MyDataAccessPageDto>` | No |
| 404 | La cuenta no es la de un paciente | `Promise<MyDataAccessPageDto>` | No |
| 429 | Consulta completada correctamente. | `Promise<MyDataAccessPageDto>` | No |
| 500 | Consulta completada correctamente. | `Promise<MyDataAccessPageDto>` | No |
| 504 | Consulta completada correctamente. | `Promise<MyDataAccessPageDto>` | No |

Aunque el OpenAPI generado todavía no enlaza este DTO a la respuesta, el controlador declara `MyDataAccessPageDto`. Ejemplo completo derivado de ese DTO:

```json
{
  "items": [
    {
      "id": "00000000-0000-4000-8000-000000000001",
      "accessedAt": "2026-07-31T12:00:00.000Z",
      "accessor": {
        "kind": "SELF",
        "displayName": {}
      },
      "operation": "READ",
      "resourceType": {},
      "purpose": {}
    }
  ],
  "nextCursor": {},
  "limit": 1
}
```

Campos de la respuesta:

| Campo | Obligatorio | Tipo | Restricciones | Descripción | Ejemplo |
|---|:---:|---|---|---|---|
| `items` | Sí | `array<MyDataAccessEntryDto>` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `[{"id":"00000000-0000-4000-8000-000000000001","accessedAt":"2026-07-31T12:00:00.000Z","accessor":{"kind":"SELF","displayName":{}},"operation":"READ","resourceType":{},"purpose":{}}]` |
| `items[].id` | Sí | `string` | formato `uuid` | Identificador del registro | `00000000-0000-4000-8000-000000000001` |
| `items[].accessedAt` | Sí | `string` | formato `date-time` | Sin descripción específica en el contrato OpenAPI. | `2026-07-31T12:00:00.000Z` |
| `items[].accessor` | Sí | `DataAccessorDto` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `{"kind":"SELF","displayName":{}}` |
| `items[].accessor.kind` | Sí | `string` | valores: `SELF`, `PRACTITIONER`, `OTHER` | `SELF` es el propio titular; `PRACTITIONER`, un profesional de la salud; `OTHER`, cualquier otra cuenta | `SELF` |
| `items[].accessor.displayName` | No | `object` | admite null | Nombre a mostrar de la persona vinculada a la cuenta; `null` si no tiene o si es el propio titular | `{}` |
| `items[].operation` | Sí | `string` | valores: `READ`, `CREATE`, `UPDATE`, `DELETE`, `EXPORT` | Sin descripción específica en el contrato OpenAPI. | `READ` |
| `items[].resourceType` | No | `object` | admite null | Tipo de dato al que se accedió (código, p. ej. `DIAGNOSTIC_RESULTS`) | `{}` |
| `items[].purpose` | No | `object` | admite null | Finalidad con que se declaró el acceso (código, p. ej. `TREATMENT`, `PATIENT_ACCESS`) | `{}` |
| `nextCursor` | No | `object` | admite null | Sin descripción específica en el contrato OpenAPI. | `{}` |
| `limit` | Sí | `number` | Sin restricción adicional declarada | Sin descripción específica en el contrato OpenAPI. | `1` |

En todas las respuestas se puede recibir `x-trace-id`, útil para correlacionar la operación con la traza de observabilidad.

### Respuestas de error posibles

| HTTP | `code` estable | Cuándo puede ocurrir | Evidencia/origen |
|---:|---|---|---|
| 400 | `VALIDATION_FAILED` | Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas. | Pipeline global de validación |
| 401 | `UNAUTHENTICATED` | JWT Bearer ausente, vencido o inválido. | Guard global de autenticación |
| 403 | `FORBIDDEN` | El actor no posee alguno de los roles admitidos: PATIENT. | Roles/tenant/guards de autorización |
| 404 | `NOT_FOUND` | Perfil de paciente no encontrado | Excepción explícita en src/modules/audit/services/my-data-access.service.ts |
| 429 | `RATE_LIMITED` | Se exceden 300 solicitudes por 60 segundos para la instancia. | Throttler y filtro global de excepciones |
| 500 | `INTERNAL` | Fallo no anticipado; el cliente recibe un mensaje genérico sin stack, SQL ni detalle interno. | Filtro global de excepciones |

Ejemplo de error normalizado:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "Body, query o parámetro de ruta inválido; también se rechazan propiedades no declaradas.",
  "correlationId": "req-01J00000000000000000000000",
  "timestamp": "2026-07-31T12:00:00.000Z",
  "path": "/audit/me/data-access"
}
```

---

## 9. POST /audit/retention/apply

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
| 504 | Operación completada correctamente. | `Promise<RetentionResultDto>` | No |

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

## 10. POST /audit/third-party-access

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
| 504 | Operación completada correctamente. | `Promise<ThirdPartyAccessResultDto>` | No |

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

## 11. POST /compliance/audit-export

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
| 504 | Operación completada correctamente. | `Promise<AuditExportResultDto>` | No |

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

## 12. POST /moderation/decisions

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
| 504 | Operación completada correctamente. | `Promise<ModerationDecisionResultDto>` | No |

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

## 13. POST /privacy/dsar

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
| 504 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |

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

## 14. PATCH /privacy/dsar/{id}

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
| 504 | Operación completada correctamente. | `Promise<DsarResponseDto>` | No |

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

