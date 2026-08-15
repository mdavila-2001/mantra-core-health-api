import { jest } from '@jest/globals';

// Mock laxo: conserva el runtime de jest evitando el tipado estricto Mock<never>
// de @jest/globals bajo el tsconfig raíz.
const mockFn = (impl?: unknown): any => (jest.fn as any)(impl);

import { ClaimsController } from './claims.controller';
import { CoverageController } from './coverage.controller';
import { InsuranceBackboneController } from './insurance-backbone.controller';
import { PriorAuthController } from './prior-auth.controller';
import { ReconciliationController } from './reconciliation.controller';
import { AppealsController } from './appeals.controller';
import { BrokerCommissionController } from './broker-commission.controller';
import { InsuranceReadController } from './insurance-read.controller';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as never;
const dto = {} as never;
const ID = '00000000-0000-4000-8000-00000000abcd';

/**
 * Pruebas de delegación de los controladores de insurance: capa fina que sólo
 * traduce HTTP y delega en el servicio. Se verifica que cada endpoint invoque el
 * método correcto del servicio con los argumentos esperados y devuelva su valor,
 * con el servicio completamente mockeado.
 */
describe('Insurance controllers (delegación)', () => {
  it('ClaimsController delega en ClaimsService', async () => {
    const service = {
      submitClaim: mockFn().mockResolvedValue({ ok: true }),
      adjudicate: mockFn().mockResolvedValue({ id: ID }),
      publishEob: mockFn().mockResolvedValue({ id: ID }),
      reverse: mockFn().mockResolvedValue({ id: ID }),
      openDispute: mockFn().mockResolvedValue({ ok: true }),
    };
    const c = new ClaimsController(service as never);
    expect(await c.submit(dto, actor)).toEqual({ ok: true });
    expect(service.submitClaim).toHaveBeenCalledWith(dto, actor);
    await c.adjudicate(ID, dto, actor);
    expect(service.adjudicate).toHaveBeenCalledWith(ID, dto, actor);
    await c.publishEob(ID, dto, actor);
    await c.reverse(ID, dto, actor);
    await c.openDispute(ID, dto, actor);
    expect(service.openDispute).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('CoverageController delega en CoverageService', async () => {
    const service = {
      enrollCoverage: mockFn().mockResolvedValue({ id: ID }),
      requestEligibility: mockFn().mockResolvedValue({ id: ID }),
      determineCob: mockFn().mockResolvedValue({ id: ID }),
    };
    const c = new CoverageController(service as never);
    await c.enroll(dto, actor);
    await c.requestEligibility(dto, actor);
    await c.determineCob(dto, actor);
    expect(service.enrollCoverage).toHaveBeenCalledWith(dto, actor);
    expect(service.requestEligibility).toHaveBeenCalledWith(dto, actor);
    expect(service.determineCob).toHaveBeenCalledWith(dto, actor);
  });

  it('InsuranceBackboneController delega en su servicio', async () => {
    const service = {
      createCarrier: mockFn().mockResolvedValue({ id: ID }),
      createProduct: mockFn().mockResolvedValue({ id: ID }),
      createPlan: mockFn().mockResolvedValue({ id: ID }),
      createBenefit: mockFn().mockResolvedValue({ id: ID }),
      createProviderNetwork: mockFn().mockResolvedValue({ id: ID }),
      addMembership: mockFn().mockResolvedValue({ id: ID }),
      createBroker: mockFn().mockResolvedValue({ id: ID }),
      createAgreement: mockFn().mockResolvedValue({ id: ID }),
      createEmployerGroup: mockFn().mockResolvedValue({ id: ID }),
    };
    const c = new InsuranceBackboneController(service as never) as any;
    await c.createCarrier(dto, actor);
    expect(service.createCarrier).toHaveBeenCalledWith(dto, actor);
    await c.createProduct(ID, dto, actor);
    expect(service.createProduct).toHaveBeenCalledWith(ID, dto, actor);
    await c.createBroker(dto, actor);
    expect(service.createBroker).toHaveBeenCalledWith(dto, actor);
    await c.createEmployerGroup(dto, actor);
    expect(service.createEmployerGroup).toHaveBeenCalledWith(dto, actor);
  });

  it('PriorAuthController delega en PriorAuthService', async () => {
    const service = {
      submitRequest: mockFn().mockResolvedValue({ id: ID }),
      issueDetermination: mockFn().mockResolvedValue({ id: ID }),
    };
    const c = new PriorAuthController(service as never) as any;
    await c.submit(dto, actor);
    expect(service.submitRequest).toHaveBeenCalledWith(dto, actor);
    await c.determine(ID, dto, actor);
    expect(service.issueDetermination).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('ReconciliationController delega en ReconciliationService', async () => {
    const service = {
      createBatch: mockFn().mockResolvedValue({ id: ID }),
      addItem: mockFn().mockResolvedValue({ id: ID }),
    };
    const c = new ReconciliationController(service as never) as any;
    await c.createBatch(dto, actor);
    expect(service.createBatch).toHaveBeenCalledWith(dto, actor);
    await c.addItem(ID, dto, actor);
    expect(service.addItem).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('AppealsController delega en AppealsService', async () => {
    const service = { decide: mockFn().mockResolvedValue({ id: ID }) };
    const c = new AppealsController(service as never) as any;
    await c.decide(ID, dto, actor);
    expect(service.decide).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('BrokerCommissionController delega en BrokerCommissionService', async () => {
    const service = { generate: mockFn().mockResolvedValue({ id: ID }) };
    const c = new BrokerCommissionController(service as never) as any;
    await c.generate(dto, actor);
    expect(service.generate).toHaveBeenCalledWith(dto, actor);
  });

  it('InsuranceReadController delega en InsuranceReadService', async () => {
    const service = {
      listCarriers: mockFn().mockResolvedValue({ items: [], count: 0 }),
      getCarrier: mockFn().mockResolvedValue({ id: ID }),
      listBrokers: mockFn().mockResolvedValue({ items: [], count: 0 }),
      getBroker: mockFn().mockResolvedValue({ id: ID }),
      listBrokerClients: mockFn().mockResolvedValue({ items: [], count: 0 }),
    };
    const c = new InsuranceReadController(service as never) as any;

    expect(await c.listCarriers()).toEqual({ items: [], count: 0 });
    expect(service.listCarriers).toHaveBeenCalledWith();
    await c.getCarrier(ID);
    expect(service.getCarrier).toHaveBeenCalledWith(ID);
    await c.listBrokers();
    expect(service.listBrokers).toHaveBeenCalledWith();
    await c.getBroker(ID);
    expect(service.getBroker).toHaveBeenCalledWith(ID);
    await c.listBrokerClients(ID);
    expect(service.listBrokerClients).toHaveBeenCalledWith(ID);
  });

  /**
   * Las lecturas no llevan `@Roles`: el aislamiento lo da el tenant del
   * contexto, como en las rutas de organización de `directory`. Se comprueba
   * acá para que reintroducir un rol global sea una decisión y no un descuido.
   */
  it('las lecturas no exigen rol global', () => {
    const methods = [
      'listCarriers',
      'getCarrier',
      'listBrokers',
      'getBroker',
      'listBrokerClients',
    ];
    for (const method of methods) {
      const roles = Reflect.getMetadata(
        'requiredRoles',
        (InsuranceReadController.prototype as never as Record<string, object>)[
          method
        ],
      );
      expect(roles).toBeUndefined();
    }
  });
});
