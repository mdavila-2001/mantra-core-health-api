import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FeeSchedules,
  TransactionFees,
  GatewaySettlements,
  SettlementLines,
  Payouts,
  PayoutItems,
  PaymentsReconciliationRuns,
  ProviderReconciliationRecords,
  ReconciliationExceptions,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateFeeScheduleData {
  tenantId: string;
  code: string;
  name: string;
  feeTypeConceptId: string;
  calculationMethodConceptId: string;
  percentage?: string;
  fixedAmount?: string;
  currencyConceptId?: string;
  minAmount?: string;
  maxAmount?: string;
  validFrom?: Date;
  validTo?: Date;
  stateConceptId: string;
  actorUserId?: string;
}

export interface CreateSettlementData {
  gatewayId: string;
  settlementRef: string;
  grossAmount: string;
  feeAmount: string;
  netAmount: string;
  currencyConceptId: string;
  settledAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateSettlementLineData {
  settlementId: string;
  paymentTransactionId?: string;
  refundId?: string;
  amount: string;
  feeAmount?: string;
  actorUserId?: string;
}

export interface CreatePayoutData {
  tenantId: string;
  practiceId?: string;
  payeeTypeConceptId: string;
  payeeRefId: string;
  gatewayId: string;
  amount: string;
  currencyConceptId: string;
  periodStart: Date;
  periodEnd: Date;
  statusConceptId: string;
  scheduledAt?: Date;
  executedAt?: Date;
  gatewayPayoutRef?: string;
  actorUserId?: string;
}

export interface CreatePayoutItemData {
  payoutId: string;
  sourceTypeConceptId: string;
  sourceRefId: string;
  amount: string;
  commissionAmount?: string;
  description?: string;
  actorUserId?: string;
}

export interface CreateReconciliationRunData {
  tenantId: string;
  gatewayId: string;
  periodStart: Date;
  periodEnd: Date;
  statusConceptId: string;
  startedAt: Date;
  actorUserId?: string;
}

export interface CreateReconciliationExceptionData {
  reconciliationRunId: string;
  exceptionTypeConceptId: string;
  paymentTransactionId?: string;
  externalRef?: string;
  amountDifference?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de las operaciones de back-office: tarifas, liquidaciones,
 * payouts y conciliación. Todas son procesos de cierre sobre transacciones ya
 * existentes, por eso comparten repositorio en vez de tener uno por tabla.
 */
@Injectable()
export class PaymentOperationsRepository {
  createFeeSchedule(
    em: EntityManager,
    data: CreateFeeScheduleData,
  ): FeeSchedules {
    return em.create(
      FeeSchedules,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        feeTypeConceptId: data.feeTypeConceptId,
        calculationMethodConceptId: data.calculationMethodConceptId,
        percentage: data.percentage,
        fixedAmount: data.fixedAmount,
        currencyConceptId: data.currencyConceptId,
        minAmount: data.minAmount,
        maxAmount: data.maxAmount,
        validFrom: data.validFrom,
        validTo: data.validTo,
        stateConceptId: data.stateConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Versión vigente del mismo código: al publicar una nueva pasa a superseded. */
  findFeeScheduleByCode(
    em: EntityManager,
    tenantId: string,
    code: string,
    activeStateConceptId: string,
  ): Promise<FeeSchedules | null> {
    return em.findOne(FeeSchedules, {
      tenantId,
      code,
      stateConceptId: activeStateConceptId,
    });
  }

  createTransactionFee(
    em: EntityManager,
    data: {
      paymentTransactionId: string;
      feeScheduleId?: string;
      feeTypeConceptId: string;
      amount: string;
      currencyConceptId: string;
      bearerTypeConceptId?: string;
      actorUserId?: string;
    },
  ): TransactionFees {
    return em.create(
      TransactionFees,
      {
        paymentTransactionId: data.paymentTransactionId,
        feeScheduleId: data.feeScheduleId,
        feeTypeConceptId: data.feeTypeConceptId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        bearerTypeConceptId: data.bearerTypeConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createSettlement(
    em: EntityManager,
    data: CreateSettlementData,
  ): GatewaySettlements {
    return em.create(
      GatewaySettlements,
      {
        gatewayId: data.gatewayId,
        settlementRef: data.settlementRef,
        grossAmount: data.grossAmount,
        feeAmount: data.feeAmount,
        netAmount: data.netAmount,
        currencyConceptId: data.currencyConceptId,
        settledAt: data.settledAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** La UNIQUE sobre `settlement_ref` es lo que impide importar dos veces el mismo lote. */
  findSettlementByRef(
    em: EntityManager,
    settlementRef: string,
  ): Promise<GatewaySettlements | null> {
    return em.findOne(GatewaySettlements, { settlementRef });
  }

  createSettlementLine(
    em: EntityManager,
    data: CreateSettlementLineData,
  ): SettlementLines {
    return em.create(
      SettlementLines,
      {
        settlementId: data.settlementId,
        paymentTransactionId: data.paymentTransactionId,
        refundId: data.refundId,
        amount: data.amount,
        feeAmount: data.feeAmount,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createPayout(em: EntityManager, data: CreatePayoutData): Payouts {
    return em.create(
      Payouts,
      {
        tenantId: data.tenantId,
        practiceId: data.practiceId,
        payeeTypeConceptId: data.payeeTypeConceptId,
        payeeRefId: data.payeeRefId,
        gatewayId: data.gatewayId,
        amount: data.amount,
        currencyConceptId: data.currencyConceptId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        statusConceptId: data.statusConceptId,
        scheduledAt: data.scheduledAt,
        executedAt: data.executedAt,
        gatewayPayoutRef: data.gatewayPayoutRef,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createPayoutItem(em: EntityManager, data: CreatePayoutItemData): PayoutItems {
    return em.create(
      PayoutItems,
      {
        payoutId: data.payoutId,
        sourceTypeConceptId: data.sourceTypeConceptId,
        sourceRefId: data.sourceRefId,
        amount: data.amount,
        commissionAmount: data.commissionAmount,
        description: data.description,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createReconciliationRun(
    em: EntityManager,
    data: CreateReconciliationRunData,
  ): PaymentsReconciliationRuns {
    return em.create(
      PaymentsReconciliationRuns,
      {
        tenantId: data.tenantId,
        gatewayId: data.gatewayId,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        statusConceptId: data.statusConceptId,
        startedAt: data.startedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createReconciliationRecord(
    em: EntityManager,
    data: {
      gatewayConnectionId: string;
      reconciliationRunId: string;
      paymentTransactionId?: string;
      externalTransactionId: string;
      providerStatusCode: string;
      providerAmount: string;
      providerCurrencyCode: string;
      providerFeeAmount?: string;
      matchStatusConceptId: string;
      recordedAt: Date;
    },
  ): ProviderReconciliationRecords {
    return em.create(
      ProviderReconciliationRecords,
      {
        gatewayConnectionId: data.gatewayConnectionId,
        reconciliationRunId: data.reconciliationRunId,
        paymentTransactionId: data.paymentTransactionId,
        externalTransactionId: data.externalTransactionId,
        providerStatusCode: data.providerStatusCode,
        providerAmount: data.providerAmount,
        providerCurrencyCode: data.providerCurrencyCode,
        providerFeeAmount: data.providerFeeAmount,
        matchStatusConceptId: data.matchStatusConceptId,
        recordedAt: data.recordedAt,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  createReconciliationException(
    em: EntityManager,
    data: CreateReconciliationExceptionData,
  ): ReconciliationExceptions {
    return em.create(
      ReconciliationExceptions,
      {
        reconciliationRunId: data.reconciliationRunId,
        exceptionTypeConceptId: data.exceptionTypeConceptId,
        paymentTransactionId: data.paymentTransactionId,
        externalRef: data.externalRef,
        amountDifference: data.amountDifference,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
