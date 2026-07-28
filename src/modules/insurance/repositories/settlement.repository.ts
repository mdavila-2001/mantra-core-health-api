import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  InsuranceReconciliationBatches,
  InsuranceReconciliationItems,
  BrokerCommissionStatements,
} from '../entities';

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
