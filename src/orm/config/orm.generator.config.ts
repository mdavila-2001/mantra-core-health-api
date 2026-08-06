import type { EntityMetadata } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { defineConfig } from '@mikro-orm/postgresql';
import { buildOrmConfig } from './orm.config';

/**
 * Configuración del generador de entidades por introspección — RETIRADA del
 * pipeline (ADR-0022, v4.0.10).
 *
 * El flujo «la base genera las entidades» que este archivo describía nunca fue
 * el que produjo las entidades del repo, y no puede reproducirlas: escribe en
 * `generated-entities/` (no en `src/modules/**`), con archivos PascalCase,
 * importando de `@mikro-orm/core` en vez de `@mikro-orm/decorators/legacy`, y
 * sin los comentarios `// FK → schema.tabla`. Además su premisa exige una base
 * garantizada en sincronía con el modelo, y `ORM_SCHEMA_SYNC=off` es obligatorio.
 *
 * El camino vigente es `salud-db/gen_entities.py` (cuerpo, desde los `.puml`) +
 * prettier + `yarn docs:tsdoc` (documentación). El script `orm:gen` se eliminó de
 * package.json; este archivo se conserva por si algún día se decide el camino de
 * introspección de verdad — lo que exigiría fijar `entityGenerator.path`,
 * `fileName`, el import, y emitir `COMMENT ON` desde `gen_ddl.py`.
 *
 * Vive separada del runtime porque `@mikro-orm/entity-generator` es una
 * dependencia de desarrollo: importarla desde la configuración de producción
 * haría que el bundle la exigiera en un entorno donde no está instalada.
 */

/** Columna de bloqueo optimista presente en casi todas las tablas del modelo. */
const ROW_VERSION_COLUMN = 'row_version';

export default defineConfig({
  ...buildOrmConfig(),
  extensions: [EntityGenerator],
  entityGenerator: {
    // Decoradores, no EntitySchema: es lo que espera el resto del repositorio y
    // lo que permite leer una entidad como documentación de su tabla.
    entityDefinition: 'decorators',
    fileName: (className: string) => `${className}.entity`,
    // Deja el tipo de columna explícito en cada decorador. Sin esto, la entidad
    // depende de la inferencia del proveedor de metadata y el mapeo se vuelve
    // implícito y frágil.
    scalarTypeInDecorator: true,
    // Sin relaciones inversas ni referencias envueltas: las columnas FK se
    // mapean como uuid escalares. La integridad referencial la declara el
    // catálogo (`src/orm/catalog/foreign-keys`) y la aplica la capa 06 del
    // arranque. Ver la justificación completa en esa capa.
    bidirectionalRelations: false,
    identifiedReferences: false,
    onProcessedMetadata: (metadata: EntityMetadata[]) => {
      // `row_version` es la columna de bloqueo optimista del modelo. El
      // generador no puede saberlo por introspección (es un integer normal),
      // así que se marca aquí: sin `version: true`, dos escrituras concurrentes
      // sobre la misma fila se pisan sin que nadie se entere.
      for (const meta of metadata) {
        const versionProp = meta.props.find((prop) =>
          prop.fieldNames?.includes(ROW_VERSION_COLUMN),
        );
        if (versionProp) {
          versionProp.version = true;
        }
      }
    },
  },
});
