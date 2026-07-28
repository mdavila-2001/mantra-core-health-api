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

/**
 * Describe el contrato estructural de create fx lock data.
 */
export interface CreateFxLockData {
  /**
   * Identificador asociado a payment intent.
   */
  paymentIntentId: string;
  /**
   * Identificador asociado a from currency concept.
   */
  fromCurrencyConceptId: string;
  /**
   * Identificador asociado a to currency concept.
   */
  toCurrencyConceptId: string;
  /**
   * Valor de locked rate mantenido por la instancia.
   */
  lockedRate: string;
  /**
   * Valor de provider ref mantenido por la instancia.
   */
  providerRef?: string;
  /**
   * Valor de locked at mantenido por la instancia.
   */
  lockedAt: Date;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt?: Date;
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
 * Describe el contrato estructural de create risk assessment data.
 */
export interface CreateRiskAssessmentData {
  /**
   * Identificador asociado a payment intent.
   */
  paymentIntentId: string;
  /**
   * Valor de risk score mantenido por la instancia.
   */
  riskScore: string;
  /**
   * Identificador asociado a risk level concept.
   */
  riskLevelConceptId: string;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId: string;
  /**
   * Valor de provider ref mantenido por la instancia.
   */
  providerRef?: string;
  /**
   * Valor de signals json mantenido por la instancia.
   */
  signalsJson?: unknown;
  /**
   * Identificador asociado a three ds status concept.
   */
  threeDsStatusConceptId?: string;
  /**
   * Valor de assessed at mantenido por la instancia.
   */
  assessedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create split data.
 */
export interface CreateSplitData {
  /**
   * Identificador asociado a payment intent.
   */
  paymentIntentId: string;
  /**
   * Identificador asociado a payee connected account.
   */
  payeeConnectedAccountId: string;
  /**
   * Identificador asociado a split type concept.
   */
  splitTypeConceptId: string;
  /**
   * Valor de amount mantenido por la instancia.
   */
  amount?: string;
  /**
   * Valor de percentage mantenido por la instancia.
   */
  percentage?: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de is platform fee mantenido por la instancia.
   */
  isPlatformFee: boolean;
  /**
   * Identificador asociado a destination wallet.
   */
  destinationWalletId?: string;
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
 * Describe el contrato estructural de create checkout session data.
 */
export interface CreateCheckoutSessionData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a gateway connection.
   */
  gatewayConnectionId: string;
  /**
   * Identificador asociado a payment debt.
   */
  paymentDebtId: string;
  /**
   * Identificador asociado a payment intent.
   */
  paymentIntentId?: string;
  /**
   * Valor de session token hash mantenido por la instancia.
   */
  sessionTokenHash: string;
  /**
   * Valor de redirect url mantenido por la instancia.
   */
  redirectUrl: string;
  /**
   * Valor de success return url mantenido por la instancia.
   */
  successReturnUrl?: string;
  /**
   * Valor de failure return url mantenido por la instancia.
   */
  failureReturnUrl?: string;
  /**
   * Valor de expires at mantenido por la instancia.
   */
  expiresAt: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de opened at mantenido por la instancia.
   */
  openedAt: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Describe el contrato estructural de create cashier context data.
 */
export interface CreateCashierContextData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a payment checkout session.
   */
  paymentCheckoutSessionId: string;
  /**
   * Identificador asociado a cashier user.
   */
  cashierUserId?: string;
  /**
   * Identificador asociado a cash register.
   */
  cashRegisterId?: string;
  /**
   * Identificador asociado a site.
   */
  siteId?: string;
  /**
   * Valor de shift reference mantenido por la instancia.
   */
  shiftReference?: string;
  /**
   * Valor de workstation reference mantenido por la instancia.
   */
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
  /**
   * Crea create fx lock.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create fx lock conforme al contrato `FxRateLocks`.
   */
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

  /**
   * Crea create risk assessment.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create risk assessment conforme al contrato `RiskAssessments`.
   */
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

  /**
   * Crea create split.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create split conforme al contrato `PaymentSplits`.
   */
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

  /**
   * Obtiene find splits by intent.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param paymentIntentId - Identificador de payment intent.
   * @returns Resultado de find splits by intent conforme al contrato `Promise<PaymentSplits[]>`.
   */
  findSplitsByIntent(
    em: EntityManager,
    paymentIntentId: string,
  ): Promise<PaymentSplits[]> {
    return em.find(PaymentSplits, { paymentIntentId });
  }

  /**
   * Crea create checkout session.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create checkout session conforme al contrato `PaymentCheckoutSessions`.
   */
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

  /**
   * Crea create cashier context.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create cashier context conforme al contrato `CashierPaymentContexts`.
   */
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
