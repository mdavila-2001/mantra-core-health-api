import {
  REVIEW_DEFAULTS,
  adjustmentOnlyReduces,
  buildReviewEvidence,
  campaignCloseAt,
  escalationDue,
  evaluateBulkDecision,
  grantInCampaignScope,
  hashEvidence,
  isGrantUnused,
  maxSensitivityOf,
  nextPeriodicReviewDue,
  normalizeSensitivity,
  planCampaignClosure,
  planRecertificationItems,
  reminderDue,
  reviewCadenceMonthsFor,
  selectCampaignItems,
  summarizeCampaignResults,
  validateReviewDecision,
  type CampaignSelectionInput,
  type ReviewEngagementInput,
  type ReviewItemFacts,
  type ReviewableGrant,
} from './support-access-review';
import type { AdminScope, ReviewerContext } from './support-reviewer-resolver';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const day = (n: number, from = NOW): Date =>
  new Date(from.getTime() + n * 86_400_000);
const SITE = 'site-1';
const pathOf = (...ids: string[]): string => `/${[SITE, ...ids].join('/')}/`;

const grant = (
  over: Partial<ReviewableGrant> & Pick<ReviewableGrant, 'grantId' | 'actions'>,
): ReviewableGrant => ({
  targetKind: 'ALL',
  grantedByUserId: 'u-root',
  createdAt: day(-200),
  lastUsedAt: day(-1),
  ...over,
});

const sofiaGrant = grant({
  grantId: 'g-sofia',
  targetKind: 'SERVICE',
  healthcareServiceId: 'eco',
  actions: [
    'agenda.appointment.view',
    'team.members.view',
    'team.grants.assign',
    'team.campaigns.review',
  ],
});
const marcosEco = grant({
  grantId: 'g-marcos-eco',
  targetKind: 'SERVICE',
  healthcareServiceId: 'eco',
  actions: ['agenda.appointment.view', 'agenda.appointment.cancel'],
});
const marcosNorte = grant({
  grantId: 'g-marcos-norte',
  targetKind: 'PRACTITIONER_LOCATION',
  practitionerProfileId: 'suarez',
  careSpaceId: 'norte',
  careSpacePath: pathOf('edif-a', 'norte'),
  actions: ['agenda.appointment.view'],
});
const anaPerez = grant({
  grantId: 'g-ana',
  targetKind: 'PRACTITIONER',
  practitionerProfileId: 'perez',
  actions: ['agenda.appointment.view', 'agenda.appointment.create'],
});

const eng = (
  over: Partial<ReviewEngagementInput> &
    Pick<ReviewEngagementInput, 'engagementId' | 'subjectUserId' | 'grants'>,
): ReviewEngagementInput => ({
  state: 'ACTIVE',
  supervisorUserId: 'u-gonzalo',
  templateCode: 'FRONT_DESK',
  ...over,
});
const sofia = eng({
  engagementId: 'e-sofia',
  subjectUserId: 'u-sofia',
  templateCode: 'ORG_MANAGEMENT',
  grants: [sofiaGrant],
});
const marcos = eng({
  engagementId: 'e-marcos',
  subjectUserId: 'u-marcos',
  supervisorUserId: 'u-sofia',
  grants: [marcosEco, marcosNorte],
});
const ana = eng({
  engagementId: 'e-ana',
  subjectUserId: 'u-ana',
  grants: [anaPerez],
});

const sofiaScope: AdminScope = {
  adminUserId: 'u-sofia',
  target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
};
const reviewerContext: Omit<ReviewerContext, 'campaignKind'> = {
  campaignOwnerUserId: 'u-gonzalo',
  securityAdminUserIds: ['u-gonzalo'],
  doctorUserIdsByPractitioner: { perez: 'u-perez' },
};
const selection = (
  over: Partial<CampaignSelectionInput> = {},
): CampaignSelectionInput => ({
  kind: 'PERIODIC',
  scope: { kind: 'SERVICE', healthcareServiceIds: ['eco'] },
  engagements: [sofia, marcos, ana],
  adminScopes: [sofiaScope],
  reviewerContext,
  now: NOW,
  ...over,
});

describe('normalizeSensitivity', () => {
  it('acepta los nombres del contrato (ALTA) y los del catálogo (HIGH)', () => {
    expect(normalizeSensitivity('ALTA')).toBe('HIGH');
    expect(normalizeSensitivity('media')).toBe('MEDIUM');
    expect(normalizeSensitivity('CRÍTICA')).toBe('CRITICAL');
    expect(normalizeSensitivity('CRITICA')).toBe('CRITICAL');
    expect(normalizeSensitivity('BAJA')).toBe('LOW');
    expect(normalizeSensitivity('HIGH')).toBe('HIGH');
    expect(normalizeSensitivity('otra')).toBeUndefined();
    expect(normalizeSensitivity(undefined)).toBeUndefined();
  });
  it('maxSensitivityOf: la mayor de los átomos; vacío = null', () => {
    expect(
      maxSensitivityOf([
        'agenda.appointment.view',
        'agenda.appointment.cancel',
      ]),
    ).toBe('MEDIUM');
    expect(
      maxSensitivityOf(['agenda.appointment.view', 'billing.receipt.void']),
    ).toBe('CRITICAL');
    expect(maxSensitivityOf([])).toBeNull();
  });
});

