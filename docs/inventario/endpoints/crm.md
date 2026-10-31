<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `crm`

- **Bloque:** Marketing y Crecimiento (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)
- **Operaciones:** 16 (16 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 14 · BAJO 2
- **Tablas distintas que tocan:** 17
- **Respuestas de error y detalle contractual:** `openapi/endpoints/crm.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/crm/accounts` | Crear una cuenta con su contacto principal | MEDIO | 3 | CRM_ADMIN, CRM_AGENT |
| 2 | GET | `/crm/accounts/{id}/360` | Vista 360 de la cuenta | BAJO | 3 | CRM_ADMIN, CRM_AGENT |
| 3 | POST | `/crm/accounts/{id}/team-members` | Sumar un usuario al equipo de la cuenta | MEDIO | 3 | CRM_ADMIN |
| 4 | POST | `/crm/activities` | Registrar una actividad y su subtipo | MEDIO | 7 | CRM_ADMIN, CRM_AGENT |
| 5 | POST | `/crm/cases` | Abrir un caso de servicio | MEDIO | 5 | CRM_ADMIN, CRM_AGENT |
| 6 | POST | `/crm/cases/{id}/comments` | Comentar el caso | MEDIO | 2 | CRM_ADMIN, CRM_AGENT |
| 7 | POST | `/crm/cases/{id}/resolve` | Resolver el caso | MEDIO | 2 | CRM_ADMIN, CRM_AGENT |
| 8 | PATCH | `/crm/cases/{id}/status` | Transicionar el estado del caso | MEDIO | 2 | CRM_ADMIN, CRM_AGENT |
| 9 | PATCH | `/crm/contacts/{id}/channels/{cid}/opt-in` | Registrar el consentimiento del canal de contacto | MEDIO | 3 | CRM_ADMIN, CRM_AGENT |
| 10 | POST | `/crm/leads` | Capturar un lead | MEDIO | 1 | CRM_ADMIN, CRM_AGENT |
| 11 | POST | `/crm/leads/{id}/convert` | Convertir el lead en oportunidad | MEDIO | 6 | CRM_ADMIN, CRM_AGENT |
| 12 | PATCH | `/crm/leads/{id}/qualify` | Calificar o descartar el lead | BAJO | 1 | CRM_ADMIN, CRM_AGENT |
| 13 | POST | `/crm/opportunities/{id}/advance-stage` | Avanzar la oportunidad de etapa | MEDIO | 4 | CRM_ADMIN, CRM_AGENT |
| 14 | POST | `/crm/opportunities/{id}/lose` | Marcar la oportunidad como perdida con su motivo | MEDIO | 2 | CRM_ADMIN, CRM_AGENT |
| 15 | POST | `/crm/opportunities/{id}/win` | Marcar la oportunidad como ganada | MEDIO | 2 | CRM_ADMIN, CRM_AGENT |
| 16 | POST | `/crm/partnerships` | Registrar una alianza y su acuerdo marco | MEDIO | 2 | CRM_ADMIN |

---

## 1. POST /crm/accounts

- **Origen:** CONTRATO
- **Nombre:** Crear una cuenta con su contacto principal
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.createAccount` — `src/modules/crm/controllers/crm.controller.ts:64`

### Qué es y para qué sirve (negocio)

Crear una cuenta con su contacto principal. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/accounts` la atiende `CrmController.createAccount` (src/modules/crm/controllers/crm.controller.ts:64). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `CrmCreateAccountDto` (8 campos, 3 obligatorios). Delega en `CrmSalesService.createAccount`. Crea filas en crm.account_team_members, crm.contacts, crm.crm_accounts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.account_team_members` | ESCRIBE | CREA | DIRECTA | CrmController.createAccount → CrmSalesService.createAccount → CrmSalesRepository.createTeamMember | `src/modules/crm/repositories/crm-sales.repository.ts:242` |
| `crm.contacts` | ESCRIBE | CREA | DIRECTA | CrmController.createAccount → CrmSalesService.createAccount → CrmSalesRepository.createContact | `src/modules/crm/repositories/crm-sales.repository.ts:310` |
| `crm.crm_accounts` | ESCRIBE | CREA | DIRECTA | CrmController.createAccount → CrmSalesService.createAccount → CrmSalesRepository.createAccount | `src/modules/crm/repositories/crm-sales.repository.ts:198` |

### Cuerpo — DTO `CrmCreateAccountDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:32` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/crm/dto/crm.dto.ts:40` |
| `accountType` | `string` | Sí | valores: CUSTOMER, PROSPECT, PARTNER | `@IsIn(ACCOUNT_TYPES as readonly string[])` | — | `src/modules/crm/dto/crm.dto.ts:47` |
| `website` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/crm/dto/crm.dto.ts:56` |
| `taxId` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | Identificación fiscal | `src/modules/crm/dto/crm.dto.ts:65` |
| `parentAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta matriz | `src/modules/crm/dto/crm.dto.ts:73` |
| `primaryContactFirstName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Contacto principal a crear junto con la cuenta | `src/modules/crm/dto/crm.dto.ts:84` |
| `primaryContactLastName` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | — | `src/modules/crm/dto/crm.dto.ts:93` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "accountType": "CUSTOMER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "accountType": "CUSTOMER",
  "website": "valor-ejemplo",
  "taxId": "00000000-0000-4000-8000-000000000001",
  "parentAccountId": "00000000-0000-4000-8000-000000000001",
  "primaryContactFirstName": "Nombre de ejemplo",
  "primaryContactLastName": "Nombre de ejemplo"
}
```

</details>

### Respuesta — `Promise<AccountResponseDto>` · DTO `AccountResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:104` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:110` |
| `primaryContactId` | `string` | No | formato uuid | — | Contacto creado junto con la cuenta | `src/modules/crm/dto/crm.dto.ts:119` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/crm/dto/crm.dto.ts:125` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:53` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. GET /crm/accounts/{id}/360

- **Origen:** CONTRATO
- **Nombre:** Vista 360 de la cuenta
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.getAccount360` — `src/modules/crm/controllers/crm.controller.ts:99`

### Qué es y para qué sirve (negocio)

Vista 360 de la cuenta. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`GET /crm/accounts/{id}/360` la atiende `CrmController.getAccount360` (src/modules/crm/controllers/crm.controller.ts:99). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Delega en `CrmServiceService.getAccount360`. Lee crm.crm_accounts, crm.crm_activities, crm.crm_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:99` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:99` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.crm_accounts` | LEE | LEE | DIRECTA | CrmController.getAccount360 → CrmServiceService.getAccount360 → CrmSalesRepository.findAccountById | `src/modules/crm/repositories/crm-sales.repository.ts:228` |
| `crm.crm_activities` | LEE | LEE | DIRECTA | CrmController.getAccount360 → CrmServiceService.getAccount360 → CrmServiceRepository.findActivitiesByAccount | `src/modules/crm/repositories/crm-service.repository.ts:556` |
| `crm.crm_cases` | LEE | LEE | DIRECTA | CrmController.getAccount360 → CrmServiceService.getAccount360 → CrmServiceRepository.findCasesByAccount | `src/modules/crm/repositories/crm-service.repository.ts:577` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<Account360ResponseDto>` · DTO `Account360ResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `accountId` | `string` | Sí | formato uuid | — | Identificador asociado a account. | `src/modules/crm/dto/crm.dto.ts:803` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:809` |
| `activityCount` | `number` | Sí | — | — | Actividades recientes | `src/modules/crm/dto/crm.dto.ts:815` |
| `caseCount` | `number` | Sí | — | — | Casos abiertos y recientes | `src/modules/crm/dto/crm.dto.ts:821` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:149` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 3. POST /crm/accounts/{id}/team-members

- **Origen:** CONTRATO
- **Nombre:** Sumar un usuario al equipo de la cuenta
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.addTeamMember` — `src/modules/crm/controllers/crm.controller.ts:81`

### Qué es y para qué sirve (negocio)

Sumar un usuario al equipo de la cuenta. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/accounts/{id}/team-members` la atiende `CrmController.addTeamMember` (src/modules/crm/controllers/crm.controller.ts:81). Exige sesión con alguno de los roles CRM_ADMIN. Valida el cuerpo como `AddTeamMemberDto` (3 campos, 2 obligatorios). Delega en `CrmSalesService.addTeamMember`. Crea filas en crm.account_team_members. Lee crm.account_team_members, crm.crm_accounts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN | `src/modules/crm/controllers/crm.controller.ts:81` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:81` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.account_team_members` | ESCRIBE | CREA | DIRECTA | CrmController.addTeamMember → CrmSalesService.addTeamMember → CrmSalesRepository.createTeamMember | `src/modules/crm/repositories/crm-sales.repository.ts:242` |
| `crm.account_team_members` | LEE | LEE | DIRECTA | CrmController.addTeamMember → CrmSalesService.addTeamMember → CrmSalesRepository.findTeamMember | `src/modules/crm/repositories/crm-sales.repository.ts:263` |
| `crm.crm_accounts` | LEE | LEE | DIRECTA | CrmController.addTeamMember → CrmSalesService.addTeamMember → CrmSalesRepository.findAccountById | `src/modules/crm/repositories/crm-sales.repository.ts:228` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AddTeamMemberDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `userId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:135` |
| `teamRole` | `string` | Sí | valores: OWNER, MEMBER | `@IsIn(['OWNER', 'MEMBER'])` | Rol en el equipo de cuenta | `src/modules/crm/dto/crm.dto.ts:145` |
| `accessLevel` | `string` | No | valores: READ, WRITE | `@IsOptional()` `@IsIn(['READ', 'WRITE'])` | Nivel de acceso | `src/modules/crm/dto/crm.dto.ts:156` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "teamRole": "OWNER"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "userId": "00000000-0000-4000-8000-000000000001",
  "teamRole": "OWNER",
  "accessLevel": "READ"
}
```

</details>

### Respuesta — `Promise<TeamMemberResponseDto>` · DTO `TeamMemberResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:167` |
| `procedureCaseId` | `string` | Sí | formato uuid | — | Identificador asociado a procedure case. | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | sin fuente |
| `teamSize` | `number` | Sí | — | — | Miembros del equipo tras la asignación | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El usuario ya pertenece al equipo de la cuenta |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:63` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 4. POST /crm/activities

