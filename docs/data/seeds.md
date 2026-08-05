# Seeds

> Fase 11. Ver [ADR-0017](../adr/ADR-0017-seeds-idempotentes-arranque.md) para la decisión
> completa.

## Qué se siembra

`TerminologySeedService` (`src/common/seed/terminology-seed.service.ts`) materializa el catálogo
de conceptos internos (`terminology.catalog_concepts`, `CatalogConcepts`) que el resto del sistema
referencia por FK: estados de usuario, métodos de credencial, tipos de evento y demás valores
cerrados del modelo — ver [reglas de negocio](../business/business-rules.md) §4 ("terminología
gobernada, no enums de código").

Sin este seed, ninguna operación de `iam`/`common`/`terminology` podría persistir, porque las
columnas `*_concept_id` son foreign keys obligatorias sin valor por defecto.

## Cuándo corre

En **cada arranque** de la aplicación (`OnApplicationBootstrap`), no como paso manual separado.

## Por qué es seguro ejecutarlo repetidamente

- **Identificadores deterministas** (`deterministicId()`, UUIDv5) — el mismo concepto lógico
  produce siempre el mismo UUID, sin importar cuántas veces se ejecute el seed.
  Múltiples réplicas de `api` arrancando a la vez no compiten por crear filas duplicadas.
- **Comparación por identificador antes de insertar** — solo se insertan los conceptos que faltan.

## Fuente de los valores sembrados

`src/common/constants/concepts.ts` (`CONCEPT_DEFS`, `CONCEPTS`) y
`src/common/seed/module-concepts.ts` (`MODULE_CONCEPT_SEEDS`) — no un archivo `.sql` de datos,
sino constantes TypeScript versionadas junto al código que las consume.

## Comportamiento conocido con `ORM_SCHEMA_SYNC=off`

El propio servicio documenta (comentario en `terminology-seed.service.ts`) que con
`ORM_SCHEMA_SYNC=off` contra una base vacía el seed puede fallar porque las tablas aún no existen
— se registra el error y el arranque continúa, en vez de abortar. Comportamiento intencional para
no bloquear un arranque en un entorno donde un DBA externo gestiona el DDL por separado.

## Otros seeds del sistema

No se identificaron en esta fase otros mecanismos de seed formal más allá del de terminología —
datos de prueba para desarrollo (si existen) viven en `test/` y no se documentan aquí como seed de
producción.
