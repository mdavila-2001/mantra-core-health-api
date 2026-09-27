import { randomUUID } from 'node:crypto';
import type { PinoLogger } from 'nestjs-pino';
import type { GuardianLinkChannel } from '../../../../modules/profiles/guardian-link.contract';
import type {
  PhoneMessage,
  PhoneMessagingChannel,
  PhoneSendOutcome,
} from './phone-messaging-channel.port';

/** Lo que el doble recuerda de cada mensaje. Sin número ni cuerpo. */
export interface MockPhoneRecord {
  /** La invitación. */
  readonly reference: string;
  /** Canal simulado. */
  readonly channel: GuardianLinkChannel;
  /** Referencia inventada que devolvió. */
  readonly providerMessageRef: string;
  /** Largo del cuerpo, para detectar mensajes truncados o vacíos. */
  readonly bodyLength: number;
}

/** Prefijo que delata en la base una entrega simulada. */
export const MOCK_PROVIDER_REF_PREFIX = 'mock:';

/**
 * Doble del canal de teléfono: **no envía nada**.
 *
 * Existe porque no hay proveedor de SMS ni de WhatsApp contratado. Hace
 * visible lo simulado en tres lugares: el log de arranque, cada línea de log
 * de envío (`simulated: true`) y la referencia que queda en
 * `guardian_link_invitations.provider_message_ref` (`mock:<uuid>`).
 *
 * ## En producción falla en vez de fingir
 *
 * Fuera de producción responde `SENT`: es lo que deja ejercitar el recorrido
 * entero. Con `NODE_ENV=production` responde `FAILED` /
 * `PROVIDER_NOT_CONFIGURED` (no reintentable), igual que el adaptador por
 * defecto de `notification-delivery.job.ts`: marcar como enviado un SMS que
 * nunca salió le haría creer al mostrador que el tutor fue avisado.
 */
export class MockPhoneMessagingChannel implements PhoneMessagingChannel {
  readonly providerName = 'mock';
  readonly isReal = false;
  private readonly records: MockPhoneRecord[] = [];

  /**
   * @param channel - Canal que simula.
   * @param logger - Logger del worker.
   * @param production - Si el proceso corre en producción.
   */
  constructor(
    readonly channel: GuardianLinkChannel,
    private readonly logger: PinoLogger,
    private readonly production: boolean,
  ) {}

  send(message: PhoneMessage): Promise<PhoneSendOutcome> {
    if (this.production) {
      this.logger.error(
        {
          operation: 'worker.messaging.phone.mock',
          reference: message.reference,
          channel: this.channel,
        },
        'Sin proveedor de teléfono en producción: el mensaje NO se envía',
      );
      return Promise.resolve({
        outcome: 'FAILED',
        errorCode: 'PROVIDER_NOT_CONFIGURED',
        retryable: false,
      });
    }

    const providerMessageRef = `${MOCK_PROVIDER_REF_PREFIX}${randomUUID()}`;
    this.records.push({
      reference: message.reference,
      channel: this.channel,
      providerMessageRef,
      bodyLength: message.body.length,
    });
    this.logger.info(
      {
        operation: 'worker.messaging.phone.mock',
        reference: message.reference,
        channel: this.channel,
        providerMessageRef,
        simulated: true,
      },
      'Mensaje de teléfono registrado por el doble (no salió del sistema)',
    );
    return Promise.resolve({ outcome: 'SENT', providerMessageRef });
  }

  /** Lo registrado hasta ahora (para pruebas y diagnóstico). */
  sent(): readonly MockPhoneRecord[] {
    return [...this.records];
  }
}