- **Origen:** CONTRATO
- **Nombre:** Registrar una actividad y su subtipo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.createActivity` — `src/modules/crm/controllers/crm.controller.ts:167`

### Qué es y para qué sirve (negocio)

Registrar una actividad y su subtipo. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/activities` la atiende `CrmController.createActivity` (src/modules/crm/controllers/crm.controller.ts:167). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `CreateActivityDto` (10 campos, 5 obligatorios). Delega en `CrmServiceService.createActivity`. Crea filas en crm.crm_activities, crm.crm_notes, crm.crm_tasks. Lee crm.contacts, crm.crm_accounts, crm.crm_cases, crm.opportunities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:167` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.contacts` | LEE | LEE | DIRECTA | CrmController.createActivity → CrmServiceService.createActivity → CrmServiceService.assertActivityReferences → CrmSalesRepository.findContactById | `src/modules/crm/repositories/crm-sales.repository.ts:340` |
| `crm.crm_accounts` | LEE | LEE | DIRECTA | CrmController.createActivity → CrmServiceService.createActivity → CrmServiceService.assertActivityReferences → CrmSalesRepository.findAccountById | `src/modules/crm/repositories/crm-sales.repository.ts:228` |
| `crm.crm_activities` | ESCRIBE | CREA | DIRECTA | CrmController.createActivity → CrmServiceService.createActivity → CrmServiceRepository.createActivity | `src/modules/crm/repositories/crm-service.repository.ts:143` |
| `crm.crm_cases` | LEE | LEE | DIRECTA | CrmController.createActivity → CrmServiceService.createActivity → CrmServiceService.assertActivityReferences → CrmServiceRepository.findCaseById | `src/modules/crm/repositories/crm-service.repository.ts:455` |
| `crm.crm_notes` | ESCRIBE | CREA | DIRECTA | CrmController.createActivity → CrmServiceService.createActivity → CrmServiceRepository.createNote | `src/modules/crm/repositories/crm-service.repository.ts:246` |
| `crm.crm_tasks` | ESCRIBE | CREA | DIRECTA | CrmController.createActivity → CrmServiceService.createActivity → CrmServiceRepository.createTask | `src/modules/crm/repositories/crm-service.repository.ts:209` |
| `crm.opportunities` | LEE | LEE | DIRECTA | CrmController.createActivity → CrmServiceService.createActivity → CrmServiceService.assertActivityReferences → CrmSalesRepository.findOpportunityById | `src/modules/crm/repositories/crm-sales.repository.ts:471` |

