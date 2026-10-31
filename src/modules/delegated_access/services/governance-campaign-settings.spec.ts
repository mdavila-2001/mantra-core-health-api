import {
  DEFAULT_SWEEP_SETTINGS,
  parseGovernanceSettings,
} from './governance-campaign-settings';

describe('parseGovernanceSettings', () => {
  it('sin fila o con basura devuelve los valores por defecto (nunca abre un control)', () => {
    expect(parseGovernanceSettings(undefined)).toEqual(DEFAULT_SWEEP_SETTINGS);
    expect(parseGovernanceSettings('x')).toEqual(DEFAULT_SWEEP_SETTINGS);
    expect(parseGovernanceSettings([1, 2])).toEqual(DEFAULT_SWEEP_SETTINGS);
    expect(DEFAULT_SWEEP_SETTINGS).toMatchObject({
      unusedDays: 60,
      inactivityDays: 45,
      autoSuspendInactiveDays: null,
      reviewCadenceMonths: null,
      creepThreshold: 15,
    });
  });

  it('lee los valores válidos del contrato (§7.2)', () => {
    expect(
      parseGovernanceSettings({
        onboardingRequired: false,
        inactivityDays: 30,
        unusedDays: 90,
        autoSuspendInactiveDays: 90,
        reviewCadenceMonths: 6,
        creepThreshold: 10,
      }),
    ).toEqual({
      onboardingRequired: false,
      inactivityDays: 30,
      unusedDays: 90,
      autoSuspendInactiveDays: 90,
      reviewCadenceMonths: 6,
      creepThreshold: 10,
    });
  });

  it.each([
    [{ unusedDays: 0 }, 'unusedDays', 60],
    [{ unusedDays: 'x' }, 'unusedDays', 60],
    [{ inactivityDays: 3 }, 'inactivityDays', 45],
    [{ creepThreshold: 9999 }, 'creepThreshold', 15],
    [{ creepThreshold: 1.5 }, 'creepThreshold', 15],
    [{ reviewCadenceMonths: 9 }, 'reviewCadenceMonths', null],
    [{ autoSuspendInactiveDays: 3 }, 'autoSuspendInactiveDays', null],
    [{ autoSuspendInactiveDays: 'ya' }, 'autoSuspendInactiveDays', null],
  ])(
    'un valor fuera de rango o de otro tipo (%j) deja el de siempre',
    (raw, key, expected) => {
      expect((parseGovernanceSettings(raw) as any)[key]).toBe(expected);
    },
  );

  it('onboardingRequired solo cambia con un booleano', () => {
    expect(
      parseGovernanceSettings({ onboardingRequired: 'no' }).onboardingRequired,
    ).toBe(true);
  });
});
