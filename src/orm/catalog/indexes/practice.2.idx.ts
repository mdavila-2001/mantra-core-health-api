import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `practice` (parte 2/2).
 * 4 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const practiceIndexes2: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['space_unit_assignments', 'ix_space_unit_assignments_role_concept_id', ['role_concept_id'], false, 'btree'],
  ['space_unit_assignments', 'ix_space_unit_assignments_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['space_unit_assignments', 'ix_space_unit_assignments_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['space_unit_assignments', 'ux_space_unit_assignments_current', ['care_space_id', 'clinical_unit_id'], true, 'btree', 'valid_to IS NULL'],
];
