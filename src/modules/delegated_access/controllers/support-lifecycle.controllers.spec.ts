import { jest } from '@jest/globals';
import {
  PATH_METADATA,
  METHOD_METADATA,
  HTTP_CODE_METADATA,
} from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IS_TENANT_AGNOSTIC_KEY } from '../../../common/tenant/tenant-agnostic.decorator';
import { AUDITED_KEY } from '../../../common/audit-trail';
import { SupportLifecycleController } from './support-lifecycle.controller';
import { TeamAdminController } from './team-admin.controller';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ADMIN_BOTH = ['SECURITY_ADMIN', 'SUPPORT_STAFF'];

/** Metadata de un handler: ruta, método, roles, tenant-agnóstico, sello y código de éxito. */
function meta(controller: new (...a: any[]) => any, handler: string) {
  const fn = controller.prototype[handler];
  return {
    path: Reflect.getMetadata(PATH_METADATA, fn) as string,
    method: Reflect.getMetadata(METHOD_METADATA, fn) as RequestMethod,
    roles: Reflect.getMetadata(ROLES_KEY, fn) as string[] | undefined,
    agnostic: Reflect.getMetadata(IS_TENANT_AGNOSTIC_KEY, fn) as
      boolean | undefined,
    audited: Reflect.getMetadata(AUDITED_KEY, fn) as
      { action: string; entity: string; tenantId?: string } | undefined,
    code: Reflect.getMetadata(HTTP_CODE_METADATA, fn) as number | undefined,
  };
}

