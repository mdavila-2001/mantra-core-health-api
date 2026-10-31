import {
  SOD_PLATFORM_RULES,
  checkSodTransaction,
  evaluateSod,
  expiredSodExceptions,
  grantsOverlap,
  mergeSodRules,
  ruleAdmitsException,
  selectRemediationGrant,
  sodActionRank,
  summarizeSod,
  targetWithin,
  validateSodExceptionRequest,
  validateSodRuleDerivation,
  type SodException,
  type SodGrantInput,
  type SodRule,
} from './support-sod';
import { atomMatchesPattern } from './support-permission-catalog';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const at = (iso: string): Date => new Date(`${iso}-04:00`);
const ruleOf = (code: string): SodRule => {
  const r = SOD_PLATFORM_RULES.find((x) => x.code === code);
  if (!r) throw new Error(code);
  return r;
};
const grant = (
  grantId: string,
  actions: string[],
  over: Partial<SodGrantInput> = {},
): SodGrantInput => ({ grantId, targetKind: 'ALL', actions, ...over });
const byCode = (f: readonly { ruleCode: string }[]): string[] =>
  f.map((x) => x.ruleCode);

describe('catálogo de plataforma · las 11 reglas (§6.3)', () => {
  it('trae exactamente los 11 códigos del contrato, en orden', () => {
    expect(SOD_PLATFORM_RULES.map((r) => r.code)).toEqual([
      'SOD-BILL-01',
      'SOD-BILL-02',
      'SOD-BILL-03',
      'SOD-BILL-04',
      'SOD-BILL-05',
      'SOD-PAT-01',
      'SOD-PAT-02',
      'SOD-GOV-01',
      'SOD-GOV-02',
      'SOD-GOV-03',
      'SOD-AUD-01',
    ]);
  });

  it.each([
    ['SOD-BILL-01', 'PERSON', 'BLOCK', true],
    ['SOD-BILL-02', 'PERSON', 'BLOCK', true],
    ['SOD-BILL-03', 'PERSON', 'REQUIRE_APPROVAL', false],
    ['SOD-BILL-04', 'PERSON', 'WARN', false],
    ['SOD-BILL-05', 'TRANSACTION', 'BLOCK', true],
    ['SOD-PAT-01', 'PERSON', 'BLOCK', true],
    ['SOD-PAT-02', 'PERSON', 'REQUIRE_APPROVAL', false],
    ['SOD-GOV-01', 'TRANSACTION', 'BLOCK', true],
    ['SOD-GOV-02', 'TRANSACTION', 'BLOCK', true],
    ['SOD-GOV-03', 'PERSON', 'REQUIRE_APPROVAL', false],
    ['SOD-AUD-01', 'PERSON', 'REQUIRE_APPROVAL', false],
  ])('%s: alcance %s, acción %s, is_hard=%s', (code, scope, action, hard) => {
    expect(ruleOf(code)).toMatchObject({ scope, action, isHard: hard });
  });

  it('las reglas con excepción la admiten hasta 90 días; las duras, ninguna', () => {
    for (const r of SOD_PLATFORM_RULES) {
      if (r.isHard) {
        expect(r.maxExceptionDays ?? null).toBeNull();
        expect(ruleAdmitsException(r)).toBe(false);
      }
      if (r.action === 'REQUIRE_APPROVAL') {
        expect(r.maxExceptionDays).toBe(90);
        expect(ruleAdmitsException(r)).toBe(true);
      }
    }
  });

  it('ninguna regla duplica códigos y todo átomo concreto de los conjuntos existe en el catálogo', () => {
    expect(new Set(SOD_PLATFORM_RULES.map((r) => r.code)).size).toBe(11);
    // Cada entrada es un átomo del catálogo o un marcador `@…` de reglas TRANSACTION.
    const known = (e: string): boolean =>
      e.startsWith('@') ||
      [
        'billing.payment.collect',
        'billing.receipt.void',
        'billing.payment.refund',
        'agenda.appointment.create',
        'agenda.appointment.walk_in',
        'billing.receipt.issue',
        'billing.discount.apply',
        'patients.profile.register',
        'patients.guardian.record',
        'patients.profile.edit_verified',
        'patients.profile.merge_request',
        'team.grants.assign',
        'team.campaigns.review',
        'team.requests.decide',
        'audit.activity.view_org',
        'audit.activity.export',
        'audit.reports.governance.view',
        'agenda.appointment.cancel',
      ].includes(e);
    for (const r of SOD_PLATFORM_RULES)
      for (const e of [...r.atomsA, ...r.atomsB]) expect(known(e)).toBe(true);
  });
});

