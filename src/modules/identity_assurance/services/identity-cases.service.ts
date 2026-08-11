import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { IDA } from '../identity_assurance.concepts';
import {
  IdentityVerificationCasesRepository,
  IdentityVerificationPoliciesRepository,
  IdentityEvidenceRecordsRepository,
  IdentityChecksRepository,
  IdentityFraudSignalsRepository,
  IdentityManualReviewCasesRepository,
  IdentityAssertionsRepository,
} from '../repositories';
import {
  OpenCaseDto,
  SubmitEvidenceDto,
  PlanChecksDto,
  RaiseFraudSignalDto,
  OpenManualReviewDto,
  IssueAssertionDto,
  CaseResponseDto,
  EvidenceResponseDto,
  ChecksPlannedResponseDto,
  FraudSignalResponseDto,
  ManualReviewResponseDto,
  AssertionResponseDto,
  ExpireSweepResponseDto,
  CaseQueueResponseDto,
} from '../dto';

const MS_PER_HOUR = 3_600_000;
/** Cuántos casos devuelve la cola de revisión si no se pide otra cosa. */
const DEFAULT_QUEUE_SIZE = 50;
/**
 * Estados en los que un caso está esperando que una persona lo mire.
 *
 * `CASE_OPEN` queda afuera a propósito: es el instante entre crear el caso y
 * planificar sus checks, y un caso ahí todavía no tiene nada que revisar.
 */
const AWAITING_REVIEW_STATES = [
  IDA.CASE_IN_VERIFICATION,
  IDA.CASE_AT_RISK,
  IDA.CASE_MANUAL_REVIEW,
];
/** Estados abiertos que un barrido puede expirar (UC-27-12). */
const OPEN_CASE_STATES = [
  IDA.CASE_OPEN,
  IDA.CASE_IN_VERIFICATION,
  IDA.CASE_AT_RISK,
  IDA.CASE_MANUAL_REVIEW,
];
/** Estados de check que se cancelan al expirar el caso. */
const CANCELLABLE_CHECK_STATES = [IDA.CHECK_PENDING, IDA.CHECK_IN_PROGRESS];

/**
 * Casos de uso centrados en el agregado `identity_verification_cases`: apertura
 * (UC-27-02), evidencia (UC-27-03), planificación de checks (UC-27-04), señales
 * de fraude (UC-27-07), escalado a revisión manual (UC-27-08), emisión de
 * aserción (UC-27-10) y barrido de expiración (UC-27-12).
 *
 * El servicio posee la unidad de trabajo: `em.transactional` y `flush` del padre
 * antes de crear hijos (las FK son columnas uuid, MikroORM no ordena inserts).
 */
