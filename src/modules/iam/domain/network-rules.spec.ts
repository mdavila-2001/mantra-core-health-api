import {
  evaluateNetworkRules,
  isDeniedNowOrLater,
  isValidCidr,
  matchesCidr,
  normalizeIp,
  rulesEffectiveAt,
} from './network-rules';

describe('reglas de red', () => {
  describe('normalizeIp', () => {
    it('deja una IPv4 como está y rechaza lo que no es una IP', () => {
      expect(normalizeIp('190.129.4.5')).toBe('190.129.4.5');
      expect(normalizeIp('no-es-ip')).toBeUndefined();
      expect(normalizeIp(undefined)).toBeUndefined();
      expect(normalizeIp('')).toBeUndefined();
    });

    it('una IPv4 mapeada en IPv6 es la IPv4', () => {
      expect(normalizeIp('::ffff:190.129.4.5')).toBe('190.129.4.5');
    });

    it('quita corchetes y zona de una IPv6', () => {
      expect(normalizeIp('[2001:db8::1]')).toBe('2001:db8::1');
      expect(normalizeIp('fe80::1%eth0')).toBe('fe80::1');
    });
  });

  describe('isValidCidr', () => {
    it.each(['10.0.0.0/8', '203.0.113.7/32', '2001:db8::/32', '0.0.0.0/0'])(
      '%s es válido',
      (cidr) => expect(isValidCidr(cidr)).toBe(true),
    );

    it.each([
      '10.0.0.0',
      '10.0.0.0/33',
      '2001:db8::/129',
      '10.0.0.0/-1',
      '10.0.0.0/a',
      'x/8',
      '10.0.0.0/8/8',
      '',
    ])('%s no lo es', (cidr) => expect(isValidCidr(cidr)).toBe(false));
  });

  describe('matchesCidr', () => {
    it('coincide dentro del rango y no fuera', () => {
      expect(matchesCidr('190.129.200.1', '190.129.0.0/16')).toBe(true);
      expect(matchesCidr('190.130.0.1', '190.129.0.0/16')).toBe(false);
      expect(matchesCidr('203.0.113.7', '203.0.113.7/32')).toBe(true);
      expect(matchesCidr('203.0.113.8', '203.0.113.7/32')).toBe(false);
    });

    it('una familia no coincide con rangos de la otra', () => {
      expect(matchesCidr('2001:db8::5', '10.0.0.0/8')).toBe(false);
      expect(matchesCidr('10.1.1.1', '2001:db8::/32')).toBe(false);
      expect(matchesCidr('2001:db8::5', '2001:db8::/32')).toBe(true);
    });

    it('un CIDR inválido no coincide con nada', () => {
      expect(matchesCidr('10.1.1.1', '10.0.0.0/99')).toBe(false);
    });
  });

  describe('evaluateNetworkRules', () => {
    const allow = (cidr: string) => ({ type: 'ALLOW' as const, cidr });
    const deny = (cidr: string) => ({ type: 'DENY' as const, cidr });

    it('sin reglas no hay restricción (nadie queda fuera por encender la política antes de cargar redes)', () => {
      expect(evaluateNetworkRules('8.8.8.8', [])).toBe('NO_RULES');
      expect(evaluateNetworkRules(undefined, [])).toBe('NO_RULES');
    });

    it('con reglas ALLOW solo entra quien cae en alguna', () => {
      const rules = [allow('190.129.0.0/16'), allow('203.0.113.0/24')];
      expect(evaluateNetworkRules('190.129.9.9', rules)).toBe('ALLOWED');
      expect(evaluateNetworkRules('203.0.113.50', rules)).toBe('ALLOWED');
      expect(evaluateNetworkRules('8.8.8.8', rules)).toBe('DENIED');
    });

    it('una regla DENY que coincide gana sobre un ALLOW', () => {
      const rules = [allow('190.129.0.0/16'), deny('190.129.5.0/24')];
      expect(evaluateNetworkRules('190.129.5.7', rules)).toBe('DENIED');
      expect(evaluateNetworkRules('190.129.6.7', rules)).toBe('ALLOWED');
    });

    it('solo reglas DENY: entra quien no cae en ellas', () => {
      expect(evaluateNetworkRules('8.8.8.8', [deny('10.0.0.0/8')])).toBe(
        'ALLOWED',
      );
      expect(evaluateNetworkRules('10.9.9.9', [deny('10.0.0.0/8')])).toBe(
        'DENIED',
      );
    });

    it('un origen que no se puede determinar se niega cuando hay reglas', () => {
      expect(evaluateNetworkRules(undefined, [allow('10.0.0.0/8')])).toBe(
        'DENIED',
      );
      expect(evaluateNetworkRules(undefined, [deny('10.0.0.0/8')])).toBe(
        'DENIED',
      );
    });
  });
});

