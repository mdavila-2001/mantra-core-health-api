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
  CancelVisitDto,
  CreateVisitRequestDto,
  CreatedResourceDto,
  ProposeVisitTimeDto,
  RescheduleVisitDto,
  TransitionResultDto,
  VisitDecisionDto,
} from '../dto';
import type {
  VisitRequestEvents,
  VisitRequestTopics,
  VisitRequests,
} from '../entities';
import {
  CatalogRepository,
  VisitorsRepository,
  VisitsRepository,
} from '../repositories';
import { PHL } from '../pharma_lab.concepts';
import { PharmaLabAccessService } from './pharma-lab-access.service';
import { PharmaLabNotificationsService } from './pharma-lab-notifications.service';
import { VisitAgendaService } from './visit-agenda.service';

/**
 * Transiciones admitidas de la máquina de estados de la visita.
 *
 * Se declara como dato y no como una cadena de `if`s porque la spec fija una
 * lista cerrada de estados (5382-5394) y lo que hay que garantizar es que no se
 * llegue a ninguno por un camino que nadie revisó. Cualquier transición que no
 * esté acá es un 412, no un estado nuevo.
 */
const ALLOWED_TRANSITIONS: Readonly<Record<string, readonly string[]>> = {
  [PHL.VISIT_REQUESTED]: [
    PHL.VISIT_PENDING_CONFIRMATION,
    PHL.VISIT_CONFIRMED,
    PHL.VISIT_REJECTED,
    PHL.VISIT_RESCHEDULED,
    PHL.VISIT_CANCELLED_BY_VISITOR,
    PHL.VISIT_CANCELLED_BY_DOCTOR,
  ],
  [PHL.VISIT_PENDING_CONFIRMATION]: [
    PHL.VISIT_CONFIRMED,
    PHL.VISIT_REJECTED,
    PHL.VISIT_RESCHEDULED,
    PHL.VISIT_CANCELLED_BY_VISITOR,
    PHL.VISIT_CANCELLED_BY_DOCTOR,
  ],
  [PHL.VISIT_RESCHEDULED]: [
    PHL.VISIT_PENDING_CONFIRMATION,
    PHL.VISIT_CONFIRMED,
    PHL.VISIT_REJECTED,
    PHL.VISIT_CANCELLED_BY_VISITOR,
    PHL.VISIT_CANCELLED_BY_DOCTOR,
  ],
  [PHL.VISIT_CONFIRMED]: [
    PHL.VISIT_IN_PROGRESS,
    PHL.VISIT_COMPLETED,
    PHL.VISIT_CANCELLED_BY_VISITOR,
    PHL.VISIT_CANCELLED_BY_DOCTOR,
    PHL.VISIT_VISITOR_NO_SHOW,
    PHL.VISIT_DOCTOR_NO_SHOW,
    PHL.VISIT_RESCHEDULED,
  ],
  [PHL.VISIT_IN_PROGRESS]: [PHL.VISIT_COMPLETED],
  // Estados terminales: no salen a ninguna parte.
  [PHL.VISIT_REJECTED]: [],
  [PHL.VISIT_CANCELLED_BY_VISITOR]: [],
  [PHL.VISIT_CANCELLED_BY_DOCTOR]: [],
  [PHL.VISIT_COMPLETED]: [],
  [PHL.VISIT_VISITOR_NO_SHOW]: [],
  [PHL.VISIT_DOCTOR_NO_SHOW]: [],
};

/**
 * UC-17-13 a UC-17-17: solicitud de visita médica y su ciclo de vida
 * (spec 5343-5394).
 *
 * Aplica «reglas similares a la solicitud de cita de un paciente» (5346) pero
 * sobre entidades propias, y sin ninguna puerta a información clínica: el
 * visitador no ve pacientes, ni recetas, ni diagnósticos, porque este servicio
 * no lee esas tablas y las suyas no las referencian.
 */
