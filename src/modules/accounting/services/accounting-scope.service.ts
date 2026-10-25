import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { requireTenantId } from '../../../common';
import {
  assertResourceInTenant,
  type ResourceScopeFailure,
} from '../../../common/tenant/resource-scope';
import { PracticeTenantLookupService } from '../../practice/services';
import { AccountingErrorReason } from '../accounting.error-reasons';
import {
  AccountingControllingRepository,
  AccountsRepository,
  AccrualRepository,
  AssetRepository,
  FiscalRepository,
  JournalRepository,
  LiabilityRepository,
  SubledgerRepository,
} from '../repositories';
import type {
  Accounts,
  AccrualObjects,
  CompanyBankAccounts,
  DepreciationAreas,
  FiscalPeriods,
  JournalTransactions,
  LedgerEntries,
  Liabilities,
  OpenItems,
  SubledgerAccounts,
} from '../entities';

/** Respuesta de "no existe" de cada tipo de recurso; lo ajeno responde idéntico. */
const FAILURE = {
  practice: {
    message: 'Práctica no encontrada',
    reason: AccountingErrorReason.PRACTICE_NOT_FOUND,
  },
  account: {
    message: 'Cuenta no encontrada en la práctica',
    reason: AccountingErrorReason.ACCOUNT_NOT_FOUND_IN_PRACTICE,
  },
  period: {
    message: 'Periodo fiscal no encontrado',
    reason: AccountingErrorReason.FISCAL_PERIOD_NOT_FOUND,
  },
  transaction: {
    message: 'Asiento no encontrado',
    reason: AccountingErrorReason.LEDGER_TRANSACTION_NOT_FOUND,
  },
  ledgerEntry: {
    message: 'Línea del mayor no encontrada',
    reason: AccountingErrorReason.LEDGER_ENTRY_NOT_FOUND,
  },
  subledger: {
    message: 'Subledger no encontrado',
    reason: AccountingErrorReason.SUBLEDGER_ACCOUNT_NOT_FOUND,
  },
  openItem: {
    message: 'Partida abierta no encontrada',
    reason: AccountingErrorReason.OPEN_ITEM_NOT_FOUND,
  },
  accrualObject: {
    message: 'Objeto de devengo no encontrado',
    reason: AccountingErrorReason.ACCRUAL_OBJECT_NOT_FOUND,
  },
  asset: {
    message: 'Activo no encontrado',
    reason: AccountingErrorReason.ASSET_NOT_FOUND,
  },
  invoice: {
    message: 'Factura no encontrada',
    reason: AccountingErrorReason.INVOICE_NOT_FOUND,
  },
  liability: {
    message: 'Pasivo no encontrado',
    reason: AccountingErrorReason.LIABILITY_NOT_FOUND,
  },
  bankAccount: {
    message: 'Cuenta bancaria no encontrada',
    reason: AccountingErrorReason.COMPANY_BANK_ACCOUNT_NOT_FOUND,
  },
  costCenter: {
    message: 'Centro de costo no encontrado',
    reason: AccountingErrorReason.COST_CENTER_NOT_FOUND,
  },
  profitCenter: {
    message: 'Centro de beneficio no encontrado',
    reason: AccountingErrorReason.PROFIT_CENTER_NOT_FOUND,
  },
  depreciationArea: {
    message: 'Área de depreciación no encontrada',
    reason: AccountingErrorReason.DEPRECIATION_AREA_NOT_FOUND,
  },
} as const satisfies Record<string, ResourceScopeFailure>;

/** Lo que un asiento escrito por el motor contable referencia y hay que acotar. */
export interface PostingScopeInput {
  /** Práctica a la que se asienta. */
  readonly practiceId: string;
  /** Periodo fiscal del asiento, si lo lleva. */
  readonly fiscalPeriodId?: string;
  /** Líneas con las cuentas y las dimensiones que cada una referencia. */
  readonly lines: readonly {
    readonly accountId: string;
    readonly costCenterId?: string;
    readonly profitCenterId?: string;
  }[];
}

/**
 * Política de alcance de las escrituras contables (ACC-01).
 *
 * Ninguna tabla de `accounting` lleva `tenant_id` salvo las de subledger,
 * devengos y dimensiones de beneficio: el dueño de un asiento, una cuenta, un
 * periodo, un activo o un pasivo es su **práctica**, y el de la práctica es su
 * tenant. Las FK sólo prueban existencia, así que un UUID ajeno que llegaba en
 * la ruta o en el cuerpo se cargaba y se escribía como si fuera propio. Esta
 * política resuelve el tenant del **contexto verificado** —nunca el del
 * cuerpo— y carga cada recurso referenciado contra él **antes** de mutar.
 *
 * Lo ajeno responde exactamente igual que lo inexistente (`404`, mismo mensaje y
 * `reason`, sin `details`): distinguirlo confirmaría a un tercero que ese UUID
 * existe en otra organización.
 */