### Cuerpo — DTO `CreateActivityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:378` |
| `activityType` | `string` | Sí | valores: TASK, EVENT, EMAIL, CALL, NOTE | `@IsIn(ACTIVITY_TYPES as readonly string[])` | — | `src/modules/crm/dto/crm.dto.ts:385` |
| `subjectType` | `string` | Sí | valores: ACCOUNT, OPPORTUNITY, CASE | `@IsIn(['ACCOUNT', 'OPPORTUNITY', 'CASE'])` | Tipo del sujeto | `src/modules/crm/dto/crm.dto.ts:395` |
| `subjectRefId` | `string` | Sí | formato uuid | `@IsUUID()` | Id del sujeto | `src/modules/crm/dto/crm.dto.ts:402` |
| `direction` | `string` | Sí | valores: INBOUND, OUTBOUND | `@IsIn(['INBOUND', 'OUTBOUND'])` | — | `src/modules/crm/dto/crm.dto.ts:409` |
| `subject` | `string` | No | longitud máxima 300 | `@IsOptional()` `@IsString()` `@MaxLength(300)` | — | `src/modules/crm/dto/crm.dto.ts:418` |
| `bodyText` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | Cuerpo o detalle de la actividad | `src/modules/crm/dto/crm.dto.ts:427` |
| `dueAt` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/crm/dto/crm.dto.ts:435` |
| `crmAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta relacionada | `src/modules/crm/dto/crm.dto.ts:443` |
| `contactId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Contacto relacionado | `src/modules/crm/dto/crm.dto.ts:451` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "activityType": "TASK",
  "subjectType": "ACCOUNT",
  "subjectRefId": "00000000-0000-4000-8000-000000000001",
  "direction": "INBOUND"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "activityType": "TASK",
  "subjectType": "ACCOUNT",
  "subjectRefId": "00000000-0000-4000-8000-000000000001",
  "direction": "INBOUND",
  "subject": "valor-ejemplo",
  "bodyText": "valor-ejemplo",
  "dueAt": "2026-07-31T12:00:00.000Z",
  "crmAccountId": "00000000-0000-4000-8000-000000000001",
  "contactId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ActivityResponseDto>` · DTO `ActivityResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:462` |
| `activityType` | `string` | Sí | valores: APPOINTMENT, PROCEDURE, FOLLOW_UP, TELEHEALTH, OTHER | — | Valor de activity type mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:468` |
| `subtypeCreated` | `boolean` | Sí | — | — | true si además se creó la fila del subtipo (tarea o nota) | `src/modules/crm/dto/crm.dto.ts:476` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Una nota requiere `bodyText` |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:93` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 5. POST /crm/cases

- **Origen:** CONTRATO
- **Nombre:** Abrir un caso de servicio
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.createCase` — `src/modules/crm/controllers/crm.controller.ts:257`

### Qué es y para qué sirve (negocio)

Abrir un caso de servicio. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/cases` la atiende `CrmController.createCase` (src/modules/crm/controllers/crm.controller.ts:257). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `CreateCaseDto` (8 campos, 3 obligatorios). Delega en `CrmServiceService.createCase`. Crea filas en crm.crm_case_status_history, crm.crm_cases. Lee crm.contacts, crm.crm_accounts, crm.crm_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:257` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.contacts` | LEE | LEE | DIRECTA | CrmController.createCase → CrmServiceService.createCase → CrmSalesRepository.findContactById | `src/modules/crm/repositories/crm-sales.repository.ts:340` |
| `crm.crm_accounts` | LEE | LEE | DIRECTA | CrmController.createCase → CrmServiceService.createCase → CrmSalesRepository.findAccountById | `src/modules/crm/repositories/crm-sales.repository.ts:228` |
| `crm.crm_case_status_history` | ESCRIBE | CREA | DIRECTA | CrmController.createCase → CrmServiceService.createCase → CrmServiceRepository.recordCaseStatusChange | `src/modules/crm/repositories/crm-service.repository.ts:534` |
| `crm.crm_cases` | ESCRIBE | CREA | DIRECTA | CrmController.createCase → CrmServiceService.createCase → CrmServiceRepository.createCase | `src/modules/crm/repositories/crm-service.repository.ts:402` |
| `crm.crm_cases` | LEE | LEE | DIRECTA | CrmController.createCase → CrmServiceService.createCase → CrmServiceRepository.findCaseByNumber | `src/modules/crm/repositories/crm-service.repository.ts:464` |

