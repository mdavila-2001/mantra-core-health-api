import { createHash } from 'node:crypto';
import { GovernanceExportService, toCsv } from './governance-export.service';
import { GovernanceAccessService } from './governance-access.service';
import { DELEG } from '../delegated_access.concepts';
import { DelegatedAccessErrorReason as Reason } from '../delegated_access.error-reasons';
import {
  NOW,
  engagement,
  fakeEm,
  grant,
  ids,
  loggerStub,
  mockFn,
  securityAdmin,
  staff,
  worldOf,
} from './governance-world.testing';

const sha = (text: string) => createHash('sha256').update(text).digest('hex');
const DTO = (over: Partial<any> = {}) => ({
  format: 'csv' as const,
  reason: 'Auditoría trimestral de accesos del hospital',
  ...over,
});

function build(
  opts: { stepUp?: number | null | undefined; engagements?: any[] } = {},
) {
  const em = fakeEm();
  const world = worldOf(
    opts.engagements ?? [
      engagement({
        engagementId: 'e-ana',
        subjectUserId: ids.ana,
        grants: [
          grant({ grantId: 'g1', actions: ['agenda.appointment.view'] }),
        ],
      }),
    ],
  );
  const loader = { load: mockFn().mockResolvedValue(world) };
  const reports = {
    rowsOf: mockFn().mockResolvedValue([
      { userId: ids.ana, templateCode: 'SECRETARY', note: '=1+1' },
      {
        userId: ids.marcos,
        templateCode: 'CALL_CENTER',
        note: 'normal, con coma',
      },
    ]),
  };
  const anomalies = {
    listFor: mockFn().mockResolvedValue({ items: [], count: 0 }),
  };
  const reviews = {
    findCampaignById: mockFn().mockResolvedValue({
      id: 'c1',
      tenantId: ids.tenant,
      name: 'Q4',
      launchedAt: NOW,
      dueAt: NOW,
    }),
    findItemsByCampaign: mockFn().mockResolvedValue([
      {
        id: 'i1',
        organizationUserAssignmentId: 'e-ana',
        supportScopeGrantId: 'g1',
        decisionConceptId: DELEG.REVIEW_ITEM_CERTIFIED,
        reviewerKindConceptId: DELEG.REVIEWER_KIND_ADMIN,
        evidenceJson: {},
        decidedAt: NOW,
        dueAt: NOW,
      },
    ]),
  };
  const campaigns = {
    resultsOf: mockFn().mockReturnValue({
      total: 1,
      byDecision: {},
      pending: 0,
    }),
  };
  const stepUp = {
    ageMinutes: mockFn().mockResolvedValue(
      opts.stepUp === undefined ? 2 : opts.stepUp,
    ),
    isEnrolled: mockFn().mockResolvedValue(true),
  };
  const decisionLog = { appendNow: mockFn().mockResolvedValue('log-1') };
  const events = { publish: mockFn().mockResolvedValue(undefined) };
  const scope = { resolveTenant: mockFn().mockReturnValue(ids.tenant) };
  const service = new GovernanceExportService(
    em,
    reports as any,
    anomalies as any,
    reviews as any,
    campaigns as any,
    new GovernanceAccessService(loader as any),
    stepUp as any,
    decisionLog as any,
    events as any,
    scope as any,
    loggerStub as any,
  );
  return { service, reports, stepUp, decisionLog, events, reviews };
}

