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
import { assertResourceInTenant } from '../../../common/tenant/resource-scope';
import { BillingErrorReason } from '../billing.error-reasons';
import {
  InvoicesRepository,
  BillingDocumentLinksRepository,
  BillingLinkTargetsRepository,
} from '../repositories';
import { PracticeTenantLookupService } from '../../practice/services';
import {
  IssueInvoiceFromEncounterDto,
  InvoiceLineInputDto,
  CreditNoteDto,
  CreatePaymentPlanDto,
  InvoiceResponseDto,
  PaymentPlanResponseDto,
  ListInvoicesResponseDto,
  InvoiceDetailDto,
} from '../dto';
import { BILL } from '../billing.concepts';
import { exactCents, fromCents, toCents } from '../money.util';
import { validateLineAmounts } from '../billing-lines';
import {
  activeTenantId,
  assertDocumentInTenant,
  assertPracticeInTenant,
} from '../billing-scope';
import type { Invoices } from '../entities';
import {
  ChargeCapturesService,
  type ChargeRow,
} from './charge-captures.service';

/** "No existe" del encuentro origen de una factura; el ajeno o de otro paciente responde idéntico. */
const INVOICE_ENCOUNTER_NOT_FOUND = {
  message: 'Encuentro no encontrado',
  reason: BillingErrorReason.INVOICE_ENCOUNTER_NOT_FOUND,
};

/** "No existe" de la factura original de una nota de crédito; la ajena responde idéntico. */
const CREDIT_NOTE_ORIGINAL_NOT_FOUND = {
  message: 'Factura no encontrada',
  reason: BillingErrorReason.INVOICE_CREDIT_NOTE_ORIGINAL_NOT_FOUND,
};

/** "No existe" de la factura origen de un plan de pagos; la ajena responde idéntico. */
const PAYMENT_PLAN_SOURCE_NOT_FOUND = {
  message: 'Factura origen no encontrada',
  reason: BillingErrorReason.INVOICE_PAYMENT_PLAN_SOURCE_NOT_FOUND,
};

/** Tope de facturas por página cuando el cliente no pide uno (CV-12). */
const DEFAULT_INVOICES_PAGE_SIZE = 50;

/**
 * Casos de uso centrados en la factura de cliente (CxC): emisión desde cargos del
 * encuentro (UC-17-01), nota de crédito / castigo (UC-17-03) y plan de pagos
 * (UC-17-11). El servicio posee la unidad de trabajo: `em.transactional` y flush
 * del padre (factura) antes de crear hijos (líneas, vínculos), porque las FK son
 * columnas uuid planas que MikroORM no ordena.
 *
 * Alcance: la factura no tiene `tenant_id`; su tenant es el de su práctica. Toda
 * operación contrasta la práctica (o la factura cargada por UUID) con el tenant
 * del contexto antes de leer o escribir, y una ajena responde igual que una
 * inexistente. El tenant de los vínculos de documento sale del contexto, nunca
 * del cuerpo. Los importes de las líneas se validan con decimal exacto.
 */