### Cuerpo — DTO `CreateCaseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:616` |
| `caseNumber` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Número de caso, único por tenant | `src/modules/crm/dto/crm.dto.ts:627` |
| `subject` | `string` | Sí | longitud máxima 300 | `@IsString()` `@MaxLength(300)` | — | `src/modules/crm/dto/crm.dto.ts:635` |
| `description` | `string` | No | longitud máxima 4000 | `@IsOptional()` `@IsString()` `@MaxLength(4000)` | — | `src/modules/crm/dto/crm.dto.ts:644` |
| `crmAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:652` |
| `primaryContactId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:660` |
| `priority` | `string` | No | valores: LOW, MEDIUM, HIGH | `@IsOptional()` `@IsIn(['LOW', 'MEDIUM', 'HIGH'])` | — | `src/modules/crm/dto/crm.dto.ts:668` |
| `origin` | `string` | No | valores: PORTAL, PHONE, EMAIL | `@IsOptional()` `@IsIn(['PORTAL', 'PHONE', 'EMAIL'])` | — | `src/modules/crm/dto/crm.dto.ts:676` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "caseNumber": "valor-ejemplo",
  "subject": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "caseNumber": "valor-ejemplo",
  "subject": "valor-ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "crmAccountId": "00000000-0000-4000-8000-000000000001",
  "primaryContactId": "00000000-0000-4000-8000-000000000001",
  "priority": "MEDIUM",
  "origin": "PORTAL"
}
```

</details>

### Respuesta — `Promise<CaseResponseDto>` · DTO `CaseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:687` |
| `caseNumber` | `string` | Sí | — | — | Número del caso | `src/modules/crm/dto/crm.dto.ts:693` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/crm/dto/crm.dto.ts:699` |
| `operatingRoomId` | `string` | Sí | formato uuid | — | Quirófano reservado | sin fuente |
| `milestoneId` | `string` | Sí | formato uuid | — | Hito de programación creado | sin fuente |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe un caso con ese número |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:159` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 6. POST /crm/cases/{id}/comments

- **Origen:** CONTRATO
- **Nombre:** Comentar el caso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.addCaseComment` — `src/modules/crm/controllers/crm.controller.ts:274`

### Qué es y para qué sirve (negocio)

Comentar el caso. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/cases/{id}/comments` la atiende `CrmController.addCaseComment` (src/modules/crm/controllers/crm.controller.ts:274). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `AddCaseCommentDto` (2 campos, 1 obligatorio). Delega en `CrmServiceService.addCaseComment`. Crea filas en crm.crm_case_comments. Lee crm.crm_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:274` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:274` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.crm_case_comments` | ESCRIBE | CREA | DIRECTA | CrmController.addCaseComment → CrmServiceService.addCaseComment → CrmServiceRepository.createCaseComment | `src/modules/crm/repositories/crm-service.repository.ts:495` |
| `crm.crm_cases` | LEE | LEE | DIRECTA | CrmController.addCaseComment → CrmServiceService.addCaseComment → CrmServiceRepository.findCaseByIdForUpdate | `src/modules/crm/repositories/crm-service.repository.ts:435` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AddCaseCommentDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `commentText` | `string` | Sí | longitud máxima 4000 | `@IsString()` `@MaxLength(4000)` | — | `src/modules/crm/dto/crm.dto.ts:710` |
| `isPublic` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | false para notas internas | `src/modules/crm/dto/crm.dto.ts:721` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "commentText": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "commentText": "valor-ejemplo",
  "isPublic": true
}
```

</details>

### Respuesta — `Promise<{ /** * Identificador único de la instancia. */ id: string; /** * Identificador asociado a case. */ caseId: string; }>` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: No se comenta un caso cerrado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 7. POST /crm/cases/{id}/resolve

- **Origen:** CONTRATO
- **Nombre:** Resolver el caso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.resolveCase` — `src/modules/crm/controllers/crm.controller.ts:318`

### Qué es y para qué sirve (negocio)

Resolver el caso. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/cases/{id}/resolve` la atiende `CrmController.resolveCase` (src/modules/crm/controllers/crm.controller.ts:318). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Delega en `CrmServiceService.changeCaseStatus`. Crea filas en crm.crm_case_status_history. Lee crm.crm_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:318` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:318` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.crm_case_status_history` | ESCRIBE | CREA | DIRECTA | CrmController.resolveCase → CrmServiceService.changeCaseStatus → CrmServiceRepository.recordCaseStatusChange | `src/modules/crm/repositories/crm-service.repository.ts:534` |
| `crm.crm_cases` | LEE | LEE | DIRECTA | CrmController.resolveCase → CrmServiceService.changeCaseStatus → CrmServiceRepository.findCaseByIdForUpdate | `src/modules/crm/repositories/crm-service.repository.ts:435` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CaseStatusResponseDto>` · DTO `CaseStatusResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/crm/dto/crm.dto.ts:751` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/crm/dto/crm.dto.ts:757` |
| `closedAt` | `string` | No | formato date-time | — | Valor de closed at mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:763` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Un caso cerrado no se reabre por esta vía |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso ya está en ese estado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:121` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 8. PATCH /crm/cases/{id}/status

