import type { EntityMetadata } from '@mikro-orm/core';
import { EntityGenerator } from '@mikro-orm/entity-generator';
import { defineConfig } from '@mikro-orm/postgresql';
import baseConfig from './mikro-orm.config';

/**
 * Configuración exclusiva del generador de entidades por introspección contra la
 * base real (guía ORM §2.3: el modelo genera el DDL, la base genera las entidades).
 * Separada del runtime para no importar `@mikro-orm/entity-generator` (devDependency)
 * cuando la API corre en producción.
 */
const ROW_VERSION_COLUMN = 'row_version';

export default defineConfig({
  ...baseConfig,
  extensions: [EntityGenerator],
  entityGenerator: {
    entityDefinition: 'decorators',
    fileName: (className: string) => `${className}.entity`,
    scalarTypeInDecorator: true,
    bidirectionalRelations: false,
    identifiedReferences: false,
    onProcessedMetadata: (metadata: EntityMetadata[]) => {
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
