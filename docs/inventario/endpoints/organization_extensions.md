<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `organization_extensions`

- **Bloque:** Práctica y Agenda (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)
- **Operaciones:** 9 (9 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 9 · BAJO 0
- **Tablas distintas que tocan:** 5
- **Respuestas de error y detalle contractual:** `openapi/endpoints/organization-extensions.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | POST | `/orgext/affiliations` | Declarar afiliación entre organizaciones | MEDIO | 3 | SECURITY_ADMIN |
| 2 | POST | `/orgext/affiliations/{id}/terminate` | Terminar afiliación y revocar acceso | MEDIO | 2 | SECURITY_ADMIN |
| 3 | POST | `/orgext/data-boundaries` | Definir frontera de datos (residencia/RLS) | MEDIO | 2 | SECURITY_ADMIN |
| 4 | POST | `/orgext/facility-licenses` | Registrar licencia de instalación | MEDIO | 2 | SECURITY_ADMIN |
| 5 | POST | `/orgext/facility-licenses/{id}/verify` | Verificar / rechazar licencia | MEDIO | 2 | SECURITY_ADMIN |
| 6 | POST | `/orgext/hospitals` | Especializar practice/tenant como hospital | MEDIO | 2 | SECURITY_ADMIN |
| 7 | POST | `/orgext/hospitals/{id}/activate` | Activar hospital y publicar perfil | MEDIO | 3 | SECURITY_ADMIN |
| 8 | POST | `/orgext/hospitals/{id}/service-lines` | Definir línea de servicio hospitalaria | MEDIO | 2 | SECURITY_ADMIN |
| 9 | DELETE | `/orgext/hospitals/{id}/service-lines/{lineId}` | Retirar (soft-delete) línea de servicio | MEDIO | 2 | SECURITY_ADMIN |

---

## 1. POST /orgext/affiliations

- **Origen:** CONTRATO
- **Nombre:** Declarar afiliación entre organizaciones
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextAffiliationsController.declare` — `src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts:37`

### Qué es y para qué sirve (negocio)

Declarar afiliación entre organizaciones. Caso de uso UC-22-07: Declarar afiliación (incluye guard de frontera de datos). Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:17`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/affiliations` la atiende `OrgextAffiliationsController.declare` (src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts:37). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateAffiliationDto` (9 campos, 2 obligatorios). Delega en `OrgextAffiliationsService.declare`. Crea filas en organization_extensions.organization_affiliations. Lee organization_extensions.organization_affiliations, organization_extensions.organization_data_boundaries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts:37` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.organization_affiliations` | ESCRIBE | CREA | DIRECTA | OrgextAffiliationsController.declare → OrgextAffiliationsService.declare → OrganizationAffiliationsRepository.create | `src/modules/organization_extensions/repositories/organization-affiliations.repository.ts:89` |
| `organization_extensions.organization_affiliations` | LEE | LEE | DIRECTA | OrgextAffiliationsController.declare → OrgextAffiliationsService.declare → OrganizationAffiliationsRepository.findActiveDuplicate | `src/modules/organization_extensions/repositories/organization-affiliations.repository.ts:76` |
| `organization_extensions.organization_data_boundaries` | LEE | LEE | DIRECTA | OrgextAffiliationsController.declare → OrgextAffiliationsService.declare → OrganizationDataBoundariesRepository.countActiveForTenant | `src/modules/organization_extensions/repositories/organization-data-boundaries.repository.ts:84` |

### Cuerpo — DTO `CreateAffiliationDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `primaryTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant primario (organizador) | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:17` |
| `participatingTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant participante | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:24` |
| `affiliationTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de afiliación (concepto) | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:35` |
| `hostPracticeSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de práctica anfitrión | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:46` |
| `healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio de salud implicado | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:57` |
| `contractReference` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Referencia de contrato | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:69` |
| `dataUseAgreementId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Acuerdo de uso de datos (DUA) firmado | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:80` |
| `validFrom` | `string` | No | — | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date-time) | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:88` |
| `validTo` | `string` | No | — | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date-time) | `src/modules/organization_extensions/dto/create-affiliation.dto.ts:96` |

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
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:82` |
| `practitionerProfileId` | `string` | Sí | formato uuid | — | Identificador asociado a practitioner profile. | sin fuente |
| `organizationName` | `string` | Sí | — | — | Institución. | sin fuente |
| `roleTitle` | `string` | Sí | — | — | Cargo. | sin fuente |
| `departmentText` | `string` | No | admite null | — | Servicio o departamento. | sin fuente |
| `practiceSiteId` | `string` | No | formato uuid; admite null | — | Sede de la plataforma, si la institución está dentro. | sin fuente |
| `affiliationTypeConceptId` | `string` | No | formato uuid; admite null | — | Tipo de vínculo. | sin fuente |
| `startDate` | `string` | Sí | formato date | — | Inicio del vínculo. | sin fuente |
| `endDate` | `string` | No | formato date; admite null | — | Fin del vínculo, o `null` si sigue vigente. | sin fuente |
| `current` | `boolean` | Sí | — | — | Derivado de `endDate`: sin fin declarado, sigue vigente | sin fuente |
| `status` | `string` | Sí | formato uuid | — | Estado del registro (concept id). | `src/modules/organization_extensions/dto/responses.dto.ts:95` |
| `statusKind` | `object` | Sí | valores: pendiente, declarado, aprobado, rechazado, revocado, desconocido | — | El mismo estado, en algo sobre lo que una pantalla pueda ramificar. El concept id sigue viajando en `status` y es la verdad; esto es una derivación de conveniencia. Existe porque la alternativa era que el frontend comparara uuids escritos a mano, que es exactamente lo que el proyecto prohíbe: los conceptos se resuelven en el servidor. `desconocido` cuando el estado no es ninguno de los tres esperados. Es preferible a suponer: cuando exista el value set de estados —donde entra `declarado`— las pantallas que ya distinguen los casos conocidos no van a mentir sobre el nuevo, van a decir que no lo reconocen. | sin fuente |
| `decisionReasonText` | `string` | No | admite null | — | Por qué la organización rechazó o dio de baja el vínculo. **Lo lee el profesional**, no es una nota interna. Un rechazo sin motivo es mudo para quien lo recibe, y quien lo escribe tiene que saber que se lee. `null` en cualquier otro estado. | sin fuente |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/organization_extensions/dto/responses.dto.ts:99` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una afiliación activa de ese tipo |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El tenant primario y el participante deben ser distintos; PreconditionFailedException: El tenant participante no tiene una frontera de datos activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-affiliations.controller.spec.ts:31` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-07`

