/**
 * Tipos de la API pública v1 de la pasarela, escritos a mano a partir de
 * `contracts/openapi/public-v1.yaml` (repo `pasarelapago`, `v1-draft`).
 *
 * Sólo lo que la API consume: crear y consultar un cobro, y los eventos
 * `payment_intent.*`. No hay generador de SDK: sería una dependencia nueva y el
 * contrato todavía no está congelado.
 */

/** Medios de pago del contrato (`PaymentMethodType`). */
export const GATEWAY_PAYMENT_METHOD_TYPES = [
  'qr',
  'card',
  'bank_transfer',
  'wallet',
] as const;

/** Medio de pago elegido para el cobro. */
export type GatewayPaymentMethodType =
  (typeof GATEWAY_PAYMENT_METHOD_TYPES)[number];

/** Estados del cobro en la pasarela (`PaymentIntentStatus`). */
export const GATEWAY_PAYMENT_INTENT_STATUSES = [
  'requires_action',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'expired',
] as const;

/** Estado de un cobro en la pasarela. `succeeded`/`failed`/`canceled`/`expired` son terminales. */
export type GatewayPaymentIntentStatus =
  (typeof GATEWAY_PAYMENT_INTENT_STATUSES)[number];

/** Cuerpo de `POST /payment_intents` (`PaymentIntentCreate`). */
export interface GatewayPaymentIntentCreate {
  /** Importe en unidades menores (centavos), entero ≥ 1. */
  amount_minor: number;
  /** v1 sólo admite bolivianos (D-06). */
  currency: 'BOB';
  /** Medio de pago. El número de tarjeta jamás viaja acá. */
  payment_method: { type: GatewayPaymentMethodType };
  /** Segundos de vida del cobro (60 a 86400). */
  expires_in_seconds?: number;
  /** Pares clave-valor del comercio; sin datos personales ni de tarjeta. */
  metadata?: Record<string, string>;
}

/** Qué tiene que hacer el pagador (`NextAction`). */
export type GatewayNextAction =
  | {
      type: 'display_qr';
      qr: { payload: string; image_url?: string; expires_at: string };
    }
  | {
      type: 'bank_transfer_instructions';
      bank_transfer: {
        reference: string;
        bank_name: string;
        account_holder: string;
        account_number: string;
      };
    }
  | { type: 'redirect_to_card_form'; url: string };

/** Cobro tal como lo devuelve la pasarela (`PaymentIntent`). */
export interface GatewayPaymentIntent {
  /** `pi_…`. */
  id: string;
  object: 'payment_intent';
  amount_minor: number;
  currency: string;
  status: GatewayPaymentIntentStatus;
  payment_method_type: GatewayPaymentMethodType;
  fee_minor: number;
  net_minor: number;
  next_action?: GatewayNextAction;
  last_error?: { code: string; message?: string } | null;
  created_at: string;
  expires_at: string;
  succeeded_at?: string | null;
}

/** Problema RFC 9457 con `code` estable (`problem.schema.json`). */
export interface GatewayProblem {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code: string;
  request_id?: string;
  /** Errores por campo (`field` y `code` estables; el texto libre no se conserva). */
  errors?: { field: string; code: string }[];
}

/** Tipos de evento público de cobro que la API aplica. */
export const GATEWAY_PAYMENT_INTENT_EVENT_TYPES = [
  'payment_intent.created',
  'payment_intent.requires_action',
  'payment_intent.processing',
  'payment_intent.succeeded',
  'payment_intent.failed',
  'payment_intent.canceled',
  'payment_intent.expired',
] as const;

/** Evento recibido (`WebhookEvent`): `data.object` sólo lleva ids, estados e importes. */
export interface GatewayWebhookEvent {
  /** UUID del evento; el mismo `webhook-id`. */
  id: string;
  object: 'event';
  type: string;
  created_at: string;
  mode: 'test' | 'live';
  data: { object: Record<string, string | number | boolean | null> };
}
