import { jest } from '@jest/globals';
import { runWithTenant, CONCEPTS } from '../../../common';
import { DELEG } from '../delegated_access.concepts';
import { EventManager, EventType } from '@mikro-orm/core';
import { GovernanceRulesService } from './governance-rules.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'tenant-1';
const ADMIN = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

const ruleRow = (over: Record<string, unknown> = {}): any => ({
  id: 'rule-1',
  tenantId: TENANT,
  ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
  roleTemplateCode: 'FRONT_DESK',
  permissionPattern: 'patients.profile.register',
  ruleJson: { message: 'No' },
  messageText: 'No',
  statusConceptId: CONCEPTS.STATE_ACTIVE,
  createdAt: new Date('2026-11-01T00:00:00Z'),
  updatedAt: new Date('2026-11-01T00:00:00Z'),
  rowVersion: 3,
  ...over,
});

function build(rows: any[] = [], outerTransaction = false) {
  const tx: any = { flush: mockFn().mockResolvedValue(undefined) };
  // Con RLS la petición ya corre en una transacción: la de los servicios es un savepoint.
  const events = new EventManager([]);
  const ctx = {
    getTransactionContext: () => (outerTransaction ? {} : undefined),
    getEventManager: () => events,
  };
  const em: any = {
    fork: () => tx,
    transactional: mockFn((cb: any) => cb(tx)),
    getContext: () => ctx,
  };
  const commit = (root = true) =>
    events.dispatchEvent(EventType.afterTransactionCommit, {
      em: ctx,
      transaction: root
        ? {}
        : Object.defineProperty({}, 'savepointName', { value: 'trx2' }),
    } as any);
  const repo = {
    findByTenant: mockFn().mockResolvedValue(rows),
    findById: mockFn(
      async (_em: any, _t: string, id: string) =>
        rows.find((r) => r.id === id) ?? null,
    ),
    create: mockFn((_em: any, data: any) => ({
      id: 'rule-new',
      createdAt: new Date(),
      updatedAt: new Date(),
      rowVersion: 1,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
      ruleKindConceptId: data.ruleKindConceptId,
      roleTemplateCode: data.roleTemplateCode,
      permissionPattern: data.permissionPattern,
      ruleJson: data.ruleJson,
      messageText: data.messageText,
    })),
    retire: mockFn((row: any, _actor: any, now: Date) => {
      row.statusConceptId = CONCEPTS.STATE_REVOKED;
      row.validTo = now;
    }),
  };
  const rulesCache = { invalidate: mockFn() };
  const stepUp = { assertFresh: mockFn().mockResolvedValue(undefined) };
  const outbox = { publishDomainEvent: mockFn().mockResolvedValue({}) };
  const scope = { resolveTenant: () => TENANT };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new GovernanceRulesService(
    em,
    repo as any,
    rulesCache as any,
    stepUp as any,
    outbox as any,
    scope as any,
    logger as any,
  );
  return { service, repo, rulesCache, stepUp, outbox, tx, commit };
}

const run = <T>(fn: () => Promise<T>) => runWithTenant(TENANT, fn);

describe('V-4: la invalidación de la caché de reglas se publica DESPUÉS del commit real', () => {
  const dto = {
    kind: 'DENY_PERMISSION',
    roleTemplateCode: 'FRONT_DESK',
    permissionPattern: 'billing.payment.refund',
    message: 'No se reembolsa',
  } as any;

  it('crear dentro de la transacción de la petición (savepoint): no invalida al volver del servicio, sí al confirmar la raíz', async () => {
    const d = build([], true);
    await run(() => d.service.create(dto, ADMIN));
    expect(d.rulesCache.invalidate).not.toHaveBeenCalled();
    await d.commit(false);
    expect(d.rulesCache.invalidate).not.toHaveBeenCalled();
    await d.commit(true);
    expect(d.rulesCache.invalidate).toHaveBeenCalledTimes(1);
    expect(d.rulesCache.invalidate).toHaveBeenCalledWith(TENANT);
  });

  it('editar y retirar igual: avisan después del commit real', async () => {
    const edit = build([ruleRow()], true);
    await run(() =>
      edit.service.update(
        'rule-1',
        { message: 'Otro', expectedRowVersion: 3 } as any,
        ADMIN,
      ),
    );
    expect(edit.rulesCache.invalidate).not.toHaveBeenCalled();
    await edit.commit();
    expect(edit.rulesCache.invalidate).toHaveBeenCalledWith(TENANT);
    const retire = build([ruleRow()], true);
    await run(() => retire.service.retire('rule-1', {} as any, ADMIN));
    expect(retire.rulesCache.invalidate).not.toHaveBeenCalled();
    await retire.commit();
    expect(retire.rulesCache.invalidate).toHaveBeenCalledWith(TENANT);
  });

  it('con transacción propia (sin RLS) la escritura ya confirmó al volver: invalida de inmediato', async () => {
    const d = build([], false);
    await run(() => d.service.create(dto, ADMIN));
    expect(d.rulesCache.invalidate).toHaveBeenCalledWith(TENANT);
  });
});

