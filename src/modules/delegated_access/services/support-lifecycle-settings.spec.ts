import { jest } from '@jest/globals';
import {
  DEFAULT_LIFECYCLE_SETTINGS,
  GOVERNANCE_SETTINGS_KEY,
  LifecycleSettingsReader,
  parseLifecycleSettings,
} from './support-lifecycle-settings';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('parseLifecycleSettings', () => {
  it('sin ajustes rigen las recomendaciones: compuerta activa, 45 días y suspensión automática apagada (D-03, D-04)', () => {
    expect(parseLifecycleSettings(undefined)).toEqual(
      DEFAULT_LIFECYCLE_SETTINGS,
    );
    expect(DEFAULT_LIFECYCLE_SETTINGS.onboardingRequired).toBe(true);
    expect(DEFAULT_LIFECYCLE_SETTINGS.onboardingRequiredSince).toBeNull();
    expect(DEFAULT_LIFECYCLE_SETTINGS.requireMfa).toBe(false);
    expect(DEFAULT_LIFECYCLE_SETTINGS.inactivityDays).toBe(45);
    expect(DEFAULT_LIFECYCLE_SETTINGS.autoSuspendInactiveDays).toBeNull();
    expect(DEFAULT_LIFECYCLE_SETTINGS.suspensionReviewAfterDays).toBe(60);
  });

  it('lee el ajuste del piloto', () => {
    const s = parseLifecycleSettings(
      {
        onboardingRequired: true,
        onboardingRequiredSince: '2026-11-02T00:00:00Z',
        inactivityDays: 45,
        autoSuspendInactiveDays: 90,
        suspensionReviewAfterDays: 60,
      },
      true,
    );
    expect(s.onboardingRequired).toBe(true);
    expect(s.onboardingRequiredSince?.toISOString()).toBe(
      '2026-11-02T00:00:00.000Z',
    );
    expect(s.autoSuspendInactiveDays).toBe(90);
    expect(s.requireMfa).toBe(true);
  });

  it('un valor con el tipo equivocado o fuera de rango deja el de por defecto, nunca abre un control', () => {
    const s = parseLifecycleSettings({
      onboardingRequired: 'si',
      onboardingRequiredSince: 'no es fecha',
      inactivityDays: -3,
      autoSuspendInactiveDays: 'noventa',
      suspensionReviewAfterDays: 0,
    });
    expect(s).toEqual(DEFAULT_LIFECYCLE_SETTINGS);
    expect(parseLifecycleSettings([1, 2])).toEqual(DEFAULT_LIFECYCLE_SETTINGS);
  });
});

describe('LifecycleSettingsReader', () => {
  function build(
    rows: any[],
    practices = [{ id: 'p1' }],
    policies: any[] = [],
  ) {
    const em = {
      find: mockFn(async (entity: { name: string }) =>
        entity.name === 'Practices'
          ? practices
          : entity.name === 'SessionPolicies'
            ? policies
            : rows,
      ),
    };
    return { em, reader: new LifecycleSettingsReader() };
  }

  it('toma la fila más reciente de las prácticas de la organización y la cachea', async () => {
    const { em, reader } = build([
      {
        settingKey: GOVERNANCE_SETTINGS_KEY,
        updatedAt: new Date('2026-01-01'),
        valueJson: { onboardingRequired: false },
      },
      {
        settingKey: GOVERNANCE_SETTINGS_KEY,
        updatedAt: new Date('2026-10-01'),
        valueJson: { onboardingRequired: true, inactivityDays: 30 },
      },
    ]);
    const now = new Date('2026-11-03T10:30:00-04:00');
    const s = await reader.forTenant(em as any, 't1', now);
    expect(s.onboardingRequired).toBe(true);
    expect(s.inactivityDays).toBe(30);
    await reader.forTenant(em as any, 't1', new Date(now.getTime() + 5_000));
    expect(em.find).toHaveBeenCalledTimes(3); // prácticas, ajustes y políticas de sesión, una sola vez
    reader.invalidate('t1');
    await reader.forTenant(em as any, 't1', now);
    expect(em.find).toHaveBeenCalledTimes(6);
  });

  it('la verificación en dos pasos obligatoria sale de la política de sesión de la organización (de todo el personal o del de apoyo)', async () => {
    const { em, reader } = build(
      [],
      [{ id: 'p1' }],
      [{ requireMfa: true, roleCode: 'PRACTITIONER' }],
    );
    expect((await reader.forTenant(em as any, 't1')).requireMfa).toBe(false);
    reader.invalidate();
    const a = build(
      [],
      [{ id: 'p1' }],
      [{ requireMfa: true, roleCode: undefined }],
    );
    expect((await a.reader.forTenant(a.em as any, 't1')).requireMfa).toBe(true);
    const b = build(
      [],
      [{ id: 'p1' }],
      [{ requireMfa: true, roleCode: 'SUPPORT_STAFF' }],
    );
    expect((await b.reader.forTenant(b.em as any, 't1')).requireMfa).toBe(true);
  });

  it('sin prácticas o sin fila devuelve los valores por defecto', async () => {
    const { em, reader } = build([], []);
    expect(await reader.forTenant(em as any, 't1')).toEqual(
      DEFAULT_LIFECYCLE_SETTINGS,
    );
  });
});
