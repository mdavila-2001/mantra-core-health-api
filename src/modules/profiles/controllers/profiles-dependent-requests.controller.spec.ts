import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ArgumentMetadata, ParseUUIDPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConflictException } from '../../../common';
import { RequestDependentLinkDto } from '../dto';
import { ProfilesDependentRequestsController } from './profiles-dependent-requests.controller';

const actor = { id: 'user-1', roles: ['USER', 'PATIENT'] } as any;
const ID = '11111111-1111-4111-8111-111111111111';

/**
 * Construye el controlador con el servicio doblado.
 *
 * @returns El controlador y el doble del servicio.
 */
function build() {
  const requests = {
    request: fn().mockResolvedValue({ id: ID, status: 'PENDING' }),
    listIncoming: fn().mockResolvedValue([]),
    accept: fn().mockResolvedValue({ id: ID, status: 'ACCEPTED' }),
    reject: fn().mockResolvedValue({ id: ID, status: 'REJECTED' }),
  };
  const controller = new ProfilesDependentRequestsController(requests as never);
  return { controller, requests };
}

/**
 * Los errores de validación del cuerpo, como los vería el `ValidationPipe`.
 *
 * @param cuerpo - Lo que mandaría el cliente.
 * @returns Las propiedades que no pasaron.
 */
async function erroresDe(cuerpo: unknown): Promise<string[]> {
  const dto = plainToInstance(RequestDependentLinkDto, cuerpo);
  const errores = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return errores.map((e) => e.property);
}

describe('ProfilesDependentRequestsController', () => {
  it('delega el pedido con el cuerpo y la sesión', async () => {
    const { controller, requests } = build();
    const dto = { nationalId: '7654321' };

    await expect(controller.requestDependentLink(dto, actor)).resolves.toEqual({
      id: ID,
      status: 'PENDING',
    });
    expect(requests.request).toHaveBeenCalledWith(dto, actor);
  });

  it('delega el listado, aceptar y rechazar sin tomar el sujeto del cliente', async () => {
    const { controller, requests } = build();

    await controller.listIncomingDependentLinkRequests(actor);
    await controller.acceptDependentLinkRequest(ID, actor);
    await controller.rejectDependentLinkRequest(ID, actor);

    expect(requests.listIncoming).toHaveBeenCalledWith(actor);
    expect(requests.accept).toHaveBeenCalledWith(ID, actor);
    expect(requests.reject).toHaveBeenCalledWith(ID, actor);
  });

  it('propaga el 409 del servicio tal cual', async () => {
    const { controller, requests } = build();
    requests.accept.mockRejectedValue(new ConflictException('ya respondida'));

    await expect(
      controller.acceptDependentLinkRequest(ID, actor),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  describe('forma del cuerpo', () => {
    it('acepta un CI con espacios alrededor (el servicio los quita)', async () => {
      expect(await erroresDe({ nationalId: ' 7654321 ' })).toEqual([]);
    });

    it('acepta el límite: 4 y 40 caracteres', async () => {
      expect(await erroresDe({ nationalId: '1234' })).toEqual([]);
      expect(await erroresDe({ nationalId: 'A'.repeat(40) })).toEqual([]);
    });

    it('rechaza vacío, muy corto, muy largo o con caracteres fuera de forma', async () => {
      expect(await erroresDe({ nationalId: '' })).toEqual(['nationalId']);
      expect(await erroresDe({ nationalId: '123' })).toEqual(['nationalId']);
      expect(await erroresDe({ nationalId: 'A'.repeat(41) })).toEqual([
        'nationalId',
      ]);
      expect(await erroresDe({ nationalId: "1'; drop" })).toEqual([
        'nationalId',
      ]);
      expect(await erroresDe({})).toEqual(['nationalId']);
    });

    it('rechaza claves que el contrato no declara', async () => {
      expect(
        await erroresDe({ nationalId: '7654321', patientProfileId: ID }),
      ).toEqual(['patientProfileId']);
    });
  });

  it('el id de la solicitud tiene que ser un uuid', async () => {
    const pipe = new ParseUUIDPipe();
    const meta: ArgumentMetadata = { type: 'param', data: 'id' };

    await expect(pipe.transform(ID, meta)).resolves.toBe(ID);
    await expect(pipe.transform('no-es-uuid', meta)).rejects.toThrow();
  });
});
