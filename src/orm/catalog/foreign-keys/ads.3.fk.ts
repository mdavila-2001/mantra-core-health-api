import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `ads` (parte 3/3).
 * 6 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const adsForeignKeys3: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['targeting_specs', 'updated_by_user_id', 'iam', 'users', 'id'],
  ['tracking_pixels', 'ad_account_id', 'ads', 'ad_accounts', 'id'],
  ['tracking_pixels', 'business_manager_id', 'ads', 'business_managers', 'id'],
  ['tracking_pixels', 'created_by_user_id', 'iam', 'users', 'id'],
  ['tracking_pixels', 'state_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['tracking_pixels', 'updated_by_user_id', 'iam', 'users', 'id'],
];