---

## 2. POST /orgext/affiliations/{id}/terminate

- **Origen:** CONTRATO
- **Nombre:** Terminar afiliación y revocar acceso
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextAffiliationsController.terminate` — `src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts:49`

### Qué es y para qué sirve (negocio)

Terminar afiliación y revocar acceso. Caso de uso UC-22-09: Terminar afiliación y revocar acceso. Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:19`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/affiliations/{id}/terminate` la atiende `OrgextAffiliationsController.terminate` (src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts:49). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `OrgextAffiliationsService.terminate`. Actualiza organization_extensions.organization_affiliations. Lee organization_extensions.organization_affiliations.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts:49` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/organization_extensions/controllers/orgext-affiliations.controller.ts:49` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.organization_affiliations` | ESCRIBE | ACTUALIZA | POR_TIPO | OrgextAffiliationsController.terminate → OrgextAffiliationsService.terminate | `src/modules/organization_extensions/services/orgext-affiliations.service.ts:162` |
| `organization_extensions.organization_affiliations` | LEE | LEE | DIRECTA | OrgextAffiliationsController.terminate → OrgextAffiliationsService.terminate → OrganizationAffiliationsRepository.findById | `src/modules/organization_extensions/repositories/organization-affiliations.repository.ts:65` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/organization_extensions/dto/responses.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Afiliación no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La afiliación no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-affiliations.controller.spec.ts:39` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-09`

---

## 3. POST /orgext/data-boundaries

