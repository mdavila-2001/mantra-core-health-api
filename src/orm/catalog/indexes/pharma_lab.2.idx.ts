import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `pharma_lab` (parte 2/2).
 * 2 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const pharmaLabIndexes2: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['visitor_post_submissions', 'ix_visitor_post_submissions_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['visitor_post_submissions', 'ix_visitor_post_submissions_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
