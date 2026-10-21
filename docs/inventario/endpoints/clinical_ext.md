<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `clinical_ext`

- **Bloque:** Clínico y Diagnóstico (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)
- **Operaciones:** 26 (26 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 8 · MEDIO 13 · BAJO 5
- **Tablas distintas que tocan:** 15
- **Respuestas de error y detalle contractual:** `openapi/endpoints/clinical-ext.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | PATCH | `/care-gaps/{id}/close` | Cerrar una brecha de cuidado por evento clínico | ALTO | 2 | sesión (sin roles) |
| 2 | POST | `/care-gaps/recompute` | Detectar y abrir brechas de cuidado (batch) | ALTO | 2 | sesión (sin roles) |
| 3 | GET | `/care-teams` | Listar equipos de cuidado de un paciente | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 4 | POST | `/care-teams` | Crear un equipo de cuidado con sus miembros | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 5 | PATCH | `/care-teams/{id}/members/{memberId}/set-responsible` | Designar miembro responsable (transferir liderazgo) | MEDIO | 3 | CLINICIAN, PRACTITIONER |
| 6 | POST | `/cds-rules` | Crear una regla CDS en borrador | MEDIO | 2 | SECURITY_ADMIN |
| 7 | POST | `/cds-rules/{id}/versions/publish` | Publicar una versión de la regla CDS | MEDIO | 2 | SECURITY_ADMIN |
| 8 | POST | `/cds-rules/{id}/versions/rollback` | Rollback de la versión activa de la regla CDS | MEDIO | 2 | SECURITY_ADMIN |
| 9 | POST | `/cds/check-interactions` | Detectar interacciones medicamentosas al prescribir | ALTO | 2 | sesión (sin roles) |
| 10 | POST | `/cds/evaluate` | Evaluar reglas CDS y generar alertas | ALTO | 2 | sesión (sin roles) |
| 11 | PATCH | `/clinical-alerts/{id}/acknowledge` | Reconocer una alerta clínica | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 12 | PATCH | `/clinical-alerts/{id}/override` | Override (sobreescribir) una alerta clínica | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 13 | POST | `/drug-interactions` | Registrar un par de interacción medicamentosa | MEDIO | 1 | SECURITY_ADMIN |
| 14 | POST | `/immunization-schedules` | Registrar una dosis del calendario de inmunización | MEDIO | 1 | SECURITY_ADMIN |
| 15 | POST | `/order-sets` | Crear una plantilla de órdenes (order set) con sus ítems | MEDIO | 3 | SECURITY_ADMIN |
| 16 | POST | `/order-sets/{id}/apply` | Aplicar un order set (fan-out de órdenes) | ALTO | 3 | sesión (sin roles) |
| 17 | POST | `/patients/{id}/immunization-plan/project` | Proyectar el plan de inmunización y abrir brechas | ALTO | 3 | sesión (sin roles) |
| 18 | GET | `/prescription-favorites` | Listar mis favoritos de prescripción | BAJO | 3 | sesión (sin roles) |
| 19 | POST | `/prescription-favorites` | Guardar un favorito de prescripción | ALTO | 4 | sesión (sin roles) |
| 20 | DELETE | `/prescription-favorites/{id}` | Borrar un favorito de prescripción propio | ALTO | 4 | sesión (sin roles) |
| 21 | GET | `/referrals` | Listar derivaciones de un paciente | BAJO | 1 | CLINICIAN, PRACTITIONER |
| 22 | POST | `/referrals` | Emitir una referencia desde un encuentro | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 23 | PATCH | `/referrals/{id}/respond` | Responder / aceptar una referencia inter-tenant | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 24 | POST | `/virtual-encounters` | Iniciar una sesión de telesalud | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 25 | PATCH | `/virtual-encounters/{id}/end` | Finalizar una sesión de telesalud | MEDIO | 2 | CLINICIAN, PRACTITIONER |
| 26 | PATCH | `/virtual-encounters/{id}/join` | Unirse a una sesión de telesalud | MEDIO | 2 | CLINICIAN, PRACTITIONER |

---

## 1. PATCH /care-gaps/{id}/close

- **Origen:** CONTRATO
- **Nombre:** Cerrar una brecha de cuidado por evento clínico
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.close` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:52`

### Qué es y para qué sirve (negocio)

Cerrar una brecha de cuidado por evento clínico. Caso de uso UC-18-10: Cerrar brecha por evento clínico. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:24`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /care-gaps/{id}/close` la atiende `CareGapsController.close` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:52). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CloseCareGapDto` (2 campos, 0 obligatorios). Delega en `CareGapsService.close`. Actualiza clinical_ext.care_gaps. Lee clinical_ext.care_gaps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:52` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:52` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_gaps` | ESCRIBE | ACTUALIZA | POR_TIPO | CareGapsController.close → CareGapsService.close | `src/modules/clinical_ext/services/care-gaps.service.ts:116` |
| `clinical_ext.care_gaps` | LEE | LEE | DIRECTA | CareGapsController.close → CareGapsService.close → CareGapsRepository.findById | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CloseCareGapDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `closedByResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo de recurso que cierra la brecha | `src/modules/clinical_ext/dto/care-gap.dto.ts:73` |
| `closedByResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso que cierra la brecha | `src/modules/clinical_ext/dto/care-gap.dto.ts:84` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "closedByResourceType": "valor-ejemplo",
  "closedByResourceId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/clinical_ext/dto/operation-result.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:40` |

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /care-gaps/recompute

- **Origen:** CONTRATO
- **Nombre:** Detectar y abrir brechas de cuidado (batch)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.recompute` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:41`

### Qué es y para qué sirve (negocio)

Detectar y abrir brechas de cuidado (batch). Caso de uso UC-18-09: Detectar y abrir brechas de cuidado. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:23`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /care-gaps/recompute` la atiende `CareGapsController.recompute` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:41). Exige sesión; el controlador no declara roles. Valida el cuerpo como `RecomputeCareGapsDto` (5 campos, 3 obligatorios). Delega en `CareGapsService.recompute`. Crea filas en clinical_ext.care_gaps. Lee clinical_ext.care_gaps.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_gaps` | ESCRIBE | CREA | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → CareGapsRepository.create | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:72` |
| `clinical_ext.care_gaps` | LEE | LEE | DIRECTA | CareGapsController.recompute → CareGapsService.recompute → CareGapsRepository.findOpen | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:56` |

### Cuerpo — DTO `RecomputeCareGapsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:51` |
| `gaps` | `array<CareGapInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CareGapInputDto)` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:61` |
| `gaps[].gapTypeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Tipo de brecha (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:22` |
| `gaps[].measureConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Medida de calidad / vacuna (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:33` |
| `gaps[].dueDate` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:41` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "gaps": [
    {
      "gapTypeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "gaps": [
    {
      "gapTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "measureConceptId": "00000000-0000-4000-8000-000000000001",
      "dueDate": "2026-07-31"
    }
  ]
}
```

</details>

### Respuesta — `Promise<RecomputeCareGapsResponseDto>` · DTO `RecomputeCareGapsResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `opened` | `number` | Sí | — | — | Nº de brechas abiertas nuevas | `src/modules/clinical_ext/dto/care-gap.dto.ts:210` |
| `skipped` | `number` | Sí | — | — | Nº de brechas ya abiertas que se dejaron intactas | `src/modules/clinical_ext/dto/care-gap.dto.ts:218` |
| `openedIds` | `array<string>` | Sí | — | — | Ids de las brechas abiertas en esta corrida | `src/modules/clinical_ext/dto/care-gap.dto.ts:227` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:33` |

### Flujos

_Se completa en la fase de flujos._

---

## 3. GET /care-teams

- **Origen:** CONTRATO
- **Nombre:** Listar equipos de cuidado de un paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareTeamsController.listByPatient` — `src/modules/clinical_ext/controllers/care-teams.controller.ts:68`

