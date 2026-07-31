import { createHash, randomUUID } from 'node:crypto';
import { MockProviderClient } from '../../mock-provider-client.service';
import type {
  EmbeddingProviderAdapter,
  EmbeddingProviderOutcome,
  QueuedEmbeddingJobSummary,
} from './embedding-drain.job';

/** Refleja `ComputeEmbeddingsResponseDto` de `mock-provider-server`. */
interface MockComputeResponse {
  model: string;
  dimension: number;
  data: Array<{ index: number; embedding: number[]; tokenCount: number }>;
}

/**
 * Adapter real (contra un doble de prueba): pide un vector al emulador de
 * embeddings y arma el `EmbeddedDocumentDto` que `EmbeddingPipelineService`
 * necesita.
 *
 * Límite honesto: este job no tiene acceso al contenido real que el job de
 * embedding debería indexar (`EmbeddingPipelineService` "no calcula
 * embeddings, los recibe ya calculados del worker" — pero de dónde saca el
 * worker el TEXTO fuente es una integración que no existe todavía en este
 * repo, ver `ESTADO-Y-PENDIENTES.md`). Este adapter arma un único documento
 * SINTÉTICO por job (texto de prueba, no contenido real) sólo para probar
 * que el cableado de punta a punta funciona: descubrir → pedir el vector →
 * persistirlo vía `run`. No indexa nada real — sustituir por un adapter que
 * traiga el texto real es justamente lo que falta conectar.
 */
export function createMockEmbeddingProviderAdapter(
  client: MockProviderClient,
): EmbeddingProviderAdapter {
  return async (
    job: QueuedEmbeddingJobSummary,
  ): Promise<EmbeddingProviderOutcome> => {
    const text = `[mock-provider-server] contenido sintético de prueba para el job de embedding ${job.id}`;

    const response = await client.post<MockComputeResponse>(
      '/embeddings/compute',
      { inputs: [text] },
    );
    const datum = response.data[0];

    const chunkHash = sha256(text);
    const embeddingLiteral = `[${datum.embedding.join(',')}]`;
    const embeddingHash = sha256(embeddingLiteral);

    return {
      succeeded: true,
      finalBatch: true,
      documents: [
        {
          sourceDocumentId: randomUUID(),
          sourceVersionId: randomUUID(),
          documentType: 'MOCK_SYNTHETIC',
          chunks: [
            {
              chunkNumber: 0,
              chunkTextRedacted: text,
              tokenCount: datum.tokenCount,
              chunkHash,
              embedding: embeddingLiteral,
              embeddingHash,
            },
          ],
        },
      ],
    };
  };
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
