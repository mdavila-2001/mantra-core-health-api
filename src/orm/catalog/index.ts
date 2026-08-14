/**
 * Superficie pública del catálogo declarativo.
 *
 * El resto de la aplicación consume el modelo oficial solo por aquí; los
 * archivos troceados por schema (`foreign-keys/*.fk.ts`, `indexes/*.idx.ts`) son
 * detalle de generación y no deberían importarse directamente.
 */
export * from './catalog.types';
export { schemaCatalog } from './schemas.catalog';
export { extensionCatalog } from './extensions.catalog';
export { enumTypeCatalog } from './types.catalog';
export type { EnumTypeSpec } from './types.catalog';
export { physicalCatalog } from './physical.catalog';
export { foreignKeyCatalog } from './foreign-keys';
export { indexCatalog } from './indexes';
