import {
  applicablePolicies,
  checkSessionRules,
  idleTimeoutClaim,
  isValidTimeZone,
  isWithinAllowedHours,
  resolveAccountKind,
  rolesInTenant,
  strictestRules,
  ttlToMinutes,
  allowedHoursDuration,
  violationsByTenant,
  MIN_ALLOWED_HOURS_MINUTES,
  type EffectiveSessionRules,
  type SessionPolicyFacts,
} from './session-policy';

const base = {
  newDeviceAlert: false,
  enforceIpRules: false,
  requireMfa: false,
};
const policy = (p: Partial<SessionPolicyFacts>): SessionPolicyFacts => ({
  scope: 'ALL_ACCOUNTS',
  idleTimeoutMinutes: 60,
  ...base,
  ...p,
});

/** 2026-10-30 es viernes. La Paz es UTC-4 todo el año. */
const at = (hhmmLaPaz: string, day = '2026-10-30'): Date => {
  const [h, m] = hhmmLaPaz.split(':').map(Number);
  return new Date(
    Date.UTC(
      Number(day.slice(0, 4)),
      Number(day.slice(5, 7)) - 1,
      Number(day.slice(8, 10)),
      h + 4,
      m,
    ),
  );
};

describe('políticas de sesión', () => {
  describe('applicablePolicies', () => {
    const policies = [
      policy({ scope: 'ALL_ACCOUNTS' }),
      policy({ scope: 'ORG_STAFF', idleTimeoutMinutes: 15 }),
      policy({ scope: 'ROLE', roleCode: 'SUPPORT_STAFF', requireMfa: true }),
    ];

    it('un paciente solo recibe la de todas las cuentas', () => {
      expect(applicablePolicies(policies, ['PATIENT', 'USER'])).toHaveLength(1);
    });

    it('el personal recibe la de su organización y la de su rol', () => {
      const applied = applicablePolicies(policies, ['SUPPORT_STAFF']);
      expect(applied.map((p) => p.scope)).toEqual([
        'ALL_ACCOUNTS',
        'ORG_STAFF',
        'ROLE',
      ]);
    });
  });

  describe('strictestRules', () => {
    it('toma la menor inactividad y exige MFA si alguna lo exige', () => {
      const rules = strictestRules([
        policy({ idleTimeoutMinutes: 60 }),
        policy({ idleTimeoutMinutes: 20, requireMfa: true }),
      ]);
      expect(rules.idleTimeoutMinutes).toBe(20);
      expect(rules.requireMfa).toBe(true);
    });

    it('sin políticas no impone nada', () => {
      expect(strictestRules([])).toEqual({
        idleTimeoutMinutes: undefined,
        requireMfa: false,
        allowedHours: [],
        newDeviceAlert: false,
        enforceIpRules: false,
      });
    });
  });

  describe('isWithinAllowedHours', () => {
    const office = { from: '07:00', to: '20:00', days: [1, 2, 3, 4, 5] };

    it('dentro de la franja y en día hábil', () => {
      expect(isWithinAllowedHours(office, at('10:30'))).toBe(true);
    });

    it('fuera de la franja', () => {
      expect(isWithinAllowedHours(office, at('21:00'))).toBe(false);
    });

    it('en un día no permitido (sábado)', () => {
      expect(isWithinAllowedHours(office, at('10:30', '2026-10-31'))).toBe(
        false,
      );
    });

    it('una franja que cruza la medianoche pertenece al día en que empezó', () => {
      const night = { from: '22:00', to: '06:00', days: [5] };
      expect(isWithinAllowedHours(night, at('23:00'))).toBe(true);
      // Sábado 03:00 sigue siendo el turno que empezó el viernes.
      expect(isWithinAllowedHours(night, at('03:00', '2026-10-31'))).toBe(true);
      // Viernes 03:00 es del turno del jueves: no permitido.
      expect(isWithinAllowedHours(night, at('03:00'))).toBe(false);
    });
  });

  describe('checkSessionRules', () => {
    it('rechaza fuera del horario permitido', () => {
      const rules = strictestRules([
        policy({ allowedHours: { from: '07:00', to: '20:00' } }),
      ]);
      expect(checkSessionRules(rules, at('22:00'))).toBe(
        'OUTSIDE_ALLOWED_HOURS',
      );
    });

    it('rechaza una sesión inactiva más allá del tiempo de inactividad', () => {
      const rules = strictestRules([policy({ idleTimeoutMinutes: 30 })]);
      const now = at('10:00');
      const last = new Date(now.getTime() - 31 * 60_000);
      expect(checkSessionRules(rules, now, last)).toBe('IDLE_TIMEOUT');
      expect(
        checkSessionRules(rules, now, new Date(now.getTime() - 5 * 60_000)),
      ).toBeNull();
    });

    it('al abrir sesión no hay actividad previa que medir', () => {
      const rules = strictestRules([policy({ idleTimeoutMinutes: 5 })]);
      expect(checkSessionRules(rules, at('10:00'))).toBeNull();
    });
  });

  describe('resolveAccountKind', () => {
    it('un hospital con el interruptor encendido es cuenta de organización', () => {
      expect(resolveAccountKind('HOSPITAL', ['ORGANIZATION'])).toBe(
        'ORGANIZATION',
      );
    });

    it('sin interruptor sigue siendo cuenta de persona', () => {
      expect(resolveAccountKind('HOSPITAL', [])).toBe('PERSON');
      expect(resolveAccountKind('HOSPITAL', ['PERSON'])).toBe('PERSON');
    });

    it('una aseguradora o farmacia nunca pasa a organización por el interruptor', () => {
      expect(resolveAccountKind('PAYER', ['ORGANIZATION'])).toBe('PERSON');
      expect(resolveAccountKind('PHARMACY', ['ORGANIZATION'])).toBe('PERSON');
      expect(resolveAccountKind(undefined, ['ORGANIZATION'])).toBe('PERSON');
    });

    it('clínica y prestador sí pueden', () => {
      expect(resolveAccountKind('CLINIC', ['ORGANIZATION'])).toBe(
        'ORGANIZATION',
      );
      expect(resolveAccountKind('PROVIDER', ['ORGANIZATION'])).toBe(
        'ORGANIZATION',
      );
    });
  });
});

