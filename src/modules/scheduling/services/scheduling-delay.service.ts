import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { HistoryRepository } from '../../audit/repositories';
import { SchedulingCatalogRepository } from '../repositories';
import {
  SchedulingNoticeRepository,
  type BookingNoticeSnapshot,
} from '../repositories/scheduling-notice.repository';
import { SCHED } from '../scheduling.concepts';
import type { BookingTransitionSnapshot } from '../state/booking-transition';
import {
  AGENDA_NOTICE_PORT,
  type AgendaNoticePort,
} from '../ports/agenda-notice.port';
import { avisoDeDemora } from '../notices/agenda-notices';
import {
  MAX_DELAY_MINUTES,
  type DelayBookingDto,
  type DelayNoticeResponseDto,
  type DelayResourceDto,
} from '../dto';

/** Estados en los que una cita todavía puede sufrir una demora. */
const ESTADOS_ALCANZABLES: readonly string[] = [
  CONCEPTS.BOOKING_CONFIRMED,
  CONCEPTS.BOOKING_CHECKED_IN,
];

/** Roles que operan cualquier agenda, no sólo la propia. */
const ROLES_DE_AGENDA: readonly string[] = [
  'SCHEDULING_ADMIN',
  'SCHEDULING_AGENT',
  'SUPERADMIN',
];

/** Cómo nombra un recurso a la tabla de perfiles profesionales. */
const TABLAS_DE_PERFIL_PROFESIONAL: readonly string[] = [
  'practitioner_profiles',
  'health_practitioner_profiles',
];

/** Tope de citas que una sola demora alcanza. Una jornada no tiene más. */
const TOPE_DE_AFECTADAS = 200;

/**
 * «El médico se demora» (P8 · registro del cliente 3.5 y 4.2).
 *
 * ## Por qué es un servicio propio y no un método más de reservas
 *
 * Porque **no toca el motor de agenda**: no mueve cupos, no cambia estados, no
 * altera holds ni TTL. Informar una demora es un acto de comunicación sobre una
 * cita que sigue exactamente donde estaba, y meterlo entre las transiciones de
 * `SchedulingBookingsService` haría creer lo contrario a quien lea el código
 * después.
 *
 * ## Dónde queda la demora
 *
 * En el historial de auditoría de la cita, con la operación
 * {@link SCHED.HISTORY_OP_DELAY}. **No hay columna nueva** —este carril no
 * introduce esquema, y así está declarado en `PABLO.md`—, y el historial ya es
 * el sitio donde el modelo guarda la razón de un cambio con su autor y su
 * instante. La consecuencia buena es que la demora sobrevive al aviso: aunque
 * la notificación in-app no llegue, el paciente la ve en el detalle de su turno.
 *
 * Si el producto pide después ver la demora en la grilla de la agenda —ordenar
 * por hora estimada, por ejemplo—, eso sí exige columna y va como bloqueador.
 */
