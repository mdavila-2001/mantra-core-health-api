import { Module } from '@nestjs/common';
import { EmbeddingDrainJob } from './embedding-drain.job';

export { EmbeddingDrainJob } from './embedding-drain.job';

/**
 * Cierra el "bucle del worker" de `vector_rag/README.md`: drena la cola de
 * jobs de embedding (UC-59-05). `deletion-jobs` y `collections/:id/reconciliation`
 * no entran aquí porque no son de sondeo periódico — necesitan un
 * `sourceDocumentId`/`patientProfileId` o una lista `canonicalDocumentIds` que
 * vienen de un evento o de otro módulo (document_store), no de un
 * descubrimiento propio de este módulo.
 */
@Module({
  providers: [EmbeddingDrainJob],
})
export class VectorRagWorkerModule {}
