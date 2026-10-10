import { jest } from '@jest/globals';
import { ParseUUIDPipe, type ArgumentMetadata } from '@nestjs/common';
import { ConflictException } from '../../../common';
import { InsurerReceivedClaimsController } from './insurer-received-claims.controller';

// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const actor = { id: 'u-1', roles: ['USER'] } as any;
const ID = '11111111-1111-4111-8111-111111111111';

/** El descriptor del método: lo que Nest inspecciona, sin separar el método de su objeto. */
function handler(name: string): object {
  return Object.getOwnPropertyDescriptor(
    InsurerReceivedClaimsController.prototype,
    name,
  )?.value as object;
}

function build() {
  const service = {
    list: mockFn().mockResolvedValue({ items: [], truncated: false }),
    decide: mockFn().mockResolvedValue({ id: ID }),
  };
  return {
    controller: new InsurerReceivedClaimsController(service as never),
    service,
  };
}

describe('InsurerReceivedClaimsController', () => {
  it('delega el listado con la sesión, sin parámetros del cliente', async () => {
    const { controller, service } = build();

    await expect(controller.listReceivedClaims(actor)).resolves.toEqual({
      items: [],
      truncated: false,
    });
    expect(service.list).toHaveBeenCalledWith(actor);
  });

  it('delega el dictamen con el id, el cuerpo y la sesión', async () => {
    const { controller, service } = build();
    const dto = {
      outcome: 'PARTIAL',
      approvedAmount: '100.00',
      reason: 'Parcial',
    } as any;

    await expect(
      controller.decideReceivedClaim(ID, dto, actor),
    ).resolves.toEqual({
      id: ID,
    });
    expect(service.decide).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('propaga el 409 del servicio tal cual', async () => {
    const { controller, service } = build();
    service.decide.mockRejectedValue(
      new ConflictException('ya decidida', { reason: 'ALREADY_DECIDED' }),
    );

    await expect(
      controller.decideReceivedClaim(ID, { outcome: 'APPROVED' } as any, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('contrato HTTP', () => {
    it('vive en /insurance/received-claims', () => {
      expect(Reflect.getMetadata('path', InsurerReceivedClaimsController)).toBe(
        'insurance/received-claims',
      );
      // `@Get()` sin ruta propia, y `@Post(':id/decision')`.
      expect(Reflect.getMetadata('path', handler('listReceivedClaims'))).toBe(
        '/',
      );
      expect(Reflect.getMetadata('path', handler('decideReceivedClaim'))).toBe(
        ':id/decision',
      );
    });

    it('el dictamen responde 200 y no 201: dictaminar no crea un recurso nuevo', () => {
      expect(
        Reflect.getMetadata('__httpCode__', handler('decideReceivedClaim')),
      ).toBe(200);
    });

    it('no declara @Roles: la barrera es la aseguradora de la sesión y vive en el servicio', () => {
      expect(
        Reflect.getMetadata('requiredRoles', InsurerReceivedClaimsController),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata('requiredRoles', handler('listReceivedClaims')),
      ).toBeUndefined();
      expect(
        Reflect.getMetadata('requiredRoles', handler('decideReceivedClaim')),
      ).toBeUndefined();
    });

    it('el id de la solicitud tiene que ser un uuid', async () => {
      const pipe = new ParseUUIDPipe();
      const meta: ArgumentMetadata = { type: 'param', data: 'id' };

      await expect(pipe.transform(ID, meta)).resolves.toBe(ID);
      await expect(pipe.transform('no-es-uuid', meta)).rejects.toThrow();
    });

    it('no expone las rutas de factura: el modelo no declara dónde vive esa factura', () => {
      const routes = Object.getOwnPropertyNames(
        InsurerReceivedClaimsController.prototype,
      ).filter((name) => name !== 'constructor');

      expect(routes.sort()).toEqual([
        'decideReceivedClaim',
        'listReceivedClaims',
      ]);
    });
  });
});
