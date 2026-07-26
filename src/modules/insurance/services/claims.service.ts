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
import { ClaimRepository, CoverageRepository, CatalogRepository } from '../repositories';
import { INS } from '../insurance.concepts';
import {
  CreateClaimDto,
  CreateAdjudicationDto,
  PublishEobDto,
  CreateReversalDto,
  CreateDisputeDto,
  CreatedResourceDto,
  ResourceStatusDto,
} from '../dto';

const LINE_DECISION_CONCEPT: Record<string, string> = {
  APPROVED: INS.LINE_DECISION_APPROVED,
  DENIED: INS.LINE_DECISION_DENIED,
};

/**
 * Ciclo del reclamo: envío 837 (UC-26-06), adjudicación por línea 835 append-only
 * (UC-26-07), publicación de EOB (UC-26-08), reversión (UC-26-10) y apertura de
 * disputa (UC-26-11). Las versiones de adjudicación y las adjudicaciones de línea
 * son inmutables: una re-adjudicación crea una nueva versión que referencia la
 * anterior por `supersedes_version_id` y nunca reescribe la evidencia previa.
 */
@Injectable()
export class ClaimsService {
  constructor(
    private readonly em: EntityManager,
    private readonly repo: ClaimRepository,
    private readonly coverage: CoverageRepository,
    private readonly catalog: CatalogRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ClaimsService.name);
  }

  /** UC-26-06: enviar reclamo con líneas. */
  async submitClaim(dto: CreateClaimDto, actor: AuthenticatedUser): Promise<ResourceStatusDto> {
    this.logger.info({ operation: 'insurance.claim.submit', actorId: actor.id }, 'Submitting claim');
    return this.em.transactional(async (tx) => {
      const carrier = await this.catalog.findCarrier(tx, dto.insuranceCarrierId);
      if (!carrier) throw new ResourceNotFoundException('Aseguradora no encontrada', { carrierId: dto.insuranceCarrierId });
      const coverage = await this.coverage.findCoverage(tx, dto.patientCoverageId);
      if (!coverage) throw new ResourceNotFoundException('Cobertura no encontrada', { coverageId: dto.patientCoverageId });

      if (dto.idempotencyKey) {
        const existing = await this.repo.findByIdempotency(tx, dto.idempotencyKey);
        if (existing) throw new ConflictException('Reclamo duplicado', { idempotencyKey: dto.idempotencyKey });
      }

      const total = dto.lines.reduce((acc, l) => acc + Number(l.billedAmount), 0);
      const claim = this.repo.createClaim(tx, {
        insuranceCarrierId: dto.insuranceCarrierId,
        patientCoverageId: dto.patientCoverageId,
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
        billingProviderEntityId: dto.billingProviderEntityId,
        priorAuthorizationRequestId: dto.priorAuthorizationRequestId,
        claimIdentifier: dto.claimIdentifier,
        statusConceptId: INS.CLAIM_SUBMITTED,
        submittedAt: new Date(),
        totalAmount: total.toFixed(2),
        idempotencyKey: dto.idempotencyKey,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const line of dto.lines) {
        this.repo.createLine(tx, {
          insuranceClaimId: claim.id,
          lineSequence: line.lineSequence,
          serviceConceptId: line.serviceConceptId,
          quantity: line.quantity,
          billedAmount: line.billedAmount,
          patientResponsibilityAmount: line.patientResponsibilityAmount,
        });
      }

      return { id: claim.id, status: claim.statusConceptId, createdAt: claim.createdAt };
    });
  }

  /** UC-26-07: adjudicar reclamo por línea (nueva versión inmutable). */
  async adjudicate(claimId: string, dto: CreateAdjudicationDto, actor: AuthenticatedUser): Promise<CreatedResourceDto> {
    this.logger.info({ operation: 'insurance.claim.adjudicate', claimId, actorId: actor.id }, 'Adjudicating claim');
    return this.em.transactional(async (tx) => {
      const claim = await this.repo.findClaim(tx, claimId);
      if (!claim) throw new ResourceNotFoundException('Reclamo no encontrado', { claimId });
      if (claim.statusConceptId !== INS.CLAIM_SUBMITTED) {
        throw new PreconditionFailedException('El reclamo no está en estado adjudicable', { claimId });
      }

      // Validar que cada línea adjudicada pertenece a este reclamo.
      for (const la of dto.lineAdjudications) {
        const line = await this.repo.findLine(tx, la.insuranceClaimLineId);
        if (!line || line.insuranceClaimId !== claimId) {
          throw new ResourceNotFoundException('Línea de reclamo no encontrada', {
            lineId: la.insuranceClaimLineId,
          });
        }
      }

      const previous = await this.repo.latestVersion(tx, claimId);
      const nextVersion = (previous?.adjudicationVersion ?? 0) + 1;
      const version = this.repo.createVersion(tx, {
        insuranceClaimId: claimId,
        adjudicationVersion: nextVersion,
        outcomeConceptId: dto.outcome === 'APPROVED' ? INS.ADJ_OUTCOME_APPROVED : INS.ADJ_OUTCOME_DENIED,
        totalApprovedAmount: dto.totalApprovedAmount,
        totalPatientAmount: dto.totalPatientAmount,
        totalDeniedAmount: dto.totalDeniedAmount,
        supersedesVersionId: previous?.id,
        actorUserId: actor.id,
      });
      await tx.flush();

      for (const la of dto.lineAdjudications) {
        this.repo.createLineAdjudication(tx, {
          claimAdjudicationVersionId: version.id,
          insuranceClaimLineId: la.insuranceClaimLineId,
          decisionConceptId: LINE_DECISION_CONCEPT[la.decision],
          approvedAmount: la.approvedAmount,
          patientAmount: la.patientAmount,
          deniedAmount: la.deniedAmount,
        });
      }

      claim.statusConceptId = INS.CLAIM_ADJUDICATED;
      touch(claim, actor.id);
      await tx.flush();

      return { id: version.id };
    });
  }

  /** UC-26-08: publicar la EOB del paciente para una versión de adjudicación. */
  async publishEob(claimId: string, dto: PublishEobDto, actor: AuthenticatedUser): Promise<CreatedResourceDto> {
    this.logger.info({ operation: 'insurance.claim.eob', claimId, actorId: actor.id }, 'Publishing EOB');
    return this.em.transactional(async (tx) => {
      const claim = await this.repo.findClaim(tx, claimId);
      if (!claim) throw new ResourceNotFoundException('Reclamo no encontrado', { claimId });
      const version = await this.repo.latestVersion(tx, claimId);
      if (!version) {
        throw new PreconditionFailedException('No existe adjudicación in_force para publicar EOB', { claimId });
      }

      const existing = await this.repo.findEob(tx, claimId, version.id);
      if (existing) throw new ConflictException('La EOB ya fue publicada para esta versión', { claimId });

      const coverage = await this.coverage.findCoverage(tx, claim.patientCoverageId);
      const eob = this.repo.createEob(tx, {
        insuranceClaimId: claimId,
        claimAdjudicationVersionId: version.id,
        patientProfileId: coverage?.patientProfileId ?? claim.patientCoverageId,
        documentRecordId: dto.documentRecordId,
        statusConceptId: INS.EOB_PUBLISHED,
        publishedAt: new Date(),
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: eob.id };
    });
  }

  /** UC-26-10: registrar reversión (append-only) del reclamo adjudicado. */
  async reverse(claimId: string, dto: CreateReversalDto, actor: AuthenticatedUser): Promise<CreatedResourceDto> {
    this.logger.info({ operation: 'insurance.claim.reverse', claimId, actorId: actor.id }, 'Reversing claim');
    return this.em.transactional(async (tx) => {
      const claim = await this.repo.findClaim(tx, claimId);
      if (!claim) throw new ResourceNotFoundException('Reclamo no encontrado', { claimId });
      if (![INS.CLAIM_ADJUDICATED, INS.CLAIM_PAID].includes(claim.statusConceptId)) {
        throw new PreconditionFailedException('El reclamo no está en estado reversible', { claimId });
      }
      const version = await this.repo.findVersion(tx, dto.reversedAdjudicationVersionId);
      if (!version || version.insuranceClaimId !== claimId) {
        throw new ResourceNotFoundException('Versión de adjudicación no encontrada', {
          versionId: dto.reversedAdjudicationVersionId,
        });
      }

      const reversal = this.repo.createReversal(tx, {
        insuranceClaimId: claimId,
        reversedAdjudicationVersionId: dto.reversedAdjudicationVersionId,
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
  async openDispute(claimId: string, dto: CreateDisputeDto, actor: AuthenticatedUser): Promise<ResourceStatusDto> {
    this.logger.info({ operation: 'insurance.claim.dispute', claimId, actorId: actor.id }, 'Opening dispute');
    return this.em.transactional(async (tx) => {
      const claim = await this.repo.findClaim(tx, claimId);
      if (!claim) throw new ResourceNotFoundException('Reclamo no encontrado', { claimId });

      const dispute = this.repo.createDispute(tx, {
        insuranceClaimId: claimId,
        claimAdjudicationVersionId: dto.claimAdjudicationVersionId,
        disputeTypeConceptId: INS.DISPUTE_TYPE_APPEAL,
        disputeReasonConceptId: INS.DISPUTE_REASON_UNDERPAID,
        initiatedByPartyTypeConceptId: dto.initiatedBy === 'PROVIDER' ? INS.PARTY_PROVIDER : INS.PARTY_PATIENT,
        initiatedByEntityId: dto.initiatedByEntityId,
        filingDeadline: dto.filingDeadline ? new Date(dto.filingDeadline) : undefined,
        submittedAt: new Date(),
        statusConceptId: INS.DISPUTE_OPEN,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: dispute.id, status: dispute.statusConceptId, createdAt: dispute.createdAt };
    });
  }
}
