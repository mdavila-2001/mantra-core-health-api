import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FxRateLocks,
  RiskAssessments,
  PaymentSplits,
  PaymentCheckoutSessions,
  CashierPaymentContexts,
  PaymentDebts,
} from '../entities';
import { createdBy } from '../../../common';

export interface CreateFxLockData {
  paymentIntentId: string;
  fromCurrencyConceptId: string;
  toCurrencyConceptId: string;
  lockedRate: string;
  providerRef?: string;
  lockedAt: Date;
  expiresAt?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateRiskAssessmentData {
  paymentIntentId: string;
  riskScore: string;
  riskLevelConceptId: string;
  decisionConceptId: string;
  providerRef?: string;
  signalsJson?: unknown;
  threeDsStatusConceptId?: string;
  assessedAt: Date;
  actorUserId?: string;
}

export interface CreateSplitData {
  paymentIntentId: string;
  payeeConnectedAccountId: string;
  splitTypeConceptId: string;
  amount?: string;
  percentage?: string;
  currencyConceptId?: string;
  isPlatformFee: boolean;
  destinationWalletId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

export interface CreateCheckoutSessionData {
  tenantId: string;
  gatewayConnectionId: string;
  paymentDebtId: string;
  paymentIntentId?: string;
  sessionTokenHash: string;
  redirectUrl: string;
  successReturnUrl?: string;
  failureReturnUrl?: string;
  expiresAt: Date;
  statusConceptId: string;
  openedAt: Date;
  actorUserId?: string;
}

export interface CreateCashierContextData {
  tenantId: string;
  paymentCheckoutSessionId: string;
  cashierUserId?: string;
  cashRegisterId?: string;
  siteId?: string;
  shiftReference?: string;
  workstationReference?: string;
}

/**
 * Acceso a datos de las tablas satélite del flujo de cobro: bloqueos de cambio,
 * evaluaciones de riesgo, splits, sesiones de checkout y deudas. Se agrupan
 * porque ninguna es raíz de agregado por sí sola: todas cuelgan del intent o de
 * la sesión y siempre se escriben dentro de la misma transacción que estos.
 */
@Injectable()
export class PaymentFlowRepository {
  createFxLock(em: EntityManager, data: CreateFxLockData): FxRateLocks {
    return em.create(
      FxRateLocks,
      {
        paymentIntentId: data.paymentIntentId,
        fromCurrencyConceptId: data.fromCurrencyConceptId,
        toCurrencyConceptId: data.toCurrencyConceptId,
        lockedRate: data.lockedRate,
        providerRef: data.providerRef,
        lockedAt: data.lockedAt,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Un intent no puede tener dos bloqueos vigentes a la vez (UC-42-03). */
  findActiveFxLock(
    em: EntityManager,
    paymentIntentId: string,
    activeStatusConceptId: string,
  ): Promise<FxRateLocks | null> {
    return em.findOne(FxRateLocks, {
      paymentIntentId,
      statusConceptId: activeStatusConceptId,
    });
  }

  createRiskAssessment(
    em: EntityManager,
    data: CreateRiskAssessmentData,
  ): RiskAssessments {
    return em.create(
      RiskAssessments,
      {
        paymentIntentId: data.paymentIntentId,
        riskScore: data.riskScore,
        riskLevelConceptId: data.riskLevelConceptId,
        decisionConceptId: data.decisionConceptId,
        providerRef: data.providerRef,
        signalsJson: data.signalsJson,
        threeDsStatusConceptId: data.threeDsStatusConceptId,
        assessedAt: data.assessedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /** Última evaluación de riesgo del intent; la decisión gobierna si se puede cobrar. */
  findLatestRiskAssessment(
    em: EntityManager,
    paymentIntentId: string,
  ): Promise<RiskAssessments | null> {
    return em.findOne(
      RiskAssessments,
      { paymentIntentId },
      { orderBy: { assessedAt: 'DESC' } },
    );
  }

  createSplit(em: EntityManager, data: CreateSplitData): PaymentSplits {
    return em.create(
      PaymentSplits,
      {
        paymentIntentId: data.paymentIntentId,
        payeeConnectedAccountId: data.payeeConnectedAccountId,
        splitTypeConceptId: data.splitTypeConceptId,
        amount: data.amount,
        percentage: data.percentage,
        currencyConceptId: data.currencyConceptId,
        isPlatformFee: data.isPlatformFee,
        destinationWalletId: data.destinationWalletId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  findSplitsByIntent(
    em: EntityManager,
    paymentIntentId: string,
  ): Promise<PaymentSplits[]> {
    return em.find(PaymentSplits, { paymentIntentId });
  }

  createCheckoutSession(
    em: EntityManager,
    data: CreateCheckoutSessionData,
  ): PaymentCheckoutSessions {
    return em.create(
      PaymentCheckoutSessions,
      {
        tenantId: data.tenantId,
        gatewayConnectionId: data.gatewayConnectionId,
        paymentDebtId: data.paymentDebtId,
        paymentIntentId: data.paymentIntentId,
        sessionTokenHash: data.sessionTokenHash,
        redirectUrl: data.redirectUrl,
        successReturnUrl: data.successReturnUrl,
        failureReturnUrl: data.failureReturnUrl,
        expiresAt: data.expiresAt,
        statusConceptId: data.statusConceptId,
        openedAt: data.openedAt,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createCashierContext(
    em: EntityManager,
    data: CreateCashierContextData,
  ): CashierPaymentContexts {
    return em.create(
      CashierPaymentContexts,
      {
        tenantId: data.tenantId,
        paymentCheckoutSessionId: data.paymentCheckoutSessionId,
        cashierUserId: data.cashierUserId,
        cashRegisterId: data.cashRegisterId,
        siteId: data.siteId,
        shiftReference: data.shiftReference,
        workstationReference: data.workstationReference,
        createdAt: new Date(),
      },
      { partial: true },
    );
  }

  /** Bloquea la deuda antes de moverla a `in_checkout` (UC-42-02). */
  findDebtForUpdate(
    em: EntityManager,
    id: string,
  ): Promise<PaymentDebts | null> {
    return em.findOne(
      PaymentDebts,
      { id },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }
}
