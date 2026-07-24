import type { EntityMetadata } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { defineConfig } from '@mikro-orm/postgresql';
import { buildOrmConfig } from './orm.config';

/**
 * Configuración exclusiva del generador de entidades por introspección.
 *
 * El flujo del proyecto es de doble sentido y conviene tenerlo claro:
 *
 *   modelo oficial (bóveda)  ->  DDL  ->  base de datos  ->  entidades
 *
 * Es decir: el modelo genera el DDL, y la base genera las entidades. Esta
 * configuración cubre el último tramo. Nunca se editan las entidades a mano;
 * si algo no cuadra, se corrige el DDL y se regenera.
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
