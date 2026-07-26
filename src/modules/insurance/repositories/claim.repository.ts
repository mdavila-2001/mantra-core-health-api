import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  InsuranceClaims,
  InsuranceClaimLines,
  ClaimAdjudicationVersions,
  ClaimLineAdjudications,
  PatientExplanationsOfBenefit,
  ClaimReversals,
  ClaimDisputes,
} from '../entities';

/**
 * Acceso a datos del ciclo del reclamo: reclamo + líneas (837), versiones de
 * adjudicación + adjudicaciones de línea (835, append-only), EOB, reversiones y
 * disputas. Las evidencias inmutables nunca se mutan: cada nueva versión se
 * inserta y referencia a la anterior con `supersedes_*`.
 */
@Injectable()
export class ClaimRepository {
  findClaim(em: EntityManager, id: string): Promise<InsuranceClaims | null> {
    return em.findOne(InsuranceClaims, { id });
  }
  findByIdempotency(em: EntityManager, idempotencyKey: string): Promise<InsuranceClaims | null> {
    return em.findOne(InsuranceClaims, { idempotencyKey });
  }
  createClaim(em: EntityManager, data: Record<string, unknown>): InsuranceClaims {
    return em.create(InsuranceClaims, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }

  findLine(em: EntityManager, id: string): Promise<InsuranceClaimLines | null> {
    return em.findOne(InsuranceClaimLines, { id });
  }
  createLine(em: EntityManager, data: Record<string, unknown>): InsuranceClaimLines {
    return em.create(InsuranceClaimLines, { ...data, createdAt: new Date() }, { partial: true });
  }

  findVersion(em: EntityManager, id: string): Promise<ClaimAdjudicationVersions | null> {
    return em.findOne(ClaimAdjudicationVersions, { id });
  }
  /** Última versión de adjudicación del reclamo (para supersede/re-adjudicación). */
  latestVersion(em: EntityManager, claimId: string): Promise<ClaimAdjudicationVersions | null> {
    return em.findOne(
      ClaimAdjudicationVersions,
      { insuranceClaimId: claimId },
      { orderBy: { adjudicationVersion: 'DESC' } },
    );
  }
  createVersion(em: EntityManager, data: Record<string, unknown>): ClaimAdjudicationVersions {
    return em.create(
      ClaimAdjudicationVersions,
      { ...data, adjudicatedAt: new Date(), adjudicatedByUserId: data.actorUserId as string | undefined },
      { partial: true },
    );
  }
  createLineAdjudication(em: EntityManager, data: Record<string, unknown>): ClaimLineAdjudications {
    return em.create(ClaimLineAdjudications, { ...data, createdAt: new Date() }, { partial: true });
  }

  findEob(em: EntityManager, claimId: string, versionId: string): Promise<PatientExplanationsOfBenefit | null> {
    return em.findOne(PatientExplanationsOfBenefit, {
      insuranceClaimId: claimId,
      claimAdjudicationVersionId: versionId,
    });
  }
  createEob(em: EntityManager, data: Record<string, unknown>): PatientExplanationsOfBenefit {
    return em.create(
      PatientExplanationsOfBenefit,
      { ...data, createdAt: new Date(), createdByUserId: data.actorUserId as string | undefined },
      { partial: true },
    );
  }

  createReversal(em: EntityManager, data: Record<string, unknown>): ClaimReversals {
    return em.create(
      ClaimReversals,
      { ...data, occurredAt: new Date(), recordedAt: new Date(), recordedByUserId: data.actorUserId as string | undefined },
      { partial: true },
    );
  }

  createDispute(em: EntityManager, data: Record<string, unknown>): ClaimDisputes {
    return em.create(ClaimDisputes, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }
}