- **Origen:** CONTRATO
- **Nombre:** Transicionar el estado del caso
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.changeCaseStatus` — `src/modules/crm/controllers/crm.controller.ts:300`

### Qué es y para qué sirve (negocio)

Transicionar el estado del caso. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /crm/cases/{id}/status` la atiende `CrmController.changeCaseStatus` (src/modules/crm/controllers/crm.controller.ts:300). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `ChangeCaseStatusDto` (2 campos, 1 obligatorio). Delega en `CrmServiceService.changeCaseStatus`. Crea filas en crm.crm_case_status_history. Lee crm.crm_cases.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:300` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:300` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.crm_case_status_history` | ESCRIBE | CREA | DIRECTA | CrmController.changeCaseStatus → CrmServiceService.changeCaseStatus → CrmServiceRepository.recordCaseStatusChange | `src/modules/crm/repositories/crm-service.repository.ts:534` |
| `crm.crm_cases` | LEE | LEE | DIRECTA | CrmController.changeCaseStatus → CrmServiceService.changeCaseStatus → CrmServiceRepository.findCaseByIdForUpdate | `src/modules/crm/repositories/crm-service.repository.ts:435` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ChangeCaseStatusDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `status` | `string` | Sí | valores: OPEN, IN_PROGRESS, RESOLVED, CLOSED | `@IsIn(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])` | — | `src/modules/crm/dto/crm.dto.ts:731` |
| `reasonText` | `string` | No | longitud máxima 500 | `@IsOptional()` `@IsString()` `@MaxLength(500)` | Motivo de la transición | `src/modules/crm/dto/crm.dto.ts:740` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "status": "OPEN"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "status": "OPEN",
  "reasonText": "Texto descriptivo de ejemplo"
}
```

</details>

### Respuesta — `Promise<CaseStatusResponseDto>` · DTO `CaseStatusResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `caseId` | `string` | Sí | formato uuid | — | Identificador asociado a case. | `src/modules/crm/dto/crm.dto.ts:751` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/crm/dto/crm.dto.ts:757` |
| `closedAt` | `string` | No | formato date-time | — | Valor de closed at mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:763` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Un caso cerrado no se reabre por esta vía |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El caso ya está en ese estado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 9. PATCH /crm/contacts/{id}/channels/{cid}/opt-in

- **Origen:** CONTRATO
- **Nombre:** Registrar el consentimiento del canal de contacto
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.setChannelOptIn` — `src/modules/crm/controllers/crm.controller.ts:339`

### Qué es y para qué sirve (negocio)

Registrar el consentimiento del canal de contacto. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /crm/contacts/{id}/channels/{cid}/opt-in` la atiende `CrmController.setChannelOptIn` (src/modules/crm/controllers/crm.controller.ts:339). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `ChannelOptInDto` (1 campo, 1 obligatorio). Delega en `CrmServiceService.setChannelOptIn`. Actualiza crm.contact_channel_endpoints. Lee crm.contact_channel_endpoints, crm.contacts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:339` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, cid | `src/modules/crm/controllers/crm.controller.ts:339` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.contact_channel_endpoints` | ESCRIBE | ACTUALIZA | POR_TIPO | CrmController.setChannelOptIn → CrmServiceService.setChannelOptIn | `src/modules/crm/services/crm-service.service.ts:599` |
| `crm.contact_channel_endpoints` | LEE | LEE | DIRECTA | CrmController.setChannelOptIn → CrmServiceService.setChannelOptIn → CrmSalesRepository.findChannelEndpointForUpdate | `src/modules/crm/repositories/crm-sales.repository.ts:354` |
| `crm.contacts` | LEE | LEE | DIRECTA | CrmController.setChannelOptIn → CrmServiceService.setChannelOptIn → CrmSalesRepository.findContactById | `src/modules/crm/repositories/crm-sales.repository.ts:340` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `cid` | path | Sí | `string` | — |

### Cuerpo — DTO `ChannelOptInDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `optIn` | `boolean` | Sí | — | `@IsBoolean()` | true concede el consentimiento; false lo revoca | `src/modules/crm/dto/crm.dto.ts:775` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "optIn": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "optIn": true
}
```

</details>

### Respuesta — `Promise<ChannelOptInResponseDto>` · DTO `ChannelOptInResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `endpointId` | `string` | Sí | formato uuid | — | Identificador asociado a endpoint. | `src/modules/crm/dto/crm.dto.ts:786` |
| `doNotContact` | `boolean` | Sí | — | — | true cuando el canal quedó excluido de comunicaciones | `src/modules/crm/dto/crm.dto.ts:794` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El canal no pertenece a ese contacto |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:135` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 10. POST /crm/leads

- **Origen:** CONTRATO
- **Nombre:** Capturar un lead
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.createLead` — `src/modules/crm/controllers/crm.controller.ts:114`

### Qué es y para qué sirve (negocio)

