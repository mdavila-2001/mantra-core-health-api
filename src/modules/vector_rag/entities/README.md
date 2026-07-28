# src / modules / vector rag / entities

Entidades y relaciones que representan el modelo persistente.

## Contenido

### Archivos

| Archivo | Responsabilidad |
| --- | --- |
| `embedding_jobs.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `embedding_model_versions.entity.ts` | Mapeo de una entidad persistente y sus relaciones. |
| `index.ts` | Punto de exportación pública de la carpeta. |
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

## Criterios de mantenimiento

- Mantener las reglas de negocio fuera de los adaptadores de transporte.
- Documentar con TSDoc las decisiones, precondiciones, parámetros, retornos y errores relevantes.
- Actualizar este índice cuando se agregue, elimine o cambie la responsabilidad de un componente.