describe('SupportLifecycleController: rutas reales', () => {
  const C = SupportLifecycleController;

  it.each([
    ['cases', 'org/lifecycle/cases', RequestMethod.GET, ADMIN_BOTH],
    ['getCase', 'org/lifecycle/cases/:id', RequestMethod.GET, ADMIN_BOTH],
    [
      'completeItem',
      'org/lifecycle/cases/:id/checklist/:code',
      RequestMethod.POST,
      ADMIN_BOTH,
    ],
    [
      'assignHandover',
      'org/lifecycle/cases/:id/handover/assign',
      RequestMethod.POST,
      ADMIN_BOTH,
    ],
    [
      'exportCase',
      'org/lifecycle/cases/:id/export',
      RequestMethod.GET,
      ['SECURITY_ADMIN'],
    ],
    [
      'identityVerification',
      'org/support-engagements/:id/identity-verification',
      RequestMethod.POST,
      ['SECURITY_ADMIN'],
    ],
    [
      'setOwner',
      'org/support-engagements/:id/owner',
      RequestMethod.PUT,
      ['SECURITY_ADMIN'],
    ],
    [
      'move',
      'org/support-engagements/:id/move',
      RequestMethod.POST,
      ['SECURITY_ADMIN'],
    ],
    [
      'handoverPreview',
      'org/support-engagements/:id/handover-preview',
      RequestMethod.GET,
      ['SECURITY_ADMIN'],
    ],
    [
      'offboard',
      'org/support-engagements/:id/offboard',
      RequestMethod.POST,
      ['SECURITY_ADMIN'],
    ],
    [
      'suspend',
      'org/support-engagements/:id/suspend',
      RequestMethod.POST,
      ['SECURITY_ADMIN'],
    ],
    [
      'reactivate',
      'org/support-engagements/:id/reactivate',
      RequestMethod.POST,
      ['SECURITY_ADMIN'],
    ],
  ])('%s: %s con sus roles', (handler, path, method, roles) => {
    const m = meta(C, handler);
    expect(m.path).toBe(path);
    expect(m.method).toBe(method);
    expect(m.roles).toEqual(roles);
    expect(m.agnostic).toBeUndefined();
  });

  it('el compromiso de confidencialidad es de la persona: sin tenant activo y con el tenant del sello salido de la respuesta', () => {
    const m = meta(C, 'confidentialityAck');
    expect(m.path).toBe('me/support-engagements/:id/confidentiality-ack');
    expect(m.method).toBe(RequestMethod.POST);
    expect(m.agnostic).toBe(true);
    expect(m.roles).toBeUndefined();
    expect(m.audited).toMatchObject({
      action: 'SUPPORT_CONFIDENTIALITY_ACKNOWLEDGED',
      tenantId: 'result.tenantId',
    });
  });

  it('toda ruta que muta lleva su sello de auditoría con el verbo del contrato', () => {
    const expected: Record<string, string> = {
      completeItem: 'LIFECYCLE_CHECKLIST_COMPLETED',
      assignHandover: 'SUPPORT_HANDOVER_COMPLETED',
      identityVerification: 'SUPPORT_IDENTITY_VERIFIED',
      setOwner: 'SUPPORT_OWNER_ASSIGNED',
      move: 'SUPPORT_ENGAGEMENT_MOVED',
      offboard: 'SUPPORT_ENGAGEMENT_OFFBOARDED',
      suspend: 'SUPPORT_ENGAGEMENT_SUSPENDED',
      reactivate: 'FOUR_EYES_REQUESTED',
    };
    for (const [handler, action] of Object.entries(expected)) {
      expect(meta(C, handler).audited?.action).toBe(action);
    }
  });

  it('reactivar responde 202 (crea el cuatro ojos) y el cambio de rol 200 o 202 según el caso', () => {
    expect(meta(C, 'reactivate').code).toBe(202);
    expect(meta(C, 'move').code).toBe(200);
  });

  it('el cambio de rol devuelve 202 cuando exige cuatro ojos y 200 cuando se ejecutó', async () => {
    const move = mockFn().mockResolvedValue({
      status: 'PENDING_APPROVAL',
      approvalId: 'ap-1',
    });
    const controller = new C(
      { move } as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const res = { status: mockFn() };
    await controller.move(
      'e1',
      { reason: 'x', grants: [] } as any,
      { id: 'u' } as any,
      res as any,
    );
    expect(res.status).toHaveBeenCalledWith(202);
    const res2 = { status: mockFn() };
    move.mockResolvedValue({ status: 'EXECUTED' });
    await controller.move(
      'e1',
      { reason: 'x', grants: [] } as any,
      { id: 'u' } as any,
      res2 as any,
    );
    expect(res2.status).not.toHaveBeenCalled();
  });
});

describe('TeamAdminController: /org/team/*', () => {
  const C = TeamAdminController;

  it.each([
    ['capabilities', 'capabilities', RequestMethod.GET],
    ['members', 'members', RequestMethod.GET],
    ['member', 'members/:id', RequestMethod.GET],
    ['addGrant', 'members/:id/grants', RequestMethod.POST],
    ['updateGrant', 'members/:id/grants', RequestMethod.PATCH],
    ['recertify', 'members/:id/recertify', RequestMethod.POST],
    ['suspend', 'members/:id/suspend', RequestMethod.POST],
    ['reactivate', 'members/:id/reactivate', RequestMethod.POST],
    ['offboard', 'members/:id/offboard', RequestMethod.POST],
    ['handoverPreview', 'members/:id/handover-preview', RequestMethod.GET],
    ['invite', 'invitations', RequestMethod.POST],
    ['requests', 'requests', RequestMethod.GET],
    ['decide', 'requests/:id/decision', RequestMethod.POST],
  ])('%s: %s', (handler, path, method) => {
    const m = meta(C, handler);
    expect(m.path).toBe(path);
    expect(m.method).toBe(method);
    // La autorización real es del servicio (alcance y techo); el rol de borde es de ejecución.
    expect(m.roles).toEqual(ADMIN_BOTH);
    expect(m.agnostic).toBeUndefined();
  });

  it('el controlador cuelga de /org/team y las rutas que mutan están selladas', () => {
    expect(Reflect.getMetadata(PATH_METADATA, C)).toBe('org/team');
    const expected: Record<string, string> = {
      addGrant: 'SUPPORT_GRANT_CREATED',
      updateGrant: 'SUPPORT_GRANT_UPDATED',
      recertify: 'SUPPORT_ENGAGEMENT_RECERTIFIED',
      suspend: 'SUPPORT_ENGAGEMENT_SUSPENDED',
      reactivate: 'FOUR_EYES_REQUESTED',
      offboard: 'SUPPORT_ENGAGEMENT_OFFBOARDED',
      invite: 'AFFILIATION_INVITATION_CREATED',
      decide: 'SUPPORT_ENGAGEMENT_REQUEST_DECIDED',
    };
    for (const [handler, action] of Object.entries(expected)) {
      expect(meta(C, handler).audited?.action).toBe(action);
    }
  });

  it('códigos de éxito: 201 al otorgar e invitar, 202 al pedir la reactivación', () => {
    expect(meta(C, 'addGrant').code).toBe(201);
    expect(meta(C, 'invite').code).toBe(201);
    expect(meta(C, 'reactivate').code).toBe(202);
    expect(meta(C, 'decide').code).toBe(200);
  });
});