describe('evaluateSod · una prueba de «conflicto» y una de «sin conflicto» por regla (AC-7)', () => {
  const rules = SOD_PLATFORM_RULES;
  const table: ReadonlyArray<[string, string[], string[]]> = [
    // [regla, acciones que dan conflicto, acciones que NO lo dan]
    [
      'SOD-BILL-01',
      ['billing.payment.collect', 'billing.receipt.void'],
      ['billing.payment.collect'],
    ],
    [
      'SOD-BILL-02',
      ['billing.payment.collect', 'billing.payment.refund'],
      ['billing.payment.refund'],
    ],
    [
      'SOD-BILL-03',
      ['agenda.appointment.walk_in', 'billing.receipt.issue'],
      ['billing.receipt.issue'],
    ],
    [
      'SOD-BILL-04',
      ['billing.discount.apply', 'billing.payment.collect'],
      ['billing.discount.apply'],
    ],
    [
      'SOD-PAT-01',
      ['patients.guardian.record', 'patients.profile.edit_verified'],
      ['patients.profile.edit_verified'],
    ],
    [
      'SOD-PAT-02',
      ['patients.profile.register', 'patients.profile.merge_request'],
      ['patients.profile.merge_request'],
    ],
    [
      'SOD-GOV-03',
      ['team.requests.decide', 'billing.receipt.issue'],
      ['team.requests.decide'],
    ],
    [
      'SOD-AUD-01',
      ['audit.activity.export', 'agenda.appointment.cancel'],
      ['audit.activity.export'],
    ],
  ];
  it.each(table)('%s', (code, conflict, clean) => {
    expect(
      byCode(evaluateSod([grant('g', conflict)], rules, [], NOW)),
    ).toContain(code);
    expect(
      byCode(evaluateSod([grant('g', clean)], rules, [], NOW)),
    ).not.toContain(code);
  });

  it('las reglas TRANSACTION no dan hallazgos al otorgar (las impone el servicio al ejecutar)', () => {
    const all = evaluateSod(
      [
        grant('g', [
          'billing.receipt.issue',
          'billing.receipt.void',
          'team.grants.assign',
          'team.campaigns.review',
        ]),
      ],
      rules,
      [],
      NOW,
    );
    expect(byCode(all)).not.toEqual(
      expect.arrayContaining(['SOD-BILL-05', 'SOD-GOV-01', 'SOD-GOV-02']),
    );
  });

  it('una regla con dos lados (A o B) se activa con cualquier átomo de A y cualquiera de B', () => {
    const f = evaluateSod(
      [
        grant('g1', ['agenda.appointment.create']),
        grant('g2', ['billing.receipt.issue']),
      ],
      rules,
      [],
      NOW,
    );
    expect(byCode(f)).toEqual(['SOD-BILL-03']);
    expect(f[0].atomsA).toEqual(['agenda.appointment.create']);
    expect(f[0].atomsB).toEqual(['billing.receipt.issue']);
    expect(f[0].grantIdsA).toEqual(['g1']);
    expect(f[0].grantIdsB).toEqual(['g2']);
  });

  it('los alias heredados cuentan: «billing.collect» + «billing.issue_receipt» chocan con SOD-BILL-03 cuando hay walk_in', () => {
    const f = evaluateSod(
      [grant('g', ['schedule.walk_in', 'billing.issue_receipt'])],
      rules,
      [],
      NOW,
    );
    expect(byCode(f)).toContain('SOD-BILL-03');
  });

  it('S-01: cobrar + anular es BLOQUEO duro y no admite excepción', () => {
    const f = evaluateSod(
      [grant('g', ['billing.payment.collect', 'billing.receipt.void'])],
      rules,
      [],
      NOW,
    );
    expect(f).toHaveLength(1);
    expect(f[0]).toMatchObject({
      ruleCode: 'SOD-BILL-01',
      outcome: 'BLOCKED',
      isHard: true,
    });
    const withException = evaluateSod(
      [grant('g', ['billing.payment.collect', 'billing.receipt.void'])],
      rules,
      [{ id: 'e1', ruleCode: 'SOD-BILL-01', validTo: at('2026-12-01T00:00') }],
      NOW,
    );
    expect(withException[0].outcome).toBe('BLOCKED');
  });

  it('una regla BLOQUEAR de la organización, aunque no sea dura, bloquea y no admite excepción', () => {
    const soft: SodRule = {
      code: 'ORG-BLOCK',
      name: 'Regla propia',
      atomsA: ['billing.payment.collect'],
      atomsB: ['billing.discount.apply'],
      scope: 'PERSON',
      action: 'BLOCK',
      isHard: false,
      maxExceptionDays: 30,
    };
    const f = evaluateSod(
      [grant('g', ['billing.payment.collect', 'billing.discount.apply'])],
      [soft],
      [{ id: 'e', ruleCode: 'ORG-BLOCK', validTo: at('2027-01-01T00:00') }],
      NOW,
    );
    expect(f[0]).toMatchObject({ outcome: 'BLOCKED', admitsException: false });
  });

  it('una regla dura con acción EXIGIR APROBACIÓN (dato incoherente) se trata como bloqueo', () => {
    const odd: SodRule = {
      code: 'ORG-ODD',
      name: 'x',
      atomsA: ['billing.payment.collect'],
      atomsB: ['billing.discount.apply'],
      scope: 'PERSON',
      action: 'REQUIRE_APPROVAL',
      isHard: true,
    };
    const f = evaluateSod(
      [grant('g', ['billing.payment.collect', 'billing.discount.apply'])],
      [odd],
      [],
      NOW,
    );
    expect(f[0].outcome).toBe('BLOCKED');
  });

  it('el efecto DENY no cuenta, ni lo revocado, ni lo vencido, ni lo que aún no empieza', () => {
    const f = evaluateSod(
      [
        grant('a', ['billing.payment.collect']),
        grant('b', ['billing.receipt.void'], { effect: 'DENY' }),
        grant('c', ['billing.payment.refund'], { active: false }),
        grant('d', ['billing.discount.apply'], { validTo: NOW }),
        grant('e', ['billing.receipt.issue'], {
          validFrom: new Date(NOW.getTime() + 1000),
        }),
      ],
      rules,
      [],
      NOW,
    );
    expect(f).toEqual([]);
  });

  it('PERSON: el conflicto es de capacidad, sin importar el objetivo de cada permiso', () => {
    const f = evaluateSod(
      [
        grant('g1', ['billing.payment.collect'], {
          targetKind: 'SERVICE',
          healthcareServiceId: 'eco',
        }),
        grant('g2', ['billing.receipt.void'], {
          targetKind: 'SERVICE',
          healthcareServiceId: 'card',
        }),
      ],
      [ruleOf('SOD-BILL-01')],
      [],
      NOW,
    );
    expect(byCode(f)).toEqual(['SOD-BILL-01']);
  });

  describe('PERSON_OVERLAP: solo choca si las coberturas se solapan', () => {
    const rule: SodRule = {
      code: 'ORG-X',
      name: 'Regla de la organización',
      atomsA: ['billing.payment.collect'],
      atomsB: ['billing.discount.apply'],
      scope: 'PERSON_OVERLAP',
      action: 'BLOCK',
      isHard: false,
    };
    const eco = { targetKind: 'SERVICE' as const, healthcareServiceId: 'eco' };
    const card = {
      targetKind: 'SERVICE' as const,
      healthcareServiceId: 'card',
    };
    it('mismo servicio: choca', () => {
      const f = evaluateSod(
        [
          grant('a', ['billing.payment.collect'], eco),
          grant('b', ['billing.discount.apply'], eco),
        ],
        [rule],
        [],
        NOW,
      );
      expect(byCode(f)).toEqual(['ORG-X']);
    });
    it('servicios distintos: no choca', () => {
      const f = evaluateSod(
        [
          grant('a', ['billing.payment.collect'], eco),
          grant('b', ['billing.discount.apply'], card),
        ],
        [rule],
        [],
        NOW,
      );
      expect(f).toEqual([]);
    });
    it('un solo permiso con A y B que cubre algo: choca consigo mismo', () => {
      const f = evaluateSod(
        [
          grant(
            'a',
            ['billing.payment.collect', 'billing.discount.apply'],
            eco,
          ),
        ],
        [rule],
        [],
        NOW,
      );
      expect(byCode(f)).toEqual(['ORG-X']);
    });
    it('uno acotado y otro ALL: choca (ALL se solapa con todo)', () => {
      const f = evaluateSod(
        [
          grant('a', ['billing.payment.collect'], eco),
          grant('b', ['billing.discount.apply']),
        ],
        [rule],
        [],
        NOW,
      );
      expect(byCode(f)).toEqual(['ORG-X']);
    });
  });

  it('un patrón con comodín en los conjuntos alcanza varios átomos', () => {
    const rule: SodRule = {
      code: 'ORG-WILD',
      name: 'Caja y todo lo de equipo',
      atomsA: ['team.*'],
      atomsB: ['billing.payment.collect'],
      scope: 'PERSON',
      action: 'WARN',
      isHard: false,
    };
    const f = evaluateSod(
      [
        grant('g', [
          'team.members.view',
          'team.requests.decide',
          'billing.payment.collect',
        ]),
      ],
      [rule],
      [],
      NOW,
    );
    expect(f[0].atomsA).toEqual(['team.members.view', 'team.requests.decide']);
    expect(atomMatchesPattern('team.members.view', 'team.*')).toBe(true);
  });

  it('un mismo átomo en A y B no es conflicto por sí solo', () => {
    const rule: SodRule = {
      code: 'ORG-SELF',
      name: 'x',
      atomsA: ['billing.*'],
      atomsB: ['billing.*'],
      scope: 'PERSON',
      action: 'BLOCK',
      isHard: false,
    };
    expect(
      evaluateSod([grant('g', ['billing.payment.collect'])], [rule], [], NOW),
    ).toEqual([]);
    expect(
      byCode(
        evaluateSod(
          [grant('g', ['billing.payment.collect', 'billing.receipt.void'])],
          [rule],
          [],
          NOW,
        ),
      ),
    ).toEqual(['ORG-SELF']);
  });

  it('propiedad: el orden de concesiones, de átomos y de reglas no cambia los hallazgos', () => {
    const grants = [
      grant('g1', ['billing.payment.collect', 'agenda.appointment.create']),
      grant('g2', ['billing.receipt.issue', 'audit.activity.export']),
      grant('g3', [
        'patients.profile.register',
        'patients.profile.merge_request',
      ]),
      grant('g4', ['team.grants.assign', 'billing.payment.collect']),
    ];
    const norm = (f: ReturnType<typeof evaluateSod>): string =>
      JSON.stringify(
        [...f]
          .sort((a, b) => a.ruleCode.localeCompare(b.ruleCode))
          .map((x) => [
            x.ruleCode,
            x.outcome,
            x.atomsA,
            x.atomsB,
            x.grantIdsA,
            x.grantIdsB,
          ]),
      );
    const expected = norm(evaluateSod(grants, rules, [], NOW));
    for (let i = 0; i < 12; i += 1) {
      const gs = [...grants.slice(i % 4), ...grants.slice(0, i % 4)];
      const rs = i % 2 ? [...rules].reverse() : rules;
      const permuted =
        i % 3
          ? gs.map((g) => ({ ...g, actions: [...g.actions].reverse() }))
          : gs;
      expect(norm(evaluateSod(permuted.reverse(), rs, [], NOW))).toBe(expected);
    }
  });

  it('propiedad: quitar una concesión nunca agrega hallazgos (monotonía)', () => {
    const grants = [
      grant('g1', ['billing.payment.collect']),
      grant('g2', ['billing.receipt.void']),
      grant('g3', ['billing.receipt.issue']),
      grant('g4', ['agenda.appointment.walk_in']),
    ];
    const full = new Set(byCode(evaluateSod(grants, rules, [], NOW)));
    for (let i = 0; i < grants.length; i += 1) {
      const fewer = grants.filter((_, j) => j !== i);
      for (const c of byCode(evaluateSod(fewer, rules, [], NOW)))
        expect(full.has(c)).toBe(true);
    }
  });
});

