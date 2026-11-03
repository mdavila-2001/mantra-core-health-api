import { DomainException } from '../../../common';
import { MarketingErrorReason } from '../marketing.error-reasons';
import type {
  AlertRow,
  InsertAlertData,
  InsertTransitionData,
  RuleRow,
  TransitionRow,
} from '../repositories/insights-workflow.repository';
import {
  InsightsWorkflowService,
  alertCodeOf,
} from './insights-workflow.service';

const ids = (codes: string[]) =>
  new Map(codes.map((code) => [code, `concept-${code}`]));
const STATUS = ids(['new', 'seen', 'in_progress', 'resolved', 'dismissed']);
const SEVERITY = ids(['critical', 'risk', 'anomaly', 'opportunity']);
const codeOf = (conceptId: string) => conceptId.replace('concept-', '');

/** Repositorio en memoria con la misma semántica que el SQL (versión, FOR UPDATE, append-only). */
class FakeRepo {
  alerts_: (AlertRow & { code: string; userId: string })[] = [];
  transitions: (TransitionRow & { by: string })[] = [];
  rules_: RuleRow[] = [
    rule('cac', 'critical', 100),
    rule('ctrdrop', 'risk', 20),
  ];
  calls: string[] = [];
  private seq = 0;

  transaction<T>(work: (tx: FakeRepo) => Promise<T>) {
    return work(this);
  }
  async conceptIds(set: string) {
    return set.includes('severity') ? SEVERITY : STATUS;
  }
  async alerts() {
    return this.alerts_;
  }
  async alertByFingerprint(fp: string) {
    return this.alerts_.find((a) => a.fingerprint === fp) ?? null;
  }
  async transitionsOf(ids_: readonly string[]) {
    return this.transitions.filter((t) => ids_.includes(t.alert_id));
  }
  async insertAlert(d: InsertAlertData) {
    this.calls.push('insertAlert');
    if (this.alerts_.some((a) => a.fingerprint === d.fingerprint)) return false;
    this.alerts_.push({
      id: `alert-${++this.seq}`,
      code: d.code,
      fingerprint: d.fingerprint,
      status_code: codeOf(d.statusConceptId),
      owner_team_code: d.ownerTeamCode,
      row_version: 1,
      updated_at: '2026-10-30T10:00:00.000Z',
      userId: d.userId,
    });
    return true;
  }
  async updateAlert(
    id: string,
    version: number,
    statusId: string,
    owner: string | null,
  ) {
    this.calls.push('updateAlert');
    const row = this.alerts_.find((a) => a.id === id);
    if (!row || row.row_version !== version) return false;
    row.status_code = codeOf(statusId);
    row.owner_team_code = owner;
    row.row_version += 1;
    return true;
  }
  async insertTransition(d: InsertTransitionData) {
    this.calls.push('insertTransition');
    this.transitions.push({
      alert_id: d.alertId,
      at: '2026-10-30T10:00:00.000Z',
      from_status: d.fromStatusConceptId ? codeOf(d.fromStatusConceptId) : null,
      to_status: codeOf(d.toStatusConceptId),
      from_owner: d.fromOwner,
      to_owner: d.toOwner,
      note: d.note,
      by: d.userId,
    });
  }
  async rules() {
    return this.rules_;
  }
  async ruleByCode(code: string) {
    return this.rules_.find((r) => r.code === code) ?? null;
  }
  async updateRule(
    code: string,
    version: number,
    enabled: boolean,
    threshold: number,
  ) {
    this.calls.push('updateRule');
    const r = this.rules_.find((x) => x.code === code);
    if (!r || r.row_version !== version) return false;
    Object.assign(r, { enabled, threshold, row_version: r.row_version + 1 });
    return true;
  }
}

function rule(code: string, severity: string, threshold: number): RuleRow {
  return {
    code,
    name: `Regla ${code}`,
    description: null,
    severity,
    unit: '%',
    threshold,
    default_threshold: threshold,
    direction: '+',
    enabled: true,
    row_version: 1,
  };
}

const snapshot = {
  severity: 'critical' as const,
  title: 'El CAC subió',
  whatText: 'El costo por adquisición superó el umbral.',
  detectedOn: '2026-10-29',
  moduleCode: 'campaigns',
  priority: 2,
};
const body = (over: Record<string, unknown> = {}) =>
  ({ status: 'in_progress', ownerTeam: 'marketing', snapshot, ...over }) as any;
const actor = { id: 'user-1', roles: ['MARKETING_MANAGER'] } as any;

