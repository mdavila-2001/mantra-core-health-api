import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  decodeKeysetCursor,
  encodeKeysetCursor,
  getCurrentTenantId,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { Practices } from '../../practice/entities';
import { PracticeTenantLookupService } from '../../practice/services';
import { AccountsRepository, JournalRepository } from '../repositories';
import { ACCT } from '../accounting.concepts';
import { aCentimos, aTexto, importeEnBase } from './money';
import type {
  BalanceSheetResponseDto,
  ChartOfAccountsResponseDto,
  FinancialStatementLineDto,
  FinancialStatementQueryDto,
  GeneralLedgerQueryDto,
  GeneralLedgerResponseDto,
  IncomeStatementResponseDto,
  JournalTransactionDetailDto,
  ListJournalQueryDto,
  ListJournalResponseDto,
  TrialBalanceQueryDto,
  TrialBalanceResponseDto,
} from '../dto';
import { LEDGER_DEFAULT_LIMIT } from '../dto';

/**
 * La cara de **lectura** del mayor: plan de cuentas, libro diario, el asiento
 * con sus líneas, y el balance de sumas y saldos.
 *
 * ## Por qué faltaba y por qué importa
 *
 * El módulo tenía **20 escrituras y ninguna lectura**. Se podían postear
 * asientos —balanceados, en período abierto, con reversa espejo: el núcleo
 * contable es correcto y está probado— pero no había forma de **verlos**. Un
 * motor de asientos sin libros no es un producto contable: es un buzón donde se
 * deposita información que nadie puede volver a mirar.
 *
 * La consecuencia práctica: no se podía construir ninguna pantalla de
 * contabilidad, y la sección quedó marcada «planificada» sin que se supiera que
 * el bloqueo no era de diseño sino de contrato.
 *
 * ## Las cuatro lecturas son el mínimo de un libro contable
 *
 * Plan de cuentas, diario, asiento con sus líneas y sumas y saldos. Con menos no
 * se puede auditar: sin el diario no se sabe qué se asentó, sin las líneas no se
 * sabe contra qué cuentas, y sin sumas y saldos no se puede comprobar que el
 * conjunto cuadra.
 *
 * ## El balance sólo cuenta lo POSTEADO
 *
 * Un borrador o un asiento en revisión **no son hechos contables todavía**.
 * Incluirlos daría un balance que no coincide con los libros y que cambia solo
 * cuando alguien aprueba algo. Los reversados sí entran: su asiento espejo los
 * neutraliza, que es exactamente cómo la contabilidad corrige sin borrar.
 */
