import { jest } from '@jest/globals';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { INS } from '../insurance.concepts';
import { InsuranceReadService } from './insurance-read.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = 'tenant-a';
const ACTOR = { id: 'user-a', roles: ['USER'] } as never;

const CARRIER_ACTIVE = {
  id: INS.CARRIER_ACTIVE,
  code: 'CARRIER_ACTIVE',
  display: 'Aseguradora activa',
};
const VERIFIED = {
  id: INS.VERIFY_VERIFIED,
  code: 'VERIFICATION_VERIFIED',
  display: 'Verificado',
};
const AGREEMENT_ACTIVE = {
  id: INS.AGREEMENT_ACTIVE,
  code: 'AGREEMENT_ACTIVE',
  display: 'Acuerdo activo',
};
const BROKER_ACTIVE = {
  id: INS.BROKER_ACTIVE,
  code: 'BROKER_ACTIVE',
  display: 'Broker activo',
};
const CLIENT_TYPE = {
  id: INS.CLIENT_TYPE_INDIVIDUAL,
  code: 'CLIENT_TYPE_INDIVIDUAL',
  display: 'Cliente individual',
};

function carrier(id: string, tenantId = TENANT) {
  return {
    id,
    tenantId,
    carrierCode: `ASEG-${id}`,
    legalName: `Aseguradora ${id}`,
    regulatorIdentifier: 'REG-1',
    statusConceptId: INS.CARRIER_ACTIVE,
    verificationStatusConceptId: INS.VERIFY_VERIFIED,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  } as any;
}

function broker(id: string, tenantId = TENANT) {
  return {
    id,
    tenantId,
    brokerCode: `BRK-${id}`,
    legalName: `Broker ${id}`,
    licenseNumber: 'MAT-9',
    statusConceptId: INS.BROKER_ACTIVE,
    verificationStatusConceptId: INS.VERIFY_VERIFIED,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
  } as any;
}

/**
 * Un acuerdo. `effectiveTo` en el pasado es el caso que importa: sigue activo
 * por estado pero ya no habilita a representar a la aseguradora.
 */
function agreement(
  id: string,
  brokerId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    id,
    insuranceBrokerId: brokerId,
    insuranceCarrierId: 'carrier-1',
    agreementCode: `AC-${id}`,
    statusConceptId: INS.AGREEMENT_ACTIVE,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as any;
}

function build() {
  const fork = {};
  const em = { fork: mockFn(() => fork) };
  const repo = {
    findCarriersByTenant: mockFn().mockResolvedValue([]),
    findCarrierByTenant: mockFn().mockResolvedValue(null),
    findActiveProducts: mockFn().mockResolvedValue([]),
    findActivePlans: mockFn().mockResolvedValue([]),
    findActiveBenefits: mockFn().mockResolvedValue([]),
    findActiveNetworks: mockFn().mockResolvedValue([]),
    findActiveMemberships: mockFn().mockResolvedValue([]),
    findBrokersByTenant: mockFn().mockResolvedValue([]),
    findBrokerByTenant: mockFn().mockResolvedValue(null),
    findAgreements: mockFn().mockResolvedValue([]),
    findCarriersByIds: mockFn().mockResolvedValue([]),
    findBrokerClients: mockFn().mockResolvedValue([]),
    findConcepts: mockFn().mockResolvedValue([
      CARRIER_ACTIVE,
      VERIFIED,
      AGREEMENT_ACTIVE,
      BROKER_ACTIVE,
      CLIENT_TYPE,
    ]),
  };
  const tenantAdministration = {
    canAdminister: mockFn().mockResolvedValue(true),
  };
  const service = new InsuranceReadService(
    em as any,
    repo as any,
    tenantAdministration as any,
  );
  return { service, repo, tenantAdministration };
}

