import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `marketing` (parte 2/2).
 * 16 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const marketingIndexes2: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['segment_members', 'ix_segment_members_status_concept_id', ['status_concept_id'], false, 'btree'],
  ['segment_members', 'ix_segment_members_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['segment_members', 'ix_segment_members_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['segments', 'uq_segments_tenant_id_code', ['tenant_id', 'code'], true, 'btree'],
  ['segments', 'ix_segments_tenant_id', ['tenant_id'], false, 'btree'],
  ['segments', 'ix_segments_segment_type_concept_id', ['segment_type_concept_id'], false, 'btree'],
  ['segments', 'ix_segments_source_read_model_id', ['source_read_model_id'], false, 'btree'],
  ['segments', 'ix_segments_state_concept_id', ['state_concept_id'], false, 'btree'],
  ['segments', 'ix_segments_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['segments', 'ix_segments_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
  ['segments', 'ix_segments_tenant_id_state_concept_id', ['tenant_id', 'state_concept_id', 'updated_at desc'], false, 'btree'],
  ['tracked_links', 'uq_tracked_links_code', ['code'], true, 'btree'],
  ['tracked_links', 'ix_tracked_links_campaign_id', ['campaign_id'], false, 'btree'],
  ['tracked_links', 'ix_tracked_links_state_concept_id', ['state_concept_id'], false, 'btree'],
  ['tracked_links', 'ix_tracked_links_created_by_user_id', ['created_by_user_id'], false, 'btree'],
  ['tracked_links', 'ix_tracked_links_updated_by_user_id', ['updated_by_user_id'], false, 'btree'],
];
