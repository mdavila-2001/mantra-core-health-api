import { Inject, Injectable, type OnModuleInit } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import {
  GUARDIAN_LINK_JOB_TYPE,
  type GuardianLinkIssueResponse,
} from '../../../modules/profiles/guardian-link.contract';
import { SystemApiClient } from '../../system-api-client.service';
import {
  PHONE_MESSAGING_CHANNEL,
  type PhoneMessagingChannel,
} from './phone/phone-messaging-channel.port';
import { registerQueueJobHandler, type QueueJobHandler } from './queue.job';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;

/** Lo que `issue` necesita, sacado del job de la cola. */
interface GuardianLinkJobInput {
  domainEventId: string;
  tenantId?: string;
  patientProfileId: string;
  relatedPersonId: string;
  guardianPersonId: string;
}

/** Lo que el handler deja como `result_json` del job. Sin datos personales. */
export type GuardianLinkJobResult =
  | { invitationId: string; status: 'SENT'; provider: string }
  | { invitationId: string; status: 'SKIPPED'; reason: string }
  | { invitationId: string; status: 'INVALID_PHONE' }
  | { invitationId: string; status: 'FAILED_PERMANENT'; errorCode: string };

/**
 * Suscriptor de `GuardianLinkRequested`: consume la cola `guardian-links`.
 *
 * Por job: (1) pide a la API que emita la invitación —ella resuelve y
 * normaliza el teléfono y genera el token—, (2) envía por el canal de
 * teléfono activo, (3) asienta el resultado.
 *
 * ## Reintentos
 *
 * - Rechazo reintentable (429, 5xx, red): se asienta `FAILED` y el handler
 *   **lanza**, así la cola aplica su backoff y, agotados los intentos, lo deja
 *   en `guardian-links-dlq`. El siguiente intento rota el token.
 * - Rechazo definitivo (número inválido, sin proveedor en producción): se
 *   asienta y el job se completa; reintentar no cambiaría nada.
 * - Teléfono no normalizable: lo resuelve la API (`INVALID_PHONE`) sin enviar.
 */
@Injectable()
export class GuardianLinkSubscriber implements OnModuleInit {
  constructor(
    private readonly api: SystemApiClient,
    private readonly logger: PinoLogger,
    @Inject(PHONE_MESSAGING_CHANNEL)
    private readonly channel: PhoneMessagingChannel,
  ) {
    this.logger.setContext(GuardianLinkSubscriber.name);
  }

  onModuleInit(): void {
    registerQueueJobHandler(GUARDIAN_LINK_JOB_TYPE, this.handler);
  }

  /** El handler registrado en la cola (expuesto para las pruebas). */
  readonly handler: QueueJobHandler = (job) => this.handle(job.payloadJson);

  private async handle(payloadJson: unknown): Promise<GuardianLinkJobResult> {
    const input = parseJobPayload(payloadJson);
    const issued = await this.api.post<GuardianLinkIssueResponse>(
      '/internal/guardian-links/issue',
      input,
      // Idempotente por evento: repetirla sólo rota un token que nadie recibió.
      { idempotent: true },
    );

    if (issued.action === 'SKIP')
      return {
        invitationId: issued.invitationId,
        status: 'SKIPPED',
        reason: issued.reason,
      };
    if (issued.action === 'INVALID_PHONE')
      return { invitationId: issued.invitationId, status: 'INVALID_PHONE' };

    const sent = await this.channel.send({
      toE164: issued.toE164,
      body: issued.body,
      reference: issued.invitationId,
    });

    await this.api.post(
      `/internal/guardian-links/${issued.invitationId}/delivery`,
      sent.outcome === 'SENT'
        ? {
            outcome: 'SENT',
            channel: this.channel.channel,
            providerMessageRef: sent.providerMessageRef,
          }
        : {
            outcome: 'FAILED',
            channel: this.channel.channel,
            errorCode: sent.errorCode,
          },
    );

    if (sent.outcome === 'SENT') {
      this.logger.info(
        {
          operation: 'worker.messaging.guardian-link',
          invitationId: issued.invitationId,
          provider: this.channel.providerName,
          simulated: !this.channel.isReal,
        },
        'Guardian link sent',
      );
      return {
        invitationId: issued.invitationId,
        status: 'SENT',
        provider: this.channel.providerName,
      };
    }

    this.logger.warn(
      {
        operation: 'worker.messaging.guardian-link',
        invitationId: issued.invitationId,
        provider: this.channel.providerName,
        errorCode: sent.errorCode,
        retryable: sent.retryable,
      },
      'Guardian link delivery failed',
    );
    if (sent.retryable)
      throw new Error(`guardian-link: envío fallido (${sent.errorCode})`);
    return {
      invitationId: issued.invitationId,
      status: 'FAILED_PERMANENT',
      errorCode: sent.errorCode,
    };
  }
}

/**
 * Extrae el evento del job. `OutboxService.enqueueSubscriberJob` encola
 * `{ domainEventId, subscriptionId, subscriberCode, event: <payload> }`.
 *
 * @throws Error si el job no tiene esa forma: agota reintentos y cae a la cola
 *   muerta, visible, en vez de completarse sin haber hecho nada.
 */
export function parseJobPayload(payloadJson: unknown): GuardianLinkJobInput {
  if (!payloadJson || typeof payloadJson !== 'object')
    throw new Error('guardian-link: payload vacío');
  const job = payloadJson as Record<string, unknown>;
  const event = job.event;
  if (!event || typeof event !== 'object')
    throw new Error('guardian-link: el job no trae el evento');
  const data = event as Record<string, unknown>;

  const uuid = (value: unknown, name: string): string => {
    if (typeof value !== 'string' || !UUID.test(value))
      throw new Error(`guardian-link: ${name} inválido`);
    return value;
  };

  return {
    domainEventId: uuid(job.domainEventId, 'domainEventId'),
    patientProfileId: uuid(data.patientProfileId, 'patientProfileId'),
    relatedPersonId: uuid(data.relatedPersonId, 'relatedPersonId'),
    guardianPersonId: uuid(data.guardianPersonId, 'guardianPersonId'),
    ...(data.tenantId === undefined || data.tenantId === null
      ? {}
      : { tenantId: uuid(data.tenantId, 'tenantId') }),
  };
}