- **Origen:** CONTRATO
- **Nombre:** Definir frontera de datos (residencia/RLS)
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextDataBoundariesController.define` — `src/modules/organization_extensions/controllers/orgext-data-boundaries.controller.ts:25`

### Qué es y para qué sirve (negocio)

Definir frontera de datos (residencia/RLS). Caso de uso UC-22-08: Definir frontera de datos (residencia/RLS). Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:18`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/data-boundaries` la atiende `OrgextDataBoundariesController.define` (src/modules/organization_extensions/controllers/orgext-data-boundaries.controller.ts:25). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateDataBoundaryDto` (10 campos, 2 obligatorios). Delega en `OrgextDataBoundariesService.define`. Crea filas en organization_extensions.organization_data_boundaries. Lee organization_extensions.organization_data_boundaries.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-data-boundaries.controller.ts:25` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.organization_data_boundaries` | ESCRIBE | CREA | DIRECTA | OrgextDataBoundariesController.define → OrgextDataBoundariesService.define → OrganizationDataBoundariesRepository.create | `src/modules/organization_extensions/repositories/organization-data-boundaries.repository.ts:95` |
| `organization_extensions.organization_data_boundaries` | LEE | LEE | DIRECTA | OrgextDataBoundariesController.define → OrgextDataBoundariesService.define → OrganizationDataBoundariesRepository.findActiveByTenantAndType | `src/modules/organization_extensions/repositories/organization-data-boundaries.repository.ts:71` |

### Cuerpo — DTO `CreateDataBoundaryDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant al que aplica la frontera | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:20` |
| `boundaryTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de frontera (concepto) | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:31` |
| `dataControllerTenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant controlador de datos | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:38` |
| `dataProcessorTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant procesador de datos | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:49` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción (concepto) | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:60` |
| `residencyRegionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Región de residencia (concepto) | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:71` |
| `allowedPurposeValueSetId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Value set de propósitos permitidos | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:82` |
| `isolationSchemaName` | `string` | No | longitud máxima 120 | `@IsOptional()` `@IsString()` `@MaxLength(120)` | Nombre del schema de aislamiento | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:94` |
| `isolationPolicyVersion` | `string` | No | longitud máxima 40 | `@IsOptional()` `@IsString()` `@MaxLength(40)` | Versión de la política de aislamiento | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:106` |
| `effectiveFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Efectivo desde (ISO date-time); por defecto ahora | `src/modules/organization_extensions/dto/create-data-boundary.dto.ts:116` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "dataControllerTenantId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "boundaryTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "dataControllerTenantId": "00000000-0000-4000-8000-000000000001",
  "dataProcessorTenantId": "00000000-0000-4000-8000-000000000001",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "residencyRegionConceptId": "00000000-0000-4000-8000-000000000001",
  "allowedPurposeValueSetId": "00000000-0000-4000-8000-000000000001",
  "isolationSchemaName": "Nombre de ejemplo",
  "isolationPolicyVersion": "valor-ejemplo",
  "effectiveFrom": "2026-07-31T12:00:00.000Z"
}
```

</details>

### Respuesta — `Promise<DataBoundaryResponseDto>` · DTO `DataBoundaryResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:107` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/organization_extensions/dto/responses.dto.ts:111` |
| `status` | `string` | Sí | formato uuid | — | Estado (concepto) | `src/modules/organization_extensions/dto/responses.dto.ts:116` |
| `effectiveFrom` | `string` | Sí | formato date-time | — | Valor de effective from mantenido por la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:120` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/organization_extensions/dto/responses.dto.ts:124` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una frontera de datos activa de ese tipo para el tenant |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-data-boundaries.controller.spec.ts:31` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-08`

---

## 4. POST /orgext/facility-licenses

- **Origen:** CONTRATO
- **Nombre:** Registrar licencia de instalación
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextFacilityLicensesController.register` — `src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts:38`

### Qué es y para qué sirve (negocio)

Registrar licencia de instalación. Caso de uso UC-22-05: Registrar licencia de instalación (pendiente). Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:15`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/facility-licenses` la atiende `OrgextFacilityLicensesController.register` (src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts:38). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateFacilityLicenseDto` (11 campos, 2 obligatorios). Delega en `OrgextFacilityLicensesService.register`. Crea filas en organization_extensions.facility_licenses. Lee organization_extensions.facility_licenses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts:38` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.facility_licenses` | ESCRIBE | CREA | DIRECTA | OrgextFacilityLicensesController.register → OrgextFacilityLicensesService.register → FacilityLicensesRepository.create | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:101` |
| `organization_extensions.facility_licenses` | LEE | LEE | DIRECTA | OrgextFacilityLicensesController.register → OrgextFacilityLicensesService.register → FacilityLicensesRepository.findByNumber | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:80` |

