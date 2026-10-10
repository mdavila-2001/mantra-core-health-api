import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  getCurrentTenantId,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { Practices } from '../../practice/entities';
import { PracticeTenantLookupService } from '../../practice/services';
import { BusinessPartners } from '../../erp/entities';
import { ACCT } from '../accounting.concepts';
import {
  AccountingControllingRepository,
  AccountsRepository,
  AccrualRepository,
  AssetRepository,
  FiscalRepository,
  JournalRepository,
  SubledgerRepository,
} from '../repositories';
import {
  toCentimos,
  toText,
  amountInBase,
  sumCents,
  toCents,
  fromCents,
} from './money';
import { ConceptCodeResolver } from './concept-codes';
import type {
  AccrualObjects,
  AccrualScheduleLines,
  Assets,
  FiscalPeriods,
  FiscalYears,
  OpenItems,
  SubledgerAccounts,
} from '../entities';
import type {
  CockpitAccrualObjectDto,
  CockpitAccrualsDto,
  CockpitAgingBucketDto,
  CockpitDimensionDto,
  CockpitDimensionsDto,
  CockpitDocumentFlowDto,
  CockpitDocumentFlowNodeDto,
  CockpitFiscalPeriodDto,
  CockpitFiscalYearDto,
  CockpitFixedAssetDto,
  CockpitFixedAssetsDto,
  CockpitOpenItemDto,
  CockpitOpenItemsPageDto,
  CockpitOpenItemsQueryDto,
} from '../dto';

/** Tope de cuentas leídas al resolver el plan de una práctica para los puentes de D-1. */
const ACCOUNTS_MAX = 5_000;

/**
 * Tope de partidas abiertas que devuelve `openItems` en una sola pasada
 * (D-7): mismo orden de magnitud que los topes de los agregados del mayor.
 */
const OPEN_ITEMS_MAX = 5_000;

/** Tope de asientos que agrega `dimensions` en una sola pasada. */
const DIMENSIONS_MAX_TRANSACTIONS = 10_000;

/** Los cinco tramos de antigüedad de la cartera, siempre presentes y en orden. */
const AGING_BRACKETS: ReadonlyArray<{ bucket: string; label: string }> = [
  { bucket: 'CORRIENTE', label: 'Por vencer' },
  { bucket: 'D1_30', label: '1 a 30 días' },
  { bucket: 'D31_60', label: '31 a 60 días' },
  { bucket: 'D61_90', label: '61 a 90 días' },
  { bucket: 'D90_MAS', label: 'Más de 90 días' },
];

/** `YYYY-MM-DD` de una columna `date`, tal como la espera el front. */
function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Hoy, sin la hora, para comparar contra columnas `date`. */
function todayMidnight(): Date {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today;
}

/** Días de atraso sobre un vencimiento, nunca negativos. */
function delayDays(dueDate: Date, today: Date): number {
  const day = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((today.getTime() - dueDate.getTime()) / day));
}

/** El tramo de antigüedad de una cantidad de días de atraso. */
function bracket(overdueDays: number): string {
  if (overdueDays <= 0) return 'CORRIENTE';
  if (overdueDays <= 30) return 'D1_30';
  if (overdueDays <= 60) return 'D31_60';
  if (overdueDays <= 90) return 'D61_90';
  return 'D90_MAS';
}

/**
 * Las seis lecturas del cockpit contable: proyecciones de solo lectura sobre
 * tablas que el módulo ya escribe, con derivaciones cerradas en
 * `analisis-2026-09-13.md` §10 (D-1…D-9). Ninguna escribe ni cambia el
 * comportamiento de las lecturas del mayor.
 */
