import { jest } from '@jest/globals';
import { withSystemRead, withSystemWrite } from './system-read-scope';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Doble de `EntityManager` que lleva la cuenta del contexto como lo haría la
 * transacción: `set_config(..., true)` fija un valor y la lectura de
 * `current_setting` lo devuelve.
 */
function build(inTransaction: boolean, initial = { sc: 'false', tid: 'T-1' }) {
  const settings: Record<string, string> = {
    'app.system_context': initial.sc,
    'app.current_tenant_id': initial.tid,
  };
  const trace: string[] = [];
  const tx: any = {
    isInTransaction: () => true,
    flush: mockFn(async () => {
      trace.push(`flush(system=${settings['app.system_context']})`);
    }),
    execute: mockFn((sql: string, params?: unknown[]) => {
      if (sql.includes('current_setting')) {
        return Promise.resolve([
          {
            sc: settings['app.system_context'],
            tid: settings['app.current_tenant_id'],
          },
        ]);
      }
      const key = /'(app\.[a-z_]+)'/.exec(sql)?.[1] as string;
      const value = params
        ? String(params[0])
        : /, '(\w+)', true/.exec(sql)![1];
      settings[key] = value;
      trace.push(`${key}=${value}`);
      return Promise.resolve([]);
    }),
  };
  const em: any = {
    isInTransaction: () => inTransaction,
    transactional: mockFn((cb: any) => cb(tx)),
    execute: tx.execute,
  };
  return { em: inTransaction ? tx : em, fork: em, tx, settings, trace };
}

describe('withSystemRead', () => {
  const original = process.env.RLS_ENFORCE;
  afterEach(() => {
    if (original === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = original;
  });

  it('sin RLS no cambia nada: lee con el mismo em, sin transacción ni SQL', async () => {
    delete process.env.RLS_ENFORCE;
    const d = build(false);
    const read = mockFn(async (db: any) => db === d.fork && 'listo');
    await expect(withSystemRead(d.fork, read)).resolves.toBe('listo');
    expect(read).toHaveBeenCalledWith(d.fork);
    expect(d.fork.transactional).not.toHaveBeenCalled();
    expect(d.tx.execute).not.toHaveBeenCalled();
  });

  it('con RLS y un em sin transacción abre una propia, abre el contexto durante la lectura y lo cierra al terminar', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = build(false);
    let during = '';
    const result = await withSystemRead(d.fork, async (db) => {
      during = d.settings['app.system_context'];
      expect(db).toBe(d.tx);
      return 42;
    });
    expect(result).toBe(42);
    expect(d.fork.transactional).toHaveBeenCalledTimes(1);
    expect(during).toBe('true');
    // Vuelve a lo que había: cerrado y con el mismo tenant.
    expect(d.settings).toEqual({
      'app.system_context': 'false',
      'app.current_tenant_id': 'T-1',
    });
  });

  it('con RLS el contexto se cierra aunque la lectura lance (finally)', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = build(false);
    await expect(
      withSystemRead(d.fork, async () => {
        expect(d.settings['app.system_context']).toBe('true');
        throw new Error('lectura fallida');
      }),
    ).rejects.toThrow('lectura fallida');
    expect(d.settings['app.system_context']).toBe('false');
  });

  it('con RLS y una transacción ya abierta la reutiliza (sin transacción nueva) y restaura el contexto previo', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = build(true, { sc: 'false', tid: 'T-9' });
    await withSystemRead(d.em, async () => {
      expect(d.settings['app.system_context']).toBe('true');
    });
    expect(d.fork.transactional).not.toHaveBeenCalled();
    expect(d.settings).toEqual({
      'app.system_context': 'false',
      'app.current_tenant_id': 'T-9',
    });
  });

  it('anidado, la lectura interna no deja el contexto cerrado para la externa', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = build(true);
    await withSystemRead(d.em, async (db) => {
      await withSystemRead(db, async () => undefined);
      expect(d.settings['app.system_context']).toBe('true');
    });
    expect(d.settings['app.system_context']).toBe('false');
  });
});

describe('withSystemWrite', () => {
  const original = process.env.RLS_ENFORCE;
  afterEach(() => {
    if (original === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = original;
  });

  it('exige una transacción: no abre una propia que se confirmaría aparte', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = build(false);
    const write = mockFn(async () => undefined);
    await expect(withSystemWrite(d.fork, write)).rejects.toThrow(
      /transacción abierta/,
    );
    expect(write).not.toHaveBeenCalled();
    expect(d.fork.transactional).not.toHaveBeenCalled();
  });

  it('sin RLS vuelca lo pendiente, escribe y vuelca, sin tocar el contexto', async () => {
    delete process.env.RLS_ENFORCE;
    const d = build(true);
    const result = await withSystemWrite(d.em, async (db) => {
      expect(db).toBe(d.tx);
      return 'ok';
    });
    expect(result).toBe('ok');
    expect(d.trace).toEqual(['flush(system=false)', 'flush(system=false)']);
  });

  it('con RLS: lo pendiente se vuelca ANTES de abrir el contexto y lo escrito ANTES de cerrarlo', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = build(true, { sc: 'false', tid: 'T-1' });
    await withSystemWrite(d.em, async () => {
      expect(d.settings['app.system_context']).toBe('true');
    });
    expect(d.trace).toEqual([
      // lo del llamador, con su contexto
      'flush(system=false)',
      'app.system_context=true',
      // la escritura acotada, con el contexto de sistema abierto
      'flush(system=true)',
      // y el contexto vuelve a lo que había
      'app.system_context=false',
      'app.current_tenant_id=T-1',
    ]);
  });

  it('con RLS el contexto se cierra aunque la escritura o su volcado lancen (finally)', async () => {
    process.env.RLS_ENFORCE = 'true';
    const failing = build(true);
    await expect(
      withSystemWrite(failing.em, async () => {
        throw new Error('escritura fallida');
      }),
    ).rejects.toThrow('escritura fallida');
    expect(failing.settings['app.system_context']).toBe('false');

    const flushFails = build(true);
    let calls = 0;
    flushFails.tx.flush = mockFn(async () => {
      calls += 1;
      if (calls === 2) throw new Error('23505');
    });
    await expect(
      withSystemWrite(flushFails.em, async () => undefined),
    ).rejects.toThrow('23505');
    expect(flushFails.settings['app.system_context']).toBe('false');
  });

  it('con RLS no deja contexto de sistema abierto para lo que el llamador escriba después', async () => {
    process.env.RLS_ENFORCE = 'true';
    const d = build(true, { sc: 'false', tid: 'T-9' });
    await withSystemWrite(d.em, async () => undefined);
    expect(d.settings).toEqual({
      'app.system_context': 'false',
      'app.current_tenant_id': 'T-9',
    });
  });
});