describe('A5: zona horaria y roles por organización', () => {
  it('isValidTimeZone distingue una zona IANA de un texto cualquiera', () => {
    expect(isValidTimeZone('America/La_Paz')).toBe(true);
    expect(isValidTimeZone('UTC')).toBe(true);
    expect(isValidTimeZone('Marte/Olimpo')).toBe(false);
    expect(isValidTimeZone('')).toBe(false);
  });

  it('una zona inválida ya guardada no lanza RangeError: la franja se ignora y nadie queda bloqueado', () => {
    const hours = { from: '08:00', to: '09:00', timeZone: 'Marte/Olimpo' };
    expect(() => isWithinAllowedHours(hours, at('23:00'))).not.toThrow();
    expect(isWithinAllowedHours(hours, at('23:00'))).toBe(true);
    expect(
      checkSessionRules(
        {
          requireMfa: false,
          allowedHours: [hours],
          newDeviceAlert: false,
          enforceIpRules: false,
        },
        at('23:00'),
      ),
    ).toBeNull();
  });

  describe('rolesInTenant', () => {
    it('suma los roles globales y los que rigen en esa organización', () => {
      expect(
        rolesInTenant(
          ['USER', 'SUPPORT_STAFF', 'ADMIN'],
          { A: ['SUPPORT_STAFF'], B: ['ADMIN'] },
          'A',
        ).sort(),
      ).toEqual(['SUPPORT_STAFF', 'USER']);
    });

    it('sin ámbitos todos los roles son globales', () => {
      expect(rolesInTenant(['USER', 'ADMIN'], {}, 'A')).toEqual([
        'USER',
        'ADMIN',
      ]);
    });
  });
});

describe('inactividad y claim idleTimeoutMinutes', () => {
  const rules = (idle?: number): EffectiveSessionRules => ({
    idleTimeoutMinutes: idle,
    requireMfa: false,
    allowedHours: [],
    newDeviceAlert: false,
    enforceIpRules: false,
  });
  const ago = (now: Date, minutes: number): Date =>
    new Date(now.getTime() - minutes * 60_000);

  describe('idleTimeoutClaim', () => {
    it('es el menor plazo de las políticas que aplican', () => {
      const effective = strictestRules([
        policy({ idleTimeoutMinutes: 60 }),
        policy({ scope: 'ORG_STAFF', idleTimeoutMinutes: 15 }),
      ]);
      expect(idleTimeoutClaim(effective)).toBe(15);
    });

    it('se acota a 5-480 minutos', () => {
      expect(idleTimeoutClaim(rules(1))).toBe(5);
      expect(idleTimeoutClaim(rules(1440))).toBe(480);
      expect(idleTimeoutClaim(rules(480))).toBe(480);
      expect(idleTimeoutClaim(rules(5))).toBe(5);
    });

    it('sin política aplicable no hay claim', () => {
      expect(idleTimeoutClaim(undefined)).toBeUndefined();
      expect(idleTimeoutClaim(rules(undefined))).toBeUndefined();
      expect(idleTimeoutClaim(strictestRules([]))).toBeUndefined();
    });
  });

  describe('checkSessionRules con la holgura del access token', () => {
    const now = new Date('2026-10-30T15:00:00Z');

    it('sin holgura corta apenas pasa el plazo', () => {
      expect(checkSessionRules(rules(10), now, ago(now, 11))).toBe(
        'IDLE_TIMEOUT',
      );
      expect(checkSessionRules(rules(10), now, ago(now, 9))).toBeNull();
    });

    it('con la vida del token de holgura no corta a quien refresca al vencer el token', () => {
      // Plazo de 10 min con token de 15: el refresco normal llega a los ~15.
      expect(checkSessionRules(rules(10), now, ago(now, 15), 15)).toBeNull();
      expect(checkSessionRules(rules(10), now, ago(now, 24), 15)).toBeNull();
    });

    it('con holgura sigue cortando a quien dejó vencer el token más del plazo', () => {
      expect(checkSessionRules(rules(10), now, ago(now, 26), 15)).toBe(
        'IDLE_TIMEOUT',
      );
    });
  });

  describe('ttlToMinutes', () => {
    it.each([
      ['15m', 15],
      ['1h', 60],
      ['900s', 15],
      ['90s', 2],
      ['1d', 1440],
      ['900', 15],
      [' 30M ', 30],
    ])('%s son %i minutos', (ttl, minutes) =>
      expect(ttlToMinutes(ttl)).toBe(minutes),
    );

    it('un valor ilegible cuenta como los 15 minutos predeterminados', () => {
      expect(ttlToMinutes('quince')).toBe(15);
    });
  });
});

