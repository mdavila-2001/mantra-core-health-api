import {
  FOUR_EYES_DEFAULTS,
  FOUR_EYES_KINDS,
  FOUR_EYES_STATUSES,
  actionPayload,
  approvedUntilFor,
  approverKindForAtom,
  canTransition,
  cancelFourEyes,
  checkApproverEligibility,
  consumeFourEyes,
  decideFourEyes,
  eligibleApprovers,
  expireFourEyes,
  hashPayload,
  isDuplicatePending,
  payloadMatches,
  pendingExpiryFor,
  sweepAction,
  type ApproverDirectory,
  type ApprovalNeed,
  type FourEyesRequestState,
  type FourEyesStatus,
} from './support-four-eyes';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const minutes = (n: number, from = NOW): Date =>
  new Date(from.getTime() + n * 60_000);
const hours = (n: number, from = NOW): Date => minutes(n * 60, from);

const ANA = 'u-ana';
const MARCOS = 'u-marcos';
const SOFIA = 'u-sofia';
const GONZALO = 'u-gonzalo';
const ADMIN2 = 'u-admin-2';
const DR_ROJAS = 'u-rojas';
const DR_SUAREZ = 'u-suarez';
const DR_PEREZ = 'u-perez';

const directory = (
  over: Partial<ApproverDirectory> = {},
): ApproverDirectory => ({
  securityAdminUserIds: [GONZALO, ADMIN2],
  doctorUserIds: [],
  serviceHeadScopes: [],
  ...over,
});

const cancelA4 = actionPayload({
  atom: 'agenda.appointment.cancel',
  practitionerRoleAssignmentId: 'pra-suarez',
  patientProfileId: 'p-mateo',
  appointmentStartAt: new Date('2026-11-04T09:00:00-04:00'),
});
const cancelA1 = actionPayload({
  atom: 'agenda.appointment.cancel',
  practitionerRoleAssignmentId: 'pra-perez',
  patientProfileId: 'p-carmen',
  appointmentStartAt: new Date('2026-11-04T08:00:00-04:00'),
});

const pending = (
  over: Partial<FourEyesRequestState> = {},
): FourEyesRequestState => ({
  id: 'fe-1',
  kind: 'ACTION',
  status: 'PENDING',
  requesterUserId: MARCOS,
  subjectUserId: null,
  approverKind: 'DOCTOR',
  payloadHash: hashPayload(cancelA4),
  createdAt: NOW,
  expiresAt: hours(24),
  ...over,
});
const need = (over: Partial<ApprovalNeed> = {}): ApprovalNeed => ({
  kind: 'ACTION',
  approverKind: 'DOCTOR',
  requesterUserId: MARCOS,
  ...over,
});

describe('hashPayload · SHA-256 sobre JSON canónico', () => {
  it('es estable ante el orden de las claves y da 64 hexadecimales', () => {
    const h = hashPayload({ b: 1, a: [1, 2], c: { y: 1, x: 2 } });
    expect(h).toMatch(/^[0-9a-f]{64}$/);
    expect(hashPayload({ c: { x: 2, y: 1 }, a: [1, 2], b: 1 })).toBe(h);
  });
  it('cambia con cualquier cambio de contenido', () => {
    expect(hashPayload({ a: 1 })).not.toBe(hashPayload({ a: 2 }));
    expect(hashPayload({ a: [1, 2] })).not.toBe(hashPayload({ a: [2, 1] }));
  });
  it('actionPayload descarta lo ausente y fija la hora en ISO UTC', () => {
    expect(cancelA4).toEqual({
      atom: 'agenda.appointment.cancel',
      practitionerRoleAssignmentId: 'pra-suarez',
      patientProfileId: 'p-mateo',
      appointmentStartAt: '2026-11-04T13:00:00.000Z',
    });
  });
  it('payloadMatches compara contra el hash guardado', () => {
    expect(payloadMatches(hashPayload(cancelA4), cancelA4)).toBe(true);
    expect(payloadMatches(hashPayload(cancelA4), cancelA1)).toBe(false);
  });
});

