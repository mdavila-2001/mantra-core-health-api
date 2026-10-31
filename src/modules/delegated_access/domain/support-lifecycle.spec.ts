import {
  DEFAULT_INACTIVITY_DAYS,
  JOINER_ITEM_CODES,
  MOVER_REVIEW_POLICY,
  OFFBOARD_PHASES,
  ONBOARDING_DUE_DAYS,
  assessInactivity,
  canComplete,
  canReactivate,
  canSuspend,
  checklistFor,
  completeChecklistItem,
  evaluateJoinerChecklist,
  leaverCaseStatus,
  moveRequiresFourEyes,
  onboardingDueAt,
  onboardingGate,
  ownerEligibility,
  ownerlessReasons,
  pendingRequired,
  planHandover,
  planMove,
  reactivationReview,
  verifyRevokeBeforeReassign,
  type HandoverCandidate,
  type JoinerFacts,
  type MoveCurrentGrant,
  type MoveGrantInput,
} from './support-lifecycle';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const day = (n: number, from = NOW): Date =>
  new Date(from.getTime() + n * 86_400_000);

const readyFacts = (over: Partial<JoinerFacts> = {}): JoinerFacts => ({
  now: NOW,
  platformIdentityVerified: true,
  confidentialityAckAt: day(-1),
  mfaEnrolled: true,
  requireMfa: true,
  supervisorUserId: 'u-owner',
  scopeBlocked: false,
  nextRecertificationAt: day(180),
  doctorAcceptancesPending: 0,
  doctorAcceptancesTotal: 2,
  ...over,
});
const statusOf = (
  items: ReturnType<typeof evaluateJoinerChecklist>,
  code: string,
): string | undefined => items.find((i) => i.code === code)?.status;

describe('lista de verificación de ingreso (joiner, §6.1)', () => {
  it('trae los 7 ítems del contrato, en orden', () => {
    expect([...JOINER_ITEM_CODES]).toEqual([
      'IDENTITY_VERIFIED',
      'CONFIDENTIALITY_ACK',
      'MFA_ENROLLED',
      'SUPERVISOR_ASSIGNED',
      'SCOPE_REVIEWED',
      'FIRST_REVIEW_SCHEDULED',
      'DOCTOR_ACCEPTANCES',
    ]);
    expect(evaluateJoinerChecklist(readyFacts()).map((i) => i.code)).toEqual([
      ...JOINER_ITEM_CODES,
    ]);
  });

  it('todo listo: se puede completar', () => {
    const items = evaluateJoinerChecklist(readyFacts());
    expect(items.every((i) => i.status === 'DONE')).toBe(true);
    expect(canComplete(items)).toBe(true);
    expect(pendingRequired(items)).toEqual([]);
  });

  it('IDENTITY_VERIFIED: automático con la identidad de la plataforma; si no, la registra un administrador', () => {
    expect(
      statusOf(
        evaluateJoinerChecklist(readyFacts({ platformIdentityVerified: true })),
        'IDENTITY_VERIFIED',
      ),
    ).toBe('DONE');
    expect(
      statusOf(
        evaluateJoinerChecklist(
          readyFacts({ platformIdentityVerified: false }),
        ),
        'IDENTITY_VERIFIED',
      ),
    ).toBe('PENDING');
    expect(
      statusOf(
        evaluateJoinerChecklist(
          readyFacts({
            platformIdentityVerified: false,
            identityVerifiedAt: day(-1),
          }),
        ),
        'IDENTITY_VERIFIED',
      ),
    ).toBe('DONE');
  });

  it('MFA_ENROLLED es obligatorio solo si la organización exige require_mfa; si no, recomendado', () => {
    const must = evaluateJoinerChecklist(
      readyFacts({ mfaEnrolled: false, requireMfa: true }),
    );
    expect(must.find((i) => i.code === 'MFA_ENROLLED')).toMatchObject({
      required: true,
      status: 'PENDING',
    });
    expect(canComplete(must)).toBe(false);
    const soft = evaluateJoinerChecklist(
      readyFacts({ mfaEnrolled: false, requireMfa: false }),
    );
    expect(soft.find((i) => i.code === 'MFA_ENROLLED')).toMatchObject({
      required: false,
      status: 'PENDING',
    });
    expect(canComplete(soft)).toBe(true);
  });

  it('SCOPE_REVIEWED queda pendiente con un hallazgo BLOQUEAR o EXIGIR APROBACIÓN sin excepción', () => {
    expect(
      statusOf(
        evaluateJoinerChecklist(readyFacts({ scopeBlocked: true })),
        'SCOPE_REVIEWED',
      ),
    ).toBe('PENDING');
  });

  it('SUPERVISOR_ASSIGNED, CONFIDENTIALITY_ACK y FIRST_REVIEW_SCHEDULED son obligatorios', () => {
    const items = evaluateJoinerChecklist(
      readyFacts({
        supervisorUserId: null,
        confidentialityAckAt: null,
        nextRecertificationAt: null,
      }),
    );
    expect(pendingRequired(items)).toEqual([
      'CONFIDENTIALITY_ACK',
      'SUPERVISOR_ASSIGNED',
      'FIRST_REVIEW_SCHEDULED',
    ]);
  });

  it('DOCTOR_ACCEPTANCES es solo informativo: cuenta los pendientes y nunca bloquea', () => {
    const items = evaluateJoinerChecklist(
      readyFacts({ doctorAcceptancesPending: 2, doctorAcceptancesTotal: 2 }),
    );
    const item = items.find((i) => i.code === 'DOCTOR_ACCEPTANCES');
    expect(item).toMatchObject({
      required: false,
      status: 'PENDING',
      pendingCount: 2,
    });
    expect(canComplete(items)).toBe(true);
  });

  it('completeChecklistItem: un ítem automático no se marca a mano (409 LIFECYCLE_ITEM_AUTOMATIC)', () => {
    const items = evaluateJoinerChecklist(readyFacts({ mfaEnrolled: false }));
    expect(completeChecklistItem(items, 'MFA_ENROLLED', NOW)).toEqual({
      ok: false,
      reason: 'LIFECYCLE_ITEM_AUTOMATIC',
    });
    expect(completeChecklistItem(items, 'NO_EXISTE', NOW)).toEqual({
      ok: false,
      reason: 'LIFECYCLE_ITEM_UNKNOWN',
    });
  });

  it('B-M5 · completeChecklistItem: CONFIDENTIALITY_ACK no se marca a mano (la acepta la propia persona por su ruta)', () => {
    const items = checklistFor('JOINER');
    expect(completeChecklistItem(items, 'CONFIDENTIALITY_ACK', NOW)).toEqual({
      ok: false,
      reason: 'LIFECYCLE_ITEM_AUTOMATIC',
    });
  });

  it('completeChecklistItem: los manuales (y el de identidad) sí, sin mutar el original', () => {
    const items = evaluateJoinerChecklist(
      readyFacts({ supervisorUserId: null, platformIdentityVerified: false }),
    );
    const r = completeChecklistItem(items, 'SUPERVISOR_ASSIGNED', NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(
        r.items.find((i) => i.code === 'SUPERVISOR_ASSIGNED'),
      ).toMatchObject({ status: 'DONE', completedAt: NOW });
      expect(items.find((i) => i.code === 'SUPERVISOR_ASSIGNED')?.status).toBe(
        'PENDING',
      );
    }
    expect(completeChecklistItem(items, 'IDENTITY_VERIFIED', NOW).ok).toBe(
      true,
    );
  });
});

