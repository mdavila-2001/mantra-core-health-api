import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { AuthProvidersController } from './auth-providers.controller';

const actor = { id: 'user-1', roles: ['IDENTITY_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';
const CODE = 'acme-oidc';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const configService = {
    createProvider: mockFn(),
    configureProtocol: mockFn(),
    publishSigningKey: mockFn(),
    rotateSigningKey: mockFn(),
    setAttributeMappings: mockFn(),
    bindTenant: mockFn(),
    createProvisioningRule: mockFn(),
  };
  const loginService = {
    startLogin: mockFn(),
    processCallback: mockFn(),
    requestAccountLink: mockFn(),
    completeAccountLink: mockFn(),
    unlinkIdentity: mockFn(),
  };
  return {
    controller: new AuthProvidersController(
      configService as any,
      loginService as any,
    ),
    configService,
    loginService,
  };
}

describe('AuthProvidersController', () => {
  it('delegates registering the provider (UC-40-01)', async () => {
    const d = build();
    const dto = { code: CODE } as any;
    d.configService.createProvider.mockResolvedValue({ id: ID });

    await d.controller.createProvider(dto, actor);

    expect(d.configService.createProvider).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the protocol configuration with the route id (UC-40-02)', async () => {
    const d = build();
    const dto = { environment: 'PRODUCTION' } as any;
    d.configService.configureProtocol.mockResolvedValue({ id: ID });

    await d.controller.configureProtocol(ID, dto, actor);

    expect(d.configService.configureProtocol).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates publishing the signing key (UC-40-03)', async () => {
    const d = build();
    const dto = { keyId: 'kid-1' } as any;
    d.configService.publishSigningKey.mockResolvedValue({ id: ID });

    await d.controller.publishSigningKey(ID, dto, actor);

    expect(d.configService.publishSigningKey).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the key rotation (UC-40-11)', async () => {
    const d = build();
    const dto = { keyId: 'kid-2' } as any;
    d.configService.rotateSigningKey.mockResolvedValue({ newKeyId: ID });

    await d.controller.rotateSigningKey(ID, dto, actor);

    expect(d.configService.rotateSigningKey).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the attribute mappings (UC-40-04)', async () => {
    const d = build();
    const dto = { mappings: [] } as any;
    d.configService.setAttributeMappings.mockResolvedValue({ mappingIds: [] });

    await d.controller.setAttributeMappings(ID, dto, actor);

    expect(d.configService.setAttributeMappings).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the tenant binding (UC-40-05)', async () => {
    const d = build();
    const dto = { providerId: ID } as any;
    d.configService.bindTenant.mockResolvedValue({ id: ID });

    await d.controller.bindTenant(dto, actor);

    expect(d.configService.bindTenant).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the provisioning rule (UC-40-06)', async () => {
    const d = build();
    const dto = { priority: 1, effect: 'ALLOW' } as any;
    d.configService.createProvisioningRule.mockResolvedValue({ id: ID });

    await d.controller.createProvisioningRule(ID, dto, actor);

    expect(d.configService.createProvisioningRule).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the login start with the provider code (UC-40-07)', async () => {
    const d = build();
    const dto = {} as any;
    d.loginService.startLogin.mockResolvedValue({ attemptId: ID });

    await d.controller.startLogin(CODE, dto, actor);

    expect(d.loginService.startLogin).toHaveBeenCalledWith(CODE, dto, actor);
  });

  it('delegates the callback with the provider code (UC-40-08)', async () => {
    const d = build();
    const dto = { state: 'state-1' } as any;
    d.loginService.processCallback.mockResolvedValue({ attemptId: ID });

    await d.controller.processCallback(CODE, dto, actor);

    expect(d.loginService.processCallback).toHaveBeenCalledWith(
      CODE,
      dto,
      actor,
    );
  });

  it('delegates the account link request (UC-40-09)', async () => {
    const d = build();
    const dto = { providerId: ID } as any;
    d.loginService.requestAccountLink.mockResolvedValue({ id: ID });

    await d.controller.requestAccountLink(dto, actor);

    expect(d.loginService.requestAccountLink).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates completing the link (UC-40-10)', async () => {
    const d = build();
    const dto = { linkToken: 'token-1' } as any;
    d.loginService.completeAccountLink.mockResolvedValue({ requestId: ID });

    await d.controller.completeAccountLink(dto, actor);

    expect(d.loginService.completeAccountLink).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the unlink with the route id (UC-40-12)', async () => {
    const d = build();
    const dto = { reason: 'baja' } as any;
    d.loginService.unlinkIdentity.mockResolvedValue({ id: ID });

    await d.controller.unlinkIdentity(ID, dto, actor);

    expect(d.loginService.unlinkIdentity).toHaveBeenCalledWith(ID, dto, actor);
  });
});
