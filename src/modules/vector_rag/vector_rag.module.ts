import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { VectorRagController } from './vector_rag.controller';
import { VectorRagService } from './vector_rag.service';
import * as entities from './entities';

/**
 * Módulo 59 del modelo: almacén vectorial para recuperación aumentada (RAG).
 *
 * Persiste el corpus troceado (`vector_chunks`), sus embeddings
 * (`vector_embeddings`, columna de tipo `vector` de pgvector) y la trazabilidad
 * de cada recuperación (`retrieval_sessions`, `retrieval_evidence`), que es lo
 * que permite auditar por qué un asistente clínico respondió lo que respondió.
 *
 * El índice HNSW sobre la columna de embeddings lo crea la capa 07 del arranque
 * del ORM: sin él, cada búsqueda por similitud recorre el corpus entero.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [VectorRagController],
  providers: [VectorRagService],
})
export class VectorRagModule {}