describe('grantInCampaignScope (§6.2: misma lógica de dimensiones que grantCovers/targetWithin)', () => {
  it('ORGANIZATION: todo; TEMPLATE: por plantilla de la persona', () => {
    expect(grantInCampaignScope(anaPerez, { kind: 'ORGANIZATION' })).toBe(true);
    expect(
      grantInCampaignScope(
        anaPerez,
        { kind: 'TEMPLATE', templateCodes: ['BILLING_CASHIER'] },
        'BILLING_CASHIER',
      ),
    ).toBe(true);
    expect(
      grantInCampaignScope(
        anaPerez,
        { kind: 'TEMPLATE', templateCodes: ['BILLING_CASHIER'] },
        'SECRETARY',
      ),
    ).toBe(false);
    expect(
      grantInCampaignScope(
        anaPerez,
        { kind: 'TEMPLATE', templateCodes: ['BILLING_CASHIER'] },
        null,
      ),
    ).toBe(false);
  });
  const svc = { kind: 'SERVICE', healthcareServiceIds: ['eco'] } as const;
  it.each([
    [
      'servicio específico e igual',
      { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
      true,
    ],
    [
      'servicio específico distinto',
      { targetKind: 'SERVICE', healthcareServiceId: 'card' },
      false,
    ],
    ['«todos los servicios» (ANY)', { targetKind: 'ALL_SERVICES' }, true],
    ['ALL', { targetKind: 'ALL' }, true],
    [
      'solo por doctor: no acota el servicio, no entra',
      { targetKind: 'PRACTITIONER', practitionerProfileId: 'perez' },
      false,
    ],
    [
      'doctor × servicio igual',
      {
        targetKind: 'PRACTITIONER_SERVICE',
        practitionerProfileId: 'perez',
        healthcareServiceId: 'eco',
      },
      true,
    ],
    [
      'solo por ubicación: no entra',
      { targetKind: 'LOCATION', careSpaceId: 'x' },
      false,
    ],
  ])('alcance SERVICE · %s', (_n, target, expected) => {
    expect(
      grantInCampaignScope(
        {
          ...grant({ grantId: 'x', actions: [] }),
          ...target,
        } as ReviewableGrant,
        svc,
      ),
    ).toBe(expected);
  });
  it('alcance PRACTITIONER por asignación de rol', () => {
    const scope = {
      kind: 'PRACTITIONER',
      practitionerRoleAssignmentIds: ['pra-perez'],
    } as const;
    const g = { ...anaPerez, practitionerRoleAssignmentId: 'pra-perez' };
    expect(grantInCampaignScope(g, scope)).toBe(true);
    expect(
      grantInCampaignScope(
        {
          ...g,
          practitionerRoleAssignmentId: 'pra-rojas',
          practitionerProfileId: 'rojas',
        },
        scope,
      ),
    ).toBe(false);
    expect(
      grantInCampaignScope(
        { ...anaPerez, targetKind: 'ALL_PRACTITIONERS' },
        scope,
      ),
    ).toBe(true);
  });
  it('alcance LOCATION: la ubicación de la concesión debe estar CONTENIDA (por ruta) o ser igual', () => {
    const scope = {
      kind: 'LOCATION',
      careSpaceIds: ['piso-1'],
      practiceSiteIds: [],
    } as const;
    const loc = (id: string, ...path: string[]): ReviewableGrant =>
      grant({
        grantId: id,
        targetKind: 'LOCATION',
        careSpaceId: id,
        careSpacePath: pathOf('edif-a', ...path, id),
        actions: [],
      });
    expect(grantInCampaignScope(loc('piso-1'), scope)).toBe(true);
    expect(grantInCampaignScope(loc('sala-103', 'piso-1'), scope)).toBe(true);
    expect(grantInCampaignScope(loc('piso-2'), scope)).toBe(false);
    expect(
      grantInCampaignScope(
        grant({
          grantId: 'e',
          targetKind: 'LOCATION',
          careSpaceId: 'edif-a',
          careSpacePath: pathOf('edif-a'),
          actions: [],
        }),
        scope,
      ),
    ).toBe(false);
    expect(
      grantInCampaignScope(
        grant({ grantId: 'a', targetKind: 'ALL_LOCATIONS', actions: [] }),
        scope,
      ),
    ).toBe(true);
    const bySite = {
      kind: 'LOCATION',
      careSpaceIds: [],
      practiceSiteIds: [SITE],
    } as const;
    // La ruta materializada lista la sede: una sala de la sede está contenida en ella.
    expect(grantInCampaignScope(loc('piso-2'), bySite)).toBe(true);
    const noPath = (siteId: string): ReviewableGrant =>
      grant({
        grantId: 'np',
        targetKind: 'LOCATION',
        careSpaceId: 'x',
        careSpaceSiteId: siteId,
        actions: [],
      });
    expect(grantInCampaignScope(noPath(SITE), bySite)).toBe(true);
    expect(grantInCampaignScope(noPath('otra-sede'), bySite)).toBe(false);
  });
  it('un permiso FIXED entra si alguna fila fija la dimensión del alcance', () => {
    const fixed = grant({
      grantId: 'f',
      targetKind: 'ALL',
      expansionMode: 'FIXED',
      snapshot: {
        rows: [{ healthcareServiceId: 'eco', practitionerProfileId: 'perez' }],
      },
      actions: [],
    });
    expect(grantInCampaignScope(fixed, svc)).toBe(true);
    expect(
      grantInCampaignScope(fixed, {
        kind: 'SERVICE',
        healthcareServiceIds: ['card'],
      }),
    ).toBe(false);
  });
});

describe('selectCampaignItems · K-01 (vista previa y lanzamiento)', () => {
  it('ALTA: 1 ítem (la concesión de Sofía; revisor ADMIN porque ella es el sujeto)', () => {
    const r = selectCampaignItems(
      selection({ filters: { minSensitivity: 'ALTA' } }),
    );
    expect(r.items).toHaveLength(1);
    expect(r.items[0]).toMatchObject({
      engagementId: 'e-sofia',
      grantId: 'g-sofia',
      reviewerKind: 'ADMIN',
      reviewerUserIds: ['u-gonzalo'],
      maxSensitivity: 'HIGH',
    });
    expect(r.empty).toBe(false);
  });
  it('MEDIA: 2 ítems (Sofía → ADMIN; Marcos-Ecografía → Sofía como jefa de servicio)', () => {
    const r = selectCampaignItems(
      selection({ filters: { minSensitivity: 'MEDIA' } }),
    );
    expect(
      r.items.map((i) => [
        i.engagementId,
        i.grantId,
        i.reviewerKind,
        i.reviewerUserIds,
      ]),
    ).toEqual([
      ['e-marcos', 'g-marcos-eco', 'SERVICE_HEAD', ['u-sofia']],
      ['e-sofia', 'g-sofia', 'ADMIN', ['u-gonzalo']],
    ]);
  });
  it('sin filtro entran las concesiones del alcance; las de fuera (Norte, Ana) no', () => {
    const r = selectCampaignItems(selection());
    expect(r.items.map((i) => i.grantId)).toEqual(['g-marcos-eco', 'g-sofia']);
  });
  it('un alcance sin concesiones da `empty` (422 REVIEW_SCOPE_EMPTY)', () => {
    const r = selectCampaignItems(
      selection({ scope: { kind: 'SERVICE', healthcareServiceIds: ['nada'] } }),
    );
    expect(r).toMatchObject({ items: [], empty: true });
  });
  it('excluye vínculos terminados siempre y suspendidos salvo includeSuspended', () => {
    const base = [
      sofia,
      { ...marcos, state: 'SUSPENDED' as const },
      { ...ana, state: 'ENDED' as const },
    ];
    expect(
      selectCampaignItems(
        selection({ engagements: base, scope: { kind: 'ORGANIZATION' } }),
      ).items.map((i) => i.engagementId),
    ).toEqual(['e-sofia']);
    const inc = selectCampaignItems(
      selection({
        engagements: base,
        scope: { kind: 'ORGANIZATION' },
        filters: { includeSuspended: true },
      }),
    );
    expect(inc.items.map((i) => i.engagementId)).toEqual([
      'e-marcos',
      'e-marcos',
      'e-sofia',
    ]);
  });
  it('no incluye concesiones DENY, revocadas ni vencidas', () => {
    const dead = eng({
      engagementId: 'e-x',
      subjectUserId: 'u-x',
      grants: [
        grant({
          grantId: 'd1',
          actions: ['agenda.appointment.view'],
          effect: 'DENY',
        }),
        grant({
          grantId: 'd2',
          actions: ['agenda.appointment.view'],
          active: false,
        }),
        grant({
          grantId: 'd3',
          actions: ['agenda.appointment.view'],
          validTo: NOW,
        }),
        grant({ grantId: 'ok', actions: ['agenda.appointment.view'] }),
      ],
    });
    expect(
      selectCampaignItems(
        selection({ engagements: [dead], scope: { kind: 'ORGANIZATION' } }),
      ).items.map((i) => i.grantId),
    ).toEqual(['ok']);
  });
  it('filtros: unusedDays, onlyAboveCeiling y onlySodFindings', () => {
    const unusedG = { ...marcosEco, lastUsedAt: day(-90) };
    const e = {
      ...marcos,
      grants: [unusedG, { ...marcosNorte, aboveCeiling: true }],
    };
    expect(
      selectCampaignItems(
        selection({
          engagements: [e],
          scope: { kind: 'ORGANIZATION' },
          filters: { unusedDays: 60 },
        }),
      ).items.map((i) => i.grantId),
    ).toEqual(['g-marcos-eco']);
    expect(
      selectCampaignItems(
        selection({
          engagements: [e],
          scope: { kind: 'ORGANIZATION' },
          filters: { onlyAboveCeiling: true },
        }),
      ).items.map((i) => i.grantId),
    ).toEqual(['g-marcos-norte']);
    const withSod = { ...e, sodGrantIds: ['g-marcos-eco'] };
    expect(
      selectCampaignItems(
        selection({
          engagements: [withSod],
          scope: { kind: 'ORGANIZATION' },
          filters: { onlySodFindings: true },
        }),
      ).items.map((i) => i.grantId),
    ).toEqual(['g-marcos-eco']);
  });
  it('un permiso sin uso en unusedDays precarga «Revocar»', () => {
    const e = { ...marcos, grants: [{ ...marcosEco, lastUsedAt: day(-90) }] };
    const r = selectCampaignItems(selection({ engagements: [e] }));
    expect(r.items[0].suggestRevoke).toBe(true);
    expect(
      selectCampaignItems(selection()).items.every(
        (i) => i.suggestRevoke === false,
      ),
    ).toBe(true);
  });
  it('RECERTIFICATION: un ítem por vínculo (sin concesión), a nombre del administrador', () => {
    const r = selectCampaignItems(
      selection({ kind: 'RECERTIFICATION', scope: { kind: 'ORGANIZATION' } }),
    );
    expect(
      r.items.map((i) => [i.engagementId, i.grantId, i.reviewerKind]),
    ).toEqual([
      ['e-ana', null, 'ADMIN'],
      ['e-marcos', null, 'ADMIN'],
      ['e-sofia', null, 'ADMIN'],
    ]);
  });
  it('no duplica ítems abiertos (misma persona y concesión)', () => {
    const r = selectCampaignItems(
      selection({ existingOpenItemKeys: ['e-sofia:g-sofia'] }),
    );
    expect(r.items.map((i) => i.grantId)).toEqual(['g-marcos-eco']);
    expect(r.skipped).toEqual([
      { engagementId: 'e-sofia', grantId: 'g-sofia', reason: 'ALREADY_OPEN' },
    ]);
  });
  it('el tipo de campaña llega a la resolución del revisor (MOVER → dueño de la cuenta)', () => {
    const r = selectCampaignItems(
      selection({ kind: 'MOVER', engagements: [marcos] }),
    );
    expect(r.items.find((i) => i.grantId === 'g-marcos-eco')).toMatchObject({
      reviewerKind: 'SUPERVISOR',
      reviewerUserIds: ['u-sofia'],
    });
  });
  it('propiedad: el orden de entrada no cambia los ítems', () => {
    const expected = selectCampaignItems(
      selection({ scope: { kind: 'ORGANIZATION' } }),
    );
    for (const engagements of [
      [ana, marcos, sofia],
      [marcos, sofia, ana],
      [sofia, ana, marcos],
    ]) {
      expect(
        selectCampaignItems(
          selection({
            scope: { kind: 'ORGANIZATION' },
            engagements,
            adminScopes: [sofiaScope],
          }),
        ),
      ).toEqual(expected);
    }
  });
  it('propiedad: ningún ítem se asigna a su propio sujeto', () => {
    const r = selectCampaignItems(
      selection({ scope: { kind: 'ORGANIZATION' } }),
    );
    const subjects = new Map(
      [sofia, marcos, ana].map((e) => [e.engagementId, e.subjectUserId]),
    );
    for (const i of r.items)
      expect(i.reviewerUserIds).not.toContain(subjects.get(i.engagementId));
  });
});

describe('isGrantUnused', () => {
  it('sin PERMIT en unusedDays (60 por defecto) está sin uso; uno recién creado no', () => {
    expect(REVIEW_DEFAULTS.unusedDays).toBe(60);
    expect(
      isGrantUnused({ lastUsedAt: day(-61), createdAt: day(-300), now: NOW }),
    ).toBe(true);
    expect(
      isGrantUnused({ lastUsedAt: day(-59), createdAt: day(-300), now: NOW }),
    ).toBe(false);
    expect(
      isGrantUnused({ lastUsedAt: null, createdAt: day(-10), now: NOW }),
    ).toBe(false);
    expect(
      isGrantUnused({ lastUsedAt: null, createdAt: day(-100), now: NOW }),
    ).toBe(true);
    expect(isGrantUnused({ now: NOW })).toBe(true);
    expect(
      isGrantUnused({ lastUsedAt: day(-30), now: NOW, unusedDays: 15 }),
    ).toBe(true);
  });
});

describe('evidencia congelada y hash (§6.2)', () => {
  const input = {
    grant: { ...sofiaGrant, grantedAt: day(-200) },
    usage90d: [
      {
        atom: 'agenda.appointment.view',
        permitCount: 40,
        denyCount: 1,
        lastUsedAt: day(-1),
      },
      {
        atom: 'team.grants.assign',
        permitCount: 0,
        denyCount: 0,
        lastUsedAt: null,
      },
    ],
    openAlerts: 1,
    sodFindings: [
      { ruleCode: 'SOD-GOV-03', action: 'REQUIRE_APPROVAL' as const },
    ],
    aboveCeiling: false,
    lastCertifiedAt: day(-120),
    now: NOW,
  };
  it('lleva resumen, átomos con sensibilidad, objetivos, uso real, alertas, SoD, techo y quién otorgó', () => {
    const ev = buildReviewEvidence(input);
    expect(ev).toMatchObject({
      schemaVersion: 1,
      generatedAt: NOW.toISOString(),
      openAlerts: 1,
      aboveCeiling: false,
      lastCertifiedAt: day(-120).toISOString(),
      grant: {
        grantId: 'g-sofia',
        grantedByUserId: 'u-root',
        grantedAt: day(-200).toISOString(),
        targetKind: 'SERVICE',
      },
      targets: { healthcareServiceId: 'eco' },
      sodFindings: [{ ruleCode: 'SOD-GOV-03', action: 'REQUIRE_APPROVAL' }],
    });
    expect(ev.summary).toMatch(/^Incluye: /);
    expect(ev.atoms.find((a) => a.code === 'team.grants.assign')).toMatchObject(
      { sensitivity: 'HIGH' },
    );
    expect(ev.usage90d).toEqual([
      {
        atom: 'agenda.appointment.view',
        permit: 40,
        deny: 1,
        lastUsedAt: day(-1).toISOString(),
      },
      { atom: 'team.grants.assign', permit: 0, deny: 0, lastUsedAt: null },
    ]);
  });
  it('hashEvidence: 64 hex, estable ante el orden de las claves y distinto si cambia lo mostrado', () => {
    const ev = buildReviewEvidence(input);
    const h = hashEvidence(ev);
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashEvidence(JSON.parse(JSON.stringify(ev)) as typeof ev)).toBe(h);
    const reversed = Object.fromEntries(
      Object.entries(ev).reverse(),
    ) as typeof ev;
    expect(hashEvidence(reversed)).toBe(h);
    expect(hashEvidence({ ...ev, openAlerts: 2 })).not.toBe(h);
  });
  it('es determinista: la misma entrada da la misma evidencia y el mismo hash', () => {
    expect(hashEvidence(buildReviewEvidence(input))).toBe(
      hashEvidence(buildReviewEvidence(input)),
    );
  });
  it('cero PHI: solo identificadores y números', () => {
    const text = JSON.stringify(buildReviewEvidence(input));
    expect(text).not.toMatch(/documento|nombre del paciente/i);
  });
});

