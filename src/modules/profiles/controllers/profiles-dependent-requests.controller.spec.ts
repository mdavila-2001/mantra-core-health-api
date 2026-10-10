import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { ArgumentMetadata, ParseUUIDPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ConflictException } from '../../../common';
import { DependentCandidatesQueryDto, RequestDependentLinkDto } from '../dto';
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
    findCandidates: fn().mockResolvedValue([]),
    accept: fn().mockResolvedValue({ id: ID, status: 'ACCEPTED' }),
    reject: fn().mockResolvedValue({ id: ID, status: 'REJECTED' }),
  };
  const controller = new ProfilesDependentRequestsController(requests as never);
  return { controller, requests };
}

/**
 * Los errores de validación del cuerpo, como los vería el `ValidationPipe`.
 *
 * @param body - Lo que mandaría el cliente.
 * @returns Las propiedades que no pasaron.
 */
async function errors(body: unknown): Promise<string[]> {
  const dto = plainToInstance(RequestDependentLinkDto, body);
  const validationErrors = await validate(dto, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });
  return validationErrors.map((e) => e.property);
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

  describe('candidatos por nombre', () => {
    /**
     * Los errores de validación del filtro, como los vería el `ValidationPipe`.
     *
     * @param query - Lo que mandaría el cliente en la query string.
     * @returns Las propiedades que no pasaron.
     */
    async function errorsQuery(query: unknown): Promise<string[]> {
      const dto = plainToInstance(DependentCandidatesQueryDto, query);
      const validationErrors = await validate(dto, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });
      return validationErrors.map((e) => e.property);
    }

    it('delega el texto y la sesión, sin tomar a nadie del cliente', async () => {
      const { controller, requests } = build();
      requests.findCandidates.mockResolvedValue([
        { patientProfileId: ID, displayName: 'Luis Pérez' },
      ]);

      await expect(
        controller.listDependentCandidates({ q: 'luis' }, actor),
      ).resolves.toEqual([{ patientProfileId: ID, displayName: 'Luis Pérez' }]);
      expect(requests.findCandidates).toHaveBeenCalledWith('luis', actor);
    });

    it('sin texto delega `undefined`: el servicio responde vacío', async () => {
      const { controller, requests } = build();

      await controller.listDependentCandidates({}, actor);

      expect(requests.findCandidates).toHaveBeenCalledWith(undefined, actor);
    });

    it('acepta el texto y hasta 100 caracteres', async () => {
      expect(await errorsQuery({ q: 'luis' })).toEqual([]);
      expect(await errorsQuery({})).toEqual([]);
      expect(await errorsQuery({ q: 'a'.repeat(100) })).toEqual([]);
    });

    it('rechaza un texto de más de 100 caracteres y las claves que el contrato no declara', async () => {
      expect(await errorsQuery({ q: 'a'.repeat(101) })).toEqual(['q']);
      expect(await errorsQuery({ q: 'luis', limit: '500' })).toEqual(['limit']);
    });

    it('la búsqueda tiene su propio freno de frecuencia', () => {
      const handler = Object.getOwnPropertyDescriptor(
        ProfilesDependentRequestsController.prototype,
        'listDependentCandidates',
      )?.value as object;
      const limit = Reflect.getMetadata('THROTTLER:LIMITdefault', handler);

      expect(limit).toBe(30);
    });
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
      expect(await errors({ nationalId: ' 7654321 ' })).toEqual([]);
    });

    it('acepta el límite: 4 y 40 caracteres', async () => {
      expect(await errors({ nationalId: '1234' })).toEqual([]);
      expect(await errors({ nationalId: 'A'.repeat(40) })).toEqual([]);
    });

    it('rechaza vacío, muy corto, muy largo o con caracteres fuera de forma', async () => {
      expect(await errors({ nationalId: '' })).toEqual(['nationalId']);
      expect(await errors({ nationalId: '123' })).toEqual(['nationalId']);
      expect(await errors({ nationalId: 'A'.repeat(41) })).toEqual([
        'nationalId',
      ]);
      expect(await errors({ nationalId: "1'; drop" })).toEqual(['nationalId']);
      expect(await errors({})).toEqual(['nationalId']);
    });

    it('rechaza claves que el contrato no declara', async () => {
      expect(await errors({ nationalId: '7654321', role: 'ADMIN' })).toEqual([
        'role',
      ]);
      expect(await errors({ patientProfileId: ID, tenantId: ID })).toEqual([
        'tenantId',
      ]);
    });

    it('acepta el perfil elegido de la búsqueda por nombre, solo', async () => {
      expect(await errors({ patientProfileId: ID })).toEqual([]);
    });

    it('el perfil tiene que ser un uuid', async () => {
      expect(await errors({ patientProfileId: 'no-es-uuid' })).toEqual([
        'patientProfileId',
      ]);
      expect(await errors({ patientProfileId: '' })).toEqual([
        'patientProfileId',
      ]);
    });

    it('rechaza mandar el documento y el perfil juntos: una sola vía por pedido', async () => {
      expect(
        await errors({ nationalId: '7654321', patientProfileId: ID }),
      ).toEqual(['patientProfileId']);
    });

    it('rechaza no mandar ninguno de los dos', async () => {
      expect(await errors({})).toEqual(['nationalId']);
    });
  });

  it('el id de la solicitud tiene que ser un uuid', async () => {
    const pipe = new ParseUUIDPipe();
    const meta: ArgumentMetadata = { type: 'param', data: 'id' };

    await expect(pipe.transform(ID, meta)).resolves.toBe(ID);
    await expect(pipe.transform('no-es-uuid', meta)).rejects.toThrow();
  });
});
