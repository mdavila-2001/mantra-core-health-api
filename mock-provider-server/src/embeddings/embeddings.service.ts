import { createHash } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MOCK_ENV } from '../common/env.module';
import type { MockProviderEnv } from '../common/env';
import { simulatedDelay } from '../common/simulate';
import {
  ComputeEmbeddingsDto,
  ComputeEmbeddingsResponseDto,
} from './embeddings.dto';

const DEFAULT_MODEL = 'mock-embedding-v1';
const DIMENSION = 256;

/**
 * Emula una API de embeddings (OpenAI, Cohere, un modelo propio...). El
 * vector no tiene significado semántico real — se deriva determinísticamente
 * de un hash del texto, así que el MISMO texto siempre produce el MISMO
 * vector. Eso es justo lo que un consumidor necesita para probar lógica de
 * deduplicación/idempotencia (`chunk_hash`, `embedding_hash` en
 * `EmbeddingPipelineService`) sin depender de un proveedor real ni de
 * aleatoriedad que rompería esos tests.
 */
@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);

  constructor(@Inject(MOCK_ENV) private readonly env: MockProviderEnv) {}

  async compute(
    dto: ComputeEmbeddingsDto,
  ): Promise<ComputeEmbeddingsResponseDto> {
    await simulatedDelay(this.env.simulatedLatencyMs);

    const model = dto.model ?? DEFAULT_MODEL;
    const data = dto.inputs.map((input, index) => ({
      index,
      embedding: deterministicVector(input, DIMENSION),
      tokenCount: estimateTokenCount(input),
    }));

    this.logger.log(`compute ${data.length} embedding(s) with ${model}`);
    return { model, dimension: DIMENSION, data };
  }
}

/** Vector unitario derivado de SHA-256(text || índice de componente). */
function deterministicVector(text: string, dimension: number): number[] {
  const vector: number[] = [];
  for (let i = 0; i < dimension; i++) {
    const digest = createHash('sha256').update(text).update(String(i)).digest();
    // Dos bytes -> entero en [0, 65535] -> float en [-1, 1].
    const raw = digest.readUInt16BE(0);
    vector.push(raw / 32767.5 - 1);
  }
  return normalize(vector);
}

function normalize(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  if (magnitude === 0) return vector;
  return vector.map((v) => v / magnitude);
}

/** Aproximación gruesa (no un tokenizador real): ~4 caracteres por token. */
function estimateTokenCount(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
