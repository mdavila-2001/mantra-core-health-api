import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { SchedulingAgendaRepository } from '../repositories';
import type {
  AppointmentBookings,
  AppointmentReminders,
  BookableSlots,
  CancellationPolicySnapshot,
  SchedulableResources,
} from '../entities';
import {
  AGENDA_MAX_LIMIT,
  BookingDetailDto,
  BookingListItemDto,
  BookingReminderDto,
  ListBookingsQueryDto,
  ListBookingsResponseDto,
  ListResourcesQueryDto,
  ListResourcesResponseDto,
  ListSlotsQueryDto,
  ListSlotsResponseDto,
  ResourceListItemDto,
  SlotListItemDto,
  type ResourceType,
} from '../dto';

const RESOURCE_TYPE_CONCEPT: Readonly<Record<ResourceType, string>> = {
  PRACTITIONER: CONCEPTS.RESOURCE_PRACTITIONER,
  ROOM: CONCEPTS.RESOURCE_ROOM,
  EQUIPMENT: CONCEPTS.RESOURCE_EQUIPMENT,
};

const DEFAULT_LIMIT = 200;

/**
 * Ventana máxima que se acepta consultar de una vez. Un año de cupos de un
 * consultorio son decenas de miles de filas: el tope obliga a paginar por
 * ventana, que es como una agenda se navega de todas formas.
 */
const MAX_WINDOW_DAYS = 92;
const MAX_WINDOW_MS = MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Lectura de la agenda: recursos, cupos y citas.
 *
 * Existe porque el módulo sólo exponía escritura. Sin `GET /scheduling/slots`
 * no hay forma de obtener el `slotId` que pide `POST /scheduling/slots/{id}/holds`,
 * de modo que reservar una cita desde el portal era, literalmente, imposible.
 */