@Injectable()
export class InvoicesService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param invoicesRepo - Valor de invoices repo requerido por la operación.
   * @param linksRepo - Valor de links repo requerido por la operación.
   * @param linkTargets - Lectura de los documentos que la factura vincula.
   * @param logger - Valor de logger requerido por la operación.
   * @param captures - Cargos devengados (día-cama / quirófano por tiempo) que la factura incorpora.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly invoicesRepo: InvoicesRepository,
    private readonly linksRepo: BillingDocumentLinksRepository,
    private readonly linkTargets: BillingLinkTargetsRepository,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly logger: PinoLogger,
    private readonly captures: ChargeCapturesService,
  ) {
    this.logger.setContext(InvoicesService.name);
  }

  /**
   * UC-17-01: emite una factura con sus líneas desde los cargos del encuentro.
   *
   * Con `chargeCaptureIds` incorpora además cargos devengados (día-cama /
   * quirófano por tiempo): cada uno genera su línea con la cantidad y el precio que
   * guardó y pasa a `INVOICED` **en la misma transacción** que la factura. Dos
   * facturas que pidan el mismo cargo a la vez se serializan por el bloqueo de
   * fila y la segunda recibe 409 `CHARGE_ALREADY_INVOICED`.
   */
  async issueFromEncounter(
    dto: IssueInvoiceFromEncounterDto,
    actor: AuthenticatedUser,
    correlationId?: string,
  ): Promise<InvoiceResponseDto> {
    this.logger.info(
      {
        operation: 'billing.invoice.issue',
        practiceId: dto.practiceId,
        actorId: actor.id,
      },
      'Issuing invoice from encounter',
    );
    // Carril 16, REQ-16-029: una factura que declara un reclamo a la
    // aseguradora (`claimId`) sería el cobro del precio completo de un
    // servicio que ya se reclamó. Los servicios con seguro se le facturan al
    // paciente desde la solicitud de seguro, con su parte calculada.
    if (dto.claimId) {
      throw new PreconditionFailedException(
        'Los servicios con seguro se facturan al paciente desde la solicitud de seguro, con su parte calculada',
        { claimId: dto.claimId },
        BillingErrorReason.INVOICE_LINE_SERVICE_ALREADY_CLAIMED,
      );
    }
    const tenantId = activeTenantId();
    const chargeIds = dto.chargeCaptureIds ?? [];
    return this.em.transactional(async (tx) => {
      await assertPracticeInTenant(
        this.practiceTenantLookup,
        dto.practiceId,
        tenantId,
      );
      // El encuentro origen se contrasta antes de escribir: una FK sólo
      // demuestra que existe, y vincular el de otra organización (o el de otro
      // paciente) colgaría la factura de un expediente ajeno.
      if (dto.encounterId) {
        const encounter = await this.linkTargets.findEncounter(
          tx,
          dto.encounterId,
        );
        assertResourceInTenant(
          encounter,
          encounter?.tenantId,
          tenantId,
          INVOICE_ENCOUNTER_NOT_FOUND,
        );
        if (encounter?.patientProfileId !== dto.patientProfileId) {
          throw new ResourceNotFoundException(
            INVOICE_ENCOUNTER_NOT_FOUND.message,
            undefined,
            INVOICE_ENCOUNTER_NOT_FOUND.reason,
          );
        }
      }
      // Cargos devengados: se cargan, se autorizan contra su cama y se validan ANTES de
      // calcular nada; un cargo ajeno responde como uno inexistente.
      let chargeRows: ChargeRow[] = [];
      if (chargeIds.length > 0) {
        if (!dto.encounterId)
          throw new PreconditionFailedException(
            'Los cargos devengados se facturan con el encuentro que los originó',
            { errors: [{ field: 'encounterId' }] },
            BillingErrorReason.CHARGE_NOT_OF_INVOICE,
          );
        chargeRows = await this.captures.loadForInvoice(
          tx,
          chargeIds,
          {
            practiceId: dto.practiceId,
            patientProfileId: dto.patientProfileId,
            encounterId: dto.encounterId,
          },
          actor,
        );
      }
      const clientLines = dto.lines ?? [];
      const lineInputs: InvoiceLineInputDto[] = [
        ...clientLines,
        ...chargeRows.map((row) => this.chargeLine(row)),
      ];
      if (lineInputs.length === 0)
        throw new PreconditionFailedException(
          'La factura necesita al menos una línea o un cargo devengado',
          { errors: [{ field: 'lines' }] },
          BillingErrorReason.INVOICE_LINES_REQUIRED,
        );
      const currencies = new Set(
        chargeRows.map((row) => row.currency_concept_id),
      );
      if (
        currencies.size > 1 ||
        (dto.currencyConceptId !== undefined &&
          currencies.size === 1 &&
          !currencies.has(dto.currencyConceptId))
      )
        throw new PreconditionFailedException(
          'Los cargos devengados están en otra moneda que la factura',
          { errors: [{ field: 'currencyConceptId' }] },
          BillingErrorReason.CHARGE_NOT_OF_INVOICE,
        );
      const currencyConceptId =
        dto.currencyConceptId ??
        chargeRows[0]?.currency_concept_id ??
        undefined;

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
          BillingErrorReason.INVOICE_NUMBER_ALREADY_EXISTS,
        );
      }

      // Totales derivados de las líneas (base = cantidad*precio - descuento).
      let subtotalCents = 0;
      let taxCents = 0;
      let discountCents = 0;
      const lineTotals = lineInputs.map((l) => {
        const line = validateLineAmounts(l, {
          amount: BillingErrorReason.INVOICE_LINE_AMOUNT_INVALID,
          discountExceedsBase:
            BillingErrorReason.INVOICE_LINE_DISCOUNT_EXCEEDS_BASE,
        });
        subtotalCents += line.netCents;
        discountCents += line.discountCents;
        taxCents += line.taxCents;
        return fromCents(line.lineTotalCents);
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
        currencyConceptId,
        actorUserId: actor.id,
      });
      // FK planas: persistir la factura antes de las líneas y los vínculos.
      await tx.flush();

      const createdLines = lineInputs.map((l, i) =>
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
        }),
      );

      if (dto.encounterId || dto.claimId) {
        this.linksRepo.create(tx, {
          tenantId,
          relationTypeConceptId: BILL.REL_ENCOUNTER_OF,
          invoiceId: invoice.id,
          encounterId: dto.encounterId,
          claimId: dto.claimId,
          actorUserId: actor.id,
        });
      }

      if (chargeRows.length > 0) {
        // La base valida que la línea exista en la práctica del cargo: se persiste antes.
        await tx.flush();
        for (const [i, row] of chargeRows.entries()) {
          await this.captures.markInvoiced(
            tx,
            row,
            {
              invoiceId: invoice.id,
              invoiceLineId: createdLines[clientLines.length + i].id,
            },
            actor,
            correlationId,
          );
        }
      }

      this.logger.info(
        {
          operation: 'billing.invoice.issue',
          invoiceId: invoice.id,
          lines: lineInputs.length,
          chargeCaptures: chargeRows.length,
        },
        'Invoice issued',
      );
      return this.toResponse(invoice, lineInputs.length);
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
    const tenantId = activeTenantId();
    return this.em.transactional(async (tx) => {
      const original = await assertDocumentInTenant(
        this.practiceTenantLookup,
        await this.invoicesRepo.findById(tx, invoiceId),
        tenantId,
        CREDIT_NOTE_ORIGINAL_NOT_FOUND,
      );

      // Total del reverso (positivo); se registra en la NC con signo negativo.
      const reverseLines = dto.lines.map((l) =>
        validateLineAmounts(l, {
          amount: BillingErrorReason.CREDIT_NOTE_LINE_AMOUNT_INVALID,
        }),
      );
      const reverseCents = reverseLines.reduce(
        (acc, l) => acc + l.lineTotalCents,
        0,
      );
      if (reverseCents <= 0) {
        throw new PreconditionFailedException(
          'La nota de crédito debe revertir un importe positivo',
          undefined,
          BillingErrorReason.CREDIT_NOTE_LINE_AMOUNT_INVALID,
        );
      }

      const originalBalanceCents = toCents(original.balance ?? '0');
      if (reverseCents > originalBalanceCents && !dto.writeOff) {
        throw new PreconditionFailedException(
          'El monto de la nota de crédito excede el saldo de la factura',
          {
            invoiceId,
            reverse: fromCents(reverseCents),
            balance: original.balance,
          },
          BillingErrorReason.INVOICE_CREDIT_NOTE_EXCEEDS_BALANCE,
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

      dto.lines.forEach((l, i) => {
        const { baseCents, taxCents } = reverseLines[i];
        this.invoicesRepo.createLine(tx, {
          invoiceId: credit.id,
          description: l.description ?? dto.reason,
          quantity: l.quantity,
          unitPrice: fromCents(-(exactCents(l.unitPrice) ?? 0)),
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

      this.linksRepo.create(tx, {
        tenantId,
        relationTypeConceptId: BILL.REL_CREDIT_OF,
        invoiceId: credit.id,
        actorUserId: actor.id,
      });

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
    const tenantId = activeTenantId();
    return this.em.transactional(async (tx) => {
      const source = await assertDocumentInTenant(
        this.practiceTenantLookup,
        await this.invoicesRepo.findById(tx, dto.sourceInvoiceId),
        tenantId,
        PAYMENT_PLAN_SOURCE_NOT_FOUND,
      );

      const balanceCents = toCents(source.balance ?? '0');
      if (balanceCents <= 0) {
        throw new PreconditionFailedException(
          'La factura origen no tiene saldo',
          {
            invoiceId: source.id,
          },
          BillingErrorReason.INVOICE_PAYMENT_PLAN_SOURCE_NO_BALANCE,
        );
      }

      const installmentsCents = dto.installments.reduce((acc, i) => {
        const cents = exactCents(i.amount);
        if (cents === null || cents <= 0) {
          throw new PreconditionFailedException(
            'Cada cuota del plan debe ser un importe positivo',
            undefined,
            BillingErrorReason.INVOICE_PAYMENT_PLAN_INSTALLMENT_AMOUNT_INVALID,
          );
        }
        return acc + cents;
      }, 0);
      if (installmentsCents !== balanceCents) {
        throw new PreconditionFailedException(
          'La suma de cuotas debe igualar el saldo de la factura',
          {
            balance: source.balance,
            installments: fromCents(installmentsCents),
          },
          BillingErrorReason.INVOICE_PAYMENT_PLAN_INSTALLMENTS_MISMATCH,
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
        this.linksRepo.create(tx, {
          tenantId,
          relationTypeConceptId: BILL.REL_INSTALLMENT_OF,
          invoiceId: child.id,
          actorUserId: actor.id,
        });
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
   * Línea de factura de un cargo devengado: su cantidad y su precio, tal como los
   * guardó el devengo (foto de la tarifa de ese día).
   */
  private chargeLine(row: ChargeRow): InvoiceLineInputDto {
    const isOrTime = row.source_kind_concept_id === BILL.CHG_SRC_OR_TIME;
    const line = new InvoiceLineInputDto();
    line.serviceId = row.service_catalog_id ?? undefined;
    line.description = isOrTime
      ? `Uso de quirófano ${row.service_date} (${row.quantity} u.)`
      : row.minimum_stay_charge
        ? `Día-cama mínimo ${row.service_date}`
        : `Día-cama ${row.service_date}`;
    line.quantity = row.quantity;
    line.unitPrice = this.moneyOf(row.unit_price ?? '0');
    line.costCenterId = row.cost_center_id ?? undefined;
    return line;
  }

  /** `350.000000` → `350.00`; un precio con más de dos decimales significativos queda tal cual y la validación lo rechaza. */
  private moneyOf(price: string): string {
    const [whole, fraction = ''] = price.split('.');
    return /^0*$/.test(fraction.slice(2))
      ? `${whole}.${fraction.slice(0, 2).padEnd(2, '0')}`
      : price;
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
