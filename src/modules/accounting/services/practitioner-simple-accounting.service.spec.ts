import { jest } from '@jest/globals';

/** Ver `asset.service.spec.ts`: mismo envoltorio de `jest.fn` sin tipar. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { PractitionerSimpleAccountingService } from './practitioner-simple-accounting.service';
import { AccountingScopeService } from './accounting-scope.service';
import { inTenant } from './accounting-scope.testing';
import { GENERAL_ACCOUNTS } from './practitioner-simple-accounting.rules';
import { AccountingErrorReason } from '../accounting.error-reasons';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { Appointments, Encounters } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';
import { Invoices } from '../../billing/entities';
import { BILL } from '../../billing/billing.concepts';
import {
  ClaimAdjudicationVersions,
  InsuranceClaims,
} from '../../insurance/entities';
import { INS } from '../../insurance/domain/insurance.concepts';

const PRACTICE = '11111111-1111-4111-8111-111111111111';
const OTHER_PRACTICE = '22222222-2222-4222-8222-222222222222';
/** Una práctica de OTRA organización (tenant-2). */
const FOREIGN_PRACTICE = '33333333-3333-4333-8333-333333333333';
const actor = {
  id: 'user-1',
  roles: ['PRACTITIONER'],
  practitionerProfileId: 'prof-1',
} as any;

