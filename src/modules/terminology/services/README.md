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
| `ConceptsService` | 03-05, 03-06 | Concepto debe existir (NotFound); mapea idioma/tipo/relación a `CONCEPTS`; rechaza auto-relación y duplicados (Conflict) |
| `ValueSetsService` | 03-07 | Unicidad de `internalCode` (Conflict); crea conjunto + versión `1.0.0` (default) + reglas; `included` por defecto `true` |

## Estados y conceptos

Los estados del ciclo de vida (`TERM_DRAFT`, `TERM_ACTIVE`) y todos los tipos
(`SRC_TYPE_EXTERNAL`, `CS_CONTENT_COMPLETE`, `LANG_*`, `DESIG_*`, `REL_*`,
`VS_OP_*`) provienen de `CONCEPTS` (`../../../common`); ningún servicio inventa
UUID de concepto.

## Logging

`PinoLogger` con contexto por servicio. Se registra el inicio de cada operación,
su éxito y cada rechazo por regla de negocio (`warn`). No se registran datos
sensibles.

## Pruebas

`*.service.spec.ts` — unitarias con `em`/repos mockeados
(`transactional: jest.fn((cb) => cb(txMock))`). Cubren happy path, not-found y
precondition/conflict por método.
