import type { IndexTuple } from '../catalog.types';

/**
 * Índices secundarios declarados por el modelo oficial para el schema `vector_rag`.
 * 33 definiciones. Generado desde los `<<INDEX_SET>>` de la bóveda SALUD;
 * no editar a mano: regenerar con `yarn orm:catalog`.
 */
export const vectorRagIndexes: readonly IndexTuple[] = [
  // [tabla, nombre, columnas, único, método]
  ['embedding_jobs', 'ix_embedding_jobs_tenant_status', ['tenant_id', 'status', 'created_at asc'], false, 'btree'],
  ['embedding_jobs', 'ix_embedding_jobs_collection', ['vector_collection_id', 'created_at desc'], false, 'btree'],
  ['embedding_model_versions', 'uq_embedding_model_version', ['provider_code', 'model_id', 'model_version'], false, 'btree'],
  ['embedding_model_versions', 'ix_embedding_model_approval', ['approved_for_phi', 'retired_at'], false, 'btree'],
  ['rag_access_policies', 'uq_rag_policy_tenant_code', ['tenant_id', 'code'], false, 'btree'],
  ['rag_access_policies', 'gin_rag_policy_purposes', ['allowed_purpose_codes'], false, 'btree'],
  ['rag_access_policies', 'gin_rag_policy_labels', ['allowed_security_labels'], false, 'btree'],
  ['retrieval_candidates', 'uq_retrieval_candidate_rank', ['retrieval_session_id', 'rank'], false, 'btree'],
  ['retrieval_candidates', 'uq_retrieval_candidate_chunk', ['retrieval_session_id', 'vector_chunk_id'], false, 'btree'],
  ['retrieval_candidates', 'ix_retrieval_candidate_selected', ['retrieval_session_id', 'selected', 'rank'], false, 'btree'],
  ['retrieval_evidence', 'uq_retrieval_evidence_citation', ['retrieval_session_id', 'citation_number'], false, 'btree'],
  ['retrieval_evidence', 'uq_retrieval_evidence_hash', ['retrieval_session_id', 'evidence_hash'], false, 'btree'],
  ['retrieval_feedback_events', 'ix_retrieval_feedback_session', ['retrieval_session_id', 'created_at desc'], false, 'btree'],
  ['retrieval_feedback_events', 'ix_retrieval_feedback_safety', ['safety_issue_code', 'created_at desc'], false, 'btree'],
  ['retrieval_sessions', 'ix_retrieval_session_principal', ['tenant_id', 'principal_id', 'started_at desc'], false, 'btree'],
  ['retrieval_sessions', 'ix_retrieval_session_patient', ['tenant_id', 'patient_profile_id', 'started_at desc'], false, 'btree'],
  ['retrieval_sessions', 'ix_retrieval_session_hash', ['tenant_id', 'query_hash', 'started_at desc'], false, 'btree'],
  ['vector_chunks', 'uq_vector_chunk_number', ['vector_document_id', 'chunk_number'], false, 'btree'],
  ['vector_chunks', 'uq_vector_chunk_hash', ['vector_document_id', 'chunk_hash'], false, 'btree'],
  ['vector_chunks', 'gin_vector_chunk_metadata', ['metadata'], false, 'btree'],
  ['vector_collections', 'uq_vector_collection_tenant_code', ['tenant_id', 'code'], false, 'btree'],
  ['vector_collections', 'ix_vector_collection_state', ['tenant_id', 'lifecycle_state'], false, 'btree'],
  ['vector_deletion_jobs', 'ix_vector_delete_tenant_status', ['tenant_id', 'status', 'requested_at asc'], false, 'btree'],
  ['vector_deletion_jobs', 'ix_vector_delete_patient', ['tenant_id', 'patient_profile_id'], false, 'btree'],
  ['vector_documents', 'uq_vector_doc_source_version', ['vector_collection_id', 'source_document_id', 'source_version_id'], false, 'btree'],
  ['vector_documents', 'ix_vector_doc_patient', ['vector_collection_id', 'patient_profile_id', 'created_at desc'], false, 'btree'],
  ['vector_documents', 'gin_vector_doc_labels', ['security_labels', 'purpose_of_use_codes'], false, 'btree'],
  ['vector_embeddings', 'uq_vector_embedding_chunk_model', ['vector_chunk_id', 'embedding_model_version_id'], false, 'btree'],
  ['vector_embeddings', 'ix_vector_embedding_state', ['lifecycle_state', 'generated_at desc'], false, 'btree'],
  ['vector_reconciliation_runs', 'ix_vector_reconcile_collection_time', ['vector_collection_id', 'started_at desc'], false, 'btree'],
  ['vector_reconciliation_runs', 'ix_vector_reconcile_status', ['tenant_id', 'status', 'started_at asc'], false, 'btree'],
  ['vector_tenant_bindings', 'uq_vector_binding_tenant_collection', ['tenant_id', 'vector_collection_id'], false, 'btree'],
  ['vector_tenant_bindings', 'uq_vector_binding_namespace', ['namespace'], false, 'btree'],
];