describe('máquina de estados', () => {
  const ok: ReadonlyArray<[FourEyesStatus, FourEyesStatus]> = [
    ['PENDING', 'APPROVED'],
    ['PENDING', 'REJECTED'],
    ['PENDING', 'EXPIRED'],
    ['PENDING', 'CANCELLED'],
    ['APPROVED', 'EXECUTED'],
    ['APPROVED', 'EXPIRED'],
  ];
  it('solo estas seis transiciones existen', () => {
    const allowed = new Set(ok.map(([a, b]) => `${a}>${b}`));
    for (const from of FOUR_EYES_STATUSES)
      for (const to of FOUR_EYES_STATUSES)
        expect(canTransition(from, to)).toBe(allowed.has(`${from}>${to}`));
  });
  it('los cinco tipos del contrato', () => {
    expect([...FOUR_EYES_KINDS]).toEqual([
      'ACTION',
      'GRANT_CHANGE',
      'SOD_EXCEPTION',
      'REACTIVATION',
      'ENGAGEMENT_MOVE',
    ]);
  });
});

describe('plazos y TTL (§6.5)', () => {
  it('pendiente: 24 h para ACTION y 7 días para las administrativas', () => {
    expect(pendingExpiryFor('ACTION', NOW)).toEqual(hours(24));
    for (const k of [
      'GRANT_CHANGE',
      'SOD_EXCEPTION',
      'REACTIVATION',
      'ENGAGEMENT_MOVE',
    ] as const) {
      expect(pendingExpiryFor(k, NOW)).toEqual(
        new Date(NOW.getTime() + 7 * 86_400_000),
      );
    }
  });
  it('aprobada: solo ACTION fija approved_until = decisión + TTL (60 min por defecto)', () => {
    expect(FOUR_EYES_DEFAULTS.actionTtlMinutes).toBe(60);
    expect(approvedUntilFor('ACTION', NOW)).toEqual(minutes(60));
    expect(approvedUntilFor('ACTION', NOW, 15)).toEqual(minutes(15));
    expect(approvedUntilFor('ENGAGEMENT_MOVE', NOW)).toBeUndefined();
  });
  it('un TTL no válido cae al valor por defecto', () => {
    expect(approvedUntilFor('ACTION', NOW, 0)).toEqual(minutes(60));
    expect(approvedUntilFor('ACTION', NOW, Number.NaN)).toEqual(minutes(60));
  });
});

