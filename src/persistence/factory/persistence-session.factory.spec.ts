import { jest } from '@jest/globals';
import { PersistenceSessionFactory } from './persistence-session.factory';
import { PersistenceMetrics } from '../observability/persistence.metrics';
import { PostgresDataConnection } from '../adapters/postgres/postgres.connection';
import { PostgresTransactionContext } from '../adapters/postgres/postgres-transaction.manager';
import {
  ConnectionUnavailableError,
  DuplicateEntityError,
} from '../errors/persistence.errors';
import type { PostgresConnectionConfig } from '../config/connection-descriptor';
import type { ReadFallbackStrategy } from '../config/data-sources.env';

/** Ejecuta la operación mock fn. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Descriptor mínimo para construir una conexión real de PostgreSQL. */
function descriptor(
  name: string,
  user: string,
  role: 'read' | 'write' = 'write',
): PostgresConnectionConfig {
  return {
    name,
    role,
    host: 'localhost',
    port: 5432,
    user,
    password: 'x',
    database: 'app',
    ssl: false,
    pool: { min: 0, max: 1 },
    provider: 'local',
  };
}

/**
 * Conexión real (no un doble) sobre un ORM falso.
 *
 * Se usa la clase de verdad porque la fábrica comprueba `instanceof
 * PostgresDataConnection` antes de pedir el `EntityManager`: un doble
 * estructural pasaría la comprobación de tipos y fallaría en ejecución, que es
 * justo el fallo que esta prueba debe poder detectar.
 */
function connection(
  name: string,
  user: string,
  role: 'read' | 'write' = 'write',
  em: unknown = { marca: name },
): PostgresDataConnection {
  return new PostgresDataConnection(
    descriptor(name, user, role),
    { em } as never,
    false,
  );
}

/** Router falso que resuelve según la tabla dada. */
function router(
  map: Record<'read' | 'write', PostgresDataConnection>,
  redirected = false,
) {
  return {
    resolve: mockFn(
      (route: { operation: 'read' | 'write'; consistency?: string }) => {
        const needsPrimary =
          route.consistency === 'strong' ||
          route.consistency === 'read-after-write';
        const connection =
          route.operation === 'write' || needsPrimary ? map.write : map.read;
        return {
          connectionName: connection.name,
          connection,
          redirected: needsPrimary && redirected,
        };
      },
    ),
  };
}

/** Construye el sistema bajo prueba. */
function build(
  fallback: ReadFallbackStrategy = 'fail-fast',
  map = {
    read: connection('postgres-read', 'reader', 'read'),
    write: connection('postgres-write', 'writer'),
  },
) {
  const metrics = new PersistenceMetrics();
  const logger = { setContext: mockFn(), warn: mockFn(), info: mockFn() };
  const factory = new PersistenceSessionFactory(
    router(map, true) as never,
    metrics,
    fallback,
    logger as never,
  );
  return { factory, metrics, logger, map };
}

