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

/**
 * Describe el contrato estructural de create fee schedule data.
 */
export interface CreateFeeScheduleData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a fee type concept.
   */
  feeTypeConceptId: string;
  /**
   * Identificador asociado a calculation method concept.
   */
  calculationMethodConceptId: string;
  /**
   * Valor de percentage mantenido por la instancia.
   */
  percentage?: string;
  /**
   * Valor de fixed amount mantenido por la instancia.
   */
  fixedAmount?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de min amount mantenido por la instancia.
   */
  minAmount?: string;
  /**
   * Valor de max amount mantenido por la instancia.
   */
  maxAmount?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a state concept.
   */
  stateConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create settlement data.
 */
export interface CreateSettlementData {
  /**
   * Identificador asociado a gateway.
   */
  gatewayId: string;
  /**
   * Valor de settlement ref mantenido por la instancia.
   */
  settlementRef: string;
  /**
   * Valor de gross amount mantenido por la instancia.
   */
  grossAmount: string;
  /**
   * Valor de fee amount mantenido por la instancia.
   */
  feeAmount: string;
  /**
   * Valor de net amount mantenido por la instancia.
   */
  netAmount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Valor de settled at mantenido por la instancia.
   */
  settledAt?: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create settlement line data.
 */
export interface CreateSettlementLineData {
  /**
   * Identificador asociado a settlement.
   */
  settlementId: string;
  /**
   * Identificador asociado a payment transaction.
   */
  paymentTransactionId?: string;
  /**
   * Identificador asociado a refund.
   */
  refundId?: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Valor de fee amount mantenido por la instancia.
   */
  feeAmount?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create payout data.
 */
export interface CreatePayoutData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a practice.
   */
  practiceId?: string;
  /**
   * Identificador asociado a payee type concept.
   */
  payeeTypeConceptId: string;
  /**
   * Identificador asociado a payee ref.
   */
  payeeRefId: string;
  /**
   * Identificador asociado a gateway.
   */
  gatewayId: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId: string;
  /**
   * Valor de period start mantenido por la instancia.
   */
  periodStart: Date;
  /**
   * Valor de period end mantenido por la instancia.
   */
  periodEnd: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de scheduled at mantenido por la instancia.
   */
  scheduledAt?: Date;
  /**
   * Valor de executed at mantenido por la instancia.
   */
  executedAt?: Date;
  /**
   * Valor de gateway payout ref mantenido por la instancia.
   */
  gatewayPayoutRef?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create payout item data.
 */
export interface CreatePayoutItemData {
  /**
   * Identificador asociado a payout.
   */
  payoutId: string;
  /**
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId: string;
  /**
   * Identificador asociado a source ref.
   */
  sourceRefId: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount: string;
  /**
   * Valor de commission amount mantenido por la instancia.
   */
  commissionAmount?: string;
  /**
   * Valor de description mantenido por la instancia.
   */
  description?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create reconciliation run data.
 */
export interface CreateReconciliationRunData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a gateway.
   */
  gatewayId: string;
  /**
   * Valor de period start mantenido por la instancia.
   */
  periodStart: Date;
  /**
   * Valor de period end mantenido por la instancia.
   */
  periodEnd: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de started at mantenido por la instancia.
   */
  startedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create reconciliation exception data.
 */
export interface CreateReconciliationExceptionData {
  /**
   * Identificador asociado a reconciliation run.
   */
  reconciliationRunId: string;
  /**
   * Identificador asociado a exception type concept.
   */
  exceptionTypeConceptId: string;
  /**
   * Identificador asociado a payment transaction.
   */
  paymentTransactionId?: string;
  /**
   * Valor de external ref mantenido por la instancia.
   */
  externalRef?: string;
  /**
   * Valor de amount difference mantenido por la instancia.
   */
  amountDifference?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de las operaciones de back-office: tarifas, liquidaciones,
 * payouts y conciliación. Todas son procesos de cierre sobre transacciones ya
 * existentes, por eso comparten repositorio en vez de tener uno por tabla.
 */
@Injectable()
export class PaymentOperationsRepository {
  /**
   * Crea create fee schedule.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create fee schedule conforme al contrato `FeeSchedules`.
   */
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

  /**
   * Crea create transaction fee.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create transaction fee conforme al contrato `TransactionFees`.
   */
  createTransactionFee(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a payment transaction.
       */
      paymentTransactionId: string;
      /**
       * Identificador asociado a fee schedule.
       */
      feeScheduleId?: string;
      /**
       * Identificador asociado a fee type concept.
       */
      feeTypeConceptId: string;
      /**
       * Valor de amount mantenido por la instancia.
       */
      amount: string;
      /**
       * Identificador asociado a currency concept.
       */
      currencyConceptId: string;
      /**
       * Identificador asociado a bearer type concept.
       */
      bearerTypeConceptId?: string;
      /**
       * Identificador asociado a actor user.
       */
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

  /**
   * Crea create settlement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create settlement conforme al contrato `GatewaySettlements`.
   */
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

  /**
   * Crea create settlement line.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create settlement line conforme al contrato `SettlementLines`.
   */
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

  /**
   * Crea create payout.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create payout conforme al contrato `Payouts`.
   */
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

  /**
   * Crea create payout item.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create payout item conforme al contrato `PayoutItems`.
   */
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

  /**
   * Crea create reconciliation run.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reconciliation run conforme al contrato `PaymentsReconciliationRuns`.
   */
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

  /**
   * Crea create reconciliation record.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reconciliation record conforme al contrato `ProviderReconciliationRecords`.
   */
  createReconciliationRecord(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a gateway connection.
       */
      gatewayConnectionId: string;
      /**
       * Identificador asociado a reconciliation run.
       */
      reconciliationRunId: string;
      /**
       * Identificador asociado a payment transaction.
       */
      paymentTransactionId?: string;
      /**
       * Identificador asociado a external transaction.
       */
      externalTransactionId: string;
      /**
       * Valor de provider status code mantenido por la instancia.
       */
      providerStatusCode: string;
      /**
       * Valor de provider amount mantenido por la instancia.
       */
      providerAmount: string;
      /**
       * Valor de provider currency code mantenido por la instancia.
       */
      providerCurrencyCode: string;
      /**
       * Valor de provider fee amount mantenido por la instancia.
       */
      providerFeeAmount?: string;
      /**
       * Identificador asociado a match status concept.
       */
      matchStatusConceptId: string;
      /**
       * Valor de recorded at mantenido por la instancia.
       */
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

  /**
   * Crea create reconciliation exception.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create reconciliation exception conforme al contrato `ReconciliationExceptions`.
   */
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
