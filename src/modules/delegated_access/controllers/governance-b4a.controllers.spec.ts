import { jest } from '@jest/globals';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IS_TENANT_AGNOSTIC_KEY } from '../../../common/tenant/tenant-agnostic.decorator';
import { AUDITED_KEY, NOT_AUDITED_KEY } from '../../../common/audit-trail';
import { AccessCatalogController } from './access-catalog.controller';
import { AccessExplainController } from './access-explain.controller';
import { FourEyesController } from './four-eyes.controller';
import { GovernanceRulesController } from './governance-rules.controller';
import { GovernanceSodController } from './governance-sod.controller';
import { PatientRestrictionFlagsController } from './patient-restriction-flags.controller';

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
      { action: string; entity: string; tenantId?: string } | undefined,
    notAudited: Reflect.getMetadata(NOT_AUDITED_KEY, fn) as string | undefined,
  };
}

const ADMIN = ['SECURITY_ADMIN'];
const DUAL = ['SECURITY_ADMIN', 'SUPPORT_STAFF'];
const DOCTORS = ['SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN'];
const APPROVERS = [
  'SECURITY_ADMIN',
  'PRACTITIONER',
  'CLINICIAN',
  'SUPPORT_STAFF',
];

type Row = [
  handler: string,
  verb: string,
  url: string,
  roles: string[] | 'session',
  seal: string | 'none' | 'service',
];

function check(controller: new (...a: any[]) => any, table: Row[]) {
  describe.each(table)('%s', (handler, verb, url, roles, seal) => {
    const r = route(controller, handler);
    it(`${verb} ${url}`, () => {
      expect(r.verb).toBe(verb);
      expect(r.url).toBe(url);
    });
    it('roles', () => {
      if (roles === 'session') {
        expect(r.roles).toBeUndefined();
      } else {
        expect(r.roles).toEqual(roles);
      }
    });
    it('sello de auditoría', () => {
      if (seal === 'none') {
        expect(r.audited).toBeUndefined();
        expect(r.notAudited).toBeUndefined();
      } else if (seal === 'service') {
        expect(r.notAudited).toEqual(expect.stringMatching(/.{20,}/));
        expect(r.audited).toBeUndefined();
      } else {
        expect(r.audited?.action).toBe(seal);
      }
    });
  });
}

describe('reglas, ajustes y normalización (§8.3 A y B)', () => {
  check(GovernanceRulesController, [
    ['list', 'GET', '/org/governance/rules', ADMIN, 'none'],
    [
      'create',
      'POST',
      '/org/governance/rules',
      ADMIN,
      'GOVERNANCE_RULE_CREATED',
    ],
    [
      'update',
      'PATCH',
      '/org/governance/rules/:id',
      ADMIN,
      'GOVERNANCE_RULE_UPDATED',
    ],
    [
      'retire',
      'POST',
      '/org/governance/rules/:id/retire',
      ADMIN,
      'GOVERNANCE_RULE_RETIRED',
    ],
    ['getSettings', 'GET', '/org/governance/settings', ADMIN, 'none'],
    [
      'putSettings',
      'PUT',
      '/org/governance/settings',
      ADMIN,
      'GOVERNANCE_SETTINGS_UPDATED',
    ],
    [
      'normalizeLegacy',
      'POST',
      '/org/governance/normalize-legacy',
      ADMIN,
      'service',
    ],
    [
      'revertNormalization',
      'POST',
      '/org/governance/normalize-legacy/revert',
      ADMIN,
      'service',
    ],
  ]);

  it('delega en los servicios con la persona que actúa', async () => {
    const rules = {
      create: mockFn().mockResolvedValue({ id: 'r' }),
      list: mockFn(),
    };
    const settings = { put: mockFn().mockResolvedValue({}) };
    const normalization = {
      normalize: mockFn().mockResolvedValue({}),
      revert: mockFn(),
    };
    const c = new GovernanceRulesController(
      rules as any,
      settings as any,
      normalization as any,
    );
    await c.create({ kind: 'CEILING' } as any, actor);
    expect(rules.create).toHaveBeenCalledWith({ kind: 'CEILING' }, actor);
    await c.putSettings({ unusedDays: 30 } as any, actor);
    expect(settings.put).toHaveBeenCalledWith({ unusedDays: 30 }, actor);
    await c.normalizeLegacy({ dryRun: true } as any, actor);
    expect(normalization.normalize).toHaveBeenCalledWith(
      { dryRun: true },
      actor,
    );
  });
});