describe('PersistenceSessionFactory', () => {
  describe('enrutado', () => {
    it('una lectura normal usa el EntityManager de la conexión de lectura', async () => {
      const d = build();
      const seen = await d.factory.read(
        'scheduling',
        'buscar',
        async (em) => em,
      );
      expect(seen).toEqual({ marca: 'postgres-read' });
    });

    it('una escritura usa el de la conexión de escritura', async () => {
      const d = build();
      const seen = await d.factory.write(
        'scheduling',
        'guardar',
        async (em) => em,
      );
      expect(seen).toEqual({ marca: 'postgres-write' });
    });

    it('una lectura dentro de una transacción NO se enruta', async () => {
      // Leer fuera de la transacción que está escribiendo devolvería el estado
      // anterior, y con réplica el de un servidor que aún no ha visto nada.
      const d = build();
      const txEm = { marca: 'transaccional' };
      const seen = await d.factory.read(
        'scheduling',
        'buscar',
        async (em) => em,
        { transaction: new PostgresTransactionContext(txEm as never) },
      );
      expect(seen).toBe(txEm);
    });
  });

  describe('métricas', () => {
    it('cuenta lecturas y escrituras por conexión', async () => {
      const d = build();
      await d.factory.read('scheduling', 'buscar', async () => 1);
      await d.factory.write('scheduling', 'guardar', async () => 1);

      const snapshot = d.metrics.snapshot();
      expect(snapshot['postgres-read'].reads).toBe(1);
      expect(snapshot['postgres-write'].writes).toBe(1);
    });

    it('registra el desvío de una lectura fuerte a la primaria', async () => {
      const d = build();
      await d.factory.read('scheduling', 'buscar', async () => 1, {
        consistency: 'read-after-write',
      });
      expect(d.metrics.snapshot()['postgres-write'].redirects).toBe(1);
    });

    it('cuenta el error por su tipo normalizado', async () => {
      const d = build();
      await expect(
        d.factory.write('scheduling', 'guardar', async () => {
          throw Object.assign(new Error('x'), { code: '23505' });
        }),
      ).rejects.toBeInstanceOf(DuplicateEntityError);

      const counters = d.metrics.snapshot()['postgres-write'];
      expect(counters.errors).toBe(1);
      expect(counters.errorsByType.DuplicateEntityError).toBe(1);
    });
  });

  describe('normalización de errores', () => {
    it('traduce el error del driver antes de propagarlo', async () => {
      const d = build();
      await expect(
        d.factory.read('scheduling', 'buscar', async () => {
          throw Object.assign(new Error('x'), { code: '23505' });
        }),
      ).rejects.toBeInstanceOf(DuplicateEntityError);
    });
  });

  describe('fallback de lectura (§33)', () => {
    it('con fail-fast, un fallo de conexión se propaga', async () => {
      const d = build('fail-fast');
      await expect(
        d.factory.read('scheduling', 'buscar', async () => {
          throw Object.assign(new Error('x'), { code: '08006' });
        }),
      ).rejects.toBeInstanceOf(ConnectionUnavailableError);
    });

    it('con fallback-to-primary, reintenta en la primaria y lo registra', async () => {
      const d = build('fallback-to-primary');
      let intento = 0;
      const resultado = await d.factory.read(
        'scheduling',
        'buscar',
        async (em) => {
          intento += 1;
          if (intento === 1)
            throw Object.assign(new Error('x'), { code: '08006' });
          return em;
        },
      );

      expect(resultado).toEqual({ marca: 'postgres-write' });
      expect(d.metrics.snapshot()['postgres-write'].fallbacks).toBe(1);
      // Nunca en silencio: el desvío deja motivo, conexiones y duración.
      expect(d.logger.warn).toHaveBeenCalledWith(
        expect.objectContaining({
          motivo: 'ConnectionUnavailableError',
          conexionOriginal: 'postgres-read',
          conexionFallback: 'postgres-write',
        }),
        expect.any(String),
      );
    });

    it('NO se desvía ante un error que fallaría igual en la primaria', async () => {
      // Reintentar un 23505 contra el primario solo duplica carga y ruido.
      const d = build('fallback-to-primary');
      await expect(
        d.factory.read('scheduling', 'buscar', async () => {
          throw Object.assign(new Error('x'), { code: '23505' });
        }),
      ).rejects.toBeInstanceOf(DuplicateEntityError);
      expect(d.logger.warn).not.toHaveBeenCalled();
    });

    it('NO se desvía si lectura y escritura son el mismo pool', async () => {
      // Sin réplica no hay a dónde ir: reintentar allí duplicaría el fallo y el
      // tiempo de respuesta sin ninguna posibilidad de éxito.
      const compartida = connection('primary', 'mismo', 'write');
      const d = build('fallback-to-primary', {
        read: compartida,
        write: compartida,
      });

      await expect(
        d.factory.read('scheduling', 'buscar', async () => {
          throw Object.assign(new Error('x'), { code: '08006' });
        }),
      ).rejects.toBeInstanceOf(ConnectionUnavailableError);
      expect(d.logger.warn).not.toHaveBeenCalled();
    });
  });
});