describe('compuerta de ingreso · ONBOARDING_INCOMPLETE (D-03)', () => {
  const since = new Date('2026-11-02T00:00:00Z');
  const settings = { onboardingRequired: true, onboardingRequiredSince: since };
  const pendingItems = evaluateJoinerChecklist(
    readyFacts({ supervisorUserId: null }),
  );
  const doneItems = evaluateJoinerChecklist(readyFacts());

  it('L-06: vínculo posterior a la compuerta y sin completar bloquea y dice qué falta', () => {
    const g = onboardingGate({
      settings,
      engagementCreatedAt: day(0),
      checklist: pendingItems,
    });
    expect(g).toMatchObject({
      incomplete: true,
      applies: true,
      pending: ['SUPERVISOR_ASSIGNED'],
      reason: 'INCOMPLETE',
    });
  });
  it('L-06: al asignar dueño se libera', () => {
    expect(
      onboardingGate({
        settings,
        engagementCreatedAt: day(0),
        checklist: doneItems,
      }),
    ).toMatchObject({ incomplete: false, reason: 'COMPLETED' });
  });
  it('un vínculo anterior a onboardingRequiredSince nunca pasa por la compuerta', () => {
    expect(
      onboardingGate({
        settings,
        engagementCreatedAt: day(-30),
        checklist: pendingItems,
      }),
    ).toMatchObject({
      incomplete: false,
      applies: false,
      reason: 'PREDATES_GATE',
    });
  });
  it('con la compuerta apagada nada bloquea, aunque falte todo', () => {
    expect(
      onboardingGate({
        settings: { onboardingRequired: false },
        engagementCreatedAt: day(0),
        checklist: pendingItems,
      }),
    ).toMatchObject({ incomplete: false, reason: 'DISABLED' });
  });
  it('onboarding_completed_at fijado cierra la compuerta (también lo marcado «previo a la compuerta»)', () => {
    expect(
      onboardingGate({
        settings,
        engagementCreatedAt: day(0),
        onboardingCompletedAt: day(0),
        checklist: pendingItems,
      }),
    ).toMatchObject({ incomplete: false, reason: 'COMPLETED' });
  });
  it('sin fecha de inicio de la compuerta rige para todo vínculo sin marca de completo', () => {
    expect(
      onboardingGate({
        settings: { onboardingRequired: true },
        engagementCreatedAt: day(-400),
        checklist: pendingItems,
      }).incomplete,
    ).toBe(true);
  });
  it('plazo de 7 días: vencido aparece como «ingreso sin completar»', () => {
    expect(ONBOARDING_DUE_DAYS).toBe(7);
    expect(onboardingDueAt(day(0))).toEqual(day(7));
    const gate = (now: Date) =>
      onboardingGate({
        settings,
        engagementCreatedAt: day(0),
        checklist: pendingItems,
        now,
      });
    expect(gate(day(6)).overdue).toBe(false);
    expect(gate(day(7)).overdue).toBe(true);
    expect(
      onboardingGate({
        settings,
        engagementCreatedAt: day(0),
        checklist: doneItems,
        now: day(30),
      }).overdue,
    ).toBe(false);
  });
});

