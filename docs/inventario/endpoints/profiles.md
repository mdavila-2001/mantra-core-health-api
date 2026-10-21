<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `profiles`

- **Bloque:** Núcleo y Terminología (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)
- **Operaciones:** 36 (32 en el contrato, 4 sólo en el código)
- **Riesgo:** ALTO 12 · MEDIO 10 · BAJO 14
- **Tablas distintas que tocan:** 46
- **Respuestas de error y detalle contractual:** `openapi/endpoints/profiles.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/profiles/credentials/{credentialId}/verify` | Verificar credencial profesional | MEDIO | 8 | SECURITY_ADMIN |
| 2 | GET | `/profiles/patients` | UC-05-13: listado paginado de pacientes | BAJO | 6 | SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER |
| 3 | POST | `/profiles/patients` | Alta de persona y perfil de paciente | MEDIO | 4 | SECURITY_ADMIN |
| 4 | GET | `/profiles/patients/{profileId}` | UC-05-14: ficha de filiación de un paciente (F-01) | BAJO | 3 | SECURITY_ADMIN |
| 5 | POST | `/profiles/patients/{profileId}/identity-links` | Vincular identidad externa de paciente (MPI) | MEDIO | 5 | SECURITY_ADMIN |
| 6 | POST | `/profiles/patients/{profileId}/portal-proxies` | Otorgar proxy de portal a un representante | MEDIO | 4 | SECURITY_ADMIN |
| 7 | POST | `/profiles/patients/{profileId}/related-persons` | Registrar persona relacionada / contacto de emergencia | ALTO | 6 | sesión (sin roles) |
| 8 | GET | `/profiles/patients/me` | Consultar los propios datos de filiación | BAJO | 11 | sesión (sin roles) |
| 9 | PATCH | `/profiles/patients/me` | Editar los propios datos de filiación | ALTO | 17 | sesión (sin roles) |
| 10 | DELETE | `/profiles/patients/me/photo` | Quitar la foto de perfil propia. Quita la referencia; el archivo no se toca. Idempotente. | BAJO | 11 | sesión (sin roles) |
| 11 | PUT | `/profiles/patients/me/photo` | Fijar la foto de perfil propia. Sin `@Roles` por lo mismo que el resto de `patients/me/*`: el sujeto lo resuelve el servidor desde la sesión y no hay parámetro que apunte a otro. `PUT` porque el resultado no depende de cuántas veces se pida: la persona queda con esa foto. | BAJO | 13 | sesión (sin roles) |
| 12 | GET | `/profiles/patients/me/summary` | Consultar el resumen propio | BAJO | 3 | sesión (sin roles) |
| 13 | POST | `/profiles/patients/merge` | Fusionar pacientes duplicados | MEDIO | 8 | SECURITY_ADMIN |
| 14 | GET | `/profiles/patients/merge-events` | Listar eventos de fusión de pacientes | BAJO | 1 | SECURITY_ADMIN |
| 15 | POST | `/profiles/patients/merge/{eventId}/reverse` | Revertir una fusión de pacientes | MEDIO | 6 | SECURITY_ADMIN |
| 16 | POST | `/profiles/persons/{personId}/account-links` | Vincular cuenta de portal a una persona | MEDIO | 3 | SECURITY_ADMIN |
| 17 | POST | `/profiles/persons/{personId}/decease` | Registrar defunción y anonimización de una persona | MEDIO | 4 | SECURITY_ADMIN |
| 18 | GET | `/profiles/practitioners` | Listar profesionales para la guía, con sus especialidades | BAJO | 3 | sesión (sin roles) |
| 19 | POST | `/profiles/practitioners` | Alta de profesional de salud (workforce generalista) | MEDIO | 12 | SECURITY_ADMIN |
| 20 | POST | `/profiles/practitioners/{profileId}/affiliations` | Un consultorio de OTRO profesional — las fichas de directorio. Los profesionales que publican las redes de las aseguradoras no tienen cuenta —no traen correo— y por eso no pueden declarar dónde atienden. Sin esta ruta, un médico con tres consultorios se veía sin ninguno. Pide rol administrativo: escribir el historial laboral de alguien que no está mirando es otra cosa que escribir el propio. | MEDIO | 20 | SECURITY_ADMIN |
| 21 | POST | `/profiles/practitioners/{profileId}/jurisdiction-authorizations` | Registrar/renovar autorización jurisdiccional (licencia) | ALTO | 3 | sesión (sin roles) |
| 22 | DELETE | `/profiles/practitioners/{profileId}/photo` | Quitar la foto del perfil profesional | ALTO | 16 | sesión (sin roles) |
| 23 | PUT | `/profiles/practitioners/{profileId}/photo` | Fijar la foto del perfil profesional | ALTO | 18 | sesión (sin roles) |
| 24 | POST | `/profiles/practitioners/{profileId}/specialties` | Agregar especialidad con credencial de soporte | ALTO | 9 | sesión (sin roles) |
| 25 | GET | `/profiles/practitioners/{profileId}/summary` | Consultar el perfil profesional de un colega (ficha de la guía) | BAJO | 15 | sesión (sin roles) |
| 26 | PATCH | `/profiles/practitioners/me` | Editar la presentación del propio perfil profesional | ALTO | 20 | sesión (sin roles) |
| 27 | GET | `/profiles/practitioners/me/affiliations` | Historial laboral propio (instituciones donde trabajó) | BAJO | 3 | sesión (sin roles) |
| 28 | POST | `/profiles/practitioners/me/affiliations` | Registrar una afiliación institucional en el historial propio | ALTO | 20 | sesión (sin roles) |
| 29 | POST | `/profiles/practitioners/me/credentials` | Los títulos propios, uno por llamada. Va bajo `practitioners/me` y no bajo `practitioners/:profileId` porque el sujeto sale de la sesión: así no existe la forma de escribir la formación de otro profesional, ni siquiera equivocándose de id. | ALTO | 5 | sesión (sin roles) |
| 30 | GET | `/profiles/practitioners/me/linkable-organizations` | Buscar instituciones del padrón para declarar una afiliación | BAJO | 5 | sesión (sin roles) |
| 31 | GET | `/profiles/practitioners/me/onboarding` | Qué le falta al profesional para completar su alta | BAJO | 7 | sesión (sin roles) |
| 32 | GET | `/profiles/practitioners/me/summary` | Consultar el perfil profesional propio (trayectoria y actividad) | BAJO | 15 | sesión (sin roles) |
| 33 | GET | `/tenants/{tenantId}/practitioner-requests` | Solicitudes de médicos que piden atender en la organización | BAJO | 5 | sesión (sin roles) |
| 34 | POST | `/tenants/{tenantId}/practitioner-requests/{affiliationId}/approve` | Aprobar la solicitud de un profesional | ALTO | 17 | sesión (sin roles) |
| 35 | POST | `/tenants/{tenantId}/practitioner-requests/{affiliationId}/reject` | Rechazar la solicitud de un profesional | ALTO | 17 | sesión (sin roles) |
| 36 | POST | `/tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke` | Dar de baja un vínculo ya aprobado | ALTO | 17 | sesión (sin roles) |

---

## 1. POST /profiles/credentials/{credentialId}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar credencial profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.verifyCredential` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:431`

### Qué es y para qué sirve (negocio)

Verificar credencial profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/credentials/{credentialId}/verify` la atiende `ProfilesPractitionersController.verifyCredential` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:431). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `VerifyCredentialDto` (2 campos, 1 obligatorio). Delega en `ProfilesPractitionersService.verifyCredential`. Crea filas en authz.user_role_assignments. Actualiza profiles.health_practitioner_profiles, profiles.professional_credentials. Lee authz.roles, authz.user_role_assignments, profiles.health_practitioner_profiles, profiles.person_account_links, profiles.professional_credentials.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:431` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: credentialId | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:431` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → AuthzEffectiveRolesService.ensureRoleByCode | `src/modules/authz/services/authz-effective-roles.service.ts:95` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.create | `src/modules/authz/repositories/user-role-assignments.repository.ts:102` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → AuthzEffectiveRolesService.ensureRoleByCode → UserRoleAssignmentsRepository.findActive | `src/modules/authz/repositories/user-role-assignments.repository.ts:55` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential | `src/modules/profiles/services/profiles-practitioners.service.ts:1374` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.professional_credentials` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential | `src/modules/profiles/services/profiles-practitioners.service.ts:1350` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.verifyCredential → ProfilesPractitionersService.verifyCredential → ProfessionalCredentialsRepository.findById | `src/modules/profiles/repositories/professional-credentials.repository.ts:84` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `credentialId` | path | Sí | `string` | — |

### Cuerpo — DTO `VerifyCredentialDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: VERIFIED, REJECTED | `@IsIn(['VERIFIED', 'REJECTED'])` | Resultado de la verificación | `src/modules/profiles/dto/verify-credential.dto.ts:17` |
| `verificationSourceUri` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | URI de la fuente de verificación consultada (registro del colegio profesional, resolución de la autoridad). OBLIGATORIA cuando la decisión es VERIFIED: habilitar a un profesional sin declarar contra qué se comprobó su matrícula no deja rastro auditable. Para REJECTED es opcional, porque se puede rechazar por defectos de forma del propio documento sin consultar a nadie. | `src/modules/profiles/dto/verify-credential.dto.ts:34` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/verify-credential.dto.ts:43` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado de la credencial | `src/modules/profiles/dto/verify-credential.dto.ts:52` |
| `verifiedAt` | `string` | No | formato date-time | — | Valor de verified at mantenido por la instancia. | `src/modules/profiles/dto/verify-credential.dto.ts:58` |
| `practitionerVerified` | `boolean` | Sí | — | — | true si al verificar quedó habilitado todo el perfil profesional | `src/modules/profiles/dto/verify-credential.dto.ts:67` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts:82` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /profiles/patients

- **Origen:** CONTRATO
- **Nombre:** UC-05-13: listado paginado de pacientes
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.searchPatients` — `src/modules/profiles/controllers/profiles-patients.controller.ts:216`

### Qué es y para qué sirve (negocio)

UC-05-13: listado paginado de pacientes. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients` la atiende `ProfilesPatientsController.searchPatients` (src/modules/profiles/controllers/profiles-patients.controller.ts:216). Exige sesión con alguno de los roles SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER. Delega en `ProfilesPatientsService.searchPatients`. Lee common.identifiers, profiles.patient_profiles, profiles.persons, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN, SUPERADMIN, CLINICIAN, PRACTITIONER | `src/modules/profiles/controllers/profiles-patients.controller.ts:216` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.identifiers` | LEE | LEE | POR_SQL | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PatientProfilesRepository.searchPage | `src/modules/profiles/repositories/patient-profiles.repository.ts:166` |
| `profiles.patient_profiles` | LEE | LEE | POR_SQL | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PatientProfilesRepository.searchPage | `src/modules/profiles/repositories/patient-profiles.repository.ts:190` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → PersonsRepository.findByIds | `src/modules/profiles/repositories/persons.repository.ts:109` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPatientsController.searchPatients → ProfilesPatientsService.searchPatients → AdministrativeAreaCatalogService.assertIsAdministrativeArea → AdministrativeAreaCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `q` | query | No | `string` | Texto a buscar en el código de paciente o el nombre |
| `cursor` | query | No | `string` | Cursor opaco devuelto por la página anterior |
| `limit` | query | No | `number` | Tope de resultados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<SearchPatientsResponseDto>` · DTO `SearchPatientsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PatientListItemDto>` | Sí | — | — | Valor de items mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:120` |
| `items[].profileId` | `string` | Sí | formato uuid | — | Identificador asociado a profile. | `src/modules/profiles/dto/read-patients.dto.ts:19` |
| `items[].personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/dto/read-patients.dto.ts:25` |
| `items[].patientCode` | `string` | Sí | — | — | Código único de paciente | `src/modules/profiles/dto/read-patients.dto.ts:31` |
| `items[].displayName` | `string` | No | — | — | Nombre visible de la persona | `src/modules/profiles/dto/read-patients.dto.ts:37` |
| `items[].birthDate` | `string` | No | formato date | — | Valor de birth date mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:43` |
| `items[].personStatusConceptId` | `string` | No | formato uuid | — | Concept id del estado de la persona | `src/modules/profiles/dto/read-patients.dto.ts:52` |
| `items[].deceased` | `boolean` | Sí | — | — | Si la persona está registrada como fallecida. Es un booleano derivado y no un concepto: una lista de pacientes tiene que poder marcarlo sin resolver terminología | `src/modules/profiles/dto/read-patients.dto.ts:61` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/profiles/dto/read-patients.dto.ts:126` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/profiles/dto/read-patients.dto.ts:132` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco para la página siguiente; `null` cuando no hay más | `src/modules/profiles/dto/read-patients.dto.ts:142` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Buscá por nombre, código o documento: no se puede listar el padrón completo de pacientes; PreconditionFailedException: El catálogo de departamentos no está disponible; PreconditionFailedException: El departamento no pertenece al catálogo de departamentos de Bolivia |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:96` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /profiles/patients

- **Origen:** CONTRATO
- **Nombre:** Alta de persona y perfil de paciente
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.registerPatient` — `src/modules/profiles/controllers/profiles-patients.controller.ts:299`

### Qué es y para qué sirve (negocio)

Alta de persona y perfil de paciente. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients` la atiende `ProfilesPatientsController.registerPatient` (src/modules/profiles/controllers/profiles-patients.controller.ts:299). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePatientDto` (6 campos, 1 obligatorio). Delega en `ProfilesPatientsService.registerPatient`. Crea filas en profiles.patient_profiles, profiles.person_profiles, profiles.persons. Lee profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:299` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PatientProfilesRepository.create | `src/modules/profiles/repositories/patient-profiles.repository.ts:220` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PatientProfilesRepository.findByPatientCode | `src/modules/profiles/repositories/patient-profiles.repository.ts:209` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PersonProfilesRepository.create | `src/modules/profiles/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.registerPatient → ProfilesPatientsService.registerPatient → PersonsRepository.create | `src/modules/profiles/repositories/persons.repository.ts:115` |

