import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MockProviderClient } from '../../mock-provider-client.service';
import { declareProviderCapability } from '../../provider-capability';
import { DeletionPipelineJob } from './deletion-pipeline.job';
import {
  createMockDeletionExecutionAdapter,
  createMockDeletionVerificationAdapter,
} from './mock-deletion-provider.adapter';

/**
 * Sustituye `executionAdapter`/`verificationAdapter` por defecto (que fallan
 * visible / nunca confirman ausencia) por adapters que llaman
 * `mock-provider-server`, sólo si `MOCK_PROVIDER_BASE_URL` está configurada.
 */
@Injectable()
export class MockProviderWiringService implements OnModuleInit {
  constructor(
    private readonly job: DeletionPipelineJob,
    private readonly client: MockProviderClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MockProviderWiringService.name);
  }

  onModuleInit(): void {
    if (!this.client.isConfigured()) {
      declareProviderCapability(
        this.logger,
        'cross_store_consistency.deletion',
        'none',
      );
      return;
    }
    declareProviderCapability(
      this.logger,
      'cross_store_consistency.deletion',
      'mock',
    );

    this.job.executionAdapter = createMockDeletionExecutionAdapter(this.client);
    this.job.verificationAdapter = createMockDeletionVerificationAdapter(
      this.client,
    );
    this.logger.info(
      { operation: 'worker.xstore.mock-provider-wiring' },
      'DeletionPipelineJob wired to mock-provider-server',
    );
  }
}
