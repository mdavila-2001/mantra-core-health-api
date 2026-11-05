import { jest } from '@jest/globals';
import { findObjectAccessDenial } from './object-access.policy';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const T1 = '00000000-0000-4000-8000-0000000000a1';
const T2 = '00000000-0000-4000-8000-0000000000b2';
const PATIENT = '00000000-0000-4000-8000-0000000000c3';

const actor = { id: 'u1', roles: ['CLINICIAN'], tenantIds: [T1] } as any;

describe('findObjectAccessDenial', () => {
  it('deja pasar a un miembro del tenant con finalidad permitida y acceso al paciente', async () => {
    const clinicalAccess = { assertCanReadHistory: mockFn() };

    await expect(
      findObjectAccessDenial(
        clinicalAccess,
        { tenantId: T1, patientProfileId: PATIENT },
        actor,
        'TREATMENT',
      ),
    ).resolves.toBeUndefined();
    expect(clinicalAccess.assertCanReadHistory).toHaveBeenCalledWith(
      PATIENT,
      actor,
    );
  });

  it('un objeto sin paciente queda con la custodia del tenant y no consulta el expediente', async () => {
    const clinicalAccess = { assertCanReadHistory: mockFn() };

    await expect(
      findObjectAccessDenial(
        clinicalAccess,
        { tenantId: T1, patientProfileId: null },
        actor,
        'OPERATIONS',
      ),
    ).resolves.toBeUndefined();
    expect(clinicalAccess.assertCanReadHistory).not.toHaveBeenCalled();
  });

  it.each([undefined, '', 'CURIOSITY'])(
    'deniega la finalidad %p sin consultar nada más',
    async (purpose) => {
      const clinicalAccess = { assertCanReadHistory: mockFn() };

      await expect(
        findObjectAccessDenial(
          clinicalAccess,
          { tenantId: T1, patientProfileId: PATIENT },
          actor,
          purpose,
        ),
      ).resolves.toBe('PURPOSE_NOT_ALLOWED');
      expect(clinicalAccess.assertCanReadHistory).not.toHaveBeenCalled();
    },
  );

  it('deniega a quien no es miembro del tenant dueño, también a un rol privilegiado', async () => {
    const clinicalAccess = { assertCanReadHistory: mockFn() };
    const superadmin = { id: 'root', roles: ['SUPERADMIN'] } as any;

    await expect(
      findObjectAccessDenial(
        clinicalAccess,
        { tenantId: T2, patientProfileId: PATIENT },
        actor,
        'TREATMENT',
      ),
    ).resolves.toBe('TENANT_MISMATCH');
    await expect(
      findObjectAccessDenial(
        clinicalAccess,
        { tenantId: T1 },
        superadmin,
        'TREATMENT',
      ),
    ).resolves.toBe('TENANT_MISMATCH');
    expect(clinicalAccess.assertCanReadHistory).not.toHaveBeenCalled();
  });

  it('deniega cuando la política del expediente rechaza al actor, sea cual sea el error', async () => {
    const clinicalAccess = {
      assertCanReadHistory: mockFn().mockRejectedValue(new Error('403')),
    };

    await expect(
      findObjectAccessDenial(
        clinicalAccess,
        { tenantId: T1, patientProfileId: PATIENT },
        actor,
        'TREATMENT',
      ),
    ).resolves.toBe('PATIENT_ACCESS_DENIED');
  });
});
