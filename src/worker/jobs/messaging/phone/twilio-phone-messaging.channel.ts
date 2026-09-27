import type { GuardianLinkChannel } from '../../../../modules/profiles/guardian-link.contract';
import type {
  PhoneMessage,
  PhoneMessagingChannel,
  PhoneSendOutcome,
} from './phone-messaging-channel.port';

/** Credenciales y remitente de Twilio. */
export interface TwilioConfig {
  /** `AC…` */
  readonly accountSid: string;
  /** Token de autenticación de la cuenta. */
  readonly authToken: string;
  /** Remitente E.164 (número de Twilio o el remitente de WhatsApp aprobado). */
  readonly from: string;
  /** Base de la API; se parametriza sólo para pruebas. */
  readonly baseUrl?: string;
  /** Plazo de la llamada. */
  readonly timeoutMs?: number;
}

/** Subconjunto de `fetch` que usa el adaptador (inyectable en pruebas). */
export type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
    signal?: AbortSignal;
  },
) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

const TWILIO_API_BASE = 'https://api.twilio.com';
const DEFAULT_TIMEOUT_MS = 15_000;

/**
 * Adaptador real: Twilio Programmable Messaging.
 *
 * `POST /2010-04-01/Accounts/{AccountSid}/Messages.json`, formulario
 * `To`/`From`/`Body`, autenticación básica `AccountSid:AuthToken`; la respuesta
 * trae el `sid` del mensaje. Para WhatsApp, `To` y `From` llevan el prefijo
 * `whatsapp:`. Referencia: https://www.twilio.com/docs/messaging/api/message-resource
 * y https://www.twilio.com/docs/whatsapp/api.
 *
 * **Límite conocido de WhatsApp:** un mensaje de texto libre sólo se entrega
 * dentro de la ventana de 24 h que abre el propio usuario. Un aviso iniciado
 * por la empresa —este— exige una plantilla aprobada (`ContentSid`). Hasta que
 * exista la plantilla y la cuenta, WhatsApp real se rechazará: el canal por
 * defecto es SMS.
 *
 * Nunca se probó contra Twilio: no hay cuenta. Lo que está probado es el
 * contrato (forma de la petición y mapeo de respuestas) contra un `fetch` doble.
 */
export class TwilioPhoneMessagingChannel implements PhoneMessagingChannel {
  readonly providerName = 'twilio';
  readonly isReal = true;

  /**
   * @param channel - SMS o WhatsApp.
   * @param config - Credenciales y remitente.
   * @param fetchFn - `fetch` global por defecto.
   */
  constructor(
    readonly channel: GuardianLinkChannel,
    private readonly config: TwilioConfig,
    private readonly fetchFn: FetchLike = globalThis.fetch,
  ) {}

  async send(message: PhoneMessage): Promise<PhoneSendOutcome> {
    const prefix = this.channel === 'WHATSAPP' ? 'whatsapp:' : '';
    const form = new URLSearchParams({
      To: `${prefix}${message.toE164}`,
      From: `${prefix}${this.config.from}`,
      Body: message.body,
    });
    const url =
      `${this.config.baseUrl ?? TWILIO_API_BASE}/2010-04-01/Accounts/` +
      `${encodeURIComponent(this.config.accountSid)}/Messages.json`;
    const auth = Buffer.from(
      `${this.config.accountSid}:${this.config.authToken}`,
      'utf8',
    ).toString('base64');

    let response: Awaited<ReturnType<FetchLike>>;
    try {
      response = await this.fetchFn(url, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: form.toString(),
        signal: AbortSignal.timeout(
          this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
        ),
      });
    } catch {
      // Red caída, DNS o plazo agotado: no se sabe si llegó; se reintenta.
      return {
        outcome: 'FAILED',
        errorCode: 'TWILIO_NETWORK',
        retryable: true,
      };
    }

    const payload = await response.json().catch(() => undefined);
    if (response.ok) {
      const sid = readString(payload, 'sid');
      return sid
        ? { outcome: 'SENT', providerMessageRef: sid }
        : {
            outcome: 'FAILED',
            errorCode: 'TWILIO_MALFORMED_RESPONSE',
            retryable: false,
          };
    }

    // Sólo el código numérico de Twilio (p. ej. 21211 número inválido): su
    // `message` puede repetir el número de destino.
    const twilioCode = readNumber(payload, 'code');
    return {
      outcome: 'FAILED',
      errorCode: `TWILIO_HTTP_${response.status}${twilioCode ? `_${twilioCode}` : ''}`,
      retryable: response.status === 429 || response.status >= 500,
    };
  }
}

function readString(payload: unknown, key: string): string | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function readNumber(payload: unknown, key: string): number | undefined {
  if (!payload || typeof payload !== 'object') return undefined;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === 'number' ? value : undefined;
}
