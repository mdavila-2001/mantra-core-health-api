<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `authz`

- **Bloque:** Identidad y Seguridad (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)
- **Operaciones:** 45 (41 en el contrato, 4 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 20 · BAJO 25
- **Tablas distintas que tocan:** 36
- **Respuestas de error y detalle contractual:** `openapi/endpoints/authz.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/authz/access-reviews` | Historia de revisiones de accesos, paginada | BAJO | 2 | SECURITY_ADMIN |
| 2 | GET | `/authz/access-reviews/due` | Cuentas con acceso administrativo sin revisión reciente | BAJO | 4 | SECURITY_ADMIN |
| 3 | GET | `/authz/care-relationships` | Listar relaciones asistenciales de un paciente | BAJO | 1 | CLINICIAN, SECURITY_ADMIN |
| 4 | POST | `/authz/care-relationships` | Establecer una relación asistencial | MEDIO | 7 | CLINICIAN, SECURITY_ADMIN |
| 5 | POST | `/authz/care-relationships/{id}/respond` | Responder (aceptar/rechazar) una solicitud de relación asistencial | MEDIO | 8 | PATIENT |
| 6 | POST | `/authz/care-relationships/{id}/revoke` | Revocar o expirar una relación asistencial | BAJO | 1 | CLINICIAN, SECURITY_ADMIN |
| 7 | POST | `/authz/care-relationships/request` | Solicitar autorización del paciente para una relación asistencial | MEDIO | 17 | CLINICIAN, PRACTITIONER |
| 8 | GET | `/authz/care-relationships/requests/mine` | Mis solicitudes de relación asistencial pendientes de decidir | BAJO | 1 | PATIENT |
| 9 | GET | `/authz/catalog/modules` | — | BAJO | 3 | SECURITY_ADMIN |
| 10 | DELETE | `/authz/clinical-access-grants/{grantId}` | Revocar o expirar una concesión de acceso clínico | MEDIO | 4 | CLINICAL_APPROVER, SECURITY_ADMIN |
| 11 | POST | `/authz/decisions/evaluate` | Recalcular la decisión de autorización efectiva (PDP) | BAJO | 11 | SECURITY_ADMIN |
| 12 | GET | `/authz/internal-users` | Usuarios internos con sus roles | BAJO | 4 | SECURITY_ADMIN |
| 13 | GET | `/authz/legal-representations` | Listar representaciones legales de un paciente | BAJO | 1 | SECURITY_ADMIN |
| 14 | POST | `/authz/legal-representations` | Registrar una representación legal del paciente | MEDIO | 7 | SECURITY_ADMIN |
| 15 | POST | `/authz/legal-representations/{id}/revoke` | Revocar o expirar una representación legal | BAJO | 1 | SECURITY_ADMIN |
| 16 | GET | `/authz/me/access` | Quién ve mi historia | BAJO | 5 | PATIENT |
| 17 | POST | `/authz/me/care-relationships/{id}/revoke` | Revocar una de mis relaciones asistenciales | BAJO | 3 | PATIENT |
| 18 | POST | `/authz/me/clinical-access-grants/{grantId}/revoke` | Revocar uno de los accesos clínicos a mi historia | MEDIO | 6 | PATIENT |
| 19 | POST | `/authz/patients/{patientProfileId}/break-the-glass` | Break-the-glass / anulación de emergencia | MEDIO | 15 | CLINICAL_APPROVER, SECURITY_ADMIN |
| 20 | POST | `/authz/patients/{patientProfileId}/clinical-access-grants` | Otorgar acceso clínico con propósito de uso | MEDIO | 12 | CLINICAL_APPROVER, SECURITY_ADMIN |
| 21 | POST | `/authz/pdp/cache/invalidate` | Invalidar la cache de decisiones del PDP | BAJO | 0 | SECURITY_ADMIN |
| 22 | POST | `/authz/permission-categories` | Definir una categoría de permiso | MEDIO | 2 | SECURITY_ADMIN |
| 23 | GET | `/authz/permissions` | Catálogo de permisos, paginado por código | BAJO | 1 | SECURITY_ADMIN |
| 24 | POST | `/authz/permissions` | Definir un permiso del catálogo global | MEDIO | 3 | SECURITY_ADMIN |
| 25 | GET | `/authz/permissions/{permissionId}/holders` | Quiénes tienen un permiso, con el camino por el que lo tienen | BAJO | 7 | SECURITY_ADMIN |
| 26 | GET | `/authz/resource-scope-grants` | — | BAJO | 1 | SECURITY_ADMIN |
| 27 | POST | `/authz/resource-scope-grants` | Otorgar acceso a un recurso específico (grant polimórfico) | MEDIO | 3 | SECURITY_ADMIN |
| 28 | DELETE | `/authz/resource-scope-grants/{grantId}` | — | MEDIO | 2 | SECURITY_ADMIN |
| 29 | GET | `/authz/roles` | Listar los roles asignables | BAJO | 1 | SECURITY_ADMIN |
| 30 | POST | `/authz/roles` | Componer un rol (con herencia opcional) | MEDIO | 2 | SECURITY_ADMIN |
| 31 | GET | `/authz/roles/{roleId}/field-permissions` | — | BAJO | 2 | SECURITY_ADMIN |
| 32 | PUT | `/authz/roles/{roleId}/field-permissions` | Configurar el enmascaramiento de campos del rol | MEDIO | 4 | SECURITY_ADMIN |
| 33 | GET | `/authz/roles/{roleId}/permissions` | Permisos activos de un rol, con su efecto y ámbito | BAJO | 3 | SECURITY_ADMIN |
| 34 | PUT | `/authz/roles/{roleId}/permissions` | Asignar permisos al rol (reemplaza los activos) | MEDIO | 4 | SECURITY_ADMIN |
| 35 | POST | `/authz/simulations` | Simular una decisión de acceso con el PDP real | BAJO | 12 | SECURITY_ADMIN |
| 36 | POST | `/authz/tenants/{tenantId}/access-policies` | Definir una política de acceso ABAC con enmascaramiento | MEDIO | 2 | SECURITY_ADMIN |
| 37 | GET | `/authz/users/{userId}/access-map` | «Quién puede qué» de un usuario: roles, conteos y última revisión | BAJO | 8 | SECURITY_ADMIN |
| 38 | POST | `/authz/users/{userId}/access-reviews` | Registrar que revisaste los accesos de una cuenta | MEDIO | 4 | SECURITY_ADMIN |
| 39 | GET | `/authz/users/{userId}/permission-grants` | Excepciones de permiso por usuario, paginadas | BAJO | 3 | SECURITY_ADMIN |
| 40 | POST | `/authz/users/{userId}/permission-grants` | Otorgar una excepción de permiso por usuario | MEDIO | 3 | SECURITY_ADMIN |
| 41 | GET | `/authz/users/{userId}/resource-scope-grants` | Grants sobre un recurso concreto cuyo sujeto es el usuario, paginados | BAJO | 3 | SECURITY_ADMIN |
| 42 | GET | `/authz/users/{userId}/restricted-fields` | Campos restringidos que alcanzan al usuario por sus roles efectivos | BAJO | 4 | SECURITY_ADMIN |
| 43 | GET | `/authz/users/{userId}/role-assignments` | Asignaciones de rol de un usuario, activas o no | BAJO | 3 | SECURITY_ADMIN |
| 44 | POST | `/authz/users/{userId}/role-assignments` | Asignar un rol a un usuario con vigencia y ámbito | MEDIO | 3 | SECURITY_ADMIN |
| 45 | DELETE | `/authz/users/{userId}/role-assignments/{assignmentId}` | Revocar una asignación de rol (revocación lógica: la fila queda como historia) | MEDIO | 2 | SECURITY_ADMIN |

---

## 1. GET /authz/access-reviews

- **Origen:** CONTRATO
- **Nombre:** Historia de revisiones de accesos, paginada
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.reviews` — `src/modules/authz/controllers/authz-governance.controller.ts:193`

### Qué es y para qué sirve (negocio)

Historia de revisiones de accesos, paginada. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/access-reviews` la atiende `AuthzGovernanceController.reviews` (src/modules/authz/controllers/authz-governance.controller.ts:193). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.reviews`. Lee audit.audit_log, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:193` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | AuthzGovernanceController.reviews → AuthzGovernanceService.reviews → AuthzGovernanceReadRepository.reviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:446` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.reviews → AuthzGovernanceService.reviews → AuthzGovernanceReadRepository.reviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:446` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `userId` | query | No | `string` | Cuenta revisada |
| `reviewerId` | query | No | `string` | Quien revisó |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AccessReviewsPageDto>` · DTO `AccessReviewsPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AccessReviewDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:116` |
| `items[].id` | `string` | Sí | formato uuid | — | Id del sello en la bitácora | `src/modules/authz/dto/authz-governance.dto.ts:103` |
| `items[].userId` | `string` | Sí | formato uuid | — | Cuenta revisada | `src/modules/authz/dto/authz-governance.dto.ts:105` |
| `items[].userDisplayName` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:107` |
| `items[].reviewerUserId` | `string` | Sí | formato uuid | — | Quien revisó | `src/modules/authz/dto/authz-governance.dto.ts:109` |
| `items[].reviewerDisplayName` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:111` |
| `items[].reviewedAt` | `string` | Sí | formato date-time | — | — | `src/modules/authz/dto/authz-governance.dto.ts:112` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:117` |
| `limit` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:119` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /authz/access-reviews/due

- **Origen:** CONTRATO
- **Nombre:** Cuentas con acceso administrativo sin revisión reciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.dueReviews` — `src/modules/authz/controllers/authz-governance.controller.ts:183`

### Qué es y para qué sirve (negocio)

Cuentas con acceso administrativo sin revisión reciente. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/access-reviews/due` la atiende `AuthzGovernanceController.dueReviews` (src/modules/authz/controllers/authz-governance.controller.ts:183). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.dueReviews`. Lee audit.audit_log, authz.user_role_assignments, iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:183` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | AuthzGovernanceController.dueReviews → AuthzGovernanceService.dueReviews → AuthzGovernanceReadRepository.dueReviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:495` |
| `authz.user_role_assignments` | LEE | LEE | POR_SQL | AuthzGovernanceController.dueReviews → AuthzGovernanceService.dueReviews → AuthzGovernanceReadRepository.dueReviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:495` |
| `iam.user_global_roles` | LEE | LEE | POR_SQL | AuthzGovernanceController.dueReviews → AuthzGovernanceService.dueReviews → AuthzGovernanceReadRepository.dueReviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:495` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.dueReviews → AuthzGovernanceService.dueReviews → AuthzGovernanceReadRepository.dueReviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:495` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `olderThanDays` | query | No | `number` | Cuentas cuya última revisión es anterior a estos días, o que nunca fueron revisadas |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DueReviewsPageDto>` · DTO `DueReviewsPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<DueReviewDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:138` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:123` |
| `items[].displayName` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:124` |
| `items[].accountStatus` | `string` | Sí | valores: ACTIVE, LOCKED, ANONYMIZED, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:125` |
| `items[].lastReviewedAt` | `string` | No | formato date-time; admite null | — | `null`: sin revisión dentro del horizonte de búsqueda | `src/modules/authz/dto/authz-governance.dto.ts:132` |
| `items[].lastReviewerUserId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:134` |
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:139` |
| `limit` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:141` |
| `olderThanDays` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:142` |
| `lookbackDays` | `number` | Sí | — | — | Días hacia atrás en que se buscan revisiones: más allá, una cuenta cuenta como no revisada | `src/modules/authz/dto/authz-governance.dto.ts:147` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /authz/care-relationships

- **Origen:** CONTRATO
- **Nombre:** Listar relaciones asistenciales de un paciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.listCareRelationships` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:106`

### Qué es y para qué sirve (negocio)

Listar relaciones asistenciales de un paciente. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/care-relationships` la atiende `AuthzCareRelationshipsController.listCareRelationships` (src/modules/authz/controllers/authz-care-relationships.controller.ts:106). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Delega en `AuthzCareRelationshipsService.listCareRelationshipsByPatient`. Lee authz.care_relationships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/authz/controllers/authz-care-relationships.controller.ts:106` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.listCareRelationships → AuthzCareRelationshipsService.listCareRelationshipsByPatient → CareRelationshipsRepository.findByPatient | `src/modules/authz/repositories/care-relationships.repository.ts:215` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | query | Sí | `string` | — |
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CareRelationshipView[]>` · DTO `CareRelationshipView`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:9` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/authz/dto/care-relationship-responses.dto.ts:15` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/authz/dto/care-relationship-responses.dto.ts:21` |
| `relationshipTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de relación | `src/modules/authz/dto/care-relationship-responses.dto.ts:30` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/authz/dto/care-relationship-responses.dto.ts:36` |
| `purposeConceptId` | `string` | No | formato uuid | — | Concept id del propósito acotado | `src/modules/authz/dto/care-relationship-responses.dto.ts:45` |
| `validFrom` | `string` | Sí | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:51` |
| `validTo` | `string` | No | formato date-time | — | Valor de valid to mantenido por la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:57` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /authz/care-relationships

- **Origen:** CONTRATO
- **Nombre:** Establecer una relación asistencial
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.establishCareRelationship` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:60`

### Qué es y para qué sirve (negocio)

Establecer una relación asistencial. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/care-relationships` la atiende `AuthzCareRelationshipsController.establishCareRelationship` (src/modules/authz/controllers/authz-care-relationships.controller.ts:60). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Valida el cuerpo como `CreateCareRelationshipDto` (7 campos, 4 obligatorios). Delega en `AuthzCareRelationshipsService.establishCareRelationship`. Crea filas en authz.care_relationships. Lee authz.care_relationships, clinical.patient_admission_footprints, directory.tenant_memberships, profiles.patient_profiles, profiles.person_account_links, scheduling.appointment_bookings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/authz/controllers/authz-care-relationships.controller.ts:60` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.establishCareRelationship → AuthzCareRelationshipsService.establishCareRelationship → CareRelationshipsRepository.create | `src/modules/authz/repositories/care-relationships.repository.ts:233` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishCareRelationship → AuthzCareRelationshipsService.establishCareRelationship → CareRelationshipsRepository.findActiveInTenant | `src/modules/authz/repositories/care-relationships.repository.ts:86` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | AuthzCareRelationshipsController.establishCareRelationship → AuthzCareRelationshipsService.establishCareRelationship → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishCareRelationship → AuthzCareRelationshipsService.establishCareRelationship → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishCareRelationship → AuthzCareRelationshipsService.establishCareRelationship → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishCareRelationship → AuthzCareRelationshipsService.establishCareRelationship → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishCareRelationship → AuthzCareRelationshipsService.establishCareRelationship → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:98` |

### Cuerpo — DTO `CreateCareRelationshipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant de la relación | `src/modules/authz/dto/create-care-relationship.dto.ts:36` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del paciente | `src/modules/authz/dto/create-care-relationship.dto.ts:43` |
| `practitionerProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del practicante | `src/modules/authz/dto/create-care-relationship.dto.ts:50` |
| `relationshipType` | `string` | Sí | valores: TREATING, CONSULTING, EMERGENCY | `@IsIn(CARE_RELATIONSHIP_TYPES)` | Tipo de relación | `src/modules/authz/dto/create-care-relationship.dto.ts:60` |
| `purposeOfUse` | `string` | No | valores: TREATMENT, PAYMENT, OPERATIONS, EMERGENCY | `@IsOptional()` `@IsIn(CARE_RELATIONSHIP_PURPOSES)` | Propósito de uso que acota la relación | `src/modules/authz/dto/create-care-relationship.dto.ts:71` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Inicio de vigencia (por defecto ahora) | `src/modules/authz/dto/create-care-relationship.dto.ts:84` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Fin de vigencia (abierto si se omite) | `src/modules/authz/dto/create-care-relationship.dto.ts:97` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "TREATING"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "TREATING",
  "purposeOfUse": "TREATMENT",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una relación asistencial activa para ese practicante |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: validTo debe ser posterior a validFrom |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/authz-clinical-scope.int-spec.ts:177` |
| INTEGRACION | `test/integration/clinical-prescriptions-pdf.int-spec.ts:131` |
| INTEGRACION | `test/integration/diagnostics-release.int-spec.ts:280` |
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:122` |
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:124` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /authz/care-relationships/{id}/respond

- **Origen:** CONTRATO
- **Nombre:** Responder (aceptar/rechazar) una solicitud de relación asistencial
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.respondToCareRelationshipRequest` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:175`

### Qué es y para qué sirve (negocio)

Responder (aceptar/rechazar) una solicitud de relación asistencial. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/care-relationships/{id}/respond` la atiende `AuthzCareRelationshipsController.respondToCareRelationshipRequest` (src/modules/authz/controllers/authz-care-relationships.controller.ts:175). Exige sesión con alguno de los roles PATIENT. Valida el cuerpo como `RespondCareRelationshipDto` (2 campos, 1 obligatorio). Delega en `AuthzCareRelationshipsService.respondToCareRelationshipRequest`. Crea filas en audit.audit_log, messaging.domain_events, messaging.outbox_messages. Actualiza authz.care_relationships. Lee audit.audit_log, authz.care_relationships, iam.sessions, messaging.outbox_messages. Publica authz.care_relationship.responded.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/authz/controllers/authz-care-relationships.controller.ts:175` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/authz/controllers/authz-care-relationships.controller.ts:175` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.care_relationships` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest | `src/modules/authz/services/authz-care-relationships.service.ts:248` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest → CareRelationshipsRepository.findById | `src/modules/authz/repositories/care-relationships.repository.ts:59` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.respondToCareRelationshipRequest → AuthzCareRelationshipsService.respondToCareRelationshipRequest → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `authz.care_relationship.responded` | `src/modules/authz/services/authz-care-relationships.service.ts:275` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RespondCareRelationshipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: ACCEPT, REJECT | `@IsIn(CARE_RELATIONSHIP_DECISIONS)` | Decisión sobre la solicitud | `src/modules/authz/dto/respond-care-relationship.dto.ts:30` |
| `authorizedSpecialtyConceptIds` | `array<string>` | No | formato uuid; máximo 50 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(50)` `@IsUUID('all', { each: true })` | Concept ids de especialidad/área que el paciente autoriza (solo con ACCEPT) | `src/modules/authz/dto/respond-care-relationship.dto.ts:45` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "ACCEPT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "ACCEPT",
  "authorizedSpecialtyConceptIds": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<AuthzStatusResultDto>` · DTO `AuthzStatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/authz/dto/authz-responses.dto.ts:33` |
| `affected` | `number` | No | — | — | Nº de filas afectadas cuando aplica | `src/modules/authz/dto/authz-responses.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo el paciente titular puede responder esta solicitud; PreconditionFailedException: La solicitud ya fue respondida o ya no está pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:102` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:159` |
| INTEGRACION | `test/integration/p39-nota-medica-filas.int-spec.ts:136` |
| CONTROLADOR | `src/modules/authz/controllers/authz-care-relationships.controller.spec.ts:43` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /authz/care-relationships/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar o expirar una relación asistencial
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.revokeCareRelationship` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:83`

### Qué es y para qué sirve (negocio)

Revocar o expirar una relación asistencial. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/care-relationships/{id}/revoke` la atiende `AuthzCareRelationshipsController.revokeCareRelationship` (src/modules/authz/controllers/authz-care-relationships.controller.ts:83). Exige sesión con alguno de los roles CLINICIAN, SECURITY_ADMIN. Delega en `AuthzCareRelationshipsService.revokeCareRelationship`. Lee authz.care_relationships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, SECURITY_ADMIN | `src/modules/authz/controllers/authz-care-relationships.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/authz/controllers/authz-care-relationships.controller.ts:83` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.revokeCareRelationship → AuthzCareRelationshipsService.revokeCareRelationship → CareRelationshipsRepository.findById | `src/modules/authz/repositories/care-relationships.repository.ts:59` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AuthzStatusResultDto>` · DTO `AuthzStatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/authz/dto/authz-responses.dto.ts:33` |
| `affected` | `number` | No | — | — | Nº de filas afectadas cuando aplica | `src/modules/authz/dto/authz-responses.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La relación asistencial no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /authz/care-relationships/request

- **Origen:** CONTRATO
- **Nombre:** Solicitar autorización del paciente para una relación asistencial
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.requestCareRelationship` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:146`

### Qué es y para qué sirve (negocio)

Solicitar autorización del paciente para una relación asistencial. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/care-relationships/request` la atiende `AuthzCareRelationshipsController.requestCareRelationship` (src/modules/authz/controllers/authz-care-relationships.controller.ts:146). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RequestCareRelationshipDto` (4 campos, 2 obligatorios). Delega en `AuthzCareRelationshipsService.requestCareRelationship`. Crea filas en audit.audit_log, authz.care_relationships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza iam.devices. Lee audit.audit_log, authz.care_relationships, iam.devices, iam.sessions, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/authz/controllers/authz-care-relationships.controller.ts:146` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.care_relationships` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → CareRelationshipsRepository.create | `src/modules/authz/repositories/care-relationships.repository.ts:233` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → CareRelationshipsRepository.findActiveInTenant | `src/modules/authz/repositories/care-relationships.repository.ts:86` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzClinicalScopeService.assertPatientExists → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.requestCareRelationship → AuthzCareRelationshipsService.requestCareRelationship → AuthzCareRelationshipsService.notifyRequest → AuthzCareRelationshipsService.resolvePatientUserId → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |

### Cuerpo — DTO `RequestCareRelationshipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant de la solicitud | `src/modules/authz/dto/request-care-relationship.dto.ts:22` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del paciente | `src/modules/authz/dto/request-care-relationship.dto.ts:27` |
| `relationshipType` | `string` | No | valores: TREATING, CONSULTING, EMERGENCY | `@IsOptional()` `@IsIn(CARE_RELATIONSHIP_TYPES)` | Tipo de relación solicitada | `src/modules/authz/dto/request-care-relationship.dto.ts:36` |
| `reasonText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Motivo de la solicitud | `src/modules/authz/dto/request-care-relationship.dto.ts:43` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "relationshipType": "TREATING",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El proveedor configurado para el canal in-app no existe |
| 409 | `CONFLICT` | ConflictException: Ya existe una relación asistencial activa con ese paciente; ConflictException: Ya hay una solicitud pendiente de respuesta para ese paciente |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Sólo un practicante con perfil propio puede solicitar acceso a un expediente; PreconditionFailedException: No hay canal in-app activo: falta correr el seed de mensajería; PreconditionFailedException: El canal in-app no tiene configuración de proveedor activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/br14-encuentros-seguridad-clinica.int-spec.ts:92` |
| INTEGRACION | `test/integration/clinical-c14-c23-notas-e-internacion.int-spec.ts:148` |
| INTEGRACION | `test/integration/p39-nota-medica-filas.int-spec.ts:126` |
| CONTROLADOR | `src/modules/authz/controllers/authz-care-relationships.controller.spec.ts:22` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /authz/care-relationships/requests/mine

- **Origen:** CONTRATO
- **Nombre:** Mis solicitudes de relación asistencial pendientes de decidir
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.listMyPendingCareRelationshipRequests` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:127`

### Qué es y para qué sirve (negocio)

Mis solicitudes de relación asistencial pendientes de decidir. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/care-relationships/requests/mine` la atiende `AuthzCareRelationshipsController.listMyPendingCareRelationshipRequests` (src/modules/authz/controllers/authz-care-relationships.controller.ts:127). Exige sesión con alguno de los roles PATIENT. Delega en `AuthzCareRelationshipsService.listMyPendingCareRelationshipRequests`. Lee authz.care_relationships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/authz/controllers/authz-care-relationships.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.listMyPendingCareRelationshipRequests → AuthzCareRelationshipsService.listMyPendingCareRelationshipRequests → CareRelationshipsRepository.findPendingByPatient | `src/modules/authz/repositories/care-relationships.repository.ts:202` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CareRelationshipView[]>` · DTO `CareRelationshipView`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:9` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/authz/dto/care-relationship-responses.dto.ts:15` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/authz/dto/care-relationship-responses.dto.ts:21` |
| `relationshipTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de relación | `src/modules/authz/dto/care-relationship-responses.dto.ts:30` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/authz/dto/care-relationship-responses.dto.ts:36` |
| `purposeConceptId` | `string` | No | formato uuid | — | Concept id del propósito acotado | `src/modules/authz/dto/care-relationship-responses.dto.ts:45` |
| `validFrom` | `string` | Sí | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:51` |
| `validTo` | `string` | No | formato date-time | — | Valor de valid to mantenido por la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:57` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-care-relationships.controller.spec.ts:67` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /authz/catalog/modules

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzModulesCatalogController.modules` — `src/modules/authz/controllers/authz-modules-catalog.controller.ts:28`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/catalog/modules` la atiende `AuthzModulesCatalogController.modules` (src/modules/authz/controllers/authz-modules-catalog.controller.ts:28). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzModulesCatalogService.catalog`. Lee authz.permissions, authz.role_permissions, authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-modules-catalog.controller.ts:28` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | DIRECTA | AuthzModulesCatalogController.modules → AuthzModulesCatalogService.catalog | `src/modules/authz/services/authz-modules-catalog.service.ts:138` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | AuthzModulesCatalogController.modules → AuthzModulesCatalogService.catalog | `src/modules/authz/services/authz-modules-catalog.service.ts:162` |
| `authz.roles` | LEE | LEE | DIRECTA | AuthzModulesCatalogController.modules → AuthzModulesCatalogService.catalog | `src/modules/authz/services/authz-modules-catalog.service.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `ModulesCatalogQueryDto` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ModulesCatalogDto>` · DTO `ModulesCatalogDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `generatedAt` | `string` | Sí | formato date-time | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:204` |
| `canonicalActions` | `array<string>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:205` |
| `notes` | `array<string>` | Sí | — | — | Lo que esta lectura NO prueba: léase antes de interpretar los números | `src/modules/authz/dto/authz-modules-catalog.dto.ts:211` |
| `truncated` | `boolean` | Sí | — | — | Si el catálogo, los roles o los vínculos superaron el tope de lectura. Con `true`, no editar roles desde estos datos. | `src/modules/authz/dto/authz-modules-catalog.dto.ts:216` |
| `availableModules` | `array<string>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:217` |
| `summary` | `ModulesCatalogSummaryDto` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:219` |
| `summary.modules` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:194` |
| `summary.permissions` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:195` |
| `summary.routes` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:196` |
| `summary.roleOnlyRoutes` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:197` |
| `summary.undeclaredAuthRoutes` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:198` |
| `summary.gaps` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:199` |
| `summary.modulesWithoutFinePermissions` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:200` |
| `roles` | `array<ModuleRoleRefDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:220` |
| `roles[].id` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:185` |
| `roles[].code` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:186` |
| `roles[].name` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:187` |
| `roles[].isSystem` | `boolean` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:188` |
| `roles[].tenantId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:190` |
| `modules` | `array<ModuleEntryDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:221` |
| `modules[].key` | `string` | Sí | — | — | Clave del módulo (snake_case) | `src/modules/authz/dto/authz-modules-catalog.dto.ts:173` |
| `modules[].routes` | `ModuleRouteStatsDto` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:174` |
| `modules[].routes.total` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:59` |
| `modules[].routes.publicRoutes` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:60` |
| `modules[].routes.roleOnly` | `number` | Sí | — | — | Autorizadas por `@Roles(...)` y nada más | `src/modules/authz/dto/authz-modules-catalog.dto.ts:62` |
| `modules[].routes.guardOnly` | `number` | Sí | — | — | Sin `@Roles`, con un `@UseGuards` de dominio | `src/modules/authz/dto/authz-modules-catalog.dto.ts:64` |
| `modules[].routes.selfService` | `number` | Sí | — | — | Rutas `/me/...`: operan sobre el titular | `src/modules/authz/dto/authz-modules-catalog.dto.ts:66` |
| `modules[].routes.undeclaredAuth` | `number` | Sí | — | — | Sin `@Roles`, sin `@Public` y sin guard: la autorización no está declarada en el controlador (puede resolverse en el servicio por pertenencia o propiedad) | `src/modules/authz/dto/authz-modules-catalog.dto.ts:71` |
| `modules[].routes.mutating` | `number` | Sí | — | — | Rutas que cambian estado | `src/modules/authz/dto/authz-modules-catalog.dto.ts:72` |
| `modules[].routes.mutatingRoleOnly` | `number` | Sí | — | — | Rutas que cambian estado y sólo tienen `@Roles` | `src/modules/authz/dto/authz-modules-catalog.dto.ts:76` |
| `modules[].permissionCount` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:175` |
| `modules[].grantCount` | `number` | Sí | — | — | Vínculos rol→permiso activos del módulo | `src/modules/authz/dto/authz-modules-catalog.dto.ts:177` |
| `modules[].roleCodesInCode` | `array<string>` | Sí | — | — | Roles que el código exige | `src/modules/authz/dto/authz-modules-catalog.dto.ts:179` |
| `modules[].resources` | `array<ModuleResourceDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:180` |
| `modules[].resources[].resource` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:144` |
| `modules[].resources[].permissions` | `array<ModulePermissionDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:146` |
| `modules[].resources[].permissions[].id` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:101` |
| `modules[].resources[].permissions[].code` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:102` |
| `modules[].resources[].permissions[].name` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:103` |
| `modules[].resources[].permissions[].resource` | `string` | Sí | — | — | Recurso tal como está en el catálogo | `src/modules/authz/dto/authz-modules-catalog.dto.ts:105` |
| `modules[].resources[].permissions[].legacyAction` | `string` | No | admite null | — | Acción sembrada (READ, WRITE…), tal como está en el catálogo | `src/modules/authz/dto/authz-modules-catalog.dto.ts:110` |
| `modules[].resources[].permissions[].action` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:111` |
| `modules[].resources[].permissions[].canonicalCode` | `boolean` | Sí | — | — | El código ya tiene la forma `<modulo>.<recurso>.<accion>` | `src/modules/authz/dto/authz-modules-catalog.dto.ts:115` |
| `modules[].resources[].permissions[].isDangerous` | `boolean` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:116` |
| `modules[].resources[].permissions[].isActive` | `boolean` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:117` |
| `modules[].resources[].permissions[].grants` | `array<ModuleGrantDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:118` |
| `modules[].resources[].permissions[].grants[].roleId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:80` |
| `modules[].resources[].permissions[].grants[].roleCode` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:81` |
| `modules[].resources[].permissions[].grants[].roleName` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:82` |
| `modules[].resources[].permissions[].grants[].effect` | `string` | Sí | valores: ALLOW, DENY | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:83` |
| `modules[].resources[].permissions[].grants[].scope` | `string` | No | admite null | — | SELF \| BRANCH \| TENANT \| GLOBAL; nulo si no tiene ámbito | `src/modules/authz/dto/authz-modules-catalog.dto.ts:88` |
| `modules[].resources[].permissions[].grants[].constraintJson` | `object` | No | admite null | — | Restricción ABAC del vínculo. Viaja para que quien reemplaza los permisos del rol pueda conservarla. | `src/modules/authz/dto/authz-modules-catalog.dto.ts:95` |
| `modules[].resources[].permissions[].grants[].fieldValueSetId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:97` |
| `modules[].resources[].cells` | `array<ModuleCellDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:147` |
| `modules[].resources[].cells[].action` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:122` |
| `modules[].resources[].cells[].proposedCode` | `string` | No | admite null | — | Código sugerido, derivado de las rutas reales. No está sembrado. | `src/modules/authz/dto/authz-modules-catalog.dto.ts:128` |
| `modules[].resources[].cells[].coverage` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof CELL_COVERAGES)[number] | `src/modules/authz/dto/authz-modules-catalog.dto.ts:129` |
| `modules[].resources[].cells[].permissionIds` | `array<string>` | Sí | — | — | Permisos finos de esta celda | `src/modules/authz/dto/authz-modules-catalog.dto.ts:131` |
| `modules[].resources[].cells[].routeCount` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:132` |
| `modules[].resources[].cells[].mutatingRouteCount` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:133` |
| `modules[].resources[].cells[].undeclaredRouteCount` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:134` |
| `modules[].resources[].cells[].publicRouteCount` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:135` |
| `modules[].resources[].cells[].routeRoles` | `array<string>` | Sí | — | — | Códigos de rol que las rutas de la celda exigen con `@Roles` | `src/modules/authz/dto/authz-modules-catalog.dto.ts:140` |
| `modules[].gaps` | `array<ModuleGapDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:181` |
| `modules[].gaps[].kind` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof GAP_KINDS)[number] | `src/modules/authz/dto/authz-modules-catalog.dto.ts:159` |
| `modules[].gaps[].severity` | `object` | Sí | — | — | Tipo TypeScript no expandido: (typeof GAP_SEVERITIES)[number] | `src/modules/authz/dto/authz-modules-catalog.dto.ts:160` |
| `modules[].gaps[].module` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:161` |
| `modules[].gaps[].resource` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:162` |
| `modules[].gaps[].action` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:164` |
| `modules[].gaps[].proposedCode` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:165` |
| `modules[].gaps[].routeCount` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:166` |
| `modules[].gaps[].sampleRoutes` | `array<ModuleGapRouteDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:168` |
| `modules[].gaps[].sampleRoutes[].method` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:151` |
| `modules[].gaps[].sampleRoutes[].template` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:152` |
| `modules[].gaps[].sampleRoutes[].controller` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:153` |
| `modules[].gaps[].sampleRoutes[].handler` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:154` |
| `modules[].gaps[].sampleRoutes[].roles` | `array<string>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:155` |
| `modules[].gaps[].roles` | `array<string>` | Sí | — | — | — | `src/modules/authz/dto/authz-modules-catalog.dto.ts:169` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzModulesCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. DELETE /authz/clinical-access-grants/{grantId}

- **Origen:** CONTRATO
- **Nombre:** Revocar o expirar una concesión de acceso clínico
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzClinicalController.revokeClinicalAccess` — `src/modules/authz/controllers/authz-clinical.controller.ts:78`

### Qué es y para qué sirve (negocio)

Revocar o expirar una concesión de acceso clínico. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DELETE /authz/clinical-access-grants/{grantId}` la atiende `AuthzClinicalController.revokeClinicalAccess` (src/modules/authz/controllers/authz-clinical.controller.ts:78). Exige sesión con alguno de los roles CLINICAL_APPROVER, SECURITY_ADMIN. Delega en `AuthzClinicalService.revokeClinicalAccess`. Crea filas en audit.audit_log. Lee audit.audit_log, authz.clinical_access_grants, iam.sessions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICAL_APPROVER, SECURITY_ADMIN | `src/modules/authz/controllers/authz-clinical.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: grantId | `src/modules/authz/controllers/authz-clinical.controller.ts:78` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.revokeClinicalAccess → AuthzClinicalService.revokeClinicalAccess → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuthzClinicalController.revokeClinicalAccess → AuthzClinicalService.revokeClinicalAccess → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | AuthzClinicalController.revokeClinicalAccess → AuthzClinicalService.revokeClinicalAccess → ClinicalAccessGrantsRepository.findById | `src/modules/authz/repositories/clinical-access-grants.repository.ts:68` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuthzClinicalController.revokeClinicalAccess → AuthzClinicalService.revokeClinicalAccess → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `grantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AuthzStatusResultDto>` · DTO `AuthzStatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/authz/dto/authz-responses.dto.ts:33` |
| `affected` | `number` | No | — | — | Nº de filas afectadas cuando aplica | `src/modules/authz/dto/authz-responses.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El acceso clínico no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-clinical.controller.spec.ts:59` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzClinicalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /authz/decisions/evaluate

- **Origen:** CONTRATO
- **Nombre:** Recalcular la decisión de autorización efectiva (PDP)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzPdpController.evaluate` — `src/modules/authz/controllers/authz-pdp.controller.ts:53`

### Qué es y para qué sirve (negocio)

Recalcular la decisión de autorización efectiva (PDP). Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/decisions/evaluate` la atiende `AuthzPdpController.evaluate` (src/modules/authz/controllers/authz-pdp.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `EvaluateDecisionDto` (9 campos, 4 obligatorios). Delega en `AuthzPdpService.evaluate`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-pdp.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | AuthzPdpController.evaluate → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |

### Cuerpo — DTO `EvaluateDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario sujeto de la decisión | `src/modules/authz/dto/evaluate-decision.dto.ts:44` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant de la evaluación | `src/modules/authz/dto/evaluate-decision.dto.ts:51` |
| `action` | `string` | Sí | valores: READ, WRITE, CREATE, DELETE, EXECUTE, APPROVE | `@IsIn(PERMISSION_ACTIONS)` | Acción evaluada | `src/modules/authz/dto/evaluate-decision.dto.ts:58` |
| `resource` | `string` | Sí | longitud mínima 1; longitud máxima 150 | `@IsString()` `@MinLength(1)` `@MaxLength(150)` | Recurso protegido (debe casar con permissions.resource) | `src/modules/authz/dto/evaluate-decision.dto.ts:70` |
| `resourceType` | `string` | No | valores: PATIENT, ENCOUNTER, DOCUMENT, RECORD | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso concreto | `src/modules/authz/dto/evaluate-decision.dto.ts:81` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso concreto | `src/modules/authz/dto/evaluate-decision.dto.ts:92` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil de paciente si el recurso es clínico | `src/modules/authz/dto/evaluate-decision.dto.ts:103` |
| `practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil de practicante del actor (habilita evaluación de relación asistencial C-06) | `src/modules/authz/dto/evaluate-decision.dto.ts:115` |
| `purposeOfUse` | `string` | No | valores: TREATMENT, PAYMENT, OPERATIONS, EMERGENCY | `@IsOptional()` `@IsIn(DECISION_PURPOSES)` | Propósito de uso | `src/modules/authz/dto/evaluate-decision.dto.ts:126` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "action": "READ",
  "resource": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "action": "READ",
  "resource": "valor-ejemplo",
  "resourceType": "PATIENT",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "TREATMENT"
}
```

</details>

### Respuesta — `Promise<DecisionResponseDto>` · DTO `DecisionResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: PERMIT, DENY | — | Decisión: PERMIT o DENY | `src/modules/authz/dto/authz-responses.dto.ts:163` |
| `reason` | `string` | Sí | — | — | Motivo legible de la decisión | `src/modules/authz/dto/authz-responses.dto.ts:169` |
| `effectiveRoleIds` | `array<string>` | Sí | — | — | Ids de roles efectivos considerados | `src/modules/authz/dto/authz-responses.dto.ts:178` |
| `maskedFields` | `array<MaskedFieldDto>` | Sí | — | — | Campos a enmascarar en la respuesta | `src/modules/authz/dto/authz-responses.dto.ts:187` |
| `maskedFields[].entity` | `string` | Sí | — | — | Valor de entity mantenido por la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:140` |
| `maskedFields[].columnName` | `string` | Sí | — | — | Valor de column name mantenido por la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:146` |
| `maskedFields[].strategy` | `string` | Sí | — | — | Estrategia (REDACT/HASH/PARTIAL/NULLIFY) o NO_READ | `src/modules/authz/dto/authz-responses.dto.ts:154` |
| `purposeOfUse` | `string` | No | — | — | Propósito de uso registrado | `src/modules/authz/dto/authz-responses.dto.ts:193` |
| `cacheKey` | `string` | Sí | — | — | Clave de cache de la decisión (idempotente) | `src/modules/authz/dto/authz-responses.dto.ts:199` |
| `ttlSeconds` | `number` | Sí | — | — | TTL sugerido en segundos para la entrada de cache | `src/modules/authz/dto/authz-responses.dto.ts:207` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-pdp.controller.spec.ts:43` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzPdpController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /authz/internal-users

- **Origen:** CONTRATO
- **Nombre:** Usuarios internos con sus roles
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzAdminController.internalUsers` — `src/modules/authz/controllers/authz-admin.controller.ts:108`

### Qué es y para qué sirve (negocio)

Usuarios internos con sus roles. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/internal-users` la atiende `AuthzAdminController.internalUsers` (src/modules/authz/controllers/authz-admin.controller.ts:108). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzAdminReadService.internalUsers`. Lee authz.roles, authz.user_role_assignments, iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-admin.controller.ts:108` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | POR_SQL | AuthzAdminController.internalUsers → AuthzAdminReadService.internalUsers → AuthzAdminReadRepository.internalUsers | `src/modules/authz/repositories/authz-admin-read.repository.ts:184` |
| `authz.user_role_assignments` | LEE | LEE | POR_SQL | AuthzAdminController.internalUsers → AuthzAdminReadService.internalUsers → AuthzAdminReadRepository.internalUsers | `src/modules/authz/repositories/authz-admin-read.repository.ts:184` |
| `iam.user_global_roles` | LEE | LEE | POR_SQL | AuthzAdminController.internalUsers → AuthzAdminReadService.internalUsers → AuthzAdminReadRepository.internalUsers | `src/modules/authz/repositories/authz-admin-read.repository.ts:190` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzAdminController.internalUsers → AuthzAdminReadService.internalUsers → AuthzAdminReadRepository.internalUsers | `src/modules/authz/repositories/authz-admin-read.repository.ts:214` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `q` | query | No | `string` | Texto a buscar en el nombre visible |
| `roleCode` | query | No | `string` | Sólo quienes tienen este rol activo, en cualquier ámbito. Sin él, la lista son los usuarios con un rol de ámbito global o un rol global de plataforma |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: El cursor de paginación no es válido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzAdminController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. GET /authz/legal-representations

- **Origen:** CONTRATO
- **Nombre:** Listar representaciones legales de un paciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.listLegalRepresentations` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:250`

### Qué es y para qué sirve (negocio)

Listar representaciones legales de un paciente. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/legal-representations` la atiende `AuthzCareRelationshipsController.listLegalRepresentations` (src/modules/authz/controllers/authz-care-relationships.controller.ts:250). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzCareRelationshipsService.listLegalRepresentationsByPatient`. Lee authz.patient_legal_representations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-care-relationships.controller.ts:250` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_QUERY | tenantId (obligatorio) | `contrato (parameters)` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.listLegalRepresentations → AuthzCareRelationshipsService.listLegalRepresentationsByPatient → PatientLegalRepresentationsRepository.findByPatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:109` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | query | Sí | `string` | — |
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<LegalRepresentationView[]>` · DTO `LegalRepresentationView`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:66` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/authz/dto/care-relationship-responses.dto.ts:72` |
| `representativeUserId` | `string` | Sí | formato uuid | — | Identificador asociado a representative user. | `src/modules/authz/dto/care-relationship-responses.dto.ts:78` |
| `representationTypeConceptId` | `string` | Sí | formato uuid | — | Concept id del tipo de representación | `src/modules/authz/dto/care-relationship-responses.dto.ts:87` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/authz/dto/care-relationship-responses.dto.ts:93` |
| `documentRef` | `string` | No | — | — | Referencia documental | `src/modules/authz/dto/care-relationship-responses.dto.ts:99` |
| `validFrom` | `string` | Sí | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:105` |
| `validTo` | `string` | No | formato date-time | — | Valor de valid to mantenido por la instancia. | `src/modules/authz/dto/care-relationship-responses.dto.ts:111` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Están los parámetros de consulta obligatorios |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /authz/legal-representations

- **Origen:** CONTRATO
- **Nombre:** Registrar una representación legal del paciente
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.establishLegalRepresentation` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:204`

### Qué es y para qué sirve (negocio)

Registrar una representación legal del paciente. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/legal-representations` la atiende `AuthzCareRelationshipsController.establishLegalRepresentation` (src/modules/authz/controllers/authz-care-relationships.controller.ts:204). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateLegalRepresentationDto` (7 campos, 4 obligatorios). Delega en `AuthzCareRelationshipsService.establishLegalRepresentation`. Crea filas en authz.patient_legal_representations. Lee authz.patient_legal_representations, clinical.patient_admission_footprints, directory.tenant_memberships, profiles.patient_profiles, profiles.person_account_links, scheduling.appointment_bookings.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-care-relationships.controller.ts:204` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.patient_legal_representations` | ESCRIBE | CREA | DIRECTA | AuthzCareRelationshipsController.establishLegalRepresentation → AuthzCareRelationshipsService.establishLegalRepresentation → PatientLegalRepresentationsRepository.create | `src/modules/authz/repositories/patient-legal-representations.repository.ts:127` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishLegalRepresentation → AuthzCareRelationshipsService.establishLegalRepresentation → PatientLegalRepresentationsRepository.findActiveInTenant | `src/modules/authz/repositories/patient-legal-representations.repository.ts:82` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | AuthzCareRelationshipsController.establishLegalRepresentation → AuthzCareRelationshipsService.establishLegalRepresentation → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishLegalRepresentation → AuthzCareRelationshipsService.establishLegalRepresentation → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishLegalRepresentation → AuthzCareRelationshipsService.establishLegalRepresentation → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishLegalRepresentation → AuthzCareRelationshipsService.establishLegalRepresentation → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.establishLegalRepresentation → AuthzCareRelationshipsService.establishLegalRepresentation → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:98` |

### Cuerpo — DTO `CreateLegalRepresentationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant de la representación | `src/modules/authz/dto/create-legal-representation.dto.ts:32` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil del paciente representado | `src/modules/authz/dto/create-legal-representation.dto.ts:42` |
| `representativeUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario que representa al paciente | `src/modules/authz/dto/create-legal-representation.dto.ts:52` |
| `representationType` | `string` | Sí | valores: LEGAL_GUARDIAN, PARENT, ATTORNEY, CURATOR | `@IsIn(LEGAL_REPRESENTATION_TYPES)` | Tipo de representación | `src/modules/authz/dto/create-legal-representation.dto.ts:62` |
| `documentRef` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia documental que sustenta la representación | `src/modules/authz/dto/create-legal-representation.dto.ts:74` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Inicio de vigencia (por defecto ahora) | `src/modules/authz/dto/create-legal-representation.dto.ts:87` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Fin de vigencia (abierto si se omite) | `src/modules/authz/dto/create-legal-representation.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "representativeUserId": "00000000-0000-4000-8000-000000000001",
  "representationType": "LEGAL_GUARDIAN"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "representativeUserId": "00000000-0000-4000-8000-000000000001",
  "representationType": "LEGAL_GUARDIAN",
  "documentRef": "valor-ejemplo",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una representación legal activa para ese usuario |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: validTo debe ser posterior a validFrom |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/authz-clinical-scope.int-spec.ts:187` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /authz/legal-representations/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar o expirar una representación legal
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCareRelationshipsController.revokeLegalRepresentation` — `src/modules/authz/controllers/authz-care-relationships.controller.ts:227`

### Qué es y para qué sirve (negocio)

Revocar o expirar una representación legal. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/legal-representations/{id}/revoke` la atiende `AuthzCareRelationshipsController.revokeLegalRepresentation` (src/modules/authz/controllers/authz-care-relationships.controller.ts:227). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzCareRelationshipsService.revokeLegalRepresentation`. Lee authz.patient_legal_representations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-care-relationships.controller.ts:227` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/authz/controllers/authz-care-relationships.controller.ts:227` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | AuthzCareRelationshipsController.revokeLegalRepresentation → AuthzCareRelationshipsService.revokeLegalRepresentation → PatientLegalRepresentationsRepository.findById | `src/modules/authz/repositories/patient-legal-representations.repository.ts:56` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AuthzStatusResultDto>` · DTO `AuthzStatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/authz/dto/authz-responses.dto.ts:33` |
| `affected` | `number` | No | — | — | Nº de filas afectadas cuando aplica | `src/modules/authz/dto/authz-responses.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La representación legal no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCareRelationshipsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. GET /authz/me/access

- **Origen:** CONTRATO
- **Nombre:** Quién ve mi historia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzMeController.listMyAccess` — `src/modules/authz/controllers/authz-me.controller.ts:37`

### Qué es y para qué sirve (negocio)

Quién ve mi historia. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/me/access` la atiende `AuthzMeController.listMyAccess` (src/modules/authz/controllers/authz-me.controller.ts:37). Exige sesión con alguno de los roles PATIENT. Delega en `AuthzMeService.listMyAccess`. Lee authz.care_relationships, authz.clinical_access_grants, profiles.patient_profiles, profiles.person_account_links, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/authz/controllers/authz-me.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzMeController.listMyAccess → AuthzMeService.listMyAccess → CareRelationshipsRepository.findAllByPatient | `src/modules/authz/repositories/care-relationships.repository.ts:191` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | AuthzMeController.listMyAccess → AuthzMeService.listMyAccess → ClinicalAccessGrantsRepository.findAllByPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:117` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzMeController.listMyAccess → AuthzMeService.listMyAccess → AuthzMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzMeController.listMyAccess → AuthzMeService.listMyAccess → AuthzMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | AuthzMeController.listMyAccess → AuthzMeService.listMyAccess → AuthzMeService.namesByPersonId | `src/modules/authz/services/authz-me.service.ts:239` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<MyClinicalAccessResponseDto>` · DTO `MyClinicalAccessResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `careRelationships` | `array<MyCareRelationshipDto>` | Sí | — | — | Relaciones asistenciales del titular (sin las solicitudes pendientes). | `src/modules/authz/dto/authz-me.dto.ts:126` |
| `careRelationships[].id` | `string` | Sí | formato uuid | — | Identificador (el que se pasa a `revoke`). | `src/modules/authz/dto/authz-me.dto.ts:12` |
| `careRelationships[].tenantId` | `string` | Sí | formato uuid | — | Organización en la que se estableció. | `src/modules/authz/dto/authz-me.dto.ts:18` |
| `careRelationships[].practitionerProfileId` | `string` | Sí | formato uuid | — | Perfil del profesional. | `src/modules/authz/dto/authz-me.dto.ts:24` |
| `careRelationships[].practitionerName` | `string` | No | — | — | Nombre del profesional, para mostrarlo. | `src/modules/authz/dto/authz-me.dto.ts:30` |
| `careRelationships[].state` | `string` | Sí | valores: ACTIVE, REVOKED, EXPIRED, OTHER | — | Estado legible; `ACTIVE` con la vigencia vencida figura como `EXPIRED`. | `src/modules/authz/dto/authz-me.dto.ts:36` |
| `careRelationships[].validFrom` | `string` | Sí | formato date-time | — | Desde cuándo. | `src/modules/authz/dto/authz-me.dto.ts:42` |
| `careRelationships[].validTo` | `string` | No | formato date-time | — | Hasta cuándo, si tiene fin. | `src/modules/authz/dto/authz-me.dto.ts:48` |
| `careRelationships[].purposeConceptId` | `string` | No | formato uuid | — | Propósito acotado (concept id). | `src/modules/authz/dto/authz-me.dto.ts:54` |
| `grants` | `array<MyClinicalAccessGrantDto>` | Sí | — | — | Accesos clínicos concedidos sobre su historia. | `src/modules/authz/dto/authz-me.dto.ts:132` |
| `grants[].id` | `string` | Sí | formato uuid | — | Identificador (el que se pasa a `revoke`). | `src/modules/authz/dto/authz-me.dto.ts:63` |
| `grants[].tenantId` | `string` | Sí | formato uuid | — | Organización del acceso. | `src/modules/authz/dto/authz-me.dto.ts:69` |
| `grants[].grantedUserId` | `string` | Sí | formato uuid | — | Usuario que recibió el acceso. | `src/modules/authz/dto/authz-me.dto.ts:75` |
| `grants[].grantedName` | `string` | No | — | — | Nombre de quien recibió el acceso, para mostrarlo. | `src/modules/authz/dto/authz-me.dto.ts:81` |
| `grants[].isEmergency` | `boolean` | Sí | — | — | `true` si es un acceso de emergencia (break-the-glass). | `src/modules/authz/dto/authz-me.dto.ts:87` |
| `grants[].state` | `string` | Sí | valores: ACTIVE, REVOKED, EXPIRED, OTHER | — | Estado legible; vencido por vigencia figura como `EXPIRED`. | `src/modules/authz/dto/authz-me.dto.ts:93` |
| `grants[].validFrom` | `string` | Sí | formato date-time | — | Desde cuándo. | `src/modules/authz/dto/authz-me.dto.ts:99` |
| `grants[].validTo` | `string` | Sí | formato date-time | — | Hasta cuándo. | `src/modules/authz/dto/authz-me.dto.ts:105` |
| `grants[].reasonConceptId` | `string` | Sí | formato uuid | — | Motivo del acceso (concept id). | `src/modules/authz/dto/authz-me.dto.ts:111` |
| `grants[].accessLevelConceptId` | `string` | Sí | formato uuid | — | Nivel de acceso (concept id). | `src/modules/authz/dto/authz-me.dto.ts:117` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:140` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /authz/me/care-relationships/{id}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar una de mis relaciones asistenciales
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzMeController.revokeCareRelationship` — `src/modules/authz/controllers/authz-me.controller.ts:46`

### Qué es y para qué sirve (negocio)

Revocar una de mis relaciones asistenciales. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/me/care-relationships/{id}/revoke` la atiende `AuthzMeController.revokeCareRelationship` (src/modules/authz/controllers/authz-me.controller.ts:46). Exige sesión con alguno de los roles PATIENT. Delega en `AuthzMeService.revokeMyCareRelationship`. Lee authz.care_relationships, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/authz/controllers/authz-me.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/authz/controllers/authz-me.controller.ts:46` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzMeController.revokeCareRelationship → AuthzMeService.revokeMyCareRelationship → CareRelationshipsRepository.findById | `src/modules/authz/repositories/care-relationships.repository.ts:59` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzMeController.revokeCareRelationship → AuthzMeService.revokeMyCareRelationship → AuthzMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzMeController.revokeCareRelationship → AuthzMeService.revokeMyCareRelationship → AuthzMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AuthzStatusResultDto>` · DTO `AuthzStatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/authz/dto/authz-responses.dto.ts:33` |
| `affected` | `number` | No | — | — | Nº de filas afectadas cuando aplica | `src/modules/authz/dto/authz-responses.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Relación asistencial no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La solicitud sigue pendiente: respóndala en lugar de revocarla; PreconditionFailedException: La relación asistencial no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. POST /authz/me/clinical-access-grants/{grantId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Revocar uno de los accesos clínicos a mi historia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzMeController.revokeClinicalGrant` — `src/modules/authz/controllers/authz-me.controller.ts:62`

### Qué es y para qué sirve (negocio)

Revocar uno de los accesos clínicos a mi historia. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/me/clinical-access-grants/{grantId}/revoke` la atiende `AuthzMeController.revokeClinicalGrant` (src/modules/authz/controllers/authz-me.controller.ts:62). Exige sesión con alguno de los roles PATIENT. Delega en `AuthzMeService.revokeMyClinicalGrant`. Crea filas en audit.audit_log. Lee audit.audit_log, authz.clinical_access_grants, iam.sessions, profiles.patient_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: PATIENT | `src/modules/authz/controllers/authz-me.controller.ts:62` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: grantId | `src/modules/authz/controllers/authz-me.controller.ts:62` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuthzMeController.revokeClinicalGrant → AuthzMeService.revokeMyClinicalGrant → AuthzClinicalService.revokeClinicalAccess → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuthzMeController.revokeClinicalGrant → AuthzMeService.revokeMyClinicalGrant → AuthzClinicalService.revokeClinicalAccess → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | AuthzMeController.revokeClinicalGrant → AuthzMeService.revokeMyClinicalGrant → ClinicalAccessGrantsRepository.findById | `src/modules/authz/repositories/clinical-access-grants.repository.ts:68` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuthzMeController.revokeClinicalGrant → AuthzMeService.revokeMyClinicalGrant → AuthzClinicalService.revokeClinicalAccess → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzMeController.revokeClinicalGrant → AuthzMeService.revokeMyClinicalGrant → AuthzMeService.ownPatientProfileId → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzMeController.revokeClinicalGrant → AuthzMeService.revokeMyClinicalGrant → AuthzMeService.ownPatientProfileId → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `grantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AuthzStatusResultDto>` · DTO `AuthzStatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/authz/dto/authz-responses.dto.ts:33` |
| `affected` | `number` | No | — | — | Nº de filas afectadas cuando aplica | `src/modules/authz/dto/authz-responses.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Acceso clínico no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El acceso clínico no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:148` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzMeController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. POST /authz/patients/{patientProfileId}/break-the-glass

- **Origen:** CONTRATO
- **Nombre:** Break-the-glass / anulación de emergencia
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzClinicalController.breakTheGlass` — `src/modules/authz/controllers/authz-clinical.controller.ts:61`

### Qué es y para qué sirve (negocio)

Break-the-glass / anulación de emergencia. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/patients/{patientProfileId}/break-the-glass` la atiende `AuthzClinicalController.breakTheGlass` (src/modules/authz/controllers/authz-clinical.controller.ts:61). Exige sesión con alguno de los roles CLINICAL_APPROVER, SECURITY_ADMIN. Valida el cuerpo como `BreakTheGlassDto` (4 campos, 2 obligatorios). Delega en `AuthzClinicalService.breakTheGlass`. Crea filas en audit.audit_log, audit.data_access_log, authz.break_glass_sessions, authz.clinical_access_grants, messaging.domain_events, messaging.outbox_messages. Lee audit.audit_log, clinical.encounters, clinical.patient_admission_footprints, directory.tenant_memberships, iam.sessions, messaging.outbox_messages, profiles.patient_profiles, profiles.person_account_links y 1 más. Publica authz.break_glass.activated.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICAL_APPROVER, SECURITY_ADMIN | `src/modules/authz/controllers/authz-clinical.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/authz/controllers/authz-clinical.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `audit.data_access_log` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → DataAccessLogRepository.record | `src/modules/audit/repositories/data-access-log.repository.ts:98` |
| `authz.break_glass_sessions` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → BreakGlassSessionsRepository.create | `src/modules/authz/repositories/break-glass-sessions.repository.ts:64` |
| `authz.clinical_access_grants` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → ClinicalAccessGrantsRepository.create | `src/modules/authz/repositories/clinical-access-grants.repository.ts:167` |
| `clinical.encounters` | LEE | LEE | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuthzClinicalScopeService.assertEncounterOfPatient → AuthzClinicalScopeRepository.encounterScope | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:188` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `messaging.domain_events` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createDomainEvent | `src/modules/messaging/repositories/outbox.repository.ts:117` |
| `messaging.outbox_messages` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.createOutboxMessage | `src/modules/messaging/repositories/outbox.repository.ts:169` |
| `messaging.outbox_messages` | LEE | LEE | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → OutboxService.publishDomainEvent → OutboxService.persistDomainEvent → OutboxRepository.findOutboxByIdempotencyKey | `src/modules/messaging/repositories/outbox.repository.ts:193` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | AuthzClinicalController.breakTheGlass → AuthzClinicalService.breakTheGlass → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:98` |

### Eventos y trabajos

| Tipo | Nombre | Fuente |
|---|---|---|
| Evento de dominio | `authz.break_glass.activated` | `src/modules/authz/services/authz-clinical.service.ts:268` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo — DTO `BreakTheGlassDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant del acceso de emergencia | `src/modules/authz/dto/break-the-glass.dto.ts:23` |
| `justification` | `string` | Sí | longitud mínima 10; longitud máxima 1000 | `@IsString()` `@MinLength(10)` `@MaxLength(1000)` | Justificación textual obligatoria | `src/modules/authz/dto/break-the-glass.dto.ts:35` |
| `windowMinutes` | `number` | No | mínimo 5; máximo 240 | `@IsOptional()` `@IsInt()` `@Min(5)` `@Max(240)` | Ventana de acceso en minutos (corta; por defecto 60, máx 240) | `src/modules/authz/dto/break-the-glass.dto.ts:50` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/authz/dto/break-the-glass.dto.ts:61` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "justification": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "justification": "valor-ejemplo",
  "windowMinutes": 5,
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/authz-clinical-scope.int-spec.ts:121` |
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:172` |
| CONTROLADOR | `src/modules/authz/controllers/authz-clinical.controller.spec.ts:49` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzClinicalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /authz/patients/{patientProfileId}/clinical-access-grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar acceso clínico con propósito de uso
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzClinicalController.grantClinicalAccess` — `src/modules/authz/controllers/authz-clinical.controller.ts:40`

### Qué es y para qué sirve (negocio)

Otorgar acceso clínico con propósito de uso. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/patients/{patientProfileId}/clinical-access-grants` la atiende `AuthzClinicalController.grantClinicalAccess` (src/modules/authz/controllers/authz-clinical.controller.ts:40). Exige sesión con alguno de los roles CLINICAL_APPROVER, SECURITY_ADMIN. Valida el cuerpo como `CreateClinicalAccessGrantDto` (9 campos, 5 obligatorios). Delega en `AuthzClinicalService.grantClinicalAccess`. Crea filas en audit.audit_log, authz.clinical_access_grants. Lee audit.audit_log, authz.clinical_access_grants, clinical.encounters, clinical.patient_admission_footprints, consent.consents, directory.tenant_memberships, iam.sessions, profiles.patient_profiles y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICAL_APPROVER, SECURITY_ADMIN | `src/modules/authz/controllers/authz-clinical.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: patientProfileId | `src/modules/authz/controllers/authz-clinical.controller.ts:40` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `authz.clinical_access_grants` | ESCRIBE | CREA | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → ClinicalAccessGrantsRepository.create | `src/modules/authz/repositories/clinical-access-grants.repository.ts:167` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → ClinicalAccessGrantsRepository.findActiveInTenant | `src/modules/authz/repositories/clinical-access-grants.repository.ts:91` |
| `clinical.encounters` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuthzClinicalScopeService.assertEncounterOfPatient → AuthzClinicalScopeRepository.encounterScope | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:188` |
| `clinical.patient_admission_footprints (vista u objeto no catalogado)` | LEE | LEE | POR_SQL | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant → AuthzClinicalScopeRepository.hasAdmissionFootprint | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:124` |
| `consent.consents` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuthzClinicalScopeService.assertConsentOfPatient → AuthzClinicalScopeRepository.consentScope | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:208` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:106` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientExists | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:40` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:92` |
| `scheduling.appointment_bookings` | LEE | LEE | DIRECTA | AuthzClinicalController.grantClinicalAccess → AuthzClinicalService.grantClinicalAccess → AuthzClinicalScopeService.assertPatientInTenant → AuthzClinicalScopeService.isPatientInTenant → AuthzClinicalScopeRepository.patientHasFootprintInTenant | `src/modules/authz/repositories/authz-clinical-scope.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateClinicalAccessGrantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `grantedUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario que recibe el acceso | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:26` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant del acceso | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:33` |
| `purposeOfUse` | `string` | Sí | valores: TREATMENT, PAYMENT, OPERATIONS | `@IsIn(PURPOSES_OF_USE)` | Propósito de uso | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:40` |
| `accessLevel` | `string` | Sí | valores: READ, WRITE, FULL | `@IsIn(ACCESS_LEVELS)` | Nivel de acceso | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:47` |
| `validTo` | `string` | Sí | formato date-time | `@Type(() => Date)` `@IsDate()` | Fin de vigencia | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:59` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede/branch | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:67` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro clínico asociado | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:78` |
| `consentId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Consentimiento que respalda el acceso (obligatorio salvo tratamiento directo) | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:90` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Inicio de vigencia (por defecto ahora) | `src/modules/authz/dto/create-clinical-access-grant.dto.ts:103` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "grantedUserId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "TREATMENT",
  "accessLevel": "READ",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "grantedUserId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "TREATMENT",
  "accessLevel": "READ",
  "validTo": "2026-07-31T12:00:00.000Z",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "consentId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un acceso clínico activo para ese usuario |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: validTo debe ser posterior a validFrom; PreconditionFailedException: Se requiere consentimiento salvo para tratamiento directo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | DomainException: {HttpStatus.FORBIDDEN} |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/authz-clinical-scope.int-spec.ts:105` |
| INTEGRACION | `test/integration/patient-access-revocation.int-spec.ts:128` |
| CONTROLADOR | `src/modules/authz/controllers/authz-clinical.controller.spec.ts:38` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzClinicalController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /authz/pdp/cache/invalidate

- **Origen:** CONTRATO
- **Nombre:** Invalidar la cache de decisiones del PDP
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzPdpController.invalidateCache` — `src/modules/authz/controllers/authz-pdp.controller.ts:36`

### Qué es y para qué sirve (negocio)

Invalidar la cache de decisiones del PDP. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/pdp/cache/invalidate` la atiende `AuthzPdpController.invalidateCache` (src/modules/authz/controllers/authz-pdp.controller.ts:36). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AuthzInvalidateCacheDto` (3 campos, 0 obligatorios). Delega en `AuthzPdpService.invalidateCache`. No toca tablas relacionales: No escribe ni encola nada: calcula una clave de caché, escribe un log y responde `ok: true`. El comentario del método dice que un consumidor de outbox hace la invalidación, pero el método no publica ningún evento (ver HZ-19)..

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-pdp.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

No toca tablas relacionales: No escribe ni encola nada: calcula una clave de caché, escribe un log y responde `ok: true`. El comentario del método dice que un consumidor de outbox hace la invalidación, pero el método no publica ningún evento (ver HZ-19).. _(manual, 2026-10-21; fuente: `src/modules/authz/services/authz-pdp.service.ts:128`)_

### Cuerpo — DTO `AuthzInvalidateCacheDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant afectado | `src/modules/authz/dto/invalidate-cache.dto.ts:18` |
| `userId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Usuario cuya decisión se invalida | `src/modules/authz/dto/invalidate-cache.dto.ts:29` |
| `roleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol cuya decisión se invalida | `src/modules/authz/dto/invalidate-cache.dto.ts:40` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "userId": "00000000-0000-4000-8000-000000000001",
  "roleId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `CacheInvalidationResultDto` · DTO `CacheInvalidationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si se procesó la invalidación | `src/modules/authz/dto/authz-responses.dto.ts:119` |
| `cacheKey` | `string` | Sí | — | — | Clave lógica de cache invalidada | `src/modules/authz/dto/authz-responses.dto.ts:125` |
| `invalidatedEntries` | `number` | Sí | — | — | Nº de entradas de decisión invalidadas | `src/modules/authz/dto/authz-responses.dto.ts:131` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-pdp.controller.spec.ts:29` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzPdpController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. POST /authz/permission-categories

- **Origen:** CONTRATO
- **Nombre:** Definir una categoría de permiso
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCatalogController.createCategory` — `src/modules/authz/controllers/authz-catalog.controller.ts:29`

### Qué es y para qué sirve (negocio)

Definir una categoría de permiso. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/permission-categories` la atiende `AuthzCatalogController.createCategory` (src/modules/authz/controllers/authz-catalog.controller.ts:29). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePermissionCategoryDto` (4 campos, 2 obligatorios). Delega en `AuthzCatalogService.createCategory`. Crea filas en authz.permission_categories. Lee authz.permission_categories.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-catalog.controller.ts:29` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permission_categories` | ESCRIBE | CREA | DIRECTA | AuthzCatalogController.createCategory → AuthzCatalogService.createCategory → PermissionCategoriesRepository.create | `src/modules/authz/repositories/permission-categories.repository.ts:66` |
| `authz.permission_categories` | LEE | LEE | DIRECTA | AuthzCatalogController.createCategory → AuthzCatalogService.createCategory → PermissionCategoriesRepository.findByCode | `src/modules/authz/repositories/permission-categories.repository.ts:44` |

### Cuerpo — DTO `CreatePermissionCategoryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de la categoría | `src/modules/authz/dto/create-permission-category.dto.ts:20` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible | `src/modules/authz/dto/create-permission-category.dto.ts:29` |
| `description` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Descripción | `src/modules/authz/dto/create-permission-category.dto.ts:38` |
| `ordinal` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Orden de presentación | `src/modules/authz/dto/create-permission-category.dto.ts:47` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "ordinal": 1
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una categoría con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-catalog.controller.spec.ts:33` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. GET /authz/permissions

- **Origen:** CONTRATO
- **Nombre:** Catálogo de permisos, paginado por código
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzAdminController.permissions` — `src/modules/authz/controllers/authz-admin.controller.ts:89`

### Qué es y para qué sirve (negocio)

Catálogo de permisos, paginado por código. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/permissions` la atiende `AuthzAdminController.permissions` (src/modules/authz/controllers/authz-admin.controller.ts:89). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzAdminReadService.permissions`. Lee authz.permissions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-admin.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | POR_SQL | AuthzAdminController.permissions → AuthzAdminReadService.permissions → AuthzAdminReadRepository.permissions | `src/modules/authz/repositories/authz-admin-read.repository.ts:146` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `q` | query | No | `string` | Texto a buscar en el código, el nombre y el recurso |
| `categoryId` | query | No | `string` | Categoría de permiso |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | BadRequestException: El cursor de paginación no es válido |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzAdminController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /authz/permissions

- **Origen:** CONTRATO
- **Nombre:** Definir un permiso del catálogo global
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzCatalogController.createPermission` — `src/modules/authz/controllers/authz-catalog.controller.ts:46`

### Qué es y para qué sirve (negocio)

Definir un permiso del catálogo global. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/permissions` la atiende `AuthzCatalogController.createPermission` (src/modules/authz/controllers/authz-catalog.controller.ts:46). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePermissionDto` (11 campos, 4 obligatorios). Delega en `AuthzCatalogService.createPermission`. Crea filas en authz.permissions. Lee authz.permission_categories, authz.permissions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-catalog.controller.ts:46` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permission_categories` | LEE | LEE | DIRECTA | AuthzCatalogController.createPermission → AuthzCatalogService.createPermission → PermissionCategoriesRepository.findById | `src/modules/authz/repositories/permission-categories.repository.ts:58` |
| `authz.permissions` | ESCRIBE | CREA | DIRECTA | AuthzCatalogController.createPermission → AuthzCatalogService.createPermission → PermissionsRepository.create | `src/modules/authz/repositories/permissions.repository.ts:94` |
| `authz.permissions` | LEE | LEE | DIRECTA | AuthzCatalogController.createPermission → AuthzCatalogService.createPermission → PermissionsRepository.findByCode | `src/modules/authz/repositories/permissions.repository.ts:69` |

### Cuerpo — DTO `CreatePermissionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 150 | `@IsString()` `@MinLength(1)` `@MaxLength(150)` | Código único del permiso | `src/modules/authz/dto/create-permission.dto.ts:47` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible | `src/modules/authz/dto/create-permission.dto.ts:56` |
| `resource` | `string` | Sí | longitud mínima 1; longitud máxima 150 | `@IsString()` `@MinLength(1)` `@MaxLength(150)` | Recurso protegido (p. ej. patient, encounter) | `src/modules/authz/dto/create-permission.dto.ts:68` |
| `action` | `string` | Sí | valores: READ, WRITE, CREATE, DELETE, EXECUTE, APPROVE | `@IsIn(PERMISSION_ACTIONS)` | Acción | `src/modules/authz/dto/create-permission.dto.ts:75` |
| `categoryId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id de la categoría | `src/modules/authz/dto/create-permission.dto.ts:83` |
| `defaultScope` | `string` | No | valores: SELF, BRANCH, TENANT, GLOBAL | `@IsOptional()` `@IsIn(PERMISSION_SCOPES)` | Ámbito por defecto | `src/modules/authz/dto/create-permission.dto.ts:94` |
| `isFieldLevel` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permiso a nivel de campo | `src/modules/authz/dto/create-permission.dto.ts:102` |
| `isDangerous` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permiso peligroso (exige aprobación de segundo admin) | `src/modules/authz/dto/create-permission.dto.ts:112` |
| `isRoleRestricted` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Restringido a un rol concreto | `src/modules/authz/dto/create-permission.dto.ts:120` |
| `requiredRoleCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código de rol requerido si es restringido | `src/modules/authz/dto/create-permission.dto.ts:132` |
| `allowDirectUserGrant` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Permite concesión directa a usuario | `src/modules/authz/dto/create-permission.dto.ts:140` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "resource": "valor-ejemplo",
  "action": "READ"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "resource": "valor-ejemplo",
  "action": "READ",
  "categoryId": "00000000-0000-4000-8000-000000000001",
  "defaultScope": "SELF",
  "isFieldLevel": true,
  "isDangerous": true,
  "isRoleRestricted": true,
  "requiredRoleCode": "CODIGO_EJEMPLO",
  "allowDirectUserGrant": true
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un permiso con ese código; ConflictException: La categoría referenciada no existe |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-catalog.controller.spec.ts:41` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzCatalogController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. GET /authz/permissions/{permissionId}/holders

- **Origen:** CONTRATO
- **Nombre:** Quiénes tienen un permiso, con el camino por el que lo tienen
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.holders` — `src/modules/authz/controllers/authz-governance.controller.ts:143`

### Qué es y para qué sirve (negocio)

Quiénes tienen un permiso, con el camino por el que lo tienen. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/permissions/{permissionId}/holders` la atiende `AuthzGovernanceController.holders` (src/modules/authz/controllers/authz-governance.controller.ts:143). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.holdersOf`. Lee authz.permissions, authz.resource_scope_grants, authz.role_permissions, authz.roles, authz.user_permission_grants, authz.user_role_assignments, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:143` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | POR_SQL | AuthzGovernanceController.holders → AuthzGovernanceService.holdersOf → AuthzGovernanceReadRepository.permissionExists | `src/modules/authz/repositories/authz-governance-read.repository.ts:149` |
| `authz.resource_scope_grants` | LEE | LEE | POR_SQL | AuthzGovernanceController.holders → AuthzGovernanceService.holdersOf → AuthzGovernanceReadRepository.holders | `src/modules/authz/repositories/authz-governance-read.repository.ts:351` |
| `authz.role_permissions` | LEE | LEE | POR_SQL | AuthzGovernanceController.holders → AuthzGovernanceService.holdersOf → AuthzGovernanceReadRepository.holders | `src/modules/authz/repositories/authz-governance-read.repository.ts:351` |
| `authz.roles` | LEE | LEE | POR_SQL | AuthzGovernanceController.holders → AuthzGovernanceService.holdersOf → AuthzGovernanceReadRepository.holders | `src/modules/authz/repositories/authz-governance-read.repository.ts:351` |
| `authz.user_permission_grants` | LEE | LEE | POR_SQL | AuthzGovernanceController.holders → AuthzGovernanceService.holdersOf → AuthzGovernanceReadRepository.holders | `src/modules/authz/repositories/authz-governance-read.repository.ts:351` |
| `authz.user_role_assignments` | LEE | LEE | POR_SQL | AuthzGovernanceController.holders → AuthzGovernanceService.holdersOf → AuthzGovernanceReadRepository.holders | `src/modules/authz/repositories/authz-governance-read.repository.ts:351` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.holders → AuthzGovernanceService.holdersOf → AuthzGovernanceReadRepository.holders | `src/modules/authz/repositories/authz-governance-read.repository.ts:351` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `permissionId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `source` | query | No | `string` | Sólo quienes lo tienen por ese camino |
| `q` | query | No | `string` | Texto a buscar en el nombre visible |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PermissionHoldersPageDto>` · DTO `PermissionHoldersPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:254` |
| `limit` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:256` |
| `permissionId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:298` |
| `items` | `array<PermissionHolderDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:299` |
| `items[].userId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:291` |
| `items[].displayName` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:292` |
| `items[].accountStatus` | `string` | Sí | valores: ACTIVE, LOCKED, ANONYMIZED, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:293` |
| `items[].sources` | `array<HolderSourceDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:294` |
| `items[].sources[].source` | `string` | Sí | valores: ROLE, USER, RESOURCE | — | — | `src/modules/authz/dto/authz-governance.dto.ts:269` |
| `items[].sources[].effect` | `string` | Sí | valores: ALLOW, DENY, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:270` |
| `items[].sources[].roleCode` | `string` | No | admite null | — | `ROLE`: rol que tiene asignado | `src/modules/authz/dto/authz-governance.dto.ts:276` |
| `items[].sources[].viaRoleCode` | `string` | No | admite null | — | `ROLE`: rol que define el permiso (distinto del asignado si lo hereda de un rol padre) | `src/modules/authz/dto/authz-governance.dto.ts:283` |
| `items[].sources[].resourceId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:285` |
| `items[].sources[].tenantId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:287` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Permiso no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. GET /authz/resource-scope-grants

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceExtController.scopeGrants` — `src/modules/authz/controllers/authz-governance-ext.controller.ts:72`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/resource-scope-grants` la atiende `AuthzGovernanceExtController.scopeGrants` (src/modules/authz/controllers/authz-governance-ext.controller.ts:72). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceExtService.resourceScopeGrants`. Lee authz.resource_scope_grants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance-ext.controller.ts:72` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | AuthzGovernanceExtController.scopeGrants → AuthzGovernanceExtService.resourceScopeGrants | `src/modules/authz/services/authz-governance-ext.service.ts:140` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | query | sin dato | `ResourceScopeGrantsQueryDto` | — |

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

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceExtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. POST /authz/resource-scope-grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar acceso a un recurso específico (grant polimórfico)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGrantsController.grantResourceScope` — `src/modules/authz/controllers/authz-grants.controller.ts:76`

### Qué es y para qué sirve (negocio)

Otorgar acceso a un recurso específico (grant polimórfico). Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/resource-scope-grants` la atiende `AuthzGrantsController.grantResourceScope` (src/modules/authz/controllers/authz-grants.controller.ts:76). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateResourceScopeGrantDto` (9 campos, 6 obligatorios). Delega en `AuthzGrantsService.grantResourceScope`. Crea filas en authz.resource_scope_grants. Lee authz.permissions, authz.resource_scope_grants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-grants.controller.ts:76` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | DIRECTA | AuthzGrantsController.grantResourceScope → AuthzGrantsService.grantResourceScope → PermissionsRepository.findById | `src/modules/authz/repositories/permissions.repository.ts:80` |
| `authz.resource_scope_grants` | ESCRIBE | CREA | DIRECTA | AuthzGrantsController.grantResourceScope → AuthzGrantsService.grantResourceScope → ResourceScopeGrantsRepository.create | `src/modules/authz/repositories/resource-scope-grants.repository.ts:132` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | AuthzGrantsController.grantResourceScope → AuthzGrantsService.grantResourceScope → ResourceScopeGrantsRepository.findExisting | `src/modules/authz/repositories/resource-scope-grants.repository.ts:60` |

### Cuerpo — DTO `CreateResourceScopeGrantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `subjectType` | `string` | Sí | valores: USER, ROLE, SERVICE | `@IsIn(SUBJECT_TYPES)` | Tipo de sujeto | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:32` |
| `subjectId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del sujeto (validado contra su value set) | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:42` |
| `permissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso concedido/denegado | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:49` |
| `resourceType` | `string` | Sí | valores: PATIENT, ENCOUNTER, DOCUMENT, RECORD | `@IsIn(RESOURCE_TYPES)` | Tipo de recurso | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:56` |
| `resourceId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del recurso concreto | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:63` |
| `effect` | `string` | Sí | valores: ALLOW, DENY | `@IsIn(EFFECTS)` | Efecto | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:70` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant del grant | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:78` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Inicio de vigencia | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:91` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Fin de vigencia | `src/modules/authz/dto/create-resource-scope-grant.dto.ts:104` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "subjectType": "USER",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PATIENT",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "subjectType": "USER",
  "subjectId": "00000000-0000-4000-8000-000000000001",
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "resourceType": "PATIENT",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Permiso no encontrado |
| 409 | `CONFLICT` | ConflictException: Ya existe un grant para ese (sujeto, permiso, recurso) |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-grants.controller.spec.ts:57` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGrantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. DELETE /authz/resource-scope-grants/{grantId}

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceExtController.endScopeGrant` — `src/modules/authz/controllers/authz-governance-ext.controller.ts:83`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DELETE /authz/resource-scope-grants/{grantId}` la atiende `AuthzGovernanceExtController.endScopeGrant` (src/modules/authz/controllers/authz-governance-ext.controller.ts:83). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `EndResourceScopeGrantDto` (1 campo, 0 obligatorios). Delega en `AuthzGovernanceExtService.endResourceScopeGrant`. Actualiza authz.resource_scope_grants. Lee authz.resource_scope_grants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance-ext.controller.ts:83` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.resource_scope_grants` | ESCRIBE | ACTUALIZA | DIRECTA | AuthzGovernanceExtController.endScopeGrant → AuthzGovernanceExtService.endResourceScopeGrant | `src/modules/authz/services/authz-governance-ext.service.ts:189` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | AuthzGovernanceExtController.endScopeGrant → AuthzGovernanceExtService.endResourceScopeGrant | `src/modules/authz/services/authz-governance-ext.service.ts:166` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `—` | path | Sí | `ResourceScopeGrantIdParamDto` | — |

### Cuerpo — DTO `EndResourceScopeGrantDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud mínima GOVERNANCE_REASON_MIN; longitud máxima GOVERNANCE_REASON_MAX | `@IsOptional()` `@IsString()` `@MinLength(GOVERNANCE_REASON_MIN)` `@MaxLength(GOVERNANCE_REASON_MAX)` | Por qué se termina. Obligatorio si el permiso es de efecto DENY; opcional en un ALLOW. | `src/modules/authz/dto/authz-governance-ext.dto.ts:118` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {NOT_FOUND.message} |
| 409 | `CONFLICT` | ConflictException: El permiso por alcance ya terminó su vigencia |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Terminar un permiso de efecto DENY exige un motivo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceExtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. GET /authz/roles

- **Origen:** CONTRATO
- **Nombre:** Listar los roles asignables
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzRolesController.listAssignable` — `src/modules/authz/controllers/authz-roles.controller.ts:50`

### Qué es y para qué sirve (negocio)

Listar los roles asignables. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/roles` la atiende `AuthzRolesController.listAssignable` (src/modules/authz/controllers/authz-roles.controller.ts:50). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzRolesService.listAssignable`. Lee authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-roles.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | AuthzRolesController.listAssignable → AuthzRolesService.listAssignable → RolesRepository.listAssignable | `src/modules/authz/repositories/roles.repository.ts:87` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AssignableRoleDto[]>` · DTO `AssignableRoleDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:54` |
| `code` | `string` | Sí | — | — | Código que exige `@Roles(...)` | `src/modules/authz/dto/authz-responses.dto.ts:60` |
| `name` | `string` | Sí | — | — | Nombre legible | `src/modules/authz/dto/authz-responses.dto.ts:66` |
| `isSystem` | `boolean` | Sí | — | — | Rol de sistema (no ligado a un tenant) | `src/modules/authz/dto/authz-responses.dto.ts:72` |
| `tenantId` | `string` | No | formato uuid | — | Tenant propietario | `src/modules/authz/dto/authz-responses.dto.ts:78` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzRolesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. POST /authz/roles

- **Origen:** CONTRATO
- **Nombre:** Componer un rol (con herencia opcional)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzRolesController.createRole` — `src/modules/authz/controllers/authz-roles.controller.ts:58`

### Qué es y para qué sirve (negocio)

Componer un rol (con herencia opcional). Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/roles` la atiende `AuthzRolesController.createRole` (src/modules/authz/controllers/authz-roles.controller.ts:58). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateRoleDto` (9 campos, 2 obligatorios). Delega en `AuthzRolesService.createRole`. Crea filas en authz.roles. Lee authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-roles.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | ESCRIBE | CREA | DIRECTA | AuthzRolesController.createRole → AuthzRolesService.createRole → RolesRepository.create | `src/modules/authz/repositories/roles.repository.ts:103` |
| `authz.roles` | LEE | LEE | DIRECTA | AuthzRolesController.createRole → AuthzRolesService.createRole → RolesRepository.findByCode | `src/modules/authz/repositories/roles.repository.ts:72` |

### Cuerpo — DTO `CreateRoleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único del rol | `src/modules/authz/dto/create-role.dto.ts:37` |
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre legible | `src/modules/authz/dto/create-role.dto.ts:46` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario (omitir para rol de sistema) | `src/modules/authz/dto/create-role.dto.ts:57` |
| `parentRoleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol padre (herencia) | `src/modules/authz/dto/create-role.dto.ts:65` |
| `baseRole` | `string` | No | valores: CLINICAL, ADMIN, STAFF | `@IsOptional()` `@IsIn(BASE_ROLES)` | Rol base | `src/modules/authz/dto/create-role.dto.ts:73` |
| `scope` | `string` | No | valores: SELF, BRANCH, TENANT, GLOBAL | `@IsOptional()` `@IsIn(ROLE_SCOPES)` | Ámbito | `src/modules/authz/dto/create-role.dto.ts:81` |
| `isSystem` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Rol de sistema (global, sin tenant) | `src/modules/authz/dto/create-role.dto.ts:89` |
| `isAssignable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Asignable a usuarios | `src/modules/authz/dto/create-role.dto.ts:97` |
| `priority` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Prioridad | `src/modules/authz/dto/create-role.dto.ts:106` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "parentRoleId": "00000000-0000-4000-8000-000000000001",
  "baseRole": "CLINICAL",
  "scope": "SELF",
  "isSystem": true,
  "isAssignable": true,
  "priority": 1
}
```

</details>

### Respuesta — `Promise<RoleResponseDto>` · DTO `RoleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:86` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:92` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/authz/dto/authz-responses.dto.ts:98` |
| `permissionCount` | `number` | Sí | — | — | Nº de bindings permiso aplicados | `src/modules/authz/dto/authz-responses.dto.ts:104` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:110` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: El rol padre no existe |
| 409 | `CONFLICT` | ConflictException: El código de rol está reservado por la plataforma; ConflictException: Ya existe un rol con ese código |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-roles.controller.spec.ts:32` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzRolesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. GET /authz/roles/{roleId}/field-permissions

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** —
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceExtController.fieldPermissions` — `src/modules/authz/controllers/authz-governance-ext.controller.ts:57`