describe('moveRequiresFourEyes · L-04 (§6.1 paso 2)', () => {
  it('sube más de 10 puntos ⇒ cuatro ojos', () => {
    const before = ['agenda.appointment.view'];
    const after = [
      ...before,
      'agenda.appointment.view.patient_document',
      'patients.profile.view.document_full',
      'patients.clinical.request_temporary_access',
    ];
    const r = moveRequiresFourEyes(before, after);
    expect(r.delta).toBeGreaterThan(10);
    expect(r.requiresFourEyes).toBe(true);
    expect(r.reasons).toContain('SCORE_INCREASE');
  });
  it('+4 sin átomos ALTA: se ejecuta directo', () => {
    const r = moveRequiresFourEyes(
      [],
      ['billing.invoice.view', 'patients.coverage.view'],
    );
    expect(r).toMatchObject({ delta: 4, requiresFourEyes: false, reasons: [] });
  });
  it('exactamente +10 no basta (es «más de 10»), pero un átomo ALTA nuevo sí aunque sume poco', () => {
    const ten = moveRequiresFourEyes(
      [],
      ['billing.payment.collect', 'billing.receipt.issue'],
    );
    expect(ten.delta).toBe(10);
    expect(ten.reasons).toEqual(['NEW_HIGH_SENSITIVITY']);
    const high = moveRequiresFourEyes([], ['billing.payment.collect']);
    expect(high).toMatchObject({
      delta: 5,
      requiresFourEyes: true,
      reasons: ['NEW_HIGH_SENSITIVITY'],
    });
    const both = moveRequiresFourEyes(
      [],
      [
        'billing.payment.collect',
        'billing.receipt.issue',
        'billing.discount.apply',
      ],
    );
    expect(both.reasons).toEqual(['SCORE_INCREASE', 'NEW_HIGH_SENSITIVITY']);
  });
  it('quitar o mantener nunca pide cuatro ojos; un ALTA que ya tenía no es «nuevo»', () => {
    expect(moveRequiresFourEyes(['billing.payment.collect'], [])).toMatchObject(
      { requiresFourEyes: false },
    );
    expect(
      moveRequiresFourEyes(
        ['billing.payment.collect'],
        ['billing.payment.collect', 'billing.invoice.view'],
      ).requiresFourEyes,
    ).toBe(false);
  });
  it('el umbral es un parámetro (por defecto 10)', () => {
    expect(
      moveRequiresFourEyes(
        [],
        ['billing.invoice.view', 'patients.coverage.view'],
        3,
      ).requiresFourEyes,
    ).toBe(true);
  });
});