describe('eligibleApprovers · quién puede aprobar (§6.5.2)', () => {
  it('APPROVAL_DOCTOR: el doctor titular de la agenda de la acción', () => {
    const r = eligibleApprovers(
      need(),
      directory({ doctorUserIds: [DR_SUAREZ] }),
    );
    expect(r).toMatchObject({
      approverKind: 'DOCTOR',
      userIds: [DR_SUAREZ],
      fellBack: false,
      requiresStepUp: false,
    });
  });
  it('F-01: otro doctor (Pérez) no es elegible para una cita de Suárez', () => {
    const d = directory({ doctorUserIds: [DR_SUAREZ] });
    expect(checkApproverEligibility(need(), DR_PEREZ, d)).toEqual({
      eligible: false,
      reason: 'FOUR_EYES_NOT_ELIGIBLE',
    });
    expect(checkApproverEligibility(need(), DR_SUAREZ, d)).toEqual({
      eligible: true,
    });
  });
  it('SERVICE_HEAD: el administrador delegado cuyo alcance contiene el objetivo', () => {
    const d = directory({
      serviceHeadScopes: [
        {
          adminUserId: SOFIA,
          target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
        },
        {
          adminUserId: 'u-otra',
          target: { targetKind: 'SERVICE', healthcareServiceId: 'card' },
        },
      ],
    });
    const r = eligibleApprovers(
      need({
        approverKind: 'SERVICE_HEAD',
        target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
      }),
      d,
    );
    expect(r).toMatchObject({
      approverKind: 'SERVICE_HEAD',
      userIds: [SOFIA],
      fellBack: false,
    });
  });
  it('SECOND_APPROVER: otro SECURITY_ADMIN', () => {
    const r = eligibleApprovers(
      need({ approverKind: 'SECOND_APPROVER', requesterUserId: GONZALO }),
      directory(),
    );
    expect(r.userIds).toEqual([ADMIN2]);
  });
  it('sin aprobador resoluble de la clase pedida, cae a segundo aprobador', () => {
    const doctor = eligibleApprovers(need(), directory({ doctorUserIds: [] }));
    expect(doctor).toMatchObject({
      approverKind: 'SECOND_APPROVER',
      userIds: [ADMIN2, GONZALO].sort(),
      fellBack: true,
    });
    const head = eligibleApprovers(
      need({ approverKind: 'SERVICE_HEAD', target: { targetKind: 'ALL' } }),
      directory(),
    );
    expect(head).toMatchObject({
      approverKind: 'SECOND_APPROVER',
      fellBack: true,
    });
  });
  it('siempre: aprobador ≠ quien pide ≠ el beneficiario, y sin parentesco de cadena', () => {
    const d = directory({ doctorUserIds: [DR_ROJAS, ANA, MARCOS, SOFIA] });
    const r = eligibleApprovers(
      need({ subjectUserId: ANA, chainUserIds: [SOFIA, null] }),
      d,
    );
    expect(r.userIds).toEqual([DR_ROJAS]);
    expect([...r.excludedUserIds].sort()).toEqual([ANA, MARCOS, SOFIA].sort());
  });
  it('C-10: CRÍTICA solo SECURITY_ADMIN y con paso extra, aunque se pidiera el doctor', () => {
    const r = eligibleApprovers(
      need({ sensitivity: 'CRITICAL', requesterUserId: 'u-supervisor-caja' }),
      directory({ doctorUserIds: [DR_ROJAS] }),
    );
    expect(r).toMatchObject({
      approverKind: 'SECOND_APPROVER',
      requiresStepUp: true,
    });
    expect(r.userIds).toEqual([ADMIN2, GONZALO].sort());
  });
  it('L-05/D-19: reactivar por INVESTIGACIÓN solo SECURITY_ADMIN; por otro motivo, también un delegado con alcance', () => {
    const d = directory({
      serviceHeadScopes: [
        { adminUserId: SOFIA, target: { targetKind: 'ALL' } },
      ],
    });
    const base: ApprovalNeed = {
      kind: 'REACTIVATION',
      approverKind: 'SECOND_APPROVER',
      requesterUserId: 'u-pide',
      subjectUserId: ANA,
      target: { targetKind: 'SERVICE', healthcareServiceId: 'eco' },
    };
    const inv = eligibleApprovers(
      { ...base, suspensionReason: 'INVESTIGATION' },
      d,
    );
    expect(inv.userIds).toEqual([ADMIN2, GONZALO].sort());
    expect(
      checkApproverEligibility(
        { ...base, suspensionReason: 'INVESTIGATION' },
        SOFIA,
        d,
      ),
    ).toEqual({ eligible: false, reason: 'FOUR_EYES_NOT_ELIGIBLE' });
    expect(
      checkApproverEligibility(
        { ...base, suspensionReason: 'INVESTIGATION' },
        GONZALO,
        d,
      ),
    ).toEqual({ eligible: true });
    expect(
      checkApproverEligibility(
        { ...base, suspensionReason: 'MANUAL' },
        SOFIA,
        d,
      ),
    ).toEqual({ eligible: true });
  });
  it('S-02, L-04: SOD_EXCEPTION y ENGAGEMENT_MOVE: el que pide no aprueba; otro SECURITY_ADMIN sí', () => {
    for (const kind of [
      'SOD_EXCEPTION',
      'ENGAGEMENT_MOVE',
      'GRANT_CHANGE',
    ] as const) {
      const n: ApprovalNeed = {
        kind,
        approverKind: 'SECOND_APPROVER',
        requesterUserId: ADMIN2,
      };
      expect(checkApproverEligibility(n, ADMIN2, directory())).toEqual({
        eligible: false,
        reason: 'FOUR_EYES_SELF_APPROVAL',
      });
      expect(checkApproverEligibility(n, GONZALO, directory())).toEqual({
        eligible: true,
      });
    }
  });
  it('el beneficiario tampoco se aprueba a sí mismo', () => {
    expect(
      checkApproverEligibility(
        need({
          approverKind: 'SECOND_APPROVER',
          subjectUserId: GONZALO,
          requesterUserId: ADMIN2,
        }),
        GONZALO,
        directory(),
      ),
    ).toEqual({ eligible: false, reason: 'FOUR_EYES_SELF_APPROVAL' });
  });
  it('propiedad: el pedido y el beneficiario nunca están entre los aprobadores', () => {
    const users = [ANA, MARCOS, SOFIA, GONZALO, ADMIN2, DR_ROJAS, DR_SUAREZ];
    let seed = 11;
    const rnd = (n: number): number => {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed % n;
    };
    for (let i = 0; i < 300; i += 1) {
      const requester = users[rnd(users.length)];
      const subject = rnd(2) ? users[rnd(users.length)] : null;
      const kinds = ['DOCTOR', 'SERVICE_HEAD', 'SECOND_APPROVER'] as const;
      const r = eligibleApprovers(
        {
          kind: 'ACTION',
          approverKind: kinds[rnd(3)],
          requesterUserId: requester,
          subjectUserId: subject,
          sensitivity: rnd(4) === 0 ? 'CRITICAL' : 'HIGH',
          target: { targetKind: 'ALL' },
        },
        directory({
          doctorUserIds: [DR_ROJAS, users[rnd(users.length)]],
          serviceHeadScopes: [
            { adminUserId: SOFIA, target: { targetKind: 'ALL' } },
            {
              adminUserId: users[rnd(users.length)],
              target: { targetKind: 'ALL' },
            },
          ],
        }),
      );
      expect(r.userIds).not.toContain(requester);
      if (subject) expect(r.userIds).not.toContain(subject);
    }
  });
});