describe('segregación de funciones (§8.3 B)', () => {
  check(GovernanceSodController, [
    ['rules', 'GET', '/org/governance/sod-rules', DUAL, 'none'],
    [
      'createRule',
      'POST',
      '/org/governance/sod-rules',
      ADMIN,
      'SOD_RULE_CREATED',
    ],
    [
      'updateRule',
      'PATCH',
      '/org/governance/sod-rules/:id',
      ADMIN,
      'SOD_RULE_UPDATED',
    ],
    ['findings', 'GET', '/org/governance/sod-findings', DUAL, 'none'],
    ['exceptions', 'GET', '/org/governance/sod-exceptions', DUAL, 'none'],
    [
      'requestException',
      'POST',
      '/org/governance/sod-exceptions',
      DUAL,
      'service',
    ],
    [
      'revokeException',
      'POST',
      '/org/governance/sod-exceptions/:id/revoke',
      ADMIN,
      'service',
    ],
  ]);

  it('la excepción responde 202 (crea un cuatro ojos)', () => {
    const fn = (
      GovernanceSodController.prototype as unknown as Record<string, object>
    ).requestException;
    expect(Reflect.getMetadata('__httpCode__', fn)).toBe(202);
  });
});

describe('banderas de pacientes (§8.3 B)', () => {
  check(PatientRestrictionFlagsController, [
    [
      'get',
      'GET',
      '/org/patients/:patientProfileId/restriction-flags',
      DOCTORS,
      'none',
    ],
    [
      'put',
      'PUT',
      '/org/patients/:patientProfileId/restriction-flags',
      DOCTORS,
      'PATIENT_RESTRICTION_FLAGS_UPDATED',
    ],
  ]);
});

describe('cuatro ojos (§8.3 C)', () => {
  check(FourEyesController, [
    ['create', 'POST', '/me/support-approvals', 'session', 'service'],
    ['listMine', 'GET', '/me/support-approvals', 'session', 'none'],
    [
      'cancel',
      'POST',
      '/me/support-approvals/:id/cancel',
      'session',
      'service',
    ],
    ['pending', 'GET', '/approvals/pending', APPROVERS, 'none'],
    ['decide', 'POST', '/approvals/:id/decision', APPROVERS, 'service'],
  ]);

  it('las rutas de la persona de apoyo no dependen de una organización activa (@TenantAgnostic)', () => {
    for (const handler of ['create', 'listMine', 'cancel']) {
      expect(route(FourEyesController, handler).agnostic).toBe(true);
    }
    for (const handler of ['pending', 'decide']) {
      expect(route(FourEyesController, handler).agnostic).toBeUndefined();
    }
  });
});

describe('explicar y simular (§8.3 A)', () => {
  check(AccessExplainController, [
    ['explainOrg', 'POST', '/org/access/explain', DUAL, 'ACCESS_EXPLAINED'],
    ['simulate', 'POST', '/org/access/simulate', DUAL, 'ACCESS_SIMULATED'],
    [
      'explainMine',
      'POST',
      '/me/support-access/explain',
      'session',
      'ACCESS_EXPLAINED',
    ],
    [
      'explainTeam',
      'POST',
      '/me/practitioner/support-team/explain',
      ['PRACTITIONER', 'CLINICIAN'],
      'ACCESS_EXPLAINED',
    ],
  ]);

  it('el autoservicio sella con la organización que verificó el servicio, no la del cuerpo', () => {
    const r = route(AccessExplainController, 'explainMine');
    expect(r.agnostic).toBe(true);
    expect(r.audited?.tenantId).toBe('result.tenantId');
  });

  it('explicar y simular llevan tope de tasa (60 y 20 por minuto)', () => {
    const limit = (handler: string): unknown =>
      Reflect.getMetadata(
        'THROTTLER:LIMITdefault',
        (
          AccessExplainController.prototype as unknown as Record<string, object>
        )[handler],
      );
    expect(limit('explainOrg')).toBe(60);
    expect(limit('simulate')).toBe(20);
  });
});

describe('catálogo, resumen y efectivos (§8.3 A)', () => {
  check(AccessCatalogController, [
    ['catalog', 'GET', '/org/permission-catalog', DUAL, 'none'],
    ['summaryOf', 'GET', '/org/support-engagements/:id/summary', DUAL, 'none'],
    [
      'effective',
      'GET',
      '/org/support-engagements/:id/effective',
      DUAL,
      'none',
    ],
  ]);
});
