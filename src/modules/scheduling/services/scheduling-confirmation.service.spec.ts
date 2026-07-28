import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { SchedulingConfirmationService } from './scheduling-confirmation.service';
import { SCHED } from '../scheduling.concepts';
import type { RuleCondition } from '../entities';

const TENANT = '33333333-3333-3333-3333-333333333333';
const RESOURCE = '44444444-4444-4444-4444-444444444444';

let ruleSeq = 0;

/** Fábrica de reglas ya "activas y vigentes" (el filtro real lo hace el repo). */
function rule(overrides: {
  /**
   * Identificador único de la instancia.
   */
  id?: string;
  /**
   * Identificador asociado a scope type concept.
   */
  scopeTypeConceptId?: string;
  /**
   * Identificador asociado a scope.
   */
  scopeId?: string;
  /**
   * Valor de priority mantenido por la instancia.
   */
  priority?: number;
  /**
   * Identificador asociado a decision concept.
   */
  decisionConceptId?: string;
  /**
   * Valor de condition mantenido por la instancia.
   */
  condition?: RuleCondition | unknown;
  /**
   * Valor de version mantenido por la instancia.
   */
  version?: number;
  /**
   * Fecha y hora en que se creó el registro.
   */
  createdAt?: Date;
}) {
  ruleSeq += 1;
  return {
    id: overrides.id ?? `rule-${ruleSeq}`,
    scopeTypeConceptId: overrides.scopeTypeConceptId ?? SCHED.RULE_SCOPE_TENANT,
    scopeId: overrides.scopeId,
    priority: overrides.priority ?? 100,
    decisionConceptId:
      overrides.decisionConceptId ?? SCHED.DECISION_AUTO_CONFIRM,
    conditionJson: overrides.condition ?? {
      field: 'ok',
      op: 'eq',
      value: true,
    },
    version: overrides.version ?? 1,
    createdAt: overrides.createdAt ?? new Date('2026-01-01T00:00:00Z'),
  };
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @param activeRules - Valor de active rules requerido por la operación.
 * @returns Resultado de build.
 */
function build(activeRules: unknown[]) {
  const repo = {
    findActiveRules: mockFn(async () => activeRules),
    findRulesByTenant: mockFn(async () => activeRules),
    createRule: mockFn(),
    findRuleByIdForUpdate: mockFn(),
  };
  const em = { transactional: mockFn((cb: any) => cb(em)) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SchedulingConfirmationService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, repo };
}

describe('SchedulingConfirmationService.evaluateBookingRequest (C-11)', () => {
  it('applies the higher-priority rule (lower number wins)', async () => {
    const { service } = build([
      rule({
        priority: 200,
        decisionConceptId: SCHED.DECISION_AUTO_REJECT,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
      rule({
        priority: 10,
        decisionConceptId: SCHED.DECISION_AUTO_CONFIRM,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
    ]);

    const res = await service.evaluateBookingRequest(TENANT, { ok: true });

    expect(res.decision).toBe('AUTO_CONFIRM');
    expect(res.decisionConceptId).toBe(SCHED.DECISION_AUTO_CONFIRM);
    expect(res.explanation.ruleVersion).toBe(1);
  });

  it('routes a priority tie with different decisions to MANUAL_REVIEW', async () => {
    const { service } = build([
      rule({
        priority: 50,
        decisionConceptId: SCHED.DECISION_AUTO_CONFIRM,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
      rule({
        priority: 50,
        decisionConceptId: SCHED.DECISION_AUTO_REJECT,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
    ]);

    const res = await service.evaluateBookingRequest(TENANT, { ok: true });

    expect(res.decision).toBe('MANUAL_REVIEW');
    expect(res.explanation.reason).toMatch(/[Ee]mpate/);
  });

  it('keeps the decision when a tie shares the same decision', async () => {
    const { service } = build([
      rule({
        priority: 50,
        decisionConceptId: SCHED.DECISION_AUTO_CONFIRM,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
      rule({
        priority: 50,
        decisionConceptId: SCHED.DECISION_AUTO_CONFIRM,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
    ]);

    const res = await service.evaluateBookingRequest(TENANT, { ok: true });

    expect(res.decision).toBe('AUTO_CONFIRM');
  });

  it('prefers a more specific (scoped) rule over a broad one with better priority', async () => {
    const { service } = build([
      rule({
        // Amplia, prioridad muy alta (número bajo), pero menos específica.
        priority: 1,
        scopeTypeConceptId: SCHED.RULE_SCOPE_TENANT,
        decisionConceptId: SCHED.DECISION_AUTO_REJECT,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
      rule({
        // Acotada al recurso: más específica ⇒ gana aunque su prioridad sea peor.
        priority: 100,
        scopeTypeConceptId: SCHED.RULE_SCOPE_RESOURCE,
        scopeId: RESOURCE,
        decisionConceptId: SCHED.DECISION_AUTO_CONFIRM,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
    ]);

    const res = await service.evaluateBookingRequest(
      TENANT,
      { ok: true },
      { resourceId: RESOURCE },
    );

    expect(res.decision).toBe('AUTO_CONFIRM');
  });

  it('excludes a scoped rule whose scope does not match the request', async () => {
    const { service } = build([
      rule({
        scopeTypeConceptId: SCHED.RULE_SCOPE_RESOURCE,
        scopeId: RESOURCE,
        decisionConceptId: SCHED.DECISION_AUTO_CONFIRM,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
    ]);

    // La solicitud es de OTRO recurso ⇒ la regla no aplica ⇒ fail-closed.
    const res = await service.evaluateBookingRequest(
      TENANT,
      { ok: true },
      { resourceId: '55555555-5555-5555-5555-555555555555' },
    );

    expect(res.decision).toBe('MANUAL_REVIEW');
  });

  it('is fail-closed: an unparseable condition never concludes', async () => {
    const { service } = build([
      rule({ condition: { garbage: 'nonsense' } }),
      rule({ condition: { field: 'x', op: 'unknown_op', value: 1 } }),
    ]);

    const res = await service.evaluateBookingRequest(TENANT, { x: 1 });

    expect(res.decision).toBe('MANUAL_REVIEW');
    expect(res.explanation.reason).toMatch(/fail-closed/);
    // Ambas reglas se evaluaron aunque ninguna concluyó.
    expect(res.explanation.evaluatedRuleIds).toHaveLength(2);
  });

  it('is fail-closed when no rule matches the frozen data', async () => {
    const { service } = build([
      rule({ condition: { field: 'vip', op: 'eq', value: true } }),
    ]);

    const res = await service.evaluateBookingRequest(TENANT, { vip: false });

    expect(res.decision).toBe('MANUAL_REVIEW');
  });

  it('supports all/any/not combinators against frozen request data', async () => {
    const condition: RuleCondition = {
      all: [
        { field: 'patient.vip', op: 'eq', value: true },
        { any: [{ field: 'risk', op: 'lt', value: 3 }] },
        { not: { field: 'blocked', op: 'eq', value: true } },
      ],
    };
    const { service } = build([
      rule({ decisionConceptId: SCHED.DECISION_AUTO_CONFIRM, condition }),
    ]);

    const res = await service.evaluateBookingRequest(TENANT, {
      patient: { vip: true },
      risk: 1,
      blocked: false,
    });

    expect(res.decision).toBe('AUTO_CONFIRM');
    expect(res.explanation.ruleId).toBeDefined();
  });

  it('evaluates only the frozen requestData (deterministic)', async () => {
    const { service, repo } = build([
      rule({
        decisionConceptId: SCHED.DECISION_AUTO_CONFIRM,
        condition: { field: 'ok', op: 'eq', value: true },
      }),
    ]);

    const frozen = { ok: true };
    const res = await service.evaluateBookingRequest(TENANT, frozen);

    expect(res.explanation.variables).toBe(frozen);
    expect(repo.findActiveRules).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
      expect.any(Date),
    );
  });
});