describe('GovernanceExportService.exportReport (M-01)', () => {
  it('sin motivo de 10 caracteres: 422 EXPORT_REASON_REQUIRED y no escribe nada', async () => {
    const c = build();
    await expect(
      c.service.exportReport(
        securityAdmin(),
        'privilege-creep',
        DTO({ reason: 'corto' }),
        {},
      ),
    ).rejects.toMatchObject({
      reason: Reason.EXPORT_REASON_REQUIRED,
      status: 422,
    });
    expect(c.decisionLog.appendNow).not.toHaveBeenCalled();
    expect(c.reports.rowsOf).not.toHaveBeenCalled();
  });

  it('un tipo desconocido es 422 EXPORT_KIND_INVALID', async () => {
    const c = build();
    await expect(
      c.service.exportReport(securityAdmin(), 'banana', DTO(), {}),
    ).rejects.toMatchObject({
      reason: Reason.EXPORT_KIND_INVALID,
    });
  });

  it('sin paso extra vigente: 403 STEP_UP_REQUIRED con details { maxAgeMinutes, enrolled }', async () => {
    const c = build({ stepUp: null });
    await expect(
      c.service.exportReport(securityAdmin(), 'privilege-creep', DTO(), {}),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'STEP_UP_REQUIRED',
      response: { details: { maxAgeMinutes: 10, enrolled: true } },
    });
    expect(c.reports.rowsOf).not.toHaveBeenCalled();
  });

  it('un paso extra de hace más de 10 minutos tampoco vale; Redis caído niega con STEP_UP_UNAVAILABLE', async () => {
    const old = build({ stepUp: 11 });
    await expect(
      old.service.exportReport(securityAdmin(), 'ownerless', DTO(), {}),
    ).rejects.toMatchObject({
      reason: 'STEP_UP_REQUIRED',
    });
    const down = build({ stepUp: undefined });
    down.stepUp.ageMinutes.mockResolvedValue(undefined);
    await expect(
      down.service.exportReport(securityAdmin(), 'ownerless', DTO(), {}),
    ).rejects.toMatchObject({
      reason: 'STEP_UP_UNAVAILABLE',
    });
  });

  it('completo: archivo con generatedAt, generatedBy, filters, rowCount y sha256; asiento en access_decision_log y evento', async () => {
    const c = build();
    const file = await c.service.exportReport(
      securityAdmin(),
      'privilege-creep',
      DTO({ filters: { days: 60 } }),
      { ip: '198.51.100.7' },
    );
    expect(file).toMatchObject({
      format: 'csv',
      kind: 'privilege-creep',
      generatedBy: ids.admin,
      filters: { days: 60 },
      rowCount: 2,
    });
    expect(file.sha256).toBe(sha(file.content));
    expect(file.content.split('\n')[0]).toBe('userId,templateCode,note');
    expect(c.decisionLog.appendNow).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        tenantId: ids.tenant,
        userId: ids.admin,
        permissionCode: 'audit.activity.export',
        effectConceptId: DELEG.DECISION_EFFECT_PERMIT,
        detail: expect.objectContaining({
          kind: 'privilege-creep',
          rowCount: 2,
          sha256: file.sha256,
        }),
      }),
    );
    expect(c.events.publish).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        type: 'delegated_access.governance.report_exported',
        payload: expect.objectContaining({
          kind: 'privilege-creep',
          rowCount: 2,
        }),
      }),
    );
  });

  it('el asiento NO guarda el texto libre del motivo: solo código, longitud y hash sha256 (pendiente 18)', async () => {
    const c = build();
    const reason = 'Auditoría trimestral con datos de Juan Pérez CI 1234567';
    await c.service.exportReport(
      securityAdmin(),
      'privilege-creep',
      DTO({ reason, reasonCode: 'AUDIT_REVIEW' }),
      {},
    );
    const entry = c.decisionLog.appendNow.mock.calls[0][1];
    expect(entry.detail).toMatchObject({
      reasonCode: 'AUDIT_REVIEW',
      reasonLength: reason.length,
      reasonSha256: sha(reason),
    });
    expect(entry.detail).not.toHaveProperty('reason');
    expect(JSON.stringify(entry)).not.toContain('Juan');
    expect(JSON.stringify(entry)).not.toContain('1234567');
  });

  it('sin código declarado, el código es OTHER; la huella es la del motivo recortado', async () => {
    const c = build();
    await c.service.exportReport(
      securityAdmin(),
      'ownerless',
      DTO({ reason: '   Revisión interna de cuentas   ' }),
      {},
    );
    const { detail } = c.decisionLog.appendNow.mock.calls[0][1];
    expect(detail.reasonCode).toBe('OTHER');
    expect(detail.reasonSha256).toBe(sha('Revisión interna de cuentas'));
    expect(detail.reasonLength).toBe('Revisión interna de cuentas'.length);
  });

  it('JSON: el contenido es el archivo con su cabecera y su hash', async () => {
    const c = build();
    const file = await c.service.exportReport(
      securityAdmin(),
      'ownerless',
      DTO({ format: 'json' }),
      {},
    );
    const parsed = JSON.parse(file.content);
    expect(parsed).toMatchObject({
      kind: 'ownerless',
      rowCount: 2,
      generatedBy: ids.admin,
    });
    expect(parsed.rows).toHaveLength(2);
    expect(file.sha256).toBe(sha(file.content));
  });

  it('un administrador delegado necesita audit.activity.export: 403 ADMIN_CEILING_EXCEEDED', async () => {
    const c = build({
      engagements: [
        engagement({
          engagementId: 'e-s',
          subjectUserId: ids.sofia,
          grants: [
            grant({ grantId: 'g', actions: ['audit.reports.governance.view'] }),
          ],
        }),
      ],
    });
    await expect(
      c.service.exportReport(staff(ids.sofia), 'ownerless', DTO(), {}),
    ).rejects.toMatchObject({
      reason: Reason.ADMIN_CEILING_EXCEEDED,
      status: 403,
    });
  });
});

