import { jest } from '@jest/globals';
import { runWithTenant } from '../../../common';
import {
  DEFAULT_GOVERNANCE_SETTINGS,
  GovernanceSettingsService,
  readGovernanceSettings,
  validateGovernanceSettings,
} from './governance-settings.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

describe('validateGovernanceSettings', () => {
  it('acepta un cuerpo vacío y valores dentro de rango', () => {
    expect(validateGovernanceSettings({})).toEqual([]);
    expect(
      validateGovernanceSettings({
        inactivityDays: 30,
        autoSuspendInactiveDays: null,
        reviewCadenceMonths: 12,
        onboardingRequiredSince: null,
        onboardingRequired: false,
      }),
    ).toEqual([]);
  });

  it('señala cada campo fuera de rango, mal tipado o desconocido', () => {
    const issues = validateGovernanceSettings({
      inactivityDays: 3,
      unusedDays: 1.5,
      reviewCadenceMonths: 9,
      maxSodExceptionDays: 181,
      fourEyesActionTtlMinutes: 'x',
      onboardingRequired: 'si',
      inventado: 1,
    });
    expect(issues.map((i) => i.field).sort()).toEqual(
      [
        'fourEyesActionTtlMinutes',
        'inactivityDays',
        'inventado',
        'maxSodExceptionDays',
        'onboardingRequired',
        'reviewCadenceMonths',
        'unusedDays',
      ].sort(),
    );
  });

  it('autoSuspendInactiveDays acepta null o 14-730, nada más', () => {
    expect(
      validateGovernanceSettings({ autoSuspendInactiveDays: 13 }),
    ).toHaveLength(1);
    expect(
      validateGovernanceSettings({ autoSuspendInactiveDays: 14 }),
    ).toHaveLength(0);
    expect(
      validateGovernanceSettings({ autoSuspendInactiveDays: 731 }),
    ).toHaveLength(1);
  });

  it('rechaza lo que no es un objeto', () => {
    expect(validateGovernanceSettings(null)).toHaveLength(1);
    expect(validateGovernanceSettings([1])).toHaveLength(1);
  });
});

describe('readGovernanceSettings', () => {
  it('sin fila devuelve los de siempre (la recomendación del contrato)', () => {
    expect(readGovernanceSettings(undefined)).toEqual(
      DEFAULT_GOVERNANCE_SETTINGS,
    );
    expect(DEFAULT_GOVERNANCE_SETTINGS).toMatchObject({
      onboardingRequired: true,
      inactivityDays: 45,
      unusedDays: 60,
      autoSuspendInactiveDays: null,
      reviewCadenceMonths: 6,
      maxSodExceptionDays: 90,
      creepThreshold: 15,
      fourEyesActionTtlMinutes: 60,
      suspensionReviewAfterDays: 60,
    });
  });

  it('lo ilegible deja el valor de siempre y lo válido manda (nunca abre un control)', () => {
    const out = readGovernanceSettings({
      inactivityDays: 'mucho',
      unusedDays: 90,
      reviewCadenceMonths: 12,
      maxSodExceptionDays: 9999,
      extra: true,
    });
    expect(out.inactivityDays).toBe(45);
    expect(out.unusedDays).toBe(90);
    expect(out.reviewCadenceMonths).toBe(12);
    expect(out.maxSodExceptionDays).toBe(90);
    expect(out).not.toHaveProperty('extra');
  });
});

function build(opts: { row?: any; practice?: any } = {}) {
  const created: any[] = [];
  const tx: any = {
    find: mockFn(async (entity: any) => {
      const name = entity?.name;
      if (name === 'Practices')
        return opts.practice === null
          ? []
          : [opts.practice ?? { id: 'prac-1' }];
      if (name === 'PracticeSettings') return opts.row ? [opts.row] : [];
      return [];
    }),
    create: mockFn((_e: any, data: any) => {
      created.push(data);
      return data;
    }),
    flush: mockFn().mockResolvedValue(undefined),
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn((cb: any) => cb(tx)),
  };
  const stepUp = { assertFresh: mockFn().mockResolvedValue(undefined) };
  const scope = { resolveTenant: () => TENANT };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new GovernanceSettingsService(
    em,
    scope as any,
    stepUp as any,
    logger as any,
  );
  return { service, created, stepUp, tx };
}

describe('GovernanceSettingsService', () => {
  it('get: sin fila devuelve los de siempre y isDefault', async () => {
    const d = build();
    const out = await runWithTenant(TENANT, () => d.service.get());
    expect(out.isDefault).toBe(true);
    expect(out.settings).toEqual(DEFAULT_GOVERNANCE_SETTINGS);
  });

  it('put: exige el paso extra, valida y crea la fila en la primera práctica', async () => {
    const d = build();
    const out = await runWithTenant(TENANT, () =>
      d.service.put({ inactivityDays: 30 } as any, ADMIN),
    );
    expect(d.stepUp.assertFresh).toHaveBeenCalledWith(d.tx, ADMIN);
    expect(d.created).toHaveLength(1);
    expect(d.created[0]).toMatchObject({
      practiceId: 'prac-1',
      settingKey: 'support.governance',
    });
    expect(d.created[0].valueJson.inactivityDays).toBe(30);
    expect(d.created[0].valueJson.unusedDays).toBe(60);
    expect(out.settings.inactivityDays).toBe(30);
    expect(out.isDefault).toBe(false);
  });

  it('put: mezcla con lo vigente y actualiza la fila existente', async () => {
    const row = { valueJson: { unusedDays: 90 }, updatedAt: new Date(0) };
    const d = build({ row });
    const out = await runWithTenant(TENANT, () =>
      d.service.put({ creepThreshold: 20 } as any, ADMIN),
    );
    expect(d.created).toHaveLength(0);
    expect((row.valueJson as any).unusedDays).toBe(90);
    expect((row.valueJson as any).creepThreshold).toBe(20);
    expect(out.settings.unusedDays).toBe(90);
  });

  it('put inválido: 422 GOVERNANCE_SETTINGS_INVALID con los campos y sin escribir', async () => {
    const d = build();
    await expect(
      runWithTenant(TENANT, () =>
        d.service.put(
          { inactivityDays: 1, reviewCadenceMonths: 7 } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({
      reason: 'GOVERNANCE_SETTINGS_INVALID',
      details: {
        issues: [{ field: 'inactivityDays' }, { field: 'reviewCadenceMonths' }],
      },
    });
    expect(d.created).toHaveLength(0);
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('put: el paso extra fallido corta antes de escribir', async () => {
    const d = build();
    d.stepUp.assertFresh.mockRejectedValue(new Error('STEP_UP_REQUIRED'));
    await expect(
      runWithTenant(TENANT, () =>
        d.service.put({ unusedDays: 10 } as any, ADMIN),
      ),
    ).rejects.toThrow('STEP_UP_REQUIRED');
    expect(d.created).toHaveLength(0);
  });

  it('put sin práctica donde guardar: 422 sin crear nada', async () => {
    const d = build({ practice: null });
    await expect(
      runWithTenant(TENANT, () =>
        d.service.put({ unusedDays: 10 } as any, ADMIN),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_SETTINGS_INVALID' });
  });
});
