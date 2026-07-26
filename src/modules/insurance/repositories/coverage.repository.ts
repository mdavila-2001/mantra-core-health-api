import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  PatientCoverages,
  CoverageDependents,
  CoordinationOfBenefits,
  BrokerClients,
  CoverageEligibilityRequests,
  CoverageEligibilityResponses,
} from '../entities';

/**
 * Acceso a datos de coberturas de paciente, dependientes, coordinación de
 * beneficios (COB) y elegibilidad. Stateless. Las entidades de elegibilidad y
 * COB son de solo-alta (sin `updated_at`/`row_version`), por eso se fija
 * únicamente `createdAt`/`createdByUserId`.
 */
@Injectable()
export class CoverageRepository {
  findCoverage(em: EntityManager, id: string): Promise<PatientCoverages | null> {
    return em.findOne(PatientCoverages, { id });
  }

  findByMemberAndPlan(
    em: EntityManager,
    memberIdentifier: string,
    insurancePlanId: string,
  ): Promise<PatientCoverages | null> {
    return em.findOne(PatientCoverages, { memberIdentifier, insurancePlanId });
  }

  countActiveByPatient(em: EntityManager, patientProfileId: string, statusConceptId: string): Promise<number> {
    return em.count(PatientCoverages, { patientProfileId, statusConceptId });
  }

  createCoverage(em: EntityManager, data: Record<string, unknown>): PatientCoverages {
    return em.create(PatientCoverages, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }

  createDependent(em: EntityManager, data: Record<string, unknown>): CoverageDependents {
    return em.create(CoverageDependents, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }

  createBrokerClient(em: EntityManager, data: Record<string, unknown>): BrokerClients {
    return em.create(BrokerClients, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }

  /** Devuelve la versión COB vigente (effective_to nulo) del paciente, si existe. */
  latestActiveCob(em: EntityManager, patientProfileId: string): Promise<CoordinationOfBenefits | null> {
    return em.findOne(
      CoordinationOfBenefits,
      { patientProfileId, effectiveTo: null },
      { orderBy: { determinationVersion: 'DESC' } },
    );
  }

  createCob(em: EntityManager, data: Record<string, unknown>): CoordinationOfBenefits {
    return em.create(
      CoordinationOfBenefits,
      { ...data, createdAt: new Date(), createdByUserId: data.actorUserId as string | undefined },
      { partial: true },
    );
  }

  // --- Elegibilidad (UC-26-03) ---
  findRequestByIdempotency(em: EntityManager, idempotencyKey: string): Promise<CoverageEligibilityRequests | null> {
    return em.findOne(CoverageEligibilityRequests, { idempotencyKey });
  }

  createEligibilityRequest(em: EntityManager, data: Record<string, unknown>): CoverageEligibilityRequests {
    return em.create(
      CoverageEligibilityRequests,
      { ...data, createdAt: new Date(), createdByUserId: data.actorUserId as string | undefined },
      { partial: true },
    );
  }

  createEligibilityResponse(em: EntityManager, data: Record<string, unknown>): CoverageEligibilityResponses {
    return em.create(CoverageEligibilityResponses, { ...data }, { partial: true });
  }
}