Capturar un lead. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/leads` la atiende `CrmController.createLead` (src/modules/crm/controllers/crm.controller.ts:114). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `CreateLeadDto` (6 campos, 2 obligatorios). Delega en `CrmSalesService.createLead`. Crea filas en crm.leads.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:114` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.leads` | ESCRIBE | CREA | DIRECTA | CrmController.createLead → CrmSalesService.createLead → CrmSalesRepository.createLead | `src/modules/crm/repositories/crm-sales.repository.ts:369` |

### Cuerpo — DTO `CreateLeadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:192` |
| `source` | `string` | Sí | valores: WEB, REFERRAL, CAMPAIGN | `@IsIn(['WEB', 'REFERRAL', 'CAMPAIGN'])` | — | `src/modules/crm/dto/crm.dto.ts:199` |
| `fullName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/crm/dto/crm.dto.ts:208` |
| `email` | `string` | No | longitud máxima 320 | `@IsOptional()` `@IsString()` `@MaxLength(320)` | — | `src/modules/crm/dto/crm.dto.ts:217` |
| `phone` | `string` | No | longitud máxima 50 | `@IsOptional()` `@IsString()` `@MaxLength(50)` | — | `src/modules/crm/dto/crm.dto.ts:226` |
| `interestText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Interés declarado | `src/modules/crm/dto/crm.dto.ts:235` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "source": "WEB"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "source": "WEB",
  "fullName": "Nombre de ejemplo",
  "email": "usuario@example.com",
  "phone": "+59170000000",
  "interestText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<LeadResponseDto>` · DTO `LeadResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:271` |
| `leadStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a lead status concept. | `src/modules/crm/dto/crm.dto.ts:277` |
| `leadScore` | `number` | No | — | — | Valor de lead score mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:283` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 11. POST /crm/leads/{id}/convert

- **Origen:** CONTRATO
- **Nombre:** Convertir el lead en oportunidad
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.convertLead` — `src/modules/crm/controllers/crm.controller.ts:149`

### Qué es y para qué sirve (negocio)

Convertir el lead en oportunidad. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/leads/{id}/convert` la atiende `CrmController.convertLead` (src/modules/crm/controllers/crm.controller.ts:149). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `ConvertLeadDto` (6 campos, 3 obligatorios). Delega en `CrmSalesService.convertLead`. Crea filas en crm.opportunities, crm.opportunity_stage_history. Lee crm.crm_accounts, crm.leads, crm.pipeline_stages, crm.pipelines.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:149` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:149` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.crm_accounts` | LEE | LEE | DIRECTA | CrmController.convertLead → CrmSalesService.convertLead → CrmSalesRepository.findAccountById | `src/modules/crm/repositories/crm-sales.repository.ts:228` |
| `crm.leads` | LEE | LEE | DIRECTA | CrmController.convertLead → CrmSalesService.convertLead → CrmSalesRepository.findLeadByIdForUpdate | `src/modules/crm/repositories/crm-sales.repository.ts:401` |
| `crm.opportunities` | ESCRIBE | CREA | DIRECTA | CrmController.convertLead → CrmSalesService.convertLead → CrmSalesRepository.createOpportunity | `src/modules/crm/repositories/crm-sales.repository.ts:419` |
| `crm.opportunity_stage_history` | ESCRIBE | CREA | DIRECTA | CrmController.convertLead → CrmSalesService.convertLead → CrmSalesRepository.recordStageChange | `src/modules/crm/repositories/crm-sales.repository.ts:550` |
| `crm.pipeline_stages` | LEE | LEE | DIRECTA | CrmController.convertLead → CrmSalesService.convertLead → CrmSalesRepository.findStageById | `src/modules/crm/repositories/crm-sales.repository.ts:507` |
| `crm.pipelines` | LEE | LEE | DIRECTA | CrmController.convertLead → CrmSalesService.convertLead → CrmSalesRepository.findPipelineById | `src/modules/crm/repositories/crm-sales.repository.ts:487` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ConvertLeadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `pipelineId` | `string` | Sí | formato uuid | `@IsUUID()` | Pipeline en el que nace la oportunidad | `src/modules/crm/dto/crm.dto.ts:296` |
| `stageId` | `string` | Sí | formato uuid | `@IsUUID()` | Etapa inicial | `src/modules/crm/dto/crm.dto.ts:303` |
| `opportunityName` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | Nombre de la oportunidad | `src/modules/crm/dto/crm.dto.ts:311` |
| `crmAccountId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Cuenta a la que se asocia | `src/modules/crm/dto/crm.dto.ts:322` |
| `amount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | — | `src/modules/crm/dto/crm.dto.ts:330` |
| `expectedCloseDate` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/crm/dto/crm.dto.ts:338` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "pipelineId": "00000000-0000-4000-8000-000000000001",
  "stageId": "00000000-0000-4000-8000-000000000001",
  "opportunityName": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "pipelineId": "00000000-0000-4000-8000-000000000001",
  "stageId": "00000000-0000-4000-8000-000000000001",
  "opportunityName": "Nombre de ejemplo",
  "crmAccountId": "00000000-0000-4000-8000-000000000001",
  "amount": "15000.00",
  "expectedCloseDate": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<ConvertLeadResponseDto>` · DTO `ConvertLeadResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `leadId` | `string` | Sí | formato uuid | — | Identificador asociado a lead. | `src/modules/crm/dto/crm.dto.ts:349` |
| `opportunityId` | `string` | Sí | formato uuid | — | Identificador asociado a opportunity. | `src/modules/crm/dto/crm.dto.ts:355` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El lead ya fue convertido |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Solo se convierte un lead calificado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:83` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 12. PATCH /crm/leads/{id}/qualify

- **Origen:** CONTRATO
- **Nombre:** Calificar o descartar el lead
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.qualifyLead` — `src/modules/crm/controllers/crm.controller.ts:131`

