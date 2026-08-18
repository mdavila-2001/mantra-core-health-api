import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ProfilesPractitionersController } from './profiles-practitioners.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const practitionersService = {
    onboardPractitioner: mockFn(),
    addJurisdictionAuthorization: mockFn(),
    addSpecialty: mockFn(),
    verifyCredential: mockFn(),
    setPractitionerPhoto: mockFn(),
    removePractitionerPhoto: mockFn(),
  };
  const controller = new ProfilesPractitionersController(
    practitionersService as any,
  );
  return { controller, practitionersService };
}

describe('ProfilesPractitionersController', () => {
  it('delegates onboardPractitioner (UC-05-03)', async () => {
    const d = build();
    const dto = {
      practitionerCode: 'HP-1',
      licenseNumber: 'L1',
      credentialNumber: 'C1',
    };
    d.practitionersService.onboardPractitioner.mockResolvedValue({
      profileId: 'pp1',
    });
    await expect(
      d.controller.onboardPractitioner(dto as any, actor),
    ).resolves.toEqual({ profileId: 'pp1' });
    expect(d.practitionersService.onboardPractitioner).toHaveBeenCalledWith(
      dto,
      actor,
    );
  });

  it('delegates addJurisdictionAuthorization (UC-05-04)', async () => {
    const d = build();
    const dto = { licenseNumber: 'L2' };
    await d.controller.addJurisdictionAuthorization('pp1', dto, actor);
    expect(
      d.practitionersService.addJurisdictionAuthorization,
    ).toHaveBeenCalledWith('pp1', dto, actor);
  });

  it('delegates addSpecialty (UC-05-06)', async () => {
    const d = build();
    const dto = { isPrimary: true };
    await d.controller.addSpecialty('pp1', dto, actor);
    expect(d.practitionersService.addSpecialty).toHaveBeenCalledWith(
      'pp1',
      dto,
      actor,
    );
  });

  it('delegates verifyCredential (UC-05-05)', async () => {
    const d = build();
    const dto = { decision: 'VERIFIED' };
    await d.controller.verifyCredential('c1', dto as any, actor);
    expect(d.practitionersService.verifyCredential).toHaveBeenCalledWith(
      'c1',
      dto,
      actor,
    );
  });

  it('delegates setPractitionerPhoto with the profile from the route', async () => {
    // El perfil sale del parámetro y el actor de la sesión: el controlador no
    // resuelve permisos, y que el sujeto no venga del cuerpo es lo que impide
    // pedir la foto de otro con una petición bien formada.
    const d = build();
    const dto = { fileId: 'file-1' };
    d.practitionersService.setPractitionerPhoto.mockResolvedValue({
      profileId: 'pp1',
      photoFileId: 'file-1',
    });

    await expect(
      d.controller.setPractitionerPhoto('pp1', dto as any, actor),
    ).resolves.toEqual({ profileId: 'pp1', photoFileId: 'file-1' });
    expect(d.practitionersService.setPractitionerPhoto).toHaveBeenCalledWith(
      'pp1',
      dto,
      actor,
    );
  });

  it('delegates removePractitionerPhoto', async () => {
    const d = build();
    await d.controller.removePractitionerPhoto('pp1', actor);
    expect(d.practitionersService.removePractitionerPhoto).toHaveBeenCalledWith(
      'pp1',
      actor,
    );
  });
});
