import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { SupportGrantWriteGuard } from './support-grant-write.guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const NOW = new Date('2026-11-03T14:30:00Z');
const day = (n: number): Date => new Date(NOW.getTime() + n * 86_400_000);
const ADMIN = { id: 'admin', roles: ['SECURITY_ADMIN'] } as any;
const DELEGATE = { id: 'sofia', roles: ['SUPPORT_STAFF'] } as any;
const tx: any = {};

function build(
  opts: { ceilingRules?: any[]; sod?: any; ownTemplate?: any } = {},
) {
  const rulesRepo = {
    findActiveForTenant: mockFn().mockResolvedValue(opts.ceilingRules ?? []),
  };
  const sod = {
    assertGrantAllowed: mockFn(
      opts.sod ??
        (async () => ({
          warnings: [],
          excepted: [],
          blocked: [],
          exceptionRequired: [],
        })),
    ),
  };
  jest.useFakeTimers({ now: NOW });
  const templates = {
    findEffectiveByCode: mockFn().mockResolvedValue(opts.ownTemplate ?? null),
  };
  return {
    guard: new SupportGrantWriteGuard(
      rulesRepo as any,
      sod as any,
      templates as any,
    ),
    rulesRepo,
    sod,
    templates,
  };
}
afterEach(() => jest.useRealTimers());

const input = (over: Record<string, unknown> = {}): any => ({
  tenantId: TENANT,
  actor: ADMIN,
  engagementId: 'eng-1',
  userId: 'u-1',
  templateCode: 'FRONT_DESK',
  grant: { targetKind: 'ALL', actions: ['agenda.appointment.view'] },
  ...over,
});
const failure = async (p: Promise<unknown>) => {
  try {
    await p;
  } catch (e) {
    return e as any;
  }
  return undefined;
};

describe('SupportGrantWriteGuard — techos y barandillas (casos G-03 y G-04)', () => {
  it('un permiso dentro del techo pasa y consulta la SoD', async () => {
    const d = build();
    await d.guard.assertCanWrite(tx, input());
    expect(d.sod.assertGrantAllowed).toHaveBeenCalledWith(
      tx,
      TENANT,
      expect.objectContaining({
        userId: 'u-1',
        proposed: [
          expect.objectContaining({ actions: ['agenda.appointment.view'] }),
        ],
      }),
    );
  });

  it('G-03: anular un comprobante a recepción excede el techo de la plantilla (422 con motivo simple)', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['billing.receipt.void'],
            validTo: day(30),
          },
        }),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
    expect(err.message).toMatch(/techo/i);
    expect(err.details.violations[0]).toMatchObject({
      code: 'GUARDRAIL_CEILING_EXCEEDED',
      atom: 'billing.receipt.void',
    });
  });

  it('G-03: una regla CEILING de la organización («Secretaría no cobra») también corta y dice su motivo', async () => {
    const rule = {
      id: 'r1',
      ruleKindConceptId: DELEG.GOV_RULE_CEILING,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      roleTemplateCode: 'SECRETARY',
      permissionPattern: 'billing.*',
      messageText: 'Secretaría no cobra',
    };
    const d = build({ ceilingRules: [rule] });
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          templateCode: 'FRONT_DESK',
          grant: { targetKind: 'ALL', actions: ['billing.payment.collect'] },
        }),
      ),
    );
    expect(err).toBeUndefined(); // la regla es de SECRETARY: recepción sigue pudiendo cobrar
    const err2 = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          templateCode: 'SECRETARY',
          grant: { targetKind: 'ALL', actions: ['billing.payment.collect'] },
        }),
      ),
    );
    expect(err2.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
    expect(err2.details.violations[0]).toMatchObject({ ruleId: 'r1' });
    expect(err2.details.violations[0].message).toMatch(/Secretaría no cobra/);
  });

  it('G-03: cambiar el horario del doctor excede el techo de recepción', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['agenda.hours.edit'],
            validTo: day(30),
          },
        }),
      ),
    );
    expect(err.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
  });

  it('G-04: un átomo de seguridad no es delegable (GP-1)', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          templateCode: 'ORG_MANAGEMENT',
          grant: { targetKind: 'ALL', actions: ['team.sessionpolicy.manage'] },
        }),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('GUARDRAIL_NOT_DELEGABLE');
  });

  it.each([
    ['sin fin', undefined],
    ['a 120 días', day(120)],
  ])(
    'G-04: un permiso crítico %s: 422 GUARDRAIL_CRITICAL_REQUIRES_EXPIRY',
    async (_label, validTo) => {
      const d = build();
      const err = await failure(
        d.guard.assertCanWrite(
          tx,
          input({
            templateCode: 'BILLING_CASHIER',
            grant: {
              targetKind: 'ALL',
              actions: ['billing.receipt.void'],
              ...(validTo ? { validTo } : {}),
            },
          }),
        ),
      );
      expect(err.reason).toBe('GUARDRAIL_CRITICAL_REQUIRES_EXPIRY');
    },
  );

  it('G-04: un permiso crítico a 60 días se otorga', async () => {
    const d = build();
    await expect(
      d.guard.assertCanWrite(
        tx,
        input({
          templateCode: 'BILLING_CASHIER',
          grant: {
            targetKind: 'ALL',
            actions: ['billing.receipt.void'],
            validTo: day(60),
          },
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('GP-5: un administrador delegado no otorga permisos de anulación; el de seguridad sí', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          actor: DELEGATE,
          templateCode: 'BILLING_CASHIER',
          grant: { targetKind: 'ALL', actions: ['billing.discount.apply'] },
        }),
      ),
    );
    expect(err.reason).toBe('GUARDRAIL_DELEGATED_FORBIDDEN_ATOM');
    await expect(
      d.guard.assertCanWrite(
        tx,
        input({
          templateCode: 'BILLING_CASHIER',
          grant: { targetKind: 'ALL', actions: ['billing.discount.apply'] },
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('GP-6: nadie se otorga permisos a sí mismo: 403 GUARDRAIL_SELF_ADMIN', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(tx, input({ userId: 'admin' })),
    );
    expect(err.getStatus()).toBe(403);
    expect(err.reason).toBe('GUARDRAIL_SELF_ADMIN');
    expect(d.sod.assertGrantAllowed).not.toHaveBeenCalled();
  });

  it('un alias heredado se valida por su paquete (schedule.edit_hours excede el techo de recepción)', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['schedule.edit_hours'],
            validTo: day(30),
          },
        }),
      ),
    );
    expect(err.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
  });

  it('una prohibición (DENY) no se mide contra el techo', async () => {
    const d = build();
    await expect(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['billing.receipt.void'],
            effect: 'DENY',
          },
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('las barandillas cortan ANTES de consultar la segregación de funciones', async () => {
    const d = build();
    await failure(
      d.guard.assertCanWrite(
        tx,
        input({ grant: { targetKind: 'ALL', actions: ['agenda.hours.edit'] } }),
      ),
    );
    expect(d.sod.assertGrantAllowed).not.toHaveBeenCalled();
  });
});

