<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `audit`

- **Bloque:** Auditoría y Reporting (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)
- **Operaciones:** 14 (14 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 10 · BAJO 3
- **Tablas distintas que tocan:** 16
- **Respuestas de error y detalle contractual:** `openapi/endpoints/audit.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/audit/anomaly/scan` | Detectar acceso anómalo | MEDIO | 4 | SECURITY_ADMIN |
| 2 | GET | `/audit/data-access` | Lecturas de datos sensibles (`audit.data_access_log`), con filtros | BAJO | 1 | AUDITOR, DPO, SECURITY_ADMIN |
| 3 | POST | `/audit/data-access` | Registrar acceso/lectura clínica (accounting WORM) | MEDIO | 5 | SECURITY_ADMIN |
| 4 | POST | `/audit/events` | Registrar provenance de un cambio y sellar la cadena hash | MEDIO | 3 | SECURITY_ADMIN |
| 5 | GET | `/audit/history/{entity}/{id}` | Consultar historial / línea de tiempo de un registro | MEDIO | 4 | SECURITY_ADMIN |
| 6 | POST | `/audit/integrity/verify` | Verificar integridad tamper-evidence de la cadena | MEDIO | 3 | SECURITY_ADMIN |
| 7 | GET | `/audit/log` | Bitácora de acciones que mutaron, con filtros y riesgo para la seguridad de la salud | BAJO | 1 | AUDITOR, DPO, SECURITY_ADMIN |
| 8 | GET | `/audit/me/data-access` | Quién accedió a mi historia y con qué finalidad | BAJO | 5 | PATIENT |
| 9 | POST | `/audit/retention/apply` | Aplicar retención / archivado / litigation-hold | ALTO | 4 | SECURITY_ADMIN |
| 10 | POST | `/audit/third-party-access` | Registrar acceso delegado / de tercero gobernado | MEDIO | 7 | SECURITY_ADMIN |
| 11 | POST | `/compliance/audit-export` | Exportar evidencia de auditoría para cumplimiento | MEDIO | 5 | SECURITY_ADMIN |
| 12 | POST | `/moderation/decisions` | Registrar decisión de moderación / gobernanza analítica | MEDIO | 6 | SECURITY_ADMIN |
| 13 | POST | `/privacy/dsar` | Tramitar DSAR (solicitud del titular) | MEDIO | 5 | SECURITY_ADMIN |
| 14 | PATCH | `/privacy/dsar/{id}` | Avanzar la máquina de estados de una solicitud DSAR | MEDIO | 5 | SECURITY_ADMIN |

---

## 1. POST /audit/anomaly/scan

- **Origen:** CONTRATO
- **Nombre:** Detectar acceso anómalo
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditController.scanAnomaly` — `src/modules/audit/controllers/audit.controller.ts:152`

### Qué es y para qué sirve (negocio)

Detectar acceso anómalo. Caso de uso UC-10-10: Detectar acceso anómalo. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:53`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /audit/anomaly/scan` la atiende `AuditController.scanAnomaly` (src/modules/audit/controllers/audit.controller.ts:152). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AnomalyScanDto` (3 campos, 0 obligatorios). Delega en `AuditEventsService.scanAnomaly`. Crea filas en audit.audit_log. Lee audit.audit_log, audit.data_access_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/audit.controller.ts:152` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.scanAnomaly → AuditEventsService.scanAnomaly → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuditController.scanAnomaly → AuditEventsService.scanAnomaly → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.data_access_log` | LEE | LEE | DIRECTA | AuditController.scanAnomaly → AuditEventsService.scanAnomaly → DataAccessLogRepository.countByUserSince | `src/modules/audit/repositories/data-access-log.repository.ts:146` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuditController.scanAnomaly → AuditEventsService.scanAnomaly → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `AnomalyScanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario a evaluar; por defecto el actor | `src/modules/audit/dto/operations.dto.ts:91` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant del análisis | `src/modules/audit/dto/operations.dto.ts:99` |
| `since` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Ventana: accesos desde esta fecha ISO-8601 | `src/modules/audit/dto/operations.dto.ts:109` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "since": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<AnomalyScanResultDto>` · DTO `AnomalyScanResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accessCount` | `number` | Sí | — | — | Nº de accesos evaluados en la ventana | `src/modules/audit/dto/operations.dto.ts:118` |
| `anomalous` | `boolean` | Sí | — | — | true si se detectó un patrón anómalo | `src/modules/audit/dto/operations.dto.ts:124` |
| `auditLogId` | `string` | Sí | — | — | Id del hallazgo de auditoría registrado | `src/modules/audit/dto/operations.dto.ts:130` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit.controller.spec.ts:80` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-10`

---

## 2. GET /audit/data-access

- **Origen:** CONTRATO
- **Nombre:** Lecturas de datos sensibles (`audit.data_access_log`), con filtros
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditQueryController.dataAccess` — `src/modules/audit/controllers/audit-query.controller.ts:54`

### Qué es y para qué sirve (negocio)

Lecturas de datos sensibles (`audit.data_access_log`), con filtros. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /audit/data-access` la atiende `AuditQueryController.dataAccess` (src/modules/audit/controllers/audit-query.controller.ts:54). Exige sesión con alguno de los roles AUDITOR, DPO, SECURITY_ADMIN. Delega en `AuditQueryService.dataAccess`. Lee audit.data_access_log.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUDITOR, DPO, SECURITY_ADMIN | `src/modules/audit/controllers/audit-query.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.data_access_log` | LEE | LEE | POR_SQL | AuditQueryController.dataAccess → AuditQueryService.dataAccess → AuditQueryRepository.dataAccess | `src/modules/audit/repositories/audit-query.repository.ts:159` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Desde (ISO 8601, incluido). Sin rango, la consulta mira los últimos 30 días |
| `to` | query | No | `string` | Hasta (ISO 8601, excluido) |
| `userId` | query | No | `string` | Quién actuó |
| `tenantId` | query | No | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `operation` | query | No | `string` | — |
| `resourceType` | query | No | `string` | — |
| `patientProfileId` | query | No | `string` | Paciente cuyo dato se leyó |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `ctrl:AuditQueryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /audit/data-access

- **Origen:** CONTRATO
- **Nombre:** Registrar acceso/lectura clínica (accounting WORM)
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditController.recordDataAccess` — `src/modules/audit/controllers/audit.controller.ts:64`

### Qué es y para qué sirve (negocio)

Registrar acceso/lectura clínica (accounting WORM). Caso de uso UC-10-01: Registrar acceso/lectura clínica (accounting WORM) + provenance. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:46`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /audit/data-access` la atiende `AuditController.recordDataAccess` (src/modules/audit/controllers/audit.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RecordDataAccessDto` (10 campos, 0 obligatorios). Delega en `AuditEventsService.recordDataAccess`. Crea filas en audit.audit_log, audit.data_access_log, audit.patient_content_access_log. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/audit.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordDataAccess → AuditEventsService.recordDataAccess → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuditController.recordDataAccess → AuditEventsService.recordDataAccess → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordDataAccess → AuditEventsService.recordDataAccess → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `audit.patient_content_access_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordDataAccess → AuditEventsService.recordDataAccess → DataAccessLogRepository.recordPatientContent | `src/modules/audit/repositories/data-access-log.repository.ts:121` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuditController.recordDataAccess → AuditEventsService.recordDataAccess → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `RecordDataAccessDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil de paciente accedido (FK profiles) | `src/modules/audit/dto/data-access.dto.ts:15` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant del acceso (FK directory) | `src/modules/audit/dto/data-access.dto.ts:26` |
| `resourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo lógico de recurso accedido | `src/modules/audit/dto/data-access.dto.ts:38` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso accedido | `src/modules/audit/dto/data-access.dto.ts:49` |
| `resourceVersionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Versión del recurso accedido | `src/modules/audit/dto/data-access.dto.ts:60` |
| `purpose` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Propósito legible del acceso | `src/modules/audit/dto/data-access.dto.ts:72` |
| `purposeOfUse` | `string` | No | valores: TREATMENT, PAYMENT, OPERATIONS, COVERAGE, VERIFICATION | `@IsOptional()` `@IsIn(['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'])` | Propósito de uso codificado | `src/modules/audit/dto/data-access.dto.ts:83` |
| `legalBasis` | `string` | No | valores: TREATMENT, CONSENT, LEGAL_OBLIGATION | `@IsOptional()` `@IsIn(['TREATMENT', 'CONSENT', 'LEGAL_OBLIGATION'])` | Base legal del acceso | `src/modules/audit/dto/data-access.dto.ts:94` |
| `requestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Correlación de petición | `src/modules/audit/dto/data-access.dto.ts:105` |
| `policyVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Versión de política aplicada | `src/modules/audit/dto/data-access.dto.ts:117` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<DataAccessResultDto>` · DTO `DataAccessResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la fila de contabilidad de acceso | `src/modules/audit/dto/data-access.dto.ts:126` |
| `auditLogId` | `string` | Sí | — | — | Id del evento de auditoría (provenance) sellado | `src/modules/audit/dto/data-access.dto.ts:134` |
| `patientContentLogged` | `boolean` | Sí | — | — | true si además se registró detalle de contenido del paciente | `src/modules/audit/dto/data-access.dto.ts:142` |
| `recordedAt` | `string` | Sí | formato date-time | — | Momento del registro | `src/modules/audit/dto/data-access.dto.ts:152` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit.controller.spec.ts:44` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-01`

---

## 4. POST /audit/events

- **Origen:** CONTRATO
- **Nombre:** Registrar provenance de un cambio y sellar la cadena hash
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditController.recordEvent` — `src/modules/audit/controllers/audit.controller.ts:83`

### Qué es y para qué sirve (negocio)

Registrar provenance de un cambio y sellar la cadena hash. Caso de uso UC-10-04: Registrar provenance de un cambio y sellar la cadena hash (incluye UC-10-03). Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:47`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /audit/events` la atiende `AuditController.recordEvent` (src/modules/audit/controllers/audit.controller.ts:83). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RecordAuditEventDto` (8 campos, 3 obligatorios). Delega en `AuditEventsService.recordEvent`. Crea filas en audit.audit_log. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/audit.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordEvent → AuditEventsService.recordEvent → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuditController.recordEvent → AuditEventsService.recordEvent → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuditController.recordEvent → AuditEventsService.recordEvent → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `RecordAuditEventDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `action` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Acción realizada (verbo de dominio) | `src/modules/audit/dto/audit-event.dto.ts:22` |
| `entity` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Entidad objetivo (nombre lógico de tabla) | `src/modules/audit/dto/audit-event.dto.ts:33` |
| `entityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de la entidad objetivo | `src/modules/audit/dto/audit-event.dto.ts:44` |
| `outcome` | `string` | Sí | valores: SUCCESS, FAILURE | `@IsIn(['SUCCESS', 'FAILURE'])` | Resultado del evento | `src/modules/audit/dto/audit-event.dto.ts:54` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant (FK directory) | `src/modules/audit/dto/audit-event.dto.ts:62` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sucursal (FK directory) | `src/modules/audit/dto/audit-event.dto.ts:73` |
| `ip` | `string` | No | — | `@IsOptional()` `@IsIP()` | IP de origen | `src/modules/audit/dto/audit-event.dto.ts:81` |
| `deviceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Dispositivo (FK iam.devices) | `src/modules/audit/dto/audit-event.dto.ts:92` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "action": "valor-ejemplo",
  "entity": "valor-ejemplo",
  "outcome": "SUCCESS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<AuditEventResultDto>` · DTO `AuditEventResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id del evento de auditoría | `src/modules/audit/dto/audit-event.dto.ts:101` |
| `previousHash` | `string` | Sí | admite null | — | Hash del eslabón anterior de la cadena | `src/modules/audit/dto/audit-event.dto.ts:110` |
| `recordHash` | `string` | Sí | — | — | Hash sellado de este registro | `src/modules/audit/dto/audit-event.dto.ts:116` |
| `recordedAt` | `string` | Sí | formato date-time | — | Momento del registro | `src/modules/audit/dto/audit-event.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit.controller.spec.ts:51` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-04`

---

## 5. GET /audit/history/{entity}/{id}

- **Origen:** CONTRATO
- **Nombre:** Consultar historial / línea de tiempo de un registro
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditController.getHistory` — `src/modules/audit/controllers/audit.controller.ts:102`

### Qué es y para qué sirve (negocio)

Consultar historial / línea de tiempo de un registro. Caso de uso UC-10-05: Consultar historial / línea de tiempo (audita la propia lectura). Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:48`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /audit/history/{entity}/{id}` la atiende `AuditController.getHistory` (src/modules/audit/controllers/audit.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuditHistoryService.getTimeline`. Crea filas en audit.audit_log, audit.data_access_log. Lee audit.audit_log, iam.sessions. Hay 1 llamada cuyo destino depende de un dato en tiempo de ejecución y no se siguió.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/audit.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/audit/controllers/audit.controller.ts:102` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.getHistory → AuditHistoryService.getTimeline → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuditController.getHistory → AuditHistoryService.getTimeline → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | AuditController.getHistory → AuditHistoryService.getTimeline → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuditController.getHistory → AuditHistoryService.getTimeline → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

**No se pudo seguir** (el destino depende de un dato en tiempo de ejecución):

- `this.historyRepo.timeline (entidad según argumento no literal)` — `src/modules/audit/services/audit-history.service.ts:68`

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `entity` | path | Sí | `string` | — |
| `id` | path | Sí | `string` | — |
| `as_of` | query | No | `string` | Reconstrucción point-in-time: fila vigente a esta fecha ISO-8601 |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<HistoryTimelineDto>` · DTO `HistoryTimelineDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `entity` | `string` | Sí | — | — | Entidad consultada | `src/modules/audit/dto/history.dto.ts:84` |
| `entityId` | `string` | Sí | — | — | Id del registro | `src/modules/audit/dto/history.dto.ts:90` |
| `count` | `number` | Sí | — | — | Nº de revisiones devueltas | `src/modules/audit/dto/history.dto.ts:96` |
| `revisions` | `array<HistoryRevisionDto>` | Sí | — | — | Revisiones ordenadas cronológicamente | `src/modules/audit/dto/history.dto.ts:105` |
| `revisions[].revisionNo` | `number` | No | — | — | Número de revisión monotónico | `src/modules/audit/dto/history.dto.ts:25` |
| `revisions[].operationConceptId` | `string` | Sí | — | — | Operación (INSERT/UPDATE/DELETE) como concepto | `src/modules/audit/dto/history.dto.ts:33` |
| `revisions[].validFrom` | `string` | No | formato date-time | — | Vigente desde | `src/modules/audit/dto/history.dto.ts:43` |
| `revisions[].validTo` | `string` | No | formato date-time | — | Vigente hasta | `src/modules/audit/dto/history.dto.ts:53` |
| `revisions[].changedByUserId` | `string` | No | — | — | Usuario que efectuó el cambio | `src/modules/audit/dto/history.dto.ts:59` |
| `revisions[].recordedAt` | `string` | Sí | formato date-time | — | Momento del registro | `src/modules/audit/dto/history.dto.ts:69` |
| `revisions[].dataSnapshot` | `object` | Sí | — | — | Snapshot del estado en esa revisión | `src/modules/audit/dto/history.dto.ts:75` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Entidad de historial no soportada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit.controller.spec.ts:57` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-05`

---

## 6. POST /audit/integrity/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar integridad tamper-evidence de la cadena
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditController.verifyIntegrity` — `src/modules/audit/controllers/audit.controller.ts:118`

### Qué es y para qué sirve (negocio)

Verificar integridad tamper-evidence de la cadena. Caso de uso UC-10-06: Verificar integridad tamper-evidence y atestar. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:49`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /audit/integrity/verify` la atiende `AuditController.verifyIntegrity` (src/modules/audit/controllers/audit.controller.ts:118). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AuditVerifyIntegrityDto` (2 campos, 0 obligatorios). Delega en `AuditEventsService.verifyIntegrity`. Crea filas en audit.audit_log. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/audit.controller.ts:118` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.verifyIntegrity → AuditEventsService.verifyIntegrity → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuditController.verifyIntegrity → AuditEventsService.verifyIntegrity → AuditLogRepository.findChain | `src/modules/audit/repositories/audit-log.repository.ts:257` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuditController.verifyIntegrity → AuditEventsService.verifyIntegrity → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `AuditVerifyIntegrityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Partición de tenant a verificar | `src/modules/audit/dto/integrity.dto.ts:17` |
| `limit` | `number` | No | — | `@IsOptional()` `@Type(() => Number)` `@IsInt()` | Modo diagnóstico acotado: máximo de eslabones a recorrer. Si se omite, se verifica la partición completa. Un límite menor al total devuelve un resultado parcial (`complete: false`) sin atestación positiva. Debe ser un entero entre 1 y 100000 (`400 AUDIT_INTEGRITY_RANGE_INVALID`). | `src/modules/audit/dto/integrity.dto.ts:32` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "limit": 1
}
```

</details>

### Respuesta — `Promise<IntegrityReportDto>` · DTO `IntegrityReportDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `verified` | `boolean` | Sí | — | — | true sólo si se recorrió la partición completa y está íntegra. Un | `src/modules/audit/dto/integrity.dto.ts:45` |
| `complete` | `boolean` | Sí | — | — | true si se examinaron todos los eslabones de la partición; false si el | `src/modules/audit/dto/integrity.dto.ts:55` |
| `checkedCount` | `number` | Sí | — | — | Nº de eslabones verificados | `src/modules/audit/dto/integrity.dto.ts:61` |
| `brokenAt` | `string` | Sí | admite null | — | Id del primer eslabón roto, si lo hay | `src/modules/audit/dto/integrity.dto.ts:70` |
| `attestationId` | `string` | Sí | admite null | — | Id del evento de atestación registrado. null cuando el resultado es | `src/modules/audit/dto/integrity.dto.ts:81` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.BAD_REQUEST} |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit.controller.spec.ts:68` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-06`

---

## 7. GET /audit/log

- **Origen:** CONTRATO
- **Nombre:** Bitácora de acciones que mutaron, con filtros y riesgo para la seguridad de la salud
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditQueryController.log` — `src/modules/audit/controllers/audit-query.controller.ts:40`

### Qué es y para qué sirve (negocio)

Bitácora de acciones que mutaron, con filtros y riesgo para la seguridad de la salud. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /audit/log` la atiende `AuditQueryController.log` (src/modules/audit/controllers/audit-query.controller.ts:40). Exige sesión con alguno de los roles AUDITOR, DPO, SECURITY_ADMIN. Delega en `AuditQueryService.log`. Lee audit.audit_log.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: AUDITOR, DPO, SECURITY_ADMIN | `src/modules/audit/controllers/audit-query.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | AuditQueryController.log → AuditQueryService.log → AuditQueryRepository.auditLog | `src/modules/audit/repositories/audit-query.repository.ts:125` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Desde (ISO 8601, incluido). Sin rango, la consulta mira los últimos 30 días |
| `to` | query | No | `string` | Hasta (ISO 8601, excluido) |
| `userId` | query | No | `string` | Quién actuó |
| `tenantId` | query | No | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `result` | query | No | `string` | — |
| `action` | query | No | `string` | Acción exacta: el código de negocio (`CATALOG_ANNOTATION_SAVED`) o `HTTP <VERBO> <plantilla>` |
| `method` | query | No | `string` | Verbo HTTP, derivado de la acción; las acciones de negocio salen del mapa de rutas armado al arrancar |
| `route` | query | No | `string` | Plantilla exacta de la ruta, con `:parámetros` |
| `entity` | query | No | `string` | Entidad afectada |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `ctrl:AuditQueryController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /audit/me/data-access

- **Origen:** CONTRATO
- **Nombre:** Quién accedió a mi historia y con qué finalidad
- **Bloque:** Auditoría y Reporting
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditMeController.list` — `src/modules/audit/controllers/audit-me.controller.ts:36`

### Qué es y para qué sirve (negocio)

Quién accedió a mi historia y con qué finalidad. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`GET /audit/me/data-access` la atiende `AuditMeController.list` (src/modules/audit/controllers/audit-me.controller.ts:36). Exige sesión con alguno de los roles PATIENT. Delega en `MyDataAccessService.list`. Lee audit.data_access_log, profiles.health_practitioner_profiles, profiles.patient_profiles, profiles.person_account_links, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/audit/controllers/audit-me.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.data_access_log` | LEE | LEE | POR_SQL | AuditMeController.list → MyDataAccessService.list → PatientAccessLogRepository.accessesTo | `src/modules/audit/repositories/patient-access-log.repository.ts:76` |
| `profiles.health_practitioner_profiles` | LEE | LEE | POR_SQL | AuditMeController.list → MyDataAccessService.list → PatientAccessLogRepository.accessesTo | `src/modules/audit/repositories/patient-access-log.repository.ts:76` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuditMeController.list → MyDataAccessService.list → MyDataAccessService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuditMeController.list → MyDataAccessService.list → MyDataAccessService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | POR_SQL | AuditMeController.list → MyDataAccessService.list → PatientAccessLogRepository.accessesTo | `src/modules/audit/repositories/patient-access-log.repository.ts:76` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `from` | query | No | `string` | Desde (ISO 8601, incluido). Sin él, desde el primer acceso |
| `to` | query | No | `string` | Hasta (ISO 8601, excluido) |
| `excludeOwn` | query | No | `boolean` | Si es `true`, omite los accesos del propio titular y deja sólo los de terceros |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyDataAccessPageDto>` · DTO `MyDataAccessPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MyDataAccessEntryDto>` | Sí | — | — | — | `src/modules/audit/dto/my-data-access.dto.ts:137` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador del registro | `src/modules/audit/dto/my-data-access.dto.ts:109` |
| `items[].accessedAt` | `string` | Sí | formato date-time | — | — | `src/modules/audit/dto/my-data-access.dto.ts:112` |
| `items[].accessor` | `DataAccessorDto` | Sí | — | — | — | `src/modules/audit/dto/my-data-access.dto.ts:115` |
| `items[].accessor.kind` | `string` | Sí | valores: SELF, PRACTITIONER, OTHER | — | `SELF` es el propio titular; `PRACTITIONER`, un profesional de la salud; `OTHER`, cualquier otra cuenta | `src/modules/audit/dto/my-data-access.dto.ts:96` |
| `items[].accessor.displayName` | `object` | No | admite null | — | Nombre a mostrar de la persona vinculada a la cuenta; `null` si no tiene o si es el propio titular | `src/modules/audit/dto/my-data-access.dto.ts:103` |
| `items[].operation` | `string` | Sí | valores: READ, CREATE, UPDATE, DELETE, EXPORT | — | — | `src/modules/audit/dto/my-data-access.dto.ts:118` |
| `items[].resourceType` | `object` | No | admite null | — | Tipo de dato al que se accedió (código, p. ej. `DIAGNOSTIC_RESULTS`) | `src/modules/audit/dto/my-data-access.dto.ts:125` |
| `items[].purpose` | `object` | No | admite null | — | Finalidad con que se declaró el acceso (código, p. ej. `TREATMENT`, `PATIENT_ACCESS`) | `src/modules/audit/dto/my-data-access.dto.ts:132` |
| `nextCursor` | `object` | No | admite null | — | — | `src/modules/audit/dto/my-data-access.dto.ts:140` |
| `limit` | `number` | Sí | — | — | — | `src/modules/audit/dto/my-data-access.dto.ts:143` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil de paciente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit-me.controller.spec.ts:19` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `ctrl:AuditMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. POST /audit/retention/apply

- **Origen:** CONTRATO
- **Nombre:** Aplicar retención / archivado / litigation-hold
- **Bloque:** Auditoría y Reporting
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditController.applyRetention` — `src/modules/audit/controllers/audit.controller.ts:136`

### Qué es y para qué sirve (negocio)

Aplicar retención / archivado / litigation-hold. Caso de uso UC-10-09: Aplicar retención / archivado / litigation-hold. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:52`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /audit/retention/apply` la atiende `AuditController.applyRetention` (src/modules/audit/controllers/audit.controller.ts:136). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RetentionApplyDto` (3 campos, 0 obligatorios). Delega en `AuditEventsService.applyRetention`. Crea filas en audit.audit_log. Borra de audit.data_access_log. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/audit.controller.ts:136` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.applyRetention → AuditEventsService.applyRetention → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuditController.applyRetention → AuditEventsService.applyRetention → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.data_access_log` | BORRA | BORRA | DIRECTA | AuditController.applyRetention → AuditEventsService.applyRetention → DataAccessLogRepository.purgeOlderThan | `src/modules/audit/repositories/data-access-log.repository.ts:163` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuditController.applyRetention → AuditEventsService.applyRetention → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `RetentionApplyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Partición de tenant afectada | `src/modules/audit/dto/operations.dto.ts:21` |
| `scope` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Log/partición lógica objetivo | `src/modules/audit/dto/operations.dto.ts:33` |
| `olderThan` | `string` | No | — | `@IsOptional()` `@IsISO8601()` | Archiva/desprende particiones anteriores a esta fecha ISO-8601 | `src/modules/audit/dto/operations.dto.ts:44` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "scope": "valor-ejemplo",
  "olderThan": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<RetentionResultDto>` · DTO `RetentionResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `auditLogId` | `string` | Sí | — | — | Id del evento de retención registrado | `src/modules/audit/dto/operations.dto.ts:53` |
| `applied` | `boolean` | Sí | — | — | true si la operación quedó registrada | `src/modules/audit/dto/operations.dto.ts:59` |
| `purgedCount` | `number` | Sí | — | — | Nº real de filas purgadas por la política de retención | `src/modules/audit/dto/operations.dto.ts:67` |
| `recordedAt` | `string` | Sí | formato date-time | — | Momento del registro | `src/modules/audit/dto/operations.dto.ts:77` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit.controller.spec.ts:74` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-09`

---

## 10. POST /audit/third-party-access

- **Origen:** CONTRATO
- **Nombre:** Registrar acceso delegado / de tercero gobernado
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuditController.recordThirdPartyAccess` — `src/modules/audit/controllers/audit.controller.ts:168`

### Qué es y para qué sirve (negocio)

Registrar acceso delegado / de tercero gobernado. Caso de uso UC-10-12: Registrar acceso delegado / de tercero gobernado. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:55`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /audit/third-party-access` la atiende `AuditController.recordThirdPartyAccess` (src/modules/audit/controllers/audit.controller.ts:168). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `RecordThirdPartyAccessDto` (13 campos, 2 obligatorios). Delega en `ThirdPartyAccessService.record`. Crea filas en audit.audit_log, audit.delegated_access_audit_log, audit.identity_verification_access_log, audit.insurance_decision_access_log, audit.pharmacy_inventory_access_log. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/audit.controller.ts:168` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordThirdPartyAccess → ThirdPartyAccessService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuditController.recordThirdPartyAccess → ThirdPartyAccessService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.delegated_access_audit_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordThirdPartyAccess → ThirdPartyAccessService.record → ThirdPartyAccessRepository.recordDelegated | `src/modules/audit/repositories/third-party-access.repository.ts:168` |
| `audit.identity_verification_access_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordThirdPartyAccess → ThirdPartyAccessService.record → ThirdPartyAccessRepository.recordIdentity | `src/modules/audit/repositories/third-party-access.repository.ts:224` |
| `audit.insurance_decision_access_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordThirdPartyAccess → ThirdPartyAccessService.record → ThirdPartyAccessRepository.recordInsurance | `src/modules/audit/repositories/third-party-access.repository.ts:196` |
| `audit.pharmacy_inventory_access_log` | ESCRIBE | CREA | DIRECTA | AuditController.recordThirdPartyAccess → ThirdPartyAccessService.record → ThirdPartyAccessRepository.recordPharmacy | `src/modules/audit/repositories/third-party-access.repository.ts:251` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuditController.recordThirdPartyAccess → ThirdPartyAccessService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `RecordThirdPartyAccessDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `channel` | `string` | Sí | valores: DELEGATED, INSURANCE, IDENTITY, PHARMACY | `@IsIn(TPA_CHANNELS)` | Canal de acceso de tercero | `src/modules/audit/dto/third-party-access.dto.ts:24` |
| `outcome` | `string` | Sí | valores: SUCCESS, FAILURE | `@IsIn(['SUCCESS', 'FAILURE'])` | Resultado del acceso | `src/modules/audit/dto/third-party-access.dto.ts:34` |
| `purposeOfUse` | `string` | No | valores: TREATMENT, PAYMENT, OPERATIONS, COVERAGE, VERIFICATION | `@IsOptional()` `@IsIn(['TREATMENT', 'PAYMENT', 'OPERATIONS', 'COVERAGE', 'VERIFICATION'])` | Propósito de uso | `src/modules/audit/dto/third-party-access.dto.ts:45` |
| `delegatingPractitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | DELEGATED: perfil de profesional delegante | `src/modules/audit/dto/third-party-access.dto.ts:57` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | DELEGATED/INSURANCE: perfil de paciente | `src/modules/audit/dto/third-party-access.dto.ts:68` |
| `delegatedAssignmentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | DELEGATED: asignación de delegación | `src/modules/audit/dto/third-party-access.dto.ts:79` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Recurso accedido | `src/modules/audit/dto/third-party-access.dto.ts:87` |
| `insuranceCarrierId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | INSURANCE: aseguradora | `src/modules/audit/dto/third-party-access.dto.ts:99` |
| `claimId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | INSURANCE: reclamo | `src/modules/audit/dto/third-party-access.dto.ts:107` |
| `authorizationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | INSURANCE: solicitud de autorización | `src/modules/audit/dto/third-party-access.dto.ts:118` |
| `verificationCaseId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | IDENTITY: caso de verificación | `src/modules/audit/dto/third-party-access.dto.ts:130` |
| `pharmacyId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | PHARMACY: farmacia | `src/modules/audit/dto/third-party-access.dto.ts:139` |
| `correlationId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | PHARMACY: correlación end-to-end | `src/modules/audit/dto/third-party-access.dto.ts:150` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "channel": "DELEGATED",
  "outcome": "SUCCESS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ThirdPartyAccessResultDto>` · DTO `ThirdPartyAccessResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la fila del log especializado | `src/modules/audit/dto/third-party-access.dto.ts:159` |
| `channel` | `string` | Sí | — | — | Canal usado | `src/modules/audit/dto/third-party-access.dto.ts:165` |
| `auditLogId` | `string` | Sí | — | — | Id del evento de auditoría (provenance) | `src/modules/audit/dto/third-party-access.dto.ts:171` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Falta el campo requerido para el canal: {field} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/audit.controller.spec.ts:87` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-12`

---

## 11. POST /compliance/audit-export

- **Origen:** CONTRATO
- **Nombre:** Exportar evidencia de auditoría para cumplimiento
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ComplianceController.exportEvidence` — `src/modules/audit/controllers/compliance.controller.ts:25`

### Qué es y para qué sirve (negocio)

Exportar evidencia de auditoría para cumplimiento. Caso de uso UC-10-07: Exportar evidencia de auditoría (idempotente por query_hash). Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:50`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /compliance/audit-export` la atiende `ComplianceController.exportEvidence` (src/modules/audit/controllers/compliance.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAuditExportDto` (6 campos, 0 obligatorios). Delega en `ComplianceService.exportEvidence`. Crea filas en audit.analytics_governance_log, audit.audit_log. Lee audit.analytics_governance_log, audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/compliance.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.analytics_governance_log` | ESCRIBE | CREA | DIRECTA | ComplianceController.exportEvidence → ComplianceService.exportEvidence → AnalyticsGovernanceLogRepository.record | `src/modules/audit/repositories/analytics-governance-log.repository.ts:54` |
| `audit.analytics_governance_log` | LEE | LEE | DIRECTA | ComplianceController.exportEvidence → ComplianceService.exportEvidence → AnalyticsGovernanceLogRepository.existsByQueryHash | `src/modules/audit/repositories/analytics-governance-log.repository.ts:46` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ComplianceController.exportEvidence → ComplianceService.exportEvidence → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ComplianceController.exportEvidence → ComplianceService.exportEvidence → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | ComplianceController.exportEvidence → ComplianceService.exportEvidence → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `CreateAuditExportDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `entity` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Entidad cuyo historial se exporta | `src/modules/audit/dto/audit-export.dto.ts:23` |
| `entityId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del sujeto/registro exportado | `src/modules/audit/dto/audit-export.dto.ts:34` |
| `purposeDefinitionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Definición de propósito (FK telemetry) | `src/modules/audit/dto/audit-export.dto.ts:45` |
| `exportReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia externa del paquete de evidencia | `src/modules/audit/dto/audit-export.dto.ts:57` |
| `affectedSubjectCount` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Nº de sujetos afectados | `src/modules/audit/dto/audit-export.dto.ts:66` |
| `queryHash` | `string` | No | longitud máxima 128 | `@IsOptional()` `@IsString()` `@MaxLength(128)` | Hash de la consulta (idempotencia) | `src/modules/audit/dto/audit-export.dto.ts:78` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "entity": "valor-ejemplo",
  "entityId": "00000000-0000-4000-8000-000000000001",
  "purposeDefinitionId": "00000000-0000-4000-8000-000000000001",
  "exportReference": "valor-ejemplo",
  "affectedSubjectCount": 1,
  "queryHash": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
}
```

</details>

### Respuesta — `Promise<AuditExportResultDto>` · DTO `AuditExportResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la fila de gobernanza | `src/modules/audit/dto/audit-export.dto.ts:87` |
| `exportReference` | `string` | Sí | — | — | Referencia del paquete de evidencia | `src/modules/audit/dto/audit-export.dto.ts:93` |
| `auditLogId` | `string` | Sí | — | — | Id del evento de auditoría (provenance) | `src/modules/audit/dto/audit-export.dto.ts:99` |
| `occurredAt` | `string` | Sí | formato date-time | — | Momento del registro | `src/modules/audit/dto/audit-export.dto.ts:109` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una exportación con ese query_hash |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/compliance.controller.spec.ts:23` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-07`

---

## 12. POST /moderation/decisions

- **Origen:** CONTRATO
- **Nombre:** Registrar decisión de moderación / gobernanza analítica
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ModerationController.recordDecision` — `src/modules/audit/controllers/moderation.controller.ts:28`

### Qué es y para qué sirve (negocio)

Registrar decisión de moderación / gobernanza analítica. Caso de uso UC-10-11: Registrar decisión de moderación / gobernanza. Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:54`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /moderation/decisions` la atiende `ModerationController.recordDecision` (src/modules/audit/controllers/moderation.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateModerationDecisionDto` (8 campos, 3 obligatorios). Delega en `ModerationService.recordDecision`. Crea filas en audit.analytics_governance_log, audit.audit_log, audit.moderation_decisions_history, audit.moderation_events. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/moderation.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.analytics_governance_log` | ESCRIBE | CREA | DIRECTA | ModerationController.recordDecision → ModerationService.recordDecision → AnalyticsGovernanceLogRepository.record | `src/modules/audit/repositories/analytics-governance-log.repository.ts:54` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | ModerationController.recordDecision → ModerationService.recordDecision → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | ModerationController.recordDecision → ModerationService.recordDecision → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.moderation_decisions_history` | ESCRIBE | CREA | DIRECTA | ModerationController.recordDecision → ModerationService.recordDecision → ModerationRepository.recordHistory | `src/modules/audit/repositories/moderation.repository.ts:102` |
| `audit.moderation_events` | ESCRIBE | CREA | DIRECTA | ModerationController.recordDecision → ModerationService.recordDecision → ModerationRepository.record | `src/modules/audit/repositories/moderation.repository.ts:77` |
| `iam.sessions` | LEE | LEE | POR_SQL | ModerationController.recordDecision → ModerationService.recordDecision → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `CreateModerationDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `targetType` | `string` | Sí | valores: CONTENT, USER, COMMENT, REVIEW | `@IsIn(MOD_TARGET_TYPES)` | Tipo de destino moderado | `src/modules/audit/dto/moderation.dto.ts:36` |
| `targetId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del destino (validado vía entity_registry) | `src/modules/audit/dto/moderation.dto.ts:46` |
| `action` | `string` | Sí | valores: REMOVE, FLAG, APPROVE, RESTRICT, DISMISS | `@IsIn(MOD_ACTIONS)` | Acción de moderación | `src/modules/audit/dto/moderation.dto.ts:53` |
| `reason` | `string` | No | valores: POLICY, ABUSE, SPAM, LEGAL | `@IsOptional()` `@IsIn(MOD_REASONS)` | Motivo de la decisión | `src/modules/audit/dto/moderation.dto.ts:64` |
| `policyVersion` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Versión de política aplicada | `src/modules/audit/dto/moderation.dto.ts:76` |
| `evidence` | `object` | No | — | `@IsOptional()` `@IsObject()` | Evidencia estructurada de la decisión | `src/modules/audit/dto/moderation.dto.ts:84` |
| `governance` | `boolean` | No | — | `@IsOptional()` | true si la decisión implica uso/gobernanza de datos (registra gobernanza) | `src/modules/audit/dto/moderation.dto.ts:94` |
| `moderationDecisionId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id REAL de la decisión (FK community.moderation_decisions) para versionar su historial | `src/modules/audit/dto/moderation.dto.ts:106` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "targetType": "CONTENT",
  "targetId": "00000000-0000-4000-8000-000000000001",
  "action": "REMOVE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
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

</details>

### Respuesta — `Promise<ModerationDecisionResultDto>` · DTO `ModerationDecisionResultDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id del evento de moderación | `src/modules/audit/dto/moderation.dto.ts:115` |
| `auditLogId` | `string` | Sí | — | — | Id del evento de auditoría (provenance) | `src/modules/audit/dto/moderation.dto.ts:121` |
| `historyRecorded` | `boolean` | Sí | — | — | true si se versionó el historial de la decisión | `src/modules/audit/dto/moderation.dto.ts:129` |
| `recordedAt` | `string` | Sí | formato date-time | — | Momento del registro | `src/modules/audit/dto/moderation.dto.ts:139` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/compliance.controller.spec.ts:59` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-11`

---

## 13. POST /privacy/dsar

- **Origen:** CONTRATO
- **Nombre:** Tramitar DSAR (solicitud del titular)
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrivacyController.createDsar` — `src/modules/audit/controllers/privacy.controller.ts:34`

### Qué es y para qué sirve (negocio)

Tramitar DSAR (solicitud del titular). Caso de uso UC-10-08: Tramitar DSAR (máquina de estados). Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`POST /privacy/dsar` la atiende `PrivacyController.createDsar` (src/modules/audit/controllers/privacy.controller.ts:34). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDsarDto` (3 campos, 1 obligatorio). Delega en `ComplianceService.createDsar`. Crea filas en audit.analytics_governance_log, audit.audit_log, audit.dsar_requests. Lee audit.audit_log, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/privacy.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.analytics_governance_log` | ESCRIBE | CREA | DIRECTA | PrivacyController.createDsar → ComplianceService.createDsar → AnalyticsGovernanceLogRepository.record | `src/modules/audit/repositories/analytics-governance-log.repository.ts:54` |
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PrivacyController.createDsar → ComplianceService.createDsar → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PrivacyController.createDsar → ComplianceService.createDsar → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.dsar_requests` | ESCRIBE | CREA | DIRECTA | PrivacyController.createDsar → ComplianceService.createDsar → DsarRequestsRepository.create | `src/modules/audit/repositories/dsar-requests.repository.ts:44` |
| `iam.sessions` | LEE | LEE | POR_SQL | PrivacyController.createDsar → ComplianceService.createDsar → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Cuerpo — DTO `CreateDsarDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `type` | `string` | Sí | valores: ACCESS, ERASURE, RECTIFICATION, PORTABILITY, OBJECTION | `@IsIn(DSAR_TYPES)` | Tipo de solicitud del titular | `src/modules/audit/dto/dsar.dto.ts:27` |
| `userId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Titular de los datos (FK iam.users); por defecto el actor | `src/modules/audit/dto/dsar.dto.ts:38` |
| `jurisdiction` | `string` | No | valores: PE, EU, US | `@IsOptional()` `@IsIn(['PE', 'EU', 'US'])` | Jurisdicción aplicable | `src/modules/audit/dto/dsar.dto.ts:49` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "type": "ACCESS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "type": "ACCESS",
  "userId": "00000000-0000-4000-8000-000000000001",
  "jurisdiction": "PE"
}
```

</details>

### Respuesta — `Promise<DsarResponseDto>` · DTO `DsarResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la solicitud | `src/modules/audit/dto/dsar.dto.ts:82` |
| `userId` | `string` | Sí | — | — | Titular de los datos | `src/modules/audit/dto/dsar.dto.ts:88` |
| `status` | `string` | Sí | — | — | Estado actual (concepto) | `src/modules/audit/dto/dsar.dto.ts:94` |
| `type` | `string` | Sí | — | — | Tipo (concepto) | `src/modules/audit/dto/dsar.dto.ts:100` |
| `rowVersion` | `number` | Sí | — | — | Versión de fila optimista | `src/modules/audit/dto/dsar.dto.ts:106` |
| `requestedAt` | `string` | Sí | formato date-time | — | Solicitada el | `src/modules/audit/dto/dsar.dto.ts:116` |
| `completedAt` | `string` | No | formato date-time; admite null | — | Completada el | `src/modules/audit/dto/dsar.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/compliance.controller.spec.ts:36` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-08`

---

## 14. PATCH /privacy/dsar/{id}

- **Origen:** CONTRATO
- **Nombre:** Avanzar la máquina de estados de una solicitud DSAR
- **Bloque:** Auditoría y Reporting
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrivacyController.updateDsar` — `src/modules/audit/controllers/privacy.controller.ts:51`