@Injectable()
export class IdentityCasesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param casesRepo - Valor de cases repo requerido por la operación.
   * @param policiesRepo - Valor de policies repo requerido por la operación.
   * @param evidenceRepo - Valor de evidence repo requerido por la operación.
   * @param checksRepo - Valor de checks repo requerido por la operación.
   * @param fraudRepo - Valor de fraud repo requerido por la operación.
   * @param reviewRepo - Valor de review repo requerido por la operación.
   * @param assertionsRepo - Valor de assertions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly casesRepo: IdentityVerificationCasesRepository,
    private readonly policiesRepo: IdentityVerificationPoliciesRepository,
    private readonly evidenceRepo: IdentityEvidenceRecordsRepository,
    private readonly checksRepo: IdentityChecksRepository,
    private readonly fraudRepo: IdentityFraudSignalsRepository,
    private readonly reviewRepo: IdentityManualReviewCasesRepository,
    private readonly assertionsRepo: IdentityAssertionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IdentityCasesService.name);
  }

  /**
   * Cola de revisión: los casos que esperan una decisión, el más viejo primero.
   *
   * Es la lectura que le faltaba a la superficie administrativa. Sin ella, un
   * revisor sólo puede actuar sobre un caso cuyo id ya conoce, y el caso que
   * abre un solicitante por autoservicio no llega por ningún lado.
   *
   * > [!warning] El alcance de esta lectura lo da el rol, no el dato.
   * > `identity_verification_cases` no tiene `tenant_id`, así que el RLS por
   * > `app.current_tenant_id` no la alcanza: cubre las tablas que sí tienen esa
   * > columna. Un `SECURITY_ADMIN` ve por acá los casos de todos los tenants.
   * > Acotarlo de verdad exige `tenant_id` en la tabla —cambio de modelo, con
   * > sus cuatro capas— o derivar el tenant del sujeto por join. Hasta
   * > entonces, no ampliar los roles de este endpoint.
   *
   * @param status - Estado concreto a listar; por defecto, los que esperan revisión.
   * @param limit - Tope de resultados.
   * @returns Los casos en cola, ordenados por antigüedad.
   */
  async listQueue(
    status?: string,
    limit?: number,
  ): Promise<CaseQueueResponseDto> {
    const em = this.em.fork();
    const cases = await this.casesRepo.findByStatuses(
      em,
      status ? [status] : AWAITING_REVIEW_STATES,
      limit ?? DEFAULT_QUEUE_SIZE,
    );
    return {
      cases: cases.map((kase) => ({
        id: kase.id,
        status: kase.statusConceptId,
        subjectTypeConceptId: kase.subjectTypeConceptId,
        subjectEntityId: kase.subjectEntityId,
        identityVerificationPolicyId: kase.identityVerificationPolicyId,
        riskScore: kase.riskScore,
        openedAt: kase.openedAt,
        expiresAt: kase.expiresAt,
      })),
    };
  }

  /** UC-27-02: abre un caso aplicando el nivel de aseguramiento de la política. */
  async openCase(
    dto: OpenCaseDto,
    actor: AuthenticatedUser,
  ): Promise<CaseResponseDto> {
    this.logger.info(
      { operation: 'ida.case.open', actorId: actor.id },
      'Opening verification case',
    );
    return this.em.transactional(async (tx) => {
      const policy = await this.policiesRepo.findById(
        tx,
        dto.identityVerificationPolicyId,
      );
      if (!policy) {
        throw new ResourceNotFoundException(
          'Política de verificación no encontrada',
          {
            policyId: dto.identityVerificationPolicyId,
          },
        );
      }

      const now = new Date();
      const kase = this.casesRepo.create(tx, {
        subjectTypeConceptId: dto.subjectTypeConceptId,
        subjectEntityId: dto.subjectEntityId,
        identityVerificationPolicyId: policy.id,
        requestedAssuranceLevelConceptId:
          dto.requestedAssuranceLevelConceptId ??
          policy.requiredIdentityAssuranceLevelConceptId,
        statusConceptId: IDA.CASE_OPEN,
        riskScore: '0',
        openedAt: now,
        expiresAt: new Date(
          now.getTime() + (dto.expiresInHours ?? 72) * MS_PER_HOUR,
        ),
        correlationId: dto.correlationId,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: kase.id,
        status: kase.statusConceptId,
        openedAt: kase.openedAt,
        expiresAt: kase.expiresAt,
      };
    });
  }

  /** UC-27-03: aporta evidencia documental bajo consentimiento. */
  async submitEvidence(
    caseId: string,
    dto: SubmitEvidenceDto,
    actor: AuthenticatedUser,
  ): Promise<EvidenceResponseDto> {
    this.logger.info(
      { operation: 'ida.case.evidence', actorId: actor.id, caseId },
      'Submitting evidence',
    );
    return this.em.transactional(async (tx) => {
      const kase = await this.loadCase(tx, caseId);
      if (
        kase.statusConceptId !== IDA.CASE_OPEN &&
        kase.statusConceptId !== IDA.CASE_IN_VERIFICATION
      ) {
        throw new PreconditionFailedException(
          'El caso no admite evidencia en su estado actual',
          {
            caseId,
            status: kase.statusConceptId,
          },
        );
      }

      const evidence = this.evidenceRepo.create(tx, {
        identityVerificationCaseId: kase.id,
        evidenceTypeConceptId: dto.evidenceTypeConceptId,
        issuerAuthorityId: dto.issuerAuthorityId,
        evidenceIdentifierHash: dto.evidenceIdentifierHash,
        evidenceFileId: dto.evidenceFileId,
        encryptedEvidenceReference: dto.encryptedEvidenceReference,
        evidenceQualityConceptId: dto.evidenceQualityConceptId,
        collectedUnderConsentId: dto.collectedUnderConsentId,
        verificationStatusConceptId: IDA.EVIDENCE_PENDING,
        actorUserId: actor.id,
      });
      touch(kase, actor.id);
      await tx.flush();
      return {
        id: evidence.id,
        verificationStatus: evidence.verificationStatusConceptId,
        createdAt: evidence.createdAt,
      };
    });
  }

  /** UC-27-04: planifica los checks requeridos y pasa el caso a en_verificacion. */
  async planChecks(
    caseId: string,
    dto: PlanChecksDto,
    actor: AuthenticatedUser,
  ): Promise<ChecksPlannedResponseDto> {
    this.logger.info(
      { operation: 'ida.case.plan', actorId: actor.id, caseId },
      'Planning checks',
    );
    return this.em.transactional(async (tx) => {
      const kase = await this.loadCase(tx, caseId);
      if (kase.statusConceptId !== IDA.CASE_OPEN) {
        throw new PreconditionFailedException(
          'Solo un caso abierto puede planificar checks',
          {
            caseId,
            status: kase.statusConceptId,
          },
        );
      }

      const checkIds: string[] = [];
      dto.checks.forEach((item, idx) => {
        const check = this.checksRepo.create(tx, {
          identityVerificationCaseId: kase.id,
          checkTypeConceptId: item.checkTypeConceptId,
          authorityId: item.authorityId,
          required: item.required ?? true,
          checkSequence: idx + 1,
          statusConceptId: IDA.CHECK_PENDING,
          actorUserId: actor.id,
        });
        checkIds.push(check.id);
      });

      kase.statusConceptId = IDA.CASE_IN_VERIFICATION;
      touch(kase, actor.id);
      await tx.flush();
      return { caseId: kase.id, checkIds, caseStatus: kase.statusConceptId };
    });
  }

  /** UC-27-07: registra una señal de fraude y recalcula el riesgo del caso. */
  async raiseFraudSignal(
    caseId: string,
    dto: RaiseFraudSignalDto,
    actor: AuthenticatedUser,
  ): Promise<FraudSignalResponseDto> {
    this.logger.info(
      { operation: 'ida.case.fraud', actorId: actor.id, caseId },
      'Raising fraud signal',
    );
    return this.em.transactional(async (tx) => {
      const kase = await this.loadCase(tx, caseId);

      const signal = this.fraudRepo.create(tx, {
        identityVerificationCaseId: kase.id,
        signalTypeConceptId: dto.signalTypeConceptId,
        severityConceptId: dto.severityConceptId,
        confidenceScore: dto.confidenceScore,
        sourceConceptId: dto.sourceConceptId,
        evidenceReference: dto.evidenceReference,
        resolutionConceptId: IDA.FRAUD_OPEN,
      });

      const bump = dto.confidenceScore
        ? Number.parseFloat(dto.confidenceScore)
        : 0.5;
      kase.riskScore = String(
        Number.parseFloat(kase.riskScore ?? '0') +
          (Number.isFinite(bump) ? bump : 0.5),
      );
      if (
        kase.statusConceptId === IDA.CASE_OPEN ||
        kase.statusConceptId === IDA.CASE_IN_VERIFICATION ||
        kase.statusConceptId === IDA.CASE_AT_RISK
      ) {
        kase.statusConceptId = IDA.CASE_AT_RISK;
      }
      touch(kase, actor.id);
      await tx.flush();
      return {
        id: signal.id,
        resolution: signal.resolutionConceptId,
        caseStatus: kase.statusConceptId,
      };
    });
  }

  /** UC-27-08: escala el caso a revisión manual (extiende UC-27-07). */
  async openManualReview(
    caseId: string,
    dto: OpenManualReviewDto,
    actor: AuthenticatedUser,
  ): Promise<ManualReviewResponseDto> {
    this.logger.info(
      { operation: 'ida.case.review.open', actorId: actor.id, caseId },
      'Opening manual review',
    );
    return this.em.transactional(async (tx) => {
      const kase = await this.loadCase(tx, caseId);
      if (
        kase.statusConceptId !== IDA.CASE_IN_VERIFICATION &&
        kase.statusConceptId !== IDA.CASE_AT_RISK
      ) {
        throw new PreconditionFailedException(
          'El caso no es escalable a revisión manual',
          {
            caseId,
            status: kase.statusConceptId,
          },
        );
      }
      const openReviews = await this.reviewRepo.countOpenByCase(
        tx,
        kase.id,
        IDA.REVIEW_OPEN,
      );
      if (openReviews > 0) {
        throw new ConflictException(
          'El caso ya tiene una revisión manual abierta',
          { caseId },
        );
      }

      const review = this.reviewRepo.create(tx, {
        identityVerificationCaseId: kase.id,
        reviewReasonConceptId: dto.reviewReasonConceptId,
        assignedToUserId: dto.assignedToUserId ?? actor.id,
        statusConceptId: IDA.REVIEW_OPEN,
        openedAt: new Date(),
        actorUserId: actor.id,
      });
      kase.statusConceptId = IDA.CASE_MANUAL_REVIEW;
      touch(kase, actor.id);
      await tx.flush();
      return {
        id: review.id,
        status: review.statusConceptId,
        caseStatus: kase.statusConceptId,
      };
    });
  }

  /** UC-27-10: emite una aserción de identidad si el caso está verificado. */
  async issueAssertion(
    caseId: string,
    dto: IssueAssertionDto,
    actor: AuthenticatedUser,
  ): Promise<AssertionResponseDto> {
    this.logger.info(
      { operation: 'ida.case.assert', actorId: actor.id, caseId },
      'Issuing identity assertion',
    );
    return this.em.transactional(async (tx) => {
      const kase = await this.loadCase(tx, caseId);
      if (kase.statusConceptId !== IDA.CASE_VERIFIED) {
        throw new PreconditionFailedException(
          'Solo un caso verificado puede emitir una aserción',
          {
            caseId,
            status: kase.statusConceptId,
          },
        );
      }
      const completed = await this.checksRepo.countByCaseAndStatus(
        tx,
        kase.id,
        IDA.CHECK_COMPLETED,
      );
      if (completed < 1) {
        throw new PreconditionFailedException(
          'No hay checks completados que sustenten la aserción',
          {
            caseId,
          },
        );
      }
      const assuranceLevel =
        dto.assuranceLevelConceptId ?? kase.requestedAssuranceLevelConceptId;
      if (!assuranceLevel) {
        throw new PreconditionFailedException(
          'No se pudo determinar el nivel de aseguramiento',
          { caseId },
        );
      }

      const now = new Date();
      const assertion = this.assertionsRepo.create(tx, {
        identityVerificationCaseId: kase.id,
        issuerIdentityAuthorityId: dto.issuerIdentityAuthorityId,
        subjectTypeConceptId: kase.subjectTypeConceptId,
        subjectEntityId: kase.subjectEntityId,
        assertionTypeConceptId:
          dto.assertionTypeConceptId ?? IDA.ASSERTION_IDENTITY,
        assuranceLevelConceptId: assuranceLevel,
        assertionIdentifier: `IDA-ASSERT-${randomUUID()}`,
        assertionHash: randomUUID().replace(/-/g, ''),
        issuedAt: now,
        expiresAt: new Date(
          now.getTime() + (dto.expiresInHours ?? 8760) * MS_PER_HOUR,
        ),
      });
      kase.statusConceptId = IDA.CASE_ASSERTED;
      kase.completedAt = now;
      touch(kase, actor.id);
      await tx.flush();
      return {
        id: assertion.id,
        assertionIdentifier: assertion.assertionIdentifier,
        assuranceLevel: assertion.assuranceLevelConceptId,
        issuedAt: assertion.issuedAt,
        caseStatus: kase.statusConceptId,
      };
    });
  }

  /** UC-27-12: barrido programado que expira los casos vencidos por lote. */
  async expireSweep(actor: AuthenticatedUser): Promise<ExpireSweepResponseDto> {
    this.logger.info(
      { operation: 'ida.case.expire-sweep', actorId: actor.id },
      'Running expiration sweep',
    );
    return this.em.transactional(async (tx) => {
      const now = new Date();
      const expirable = await this.casesRepo.findExpirable(
        tx,
        OPEN_CASE_STATES,
        now,
      );
      const caseIds: string[] = [];
      for (const kase of expirable) {
        kase.statusConceptId = IDA.CASE_EXPIRED;
        touch(kase, actor.id);
        const pending = await this.checksRepo.findPendingByCase(
          tx,
          kase.id,
          CANCELLABLE_CHECK_STATES,
        );
        for (const check of pending) {
          check.statusConceptId = IDA.CHECK_CANCELLED;
          touch(check, actor.id);
        }
        caseIds.push(kase.id);
      }
      await tx.flush();
      return { expiredCount: caseIds.length, caseIds };
    });
  }

  /**
   * Obtiene load case.
   *
   * @param tx - Contexto de persistencia o transacción activa.
   * @param caseId - Identificador de case.
   * @returns Resultado de load case.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  private async loadCase(tx: EntityManager, caseId: string) {
    const kase = await this.casesRepo.findById(tx, caseId);
    if (!kase)
      throw new ResourceNotFoundException(
        'Caso de verificación no encontrado',
        { caseId },
      );
    return kase;
  }
}