describe('InsuranceReadService', () => {
  it('exige el tenant del contexto en vez de aceptar uno del cliente', async () => {
    const d = build();
    await expect(d.service.listCarriers(ACTOR)).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    await expect(d.service.listBrokers()).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
  });

  it('acota el listado de aseguradoras al tenant activo', async () => {
    const d = build();
    d.repo.findCarriersByTenant.mockResolvedValue([carrier('c1')]);

    const result = await runWithTenant(TENANT, () =>
      d.service.listCarriers(ACTOR),
    );

    expect(d.repo.findCarriersByTenant).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
    );
    expect(result.count).toBe(1);
    expect(result.items[0]?.legalName).toBe('Aseguradora c1');
    expect(result.items[0]?.canAdminister).toBe(true);
    expect(d.tenantAdministration.canAdminister).toHaveBeenCalledWith(
      expect.anything(),
      TENANT,
      ACTOR,
    );
  });

  it('cuenta planes por aseguradora atravesando el producto', async () => {
    const d = build();
    d.repo.findCarriersByTenant.mockResolvedValue([carrier('c1')]);
    d.repo.findActiveProducts.mockResolvedValue([
      { id: 'p1', insuranceCarrierId: 'c1' },
      { id: 'p2', insuranceCarrierId: 'c1' },
    ]);
    d.repo.findActivePlans.mockResolvedValue([
      { id: 'pl1', insuranceProductId: 'p1' },
      { id: 'pl2', insuranceProductId: 'p2' },
      { id: 'pl3', insuranceProductId: 'p2' },
    ]);
    d.repo.findActiveNetworks.mockResolvedValue([
      { id: 'n1', insuranceCarrierId: 'c1' },
    ]);

    const result = await runWithTenant(TENANT, () =>
      d.service.listCarriers(ACTOR),
    );

    expect(result.items[0]?.productCount).toBe(2);
    expect(result.items[0]?.planCount).toBe(3);
    expect(result.items[0]?.networkCount).toBe(1);
  });

  it('devuelve 404 —no 403— para una aseguradora de otra organización', async () => {
    const d = build();
    d.repo.findCarrierByTenant.mockResolvedValue(null);

    await expect(
      runWithTenant(TENANT, () => d.service.getCarrier('otra', ACTOR)),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
  });

  it('arma el catálogo producto → plan → beneficio', async () => {
    const d = build();
    d.repo.findCarrierByTenant.mockResolvedValue(carrier('c1'));
    d.repo.findActiveProducts.mockResolvedValue([
      {
        id: 'p1',
        insuranceCarrierId: 'c1',
        productCode: 'PROD-1',
        name: 'Salud Integral',
        productTypeConceptId: INS.PRODUCT_TYPE_HEALTH,
        statusConceptId: INS.PRODUCT_ACTIVE,
      },
    ]);
    d.repo.findActivePlans.mockResolvedValue([
      {
        id: 'pl1',
        insuranceProductId: 'p1',
        planCode: 'PLAN-1',
        name: 'Plan Oro',
        statusConceptId: INS.PLAN_ACTIVE,
      },
    ]);
    d.repo.findActiveBenefits.mockResolvedValue([
      {
        id: 'b1',
        insurancePlanId: 'pl1',
        benefitCategoryConceptId: INS.BENEFIT_CATEGORY_GENERAL,
        coveragePercent: '80.00',
        requiresPriorAuthorization: true,
        eligibilityRuleJson: {
          requiredDocuments: [
            'FIRMA_MEDICO',
            'FIRMA_MEDICO',
            'DOCUMENTO_DESCONOCIDO',
          ],
          exclusionNotes: 'No cubre tratamientos experimentales.',
          internalKey: true,
        },
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
      },
    ]);

    const result = await runWithTenant(TENANT, () =>
      d.service.getCarrier('c1', ACTOR),
    );

    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.plans[0]?.name).toBe('Plan Oro');
    expect(result.products[0]?.plans[0]?.benefits[0]?.coveragePercent).toBe(
      '80.00',
    );
    expect(result.products[0]?.plans[0]?.benefits[0]?.effectiveFrom).toBe(
      '2026-01-01',
    );
    expect(result.products[0]?.plans[0]?.benefits[0]?.approvalRules).toEqual({
      requiredDocuments: ['FIRMA_MEDICO'],
      exclusionNotes: 'No cubre tratamientos experimentales.',
    });
    expect(
      result.products[0]?.plans[0]?.benefits[0] as unknown as Record<
        string,
        unknown
      >,
    ).not.toHaveProperty('eligibilityRuleJson');
  });

  it('normaliza reglas ausentes o malformadas a valores vacíos', async () => {
    const d = build();
    d.repo.findCarrierByTenant.mockResolvedValue(carrier('c1'));
    d.repo.findActiveProducts.mockResolvedValue([
      {
        id: 'p1',
        insuranceCarrierId: 'c1',
        productCode: 'P1',
        name: 'Producto',
        productTypeConceptId: INS.PRODUCT_TYPE_HEALTH,
        statusConceptId: INS.PRODUCT_ACTIVE,
      },
    ]);
    d.repo.findActivePlans.mockResolvedValue([
      {
        id: 'pl1',
        insuranceProductId: 'p1',
        planCode: 'PL1',
        name: 'Plan',
        statusConceptId: INS.PLAN_ACTIVE,
      },
    ]);
    d.repo.findActiveBenefits.mockResolvedValue([
      {
        id: 'b1',
        insurancePlanId: 'pl1',
        benefitCategoryConceptId: INS.BENEFIT_CATEGORY_GENERAL,
        effectiveFrom: new Date('2026-01-01'),
        eligibilityRuleJson: ['malformado'],
      },
    ]);

    const result = await runWithTenant(TENANT, () =>
      d.service.getCarrier('c1', ACTOR),
    );

    expect(result.products[0]?.plans[0]?.benefits[0]?.approvalRules).toEqual({
      requiredDocuments: [],
      exclusionNotes: null,
    });
  });

  it('cuenta los prestadores de cada red', async () => {
    const d = build();
    d.repo.findCarrierByTenant.mockResolvedValue(carrier('c1'));
    d.repo.findActiveNetworks.mockResolvedValue([
      {
        id: 'n1',
        insuranceCarrierId: 'c1',
        networkCode: 'RED-1',
        name: 'Red preferente',
        statusConceptId: INS.NETWORK_ACTIVE,
      },
    ]);
    d.repo.findActiveMemberships.mockResolvedValue([
      { id: 'm1', providerNetworkId: 'n1' },
      { id: 'm2', providerNetworkId: 'n1' },
    ]);

    const result = await runWithTenant(TENANT, () =>
      d.service.getCarrier('c1', ACTOR),
    );

    expect(result.networks[0]?.memberCount).toBe(2);
  });

  it('marca independiente al broker sin ninguna vinculación vigente', async () => {
    const d = build();
    d.repo.findBrokersByTenant.mockResolvedValue([broker('b1')]);
    d.repo.findAgreements.mockResolvedValue([]);

    const result = await runWithTenant(TENANT, () => d.service.listBrokers());

    expect(result.items[0]?.independent).toBe(true);
    expect(result.items[0]?.currentCarrierCount).toBe(0);
  });

  it('no cuenta como vigente un acuerdo activo cuya vigencia ya venció', async () => {
    const d = build();
    d.repo.findBrokersByTenant.mockResolvedValue([broker('b1')]);
    d.repo.findAgreements.mockResolvedValue([
      agreement('a1', 'b1', {
        effectiveFrom: new Date('2020-01-01T00:00:00.000Z'),
        effectiveTo: new Date('2021-01-01T00:00:00.000Z'),
      }),
    ]);

    const result = await runWithTenant(TENANT, () => d.service.listBrokers());

    expect(result.items[0]?.independent).toBe(true);
    expect(result.items[0]?.currentCarrierCount).toBe(0);
  });

  it('tampoco cuenta como vigente un acuerdo que todavía no empezó', async () => {
    const d = build();
    d.repo.findBrokersByTenant.mockResolvedValue([broker('b1')]);
    d.repo.findAgreements.mockResolvedValue([
      agreement('a1', 'b1', {
        effectiveFrom: new Date('2999-01-01T00:00:00.000Z'),
      }),
    ]);

    const result = await runWithTenant(TENANT, () => d.service.listBrokers());

    expect(result.items[0]?.independent).toBe(true);
  });

  it('cuenta como vigente el acuerdo activo y sin fecha de fin', async () => {
    const d = build();
    d.repo.findBrokersByTenant.mockResolvedValue([broker('b1')]);
    d.repo.findAgreements.mockResolvedValue([agreement('a1', 'b1')]);

    const result = await runWithTenant(TENANT, () => d.service.listBrokers());

    expect(result.items[0]?.independent).toBe(false);
    expect(result.items[0]?.currentCarrierCount).toBe(1);
  });

  it('conserva el histórico de vinculaciones y marca cuál sigue vigente', async () => {
    const d = build();
    d.repo.findBrokerByTenant.mockResolvedValue(broker('b1'));
    d.repo.findAgreements.mockResolvedValue([
      agreement('a1', 'b1'),
      agreement('a2', 'b1', {
        insuranceCarrierId: 'carrier-2',
        effectiveTo: new Date('2021-01-01T00:00:00.000Z'),
      }),
    ]);
    d.repo.findCarriersByIds.mockResolvedValue([
      { id: 'carrier-1', legalName: 'Aseguradora Uno' },
      { id: 'carrier-2', legalName: 'Aseguradora Dos' },
    ]);

    const result = await runWithTenant(TENANT, () => d.service.getBroker('b1'));

    expect(result.agreements).toHaveLength(2);
    expect(result.agreements[0]?.current).toBe(true);
    expect(result.agreements[0]?.carrierLegalName).toBe('Aseguradora Uno');
    expect(result.agreements[1]?.current).toBe(false);
    expect(result.currentCarrierCount).toBe(1);
  });

  it('rechaza la cartera de un broker de otra organización', async () => {
    const d = build();
    d.repo.findBrokerByTenant.mockResolvedValue(null);

    await expect(
      runWithTenant(TENANT, () => d.service.listBrokerClients('otro')),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.repo.findBrokerClients).not.toHaveBeenCalled();
  });

  it('sirve la cartera sin un solo campo clínico', async () => {
    const d = build();
    d.repo.findBrokerByTenant.mockResolvedValue(broker('b1'));
    d.repo.findBrokerClients.mockResolvedValue([
      {
        id: 'bc1',
        insuranceBrokerId: 'b1',
        patientProfileId: 'patient-1',
        clientTypeConceptId: INS.CLIENT_TYPE_INDIVIDUAL,
        statusConceptId: INS.COVERAGE_ACTIVE,
      },
    ]);

    const result = await runWithTenant(TENANT, () =>
      d.service.listBrokerClients('b1'),
    );

    expect(result.count).toBe(1);
    // La referencia al perfil viaja; nada de lo que cuelga de ella, sí.
    expect(result.items[0]?.patientProfileId).toBe('patient-1');
    expect(Object.keys(result.items[0] ?? {})).toEqual([
      'id',
      'patientProfileId',
      'employerGroupId',
      'clientType',
      'assignedBrokerUserId',
      'effectiveFrom',
      'effectiveTo',
      'status',
    ]);
  });

  it('dice «sin registrar» en vez de omitir un concepto que no está en el catálogo', async () => {
    const d = build();
    d.repo.findCarriersByTenant.mockResolvedValue([carrier('c1')]);
    d.repo.findConcepts.mockResolvedValue([]);

    const result = await runWithTenant(TENANT, () =>
      d.service.listCarriers(ACTOR),
    );

    expect(result.items[0]?.status).toEqual({
      code: 'UNKNOWN',
      display: 'Sin registrar',
    });
  });
});