@Injectable()
export class SchedulingDelayService {
  constructor(
    private readonly em: EntityManager,
    private readonly catalogRepo: SchedulingCatalogRepository,
    private readonly historyRepo: HistoryRepository,
    private readonly noticeRepo: SchedulingNoticeRepository,
    @Inject(AGENDA_NOTICE_PORT)
    private readonly notices: AgendaNoticePort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SchedulingDelayService.name);
  }

  /** Demora que alcanza a una cita concreta. */
  async delayBooking(
    bookingId: string,
    dto: DelayBookingDto,
    actor: AuthenticatedUser,
  ): Promise<DelayNoticeResponseDto> {
    this.assertMinutos(dto.delayMinutes);

    const em = this.em.fork();
    const booking = await this.noticeRepo.describeBooking(em, bookingId);
    if (!booking) {
      throw new ResourceNotFoundException('Cita no encontrada', { bookingId });
    }
    await this.assertOperaLaAgenda(em, booking.resourceId, actor);

    await this.anotarDemora(booking.bookingId, dto, actor);
    const avisados = await this.avisar([booking], dto);

    this.logger.info(
      {
        operation: 'scheduling.booking.delay',
        bookingId,
        delayMinutes: dto.delayMinutes,
        notified: avisados,
      },
      'Practitioner delay announced for a booking',
    );

    return {
      notified: avisados,
      affected: 1,
      bookingIds: [booking.bookingId],
      detail: this.detalle(1, avisados),
    };
  }

  /**
   * Demora que alcanza a la agenda entera dentro de una ventana («me demoro 20
   * minutos hoy»).
   *
   * La ventana por omisión es *desde ahora hasta el fin del día*: una demora
   * informada a las 10 no puede alcanzar al turno de las 8 —ya pasó— ni al de
   * la semana que viene, que no tiene nada que ver.
   */
  async delayResource(
    resourceId: string,
    dto: DelayResourceDto,
    actor: AuthenticatedUser,
  ): Promise<DelayNoticeResponseDto> {
    this.assertMinutos(dto.delayMinutes);

    const em = this.em.fork();
    const resource = await this.catalogRepo.findResourceById(em, resourceId);
    if (!resource) {
      throw new ResourceNotFoundException('Recurso no encontrado', {
        resourceId,
      });
    }
    await this.assertOperaLaAgenda(em, resourceId, actor);

    const desde = dto.from ? new Date(dto.from) : new Date();
    const hasta = dto.to ? new Date(dto.to) : finDelDia(desde);
    if (hasta.getTime() < desde.getTime()) {
      throw new PreconditionFailedException(
        'La ventana de la demora termina antes de empezar',
        { resourceId },
      );
    }

    const afectadas = await this.noticeRepo.findAffectedBookings(
      em,
      resourceId,
      desde,
      hasta,
      ESTADOS_ALCANZABLES,
      TOPE_DE_AFECTADAS,
    );

    for (const booking of afectadas) {
      await this.anotarDemora(booking.bookingId, dto, actor);
    }
    const avisados = await this.avisar(afectadas, dto);

    this.logger.info(
      {
        operation: 'scheduling.resource.delay',
        resourceId,
        delayMinutes: dto.delayMinutes,
        affected: afectadas.length,
        notified: avisados,
      },
      'Practitioner delay announced for a resource window',
    );

    return {
      notified: avisados,
      affected: afectadas.length,
      bookingIds: afectadas.map((booking) => booking.bookingId),
      detail: this.detalle(afectadas.length, avisados),
    };
  }

  /**
   * Deja la demora en el historial de la cita.
   *
   * En su propia transacción y antes de avisar: el registro es el hecho, el
   * aviso es su consecuencia. Si el aviso falla, la demora sigue anotada y el
   * paciente la ve al abrir su turno; al revés —avisar y no registrar— dejaría
   * una notificación que la cita contradice.
   */
  private async anotarDemora(
    bookingId: string,
    dto: DelayBookingDto | DelayResourceDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.em.transactional(async (tx) => {
      await this.historyRepo.append(tx, 'appointment_bookings', bookingId, {
        operationConceptId: SCHED.HISTORY_OP_DELAY,
        dataSnapshot: {
          bookingId,
          delayMinutes: dto.delayMinutes,
          ...(dto.message === undefined
            ? {}
            : { reasonText: dto.message.trim() }),
          actorKind: 'PROVIDER',
        } satisfies BookingTransitionSnapshot,
        changedByUserId: actor.id,
      });
    });
  }

  /** Emite el aviso de demora a cada paciente alcanzado. */
  private async avisar(
    bookings: readonly BookingNoticeSnapshot[],
    dto: DelayBookingDto | DelayResourceDto,
  ): Promise<number> {
    if (bookings.length === 0) return 0;
    const resultados = await this.notices.emitMany(
      bookings.map((booking) =>
        avisoDeDemora(booking, dto.delayMinutes, dto.message),
      ),
    );
    return resultados.filter((resultado) => resultado.delivered).length;
  }

  /** Qué contar de vuelta, incluido el caso de la agenda vacía. */
  private detalle(afectadas: number, avisados: number): string {
    if (afectadas === 0) {
      return 'No había citas vigentes en la ventana informada; no se avisó a nadie';
    }
    if (avisados === afectadas) {
      return 'La demora quedó registrada y todos los pacientes recibieron el aviso';
    }
    return `La demora quedó registrada en las ${afectadas} citas; ${avisados} pacientes recibieron el aviso in-app (el resto no tiene cuenta de portal o no acepta este aviso)`;
  }

  /** Un tope explícito: más que esto es reprogramar, no demorarse. */
  private assertMinutos(minutos: number): void {
    if (minutos > MAX_DELAY_MINUTES) {
      throw new PreconditionFailedException(
        'Una demora mayor a cuatro horas se resuelve reprogramando el turno, no avisando',
        { failureCode: 'DELAY_TOO_LONG', maxMinutes: MAX_DELAY_MINUTES },
      );
    }
  }

  /**
   * Sólo avisa una demora quien atiende esa agenda (o quien la administra).
   *
   * Es la misma regla que gobierna aceptar y rechazar en
   * `SchedulingBookingsService`: el rol autoriza a operar *una* agenda, y cuál
   * lo dice el perfil del token, no el rol.
   */
  private async assertOperaLaAgenda(
    em: EntityManager,
    resourceId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.roles.some((rol) => ROLES_DE_AGENDA.includes(rol))) return;

    const recurso =
      resourceId === undefined
        ? null
        : await this.catalogRepo.findResourceById(em, resourceId);
    const esSuAgenda =
      actor.practitionerProfileId !== undefined &&
      recurso !== null &&
      recurso.resourceRefId === actor.practitionerProfileId &&
      TABLAS_DE_PERFIL_PROFESIONAL.includes(recurso.resourceRefType);

    if (!esSuAgenda) {
      throw new ForbiddenException(
        'Esta agenda es de otro profesional: sólo avisa su demora quien atiende en ella.',
      );
    }
  }
}

/**
 * Fin del día de una fecha, en la zona del servidor.
 *
 * La zona del recurso (`schedulable_resources.time_zone`) sería lo correcto y
 * la columna existe, pero hoy ningún recurso sembrado la declara; usarla sin
 * dato haría que la ventana dependiera de un `null`. Queda anotado en el
 * reporte del carril.
 */
function finDelDia(desde: Date): Date {
  const fin = new Date(desde);
  fin.setHours(23, 59, 59, 999);
  return fin;
}