describe('N2: la política de una organización rige solo en ella', () => {
  const rulesOf = (
    byTenant: NonNullable<EffectiveSessionRules['byTenant']>,
  ): EffectiveSessionRules => ({
    ...strictestRules([]),
    tenantIds: Object.keys(byTenant),
    byTenant,
  });
  const empty = {
    requireMfa: false,
    newDeviceAlert: false,
    enforceIpRules: false,
  };

  it('checkSessionRules con tenantId solo mira las reglas de ESA organización', () => {
    const rules = rulesOf({
      A: { ...empty, allowedHours: [{ from: '08:00', to: '12:00' }] },
      B: { ...empty, allowedHours: [] },
    });
    // 15:00 en La Paz: fuera de la franja de A, B no tiene franja.
    expect(checkSessionRules(rules, at('15:00'), undefined, 0, 'A')).toBe(
      'OUTSIDE_ALLOWED_HOURS',
    );
    expect(checkSessionRules(rules, at('15:00'), undefined, 0, 'B')).toBeNull();
    expect(
      checkSessionRules(rules, at('15:00'), undefined, 0, 'sin-politica'),
    ).toBeNull();
  });

  it('violationsByTenant devuelve solo las organizaciones que niegan, cada una con su motivo', () => {
    const rules = rulesOf({
      A: { ...empty, allowedHours: [{ from: '08:00', to: '12:00' }] },
      B: { ...empty, allowedHours: [], idleTimeoutMinutes: 10 },
      C: { ...empty, allowedHours: [{ from: '08:00', to: '20:00' }] },
    });
    const longAgo = new Date(at('15:00').getTime() - 120 * 60_000);
    expect(violationsByTenant(rules, at('15:00'), longAgo, 15)).toEqual({
      A: 'OUTSIDE_ALLOWED_HOURS',
      B: 'IDLE_TIMEOUT',
    });
    expect(violationsByTenant(undefined, at('15:00'))).toEqual({});
  });

  it('idleTimeoutClaim con las organizaciones vivas ignora la inactividad de las que niegan', () => {
    const rules = rulesOf({
      A: { ...empty, allowedHours: [], idleTimeoutMinutes: 5 },
      B: { ...empty, allowedHours: [], idleTimeoutMinutes: 60 },
    });
    expect(idleTimeoutClaim({ ...rules, idleTimeoutMinutes: 5 })).toBe(5);
    expect(idleTimeoutClaim({ ...rules, idleTimeoutMinutes: 5 }, ['B'])).toBe(
      60,
    );
    expect(
      idleTimeoutClaim({ ...rules, idleTimeoutMinutes: 5 }, ['sin-politica']),
    ).toBeUndefined();
  });

  describe('allowedHoursDuration', () => {
    it('from == to dura 0: es una franja vacía, no de 24 horas', () => {
      expect(allowedHoursDuration({ from: '08:00', to: '08:00' })).toBe(0);
      expect(
        isWithinAllowedHours({ from: '08:00', to: '08:00' }, at('08:00')),
      ).toBe(false);
    });

    it('suma los dos tramos cuando la franja cruza la medianoche', () => {
      expect(allowedHoursDuration({ from: '22:00', to: '06:00' })).toBe(480);
      expect(allowedHoursDuration({ from: '07:00', to: '20:00' })).toBe(780);
    });

    it('el mínimo son 4 horas', () => {
      expect(MIN_ALLOWED_HOURS_MINUTES).toBe(240);
      expect(allowedHoursDuration({ from: '08:00', to: '11:59' })).toBeLessThan(
        MIN_ALLOWED_HOURS_MINUTES,
      );
    });
  });
});
