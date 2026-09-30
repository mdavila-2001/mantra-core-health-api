import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { EncounterSealGuardService } from './encounter-seal-guard.service';

const encounter = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'enc-1', sealedAt: null, ...overrides }) as any;

function build(found: unknown) {
  const encountersRepo = { findById: mockFn().mockResolvedValue(found) };
  const service = new EncounterSealGuardService(encountersRepo as any);
  return { service, encountersRepo };
}

describe('EncounterSealGuardService', () => {
  it('deja pasar un encuentro en curso (sin sealedAt)', async () => {
    const { service } = build(encounter());
    await expect(
      service.assertEncounterWritable({} as any, 'enc-1'),
    ).resolves.toBeUndefined();
  });

  it('rechaza con 422 un encuentro sellado (CL-07)', async () => {
    const { service } = build(
      encounter({ sealedAt: new Date('2026-09-20T10:00:00.000Z') }),
    );
    await expect(
      service.assertEncounterWritable({} as any, 'enc-1'),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('no lanza si el encuentro no existe (otra capa decide el 404)', async () => {
    const { service } = build(null);
    await expect(
      service.assertEncounterWritable({} as any, 'enc-x'),
    ).resolves.toBeUndefined();
  });
});