const itemFacts = (over: Partial<ReviewItemFacts> = {}): ReviewItemFacts => ({
  itemId: 'it-1',
  state: 'PENDING',
  campaignOpen: true,
  subjectUserId: 'u-marcos',
  reviewerUserIds: ['u-sofia'],
  grantedByUserId: 'u-root',
  approvedByUserIds: [],
  atoms: ['agenda.appointment.view', 'agenda.appointment.cancel'],
  lastUsedAt: day(-1),
  createdAt: day(-200),
  isEngagementItem: false,
  ...over,
});

describe('validateReviewDecision · K-02, S-04', () => {
  const base = { item: itemFacts(), deciderUserId: 'u-sofia', now: NOW };

  it('K-02: certificar un ítem MEDIA con uso reciente no exige comentario', () => {
    expect(validateReviewDecision({ ...base, decision: 'CERTIFY' })).toEqual({
      ok: true,
    });
  });
  it('K-02: certificar un ítem ALTA sin comentario → 422 REVIEW_COMMENT_REQUIRED; con 10+ caracteres, 200', () => {
    const high = itemFacts({ atoms: ['team.grants.assign'] });
    expect(
      validateReviewDecision({ ...base, item: high, decision: 'CERTIFY' }),
    ).toEqual({ ok: false, code: 'REVIEW_COMMENT_REQUIRED', httpStatus: 422 });
    expect(
      validateReviewDecision({
        ...base,
        item: high,
        decision: 'CERTIFY',
        comment: 'corto',
      }),
    ).toMatchObject({ ok: false, code: 'REVIEW_COMMENT_REQUIRED' });
    expect(
      validateReviewDecision({
        ...base,
        item: high,
        decision: 'CERTIFY',
        comment: '  Verificado con la jefa de servicio  ',
      }),
    ).toEqual({ ok: true });
  });
  it('certificar algo que no se usó en unusedDays también exige comentario', () => {
    const unused = itemFacts({ lastUsedAt: day(-90) });
    expect(
      validateReviewDecision({ ...base, item: unused, decision: 'CERTIFY' }),
    ).toMatchObject({ ok: false, code: 'REVIEW_COMMENT_REQUIRED' });
  });
  it('revocar y ajustar siempre exigen comentario de 10 caracteres', () => {
    expect(
      validateReviewDecision({ ...base, decision: 'REVOKE' }),
    ).toMatchObject({ ok: false, code: 'REVIEW_COMMENT_REQUIRED' });
    expect(
      validateReviewDecision({
        ...base,
        decision: 'REVOKE',
        comment: 'No lo usa más',
      }),
    ).toEqual({ ok: true });
    expect(
      validateReviewDecision({
        ...base,
        decision: 'ADJUST',
        comment: 'x',
        current: { atoms: [] },
        adjustment: { atoms: [] },
      }),
    ).toMatchObject({ code: 'REVIEW_COMMENT_REQUIRED' });
  });
  it('K-02: un ajuste que AGREGA un átomo → 422 REVIEW_ADJUST_CANNOT_BROADEN', () => {
    const r = validateReviewDecision({
      ...base,
      decision: 'ADJUST',
      comment: 'Ajuste de alcance',
      current: {
        atoms: ['agenda.appointment.view', 'agenda.appointment.cancel'],
      },
      adjustment: {
        atoms: [
          'agenda.appointment.view',
          'agenda.appointment.cancel',
          'agenda.appointment.create',
        ],
      },
    });
    expect(r).toEqual({
      ok: false,
      code: 'REVIEW_ADJUST_CANNOT_BROADEN',
      httpStatus: 422,
    });
  });
  it('K-02: un ajuste que QUITA agenda.appointment.cancel es válido', () => {
    expect(
      validateReviewDecision({
        ...base,
        decision: 'ADJUST',
        comment: 'Ya no cancela citas',
        current: {
          atoms: ['agenda.appointment.view', 'agenda.appointment.cancel'],
        },
        adjustment: { atoms: ['agenda.appointment.view'] },
      }),
    ).toEqual({ ok: true });
  });
  it('ajustar sin ajuste o sobre un ítem de vínculo no aplica', () => {
    expect(
      validateReviewDecision({
        ...base,
        decision: 'ADJUST',
        comment: 'Ajuste de alcance',
        current: { atoms: [] },
      }),
    ).toEqual({
      ok: false,
      code: 'REVIEW_ADJUST_NOT_APPLICABLE',
      httpStatus: 422,
    });
    expect(
      validateReviewDecision({
        ...base,
        item: itemFacts({ isEngagementItem: true }),
        decision: 'ADJUST',
        comment: 'Ajuste de alcance',
        current: { atoms: [] },
        adjustment: { atoms: [] },
      }),
    ).toMatchObject({ code: 'REVIEW_ADJUST_NOT_APPLICABLE' });
  });
  it('S-04: quien otorgó la concesión no la certifica (403 REVIEW_NOT_REVIEWER), aunque figure como revisor', () => {
    const item = itemFacts({
      grantedByUserId: 'u-sofia',
      reviewerUserIds: ['u-sofia', 'u-gonzalo'],
    });
    expect(
      validateReviewDecision({ ...base, item, decision: 'CERTIFY' }),
    ).toEqual({ ok: false, code: 'REVIEW_NOT_REVIEWER', httpStatus: 403 });
    expect(
      validateReviewDecision({
        ...base,
        item,
        deciderUserId: 'u-gonzalo',
        decision: 'CERTIFY',
      }),
    ).toEqual({ ok: true });
  });
  it('quien aprobó tampoco; ni la propia persona revisada; ni quien no es revisor', () => {
    expect(
      validateReviewDecision({
        ...base,
        item: itemFacts({ approvedByUserIds: ['u-sofia'] }),
        decision: 'CERTIFY',
      }).ok,
    ).toBe(false);
    expect(
      validateReviewDecision({
        ...base,
        item: itemFacts({ reviewerUserIds: ['u-marcos'] }),
        deciderUserId: 'u-marcos',
        decision: 'CERTIFY',
      }),
    ).toMatchObject({ code: 'REVIEW_NOT_REVIEWER' });
    expect(
      validateReviewDecision({
        ...base,
        deciderUserId: 'u-cualquiera',
        decision: 'CERTIFY',
      }),
    ).toMatchObject({ code: 'REVIEW_NOT_REVIEWER', httpStatus: 403 });
  });
  it('409 si la campaña no está abierta o el ítem ya se decidió', () => {
    expect(
      validateReviewDecision({
        ...base,
        item: itemFacts({ campaignOpen: false }),
        decision: 'CERTIFY',
      }),
    ).toEqual({ ok: false, code: 'REVIEW_CAMPAIGN_NOT_OPEN', httpStatus: 409 });
    expect(
      validateReviewDecision({
        ...base,
        item: itemFacts({ state: 'CERTIFIED' }),
        decision: 'CERTIFY',
      }),
    ).toEqual({ ok: false, code: 'REVIEW_ALREADY_DECIDED', httpStatus: 409 });
  });
});

