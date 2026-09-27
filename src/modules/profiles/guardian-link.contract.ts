/* ============================================================================
    Contrato del aviso al tutor · walk-in

    Lo que comparten la API (que publica el hecho y emite la invitación) y el
    worker de mensajería (que la envía). Vive en un archivo sin dependencias de
    Nest ni del ORM a propósito, igual que `messaging/notifications.contract.ts`:
    el worker es otro proceso y sólo puede importar constantes y tipos.

    ## El recorrido

      alta de mostrador (tx) ── publishDomainEvent(GuardianLinkRequested)
        └─ relay del outbox ── fan-out a la suscripción GUARDIAN_LINK
             └─ cola `guardian-links` ── job `event:GuardianLinkRequested`
                  └─ worker: GuardianLinkSubscriber
                       ├─ POST /internal/guardian-links/issue      (token + destino)
                       ├─ PhoneMessagingChannel.send               (SMS / WhatsApp)
                       └─ POST /internal/guardian-links/:id/delivery

    ## Por qué el payload lleva sólo ids

    El evento queda escrito en `messaging.domain_events`, que es inmutable y lo
    leen todos los suscriptores. El nombre y el teléfono del tutor son datos
    personales: se resuelven en el momento de emitir, desde su fila, y nunca
    viajan copiados en el hecho.
    ========================================================================== */

/** Tipo del evento de dominio que publica el alta de mostrador. */
export const GUARDIAN_LINK_REQUESTED_EVENT = 'GuardianLinkRequested';

/** Versión del evento; la suscripción sembrada casa con esta. */
export const GUARDIAN_LINK_REQUESTED_EVENT_VERSION = 1;

/** Tipo de agregado del evento: la persona relacionada que se registró. */
export const GUARDIAN_LINK_AGGREGATE_TYPE = 'profiles.related_persons';

/** Cola durable donde el fan-out deja el trabajo del suscriptor. */
export const GUARDIAN_LINK_QUEUE = 'guardian-links';

/** Cola muerta de la anterior. */
export const GUARDIAN_LINK_DEAD_LETTER_QUEUE = 'guardian-links-dlq';

/** Código de la suscripción en `messaging.event_subscriptions`. */
export const GUARDIAN_LINK_SUBSCRIBER_CODE = 'GUARDIAN_LINK';

/**
 * `job_type` con el que `OutboxService.enqueueSubscriberJob` encola el trabajo:
 * siempre `event:<eventType>`.
 */
export const GUARDIAN_LINK_JOB_TYPE = `event:${GUARDIAN_LINK_REQUESTED_EVENT}`;

/** Horas de vigencia del enlace desde que se emite. */
export const GUARDIAN_LINK_TTL_HOURS = 72;

/**
 * Lo que lleva el evento. Sólo identificadores. Alias de tipo (no interfaz)
 * para que encaje en el `Record<string, unknown>` de `publishDomainEvent`.
 */
export type GuardianLinkRequestedPayload = {
  /** Perfil del paciente que declaró al tutor. */
  readonly patientProfileId: string;
  /** La fila de `profiles.related_persons`. */
  readonly relatedPersonId: string;
  /** La persona del tutor (dueña del teléfono en `common.contact_points`). */
  readonly guardianPersonId: string;
  /** Organización del alta, si la hay. */
  readonly tenantId?: string;
};

/** Canal de teléfono por el que sale el aviso. */
export type GuardianLinkChannel = 'SMS' | 'WHATSAPP';

/** Los dos canales, para validar sin repetir la lista. */
export const GUARDIAN_LINK_CHANNELS: readonly GuardianLinkChannel[] = [
  'SMS',
  'WHATSAPP',
];

/**
 * Respuesta de `POST /internal/guardian-links/issue`.
 *
 * - `SEND`: hay que enviar `body` a `toE164`. El token del enlace va dentro de
 *   `body` y sólo existe en esta respuesta: la base guarda su hash.
 * - `SKIP`: ya estaba enviada o confirmada; reintentar el job no reenvía.
 * - `INVALID_PHONE`: el teléfono declarado no se puede llevar a E.164. Es
 *   terminal: reintentar no lo arregla, lo arregla corregir el dato.
 */
export type GuardianLinkIssueResponse =
  | {
      readonly action: 'SEND';
      readonly invitationId: string;
      readonly toE164: string;
      readonly body: string;
    }
  | {
      readonly action: 'SKIP';
      readonly invitationId: string;
      readonly reason: string;
    }
  | {
      readonly action: 'INVALID_PHONE';
      readonly invitationId: string;
    };
