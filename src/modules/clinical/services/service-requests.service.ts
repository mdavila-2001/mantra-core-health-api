import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import {
  EncountersRepository,
  ServiceRequestsRepository,
} from '../repositories';
import {
  CheckDuplicateStudyDto,
  CreateServiceRequestDto,
  DuplicateStudyCheckResultDto,
  ServiceRequestResponseDto,
} from '../dto';
import { CLIN } from '../clinical.concepts';
import { ClinicalReadService } from './clinical-read.service';
import { ClinicalNotificationsService } from './clinical-notifications.service';
import { OutboxService } from '../../messaging/services';
import {
  DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS,
  DuplicateStudyDetector,
} from './duplicate-study-detector';
import { DiagnosticStudyOfferings } from '../../diagnostic_units/entities';

/**
 * Cómo trata `create` la regla de antiduplicación cuando el llamador no es la
 * ficha del paciente. Es una opción interna, no un campo del contrato HTTP:
 * quien la usa asume la responsabilidad de justificar por qué no aplica.
 */
export interface CreateServiceRequestOptions {
  /**
   * `'enforce'` (default): re-corre el detector con la ventana por defecto y
   * exige una decisión ante un duplicado. `'skip'`: no lo consulta — para
   * callers internos que no pueden expresar la decisión del prompt, como
   * `PeriopPreopService` (la orden preoperatoria se justifica por el caso).
   */
  duplicatePolicy?: 'enforce' | 'skip';
}

