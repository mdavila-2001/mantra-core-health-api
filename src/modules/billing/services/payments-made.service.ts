import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { BillsRepository, PaymentsMadeRepository } from '../repositories';
import {
  ExecutePaymentMadeDto,
  PaymentMadeResponseDto,
  AllocatedBillDto,
} from '../dto';
import { BILL } from '../billing.concepts';
import { fromCents, toCents } from '../money.util';

/**
 * UC-17-05: ejecuta un pago a proveedor con asignación multi-factura. Valida que
 * la suma asignada más la retención no exceda el monto, que cada factura de
 * proveedor exista y tenga saldo, y actualiza sus saldos/estados en la misma
 * transacción.
 */
@Injectable()
export class PaymentsMadeService {
  constructor(
    private readonly em: EntityManager,
    private readonly paymentsRepo: PaymentsMadeRepository,
    private readonly billsRepo: BillsRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsMadeService.name);
  }

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
    return this.em.transactional(async (tx) => {
      const amountCents = toCents(dto.amount);
      if (amountCents <= 0) {
        throw new PreconditionFailedException(
          'El monto del pago debe ser positivo',
          { amount: dto.amount },
        );
      }

      const allocatedCents = dto.allocations.reduce(
        (acc, a) =>
          acc +
          toCents(a.allocatedAmount) +
          (a.withholdingAmount ? toCents(a.withholdingAmount) : 0),
        0,
      );
      if (allocatedCents > amountCents) {
        throw new PreconditionFailedException(
          'La suma asignada más retención excede el monto del pago',
          { amount: dto.amount, allocated: fromCents(allocatedCents) },
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
      for (const alloc of dto.allocations) {
        const bill = await this.billsRepo.findById(tx, alloc.billId);
        if (!bill)
          throw new ResourceNotFoundException(
            'Factura de proveedor no encontrada',
            { billId: alloc.billId },
          );

        const balanceCents = toCents(bill.balance ?? '0');
        const allocCents = toCents(alloc.allocatedAmount);
        if (balanceCents <= 0) {
          throw new PreconditionFailedException(
            'La factura de proveedor no tiene saldo',
            { billId: bill.id },
          );
        }
        if (allocCents > balanceCents) {
          throw new PreconditionFailedException(
            'La asignación excede el saldo de la factura de proveedor',
            {
              billId: bill.id,
              balance: bill.balance,
            },
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

        const discountCents = alloc.discountAmount
          ? toCents(alloc.discountAmount)
          : 0;
        const newPaidCents = toCents(bill.paidTotal ?? '0') + allocCents;
        const newBalanceCents = Math.max(
          0,
          balanceCents - allocCents - discountCents,
        );
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
