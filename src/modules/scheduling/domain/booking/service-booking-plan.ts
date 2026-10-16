import { CONCEPTS } from '../../../../common/constants/concepts';
import { CLIN } from '../../../clinical/clinical.concepts';
import { SCHED } from '../scheduling.concepts';
import { DEFAULT_REMINDER_OFFSETS } from './booking-defaults';

/** Cómo nace una reserva: estado, estado de su cita clínica y recordatorios. */
export interface BookingPlan {
  statusConceptId: string;
  appointmentStatusConceptId: string;
  confirmedAt?: Date;
  reminderOffsetsMinutes: readonly number[];
}

/** Lo que la oferta de un servicio dice de sí misma (estructural, sin ORM). */
export interface OfferedServiceFacts {
  offering: {
    id: string;
    serviceCatalogId: string;
    minDurationMinutes: number;
    maxDurationMinutes: number;
    prepMinutes?: number | null;
    cleanupMinutes?: number | null;
    requiresApproval: boolean;
  };
  catalog: {
    code?: string | null;
    name?: string | null;
    defaultPrice?: string | null;
    currencyConceptId?: string | null;
  } | null;
}

/** El tramo del cupo reservado, tal como se congela. */
export interface FrozenSlotSpan {
  startAt: Date;
  endAt?: Date | null;
}

/**
 * El plan de una reserva de servicio.
 *
 * Pedir un turno nace pendiente de aceptación, y para una consulta eso es
 * siempre así. Un servicio lo decide su oferta: si **no** requiere aprobación,
 * la reserva nace confirmada —con los recordatorios de una cita confirmada—,
 * porque obligar al profesional a aceptar una nebulización es fricción sin
 * criterio clínico. Si la requiere, o si quien reserva ya traía un plan
 * confirmado (el mostrador), se respeta lo que había.
 */
export function planForService<P extends BookingPlan>(
  plan: P,
  requiresApproval: boolean,
): P {
  const isRequest = plan.statusConceptId === SCHED.BOOKING_PENDING_CONFIRMATION;
  if (!isRequest || requiresApproval) return plan;
  return {
    ...plan,
    statusConceptId: CONCEPTS.BOOKING_CONFIRMED,
    appointmentStatusConceptId: CLIN.APPOINTMENT_BOOKED,
    confirmedAt: new Date(),
    reminderOffsetsMinutes: DEFAULT_REMINDER_OFFSETS,
  };
}

/** Lo que el paciente aceptó, congelado: un cambio posterior de la oferta no lo reescribe. */
export function freezeService(
  ofService: OfferedServiceFacts,
  slot: FrozenSlotSpan,
): Record<string, unknown> {
  const { offering, catalog } = ofService;
  return {
    offeringId: offering.id,
    serviceCatalogId: offering.serviceCatalogId,
    serviceCode: catalog?.code,
    serviceName: catalog?.name,
    price: catalog?.defaultPrice,
    currencyConceptId: catalog?.currencyConceptId,
    minDurationMinutes: offering.minDurationMinutes,
    maxDurationMinutes: offering.maxDurationMinutes,
    prepMinutes: offering.prepMinutes ?? 0,
    cleanupMinutes: offering.cleanupMinutes ?? 0,
    requiresApproval: offering.requiresApproval,
    startAt: slot.startAt.toISOString(),
    endAt: slot.endAt?.toISOString(),
    capturedAt: new Date().toISOString(),
  };
}
