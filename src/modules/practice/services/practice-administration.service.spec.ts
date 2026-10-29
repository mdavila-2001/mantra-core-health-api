import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { ResourceNotFoundException } from '../../../common';
import { PracticeErrorReason } from '../practice.error-reasons';
import { PracticeAdministrationService } from './practice-administration.service';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const em = {} as any;

/**
 * Arma el servicio con una práctica del tenant A y una regla de administración
 * que solo deja pasar a quien administra el tenant que se le pregunta.
 *
 * @param adminOf - Tenants que administra el actor de la prueba.
 * @param platform - Si el actor tiene un rol de plataforma.
 * @param practice - Práctica que devuelve el repositorio, o `null`.
 * @returns El servicio y el mock de la regla.
 */
function build(adminOf: string[], platform = false, practice: any = null) {
  const practicesRepo = {
    findById: mockFn().mockResolvedValue(practice),
  };
  const tenantAdministration = {
    assertCanAdminister: mockFn().mockImplementation(
      async (_em: any, tenantId: string) => {
        if (platform || adminOf.includes(tenantId)) return;
        throw new ForbiddenException('Se requiere ser OWNER o ADMIN');
      },
    ),
  };
  const service = new PracticeAdministrationService(
    practicesRepo as any,
    tenantAdministration as any,
  );
  return { service, practicesRepo, tenantAdministration };
}

describe('PracticeAdministrationService', () => {
  const actor = { id: 'user-1', roles: ['USER'] } as any;
  const practiceA = { id: 'pr-a', tenantId: TENANT_A };

  it('deja pasar al administrador de la organización dueña y devuelve la práctica', async () => {
    const { service, tenantAdministration } = build(
      [TENANT_A],
      false,
      practiceA,
    );

    await expect(
      service.assertCanAdministerPractice(em, 'pr-a', actor),
    ).resolves.toBe(practiceA);
    expect(tenantAdministration.assertCanAdminister).toHaveBeenCalledWith(
      em,
      TENANT_A,
      actor,
    );
  });

  it('rechaza con 403 al administrador de otra organización', async () => {
    const { service } = build([TENANT_B], false, practiceA);

    await expect(
      service.assertCanAdministerPractice(em, 'pr-a', actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('deja pasar a un rol de plataforma (SECURITY_ADMIN) sin membresía', async () => {
    const { service } = build([], true, practiceA);
    const platformActor = { id: 'sec-1', roles: ['SECURITY_ADMIN'] } as any;

    await expect(
      service.assertCanAdministerPractice(em, 'pr-a', platformActor),
    ).resolves.toBe(practiceA);
  });

  it('responde 404 uniforme si la práctica no existe y no consulta la regla', async () => {
    const { service, tenantAdministration } = build([TENANT_A]);

    const failure = await service
      .assertCanAdministerPractice(em, 'pr-x', actor)
      .catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(ResourceNotFoundException);
    expect((failure as ResourceNotFoundException).reason).toBe(
      PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
    );
    expect(tenantAdministration.assertCanAdminister).not.toHaveBeenCalled();
  });
});
