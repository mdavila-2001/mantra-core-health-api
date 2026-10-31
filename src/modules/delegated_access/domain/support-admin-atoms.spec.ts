import {
  isUnevaluatedConditionAtom,
  isGovernanceAtom,
  liveAdminAtoms,
  type AdminGrantInput,
} from './support-admin-atoms';

const ECO = { targetKind: 'SERVICE', healthcareServiceId: 'eco' } as const;
const CARDIO = {
  targetKind: 'SERVICE',
  healthcareServiceId: 'cardio',
} as const;
const ALL = { targetKind: 'ALL' } as const;

const grant = (
  ref: string,
  atoms: string[],
  over: Partial<AdminGrantInput<string>> = {},
): AdminGrantInput<string> => ({
  ref,
  target: ECO,
  atoms,
  effect: 'ALLOW',
  live: true,
  ...over,
});

describe('liveAdminAtoms (SEG A-A5: una sola función para quien administra)', () => {
  const base = { engagementLive: true } as const;

  it('un vínculo no vivo (suspendido, recertificación vencida, membresía terminada) no administra ni lee', () => {
    expect(
      liveAdminAtoms({
        engagementLive: false,
        grants: [grant('a', ['team.members.view'])],
      }),
    ).toEqual([]);
  });

  it('solo cuentan las concesiones ALLOW vivas', () => {
    const out = liveAdminAtoms({
      ...base,
      grants: [
        grant('vivo', ['team.members.view']),
        grant('vencido', ['team.grants.assign'], { live: false }),
        grant('deny', ['team.grants.revoke'], { effect: 'DENY' }),
      ],
    });
    expect(out).toEqual([{ ref: 'vivo', atoms: ['team.members.view'] }]);
  });

  it('una prohibición DENY explícita apaga el átomo en el objetivo que se cruza (y solo ahí)', () => {
    const grants = [
      grant('assign', ['team.grants.assign', 'team.members.view']),
      grant('deny', ['team.grants.assign'], { effect: 'DENY', target: ALL }),
    ];
    expect(liveAdminAtoms({ ...base, grants })).toEqual([
      { ref: 'assign', atoms: ['team.members.view'] },
    ]);
    // Una prohibición sobre otro servicio no toca a este.
    const other = [
      grant('assign', ['team.grants.assign']),
      grant('deny', ['team.grants.assign'], {
        effect: 'DENY',
        target: CARDIO,
      }),
    ];
    expect(liveAdminAtoms({ ...base, grants: other })).toEqual([
      { ref: 'assign', atoms: ['team.grants.assign'] },
    ]);
    // Una prohibición vencida no cuenta.
    const expired = [
      grant('assign', ['team.grants.assign']),
      grant('deny', ['team.grants.assign'], {
        effect: 'DENY',
        target: ALL,
        live: false,
      }),
    ];
    expect(liveAdminAtoms({ ...base, grants: expired })).toHaveLength(1);
  });

  it('una regla L1 DENY_PERMISSION (de la plantilla o de todas) quita el átomo, con patrón', () => {
    const grants = [grant('a', ['team.grants.assign', 'team.members.view'])];
    expect(
      liveAdminAtoms({
        ...base,
        grants,
        denyRules: [{ permissionPattern: 'team.grants.*' }],
      }),
    ).toEqual([{ ref: 'a', atoms: ['team.members.view'] }]);
    expect(
      liveAdminAtoms({
        ...base,
        templateCode: 'ORG_MANAGEMENT',
        grants,
        denyRules: [
          { roleTemplateCode: 'SECRETARY', permissionPattern: 'team.*' },
        ],
      }),
    ).toEqual([
      { ref: 'a', atoms: ['team.grants.assign', 'team.members.view'] },
    ]);
    expect(
      liveAdminAtoms({
        ...base,
        templateCode: 'ORG_MANAGEMENT',
        grants,
        denyRules: [
          { roleTemplateCode: 'ORG_MANAGEMENT', permissionPattern: 'team.*' },
        ],
      }),
    ).toEqual([]);
  });

  it('isGovernanceAtom: equipo, auditoría y reportes', () => {
    for (const a of [
      'team.members.view',
      'audit.decisions.explain',
      'audit.reports.governance.view',
    ]) {
      expect(isGovernanceAtom(a)).toBe(true);
    }
    for (const a of [
      'agenda.appointment.view',
      'billing.receipt.void',
      'audit.activity.view_org',
      'reports.agenda.export',
    ]) {
      expect(isGovernanceAtom(a)).toBe(false);
    }
  });
});

describe('isUnevaluatedConditionAtom (N-8)', () => {
  it('administración + actividad + reportes: ninguna ruta evalúa su condición', () => {
    for (const a of [
      'team.members.view',
      'audit.decisions.explain',
      'audit.reports.governance.view',
      'audit.activity.view_org',
      'audit.activity.export',
      'reports.agenda.export',
      'reports.billing.view',
    ]) {
      expect(isUnevaluatedConditionAtom(a)).toBe(true);
    }
    for (const a of [
      'agenda.appointment.view',
      'billing.receipt.void',
      'patients.search.exact',
      'messages.inbox.view',
    ]) {
      expect(isUnevaluatedConditionAtom(a)).toBe(false);
    }
  });
});
