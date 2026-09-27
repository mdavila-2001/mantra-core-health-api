import type { GuardianLinkChannel } from '../../../../modules/profiles/guardian-link.contract';

/**
 * Puerto de salida hacia un canal de teléfono (SMS o WhatsApp).
 *
 * El suscriptor que envía el aviso al tutor depende de esto y de nada más: qué
 * proveedor hay detrás —el doble, Twilio u otro— lo decide
 * `phone-messaging.config.ts` al arrancar el worker.
 *
 * ## Contrato
 *
 * - `toE164` ya viene normalizado por la API (`+` y hasta 15 dígitos).
 * - `send` **no lanza** por un rechazo del proveedor: lo devuelve como
 *   `FAILED`, con `retryable` para que el suscriptor decida entre reintentar
 *   (cola con backoff) o cerrar. Sólo lanza ante un error de programación.
 * - Ninguna implementación escribe en el log el número ni el cuerpo: el cuerpo
 *   lleva el token del enlace y el número es un dato personal.
 */
export interface PhoneMessagingChannel {
  /** Nombre del proveedor, para el log de arranque y las trazas. */
  readonly providerName: string;
  /** `true` si el mensaje sale de verdad del sistema. */
  readonly isReal: boolean;
  /** Canal por el que envía. */
  readonly channel: GuardianLinkChannel;
  /** Envía un mensaje de texto. */
  send(message: PhoneMessage): Promise<PhoneSendOutcome>;
}

/** Un mensaje a un teléfono. */
export interface PhoneMessage {
  /** Destino E.164. */
  readonly toE164: string;
  /** Texto. */
  readonly body: string;
  /** Id propio (la invitación) para correlacionar sin datos personales. */
  readonly reference: string;
}

/** Lo que devolvió el canal. */
export type PhoneSendOutcome =
  | {
      readonly outcome: 'SENT';
      readonly providerMessageRef: string;
    }
  | {
      readonly outcome: 'FAILED';
      /** Código estable, sin texto libre del proveedor (puede traer el número). */
      readonly errorCode: string;
      /** `true` si reintentar más tarde puede funcionar (429, 5xx, red). */
      readonly retryable: boolean;
    };

/** Token de inyección del canal activo. */
export const PHONE_MESSAGING_CHANNEL = Symbol('PHONE_MESSAGING_CHANNEL');
