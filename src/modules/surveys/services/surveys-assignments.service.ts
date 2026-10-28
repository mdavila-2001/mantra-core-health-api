import { Injectable } from '@nestjs/common';
import { LockMode, UniqueConstraintViolationException } from '@mikro-orm/core';
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
  TargetsRepository,
  TemplatesRepository,
} from '../repositories';
import {
  CreateAssignmentDto,
  IdResponseDto,
  InvitationsIssuedDto,
  IssueInvitationsDto,
} from '../dto';
import {
  isSystemOwnerType,
  SURVEYS,
  TARGET_TYPE_BY_CODE,
} from '../surveys.concepts';
import { SurveysErrorReason } from '../surveys.error-reasons';
import { assertNotSystemTemplate } from '../surveys.system-guard';
import type { SystemSurveyKind } from '../surveys.base-definitions';
import {
  SurveysSystemTemplatesService,
  type SystemSurvey,
} from './surveys-system-templates.service';
import { AppointmentBookings } from '../../scheduling/entities/appointment_bookings.entity';
import { BookableSlots } from '../../scheduling/entities/bookable_slots.entity';
import { SCHED } from '../../scheduling/domain/scheduling.concepts';
import { operatesAnyAgenda } from '../../scheduling/domain/booking/agenda-actors';
import type {
  SurveyAssignments,
  SurveyInvitations,
  SurveyTemplates,
  SurveyVersions,
} from '../entities';

/** Milisegundos de un día, para derivar la ventana de respuesta. */
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Qué tan específico es el destino de una asignación: cuanto menor, más
 * específico. Decide cuál de las encuestas del profesional viaja dentro de la
 * invitación base cuando aplican varias a la misma reserva.
 */
const TARGET_SPECIFICITY: Readonly<Record<string, number>> = {
  [SURVEYS.TARGET_APPOINTMENT]: 0,
  [SURVEYS.TARGET_SERVICE]: 1,
  [SURVEYS.TARGET_CARE_TYPE]: 2,
};

