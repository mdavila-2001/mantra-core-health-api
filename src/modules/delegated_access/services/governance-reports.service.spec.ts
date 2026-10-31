import { GovernanceReportsService } from './governance-reports.service';
import { GovernanceAccessService } from './governance-access.service';
import { GovernanceMatrixService } from './governance-matrix.service';
import {
  PERMISSION_ATOMS,
  SUPPORT_TEMPLATE_DEFAULTS_V2,
  type SodFinding,
} from '../domain';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  DAY,
  NOW,
  engagement,
  fakeEm,
  grant,
  ids,
  mockFn,
  securityAdmin,
  staff,
  worldOf,
} from './governance-world.testing';

const agendaAtoms = PERMISSION_ATOMS.filter(
  (a) => a.categoryCode === 'SUPPORT_AGENDA',
).map((a) => a.code);

const perezGrant = (id: string, actions: string[], extra: object = {}) =>
  grant({
    grantId: id,
    targetKind: 'PRACTITIONER',
    healthcareServiceId: undefined,
    practitionerProfileId: ids.perez,
    practitionerRoleAssignmentId: ids.praPerez,
    actions,
    ...extra,
  });

function build(
  engagements: any[],
  opts: {
    anomalies?: any[];
    counts?: Partial<Record<string, number>>;
    ownerless?: any[];
  } = {},
) {
  const em = fakeEm();
  const world = worldOf(engagements);
  const loader = { load: mockFn().mockResolvedValue(world) };
  const queries: any = {
    countBreakGlassUnreviewed: mockFn().mockResolvedValue(
      opts.counts?.breakGlass ?? 0,
    ),
    countFourEyesPendingBefore: mockFn().mockResolvedValue(
      opts.counts?.fourEyes ?? 0,
    ),
    fourEyesApprovedNotExecuted: mockFn().mockResolvedValue([]),
    temporaryClinicalAccess: mockFn().mockResolvedValue([]),
    lastPermitByUser: mockFn().mockResolvedValue(new Map()),
    lastLoginByUser: mockFn().mockResolvedValue(new Map()),
  };
  const anomalies = {
    findByTenant: mockFn().mockResolvedValue(opts.anomalies ?? []),
  };
  const reviews = {
    findCampaigns: mockFn().mockResolvedValue([]),
    findItemsByCampaign: mockFn().mockResolvedValue([]),
  };
  const access = { findRoleAssignments: mockFn(), findCareSpaces: mockFn() };
  access.findRoleAssignments.mockResolvedValue(
    new Map([
      [
        ids.praPerez,
        {
          id: ids.praPerez,
          practitionerProfileId: ids.perez,
          tenantId: ids.tenant,
        },
      ],
    ]),
  );
  access.findCareSpaces.mockResolvedValue(new Map());
  const settings = {
    read: mockFn().mockResolvedValue({
      unusedDays: 60,
      inactivityDays: 45,
      autoSuspendInactiveDays: null,
      reviewCadenceMonths: null,
      creepThreshold: 15,
      onboardingRequired: true,
    }),
  };
  const activity = {
    userNames: mockFn().mockResolvedValue(new Map([[ids.ana, 'Ana']])),
  };
  const zone = { timeZoneOf: mockFn().mockResolvedValue('America/La_Paz') };
  const scope = { resolveTenant: mockFn().mockReturnValue(ids.tenant) };
  const lifecycle = {
    listOwnerless: mockFn().mockResolvedValue(opts.ownerless ?? []),
  };
  const service = new GovernanceReportsService(
    em,
    loader as any,
    new GovernanceAccessService(loader as any),
    new GovernanceMatrixService(access as any, activity as any, zone as any),
    queries,
    anomalies as any,
    reviews as any,
    settings as any,
    activity as any,
    scope as any,
    lifecycle as any,
  );
  return { service, em, loader, queries, lifecycle };
}