@Injectable()
export class AccountingReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param fiscalRepo - Ejercicios y periodos fiscales.
   * @param subledgerRepo - Subledgers y partidas abiertas.
   * @param journalRepo - Asientos, líneas, asignaciones y vínculos.
   * @param accountsRepo - Plan de cuentas.
   * @param accrualRepo - Objetos de devengo y su cronograma.
   * @param controllingRepo - Centros de coste, de beneficio y segmentos.
   * @param assetRepo - Activos fijos.
   * @param practiceTenantLookup - Vínculo activo profesional↔práctica, para
   *   el corte 422 de `PRACTITIONER`. Opcional para no romper specs que no
   *   lo necesitan (molde `LedgerReadService`).
   */
  constructor(
    private readonly em: EntityManager,
    private readonly fiscalRepo: FiscalRepository,
    private readonly subledgerRepo: SubledgerRepository,
    private readonly journalRepo: JournalRepository,
    private readonly accountsRepo: AccountsRepository,
    private readonly accrualRepo: AccrualRepository,
    private readonly controllingRepo: AccountingControllingRepository,
    private readonly assetRepo: AssetRepository,
    private readonly practiceTenantLookup?: PracticeTenantLookupService,
  ) {}

  /**
   * Resuelve y valida la práctica consultada (D-1/D-8): 404 si no existe,
   * 403 si es de otro tenant. A diferencia de `LedgerReadService`, devuelve
   * la práctica completa porque su `tenantId` es lo que acota las cuatro
   * tablas por tenant (open items, subledgers, devengos, dimensiones).
   */
  private async resolverPracticeTenant(
    practiceId: string,
  ): Promise<Pick<Practices, 'id' | 'tenantId'>> {
    const tenantId = getCurrentTenantId();
    const practice = await this.em
      .fork()
      .findOne(Practices, { id: practiceId }, { fields: ['id', 'tenantId'] });

    if (practice === null) {
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    }
    if (tenantId !== undefined && practice.tenantId !== tenantId) {
      throw new ForbiddenException(
        'La práctica consultada pertenece a otra organización',
      );
    }
    return practice;
  }

  /**
   * Duplicado deliberado y mínimo de `LedgerReadService.assertPractitionerOwnsPractice`
   * (D-8): un guard compartido cambiaría el constructor de los servicios que
   * pasan sus dependencias por posición en los specs, fuera del alcance de
   * esta tarjeta.
   */
  private async assertPractitionerOwnsPractice(
    actor: AuthenticatedUser,
    practiceId: string,
  ): Promise<void> {
    if (
      actor.roles.includes('SECURITY_ADMIN') ||
      actor.roles.includes('ACCOUNTING_APPROVER')
    ) {
      return;
    }
    if (!actor.roles.includes('PRACTITIONER')) {
      return;
    }
    if (!actor.practitionerProfileId) {
      throw new PreconditionFailedException(
        'La cuenta no tiene un perfil profesional asociado',
        { actorId: actor.id },
      );
    }
    if (!this.practiceTenantLookup) {
      throw new PreconditionFailedException(
        'No se pudo verificar la vinculación del profesional con la práctica',
        { practiceId },
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
  }

  /** El estado de un período fiscal, derivado de su concepto (D-3/D-4). */
  private mapPeriodStatus(
    statusConceptId: string,
  ): 'CLOSED' | 'OPEN' | 'PLANNED' {
    if (statusConceptId === ACCT.PERIOD_OPEN) return 'OPEN';
    if (statusConceptId === ACCT.PERIOD_LOCKED) return 'CLOSED';
    return 'PLANNED';
  }

  /**
   * El ejercicio fiscal vigente de una práctica (D-3): el que cubre hoy, o el
   * más reciente por `startDate` si ninguno la cubre.
   *
   * @throws ResourceNotFoundException si la práctica no tiene ejercicios.
   */
  async fiscalYear(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<CockpitFiscalYearDto> {
    await this.resolverPracticeTenant(practiceId);
    await this.assertPractitionerOwnsPractice(actor, practiceId);

    const em = this.em.fork();
    const years = await this.fiscalRepo.findYearsByPractice(em, practiceId);
    if (years.length === 0) {
      throw new ResourceNotFoundException(
        'La práctica no tiene ejercicios fiscales',
        { practiceId },
      );
    }

    const today = todayMidnight();
    const year: FiscalYears =
      years.find((a) => a.startDate <= today && a.endDate >= today) ?? years[0];

    const periods = await this.fiscalRepo.findPeriodsByYear(em, year.id);
    const periodDtos: CockpitFiscalPeriodDto[] = periods.map(
      (period: FiscalPeriods, index: number) => ({
        id: period.id,
        periodNumber: index + 1,
        name: period.code,
        startsOn: formatDate(period.startDate),
        endsOn: formatDate(period.endDate),
        status: this.mapPeriodStatus(period.statusConceptId),
      }),
    );

    const openCurrent = periods.find(
      (p) =>
        p.statusConceptId === ACCT.PERIOD_OPEN &&
        p.startDate <= today &&
        p.endDate >= today,
    );
    const currentPeriodId = openCurrent?.id ?? periods.at(-1)?.id ?? '';

    return {
      fiscalYearId: year.id,
      name: year.code,
      startsOn: formatDate(year.startDate),
      endsOn: formatDate(year.endDate),
      currentPeriodId,
      periods: periodDtos,
      count: periodDtos.length,
    };
  }

  /** El lado de la cartera de una partida abierta (D-7, tres niveles de fallback). */
  private side(
    subledger: SubledgerAccounts,
    openItem: OpenItems,
    normalBalanceConceptId: string | null,
  ): 'RECEIVABLE' | 'PAYABLE' {
    if (subledger.subledgerRoleConceptId === ACCT.SUBLEDGER_CUSTOMER) {
      return 'RECEIVABLE';
    }
    if (subledger.subledgerRoleConceptId === ACCT.SUBLEDGER_VENDOR) {
      return 'PAYABLE';
    }
    if (openItem.documentTypeConceptId === ACCT.DOC_TYPE_INVOICE) {
      return 'RECEIVABLE';
    }
    if (openItem.documentTypeConceptId === ACCT.DOC_TYPE_BILL) {
      return 'PAYABLE';
    }
    return normalBalanceConceptId === ACCT.DIRECTION_DEBIT
      ? 'RECEIVABLE'
      : 'PAYABLE';
  }

  /**
   * La cartera abierta de una práctica, con su antigüedad (D-7). Excluye las
   * partidas saldadas y las de saldo cero; sin paginación (el contrato del
   * front no declara cursor).
   */
  async openItems(
    query: CockpitOpenItemsQueryDto,
    actor: AuthenticatedUser,
  ): Promise<CockpitOpenItemsPageDto> {
    const practice = await this.resolverPracticeTenant(query.practiceId);
    await this.assertPractitionerOwnsPractice(actor, query.practiceId);

    const em = this.em.fork();
    const accounts = await this.accountsRepo.findByPractice(
      em,
      query.practiceId,
      ACCOUNTS_MAX,
    );
    const accountById = new Map(accounts.map((c) => [c.id, c]));

    const rows = await this.subledgerRepo.findOpenItemsByReconciliationAccounts(
      em,
      practice.tenantId,
      accounts.map((c) => c.id),
      ACCT.OPEN_ITEM_CLEARED,
      OPEN_ITEMS_MAX,
    );

    const businessPartnerIds = [
      ...new Set(rows.map((f) => f.subledger.businessPartnerId)),
    ];
    const partners =
      businessPartnerIds.length === 0
        ? []
        : await em.find(BusinessPartners, {
            id: { $in: businessPartnerIds },
          });
    const partnerById = new Map(partners.map((s) => [s.id, s]));

    const today = todayMidnight();

    const items: CockpitOpenItemDto[] = [];
    for (const { openItem, subledger } of rows) {
      const outstandingCents = toCentimos(openItem.outstandingAmount);
      if (outstandingCents <= 0n) continue; // saldada de hecho, aunque el estado no lo diga

      const account = accountById.get(subledger.reconciliationAccountId);
      const documentDate = openItem.baselineDate ?? openItem.createdAt;
      const dueDate = openItem.dueDate ?? documentDate;
      const overdueDays = openItem.dueDate
        ? delayDays(openItem.dueDate, today)
        : 0;

      items.push({
        id: openItem.id,
        documentNumber: openItem.documentNumber ?? '',
        accountCode: account?.code ?? '',
        accountName: account?.name ?? '',
        partnerName:
          partnerById.get(subledger.businessPartnerId)?.displayName ?? '',
        side: this.side(
          subledger,
          openItem,
          account?.normalBalanceConceptId ?? null,
        ),
        documentDate: formatDate(documentDate),
        dueDate: formatDate(dueDate),
        amount: openItem.originalAmount ?? '0.00',
        clearedAmount: toText(
          toCentimos(openItem.originalAmount) - outstandingCents,
        ),
        openAmount: toText(outstandingCents),
        overdueDays,
        agingBucket: bracket(overdueDays),
      });
    }

    const filtered = query.side
      ? items.filter((i) => i.side === query.side)
      : items;
    filtered.sort((a, b) => b.overdueDays - a.overdueDays);

    const aging: CockpitAgingBucketDto[] = AGING_BRACKETS.map(
      ({ bucket, label }) => {
        const ofBracket = filtered.filter((i) => i.agingBucket === bucket);
        const receivable = ofBracket
          .filter((i) => i.side === 'RECEIVABLE')
          .reduce((acc, i) => acc + toCentimos(i.openAmount), 0n);
        const payable = ofBracket
          .filter((i) => i.side === 'PAYABLE')
          .reduce((acc, i) => acc + toCentimos(i.openAmount), 0n);
        return {
          bucket,
          label,
          receivable: toText(receivable),
          payable: toText(payable),
          count: ofBracket.length,
        };
      },
    );

    const totalReceivable = filtered
      .filter((i) => i.side === 'RECEIVABLE')
      .reduce((acc, i) => acc + toCentimos(i.openAmount), 0n);
    const totalPayable = filtered
      .filter((i) => i.side === 'PAYABLE')
      .reduce((acc, i) => acc + toCentimos(i.openAmount), 0n);

    return {
      items: filtered,
      aging,
      totalReceivable: toText(totalReceivable),
      totalPayable: toText(totalPayable),
      count: filtered.length,
    };
  }

  /**
   * Debe/haber/resultado por centro de coste, centro de beneficio y segmento
   * (D-9), sólo asientos POSTEADOS. `SEGMENT` da `0.00` casi siempre: el
   * camino de escritura no imputa segmentos (§11 hallazgo 1).
   */
  async dimensions(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<CockpitDimensionsDto> {
    const practice = await this.resolverPracticeTenant(practiceId);
    await this.assertPractitionerOwnsPractice(actor, practiceId);

    const em = this.em.fork();
    const lines = await this.journalRepo.findPostedEntriesWithAssignments(
      em,
      practiceId,
      ACCT.TXN_POSTED,
      DIMENSIONS_MAX_TRANSACTIONS,
    );

    const accumulate = (
      map: Map<string, { debit: bigint; credit: bigint }>,
      id: string | null,
      address: string,
      amount: string,
    ): void => {
      if (!id) return;
      const actual = map.get(id) ?? { debit: 0n, credit: 0n };
      const cents = toCentimos(amount);
      if (address === ACCT.DIRECTION_DEBIT) {
        actual.debit += cents;
      } else {
        actual.credit += cents;
      }
      map.set(id, actual);
    };

    const byCostCenter = new Map<string, { debit: bigint; credit: bigint }>();
    const byProfitCenter = new Map<string, { debit: bigint; credit: bigint }>();
    const bySegment = new Map<string, { debit: bigint; credit: bigint }>();

    for (const line of lines) {
      const amount = amountInBase({
        amount: line.amount,
        amountBase: line.amountBase,
      });
      accumulate(
        byCostCenter,
        line.costCenterId,
        line.directionConceptId,
        amount,
      );
      accumulate(
        byProfitCenter,
        line.profitCenterId,
        line.directionConceptId,
        amount,
      );
      accumulate(bySegment, line.segmentId, line.directionConceptId, amount);
    }

    const [costCenters, profitCenters, segments] = await Promise.all([
      this.controllingRepo.listCostCentersByPractice(em, practiceId),
      this.controllingRepo.listProfitCentersByTenant(em, practice.tenantId),
      this.controllingRepo.listSegmentsByTenant(em, practice.tenantId),
    ]);

    const dimension = (
      id: string,
      code: string,
      name: string,
      kind: CockpitDimensionDto['kind'],
      map: Map<string, { debit: bigint; credit: bigint }>,
    ): CockpitDimensionDto => {
      const balance = map.get(id) ?? { debit: 0n, credit: 0n };
      return {
        id,
        code,
        name,
        kind,
        debit: toText(balance.debit),
        credit: toText(balance.credit),
        result: toText(balance.credit - balance.debit),
      };
    };

    const items: CockpitDimensionDto[] = [
      ...costCenters.map((c) =>
        dimension(c.id, c.code, c.name, 'COST_CENTER', byCostCenter),
      ),
      ...profitCenters.map((p) =>
        dimension(p.id, p.code, p.name, 'PROFIT_CENTER', byProfitCenter),
      ),
      ...segments.map((s) =>
        dimension(s.id, s.code, s.name, 'SEGMENT', bySegment),
      ),
    ];

    return { items, count: items.length };
  }

  /** El estado de un asiento, derivado de su concepto (máquina C-17). */
  private mapTransactionStatus(statusConceptId: string): string {
    switch (statusConceptId) {
      case ACCT.TXN_DRAFT:
        return 'DRAFT';
      case ACCT.TXN_AUTO_CLASSIFIED:
        return 'AUTO_CLASSIFIED';
      case ACCT.TXN_PENDING_REVIEW:
        return 'PENDING_REVIEW';
      case ACCT.TXN_APPROVED:
        return 'APPROVED';
      case ACCT.TXN_POSTED:
        return 'POSTED';
      case ACCT.TXN_REVERSED:
        return 'REVERSED';
      default:
        // No debería ocurrir: la máquina de estados sólo declara estos seis
        // conceptos para `journal_transactions.status_concept_id`.
        return 'DRAFT';
    }
  }

  /**
   * El flujo de un asiento: su origen (si es una reversa), él mismo, y su
   * reversión (si la tiene) — D-5. Sólo comprueba la práctica del asiento
   * (mismo corte que `getJournalTransaction`); no aplica el 422 de
   * `PRACTITIONER`, que esta lectura no recibe `practiceId` para evaluarlo
   * de antemano.
   *
   * @throws ResourceNotFoundException si el asiento no existe.
   */
  async documentFlow(transactionId: string): Promise<CockpitDocumentFlowDto> {
    const em = this.em.fork();
    const entry = await this.journalRepo.findTransactionById(
      em,
      transactionId,
    );
    if (!entry) {
      throw new ResourceNotFoundException('Asiento no encontrado', {
        transactionId,
      });
    }
    await this.resolverPracticeTenant(entry.practiceId);

    const links = await this.journalRepo.findReversalLinksForTransaction(
      em,
      transactionId,
      ACCT.RELATION_REVERSES,
    );
    const originIds = links
      .filter((l) => l.targetTransactionId === transactionId)
      .map((l) => l.sourceTransactionId);
    const reversionIds = links
      .filter((l) => l.sourceTransactionId === transactionId)
      .map((l) => l.targetTransactionId);

    const related = await this.journalRepo.findTransactionsByIds(em, [
      ...originIds,
      ...reversionIds,
    ]);
    const byId = new Map(related.map((t) => [t.id, t]));

    const toNode = (
      id: string,
      role: 'ORIGEN' | 'ACTUAL' | 'REVERSION',
    ): CockpitDocumentFlowNodeDto | null => {
      const tx = id === entry.id ? entry : byId.get(id);
      if (!tx) return null;
      return {
        id: tx.id,
        role,
        transactionNumber: tx.transactionNumber ?? '',
        transactionDate: tx.transactionDate,
        totalAmount: tx.totalAmount ?? '0.00',
        status: this.mapTransactionStatus(tx.statusConceptId),
      };
    };

    const items = [
      ...originIds.map((id) => toNode(id, 'ORIGEN')),
      toNode(entry.id, 'ACTUAL'),
      ...reversionIds.map((id) => toNode(id, 'REVERSION')),
    ].filter((n): n is CockpitDocumentFlowNodeDto => n !== null);

    return { items };
  }

  /**
   * El registro de activos fijos de una práctica, con la cuota de la próxima
   * corrida —todavía no corrida— de depreciación (D-6, fórmulas literales de
   * `AssetService.runDepreciation`).
   */
  async fixedAssets(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<CockpitFixedAssetsDto> {
    await this.resolverPracticeTenant(practiceId);
    await this.assertPractitionerOwnsPractice(actor, practiceId);

    const em = this.em.fork();
    const active = await this.assetRepo.listByPractice(em, practiceId);
    const sorted = [...active].sort((a, b) => a.code.localeCompare(b.code));

    const resolver = await ConceptCodeResolver.load(
      em,
      sorted.map((a) => a.assetTypeConceptId),
    );

    let totalAcquisition = 0;
    let totalAccumulated = 0;
    let totalNetBookValue = 0;
    let monthlyCharge = 0;

    const items: CockpitFixedAssetDto[] = sorted.map((activo: Assets) => {
      const cost = toCents(activo.acquisitionCost ?? '0');
      const salvage = toCents(activo.salvageValue ?? '0');
      const bookValueCents = toCents(
        activo.bookValue ?? activo.acquisitionCost ?? '0',
      );
      const depreciableCents = bookValueCents - salvage;
      const monthly =
        activo.usefulLifeMonths && activo.usefulLifeMonths > 0
          ? Math.round((cost - salvage) / activo.usefulLifeMonths)
          : 0;
      const installment = Math.min(monthly, depreciableCents);

      const activa = activo.statusConceptId === ACCT.ASSET_ACTIVE;
      const depreciable =
        activa &&
        !!activo.usefulLifeMonths &&
        activo.usefulLifeMonths > 0 &&
        depreciableCents > 0 &&
        installment > 0;

      const accumulatedCents = toCents(activo.accumulatedDepreciation ?? '0');

      totalAcquisition += cost;
      totalAccumulated += accumulatedCents;
      totalNetBookValue += bookValueCents;
      if (depreciable) monthlyCharge += installment;

      return {
        id: activo.id,
        code: activo.code,
        name: activo.name,
        className: resolver.display(activo.assetTypeConceptId) ?? '',
        classCode: resolver.code(activo.assetTypeConceptId) ?? '',
        usefulLifeMonths: activo.usefulLifeMonths ?? 0,
        acquisitionCost: fromCents(cost),
        accumulatedDepreciation: fromCents(accumulatedCents),
        netBookValue: fromCents(bookValueCents),
        monthlyDepreciation: depreciable ? fromCents(installment) : '0.00',
        depreciable,
        status: activa ? 'ACTIVE' : 'RETIRED',
      };
    });

    return {
      items,
      totalAcquisition: fromCents(totalAcquisition),
      totalAccumulated: fromCents(totalAccumulated),
      totalNetBookValue: fromCents(totalNetBookValue),
      monthlyCharge: fromCents(monthlyCharge),
      count: items.length,
    };
  }

  /**
   * El registro de devengos de una práctica, con el avance de cada objeto
   * frente a su cronograma (D-6, fórmulas literales de `AccrualService`).
   */
  async accrualObjects(
    practiceId: string,
    actor: AuthenticatedUser,
  ): Promise<CockpitAccrualsDto> {
    const practice = await this.resolverPracticeTenant(practiceId);
    await this.assertPractitionerOwnsPractice(actor, practiceId);

    const em = this.em.fork();
    const practiceAccounts = await this.accountsRepo.findByPractice(
      em,
      practiceId,
      ACCOUNTS_MAX,
    );
    const accountIds = practiceAccounts.map((c) => c.id);

    const objects = await this.accrualRepo.findObjectsByPractice(
      em,
      practice.tenantId,
      accountIds,
    );
    const sorted = [...objects].sort((a, b) =>
      a.objectNumber.localeCompare(b.objectNumber),
    );

    const lines = await this.accrualRepo.findScheduleLinesByObjectIds(
      em,
      sorted.map((o) => o.id),
    );
    const periodIds = [...new Set(lines.map((l) => l.fiscalPeriodId))];
    const periods = await this.fiscalRepo.findPeriodsByIds(em, periodIds);
    const periodById = new Map(periods.map((p) => [p.id, p]));

    const expenseAccountIds = sorted
      .map((o) => o.expenseAccountId)
      .filter((id): id is string => !!id);
    const expenseAccounts =
      expenseAccountIds.length === 0
        ? []
        : await this.accountsRepo.findByIds(em, expenseAccountIds);
    const expenseAccountById = new Map(expenseAccounts.map((c) => [c.id, c]));

    let pendingTotal = 0;
    let periodCharge = 0;

    const items: CockpitAccrualObjectDto[] = sorted.map(
      (obj: AccrualObjects) => {
        const own = lines.filter((l) => l.accrualObjectId === obj.id);
        const posted = own.filter(
          (l) => l.statusConceptId === ACCT.SCHEDULE_POSTED,
        );
        const pending = own.filter(
          (l) => l.statusConceptId !== ACCT.SCHEDULE_POSTED,
        );

        const recognizedAmount = sumCents(
          posted.map((l) => l.postedAmount ?? '0'),
        );
        const pendingAmount = sumCents(
          pending.map((l) => l.plannedAmount ?? '0'),
        );

        const nextPending = [...pending].sort(
          (a: AccrualScheduleLines, b: AccrualScheduleLines) => {
            const periodA = periodById.get(a.fiscalPeriodId);
            const periodB = periodById.get(b.fiscalPeriodId);
            if (periodA && periodB) {
              const diff =
                periodA.startDate.getTime() - periodB.startDate.getTime();
              if (diff !== 0) return diff;
            }
            return a.id.localeCompare(b.id);
          },
        )[0];
        const periodAmount = nextPending
          ? toCents(nextPending.plannedAmount ?? '0')
          : 0;

        const completed = pending.length === 0;
        pendingTotal += pendingAmount;
        if (!completed) periodCharge += periodAmount;

        const firstLine = [...own].sort((a, b) => {
          const periodA = periodById.get(a.fiscalPeriodId);
          const periodB = periodById.get(b.fiscalPeriodId);
          if (!periodA || !periodB) return 0;
          return periodA.startDate.getTime() - periodB.startDate.getTime();
        })[0];
        const startsOn =
          obj.startDate ??
          (firstLine
            ? periodById.get(firstLine.fiscalPeriodId)?.startDate
            : undefined) ??
          new Date(0);

        const expenseAccount = obj.expenseAccountId
          ? expenseAccountById.get(obj.expenseAccountId)
          : undefined;
        const kind: 'EXPENSE' | 'REVENUE' =
          expenseAccount?.accountTypeConceptId === ACCT.ACCOUNT_TYPE_REVENUE
            ? 'REVENUE'
            : 'EXPENSE';

        return {
          id: obj.id,
          code: obj.objectNumber,
          name: obj.objectNumber,
          kind,
          totalAmount: obj.totalAmount ?? '0.00',
          periods: own.length,
          postedPeriods: posted.length,
          remainingPeriods: pending.length,
          periodAmount: fromCents(periodAmount),
          recognizedAmount: fromCents(recognizedAmount),
          pendingAmount: fromCents(pendingAmount),
          startsOn: formatDate(startsOn),
          completed,
        };
      },
    );

    return {
      items,
      pendingTotal: fromCents(pendingTotal),
      periodCharge: fromCents(periodCharge),
      count: items.length,
    };
  }
}
