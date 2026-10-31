import { validateCondition } from './support-conditions.validate';

const codes = (condition: unknown, grantAtoms: string[], atom?: string) =>
  validateCondition(condition, {
    grantAtoms,
    ...(atom ? { atom } : {}),
  }).map((e) => e.code);

describe('SEG A-A5: las condiciones no existen en átomos de administración', () => {
  const time = {
    schemaVersion: 1,
    time: { windows: [{ days: [1], from: '08:00', to: '12:00' }] },
  };

  it('time, network, device, session y limits sobre team.*, audit.* o reports.* se rechazan al guardar', () => {
    for (const atom of [
      'team.grants.assign',
      'team.members.view',
      'audit.decisions.explain',
      'audit.reports.governance.view',
    ]) {
      for (const condition of [
        time,
        { schemaVersion: 1, network: { require: 'ORG_RULES' } },
        { schemaVersion: 1, device: { knownOnly: true } },
        { schemaVersion: 1, session: { maxAgeMinutes: 10 } },
        {
          schemaVersion: 1,
          limits: [{ metric: 'ACTIONS', per: 'DAY', max: 5 }],
        },
      ]) {
        expect(codes(condition, [atom])).toContain(
          'CONDITION_NOT_APPLICABLE_TO_ATOM',
        );
        expect(codes(condition, [atom], atom)).toContain(
          'CONDITION_NOT_APPLICABLE_TO_ATOM',
        );
      }
    }
  });

  it('un permiso MIXTO (agenda + team) con una condición tampoco: la parte de equipo la ignoraría en silencio', () => {
    expect(
      codes(time, ['agenda.appointment.view', 'team.members.view']),
    ).toContain('CONDITION_NOT_APPLICABLE_TO_ATOM');
  });

  it('delegationCeiling sí vale sobre team.grants.assign, y las condiciones siguen valiendo en agenda', () => {
    const ceiling = {
      schemaVersion: 1,
      delegationCeiling: { allowAtoms: ['agenda.*'], maxValidDays: 90 },
    };
    expect(
      codes(ceiling, ['team.grants.assign'], 'team.grants.assign'),
    ).toEqual([]);
    expect(codes(time, ['agenda.appointment.view'])).toEqual([]);
  });
});

describe('N-8: audit.activity.* y reports.* tampoco se condicionan (ninguna ruta las evalúa)', () => {
  const conditions = [
    {
      schemaVersion: 1,
      time: { windows: [{ days: [1], from: '08:00', to: '12:00' }] },
    },
    { schemaVersion: 1, network: { require: 'ORG_RULES' } },
    {
      schemaVersion: 1,
      limits: [
        {
          metric: 'DISTINCT_PATIENTS',
          per: 'DAY',
          max: 5,
          onExceed: 'DENY',
        },
      ],
    },
  ];

  it('se rechazan al guardar con CONDITION_NOT_APPLICABLE_TO_ATOM, como team.*', () => {
    for (const atom of [
      'audit.activity.view_team',
      'audit.activity.view_org',
      'audit.activity.export',
      'reports.agenda.view',
      'reports.agenda.export',
      'reports.billing.view',
      'reports.billing.export',
    ]) {
      for (const condition of conditions) {
        expect(codes(condition, [atom])).toContain(
          'CONDITION_NOT_APPLICABLE_TO_ATOM',
        );
        expect(codes(condition, [atom], atom)).toContain(
          'CONDITION_NOT_APPLICABLE_TO_ATOM',
        );
      }
    }
  });

  it('un permiso mixto (agenda + reportes) con condición tampoco: la parte de reportes la ignoraría en silencio', () => {
    expect(
      codes(conditions[0], ['agenda.appointment.view', 'reports.agenda.view']),
    ).toContain('CONDITION_NOT_APPLICABLE_TO_ATOM');
  });

  it('sin condición, o solo con schemaVersion, siguen guardándose; la agenda sigue condicionándose', () => {
    expect(codes({ schemaVersion: 1 }, ['reports.agenda.export'])).toEqual([]);
    expect(codes(conditions[0], ['agenda.appointment.view'])).toEqual([]);
  });
});
