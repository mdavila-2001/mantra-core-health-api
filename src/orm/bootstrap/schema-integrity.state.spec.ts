import { jest } from '@jest/globals';
import { SchemaBootstrapService } from './schema-bootstrap.service';
import { SchemaIntegrityState } from './schema-integrity.state';
import { ddlLayers as registeredLayers } from './layers';
import type { DdlLayer } from './ddl-layer.contract';

// El arreglo es `readonly` para el código de producción; la prueba lo sustituye.
const ddlLayers = registeredLayers as DdlLayer[];

describe('SchemaIntegrityState (ORMN-01)', () => {
  it('sin reporte cuenta como íntegro (proceso con ORM_SCHEMA_SYNC=off)', () => {
    const state = new SchemaIntegrityState();
    expect(state.current()).toBeNull();
    expect(state.isComplete()).toBe(true);
  });

  it('con incidencias bloqueantes no está completo; sólo degradadas, sí', () => {
    const state = new SchemaIntegrityState();
    state.record(0, 3);
    expect(state.isComplete()).toBe(true);
    state.record(2, 0);
    expect(state.isComplete()).toBe(false);
    expect(state.current()).toMatchObject({ blockingCount: 2 });
  });
});

describe('SchemaBootstrapService registra la integridad (ORMN-01)', () => {
  const build = () => {
    const state = new SchemaIntegrityState();
    // Conexión mínima para el cerrojo de arranque: lo toma a la primera.
    const connection = {
      begin: async () => ({}),
      execute: async () => [{ locked: true }],
      commit: async () => undefined,
    };
    const orm = {
      em: { getConnection: () => connection },
    };
    const service = new SchemaBootstrapService(
      orm as never,
      { verifyAndReport: jest.fn() } as never,
      state,
    );
    return { service, state };
  };

  // Se sustituyen las capas por una sola que devuelve el resultado deseado.
  const withLayers = async (
    outcome: { failures: string[]; blocking?: string[] },
    mode: 'safe' | 'dry-run' = 'safe',
  ) => {
    const { service, state } = build();
    const original = [...ddlLayers];
    ddlLayers.splice(0, ddlLayers.length, {
      order: 1,
      name: 'fake',
      description: 'fake',
      apply: async () => ({ applied: 0, skipped: 0, ...outcome }),
    });
    try {
      await service.run(mode, false);
    } finally {
      ddlLayers.splice(0, ddlLayers.length, ...original);
    }
    return state;
  };

  it('una FK fallida deja el estado incompleto', async () => {
    const state = await withLayers({
      failures: ['lote de FKs 1-50: x'],
      blocking: ['lote de FKs 1-50: x'],
    });
    expect(state.isComplete()).toBe(false);
  });

  it('un índice de rendimiento fallido degrada pero no bloquea', async () => {
    const state = await withLayers({ failures: ['lote de índices: y'] });
    expect(state.isComplete()).toBe(true);
    expect(state.current()).toMatchObject({
      blockingCount: 0,
      degradedCount: 1,
    });
  });

  it('en dry-run no se registra nada', async () => {
    const state = await withLayers(
      { failures: ['x'], blocking: ['x'] },
      'dry-run',
    );
    expect(state.current()).toBeNull();
  });
});
