import { Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { GoogleEmailClient } from '../../google-email-client.service';
import { NotificationDeliveryJob } from './notification-delivery.job';
import { createGoogleEmailProviderAdapter } from './google-email-provider.adapter';

/**
 * Sustituye el `providerAdapter` por uno que envía correo real vía Gmail API,
 * sólo si las 4 variables `GOOGLE_OAUTH_*`/`GOOGLE_SENDER_EMAIL` están
 * configuradas (`GoogleEmailClient.isConfigured()`). Se registra DESPUÉS de
 * `MockProviderWiringService` en `messaging.worker-module.ts`: si ambos
 * proveedores están configurados a la vez, éste corre último y gana (el
 * proveedor real tiene precedencia sobre el doble de prueba).
 */
@Injectable()
export class GoogleProviderWiringService implements OnModuleInit {
  constructor(
    private readonly job: NotificationDeliveryJob,
    private readonly client: GoogleEmailClient,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GoogleProviderWiringService.name);
  }

  onModuleInit(): void {
    if (!this.client.isConfigured()) return;

    this.job.providerAdapter = createGoogleEmailProviderAdapter(this.client);
    this.logger.info(
      { operation: 'worker.messaging.google-provider-wiring' },
      'NotificationDeliveryJob wired to Gmail API (real provider)',
    );
  }
}