describe('approverKindForAtom', () => {
  it('traduce el modo de aprobación del catálogo', () => {
    expect(approverKindForAtom('DOCTOR')).toBe('DOCTOR');
    expect(approverKindForAtom('SECOND_APPROVER')).toBe('SECOND_APPROVER');
    expect(approverKindForAtom(null)).toBeNull();
  });
});

describe('decideFourEyes', () => {
  const d = directory({ doctorUserIds: [DR_SUAREZ] });
  const base = {
    request: pending(),
    approverUserId: DR_SUAREZ,
    comment: '',
    now: minutes(5),
    need: need(),
    directory: d,
  };

  it('F-01: el titular aprueba; ACTION fija approved_until y expires_at a decisión + 60 min', () => {
    const r = decideFourEyes({ ...base, decision: 'APPROVE' });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.request).toMatchObject({
      status: 'APPROVED',
      decidedByUserId: DR_SUAREZ,
      decidedAt: minutes(5),
      approvedUntil: minutes(65),
      expiresAt: minutes(65),
    });
    expect(r.request.consumedAt).toBeUndefined();
  });

  it('un tipo administrativo no fija approved_until y conserva su vencimiento', () => {
    const adm = pending({
      kind: 'ENGAGEMENT_MOVE',
      approverKind: 'SECOND_APPROVER',
      expiresAt: new Date(NOW.getTime() + 7 * 86_400_000),
    });
    const r = decideFourEyes({
      ...base,
      request: adm,
      need: {
        kind: 'ENGAGEMENT_MOVE',
        approverKind: 'SECOND_APPROVER',
        requesterUserId: MARCOS,
      },
      approverUserId: GONZALO,
      decision: 'APPROVE',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.request.approvedUntil).toBeUndefined();
      expect(r.request.expiresAt).toEqual(adm.expiresAt);
    }
  });

  it('el que pide no aprueba lo propio (403 FOUR_EYES_SELF_APPROVAL)', () => {
    expect(
      decideFourEyes({ ...base, approverUserId: MARCOS, decision: 'APPROVE' }),
    ).toEqual({ ok: false, reason: 'FOUR_EYES_SELF_APPROVAL' });
    expect(
      decideFourEyes({
        ...base,
        approverUserId: MARCOS,
        decision: 'REJECT',
        comment: 'no corresponde',
      }),
    ).toEqual({ ok: false, reason: 'FOUR_EYES_SELF_APPROVAL' });
  });

  it('quien no es elegible recibe FOUR_EYES_NOT_ELIGIBLE (F-01: Pérez)', () => {
    expect(
      decideFourEyes({
        ...base,
        approverUserId: DR_PEREZ,
        decision: 'APPROVE',
      }),
    ).toEqual({ ok: false, reason: 'FOUR_EYES_NOT_ELIGIBLE' });
  });

  it('REJECT exige comentario (al menos 5 caracteres)', () => {
    expect(
      decideFourEyes({ ...base, decision: 'REJECT', comment: '   ' }),
    ).toEqual({ ok: false, reason: 'COMMENT_REQUIRED' });
    expect(
      decideFourEyes({ ...base, decision: 'REJECT', comment: 'no' }),
    ).toEqual({ ok: false, reason: 'COMMENT_REQUIRED' });
    const ok = decideFourEyes({
      ...base,
      decision: 'REJECT',
      comment: 'No corresponde',
    });
    expect(ok.ok && ok.request).toMatchObject({
      status: 'REJECTED',
      decisionComment: 'No corresponde',
      decidedByUserId: DR_SUAREZ,
    });
  });

  it('solo lo pendiente se decide (409 FOUR_EYES_NOT_PENDING)', () => {
    for (const status of [
      'APPROVED',
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
      'EXECUTED',
    ] as const) {
      expect(
        decideFourEyes({
          ...base,
          request: pending({ status }),
          decision: 'APPROVE',
        }),
      ).toEqual({ ok: false, reason: 'FOUR_EYES_NOT_PENDING' });
    }
  });

  it('un pendiente vencido no se decide (409 FOUR_EYES_EXPIRED) y pide marcarlo vencido', () => {
    expect(
      decideFourEyes({ ...base, now: hours(25), decision: 'APPROVE' }),
    ).toEqual({
      ok: false,
      reason: 'FOUR_EYES_EXPIRED',
      shouldMarkExpired: true,
    });
    expect(
      decideFourEyes({ ...base, now: hours(24), decision: 'APPROVE' }),
    ).toMatchObject({ ok: false, reason: 'FOUR_EYES_EXPIRED' });
  });

  it('la decisión no muta la solicitud original', () => {
    const request = pending();
    const copy = JSON.stringify(request);
    decideFourEyes({ ...base, request, decision: 'APPROVE' });
    expect(JSON.stringify(request)).toBe(copy);
  });
});

