import { jest } from '@jest/globals';
import { PATH_METADATA } from '@nestjs/common/constants';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import {
  PracticeInvitationsController,
  PractitionerInvitationsController,
} from './index';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'u1', practitionerProfileId: 'hp1' } as any;

/**
 * El método de un controlador tal como lo ve el framework, sin desligarlo de la instancia.
 *
 * @param controller - Clase del controlador.
 * @param name - Nombre del método.
 * @returns La función del prototipo.
 */
const handlerOf = (controller: { prototype: object }, name: string): object =>
  Object.getOwnPropertyDescriptor(controller.prototype, name)!.value as object;

/**
 * Lee la ruta declarada de un handler.
 *
 * @param handler - Método del controlador.
 * @returns La ruta del decorador HTTP.
 */
const routeOf = (handler: object): string =>
  Reflect.getMetadata(PATH_METADATA, handler) as string;

describe('PracticeInvitationsController', () => {
  const service = { invite: mockFn() };
  const controller = new PracticeInvitationsController(service as any);

  it('delegates invite en POST :practiceId/role-assignments/invitations', async () => {
    const dto = {
      practitionerProfileId: 'hp1',
      practiceSiteId: 's1',
      healthcareServiceIds: ['a', 'b'],
    };
    await controller.invite('p1', dto, actor);

    expect(service.invite).toHaveBeenCalledWith('p1', dto, actor);
    expect(routeOf(handlerOf(PracticeInvitationsController, 'invite'))).toBe(
      ':practiceId/role-assignments/invitations',
    );
  });

  it('no declara @Roles: la autorización es la administración de esa organización', () => {
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        handlerOf(PracticeInvitationsController, 'invite'),
      ),
    ).toBeUndefined();
  });
});

describe('PractitionerInvitationsController', () => {
  const service = { accept: mockFn(), decline: mockFn() };
  const controller = new PractitionerInvitationsController(service as any);

  it('delegates accept y decline con el actor autenticado', async () => {
    await controller.accept('r1', actor);
    await controller.decline('r2', actor);

    expect(service.accept).toHaveBeenCalledWith('r1', actor);
    expect(service.decline).toHaveBeenCalledWith('r2', actor);
  });

  it('cuelgan de me/role-assignments/:roleId y exigen PRACTITIONER', () => {
    expect(
      routeOf(handlerOf(PractitionerInvitationsController, 'accept')),
    ).toBe('me/role-assignments/:roleId/accept');
    expect(
      routeOf(handlerOf(PractitionerInvitationsController, 'decline')),
    ).toBe('me/role-assignments/:roleId/decline');
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        handlerOf(PractitionerInvitationsController, 'accept'),
      ),
    ).toEqual(['PRACTITIONER']);
    expect(
      Reflect.getMetadata(
        ROLES_KEY,
        handlerOf(PractitionerInvitationsController, 'decline'),
      ),
    ).toEqual(['PRACTITIONER']);
  });
});
