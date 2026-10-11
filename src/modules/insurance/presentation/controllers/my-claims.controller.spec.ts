import { jest } from '@jest/globals';
import { ForbiddenException } from '@nestjs/common';
import { MyClaimsController } from './my-claims.controller';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('MyClaimsController', () => {
  const actor = { id: 'u-1', roles: ['PATIENT'], patientProfileId: 'p-1' };

  it('delega identidad firmada y selección de tenant sin aceptar IDs de pacientes', async () => {
    const service = {
      list: mockFn().mockResolvedValue({
        view: 'PATIENT',
        items: [],
        truncated: false,
      }),
    };
    const controller = new MyClaimsController(service as never);
    expect(await controller.listMyClaims(actor, 'tenant-selected')).toEqual({
      view: 'PATIENT',
      items: [],
      truncated: false,
    });
    expect(service.list).toHaveBeenCalledWith(actor, 'tenant-selected');
  });

  it('conserva rechazo de ownership del servicio', async () => {
    const service = {
      list: mockFn().mockRejectedValue(new ForbiddenException('Sin acceso')),
    };
    await expect(
      new MyClaimsController(service as never).listMyClaims(actor),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('GET autenticado de autoservicio no exige tenant ni rol de aseguradora', () => {
    // eslint-disable-next-line @typescript-eslint/unbound-method -- se lee la metadata del método, no se invoca
    const handler = MyClaimsController.prototype.listMyClaims;
    expect(Reflect.getMetadata('path', MyClaimsController)).toBe(
      'insurance/my-claims',
    );
    expect(Reflect.getMetadata('path', handler)).toBe('/');
    expect(Reflect.getMetadata('method', handler)).toBe(0);
    expect(Reflect.getMetadata('isTenantAgnostic', MyClaimsController)).toBe(
      true,
    );
    expect(Reflect.getMetadata('isPublic', MyClaimsController)).toBeUndefined();
    expect(
      Reflect.getMetadata('requiredRoles', MyClaimsController),
    ).toBeUndefined();
  });
});