describe('excepciones (AC-7): valid_to obligatorio y vencimiento', () => {
  const issue = [
    grant('g', ['agenda.appointment.walk_in', 'billing.receipt.issue']),
  ];
  const exception = (over: Partial<SodException> = {}): SodException => ({
    id: 'ex-1',
    ruleCode: 'SOD-BILL-03',
    validTo: at('2027-01-01T00:00'),
    ...over,
  });

  it('S-02: sin excepción pide excepción; con una vigente queda «exceptuado»', () => {
    const f0 = evaluateSod(issue, SOD_PLATFORM_RULES, [], NOW);
    expect(f0[0]).toMatchObject({
      ruleCode: 'SOD-BILL-03',
      outcome: 'EXCEPTION_REQUIRED',
    });
    const f1 = evaluateSod(issue, SOD_PLATFORM_RULES, [exception()], NOW);
    expect(f1[0]).toMatchObject({ outcome: 'EXCEPTED', exceptionId: 'ex-1' });
    expect(f1[0].exceptionValidTo).toEqual(at('2027-01-01T00:00'));
  });

  it('S-03: la excepción vence en valid_to y el conflicto reaparece (2026-12-31 → 2027-01-01 02:30)', () => {
    const e = exception({
      ruleCode: 'SOD-BILL-03',
      validTo: at('2026-12-31T23:59:59'),
    });
    expect(
      evaluateSod(issue, SOD_PLATFORM_RULES, [e], at('2026-12-31T12:00'))[0]
        .outcome,
    ).toBe('EXCEPTED');
    expect(
      evaluateSod(issue, SOD_PLATFORM_RULES, [e], at('2027-01-01T02:30'))[0]
        .outcome,
    ).toBe('EXCEPTION_REQUIRED');
  });

  it.each([
    ['revocada', { status: 'REVOKED' as const }],
    ['vencida marcada', { status: 'EXPIRED' as const }],
    ['aún no empieza', { validFrom: new Date(NOW.getTime() + 60_000) }],
    ['de otra regla', { ruleCode: 'SOD-BILL-04' }],
  ])('una excepción %s no exceptúa', (_n, over) => {
    const f = evaluateSod(issue, SOD_PLATFORM_RULES, [exception(over)], NOW);
    expect(f[0].outcome).toBe('EXCEPTION_REQUIRED');
  });

  it('expiredSodExceptions: las ACTIVE con valid_to ya pasado (barrido)', () => {
    const list: SodException[] = [
      exception({ id: 'a', validTo: at('2026-12-31T23:59:59') }),
      exception({ id: 'b', validTo: at('2027-03-01T00:00') }),
      exception({
        id: 'c',
        validTo: at('2026-12-01T00:00'),
        status: 'REVOKED',
      }),
      exception({
        id: 'd',
        validTo: at('2026-12-01T00:00'),
        status: 'EXPIRED',
      }),
    ];
    expect(
      expiredSodExceptions(list, at('2027-01-01T02:30')).map((e) => e.id),
    ).toEqual(['a']);
    expect(expiredSodExceptions(list, NOW)).toEqual([]);
  });

  describe('validateSodExceptionRequest', () => {
    const rule = ruleOf('SOD-BILL-03');
    const base = {
      rule,
      justification: 'x'.repeat(40),
      validTo: new Date(NOW.getTime() + 60 * 86_400_000),
      now: NOW,
    };
    it('S-02: 40 caracteres y +60 días es válida', () => {
      expect(validateSodExceptionRequest(base)).toEqual([]);
    });
    it('S-01: una regla dura no admite excepción (SOD_RULE_HARD)', () => {
      const issues = validateSodExceptionRequest({
        ...base,
        rule: ruleOf('SOD-BILL-01'),
      });
      expect(issues.map((i) => i.code)).toEqual(['SOD_RULE_HARD']);
    });
    it('una regla BLOQUEAR no admite excepción aunque no sea dura', () => {
      const soft: SodRule = {
        ...ruleOf('SOD-BILL-01'),
        code: 'ORG-B',
        isHard: false,
      };
      expect(
        validateSodExceptionRequest({ ...base, rule: soft }).map((i) => i.code),
      ).toEqual(['SOD_RULE_HARD']);
    });
    it('una regla que solo advierte no necesita excepción', () => {
      const issues = validateSodExceptionRequest({
        ...base,
        rule: ruleOf('SOD-BILL-04'),
      });
      expect(issues.map((i) => i.code)).toEqual(['SOD_EXCEPTION_NOT_NEEDED']);
    });
    it('justificación de menos de 30 caracteres (sin contar espacios de los bordes)', () => {
      expect(
        validateSodExceptionRequest({
          ...base,
          justification: ` ${'x'.repeat(29)} `,
        }).map((i) => i.code),
      ).toEqual(['JUSTIFICATION_TOO_SHORT']);
      expect(
        validateSodExceptionRequest({ ...base, justification: 'x'.repeat(30) }),
      ).toEqual([]);
    });
    it('valid_to es obligatorio y debe ser futuro', () => {
      expect(
        validateSodExceptionRequest({ ...base, validTo: undefined }).map(
          (i) => i.code,
        ),
      ).toEqual(['VALID_TO_REQUIRED']);
      expect(
        validateSodExceptionRequest({ ...base, validTo: NOW }).map(
          (i) => i.code,
        ),
      ).toEqual(['VALID_TO_NOT_IN_FUTURE']);
      expect(
        validateSodExceptionRequest({
          ...base,
          validTo: new Date('invalid'),
        }).map((i) => i.code),
      ).toEqual(['VALID_TO_REQUIRED']);
    });
    it('el tope es el menor entre el ajuste (90), la regla (90) y el duro (180)', () => {
      const day = 86_400_000;
      expect(
        validateSodExceptionRequest({
          ...base,
          validTo: new Date(NOW.getTime() + 90 * day),
        }),
      ).toEqual([]);
      const over = validateSodExceptionRequest({
        ...base,
        validTo: new Date(NOW.getTime() + 91 * day),
      });
      expect(over).toMatchObject([
        { code: 'VALID_TO_EXCEEDS_LIMIT', limitDays: 90 },
      ]);
      // Con el ajuste en 150 manda el tope de la regla (90).
      expect(
        validateSodExceptionRequest({
          ...base,
          settingMaxDays: 150,
          validTo: new Date(NOW.getTime() + 120 * day),
        }),
      ).toMatchObject([{ code: 'VALID_TO_EXCEEDS_LIMIT', limitDays: 90 }]);
      // Una regla de la organización con 150 y ajuste en 400: manda el duro (180).
      const org: SodRule = { ...rule, code: 'ORG-C', maxExceptionDays: 150 };
      expect(
        validateSodExceptionRequest({
          ...base,
          rule: org,
          settingMaxDays: 400,
          validTo: new Date(NOW.getTime() + 181 * day),
        }),
      ).toMatchObject([{ code: 'VALID_TO_EXCEEDS_LIMIT', limitDays: 150 }]);
      expect(
        validateSodExceptionRequest({
          ...base,
          rule: { ...rule, maxExceptionDays: null },
          settingMaxDays: 400,
          validTo: new Date(NOW.getTime() + 181 * day),
        }),
      ).toMatchObject([{ code: 'VALID_TO_EXCEEDS_LIMIT', limitDays: 180 }]);
    });
  });

  it('selectRemediationGrant: se revoca la concesión más reciente de las que causan el conflicto', () => {
    const [finding] = evaluateSod(
      [
        grant('viejo', ['team.grants.assign']),
        grant('nuevo', ['billing.payment.collect']),
      ],
      SOD_PLATFORM_RULES,
      [],
      NOW,
    );
    expect(finding.ruleCode).toBe('SOD-GOV-03');
    expect(
      selectRemediationGrant(finding, [
        { grantId: 'viejo', createdAt: at('2026-01-01T00:00') },
        { grantId: 'nuevo', createdAt: at('2026-09-01T00:00') },
        { grantId: 'ajeno', createdAt: at('2026-10-30T00:00') },
      ]),
    ).toBe('nuevo');
  });

  it('selectRemediationGrant: empate de fecha se resuelve por id y sin datos devuelve undefined', () => {
    const [finding] = evaluateSod(
      [
        grant('b', ['team.grants.assign']),
        grant('a', ['billing.payment.collect']),
      ],
      SOD_PLATFORM_RULES,
      [],
      NOW,
    );
    const same = at('2026-09-01T00:00');
    expect(
      selectRemediationGrant(finding, [
        { grantId: 'b', createdAt: same },
        { grantId: 'a', createdAt: same },
      ]),
    ).toBe('a');
    expect(selectRemediationGrant(finding, [])).toBeUndefined();
  });
});