describe('N2: vigencias de las reglas de red', () => {
  const now = new Date('2026-10-30T12:00:00Z');
  const day = (n: number) => new Date(now.getTime() + n * 86_400_000);
  const MINE = '190.129.4.5';

  it('rulesEffectiveAt solo devuelve las que rigen en ese instante', () => {
    const rules = [
      { type: 'ALLOW' as const, cidr: '10.0.0.0/8' },
      { type: 'ALLOW' as const, cidr: '1.1.1.0/24', validFrom: day(1) },
      { type: 'DENY' as const, cidr: '2.2.2.0/24', validTo: day(-1) },
    ];
    expect(rulesEffectiveAt(rules, now)).toEqual([
      { type: 'ALLOW', cidr: '10.0.0.0/8' },
    ]);
    expect(rulesEffectiveAt(rules, day(2)).map((r) => r.cidr)).toEqual([
      '10.0.0.0/8',
      '1.1.1.0/24',
    ]);
  });

  it('un ALLOW programado para mañana que deja fuera al origen se detecta AHORA', () => {
    // Hoy no hay reglas vigentes (no encierra a nadie); mañana entra un ALLOW
    // por una red ajena y encerraría a todos, incluido quien lo guarda.
    const rules = [
      { type: 'ALLOW' as const, cidr: '192.0.2.1/32', validFrom: day(1) },
    ];
    expect(evaluateNetworkRules(MINE, rulesEffectiveAt(rules, now))).toBe(
      'NO_RULES',
    );
    expect(isDeniedNowOrLater(MINE, rules, now)).toBe(true);
  });

  it('un DENY que entra en vigor después también se detecta', () => {
    const rules = [
      { type: 'DENY' as const, cidr: '190.129.0.0/16', validFrom: day(3) },
    ];
    expect(isDeniedNowOrLater(MINE, rules, now)).toBe(true);
  });

  it('una regla que vence deja de contar, y la que sigue permite el origen', () => {
    const rules = [
      { type: 'ALLOW' as const, cidr: '192.0.2.1/32', validTo: day(1) },
      { type: 'ALLOW' as const, cidr: '190.129.0.0/16' },
    ];
    // Quien está en el /16 nunca queda fuera.
    expect(isDeniedNowOrLater(MINE, rules, now)).toBe(false);
    // Quien solo está en el /32: hoy pasa, pero mañana vence y el /16 no lo cubre.
    expect(
      evaluateNetworkRules('192.0.2.1', rulesEffectiveAt(rules, now)),
    ).toBe('ALLOWED');
    expect(isDeniedNowOrLater('192.0.2.1', rules, now)).toBe(true);
  });

  it('un conjunto que permite el origen siempre no lo encierra', () => {
    const rules = [
      { type: 'ALLOW' as const, cidr: '190.129.0.0/16' },
      { type: 'ALLOW' as const, cidr: '1.1.1.0/24', validFrom: day(1) },
    ];
    expect(isDeniedNowOrLater(MINE, rules, now)).toBe(false);
    expect(isDeniedNowOrLater(MINE, [], now)).toBe(false);
  });

  it('un origen ilegible con reglas en algún momento se niega', () => {
    expect(
      isDeniedNowOrLater(
        undefined,
        [{ type: 'ALLOW', cidr: '10.0.0.0/8' }],
        now,
      ),
    ).toBe(true);
  });
});
