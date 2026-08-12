/**
 * Superficie pública del catálogo declarativo.
 *
 * El resto de la aplicación consume el modelo oficial solo por aquí; los
 * archivos troceados por schema (`foreign-keys/*.fk.ts`, `indexes/*.idx.ts`) son
 * detalle de generación y no deberían importarse directamente.
 *
 * Aquí también se **une** el catálogo de los schemas propios del backend
 * (`local.catalog.ts`) al del modelo oficial. La unión ocurre en este archivo, que
 * se escribe a mano, y no dentro de los archivos generados: `yarn orm:catalog`
 * reescribe aquellos por completo, así que una línea añadida allí desaparecería en
 * la siguiente regeneración y el schema dejaría de crearse sin que nada lo dijera.
 */
import type {
  ForeignKeyTuple,
  IndexTuple,
  PhysicalStatementSpec,
  SchemaSpec,
} from './catalog.types';
import { schemaCatalog as vaultSchemaCatalog } from './schemas.catalog';
import { physicalCatalog as vaultPhysicalCatalog } from './physical.catalog';
import { foreignKeyCatalog as vaultForeignKeyCatalog } from './foreign-keys';
import { indexCatalog as vaultIndexCatalog } from './indexes';
import {
  localForeignKeyCatalog,
  localIndexCatalog,
  localPhysicalCatalog,
  localSchemaCatalog,
} from './local.catalog';

export * from './catalog.types';
export { extensionCatalog } from './extensions.catalog';
export { enumTypeCatalog } from './types.catalog';
export type { EnumTypeSpec } from './types.catalog';

/** Los schemas del modelo oficial más los propios del backend. */
export const schemaCatalog: readonly SchemaSpec[] = [
  ...vaultSchemaCatalog,
  ...localSchemaCatalog,
];

/**
 * Índices del modelo más los propios.
 *
 * La unión es por schema y los conjuntos son disjuntos por construcción (un
 * schema propio no existe en la bóveda), así que no hay riesgo de que una clave
 * pise la otra.
 */
export const indexCatalog: Readonly<
  Record<string, readonly (readonly IndexTuple[])[]>
> = { ...vaultIndexCatalog, ...localIndexCatalog };

export const foreignKeyCatalog: Readonly<
  Record<string, readonly (readonly ForeignKeyTuple[])[]>
> = { ...vaultForeignKeyCatalog, ...localForeignKeyCatalog };

export const physicalCatalog: readonly PhysicalStatementSpec[] = [
  ...vaultPhysicalCatalog,
  ...localPhysicalCatalog,
];
