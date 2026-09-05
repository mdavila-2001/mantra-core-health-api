import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { ClinicalRecordAccessGuard } from './clinical-record-access.guard';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function buildContext(user: any, patientProfileId = 'patient-1'): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user, params: { patientProfileId } }),
    }),
  } as any;
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const forkEm = {};
  const em = { fork: mockFn(() => forkEm) };
  const appointmentsRepo = {
    existsForPractitionerAndPatient: mockFn().mockResolvedValue(false),
  };
  const pdp = { evaluate: mockFn().mockResolvedValue({ decision: 'DENY' }) };
  const guard = new ClinicalRecordAccessGuard(
    em as any,
    appointmentsRepo as any,
    pdp as any,
  );
  return { guard, em, appointmentsRepo, pdp };
}

describe('ClinicalRecordAccessGuard (FT-07-R08)', () => {
  it('deja pasar a SUPERADMIN sin evaluar nada más', async () => {
    const { guard, appointmentsRepo, pdp } = build();
    const actor = { id: 'u1', roles: ['SUPERADMIN'] };
    await expect(guard.canActivate(buildContext(actor))).resolves.toBe(true);
    expect(appointmentsRepo.existsForPractitionerAndPatient).not.toHaveBeenCalled();
    expect(pdp.evaluate).not.toHaveBeenCalled();
  });

  it('deja pasar a quien no ejerce (p. ej. PATIENT) para que el controlador resuelva titularidad', async () => {
    const { guard, appointmentsRepo, pdp } = build();
    const actor = { id: 'u1', roles: ['PATIENT'] };
    await expect(guard.canActivate(buildContext(actor))).resolves.toBe(true);
    expect(appointmentsRepo.existsForPractitionerAndPatient).not.toHaveBeenCalled();
    expect(pdp.evaluate).not.toHaveBeenCalled();
  });

  it('permite al practicante con una cita registrada con ese paciente, sin llamar al PDP', async () => {
    const { guard, appointmentsRepo, pdp } = build();
    appointmentsRepo.existsForPractitionerAndPatient.mockResolvedValue(true);
    const actor = {
      id: 'u1',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'pr-1',
      tenantIds: ['t1'],
    };
    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).resolves.toBe(true);
    expect(appointmentsRepo.existsForPractitionerAndPatient).toHaveBeenCalledWith(
      {},
      'pr-1',
      'patient-1',
    );
    expect(pdp.evaluate).not.toHaveBeenCalled();
  });

  it('permite al clínico sin cita cuando el PDP concede por relación asistencial/grant vigente', async () => {
    const { guard, pdp } = build();
    pdp.evaluate.mockResolvedValue({ decision: 'PERMIT' });
    const actor = {
      id: 'u1',
      roles: ['CLINICIAN'],
      practitionerProfileId: 'pr-1',
      tenantIds: ['t1'],
    };
    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).resolves.toBe(true);
    expect(pdp.evaluate).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'u1',
        tenantId: 't1',
        action: 'READ',
        patientProfileId: 'patient-1',
        practitionerProfileId: 'pr-1',
        purposeOfUse: 'TREATMENT',
      }),
      actor,
    );
  });

  it('rechaza con 403 sin cita, sin tenant y sin grant — cierra CAN-AUTH-001', async () => {
    const { guard } = build();
    const actor = { id: 'u1', roles: ['PRACTITIONER'], practitionerProfileId: 'pr-1' };
    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rechaza cuando el PDP deniega explícitamente (sin base legítima de acceso)', async () => {
    const { guard, pdp } = build();
    pdp.evaluate.mockResolvedValue({ decision: 'DENY' });
    const actor = {
      id: 'u1',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'pr-1',
      tenantIds: ['t1'],
    };
    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
