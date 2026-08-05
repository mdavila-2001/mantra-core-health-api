import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MockProviderClient } from '../../mock-provider-client.service';
import { NotificationDeliveryJob } from './notification-delivery.job';
import { createMockNotificationProviderAdapter } from './mock-notification-provider.adapter';

/**
 * Sustituye el `providerAdapter` por defecto (que falla visible) por uno que
 * llama `mock-provider-server`, sólo si `MOCK_PROVIDER_BASE_URL` está
 * configurada — ver `worker.env.ts`. Vive aparte de `NotificationDeliveryJob`
 * a propósito: el job no debe saber qué proveedor concreto existe, sólo
 * exponer el punto de extensión (`providerAdapter`, mutable).
 */
@Injectable()
export class MockProviderWiringService implements OnModuleInit {
  constructor(
    private readonly job: NotificationDeliveryJob,
    private readonly client: MockProviderClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MockProviderWiringService.name);
  }

  onModuleInit(): void {
    if (!this.client.isConfigured()) return;

    this.job.providerAdapter = createMockNotificationProviderAdapter(
      this.client,
    );
    this.logger.info(
      { operation: 'worker.messaging.mock-provider-wiring' },
      'NotificationDeliveryJob wired to mock-provider-server',
    );
  }
}
