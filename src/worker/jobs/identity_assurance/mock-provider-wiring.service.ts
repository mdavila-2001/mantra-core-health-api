import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MockProviderClient } from '../../mock-provider-client.service';
import { DispatchIdentityChecksJob } from './dispatch-identity-checks.job';
import { createMockIdentityVerificationAdapter } from './mock-identity-verification-provider.adapter';

/**
 * Sustituye el `providerAdapter` por defecto (que falla visible con
 * `PROVIDER_NOT_CONFIGURED`) por uno que llama a `mock-provider-server`, sólo
 * si `MOCK_PROVIDER_BASE_URL` está configurada.
 */
@Injectable()
export class MockProviderWiringService implements OnModuleInit {
  constructor(
    private readonly job: DispatchIdentityChecksJob,
    private readonly client: MockProviderClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MockProviderWiringService.name);
  }

  onModuleInit(): void {
    if (!this.client.isConfigured()) return;

    this.job.providerAdapter = createMockIdentityVerificationAdapter(
      this.client,
    );
    this.logger.info(
      { operation: 'worker.identity_assurance.mock-provider-wiring' },
      'DispatchIdentityChecksJob wired to mock-provider-server',
    );
  }
}
