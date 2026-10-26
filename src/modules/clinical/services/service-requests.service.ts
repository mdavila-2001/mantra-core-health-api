import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { ClinicalErrorReason } from '../clinical.error-reasons';
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
// P43: la orden puede declarar de qué formulario médico cerrado sale.
import { FormInstanceOriginValidator } from '../../forms/services/form-instance-origin.validator';
import { PerformerSelectionValidator } from './performer-selection.validator';
import { SuggestedSiteNamesReader } from './suggested-site-names.reader';
import { ServiceRequestNotesService } from './service-request-notes.service';
import {
  analysisCategoryOf,
  categoryConceptIdFor,
} from '../service-request-category';

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
   * @param formOrigin - Valida la instancia de formulario de origen (P43).
   * @param performerSelection - Reglas del modo de ejecutor (centros médicos).
   * @param siteNames - Nombre de la sede sugerida, para el paciente.
   * @param basedOnNotes - Notas que motivan la orden (P40).
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
    private readonly formOrigin: FormInstanceOriginValidator,
    private readonly performerSelection: PerformerSelectionValidator,
    private readonly siteNames: SuggestedSiteNamesReader,
    private readonly basedOnNotes: ServiceRequestNotesService,
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
    await this.clinicalRead.assertCanReadHistory(dto.patientProfileId, actor);

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
      // Sin informe, ¿hay una orden activa del mismo estudio esperando
      // realizarse? Pedirlo otra vez es el mismo duplicado.
      const activa =
        await this.duplicateStudyDetector.findActiveOrderWithoutReport(
          em,
          dto.patientProfileId,
          codeConceptId,
          windowDays,
          tenantId,
          now,
        );
      if (activa) {
        return {
          isDuplicate: true,
          previousStudy: activa,
          warningMessage: this.duplicateStudyDetector.warningMessageFor(activa),
          requiresJustification: true,
          pendingReport: true,
          windowDays,
        };
      }
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

  /**
   * MCH-008.2: el encuentro tiene que ser del mismo paciente y del mismo
   * custodio que la orden, no sólo existir.
   *
   * Antes se comprobaba únicamente la existencia del id: una orden del
   * paciente A podía colgar del encuentro de B, o de otro tenant, y la FK lo
   * aceptaba porque sólo demuestra existencia. El custodio que se compara es
   * `dto.custodianTenantId`, que el interceptor de tenant ya obligó a ser el
   * tenant activo del actor.
   *
   * Una referencia incoherente responde 404, igual que una inexistente —el
   * mismo criterio que `ObservationsService.assertReferencesBelongToPatient`
   * y que `checkDuplicate`—: distinguirlas le diría al cliente que ese id
   * existe en otra historia u otro tenant.
   */
  private async assertEncounterBelongsToPatient(
    tx: EntityManager,
    dto: CreateServiceRequestDto,
  ): Promise<void> {
    if (!dto.encounterId) return;
    const encounter = await this.encountersRepo.findById(tx, dto.encounterId);
    if (
      !encounter ||
      encounter.patientProfileId !== dto.patientProfileId ||
      encounter.tenantId !== dto.custodianTenantId
    ) {
      throw new ResourceNotFoundException(
        'Encuentro no encontrado',
        { encounterId: dto.encounterId },
        ClinicalErrorReason.ENCOUNTER_NOT_FOUND,
      );
    }
  }

  /**
   * P40: el `category_concept_id` que se guarda. El texto (`category`) se
   * resuelve a su concepto; si viaja con `categoryConceptId`, tienen que
   * coincidir —un concepto que el texto no nombra (p. ej. procedimiento) es
   * `OTHER`—, y en ese caso se guarda el concepto, que es el más preciso.
   */
  private resolveCategoryConceptId(
    dto: CreateServiceRequestDto,
  ): string | undefined {
    if (dto.category === undefined) return dto.categoryConceptId;
    if (dto.categoryConceptId === undefined) {
      return categoryConceptIdFor(dto.category);
    }
    if (analysisCategoryOf(dto.categoryConceptId) !== dto.category) {
      throw new PreconditionFailedException(
        'La categoría indicada no corresponde al concepto de categoría',
        {
          category: dto.category,
          categoryConceptId: dto.categoryConceptId,
        },
        ClinicalErrorReason.SERVICE_REQUEST_CATEGORY_MISMATCH,
      );
    }
    return dto.categoryConceptId;
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
    const categoryConceptId = this.resolveCategoryConceptId(dto);
    const basedOnNoteIds = dto.basedOnNoteIds ?? [];
    return this.em.transactional(async (tx) => {
      await this.assertEncounterBelongsToPatient(tx, dto);
      // P40: las notas citadas, del mismo paciente y encuentro; 422 antes de escribir.
      if (basedOnNoteIds.length > 0) {
        await this.basedOnNotes.assertUsable(
          tx,
          basedOnNoteIds,
          dto.patientProfileId,
          dto.encounterId,
        );
      }
      // P43: sólo si viaja; 422 antes de escribir nada.
      if (dto.formInstanceId !== undefined) {
        await this.formOrigin.assertUsableOrigin(
          tx,
          dto.formInstanceId,
          dto.encounterId,
        );
      }

      // La recomendación de ejecutor se valida antes de escribir nada: 422 si el
      // modo no es coherente. No toca `performerTenantId` (ver más abajo).
      const performer = await this.performerSelection.resolve(tx, {
        procedureConceptId: dto.codeConceptId,
        performerSelectionConceptId: dto.performerSelectionConceptId,
        performerPractitionerProfileId: dto.performerPractitionerProfileId,
        suggestedPracticeSiteId: dto.suggestedPracticeSiteId,
        requesterProfileId:
          dto.requesterProfileId ?? actor.practitionerProfileId,
      });

      const decision = await this.resolveDuplicateDecision(tx, dto, options);

      const sr = this.serviceRequestsRepo.create(tx, {
        custodianTenantId: dto.custodianTenantId,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        formInstanceId: dto.formInstanceId,
        codeConceptId: dto.codeConceptId,
        categoryConceptId,
        intentConceptId: CLIN.SERVICE_REQUEST_INTENT_ORDER,
        priorityConceptId: dto.priorityConceptId,
        statusConceptId: decision.statusConceptId,
        requesterProfileId: dto.requesterProfileId,
        // Tal como llegó: la sugerencia de una sede NO le da a su organización
        // acceso a la orden (RN-11); solo `performerTenantId` lo concede.
        performerTenantId: dto.performerTenantId,
        performerSelectionConceptId: performer.performerSelectionConceptId,
        performerPractitionerProfileId:
          performer.performerPractitionerProfileId ?? undefined,
        suggestedPracticeSiteId: performer.suggestedPracticeSiteId ?? undefined,
        previousDiagnosticReportId: decision.previousDiagnosticReportId,
        duplicateOverrideReason: decision.duplicateOverrideReason,
        actorUserId: actor.id,
      });
      await tx.flush();
      // Después del flush de la orden: el vínculo no es una relación del ORM,
      // así que el orden de los INSERT no lo garantiza la unidad de trabajo.
      if (basedOnNoteIds.length > 0) {
        this.basedOnNotes.link(tx, sr.id, basedOnNoteIds, actor.id);
        await tx.flush();
      }

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
        formInstanceId: sr.formInstanceId ?? null,
        category: analysisCategoryOf(sr.categoryConceptId),
        basedOnNoteIds: [...basedOnNoteIds],
        status: sr.statusConceptId,
        intent: sr.intentConceptId ?? CLIN.SERVICE_REQUEST_INTENT_ORDER,
        performerSelectionConceptId: performer.performerSelectionConceptId,
        performerPractitionerProfileId:
          performer.performerPractitionerProfileId,
        suggestedPracticeSiteId: performer.suggestedPracticeSiteId,
        suggestedPracticeSiteName: performer.suggestedPracticeSiteId
          ? ((
              await this.siteNames.namesFor(tx, [
                performer.suggestedPracticeSiteId,
              ])
            ).get(performer.suggestedPracticeSiteId) ?? null)
          : null,
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

    // Sin informe previo, una orden activa del mismo estudio también es
    // duplicado. No hay informe que reutilizar ni al que enlazar: sólo se puede
    // repetir con justificación. La columna `duplicate_override_reason` exige
    // `previous_diagnostic_report_id` (CHECK), así que la justificación se
    // valida (mín. 20 caracteres, en el DTO) y se registra la decisión en el
    // log, pero no se persiste en la orden.
    if (!dto.previousDiagnosticReportId) {
      const activa =
        await this.duplicateStudyDetector.findActiveOrderWithoutReport(
          tx,
          dto.patientProfileId,
          dto.codeConceptId,
          DEFAULT_DUPLICATE_STUDY_WINDOW_DAYS,
          dto.custodianTenantId,
          new Date(),
        );
      if (activa) {
        if (
          dto.reusePreviousReport === true ||
          dto.duplicateOverrideReason === undefined
        ) {
          throw new PreconditionFailedException(
            'El paciente ya tiene una orden activa de este estudio, sin informe; hace falta justificar la repetición',
            { reason: 'DUPLICATE_STUDY_DETECTED', previousStudy: activa },
          );
        }
        this.logger.info(
          {
            operation: 'clinical.service-request.duplicate-decision',
            previousServiceRequestId: activa.serviceRequestId,
            reused: false,
          },
          'Duplicate active order repeated with justification',
        );
        return { statusConceptId: CLIN.SERVICE_REQUEST_ACTIVE };
      }
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