### Qué es y para qué sirve (negocio)

Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/roles/{roleId}/field-permissions` la atiende `AuthzGovernanceExtController.fieldPermissions` (src/modules/authz/controllers/authz-governance-ext.controller.ts:57). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceExtService.roleFieldPermissions`. Lee authz.field_permissions, authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance-ext.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/authz/controllers/authz-governance-ext.controller.ts:57` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.field_permissions` | LEE | LEE | DIRECTA | AuthzGovernanceExtController.fieldPermissions → AuthzGovernanceExtService.roleFieldPermissions | `src/modules/authz/services/authz-governance-ext.service.ts:99` |
| `authz.roles` | LEE | LEE | DIRECTA | AuthzGovernanceExtController.fieldPermissions → AuthzGovernanceExtService.roleFieldPermissions | `src/modules/authz/services/authz-governance-ext.service.ts:87` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceExtController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. PUT /authz/roles/{roleId}/field-permissions

- **Origen:** CONTRATO
- **Nombre:** Configurar el enmascaramiento de campos del rol
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzRolesController.setFieldPermissions` — `src/modules/authz/controllers/authz-roles.controller.ts:93`

### Qué es y para qué sirve (negocio)

Configurar el enmascaramiento de campos del rol. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PUT /authz/roles/{roleId}/field-permissions` la atiende `AuthzRolesController.setFieldPermissions` (src/modules/authz/controllers/authz-roles.controller.ts:93). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SetFieldPermissionsDto` (7 campos, 5 obligatorios). Delega en `AuthzRolesService.setFieldPermissions`. Crea filas en authz.field_permissions. Actualiza authz.field_permissions. Lee authz.field_permissions, authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-roles.controller.ts:93` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/authz/controllers/authz-roles.controller.ts:93` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.field_permissions` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthzRolesController.setFieldPermissions → AuthzRolesService.setFieldPermissions | `src/modules/authz/services/authz-roles.service.ts:284` |
| `authz.field_permissions` | ESCRIBE | CREA | DIRECTA | AuthzRolesController.setFieldPermissions → AuthzRolesService.setFieldPermissions → FieldPermissionsRepository.create | `src/modules/authz/repositories/field-permissions.repository.ts:72` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | AuthzRolesController.setFieldPermissions → AuthzRolesService.setFieldPermissions → FieldPermissionsRepository.findOneByKey | `src/modules/authz/repositories/field-permissions.repository.ts:52` |
| `authz.roles` | LEE | LEE | DIRECTA | AuthzRolesController.setFieldPermissions → AuthzRolesService.setFieldPermissions → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetFieldPermissionsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fields` | `array<FieldPermissionItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => FieldPermissionItemDto)` | Reglas de enmascaramiento a aplicar (upsert) | `src/modules/authz/dto/set-field-permissions.dto.ts:95` |
| `fields[].entity` | `string` | Sí | longitud mínima 1; longitud máxima 150 | `@IsString()` `@MinLength(1)` `@MaxLength(150)` | Entidad/tabla | `src/modules/authz/dto/set-field-permissions.dto.ts:37` |
| `fields[].columnName` | `string` | Sí | longitud mínima 1; longitud máxima 150 | `@IsString()` `@MinLength(1)` `@MaxLength(150)` | Columna | `src/modules/authz/dto/set-field-permissions.dto.ts:46` |
| `fields[].canRead` | `boolean` | Sí | — | `@IsBoolean()` | ¿Puede leerse el campo? | `src/modules/authz/dto/set-field-permissions.dto.ts:53` |
| `fields[].canWrite` | `boolean` | Sí | — | `@IsBoolean()` | ¿Puede escribirse el campo? (exige canRead) | `src/modules/authz/dto/set-field-permissions.dto.ts:60` |
| `fields[].maskStrategy` | `string` | No | valores: REDACT, HASH, PARTIAL, NULLIFY | `@IsOptional()` `@IsIn(MASK_STRATEGIES)` | Estrategia de enmascaramiento | `src/modules/authz/dto/set-field-permissions.dto.ts:71` |
| `fields[].conditionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Condición ABAC (JSON) | `src/modules/authz/dto/set-field-permissions.dto.ts:79` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fields": [
    {
      "entity": "valor-ejemplo",
      "columnName": "Nombre de ejemplo",
      "canRead": true,
      "canWrite": true
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fields": [
    {
      "entity": "valor-ejemplo",
      "columnName": "Nombre de ejemplo",
      "canRead": true,
      "canWrite": true,
      "maskStrategy": "REDACT",
      "conditionJson": {}
    }
  ]
}
```

</details>

### Respuesta — `Promise<AuthzStatusResultDto>` · DTO `AuthzStatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/authz/dto/authz-responses.dto.ts:33` |
| `affected` | `number` | No | — | — | Nº de filas afectadas cuando aplica | `src/modules/authz/dto/authz-responses.dto.ts:39` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: canWrite=true requiere canRead=true |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-roles.controller.spec.ts:50` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzRolesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /authz/roles/{roleId}/permissions

