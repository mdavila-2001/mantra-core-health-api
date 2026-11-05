import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `accounting` (parte 3/3).
 * 6 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const accountingIndexes3: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['subledger_accounts', 'ix_subledger_accounts_tenant_status', ['tenant_id', 'status_concept_id'], false, 'btree'],
  ['transaction_files', 'ix_transaction_files_transaction_id', ['transaction_id'], false, 'btree'],
  ['transaction_files', 'ix_transaction_files_file_id', ['file_id'], false, 'btree'],
  ['transaction_files', 'ix_transaction_files_category_concept_id', ['category_concept_id'], false, 'btree'],
  ['transaction_files', 'ix_transaction_files_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['transaction_files', 'ix_transaction_files_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
