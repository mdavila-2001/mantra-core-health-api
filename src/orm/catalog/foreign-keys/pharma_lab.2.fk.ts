import type { ForeignKeyTuple } from '../catalog.types';

/**
 * Claves foráneas declaradas por el modelo oficial para el schema `pharma_lab` (parte 2/2).
 * 2 restricciones. Generado desde las notas `FK/` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const pharmaLabForeignKeys2: readonly ForeignKeyTuple[] = [
  // [tablaOrigen, columnaOrigen, schemaDestino, tablaDestino, columnaDestino]
  ['visitor_post_submissions', 'status_concept_id', 'terminology', 'catalog_concepts', 'id'],
  ['visitor_post_submissions', 'updated_by_user_id', 'iam', 'users', 'id'],
];