function build() {
  const repo = new FakeRepo();
  const facts = { meta: async () => ({ dataset: 'demo' }) };
  return {
    repo,
    service: new InsightsWorkflowService(repo as any, facts as any),
  };
}

const failure = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    const e = error as DomainException;
    return { status: e.getStatus(), reason: e.reason };
  }
  return null;
};

describe('InsightsWorkflowService · alertas', () => {
  it('la primera vez crea la alerta desde el snapshot, con versión 1 y una transición new → estado pedido', async () => {
    const { repo, service } = build();
    const { data } = await service.putWorkflow(
      'fp-1',
      body(),
      undefined,
      actor,
    );
    expect(data).toMatchObject({
      fingerprint: 'fp-1',
      status: 'in_progress',
      ownerTeam: 'marketing',
      rowVersion: 1,
    });
    expect(data.transitions).toEqual([
      {
        at: expect.any(String),
        fromStatus: 'new',
        toStatus: 'in_progress',
        fromOwner: null,
        toOwner: 'marketing',
        note: null,
      },
    ]);
    expect(repo.alerts_[0].code).toBe(alertCodeOf('fp-1'));
    expect(repo.alerts_[0].code).toMatch(/^A-[0-9A-F]{10}$/);
    expect(repo.transitions[0].by).toBe('user-1');
  });

  it('alta con el estado base (new, sin responsable) crea la alerta pero NO escribe transición', async () => {
    const { repo, service } = build();
    const { data } = await service.putWorkflow(
      'fp-2',
      body({ status: 'new', ownerTeam: null, note: 'sin cambios' }),
      undefined,
      actor,
    );
    expect(data.rowVersion).toBe(1);
    expect(data.transitions).toEqual([]);
    expect(repo.transitions).toHaveLength(0);
  });

  it('un cambio de estado escribe UNA transición y sube rowVersion; el mismo PUT repetido no escribe nada', async () => {
    const { repo, service } = build();
    await service.putWorkflow('fp-3', body(), undefined, actor);
    const resolved = await service.putWorkflow(
      'fp-3',
      body({ status: 'resolved', note: ' listo ' }),
      '1',
      actor,
    );
    expect(resolved.data).toMatchObject({ status: 'resolved', rowVersion: 2 });
    expect(repo.transitions).toHaveLength(2);
    expect(repo.transitions[1]).toMatchObject({
      from_status: 'in_progress',
      to_status: 'resolved',
      from_owner: 'marketing',
      to_owner: 'marketing',
      note: 'listo',
    });

    const again = await service.putWorkflow(
      'fp-3',
      body({ status: 'resolved' }),
      '2',
      actor,
    );
    expect(again.data.rowVersion).toBe(2); // sin cambio: no sube
    expect(repo.transitions).toHaveLength(2); // y no escribe transición
  });

  it('cambiar SOLO el responsable también deja transición', async () => {
    const { repo, service } = build();
    await service.putWorkflow('fp-4', body(), undefined, actor);
    await service.putWorkflow(
      'fp-4',
      body({ ownerTeam: 'product' }),
      '1',
      actor,
    );
    expect(repo.transitions[1]).toMatchObject({
      from_status: 'in_progress',
      to_status: 'in_progress',
      from_owner: 'marketing',
      to_owner: 'product',
    });
  });

  it('If-Match viejo → 412 MARKETING_INSIGHTS_VERSION_MISMATCH y no escribe', async () => {
    const { repo, service } = build();
    await service.putWorkflow('fp-5', body(), undefined, actor);
    await service.putWorkflow('fp-5', body({ status: 'resolved' }), '1', actor);
    const writes = repo.calls.length;
    expect(
      await failure(
        service.putWorkflow('fp-5', body({ status: 'dismissed' }), '1', actor),
      ),
    ).toEqual({
      status: 412,
      reason: MarketingErrorReason.INSIGHTS_VERSION_MISMATCH,
    });
    expect(repo.calls).toHaveLength(writes);
    expect(repo.alerts_[0]).toMatchObject({
      status_code: 'resolved',
      row_version: 2,
    });
  });

  it('alerta que ya existe sin If-Match, o con valor no numérico → 412', async () => {
    const { service } = build();
    await service.putWorkflow('fp-6', body(), undefined, actor);
    for (const header of [undefined, '', 'abc']) {
      expect(
        await failure(service.putWorkflow('fp-6', body(), header, actor)),
      ).toEqual({
        status: 412,
        reason: MarketingErrorReason.INSIGHTS_VERSION_MISMATCH,
      });
    }
  });

  it('acepta el ETag débil W/"1" y alta con If-Match 0; un If-Match 5 sobre una alerta inexistente → 412', async () => {
    const { service } = build();
    expect(
      await failure(service.putWorkflow('fp-7', body(), '5', actor)),
    ).toMatchObject({ status: 412 });
    await service.putWorkflow('fp-7', body(), '0', actor);
    const ok = await service.putWorkflow(
      'fp-7',
      body({ status: 'dismissed' }),
      'W/"1"',
      actor,
    );
    expect(ok.data.status).toBe('dismissed');
  });

  it('fingerprint vacío o de más de 200 caracteres → 422 y no toca la base', async () => {
    const { repo, service } = build();
    for (const fp of ['  ', 'x'.repeat(201)]) {
      expect(
        await failure(service.putWorkflow(fp, body(), undefined, actor)),
      ).toEqual({
        status: 422,
        reason: MarketingErrorReason.INSIGHTS_FINGERPRINT_INVALID,
      });
    }
    expect(repo.calls).toEqual([]);
  });

  it('el listado trae el historial de cada alerta en orden', async () => {
    const { service } = build();
    await service.putWorkflow('fp-8', body(), undefined, actor);
    await service.putWorkflow('fp-8', body({ status: 'resolved' }), '1', actor);
    const { data } = await service.listWorkflow();
    expect(data).toHaveLength(1);
    expect(data[0].transitions.map((t) => t.toStatus)).toEqual([
      'in_progress',
      'resolved',
    ]);
  });
});