### Cuerpo — DTO `CreatePatientDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de paciente (patient_code, UK) | `src/modules/profiles/dto/create-patient.dto.ts:23` |
| `displayName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre visible de la persona | `src/modules/profiles/dto/create-patient.dto.ts:32` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de nacimiento (ISO 8601) | `src/modules/profiles/dto/create-patient.dto.ts:43` |
| `administrativeGenderConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de género administrativo | `src/modules/profiles/dto/create-patient.dto.ts:54` |
| `sexAtBirthConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de sexo al nacer | `src/modules/profiles/dto/create-patient.dto.ts:65` |
| `masterPatientIndexCode` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Código MPI maestro (UK) | `src/modules/profiles/dto/create-patient.dto.ts:77` |

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
| `profileId` | `string` | Sí | formato uuid | — | Identificador asociado a profile. | `src/modules/profiles/dto/create-patient.dto.ts:86` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/dto/create-patient.dto.ts:92` |
| `patientCode` | `string` | Sí | — | — | Valor de patient code mantenido por la instancia. | `src/modules/profiles/dto/create-patient.dto.ts:98` |
| `recordLinkageStatus` | `string` | Sí | formato uuid | — | Concept id del estado de vinculación | `src/modules/profiles/dto/create-patient.dto.ts:107` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/create-patient.dto.ts:113` |

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
| INTEGRACION | `test/integration/dental-procedures.int-spec.ts:37` |
| INTEGRACION | `test/integration/frontend-read-flows.int-spec.ts:53` |
| INTEGRACION | `test/integration/identity-verification-cycle.int-spec.ts:48` |
| INTEGRACION | `test/integration/lab-booking-relevamiento.int-spec.ts:55` |
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:44` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. GET /profiles/patients/{profileId}

- **Origen:** CONTRATO
- **Nombre:** UC-05-14: ficha de filiación de un paciente (F-01)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.getPatient` — `src/modules/profiles/controllers/profiles-patients.controller.ts:287`

### Qué es y para qué sirve (negocio)

UC-05-14: ficha de filiación de un paciente (F-01). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/{profileId}` la atiende `ProfilesPatientsController.getPatient` (src/modules/profiles/controllers/profiles-patients.controller.ts:287). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ProfilesPatientsService.getPatientById`. Lee profiles.patient_profiles, profiles.persons, profiles.related_persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:287` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-patients.controller.ts:287` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.getPatient → ProfilesPatientsService.getPatientById → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getPatient → ProfilesPatientsService.getPatientById → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.related_persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getPatient → ProfilesPatientsService.getPatientById → RelatedPersonsRepository.findActiveByPatient | `src/modules/profiles/repositories/related-persons.repository.ts:91` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientDetailResponseDto>` · DTO `PatientDetailResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | Identificador asociado a profile. | `src/modules/profiles/dto/read-patients.dto.ts:193` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/dto/read-patients.dto.ts:199` |
| `patientCode` | `string` | Sí | — | — | Valor de patient code mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:205` |
| `masterPatientIndexCode` | `string` | No | — | — | Valor de master patient index code mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:211` |
| `displayName` | `string` | No | — | — | Valor de display name mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:217` |
| `birthDate` | `string` | No | formato date | — | Valor de birth date mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:223` |
| `administrativeGenderConceptId` | `string` | No | formato uuid | — | Identificador asociado a administrative gender concept. | `src/modules/profiles/dto/read-patients.dto.ts:229` |
| `sexAtBirthConceptId` | `string` | No | formato uuid | — | Identificador asociado a sex at birth concept. | `src/modules/profiles/dto/read-patients.dto.ts:235` |
| `genderIdentityConceptId` | `string` | No | formato uuid | — | Identificador asociado a gender identity concept. | `src/modules/profiles/dto/read-patients.dto.ts:241` |
| `nationalityConceptId` | `string` | No | formato uuid | — | Identificador asociado a nationality concept. | `src/modules/profiles/dto/read-patients.dto.ts:247` |
| `preferredLanguageConceptId` | `string` | No | formato uuid | — | Identificador asociado a preferred language concept. | `src/modules/profiles/dto/read-patients.dto.ts:253` |
| `personStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a person status concept. | `src/modules/profiles/dto/read-patients.dto.ts:259` |
| `vitalStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a vital status concept. | `src/modules/profiles/dto/read-patients.dto.ts:265` |
| `deceasedAt` | `string` | No | formato date-time | — | Valor de deceased at mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:271` |
| `aboGroupConceptId` | `string` | No | formato uuid | — | Identificador asociado a abo group concept. | `src/modules/profiles/dto/read-patients.dto.ts:277` |
| `rhFactorConceptId` | `string` | No | formato uuid | — | Identificador asociado a rh factor concept. | `src/modules/profiles/dto/read-patients.dto.ts:283` |
| `insuranceStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a insurance status concept. | `src/modules/profiles/dto/read-patients.dto.ts:289` |
| `clinicalLanguageConceptId` | `string` | No | formato uuid | — | Identificador asociado a clinical language concept. | `src/modules/profiles/dto/read-patients.dto.ts:295` |
| `recordLinkageStatusConceptId` | `string` | No | formato uuid | — | Identificador asociado a record linkage status concept. | `src/modules/profiles/dto/read-patients.dto.ts:301` |
| `relatedPersons` | `array<RelatedPersonItemDto>` | Sí | — | — | Contactos y representantes registrados (UC-05-10) | `src/modules/profiles/dto/read-patients.dto.ts:310` |
| `relatedPersons[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:151` |
| `relatedPersons[].displayName` | `string` | No | — | — | Valor de display name mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:157` |
| `relatedPersons[].relationshipConceptId` | `string` | No | formato uuid | — | Identificador asociado a relationship concept. | `src/modules/profiles/dto/read-patients.dto.ts:163` |
| `relatedPersons[].isEmergencyContact` | `boolean` | Sí | — | — | Valor de is emergency contact mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:169` |
| `relatedPersons[].isLegalGuardian` | `boolean` | Sí | — | — | Valor de is legal guardian mantenido por la instancia. | `src/modules/profiles/dto/read-patients.dto.ts:175` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/read-patients.dto.ts:316` |
| `updatedAt` | `string` | Sí | formato date-time | — | Fecha y hora de la última actualización. | `src/modules/profiles/dto/read-patients.dto.ts:322` |

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

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /profiles/patients/{profileId}/identity-links

- **Origen:** CONTRATO
- **Nombre:** Vincular identidad externa de paciente (MPI)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.addIdentityLink` — `src/modules/profiles/controllers/profiles-patients.controller.ts:324`

### Qué es y para qué sirve (negocio)

Vincular identidad externa de paciente (MPI). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/{profileId}/identity-links` la atiende `ProfilesPatientsController.addIdentityLink` (src/modules/profiles/controllers/profiles-patients.controller.ts:324). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `AddIdentityLinkDto` (6 campos, 3 obligatorios). Delega en `ProfilesPatientsService.addIdentityLink`. Crea filas en profiles.patient_identity_links. Actualiza profiles.patient_identity_links, profiles.patient_profiles. Lee profiles.patient_identity_links, profiles.patient_profiles.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:324` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-patients.controller.ts:324` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_identity_links` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink | `src/modules/profiles/services/profiles-patients.service.ts:1430` |
| `profiles.patient_identity_links` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink → PatientIdentityLinksRepository.create | `src/modules/profiles/repositories/patient-identity-links.repository.ts:78` |
| `profiles.patient_identity_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink → PatientIdentityLinksRepository.findBySource | `src/modules/profiles/repositories/patient-identity-links.repository.ts:60` |
| `profiles.patient_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink | `src/modules/profiles/services/profiles-patients.service.ts:1455` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.addIdentityLink → ProfilesPatientsService.addIdentityLink → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddIdentityLinkDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `sourceTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant origen de la identidad externa | `src/modules/profiles/dto/add-identity-link.dto.ts:24` |
| `sourcePatientIdentifier` | `string` | Sí | longitud mínima 1; longitud máxima 200 | `@IsString()` `@MinLength(1)` `@MaxLength(200)` | Identificador del paciente en el sistema origen | `src/modules/profiles/dto/add-identity-link.dto.ts:36` |
| `sourceSystemUri` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | URI del sistema origen | `src/modules/profiles/dto/add-identity-link.dto.ts:45` |
| `linkTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de vínculo | `src/modules/profiles/dto/add-identity-link.dto.ts:56` |
| `confidenceScore` | `number` | Sí | mínimo 0; máximo 1 | `@IsNumber()` `@Min(0)` `@Max(1)` | Puntuación de confianza [0..1] | `src/modules/profiles/dto/add-identity-link.dto.ts:69` |
| `verified` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca el vínculo como verificado | `src/modules/profiles/dto/add-identity-link.dto.ts:77` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/add-identity-link.dto.ts:86` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/dto/add-identity-link.dto.ts:92` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/profiles/dto/add-identity-link.dto.ts:101` |
| `created` | `boolean` | Sí | — | — | true si el registro se creó, false si se actualizó (upsert) | `src/modules/profiles/dto/add-identity-link.dto.ts:109` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:67` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /profiles/patients/{profileId}/portal-proxies

- **Origen:** CONTRATO
- **Nombre:** Otorgar proxy de portal a un representante
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.grantPortalProxy` — `src/modules/profiles/controllers/profiles-patients.controller.ts:376`

### Qué es y para qué sirve (negocio)

Otorgar proxy de portal a un representante. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/{profileId}/portal-proxies` la atiende `ProfilesPatientsController.grantPortalProxy` (src/modules/profiles/controllers/profiles-patients.controller.ts:376). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `GrantPortalProxyDto` (6 campos, 3 obligatorios). Delega en `ProfilesPatientsService.grantPortalProxy`. Crea filas en profiles.patient_portal_proxies. Actualiza profiles.patient_portal_proxies. Lee profiles.patient_profiles, profiles.related_persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:376` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-patients.controller.ts:376` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → PatientPortalProxiesRepository.revokeActiveForProxyUser | `src/modules/profiles/repositories/patient-portal-proxies.repository.ts:82` |
| `profiles.patient_portal_proxies` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → PatientPortalProxiesRepository.create | `src/modules/profiles/repositories/patient-portal-proxies.repository.ts:58` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.related_persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.grantPortalProxy → ProfilesPatientsService.grantPortalProxy → RelatedPersonsRepository.findById | `src/modules/profiles/repositories/related-persons.repository.ts:50` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `GrantPortalProxyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `proxyUserId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario representante al que se delega el acceso | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:14` |
| `relatedPersonId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona relacionada que respalda el proxy (UC-05-10) | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:25` |
| `scopeValueSetId` | `string` | Sí | formato uuid | `@IsUUID()` | Value set que gobierna el alcance delegado | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:35` |
| `legalBasisRecordId` | `string` | Sí | formato uuid | `@IsUUID()` | Registro de base legal que respalda el acceso | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:45` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date-time) | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:56` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date-time) | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:67` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:76` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:82` |
| `proxyUserId` | `string` | Sí | formato uuid | — | Identificador asociado a proxy user. | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:88` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del proxy | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:97` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/grant-portal-proxy.dto.ts:103` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:110` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /profiles/patients/{profileId}/related-persons

- **Origen:** CONTRATO
- **Nombre:** Registrar persona relacionada / contacto de emergencia
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.addRelatedPerson` — `src/modules/profiles/controllers/profiles-patients.controller.ts:362`

### Qué es y para qué sirve (negocio)

Registrar persona relacionada / contacto de emergencia. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/{profileId}/related-persons` la atiende `ProfilesPatientsController.addRelatedPerson` (src/modules/profiles/controllers/profiles-patients.controller.ts:362). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AddRelatedPersonDto` (6 campos, 0 obligatorios). Delega en `ProfilesPatientsService.addRelatedPerson`. Crea filas en profiles.persons, profiles.related_persons. Lee profiles.patient_profiles, profiles.person_account_links, profiles.persons, profiles.related_persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-patients.controller.ts:362` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-patients.controller.ts:362` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → ProfileOwnershipService.assertOwnsPatientProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → PersonsRepository.create | `src/modules/profiles/repositories/persons.repository.ts:115` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.related_persons` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → RelatedPersonsRepository.create | `src/modules/profiles/repositories/related-persons.repository.ts:61` |
| `profiles.related_persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.addRelatedPerson → ProfilesPatientsService.addRelatedPerson → RelatedPersonsRepository.findActiveGuardian | `src/modules/profiles/repositories/related-persons.repository.ts:103` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddRelatedPersonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona relacionada existente; si se omite se crea una nueva | `src/modules/profiles/dto/add-related-person.dto.ts:22` |
| `displayName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre visible (si se crea la persona relacionada) | `src/modules/profiles/dto/add-related-person.dto.ts:33` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de nacimiento (ISO date) | `src/modules/profiles/dto/add-related-person.dto.ts:44` |
| `relationshipConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del parentesco/relación | `src/modules/profiles/dto/add-related-person.dto.ts:55` |
| `isEmergencyContact` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Es contacto de emergencia | `src/modules/profiles/dto/add-related-person.dto.ts:66` |
| `isLegalGuardian` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Es tutor legal (único activo por paciente) | `src/modules/profiles/dto/add-related-person.dto.ts:77` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/add-related-person.dto.ts:86` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/dto/add-related-person.dto.ts:92` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/dto/add-related-person.dto.ts:98` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado | `src/modules/profiles/dto/add-related-person.dto.ts:104` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/add-related-person.dto.ts:110` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:95` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. GET /profiles/patients/me

- **Origen:** CONTRATO
- **Nombre:** Consultar los propios datos de filiación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.getOwnProfile` — `src/modules/profiles/controllers/profiles-patients.controller.ts:102`

### Qué es y para qué sirve (negocio)

Consultar los propios datos de filiación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/me` la atiende `ProfilesPatientsController.getOwnProfile` (src/modules/profiles/controllers/profiles-patients.controller.ts:102). Exige sesión; el controlador no declara roles. Delega en `ProfilesPatientsService.getOwnProfile`. Lee common.addresses, common.contact_points, common.identifiers, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, profiles.patient_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-patients.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ContactPointsRepository.findVigenteByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:98` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerIdentificadores | `src/modules/profiles/services/profiles-patients.service.ts:807` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.getOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerTutores | `src/modules/profiles/services/profiles-patients.service.ts:888` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OwnPatientProfileResponseDto>` · DTO `OwnPatientProfileResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:425` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:431` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/dto/read-patients.dto.ts:437` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/dto/read-patients.dto.ts:443` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/dto/read-patients.dto.ts:449` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/dto/read-patients.dto.ts:455` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/dto/read-patients.dto.ts:464` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/dto/read-patients.dto.ts:475` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/dto/read-patients.dto.ts:485` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/dto/read-patients.dto.ts:500` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/dto/read-patients.dto.ts:510` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/dto/read-patients.dto.ts:518` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/dto/read-patients.dto.ts:528` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/dto/read-patients.dto.ts:537` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/dto/read-patients.dto.ts:546` |

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
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:70` |
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:132` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. PATCH /profiles/patients/me

- **Origen:** CONTRATO
- **Nombre:** Editar los propios datos de filiación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.updateOwnProfile` — `src/modules/profiles/controllers/profiles-patients.controller.ts:127`

### Qué es y para qué sirve (negocio)