### Cuerpo — DTO `CreateFacilityLicenseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant (directory) titular de la licencia | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:21` |
| `practiceSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de práctica de la instalación | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:32` |
| `facilityTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de instalación (concepto) | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:43` |
| `licenseTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de licencia (concepto) | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:54` |
| `licenseNumber` | `string` | Sí | longitud mínima 1; longitud máxima 120 | `@IsString()` `@MinLength(1)` `@MaxLength(120)` | Número de licencia | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:63` |
| `issuingAuthorityTenantId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tenant de la autoridad emisora | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:74` |
| `issuingAuthorityName` | `string` | No | longitud máxima 200 | `@IsOptional()` `@IsString()` `@MaxLength(200)` | Nombre de la autoridad emisora | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:86` |
| `jurisdictionConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Jurisdicción (concepto) | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:97` |
| `validFrom` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente desde (ISO date) | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:105` |
| `validTo` | `string` | No | formato date-time | `@IsOptional()` `@IsDateString()` | Vigente hasta (ISO date) | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:113` |
| `evidenceFileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Archivo de evidencia | `src/modules/organization_extensions/dto/create-facility-license.dto.ts:121` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "licenseNumber": "valor-ejemplo"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceSiteId": "00000000-0000-4000-8000-000000000001",
  "facilityTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "licenseTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "licenseNumber": "valor-ejemplo",
  "issuingAuthorityTenantId": "00000000-0000-4000-8000-000000000001",
  "issuingAuthorityName": "Nombre de ejemplo",
  "jurisdictionConceptId": "00000000-0000-4000-8000-000000000001",
  "validFrom": "2026-07-31T12:00:00.000Z",
  "validTo": "2026-07-31T12:00:00.000Z",
  "evidenceFileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<FacilityLicenseResponseDto>` · DTO `FacilityLicenseResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:54` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/organization_extensions/dto/responses.dto.ts:58` |
| `licenseNumber` | `string` | Sí | — | — | Valor de license number mantenido por la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:62` |
| `verificationStatus` | `string` | Sí | formato uuid | — | Estado de verificación (concepto) | `src/modules/organization_extensions/dto/responses.dto.ts:70` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/organization_extensions/dto/responses.dto.ts:74` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: Ya existe una licencia con ese número para el tipo indicado |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.spec.ts:31` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-05`

---

## 5. POST /orgext/facility-licenses/{id}/verify

- **Origen:** CONTRATO
- **Nombre:** Verificar / rechazar licencia
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextFacilityLicensesController.verify` — `src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts:50`

### Qué es y para qué sirve (negocio)

Verificar / rechazar licencia. Caso de uso UC-22-06: Verificar / rechazar licencia. Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:16`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/facility-licenses/{id}/verify` la atiende `OrgextFacilityLicensesController.verify` (src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts:50). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `OrganizationExtensionsVerifyLicenseDto` (1 campo, 1 obligatorio). Delega en `OrgextFacilityLicensesService.verify`. Actualiza organization_extensions.facility_licenses. Lee organization_extensions.facility_licenses.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts:50` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.ts:50` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.facility_licenses` | ESCRIBE | ACTUALIZA | POR_TIPO | OrgextFacilityLicensesController.verify → OrgextFacilityLicensesService.verify | `src/modules/organization_extensions/services/orgext-facility-licenses.service.ts:123` |
| `organization_extensions.facility_licenses` | LEE | LEE | DIRECTA | OrgextFacilityLicensesController.verify → OrgextFacilityLicensesService.verify → FacilityLicensesRepository.findById | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:70` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `OrganizationExtensionsVerifyLicenseDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `decision` | `string` | Sí | valores: VERIFY, REJECT | `@IsIn(['VERIFY', 'REJECT'])` | Decisión de verificación | `src/modules/organization_extensions/dto/verify-license.dto.ts:18` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "decision": "VERIFY"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "decision": "VERIFY"
}
```

</details>

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/organization_extensions/dto/responses.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Licencia no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La licencia no está en estado pendiente |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-facility-licenses.controller.spec.ts:40` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-06`

---

## 6. POST /orgext/hospitals

