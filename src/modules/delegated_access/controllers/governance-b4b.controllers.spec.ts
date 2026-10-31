import { jest } from '@jest/globals';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IS_TENANT_AGNOSTIC_KEY } from '../../../common/tenant/tenant-agnostic.decorator';
import { AUDITED_KEY, NOT_AUDITED_KEY } from '../../../common/audit-trail';
import {
  AccessReviewCampaignsController,
  MyAccessReviewsController,
} from './access-reviews.controller';
import {
  GovernanceReportsController,
  PractitionerGovernanceController,
} from './governance-reports.controller';
import { GovernanceSweepController } from './governance-sweep.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'u1', roles: [] } as any;

/** Ruta completa, verbo, roles y sello de un handler. */
function route(controller: new (...a: any[]) => any, handler: string) {
  const fn = controller.prototype[handler];
  const base = Reflect.getMetadata(PATH_METADATA, controller) as string;
  const path = Reflect.getMetadata(PATH_METADATA, fn) as string;
  const method = Reflect.getMetadata(METHOD_METADATA, fn) as RequestMethod;
  return {
    url: `/${[base, path].filter((p) => p && p !== '/').join('/')}`,
    verb: RequestMethod[method],
    roles: Reflect.getMetadata(ROLES_KEY, fn) as string[] | undefined,
    agnostic: Reflect.getMetadata(IS_TENANT_AGNOSTIC_KEY, fn) as
      boolean | undefined,
    audited: Reflect.getMetadata(AUDITED_KEY, fn) as
      { action: string; entity: string } | undefined,
    notAudited: Reflect.getMetadata(NOT_AUDITED_KEY, fn) as string | undefined,
  };
}

const DUAL = ['SECURITY_ADMIN', 'SUPPORT_STAFF'];
const REVIEWERS = [
  'SECURITY_ADMIN',
  'PRACTITIONER',
  'CLINICIAN',
  'SUPPORT_STAFF',
];

describe('rutas de campañas de certificación (§8.3 F)', () => {
  const C = AccessReviewCampaignsController;
  const table: Array<[string, string, string, string[], string | 'none']> = [
    ['list', 'GET', '/org/access-reviews/campaigns', DUAL, 'none'],
    ['preview', 'POST', '/org/access-reviews/campaigns/preview', DUAL, 'none'],
    [
      'create',
      'POST',
      '/org/access-reviews/campaigns',
      DUAL,
      'ACCESS_REVIEW_CAMPAIGN_CREATED',
    ],
    ['get', 'GET', '/org/access-reviews/campaigns/:id', DUAL, 'none'],
    [
      'update',
      'PATCH',
      '/org/access-reviews/campaigns/:id',
      DUAL,
      'ACCESS_REVIEW_CAMPAIGN_UPDATED',
    ],
    [
      'launch',
      'POST',
      '/org/access-reviews/campaigns/:id/launch',
      DUAL,
      'ACCESS_REVIEW_CAMPAIGN_LAUNCHED',
    ],
    [
      'close',
      'POST',
      '/org/access-reviews/campaigns/:id/close',
      DUAL,
      'ACCESS_REVIEW_CAMPAIGN_CLOSED',
    ],
    [
      'cancel',
      'POST',
      '/org/access-reviews/campaigns/:id/cancel',
      DUAL,
      'ACCESS_REVIEW_CAMPAIGN_CANCELLED',
    ],
    ['items', 'GET', '/org/access-reviews/campaigns/:id/items', DUAL, 'none'],
    [
      'results',
      'GET',
      '/org/access-reviews/campaigns/:id/results',
      DUAL,
      'none',
    ],
    [
      'export',
      'GET',
      '/org/access-reviews/campaigns/:id/export',
      ['SECURITY_ADMIN'],
      'none',
    ],
  ];
  it.each(table)(
    '%s: %s %s con sus roles y su sello',
    (handler, verb, url, roles, action) => {
      const r = route(C, handler);
      expect(r).toMatchObject({ url, verb, roles });
      if (action === 'none') expect(r.audited).toBeUndefined();
      else expect(r.audited?.action).toBe(action);
    },
  );

  it('la vista previa no muta: es @NotAudited con su motivo; ninguna ruta es tenant-agnóstica', () => {
    expect(route(C, 'preview').notAudited).toMatch(/sin efectos/i);
    for (const [handler] of table)
      expect(route(C, handler).agnostic).toBeUndefined();
  });
});

describe('rutas del revisor (my-reviews)', () => {
  const C = MyAccessReviewsController;
  it('listar, ver, decidir y decidir en lote con los roles de revisor (autoriza el servicio por elegibilidad)', () => {
    expect(route(C, 'list')).toMatchObject({
      url: '/me/access-reviews/items',
      verb: 'GET',
      roles: REVIEWERS,
    });
    expect(route(C, 'get')).toMatchObject({
      url: '/me/access-reviews/items/:id',
      verb: 'GET',
      roles: REVIEWERS,
    });
    expect(route(C, 'decide')).toMatchObject({
      url: '/me/access-reviews/items/:id/decision',
      verb: 'POST',
      roles: REVIEWERS,
    });
    expect(route(C, 'bulk')).toMatchObject({
      url: '/me/access-reviews/items/bulk-decision',
      verb: 'POST',
      roles: REVIEWERS,
    });
    expect(route(C, 'decide').audited?.entity).toBe('access_review_item');
    expect(route(C, 'bulk').audited?.entity).toBe('access_review_item');
  });
});

