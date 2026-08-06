import { DataSourceRouter } from './data-source.router';
import { defaultRoutingRules, type RoutingRules } from './routing.config';
import { ConnectionRegistry } from '../registry/connection.registry';
import { POSTGRES_CAPABILITIES } from '../capabilities/adapter-capabilities';
import { DataSourceConfigurationError } from '../errors/persistence.errors';
import type { ConnectionRole } from '../config/connection-descriptor';
import type { DataConnection } from '../registry/data-connection.contract';

/** Conexión falsa: al registro solo le importa el contrato. */
function connection(
  name: string,
  role: ConnectionRole,
  fingerprint = `postgresql://${name}`,
): DataConnection {
  return {
    name,
    engine: 'postgresql',
    provider: 'local',
    role,
    capabilities: POSTGRES_CAPABILITIES,
    fingerprint,
    healthCheck: async () => ({
      status: 'up' as const,
      role,
      engine: 'postgresql',
      latencyMs: 1,
    }),
    close: async () => undefined,
  };
}

/** Registro con rutas separadas: pools distintos para lectura y escritura. */
function separated(): ConnectionRegistry {
  const registry = new ConnectionRegistry();
  registry.register(connection('postgres-write', 'write'));
  registry.register(connection('postgres-read', 'read'));
  return registry;
}

/** Registro con una sola instancia publicada bajo los dos nombres. */
function shared(): ConnectionRegistry {
  const registry = new ConnectionRegistry();
  registry.register(
    connection('postgres-write', 'read-write', 'postgresql://único'),
    ['postgres-read'],
  );
  return registry;
}

const RULES = defaultRoutingRules('postgres-read', 'postgres-write');

describe('DataSourceRouter', () => {
  describe('resolución por operación', () => {
    it('manda las escrituras a la conexión de escritura', () => {
      const router = new DataSourceRouter(separated(), RULES);
      expect(
        router.resolve({ module: 'scheduling', operation: 'write' })
          .connectionName,
      ).toBe('postgres-write');
    });

    it('manda las lecturas normales a la conexión de lectura', () => {
      const router = new DataSourceRouter(separated(), RULES);
      expect(
        router.resolve({ module: 'scheduling', operation: 'read' })
          .connectionName,
      ).toBe('postgres-read');
    });

    it.each(['strong', 'read-after-write'] as const)(
      'desvía a la primaria una lectura con consistencia %s',
      (consistency) => {
        // Sin esto, «reservo una cita y acto seguido pido mi agenda» mostraría
        // una agenda sin la cita recién creada.
        const router = new DataSourceRouter(separated(), RULES);
        const resolved = router.resolve({
          module: 'scheduling',
          operation: 'read',
          consistency,
        });
        expect(resolved.connectionName).toBe('postgres-write');
        expect(resolved.redirected).toBe(true);
      },
    );

    it('una lectura eventual no se desvía', () => {
      const router = new DataSourceRouter(separated(), RULES);
      expect(
        router.resolve({
          module: 'scheduling',
          operation: 'read',
          consistency: 'eventual',
        }).redirected,
      ).toBe(false);
    });
  });

  describe('conexión compartida', () => {
    it('no marca como desviada una lectura fuerte si es el mismo pool', () => {
      // Con una sola base, los dos nombres lógicos existen pero apuntan al
      // mismo pool: marcar cada lectura fuerte como desviada sería ruido puro.
      const router = new DataSourceRouter(shared(), RULES);
      const resolved = router.resolve({
        module: 'scheduling',
        operation: 'read',
        consistency: 'strong',
      });
      expect(resolved.redirected).toBe(false);
      expect(resolved.connection.fingerprint).toBe('postgresql://único');
    });
  });

  describe('validación en el arranque', () => {
    it('aborta si una ruta nombra una conexión que no existe', () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('postgres-write', 'write'));
      expect(() => new DataSourceRouter(registry, RULES)).toThrow(
        DataSourceConfigurationError,
      );
    });

    it('aborta si una escritura apunta a una conexión de solo lectura', () => {
      // Este enrutado no falla al configurarse: falla la primera vez que
      // alguien reserva una cita, en producción.
      const registry = new ConnectionRegistry();
      registry.register(connection('postgres-read', 'read'));
      const invalid: RoutingRules = {
        default: { read: 'postgres-read', write: 'postgres-read' },
        modules: {},
      };
      expect(() => new DataSourceRouter(registry, invalid)).toThrow(
        /solo lectura/,
      );
    });

    it('aborta si alguna ruta apunta a la conexión administrativa', () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('postgres-admin', 'admin'));
      const invalid: RoutingRules = {
        default: { read: 'postgres-admin', write: 'postgres-admin' },
        modules: {},
      };
      expect(() => new DataSourceRouter(registry, invalid)).toThrow(
        /administrativa/,
      );
    });

    it('valida también las excepciones por módulo, no solo la regla general', () => {
      const registry = separated();
      const invalid: RoutingRules = {
        default: { read: 'postgres-read', write: 'postgres-write' },
        modules: {
          scheduling: { read: 'inexistente', write: 'postgres-write' },
        },
      };
      expect(() => new DataSourceRouter(registry, invalid)).toThrow(
        /scheduling/,
      );
    });
  });

  describe('excepciones por módulo', () => {
    it('una regla propia gana a la general', () => {
      const registry = separated();
      registry.register(connection('analitica', 'read'));
      const rules: RoutingRules = {
        default: { read: 'postgres-read', write: 'postgres-write' },
        modules: { reporting: { read: 'analitica', write: 'postgres-write' } },
      };
      const router = new DataSourceRouter(registry, rules);

      expect(
        router.resolve({ module: 'reporting', operation: 'read' })
          .connectionName,
      ).toBe('analitica');
      expect(
        router.resolve({ module: 'scheduling', operation: 'read' })
          .connectionName,
      ).toBe('postgres-read');
    });
  });
});
