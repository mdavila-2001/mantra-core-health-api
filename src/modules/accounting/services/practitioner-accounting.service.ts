import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import { LedgerService } from './ledger.service';
import { PracticeTenantLookupService } from '../../practice/services';
import { LedgerService as BillingLedgerService } from '../../billing/services';
import { NotificationsService } from '../../messaging/services';
import { Appointments, Encounters } from '../../clinical/entities';
import { Invoices } from '../../billing/entities';
import { BILL } from '../../billing/billing.concepts';
import {
  PaidConsultationDto,
  PaidConsultationsResponseDto,
  RegisterConsultationIncomeDto,
  RegisterSimpleEntryDto,
  PractitionerEntryResponseDto,
} from '../dto';

/**
 * Carril 18 — auto-servicio contable del doctor. Es una capa fina sobre
 * {@link LedgerService} (el motor de partida doble ya existente, sin
 * duplicarlo): resuelve la relación cita pagada → factura → asiento y adjunta
 * las validaciones de pertenencia que un `PRACTITIONER` necesita y que el
 * motor genérico (pensado para `SECURITY_ADMIN`) no tenía.
 */
@Injectable()
export class PractitionerAccountingService {
  constructor(
    private readonly em: EntityManager,
    private readonly ledgerService: LedgerService,
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly billingLedgerService: BillingLedgerService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(PractitionerAccountingService.name);
  }

  /** Exige perfil profesional y vinculación activa con `practiceId`. */
  private async assertOwnsPractice(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<string> {
    if (!actor.practitionerProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional asociado',
        { actorId: actor.id },
      );
    }
    const practiceIds =
      await this.practiceTenantLookup.findActivePracticeIdsForPractitioner(
        actor.practitionerProfileId,
      );
    if (!practiceIds.includes(practiceId)) {
      throw new PreconditionFailedException(
        'El profesional no tiene una vinculación activa con esa práctica',
        { practiceId },
      );
    }
    return actor.practitionerProfileId;
  }

  /**
   * UC de la spec "Asociar automáticamente los ingresos con las citas
   * pagadas": las facturas pagadas del profesional, en esa práctica, que
   * todavía no tienen un asiento contable que las refleje
   * (`invoices.transaction_id IS NULL`).
   */
  async listPaidConsultations(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<PaidConsultationsResponseDto> {
    const practitionerProfileId = await this.assertOwnsPractice(
      actor,
      practiceId,
    );
    const em = this.em.fork();

    const appointments = await em.find(Appointments, {
      practitionerProfileId,
    });
    if (appointments.length === 0) {
      return { items: [], count: 0 };
    }
    const appointmentIds = appointments.map((a) => a.id);
    const appointmentById = new Map(appointments.map((a) => [a.id, a]));

    const encounters = await em.find(Encounters, {
      appointmentId: { $in: appointmentIds },
    });
    if (encounters.length === 0) {
      return { items: [], count: 0 };
    }
    const encounterIds = encounters.map((e) => e.id);
    const encounterById = new Map(encounters.map((e) => [e.id, e]));

    const invoices = await em.find(Invoices, {
      encounterId: { $in: encounterIds },
      practiceId,
      statusConceptId: BILL.INVOICE_PAID,
      transactionId: null,
    });

    const items: PaidConsultationDto[] = invoices.map((invoice) => {
      const encounter = invoice.encounterId
        ? encounterById.get(invoice.encounterId)
        : undefined;
      const appointment = encounter?.appointmentId
        ? appointmentById.get(encounter.appointmentId)
        : undefined;
      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        encounterId: invoice.encounterId ?? null,
        appointmentId: appointment?.id ?? null,
        patientProfileId: invoice.patientProfileId,
        issueDate: invoice.issueDate,
        paidTotal: invoice.paidTotal ?? '0.00',
        currencyConceptId: invoice.currencyConceptId ?? null,
      };
    });

    return { items, count: items.length };
  }

