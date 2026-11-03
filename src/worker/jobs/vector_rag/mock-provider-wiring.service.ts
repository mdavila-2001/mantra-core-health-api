import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MockProviderClient } from '../../mock-provider-client.service';
import { declareProviderCapability } from '../../provider-capability';
import { EmbeddingDrainJob } from './embedding-drain.job';
import { createMockEmbeddingProviderAdapter } from './mock-embedding-provider.adapter';

/**
 * Sustituye el `providerAdapter` por defecto (que falla visible) por uno que
 * llama `mock-provider-server`, sólo si `MOCK_PROVIDER_BASE_URL` está
 * configurada.
 */
@Injectable()
export class MockProviderWiringService implements OnModuleInit {
  constructor(
    private readonly job: EmbeddingDrainJob,
    private readonly client: MockProviderClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MockProviderWiringService.name);
  }

  onModuleInit(): void {
    if (!this.client.isConfigured()) {
      declareProviderCapability(this.logger, 'vector_rag.embeddings', 'none');
      return;
    }
    declareProviderCapability(this.logger, 'vector_rag.embeddings', 'mock');

    this.job.providerAdapter = createMockEmbeddingProviderAdapter(this.client);
    this.logger.info(
      { operation: 'worker.vector_rag.mock-provider-wiring' },
      'EmbeddingDrainJob wired to mock-provider-server',
    );
  }
}