@Injectable()
export class AccountingScopeService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param practiceTenantLookup - Puerto de lectura de `practice`.
   * @param accountsRepo - Plan de cuentas.
   * @param fiscalRepo - Ejercicios y periodos.
   * @param journalRepo - Asientos y líneas del mayor.
   * @param controllingRepo - Centros de costo y de beneficio.
   * @param subledgerRepo - Subledgers, partidas y cuentas bancarias.
   * @param accrualRepo - Objetos de devengo.
   * @param assetRepo - Áreas de depreciación.
   * @param liabilityRepo - Pasivos.
   */
  constructor(
    private readonly practiceTenantLookup: PracticeTenantLookupService,
    private readonly accountsRepo: AccountsRepository,
    private readonly fiscalRepo: FiscalRepository,
    private readonly journalRepo: JournalRepository,
    private readonly controllingRepo: AccountingControllingRepository,
    private readonly subledgerRepo: SubledgerRepository,
    private readonly accrualRepo: AccrualRepository,
    private readonly assetRepo: AssetRepository,
    private readonly liabilityRepo: LiabilityRepository,
  ) {}

  /**
   * Tenant de una escritura que lo declara en el cuerpo: el del contexto.
   *
   * El interceptor de tenant ya rechaza un cuerpo que declare otro; si llegara
   * uno distinto igualmente, se informa como el recurso que lo habría necesitado
   * (404 uniforme) y nunca se estampa en lo que se escribe.
   *
   * @param declared - Tenant que trae el cuerpo, si lo trae.
   * @param resource - Recurso cuyo "no existe" se usa si el cuerpo declara otro.
   * @returns El tenant activo.
   * @throws ResourceNotFoundException si el cuerpo declara otro tenant.
   */
  activeTenantFor(
    declared: string | undefined,
    resource: keyof typeof FAILURE,
  ): string {
    const tenantId = requireTenantId();
    return assertResourceInTenant(
      tenantId,
      declared ?? tenantId,
      tenantId,
      FAILURE[resource],
    );
  }

  /**
   * Exige que la práctica sea del tenant activo.
   *
   * @param practiceId - Práctica recibida del cliente.
   * @returns El tenant activo, que es el de la práctica.
   * @throws ResourceNotFoundException si no existe o es de otro tenant.
   */
  async practice(practiceId: string): Promise<string> {
    const tenantId = requireTenantId();
    const owner =
      await this.practiceTenantLookup.findTenantOfPractice(practiceId);
    assertResourceInTenant(practiceId, owner, tenantId, FAILURE.practice);
    return tenantId;
  }

  /**
   * Acota un asiento cargado por UUID al tenant activo, a través de su práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Asiento pedido.
   * @returns El asiento, de una práctica del tenant activo.
   */
  async transaction(
    em: EntityManager,
    id: string,
  ): Promise<JournalTransactions> {
    const txn = await this.journalRepo.findTransactionById(em, id);
    return this.byPractice(txn, txn?.practiceId, FAILURE.transaction);
  }

  /**
   * Acota una línea del mayor al tenant activo, a través de su asiento.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Línea pedida.
   * @returns La línea, de un asiento de una práctica del tenant activo.
   */
  async ledgerEntry(em: EntityManager, id: string): Promise<LedgerEntries> {
    const entry = await this.journalRepo.findLedgerEntryById(em, id);
    const txn = entry
      ? await this.journalRepo.findTransactionById(em, entry.transactionId)
      : null;
    return this.byPractice(entry, txn?.practiceId, FAILURE.ledgerEntry);
  }

  /**
   * Exige que cada cuenta exista y sea del plan de **esa** práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param accountIds - Cuentas referenciadas (pueden repetirse).
   * @param practiceId - Práctica ya verificada de la operación.
   * @returns Las cuentas, por id.
   */
  async accountsInPractice(
    em: EntityManager,
    accountIds: readonly (string | undefined)[],
    practiceId: string,
  ): Promise<ReadonlyMap<string, Accounts>> {
    const ids = unique(accountIds);
    const found = new Map(
      (await this.accountsRepo.findByIds(em, ids)).map((a) => [a.id, a]),
    );
    for (const id of ids) {
      const account = found.get(id);
      assertResourceInTenant(
        account,
        account?.practiceId,
        practiceId,
        FAILURE.account,
      );
    }
    return found;
  }

  /**
   * Exige que cada cuenta exista y sea del plan de una práctica del tenant
   * activo. Para los objetos que no llevan práctica (devengos).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param accountIds - Cuentas referenciadas.
   */
  async accountsInTenant(
    em: EntityManager,
    accountIds: readonly (string | undefined)[],
  ): Promise<void> {
    const ids = unique(accountIds);
    const found = new Map(
      (await this.accountsRepo.findByIds(em, ids)).map((a) => [a.id, a]),
    );
    for (const id of ids) {
      const account = found.get(id);
      await this.byPractice(account, account?.practiceId, FAILURE.account);
    }
  }

  /**
   * Exige que el periodo pertenezca a un ejercicio de **esa** práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param periodId - Periodo referenciado.
   * @param practiceId - Práctica ya verificada de la operación.
   * @returns El periodo.
   */
  async periodInPractice(
    em: EntityManager,
    periodId: string,
    practiceId: string,
  ): Promise<FiscalPeriods> {
    const { period, year } = await this.periodAndYear(em, periodId);
    return assertResourceInTenant(
      period,
      year?.practiceId,
      practiceId,
      FAILURE.period,
    );
  }

  /**
   * Exige que el periodo pertenezca a un ejercicio de una práctica del tenant
   * activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param periodId - Periodo referenciado.
   * @returns El periodo.
   */
  async periodInTenant(
    em: EntityManager,
    periodId: string,
  ): Promise<FiscalPeriods> {
    const { period, year } = await this.periodAndYear(em, periodId);
    return this.byPractice(period, year?.practiceId, FAILURE.period);
  }

  /**
   * Exige que cada centro de costo exista y sea de **esa** práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Centros referenciados.
   * @param practiceId - Práctica ya verificada de la operación.
   */
  async costCentersInPractice(
    em: EntityManager,
    ids: readonly (string | undefined)[],
    practiceId: string,
  ): Promise<void> {
    const wanted = unique(ids);
    const found = new Map(
      (await this.controllingRepo.findCostCentersByIds(em, wanted)).map((c) => [
        c.id,
        c,
      ]),
    );
    for (const id of wanted) {
      const center = found.get(id);
      assertResourceInTenant(
        center,
        center?.practiceId,
        practiceId,
        FAILURE.costCenter,
      );
    }
  }

  /**
   * Exige que cada centro de costo exista y sea de una práctica del tenant activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Centros referenciados.
   */
  async costCentersInTenant(
    em: EntityManager,
    ids: readonly (string | undefined)[],
  ): Promise<void> {
    const wanted = unique(ids);
    const found = new Map(
      (await this.controllingRepo.findCostCentersByIds(em, wanted)).map((c) => [
        c.id,
        c,
      ]),
    );
    for (const id of wanted) {
      const center = found.get(id);
      await this.byPractice(center, center?.practiceId, FAILURE.costCenter);
    }
  }

  /**
   * Exige que cada centro de beneficio exista y sea del tenant activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param ids - Centros referenciados.
   */
  async profitCentersInTenant(
    em: EntityManager,
    ids: readonly (string | undefined)[],
  ): Promise<void> {
    const tenantId = requireTenantId();
    const wanted = unique(ids);
    const found = new Map(
      (await this.controllingRepo.findProfitCentersByIds(em, wanted)).map(
        (c) => [c.id, c],
      ),
    );
    for (const id of wanted) {
      const center = found.get(id);
      assertResourceInTenant(
        center,
        center?.tenantId,
        tenantId,
        FAILURE.profitCenter,
      );
    }
  }

  /**
   * Carga un subledger del tenant activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Subledger pedido.
   * @returns El subledger.
   */
  async subledger(em: EntityManager, id: string): Promise<SubledgerAccounts> {
    const tenantId = requireTenantId();
    const subledger = await this.subledgerRepo.findSubledgerById(em, id);
    return assertResourceInTenant(
      subledger,
      subledger?.tenantId,
      tenantId,
      FAILURE.subledger,
    );
  }

  /**
   * Carga una partida abierta del tenant activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Partida pedida.
   * @returns La partida.
   */
  async openItem(em: EntityManager, id: string): Promise<OpenItems> {
    const tenantId = requireTenantId();
    const item = await this.subledgerRepo.findOpenItemById(em, id);
    return assertResourceInTenant(
      item,
      item?.tenantId,
      tenantId,
      FAILURE.openItem,
    );
  }

  /**
   * Carga una cuenta bancaria de la empresa del tenant activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Cuenta bancaria pedida.
   * @returns La cuenta bancaria.
   */
  async companyBankAccount(
    em: EntityManager,
    id: string,
  ): Promise<CompanyBankAccounts> {
    const tenantId = requireTenantId();
    const bank = await this.subledgerRepo.findCompanyBankAccountById(em, id);
    return assertResourceInTenant(
      bank,
      bank?.tenantId,
      tenantId,
      FAILURE.bankAccount,
    );
  }

  /**
   * Carga un objeto de devengo del tenant activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Objeto pedido.
   * @returns El objeto de devengo.
   */
  async accrualObject(em: EntityManager, id: string): Promise<AccrualObjects> {
    const tenantId = requireTenantId();
    const object = await this.accrualRepo.findObjectById(em, id);
    return assertResourceInTenant(
      object,
      object?.tenantId,
      tenantId,
      FAILURE.accrualObject,
    );
  }

  /**
   * Carga un área de depreciación del tenant activo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Área pedida.
   * @returns El área.
   */
  async depreciationArea(
    em: EntityManager,
    id: string,
  ): Promise<DepreciationAreas> {
    const tenantId = requireTenantId();
    const area = await this.assetRepo.findDepreciationAreaById(em, id);
    return assertResourceInTenant(
      area,
      area?.tenantId,
      tenantId,
      FAILURE.depreciationArea,
    );
  }

  /**
   * Acota un activo ya cargado al tenant activo, a través de su práctica.
   *
   * @param asset - Activo cargado, o `null` si no se encontró.
   * @returns El activo.
   */
  asset<T extends { practiceId: string }>(asset: T | null): Promise<T> {
    return this.byPractice(asset, asset?.practiceId, FAILURE.asset);
  }

  /**
   * Acota un pasivo ya cargado al tenant activo, a través de su práctica.
   *
   * @param liability - Pasivo cargado, o `null` si no se encontró.
   * @returns El pasivo.
   */
  liability<T extends { practiceId: string }>(liability: T | null): Promise<T> {
    return this.byPractice(liability, liability?.practiceId, FAILURE.liability);
  }

  /**
   * Acota una factura ya cargada al tenant activo, a través de su práctica.
   *
   * @param invoice - Factura cargada, o `null` si no se encontró.
   * @returns La factura.
   */
  invoice<T extends { practiceId: string }>(invoice: T | null): Promise<T> {
    return this.byPractice(invoice, invoice?.practiceId, FAILURE.invoice);
  }

  /**
   * Carga un pasivo que pertenezca a **esa** práctica.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Pasivo pedido.
   * @param practiceId - Práctica ya verificada de la operación.
   * @returns El pasivo.
   */
  async liabilityInPractice(
    em: EntityManager,
    id: string,
    practiceId: string,
  ): Promise<Liabilities> {
    const liability = await this.liabilityRepo.findById(em, id);
    return assertResourceInTenant(
      liability,
      liability?.practiceId,
      practiceId,
      FAILURE.liability,
    );
  }

  /**
   * Acota todo lo que un asiento referencia: práctica, periodo, cuentas y
   * dimensiones. Es el guardián común del posteo (`LedgerService` y
   * `PostingHelper`), así que ningún flujo escribe líneas sin pasar por acá.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param input - Práctica, periodo y líneas del asiento.
   * @returns El periodo fiscal del asiento, si lo lleva.
   * @throws ResourceNotFoundException (404 uniforme) ante cualquier referencia
   *   inexistente o ajena.
   */
  async assertPostingScope(
    em: EntityManager,
    input: PostingScopeInput,
  ): Promise<FiscalPeriods | undefined> {
    await this.practice(input.practiceId);
    const period = input.fiscalPeriodId
      ? await this.periodInPractice(em, input.fiscalPeriodId, input.practiceId)
      : undefined;
    await this.accountsInPractice(
      em,
      input.lines.map((l) => l.accountId),
      input.practiceId,
    );
    await this.costCentersInPractice(
      em,
      input.lines.map((l) => l.costCenterId),
      input.practiceId,
    );
    await this.profitCentersInTenant(
      em,
      input.lines.map((l) => l.profitCenterId),
    );
    return period;
  }

  /** Periodo y ejercicio al que pertenece, para decidir su dueño. */
  private async periodAndYear(em: EntityManager, periodId: string) {
    const period = await this.fiscalRepo.findPeriodById(em, periodId);
    const year = period
      ? await this.fiscalRepo.findYearById(em, period.fiscalYearId)
      : null;
    return { period, year };
  }

  /** Acota un recurso al tenant activo a través de la práctica que lo posee. */
  private async byPractice<T>(
    resource: T | null | undefined,
    practiceId: string | undefined,
    failure: ResourceScopeFailure,
  ): Promise<T> {
    const tenantId = requireTenantId();
    const owner = practiceId
      ? await this.practiceTenantLookup.findTenantOfPractice(practiceId)
      : null;
    return assertResourceInTenant(resource, owner, tenantId, failure);
  }
}

/** Ids presentes y sin repetir, en orden de aparición. */
function unique(ids: readonly (string | undefined)[]): string[] {
  return [...new Set(ids.filter((id): id is string => Boolean(id)))];
}
