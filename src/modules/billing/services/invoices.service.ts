import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  decodeKeysetCursor,
  encodeKeysetCursor,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import {
  InvoicesRepository,
  BillingDocumentLinksRepository,
} from '../repositories';
import { PracticeTenantLookupService } from '../../practice/services';
import {
  IssueInvoiceFromEncounterDto,
  CreditNoteDto,
  CreatePaymentPlanDto,
  InvoiceResponseDto,
  PaymentPlanResponseDto,
  ListInvoicesResponseDto,
  InvoiceDetailDto,
} from '../dto';
import { BILL } from '../billing.concepts';
import { fromCents, toCents } from '../money.util';
import type { Invoices } from '../entities';

/** Tope de facturas por página cuando el cliente no pide uno (CV-12). */
const DEFAULT_INVOICES_PAGE_SIZE = 50;

/**
 * Casos de uso centrados en la factura de cliente (CxC): emisión desde cargos del
 * encuentro (UC-17-01), nota de crédito / castigo (UC-17-03) y plan de pagos
 * (UC-17-11). El servicio posee la unidad de trabajo: `em.transactional` y flush
 * del padre (factura) antes de crear hijos (líneas, vínculos), porque las FK son
 * columnas uuid planas que MikroORM no ordena.
 */
@Injectable()
export class InvoicesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param invoicesRepo - Valor de invoices repo requerido por la operación.
   * @param linksRepo - Valor de links repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly linksRepo: BillingDocumentLinksRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InvoicesService.name);
  }

  /** UC-17-01: emite una factura con sus líneas desde los cargos del encuentro. */
  async issueFromEncounter(
    dto: IssueInvoiceFromEncounterDto,
    actor: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    this.logger.info(
      {
        operation: 'billing.invoice.issue',
        practiceId: dto.practiceId,
        actorId: actor.id,
      },
      'Issuing invoice from encounter',
    );
    return this.em.transactional(async (tx) => {
      const invoiceNumber = dto.invoiceNumber ?? this.generateNumber('INV');
      const clash = await this.invoicesRepo.findByNumber(
        tx,
        dto.practiceId,
        invoiceNumber,
      );
      if (clash) {
        throw new ConflictException(
          'El número de factura ya existe en la práctica',
          {
            invoiceNumber,
          },
        );
      }

      // Totales derivados de las líneas (base = cantidad*precio - descuento).
      let subtotalCents = 0;
      let taxCents = 0;
      let discountCents = 0;
      const lineTotals = dto.lines.map((l) => {
        const baseCents = Math.round(Number(l.quantity) * toCents(l.unitPrice));
        const discCents = l.discount ? toCents(l.discount) : 0;
        const taxAmtCents = l.taxAmount ? toCents(l.taxAmount) : 0;
        const netCents = baseCents - discCents;
        const lineTotalCents = netCents + taxAmtCents;
        subtotalCents += netCents;
        discountCents += discCents;
        taxCents += taxAmtCents;
        return fromCents(lineTotalCents);
      });
      const totalCents = subtotalCents + taxCents;

      const invoice = this.invoicesRepo.create(tx, {
        practiceId: dto.practiceId,
        invoiceNumber,
        patientProfileId: dto.patientProfileId,
        encounterId: dto.encounterId,
        issueDate: dto.issueDate ? new Date(dto.issueDate) : new Date(),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        statusConceptId: BILL.INVOICE_ISSUED,
        subtotal: fromCents(subtotalCents),
        taxTotal: fromCents(taxCents),
        discountTotal: fromCents(discountCents),
        total: fromCents(totalCents),
        paidTotal: '0.00',
        balance: fromCents(totalCents),
        currencyConceptId: dto.currencyConceptId,
        actorUserId: actor.id,
      });
      // FK planas: persistir la factura antes de las líneas y los vínculos.
      await tx.flush();

      dto.lines.forEach((l, i) => {
        this.invoicesRepo.createLine(tx, {
          invoiceId: invoice.id,
          serviceId: l.serviceId,
          description: l.description,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          discount: l.discount,
          taxCodeId: l.taxCodeId,
          taxAmount: l.taxAmount,
          lineTotal: lineTotals[i],
          incomeAccountId: l.incomeAccountId,
          costCenterId: l.costCenterId,
          actorUserId: actor.id,
        });
      });

      if (dto.tenantId && (dto.encounterId || dto.claimId)) {
        this.linksRepo.create(tx, {
          tenantId: dto.tenantId,
          relationTypeConceptId: BILL.REL_ENCOUNTER_OF,
          invoiceId: invoice.id,
          encounterId: dto.encounterId,
          claimId: dto.claimId,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'billing.invoice.issue',
          invoiceId: invoice.id,
          lines: dto.lines.length,
        },
        'Invoice issued',
      );
      return this.toResponse(invoice, dto.lines.length);
    });
  }

  /** UC-17-03: emite una nota de crédito (reverso) y ajusta la factura original. */
  async creditNote(
    invoiceId: string,
    dto: CreditNoteDto,
    actor: AuthenticatedUser,
  ): Promise<InvoiceResponseDto> {
    this.logger.info(
      {
        operation: 'billing.invoice.credit-note',
        invoiceId,
        actorId: actor.id,
      },
      'Issuing credit note',
    );
    return this.em.transactional(async (tx) => {
      const original = await this.invoicesRepo.findById(tx, invoiceId);
      if (!original)
        throw new ResourceNotFoundException('Factura no encontrada', {
          invoiceId,
        });

      // Total del reverso (positivo); se registra en la NC con signo negativo.
      const reverseCents = dto.lines.reduce((acc, l) => {
        const baseCents = Math.round(Number(l.quantity) * toCents(l.unitPrice));
        const taxCents = l.taxAmount ? toCents(l.taxAmount) : 0;
        return acc + baseCents + taxCents;
      }, 0);

      const originalBalanceCents = toCents(original.balance ?? '0');
      if (reverseCents > originalBalanceCents && !dto.writeOff) {
        throw new PreconditionFailedException(
          'El monto de la nota de crédito excede el saldo de la factura',
          {
            invoiceId,
            reverse: fromCents(reverseCents),
            balance: original.balance,
          },
        );
      }

      const creditNumber = this.generateNumber('NC');
      const credit = this.invoicesRepo.create(tx, {
        practiceId: original.practiceId,
        invoiceNumber: creditNumber,
        patientProfileId: original.patientProfileId,
        encounterId: original.encounterId,
        issueDate: new Date(),
        statusConceptId: BILL.INVOICE_CREDIT_NOTE,
        subtotal: fromCents(-reverseCents),
        total: fromCents(-reverseCents),
        paidTotal: '0.00',
        balance: fromCents(-reverseCents),
        currencyConceptId: original.currencyConceptId,
        actorUserId: actor.id,
      });
      await tx.flush();

      dto.lines.forEach((l) => {
        const baseCents = Math.round(Number(l.quantity) * toCents(l.unitPrice));
        const taxCents = l.taxAmount ? toCents(l.taxAmount) : 0;
        this.invoicesRepo.createLine(tx, {
          invoiceId: credit.id,
          description: l.description ?? dto.reason,
          quantity: l.quantity,
          unitPrice: fromCents(-toCents(l.unitPrice)),
          taxAmount: l.taxAmount ? fromCents(-taxCents) : undefined,
          lineTotal: fromCents(-(baseCents + taxCents)),
          actorUserId: actor.id,
        });
      });

      // Ajusta la factura original: baja el saldo y marca ADJUSTED (o IN_COLLECTION si castigo total).
      const newBalanceCents = Math.max(0, originalBalanceCents - reverseCents);
      original.balance = fromCents(newBalanceCents);
      original.statusConceptId =
        newBalanceCents === 0 ? BILL.INVOICE_PAID : BILL.INVOICE_ADJUSTED;
      touch(original, actor.id);

      if (dto.tenantId) {
        this.linksRepo.create(tx, {
          tenantId: dto.tenantId,
          relationTypeConceptId: BILL.REL_CREDIT_OF,
          invoiceId: credit.id,
          actorUserId: actor.id,
        });
      }

      this.logger.info(
        {
          operation: 'billing.invoice.credit-note',
          creditId: credit.id,
          originalId: original.id,
        },
        'Credit note issued',
      );
      return this.toResponse(credit, dto.lines.length);
    });
  }

  /** UC-17-11: configura un plan de pagos generando facturas hijas por cuota. */
  async createPaymentPlan(
    dto: CreatePaymentPlanDto,
    actor: AuthenticatedUser,
  ): Promise<PaymentPlanResponseDto> {
    this.logger.info(
      {
        operation: 'billing.payment-plan.create',
        sourceInvoiceId: dto.sourceInvoiceId,
        actorId: actor.id,
      },
      'Creating payment plan',
    );
    return this.em.transactional(async (tx) => {
      const source = await this.invoicesRepo.findById(tx, dto.sourceInvoiceId);
      if (!source) {
        throw new ResourceNotFoundException('Factura origen no encontrada', {
          invoiceId: dto.sourceInvoiceId,
        });
      }

      const balanceCents = toCents(source.balance ?? '0');
      if (balanceCents <= 0) {
        throw new PreconditionFailedException(
          'La factura origen no tiene saldo',
          {
            invoiceId: source.id,
          },
        );
      }

      const installmentsCents = dto.installments.reduce(
        (acc, i) => acc + toCents(i.amount),
        0,
      );
      if (installmentsCents !== balanceCents) {
        throw new PreconditionFailedException(
          'La suma de cuotas debe igualar el saldo de la factura',
          {
            balance: source.balance,
            installments: fromCents(installmentsCents),
          },
        );
      }

      const created: Invoices[] = [];
      for (let i = 0; i < dto.installments.length; i++) {
        const inst = dto.installments[i];
        const number = `${source.invoiceNumber}-C${i + 1}-${randomUUID().slice(0, 6)}`;
        const child = this.invoicesRepo.create(tx, {
          practiceId: source.practiceId,
          invoiceNumber: number,
          patientProfileId: source.patientProfileId,
          issueDate: new Date(),
          dueDate: new Date(inst.dueDate),
          statusConceptId: BILL.INVOICE_ISSUED,
          subtotal: inst.amount,
          total: inst.amount,
          paidTotal: '0.00',
          balance: inst.amount,
          currencyConceptId: source.currencyConceptId,
          actorUserId: actor.id,
        });
        await tx.flush();
        if (dto.tenantId) {
          this.linksRepo.create(tx, {
            tenantId: dto.tenantId,
            relationTypeConceptId: BILL.REL_INSTALLMENT_OF,
            invoiceId: child.id,
            actorUserId: actor.id,
          });
        }
        created.push(child);
      }

      // La factura origen pasa a estado "plan de pagos".
      source.statusConceptId = BILL.INVOICE_PAYMENT_PLAN;
      touch(source, actor.id);

      this.logger.info(
        {
          operation: 'billing.payment-plan.create',
          sourceInvoiceId: source.id,
          installments: created.length,
        },
        'Payment plan created',
      );
      return {
        sourceInvoiceId: source.id,
        installmentCount: created.length,
        installments: created.map((c) => ({
          id: c.id,
          invoiceNumber: c.invoiceNumber,
          total: c.total ?? '0.00',
          dueDate: c.dueDate ? c.dueDate.toISOString().slice(0, 10) : '',
        })),
      };
    });
  }

  /**
   * CV-12 — página de facturas de la práctica, sin acción de cobro.
   *
   * Aislamiento: `practiceId` nunca es, por sí solo, un alcance de
   * autorización — es un parámetro que cualquiera puede escribir en la URL.
   * Antes de listar nada se confirma que esa práctica es del tenant del
   * actor (mismo puerto que usa `billing-service-catalog.service.ts`,
   * `PracticeTenantLookupService.findTenantOfPractice`); si no lo es, 404 sin
   * distinguir "no existe" de "es de otra organización".
   *
   * Proyección liviana (`InvoiceSummaryDto`): no calcula `lineCount` por fila
   * para no repetir el patrón N+1 que BR-30 pide cerrar (TX-27).
   */
  async listByPractice(
    practiceId: string,
    tenantId: string,
    options: { cursor?: string; limit?: number },
  ): Promise<ListInvoicesResponseDto> {
    await this.assertPracticeInTenant(practiceId, tenantId);
    const em = this.em.fork();
    const limit = options.limit ?? DEFAULT_INVOICES_PAGE_SIZE;
    const after = options.cursor
      ? decodeKeysetCursor(options.cursor)
      : undefined;
    const afterId = typeof after?.id === 'string' ? after.id : undefined;

    const rows = await this.invoicesRepo.findByPracticePage(
      em,
      practiceId,
      afterId,
      limit + 1,
    );
    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;
    const last = page.at(-1);

    return {
      items: page.map((invoice) => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        patientProfileId: invoice.patientProfileId,
        status: invoice.statusConceptId,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        total: invoice.total,
        balance: invoice.balance,
        createdAt: invoice.createdAt,
      })),
      count: page.length,
      limit,
      nextCursor: hasMore && last ? encodeKeysetCursor({ id: last.id }) : null,
    };
  }

  /**
   * CV-12 — detalle de una factura con sus líneas, acotado al tenant del
   * actor: una factura de otra práctica (propia o ajena al tenant) es 404, no
   * 403, para no confirmar que existe.
   */
  async getDetail(
    invoiceId: string,
    practiceId: string,
    tenantId: string,
  ): Promise<InvoiceDetailDto> {
    await this.assertPracticeInTenant(practiceId, tenantId);
    const em = this.em.fork();
    const invoice = await this.invoicesRepo.findById(em, invoiceId);
    if (!invoice || invoice.practiceId !== practiceId) {
      throw new ResourceNotFoundException('Factura no encontrada', {
        invoiceId,
      });
    }
    const lines = await this.invoicesRepo.findLinesByInvoice(em, invoiceId);
    return {
      ...this.toResponse(invoice, lines.length),
      lines: lines.map((line) => ({
        id: line.id,
        description: line.description,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discount: line.discount,
        taxAmount: line.taxAmount,
        lineTotal: line.lineTotal,
      })),
    };
  }

  /**
   * Confirma que `practiceId` pertenece a `tenantId` antes de leer nada.
   * 404 sin distinguir "no existe" de "es de otra organización": el
   * administrador de la clínica A nunca debe poder confirmar, ni por el
   * código de error, que una práctica de la clínica B existe.
   */
  private async assertPracticeInTenant(
    practiceId: string,
    tenantId: string,
  ): Promise<void> {
    const owner =
      await this.practiceTenantLookup.findTenantOfPractice(practiceId);
    if (owner !== tenantId) {
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    }
  }

  /**
   * Crea generate number.
   *
   * @param prefix - Valor de prefix requerido por la operación.
   * @returns Resultado de generate number conforme al contrato `string`.
   */
  private generateNumber(prefix: string): string {
    return `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}`;
  }

  /**
   * Transforma to response.
   *
   * @param invoice - Valor de invoice requerido por la operación.
   * @param lineCount - Valor de line count requerido por la operación.
   * @returns Resultado de to response conforme al contrato `InvoiceResponseDto`.
   */
  private toResponse(invoice: Invoices, lineCount: number): InvoiceResponseDto {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      patientProfileId: invoice.patientProfileId,
      status: invoice.statusConceptId,
      subtotal: invoice.subtotal,
      taxTotal: invoice.taxTotal,
      discountTotal: invoice.discountTotal,
      total: invoice.total,
      paidTotal: invoice.paidTotal,
      balance: invoice.balance,
      lineCount,
    };
  }
}
