import {
  DEFAULT_CREEP_THRESHOLD,
  countGrantsSinceCertification,
  privilegeCreep,
  privilegeDelta,
  privilegeScore,
  privilegeScoreOfGrants,
  templateBaselineScore,
} from './support-privilege-score';
import {
  PERMISSION_ATOMS,
  SENSITIVITY_WEIGHT,
} from './support-permission-catalog';
import { SUPPORT_TEMPLATE_DEFAULTS_V2 } from './support-template-packages';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const day = (n: number): Date => new Date(NOW.getTime() + n * 86_400_000);

describe('privilegeScore · Σ peso(sensibilidad) por átomo distinto (§6.6)', () => {
  it('los pesos son BAJA 1, MEDIA 2, ALTA 5, CRÍTICA 10', () => {
    expect(SENSITIVITY_WEIGHT).toEqual({
      LOW: 1,
      MEDIUM: 2,
      HIGH: 5,
      CRITICAL: 10,
    });
  });

  it('suma un peso por cada átomo distinto, según su sensibilidad', () => {
    // Todas ALTA en el catálogo.
    expect(
      privilegeScore([
        'billing.payment.collect',
        'billing.discount.apply',
        'billing.payment.collect',
      ]),
    ).toBe(10);
  });

  it('un alias se expande a su paquete y no se cuenta dos veces con el átomo', () => {
    const viaAlias = privilegeScore(['billing.collect']);
    expect(viaAlias).toBeGreaterThan(0);
    expect(privilegeScore(['billing.collect', 'billing.payment.collect'])).toBe(
      viaAlias,
    );
  });

  it('ignora lo desconocido y lo vacío', () => {
    expect(privilegeScore([])).toBe(0);
    expect(privilegeScore(['no.existe.nada'])).toBe(0);
  });

  it('coincide con el peso del catálogo átomo por átomo', () => {
    for (const a of PERMISSION_ATOMS) {
      expect(privilegeScore([a.code])).toBe(SENSITIVITY_WEIGHT[a.sensitivity]);
    }
  });

  it('propiedad: es aditiva sobre átomos distintos y monótona', () => {
    const all = PERMISSION_ATOMS.map((a) => a.code);
    const half = all.filter((_, i) => i % 2 === 0);
    const rest = all.filter((_, i) => i % 2 === 1);
    expect(privilegeScore(half) + privilegeScore(rest)).toBe(
      privilegeScore(all),
    );
    expect(privilegeScore(all)).toBeGreaterThanOrEqual(privilegeScore(half));
    // el orden no importa
    expect(privilegeScore([...all].reverse())).toBe(privilegeScore(all));
  });

  it('privilegeScoreOfGrants solo cuenta lo ALLOW vivo', () => {
    const score = privilegeScoreOfGrants(
      [
        {
          grantId: 'a',
          targetKind: 'ALL',
          actions: ['billing.payment.collect'],
        },
        {
          grantId: 'b',
          targetKind: 'ALL',
          actions: ['billing.receipt.void'],
          effect: 'DENY',
        },
        {
          grantId: 'c',
          targetKind: 'ALL',
          actions: ['billing.discount.apply'],
          active: false,
        },
      ],
      NOW,
    );
    expect(score).toBe(5);
  });
});

describe('templateBaselineScore · puntaje del paquete v2 de la plantilla', () => {
  it.each([
    ['SECRETARY', 35],
    ['MEDICAL_ASSISTANT', 35],
    ['NURSING', 14],
    ['FRONT_DESK', 14],
    ['BILLING_CASHIER', 15],
    ['CALL_CENTER', 13],
    ['ORG_MANAGEMENT', 39],
  ])('%s = %i', (code, expected) => {
    expect(templateBaselineScore(code)).toBe(expected);
    expect(
      privilegeScore(
        SUPPORT_TEMPLATE_DEFAULTS_V2[
          code as keyof typeof SUPPORT_TEMPLATE_DEFAULTS_V2
        ],
      ),
    ).toBe(expected);
  });
  it('una plantilla desconocida no tiene línea base', () => {
    expect(templateBaselineScore('PROPIA')).toBeUndefined();
  });
});

