<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `bulk_import`

- **Bloque:** —
- **Operaciones:** 7 (7 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 3 · BAJO 4
- **Tablas distintas que tocan:** 13
- **Respuestas de error y detalle contractual:** `openapi/endpoints/bulk-import.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/bulk-imports` | Lotes de la organización | BAJO | 11 | SECURITY_ADMIN, PLATFORM_ADMIN |
| 2 | POST | `/admin/bulk-imports` | Crea un lote: valida el archivo y devuelve la vista previa (VALIDADO o RECHAZADO) | BAJO | 11 | SECURITY_ADMIN, PLATFORM_ADMIN |
| 3 | GET | `/admin/bulk-imports/{id}` | Estado, vista previa y avance de un lote | MEDIO | 14 | SECURITY_ADMIN, PLATFORM_ADMIN |
| 4 | POST | `/admin/bulk-imports/{id}/confirm` | Confirma un lote VALIDADO y lo encola (idempotente por Idempotency-Key) | MEDIO | 14 | SECURITY_ADMIN, PLATFORM_ADMIN |
| 5 | GET | `/admin/bulk-imports/{id}/report` | Informe de un lote: creados, omitidos y rechazados con su motivo | MEDIO | 14 | SECURITY_ADMIN, PLATFORM_ADMIN |
| 6 | GET | `/admin/bulk-imports/templates` | Catálogo de plantillas, topes y estado declarado del motor | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN |
| 7 | GET | `/admin/bulk-imports/templates/{kind}` | Descarga la plantilla de un tipo de carga en CSV o JSON | BAJO | 0 | SECURITY_ADMIN, PLATFORM_ADMIN |

---

## 1. GET /admin/bulk-imports

- **Origen:** CONTRATO
- **Nombre:** Lotes de la organización
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BulkImportController.list` — `src/modules/bulk_import/controllers/bulk-import.controller.ts:117`

### Qué es y para qué sirve (negocio)

Lotes de la organización.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/bulk-imports` la atiende `BulkImportController.list` (src/modules/bulk_import/controllers/bulk-import.controller.ts:117). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Delega en `BulkImportService.list`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/bulk_import/controllers/bulk-import.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | BulkImportController.list → BulkImportService.list → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |

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

El árbol de decisión completo está en [flujos](../flujos/bulk_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- bulk_import — motor de cargas masivas — etapa `ctrl:BulkImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /admin/bulk-imports

- **Origen:** CONTRATO
- **Nombre:** Crea un lote: valida el archivo y devuelve la vista previa (VALIDADO o RECHAZADO)
- **Bloque:** —
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BulkImportController.create` — `src/modules/bulk_import/controllers/bulk-import.controller.ts:127`

### Qué es y para qué sirve (negocio)

Crea un lote: valida el archivo y devuelve la vista previa (VALIDADO o RECHAZADO).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/bulk-imports` la atiende `BulkImportController.create` (src/modules/bulk_import/controllers/bulk-import.controller.ts:127). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Valida el cuerpo como `CreateBulkImportDto` (6 campos, 1 obligatorio). Delega en `BulkImportService.create`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/bulk_import/controllers/bulk-import.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | multipart/form-data (obligatorio); el tamaño del archivo lo define la ruta, no el límite global | `contrato (requestBody)` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/bulk_import/controllers/bulk-import.controller.ts:127` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | BulkImportController.create → BulkImportService.create → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |

### Cuerpo — DTO `CreateBulkImportDto` · `multipart/form-data`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `kind` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Tipo de carga (ver GET /admin/bulk-imports/templates) | `src/modules/bulk_import/dto/bulk-import.dto.ts:35` |
| `reason` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo del alta (cargas de usuarios) | `src/modules/bulk_import/dto/bulk-import.dto.ts:44` |
| `sourceOrganization` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Organización de origen de los datos (historia clínica) | `src/modules/bulk_import/dto/bulk-import.dto.ts:53` |
| `legalBasis` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Base legal que habilita la carga (historia clínica) | `src/modules/bulk_import/dto/bulk-import.dto.ts:62` |
| `loadedAt` | `string` | No | longitud máxima 10 | `@IsOptional()` `@IsString()` `@MaxLength(10)` | Fecha de la carga, AAAA-MM-DD (historia clínica) | `src/modules/bulk_import/dto/bulk-import.dto.ts:71` |
| `rows` | `array<object>` | No | — | `@IsOptional()` `@Transform(({ obj }: { obj: { rows?: unknown } }) => obj.rows, { toClassOnly: true, })` `@IsArray()` | Filas de la carga como objetos con las columnas de la plantilla (alternativa al archivo) | `src/modules/bulk_import/dto/bulk-import.dto.ts:87` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "kind": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "kind": "valor-ejemplo",
  "reason": "Texto descriptivo de ejemplo",
  "sourceOrganization": "valor-ejemplo",
  "legalBasis": "valor-ejemplo",
  "loadedAt": "2026-10-31",
  "rows": [
    {
      "clave": "valor"
    }
  ]
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/bulk_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- bulk_import — motor de cargas masivas — etapa `ctrl:BulkImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /admin/bulk-imports/{id}

- **Origen:** CONTRATO
- **Nombre:** Estado, vista previa y avance de un lote
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BulkImportController.get` — `src/modules/bulk_import/controllers/bulk-import.controller.ts:191`

### Qué es y para qué sirve (negocio)

Estado, vista previa y avance de un lote.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/bulk-imports/{id}` la atiende `BulkImportController.get` (src/modules/bulk_import/controllers/bulk-import.controller.ts:191). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Delega en `BulkImportService.get`. Crea filas en audit.audit_log. Lee audit.audit_log, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/bulk_import/controllers/bulk-import.controller.ts:191` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/bulk_import/controllers/bulk-import.controller.ts:191` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.auditRead → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.auditRead → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.access_policies` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | BulkImportController.get → BulkImportService.get → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `iam.sessions` | LEE | LEE | POR_SQL | BulkImportController.get → BulkImportService.get → BulkImportService.auditRead → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/bulk_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- bulk_import — motor de cargas masivas — etapa `ctrl:BulkImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /admin/bulk-imports/{id}/confirm

- **Origen:** CONTRATO
- **Nombre:** Confirma un lote VALIDADO y lo encola (idempotente por Idempotency-Key)
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BulkImportController.confirm` — `src/modules/bulk_import/controllers/bulk-import.controller.ts:170`

### Qué es y para qué sirve (negocio)

Confirma un lote VALIDADO y lo encola (idempotente por Idempotency-Key).

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/bulk-imports/{id}/confirm` la atiende `BulkImportController.confirm` (src/modules/bulk_import/controllers/bulk-import.controller.ts:170). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Delega en `BulkImportService.confirm`. Crea filas en audit.audit_log. Lee audit.audit_log, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/bulk_import/controllers/bulk-import.controller.ts:170` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CABECERA | Idempotency-Key (obligatoria) | `contrato (parameters)` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/bulk_import/controllers/bulk-import.controller.ts:170` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportProcessor.enqueue → BulkImportProcessor.process → BulkImportProcessor.processRow → BulkImportProcessor.provisionUser → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportProcessor.enqueue → BulkImportProcessor.process → BulkImportProcessor.processRow → BulkImportProcessor.provisionUser → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.access_policies` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | BulkImportController.confirm → BulkImportService.confirm → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `iam.sessions` | LEE | LEE | POR_SQL | BulkImportController.confirm → BulkImportService.confirm → BulkImportProcessor.enqueue → BulkImportProcessor.process → BulkImportProcessor.processRow → BulkImportProcessor.provisionUser → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `Idempotency-Key` | header | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.ACCEPTED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 202 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: Tipo de carga desconocido |

El árbol de decisión completo está en [flujos](../flujos/bulk_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- bulk_import — motor de cargas masivas — etapa `ctrl:BulkImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /admin/bulk-imports/{id}/report

- **Origen:** CONTRATO
- **Nombre:** Informe de un lote: creados, omitidos y rechazados con su motivo
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BulkImportController.report` — `src/modules/bulk_import/controllers/bulk-import.controller.ts:208`

### Qué es y para qué sirve (negocio)

Informe de un lote: creados, omitidos y rechazados con su motivo.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/bulk-imports/{id}/report` la atiende `BulkImportController.report` (src/modules/bulk_import/controllers/bulk-import.controller.ts:208). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Delega en `BulkImportService.report`, `BulkImportService.reportCsv`. Crea filas en audit.audit_log. Lee audit.audit_log, authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/bulk_import/controllers/bulk-import.controller.ts:208` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/bulk_import/controllers/bulk-import.controller.ts:208` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.auditRead → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.auditRead → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.access_policies` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | BulkImportController.report → BulkImportService.report → BulkImportService.requireBatch → BulkImportService.assertPermission → PdpAccessPolicyAdapter.isAllowed → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `iam.sessions` | LEE | LEE | POR_SQL | BulkImportController.report → BulkImportService.report → BulkImportService.auditRead → TrailAuditAdapter.record → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `format` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/bulk_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- bulk_import — motor de cargas masivas — etapa `ctrl:BulkImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. GET /admin/bulk-imports/templates

- **Origen:** CONTRATO
- **Nombre:** Catálogo de plantillas, topes y estado declarado del motor
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BulkImportController.catalog` — `src/modules/bulk_import/controllers/bulk-import.controller.ts:94`

### Qué es y para qué sirve (negocio)

Catálogo de plantillas, topes y estado declarado del motor.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/bulk-imports/templates` la atiende `BulkImportController.catalog` (src/modules/bulk_import/controllers/bulk-import.controller.ts:94). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Delega en `BulkImportService.catalog`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/bulk_import/controllers/bulk-import.controller.ts:94` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ReturnType<BulkImportService['catalog']>`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/bulk_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- bulk_import — motor de cargas masivas — etapa `ctrl:BulkImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. GET /admin/bulk-imports/templates/{kind}

- **Origen:** CONTRATO
- **Nombre:** Descarga la plantilla de un tipo de carga en CSV o JSON
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `BulkImportController.template` — `src/modules/bulk_import/controllers/bulk-import.controller.ts:102`

### Qué es y para qué sirve (negocio)

Descarga la plantilla de un tipo de carga en CSV o JSON.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/bulk-imports/templates/{kind}` la atiende `BulkImportController.template` (src/modules/bulk_import/controllers/bulk-import.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN, PLATFORM_ADMIN. Delega en `BulkImportService.template`. No se determinaron tablas para esta operación.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, PLATFORM_ADMIN | `src/modules/bulk_import/controllers/bulk-import.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No se determinaron tablas para esta operación (**SIN_DETERMINAR**).

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `kind` | path | Sí | `string` | — |
| `format` | query | No | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `StreamableFile`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/bulk_import.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- bulk_import — motor de cargas masivas — etapa `ctrl:BulkImportController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

