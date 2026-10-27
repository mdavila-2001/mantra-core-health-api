<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `profiles`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 58 (58 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 26 · MEDIO 10 · BAJO 22
- **Tablas distintas que tocan:** 50
- **Respuestas de error y detalle contractual:** `openapi/endpoints/profiles.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/profiles/credentials` | Listar credenciales pendientes de verificación | BAJO | 1 | SECURITY_ADMIN |
| 2 | POST | `/profiles/credentials/{credentialId}/verify` | Verificar credencial profesional | MEDIO | 8 | SECURITY_ADMIN |
| 3 | GET | `/profiles/patients` | UC-05-13: listado paginado de pacientes | BAJO | 6 | SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER |
| 4 | POST | `/profiles/patients` | Alta de persona y perfil de paciente | MEDIO | 4 | SECURITY_ADMIN |
| 5 | GET | `/profiles/patients/{profileId}` | UC-05-14: ficha de filiación de un paciente (F-01) | BAJO | 3 | SECURITY_ADMIN, CLINICIAN, PRACTITIONER |
| 6 | POST | `/profiles/patients/{profileId}/identity-links` | Vincular identidad externa de paciente (MPI) | MEDIO | 5 | SECURITY_ADMIN |
| 7 | POST | `/profiles/patients/{profileId}/portal-proxies` | Otorgar proxy de portal a un representante | MEDIO | 4 | SECURITY_ADMIN |
| 8 | POST | `/profiles/patients/{profileId}/related-persons` | Registrar persona relacionada / contacto de emergencia | ALTO | 6 | sesión (sin roles) |
| 9 | GET | `/profiles/patients/me` | Consultar los propios datos de filiación | BAJO | 14 | sesión (sin roles) |
| 10 | PATCH | `/profiles/patients/me` | Editar los propios datos de filiación | ALTO | 20 | sesión (sin roles) |
| 11 | GET | `/profiles/patients/me/dependent-candidates` | Buscar por nombre a quién pedirle que deje representarla | BAJO | 5 | sesión (sin roles) |
| 12 | POST | `/profiles/patients/me/dependent-requests` | Pedir representar a una persona que ya tiene cuenta | ALTO | 16 | sesión (sin roles) |
| 13 | POST | `/profiles/patients/me/dependent-requests/{id}/accept` | Aceptar una solicitud de dependiente | ALTO | 15 | sesión (sin roles) |
| 14 | POST | `/profiles/patients/me/dependent-requests/{id}/reject` | Rechazar una solicitud de dependiente | ALTO | 14 | sesión (sin roles) |
| 15 | GET | `/profiles/patients/me/dependent-requests/incoming` | Listar las solicitudes de dependiente recibidas | BAJO | 4 | sesión (sin roles) |
| 16 | GET | `/profiles/patients/me/dependents` | Listar los dependientes a cargo del paciente autenticado | BAJO | 5 | sesión (sin roles) |
| 17 | POST | `/profiles/patients/me/dependents` | Registrar un dependiente (menor o adulto mayor tutelado) | ALTO | 13 | sesión (sin roles) |
| 18 | DELETE | `/profiles/patients/me/photo` | Quitar la propia foto de perfil | BAJO | 14 | sesión (sin roles) |
| 19 | PUT | `/profiles/patients/me/photo` | Fijar la propia foto de perfil | BAJO | 16 | sesión (sin roles) |
| 20 | GET | `/profiles/patients/me/summary` | Consultar el resumen propio | BAJO | 3 | sesión (sin roles) |
| 21 | POST | `/profiles/patients/merge` | Fusionar pacientes duplicados | MEDIO | 8 | SECURITY_ADMIN |
| 22 | GET | `/profiles/patients/merge-events` | Listar eventos de fusión de pacientes | BAJO | 1 | SECURITY_ADMIN |
| 23 | POST | `/profiles/patients/merge/{eventId}/reverse` | Revertir una fusión de pacientes | MEDIO | 6 | SECURITY_ADMIN |
| 24 | POST | `/profiles/patients/search` | UC-05-13: listado paginado de pacientes, con los filtros en el cuerpo | BAJO | 6 | SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER |
| 25 | POST | `/profiles/persons/{personId}/account-links` | Vincular cuenta de portal a una persona | MEDIO | 3 | SECURITY_ADMIN |
| 26 | POST | `/profiles/persons/{personId}/decease` | Registrar defunción y anonimización de una persona | MEDIO | 4 | SECURITY_ADMIN |
| 27 | GET | `/profiles/practitioners` | Listar profesionales para la guía, con sus especialidades | BAJO | 4 | sesión (sin roles) |
| 28 | POST | `/profiles/practitioners` | Alta de profesional de salud (workforce generalista) | MEDIO | 12 | SECURITY_ADMIN |
| 29 | PATCH | `/profiles/practitioners/{profileId}` | Corregir el perfil profesional de otro (titular o plataforma) | ALTO | 26 | sesión (sin roles) |
| 30 | POST | `/profiles/practitioners/{profileId}/affiliations` | Registrar un consultorio de un profesional sin cuenta | MEDIO | 25 | SECURITY_ADMIN |
| 31 | POST | `/profiles/practitioners/{profileId}/jurisdiction-authorizations` | Registrar/renovar autorización jurisdiccional (licencia) | ALTO | 5 | sesión (sin roles) |
| 32 | DELETE | `/profiles/practitioners/{profileId}/photo` | Quitar la foto del perfil profesional | ALTO | 16 | sesión (sin roles) |
| 33 | PUT | `/profiles/practitioners/{profileId}/photo` | Fijar la foto del perfil profesional | ALTO | 18 | sesión (sin roles) |
| 34 | POST | `/profiles/practitioners/{profileId}/specialties` | Agregar especialidad con credencial de soporte | ALTO | 9 | sesión (sin roles) |
| 35 | GET | `/profiles/practitioners/{profileId}/summary` | Consultar el perfil profesional de un colega (ficha de la guía) | BAJO | 15 | sesión (sin roles) |
| 36 | PATCH | `/profiles/practitioners/me` | Editar la presentación del propio perfil profesional | ALTO | 26 | sesión (sin roles) |
| 37 | GET | `/profiles/practitioners/me/affiliations` | Historial laboral propio (instituciones donde trabajó) | BAJO | 3 | sesión (sin roles) |
| 38 | POST | `/profiles/practitioners/me/affiliations` | Registrar una afiliación institucional en el historial propio | ALTO | 25 | sesión (sin roles) |
| 39 | DELETE | `/profiles/practitioners/me/affiliations/{affiliationId}` | Quitar una afiliación del historial laboral propio | ALTO | 4 | sesión (sin roles) |
| 40 | PATCH | `/profiles/practitioners/me/affiliations/{affiliationId}` | Corregir una afiliación del historial laboral propio | ALTO | 4 | sesión (sin roles) |
| 41 | POST | `/profiles/practitioners/me/credentials` | Agregar un título propio (diplomado, maestría, doctorado…) | ALTO | 5 | sesión (sin roles) |
| 42 | DELETE | `/profiles/practitioners/me/credentials/{credentialId}` | Retirar un título propio pendiente | ALTO | 4 | sesión (sin roles) |
| 43 | PATCH | `/profiles/practitioners/me/credentials/{credentialId}` | Editar un título propio pendiente de verificación | ALTO | 6 | sesión (sin roles) |
| 44 | DELETE | `/profiles/practitioners/me/jurisdiction-authorizations/{licenseId}` | Retirar una matrícula propia pendiente de verificación | ALTO | 6 | sesión (sin roles) |
| 45 | PATCH | `/profiles/practitioners/me/jurisdiction-authorizations/{licenseId}` | Corregir una matrícula propia pendiente de verificación | BAJO | 6 | sesión (sin roles) |
| 46 | GET | `/profiles/practitioners/me/linkable-organizations` | Buscar instituciones del padrón para declarar una afiliación | BAJO | 5 | sesión (sin roles) |
| 47 | GET | `/profiles/practitioners/me/onboarding` | Qué le falta al profesional para completar su alta | BAJO | 7 | sesión (sin roles) |
| 48 | GET | `/profiles/practitioners/me/signature-assets` | Consultar las imágenes de firma y sello propias | BAJO | 2 | sesión (sin roles) |
| 49 | PUT | `/profiles/practitioners/me/signature-assets` | Guardar o quitar las imágenes de firma y sello propias | ALTO | 5 | sesión (sin roles) |
| 50 | DELETE | `/profiles/practitioners/me/specialties/{specialtyId}` | Retirar una especialidad propia pendiente de verificación | ALTO | 4 | sesión (sin roles) |
| 51 | PATCH | `/profiles/practitioners/me/specialties/{specialtyId}` | Corregir una especialidad propia pendiente de verificación | ALTO | 7 | sesión (sin roles) |
| 52 | PATCH | `/profiles/practitioners/me/specialties/{specialtyId}/primary` | Marcar una especialidad propia como la principal | ALTO | 4 | sesión (sin roles) |
| 53 | GET | `/profiles/practitioners/me/summary` | Consultar el perfil profesional propio (trayectoria y actividad) | BAJO | 15 | sesión (sin roles) |
| 54 | GET | `/profiles/practitioners/specialty-counts` | Contar profesionales visibles por especialidad | BAJO | 2 | sesión (sin roles) |
| 55 | GET | `/tenants/{tenantId}/practitioner-requests` | Solicitudes de médicos que piden atender en la organización | BAJO | 5 | sesión (sin roles) |
| 56 | POST | `/tenants/{tenantId}/practitioner-requests/{affiliationId}/approve` | Aprobar la solicitud de un profesional | ALTO | 19 | sesión (sin roles) |
| 57 | POST | `/tenants/{tenantId}/practitioner-requests/{affiliationId}/reject` | Rechazar la solicitud de un profesional | ALTO | 19 | sesión (sin roles) |
| 58 | POST | `/tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke` | Dar de baja un vínculo ya aprobado | ALTO | 19 | sesión (sin roles) |

---

## 1. GET /profiles/credentials

- **Origen:** CONTRATO
- **Nombre:** Listar credenciales pendientes de verificación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.listPendingCredentials` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:782`

### Qué es y para qué sirve (negocio)

Listar credenciales pendientes de verificación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/credentials` la atiende `ProfilesPractitionersController.listPendingCredentials` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:782). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ProfilesPractitionersService.listPendingCredentials`. Lee profiles.professional_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:782` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPendingCredentials → ProfilesPractitionersService.listPendingCredentials → ProfessionalCredentialsRepository.findByStatePage | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:219` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `state` | query | No | `string` | Concepto de estado (por defecto, pendiente) |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Credenciales por página |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListPendingCredentialsResponseDto>` · DTO `ListPendingCredentialsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PendingCredentialSummaryDto>` | Sí | — | — | Credenciales de esta página, ordenadas por `id`. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:109` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:74` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid | — | Profesional dueño de la credencial. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:78` |
| `items[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | Concepto del tipo de credencial (matrícula, título, certificación). | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:82` |
| `items[].number` | `string` | Sí | — | — | Número de matrícula o de documento declarado. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:86` |
| `items[].issuingInstitutionText` | `string` | No | — | — | Institución u organismo emisor, en texto libre. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:90` |
| `items[].fileId` | `string` | No | formato uuid | — | Archivo adjunto (diploma o certificado), si se cargó uno. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:94` |
| `items[].state` | `string` | Sí | formato uuid | — | Estado actual de la credencial. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:98` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha en que se cargó la credencial. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:102` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:112` |
| `limit` | `number` | Sí | — | — | Tope aplicado a la consulta. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:115` |
| `nextCursor` | `string` | Sí | admite null | — | Cursor opaco de continuación, o `null` si ésta es la última página. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:119` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /profiles/credentials/{credentialId}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar credencial profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.verifyCredential` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:813`

### Qué es y para qué sirve (negocio)

Verificar credencial profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/credentials/{credentialId}/verify` la atiende `ProfilesPractitionersController.verifyCredential` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:813). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `VerifyCredentialDto` (2 campos, 1 obligatorio). Delega en `ProfilesPractitionersService.verifyCredential`. Crea filas en authz.user_role_assignments. Actualiza profiles.health_practitioner_profiles, profiles.professional_credentials. Lee authz.roles, authz.user_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links, profiles.professional_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:813` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: credentialId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:813` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → PractitionerContextAdapter.ensurePractitionerRole → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:139` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → PractitionerContextAdapter.ensurePractitionerRole → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:123` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → PractitionerContextAdapter.ensurePractitionerRole → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:73` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential | `src/modules/profiles/application/services/profiles-practitioners.service.ts:2254` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.professional_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential | `src/modules/profiles/application/services/profiles-practitioners.service.ts:2230` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → ProfessionalCredentialsRepository.findByIdForUpdate | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:104` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `credentialId` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: VERIFIED, REJECTED | `@IsIn(['VERIFIED', 'REJECTED'])` | Resultado de la verificación | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:17` |
| `verificationSourceUri` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | URI de la fuente de verificación consultada (registro del colegio profesional, resolución de la autoridad). OBLIGATORIA cuando la decisión es VERIFIED: habilitar a un profesional sin declarar contra qué se comprobó su matrícula no deja rastro auditable. Para REJECTED es opcional, porque se puede rechazar por defectos de forma del propio documento sin consultar a nadie. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:34` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "VERIFIED"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "VERIFIED",
  "verificationSourceUri": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CredentialResponseDto>` · DTO `CredentialResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:43` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado de la credencial | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:52` |
| `verifiedAt` | `string` | No | formato date-time | — | Valor de verified at mantenido por la instancia. | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:58` |
| `practitionerVerified` | `boolean` | Sí | — | — | true si al verificar quedó habilitado todo el perfil profesional | `src/modules/profiles/presentation/dto/verify-credential.dto.ts:67` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Credencial no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una credencial verificada debe declarar la fuente consultada; PreconditionFailedException: La credencial no está pendiente de verificación |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:129` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. GET /profiles/patients

- **Origen:** CONTRATO
- **Nombre:** UC-05-13: listado paginado de pacientes
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.searchPatients` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:309`

### Qué es y para qué sirve (negocio)

UC-05-13: listado paginado de pacientes. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients` la atiende `ProfilesPatientsController.searchPatients` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:309). Exige sesión con alguno de los roles SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER. Delega en `ProfilesPatientsService.searchPatients`. Lee common.identifiers, profiles.patient_profiles, profiles.persons, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:309` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | LEE | LEE | POR_SQL | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PatientProfilesRepository.searchPage | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:166` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PatientProfilesRepository.searchPage | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:190` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PersonsRepository.findByIds | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:113` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto a buscar en el código de paciente o el nombre |
| `nationalId` | query | No | `string` | Documento de identidad exacto (`common.identifiers.value`) |
| `issuerAdministrativeAreaConceptId` | query | No | `string` | Departamento que expidió el documento (VS_BO_DEPARTMENT); sólo tiene efecto junto a nationalId |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Tope de resultados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchPatientsResponseDto>` · DTO `SearchPatientsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PatientListItemDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:121` |
| `items[].profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:20` |
| `items[].personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:26` |
| `items[].patientCode` | `string` | Sí | — | — | Código único de paciente | `src/modules/profiles/presentation/dto/read-patients.dto.ts:32` |
| `items[].displayName` | `string` | No | — | — | Nombre visible de la persona | `src/modules/profiles/presentation/dto/read-patients.dto.ts:38` |
| `items[].birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:44` |
| `items[].personStatusConceptId` | `string` | No | formato uuid | — | Concept id del estado de la persona | `src/modules/profiles/presentation/dto/read-patients.dto.ts:53` |
| `items[].deceased` | `boolean` | Sí | — | — | Si la persona está registrada como fallecida. Es un booleano derivado y no un concepto: una lista de pacientes tiene que poder marcarlo sin resolver terminología | `src/modules/profiles/presentation/dto/read-patients.dto.ts:62` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/profiles/presentation/dto/read-patients.dto.ts:127` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:133` |
| `nextCursor` | `object` | No | admite null | — | Cursor opaco para la página siguiente; `null` cuando no hay más | `src/modules/profiles/presentation/dto/read-patients.dto.ts:143` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Busque por nombre, código o documento: no se puede listar el padrón completo de pacientes; PreconditionFailedException: El catálogo de departamentos no está disponible; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:96` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /profiles/patients

- **Origen:** CONTRATO
- **Nombre:** Alta de persona y perfil de paciente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.registerPatient` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:444`

### Qué es y para qué sirve (negocio)

Alta de persona y perfil de paciente. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients` la atiende `ProfilesPatientsController.registerPatient` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:444). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePatientDto` (6 campos, 1 obligatorio). Delega en `ProfilesPatientsService.registerPatient`. Crea filas en profiles.patient_profiles, profiles.person_profiles, profiles.persons. Lee profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:444` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PatientProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:220` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PatientProfilesRepository.findByPatientCode | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:209` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |

### Cuerpo — DTO `CreatePatientDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de paciente (patient_code, UK) | `src/modules/profiles/presentation/dto/create-patient.dto.ts:23` |
| `displayName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre visible de la persona | `src/modules/profiles/presentation/dto/create-patient.dto.ts:32` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de nacimiento (ISO 8601) | `src/modules/profiles/presentation/dto/create-patient.dto.ts:43` |
| `administrativeGenderConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de género administrativo | `src/modules/profiles/presentation/dto/create-patient.dto.ts:54` |
| `sexAtBirthConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de sexo al nacer | `src/modules/profiles/presentation/dto/create-patient.dto.ts:65` |
| `masterPatientIndexCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código MPI maestro (UK) | `src/modules/profiles/presentation/dto/create-patient.dto.ts:77` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientCode": "CODIGO_EJEMPLO",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "administrativeGenderConceptId": "00000000-0000-4000-8000-000000000001",
  "sexAtBirthConceptId": "00000000-0000-4000-8000-000000000001",
  "masterPatientIndexCode": "CODIGO_EJEMPLO"
}
```

</details>

### Respuesta — `Promise<PatientProfileResponseDto>` · DTO `PatientProfileResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | Identificador asociado a profile. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:86` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:92` |
| `patientCode` | `string` | Sí | — | — | Valor de patient code mantenido por la instancia. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:98` |
| `recordLinkageStatus` | `string` | Sí | formato uuid | — | Concept id del estado de vinculación | `src/modules/profiles/presentation/dto/create-patient.dto.ts:107` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:113` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El patient_code ya está en uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:43` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:53` |
| INTEGRACION | `test/integration/fx11-notas-de-evolucion-coleccion.int-spec.ts:107` |
| INTEGRACION | `test/integration/fx15-documentos-del-expediente.int-spec.ts:108` |
| INTEGRACION | `test/integration/identity-verification-cycle.int-spec.ts:48` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:55` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:73` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. GET /profiles/patients/{profileId}

- **Origen:** CONTRATO
- **Nombre:** UC-05-14: ficha de filiación de un paciente (F-01)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.getPatient` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:425`

### Qué es y para qué sirve (negocio)