@Injectable()
export class SchedulingAgendaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param agendaRepo - Repositorio de lectura de agenda.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly agendaRepo: SchedulingAgendaRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingAgendaService.name);
  }

  /** Recursos agendables del tenant. */
  async listResources(
    query: ListResourcesQueryDto,
  ): Promise<ListResourcesResponseDto> {
    const em = this.em.fork();
    const resources = await this.agendaRepo.findResources(em, {
      tenantId: query.tenantId,
      practiceId: query.practiceId,
      resourceTypeConceptId: query.resourceType
        ? RESOURCE_TYPE_CONCEPT[query.resourceType]
        : undefined,
      stateConceptId: query.includeInactive ? undefined : CONCEPTS.STATE_ACTIVE,
    });

    const items = resources.map((resource) => this.toResourceItem(resource));
    return { items, count: items.length };
  }

  /**
   * Cupos de la ventana. Con `onlyAvailable` devuelve exactamente lo que el
   * portal puede ofrecer para reservar.
   */
  async listSlots(query: ListSlotsQueryDto): Promise<ListSlotsResponseDto> {
    const from = new Date(query.from);
    const to = new Date(query.to);
    this.assertWindow(from, to);

    const limit = query.limit ?? DEFAULT_LIMIT;
    const em = this.em.fork();
    const rows = await this.agendaRepo.findSlots(
      em,
      {
        resourceId: query.resourceId,
        scheduleTemplateId: query.scheduleTemplateId,
        from,
        to,
        onlyAvailable: query.onlyAvailable,
        openStatusConceptId: CONCEPTS.SLOT_OPEN,
      },
      limit,
    );

    const truncated = rows.length > limit;
    const items = rows.slice(0, limit).map((slot) => this.toSlotItem(slot));
    if (truncated) {
      this.logger.warn(
        { operation: 'scheduling.slots.list', limit },
        'Slot window exceeded the page cap; narrow the window',
      );
    }
    return { items, count: items.length, limit, truncated };
  }

  /** Citas que cumplen el filtro, ordenadas por el instante del cupo. */
  async listBookings(
    query: ListBookingsQueryDto,
  ): Promise<ListBookingsResponseDto> {
    const from = query.from ? new Date(query.from) : undefined;
    const to = query.to ? new Date(query.to) : undefined;
    if (from && to) this.assertWindow(from, to);

    const limit = query.limit ?? DEFAULT_LIMIT;
    const em = this.em.fork();
    const rows = await this.agendaRepo.findBookingsWithSlot(
      em,
      {
        tenantId: query.tenantId,
        patientProfileId: query.patientProfileId,
        resourceId: query.resourceId,
        statusConceptId: query.statusConceptId,
      },
      { from, to },
      limit,
    );

    const truncated = rows.length > limit;
    const items = rows
      .slice(0, limit)
      .map(({ booking, slot }) => this.toBookingItem(booking, slot));
    return { items, count: items.length, limit, truncated };
  }

  /**
   * Detalle de una cita, con el snapshot de cancelación y sus recordatorios.
   *
   * El snapshot se devuelve porque es lo que gobierna si cancelar genera cargo:
   * mostrar la política vigente en su lugar podría anunciar condiciones que el
   * paciente nunca aceptó.
   */
  async getBooking(bookingId: string): Promise<BookingDetailDto> {
    const em = this.em.fork();
    const booking = await this.agendaRepo.findBookingById(em, bookingId);
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }

    const slot = await this.agendaRepo.findSlotById(em, booking.bookableSlotId);
    const reminders = await this.agendaRepo.findRemindersByBooking(
      em,
      bookingId,
    );

    return {
      ...this.toBookingItem(booking, slot),
      bookingPolicyId: booking.bookingPolicyId ?? null,
      // La columna es jsonb (`unknown` en la entidad generada); el contrato vive
      // en appointment_bookings.types.ts y quien escribió el snapshot lo honró.
      cancellationPolicySnapshot:
        (booking.cancellationPolicySnapshot as
          | CancellationPolicySnapshot
          | undefined) ?? null,
      reminders: reminders.map((reminder) => this.toReminder(reminder)),
    };
  }

  /** Rechaza ventanas invertidas o más largas que el tope. */
  private assertWindow(from: Date, to: Date): void {
    if (from >= to) {
      throw new PreconditionFailedException(
        'La ventana debe empezar antes de terminar',
        { from: from.toISOString(), to: to.toISOString() },
      );
    }
    if (to.getTime() - from.getTime() > MAX_WINDOW_MS) {
      throw new PreconditionFailedException(
        `La ventana no puede superar ${MAX_WINDOW_DAYS} días`,
        { maxWindowDays: MAX_WINDOW_DAYS, maxLimit: AGENDA_MAX_LIMIT },
      );
    }
  }

  /** Proyecta el recurso al contrato de lectura. */
  private toResourceItem(resource: SchedulableResources): ResourceListItemDto {
    return {
      id: resource.id,
      name: resource.name,
      resourceTypeConceptId: resource.resourceTypeConceptId,
      resourceRefType: resource.resourceRefType,
      resourceRefId: resource.resourceRefId,
      practiceId: resource.practiceId ?? null,
      timeZone: resource.timeZone ?? null,
      // El recurso puede no declarar capacidad; 1 es lo que asume el alta.
      capacity: resource.capacity ?? 1,
      stateConceptId: resource.stateConceptId,
    };
  }

  /** Proyecta el cupo al contrato de lectura. */
  private toSlotItem(slot: BookableSlots): SlotListItemDto {
    return {
      id: slot.id,
      resourceId: slot.resourceId,
      scheduleTemplateId: slot.scheduleTemplateId ?? null,
      startAt: slot.startAt.toISOString(),
      endAt: slot.endAt.toISOString(),
      capacity: slot.capacity,
      remainingCapacity: slot.remainingCapacity,
      statusConceptId: slot.statusConceptId,
      serviceConceptId: slot.serviceConceptId ?? null,
    };
  }

  /** Proyecta la cita, resolviendo el instante desde su cupo. */
  private toBookingItem(
    booking: AppointmentBookings,
    slot: BookableSlots | null,
  ): BookingListItemDto {
    return {
      id: booking.id,
      tenantId: booking.tenantId,
      patientProfileId: booking.patientProfileId,
      bookableSlotId: booking.bookableSlotId,
      resourceId: booking.resourceId ?? null,
      startAt: slot?.startAt.toISOString() ?? null,
      endAt: slot?.endAt.toISOString() ?? null,
      statusConceptId: booking.statusConceptId,
      bookingChannelConceptId: booking.bookingChannelConceptId,
      reasonText: booking.reasonText ?? null,
      confirmedAt: booking.confirmedAt?.toISOString() ?? null,
      checkedInAt: booking.checkedInAt?.toISOString() ?? null,
    };
  }

  /** Proyecta el recordatorio al contrato de lectura. */
  private toReminder(reminder: AppointmentReminders): BookingReminderDto {
    return {
      id: reminder.id,
      offsetMinutes: reminder.offsetMinutes,
      scheduledAt: reminder.scheduledAt.toISOString(),
      channelConceptId: reminder.channelConceptId,
      statusConceptId: reminder.statusConceptId,
    };
  }
}
