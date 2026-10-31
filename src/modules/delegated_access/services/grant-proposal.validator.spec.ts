import { jest } from '@jest/globals';
import { DELEG } from '../delegated_access.concepts';
import { GrantProposalValidator } from './grant-proposal.validator';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-11-03T14:30:00Z');

function build(
  opts: { ceilingRules?: any[]; exceptions?: any[]; sodRows?: any[] } = {},
) {
  const rules = {
    findActiveForTenant: mockFn().mockResolvedValue(opts.ceilingRules ?? []),
  };
  const sod = {
    findRulesVisible: mockFn().mockResolvedValue(opts.sodRows ?? []),
    findActiveExceptions: mockFn().mockResolvedValue(opts.exceptions ?? []),
  };
  return {
    rules,
    sod,
    validator: new GrantProposalValidator(rules as any, sod as any),
  };
}

const em = {} as any;
const input = (grants: any[], extra: Record<string, unknown> = {}): any => ({
  tenantId: 'org-1',
  templateCode: 'BILLING_CASHIER',
  subjectEngagementId: 'eng-mario',
  grants,
  now: NOW,
  ...extra,
});

describe('GrantProposalValidator', () => {
  it('una propuesta que cabe en el techo, sin condiciones ni conflictos, no tiene problemas', async () => {
    const { validator } = build();
    const out = await validator.validate(
      em,
      input([{ actions: ['billing.invoice.view'], effect: 'ALLOW' }], {
        templateCode: 'FRONT_DESK',
      }),
    );
    expect(out).toEqual([]);
  });

  it('GP-2: un átomo fuera del techo de la plantilla es 422 GUARDRAIL_CEILING_EXCEEDED con su átomo y concesión', async () => {
    const { validator } = build();
    const out = await validator.validate(
      em,
      input([{ actions: ['billing.receipt.void'] }], {
        templateCode: 'SECRETARY',
      }),
    );
    expect(out).toContainEqual(
      expect.objectContaining({
        code: 'GUARDRAIL_CEILING_EXCEEDED',
        httpStatus: 422,
        grantIndex: 0,
        atom: 'billing.receipt.void',
      }),
    );
  });

  it('una regla CEILING de la organización también recorta («Secretaría no cobra»)', async () => {
    const { validator, rules } = build({
      ceilingRules: [
        {
          id: 'r1',
          ruleKindConceptId: DELEG.GOV_RULE_CEILING,
          roleTemplateCode: 'SECRETARY',
          permissionPattern: 'billing.*',
          messageText: 'Secretaría no cobra',
        },
        {
          id: 'r2',
          ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
          permissionPattern: 'x.*',
        },
      ],
    });
    const out = await validator.validate(
      em,
      input([{ actions: ['billing.invoice.view'] }], {
        templateCode: 'SECRETARY',
      }),
    );
    expect(rules.findActiveForTenant).toHaveBeenCalled();
    expect(
      out.some(
        (i: any) =>
          i.code === 'GUARDRAIL_CEILING_EXCEEDED' && i.ruleId === 'r1',
      ),
    ).toBe(true);
  });

  it('una condición mal formada es 422 con el código del validador y la ruta', async () => {
    const { validator } = build();
    const out = await validator.validate(
      em,
      input(
        [
          {
            actions: ['agenda.appointment.view'],
            condition: { schemaVersion: 1, horario: 'lunes' },
          },
        ],
        { templateCode: 'FRONT_DESK' },
      ),
    );
    expect(out).toContainEqual(
      expect.objectContaining({
        code: 'CONDITION_UNKNOWN_KEY',
        httpStatus: 422,
        grantIndex: 0,
      }),
    );
  });

  it('SoD: cobrar y anular a la vez es un bloqueo duro: 422 SOD_CONFLICT_BLOCKED, sin excepción posible', async () => {
    const { validator } = build();
    const out = await validator.validate(
      em,
      input([{ actions: ['billing.payment.collect', 'billing.receipt.void'] }]),
    );
    expect(out).toContainEqual(
      expect.objectContaining({
        code: 'SOD_CONFLICT_BLOCKED',
        httpStatus: 422,
      }),
    );
  });

  it('SoD: una regla que exige aprobación sin excepción vigente es 409 SOD_EXCEPTION_REQUIRED; con la excepción activa deja pasar', async () => {
    const without = build();
    const grants = [
      { actions: ['agenda.appointment.create', 'billing.receipt.issue'] },
    ];
    const a = await without.validator.validate(em, input(grants));
    expect(a).toContainEqual(
      expect.objectContaining({
        code: 'SOD_EXCEPTION_REQUIRED',
        httpStatus: 409,
      }),
    );
    const ruleId = 'rule-bill-03';
    const withEx = build({
      sodRows: [
        {
          id: ruleId,
          tenantId: null,
          code: 'SOD-BILL-03',
          name: 'Crear citas y emitir comprobantes',
          atomsAJson: ['agenda.appointment.create'],
          atomsBJson: ['billing.receipt.issue'],
          scopeConceptId: DELEG.SOD_SCOPE_PERSON,
          actionConceptId: DELEG.SOD_ACTION_REQUIRE_APPROVAL,
          isHard: false,
        },
      ],
      exceptions: [
        {
          sodRuleId: ruleId,
          organizationUserAssignmentId: 'eng-mario',
          validFrom: new Date('2026-10-01'),
          validTo: new Date('2027-01-01'),
        },
      ],
    });
    const b = await withEx.validator.validate(em, input(grants));
    expect(b.some((i: any) => i.code === 'SOD_EXCEPTION_REQUIRED')).toBe(false);
  });

  it('un administrador delegado queda además bajo GP-5: no otorga átomos team.*', async () => {
    const { validator } = build();
    const out = await validator.validate(
      em,
      input([{ actions: ['team.grants.assign'] }], {
        templateCode: 'ORG_MANAGEMENT',
        actor: { delegatedAdmin: true },
      }),
    );
    expect(
      out.some((i: any) => i.code === 'GUARDRAIL_DELEGATED_FORBIDDEN_ATOM'),
    ).toBe(true);
  });

  it('una concesión DENY no cuenta para el techo ni para los conflictos', async () => {
    const { validator } = build();
    const out = await validator.validate(
      em,
      input([{ actions: ['billing.receipt.void'], effect: 'DENY' }], {
        templateCode: 'SECRETARY',
      }),
    );
    expect(out).toEqual([]);
  });
});
