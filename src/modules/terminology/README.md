# Terminology module

Administración de los catálogos de terminología de la plataforma: fuentes,
sistemas de códigos y sus versiones, conceptos (con designaciones, propiedades y
relaciones), conjuntos de valores con su expansión, mapeos entre sistemas y la
política de catálogo de cada tenant. El esquema es *concept-driven*: estados y
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
| 03-05 | `POST /terminology/concepts/:conceptId/properties` | SECURITY_ADMIN | 200 | Alta o actualización (UPSERT) de propiedades del concepto. Devuelve `{conceptId, created, updated}` |
| 03-06 | `POST /terminology/concepts/:conceptId/relationships` | SECURITY_ADMIN | 201 | Crea una relación dirigida entre dos conceptos. Devuelve la relación creada |
| 03-07 | `POST /terminology/value-sets` | SECURITY_ADMIN | 201 | Crea un conjunto de valores con versión inicial `1.0.0` y reglas. Devuelve `{id, versionId, rulesCount}` |
| 03-08 | `POST /terminology/ValueSet/:id/$expand` | SECURITY_ADMIN | 200 | Materializa los miembros evaluando las reglas. Devuelve `{rulesEvaluated, includedMembers, replacedMembers, stateConceptId}` |
| 03-09 | `POST /terminology/ConceptMap/$translate` | autenticado | 200 | Cura (con `targetConceptId`) o consulta un mapeo entre conceptos. Devuelve `{matched, matches[], curated}` |
| 03-10 | `POST /terminology/concepts/:conceptId/$deprecate` | SECURITY_ADMIN | 200 | Retira el concepto (soft-retire) y lo excluye de las expansiones. Devuelve `{stateConceptId, replacedByConceptId, excludedMembers, alreadyRetired}` |
| 03-11 | `GET /terminology/CodeSystem/$lookup?system=&code=` | autenticado | 200 | Resuelve un concepto con sus designaciones y propiedades. Sólo lectura |
| 03-12 | `PUT /terminology/tenants/:tenantId/catalog-policies` | SECURITY_ADMIN | 200 | Define la política de catálogo del tenant y la configuración de sus conceptos |

## Entidades implicadas

`terminology_sources`, `code_systems`, `code_system_versions`, `catalog_concepts`,
`concept_designations`, `concept_properties`, `concept_relationships`,
`value_sets`, `value_set_versions`, `value_set_rules`, `value_set_members`,
`concept_maps`, `tenant_catalog_policies`, `tenant_concept_config`.

Registradas en el módulo con `MikroOrmModule.forFeature(Object.values(entities))`.

## Reglas de negocio

- **Unicidad**: `code_systems.internal_code` y `value_sets.internal_code` únicos;
  `(code_system_id, version)` único por sistema → `409 Conflict`.
- **Ciclo de vida de versión**: nace `TERM_DRAFT`; solo en borrador admite import
  (`422 Precondition`); publicar la pasa a `TERM_ACTIVE` e inmutable; re-publicar
  → `409 Conflict`.
- **Import idempotente**: omite códigos ya presentes en la versión y duplicados
  dentro del propio lote; inserción atómica.
- **Designación preferida única por idioma**: marcar una como preferida degrada la
  anterior del mismo idioma, con las filas bloqueadas (`FOR UPDATE`).
- **Propiedades UPSERT**: reenviar la misma `propertyCode` actualiza su valor en
  vez de añadir una segunda fila con el mismo código.
- **Relaciones**: origen y destino deben existir (`404`); se rechaza la
  auto-relación y los duplicados (mismo origen/destino/tipo) → `409`.
- **Conjuntos de valores**: se crean conjunto → versión → reglas con `flush` por
  nivel; `included` por defecto `true`.
- **Expansión (`$expand`)**: **reemplaza** los miembros anteriores, nunca los
  acumula; las reglas `included=false` restan al final para que el resultado no
  dependa del orden de alta; una regla cuyo sistema no tiene versión vigente o
  cuyo operador es desconocido se **ignora** (se registra `warn`) en vez de
  adivinar su semántica.
- **Retirada (`$deprecate`)**: soft-retire (`TERM_RETIRED` + `valid_to`), nunca
  borrado; es idempotente; el concepto de reemplazo tiene que existir y no estar
  retirado.
- **Mapeos (`$translate`)**: UPSERT por `(origen, destino, contexto, versión)`;
  origen y destino tienen que estar activos; sin `targetConceptId` la llamada es
  sólo lectura y devuelve **todas** las traducciones activas.
- **Catálogo por tenant**: un solo `is_default` por tenant; renombrar exige
  `allowAlias`.

## Gramáticas de regla de `$expand`

El modelo declara los operadores pero no su sintaxis. Se fija la mínima
interpretación que **falla cerrada** (una regla que no se entiende no aporta
conceptos):

| Operador | `property` | `value` | Selección |
| --- | --- | --- | --- |
| *(sin operador)* | — | — | Todos los conceptos activos de la versión vigente del sistema |
| `VS_OP_IN` | — | Lista de códigos separada por `,` | Los conceptos cuyo `code` está en la lista |
| `VS_OP_IS_A` | — | Código del ancestro | El ancestro y sus descendientes `is-a`, de forma transitiva (con corte de ciclos) |
| `VS_OP_PROP` | Código de propiedad | Valor esperado | Los conceptos cuyo `value_json` textual coincide con `value` |

## Permisos

Los endpoints administrativos exigen rol global `SECURITY_ADMIN` (`@Roles`) sobre
el `JwtAuthGuard` global. `$translate` y `$lookup` sólo exigen autenticación: el
caso de uso los asigna al consumidor FHIR, no al terminólogo.

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
├── controllers/   6 controladores (+ specs, README)
├── services/      6 servicios (+ specs, README)
├── repositories/  9 repositorios (+ README)
├── dto/           DTOs de entrada/salida (+ README)
├── entities/      entidades MikroORM (generadas)
└── terminology.module.ts
```

## Pruebas

86 pruebas unitarias en 12 suites (`*.spec.ts`) con `EntityManager` y repositorios
mockeados, sin acceso a base de datos:

```bash
NODE_OPTIONS=--experimental-vm-modules npx jest src/modules/terminology
```
