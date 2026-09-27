import { jest } from '@jest/globals';
import {
  HttpStatus,
  RequestMethod,
  ValidationPipe,
  type ArgumentMetadata,
} from '@nestjs/common';
import {
  HEADERS_METADATA,
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
import { IamUsersController } from './iam-users.controller';
import { ROLES_KEY } from '../../../common/auth/roles.decorator';
import { SearchUsersBodyDto } from '../dto';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const usersService = {
    createUser: mockFn(),
    lock: mockFn(),
    changeGlobalRole: mockFn(),
    anonymize: mockFn(),
  };
  const usersReadService = {
    searchUsers: mockFn(),
    getUserById: mockFn(),
    listCredentials: mockFn(),
    listDevices: mockFn(),
    listMfaFactors: mockFn(),
    listSessions: mockFn(),
    listGlobalRoles: mockFn(),
  };
  const credentialsService = {
    linkFederated: mockFn(),
    revokeCredential: mockFn(),
  };
  const mfaService = { enrollOrVerify: mockFn() };
  const devicesService = { register: mockFn() };
  const assistedRegistrationService = { assistedRegistration: mockFn() };
  // P6: el alta administrativa de un profesional cuelga del mismo servicio que
  // el autorregistro, porque comparten el registro CTI atómico.
  const practitionerRegistrationService = {
    assistedRegisterPractitioner: mockFn(),
  };

  const controller = new IamUsersController(
    usersService as any,
    usersReadService as any,
    credentialsService as any,
    mfaService as any,
    devicesService as any,
    assistedRegistrationService as any,
    practitionerRegistrationService as any,
  );
  return {
    controller,
    usersService,
    usersReadService,
    credentialsService,
    mfaService,
    devicesService,
    assistedRegistrationService,
  };
}

describe('IamUsersController', () => {
  it('delegates createUser (UC-01-01)', async () => {
    const d = build();
    const dto = { displayName: 'A', email: 'a@x.io', password: 'password123' };
    d.usersService.createUser.mockResolvedValue({ id: 'u1' });
    await expect(d.controller.createUser(dto as any, actor)).resolves.toEqual({
      id: 'u1',
    });
    expect(d.usersService.createUser).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates linkFederated (UC-01-02)', async () => {
    const d = build();
    const dto = { identityProvider: 'g', externalSubject: 's' };
    await d.controller.linkFederated('u1', dto, actor);
    expect(d.credentialsService.linkFederated).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates revokeCredential (UC-01-09)', async () => {
    const d = build();
    await d.controller.revokeCredential('u1', 'c1', actor);
    expect(d.credentialsService.revokeCredential).toHaveBeenCalledWith(
      'u1',
      'c1',
      actor,
    );
  });

  it('delegates mfaFactor (UC-01-03)', async () => {
    const d = build();
    const dto = { factorType: 'TOTP' };
    await d.controller.mfaFactor('u1', dto as any, actor);
    expect(d.mfaService.enrollOrVerify).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates registerDevice (UC-01-05)', async () => {
    const d = build();
    const dto = { deviceFingerprint: 'fp' };
    await d.controller.registerDevice('u1', dto, actor);
    expect(d.devicesService.register).toHaveBeenCalledWith('u1', dto, actor);
  });

  it('delegates lock (UC-01-07)', async () => {
    const d = build();
    await d.controller.lock('u1', { reason: 'x' }, actor);
    expect(d.usersService.lock).toHaveBeenCalledWith(
      'u1',
      { reason: 'x' },
      actor,
    );
  });

  it('delegates changeGlobalRole (UC-01-10)', async () => {
    const d = build();
    const dto = { role: 'USER', action: 'GRANT' };
    await d.controller.changeGlobalRole('u1', dto as any, actor);
    expect(d.usersService.changeGlobalRole).toHaveBeenCalledWith(
      'u1',
      dto,
      actor,
    );
  });

  it('delegates anonymize (UC-01-12)', async () => {
    const d = build();
    await d.controller.anonymize('u1', actor);
    expect(d.usersService.anonymize).toHaveBeenCalledWith('u1', actor);
  });
});