describe('adjustmentOnlyReduces · un ajuste solo reduce', () => {
  const current = {
    atoms: ['agenda.appointment.view', 'agenda.appointment.cancel'],
    validTo: day(100),
    condition: {
      schemaVersion: 1,
      time: { windows: [{ days: [1], from: '08:00', to: '12:00' }] },
    },
  };
  it('quitar átomos, acortar vigencia y agregar condiciones reducen', () => {
    expect(
      adjustmentOnlyReduces(current, { atoms: ['agenda.appointment.view'] }),
    ).toEqual({ ok: true, violations: [] });
    expect(adjustmentOnlyReduces(current, { validTo: day(50) })).toEqual({
      ok: true,
      violations: [],
    });
    expect(
      adjustmentOnlyReduces(current, {
        condition: { ...current.condition, limits: { max: 5 } },
      }),
    ).toEqual({ ok: true, violations: [] });
  });
  it('agregar un átomo, alargar o quitar la vigencia, quitar o cambiar condiciones amplían', () => {
    expect(
      adjustmentOnlyReduces(current, {
        atoms: [...current.atoms, 'agenda.appointment.create'],
      }).violations,
    ).toEqual(['ATOMS']);
    expect(
      adjustmentOnlyReduces(current, { validTo: day(101) }).violations,
    ).toEqual(['VALID_TO']);
    expect(
      adjustmentOnlyReduces(current, { validTo: null }).violations,
    ).toEqual(['VALID_TO']);
    expect(
      adjustmentOnlyReduces(current, { condition: null }).violations,
    ).toEqual(['CONDITION']);
    expect(
      adjustmentOnlyReduces(current, { condition: { schemaVersion: 1 } })
        .violations,
    ).toEqual(['CONDITION']);
    expect(
      adjustmentOnlyReduces(current, {
        condition: {
          schemaVersion: 1,
          time: { windows: [{ days: [1, 2], from: '08:00', to: '12:00' }] },
        },
      }).violations,
    ).toEqual(['CONDITION']);
  });
  it('sin vigencia previa, fijar una es acortar; sin condición previa, cualquiera restringe', () => {
    expect(
      adjustmentOnlyReduces(
        { atoms: ['agenda.appointment.view'] },
        { validTo: day(10) },
      ).ok,
    ).toBe(true);
    expect(
      adjustmentOnlyReduces(
        { atoms: ['agenda.appointment.view'] },
        { condition: { schemaVersion: 1, limits: { max: 1 } } },
      ).ok,
    ).toBe(true);
  });
  it('agregar un techo de delegación a una condición amplía lo que puede hacer la persona', () => {
    expect(
      adjustmentOnlyReduces(current, {
        condition: {
          ...current.condition,
          delegationCeiling: { maxValidDays: 30 },
        },
      }).violations,
    ).toEqual(['CONDITION']);
  });
  it('un alias se compara por los átomos de su paquete', () => {
    expect(
      adjustmentOnlyReduces(
        { atoms: ['schedule.view'] },
        { atoms: ['agenda.appointment.view'] },
      ).ok,
    ).toBe(true);
  });
  it('sin cambios no amplía', () => {
    expect(adjustmentOnlyReduces(current, {})).toEqual({
      ok: true,
      violations: [],
    });
  });
});

