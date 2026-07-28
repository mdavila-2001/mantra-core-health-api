import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { OutboxService } from '../../messaging/services';
import {
  VectorCatalogRepository,
  VectorCorpusRepository,
} from '../repositories';
import { ACTIVE_JOB_STATUSES } from '../constants';
import {
  QueueEmbeddingJobDto,
  EmbeddingJobResponseDto,
  RunEmbeddingJobDto,
  RunEmbeddingJobResponseDto,
  ReEmbedCollectionDto,
  ReEmbedResponseDto,
} from '../dto';

/**
 * Pipeline de embeddings (UC-59-04, 05, 11): encolar el trabajo, ejecutarlo por
 * lotes y migrar la colección a un modelo nuevo.
 *
 * Este servicio **no calcula embeddings**: los recibe ya calculados del worker.
 * Lo que aporta es que el corpus quede consistente —documento, chunks y vectores
 * en la misma transacción— y que reejecutar no duplique nada.
 */
@Injectable()
export class EmbeddingPipelineService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param catalogRepo - Valor de catalog repo requerido por la operación.
   * @param corpusRepo - Valor de corpus repo requerido por la operación.
   * @param outbox - Valor de outbox requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: VectorCatalogRepository,
    private readonly corpusRepo: VectorCorpusRepository,
    private readonly outbox: OutboxService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmbeddingPipelineService.name);
  }

  /**
   * UC-59-04: encolar un job de embedding.
   *
   * Sólo sobre colección activa: encolar contra una sellada dejaría trabajo en
   * cola que nunca debería ejecutarse, y el worker no tiene forma de saberlo.
   *
   * La idempotencia es por `(colección, tipo, alcance)`: el mismo backfill pedido
   * dos veces es el mismo trabajo, y ejecutarlo dos veces cuesta el doble sin
   * cambiar nada.
   */
  async queueEmbeddingJob(
    collectionId: string,
    dto: QueueEmbeddingJobDto,
    actor: AuthenticatedUser,
    idempotencyKey?: string,
  ): Promise<EmbeddingJobResponseDto> {
    return this.em.transactional(async (tx) => {
      const collection = await this.catalogRepo.findCollectionById(
        tx,
        collectionId,
      );
      if (!collection) {
        throw new ResourceNotFoundException('Colección no encontrada.', {
          collectionId,
        });
      }
      if (collection.lifecycleState !== 'active') {
        throw new PreconditionFailedException(
          'La colección no está activa; no admite jobs de embedding.',
          { collectionId, lifecycleState: collection.lifecycleState },
        );
      }

      const key =
        idempotencyKey ??
        this.deriveScopeKey(collectionId, dto.jobType, dto.sourceScope);

      const job = this.catalogRepo.createJob(tx, {
        tenantId: collection.tenantId,
        vectorCollectionId: collectionId,
        jobType: dto.jobType,
        sourceScope: dto.sourceScope,
        requestedByUserId: actor.id,
        status: 'queued',
        totalChunks: dto.totalChunks ?? 0,
      });

      const published = await this.outbox.publishDomainEvent(tx, {
        tenantId: collection.tenantId,
        eventType: 'EmbeddingJobQueued',
        aggregateType: 'vector_rag.embedding_jobs',
        aggregateId: job.id,
        payloadJson: {
          vectorCollectionId: collectionId,
          jobType: dto.jobType,
          totalChunks: job.totalChunks,
        },
        idempotencyKey: `vector-job:${key}`,
        actorUserId: actor.id,
      });

      this.logger.info(
        {
          operation: 'vector.job.queue',
          jobId: job.id,
          collectionId,
          jobType: dto.jobType,
          duplicate: published.duplicate,
        },
        'Job de embedding encolado',
      );

      return {
        id: job.id,
        vectorCollectionId: collectionId,
        jobType: job.jobType,
        status: job.status,
        duplicate: published.duplicate,
      };
    });
  }

  /**
   * UC-59-05: ejecutar un lote del job.
   *
   * El worker manda documentos ya troceados, redactados y embebidos; aquí se
   * persisten los tres niveles juntos. Que sea una sola transacción es lo que
   * impide que quede un chunk sin su vector: un chunk sin embedding es invisible
   * para la búsqueda y, a la vez, cuenta como presente en la reconciliación.
   *
   * Reejecutar es seguro en los tres niveles: el documento se reencuentra por su
   * versión fuente, el chunk por su hash y el embedding por `(chunk, modelo)`.
   */
  async runEmbeddingJob(
    jobId: string,
    dto: RunEmbeddingJobDto,
    actor: AuthenticatedUser,
  ): Promise<RunEmbeddingJobResponseDto> {
    return this.em.transactional(async (tx) => {
      const job = await this.catalogRepo.findJobForUpdate(tx, jobId);
      if (!job) {
        throw new ResourceNotFoundException('Job de embedding no encontrado.', {
          jobId,
        });
      }
      if (!(ACTIVE_JOB_STATUSES as readonly string[]).includes(job.status)) {
        throw new PreconditionFailedException(
          'El job ya no está en cola ni en ejecución.',
          {
            jobId,
            status: job.status,
          },
        );
      }

      const collection = await this.catalogRepo.findCollectionById(
        tx,
        job.vectorCollectionId,
      );
      if (!collection) {
        throw new ResourceNotFoundException('Colección no encontrada.', {
          collectionId: job.vectorCollectionId,
        });
      }

      const model = await this.catalogRepo.findModelVersionById(
        tx,
        collection.embeddingModelVersionId,
      );
      if (!model) {
        throw new ResourceNotFoundException(
          'Versión de modelo no encontrada.',
          {
            embeddingModelVersionId: collection.embeddingModelVersionId,
          },
        );
      }
      // Un job que arrancó antes de retirar el modelo no debe seguir escribiendo
      // vectores con él: lo que produzca a partir de ahora ya no sería utilizable.
      if (model.retiredAt) {
        throw new PreconditionFailedException(
          'El modelo de la colección está retirado; el job no puede seguir.',
          { jobId, embeddingModelVersionId: model.id },
        );
      }

      job.status = 'running';

      let documentsUpserted = 0;
      let chunksCreated = 0;
      let embeddingsCreated = 0;
      let chunksSkipped = 0;

      for (const input of dto.documents) {
        // Una colección sin PHI no puede recibir un documento marcado con datos de
        // paciente: la política de acceso de la colección no está pensada para eso.
        if (input.containsPhi === true && !collection.containsPhi) {
          throw new PreconditionFailedException(
            'La colección no admite datos de paciente y el documento los declara.',
            { sourceDocumentId: input.sourceDocumentId },
          );
        }

        let document = await this.corpusRepo.findDocument(
          tx,
          collection.id,
          input.sourceDocumentId,
          input.sourceVersionId,
        );
        if (!document) {
          document = this.corpusRepo.createDocument(tx, {
            vectorCollectionId: collection.id,
            sourceDocumentId: input.sourceDocumentId,
            sourceVersionId: input.sourceVersionId,
            documentType: input.documentType,
            language: input.language,
            title: input.title,
            contentHash: input.contentHash,
            containsPhi: input.containsPhi === true,
            patientProfileId: input.patientProfileId,
            securityLabels: input.securityLabels ?? [],
            purposeOfUseCodes: input.purposeOfUseCodes ?? [],
            lifecycleState: 'active',
          });
          documentsUpserted += 1;
        }

        for (const chunkInput of input.chunks) {
          let chunk = await this.corpusRepo.findChunkByHash(
            tx,
            document.id,
            chunkInput.chunkHash,
          );
          if (!chunk) {
            chunk = this.corpusRepo.createChunk(tx, {
              vectorDocumentId: document.id,
              chunkNumber: chunkInput.chunkNumber,
              chunkTextRedacted: chunkInput.chunkTextRedacted,
              tokenCount: chunkInput.tokenCount,
              chunkHash: chunkInput.chunkHash,
              sectionPath: chunkInput.sectionPath,
              metadata: chunkInput.metadata,
            });
            chunksCreated += 1;
          }

          const existingEmbedding = await this.corpusRepo.findEmbedding(
            tx,
            chunk.id,
            model.id,
          );
          if (existingEmbedding) {
            chunksSkipped += 1;
            continue;
          }

          this.corpusRepo.createEmbedding(tx, {
            vectorChunkId: chunk.id,
            embeddingModelVersionId: model.id,
            embedding: chunkInput.embedding,
            embeddingHash: chunkInput.embeddingHash,
            lifecycleState: 'active',
          });
          embeddingsCreated += 1;
        }
      }

      job.completedChunks =
        (job.completedChunks ?? 0) + chunksCreated + chunksSkipped;

      if (dto.finalBatch === true) {
        job.status = 'completed';
        job.completedAt = new Date();

        await this.outbox.publishDomainEvent(tx, {
          tenantId: collection.tenantId,
          eventType: 'EmbeddingJobCompleted',
          aggregateType: 'vector_rag.embedding_jobs',
          aggregateId: job.id,
          payloadJson: {
            vectorCollectionId: collection.id,
            completedChunks: job.completedChunks,
            failedChunks: job.failedChunks ?? 0,
          },
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'vector.job.run',
          jobId,
          documentsUpserted,
          chunksCreated,
          embeddingsCreated,
          chunksSkipped,
          status: job.status,
        },
        'Lote de embedding procesado',
      );

      return {
        jobId: job.id,
        status: job.status,
        documentsUpserted,
        chunksCreated,
        embeddingsCreated,
        chunksSkipped,
      };
    });
  }

  /**
   * UC-59-11: migrar la colección a un modelo nuevo.
   *
   * Los embeddings viejos **no se borran**: pasan a `superseded`. Es lo que
   * permite seguir sirviendo búsquedas mientras el re-embedding corre; borrarlos
   * primero dejaría la colección ciega hasta que terminara.
   *
   * La clave `(chunk, modelo)` es lo que hace posible esa convivencia sin
   * colisión.
   */
  async reEmbedCollection(
    collectionId: string,
    dto: ReEmbedCollectionDto,
    actor: AuthenticatedUser,
  ): Promise<ReEmbedResponseDto> {
    return this.em.transactional(async (tx) => {
      const collection = await this.catalogRepo.findCollectionForUpdate(
        tx,
        collectionId,
      );
      if (!collection) {
        throw new ResourceNotFoundException('Colección no encontrada.', {
          collectionId,
        });
      }
      if (collection.lifecycleState !== 'active') {
        throw new PreconditionFailedException('La colección no está activa.', {
          collectionId,
          lifecycleState: collection.lifecycleState,
        });
      }
      if (collection.embeddingModelVersionId === dto.embeddingModelVersionId) {
        throw new ConflictException(
          'La colección ya usa esa versión de modelo.',
          {
            collectionId,
            embeddingModelVersionId: dto.embeddingModelVersionId,
          },
        );
      }

      const model = await this.catalogRepo.findModelVersionForUpdate(
        tx,
        dto.embeddingModelVersionId,
      );
      if (!model) {
        throw new ResourceNotFoundException(
          'Versión de modelo no encontrada.',
          {
            embeddingModelVersionId: dto.embeddingModelVersionId,
          },
        );
      }
      if (model.retiredAt) {
        throw new PreconditionFailedException(
          'El modelo de destino está retirado.',
          {
            embeddingModelVersionId: model.id,
          },
        );
      }
      if (collection.containsPhi && !model.approvedForPhi) {
        throw new PreconditionFailedException(
          'El modelo de destino no está aprobado para datos de paciente.',
          { embeddingModelVersionId: model.id },
        );
      }

      const previousModelId = collection.embeddingModelVersionId;

      let supersededEmbeddings = 0;
      if (dto.supersedePrevious !== false) {
        const documents = await this.corpusRepo.findActiveDocumentsByCollection(
          tx,
          collectionId,
          'active',
        );
        const chunks = await this.corpusRepo.findChunksByDocuments(
          tx,
          documents.map((d) => d.id),
        );
        const embeddings =
          await this.corpusRepo.findEmbeddingsByChunksAndModelForUpdate(
            tx,
            chunks.map((c) => c.id),
            previousModelId,
          );
        for (const embedding of embeddings) {
          if (embedding.lifecycleState !== 'active') continue;
          embedding.lifecycleState = 'superseded';
          supersededEmbeddings += 1;
        }
      }

      collection.embeddingModelVersionId = model.id;
      collection.dimension = model.dimension;
      collection.distanceMetric = model.distanceMetric;

      const job = this.catalogRepo.createJob(tx, {
        tenantId: collection.tenantId,
        vectorCollectionId: collectionId,
        jobType: 're_embed',
        sourceScope: { scope: 'collection', vectorCollectionId: collectionId },
        requestedByUserId: actor.id,
        status: 'queued',
        totalChunks: 0,
      });

      await this.outbox.publishDomainEvent(tx, {
        tenantId: collection.tenantId,
        eventType: 'CollectionReEmbedRequested',
        aggregateType: 'vector_rag.vector_collections',
        aggregateId: collectionId,
        payloadJson: {
          previousModelVersionId: previousModelId,
          embeddingModelVersionId: model.id,
          embeddingJobId: job.id,
          supersededEmbeddings,
        },
        actorUserId: actor.id,
      });

      this.logger.warn(
        {
          operation: 'vector.collection.re-embed',
          collectionId,
          embeddingModelVersionId: model.id,
          supersededEmbeddings,
        },
        'Re-embedding de colección solicitado',
      );

      return {
        vectorCollectionId: collectionId,
        embeddingJobId: job.id,
        embeddingModelVersionId: model.id,
        supersededEmbeddings,
      };
    });
  }

  /**
   * Clave estable del alcance del job. Se deriva del contenido para que el mismo
   * trabajo pedido dos veces produzca la misma clave sin que el llamante tenga que
   * acordarse de mandarla.
   */
  private deriveScopeKey(
    collectionId: string,
    jobType: string,
    sourceScope: Record<string, unknown>,
  ): string {
    return createHash('sha256')
      .update(collectionId)
      .update(jobType)
      .update(JSON.stringify(sourceScope))
      .digest('hex');
  }
}
