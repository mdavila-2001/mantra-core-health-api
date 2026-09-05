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

describe('ClinicalRecordAccessGuard (FT-07-R08)', () => {
  it('deja pasar sin evaluar cuando no hay sujeto o no hay paciente en la ruta', async () => {
    const readService = { assertPuedeLeerHistoria: mockFn() };
    const guard = new ClinicalRecordAccessGuard(readService as any);

    await expect(
      guard.canActivate(buildContext(undefined, 'patient-1')),
    ).resolves.toBe(true);
    // '' y no `undefined`: un parámetro con valor por defecto trata el
    // `undefined` explícito como "usar el default" (`'patient-1'`), lo que
    // haría que este caso pruebe justo lo que NO queremos — string vacío es
    // igual de falsy para el guard y no dispara el default.
    await expect(
      guard.canActivate(buildContext({ id: 'u1', roles: ['PATIENT'] }, '' as any)),
    ).resolves.toBe(true);
    expect(readService.assertPuedeLeerHistoria).not.toHaveBeenCalled();
  });

  it('permite cuando assertPuedeLeerHistoria resuelve sin lanzar', async () => {
    const readService = {
      assertPuedeLeerHistoria: mockFn().mockResolvedValue(undefined),
    };
    const guard = new ClinicalRecordAccessGuard(readService as any);
    const actor = { id: 'u1', roles: ['PRACTITIONER'] };

    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).resolves.toBe(true);
    expect(readService.assertPuedeLeerHistoria).toHaveBeenCalledWith(
      'patient-1',
      actor,
    );
  });

  it('propaga el 403 de assertPuedeLeerHistoria sin envolverlo', async () => {
    const readService = {
      assertPuedeLeerHistoria: mockFn().mockRejectedValue(
        new ForbiddenException('no autorizado'),
      ),
    };
    const guard = new ClinicalRecordAccessGuard(readService as any);
    const actor = { id: 'u1', roles: ['PRACTITIONER'] };

    await expect(
      guard.canActivate(buildContext(actor, 'patient-1')),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
