import { jest } from '@jest/globals';
import { AuthzClinicalService } from './authz-clinical.service';
import { AuthzErrorReason } from '../authz.error-reasons';
import {
  ACTIVE_TENANT,
  buildClinicalScope,
  inTenant,
  thrown,
} from './authz-clinical-scope.testing';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const grantsRepo = {
    create: mockFn().mockReturnValue({ id: 'cag-e', createdAt: new Date() }),
  };
  const btgRepo = { create: mockFn() };
  const dataAccessLogRepo = { record: mockFn() };
  const auditTrail = { record: mockFn().mockResolvedValue(undefined) };
  const outbox = {
    publishDomainEvent: mockFn().mockResolvedValue({ duplicate: false }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const { scope } = buildClinicalScope();
  const service = new AuthzClinicalService(
    em as any,
    grantsRepo as any,
    btgRepo,
    dataAccessLogRepo as any,
    auditTrail as any,
    outbox as any,
    scope,
    logger as any,
  );
  return {
    service: inTenant(service),
    grantsRepo,
    btgRepo,
    auditTrail,
    outbox,
    dataAccessLogRepo,
  };
}

const dto = {
  tenantId: ACTIVE_TENANT,
  justification: 'paciente inconsciente en urgencias',
} as any;

describe('AuthzClinicalService.breakTheGlass: GP-4 sin break-glass para el personal de apoyo (G-06)', () => {
  it('Ana (solo el rol de ejecución SUPPORT_STAFF) recibe 403 BREAK_GLASS_NOT_FOR_SUPPORT y no se crea NADA', async () => {
    const d = build();
    const ana = { id: 'ana', roles: ['SUPPORT_STAFF'] } as any;
    const error: any = await thrown(d.service.breakTheGlass('pat-1', dto, ana));
    expect(error.getStatus()).toBe(403);
    expect(error.reason ?? error.getResponse().reason).toBe(
      AuthzErrorReason.BREAK_GLASS_NOT_FOR_SUPPORT,
    );
    expect(d.grantsRepo.create).not.toHaveBeenCalled();
    expect(d.btgRepo.create).not.toHaveBeenCalled();
    expect(d.dataAccessLogRepo.record).not.toHaveBeenCalled();
    expect(d.outbox.publishDomainEvent).not.toHaveBeenCalled();
  });

  it('el rechazo deja su asiento BREAK_GLASS_REJECTED_FOR_SUPPORT (fallido, con el tenant del contexto)', async () => {
    const d = build();
    await thrown(
      d.service.breakTheGlass('pat-1', dto, {
        id: 'ana',
        roles: ['SUPPORT_STAFF'],
      } as any),
    );
    expect(d.auditTrail.record).toHaveBeenCalledTimes(1);
    expect(d.auditTrail.record.mock.calls[0][2]).toMatchObject({
      action: 'BREAK_GLASS_REJECTED_FOR_SUPPORT',
      entityId: 'pat-1',
      tenantId: ACTIVE_TENANT,
      success: false,
    });
  });

  it('el Dr. Pérez (CLINICAL_APPROVER) sigue activándolo como hoy', async () => {
    const d = build();
    const res = await d.service.breakTheGlass('pat-1', dto, {
      id: 'perez',
      roles: ['CLINICAL_APPROVER'],
    } as any);
    expect(res.id).toBe('cag-e');
    expect(d.btgRepo.create).toHaveBeenCalled();
  });

  it('quien tiene apoyo Y un rol que habilita el break-glass (administrador) no se rechaza', async () => {
    const d = build();
    const res = await d.service.breakTheGlass('pat-1', dto, {
      id: 'gonzalo',
      roles: ['SUPPORT_STAFF', 'SECURITY_ADMIN'],
    } as any);
    expect(res.id).toBe('cag-e');
  });

  it('el rol de apoyo con ámbito de OTRA organización no rige aquí: no se rechaza por apoyo', async () => {
    const d = build();
    const actor = {
      id: 'x',
      roles: ['SUPPORT_STAFF', 'CLINICAL_APPROVER'],
      scopedRoles: { 'otra-org': ['SUPPORT_STAFF'] },
    } as any;
    const res = await d.service.breakTheGlass('pat-1', dto, actor);
    expect(res.id).toBe('cag-e');
  });
});