describe('evaluateBulkDecision · K-05: todo o nada', () => {
  const low = (id: string): ReviewItemFacts =>
    itemFacts({
      itemId: id,
      atoms: ['agenda.appointment.view', 'agenda.appointment.create'],
    });
  const high = itemFacts({ itemId: 'it-alta', atoms: ['team.grants.assign'] });
  const base = {
    decision: 'CERTIFY' as const,
    deciderUserId: 'u-sofia',
    now: NOW,
  };

  it('K-05: 5 de bajo riesgo y 1 ALTA → 422 REVIEW_BULK_NOT_ALLOWED con itemIds = [el ALTA]; no se aplica ninguno', () => {
    const r = evaluateBulkDecision({
      ...base,
      items: [low('a'), low('b'), low('c'), low('d'), low('e'), high],
    });
    expect(r).toEqual({
      ok: false,
      code: 'REVIEW_BULK_NOT_ALLOWED',
      httpStatus: 422,
      itemIds: ['it-alta'],
    });
  });
  it('solo bajo riesgo y uso reciente: todos se aplican', () => {
    expect(
      evaluateBulkDecision({ ...base, items: [low('a'), low('b')] }),
    ).toEqual({ ok: true, itemIds: ['a', 'b'] });
  });
  it('solo se admite CERTIFY', () => {
    expect(
      evaluateBulkDecision({
        ...base,
        decision: 'REVOKE' as never,
        items: [low('a')],
      }),
    ).toMatchObject({
      ok: false,
      code: 'REVIEW_BULK_NOT_ALLOWED',
      itemIds: ['a'],
    });
  });
  it('un ítem sin uso reciente tampoco entra en lote', () => {
    const r = evaluateBulkDecision({
      ...base,
      items: [low('a'), { ...low('b'), lastUsedAt: day(-90) }],
    });
    expect(r).toMatchObject({
      ok: false,
      code: 'REVIEW_BULK_NOT_ALLOWED',
      itemIds: ['b'],
    });
  });
  it('un lote vacío no se admite', () => {
    expect(evaluateBulkDecision({ ...base, items: [] })).toMatchObject({
      ok: false,
      code: 'REVIEW_BULK_NOT_ALLOWED',
      itemIds: [],
    });
  });
  it('si alguno no le corresponde decidirlo: 403 para todo el lote (primero la autorización)', () => {
    const r = evaluateBulkDecision({
      ...base,
      items: [low('a'), { ...low('b'), reviewerUserIds: ['u-otro'] }, high],
    });
    expect(r).toEqual({
      ok: false,
      code: 'REVIEW_NOT_REVIEWER',
      httpStatus: 403,
      itemIds: ['b'],
    });
  });
  it('409 si alguno ya se decidió o su campaña se cerró', () => {
    expect(
      evaluateBulkDecision({
        ...base,
        items: [low('a'), { ...low('b'), state: 'REVOKED' }],
      }),
    ).toEqual({
      ok: false,
      code: 'REVIEW_ALREADY_DECIDED',
      httpStatus: 409,
      itemIds: ['b'],
    });
    expect(
      evaluateBulkDecision({
        ...base,
        items: [{ ...low('a'), campaignOpen: false }],
      }),
    ).toMatchObject({ code: 'REVIEW_CAMPAIGN_NOT_OPEN', itemIds: ['a'] });
  });
  it('quien otorgó la concesión no la certifica en lote', () => {
    expect(
      evaluateBulkDecision({
        ...base,
        items: [{ ...low('a'), grantedByUserId: 'u-sofia' }],
      }),
    ).toMatchObject({ code: 'REVIEW_NOT_REVIEWER', itemIds: ['a'] });
  });
  it('propiedad: o se aplican todos, o ninguno', () => {
    const pool = [
      low('a'),
      low('b'),
      high,
      { ...low('c'), lastUsedAt: day(-90) },
      { ...low('d'), state: 'CERTIFIED' as const },
    ];
    for (let mask = 1; mask < 32; mask += 1) {
      const items = pool.filter((_, i) => mask & (1 << i));
      const r = evaluateBulkDecision({ ...base, items });
      if (r.ok) expect(r.itemIds).toEqual(items.map((i) => i.itemId));
      else
        expect(
          r.itemIds.every((id) => items.some((i) => i.itemId === id)),
        ).toBe(true);
      const allClean = items.every(
        (i) =>
          i.atoms.every((a) => a !== 'team.grants.assign') &&
          i.state === 'PENDING' &&
          (i.lastUsedAt ?? new Date(0)) > day(-60),
      );
      expect(r.ok).toBe(allClean);
    }
  });
});

