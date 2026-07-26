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
  findBatch(em: EntityManager, id: string): Promise<InsuranceReconciliationBatches | null> {
    return em.findOne(InsuranceReconciliationBatches, { id });
  }
  createBatch(em: EntityManager, data: Record<string, unknown>): InsuranceReconciliationBatches {
    return em.create(InsuranceReconciliationBatches, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }
  createItem(em: EntityManager, data: Record<string, unknown>): InsuranceReconciliationItems {
    return em.create(InsuranceReconciliationItems, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }

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
  createStatement(em: EntityManager, data: Record<string, unknown>): BrokerCommissionStatements {
    return em.create(BrokerCommissionStatements, { ...data, ...createdBy(data.actorUserId as string) }, { partial: true });
  }
}
