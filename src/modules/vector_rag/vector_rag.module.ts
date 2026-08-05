import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import { MessagingModule } from '../messaging/messaging.module';
import {
  VectorGovernanceController,
  VectorRuntimeController,
} from './controllers';
import {
  VectorGovernanceService,
  EmbeddingPipelineService,
  RetrievalService,
  VectorMaintenanceService,
} from './services';
import {
  VectorCatalogRepository,
  VectorCorpusRepository,
  RetrievalRepository,
} from './repositories';

/**
 * Módulo 59 del modelo: búsqueda vectorial, evidencia RAG y gobierno de
 * embeddings (UC-59-01 … 13).
 *
 * Persiste el corpus troceado (`vector_chunks`), sus embeddings
 * (`vector_embeddings`, columna de tipo `vector` de pgvector) y la trazabilidad de
 * cada recuperación (`retrieval_sessions`, `retrieval_candidates`,
 * `retrieval_evidence`), que es lo que permite auditar por qué un asistente
 * clínico respondió lo que respondió — y qué se le ocultó.
 *
 * El índice HNSW sobre la columna de embeddings lo crea la capa 07 del arranque
 * del ORM: sin él, cada búsqueda por similitud recorre el corpus entero.
 */
@Module({
  imports: [
    MikroOrmModule.forFeature(Object.values(entities)),
    MessagingModule,
  ],
  controllers: [VectorGovernanceController, VectorRuntimeController],
  providers: [
    VectorCatalogRepository,
    VectorCorpusRepository,
    RetrievalRepository,
    VectorGovernanceService,
    EmbeddingPipelineService,
    RetrievalService,
    VectorMaintenanceService,
  ],
})
export class VectorRagModule {}
