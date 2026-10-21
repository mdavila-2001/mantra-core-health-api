<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `content_packs`

- **Bloque:** —
- **Operaciones:** 2 (2 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 0 · MEDIO 1 · BAJO 1
- **Tablas distintas que tocan:** 29
- **Respuestas de error y detalle contractual:** `openapi/endpoints/content-packs.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/content-packs` | Paquetes de contenido disponibles | BAJO | 0 | SUPERADMIN |
| 2 | POST | `/admin/content-packs/{code}/apply` | Aplicar un paquete de contenido | MEDIO | 49 | SUPERADMIN |

---

## 1. GET /admin/content-packs

- **Origen:** CONTRATO
- **Nombre:** Paquetes de contenido disponibles
- **Bloque:** —
- **Riesgo:** BAJO — No toca tablas relacionales
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ContentPacksController.listar` — `src/modules/content_packs/content-packs.controller.ts:43`

### Qué es y para qué sirve (negocio)

Paquetes de contenido disponibles.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`GET /admin/content-packs` la atiende `ContentPacksController.listar` (src/modules/content_packs/content-packs.controller.ts:43). Exige sesión con alguno de los roles SUPERADMIN. No toca tablas relacionales: el handler no invoca ningún servicio.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPERADMIN | `src/modules/content_packs/content-packs.controller.ts:43` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

No toca tablas relacionales: el handler no invoca ningún servicio. _(automática; fuente: `src/modules/content_packs/content-packs.controller.ts:43`)_

### Cuerpo

La operación no recibe cuerpo.

### Respuesta — `ListContentPacksResponseDto` · DTO `ListContentPacksResponseDto`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `items` | `array<ContentPackDto>` | Sí | — | — | Los paquetes disponibles. | `src/modules/content_packs/dto/content-packs.dto.ts:37` |
| `items[].code` | `string` | Sí | — | — | Código del paquete | `src/modules/content_packs/dto/content-packs.dto.ts:12` |
| `items[].name` | `string` | Sí | — | — | Nombre legible del paquete | `src/modules/content_packs/dto/content-packs.dto.ts:16` |
| `items[].description` | `string` | Sí | — | — | Qué contiene el paquete | `src/modules/content_packs/dto/content-packs.dto.ts:20` |
| `items[].approxRows` | `number` | Sí | — | — | Filas que trae, en orden de magnitud | `src/modules/content_packs/dto/content-packs.dto.ts:24` |
| `items[].requiresDemoPassword` | `boolean` | Sí | — | — | Si el paquete crea cuentas y necesita una contraseña | `src/modules/content_packs/dto/content-packs.dto.ts:30` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

## 2. POST /admin/content-packs/{code}/apply

- **Origen:** CONTRATO
- **Nombre:** Aplicar un paquete de contenido
- **Bloque:** —
- **Riesgo:** MEDIO — Escribe en la base, con roles declarados
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ContentPacksController.aplicar` — `src/modules/content_packs/content-packs.controller.ts:69`

### Qué es y para qué sirve (negocio)

Aplicar un paquete de contenido.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/content-packs/{code}/apply` la atiende `ContentPacksController.aplicar` (src/modules/content_packs/content-packs.controller.ts:69). Exige sesión con alguno de los roles SUPERADMIN. Valida el cuerpo como `ApplyContentPackDto` (1 campo, 0 obligatorios). Delega en `ContentPacksService.aplicar`. Crea filas en authz.user_role_assignments, chart.specialty_chart_templates, clinical_ext.drug_interactions, common.contact_points, directory.tenant_memberships, directory.tenants, forms.dynamic_field_definitions, forms.dynamic_field_sections y 20 más. Actualiza chart.specialty_chart_templates, forms.field_assignments. Lee authz.roles, authz.user_role_assignments, chart.specialty_chart_templates, clinical_ext.drug_interactions, directory.tenant_memberships, forms.dynamic_field_definitions, forms.extension_target_policies, forms.field_assignments y 11 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPERADMIN | `src/modules/content_packs/content-packs.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:251` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:140` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/main.ts:159` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:134` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureRole | `src/common/seed/provider-accounts-seed.service.ts:221` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureRole | `src/common/seed/provider-accounts-seed.service.ts:237` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureRole | `src/common/seed/provider-accounts-seed.service.ts:230` |
| `chart.specialty_chart_templates` | ESCRIBE | ACTUALIZA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.reapuntarAlModelo | `src/common/seed/clinical-forms-seed.service.ts:413` |
| `chart.specialty_chart_templates` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm | `src/common/seed/clinical-forms-seed.service.ts:595` |
| `chart.specialty_chart_templates` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm | `src/common/seed/clinical-forms-seed.service.ts:562` |
| `clinical_ext.drug_interactions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedInteractions | `src/common/seed/vademecum-seed.service.ts:335` |
| `clinical_ext.drug_interactions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedInteractions | `src/common/seed/vademecum-seed.service.ts:334` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:135` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureMembership | `src/common/seed/provider-accounts-seed.service.ts:192` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureMembership | `src/common/seed/provider-accounts-seed.service.ts:186` |
| `directory.tenants` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedTenants | `src/common/seed/bolivia-insurance-seed.service.ts:206` |
| `forms.dynamic_field_definitions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:722` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:721` |
| `forms.dynamic_field_sections` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm | `src/common/seed/clinical-forms-seed.service.ts:572` |
| `forms.extension_target_policies` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:476` |
| `forms.extension_target_policies` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:453` |
| `forms.field_assignments` | ESCRIBE | ACTUALIZA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.reconciliarVersion | `src/common/seed/clinical-forms-seed.service.ts:677` |
| `forms.field_assignments` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:743` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:741` |
| `forms.field_definition_sets` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:459` |
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:458` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → CredentialsRepository.createPassword | `src/modules/iam/repositories/credentials.repository.ts:183` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount | `src/common/seed/provider-accounts-seed.service.ts:143` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → SecurityEventsRepository.record | `src/modules/iam/repositories/security-events.repository.ts:42` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → UserGlobalRolesRepository.create | `src/modules/iam/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ContentPacksService.correrCuentasDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → UsersRepository.create | `src/modules/iam/repositories/users.repository.ts:49` |
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedCarriers | `src/common/seed/bolivia-insurance-seed.service.ts:246` |
| `insurance.insurance_plans` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedPlans | `src/common/seed/bolivia-insurance-seed.service.ts:332` |
| `insurance.insurance_products` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedProducts | `src/common/seed/bolivia-insurance-seed.service.ts:287` |
| `terminology.catalog_concepts` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → GlossarySeedService.run | `src/common/seed/glossary-seed.service.ts:182` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedConcepts | `src/common/seed/vademecum-seed.service.ts:223` |
| `terminology.code_system_versions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedVersion | `src/common/seed/vademecum-seed.service.ts:201` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedVersion | `src/common/seed/vademecum-seed.service.ts:200` |
| `terminology.code_systems` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedCodeSystem | `src/common/seed/vademecum-seed.service.ts:175` |
| `terminology.code_systems` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedCodeSystem | `src/common/seed/vademecum-seed.service.ts:174` |
| `terminology.concept_designations` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → GlossarySeedService.run → GlossarySeedService.seedDesignations | `src/common/seed/glossary-seed.service.ts:272` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedDesignations | `src/common/seed/vademecum-seed.service.ts:263` |
| `terminology.concept_properties` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → GlossarySeedService.run → GlossarySeedService.seedProperties | `src/common/seed/glossary-seed.service.ts:337` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedProperties | `src/common/seed/vademecum-seed.service.ts:299` |
| `terminology.concept_relationships` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → GlossarySeedService.run → GlossarySeedService.seedRelationships | `src/common/seed/glossary-seed.service.ts:538` |
| `terminology.terminology_sources` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedSources | `src/common/seed/vademecum-seed.service.ts:151` |
| `terminology.terminology_sources` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → VademecumSeedService.run → VademecumSeedService.seedSources | `src/common/seed/vademecum-seed.service.ts:150` |
| `terminology.value_set_members` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → GlossarySeedService.run → GlossarySeedService.seedMemberships | `src/common/seed/glossary-seed.service.ts:429` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.resolverEspecialidades → ValueSetsRepository.findIncludedConceptIdsByValueSet | `src/modules/terminology/repositories/value-sets.repository.ts:326` |
| `terminology.value_set_versions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → GlossarySeedService.run | `src/common/seed/glossary-seed.service.ts:156` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.resolverEspecialidades → ValueSetsRepository.findIncludedConceptIdsByValueSet → ValueSetsRepository.findDefaultVersion | `src/modules/terminology/repositories/value-sets.repository.ts:500` |
| `terminology.value_sets` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → GlossarySeedService.run | `src/common/seed/glossary-seed.service.ts:128` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.aplicar → ContentPacksService.correr → ClinicalFormsSeedService.run → ClinicalFormsSeedService.resolverEspecialidades → ValueSetsRepository.findByInternalCode | `src/modules/terminology/repositories/value-sets.repository.ts:110` |

### Parámetros

| Nombre | En | Obligatorio | Tipo | Descripción |
|---|---|---|---|---|
| `code` | path | Sí | `string` | — |

### Cuerpo — DTO `ApplyContentPackDto` · `application/json`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `demoPassword` | `string` | No | longitud mínima 8; longitud máxima 200 | `@IsOptional()` `@IsString()` `@MinLength(MIN_PASSWORD)` `@MaxLength(MAX_PASSWORD)` | Contraseña de las cuentas de demostración | `src/modules/content_packs/dto/content-packs.dto.ts:58` |

**Payload mínimo** (sólo los obligatorios):

```json
{}
```

<details><summary>Payload completo de ejemplo</summary>

```json
{
  "demoPassword": "ClaveSegura2026!"
}
```

</details>

### Respuesta — `Promise<ApplyContentPackResponseDto>` · DTO `ApplyContentPackResponseDto` · HTTP `HttpStatus.OK`

| Campo | Tipo | Obligatorio | Restricciones | Decoradores | Descripción | Fuente |
|---|---|---|---|---|---|---|
| `code` | `string` | Sí | — | — | Código del paquete aplicado | `src/modules/content_packs/dto/content-packs.dto.ts:65` |
| `inserted` | `number` | Sí | admite null | — | Filas nuevas; cero significa que el contenido ya estaba | `src/modules/content_packs/dto/content-packs.dto.ts:78` |
| `tookMs` | `number` | Sí | — | — | Duración de la aplicación en milisegundos | `src/modules/content_packs/dto/content-packs.dto.ts:82` |
| `counters` | `object` | Sí | — | — | Contadores por tipo de fila, con la forma propia del paquete | `src/modules/content_packs/dto/content-packs.dto.ts:89` |

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

_Se completa en la fase de flujos._

---