describe('GovernanceReportsService.accessMatrix: por persona', () => {
  const people = () => [
    engagement({
      engagementId: 'e-ana',
      subjectUserId: ids.ana,
      grants: [perezGrant('g1', [...agendaAtoms])],
    }),
    engagement({
      engagementId: 'e-sofia',
      subjectUserId: ids.sofia,
      grants: [
        perezGrant('g2', ['agenda.appointment.view'], {
          condition: {
            schemaVersion: 1,
            time: {
              windows: [{ days: [1, 2, 3, 4, 5], from: '07:30', to: '18:30' }],
            },
          },
        }),
      ],
    }),
    engagement({
      engagementId: 'e-lucia',
      subjectUserId: ids.mario,
      grants: [
        perezGrant('g3', [
          'agenda.appointment.view',
          'agenda.appointment.create',
        ]),
      ],
    }),
    engagement({
      engagementId: 'e-vacio',
      subjectUserId: ids.marcos,
      grants: [],
    }),
  ];

  it('celda FULL (todo el grupo, sin condiciones), CONDITIONAL, PARTIAL y NONE, con grantIds y resumen', async () => {
    const { service } = build(people());
    const r: any = await service.accessMatrix(securityAdmin(), {
      by: 'person',
      group: 'category',
    });
    const cell = (userId: string) =>
      r.rows.find((x: any) => x.userId === userId).cells.SUPPORT_AGENDA;
    expect(cell(ids.ana)).toMatchObject({ status: 'FULL', grantIds: ['g1'] });
    expect(cell(ids.sofia).status).toBe('CONDITIONAL');
    expect(cell(ids.sofia).conditions[0]).toMatch(/lunes/i);
    expect(cell(ids.mario).status).toBe('PARTIAL');
    expect(cell(ids.marcos).status).toBe('NONE');
    expect(r.columns).toContain('SUPPORT_AGENDA');
  });

  it('por átomo: una columna por átomo del catálogo', async () => {
    const { service } = build(people());
    const r: any = await service.accessMatrix(securityAdmin(), {
      by: 'person',
      group: 'atom',
    });
    expect(r.columns).toContain('agenda.appointment.view');
    expect(
      r.rows.find((x: any) => x.userId === ids.ana).cells[
        'agenda.appointment.view'
      ].status,
    ).toBe('FULL');
  });

  it('una dimensión desconocida es 422 MATRIX_DIMENSION_INVALID; «doctor» sin id también', async () => {
    const { service } = build(people());
    await expect(
      service.accessMatrix(securityAdmin(), { by: 'banana' as any }),
    ).rejects.toMatchObject({
      reason: Reason.MATRIX_DIMENSION_INVALID,
      status: 422,
    });
    await expect(
      service.accessMatrix(securityAdmin(), { by: 'doctor' }),
    ).rejects.toMatchObject({
      reason: Reason.MATRIX_DIMENSION_INVALID,
    });
  });
});

