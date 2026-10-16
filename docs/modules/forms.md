<!--
  ESPEJO AUTOGENERADO — no editar este archivo directamente.
  Fuente real: src/modules/forms/README.md
  Regenerar con: yarn docs:modules:sync (tools/docs/sync-module-docs.mjs)
  Este README es el contrato por dominio mantenido junto al código
  (ver docs/progress/ESTADO-Y-PENDIENTES.md, tabla "Mapa documental").
-->

# Módulo `forms`

**Fuente:** [`src/modules/forms/README.md`](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/src/modules/forms/README.md)
· 6 controllers · 6 services · 6 repositories · 16 entidades · 17 DTO

---

# Módulo Forms (09) — Dynamic Forms & Extensibility Governance

Formularios dinámicos y gobernanza de extensibilidad: definición de sets/versiones
inmutables, campos con reglas y dependencias, localizaciones i18n, asignaciones
gobernadas por política, instancias de formulario, captura/curación de valores
(value[x] exclusivo, supersede, procedencia) y migración de esquema.

## Rutas HTTP y alcance (medido)

<!-- Medido el 2026-10-08 sobre origin/dev (dae4fd68). Repetir con:
  find src/modules/forms -name '*.controller.ts' | wc -l
  find src/modules/forms -name '*.controller.ts' -exec grep -hE "^\s*@(Get|Post|Put|Patch|Delete)\(" {} + | wc -l
  find src/modules/forms -name '*.entity.ts' | wc -l
  find src/modules/forms -name '*.service.ts' | wc -l
La tabla sale de los decoradores `@Controller`/`@Get`/`@Post`/`@Put`/`@Patch`/`@Delete`, `@Roles` y `@Public`. -->

El módulo tiene **6 controllers, 25 rutas HTTP, 16 entidades y 6 servicios**. La columna *Acceso* sale del código: `pública` = `@Public()`; un rol = `@Roles(...)`; `sesión` = sin ninguno de los dos, o sea que sólo exige sesión autenticada (guards globales `JwtAuthGuard`, `TenantScopeGuard`, `RolesGuard`, `VerifiedIdentityGuard`). La autorización por recurso puede vivir además en el servicio y no se refleja acá.

Si una tabla narrativa más abajo difiere de ésta (prefijo del controller omitido, sufijos `:accion` de la spec en lugar de sub-rutas), manda ésta: sale del código.

Su `*.module.ts` no declara `imports` de otros módulos.

Entidades (`tableName`, 16 de 16 archivos `*.entity.ts`): `dynamic_field_definitions`, `dynamic_field_sections`, `extension_target_policies`, `field_assignments`, `field_definition_localizations`, `field_definition_set_versions`, `field_definition_sets`, `field_dependencies`, `field_schema_migrations`, `field_set_members`, `field_validation_rules`, `field_value_access_rules`, `field_value_audit`, `field_value_provenance`, `field_values`, `form_instances`.

