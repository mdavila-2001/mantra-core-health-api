import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  PaymentOperationsRepository,
  PaymentTransactionsRepository,
} from '../repositories';
import {
  CreateFeeScheduleDto,
  FeeScheduleResponseDto,
  ImportSettlementDto,
  SettlementResponseDto,
  CreatePayoutDto,
  PayoutResponseDto,
  CreateReconciliationRunDto,
  ReconciliationRunResponseDto,
} from '../dto';

const CURRENCY_CONCEPT: Readonly<Record<'BOB' | 'USD', string>> = {
  BOB: CONCEPTS.CURRENCY_BOB,
  USD: CONCEPTS.CURRENCY_USD,
};

/**
 * Operaciones de cierre: tarifas, liquidaciones, payouts y conciliación
 * (UC-42-10/12/13/14).
 */
@Injectable()
export class PaymentsOperationsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param operationsRepo - Valor de operations repo requerido por la operación.
   * @param transactionsRepo - Valor de transactions repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly operationsRepo: PaymentOperationsRepository,
    private readonly transactionsRepo: PaymentTransactionsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsOperationsService.name);
  }

  /**
   * UC-42-10: publica una versión del tarifario.
   *
   * Publicar es versionar: la versión vigente del mismo código pasa a `superseded`
   * en la misma transacción, de modo que nunca haya dos tarifas activas con el
   * mismo código compitiendo por aplicarse.
   */
  async createFeeSchedule(
    dto: CreateFeeScheduleDto,
    actor: AuthenticatedUser,
  ): Promise<FeeScheduleResponseDto> {
    this.logger.info(
      {
        operation: 'payments.fee-schedule.create',
        tenantId: dto.tenantId,
        code: dto.code,
      },
      'Publishing fee schedule',
    );

    if (dto.method === 'PERCENTAGE' && !dto.percentage) {
      throw new PreconditionFailedException(
        'Una tarifa porcentual exige `percentage`',
        {
          code: dto.code,
        },
      );
    }
    if (dto.method === 'FIXED' && !dto.fixedAmount) {
      throw new PreconditionFailedException(
        'Una tarifa fija exige `fixedAmount`',
        {
          code: dto.code,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const current = await this.operationsRepo.findFeeScheduleByCode(
        tx,
        dto.tenantId,
        dto.code,
        CONCEPTS.STATE_ACTIVE,
      );
      if (current) {
        current.stateConceptId = CONCEPTS.FEE_SUPERSEDED;
        touch(current, actor.id);
      }

      const schedule = this.operationsRepo.createFeeSchedule(tx, {
        tenantId: dto.tenantId,
        code: dto.code,
        name: dto.name,
        feeTypeConceptId:
          dto.feeType === 'GATEWAY'
            ? CONCEPTS.FEE_TYPE_GATEWAY
            : CONCEPTS.FEE_TYPE_PLATFORM,
        calculationMethodConceptId:
          dto.method === 'PERCENTAGE'
            ? CONCEPTS.FEE_METHOD_PERCENTAGE
            : CONCEPTS.FEE_METHOD_FIXED,
        percentage: dto.percentage,
        fixedAmount: dto.fixedAmount,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        actorUserId: actor.id,
      });

      return {
        id: schedule.id,
        code: dto.code,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        supersededId: current?.id,
      };
    });
  }

  /**
   * UC-42-12: importa la liquidación del gateway.
   *
   * La referencia del lote es única: reimportar el mismo extracto devuelve el
   * registro existente en vez de duplicar líneas y volver a mover estados.
   */
  async importSettlement(
    dto: ImportSettlementDto,
    actor: AuthenticatedUser,
  ): Promise<SettlementResponseDto> {
    this.logger.info(
      {
        operation: 'payments.settlement.import',
        settlementRef: dto.settlementRef,
      },
      'Importing gateway settlement',
    );

    const existing = await this.operationsRepo.findSettlementByRef(
      this.em,
      dto.settlementRef,
    );
    if (existing) {
      return {
        id: existing.id,
        settlementRef: dto.settlementRef,
        lineCount: 0,
        settledTransactions: 0,
        duplicate: true,
      };
    }

    return this.em.transactional(async (tx) => {
      const settlement = this.operationsRepo.createSettlement(tx, {
        gatewayId: dto.gatewayId,
        settlementRef: dto.settlementRef,
        grossAmount: dto.grossAmount,
        feeAmount: dto.feeAmount,
        netAmount: dto.netAmount,
        currencyConceptId: CURRENCY_CONCEPT[dto.currency],
        settledAt: dto.settledAt ? new Date(dto.settledAt) : new Date(),
        statusConceptId: CONCEPTS.SETTLEMENT_SETTLED,
        actorUserId: actor.id,
      });

      let settledTransactions = 0;
      for (const line of dto.lines) {
        this.operationsRepo.createSettlementLine(tx, {
          settlementId: settlement.id,
          paymentTransactionId: line.paymentTransactionId,
          refundId: line.refundId,
          amount: line.amount,
          feeAmount: line.feeAmount,
          actorUserId: actor.id,
        });

        if (line.paymentTransactionId) {
          const transaction = await this.transactionsRepo.findByIdForUpdate(
            tx,
            line.paymentTransactionId,
          );
          // Una línea puede referirse a una transacción de otro entorno; se omite
          // en vez de abortar toda la importación del lote.
          if (transaction) {
            transaction.statusConceptId = CONCEPTS.TXN_SETTLED;
            touch(transaction, actor.id);
            settledTransactions += 1;
          }
        }
      }

      return {
        id: settlement.id,
        settlementRef: dto.settlementRef,
        lineCount: dto.lines.length,
        settledTransactions,
        duplicate: false,
      };
    });
  }

  /**
   * UC-42-13: ejecuta el payout a la cuenta conectada.
   *
   * El importe del payout es la suma de sus ítems menos las comisiones: se deriva
   * aquí en vez de aceptarlo del cliente para que no pueda descuadrar con el detalle.
   */
  async executePayout(
    dto: CreatePayoutDto,
    actor: AuthenticatedUser,
  ): Promise<PayoutResponseDto> {
    this.logger.info(
      {
        operation: 'payments.payout.execute',
        tenantId: dto.tenantId,
        payeeRefId: dto.payeeRefId,
      },
      'Executing payout',
    );

    const total = dto.items.reduce(
      (sum, item) =>
        sum + Number(item.amount) - Number(item.commissionAmount ?? 0),
      0,
    );
    if (total <= 0) {
      throw new PreconditionFailedException(
        'El importe neto del payout debe ser positivo',
        {
          payeeRefId: dto.payeeRefId,
        },
      );
    }

    return this.em.transactional(async (tx) => {
      const payout = this.operationsRepo.createPayout(tx, {
        tenantId: dto.tenantId,
        payeeTypeConceptId: CONCEPTS.PAYOUT_PAYEE_ACCOUNT,
        payeeRefId: dto.payeeRefId,
        gatewayId: dto.gatewayId,
        amount: total.toFixed(2),
        currencyConceptId: CURRENCY_CONCEPT[dto.currency],
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        statusConceptId: CONCEPTS.PAYOUT_PAID,
        executedAt: new Date(),
        gatewayPayoutRef: dto.gatewayPayoutRef,
        actorUserId: actor.id,
      });

      for (const item of dto.items) {
        this.operationsRepo.createPayoutItem(tx, {
          payoutId: payout.id,
          sourceTypeConceptId: CONCEPTS.PAYOUT_SOURCE_TRANSACTION,
          sourceRefId: item.sourceRefId,
          amount: item.amount,
          commissionAmount: item.commissionAmount,
          description: item.description,
          actorUserId: actor.id,
        });
      }

      return {
        id: payout.id,
        amount: total.toFixed(2),
        itemCount: dto.items.length,
        statusConceptId: CONCEPTS.PAYOUT_PAID,
      };
    });
  }

  /**
   * UC-42-14: concilia el extracto del proveedor contra el ledger local.
   *
   * Cada registro sin contraparte local, o con importe distinto, abre una excepción
   * en vez de ajustarse solo: un descuadre se revisa, no se corrige en silencio.
   */
  async runReconciliation(
    dto: CreateReconciliationRunDto,
    actor: AuthenticatedUser,
  ): Promise<ReconciliationRunResponseDto> {
    this.logger.info(
      { operation: 'payments.reconciliation.run', gatewayId: dto.gatewayId },
      'Running reconciliation',
    );

    return this.em.transactional(async (tx) => {
      const run = this.operationsRepo.createReconciliationRun(tx, {
        tenantId: dto.tenantId,
        gatewayId: dto.gatewayId,
        periodStart: new Date(dto.periodStart),
        periodEnd: new Date(dto.periodEnd),
        statusConceptId: CONCEPTS.RECON_RUNNING,
        startedAt: new Date(),
        actorUserId: actor.id,
      });

      let matched = 0;
      let unmatched = 0;
      let exceptions = 0;
      let totalGateway = 0;
      let totalLedger = 0;

      for (const record of dto.providerRecords) {
        totalGateway += Number(record.providerAmount);

        const local = await this.transactionsRepo.findByGatewayRef(
          tx,
          record.externalTransactionId,
        );
        const isMatch = local !== null;
        if (isMatch) {
          matched += 1;
          totalLedger += Number(local.amount);
        } else {
          unmatched += 1;
        }

        this.operationsRepo.createReconciliationRecord(tx, {
          gatewayConnectionId: dto.gatewayConnectionId,
          reconciliationRunId: run.id,
          paymentTransactionId: local?.id,
          externalTransactionId: record.externalTransactionId,
          providerStatusCode: record.providerStatusCode,
          providerAmount: record.providerAmount,
          providerCurrencyCode: record.providerCurrencyCode,
          providerFeeAmount: record.providerFeeAmount,
          matchStatusConceptId: isMatch
            ? CONCEPTS.RECON_MATCHED
            : CONCEPTS.RECON_UNMATCHED,
          recordedAt: new Date(),
        });

        if (!isMatch) {
          this.operationsRepo.createReconciliationException(tx, {
            reconciliationRunId: run.id,
            exceptionTypeConceptId: CONCEPTS.RECON_EXC_MISSING_LEDGER,
            externalRef: record.externalTransactionId,
            amountDifference: record.providerAmount,
            statusConceptId: CONCEPTS.RECON_EXC_OPEN,
            actorUserId: actor.id,
          });
          exceptions += 1;
          continue;
        }

        const difference = Number(record.providerAmount) - Number(local.amount);
        if (difference !== 0) {
          this.operationsRepo.createReconciliationException(tx, {
            reconciliationRunId: run.id,
            exceptionTypeConceptId: CONCEPTS.RECON_EXC_AMOUNT_MISMATCH,
            paymentTransactionId: local.id,
            externalRef: record.externalTransactionId,
            amountDifference: difference.toFixed(2),
            statusConceptId: CONCEPTS.RECON_EXC_OPEN,
            actorUserId: actor.id,
          });
          exceptions += 1;
        }
      }

      run.matchedCount = matched;
      run.unmatchedCount = unmatched;
      run.totalGateway = totalGateway.toFixed(2);
      run.totalLedger = totalLedger.toFixed(2);
      run.statusConceptId = CONCEPTS.RECON_COMPLETED;
      run.finishedAt = new Date();
      touch(run, actor.id);

      if (exceptions > 0) {
        this.logger.warn(
          {
            operation: 'payments.reconciliation.run',
            runId: run.id,
            exceptions,
          },
          'Reconciliation completed with open exceptions',
        );
      }

      return {
        id: run.id,
        matchedCount: matched,
        unmatchedCount: unmatched,
        exceptionCount: exceptions,
        totalGateway: totalGateway.toFixed(2),
        totalLedger: totalLedger.toFixed(2),
        statusConceptId: CONCEPTS.RECON_COMPLETED,
      };
    });
  }
}