- **Origen:** CONTRATO
- **Nombre:** Especializar practice/tenant como hospital
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextHospitalsController.specialize` — `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:39`

### Qué es y para qué sirve (negocio)

Especializar practice/tenant como hospital. Caso de uso UC-22-01: Especializar practice/tenant como hospital (estado borrador). Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:11`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/hospitals` la atiende `OrgextHospitalsController.specialize` (src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:39). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateHospitalDto` (9 campos, 2 obligatorios). Delega en `OrgextHospitalsService.specialize`. Crea filas en organization_extensions.hospitals. Lee organization_extensions.hospitals.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:39` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.hospitals` | ESCRIBE | CREA | DIRECTA | OrgextHospitalsController.specialize → OrgextHospitalsService.specialize → HospitalsRepository.create | `src/modules/organization_extensions/repositories/hospitals.repository.ts:81` |
| `organization_extensions.hospitals` | LEE | LEE | DIRECTA | OrgextHospitalsController.specialize → OrgextHospitalsService.specialize → HospitalsRepository.findByTenantOrPractice | `src/modules/organization_extensions/repositories/hospitals.repository.ts:76` |

### Cuerpo — DTO `CreateHospitalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `tenantId` | `string` | Sí | formato uuid | `@IsUUID()` | Tenant (directory) al que pertenece el hospital | `src/modules/organization_extensions/dto/create-hospital.dto.ts:14` |
| `practiceId` | `string` | Sí | formato uuid | `@IsUUID()` | Practice que se especializa como hospital (1:1) | `src/modules/organization_extensions/dto/create-hospital.dto.ts:24` |
| `hospitalTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de hospital (concepto) | `src/modules/organization_extensions/dto/create-hospital.dto.ts:35` |
| `careLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nivel de atención (concepto) | `src/modules/organization_extensions/dto/create-hospital.dto.ts:46` |
| `ownershipTypeConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Tipo de propiedad (concepto) | `src/modules/organization_extensions/dto/create-hospital.dto.ts:57` |
| `teachingStatusConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Estado docente (concepto) | `src/modules/organization_extensions/dto/create-hospital.dto.ts:68` |
| `emergencyCapabilityConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Capacidad de emergencia (concepto) | `src/modules/organization_extensions/dto/create-hospital.dto.ts:79` |
| `licensedBedCapacity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Camas licenciadas | `src/modules/organization_extensions/dto/create-hospital.dto.ts:88` |
| `operationalBedCapacity` | `number` | No | mínimo 0 | `@IsOptional()` `@IsInt()` `@Min(0)` | Camas operativas | `src/modules/organization_extensions/dto/create-hospital.dto.ts:97` |

**Payload mínimo** (sólo los obligatorios):

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001"
}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "tenantId": "00000000-0000-4000-8000-000000000001",
  "practiceId": "00000000-0000-4000-8000-000000000001",
  "hospitalTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "careLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "ownershipTypeConceptId": "00000000-0000-4000-8000-000000000001",
  "teachingStatusConceptId": "00000000-0000-4000-8000-000000000001",
  "emergencyCapabilityConceptId": "00000000-0000-4000-8000-000000000001",
  "licensedBedCapacity": 1,
  "operationalBedCapacity": 1
}
```

</details>

### Respuesta — `Promise<HospitalResponseDto>` · DTO `HospitalResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:8` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/organization_extensions/dto/responses.dto.ts:12` |
| `practiceId` | `string` | Sí | formato uuid | — | Identificador asociado a practice. | `src/modules/organization_extensions/dto/responses.dto.ts:16` |
| `status` | `string` | Sí | formato uuid | — | Estado (concepto) | `src/modules/organization_extensions/dto/responses.dto.ts:21` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/organization_extensions/dto/responses.dto.ts:25` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 409 | `CONFLICT` | ConflictException: El tenant o el practice ya está especializado como hospital |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.spec.ts:34` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-01`

---

## 7. POST /orgext/hospitals/{id}/activate

- **Origen:** CONTRATO
- **Nombre:** Activar hospital y publicar perfil
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextHospitalsController.activate` — `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:51`

### Qué es y para qué sirve (negocio)

