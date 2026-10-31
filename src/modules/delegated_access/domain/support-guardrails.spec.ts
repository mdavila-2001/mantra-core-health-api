import {
  DELEGATED_ADMIN_FORBIDDEN_ATOMS,
  GUARDRAIL_CODES,
  PLATFORM_GUARDRAILS,
  TEMPLATE_CEILINGS,
  checkPeerAdmin,
  checkSelfAdmin,
  checkSelfSupervision,
  inheritedTemplateCeiling,
  mostRestrictiveTemplateCeiling,
  validateGrantsAgainstGuardrails,
} from './support-guardrails';
import { expandAtomPattern } from './support-permission-catalog';

const NOW = new Date('2026-11-03T10:30:00-04:00');
const days = (n: number): Date => new Date(NOW.getTime() + n * 86_400_000);
const codes = (v: readonly { code: string }[]): string[] =>
  v.map((e) => e.code);

describe('A3 · barandillas de plataforma (L0) — lista exacta (§4.2)', () => {
  it('GP-1…GP-9 con su código, estado HTTP y motivo en lenguaje simple', () => {
    expect(PLATFORM_GUARDRAILS.map((g) => g.id)).toEqual([
      'GP-1',
      'GP-2',
      'GP-3',
      'GP-4',
      'GP-5',
      'GP-6',
      'GP-7',
      'GP-8',
      'GP-9',
    ]);
    const byId = Object.fromEntries(PLATFORM_GUARDRAILS.map((g) => [g.id, g]));
    expect(byId['GP-1']).toMatchObject({
      code: 'GUARDRAIL_NOT_DELEGABLE',
      httpStatus: 422,
    });
    expect(byId['GP-2']).toMatchObject({
      code: 'GUARDRAIL_CEILING_EXCEEDED',
      httpStatus: 422,
    });
    expect(byId['GP-4']).toMatchObject({
      code: 'BREAK_GLASS_NOT_FOR_SUPPORT',
      httpStatus: 403,
    });
    expect(byId['GP-5']).toMatchObject({
      code: 'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM',
      httpStatus: 422,
    });
    expect(byId['GP-6']).toMatchObject({
      code: 'GUARDRAIL_SELF_ADMIN',
      httpStatus: 403,
    });
    expect(byId['GP-7']).toMatchObject({
      code: 'GUARDRAIL_CRITICAL_REQUIRES_EXPIRY',
      httpStatus: 422,
    });
    expect(byId['GP-8']).toMatchObject({
      code: 'GUARDRAIL_SELF_SUPERVISION',
      httpStatus: 422,
    });
    for (const g of PLATFORM_GUARDRAILS)
      expect(g.description.length).toBeGreaterThan(20);
    expect(GUARDRAIL_CODES).toEqual(
      expect.arrayContaining([
        'GUARDRAIL_PEER_ADMIN',
        'GUARDRAIL_RULE_LOOSENS_PLATFORM',
      ]),
    );
  });

  it('GP-5: lista de átomos que un delegado nunca otorga', () => {
    expect([...DELEGATED_ADMIN_FORBIDDEN_ATOMS].sort()).toEqual(
      [
        'team.*',
        'audit.*',
        'billing.receipt.void',
        'billing.payment.refund',
        'billing.discount.apply',
        'billing.cashbox.close',
        'patients.profile.edit_verified',
        'messages.broadcast.send',
        'reports.*.export',
      ].sort(),
    );
    expect(expandAtomPattern('reports.*.export')).toHaveLength(2);
  });
});

