# Terminology module

Administración de los catálogos de terminología de la plataforma: fuentes,
sistemas de códigos y sus versiones, conceptos (con designaciones, propiedades y
relaciones) y conjuntos de valores. El esquema es *concept-driven*: estados y
tipos no son enums de columna sino filas de `terminology.catalog_concepts`
referenciadas por FK (`*_concept_id`), resueltas desde `CONCEPTS` (`src/common`).

## Endpoints

| UC | Método y ruta | Rol | Éxito | Descripción |
| --- | --- | --- | --- | --- |
| 03-01 | `POST /terminology/code-systems` | SECURITY_ADMIN | 201 | Crea un sistema de códigos; reutiliza o crea su fuente. Devuelve `{id, internalCode, sourceId}` |
| 03-02 | `POST /terminology/code-systems/:id/versions` | SECURITY_ADMIN | 201 | Crea una versión en borrador. Devuelve `{id, version, state}` |
| 03-03 | `POST /terminology/versions/:versionId/import` | SECURITY_ADMIN | 201 | Importa conceptos en bloque (idempotente) en una versión en borrador. Devuelve `{inserted, skipped, total}` |
| 03-04 | `POST /terminology/versions/:versionId/publish` | SECURITY_ADMIN | 200 | Publica la versión (`TERM_DRAFT → TERM_ACTIVE`, fija `publishedAt`). Devuelve `{id, state, publishedAt}` |
| 03-05 | `POST /terminology/concepts/:conceptId/designations` | SECURITY_ADMIN | 201 | Añade una designación (y opcionalmente propiedades) a un concepto. Devuelve la designación creada |
| 03-06 | `POST /terminology/concepts/:conceptId/relationships` | SECURITY_ADMIN | 201 | Crea una relación dirigida entre dos conceptos. Devuelve la relación creada |
| 03-07 | `POST /terminology/value-sets` | SECURITY_ADMIN | 201 | Crea un conjunto de valores con versión inicial `1.0.0` y reglas. Devuelve `{id, versionId, rulesCount}` |

## Entidades implicadas

`terminology_sources`, `code_systems`, `code_system_versions`, `catalog_concepts`,
`concept_designations`, `concept_properties`, `concept_relationships`,
`value_sets`, `value_set_versions`, `value_set_rules`.

Registradas en el módulo con `MikroOrmModule.forFeature(Object.values(entities))`.

## Reglas de negocio

- **Unicidad**: `code_systems.internal_code` y `value_sets.internal_code` únicos;
  `(code_system_id, version)` único por sistema → `409 Conflict`.
- **Ciclo de vida de versión**: nace `TERM_DRAFT`; solo en borrador admite import
  (`422 Precondition`); publicar la pasa a `TERM_ACTIVE` e inmutable; re-publicar
  → `409 Conflict`.
- **Import idempotente**: omite códigos ya presentes en la versión y duplicados
  dentro del propio lote; inserción atómica.
- **Relaciones**: origen y destino deben existir (`404`); se rechaza la
  auto-relación y los duplicados (mismo origen/destino/tipo) → `409`.
- **Conjuntos de valores**: se crean conjunto → versión → reglas con `flush` por
  nivel; `included` por defecto `true`.

## Permisos

Todos los endpoints exigen rol global `SECURITY_ADMIN` (`@Roles`) sobre el
`JwtAuthGuard` global.

## Persistencia

Servicios dueños de la transacción (`em.transactional`); repositorios sin estado
que reciben el `EntityManager` activo. Como las FK son columnas `uuid` planas, se
hace `flush` por nivel de dependencia antes de crear lo que referencia al padre.
`row_version` se omite en las altas (`DEFAULT 1` en base, gestionado por el ORM).

## Logging

`PinoLogger` con contexto por servicio: inicio y éxito de cada operación y cada
rechazo por regla de negocio (`warn`). Sin datos sensibles.

## Estructura

```
terminology/
├── controllers/   4 controladores (+ specs, README)
├── services/      4 servicios (+ specs, README)
├── repositories/  7 repositorios (+ README)
├── dto/           DTOs de entrada/salida (+ README)
├── entities/      entidades MikroORM (generadas)
└── terminology.module.ts
```

## Pruebas

Unitarias (`*.spec.ts`) con `EntityManager` y repositorios mockeados, sin acceso a
base de datos:

```bash
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/terminology
```