describe('summarizeSod · qué responde el otorgamiento', () => {
  const mk = (grants: SodGrantInput[], ex: SodException[] = []) =>
    summarizeSod(evaluateSod(grants, SOD_PLATFORM_RULES, ex, NOW));

  it('BLOQUEAR gana: 422 SOD_CONFLICT_BLOCKED con los hallazgos', () => {
    const s = mk([
      grant('g', [
        'billing.payment.collect',
        'billing.receipt.void',
        'agenda.appointment.walk_in',
        'billing.receipt.issue',
      ]),
    ]);
    expect(s.verdict).toBe('BLOCKED');
    expect(s.httpStatus).toBe(422);
    expect(s.reason).toBe('SOD_CONFLICT_BLOCKED');
    expect(byCode(s.blocked)).toContain('SOD-BILL-01');
  });
  it('EXIGIR APROBACIÓN: 409 SOD_EXCEPTION_REQUIRED', () => {
    const s = mk([
      grant('g', ['agenda.appointment.walk_in', 'billing.receipt.issue']),
    ]);
    expect(s).toMatchObject({
      verdict: 'EXCEPTION_REQUIRED',
      httpStatus: 409,
      reason: 'SOD_EXCEPTION_REQUIRED',
    });
  });
  it('ADVERTIR: pasa con aviso', () => {
    const s = mk([
      grant('g', ['billing.discount.apply', 'billing.payment.collect']),
    ]);
    expect(s).toMatchObject({ verdict: 'WARN', httpStatus: 200 });
    expect(byCode(s.warnings)).toEqual(['SOD-BILL-04']);
  });
  it('sin hallazgos o todo exceptuado: CLEAR', () => {
    expect(mk([grant('g', ['agenda.appointment.view'])])).toMatchObject({
      verdict: 'CLEAR',
      httpStatus: 200,
    });
    const s = mk(
      [grant('g', ['agenda.appointment.walk_in', 'billing.receipt.issue'])],
      [{ id: 'e', ruleCode: 'SOD-BILL-03', validTo: at('2027-01-01T00:00') }],
    );
    expect(s.verdict).toBe('CLEAR');
    expect(byCode(s.excepted)).toEqual(['SOD-BILL-03']);
  });
});