  /**
   * Registra el ingreso de una consulta ya pagada. El importe sale de
   * `invoices.paid_total` (no del cliente): el asiento no puede reflejar un
   * monto distinto del efectivamente cobrado. Enlaza la factura al asiento
   * (`billing.LedgerService.postToLedger`, idempotente) y dispara una
   * notificación contable in-app.
   */
  async registerConsultationIncome(
    dto: RegisterConsultationIncomeDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerEntryResponseDto> {
    const practitionerProfileId = await this.assertOwnsPractice(
      actor,
      dto.practiceId,
    );

    const em = this.em.fork();
    const invoice = await em.findOne(Invoices, { id: dto.invoiceId });
    if (!invoice) {
      throw new ResourceNotFoundException('Factura no encontrada', {
        invoiceId: dto.invoiceId,
      });
    }
    if (invoice.practiceId !== dto.practiceId) {
      throw new PreconditionFailedException(
        'La factura no pertenece a esa práctica',
        { invoiceId: dto.invoiceId, practiceId: dto.practiceId },
      );
    }
    if (invoice.statusConceptId !== BILL.INVOICE_PAID) {
      throw new PreconditionFailedException(
        'La factura todavía no está pagada',
        { invoiceId: dto.invoiceId, status: invoice.statusConceptId },
      );
    }
    if (invoice.transactionId) {
      throw new ConflictException(
        'La factura ya tiene un asiento contable asociado',
        { invoiceId: dto.invoiceId, transactionId: invoice.transactionId },
      );
    }
    if (!invoice.encounterId) {
      throw new PreconditionFailedException(
        'La factura no está ligada a un encuentro clínico: no se puede confirmar que sea de este profesional',
        { invoiceId: dto.invoiceId },
      );
    }
    const encounter = await em.findOne(Encounters, {
      id: invoice.encounterId,
    });
    const appointment = encounter?.appointmentId
      ? await em.findOne(Appointments, { id: encounter.appointmentId })
      : null;
    const ownsConsultation =
      encounter?.primaryPractitionerId === practitionerProfileId ||
      appointment?.practitionerProfileId === practitionerProfileId;
    if (!ownsConsultation) {
      throw new PreconditionFailedException(
        'La consulta de esa factura no es de este profesional',
        { invoiceId: dto.invoiceId },
      );
    }

    const amount = invoice.paidTotal;
    if (!amount || Number(amount) <= 0) {
      throw new PreconditionFailedException(
        'La factura no registra un importe pagado',
        { invoiceId: dto.invoiceId },
      );
    }

    const created = await this.ledgerService.createDraft(
      {
        practiceId: dto.practiceId,
        transactionDate: dto.transactionDate,
        description:
          dto.description ??
          `Ingreso por consulta — factura ${invoice.invoiceNumber}`,
        sourceDocumentType: 'INVOICE',
        sourceDocumentId: invoice.id,
        lines: [
          { accountId: dto.debitAccountId, direction: 'DEBIT', amount },
          { accountId: dto.creditAccountId, direction: 'CREDIT', amount },
        ],
      },
      actor,
    );

    await this.billingLedgerService.postToLedger(
      invoice.id,
      { documentType: 'INVOICE', transactionId: created.id },
      actor,
    );

    if (dto.fileId) {
      await this.ledgerService.attachFile(
        created.id,
        { fileId: dto.fileId },
        actor,
      );
    }

    const notificationRequestId = await this.notifyAccounting(
      actor,
      created.id,
      `Registraste el ingreso de la consulta (factura ${invoice.invoiceNumber}) por ${amount}.`,
    );

    this.logger.info(
      {
        operation: 'accounting.practitioner.consultation-income',
        transactionId: created.id,
        invoiceId: invoice.id,
      },
      'Consultation income registered',
    );

    return {
      transactionId: created.id,
      transactionNumber: created.transactionNumber,
      status: created.status,
      totalAmount: created.totalAmount,
      invoiceId: invoice.id,
      notificationRequestId,
    };
  }

  /** Registra un gasto o un ingreso distinto de consultas, sin ligarlo a ninguna factura. */
  async registerSimpleEntry(
    dto: RegisterSimpleEntryDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerEntryResponseDto> {
    await this.assertOwnsPractice(actor, dto.practiceId);

    const created = await this.ledgerService.createDraft(
      {
        practiceId: dto.practiceId,
        transactionDate: dto.transactionDate,
        description: dto.description,
        sourceDocumentType: dto.kind,
        lines: [
          {
            accountId: dto.debitAccountId,
            direction: 'DEBIT',
            amount: dto.amount,
          },
          {
            accountId: dto.creditAccountId,
            direction: 'CREDIT',
            amount: dto.amount,
          },
        ],
      },
      actor,
    );

    if (dto.fileId) {
      await this.ledgerService.attachFile(
        created.id,
        { fileId: dto.fileId },
        actor,
      );
    }

    const label = dto.kind === 'EXPENSE' ? 'gasto' : 'ingreso';
    const notificationRequestId = await this.notifyAccounting(
      actor,
      created.id,
      `Registraste un ${label}: ${dto.description} (${dto.amount}).`,
    );

    return {
      transactionId: created.id,
      transactionNumber: created.transactionNumber,
      status: created.status,
      totalAmount: created.totalAmount,
      invoiceId: null,
      notificationRequestId,
    };
  }

  /**
   * Notificación contable in-app (spec: "Recibir notificaciones contables").
   * Usa el canal IN_APP sembrado (Carril 18) — nunca depende de un proveedor
   * externo, así que no hay envío que fingir.
   */
  private async notifyAccounting(
    actor: AuthenticatedUser,
    transactionId: string,
    payloadText: string,
  ): Promise<string | null> {
    const result = await this.notificationsService.createRequest(
      {
        channelId: MESSAGING_SEED.inAppChannelId,
        recipientUserId: actor.id,
        categoryConceptId: CONCEPTS.MSG_CATEGORY_ACCOUNTING,
        payloadJson: { text: payloadText, transactionId },
        relatedResourceType: 'accounting.journal_transactions',
        relatedResourceId: transactionId,
      },
      actor,
    );
    return result.suppressed ? null : result.id;
  }
}