| Método y ruta | Acceso | Controller |
| --- | --- | --- |
| `GET /forms/assignments` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-assignments` |
| `GET /forms/assignments/budget` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-assignments` |
| `POST /forms/assignments` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-assignments` |
| `PUT /forms/assignments/order` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-assignments` |
| `PATCH /forms/assignments/:id` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-assignments` |
| `DELETE /forms/assignments/:id` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-assignments` |
| `GET /forms/definition-sets` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-definition-sets` |
| `GET /forms/definition-sets/:id` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-definition-sets` |
| `POST /forms/definition-sets` | SECURITY_ADMIN | `forms-definition-sets` |
| `POST /forms/definition-sets/:id/versions/:ver/publish` | SECURITY_ADMIN | `forms-definition-sets` |
| `POST /forms/definition-sets/:id/migrations/:migrationId/run` | SECURITY_ADMIN | `forms-definition-sets` |
| `POST /forms/field-definitions` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-fields` |
| `PATCH /forms/field-definitions/:id` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-fields` |
| `POST /forms/fields/:id/dependencies` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-fields` |
| `PUT /forms/fields/:id/localizations/:lang` | CLINICIAN, PRACTITIONER, SECURITY_ADMIN | `forms-fields` |
| `POST /forms/fields/:id/access-rules` | SECURITY_ADMIN | `forms-fields` |
| `GET /forms/instances` | CLINICIAN, PRACTITIONER | `forms-instances` |
| `GET /forms/instances/:id` | CLINICIAN, PRACTITIONER | `forms-instances` |
| `POST /forms/instances` | CLINICIAN, PRACTITIONER | `forms-instances` |
| `POST /forms/instances/:id/values` | CLINICIAN, PRACTITIONER | `forms-instances` |
| `POST /forms/instances/:id/close` | CLINICIAN, PRACTITIONER | `forms-instances` |
| `GET /forms/me/instances` | sesión | `forms-me` |
| `GET /forms/me/instances/:id` | sesión | `forms-me` |
| `POST /forms/values/import` | CLINICIAN, PRACTITIONER | `forms-values` |
| `PATCH /forms/values/:id` | CLINICIAN, PRACTITIONER | `forms-values` |

## Endpoints (UC → ruta)

| UC | Método y ruta | Permiso | Descripción |
|----|---------------|---------|-------------|
| UC-09-01 | `POST /forms/definition-sets` | `SECURITY_ADMIN` | Crea set + versión inicial (draft, inmutable) |
| UC-09-02 | `POST /forms/field-definitions` | clínico, practitioner o `SECURITY_ADMIN` | Declara campo con reglas de validación |
| UC-09-03 | `POST /forms/definition-sets/:id/versions/:ver/publish` | `SECURITY_ADMIN` | Compone miembros y publica la versión |
| UC-09-04 | `POST /forms/fields/:id/dependencies` | autenticado | Define dependencia condicional entre campos |
| UC-09-05 | `PUT /forms/fields/:id/localizations/:lang` | autenticado | Upsert de localización i18n (`es`/`en`) |
| UC-09-06 | `POST /forms/assignments` | `SECURITY_ADMIN` | Asigna campo a target con enforcement de política |
| UC-09-07 | `POST /forms/instances` | `CLINICIAN`/`PRACTITIONER` | Abre instancia de formulario para un recurso |
| UC-09-08 | `POST /forms/instances/:id/values` | autenticado | Captura valores (value[x] exclusivo) |
| UC-09-09 | `PATCH /forms/values/:id` | autenticado | Corrige valor con supersede y snapshot inmutable |
| UC-09-10 | `POST /forms/values/import` | autenticado | Importa valores externos (batch ETL) con procedencia |
| UC-09-11 | `POST /forms/instances/:id/close` | autenticado | Cierra formulario y finaliza valores preliminares |
| UC-09-12 | `POST /forms/fields/:id/access-rules` | `SECURITY_ADMIN` | Define regla de acceso / enmascarado por campo |
| UC-09-13 | `POST /forms/definition-sets/:id/migrations/:migrationId/run` | `SECURITY_ADMIN` | Ejecuta migración entre versiones |
| Lectura | `GET /forms/definition-sets` | clínico o `SECURITY_ADMIN` | Lista sets visibles (globales y del tenant) |
| Lectura | `GET /forms/definition-sets/:id` | clínico o `SECURITY_ADMIN` | Set con versiones, campos (reglas, dependencias, i18n) y secciones |
| Lectura | `GET /forms/instances?encounter=` | `CLINICIAN`/`PRACTITIONER` | Instancias del encuentro (anclado a su tenant) |
| Lectura | `GET /forms/instances/:id` | `CLINICIAN`/`PRACTITIONER` | Instancia con valores vigentes, `value[x]` resuelto por tipo |
| Lectura | `GET /forms/assignments` | clínico o `SECURITY_ADMIN` | Asignaciones activas visibles con secciones resueltas |

## Entidades (schema `forms`)

`field_definition_sets`, `field_definition_set_versions`, `field_set_members`,
`dynamic_field_definitions`, `field_validation_rules`, `field_dependencies`,
`field_definition_localizations`, `dynamic_field_sections`, `field_assignments`,
`extension_target_policies`, `form_instances`, `field_values`, `field_value_audit`,
`field_value_provenance`, `field_value_access_rules`, `field_schema_migrations`.

## Reglas de negocio destacadas

- **Sets/versiones inmutables:** la versión solo permite la transición de
  publicación (draft → published); al publicar, el set pasa a active.
- **value[x] exclusivo (REC 3.4):** `buildValueColumns()` mapea `dataType` a la
  única columna `value_*`; centraliza captura, corrección, import y migración.
- **Supersede:** la corrección inserta una fila nueva (`supersedes_value_id`,
  `value_version++`, `corrected`) y marca la anterior `superseded` con
  `effective_to`, dejando snapshot previo inmutable en `field_value_audit`.
- **Gobernanza:** si el target tiene `extension_target_policies` activa, se valida
  el presupuesto `maximum_fields` antes de asignar. `section_id` es NOT NULL: si el
  cliente no la indica, se aprovisiona una sección por defecto.
- **Idempotencia de migración:** rechaza un `migrationId` ya registrado.

## Convenciones

- Servicios inyectan `EntityManager` (`@mikro-orm/postgresql`) y usan
  `em.transactional`. Repositorios stateless (reciben `em`). `{ partial: true }` en
  cada `em.create`. `flush` padre-antes-de-hijo (FKs son columnas uuid planas).
- `rowVersion` nunca se fija; auditoría vía `createdBy(actor.id)` / `touch`.
- Estados/tipos son `*_concept_id`: conceptos propios en `forms.concepts.ts`
  (`FORMS`, `FORMS_CONCEPT_SEEDS`); transversales reutilizados desde `CONCEPTS.*`.
- Logs Pino estructurados; nunca PHI ni secretos. Excepciones de dominio
  (`ResourceNotFoundException` → 404, `ConflictException` → 409,
  `PreconditionFailedException` → 422).

## Permisos

Guard JWT global. Endpoints de gobernanza/administración de extensibilidad exigen
`SECURITY_ADMIN`; los clínicos/steward/ETL requieren solo autenticación.

## Lecturas (Fase 1 del carril de consulta)

`FormsReadService` sigue el patrón de `ChartReadService`: sólo lectura sobre un
`fork` del `EntityManager`, lotes `$in` sin N+1, `limit+1` con recorte declarado.
Aislamiento de instancias: la propiedad se ancla en el `clinical.encounter` que
la instancia referencia (`resourceId`) y exige tenant del contexto. Falta aplicar
la política clínica del paciente a las lecturas profesionales; ver la
[revisión ALOVIDA](https://github.com/mdavila-2001/mantra-core-health-api/blob/dev/docs/revision-backend-2026-10-04/modulos/forms.md).
Enmascarado deny-by-default: un campo con
`field_value_access_rules` activa responde `masked: true` sin valor, porque la
semántica de roles de la regla no es evaluable todavía (no existe puente
rol→value-set en el sistema).

## Tests

- `corepack yarn test src/modules/forms --runInBand --silent`: 9 suites y 129
  pruebas aprobadas durante la revisión.
- Smoke: `test/smoke/modules/forms.smoke.ts` (`FORMS_SMOKE`), 29 casos encadenados.
