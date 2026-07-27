# Terminology · services

Reglas de negocio y dueños de la transacción. Cada método público envuelve su
trabajo en `em.transactional(async (tx) => …)`; los repositorios reciben ese `tx`.

## Orden de inserción (importante)

Las FK del modelo son columnas `uuid` planas, **no relaciones del ORM**: MikroORM
no ordena los inserts a partir de ellas. Por eso se hace `tx.flush()` tras cada
nivel de dependencia antes de crear lo que lo referencia (fuente → sistema de
códigos; conjunto → versión → reglas).

## Servicios

| Servicio | Endpoints (UC) | Reglas |
| --- | --- | --- |
| `CodeSystemsService` | 03-01, 03-02 | Unicidad de `internalCode` (Conflict); reutiliza/crea la fuente; versión nace en `TERM_DRAFT`; unicidad `(codeSystemId, version)` |
| `CodeSystemVersionsService` | 03-03, 03-04 | Importar solo en versión `TERM_DRAFT` (Precondition); import idempotente (omite existentes y duplicados del lote); publicar `TERM_DRAFT → TERM_ACTIVE`, rechaza re-publicar (Conflict) |
| `ConceptsService` | 03-05, 03-06, 03-10, 03-11 | Concepto debe existir (NotFound); mapea idioma/tipo/relación a `CONCEPTS`; rechaza auto-relación y duplicados (Conflict); designación preferida única por idioma; propiedades por UPSERT; retirada idempotente con exclusión de miembros; `$lookup` sólo lectura |
| `ValueSetsService` | 03-07, 03-08 | Unicidad de `internalCode` (Conflict); crea conjunto + versión `1.0.0` (default) + reglas; `included` por defecto `true`; la expansión reemplaza miembros y activa la versión |
| `ConceptMapsService` | 03-09 | UPSERT por `(origen, destino, contexto, versión)`; origen y destino activos (Precondition); sin `targetConceptId` es sólo lectura |
| `TenantCatalogService` | 03-12 | Un solo `is_default` por tenant (Precondition); alias sólo con `allowAlias`; UPSERT de política y de configuración por concepto |

## Bloqueos pesimistas

Las invariantes de "sólo uno" se resuelven con `FOR UPDATE` sobre las filas que
compiten, no releyendo sin bloqueo: la designación preferida por idioma, la
versión por defecto de un conjunto de valores, el `is_default` del tenant, el
concepto que se retira y el mapeo que se recura.

## Estados y conceptos

Los estados del ciclo de vida (`TERM_DRAFT`, `TERM_ACTIVE`, `TERM_RETIRED`) y
todos los tipos (`SRC_TYPE_EXTERNAL`, `CS_CONTENT_COMPLETE`, `LANG_*`, `DESIG_*`,
`REL_*`, `VS_OP_*`, `EQUIV_*`, `TENANT_CATALOG_*`) provienen de `CONCEPTS`
(`../../../common`); ningún servicio inventa UUID de concepto.

## Sólo lectura sin transacción

`ConceptsService.lookupConcept` y el camino de consulta de
`ConceptMapsService.translate` usan el `EntityManager` directamente: el caso de
uso los declara sin escritura de negocio y abrir una transacción sólo añadiría
contención.

## Logging

`PinoLogger` con contexto por servicio. Se registra el inicio de cada operación,
su éxito y cada rechazo por regla de negocio (`warn`). No se registran datos
sensibles.

## Pruebas

`*.service.spec.ts` — unitarias con `em`/repos mockeados
(`transactional: jest.fn((cb) => cb(txMock))`). Cubren happy path, not-found y
precondition/conflict por método, y cada operador de `$expand` (incluido el corte
de ciclos en `is-a` y el descarte de reglas no evaluables).
