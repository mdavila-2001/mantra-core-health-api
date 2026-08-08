import { jest } from '@jest/globals';
import { isModuleRouted } from './session.provider';
import { DirectPersistenceSession } from './direct.session';
import { RoutedPersistenceSession } from './routed.session';
import { PostgresTransactionContext } from '../adapters/postgres/postgres-transaction.manager';

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('isModuleRouted', () => {
  it('sin la variable, ningún módulo está migrado', () => {
    // Valor seguro por defecto (§48): activar la migración es una decisión
    // explícita, nunca el resultado de olvidar una variable.
    expect(isModuleRouted('scheduling', {})).toBe(false);
  });

  it('reconoce un módulo de la lista', () => {
    expect(
      isModuleRouted('scheduling', { PERSISTENCE_PORTS_MODULES: 'scheduling' }),
    ).toBe(true);
  });

  it('tolera espacios y entradas vacías', () => {
    expect(
      isModuleRouted('billing', {
        PERSISTENCE_PORTS_MODULES: ' scheduling , billing ,, ',
      }),
    ).toBe(true);
  });

  it('no migra un módulo ausente de la lista', () => {
    expect(
      isModuleRouted('billing', { PERSISTENCE_PORTS_MODULES: 'scheduling' }),
    ).toBe(false);
  });

  it('no hace coincidencia parcial', () => {
    // `scheduling` no debe activarse porque alguien migrara `scheduling_v2`.
    expect(
      isModuleRouted('scheduling', {
        PERSISTENCE_PORTS_MODULES: 'scheduling_v2',
      }),
    ).toBe(false);
  });
});

describe('DirectPersistenceSession', () => {
  it('entrega el EntityManager inyectado sin enrutar', async () => {
    const em = { marca: 'em-directo' } as never;
    const session = new DirectPersistenceSession(em);

    await expect(session.read('op', async (given) => given)).resolves.toBe(em);
    await expect(session.write('op', async (given) => given)).resolves.toBe(em);
  });

  it('abre la transacción con em.transactional, como siempre', async () => {
    const tx = { marca: 'tx' };
    const em = { transactional: mockFn((cb: any) => cb(tx)) } as never;
    const session = new DirectPersistenceSession(em);

    const seen = await session.transaction('op', async (given, context) => ({
      given,
      context,
    }));

    expect(seen.given).toBe(tx);
    expect(seen.context).toBeInstanceOf(PostgresTransactionContext);
  });
});

describe('RoutedPersistenceSession', () => {
  it('delega las lecturas en la fábrica con el nombre del módulo', async () => {
    const sessions = {
      read: mockFn().mockResolvedValue('leido'),
      write: mockFn(),
    };
    const transactions = { execute: mockFn() };
    const session = new RoutedPersistenceSession(
      'scheduling',
      sessions as never,
      transactions as never,
    );

    const work = async () => 'x';
    await session.read('waitlist.find', work, { consistency: 'eventual' });

    expect(sessions.read).toHaveBeenCalledWith(
      'scheduling',
      'waitlist.find',
      work,
      { consistency: 'eventual' },
    );
  });

  it('abre las transacciones por el gestor y etiqueta la operación con el módulo', async () => {
    const transactions = {
      execute: mockFn((work: any) =>
        work(new PostgresTransactionContext({ marca: 'tx' } as never)),
      ),
    };
    const session = new RoutedPersistenceSession(
      'scheduling',
      { read: mockFn(), write: mockFn() } as never,
      transactions as never,
    );

    const seen = await session.transaction('enroll', async (em) => em);

    expect(seen).toEqual({ marca: 'tx' });
    expect(transactions.execute).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ operation: 'scheduling.enroll' }),
    );
  });
});
