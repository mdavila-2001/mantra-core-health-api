import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { AuditTrailService } from '../../audit/services/audit-trail.service';
import {
  CreateVisitBlockDto,
  CreatedResourceDto,
  PutVisitPolicyDto,
  TransitionResultDto,
} from '../dto';
import type { DoctorVisitBlocks, DoctorVisitWindows } from '../entities';
import {
  AgendaRepository,
  DoctorCalendarRepository,
  VisitsRepository,
} from '../repositories';
import { PHL } from '../pharma_lab.concepts';

/** Ventana de la agenda tal como la ve quien va a solicitar una visita. */
export interface PublishedWindow {
  /** Día de la semana, 0 = domingo. */
  weekday: number;
  /** Hora de inicio, `HH:MM`. */
  startTime: string;
  /** Hora de fin, `HH:MM`. */
  endTime: string;
  /** Duración estándar de cada visita, en minutos. */
  slotDurationMinutes: number;
  /** Modalidad de la ventana. */
  modalityConceptId: string;
  /** Ubicación o enlace. */
  location?: string;
}

/** Agenda de visitas publicada de un doctor. */
export interface PublishedAgenda {
  /** Doctor. */
  doctorUserId: string;
  /** Zona horaria que rige los horarios. */
  timeZone: string;
  /** Si la confirmación es automática. */
  autoConfirm: boolean;
  /** Antelación mínima, en horas. */
  minNoticeHours: number;
  /** Plazo de reprogramación y cancelación, en horas. */
  rescheduleCutoffHours: number;
  /** Duración máxima admitida, en minutos. */
  maxDurationMinutes?: number;
  /** Especialidades admitidas. */
  allowedSpecialtyConceptIds?: string[];
  /** Ventanas de atención. */
  windows: PublishedWindow[];
}

/** Zona horaria por defecto cuando ni el doctor ni su organización declaran una. */
const FALLBACK_TIME_ZONE = 'America/La_Paz';

/**
 * UC-17-11 y UC-17-12: agenda de visitas del doctor y bloqueos.
 *
 * Es una agenda **separada** de la de pacientes (spec 5399). Lo que sí comparte
 * con ella es el calendario real del doctor: una visita no puede caer encima de
 * una consulta ni de una intervención, y eso lo comprueba
 * `DoctorCalendarRepository` leyendo los módulos que son dueños de ese dato.
 */