### Qué es y para qué sirve (negocio)

Calificar o descartar el lead. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`PATCH /crm/leads/{id}/qualify` la atiende `CrmController.qualifyLead` (src/modules/crm/controllers/crm.controller.ts:131). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `QualifyLeadDto` (2 campos, 2 obligatorios). Delega en `CrmSalesService.qualifyLead`. Lee crm.leads.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:131` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:131` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.leads` | LEE | LEE | DIRECTA | CrmController.qualifyLead → CrmSalesService.qualifyLead → CrmSalesRepository.findLeadByIdForUpdate | `src/modules/crm/repositories/crm-sales.repository.ts:401` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `QualifyLeadDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `leadScore` | `number` | Sí | mínimo 0; máximo 100 | `@IsInt()` `@Min(0)` `@Max(100)` | Puntuación del lead (0-100) | `src/modules/crm/dto/crm.dto.ts:251` |
| `qualified` | `boolean` | Sí | — | `@IsBoolean()` | true si el lead queda calificado; false lo descarta | `src/modules/crm/dto/crm.dto.ts:260` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "leadScore": 1,
  "qualified": true
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "leadScore": 1,
  "qualified": true
}
```

</details>

### Respuesta — `Promise<LeadResponseDto>` · DTO `LeadResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:271` |
| `leadStatusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a lead status concept. | `src/modules/crm/dto/crm.dto.ts:277` |
| `leadScore` | `number` | No | — | — | Valor de lead score mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:283` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El lead ya fue convertido |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:73` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 13. POST /crm/opportunities/{id}/advance-stage

- **Origen:** CONTRATO
- **Nombre:** Avanzar la oportunidad de etapa
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.advanceStage` — `src/modules/crm/controllers/crm.controller.ts:187`

### Qué es y para qué sirve (negocio)

Avanzar la oportunidad de etapa. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/opportunities/{id}/advance-stage` la atiende `CrmController.advanceStage` (src/modules/crm/controllers/crm.controller.ts:187). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `AdvanceStageDto` (1 campo, 1 obligatorio). Delega en `CrmSalesService.advanceStage`. Crea filas en crm.opportunity_stage_history. Lee crm.opportunities, crm.pipeline_stages, crm.pipelines.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:187` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:187` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.opportunities` | LEE | LEE | DIRECTA | CrmController.advanceStage → CrmSalesService.advanceStage → CrmSalesRepository.findOpportunityByIdForUpdate | `src/modules/crm/repositories/crm-sales.repository.ts:451` |
| `crm.opportunity_stage_history` | ESCRIBE | CREA | DIRECTA | CrmController.advanceStage → CrmSalesService.advanceStage → CrmSalesRepository.recordStageChange | `src/modules/crm/repositories/crm-sales.repository.ts:550` |
| `crm.pipeline_stages` | LEE | LEE | DIRECTA | CrmController.advanceStage → CrmSalesService.advanceStage → CrmSalesRepository.findStageById | `src/modules/crm/repositories/crm-sales.repository.ts:507` |
| `crm.pipelines` | LEE | LEE | DIRECTA | CrmController.advanceStage → CrmSalesService.advanceStage → CrmSalesRepository.findStageById | `src/modules/crm/repositories/crm-sales.repository.ts:509` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `AdvanceStageDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `toStageId` | `string` | Sí | formato uuid | `@IsUUID()` | Etapa destino | `src/modules/crm/dto/crm.dto.ts:486` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "toStageId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "toStageId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<OpportunityResponseDto>` · DTO `OpportunityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:510` |
| `stageId` | `string` | Sí | formato uuid | — | Identificador asociado a stage. | `src/modules/crm/dto/crm.dto.ts:516` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/crm/dto/crm.dto.ts:522` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La oportunidad ya está cerrada; PreconditionFailedException: La oportunidad ya está en esa etapa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:104` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 14. POST /crm/opportunities/{id}/lose

- **Origen:** CONTRATO
- **Nombre:** Marcar la oportunidad como perdida con su motivo
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.loseOpportunity` — `src/modules/crm/controllers/crm.controller.ts:222`

### Qué es y para qué sirve (negocio)

Marcar la oportunidad como perdida con su motivo. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/opportunities/{id}/lose` la atiende `CrmController.loseOpportunity` (src/modules/crm/controllers/crm.controller.ts:222). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Valida el cuerpo como `LoseOpportunityDto` (1 campo, 1 obligatorio). Delega en `CrmSalesService.loseOpportunity`. Crea filas en crm.opportunity_stage_history. Lee crm.opportunities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:222` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:222` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.opportunities` | LEE | LEE | DIRECTA | CrmController.loseOpportunity → CrmSalesService.loseOpportunity → CrmSalesService.closeOpportunity → CrmSalesRepository.findOpportunityByIdForUpdate | `src/modules/crm/repositories/crm-sales.repository.ts:451` |
| `crm.opportunity_stage_history` | ESCRIBE | CREA | DIRECTA | CrmController.loseOpportunity → CrmSalesService.loseOpportunity → CrmSalesService.closeOpportunity → CrmSalesRepository.recordStageChange | `src/modules/crm/repositories/crm-sales.repository.ts:550` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `LoseOpportunityDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | Sí | valores: PRICE, COMPETITOR, NO_BUDGET | `@IsIn(['PRICE', 'COMPETITOR', 'NO_BUDGET'])` | Motivo de la pérdida | `src/modules/crm/dto/crm.dto.ts:499` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "reason": "PRICE"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "reason": "PRICE"
}
```

</details>

