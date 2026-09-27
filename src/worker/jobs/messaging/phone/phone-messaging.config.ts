import type { PinoLogger } from 'nestjs-pino';
import type { GuardianLinkChannel } from '../../../../modules/profiles/guardian-link.contract';
import { MockPhoneMessagingChannel } from './mock-phone-messaging.channel';
import type { PhoneMessagingChannel } from './phone-messaging-channel.port';
import {
  TwilioPhoneMessagingChannel,
  type TwilioConfig,
} from './twilio-phone-messaging.channel';

/** Configuración del canal de teléfono leída del entorno. */
export interface PhoneMessagingConfig {
  /** Canal elegido (`PHONE_CHANNEL`), SMS por defecto. */
  readonly channel: GuardianLinkChannel;
  /** Credenciales completas de Twilio para ese canal, si las hay. */
  readonly twilio?: TwilioConfig;
  /**
   * Variables de Twilio presentes pero incompletas: se usa el doble y se
   * avisa, en vez de arrancar un adaptador real que fallaría en cada envío.
   */
  readonly incomplete: readonly string[];
  /** `NODE_ENV === 'production'`. */
  readonly production: boolean;
}

const TWILIO_KEYS = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'] as const;

/**
 * Lee el entorno. El adaptador real sólo se activa con las tres piezas del
 * canal elegido: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` y el remitente
 * (`TWILIO_SMS_FROM` o `TWILIO_WHATSAPP_FROM`).
 *
 * @param source - Entorno; se parametriza para probarlo sin tocar `process.env`.
 * @returns La configuración resuelta.
 * @throws Error si `PHONE_CHANNEL` trae un valor desconocido: es un error de
 *   despliegue y aborta el arranque, como el resto de `worker.env.ts`.
 */
export function loadPhoneMessagingConfig(
  source: NodeJS.ProcessEnv = process.env,
): PhoneMessagingConfig {
  const rawChannel = (source.PHONE_CHANNEL ?? 'SMS').trim().toUpperCase();
  if (rawChannel !== 'SMS' && rawChannel !== 'WHATSAPP')
    throw new Error(
      `PHONE_CHANNEL="${rawChannel}" no es válido: use SMS o WHATSAPP`,
    );
  const channel: GuardianLinkChannel = rawChannel;
  const fromKey =
    channel === 'WHATSAPP' ? 'TWILIO_WHATSAPP_FROM' : 'TWILIO_SMS_FROM';

  const value = (key: string): string => (source[key] ?? '').trim();
  const keys = [...TWILIO_KEYS, fromKey];
  const present = keys.filter((key) => value(key).length > 0);
  const production = source.NODE_ENV === 'production';

  if (present.length === keys.length) {
    return {
      channel,
      production,
      incomplete: [],
      twilio: {
        accountSid: value('TWILIO_ACCOUNT_SID'),
        authToken: value('TWILIO_AUTH_TOKEN'),
        from: value(fromKey),
      },
    };
  }
  return {
    channel,
    production,
    incomplete:
      present.length > 0 ? keys.filter((key) => !present.includes(key)) : [],
  };
}

/**
 * Elige el canal activo y lo deja escrito en el log de arranque: quien mire el
 * worker tiene que poder saber, sin leer código, si los avisos salen de verdad.
 *
 * @param config - Lo que devolvió {@link loadPhoneMessagingConfig}.
 * @param logger - Logger del worker.
 * @returns El canal a inyectar.
 */
export function selectPhoneMessagingChannel(
  config: PhoneMessagingConfig,
  logger: PinoLogger,
): PhoneMessagingChannel {
  if (config.twilio) {
    logger.info(
      {
        operation: 'worker.messaging.phone.wiring',
        provider: 'twilio',
        channel: config.channel,
      },
      `Canal de teléfono: Twilio (${config.channel}), proveedor real`,
    );
    return new TwilioPhoneMessagingChannel(config.channel, config.twilio);
  }

  if (config.incomplete.length > 0)
    logger.warn(
      {
        operation: 'worker.messaging.phone.wiring',
        missing: config.incomplete,
      },
      'Credenciales de Twilio incompletas: se usa el doble',
    );
  logger.warn(
    {
      operation: 'worker.messaging.phone.wiring',
      provider: 'mock',
      channel: config.channel,
      production: config.production,
    },
    config.production
      ? `Canal de teléfono SIN proveedor (${config.channel}): en producción cada aviso queda FAILED/PROVIDER_NOT_CONFIGURED`
      : `Canal de teléfono SIMULADO (${config.channel}): los avisos se registran con el doble y NO salen del sistema`,
  );
  return new MockPhoneMessagingChannel(
    config.channel,
    logger,
    config.production,
  );
}
