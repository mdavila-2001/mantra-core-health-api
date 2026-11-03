<!-- AUTOGENERADO por tools/inventario/endpoints.mjs. No editar manualmente. -->

# Endpoints del módulo `content_packs`

- **Bloque:** —
- **Operaciones:** 2 (2 en el contrato, 0 sólo en el código)
- **Riesgo:** ALTO 1 · MEDIO 0 · BAJO 1
- **Tablas distintas que tocan:** 30
- **Respuestas de error y detalle contractual:** `openapi/endpoints/content-packs.md` (generado aparte por `yarn docs:endpoints:generate`)

## Índice

| # | Método | Ruta | Nombre | Riesgo | Tablas | Acceso |
|---|---|---|---|---|---|---|
| 1 | GET | `/admin/content-packs` | Paquetes de contenido disponibles | BAJO | 0 | SUPERADMIN |
| 2 | POST | `/admin/content-packs/{code}/apply` | Aplicar un paquete de contenido | ALTO | 63 | SUPERADMIN |

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
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |

El árbol de decisión completo está en [flujos](../flujos/content_packs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Content Packs — Contenido curado aplicable a demanda — etapa `ctrl:ContentPacksController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

## 2. POST /admin/content-packs/{code}/apply

- **Origen:** CONTRATO
- **Nombre:** Aplicar un paquete de contenido
- **Bloque:** —
- **Riesgo:** ALTO — Borra filas
- **Revisión:** AUTO_DETECTADA · **Datos personales:** SIN_FUENTE
- **Implementación:** `ContentPacksController.aplicar` — `src/modules/content_packs/content-packs.controller.ts:69`

### Qué es y para qué sirve (negocio)

Aplicar un paquete de contenido.

_Fuentes:_ CONTRATO (`summary de la operación`)

### Cómo se atiende (sistema)

`POST /admin/content-packs/{code}/apply` la atiende `ContentPacksController.aplicar` (src/modules/content_packs/content-packs.controller.ts:69). Exige sesión con alguno de los roles SUPERADMIN. Valida el cuerpo como `ApplyContentPackDto` (1 campo, 0 obligatorios). Delega en `ContentPacksService.apply`. Crea filas en authz.user_role_assignments, chart.specialty_chart_templates, clinical_ext.drug_interactions, common.contact_points, community.public_profiles, directory.tenant_memberships, directory.tenants, forms.dynamic_field_definitions y 21 más. Actualiza chart.specialty_chart_templates, community.public_profiles, directory.tenant_memberships, forms.dynamic_field_definitions, forms.field_assignments, terminology.catalog_concepts, terminology.concept_designations, terminology.concept_properties. Borra de terminology.concept_designations, terminology.concept_properties, terminology.concept_relationships, terminology.value_set_members. Lee authz.roles, authz.user_role_assignments, chart.specialty_chart_templates, clinical_ext.drug_interactions, community.public_profiles, directory.tenant_memberships, forms.dynamic_field_definitions, forms.dynamic_field_sections y 14 más.

### Requerimientos

| Tipo | Detalle | Fuente |
|---|---|---|
| AUTENTICACION | JWT Bearer | `contrato (security)` |
| ROL | Alguno de: SUPERADMIN | `src/modules/content_packs/content-packs.controller.ts:69` |
| TENANT | Tenant por cabecera X-Tenant-Id o por la membresía única del actor; 403 si es ambiguo o no le pertenece | `src/app.module.ts:296` |
| CUERPO | application/json (obligatorio); máximo 1mb | `src/main.ts:201` |
| VALIDACION | Se rechazan las propiedades no declaradas en el DTO (whitelist + forbidNonWhitelisted) | `src/common/http/validation-pipe.ts:115` |
| RATE_LIMIT | 300 solicitudes cada 60 s (límite global) | `src/app.module.ts:157` |

### Tablas que afecta

| Tabla | Operación | Detalle | Confianza | Camino | Fuente |
|---|---|---|---|---|---|
| `authz.roles` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureRole | `src/common/seed/provider-accounts-seed.service.ts:239` |
| `authz.user_role_assignments` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureRole | `src/common/seed/provider-accounts-seed.service.ts:255` |
| `authz.user_role_assignments` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureRole | `src/common/seed/provider-accounts-seed.service.ts:248` |
| `chart.specialty_chart_templates` | ESCRIBE | ACTUALIZA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.repointToModel | `src/common/seed/clinical-forms-seed.service.ts:421` |
| `chart.specialty_chart_templates` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm | `src/common/seed/clinical-forms-seed.service.ts:612` |
| `chart.specialty_chart_templates` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm | `src/common/seed/clinical-forms-seed.service.ts:570` |
| `clinical_ext.drug_interactions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → VademecumSeedService.run → VademecumSeedService.seedInteractions | `src/common/seed/vademecum-seed.service.ts:549` |
| `clinical_ext.drug_interactions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → VademecumSeedService.run → VademecumSeedService.seedInteractions | `src/common/seed/vademecum-seed.service.ts:548` |
| `common.contact_points` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → CommonRecordsAdapter.createContactPoint → ContactPointsRepository.create | `src/modules/common/repositories/contact-points.repository.ts:198` |
| `community.public_profiles` | ESCRIBE | ACTUALIZA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedShowcases → PublicProfileProjectionService.projectOrganization | `src/modules/community/services/public-profile-projection.service.ts:134` |
| `community.public_profiles` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedShowcases → PublicProfileProjectionService.projectOrganization → PublicProfilesRepository.create | `src/modules/community/repositories/public-profiles.repository.ts:392` |
| `community.public_profiles` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedShowcases | `src/common/seed/bolivia-insurance-seed.service.ts:276` |
| `directory.tenant_memberships` | ESCRIBE | ACTUALIZA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureMembership | `src/common/seed/provider-accounts-seed.service.ts:204` |
| `directory.tenant_memberships` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureMembership | `src/common/seed/provider-accounts-seed.service.ts:210` |
| `directory.tenant_memberships` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → ProviderAccountsSeedService.ensureMembership | `src/common/seed/provider-accounts-seed.service.ts:198` |
| `directory.tenants` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedTenants | `src/common/seed/bolivia-insurance-seed.service.ts:231` |
| `forms.dynamic_field_definitions` | ESCRIBE | ACTUALIZA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.reconcileVersion | `src/common/seed/clinical-forms-seed.service.ts:686` |
| `forms.dynamic_field_definitions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:780` |
| `forms.dynamic_field_definitions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:779` |
| `forms.dynamic_field_sections` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm | `src/common/seed/clinical-forms-seed.service.ts:588` |
| `forms.dynamic_field_sections` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm | `src/common/seed/clinical-forms-seed.service.ts:587` |
| `forms.extension_target_policies` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:484` |
| `forms.extension_target_policies` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:461` |
| `forms.field_assignments` | ESCRIBE | ACTUALIZA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.reconcileVersion | `src/common/seed/clinical-forms-seed.service.ts:702` |
| `forms.field_assignments` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:801` |
| `forms.field_assignments` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedForm → ClinicalFormsSeedService.seedField | `src/common/seed/clinical-forms-seed.service.ts:799` |
| `forms.field_definition_sets` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:467` |
| `forms.field_definition_sets` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ClinicalFormsSeedService.run → ClinicalFormsSeedService.seedExtensionPolicy | `src/common/seed/clinical-forms-seed.service.ts:466` |
| `iam.authentication_credentials` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → CredentialsRepository.createPassword | `src/modules/iam/infrastructure/repositories/credentials.repository.ts:315` |
| `iam.authentication_credentials` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount | `src/common/seed/provider-accounts-seed.service.ts:146` |
| `iam.security_events` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → SecurityEventsRepository.record | `src/modules/iam/infrastructure/repositories/security-events.repository.ts:47` |
| `iam.user_global_roles` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → UserGlobalRolesRepository.create | `src/modules/iam/infrastructure/repositories/user-global-roles.repository.ts:27` |
| `iam.users` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → ContentPacksService.runAccountsDemo → ProviderAccountsSeedService.run → ProviderAccountsSeedService.ensureAccount → IamUsersService.createUser → UsersRepository.create | `src/modules/iam/infrastructure/repositories/users.repository.ts:104` |
| `insurance.insurance_carriers` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedCarriers | `src/common/seed/bolivia-insurance-seed.service.ts:328` |
| `insurance.insurance_plans` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedPlans | `src/common/seed/bolivia-insurance-seed.service.ts:417` |
| `insurance.insurance_products` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoliviaInsuranceSeedService.run → BoliviaInsuranceSeedService.seedProducts | `src/common/seed/bolivia-insurance-seed.service.ts:372` |
| `terminology.catalog_concepts` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run | `src/common/seed/glossary-seed.service.ts:282` |
| `terminology.catalog_concepts` | ESCRIBE | ACTUALIZA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.backfillTermCodeSystem | `src/common/seed/glossary-seed.service.ts:1319` |
| `terminology.catalog_concepts` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:837` |
| `terminology.code_system_versions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.seedOwnCodeSystem | `src/common/seed/glossary-seed.service.ts:1282` |
| `terminology.code_system_versions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → VademecumSeedService.run → VademecumSeedService.seedVersion | `src/common/seed/vademecum-seed.service.ts:306` |
| `terminology.code_systems` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.seedOwnCodeSystem | `src/common/seed/glossary-seed.service.ts:1248` |
| `terminology.code_systems` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → VademecumSeedService.run → VademecumSeedService.seedCodeSystem | `src/common/seed/vademecum-seed.service.ts:268` |
| `terminology.concept_designations` | BORRA | BORRA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:872` |
| `terminology.concept_designations` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.seedDesignations | `src/common/seed/glossary-seed.service.ts:400` |
| `terminology.concept_designations` | ESCRIBE | ACTUALIZA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:875` |
| `terminology.concept_designations` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:865` |
| `terminology.concept_properties` | BORRA | BORRA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:897` |
| `terminology.concept_properties` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.seedProperties | `src/common/seed/glossary-seed.service.ts:484` |
| `terminology.concept_properties` | ESCRIBE | ACTUALIZA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:903` |
| `terminology.concept_properties` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:891` |
| `terminology.concept_relationships` | BORRA | BORRA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:956` |
| `terminology.concept_relationships` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.seedRelationships | `src/common/seed/glossary-seed.service.ts:780` |
| `terminology.concept_relationships` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:940` |
| `terminology.terminology_sources` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.seedOwnCodeSystem | `src/common/seed/glossary-seed.service.ts:1208` |
| `terminology.terminology_sources` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → VademecumSeedService.run → VademecumSeedService.seedSources | `src/common/seed/vademecum-seed.service.ts:227` |
| `terminology.value_set_members` | BORRA | BORRA | POR_TIPO | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:934` |
| `terminology.value_set_members` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.seedMemberships | `src/common/seed/glossary-seed.service.ts:671` |
| `terminology.value_set_members` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run → GlossarySeedService.reconcile | `src/common/seed/glossary-seed.service.ts:921` |
| `terminology.value_set_versions` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run | `src/common/seed/glossary-seed.service.ts:256` |
| `terminology.value_set_versions` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoGeographySeedService.run → BoGeographySeedService.resolveValueSetVersionId | `src/common/seed/bo-geography-seed.service.ts:703` |
| `terminology.value_sets` | ESCRIBE | CREA | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → GlossarySeedService.run | `src/common/seed/glossary-seed.service.ts:228` |
| `terminology.value_sets` | LEE | LEE | DIRECTA | ContentPacksController.aplicar → ContentPacksService.apply → ContentPacksService.run → BoGeographySeedService.run → BoGeographySeedService.resolveValueSetId | `src/common/seed/bo-geography-seed.service.ts:660` |

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

### Respuestas posibles

| HTTP | Código | Cuándo |
|---|---|---|
| 200 | — | Éxito |
| 400 | `VALIDATION_FAILED` | El cuerpo cumple el DTO (sin propiedades extra) |
| 401 | `UNAUTHENTICATED` | Hay una sesión válida (JWT) |
| 403 | `FORBIDDEN` | El rol está permitido; El tenant se resuelve y pertenece al actor |
| 404 | `NOT_FOUND` | ResourceNotFoundException: Paquete de contenido no encontrado |
| 422 | `PRECONDITION_FAILED` | PreconditionFailedException: Las cuentas de demostración necesitan una contraseña: declárela en la petición o en SEED_DEMO_PASSWORD.; PreconditionFailedException: Las cuentas de demostración no se crean en producción. Si de verdad las quiere acá, hace falta habilitarlo explícitamente en el entorno. |
| 429 | `RATE_LIMITED` | No se supera el límite de solicitudes |
| 500 | `INTERNAL` | Error: El catálogo del glosario declara el slug "{term.slug}" más de una vez; Error: El directorio declara el código "{facility.code}" más de una vez; Error: El catálogo geográfico declara la sigla "{department.code}" más de una vez; Error: El catálogo geográfico declara el código INE "{municipality.ine}" más de una vez; Error: El municipio "{municipality.name}" ({municipality.ine}) cuelga deldepartamento "{municipality.department}", que no está en el catálogo; Error: El municipio "{municipality.name}" declara el departamento"{municipality.department}" pero su código INE {municipality.ine}corresponde a "{byPrefix ?? 'ninguno…; Error: El catálogo de aseguradoras declara el código "{code}" más de una vez; Error: El nomenclador declara el código "{procedure.code}" más de una vez |

El árbol de decisión completo está en [flujos](../flujos/content_packs.md).

### Pruebas que la mencionan

_Ninguna prueba existente menciona esta operación._

### Flujos

- Módulo Content Packs — Contenido curado aplicable a demanda — etapa `ctrl:ContentPacksController` _(agrupada por controlador: el README no la asigna a un caso de uso)_

---

