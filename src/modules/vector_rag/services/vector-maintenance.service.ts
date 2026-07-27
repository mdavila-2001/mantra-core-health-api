import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import {
  VectorCatalogRepository,
  VectorCorpusRepository,
} from '../repositories';
import {
  PropagateDeletionDto,
  DeletionResponseDto,
  ReconcileCollectionDto,
  ReconciliationResponseDto,
} from '../dto';

const DEFAULT_DELETION_BATCH = 100;

/**
 * Mantenimiento del corpus (UC-59-10, 12): propagar el borrado de la fuente y
 * reconciliar lo que hay contra lo que debería haber.
 *
 * Los dos casos de uso responden a la misma verdad: **un embedding es un dato
 * derivado**. Si la fuente ya no está, el vector tampoco puede estar; y si el
 * vector dice algo que la fuente no dice, la fuente manda.
 */
@Injectable()
export class VectorMaintenanceService {
  constructor(
    private readonly em: EntityManager,
    private readonly corpusRepo: VectorCorpusRepository,
    private readonly catalogRepo: VectorCatalogRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VectorMaintenanceService.name);
  }

  /**
   * UC-59-10: propagar el borrado de la fuente a los embeddings.
   *
   * El borrado es **físico**, no un cambio de estado. Un embedding es una
   * representación del contenido: guardarlo "marcado como borrado" seguiría siendo
   * guardar el dato de un paciente que pidió que se borrara, y el índice HNSW
   * seguiría pudiendo devolverlo.
   *
   * El orden importa: embeddings, chunks y por último documentos. Al revés, un
   * fallo a mitad dejaría chunks y vectores apuntando a un documento que ya no
   * existe.
   *
   * `verified` significa que en esta pasada no quedaba nada más que purgar. Es la
   * prueba de borrado que el módulo 62 espera para cerrar la solicitud.
   */
  async propagateDeletion(
    dto: PropagateDeletionDto,
    actor: AuthenticatedUser,
  ): Promise<DeletionResponseDto> {
    return this.em.transactional(async (tx) => {
      if (!dto.sourceDocumentId && !dto.patientProfileId) {
        throw new PreconditionFailedException(
          'Hay que declarar qué se borra: un documento fuente o un paciente.',
        );
      }

      const job = this.corpusRepo.createDeletionJob(tx, {
        tenantId: dto.tenantId,
        sourceDocumentId: dto.sourceDocumentId,
        patientProfileId: dto.patientProfileId,
        deletionReason: dto.deletionReason,
        status: 'verifying',
      });

      const batchSize = dto.batchSize ?? DEFAULT_DELETION_BATCH;
      const documents = await this.corpusRepo.findDocumentsForDeletion(
        tx,
        {
          sourceDocumentId: dto.sourceDocumentId,
          patientProfileId: dto.patientProfileId,
        },
        batchSize,
      );
      const documentIds = documents.map((d) => d.id);

      const chunks = await this.corpusRepo.findChunksByDocuments(
        tx,
        documentIds,
      );
      const chunkIds = chunks.map((c) => c.id);

      const embeddingsPurged = await this.corpusRepo.deleteEmbeddingsByChunks(
        tx,
        chunkIds,
      );
      const chunksPurged = await this.corpusRepo.deleteChunks(tx, chunkIds);
      const documentsPurged = await this.corpusRepo.deleteDocuments(
        tx,
        documentIds,
      );

      // Si la pasada no llenó el lote, no queda nada más: el borrado está completo
      // y se puede dar por verificado.
      const verified = documents.length < batchSize;
      if (verified) {
        job.status = 'verified';
        job.verifiedAt = new Date();
      }

      await this.outbox.publishDomainEvent(tx, {
        tenantId: dto.tenantId,
        eventType: 'VectorEmbeddingsPurged',
        aggregateType: 'vector_rag.vector_deletion_jobs',
        aggregateId: job.id,
        payloadJson: {
          sourceDocumentId: dto.sourceDocumentId ?? null,
          patientProfileId: dto.patientProfileId ?? null,
          deletionReason: dto.deletionReason,
          documentsPurged,
          chunksPurged,
          embeddingsPurged,
          verified,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'vector.deletion.propagate',
          deletionJobId: job.id,
          documentsPurged,
          chunksPurged,
          embeddingsPurged,
          verified,
        },
        'Borrado propagado a los embeddings',
      );

      return {
        id: job.id,
        status: job.status,
        documentsPurged,
        chunksPurged,
        embeddingsPurged,
        verified,
      };
    });
  }

  /**
   * UC-59-12: reconciliar el manifiesto canónico contra el vectorial.
   *
   * Tres clases de deriva, y cada una se repara distinto:
   *
   * - **falta** (la fuente lo tiene, el vector no): se re-embebe;
   * - **huérfano** (el vector lo tiene, la fuente ya no): se purga — es un dato
   *   derivado de algo que dejó de existir, y seguir devolviéndolo en una búsqueda
   *   sería citar una fuente que ya no está;
   * - **descuadrado**: presente en ambos pero con contenido distinto; se re-embebe,
   *   porque el vector representa una versión que ya no es la buena.
   *
   * La reparación es opcional (`autoRepair`): a veces lo que hace falta es saber
   * cuánta deriva hay antes de decidir si conviene arreglarla ahora.
   */
  async reconcileCollection(
    collectionId: string,
    dto: ReconcileCollectionDto,
    actor: AuthenticatedUser,
  ): Promise<ReconciliationResponseDto> {
    return this.em.transactional(async (tx) => {
      const startedAt = new Date();

      const collection = await this.catalogRepo.findCollectionById(
        tx,
        collectionId,
      );
      if (!collection) {
        throw new ResourceNotFoundException('Colección no encontrada.', {
          collectionId,
        });
      }

      const documents = await this.corpusRepo.findActiveDocumentsByCollection(
        tx,
        collectionId,
        'active',
      );

      const canonical = new Set(dto.canonicalDocumentIds);
      const vectorIds = new Set(documents.map((d) => d.sourceDocumentId));

      const missing = dto.canonicalDocumentIds.filter(
        (id) => !vectorIds.has(id),
      );
      const orphans = documents.filter(
        (d) => !canonical.has(d.sourceDocumentId),
      );

      // Un documento presente en los dos lados pero con más de una versión activa
      // en el vector está descuadrado: el corpus conserva una versión que la fuente
      // ya sustituyó.
      const versionsBySource = new Map<string, number>();
      for (const document of documents) {
        if (!canonical.has(document.sourceDocumentId)) continue;
        versionsBySource.set(
          document.sourceDocumentId,
          (versionsBySource.get(document.sourceDocumentId) ?? 0) + 1,
        );
      }
      const mismatched = [...versionsBySource.entries()].filter(
        ([, count]) => count > 1,
      );

      const vectorManifestHash = createHash('sha256')
        .update([...vectorIds].sort().join('|'))
        .digest('hex');

      const drift = missing.length + orphans.length + mismatched.length;
      const status = drift === 0 ? 'clean' : 'drift_detected';

      let repairJobId: string | undefined;
      let purgeJobId: string | undefined;

      if (dto.autoRepair !== false && drift > 0) {
        if (missing.length > 0 || mismatched.length > 0) {
          const job = this.catalogRepo.createJob(tx, {
            tenantId: collection.tenantId,
            vectorCollectionId: collectionId,
            jobType: 'incremental',
            sourceScope: {
              scope: 'reconciliation',
              missing,
              mismatched: mismatched.map(([id]) => id),
            },
            requestedByUserId: actor.id,
            status: 'queued',
            totalChunks: 0,
          });
          repairJobId = job.id;
        }
        if (orphans.length > 0) {
          const job = this.corpusRepo.createDeletionJob(tx, {
            tenantId: collection.tenantId,
            deletionReason: 'orphan_purge',
            status: 'requested',
          });
          purgeJobId = job.id;
        }
      }

      const run = this.corpusRepo.createReconciliationRun(tx, {
        tenantId: collection.tenantId,
        vectorCollectionId: collectionId,
        canonicalManifestHash: dto.canonicalManifestHash,
        vectorManifestHash,
        missingCount: missing.length,
        orphanCount: orphans.length,
        mismatchedCount: mismatched.length,
        status,
        startedAt,
        completedAt: new Date(),
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: collection.tenantId,
        eventType: 'VectorReconciliationCompleted',
        aggregateType: 'vector_rag.vector_reconciliation_runs',
        aggregateId: run.id,
        payloadJson: {
          vectorCollectionId: collectionId,
          missingCount: missing.length,
          orphanCount: orphans.length,
          mismatchedCount: mismatched.length,
          status,
        },
        actorUserId: actor.id,
      });

      if (drift > 0) {
        await this.outbox.publishDomainEvent(tx, {
          tenantId: collection.tenantId,
          eventType: 'DriftDetected',
          aggregateType: 'vector_rag.vector_collections',
          aggregateId: collectionId,
          payloadJson: {
            reconciliationRunId: run.id,
            missingCount: missing.length,
            orphanCount: orphans.length,
            mismatchedCount: mismatched.length,
            repairJobId: repairJobId ?? null,
            purgeJobId: purgeJobId ?? null,
          },
          actorUserId: actor.id,
        });

        this.logger.warn(
          {
            operation: 'vector.reconciliation.drift',
            collectionId,
            missing: missing.length,
            orphans: orphans.length,
            mismatched: mismatched.length,
          },
          'Deriva detectada entre el manifiesto canónico y el vectorial',
        );
      } else {
        this.logger.info(
          { operation: 'vector.reconciliation.clean', collectionId },
          'Reconciliación sin deriva',
        );
      }

      return {
        id: run.id,
        status,
        missingCount: missing.length,
        orphanCount: orphans.length,
        mismatchedCount: mismatched.length,
        repairJobId,
        purgeJobId,
      };
    });
  }
}
