# src / modules / vector rag / entities

Entidades y relaciones que representan el modelo persistente.

## Contents

### Files

| Archivo | Responsabilidad |
| --- | --- |
| `embedding_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `embedding_model_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Public export barrel for this folder. |
| `rag_access_policies.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `retrieval_candidates.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `retrieval_evidence.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `retrieval_feedback_events.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `retrieval_sessions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vector_chunks.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vector_collections.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vector_deletion_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vector_documents.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vector_embeddings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vector_reconciliation_runs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `vector_tenant_bindings.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |

## Maintenance guidelines

- Keep business rules outside transport adapters.
- Document decisions, preconditions, parameters, return values, and relevant errors with TSDoc.
- Update this index when a component is added, removed, or its responsibility changes.