describe('SupportGrantWriteGuard — condiciones y SoD', () => {
  it('una condición con una clave desconocida: 422 CONDITION_UNKNOWN_KEY con su ruta', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['agenda.appointment.view'],
            condition: { schemaVersion: 1, inventada: 1 },
          },
        }),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('CONDITION_UNKNOWN_KEY');
    expect(err.details.errors[0]).toMatchObject({
      path: 'condition.inventada',
    });
  });

  it('la condición de un átomo se valida con ese átomo', async () => {
    const d = build();
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['agenda.appointment.view'],
            actionConditions: {
              'agenda.appointment.view': {
                schemaVersion: 1,
                time: { windows: [{ days: [1], from: '08:00', to: '08:00' }] },
              },
            },
          },
        }),
      ),
    );
    expect(err.reason).toBe('CONDITION_TIME_EMPTY_WINDOW');
    expect(err.details.errors[0].path).toBe(
      'actionConditions.agenda.appointment.view.time.windows[0]',
    );
  });

  it('cabo suelto de la ronda 2: actionConditions con más claves que permisos hay en el catálogo se rechaza sin recorrerlas todas', async () => {
    const d = build();
    const many = Object.fromEntries(
      Array.from({ length: 5000 }, (_, i) => [
        `inventada.${i}`,
        { schemaVersion: 1 },
      ]),
    );
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['agenda.appointment.view'],
            actionConditions: many,
          },
        }),
      ),
    );
    expect(err.getStatus()).toBe(422);
    expect(err.reason).toBe('CONDITION_TOO_LARGE');
    expect(err.details.errors).toHaveLength(1);
    expect(err.details.errors[0].path).toBe('actionConditions');
  });

  it('una clave de actionConditions que no es un átomo corta en la primera: un solo error, no uno por clave', async () => {
    const d = build();
    const some = Object.fromEntries(
      Array.from({ length: 40 }, (_, i) => [
        `inventada.${i}`,
        { schemaVersion: 1 },
      ]),
    );
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['agenda.appointment.view'],
            actionConditions: some,
          },
        }),
      ),
    );
    expect(err.reason).toBe('CONDITION_NOT_APPLICABLE_TO_ATOM');
    expect(err.details.errors).toHaveLength(1);
    expect(err.details.errors[0].path).toBe('actionConditions.inventada.0');
  });

  it('una condición válida pasa', async () => {
    const d = build();
    await expect(
      d.guard.assertCanWrite(
        tx,
        input({
          grant: {
            targetKind: 'ALL',
            actions: ['agenda.appointment.view'],
            condition: {
              schemaVersion: 1,
              time: {
                timeZone: 'America/La_Paz',
                windows: [{ days: [1, 2, 3], from: '08:00', to: '18:00' }],
              },
            },
          },
        }),
      ),
    ).resolves.toBeDefined();
  });

  it('el conflicto de segregación de funciones sale tal cual (S-01 / S-02)', async () => {
    const boom = Object.assign(new Error('x'), {
      reason: 'SOD_CONFLICT_BLOCKED',
    });
    const d = build({ sod: async () => Promise.reject(boom) });
    await expect(d.guard.assertCanWrite(tx, input())).rejects.toBe(boom);
  });

  it('al editar, la concesión que se reemplaza no cuenta contra sí misma en la SoD', async () => {
    const d = build();
    await d.guard.assertCanWrite(tx, input({ replacesGrantId: 'g-old' }));
    expect(d.sod.assertGrantAllowed).toHaveBeenCalledWith(
      tx,
      TENANT,
      expect.objectContaining({ replacesGrantIds: ['g-old'] }),
    );
  });

  it('devuelve las advertencias de SoD para que el servicio las deje asentadas', async () => {
    const warn = { ruleCode: 'SOD-BILL-04' };
    const d = build({
      sod: async () => ({
        warnings: [warn],
        excepted: [],
        blocked: [],
        exceptionRequired: [],
      }),
    });
    const out = await d.guard.assertCanWrite(tx, input());
    expect(out.sodWarnings).toEqual([warn]);
  });
});