### Respuesta — `Promise<OpportunityResponseDto>` · DTO `OpportunityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:510` |
| `stageId` | `string` | Sí | formato uuid | — | Identificador asociado a stage. | `src/modules/crm/dto/crm.dto.ts:516` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/crm/dto/crm.dto.ts:522` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La oportunidad ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:106` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 15. POST /crm/opportunities/{id}/win

- **Origen:** CONTRATO
- **Nombre:** Marcar la oportunidad como ganada
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.winOpportunity` — `src/modules/crm/controllers/crm.controller.ts:205`

### Qué es y para qué sirve (negocio)

Marcar la oportunidad como ganada. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/opportunities/{id}/win` la atiende `CrmController.winOpportunity` (src/modules/crm/controllers/crm.controller.ts:205). Exige sesión con alguno de los roles CRM_ADMIN, CRM_AGENT. Delega en `CrmSalesService.winOpportunity`. Crea filas en crm.opportunity_stage_history. Lee crm.opportunities.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN, CRM_AGENT | `src/modules/crm/controllers/crm.controller.ts:205` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/crm/controllers/crm.controller.ts:205` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.opportunities` | LEE | LEE | DIRECTA | CrmController.winOpportunity → CrmSalesService.winOpportunity → CrmSalesService.closeOpportunity → CrmSalesRepository.findOpportunityByIdForUpdate | `src/modules/crm/repositories/crm-sales.repository.ts:451` |
| `crm.opportunity_stage_history` | ESCRIBE | CREA | DIRECTA | CrmController.winOpportunity → CrmSalesService.winOpportunity → CrmSalesService.closeOpportunity → CrmSalesRepository.recordStageChange | `src/modules/crm/repositories/crm-sales.repository.ts:550` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<OpportunityResponseDto>` · DTO `OpportunityResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:510` |
| `stageId` | `string` | Sí | formato uuid | — | Identificador asociado a stage. | `src/modules/crm/dto/crm.dto.ts:516` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/crm/dto/crm.dto.ts:522` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: La oportunidad ya está cerrada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/crm/controllers/crm.controller.spec.ts:105` |

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 16. POST /crm/partnerships

- **Origen:** CONTRATO
- **Nombre:** Registrar una alianza y su acuerdo marco
- **Bloque:** Marketing y Crecimiento
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CrmController.createPartnership` — `src/modules/crm/controllers/crm.controller.ts:240`

### Qué es y para qué sirve (negocio)

Registrar una alianza y su acuerdo marco. Dentro del módulo (descripción del modelo, en inglés): «The internal CRM the clients asked for: a first-class contact and company (account) database, lead capture and qualification, sales/partnership pipelines with stages and opportunities, a logged activity timeline (calls, emails, meetings…» Dominio: Marketing y Crecimiento.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/modules/diagram_49_crm.puml:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:34`)

### Cómo se atiende (sistema)

`POST /crm/partnerships` la atiende `CrmController.createPartnership` (src/modules/crm/controllers/crm.controller.ts:240). Exige sesión con alguno de los roles CRM_ADMIN. Valida el cuerpo como `CreatePartnershipDto` (7 campos, 5 obligatorios). Delega en `CrmServiceService.createPartnership`. Crea filas en crm.partnership_agreements, crm.partnerships.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CRM_ADMIN | `src/modules/crm/controllers/crm.controller.ts:240` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:290` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:176` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:152` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `crm.partnership_agreements` | ESCRIBE | CREA | DIRECTA | CrmController.createPartnership → CrmServiceService.createPartnership → CrmServiceRepository.createAgreement | `src/modules/crm/repositories/crm-service.repository.ts:378` |
| `crm.partnerships` | ESCRIBE | CREA | DIRECTA | CrmController.createPartnership → CrmServiceService.createPartnership → CrmServiceRepository.createPartnership | `src/modules/crm/repositories/crm-service.repository.ts:315` |

### Cuerpo — DTO `CreatePartnershipDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:532` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/crm/dto/crm.dto.ts:540` |
| `partnershipType` | `string` | Sí | valores: REFERRAL, RESELLER | `@IsIn(['REFERRAL', 'RESELLER'])` | — | `src/modules/crm/dto/crm.dto.ts:547` |
| `partnerRefType` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | Tipo de la entidad socia | `src/modules/crm/dto/crm.dto.ts:555` |
| `partnerRefId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/crm/dto/crm.dto.ts:562` |
| `revenueSharePercent` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Reparto de ingresos | `src/modules/crm/dto/crm.dto.ts:570` |
| `commitmentAmount` | `string` | No | — | `@IsOptional()` `@IsNumberString()` | Importe comprometido del acuerdo marco | `src/modules/crm/dto/crm.dto.ts:580` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "partnershipType": "REFERRAL",
  "partnerRefType": "valor-ejemplo",
  "partnerRefId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "partnershipType": "REFERRAL",
  "partnerRefType": "valor-ejemplo",
  "partnerRefId": "00000000-0000-4000-8000-000000000001",
  "revenueSharePercent": "15.00",
  "commitmentAmount": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PartnershipResponseDto>` · DTO `PartnershipResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/crm/dto/crm.dto.ts:591` |
| `name` | `string` | Sí | — | — | Valor de name mantenido por la instancia. | `src/modules/crm/dto/crm.dto.ts:597` |
| `agreementId` | `string` | No | formato uuid | — | Acuerdo marco creado junto con la alianza | `src/modules/crm/dto/crm.dto.ts:606` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/crm.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- CRM — etapa `ctrl:CrmController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

