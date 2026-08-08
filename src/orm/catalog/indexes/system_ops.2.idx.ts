import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `system_ops` (parte 2/2).
 * 3 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const systemOpsIndexes2: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['write_policies', 'ix_write_policies_state_concept_id', ['state_concept_id'], false, 'btree'],
  ['write_policies', 'ix_write_policies_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['write_policies', 'ix_write_policies_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
