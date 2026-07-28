import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeSettingsService } from './practice-settings.service';
import { ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = { findById: mockFn() };
  const settingsRepo = { findByPracticeAndKey: mockFn(), create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeSettingsService(
    em as any,
    practicesRepo as any,
    settingsRepo,
    logger as any,
  );
  return { service, tx, practicesRepo, settingsRepo };
}

describe('PracticeSettingsService (UC-14-07)', () => {
  it('throws when the practice is missing', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue(null);
    await expect(
      d.service.upsert('p1', 'k', { valueJson: {} } as any, actor),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('inserts when the key does not exist (created=true)', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
    d.settingsRepo.findByPracticeAndKey.mockResolvedValue(null);
    d.settingsRepo.create.mockReturnValue({ id: 'st1' });
    const res = await d.service.upsert(
      'p1',
      'k',
      { valueJson: { a: 1 } },
      actor,
    );
    expect(res).toEqual({
      id: 'st1',
      practiceId: 'p1',
      settingKey: 'k',
      created: true,
    });
  });

  it('updates when the key exists (created=false)', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue({ id: 'p1' });
    const existing = {
      id: 'st1',
      valueJson: { a: 1 },
      categoryConceptId: 'c',
      updatedAt: new Date(),
    };
    d.settingsRepo.findByPracticeAndKey.mockResolvedValue(existing);
    const res = await d.service.upsert(
      'p1',
      'k',
      { valueJson: { a: 2 } },
      actor,
    );
    expect(res.created).toBe(false);
    expect(existing.valueJson).toEqual({ a: 2 });
    expect(d.settingsRepo.create).not.toHaveBeenCalled();
  });
});
