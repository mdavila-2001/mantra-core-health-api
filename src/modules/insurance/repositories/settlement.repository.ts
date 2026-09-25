import { Injectable } from '@nestjs/common';
import { QueryOrder, type EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  InsuranceReconciliationBatches,
  InsuranceReconciliationItems,
  BrokerCommissionStatements,
  InsuranceClaims,
} from '../entities';
import { INS } from '../insurance.concepts';

/**
 * Acceso a datos de liquidación: lotes/ítems de conciliación (UC-26-13) y
 * liquidaciones de comisión de broker (UC-26-14). Stateless.
 */
@Injectable()
export class SettlementRepository {
  /**
   * Obtiene find batch.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find batch conforme al contrato `Promise<InsuranceReconciliationBatches | null>`.
   */
  findBatch(
    em: EntityManager,
    id: string,
  ): Promise<InsuranceReconciliationBatches | null> {
    return em.findOne(InsuranceReconciliationBatches, { id });
  }
  /**
   * Crea create batch.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create batch conforme al contrato `InsuranceReconciliationBatches`.
   */
  createBatch(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsuranceReconciliationBatches {
    return em.create(
      InsuranceReconciliationBatches,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }
  /**
   * Crea create item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create item conforme al contrato `InsuranceReconciliationItems`.
   */
  createItem(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsuranceReconciliationItems {
    return em.create(
      InsuranceReconciliationItems,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  // ---- Lotes periódicos de liquidación al profesional (Tarea 3 · H8) ------

  /**
   * Cerrojo de sesión que serializa la generación de lotes del mismo par
   * aseguradora/prestador: dos peticiones concurrentes con la misma clave
   * natural quedan en fila, y la segunda encuentra el lote ya creado por la
   * primera (replay). Mismo patrón que `AuditLogRepository`/`CredentialsRepository`.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param insuranceCarrierId - Aseguradora del lote.
   * @param providerEntityId - Prestador del lote.
   */
  lockSettlementPair(
    em: EntityManager,
    insuranceCarrierId: string,
    providerEntityId: string,
  ): Promise<unknown> {
    return em.execute('SELECT pg_advisory_xact_lock(hashtext(?))', [
      `practitioner-settlement-batch:${insuranceCarrierId}:${providerEntityId}`,
    ]);
  }

  /**
   * Reclamos de un par aseguradora/prestador, para evaluar elegibilidad
   * (contrato §7) y detectar ajustes de reversión pendientes (§10).
   *
   * @param em - Contexto de persistencia.
   * @param insuranceCarrierId - Aseguradora.
   * @param providerEntityId - Prestador (`billing_provider_entity_id`).
   * @returns Todos los reclamos del par, sin filtrar por estado.
   */
  findClaimsByCarrierAndProvider(
    em: EntityManager,
    insuranceCarrierId: string,
    providerEntityId: string,
  ): Promise<InsuranceClaims[]> {
    return em.find(InsuranceClaims, {
      insuranceCarrierId,
      billingProviderEntityId: providerEntityId,
    });
  }

  /**
   * El lote de liquidación (no la conciliación manual UC-26-13) con esa clave
   * natural exacta, si ya se generó.
   *
   * @param em - Contexto de persistencia.
   * @param insuranceCarrierId - Aseguradora.
   * @param providerEntityId - Prestador.
   * @param periodStart - Inicio del período.
   * @param periodEnd - Fin del período.
   */
  findSettlementBatchByNaturalKey(
    em: EntityManager,
    insuranceCarrierId: string,
    providerEntityId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<InsuranceReconciliationBatches | null> {
    return em.findOne(InsuranceReconciliationBatches, {
      insuranceCarrierId,
      providerEntityId,
      periodStart,
      periodEnd,
      statusConceptId: INS.SETTLEMENT_BATCH_ISSUED,
    });
  }

  /**
   * Lotes de liquidación (no de conciliación manual) que calzan los filtros
   * dados, del más nuevo al más viejo por período.
   *
   * @param em - Contexto de persistencia.
   * @param filters - `insuranceCarrierId` y/o `providerEntityIds` acotan el
   *   par; `from`/`to` acotan `period_start`.
   */
  findSettlementBatches(
    em: EntityManager,
    filters: {
      readonly insuranceCarrierId?: string;
      readonly providerEntityIds?: readonly string[];
      readonly from?: Date;
      readonly to?: Date;
    },
  ): Promise<InsuranceReconciliationBatches[]> {
    const where: Record<string, unknown> = {
      statusConceptId: INS.SETTLEMENT_BATCH_ISSUED,
    };
    if (filters.insuranceCarrierId)
      where.insuranceCarrierId = filters.insuranceCarrierId;
    if (filters.providerEntityIds?.length)
      where.providerEntityId = { $in: [...filters.providerEntityIds] };
    if (filters.from || filters.to) {
      where.periodStart = {
        ...(filters.from ? { $gte: filters.from } : {}),
        ...(filters.to ? { $lte: filters.to } : {}),
      };
    }
    return em.find(InsuranceReconciliationBatches, where, {
      orderBy: { periodStart: QueryOrder.DESC },
    });
  }

  /**
   * Ítems de liquidación (`SETTLEMENT_ITEM_INCLUDED` o
   * `SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT`) de los lotes dados.
   *
   * @param em - Contexto de persistencia.
   * @param batchIds - Lotes cuyos ítems se piden.
   */
  findSettlementItemsByBatchIds(
    em: EntityManager,
    batchIds: readonly string[],
  ): Promise<InsuranceReconciliationItems[]> {
    if (batchIds.length === 0) return Promise.resolve([]);
    return em.find(InsuranceReconciliationItems, {
      insuranceReconciliationBatchId: { $in: [...batchIds] },
    });
  }

  /**
   * Ítems `SETTLEMENT_ITEM_INCLUDED`/`SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT` de
   * los reclamos dados, en cualquier lote: sostiene «un reclamo, un lote»
   * (contrato §9) y evita ajustar una reversión dos veces (§10).
   *
   * @param em - Contexto de persistencia.
   * @param claimIds - Reclamos a comprobar.
   */
  findSettlementItemsByClaimIds(
    em: EntityManager,
    claimIds: readonly string[],
  ): Promise<InsuranceReconciliationItems[]> {
    if (claimIds.length === 0) return Promise.resolve([]);
    return em.find(InsuranceReconciliationItems, {
      insuranceClaimId: { $in: [...claimIds] },
      statusConceptId: {
        $in: [
          INS.SETTLEMENT_ITEM_INCLUDED,
          INS.SETTLEMENT_ITEM_REVERSAL_ADJUSTMENT,
        ],
      },
    });
  }

  /**
   * Obtiene find statement by unique.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param insuranceBrokerId - Identificador de insurance broker.
   * @param brokerCarrierAgreementId - Identificador de broker carrier agreement.
   * @param periodStart - Valor de period start requerido por la operación.
   * @param periodEnd - Valor de period end requerido por la operación.
   * @returns Resultado de find statement by unique conforme al contrato `Promise<BrokerCommissionStatements | null>`.
   */
  findStatementByUnique(
    em: EntityManager,
    insuranceBrokerId: string,
    brokerCarrierAgreementId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<BrokerCommissionStatements | null> {
    return em.findOne(BrokerCommissionStatements, {
      insuranceBrokerId,
      brokerCarrierAgreementId,
      periodStart,
      periodEnd,
    });
  }
  /**
   * Crea create statement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create statement conforme al contrato `BrokerCommissionStatements`.
   */
  createStatement(
    em: EntityManager,
    data: Record<string, unknown>,
  ): BrokerCommissionStatements {
    return em.create(
      BrokerCommissionStatements,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }
}
