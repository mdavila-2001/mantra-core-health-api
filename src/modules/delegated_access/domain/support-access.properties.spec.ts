import { evaluateSupportAccess } from './support-access.evaluation';
import { evaluateSupportAccessV2 } from './support-access.decide';
import {
  NOW,
  at,
  baseFacts,
  engagement,
  grant,
  patientFacts,
  PATIENT,
  usageOf,
} from './support-access.decide.testing';
import type {
  AtomGrant,
  GovernanceRuleFacts,
  SupportAccessContext,
  SupportAccessFacts,
} from './support-access-context';
import type {
  EngagementFacts,
  SupportAccessQuery,
  SupportGrantFacts,
} from './support-access.types';
import type { SupportCondition } from './support-conditions';

/** Generador pseudoaleatorio con semilla (mulberry32): las pruebas son reproducibles. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
type Rand = () => number;
const pick = <T>(r: Rand, items: readonly T[]): T =>
  items[Math.floor(r() * items.length)];
const chance = (r: Rand, p: number): boolean => r() < p;
function shuffle<T>(r: Rand, items: readonly T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(r() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const DOCTORS = ['dr-a', 'dr-b', 'dr-c'];
const ATOMS = [
  'agenda.appointment.view',
  'agenda.appointment.view.reason',
  'agenda.appointment.create',
  'agenda.appointment.cancel',
  'agenda.appointment.reschedule',
  'patients.search.exact',
  'patients.profile.edit_contact',
  'messages.conversation.reply_on_behalf',
  'billing.payment.collect',
  'billing.receipt.void',
  'agenda.hours.edit',
];
const LEGACY = [
  'schedule.view',
  'schedule.create',
  'schedule.cancel',
  'schedule.reschedule',
  'billing.collect',
  'messages.reply_on_behalf',
  'schedule.edit_hours',
];
const PATIENTS = Object.values(PATIENT);

function randomCondition(r: Rand): SupportCondition | undefined {
  if (chance(r, 0.35)) return undefined;
  const c: Record<string, unknown> = { schemaVersion: 1 };
  if (chance(r, 0.3)) {
    c.time = {
      timeZone: 'America/La_Paz',
      windows: [
        {
          days: pick(r, [[1, 2, 3, 4, 5], [2], [6], [0, 6]]),
          from: pick(r, ['07:00', '08:00', '10:00']),
          to: pick(r, ['09:00', '12:00', '18:00']),
        },
      ],
    };
  }
  if (chance(r, 0.25)) c.network = { require: 'ORG_RULES' };
  if (chance(r, 0.15)) c.device = { knownOnly: true };
  if (chance(r, 0.2))
    c.patients = pick(r, [
      { exclude: { flags: ['VIP', 'CONFIDENTIAL'] } },
      { age: { min: 18 } },
      { isMinor: false },
      {
        scope: 'WITH_APPOINTMENT_WINDOW',
        appointmentWindow: { daysBefore: 0, daysAfter: 3 },
      },
    ]);
  if (chance(r, 0.2))
    c.appointment = pick(r, [
      {
        leadTime: {
          minHours: 24,
          onViolation: pick(r, ['DENY', 'REQUIRE_APPROVAL']),
        },
      },
      { window: { daysBefore: 1, daysAfter: 14 } },
    ]);
  if (chance(r, 0.15))
    c.limits = [
      {
        metric: 'ACTIONS',
        per: 'DAY',
        max: pick(r, [3, 20]),
        onExceed: pick(r, ['DENY', 'REQUIRE_APPROVAL']),
      },
    ];
  if (chance(r, 0.1)) c.presence = { doctor: 'ONLINE' };
  if (chance(r, 0.1)) c.session = { maxSessionMinutes: 60 };
  if (chance(r, 0.1)) c.obligations = { requireReason: { minLength: 12 } };
  return c as unknown as SupportCondition;
}

function randomGrant(
  r: Rand,
  i: number,
  forceEffect?: 'ALLOW' | 'DENY',
): SupportGrantFacts {
  const effect = forceEffect ?? (chance(r, 0.2) ? 'DENY' : 'ALLOW');
  const atoms = shuffle(r, ATOMS).slice(0, 1 + Math.floor(r() * 4));
  const legacy = chance(r, 0.4)
    ? shuffle(r, LEGACY).slice(0, 1 + Math.floor(r() * 2))
    : [];
  const atomGrants: AtomGrant[] = atoms
    .filter(() => chance(r, 0.4))
    .map((atom) => ({
      atom: atom as AtomGrant['atom'],
      origin: 'ATOM' as const,
      condition: randomCondition(r),
    }));
  const targetKind = pick(r, [
    'PRACTITIONER',
    'ALL',
    'ALL_PRACTITIONERS',
  ] as const);
  return grant(`g-${i}-${Math.floor(r() * 1e6)}`, {
    targetKind,
    practitionerProfileId:
      targetKind === 'PRACTITIONER' ? pick(r, DOCTORS) : undefined,
    effect,
    actions: [...atoms, ...legacy] as never,
    condition: randomCondition(r),
    atomGrants,
    unreadable: chance(r, 0.03) ? true : undefined,
  });
}

function randomEngagements(r: Rand): EngagementFacts[] {
  const count = 1 + Math.floor(r() * 2);
  return Array.from({ length: count }, (_, e) =>
    engagement(
      `eng-${e}`,
      Object.fromEntries(
        DOCTORS.filter(() => chance(r, 0.85)).map((d) => [d, chance(r, 0.7)]),
      ),
      Array.from({ length: 1 + Math.floor(r() * 5) }, (_, i) =>
        randomGrant(r, i),
      ),
      {
        templateCode: pick(r, ['SECRETARY', 'FRONT_DESK', 'CALL_CENTER']),
        active: chance(r, 0.95),
      },
    ),
  );
}

function randomFacts(r: Rand): SupportAccessFacts | undefined {
  if (chance(r, 0.1)) return undefined;
  return baseFacts({
    network: chance(r, 0.8)
      ? { satisfiesOrgRules: chance(r, 0.6), orgHasAllowRules: chance(r, 0.9) }
      : undefined,
    device: chance(r, 0.8) ? { trusted: chance(r, 0.6) } : undefined,
    doctorOnline: chance(r, 0.7) ? chance(r, 0.5) : undefined,
    session: chance(r, 0.8)
      ? { startedAt: new Date(NOW.getTime() - Math.floor(r() * 5) * 3_600_000) }
      : undefined,
    patient: chance(r, 0.8)
      ? patientFacts(pick(r, PATIENTS), { bookingsInWindow: chance(r, 0.5) })
      : undefined,
    usage: chance(r, 0.8) ? usageOf(Math.floor(r() * 25)) : undefined,
    stepUpAgeMinutes: pick(r, [null, 2, 30, undefined]),
  });
}

function randomQuery(r: Rand): SupportAccessQuery {
  const context: SupportAccessContext = {
    patientProfileId: chance(r, 0.8) ? pick(r, PATIENTS) : undefined,
    appointmentStartAt: chance(r, 0.8)
      ? new Date(NOW.getTime() + (Math.floor(r() * 80) - 5) * 3_600_000)
      : undefined,
    channels: chance(r, 0.6) ? ['CHAT'] : undefined,
    amount: chance(r, 0.4)
      ? { currency: 'BOB', minorUnits: Math.floor(r() * 400_000) }
      : undefined,
    proof: chance(r, 0.3)
      ? {
          reasonText: 'Un motivo suficientemente largo',
          approvalId: chance(r, 0.5) ? 'ap' : undefined,
        }
      : undefined,
  };
  return {
    action: pick(r, [...ATOMS, ...LEGACY]) as never,
    practitionerProfileId: pick(r, DOCTORS),
    context,
  };
}

function randomNow(r: Rand): Date {
  return at(
    pick(r, [
      '2026-11-02T10:00:00',
      '2026-11-03T10:30:00',
      '2026-11-03T19:10:00',
      '2026-11-07T10:00:00',
    ]),
  );
}

interface Scenario {
  readonly engagements: EngagementFacts[];
  readonly query: SupportAccessQuery;
  readonly now: Date;
  readonly facts?: SupportAccessFacts;
  readonly rules: GovernanceRuleFacts[];
}
function scenario(seed: number): Scenario {
  const r = rng(seed);
  return {
    engagements: randomEngagements(r),
    query: randomQuery(r),
    now: randomNow(r),
    facts: randomFacts(r),
    rules: chance(r, 0.15)
      ? [
          {
            id: 'rule-net',
            kind: 'REQUIRE_CONDITION',
            permissionPattern: 'billing.*',
            condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
          },
        ]
      : [],
  };
}
const run = (
  s: Scenario,
  q: SupportAccessQuery = s.query,
  engagements: readonly EngagementFacts[] = s.engagements,
) =>
  evaluateSupportAccessV2(engagements, q, s.now, {
    facts: s.facts,
    rules: s.rules,
  });

const SEEDS = Array.from({ length: 300 }, (_, i) => 1000 + i);

function reorder(r: Rand, e: EngagementFacts): EngagementFacts {
  return {
    ...e,
    acceptances: shuffle(r, e.acceptances),
    grants: shuffle(r, e.grants).map((g) => ({
      ...g,
      actions: shuffle(r, g.actions),
      atomGrants: g.atomGrants ? shuffle(r, g.atomGrants) : undefined,
    })),
  };
}

describe('AC-3 · propiedad: barajar el orden no cambia la decisión', () => {
  it('300 escenarios: engagements, concesiones, átomos y aceptaciones en otro orden → misma decisión, traza y consumo', () => {
    let permits = 0;
    let challenges = 0;
    for (const seed of SEEDS) {
      const s = scenario(seed);
      const base = run(s);
      for (let k = 0; k < 3; k += 1) {
        const r = rng(seed * 31 + k);
        const shuffled = shuffle(r, s.engagements).map((e) => reorder(r, e));
        const again = run(s, s.query, shuffled);
        expect({ seed, decision: again.decision }).toEqual({
          seed,
          decision: base.decision,
        });
        expect({ seed, candidates: again.trace.candidates }).toEqual({
          seed,
          candidates: base.trace.candidates,
        });
        expect({ seed, consume: again.usage.consume }).toEqual({
          seed,
          consume: base.usage.consume,
        });
      }
      if (base.decision.effect === 'PERMIT') permits += 1;
      if (base.decision.effect === 'CHALLENGE') challenges += 1;
    }
    // el generador cubre de verdad las tres salidas (no es una prueba vacía)
    expect(permits).toBeGreaterThan(10);
    expect(challenges).toBeGreaterThan(3);
  });

  it('la decisión depende solo de los datos: la misma entrada da siempre la misma salida', () => {
    for (const seed of SEEDS.slice(0, 50)) {
      const s = scenario(seed);
      expect(run(s).decision).toEqual(run(s).decision);
    }
  });
});

describe('AC-4 · propiedad: ningún ALLOW vence a L0, a DENY_PERMISSION ni a una concesión DENY', () => {
  it('L0: un átomo no asignable nunca da PERMIT, pase lo que pase con las concesiones', () => {
    for (const seed of SEEDS) {
      const s = scenario(seed);
      const r = rng(seed);
      const greedy = s.engagements.map((e) => ({
        ...e,
        grants: [
          ...e.grants,
          grant(`todo-${seed}`, {
            targetKind: 'ALL',
            actions: [
              'team.guardrails.manage',
              'team.sod.manage',
              'team.sessionpolicy.manage',
              'team.templates.manage',
            ] as never,
          }),
        ],
      }));
      const q = {
        ...s.query,
        action: pick(r, [
          'team.guardrails.manage',
          'team.sod.manage',
          'team.sessionpolicy.manage',
          'team.templates.manage',
        ]) as never,
      };
      const out = run(s, q, greedy);
      expect(out.decision.effect).not.toBe('PERMIT');
      expect(out.decision.allowed).toBe(false);
    }
  });

  it('DENY_PERMISSION: con una regla que alcanza al átomo nunca hay PERMIT', () => {
    const EARLY = [
      'NO_ENGAGEMENT',
      'ENGAGEMENT_INACTIVE',
      'DOCTOR_NOT_ACCEPTED',
      'REPLY_NOT_ALLOWED_BY_DOCTOR',
      'ONBOARDING_INCOMPLETE',
      'NOT_DELEGABLE',
    ];
    let denied = 0;
    for (const seed of SEEDS) {
      const s = scenario(seed);
      const atom = ATOMS[seed % ATOMS.length];
      const rules: GovernanceRuleFacts[] = [
        ...s.rules,
        {
          id: 'deny-atom',
          kind: 'DENY_PERMISSION',
          permissionPattern: seed % 2 === 0 ? atom : `${atom.split('.')[0]}.*`,
          message: 'No',
        },
      ];
      const out = evaluateSupportAccessV2(
        s.engagements,
        { ...s.query, action: atom as never },
        s.now,
        { facts: s.facts, rules },
      );
      expect(out.decision.effect).not.toBe('PERMIT');
      expect(out.decision.allowed).toBe(false);
      if (!EARLY.includes(out.decision.reason)) {
        expect(out.decision.reason).toBe('ORG_RULE_DENY');
        denied += 1;
      }
    }
    expect(denied).toBeGreaterThan(50);
  });

  it('DENY_PERMISSION alcanza también a quien pregunta con el código antiguo', () => {
    const moduleOf = (legacy: string): string =>
      legacy.startsWith('schedule.')
        ? 'agenda'
        : legacy.startsWith('billing.')
          ? 'billing'
          : 'messages';
    for (const seed of SEEDS) {
      const s = scenario(seed);
      const legacy = LEGACY[seed % LEGACY.length];
      const out = evaluateSupportAccessV2(
        s.engagements,
        { ...s.query, action: legacy as never },
        s.now,
        {
          facts: s.facts,
          rules: [
            {
              id: 'deny-module',
              kind: 'DENY_PERMISSION',
              permissionPattern: `${moduleOf(legacy)}.*`,
            },
          ],
        },
      );
      expect(out.decision.allowed).toBe(false);
      expect(out.decision.effect).not.toBe('PERMIT');
    }
  });

  it('DENY explícita sin condición: ninguna cantidad de ALLOW la supera', () => {
    for (const seed of SEEDS) {
      const s = scenario(seed);
      const r = rng(seed + 7);
      const atom = pick(r, ATOMS);
      const doctor = s.query.practitionerProfileId as string;
      const denyRow = grant('la-denegacion', {
        targetKind: 'ALL',
        effect: 'DENY',
        actions: [atom] as never,
      });
      const allows = Array.from({ length: 6 }, (_, i) =>
        grant(`allow-${i}`, {
          targetKind: 'ALL',
          actions: [atom, ...LEGACY] as never,
        }),
      );
      const engagements = [
        engagement(
          'e-x',
          Object.fromEntries(DOCTORS.map((d) => [d, true])),
          shuffle(r, [denyRow, ...allows]),
        ),
      ];
      const q = {
        ...s.query,
        action: atom as never,
        practitionerProfileId: doctor,
      };
      const out = evaluateSupportAccessV2(engagements, q, s.now, {
        facts: s.facts,
        rules: s.rules,
      });
      expect(['DENY']).toContain(out.decision.effect);
      expect(out.decision.reason).toBe('EXPLICIT_DENY');
      expect(out.decision.grantId).toBe('la-denegacion');
    }
  });

  it('monotonía: sumar ALLOW a un escenario que ya niega por una capa superior no lo abre', () => {
    for (const seed of SEEDS) {
      const s = scenario(seed);
      const base = run(s);
      if (
        !['NOT_DELEGABLE', 'ORG_RULE_DENY', 'EXPLICIT_DENY'].includes(
          base.decision.reason,
        )
      )
        continue;
      const more = s.engagements.map((e) => ({
        ...e,
        grants: [
          ...e.grants,
          grant(`extra-${seed}`, {
            targetKind: 'ALL',
            actions: [...ATOMS, ...LEGACY] as never,
          }),
        ],
      }));
      const out = run(s, s.query, more);
      expect(out.decision.allowed).toBe(false);
      expect(out.decision.reason).toBe(base.decision.reason);
    }
  });

  it('I ⇒ nunca PERMIT: sin ningún hecho cargado, toda condición que aplica queda indeterminada y cierra', () => {
    const universal: Record<string, unknown>[] = [
      { network: { require: 'ORG_RULES' } },
      { device: { knownOnly: true } },
      { session: { maxSessionMinutes: 120 } },
      { limits: [{ metric: 'ACTIONS', per: 'DAY', max: 5, onExceed: 'DENY' }] },
      {
        time: {
          timeZone: 'Marte/Olympus',
          windows: [{ days: [2], from: '08:00', to: '18:00' }],
        },
      },
    ];
    const table: [string, Record<string, unknown>][] = [
      ...[
        'agenda.appointment.cancel',
        'billing.payment.collect',
        'messages.conversation.reply_on_behalf',
      ].flatMap((atom) =>
        universal.map((c): [string, Record<string, unknown>] => [atom, c]),
      ),
      ['agenda.appointment.cancel', { presence: { doctor: 'ONLINE' } }],
      [
        'agenda.appointment.cancel',
        { patients: { exclude: { minors: true } } },
      ],
      [
        'agenda.appointment.cancel',
        { appointment: { window: { daysBefore: 0, daysAfter: 5 } } },
      ],
      [
        'agenda.appointment.cancel',
        {
          appointment: {
            leadTime: { minHours: 24, onViolation: 'REQUIRE_APPROVAL' },
          },
        },
      ],
      [
        'billing.payment.collect',
        {
          amount: {
            currency: 'BOB',
            perTransactionMax: 500,
            onExceed: 'REQUIRE_APPROVAL',
          },
        },
      ],
      [
        'messages.conversation.reply_on_behalf',
        { channels: { allow: ['CHAT'] } },
      ],
      [
        'messages.conversation.reply_on_behalf',
        { presence: { doctor: 'ONLINE' } },
      ],
    ];
    expect(table.length).toBeGreaterThan(20);
    for (const [atom, extra] of table) {
      const cond = {
        schemaVersion: 1,
        ...extra,
      } as unknown as SupportCondition;
      const e = engagement('e', { 'dr-a': true }, [
        grant('g', {
          targetKind: 'ALL',
          actions: [atom] as never,
          condition: cond,
        }),
      ]);
      // con motivo y aprobación en mano: lo único que falta es el dato indeterminado
      const q: SupportAccessQuery = {
        action: atom as never,
        practitionerProfileId: 'dr-a',
        context: {
          proof: {
            reasonText: 'Un motivo suficientemente largo',
            approvalId: 'ap',
          },
        },
      };
      const out = evaluateSupportAccessV2([e], q, NOW, {});
      expect({
        atom,
        extra,
        effect: out.decision.effect,
        allowed: out.decision.allowed,
      }).toMatchObject({ allowed: false });
      expect(out.decision.effect).not.toBe('PERMIT');
      expect((out.decision.unmet ?? []).length).toBeGreaterThan(0);
    }
  });

  it('una fila con schemaVersion mayor nunca se aplica: no cambia el resultado de las demás', () => {
    for (const seed of SEEDS) {
      const s = scenario(seed);
      const base = run(s);
      const future = s.engagements.map((e) => ({
        ...e,
        grants: [
          ...e.grants,
          grant('futura', {
            targetKind: 'ALL',
            actions: [s.query.action] as never,
            condition: { schemaVersion: 2 } as never,
          }),
        ],
      }));
      const out = run(s, s.query, future);
      expect(out.decision.grantId).not.toBe('futura');
      if (
        ['NO_COVERING_GRANT', 'ACTION_NOT_GRANTED'].includes(
          base.decision.reason as string,
        )
      ) {
        expect(['CONDITION_UNREADABLE', base.decision.reason]).toContain(
          out.decision.reason,
        );
      } else {
        expect(out.decision).toEqual(base.decision);
      }
    }
  });
});

describe('AC-5 · explicar ≡ decidir (sobre 200 escenarios generados)', () => {
  it('el envoltorio evaluateSupportAccess y el motor V2 coinciden en allowed, reason y grantId', () => {
    for (const seed of SEEDS.slice(0, 200)) {
      const s = scenario(seed);
      const v2 = run(s);
      const q = { ...s.query };
      const legacy = evaluateSupportAccess(s.engagements, q, s.now, {
        facts: s.facts,
        rules: s.rules,
      });
      expect({ seed, allowed: legacy.allowed }).toEqual({
        seed,
        allowed: v2.decision.effect === 'PERMIT',
      });
      expect(legacy.reason).toBe(v2.decision.reason);
      expect(legacy.grantId).toBe(v2.decision.grantId);
    }
  });

  it('explicar (peek) y decidir dan el mismo efecto, motivo y concesión; peek no consume', () => {
    for (const seed of SEEDS.slice(0, 200)) {
      const s = scenario(seed);
      const decided = run(s);
      const explained = run(s, {
        ...s.query,
        context: { ...s.query.context, peek: true },
      });
      expect({ seed, effect: explained.decision.effect }).toEqual({
        seed,
        effect: decided.decision.effect,
      });
      expect(explained.decision.reason).toBe(decided.decision.reason);
      expect(explained.decision.grantId).toBe(decided.decision.grantId);
      expect(explained.usage.consume).toEqual([]);
    }
  });

  it('allowed es true solo si el efecto es PERMIT (CHALLENGE y DENY nunca abren)', () => {
    for (const seed of SEEDS) {
      const d = run(scenario(seed)).decision;
      expect(d.allowed).toBe(d.effect === 'PERMIT');
      if (d.effect === 'CHALLENGE') expect(d.challenge).toBeDefined();
      if (d.effect !== 'PERMIT')
        expect(d.visibleFields === undefined || d.effect === 'CHALLENGE').toBe(
          true,
        );
    }
  });
});
