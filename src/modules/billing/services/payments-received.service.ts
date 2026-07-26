import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { InvoicesRepository, PaymentsReceivedRepository } from '../repositories';
import {
  ApplyPaymentReceivedDto,
  PaymentReceivedResponseDto,
  AllocatedInvoiceDto,
} from '../dto';
import { BILL } from '../billing.concepts';
import { fromCents, toCents } from '../money.util';

/**
 * UC-17-02: aplica un pago recibido con asignación multi-factura. Valida que la
 * suma asignada no exceda el monto, que cada factura exista y tenga saldo, y
 * actualiza `paid_total`/`balance`/estado de cada factura en la misma transacción.
 */
@Injectable()
export class PaymentsReceivedService {
  constructor(
    private readonly em: EntityManager,
    private readonly paymentsRepo: PaymentsReceivedRepository,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsReceivedService.name);
  }

  async apply(
    dto: ApplyPaymentReceivedDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceivedResponseDto> {
    this.logger.info(
      { operation: 'billing.payment-received.apply', practiceId: dto.practiceId, actorId: actor.id },
      'Applying received payment',
    );
    return this.em.transactional(async (tx) => {
      const amountCents = toCents(dto.amount);
      if (amountCents <= 0) {
        throw new PreconditionFailedException('El monto del pago debe ser positivo', {
          amount: dto.amount,
        });
      }

      const allocatedCents = dto.allocations.reduce((acc, a) => acc + toCents(a.allocatedAmount), 0);
      if (allocatedCents > amountCents) {
        throw new PreconditionFailedException(
          'La suma asignada excede el monto del pago',
          { amount: dto.amount, allocated: fromCents(allocatedCents) },
        );
      }

      const payment = this.paymentsRepo.create(tx, {
        practiceId: dto.practiceId,
        patientProfileId: dto.patientProfileId,
        amount: dto.amount,
        methodConceptId: dto.methodConceptId ?? BILL.METHOD_CASH,
        receivedAt: dto.receivedAt ? new Date(dto.receivedAt) : new Date(),
        reference: dto.reference,
        companyBankAccountId: dto.companyBankAccountId,
        statusConceptId: BILL.PAYMENT_CLEARED,
        actorUserId: actor.id,
      });
      // FK planas: el pago debe existir antes de las asignaciones.
      await tx.flush();

      const affected: AllocatedInvoiceDto[] = [];
      for (const alloc of dto.allocations) {
        const invoice = await this.invoicesRepo.findById(tx, alloc.invoiceId);
        if (!invoice) {
          throw new ResourceNotFoundException('Factura no encontrada', { invoiceId: alloc.invoiceId });
        }
        const balanceCents = toCents(invoice.balance ?? '0');
        const allocCents = toCents(alloc.allocatedAmount);
        if (balanceCents <= 0) {
          throw new PreconditionFailedException('La factura no tiene saldo pendiente', {
            invoiceId: invoice.id,
          });
        }
        if (allocCents > balanceCents) {
          throw new PreconditionFailedException('La asignación excede el saldo de la factura', {
            invoiceId: invoice.id,
            balance: invoice.balance,
            allocated: alloc.allocatedAmount,
          });
        }

        this.paymentsRepo.createAllocation(tx, {
          paymentReceivedId: payment.id,
          invoiceId: invoice.id,
          openItemId: alloc.openItemId,
          allocatedAmount: alloc.allocatedAmount,
          discountAmount: alloc.discountAmount,
          currencyConceptId: invoice.currencyConceptId,
          actorUserId: actor.id,
        });

        const discountCents = alloc.discountAmount ? toCents(alloc.discountAmount) : 0;
        const newPaidCents = toCents(invoice.paidTotal ?? '0') + allocCents;
        const newBalanceCents = Math.max(0, balanceCents - allocCents - discountCents);
        invoice.paidTotal = fromCents(newPaidCents);
        invoice.balance = fromCents(newBalanceCents);
        invoice.statusConceptId =
          newBalanceCents === 0 ? BILL.INVOICE_PAID : BILL.INVOICE_PARTIALLY_PAID;
        touch(invoice, actor.id);

        affected.push({
          invoiceId: invoice.id,
          allocatedAmount: alloc.allocatedAmount,
          balance: invoice.balance,
          status: invoice.statusConceptId,
        });
      }

      this.logger.info(
        { operation: 'billing.payment-received.apply', paymentId: payment.id, allocations: affected.length },
        'Received payment applied',
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