describe('recordatorios y escalamiento (§6.2)', () => {
  const dueAt = day(10);
  it('recordatorios en due−7, due−3, due−1 y a diario desde el vencimiento', () => {
    expect(REVIEW_DEFAULTS.reminderDaysBefore).toEqual([7, 3, 1]);
    const probe = (now: Date, last?: Date | null) =>
      reminderDue({ dueAt, now, lastRemindedAt: last });
    expect(probe(day(2)).due).toBe(false);
    expect(probe(day(3))).toMatchObject({ due: true, pointAt: day(3) });
    expect(probe(day(3), day(3)).due).toBe(false);
    expect(probe(day(6), day(3)).due).toBe(false);
    expect(probe(day(7), day(3))).toMatchObject({ due: true, pointAt: day(7) });
    expect(probe(day(7), day(7)).due).toBe(false);
    expect(probe(day(9))).toMatchObject({ due: true, pointAt: day(9) });
    expect(probe(day(10), day(9))).toMatchObject({
      due: true,
      pointAt: day(10),
      overdue: true,
    });
    expect(probe(day(11), day(10))).toMatchObject({
      due: true,
      pointAt: day(11),
      overdue: true,
    });
    expect(
      probe(
        day(11).getTime() > 0
          ? new Date(day(11).getTime() + 3_600_000)
          : day(11),
        day(11),
      ).due,
    ).toBe(false);
  });
  it('un barrido repetido el mismo día no reenvía (idempotente)', () => {
    const first = reminderDue({ dueAt, now: day(4), lastRemindedAt: null });
    expect(first.due).toBe(true);
    expect(
      reminderDue({
        dueAt,
        now: new Date(day(4).getTime() + 3600_000),
        lastRemindedAt: day(4),
      }).due,
    ).toBe(false);
  });
  it('los puntos anteriores al lanzamiento no se reenvían de golpe', () => {
    expect(
      reminderDue({
        dueAt,
        now: day(2),
        launchedAt: day(1),
        lastRemindedAt: null,
      }).due,
    ).toBe(false);
    expect(
      reminderDue({
        dueAt,
        now: day(3),
        launchedAt: day(1),
        lastRemindedAt: null,
      }).due,
    ).toBe(true);
  });
  it('recordatorios personalizados', () => {
    expect(
      reminderDue({
        dueAt,
        now: day(5),
        reminderDaysBefore: [5],
        lastRemindedAt: null,
      }),
    ).toMatchObject({ due: true, pointAt: day(5) });
  });
  it('escala a los escalate_after_days (3 por defecto) del vencimiento, una sola vez', () => {
    expect(REVIEW_DEFAULTS.escalateAfterDays).toBe(3);
    expect(escalationDue({ dueAt, now: day(12) })).toBe(false);
    expect(escalationDue({ dueAt, now: day(13) })).toBe(true);
    expect(escalationDue({ dueAt, now: day(20), escalatedAt: day(13) })).toBe(
      false,
    );
    expect(escalationDue({ dueAt, now: day(11), escalateAfterDays: 1 })).toBe(
      true,
    );
  });
});

