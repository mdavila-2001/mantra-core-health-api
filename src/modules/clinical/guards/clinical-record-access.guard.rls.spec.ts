import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { rlsFixture } from '../../../common/tenant/rls-transaction.testing';
import { ClinicalRecordAccessGuard } from './clinical-record-access.guard';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const TENANT = 'aaaaaaaa-1111-1111-1111-111111111111';

const ctx = (user: any, resolvedTenantId?: string, method = 'GET') =>
  ({
    switchToHttp: () => ({
      getRequest: () => ({
        user,
        params: { patientProfileId: 'patient-1' },
        method,
        resolvedTenantId,
      }),
    }),
  }) as any;

describe('ClinicalRecordAccessGuard under RLS', () => {
  const previous = process.env.RLS_ENFORCE;
  beforeEach(() => {
    process.env.RLS_ENFORCE = 'true';
  });
  afterEach(() => {
    if (previous === undefined) delete process.env.RLS_ENFORCE;
    else process.env.RLS_ENFORCE = previous;
  });

  const clinician = { id: 'u1', roles: ['PRACTITIONER'] };

  it('a clinician is evaluated inside a read-only tenant transaction and the manager reaches the service', async () => {
    const f = rlsFixture();
    const readService = { resolveReadScope: mockFn() };
    const guard = new ClinicalRecordAccessGuard(readService as any, f.em);
    await expect(guard.canActivate(ctx(clinician, TENANT))).resolves.toBe(true);
    expect(f.transactional.mock.calls[0][1]).toEqual({ readOnly: true });
    expect(f.calls).toEqual([
      "select set_config('app.system_context', 'false', true)",
      `select set_config('app.current_tenant_id', ?, true) <- ${TENANT}`,
    ]);
    expect(readService.resolveReadScope).toHaveBeenCalledWith(
      'patient-1',
      clinician,
      f.tx,
    );
  });

  it('a write goes through the write policy with the same manager', async () => {
    const f = rlsFixture();
    const readService = { assertCanWriteHistory: mockFn() };
    const guard = new ClinicalRecordAccessGuard(readService as any, f.em);
    await guard.canActivate(ctx(clinician, TENANT, 'POST'));
    expect(readService.assertCanWriteHistory).toHaveBeenCalledWith(
      'patient-1',
      clinician,
      { scoped: f.tx },
    );
  });

  it('the read scope is resolved inside the transaction and left on the request', async () => {
    const f = rlsFixture();
    const scope = { kind: 'SPECIALTIES' };
    const readService = { resolveReadScope: mockFn().mockResolvedValue(scope) };
    const guard = new ClinicalRecordAccessGuard(readService as any, f.em);
    const request: any = {
      user: clinician,
      params: { patientProfileId: 'patient-1' },
      method: 'GET',
      resolvedTenantId: TENANT,
    };
    await guard.canActivate({
      switchToHttp: () => ({ getRequest: () => request }),
    } as any);
    expect(readService.resolveReadScope).toHaveBeenCalledWith(
      'patient-1',
      clinician,
      f.tx,
    );
    expect(request.clinicalReadScope).toBe(scope);
  });

  it('a write with an encounter passes it together with the same manager', async () => {
    const f = rlsFixture();
    const readService = { assertCanWriteHistory: mockFn() };
    const guard = new ClinicalRecordAccessGuard(readService as any, f.em);
    await guard.canActivate({
      switchToHttp: () => ({
        getRequest: () => ({
          user: clinician,
          params: { patientProfileId: 'patient-1' },
          method: 'POST',
          body: { encounterId: 'enc-1' },
          resolvedTenantId: TENANT,
        }),
      }),
    } as any);
    expect(readService.assertCanWriteHistory).toHaveBeenCalledWith(
      'patient-1',
      clinician,
      { encounterId: 'enc-1', scoped: f.tx },
    );
  });

  it('a denial inside the transaction still reaches the caller as 403', async () => {
    const f = rlsFixture();
    const readService = {
      resolveReadScope: mockFn().mockRejectedValue(
        new ForbiddenException('no autorizado'),
      ),
    };
    const guard = new ClinicalRecordAccessGuard(readService as any, f.em);
    await expect(
      guard.canActivate(ctx(clinician, TENANT)),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('a patient does not open a transaction: the service reads its own tables', async () => {
    const f = rlsFixture();
    const readService = { resolveReadScope: mockFn() };
    const guard = new ClinicalRecordAccessGuard(readService as any, f.em);
    const patient = { id: 'p', roles: ['PATIENT'] };
    await guard.canActivate(ctx(patient, TENANT));
    expect(f.fork).not.toHaveBeenCalled();
    expect(readService.resolveReadScope).toHaveBeenCalledWith(
      'patient-1',
      patient,
    );
  });

  it('without a resolved tenant the clinician is evaluated as before, with no transaction', async () => {
    const f = rlsFixture();
    const readService = { resolveReadScope: mockFn() };
    const guard = new ClinicalRecordAccessGuard(readService as any, f.em);
    await guard.canActivate(ctx(clinician, undefined));
    expect(f.fork).not.toHaveBeenCalled();
    expect(readService.resolveReadScope).toHaveBeenCalledWith(
      'patient-1',
      clinician,
    );
  });
});