let seq = 0;
/** uuid v4 con la forma que acepta `isUuid`, único por llamada. */
const uuid = (): string =>
  `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;

interface Row {
  id: string;
  practiceId: string;
  [key: string]: any;
}

/**
 * Repositorio en memoria con el mismo contrato que el real: así las reglas del
 * servicio se prueban contra estado, no contra llamadas.
 */
function memoryRepo() {
  const accounts: Row[] = [];
  const records: Row[] = [];
  const transactions: Row[] = [];
  const make = (target: Row[]) => (_em: any, data: any) => {
    const row = {
      id: uuid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      ...data,
    };
    target.push(row);
    return row;
  };
  return {
    accounts,
    records,
    transactions,
    listAccounts: mockFn(async (_em: any, practiceId: string) =>
      accounts.filter((a) => a.practiceId === practiceId),
    ),
    findAccount: mockFn(
      async (_em: any, id: string) => accounts.find((a) => a.id === id) ?? null,
    ),
    countSeededAccounts: mockFn(
      async (_em: any, practiceId: string) =>
        accounts.filter((a) => a.practiceId === practiceId && a.seeded).length,
    ),
    lockAccountCodes: mockFn().mockResolvedValue(undefined),
    createAccount: mockFn(make(accounts)),
    // Mismo contrato que el real: `ON CONFLICT (practice_id, code) DO NOTHING`.
    seedAccounts: mockFn(
      async (
        _em: any,
        practiceId: string,
        generals: ReadonlyArray<readonly [string, string, string]>,
        actorUserId?: string,
      ) => {
        let inserted = 0;
        for (const [code, name, accountClass] of generals) {
          if (
            accounts.some((a) => a.practiceId === practiceId && a.code === code)
          )
            continue;
          accounts.push({
            id: uuid(),
            practiceId,
            code,
            name,
            accountClass,
            seeded: true,
            createdByUserId: actorUserId,
          });
          inserted += 1;
        }
        return inserted;
      },
    ),
    countAccountUsage: mockFn(
      async (_em: any, accountId: string) =>
        records.filter((r) => r.accountId === accountId).length +
        transactions.filter(
          (t) =>
            t.debitAccountId === accountId || t.creditAccountId === accountId,
        ).length,
    ),
    listRecords: mockFn(async (_em: any, practiceId: string, kind?: string) =>
      records.filter(
        (r) => r.practiceId === practiceId && (!kind || r.kind === kind),
      ),
    ),
    findRecord: mockFn(
      async (_em: any, id: string) => records.find((r) => r.id === id) ?? null,
    ),
    createRecord: mockFn(make(records)),
    listTransactions: mockFn(async (_em: any, practiceId: string) =>
      transactions.filter((t) => t.practiceId === practiceId),
    ),
    findTransaction: mockFn(
      async (_em: any, id: string) =>
        transactions.find((t) => t.id === id) ?? null,
    ),
    createTransaction: mockFn(make(transactions)),
  };
}

function build() {
  const repo = memoryRepo();
  const removed: Row[] = [];
  const finds = new Map<unknown, any[]>();
  const em: any = {
    flush: mockFn().mockResolvedValue(undefined),
    remove: mockFn((row: Row) => {
      removed.push(row);
      for (const list of [repo.accounts, repo.records, repo.transactions]) {
        const at = list.indexOf(row);
        if (at >= 0) list.splice(at, 1);
      }
    }),
    find: mockFn(async (entity: unknown) => finds.get(entity) ?? []),
  };
  em.fork = mockFn(() => em);
  em.transactional = mockFn((cb: any) => cb(em));
  const rootEm = { fork: em.fork };
  const practitionerAccounting = {
    assertOwnsPractice: mockFn().mockResolvedValue('prof-1'),
  };
  const practiceTenantLookup = {
    findTenantOfPractice: mockFn(async (practiceId: string) =>
      practiceId === FOREIGN_PRACTICE ? 'tenant-2' : 'tenant-1',
    ),
  };
  const scope = new AccountingScopeService(
    practiceTenantLookup as any,
    ...(Array(8).fill(undefined) as [any, any, any, any, any, any, any, any]),
  );
  // Cada método corre dentro del tenant activo (tenant-1), como en una petición.
  const service = inTenant(
    new PractitionerSimpleAccountingService(
      rootEm as any,
      repo as any,
      practitionerAccounting as any,
      practiceTenantLookup as any,
      scope,
    ),
    'tenant-1',
  );
  return {
    service,
    repo,
    em,
    removed,
    finds,
    practitionerAccounting,
    practiceTenantLookup,
  };
}

/** Siembra las generales de la práctica y devuelve la cuenta por código. */
async function seeded(ctx: ReturnType<typeof build>, practiceId = PRACTICE) {
  await ctx.service.listAccounts(practiceId, actor);
  const byCode = (code: string): Row =>
    ctx.repo.accounts.find(
      (a) => a.practiceId === practiceId && a.code === code,
    )!;
  return byCode;
}

async function rejected(promise: Promise<unknown>): Promise<any> {
  return promise.then(
    () => {
      throw new Error('debía rechazar');
    },
    (e: unknown) => e,
  );
}

async function expectRejected(
  promise: Promise<unknown>,
  type: new (...args: any[]) => Error,
  message?: string,
  reason?: string,
) {
  const error = await promise.then(
    () => {
      throw new Error('debía rechazar');
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(type);
  if (message !== undefined) expect((error as Error).message).toBe(message);
  if (reason !== undefined) expect((error as any).reason).toBe(reason);
}

describe('PractitionerSimpleAccountingService (P49)', () => {
  describe('autorización', () => {
    it('toda operación verifica la vinculación con la práctica', async () => {
      const ctx = build();
      const byCode = await seeded(ctx);
      ctx.practitionerAccounting.assertOwnsPractice.mockClear();

      await ctx.service.summary(PRACTICE, 'month', actor);
      await ctx.service.listAccounts(PRACTICE, actor);
      await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Nueva', accountClass: 'EXPENSE' },
        actor,
      );
      await ctx.service.listRecords(PRACTICE, undefined, actor);
      await ctx.service.createRecord(
        {
          practiceId: PRACTICE,
          kind: 'EXPENSE',
          date: '2026-09-01',
          accountId: byCode('5.1').id,
          description: 'Alquiler',
          amount: '100',
        },
        actor,
      );
      await ctx.service.listTransactions(PRACTICE, actor);
      await ctx.service.createTransaction(
        {
          practiceId: PRACTICE,
          date: '2026-09-01',
          description: 'Depósito',
          debitAccountId: byCode('1.2').id,
          creditAccountId: byCode('1.1').id,
          amount: '10',
        },
        actor,
      );
      expect(
        ctx.practitionerAccounting.assertOwnsPractice,
      ).toHaveBeenCalledTimes(7);
      for (const call of ctx.practitionerAccounting.assertOwnsPractice.mock
        .calls) {
        expect(call).toEqual([actor, PRACTICE]);
      }
    });

    it('un profesional no vinculado no recibe nada ni escribe nada', async () => {
      const ctx = build();
      ctx.practitionerAccounting.assertOwnsPractice.mockRejectedValue(
        new PreconditionFailedException(
          'El profesional no tiene una vinculación activa con esa práctica',
        ),
      );
      await expectRejected(
        ctx.service.listAccounts(PRACTICE, actor),
        PreconditionFailedException,
      );
      await expectRejected(
        ctx.service.createAccount(
          { practiceId: PRACTICE, name: 'X', accountClass: 'EXPENSE' },
          actor,
        ),
        PreconditionFailedException,
      );
      expect(ctx.repo.accounts).toHaveLength(0);
      expect(ctx.repo.createAccount).not.toHaveBeenCalled();
    });

    it('las rutas por :id verifican contra la práctica de la FILA, no contra lo que mande el cliente', async () => {
      const ctx = build();
      await seeded(ctx, OTHER_PRACTICE);
      const foreign = ctx.repo.accounts[0];
      ctx.practitionerAccounting.assertOwnsPractice.mockRejectedValue(
        new PreconditionFailedException('no vinculado'),
      );
      await expectRejected(
        ctx.service.updateAccount(foreign.id, { name: 'Hack' }, actor),
        PreconditionFailedException,
      );
      await expectRejected(
        ctx.service.deleteAccount(foreign.id, actor),
        PreconditionFailedException,
      );
      expect(
        ctx.practitionerAccounting.assertOwnsPractice,
      ).toHaveBeenLastCalledWith(actor, OTHER_PRACTICE);
      expect(foreign.name).not.toBe('Hack');
    });
  });

  describe('alcance de tenant (ACC-01)', () => {
    async function foreignRows(ctx: ReturnType<typeof build>) {
      // La práctica ajena se siembra por el repositorio: por la API ya no se
      // puede leer desde el tenant activo.
      await ctx.repo.seedAccounts(null, FOREIGN_PRACTICE, GENERAL_ACCOUNTS);
      const account = ctx.repo.accounts.find(
        (a) => a.practiceId === FOREIGN_PRACTICE && a.code === '5.1',
      )!;
      const record = {
        id: uuid(),
        practiceId: FOREIGN_PRACTICE,
        kind: 'EXPENSE',
        recordDate: new Date('2026-09-01T00:00:00Z'),
        accountId: account.id,
        description: 'ajeno',
        amount: '1.00',
      };
      const transaction = {
        id: uuid(),
        practiceId: FOREIGN_PRACTICE,
        transactionDate: new Date('2026-09-01T00:00:00Z'),
        description: 'ajeno',
        debitAccountId: account.id,
        creditAccountId: account.id,
        amount: '1.00',
      };
      ctx.repo.records.push(record);
      ctx.repo.transactions.push(transaction);
      return { account, record, transaction };
    }

    it('lo ajeno responde idéntico a lo inexistente: 404, mismo mensaje y reason, sin details', async () => {
      const ctx = build();
      const { account, record, transaction } = await foreignRows(ctx);
      ctx.practitionerAccounting.assertOwnsPractice.mockClear();
      const missing = uuid();
      const body = (e: any) => ({
        status: e.getStatus(),
        response: e.getResponse(),
      });
      const cases: [string, () => Promise<unknown>, () => Promise<unknown>][] =
        [
          [
            'cuenta (PUT)',
            () => ctx.service.updateAccount(account.id, { name: 'X' }, actor),
            () => ctx.service.updateAccount(missing, { name: 'X' }, actor),
          ],
          [
            'cuenta (DELETE)',
            () => ctx.service.deleteAccount(account.id, actor),
            () => ctx.service.deleteAccount(missing, actor),
          ],
          [
            'registro (PUT)',
            () => ctx.service.updateRecord(record.id, {}, actor),
            () => ctx.service.updateRecord(missing, {}, actor),
          ],
          [
            'registro (DELETE)',
            () => ctx.service.deleteRecord(record.id, actor),
            () => ctx.service.deleteRecord(missing, actor),
          ],
          [
            'transacción (PUT)',
            () => ctx.service.updateTransaction(transaction.id, {}, actor),
            () => ctx.service.updateTransaction(missing, {}, actor),
          ],
          [
            'transacción (DELETE)',
            () => ctx.service.deleteTransaction(transaction.id, actor),
            () => ctx.service.deleteTransaction(missing, actor),
          ],
        ];
      for (const [, foreign, absent] of cases) {
        const a = await rejected(foreign());
        const b = await rejected(absent());
        expect(a).toBeInstanceOf(ResourceNotFoundException);
        expect(body(a)).toEqual(body(b));
        expect(JSON.stringify(body(a))).not.toContain('details');
      }
      expect(ctx.removed).toHaveLength(0);
      // y ni siquiera se llegó a preguntar por la vinculación con la práctica ajena
      expect(
        ctx.practitionerAccounting.assertOwnsPractice,
      ).not.toHaveBeenCalledWith(actor, FOREIGN_PRACTICE);
    });

    it('no se escribe en una práctica de otro tenant aunque el profesional figure vinculado', async () => {
      const ctx = build();
      const byCode = await seeded(ctx);
      const before = ctx.repo.accounts.length;
      const writes = [
        ctx.service.createAccount(
          { practiceId: FOREIGN_PRACTICE, name: 'X', accountClass: 'ASSET' },
          actor,
        ),
        ctx.service.createRecord(
          {
            practiceId: FOREIGN_PRACTICE,
            kind: 'EXPENSE',
            date: '2026-09-01',
            accountId: byCode('5.1').id,
            description: 'x',
            amount: '1',
          },
          actor,
        ),
        ctx.service.createTransaction(
          {
            practiceId: FOREIGN_PRACTICE,
            date: '2026-09-01',
            description: 'x',
            debitAccountId: byCode('1.1').id,
            creditAccountId: byCode('1.2').id,
            amount: '1',
          },
          actor,
        ),
      ];
      for (const write of writes) {
        const error = await rejected(write);
        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect(error.message).toBe('Práctica no encontrada');
      }
      expect(ctx.repo.accounts).toHaveLength(before);
      expect(ctx.repo.records).toHaveLength(0);
      expect(ctx.repo.transactions).toHaveLength(0);
    });

    it('no se lee una práctica de otro tenant aunque el profesional figure vinculado: misma respuesta que las escrituras (#995)', async () => {
      const ctx = build();
      const write = await rejected(
        ctx.service.createAccount(
          { practiceId: FOREIGN_PRACTICE, name: 'X', accountClass: 'ASSET' },
          actor,
        ),
      );
      const reads: Promise<unknown>[] = [
        ctx.service.summary(FOREIGN_PRACTICE, 'month', actor),
        ctx.service.listAccounts(FOREIGN_PRACTICE, actor),
        ctx.service.listRecords(FOREIGN_PRACTICE, undefined, actor),
        ctx.service.listTransactions(FOREIGN_PRACTICE, actor),
      ];
      for (const read of reads) {
        const error = await rejected(read);
        expect(error).toBeInstanceOf(ResourceNotFoundException);
        expect(error.getStatus()).toBe(write.getStatus());
        expect(error.getResponse()).toEqual(write.getResponse());
      }
      // ni siquiera siembra las generales en la práctica ajena
      expect(ctx.repo.seedAccounts).not.toHaveBeenCalled();
      expect(ctx.repo.accounts).toHaveLength(0);
    });
  });

  describe('cuentas', () => {
    it('siembra las 26 generales en la primera lectura y no las repite', async () => {
      const ctx = build();
      const first = await ctx.service.listAccounts(PRACTICE, actor);
      expect(first.items).toHaveLength(26);
      expect(first.items.every((a) => a.seeded)).toBe(true);
      expect(first.items.map((a) => [a.code, a.name, a.accountClass])).toEqual(
        GENERAL_ACCOUNTS.map(([code, name, cls]) => [code, name, cls]),
      );
      await ctx.service.listAccounts(PRACTICE, actor);
      expect(ctx.repo.accounts).toHaveLength(26);
      expect(ctx.repo.seedAccounts).toHaveBeenCalledTimes(1);
    });

    it('la siembra va por el repositorio idempotente, con las 26 generales y el actor', async () => {
      const ctx = build();
      await ctx.service.listAccounts(PRACTICE, actor);
      expect(ctx.repo.seedAccounts).toHaveBeenCalledWith(
        expect.anything(),
        PRACTICE,
        GENERAL_ACCOUNTS,
        actor.id,
      );
      expect(ctx.repo.createAccount).not.toHaveBeenCalled();
    });

    it('cada práctica tiene sus propias generales', async () => {
      const ctx = build();
      await ctx.service.listAccounts(PRACTICE, actor);
      await ctx.service.listAccounts(OTHER_PRACTICE, actor);
      expect(ctx.repo.accounts).toHaveLength(52);
      const ids = new Set(ctx.repo.accounts.map((a) => a.id));
      expect(ids.size).toBe(52);
    });

    it('la respuesta no expone la práctica ni las marcas de auditoría', async () => {
      const ctx = build();
      const { items } = await ctx.service.listAccounts(PRACTICE, actor);
      expect(Object.keys(items[0]).sort()).toEqual(
        ['accountClass', 'code', 'id', 'name', 'seeded'].sort(),
      );
    });

    it('ordena por código numérico: 5.10 va después de 5.9', async () => {
      const ctx = build();
      await ctx.service.listAccounts(PRACTICE, actor);
      const created = await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Capacitación', accountClass: 'EXPENSE' },
        actor,
      );
      expect(created.code).toBe('5.10');
      const { items } = await ctx.service.listAccounts(PRACTICE, actor);
      const codes = items
        .filter((a) => a.accountClass === 'EXPENSE')
        .map((a) => a.code);
      expect(codes.slice(-2)).toEqual(['5.9', '5.10']);
    });

    it('crea una cuenta propia, no sembrada, con el código siguiente de su clase', async () => {
      const ctx = build();
      const created = await ctx.service.createAccount(
        {
          practiceId: PRACTICE,
          name: '  Capacitación  ',
          accountClass: 'EXPENSE',
        },
        actor,
      );
      expect(created).toMatchObject({
        code: '5.10',
        name: 'Capacitación',
        accountClass: 'EXPENSE',
        seeded: false,
      });
      expect(ctx.repo.createAccount).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          practiceId: PRACTICE,
          actorUserId: 'user-1',
        }),
      );
    });

    it('toma el cerrojo de la práctica en la transacción antes de calcular el código (#995)', async () => {
      const ctx = build();
      await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Capacitación', accountClass: 'EXPENSE' },
        actor,
      );
      expect(ctx.em.transactional).toHaveBeenCalledTimes(1);
      expect(ctx.repo.lockAccountCodes).toHaveBeenCalledWith(ctx.em, PRACTICE);
      const lockedAt = ctx.repo.lockAccountCodes.mock.invocationCallOrder[0];
      const listedAt = ctx.repo.listAccounts.mock.invocationCallOrder[0];
      const createdAt = ctx.repo.createAccount.mock.invocationCallOrder[0];
      expect(lockedAt).toBeLessThan(listedAt);
      expect(lockedAt).toBeLessThan(createdAt);
    });

    it('rechaza con 422 y el motivo en castellano un nombre vacío, largo o una clase inválida', async () => {
      const ctx = build();
      for (const name of [undefined, '', '   ', 'x'.repeat(81)]) {
        await expectRejected(
          ctx.service.createAccount(
            { practiceId: PRACTICE, name, accountClass: 'EXPENSE' },
            actor,
          ),
          PreconditionFailedException,
          'Escriba un nombre de hasta 80 caracteres.',
          AccountingErrorReason.SIMPLE_ACCOUNTING_INVALID,
        );
      }
      for (const accountClass of [undefined, 'REVENUE', 'expense']) {
        await expectRejected(
          ctx.service.createAccount(
            { practiceId: PRACTICE, name: 'Algo', accountClass },
            actor,
          ),
          PreconditionFailedException,
          'Elija la clase de la cuenta.',
        );
      }
      expect(ctx.repo.createAccount).not.toHaveBeenCalled();
    });

    it('409 con un nombre repetido en la clase, sin distinguir tildes ni mayúsculas', async () => {
      const ctx = build();
      await expectRejected(
        ctx.service.createAccount(
          {
            practiceId: PRACTICE,
            name: ' PRESTAMO bancario',
            accountClass: 'LIABILITY',
          },
          actor,
        ),
        ConflictException,
        'Ya tiene una cuenta con ese nombre en esa clase.',
        AccountingErrorReason.SIMPLE_ACCOUNT_DUPLICATE_NAME,
      );
    });

    it('el mismo nombre en otra clase sí se permite', async () => {
      const ctx = build();
      const created = await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Caja', accountClass: 'EXPENSE' },
        actor,
      );
      expect(created.code).toBe('5.10');
    });

    it('renombra una general, pero no le cambia la clase', async () => {
      const ctx = build();
      const byCode = await seeded(ctx);
      const caja = byCode('1.1');

      const renamed = await ctx.service.updateAccount(
        caja.id,
        { name: 'Caja chica', accountClass: 'ASSET' },
        actor,
      );
      expect(renamed).toMatchObject({ name: 'Caja chica', seeded: true });
      expect(caja.updatedByUserId).toBe('user-1');

      await expectRejected(
        ctx.service.updateAccount(
          caja.id,
          { name: 'Caja chica', accountClass: 'EXPENSE' },
          actor,
        ),
        ConflictException,
        'No se puede cambiar la clase de una cuenta general o que ya se usa.',
        AccountingErrorReason.SIMPLE_ACCOUNT_SEEDED,
      );
      expect(caja.accountClass).toBe('ASSET');
    });

    it('sin accountClass en el cuerpo conserva la clase', async () => {
      const ctx = build();
      const byCode = await seeded(ctx);
      const updated = await ctx.service.updateAccount(
        byCode('5.8').id,
        { name: 'Marketing' },
        actor,
      );
      expect(updated.accountClass).toBe('EXPENSE');
    });

    it('una cuenta propia en uso no cambia de clase', async () => {
      const ctx = build();
      const mine = await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Capacitación', accountClass: 'EXPENSE' },
        actor,
      );
      await ctx.service.createRecord(
        {
          practiceId: PRACTICE,
          kind: 'EXPENSE',
          date: '2026-09-01',
          accountId: mine.id,
          description: 'Curso',
          amount: '50',
        },
        actor,
      );
      await expectRejected(
        ctx.service.updateAccount(
          mine.id,
          { name: 'Capacitación', accountClass: 'ASSET' },
          actor,
        ),
        ConflictException,
        undefined,
        AccountingErrorReason.SIMPLE_ACCOUNT_IN_USE,
      );
    });

    it('al renombrar no choca consigo misma pero sí con otra de la clase', async () => {
      const ctx = build();
      const byCode = await seeded(ctx);
      await expect(
        ctx.service.updateAccount(
          byCode('5.1').id,
          { name: 'alquiler del consultorio' },
          actor,
        ),
      ).resolves.toMatchObject({ name: 'alquiler del consultorio' });
      await expectRejected(
        ctx.service.updateAccount(
          byCode('5.2').id,
          { name: 'PUBLICIDAD' },
          actor,
        ),
        ConflictException,
        'Ya tiene una cuenta con ese nombre en esa clase.',
      );
    });

    it('404 si la cuenta no existe o el id no es un uuid', async () => {
      const ctx = build();
      await expectRejected(
        ctx.service.updateAccount(uuid(), { name: 'X' }, actor),
        ResourceNotFoundException,
        'Cuenta no encontrada',
        AccountingErrorReason.SIMPLE_ACCOUNT_NOT_FOUND,
      );
      await expectRejected(
        ctx.service.deleteAccount('no-es-uuid', actor),
        ResourceNotFoundException,
      );
    });

    it('no borra una general (409)', async () => {
      const ctx = build();
      const byCode = await seeded(ctx);
      await expectRejected(
        ctx.service.deleteAccount(byCode('1.1').id, actor),
        ConflictException,
        'Es una cuenta general: se puede renombrar, no borrar.',
        AccountingErrorReason.SIMPLE_ACCOUNT_SEEDED,
      );
      expect(ctx.removed).toHaveLength(0);
    });

    it('no borra una cuenta en uso (409, singular y plural)', async () => {
      const ctx = build();
      const byCode = await seeded(ctx);
      const mine = await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Capacitación', accountClass: 'EXPENSE' },
        actor,
      );
      await ctx.service.createRecord(
        {
          practiceId: PRACTICE,
          kind: 'EXPENSE',
          date: '2026-09-01',
          accountId: mine.id,
          description: 'Curso',
          amount: '50',
        },
        actor,
      );
      await expectRejected(
        ctx.service.deleteAccount(mine.id, actor),
        ConflictException,
        'La usa 1 registro: cambiales la cuenta antes de borrarla.',
        AccountingErrorReason.SIMPLE_ACCOUNT_IN_USE,
      );
      const mine2 = await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Fondo', accountClass: 'ASSET' },
        actor,
      );
      for (const credit of ['1.1', '1.2']) {
        await ctx.service.createTransaction(
          {
            practiceId: PRACTICE,
            date: '2026-09-02',
            description: 'Mover',
            debitAccountId: mine2.id,
            creditAccountId: byCode(credit).id,
            amount: '5',
          },
          actor,
        );
      }
      await expectRejected(
        ctx.service.deleteAccount(mine2.id, actor),
        ConflictException,
        'La usan 2 registros: cambiales la cuenta antes de borrarla.',
      );
      expect(ctx.removed).toHaveLength(0);
    });

    it('borra una cuenta propia sin uso', async () => {
      const ctx = build();
      const mine = await ctx.service.createAccount(
        { practiceId: PRACTICE, name: 'Capacitación', accountClass: 'EXPENSE' },
        actor,
      );
      await ctx.service.deleteAccount(mine.id, actor);
      expect(ctx.removed.map((r) => r.id)).toEqual([mine.id]);
      expect(ctx.repo.accounts.find((a) => a.id === mine.id)).toBeUndefined();
    });
  });

  describe('gastos, activos y deudas', () => {
    async function ready() {
      const ctx = build();
      const byCode = await seeded(ctx);
      const input = (over: Record<string, unknown> = {}) => ({
        practiceId: PRACTICE,
        kind: 'EXPENSE',
        date: '2026-09-05',
        accountId: byCode('5.1').id,
        description: 'Alquiler de septiembre',
        amount: '2800',
        ...over,
      });
      return { ctx, byCode, input };
    }

    it('crea un gasto y normaliza el importe a dos decimales', async () => {
      const { ctx, input } = await ready();
      const created = await ctx.service.createRecord(input() as any, actor);
      expect(created).toEqual({
        id: expect.any(String),
        kind: 'EXPENSE',
        date: '2026-09-05',
        accountId: expect.any(String),
        description: 'Alquiler de septiembre',
        amount: '2800.00',
      });
      expect(ctx.repo.createRecord).toHaveBeenLastCalledWith(
        expect.anything(),
        expect.objectContaining({
          practiceId: PRACTICE,
          recordDate: new Date('2026-09-05T00:00:00.000Z'),
          actorUserId: 'user-1',
        }),
      );
    });

    it('el tipo tiene que ser una cuenta de la clase que corresponde', async () => {
      const { ctx, byCode, input } = await ready();
      const cases: [string, string, string][] = [
        ['EXPENSE', '1.1', 'Ese tipo no corresponde.'],
        ['ASSET', '5.1', 'Ese tipo no corresponde.'],
        ['DEBT', '1.1', 'Ese tipo no corresponde.'],
        ['DEBT', '5.1', 'Ese tipo no corresponde.'],
      ];
      for (const [kind, code, message] of cases) {
        await expectRejected(
          ctx.service.createRecord(
            input({ kind, accountId: byCode(code).id }) as any,
            actor,
          ),
          PreconditionFailedException,
          message,
        );
      }
      await expect(
        ctx.service.createRecord(
          input({ kind: 'DEBT', accountId: byCode('2.1').id }) as any,
          actor,
        ),
      ).resolves.toMatchObject({ kind: 'DEBT' });
      await expect(
        ctx.service.createRecord(
          input({ kind: 'ASSET', accountId: byCode('1.4').id }) as any,
          actor,
        ),
      ).resolves.toMatchObject({ kind: 'ASSET' });
    });

    it('rechaza con el motivo en castellano lo que falta o está mal', async () => {
      const { ctx, input } = await ready();
      const bad: [Record<string, unknown>, string][] = [
        [{ kind: undefined }, 'Falta qué es: gasto, activo o deuda.'],
        [{ kind: 'LOAN' }, 'Falta qué es: gasto, activo o deuda.'],
        [{ accountId: undefined }, 'Elija el tipo.'],
        [{ accountId: 'no-es-uuid' }, 'Elija el tipo.'],
        [{ accountId: uuid() }, 'Elija el tipo.'],
        [
          { description: '  ' },
          'Escriba una descripción de hasta 160 caracteres.',
        ],
        [{ date: '05/09/2026' }, 'Elija la fecha.'],
        [{ amount: 'abc' }, 'Escriba un monto, con hasta dos decimales.'],
        [{ amount: '0' }, 'El monto tiene que ser mayor a cero.'],
      ];
      for (const [over, message] of bad) {
        await expectRejected(
          ctx.service.createRecord(input(over) as any, actor),
          PreconditionFailedException,
          message,
          AccountingErrorReason.SIMPLE_ACCOUNTING_INVALID,
        );
      }
      expect(ctx.repo.createRecord).not.toHaveBeenCalled();
    });

    it('no acepta como tipo una cuenta de otra práctica', async () => {
      const { ctx, input } = await ready();
      await seeded(ctx, OTHER_PRACTICE);
      const foreign = ctx.repo.accounts.find(
        (a) => a.practiceId === OTHER_PRACTICE && a.code === '5.1',
      )!;
      await expectRejected(
        ctx.service.createRecord(
          input({ accountId: foreign.id }) as any,
          actor,
        ),
        PreconditionFailedException,
        'Elija el tipo.',
      );
    });

    it('lista filtrando por kind y sólo los de la práctica', async () => {
      const { ctx, byCode, input } = await ready();
      await ctx.service.createRecord(input() as any, actor);
      await ctx.service.createRecord(
        input({ kind: 'ASSET', accountId: byCode('1.4').id }) as any,
        actor,
      );
      expect(
        (await ctx.service.listRecords(PRACTICE, undefined, actor)).items,
      ).toHaveLength(2);
      const onlyAssets = await ctx.service.listRecords(
        PRACTICE,
        'ASSET',
        actor,
      );
      expect(onlyAssets.items.map((r) => r.kind)).toEqual(['ASSET']);
      expect(
        (await ctx.service.listRecords(OTHER_PRACTICE, undefined, actor)).items,
      ).toEqual([]);
      expect(Object.keys(onlyAssets.items[0]).sort()).toEqual(
        ['accountId', 'amount', 'date', 'description', 'id', 'kind'].sort(),
      );
    });

    it('edita con el kind de siempre, aunque el cuerpo traiga otro', async () => {
      const { ctx, byCode, input } = await ready();
      const created = await ctx.service.createRecord(input() as any, actor);
      const updated = await ctx.service.updateRecord(
        created.id,
        {
          kind: 'ASSET',
          date: '2026-09-10',
          accountId: byCode('5.3').id,
          description: '  Insumos ',
          amount: '640.5',
        },
        actor,
      );
      expect(updated).toMatchObject({
        kind: 'EXPENSE',
        date: '2026-09-10',
        accountId: byCode('5.3').id,
        description: 'Insumos',
        amount: '640.50',
      });
      await expectRejected(
        ctx.service.updateRecord(
          created.id,
          {
            date: '2026-09-10',
            accountId: byCode('1.1').id,
            description: 'x',
            amount: '1',
          },
          actor,
        ),
        PreconditionFailedException,
        'Ese tipo no corresponde.',
      );
    });

    it('404 al editar o borrar uno que no existe; borra uno que sí', async () => {
      const { ctx, input } = await ready();
      await expectRejected(
        ctx.service.updateRecord(uuid(), {}, actor),
        ResourceNotFoundException,
        'Registro no encontrado',
        AccountingErrorReason.SIMPLE_RECORD_NOT_FOUND,
      );
      await expectRejected(
        ctx.service.deleteRecord(uuid(), actor),
        ResourceNotFoundException,
      );
      const created = await ctx.service.createRecord(input() as any, actor);
      await ctx.service.deleteRecord(created.id, actor);
      expect(ctx.repo.records).toHaveLength(0);
    });
  });

  describe('transacciones debe/haber', () => {
    async function ready() {
      const ctx = build();
      const byCode = await seeded(ctx);
      const input = (over: Record<string, unknown> = {}) => ({
        practiceId: PRACTICE,
        date: '2026-09-02',
        description: 'Depósito de la caja al banco',
        debitAccountId: byCode('1.2').id,
        creditAccountId: byCode('1.1').id,
        amount: '2500',
        ...over,
      });
      return { ctx, byCode, input };
    }

    it('crea, lista y no expone la práctica', async () => {
      const { ctx, input } = await ready();
      const created = await ctx.service.createTransaction(
        input() as any,
        actor,
      );
      expect(created).toEqual({
        id: expect.any(String),
        date: '2026-09-02',
        description: 'Depósito de la caja al banco',
        debitAccountId: expect.any(String),
        creditAccountId: expect.any(String),
        amount: '2500.00',
      });
      const { items } = await ctx.service.listTransactions(PRACTICE, actor);
      expect(items).toEqual([created]);
      expect(
        (await ctx.service.listTransactions(OTHER_PRACTICE, actor)).items,
      ).toEqual([]);
    });

    it('rechaza con el motivo en castellano', async () => {
      const { ctx, byCode, input } = await ready();
      const bad: [Record<string, unknown>, string][] = [
        [
          { description: '' },
          'Escriba una descripción de hasta 160 caracteres.',
        ],
        [{ debitAccountId: undefined }, 'Elija la cuenta del debe.'],
        [{ debitAccountId: uuid() }, 'Elija la cuenta del debe.'],
        [{ creditAccountId: undefined }, 'Elija la cuenta del haber.'],
        [{ creditAccountId: 'x' }, 'Elija la cuenta del haber.'],
        [
          { creditAccountId: byCode('1.2').id },
          'El debe y el haber tienen que ser cuentas distintas.',
        ],
        [{ date: undefined }, 'Elija la fecha.'],
        [{ amount: '-1' }, 'Escriba un monto, con hasta dos decimales.'],
        [{ amount: '0.00' }, 'El monto tiene que ser mayor a cero.'],
      ];
      for (const [over, message] of bad) {
        await expectRejected(
          ctx.service.createTransaction(input(over) as any, actor),
          PreconditionFailedException,
          message,
          AccountingErrorReason.SIMPLE_ACCOUNTING_INVALID,
        );
      }
      expect(ctx.repo.createTransaction).not.toHaveBeenCalled();
    });

    it('no acepta cuentas de otra práctica', async () => {
      const { ctx, input } = await ready();
      await seeded(ctx, OTHER_PRACTICE);
      const foreign = ctx.repo.accounts.find(
        (a) => a.practiceId === OTHER_PRACTICE && a.code === '1.2',
      )!;
      await expectRejected(
        ctx.service.createTransaction(
          input({ debitAccountId: foreign.id }) as any,
          actor,
        ),
        PreconditionFailedException,
        'Elija la cuenta del debe.',
      );
    });

    it('edita, 404 si no existe, y borra', async () => {
      const { ctx, byCode, input } = await ready();
      const created = await ctx.service.createTransaction(
        input() as any,
        actor,
      );
      const updated = await ctx.service.updateTransaction(
        created.id,
        {
          date: '2026-09-09',
          description: ' Cuota ',
          debitAccountId: byCode('2.1').id,
          creditAccountId: byCode('1.2').id,
          amount: '950.5',
        },
        actor,
      );
      expect(updated).toMatchObject({
        date: '2026-09-09',
        description: 'Cuota',
        amount: '950.50',
      });
      await expectRejected(
        ctx.service.updateTransaction(uuid(), {}, actor),
        ResourceNotFoundException,
        'Transacción no encontrada',
        AccountingErrorReason.SIMPLE_TRANSACTION_NOT_FOUND,
      );
      await ctx.service.deleteTransaction(created.id, actor);
      expect(ctx.repo.transactions).toHaveLength(0);
      await expectRejected(
        ctx.service.deleteTransaction(created.id, actor),
        ResourceNotFoundException,
      );
    });
  });

  describe('summary', () => {
    const NOW = new Date('2026-06-15T16:00:00Z');
    beforeEach(() => {
      jest.useFakeTimers({
        now: NOW,
        doNotFake: [
          'nextTick',
          'queueMicrotask',
          'setImmediate',
          'clearImmediate',
          'setTimeout',
          'clearTimeout',
          'setInterval',
          'clearInterval',
          'performance',
          'hrtime',
        ],
      });
    });
    afterEach(() => jest.useRealTimers());

    const appt = (
      id: string,
      patient: string,
      status: string,
      startAt: string,
    ) => ({
      id,
      patientProfileId: patient,
      statusConceptId: status,
      startAt: new Date(startAt),
    });

    function scenario() {
      const ctx = build();
      ctx.finds.set(Appointments, [
        appt('a1', 'pat-A', CLIN.APPOINTMENT_FULFILLED, '2026-06-02T14:00:00Z'),
        appt('a2', 'pat-A', CLIN.APPOINTMENT_FULFILLED, '2026-06-09T14:00:00Z'),
        appt('a3', 'pat-B', CLIN.APPOINTMENT_FULFILLED, '2026-06-10T14:00:00Z'),
        // reservada, no atendida
        appt('a4', 'pat-C', CLIN.APPOINTMENT_BOOKED, '2026-06-11T14:00:00Z'),
        // atendida pero en mayo
        appt('a5', 'pat-D', CLIN.APPOINTMENT_FULFILLED, '2026-05-30T14:00:00Z'),
      ]);
      ctx.finds.set(Encounters, [{ id: 'e1' }, { id: 'e2' }]);
      ctx.finds.set(Invoices, [
        { paidTotal: '180.00' },
        { paidTotal: '250.50' },
        { paidTotal: undefined },
      ]);
      ctx.finds.set(InsuranceClaims, [
        // enviada sin dictamen: por lo facturado
        {
          id: 'c1',
          statusConceptId: INS.CLAIM_SUBMITTED,
          totalAmount: '1000.00',
        },
        // aprobada parcialmente: por lo aprobado
        {
          id: 'c2',
          statusConceptId: INS.CLAIM_ADJUDICATED,
          totalAmount: '900.00',
        },
        // rechazada: no se espera
        {
          id: 'c3',
          statusConceptId: INS.CLAIM_ADJUDICATED,
          totalAmount: '700.00',
        },
        // dictamen corregido: v1 rechazaba, v2 aprueba
        {
          id: 'c4',
          statusConceptId: INS.CLAIM_ADJUDICATED,
          totalAmount: '300.00',
        },
      ]);
      ctx.finds.set(ClaimAdjudicationVersions, [
        {
          id: 'v2',
          insuranceClaimId: 'c2',
          outcomeConceptId: INS.ADJ_OUTCOME_PARTIAL,
          totalApprovedAmount: '400.25',
        },
        {
          id: 'v3',
          insuranceClaimId: 'c3',
          outcomeConceptId: INS.ADJ_OUTCOME_DENIED,
          totalApprovedAmount: '0.00',
        },
        {
          id: 'v4a',
          insuranceClaimId: 'c4',
          outcomeConceptId: INS.ADJ_OUTCOME_DENIED,
          totalApprovedAmount: '0.00',
        },
        {
          id: 'v4b',
          insuranceClaimId: 'c4',
          outcomeConceptId: INS.ADJ_OUTCOME_APPROVED,
          totalApprovedAmount: '300.00',
          supersedesVersionId: 'v4a',
        },
      ]);
      return ctx;
    }

    it('cuenta personas distintas y consultas atendidas del mes, y suma lo cobrado', async () => {
      const ctx = scenario();
      const summary = await ctx.service.summary(PRACTICE, 'month', actor);
      expect(summary).toMatchObject({
        period: 'month',
        from: '2026-06-01',
        to: '2026-06-30',
        patientsSeen: 2,
        consultations: 3,
        collected: '430.50',
      });
    });

    it('el año incluye las atendidas de mayo', async () => {
      const ctx = scenario();
      const summary = await ctx.service.summary(PRACTICE, 'year', actor);
      expect(summary).toMatchObject({
        period: 'year',
        from: '2026-01-01',
        to: '2026-12-31',
        patientsSeen: 3,
        consultations: 4,
      });
    });

    it('lo esperado de aseguradoras es un saldo a hoy: enviadas por lo facturado, aprobadas por lo aprobado', async () => {
      const ctx = scenario();
      const month = await ctx.service.summary(PRACTICE, 'month', actor);
      const year = await ctx.service.summary(PRACTICE, 'year', actor);
      // 1000.00 (c1) + 400.25 (c2 parcial) + 300.00 (c4, versión vigente)
      expect(month.expectedFromInsurers).toBe('1700.25');
      expect(month.pendingClaims).toBe(3);
      expect(year.expectedFromInsurers).toBe(month.expectedFromInsurers);
      expect(year.pendingClaims).toBe(month.pendingClaims);
    });

    it('sin período usa el mes', async () => {
      const ctx = scenario();
      const summary = await ctx.service.summary(PRACTICE, undefined, actor);
      expect(summary.period).toBe('month');
    });

    it('las consultas se acotan al profesional y a la práctica', async () => {
      const ctx = scenario();
      await ctx.service.summary(PRACTICE, 'month', actor);
      const whereOf = (entity: unknown) =>
        ctx.em.find.mock.calls.find((c: any[]) => c[0] === entity)[1];
      expect(whereOf(Appointments)).toEqual({
        practitionerProfileId: 'prof-1',
        tenantId: 'tenant-1',
      });
      expect(whereOf(Invoices)).toMatchObject({
        practiceId: PRACTICE,
        statusConceptId: BILL.INVOICE_PAID,
      });
      expect(whereOf(InsuranceClaims)).toMatchObject({
        billingProviderTypeConceptId: INS.BILLING_PROVIDER_TYPE_PRACTICE,
        billingProviderEntityId: PRACTICE,
      });
      expect(whereOf(Encounters).$or[0]).toEqual({
        primaryPractitionerId: 'prof-1',
      });
    });

    it('sin consultas devuelve ceros con dos decimales y no consulta facturas ni solicitudes', async () => {
      const ctx = build();
      const summary = await ctx.service.summary(PRACTICE, 'month', actor);
      expect(summary).toEqual({
        period: 'month',
        from: '2026-06-01',
        to: '2026-06-30',
        patientsSeen: 0,
        consultations: 0,
        collected: '0.00',
        expectedFromInsurers: '0.00',
        pendingClaims: 0,
      });
      const entities = ctx.em.find.mock.calls.map((c: any[]) => c[0]);
      expect(entities).not.toContain(Invoices);
      expect(entities).not.toContain(InsuranceClaims);
    });
  });
});