describe('GovernanceExportService.exportCampaign (A-B4: motivo código + paso extra)', () => {
  const Q = (over: Partial<any> = {}) => ({
    format: 'json' as const,
    reasonCode: 'AUDIT_REVIEW' as const,
    ...over,
  });

  it('con motivo (código) y paso extra vigente exporta los ítems con su huella y deja el asiento con el código del motivo', async () => {
    const c = build();
    const file = await c.service.exportCampaign('c1', Q(), securityAdmin(), {});
    expect(file.kind).toBe('campaign-results');
    expect(file.rowCount).toBe(1);
    expect(file.sha256).toBe(sha(file.content));
    expect(c.stepUp.ageMinutes).toHaveBeenCalled();
    const entry = c.decisionLog.appendNow.mock.calls[0][1];
    expect(entry.detail).toMatchObject({
      kind: 'campaign-results',
      reasonCode: 'AUDIT_REVIEW',
    });
    // el motivo de una campaña es solo un CÓDIGO: no hay texto libre que huellar
    expect(entry.detail.reasonLength).toBeUndefined();
    expect(entry.detail.reasonSha256).toBeUndefined();
  });

  it('sin motivo: 422 EXPORT_REASON_REQUIRED, sin paso extra consultado ni asiento ni archivo', async () => {
    const c = build();
    await expect(
      c.service.exportCampaign(
        'c1',
        { format: 'json' } as any,
        securityAdmin(),
        {},
      ),
    ).rejects.toMatchObject({
      reason: Reason.EXPORT_REASON_REQUIRED,
      status: 422,
    });
    expect(c.decisionLog.appendNow).not.toHaveBeenCalled();
    expect(c.reviews.findItemsByCampaign).not.toHaveBeenCalled();
  });

  it('un código de motivo desconocido también es 422 EXPORT_REASON_REQUIRED', async () => {
    const c = build();
    await expect(
      c.service.exportCampaign(
        'c1',
        Q({ reasonCode: 'porque-si' }),
        securityAdmin(),
        {},
      ),
    ).rejects.toMatchObject({ reason: Reason.EXPORT_REASON_REQUIRED });
  });

  it('sin paso extra vigente: 403 STEP_UP_REQUIRED con details { maxAgeMinutes, enrolled } y no se lee ni se asienta nada', async () => {
    const c = build({ stepUp: null });
    await expect(
      c.service.exportCampaign('c1', Q(), securityAdmin(), {}),
    ).rejects.toMatchObject({
      status: 403,
      reason: 'STEP_UP_REQUIRED',
      details: { maxAgeMinutes: 10, enrolled: true },
    });
    expect(c.reviews.findItemsByCampaign).not.toHaveBeenCalled();
    expect(c.decisionLog.appendNow).not.toHaveBeenCalled();
  });

  it('con el paso extra no verificable (Redis caído): 403 STEP_UP_UNAVAILABLE, falla cerrado', async () => {
    const c = build({ stepUp: undefined });
    c.stepUp.ageMinutes.mockResolvedValue(undefined);
    await expect(
      c.service.exportCampaign('c1', Q(), securityAdmin(), {}),
    ).rejects.toMatchObject({ status: 403, reason: 'STEP_UP_UNAVAILABLE' });
    expect(c.decisionLog.appendNow).not.toHaveBeenCalled();
  });

  it('una campaña inexistente es 404 REVIEW_CAMPAIGN_NOT_FOUND (antes del motivo y del paso extra)', async () => {
    const c = build();
    c.reviews.findCampaignById.mockResolvedValue(null);
    await expect(
      c.service.exportCampaign(
        'x',
        { format: 'csv' } as any,
        securityAdmin(),
        {},
      ),
    ).rejects.toMatchObject({
      reason: Reason.REVIEW_CAMPAIGN_NOT_FOUND,
    });
  });
});