describe('checkSodTransaction · reglas TRANSACTION que impone el servicio', () => {
  it('SOD-GOV-01: quien decide no es quien pidió', () => {
    expect(
      checkSodTransaction({
        ruleCode: 'SOD-GOV-01',
        actorsA: ['u1'],
        actorB: 'u1',
      }),
    ).toMatchObject({
      ruleCode: 'SOD-GOV-01',
      outcome: 'BLOCKED',
      conflictingUserId: 'u1',
    });
    expect(
      checkSodTransaction({
        ruleCode: 'SOD-GOV-01',
        actorsA: ['u1'],
        actorB: 'u2',
      }),
    ).toBeUndefined();
  });
  it('SOD-GOV-02 (S-04): quien certifica no es quien otorgó ni quien aprobó la concesión', () => {
    const base = {
      ruleCode: 'SOD-GOV-02',
      actorsA: ['sofia', null, 'gonzalo', undefined],
    };
    expect(checkSodTransaction({ ...base, actorB: 'sofia' })?.outcome).toBe(
      'BLOCKED',
    );
    expect(checkSodTransaction({ ...base, actorB: 'gonzalo' })?.outcome).toBe(
      'BLOCKED',
    );
    expect(checkSodTransaction({ ...base, actorB: 'admin' })).toBeUndefined();
  });
  it('SOD-BILL-05: quien emitió no anula el mismo comprobante', () => {
    expect(
      checkSodTransaction({
        ruleCode: 'SOD-BILL-05',
        actorsA: ['mario'],
        actorB: 'mario',
      })?.outcome,
    ).toBe('BLOCKED');
  });
  it('una regla que no es TRANSACTION o no existe no se impone aquí', () => {
    expect(
      checkSodTransaction({
        ruleCode: 'SOD-BILL-01',
        actorsA: ['u'],
        actorB: 'u',
      }),
    ).toBeUndefined();
    expect(
      checkSodTransaction({
        ruleCode: 'NO-EXISTE',
        actorsA: ['u'],
        actorB: 'u',
      }),
    ).toBeUndefined();
  });
  it('una regla de la organización TRANSACTION se pasa en `rules`', () => {
    const rule: SodRule = {
      code: 'ORG-T',
      name: 'x',
      atomsA: ['@a'],
      atomsB: ['@b'],
      scope: 'TRANSACTION',
      action: 'WARN',
      isHard: false,
    };
    expect(
      checkSodTransaction({
        ruleCode: 'ORG-T',
        actorsA: ['u'],
        actorB: 'u',
        rules: [rule],
      })?.outcome,
    ).toBe('WARNING');
  });
});

