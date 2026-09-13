import { Injectable } from '@nestjs/common';
import { LockMode, type EntityManager } from '@mikro-orm/postgresql';
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
  /**
   * Obtiene find claim.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find claim conforme al contrato `Promise<InsuranceClaims | null>`.
   */
  findClaim(em: EntityManager, id: string): Promise<InsuranceClaims | null> {
    return em.findOne(InsuranceClaims, { id });
  }

  /**
   * La solicitud, bloqueada para escritura hasta el fin de la transacción.
   *
   * Lo pide la idempotencia de «Reclamar» (AC-16-13): la exclusión entre dos
   * peticiones concurrentes la da este `FOR UPDATE` sobre la fila del reclamo,
   * porque `claim_disputes` no declara un índice único que impida la segunda
   * inserción. Es el patrón que el repositorio de `ads` ya usa para sus
   * contadores; sin él, «buscar la disputa abierta y, si no hay, crearla» es
   * una condición de carrera clásica.
   *
   * @param em - Transacción activa; fuera de una, el lock no significa nada.
   * @param id - Solicitud a bloquear.
   * @returns La solicitud, o `null` si no existe.
   */
  findClaimForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<InsuranceClaims | null> {
    return em.findOne(
      InsuranceClaims,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE, refresh: true },
    );
  }

  /**
   * Obtiene find by idempotency.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param idempotencyKey - Valor de idempotency key requerido por la operación.
   * @returns Resultado de find by idempotency conforme al contrato `Promise<InsuranceClaims | null>`.
   */
  findByIdempotency(
    em: EntityManager,
    idempotencyKey: string,
  ): Promise<InsuranceClaims | null> {
    return em.findOne(InsuranceClaims, { idempotencyKey });
  }
  /**
   * Crea create claim.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create claim conforme al contrato `InsuranceClaims`.
   */
  createClaim(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsuranceClaims {
    return em.create(
      InsuranceClaims,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene find line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find line conforme al contrato `Promise<InsuranceClaimLines | null>`.
   */
  findLine(em: EntityManager, id: string): Promise<InsuranceClaimLines | null> {
    return em.findOne(InsuranceClaimLines, { id });
  }
  /**
   * Crea create line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line conforme al contrato `InsuranceClaimLines`.
   */
  createLine(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsuranceClaimLines {
    return em.create(
      InsuranceClaimLines,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }

  /**
   * Obtiene find version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find version conforme al contrato `Promise<ClaimAdjudicationVersions | null>`.
   */
  findVersion(
    em: EntityManager,
    id: string,
  ): Promise<ClaimAdjudicationVersions | null> {
    return em.findOne(ClaimAdjudicationVersions, { id });
  }
  /** Última versión de adjudicación del reclamo (para supersede/re-adjudicación). */
  latestVersion(
    em: EntityManager,
    claimId: string,
  ): Promise<ClaimAdjudicationVersions | null> {
    return em.findOne(
      ClaimAdjudicationVersions,
      { insuranceClaimId: claimId },
      { orderBy: { adjudicationVersion: 'DESC' } },
    );
  }
  /**
   * Crea create version.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create version conforme al contrato `ClaimAdjudicationVersions`.
   */
  createVersion(
    em: EntityManager,
    data: Record<string, unknown>,
  ): ClaimAdjudicationVersions {
    return em.create(
      ClaimAdjudicationVersions,
      {
        ...data,
        adjudicatedAt: new Date(),
        adjudicatedByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }
  /**
   * Crea create line adjudication.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create line adjudication conforme al contrato `ClaimLineAdjudications`.
   */
  createLineAdjudication(
    em: EntityManager,
    data: Record<string, unknown>,
  ): ClaimLineAdjudications {
    return em.create(
      ClaimLineAdjudications,
      { ...data, createdAt: new Date() },
      { partial: true },
    );
  }

  /**
   * Obtiene find eob.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param claimId - Identificador de claim.
   * @param versionId - Identificador de version.
   * @returns Resultado de find eob conforme al contrato `Promise<PatientExplanationsOfBenefit | null>`.
   */
  findEob(
    em: EntityManager,
    claimId: string,
    versionId: string,
  ): Promise<PatientExplanationsOfBenefit | null> {
    return em.findOne(PatientExplanationsOfBenefit, {
      insuranceClaimId: claimId,
      claimAdjudicationVersionId: versionId,
    });
  }
  /**
   * Crea create eob.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create eob conforme al contrato `PatientExplanationsOfBenefit`.
   */
  createEob(
    em: EntityManager,
    data: Record<string, unknown>,
  ): PatientExplanationsOfBenefit {
    return em.create(
      PatientExplanationsOfBenefit,
      {
        ...data,
        createdAt: new Date(),
        createdByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }

  /**
   * Crea create reversal.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reversal conforme al contrato `ClaimReversals`.
   */
  createReversal(
    em: EntityManager,
    data: Record<string, unknown>,
  ): ClaimReversals {
    return em.create(
      ClaimReversals,
      {
        ...data,
        occurredAt: new Date(),
        recordedAt: new Date(),
        recordedByUserId: data.actorUserId as string | undefined,
      },
      { partial: true },
    );
  }

  /**
   * Crea create dispute.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create dispute conforme al contrato `ClaimDisputes`.
   */
  /**
   * Una disputa **abierta** ya presentada sobre la misma versión del dictamen.
   *
   * Es lo que hace idempotente a «Reclamar»: sin esto, dos toques al botón
   * —o un reintento de red— dejan dos disputas sobre el mismo dictamen, y la
   * aseguradora recibe el reclamo dos veces. Se busca por versión disputada y
   * no sólo por reclamo, porque reclamar el dictamen v1 y después el v2 son
   * dos reclamos legítimos y distintos.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param claimId - Reclamo sobre el que se reclama.
   * @param adjudicationVersionId - Versión disputada, si se declaró.
   * @param openStatusConceptId - Concepto de «disputa abierta».
   * @returns La disputa vigente equivalente, o `null`.
   */
  findOpenDispute(
    em: EntityManager,
    claimId: string,
    adjudicationVersionId: string | undefined,
    openStatusConceptId: string,
  ): Promise<ClaimDisputes | null> {
    return em.findOne(ClaimDisputes, {
      insuranceClaimId: claimId,
      claimAdjudicationVersionId: adjudicationVersionId ?? null,
      statusConceptId: openStatusConceptId,
    });
  }

  createDispute(
    em: EntityManager,
    data: Record<string, unknown>,
  ): ClaimDisputes {
    return em.create(
      ClaimDisputes,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }
}
