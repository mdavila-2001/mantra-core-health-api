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
  /**
   * Obtiene find coverage.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find coverage conforme al contrato `Promise<PatientCoverages | null>`.
   */
  findCoverage(
    em: EntityManager,
    id: string,
  ): Promise<PatientCoverages | null> {
    return em.findOne(PatientCoverages, { id });
  }

  /**
   * Obtiene find by member and plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param memberIdentifier - Valor de member identifier requerido por la operación.
   * @param insurancePlanId - Identificador de insurance plan.
   * @returns Resultado de find by member and plan conforme al contrato `Promise<PatientCoverages | null>`.
   */
  findByMemberAndPlan(
    em: EntityManager,
    memberIdentifier: string,
    insurancePlanId: string,
  ): Promise<PatientCoverages | null> {
    return em.findOne(PatientCoverages, { memberIdentifier, insurancePlanId });
  }

  /**
   * Ejecuta la operación count active by patient.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Identificador de patient profile.
   * @param statusConceptId - Identificador de status concept.
   * @returns Resultado de count active by patient conforme al contrato `Promise<number>`.
   */
  countActiveByPatient(
    em: EntityManager,
    patientProfileId: string,
    statusConceptId: string,
  ): Promise<number> {
    return em.count(PatientCoverages, { patientProfileId, statusConceptId });
  }

  /**
   * Crea create coverage.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create coverage conforme al contrato `PatientCoverages`.
   */
  createCoverage(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PatientCoverages {
    return em.create(
      PatientCoverages,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create dependent.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dependent conforme al contrato `CoverageDependents`.
   */
  createDependent(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoverageDependents {
    return em.create(
      CoverageDependents,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create broker client.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create broker client conforme al contrato `BrokerClients`.
   */
  createBrokerClient(
    em: EntityManager,
    data: Record<string, unknown>,
  ): BrokerClients {
    return em.create(
      BrokerClients,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /** Devuelve la versión COB vigente (effective_to nulo) del paciente, si existe. */
  latestActiveCob(
    em: EntityManager,
    patientProfileId: string,
  ): Promise<CoordinationOfBenefits | null> {
    return em.findOne(
      CoordinationOfBenefits,
      { patientProfileId, effectiveTo: null },
      { orderBy: { determinationVersion: 'DESC' } },
    );
  }

  /**
   * Crea create cob.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cob conforme al contrato `CoordinationOfBenefits`.
   */
  createCob(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoordinationOfBenefits {
    return em.create(
      CoordinationOfBenefits,
      {
        ...data,
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }

  // --- Elegibilidad (UC-26-03) ---
  /**
   * Obtiene find request by idempotency.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param idempotencyKey - Valor de idempotency key requerido por la operación.
   * @returns Resultado de find request by idempotency conforme al contrato `Promise<CoverageEligibilityRequests | null>`.
   */
  findRequestByIdempotency(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<CoverageEligibilityRequests | null> {
    return em.findOne(CoverageEligibilityRequests, { idempotencyKey });
  }

  /**
   * Crea create eligibility request.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create eligibility request conforme al contrato `CoverageEligibilityRequests`.
   */
  createEligibilityRequest(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoverageEligibilityRequests {
    return em.create(
      CoverageEligibilityRequests,
      {
        ...data,
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }

  /**
   * Crea create eligibility response.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create eligibility response conforme al contrato `CoverageEligibilityResponses`.
   */
  createEligibilityResponse(
    em: EntityManager,
    data: Record<string, unknown>,
  ): CoverageEligibilityResponses {
    return em.create(
      CoverageEligibilityResponses,
      { ...data },
      { partial: true },
    );
  }
}