describe('cierre de campaña · K-03 (auto-revocación, D-09)', () => {
  const campaign = {
    name: 'Certificación Q4-2026',
    kind: 'PERIODIC' as const,
    status: 'OPEN' as const,
    dueAt: new Date('2026-10-30T00:00:00-04:00'),
    graceDays: 7,
    uncertifiedAction: 'UNCERTIFIED_REVOKE' as const,
  };
  const pendingItem = (id: string, over: Record<string, unknown> = {}) => ({
    itemId: id,
    state: 'PENDING' as const,
    isEngagementItem: false,
    engagementState: 'ACTIVE' as const,
    grantRevoked: false,
    subjectUserId: `u-${id}`,
    supervisorUserId: 'u-owner',
    doctorUserIds: ['u-perez'],
    ...over,
  });
  const sweepAt = new Date('2026-11-06T10:30:00-04:00');

  it('campaignCloseAt = vencimiento + días de gracia', () => {
    expect(campaignCloseAt(campaign.dueAt, 7)).toEqual(
      new Date('2026-11-06T00:00:00-04:00'),
    );
  });
  it('K-03: al cierre los 3 ítems pendientes quedan AUTO_REVOKED con su motivo y avisos', () => {
    const plan = planCampaignClosure({
      campaign,
      items: [pendingItem('a'), pendingItem('b'), pendingItem('c')],
      now: sweepAt,
    });
    expect(plan.closes).toBe(true);
    expect(plan.actions).toHaveLength(3);
    for (const a of plan.actions) {
      expect(a).toMatchObject({
        to: 'AUTO_REVOKED',
        endedReason: 'No certificada en la campaña Certificación Q4-2026',
      });
      expect(a.notifyUserIds).toEqual(
        expect.arrayContaining(['u-owner', 'u-perez']),
      );
    }
    expect(plan.actions[0].notifyUserIds).toContain('u-a');
    expect(plan.actions.map((a) => a.itemId)).toEqual(['a', 'b', 'c']);
  });
  it('antes de vencer la gracia no cierra', () => {
    expect(
      planCampaignClosure({
        campaign,
        items: [pendingItem('a')],
        now: new Date('2026-11-05T23:00:00-04:00'),
      }),
    ).toMatchObject({ closes: false, reason: 'NOT_DUE', actions: [] });
  });
  it('lo ya decidido no se toca; los vínculos terminados o suspendidos y las concesiones ya revocadas se omiten (SKIPPED)', () => {
    const plan = planCampaignClosure({
      campaign,
      items: [
        pendingItem('a', { state: 'CERTIFIED' }),
        pendingItem('b', { engagementState: 'ENDED' }),
        pendingItem('c', { engagementState: 'SUSPENDED' }),
        pendingItem('d', { grantRevoked: true }),
        pendingItem('e'),
      ],
      now: sweepAt,
    });
    expect(plan.actions.map((a) => [a.itemId, a.to])).toEqual([
      ['b', 'SKIPPED'],
      ['c', 'SKIPPED'],
      ['d', 'SKIPPED'],
      ['e', 'AUTO_REVOKED'],
    ]);
  });
  it('un ítem de vínculo (recertificación) no se revoca solo: lo suspende el barrido de recertificación', () => {
    const plan = planCampaignClosure({
      campaign,
      items: [pendingItem('v', { isEngagementItem: true })],
      now: sweepAt,
    });
    expect(plan.actions).toEqual([
      expect.objectContaining({
        itemId: 'v',
        to: 'SKIPPED',
        reason: 'RECERTIFICATION_SWEEP',
      }),
    ]);
  });
  it('UNCERTIFIED_ESCALATE no cierra solo ni cambia nada; el cierre manual sí cierra y deja todo igual', () => {
    const esc = {
      ...campaign,
      uncertifiedAction: 'UNCERTIFIED_ESCALATE' as const,
    };
    expect(
      planCampaignClosure({
        campaign: esc,
        items: [pendingItem('a')],
        now: sweepAt,
      }),
    ).toMatchObject({
      closes: false,
      reason: 'MANUAL_CLOSE_ONLY',
      actions: [],
    });
    expect(
      planCampaignClosure({
        campaign: esc,
        items: [pendingItem('a')],
        now: sweepAt,
        manual: true,
      }),
    ).toMatchObject({ closes: true, actions: [] });
  });
  it('el cierre manual de una campaña UNCERTIFIED_REVOKE antes de tiempo también aplica la acción', () => {
    const plan = planCampaignClosure({
      campaign,
      items: [pendingItem('a')],
      now: new Date('2026-11-01T00:00:00-04:00'),
      manual: true,
    });
    expect(plan.closes).toBe(true);
    expect(plan.actions[0].to).toBe('AUTO_REVOKED');
  });
  it('una campaña que no está abierta no se cierra', () => {
    expect(
      planCampaignClosure({
        campaign: { ...campaign, status: 'CLOSED' },
        items: [pendingItem('a')],
        now: sweepAt,
      }),
    ).toMatchObject({ closes: false, reason: 'NOT_OPEN' });
  });
  it('D-09: por defecto lo no certificado se revoca, salvo en MOVER que solo escala', () => {
    expect(REVIEW_DEFAULTS.graceDays).toBe(7);
    expect(REVIEW_DEFAULTS.defaultUncertifiedAction('PERIODIC')).toBe(
      'UNCERTIFIED_REVOKE',
    );
    expect(REVIEW_DEFAULTS.defaultUncertifiedAction('RECERTIFICATION')).toBe(
      'UNCERTIFIED_REVOKE',
    );
    expect(REVIEW_DEFAULTS.defaultUncertifiedAction('REMEDIATION')).toBe(
      'UNCERTIFIED_REVOKE',
    );
    expect(REVIEW_DEFAULTS.defaultUncertifiedAction('MOVER')).toBe(
      'UNCERTIFIED_ESCALATE',
    );
  });
  it('propiedad: nunca se auto-revoca lo ya decidido ni lo de un vínculo', () => {
    const states = [
      'PENDING',
      'CERTIFIED',
      'REVOKED',
      'ADJUSTED',
      'AUTO_REVOKED',
      'SKIPPED',
    ] as const;
    for (const s of states)
      for (const eng of [true, false]) {
        const plan = planCampaignClosure({
          campaign,
          items: [pendingItem('x', { state: s, isEngagementItem: eng })],
          now: sweepAt,
        });
        for (const a of plan.actions) {
          if (a.to === 'AUTO_REVOKED') {
            expect(s).toBe('PENDING');
            expect(eng).toBe(false);
          }
        }
      }
  });
});

