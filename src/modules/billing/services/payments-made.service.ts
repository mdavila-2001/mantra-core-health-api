import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';
import { BillsRepository, PaymentsMadeRepository } from '../repositories';
import {
  ExecutePaymentMadeDto,
  PaymentMadeResponseDto,
  AllocatedBillDto,
} from '../dto';
import { BILL } from '../billing.concepts';
import { exactCents, fromCents, toCents } from '../money.util';
import { PracticeTenantLookupService } from '../../practice/services';
import {
  activeTenantId,
  assertDocumentInPractice,
  assertPracticeInTenant,
} from '../billing-scope';
import type { Bills } from '../entities';

/** "No existe" de la factura de proveedor asignada; la ajena responde idéntico. */
const BILL_NOT_FOUND = {
  message: 'Factura de proveedor no encontrada',
  reason: BillingErrorReason.PAYMENT_MADE_BILL_NOT_FOUND,
};

/** "No existe" del proveedor del pago; el ajeno responde idéntico. */
const VENDOR_NOT_FOUND = {
  message: 'Proveedor no encontrado',
  reason: BillingErrorReason.BILL_VENDOR_NOT_FOUND,
};

/**
 * UC-17-05: ejecuta un pago a proveedor con asignación multi-factura. Valida que
 * la suma asignada más la retención no exceda el monto, que cada factura de
 * proveedor exista y tenga saldo, y actualiza sus saldos/estados en la misma
 * transacción.
 *
 * Alcance: la práctica del pago tiene que ser del tenant del contexto; el
 * proveedor y cada factura de proveedor tienen que ser de esa misma práctica,
 * y una ajena responde igual que una inexistente sin escribir nada. Los
 * importes son decimales exactos: la asignación es positiva, el descuento y la
 * retención no son negativos, y asignación más descuento no superan el saldo.
 */