describe('GovernanceRulesService.create', () => {
  it('DENY_PERMISSION: crea, exige paso extra, invalida la caché y avisa por el outbox (caso G-02)', async () => {
    const d = build();
    const out = await run(() =>
      d.service.create(
        {
          kind: 'DENY_PERMISSION',
          roleTemplateCode: 'FRONT_DESK',
          permissionPattern: 'patients.profile.register',
          message: 'Recepción no registra pacientes',
        } as any,
        ADMIN,
      ),
    );
    expect(d.stepUp.assertFresh).toHaveBeenCalledTimes(1);
    expect(d.repo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        ruleKindConceptId: DELEG.GOV_RULE_DENY_PERMISSION,
        permissionPattern: 'patients.profile.register',
        roleTemplateCode: 'FRONT_DESK',
        actorUserId: 'admin-1',
      }),
    );
    expect(d.rulesCache.invalidate).toHaveBeenCalledWith(TENANT);
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        tenantId: TENANT,
        eventType: 'delegated_access.governance_rule.created',
        aggregateType: 'governance_rule',
        aggregateId: 'rule-new',
      }),
    );
    expect(out).toMatchObject({ kind: 'DENY_PERMISSION', status: 'ACTIVE' });
  });

  it('la caché se invalida DESPUÉS de confirmar la escritura (flush)', async () => {
    const d = build();
    const order: string[] = [];
    d.tx.flush.mockImplementation(async () => void order.push('flush'));
    d.rulesCache.invalidate.mockImplementation(
      () => void order.push('invalidate'),
    );
    await run(() =>
      d.service.create(
        { kind: 'DENY_PERMISSION', permissionPattern: 'billing.*' } as any,
        ADMIN,
      ),
    );
    expect(order[0]).toBe('flush');
    expect(order).toContain('invalidate');
  });

  it('CEILING sin plantilla: 422 GOVERNANCE_RULE_INVALID', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.create(
          { kind: 'CEILING', permissionPattern: 'reports.*.export' } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_INVALID' });
    expect(d.repo.create).not.toHaveBeenCalled();
  });

  it('plantilla desconocida: 422 GOVERNANCE_RULE_INVALID', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.create(
          {
            kind: 'CEILING',
            roleTemplateCode: 'INVENTADA',
            permissionPattern: 'billing.*',
          } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_INVALID' });
  });

  it('el patrón debe ser un átomo o un prefijo con comodín', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.create(
          { kind: 'DENY_PERMISSION', permissionPattern: 'cobrar' } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_INVALID' });
  });

  it('un patrón que no cubre ningún átomo del catálogo: 422', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.create(
          {
            kind: 'DENY_PERMISSION',
            permissionPattern: 'nada.existe.aqui',
          } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_INVALID' });
  });

  it('FIELD_FLOOR exige un átomo de campo y un piso válido', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.create(
          {
            kind: 'FIELD_FLOOR',
            permissionPattern: 'billing.payment.collect',
            maxVisibility: 'PARTIAL',
          } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_INVALID' });
    const ok = await run(() =>
      d.service.create(
        {
          kind: 'FIELD_FLOOR',
          permissionPattern: 'agenda.appointment.view.patient_document',
          maxVisibility: 'PARTIAL',
        } as any,
        ADMIN,
      ),
    );
    expect(ok.kind).toBe('FIELD_FLOOR');
    expect(d.repo.create).toHaveBeenLastCalledWith(
      d.tx,
      expect.objectContaining({ ruleJson: { maxVisibility: 'PARTIAL' } }),
    );
    await expect(
      run(() =>
        d.service.create(
          {
            kind: 'FIELD_FLOOR',
            permissionPattern: 'agenda.appointment.view.patient_document',
          } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_INVALID' });
  });

  it('REQUIRE_CONDITION valida la condición como el resto (CONDITION_*)', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.create(
          {
            kind: 'REQUIRE_CONDITION',
            permissionPattern: 'billing.*',
            condition: { schemaVersion: 1, inventada: {} },
          } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({
      reason: 'CONDITION_UNKNOWN_KEY',
      details: { errors: [{ code: 'CONDITION_UNKNOWN_KEY' }] },
    });
    const ok = await run(() =>
      d.service.create(
        {
          kind: 'REQUIRE_CONDITION',
          permissionPattern: 'billing.*',
          condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
        } as any,
        ADMIN,
      ),
    );
    expect(ok.kind).toBe('REQUIRE_CONDITION');
    expect(d.repo.create).toHaveBeenLastCalledWith(
      d.tx,
      expect.objectContaining({
        ruleJson: {
          condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
          appliesTo: 'ALL',
        },
        ruleSchemaVersion: 1,
      }),
    );
  });

  it('REQUIRE_CONDITION que se vuelve opcional (appliesTo distinto de ALL) afloja la plataforma', async () => {
    const d = build();
    await expect(
      run(() =>
        d.service.create(
          {
            kind: 'REQUIRE_CONDITION',
            permissionPattern: 'billing.*',
            appliesTo: 'ANY',
            condition: { schemaVersion: 1, network: { require: 'ORG_RULES' } },
          } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GUARDRAIL_RULE_LOOSENS_PLATFORM' });
  });

  it('una regla activa igual: 409 GOVERNANCE_RULE_DUPLICATE', async () => {
    const d = build([ruleRow()]);
    await expect(
      run(() =>
        d.service.create(
          {
            kind: 'DENY_PERMISSION',
            roleTemplateCode: 'FRONT_DESK',
            permissionPattern: 'patients.profile.register',
          } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_DUPLICATE' });
  });

  it('sin paso extra no se escribe nada', async () => {
    const d = build();
    d.stepUp.assertFresh.mockRejectedValue(new Error('STEP_UP_REQUIRED'));
    await expect(
      run(() =>
        d.service.create(
          { kind: 'DENY_PERMISSION', permissionPattern: 'billing.*' } as any,
          ADMIN,
        ),
      ),
    ).rejects.toThrow('STEP_UP_REQUIRED');
    expect(d.repo.create).not.toHaveBeenCalled();
    expect(d.rulesCache.invalidate).not.toHaveBeenCalled();
  });
});

describe('GovernanceRulesService.update / retire / list', () => {
  it('update con rowVersion distinta: 409 ROW_VERSION_CONFLICT', async () => {
    const d = build([ruleRow()]);
    await expect(
      run(() =>
        d.service.update(
          'rule-1',
          { expectedRowVersion: 2, message: 'x' } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'ROW_VERSION_CONFLICT' });
  });

  it('update cambia el mensaje, invalida la caché y deja el resto', async () => {
    const row = ruleRow();
    const d = build([row]);
    const out = await run(() =>
      d.service.update(
        'rule-1',
        { expectedRowVersion: 3, message: 'Recepción no registra' } as any,
        ADMIN,
      ),
    );
    expect(row.messageText).toBe('Recepción no registra');
    expect(d.rulesCache.invalidate).toHaveBeenCalledWith(TENANT);
    expect(out.permissionPattern).toBe('patients.profile.register');
  });

  it('update de una regla ajena o inexistente: 404 uniforme', async () => {
    const d = build([]);
    await expect(
      run(() =>
        d.service.update('nadie', { expectedRowVersion: 1 } as any, ADMIN),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_NOT_FOUND' });
  });

  it('update de una regla ya retirada: 409 GOVERNANCE_RULE_INVALID? no: 404 no la edita', async () => {
    const d = build([ruleRow({ statusConceptId: CONCEPTS.STATE_REVOKED })]);
    await expect(
      run(() =>
        d.service.update(
          'rule-1',
          { expectedRowVersion: 3, message: 'x' } as any,
          ADMIN,
        ),
      ),
    ).rejects.toMatchObject({ reason: 'GOVERNANCE_RULE_INVALID' });
  });

  it('retire: nunca borra, queda REVOKED, invalida la caché y publica el evento', async () => {
    const row = ruleRow();
    const d = build([row]);
    const out = await run(() =>
      d.service.retire('rule-1', { reason: 'Ya no aplica' } as any, ADMIN),
    );
    expect(d.repo.retire).toHaveBeenCalled();
    expect(out.status).toBe('REVOKED');
    expect(d.rulesCache.invalidate).toHaveBeenCalledWith(TENANT);
    expect(d.outbox.publishDomainEvent).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({
        eventType: 'delegated_access.governance_rule.retired',
      }),
    );
  });

  it('retire de una regla ya retirada es idempotente', async () => {
    const d = build([ruleRow({ statusConceptId: CONCEPTS.STATE_REVOKED })]);
    const out = await run(() => d.service.retire('rule-1', {} as any, ADMIN));
    expect(out.status).toBe('REVOKED');
    expect(d.repo.retire).not.toHaveBeenCalled();
  });

  it('list: devuelve activas y retiradas con su forma pública', async () => {
    const d = build([
      ruleRow(),
      ruleRow({
        id: 'rule-2',
        ruleKindConceptId: DELEG.GOV_RULE_FIELD_FLOOR,
        roleTemplateCode: undefined,
        permissionPattern: 'agenda.appointment.view.patient_document',
        ruleJson: { maxVisibility: 'PARTIAL' },
        messageText: undefined,
        statusConceptId: CONCEPTS.STATE_REVOKED,
      }),
    ]);
    const out = await run(() => d.service.list({}));
    expect(out.count).toBe(2);
    expect(out.items[1]).toMatchObject({
      kind: 'FIELD_FLOOR',
      status: 'REVOKED',
      maxVisibility: 'PARTIAL',
    });
  });
});