### Qué es y para qué sirve (negocio)

Listar equipos de cuidado de un paciente. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /care-teams` la atiende `CareTeamsController.listByPatient` (src/modules/clinical_ext/controllers/care-teams.controller.ts:68). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `CareTeamsService.listByPatient`. Lee clinical_ext.care_teams.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-teams.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_teams` | LEE | LEE | DIRECTA | CareTeamsController.listByPatient → CareTeamsService.listByPatient → CareTeamsRepository.findByPatient | `src/modules/clinical_ext/repositories/care-teams.repository.ts:82` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 4. POST /care-teams

- **Origen:** CONTRATO
- **Nombre:** Crear un equipo de cuidado con sus miembros
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareTeamsController.create` — `src/modules/clinical_ext/controllers/care-teams.controller.ts:39`

### Qué es y para qué sirve (negocio)

Crear un equipo de cuidado con sus miembros. Caso de uso UC-18-01: Crear equipo de cuidado con miembros. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:15`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /care-teams` la atiende `CareTeamsController.create` (src/modules/clinical_ext/controllers/care-teams.controller.ts:39). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateCareTeamDto` (11 campos, 4 obligatorios). Delega en `CareTeamsService.create`. Crea filas en clinical_ext.care_team_members, clinical_ext.care_teams.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-teams.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_team_members` | ESCRIBE | CREA | DIRECTA | CareTeamsController.create → CareTeamsService.create → CareTeamMembersRepository.create | `src/modules/clinical_ext/repositories/care-team-members.repository.ts:80` |
| `clinical_ext.care_teams` | ESCRIBE | CREA | DIRECTA | CareTeamsController.create → CareTeamsService.create → CareTeamsRepository.create | `src/modules/clinical_ext/repositories/care-teams.repository.ts:90` |

### Cuerpo — DTO `CreateCareTeamDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | Paciente del equipo | `src/modules/clinical_ext/dto/care-team.dto.ts:61` |
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant custodio | `src/modules/clinical_ext/dto/care-team.dto.ts:68` |
| `episodeId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Episodio de cuidado | `src/modules/clinical_ext/dto/care-team.dto.ts:76` |
| `name` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/care-team.dto.ts:85` |
| `categoryConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Categoría del equipo (concept id) | `src/modules/clinical_ext/dto/care-team.dto.ts:96` |
| `periodStart` | `string` | No | formato date-time | `@IsOptional()` `@IsISO8601()` | — | `src/modules/clinical_ext/dto/care-team.dto.ts:104` |
| `members` | `array<CareTeamMemberInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => CareTeamMemberInputDto)` | Miembros iniciales del equipo | `src/modules/clinical_ext/dto/care-team.dto.ts:117` |
| `members[].practitionerProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional de salud | `src/modules/clinical_ext/dto/care-team.dto.ts:23` |
| `members[].relatedPersonId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Persona relacionada (cuidador) | `src/modules/clinical_ext/dto/care-team.dto.ts:34` |
| `members[].memberRoleConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Rol del miembro (concept id) | `src/modules/clinical_ext/dto/care-team.dto.ts:41` |
| `members[].isResponsible` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Marca al miembro como responsable del equipo | `src/modules/clinical_ext/dto/care-team.dto.ts:51` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "members": [
    {
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "episodeId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "categoryConceptId": "00000000-0000-4000-8000-000000000001",
  "periodStart": "2026-07-31T12:00:00.000Z",
  "members": [
    {
      "practitionerProfileId": "00000000-0000-4000-8000-000000000001",
      "relatedPersonId": "00000000-0000-4000-8000-000000000001",
      "memberRoleConceptId": "00000000-0000-4000-8000-000000000001",
      "isResponsible": true
    }
  ]
}
```

</details>

### Respuesta — `Promise<CareTeamResponseDto>` · DTO `CareTeamResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:147` |
| `patientProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a patient profile. | `src/modules/clinical_ext/dto/care-team.dto.ts:153` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado del equipo (concept id) | `src/modules/clinical_ext/dto/care-team.dto.ts:162` |
| `members` | `array<CareTeamMemberResponseDto>` | Sí | — | — | Valor de members mantenido por la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:168` |
| `members[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:126` |
| `members[].memberRoleConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a member role concept. | `src/modules/clinical_ext/dto/care-team.dto.ts:132` |
| `members[].isResponsible` | `boolean` | Sí | — | — | Valor de is responsible mantenido por la instancia. | `src/modules/clinical_ext/dto/care-team.dto.ts:138` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/clinical_ext/dto/care-team.dto.ts:174` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-teams.controller.spec.ts:29` |

### Flujos

_Se completa en la fase de flujos._

---

## 5. PATCH /care-teams/{id}/members/{memberId}/set-responsible

- **Origen:** CONTRATO
- **Nombre:** Designar miembro responsable (transferir liderazgo)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareTeamsController.setResponsible` — `src/modules/clinical_ext/controllers/care-teams.controller.ts:50`

### Qué es y para qué sirve (negocio)

Designar miembro responsable (transferir liderazgo). Caso de uso UC-18-02: Transferir liderazgo. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:16`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /care-teams/{id}/members/{memberId}/set-responsible` la atiende `CareTeamsController.setResponsible` (src/modules/clinical_ext/controllers/care-teams.controller.ts:50). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `CareTeamsService.setResponsible`. Actualiza clinical_ext.care_team_members. Lee clinical_ext.care_team_members, clinical_ext.care_teams.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/care-teams.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, memberId | `src/modules/clinical_ext/controllers/care-teams.controller.ts:50` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_team_members` | ESCRIBE | ACTUALIZA | POR_TIPO | CareTeamsController.setResponsible → CareTeamsService.setResponsible | `src/modules/clinical_ext/services/care-teams.service.ts:167` |
| `clinical_ext.care_team_members` | LEE | LEE | DIRECTA | CareTeamsController.setResponsible → CareTeamsService.setResponsible → CareTeamMembersRepository.findById | `src/modules/clinical_ext/repositories/care-team-members.repository.ts:53` |
| `clinical_ext.care_teams` | LEE | LEE | DIRECTA | CareTeamsController.setResponsible → CareTeamsService.setResponsible → CareTeamsRepository.findById | `src/modules/clinical_ext/repositories/care-teams.repository.ts:56` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `memberId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/clinical_ext/dto/operation-result.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-teams.controller.spec.ts:37` |

### Flujos

_Se completa en la fase de flujos._

---

## 6. POST /cds-rules

- **Origen:** CONTRATO
- **Nombre:** Crear una regla CDS en borrador
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.createRule` — `src/modules/clinical_ext/controllers/cds.controller.ts:41`

### Qué es y para qué sirve (negocio)

Crear una regla CDS en borrador. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds-rules` la atiende `CdsController.createRule` (src/modules/clinical_ext/controllers/cds.controller.ts:41). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateCdsRuleDto` (7 campos, 2 obligatorios). Delega en `CdsService.createRule`. Crea filas en clinical_ext.cds_rules. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:41` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | ESCRIBE | CREA | DIRECTA | CdsController.createRule → CdsService.createRule → CdsRulesRepository.create | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:100` |
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.createRule → CdsService.createRule → CdsRulesRepository.findByCode | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:76` |

### Cuerpo — DTO `CreateCdsRuleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant propietario (null = global) | `src/modules/clinical_ext/dto/cds.dto.ts:26` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/clinical_ext/dto/cds.dto.ts:34` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/cds.dto.ts:42` |
| `ruleTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de regla (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:53` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad de la alerta que genera (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:64` |
| `logicJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Lógica de la regla (JSON) | `src/modules/clinical_ext/dto/cds.dto.ts:72` |
| `messageTemplate` | `string` | No | — | `@IsOptional()` `@IsString()` | Plantilla del mensaje de alerta | `src/modules/clinical_ext/dto/cds.dto.ts:80` |

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
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "ruleTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "logicJson": {},
  "messageTemplate": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<CdsRuleResponseDto>` · DTO `CdsRuleResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:305` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:311` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:317` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:323` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/cds.dto.ts:329` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:35` |

### Flujos

_Se completa en la fase de flujos._

---

## 7. POST /cds-rules/{id}/versions/publish

- **Origen:** CONTRATO
- **Nombre:** Publicar una versión de la regla CDS
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.publish` — `src/modules/clinical_ext/controllers/cds.controller.ts:53`

### Qué es y para qué sirve (negocio)

Publicar una versión de la regla CDS. Caso de uso UC-18-13: Publicar versión de regla CDS con rollback. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:27`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds-rules/{id}/versions/publish` la atiende `CdsController.publish` (src/modules/clinical_ext/controllers/cds.controller.ts:53). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `PublishRuleVersionDto` (3 campos, 0 obligatorios). Delega en `CdsService.publishVersion`. Actualiza clinical_ext.cds_rules. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:53` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/cds.controller.ts:53` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | CdsController.publish → CdsService.publishVersion | `src/modules/clinical_ext/services/cds.service.ts:122` |
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.publish → CdsService.publishVersion → CdsRulesRepository.findById | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `PublishRuleVersionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `logicJson` | `object` | No | — | `@IsOptional()` `@IsObject()` | Nueva lógica de la regla (JSON) | `src/modules/clinical_ext/dto/cds.dto.ts:91` |
| `messageTemplate` | `string` | No | — | `@IsOptional()` `@IsString()` | Nueva plantilla del mensaje | `src/modules/clinical_ext/dto/cds.dto.ts:99` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nueva severidad (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:110` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "logicJson": {},
  "messageTemplate": "valor-ejemplo",
  "severityConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<CdsRuleResponseDto>` · DTO `CdsRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:305` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:311` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:317` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:323` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/cds.dto.ts:329` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:42` |

### Flujos

_Se completa en la fase de flujos._

---

## 8. POST /cds-rules/{id}/versions/rollback

- **Origen:** CONTRATO
- **Nombre:** Rollback de la versión activa de la regla CDS
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.rollback` — `src/modules/clinical_ext/controllers/cds.controller.ts:66`

### Qué es y para qué sirve (negocio)

Rollback de la versión activa de la regla CDS. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds-rules/{id}/versions/rollback` la atiende `CdsController.rollback` (src/modules/clinical_ext/controllers/cds.controller.ts:66). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `CdsService.rollbackVersion`. Actualiza clinical_ext.cds_rules. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:66` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/cds.controller.ts:66` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | ESCRIBE | ACTUALIZA | POR_TIPO | CdsController.rollback → CdsService.rollbackVersion | `src/modules/clinical_ext/services/cds.service.ts:160` |
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.rollback → CdsService.rollbackVersion → CdsRulesRepository.findById | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<CdsRuleResponseDto>` · DTO `CdsRuleResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:305` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:311` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:317` |
| `isActive` | `boolean` | Sí | — | — | Valor de is active mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:323` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/cds.dto.ts:329` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:48` |

### Flujos

_Se completa en la fase de flujos._

---

## 9. POST /cds/check-interactions

- **Origen:** CONTRATO
- **Nombre:** Detectar interacciones medicamentosas al prescribir
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.checkInteractions` — `src/modules/clinical_ext/controllers/cds.controller.ts:89`

### Qué es y para qué sirve (negocio)

Detectar interacciones medicamentosas al prescribir. Caso de uso UC-18-04: Detectar interacciones medicamentosas. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:18`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds/check-interactions` la atiende `CdsController.checkInteractions` (src/modules/clinical_ext/controllers/cds.controller.ts:89). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CheckInteractionsDto` (4 campos, 2 obligatorios). Delega en `CdsService.checkInteractions`. Crea filas en clinical_ext.clinical_alerts. Lee clinical_ext.drug_interactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/cds.controller.ts:89` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.clinical_alerts` | ESCRIBE | CREA | DIRECTA | CdsController.checkInteractions → CdsService.checkInteractions → ClinicalAlertsRepository.create | `src/modules/clinical_ext/repositories/clinical-alerts.repository.ts:104` |
| `clinical_ext.drug_interactions` | LEE | LEE | DIRECTA | CdsController.checkInteractions → CdsService.checkInteractions → DrugInteractionsRepository.findByPair | `src/modules/clinical_ext/repositories/drug-interactions.repository.ts:55` |

### Cuerpo — DTO `CheckInteractionsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:220` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:228` |
| `medicationRequestId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prescripción en borrador que se evalúa | `src/modules/clinical_ext/dto/cds.dto.ts:239` |
| `substanceConceptIds` | `array<string>` | Sí | formato uuid; mínimo 2 elemento(s) | `@IsArray()` `@ArrayMinSize(2)` `@IsUUID(undefined, { each: true })` | Concept ids de las sustancias activas + la nueva a prescribir | `src/modules/clinical_ext/dto/cds.dto.ts:252` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "medicationRequestId": "00000000-0000-4000-8000-000000000001",
  "substanceConceptIds": [
    "valor-ejemplo",
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<AlertBatchResponseDto>` · DTO `AlertBatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `alerts` | `array<GeneratedAlertDto>` | Sí | — | — | Valor de alerts mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:365` |
| `alerts[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:338` |
| `alerts[].alertTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a alert type concept. | `src/modules/clinical_ext/dto/cds.dto.ts:344` |
| `alerts[].severityConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical_ext/dto/cds.dto.ts:350` |
| `alerts[].ruleId` | `string` | No | formato uuid | — | Identificador asociado a rule. | `src/modules/clinical_ext/dto/cds.dto.ts:356` |
| `count` | `number` | Sí | — | — | Nº de alertas generadas | `src/modules/clinical_ext/dto/cds.dto.ts:371` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:62` |

### Flujos

_Se completa en la fase de flujos._

---

## 10. POST /cds/evaluate

- **Origen:** CONTRATO
- **Nombre:** Evaluar reglas CDS y generar alertas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.evaluate` — `src/modules/clinical_ext/controllers/cds.controller.ts:78`

### Qué es y para qué sirve (negocio)

Evaluar reglas CDS y generar alertas. Caso de uso UC-18-03: Evaluar reglas CDS y generar alertas. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:17`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /cds/evaluate` la atiende `CdsController.evaluate` (src/modules/clinical_ext/controllers/cds.controller.ts:78). Exige sesión; el controlador no declara roles. Valida el cuerpo como `EvaluateCdsDto` (9 campos, 1 obligatorio). Delega en `CdsService.evaluate`. Crea filas en clinical_ext.clinical_alerts. Lee clinical_ext.cds_rules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/cds.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.cds_rules` | LEE | LEE | DIRECTA | CdsController.evaluate → CdsService.evaluate → CdsRulesRepository.findActive | `src/modules/clinical_ext/repositories/cds-rules.repository.ts:85` |
| `clinical_ext.clinical_alerts` | ESCRIBE | CREA | DIRECTA | CdsController.evaluate → CdsService.evaluate → ClinicalAlertsRepository.create | `src/modules/clinical_ext/repositories/clinical-alerts.repository.ts:104` |

### Cuerpo — DTO `EvaluateCdsDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:143` |
| `encounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:151` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant de las reglas a evaluar | `src/modules/clinical_ext/dto/cds.dto.ts:162` |
| `sourceResourceType` | `string` | No | longitud máxima 100 | `@IsOptional()` `@IsString()` `@MaxLength(100)` | Tipo del recurso disparador (p.ej. allergy_intolerance) | `src/modules/clinical_ext/dto/cds.dto.ts:173` |
| `sourceResourceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Id del recurso disparador | `src/modules/clinical_ext/dto/cds.dto.ts:184` |
| `medicationConceptIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Concept ids de los medicamentos activos del paciente (contexto de evaluación) | `src/modules/clinical_ext/dto/cds.dto.ts:197` |
| `observations` | `array<CdsObservationInputDto>` | No | — | `@IsOptional()` `@IsArray()` `@ValidateNested({ each: true })` `@Type(() => CdsObservationInputDto)` | Observaciones del paciente (contexto de evaluación) | `src/modules/clinical_ext/dto/cds.dto.ts:210` |
| `observations[].codeConceptId` | `string` | No | formato uuid | `@IsUUID()` | Código de la observación (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:123` |
| `observations[].valueNumber` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Valor numérico observado (p.ej. glucemia) | `src/modules/clinical_ext/dto/cds.dto.ts:133` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "sourceResourceType": "valor-ejemplo",
  "sourceResourceId": "00000000-0000-4000-8000-000000000001",
  "medicationConceptIds": [
    "valor-ejemplo"
  ],
  "observations": [
    {
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "valueNumber": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<AlertBatchResponseDto>` · DTO `AlertBatchResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `alerts` | `array<GeneratedAlertDto>` | Sí | — | — | Valor de alerts mantenido por la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:365` |
| `alerts[].id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/cds.dto.ts:338` |
| `alerts[].alertTypeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a alert type concept. | `src/modules/clinical_ext/dto/cds.dto.ts:344` |
| `alerts[].severityConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a severity concept. | `src/modules/clinical_ext/dto/cds.dto.ts:350` |
| `alerts[].ruleId` | `string` | No | formato uuid | — | Identificador asociado a rule. | `src/modules/clinical_ext/dto/cds.dto.ts:356` |
| `count` | `number` | Sí | — | — | Nº de alertas generadas | `src/modules/clinical_ext/dto/cds.dto.ts:371` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:55` |

### Flujos

_Se completa en la fase de flujos._

---

## 11. PATCH /clinical-alerts/{id}/acknowledge

- **Origen:** CONTRATO
- **Nombre:** Reconocer una alerta clínica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAlertsController.acknowledge` — `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:32`

### Qué es y para qué sirve (negocio)

Reconocer una alerta clínica. Caso de uso UC-18-05: Reconocer / override de alerta. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:19`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /clinical-alerts/{id}/acknowledge` la atiende `ClinicalAlertsController.acknowledge` (src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:32). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ClinicalAlertsService.acknowledge`. Lee clinical_ext.clinical_alerts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:32` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:32` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.clinical_alerts` | LEE | LEE | DIRECTA | ClinicalAlertsController.acknowledge → ClinicalAlertsService.acknowledge → ClinicalAlertsService.loadActive → ClinicalAlertsRepository.findById | `src/modules/clinical_ext/repositories/clinical-alerts.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<ClinicalAlertResponseDto>` · DTO `ClinicalAlertResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:25` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la alerta (concept id) | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:34` |
| `overriddenAt` | `string` | No | formato date-time | — | Valor de overridden at mantenido por la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:40` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/clinical-alerts.controller.spec.ts:27` |

### Flujos

_Se completa en la fase de flujos._

---

## 12. PATCH /clinical-alerts/{id}/override

- **Origen:** CONTRATO
- **Nombre:** Override (sobreescribir) una alerta clínica
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ClinicalAlertsController.override` — `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:43`

### Qué es y para qué sirve (negocio)

Override (sobreescribir) una alerta clínica. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /clinical-alerts/{id}/override` la atiende `ClinicalAlertsController.override` (src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:43). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `OverrideAlertDto` (1 campo, 0 obligatorios). Delega en `ClinicalAlertsService.override`. Lee clinical_ext.clinical_alerts.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/clinical-alerts.controller.ts:43` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.clinical_alerts` | LEE | LEE | DIRECTA | ClinicalAlertsController.override → ClinicalAlertsService.override → ClinicalAlertsService.loadActive → ClinicalAlertsRepository.findById | `src/modules/clinical_ext/repositories/clinical-alerts.repository.ts:69` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `OverrideAlertDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `reason` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | Motivo del override (obligatorio para alertas de alta severidad) | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:16` |

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

### Respuesta — `Promise<ClinicalAlertResponseDto>` · DTO `ClinicalAlertResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:25` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la alerta (concept id) | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:34` |
| `overriddenAt` | `string` | No | formato date-time | — | Valor de overridden at mantenido por la instancia. | `src/modules/clinical_ext/dto/clinical-alert.dto.ts:40` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/clinical-alerts.controller.spec.ts:34` |

### Flujos

_Se completa en la fase de flujos._

---

## 13. POST /drug-interactions

- **Origen:** CONTRATO
- **Nombre:** Registrar un par de interacción medicamentosa
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CdsController.createDrugInteraction` — `src/modules/clinical_ext/controllers/cds.controller.ts:102`

### Qué es y para qué sirve (negocio)

Registrar un par de interacción medicamentosa. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /drug-interactions` la atiende `CdsController.createDrugInteraction` (src/modules/clinical_ext/controllers/cds.controller.ts:102). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDrugInteractionDto` (5 campos, 2 obligatorios). Delega en `CdsService.createDrugInteraction`. Crea filas en clinical_ext.drug_interactions.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/cds.controller.ts:102` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.drug_interactions` | ESCRIBE | CREA | DIRECTA | CdsController.createDrugInteraction → CdsService.createDrugInteraction → DrugInteractionsRepository.create | `src/modules/clinical_ext/repositories/drug-interactions.repository.ts:71` |

### Cuerpo — DTO `CreateDrugInteractionDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `substanceAConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:262` |
| `substanceBConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:269` |
| `severityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Severidad (concept id) | `src/modules/clinical_ext/dto/cds.dto.ts:280` |
| `mechanismText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:288` |
| `managementText` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/clinical_ext/dto/cds.dto.ts:296` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "substanceAConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceBConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "substanceAConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceBConceptId": "00000000-0000-4000-8000-000000000001",
  "severityConceptId": "00000000-0000-4000-8000-000000000001",
  "mechanismText": "valor-ejemplo",
  "managementText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/cds.controller.spec.ts:69` |

### Flujos

_Se completa en la fase de flujos._

---

## 14. POST /immunization-schedules

- **Origen:** CONTRATO
- **Nombre:** Registrar una dosis del calendario de inmunización
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.createSchedule` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:78`

### Qué es y para qué sirve (negocio)

Registrar una dosis del calendario de inmunización. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /immunization-schedules` la atiende `CareGapsController.createSchedule` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:78). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateImmunizationScheduleDto` (7 campos, 2 obligatorios). Delega en `CareGapsService.createSchedule`. Crea filas en clinical_ext.immunization_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:78` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.immunization_schedules` | ESCRIBE | CREA | DIRECTA | CareGapsController.createSchedule → CareGapsService.createSchedule → ImmunizationSchedulesRepository.create | `src/modules/clinical_ext/repositories/immunization-schedules.repository.ts:78` |

### Cuerpo — DTO `CreateImmunizationScheduleDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:128` |
| `vaccineConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Vacuna (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:135` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:143` |
| `recommendedAgeDays` | `number` | No | — | `@IsOptional()` `@IsInt()` | Edad recomendada en días desde el nacimiento | `src/modules/clinical_ext/dto/care-gap.dto.ts:153` |
| `doseNumber` | `number` | No | — | `@IsOptional()` `@IsInt()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:161` |
| `intervalDays` | `number` | No | — | `@IsOptional()` `@IsInt()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:169` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/care-gap.dto.ts:177` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "vaccineConceptId": "00000000-0000-4000-8000-000000000001",
  "name": "Nombre de ejemplo",
  "recommendedAgeDays": 1,
  "doseNumber": 1,
  "intervalDays": 1,
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<{ /** * Identificador único de la instancia. */ id: string; }>` · HTTP `HttpStatus.CREATED`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:58` |

### Flujos

_Se completa en la fase de flujos._

---

## 15. POST /order-sets

- **Origen:** CONTRATO
- **Nombre:** Crear una plantilla de órdenes (order set) con sus ítems
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrderSetsController.create` — `src/modules/clinical_ext/controllers/order-sets.controller.ts:36`

### Qué es y para qué sirve (negocio)

Crear una plantilla de órdenes (order set) con sus ítems. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /order-sets` la atiende `OrderSetsController.create` (src/modules/clinical_ext/controllers/order-sets.controller.ts:36). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateOrderSetDto` (12 campos, 4 obligatorios). Delega en `OrderSetsService.create`. Crea filas en clinical_ext.order_set_items, clinical_ext.order_sets. Lee clinical_ext.order_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/clinical_ext/controllers/order-sets.controller.ts:36` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.order_set_items` | ESCRIBE | CREA | DIRECTA | OrderSetsController.create → OrderSetsService.create → OrderSetsRepository.createItem | `src/modules/clinical_ext/repositories/order-sets.repository.ts:159` |
| `clinical_ext.order_sets` | ESCRIBE | CREA | DIRECTA | OrderSetsController.create → OrderSetsService.create → OrderSetsRepository.create | `src/modules/clinical_ext/repositories/order-sets.repository.ts:134` |
| `clinical_ext.order_sets` | LEE | LEE | DIRECTA | OrderSetsController.create → OrderSetsService.create → OrderSetsRepository.findByCode | `src/modules/clinical_ext/repositories/order-sets.repository.ts:108` |

### Cuerpo — DTO `CreateOrderSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:81` |
| `code` | `string` | Sí | longitud máxima 100 | `@IsString()` `@MaxLength(100)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:89` |
| `name` | `string` | Sí | longitud máxima 200 | `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:97` |
| `description` | `string` | No | — | `@IsOptional()` `@IsString()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:105` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:113` |
| `items` | `array<OrderSetItemInputDto>` | Sí | mínimo 1 elemento(s) | `@IsArray()` `@ArrayMinSize(1)` `@ValidateNested({ each: true })` `@Type(() => OrderSetItemInputDto)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:123` |
| `items[].itemTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de ítem (concept id) | `src/modules/clinical_ext/dto/order-set.dto.ts:26` |
| `items[].codeConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Código de la orden (concept id) | `src/modules/clinical_ext/dto/order-set.dto.ts:36` |
| `items[].defaultDoseText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:45` |
| `items[].defaultFrequencyText` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:54` |
| `items[].isSelectedDefault` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Seleccionado por defecto al aplicar | `src/modules/clinical_ext/dto/order-set.dto.ts:62` |
| `items[].ordinal` | `number` | No | — | `@IsOptional()` `@IsInt()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:70` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "items": [
    {
      "codeConceptId": "00000000-0000-4000-8000-000000000001"
    }
  ]
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "code": "CODIGO_EJEMPLO",
  "name": "Nombre de ejemplo",
  "description": "Texto descriptivo de ejemplo",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "items": [
    {
      "itemTypeConceptId": "00000000-0000-4000-8000-000000000001",
      "codeConceptId": "00000000-0000-4000-8000-000000000001",
      "defaultDoseText": "valor-ejemplo",
      "defaultFrequencyText": "valor-ejemplo",
      "isSelectedDefault": true,
      "ordinal": 1
    }
  ]
}
```

</details>

### Respuesta — `Promise<OrderSetResponseDto>` · DTO `OrderSetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:174` |
| `code` | `string` | Sí | — | — | Valor de code mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:180` |
| `version` | `number` | Sí | — | — | Valor de version mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:186` |
| `itemCount` | `number` | Sí | — | — | Nº de ítems creados | `src/modules/clinical_ext/dto/order-set.dto.ts:192` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/order-set.dto.ts:198` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/order-sets.controller.spec.ts:28` |

### Flujos

_Se completa en la fase de flujos._

---

## 16. POST /order-sets/{id}/apply

- **Origen:** CONTRATO
- **Nombre:** Aplicar un order set (fan-out de órdenes)
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrderSetsController.apply` — `src/modules/clinical_ext/controllers/order-sets.controller.ts:50`

### Qué es y para qué sirve (negocio)

Aplicar un order set (fan-out de órdenes). Caso de uso UC-18-06: Aplicar order set (fan-out). Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:20`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /order-sets/{id}/apply` la atiende `OrderSetsController.apply` (src/modules/clinical_ext/controllers/order-sets.controller.ts:50). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ApplyOrderSetDto` (4 campos, 2 obligatorios). Delega en `OrderSetsService.apply`. Crea filas en clinical.service_requests. Lee clinical_ext.order_set_items, clinical_ext.order_sets.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/order-sets.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/order-sets.controller.ts:50` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.order_set_items` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → OrderSetsRepository.itemsBySet | `src/modules/clinical_ext/repositories/order-sets.repository.ts:119` |
| `clinical_ext.order_sets` | LEE | LEE | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → OrderSetsRepository.findById | `src/modules/clinical_ext/repositories/order-sets.repository.ts:97` |
| `clinical.service_requests` | ESCRIBE | CREA | DIRECTA | OrderSetsController.apply → OrderSetsService.apply → ServiceRequestsRepository.create | `src/modules/clinical/repositories/service-requests.repository.ts:78` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ApplyOrderSetDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | Sí | formato uuid | `@IsUUID()` | Encuentro clínico abierto | `src/modules/clinical_ext/dto/order-set.dto.ts:133` |
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/order-set.dto.ts:140` |
| `custodianTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant custodio de las órdenes derivadas; si se omite, se usa el del order set | `src/modules/clinical_ext/dto/order-set.dto.ts:152` |
| `selectedItemIds` | `array<string>` | No | formato uuid | `@IsOptional()` `@IsArray()` `@IsUUID('4', { each: true })` | Ítems seleccionados explícitamente; si se omite, se usan los default | `src/modules/clinical_ext/dto/order-set.dto.ts:165` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "custodianTenantId": "00000000-0000-4000-8000-000000000001",
  "selectedItemIds": [
    "valor-ejemplo"
  ]
}
```

</details>

### Respuesta — `Promise<ApplyOrderSetResponseDto>` · DTO `ApplyOrderSetResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `orderSetId` | `string` | Sí | formato uuid | — | Identificador asociado a order set. | `src/modules/clinical_ext/dto/order-set.dto.ts:243` |
| `appliedOrders` | `array<AppliedOrderDto>` | Sí | — | — | Valor de applied orders mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:249` |
| `appliedOrders[].serviceRequestId` | `string` | Sí | formato uuid | — | Service request persistido para este ítem | `src/modules/clinical_ext/dto/order-set.dto.ts:210` |
| `appliedOrders[].orderSetItemId` | `string` | Sí | formato uuid | — | Identificador asociado a order set item. | `src/modules/clinical_ext/dto/order-set.dto.ts:216` |
| `appliedOrders[].codeConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a code concept. | `src/modules/clinical_ext/dto/order-set.dto.ts:222` |
| `appliedOrders[].doseText` | `string` | No | — | — | Valor de dose text mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:228` |
| `appliedOrders[].frequencyText` | `string` | No | — | — | Valor de frequency text mantenido por la instancia. | `src/modules/clinical_ext/dto/order-set.dto.ts:234` |
| `count` | `number` | Sí | — | — | Nº de órdenes generadas | `src/modules/clinical_ext/dto/order-set.dto.ts:255` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/order-sets.controller.spec.ts:35` |

### Flujos

_Se completa en la fase de flujos._

---

## 17. POST /patients/{id}/immunization-plan/project

- **Origen:** CONTRATO
- **Nombre:** Proyectar el plan de inmunización y abrir brechas
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `CareGapsController.projectImmunizationPlan` — `src/modules/clinical_ext/controllers/care-gaps.controller.ts:64`

### Qué es y para qué sirve (negocio)

Proyectar el plan de inmunización y abrir brechas. Caso de uso UC-18-11: Proyectar plan de inmunización y abrir brechas. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:25`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /patients/{id}/immunization-plan/project` la atiende `CareGapsController.projectImmunizationPlan` (src/modules/clinical_ext/controllers/care-gaps.controller.ts:64). Exige sesión; el controlador no declara roles. Valida el cuerpo como `ProjectImmunizationPlanDto` (3 campos, 1 obligatorio). Delega en `CareGapsService.projectImmunizationPlan`. Crea filas en clinical_ext.care_gaps. Lee clinical_ext.care_gaps, clinical_ext.immunization_schedules.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/care-gaps.controller.ts:64` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.care_gaps` | ESCRIBE | CREA | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → CareGapsRepository.create | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:72` |
| `clinical_ext.care_gaps` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → CareGapsRepository.findOpen | `src/modules/clinical_ext/repositories/care-gaps.repository.ts:56` |
| `clinical_ext.immunization_schedules` | LEE | LEE | DIRECTA | CareGapsController.projectImmunizationPlan → CareGapsService.projectImmunizationPlan → ImmunizationSchedulesRepository.findActive | `src/modules/clinical_ext/repositories/immunization-schedules.repository.ts:56` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ProjectImmunizationPlanDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `birthDate` | `string` | Sí | formato date | `@IsISO8601()` | Fecha de nacimiento del paciente | `src/modules/clinical_ext/dto/care-gap.dto.ts:98` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción del calendario (concept id) | `src/modules/clinical_ext/dto/care-gap.dto.ts:109` |
| `tenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant del calendario | `src/modules/clinical_ext/dto/care-gap.dto.ts:117` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "birthDate": "2026-07-31"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "birthDate": "2026-07-31",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "tenantId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<ImmunizationPlanResponseDto>` · DTO `ImmunizationPlanResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `gapsOpened` | `number` | Sí | — | — | Nº de brechas de dosis abiertas | `src/modules/clinical_ext/dto/care-gap.dto.ts:236` |
| `dosesEvaluated` | `number` | Sí | — | — | Nº de dosis del calendario evaluadas | `src/modules/clinical_ext/dto/care-gap.dto.ts:242` |
| `openedIds` | `array<string>` | Sí | — | — | Valor de opened ids mantenido por la instancia. | `src/modules/clinical_ext/dto/care-gap.dto.ts:248` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/care-gaps.controller.spec.ts:47` |

### Flujos

_Se completa en la fase de flujos._

---

## 18. GET /prescription-favorites

- **Origen:** CONTRATO
- **Nombre:** Listar mis favoritos de prescripción
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionFavoritesController.listOwn` — `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:43`

### Qué es y para qué sirve (negocio)

Listar mis favoritos de prescripción. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /prescription-favorites` la atiende `PrescriptionFavoritesController.listOwn` (src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:43). Exige sesión; el controlador no declara roles. Delega en `PrescriptionFavoritesService.listOwn`. Lee clinical_ext.prescription_favorites, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.prescription_favorites` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.listOwn → PrescriptionFavoritesService.listOwn → PrescriptionFavoritesRepository.findByPractitioner | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:80` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.listOwn → PrescriptionFavoritesService.listOwn → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.listOwn → PrescriptionFavoritesService.listOwn → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<PrescriptionFavoriteResponseDto[]>` · DTO `PrescriptionFavoriteResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la instancia. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:109` |
| `name` | `string` | Sí | — | — | Rótulo del favorito. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:115` |
| `medicationConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a medication concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:121` |
| `substanceAtcConceptId` | `string` | No | formato uuid | — | Identificador asociado a substance atc concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:127` |
| `doseText` | `string` | No | — | — | Posología por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:133` |
| `routeConceptId` | `string` | No | formato uuid | — | Identificador asociado a route concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:139` |
| `frequencyText` | `string` | No | — | — | Frecuencia por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:145` |
| `quantityDecimal` | `string` | No | — | — | Cantidad por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:151` |
| `unitConceptId` | `string` | No | formato uuid | — | Identificador asociado a unit concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:157` |
| `patientInstructionsText` | `string` | No | — | — | Indicaciones al paciente por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:163` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 19. POST /prescription-favorites

- **Origen:** CONTRATO
- **Nombre:** Guardar un favorito de prescripción
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionFavoritesController.create` — `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57`

### Qué es y para qué sirve (negocio)

Guardar un favorito de prescripción. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /prescription-favorites` la atiende `PrescriptionFavoritesController.create` (src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57). Exige sesión; el controlador no declara roles. Valida el cuerpo como `CreatePrescriptionFavoriteDto` (9 campos, 2 obligatorios). Delega en `PrescriptionFavoritesService.create`. Crea filas en clinical_ext.prescription_favorites. Lee clinical_ext.prescription_favorites, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:57` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.prescription_favorites` | ESCRIBE | CREA | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → PrescriptionFavoritesRepository.create | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:129` |
| `clinical_ext.prescription_favorites` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → PrescriptionFavoritesRepository.countByPractitioner | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:115` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.create → PrescriptionFavoritesService.create → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Cuerpo — DTO `CreatePrescriptionFavoriteDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `name` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@MinLength(1)` `@MaxLength(120)` | Rótulo del favorito, único dentro de la lista del profesional (p. ej. «ATB post extracción») | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:25` |
| `medicationConceptId` | `string` | Sí | formato uuid | `@IsUUID()` | Medicamento codificado (terminology.catalog_concepts) | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:35` |
| `substanceAtcConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Principio activo ATC | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:43` |
| `doseText` | `string` | No | — | `@IsOptional()` `@IsString()` | Posología por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:51` |
| `routeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Vía de administración por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:62` |
| `frequencyText` | `string` | No | — | `@IsOptional()` `@IsString()` | Frecuencia por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:70` |
| `quantityDecimal` | `number` | No | — | `@IsOptional()` `@IsNumber()` | Cantidad por defecto | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:78` |
| `unitConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad de la cantidad | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:89` |
| `patientInstructionsText` | `string` | No | — | `@IsOptional()` `@IsString()` | Indicaciones al paciente por defecto, separadas de la posología | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:100` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "name": "Nombre de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "name": "Nombre de ejemplo",
  "medicationConceptId": "00000000-0000-4000-8000-000000000001",
  "substanceAtcConceptId": "00000000-0000-4000-8000-000000000001",
  "doseText": "valor-ejemplo",
  "routeConceptId": "00000000-0000-4000-8000-000000000001",
  "frequencyText": "valor-ejemplo",
  "quantityDecimal": 1,
  "unitConceptId": "00000000-0000-4000-8000-000000000001",
  "patientInstructionsText": "valor-ejemplo"
}
```

</details>

### Respuesta — `Promise<PrescriptionFavoriteResponseDto>` · DTO `PrescriptionFavoriteResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador de la instancia. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:109` |
| `name` | `string` | Sí | — | — | Rótulo del favorito. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:115` |
| `medicationConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a medication concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:121` |
| `substanceAtcConceptId` | `string` | No | formato uuid | — | Identificador asociado a substance atc concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:127` |
| `doseText` | `string` | No | — | — | Posología por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:133` |
| `routeConceptId` | `string` | No | formato uuid | — | Identificador asociado a route concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:139` |
| `frequencyText` | `string` | No | — | — | Frecuencia por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:145` |
| `quantityDecimal` | `string` | No | — | — | Cantidad por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:151` |
| `unitConceptId` | `string` | No | formato uuid | — | Identificador asociado a unit concept. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:157` |
| `patientInstructionsText` | `string` | No | — | — | Indicaciones al paciente por defecto. | `src/modules/clinical_ext/dto/prescription-favorite.dto.ts:163` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 20. DELETE /prescription-favorites/{id}

- **Origen:** CONTRATO
- **Nombre:** Borrar un favorito de prescripción propio
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** ALTO — Borra filas; Escribe y el controlador no declara roles
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `PrescriptionFavoritesController.remove` — `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:68`

### Qué es y para qué sirve (negocio)

Borrar un favorito de prescripción propio. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`DELETE /prescription-favorites/{id}` la atiende `PrescriptionFavoritesController.remove` (src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:68). Exige sesión; el controlador no declara roles. Delega en `PrescriptionFavoritesService.remove`. Borra de clinical_ext.prescription_favorites. Lee clinical_ext.prescription_favorites, profiles.health_practitioner_profiles, profiles.person_account_links.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Sin @Roles en el controlador (si hay regla de acceso, vive en el servicio) | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:68` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/prescription-favorites.controller.ts:68` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.prescription_favorites` | BORRA | BORRA | POR_TIPO | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove | `src/modules/clinical_ext/services/prescription-favorites.service.ts:190` |
| `clinical_ext.prescription_favorites` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove → PrescriptionFavoritesRepository.findById | `src/modules/clinical_ext/repositories/prescription-favorites.repository.ts:101` |
| `profiles.health_practitioner_profiles` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove → ProfileOwnershipService.requireOwnPractitionerProfileId → HealthPractitionerProfilesRepository.findById | `src/modules/profiles/repositories/health-practitioner-profiles.repository.ts:64` |
| `profiles.person_account_links` | LEE | LEE | DIRECTA | PrescriptionFavoritesController.remove → PrescriptionFavoritesService.remove → ProfileOwnershipService.requireOwnPractitionerProfileId → ProfileOwnershipService.personOf → PersonAccountLinksRepository.findActiveByUser | `src/modules/profiles/repositories/person-account-links.repository.ts:80` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<void>` · HTTP `HttpStatus.NO_CONTENT`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 21. GET /referrals

- **Origen:** CONTRATO
- **Nombre:** Listar derivaciones de un paciente
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** BAJO — Sólo lee
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.listByPatient` — `src/modules/clinical_ext/controllers/referrals.controller.ts:67`

### Qué es y para qué sirve (negocio)

Listar derivaciones de un paciente. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`GET /referrals` la atiende `ReferralsController.listByPatient` (src/modules/clinical_ext/controllers/referrals.controller.ts:67). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `ReferralsService.listByPatient`. Lee clinical_ext.referrals.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:67` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_QUERY | patientProfileId (obligatorio) | `contrato (parameters)` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.listByPatient → ReferralsService.listByPatient → ReferralsRepository.findByPatient | `src/modules/clinical_ext/repositories/referrals.repository.ts:113` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `patientProfileId` | query | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `no declarado`

_No se identificó un DTO de respuesta con campos._

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 22. POST /referrals

- **Origen:** CONTRATO
- **Nombre:** Emitir una referencia desde un encuentro
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.create` — `src/modules/clinical_ext/controllers/referrals.controller.ts:40`

### Qué es y para qué sirve (negocio)

Emitir una referencia desde un encuentro. Caso de uso UC-18-07: Emitir referencia. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:21`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /referrals` la atiende `ReferralsController.create` (src/modules/clinical_ext/controllers/referrals.controller.ts:40). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `ClinicalExtCreateReferralDto` (10 campos, 1 obligatorio). Delega en `ReferralsService.create`. Crea filas en clinical_ext.referrals. Lee clinical_ext.referrals.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:40` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.referrals` | ESCRIBE | CREA | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsRepository.create | `src/modules/clinical_ext/repositories/referrals.repository.ts:121` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.create → ReferralsService.create → ReferralsRepository.findDuplicate | `src/modules/clinical_ext/repositories/referrals.repository.ts:83` |

### Cuerpo — DTO `ClinicalExtCreateReferralDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `patientProfileId` | `string` | Sí | formato uuid | `@IsUUID()` | — | `src/modules/clinical_ext/dto/referral.dto.ts:19` |
| `sourceEncounterId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Encuentro origen | `src/modules/clinical_ext/dto/referral.dto.ts:27` |
| `referringProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional que deriva | `src/modules/clinical_ext/dto/referral.dto.ts:38` |
| `targetProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Profesional destino | `src/modules/clinical_ext/dto/referral.dto.ts:46` |
| `targetTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant destino (referencia inter-tenant) | `src/modules/clinical_ext/dto/referral.dto.ts:57` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Especialidad destino (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:68` |
| `reasonConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Motivo codificado (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:79` |
| `reasonText` | `string` | No | longitud máxima 1000 | `@IsOptional()` `@IsString()` `@MaxLength(1000)` | — | `src/modules/clinical_ext/dto/referral.dto.ts:88` |
| `priorityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Prioridad (concept id) | `src/modules/clinical_ext/dto/referral.dto.ts:99` |
| `validUntil` | `string` | No | formato date | `@IsOptional()` `@IsISO8601()` | Vigencia de la referencia | `src/modules/clinical_ext/dto/referral.dto.ts:111` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "patientProfileId": "00000000-0000-4000-8000-000000000001",
  "sourceEncounterId": "00000000-0000-4000-8000-000000000001",
  "referringProfileId": "00000000-0000-4000-8000-000000000001",
  "targetProfileId": "00000000-0000-4000-8000-000000000001",
  "targetTenantId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonConceptId": "00000000-0000-4000-8000-000000000001",
  "reasonText": "Texto descriptivo de ejemplo",
  "priorityConceptId": "00000000-0000-4000-8000-000000000001",
  "validUntil": "2026-07-31"
}
```

</details>

### Respuesta — `Promise<ReferralResponseDto>` · DTO `ReferralResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/referral.dto.ts:133` |
| `referralCode` | `string` | Sí | — | — | Código a compartir | sin fuente |
| `statusConceptId` | `string` | Sí | formato uuid | — | Identificador asociado a status concept. | `src/modules/clinical_ext/dto/referral.dto.ts:148` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:28` |

### Flujos

_Se completa en la fase de flujos._

---

## 23. PATCH /referrals/{id}/respond

- **Origen:** CONTRATO
- **Nombre:** Responder / aceptar una referencia inter-tenant
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ReferralsController.respond` — `src/modules/clinical_ext/controllers/referrals.controller.ts:51`

### Qué es y para qué sirve (negocio)

Responder / aceptar una referencia inter-tenant. Caso de uso UC-18-08: Aceptar / rechazar referencia inter-tenant. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:22`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /referrals/{id}/respond` la atiende `ReferralsController.respond` (src/modules/clinical_ext/controllers/referrals.controller.ts:51). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `RespondReferralDto` (1 campo, 1 obligatorio). Delega en `ReferralsService.respond`. Actualiza clinical_ext.referrals. Lee clinical_ext.referrals.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/referrals.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/referrals.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.referrals` | ESCRIBE | ACTUALIZA | POR_TIPO | ReferralsController.respond → ReferralsService.respond | `src/modules/clinical_ext/services/referrals.service.ts:128` |
| `clinical_ext.referrals` | LEE | LEE | DIRECTA | ReferralsController.respond → ReferralsService.respond → ReferralsRepository.findById | `src/modules/clinical_ext/repositories/referrals.repository.ts:73` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `RespondReferralDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: ACCEPT, REJECT | `@IsIn(['ACCEPT', 'REJECT'])` | Decisión del tenant destino | `src/modules/clinical_ext/dto/referral.dto.ts:124` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "ACCEPT"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "ACCEPT"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/clinical_ext/dto/operation-result.dto.ts:9` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/referrals.controller.spec.ts:35` |

### Flujos

_Se completa en la fase de flujos._

---

## 24. POST /virtual-encounters

- **Origen:** CONTRATO
- **Nombre:** Iniciar una sesión de telesalud
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VirtualEncountersController.create` — `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:39`

### Qué es y para qué sirve (negocio)

Iniciar una sesión de telesalud. Caso de uso UC-18-12: Telesalud: iniciar / unirse / finalizar. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/clinical_ext/README.md:26`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`POST /virtual-encounters` la atiende `VirtualEncountersController.create` (src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:39). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `CreateVirtualEncounterDto` (4 campos, 1 obligatorio). Delega en `VirtualEncountersService.create`. Crea filas en clinical_ext.virtual_encounters. Lee clinical_ext.virtual_encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.virtual_encounters` | ESCRIBE | CREA | DIRECTA | VirtualEncountersController.create → VirtualEncountersService.create → VirtualEncountersRepository.create | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:67` |
| `clinical_ext.virtual_encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.create → VirtualEncountersService.create → VirtualEncountersRepository.findByEncounter | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:53` |

### Cuerpo — DTO `CreateVirtualEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `encounterId` | `string` | Sí | formato uuid | `@IsUUID()` | Encuentro clínico (1:1) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:11` |
| `platformConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Plataforma de telesalud (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:22` |
| `meetingUrl` | `string` | No | longitud máxima 2000 | `@IsOptional()` `@IsString()` `@MaxLength(2000)` | URL de la reunión | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:31` |
| `meetingId` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Identificador de la reunión | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:40` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "encounterId": "00000000-0000-4000-8000-000000000001",
  "platformConceptId": "00000000-0000-4000-8000-000000000001",
  "meetingUrl": "valor-ejemplo",
  "meetingId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VirtualEncounterResponseDto>` · DTO `VirtualEncounterResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:63` |
| `encounterId` | `string` | Sí | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:69` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:78` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/virtual-encounters.controller.spec.ts:34` |

### Flujos

_Se completa en la fase de flujos._

---

## 25. PATCH /virtual-encounters/{id}/end

- **Origen:** CONTRATO
- **Nombre:** Finalizar una sesión de telesalud
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VirtualEncountersController.end` — `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:61`

### Qué es y para qué sirve (negocio)

Finalizar una sesión de telesalud. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /virtual-encounters/{id}/end` la atiende `VirtualEncountersController.end` (src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:61). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Valida el cuerpo como `EndVirtualEncounterDto` (1 campo, 0 obligatorios). Delega en `VirtualEncountersService.end`. Actualiza clinical_ext.virtual_encounters. Lee clinical_ext.virtual_encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:61` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:61` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.virtual_encounters` | ESCRIBE | ACTUALIZA | POR_TIPO | VirtualEncountersController.end → VirtualEncountersService.end | `src/modules/clinical_ext/services/virtual-encounters.service.ts:140` |
| `clinical_ext.virtual_encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.end → VirtualEncountersService.end → VirtualEncountersRepository.findById | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `EndVirtualEncounterDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `recordingFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Manifiesto de grabación (common.files) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:54` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "recordingFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<VirtualEncounterResponseDto>` · DTO `VirtualEncounterResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:63` |
| `encounterId` | `string` | Sí | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:69` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:78` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/virtual-encounters.controller.spec.ts:47` |

### Flujos

_Se completa en la fase de flujos._

---

## 26. PATCH /virtual-encounters/{id}/join

- **Origen:** CONTRATO
- **Nombre:** Unirse a una sesión de telesalud
- **Bloque:** Clínico y Diagnóstico
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `VirtualEncountersController.join` — `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:50`

### Qué es y para qué sirve (negocio)

Unirse a una sesión de telesalud. Dominio: Clínico y Diagnóstico.

_Fuentes:_ CONTRATO (`summary de la operación`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:29`)

### Cómo se atiende (sistema)

`PATCH /virtual-encounters/{id}/join` la atiende `VirtualEncountersController.join` (src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:50). Exige sesión con alguno de los roles CLINICIAN, PRACTITIONER. Delega en `VirtualEncountersService.join`. Actualiza clinical_ext.virtual_encounters. Lee clinical_ext.virtual_encounters.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: CLINICIAN, PRACTITIONER | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/clinical_ext/controllers/virtual-encounters.controller.ts:50` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `clinical_ext.virtual_encounters` | ESCRIBE | ACTUALIZA | POR_TIPO | VirtualEncountersController.join → VirtualEncountersService.join | `src/modules/clinical_ext/services/virtual-encounters.service.ts:106` |
| `clinical_ext.virtual_encounters` | LEE | LEE | DIRECTA | VirtualEncountersController.join → VirtualEncountersService.join → VirtualEncountersRepository.findById | `src/modules/clinical_ext/repositories/virtual-encounters.repository.ts:45` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<VirtualEncounterResponseDto>` · DTO `VirtualEncounterResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:63` |
| `encounterId` | `string` | Sí | formato uuid | — | Identificador asociado a encounter. | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:69` |
| `statusConceptId` | `string` | Sí | formato uuid | — | Estado de la sesión (concept id) | `src/modules/clinical_ext/dto/virtual-encounter.dto.ts:78` |

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/clinical_ext/controllers/virtual-encounters.controller.spec.ts:40` |

### Flujos

_Se completa en la fase de flujos._

---