Activar hospital y publicar perfil. Caso de uso UC-22-02: Activar hospital (guard: licencia verificada). Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:12`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/hospitals/{id}/activate` la atiende `OrgextHospitalsController.activate` (src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:51). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `ActivateHospitalDto` (2 campos, 0 obligatorios). Delega en `OrgextHospitalsService.activate`. Actualiza organization_extensions.hospitals. Lee organization_extensions.facility_licenses, organization_extensions.hospitals.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:51` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:51` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.facility_licenses` | LEE | LEE | DIRECTA | OrgextHospitalsController.activate → OrgextHospitalsService.activate → FacilityLicensesRepository.countVerifiedForTenant | `src/modules/organization_extensions/repositories/facility-licenses.repository.ts:93` |
| `organization_extensions.hospitals` | ESCRIBE | ACTUALIZA | POR_TIPO | OrgextHospitalsController.activate → OrgextHospitalsService.activate | `src/modules/organization_extensions/services/orgext-hospitals.service.ts:163` |
| `organization_extensions.hospitals` | LEE | LEE | DIRECTA | OrgextHospitalsController.activate → OrgextHospitalsService.activate → HospitalsRepository.findById | `src/modules/organization_extensions/repositories/hospitals.repository.ts:64` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `ActivateHospitalDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `primaryPracticeSiteId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Sitio de práctica principal a fijar | `src/modules/organization_extensions/dto/activate-hospital.dto.ts:15` |
| `publicProfileId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Perfil público a publicar | `src/modules/organization_extensions/dto/activate-hospital.dto.ts:26` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "primaryPracticeSiteId": "00000000-0000-4000-8000-000000000001",
  "publicProfileId": "00000000-0000-4000-8000-000000000001"
}
```

</details>

### Respuesta — `Promise<HospitalResponseDto>` · DTO `HospitalResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:8` |
| `tenantId` | `string` | Sí | formato uuid | — | Identificador asociado a tenant. | `src/modules/organization_extensions/dto/responses.dto.ts:12` |
| `practiceId` | `string` | Sí | formato uuid | — | Identificador asociado a practice. | `src/modules/organization_extensions/dto/responses.dto.ts:16` |
| `status` | `string` | Sí | formato uuid | — | Estado (concepto) | `src/modules/organization_extensions/dto/responses.dto.ts:21` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/organization_extensions/dto/responses.dto.ts:25` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Hospital no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hospital no está en estado borrador/inactivo; PreconditionFailedException: El hospital no tiene ninguna licencia de instalación verificada |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.spec.ts:43` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-02`

---

## 8. POST /orgext/hospitals/{id}/service-lines

