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
import { ClaimsReadController } from './claims-read.controller';
import { InsuranceAnalyticsController } from './insurance-analytics.controller';

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

  it('ClaimsReadController delega en ClaimsReadService', async () => {
    const service = {
      listClaims: mockFn().mockResolvedValue({ items: [], nextCursor: null }),
      getClaim: mockFn().mockResolvedValue({ header: {} }),
    };
    const c = new ClaimsReadController(service as never);
    const query = {} as never;
    expect(await c.listClaims(query)).toEqual({ items: [], nextCursor: null });
    expect(service.listClaims).toHaveBeenCalledWith(query);
    await c.getClaim(ID);
    expect(service.getClaim).toHaveBeenCalledWith(ID);
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
      updateBenefit: mockFn().mockResolvedValue({ ok: true }),
      updateBenefitRules: mockFn().mockResolvedValue({ ok: true }),
      createProviderNetwork: mockFn().mockResolvedValue({ id: ID }),
      addMembership: mockFn().mockResolvedValue({ id: ID }),
      createBroker: mockFn().mockResolvedValue({ id: ID }),
      createAgreement: mockFn().mockResolvedValue({ id: ID }),
      createEmployerGroup: mockFn().mockResolvedValue({ id: ID }),
      updateContactChannels: mockFn().mockResolvedValue({
        id: ID,
        whatsappNumber: '+59171548278',
        callCenterPhone: '800-10-6060',
        supportEmail: null,
      }),
      updatePlanPremium: mockFn().mockResolvedValue({
        id: ID,
        monthlyPremiumAmount: '350.00',
      }),
    };
    const c = new InsuranceBackboneController(service as never) as any;
    await c.createCarrier(dto, actor);
    expect(service.createCarrier).toHaveBeenCalledWith(dto, actor);
    await c.createProduct(ID, dto, actor);
    expect(service.createProduct).toHaveBeenCalledWith(ID, dto, actor);
    await c.createPlan(ID, dto, actor);
    expect(service.createPlan).toHaveBeenCalledWith(ID, dto, actor);
    await c.createBenefit(ID, dto, actor);
    expect(service.createBenefit).toHaveBeenCalledWith(ID, dto, actor);
    await c.updateBenefit(ID, ID, dto, actor);
    expect(service.updateBenefit).toHaveBeenCalledWith(ID, ID, dto, actor);
    await c.updateBenefitRules(ID, ID, dto, actor);
    expect(service.updateBenefitRules).toHaveBeenCalledWith(ID, ID, dto, actor);
    await c.createBroker(dto, actor);
    expect(service.createBroker).toHaveBeenCalledWith(dto, actor);
    await c.createEmployerGroup(dto, actor);
    expect(service.createEmployerGroup).toHaveBeenCalledWith(dto, actor);
    await c.updateContactChannels(ID, dto, actor);
    expect(service.updateContactChannels).toHaveBeenCalledWith(ID, dto, actor);
    await c.updatePlanPremium(ID, dto, actor);
    expect(service.updatePlanPremium).toHaveBeenCalledWith(ID, dto, actor);
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

    expect(await c.listCarriers(actor)).toEqual({ items: [], count: 0 });
    expect(service.listCarriers).toHaveBeenCalledWith(actor);
    await c.getCarrier(ID, actor);
    expect(service.getCarrier).toHaveBeenCalledWith(ID, actor);
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

  it('plan y cobertura delegan autorización al tenant; soporte conserva rol global', () => {
    const roles = (method: string): string[] | undefined =>
      Reflect.getMetadata(
        'requiredRoles',
        (
          InsuranceBackboneController.prototype as never as Record<
            string,
            object
          >
        )[method],
      );

    for (const method of [
      'createPlan',
      'createBenefit',
      'updateBenefit',
      'updateBenefitRules',
      'updatePlanPremium',
    ]) {
      expect(roles(method)).toBeUndefined();
    }
    expect(roles('createProduct')).toEqual(['SECURITY_ADMIN']);
    expect(roles('createCarrier')).toEqual(['SECURITY_ADMIN']);
  });

  /**
   * TAREA-16 · D1.b (Justin, 2026-09-04): la lectura de solicitudes **sí**
   * exige rol, y es el del prestador que las envió.
   */
  it('la lectura de solicitudes exige BILLING_OPERATOR o SECURITY_ADMIN', () => {
    const roles = Reflect.getMetadata('requiredRoles', ClaimsReadController);
    expect(roles).toEqual(['BILLING_OPERATOR', 'SECURITY_ADMIN']);
  });

  /** Las membresías se resuelven por origen; las disputas conservan su política. */
  it('delega las seis escrituras en la autorización de servicio y conserva disputas', () => {
    const metodo = (nombre: string): string[] | undefined =>
      Reflect.getMetadata(
        'requiredRoles',
        (ClaimsController.prototype as never as Record<string, object>)[nombre],
      );

    expect(metodo('openDispute')).toEqual([
      'BILLING_OPERATOR',
      'SECURITY_ADMIN',
    ]);

    // Los servicios distinguen OWNER/ADMIN por tenant de los roles genéricos históricos.
    for (const escritura of ['submit', 'adjudicate', 'publishEob', 'reverse']) {
      expect(metodo(escritura)).toEqual([]);
    }
    for (const operation of ['submit', 'determine']) {
      expect(
        Reflect.getMetadata(
          'requiredRoles',
          (PriorAuthController.prototype as unknown as Record<string, object>)[
            operation
          ],
        ),
      ).toEqual([]);
    }
    expect(Reflect.getMetadata('requiredRoles', PriorAuthController)).toEqual([
      'BILLING',
      'FINANCE',
    ]);
    expect(Reflect.getMetadata('requiredRoles', ClaimsController)).toEqual([
      'BILLING',
      'FINANCE',
    ]);
  });

  /**
   * Subtarea 3.1 (v4.2.14): el tablero de siniestralidad de la aseguradora.
   * Sin `@Roles` — la barrera es membresía-o-rol, resuelta en el servicio
   * porque depende de a QUÉ aseguradora pertenece el actor.
   */
  it('InsuranceAnalyticsController delega en su servicio y no declara @Roles', async () => {
    const service = {
      getLossRatioAnalytics: mockFn().mockResolvedValue({ carrierId: ID }),
    };
    const c = new InsuranceAnalyticsController(service as never) as any;

    const query = {} as never;
    await c.getLossRatioAnalytics(query, actor);
    expect(service.getLossRatioAnalytics).toHaveBeenCalledWith(query, actor);

    expect(
      Reflect.getMetadata(
        'requiredRoles',
        (
          InsuranceAnalyticsController.prototype as never as Record<
            string,
            object
          >
        )['getLossRatioAnalytics'],
      ),
    ).toBeUndefined();
  });
});