describe('IamUsersController — lecturas', () => {
  it('searchUsers aplica el tope por defecto cuando el cliente no pide uno', async () => {
    const d = build();
    d.usersReadService.searchUsers.mockResolvedValue({ items: [] });

    await d.controller.searchUsers();

    expect(d.usersReadService.searchUsers).toHaveBeenCalledWith({
      query: undefined,
      statusConceptId: undefined,
      cursor: undefined,
      limit: 50,
    });
  });

  it('searchUsers propaga texto, estado, cursor y tope tal como llegan', async () => {
    const d = build();
    d.usersReadService.searchUsers.mockResolvedValue({ items: [] });

    await d.controller.searchUsers('ana', 'status-1', 'cursor-opaco', 10);

    expect(d.usersReadService.searchUsers).toHaveBeenCalledWith({
      query: 'ana',
      statusConceptId: 'status-1',
      cursor: 'cursor-opaco',
      limit: 10,
    });
  });

  it.each([
    ['getUser', 'getUserById'],
    ['listCredentials', 'listCredentials'],
    ['listDevices', 'listDevices'],
    ['listMfaFactors', 'listMfaFactors'],
    ['listSessions', 'listSessions'],
    ['listGlobalRoles', 'listGlobalRoles'],
  ])('%s delega en el servicio de lectura', async (metodo, delegado) => {
    const d = build();
    (d.usersReadService as any)[delegado].mockResolvedValue({ items: [] });

    await (d.controller as any)[metodo]('u1');

    expect((d.usersReadService as any)[delegado]).toHaveBeenCalledWith('u1');
  });
});

/**
 * El listado de usuarios por cuerpo: `q` es un nombre o un correo y no puede
 * viajar en la URL, que registran los logs de acceso.
 */
describe('IamUsersController — búsqueda sin datos personales en la URL', () => {
  const proto = IamUsersController.prototype as unknown as Record<
    string,
    object
  >;

  it('correcto — POST search traduce el cuerpo a los filtros del GET', async () => {
    const d = build();
    d.usersReadService.searchUsers.mockResolvedValue({ items: [] });

    await d.controller.searchUsersByBody({
      q: 'ana@alovida.test',
      status: 'status-1',
      cursor: 'cursor-opaco',
      limit: 10,
    });

    expect(d.usersReadService.searchUsers).toHaveBeenCalledWith({
      query: 'ana@alovida.test',
      statusConceptId: 'status-1',
      cursor: 'cursor-opaco',
      limit: 10,
    });
  });

  it('límite — cuerpo vacío aplica el tope por defecto', async () => {
    const d = build();
    d.usersReadService.searchUsers.mockResolvedValue({ items: [] });

    await d.controller.searchUsersByBody({});

    expect(d.usersReadService.searchUsers).toHaveBeenCalledWith({
      query: undefined,
      statusConceptId: undefined,
      cursor: undefined,
      limit: 50,
    });
  });

  it('es POST search, responde 200 y exige SECURITY_ADMIN como el GET', () => {
    const porCuerpo = proto.searchUsersByBody;
    expect(Reflect.getMetadata(METHOD_METADATA, porCuerpo)).toBe(
      RequestMethod.POST,
    );
    expect(Reflect.getMetadata(PATH_METADATA, porCuerpo)).toBe('search');
    expect(Reflect.getMetadata(HTTP_CODE_METADATA, porCuerpo)).toBe(
      HttpStatus.OK,
    );
    expect(Reflect.getMetadata(ROLES_KEY, porCuerpo)).toEqual([
      'SECURITY_ADMIN',
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, proto.searchUsers)).toEqual([
      'SECURITY_ADMIN',
    ]);
  });

  it('el GET sigue vivo pero anuncia su reemplazo (Deprecation + Link)', () => {
    expect(Reflect.getMetadata(HEADERS_METADATA, proto.searchUsers)).toEqual(
      expect.arrayContaining([
        { name: 'Deprecation', value: 'true' },
        { name: 'Link', value: '</iam/users/search>; rel="successor-version"' },
      ]),
    );
  });

  describe('validación del cuerpo (mismo ValidationPipe que main.ts)', () => {
    const pipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    });
    const meta: ArgumentMetadata = {
      type: 'body',
      metatype: SearchUsersBodyDto,
    };

    it('correcto — texto, estado uuid, cursor y tope', async () => {
      await expect(
        pipe.transform(
          {
            q: 'ana',
            status: '6f1c1d1e-0000-4000-8000-000000000001',
            cursor: '25',
            limit: 25,
          },
          meta,
        ),
      ).resolves.toMatchObject({ q: 'ana', limit: 25 });
    });

    it('límite — el tope va de 1 a 500, como el ParseOptionalLimitPipe del GET', async () => {
      await expect(pipe.transform({ limit: 1 }, meta)).resolves.toMatchObject({
        limit: 1,
      });
      await expect(pipe.transform({ limit: 500 }, meta)).resolves.toMatchObject(
        { limit: 500 },
      );
      await expect(pipe.transform({ limit: 0 }, meta)).rejects.toThrow();
      await expect(pipe.transform({ limit: 501 }, meta)).rejects.toThrow();
    });

    it('inválido — estado que no es uuid o campo no declarado', async () => {
      await expect(
        pipe.transform({ status: 'ACTIVO' }, meta),
      ).rejects.toThrow();
      await expect(
        pipe.transform({ q: 'ana', role: 'SUPERADMIN' }, meta),
      ).rejects.toThrow();
    });
  });
});