describe('planMove · cambio de rol o alcance (§6.1)', () => {
  const g = (
    grantId: string,
    actions: string[],
    over: Partial<Omit<MoveGrantInput, 'grantId'>> = {},
  ): MoveCurrentGrant => ({
    grantId,
    targetKind: 'ALL',
    actions,
    ...over,
  });
  const effectiveAt = NOW;

  it('L-03: lo que no está en el nuevo conjunto vence en effectiveAt; lo nuevo se crea; lo igual se conserva', () => {
    const current = [
      g('g-eco', ['agenda.appointment.view'], {
        targetKind: 'SERVICE',
        healthcareServiceId: 'eco',
      }),
      g('g-norte', ['agenda.appointment.view'], {
        targetKind: 'PRACTITIONER_LOCATION',
        practitionerProfileId: 'suarez',
        careSpaceId: 'norte',
      }),
      g('g-keep', ['agenda.appointment.check_in'], {
        targetKind: 'SERVICE',
        healthcareServiceId: 'card',
      }),
    ];
    const proposed: MoveGrantInput[] = [
      {
        targetKind: 'SERVICE',
        healthcareServiceId: 'card',
        actions: ['agenda.appointment.check_in'],
        grantId: undefined,
      } as unknown as MoveGrantInput,
      {
        targetKind: 'LOCATION',
        careSpaceId: 'piso-2',
        actions: ['agenda.appointment.check_in', 'agenda.appointment.view'],
        grantId: 'new',
      } as MoveGrantInput,
    ];
    const plan = planMove({
      currentGrants: current,
      newGrants: proposed,
      effectiveAt,
      now: NOW,
    });
    expect(plan.revoke.map((r) => r.grantId).sort()).toEqual([
      'g-eco',
      'g-norte',
    ]);
    expect(
      plan.revoke.every((r) => r.validTo.getTime() === effectiveAt.getTime()),
    ).toBe(true);
    expect(plan.keep.map((k) => k.grantId)).toEqual(['g-keep']);
    expect(plan.create).toHaveLength(1);
    expect(plan.create[0].careSpaceId).toBe('piso-2');
  });

  it('conjunto vacío: revoca todo (mínimo privilegio, sin gracia)', () => {
    const plan = planMove({
      currentGrants: [
        g('a', ['agenda.appointment.view']),
        g('b', ['agenda.appointment.cancel']),
      ],
      newGrants: [],
      effectiveAt,
      now: NOW,
    });
    expect(plan.revoke).toHaveLength(2);
    expect(plan.create).toEqual([]);
  });

  it('un permiso con el mismo objetivo pero otros átomos o condición es otro: se revoca el anterior y se crea el nuevo', () => {
    const current = [g('a', ['agenda.appointment.view'])];
    const changedAtoms = planMove({
      currentGrants: current,
      newGrants: [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.view', 'agenda.appointment.cancel'],
        } as MoveGrantInput,
      ],
      effectiveAt,
      now: NOW,
    });
    expect(changedAtoms.revoke.map((r) => r.grantId)).toEqual(['a']);
    expect(changedAtoms.create).toHaveLength(1);
    const changedCondition = planMove({
      currentGrants: current,
      newGrants: [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.view'],
          condition: { schemaVersion: 1 },
        } as MoveGrantInput,
      ],
      effectiveAt,
      now: NOW,
    });
    expect(changedCondition.revoke).toHaveLength(1);
    const same = planMove({
      currentGrants: current,
      newGrants: [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.view'],
        } as MoveGrantInput,
      ],
      effectiveAt,
      now: NOW,
    });
    expect(same.revoke).toEqual([]);
    expect(same.create).toEqual([]);
    expect(same.keep).toHaveLength(1);
  });

  it('el orden de los átomos no importa para reconocer el mismo permiso', () => {
    const plan = planMove({
      currentGrants: [
        g('a', ['agenda.appointment.view', 'agenda.appointment.cancel']),
      ],
      newGrants: [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.cancel', 'agenda.appointment.view'],
        } as MoveGrantInput,
      ],
      effectiveAt,
      now: NOW,
    });
    expect(plan.keep).toHaveLength(1);
  });

  it('calcula puntaje antes y después y decide los cuatro ojos', () => {
    const plan = planMove({
      currentGrants: [g('a', ['agenda.appointment.view'])],
      newGrants: [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.view'],
        } as MoveGrantInput,
        {
          targetKind: 'ALL',
          actions: [
            'patients.profile.view.document_full',
            'patients.clinical.request_temporary_access',
            'agenda.appointment.view.patient_document',
          ],
        } as MoveGrantInput,
      ],
      effectiveAt,
      now: NOW,
    });
    expect(plan.scoreAfter).toBeGreaterThan(plan.scoreBefore);
    expect(plan.fourEyes.requiresFourEyes).toBe(true);
    const down = planMove({
      currentGrants: [g('a', ['billing.payment.collect'])],
      newGrants: [],
      effectiveAt,
      now: NOW,
    });
    expect(down.fourEyes.requiresFourEyes).toBe(false);
    expect(down.scoreAfter).toBeLessThan(down.scoreBefore);
  });

  describe('B-M4: el cuatro ojos del mover también mira alcance, condiciones, vigencia y prohibiciones', () => {
    const DOCTOR = {
      targetKind: 'PRACTITIONER',
      practitionerRoleAssignmentId: 'R1',
      practitionerProfileId: 'P1',
    } as const;
    const plan = (
      currentGrants: MoveCurrentGrant[],
      newGrants: MoveGrantInput[],
    ) => planMove({ currentGrants, newGrants, effectiveAt, now: NOW });

    it('ampliar a ALL con los MISMOS átomos (delta 0) pide cuatro ojos: SCOPE_WIDENED', () => {
      const r = plan(
        [g('a', ['agenda.appointment.cancel'], { ...DOCTOR })],
        [
          {
            targetKind: 'ALL',
            actions: ['agenda.appointment.cancel'],
          } as MoveGrantInput,
        ],
      );
      expect(r.fourEyes.delta).toBe(0);
      expect(r.fourEyes.requiresFourEyes).toBe(true);
      expect(r.fourEyes.reasons).toContain('SCOPE_WIDENED');
    });

    it('conservar el alcance o estrechar NO lo pide (de ALL a un doctor; ALL igual a ALL)', () => {
      expect(
        plan(
          [g('a', ['agenda.appointment.cancel'])],
          [
            {
              ...DOCTOR,
              actions: ['agenda.appointment.cancel'],
            } as MoveGrantInput,
          ],
        ).fourEyes.requiresFourEyes,
      ).toBe(false);
      expect(
        plan(
          [g('a', ['agenda.appointment.cancel'])],
          [
            {
              targetKind: 'ALL',
              actions: ['agenda.appointment.cancel'],
            } as MoveGrantInput,
          ],
        ).fourEyes.requiresFourEyes,
      ).toBe(false);
    });

    it('cambiar de doctor o de servicio concreto (L-03) no es «ampliar a ALL»', () => {
      const r = plan(
        [
          g('a', ['agenda.appointment.view'], {
            targetKind: 'SERVICE',
            healthcareServiceId: 'eco',
          }),
        ],
        [
          {
            targetKind: 'LOCATION',
            careSpaceId: 'piso-2',
            actions: ['agenda.appointment.view'],
          } as MoveGrantInput,
        ],
      );
      expect(r.fourEyes.reasons).not.toContain('SCOPE_WIDENED');
    });

    it('un FIXED propuesto sin foto se mide como su peor caso (DYNAMIC): ALL_SERVICES sigue siendo ampliar', () => {
      const r = plan(
        [g('a', ['agenda.appointment.view'], { ...DOCTOR })],
        [
          {
            targetKind: 'ALL_SERVICES',
            expansionMode: 'FIXED',
            actions: ['agenda.appointment.view'],
          } as MoveGrantInput,
        ],
      );
      expect(r.fourEyes.reasons).toContain('SCOPE_WIDENED');
    });

    it('quitar la condición (o dejarla más floja) en un permiso que sigue existiendo: CONDITIONS_REMOVED', () => {
      const cond = {
        schemaVersion: 1,
        time: { windows: [{ days: [1], from: '08:00', to: '12:00' }] },
      };
      const current = [
        g('a', ['agenda.appointment.cancel'], { condition: cond }),
      ];
      const dropped = plan(current, [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.cancel'],
        } as MoveGrantInput,
      ]);
      expect(dropped.fourEyes.reasons).toContain('CONDITIONS_REMOVED');
      expect(dropped.fourEyes.requiresFourEyes).toBe(true);
      // Agregar una restricción conserva la anterior: no se pide.
      const tighter = plan(current, [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.cancel'],
          condition: { ...cond, network: 'ORG_RULES' },
        } as MoveGrantInput,
      ]);
      expect(tighter.fourEyes.reasons).not.toContain('CONDITIONS_REMOVED');
      // Si el acceso desaparece, la condición ya no importa.
      const gone = plan(current, []);
      expect(gone.fourEyes.reasons).not.toContain('CONDITIONS_REMOVED');
    });

    it('agregar OTRO permiso sin condición sobre lo mismo también afloja (la unión gana)', () => {
      const cond = { schemaVersion: 1, network: 'ORG_RULES' };
      const same = {
        targetKind: 'ALL',
        actions: ['agenda.appointment.cancel'],
        condition: cond,
      } as MoveGrantInput;
      const r = plan(
        [g('a', ['agenda.appointment.cancel'], { condition: cond })],
        [
          same,
          {
            targetKind: 'ALL',
            actions: ['agenda.appointment.cancel', 'agenda.appointment.view'],
          } as MoveGrantInput,
        ],
      );
      expect(r.fourEyes.reasons).toContain('CONDITIONS_REMOVED');
    });

    it('quitar o alargar la vigencia: VALIDITY_REMOVED', () => {
      const validTo = new Date(NOW.getTime() + 30 * 86_400_000);
      const current = [g('a', ['agenda.appointment.cancel'], { validTo })];
      expect(
        plan(current, [
          {
            targetKind: 'ALL',
            actions: ['agenda.appointment.cancel'],
          } as MoveGrantInput,
        ]).fourEyes.reasons,
      ).toContain('VALIDITY_REMOVED');
      expect(
        plan(current, [
          {
            targetKind: 'ALL',
            actions: ['agenda.appointment.cancel'],
            validTo: new Date(validTo.getTime() + 86_400_000),
          } as MoveGrantInput,
        ]).fourEyes.reasons,
      ).toContain('VALIDITY_REMOVED');
      expect(
        plan(current, [
          {
            targetKind: 'ALL',
            actions: ['agenda.appointment.cancel'],
            validTo: new Date(validTo.getTime() - 86_400_000),
          } as MoveGrantInput,
        ]).fourEyes.reasons,
      ).not.toContain('VALIDITY_REMOVED');
    });

    it('borrar una prohibición DENY (no está en el conjunto propuesto): DENY_REMOVED', () => {
      const r = plan(
        [
          g('a', ['agenda.appointment.cancel']),
          g('d', ['agenda.appointment.cancel'], { ...DOCTOR, effect: 'DENY' }),
        ],
        [
          {
            targetKind: 'ALL',
            actions: ['agenda.appointment.cancel'],
          } as MoveGrantInput,
        ],
      );
      expect(r.revoke.map((x) => x.grantId)).toEqual(['d']);
      expect(r.fourEyes.reasons).toContain('DENY_REMOVED');
      expect(r.fourEyes.requiresFourEyes).toBe(true);
      // Si el cuerpo la conserva, no hay nada que aprobar.
      const kept = plan(
        [
          g('a', ['agenda.appointment.cancel']),
          g('d', ['agenda.appointment.cancel'], { ...DOCTOR, effect: 'DENY' }),
        ],
        [
          {
            targetKind: 'ALL',
            actions: ['agenda.appointment.cancel'],
          } as MoveGrantInput,
          {
            ...DOCTOR,
            effect: 'DENY',
            actions: ['agenda.appointment.cancel'],
          } as MoveGrantInput,
        ],
      );
      expect(kept.fourEyes.reasons).not.toContain('DENY_REMOVED');
    });
  });

  it('abre una campaña MOVER: un ítem por concesión nueva, 14 días, solo escala', () => {
    expect(MOVER_REVIEW_POLICY).toEqual({
      kind: 'MOVER',
      dueDays: 14,
      uncertifiedAction: 'UNCERTIFIED_ESCALATE',
    });
    const plan = planMove({
      currentGrants: [],
      newGrants: [
        {
          targetKind: 'ALL',
          actions: ['agenda.appointment.view'],
        } as MoveGrantInput,
        {
          targetKind: 'SERVICE',
          healthcareServiceId: 'eco',
          actions: ['agenda.appointment.view'],
        } as MoveGrantInput,
      ],
      effectiveAt,
      now: NOW,
    });
    expect(plan.review).toMatchObject({
      kind: 'MOVER',
      itemCount: 2,
      dueAt: day(14),
      uncertifiedAction: 'UNCERTIFIED_ESCALATE',
    });
    expect(plan.review.newGrantIndexes).toEqual([0, 1]);
  });

  it('las concesiones DENY nuevas no cuentan para el puntaje', () => {
    const plan = planMove({
      currentGrants: [],
      newGrants: [
        {
          targetKind: 'ALL',
          actions: ['billing.payment.collect'],
          effect: 'DENY',
        } as MoveGrantInput,
      ],
      effectiveAt,
      now: NOW,
    });
    expect(plan.scoreAfter).toBe(0);
  });

  it('propiedad: lo conservado, lo revocado y lo creado son coherentes con los conjuntos', () => {
    const pool: MoveGrantInput[] = [
      {
        targetKind: 'ALL',
        actions: ['agenda.appointment.view'],
      } as MoveGrantInput,
      {
        targetKind: 'SERVICE',
        healthcareServiceId: 'eco',
        actions: ['agenda.appointment.cancel'],
      } as MoveGrantInput,
      {
        targetKind: 'SERVICE',
        healthcareServiceId: 'card',
        actions: ['agenda.appointment.view'],
      } as MoveGrantInput,
      {
        targetKind: 'ALL',
        actions: ['billing.payment.collect'],
      } as MoveGrantInput,
    ];
    for (let mask = 0; mask < 16; mask += 1) {
      for (let mask2 = 0; mask2 < 16; mask2 += 1) {
        const current = pool
          .filter((_, i) => mask & (1 << i))
          .map((p, i) => ({
            ...p,
            grantId: `g${i}-${p.actions[0]}-${p.healthcareServiceId ?? ''}`,
          }));
        const next = pool.filter((_, i) => mask2 & (1 << i));
        const plan = planMove({
          currentGrants: current,
          newGrants: next,
          effectiveAt,
          now: NOW,
        });
        expect(plan.keep.length + plan.revoke.length).toBe(current.length);
        expect(plan.keep.length + plan.create.length).toBe(next.length);
      }
    }
  });
});

