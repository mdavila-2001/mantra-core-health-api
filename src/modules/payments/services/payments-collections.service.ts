import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  PageResponseDto,
  definedFilters,
  listTenantCollection,
} from '../../../common';
import {
  FeeSchedules,
  PaymentCheckoutSessions,
  PaymentIntents,
  PaymentsReconciliationRuns,
  Payouts,
} from '../entities';
import type {
  FeeScheduleItemDto,
  ListCheckoutSessionsQueryDto,
  ListFeeSchedulesQueryDto,
  ListIntentsQueryDto,
  ListPayoutsQueryDto,
  ListReconciliationRunsQueryDto,
  PaymentCheckoutSessionItemDto,
  PaymentIntentItemDto,
  PaymentsPayoutItemDto,
  PaymentsReconciliationRunItemDto,
} from '../dto';

/**
 * Lecturas de colección de `payments`.
 *
 * Cada listado se arma con `listTenantCollection`: el tenant sale del
 * contexto del request, los filtros del cliente se componen con él y la
 * salida pasa por un mapeo explícito. El rol lo exige el controlador.
 */
@Injectable()
export class PaymentsCollectionsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   */
  constructor(private readonly em: EntityManager) {}

  /**
   * Listar sesiones de cobro del tenant (V42-02).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listCheckoutSessions(
    query: ListCheckoutSessionsQueryDto,
  ): Promise<PageResponseDto<PaymentCheckoutSessionItemDto>> {
    return listTenantCollection(this.em.fork(), PaymentCheckoutSessions, {
      query,
      sortable: ['createdAt', 'updatedAt', 'completedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): PaymentCheckoutSessionItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        gatewayConnectionId: row.gatewayConnectionId,
        paymentDebtId: row.paymentDebtId,
        paymentIntentId: row.paymentIntentId ?? null,
        externalTransactionId: row.externalTransactionId ?? null,
        redirectUrl: row.redirectUrl,
        successReturnUrl: row.successReturnUrl ?? null,
        failureReturnUrl: row.failureReturnUrl ?? null,
        callbackEndpointId: row.callbackEndpointId ?? null,
        expiresAt: row.expiresAt,
        statusConceptId: row.statusConceptId,
        openedAt: row.openedAt ?? null,
        completedAt: row.completedAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar aranceles del tenant (V42-03).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listFeeSchedules(
    query: ListFeeSchedulesQueryDto,
  ): Promise<PageResponseDto<FeeScheduleItemDto>> {
    return listTenantCollection(this.em.fork(), FeeSchedules, {
      query,
      sortable: ['createdAt', 'updatedAt', 'name', 'code', 'validFrom'],
      where: definedFilters({ stateConceptId: query.stateConceptId }),
      map: (row): FeeScheduleItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        code: row.code,
        name: row.name,
        feeTypeConceptId: row.feeTypeConceptId,
        calculationMethodConceptId: row.calculationMethodConceptId,
        percentage: row.percentage ?? null,
        fixedAmount: row.fixedAmount ?? null,
        currencyConceptId: row.currencyConceptId ?? null,
        minAmount: row.minAmount ?? null,
        maxAmount: row.maxAmount ?? null,
        appliesToConceptId: row.appliesToConceptId ?? null,
        validFrom: row.validFrom ?? null,
        validTo: row.validTo ?? null,
        stateConceptId: row.stateConceptId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar intenciones de pago del tenant (V42-04).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listIntents(
    query: ListIntentsQueryDto,
  ): Promise<PageResponseDto<PaymentIntentItemDto>> {
    return listTenantCollection(this.em.fork(), PaymentIntents, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({
        practiceId: query.practiceId,
        statusConceptId: query.statusConceptId,
      }),
      map: (row): PaymentIntentItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        practiceId: row.practiceId ?? null,
        gatewayId: row.gatewayId,
        gatewayConnectionId: row.gatewayConnectionId ?? null,
        paymentMethodId: row.paymentMethodId ?? null,
        purposeConceptId: row.purposeConceptId,
        invoiceId: row.invoiceId ?? null,
        sourceRefType: row.sourceRefType ?? null,
        sourceRefId: row.sourceRefId ?? null,
        amount: row.amount,
        currencyConceptId: row.currencyConceptId,
        gatewayIntentRef: row.gatewayIntentRef ?? null,
        statusConceptId: row.statusConceptId,
        expiresAt: row.expiresAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar liquidaciones del tenant (V42-09).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listPayouts(
    query: ListPayoutsQueryDto,
  ): Promise<PageResponseDto<PaymentsPayoutItemDto>> {
    return listTenantCollection(this.em.fork(), Payouts, {
      query,
      sortable: ['createdAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): PaymentsPayoutItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        practiceId: row.practiceId ?? null,
        payeeTypeConceptId: row.payeeTypeConceptId,
        payeeRefId: row.payeeRefId,
        gatewayId: row.gatewayId,
        amount: row.amount,
        currencyConceptId: row.currencyConceptId,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        statusConceptId: row.statusConceptId,
        scheduledAt: row.scheduledAt ?? null,
        executedAt: row.executedAt ?? null,
        destinationRef: row.destinationRef ?? null,
        gatewayPayoutRef: row.gatewayPayoutRef ?? null,
        journalTransactionId: row.journalTransactionId ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }

  /**
   * Listar conciliaciones de pagos del tenant (V42-10).
   *
   * @param query - Paginación y filtros.
   * @returns Página acotada al tenant del contexto.
   */
  listReconciliationRuns(
    query: ListReconciliationRunsQueryDto,
  ): Promise<PageResponseDto<PaymentsReconciliationRunItemDto>> {
    return listTenantCollection(this.em.fork(), PaymentsReconciliationRuns, {
      query,
      sortable: ['createdAt', 'startedAt', 'updatedAt'],
      where: definedFilters({ statusConceptId: query.statusConceptId }),
      map: (row): PaymentsReconciliationRunItemDto => ({
        id: row.id,
        tenantId: row.tenantId,
        gatewayId: row.gatewayId,
        periodStart: row.periodStart,
        periodEnd: row.periodEnd,
        statusConceptId: row.statusConceptId,
        totalGateway: row.totalGateway ?? null,
        totalLedger: row.totalLedger ?? null,
        totalBank: row.totalBank ?? null,
        matchedCount: row.matchedCount ?? null,
        unmatchedCount: row.unmatchedCount ?? null,
        startedAt: row.startedAt ?? null,
        finishedAt: row.finishedAt ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    });
  }
}
