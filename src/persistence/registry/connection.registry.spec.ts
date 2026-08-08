import { jest } from '@jest/globals';
import { ConnectionRegistry } from './connection.registry';
import { POSTGRES_CAPABILITIES } from '../capabilities/adapter-capabilities';
import { DataSourceConfigurationError } from '../errors/persistence.errors';
import type { ConnectionRole } from '../config/connection-descriptor';
import type { DataConnection } from './data-connection.contract';

/** Conexión falsa con cierre observable. */
function connection(
  name: string,
  role: ConnectionRole = 'write',
  fingerprint = `postgresql://${name}`,
  health: 'up' | 'down' | 'throws' = 'up',
): DataConnection & { closes: number } {
  const fake = {
    name,
    engine: 'postgresql',
    provider: 'local',
    role,
    capabilities: POSTGRES_CAPABILITIES,
    fingerprint,
    closes: 0,
    async healthCheck() {
      if (health === 'throws') throw new Error('boom');
      return {
        status: health,
        role,
        engine: 'postgresql',
        latencyMs: 1,
      } as const;
    },
    async close() {
      fake.closes += 1;
    },
  };
  return fake as DataConnection & { closes: number };
}

describe('ConnectionRegistry', () => {
  describe('registro', () => {
    it('resuelve por nombre', () => {
      const registry = new ConnectionRegistry();
      const write = connection('postgres-write');
      registry.register(write);
      expect(registry.get('postgres-write')).toBe(write);
      expect(registry.has('postgres-write')).toBe(true);
    });

    it('publica una misma instancia bajo varios nombres', () => {
      // Es el caso por defecto del proyecto: un pool sirviendo a las dos rutas.
      const registry = new ConnectionRegistry();
      const shared = connection('postgres-write', 'read-write');
      registry.register(shared, ['postgres-read']);

      expect(registry.get('postgres-read')).toBe(shared);
      expect(registry.names()).toHaveLength(2);
      expect(registry.distinctConnections()).toHaveLength(1);
    });

    it('registrar dos veces el mismo destino es idempotente', () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('postgres-write'));
      expect(() =>
        registry.register(connection('postgres-write')),
      ).not.toThrow();
      expect(registry.distinctConnections()).toHaveLength(1);
    });

    it('rechaza un nombre ya usado por otro destino', () => {
      const registry = new ConnectionRegistry();
      registry.register(
        connection('postgres-write', 'write', 'postgresql://a'),
      );
      expect(() =>
        registry.register(
          connection('postgres-write', 'write', 'postgresql://b'),
        ),
      ).toThrow(DataSourceConfigurationError);
    });

    it('el error de un nombre desconocido enumera los registrados', () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('postgres-write'));
      expect(() => registry.get('postgres-read')).toThrow(/postgres-write/);
    });
  });

  describe('resolución por papel', () => {
    it('read-write cuenta como lectura y como escritura', () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('primary', 'read-write'), ['secundario']);

      expect(registry.byRole('read')).toHaveLength(1);
      expect(registry.byRole('write')).toHaveLength(1);
    });

    it('no cuenta dos veces la instancia publicada bajo dos nombres', () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('primary', 'read-write'), ['alias']);
      expect(registry.byRole('write')).toHaveLength(1);
    });
  });

  describe('health check', () => {
    it('informa de cada nombre publicado', async () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('postgres-write', 'read-write'), [
        'postgres-read',
      ]);

      const report = await registry.healthCheckAll();

      expect(Object.keys(report).sort()).toEqual([
        'postgres-read',
        'postgres-write',
      ]);
    });

    it('una conexión caída no impide conocer el estado de las demás', async () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('sana', 'write', 'postgresql://a', 'up'));
      registry.register(connection('caida', 'read', 'postgresql://b', 'down'));

      const report = await registry.healthCheckAll();

      expect(report.sana.status).toBe('up');
      expect(report.caida.status).toBe('down');
    });

    it('traduce a «down» un health check que lanza en vez de tumbar el informe', async () => {
      const registry = new ConnectionRegistry();
      registry.register(
        connection('rota', 'write', 'postgresql://a', 'throws'),
      );

      const report = await registry.healthCheckAll();

      expect(report.rota.status).toBe('down');
      expect(report.rota.reason).toMatch(/inesperada/);
    });
  });

  describe('cierre', () => {
    it('cierra una sola vez la instancia publicada bajo dos nombres', async () => {
      // Cerrar dos veces el mismo pool provoca un error del driver durante el
      // apagado, que es el peor momento para tener ruido.
      const registry = new ConnectionRegistry();
      const shared = connection('postgres-write', 'read-write');
      registry.register(shared, ['postgres-read']);

      await registry.closeAll();

      expect(shared.closes).toBe(1);
      expect(registry.names()).toHaveLength(0);
    });

    it('cierra todas aunque una falle', async () => {
      const registry = new ConnectionRegistry();
      const buena = connection('buena', 'write', 'postgresql://a');
      const mala = connection('mala', 'read', 'postgresql://b');
      mala.close = jest.fn(async () => {
        throw new Error('no cierra');
      }) as never;
      registry.register(buena);
      registry.register(mala);

      await expect(registry.closeAll()).resolves.toBeUndefined();
      expect(buena.closes).toBe(1);
    });

    it('close(nombre) retira todos los alias de esa instancia', async () => {
      const registry = new ConnectionRegistry();
      registry.register(connection('postgres-write', 'read-write'), [
        'postgres-read',
      ]);

      await registry.close('postgres-read');

      expect(registry.has('postgres-read')).toBe(false);
      expect(registry.has('postgres-write')).toBe(false);
    });
  });
});
