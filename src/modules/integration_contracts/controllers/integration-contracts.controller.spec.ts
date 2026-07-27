import { jest } from '@jest/globals';

// Loose-typed mock factory: mantiene el runtime 'jest' evitando los tipos estrictos.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { IntegrationContractsController } from './integration-contracts.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

function build() {
  const contractsService = {
    createContract: mockFn(),
    publishVersion: mockFn(),
    activateVersion: mockFn(),
    retireContract: mockFn(),
  };
  const authProfilesService = { configure: mockFn(), rotate: mockFn() };
  const webhooksService = { subscribe: mockFn() };
  const exchangesService = {
    executeExchange: mockFn(),
    recordAttempt: mockFn(),
    advanceCursor: mockFn(),
  };
  const controller = new IntegrationContractsController(
    contractsService as any,
    authProfilesService as any,
    webhooksService as any,
    exchangesService as any,
  );
  return {
    controller,
    contractsService,
    authProfilesService,
    webhooksService,
    exchangesService,
  };
}

describe('IntegrationContractsController', () => {
  it('delegates createContract (UC-31-01)', async () => {
    const d = build();
    const dto = { externalProviderId: 'p', contractCode: 'C1' };
    d.contractsService.createContract.mockResolvedValue({ id: 'c1' });
    await expect(
      d.controller.createContract(dto as any, actor),
    ).resolves.toEqual({ id: 'c1' });
    expect(d.contractsService.createContract).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates publishVersion (UC-31-02)', async () => {
    const d = build();
    const dto = { contractHash: 'h' };
    await d.controller.publishVersion('c1', dto, actor);
    expect(d.contractsService.publishVersion).toHaveBeenCalledWith(
      'c1',
      dto,
      actor,
    );
  });

  it('delegates activateVersion (UC-31-10)', async () => {
    const d = build();
    const dto = {};
    await d.controller.activateVersion('c1', 'v1', dto, actor);
    expect(d.contractsService.activateVersion).toHaveBeenCalledWith(
      'c1',
      'v1',
      dto,
      actor,
    );
  });

  it('delegates configureAuthProfile (UC-31-03)', async () => {
    const d = build();
    const dto = { clientIdentifier: 'client' };
    await d.controller.configureAuthProfile('c1', dto, actor);
    expect(d.authProfilesService.configure).toHaveBeenCalledWith(
      'c1',
      dto,
      actor,
    );
  });

  it('delegates rotateCredential (UC-31-11)', async () => {
    const d = build();
    const dto = { credentialSecretReference: 'ref' };
    await d.controller.rotateCredential('c1', 'ap1', dto, actor);
    expect(d.authProfilesService.rotate).toHaveBeenCalledWith(
      'c1',
      'ap1',
      dto,
      actor,
    );
  });

  it('delegates subscribeWebhook (UC-31-04)', async () => {
    const d = build();
    const dto = { callbackUri: 'https://x/cb' };
    await d.controller.subscribeWebhook('c1', dto, actor);
    expect(d.webhooksService.subscribe).toHaveBeenCalledWith('c1', dto, actor);
  });

  it('delegates executeExchange forwarding the idempotency-key header (UC-31-05)', async () => {
    const d = build();
    const dto = { requestHash: 'rh' };
    await d.controller.executeExchange('c1', 'idem-1', dto, actor);
    expect(d.exchangesService.executeExchange).toHaveBeenCalledWith(
      'c1',
      'idem-1',
      dto,
      actor,
    );
  });

  it('delegates recordAttempt (UC-31-06)', async () => {
    const d = build();
    const dto = { outcome: 'SUCCESS' };
    await d.controller.recordAttempt('c1', 'r1', dto as any, actor);
    expect(d.exchangesService.recordAttempt).toHaveBeenCalledWith(
      'c1',
      'r1',
      dto,
      actor,
    );
  });

  it('delegates advanceCursor (UC-31-08)', async () => {
    const d = build();
    const dto = { cursorValue: '100' };
    await d.controller.advanceCursor('c1', 'orders', dto, actor);
    expect(d.exchangesService.advanceCursor).toHaveBeenCalledWith(
      'c1',
      'orders',
      dto,
      actor,
    );
  });

  it('delegates retireContract (UC-31-11)', async () => {
    const d = build();
    const dto = { reason: 'eol' };
    await d.controller.retireContract('c1', dto, actor);
    expect(d.contractsService.retireContract).toHaveBeenCalledWith(
      'c1',
      dto,
      actor,
    );
  });
});
