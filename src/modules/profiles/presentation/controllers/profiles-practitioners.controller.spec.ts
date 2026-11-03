import { jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import {
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
} from '@nestjs/common/constants';

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
    setOwnPrimarySpecialty: mockFn(),
    verifyCredential: mockFn(),
    updateOwnCredential: mockFn(),
    setPractitionerPhoto: mockFn(),
    removePractitionerPhoto: mockFn(),
    getOwnOnboarding: mockFn(),
  };
  // El buscador del padrón: el controller sólo le pasa los tres parámetros de
  // la query, así que alcanza con poder observar con qué lo llamó.
  const linkableOrganizations = { buscar: mockFn() };
  const controller = new ProfilesPractitionersController(
    practitionersService as any,
    linkableOrganizations as any,
  );
  return { controller, practitionersService, linkableOrganizations };
}

describe('ProfilesPractitionersController', () => {
  it('declares and delegates the own-credential PATCH without accepting a profile id', async () => {
    const d = build();
    const handler: unknown = Reflect.get(d.controller, 'updateOwnCredential');
    expect(typeof handler).toBe('function');
    if (typeof handler !== 'function') return;

    expect(Reflect.getMetadata(PATH_METADATA, handler)).toBe(
      'practitioners/me/credentials/:credentialId',
    );
    expect(Reflect.getMetadata(METHOD_METADATA, handler)).toBe(
      RequestMethod.PATCH,
    );
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, handler)).toBe(204);

    const dto = { number: 'DIP-2' };
    d.practitionersService.updateOwnCredential.mockResolvedValue(undefined);
    await expect(
      Promise.resolve(
        Reflect.apply(handler, d.controller, ['cred-1', dto, actor]),
      ),
    ).resolves.toBeUndefined();
    expect(d.practitionersService.updateOwnCredential).toHaveBeenCalledWith(
      'cred-1',
      dto,
      actor,
    );
  });

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

  it('delegates setOwnPrimarySpecialty (UC-05-06·P) sin pasarle ningún profileId', async () => {
    const d = build();
    await d.controller.setOwnPrimarySpecialty('esp-2', actor);
    // Sólo el id de la especialidad y la sesión: no hay perfil ajeno que
    // marcar escribiendo una URL.
    expect(d.practitionersService.setOwnPrimarySpecialty).toHaveBeenCalledWith(
      'esp-2',
      actor,
    );
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

  /**
   * TJ-1: el sujeto sale de la sesión y no hay parámetro que apunte a otro, así
   * que lo único que este endpoint puede devolver es el avance de quien pregunta.
   */
  it('delegates getOwnOnboarding con el actor de la sesión (TJ-1)', async () => {
    const d = build();
    d.practitionersService.getOwnOnboarding.mockResolvedValue({
      practitionerProfileId: 'pp1',
      steps: [],
      firstIncomplete: 'done',
    });

    await expect(d.controller.getOwnOnboarding(actor)).resolves.toEqual({
      practitionerProfileId: 'pp1',
      steps: [],
      firstIncomplete: 'done',
    });
    expect(d.practitionersService.getOwnOnboarding).toHaveBeenCalledWith(actor);
  });
});
