import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import { AccountLockouts } from '../../entities';
import { AccountLockoutsRepository } from './account-lockouts.repository';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * `em` que lleva el contexto de sistema como la transacción: cada escritura
 * (`create`, o el cambio de una fila existente) queda anotada con el contexto
 * vigente cuando se VUELCA, que es cuando la política RLS la juzga.
 */
function build(existing: Record<string, unknown> | null = null) {
  const ctx = { system: 'false' };
  const flushed: { what: string; system: string }[] = [];
  let pending: string[] = [];
  const em: any = {
    isInTransaction: () => true,
    execute: mockFn((sql: string, params?: unknown[]) => {
      if (sql.includes('current_setting')) {
        return Promise.resolve([{ sc: ctx.system, tid: 'T-1' }]);
      }
      if (sql.includes("'app.system_context', 'true'")) ctx.system = 'true';
      else if (sql.includes("'app.system_context', ?"))
        ctx.system = String(params![0]);
      return Promise.resolve([]);
    }),
    create: mockFn((_entity: unknown, data: Record<string, unknown>) => {
      pending.push('insert');
      return data;
    }),
    findOne: mockFn().mockResolvedValue(existing),
    flush: mockFn(async () => {
      for (const what of pending) flushed.push({ what, system: ctx.system });
      pending = [];
    }),
  };
  return { em, ctx, flushed, markDirty: () => pending.push('update') };
}

describe('AccountLockoutsRepository: escritura sin organización bajo RLS', () => {
  const original = process.env.RLS_ENFORCE;
  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    if (original === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = original;
  });

  it('tras los fallos de login el INSERT del bloqueo corre con el contexto de sistema abierto y se cierra después', async () => {
    const d = build(null);
    await new AccountLockoutsRepository().lockForFailedAttempts(d.em, {
      userId: 'u1',
      reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
      failedAttempts: 5,
      sourceIp: '10.0.0.1',
    });
    expect(d.em.create).toHaveBeenCalledWith(
      AccountLockouts,
      expect.objectContaining({
        userId: 'u1',
        statusConceptId: CONCEPTS.LOCKOUT_ACTIVE,
        failedAttempts: 5,
      }),
      { partial: true },
    );
    // La política juzga el INSERT al volcarse: ya con el contexto de sistema.
    expect(d.flushed).toEqual([{ what: 'insert', system: 'true' }]);
    expect(d.ctx.system).toBe('false');
  });

  it('busca el bloqueo ACTIVO solo de esa cuenta y, si ya hay uno, solo actualiza el conteo (no abre otro)', async () => {
    const existing: Record<string, unknown> = { failedAttempts: 5 };
    const d = build(existing);
    await new AccountLockoutsRepository().lockForFailedAttempts(d.em, {
      userId: 'u1',
      reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
      failedAttempts: 6,
    });
    expect(d.em.findOne).toHaveBeenCalledWith(AccountLockouts, {
      userId: 'u1',
      statusConceptId: CONCEPTS.LOCKOUT_ACTIVE,
    });
    expect(existing.failedAttempts).toBe(6);
    expect(existing.updatedByUserId).toBe('u1');
    expect(d.em.create).not.toHaveBeenCalled();
  });

  it('el bloqueo manual de un administrador también se escribe con el contexto acotado', async () => {
    const d = build(null);
    await new AccountLockoutsRepository().lockManually(d.em, {
      userId: 'u1',
      reasonConceptId: CONCEPTS.LOCK_REASON_MANUAL,
      actorUserId: 'admin-1',
    });
    expect(d.flushed).toEqual([{ what: 'insert', system: 'true' }]);
    expect(d.ctx.system).toBe('false');
  });

  it('no abre el contexto para lo pendiente del llamador: se vuelca antes, con su propio contexto', async () => {
    const d = build(null);
    // Algo que el llamador dejó sin volcar (p. ej. el estado LOCKED del usuario).
    d.markDirty();
    await new AccountLockoutsRepository().lockForFailedAttempts(d.em, {
      userId: 'u1',
      reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
      failedAttempts: 5,
    });
    expect(d.flushed).toEqual([
      { what: 'update', system: 'false' },
      { what: 'insert', system: 'true' },
    ]);
  });

  it('si el INSERT falla el contexto de sistema igualmente se devuelve', async () => {
    const d = build(null);
    d.em.flush = mockFn()
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('violates row-level security'));
    await expect(
      new AccountLockoutsRepository().lockForFailedAttempts(d.em, {
        userId: 'u1',
        reasonConceptId: CONCEPTS.LOCK_REASON_FAILED_ATTEMPTS,
        failedAttempts: 5,
      }),
    ).rejects.toThrow('row-level security');
    expect(d.ctx.system).toBe('false');
  });
});