describe('reglas de la organización: endurecen, nunca aflojan', () => {
  const base = ruleOf('SOD-BILL-03');
  it('el orden de acciones es BLOQUEAR > EXIGIR APROBACIÓN > ADVERTIR', () => {
    expect(sodActionRank('BLOCK')).toBeGreaterThan(
      sodActionRank('REQUIRE_APPROVAL'),
    );
    expect(sodActionRank('REQUIRE_APPROVAL')).toBeGreaterThan(
      sodActionRank('WARN'),
    );
  });
  it('D-05: subir SOD-BILL-03 a BLOQUEAR es válido', () => {
    expect(
      validateSodRuleDerivation(base, { ...base, action: 'BLOCK' }),
    ).toEqual([]);
  });
  it('bajar la acción afloja', () => {
    const issues = validateSodRuleDerivation(base, { ...base, action: 'WARN' });
    expect(issues).toEqual([
      { code: 'SOD_RULE_LOOSENS_BASE', field: 'action' },
    ]);
  });
  it('quitar is_hard afloja', () => {
    const hard = ruleOf('SOD-BILL-01');
    expect(validateSodRuleDerivation(hard, { ...hard, isHard: false })).toEqual(
      [{ code: 'SOD_RULE_LOOSENS_BASE', field: 'isHard' }],
    );
  });
  it('quitar átomos de un conjunto afloja; agregar no', () => {
    expect(
      validateSodRuleDerivation(base, {
        ...base,
        atomsA: ['agenda.appointment.create'],
      }).map((i) => i.field),
    ).toEqual(['atomsA']);
    expect(
      validateSodRuleDerivation(base, {
        ...base,
        atomsB: [...base.atomsB, 'billing.receipt.void'],
      }),
    ).toEqual([]);
  });
  it('un patrón amplio cubre los átomos del conjunto base', () => {
    expect(
      validateSodRuleDerivation(base, {
        ...base,
        atomsA: ['agenda.appointment.*'],
      }),
    ).toEqual([]);
  });
  it('alargar la excepción o quitar el alcance PERSON afloja', () => {
    expect(
      validateSodRuleDerivation(base, { ...base, maxExceptionDays: 120 }).map(
        (i) => i.field,
      ),
    ).toEqual(['maxExceptionDays']);
    expect(
      validateSodRuleDerivation(base, { ...base, maxExceptionDays: 30 }),
    ).toEqual([]);
    expect(
      validateSodRuleDerivation(base, { ...base, scope: 'PERSON_OVERLAP' }).map(
        (i) => i.field,
      ),
    ).toEqual(['scope']);
  });
  it('mergeSodRules: la derivada reemplaza a su base y las demás se suman', () => {
    const strict: SodRule = {
      ...base,
      action: 'BLOCK',
      baseRuleCode: 'SOD-BILL-03',
    };
    const extra: SodRule = {
      code: 'ORG-1',
      name: 'Propia',
      atomsA: ['a.b.c'],
      atomsB: ['d.e.f'],
      scope: 'PERSON',
      action: 'WARN',
      isHard: false,
    };
    const merged = mergeSodRules(SOD_PLATFORM_RULES, [strict, extra]);
    expect(merged).toHaveLength(12);
    expect(merged.find((r) => r.code === 'SOD-BILL-03')?.action).toBe('BLOCK');
    expect(merged.some((r) => r.code === 'ORG-1')).toBe(true);
  });
  it('mergeSodRules: una derivada que afloja se ignora (queda la de plataforma)', () => {
    const loose: SodRule = {
      ...ruleOf('SOD-BILL-01'),
      action: 'WARN',
      isHard: false,
      baseRuleCode: 'SOD-BILL-01',
    };
    const merged = mergeSodRules(SOD_PLATFORM_RULES, [loose]);
    expect(merged.find((r) => r.code === 'SOD-BILL-01')).toMatchObject({
      action: 'BLOCK',
      isHard: true,
    });
  });
  it('mergeSodRules: una regla propia que repite un código de plataforma sin ser su derivada se ignora', () => {
    const clash: SodRule = {
      code: 'SOD-PAT-02',
      name: 'x',
      atomsA: ['a.b.c'],
      atomsB: ['d.e.f'],
      scope: 'PERSON',
      action: 'WARN',
      isHard: false,
    };
    expect(
      mergeSodRules(SOD_PLATFORM_RULES, [clash]).find(
        (r) => r.code === 'SOD-PAT-02',
      )?.action,
    ).toBe('REQUIRE_APPROVAL');
  });
});

describe('reexportaciones del contrato (§8.1)', () => {
  it('support-sod expone grantsOverlap y targetWithin', () => {
    expect(grantsOverlap({ targetKind: 'ALL' }, { targetKind: 'ALL' })).toBe(
      true,
    );
    expect(
      targetWithin(
        { targetKind: 'ALL' },
        { targetKind: 'SERVICE', healthcareServiceId: 's' },
      ),
    ).toBe(false);
  });
});
