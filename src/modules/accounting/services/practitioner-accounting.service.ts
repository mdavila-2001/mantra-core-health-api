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
import { AssetService } from './asset.service';
import { LiabilityService } from './liability.service';
import { buildAmortizationSchedule } from './liability-amortization';
import { ACCT } from '../accounting.concepts';
import { AssetRepository, LiabilityRepository, FiscalRepository } from '../repositories';
import { PracticeTenantLookupService } from '../../practice/services';
import { LedgerService as BillingLedgerService } from '../../billing/services';
import { NotificationsService } from '../../messaging/services';
import { Liabilities } from '../entities';
import { Appointments, Encounters } from '../../clinical/entities';
import { Invoices } from '../../billing/entities';
import { BILL } from '../../billing/billing.concepts';
import {
  PaidConsultationDto,
  PaidConsultationsResponseDto,
  RegisterConsultationIncomeDto,
  RegisterSimpleEntryDto,
  PractitionerEntryResponseDto,
  CapitalizeAssetDto,
  AssetResponseDto,
  AssetSummaryDto,
  SetAutomationDto,
  RegisterAssetProgressDto,
  CreateOwnLiabilityDto,
  LiabilityCreatedResponseDto,
  LiabilitySummaryDto,
  LiabilityScheduleDto,
  RegisterLiabilityProgressDto,
  ProgressRegisteredResponseDto,
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
    private readonly assetService: AssetService,
    private readonly liabilityService: LiabilityService,
    private readonly assetRepo: AssetRepository,
    private readonly liabilityRepo: LiabilityRepository,
    private readonly fiscalRepo: FiscalRepository,
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

  /* ============================================================================
      FT-26 — auto-servicio de activos y pasivos del doctor.

      Misma forma que el resto de este servicio: `assertOwnsPractice` primero,
      y después delegar en el motor genérico (`AssetService`/`LiabilityService`)
      en vez de reimplementar la partida doble. Lo nuevo de verdad es la
      creación de un pasivo con su cronograma —eso no existía para nadie,
      ni siquiera para `SECURITY_ADMIN`— y el interruptor de automatización.
      ========================================================================== */

  /** Exige que el activo exista y que su práctica sea del profesional. */
  private async assertOwnsAsset(
    actor: AuthenticatedUser,
    assetId: string,
  ): Promise<{ practiceId: string }> {
    const em = this.em.fork();
    const asset = await this.assetRepo.findById(em, assetId);
    if (!asset) {
      throw new ResourceNotFoundException('Activo no encontrado', { assetId });
    }
    await this.assertOwnsPractice(actor, asset.practiceId);
    return { practiceId: asset.practiceId };
  }

  /** Exige que el pasivo exista y que su práctica sea del profesional. */
  private async assertOwnsLiability(
    actor: AuthenticatedUser,
    liabilityId: string,
  ): Promise<{ practiceId: string; code: string }> {
    const em = this.em.fork();
    const liability = await this.liabilityRepo.findById(em, liabilityId);
    if (!liability) {
      throw new ResourceNotFoundException('Pasivo no encontrado', {
        liabilityId,
      });
    }
    await this.assertOwnsPractice(actor, liability.practiceId);
    return { practiceId: liability.practiceId, code: liability.code };
  }

  /** Los activos de la práctica, para el listado del auto-servicio. */
  async listAssets(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<readonly AssetSummaryDto[]> {
    await this.assertOwnsPractice(actor, practiceId);
    const em = this.em.fork();
    const assets = await this.assetRepo.listByPractice(em, practiceId);
    return assets.map((asset) => ({
      id: asset.id,
      code: asset.code,
      name: asset.name,
      statusConceptId: asset.statusConceptId,
      bookValue: asset.bookValue,
      acquisitionCost: asset.acquisitionCost,
      automated: asset.automated,
    }));
  }

  /** Da de alta un activo propio. Delega en {@link AssetService.capitalize} tal cual. */
  async capitalizeOwnAsset(
    dto: CapitalizeAssetDto,
    actor: AuthenticatedUser,
  ): Promise<AssetResponseDto> {
    await this.assertOwnsPractice(actor, dto.practiceId);
    return this.assetService.capitalize(dto, actor);
  }

  /** Prende o apaga la automatización de un activo propio. */
  async setAssetAutomation(
    assetId: string,
    dto: SetAutomationDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.assertOwnsAsset(actor, assetId);
    const em = this.em.fork();
    const asset = await this.assetRepo.setAutomated(em, assetId, dto.automated);
    if (!asset) {
      throw new ResourceNotFoundException('Activo no encontrado', { assetId });
    }
  }

  /**
   * "Registrar avance" de un activo: una corrida de depreciación acotada a
   * ESTE activo (`RunDepreciationDto.assetId`), sobre el período fiscal
   * abierto que cubre hoy — resuelto acá porque el profesional no tiene
   * cómo listar períodos fiscales (`accounting-fiscal.controller.ts` es
   * `SECURITY_ADMIN` puro). Corre tanto si `automated` está encendido como
   * apagado: el interruptor decide si ADEMÁS un proceso automático puede
   * correrla sola, no si el profesional puede pedirla a mano.
   */
  async registerAssetProgress(
    assetId: string,
    dto: RegisterAssetProgressDto,
    actor: AuthenticatedUser,
  ): Promise<ProgressRegisteredResponseDto> {
    const { practiceId } = await this.assertOwnsAsset(actor, assetId);
    const postingDate = dto.postingDate ? new Date(dto.postingDate) : new Date();

    const em = this.em.fork();
    const period = await this.fiscalRepo.findOpenPeriodForPractice(
      em,
      practiceId,
      postingDate,
      ACCT.PERIOD_OPEN,
    );
    if (!period) {
      throw new PreconditionFailedException(
        'No hay un período fiscal abierto para esa fecha',
        { practiceId, postingDate: postingDate.toISOString().slice(0, 10) },
      );
    }

    const resultado = await this.assetService.runDepreciation(
      {
        practiceId,
        fiscalPeriodId: period.id,
        postingDate: postingDate.toISOString().slice(0, 10),
        depreciationExpenseAccountId: dto.depreciationExpenseAccountId,
        accumulatedDepreciationAccountId: dto.accumulatedDepreciationAccountId,
        assetId,
      },
      actor,
    );
    if (resultado.transactionIds.length === 0) {
      throw new PreconditionFailedException(
        'Este activo no tiene depreciación pendiente para el período abierto',
        { assetId, fiscalPeriodId: period.id },
      );
    }
    // `runDepreciation` no devuelve el importe, sólo el conteo y los ids de
    // asiento: se relee la fila que acaba de crear (idempotente por
    // activo/periodo, `AssetRepository.findDepreciation`) para poder
    // devolver el monto que de verdad se depreció.
    const depreciacion = await this.assetRepo.findDepreciation(
      em,
      assetId,
      period.id,
    );
    return {
      transactionId: resultado.transactionIds[0],
      amount: depreciacion?.amount ?? '0.00',
    };
  }

  /** Los pasivos de la práctica, para el listado del auto-servicio. */
  async listLiabilities(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<readonly LiabilitySummaryDto[]> {
    await this.assertOwnsPractice(actor, practiceId);
    const em = this.em.fork();
    const liabilities = await this.liabilityRepo.listByPractice(em, practiceId);
    return liabilities.map((liability) => ({
      id: liability.id,
      code: liability.code,
      name: liability.name,
      creditorName: liability.creditorName,
      principalAmount: liability.principalAmount,
      outstandingAmount: liability.outstandingAmount,
      statusConceptId: liability.statusConceptId,
      automated: liability.automated,
    }));
  }

  /**
   * Da de alta un pasivo propio con su cronograma de amortización — ver el
   * porqué del método (cuota de principal fijo, mensual) en
   * {@link buildAmortizationSchedule}. No existía ningún alta de pasivo
   * antes de FT-26: `LiabilityService` sólo sabía liquidar cuotas de un
   * pasivo que ya existiera.
   */
  async createOwnLiability(
    dto: CreateOwnLiabilityDto,
    actor: AuthenticatedUser,
  ): Promise<LiabilityCreatedResponseDto> {
    await this.assertOwnsPractice(actor, dto.practiceId);

    return this.em.transactional(async (tx) => {
      const clash = await tx.findOne(Liabilities, {
        practiceId: dto.practiceId,
        code: dto.code,
      });
      if (clash) {
        throw new ConflictException(
          'Ya existe un pasivo con ese código en la práctica',
          { code: dto.code },
        );
      }

      const startDate = new Date(dto.startDate);
      const cuotas = buildAmortizationSchedule({
        principalAmount: dto.principalAmount,
        annualInterestRate: dto.interestRate,
        installments: dto.installments,
        startDate,
      });

      const liability = this.liabilityRepo.createLiability(tx, {
        practiceId: dto.practiceId,
        code: dto.code,
        name: dto.name,
        accountId: dto.accountId,
        principalAmount: dto.principalAmount,
        outstandingAmount: dto.principalAmount,
        interestRate: dto.interestRate,
        startDate,
        dueDate: cuotas[cuotas.length - 1]?.dueDate,
        creditorName: dto.creditorName,
        statusConceptId: ACCT.LIABILITY_ACTIVE,
        automated: dto.automated ?? true,
        actorUserId: actor.id,
      });
      await tx.flush();

      const filas = cuotas.map((cuota) =>
        this.liabilityRepo.createSchedule(tx, {
          liabilityId: liability.id,
          installmentNumber: cuota.installmentNumber,
          dueDate: cuota.dueDate,
          principalDue: cuota.principalDue,
          interestDue: cuota.interestDue,
          statusConceptId: ACCT.LIAB_SCHEDULE_PENDING,
          actorUserId: actor.id,
        }),
      );
      await tx.flush();

      const schedule: LiabilityScheduleDto[] = filas.map((fila) => ({
        id: fila.id,
        installmentNumber: fila.installmentNumber,
        dueDate: fila.dueDate?.toISOString().slice(0, 10),
        principalDue: fila.principalDue,
        interestDue: fila.interestDue,
        paidAmount: fila.paidAmount ?? '0.00',
        statusConceptId: fila.statusConceptId,
      }));

      return { id: liability.id, code: liability.code, schedule };
    });
  }

  /** Prende o apaga la automatización de un pasivo propio. */
  async setLiabilityAutomation(
    liabilityId: string,
    dto: SetAutomationDto,
    actor: AuthenticatedUser,
  ): Promise<void> {
    await this.assertOwnsLiability(actor, liabilityId);
    const em = this.em.fork();
    const liability = await this.liabilityRepo.setAutomated(
      em,
      liabilityId,
      dto.automated,
    );
    if (!liability) {
      throw new ResourceNotFoundException('Pasivo no encontrado', {
        liabilityId,
      });
    }
  }

  /**
   * "Registrar avance" de un pasivo: liquida la próxima cuota pendiente
   * (nunca una fuera de orden — ver {@link LiabilityRepository.findNextDueSchedule}).
   * Corre tanto si `automated` está encendido como apagado, por la misma
   * razón que en activos.
   */
  async registerLiabilityProgress(
    liabilityId: string,
    dto: RegisterLiabilityProgressDto,
    actor: AuthenticatedUser,
  ): Promise<ProgressRegisteredResponseDto> {
    const { practiceId } = await this.assertOwnsLiability(actor, liabilityId);
    const em = this.em.fork();
    const schedule = await this.liabilityRepo.findNextDueSchedule(
      em,
      liabilityId,
      ACCT.LIAB_SCHEDULE_PENDING,
    );
    if (!schedule) {
      throw new PreconditionFailedException(
        'Este pasivo no tiene cuotas pendientes',
        { liabilityId },
      );
    }

    const principalComponent = schedule.principalDue ?? '0.00';
    const interestComponent = schedule.interestDue ?? '0.00';
    const amount = (Number(principalComponent) + Number(interestComponent)).toFixed(2);

    const resultado = await this.liabilityService.payLiability(
      liabilityId,
      {
        practiceId,
        amount,
        principalComponent,
        interestComponent,
        bankAccountId: dto.bankAccountId,
        interestExpenseAccountId: dto.interestExpenseAccountId,
        liabilityScheduleId: schedule.id,
      },
      actor,
    );

    return {
      transactionId: resultado.transactionId,
      installmentNumber: schedule.installmentNumber,
      amount,
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