UC-05-14: ficha de filiación de un paciente (F-01). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/{profileId}` la atiende `ProfilesPatientsController.getPatient` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:425). Exige sesión con alguno de los roles SECURITY_ADMIN, CLINICIAN, PRACTITIONER. Delega en `ClinicalPatientHistoryAccessPort.assertCanReadHistory`, `ProfilesPatientsService.getPatientById`. Lee profiles.patient_profiles, profiles.persons, profiles.related_persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, CLINICIAN, PRACTITIONER | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:425` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:425` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.getPatient → ProfilesPatientsService.getPatientById → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getPatient → ProfilesPatientsService.getPatientById → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getPatient → ProfilesPatientsService.getPatientById → RelatedPersonsRepository.findActiveByPatient | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:98` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientDetailResponseDto>` · DTO `PatientDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | Identificador asociado a profile. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:194` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:200` |
| `patientCode` | `string` | Sí | — | — | Valor de patient code mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:206` |
| `masterPatientIndexCode` | `string` | No | — | — | Valor de master patient index code mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:212` |
| `displayName` | `string` | No | — | — | Valor de display name mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:218` |
| `birthDate` | `string` | No | formato date | — | Valor de birth date mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:224` |
| `administrativeGenderConceptId` | `string` | No | formato uuid | — | Identificador asociado a administrative gender concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:230` |
| `sexAtBirthConceptId` | `string` | No | formato uuid | — | Identificador asociado a sex at birth concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:236` |
| `genderIdentityConceptId` | `string` | No | formato uuid | — | Identificador asociado a gender identity concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:242` |
| `nationalityConceptId` | `string` | No | formato uuid | — | Identificador asociado a nationality concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:248` |
| `preferredLanguageConceptId` | `string` | No | formato uuid | — | Identificador asociado a preferred language concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:254` |
| `personStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a person status concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:260` |
| `vitalStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a vital status concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:266` |
| `deceasedAt` | `string` | No | formato date-time | — | Valor de deceased at mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:272` |
| `aboGroupConceptId` | `string` | No | formato uuid | — | Identificador asociado a abo group concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:278` |
| `rhFactorConceptId` | `string` | No | formato uuid | — | Identificador asociado a rh factor concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:284` |
| `insuranceStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a insurance status concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:290` |
| `clinicalLanguageConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical language concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:296` |
| `recordLinkageStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a record linkage status concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:302` |
| `relatedPersons` | `array<RelatedPersonItemDto>` | Sí | — | — | Contactos y representantes registrados (UC-05-10) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:311` |
| `relatedPersons[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:152` |
| `relatedPersons[].displayName` | `string` | No | — | — | Valor de display name mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:158` |
| `relatedPersons[].relationshipConceptId` | `string` | No | formato uuid | — | Identificador asociado a relationship concept. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:164` |
| `relatedPersons[].isEmergencyContact` | `boolean` | Sí | — | — | Valor de is emergency contact mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:170` |
| `relatedPersons[].isLegalGuardian` | `boolean` | Sí | — | — | Valor de is legal guardian mantenido por la instancia. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:176` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:317` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:323` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:84` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:58` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /profiles/patients/{profileId}/identity-links

- **Origen:** CONTRATO
- **Nombre:** Vincular identidad externa de paciente (MPI)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.addIdentityLink` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:479`

### Qué es y para qué sirve (negocio)

Vincular identidad externa de paciente (MPI). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/{profileId}/identity-links` la atiende `ProfilesPatientsController.addIdentityLink` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:479). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AddIdentityLinkDto` (6 campos, 3 obligatorios). Delega en `ProfilesPatientsService.addIdentityLink`. Crea filas en profiles.patient_identity_links. Actualiza profiles.patient_identity_links, profiles.patient_profiles. Lee profiles.patient_identity_links, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:479` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:479` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_identity_links` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink | `src/modules/profiles/application/services/profiles-patients.service.ts:2067` |
| `profiles.patient_identity_links` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink → PatientIdentityLinksRepository.create | `src/modules/profiles/infrastructure/repositories/patient-identity-links.repository.ts:78` |
| `profiles.patient_identity_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink → PatientIdentityLinksRepository.findBySource | `src/modules/profiles/infrastructure/repositories/patient-identity-links.repository.ts:60` |
| `profiles.patient_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink | `src/modules/profiles/application/services/profiles-patients.service.ts:2092` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddIdentityLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant origen de la identidad externa | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:24` |
| `sourcePatientIdentifier` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Identificador del paciente en el sistema origen | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:36` |
| `sourceSystemUri` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | URI del sistema origen | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:45` |
| `linkTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de vínculo | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:56` |
| `confidenceScore` | `number` | Sí | mínimo 0; máximo 1 | `@IsNumber()` `@Min(0)` `@Max(1)` | Puntuación de confianza [0..1] | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:69` |
| `verified` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca el vínculo como verificado | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:77` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "sourceTenantId": "00000000-0000-4000-8000-000000000001",
  "sourcePatientIdentifier": "valor-ejemplo",
  "confidenceScore": 1
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "sourceTenantId": "00000000-0000-4000-8000-000000000001",
  "sourcePatientIdentifier": "valor-ejemplo",
  "sourceSystemUri": "valor-ejemplo",
  "linkTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "confidenceScore": 1,
  "verified": true
}
```

</details>

### Respuesta — `Promise<IdentityLinkResponseDto>` · DTO `IdentityLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:86` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:92` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:101` |
| `created` | `boolean` | Sí | — | — | true si el registro se creó, false si se actualizó (upsert) | `src/modules/profiles/presentation/dto/add-identity-link.dto.ts:109` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:96` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /profiles/patients/{profileId}/portal-proxies

- **Origen:** CONTRATO
- **Nombre:** Otorgar proxy de portal a un representante
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.grantPortalProxy` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:551`

### Qué es y para qué sirve (negocio)

Otorgar proxy de portal a un representante. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/{profileId}/portal-proxies` la atiende `ProfilesPatientsController.grantPortalProxy` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:551). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GrantPortalProxyDto` (6 campos, 3 obligatorios). Delega en `ProfilesPatientsService.grantPortalProxy`. Crea filas en profiles.patient_portal_proxies. Actualiza profiles.patient_portal_proxies. Lee profiles.patient_profiles, profiles.related_persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:551` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:551` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → PatientPortalProxiesRepository.revokeActiveForProxyUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:502` |
| `profiles.patient_portal_proxies` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → PatientPortalProxiesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:168` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.related_persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → RelatedPersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:57` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `GrantPortalProxyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proxyUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario representante al que se delega el acceso | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:14` |
| `relatedPersonId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona relacionada que respalda el proxy (UC-05-10) | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:25` |
| `scopeValueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Value set que gobierna el alcance delegado | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:35` |
| `legalBasisRecordId` | `string` | Sí | formato uuid | `@IsUUID()` | Registro de base legal que respalda el acceso | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:45` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date-time) | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:56` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date-time) | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "proxyUserId": "00000000-0000-4000-8000-000000000001",
  "scopeValueSetId": "00000000-0000-4000-8000-000000000001",
  "legalBasisRecordId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "proxyUserId": "00000000-0000-4000-8000-000000000001",
  "relatedPersonId": "00000000-0000-4000-8000-000000000001",
  "scopeValueSetId": "00000000-0000-4000-8000-000000000001",
  "legalBasisRecordId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<PortalProxyResponseDto>` · DTO `PortalProxyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:76` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:82` |
| `proxyUserId` | `string` | Sí | formato uuid | — | Identificador asociado a proxy user. | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:88` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del proxy | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:97` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/grant-portal-proxy.dto.ts:103` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La persona relacionada no pertenece al paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:139` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. POST /profiles/patients/{profileId}/related-persons

- **Origen:** CONTRATO
- **Nombre:** Registrar persona relacionada / contacto de emergencia
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.addRelatedPerson` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:532`

### Qué es y para qué sirve (negocio)

Registrar persona relacionada / contacto de emergencia. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/{profileId}/related-persons` la atiende `ProfilesPatientsController.addRelatedPerson` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:532). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AddRelatedPersonDto` (6 campos, 0 obligatorios). Delega en `ProfilesPatientsService.addRelatedPerson`. Crea filas en profiles.persons, profiles.related_persons. Lee profiles.patient_profiles, profiles.person_account_links, profiles.persons, profiles.related_persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:532` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:532` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → RelatedPersonsRepository.create | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:68` |
| `profiles.related_persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → RelatedPersonsRepository.findActiveGuardian | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:133` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddRelatedPersonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona relacionada existente; si se omite se crea una nueva | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:22` |
| `displayName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre visible (si se crea la persona relacionada) | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:33` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de nacimiento (ISO date) | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:44` |
| `relationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del parentesco/relación | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:55` |
| `isEmergencyContact` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Es contacto de emergencia | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:66` |
| `isLegalGuardian` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Es tutor legal (único activo por paciente) | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:77` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "personId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "birthDate": "2026-07-31",
  "relationshipConceptId": "00000000-0000-4000-8000-000000000001",
  "isEmergencyContact": false,
  "isLegalGuardian": false
}
```

</details>

### Respuesta — `Promise<RelatedPersonResponseDto>` · DTO `RelatedPersonResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:86` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:92` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:98` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:104` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/add-related-person.dto.ts:110` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil o la plataforma pueden modificarlo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado; ResourceNotFoundException: Persona relacionada no encontrada |
| 409 | `CONFLICT` | ConflictException: El paciente ya tiene un tutor legal activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:108` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:124` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. GET /profiles/patients/me

- **Origen:** CONTRATO
- **Nombre:** Consultar los propios datos de filiación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.getOwnProfile` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:121`

### Qué es y para qué sirve (negocio)

