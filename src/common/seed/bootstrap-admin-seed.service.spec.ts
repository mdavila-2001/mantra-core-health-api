import { describe, it, expect, jest } from '@jest/globals';
import {
  BootstrapAdminSeedService,
  loadBootstrapAdminEnv,
} from './bootstrap-admin-seed.service';
import { CONCEPTS, SEED } from '../constants/concepts';

/** Configuración válida mínima para que el seed llegue a escribir. */
const configured = {
  email: 'admin@redesa.test',
  password: 'S3cret-passw0rd',
  allowProduction: false,
  nodeEnv: 'development',
};

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Servicio y dobles observables.
 */
function build() {
  const em = {
    findOne: jest.fn(() => Promise.resolve(null)),
    create: jest.fn(),
    flush: jest.fn(() => Promise.resolve()),
  } as any;
  const orm = { em: { fork: () => em } } as any;
  const users = {
    createUser: jest.fn(() => Promise.resolve({ id: 'admin-1' })),
  } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new BootstrapAdminSeedService(orm, users, logger);
  return { service, em, users, logger };
}

describe('loadBootstrapAdminEnv', () => {
  it('trata la variable vacía como ausente', () => {
    const env = loadBootstrapAdminEnv({
      BOOTSTRAP_ADMIN_EMAIL: '',
      BOOTSTRAP_ADMIN_PASSWORD: '',
    } as NodeJS.ProcessEnv);

    expect(env.email).toBeUndefined();
    expect(env.password).toBeUndefined();
  });

  it('sólo el literal "true" autoriza producción', () => {
    const yes = loadBootstrapAdminEnv({
      BOOTSTRAP_ADMIN_ALLOW_PRODUCTION: 'true',
    } as NodeJS.ProcessEnv);
    const no = loadBootstrapAdminEnv({
      BOOTSTRAP_ADMIN_ALLOW_PRODUCTION: '1',
    } as NodeJS.ProcessEnv);

    expect(yes.allowProduction).toBe(true);
    expect(no.allowProduction).toBe(false);
  });
});

describe('BootstrapAdminSeedService', () => {
  it('sin configurar no crea absolutamente nada', async () => {
    const { service, users, em } = build();

    const result = await service.run({
      allowProduction: false,
      nodeEnv: 'development',
    });

    expect(result).toEqual({ provisioned: false, skipped: 'not-configured' });
    expect(users.createUser).not.toHaveBeenCalled();
    expect(em.create).not.toHaveBeenCalled();
  });

  it('con media configuración avisa en vez de callarse', async () => {
    const { service, users, logger } = build();

    const result = await service.run({
      email: 'admin@redesa.test',
      allowProduction: false,
      nodeEnv: 'development',
    });

    expect(result.skipped).toBe('incomplete-config');
    expect(logger.warn).toHaveBeenCalled();
    expect(users.createUser).not.toHaveBeenCalled();
  });

  it('se niega en producción sin autorización explícita', async () => {
    const { service, users, logger } = build();

    const result = await service.run({ ...configured, nodeEnv: 'production' });

    expect(result.skipped).toBe('production-not-allowed');
    expect(users.createUser).not.toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('en producción con autorización explícita sí siembra', async () => {
    const { service, users } = build();

    const result = await service.run({
      ...configured,
      nodeEnv: 'production',
      allowProduction: true,
    });

    expect(result.provisioned).toBe(true);
    expect(users.createUser).toHaveBeenCalled();
  });

  it('crea el administrador con rol SECURITY_ADMIN y credencial hasheada por IAM', async () => {
    const { service, users } = build();

    const result = await service.run(configured);

    expect(result).toEqual({ provisioned: true, userId: 'admin-1' });
    expect(users.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: configured.email,
        password: configured.password,
        initialRole: 'SECURITY_ADMIN',
      }),
      expect.objectContaining({ roles: ['SECURITY_ADMIN'] }),
    );
  });

  it('concede el rol global SUPERADMIN y la membresía en el tenant sembrado', async () => {
    const { service, em } = build();

    await service.run(configured);

    const created = em.create.mock.calls.map((call: unknown[]) => call[1]);
    expect(created).toContainEqual(
      expect.objectContaining({ roleConceptId: CONCEPTS.ROLE_SUPERADMIN }),
    );
    expect(created).toContainEqual(
      expect.objectContaining({ tenantId: SEED.tenantId }),
    );
  });

  it('reejecutado sobre una base completa no duplica nada', async () => {
    const { service, em, users } = build();
    // Todo ya existe: actor, rol global y membresía.
    em.findOne.mockResolvedValue({ id: 'ya-existe', userId: 'admin-1' });
    users.createUser.mockRejectedValue(
      Object.assign(new Error('dup'), {
        status: 409,
      }),
    );

    const result = await service.run(configured);

    expect(result).toEqual({ provisioned: true, userId: 'admin-1' });
    expect(em.create).not.toHaveBeenCalled();
  });

  it('un 409 de email duplicado reutiliza la cuenta y completa lo que falte', async () => {
    const { service, em, users } = build();
    users.createUser.mockRejectedValue(
      Object.assign(new Error('dup'), {
        status: 409,
      }),
    );
    // Sólo existe la credencial: el rol global y la membresía siguen faltando.
    em.findOne.mockImplementation((entity: { name?: string }) =>
      Promise.resolve(
        entity?.name === 'AuthenticationCredentials'
          ? { userId: 'admin-1' }
          : null,
      ),
    );

    const result = await service.run(configured);

    expect(result.userId).toBe('admin-1');
    const created = em.create.mock.calls.map((call: unknown[]) => call[1]);
    expect(created).toContainEqual(
      expect.objectContaining({ roleConceptId: CONCEPTS.ROLE_SUPERADMIN }),
    );
  });

  it('propaga un fallo que no sea el 409 de duplicado', async () => {
    const { service, users } = build();
    users.createUser.mockRejectedValue(
      Object.assign(new Error('boom'), {
        status: 500,
      }),
    );

    await expect(service.run(configured)).rejects.toThrow('boom');
  });
});