describe('AC-7 · validateGrantsAgainstGuardrails', () => {
  const grantOf = (
    atoms: string[],
    validTo?: Date,
    effect: 'ALLOW' | 'DENY' = 'ALLOW',
  ) => ({ atoms, validTo, effect });

  it('GP-1: un átomo no asignable da 422 GUARDRAIL_NOT_DELEGABLE (G-04 Ricardo)', () => {
    const v = validateGrantsAgainstGuardrails({
      templateCode: 'ORG_MANAGEMENT',
      grants: [grantOf(['team.sessionpolicy.manage'])],
      now: NOW,
    });
    expect(codes(v)).toEqual(['GUARDRAIL_NOT_DELEGABLE']);
    expect(v[0]).toMatchObject({
      guardrailId: 'GP-1',
      atom: 'team.sessionpolicy.manage',
    });
  });

  it('GP-2 (G-03): anular a Lucía Paz (recepción) y horario del doctor a recepción exceden el techo', () => {
    const v = validateGrantsAgainstGuardrails({
      templateCode: 'FRONT_DESK',
      grants: [
        grantOf(['billing.receipt.void', 'agenda.hours.edit'], days(30)),
      ],
      now: NOW,
    });
    expect(codes(v)).toEqual([
      'GUARDRAIL_CEILING_EXCEEDED',
      'GUARDRAIL_CEILING_EXCEEDED',
    ]);
    expect(v.map((e) => e.atom)).toEqual([
      'billing.receipt.void',
      'agenda.hours.edit',
    ]);
  });

  it('GP-2: una regla CEILING de la organización quita un patrón del techo («Secretaría no cobra»)', () => {
    const base = {
      templateCode: 'SECRETARY' as const,
      grants: [grantOf(['billing.payment.collect'])],
      now: NOW,
    };
    expect(validateGrantsAgainstGuardrails(base)).toEqual([]);
    const v = validateGrantsAgainstGuardrails({
      ...base,
      orgCeilingRules: [
        {
          id: 'r-ceil',
          roleTemplateCode: 'SECRETARY',
          permissionPattern: 'billing.*',
          message: 'Secretaría no cobra',
        },
      ],
    });
    expect(codes(v)).toEqual(['GUARDRAIL_CEILING_EXCEEDED']);
    expect(v[0]).toMatchObject({
      ruleId: 'r-ceil',
      details: { message: 'Secretaría no cobra' },
    });
    // otra plantilla no queda afectada
    expect(
      validateGrantsAgainstGuardrails({
        templateCode: 'BILLING_CASHIER',
        grants: [grantOf(['billing.payment.collect'])],
        now: NOW,
        orgCeilingRules: [
          {
            id: 'r-ceil',
            roleTemplateCode: 'SECRETARY',
            permissionPattern: 'billing.*',
          },
        ],
      }),
    ).toEqual([]);
  });

  it('un alias se valida por los átomos de su paquete', () => {
    const v = validateGrantsAgainstGuardrails({
      templateCode: 'NURSING',
      grants: [grantOf(['schedule.create'])],
      now: NOW,
    });
    expect(v.map((e) => e.atom)).toEqual(['agenda.appointment.create']);
  });

  it('GP-5: un administrador delegado no otorga team.*, audit.*, anular, devolver, exportar…', () => {
    const v = validateGrantsAgainstGuardrails({
      templateCode: 'ORG_MANAGEMENT',
      grants: [
        grantOf(
          [
            'reports.agenda.export',
            'audit.activity.view_team',
            'agenda.appointment.view',
          ],
          days(30),
        ),
      ],
      now: NOW,
      actor: { delegatedAdmin: true },
    });
    expect(codes(v)).toEqual([
      'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM',
      'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM',
    ]);
    expect(v.map((e) => e.atom)).toEqual([
      'reports.agenda.export',
      'audit.activity.view_team',
    ]);
    // el administrador de seguridad sí puede (dentro del techo)
    expect(
      validateGrantsAgainstGuardrails({
        templateCode: 'ORG_MANAGEMENT',
        grants: [grantOf(['audit.activity.view_team'])],
        now: NOW,
        actor: { delegatedAdmin: false },
      }),
    ).toEqual([]);
  });

  it('G-04 · GP-7: un átomo CRÍTICA exige valid_to y como máximo 90 días', () => {
    const run = (validTo?: Date) =>
      codes(
        validateGrantsAgainstGuardrails({
          templateCode: 'BILLING_CASHIER',
          grants: [grantOf(['billing.receipt.void'], validTo)],
          now: NOW,
        }),
      );
    expect(run(undefined)).toEqual(['GUARDRAIL_CRITICAL_REQUIRES_EXPIRY']);
    expect(run(days(120))).toEqual(['GUARDRAIL_CRITICAL_REQUIRES_EXPIRY']);
    expect(run(days(90))).toEqual([]);
    expect(run(days(60))).toEqual([]);
    expect(run(new Date(NOW.getTime() - 1))).toEqual([
      'GUARDRAIL_CRITICAL_REQUIRES_EXPIRY',
    ]);
  });

  it('GP-7 no se aplica a una fila DENY (restringe, no otorga) ni a lo no crítico', () => {
    expect(
      validateGrantsAgainstGuardrails({
        templateCode: 'BILLING_CASHIER',
        grants: [grantOf(['billing.receipt.void'], undefined, 'DENY')],
        now: NOW,
      }),
    ).toEqual([]);
    expect(
      validateGrantsAgainstGuardrails({
        templateCode: 'SECRETARY',
        grants: [grantOf(['agenda.appointment.view'])],
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('un código desconocido se ignora, como hoy', () => {
    expect(
      validateGrantsAgainstGuardrails({
        templateCode: 'SECRETARY',
        grants: [grantOf(['no.existe.nada'])],
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('GP-6 y GP-8: yo no, ni a mis pares, ni me superviso', () => {
    expect(checkSelfAdmin('u-1', 'u-1')).toMatchObject({
      code: 'GUARDRAIL_SELF_ADMIN',
      httpStatus: 403,
    });
    expect(checkSelfAdmin('u-1', 'u-2')).toBeUndefined();
    expect(
      checkPeerAdmin({
        subjectIsDelegatedAdmin: true,
        subjectIsSecurityAdmin: false,
        actorIsSecurityAdmin: false,
      }),
    ).toMatchObject({
      code: 'GUARDRAIL_PEER_ADMIN',
    });
    expect(
      checkPeerAdmin({
        subjectIsDelegatedAdmin: false,
        subjectIsSecurityAdmin: true,
        actorIsSecurityAdmin: false,
      }),
    ).toMatchObject({
      code: 'GUARDRAIL_PEER_ADMIN',
    });
    expect(
      checkPeerAdmin({
        subjectIsDelegatedAdmin: true,
        subjectIsSecurityAdmin: false,
        actorIsSecurityAdmin: true,
      }),
    ).toBeUndefined();
    expect(checkSelfSupervision('u-1', 'u-1')).toMatchObject({
      code: 'GUARDRAIL_SELF_SUPERVISION',
      httpStatus: 422,
    });
    expect(checkSelfSupervision('u-2', 'u-1')).toBeUndefined();
    expect(checkSelfSupervision(undefined, 'u-1')).toBeUndefined();
  });

  it('el techo de cada plantilla excluye lo que no es asignable y todo paquete cabe', () => {
    expect(Object.keys(TEMPLATE_CEILINGS)).toHaveLength(7);
  });
});

describe('A-M7 · las plantillas propias de la organización no relajan GP-2', () => {
  const grantOf = (atoms: string[]) => ({ atoms });

  it('hereda el techo MÁS restrictivo de plataforma que cubre sus acciones por defecto', () => {
    const r = inheritedTemplateCeiling(['schedule.view']);
    if (!r.ok) throw new Error('inesperado');
    const smallest = Math.min(
      ...Object.values(TEMPLATE_CEILINGS).map((c) => c.length),
    );
    expect(r.ceiling).toHaveLength(smallest);
    const cancel = inheritedTemplateCeiling([
      'schedule.view',
      'schedule.cancel',
    ]);
    if (!cancel.ok) throw new Error('inesperado');
    // cancelar no cabe en el techo más chico: sube al siguiente que sí lo cubre.
    expect(cancel.ceiling).toContain('agenda.appointment.cancel');
    expect(cancel.ceiling.length).toBeLessThan(
      TEMPLATE_CEILINGS.ORG_MANAGEMENT.length,
    );
  });

  it('si ningún techo de plataforma cubre las acciones, se rechaza con los átomos que sobran', () => {
    const r = inheritedTemplateCeiling([
      'agenda.appointment.view',
      'team.guardrails.manage',
    ]);
    expect(r).toEqual({
      ok: false,
      offendingAtoms: ['team.guardrails.manage'],
    });
  });

  it('con el techo de la plantilla propia, GP-2 se aplica: lo que sobra es GUARDRAIL_CEILING_EXCEEDED', () => {
    const ceiling = ['agenda.appointment.view'];
    const v = validateGrantsAgainstGuardrails({
      templateCode: 'SUPERVISOR',
      templateCeiling: ceiling,
      grants: [grantOf(['agenda.appointment.view', 'billing.payment.collect'])],
      now: NOW,
    });
    expect(codes(v)).toEqual(['GUARDRAIL_CEILING_EXCEEDED']);
    expect(v[0].atom).toBe('billing.payment.collect');
    expect(
      validateGrantsAgainstGuardrails({
        templateCode: 'SUPERVISOR',
        templateCeiling: ceiling,
        grants: [grantOf(['agenda.appointment.view'])],
        now: NOW,
      }),
    ).toEqual([]);
  });

  it('sin techo propio (como hoy) y con la plantilla vacía (vínculo antiguo) no hay techo de plantilla; el de plataforma no cambia', () => {
    expect(
      validateGrantsAgainstGuardrails({
        templateCode: 'SUPERVISOR',
        grants: [grantOf(['billing.payment.collect'])],
        now: NOW,
      }),
    ).toEqual([]);
    expect(
      codes(
        validateGrantsAgainstGuardrails({
          templateCode: 'NURSING',
          templateCeiling: ['billing.payment.collect'],
          grants: [grantOf(['billing.payment.collect'])],
          now: NOW,
        }),
      ),
    ).toEqual(['GUARDRAIL_CEILING_EXCEEDED']);
  });

  it('el techo por omisión de una plantilla propia sin techo guardado es lo común a todas las de plataforma', () => {
    const base = mostRestrictiveTemplateCeiling();
    expect(base).toContain('agenda.appointment.view');
    expect(base).not.toContain('agenda.appointment.cancel');
    for (const list of Object.values(TEMPLATE_CEILINGS)) {
      for (const atom of base) expect(list).toContain(atom);
    }
  });
});