Consultar los propios datos de filiación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/me` la atiende `ProfilesPatientsController.getOwnProfile` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:121). Exige sesión; el controlador no declara roles. Delega en `ProfilesPatientsService.getOwnProfile`. Lee common.addresses, common.contact_points, common.identifiers, insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → PersonRecordsAdapter.findCurrentContact → ContactPointsRepository.findCurrentByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:126` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readIdentifiers → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_plan_benefits` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:168` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `profiles.patient_portal_proxies` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readGuardians → PatientPortalProxiesRepository.listActiveGuardiansOfPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:311` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.emergencyReadContacts → RelatedPersonsRepository.listActiveEmergencyContactsOfPatient | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:111` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OwnPatientProfileResponseDto>` · DTO `OwnPatientProfileResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:521` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:527` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/presentation/dto/read-patients.dto.ts:533` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:539` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:545` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:551` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:560` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/presentation/dto/read-patients.dto.ts:571` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:581` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:596` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:606` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:618` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:622` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:630` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:640` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:649` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:658` |
| `nationalId` | `string` | No | — | — | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:669` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:675` |
| `taxId` | `string` | No | — | — | NIT para facturación | `src/modules/profiles/presentation/dto/read-patients.dto.ts:678` |
| `taxHolderName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:682` |
| `email` | `string` | No | — | — | Correo de contacto vigente | `src/modules/profiles/presentation/dto/read-patients.dto.ts:685` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil (id de archivo en `common.files`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:700` |
| `homeAddress` | `OwnAddressDto` | No | — | — | Domicilio, con calle y punto en el mapa si los declaró | `src/modules/profiles/presentation/dto/read-patients.dto.ts:706` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `workAddress` | `OwnAddressDto` | No | — | — | Dirección de trabajo | `src/modules/profiles/presentation/dto/read-patients.dto.ts:712` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `coverages` | `array<OwnCoverageDto>` | Sí | — | — | Seguros declarados. Vacío si no declaró ninguno. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:718` |
| `coverages[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:394` |
| `coverages[].carrierName` | `string` | Sí | — | — | Aseguradora, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:397` |
| `coverages[].planName` | `string` | No | — | — | Plan contratado, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:400` |
| `coverages[].isPublic` | `boolean` | Sí | — | — | Si el seguro es público o privado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:403` |
| `coverages[].policyIdentifier` | `string` | No | — | — | Número de póliza declarado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:406` |
| `coverages[].memberIdentifier` | `string` | No | — | — | Con qué documento figura afiliado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:409` |
| `coverages[].verified` | `boolean` | Sí | — | — | Si la plataforma confirmó la cobertura con la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:414` |
| `coverages[].status` | `string` | No | — | — | Estado legible de la cobertura | `src/modules/profiles/presentation/dto/read-patients.dto.ts:417` |
| `coverages[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:420` |
| `coverages[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:425` |
| `coverages[].referenceDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:428` |
| `coverages[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:431` |
| `coverages[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:434` |
| `coverages[].currencyCode` | `string` | No | — | — | Código de moneda del plan | `src/modules/profiles/presentation/dto/read-patients.dto.ts:437` |
| `coverages[].carrierWhatsappNumber` | `string` | No | — | — | Canal oficial de WhatsApp de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:442` |
| `coverages[].carrierCallCenterPhone` | `string` | No | — | — | Call center oficial de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:445` |
| `coverages[].benefits` | `array<CoverageBenefitSummaryDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:448` |
| `coverages[].benefits[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:352` |
| `coverages[].benefits[].categoryCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:355` |
| `coverages[].benefits[].categoryName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:358` |
| `coverages[].benefits[].serviceConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:361` |
| `coverages[].benefits[].serviceName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:364` |
| `coverages[].benefits[].coveragePercent` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:368` |
| `coverages[].benefits[].copayAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:371` |
| `coverages[].benefits[].deductibleAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:374` |
| `coverages[].benefits[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:377` |
| `coverages[].benefits[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:382` |
| `coverages[].benefits[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:385` |
| `coverages[].benefits[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:388` |
| `coverages[].planId` | `string` | No | formato uuid | — | Plan de salud elegido | `src/modules/profiles/presentation/dto/read-patients.dto.ts:451` |
| `coverages[].coverageOrder` | `number` | Sí | — | — | Orden de la cobertura: 1 privada, 2 pública | `src/modules/profiles/presentation/dto/read-patients.dto.ts:454` |
| `emergencyContacts` | `array<OwnEmergencyContactDto>` | Sí | — | — | Contactos de emergencia activos. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:724` |
| `emergencyContacts[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:487` |
| `emergencyContacts[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:493` |
| `emergencyContacts[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:496` |
| `emergencyContacts[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:499` |
| `guardians` | `array<OwnGuardianDto>` | Sí | — | — | Representantes con apoderamiento activo, con su parentesco. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:730` |
| `guardians[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:466` |
| `guardians[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:472` |
| `guardians[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:475` |
| `guardians[].isLegalGuardian` | `boolean` | Sí | — | — | Es su representante legal | `src/modules/profiles/presentation/dto/read-patients.dto.ts:478` |
| `guardians[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:481` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-coverage-copays.int-spec.ts:351` |
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:75` |
| INTEGRACION | `test/integration/quitar-punto-del-mapa.int-spec.ts:147` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:161` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. PATCH /profiles/patients/me

- **Origen:** CONTRATO
- **Nombre:** Editar los propios datos de filiación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.updateOwnProfile` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:147`

### Qué es y para qué sirve (negocio)

Editar los propios datos de filiación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/patients/me` la atiende `ProfilesPatientsController.updateOwnProfile` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:147). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnPatientProfileDto` (27 campos, 0 obligatorios). Delega en `ProfilesPatientsService.updateOwnProfile`. Crea filas en common.contact_points, common.identifiers. Actualiza common.addresses, common.contact_points, profiles.persons, profiles.related_persons. Lee common.addresses, common.contact_points, common.identifiers, insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:147` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replaceAddress → PersonRecordsAdapter.closeAddress → AddressesRepository.closeCurrent | `src/modules/common/repositories/addresses.repository.ts:112` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replaceAddress → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replacePhone → PersonRecordsAdapter.closeContact → ContactPointsRepository.closeCurrent | `src/modules/common/repositories/contact-points.repository.ts:192` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replacePhone → PersonRecordsAdapter.createContact → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replacePhone → PersonRecordsAdapter.findCurrentContact → ContactPointsRepository.findCurrentByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:126` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replaceNit → PersonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replaceNit → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_plan_benefits` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:168` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.patient_coverages` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.declareCoverage → PatientCoveragesAdapter.isDeclared → CoverageRepository.findActiveByPatientAndOrder | `src/modules/insurance/infrastructure/repositories/coverage.repository.ts:80` |
| `profiles.patient_portal_proxies` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readGuardians → PatientPortalProxiesRepository.listActiveGuardiansOfPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:311` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.rebuildDisplayName | `src/modules/profiles/application/services/profiles-patients.service.ts:1334` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replaceTutor | `src/modules/profiles/application/services/profiles-patients.service.ts:1688` |
| `profiles.related_persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.replaceTutor → RelatedPersonsRepository.findActiveDeclaredGuardian | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:159` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |

### Cuerpo — DTO `UpdateOwnPatientProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:101` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:113` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:126` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:138` |
| `birthDate` | `object` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:146` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:159` |
| `occupationConceptId` | `string` | No | formato uuid | `@ValidateIf( (dto: UpdateOwnPatientProfileDto) => dto.occupationConceptId !== '', )` `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:192` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:209` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@ValidateIf((dto: UpdateOwnPatientProfileDto) => dto.phone !== '')` `@IsOptional()` `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres. Cadena vacía para quedarse sin teléfono. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:234` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:249` |
| `taxId` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | NIT para facturación. Cadena vacía para quedarse sin NIT. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:266` |
| `taxHolderName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre o razón social del titular del NIT. Cadena vacía para quitarla. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:286` |
| `homeAddressLines` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Domicilio, tal como lo escribe la persona. Vacío para quitarlo. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:308` |
| `workAddressLines` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Dirección de trabajo. Vacío para quitarla. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:317` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:332` |
| `homeLatitude` | `object` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: UpdateOwnPatientProfileDto) => !removesDot(dto.homeLatitude, dto.homeLongitude) && (dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined), )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:346` |
| `homeLongitude` | `object` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: UpdateOwnPatientProfileDto) => !removesDot(dto.homeLatitude, dto.homeLongitude) && (dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined), )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:358` |
| `workMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio del trabajo (catálogo VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:369` |
| `workLatitude` | `object` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: UpdateOwnPatientProfileDto) => !removesDot(dto.workLatitude, dto.workLongitude) && (dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined), )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:381` |
| `workLongitude` | `object` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: UpdateOwnPatientProfileDto) => !removesDot(dto.workLatitude, dto.workLongitude) && (dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined), )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:393` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@ValidateIf( (dto: UpdateOwnPatientProfileDto) => dto.workEmployerConceptId !== '', )` `@IsOptional()` `@IsUUID()` | Empresa donde trabaja (VS_BO_EMPLOYER). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:410` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre. Cadena vacía para borrarla. Se descarta si viene el concepto. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:424` |
| `guardianName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre del tutor o persona autorizada. No hay forma de quitarlo, sólo de declararlo o corregirlo. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:444` |
| `guardianPhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono del tutor, en formato E.164 o nacional | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:461` |
| `guardianRelationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Parentesco del tutor o contacto de emergencia (conjunto related-person-relationship) | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:474` |
| `privateInsurancePlanId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plan de la aseguradora privada declarada. Sólo si la persona no tenía ninguna ya. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:494` |
| `publicInsurancePlanId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plan del seguro público declarado. Sólo si la persona no tenía ninguno ya. | `src/modules/profiles/presentation/dto/update-own-patient-profile.dto.ts:507` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Lucía",
  "middleName": "Andrea",
  "lastName": "Mamani",
  "motherLastName": "Quispe",
  "birthDate": {},
  "sexAtBirth": "MALE",
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "homeAddressLines": "valor-ejemplo",
  "workAddressLines": "valor-ejemplo",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "homeLatitude": {},
  "homeLongitude": {},
  "workMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "workLatitude": {},
  "workLongitude": {},
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "guardianName": "Nombre de ejemplo",
  "guardianPhone": "+59170000000",
  "guardianRelationshipConceptId": "00000000-0000-4000-8000-000000000001",
  "privateInsurancePlanId": "00000000-0000-4000-8000-000000000001",
  "publicInsurancePlanId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<OwnPatientProfileResponseDto>` · DTO `OwnPatientProfileResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:521` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:527` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/presentation/dto/read-patients.dto.ts:533` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:539` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:545` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:551` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:560` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/presentation/dto/read-patients.dto.ts:571` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:581` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:596` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:606` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:618` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:622` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:630` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:640` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:649` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:658` |
| `nationalId` | `string` | No | — | — | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:669` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:675` |
| `taxId` | `string` | No | — | — | NIT para facturación | `src/modules/profiles/presentation/dto/read-patients.dto.ts:678` |
| `taxHolderName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:682` |
| `email` | `string` | No | — | — | Correo de contacto vigente | `src/modules/profiles/presentation/dto/read-patients.dto.ts:685` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil (id de archivo en `common.files`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:700` |
| `homeAddress` | `OwnAddressDto` | No | — | — | Domicilio, con calle y punto en el mapa si los declaró | `src/modules/profiles/presentation/dto/read-patients.dto.ts:706` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `workAddress` | `OwnAddressDto` | No | — | — | Dirección de trabajo | `src/modules/profiles/presentation/dto/read-patients.dto.ts:712` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `coverages` | `array<OwnCoverageDto>` | Sí | — | — | Seguros declarados. Vacío si no declaró ninguno. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:718` |
| `coverages[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:394` |
| `coverages[].carrierName` | `string` | Sí | — | — | Aseguradora, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:397` |
| `coverages[].planName` | `string` | No | — | — | Plan contratado, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:400` |
| `coverages[].isPublic` | `boolean` | Sí | — | — | Si el seguro es público o privado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:403` |
| `coverages[].policyIdentifier` | `string` | No | — | — | Número de póliza declarado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:406` |
| `coverages[].memberIdentifier` | `string` | No | — | — | Con qué documento figura afiliado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:409` |
| `coverages[].verified` | `boolean` | Sí | — | — | Si la plataforma confirmó la cobertura con la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:414` |
| `coverages[].status` | `string` | No | — | — | Estado legible de la cobertura | `src/modules/profiles/presentation/dto/read-patients.dto.ts:417` |
| `coverages[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:420` |
| `coverages[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:425` |
| `coverages[].referenceDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:428` |
| `coverages[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:431` |
| `coverages[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:434` |
| `coverages[].currencyCode` | `string` | No | — | — | Código de moneda del plan | `src/modules/profiles/presentation/dto/read-patients.dto.ts:437` |
| `coverages[].carrierWhatsappNumber` | `string` | No | — | — | Canal oficial de WhatsApp de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:442` |
| `coverages[].carrierCallCenterPhone` | `string` | No | — | — | Call center oficial de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:445` |
| `coverages[].benefits` | `array<CoverageBenefitSummaryDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:448` |
| `coverages[].benefits[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:352` |
| `coverages[].benefits[].categoryCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:355` |
| `coverages[].benefits[].categoryName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:358` |
| `coverages[].benefits[].serviceConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:361` |
| `coverages[].benefits[].serviceName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:364` |
| `coverages[].benefits[].coveragePercent` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:368` |
| `coverages[].benefits[].copayAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:371` |
| `coverages[].benefits[].deductibleAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:374` |
| `coverages[].benefits[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:377` |
| `coverages[].benefits[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:382` |
| `coverages[].benefits[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:385` |
| `coverages[].benefits[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:388` |
| `coverages[].planId` | `string` | No | formato uuid | — | Plan de salud elegido | `src/modules/profiles/presentation/dto/read-patients.dto.ts:451` |
| `coverages[].coverageOrder` | `number` | Sí | — | — | Orden de la cobertura: 1 privada, 2 pública | `src/modules/profiles/presentation/dto/read-patients.dto.ts:454` |
| `emergencyContacts` | `array<OwnEmergencyContactDto>` | Sí | — | — | Contactos de emergencia activos. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:724` |
| `emergencyContacts[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:487` |
| `emergencyContacts[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:493` |
| `emergencyContacts[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:496` |
| `emergencyContacts[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:499` |
| `guardians` | `array<OwnGuardianDto>` | Sí | — | — | Representantes con apoderamiento activo, con su parentesco. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:730` |
| `guardians[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:466` |
| `guardians[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:472` |
| `guardians[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:475` |
| `guardians[].isLegalGuardian` | `boolean` | Sí | — | — | Es su representante legal | `src/modules/profiles/presentation/dto/read-patients.dto.ts:478` |
| `guardians[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:481` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:108` |
| INTEGRACION | `test/integration/quitar-punto-del-mapa.int-spec.ts:103` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:172` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. GET /profiles/patients/me/dependent-candidates

- **Origen:** CONTRATO
- **Nombre:** Buscar por nombre a quién pedirle que deje representarla
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesDependentRequestsController.listDependentCandidates` — `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:117`

### Qué es y para qué sirve (negocio)

Buscar por nombre a quién pedirle que deje representarla. Caso de uso H4 §C: Search accounts by name to choose whom to ask (≥3 letters, ≤8 rows, CI masked). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:109`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/me/dependent-candidates` la atiende `ProfilesDependentRequestsController.listDependentCandidates` (src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:117). Exige sesión; el controlador no declara roles. Delega en `DependentLinkRequestsService.findCandidates`. Lee common.identifiers, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:117` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 30, ttl: 60_000 } }) | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:117` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | LEE | LEE | POR_SQL | ProfilesDependentRequestsController.listDependentCandidates → DependentLinkRequestsService.findCandidates → PatientPortalProxiesRepository.searchRepresentableByName | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:450` |
| `profiles.patient_portal_proxies` | LEE | LEE | POR_SQL | ProfilesDependentRequestsController.listDependentCandidates → DependentLinkRequestsService.findCandidates → PatientPortalProxiesRepository.searchRepresentableByName | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:450` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.listDependentCandidates → DependentLinkRequestsService.findCandidates → DependentLinkRequestsService.ownPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.listDependentCandidates → DependentLinkRequestsService.findCandidates → DependentLinkRequestsService.ownPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.listDependentCandidates → DependentLinkRequestsService.findCandidates → DependentLinkRequestsService.ownPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Parte del nombre de la persona. Con menos de tres letras la respuesta es vacía |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DependentCandidateDto[]>` · DTO `DependentCandidateDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:125` |
| `displayName` | `string` | Sí | — | — | Nombre visible de la persona | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:129` |
| `maskedNationalId` | `string` | No | — | — | Documento enmascarado: sólo las últimas tres cifras | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:141` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene perfil de paciente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:251` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.spec.ts:118` |

### Flujos

- Profiles Module (05) — etapa `H4 §C`

---

## 12. POST /profiles/patients/me/dependent-requests

- **Origen:** CONTRATO
- **Nombre:** Pedir representar a una persona que ya tiene cuenta
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesDependentRequestsController.requestDependentLink` — `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:73`

### Qué es y para qué sirve (negocio)

Pedir representar a una persona que ya tiene cuenta. Caso de uso H4 §C: Ask to represent someone who already has an account (by CI or by chosen profile). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:108`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/me/dependent-requests` la atiende `ProfilesDependentRequestsController.requestDependentLink` (src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:73). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RequestDependentLinkDto` (2 campos, 0 obligatorios). Delega en `DependentLinkRequestsService.request`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, profiles.patient_portal_proxies. Actualiza iam.devices. Lee common.identifiers, iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs, messaging.recipient_preferences, profiles.patient_portal_proxies y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | Límite propio: Throttle({ default: { limit: 10, ttl: 60_000 } }) | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:73` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkRequestsService.recipientByDocument → DependentLinkContextAdapter.findActiveDuplicate → IdentifiersRepository.findActiveDuplicate | `src/modules/common/repositories/identifiers.repository.ts:80` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_portal_proxies` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → PatientPortalProxiesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:168` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkRequestsService.ownPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkRequestsService.ownPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.requestDependentLink → DependentLinkRequestsService.request → DependentLinkRequestsService.ownPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Cuerpo — DTO `RequestDependentLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `nationalId` | `string` | No | longitud máxima 60; patrón runtime /^\s*[A-Za-z0-9.-]{4,40}\s*$/ | `@ValidateIf( (dto: RequestDependentLinkDto) => dto.nationalId !== undefined \|\| dto.patientProfileId === undefined, )` `@IsString()` `@MaxLength(60)` `@Matches(/^\s*[A-Za-z0-9.-]{4,40}\s*$/, { message: 'El documento tiene entre 4 y 40 caracteres: letras, dígitos, punto y guion', })` | Documento de identidad de la persona a representar. Obligatorio si no se manda `patientProfileId` | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:78` |
| `patientProfileId` | `string` | No | formato uuid | `@ValidateIf( (dto: RequestDependentLinkDto) => dto.patientProfileId !== undefined, )` `@IsExclusiveWith('nationalId', { message: 'Mande el documento o el perfil elegido, no los dos', })` `@IsUUID()` | Perfil de paciente devuelto por `dependent-candidates`. Alternativa a `nationalId`: se manda uno u otro | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:98` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "nationalId": "7654321",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DependentLinkRequestSentDto>` · DTO `DependentLinkRequestSentDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:148` |
| `status` | `string` | Sí | valores: PENDING | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:152` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene perfil de paciente |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Esa persona ya no tiene una cuenta registrada.; ResourceNotFoundException: El proveedor configurado para el canal in-app no existe |
| 409 | `CONFLICT` | ConflictException: Esa persona ya es su dependiente.; ConflictException: Ya le envió una solicitud a esa persona. Falta que la acepte. |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese CI es el suyo: no puede registrarse como su propio dependiente.; PreconditionFailedException: No hay canal in-app activo: falta correr el seed de mensajería; PreconditionFailedException: El canal in-app no tiene configuración de proveedor activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:101` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.spec.ts:59` |

### Flujos

- Profiles Module (05) — etapa `H4 §C`

---

## 13. POST /profiles/patients/me/dependent-requests/{id}/accept

- **Origen:** CONTRATO
- **Nombre:** Aceptar una solicitud de dependiente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesDependentRequestsController.acceptDependentLinkRequest` — `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:159`

### Qué es y para qué sirve (negocio)

Aceptar una solicitud de dependiente. Caso de uso H4 §C: Accept: the requester becomes the representative. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:111`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/me/dependent-requests/{id}/accept` la atiende `ProfilesDependentRequestsController.acceptDependentLinkRequest` (src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:159). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AcceptDependentLinkRequestDto` (1 campo, 0 obligatorios). Delega en `DependentLinkRequestsService.accept`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, profiles.related_persons. Actualiza iam.devices. Lee iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs, messaging.recipient_preferences, profiles.patient_portal_proxies, profiles.patient_profiles y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:159` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:159` |
| CUERPO | application/json; máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → PatientPortalProxiesRepository.findActiveByProxyUserAndPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:233` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.pendingRequest → DependentLinkRequestsService.ownPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → DependentLinkRequestsService.pendingRequest → DependentLinkRequestsService.ownPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.acceptDependentLinkRequest → DependentLinkRequestsService.accept → RelatedPersonsRepository.create | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:68` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AcceptDependentLinkRequestDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `relationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` `@IsIn(DEPENDENT_RELATIONSHIP_CONCEPT_IDS)` | Parentesco de quien representará al paciente | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:185` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "relationshipConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DependentLinkRequestDecisionDto>` · DTO `DependentLinkRequestDecisionDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:192` |
| `status` | `string` | Sí | valores: ACCEPTED, REJECTED | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:196` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 409 | `CONFLICT` | ConflictException: Esa solicitud ya fue respondida.; ConflictException: Esa persona ya le representa. Puede rechazar esta solicitud.; ConflictException: La cuenta que lo pidió ya no está activa. Puede rechazar esta solicitud. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:178` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.spec.ts:71` |

### Flujos

- Profiles Module (05) — etapa `H4 §C`

---

## 14. POST /profiles/patients/me/dependent-requests/{id}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar una solicitud de dependiente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesDependentRequestsController.rejectDependentLinkRequest` — `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:186`

### Qué es y para qué sirve (negocio)

Rechazar una solicitud de dependiente. Caso de uso H4 §C: Reject: no link is created. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:112`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/me/dependent-requests/{id}/reject` la atiende `ProfilesDependentRequestsController.rejectDependentLinkRequest` (src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:186). Exige sesión; el controlador no declara roles. Delega en `DependentLinkRequestsService.reject`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza iam.devices. Lee iam.devices, messaging.in_app_notifications, messaging.message_channels, messaging.messaging_providers, messaging.provider_channel_configs, messaging.recipient_preferences, profiles.patient_portal_proxies, profiles.patient_profiles y 2 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:186` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:186` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.in_app_notifications` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findUnreadInAppForResource | `src/modules/messaging/repositories/notifications.repository.ts:845` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findActiveChannelByType | `src/modules/messaging/repositories/notifications.repository.ts:189` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.notifyResponse → DependentLinkContextAdapter.emitInApp → NotificationsService.emitInApp → NotificationsService.writeInApp → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `profiles.patient_portal_proxies` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.pendingRequest → PatientPortalProxiesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:355` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.pendingRequest → DependentLinkRequestsService.ownPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.pendingRequest → DependentLinkRequestsService.ownPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.rejectDependentLinkRequest → DependentLinkRequestsService.reject → DependentLinkRequestsService.pendingRequest → DependentLinkRequestsService.ownPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DependentLinkRequestDecisionDto>` · DTO `DependentLinkRequestDecisionDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:192` |
| `status` | `string` | Sí | valores: ACCEPTED, REJECTED | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:196` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 409 | `CONFLICT` | ConflictException: Esa solicitud ya fue respondida. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:220` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.spec.ts:72` |

### Flujos

- Profiles Module (05) — etapa `H4 §C`

---

## 15. GET /profiles/patients/me/dependent-requests/incoming

- **Origen:** CONTRATO
- **Nombre:** Listar las solicitudes de dependiente recibidas
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesDependentRequestsController.listIncomingDependentLinkRequests` — `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:142`

### Qué es y para qué sirve (negocio)

Listar las solicitudes de dependiente recibidas. Caso de uso H4 §C: Requests waiting for this account's answer. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:110`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/me/dependent-requests/incoming` la atiende `ProfilesDependentRequestsController.listIncomingDependentLinkRequests` (src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:142). Exige sesión; el controlador no declara roles. Delega en `DependentLinkRequestsService.listIncoming`. Lee profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_account_links, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.ts:142` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | LEE | LEE | POR_SQL | ProfilesDependentRequestsController.listIncomingDependentLinkRequests → DependentLinkRequestsService.listIncoming → PatientPortalProxiesRepository.listPendingForPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:398` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.listIncomingDependentLinkRequests → DependentLinkRequestsService.listIncoming → DependentLinkRequestsService.ownPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.listIncomingDependentLinkRequests → DependentLinkRequestsService.listIncoming → DependentLinkRequestsService.ownPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesDependentRequestsController.listIncomingDependentLinkRequests → DependentLinkRequestsService.listIncoming → DependentLinkRequestsService.ownPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<IncomingDependentLinkRequestDto[]>` · DTO `IncomingDependentLinkRequestDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:159` |
| `requesterDisplayName` | `string` | Sí | — | — | Nombre de quien pide representarla | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:163` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/dependent-link-request.dto.ts:167` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:158` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-dependent-requests.controller.spec.ts:70` |

### Flujos

- Profiles Module (05) — etapa `H4 §C`

---

## 16. GET /profiles/patients/me/dependents

- **Origen:** CONTRATO
- **Nombre:** Listar los dependientes a cargo del paciente autenticado
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.getOwnDependents` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:223`

### Qué es y para qué sirve (negocio)

Listar los dependientes a cargo del paciente autenticado. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/me/dependents` la atiende `ProfilesPatientsController.getOwnDependents` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:223). Exige sesión; el controlador no declara roles. Delega en `ProfilesPatientsService.getOwnDependents`. Lee common.identifiers, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.persons, profiles.related_persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:223` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnDependents → ProfilesPatientsService.getOwnDependents → PatientPortalProxiesRepository.listActiveDependentsOfUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:268` |
| `profiles.patient_portal_proxies` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnDependents → ProfilesPatientsService.getOwnDependents → PatientPortalProxiesRepository.listActiveDependentsOfUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:268` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnDependents → ProfilesPatientsService.getOwnDependents → PatientPortalProxiesRepository.listActiveDependentsOfUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:268` |
| `profiles.persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnDependents → ProfilesPatientsService.getOwnDependents → PatientPortalProxiesRepository.listActiveDependentsOfUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:268` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnDependents → ProfilesPatientsService.getOwnDependents → PatientPortalProxiesRepository.listActiveDependentsOfUser | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:268` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<DependentSummaryDto[]>` · DTO `DependentSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:24` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:31` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:35` |
| `fullName` | `string` | Sí | — | — | Nombre para mostrar, ya compuesto | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:39` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:43` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:47` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:51` |
| `ageYears` | `number` | No | — | — | Edad cumplida en años | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:62` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:66` |
| `relationshipCode` | `string` | Sí | valores: CHILD, PARENT, SPOUSE, WARD, OTHER | — | Parentesco visto desde el dependiente | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:75` |
| `relationshipDisplay` | `string` | Sí | — | — | Rótulo en castellano | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:79` |
| `isLegalGuardian` | `boolean` | Sí | — | — | Si el vínculo afirma la tutela legal | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/dependent-link-requests.int-spec.ts:123` |
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:161` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:205` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /profiles/patients/me/dependents

- **Origen:** CONTRATO
- **Nombre:** Registrar un dependiente (menor o adulto mayor tutelado)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.registerOwnDependent` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:250`

### Qué es y para qué sirve (negocio)

Registrar un dependiente (menor o adulto mayor tutelado). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/me/dependents` la atiende `ProfilesPatientsController.registerOwnDependent` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:250). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateDependentDto` (9 campos, 4 obligatorios). Delega en `ProfilesPatientsService.registerOwnDependent`. Crea filas en common.identifiers, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.person_profiles, profiles.persons, profiles.related_persons. Lee common.identifiers, profiles.patient_profiles, profiles.person_account_links, profiles.persons, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:250` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → PersonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → PersonRecordsAdapter.findActiveDuplicate → IdentifiersRepository.findActiveDuplicate | `src/modules/common/repositories/identifiers.repository.ts:80` |
| `profiles.patient_portal_proxies` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → PatientPortalProxiesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:168` |
| `profiles.patient_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → PatientProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:220` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → RelatedPersonsRepository.create | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:68` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerOwnDependent → ProfilesPatientsService.registerOwnDependent → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `CreateDependentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | Nombre de pila | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:51` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | Segundo nombre | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:63` |
| `lastName` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | Apellido paterno | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:75` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | Apellido materno | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:87` |
| `birthDate` | `string` | Sí | formato date | `@IsISO8601({ strict: true })` | Fecha de nacimiento (ISO date, YYYY-MM-DD) | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:102` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:114` |
| `nationalId` | `string` | No | longitud mínima 4; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsOptional()` `@IsString()` `@MinLength(4)` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Documento de identidad, si el dependiente ya lo tiene | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:130` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento que expidió el documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:145` |
| `relationshipConceptId` | `string` | Sí | formato uuid | `@IsUUID()` `@IsIn(DEPENDENT_RELATIONSHIP_CONCEPT_IDS, { message: 'El parentesco declarado no habilita a representar a otra persona', })` | Qué es el titular para el dependiente (madre, padre, hijo/a, cónyuge o tutor legal) | `src/modules/profiles/presentation/dto/create-dependent.dto.ts:165` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "birthDate": "2018-03-14",
  "relationshipConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": "2018-03-14",
  "sexAtBirth": "MALE",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "relationshipConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<DependentSummaryDto>` · DTO `DependentSummaryDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:24` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:31` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:35` |
| `fullName` | `string` | Sí | — | — | Nombre para mostrar, ya compuesto | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:39` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:43` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:47` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:51` |
| `ageYears` | `number` | No | — | — | Edad cumplida en años | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:62` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:66` |
| `relationshipCode` | `string` | Sí | valores: CHILD, PARENT, SPOUSE, WARD, OTHER | — | Parentesco visto desde el dependiente | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:75` |
| `relationshipDisplay` | `string` | Sí | — | — | Rótulo en castellano | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:79` |
| `isLegalGuardian` | `boolean` | Sí | — | — | Si el vínculo afirma la tutela legal | `src/modules/profiles/presentation/dto/dependent-summary.dto.ts:89` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 409 | `CONFLICT` | ConflictException: Ese documento ya está registrado en la plataforma |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La fecha de nacimiento no es una fecha válida; PreconditionFailedException: La fecha de nacimiento no puede ser futura; PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: El catálogo de departamentos no está disponible; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx16-dependientes-y-tutor-legal.int-spec.ts:172` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:218` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. DELETE /profiles/patients/me/photo

- **Origen:** CONTRATO
- **Nombre:** Quitar la propia foto de perfil
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.removeOwnPhoto` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:201`

### Qué es y para qué sirve (negocio)

Quitar la propia foto de perfil. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/patients/me/photo` la atiende `ProfilesPatientsController.removeOwnPhoto` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:201). Exige sesión; el controlador no declara roles. Delega en `ProfilesPatientsService.removeOwnPhoto`. Lee common.addresses, common.contact_points, common.identifiers, insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages y 6 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:201` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → PersonRecordsAdapter.findCurrentContact → ContactPointsRepository.findCurrentByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:126` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readIdentifiers → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_plan_benefits` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:168` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `profiles.patient_portal_proxies` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readGuardians → PatientPortalProxiesRepository.listActiveGuardiansOfPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:311` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.emergencyReadContacts → RelatedPersonsRepository.listActiveEmergencyContactsOfPatient | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:111` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OwnPatientProfileResponseDto>` · DTO `OwnPatientProfileResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:521` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:527` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/presentation/dto/read-patients.dto.ts:533` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:539` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:545` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:551` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:560` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/presentation/dto/read-patients.dto.ts:571` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:581` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:596` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:606` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:618` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:622` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:630` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:640` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:649` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:658` |
| `nationalId` | `string` | No | — | — | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:669` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:675` |
| `taxId` | `string` | No | — | — | NIT para facturación | `src/modules/profiles/presentation/dto/read-patients.dto.ts:678` |
| `taxHolderName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:682` |
| `email` | `string` | No | — | — | Correo de contacto vigente | `src/modules/profiles/presentation/dto/read-patients.dto.ts:685` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil (id de archivo en `common.files`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:700` |
| `homeAddress` | `OwnAddressDto` | No | — | — | Domicilio, con calle y punto en el mapa si los declaró | `src/modules/profiles/presentation/dto/read-patients.dto.ts:706` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `workAddress` | `OwnAddressDto` | No | — | — | Dirección de trabajo | `src/modules/profiles/presentation/dto/read-patients.dto.ts:712` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `coverages` | `array<OwnCoverageDto>` | Sí | — | — | Seguros declarados. Vacío si no declaró ninguno. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:718` |
| `coverages[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:394` |
| `coverages[].carrierName` | `string` | Sí | — | — | Aseguradora, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:397` |
| `coverages[].planName` | `string` | No | — | — | Plan contratado, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:400` |
| `coverages[].isPublic` | `boolean` | Sí | — | — | Si el seguro es público o privado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:403` |
| `coverages[].policyIdentifier` | `string` | No | — | — | Número de póliza declarado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:406` |
| `coverages[].memberIdentifier` | `string` | No | — | — | Con qué documento figura afiliado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:409` |
| `coverages[].verified` | `boolean` | Sí | — | — | Si la plataforma confirmó la cobertura con la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:414` |
| `coverages[].status` | `string` | No | — | — | Estado legible de la cobertura | `src/modules/profiles/presentation/dto/read-patients.dto.ts:417` |
| `coverages[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:420` |
| `coverages[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:425` |
| `coverages[].referenceDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:428` |
| `coverages[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:431` |
| `coverages[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:434` |
| `coverages[].currencyCode` | `string` | No | — | — | Código de moneda del plan | `src/modules/profiles/presentation/dto/read-patients.dto.ts:437` |
| `coverages[].carrierWhatsappNumber` | `string` | No | — | — | Canal oficial de WhatsApp de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:442` |
| `coverages[].carrierCallCenterPhone` | `string` | No | — | — | Call center oficial de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:445` |
| `coverages[].benefits` | `array<CoverageBenefitSummaryDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:448` |
| `coverages[].benefits[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:352` |
| `coverages[].benefits[].categoryCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:355` |
| `coverages[].benefits[].categoryName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:358` |
| `coverages[].benefits[].serviceConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:361` |
| `coverages[].benefits[].serviceName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:364` |
| `coverages[].benefits[].coveragePercent` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:368` |
| `coverages[].benefits[].copayAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:371` |
| `coverages[].benefits[].deductibleAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:374` |
| `coverages[].benefits[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:377` |
| `coverages[].benefits[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:382` |
| `coverages[].benefits[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:385` |
| `coverages[].benefits[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:388` |
| `coverages[].planId` | `string` | No | formato uuid | — | Plan de salud elegido | `src/modules/profiles/presentation/dto/read-patients.dto.ts:451` |
| `coverages[].coverageOrder` | `number` | Sí | — | — | Orden de la cobertura: 1 privada, 2 pública | `src/modules/profiles/presentation/dto/read-patients.dto.ts:454` |
| `emergencyContacts` | `array<OwnEmergencyContactDto>` | Sí | — | — | Contactos de emergencia activos. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:724` |
| `emergencyContacts[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:487` |
| `emergencyContacts[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:493` |
| `emergencyContacts[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:496` |
| `emergencyContacts[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:499` |
| `guardians` | `array<OwnGuardianDto>` | Sí | — | — | Representantes con apoderamiento activo, con su parentesco. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:730` |
| `guardians[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:466` |
| `guardians[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:472` |
| `guardians[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:475` |
| `guardians[].isLegalGuardian` | `boolean` | Sí | — | — | Es su representante legal | `src/modules/profiles/presentation/dto/read-patients.dto.ts:478` |
| `guardians[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:481` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:372` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:195` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 19. PUT /profiles/patients/me/photo

- **Origen:** CONTRATO
- **Nombre:** Fijar la propia foto de perfil
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.setOwnPhoto` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:179`

### Qué es y para qué sirve (negocio)

Fijar la propia foto de perfil. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /profiles/patients/me/photo` la atiende `ProfilesPatientsController.setOwnPhoto` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:179). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SetOwnPatientPhotoDto` (1 campo, 1 obligatorio). Delega en `ProfilesPatientsService.setOwnPhoto`. Lee common.addresses, common.contact_points, common.file_versions, common.files, common.identifiers, insurance.insurance_carriers, insurance.insurance_plan_benefits, insurance.insurance_plans y 8 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:179` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → PersonRecordsAdapter.findCurrentContact → ContactPointsRepository.findCurrentByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:126` |
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readIdentifiers → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_plan_benefits` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:168` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |
| `profiles.patient_portal_proxies` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readGuardians → PatientPortalProxiesRepository.listActiveGuardiansOfPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:311` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.emergencyReadContacts → RelatedPersonsRepository.listActiveEmergencyContactsOfPatient | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:111` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.readCoverages → PatientCoveragesAdapter.read → DeclaredCoveragesReader.read | `src/modules/insurance/application/services/declared-coverages-reader.ts:125` |

### Cuerpo — DTO `SetOwnPatientPhotoDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Identificador del archivo ya subido que será la foto | `src/modules/profiles/presentation/dto/set-own-patient-photo.dto.ts:20` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<OwnPatientProfileResponseDto>` · DTO `OwnPatientProfileResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:521` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:527` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/presentation/dto/read-patients.dto.ts:533` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:539` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:545` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/presentation/dto/read-patients.dto.ts:551` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:560` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/presentation/dto/read-patients.dto.ts:571` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:581` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:596` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:606` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:618` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:622` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:630` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:640` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:649` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:658` |
| `nationalId` | `string` | No | — | — | Documento de identidad. Es su usuario de acceso, así que no se edita desde acá. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:669` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento que emitió el documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:675` |
| `taxId` | `string` | No | — | — | NIT para facturación | `src/modules/profiles/presentation/dto/read-patients.dto.ts:678` |
| `taxHolderName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:682` |
| `email` | `string` | No | — | — | Correo de contacto vigente | `src/modules/profiles/presentation/dto/read-patients.dto.ts:685` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil (id de archivo en `common.files`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:700` |
| `homeAddress` | `OwnAddressDto` | No | — | — | Domicilio, con calle y punto en el mapa si los declaró | `src/modules/profiles/presentation/dto/read-patients.dto.ts:706` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `workAddress` | `OwnAddressDto` | No | — | — | Dirección de trabajo | `src/modules/profiles/presentation/dto/read-patients.dto.ts:712` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | sin fuente |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | sin fuente |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | sin fuente |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | sin fuente |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | sin fuente |
| `coverages` | `array<OwnCoverageDto>` | Sí | — | — | Seguros declarados. Vacío si no declaró ninguno. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:718` |
| `coverages[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:394` |
| `coverages[].carrierName` | `string` | Sí | — | — | Aseguradora, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:397` |
| `coverages[].planName` | `string` | No | — | — | Plan contratado, en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:400` |
| `coverages[].isPublic` | `boolean` | Sí | — | — | Si el seguro es público o privado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:403` |
| `coverages[].policyIdentifier` | `string` | No | — | — | Número de póliza declarado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:406` |
| `coverages[].memberIdentifier` | `string` | No | — | — | Con qué documento figura afiliado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:409` |
| `coverages[].verified` | `boolean` | Sí | — | — | Si la plataforma confirmó la cobertura con la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:414` |
| `coverages[].status` | `string` | No | — | — | Estado legible de la cobertura | `src/modules/profiles/presentation/dto/read-patients.dto.ts:417` |
| `coverages[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:420` |
| `coverages[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:425` |
| `coverages[].referenceDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:428` |
| `coverages[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:431` |
| `coverages[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:434` |
| `coverages[].currencyCode` | `string` | No | — | — | Código de moneda del plan | `src/modules/profiles/presentation/dto/read-patients.dto.ts:437` |
| `coverages[].carrierWhatsappNumber` | `string` | No | — | — | Canal oficial de WhatsApp de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:442` |
| `coverages[].carrierCallCenterPhone` | `string` | No | — | — | Call center oficial de la aseguradora | `src/modules/profiles/presentation/dto/read-patients.dto.ts:445` |
| `coverages[].benefits` | `array<CoverageBenefitSummaryDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:448` |
| `coverages[].benefits[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:352` |
| `coverages[].benefits[].categoryCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:355` |
| `coverages[].benefits[].categoryName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:358` |
| `coverages[].benefits[].serviceConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:361` |
| `coverages[].benefits[].serviceName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:364` |
| `coverages[].benefits[].coveragePercent` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:368` |
| `coverages[].benefits[].copayAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:371` |
| `coverages[].benefits[].deductibleAmount` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:374` |
| `coverages[].benefits[].statusCode` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:377` |
| `coverages[].benefits[].validityStatus` | `string` | Sí | valores: CURRENT, UPCOMING, EXPIRED, INACTIVE, UNKNOWN | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:382` |
| `coverages[].benefits[].effectiveFrom` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:385` |
| `coverages[].benefits[].effectiveTo` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:388` |
| `coverages[].planId` | `string` | No | formato uuid | — | Plan de salud elegido | `src/modules/profiles/presentation/dto/read-patients.dto.ts:451` |
| `coverages[].coverageOrder` | `number` | Sí | — | — | Orden de la cobertura: 1 privada, 2 pública | `src/modules/profiles/presentation/dto/read-patients.dto.ts:454` |
| `emergencyContacts` | `array<OwnEmergencyContactDto>` | Sí | — | — | Contactos de emergencia activos. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:724` |
| `emergencyContacts[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:487` |
| `emergencyContacts[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:493` |
| `emergencyContacts[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:496` |
| `emergencyContacts[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:499` |
| `guardians` | `array<OwnGuardianDto>` | Sí | — | — | Representantes con apoderamiento activo, con su parentesco. | `src/modules/profiles/presentation/dto/read-patients.dto.ts:730` |
| `guardians[].displayName` | `string` | No | — | — | Cómo se llama | `src/modules/profiles/presentation/dto/read-patients.dto.ts:466` |
| `guardians[].relationshipConceptId` | `string` | No | formato uuid | — | Parentesco (concept id) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:472` |
| `guardians[].relationshipDisplay` | `string` | Sí | — | — | Parentesco en palabras | `src/modules/profiles/presentation/dto/read-patients.dto.ts:475` |
| `guardians[].isLegalGuardian` | `boolean` | Sí | — | — | Es su representante legal | `src/modules/profiles/presentation/dto/read-patients.dto.ts:478` |
| `guardians[].phone` | `string` | No | — | — | Su teléfono | `src/modules/profiles/presentation/dto/read-patients.dto.ts:481` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:359` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:185` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. GET /profiles/patients/me/summary

- **Origen:** CONTRATO
- **Nombre:** Consultar el resumen propio
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.getOwnSummary` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:98`

### Qué es y para qué sirve (negocio)

Consultar el resumen propio. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/me/summary` la atiende `ProfilesPatientsController.getOwnSummary` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:98). Exige sesión; el controlador no declara roles. Delega en `ProfilesPatientsService.getOwnSummary`. Lee profiles.patient_profiles, profiles.person_account_links, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:98` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnSummary → ProfilesPatientsService.getOwnSummary → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnSummary → ProfilesPatientsService.getOwnSummary → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnSummary → ProfilesPatientsService.getOwnSummary → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientSummaryResponseDto>` · DTO `PatientSummaryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:131` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:137` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el resumen llega sin `patientCode`. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:146` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:155` |
| `displayName` | `string` | No | — | — | Valor de display name mantenido por la instancia. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:161` |
| `birthDate` | `string` | No | formato date-time | — | Valor de birth date mantenido por la instancia. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:167` |
| `personStatus` | `string` | Sí | formato uuid | — | Identificador asociado a person status concept. | `src/modules/profiles/presentation/dto/create-patient.dto.ts:173` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:85` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /profiles/patients/merge

- **Origen:** CONTRATO
- **Nombre:** Fusionar pacientes duplicados
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.mergePatients` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:497`

### Qué es y para qué sirve (negocio)

Fusionar pacientes duplicados. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/merge` la atiende `ProfilesPatientsController.mergePatients` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:497). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `MergePatientsDto` (3 campos, 2 obligatorios). Delega en `ProfilesPatientsService.mergePatients`. Crea filas en profiles.patient_merge_events. Actualiza profiles.patient_identity_links, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.persons, profiles.related_persons. Lee profiles.patient_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:497` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_identity_links` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientIdentityLinksRepository.reassignPatientProfile | `src/modules/profiles/infrastructure/repositories/patient-identity-links.repository.ts:103` |
| `profiles.patient_merge_events` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientMergeEventsRepository.create | `src/modules/profiles/infrastructure/repositories/patient-merge-events.repository.ts:113` |
| `profiles.patient_portal_proxies` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientPortalProxiesRepository.reassignPatientProfile | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:529` |
| `profiles.patient_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients | `src/modules/profiles/application/services/profiles-patients.service.ts:2177` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients | `src/modules/profiles/application/services/profiles-patients.service.ts:2187` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.related_persons` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → RelatedPersonsRepository.reassignPatientProfile | `src/modules/profiles/infrastructure/repositories/related-persons.repository.ts:178` |

### Cuerpo — DTO `MergePatientsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `survivingPatientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente que sobrevive | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:52` |
| `mergedPatientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente que se fusiona (perdedor) | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:62` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la razón de fusión | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:73` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "survivingPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "mergedPatientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "survivingPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "mergedPatientProfileId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<MergeEventResponseDto>` · DTO `MergeEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:96` |
| `survivingPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a surviving patient profile. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:102` |
| `mergedPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a merged patient profile. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:108` |
| `decisionStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la decisión | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:117` |
| `reversalOfEventId` | `string` | No | formato uuid | — | Evento original revertido (si aplica) | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:126` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente sobreviviente no encontrado; ResourceNotFoundException: Paciente a fusionar no encontrado |
| 409 | `CONFLICT` | ConflictException: El paciente ya fue fusionado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se puede fusionar un paciente consigo mismo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:107` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. GET /profiles/patients/merge-events

- **Origen:** CONTRATO
- **Nombre:** Listar eventos de fusión de pacientes
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.listMergeEvents` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:406`

### Qué es y para qué sirve (negocio)

Listar eventos de fusión de pacientes. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/merge-events` la atiende `ProfilesPatientsController.listMergeEvents` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:406). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ProfilesPatientsService.listMergeEvents`. Lee profiles.patient_merge_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:406` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_merge_events` | LEE | LEE | DIRECTA | ProfilesPatientsController.listMergeEvents → ProfilesPatientsService.listMergeEvents → PatientMergeEventsRepository.findEvents | `src/modules/profiles/infrastructure/repositories/patient-merge-events.repository.ts:99` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | No | `string` | Paciente involucrado, de cualquiera de los dos lados |
| `limit` | query | No | `number` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListMergeEventsResponseDto>` · DTO `ListMergeEventsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<MergeEventResponseDto>` | Sí | — | — | Eventos de esta página, del más reciente al más antiguo. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:141` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:96` |
| `items[].survivingPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a surviving patient profile. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:102` |
| `items[].mergedPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a merged patient profile. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:108` |
| `items[].decisionStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la decisión | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:117` |
| `items[].reversalOfEventId` | `string` | No | formato uuid | — | Evento original revertido (si aplica) | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:126` |
| `items[].recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:132` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:147` |
| `limit` | `number` | Sí | — | — | Tope aplicado. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:153` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 23. POST /profiles/patients/merge/{eventId}/reverse

- **Origen:** CONTRATO
- **Nombre:** Revertir una fusión de pacientes
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.reverseMerge` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:514`

### Qué es y para qué sirve (negocio)

Revertir una fusión de pacientes. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/merge/{eventId}/reverse` la atiende `ProfilesPatientsController.reverseMerge` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:514). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReverseMergeDto` (1 campo, 0 obligatorios). Delega en `ProfilesPatientsService.reverseMerge`. Crea filas en profiles.patient_merge_events. Actualiza profiles.patient_profiles, profiles.persons. Lee profiles.patient_merge_events, profiles.patient_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:514` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: eventId | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:514` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_merge_events` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PatientMergeEventsRepository.create | `src/modules/profiles/infrastructure/repositories/patient-merge-events.repository.ts:113` |
| `profiles.patient_merge_events` | LEE | LEE | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PatientMergeEventsRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-merge-events.repository.ts:56` |
| `profiles.patient_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge | `src/modules/profiles/application/services/profiles-patients.service.ts:2318` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PatientProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:97` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge | `src/modules/profiles/application/services/profiles-patients.service.ts:2325` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `eventId` | path | Sí | `string` | — |

### Cuerpo — DTO `ReverseMergeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la razón de reversión | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:87` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reasonConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<MergeEventResponseDto>` · DTO `MergeEventResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:96` |
| `survivingPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a surviving patient profile. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:102` |
| `mergedPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a merged patient profile. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:108` |
| `decisionStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la decisión | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:117` |
| `reversalOfEventId` | `string` | No | formato uuid | — | Evento original revertido (si aplica) | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:126` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/profiles/presentation/dto/merge-patients.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Evento de fusión no encontrado |
| 409 | `CONFLICT` | ConflictException: La fusión ya fue revertida |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se puede revertir una fusión aprobada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:113` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 24. POST /profiles/patients/search

- **Origen:** CONTRATO
- **Nombre:** UC-05-13: listado paginado de pacientes, con los filtros en el cuerpo
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.searchPatientsByBody` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:378`

### Qué es y para qué sirve (negocio)

UC-05-13: listado paginado de pacientes, con los filtros en el cuerpo. Caso de uso H4 §C: UC-05-13 search with the filters in the body (name/CI never in the URL). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:107`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/search` la atiende `ProfilesPatientsController.searchPatientsByBody` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:378). Exige sesión con alguno de los roles SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER. Valida el cuerpo como `SearchPatientsQueryDto` (5 campos, 0 obligatorios). Lee common.identifiers, profiles.patient_profiles, profiles.persons, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:378` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | LEE | LEE | POR_SQL | ProfilesPatientsController.searchPatientsByBody → ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PatientProfilesRepository.searchPage | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:166` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ProfilesPatientsController.searchPatientsByBody → ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PatientProfilesRepository.searchPage | `src/modules/profiles/infrastructure/repositories/patient-profiles.repository.ts:190` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatientsByBody → ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PersonsRepository.findByIds | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:113` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatientsByBody → ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatientsByBody → ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatientsByBody → ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `SearchPatientsQueryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `q` | `string` | No | — | `@IsOptional()` | Texto a buscar en el código de paciente o el nombre | `src/modules/profiles/presentation/dto/read-patients.dto.ts:79` |
| `nationalId` | `string` | No | — | `@IsOptional()` | Documento de identidad exacto (`common.identifiers.value`) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:86` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento que expidió el documento; sólo tiene efecto junto a nationalId | `src/modules/profiles/presentation/dto/read-patients.dto.ts:96` |
| `cursor` | `string` | No | — | `@IsOptional()` | Cursor opaco devuelto por la página anterior | `src/modules/profiles/presentation/dto/read-patients.dto.ts:103` |
| `limit` | `number` | No | mínimo 1; máximo 500 | `@IsOptional()` `@Type(() => Number)` `@IsInt()` `@Min(1)` `@Max(500)` | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:112` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "q": "valor-ejemplo",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "cursor": "valor-ejemplo",
  "limit": 50
}
```

</details>

### Respuesta — `Promise<SearchPatientsResponseDto>` · DTO `SearchPatientsResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PatientListItemDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:121` |
| `items[].profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:20` |
| `items[].personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:26` |
| `items[].patientCode` | `string` | Sí | — | — | Código único de paciente | `src/modules/profiles/presentation/dto/read-patients.dto.ts:32` |
| `items[].displayName` | `string` | No | — | — | Nombre visible de la persona | `src/modules/profiles/presentation/dto/read-patients.dto.ts:38` |
| `items[].birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-patients.dto.ts:44` |
| `items[].personStatusConceptId` | `string` | No | formato uuid | — | Concept id del estado de la persona | `src/modules/profiles/presentation/dto/read-patients.dto.ts:53` |
| `items[].deceased` | `boolean` | Sí | — | — | Si la persona está registrada como fallecida. Es un booleano derivado y no un concepto: una lista de pacientes tiene que poder marcarlo sin resolver terminología | `src/modules/profiles/presentation/dto/read-patients.dto.ts:62` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/profiles/presentation/dto/read-patients.dto.ts:127` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/profiles/presentation/dto/read-patients.dto.ts:133` |
| `nextCursor` | `object` | No | admite null | — | Cursor opaco para la página siguiente; `null` cuando no hay más | `src/modules/profiles/presentation/dto/read-patients.dto.ts:143` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Busque por nombre, código o documento: no se puede listar el padrón completo de pacientes; PreconditionFailedException: El catálogo de departamentos no está disponible; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:254` |

### Flujos

- Profiles Module (05) — etapa `H4 §C`

---

## 25. POST /profiles/persons/{personId}/account-links

- **Origen:** CONTRATO
- **Nombre:** Vincular cuenta de portal a una persona
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.linkAccount` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:461`

### Qué es y para qué sirve (negocio)

Vincular cuenta de portal a una persona. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/persons/{personId}/account-links` la atiende `ProfilesPatientsController.linkAccount` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:461). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LinkAccountDto` (2 campos, 1 obligatorio). Delega en `ProfilesPatientsService.linkAccount`. Crea filas en profiles.person_account_links. Actualiza profiles.person_account_links. Lee profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:461` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: personId | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:461` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.person_account_links` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.linkAccount → ProfilesPatientsService.linkAccount → PersonAccountLinksRepository.supersedeActiveForUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:113` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.linkAccount → ProfilesPatientsService.linkAccount → PersonAccountLinksRepository.create | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:50` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.linkAccount → ProfilesPatientsService.linkAccount → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `personId` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkAccountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario IAM a vincular con la persona | `src/modules/profiles/presentation/dto/link-account.dto.ts:14` |
| `linkTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de vínculo (por defecto: self) | `src/modules/profiles/presentation/dto/link-account.dto.ts:25` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "linkTypeConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<AccountLinkResponseDto>` · DTO `AccountLinkResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/link-account.dto.ts:34` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/presentation/dto/link-account.dto.ts:40` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/profiles/presentation/dto/link-account.dto.ts:46` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del vínculo | `src/modules/profiles/presentation/dto/link-account.dto.ts:55` |
| `validFrom` | `string` | Sí | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/profiles/presentation/dto/link-account.dto.ts:61` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Persona no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La persona no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:81` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. POST /profiles/persons/{personId}/decease

- **Origen:** CONTRATO
- **Nombre:** Registrar defunción y anonimización de una persona
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.decease` — `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:569`

### Qué es y para qué sirve (negocio)

Registrar defunción y anonimización de una persona. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/persons/{personId}/decease` la atiende `ProfilesPatientsController.decease` (src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:569). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DeceasePersonDto` (2 campos, 0 obligatorios). Delega en `ProfilesPatientsService.decease`. Actualiza profiles.patient_portal_proxies, profiles.person_account_links, profiles.persons. Lee profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:569` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: personId | `src/modules/profiles/presentation/controllers/profiles-patients.controller.ts:569` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.decease → ProfilesPatientsService.decease → PatientPortalProxiesRepository.revokeActiveForPatient | `src/modules/profiles/infrastructure/repositories/patient-portal-proxies.repository.ts:515` |
| `profiles.person_account_links` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.decease → ProfilesPatientsService.decease → PersonAccountLinksRepository.revokeActiveForPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:130` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.decease → ProfilesPatientsService.decease | `src/modules/profiles/application/services/profiles-patients.service.ts:2513` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.decease → ProfilesPatientsService.decease → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `personId` | path | Sí | `string` | — |

### Cuerpo — DTO `DeceasePersonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `deceasedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento de defunción (ISO date-time) | `src/modules/profiles/presentation/dto/decease-person.dto.ts:15` |
| `anonymize` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Anonimiza la PII (borrado lógico del display_name) al registrar | `src/modules/profiles/presentation/dto/decease-person.dto.ts:27` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "deceasedAt": "2026-07-31T12:00:00.000Z",
  "anonymize": false
}
```

</details>

### Respuesta — `Promise<DeceaseResponseDto>` · DTO `DeceaseResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/decease-person.dto.ts:36` |
| `vitalStatus` | `string` | Sí | formato uuid | — | Concept id del estado vital | `src/modules/profiles/presentation/dto/decease-person.dto.ts:42` |
| `personStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la persona | `src/modules/profiles/presentation/dto/decease-person.dto.ts:51` |
| `deceasedAt` | `string` | No | formato date-time | — | Valor de deceased at mantenido por la instancia. | `src/modules/profiles/presentation/dto/decease-person.dto.ts:57` |
| `revokedAccountLinks` | `number` | Sí | — | — | Nº de vínculos de cuenta revocados | `src/modules/profiles/presentation/dto/decease-person.dto.ts:63` |
| `revokedProxies` | `number` | Sí | — | — | Nº de proxies de portal revocados | `src/modules/profiles/presentation/dto/decease-person.dto.ts:69` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Persona no encontrada |
| 409 | `CONFLICT` | ConflictException: La persona ya está registrada como fallecida |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-patients.controller.spec.ts:149` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. GET /profiles/practitioners

- **Origen:** CONTRATO
- **Nombre:** Listar profesionales para la guía, con sus especialidades
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.listPractitioners` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:148`

### Qué es y para qué sirve (negocio)

Listar profesionales para la guía, con sus especialidades. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners` la atiende `ProfilesPractitionersController.listPractitioners` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:148). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.listPractitioners`. Lee profiles.health_practitioner_profiles, profiles.persons, profiles.practitioner_affiliations, profiles.practitioner_specialties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:148` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPractitioners → ProfilesPractitionersService.listPractitioners → HealthPractitionerProfilesRepository.findVisibleProfileIds | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:144` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPractitioners → ProfilesPractitionersService.listPractitioners → PersonsRepository.findByIds | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:113` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPractitioners → ProfilesPractitionersService.listPractitioners → PractitionerAffiliationsRepository.findByPractitioners | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:100` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPractitioners → ProfilesPractitionersService.listPractitioners → PractitionerSpecialtiesRepository.findCurrentSpecialtyPairs | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:211` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `specialtyConceptId` | query | No | `string` | Filtra por especialidad vigente (concept id) |
| `withoutSpecialty` | query | No | `string` | true = sólo quienes no declaran ninguna especialidad vigente |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | Tope de resultados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListPractitionersResponseDto>` · DTO `ListPractitionersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PractitionerListItemDto>` | Sí | — | — | Las filas de esta página. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:122` |
| `items[].profileId` | `string` | Sí | formato uuid | — | Con este id se abre la ficha (`GET /profiles/practitioners/:id/summary`). | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:37` |
| `items[].practitionerCode` | `string` | Sí | — | — | Código único del profesional | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:43` |
| `items[].displayName` | `string` | No | — | — | Nombre visible de la persona | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:49` |
| `items[].professionalTitle` | `string` | No | — | — | Título profesional declarado. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:55` |
| `items[].photoFileId` | `string` | No | formato uuid | — | Archivo de la foto | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:61` |
| `items[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | Estado de verificación de la matrícula. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:67` |
| `items[].verified` | `boolean` | Sí | — | — | Si la matrícula fue verificada | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:78` |
| `items[].acceptsNewPatients` | `boolean` | Sí | — | — | Si declara tomar pacientes nuevos. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:84` |
| `items[].telehealthAvailable` | `boolean` | Sí | — | — | Si atiende por telemedicina. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:90` |
| `items[].specialties` | `array<PractitionerListSpecialtyDto>` | Sí | — | — | Sus especialidades, la principal primero. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:96` |
| `items[].specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | Concept id de la especialidad | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:14` |
| `items[].specialties[].isPrimary` | `boolean` | Sí | — | — | Si es la especialidad con la que se presenta. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:20` |
| `items[].workplaces` | `array<string>` | Sí | — | — | Dónde atiende, en texto | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:111` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:128` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:134` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de la página siguiente; null si no hay más | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:144` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/verification-bypass.int-spec.ts:48` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 28. POST /profiles/practitioners

- **Origen:** CONTRATO
- **Nombre:** Alta de profesional de salud (workforce generalista)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.onboardPractitioner` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:353`

### Qué es y para qué sirve (negocio)

Alta de profesional de salud (workforce generalista). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners` la atiende `ProfilesPractitionersController.onboardPractitioner` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:353). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerDto` (17 campos, 1 obligatorio). Delega en `ProfilesPractitionersService.onboardPractitioner`. Crea filas en profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_profiles, profiles.persons, profiles.practitioner_languages, profiles.practitioner_specialties, profiles.professional_credentials. Lee profiles.health_practitioner_profiles, profiles.persons, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:353` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → HealthPractitionerProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:161` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:79` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:114` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PersonProfilesRepository.create | `src/modules/profiles/infrastructure/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PersonsRepository.create | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:119` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PractitionerLanguagesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → PractitionerSpecialtiesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:61` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfessionalCredentialsRepository.create | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:122` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `CreatePractitionerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de profesional (practitioner_code, UK) | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:30` |
| `personId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona existente a reutilizar; si se omite se crea una nueva | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:42` |
| `displayName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre visible (si se crea la persona) | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:53` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de categoría profesional | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:64` |
| `professionalTitle` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Título profesional | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:73` |
| `specialtyConceptIds` | `array<string>` | No | formato uuid; máximo 4 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(4)` `@IsUUID(undefined, { each: true })` | Especialidades del catálogo VS_MEDICAL_SPECIALTY (una principal y hasta tres adicionales). | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:99` |
| `professionalBio` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Biografía profesional en prosa | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:115` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si acepta pacientes nuevos | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:131` |
| `telehealthAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si atiende por telemedicina | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:140` |
| `licenseNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Nº de licencia de la autorización jurisdiccional inicial | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:163` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de jurisdicción de la licencia | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:174` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad regulatoria emisora | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:186` |
| `credentialNumber` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Nº de la credencial de soporte | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:200` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de credencial | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:211` |
| `credentialIssuingInstitutionText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Institución que emitió la credencial de soporte | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:229` |
| `credentialIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de emisión de la credencial de soporte (ISO) | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:244` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del idioma clínico | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:255` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerCode": "CODIGO_EJEMPLO"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "practitionerCode": "CODIGO_EJEMPLO",
  "personId": "00000000-0000-4000-8000-000000000001",
  "displayName": "Nombre de ejemplo",
  "practitionerCategoryConceptId": "00000000-0000-4000-8000-000000000001",
  "professionalTitle": "valor-ejemplo",
  "specialtyConceptIds": [
    "00000000-0000-4000-8000-000000000001"
  ],
  "professionalBio": "valor-ejemplo",
  "acceptsNewPatients": false,
  "telehealthAvailable": false,
  "licenseNumber": "valor-ejemplo",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "regulatoryAuthority": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo",
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "credentialIssuingInstitutionText": "valor-ejemplo",
  "credentialIssueDate": "2026-07-31",
  "languageConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PractitionerResponseDto>` · DTO `PractitionerResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | Identificador asociado a profile. | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:264` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:270` |
| `practitionerCode` | `string` | Sí | — | — | Valor de practitioner code mantenido por la instancia. | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:276` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:285` |
| `practiceStatus` | `string` | Sí | formato uuid | — | Concept id del estado de práctica | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:294` |
| `licenseId` | `string` | No | formato uuid | — | La autorización creada — **ausente** si el alta no trajo matrícula, que es el caso de una ficha de directorio. | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:301` |
| `credentialId` | `string` | No | formato uuid | — | La credencial creada. Ausente por el mismo motivo que `licenseId`. | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:305` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/create-practitioner.dto.ts:311` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Persona no encontrada |
| 409 | `CONFLICT` | ConflictException: El practitioner_code ya está en uso |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un profesional puede declarar hasta {MAX_SPECIALTIES_PER_PRACTITIO…} especialidades; PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:67` |
| INTEGRACION | `test/integration/verification-bypass.int-spec.ts:29` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:87` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. PATCH /profiles/practitioners/{profileId}

- **Origen:** CONTRATO
- **Nombre:** Corregir el perfil profesional de otro (titular o plataforma)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.updatePractitionerProfile` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:264`

### Qué es y para qué sirve (negocio)

Corregir el perfil profesional de otro (titular o plataforma). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/{profileId}` la atiende `ProfilesPractitionersController.updatePractitionerProfile` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:264). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnPractitionerProfileDto` (35 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.updatePractitionerProfile`. Crea filas en common.contact_points, common.identifiers, profiles.practitioner_languages. Actualiza common.contact_points, profiles.health_practitioner_profiles, profiles.persons, profiles.practitioner_languages. Borra de profiles.practitioner_languages. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:264` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:264` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:44` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:45` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:42` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:43` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceContact → PersonRecordsAdapter.closeContact → ContactPointsRepository.closeCurrent | `src/modules/common/repositories/contact-points.repository.ts:192` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceContact → PersonRecordsAdapter.createContact → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → PersonRecordsAdapter.findAllCurrentContacts → ContactPointsRepository.findAllCurrentByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → PersonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1317` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfileOwnershipService.assertOwnsPractitionerProfile → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1344` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | BORRA | BORRA | POR_TIPO | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceLanguages → PractitionerLanguagesRepository.remove | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:84` |
| `profiles.practitioner_languages` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceLanguages | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1529` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceLanguages → PractitionerLanguagesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:180` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updatePractitionerProfile → ProfilesPractitionersService.updatePractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateOwnPractitionerProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `professionalTitle` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Título profesional | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:104` |
| `professionalBio` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Biografía profesional | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:114` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si acepta pacientes nuevos | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:126` |
| `telehealthAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si atiende por telemedicina | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:132` |
| `name` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:155` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:161` |
| `lastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:167` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:173` |
| `birthDate` | `object` | No | formato date; admite null | `@IsOptional()` `@IsISO8601()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:183` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:196` |
| `nationalId` | `string` | No | longitud mínima 1; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsOptional()` `@IsString()` `@IsNotEmpty({ message: 'El documento no puede quedar vacío' })` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Número del documento de identidad. 409 si la identidad está verificada o en verificación. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:224` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento emisor del documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:236` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | Forma anterior de declarar el teléfono. Preferí workMobilePhone. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:248` |
| `workEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsEmail({}, { message: 'El correo de trabajo no es un correo válido' })` `@MaxLength(320)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:267` |
| `personalEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsString()` `@MaxLength(320)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:274` |
| `mobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:282` |
| `workMobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:290` |
| `workLandline` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:298` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:306` |
| `taxId` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | NIT para facturación. Cadena vacía para quedarse sin NIT. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:316` |
| `taxHolderName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre o razón social del titular del NIT. Cadena vacía para quitarla. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:327` |
| `homeAddressLines` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Domicilio, tal como lo escribe la persona. Vacío para quitarlo. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:347` |
| `homeLatitude` | `object` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.homeLatitude, dto.homeLongitude) && (dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined), )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:359` |
| `homeLongitude` | `object` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.homeLatitude, dto.homeLongitude) && (dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined), )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:371` |
| `workAddressLines` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Dirección del lugar de trabajo. Vacío para quitarla. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:381` |
| `workLatitude` | `object` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.workLatitude, dto.workLongitude) && (dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined), )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:393` |
| `workLongitude` | `object` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.workLatitude, dto.workLongitude) && (dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined), )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:405` |
| `occupationConceptId` | `string` | No | formato uuid | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => dto.occupationConceptId !== '', )` `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:431` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:446` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => dto.workEmployerConceptId !== '', )` `@IsOptional()` `@IsUUID()` | Empresa donde trabaja (VS_BO_EMPLOYER). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:463` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre. Cadena vacía para borrarla. Se descarta si viene el concepto. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:477` |
| `languages` | `array<PractitionerLanguageInputDto>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_PRACTITIONER_LANGUAGES)` `@ValidateNested({ each: true })` `@Type(() => PractitionerLanguageInputDto)` | Idiomas de atención. Reemplaza la lista guardada; [] la vacía. Un idioma no puede repetirse. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:496` |
| `languages[].languageConceptId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:84` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:90` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | No | — | `@IsBoolean()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:95` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "acceptsNewPatients": true,
  "telehealthAvailable": true,
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": {},
  "sexAtBirth": "MALE",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "phone": "+59170000000",
  "workEmail": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "homeAddressLines": "valor-ejemplo",
  "homeLatitude": {},
  "homeLongitude": {},
  "workAddressLines": "valor-ejemplo",
  "workLatitude": {},
  "workLongitude": {},
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "languages": [
    {
      "languageConceptId": "00000000-0000-4000-8000-000000000001",
      "proficiencyConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalInterpretationAllowed": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unavailableSections` | `array<string>` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:231` |
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:234` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:237` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:240` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:243` |
| `professionalTitle` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:247` |
| `professionalBio` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:251` |
| `photoFileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:255` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:268` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:272` |
| `workEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:283` |
| `personalEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:287` |
| `mobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:291` |
| `workMobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:295` |
| `workLandline` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:299` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:308` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:311` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:314` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:317` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:320` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:327` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:334` |
| `identityVerified` | `boolean` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:342` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:348` |
| `taxId` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:352` |
| `taxHolderName` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:356` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:362` |
| `homeAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:369` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `workAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:373` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:383` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:390` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:401` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:405` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:408` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:411` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:414` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:418` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:421` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:424` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:42` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:45` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:49` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:53` |
| `specialties[].practiceScopeText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:57` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:60` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:63` |
| `specialties[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:67` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:427` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:80` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:83` |
| `credentials[].number` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:87` |
| `credentials[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia; permite descargar el diploma adjunto | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:99` |
| `credentials[].issuingCityText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:103` |
| `credentials[].issuingCountryText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:107` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:111` |
| `credentials[].titleText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:115` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:118` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:121` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:124` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:132` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:140` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:430` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:146` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:149` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:152` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:155` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:158` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:161` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:164` |
| `licenses[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:171` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:433` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:183` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:186` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:189` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:442` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `affiliations[].organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `affiliations[].roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `affiliations[].practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `affiliations[].healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliations[].affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `affiliations[].statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:445` |
| `activity.encounters` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:207` |
| `activity.medicationRequests` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:211` |
| `activity.clinicalNotes` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:215` |
| `activity.documents` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil profesional o la plataforma pueden modificarlo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil profesional no encontrado |
| 409 | `CONFLICT` | ConflictException: El documento no se puede corregir desde el perfil: su identidad ya está verificada, o en verificación, con ese número |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Un idioma no puede declararse dos veces; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-profile-identity-fields.int-spec.ts:167` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. POST /profiles/practitioners/{profileId}/affiliations

- **Origen:** CONTRATO
- **Nombre:** Registrar un consultorio de un profesional sin cuenta
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addAffiliationFor` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:624`

### Qué es y para qué sirve (negocio)

Registrar un consultorio de un profesional sin cuenta. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/{profileId}/affiliations` la atiende `ProfilesPractitionersController.addAffiliationFor` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:624). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ProfilesCreateAffiliationDto` (7 campos, 2 obligatorios). Delega en `ProfilesPractitionersService.addAffiliationFor`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, profiles.practitioner_affiliations. Actualiza iam.devices, messaging.notification_requests. Lee directory.tenant_memberships, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:624` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:624` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesAffiliationsService.initialState → AffiliationOrganizationsAdapter.hasAdministrators → TenantAdministrationService.hasAdministrators → TenantMembershipsRepository.countActiveByTenantRole | `src/modules/directory/repositories/tenant-memberships.repository.ts:113` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesAffiliationsService.initialState → AffiliationOrganizationsAdapter.findSite | `src/modules/profiles/infrastructure/adapters/affiliation-organizations.adapter.ts:19` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:340` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:339` |
| `profiles.practitioner_affiliations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → PractitionerAffiliationsRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:294` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → PractitionerAffiliationsRepository.findSame | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:254` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify | `src/modules/profiles/application/services/profiles-affiliations.service.ts:622` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `ProfilesCreateAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `organizationName` | `string` | Sí | — | — | Hospital o entidad médica, tal como la declara el profesional | sin fuente |
| `roleTitle` | `string` | No | — | — | Cargo ejercido, cuando aplica | sin fuente |
| `practiceSiteId` | `string` | No | formato uuid | — | Sede de la plataforma (`practice.practice_sites`) cuando la institución está dentro. Se omite para instituciones externas | sin fuente |
| `healthFacilityConceptId` | `string` | No | formato uuid | — | — | sin fuente |
| `affiliationTypeConceptId` | `string` | No | formato uuid | — | Tipo de vínculo laboral (concept id) | sin fuente |
| `startDate` | `string` | Sí | formato date | — | Inicio del vínculo | sin fuente |
| `endDate` | `string` | No | formato date | — | Fin del vínculo. Se omite si sigue ejerciendo ahí | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "organizationName": "Hospital Obrero N.º 1",
  "startDate": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "organizationName": "Hospital Obrero N.º 1",
  "roleTitle": "Médico de planta",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthFacilityConceptId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<AffiliationResponseDto>` · DTO `AffiliationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: La sede indicada no existe |
| 409 | `CONFLICT` | ConflictException: Ese vínculo ya está en el historial laboral; ConflictException: Ese vínculo con el establecimiento ya está en el historial laboral; ConflictException: Ya pidió vincularse a esa sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El fin del vínculo no puede ser anterior a su inicio; PreconditionFailedException: El padrón de establecimientos no está disponible; PreconditionFailedException: El establecimiento no pertenece al padrón oficial de establecimientos de salud |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 31. POST /profiles/practitioners/{profileId}/jurisdiction-authorizations

- **Origen:** CONTRATO
- **Nombre:** Registrar/renovar autorización jurisdiccional (licencia)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addJurisdictionAuthorization` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:372`

### Qué es y para qué sirve (negocio)

Registrar/renovar autorización jurisdiccional (licencia). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/{profileId}/jurisdiction-authorizations` la atiende `ProfilesPractitionersController.addJurisdictionAuthorization` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:372). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateJurisdictionAuthorizationDto` (7 campos, 1 obligatorio). Delega en `ProfilesPractitionersService.addJurisdictionAuthorization`. Crea filas en profiles.jurisdiction_authorizations. Lee common.file_versions, common.files, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:372` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:372` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:114` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → ProfileOwnershipService.assertOwnsPractitionerProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateJurisdictionAuthorizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Nº de licencia | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:20` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de jurisdicción | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:31` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad regulatoria emisora | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:43` |
| `practiceScopeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del alcance de práctica | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:54` |
| `validFrom` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:65` |
| `validTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date) | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:76` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de la matrícula (debe haberlo subido el mismo usuario) | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "licenseNumber": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "licenseNumber": "valor-ejemplo",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "regulatoryAuthority": "valor-ejemplo",
  "practiceScopeConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31",
  "validTo": "2026-07-31",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<JurisdictionAuthorizationResponseDto>` · DTO `JurisdictionAuthorizationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:109` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:115` |
| `licenseNumber` | `string` | Sí | — | — | Valor de license number mantenido por la instancia. | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:121` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado de la licencia | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:130` |
| `fileId` | `string` | No | formato uuid | — | El respaldo adjuntado, si se adjuntó uno. Se devuelve para que quien acaba de cargarla pueda mostrarlo sin releer el perfil entero. | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:137` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/create-jurisdiction-authorization.dto.ts:143` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil profesional o la plataforma pueden modificarlo; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:98` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. DELETE /profiles/practitioners/{profileId}/photo

- **Origen:** CONTRATO
- **Nombre:** Quitar la foto del perfil profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.removePractitionerPhoto` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:338`

### Qué es y para qué sirve (negocio)

Quitar la foto del perfil profesional. Caso de uso P5 §3: Clear the practitioner profile photo (the file is not deleted). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:106`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/practitioners/{profileId}/photo` la atiende `ProfilesPractitionersController.removePractitionerPhoto` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:338). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.removePractitionerPhoto`. Actualiza profiles.health_practitioner_profiles. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:338` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:338` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:44` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:45` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:42` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:43` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonRecordsAdapter.findAllCurrentContacts → ContactPointsRepository.findAllCurrentByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1838` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:180` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unavailableSections` | `array<string>` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:231` |
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:234` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:237` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:240` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:243` |
| `professionalTitle` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:247` |
| `professionalBio` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:251` |
| `photoFileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:255` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:268` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:272` |
| `workEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:283` |
| `personalEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:287` |
| `mobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:291` |
| `workMobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:295` |
| `workLandline` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:299` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:308` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:311` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:314` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:317` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:320` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:327` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:334` |
| `identityVerified` | `boolean` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:342` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:348` |
| `taxId` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:352` |
| `taxHolderName` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:356` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:362` |
| `homeAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:369` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `workAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:373` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:383` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:390` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:401` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:405` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:408` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:411` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:414` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:418` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:421` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:424` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:42` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:45` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:49` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:53` |
| `specialties[].practiceScopeText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:57` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:60` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:63` |
| `specialties[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:67` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:427` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:80` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:83` |
| `credentials[].number` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:87` |
| `credentials[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia; permite descargar el diploma adjunto | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:99` |
| `credentials[].issuingCityText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:103` |
| `credentials[].issuingCountryText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:107` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:111` |
| `credentials[].titleText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:115` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:118` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:121` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:124` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:132` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:140` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:430` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:146` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:149` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:152` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:155` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:158` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:161` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:164` |
| `licenses[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:171` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:433` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:183` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:186` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:189` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:442` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `affiliations[].organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `affiliations[].roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `affiliations[].practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `affiliations[].healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliations[].affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `affiliations[].statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:445` |
| `activity.encounters` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:207` |
| `activity.medicationRequests` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:211` |
| `activity.clinicalNotes` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:215` |
| `activity.documents` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil profesional o la plataforma pueden modificarlo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: Perfil profesional no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:160` |

### Flujos

- Profiles Module (05) — etapa `P5 §3`

---

## 33. PUT /profiles/practitioners/{profileId}/photo

- **Origen:** CONTRATO
- **Nombre:** Fijar la foto del perfil profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.setPractitionerPhoto` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:308`

### Qué es y para qué sirve (negocio)

Fijar la foto del perfil profesional. Caso de uso P5 §3: Set the practitioner profile photo from an already uploaded file. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:105`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /profiles/practitioners/{profileId}/photo` la atiende `ProfilesPractitionersController.setPractitionerPhoto` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:308). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SetPractitionerPhotoDto` (1 campo, 1 obligatorio). Delega en `ProfilesPractitionersService.setPractitionerPhoto`. Actualiza profiles.health_practitioner_profiles. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.file_versions, common.files y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:308` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:308` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:44` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:45` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:42` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:43` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonRecordsAdapter.findAllCurrentContacts → ContactPointsRepository.findAllCurrentByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1790` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:180` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetPractitionerPhotoDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Identificador del archivo ya subido que será la foto | `src/modules/profiles/presentation/dto/set-practitioner-photo.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unavailableSections` | `array<string>` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:231` |
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:234` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:237` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:240` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:243` |
| `professionalTitle` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:247` |
| `professionalBio` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:251` |
| `photoFileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:255` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:268` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:272` |
| `workEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:283` |
| `personalEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:287` |
| `mobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:291` |
| `workMobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:295` |
| `workLandline` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:299` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:308` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:311` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:314` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:317` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:320` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:327` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:334` |
| `identityVerified` | `boolean` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:342` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:348` |
| `taxId` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:352` |
| `taxHolderName` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:356` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:362` |
| `homeAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:369` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `workAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:373` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:383` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:390` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:401` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:405` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:408` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:411` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:414` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:418` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:421` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:424` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:42` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:45` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:49` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:53` |
| `specialties[].practiceScopeText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:57` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:60` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:63` |
| `specialties[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:67` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:427` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:80` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:83` |
| `credentials[].number` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:87` |
| `credentials[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia; permite descargar el diploma adjunto | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:99` |
| `credentials[].issuingCityText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:103` |
| `credentials[].issuingCountryText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:107` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:111` |
| `credentials[].titleText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:115` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:118` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:121` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:124` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:132` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:140` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:430` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:146` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:149` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:152` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:155` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:158` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:161` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:164` |
| `licenses[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:171` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:433` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:183` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:186` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:189` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:442` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `affiliations[].organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `affiliations[].roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `affiliations[].practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `affiliations[].healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliations[].affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `affiliations[].statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:445` |
| `activity.encounters` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:207` |
| `activity.medicationRequests` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:211` |
| `activity.clinicalNotes` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:215` |
| `activity.documents` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil profesional o la plataforma pueden modificarlo; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: {labels.notFound}; ResourceNotFoundException: Perfil profesional no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:149` |

### Flujos

- Profiles Module (05) — etapa `P5 §3`

---

## 34. POST /profiles/practitioners/{profileId}/specialties

- **Origen:** CONTRATO
- **Nombre:** Agregar especialidad con credencial de soporte
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addSpecialty` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:646`

### Qué es y para qué sirve (negocio)

Agregar especialidad con credencial de soporte. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/{profileId}/specialties` la atiende `ProfilesPractitionersController.addSpecialty` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:646). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AddSpecialtyDto` (5 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.addSpecialty`. Crea filas en profiles.practitioner_specialties. Actualiza profiles.practitioner_specialties. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_specialties, profiles.professional_credentials, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:646` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:646` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → ProfileOwnershipService.assertOwnsPractitionerProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_specialties` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → PractitionerSpecialtiesRepository.demotePrimary | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:228` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → PractitionerSpecialtiesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:61` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → ProfessionalCredentialsRepository.findById | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:93` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddSpecialtyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la especialidad | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:15` |
| `supportingCredentialId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Credencial de soporte (debe pertenecer al profesional y estar verificada) | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:27` |
| `specialtyRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del rol de especialidad | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:38` |
| `isPrimary` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca la especialidad como primaria | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:46` |
| `boardCertified` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Certificada por junta (board certified) | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:56` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "supportingCredentialId": "00000000-0000-4000-8000-000000000001",
  "specialtyRoleConceptId": "00000000-0000-4000-8000-000000000001",
  "isPrimary": true,
  "boardCertified": true
}
```

</details>

### Respuesta — `Promise<SpecialtyResponseDto>` · DTO `SpecialtyResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:65` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a specialty concept. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:71` |
| `isPrimary` | `boolean` | Sí | — | — | Valor de is primary mantenido por la instancia. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:77` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:86` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil profesional o la plataforma pueden modificarlo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado |
| 409 | `CONFLICT` | ConflictException: El profesional ya tiene esa especialidad activa |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La credencial de soporte no pertenece al profesional; PreconditionFailedException: La credencial de soporte no está verificada; PreconditionFailedException: Falta indicar la especialidad; PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas; PreconditionFailedException: Un profesional puede declarar hasta {MAX_SPECIALTIES_PER_PRACTITIO…} especialidades |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:118` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. GET /profiles/practitioners/{profileId}/summary

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil profesional de un colega (ficha de la guía)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.getPractitionerSummary` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:214`

### Qué es y para qué sirve (negocio)

Consultar el perfil profesional de un colega (ficha de la guía). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/{profileId}/summary` la atiende `ProfilesPractitionersController.getPractitionerSummary` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:214). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.getPractitionerSummary`. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:214` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:214` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:44` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:45` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:42` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:43` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonRecordsAdapter.findAllCurrentContacts → ContactPointsRepository.findAllCurrentByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:180` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unavailableSections` | `array<string>` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:231` |
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:234` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:237` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:240` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:243` |
| `professionalTitle` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:247` |
| `professionalBio` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:251` |
| `photoFileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:255` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:268` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:272` |
| `workEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:283` |
| `personalEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:287` |
| `mobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:291` |
| `workMobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:295` |
| `workLandline` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:299` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:308` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:311` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:314` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:317` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:320` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:327` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:334` |
| `identityVerified` | `boolean` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:342` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:348` |
| `taxId` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:352` |
| `taxHolderName` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:356` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:362` |
| `homeAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:369` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `workAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:373` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:383` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:390` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:401` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:405` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:408` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:411` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:414` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:418` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:421` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:424` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:42` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:45` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:49` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:53` |
| `specialties[].practiceScopeText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:57` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:60` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:63` |
| `specialties[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:67` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:427` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:80` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:83` |
| `credentials[].number` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:87` |
| `credentials[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia; permite descargar el diploma adjunto | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:99` |
| `credentials[].issuingCityText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:103` |
| `credentials[].issuingCountryText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:107` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:111` |
| `credentials[].titleText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:115` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:118` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:121` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:124` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:132` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:140` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:430` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:146` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:149` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:152` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:155` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:158` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:161` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:164` |
| `licenses[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:171` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:433` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:183` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:186` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:189` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:442` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `affiliations[].organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `affiliations[].roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `affiliations[].practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `affiliations[].healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliations[].affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `affiliations[].statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:445` |
| `activity.encounters` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:207` |
| `activity.medicationRequests` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:211` |
| `activity.clinicalNotes` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:215` |
| `activity.documents` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil profesional no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:190` |
| INTEGRACION | `test/integration/practitioner-license-registration-files.int-spec.ts:121` |
| INTEGRACION | `test/integration/practitioner-own-profile.int-spec.ts:214` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 36. PATCH /profiles/practitioners/me

- **Origen:** CONTRATO
- **Nombre:** Editar la presentación del propio perfil profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.updateOwnPractitionerProfile` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:237`

### Qué es y para qué sirve (negocio)

Editar la presentación del propio perfil profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/me` la atiende `ProfilesPractitionersController.updateOwnPractitionerProfile` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:237). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnPractitionerProfileDto` (35 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.updateOwnPractitionerProfile`. Crea filas en common.contact_points, common.identifiers, profiles.practitioner_languages. Actualiza common.contact_points, profiles.health_practitioner_profiles, profiles.persons, profiles.practitioner_languages. Borra de profiles.practitioner_languages. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 10 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:237` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:44` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:45` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:42` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:43` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceContact → PersonRecordsAdapter.closeContact → ContactPointsRepository.closeCurrent | `src/modules/common/repositories/contact-points.repository.ts:192` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceContact → PersonRecordsAdapter.createContact → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceContact → PersonRecordsAdapter.findCurrentContact → ContactPointsRepository.findCurrentByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:126` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → PersonRecordsAdapter.createIdentifier → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:131` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1317` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1344` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | BORRA | BORRA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceLanguages → PractitionerLanguagesRepository.remove | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:84` |
| `profiles.practitioner_languages` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceLanguages | `src/modules/profiles/application/services/profiles-practitioners.service.ts:1529` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceLanguages → PractitionerLanguagesRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.replaceLanguages → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:180` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.applyProfileUpdate → ProfilesPractitionersService.fixNationalId → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `UpdateOwnPractitionerProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `professionalTitle` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Título profesional | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:104` |
| `professionalBio` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Biografía profesional | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:114` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si acepta pacientes nuevos | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:126` |
| `telehealthAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si atiende por telemedicina | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:132` |
| `name` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:155` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:161` |
| `lastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:167` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:173` |
| `birthDate` | `object` | No | formato date; admite null | `@IsOptional()` `@IsISO8601()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:183` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:196` |
| `nationalId` | `string` | No | longitud mínima 1; longitud máxima 40; patrón runtime /^[A-Za-z0-9.-]+$/ | `@IsOptional()` `@IsString()` `@IsNotEmpty({ message: 'El documento no puede quedar vacío' })` `@MaxLength(40)` `@Matches(/^[A-Za-z0-9.-]+$/, { message: 'El documento sólo admite letras, dígitos, punto y guion', })` | Número del documento de identidad. 409 si la identidad está verificada o en verificación. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:224` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Departamento emisor del documento (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:236` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | Forma anterior de declarar el teléfono. Preferí workMobilePhone. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:248` |
| `workEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsEmail({}, { message: 'El correo de trabajo no es un correo válido' })` `@MaxLength(320)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:267` |
| `personalEmail` | `string` | No | formato email; longitud máxima 320 | `@IsOptional()` `@IsString()` `@MaxLength(320)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:274` |
| `mobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:282` |
| `workMobilePhone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:290` |
| `workLandline` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@IsOptional()` `@IsString()` `@MaxLength(40)` `@Matches(PHONE_PATTERN, { message: PHONE_MESSAGE })` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:298` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:306` |
| `taxId` | `string` | No | longitud máxima 20 | `@IsOptional()` `@IsString()` `@MaxLength(20)` | NIT para facturación. Cadena vacía para quedarse sin NIT. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:316` |
| `taxHolderName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre o razón social del titular del NIT. Cadena vacía para quitarla. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:327` |
| `homeAddressLines` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Domicilio, tal como lo escribe la persona. Vacío para quitarlo. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:347` |
| `homeLatitude` | `object` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.homeLatitude, dto.homeLongitude) && (dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined), )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:359` |
| `homeLongitude` | `object` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.homeLatitude, dto.homeLongitude) && (dto.homeLatitude !== undefined \|\| dto.homeLongitude !== undefined), )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:371` |
| `workAddressLines` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Dirección del lugar de trabajo. Vacío para quitarla. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:381` |
| `workLatitude` | `object` | No | mínimo -90; máximo 90 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.workLatitude, dto.workLongitude) && (dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined), )` `@IsNumber()` `@Min(-90)` `@Max(90)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:393` |
| `workLongitude` | `object` | No | mínimo -180; máximo 180 | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => !removesDot(dto.workLatitude, dto.workLongitude) && (dto.workLatitude !== undefined \|\| dto.workLongitude !== undefined), )` `@IsNumber()` `@Min(-180)` `@Max(180)` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:405` |
| `occupationConceptId` | `string` | No | formato uuid | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => dto.occupationConceptId !== '', )` `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:431` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:446` |
| `workEmployerConceptId` | `string` | No | formato uuid | `@ValidateIf( (dto: UpdateOwnPractitionerProfileDto) => dto.workEmployerConceptId !== '', )` `@IsOptional()` `@IsUUID()` | Empresa donde trabaja (VS_BO_EMPLOYER). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:463` |
| `workEmployerFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(EMPLOYER_FREE_TEXT_MAX_LENGTH)` | Empresa en texto libre. Cadena vacía para borrarla. Se descarta si viene el concepto. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:477` |
| `languages` | `array<PractitionerLanguageInputDto>` | No | máximo 20 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(MAX_PRACTITIONER_LANGUAGES)` `@ValidateNested({ each: true })` `@Type(() => PractitionerLanguageInputDto)` | Idiomas de atención. Reemplaza la lista guardada; [] la vacía. Un idioma no puede repetirse. | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:496` |
| `languages[].languageConceptId` | `string` | No | formato uuid | `@IsUUID()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:84` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:90` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | No | — | `@IsBoolean()` | — | `src/modules/profiles/presentation/dto/update-practitioner-profile.dto.ts:95` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "professionalTitle": "valor-ejemplo",
  "professionalBio": "valor-ejemplo",
  "acceptsNewPatients": true,
  "telehealthAvailable": true,
  "name": "Nombre de ejemplo",
  "middleName": "Nombre de ejemplo",
  "lastName": "Nombre de ejemplo",
  "motherLastName": "Nombre de ejemplo",
  "birthDate": {},
  "sexAtBirth": "MALE",
  "nationalId": "00000000-0000-4000-8000-000000000001",
  "issuerAdministrativeAreaConceptId": "00000000-0000-4000-8000-000000000001",
  "phone": "+59170000000",
  "workEmail": "usuario@example.com",
  "personalEmail": "usuario@example.com",
  "mobilePhone": "+59170000000",
  "workMobilePhone": "+59170000000",
  "workLandline": "valor-ejemplo",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "taxHolderName": "Nombre de ejemplo",
  "homeAddressLines": "valor-ejemplo",
  "homeLatitude": {},
  "homeLongitude": {},
  "workAddressLines": "valor-ejemplo",
  "workLatitude": {},
  "workLongitude": {},
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "workEmployerConceptId": "00000000-0000-4000-8000-000000000001",
  "workEmployerFreeText": "valor-ejemplo",
  "languages": [
    {
      "languageConceptId": "00000000-0000-4000-8000-000000000001",
      "proficiencyConceptId": "00000000-0000-4000-8000-000000000001",
      "clinicalInterpretationAllowed": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unavailableSections` | `array<string>` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:231` |
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:234` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:237` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:240` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:243` |
| `professionalTitle` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:247` |
| `professionalBio` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:251` |
| `photoFileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:255` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:268` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:272` |
| `workEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:283` |
| `personalEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:287` |
| `mobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:291` |
| `workMobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:295` |
| `workLandline` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:299` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:308` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:311` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:314` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:317` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:320` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:327` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:334` |
| `identityVerified` | `boolean` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:342` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:348` |
| `taxId` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:352` |
| `taxHolderName` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:356` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:362` |
| `homeAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:369` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `workAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:373` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:383` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:390` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:401` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:405` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:408` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:411` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:414` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:418` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:421` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:424` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:42` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:45` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:49` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:53` |
| `specialties[].practiceScopeText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:57` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:60` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:63` |
| `specialties[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:67` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:427` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:80` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:83` |
| `credentials[].number` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:87` |
| `credentials[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia; permite descargar el diploma adjunto | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:99` |
| `credentials[].issuingCityText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:103` |
| `credentials[].issuingCountryText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:107` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:111` |
| `credentials[].titleText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:115` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:118` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:121` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:124` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:132` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:140` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:430` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:146` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:149` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:152` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:155` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:158` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:161` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:164` |
| `licenses[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:171` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:433` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:183` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:186` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:189` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:442` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `affiliations[].organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `affiliations[].roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `affiliations[].practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `affiliations[].healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliations[].affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `affiliations[].statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:445` |
| `activity.encounters` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:207` |
| `activity.medicationRequests` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:211` |
| `activity.clinicalNotes` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:215` |
| `activity.documents` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil profesional no encontrado |
| 409 | `CONFLICT` | ConflictException: El documento no se puede corregir desde el perfil: su identidad ya está verificada, o en verificación, con ese número |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: Un idioma no puede declararse dos veces; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-own-profile.int-spec.ts:104` |
| INTEGRACION | `test/integration/practitioner-profile-identity-fields.int-spec.ts:100` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 37. GET /profiles/practitioners/me/affiliations

- **Origen:** CONTRATO
- **Nombre:** Historial laboral propio (instituciones donde trabajó)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.listOwnAffiliations` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:446`

### Qué es y para qué sirve (negocio)

Historial laboral propio (instituciones donde trabajó). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/affiliations` la atiende `ProfilesPractitionersController.listOwnAffiliations` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:446). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.listOwnAffiliations`. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:446` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listOwnAffiliations → ProfilesPractitionersService.listOwnAffiliations → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listOwnAffiliations → ProfilesPractitionersService.listOwnAffiliations → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listOwnAffiliations → ProfilesPractitionersService.listOwnAffiliations → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListAffiliationsResponseDto>` · DTO `ListAffiliationsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AffiliationResponseDto>` | Sí | — | — | Las afiliaciones, de la más reciente a la más antigua. | `src/modules/profiles/presentation/dto/affiliation.dto.ts:258` |
| `items[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `items[].organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `items[].roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `items[].practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `items[].healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `items[].affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `items[].startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `items[].endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `items[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `items[].status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `items[].statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `items[].decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/profiles/presentation/dto/affiliation.dto.ts:264` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 38. POST /profiles/practitioners/me/affiliations

- **Origen:** CONTRATO
- **Nombre:** Registrar una afiliación institucional en el historial propio
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addOwnAffiliation` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:457`

### Qué es y para qué sirve (negocio)

Registrar una afiliación institucional en el historial propio. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/me/affiliations` la atiende `ProfilesPractitionersController.addOwnAffiliation` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:457). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ProfilesCreateAffiliationDto` (7 campos, 2 obligatorios). Delega en `ProfilesPractitionersService.addOwnAffiliation`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, profiles.practitioner_affiliations. Actualiza iam.devices, messaging.notification_requests. Lee directory.tenant_memberships, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:457` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesAffiliationsService.initialState → AffiliationOrganizationsAdapter.hasAdministrators → TenantAdministrationService.hasAdministrators → TenantMembershipsRepository.countActiveByTenantRole | `src/modules/directory/repositories/tenant-memberships.repository.ts:113` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesAffiliationsService.initialState → AffiliationOrganizationsAdapter.findSite | `src/modules/profiles/infrastructure/adapters/affiliation-organizations.adapter.ts:19` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:340` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:339` |
| `profiles.practitioner_affiliations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → PractitionerAffiliationsRepository.create | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:294` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → PractitionerAffiliationsRepository.findSame | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:254` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → ProfilesPractitionersService.orderNotify → ProfilesAffiliationsService.orderNotify | `src/modules/profiles/application/services/profiles-affiliations.service.ts:622` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.addAffiliation → HealthFacilityCatalogService.assertIsHealthFacility → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Cuerpo — DTO `ProfilesCreateAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `organizationName` | `string` | Sí | — | — | Hospital o entidad médica, tal como la declara el profesional | sin fuente |
| `roleTitle` | `string` | No | — | — | Cargo ejercido, cuando aplica | sin fuente |
| `practiceSiteId` | `string` | No | formato uuid | — | Sede de la plataforma (`practice.practice_sites`) cuando la institución está dentro. Se omite para instituciones externas | sin fuente |
| `healthFacilityConceptId` | `string` | No | formato uuid | — | — | sin fuente |
| `affiliationTypeConceptId` | `string` | No | formato uuid | — | Tipo de vínculo laboral (concept id) | sin fuente |
| `startDate` | `string` | Sí | formato date | — | Inicio del vínculo | sin fuente |
| `endDate` | `string` | No | formato date | — | Fin del vínculo. Se omite si sigue ejerciendo ahí | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "organizationName": "Hospital Obrero N.º 1",
  "startDate": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "organizationName": "Hospital Obrero N.º 1",
  "roleTitle": "Médico de planta",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "healthFacilityConceptId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31",
  "endDate": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<AffiliationResponseDto>` · DTO `AffiliationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: La sede indicada no existe |
| 409 | `CONFLICT` | ConflictException: Ese vínculo ya está en el historial laboral; ConflictException: Ese vínculo con el establecimiento ya está en el historial laboral; ConflictException: Ya pidió vincularse a esa sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El fin del vínculo no puede ser anterior a su inicio; PreconditionFailedException: El padrón de establecimientos no está disponible; PreconditionFailedException: El establecimiento no pertenece al padrón oficial de establecimientos de salud |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:204` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 39. DELETE /profiles/practitioners/me/affiliations/{affiliationId}

- **Origen:** CONTRATO
- **Nombre:** Quitar una afiliación del historial laboral propio
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.removeOwnAffiliation` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:508`

### Qué es y para qué sirve (negocio)

Quitar una afiliación del historial laboral propio. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/practitioners/me/affiliations/{affiliationId}` la atiende `ProfilesPractitionersController.removeOwnAffiliation` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:508). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.removeOwnAffiliation`. Borra de profiles.practitioner_affiliations. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:508` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: affiliationId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:508` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnAffiliation → ProfilesPractitionersService.removeOwnAffiliation → ProfilesPractitionersService.ownOrNothing → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnAffiliation → ProfilesPractitionersService.removeOwnAffiliation → ProfilesPractitionersService.ownOrNothing → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | BORRA | BORRA | POR_TIPO | ProfilesPractitionersController.removeOwnAffiliation → ProfilesPractitionersService.removeOwnAffiliation → PractitionerAffiliationsRepository.remove | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:227` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnAffiliation → ProfilesPractitionersService.removeOwnAffiliation → ProfilesPractitionersService.ownOrNothing → PractitionerAffiliationsRepository.findOwn | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:213` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `affiliationId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Afiliación no encontrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 40. PATCH /profiles/practitioners/me/affiliations/{affiliationId}

- **Origen:** CONTRATO
- **Nombre:** Corregir una afiliación del historial laboral propio
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.updateOwnAffiliation` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:482`

### Qué es y para qué sirve (negocio)

Corregir una afiliación del historial laboral propio. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/me/affiliations/{affiliationId}` la atiende `ProfilesPractitionersController.updateOwnAffiliation` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:482). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateAffiliationDto` (5 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.updateOwnAffiliation`. Actualiza profiles.practitioner_affiliations. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:482` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: affiliationId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:482` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnAffiliation → ProfilesPractitionersService.updateOwnAffiliation → ProfilesPractitionersService.ownOrNothing → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnAffiliation → ProfilesPractitionersService.updateOwnAffiliation → ProfilesPractitionersService.ownOrNothing → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnAffiliation → ProfilesPractitionersService.updateOwnAffiliation | `src/modules/profiles/application/services/profiles-practitioners.service.ts:3169` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnAffiliation → ProfilesPractitionersService.updateOwnAffiliation → PractitionerAffiliationsRepository.findSame | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:254` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `affiliationId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `organizationName` | `string` | No | — | — | Hospital o entidad médica, tal como la declara el profesional | sin fuente |
| `roleTitle` | `string` | No | — | — | Cargo ejercido, cuando aplica | sin fuente |
| `affiliationTypeConceptId` | `string` | No | formato uuid | — | Tipo de vínculo laboral (concept id) | sin fuente |
| `startDate` | `string` | No | formato date | — | Inicio del vínculo | sin fuente |
| `endDate` | `object` | No | formato date; admite null | `@IsOptional()` `@IsDateString()` | Fin del vínculo. `null` lo vuelve vigente; omitido, se conserva | `src/modules/profiles/presentation/dto/affiliation.dto.ts:131` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "organizationName": "Hospital Obrero N.º 1",
  "roleTitle": "Médico de planta",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "startDate": "2026-07-31",
  "endDate": {}
}
```

</details>

### Respuesta — `Promise<AffiliationResponseDto>` · DTO `AffiliationResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Afiliación no encontrada |
| 409 | `CONFLICT` | ConflictException: Ese vínculo ya está en el historial laboral |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El fin del vínculo no puede ser anterior a su inicio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 41. POST /profiles/practitioners/me/credentials

- **Origen:** CONTRATO
- **Nombre:** Agregar un título propio (diplomado, maestría, doctorado…)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addOwnCredential` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:535`

### Qué es y para qué sirve (negocio)

Agregar un título propio (diplomado, maestría, doctorado…). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/me/credentials` la atiende `ProfilesPractitionersController.addOwnCredential` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:535). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AddOwnCredentialDto` (9 campos, 2 obligatorios). Delega en `ProfilesPractitionersService.addOwnCredential`. Crea filas en profiles.professional_credentials. Lee common.file_versions, common.files, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:535` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → ProfessionalCredentialsRepository.create | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:122` |

### Cuerpo — DTO `AddOwnCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `credentialTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad) | `src/modules/profiles/presentation/dto/own-credential.dto.ts:33` |
| `number` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:43` |
| `issuingInstitutionText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:54` |
| `issuingCityText` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:61` |
| `issuingCountryText` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:68` |
| `professionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:74` |
| `titleText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:84` |
| `issueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:90` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo del diploma (debe haberlo subido el mismo usuario) | `src/modules/profiles/presentation/dto/own-credential.dto.ts:105` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "number": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "number": "valor-ejemplo",
  "issuingInstitutionText": "valor-ejemplo",
  "issuingCityText": "valor-ejemplo",
  "issuingCountryText": "BO",
  "professionConceptId": "00000000-0000-4000-8000-000000000001",
  "titleText": "valor-ejemplo",
  "issueDate": "2026-07-31",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<OwnCredentialResponseDto>` · DTO `OwnCredentialResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:111` |
| `credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:114` |
| `number` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:117` |
| `issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:120` |
| `issuingCityText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:123` |
| `issuingCountryText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:126` |
| `professionConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:129` |
| `titleText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:132` |
| `issueDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:135` |
| `stateConceptId` | `string` | Sí | formato uuid | — | `CRED_PENDING` recién creada: declararla no es haberla verificado. | `src/modules/profiles/presentation/dto/own-credential.dto.ts:139` |
| `fileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:142` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/own-credential.dto.ts:145` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese concepto no es un tipo de credencial profesional; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-own-credential.int-spec.ts:54` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 42. DELETE /profiles/practitioners/me/credentials/{credentialId}

- **Origen:** CONTRATO
- **Nombre:** Retirar un título propio pendiente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.removeOwnCredential` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:595`

### Qué es y para qué sirve (negocio)

Retirar un título propio pendiente. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/practitioners/me/credentials/{credentialId}` la atiende `ProfilesPractitionersController.removeOwnCredential` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:595). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.removeOwnCredential`. Borra de profiles.professional_credentials. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.professional_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:595` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: credentialId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:595` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnCredential → ProfilesPractitionersService.removeOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnCredential → ProfilesPractitionersService.removeOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.professional_credentials` | BORRA | BORRA | POR_TIPO | ProfilesPractitionersController.removeOwnCredential → ProfilesPractitionersService.removeOwnCredential → ProfessionalCredentialsRepository.remove | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:193` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnCredential → ProfilesPractitionersService.removeOwnCredential → ProfessionalCredentialsRepository.findByIdForUpdate | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:104` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `credentialId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Título no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese título ya fue verificado o rechazado; no se puede retirar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 43. PATCH /profiles/practitioners/me/credentials/{credentialId}

- **Origen:** CONTRATO
- **Nombre:** Editar un título propio pendiente de verificación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.updateOwnCredential` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:558`

### Qué es y para qué sirve (negocio)

Editar un título propio pendiente de verificación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/me/credentials/{credentialId}` la atiende `ProfilesPractitionersController.updateOwnCredential` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:558). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnCredentialDto` (9 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.updateOwnCredential`. Actualiza profiles.professional_credentials. Lee common.file_versions, common.files, profiles.health_practitioner_profiles, profiles.person_account_links, profiles.professional_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:558` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: credentialId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:558` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnCredential → ProfilesPractitionersService.updateOwnCredential → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnCredential → ProfilesPractitionersService.updateOwnCredential → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnCredential → ProfilesPractitionersService.updateOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnCredential → ProfilesPractitionersService.updateOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.professional_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnCredential → ProfilesPractitionersService.updateOwnCredential | `src/modules/profiles/application/services/profiles-practitioners.service.ts:3453` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnCredential → ProfilesPractitionersService.updateOwnCredential → ProfessionalCredentialsRepository.findByIdForUpdate | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:104` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `credentialId` | path | Sí | `string` | Identificador de la credencial propia |

### Cuerpo — DTO `UpdateOwnCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `credentialTypeConceptId` | `string` | No | formato uuid | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsUUID()` | Concept id de tipo de credencial profesional | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:24` |
| `number` | `string` | No | longitud máxima 100; patrón \S; patrón runtime /\S/ | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsString()` `@Matches(/\S/, { message: 'number no puede estar vacío' })` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:32` |
| `issuingInstitutionText` | `string` | No | longitud máxima 200 | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsString()` `@MaxLength(200)` | — | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:39` |
| `issuingCityText` | `string` | No | longitud máxima 120 | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsString()` `@MaxLength(120)` | — | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:46` |
| `issuingCountryText` | `string` | No | longitud máxima 100 | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsString()` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:53` |
| `professionConceptId` | `string` | No | formato uuid | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsUUID()` | — | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:59` |
| `titleText` | `string` | No | longitud máxima 200 | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsString()` `@MaxLength(200)` | — | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:66` |
| `issueDate` | `string` | No | formato date | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsISO8601()` | — | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:72` |
| `fileId` | `string` | No | formato uuid | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsUUID()` | Archivo del diploma (debe haberlo subido el mismo usuario) | `src/modules/profiles/presentation/dto/update-own-credential.dto.ts:81` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "credentialTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "number": "valor-ejemplo",
  "issuingInstitutionText": "valor-ejemplo",
  "issuingCityText": "valor-ejemplo",
  "issuingCountryText": "BO",
  "professionConceptId": "00000000-0000-4000-8000-000000000001",
  "titleText": "valor-ejemplo",
  "issueDate": "2026-07-31",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Título no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese concepto no es un tipo de credencial profesional; PreconditionFailedException: Ese título ya fue verificado o rechazado; no se puede editar; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-own-credential.int-spec.ts:73` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 44. DELETE /profiles/practitioners/me/jurisdiction-authorizations/{licenseId}

- **Origen:** CONTRATO
- **Nombre:** Retirar una matrícula propia pendiente de verificación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.removeOwnLicense` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:761`

### Qué es y para qué sirve (negocio)

Retirar una matrícula propia pendiente de verificación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/practitioners/me/jurisdiction-authorizations/{licenseId}` la atiende `ProfilesPractitionersController.removeOwnLicense` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:761). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.removeOwnLicense`. Borra de profiles.jurisdiction_authorizations. Lee audit.jurisdiction_authorizations_history, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:761` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: licenseId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:761` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `audit.jurisdiction_authorizations_history` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnLicense → ProfilesPractitionersService.removeOwnLicense → PractitionerContextAdapter.hasAuthorizationHistory | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:52` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnLicense → ProfilesPractitionersService.removeOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → PractitionerContextAdapter.hasOpenIdentityCase | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:60` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnLicense → ProfilesPractitionersService.removeOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | BORRA | BORRA | POR_TIPO | ProfilesPractitionersController.removeOwnLicense → ProfilesPractitionersService.removeOwnLicense → JurisdictionAuthorizationsRepository.remove | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:89` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnLicense → ProfilesPractitionersService.removeOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → JurisdictionAuthorizationsRepository.findByIdForUpdate | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:80` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnLicense → ProfilesPractitionersService.removeOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `licenseId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Matrícula no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esa matrícula ya no está pendiente; no se puede {verb}; PreconditionFailedException: Esa matrícula tiene una verificación en curso; no se puede {verb}; PreconditionFailedException: Esa matrícula ya tiene historial de auditoría; no se puede borrar |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 45. PATCH /profiles/practitioners/me/jurisdiction-authorizations/{licenseId}

- **Origen:** CONTRATO
- **Nombre:** Corregir una matrícula propia pendiente de verificación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.updateOwnLicense` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:739`

### Qué es y para qué sirve (negocio)

Corregir una matrícula propia pendiente de verificación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/me/jurisdiction-authorizations/{licenseId}` la atiende `ProfilesPractitionersController.updateOwnLicense` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:739). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnLicenseDto` (4 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.updateOwnLicense`. Lee common.file_versions, common.files, identity_assurance.identity_verification_cases, profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:739` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: licenseId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:739` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnLicense → ProfilesPractitionersService.updateOwnLicense → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnLicense → ProfilesPractitionersService.updateOwnLicense → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `identity_assurance.identity_verification_cases` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnLicense → ProfilesPractitionersService.updateOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → PractitionerContextAdapter.hasOpenIdentityCase | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:60` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnLicense → ProfilesPractitionersService.updateOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnLicense → ProfilesPractitionersService.updateOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → JurisdictionAuthorizationsRepository.findByIdForUpdate | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:80` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnLicense → ProfilesPractitionersService.updateOwnLicense → ProfilesPractitionersService.lockOwnEditableLicense → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `licenseId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateOwnLicenseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `licenseNumber` | `string` | No | longitud máxima 100; patrón \S; patrón runtime /\S/ | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsString()` `@Matches(/\S/, { message: 'licenseNumber no puede estar vacío' })` `@MaxLength(100)` | — | `src/modules/profiles/presentation/dto/update-own-license.dto.ts:25` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsString()` `@MaxLength(200)` | — | `src/modules/profiles/presentation/dto/update-own-license.dto.ts:32` |
| `validFrom` | `string` | No | formato date | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsISO8601()` | — | `src/modules/profiles/presentation/dto/update-own-license.dto.ts:38` |
| `fileId` | `string` | No | formato uuid | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsUUID()` | — | `src/modules/profiles/presentation/dto/update-own-license.dto.ts:44` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "licenseNumber": "valor-ejemplo",
  "regulatoryAuthority": "valor-ejemplo",
  "validFrom": "2026-07-31",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Matrícula no encontrada; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esa matrícula ya no está pendiente; no se puede {verb}; PreconditionFailedException: Esa matrícula tiene una verificación en curso; no se puede {verb}; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 46. GET /profiles/practitioners/me/linkable-organizations

- **Origen:** CONTRATO
- **Nombre:** Buscar instituciones del padrón para declarar una afiliación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.searchLinkableOrganizations` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:414`

### Qué es y para qué sirve (negocio)

Buscar instituciones del padrón para declarar una afiliación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/linkable-organizations` la atiende `ProfilesPractitionersController.searchLinkableOrganizations` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:414). Exige sesión; el controlador no declara roles. Delega en `LinkableOrganizationsService.search`. Lee terminology.catalog_concepts, terminology.concept_properties, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:414` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.search → ProfilesTerminologyAdapter.search → CatalogConceptsRepository.search | `src/modules/terminology/repositories/catalog-concepts.repository.ts:257` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.search → LinkableOrganizationsService.narrowByMunicipality → ProfilesTerminologyAdapter.findPropertyForConcepts → ConceptDesignationsRepository.findPropertyForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:200` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.search → LinkableOrganizationsService.registerMembers → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.search → LinkableOrganizationsService.registerMembers → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.search → LinkableOrganizationsService.registerMembers → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto del nombre |
| `municipality` | query | No | `string` | Municipio exacto; distingue establecimientos homónimos |
| `limit` | query | No | `number` | Tope de resultados (por defecto 20) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListLinkableOrganizationsResponseDto>` · DTO `ListLinkableOrganizationsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<LinkableOrganizationDto>` | Sí | — | — | Los establecimientos que coinciden. | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:65` |
| `items[].facilityConceptId` | `string` | Sí | formato uuid | — | El concepto del establecimiento en el catálogo. Es lo que se guardará como vínculo estructurado cuando `practitioner_affiliations` tenga columna donde anotarlo. Hasta entonces viaja igual: el cliente lo necesita para distinguir dos homónimos, y el contrato no cambia cuando la columna exista. | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:26` |
| `items[].code` | `string` | Sí | — | — | Código estable del establecimiento en el padrón. | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:30` |
| `items[].name` | `string` | Sí | — | — | El nombre canónico, el del padrón. Es el valor que conviene guardar en `organization_name`: mientras cada médico escriba el nombre a mano, «CLINICA FOIANINI», «Clínica Ángel Foianini» y «Centro Médico Foianini» son tres instituciones distintas para el sistema, y son una sola en la realidad. | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:41` |
| `items[].municipality` | `string` | No | admite null | — | Municipio donde está; lo que separa a los homónimos. | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:45` |
| `items[].type` | `string` | No | admite null | — | `CLINICA_PRIVADA`, `HOSPITAL`, `CAJA_SALUD`, `CENTRO_SALUD`, … | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:49` |
| `items[].address` | `string` | No | admite null | — | Dirección declarada en el padrón, cuando la trae. | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:53` |
| `count` | `number` | Sí | — | — | Cantidad devuelta | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:69` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/profiles/presentation/dto/linkable-organization.dto.ts:73` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 47. GET /profiles/practitioners/me/onboarding

- **Origen:** CONTRATO
- **Nombre:** Qué le falta al profesional para completar su alta
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.getOwnOnboarding` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:121`

### Qué es y para qué sirve (negocio)

Qué le falta al profesional para completar su alta. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/onboarding` la atiende `ProfilesPractitionersController.getOwnOnboarding` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:121). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.getOwnOnboarding`. Lee profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links, profiles.practitioner_affiliations, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:121` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → PractitionerContextAdapter.onboardingContext | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:29` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → PractitionerContextAdapter.onboardingContext | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:25` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerOnboardingDto>` · DTO `PractitionerOnboardingDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | — | El perfil consultado. | `src/modules/profiles/presentation/dto/practitioner-onboarding.dto.ts:53` |
| `steps` | `array<OnboardingStepDto>` | Sí | — | — | Las cinco etapas, siempre las cinco y en orden. | `src/modules/profiles/presentation/dto/practitioner-onboarding.dto.ts:56` |
| `steps[].key` | `object` | Sí | — | — | Qué etapa es. | `src/modules/profiles/presentation/dto/practitioner-onboarding.dto.ts:23` |
| `steps[].complete` | `boolean` | Sí | — | — | Está cumplida con los datos que el profesional ya cargó. | `src/modules/profiles/presentation/dto/practitioner-onboarding.dto.ts:26` |
| `steps[].missing` | `array<string>` | Sí | — | — | Qué falta, en claves estables que la pantalla traduce. Van en clave y no en prosa porque el texto es del front: acá se dice qué falta, no cómo se le pide a la persona. | `src/modules/profiles/presentation/dto/practitioner-onboarding.dto.ts:34` |
| `firstIncomplete` | `object` | Sí | valores: done | — | La primera etapa incompleta, o `done` si no queda ninguna. Es lo único que la pantalla necesita para decidir dónde aterrizar. | `src/modules/profiles/presentation/dto/practitioner-onboarding.dto.ts:64` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: La cuenta no tiene perfil profesional |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:53` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:179` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 48. GET /profiles/practitioners/me/signature-assets

- **Origen:** CONTRATO
- **Nombre:** Consultar las imágenes de firma y sello propias
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSignatureAssetsController.getOwn` — `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:25`

### Qué es y para qué sirve (negocio)

Consultar las imágenes de firma y sello propias. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/signature-assets` la atiende `PractitionerSignatureAssetsController.getOwn` (src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:25). Exige sesión; el controlador no declara roles. Delega en `PractitionerSignatureAssetsService.getOwn`. Lee profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSignatureAssetsController.getOwn → PractitionerSignatureAssetsService.getOwn | `src/modules/profiles/application/services/practitioner-signature-assets.service.ts:41` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSignatureAssetsController.getOwn → PractitionerSignatureAssetsService.getOwn → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerSignatureAssetsDto>` · DTO `PractitionerSignatureAssetsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureFileId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/practitioner-signature-assets.dto.ts:18` |
| `sealFileId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/practitioner-signature-assets.dto.ts:21` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil profesional no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-signature-registration.int-spec.ts:76` |
| CONTROLADOR | `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.spec.ts:13` |

### Flujos

- Profiles Module (05) — etapa `ctrl:PractitionerSignatureAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 49. PUT /profiles/practitioners/me/signature-assets

- **Origen:** CONTRATO
- **Nombre:** Guardar o quitar las imágenes de firma y sello propias
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PractitionerSignatureAssetsController.setOwn` — `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:34`

### Qué es y para qué sirve (negocio)

Guardar o quitar las imágenes de firma y sello propias. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /profiles/practitioners/me/signature-assets` la atiende `PractitionerSignatureAssetsController.setOwn` (src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:34). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SetPractitionerSignatureAssetsDto` (2 campos, 0 obligatorios). Delega en `PractitionerSignatureAssetsService.setOwn`. Actualiza profiles.health_practitioner_profiles. Lee common.file_versions, common.files, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.ts:34` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | PractitionerSignatureAssetsController.setOwn → PractitionerSignatureAssetsService.setOwn → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → AttachableFileService.assertVersionUsable → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:75` |
| `common.files` | LEE | LEE | DIRECTA | PractitionerSignatureAssetsController.setOwn → PractitionerSignatureAssetsService.setOwn → AttachableFilesAdapter.assertUsableBy → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:47` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | PractitionerSignatureAssetsController.setOwn → PractitionerSignatureAssetsService.setOwn | `src/modules/profiles/application/services/practitioner-signature-assets.service.ts:77` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PractitionerSignatureAssetsController.setOwn → PractitionerSignatureAssetsService.setOwn | `src/modules/profiles/application/services/practitioner-signature-assets.service.ts:56` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PractitionerSignatureAssetsController.setOwn → PractitionerSignatureAssetsService.setOwn → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `SetPractitionerSignatureAssetsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureFileId` | `object` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | — | `src/modules/profiles/presentation/dto/practitioner-signature-assets.dto.ts:8` |
| `sealFileId` | `object` | No | formato uuid; admite null | `@IsOptional()` `@IsUUID()` | — | `src/modules/profiles/presentation/dto/practitioner-signature-assets.dto.ts:13` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "signatureFileId": {},
  "sealFileId": {}
}
```

</details>

### Respuesta — `Promise<PractitionerSignatureAssetsDto>` · DTO `PractitionerSignatureAssetsDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `signatureFileId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/practitioner-signature-assets.dto.ts:18` |
| `sealFileId` | `object` | Sí | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/practitioner-signature-assets.dto.ts:21` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil profesional no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso; PreconditionFailedException: La imagen supera el límite de 2 MB |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/practitioner-signature-assets.controller.spec.ts:24` |

### Flujos

- Profiles Module (05) — etapa `ctrl:PractitionerSignatureAssetsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 50. DELETE /profiles/practitioners/me/specialties/{specialtyId}

- **Origen:** CONTRATO
- **Nombre:** Retirar una especialidad propia pendiente de verificación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.removeOwnSpecialty` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:718`

### Qué es y para qué sirve (negocio)

Retirar una especialidad propia pendiente de verificación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/practitioners/me/specialties/{specialtyId}` la atiende `ProfilesPractitionersController.removeOwnSpecialty` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:718). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.removeOwnSpecialty`. Borra de profiles.practitioner_specialties. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_specialties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:718` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: specialtyId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:718` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnSpecialty → ProfilesPractitionersService.removeOwnSpecialty → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnSpecialty → ProfilesPractitionersService.removeOwnSpecialty → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_specialties` | BORRA | BORRA | POR_TIPO | ProfilesPractitionersController.removeOwnSpecialty → ProfilesPractitionersService.removeOwnSpecialty → PractitionerSpecialtiesRepository.remove | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:110` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removeOwnSpecialty → ProfilesPractitionersService.removeOwnSpecialty → PractitionerSpecialtiesRepository.findByIdForUpdate | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:101` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `specialtyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Especialidad no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esa especialidad ya no está pendiente de verificación; no se puede {verb} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 51. PATCH /profiles/practitioners/me/specialties/{specialtyId}

- **Origen:** CONTRATO
- **Nombre:** Corregir una especialidad propia pendiente de verificación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.updateOwnSpecialty` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:692`

### Qué es y para qué sirve (negocio)

Corregir una especialidad propia pendiente de verificación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/me/specialties/{specialtyId}` la atiende `ProfilesPractitionersController.updateOwnSpecialty` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:692). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnSpecialtyDto` (2 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.updateOwnSpecialty`. Actualiza profiles.practitioner_specialties. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_specialties, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:692` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: specialtyId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:692` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnSpecialty → ProfilesPractitionersService.updateOwnSpecialty → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnSpecialty → ProfilesPractitionersService.updateOwnSpecialty → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_specialties` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnSpecialty → ProfilesPractitionersService.updateOwnSpecialty | `src/modules/profiles/application/services/profiles-practitioners.service.ts:2632` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnSpecialty → ProfilesPractitionersService.updateOwnSpecialty → PractitionerSpecialtiesRepository.findByIdForUpdate | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:101` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnSpecialty → ProfilesPractitionersService.updateOwnSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:437` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnSpecialty → ProfilesPractitionersService.updateOwnSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findIncludedConceptIdsByValueSet → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:611` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnSpecialty → ProfilesPractitionersService.updateOwnSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ProfilesTerminologyAdapter.findByInternalCode → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:120` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `specialtyId` | path | Sí | `string` | — |

### Cuerpo — DTO `UpdateOwnSpecialtyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specialtyConceptId` | `string` | No | formato uuid | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsUUID()` | Concept id de la especialidad (VS_MEDICAL_SPECIALTY) | `src/modules/profiles/presentation/dto/update-own-specialty.dto.ts:20` |
| `boardCertified` | `boolean` | No | — | `@ValidateIf((_dto, value: unknown) => value !== undefined)` `@IsBoolean()` | Certificada por junta | `src/modules/profiles/presentation/dto/update-own-specialty.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "boardCertified": true
}
```

</details>

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Especialidad no encontrada |
| 409 | `CONFLICT` | ConflictException: El profesional ya tiene esa especialidad activa |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Esa especialidad ya no está pendiente de verificación; no se puede {verb}; PreconditionFailedException: El catálogo de especialidades médicas no está disponible; PreconditionFailedException: La especialidad no pertenece al catálogo de especialidades médicas |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 52. PATCH /profiles/practitioners/me/specialties/{specialtyId}/primary

- **Origen:** CONTRATO
- **Nombre:** Marcar una especialidad propia como la principal
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.setOwnPrimarySpecialty` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:668`

### Qué es y para qué sirve (negocio)

Marcar una especialidad propia como la principal. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/me/specialties/{specialtyId}/primary` la atiende `ProfilesPractitionersController.setOwnPrimarySpecialty` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:668). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.setOwnPrimarySpecialty`. Actualiza profiles.practitioner_specialties. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_specialties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:668` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: specialtyId | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:668` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setOwnPrimarySpecialty → ProfilesPractitionersService.setOwnPrimarySpecialty → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setOwnPrimarySpecialty → ProfilesPractitionersService.setOwnPrimarySpecialty → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_specialties` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPractitionersController.setOwnPrimarySpecialty → ProfilesPractitionersService.setOwnPrimarySpecialty → PractitionerSpecialtiesRepository.demotePrimary | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:228` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setOwnPrimarySpecialty → ProfilesPractitionersService.setOwnPrimarySpecialty → PractitionerSpecialtiesRepository.findById | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:93` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `specialtyId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SpecialtyResponseDto>` · DTO `SpecialtyResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:65` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a specialty concept. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:71` |
| `isPrimary` | `boolean` | Sí | — | — | Valor de is primary mantenido por la instancia. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:77` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:86` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/presentation/dto/add-specialty.dto.ts:92` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Especialidad no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una especialidad que ya no ejerce no puede ser la principal |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.spec.ts:106` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 53. GET /profiles/practitioners/me/summary

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil profesional propio (trayectoria y actividad)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.getOwnPractitionerProfile` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:97`

### Qué es y para qué sirve (negocio)

Consultar el perfil profesional propio (trayectoria y actividad). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/summary` la atiende `ProfilesPractitionersController.getOwnPractitionerProfile` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:97). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.getOwnPractitionerProfile`. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:97` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:44` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:45` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:42` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity → PractitionerContextAdapter.activity | `src/modules/profiles/infrastructure/adapters/practitioner-context.adapter.ts:43` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentAddress → AddressesRepository.findCurrentByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PersonRecordsAdapter.findAllCurrentContacts → ContactPointsRepository.findAllCurrentByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.readDocumentAndAddresses → PersonRecordsAdapter.findCurrentIdentifiers | `src/modules/profiles/infrastructure/adapters/person-records.adapter.ts:128` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:71` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/jurisdiction-authorizations.repository.ts:107` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/infrastructure/repositories/persons.repository.ts:94` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:143` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/infrastructure/repositories/professional-credentials.repository.ts:180` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `unavailableSections` | `array<string>` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:231` |
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:234` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:237` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:240` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:243` |
| `professionalTitle` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:247` |
| `professionalBio` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:251` |
| `photoFileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:255` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:268` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:272` |
| `workEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:283` |
| `personalEmail` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:287` |
| `mobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:291` |
| `workMobilePhone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:295` |
| `workLandline` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:299` |
| `name` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:308` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:311` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:314` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:317` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:320` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:327` |
| `nationalId` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:334` |
| `identityVerified` | `boolean` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:342` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:348` |
| `taxId` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:352` |
| `taxHolderName` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:356` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:362` |
| `homeAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:369` |
| `homeAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `homeAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `homeAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `homeAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `homeAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `workAddress` | `OwnAddressDto` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:373` |
| `workAddress.lines` | `string` | No | — | — | Calle y número, tal como la escribió | `src/modules/profiles/presentation/dto/read-patients.dto.ts:329` |
| `workAddress.city` | `string` | No | — | — | Ciudad, derivada del municipio | `src/modules/profiles/presentation/dto/read-patients.dto.ts:332` |
| `workAddress.municipalityConceptId` | `string` | No | formato uuid | — | Municipio (VS_BO_MUNICIPALITY) | `src/modules/profiles/presentation/dto/read-patients.dto.ts:338` |
| `workAddress.latitude` | `number` | No | — | — | Latitud, si marcó el punto en el mapa | `src/modules/profiles/presentation/dto/read-patients.dto.ts:341` |
| `workAddress.longitude` | `number` | No | — | — | Longitud; viaja siempre junto a la latitud | `src/modules/profiles/presentation/dto/read-patients.dto.ts:346` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:383` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:390` |
| `workEmployerConceptId` | `string` | No | formato uuid | — | Empresa donde trabaja, del catálogo (VS_BO_EMPLOYER) | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:401` |
| `workEmployerFreeText` | `string` | No | — | — | Empresa declarada en texto libre | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:405` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:408` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:411` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:414` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:418` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:421` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:424` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:42` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:45` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:49` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:53` |
| `specialties[].practiceScopeText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:57` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:60` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:63` |
| `specialties[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:67` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:427` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:80` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:83` |
| `credentials[].number` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:87` |
| `credentials[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia; permite descargar el diploma adjunto | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:99` |
| `credentials[].issuingCityText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:103` |
| `credentials[].issuingCountryText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:107` |
| `credentials[].professionConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:111` |
| `credentials[].titleText` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:115` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:118` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:121` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:124` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:132` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:140` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:430` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:146` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:149` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:152` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:155` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:158` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:161` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:164` |
| `licenses[].fileId` | `string` | No | formato uuid | — | Sólo en la lectura propia | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:171` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:433` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:183` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:186` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:189` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:442` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:139` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:145` |
| `affiliations[].organizationName` | `string` | Sí | — | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:151` |
| `affiliations[].roleTitle` | `object` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:157` |
| `affiliations[].practiceSiteId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:163` |
| `affiliations[].healthFacilityConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:169` |
| `affiliations[].affiliationTypeConceptId` | `object` | No | formato uuid; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:175` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:181` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:187` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/presentation/dto/affiliation.dto.ts:196` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:202` |
| `affiliations[].statusKind` | `string` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:227` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:243` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/affiliation.dto.ts:249` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:445` |
| `activity.encounters` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:207` |
| `activity.medicationRequests` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:211` |
| `activity.clinicalNotes` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:215` |
| `activity.documents` | `number` | Sí | — | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:219` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/presentation/dto/read-practitioner-profile.dto.ts:448` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil profesional no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/practitioner-credential-registration-files.int-spec.ts:159` |
| INTEGRACION | `test/integration/practitioner-license-registration-files.int-spec.ts:106` |
| INTEGRACION | `test/integration/practitioner-own-credential.int-spec.ts:83` |
| INTEGRACION | `test/integration/practitioner-own-profile.int-spec.ts:93` |
| INTEGRACION | `test/integration/practitioner-profile-identity-fields.int-spec.ts:87` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 54. GET /profiles/practitioners/specialty-counts

- **Origen:** CONTRATO
- **Nombre:** Contar profesionales visibles por especialidad
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.countPractitionersBySpecialty` — `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:195`

### Qué es y para qué sirve (negocio)

Contar profesionales visibles por especialidad. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/specialty-counts` la atiende `ProfilesPractitionersController.countPractitionersBySpecialty` (src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:195). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.countPractitionersBySpecialty`. Lee profiles.health_practitioner_profiles, profiles.practitioner_specialties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/profiles-practitioners.controller.ts:195` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.countPractitionersBySpecialty → ProfilesPractitionersService.countPractitionersBySpecialty → HealthPractitionerProfilesRepository.findVisibleProfileIds | `src/modules/profiles/infrastructure/repositories/health-practitioner-profiles.repository.ts:144` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.countPractitionersBySpecialty → ProfilesPractitionersService.countPractitionersBySpecialty → PractitionerSpecialtiesRepository.findCurrentSpecialtyPairs | `src/modules/profiles/infrastructure/repositories/practitioner-specialties.repository.ts:211` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListSpecialtyCountsResponseDto>` · DTO `ListSpecialtyCountsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<SpecialtyPractitionerCountDto>` | Sí | — | — | Una fila por especialidad con al menos un profesional. Las que no tienen a nadie **no viajan**: una tarjeta que promete y abre vacía es peor que no estar. | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:180` |
| `items[].specialtyConceptId` | `string` | Sí | — | — | Concepto de la especialidad | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:155` |
| `items[].practitionerCount` | `number` | Sí | — | — | Profesionales visibles que la ejercen | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:161` |
| `practitionerTotal` | `number` | Sí | — | — | Profesionales visibles, sin repetir | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:188` |
| `withoutSpecialtyCount` | `number` | Sí | — | — | Visibles sin ninguna especialidad vigente | `src/modules/profiles/presentation/dto/list-practitioners.dto.ts:199` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 55. GET /tenants/{tenantId}/practitioner-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitudes de médicos que piden atender en la organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.list` — `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:58`

### Qué es y para qué sirve (negocio)

Solicitudes de médicos que piden atender en la organización. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/practitioner-requests` la atiende `TenantPractitionerRequestsController.list` (src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:58). Exige sesión; el controlador no declara roles. Delega en `ProfilesAffiliationsService.listRequests`. Lee directory.tenant_memberships, practice.practice_sites, profiles.jurisdiction_authorizations, profiles.persons, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:58` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:58` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listRequests → AffiliationOrganizationsAdapter.assertCanAdminister → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.canAdminister → TenantAdministrationService.administersByMembership → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listRequests → AffiliationOrganizationsAdapter.findSitesByTenant | `src/modules/profiles/infrastructure/adapters/affiliation-organizations.adapter.ts:23` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listRequests → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:340` |
| `profiles.persons` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listRequests → ProfilesAffiliationsService.identity | `src/modules/profiles/application/services/profiles-affiliations.service.ts:339` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listRequests → PractitionerAffiliationsRepository.findBySites | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:159` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AffiliationRequestListDto>` · DTO `AffiliationRequestListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AffiliationRequestDto>` | Sí | — | — | Las solicitudes pendientes, de la más reciente a la más antigua. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:80` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la solicitud, con el que se aprueba o rechaza. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:17` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid | — | Profesional que pide el vínculo. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:21` |
| `items[].practitionerName` | `string` | Sí | admite null | — | Cómo se llama quien pide, para poder decidir. Sin esto la bandeja mostraba cargo, institución y fecha, y ningún nombre: quien administra la organización tenía que aprobar o rechazar a un identificador. Nadie acepta a alguien que no sabe quién es —y si acepta igual, es peor—, así que el pedido viaja identificado. `null` si el profesional no tiene nombre cargado, que la pantalla debe contar como dato faltante y no como una persona anónima. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:35` |
| `items[].practitionerLicense` | `string` | Sí | admite null | — | Matrícula del Ministerio, que es lo que lo habilita a ejercer. Es el dato con el que una organización verifica de verdad a quien le pide entrar: el nombre dice quién dice ser, la matrícula dice si puede. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:44` |
| `items[].organizationName` | `string` | Sí | — | — | Institución tal como la declaró el profesional. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:48` |
| `items[].roleTitle` | `string` | No | admite null | — | Cargo declarado, cuando el vínculo lo tiene. Opcional desde ALV-007: un pedido de "atiendo en mi propio consultorio" no tiene cargo dentro de una jerarquía. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:57` |
| `items[].practiceSiteId` | `string` | Sí | formato uuid; admite null | — | Sede de la organización a la que apunta el pedido. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:61` |
| `items[].startDate` | `string` | Sí | formato date-time | — | Desde cuándo dice que el vínculo empieza. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:65` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del vínculo. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:69` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se pidió. | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:73` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:220` |

### Flujos

- Profiles Module (05) — etapa `ctrl:TenantPractitionerRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 56. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar la solicitud de un profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.approve` — `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:73`

### Qué es y para qué sirve (negocio)

Aprobar la solicitud de un profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve` la atiende `TenantPractitionerRequestsController.approve` (src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:73). Exige sesión; el controlador no declara roles. Delega en `ProfilesAffiliationsService.approve`. Crea filas en directory.tenant_memberships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza iam.devices, messaging.notification_requests, profiles.practitioner_affiliations. Lee directory.tenant_memberships, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:73` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, affiliationId | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:73` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → AffiliationOrganizationsAdapter.ensureCareMembership → DirectoryMembershipsService.ensureCareMembership → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → AffiliationOrganizationsAdapter.ensureCareMembership → DirectoryMembershipsService.ensureCareMembership → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → AffiliationOrganizationsAdapter.findSiteForTenant | `src/modules/profiles/infrastructure/adapters/affiliation-organizations.adapter.ts:31` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.practitioner_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide | `src/modules/profiles/application/services/profiles-affiliations.service.ts:512` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.approve → ProfilesAffiliationsService.decide → PractitionerAffiliationsRepository.findById | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:193` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `affiliationId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {decision.siNoEsta} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:233` |

### Flujos

- Profiles Module (05) — etapa `ctrl:TenantPractitionerRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 57. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar la solicitud de un profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.reject` — `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:90`

### Qué es y para qué sirve (negocio)

Rechazar la solicitud de un profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject` la atiende `TenantPractitionerRequestsController.reject` (src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:90). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RejectAffiliationDto` (1 campo, 0 obligatorios). Delega en `ProfilesAffiliationsService.reject`. Crea filas en directory.tenant_memberships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza iam.devices, messaging.notification_requests, profiles.practitioner_affiliations. Lee directory.tenant_memberships, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:90` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, affiliationId | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:90` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → AffiliationOrganizationsAdapter.ensureCareMembership → DirectoryMembershipsService.ensureCareMembership → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → AffiliationOrganizationsAdapter.ensureCareMembership → DirectoryMembershipsService.ensureCareMembership → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → AffiliationOrganizationsAdapter.findSiteForTenant | `src/modules/profiles/infrastructure/adapters/affiliation-organizations.adapter.ts:31` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.practitioner_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide | `src/modules/profiles/application/services/profiles-affiliations.service.ts:512` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.reject → ProfilesAffiliationsService.decide → PractitionerAffiliationsRepository.findById | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:193` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `affiliationId` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(MAX_REJECT_REASON_LENGTH)` | — | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:102` |

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

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {decision.siNoEsta} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:TenantPractitionerRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 58. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Dar de baja un vínculo ya aprobado
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.revoke` — `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:118`

### Qué es y para qué sirve (negocio)

Dar de baja un vínculo ya aprobado. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke` la atiende `TenantPractitionerRequestsController.revoke` (src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:118). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RejectAffiliationDto` (1 campo, 0 obligatorios). Delega en `ProfilesAffiliationsService.revoke`. Crea filas en directory.tenant_memberships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza iam.devices, messaging.notification_requests, profiles.practitioner_affiliations. Lee directory.tenant_memberships, iam.devices, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs y 4 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:118` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:276` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, affiliationId | `src/modules/profiles/presentation/controllers/tenant-practitioner-requests.controller.ts:118` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:143` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → AffiliationOrganizationsAdapter.ensureCareMembership → DirectoryMembershipsService.ensureCareMembership → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → AffiliationOrganizationsAdapter.ensureCareMembership → DirectoryMembershipsService.ensureCareMembership → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `iam.devices` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser → WebPushService.sendTo → WebPushService.forget | `src/modules/messaging/services/web-push.service.ts:235` |
| `iam.devices` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → WebPushService.pushToUser | `src/modules/messaging/services/web-push.service.ts:172` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:519` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.notify → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.issue → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → AffiliationOrganizationsAdapter.findSiteForTenant | `src/modules/profiles/infrastructure/adapters/affiliation-organizations.adapter.ts:31` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → ProfilesAffiliationsService.grantMembership → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/infrastructure/repositories/person-account-links.repository.ts:101` |
| `profiles.practitioner_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide | `src/modules/profiles/application/services/profiles-affiliations.service.ts:512` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revoke → ProfilesAffiliationsService.decide → PractitionerAffiliationsRepository.findById | `src/modules/profiles/infrastructure/repositories/practitioner-affiliations.repository.ts:193` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `affiliationId` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(MAX_REJECT_REASON_LENGTH)` | — | `src/modules/profiles/presentation/dto/affiliation-request.dto.ts:102` |

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

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 204 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Se requiere ser OWNER o ADMIN de la organización, o administrador de la plataforma |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Solicitud no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: {decision.siNoEsta} |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:TenantPractitionerRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