describe('GovernanceReportsService.accessMatrix: «quién puede actuar sobre…» (M-01)', () => {
  const world = () => [
    engagement({
      engagementId: 'e-ana',
      subjectUserId: ids.ana,
      acceptedPractitionerProfileIds: [ids.perez],
      grants: [
        perezGrant('g1', [
          'agenda.appointment.view',
          'agenda.appointment.create',
        ]),
      ],
    }),
    engagement({
      engagementId: 'e-marcos',
      subjectUserId: ids.marcos,
      acceptedPractitionerProfileIds: [],
      grants: [perezGrant('g2', ['agenda.appointment.view'])],
    }),
    engagement({
      engagementId: 'e-mario',
      subjectUserId: ids.mario,
      acceptedPractitionerProfileIds: [ids.perez],
      grants: [
        perezGrant('g3', ['agenda.appointment.view'], {
          condition: {
            schemaVersion: 1,
            time: { windows: [{ days: [0], from: '08:00', to: '12:00' }] },
          },
        }),
      ],
    }),
    engagement({
      engagementId: 'e-rosa',
      subjectUserId: ids.sofia,
      acceptedPractitionerProfileIds: ['otro'],
      grants: [
        grant({
          grantId: 'g4',
          targetKind: 'PRACTITIONER',
          healthcareServiceId: undefined,
          practitionerProfileId: 'otro',
          practitionerRoleAssignmentId: 'pra-otro',
          actions: ['agenda.appointment.view'],
        }),
      ],
    }),
  ];

  it('incluye a quien lo cubre y excluye a quien no; effective:false si el doctor no aceptó o el horario lo bloquea', async () => {
    const { service } = build(world());
    const r: any = await service.accessMatrix(securityAdmin(), {
      by: 'doctor',
      id: ids.praPerez,
    });
    const rows = new Map<string, any>(r.rows.map((x: any) => [x.userId, x]));
    expect(rows.get(ids.ana)).toMatchObject({ effective: true });
    expect(rows.get(ids.marcos)).toMatchObject({
      effective: false,
      reason: 'DOCTOR_NOT_ACCEPTED',
    });
    expect(rows.get(ids.mario)).toMatchObject({
      effective: false,
      reason: 'TIME_WINDOW',
    });
    expect(rows.has(ids.sofia)).toBe(false);
  });

  it('una concesión DENY no cuenta como quien puede actuar', async () => {
    const list = world();
    list[0] = engagement({
      engagementId: 'e-ana',
      subjectUserId: ids.ana,
      acceptedPractitionerProfileIds: [ids.perez],
      grants: [
        perezGrant('g1', ['agenda.appointment.view'], { effect: 'DENY' }),
      ],
    });
    const { service } = build(list);
    const r: any = await service.accessMatrix(securityAdmin(), {
      by: 'doctor',
      id: ids.praPerez,
    });
    expect(r.rows.some((x: any) => x.userId === ids.ana)).toBe(false);
  });

  it('por servicio: cubre quien tiene el servicio o «todos los servicios»', async () => {
    const { service } = build([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        grants: [grant({ grantId: 'a', actions: ['agenda.appointment.view'] })],
      }),
      engagement({
        engagementId: 'e2',
        subjectUserId: ids.marcos,
        grants: [
          grant({
            grantId: 'b',
            targetKind: 'ALL_SERVICES',
            healthcareServiceId: undefined,
            actions: ['agenda.appointment.view'],
          }),
        ],
      }),
      engagement({
        engagementId: 'e3',
        subjectUserId: ids.mario,
        grants: [
          grant({
            grantId: 'c',
            healthcareServiceId: ids.svcCardio,
            actions: ['agenda.appointment.view'],
          }),
        ],
      }),
    ]);
    const r: any = await service.accessMatrix(securityAdmin(), {
      by: 'service',
      id: ids.svcEco,
    });
    expect(r.rows.map((x: any) => x.userId).sort()).toEqual(
      [ids.ana, ids.marcos].sort(),
    );
  });
});

describe('GovernanceReportsService: población de un administrador delegado', () => {
  it('un jefe de servicio ve solo a quien tiene concesiones dentro de su alcance', async () => {
    const sofiaGrant = grant({
      grantId: 'g-sofia',
      actions: [
        'team.grants.assign',
        'audit.reports.governance.view',
        'agenda.appointment.view',
      ],
    });
    const { service } = build([
      engagement({
        engagementId: 'e-sofia',
        subjectUserId: ids.sofia,
        grants: [sofiaGrant],
      }),
      engagement({
        engagementId: 'e-marcos',
        subjectUserId: ids.marcos,
        grants: [
          grant({ grantId: 'g-m', actions: ['agenda.appointment.view'] }),
        ],
      }),
      engagement({
        engagementId: 'e-ana',
        subjectUserId: ids.ana,
        grants: [perezGrant('g-a', ['agenda.appointment.view'])],
      }),
    ]);
    const r: any = await service.accessMatrix(staff(ids.sofia), {
      by: 'person',
      group: 'category',
    });
    expect(r.rows.map((x: any) => x.userId)).toEqual([ids.marcos]);
  });

  it('sin el átomo audit.reports.governance.view: 403 ADMIN_CEILING_EXCEEDED', async () => {
    const { service } = build([
      engagement({
        engagementId: 'e-sofia',
        subjectUserId: ids.sofia,
        grants: [grant({ grantId: 'g', actions: ['agenda.appointment.view'] })],
      }),
    ]);
    await expect(service.summary(staff(ids.sofia))).rejects.toMatchObject({
      reason: Reason.ADMIN_CEILING_EXCEEDED,
      status: 403,
    });
  });
});