/** UC-08-05: creación de órdenes de servicio (service_request) en estado activo. */
@Injectable()
export class ServiceRequestsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param serviceRequestsRepo - Valor de service requests repo requerido por la operación.
   * @param encountersRepo - Valor de encounters repo requerido por la operación.
   * @param clinicalRead - Gate de autorización clínica (antiduplicación: PHI cruzada).
   * @param duplicateStudyDetector - Motor de antiduplicación de estudios (T-26).
   * @param logger - Valor de logger requerido por la operación.
   * @param outbox - Publicación transaccional del hecho (MCH-027).
   * @param clinicalNotifications - Aviso in-app al paciente (MCH-027).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly serviceRequestsRepo: ServiceRequestsRepository,
    private readonly encountersRepo: EncountersRepository,
    private readonly clinicalRead: ClinicalReadService,
    private readonly duplicateStudyDetector: DuplicateStudyDetector,
    private readonly logger: PinoLogger,
    private readonly outbox: OutboxService,
    private readonly clinicalNotifications: ClinicalNotificationsService,
  ) {
    this.logger.setContext(ServiceRequestsService.name);
  }

  /**
   * Antiduplicación de estudios (T-26, subtarea 3.2): pre-valida si el
   * paciente ya se hizo este estudio dentro de la ventana, en cualquier
   * organización.
   *
   * Dos gates antes de tocar el motor: la relación asistencial con el
   * paciente (mismo umbral que la historia clínica: `assertPuedeLeerHistoria`)
   * y que el encuentro sea del paciente y del tenant activo — el chequeo cruza
   * organizaciones y devuelve PHI, así que el encuentro solo no alcanza como
   * prueba.
   */
  async checkDuplicate(
    dto: CheckDuplicateStudyDto,
    actor: AuthenticatedUser,
  ): Promise<DuplicateStudyCheckResultDto> {
    const tenantId = requireTenantId();
    await this.clinicalRead.assertPuedeLeerHistoria(
      dto.patientProfileId,
      actor,
    );

    const em = this.em.fork();
    const encounter = await this.encountersRepo.findById(em, dto.encounterId);
    if (
      !encounter ||
      encounter.patientProfileId !== dto.patientProfileId ||
      encounter.tenantId !== tenantId
    ) {
      throw new ResourceNotFoundException('Encuentro no encontrado', {
        encounterId: dto.encounterId,
      });
    }

    const codeConceptId = await this.resolveCodeConceptId(em, dto);
    const windowDays = dto.windowDays ?? DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS;
    const now = new Date();

    const [match, pendingReport] = await Promise.all([
      this.duplicateStudyDetector.findDuplicate(
        em,
        dto.patientProfileId,
        codeConceptId,
        windowDays,
        now,
      ),
      this.duplicateStudyDetector.findPendingReport(
        em,
        dto.patientProfileId,
        codeConceptId,
        windowDays,
        now,
      ),
    ]);

    if (!match) {
      return {
        isDuplicate: false,
        previousStudy: null,
        warningMessage: null,
        requiresJustification: false,
        pendingReport,
        windowDays,
      };
    }

    const previousStudy = await this.duplicateStudyDetector.describe(
      em,
      match,
      tenantId,
      now,
      true,
    );

    return {
      isDuplicate: true,
      previousStudy,
      warningMessage:
        this.duplicateStudyDetector.warningMessageFor(previousStudy),
      requiresJustification: true,
      pendingReport,
      windowDays,
    };
  }

  /** UC-08-05: registra una orden de servicio con intención de orden. */
  async create(
    dto: CreateServiceRequestDto,
    actor: AuthenticatedUser,
    options: CreateServiceRequestOptions = {},
  ): Promise<ServiceRequestResponseDto> {
    this.logger.info(
      {
        operation: 'clinical.service-request.create',
        patientProfileId: dto.patientProfileId,
      },
      'Placing service request',
    );
    return this.em.transactional(async (tx) => {
      if (dto.encounterId) {
        const encounter = await this.encountersRepo.findById(
          tx,
          dto.encounterId,
        );
        if (!encounter) {
          throw new ResourceNotFoundException('Encuentro no encontrado', {
            encounterId: dto.encounterId,
          });
        }
      }

      const decision = await this.resolveDuplicateDecision(tx, dto, options);

      const sr = this.serviceRequestsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        codeConceptId: dto.codeConceptId,
        categoryConceptId: dto.categoryConceptId,
        intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
        priorityConceptId: dto.priorityConceptId,
        statusConceptId: decision.statusConceptId,
        requesterProfileId: dto.requesterProfileId,
        performerTenantId: dto.performerTenantId,
        previousDiagnosticReportId: decision.previousDiagnosticReportId,
        duplicateOverrideReason: decision.duplicateOverrideReason,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'clinical.service-request.create',
          serviceRequestId: sr.id,
        },
        'Service request placed',
      );
      if (decision.previousDiagnosticReportId) {
        // Sin la justificación: es texto clínico y este log no es su lugar.
        this.logger.info(
          {
            operation: 'clinical.service-request.duplicate-decision',
            serviceRequestId: sr.id,
            previousDiagnosticReportId: decision.previousDiagnosticReportId,
            reused: decision.duplicateOverrideReason === undefined,
          },
          'Duplicate study decision recorded',
        );
      }

      // MCH-027: el hecho, durable y atómico con la orden. Un rollback se
      // lleva el evento; la clave de idempotencia derivada del payload impide
      // publicarlo dos veces. Sólo ids: ni el estudio ni el paciente viajan
      // en el outbox.
      await this.outbox.publishDomainEvent(tx, {
        tenantId: sr.custodianTenantId,
        eventType: 'ServiceRequestPlaced',
        aggregateType: 'clinical.service_requests',
        aggregateId: sr.id,
        payloadJson: {
          serviceRequestId: sr.id,
          statusConceptId: sr.statusConceptId,
        },
        actorUserId: actor.id,
      });
      await tx.flush();

      // Y la campana del paciente, dentro de la transacción (ver
      // `ClinicalNotificationsService.serviceRequestPlaced`). Una orden que se
      // resolvió reutilizando un informe previo no le pide nada al paciente:
      // no se avisa.
      if (sr.statusConceptId === CLIN.SERVICE_REQUEST_ACTIVE) {
        await this.clinicalNotifications.serviceRequestPlaced(
          sr.id,
          sr.patientProfileId,
          actor.id,
        );
      }

      return {
        id: sr.id,
        patientProfileId: sr.patientProfileId,
        status: sr.statusConceptId,
        intent: sr.intentConceptId ?? CLIN.SERVICE_REQUEST_INTENT_ORDER,
        createdAt: sr.createdAt,
      };
    });
  }

  /**
   * Corre la regla de antiduplicación dentro de la transacción del alta y
   * decide con qué estado y enlace nace la orden.
   *
   * La UI no es la barrera: aunque el front ya haya mostrado el diálogo, este
   * método vuelve a consultar el detector con la ventana por defecto (no la
   * del chequeo, que puede haber sido otra) y rechaza cualquier incoherencia.
   */
  private async resolveDuplicateDecision(
    tx: EntityManager,
    dto: CreateServiceRequestDto,
    options: CreateServiceRequestOptions,
  ): Promise<{
    statusConceptId: string;
    previousDiagnosticReportId?: string;
    duplicateOverrideReason?: string;
  }> {
    if (options.duplicatePolicy === 'skip') {
      return { statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE };
    }

    const match = await this.duplicateStudyDetector.findDuplicate(
      tx,
      dto.patientProfileId,
      dto.codeConceptId,
      DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS,
      new Date(),
    );

    if (match) {
      if (!dto.previousDiagnosticReportId) {
        const tenantId = requireTenantId();
        const previousStudy = await this.duplicateStudyDetector.describe(
          tx,
          match,
          tenantId,
          new Date(),
          true,
        );
        throw new PreconditionFailedException(
          'El paciente ya tiene este estudio dentro de la ventana; hace falta reutilizar el informe o justificar la repetición',
          { reason: 'DUPLICATE_STUDY_DETECTED', previousStudy },
        );
      }
      if (dto.previousDiagnosticReportId !== match.report.id) {
        throw new PreconditionFailedException(
          'El informe previo indicado no coincide con el duplicado detectado',
          { reason: 'DUPLICATE_STUDY_MISMATCH' },
        );
      }
      const reused = dto.reusePreviousReport === true;
      return {
        statusConceptId: reused
          ? CLIN.SERVICE_REQUEST_SATISFIED_BY_PRIOR
          : CLIN.SERVICE_REQUEST_ACTIVE,
        previousDiagnosticReportId: dto.previousDiagnosticReportId,
        duplicateOverrideReason: reused
          ? undefined
          : dto.duplicateOverrideReason,
      };
    }

    if (dto.previousDiagnosticReportId) {
      throw new PreconditionFailedException(
        'No se detectó ningún estudio duplicado para justificar',
        { reason: 'DUPLICATE_STUDY_NOT_FOUND' },
      );
    }

    return { statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE };
  }

  /** El `code_concept_id` a chequear: directo, o resuelto desde la oferta del centro. */
  private async resolveCodeConceptId(
    em: EntityManager,
    dto: CheckDuplicateStudyDto,
  ): Promise<string> {
    if (dto.codeConceptId) return dto.codeConceptId;
    const offering = await em.findOne(DiagnosticStudyOfferings, {
      id: dto.diagnosticStudyOfferingId,
    });
    if (!offering) {
      throw new ResourceNotFoundException('Oferta de estudio no encontrada', {
        diagnosticStudyOfferingId: dto.diagnosticStudyOfferingId,
      });
    }
    return offering.studyConceptId;
  }
}