describe('InsightsWorkflowService · reglas', () => {
  it('lista las reglas con su umbral y versión', async () => {
    const { service } = build();
    const { data } = await service.listRules();
    expect(data.map((r) => r.code)).toEqual(['cac', 'ctrdrop']);
    expect(data[0]).toMatchObject({
      threshold: 100,
      defaultThreshold: 100,
      enabled: true,
      rowVersion: 1,
    });
  });

  it('PATCH con If-Match cambia umbral y/o estado y sube la versión', async () => {
    const { service } = build();
    const first = await service.patchRule(
      'cac',
      { threshold: 150 },
      '1',
      actor,
    );
    expect(first.data).toMatchObject({
      threshold: 150,
      defaultThreshold: 100,
      rowVersion: 2,
    });
    const second = await service.patchRule(
      'cac',
      { enabled: false },
      '2',
      actor,
    );
    expect(second.data).toMatchObject({
      enabled: false,
      threshold: 150,
      rowVersion: 3,
    });
  });

  it('umbral fuera de 1..500 → 422 MARKETING_INSIGHTS_RULE_THRESHOLD_OUT_OF_RANGE (y en los extremos pasa)', async () => {
    const { repo, service } = build();
    for (const threshold of [0, 0.99, 501, Number.NaN]) {
      expect(
        await failure(service.patchRule('cac', { threshold }, '1', actor)),
      ).toEqual({
        status: 422,
        reason: MarketingErrorReason.INSIGHTS_RULE_THRESHOLD_OUT_OF_RANGE,
      });
    }
    expect(repo.calls).toEqual([]);
    await service.patchRule('cac', { threshold: 1 }, '1', actor);
    await service.patchRule('cac', { threshold: 500 }, '2', actor);
  });

  it('sin If-Match → 428; If-Match viejo → 412; regla desconocida → 404; cuerpo vacío → 422', async () => {
    const { service } = build();
    expect(
      await failure(
        service.patchRule('cac', { enabled: false }, undefined, actor),
      ),
    ).toEqual({
      status: 428,
      reason: MarketingErrorReason.INSIGHTS_IF_MATCH_REQUIRED,
    });
    await service.patchRule('cac', { enabled: false }, '1', actor);
    expect(
      await failure(service.patchRule('cac', { enabled: true }, '1', actor)),
    ).toEqual({
      status: 412,
      reason: MarketingErrorReason.INSIGHTS_VERSION_MISMATCH,
    });
    expect(
      await failure(service.patchRule('nope', { enabled: true }, '1', actor)),
    ).toEqual({
      status: 404,
      reason: MarketingErrorReason.INSIGHTS_RULE_NOT_FOUND,
    });
    expect(
      await failure(service.patchRule('cac', {}, '2', actor)),
    ).toMatchObject({ status: 422 });
  });

  it('un PATCH que no cambia nada no sube la versión', async () => {
    const { repo, service } = build();
    const { data } = await service.patchRule(
      'cac',
      { enabled: true, threshold: 100 },
      '1',
      actor,
    );
    expect(data.rowVersion).toBe(1);
    expect(repo.calls).not.toContain('updateRule');
  });
});