@Injectable()
export class VisitAgendaService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de la agenda de visitas.
   * @param visitsRepo - Repositorio de solicitudes, para el cupo diario.
   * @param calendar - Lectura de la agenda clínica del doctor.
   * @param audit - Cadena WORM de auditoría.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: AgendaRepository,
    private readonly visitsRepo: VisitsRepository,
    private readonly calendar: DoctorCalendarRepository,
    private readonly audit: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VisitAgendaService.name);
  }

  /**
   * UC-17-11: configura la agenda de visitas del doctor.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado de la política.
   * @throws PreconditionFailedException si dos ventanas del mismo día se solapan
   *   o si alguna tiene la hora de fin antes que la de inicio.
   */
  async putPolicy(
    dto: PutVisitPolicyDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    this.assertWindowsCoherent(dto);
    return this.em.transactional(async (tx) => {
      let policy = await this.repo.findPolicy(tx, actor.id);
      if (!policy) {
        policy = this.repo.createPolicy(tx, {
          doctorUserId: actor.id,
          tenantId: dto.tenantId,
          timeZone: dto.timeZone ?? FALLBACK_TIME_ZONE,
          autoConfirm: dto.autoConfirm ?? false,
          maxVisitsPerDay: dto.maxVisitsPerDay,
          minNoticeHours: dto.minNoticeHours ?? 24,
          rescheduleCutoffHours: dto.rescheduleCutoffHours ?? 12,
          allowedSpecialtyConceptIds: dto.allowedSpecialtyConceptIds,
          maxDurationMinutes: dto.maxDurationMinutes,
          statusConceptId: PHL.POLICY_ACTIVE,
          actorUserId: actor.id,
        });
        await tx.flush();
      } else {
        policy.tenantId = dto.tenantId ?? policy.tenantId;
        policy.timeZone = dto.timeZone ?? policy.timeZone;
        policy.autoConfirm = dto.autoConfirm ?? policy.autoConfirm;
        policy.maxVisitsPerDay = dto.maxVisitsPerDay;
        policy.minNoticeHours = dto.minNoticeHours ?? policy.minNoticeHours;
        policy.rescheduleCutoffHours =
          dto.rescheduleCutoffHours ?? policy.rescheduleCutoffHours;
        policy.allowedSpecialtyConceptIds = dto.allowedSpecialtyConceptIds;
        policy.maxDurationMinutes = dto.maxDurationMinutes;
        policy.statusConceptId = PHL.POLICY_ACTIVE;
        touch(policy, actor.id);
      }

      await this.repo.replaceWindows(
        tx,
        policy.id,
        dto.windows.map((window) => ({ ...window })),
        actor.id,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'DOCTOR_VISIT_POLICY_SET',
        entity: 'doctor_visit_policies',
        entityId: policy.id,
        tenantId: policy.tenantId,
      });
      this.logger.info(
        { operation: 'pharma_lab.agenda.put', doctorUserId: actor.id },
        'Doctor visit agenda configured',
      );
      return { id: policy.id, statusConceptId: policy.statusConceptId };
    });
  }

  /**
   * Lee la agenda publicada de un doctor.
   *
   * @param doctorUserId - Doctor.
   * @returns La agenda publicada.
   * @throws ResourceNotFoundException si el doctor no configuró agenda de visitas.
   */
  async getPublishedAgenda(doctorUserId: string): Promise<PublishedAgenda> {
    const policy = await this.repo.findPolicy(this.em, doctorUserId);
    if (!policy || policy.statusConceptId !== PHL.POLICY_ACTIVE) {
      throw new ResourceNotFoundException(
        'El doctor no tiene agenda de visitas habilitada',
        { doctorUserId },
      );
    }
    const windows = await this.repo.listWindows(this.em, policy.id);
    return {
      doctorUserId,
      timeZone: policy.timeZone ?? FALLBACK_TIME_ZONE,
      autoConfirm: policy.autoConfirm,
      minNoticeHours: policy.minNoticeHours,
      rescheduleCutoffHours: policy.rescheduleCutoffHours,
      maxDurationMinutes: policy.maxDurationMinutes,
      allowedSpecialtyConceptIds: policy.allowedSpecialtyConceptIds,
      windows: windows.map((window) => ({
        weekday: window.weekday,
        startTime: window.startTime.slice(0, 5),
        endTime: window.endTime.slice(0, 5),
        slotDurationMinutes: window.slotDurationMinutes,
        modalityConceptId: window.modalityConceptId,
        location: window.location,
      })),
    };
  }

  /**
   * UC-17-12: bloquea un laboratorio o un visitador.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador del bloqueo.
   * @throws PreconditionFailedException si no se indica a quién bloquear.
   */
  async createBlock(
    dto: CreateVisitBlockDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    if (!dto.pharmaLabId && !dto.medicalVisitorId) {
      throw new PreconditionFailedException(
        'Indicá el laboratorio o el visitador a bloquear',
        {},
      );
    }
    return this.em.transactional(async (tx) => {
      const block = this.repo.createBlock(tx, {
        doctorUserId: actor.id,
        pharmaLabId: dto.pharmaLabId,
        medicalVisitorId: dto.medicalVisitorId,
        reason: dto.reason,
        statusConceptId: PHL.BLOCK_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'DOCTOR_VISIT_BLOCK_CREATED',
        entity: 'doctor_visit_blocks',
        entityId: block.id,
      });
      return { id: block.id };
    });
  }

  /**
   * Levanta un bloqueo.
   *
   * @param blockId - Bloqueo.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado resultante.
   * @throws ResourceNotFoundException si el bloqueo no es del doctor.
   * @throws ConflictException si ya estaba levantado.
   */
  async liftBlock(
    blockId: string,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const block = await this.repo.findBlock(tx, blockId);
      if (!block || block.doctorUserId !== actor.id) {
        throw new ResourceNotFoundException('Bloqueo no encontrado', {
          blockId,
        });
      }
      if (block.statusConceptId !== PHL.BLOCK_ACTIVE) {
        throw new ConflictException('El bloqueo ya estaba levantado', {
          blockId,
        });
      }
      block.statusConceptId = PHL.BLOCK_LIFTED;
      block.liftedAt = new Date();
      touch(block, actor.id);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'DOCTOR_VISIT_BLOCK_LIFTED',
        entity: 'doctor_visit_blocks',
        entityId: block.id,
      });
      return { id: block.id, statusConceptId: block.statusConceptId };
    });
  }

  /**
   * Lista los bloqueos vigentes del doctor.
   *
   * @param actor - Doctor autenticado.
   * @returns Bloqueos vigentes.
   */
  listBlocks(actor: AuthenticatedUser): Promise<DoctorVisitBlocks[]> {
    return this.repo.listActiveBlocks(this.em, actor.id);
  }

  /**
   * Comprueba que un intervalo propuesto cabe en la agenda de visitas del doctor
   * y no choca con nada.
   *
   * Concentra las cinco comprobaciones de spec 5408-5419 en un solo lugar para
   * que la solicitud inicial y la reprogramación no puedan divergir.
   *
   * @param tx - Transacción activa.
   * @param doctorUserId - Doctor.
   * @param startAt - Inicio propuesto.
   * @param durationMinutes - Duración propuesta.
   * @param modalityConceptId - Modalidad propuesta.
   * @param ignoreRequestId - Solicitud que no cuenta como ocupación (la que se
   *   está reprogramando).
   * @returns La ventana en la que encaja y la política vigente.
   * @throws PreconditionFailedException si no encaja o choca con algo.
   */
  async assertSlotAvailable(
    tx: EntityManager,
    doctorUserId: string,
    startAt: Date,
    durationMinutes: number,
    modalityConceptId: string,
    ignoreRequestId?: string,
  ): Promise<{
    /** Ventana en la que encaja el intervalo. */
    window: DoctorVisitWindows;
    /** Zona horaria aplicada. */
    timeZone: string;
    /** Si la política confirma automáticamente. */
    autoConfirm: boolean;
    /** Plazo de reprogramación y cancelación, en horas. */
    rescheduleCutoffHours: number;
  }> {
    const policy = await this.repo.findPolicy(tx, doctorUserId);
    if (!policy || policy.statusConceptId !== PHL.POLICY_ACTIVE) {
      throw new PreconditionFailedException(
        'El doctor no recibe visitas de laboratorio',
        { doctorUserId },
      );
    }
    const timeZone = policy.timeZone ?? FALLBACK_TIME_ZONE;
    const endAt = new Date(startAt.getTime() + durationMinutes * 60_000);

    const noticeMs = policy.minNoticeHours * 3_600_000;
    if (startAt.getTime() - Date.now() < noticeMs) {
      throw new PreconditionFailedException(
        `La visita debe solicitarse con al menos ${policy.minNoticeHours} horas de antelación`,
        { doctorUserId },
      );
    }
    if (
      policy.maxDurationMinutes !== undefined &&
      durationMinutes > policy.maxDurationMinutes
    ) {
      throw new PreconditionFailedException(
        `La duración máxima admitida es de ${policy.maxDurationMinutes} minutos`,
        { doctorUserId },
      );
    }

    const windows = await this.repo.listWindows(tx, policy.id);
    const window = windows.find((candidate) =>
      this.fits(candidate, startAt, endAt, timeZone),
    );
    if (!window) {
      throw new PreconditionFailedException(
        'El horario solicitado queda fuera de las ventanas de visita del doctor',
        { doctorUserId },
      );
    }
    if (window.modalityConceptId !== modalityConceptId) {
      throw new PreconditionFailedException(
        'La modalidad solicitada no coincide con la de la ventana de visita',
        { doctorUserId },
      );
    }

    const dayStart = this.startOfDay(startAt, timeZone);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);
    const sameDay = (
      await this.visitsRepo.listOccupyingRequests(
        tx,
        doctorUserId,
        dayStart,
        dayEnd,
      )
    ).filter((request) => request.id !== ignoreRequestId);

    if (
      policy.maxVisitsPerDay !== undefined &&
      sameDay.length >= policy.maxVisitsPerDay
    ) {
      throw new PreconditionFailedException(
        'El doctor ya alcanzó el máximo de visitas para ese día',
        { doctorUserId },
      );
    }
    const overlapping = sameDay.find((request) => {
      const otherEnd = new Date(
        request.requestedStartAt.getTime() + request.durationMinutes * 60_000,
      );
      return request.requestedStartAt < endAt && otherEnd > startAt;
    });
    if (overlapping) {
      throw new PreconditionFailedException(
        'El horario se superpone con otra visita ya registrada',
        { doctorUserId, visitRequestId: overlapping.id },
      );
    }
    if (window.maxVisits !== undefined) {
      const inWindow = sameDay.filter((request) =>
        this.fits(
          window,
          request.requestedStartAt,
          new Date(
            request.requestedStartAt.getTime() +
              request.durationMinutes * 60_000,
          ),
          timeZone,
        ),
      );
      if (inWindow.length >= window.maxVisits) {
        throw new PreconditionFailedException(
          'La ventana de visita ya está completa',
          { doctorUserId },
        );
      }
    }

    const conflicts = await this.calendar.findConflicts(
      tx,
      doctorUserId,
      startAt,
      endAt,
    );
    if (conflicts.length > 0) {
      throw new PreconditionFailedException(
        'El horario se superpone con la agenda clínica del doctor',
        { doctorUserId, conflictKind: conflicts[0].kind },
      );
    }

    return {
      window,
      timeZone,
      autoConfirm: policy.autoConfirm,
      rescheduleCutoffHours: policy.rescheduleCutoffHours,
    };
  }

  /**
   * Comprueba que el visitador puede pedirle una visita a este doctor: que no
   * esté bloqueado y que su especialidad esté admitida.
   *
   * @param tx - Transacción activa.
   * @param doctorUserId - Doctor.
   * @param pharmaLabId - Laboratorio del visitador.
   * @param medicalVisitorId - Visitador.
   * @param visitorSpecialtyConceptIds - Especialidades del visitador.
   * @throws PreconditionFailedException si hay bloqueo o la especialidad no está
   *   admitida.
   */
  async assertVisitorAccepted(
    tx: EntityManager,
    doctorUserId: string,
    pharmaLabId: string,
    medicalVisitorId: string,
    visitorSpecialtyConceptIds: readonly string[],
  ): Promise<void> {
    const block = await this.repo.findApplicableBlock(
      tx,
      doctorUserId,
      pharmaLabId,
      medicalVisitorId,
    );
    if (block) {
      throw new PreconditionFailedException(
        'El doctor bloqueó las visitas de este laboratorio o visitador',
        { doctorUserId, blockId: block.id },
      );
    }
    const policy = await this.repo.findPolicy(tx, doctorUserId);
    const allowed = policy?.allowedSpecialtyConceptIds;
    if (allowed && allowed.length > 0) {
      const match = visitorSpecialtyConceptIds.some((specialty) =>
        allowed.includes(specialty),
      );
      if (!match) {
        throw new PreconditionFailedException(
          'El doctor solo recibe visitadores de determinadas especialidades',
          { doctorUserId },
        );
      }
    }
  }

  private assertWindowsCoherent(dto: PutVisitPolicyDto): void {
    for (const window of dto.windows) {
      if (window.startTime >= window.endTime) {
        throw new PreconditionFailedException(
          'La hora de fin debe ser posterior a la de inicio',
          { weekday: window.weekday },
        );
      }
    }
    const byDay = new Map<number, PutVisitPolicyDto['windows']>();
    for (const window of dto.windows) {
      byDay.set(window.weekday, [...(byDay.get(window.weekday) ?? []), window]);
    }
    for (const [weekday, windows] of byDay) {
      const sorted = [...windows].sort((a, b) =>
        a.startTime.localeCompare(b.startTime),
      );
      for (let i = 1; i < sorted.length; i += 1) {
        if (sorted[i].startTime < sorted[i - 1].endTime) {
          throw new PreconditionFailedException(
            'Dos ventanas del mismo día se superponen',
            { weekday },
          );
        }
      }
    }
  }

  /**
   * Indica si un intervalo cae dentro de una ventana semanal.
   *
   * La comparación se hace sobre la hora local de la zona de la política, no
   * sobre UTC: una ventana «martes de 15:00 a 17:00» es local por definición, y
   * compararla en UTC la correría según el desfase del país.
   */
  private fits(
    window: DoctorVisitWindows,
    startAt: Date,
    endAt: Date,
    timeZone: string,
  ): boolean {
    const local = this.localParts(startAt, timeZone);
    if (local.weekday !== window.weekday) return false;
    const endLocal = this.localParts(endAt, timeZone);
    if (endLocal.weekday !== window.weekday) return false;
    return (
      local.time >= window.startTime.slice(0, 5) &&
      endLocal.time <= window.endTime.slice(0, 5)
    );
  }

  private localParts(
    at: Date,
    timeZone: string,
  ): {
    /** Día de la semana local, 0 = domingo. */
    weekday: number;
    /** Hora local, `HH:MM`. */
    time: string;
  } {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(at);
    const weekdayName = parts.find((part) => part.type === 'weekday')?.value;
    const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      weekday: weekdays.indexOf(weekdayName ?? 'Sun'),
      // `hour12: false` puede rendir «24» a medianoche en algunos entornos ICU.
      time: `${hour === '24' ? '00' : hour}:${minute}`,
    };
  }

  private startOfDay(at: Date, timeZone: string): Date {
    const local = this.localParts(at, timeZone);
    const [hour, minute] = local.time.split(':').map(Number);
    return new Date(at.getTime() - (hour * 60 + minute) * 60_000);
  }
}