- **Origen:** CONTRATO
- **Nombre:** Permisos activos de un rol, con su efecto y ámbito
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzAdminController.rolePermissions` — `src/modules/authz/controllers/authz-admin.controller.ts:97`

### Qué es y para qué sirve (negocio)

Permisos activos de un rol, con su efecto y ámbito. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/roles/{roleId}/permissions` la atiende `AuthzAdminController.rolePermissions` (src/modules/authz/controllers/authz-admin.controller.ts:97). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzAdminReadService.rolePermissions`. Lee authz.permissions, authz.role_permissions, authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-admin.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | POR_SQL | AuthzAdminController.rolePermissions → AuthzAdminReadService.rolePermissions → AuthzAdminReadRepository.rolePermissions | `src/modules/authz/repositories/authz-admin-read.repository.ts:163` |
| `authz.role_permissions` | LEE | LEE | POR_SQL | AuthzAdminController.rolePermissions → AuthzAdminReadService.rolePermissions → AuthzAdminReadRepository.rolePermissions | `src/modules/authz/repositories/authz-admin-read.repository.ts:163` |
| `authz.roles` | LEE | LEE | POR_SQL | AuthzAdminController.rolePermissions → AuthzAdminReadService.rolePermissions → AuthzAdminReadRepository.roleCodeOf | `src/modules/authz/repositories/authz-admin-read.repository.ts:115` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzAdminController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. PUT /authz/roles/{roleId}/permissions

- **Origen:** CONTRATO
- **Nombre:** Asignar permisos al rol (reemplaza los activos)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzRolesController.setPermissions` — `src/modules/authz/controllers/authz-roles.controller.ts:75`