describe('GovernanceReportsService.privilegeCreep (M-01, D-20)', () => {
  it('Mario con 3 átomos ALTA de más: deriva 15 ≥ 15 ⇒ marcado; su paquete tal cual no', async () => {
    const base = [...SUPPORT_TEMPLATE_DEFAULTS_V2.BILLING_CASHIER];
    const { service } = build([
      engagement({
        engagementId: 'e-base',
        subjectUserId: ids.ana,
        templateCode: 'BILLING_CASHIER',
        lastCertifiedAt: NOW,
        grants: [grant({ grantId: 'b', actions: base })],
      }),
      engagement({
        engagementId: 'e-mario',
        subjectUserId: ids.mario,
        templateCode: 'BILLING_CASHIER',
        lastCertifiedAt: NOW,
        grants: [
          grant({
            grantId: 'm',
            actions: [
              ...base,
              'billing.discount.apply',
              'billing.cashbox.close',
              'reports.billing.export',
            ],
          }),
        ],
      }),
    ]);
    const r: any = await service.privilegeCreep(securityAdmin());
    const mario = r.items.find((i: any) => i.userId === ids.mario);
    expect(mario).toMatchObject({
      drift: 15,
      flagged: true,
      reasons: ['DRIFT'],
    });
    expect(mario.score - mario.baseline).toBe(15);
    expect(r.items.find((i: any) => i.userId === ids.ana).flagged).toBe(false);
    expect(r.threshold).toBe(15);
  });

  it('dos concesiones nuevas desde su última certificación sin pasar por revisión también marcan', async () => {
    const last = new Date(NOW.getTime() - 30 * DAY);
    const mk = (id: string) =>
      grant({
        grantId: id,
        actions: ['agenda.appointment.view'],
        createdAt: new Date(NOW.getTime() - 5 * DAY),
      });
    const { service } = build([
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        templateCode: 'SECRETARY',
        lastCertifiedAt: last,
        grants: [mk('x1'), mk('x2')],
      }),
    ]);
    const r: any = await service.privilegeCreep(securityAdmin());
    expect(r.items[0]).toMatchObject({
      flagged: true,
      reasons: ['UNREVIEWED_GRANTS'],
    });
  });
});