describe('A-M7: una plantilla propia no relaja GP-2 en la escritura', () => {
  const own = (over: Record<string, unknown> = {}) => ({
    code: 'SUPERVISOR',
    defaultActionsJson: ['schedule.view', 'schedule.cancel'],
    ...over,
  });
  const write = (templateCode: string, actions: string[]) =>
    input({
      templateCode,
      grant: { targetKind: 'ALL', actions, validTo: day(30) },
    });

  it('hereda el techo más restrictivo que cubre sus acciones por defecto: cobrar no cabe', async () => {
    const d = build({ ownTemplate: own() });
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        write('SUPERVISOR', ['billing.payment.refund']),
      ),
    );
    expect(err.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
    expect(d.templates.findEffectiveByCode).toHaveBeenCalledWith(
      tx,
      TENANT,
      'SUPERVISOR',
    );
    // Lo que sí cubren sus acciones por defecto pasa.
    await d.guard.assertCanWrite(
      tx,
      write('SUPERVISOR', ['agenda.appointment.cancel']),
    );
  });

  it('con un techo guardado en la plantilla manda ese techo', async () => {
    const d = build({
      ownTemplate: own({ ceilingActionsJson: ['agenda.appointment.view'] }),
    });
    const err = await failure(
      d.guard.assertCanWrite(
        tx,
        write('SUPERVISOR', ['agenda.appointment.cancel']),
      ),
    );
    expect(err.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
  });

  it('sin plantilla legible o sin acciones por defecto, falla cerrado: solo lo común a todas las de plataforma', async () => {
    for (const ownTemplate of [null, own({ defaultActionsJson: [] })]) {
      const d = build({ ownTemplate });
      const err = await failure(
        d.guard.assertCanWrite(
          tx,
          write('SUPERVISOR', ['agenda.appointment.cancel']),
        ),
      );
      expect(err.reason).toBe('GUARDRAIL_CEILING_EXCEEDED');
      await d.guard.assertCanWrite(
        tx,
        write('SUPERVISOR', ['agenda.appointment.view']),
      );
    }
  });

  it('las plantillas de plataforma y los vínculos sin plantilla no consultan nada', async () => {
    const d = build({ ownTemplate: own() });
    await d.guard.assertCanWrite(
      tx,
      write('FRONT_DESK', ['agenda.appointment.view']),
    );
    await d.guard.assertCanWrite(tx, write('', ['agenda.appointment.view']));
    expect(d.templates.findEffectiveByCode).not.toHaveBeenCalled();
  });
});
