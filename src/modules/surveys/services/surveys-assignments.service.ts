import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  AssignmentsRepository,
  InvitationsRepository,
  TemplatesRepository,
} from '../repositories';
import {
  CreateAssignmentDto,
  IdResponseDto,
  InvitationsIssuedDto,
  IssueInvitationsDto,
} from '../dto';
import { SURVEYS, TARGET_TYPE_BY_CODE } from '../surveys.concepts';
import { AppointmentBookings } from '../../scheduling/entities/appointment_bookings.entity';
import { BookableSlots } from '../../scheduling/entities/bookable_slots.entity';
import { SCHED } from '../../scheduling/scheduling.concepts';

/** Milisegundos de un día, para derivar la ventana de respuesta. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Reparto del instrumento: a qué se asocia y a quién se le pide.
 *
 * La regla que gobierna todo este servicio es de ALOVIDA y no es negociable:
 * **solo responde quien tiene una atención registrada y completada**. Por eso
 * la invitación se emite contra una reserva en estado completado y no de
 * cualquier otra forma; sin reserva completada no hay a quién invitar, y sin
 * invitación no hay forma de responder.
 */
@Injectable()
export class SurveysAssignmentsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param assignmentsRepo - Acceso a asignaciones.
   * @param invitationsRepo - Acceso a invitaciones.
   * @param templatesRepo - Acceso a plantillas y versiones.
   * @param logger - Registro estructurado del módulo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly invitationsRepo: InvitationsRepository,
    private readonly templatesRepo: TemplatesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(SurveysAssignmentsService.name);
  }

  /** Asocia una versión publicada a la cosa evaluada. */
  async createAssignment(
    dto: CreateAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const tenantId = requireTenantId();

    // El tipo de atención no se puede resolver desde una reserva: ni
    // `scheduling.appointment_bookings` ni `scheduling.bookable_slots` llevan
    // una referencia a él (solo `service_concept_id`). Aceptar la asignación
    // dejaría una que jamás emitiría una invitación, y el profesional no
    // tendría cómo enterarse. Se rechaza acá, que es donde todavía puede
    // elegir otro destino. Ver «Deuda restante» en el README del módulo.
    if (dto.targetType === 'CARE_TYPE') {
      throw new PreconditionFailedException(
        'El modelo de agenda no lleva tipo de atención en la reserva: asigná la encuesta por servicio o por cita concreta',
        { targetType: dto.targetType },
      );
    }

    return this.em.transactional(async (tx) => {
      const version = await this.templatesRepo.findVersionById(
        tx,
        dto.surveyVersionId,
      );
      if (!version) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          surveyVersionId: dto.surveyVersionId,
        });
      }
      if (version.publicationStatusConceptId !== SURVEYS.VERSION_PUBLISHED) {
        throw new PreconditionFailedException(
          'Solo se puede asignar una versión publicada',
          { surveyVersionId: dto.surveyVersionId },
        );
      }

      const template = await this.templatesRepo.findTemplateById(
        tx,
        version.surveyTemplateId,
      );
      if (!template || template.tenantId !== tenantId) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          surveyVersionId: dto.surveyVersionId,
        });
      }
      if (template.ownerPractitionerId !== actor.practitionerProfileId) {
        throw new ResourceNotFoundException('Versión no encontrada', {
          surveyVersionId: dto.surveyVersionId,
        });
      }

      const targetTypeConceptId = TARGET_TYPE_BY_CODE[dto.targetType];
      const duplicate = await this.assignmentsRepo.findActiveDuplicate(
        tx,
        dto.surveyVersionId,
        targetTypeConceptId,
        dto.targetId,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ya existe una asignación activa de esa versión a ese destino',
          { assignmentId: duplicate.id },
        );
      }

      const assignment = this.assignmentsRepo.create(tx, {
        surveyVersionId: dto.surveyVersionId,
        tenantId,
        targetTypeConceptId,
        targetId: dto.targetId,
        active: true,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'surveys.assignment.create',
          assignmentId: assignment.id,
          targetType: dto.targetType,
        },
        'Survey assignment created',
      );
      return { id: assignment.id };
    });
  }

  /**
   * Emite las invitaciones que correspondan a una reserva completada.
   *
   * Es **idempotente**: si la reserva ya tiene invitación de una versión, no se
   * emite otra. Cerrar dos veces la misma cita —o reintentar tras un fallo de
   * red— no puede terminar reclamándole al paciente el mismo cuestionario dos
   * veces.
   */
  async issueForBooking(
    dto: IssueInvitationsDto,
    actor: AuthenticatedUser,
  ): Promise<InvitationsIssuedDto> {
    const tenantId = requireTenantId();

    return this.em.transactional(async (tx) => {
      const booking = await tx.findOne(AppointmentBookings, {
        id: dto.appointmentBookingId,
      });
      if (!booking || booking.tenantId !== tenantId) {
        throw new ResourceNotFoundException('Reserva no encontrada', {
          appointmentBookingId: dto.appointmentBookingId,
        });
      }
      if (booking.statusConceptId !== SCHED.BOOKING_COMPLETED) {
        throw new PreconditionFailedException(
          'Solo se emiten cuestionarios sobre una atención completada',
          { appointmentBookingId: booking.id },
        );
      }

      const targetIds = await this.resolveTargets(tx, booking);
      const assignments = await this.assignmentsRepo.listActiveByTargets(
        tx,
        tenantId,
        targetIds,
      );

      const existing = await this.invitationsRepo.listByBooking(tx, booking.id);
      const alreadyByVersion = new Set(
        existing.map((invitation) => invitation.surveyVersionId),
      );

      const now = new Date();
      const ids: string[] = [];
      let alreadyIssued = 0;

      for (const assignment of assignments) {
        if (alreadyByVersion.has(assignment.surveyVersionId)) {
          alreadyIssued += 1;
          continue;
        }

        const version = await this.templatesRepo.findVersionById(
          tx,
          assignment.surveyVersionId,
        );
        if (!version) continue;
        if (!this.isEffective(version.effectiveFrom, version.effectiveTo, now))
          continue;

        const template = await this.templatesRepo.findTemplateById(
          tx,
          version.surveyTemplateId,
        );
        // Una plantilla desactivada deja de repartirse; lo ya emitido sigue en
        // pie, que es exactamente la diferencia entre desactivar y borrar.
        if (!template || template.statusConceptId === SURVEYS.TEMPLATE_INACTIVE)
          continue;

        const invitation = this.invitationsRepo.create(tx, {
          surveyVersionId: version.id,
          surveyAssignmentId: assignment.id,
          tenantId,
          patientProfileId: booking.patientProfileId,
          appointmentBookingId: booking.id,
          statusConceptId: SURVEYS.INVITATION_PENDING,
          issuedAt: now,
          // Se congela al emitir en vez de calcularse al leer: si mañana
          // alguien acorta el plazo, la ventana ya prometida no se mueve.
          expiresAt: new Date(
            now.getTime() + version.responseWindowDays * MS_PER_DAY,
          ),
          actorUserId: actor.id,
        });
        alreadyByVersion.add(version.id);
        ids.push(invitation.id);
      }

      await tx.flush();

      this.logger.info(
        {
          operation: 'surveys.invitation.issue',
          appointmentBookingId: booking.id,
          issued: ids.length,
          alreadyIssued,
        },
        'Survey invitations issued',
      );
      return { ids, alreadyIssued };
    });
  }

  /**
   * Identificadores contra los que se buscan asignaciones activas: la reserva
   * misma y el servicio al que corresponde.
   *
   * El servicio se toma de la reserva y, si no lo lleva, del cupo reservado —
   * que es donde la agenda lo declara cuando la reserva se hizo sin
   * especificarlo.
   */
  private async resolveTargets(
    em: EntityManager,
    booking: AppointmentBookings,
  ): Promise<string[]> {
    const targets: string[] = [booking.id];

    let serviceConceptId = booking.serviceConceptId;
    if (!serviceConceptId) {
      const slot = await em.findOne(BookableSlots, {
        id: booking.bookableSlotId,
      });
      serviceConceptId = slot?.serviceConceptId;
    }
    if (serviceConceptId) targets.push(serviceConceptId);

    return targets;
  }

  /** Si el instante indicado cae dentro de la vigencia de la versión. */
  private isEffective(
    from: Date | undefined,
    to: Date | undefined,
    now: Date,
  ): boolean {
    if (from && now < from) return false;
    if (to && now > to) return false;
    return true;
  }
}