Editar los propios datos de filiación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/patients/me` la atiende `ProfilesPatientsController.updateOwnProfile` (src/modules/profiles/controllers/profiles-patients.controller.ts:127). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnPatientProfileDto` (10 campos, 0 obligatorios). Delega en `ProfilesPatientsService.updateOwnProfile`. Crea filas en common.addresses, common.contact_points, common.identifiers. Actualiza common.addresses, common.contact_points, profiles.persons. Lee common.addresses, common.contact_points, common.identifiers, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, profiles.patient_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-patients.controller.ts:127` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarDomicilio → AddressesRepository.closeVigente | `src/modules/common/repositories/addresses.repository.ts:112` |
| `common.addresses` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarTextoDeDireccion → AddressesRepository.create | `src/modules/common/repositories/addresses.repository.ts:118` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarDomicilio → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarTelefono → ContactPointsRepository.closeVigente | `src/modules/common/repositories/contact-points.repository.ts:129` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarTelefono → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarTelefono → ContactPointsRepository.findVigenteByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:98` |
| `common.identifiers` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarNit → IdentifiersRepository.create | `src/modules/common/repositories/identifiers.repository.ts:90` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.reemplazarNit | `src/modules/profiles/services/profiles-patients.service.ts:1083` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.recomponerDisplayName | `src/modules/profiles/services/profiles-patients.service.ts:972` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.updateOwnProfile → ProfilesPatientsService.updateOwnProfile → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerTutores | `src/modules/profiles/services/profiles-patients.service.ts:888` |

