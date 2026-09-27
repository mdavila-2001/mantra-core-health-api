import { jest } from '@jest/globals';
import { RequestMethod } from '@nestjs/common';
import { METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants';

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
import { PractitionerSettlementBatchesController } from './practitioner-settlement-batches.controller';
import { InsuranceCampaignsController } from './insurance-campaigns.controller';
import {
  PractitionerSettlementBatchDto,
  PractitionerSettlementBatchTotalsDto,
  PractitionerSettlementBatchClaimDto,
  PractitionerSettlementBatchExcludedClaimDto,
  PractitionerSettlementBatchReversalAdjustmentDto,
  PatientCampaignDto,
  PatientCampaignPartnerDto,
} from '../dto';

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
    const reader = {
      listInbox: mockFn().mockResolvedValue({ items: [] }),
      getForInsurer: mockFn().mockResolvedValue({ id: ID }),
    };
    const c = new PriorAuthController(service as never, reader as never) as any;
    await c.submit(dto, actor);
    expect(service.submitRequest).toHaveBeenCalledWith(dto, actor);
    await c.determine(ID, dto, actor);
    expect(service.issueDetermination).toHaveBeenCalledWith(ID, dto, actor);
    await c.inbox({ status: 'PENDING' }, actor);
    expect(reader.listInbox).toHaveBeenCalledWith({ status: 'PENDING' }, actor);
    await c.getById(ID, actor);
    expect(reader.getForInsurer).toHaveBeenCalledWith(ID, actor);
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
    for (const operation of ['submit', 'determine', 'inbox', 'getById']) {
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
   * CA-3.4: ninguna ruta del ciclo del reclamo permite editar o borrar una
   * adjudicación o una EOB ya publicadas. `ClaimsController` sólo declara
   * `POST` en sus cinco métodos (`submit`, `adjudicate`, `publishEob`,
   * `reverse`, `openDispute`); una corrección se hace con una versión nueva,
   * nunca con una mutación in situ.
   */
  it('ClaimsController sólo expone POST: ninguna ruta muta una adjudicación existente', () => {
    const metodosHttp = Object.getOwnPropertyNames(
      ClaimsController.prototype,
    ).filter(
      (nombre) =>
        nombre !== 'constructor' &&
        Reflect.hasMetadata(
          PATH_METADATA,
          (ClaimsController.prototype as unknown as Record<string, object>)[
            nombre
          ],
        ),
    );
    expect(metodosHttp.length).toBeGreaterThan(0);
    for (const nombre of metodosHttp) {
      const metodo = Reflect.getMetadata(
        METHOD_METADATA,
        (ClaimsController.prototype as unknown as Record<string, object>)[
          nombre
        ],
      );
      expect(metodo).toBe(RequestMethod.POST);
    }
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

  /**
   * Tarea 3 · H8 (MED-E13..E16) — lotes periódicos de liquidación al
   * profesional. Sin `@Roles`: la autorización la resuelve el servicio por
   * pertenencia, igual que las escrituras vinculadas de `ClaimsController`.
   */
  it('PractitionerSettlementBatchesController delega en su servicio', async () => {
    const res = { status: mockFn() };
    const service = {
      generate: mockFn().mockResolvedValue({ dto: { id: ID }, created: true }),
      getById: mockFn().mockResolvedValue({ id: ID }),
      list: mockFn().mockResolvedValue({ items: [] }),
    };
    const c = new PractitionerSettlementBatchesController(service as never);

    const generated = await c.generate(dto, actor, res as never);
    expect(generated).toEqual({ id: ID });
    expect(service.generate).toHaveBeenCalledWith(dto, actor);
    expect(res.status).toHaveBeenCalledWith(201);

    await c.getById(ID, actor);
    expect(service.getById).toHaveBeenCalledWith(ID, actor);

    const query = {} as never;
    await c.list(query, actor);
    expect(service.list).toHaveBeenCalledWith(query, actor);

    for (const metodo of ['generate', 'getById', 'list']) {
      expect(
        Reflect.getMetadata(
          'requiredRoles',
          (
            PractitionerSettlementBatchesController.prototype as never as Record<
              string,
              object
            >
          )[metodo],
        ),
      ).toEqual([]);
    }
  });

  /**
   * Tarea 4 · M-06 — campañas preventivas. Sin `@Roles`: la aseguradora se
   * autoriza por membresía y el afiliado por titularidad, ambas en el servicio.
   */
  it('InsuranceCampaignsController delega en su servicio y no fija @Roles', async () => {
    const service = {
      create: mockFn().mockResolvedValue({ id: ID }),
      list: mockFn().mockResolvedValue({ items: [], nextCursor: null }),
      listActiveForPatient: mockFn().mockResolvedValue([]),
      getById: mockFn().mockResolvedValue({ id: ID }),
      changeStatus: mockFn().mockResolvedValue({ id: ID }),
    };
    const c = new InsuranceCampaignsController(service as never);

    await c.create(dto, actor);
    expect(service.create).toHaveBeenCalledWith(dto, actor);

    const query = {} as never;
    await c.list(query, actor);
    expect(service.list).toHaveBeenCalledWith(query, actor);

    await c.listForPatient(ID, actor);
    expect(service.listActiveForPatient).toHaveBeenCalledWith(ID, actor);

    await c.getById(ID, actor);
    expect(service.getById).toHaveBeenCalledWith(ID, actor);

    const status = { status: 'PAUSED' } as never;
    await c.changeStatus(ID, status, actor);
    expect(service.changeStatus).toHaveBeenCalledWith(ID, status, actor);

    const proto = InsuranceCampaignsController.prototype as never as Record<
      string,
      object
    >;
    for (const metodo of [
      'create',
      'list',
      'listForPatient',
      'getById',
      'changeStatus',
    ]) {
      expect(Reflect.getMetadata('requiredRoles', proto[metodo])).toEqual([]);
    }
  });

  it('InsuranceCampaignsController: las rutas fijas van antes que `:id` y los verbos son los del contrato', () => {
    const proto = InsuranceCampaignsController.prototype as never as Record<
      string,
      object
    >;
    const ruta = (metodo: string) => ({
      path: Reflect.getMetadata(PATH_METADATA, proto[metodo]),
      method: Reflect.getMetadata(METHOD_METADATA, proto[metodo]),
    });

    expect(ruta('create')).toEqual({ path: '/', method: RequestMethod.POST });
    expect(ruta('list')).toEqual({ path: '/', method: RequestMethod.GET });
    expect(ruta('listForPatient')).toEqual({
      path: 'patient/:patientProfileId',
      method: RequestMethod.GET,
    });
    expect(ruta('getById')).toEqual({ path: ':id', method: RequestMethod.GET });
    expect(ruta('changeStatus')).toEqual({
      path: ':id/status',
      method: RequestMethod.PATCH,
    });

    // Nest registra las rutas en el orden en que se declaran los métodos: si
    // `:id` fuera primero, `patient` se leería como un identificador.
    const orden = Object.getOwnPropertyNames(
      InsuranceCampaignsController.prototype,
    );
    expect(orden.indexOf('listForPatient')).toBeLessThan(
      orden.indexOf('getById'),
    );
  });

  it('el DTO de la campaña del afiliado no expone ningún identificador interno', () => {
    const permitidas = (dto: { prototype: object }): string[] =>
      (
        Reflect.getMetadata('swagger/apiModelPropertiesArray', dto.prototype) ??
        []
      ).map((clave: string) => clave.replace(/^:/, ''));

    expect(permitidas(PatientCampaignDto).sort()).toEqual(
      [
        'campaignType',
        'carrierName',
        'code',
        'copayBonusPercentage',
        'description',
        'id',
        'partners',
        'targetCondition',
        'title',
        'validFrom',
        'validTo',
      ].sort(),
    );
    expect(permitidas(PatientCampaignPartnerDto).sort()).toEqual([
      'name',
      'role',
      'type',
    ]);
  });

  it('el DTO del lote de liquidación no expone ninguna propiedad de pago (contrato §11)', () => {
    const dtos = [
      PractitionerSettlementBatchDto,
      PractitionerSettlementBatchTotalsDto,
      PractitionerSettlementBatchClaimDto,
      PractitionerSettlementBatchExcludedClaimDto,
      PractitionerSettlementBatchReversalAdjustmentDto,
    ];
    const prohibido = /paid|payment|receipt|voucher|qr/i;
    for (const dto of dtos) {
      const propiedades: string[] =
        Reflect.getMetadata('swagger/apiModelPropertiesArray', dto.prototype) ??
        [];
      expect(propiedades.length).toBeGreaterThan(0);
      for (const propiedad of propiedades) {
        expect(propiedad.replace(/^:/, '')).not.toMatch(prohibido);
      }
    }
  });
});
