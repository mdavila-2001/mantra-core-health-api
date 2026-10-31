import { jest } from '@jest/globals';
import {
  applyTenantContext,
  clearTenantContext,
  isRlsEnforced,
  tenantExists,
  withPersonScope,
  withSystemKey,
  withTenantContext,
} from './tenant-context';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Una transacción que anota cada `set_config` y responde el contexto vigente. */
function fakeTx(initial = { sc: 'false', tid: 'tenant-peticion' }) {
  const state = { ...initial };
  const calls: string[] = [];
  const tx: any = {
    execute: mockFn(async (sql: string, params?: unknown[]) => {
      if (sql.includes('current_setting')) {
        return [{ sc: state.sc, tid: state.tid }];
      }
      if (sql.includes("'app.system_context'")) {
        state.sc = params
          ? String(params[0])
          : sql.includes("'true'")
            ? 'true'
            : 'false';
      }
      if (sql.includes("'app.current_tenant_id'")) {
        state.tid = params ? String(params[0]) : '';
      }
      calls.push(`${state.sc}|${state.tid}`);
      return [];
    }),
  };
  return { tx, state, calls };
}

const withRls = async (value: string | undefined, run: () => Promise<void>) => {
  const before = process.env.RLS_ENFORCE;
  if (value === undefined) delete process.env.RLS_ENFORCE;
  else process.env.RLS_ENFORCE = value;
  try {
    await run();
  } finally {
    if (before === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = before;
  }
};

describe('isRlsEnforced', () => {
  it('solo con RLS_ENFORCE=true', () => {
    expect(isRlsEnforced({ RLS_ENFORCE: 'true' })).toBe(true);
    expect(isRlsEnforced({ RLS_ENFORCE: 'false' })).toBe(false);
    expect(isRlsEnforced({})).toBe(false);
  });
});

describe('contexto de organización', () => {
  it('applyTenantContext fija la organización y apaga el contexto de sistema', async () => {
    const { tx, state } = fakeTx({ sc: 'true', tid: '' });
    await applyTenantContext(tx, 'tenant-a');
    expect(state).toEqual({ sc: 'false', tid: 'tenant-a' });
  });

  it('clearTenantContext deja la transacción sin organización ni sistema (las políticas fallan cerradas)', async () => {
    const { tx, state } = fakeTx({ sc: 'true', tid: 'tenant-a' });
    await clearTenantContext(tx);
    expect(state).toEqual({ sc: 'false', tid: '' });
  });
});

describe('tenantExists', () => {
  it('pregunta por el id en directory.tenants y responde según haya fila', async () => {
    const tx: any = { execute: mockFn() };
    tx.execute.mockResolvedValueOnce([{ id: 't-1' }]);
    await expect(tenantExists(tx, 't-1')).resolves.toBe(true);
    expect(tx.execute).toHaveBeenCalledWith(
      expect.stringContaining('directory.tenants'),
      ['t-1'],
    );
    tx.execute.mockResolvedValueOnce([]);
    await expect(tenantExists(tx, 't-2')).resolves.toBe(false);
  });
});

describe('withTenantContext y withSystemKey', () => {
  it('sin RLS no tocan la base', async () => {
    await withRls(undefined, async () => {
      const { tx } = fakeTx();
      expect(await withTenantContext(tx, 'tenant-a', async () => 1)).toBe(1);
      expect(await withSystemKey(tx, async () => 2)).toBe(2);
      expect(tx.execute).not.toHaveBeenCalled();
    });
  });

  it('con RLS entran a la organización y devuelven el contexto de la petición', async () => {
    await withRls('true', async () => {
      const { tx, state } = fakeTx({ sc: 'false', tid: 'tenant-peticion' });
      const seen: string[] = [];
      await withTenantContext(tx, 'tenant-doctor', async () => {
        seen.push(`${state.sc}|${state.tid}`);
      });
      expect(seen).toEqual(['false|tenant-doctor']);
      expect(state).toEqual({ sc: 'false', tid: 'tenant-peticion' });
    });
  });

  it('con RLS el contexto de sistema dura solo lo que dura la lectura, aunque falle', async () => {
    await withRls('true', async () => {
      const { tx, state } = fakeTx({ sc: 'false', tid: 'tenant-peticion' });
      await expect(
        withSystemKey(tx, async () => {
          expect(state.sc).toBe('true');
          throw new Error('falló la lectura');
        }),
      ).rejects.toThrow('falló la lectura');
      expect(state).toEqual({ sc: 'false', tid: 'tenant-peticion' });
    });
  });
});

describe('withPersonScope', () => {
  it('sin RLS lee en un fork, sin transacción y sin tocar el contexto', async () => {
    await withRls(undefined, async () => {
      const fork = { execute: mockFn() };
      const em: any = {
        fork: mockFn().mockReturnValue(fork),
        transactional: mockFn(),
      };
      const out = await withPersonScope(em, async (tx, scope) => {
        expect(tx).toBe(fork);
        return scope.inTenant('tenant-a', async () =>
          scope.ownRows(async () => 'ok'),
        );
      });
      expect(out).toBe('ok');
      expect(em.transactional).not.toHaveBeenCalled();
      expect(fork.execute).not.toHaveBeenCalled();
    });
  });

  it('sin RLS una escritura igual abre transacción', async () => {
    await withRls(undefined, async () => {
      const tx = { execute: mockFn() };
      const em: any = {
        fork: mockFn(),
        transactional: mockFn((cb: any) => cb(tx)),
      };
      const out = await withPersonScope(em, async (got) => got === tx, {
        transactional: true,
      });
      expect(out).toBe(true);
      expect(em.fork).not.toHaveBeenCalled();
    });
  });

  it('con RLS corre en una transacción que arranca sin organización', async () => {
    await withRls('true', async () => {
      const { tx, state } = fakeTx({
        sc: 'true',
        tid: 'resto-de-otra-lectura',
      });
      const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
      await withPersonScope(em, async () => {
        expect(state).toEqual({ sc: 'false', tid: '' });
      });
      expect(em.transactional).toHaveBeenCalled();
    });
  });

  it('con RLS cada lectura ve solo su contexto: las propias filas, UNA organización a la vez, o por llave', async () => {
    await withRls('true', async () => {
      const { tx, state } = fakeTx();
      const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
      const seen: Record<string, string> = {};
      await withPersonScope(em, async (_tx, scope) => {
        await scope.ownRows(async () => {
          seen.own = `${state.sc}|${state.tid}`;
        });
        await scope.inTenant('tenant-a', async () => {
          seen.a = `${state.sc}|${state.tid}`;
        });
        await scope.inTenant('tenant-b', async () => {
          seen.b = `${state.sc}|${state.tid}`;
        });
        await scope.keyed(async () => {
          seen.key = `${state.sc}|${state.tid}`;
        });
        seen.after = `${state.sc}|${state.tid}`;
      });
      expect(seen).toEqual({
        own: 'true|',
        a: 'false|tenant-a',
        b: 'false|tenant-b',
        key: 'true|',
        // Entre una lectura y otra nada queda abierto.
        after: 'false|',
      });
    });
  });

  it('con RLS una lectura que falla no deja el contexto de sistema encendido', async () => {
    await withRls('true', async () => {
      const { tx, state } = fakeTx();
      const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
      await expect(
        withPersonScope(em, async (_tx, scope) =>
          scope.ownRows(async () => {
            throw new Error('boom');
          }),
        ),
      ).rejects.toThrow('boom');
      expect(state.sc).toBe('false');
    });
  });
});