describe('rutas de informes y anomalías (§8.3 G)', () => {
  const C = GovernanceReportsController;
  it.each([
    ['summary', 'GET', '/org/governance/summary'],
    ['matrix', 'GET', '/org/governance/access-matrix'],
    ['creep', 'GET', '/org/governance/privilege-creep'],
    ['unused', 'GET', '/org/governance/unused-access'],
    ['ownerless', 'GET', '/org/governance/ownerless'],
    ['exceptions', 'GET', '/org/governance/exceptions'],
    ['listAnomalies', 'GET', '/org/governance/anomalies'],
  ])(
    '%s: %s %s para SECURITY_ADMIN o administrador delegado',
    (handler, verb, url) => {
      expect(route(C, handler)).toMatchObject({ url, verb, roles: DUAL });
    },
  );

  it('reconocer anomalías y exportar sellan su acción y exigen rol', () => {
    expect(route(C, 'ack')).toMatchObject({
      url: '/org/governance/anomalies/:id/ack',
      verb: 'POST',
      roles: DUAL,
      audited: expect.objectContaining({ entity: 'access_anomaly' }),
    });
    expect(route(C, 'export')).toMatchObject({
      url: '/org/governance/reports/:kind/export',
      verb: 'POST',
      roles: DUAL,
      audited: expect.objectContaining({
        action: 'GOVERNANCE_REPORT_EXPORTED',
      }),
    });
  });

  it('el panel del doctor es solo de PRACTITIONER/CLINICIAN', () => {
    expect(
      route(PractitionerGovernanceController, 'governancePanel'),
    ).toMatchObject({
      url: '/me/practitioner/governance-panel',
      verb: 'GET',
      roles: ['PRACTITIONER', 'CLINICIAN'],
    });
  });

  it('la exportación pasa la IP de origen y la consulta de sin uso, los días', async () => {
    const exports = { exportReport: mockFn().mockResolvedValue({}) };
    const reports = { unusedAccess: mockFn().mockResolvedValue({}) };
    const c = new GovernanceReportsController(
      reports as any,
      {} as any,
      exports as any,
    );
    const dto = { format: 'csv', reason: 'Auditoría trimestral' } as any;
    await c.export('ownerless', dto, actor, '198.51.100.9');
    expect(exports.exportReport).toHaveBeenCalledWith(actor, 'ownerless', dto, {
      ip: '198.51.100.9',
    });
    await c.unused({ days: 30 } as any, actor);
    expect(reports.unusedAccess).toHaveBeenCalledWith(actor, 30);
  });
});

describe('rutas SYSTEM de barrido (§8.6)', () => {
  const C = GovernanceSweepController;
  it('el barrido diario y el de anomalías son solo de SYSTEM y dejan sello', () => {
    expect(route(C, 'governanceSweep')).toMatchObject({
      url: '/delegated-access/support/governance-sweep',
      verb: 'POST',
      roles: ['SYSTEM'],
      audited: expect.objectContaining({ action: 'SUPPORT_GOVERNANCE_SWEPT' }),
    });
    expect(route(C, 'anomalyScan')).toMatchObject({
      url: '/delegated-access/support/anomaly-scan',
      verb: 'POST',
      roles: ['SYSTEM'],
      audited: expect.objectContaining({ action: 'SUPPORT_ANOMALIES_SCANNED' }),
    });
  });

  it('el diario firma con la cuenta de sistema que lo dispara', async () => {
    const sweep = {
      runDaily: mockFn().mockResolvedValue({ counts: {} }),
      runAnomalyScan: mockFn().mockResolvedValue({ counts: {} }),
    };
    const c = new C(sweep as any);
    await c.governanceSweep(actor);
    expect(sweep.runDaily).toHaveBeenCalledWith(actor);
    await c.anomalyScan();
    expect(sweep.runAnomalyScan).toHaveBeenCalled();
  });
});

describe('B-B12: las exportaciones llevan tope de frecuencia (@Throttle)', () => {
  it.each([
    ['campaña', AccessReviewCampaignsController, 'export'],
    ['informe', GovernanceReportsController, 'export'],
  ] as const)('%s: 5 por minuto por persona', (_label, controller, handler) => {
    const fn = (controller as any).prototype[handler];
    expect(Reflect.getMetadata('THROTTLER:LIMITdefault', fn)).toBe(5);
    expect(Reflect.getMetadata('THROTTLER:TTLdefault', fn)).toBe(60_000);
  });
});