### Cuerpo — DTO `UpdateOwnPatientProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:69` |
| `middleName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:81` |
| `lastName` | `string` | No | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:94` |
| `motherLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(PERSON_NAME_PART_MAX_LENGTH)` | — | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:106` |
| `birthDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:114` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | `@IsOptional()` `@IsIn(BIRTH_SEX_CODES)` | Sexo asignado al nacer | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:127` |
| `occupationConceptId` | `string` | No | formato uuid | `@ValidateIf( (dto: UpdateOwnPatientProfileDto) => dto.occupationConceptId !== '', )` `@IsOptional()` `@IsUUID()` | Ocupación del catálogo (VS_BO_OCCUPATION). Cadena vacía para borrarla. Si viene, el texto libre se descarta. | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:160` |
| `occupationFreeText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(OCCUPATION_FREE_TEXT_MAX_LENGTH)` | Ocupación en texto libre, para cuando no está en el catálogo. Cadena vacía para borrarla. | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:177` |
| `phone` | `string` | No | longitud máxima 40; patrón runtime PHONE_PATTERN | `@ValidateIf((dto: UpdateOwnPatientProfileDto) => dto.phone !== '')` `@IsOptional()` `@IsString()` `@MaxLength(PHONE_MAX_LENGTH)` `@Matches(PHONE_PATTERN, { message: PHONE_PATTERN_MESSAGE })` | Teléfono de contacto en formato E.164 o nacional: dígitos, espacios, paréntesis, + y guion, mínimo 6 caracteres. Cadena vacía para quedarse sin teléfono. | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:202` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Municipio de residencia (catálogo VS_BO_MUNICIPALITY) | `src/modules/profiles/dto/update-own-patient-profile.dto.ts:217` |

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
  "birthDate": "2026-07-31",
  "sexAtBirth": "MALE",
  "occupationConceptId": "00000000-0000-4000-8000-000000000001",
  "occupationFreeText": "valor-ejemplo",
  "phone": "+59170000000",
  "residenceMunicipalityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<OwnPatientProfileResponseDto>` · DTO `OwnPatientProfileResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:425` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:431` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/dto/read-patients.dto.ts:437` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/dto/read-patients.dto.ts:443` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/dto/read-patients.dto.ts:449` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/dto/read-patients.dto.ts:455` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/dto/read-patients.dto.ts:464` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/dto/read-patients.dto.ts:475` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/dto/read-patients.dto.ts:485` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/dto/read-patients.dto.ts:500` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/dto/read-patients.dto.ts:510` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/dto/read-patients.dto.ts:518` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/dto/read-patients.dto.ts:528` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/dto/read-patients.dto.ts:537` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/dto/read-patients.dto.ts:546` |

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
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:103` |
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:143` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. DELETE /profiles/patients/me/photo

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Quitar la foto de perfil propia. Quita la referencia; el archivo no se toca. Idempotente.
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.removeOwnPhoto` — `src/modules/profiles/controllers/profiles-patients.controller.ts:171`

### Qué es y para qué sirve (negocio)

Quitar la foto de perfil propia. Quita la referencia; el archivo no se toca. Idempotente. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/patients/me/photo` la atiende `ProfilesPatientsController.removeOwnPhoto` (src/modules/profiles/controllers/profiles-patients.controller.ts:171). Exige sesión; el controlador no declara roles. Delega en `ProfilesPatientsService.removeOwnPhoto`. Lee common.addresses, common.contact_points, common.identifiers, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products, insurance.patient_coverages, profiles.patient_profiles y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-patients.controller.ts:171` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ContactPointsRepository.findVigenteByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:98` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerIdentificadores | `src/modules/profiles/services/profiles-patients.service.ts:807` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.removeOwnPhoto → ProfilesPatientsService.removeOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerTutores | `src/modules/profiles/services/profiles-patients.service.ts:888` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OwnPatientProfileResponseDto>` · DTO `OwnPatientProfileResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:425` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:431` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/dto/read-patients.dto.ts:437` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/dto/read-patients.dto.ts:443` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/dto/read-patients.dto.ts:449` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/dto/read-patients.dto.ts:455` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/dto/read-patients.dto.ts:464` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/dto/read-patients.dto.ts:475` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/dto/read-patients.dto.ts:485` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/dto/read-patients.dto.ts:500` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/dto/read-patients.dto.ts:510` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/dto/read-patients.dto.ts:518` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/dto/read-patients.dto.ts:528` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/dto/read-patients.dto.ts:537` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/dto/read-patients.dto.ts:546` |

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
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:367` |
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:166` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. PUT /profiles/patients/me/photo

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Fijar la foto de perfil propia. Sin `@Roles` por lo mismo que el resto de `patients/me/*`: el sujeto lo resuelve el servidor desde la sesión y no hay parámetro que apunte a otro. `PUT` porque el resultado no depende de cuántas veces se pida: la persona queda con esa foto.
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.setOwnPhoto` — `src/modules/profiles/controllers/profiles-patients.controller.ts:154`

### Qué es y para qué sirve (negocio)

Fijar la foto de perfil propia. Sin `@Roles` por lo mismo que el resto de `patients/me/*`: el sujeto lo resuelve el servidor desde la sesión y no hay parámetro que apunte a otro. `PUT` porque el resultado no depende de cuántas veces se pida: la persona queda con esa foto. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /profiles/patients/me/photo` la atiende `ProfilesPatientsController.setOwnPhoto` (src/modules/profiles/controllers/profiles-patients.controller.ts:154). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SetOwnPatientPhotoDto` (1 campo, 1 obligatorio). Delega en `ProfilesPatientsService.setOwnPhoto`. Lee common.addresses, common.contact_points, common.file_versions, common.files, common.identifiers, insurance.insurance_carriers, insurance.insurance_plans, insurance.insurance_products y 5 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-patients.controller.ts:154` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ContactPointsRepository.findVigenteByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:98` |
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → AttachableFileService.assertUsableBy → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerIdentificadores | `src/modules/profiles/services/profiles-patients.service.ts:807` |
| `insurance.insurance_carriers` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_plans` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.insurance_products` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `insurance.patient_coverages` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerCoberturas | `src/modules/profiles/services/profiles-patients.service.ts:850` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.related_persons` | LEE | LEE | POR_SQL | ProfilesPatientsController.setOwnPhoto → ProfilesPatientsService.setOwnPhoto → ProfilesPatientsService.getOwnProfile → ProfilesPatientsService.leerTutores | `src/modules/profiles/services/profiles-patients.service.ts:888` |

### Cuerpo — DTO `SetOwnPatientPhotoDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Identificador del archivo ya subido que será la foto | `src/modules/profiles/dto/set-own-patient-photo.dto.ts:20` |

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
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:425` |
| `patientProfileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-patients.dto.ts:431` |
| `name` | `string` | No | — | — | Nombre de pila | `src/modules/profiles/dto/read-patients.dto.ts:437` |
| `middleName` | `string` | No | — | — | Segundo nombre | `src/modules/profiles/dto/read-patients.dto.ts:443` |
| `lastName` | `string` | No | — | — | Apellido paterno | `src/modules/profiles/dto/read-patients.dto.ts:449` |
| `motherLastName` | `string` | No | — | — | Apellido materno | `src/modules/profiles/dto/read-patients.dto.ts:455` |
| `displayName` | `string` | No | — | — | Nombre compuesto por el servidor a partir de las partes. No se edita directamente. | `src/modules/profiles/dto/read-patients.dto.ts:464` |
| `birthDate` | `string` | No | formato date | — | Fecha sin hora: serializarla como instante la desplazaría un día | `src/modules/profiles/dto/read-patients.dto.ts:475` |
| `sexAtBirth` | `string` | No | valores: MALE, FEMALE, INTERSEX, UNKNOWN | — | Sexo asignado al nacer. Se devuelve el código y no el concept id: es el mismo valor que acepta el alta, y así el formulario no tiene que resolver terminología. | `src/modules/profiles/dto/read-patients.dto.ts:485` |
| `occupationConceptId` | `string` | No | formato uuid | — | Ocupación elegida del catálogo (VS_BO_OCCUPATION) | `src/modules/profiles/dto/read-patients.dto.ts:500` |
| `occupationFreeText` | `string` | No | — | — | Ocupación declarada en texto libre | `src/modules/profiles/dto/read-patients.dto.ts:510` |
| `phone` | `string` | No | — | — | Teléfono de contacto vigente (`common.contact_points`) | `src/modules/profiles/dto/read-patients.dto.ts:518` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio del domicilio vigente (catálogo VS_BO_MUNICIPALITY). El departamento lo deriva el servidor. | `src/modules/profiles/dto/read-patients.dto.ts:528` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el perfil llega sin `patientCode`. | `src/modules/profiles/dto/read-patients.dto.ts:537` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/dto/read-patients.dto.ts:546` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paciente no encontrado; ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/patient-own-profile.int-spec.ts:354` |
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:156` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. GET /profiles/patients/me/summary

- **Origen:** CONTRATO
- **Nombre:** Consultar el resumen propio
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.getOwnSummary` — `src/modules/profiles/controllers/profiles-patients.controller.ts:80`

### Qué es y para qué sirve (negocio)

Consultar el resumen propio. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/me/summary` la atiende `ProfilesPatientsController.getOwnSummary` (src/modules/profiles/controllers/profiles-patients.controller.ts:80). Exige sesión; el controlador no declara roles. Delega en `ProfilesPatientsService.getOwnSummary`. Lee profiles.patient_profiles, profiles.person_account_links, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-patients.controller.ts:80` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnSummary → ProfilesPatientsService.getOwnSummary → ProfilesPatientsService.resolveOwnPatient → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnSummary → ProfilesPatientsService.getOwnSummary → ProfilesPatientsService.resolveOwnPatient → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.getOwnSummary → ProfilesPatientsService.getOwnSummary → ProfilesPatientsService.resolveOwnPatient → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PatientSummaryResponseDto>` · DTO `PatientSummaryResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/dto/create-patient.dto.ts:131` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/profiles/dto/create-patient.dto.ts:137` |
| `identityVerified` | `boolean` | Sí | — | — | Si el titular tiene una aserción de identidad vigente. Con `false` el resumen llega sin `patientCode`. | `src/modules/profiles/dto/create-patient.dto.ts:146` |
| `patientCode` | `string` | No | — | — | Código de paciente. Sólo con identidad verificada: ausente mientras `identityVerified` sea `false`. | `src/modules/profiles/dto/create-patient.dto.ts:155` |
| `displayName` | `string` | No | — | — | Valor de display name mantenido por la instancia. | `src/modules/profiles/dto/create-patient.dto.ts:161` |
| `birthDate` | `string` | No | formato date-time | — | Valor de birth date mantenido por la instancia. | `src/modules/profiles/dto/create-patient.dto.ts:167` |
| `personStatus` | `string` | Sí | formato uuid | — | Identificador asociado a person status concept. | `src/modules/profiles/dto/create-patient.dto.ts:173` |

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
| INTEGRACION | `test/integration/identity-verification-self-service.int-spec.ts:74` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /profiles/patients/merge

- **Origen:** CONTRATO
- **Nombre:** Fusionar pacientes duplicados
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.mergePatients` — `src/modules/profiles/controllers/profiles-patients.controller.ts:337`

### Qué es y para qué sirve (negocio)

Fusionar pacientes duplicados. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/merge` la atiende `ProfilesPatientsController.mergePatients` (src/modules/profiles/controllers/profiles-patients.controller.ts:337). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `MergePatientsDto` (3 campos, 2 obligatorios). Delega en `ProfilesPatientsService.mergePatients`. Crea filas en profiles.patient_merge_events. Actualiza profiles.patient_identity_links, profiles.patient_portal_proxies, profiles.patient_profiles, profiles.persons, profiles.related_persons. Lee profiles.patient_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:337` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_identity_links` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientIdentityLinksRepository.reassignPatientProfile | `src/modules/profiles/repositories/patient-identity-links.repository.ts:103` |
| `profiles.patient_merge_events` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientMergeEventsRepository.create | `src/modules/profiles/repositories/patient-merge-events.repository.ts:113` |
| `profiles.patient_portal_proxies` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientPortalProxiesRepository.reassignPatientProfile | `src/modules/profiles/repositories/patient-portal-proxies.repository.ts:109` |
| `profiles.patient_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients | `src/modules/profiles/services/profiles-patients.service.ts:1533` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients | `src/modules/profiles/services/profiles-patients.service.ts:1543` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.related_persons` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.mergePatients → ProfilesPatientsService.mergePatients → RelatedPersonsRepository.reassignPatientProfile | `src/modules/profiles/repositories/related-persons.repository.ts:117` |

### Cuerpo — DTO `MergePatientsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `survivingPatientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente que sobrevive | `src/modules/profiles/dto/merge-patients.dto.ts:52` |
| `mergedPatientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Perfil de paciente que se fusiona (perdedor) | `src/modules/profiles/dto/merge-patients.dto.ts:62` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la razón de fusión | `src/modules/profiles/dto/merge-patients.dto.ts:73` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/merge-patients.dto.ts:96` |
| `survivingPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a surviving patient profile. | `src/modules/profiles/dto/merge-patients.dto.ts:102` |
| `mergedPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a merged patient profile. | `src/modules/profiles/dto/merge-patients.dto.ts:108` |
| `decisionStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la decisión | `src/modules/profiles/dto/merge-patients.dto.ts:117` |
| `reversalOfEventId` | `string` | No | formato uuid | — | Evento original revertido (si aplica) | `src/modules/profiles/dto/merge-patients.dto.ts:126` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/profiles/dto/merge-patients.dto.ts:132` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:78` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. GET /profiles/patients/merge-events

- **Origen:** CONTRATO
- **Nombre:** Listar eventos de fusión de pacientes
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.listMergeEvents` — `src/modules/profiles/controllers/profiles-patients.controller.ts:268`

### Qué es y para qué sirve (negocio)

Listar eventos de fusión de pacientes. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/patients/merge-events` la atiende `ProfilesPatientsController.listMergeEvents` (src/modules/profiles/controllers/profiles-patients.controller.ts:268). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `ProfilesPatientsService.listMergeEvents`. Lee profiles.patient_merge_events.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:268` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_merge_events` | LEE | LEE | DIRECTA | ProfilesPatientsController.listMergeEvents → ProfilesPatientsService.listMergeEvents → PatientMergeEventsRepository.findEvents | `src/modules/profiles/repositories/patient-merge-events.repository.ts:99` |

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
| `items` | `array<MergeEventResponseDto>` | Sí | — | — | Eventos de esta página, del más reciente al más antiguo. | `src/modules/profiles/dto/merge-patients.dto.ts:141` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/merge-patients.dto.ts:96` |
| `items[].survivingPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a surviving patient profile. | `src/modules/profiles/dto/merge-patients.dto.ts:102` |
| `items[].mergedPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a merged patient profile. | `src/modules/profiles/dto/merge-patients.dto.ts:108` |
| `items[].decisionStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la decisión | `src/modules/profiles/dto/merge-patients.dto.ts:117` |
| `items[].reversalOfEventId` | `string` | No | formato uuid | — | Evento original revertido (si aplica) | `src/modules/profiles/dto/merge-patients.dto.ts:126` |
| `items[].recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/profiles/dto/merge-patients.dto.ts:132` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/profiles/dto/merge-patients.dto.ts:147` |
| `limit` | `number` | Sí | — | — | Tope aplicado. | `src/modules/profiles/dto/merge-patients.dto.ts:153` |

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

## 15. POST /profiles/patients/merge/{eventId}/reverse

- **Origen:** CONTRATO
- **Nombre:** Revertir una fusión de pacientes
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.reverseMerge` — `src/modules/profiles/controllers/profiles-patients.controller.ts:349`

### Qué es y para qué sirve (negocio)

Revertir una fusión de pacientes. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/patients/merge/{eventId}/reverse` la atiende `ProfilesPatientsController.reverseMerge` (src/modules/profiles/controllers/profiles-patients.controller.ts:349). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ReverseMergeDto` (1 campo, 0 obligatorios). Delega en `ProfilesPatientsService.reverseMerge`. Crea filas en profiles.patient_merge_events. Actualiza profiles.patient_profiles, profiles.persons. Lee profiles.patient_merge_events, profiles.patient_profiles, profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:349` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: eventId | `src/modules/profiles/controllers/profiles-patients.controller.ts:349` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_merge_events` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PatientMergeEventsRepository.create | `src/modules/profiles/repositories/patient-merge-events.repository.ts:113` |
| `profiles.patient_merge_events` | LEE | LEE | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PatientMergeEventsRepository.findById | `src/modules/profiles/repositories/patient-merge-events.repository.ts:56` |
| `profiles.patient_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge | `src/modules/profiles/services/profiles-patients.service.ts:1665` |
| `profiles.patient_profiles` | LEE | LEE | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PatientProfilesRepository.findById | `src/modules/profiles/repositories/patient-profiles.repository.ts:97` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge | `src/modules/profiles/services/profiles-patients.service.ts:1672` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.reverseMerge → ProfilesPatientsService.reverseMerge → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `eventId` | path | Sí | `string` | — |

### Cuerpo — DTO `ReverseMergeDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la razón de reversión | `src/modules/profiles/dto/merge-patients.dto.ts:87` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/merge-patients.dto.ts:96` |
| `survivingPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a surviving patient profile. | `src/modules/profiles/dto/merge-patients.dto.ts:102` |
| `mergedPatientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a merged patient profile. | `src/modules/profiles/dto/merge-patients.dto.ts:108` |
| `decisionStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la decisión | `src/modules/profiles/dto/merge-patients.dto.ts:117` |
| `reversalOfEventId` | `string` | No | formato uuid | — | Evento original revertido (si aplica) | `src/modules/profiles/dto/merge-patients.dto.ts:126` |
| `recordedAt` | `string` | Sí | formato date-time | — | Valor de recorded at mantenido por la instancia. | `src/modules/profiles/dto/merge-patients.dto.ts:132` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:84` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /profiles/persons/{personId}/account-links

- **Origen:** CONTRATO
- **Nombre:** Vincular cuenta de portal a una persona
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.linkAccount` — `src/modules/profiles/controllers/profiles-patients.controller.ts:311`

### Qué es y para qué sirve (negocio)

Vincular cuenta de portal a una persona. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/persons/{personId}/account-links` la atiende `ProfilesPatientsController.linkAccount` (src/modules/profiles/controllers/profiles-patients.controller.ts:311). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `LinkAccountDto` (2 campos, 1 obligatorio). Delega en `ProfilesPatientsService.linkAccount`. Crea filas en profiles.person_account_links. Actualiza profiles.person_account_links. Lee profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:311` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: personId | `src/modules/profiles/controllers/profiles-patients.controller.ts:311` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.person_account_links` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.linkAccount → ProfilesPatientsService.linkAccount → PersonAccountLinksRepository.supersedeActiveForUser | `src/modules/profiles/repositories/person-account-links.repository.ts:113` |
| `profiles.person_account_links` | ESCRIBE | CREA | DIRECTA | ProfilesPatientsController.linkAccount → ProfilesPatientsService.linkAccount → PersonAccountLinksRepository.create | `src/modules/profiles/repositories/person-account-links.repository.ts:50` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.linkAccount → ProfilesPatientsService.linkAccount → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `personId` | path | Sí | `string` | — |

### Cuerpo — DTO `LinkAccountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | Usuario IAM a vincular con la persona | `src/modules/profiles/dto/link-account.dto.ts:14` |
| `linkTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de vínculo (por defecto: self) | `src/modules/profiles/dto/link-account.dto.ts:25` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/link-account.dto.ts:34` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/dto/link-account.dto.ts:40` |
| `userId` | `string` | Sí | formato uuid | — | Identificador asociado a user. | `src/modules/profiles/dto/link-account.dto.ts:46` |
| `status` | `string` | Sí | formato uuid | — | Concept id del estado del vínculo | `src/modules/profiles/dto/link-account.dto.ts:55` |
| `validFrom` | `string` | Sí | formato date-time | — | Valor de valid from mantenido por la instancia. | `src/modules/profiles/dto/link-account.dto.ts:61` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:52` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 17. POST /profiles/persons/{personId}/decease

- **Origen:** CONTRATO
- **Nombre:** Registrar defunción y anonimización de una persona
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPatientsController.decease` — `src/modules/profiles/controllers/profiles-patients.controller.ts:389`

### Qué es y para qué sirve (negocio)

Registrar defunción y anonimización de una persona. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/persons/{personId}/decease` la atiende `ProfilesPatientsController.decease` (src/modules/profiles/controllers/profiles-patients.controller.ts:389). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `DeceasePersonDto` (2 campos, 0 obligatorios). Delega en `ProfilesPatientsService.decease`. Actualiza profiles.patient_portal_proxies, profiles.person_account_links, profiles.persons. Lee profiles.persons.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-patients.controller.ts:389` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: personId | `src/modules/profiles/controllers/profiles-patients.controller.ts:389` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.patient_portal_proxies` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.decease → ProfilesPatientsService.decease → PatientPortalProxiesRepository.revokeActiveForPatient | `src/modules/profiles/repositories/patient-portal-proxies.repository.ts:95` |
| `profiles.person_account_links` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPatientsController.decease → ProfilesPatientsService.decease → PersonAccountLinksRepository.revokeActiveForPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:130` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPatientsController.decease → ProfilesPatientsService.decease | `src/modules/profiles/services/profiles-patients.service.ts:1844` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPatientsController.decease → ProfilesPatientsService.decease → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `personId` | path | Sí | `string` | — |

### Cuerpo — DTO `DeceasePersonDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `deceasedAt` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Momento de defunción (ISO date-time) | `src/modules/profiles/dto/decease-person.dto.ts:15` |
| `anonymize` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Anonimiza la PII (borrado lógico del display_name) al registrar | `src/modules/profiles/dto/decease-person.dto.ts:27` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/decease-person.dto.ts:36` |
| `vitalStatus` | `string` | Sí | formato uuid | — | Concept id del estado vital | `src/modules/profiles/dto/decease-person.dto.ts:42` |
| `personStatus` | `string` | Sí | formato uuid | — | Concept id del estado de la persona | `src/modules/profiles/dto/decease-person.dto.ts:51` |
| `deceasedAt` | `string` | No | formato date-time | — | Valor de deceased at mantenido por la instancia. | `src/modules/profiles/dto/decease-person.dto.ts:57` |
| `revokedAccountLinks` | `number` | Sí | — | — | Nº de vínculos de cuenta revocados | `src/modules/profiles/dto/decease-person.dto.ts:63` |
| `revokedProxies` | `number` | Sí | — | — | Nº de proxies de portal revocados | `src/modules/profiles/dto/decease-person.dto.ts:69` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-patients.controller.spec.ts:120` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPatientsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 18. GET /profiles/practitioners

- **Origen:** CONTRATO
- **Nombre:** Listar profesionales para la guía, con sus especialidades
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.listPractitioners` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:138`

### Qué es y para qué sirve (negocio)

Listar profesionales para la guía, con sus especialidades. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners` la atiende `ProfilesPractitionersController.listPractitioners` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:138). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.listPractitioners`. Lee profiles.health_practitioner_profiles, profiles.persons, profiles.practitioner_specialties.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:138` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPractitioners → ProfilesPractitionersService.listPractitioners → HealthPractitionerProfilesRepository.listPage | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:111` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPractitioners → ProfilesPractitionersService.listPractitioners → PersonsRepository.findByIds | `src/modules/profiles/repositories/persons.repository.ts:109` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listPractitioners → ProfilesPractitionersService.listPractitioners → PractitionerSpecialtiesRepository.findProfileIdsBySpecialty | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:153` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `specialtyConceptId` | query | No | `string` | Filtra por especialidad vigente (concept id) |
| `cursor` | query | No | `string` | — |
| `limit` | query | No | `number` | Tope de resultados (por defecto 50) |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListPractitionersResponseDto>` · DTO `ListPractitionersResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<PractitionerListItemDto>` | Sí | — | — | Las filas de esta página. | `src/modules/profiles/dto/list-practitioners.dto.ts:96` |
| `items[].profileId` | `string` | Sí | formato uuid | — | Con este id se abre la ficha (`GET /profiles/practitioners/:id/summary`). | `src/modules/profiles/dto/list-practitioners.dto.ts:37` |
| `items[].practitionerCode` | `string` | Sí | — | — | Código único del profesional | `src/modules/profiles/dto/list-practitioners.dto.ts:43` |
| `items[].displayName` | `string` | No | — | — | Nombre visible de la persona | `src/modules/profiles/dto/list-practitioners.dto.ts:49` |
| `items[].professionalTitle` | `string` | No | — | — | Título profesional declarado. | `src/modules/profiles/dto/list-practitioners.dto.ts:55` |
| `items[].photoFileId` | `string` | No | formato uuid | — | Archivo de la foto | `src/modules/profiles/dto/list-practitioners.dto.ts:61` |
| `items[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | Estado de verificación de la matrícula. | `src/modules/profiles/dto/list-practitioners.dto.ts:67` |
| `items[].acceptsNewPatients` | `boolean` | Sí | — | — | Si declara tomar pacientes nuevos. | `src/modules/profiles/dto/list-practitioners.dto.ts:73` |
| `items[].telehealthAvailable` | `boolean` | Sí | — | — | Si atiende por telemedicina. | `src/modules/profiles/dto/list-practitioners.dto.ts:79` |
| `items[].specialties` | `array<PractitionerListSpecialtyDto>` | Sí | — | — | Sus especialidades, la principal primero. | `src/modules/profiles/dto/list-practitioners.dto.ts:85` |
| `items[].specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | Concept id de la especialidad | `src/modules/profiles/dto/list-practitioners.dto.ts:14` |
| `items[].specialties[].isPrimary` | `boolean` | Sí | — | — | Si es la especialidad con la que se presenta. | `src/modules/profiles/dto/list-practitioners.dto.ts:20` |
| `count` | `number` | Sí | — | — | Cantidad devuelta en esta página | `src/modules/profiles/dto/list-practitioners.dto.ts:102` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/profiles/dto/list-practitioners.dto.ts:108` |
| `nextCursor` | `string` | No | admite null | — | Cursor opaco de la página siguiente; null si no hay más | `src/modules/profiles/dto/list-practitioners.dto.ts:118` |

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

## 19. POST /profiles/practitioners

- **Origen:** CONTRATO
- **Nombre:** Alta de profesional de salud (workforce generalista)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.onboardPractitioner` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:263`

### Qué es y para qué sirve (negocio)

Alta de profesional de salud (workforce generalista). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners` la atiende `ProfilesPractitionersController.onboardPractitioner` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:263). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreatePractitionerDto` (17 campos, 3 obligatorios). Delega en `ProfilesPractitionersService.onboardPractitioner`. Crea filas en profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_profiles, profiles.persons, profiles.practitioner_languages, profiles.practitioner_specialties, profiles.professional_credentials. Lee profiles.health_practitioner_profiles, profiles.persons, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:263` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → HealthPractitionerProfilesRepository.create | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:128` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → HealthPractitionerProfilesRepository.findByCode | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:72` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:92` |
| `profiles.person_profiles` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PersonProfilesRepository.create | `src/modules/profiles/repositories/person-profiles.repository.ts:57` |
| `profiles.persons` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PersonsRepository.create | `src/modules/profiles/repositories/persons.repository.ts:115` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.practitioner_languages` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → PractitionerLanguagesRepository.create | `src/modules/profiles/repositories/practitioner-languages.repository.ts:62` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → PractitionerSpecialtiesRepository.create | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:60` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfessionalCredentialsRepository.create | `src/modules/profiles/repositories/professional-credentials.repository.ts:98` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.onboardPractitioner → ProfilesPractitionersService.onboardPractitioner → ProfilesPractitionersService.declareSpecialties → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Cuerpo — DTO `CreatePractitionerDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerCode` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Código único de profesional (practitioner_code, UK) | `src/modules/profiles/dto/create-practitioner.dto.ts:30` |
| `personId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona existente a reutilizar; si se omite se crea una nueva | `src/modules/profiles/dto/create-practitioner.dto.ts:42` |
| `displayName` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Nombre visible (si se crea la persona) | `src/modules/profiles/dto/create-practitioner.dto.ts:53` |
| `practitionerCategoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de categoría profesional | `src/modules/profiles/dto/create-practitioner.dto.ts:64` |
| `professionalTitle` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Título profesional | `src/modules/profiles/dto/create-practitioner.dto.ts:73` |
| `specialtyConceptIds` | `array<string>` | No | formato uuid; máximo 3 elemento(s) | `@IsOptional()` `@IsArray()` `@ArrayMaxSize(3)` `@IsUUID(undefined, { each: true })` | Especialidades del catálogo VS_MEDICAL_SPECIALTY. La primera es la principal. | `src/modules/profiles/dto/create-practitioner.dto.ts:99` |
| `professionalBio` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Biografía profesional en prosa | `src/modules/profiles/dto/create-practitioner.dto.ts:115` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si acepta pacientes nuevos | `src/modules/profiles/dto/create-practitioner.dto.ts:131` |
| `telehealthAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si atiende por telemedicina | `src/modules/profiles/dto/create-practitioner.dto.ts:140` |
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Nº de licencia de la autorización jurisdiccional inicial | `src/modules/profiles/dto/create-practitioner.dto.ts:163` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de jurisdicción de la licencia | `src/modules/profiles/dto/create-practitioner.dto.ts:174` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad regulatoria emisora | `src/modules/profiles/dto/create-practitioner.dto.ts:186` |
| `credentialNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Nº de la credencial de soporte | `src/modules/profiles/dto/create-practitioner.dto.ts:200` |
| `credentialTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del tipo de credencial | `src/modules/profiles/dto/create-practitioner.dto.ts:211` |
| `credentialIssuingInstitutionText` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | Institución que emitió la credencial de soporte | `src/modules/profiles/dto/create-practitioner.dto.ts:229` |
| `credentialIssueDate` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Fecha de emisión de la credencial de soporte (ISO) | `src/modules/profiles/dto/create-practitioner.dto.ts:244` |
| `languageConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del idioma clínico | `src/modules/profiles/dto/create-practitioner.dto.ts:255` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "practitionerCode": "CODIGO_EJEMPLO",
  "licenseNumber": "valor-ejemplo",
  "credentialNumber": "valor-ejemplo"
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
| `profileId` | `string` | Sí | formato uuid | — | Identificador asociado a profile. | `src/modules/profiles/dto/create-practitioner.dto.ts:264` |
| `personId` | `string` | Sí | formato uuid | — | Identificador asociado a person. | `src/modules/profiles/dto/create-practitioner.dto.ts:270` |
| `practitionerCode` | `string` | Sí | — | — | Valor de practitioner code mantenido por la instancia. | `src/modules/profiles/dto/create-practitioner.dto.ts:276` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/profiles/dto/create-practitioner.dto.ts:285` |
| `practiceStatus` | `string` | Sí | formato uuid | — | Concept id del estado de práctica | `src/modules/profiles/dto/create-practitioner.dto.ts:294` |
| `licenseId` | `string` | No | formato uuid | — | La autorización creada — **ausente** si el alta no trajo matrícula, que es el caso de una ficha de directorio. | `src/modules/profiles/dto/create-practitioner.dto.ts:301` |
| `credentialId` | `string` | No | formato uuid | — | La credencial creada. Ausente por el mismo motivo que `licenseId`. | `src/modules/profiles/dto/create-practitioner.dto.ts:305` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/create-practitioner.dto.ts:311` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts:51` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 20. POST /profiles/practitioners/{profileId}/affiliations

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Un consultorio de OTRO profesional — las fichas de directorio. Los profesionales que publican las redes de las aseguradoras no tienen cuenta —no traen correo— y por eso no pueden declarar dónde atienden. Sin esta ruta, un médico con tres consultorios se veía sin ninguno. Pide rol administrativo: escribir el historial laboral de alguien que no está mirando es otra cosa que escribir el propio.
- **Bloque:** Núcleo y Terminología
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addAffiliationFor` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:402`

### Qué es y para qué sirve (negocio)

Un consultorio de OTRO profesional — las fichas de directorio. Los profesionales que publican las redes de las aseguradoras no tienen cuenta —no traen correo— y por eso no pueden declarar dónde atienden. Sin esta ruta, un médico con tres consultorios se veía sin ninguno. Pide rol administrativo: escribir el historial laboral de alguien que no está mirando es otra cosa que escribir el propio. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/{profileId}/affiliations` la atiende `ProfilesPractitionersController.addAffiliationFor` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:402). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAffiliationDto` (9 campos, 2 obligatorios). Delega en `ProfilesPractitionersService.addAffiliationFor`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, profiles.practitioner_affiliations. Actualiza messaging.notification_requests. Lee directory.tenant_memberships, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs, messaging.recipient_preferences y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:402` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:402` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesAffiliationsService.estadoInicial → TenantAdministrationService.hasAdministrators → TenantMembershipsRepository.countActiveByTenantRole | `src/modules/directory/repositories/tenant-memberships.repository.ts:113` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesAffiliationsService.estadoInicial | `src/modules/profiles/services/profiles-affiliations.service.ts:228` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → ProfilesAffiliationsService.identidadDe | `src/modules/profiles/services/profiles-affiliations.service.ts:342` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → ProfilesAffiliationsService.identidadDe | `src/modules/profiles/services/profiles-affiliations.service.ts:341` |
| `profiles.practitioner_affiliations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → PractitionerAffiliationsRepository.create | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:208` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → PractitionerAffiliationsRepository.findSame | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:189` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPractitionersController.addAffiliationFor → ProfilesPractitionersService.addAffiliationFor → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido | `src/modules/profiles/services/profiles-affiliations.service.ts:609` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateAffiliationDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `primaryTenantId` | `string` | Sí | formato uuid | — | Tenant primario (organizador) | sin fuente |
| `participatingTenantId` | `string` | Sí | formato uuid | — | Tenant participante | sin fuente |
| `affiliationTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de afiliación (concepto) | `src/modules/profiles/dto/affiliation.dto.ts:73` |
| `hostPracticeSiteId` | `string` | No | formato uuid | — | Sitio de práctica anfitrión | sin fuente |
| `healthcareServiceId` | `string` | No | formato uuid | — | Servicio de salud implicado | sin fuente |
| `contractReference` | `string` | No | longitud máxima 200 | — | Referencia de contrato | sin fuente |
| `dataUseAgreementId` | `string` | No | formato uuid | — | Acuerdo de uso de datos (DUA) firmado | sin fuente |
| `validFrom` | `string` | No | — | — | Vigente desde (ISO date-time) | sin fuente |
| `validTo` | `string` | No | — | — | Vigente hasta (ISO date-time) | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "hostPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "contractReference": "valor-ejemplo",
  "dataUseAgreementId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<AffiliationResponseDto>` · DTO `AffiliationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: La sede indicada no existe |
| 409 | `CONFLICT` | ConflictException: Ese vínculo ya está en el historial laboral; ConflictException: Ya pediste vincularte a esa sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El fin del vínculo no puede ser anterior a su inicio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 21. POST /profiles/practitioners/{profileId}/jurisdiction-authorizations

- **Origen:** CONTRATO
- **Nombre:** Registrar/renovar autorización jurisdiccional (licencia)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addJurisdictionAuthorization` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:277`

### Qué es y para qué sirve (negocio)

Registrar/renovar autorización jurisdiccional (licencia). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/{profileId}/jurisdiction-authorizations` la atiende `ProfilesPractitionersController.addJurisdictionAuthorization` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:277). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateJurisdictionAuthorizationDto` (6 campos, 1 obligatorio). Delega en `ProfilesPractitionersService.addJurisdictionAuthorization`. Crea filas en profiles.jurisdiction_authorizations. Lee profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:277` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:277` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → JurisdictionAuthorizationsRepository.create | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:92` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addJurisdictionAuthorization → ProfilesPractitionersService.addJurisdictionAuthorization → ProfileOwnershipService.assertOwnsPractitionerProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateJurisdictionAuthorizationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 100 | `@IsString()` `@MinLength(1)` `@MaxLength(100)` | Nº de licencia | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:20` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de jurisdicción | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:31` |
| `regulatoryAuthority` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Autoridad regulatoria emisora | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:43` |
| `practiceScopeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del alcance de práctica | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:54` |
| `validFrom` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:65` |
| `validTo` | `string` | No | formato date | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date) | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:76` |

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
  "validTo": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<JurisdictionAuthorizationResponseDto>` · DTO `JurisdictionAuthorizationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:85` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:91` |
| `licenseNumber` | `string` | Sí | — | — | Valor de license number mantenido por la instancia. | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:97` |
| `state` | `string` | Sí | formato uuid | — | Concept id del estado de la licencia | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:106` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/create-jurisdiction-authorization.dto.ts:112` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Sólo el titular del perfil profesional o la plataforma pueden modificarlo |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts:62` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 22. DELETE /profiles/practitioners/{profileId}/photo

- **Origen:** CONTRATO
- **Nombre:** Quitar la foto del perfil profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.removePractitionerPhoto` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:253`

### Qué es y para qué sirve (negocio)

Quitar la foto del perfil profesional. Caso de uso P5 §3: Clear the practitioner profile photo (the file is not deleted). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:31`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`DELETE /profiles/practitioners/{profileId}/photo` la atiende `ProfilesPractitionersController.removePractitionerPhoto` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:253). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.removePractitionerPhoto`. Actualiza profiles.health_practitioner_profiles. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:253` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:253` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1116` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1117` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1114` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1115` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ContactPointsRepository.findVigentesByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio | `src/modules/profiles/services/profiles-practitioners.service.ts:583` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto | `src/modules/profiles/services/profiles-practitioners.service.ts:1062` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:85` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:107` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.removePractitionerPhoto → ProfilesPractitionersService.removePractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/repositories/professional-credentials.repository.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:192` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:195` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:198` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:201` |
| `professionalTitle` | `string` | No | — | — | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:205` |
| `professionalBio` | `string` | No | — | — | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:209` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:213` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:226` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:230` |
| `name` | `string` | No | — | — | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:239` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:242` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:245` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:248` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:251` |
| `nationalId` | `string` | No | — | — | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:258` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:261` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:264` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:267` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:270` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:273` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:277` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:280` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:283` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:40` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:43` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | Si es la especialidad con la que se presenta. Hay una sola vigente. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:47` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | Certificación del colegio o consejo. Es un dato que la gente busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:51` |
| `specialties[].practiceScopeText` | `string` | No | — | — | Alcance de práctica en palabras del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:55` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:58` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:61` |
| `specialties[].validTo` | `string` | No | formato date-time | — | Presente sólo si dejó de ejercerla. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:65` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:286` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:78` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:81` |
| `credentials[].number` | `string` | Sí | — | — | Nº de título o certificado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:85` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:89` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:92` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:98` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:106` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:114` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:289` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:120` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:123` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:126` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:129` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:132` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:135` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:138` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:292` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:150` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:153` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:156` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:301` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `affiliations[].organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `affiliations[].roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `affiliations[].departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `affiliations[].practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `affiliations[].affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `affiliations[].statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:304` |
| `activity.encounters` | `number` | Sí | — | — | Encuentros que abrió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:174` |
| `activity.medicationRequests` | `number` | Sí | — | — | Recetas que prescribió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:178` |
| `activity.clinicalNotes` | `number` | Sí | — | — | Notas clínicas que redactó. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:182` |
| `activity.documents` | `number` | Sí | — | — | Documentos que publicó en expedientes. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:307` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts:113` |

### Flujos

- Profiles Module (05) — etapa `P5 §3`

---

## 23. PUT /profiles/practitioners/{profileId}/photo

- **Origen:** CONTRATO
- **Nombre:** Fijar la foto del perfil profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.setPractitionerPhoto` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:228`

### Qué es y para qué sirve (negocio)

Fijar la foto del perfil profesional. Caso de uso P5 §3: Set the practitioner profile photo from an already uploaded file. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/profiles/README.md:30`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PUT /profiles/practitioners/{profileId}/photo` la atiende `ProfilesPractitionersController.setPractitionerPhoto` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:228). Exige sesión; el controlador no declara roles. Valida el cuerpo como `SetPractitionerPhotoDto` (1 campo, 1 obligatorio). Delega en `ProfilesPractitionersService.setPractitionerPhoto`. Actualiza profiles.health_practitioner_profiles. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.file_versions, common.files y 9 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:228` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:228` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1116` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1117` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1114` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1115` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ContactPointsRepository.findVigentesByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → AttachableFileService.assertUsableBy → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio | `src/modules/profiles/services/profiles-practitioners.service.ts:583` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto | `src/modules/profiles/services/profiles-practitioners.service.ts:1018` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:85` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:107` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.setPractitionerPhoto → ProfilesPractitionersService.setPractitionerPhoto → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/repositories/professional-credentials.repository.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `SetPractitionerPhotoDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `fileId` | `string` | Sí | formato uuid | `@IsUUID()` | Identificador del archivo ya subido que será la foto | `src/modules/profiles/dto/set-practitioner-photo.dto.ts:26` |

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
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:192` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:195` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:198` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:201` |
| `professionalTitle` | `string` | No | — | — | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:205` |
| `professionalBio` | `string` | No | — | — | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:209` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:213` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:226` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:230` |
| `name` | `string` | No | — | — | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:239` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:242` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:245` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:248` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:251` |
| `nationalId` | `string` | No | — | — | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:258` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:261` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:264` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:267` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:270` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:273` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:277` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:280` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:283` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:40` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:43` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | Si es la especialidad con la que se presenta. Hay una sola vigente. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:47` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | Certificación del colegio o consejo. Es un dato que la gente busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:51` |
| `specialties[].practiceScopeText` | `string` | No | — | — | Alcance de práctica en palabras del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:55` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:58` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:61` |
| `specialties[].validTo` | `string` | No | formato date-time | — | Presente sólo si dejó de ejercerla. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:65` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:286` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:78` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:81` |
| `credentials[].number` | `string` | Sí | — | — | Nº de título o certificado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:85` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:89` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:92` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:98` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:106` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:114` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:289` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:120` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:123` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:126` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:129` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:132` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:135` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:138` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:292` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:150` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:153` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:156` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:301` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `affiliations[].organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `affiliations[].roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `affiliations[].departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `affiliations[].practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `affiliations[].affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `affiliations[].statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:304` |
| `activity.encounters` | `number` | Sí | — | — | Encuentros que abrió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:174` |
| `activity.medicationRequests` | `number` | Sí | — | — | Recetas que prescribió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:178` |
| `activity.clinicalNotes` | `number` | Sí | — | — | Notas clínicas que redactó. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:182` |
| `activity.documents` | `number` | Sí | — | — | Documentos que publicó en expedientes. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:307` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts:102` |

### Flujos

- Profiles Module (05) — etapa `P5 §3`

---

## 24. POST /profiles/practitioners/{profileId}/specialties

- **Origen:** CONTRATO
- **Nombre:** Agregar especialidad con credencial de soporte
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addSpecialty` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:419`

### Qué es y para qué sirve (negocio)

Agregar especialidad con credencial de soporte. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/{profileId}/specialties` la atiende `ProfilesPractitionersController.addSpecialty` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:419). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AddSpecialtyDto` (5 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.addSpecialty`. Crea filas en profiles.practitioner_specialties. Actualiza profiles.practitioner_specialties. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_specialties, profiles.professional_credentials, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:419` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:419` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → ProfileOwnershipService.assertOwnsPractitionerProfile → ProfileOwnershipService.belongsToActor → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_specialties` | ESCRIBE | ACTUALIZA | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → PractitionerSpecialtiesRepository.demotePrimary | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:167` |
| `profiles.practitioner_specialties` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → PractitionerSpecialtiesRepository.create | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:60` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:107` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → ProfessionalCredentialsRepository.findById | `src/modules/profiles/repositories/professional-credentials.repository.ts:84` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addSpecialty → ProfilesPractitionersService.addSpecialty → MedicalSpecialtyCatalogService.assertIsMedicalSpecialty → MedicalSpecialtyCatalogService.listMemberIds → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo — DTO `AddSpecialtyDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id de la especialidad | `src/modules/profiles/dto/add-specialty.dto.ts:15` |
| `supportingCredentialId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Credencial de soporte (debe pertenecer al profesional y estar verificada) | `src/modules/profiles/dto/add-specialty.dto.ts:27` |
| `specialtyRoleConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Concept id del rol de especialidad | `src/modules/profiles/dto/add-specialty.dto.ts:38` |
| `isPrimary` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca la especialidad como primaria | `src/modules/profiles/dto/add-specialty.dto.ts:46` |
| `boardCertified` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Certificada por junta (board certified) | `src/modules/profiles/dto/add-specialty.dto.ts:56` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/add-specialty.dto.ts:65` |
| `specialtyConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a specialty concept. | `src/modules/profiles/dto/add-specialty.dto.ts:71` |
| `isPrimary` | `boolean` | Sí | — | — | Valor de is primary mantenido por la instancia. | `src/modules/profiles/dto/add-specialty.dto.ts:77` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Concept id del estado de verificación | `src/modules/profiles/dto/add-specialty.dto.ts:86` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/add-specialty.dto.ts:92` |

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
| CONTROLADOR | `src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts:71` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 25. GET /profiles/practitioners/{profileId}/summary

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil profesional de un colega (ficha de la guía)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.getPractitionerSummary` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:177`

### Qué es y para qué sirve (negocio)

Consultar el perfil profesional de un colega (ficha de la guía). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/{profileId}/summary` la atiende `ProfilesPractitionersController.getPractitionerSummary` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:177). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.getPractitionerSummary`. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:177` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: profileId | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:177` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1116` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1117` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1114` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1115` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ContactPointsRepository.findVigentesByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio | `src/modules/profiles/services/profiles-practitioners.service.ts:583` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:85` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:107` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getPractitionerSummary → ProfilesPractitionersService.getPractitionerSummary → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/repositories/professional-credentials.repository.ts:152` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `profileId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:192` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:195` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:198` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:201` |
| `professionalTitle` | `string` | No | — | — | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:205` |
| `professionalBio` | `string` | No | — | — | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:209` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:213` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:226` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:230` |
| `name` | `string` | No | — | — | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:239` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:242` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:245` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:248` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:251` |
| `nationalId` | `string` | No | — | — | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:258` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:261` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:264` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:267` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:270` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:273` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:277` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:280` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:283` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:40` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:43` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | Si es la especialidad con la que se presenta. Hay una sola vigente. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:47` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | Certificación del colegio o consejo. Es un dato que la gente busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:51` |
| `specialties[].practiceScopeText` | `string` | No | — | — | Alcance de práctica en palabras del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:55` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:58` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:61` |
| `specialties[].validTo` | `string` | No | formato date-time | — | Presente sólo si dejó de ejercerla. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:65` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:286` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:78` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:81` |
| `credentials[].number` | `string` | Sí | — | — | Nº de título o certificado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:85` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:89` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:92` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:98` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:106` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:114` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:289` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:120` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:123` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:126` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:129` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:132` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:135` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:138` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:292` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:150` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:153` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:156` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:301` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `affiliations[].organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `affiliations[].roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `affiliations[].departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `affiliations[].practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `affiliations[].affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `affiliations[].statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:304` |
| `activity.encounters` | `number` | Sí | — | — | Encuentros que abrió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:174` |
| `activity.medicationRequests` | `number` | Sí | — | — | Recetas que prescribió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:178` |
| `activity.clinicalNotes` | `number` | Sí | — | — | Notas clínicas que redactó. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:182` |
| `activity.documents` | `number` | Sí | — | — | Documentos que publicó en expedientes. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:307` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 26. PATCH /profiles/practitioners/me

- **Origen:** CONTRATO
- **Nombre:** Editar la presentación del propio perfil profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.updateOwnPractitionerProfile` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:199`

### Qué es y para qué sirve (negocio)

Editar la presentación del propio perfil profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`PATCH /profiles/practitioners/me` la atiende `ProfilesPractitionersController.updateOwnPractitionerProfile` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:199). Exige sesión; el controlador no declara roles. Valida el cuerpo como `UpdateOwnPractitionerProfileDto` (4 campos, 0 obligatorios). Delega en `ProfilesPractitionersService.updateOwnPractitionerProfile`. Crea filas en common.contact_points. Actualiza common.addresses, common.contact_points, profiles.health_practitioner_profiles, profiles.persons. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:199` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1116` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1117` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1114` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1115` |
| `common.addresses` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.reemplazarDomicilio → AddressesRepository.closeVigente | `src/modules/common/repositories/addresses.repository.ts:112` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.reemplazarDomicilio → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.reemplazarTelefono → ContactPointsRepository.closeVigente | `src/modules/common/repositories/contact-points.repository.ts:129` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.reemplazarTelefono → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.reemplazarTelefono → ContactPointsRepository.findVigenteByOwnerAndSystem | `src/modules/common/repositories/contact-points.repository.ts:98` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio | `src/modules/profiles/services/profiles-practitioners.service.ts:583` |
| `profiles.health_practitioner_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile | `src/modules/profiles/services/profiles-practitioners.service.ts:853` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:85` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile | `src/modules/profiles/services/profiles-practitioners.service.ts:872` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:107` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.updateOwnPractitionerProfile → ProfilesPractitionersService.updateOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/repositories/professional-credentials.repository.ts:152` |

### Cuerpo — DTO `UpdateOwnPractitionerProfileDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `professionalTitle` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Título profesional | `src/modules/profiles/dto/update-practitioner-profile.dto.ts:40` |
| `professionalBio` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Biografía profesional | `src/modules/profiles/dto/update-practitioner-profile.dto.ts:50` |
| `acceptsNewPatients` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si acepta pacientes nuevos | `src/modules/profiles/dto/update-practitioner-profile.dto.ts:62` |
| `telehealthAvailable` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Si atiende por telemedicina | `src/modules/profiles/dto/update-practitioner-profile.dto.ts:68` |

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
  "telehealthAvailable": true
}
```

</details>

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:192` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:195` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:198` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:201` |
| `professionalTitle` | `string` | No | — | — | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:205` |
| `professionalBio` | `string` | No | — | — | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:209` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:213` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:226` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:230` |
| `name` | `string` | No | — | — | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:239` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:242` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:245` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:248` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:251` |
| `nationalId` | `string` | No | — | — | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:258` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:261` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:264` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:267` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:270` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:273` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:277` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:280` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:283` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:40` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:43` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | Si es la especialidad con la que se presenta. Hay una sola vigente. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:47` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | Certificación del colegio o consejo. Es un dato que la gente busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:51` |
| `specialties[].practiceScopeText` | `string` | No | — | — | Alcance de práctica en palabras del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:55` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:58` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:61` |
| `specialties[].validTo` | `string` | No | formato date-time | — | Presente sólo si dejó de ejercerla. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:65` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:286` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:78` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:81` |
| `credentials[].number` | `string` | Sí | — | — | Nº de título o certificado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:85` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:89` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:92` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:98` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:106` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:114` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:289` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:120` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:123` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:126` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:129` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:132` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:135` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:138` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:292` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:150` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:153` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:156` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:301` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `affiliations[].organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `affiliations[].roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `affiliations[].departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `affiliations[].practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `affiliations[].affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `affiliations[].statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:304` |
| `activity.encounters` | `number` | Sí | — | — | Encuentros que abrió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:174` |
| `activity.medicationRequests` | `number` | Sí | — | — | Recetas que prescribió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:178` |
| `activity.clinicalNotes` | `number` | Sí | — | — | Notas clínicas que redactó. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:182` |
| `activity.documents` | `number` | Sí | — | — | Documentos que publicó en expedientes. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:307` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Perfil profesional no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La cuenta no tiene una persona vinculada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 27. GET /profiles/practitioners/me/affiliations

- **Origen:** CONTRATO
- **Nombre:** Historial laboral propio (instituciones donde trabajó)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.listOwnAffiliations` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:346`

### Qué es y para qué sirve (negocio)

Historial laboral propio (instituciones donde trabajó). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/affiliations` la atiende `ProfilesPractitionersController.listOwnAffiliations` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:346). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.listOwnAffiliations`. Lee profiles.health_practitioner_profiles, profiles.person_account_links, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:346` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listOwnAffiliations → ProfilesPractitionersService.listOwnAffiliations → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listOwnAffiliations → ProfilesPractitionersService.listOwnAffiliations → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.listOwnAffiliations → ProfilesPractitionersService.listOwnAffiliations → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:69` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ListAffiliationsResponseDto>` · DTO `ListAffiliationsResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AffiliationResponseDto>` | Sí | — | — | Las afiliaciones, de la más reciente a la más antigua. | `src/modules/profiles/dto/affiliation.dto.ts:219` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `items[].organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `items[].roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `items[].departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `items[].practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `items[].affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `items[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `items[].endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `items[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `items[].status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `items[].statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `items[].decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |
| `count` | `number` | Sí | — | — | Cantidad devuelta. | `src/modules/profiles/dto/affiliation.dto.ts:225` |

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

## 28. POST /profiles/practitioners/me/affiliations

- **Origen:** CONTRATO
- **Nombre:** Registrar una afiliación institucional en el historial propio
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addOwnAffiliation` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:357`

### Qué es y para qué sirve (negocio)

Registrar una afiliación institucional en el historial propio. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/me/affiliations` la atiende `ProfilesPractitionersController.addOwnAffiliation` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:357). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreateAffiliationDto` (9 campos, 2 obligatorios). Delega en `ProfilesPractitionersService.addOwnAffiliation`. Crea filas en messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests, profiles.practitioner_affiliations. Actualiza messaging.notification_requests. Lee directory.tenant_memberships, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs, messaging.recipient_preferences y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:357` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesAffiliationsService.estadoInicial → TenantAdministrationService.hasAdministrators → TenantMembershipsRepository.countActiveByTenantRole | `src/modules/directory/repositories/tenant-memberships.repository.ts:113` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesAffiliationsService.estadoInicial | `src/modules/profiles/services/profiles-affiliations.service.ts:228` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → ProfilesAffiliationsService.identidadDe | `src/modules/profiles/services/profiles-affiliations.service.ts:342` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido → ProfilesAffiliationsService.identidadDe | `src/modules/profiles/services/profiles-affiliations.service.ts:341` |
| `profiles.practitioner_affiliations` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → PractitionerAffiliationsRepository.create | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:208` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → PractitionerAffiliationsRepository.findSame | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:189` |
| `terminology.catalog_concepts` | LEE | LEE | POR_SQL | ProfilesPractitionersController.addOwnAffiliation → ProfilesPractitionersService.addOwnAffiliation → ProfilesPractitionersService.agregarAfiliacion → ProfilesPractitionersService.avisarDelPedido → ProfilesAffiliationsService.avisarDelPedido | `src/modules/profiles/services/profiles-affiliations.service.ts:609` |

### Cuerpo — DTO `CreateAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `primaryTenantId` | `string` | Sí | formato uuid | — | Tenant primario (organizador) | sin fuente |
| `participatingTenantId` | `string` | Sí | formato uuid | — | Tenant participante | sin fuente |
| `affiliationTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de afiliación (concepto) | `src/modules/profiles/dto/affiliation.dto.ts:73` |
| `hostPracticeSiteId` | `string` | No | formato uuid | — | Sitio de práctica anfitrión | sin fuente |
| `healthcareServiceId` | `string` | No | formato uuid | — | Servicio de salud implicado | sin fuente |
| `contractReference` | `string` | No | longitud máxima 200 | — | Referencia de contrato | sin fuente |
| `dataUseAgreementId` | `string` | No | formato uuid | — | Acuerdo de uso de datos (DUA) firmado | sin fuente |
| `validFrom` | `string` | No | — | — | Vigente desde (ISO date-time) | sin fuente |
| `validTo` | `string` | No | — | — | Vigente hasta (ISO date-time) | sin fuente |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "primaryTenantId": "00000000-0000-4000-8000-000000000001",
  "participatingTenantId": "00000000-0000-4000-8000-000000000001",
  "affiliationTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "hostPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "contractReference": "valor-ejemplo",
  "dataUseAgreementId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "valor-ejemplo",
  "validTo": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<AffiliationResponseDto>` · DTO `AffiliationResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Profesional no encontrado; ResourceNotFoundException: La sede indicada no existe |
| 409 | `CONFLICT` | ConflictException: Ese vínculo ya está en el historial laboral; ConflictException: Ya pediste vincularte a esa sede |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El fin del vínculo no puede ser anterior a su inicio |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:200` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 29. POST /profiles/practitioners/me/credentials

- **Origen:** CONTRATO_AUSENTE _(existe en el código pero `openapi.json` no la publica)_
- **Nombre:** Los títulos propios, uno por llamada. Va bajo `practitioners/me` y no bajo `practitioners/:profileId` porque el sujeto sale de la sesión: así no existe la forma de escribir la formación de otro profesional, ni siquiera equivocándose de id.
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.addOwnCredential` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:378`

### Qué es y para qué sirve (negocio)

Los títulos propios, uno por llamada. Va bajo `practitioners/me` y no bajo `practitioners/:profileId` porque el sujeto sale de la sesión: así no existe la forma de escribir la formación de otro profesional, ni siquiera equivocándose de id. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /profiles/practitioners/me/credentials` la atiende `ProfilesPractitionersController.addOwnCredential` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:378). Exige sesión; el controlador no declara roles. Valida el cuerpo como `AddOwnCredentialDto` (5 campos, 2 obligatorios). Delega en `ProfilesPractitionersService.addOwnCredential`. Crea filas en profiles.professional_credentials. Lee common.file_versions, common.files, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:378` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `common.file_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → AttachableFileService.assertUsableBy → FileVersionsRepository.findById | `src/modules/common/repositories/file-versions.repository.ts:72` |
| `common.files` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → AttachableFileService.assertUsableBy → FilesRepository.findById | `src/modules/common/repositories/files.repository.ts:45` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.professional_credentials` | ESCRIBE | CREA | DIRECTA | ProfilesPractitionersController.addOwnCredential → ProfilesPractitionersService.addOwnCredential → ProfessionalCredentialsRepository.create | `src/modules/profiles/repositories/professional-credentials.repository.ts:98` |

### Cuerpo — DTO `AddOwnCredentialDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `credentialTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Concept id del tipo de credencial (título universitario, diplomado, maestría, doctorado o título de especialidad) | `src/modules/profiles/dto/own-credential.dto.ts:33` |
| `number` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número o código del diploma. **Obligatorio**: la columna es `NOT NULL` en el modelo, así que aceptar el alta sin él sólo cambiaría un aviso claro del formulario por un error 500 al escribir. | `src/modules/profiles/dto/own-credential.dto.ts:43` |
| `issuingInstitutionText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Dónde se cursó. Texto libre a propósito: las universidades del exterior no están en ningún catálogo nuestro, y exigir que lo estén dejaría fuera a cualquiera que se formó afuera. | `src/modules/profiles/dto/own-credential.dto.ts:54` |
| `issueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Fecha de emisión del título. | `src/modules/profiles/dto/own-credential.dto.ts:60` |
| `fileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo del diploma (debe haberlo subido el mismo usuario) | `src/modules/profiles/dto/own-credential.dto.ts:75` |

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
  "issueDate": "2026-07-31",
  "fileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<OwnCredentialResponseDto>` · DTO `OwnCredentialResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/own-credential.dto.ts:81` |
| `credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/own-credential.dto.ts:84` |
| `number` | `string` | No | — | — | — | `src/modules/profiles/dto/own-credential.dto.ts:87` |
| `issuingInstitutionText` | `string` | No | — | — | — | `src/modules/profiles/dto/own-credential.dto.ts:90` |
| `issueDate` | `string` | No | formato date | — | — | `src/modules/profiles/dto/own-credential.dto.ts:93` |
| `stateConceptId` | `string` | Sí | formato uuid | — | `CRED_PENDING` recién creada: declararla no es haberla verificado. | `src/modules/profiles/dto/own-credential.dto.ts:97` |
| `fileId` | `string` | No | formato uuid | — | — | `src/modules/profiles/dto/own-credential.dto.ts:100` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/dto/own-credential.dto.ts:103` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor; ForbiddenException: Esta cuenta no tiene un perfil profesional asociado; ForbiddenException: {labels.subject} no le pertenece |
| 404 | `NOT_FOUND` | ResourceNotFoundException: {labels.notFound} |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Ese concepto no es un tipo de credencial profesional; PreconditionFailedException: {labels.subject} está borrado; PreconditionFailedException: {labels.subject} no tiene una versión vigente; PreconditionFailedException: {labels.subject} resultó infectado; PreconditionFailedException: {labels.subject} no es de un formato admitido para este uso |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/profiles.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 30. GET /profiles/practitioners/me/linkable-organizations

- **Origen:** CONTRATO
- **Nombre:** Buscar instituciones del padrón para declarar una afiliación
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.searchLinkableOrganizations` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:314`

### Qué es y para qué sirve (negocio)

Buscar instituciones del padrón para declarar una afiliación. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/linkable-organizations` la atiende `ProfilesPractitionersController.searchLinkableOrganizations` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:314). Exige sesión; el controlador no declara roles. Delega en `LinkableOrganizationsService.buscar`. Lee terminology.catalog_concepts, terminology.concept_properties, terminology.value_set_members, terminology.value_set_versions, terminology.value_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:314` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.buscar → CatalogConceptsRepository.search | `src/modules/terminology/repositories/catalog-concepts.repository.ts:227` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.buscar → LinkableOrganizationsService.acotarPorMunicipio → ConceptDesignationsRepository.findPropertyForConcepts | `src/modules/terminology/repositories/concept-designations.repository.ts:200` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.buscar → LinkableOrganizationsService.miembrosDelPadron → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.buscar → LinkableOrganizationsService.miembrosDelPadron → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ProfilesPractitionersController.searchLinkableOrganizations → LinkableOrganizationsService.buscar → LinkableOrganizationsService.miembrosDelPadron → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

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
| `items` | `array<LinkableOrganizationDto>` | Sí | — | — | Los establecimientos que coinciden. | `src/modules/profiles/dto/linkable-organization.dto.ts:65` |
| `items[].facilityConceptId` | `string` | Sí | formato uuid | — | El concepto del establecimiento en el catálogo. Es lo que se guardará como vínculo estructurado cuando `practitioner_affiliations` tenga columna donde anotarlo. Hasta entonces viaja igual: el cliente lo necesita para distinguir dos homónimos, y el contrato no cambia cuando la columna exista. | `src/modules/profiles/dto/linkable-organization.dto.ts:26` |
| `items[].code` | `string` | Sí | — | — | Código estable del establecimiento en el padrón. | `src/modules/profiles/dto/linkable-organization.dto.ts:30` |
| `items[].name` | `string` | Sí | — | — | El nombre canónico, el del padrón. Es el valor que conviene guardar en `organization_name`: mientras cada médico escriba el nombre a mano, «CLINICA FOIANINI», «Clínica Ángel Foianini» y «Centro Médico Foianini» son tres instituciones distintas para el sistema, y son una sola en la realidad. | `src/modules/profiles/dto/linkable-organization.dto.ts:41` |
| `items[].municipality` | `string` | No | admite null | — | Municipio donde está; lo que separa a los homónimos. | `src/modules/profiles/dto/linkable-organization.dto.ts:45` |
| `items[].type` | `string` | No | admite null | — | `CLINICA_PRIVADA`, `HOSPITAL`, `CAJA_SALUD`, `CENTRO_SALUD`, … | `src/modules/profiles/dto/linkable-organization.dto.ts:49` |
| `items[].address` | `string` | No | admite null | — | Dirección declarada en el padrón, cuando la trae. | `src/modules/profiles/dto/linkable-organization.dto.ts:53` |
| `count` | `number` | Sí | — | — | Cantidad devuelta | `src/modules/profiles/dto/linkable-organization.dto.ts:69` |
| `limit` | `number` | Sí | — | — | Tope de resultados aplicado | `src/modules/profiles/dto/linkable-organization.dto.ts:73` |

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

## 31. GET /profiles/practitioners/me/onboarding

- **Origen:** CONTRATO
- **Nombre:** Qué le falta al profesional para completar su alta
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.getOwnOnboarding` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:111`

### Qué es y para qué sirve (negocio)

Qué le falta al profesional para completar su alta. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/onboarding` la atiende `ProfilesPractitionersController.getOwnOnboarding` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:111). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.getOwnOnboarding`. Lee profiles.health_practitioner_profiles, profiles.jurisdiction_authorizations, profiles.person_account_links, profiles.practitioner_affiliations, profiles.practitioner_specialties, scheduling.bookable_slots, scheduling.schedulable_resources.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:111` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:85` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding | `src/modules/profiles/services/profiles-practitioners.service.ts:242` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:107` |
| `scheduling.bookable_slots` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding | `src/modules/profiles/services/profiles-practitioners.service.ts:259` |
| `scheduling.schedulable_resources` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnOnboarding → ProfilesPractitionersService.getOwnOnboarding | `src/modules/profiles/services/profiles-practitioners.service.ts:246` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerOnboardingDto>` · DTO `PractitionerOnboardingDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `practitionerProfileId` | `string` | Sí | formato uuid | — | El perfil consultado. | `src/modules/profiles/dto/practitioner-onboarding.dto.ts:53` |
| `steps` | `array<OnboardingStepDto>` | Sí | — | — | Las cinco etapas, siempre las cinco y en orden. | `src/modules/profiles/dto/practitioner-onboarding.dto.ts:56` |
| `steps[].key` | `object` | Sí | — | — | Qué etapa es. | `src/modules/profiles/dto/practitioner-onboarding.dto.ts:23` |
| `steps[].complete` | `boolean` | Sí | — | — | Está cumplida con los datos que el profesional ya cargó. | `src/modules/profiles/dto/practitioner-onboarding.dto.ts:26` |
| `steps[].missing` | `array<string>` | Sí | — | — | Qué falta, en claves estables que la pantalla traduce. Van en clave y no en prosa porque el texto es del front: acá se dice qué falta, no cómo se le pide a la persona. | `src/modules/profiles/dto/practitioner-onboarding.dto.ts:34` |
| `firstIncomplete` | `object` | Sí | valores: done | — | La primera etapa incompleta, o `done` si no queda ninguna. Es lo único que la pantalla necesita para decidir dónde aterrizar. | `src/modules/profiles/dto/practitioner-onboarding.dto.ts:64` |

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
| INTEGRACION | `test/integration/tj1-onboarding-medico.int-spec.ts:43` |
| CONTROLADOR | `src/modules/profiles/controllers/profiles-practitioners.controller.spec.ts:132` |

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 32. GET /profiles/practitioners/me/summary

- **Origen:** CONTRATO
- **Nombre:** Consultar el perfil profesional propio (trayectoria y actividad)
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ProfilesPractitionersController.getOwnPractitionerProfile` — `src/modules/profiles/controllers/profiles-practitioners.controller.ts:88`

### Qué es y para qué sirve (negocio)

Consultar el perfil profesional propio (trayectoria y actividad). Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /profiles/practitioners/me/summary` la atiende `ProfilesPractitionersController.getOwnPractitionerProfile` (src/modules/profiles/controllers/profiles-practitioners.controller.ts:88). Exige sesión; el controlador no declara roles. Delega en `ProfilesPractitionersService.getOwnPractitionerProfile`. Lee chart.clinical_note_headers, chart.document_records, clinical.encounters, clinical.medication_requests, common.addresses, common.contact_points, common.identifiers, profiles.health_practitioner_profiles y 7 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/profiles-practitioners.controller.ts:88` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `chart.clinical_note_headers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1116` |
| `chart.document_records` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1117` |
| `clinical.encounters` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1114` |
| `clinical.medication_requests` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.countActivity | `src/modules/profiles/services/profiles-practitioners.service.ts:1115` |
| `common.addresses` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio → AddressesRepository.findVigenteByOwnerAndUse | `src/modules/common/repositories/addresses.repository.ts:84` |
| `common.contact_points` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ContactPointsRepository.findVigentesByOwner | `src/modules/common/repositories/contact-points.repository.ts:71` |
| `common.identifiers` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfilesPractitionersService.leerDocumentoYDomicilio | `src/modules/profiles/services/profiles-practitioners.service.ts:583` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → JurisdictionAuthorizationsRepository.findByPractitioner | `src/modules/profiles/repositories/jurisdiction-authorizations.repository.ts:85` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |
| `profiles.persons` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PersonsRepository.findById | `src/modules/profiles/repositories/persons.repository.ts:90` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerAffiliationsRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:69` |
| `profiles.practitioner_languages` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerLanguagesRepository.findByPractitioner | `src/modules/profiles/repositories/practitioner-languages.repository.ts:55` |
| `profiles.practitioner_specialties` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → PractitionerSpecialtiesRepository.findAllByPractitioner | `src/modules/profiles/repositories/practitioner-specialties.repository.ts:107` |
| `profiles.professional_credentials` | LEE | LEE | DIRECTA | ProfilesPractitionersController.getOwnPractitionerProfile → ProfilesPractitionersService.getOwnPractitionerProfile → ProfilesPractitionersService.buildSummary → ProfessionalCredentialsRepository.findByPractitioner | `src/modules/profiles/repositories/professional-credentials.repository.ts:152` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PractitionerProfileSummaryDto>` · DTO `PractitionerProfileSummaryDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `profileId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:192` |
| `personId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:195` |
| `practitionerCode` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:198` |
| `displayName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:201` |
| `professionalTitle` | `string` | No | — | — | «Médica cardióloga», «Kinesiólogo». Texto libre del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:205` |
| `professionalBio` | `string` | No | — | — | Presentación en prosa. Es lo que hace que un perfil se lea como una persona. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:209` |
| `photoFileId` | `string` | No | formato uuid | — | Foto de perfil, si cargó una. Se resuelve por el módulo de archivos. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:213` |
| `email` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:226` |
| `phone` | `string` | No | — | — | Sólo en la lectura propia | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:230` |
| `name` | `string` | No | — | — | Las cuatro partes, para poder corregir el nombre sin adivinar dónde cortarlo. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:239` |
| `middleName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:242` |
| `lastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:245` |
| `motherLastName` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:248` |
| `birthDate` | `string` | No | formato date | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:251` |
| `nationalId` | `string` | No | — | — | Documento de identidad. **No editable desde el perfil**: es un identificador oficial y tiene su propio circuito de verificación. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:258` |
| `issuerAdministrativeAreaConceptId` | `string` | No | formato uuid | — | Departamento emisor (VS_BO_DEPARTMENT) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:261` |
| `residenceMunicipalityConceptId` | `string` | No | formato uuid | — | Municipio de residencia (VS_BO_MUNICIPALITY) | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:264` |
| `practitionerCategoryConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:267` |
| `verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:270` |
| `practiceStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:273` |
| `acceptsNewPatients` | `boolean` | Sí | — | — | Si toma pacientes nuevos. Cambia qué se le puede ofrecer a quien busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:277` |
| `telehealthAvailable` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:280` |
| `specialties` | `array<PractitionerSpecialtyDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:283` |
| `specialties[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:40` |
| `specialties[].specialtyConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:43` |
| `specialties[].isPrimary` | `boolean` | Sí | — | — | Si es la especialidad con la que se presenta. Hay una sola vigente. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:47` |
| `specialties[].boardCertified` | `boolean` | Sí | — | — | Certificación del colegio o consejo. Es un dato que la gente busca. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:51` |
| `specialties[].practiceScopeText` | `string` | No | — | — | Alcance de práctica en palabras del propio profesional. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:55` |
| `specialties[].verificationStatusConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:58` |
| `specialties[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:61` |
| `specialties[].validTo` | `string` | No | formato date-time | — | Presente sólo si dejó de ejercerla. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:65` |
| `credentials` | `array<PractitionerCredentialDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:286` |
| `credentials[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:78` |
| `credentials[].credentialTypeConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:81` |
| `credentials[].number` | `string` | Sí | — | — | Nº de título o certificado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:85` |
| `credentials[].issuingInstitutionText` | `string` | No | — | — | Dónde se cursó, en texto libre: la institución no siempre es un tenant. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:89` |
| `credentials[].issueDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:92` |
| `credentials[].expiryDate` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:95` |
| `credentials[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:98` |
| `credentials[].verifiedAt` | `string` | No | formato date-time | — | Cuándo se comprobó la credencial contra su fuente. Ausente significa «no verificada todavía», que no es lo mismo que «rechazada» —eso lo dice `stateConceptId`—. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:106` |
| `credentials[].verificationSourceUri` | `string` | No | — | — | Contra qué se comprobó la credencial (registro del colegio médico, portal de matrículas, etc). Ausente antes de verificar: es evidencia de la verificación, no del dato declarado. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:114` |
| `licenses` | `array<PractitionerLicenseDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:289` |
| `licenses[].id` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:120` |
| `licenses[].jurisdictionConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:123` |
| `licenses[].licenseNumber` | `string` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:126` |
| `licenses[].regulatoryAuthority` | `string` | No | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:129` |
| `licenses[].stateConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:132` |
| `licenses[].validFrom` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:135` |
| `licenses[].validTo` | `string` | No | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:138` |
| `languages` | `array<PractitionerLanguageDto>` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:292` |
| `languages[].languageConceptId` | `string` | Sí | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:150` |
| `languages[].proficiencyConceptId` | `string` | No | formato uuid | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:153` |
| `languages[].clinicalInterpretationAllowed` | `boolean` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:156` |
| `affiliations` | `array<AffiliationResponseDto>` | Sí | — | — | Historial laboral (UC-05-16): trayectoria, no PHI. Se devuelve un único array de la más reciente a la más antigua, con `current` ya derivado en cada fila — pantalla la agrupa en fases (formación/histórico/actual), la lectura no necesita decidir eso. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:301` |
| `affiliations[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/profiles/dto/affiliation.dto.ts:100` |
| `affiliations[].practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | `src/modules/profiles/dto/affiliation.dto.ts:106` |
| `affiliations[].organizationName` | `string` | Sí | — | — | Institución. | `src/modules/profiles/dto/affiliation.dto.ts:112` |
| `affiliations[].roleTitle` | `string` | Sí | — | — | Cargo. | `src/modules/profiles/dto/affiliation.dto.ts:118` |
| `affiliations[].departmentText` | `string` | No | admite null | — | Servicio o departamento. | `src/modules/profiles/dto/affiliation.dto.ts:124` |
| `affiliations[].practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | `src/modules/profiles/dto/affiliation.dto.ts:130` |
| `affiliations[].affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:136` |
| `affiliations[].startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | `src/modules/profiles/dto/affiliation.dto.ts:142` |
| `affiliations[].endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | `src/modules/profiles/dto/affiliation.dto.ts:148` |
| `affiliations[].current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | `src/modules/profiles/dto/affiliation.dto.ts:157` |
| `affiliations[].status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/profiles/dto/affiliation.dto.ts:163` |
| `affiliations[].statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | `src/modules/profiles/dto/affiliation.dto.ts:188` |
| `affiliations[].decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | `src/modules/profiles/dto/affiliation.dto.ts:204` |
| `affiliations[].createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/profiles/dto/affiliation.dto.ts:210` |
| `activity` | `PractitionerActivityDto` | Sí | — | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:304` |
| `activity.encounters` | `number` | Sí | — | — | Encuentros que abrió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:174` |
| `activity.medicationRequests` | `number` | Sí | — | — | Recetas que prescribió. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:178` |
| `activity.clinicalNotes` | `number` | Sí | — | — | Notas clínicas que redactó. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:182` |
| `activity.documents` | `number` | Sí | — | — | Documentos que publicó en expedientes. | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:186` |
| `createdAt` | `string` | Sí | formato date-time | — | — | `src/modules/profiles/dto/read-practitioner-profile.dto.ts:307` |

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

_Ninguna prueba existente menciona esta operación._

### Flujos

- Profiles Module (05) — etapa `ctrl:ProfilesPractitionersController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 33. GET /tenants/{tenantId}/practitioner-requests

- **Origen:** CONTRATO
- **Nombre:** Solicitudes de médicos que piden atender en la organización
- **Bloque:** Núcleo y Terminología
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.list` — `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:54`

### Qué es y para qué sirve (negocio)

Solicitudes de médicos que piden atender en la organización. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`GET /tenants/{tenantId}/practitioner-requests` la atiende `TenantPractitionerRequestsController.list` (src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:54). Exige sesión; el controlador no declara roles. Delega en `ProfilesAffiliationsService.listarSolicitudes`. Lee directory.tenant_memberships, practice.practice_sites, profiles.jurisdiction_authorizations, profiles.persons, profiles.practitioner_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:54` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:54` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listarSolicitudes → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listarSolicitudes | `src/modules/profiles/services/profiles-affiliations.service.ts:278` |
| `profiles.jurisdiction_authorizations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listarSolicitudes → ProfilesAffiliationsService.identidadDe | `src/modules/profiles/services/profiles-affiliations.service.ts:342` |
| `profiles.persons` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listarSolicitudes → ProfilesAffiliationsService.identidadDe | `src/modules/profiles/services/profiles-affiliations.service.ts:341` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.list → ProfilesAffiliationsService.listarSolicitudes → PractitionerAffiliationsRepository.findBySites | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:132` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<AffiliationRequestListDto>` · DTO `AffiliationRequestListDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<AffiliationRequestDto>` | Sí | — | — | Las solicitudes pendientes, de la más reciente a la más antigua. | `src/modules/profiles/dto/affiliation-request.dto.ts:75` |
| `items[].id` | `string` | Sí | formato uuid | — | Identificador de la solicitud, con el que se aprueba o rechaza. | `src/modules/profiles/dto/affiliation-request.dto.ts:17` |
| `items[].practitionerProfileId` | `string` | Sí | formato uuid | — | Profesional que pide el vínculo. | `src/modules/profiles/dto/affiliation-request.dto.ts:21` |
| `items[].practitionerName` | `string` | Sí | admite null | — | Cómo se llama quien pide, para poder decidir. Sin esto la bandeja mostraba cargo, institución y fecha, y ningún nombre: quien administra la organización tenía que aprobar o rechazar a un identificador. Nadie acepta a alguien que no sabe quién es —y si acepta igual, es peor—, así que el pedido viaja identificado. `null` si el profesional no tiene nombre cargado, que la pantalla debe contar como dato faltante y no como una persona anónima. | `src/modules/profiles/dto/affiliation-request.dto.ts:35` |
| `items[].practitionerLicense` | `string` | Sí | admite null | — | Matrícula del Ministerio, que es lo que lo habilita a ejercer. Es el dato con el que una organización verifica de verdad a quien le pide entrar: el nombre dice quién dice ser, la matrícula dice si puede. | `src/modules/profiles/dto/affiliation-request.dto.ts:44` |
| `items[].organizationName` | `string` | Sí | — | — | Institución tal como la declaró el profesional. | `src/modules/profiles/dto/affiliation-request.dto.ts:48` |
| `items[].roleTitle` | `string` | Sí | — | — | Cargo declarado. | `src/modules/profiles/dto/affiliation-request.dto.ts:52` |
| `items[].practiceSiteId` | `string` | Sí | formato uuid; admite null | — | Sede de la organización a la que apunta el pedido. | `src/modules/profiles/dto/affiliation-request.dto.ts:56` |
| `items[].startDate` | `string` | Sí | formato date-time | — | Desde cuándo dice que el vínculo empieza. | `src/modules/profiles/dto/affiliation-request.dto.ts:60` |
| `items[].statusConceptId` | `string` | Sí | formato uuid | — | Estado del vínculo. | `src/modules/profiles/dto/affiliation-request.dto.ts:64` |
| `items[].createdAt` | `string` | Sí | formato date-time | — | Cuándo se pidió. | `src/modules/profiles/dto/affiliation-request.dto.ts:68` |

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
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:216` |

### Flujos

- Profiles Module (05) — etapa `ctrl:TenantPractitionerRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 34. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve

- **Origen:** CONTRATO
- **Nombre:** Aprobar la solicitud de un profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.approve` — `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:69`

### Qué es y para qué sirve (negocio)

Aprobar la solicitud de un profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/approve` la atiende `TenantPractitionerRequestsController.approve` (src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:69). Exige sesión; el controlador no declara roles. Delega en `ProfilesAffiliationsService.aprobar`. Crea filas en directory.tenant_memberships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.notification_requests, profiles.practitioner_affiliations. Lee directory.tenant_memberships, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs, messaging.recipient_preferences y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, affiliationId | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:69` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.concederMembresia → DirectoryMembershipsService.ensureMembresiaAsistencial → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir | `src/modules/profiles/services/profiles-affiliations.service.ts:478` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.concederMembresia → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.practitioner_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir | `src/modules/profiles/services/profiles-affiliations.service.ts:499` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.approve → ProfilesAffiliationsService.aprobar → ProfilesAffiliationsService.decidir → PractitionerAffiliationsRepository.findById | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:166` |

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
| INTEGRACION | `test/integration/fx2-medico-multisede-publica-agenda.int-spec.ts:229` |

### Flujos

- Profiles Module (05) — etapa `ctrl:TenantPractitionerRequestsController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 35. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject

- **Origen:** CONTRATO
- **Nombre:** Rechazar la solicitud de un profesional
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.reject` — `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:81`

### Qué es y para qué sirve (negocio)

Rechazar la solicitud de un profesional. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/reject` la atiende `TenantPractitionerRequestsController.reject` (src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:81). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RejectAffiliationDto` (1 campo, 0 obligatorios). Delega en `ProfilesAffiliationsService.rechazar`. Crea filas en directory.tenant_memberships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.notification_requests, profiles.practitioner_affiliations. Lee directory.tenant_memberships, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs, messaging.recipient_preferences y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, affiliationId | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.concederMembresia → DirectoryMembershipsService.ensureMembresiaAsistencial → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir | `src/modules/profiles/services/profiles-affiliations.service.ts:478` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.concederMembresia → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.practitioner_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir | `src/modules/profiles/services/profiles-affiliations.service.ts:499` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.reject → ProfilesAffiliationsService.rechazar → ProfilesAffiliationsService.decidir → PractitionerAffiliationsRepository.findById | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:166` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `affiliationId` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(MAX_REJECT_REASON_LENGTH)` | — | `src/modules/profiles/dto/affiliation-request.dto.ts:97` |

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

## 36. POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke

- **Origen:** CONTRATO
- **Nombre:** Dar de baja un vínculo ya aprobado
- **Bloque:** Núcleo y Terminología
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `TenantPractitionerRequestsController.revoke` — `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:104`

### Qué es y para qué sirve (negocio)

Dar de baja un vínculo ya aprobado. Dentro del módulo (descripción del modelo, en inglés): «Separates the human person from login accounts and from domain roles.» Dominio: Núcleo y Terminología.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_05_profiles.puml:9`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:28`)

### Cómo se atiende (sistema)

`POST /tenants/{tenantId}/practitioner-requests/{affiliationId}/revoke` la atiende `TenantPractitionerRequestsController.revoke` (src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:104). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RejectAffiliationDto` (1 campo, 0 obligatorios). Delega en `ProfilesAffiliationsService.revocar`. Crea filas en directory.tenant_memberships, messaging.in_app_notifications, messaging.notification_deliveries, messaging.notification_requests. Actualiza messaging.notification_requests, profiles.practitioner_affiliations. Lee directory.tenant_memberships, messaging.message_channels, messaging.message_templates, messaging.messaging_providers, messaging.notification_deliveries, messaging.notification_requests, messaging.provider_channel_configs, messaging.recipient_preferences y 3 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:104` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: tenantId, affiliationId | `src/modules/profiles/controllers/tenant-practitioner-requests.controller.ts:104` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.concederMembresia → DirectoryMembershipsService.ensureMembresiaAsistencial → TenantMembershipsRepository.create | `src/modules/directory/repositories/tenant-memberships.repository.ts:131` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → TenantAdministrationService.assertCanAdminister → TenantAdministrationService.activeMembershipOf → TenantMembershipsRepository.findActiveByUserTenant | `src/modules/directory/repositories/tenant-memberships.repository.ts:70` |
| `messaging.in_app_notifications` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createInAppNotification | `src/modules/messaging/repositories/notifications.repository.ts:710` |
| `messaging.message_channels` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findChannelById | `src/modules/messaging/repositories/notifications.repository.ts:139` |
| `messaging.message_templates` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findTemplateById | `src/modules/messaging/repositories/notifications.repository.ts:153` |
| `messaging.messaging_providers` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findProviderById | `src/modules/messaging/repositories/notifications.repository.ts:437` |
| `messaging.notification_deliveries` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.createDelivery | `src/modules/messaging/repositories/notifications.repository.ts:514` |
| `messaging.notification_deliveries` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.countDeliveries | `src/modules/messaging/repositories/notifications.repository.ts:562` |
| `messaging.notification_requests` | ESCRIBE | CREA | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.createNotificationRequest | `src/modules/messaging/repositories/notifications.repository.ts:270` |
| `messaging.notification_requests` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification | `src/modules/messaging/services/notifications.service.ts:482` |
| `messaging.notification_requests` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsRepository.findLiveRequestByDebounceKey | `src/modules/messaging/repositories/notifications.repository.ts:388` |
| `messaging.provider_channel_configs` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.deliverNotification → NotificationsRepository.findChannelConfigs | `src/modules/messaging/repositories/notifications.repository.ts:405` |
| `messaging.recipient_preferences` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.avisar → MessagingAffiliationNoticeAdapter.emit → MessagingAffiliationNoticeAdapter.emitir → NotificationsService.createRequest → NotificationsService.evaluateSuppression → NotificationsRepository.findPreferences | `src/modules/messaging/repositories/notifications.repository.ts:212` |
| `practice.practice_sites` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir | `src/modules/profiles/services/profiles-affiliations.service.ts:478` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → ProfilesAffiliationsService.concederMembresia → PersonAccountLinksRepository.findActiveByPerson | `src/modules/profiles/repositories/person-account-links.repository.ts:101` |
| `profiles.practitioner_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir | `src/modules/profiles/services/profiles-affiliations.service.ts:499` |
| `profiles.practitioner_affiliations` | LEE | LEE | DIRECTA | TenantPractitionerRequestsController.revoke → ProfilesAffiliationsService.revocar → ProfilesAffiliationsService.decidir → PractitionerAffiliationsRepository.findById | `src/modules/profiles/repositories/practitioner-affiliations.repository.ts:166` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `tenantId` | path | Sí | `string` | — |
| `affiliationId` | path | Sí | `string` | — |

### Cuerpo — DTO `RejectAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud mínima 1; longitud máxima 500 | `@IsOptional()` `@IsString()` `@MinLength(1)` `@MaxLength(MAX_REJECT_REASON_LENGTH)` | — | `src/modules/profiles/dto/affiliation-request.dto.ts:97` |

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

