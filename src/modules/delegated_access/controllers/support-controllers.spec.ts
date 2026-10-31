import { jest } from '@jest/globals';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { IS_TENANT_AGNOSTIC_KEY } from '../../../common/tenant/tenant-agnostic.decorator';
import { AUDITED_KEY } from '../../../common/audit-trail';
import { SupportEngagementRequestsController } from './support-engagement-requests.controller';
import { SupportEngagementsController } from './support-engagements.controller';
import { AffiliationInvitationsController } from './affiliation-invitations.controller';
import { SupportPatientsController } from './support-patients.controller';
import {
  PractitionerSupportController,
  SupportMaintenanceController,
} from './practitioner-support.controller';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'u1', roles: [] } as any;

/** Metadata de un handler: roles, tenant-agnóstico y sello de auditoría. */
function meta(controller: new (...a: any[]) => any, handler: string) {
  const fn = controller.prototype[handler];
  return {
    roles: Reflect.getMetadata(ROLES_KEY, fn) as string[] | undefined,
    agnostic: Reflect.getMetadata(IS_TENANT_AGNOSTIC_KEY, fn) as
      boolean | undefined,
    audited: Reflect.getMetadata(AUDITED_KEY, fn) as
      { action: string } | undefined,
  };
}

describe('rutas del personal de apoyo: autorización y bitácora', () => {
  it('la persona pide y ve lo suyo sin tenant activo; la organización decide con SECURITY_ADMIN', () => {
    const C = SupportEngagementRequestsController;
    expect(meta(C, 'mine').agnostic).toBe(true);
    expect(meta(C, 'mine').roles).toBeUndefined();
    expect(meta(C, 'create').agnostic).toBe(true);
    expect(meta(C, 'create').audited?.action).toBe(
      'SUPPORT_ENGAGEMENT_REQUESTED',
    );
    expect(meta(C, 'list').roles).toEqual(['SECURITY_ADMIN']);
    expect(meta(C, 'decide').roles).toEqual(['SECURITY_ADMIN']);
    expect(meta(C, 'decide').agnostic).toBeUndefined();
  });

  it('las rutas /org/* de vínculos, permisos y consultas son de la administración y operan sobre su tenant', () => {
    const C = SupportEngagementsController;
    for (const handler of [
      'list',
      'listGrants',
      'addGrant',
      'updateGrant',
      'recertify',
      'end',
      'lookup',
      'activityOfTenant',
      'listTemplates',
      'createTemplate',
      'updateTemplate',
    ]) {
      expect(meta(C, handler).roles).toEqual(['SECURITY_ADMIN']);
      expect(meta(C, handler).agnostic).toBeUndefined();
    }
    expect(meta(C, 'end').audited?.action).toBe('SUPPORT_ENGAGEMENT_ENDED');
  });

  it('el canje de códigos es de la persona (sin tenant) y la creación de la administración', () => {
    const C = AffiliationInvitationsController;
    expect(meta(C, 'redeem').agnostic).toBe(true);
    expect(meta(C, 'create').roles).toEqual(['SECURITY_ADMIN']);
  });

  it('el doctor acepta y ajusta solo con rol de profesional; la búsqueda exacta es de la persona y queda auditada', () => {
    const C = PractitionerSupportController;
    for (const handler of ['team', 'teamActivity', 'accept', 'replySettings']) {
      expect(meta(C, handler).roles).toEqual(['PRACTITIONER', 'CLINICIAN']);
    }
    expect(meta(C, 'patientSearch').audited?.action).toBe(
      'SUPPORT_PATIENT_SEARCHED',
    );
    expect(meta(C, 'patientSearch').agnostic).toBe(true);
  });

  it('la búsqueda exacta pasa la IP de origen al servicio (tope por IP)', async () => {
    const search = {
      search: mockFn().mockResolvedValue({ items: [], count: 0 }),
    };
    const c = new PractitionerSupportController(
      {} as any,
      {} as any,
      search as any,
    );
    await c.patientSearch({ tenantId: 't' } as any, actor, '198.51.100.4');
    expect(search.search).toHaveBeenCalledWith(
      { tenantId: 't' },
      actor,
      '198.51.100.4',
    );
  });

  it('la persona confirma su propio vínculo y ve su propia actividad sin tenant activo; el sello toma la organización de la respuesta', () => {
    const confirm = meta(SupportEngagementRequestsController, 'confirmMine');
    expect(confirm.roles).toBeUndefined();
    expect(confirm.agnostic).toBe(true);
    expect(confirm.audited?.action).toBe(
      'SUPPORT_ENGAGEMENT_CONFIRMED_BY_PERSON',
    );
    expect(
      (confirm.audited as { tenantId?: string } | undefined)?.tenantId,
    ).toBe('result.tenantId');
    const activity = meta(PractitionerSupportController, 'myActivity');
    expect(activity.roles).toBeUndefined();
    expect(activity.agnostic).toBe(true);
  });

  it('el mantenimiento lo dispara el sistema o la administración de plataforma', () => {
    for (const handler of [
      'expireRequests',
      'recertificationSweep',
      'refresh',
    ]) {
      // M11: operan sobre TODAS las organizaciones; un administrador de una
      // organización no las dispara, solo el sistema (el worker).
      expect(meta(SupportMaintenanceController, handler).roles).toEqual([
        'SYSTEM',
      ]);
    }
  });
});