describe('planHandover · baja (leaver) con reasignación (§6.1)', () => {
  const ANA = 'u-ana';
  const PABLO = 'u-pablo';
  const conv = (id: string, doctor: string): HandoverCandidate => ({
    id,
    kind: 'CONVERSATION',
    fromUserId: PABLO,
    practitionerProfileId: doctor,
  });
  const task = (id: string): HandoverCandidate => ({
    id,
    kind: 'WORKFLOW_TASK',
    fromUserId: PABLO,
  });
  const booking = (id: string): HandoverCandidate => ({
    id,
    kind: 'PENDING_BOOKING',
    fromUserId: PABLO,
  });
  const supervised = (id: string): HandoverCandidate => ({
    id,
    kind: 'SUPERVISED_ENGAGEMENT',
    fromUserId: PABLO,
  });
  const pablosWork = [
    conv('c1', 'perez'),
    conv('c2', 'perez'),
    conv('c3', 'mendez'),
    task('t1'),
    task('t2'),
    booking('b1'),
  ];
  const replyersByDoctor = { perez: [ANA], mendez: [] };

  it('L-01: C1, C2, T1, T2 y la cita a Ana; C3 vuelve a la bandeja común (Ana no cubre a Méndez)', () => {
    const plan = planHandover({
      items: pablosWork,
      handover: { defaultToUserId: ANA },
      replyersByDoctor,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    const by = Object.fromEntries(plan.assignments.map((a) => [a.itemId, a]));
    expect(by.c1).toMatchObject({ toUserId: ANA, status: 'REASSIGNED' });
    expect(by.c2).toMatchObject({ toUserId: ANA, status: 'REASSIGNED' });
    expect(by.c3).toMatchObject({ toUserId: null, status: 'RETURNED_TO_POOL' });
    expect(by.t1).toMatchObject({ toUserId: ANA, status: 'REASSIGNED' });
    expect(by.t2).toMatchObject({ toUserId: ANA, status: 'REASSIGNED' });
    expect(
      plan.assignments.filter((a) => a.status === 'REASSIGNED'),
    ).toHaveLength(5);
    expect(
      plan.assignments.filter((a) => a.status === 'RETURNED_TO_POOL'),
    ).toHaveLength(1);
    expect(plan.assignments).toHaveLength(6);
    expect(plan.caseStatus).toBe('COMPLETED');
  });

  it('D-21: la cita pendiente NO cambia de dueño; Ana queda solo como responsable de seguimiento', () => {
    const plan = planHandover({
      items: [booking('b1')],
      handover: { defaultToUserId: ANA },
      replyersByDoctor,
    });
    expect(plan.ok && plan.assignments[0]).toMatchObject({
      kind: 'PENDING_BOOKING',
      toUserId: ANA,
      status: 'REASSIGNED',
      changesOwner: false,
    });
  });

  it('D-21: sin destinatario la cita solo se lista (CLOSED)', () => {
    const plan = planHandover({
      items: [booking('b1')],
      handover: {},
      replyersByDoctor,
    });
    expect(plan.ok && plan.assignments[0]).toMatchObject({
      toUserId: null,
      status: 'CLOSED',
    });
    expect(plan.ok && plan.caseStatus).toBe('COMPLETED');
  });

  it('la reasignación por ítem manda sobre el destinatario por defecto', () => {
    const plan = planHandover({
      items: [task('t1'), task('t2')],
      handover: {
        defaultToUserId: ANA,
        items: [{ id: 't2', toUserId: 'u-otra' }],
      },
      replyersByDoctor,
    });
    expect(plan.ok && plan.assignments.map((a) => a.toUserId)).toEqual([
      ANA,
      'u-otra',
    ]);
  });

  it('una conversación dirigida a quien no responde por ese doctor vuelve a la bandeja común', () => {
    const plan = planHandover({
      items: [conv('c1', 'perez')],
      handover: { items: [{ id: 'c1', toUserId: 'u-sin-permiso' }] },
      replyersByDoctor,
    });
    expect(plan.ok && plan.assignments[0]).toMatchObject({
      status: 'RETURNED_TO_POOL',
      toUserId: null,
    });
  });

  it('sin destinatario, conversaciones y tareas vuelven al fondo común (por rol)', () => {
    const plan = planHandover({
      items: [conv('c1', 'perez'), task('t1')],
      handover: {},
      replyersByDoctor,
    });
    expect(plan.ok && plan.assignments.map((a) => a.status)).toEqual([
      'RETURNED_TO_POOL',
      'RETURNED_TO_POOL',
    ]);
  });

  it('L-02: las cuentas que supervisaba exigen nuevo dueño ANTES de escribir nada (HANDOVER_SUPERVISOR_REQUIRED)', () => {
    const plan = planHandover({
      items: [supervised('lucia'), task('t1')],
      handover: { defaultToUserId: ANA },
      replyersByDoctor,
    });
    expect(plan.ok).toBe(false);
    if (!plan.ok) {
      expect(plan.issues).toEqual([
        { code: 'HANDOVER_SUPERVISOR_REQUIRED', itemId: 'lucia' },
      ]);
    }
    const sameWithUndefined = planHandover({
      items: [supervised('lucia')],
      handover: undefined,
      replyersByDoctor,
    });
    expect(sameWithUndefined.ok).toBe(false);
  });

  it('el destinatario por defecto no vale como dueño de cuenta; supervisedTo o el ítem sí', () => {
    const ok = planHandover({
      items: [supervised('lucia')],
      handover: { supervisedTo: 'u-sofia' },
      replyersByDoctor,
    });
    expect(ok.ok && ok.assignments[0]).toMatchObject({
      toUserId: 'u-sofia',
      status: 'REASSIGNED',
    });
    const perItem = planHandover({
      items: [supervised('lucia')],
      handover: { items: [{ id: 'lucia', toUserId: 'u-sofia' }] },
      replyersByDoctor,
    });
    expect(perItem.ok).toBe(true);
  });

  it('L-02: handover null = baja inmediata y todo queda pendiente; el caso sigue OPEN (la cuenta sin dueño se lista)', () => {
    const plan = planHandover({
      items: [supervised('lucia'), ...pablosWork],
      handover: null,
      replyersByDoctor,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(
      plan.assignments.every(
        (a) => a.status === 'PENDING' && a.toUserId === null,
      ),
    ).toBe(true);
    expect(plan.caseStatus).toBe('OPEN');
    expect(plan.pendingCount).toBe(7);
  });

  it('no se traspasa a quien se va (HANDOVER_TARGET_INELIGIBLE) ni a quien no es elegible', () => {
    const self = planHandover({
      items: [task('t1')],
      handover: { defaultToUserId: PABLO },
      replyersByDoctor,
    });
    expect(self.ok).toBe(false);
    expect(!self.ok && self.issues).toEqual([
      { code: 'HANDOVER_TARGET_INELIGIBLE', itemId: 't1' },
    ]);
    const restricted = planHandover({
      items: [task('t1')],
      handover: { defaultToUserId: ANA },
      replyersByDoctor,
      eligibleTargetUserIds: ['u-otro'],
    });
    expect(!restricted.ok && restricted.issues[0].code).toBe(
      'HANDOVER_TARGET_INELIGIBLE',
    );
  });

  it('una asignación por ítem a un id que no está entre los pendientes se ignora', () => {
    const plan = planHandover({
      items: [task('t1')],
      handover: { items: [{ id: 'fantasma', toUserId: ANA }] },
      replyersByDoctor,
    });
    expect(plan.ok && plan.assignments).toHaveLength(1);
  });

  it('leaverCaseStatus: COMPLETED solo si nada queda pendiente', () => {
    expect(
      leaverCaseStatus([
        { status: 'REASSIGNED' },
        { status: 'RETURNED_TO_POOL' },
        { status: 'CLOSED' },
      ]),
    ).toBe('COMPLETED');
    expect(
      leaverCaseStatus([{ status: 'REASSIGNED' }, { status: 'PENDING' }]),
    ).toBe('OPEN');
    expect(leaverCaseStatus([])).toBe('COMPLETED');
  });
});

describe('orden de la baja: revoca primero, reasigna después (AC-8)', () => {
  it('tres fases fijas: validar lo obligatorio, revocar y confirmar (transacción 1), reasignar (transacción 2)', () => {
    expect(OFFBOARD_PHASES).toEqual([
      { phase: 'VALIDATE_HANDOVER', transaction: 0 },
      { phase: 'REVOKE_ACCESS', transaction: 1 },
      { phase: 'REASSIGN_WORK', transaction: 2 },
    ]);
  });
  it('verifyRevokeBeforeReassign: ningún traspaso es anterior a la revocación', () => {
    const revoked = NOW;
    expect(
      verifyRevokeBeforeReassign(revoked, [
        day(0, NOW),
        new Date(NOW.getTime() + 5),
      ]),
    ).toBe(true);
    expect(
      verifyRevokeBeforeReassign(revoked, [new Date(NOW.getTime() - 1)]),
    ).toBe(false);
    expect(verifyRevokeBeforeReassign(revoked, [])).toBe(true);
    expect(verifyRevokeBeforeReassign(undefined, [NOW])).toBe(false);
  });
});

describe('suspensión y reactivación', () => {
  it('suspender solo un vínculo activo; reactivar solo uno suspendido', () => {
    expect(canSuspend('ACTIVE')).toEqual({ ok: true });
    expect(canSuspend('SUSPENDED')).toEqual({
      ok: false,
      reason: 'ENGAGEMENT_ALREADY_SUSPENDED',
    });
    expect(canSuspend('ENDED')).toEqual({
      ok: false,
      reason: 'SUPPORT_ENGAGEMENT_NOT_ACTIVE',
    });
    expect(canReactivate('SUSPENDED')).toEqual({ ok: true });
    expect(canReactivate('ACTIVE')).toEqual({
      ok: false,
      reason: 'ENGAGEMENT_NOT_SUSPENDED',
    });
    expect(canReactivate('ENDED')).toEqual({
      ok: false,
      reason: 'SUPPORT_ENGAGEMENT_NOT_ACTIVE',
    });
  });
  it('reactivar tras más de 60 días abre una revisión dirigida del dueño (7 días)', () => {
    const suspendedAt = day(-61);
    expect(
      reactivationReview({ suspendedAt, reactivatedAt: NOW }),
    ).toMatchObject({
      opensReview: true,
      kind: 'TARGETED',
      dueDays: 7,
      daysSuspended: 61,
    });
    expect(
      reactivationReview({ suspendedAt: day(-60), reactivatedAt: NOW })
        .opensReview,
    ).toBe(false);
    expect(
      reactivationReview({
        suspendedAt: day(-45),
        reactivatedAt: NOW,
        afterDays: 30,
      }).opensReview,
    ).toBe(true);
  });
});

describe('inactividad (D-04)', () => {
  const base = { now: NOW, referenceStart: day(-400) };
  it('el umbral por defecto es 45 días', () => {
    expect(DEFAULT_INACTIVITY_DAYS).toBe(45);
  });
  it('sin PERMIT ni inicio de sesión en 45 días ⇒ inactiva y se sugiere suspender', () => {
    const r = assessInactivity({
      ...base,
      lastPermitAt: day(-50),
      lastLoginAt: day(-46),
    });
    expect(r).toMatchObject({
      inactive: true,
      suggestSuspend: true,
      daysInactive: 46,
      autoSuspend: false,
    });
  });
  it('un inicio de sesión reciente basta para no estarlo', () => {
    expect(
      assessInactivity({
        ...base,
        lastPermitAt: day(-80),
        lastLoginAt: day(-3),
      }).inactive,
    ).toBe(false);
    expect(
      assessInactivity({ ...base, lastPermitAt: day(-2), lastLoginAt: null })
        .inactive,
    ).toBe(false);
  });
  it('exactamente 45 días ya cuenta; 44 no', () => {
    expect(assessInactivity({ ...base, lastLoginAt: day(-45) }).inactive).toBe(
      true,
    );
    expect(assessInactivity({ ...base, lastLoginAt: day(-44) }).inactive).toBe(
      false,
    );
  });
  it('sin actividad alguna se cuenta desde que empezó el vínculo (uno nuevo no nace inactivo)', () => {
    expect(
      assessInactivity({ now: NOW, referenceStart: day(-2) }).inactive,
    ).toBe(false);
    expect(
      assessInactivity({ now: NOW, referenceStart: day(-46) }).inactive,
    ).toBe(true);
  });
  it('autoSuspendInactiveDays apagado por defecto; con 90 suspende sola a los 90', () => {
    expect(
      assessInactivity({ ...base, lastLoginAt: day(-120) }).autoSuspend,
    ).toBe(false);
    expect(
      assessInactivity({
        ...base,
        lastLoginAt: day(-120),
        autoSuspendInactiveDays: 90,
      }).autoSuspend,
    ).toBe(true);
    expect(
      assessInactivity({
        ...base,
        lastLoginAt: day(-89),
        autoSuspendInactiveDays: 90,
      }).autoSuspend,
    ).toBe(false);
  });
  it('el umbral se ajusta (inactivityDays)', () => {
    expect(
      assessInactivity({ ...base, lastLoginAt: day(-20), inactivityDays: 15 })
        .inactive,
    ).toBe(true);
  });
  it('la fecha futura no da días negativos', () => {
    expect(
      assessInactivity({ ...base, lastLoginAt: day(5) }).daysInactive,
    ).toBe(0);
  });
});

describe('cuentas sin dueño y elegibilidad del dueño (D-07)', () => {
  const candidate = (
    over: Partial<Parameters<typeof ownerEligibility>[0]['candidate']> = {},
  ) => ({
    userId: 'u-x',
    membershipLive: true,
    isSecurityAdmin: false,
    isOrgDoctor: false,
    isLiveDelegatedAdmin: false,
    ...over,
  });
  it.each([
    ['administrador de seguridad', { isSecurityAdmin: true }],
    ['doctor de la organización', { isOrgDoctor: true }],
    ['administrador delegado vivo', { isLiveDelegatedAdmin: true }],
  ])('puede ser dueño: %s', (_n, over) => {
    expect(
      ownerEligibility({
        candidate: candidate(over),
        subjectUserId: 'u-persona',
      }),
    ).toEqual({ eligible: true });
  });
  it('no puede serlo: una persona cualquiera, sin membresía viva o la propia persona (GP-8)', () => {
    expect(
      ownerEligibility({ candidate: candidate(), subjectUserId: 'u-persona' }),
    ).toEqual({ eligible: false, reason: 'OWNER_NOT_ELIGIBLE' });
    expect(
      ownerEligibility({
        candidate: candidate({ isSecurityAdmin: true, membershipLive: false }),
        subjectUserId: 'u-persona',
      }),
    ).toEqual({ eligible: false, reason: 'OWNER_NOT_ELIGIBLE' });
    expect(
      ownerEligibility({
        candidate: candidate({ userId: 'u-persona', isSecurityAdmin: true }),
        subjectUserId: 'u-persona',
      }),
    ).toEqual({ eligible: false, reason: 'GUARDRAIL_SELF_SUPERVISION' });
  });
  it('ownerlessReasons: sin dueño, dueño que ya no sirve, o concesiones solo a doctores sin asignación', () => {
    expect(ownerlessReasons({ supervisorUserId: null })).toEqual(['NO_OWNER']);
    expect(
      ownerlessReasons({
        supervisorUserId: 'u-o',
        supervisorStillEligible: false,
      }),
    ).toEqual(['OWNER_NOT_ELIGIBLE']);
    expect(
      ownerlessReasons({
        supervisorUserId: 'u-o',
        supervisorStillEligible: true,
        onlyDoctorsWithoutAssignment: true,
      }),
    ).toEqual(['DOCTORS_WITHOUT_ASSIGNMENT']);
    expect(
      ownerlessReasons({
        supervisorUserId: 'u-o',
        supervisorStillEligible: true,
      }),
    ).toEqual([]);
    expect(
      ownerlessReasons({
        supervisorUserId: null,
        onlyDoctorsWithoutAssignment: true,
      }),
    ).toEqual(['NO_OWNER', 'DOCTORS_WITHOUT_ASSIGNMENT']);
  });
});

describe('plantillas de las otras listas', () => {
  it('mover, baja y suspensión tienen su lista y empiezan pendientes', () => {
    for (const kind of ['MOVER', 'LEAVER', 'SUSPENSION'] as const) {
      const items = checklistFor(kind);
      expect(items.length).toBeGreaterThan(0);
      expect(items.every((i) => i.status === 'PENDING')).toBe(true);
    }
  });
  it('la baja pide primero revocar el acceso y luego el traspaso', () => {
    const codes = checklistFor('LEAVER').map((i) => i.code);
    expect(codes.indexOf('ACCESS_REVOKED')).toBeLessThan(
      codes.indexOf('HANDOVER_COMPLETED'),
    );
  });
});
