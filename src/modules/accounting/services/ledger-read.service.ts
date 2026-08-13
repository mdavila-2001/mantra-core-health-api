import { ForbiddenException, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { getCurrentTenantId, ResourceNotFoundException } from '../../../common';
import { Practices } from '../../practice/entities';
import { AccountsRepository, JournalRepository } from '../repositories';
import { ACCT } from '../accounting.concepts';
import type {
  ChartOfAccountsResponseDto,
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
   */
  constructor(
    private readonly em: EntityManager,
    private readonly journalRepo: JournalRepository,
    private readonly accountsRepo: AccountsRepository,
  ) {}

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
        amountBase: l.amountBase ?? '0.00',
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
      const importe = aCentimos(linea.amountBase);
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

/**
 * El importe como entero de céntimos.
 *
 * El dinero **no se suma en coma flotante**: `0.1 + 0.2` no da `0.3`, y un
 * balance que no cuadra por un céntimo es indistinguible de uno que no cuadra
 * por un error real. Los importes llegan como texto decimal desde `numeric` de
 * PostgreSQL justamente para no perder precisión en el camino.
 */
function aCentimos(valor: string | number | null | undefined): bigint {
  if (valor === null || valor === undefined) {
    return 0n;
  }
  const texto = String(valor).trim();
  const negativo = texto.startsWith('-');
  const [entera = '0', decimal = ''] = texto.replace('-', '').split('.');
  const centimos = BigInt(entera) * 100n + BigInt((decimal + '00').slice(0, 2));
  return negativo ? -centimos : centimos;
}

/** De céntimos a texto decimal, que es como viaja el dinero en el contrato. */
function aTexto(centimos: bigint): string {
  const negativo = centimos < 0n;
  const abs = negativo ? -centimos : centimos;
  const entera = abs / 100n;
  const resto = abs % 100n;
  return `${negativo ? '-' : ''}${entera}.${resto.toString().padStart(2, '0')}`;
}
