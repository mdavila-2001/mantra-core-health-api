# Módulo Forms (09) — Dynamic Forms & Extensibility Governance

Formularios dinámicos y gobernanza de extensibilidad: definición de sets/versiones
inmutables, campos con reglas y dependencias, localizaciones i18n, asignaciones
gobernadas por política, instancias de formulario, captura/curación de valores
(value[x] exclusivo, supersede, procedencia) y migración de esquema.

## Endpoints (UC → ruta)

| UC | Método y ruta | Permiso | Descripción |
|----|---------------|---------|-------------|
| UC-09-01 | `POST /forms/definition-sets` | `SECURITY_ADMIN` | Crea set + versión inicial (draft, inmutable) |
| UC-09-02 | `POST /forms/field-definitions` | autenticado | Declara campo con reglas de validación |
| UC-09-03 | `POST /forms/definition-sets/:id/versions/:ver/publish` | `SECURITY_ADMIN` | Compone miembros y publica la versión |
| UC-09-04 | `POST /forms/fields/:id/dependencies` | autenticado | Define dependencia condicional entre campos |
| UC-09-05 | `PUT /forms/fields/:id/localizations/:lang` | autenticado | Upsert de localización i18n (`es`/`en`) |
| UC-09-06 | `POST /forms/assignments` | `SECURITY_ADMIN` | Asigna campo a target con enforcement de política |
| UC-09-07 | `POST /forms/instances` | autenticado | Abre instancia de formulario para un recurso |
| UC-09-08 | `POST /forms/instances/:id/values` | autenticado | Captura valores (value[x] exclusivo) |
| UC-09-09 | `PATCH /forms/values/:id` | autenticado | Corrige valor con supersede y snapshot inmutable |
| UC-09-10 | `POST /forms/values/import` | autenticado | Importa valores externos (batch ETL) con procedencia |
| UC-09-11 | `POST /forms/instances/:id/close` | autenticado | Cierra formulario y finaliza valores preliminares |
| UC-09-12 | `POST /forms/fields/:id/access-rules` | `SECURITY_ADMIN` | Define regla de acceso / enmascarado por campo |
| UC-09-13 | `POST /forms/definition-sets/:id/migrations/:migrationId/run` | `SECURITY_ADMIN` | Ejecuta migración entre versiones |

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

## Tests

- Unit: `services/*.service.spec.ts` (mockean repos/em) y
  `controllers/forms-controllers.spec.ts` (mockean servicios). 45 casos.
- Smoke: `test/smoke/modules/forms.smoke.ts` (`FORMS_SMOKE`), 29 casos encadenados.