describe('consumeFourEyes · consumo único, mismo átomo/objetivo/solicitante', () => {
  const approved = (
    over: Partial<FourEyesRequestState> = {},
  ): FourEyesRequestState =>
    pending({
      status: 'APPROVED',
      decidedAt: minutes(5),
      decidedByUserId: DR_SUAREZ,
      approvedUntil: minutes(65),
      expiresAt: minutes(65),
      ...over,
    });
  const use = (over: Partial<Parameters<typeof consumeFourEyes>[0]> = {}) => ({
    request: approved(),
    requesterUserId: MARCOS,
    payload: cancelA4,
    now: minutes(30),
    ...over,
  });

  it('C-03: la aprobación vigente se consume y deja constancia', () => {
    const r = consumeFourEyes(use());
    expect(r.ok).toBe(true);
    if (r.ok)
      expect(r.request).toMatchObject({
        status: 'EXECUTED',
        consumedAt: minutes(30),
        executedAt: minutes(30),
      });
  });

  it('C-03: el mismo id otra vez → FOUR_EYES_ALREADY_CONSUMED', () => {
    const first = consumeFourEyes(use());
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    expect(
      consumeFourEyes(use({ request: first.request, now: minutes(31) })),
    ).toEqual({ ok: false, reason: 'FOUR_EYES_ALREADY_CONSUMED' });
  });

  it('AC-10: de 10 usos «simultáneos» exactamente 1 tiene éxito (comparar y fijar)', () => {
    let state = approved();
    const results = Array.from({ length: 10 }, () => {
      // Cada intento ve el estado guardado, como la sentencia UPDATE … WHERE consumed_at IS NULL.
      const r = consumeFourEyes(use({ request: state }));
      if (r.ok) state = r.request;
      return r;
    });
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(
      results.filter((r) => !r.ok && r.reason === 'FOUR_EYES_ALREADY_CONSUMED'),
    ).toHaveLength(9);
  });

  it('F-01: a los 61 minutos caduca (FOUR_EYES_EXPIRED) y debe pasar a EXPIRED', () => {
    const r = consumeFourEyes(use({ now: minutes(5 + 61) }));
    expect(r).toEqual({
      ok: false,
      reason: 'FOUR_EYES_EXPIRED',
      shouldMarkExpired: true,
    });
    expect(consumeFourEyes(use({ now: minutes(64) })).ok).toBe(true);
    expect(consumeFourEyes(use({ now: minutes(65) })).ok).toBe(false);
  });

  it('F-01: el mismo id sobre otra cita (A1) → FOUR_EYES_PAYLOAD_CHANGED', () => {
    expect(consumeFourEyes(use({ payload: cancelA1 }))).toEqual({
      ok: false,
      reason: 'FOUR_EYES_PAYLOAD_CHANGED',
    });
  });

  it.each([
    ['otro átomo', { ...cancelA4, atom: 'agenda.appointment.reschedule' }],
    ['otro paciente', { ...cancelA4, patientProfileId: 'p-luis' }],
    [
      'otra hora',
      { ...cancelA4, appointmentStartAt: '2026-11-04T14:00:00.000Z' },
    ],
    ['otro doctor', { ...cancelA4, practitionerRoleAssignmentId: 'pra-perez' }],
    ['un campo de más', { ...cancelA4, careSpaceId: 'sp' }],
  ])('%s cambia el cuerpo', (_n, payload) => {
    expect(consumeFourEyes(use({ payload }))).toEqual({
      ok: false,
      reason: 'FOUR_EYES_PAYLOAD_CHANGED',
    });
  });

  it('otro solicitante recibe 404 uniforme (no se revela que existe)', () => {
    expect(consumeFourEyes(use({ requesterUserId: ANA }))).toEqual({
      ok: false,
      reason: 'NOT_FOUND',
    });
  });

  it.each(['PENDING', 'REJECTED', 'CANCELLED'] as const)(
    'una solicitud %s no se consume (la política responde APPROVAL_REQUIRED)',
    (status) => {
      expect(consumeFourEyes(use({ request: approved({ status }) }))).toEqual({
        ok: false,
        reason: 'NOT_APPROVED',
      });
    },
  );

  it('una solicitud marcada EXPIRED responde vencida', () => {
    expect(
      consumeFourEyes(use({ request: approved({ status: 'EXPIRED' }) })),
    ).toMatchObject({ ok: false, reason: 'FOUR_EYES_EXPIRED' });
  });

  it('los tipos administrativos no se consumen como acción', () => {
    expect(
      consumeFourEyes(use({ request: approved({ kind: 'ENGAGEMENT_MOVE' }) })),
    ).toEqual({ ok: false, reason: 'NOT_APPROVED' });
  });
});