### Qué es y para qué sirve (negocio)

Avanzar la máquina de estados de una solicitud DSAR. Caso de uso UC-10-08: Tramitar DSAR (máquina de estados). Dentro del módulo (descripción del modelo, en inglés): «Complements diagram_10_audit with history and append-only evidence for patient identity, workforce assignments, facilities, diagnostic assets, public profiles and moderation.» Dominio: Auditoría y Reporting.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/audit/README.md:51`) · MODELO (`Mantra Core Health Context/modules/diagram_10_audit.puml:192`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:36`)

### Cómo se atiende (sistema)

`PATCH /privacy/dsar/{id}` la atiende `PrivacyController.updateDsar` (src/modules/audit/controllers/privacy.controller.ts:51). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `UpdateDsarDto` (2 campos, 1 obligatorio). Delega en `ComplianceService.updateDsar`. Crea filas en audit.audit_log. Actualiza audit.dsar_requests. Lee audit.audit_log, audit.dsar_requests, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/audit/controllers/privacy.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/audit/controllers/privacy.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | PrivacyController.updateDsar → ComplianceService.updateDsar → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | PrivacyController.updateDsar → ComplianceService.updateDsar → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.dsar_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | PrivacyController.updateDsar → ComplianceService.updateDsar | `src/modules/audit/services/compliance.service.ts:198` |
| `audit.dsar_requests` | LEE | LEE | DIRECTA | PrivacyController.updateDsar → ComplianceService.updateDsar → DsarRequestsRepository.findById | `src/modules/audit/repositories/dsar-requests.repository.ts:39` |
| `iam.sessions` | LEE | LEE | POR_SQL | PrivacyController.updateDsar → ComplianceService.updateDsar → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateDsarDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: IN_PROGRESS, COMPLETED, REJECTED | `@IsIn(DSAR_TRANSITIONS)` | Nuevo estado de la máquina DSAR | `src/modules/audit/dto/dsar.dto.ts:62` |
| `resultFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Paquete DSAR resultante (FK common.files) | `src/modules/audit/dto/dsar.dto.ts:73` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "IN_PROGRESS"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "IN_PROGRESS",
  "resultFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DsarResponseDto>` · DTO `DsarResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | — | — | Id de la solicitud | `src/modules/audit/dto/dsar.dto.ts:82` |
| `userId` | `string` | Sí | — | — | Titular de los datos | `src/modules/audit/dto/dsar.dto.ts:88` |
| `status` | `string` | Sí | — | — | Estado actual (concepto) | `src/modules/audit/dto/dsar.dto.ts:94` |
| `type` | `string` | Sí | — | — | Tipo (concepto) | `src/modules/audit/dto/dsar.dto.ts:100` |
| `rowVersion` | `number` | Sí | — | — | Versión de fila optimista | `src/modules/audit/dto/dsar.dto.ts:106` |
| `requestedAt` | `string` | Sí | formato date-time | — | Solicitada el | `src/modules/audit/dto/dsar.dto.ts:116` |
| `completedAt` | `string` | No | formato date-time; admite null | — | Completada el | `src/modules/audit/dto/dsar.dto.ts:126` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud DSAR no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud DSAR ya está en estado terminal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/audit.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/audit/controllers/compliance.controller.spec.ts:47` |

### Flujos

- Módulo 10 — Audit, Provenance and Version Histories — etapa `UC-10-08`

---

