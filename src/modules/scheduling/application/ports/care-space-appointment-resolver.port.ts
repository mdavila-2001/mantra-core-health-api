import type { AuthenticatedUser } from '../../../../common';
import type { SchedulableResources } from '../../entities';
import type { UnitOfWork } from './unit-of-work';

/** Qué se sabe del turno cuando hay que decidir en qué espacio ocurre. */
export interface AppointmentSpaceRequest {
  /** El recurso del cupo (su tenant ya se comprobó contra el contexto). */
  readonly resource: SchedulableResources;
  /** La plantilla de la que nació el cupo, si nació de una. */
  readonly scheduleTemplateId?: string | null;
  /** El consultorio que pidió quien agenda (cita puntual o mostrador). */
  readonly requestedCareSpaceId?: string | null;
  readonly startAt: Date;
  readonly endAt: Date;
  /**
   * El tenant que declaró quien reserva, cuando el cuerpo lo trae. Tiene que ser el del
   * recurso: una cita no apunta al consultorio de otra organización (404 uniforme).
   */
  readonly bookingTenantId?: string;
  /** La cita que se mueve o se acepta: no se compara consigo misma. */
  readonly exceptAppointmentId?: string | null;
  /**
   * `true` cuando la cita queda comprometida (reservada o aceptada) y por tanto ocupa el
   * espacio; una solicitud pendiente todavía no lo ocupa y no se compara con las demás.
   */
  readonly commits: boolean;
  /** Cita sin plantilla: el espacio sale de la franja publicada que contiene el inicio. */
  readonly inferFromBands?: boolean;
  readonly actor: AuthenticatedUser;
}

/**
 * Decide en qué espacio ocurre una cita y comprueba que se pueda reservar ahí (F5d): de dónde
 * sale el espacio, quién puede nombrarlo, que sea del tenant del recurso, que admita agenda,
 * que se pueda reservar en la ventana (`assertBookable` de F2) y que no haya otra cita
 * comprometida a la misma hora (409 `CARE_SPACE_DOUBLE_BOOKED`).
 */
export interface CareSpaceAppointmentResolverPort {
  /**
   * @returns El espacio a escribir en `appointments.care_space_id`, o `null` si la cita no lo lleva.
   */
  resolve(
    tx: UnitOfWork,
    request: AppointmentSpaceRequest,
  ): Promise<string | null>;

  /**
   * ¿Se puede retener este cupo? Lo mismo que al reservar, sin comprometer el espacio.
   *
   * @throws PreconditionFailedException (422 `SPACE_NOT_BOOKABLE`).
   */
  assertSlotHoldable(
    tx: UnitOfWork,
    slot: {
      resourceId: string;
      scheduleTemplateId?: string | null;
      startAt: Date;
      endAt?: Date | null;
    },
    actor: AuthenticatedUser,
  ): Promise<void>;
}

/** Token de inyección del resolvedor de espacio de las citas. */
export const CARE_SPACE_APPOINTMENT_RESOLVER_PORT = Symbol(
  'CARE_SPACE_APPOINTMENT_RESOLVER_PORT',
);