@Injectable()
export class PaymentsMadeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param paymentsRepo - Valor de payments repo requerido por la operación.
   * @param billsRepo - Valor de bills repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly paymentsRepo: PaymentsMadeRepository,
    private readonly billsRepo: BillsRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsMadeService.name);
  }

  /**
   * Ejecuta la operación execute.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de execute conforme al contrato `Promise<PaymentMadeResponseDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async execute(
    dto: ExecutePaymentMadeDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentMadeResponseDto> {
    this.logger.info(
      {
        operation: 'billing.payment-made.execute',
        practiceId: dto.practiceId,
        actorId: actor.id,
      },
      'Executing vendor payment',
    );
    const tenantId = activeTenantId();
    return this.em.transactional(async (tx) => {
      await assertPracticeInTenant(
        this.practiceTenantLookup,
        dto.practiceId,
        tenantId,
      );

      const amountCents = exactCents(dto.amount);
      if (amountCents === null || amountCents <= 0) {
        throw new PreconditionFailedException(
          'El monto del pago debe ser positivo',
          {},
          BillingErrorReason.PAYMENT_MADE_AMOUNT_NOT_POSITIVE,
        );
      }

      // Cada importe se valida antes de tocar nada. El descuento y la retención
      // cuentan en el mismo límite del pago que la asignación.
      const effects: Array<{ allocCents: number; discountCents: number }> = [];
      let effectCents = 0;
      for (const alloc of dto.allocations) {
        const allocCents = exactCents(alloc.allocatedAmount);
        if (allocCents === null || allocCents <= 0) {
          throw new PreconditionFailedException(
            'La asignación debe ser un importe positivo',
            {},
            BillingErrorReason.PAYMENT_MADE_ALLOCATION_AMOUNT_INVALID,
          );
        }
        const discountCents =
          alloc.discountAmount === undefined
            ? 0
            : exactCents(alloc.discountAmount);
        if (discountCents === null) {
          throw new PreconditionFailedException(
            'El descuento debe ser un importe no negativo',
            {},
            BillingErrorReason.PAYMENT_MADE_DISCOUNT_AMOUNT_INVALID,
          );
        }
        const withholdingCents =
          alloc.withholdingAmount === undefined
            ? 0
            : exactCents(alloc.withholdingAmount);
        if (withholdingCents === null) {
          throw new PreconditionFailedException(
            'La retención debe ser un importe no negativo',
            {},
            BillingErrorReason.PAYMENT_MADE_WITHHOLDING_AMOUNT_INVALID,
          );
        }
        effects.push({ allocCents, discountCents });
        effectCents += allocCents + discountCents + withholdingCents;
      }
      if (effectCents > amountCents) {
        throw new PreconditionFailedException(
          'La suma asignada más retención excede el monto del pago',
          { amount: dto.amount, allocated: fromCents(effectCents) },
          BillingErrorReason.PAYMENT_MADE_ALLOCATION_EXCEEDS_AMOUNT,
        );
      }

      // Proveedor y facturas se resuelven y se acotan a la práctica ANTES de
      // crear el pago: uno ajeno no deja ni la fila del pago.
      if (dto.vendorId) {
        assertDocumentInPractice(
          await this.billsRepo.findVendor(tx, dto.vendorId),
          dto.practiceId,
          VENDOR_NOT_FOUND,
        );
      }
      const bills = new Map<string, Bills>();
      for (const alloc of dto.allocations) {
        if (bills.has(alloc.billId)) continue;
        bills.set(
          alloc.billId,
          assertDocumentInPractice(
            await this.billsRepo.findById(tx, alloc.billId),
            dto.practiceId,
            BILL_NOT_FOUND,
          ),
        );
      }

      const payment = this.paymentsRepo.create(tx, {
        practiceId: dto.practiceId,
        vendorId: dto.vendorId,
        amount: dto.amount,
        methodConceptId: dto.methodConceptId ?? BILL.METHOD_TRANSFER,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        companyBankAccountId: dto.companyBankAccountId,
        statusConceptId: BILL.PAYMENT_EXECUTED,
        actorUserId: actor.id,
      });
      await tx.flush();

      const affected: AllocatedBillDto[] = [];
      for (const [index, alloc] of dto.allocations.entries()) {
        const bill = bills.get(alloc.billId) as Bills;
        const { allocCents, discountCents } = effects[index];

        const balanceCents = toCents(bill.balance ?? '0');
        if (balanceCents <= 0) {
          throw new PreconditionFailedException(
            'La factura de proveedor no tiene saldo',
            { billId: bill.id },
            BillingErrorReason.PAYMENT_MADE_BILL_NO_BALANCE,
          );
        }
        if (allocCents + discountCents > balanceCents) {
          throw new PreconditionFailedException(
            'La asignación excede el saldo de la factura de proveedor',
            {
              billId: bill.id,
              balance: bill.balance,
            },
            BillingErrorReason.PAYMENT_MADE_ALLOCATION_EXCEEDS_BILL_BALANCE,
          );
        }

        this.paymentsRepo.createAllocation(tx, {
          paymentMadeId: payment.id,
          billId: bill.id,
          openItemId: alloc.openItemId,
          allocatedAmount: alloc.allocatedAmount,
          discountAmount: alloc.discountAmount,
          withholdingAmount: alloc.withholdingAmount,
          currencyConceptId: bill.currencyConceptId,
          actorUserId: actor.id,
        });

        const newPaidCents = toCents(bill.paidTotal ?? '0') + allocCents;
        // Ya no hay `Math.max(0, …)`: la guarda de arriba garantiza que el
        // saldo no baja de cero, y un exceso no se oculta, se rechaza.
        const newBalanceCents = balanceCents - allocCents - discountCents;
        bill.paidTotal = fromCents(newPaidCents);
        bill.balance = fromCents(newBalanceCents);
        bill.statusConceptId =
          newBalanceCents === 0 ? BILL.BILL_PAID : BILL.BILL_PARTIALLY_PAID;
        touch(bill, actor.id);

        affected.push({
          billId: bill.id,
          allocatedAmount: alloc.allocatedAmount,
          balance: bill.balance,
          status: bill.statusConceptId,
        });
      }

      this.logger.info(
        {
          operation: 'billing.payment-made.execute',
          paymentId: payment.id,
          allocations: affected.length,
        },
        'Vendor payment executed',
      );
      return {
        id: payment.id,
        amount: payment.amount,
        status: payment.statusConceptId,
        allocations: affected,
      };
    });
  }
}