/** Una encuesta del profesional que aplica a la reserva que se está cerrando. */
interface PractitionerCandidate {
  /** La asignación que la trae. */
  assignment: SurveyAssignments;
  /** Su versión publicada y vigente. */
  version: SurveyVersions;
}

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
   * @param systemTemplates - La encuesta base del sistema.
   * @param targetsRepo - Lectura de reservas, servicios y profesionales.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly assignmentsRepo: AssignmentsRepository,
    private readonly invitationsRepo: InvitationsRepository,
    private readonly templatesRepo: TemplatesRepository,
    private readonly logger: PinoLogger,
    private readonly systemTemplates: SurveysSystemTemplatesService,
    private readonly targetsRepo: TargetsRepository,
  ) {
    this.logger.setContext(SurveysAssignmentsService.name);
  }

  /**
   * Asocia una versión publicada a la cosa evaluada.
   *
   * El destino tiene que existir, ser de la organización y ser algo que el
   * profesional atiende: sin eso la asignación quedaría viva y no emitiría
   * nunca, y el profesional no tendría cómo enterarse.
   *
   * - `SERVICE`: `targetId` es `billing.service_catalog.id`, y el profesional
   *   tiene que ofrecerlo (`practitioner_service_offerings`).
   * - `CARE_TYPE`: sólo existe «todas mis consultas»
   *   ({@link SURVEYS.CARE_TYPE_CONSULTATION}); `targetId` puede omitirse.
   * - `APPOINTMENT`: una reserva de la organización atendida por el profesional.
   */
  async createAssignment(
    dto: CreateAssignmentDto,
    actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    const tenantId = requireTenantId();

    // El modelo de agenda no lleva «tipo de atención» en la reserva: lo único
    // que distingue una consulta de un servicio es que la reserva no tenga
    // oferta de servicio. Por eso «consulta» es el único tipo de atención que
    // se puede asociar; cualquier otro se rechaza acá, que es donde todavía
    // puede elegir otro destino.
    const targetId = this.resolveTargetId(dto);

    return this.em
      .transactional(async (tx) => {
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
        // La encuesta base se reparte sola: ningún profesional la asigna.
        assertNotSystemTemplate(template, template.id);
        if (template.ownerPractitionerId !== actor.practitionerProfileId) {
          throw new ResourceNotFoundException('Versión no encontrada', {
            surveyVersionId: dto.surveyVersionId,
          });
        }

        await this.assertTargetUsable(
          tx,
          dto.targetType,
          targetId,
          tenantId,
          actor.practitionerProfileId,
        );

        // La comprobación de duplicado y el alta no son atómicas por sí solas: se
        // bloquea la versión para que dos altas simultáneas se serialicen y la
        // segunda vea la asignación de la primera.
        await this.templatesRepo.lockVersion(tx, dto.surveyVersionId);
        const targetTypeConceptId = TARGET_TYPE_BY_CODE[dto.targetType];
        const duplicate = await this.assignmentsRepo.findActiveDuplicate(
          tx,
          dto.surveyVersionId,
          targetTypeConceptId,
          targetId,
        );
        if (duplicate) {
          throw new ConflictException(
            'Ya existe una asignación activa de esa versión a ese destino',
            { assignmentId: duplicate.id },
            SurveysErrorReason.ASSIGNMENT_ALREADY_ACTIVE,
          );
        }

        const assignment = this.assignmentsRepo.create(tx, {
          surveyVersionId: dto.surveyVersionId,
          tenantId,
          targetTypeConceptId,
          targetId,
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
      })
      .catch((error: unknown) => {
        // Si el modelo respalda la unicidad de la asignación activa, perder la
        // carrera es el mismo conflicto que detectó la comprobación previa.
        if (error instanceof UniqueConstraintViolationException) {
          throw new ConflictException(
            'Ya existe una asignación activa de esa versión a ese destino',
            { surveyVersionId: dto.surveyVersionId },
            SurveysErrorReason.ASSIGNMENT_ALREADY_ACTIVE,
          );
        }
        throw error;
      });
  }

  /**
   * Emite la invitación de una reserva completada.
   *
   * Es **una sola invitación por reserva**: lleva las preguntas base del
   * sistema (de consulta o de servicio, según la reserva) y, detrás, las de la
   * encuesta del profesional que atendió si la asoció a este servicio o a sus
   * consultas. Si aplican varias encuestas del profesional, la más específica
   * (cita > servicio > tipo de atención; a igualdad, la más antigua) viaja
   * dentro de la invitación base y las demás se emiten sueltas, como antes.
   *
   * Es **idempotente**: si la reserva ya tiene la invitación base, o una
   * versión del profesional ya fue emitida (suelta o dentro de la base), no se
   * emite otra. Cerrar dos veces la misma cita —o reintentar tras un fallo de
   * red— no puede terminar reclamándole al paciente el mismo cuestionario dos
   * veces.
   */
  async issueForBooking(
    dto: IssueInvitationsDto,
    actor: AuthenticatedUser,
  ): Promise<InvitationsIssuedDto> {
    return this.issue(dto, actor, true);
  }

  /**
   * La emisión que dispara el cierre de la atención (`BOOKING_COMPLETED_PORT`).
   *
   * Es la misma que {@link issueForBooking} sin exigir que el actor haya
   * atendido la reserva: quien la cerró ya pasó por `loadForOperation`, que
   * admite también al mostrador y a la administración de agenda.
   */
  async issueForCompletedBooking(
    appointmentBookingId: string,
    actor: AuthenticatedUser,
  ): Promise<InvitationsIssuedDto> {
    return this.issue({ appointmentBookingId }, actor, false);
  }

  /**
   * Reservas completadas del tenant que no tienen NINGUNA invitación: las
   * emisiones que fallaron (la automática no reintenta). Es la consulta del
   * runbook del README; no tiene endpoint. Cada una se reemite con
   * `POST /surveys/invitations`, que es idempotente.
   *
   * @param limit - Tope de reservas por pasada (más recientes primero).
   * @returns Los identificadores de las reservas.
   */
  async listCompletedBookingsWithoutInvitation(limit = 100): Promise<string[]> {
    return this.targetsRepo.listCompletedBookingsWithoutInvitation(
      this.em.fork(),
      requireTenantId(),
      SCHED.BOOKING_COMPLETED,
      limit,
    );
  }

  /**
   * @param enforceAttendance - Exige que el actor haya atendido la reserva,
   *   salvo que opere cualquier agenda por oficio (mostrador, administración).
   */
  private async issue(
    dto: IssueInvitationsDto,
    actor: AuthenticatedUser,
    enforceAttendance: boolean,
  ): Promise<InvitationsIssuedDto> {
    const tenantId = requireTenantId();

    // La reserva se mira antes de abrir la transacción para saber qué base le
    // toca y materializarla FUERA de ella: la base se escribe en su propia
    // transacción (ver `ensureSystemTemplate`) y hacerlo con el candado de la
    // reserva tomado ataría una conexión más mientras se espera. Las
    // comprobaciones se repiten abajo, ya con la reserva bloqueada.
    const preRead = await this.targetsRepo.findBooking(
      this.em.fork(),
      dto.appointmentBookingId,
    );
    const pre = this.assertIssuable(
      preRead,
      tenantId,
      dto.appointmentBookingId,
    );
    // Una consulta no lleva oferta de servicio; un servicio sí. Cada una tiene
    // su encuesta base.
    const kind: SystemSurveyKind = pre.practitionerServiceOfferingId
      ? 'SERVICE'
      : 'CONSULTATION';
    const base = await this.systemTemplates.ensureSystemTemplate(
      tenantId,
      kind,
      actor.id,
    );

    return this.em
      .transactional(async (tx) => {
        // Se bloquea la reserva antes de mirar qué invitaciones tiene: dos
        // emisiones simultáneas para la misma reserva se serializan y la segunda
        // las ve ya emitidas (`alreadyIssued`) en lugar de duplicarlas.
        const locked = await tx.findOne(
          AppointmentBookings,
          { id: dto.appointmentBookingId },
          { lockMode: LockMode.PESSIMISTIC_WRITE },
        );
        const booking = this.assertIssuable(
          locked,
          tenantId,
          dto.appointmentBookingId,
        );

        const { targetIds, practitionerProfileId } = await this.resolveTargets(
          tx,
          booking,
        );
        if (enforceAttendance && !operatesAnyAgenda(actor)) {
          // Un profesional emite sólo las encuestas de lo que atendió. 404 y no
          // 403: una reserva ajena no se distingue de una inexistente.
          if (
            practitionerProfileId === null ||
            practitionerProfileId !== actor.practitionerProfileId
          ) {
            throw new ResourceNotFoundException('Reserva no encontrada', {
              appointmentBookingId: dto.appointmentBookingId,
            });
          }
        }
        const assignments = await this.assignmentsRepo.listActiveByTargets(
          tx,
          tenantId,
          targetIds,
        );

        const existing = await this.invitationsRepo.listByBooking(
          tx,
          booking.id,
        );
        // Una versión del profesional ya está repartida si es la principal de
        // una invitación suelta o viaja como extensión de una base.
        const alreadyByVersion = new Set<string>();
        for (const invitation of existing) {
          alreadyByVersion.add(invitation.surveyVersionId);
          if (invitation.extensionSurveyVersionId) {
            alreadyByVersion.add(invitation.extensionSurveyVersionId);
          }
        }
        // La base ya salió si alguna invitación de la reserva es de la plantilla
        // de sistema, de la versión que sea: al subir el contenido
        // (`SYSTEM_BASE_SURVEY_VERSION`) cambia la versión, no la plantilla, y
        // un reintento no debe emitir otra base.
        const baseAlreadyIssued = await this.hasInvitationOfTemplate(
          tx,
          existing,
          base,
        );

        const now = new Date();
        const ids: string[] = [];
        let alreadyIssued = 0;

        const candidates = await this.practitionerCandidates(
          tx,
          assignments,
          practitionerProfileId,
          now,
        );
        const extension = baseAlreadyIssued
          ? undefined
          : candidates.find((c) => !alreadyByVersion.has(c.version.id));

        if (baseAlreadyIssued) {
          alreadyIssued += 1;
        } else {
          const invitation = this.invitationsRepo.create(tx, {
            surveyVersionId: base.versionId,
            extensionSurveyVersionId: extension?.version.id,
            surveyAssignmentId: base.assignmentId,
            tenantId,
            patientProfileId: booking.patientProfileId,
            appointmentBookingId: booking.id,
            statusConceptId: SURVEYS.INVITATION_PENDING,
            issuedAt: now,
            // Se congela al emitir en vez de calcularse al leer: si mañana
            // alguien acorta el plazo, la ventana ya prometida no se mueve.
            expiresAt: new Date(
              now.getTime() + base.responseWindowDays * MS_PER_DAY,
            ),
            actorUserId: actor.id,
          });
          alreadyByVersion.add(base.versionId);
          if (extension) alreadyByVersion.add(extension.version.id);
          ids.push(invitation.id);
        }

        for (const candidate of candidates) {
          if (candidate === extension) continue;
          if (alreadyByVersion.has(candidate.version.id)) {
            alreadyIssued += 1;
            continue;
          }
          const invitation = this.invitationsRepo.create(tx, {
            surveyVersionId: candidate.version.id,
            surveyAssignmentId: candidate.assignment.id,
            tenantId,
            patientProfileId: booking.patientProfileId,
            appointmentBookingId: booking.id,
            statusConceptId: SURVEYS.INVITATION_PENDING,
            issuedAt: now,
            expiresAt: new Date(
              now.getTime() + candidate.version.responseWindowDays * MS_PER_DAY,
            ),
            actorUserId: actor.id,
          });
          alreadyByVersion.add(candidate.version.id);
          ids.push(invitation.id);
        }

        await tx.flush();

        this.logger.info(
          {
            operation: 'surveys.invitation.issue',
            appointmentBookingId: booking.id,
            kind,
            withExtension: extension !== undefined,
            issued: ids.length,
            alreadyIssued,
          },
          'Survey invitations issued',
        );
        return { ids, alreadyIssued };
      })
      .catch(async (error: unknown) => {
        // Si el modelo respalda `(reserva, versión)`, perder la carrera no es
        // un error: la invitación ya existe, y se responde como emisión previa.
        if (!(error instanceof UniqueConstraintViolationException)) throw error;
        const existing = await this.invitationsRepo.listByBooking(
          this.em.fork(),
          dto.appointmentBookingId,
        );
        return { ids: [], alreadyIssued: existing.length };
      });
  }

  /**
   * Que la reserva exista en el tenant y esté completada: sólo así hay a quién
   * preguntarle. Una de otra organización es indistinguible de una inexistente.
   */
  private assertIssuable(
    booking: AppointmentBookings | null,
    tenantId: string,
    appointmentBookingId: string,
  ): AppointmentBookings {
    if (!booking || booking.tenantId !== tenantId) {
      throw new ResourceNotFoundException('Reserva no encontrada', {
        appointmentBookingId,
      });
    }
    if (booking.statusConceptId !== SCHED.BOOKING_COMPLETED) {
      throw new PreconditionFailedException(
        'Solo se emiten cuestionarios sobre una atención completada',
        { appointmentBookingId: booking.id },
      );
    }
    return booking;
  }

  /**
   * Si alguna de las invitaciones de la reserva es de la plantilla de sistema
   * (la versión vigente o una anterior, retirada al subir el contenido).
   */
  private async hasInvitationOfTemplate(
    tx: EntityManager,
    invitations: SurveyInvitations[],
    base: SystemSurvey,
  ): Promise<boolean> {
    for (const invitation of invitations) {
      if (invitation.surveyVersionId === base.versionId) return true;
      const version = await this.templatesRepo.findVersionById(
        tx,
        invitation.surveyVersionId,
      );
      if (version?.surveyTemplateId === base.templateId) return true;
    }
    return false;
  }

  /**
   * El destino de una asignación. Para `CARE_TYPE` sólo existe «consulta», y
   * `targetId` puede omitirse; cualquier otro tipo de atención se rechaza.
   */
  private resolveTargetId(dto: CreateAssignmentDto): string {
    if (dto.targetType !== 'CARE_TYPE') return dto.targetId as string;
    if (
      dto.targetId !== undefined &&
      dto.targetId !== SURVEYS.CARE_TYPE_CONSULTATION
    ) {
      throw new PreconditionFailedException(
        'El único tipo de atención que se puede asociar es «consulta»: asigne la encuesta por servicio, por cita concreta o a todas sus consultas',
        { targetType: dto.targetType },
        SurveysErrorReason.ASSIGNMENT_CARE_TYPE_UNSUPPORTED,
      );
    }
    return SURVEYS.CARE_TYPE_CONSULTATION;
  }

  /**
   * Comprueba que el destino exista, sea de la organización y lo atienda el
   * profesional. Un destino inexistente, de otra organización o de otro
   * profesional responde igual (404): no se confirma que exista.
   */
  private async assertTargetUsable(
    tx: EntityManager,
    targetType: CreateAssignmentDto['targetType'],
    targetId: string,
    tenantId: string,
    practitionerProfileId: string | undefined,
  ): Promise<void> {
    if (targetType === 'CARE_TYPE') return;

    const notFound = (message: string) =>
      new ResourceNotFoundException(
        message,
        { targetType },
        SurveysErrorReason.ASSIGNMENT_TARGET_NOT_FOUND,
      );

    if (targetType === 'APPOINTMENT') {
      const booking = await this.targetsRepo.findBooking(tx, targetId);
      if (!booking || booking.tenantId !== tenantId) {
        throw notFound('Cita no encontrada');
      }
      const attendedBy = await this.targetsRepo.findPractitionerOfBooking(
        tx,
        booking,
      );
      if (attendedBy === null || attendedBy !== practitionerProfileId) {
        throw notFound('Cita no encontrada');
      }
      return;
    }

    // SERVICE: identidad canónica = billing.service_catalog.id.
    const service = await this.targetsRepo.findServiceCatalog(tx, targetId);
    if (
      !service ||
      (await this.targetsRepo.findTenantOfPractice(tx, service.practiceId)) !==
        tenantId
    ) {
      throw notFound('Servicio no encontrado');
    }
    const offering = practitionerProfileId
      ? await this.targetsRepo.findOfferingOf(
          tx,
          practitionerProfileId,
          service.id,
        )
      : null;
    if (!offering) {
      throw new PreconditionFailedException(
        'Usted no ofrece ese servicio: declárelo en sus servicios antes de asociarle una encuesta',
        { targetType },
        SurveysErrorReason.ASSIGNMENT_SERVICE_NOT_OFFERED,
      );
    }
  }

  /**
   * Las encuestas del profesional que atendió que aplican a la reserva, de la
   * más específica a la menos.
   *
   * Aplica una asignación activa cuya versión está vigente, cuya plantilla está
   * activa y **es del profesional que atendió** (una asignación heredada o mal
   * cargada no puede repartir la encuesta de un colega), y que no es la base
   * del sistema, que se emite aparte. Una misma versión asignada por dos
   * destinos cuenta una vez.
   */
  private async practitionerCandidates(
    tx: EntityManager,
    assignments: SurveyAssignments[],
    practitionerProfileId: string | null,
    now: Date,
  ): Promise<PractitionerCandidate[]> {
    if (practitionerProfileId === null) return [];

    const ordered = [...assignments].sort(
      (a, b) =>
        (TARGET_SPECIFICITY[a.targetTypeConceptId] ?? 3) -
          (TARGET_SPECIFICITY[b.targetTypeConceptId] ?? 3) ||
        // A igual especificidad gana la intención más reciente del médico.
        (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0),
    );

    const candidates: PractitionerCandidate[] = [];
    const seen = new Set<string>();
    for (const assignment of ordered) {
      if (seen.has(assignment.surveyVersionId)) continue;
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
      if (!this.isPractitionerOf(template, practitionerProfileId)) continue;

      seen.add(version.id);
      candidates.push({ assignment, version });
    }

    // De una misma plantilla sólo se reparte su versión más alta: dos versiones
    // asignadas a la vez (la vieja y la corregida) le repetirían la encuesta al
    // paciente.
    const highest = new Map<string, number>();
    for (const { version } of candidates) {
      highest.set(
        version.surveyTemplateId,
        Math.max(
          highest.get(version.surveyTemplateId) ?? 0,
          version.versionNumber,
        ),
      );
    }
    return candidates.filter(
      ({ version }) =>
        version.versionNumber >= (highest.get(version.surveyTemplateId) ?? 0),
    );
  }

  /** Si la plantilla es del profesional (y no una encuesta de sistema). */
  private isPractitionerOf(
    template: SurveyTemplates,
    practitionerProfileId: string,
  ): boolean {
    return (
      !isSystemOwnerType(template.ownerTypeConceptId) &&
      template.ownerPractitionerId === practitionerProfileId
    );
  }

  /**
   * Identificadores contra los que se buscan asignaciones activas, y el
   * profesional que atendió.
   *
   * - la reserva misma;
   * - el servicio al que corresponde, por su **identidad canónica**
   *   (`billing.service_catalog.id`): la que el profesional elige al asociar la
   *   encuesta. Sale de la copia congelada de la reserva
   *   (`service_snapshot.serviceCatalogId`) o, si no la trae, de la oferta
   *   reservada;
   * - el concepto de servicio de la reserva (o, si no lo lleva, el del cupo
   *   reservado), por compatibilidad con asignaciones anteriores;
   * - «consulta», si la reserva no es de un servicio.
   */
  private async resolveTargets(
    em: EntityManager,
    booking: AppointmentBookings,
  ): Promise<{
    /** Identificadores candidatos del destino. */
    targetIds: string[];
    /** Profesional que atendió, o `null` si no se puede determinar. */
    practitionerProfileId: string | null;
  }> {
    const targetIds: string[] = [booking.id];

    const serviceCatalogId = await this.resolveServiceCatalogId(em, booking);
    if (serviceCatalogId) targetIds.push(serviceCatalogId);

    let serviceConceptId = booking.serviceConceptId;
    if (!serviceConceptId) {
      const slot = await em.findOne(BookableSlots, {
        id: booking.bookableSlotId,
      });
      serviceConceptId = slot?.serviceConceptId;
    }
    if (serviceConceptId) targetIds.push(serviceConceptId);

    if (!booking.practitionerServiceOfferingId) {
      targetIds.push(SURVEYS.CARE_TYPE_CONSULTATION);
    }

    const practitionerProfileId =
      await this.targetsRepo.findPractitionerOfBooking(em, booking);
    return { targetIds, practitionerProfileId };
  }

  /** El `billing.service_catalog.id` del servicio reservado, si la reserva es de un servicio. */
  private async resolveServiceCatalogId(
    em: EntityManager,
    booking: AppointmentBookings,
  ): Promise<string | null> {
    if (!booking.practitionerServiceOfferingId) return null;
    const snapshot = booking.serviceSnapshot as {
      /** Servicio del catálogo congelado al reservar. */
      serviceCatalogId?: unknown;
    } | null;
    if (typeof snapshot?.serviceCatalogId === 'string') {
      return snapshot.serviceCatalogId;
    }
    const offering = await this.targetsRepo.findOffering(
      em,
      booking.practitionerServiceOfferingId,
    );
    return offering?.serviceCatalogId ?? null;
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
