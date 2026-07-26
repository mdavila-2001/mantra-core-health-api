import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  CONCEPTS,
  type AuthenticatedUser,
} from '../../../common';
import { BillsRepository, BillingDocumentLinksRepository } from '../repositories';
import { RegisterBillDto, BillResponseDto } from '../dto';
import { BILL } from '../billing.concepts';
import { fromCents, toCents } from '../money.util';

/**
 * UC-17-04: registra una factura de proveedor con verificación three-way match.
 * Valida que el vendor exista y esté activo, que no haya doble captura del mismo
 * `bill_number`, y que las líneas con orden de compra referencien su recepción de
 * bienes. Persiste cabecera y líneas en la misma transacción (flush intermedio).
 */
@Injectable()
export class BillsService {
  constructor(
    private readonly em: EntityManager,
    private readonly billsRepo: BillsRepository,
    private readonly linksRepo: BillingDocumentLinksRepository,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(BillsService.name);
  }

  async register(dto: RegisterBillDto, actor: AuthenticatedUser): Promise<BillResponseDto> {
    this.logger.info(
      { operation: 'billing.bill.register', vendorId: dto.vendorId, actorId: actor.id },
      'Registering vendor bill',
    );
    return this.em.transactional(async (tx) => {
      const vendor = await this.billsRepo.findVendor(tx, dto.vendorId);
      if (!vendor) throw new ResourceNotFoundException('Proveedor no encontrado', { vendorId: dto.vendorId });
      if (vendor.statusConceptId !== CONCEPTS.STATE_ACTIVE && vendor.statusConceptId !== CONCEPTS.TENANT_ACTIVE) {
        // El vendor debe estar activo para poder capturar su factura.
        throw new PreconditionFailedException('El proveedor no está activo', { vendorId: dto.vendorId });
      }

      const clash = await this.billsRepo.findByNumber(tx, dto.practiceId, dto.vendorId, dto.billNumber);
      if (clash) {
        throw new ConflictException('La factura del proveedor ya fue capturada', {
          billNumber: dto.billNumber,
        });
      }

      // Three-way match: una línea con orden de compra debe traer su recepción de bienes.
      for (const l of dto.lines) {
        if (l.purchaseOrderItemId && !l.goodsReceiptItemId) {
          throw new PreconditionFailedException(
            'Three-way match: la línea con orden de compra requiere recepción de bienes',
            { billNumber: dto.billNumber },
          );
        }
      }

      let subtotalCents = 0;
      let taxCents = 0;
      const lineTotals = dto.lines.map((l) => {
        const baseCents = Math.round(Number(l.quantity) * toCents(l.unitPrice));
        const taxAmtCents = l.taxAmount ? toCents(l.taxAmount) : 0;
        subtotalCents += baseCents;
        taxCents += taxAmtCents;
        return fromCents(baseCents + taxAmtCents);
      });
      const totalCents = subtotalCents + taxCents;

      const bill = this.billsRepo.create(tx, {
        practiceId: dto.practiceId,
        vendorId: dto.vendorId,
        billNumber: dto.billNumber,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        statusConceptId: BILL.BILL_RECEIVED,
        subtotal: fromCents(subtotalCents),
        taxTotal: fromCents(taxCents),
        total: fromCents(totalCents),
        paidTotal: '0.00',
        balance: fromCents(totalCents),
        currencyConceptId: dto.currencyConceptId,
        purchaseOrderId: dto.purchaseOrderId,
        contractId: dto.contractId,
        supplierSubledgerAccountId: vendor.supplierSubledgerAccountId,
        actorUserId: actor.id,
      });
      await tx.flush();

      dto.lines.forEach((l, i) => {
        this.billsRepo.createLine(tx, {
          billId: bill.id,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          taxAmount: l.taxAmount,
          lineTotal: lineTotals[i],
          expenseAccountId: l.expenseAccountId,
          costCenterId: l.costCenterId,
          purchaseOrderItemId: l.purchaseOrderItemId,
          goodsReceiptItemId: l.goodsReceiptItemId,
          serviceEntryItemId: l.serviceEntryItemId,
          actorUserId: actor.id,
        });
      });

      if (dto.tenantId && (dto.purchaseOrderId || dto.contractId)) {
        this.linksRepo.create(tx, {
          tenantId: dto.tenantId,
          relationTypeConceptId: BILL.REL_ENCOUNTER_OF,
          billId: bill.id,
          purchaseOrderId: dto.purchaseOrderId,
          contractId: dto.contractId,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        { operation: 'billing.bill.register', billId: bill.id, lines: dto.lines.length },
        'Vendor bill registered',
      );
      return {
        id: bill.id,
        billNumber: bill.billNumber,
        vendorId: bill.vendorId,
        status: bill.statusConceptId,
        subtotal: bill.subtotal,
        taxTotal: bill.taxTotal,
        total: bill.total,
        balance: bill.balance,
        lineCount: dto.lines.length,
      };
    });
  }
}
