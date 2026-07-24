import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `insurance` (parte 2/2).
 * 3 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const insuranceForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['provider_networks', 'network_type_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_networks', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['provider_networks', 'updated_by_user_id', 'iam', 'users', 'id'],
];