describe('recertificación mensual · K-04', () => {
  it('abre ítems de vínculo para quien vence en ≤ 30 días y no tiene ítem abierto, agrupados por mes (zona de la organización)', () => {
    const plan = planRecertificationItems({
      now: NOW,
      timeZone: 'America/La_Paz',
      engagements: [
        {
          engagementId: 'e-ana',
          state: 'ACTIVE',
          nextRecertificationAt: new Date('2026-11-23T00:00:00-04:00'),
          hasOpenItem: false,
        },
        {
          engagementId: 'e-lejos',
          state: 'ACTIVE',
          nextRecertificationAt: day(31),
          hasOpenItem: false,
        },
        {
          engagementId: 'e-ya',
          state: 'ACTIVE',
          nextRecertificationAt: day(5),
          hasOpenItem: true,
        },
        {
          engagementId: 'e-fin',
          state: 'ENDED',
          nextRecertificationAt: day(5),
          hasOpenItem: false,
        },
        {
          engagementId: 'e-susp',
          state: 'SUSPENDED',
          nextRecertificationAt: day(5),
          hasOpenItem: false,
        },
        {
          engagementId: 'e-sin',
          state: 'ACTIVE',
          nextRecertificationAt: null,
          hasOpenItem: false,
        },
        {
          engagementId: 'e-vencida',
          state: 'ACTIVE',
          nextRecertificationAt: day(-3),
          hasOpenItem: false,
        },
      ],
    });
    expect(
      plan.map((p) => [p.name, p.items.map((i) => i.engagementId)]),
    ).toEqual([
      ['Recertificación 2026-10', ['e-vencida']],
      ['Recertificación 2026-11', ['e-ana']],
    ]);
    expect(plan[1]).toMatchObject({
      kind: 'RECERTIFICATION',
      campaignDueAt: new Date('2026-11-23T00:00:00-04:00'),
    });
    expect(plan[1].items[0].dueAt).toEqual(
      new Date('2026-11-23T00:00:00-04:00'),
    );
  });
  it('la campaña vence cuando vence su último ítem', () => {
    const plan = planRecertificationItems({
      now: NOW,
      timeZone: 'America/La_Paz',
      engagements: [
        {
          engagementId: 'a',
          state: 'ACTIVE',
          nextRecertificationAt: new Date('2026-11-10T00:00:00-04:00'),
          hasOpenItem: false,
        },
        {
          engagementId: 'b',
          state: 'ACTIVE',
          nextRecertificationAt: new Date('2026-11-25T00:00:00-04:00'),
          hasOpenItem: false,
        },
      ],
    });
    expect(plan).toHaveLength(1);
    expect(plan[0].campaignDueAt).toEqual(
      new Date('2026-11-25T00:00:00-04:00'),
    );
    expect(plan[0].items.map((i) => i.engagementId)).toEqual(['a', 'b']);
  });
});

describe('cadencia (D-08)', () => {
  it('6 meses con algún átomo ALTA o CRÍTICA, 12 para el resto', () => {
    expect(reviewCadenceMonthsFor(['agenda.appointment.view'])).toBe(12);
    expect(
      reviewCadenceMonthsFor([
        'agenda.appointment.view',
        'billing.payment.collect',
      ]),
    ).toBe(6);
    expect(reviewCadenceMonthsFor(['billing.receipt.void'])).toBe(6);
    expect(reviewCadenceMonthsFor([])).toBe(12);
  });
  it('nextPeriodicReviewDue suma meses de calendario (fin de mes incluido)', () => {
    expect(nextPeriodicReviewDue(new Date('2026-01-31T12:00:00Z'), 6)).toEqual(
      new Date('2026-07-31T12:00:00Z'),
    );
    expect(nextPeriodicReviewDue(new Date('2026-08-31T12:00:00Z'), 6)).toEqual(
      new Date('2027-02-28T12:00:00Z'),
    );
    expect(nextPeriodicReviewDue(new Date('2026-03-15T12:00:00Z'), 12)).toEqual(
      new Date('2027-03-15T12:00:00Z'),
    );
  });
});

describe('summarizeCampaignResults · resultados de la campaña', () => {
  const launchedAt = day(-10);
  const r = (
    itemId: string,
    decision: Parameters<
      typeof summarizeCampaignResults
    >[0]['items'][number]['decision'],
    over: Record<string, unknown> = {},
  ) => ({
    itemId,
    decision,
    reviewerKind: 'ADMIN' as const,
    maxSensitivity: 'HIGH' as const,
    launchedAt,
    decidedAt: decision === 'PENDING' ? null : day(-8),
    ...over,
  });
  it('cuenta por decisión, revisor y sensibilidad; mide tiempo medio y cobertura; lista auto-revocados', () => {
    const s = summarizeCampaignResults({
      items: [
        r('a', 'CERTIFIED', { decidedAt: day(-9) }),
        r('b', 'REVOKED', {
          reviewerKind: 'SERVICE_HEAD',
          maxSensitivity: 'MEDIUM',
          decidedAt: day(-7),
        }),
        r('c', 'AUTO_REVOKED', { decidedAt: day(-3) }),
        r('d', 'PENDING'),
      ],
    });
    expect(s.total).toBe(4);
    expect(s.byDecision).toMatchObject({
      CERTIFIED: 1,
      REVOKED: 1,
      AUTO_REVOKED: 1,
      PENDING: 1,
      ADJUSTED: 0,
      SKIPPED: 0,
    });
    expect(s.byReviewerKind).toMatchObject({ ADMIN: 3, SERVICE_HEAD: 1 });
    expect(s.bySensitivity).toMatchObject({ HIGH: 3, MEDIUM: 1 });
    expect(s.pending).toBe(1);
    expect(s.coveragePercent).toBe(75);
    // Solo cuentan las decisiones humanas: 24 h y 72 h → 48 h.
    expect(s.meanResponseHours).toBe(48);
    expect(s.autoRevokedItemIds).toEqual(['c']);
  });
  it('sin ítems: cobertura 0 y sin tiempo medio', () => {
    expect(summarizeCampaignResults({ items: [] })).toMatchObject({
      total: 0,
      coveragePercent: 0,
      meanResponseHours: null,
      pending: 0,
    });
  });
  it('los omitidos cuentan como cubiertos y no entran en el tiempo medio', () => {
    const s = summarizeCampaignResults({
      items: [r('a', 'SKIPPED'), r('b', 'PENDING')],
    });
    expect(s.coveragePercent).toBe(50);
    expect(s.meanResponseHours).toBeNull();
  });
});