@Injectable()
export class LedgerReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param journalRepo - Asientos y sus líneas.
   * @param accountsRepo - Plan de cuentas.
   * @param practiceTenantLookup - Vínculo activo profesional↔práctica (Carril 18),
   *   para las lecturas nuevas de TAREA-20 (AC-20-12). Opcional para no romper
   *   la construcción en los specs previos que no lo necesitan.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly journalRepo: JournalRepository,
    private readonly accountsRepo: AccountsRepository,
    private readonly practiceTenantLookup?: PracticeTenantLookupService,
  ) {}

  /**
   * Carril 18 — igual que `LedgerService.assertPractitionerOwnsPractice`
   * (duplicado deliberado y mínimo: unificarlo en un guard compartido es
   * refactor fuera del alcance de esta tarea). Un `PRACTITIONER` sólo puede
   * leer los libros de una práctica a la que está vinculado con una
   * asignación de rol ACTIVE; `SECURITY_ADMIN`/`ACCOUNTING_APPROVER` pasan
   * sin restricción. AC-20-12: la respuesta es **422**, no una lista vacía —
   * vacío y prohibido son cosas distintas.
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
    // Sin lookup inyectado (specs previos), no hay forma de verificar: se
    // deniega en vez de tratar "no puedo verificar" como "está permitido".
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

  /**
   * Comprueba que la práctica consultada pertenece al tenant activo.
   *
   * Hace falta explícitamente y no basta con confiar en RLS: `RLS_ENFORCE`
   * está apagado en desarrollo, y ninguna tabla de `accounting` lleva
   * `tenant_id` —el dueño es la práctica—. Sin esta comprobación, abrir las
   * lecturas más allá de `SECURITY_ADMIN` dejaría a cualquier profesional leer
   * los libros de otra organización con sólo adivinar un `practiceId`. En un
   * módulo contable eso no es una fuga cualquiera: son los estados financieros.
   *
   * Responde 403 y no 404 a propósito: la práctica existe, y fingir lo
   * contrario para no revelar su existencia complicaría el diagnóstico sin
   * ganar nada — el id ya lo tenía quien preguntó.
   */
  private async verificarPracticaDelTenant(practiceId: string): Promise<void> {
    const tenantId = getCurrentTenantId();
    // Sin tenant en contexto son los carriles internos (`SYSTEM`, workers), que
    // no pasan por la cabecera. No hay nada que acotar contra qué.
    if (tenantId === undefined) return;

    const practica = await this.em
      .fork()
      .findOne(Practices, { id: practiceId }, { fields: ['id', 'tenantId'] });

    if (practica === null) {
      throw new ResourceNotFoundException('Práctica no encontrada', {
        practiceId,
      });
    }
    if (practica.tenantId !== tenantId) {
      throw new ForbiddenException(
        'La práctica consultada pertenece a otra organización',
      );
    }
  }

  /**
   * El plan de cuentas de una práctica (UC-16-01·L).
   *
   * @param practiceId - Práctica dueña del plan.
   * @param limit - Tope de filas.
   * @returns Las cuentas ordenadas por código.
   */
  async chartOfAccounts(
    practiceId: string,
    limit = LEDGER_DEFAULT_LIMIT,
  ): Promise<ChartOfAccountsResponseDto> {
    await this.verificarPracticaDelTenant(practiceId);

    const em = this.em.fork();
    const cuentas = await this.accountsRepo.findByPractice(
      em,
      practiceId,
      limit,
    );

    return {
      items: cuentas.map((cuenta) => ({
        id: cuenta.id,
        code: cuenta.code,
        name: cuenta.name,
        accountTypeConceptId: cuenta.accountTypeConceptId,
        normalBalanceConceptId: cuenta.normalBalanceConceptId,
        parentAccountId: cuenta.parentAccountId ?? null,
        currencyConceptId: cuenta.currencyConceptId ?? null,
      })),
      count: cuentas.length,
      limit,
    };
  }

  /**
   * El libro diario (UC-16-01·L).
   *
   * @param query - Práctica obligatoria; período, estado y ventana opcionales.
   * @returns Los asientos, del más reciente al más antiguo.
   */
  async listJournal(
    query: ListJournalQueryDto,
  ): Promise<ListJournalResponseDto> {
    await this.verificarPracticaDelTenant(query.practiceId);

    const limit = query.limit ?? LEDGER_DEFAULT_LIMIT;
    const em = this.em.fork();

    const asientos = await this.journalRepo.findTransactions(
      em,
      {
        practiceId: query.practiceId,
        ...(query.fiscalPeriodId === undefined
          ? {}
          : { fiscalPeriodId: query.fiscalPeriodId }),
        ...(query.statusConceptId === undefined
          ? {}
          : { statusConceptId: query.statusConceptId }),
        ...(query.from === undefined ? {} : { from: new Date(query.from) }),
        ...(query.to === undefined ? {} : { to: new Date(query.to) }),
      },
      limit,
    );

    return {
      items: asientos.map((a) => ({
        id: a.id,
        transactionNumber: a.transactionNumber ?? null,
        transactionDate: a.transactionDate,
        fiscalPeriodId: a.fiscalPeriodId ?? null,
        statusConceptId: a.statusConceptId,
        transactionTypeConceptId: a.transactionTypeConceptId ?? null,
        currencyConceptId: a.currencyConceptId ?? null,
        totalAmount: a.totalAmount ?? null,
        postedAt: a.postedAt ?? null,
      })),
      count: asientos.length,
      limit,
    };
  }

  /**
   * Un asiento con sus líneas (UC-16-01·D).
   *
   * @param transactionId - Asiento a leer.
   * @returns El asiento y sus líneas, en orden de captura.
   * @throws ResourceNotFoundException si no existe.
   */
  async getJournalTransaction(
    transactionId: string,
  ): Promise<JournalTransactionDetailDto> {
    const em = this.em.fork();
    const asiento = await this.journalRepo.findTransactionById(
      em,
      transactionId,
    );
    if (!asiento) {
      throw new ResourceNotFoundException('Asiento no encontrado', {
        transactionId,
      });
    }
    // Acá la práctica se conoce recién al cargar el asiento, así que la
    // comprobación va después de la carga y antes de devolver nada.
    await this.verificarPracticaDelTenant(asiento.practiceId);

    const lineas = await this.journalRepo.findEntriesByTransaction(
      em,
      transactionId,
    );

    return {
      id: asiento.id,
      practiceId: asiento.practiceId,
      transactionNumber: asiento.transactionNumber ?? null,
      transactionDate: asiento.transactionDate,
      fiscalPeriodId: asiento.fiscalPeriodId ?? null,
      statusConceptId: asiento.statusConceptId,
      currencyConceptId: asiento.currencyConceptId ?? null,
      totalAmount: asiento.totalAmount ?? null,
      postedAt: asiento.postedAt ?? null,
      lines: lineas.map((l) => ({
        id: l.id,
        lineNo: l.lineNo ?? null,
        accountId: l.accountId,
        directionConceptId: l.directionConceptId,
        amountBase: importeEnBase(l),
        costCenterId: l.costCenterId ?? null,
        currencyConceptId: l.currencyConceptId ?? null,
      })),
    };
  }

  /**
   * Balance de **sumas y saldos** (UC-16-06).
   *
   * Es la comprobación que un contador hace primero: si el total del debe no
   * iguala al total del haber, hay algo mal y no se sigue. Por eso la respuesta
   * declara `balanced` explícitamente en vez de dejar que quien la lea sume dos
   * columnas y decida.
   *
   * El saldo por cuenta se da **con signo por naturaleza**: para una cuenta de
   * saldo deudor es `debe − haber`, y para una acreedora al revés. Sin eso, un
   * pasivo con saldo correcto se leería como negativo y parecería un error.
   *
   * @param query - Práctica obligatoria; período y ventana opcionales.
   * @returns Las cuentas con sus sumas y su saldo, y si el conjunto cuadra.
   */
  async trialBalance(
    query: TrialBalanceQueryDto,
  ): Promise<TrialBalanceResponseDto> {
    await this.verificarPracticaDelTenant(query.practiceId);

    const em = this.em.fork();

    // Sólo lo POSTEADO: un borrador no es un hecho contable.
    const asientos = await this.journalRepo.findTransactions(
      em,
      {
        practiceId: query.practiceId,
        statusConceptId: ACCT.TXN_POSTED,
        ...(query.fiscalPeriodId === undefined
          ? {}
          : { fiscalPeriodId: query.fiscalPeriodId }),
        ...(query.from === undefined ? {} : { from: new Date(query.from) }),
        ...(query.to === undefined ? {} : { to: new Date(query.to) }),
      },
      TRIAL_BALANCE_MAX_TRANSACTIONS,
    );

    const lineas = await this.journalRepo.findEntriesByTransactions(
      em,
      asientos.map((a) => a.id),
    );

    const cuentas = await this.accountsRepo.findByPractice(
      em,
      query.practiceId,
      TRIAL_BALANCE_MAX_ACCOUNTS,
    );
    const porId = new Map(cuentas.map((c) => [c.id, c]));

    /** Sumas por cuenta, en céntimos enteros: el dinero no se suma en flotante. */
    const sumas = new Map<string, { debe: bigint; haber: bigint }>();
    for (const linea of lineas) {
      const actual = sumas.get(linea.accountId) ?? { debe: 0n, haber: 0n };
      const importe = aCentimos(importeEnBase(linea));
      if (linea.directionConceptId === ACCT.DIRECTION_DEBIT) {
        actual.debe += importe;
      } else {
        actual.haber += importe;
      }
      sumas.set(linea.accountId, actual);
    }

    let totalDebe = 0n;
    let totalHaber = 0n;
    const items = [...sumas.entries()]
      .map(([accountId, { debe, haber }]) => {
        totalDebe += debe;
        totalHaber += haber;
        const cuenta = porId.get(accountId);
        const deudora = cuenta?.normalBalanceConceptId === ACCT.DIRECTION_DEBIT;
        const saldo = deudora ? debe - haber : haber - debe;
        return {
          accountId,
          code: cuenta?.code ?? null,
          name: cuenta?.name ?? null,
          normalBalanceConceptId: cuenta?.normalBalanceConceptId ?? null,
          debit: aTexto(debe),
          credit: aTexto(haber),
          balance: aTexto(saldo),
        };
      })
      // Por código, que es como se lee un balance; las cuentas sin código —que
      // no deberían existir— van al final en vez de romper el orden.
      .sort((a, b) => (a.code ?? '￿').localeCompare(b.code ?? '￿'));

    return {
      items,
      count: items.length,
      totalDebit: aTexto(totalDebe),
      totalCredit: aTexto(totalHaber),
      /** La comprobación que se hace primero: si no cuadra, no se sigue. */
      balanced: totalDebe === totalHaber,
      transactionsIncluded: asientos.length,
      truncated: asientos.length >= TRIAL_BALANCE_MAX_TRANSACTIONS,
    };
  }

  /**
   * Libro mayor de **una** cuenta (TAREA-20 S3): sus movimientos POSTEADOS,
   * del más antiguo al más reciente, con saldo corrido.
   *
   * A diferencia del libro diario, que lista asientos completos, acá cada
   * fila es una línea contra `accountId` — la contrapartida no aparece,
   * exactamente como un mayor en papel: una hoja por cuenta.
   *
   * Pagina por **cursor** (`transactionDate`, `id`), nunca por `limit` con
   * desplazamiento (AC-20-14): una cuenta con movimiento constante no puede
   * ofrecer «página 5» de forma estable.
   *
   * @param query - Práctica y cuenta obligatorias; ventana y cursor opcionales.
   * @returns La página pedida, con el saldo de apertura de la ventana.
   */
  async generalLedger(
    query: GeneralLedgerQueryDto,
    actor: AuthenticatedUser,
  ): Promise<GeneralLedgerResponseDto> {
    await this.verificarPracticaDelTenant(query.practiceId);
    await this.assertPractitionerOwnsPractice(actor, query.practiceId);

    const em = this.em.fork();
    const limit = query.limit ?? LEDGER_DEFAULT_LIMIT;

    const cuenta = await this.accountsRepo.findById(em, query.accountId);
    if (!cuenta || cuenta.practiceId !== query.practiceId) {
      throw new ResourceNotFoundException(
        'Cuenta no encontrada en la práctica',
        {
          accountId: query.accountId,
        },
      );
    }
    const deudora = cuenta.normalBalanceConceptId === ACCT.DIRECTION_DEBIT;

    // Sólo lo POSTEADO: un borrador no es un hecho contable (mismo criterio
    // que trialBalance).
    const asientos = await this.journalRepo.findTransactions(
      em,
      {
        practiceId: query.practiceId,
        statusConceptId: ACCT.TXN_POSTED,
        ...(query.from === undefined ? {} : { from: new Date(query.from) }),
        ...(query.to === undefined ? {} : { to: new Date(query.to) }),
      },
      TRIAL_BALANCE_MAX_TRANSACTIONS,
    );
    const fechaPorTransaccion = new Map(
      asientos.map((a) => [a.id, a.transactionDate] as const),
    );
    const numeroPorTransaccion = new Map(
      asientos.map((a) => [a.id, a.transactionNumber ?? null] as const),
    );

    const lineas = (
      await this.journalRepo.findEntriesByTransactions(
        em,
        asientos.map((a) => a.id),
      )
    )
      .filter((l) => l.accountId === query.accountId)
      .map((l) => ({
        id: l.id,
        transactionId: l.transactionId,
        transactionDate: fechaPorTransaccion.get(l.transactionId) as Date,
        directionConceptId: l.directionConceptId,
        amount: importeEnBase(l),
        memo: l.memo ?? null,
      }))
      // Cronológico, ascendente: es como se lee un mayor. `id` desempata
      // dentro del mismo instante para que el orden sea estable entre páginas.
      .sort((a, b) => {
        const porFecha =
          a.transactionDate.getTime() - b.transactionDate.getTime();
        return porFecha !== 0 ? porFecha : a.id.localeCompare(b.id);
      });

    // Saldo corrido calculado sobre TODA la serie, desde el origen, antes de
    // recortar la página: así el saldo de apertura de la página 2 es exacto
    // aunque la página 1 nunca se haya pedido.
    let acumulado = 0n;
    const conSaldo = lineas.map((linea) => {
      const importe = aCentimos(linea.amount);
      acumulado +=
        linea.directionConceptId === ACCT.DIRECTION_DEBIT
          ? deudora
            ? importe
            : -importe
          : deudora
            ? -importe
            : importe;
      return { ...linea, runningBalance: acumulado };
    });

    const after = query.cursor ? decodeKeysetCursor(query.cursor) : undefined;
    const afterFecha =
      typeof after?.transactionDate === 'string'
        ? new Date(after.transactionDate).getTime()
        : undefined;
    const afterId = typeof after?.id === 'string' ? after.id : undefined;

    const inicio =
      afterFecha === undefined
        ? 0
        : conSaldo.findIndex((l) => {
            const cmp = l.transactionDate.getTime() - afterFecha;
            return (
              cmp > 0 ||
              (cmp === 0 &&
                afterId !== undefined &&
                l.id.localeCompare(afterId) > 0)
            );
          });
    const desde = inicio === -1 ? conSaldo.length : inicio;

    const saldoApertura =
      desde > 0 ? aTexto(conSaldo[desde - 1].runningBalance) : '0.00';
    const pagina = conSaldo.slice(desde, desde + limit);
    const ultima = pagina.at(-1);
    const huboMas = desde + limit < conSaldo.length;

    return {
      accountId: cuenta.id,
      code: cuenta.code,
      name: cuenta.name,
      normalBalanceConceptId: cuenta.normalBalanceConceptId,
      currencyConceptId: cuenta.currencyConceptId ?? null,
      openingBalance: saldoApertura,
      items: pagina.map((l) => ({
        id: l.id,
        transactionId: l.transactionId,
        transactionNumber: numeroPorTransaccion.get(l.transactionId) ?? null,
        transactionDate: l.transactionDate,
        directionConceptId: l.directionConceptId,
        debit:
          l.directionConceptId === ACCT.DIRECTION_DEBIT ? l.amount : '0.00',
        credit:
          l.directionConceptId === ACCT.DIRECTION_CREDIT ? l.amount : '0.00',
        runningBalance: aTexto(l.runningBalance),
        memo: l.memo,
      })),
      count: pagina.length,
      limit,
      nextCursor:
        huboMas && ultima
          ? encodeKeysetCursor({
              transactionDate: ultima.transactionDate.toISOString(),
              id: ultima.id,
            })
          : null,
    };
  }

  /**
   * Agrega las líneas POSTEADAS de una práctica por cuenta, con el
   * `accountTypeConceptId` incluido — lo que `trialBalance` no expone porque
   * no lo necesita, y que el estado de resultados y el balance general sí.
   *
   * Reutiliza la misma fuente que `trialBalance` (asientos POSTEADOS +
   * `amount`/`amount_base`) a propósito: si este agregado y el libro mayor
   * dieran números distintos para la misma cuenta habría dos fuentes de
   * verdad, que es exactamente lo que AC-20-7 prohíbe.
   */
  private async aggregatePostedByAccount(
    practiceId: string,
    filtros: { fiscalPeriodId?: string; from?: Date; to?: Date },
  ): Promise<{
    items: Array<
      FinancialStatementLineDto & { normalBalanceConceptId: string | null }
    >;
    truncated: boolean;
  }> {
    const em = this.em.fork();

    const asientos = await this.journalRepo.findTransactions(
      em,
      {
        practiceId,
        statusConceptId: ACCT.TXN_POSTED,
        ...filtros,
      },
      TRIAL_BALANCE_MAX_TRANSACTIONS,
    );
    const lineas = await this.journalRepo.findEntriesByTransactions(
      em,
      asientos.map((a) => a.id),
    );
    const cuentas = await this.accountsRepo.findByPractice(
      em,
      practiceId,
      TRIAL_BALANCE_MAX_ACCOUNTS,
    );
    const porId = new Map(cuentas.map((c) => [c.id, c]));

    const sumas = new Map<string, bigint>();
    for (const linea of lineas) {
      const cuenta = porId.get(linea.accountId);
      const deudora = cuenta?.normalBalanceConceptId === ACCT.DIRECTION_DEBIT;
      const importe = aCentimos(importeEnBase(linea));
      const signo =
        linea.directionConceptId === ACCT.DIRECTION_DEBIT
          ? deudora
            ? importe
            : -importe
          : deudora
            ? -importe
            : importe;
      sumas.set(linea.accountId, (sumas.get(linea.accountId) ?? 0n) + signo);
    }

    const items = [...sumas.entries()]
      .map(([accountId, saldo]) => {
        const cuenta = porId.get(accountId);
        return {
          accountId,
          code: cuenta?.code ?? null,
          name: cuenta?.name ?? null,
          accountTypeConceptId: cuenta?.accountTypeConceptId ?? '',
          normalBalanceConceptId: cuenta?.normalBalanceConceptId ?? null,
          amount: aTexto(saldo),
        };
      })
      .sort((a, b) => (a.code ?? '￿').localeCompare(b.code ?? '￿'));

    return {
      items,
      truncated: asientos.length >= TRIAL_BALANCE_MAX_TRANSACTIONS,
    };
  }

  /**
   * Estado de resultados (TAREA-20 S3): ingresos y gastos POSTEADOS de la
   * ventana pedida. Ver AC-20-7: agrega desde la misma fuente que el libro
   * mayor, así que no puede divergir de él para la misma cuenta y período.
   *
   * @param query - Práctica obligatoria; ventana, período y cursor opcionales.
   */
  async incomeStatement(
    query: FinancialStatementQueryDto,
    actor: AuthenticatedUser,
  ): Promise<IncomeStatementResponseDto> {
    await this.verificarPracticaDelTenant(query.practiceId);
    await this.assertPractitionerOwnsPractice(actor, query.practiceId);
    const limit = query.limit ?? LEDGER_DEFAULT_LIMIT;

    const { items, truncated } = await this.aggregatePostedByAccount(
      query.practiceId,
      {
        ...(query.fiscalPeriodId === undefined
          ? {}
          : { fiscalPeriodId: query.fiscalPeriodId }),
        ...(query.from === undefined ? {} : { from: new Date(query.from) }),
        ...(query.to === undefined ? {} : { to: new Date(query.to) }),
      },
    );

    const revenueItems = items.filter(
      (i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_REVENUE,
    );
    const expenseItems = items.filter(
      (i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_EXPENSE,
    );

    const { page, nextCursor } = paginarPorCodigo(
      [...revenueItems, ...expenseItems],
      query.cursor,
      limit,
    );
    const revenuePage = page.filter(
      (i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_REVENUE,
    );
    const expensePage = page.filter(
      (i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_EXPENSE,
    );

    const totalRevenue = revenueItems.reduce(
      (acc, i) => acc + aCentimos(i.amount),
      0n,
    );
    const totalExpense = expenseItems.reduce(
      (acc, i) => acc + aCentimos(i.amount),
      0n,
    );

    return {
      revenueItems: revenuePage.map(sinNormalBalance),
      expenseItems: expensePage.map(sinNormalBalance),
      totalRevenue: aTexto(totalRevenue),
      totalExpense: aTexto(totalExpense),
      netIncome: aTexto(totalRevenue - totalExpense),
      count: page.length,
      limit,
      nextCursor,
      truncated,
    };
  }

  /**
   * Balance general (TAREA-20 S3): activo, pasivo y patrimonio a una fecha
   * de corte (`query.to`, por omisión hoy). Distinto del balance de sumas y
   * saldos, que no clasifica por tipo de cuenta.
   *
   * El patrimonio incorpora el resultado del período (`netIncomeOfPeriod`)
   * porque este módulo no tiene asiento de cierre: sin sumarlo, activo no
   * cuadraría contra pasivo + patrimonio pese a que la partida doble esté
   * intacta (AC-20-6).
   *
   * @param query - Práctica obligatoria; fecha de corte y cursor opcionales.
   */
  async balanceSheet(
    query: FinancialStatementQueryDto,
    actor: AuthenticatedUser,
  ): Promise<BalanceSheetResponseDto> {
    await this.verificarPracticaDelTenant(query.practiceId);
    await this.assertPractitionerOwnsPractice(actor, query.practiceId);
    const limit = query.limit ?? LEDGER_DEFAULT_LIMIT;
    const asOf = query.to === undefined ? undefined : new Date(query.to);

    const { items, truncated } = await this.aggregatePostedByAccount(
      query.practiceId,
      asOf === undefined ? {} : { to: asOf },
    );

    const assetItems = items.filter(
      (i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_ASSET,
    );
    const liabilityItems = items.filter(
      (i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_LIABILITY,
    );
    const equityItems = items.filter(
      (i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_EQUITY,
    );
    const revenueTotal = items
      .filter((i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_REVENUE)
      .reduce((acc, i) => acc + aCentimos(i.amount), 0n);
    const expenseTotal = items
      .filter((i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_EXPENSE)
      .reduce((acc, i) => acc + aCentimos(i.amount), 0n);
    const netIncome = revenueTotal - expenseTotal;

    const { page, nextCursor } = paginarPorCodigo(
      [...assetItems, ...liabilityItems, ...equityItems],
      query.cursor,
      limit,
    );

    const totalAssets = assetItems.reduce(
      (acc, i) => acc + aCentimos(i.amount),
      0n,
    );
    const totalLiabilities = liabilityItems.reduce(
      (acc, i) => acc + aCentimos(i.amount),
      0n,
    );
    const totalEquityDeclarado = equityItems.reduce(
      (acc, i) => acc + aCentimos(i.amount),
      0n,
    );
    const totalEquity = totalEquityDeclarado + netIncome;
    const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

    return {
      assetItems: page
        .filter((i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_ASSET)
        .map(sinNormalBalance),
      liabilityItems: page
        .filter((i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_LIABILITY)
        .map(sinNormalBalance),
      equityItems: page
        .filter((i) => i.accountTypeConceptId === ACCT.ACCOUNT_TYPE_EQUITY)
        .map(sinNormalBalance),
      netIncomeOfPeriod: aTexto(netIncome),
      totalAssets: aTexto(totalAssets),
      totalLiabilities: aTexto(totalLiabilities),
      totalEquity: aTexto(totalEquity),
      totalLiabilitiesAndEquity: aTexto(totalLiabilitiesAndEquity),
      balanced: totalAssets === totalLiabilitiesAndEquity,
      count: page.length,
      limit,
      nextCursor,
      truncated,
    };
  }
}

/** Quita el campo interno `normalBalanceConceptId` antes de responder. */
function sinNormalBalance(
  item: FinancialStatementLineDto & { normalBalanceConceptId: string | null },
): FinancialStatementLineDto {
  const { normalBalanceConceptId: _normalBalanceConceptId, ...resto } = item;
  return resto;
}

/**
 * Pagina una lista ya ordenada por `code` con un cursor keyset simple.
 *
 * Los informes financieros agregan por cuenta (decenas, no miles): no hace
 * falta re-consultar la base por página, alcanza con cortar el arreglo ya
 * calculado — igual que `trialBalance` ya calcula todo de una vez.
 */
function paginarPorCodigo<T extends { accountId: string; code: string | null }>(
  items: T[],
  cursor: string | undefined,
  limit: number,
): { page: T[]; nextCursor: string | null } {
  const ordenados = [...items].sort(
    (a, b) =>
      (a.code ?? '￿').localeCompare(b.code ?? '￿') ||
      a.accountId.localeCompare(b.accountId),
  );

  let desde = 0;
  if (cursor) {
    const after = decodeKeysetCursor(cursor);
    const afterCode = typeof after.code === 'string' ? after.code : null;
    const afterId =
      typeof after.accountId === 'string' ? after.accountId : undefined;
    desde = ordenados.findIndex(
      (i) =>
        (i.code ?? '￿').localeCompare(afterCode ?? '￿') > 0 ||
        ((i.code ?? '￿') === (afterCode ?? '￿') &&
          afterId !== undefined &&
          i.accountId.localeCompare(afterId) > 0),
    );
    if (desde === -1) desde = ordenados.length;
  }

  const page = ordenados.slice(desde, desde + limit);
  const ultima = page.at(-1);
  const hayMas = desde + limit < ordenados.length;

  return {
    page,
    nextCursor:
      hayMas && ultima
        ? encodeKeysetCursor({
            code: ultima.code ?? '',
            accountId: ultima.accountId,
          })
        : null,
  };
}

/**
 * Tope de asientos que agrega un balance de una sola pasada.
 *
 * Alto porque un ejercicio de una práctica chica cabe entero, y declarado
 * —`truncated`— porque un balance recortado en silencio es un balance que
 * miente, que en contabilidad es lo peor que puede pasar.
 */
const TRIAL_BALANCE_MAX_TRANSACTIONS = 10_000;
const TRIAL_BALANCE_MAX_ACCOUNTS = 5_000;