- **Origen:** CONTRATO
- **Nombre:** Definir línea de servicio hospitalaria
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextHospitalsController.addServiceLine` — `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:64`

### Qué es y para qué sirve (negocio)

Definir línea de servicio hospitalaria. Caso de uso UC-22-03: Definir línea de servicio (hospital activo). Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:13`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`POST /orgext/hospitals/{id}/service-lines` la atiende `OrgextHospitalsController.addServiceLine` (src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:64). Exige sesión con alguno de los roles SECURITY_ADMIN. Valida el cuerpo como `CreateServiceLineDto` (6 campos, 0 obligatorios). Delega en `OrgextHospitalsService.addServiceLine`. Crea filas en organization_extensions.hospital_service_lines. Lee organization_extensions.hospitals.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:64` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:64` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.hospital_service_lines` | ESCRIBE | CREA | DIRECTA | OrgextHospitalsController.addServiceLine → OrgextHospitalsService.addServiceLine → HospitalServiceLinesRepository.create | `src/modules/organization_extensions/repositories/hospital-service-lines.repository.ts:63` |
| `organization_extensions.hospitals` | LEE | LEE | DIRECTA | OrgextHospitalsController.addServiceLine → OrgextHospitalsService.addServiceLine → HospitalsRepository.findById | `src/modules/organization_extensions/repositories/hospitals.repository.ts:64` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |

### Cuerpo — DTO `CreateServiceLineDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `clinicalUnitId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Unidad clínica asociada | `src/modules/organization_extensions/dto/create-service-line.dto.ts:15` |
| `healthcareServiceId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Servicio de salud asociado | `src/modules/organization_extensions/dto/create-service-line.dto.ts:26` |
| `serviceLineConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Línea de servicio (concepto) | `src/modules/organization_extensions/dto/create-service-line.dto.ts:37` |
| `specialtyConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Especialidad (concepto) | `src/modules/organization_extensions/dto/create-service-line.dto.ts:48` |
| `acuityLevelConceptId` | `string` | No | formato uuid | `@IsOptional()` `@IsUUID()` | Nivel de agudeza (concepto) | `src/modules/organization_extensions/dto/create-service-line.dto.ts:59` |
| `referralRequired` | `boolean` | No | — | `@IsOptional()` `@IsBoolean()` | Requiere referencia/derivación | `src/modules/organization_extensions/dto/create-service-line.dto.ts:67` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "clinicalUnitId": "00000000-0000-4000-8000-000000000001",
  "healthcareServiceId": "00000000-0000-4000-8000-000000000001",
  "serviceLineConceptId": "00000000-0000-4000-8000-000000000001",
  "specialtyConceptId": "00000000-0000-4000-8000-000000000001",
  "acuityLevelConceptId": "00000000-0000-4000-8000-000000000001",
  "referralRequired": true
}
```

</details>

### Respuesta — `Promise<ServiceLineResponseDto>` · DTO `ServiceLineResponseDto` · HTTP `HttpStatus.CREATED`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `id` | `string` | Sí | formato uuid | — | Identificador único de la instancia. | `src/modules/organization_extensions/dto/responses.dto.ts:33` |
| `hospitalId` | `string` | Sí | formato uuid | — | Identificador asociado a hospital. | `src/modules/organization_extensions/dto/responses.dto.ts:37` |
| `status` | `string` | Sí | formato uuid | — | Estado (concepto) | `src/modules/organization_extensions/dto/responses.dto.ts:42` |
| `createdAt` | `string` | Sí | formato date-time | — | Fecha y hora en que se creó el registro. | `src/modules/organization_extensions/dto/responses.dto.ts:46` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 201 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos; El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Hospital no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: El hospital no está activo |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.spec.ts:50` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-03`

---

## 9. DELETE /orgext/hospitals/{id}/service-lines/{lineId}

- **Origen:** CONTRATO
- **Nombre:** Retirar (soft-delete) línea de servicio
- **Bloque:** Práctica y Agenda
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `OrgextHospitalsController.retireServiceLine` — `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:77`

### Qué es y para qué sirve (negocio)

Retirar (soft-delete) línea de servicio. Caso de uso UC-22-04: Retirar (soft-delete) línea de servicio. Dentro del módulo (descripción del modelo, en inglés): «Keeps one generic infrastructure model while giving hospitals, diagnostic units and pharmacies explicit domain identities.» Dominio: Práctica y Agenda.

_Fuentes:_ CONTRATO (`summary de la operación`) · README (`src/modules/organization_extensions/README.md:14`) · MODELO (`Mantra Core Health Context/modules/diagram_22_organization_extensions.puml:12`) · MODELO (`Mantra Core Health Context/docs/architecture/semantic-data-analysis.md:35`)

### Cómo se atiende (sistema)

`DELETE /orgext/hospitals/{id}/service-lines/{lineId}` la atiende `OrgextHospitalsController.retireServiceLine` (src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:77). Exige sesión con alguno de los roles SECURITY_ADMIN. Delega en `OrgextHospitalsService.retireServiceLine`. Actualiza organization_extensions.hospital_service_lines. Lee organization_extensions.hospital_service_lines.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SECURITY_ADMIN | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:77` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| PARAMETRO_RUTA | Deben ser UUID válidos: id, lineId | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.ts:77` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `organization_extensions.hospital_service_lines` | ESCRIBE | ACTUALIZA | POR_TIPO | OrgextHospitalsController.retireServiceLine → OrgextHospitalsService.retireServiceLine | `src/modules/organization_extensions/services/orgext-hospitals.service.ts:259` |
| `organization_extensions.hospital_service_lines` | LEE | LEE | DIRECTA | OrgextHospitalsController.retireServiceLine → OrgextHospitalsService.retireServiceLine → HospitalServiceLinesRepository.findByIdForHospital | `src/modules/organization_extensions/repositories/hospital-service-lines.repository.ts:58` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `id` | path | Sí | `string` | — |
| `lineId` | path | Sí | `string` | — |

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `Promise<StatusResultDto>` · DTO `StatusResultDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `ok` | `boolean` | Sí | — | — | true si la operación se aplicó | `src/modules/organization_extensions/dto/responses.dto.ts:132` |

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | Los parámetros de ruta son UUID válidos |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Línea de servicio no encontrada |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: La línea de servicio no está activa |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/organization_extensions.md).

### Pruebas que la mencionan

| Tipo | Archivo |
|---|---|
| CONTROLADOR | `src/modules/organization_extensions/controllers/orgext-hospitals.controller.spec.ts:60` |

### Flujos

- Módulo 22 — Organization Extensions (Healthcare Organization Specializations) — etapa `UC-22-04`

---