describe('GovernanceExportService.exportReport · B-B12 (filters sanitizados)', () => {
  it('solo se conservan los filtros que el informe entiende, con valores del tipo y rango válidos; el resto no llega ni al archivo ni al asiento ni al evento', async () => {
    const c = build();
    const file = await c.service.exportReport(
      securityAdmin(),
      'access-matrix',
      DTO({
        format: 'json',
        filters: {
          by: 'person',
          group: 'atom',
          id: 'no-es-un-uuid',
          days: 9999,
          evil: 'x'.repeat(200_000),
          nested: { a: { b: 'c' } },
          nombre: 'Juan Pérez, paciente con VIH',
        },
      }),
      {},
    );
    expect(file.filters).toEqual({ by: 'person', group: 'atom' });
    expect(c.reports.rowsOf).toHaveBeenCalledWith(
      expect.anything(),
      ids.tenant,
      expect.anything(),
      'access-matrix',
      { by: 'person', group: 'atom' },
    );
    expect(file.content).not.toContain('evil');
    expect(file.content).not.toContain('Juan Pérez');
    expect(JSON.stringify(c.decisionLog.appendNow.mock.calls)).not.toContain(
      'Juan Pérez',
    );
    expect(JSON.stringify(c.events.publish.mock.calls)).not.toContain('evil');
  });

  it('un id uuid y unos días enteros en rango sí pasan', async () => {
    const c = build();
    const file = await c.service.exportReport(
      securityAdmin(),
      'unused-access',
      DTO({
        format: 'json',
        filters: { id: '5a0d0b11-0000-4000-8000-000000000001', days: 90 },
      }),
      {},
    );
    expect(file.filters).toEqual({
      id: '5a0d0b11-0000-4000-8000-000000000001',
      days: 90,
    });
  });

  it('filters que no es un objeto simple (arreglo, texto, nulo) se descarta entero', async () => {
    const c = build();
    for (const bad of [[1, 2], 'by=person', null, 42]) {
      const file = await c.service.exportReport(
        securityAdmin(),
        'privilege-creep',
        DTO({ format: 'json', filters: bad }),
        {},
      );
      expect(file.filters).toEqual({});
    }
  });
});

describe('toCsv', () => {
  it('escapa comillas, comas y saltos, y neutraliza fórmulas (=, +, -, @)', () => {
    const csv = toCsv([
      { a: 'x,y', b: 'dice "hola"', c: '=SUMA(A1)' },
      { a: '+1', b: ['uno', 'dos'], c: '@cmd' },
    ]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('a,b,c');
    expect(lines[1]).toBe('"x,y","dice ""hola""",\'=SUMA(A1)');
    expect(lines[2]).toBe("'+1,uno|dos,'@cmd");
  });

  it('sin filas es solo la cabecera vacía', () => {
    expect(toCsv([])).toBe('');
  });
});