@Injectable()
export class VisitRequestsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param repo - Repositorio de solicitudes.
   * @param visitorsRepo - Repositorio de visitadores.
   * @param catalog - Repositorio del catálogo, para validar el temario.
   * @param agenda - Reglas de agenda y disponibilidad del doctor.
   * @param access - Comprobaciones de vinculación y estado.
   * @param notifications - Buzón de avisos dentro del producto.
   * @param audit - Cadena WORM de auditoría.
   * @param logger - Registro estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: VisitsRepository,
    private readonly visitorsRepo: VisitorsRepository,
    private readonly catalog: CatalogRepository,
    private readonly agenda: VisitAgendaService,
    private readonly access: PharmaLabAccessService,
    private readonly notifications: PharmaLabNotificationsService,
    private readonly audit: AuditTrailService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(VisitRequestsService.name);
  }

  /**
   * UC-17-13: el visitador solicita una visita.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Visitador autenticado.
   * @returns Identificador de la solicitud.
   * @throws PreconditionFailedException si el visitador no puede operar, si el
   *   horario no encaja en la agenda del doctor o si el temario incluye un
   *   producto que no representa.
   */
  async createRequest(
    dto: CreateVisitRequestDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const { visitor, lab } = await this.access.requireOperatingVisitor(
        tx,
        actor,
      );
      const specialties = await this.visitorsRepo.listSpecialties(
        tx,
        visitor.id,
      );
      await this.agenda.assertVisitorAccepted(
        tx,
        dto.doctorUserId,
        lab.id,
        visitor.id,
        specialties.map((row) => row.specialtyConceptId),
      );
      await this.assertTopicsAuthorized(tx, visitor.id, dto.topics);

      const startAt = new Date(dto.requestedStartAt);
      const slot = await this.agenda.assertSlotAvailable(
        tx,
        dto.doctorUserId,
        startAt,
        dto.durationMinutes,
        dto.modalityConceptId,
      );

      // La spec distingue «solicitada» de «pendiente de confirmación»: la primera
      // es el hecho de haberla enviado, la segunda es que está esperando al
      // doctor. Con confirmación automática no pasa por la espera.
      const status = slot.autoConfirm
        ? PHL.VISIT_CONFIRMED
        : PHL.VISIT_PENDING_CONFIRMATION;

      const request = this.repo.createRequest(tx, {
        medicalVisitorId: visitor.id,
        pharmaLabId: lab.id,
        doctorUserId: dto.doctorUserId,
        doctorTenantId: dto.doctorTenantId,
        reason: dto.reason,
        requestedStartAt: startAt,
        durationMinutes: dto.durationMinutes,
        timeZone: slot.timeZone,
        modalityConceptId: dto.modalityConceptId,
        location: dto.location ?? slot.window.location,
        observations: dto.observations,
        statusConceptId: status,
        confirmedAt: slot.autoConfirm ? new Date() : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const topic of dto.topics) {
        this.repo.createTopic(tx, {
          visitRequestId: request.id,
          pharmaProductId: topic.pharmaProductId,
          topic: topic.topic,
          actorUserId: actor.id,
        });
      }
      this.repo.appendRequestEvent(tx, {
        visitRequestId: request.id,
        actionConceptId: PHL.VISIT_REQUESTED,
        previousStatusConceptId: PHL.VISIT_REQUESTED,
        newStatusConceptId: status,
        actorUserId: actor.id,
        createdByUserId: actor.id,
      });
      this.notifications.notify(
        tx,
        {
          recipientUserId: dto.doctorUserId,
          templateCode: slot.autoConfirm
            ? 'PHARMA_LAB_VISIT_AUTO_CONFIRMED'
            : 'PHARMA_LAB_VISIT_REQUESTED',
          subject: slot.autoConfirm
            ? 'Visita médica confirmada automáticamente'
            : 'Nueva solicitud de visita médica',
          bodyText: `${visitor.fullName} (${lab.legalName}) solicitó una visita.`,
          relatedResourceType: 'visit_request',
          relatedResourceId: request.id,
          tenantId: dto.doctorTenantId,
        },
        actor.id,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_REQUEST_CREATED',
        entity: 'visit_requests',
        entityId: request.id,
        tenantId: lab.tenantId,
      });
      this.logger.info(
        { operation: 'pharma_lab.visit.request', visitRequestId: request.id },
        'Visit request created',
      );
      return { id: request.id };
    });
  }

  /**
   * UC-17-14: el doctor acepta la visita.
   *
   * @param visitRequestId - Solicitud.
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado resultante.
   */
  async accept(
    visitRequestId: string,
    dto: VisitDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.transitionByDoctor(
      visitRequestId,
      actor,
      PHL.VISIT_CONFIRMED,
      PHL.VISIT_ACTION_ACCEPT,
      dto.note,
      'PHARMA_LAB_VISIT_ACCEPTED',
      'Visita médica aceptada',
      (request) => {
        request.confirmedAt = new Date();
      },
    );
  }

  /**
   * UC-17-14: el doctor rechaza la visita.
   *
   * @param visitRequestId - Solicitud.
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado resultante.
   */
  async reject(
    visitRequestId: string,
    dto: VisitDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.transitionByDoctor(
      visitRequestId,
      actor,
      PHL.VISIT_REJECTED,
      PHL.VISIT_ACTION_REJECT,
      dto.note,
      'PHARMA_LAB_VISIT_REJECTED',
      'Visita médica rechazada',
      (request) => {
        request.closedAt = new Date();
      },
    );
  }

  /**
   * UC-17-14: el doctor pide información adicional.
   *
   * No cambia el estado —la solicitud sigue esperando— pero sí queda en la
   * bitácora y avisa al visitador, que es lo que la spec pide (5374).
   *
   * @param visitRequestId - Solicitud.
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado resultante.
   */
  async requestInfo(
    visitRequestId: string,
    dto: VisitDecisionDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.requireDoctorRequest(
        tx,
        visitRequestId,
        actor,
      );
      this.assertOpen(request);
      this.repo.appendRequestEvent(tx, {
        visitRequestId: request.id,
        actionConceptId: PHL.VISIT_ACTION_REQUEST_INFO,
        previousStatusConceptId: request.statusConceptId,
        newStatusConceptId: request.statusConceptId,
        note: dto.note,
        actorUserId: actor.id,
        createdByUserId: actor.id,
      });
      await this.notifyVisitor(
        tx,
        request,
        'PHARMA_LAB_VISIT_INFO_REQUESTED',
        'El doctor solicitó información adicional',
        actor,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_REQUEST_INFO_REQUESTED',
        entity: 'visit_requests',
        entityId: request.id,
        tenantId: request.doctorTenantId,
      });
      return { id: request.id, statusConceptId: request.statusConceptId };
    });
  }

  /**
   * UC-17-15: el doctor propone otro horario.
   *
   * @param visitRequestId - Solicitud.
   * @param dto - Datos validados de la operación.
   * @param actor - Doctor autenticado.
   * @returns Identificador y estado resultante.
   */
  async proposeTime(
    visitRequestId: string,
    dto: ProposeVisitTimeDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.requireDoctorRequest(
        tx,
        visitRequestId,
        actor,
      );
      this.assertOpen(request);
      const proposed = new Date(dto.proposedStartAt);
      await this.agenda.assertSlotAvailable(
        tx,
        request.doctorUserId,
        proposed,
        request.durationMinutes,
        request.modalityConceptId,
        request.id,
      );

      const previous = request.statusConceptId;
      this.assertTransition(previous, PHL.VISIT_RESCHEDULED);
      request.proposedStartAt = proposed;
      request.statusConceptId = PHL.VISIT_RESCHEDULED;
      touch(request, actor.id);

      this.repo.appendRequestEvent(tx, {
        visitRequestId: request.id,
        actionConceptId: PHL.VISIT_ACTION_PROPOSE_TIME,
        previousStatusConceptId: previous,
        newStatusConceptId: request.statusConceptId,
        proposedStartAt: proposed,
        note: dto.note,
        actorUserId: actor.id,
        createdByUserId: actor.id,
      });
      await this.notifyVisitor(
        tx,
        request,
        'PHARMA_LAB_VISIT_TIME_PROPOSED',
        'El doctor propuso otro horario para la visita',
        actor,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_REQUEST_TIME_PROPOSED',
        entity: 'visit_requests',
        entityId: request.id,
        tenantId: request.doctorTenantId,
      });
      return { id: request.id, statusConceptId: request.statusConceptId };
    });
  }

  /**
   * UC-17-16: el visitador reprograma dentro del plazo permitido.
   *
   * @param visitRequestId - Solicitud.
   * @param dto - Datos validados de la operación.
   * @param actor - Visitador autenticado.
   * @returns Identificador y estado resultante.
   * @throws PreconditionFailedException si venció el plazo de reprogramación.
   */
  async reschedule(
    visitRequestId: string,
    dto: RescheduleVisitDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const { visitor } = await this.access.requireOperatingVisitor(tx, actor);
      const request = await this.requireVisitorRequest(
        tx,
        visitRequestId,
        visitor.id,
      );
      this.assertOpen(request);

      const newStart = new Date(dto.requestedStartAt);
      const slot = await this.agenda.assertSlotAvailable(
        tx,
        request.doctorUserId,
        newStart,
        request.durationMinutes,
        request.modalityConceptId,
        request.id,
      );
      this.assertWithinCutoff(request, slot.rescheduleCutoffHours);

      const previous = request.statusConceptId;
      const next = slot.autoConfirm
        ? PHL.VISIT_CONFIRMED
        : PHL.VISIT_PENDING_CONFIRMATION;
      this.assertTransition(previous, next);
      request.requestedStartAt = newStart;
      request.proposedStartAt = undefined;
      request.statusConceptId = next;
      request.confirmedAt = slot.autoConfirm ? new Date() : undefined;
      touch(request, actor.id);

      this.repo.appendRequestEvent(tx, {
        visitRequestId: request.id,
        actionConceptId: PHL.VISIT_RESCHEDULED,
        previousStatusConceptId: previous,
        newStatusConceptId: next,
        proposedStartAt: newStart,
        note: dto.reason,
        actorUserId: actor.id,
        createdByUserId: actor.id,
      });
      this.notifications.notify(
        tx,
        {
          recipientUserId: request.doctorUserId,
          templateCode: 'PHARMA_LAB_VISIT_RESCHEDULED',
          subject: 'Visita médica reprogramada',
          bodyText: `El visitador reprogramó la visita: ${dto.reason}`,
          relatedResourceType: 'visit_request',
          relatedResourceId: request.id,
          tenantId: request.doctorTenantId,
        },
        actor.id,
      );
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_REQUEST_RESCHEDULED',
        entity: 'visit_requests',
        entityId: request.id,
        tenantId: request.doctorTenantId,
      });
      return { id: request.id, statusConceptId: request.statusConceptId };
    });
  }

  /**
   * UC-17-17: cancelación por el visitador o por el doctor.
   *
   * Quién cancela decide el estado final, porque la spec los distingue
   * (5389-5390) y esa distinción es lo que después permite medir a cada parte.
   *
   * @param visitRequestId - Solicitud.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado, visitador o doctor.
   * @returns Identificador y estado resultante.
   */
  async cancel(
    visitRequestId: string,
    dto: CancelVisitDto,
    actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.repo.findRequest(tx, visitRequestId);
      if (!request) {
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          visitRequestId,
        });
      }
      this.assertOpen(request);

      const visitor = await this.visitorsRepo.findVisitorByUser(tx, actor.id);
      const isVisitor = visitor?.id === request.medicalVisitorId;
      const isDoctor = request.doctorUserId === actor.id;
      if (!isVisitor && !isDoctor) {
        throw new ResourceNotFoundException('Solicitud no encontrada', {
          visitRequestId,
        });
      }

      if (isVisitor) {
        const policy = await this.agenda.getPublishedAgenda(
          request.doctorUserId,
        );
        this.assertWithinCutoff(request, policy.rescheduleCutoffHours);
      }

      const previous = request.statusConceptId;
      const next = isVisitor
        ? PHL.VISIT_CANCELLED_BY_VISITOR
        : PHL.VISIT_CANCELLED_BY_DOCTOR;
      this.assertTransition(previous, next);
      request.statusConceptId = next;
      request.closedAt = new Date();
      touch(request, actor.id);

      this.repo.appendRequestEvent(tx, {
        visitRequestId: request.id,
        actionConceptId: next,
        previousStatusConceptId: previous,
        newStatusConceptId: next,
        note: dto.reason,
        actorUserId: actor.id,
        createdByUserId: actor.id,
      });
      if (isVisitor) {
        this.notifications.notify(
          tx,
          {
            recipientUserId: request.doctorUserId,
            templateCode: 'PHARMA_LAB_VISIT_CANCELLED',
            subject: 'Visita médica cancelada',
            bodyText: `El visitador canceló la visita: ${dto.reason}`,
            relatedResourceType: 'visit_request',
            relatedResourceId: request.id,
            tenantId: request.doctorTenantId,
          },
          actor.id,
        );
      } else {
        await this.notifyVisitor(
          tx,
          request,
          'PHARMA_LAB_VISIT_CANCELLED',
          `El doctor canceló la visita: ${dto.reason}`,
          actor,
        );
      }
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: 'VISIT_REQUEST_CANCELLED',
        entity: 'visit_requests',
        entityId: request.id,
        tenantId: request.doctorTenantId,
      });
      return { id: request.id, statusConceptId: request.statusConceptId };
    });
  }

  /**
   * Lista las solicitudes del visitador autenticado.
   *
   * @param actor - Visitador autenticado.
   * @returns Solicitudes de la más reciente a la más antigua.
   */
  async listOwnRequests(actor: AuthenticatedUser): Promise<VisitRequests[]> {
    const visitor = await this.visitorsRepo.findVisitorByUser(
      this.em,
      actor.id,
    );
    if (!visitor) {
      throw new ResourceNotFoundException(
        'La cuenta no corresponde a un visitador médico',
        { userId: actor.id },
      );
    }
    return this.repo.listRequestsByVisitor(this.em, visitor.id);
  }

  /**
   * Lista las solicitudes dirigidas al doctor autenticado.
   *
   * @param actor - Doctor autenticado.
   * @returns Solicitudes de la más reciente a la más antigua.
   */
  listDoctorRequests(actor: AuthenticatedUser): Promise<VisitRequests[]> {
    return this.repo.listRequestsByDoctor(this.em, actor.id);
  }

  /**
   * Lee una solicitud con su temario y su bitácora.
   *
   * @param visitRequestId - Solicitud.
   * @param actor - Usuario autenticado, visitador o doctor de la solicitud.
   * @returns La solicitud, sus temas y sus eventos.
   * @throws ResourceNotFoundException si no existe o el actor no es parte.
   */
  async getRequestDetail(
    visitRequestId: string,
    actor: AuthenticatedUser,
  ): Promise<{
    /** La solicitud. */
    request: VisitRequests;
    /** Productos o temas declarados. */
    topics: VisitRequestTopics[];
    /** Bitácora de transiciones. */
    events: VisitRequestEvents[];
  }> {
    const request = await this.repo.findRequest(this.em, visitRequestId);
    if (!request) {
      throw new ResourceNotFoundException('Solicitud no encontrada', {
        visitRequestId,
      });
    }
    const visitor = await this.visitorsRepo.findVisitorByUser(
      this.em,
      actor.id,
    );
    const isParty =
      request.doctorUserId === actor.id ||
      visitor?.id === request.medicalVisitorId;
    if (!isParty) {
      throw new ResourceNotFoundException('Solicitud no encontrada', {
        visitRequestId,
      });
    }
    return {
      request,
      topics: await this.repo.listTopics(this.em, visitRequestId),
      events: await this.repo.listRequestEvents(this.em, visitRequestId),
    };
  }

  private async transitionByDoctor(
    visitRequestId: string,
    actor: AuthenticatedUser,
    next: string,
    actionConceptId: string,
    note: string | undefined,
    templateCode: string,
    subject: string,
    mutate: (request: VisitRequests) => void,
  ): Promise<TransitionResultDto> {
    return this.em.transactional(async (tx) => {
      const request = await this.requireDoctorRequest(
        tx,
        visitRequestId,
        actor,
      );
      this.assertOpen(request);
      const previous = request.statusConceptId;
      this.assertTransition(previous, next);

      request.statusConceptId = next;
      mutate(request);
      touch(request, actor.id);

      this.repo.appendRequestEvent(tx, {
        visitRequestId: request.id,
        actionConceptId,
        previousStatusConceptId: previous,
        newStatusConceptId: next,
        note,
        actorUserId: actor.id,
        createdByUserId: actor.id,
      });
      await this.notifyVisitor(tx, request, templateCode, subject, actor);
      await tx.flush();

      await this.audit.record(tx, actor, {
        action: `VISIT_REQUEST_${next === PHL.VISIT_CONFIRMED ? 'CONFIRMED' : 'REJECTED'}`,
        entity: 'visit_requests',
        entityId: request.id,
        tenantId: request.doctorTenantId,
      });
      return { id: request.id, statusConceptId: request.statusConceptId };
    });
  }

  private async requireDoctorRequest(
    tx: EntityManager,
    visitRequestId: string,
    actor: AuthenticatedUser,
  ): Promise<VisitRequests> {
    const request = await this.repo.findRequest(tx, visitRequestId);
    if (!request || request.doctorUserId !== actor.id) {
      throw new ResourceNotFoundException('Solicitud no encontrada', {
        visitRequestId,
      });
    }
    return request;
  }

  private async requireVisitorRequest(
    tx: EntityManager,
    visitRequestId: string,
    medicalVisitorId: string,
  ): Promise<VisitRequests> {
    const request = await this.repo.findRequest(tx, visitRequestId);
    if (!request || request.medicalVisitorId !== medicalVisitorId) {
      throw new ResourceNotFoundException('Solicitud no encontrada', {
        visitRequestId,
      });
    }
    return request;
  }

  private assertOpen(request: VisitRequests): void {
    const outgoing = ALLOWED_TRANSITIONS[request.statusConceptId] ?? [];
    if (outgoing.length === 0) {
      throw new ConflictException(
        'La solicitud está en un estado final y ya no admite cambios',
        { visitRequestId: request.id },
      );
    }
  }

  private assertTransition(previous: string, next: string): void {
    const allowed = ALLOWED_TRANSITIONS[previous] ?? [];
    if (!allowed.includes(next)) {
      throw new ConflictException(
        'La transición solicitada no está permitida para el estado actual',
        { previous, next },
      );
    }
  }

  private assertWithinCutoff(
    request: VisitRequests,
    cutoffHours: number,
  ): void {
    const remainingMs = request.requestedStartAt.getTime() - Date.now();
    if (remainingMs < cutoffHours * 3_600_000) {
      throw new PreconditionFailedException(
        `El plazo para reprogramar o cancelar venció (${cutoffHours} horas antes del inicio)`,
        { visitRequestId: request.id },
      );
    }
  }

  private async assertTopicsAuthorized(
    tx: EntityManager,
    medicalVisitorId: string,
    topics: CreateVisitRequestDto['topics'],
  ): Promise<void> {
    const productIds = topics
      .map((topic) => topic.pharmaProductId)
      .filter((id): id is string => Boolean(id));
    if (productIds.length === 0) return;

    const authorized = new Set(
      (
        await this.visitorsRepo.listAuthorizedProducts(tx, medicalVisitorId)
      ).map((row) => row.pharmaProductId),
    );
    const unauthorized = productIds.filter((id) => !authorized.has(id));
    if (unauthorized.length > 0) {
      throw new PreconditionFailedException(
        'El visitador no está autorizado a representar alguno de los productos del temario',
        { medicalVisitorId, pharmaProductIds: unauthorized },
      );
    }

    // Un producto retirado o suspendido no se presenta: la spec prohíbe difundir
    // indicaciones no aprobadas y promocionar usos no autorizados.
    const products = await this.catalog.findProductsByIds(tx, productIds);
    const blocked = products.filter((product) =>
      [PHL.PRODUCT_SUSPENDED, PHL.PRODUCT_WITHDRAWN].includes(
        product.regulatoryStatusConceptId,
      ),
    );
    if (blocked.length > 0) {
      throw new PreconditionFailedException(
        'Alguno de los productos del temario está suspendido o retirado',
        { pharmaProductIds: blocked.map((product) => product.id) },
      );
    }
  }

  private async notifyVisitor(
    tx: EntityManager,
    request: VisitRequests,
    templateCode: string,
    subject: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const visitor = await this.visitorsRepo.findVisitor(
      tx,
      request.medicalVisitorId,
    );
    if (!visitor) return;
    this.notifications.notify(
      tx,
      {
        recipientUserId: visitor.userId,
        templateCode,
        subject,
        bodyText: subject,
        relatedResourceType: 'visit_request',
        relatedResourceId: request.id,
      },
      actor.id,
    );
  }
}