describe('delegación de los controladores a sus servicios', () => {
  it('GET /me/support-engagements une vínculos y solicitudes de la propia persona', async () => {
    const requests = { listMine: mockFn().mockResolvedValue([{ id: 'r1' }]) };
    const engagements = {
      listMine: mockFn().mockResolvedValue({ items: [{ id: 'e1' }], count: 1 }),
    };
    const c = new SupportEngagementRequestsController(
      requests as any,
      engagements as any,
      {} as any,
      {} as any,
    );
    const res = await c.mine(actor);
    expect(engagements.listMine).toHaveBeenCalledWith('u1');
    expect(requests.listMine).toHaveBeenCalledWith('u1');
    expect(res).toEqual({
      items: [{ id: 'e1' }],
      count: 1,
      requests: [{ id: 'r1' }],
    });
  });

  it('POST /me/support-engagements/:id/confirm pasa el vínculo y SOLO la persona de la sesión', async () => {
    const engagements = {
      confirmMine: mockFn().mockResolvedValue({ id: 'e1', declaredAt: 'x' }),
    };
    const c = new SupportEngagementRequestsController(
      {} as any,
      engagements as any,
      {} as any,
      {} as any,
    );
    await expect(c.confirmMine('e1', actor)).resolves.toEqual({
      id: 'e1',
      declaredAt: 'x',
    });
    expect(engagements.confirmMine).toHaveBeenCalledWith('e1', actor);
  });

  it('GET /me/support-activity pide la actividad de la persona de la sesión', async () => {
    const activity = {
      forPerson: mockFn().mockResolvedValue({ items: [], count: 0 }),
    };
    const c = new PractitionerSupportController(
      {} as any,
      activity as any,
      {} as any,
    );
    const query = { tenantId: 't' } as any;
    await c.myActivity(query, actor);
    expect(activity.forPerson).toHaveBeenCalledWith(actor, query);
  });

  it('POST decision pasa solicitud, cuerpo y actor al servicio', async () => {
    const requests = {
      decide: mockFn().mockResolvedValue({ requestId: 'r1' }),
    };
    const c = new SupportEngagementRequestsController(
      requests as any,
      {} as any,
      {} as any,
      {} as any,
    );
    const dto = { items: [] } as any;
    await c.decide('r1', dto, actor);
    expect(requests.decide).toHaveBeenCalledWith('r1', dto, actor);
  });

  it('GET /org/access-lookup consulta con el tenant activo, no con uno del cliente', async () => {
    const effective = {
      lookup: mockFn().mockResolvedValue({ items: [], count: 0 }),
    };
    const scope = { resolveTenant: mockFn().mockReturnValue('tenant-activo') };
    const c = new SupportEngagementsController(
      {} as any,
      {} as any,
      effective as any,
      {} as any,
      scope as any,
      {} as any,
    );
    await c.lookup({ doctor: 'pra-1' } as any);
    expect(effective.lookup).toHaveBeenCalledWith('tenant-activo', {
      doctor: 'pra-1',
    });
  });

  it('GET /org/support-catalog lee el catálogo del tenant activo', async () => {
    const catalog = {
      forActiveTenant: mockFn().mockResolvedValue({ tenantId: 't' }),
    };
    const c = new SupportEngagementsController(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      catalog as any,
    );
    await expect(c.catalog()).resolves.toEqual({ tenantId: 't' });
  });

  it('GET /me/support-catalog pasa la persona de la sesión y la organización pedida', async () => {
    const catalog = {
      forPerson: mockFn().mockResolvedValue({ tenantId: 'o' }),
    };
    const c = new SupportEngagementRequestsController(
      {} as any,
      {} as any,
      catalog as any,
      {} as any,
    );
    await c.catalog({ org: 'o' } as any, actor);
    expect(catalog.forPerson).toHaveBeenCalledWith('u1', 'o');
  });

  it('POST /me/support-access-requests pasa el cuerpo y la persona de la sesión al servicio', async () => {
    const accessRequests = {
      requestAsSupport: mockFn().mockResolvedValue({ id: 'ar-1' }),
    };
    const c = new SupportEngagementRequestsController(
      {} as any,
      {} as any,
      {} as any,
      accessRequests as any,
    );
    const dto = { tenantId: 't', practitionerProfileId: 'p' } as any;
    await expect(c.requestClinicalAccess(dto, actor)).resolves.toEqual({
      id: 'ar-1',
    });
    expect(accessRequests.requestAsSupport).toHaveBeenCalledWith(dto, actor);
  });
});

describe('alta de pacientes del personal de apoyo (controlador)', () => {
  it('es de la persona (sin tenant activo), sin rol y queda auditada', () => {
    const m = meta(SupportPatientsController, 'register');
    expect(m.agnostic).toBe(true);
    expect(m.roles).toBeUndefined();
    expect(m.audited?.action).toBe('SUPPORT_PATIENT_REGISTERED');
  });

  it('CREATED responde 201 y POSSIBLE_DUPLICATES responde 200', async () => {
    const registration = { register: mockFn() };
    const c = new SupportPatientsController(registration as any);
    const res = { status: mockFn() };

    registration.register.mockResolvedValue({ outcome: 'CREATED' });
    await expect(
      c.register({ tenantId: 't' } as any, actor, '203.0.113.9', res as any),
    ).resolves.toEqual({ outcome: 'CREATED' });
    expect(res.status).toHaveBeenLastCalledWith(201);

    registration.register.mockResolvedValue({
      outcome: 'POSSIBLE_DUPLICATES',
      duplicates: [],
    });
    await c.register(
      { tenantId: 't' } as any,
      actor,
      '203.0.113.9',
      res as any,
    );
    expect(res.status).toHaveBeenLastCalledWith(200);
    // La IP de origen llega al servicio: cuenta para el tope por IP.
    expect(registration.register).toHaveBeenCalledWith(
      { tenantId: 't' },
      actor,
      '203.0.113.9',
    );
  });
});
