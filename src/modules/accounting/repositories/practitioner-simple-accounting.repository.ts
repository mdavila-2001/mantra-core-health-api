import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PractitionerSimpleAccounts,
  PractitionerSimpleRecords,
  PractitionerSimpleTransactions,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta una cuenta de la contabilidad simple. */
export interface CreateSimpleAccountData {
  practiceId: string;
  code: string;
  name: string;
  accountClass: string;
  seeded: boolean;
  actorUserId?: string;
}

/** Datos para dar de alta un gasto, un activo o una deuda. */
export interface CreateSimpleRecordData {
  practiceId: string;
  kind: string;
  recordDate: Date;
  accountId: string;
  description: string;
  amount: string;
  actorUserId?: string;
}

/** Datos para dar de alta una transacción debe/haber. */
export interface CreateSimpleTransactionData {
  practiceId: string;
  transactionDate: Date;
  description: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  actorUserId?: string;
}

/**
 * Acceso a las tres tablas de la contabilidad simple del doctor (P49):
 * `practitioner_simple_accounts`, `_records` y `_transactions`.
 *
 * Todo cuelga de la práctica: ninguna lectura devuelve filas de otra.
 */
@Injectable()
export class PractitionerSimpleAccountingRepository {
  /* ---- cuentas ---------------------------------------------------------- */

  /** Las cuentas de la práctica, sin orden garantizado (el servicio ordena por código). */
  listAccounts(
    em: EntityManager,
    practiceId: string,
  ): Promise<PractitionerSimpleAccounts[]> {
    return em.find(PractitionerSimpleAccounts, { practiceId });
  }

  findAccount(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerSimpleAccounts | null> {
    return em.findOne(PractitionerSimpleAccounts, { id });
  }

  /** Cuántas generales sembradas tiene la práctica; 0 quiere decir «todavía no se sembró». */
  countSeededAccounts(em: EntityManager, practiceId: string): Promise<number> {
    return em.count(PractitionerSimpleAccounts, { practiceId, seeded: true });
  }

  createAccount(
    em: EntityManager,
    data: CreateSimpleAccountData,
  ): PractitionerSimpleAccounts {
    return em.create(
      PractitionerSimpleAccounts,
      {
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        accountClass: data.accountClass,
        seeded: data.seeded,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Siembra las cuentas generales de la práctica en UNA sentencia
   * `INSERT … ON CONFLICT (practice_id, code) DO NOTHING`.
   *
   * Es lo que vuelve segura la siembra concurrente: dos pedidos que llegan a la
   * vez a una práctica sin cuentas ven ambos «cero sembradas», y con `em.create`
   * + `flush` el segundo chocaba con el UNIQUE `(practice_id, code)` y fallaba.
   * Aquí el segundo espera a que el primero confirme y no inserta nada: quedan
   * exactamente las filas de la lista, una vez. Una fila que ya existe con ese
   * código (renombrada o propia) no se toca: `DO NOTHING`, nunca `DO UPDATE`.
   *
   * Las filas viajan siempre en el mismo orden, así que dos siembras a la vez
   * toman los bloqueos de índice en el mismo orden y no se interbloquean. Va por
   * el `EntityManager` recibido para correr dentro de su transacción, si la hay.
   * La tabla no tiene espejo `audit.*_history`, así que saltarse el ORM no deja
   * una revisión sin sellar.
   *
   * @returns Cuántas filas insertó esta llamada (0 si otra se le adelantó).
   */
  async seedAccounts(
    em: EntityManager,
    practiceId: string,
    accounts: ReadonlyArray<
      readonly [code: string, name: string, accountClass: string]
    >,
    actorUserId?: string,
  ): Promise<number> {
    if (accounts.length === 0) return 0;
    const row = '(?, ?, ?, ?, ?, true, now(), now(), ?, ?)';
    const params = accounts.flatMap(([code, name, accountClass]) => [
      randomUUID(),
      practiceId,
      code,
      name,
      accountClass,
      actorUserId ?? null,
      actorUserId ?? null,
    ]);
    const inserted = await em.execute<Array<{ id: string }>>(
      `insert into accounting.practitioner_simple_accounts
         (id, practice_id, code, name, account_class, seeded,
          created_at, updated_at, created_by_user_id, updated_by_user_id)
       values ${accounts.map(() => row).join(', ')}
       on conflict (practice_id, code) do nothing
       returning id`,
      params,
    );
    return inserted.length;
  }

  /** Cuántos registros y transacciones cuelgan de una cuenta. */
  async countAccountUsage(
    em: EntityManager,
    accountId: string,
  ): Promise<number> {
    const [records, transactions] = await Promise.all([
      em.count(PractitionerSimpleRecords, { accountId }),
      em.count(PractitionerSimpleTransactions, {
        $or: [{ debitAccountId: accountId }, { creditAccountId: accountId }],
      }),
    ]);
    return records + transactions;
  }

  /* ---- gastos, activos y deudas ----------------------------------------- */

  listRecords(
    em: EntityManager,
    practiceId: string,
    kind?: string,
  ): Promise<PractitionerSimpleRecords[]> {
    return em.find(
      PractitionerSimpleRecords,
      kind ? { practiceId, kind } : { practiceId },
      { orderBy: { recordDate: 'DESC', createdAt: 'DESC' } },
    );
  }

  findRecord(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerSimpleRecords | null> {
    return em.findOne(PractitionerSimpleRecords, { id });
  }

  createRecord(
    em: EntityManager,
    data: CreateSimpleRecordData,
  ): PractitionerSimpleRecords {
    return em.create(
      PractitionerSimpleRecords,
      {
        practiceId: data.practiceId,
        kind: data.kind,
        recordDate: data.recordDate,
        accountId: data.accountId,
        description: data.description,
        amount: data.amount,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /* ---- transacciones debe/haber ----------------------------------------- */

  listTransactions(
    em: EntityManager,
    practiceId: string,
  ): Promise<PractitionerSimpleTransactions[]> {
    return em.find(
      PractitionerSimpleTransactions,
      { practiceId },
      { orderBy: { transactionDate: 'DESC', createdAt: 'DESC' } },
    );
  }

  findTransaction(
    em: EntityManager,
    id: string,
  ): Promise<PractitionerSimpleTransactions | null> {
    return em.findOne(PractitionerSimpleTransactions, { id });
  }

  createTransaction(
    em: EntityManager,
    data: CreateSimpleTransactionData,
  ): PractitionerSimpleTransactions {
    return em.create(
      PractitionerSimpleTransactions,
      {
        practiceId: data.practiceId,
        transactionDate: data.transactionDate,
        description: data.description,
        debitAccountId: data.debitAccountId,
        creditAccountId: data.creditAccountId,
        amount: data.amount,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
