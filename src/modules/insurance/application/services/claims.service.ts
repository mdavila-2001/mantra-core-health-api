import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  getCurrentTenantId,
  PreconditionFailedException,
  requireTenantId,
  ResourceNotFoundException,
  sumarDecimales,
  mismosDecimales,
  touch,
  type AuthenticatedUser,
} from '../../../../common';
import {
  INSURANCE_PRACTICE_TENANT_LOOKUP_PORT,
  type InsurancePracticeTenantLookupPort,
} from '../ports/practice-tenant-lookup.port';
import {
  INSURANCE_AUDIT_TRAIL_PORT,
  type InsuranceAuditTrailPort,
} from '../ports/audit-trail.port';
import {
  ClaimRepository,
  CoverageRepository,
  CatalogRepository,
} from '../../infrastructure/repositories';
import {
  InsuranceClaims,
  InsuranceClaimLines,
  ClaimLineAdjudications,
  ClaimReversals,
  PriorAuthorizationRequests,
} from '../../entities';
import { INS } from '../../domain/insurance.concepts';
import {
  CreateClaimDto,
  CreatedClaimDto,
  CreateAdjudicationDto,
  PublishEobDto,
  CreateReversalDto,
  CreateDisputeDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../../presentation/dto';
import { LinkedClaimOrderService } from './linked-claim-order.service';
import {
  CLAIM_COVERAGE_REASON,
  ClaimCoveragePolicy,
  type ClaimToEvaluate,
  type EvaluatedClaimLine,
} from './claim-coverage-policy';
import {
  LinkedClaimAccessService,
  assertLegacyClaimRoles,
  claimAccessDenied,
  authorizeClaimResource,
} from './linked-claim-access.service';
import {
  type LinkedOrderSnapshot,
  matchesLinkedClaimSnapshot,
  requireNonNegativeAmount,
  validateLinkedClaimSettlement,
} from './linked-claim-validation';

const LINE_DECISION_CONCEPT: Record<string, string> = {
  APPROVED: INS.LINE_DECISION_APPROVED,
  DENIED: INS.LINE_DECISION_DENIED,
};

/**
 * Acciones de la bitácora con que se sella cada decisión de cobertura. El
 * rechazo lleva el motivo tipificado tras `:` (un conjunto cerrado, sin datos
 * del paciente) porque `audit_log` no tiene columna de detalle.
 */
export const CLAIM_COVERAGE_AUDIT = {
  APPLIED: 'INSURANCE_CLAIM_COVERAGE_APPLIED',
  REJECTED: 'INSURANCE_CLAIM_COVERAGE_REJECTED',
} as const;

const COVERAGE_REASONS: ReadonlySet<string> = new Set(
  Object.values(CLAIM_COVERAGE_REASON),
);

/** Sobre qué recurso se sella un rechazo, cuando todavía no hay reclamo. */
interface CoverageDecisionSubject {
  readonly entity: string;
  readonly entityId: string;
  readonly tenantId?: string;
}

/** Un rechazo de la política pendiente de sellar fuera de la transacción. */
interface CoverageRejection {
  readonly subject: CoverageDecisionSubject;
  readonly reason: string;
  readonly lineSequence?: unknown;
}

@Injectable()
export class ClaimsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ClaimRepository,
    private readonly coverage: CoverageRepository,
    private readonly catalog: CatalogRepository,
    @Inject(INSURANCE_PRACTICE_TENANT_LOOKUP_PORT)
    private readonly practiceLookup: InsurancePracticeTenantLookupPort,
    private readonly logger: PinoLogger,
    private readonly linkedOrders: LinkedClaimOrderService,
    private readonly linkedAccess: LinkedClaimAccessService,
    private readonly coveragePolicy: ClaimCoveragePolicy,
    @Inject(INSURANCE_AUDIT_TRAIL_PORT)
    private readonly auditTrail: InsuranceAuditTrailPort,
  ) {
    this.logger.setContext(ClaimsService.name);
  }

  async submitClaim(
    dto: CreateClaimDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedClaimDto> {
    // El rechazo de la política revierte la transacción del alta; su constancia
    // se sella después, en una propia, para que no se pierda con el rollback.
    const rejected: { current?: CoverageRejection } = {};
    try {
      return await this.createClaim(dto, actor, rejected);
    } catch (error) {
      if (rejected.current)
        await this.recordCoverageRejection(actor, rejected.current);
      throw error;
    }
  }

  private async createClaim(
    dto: CreateClaimDto,
    actor: AuthenticatedUser,
    rejected: { current?: CoverageRejection },
  ): Promise<CreatedClaimDto> {
    return this.em.transactional(async (tx) => {
      const linked = Boolean(
        dto.inventoryReservationId || dto.serviceRequestId,
      );
      if (linked) await this.linkedAccess.assertAdministrator(tx, actor);
      else assertLegacyClaimRoles(actor);
      if (dto.inventoryReservationId && dto.serviceRequestId)
        throw new PreconditionFailedException(
          'Un reclamo sólo puede representar un pedido',
        );
      if (
        new Set(dto.lines.map((line) => line.lineSequence)).size !==
        dto.lines.length
      )
        throw new PreconditionFailedException(
          'Las secuencias de líneas deben ser únicas',
        );
      if (
        !linked &&
        dto.lines.some(
          (line) =>
            line.inventoryReservationLineId || line.diagnosticStudyOfferingId,
        )
      )
        throw new PreconditionFailedException(
          'Los ítems vinculados requieren el pedido completo',
        );

      let snapshot: LinkedOrderSnapshot | null = null;
      let lines = dto.lines;
      let currencyConceptId: string | undefined;
      let evaluated: EvaluatedClaimLine[];
      let tenantId: string | undefined;
      if (linked) {
        if (dto.serviceRequestId && !dto.currencyConceptId)
          throw new PreconditionFailedException(
            'La moneda del importe diagnóstico debe declararse',
          );
        snapshot = await this.linkedOrders.lockAndResolve(tx, dto);
        await this.linkedAccess.assertProvider(tx, actor, snapshot);
        if (!snapshot) throw claimAccessDenied();
        const replay = await this.replayLinkedClaim(tx, dto, snapshot);
        if (replay) return replay;
        if (!snapshot.canSubmit)
          throw new PreconditionFailedException(
            'El pedido debe estar confirmado y sin sustituciones pendientes antes del retiro',
          );
        const resolved = await this.linkedAccess.coverageForOrder(
          tx,
          dto.patientCoverageId,
          snapshot,
          dto.insuranceCarrierId,
          true,
        );
        currencyConceptId = resolved.plan.currencyConceptId;
        lines = this.canonicalLines(dto, snapshot);
        const existing = await tx.findOne(InsuranceClaims, {
          ...(dto.inventoryReservationId
            ? { inventoryReservationId: dto.inventoryReservationId }
            : { serviceRequestId: dto.serviceRequestId }),
          statusConceptId: { $ne: INS.CLAIM_REVERSED },
        });
        if (existing)
          throw new ConflictException('El pedido ya tiene un reclamo activo');
        await this.validatePriorAuthorization(tx, dto);
        // Pedido de farmacia o de diagnóstico: la misma regla que el cobro
        // directo, con el servicio y el importe que fija el pedido, no el
        // cliente (carril 16, REQ-16-023 a 025).
        tenantId = snapshot.providerTenantId;
        evaluated = await this.evaluateCoverage(
          tx,
          {
            planId: resolved.plan.id,
            patientCoverageId: dto.patientCoverageId,
            priorAuthorizationRequestId: dto.priorAuthorizationRequestId,
            serviceRequestId: dto.serviceRequestId,
            inventoryReservationId: dto.inventoryReservationId,
            lines,
            at: new Date(),
          },
          {
            entity: dto.inventoryReservationId
              ? 'inventory_reservation'
              : 'service_request',
            entityId: snapshot.orderId,
            tenantId,
          },
          rejected,
        );
      } else {
        const coverage = await this.coverage.findCoverage(
          tx,
          dto.patientCoverageId,
        );
        if (!coverage)
          throw new ResourceNotFoundException('Cobertura no encontrada');
        const plan = await this.catalog.findPlanForCarrier(
          tx,
          coverage.insurancePlanId,
          dto.insuranceCarrierId,
        );
        if (!plan)
          throw new PreconditionFailedException(
            'La cobertura no corresponde a la aseguradora indicada',
          );
        currencyConceptId = plan.currencyConceptId;
        if (
          dto.idempotencyKey &&
          (await this.repo.findByIdempotency(tx, dto.idempotencyKey))
        )
          throw new ConflictException('Reclamo duplicado');
        // Cobro directo del consultorio: el servidor contrasta cada línea con el
        // plan (cobertura, copago, aprobación previa) y calcula él la parte del
        // paciente. La del cliente nunca se guarda (carril 16, REQ-16-023 a 025).
        await this.validatePriorAuthorization(tx, dto);
        tenantId = getCurrentTenantId();
        evaluated = await this.evaluateCoverage(
          tx,
          {
            planId: plan.id,
            patientCoverageId: dto.patientCoverageId,
            priorAuthorizationRequestId: dto.priorAuthorizationRequestId,
            lines: dto.lines,
            at: new Date(),
          },
          {
            entity: 'patient_coverage',
            entityId: dto.patientCoverageId,
            tenantId,
          },
          rejected,
        );
      }
      // Lo que se guarda es la parte del paciente que calculó el servidor.
      const patientShareBySequence = new Map(
        evaluated.map((line) => [line.lineSequence, line.patientAmount]),
      );
      lines = lines.map((line) => ({
        ...line,
        patientResponsibilityAmount: patientShareBySequence.get(
          line.lineSequence,
        ),
      }));
      const claim = this.repo.createClaim(tx, {
        insuranceCarrierId: dto.insuranceCarrierId,
        patientCoverageId: dto.patientCoverageId,
        billingProviderTypeConceptId:
          snapshot?.billingProviderTypeConceptId ??
          INS.BILLING_PROVIDER_TYPE_PRACTICE,
        billingProviderEntityId:
          snapshot?.billingProviderEntityId ?? dto.billingProviderEntityId,
        priorAuthorizationRequestId: dto.priorAuthorizationRequestId,
        inventoryReservationId: dto.inventoryReservationId,
        serviceRequestId: dto.serviceRequestId,
        claimIdentifier: dto.claimIdentifier,
        statusConceptId: INS.CLAIM_SUBMITTED,
        submittedAt: new Date(),
        totalAmount: sumarDecimales(lines.map((line) => line.billedAmount)),
        currencyConceptId: snapshot?.currencyConceptId ?? currencyConceptId,
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();
      const createdLines: InsuranceClaimLines[] = [];
      for (const line of lines) {
        createdLines.push(
          this.repo.createLine(tx, {
            insuranceClaimId: claim.id,
            lineSequence: line.lineSequence,
            serviceConceptId: line.serviceConceptId,
            inventoryReservationLineId: line.inventoryReservationLineId,
            diagnosticStudyOfferingId: line.diagnosticStudyOfferingId,
            quantity: line.quantity,
            billedAmount: line.billedAmount,
            patientResponsibilityAmount: line.patientResponsibilityAmount,
            supportingClinicalReference: line.supportingClinicalReference,
          }),
        );
      }
      await this.recordCoverageApplied(tx, actor, claim, evaluated, tenantId);
      await tx.flush();
      return {
        id: claim.id,
        status: claim.statusConceptId,
        createdAt: claim.createdAt,
        ...(linked ? { lineIds: orderedClaimLineIds(createdLines) } : {}),
      };
    });
  }

  /** Un replay sólo devuelve el registro ya creado para ese pedido y payload. */
  private async replayLinkedClaim(
    tx: EntityManager,
    dto: CreateClaimDto,
    snapshot: LinkedOrderSnapshot,
  ): Promise<CreatedClaimDto | null> {
    if (!dto.idempotencyKey) return null;
    const claim = await this.repo.findByIdempotency(tx, dto.idempotencyKey);
    if (!claim) return null;
    if (
      (claim.inventoryReservationId ?? null) !==
        (dto.inventoryReservationId ?? null) ||
      (claim.serviceRequestId ?? null) !== (dto.serviceRequestId ?? null) ||
      claim.patientCoverageId !== dto.patientCoverageId ||
      claim.insuranceCarrierId !== dto.insuranceCarrierId ||
      claim.billingProviderEntityId !== dto.billingProviderEntityId ||
      claim.billingProviderEntityId !== snapshot.billingProviderEntityId ||
      claim.billingProviderTypeConceptId !==
        snapshot.billingProviderTypeConceptId ||
      claim.claimIdentifier !== dto.claimIdentifier ||
      (claim.priorAuthorizationRequestId ?? null) !==
        (dto.priorAuthorizationRequestId ?? null) ||
      (dto.currencyConceptId &&
        dto.currencyConceptId !== claim.currencyConceptId)
    )
      throw new ConflictException(
        'La clave de idempotencia corresponde a otro reclamo',
      );
    const lines = await tx.find(InsuranceClaimLines, {
      insuranceClaimId: claim.id,
    });
    const sourceId = (line: {
      inventoryReservationLineId?: string | null;
      diagnosticStudyOfferingId?: string | null;
    }) => line.inventoryReservationLineId ?? line.diagnosticStudyOfferingId;
    const byId = new Map(lines.map((line) => [sourceId(line), line]));
    const sameLines =
      lines.length > 0 &&
      lines.length === dto.lines.length &&
      new Set(dto.lines.map(sourceId)).size === dto.lines.length &&
      dto.lines.every((line) => {
        const saved = byId.get(sourceId(line));
        requireNonNegativeAmount(line.billedAmount);
        return (
          saved &&
          !(snapshot.origin === 'PHARMACY' && line.diagnosticStudyOfferingId) &&
          !(
            snapshot.origin === 'DIAGNOSTIC' && line.inventoryReservationLineId
          ) &&
          saved.lineSequence === line.lineSequence &&
          mismosDecimales(saved.billedAmount, line.billedAmount) &&
          (line.quantity === undefined ||
            mismosDecimales(saved.quantity, line.quantity)) &&
          (line.serviceConceptId === undefined ||
            saved.serviceConceptId === line.serviceConceptId) &&
          (line.patientResponsibilityAmount === undefined ||
            mismosDecimales(
              line.patientResponsibilityAmount,
              saved.patientResponsibilityAmount ?? '0',
            )) &&
          (line.supportingClinicalReference ?? null) ===
            (saved.supportingClinicalReference ?? null)
        );
      });
    if (!sameLines)
      throw new ConflictException(
        'La clave de idempotencia requiere las mismas líneas',
      );
    return {
      id: claim.id,
      status: claim.statusConceptId,
      createdAt: claim.createdAt,
      lineIds: orderedClaimLineIds(lines),
    };
  }

  private canonicalLines(
    dto: CreateClaimDto,
    snapshot: LinkedOrderSnapshot,
  ): CreateClaimDto['lines'] {
    const sourceId = (line: {
      inventoryReservationLineId?: string | null;
      diagnosticStudyOfferingId?: string | null;
    }) => line.inventoryReservationLineId ?? line.diagnosticStudyOfferingId;
    const byId = new Map(snapshot.lines.map((line) => [sourceId(line), line]));
    if (
      dto.billingProviderEntityId !== snapshot.billingProviderEntityId ||
      (dto.currencyConceptId &&
        dto.currencyConceptId !== snapshot.currencyConceptId) ||
      dto.lines.length !== snapshot.lines.length ||
      new Set(dto.lines.map(sourceId)).size !== dto.lines.length
    ) {
      throw new PreconditionFailedException(
        'El reclamo debe representar exactamente el pedido y su prestador',
      );
    }
    return dto.lines.map((line) => {
      const source = byId.get(sourceId(line));
      requireNonNegativeAmount(line.billedAmount);
      if (
        !source ||
        (snapshot.origin === 'PHARMACY' && line.diagnosticStudyOfferingId) ||
        (snapshot.origin === 'DIAGNOSTIC' && line.inventoryReservationLineId) ||
        !mismosDecimales(line.billedAmount, source.billedAmount) ||
        (line.quantity !== undefined &&
          !mismosDecimales(line.quantity, source.quantity)) ||
        (line.serviceConceptId !== undefined &&
          line.serviceConceptId !== source.serviceConceptId)
      ) {
        throw new PreconditionFailedException(
          'Las líneas deben coincidir con las cantidades e importes del pedido',
        );
      }
      return {
        ...line,
        quantity: source.quantity ?? undefined,
        serviceConceptId: source.serviceConceptId ?? undefined,
      };
    });
  }

  /**
   * Contrasta el cobro con el plan. Si la política lo rechaza, deja anotado el
   * motivo para sellarlo en la bitácora una vez revertida el alta.
   */
  private async evaluateCoverage(
    tx: EntityManager,
    claim: ClaimToEvaluate,
    subject: CoverageDecisionSubject,
    rejected: { current?: CoverageRejection },
  ): Promise<EvaluatedClaimLine[]> {
    try {
      return await this.coveragePolicy.evaluate(tx, claim);
    } catch (error) {
      const details =
        error instanceof PreconditionFailedException
          ? error.details
          : undefined;
      const reason = details?.reason;
      if (typeof reason === 'string' && COVERAGE_REASONS.has(reason)) {
        rejected.current = {
          subject,
          reason,
          lineSequence: details?.lineSequence,
        };
      }
      throw error;
    }
  }

  /**
   * Sella en la bitácora el reparto aplicado. `audit_log` guarda quién, qué
   * reclamo y el resultado; el desglose por línea (beneficio, %, copago, parte
   * del paciente y de la aseguradora, aprobación previa) va al log estructurado,
   * sin datos del paciente. La parte del paciente y el importe quedan además en
   * `insurance_claim_lines`.
   */
  private async recordCoverageApplied(
    tx: EntityManager,
    actor: AuthenticatedUser,
    claim: InsuranceClaims,
    evaluated: readonly EvaluatedClaimLine[],
    tenantId: string | undefined,
  ): Promise<void> {
    await this.auditTrail.record(tx, actor, {
      action: CLAIM_COVERAGE_AUDIT.APPLIED,
      entity: 'insurance_claim',
      entityId: claim.id,
      tenantId,
    });
    this.logger.info(
      {
        operation: 'insurance.claim.coverage',
        outcome: 'APPLIED',
        claimId: claim.id,
        actorId: actor.id,
        priorAuthorizationRequestId: claim.priorAuthorizationRequestId ?? null,
        lines: evaluated.map((line) => ({
          lineSequence: line.lineSequence,
          benefitId: line.benefitId,
          coveragePercent: line.coveragePercent,
          copayAmount: line.copayAmount,
          requiresPriorAuthorization: line.requiresPriorAuthorization,
          patientAmount: line.patientAmount,
          insurerAmount: line.insurerAmount,
        })),
      },
      'Coverage applied to claim',
    );
  }

  /**
   * Sella el rechazo en una transacción propia: la del alta ya se revirtió. Si
   * la bitácora falla, se registra en el log y el 422 original sigue su curso.
   */
  private async recordCoverageRejection(
    actor: AuthenticatedUser,
    rejection: CoverageRejection,
  ): Promise<void> {
    this.logger.info(
      {
        operation: 'insurance.claim.coverage',
        outcome: 'REJECTED',
        reason: rejection.reason,
        lineSequence: rejection.lineSequence,
        entity: rejection.subject.entity,
        entityId: rejection.subject.entityId,
        actorId: actor.id,
      },
      'Coverage rejected claim',
    );
    try {
      await this.em.transactional(async (tx) => {
        await this.auditTrail.record(tx, actor, {
          action: `${CLAIM_COVERAGE_AUDIT.REJECTED}:${rejection.reason}`,
          entity: rejection.subject.entity,
          entityId: rejection.subject.entityId,
          tenantId: rejection.subject.tenantId,
          success: false,
        });
        await tx.flush();
      });
    } catch (error) {
      this.logger.error(
        { operation: 'insurance.claim.coverage', err: error },
        'Could not record coverage rejection in audit trail',
      );
    }
  }

  private async validatePriorAuthorization(
    tx: EntityManager,
    dto: CreateClaimDto,
  ): Promise<void> {
    if (!dto.priorAuthorizationRequestId) return;
    const request = await tx.findOne(PriorAuthorizationRequests, {
      id: dto.priorAuthorizationRequestId,
    });
    if (
      !request ||
      request.patientCoverageId !== dto.patientCoverageId ||
      (request.inventoryReservationId ?? null) !==
        (dto.inventoryReservationId ?? null) ||
      (request.serviceRequestId ?? null) !== (dto.serviceRequestId ?? null)
    ) {
      throw new PreconditionFailedException(
        'La autorización previa debe pertenecer a la misma cobertura y pedido',
      );
    }
  }

  /** Autoriza por aseguradora y conserva el orden de locks pedido → reclamo. */
  private async claimForMutation(
    tx: EntityManager,
    claimId: string,
    actor: AuthenticatedUser,
  ) {
    const initial = await this.repo.findClaim(tx, claimId);
    if (!initial) throw claimAccessDenied();
    if (!initial.inventoryReservationId && !initial.serviceRequestId) {
      await authorizeClaimResource(() => assertLegacyClaimRoles(actor));
      return { claim: initial, snapshot: null, lines: null };
    }
    await authorizeClaimResource(() =>
      this.linkedAccess.assertInsurer(tx, actor, initial.insuranceCarrierId),
    );
    const lines = await tx.find(InsuranceClaimLines, {
      insuranceClaimId: claimId,
    });
    const snapshot = await this.linkedOrders.lockAndResolve(tx, {
      ...initial,
      lines,
    });
    const claim = await this.repo.findClaimForUpdate(tx, claimId);
    if (!claim) throw claimAccessDenied();
    return { claim, snapshot, lines };
  }

  private async validateCurrentOrder(
    tx: EntityManager,
    claim: InsuranceClaims,
    lines: InsuranceClaimLines[],
    snapshot: LinkedOrderSnapshot | null,
  ): Promise<void> {
    if (!matchesLinkedClaimSnapshot(claim, lines, snapshot) || !snapshot) {
      throw new PreconditionFailedException(
        'El pedido cambió; se requiere revisar el reclamo',
      );
    }
    await this.linkedAccess.coverageForOrder(
      tx,
      claim.patientCoverageId,
      snapshot,
      claim.insuranceCarrierId,
    );
  }

  async adjudicate(
    claimId: string,
    dto: CreateAdjudicationDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const { claim, snapshot, lines } = await this.claimForMutation(
        tx,
        claimId,
        actor,
      );
      const allowed = lines
        ? [INS.CLAIM_SUBMITTED, INS.CLAIM_ADJUDICATED]
        : [INS.CLAIM_SUBMITTED];
      if (!allowed.includes(claim.statusConceptId))
        throw new PreconditionFailedException(
          'El reclamo no está en estado adjudicable',
        );
      const decisions = dto.lineAdjudications.map((row) => ({
        ...row,
        decisionConceptId: LINE_DECISION_CONCEPT[row.decision],
      }));
      if (lines) {
        await this.validateCurrentOrder(tx, claim, lines, snapshot);
        validateLinkedClaimSettlement(
          claim,
          lines,
          {
            ...dto,
            outcomeConceptId:
              dto.outcome === 'APPROVED'
                ? INS.ADJ_OUTCOME_APPROVED
                : INS.ADJ_OUTCOME_DENIED,
          },
          decisions,
        );
      } else {
        for (const row of dto.lineAdjudications) {
          const line = await this.repo.findLine(tx, row.insuranceClaimLineId);
          if (!line || line.insuranceClaimId !== claimId)
            throw new ResourceNotFoundException(
              'Línea de reclamo no encontrada',
            );
        }
      }
      const previous = await this.repo.latestVersion(tx, claimId);
      const version = this.repo.createVersion(tx, {
        insuranceClaimId: claimId,
        adjudicationVersion: (previous?.adjudicationVersion ?? 0) + 1,
        outcomeConceptId:
          dto.outcome === 'APPROVED'
            ? INS.ADJ_OUTCOME_APPROVED
            : INS.ADJ_OUTCOME_DENIED,
        dispositionText: dto.dispositionText,
        totalApprovedAmount: dto.totalApprovedAmount,
        totalPatientAmount: dto.totalPatientAmount,
        totalDeniedAmount: dto.totalDeniedAmount,
        supersedesVersionId: previous?.id,
        actorUserId: actor.id,
      });
      await tx.flush();
      for (const row of decisions) {
        this.repo.createLineAdjudication(tx, {
          claimAdjudicationVersionId: version.id,
          insuranceClaimLineId: row.insuranceClaimLineId,
          decisionConceptId: row.decisionConceptId,
          reasonConceptId: row.reasonConceptId,
          policyClauseReference: row.policyClauseReference,
          denialRationale: row.denialRationale,
          approvedAmount: row.approvedAmount,
          patientAmount: row.patientAmount,
          deniedAmount: row.deniedAmount,
        });
      }
      claim.statusConceptId = INS.CLAIM_ADJUDICATED;
      touch(claim, actor.id);
      await tx.flush();
      return { id: version.id };
    });
  }

  async publishEob(
    claimId: string,
    dto: PublishEobDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const { claim, snapshot, lines } = await this.claimForMutation(
        tx,
        claimId,
        actor,
      );
      const version = await this.repo.latestVersion(tx, claimId);
      if (
        !version ||
        ![INS.CLAIM_ADJUDICATED, INS.CLAIM_PAID].includes(claim.statusConceptId)
      ) {
        throw new PreconditionFailedException(
          'No existe adjudicación vigente para publicar',
        );
      }
      if (lines) {
        await this.validateCurrentOrder(tx, claim, lines, snapshot);
        if (await tx.count(ClaimReversals, { insuranceClaimId: claimId }))
          throw new PreconditionFailedException('El reclamo está revertido');
        const decisions = await tx.find(ClaimLineAdjudications, {
          claimAdjudicationVersionId: version.id,
        });
        validateLinkedClaimSettlement(claim, lines, version, decisions);
      }
      if (await this.repo.findEob(tx, claimId, version.id))
        throw new ConflictException(
          'La EOB ya fue publicada para esta versión',
        );
      const coverage = await this.coverage.findCoverage(
        tx,
        claim.patientCoverageId,
      );
      if (!coverage)
        throw new PreconditionFailedException(
          'La cobertura del paciente no existe',
        );
      const eob = this.repo.createEob(tx, {
        insuranceClaimId: claimId,
        claimAdjudicationVersionId: version.id,
        patientProfileId: coverage.patientProfileId,
        documentRecordId: dto.documentRecordId,
        statusConceptId: INS.EOB_PUBLISHED,
        publishedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: eob.id };
    });
  }

  async reverse(
    claimId: string,
    dto: CreateReversalDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const { claim, lines } = await this.claimForMutation(tx, claimId, actor);
      if (
        ![INS.CLAIM_ADJUDICATED, INS.CLAIM_PAID].includes(claim.statusConceptId)
      ) {
        throw new PreconditionFailedException(
          'El reclamo no está en estado reversible',
        );
      }
      const version = await this.repo.findVersion(
        tx,
        dto.reversedAdjudicationVersionId,
      );
      if (!version || version.insuranceClaimId !== claimId)
        throw new ResourceNotFoundException(
          'Versión de adjudicación no encontrada',
        );
      if (lines) {
        const latest = await this.repo.latestVersion(tx, claimId);
        if (latest?.id !== version.id)
          throw new PreconditionFailedException(
            'Sólo puede revertirse la versión vigente',
          );
        if (dto.reversalAmount !== undefined)
          requireNonNegativeAmount(dto.reversalAmount);
      }
      const reversal = this.repo.createReversal(tx, {
        insuranceClaimId: claimId,
        reversedAdjudicationVersionId: version.id,
        reversalReasonConceptId: INS.REVERSAL_REASON_CORRECTION,
        reversalAmount: dto.reversalAmount,
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      claim.statusConceptId = INS.CLAIM_REVERSED;
      touch(claim, actor.id);
      await tx.flush();
      return { id: reversal.id };
    });
  }

  /** UC-26-11: abrir disputa sobre la adjudicación de un reclamo. */
  async openDispute(
    claimId: string,
    dto: CreateDisputeDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    this.logger.info(
      { operation: 'insurance.claim.dispute', claimId, actorId: actor.id },
      'Opening dispute',
    );
    // El alcance se resuelve **antes** de abrir la transacción: quién reclama
    // es el prestador que presentó la solicitud (TAREA-16 · D1.a), y ese dato
    // vive en `practice`, no en esta tabla.
    const practiceIds = await this.practiceIdsInScope();

    return this.em.transactional(async (tx) => {
      // El `FOR UPDATE` es lo que hace idempotente al reclamo también entre
      // peticiones **concurrentes**: sin él, dos clics simultáneos leen los dos
      // «no hay disputa abierta» y crean dos. `claim_disputes` no tiene índice
      // único que lo impida, así que la exclusión la da el lock sobre la fila
      // del reclamo — el mismo patrón que usa `ads` para sus contadores.
      const claim = await this.repo.findClaimForUpdate(tx, claimId);
      // Fuera de alcance y inexistente se responden igual, y sin `details`: es
      // la misma regla que la lectura (AC-16-14), y un 404 acá volvería a
      // confirmar qué identificadores existen.
      if (!claim || !this.claimBelongsTo(claim, practiceIds)) {
        throw this.accessDenied();
      }

      // Idempotencia sin columna nueva: si ya hay una disputa **abierta** sobre
      // la misma versión del dictamen, se devuelve ésa. Reclamar dos veces con
      // el mismo cuerpo tiene que dar el mismo reclamo, no dos — la
      // aseguradora recibiría el caso duplicado y no hay forma de retirarlo.
      const existing = await this.repo.findOpenDispute(
        tx,
        claimId,
        dto.claimAdjudicationVersionId,
        INS.DISPUTE_OPEN,
      );
      if (existing) {
        return {
          id: existing.id,
          status: existing.statusConceptId,
          createdAt: existing.createdAt,
        };
      }

      const dispute = this.repo.createDispute(tx, {
        insuranceClaimId: claimId,
        claimAdjudicationVersionId: dto.claimAdjudicationVersionId,
        disputeTypeConceptId: INS.DISPUTE_TYPE_APPEAL,
        disputeReasonConceptId: INS.DISPUTE_REASON_UNDERPAID,
        initiatedByPartyTypeConceptId:
          dto.initiatedBy === 'PROVIDER'
            ? INS.PARTY_PROVIDER
            : INS.PARTY_PATIENT,
        initiatedByEntityId: dto.initiatedByEntityId,
        filingDeadline: dto.filingDeadline
          ? new Date(dto.filingDeadline)
          : undefined,
        submittedAt: new Date(),
        statusConceptId: INS.DISPUTE_OPEN,
        actorUserId: actor.id,
      });
      await tx.flush();
      return {
        id: dispute.id,
        status: dispute.statusConceptId,
        createdAt: dispute.createdAt,
      };
    });
  }

  /**
   * Las prácticas activas de la organización activa, o el rechazo.
   *
   * Reclamar es el acto del prestador que presentó la solicitud, así que el
   * alcance se mide igual que en la lectura: sin prácticas activas no hay
   * ninguna solicitud propia que reclamar.
   *
   * @returns Los ids de práctica de la organización activa.
   * @throws ForbiddenException si no tiene ninguna práctica activa.
   */
  private async practiceIdsInScope(): Promise<string[]> {
    const tenantId = requireTenantId();
    const practiceIds =
      await this.practiceLookup.findActivePracticeIdsForTenant(tenantId);
    if (practiceIds.length === 0) throw this.accessDenied();
    return practiceIds;
  }

  /**
   * Si la solicitud la envió una de las prácticas dadas.
   *
   * Se comprueba el **tipo** además del id: mientras el tipo sea
   * `BILLING_PROVIDER_TYPE_PRACTICE` la columna es un `practice.practices.id`,
   * y el día que exista un segundo tipo de facturador un uuid de otra tabla no
   * debe colar por coincidencia.
   *
   * @param claim - La solicitud leída.
   * @param practiceIds - Prácticas de la organización activa.
   * @returns Si la solicitud está dentro del alcance.
   */
  private claimBelongsTo(
    claim: {
      billingProviderTypeConceptId: string;
      billingProviderEntityId: string;
    },
    practiceIds: readonly string[],
  ): boolean {
    return (
      claim.billingProviderTypeConceptId ===
        INS.BILLING_PROVIDER_TYPE_PRACTICE &&
      practiceIds.includes(claim.billingProviderEntityId)
    );
  }

  /**
   * El rechazo único del reclamo: mismo cuerpo para «no es tuya» y «no existe».
   *
   * @returns La excepción, sin `details`.
   */
  private accessDenied(): ForbiddenException {
    return new ForbiddenException('No hay acceso a esa solicitud de seguro');
  }
}

function orderedClaimLineIds(lines: readonly InsuranceClaimLines[]): string[] {
  return [...lines]
    .sort((left, right) => left.lineSequence - right.lineSequence)
    .map((line) => line.id);
}