describe('GovernanceReportsService: sin uso, sin dueño, excepciones y resumen', () => {
  const old = new Date(NOW.getTime() - 90 * DAY);
  const world = () => [
    engagement({
      engagementId: 'e1',
      subjectUserId: ids.ana,
      supervisorUserId: ids.perez,
      grants: [
        grant({
          grantId: 'viejo',
          actions: ['agenda.appointment.view'],
          lastUsedAt: old,
        }),
        grant({
          grantId: 'reciente',
          actions: ['agenda.appointment.view'],
          lastUsedAt: new Date(NOW.getTime() - DAY),
        }),
      ],
    }),
    engagement({
      engagementId: 'e2',
      subjectUserId: ids.marcos,
      supervisorUserId: null,
      grants: [grant({ grantId: 'p', actions: ['team.grants.assign'] })],
    }),
  ];

  it('accesos sin uso: solo la concesión viva sin PERMIT en `days`, con su último uso', async () => {
    const { service } = build(world());
    const r: any = await service.unusedAccess(securityAdmin(), 60);
    expect(r.days).toBe(60);
    expect(r.items.map((i: any) => i.grantId)).toEqual(['viejo']);
    expect(r.items[0].lastUsedAt).toBe(old.toISOString());
  });

  it('cuentas sin dueño: las activas sin supervisor', async () => {
    const { service } = build(world());
    const r: any = await service.ownerless(securityAdmin());
    expect(r.items).toEqual([
      expect.objectContaining({ userId: ids.marcos, reasons: ['NO_OWNER'] }),
    ]);
  });

  it('cuentas sin dueño: también las que tienen dueño pero ya no es elegible (listOwnerless del ciclo de vida, pendiente 13)', async () => {
    const withOwner = [
      engagement({
        engagementId: 'e-ana',
        subjectUserId: ids.ana,
        supervisorUserId: ids.sofia,
        grants: [grant({ grantId: 'g', actions: ['agenda.appointment.view'] })],
      }),
      engagement({
        engagementId: 'e-mar',
        subjectUserId: ids.marcos,
        supervisorUserId: null,
        grants: [grant({ grantId: 'p', actions: ['team.grants.assign'] })],
      }),
    ];
    const { service, lifecycle } = build(withOwner, {
      ownerless: [
        {
          engagementId: 'e-ana',
          userId: ids.ana,
          reasons: ['OWNER_NOT_ELIGIBLE'],
        },
        { engagementId: 'e-mar', userId: ids.marcos, reasons: ['NO_OWNER'] },
      ],
    });
    const r: any = await service.ownerless(securityAdmin());
    expect(lifecycle.listOwnerless).toHaveBeenCalledWith(
      expect.anything(),
      ids.tenant,
      expect.any(Date),
    );
    const byUser = Object.fromEntries(
      r.items.map((i: any) => [i.userId, i.reasons]),
    );
    expect(byUser[ids.ana]).toEqual(['OWNER_NOT_ELIGIBLE']);
    expect(byUser[ids.marcos]).toEqual(['NO_OWNER']);
    expect(r.items).toHaveLength(2);
  });

  it('excepciones: SoD vigentes (de los hallazgos) y permisos con valid_to próximo', async () => {
    const finding: SodFinding = {
      ruleCode: 'SOD-GOV-03',
      ruleName: 'x',
      scope: 'PERSON',
      action: 'REQUIRE_APPROVAL',
      isHard: false,
      outcome: 'EXCEPTED',
      atomsA: [],
      atomsB: [],
      grantIdsA: ['g'],
      grantIdsB: ['g2'],
      exceptionId: 'exc-1',
      exceptionValidTo: new Date(NOW.getTime() + 58 * DAY),
      admitsException: true,
    };
    const list = [
      engagement({
        engagementId: 'e1',
        subjectUserId: ids.ana,
        sodFindings: [finding],
        grants: [
          grant({
            grantId: 'g',
            actions: ['agenda.appointment.view'],
            validTo: new Date(NOW.getTime() + 5 * DAY),
          }),
        ],
      }),
    ];
    const { service } = build(list);
    const r: any = await service.exceptions(securityAdmin());
    expect(r.sodExceptions).toEqual([
      expect.objectContaining({ exceptionId: 'exc-1', ruleCode: 'SOD-GOV-03' }),
    ]);
    expect(r.expiringGrants).toEqual([
      expect.objectContaining({ grantId: 'g' }),
    ]);
  });

  it('el resumen trae los 10 mosaicos del tablero', async () => {
    const { service } = build(world(), {
      counts: { breakGlass: 2, fourEyes: 1 },
      anomalies: [{ id: 'a', userId: ids.ana }],
    });
    const r: any = await service.summary(securityAdmin());
    expect(Object.keys(r.tiles).sort()).toEqual(
      [
        'peopleWithLiveAccess',
        'highRiskGrants',
        'overdueCertifications',
        'ownerlessAccounts',
        'inactiveAccounts',
        'activeSodExceptions',
        'pendingApprovalsOver24h',
        'openAnomalies',
        'grantsAboveCeiling',
        'breakGlassUnreviewed',
      ].sort(),
    );
    expect(r.tiles).toMatchObject({
      peopleWithLiveAccess: 2,
      ownerlessAccounts: 1,
      highRiskGrants: 1,
      openAnomalies: 1,
      breakGlassUnreviewed: 2,
      pendingApprovalsOver24h: 1,
    });
  });
});
