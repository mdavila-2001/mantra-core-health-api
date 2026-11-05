import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { WORKER_ENV, type WorkerEnv } from '../../worker.tokens';
import { NotificationDeliveryJob } from './notification-delivery.job';
import { withEmailRecipientDomainGuard } from './email-recipient-domain-guard';

/**
 * Envuelve el `providerAdapter` ya cableado con la guarda de dominios de
 * destinatario (`EMAIL_ALLOWED_RECIPIENT_DOMAINS`). Se registra al FINAL de
 * `messaging.worker-module.ts`, después de los wirings del mock y de Google,
 * para decorar el adapter que haya ganado, sea cual sea: ningún correo sale
 * por un camino que no pase por aquí. Sin la variable no hace nada.
 */
@Injectable()
export class EmailRecipientGuardWiringService implements OnModuleInit {
  constructor(
    private readonly job: NotificationDeliveryJob,
    @Inject(WORKER_ENV) private readonly env: WorkerEnv,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(EmailRecipientGuardWiringService.name);
  }

  onModuleInit(): void {
    const allowed = this.env.emailAllowedRecipientDomains;
    if (allowed.length === 0) return;

    this.job.providerAdapter = withEmailRecipientDomainGuard(
      this.job.providerAdapter,
      allowed,
      (request, domains) =>
        this.logger.warn(
          {
            operation: 'worker.messaging.email-recipient-guard',
            requestId: request.id,
            recipientDomains: domains,
          },
          'Email suppressed: recipient domain not in EMAIL_ALLOWED_RECIPIENT_DOMAINS',
        ),
    );
    this.logger.info(
      {
        operation: 'worker.messaging.email-recipient-guard',
        allowedDomains: allowed,
      },
      'Email delivery restricted to allowed recipient domains',
    );
  }
}
