import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { BillingErrorReason } from '../billing.error-reasons';
import {
  InvoicesRepository,
  PaymentsReceivedRepository,
} from '../repositories';
import {
  ApplyPaymentReceivedDto,
  PaymentReceivedResponseDto,
  AllocatedInvoiceDto,
} from '../dto';
import { BILL } from '../billing.concepts';
import { exactCents, fromCents, toCents } from '../money.util';
import { PracticeTenantLookupService } from '../../practice/services';
import {
  activeTenantId,
  assertDocumentInPractice,
  assertPracticeInTenant,
} from '../billing-scope';
import type { Invoices } from '../entities';

/** "No existe" de la factura asignada; la ajena responde idéntico. */
const INVOICE_NOT_FOUND = {
  message: 'Factura no encontrada',
  reason: BillingErrorReason.PAYMENT_RECEIVED_INVOICE_NOT_FOUND,
};

/**
 * UC-17-02: aplica un pago recibido con asignación multi-factura. Valida que la
 * suma asignada no exceda el monto, que cada factura exista y tenga saldo, y
 * actualiza `paid_total`/`balance`/estado de cada factura en la misma transacción.
 *
 * Alcance: la práctica del pago tiene que ser del tenant del contexto y cada
 * factura asignada tiene que ser de esa misma práctica; una ajena responde igual
 * que una inexistente y no se escribe nada. Los importes son decimales exactos:
 * la asignación es positiva, el descuento no es negativo y entre asignación y
 * descuento no superan ni el saldo de la factura ni el monto del pago.
 */
@Injectable()
export class PaymentsReceivedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param paymentsRepo - Valor de payments repo requerido por la operación.
   * @param invoicesRepo - Valor de invoices repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly paymentsRepo: PaymentsReceivedRepository,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PaymentsReceivedService.name);
  }

  /**
   * Ejecuta la operación apply.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de apply conforme al contrato `Promise<PaymentReceivedResponseDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async apply(
    dto: ApplyPaymentReceivedDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceivedResponseDto> {
    this.logger.info(
      {
        operation: 'billing.payment-received.apply',
        practiceId: dto.practiceId,
        actorId: actor.id,
      },
      'Applying received payment',
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
          BillingErrorReason.PAYMENT_RECEIVED_AMOUNT_NOT_POSITIVE,
        );
      }

      // Cada asignación y su descuento se validan antes de tocar nada. El
      // descuento reduce el saldo igual que la asignación, así que cuenta en el
      // mismo límite del pago: sin eso, un descuento de 99 cerraba una factura
      // de 100 con un pago de 1.
      const effects: Array<{ allocCents: number; discountCents: number }> = [];
      let effectCents = 0;
      for (const alloc of dto.allocations) {
        const allocCents = exactCents(alloc.allocatedAmount);
        if (allocCents === null || allocCents <= 0) {
          throw new PreconditionFailedException(
            'La asignación debe ser un importe positivo',
            {},
            BillingErrorReason.PAYMENT_RECEIVED_ALLOCATION_AMOUNT_INVALID,
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
            BillingErrorReason.PAYMENT_RECEIVED_DISCOUNT_AMOUNT_INVALID,
          );
        }
        effects.push({ allocCents, discountCents });
        effectCents += allocCents + discountCents;
      }
      if (effectCents > amountCents) {
        throw new PreconditionFailedException(
          'La suma asignada excede el monto del pago',
          { amount: dto.amount, allocated: fromCents(effectCents) },
          BillingErrorReason.PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_AMOUNT,
        );
      }

      // Las facturas se resuelven y se acotan a la práctica ANTES de crear el
      // pago: una ajena no deja ni la fila del pago.
      const invoices = new Map<string, Invoices>();
      for (const alloc of dto.allocations) {
        if (invoices.has(alloc.invoiceId)) continue;
        invoices.set(
          alloc.invoiceId,
          assertDocumentInPractice(
            await this.invoicesRepo.findById(tx, alloc.invoiceId),
            dto.practiceId,
            INVOICE_NOT_FOUND,
          ),
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
      for (const [index, alloc] of dto.allocations.entries()) {
        const invoice = invoices.get(alloc.invoiceId) as Invoices;
        const { allocCents, discountCents } = effects[index];
        // Carril 16, REQ-16-032: con una objeción abierta del paciente el
        // cobro está en pausa; la disputa resuelta lo libera sola.
        if (await this.invoicesRepo.hasOpenPatientObjection(tx, invoice.id)) {
          throw new PreconditionFailedException(
            'El cobro está en pausa mientras el paciente tenga una objeción abierta',
            { invoiceId: invoice.id },
            BillingErrorReason.PAYMENT_RECEIVED_INVOICE_ON_HOLD,
          );
        }
        const balanceCents = toCents(invoice.balance ?? '0');
        if (balanceCents <= 0) {
          throw new PreconditionFailedException(
            'La factura no tiene saldo pendiente',
            {
              invoiceId: invoice.id,
            },
            BillingErrorReason.PAYMENT_RECEIVED_INVOICE_NO_BALANCE,
          );
        }
        if (allocCents + discountCents > balanceCents) {
          throw new PreconditionFailedException(
            'La asignación excede el saldo de la factura',
            {
              invoiceId: invoice.id,
              balance: invoice.balance,
              allocated: alloc.allocatedAmount,
              discount: alloc.discountAmount,
            },
            BillingErrorReason.PAYMENT_RECEIVED_ALLOCATION_EXCEEDS_INVOICE_BALANCE,
          );
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

        const newPaidCents = toCents(invoice.paidTotal ?? '0') + allocCents;
        // Ya no hay `Math.max(0, …)`: la guarda de arriba garantiza que el
        // saldo no baja de cero, y un exceso no se oculta, se rechaza.
        const newBalanceCents = balanceCents - allocCents - discountCents;
        invoice.paidTotal = fromCents(newPaidCents);
        invoice.balance = fromCents(newBalanceCents);
        invoice.statusConceptId =
          newBalanceCents === 0
            ? BILL.INVOICE_PAID
            : BILL.INVOICE_PARTIALLY_PAID;
        touch(invoice, actor.id);

        affected.push({
          invoiceId: invoice.id,
          allocatedAmount: alloc.allocatedAmount,
          balance: invoice.balance,
          status: invoice.statusConceptId,
        });
      }

      this.logger.info(
        {
          operation: 'billing.payment-received.apply',
          paymentId: payment.id,
          allocations: affected.length,
        },
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