describe('barrido: vencimientos', () => {
  it('un PENDING vencido y un APPROVED sin consumir pasado approved_until pasan a EXPIRED', () => {
    expect(sweepAction(pending(), hours(25))).toBe('EXPIRE');
    expect(sweepAction(pending(), hours(23))).toBeNull();
    const approved = pending({
      status: 'APPROVED',
      approvedUntil: minutes(65),
      expiresAt: minutes(65),
    });
    expect(sweepAction(approved, minutes(66))).toBe('EXPIRE');
    expect(sweepAction(approved, minutes(60))).toBeNull();
  });
  it('lo consumido, ejecutado o ya terminal no vence', () => {
    for (const status of [
      'EXECUTED',
      'REJECTED',
      'EXPIRED',
      'CANCELLED',
    ] as const) {
      expect(sweepAction(pending({ status }), hours(100))).toBeNull();
    }
    expect(
      sweepAction(
        pending({
          status: 'APPROVED',
          consumedAt: NOW,
          approvedUntil: minutes(1),
        }),
        hours(100),
      ),
    ).toBeNull();
  });
  it('expireFourEyes devuelve el estado EXPIRED solo si corresponde', () => {
    expect(expireFourEyes(pending(), hours(25))?.status).toBe('EXPIRED');
    expect(expireFourEyes(pending(), hours(1))).toBeUndefined();
  });
});

describe('cancelar y duplicados', () => {
  it('solo quien pide cancela lo pendiente', () => {
    expect(
      cancelFourEyes({ request: pending(), byUserId: MARCOS, now: minutes(1) }),
    ).toMatchObject({ ok: true, request: { status: 'CANCELLED' } });
    expect(
      cancelFourEyes({ request: pending(), byUserId: ANA, now: minutes(1) }),
    ).toEqual({ ok: false, reason: 'NOT_FOUND' });
    expect(
      cancelFourEyes({
        request: pending({ status: 'APPROVED' }),
        byUserId: MARCOS,
        now: minutes(1),
      }),
    ).toEqual({ ok: false, reason: 'FOUR_EYES_NOT_PENDING' });
  });
  it('FOUR_EYES_DUPLICATE_PENDING: mismo tipo, solicitante, permiso y cuerpo mientras haya uno pendiente', () => {
    const existing = [pending({ permissionCode: 'agenda.appointment.cancel' })];
    const dup = {
      kind: 'ACTION' as const,
      requesterUserId: MARCOS,
      permissionCode: 'agenda.appointment.cancel',
      payloadHash: hashPayload(cancelA4),
    };
    expect(isDuplicatePending(existing, dup)).toBe(true);
    expect(
      isDuplicatePending(existing, {
        ...dup,
        payloadHash: hashPayload(cancelA1),
      }),
    ).toBe(false);
    expect(isDuplicatePending(existing, { ...dup, requesterUserId: ANA })).toBe(
      false,
    );
    expect(
      isDuplicatePending(
        [
          pending({
            status: 'REJECTED',
            permissionCode: 'agenda.appointment.cancel',
          }),
        ],
        dup,
      ),
    ).toBe(false);
    expect(
      isDuplicatePending([pending({ permissionCode: null })], {
        ...dup,
        permissionCode: undefined,
      }),
    ).toBe(true);
  });
});