describe('privilegeCreep · acumulación de privilegios (D-20)', () => {
  const cashier = [...SUPPORT_TEMPLATE_DEFAULTS_V2.BILLING_CASHIER];
  const MARIO_EXTRA = [
    'billing.discount.apply',
    'billing.cashbox.close',
    'reports.billing.export',
  ];

  it('el umbral por defecto es 15 puntos', () => {
    expect(DEFAULT_CREEP_THRESHOLD).toBe(15);
  });

  it('M-01: Mario pasa de 15 a 30 puntos, deriva 15 ≥ 15 ⇒ marcado', () => {
    const before = privilegeCreep({
      atoms: cashier,
      templateCode: 'BILLING_CASHIER',
    });
    expect(before).toMatchObject({
      score: 15,
      baseline: 15,
      drift: 0,
      flagged: false,
    });
    const after = privilegeCreep({
      atoms: [...cashier, ...MARIO_EXTRA],
      templateCode: 'BILLING_CASHIER',
    });
    expect(after).toMatchObject({
      score: 30,
      baseline: 15,
      drift: 15,
      threshold: 15,
      flaggedByDrift: true,
      flagged: true,
      reasons: ['DRIFT'],
    });
  });

  it('14 puntos de deriva no marcan; el umbral es ajustable (10 más sensible, 25 menos)', () => {
    const atoms = [
      ...cashier,
      'billing.discount.apply',
      'billing.cashbox.close',
      'agenda.appointment.view',
    ].filter((a) => a !== 'billing.cashbox.close');
    const r = privilegeCreep({ atoms, templateCode: 'BILLING_CASHIER' });
    expect(r.drift).toBeLessThan(15);
    expect(r.flagged).toBe(false);
    expect(
      privilegeCreep({ atoms, templateCode: 'BILLING_CASHIER', threshold: 5 })
        .flagged,
    ).toBe(true);
    expect(
      privilegeCreep({
        atoms: [...cashier, ...MARIO_EXTRA],
        templateCode: 'BILLING_CASHIER',
        threshold: 25,
      }).flagged,
    ).toBe(false);
  });

  it('también marca con ≥ 2 concesiones agregadas sin pasar por revisión, aunque la deriva sea baja', () => {
    const r = privilegeCreep({
      atoms: cashier,
      templateCode: 'BILLING_CASHIER',
      grantsSinceCertification: 2,
    });
    expect(r).toMatchObject({
      flaggedByDrift: false,
      flaggedByUnreviewed: true,
      flagged: true,
      reasons: ['UNREVIEWED_GRANTS'],
    });
    expect(
      privilegeCreep({
        atoms: cashier,
        templateCode: 'BILLING_CASHIER',
        grantsSinceCertification: 1,
      }).flagged,
    ).toBe(false);
  });

  it('ambas razones a la vez, en orden fijo', () => {
    const r = privilegeCreep({
      atoms: [...cashier, ...MARIO_EXTRA],
      templateCode: 'BILLING_CASHIER',
      grantsSinceCertification: 3,
    });
    expect(r.reasons).toEqual(['DRIFT', 'UNREVIEWED_GRANTS']);
  });

  it('sin línea base conocida (plantilla propia) no hay deriva, pero sí vale lo no revisado; baselineScore la reemplaza', () => {
    const r = privilegeCreep({ atoms: cashier, templateCode: 'PROPIA' });
    expect(r).toMatchObject({
      baseline: null,
      drift: null,
      flaggedByDrift: false,
      flagged: false,
    });
    expect(
      privilegeCreep({
        atoms: cashier,
        templateCode: 'PROPIA',
        baselineScore: 0,
      }).flaggedByDrift,
    ).toBe(true);
  });

  it('la deriva puede ser negativa (menos que el paquete) y no marca', () => {
    const r = privilegeCreep({ atoms: [], templateCode: 'SECRETARY' });
    expect(r.drift).toBe(-35);
    expect(r.flagged).toBe(false);
  });
});

describe('countGrantsSinceCertification', () => {
  const g = (
    createdAt: Date,
    over: { reviewed?: boolean; effect?: 'ALLOW' | 'DENY' } = {},
  ) => ({ createdAt, ...over });
  it('cuenta las creadas después de la última certificación y sin revisión', () => {
    expect(
      countGrantsSinceCertification({
        grants: [
          g(day(-100)),
          g(day(-5)),
          g(day(-2)),
          g(day(-1), { reviewed: true }),
          g(day(-3), { effect: 'DENY' }),
        ],
        lastCertifiedAt: day(-10),
        engagementCreatedAt: day(-200),
      }),
    ).toBe(2);
  });
  it('sin certificación previa, se cuenta desde que nació el vínculo (lo inicial no cuenta)', () => {
    expect(
      countGrantsSinceCertification({
        grants: [g(day(-200)), g(day(-50)), g(day(-40))],
        lastCertifiedAt: null,
        engagementCreatedAt: day(-200),
      }),
    ).toBe(2);
  });
});

describe('privilegeDelta · antes y después de un cambio (mover, §6.1)', () => {
  it('L-04: +15 puntos y átomos ALTA nuevos', () => {
    const d = privilegeDelta(
      ['agenda.appointment.view'],
      [
        'agenda.appointment.view',
        'agenda.appointment.view.patient_document',
        'patients.profile.view.document_full',
        'patients.clinical.request_temporary_access',
      ],
    );
    expect(d.delta).toBe(d.after - d.before);
    expect(d.newAtoms).toHaveLength(3);
    expect(d.newHighAtoms.length).toBeGreaterThan(0);
  });
  it('L-04 (variante): billing.invoice.view y patients.coverage.view suman 4 y no traen ALTA', () => {
    const d = privilegeDelta(
      [],
      ['billing.invoice.view', 'patients.coverage.view'],
    );
    expect(d.delta).toBe(4);
    expect(d.newHighAtoms).toEqual([]);
  });
  it('quitar átomos baja el puntaje', () => {
    const d = privilegeDelta(['billing.payment.collect'], []);
    expect(d.delta).toBe(-5);
    expect(d.newAtoms).toEqual([]);
  });
});