### Qué es y para qué sirve (negocio)

Asignar permisos al rol (reemplaza los activos). Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`PUT /authz/roles/{roleId}/permissions` la atiende `AuthzRolesController.setPermissions` (src/modules/authz/controllers/authz-roles.controller.ts:75). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SetRolePermissionsDto` (6 campos, 3 obligatorios). Delega en `AuthzRolesService.setPermissions`. Crea filas en authz.role_permissions. Actualiza authz.role_permissions. Lee authz.permissions, authz.roles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-roles.controller.ts:75` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: roleId | `src/modules/authz/controllers/authz-roles.controller.ts:75` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | DIRECTA | AuthzRolesController.setPermissions → AuthzRolesService.setPermissions → PermissionsRepository.findById | `src/modules/authz/repositories/permissions.repository.ts:80` |
| `authz.role_permissions` | ESCRIBE | ACTUALIZA | DIRECTA | AuthzRolesController.setPermissions → AuthzRolesService.setPermissions → RolePermissionsRepository.revokeAllForRole | `src/modules/authz/repositories/role-permissions.repository.ts:92` |
| `authz.role_permissions` | ESCRIBE | CREA | DIRECTA | AuthzRolesController.setPermissions → AuthzRolesService.setPermissions → RolePermissionsRepository.create | `src/modules/authz/repositories/role-permissions.repository.ts:74` |
| `authz.roles` | LEE | LEE | DIRECTA | AuthzRolesController.setPermissions → AuthzRolesService.setPermissions → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `roleId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetRolePermissionsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `permissions` | `array<RolePermissionItemDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => RolePermissionItemDto)` | Bindings permiso→efecto a aplicar (reemplaza los activos) | `src/modules/authz/dto/set-role-permissions.dto.ts:75` |
| `permissions[].permissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del permiso | `src/modules/authz/dto/set-role-permissions.dto.ts:25` |
| `permissions[].effect` | `string` | Sí | valores: ALLOW, DENY | `@IsIn(EFFECTS)` | Efecto (deny prevalece) | `src/modules/authz/dto/set-role-permissions.dto.ts:32` |
| `permissions[].scope` | `string` | No | valores: SELF, BRANCH, TENANT, GLOBAL | `@IsOptional()` `@IsIn(PERMISSION_SCOPES)` | Ámbito | `src/modules/authz/dto/set-role-permissions.dto.ts:40` |
| `permissions[].constraintJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Restricción ABAC (JSON) | `src/modules/authz/dto/set-role-permissions.dto.ts:48` |
| `permissions[].fieldValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de campos permitidos | `src/modules/authz/dto/set-role-permissions.dto.ts:59` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "permissions": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "effect": "ALLOW"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "permissions": [
    {
      "permissionId": "00000000-0000-4000-8000-000000000001",
      "effect": "ALLOW",
      "scope": "SELF",
      "constraintJson": {},
      "fieldValueSetId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

</details>

### Respuesta — `Promise<RoleResponseDto>` · DTO `RoleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:86` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:92` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/authz/dto/authz-responses.dto.ts:98` |
| `permissionCount` | `number` | Sí | — | — | Nº de bindings permiso aplicados | `src/modules/authz/dto/authz-responses.dto.ts:104` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:110` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado; ResourceNotFoundException: Permiso no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-roles.controller.spec.ts:39` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzRolesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. POST /authz/simulations

- **Origen:** CONTRATO
- **Nombre:** Simular una decisión de acceso con el PDP real
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.simulate` — `src/modules/authz/controllers/authz-governance.controller.ts:201`

### Qué es y para qué sirve (negocio)

Simular una decisión de acceso con el PDP real. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/simulations` la atiende `AuthzGovernanceController.simulate` (src/modules/authz/controllers/authz-governance.controller.ts:201). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `SimulateDecisionDto` (9 campos, 4 obligatorios). Delega en `AuthzGovernanceService.simulate`. Lee authz.access_policies, authz.care_relationships, authz.clinical_access_grants, authz.field_permissions, authz.patient_legal_representations, authz.permissions, authz.resource_scope_grants, authz.role_permissions y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:201` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → AccessPoliciesRepository.findActiveForTarget | `src/modules/authz/repositories/access-policies.repository.ts:62` |
| `authz.care_relationships` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → CareRelationshipsRepository.findActiveForPractitionerPatient | `src/modules/authz/repositories/care-relationships.repository.ts:100` |
| `authz.clinical_access_grants` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → ClinicalAccessGrantsRepository.findActiveForUserPatient | `src/modules/authz/repositories/clinical-access-grants.repository.ts:105` |
| `authz.field_permissions` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → AuthzPdpService.computeMaskedFields → FieldPermissionsRepository.findForRoles | `src/modules/authz/repositories/field-permissions.repository.ts:61` |
| `authz.patient_legal_representations` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → PatientLegalRepresentationsRepository.findActiveForRepresentativePatient | `src/modules/authz/repositories/patient-legal-representations.repository.ts:96` |
| `authz.permissions` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → PermissionsRepository.findByResourceAction | `src/modules/authz/repositories/permissions.repository.ts:89` |
| `authz.resource_scope_grants` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → ResourceScopeGrantsRepository.findForSubjectResource | `src/modules/authz/repositories/resource-scope-grants.repository.ts:73` |
| `authz.role_permissions` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → RolePermissionsRepository.findActiveForRoles | `src/modules/authz/repositories/role-permissions.repository.ts:47` |
| `authz.roles` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → AuthzPdpService.resolveRoleInheritance → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → UserPermissionGrantsRepository.findActiveForUser | `src/modules/authz/repositories/user-permission-grants.repository.ts:85` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzPdpService.evaluate → UserRoleAssignmentsRepository.findActiveForUser | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.simulate → AuthzGovernanceService.simulate → AuthzGovernanceService.requireUser → AuthzGovernanceReadRepository.userById | `src/modules/authz/repositories/authz-governance-read.repository.ts:137` |

### Cuerpo — DTO `SimulateDecisionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario sujeto de la decisión | `src/modules/authz/dto/evaluate-decision.dto.ts:44` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant de la evaluación | `src/modules/authz/dto/evaluate-decision.dto.ts:51` |
| `action` | `string` | Sí | valores: READ, WRITE, CREATE, DELETE, EXECUTE, APPROVE | `@IsIn(PERMISSION_ACTIONS)` | Acción evaluada | `src/modules/authz/dto/evaluate-decision.dto.ts:58` |
| `resource` | `string` | Sí | longitud mínima 1; longitud máxima 150 | `@IsString()` `@MinLength(1)` `@MaxLength(150)` | Recurso protegido (debe casar con permissions.resource) | `src/modules/authz/dto/evaluate-decision.dto.ts:70` |
| `resourceType` | `string` | No | valores: PATIENT, ENCOUNTER, DOCUMENT, RECORD | `@IsOptional()` `@IsIn(RESOURCE_TYPES)` | Tipo de recurso concreto | `src/modules/authz/dto/evaluate-decision.dto.ts:81` |
| `resourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso concreto | `src/modules/authz/dto/evaluate-decision.dto.ts:92` |
| `patientProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil de paciente si el recurso es clínico | `src/modules/authz/dto/evaluate-decision.dto.ts:103` |
| `practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil de practicante del actor (habilita evaluación de relación asistencial C-06) | `src/modules/authz/dto/evaluate-decision.dto.ts:115` |
| `purposeOfUse` | `string` | No | valores: TREATMENT, PAYMENT, OPERATIONS, EMERGENCY | `@IsOptional()` `@IsIn(DECISION_PURPOSES)` | Propósito de uso | `src/modules/authz/dto/evaluate-decision.dto.ts:126` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "action": "READ",
  "resource": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "action": "READ",
  "resource": "valor-ejemplo",
  "resourceType": "PATIENT",
  "resourceId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
  "purposeOfUse": "TREATMENT"
}
```

</details>

### Respuesta — `Promise<SimulationResultDto>` · DTO `SimulationResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `simulated` | `boolean` | Sí | valores: true | — | Siempre `true`: nada se aplicó ni se concedió | `src/modules/authz/dto/authz-governance.dto.ts:310` |
| `decision` | `Function` | Sí | — | — | La decisión que devuelve el PDP real, sin transformar: la misma que `POST /authz/decisions/evaluate` | `src/modules/authz/dto/authz-governance.dto.ts:315` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. POST /authz/tenants/{tenantId}/access-policies

- **Origen:** CONTRATO
- **Nombre:** Definir una política de acceso ABAC con enmascaramiento
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzPoliciesController.create` — `src/modules/authz/controllers/authz-policies.controller.ts:33`

### Qué es y para qué sirve (negocio)

Definir una política de acceso ABAC con enmascaramiento. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/tenants/{tenantId}/access-policies` la atiende `AuthzPoliciesController.create` (src/modules/authz/controllers/authz-policies.controller.ts:33). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAccessPolicyDto` (5 campos, 2 obligatorios). Delega en `AuthzPoliciesService.create`. Crea filas en authz.access_policies. Lee authz.access_policies.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-policies.controller.ts:33` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/authz/controllers/authz-policies.controller.ts:33` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.access_policies` | ESCRIBE | CREA | DIRECTA | AuthzPoliciesController.create → AuthzPoliciesService.create → AccessPoliciesRepository.create | `src/modules/authz/repositories/access-policies.repository.ts:81` |
| `authz.access_policies` | LEE | LEE | DIRECTA | AuthzPoliciesController.create → AuthzPoliciesService.create → AccessPoliciesRepository.findByTenantTargetPriority | `src/modules/authz/repositories/access-policies.repository.ts:48` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAccessPolicyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Nombre de la política | `src/modules/authz/dto/create-access-policy.dto.ts:29` |
| `effect` | `string` | Sí | valores: ALLOW, DENY | `@IsIn(EFFECTS)` | Efecto de la política | `src/modules/authz/dto/create-access-policy.dto.ts:36` |
| `targetResource` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Recurso objetivo (p. ej. patient.record) | `src/modules/authz/dto/create-access-policy.dto.ts:48` |
| `conditionJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Condición ABAC (JSON) | `src/modules/authz/dto/create-access-policy.dto.ts:56` |
| `priority` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Prioridad de desempate (menor = antes) | `src/modules/authz/dto/create-access-policy.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "effect": "ALLOW"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "effect": "ALLOW",
  "targetResource": "valor-ejemplo",
  "conditionJson": {},
  "priority": 1
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una política activa con esa prioridad para el recurso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-policies.controller.spec.ts:28` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzPoliciesController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. GET /authz/users/{userId}/access-map

- **Origen:** CONTRATO
- **Nombre:** «Quién puede qué» de un usuario: roles, conteos y última revisión
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.accessMap` — `src/modules/authz/controllers/authz-governance.controller.ts:87`

### Qué es y para qué sirve (negocio)

«Quién puede qué» de un usuario: roles, conteos y última revisión. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/users/{userId}/access-map` la atiende `AuthzGovernanceController.accessMap` (src/modules/authz/controllers/authz-governance.controller.ts:87). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.accessMap`. Lee audit.audit_log, authz.field_permissions, authz.resource_scope_grants, authz.roles, authz.user_permission_grants, authz.user_role_assignments, iam.user_global_roles, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:87` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzGovernanceReadRepository.lastReviewOf → AuthzGovernanceReadRepository.reviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:446` |
| `authz.field_permissions` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzGovernanceReadRepository.countsForUser | `src/modules/authz/repositories/authz-governance-read.repository.ts:165` |
| `authz.resource_scope_grants` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzGovernanceReadRepository.countsForUser | `src/modules/authz/repositories/authz-governance-read.repository.ts:165` |
| `authz.roles` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzAdminReadRepository.assignmentsOfUser | `src/modules/authz/repositories/authz-admin-read.repository.ts:92` |
| `authz.user_permission_grants` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzGovernanceReadRepository.countsForUser | `src/modules/authz/repositories/authz-governance-read.repository.ts:165` |
| `authz.user_role_assignments` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzAdminReadRepository.assignmentsOfUser | `src/modules/authz/repositories/authz-admin-read.repository.ts:92` |
| `iam.user_global_roles` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzAdminReadRepository.globalRolesOf | `src/modules/authz/repositories/authz-admin-read.repository.ts:253` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.accessMap → AuthzGovernanceService.accessMap → AuthzGovernanceService.requireUser → AuthzGovernanceReadRepository.userById | `src/modules/authz/repositories/authz-governance-read.repository.ts:137` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AccessMapDto>` · DTO `AccessMapDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `user` | `AccessMapUserDto` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:170` |
| `user.id` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:163` |
| `user.displayName` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:164` |
| `user.accountStatus` | `string` | Sí | valores: ACTIVE, LOCKED, ANONYMIZED, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:165` |
| `globalRoles` | `array<string>` | Sí | — | — | Roles globales de `iam` activos | `src/modules/authz/dto/authz-governance.dto.ts:175` |
| `assignments` | `array<UserRoleAssignmentDto>` | Sí | — | — | Asignaciones de rol de `authz`, vigentes o no | `src/modules/authz/dto/authz-governance.dto.ts:180` |
| `assignments[].id` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-admin.dto.ts:114` |
| `assignments[].roleId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-admin.dto.ts:115` |
| `assignments[].roleCode` | `string` | Sí | — | — | Código que exige `@Roles(...)` | `src/modules/authz/dto/authz-admin.dto.ts:117` |
| `assignments[].roleName` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-admin.dto.ts:118` |
| `assignments[].roleScope` | `string` | No | valores: SELF, BRANCH, TENANT, GLOBAL; admite null | — | — | `src/modules/authz/dto/authz-admin.dto.ts:120` |
| `assignments[].tenantId` | `object` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-admin.dto.ts:121` |
| `assignments[].branchId` | `object` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-admin.dto.ts:123` |
| `assignments[].practiceId` | `object` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-admin.dto.ts:125` |
| `assignments[].status` | `string` | Sí | valores: ACTIVE, REVOKED, EXPIRED, OTHER | — | — | `src/modules/authz/dto/authz-admin.dto.ts:127` |
| `assignments[].validFrom` | `string` | No | formato date-time; admite null | — | — | `src/modules/authz/dto/authz-admin.dto.ts:129` |
| `assignments[].validTo` | `string` | No | formato date-time; admite null | — | — | `src/modules/authz/dto/authz-admin.dto.ts:131` |
| `assignments[].isEffective` | `boolean` | Sí | — | — | `true` si la asignación está activa y su vigencia cubre el instante de la consulta: es la que llega al token | `src/modules/authz/dto/authz-admin.dto.ts:136` |
| `assignments[].appliesGlobally` | `boolean` | Sí | — | — | `true` si el rol es de ámbito global y se asignó sin tenant, sede ni consultorio: autoriza en las rutas sin tenant. Un rol global asignado con tenant no autoriza ahí | `src/modules/authz/dto/authz-admin.dto.ts:141` |
| `assignments[].assignedByUserId` | `object` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-admin.dto.ts:143` |
| `assignments[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/authz/dto/authz-admin.dto.ts:144` |
| `counts` | `AccessMapCountsDto` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:181` |
| `counts.directGrants` | `number` | Sí | — | — | Excepciones de permiso por usuario vigentes | `src/modules/authz/dto/authz-governance.dto.ts:152` |
| `counts.resourceScopeGrants` | `number` | Sí | — | — | Grants sobre un recurso concreto vigentes | `src/modules/authz/dto/authz-governance.dto.ts:154` |
| `counts.restrictedFields` | `number` | Sí | — | — | Campos restringidos (sin lectura, sin escritura o enmascarados) por sus roles efectivos | `src/modules/authz/dto/authz-governance.dto.ts:159` |
| `lastReview` | `AccessReviewDto` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:183` |
| `lastReview.id` | `string` | No | formato uuid | — | Id del sello en la bitácora | sin fuente |
| `lastReview.userId` | `string` | No | formato uuid | — | Cuenta revisada | sin fuente |
| `lastReview.userDisplayName` | `string` | No | admite null | — | — | sin fuente |
| `lastReview.reviewerUserId` | `string` | No | formato uuid | — | Quien revisó | sin fuente |
| `lastReview.reviewerDisplayName` | `string` | No | admite null | — | — | sin fuente |
| `lastReview.reviewedAt` | `string` | No | formato date-time | — | — | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /authz/users/{userId}/access-reviews

- **Origen:** CONTRATO
- **Nombre:** Registrar que revisaste los accesos de una cuenta
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.recordReview` — `src/modules/authz/controllers/authz-governance.controller.ts:159`

### Qué es y para qué sirve (negocio)

Registrar que revisaste los accesos de una cuenta. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/users/{userId}/access-reviews` la atiende `AuthzGovernanceController.recordReview` (src/modules/authz/controllers/authz-governance.controller.ts:159). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.recordReview`. Crea filas en audit.audit_log. Lee audit.audit_log, iam.sessions, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.audit_log` | ESCRIBE | CREA | DIRECTA | AuthzGovernanceController.recordReview → AuthzGovernanceService.recordReview → AuditTrailService.record → AuditLogRepository.append | `src/modules/audit/repositories/audit-log.repository.ts:186` |
| `audit.audit_log` | LEE | LEE | DIRECTA | AuthzGovernanceController.recordReview → AuthzGovernanceService.recordReview → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.findChainTip | `src/modules/audit/repositories/audit-log.repository.ts:157` |
| `iam.sessions` | LEE | LEE | POR_SQL | AuthzGovernanceController.recordReview → AuthzGovernanceService.recordReview → AuditTrailService.record → AuditLogRepository.append → AuditLogRepository.withRequestOrigin → AuditLogRepository.sessionDeviceId | `src/modules/audit/repositories/audit-log.repository.ts:235` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.recordReview → AuthzGovernanceService.recordReview → AuthzGovernanceReadRepository.reviews | `src/modules/authz/repositories/authz-governance-read.repository.ts:446` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AccessReviewDto>` · DTO `AccessReviewDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Id del sello en la bitácora | `src/modules/authz/dto/authz-governance.dto.ts:103` |
| `userId` | `string` | Sí | formato uuid | — | Cuenta revisada | `src/modules/authz/dto/authz-governance.dto.ts:105` |
| `userDisplayName` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:107` |
| `reviewerUserId` | `string` | Sí | formato uuid | — | Quien revisó | `src/modules/authz/dto/authz-governance.dto.ts:109` |
| `reviewerDisplayName` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:111` |
| `reviewedAt` | `string` | Sí | formato date-time | — | — | `src/modules/authz/dto/authz-governance.dto.ts:112` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Los accesos propios los revisa otra persona |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. GET /authz/users/{userId}/permission-grants

- **Origen:** CONTRATO
- **Nombre:** Excepciones de permiso por usuario, paginadas
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.directGrants` — `src/modules/authz/controllers/authz-governance.controller.ts:99`

### Qué es y para qué sirve (negocio)

Excepciones de permiso por usuario, paginadas. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/users/{userId}/permission-grants` la atiende `AuthzGovernanceController.directGrants` (src/modules/authz/controllers/authz-governance.controller.ts:99). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.directGrants`. Lee authz.permissions, authz.user_permission_grants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | POR_SQL | AuthzGovernanceController.directGrants → AuthzGovernanceService.directGrants → AuthzGovernanceReadRepository.directGrants | `src/modules/authz/repositories/authz-governance-read.repository.ts:216` |
| `authz.user_permission_grants` | LEE | LEE | POR_SQL | AuthzGovernanceController.directGrants → AuthzGovernanceService.directGrants → AuthzGovernanceReadRepository.directGrants | `src/modules/authz/repositories/authz-governance-read.repository.ts:216` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.directGrants → AuthzGovernanceService.directGrants → AuthzGovernanceService.requireUser → AuthzGovernanceReadRepository.userById | `src/modules/authz/repositories/authz-governance-read.repository.ts:137` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `show` | query | No | `string` | `EFFECTIVE`: activas y dentro de su vigencia. `ALL`: también las revocadas, vencidas y futuras |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DirectGrantsPageDto>` · DTO `DirectGrantsPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:254` |
| `limit` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:256` |
| `items` | `array<DirectGrantDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:259` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:187` |
| `items[].permissionId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:188` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:189` |
| `items[].name` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:190` |
| `items[].resource` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:191` |
| `items[].effect` | `string` | Sí | valores: ALLOW, DENY, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:192` |
| `items[].scope` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:193` |
| `items[].tenantId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:195` |
| `items[].reason` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:196` |
| `items[].status` | `string` | Sí | valores: ACTIVE, REVOKED, EXPIRED, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:198` |
| `items[].validFrom` | `string` | No | formato date-time; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:200` |
| `items[].validTo` | `string` | No | formato date-time; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:202` |
| `items[].isEffective` | `boolean` | Sí | — | — | Activa y dentro de su vigencia: cuenta hoy | `src/modules/authz/dto/authz-governance.dto.ts:204` |
| `items[].grantedByUserId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:206` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/authz/dto/authz-governance.dto.ts:207` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. POST /authz/users/{userId}/permission-grants

- **Origen:** CONTRATO
- **Nombre:** Otorgar una excepción de permiso por usuario
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGrantsController.grantPermission` — `src/modules/authz/controllers/authz-grants.controller.ts:58`

### Qué es y para qué sirve (negocio)

Otorgar una excepción de permiso por usuario. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/users/{userId}/permission-grants` la atiende `AuthzGrantsController.grantPermission` (src/modules/authz/controllers/authz-grants.controller.ts:58). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePermissionGrantDto` (8 campos, 3 obligatorios). Delega en `AuthzGrantsService.grantPermission`. Crea filas en authz.user_permission_grants. Lee authz.permissions, authz.user_permission_grants.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-grants.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: userId | `src/modules/authz/controllers/authz-grants.controller.ts:58` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | DIRECTA | AuthzGrantsController.grantPermission → AuthzGrantsService.grantPermission → PermissionsRepository.findById | `src/modules/authz/repositories/permissions.repository.ts:80` |
| `authz.user_permission_grants` | ESCRIBE | CREA | DIRECTA | AuthzGrantsController.grantPermission → AuthzGrantsService.grantPermission → UserPermissionGrantsRepository.create | `src/modules/authz/repositories/user-permission-grants.repository.ts:102` |
| `authz.user_permission_grants` | LEE | LEE | DIRECTA | AuthzGrantsController.grantPermission → AuthzGrantsService.grantPermission → UserPermissionGrantsRepository.findActive | `src/modules/authz/repositories/user-permission-grants.repository.ts:73` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreatePermissionGrantDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `permissionId` | `string` | Sí | formato uuid | `@IsUUID()` | Permiso concedido/denegado excepcionalmente | `src/modules/authz/dto/create-permission-grant.dto.ts:29` |
| `effect` | `string` | Sí | valores: ALLOW, DENY | `@IsIn(EFFECTS)` | Efecto (deny individual prevalece sobre allow de rol) | `src/modules/authz/dto/create-permission-grant.dto.ts:39` |
| `reason` | `string` | Sí | longitud mínima 1; longitud máxima 500 | `@IsString()` `@MinLength(1)` `@MaxLength(500)` | Justificación obligatoria | `src/modules/authz/dto/create-permission-grant.dto.ts:48` |
| `scope` | `string` | No | valores: SELF, BRANCH, TENANT, GLOBAL | `@IsOptional()` `@IsIn(PERMISSION_SCOPES)` | Ámbito | `src/modules/authz/dto/create-permission-grant.dto.ts:56` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant del grant | `src/modules/authz/dto/create-permission-grant.dto.ts:64` |
| `resourceSelectorJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Selector de recursos (JSON) | `src/modules/authz/dto/create-permission-grant.dto.ts:75` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Inicio de vigencia | `src/modules/authz/dto/create-permission-grant.dto.ts:88` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Fin de vigencia (acotado) | `src/modules/authz/dto/create-permission-grant.dto.ts:101` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW",
  "reason": "Texto descriptivo de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "permissionId": "00000000-0000-4000-8000-000000000001",
  "effect": "ALLOW",
  "reason": "Texto descriptivo de ejemplo",
  "scope": "SELF",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "resourceSelectorJson": {},
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Permiso no encontrado |
| 409 | `CONFLICT` | ConflictException: El usuario ya tiene una excepción activa para ese permiso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/authz/controllers/authz-grants.controller.spec.ts:39` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGrantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. GET /authz/users/{userId}/resource-scope-grants

- **Origen:** CONTRATO
- **Nombre:** Grants sobre un recurso concreto cuyo sujeto es el usuario, paginados
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.scopeGrants` — `src/modules/authz/controllers/authz-governance.controller.ts:111`

### Qué es y para qué sirve (negocio)

Grants sobre un recurso concreto cuyo sujeto es el usuario, paginados. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/users/{userId}/resource-scope-grants` la atiende `AuthzGovernanceController.scopeGrants` (src/modules/authz/controllers/authz-governance.controller.ts:111). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.scopeGrants`. Lee authz.permissions, authz.resource_scope_grants, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.permissions` | LEE | LEE | POR_SQL | AuthzGovernanceController.scopeGrants → AuthzGovernanceService.scopeGrants → AuthzGovernanceReadRepository.scopeGrants | `src/modules/authz/repositories/authz-governance-read.repository.ts:256` |
| `authz.resource_scope_grants` | LEE | LEE | POR_SQL | AuthzGovernanceController.scopeGrants → AuthzGovernanceService.scopeGrants → AuthzGovernanceReadRepository.scopeGrants | `src/modules/authz/repositories/authz-governance-read.repository.ts:256` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.scopeGrants → AuthzGovernanceService.scopeGrants → AuthzGovernanceService.requireUser → AuthzGovernanceReadRepository.userById | `src/modules/authz/repositories/authz-governance-read.repository.ts:137` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `show` | query | No | `string` | `EFFECTIVE`: activas y dentro de su vigencia. `ALL`: también las revocadas, vencidas y futuras |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ScopeGrantsPageDto>` · DTO `ScopeGrantsPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:254` |
| `limit` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:256` |
| `items` | `array<ScopeGrantDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:262` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:211` |
| `items[].permissionId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:212` |
| `items[].code` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:213` |
| `items[].resourceType` | `string` | Sí | valores: PATIENT, ENCOUNTER, DOCUMENT, RECORD, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:217` |
| `items[].resourceId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:218` |
| `items[].effect` | `string` | Sí | valores: ALLOW, DENY, OTHER | — | — | `src/modules/authz/dto/authz-governance.dto.ts:219` |
| `items[].tenantId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:221` |
| `items[].validFrom` | `string` | No | formato date-time; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:223` |
| `items[].validTo` | `string` | No | formato date-time; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:225` |
| `items[].isEffective` | `boolean` | Sí | — | — | Dentro de su vigencia: cuenta hoy | `src/modules/authz/dto/authz-governance.dto.ts:227` |
| `items[].grantedByUserId` | `string` | No | formato uuid; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:229` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/authz/dto/authz-governance.dto.ts:230` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. GET /authz/users/{userId}/restricted-fields

- **Origen:** CONTRATO
- **Nombre:** Campos restringidos que alcanzan al usuario por sus roles efectivos
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGovernanceController.restrictedFields` — `src/modules/authz/controllers/authz-governance.controller.ts:126`

### Qué es y para qué sirve (negocio)

Campos restringidos que alcanzan al usuario por sus roles efectivos. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/users/{userId}/restricted-fields` la atiende `AuthzGovernanceController.restrictedFields` (src/modules/authz/controllers/authz-governance.controller.ts:126). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzGovernanceService.restrictedFields`. Lee authz.field_permissions, authz.roles, authz.user_role_assignments, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-governance.controller.ts:126` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.field_permissions` | LEE | LEE | POR_SQL | AuthzGovernanceController.restrictedFields → AuthzGovernanceService.restrictedFields → AuthzGovernanceReadRepository.restrictedFields | `src/modules/authz/repositories/authz-governance-read.repository.ts:291` |
| `authz.roles` | LEE | LEE | POR_SQL | AuthzGovernanceController.restrictedFields → AuthzGovernanceService.restrictedFields → AuthzGovernanceReadRepository.restrictedFields | `src/modules/authz/repositories/authz-governance-read.repository.ts:291` |
| `authz.user_role_assignments` | LEE | LEE | POR_SQL | AuthzGovernanceController.restrictedFields → AuthzGovernanceService.restrictedFields → AuthzGovernanceReadRepository.restrictedFields | `src/modules/authz/repositories/authz-governance-read.repository.ts:291` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzGovernanceController.restrictedFields → AuthzGovernanceService.restrictedFields → AuthzGovernanceService.requireUser → AuthzGovernanceReadRepository.userById | `src/modules/authz/repositories/authz-governance-read.repository.ts:137` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |
| `limit` | query | No | `number` | — |
| `cursor` | query | No | `string` | `nextCursor` de la página anterior |
| `show` | query | No | `string` | `EFFECTIVE`: activas y dentro de su vigencia. `ALL`: también las revocadas, vencidas y futuras |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<RestrictedFieldsPageDto>` · DTO `RestrictedFieldsPageDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nextCursor` | `string` | No | admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:254` |
| `limit` | `number` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:256` |
| `items` | `array<RestrictedFieldDto>` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:265` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:234` |
| `items[].roleId` | `string` | Sí | formato uuid | — | — | `src/modules/authz/dto/authz-governance.dto.ts:235` |
| `items[].roleCode` | `string` | Sí | — | — | Rol que define la regla (puede ser un rol padre heredado) | `src/modules/authz/dto/authz-governance.dto.ts:239` |
| `items[].entity` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:240` |
| `items[].columnName` | `string` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:241` |
| `items[].canRead` | `boolean` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:242` |
| `items[].canWrite` | `boolean` | Sí | — | — | — | `src/modules/authz/dto/authz-governance.dto.ts:243` |
| `items[].maskStrategy` | `string` | No | valores: REDACT, HASH, PARTIAL, NULLIFY; admite null | — | — | `src/modules/authz/dto/authz-governance.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGovernanceController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. GET /authz/users/{userId}/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignaciones de rol de un usuario, activas o no
- **Bloque:** Identidad y Seguridad
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzAdminController.assignmentsOf` — `src/modules/authz/controllers/authz-admin.controller.ts:54`

### Qué es y para qué sirve (negocio)

Asignaciones de rol de un usuario, activas o no. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`GET /authz/users/{userId}/role-assignments` la atiende `AuthzAdminController.assignmentsOf` (src/modules/authz/controllers/authz-admin.controller.ts:54). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzAdminReadService.assignmentsOf`. Lee authz.roles, authz.user_role_assignments, iam.users.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-admin.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | POR_SQL | AuthzAdminController.assignmentsOf → AuthzAdminReadService.assignmentsOf → AuthzAdminReadRepository.assignmentsOfUser | `src/modules/authz/repositories/authz-admin-read.repository.ts:92` |
| `authz.user_role_assignments` | LEE | LEE | POR_SQL | AuthzAdminController.assignmentsOf → AuthzAdminReadService.assignmentsOf → AuthzAdminReadRepository.assignmentsOfUser | `src/modules/authz/repositories/authz-admin-read.repository.ts:92` |
| `iam.users` | LEE | LEE | POR_SQL | AuthzAdminController.assignmentsOf → AuthzAdminReadService.assignmentsOf → AuthzAdminReadRepository.userExists | `src/modules/authz/repositories/authz-admin-read.repository.ts:106` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |

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
| 404 | `NOT_FOUND` | ResourceNotFoundException: Usuario no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzAdminController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. POST /authz/users/{userId}/role-assignments

- **Origen:** CONTRATO
- **Nombre:** Asignar un rol a un usuario con vigencia y ámbito
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzGrantsController.assignRole` — `src/modules/authz/controllers/authz-grants.controller.ts:38`

### Qué es y para qué sirve (negocio)

Asignar un rol a un usuario con vigencia y ámbito. Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`POST /authz/users/{userId}/role-assignments` la atiende `AuthzGrantsController.assignRole` (src/modules/authz/controllers/authz-grants.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AuthzCreateRoleAssignmentDto` (7 campos, 0 obligatorios). Delega en `AuthzGrantsService.assignRole`. Crea filas en authz.user_role_assignments. Lee authz.roles, authz.user_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-grants.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| PARAMETRO_RUTA | Deben ser UUID válidos: userId | `src/modules/authz/controllers/authz-grants.controller.ts:38` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | AuthzGrantsController.assignRole → AuthzGrantsService.assignRole → RolesRepository.findById | `src/modules/authz/repositories/roles.repository.ts:61` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | AuthzGrantsController.assignRole → AuthzGrantsService.assignRole → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | AuthzGrantsController.assignRole → AuthzGrantsService.assignRole → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |

### Cuerpo — DTO `AuthzCreateRoleAssignmentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `roleId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Rol a asignar por id (debe ser asignable) | `src/modules/authz/dto/create-role-assignment.dto.ts:25` |
| `roleCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Rol a asignar por código (p. ej. `SURGEON`) | `src/modules/authz/dto/create-role-assignment.dto.ts:41` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant del ámbito | `src/modules/authz/dto/create-role-assignment.dto.ts:49` |
| `branchId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sede/branch del ámbito | `src/modules/authz/dto/create-role-assignment.dto.ts:60` |
| `practiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Consultorio/practice del ámbito | `src/modules/authz/dto/create-role-assignment.dto.ts:71` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Inicio de vigencia | `src/modules/authz/dto/create-role-assignment.dto.ts:84` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@Type(() => Date)` `@IsDate()` | Fin de vigencia | `src/modules/authz/dto/create-role-assignment.dto.ts:97` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "roleId": "00000000-0000-4000-8000-000000000001",
  "roleCode": "CODIGO_EJEMPLO",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "branchId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<AuthzIdResponseDto>` · DTO `AuthzIdResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/authz/dto/authz-responses.dto.ts:9` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del recurso | `src/modules/authz/dto/authz-responses.dto.ts:18` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/authz/dto/authz-responses.dto.ts:24` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Rol no encontrado |
| 409 | `CONFLICT` | ConflictException: El usuario ya tiene ese rol asignado y activo en ese ámbito |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Indique el rol a asignar por `roleId` o por `roleCode`; PreconditionFailedException: El rol no es asignable; PreconditionFailedException: Un rol de ámbito global se asigna sin tenant, sede ni consultorio; PreconditionFailedException: validFrom debe ser anterior a validTo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx10-mostrador-atomico.int-spec.ts:209` |
| INTEGRACION | `test/integration/hardening/mch-034.int-spec.ts:93` |
| CONTROLADOR | `src/modules/authz/controllers/authz-grants.controller.spec.ts:32` |

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzGrantsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. DELETE /authz/users/{userId}/role-assignments/{assignmentId}

- **Origen:** CONTRATO
- **Nombre:** Revocar una asignación de rol (revocación lógica: la fila queda como historia)
- **Bloque:** Identidad y Seguridad
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `AuthzAdminController.revoke` — `src/modules/authz/controllers/authz-admin.controller.ts:67`

### Qué es y para qué sirve (negocio)

Revocar una asignación de rol (revocación lógica: la fila queda como historia). Dentro del módulo (descripción del modelo, en inglés): «Fine-grained control of who can do what, down to the individual field and the individual patient record.» Dominio: Identidad y Seguridad.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_06_authz.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:27`)

### Cómo se atiende (sistema)

`DELETE /authz/users/{userId}/role-assignments/{assignmentId}` la atiende `AuthzAdminController.revoke` (src/modules/authz/controllers/authz-admin.controller.ts:67). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `AuthzAssignmentRevocationService.revoke`. Actualiza authz.user_role_assignments. Lee authz.user_role_assignments.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/authz/controllers/authz-admin.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.user_role_assignments` | ESCRIBE | ACTUALIZA | POR_TIPO | AuthzAdminController.revoke → AuthzAssignmentRevocationService.revoke | `src/modules/authz/services/authz-assignment-revocation.service.ts:61` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | AuthzAdminController.revoke → AuthzAssignmentRevocationService.revoke | `src/modules/authz/services/authz-assignment-revocation.service.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `userId` | path | Sí | `string` | — |
| `assignmentId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado` · HTTP `HttpStatus.OK`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Asignación de rol no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La asignación de rol no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/authz.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo 06 — authz (Authorization, Purpose of Use & Field Masking) — etapa `ctrl:AuthzAdminController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

