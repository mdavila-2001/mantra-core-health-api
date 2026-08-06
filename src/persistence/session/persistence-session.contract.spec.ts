import { jest } from '@jest/globals';
import { DirectPersistenceSession } from './direct.session';
import { RoutedPersistenceSession } from './routed.session';
import { PersistenceSessionFactory } from '../factory/persistence-session.factory';
import {
  PostgresTransactionManager,
  PostgresTransactionContext,
} from '../adapters/postgres/postgres-transaction.manager';
import { PostgresDataConnection } from '../adapters/postgres/postgres.connection';
import { PersistenceMetrics } from '../observability/persistence.metrics';
import { ConnectionRegistry } from '../registry/connection.registry';
import { DataSourceRouter } from '../routing/data-source.router';
import { defaultRoutingRules } from '../routing/routing.config';
import type { PersistenceSession } from '../ports/session.port';

/**
 * Suite de contrato de `PersistenceSession` (§53).
 *
 * Las dos implementaciones deben comportarse igual ante el mismo uso. No es una
 * formalidad: es lo que sostiene la promesa de rollback del §47. Si sacar un
 * módulo de `PERSISTENCE_PORTS_MODULES` lo devolviera a una sesión con
 * semántica distinta, la vuelta atrás no sería una vuelta atrás sino un tercer
 * comportamiento, y el flag dejaría de ser una red de seguridad.
 *
 * Lo que el contrato NO exige es que instrumenten igual: la enrutada mide y
 * normaliza errores, y la directa no. Esa diferencia es deliberada y está
 * cubierta por las pruebas propias de cada una.
 */

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Descriptor mínimo para la conexión compartida de las pruebas. */
const DESCRIPTOR = {
  name: 'postgres-write',
  role: 'read-write' as const,
  host: 'localhost',
  port: 5432,
  user: 'app',
  password: 'x',
  database: 'app',
  ssl: false,
  pool: { min: 0, max: 1 },
  provider: 'local',
};

/** `EntityManager` falso compartido por las dos implementaciones. */
function fakeEntityManager() {
  const tx = { marca: 'transaccional' };
  return {
    marca: 'principal',
    transactional: mockFn((cb: any) => cb(tx)),
    tx,
  };
}

/** Construye la sesión enrutada sobre un registro real. */
function buildRouted(
  em: ReturnType<typeof fakeEntityManager>,
): PersistenceSession {
  const registry = new ConnectionRegistry();
  const connection = new PostgresDataConnection(
    DESCRIPTOR,
    { em } as never,
    false,
    'read-write',
  );
  registry.register(connection, ['postgres-read']);
  const router = new DataSourceRouter(
    registry,
    defaultRoutingRules('postgres-read', 'postgres-write'),
  );
  const metrics = new PersistenceMetrics();
  return new RoutedPersistenceSession(
    'scheduling',
    new PersistenceSessionFactory(router, metrics, 'fail-fast'),
    new PostgresTransactionManager(router, metrics),
  );
}

/** Cada caso construye su sesión y expone el `EntityManager` que la respalda. */
const IMPLEMENTATIONS: Array<{
  name: string;
  build: () => {
    session: PersistenceSession;
    em: ReturnType<typeof fakeEntityManager>;
  };
}> = [
  {
    name: 'DirectPersistenceSession (camino de siempre)',
    build: () => {
      const em = fakeEntityManager();
      return { session: new DirectPersistenceSession(em as never), em };
    },
  },
  {
    name: 'RoutedPersistenceSession (camino nuevo)',
    build: () => {
      const em = fakeEntityManager();
      return { session: buildRouted(em), em };
    },
  },
];

describe.each(IMPLEMENTATIONS)(
  'contrato de PersistenceSession: $name',
  ({ build }) => {
    it('read entrega un EntityManager utilizable', async () => {
      const { session } = build();
      await expect(session.read('op', async (em) => Boolean(em))).resolves.toBe(
        true,
      );
    });

    it('write entrega un EntityManager utilizable', async () => {
      const { session } = build();
      await expect(
        session.write('op', async (em) => Boolean(em)),
      ).resolves.toBe(true);
    });

    it('read devuelve el valor del trabajo tal cual', async () => {
      const { session } = build();
      await expect(
        session.read('op', async () => ({ n: 42 })),
      ).resolves.toEqual({ n: 42 });
    });

    it('transaction entrega el EntityManager transaccional, no el principal', async () => {
      const { session, em } = build();
      const seen = await session.transaction('op', async (given) => given);
      expect(seen).toBe(em.tx);
    });

    it('transaction entrega un contexto que los puertos pueden propagar', async () => {
      const { session } = build();
      const context = await session.transaction('op', async (_em, ctx) => ctx);
      expect(context).toBeInstanceOf(PostgresTransactionContext);
      expect(context.__transaction).toBe('postgres');
    });

    it('un error dentro de transaction se propaga y no se traga', async () => {
      const { session } = build();
      await expect(
        session.transaction('op', async () => {
          throw new Error('fallo de negocio');
        }),
      ).rejects.toThrow();
    });

    it('un error dentro de read se propaga', async () => {
      const { session } = build();
      await expect(
        session.read('op', async () => {
          throw new Error('fallo de lectura');
        }),
      ).rejects.toThrow();
    });
  },
);
