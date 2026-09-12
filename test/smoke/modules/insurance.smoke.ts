import type { SmokeCase } from '../smoke-kit';
import { UUID_ABSENT } from '../smoke-kit';
import { INS } from '../../../src/modules/insurance/insurance.concepts';

/**
 * Smoke del módulo insurance (26). Cubre la espina dorsal autocontenida
 * (aseguradora → producto → plan → beneficio; red → afiliación; broker → acuerdo;
 * grupo empleador) encadenada con `ctx.vars`, más casos límite 401/404. Los flujos
 * de claims/adjudicación/EOB requieren un paciente + cobertura reales; se cubren
 * con su caso de autenticación y se documentan como dependientes de esos parents.
 */
export const INSURANCE_SMOKE: SmokeCase[] = [
  // UC-26 carrier
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-carriers',
    name: 'happy: aseguradora',
    method: 'post',
    path: () => '/insurance-carriers',
    body: (c) => ({
      tenantId: c.tenantId,
      carrierCode: `CAR-${c.u}`,
      legalName: 'Aseguradora Alovida',
      regulatorIdentifier: `REG-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.insCarrierId = String(b.id);
    },
  },
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-carriers',
    name: 'límite: sin auth',
    method: 'post',
    path: () => '/insurance-carriers',
    auth: false,
    body: (c) => ({ tenantId: c.tenantId, carrierCode: 'x', legalName: 'x' }),
    expectedStatus: 401,
  },
  // producto
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-carriers/:id/products',
    name: 'happy: producto',
    method: 'post',
    path: (c) => `/insurance-carriers/${c.vars.insCarrierId}/products`,
    body: (c) => ({ productCode: `PRD-${c.u}`, name: 'Plan Salud Total' }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.insProductId = String(b.id);
    },
  },
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-carriers/:id/products',
    name: 'límite: aseguradora inexistente',
    method: 'post',
    path: () => `/insurance-carriers/${UUID_ABSENT}/products`,
    body: (c) => ({ productCode: `x-${c.u}`, name: 'x' }),
    expectedStatus: 404,
  },
  // plan
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-products/:productId/plans',
    name: 'happy: plan',
    method: 'post',
    path: (c) => `/insurance-products/${c.vars.insProductId}/plans`,
    body: (c) => ({
      planCode: `PLN-${c.u}`,
      name: 'Plan Oro',
      effectiveFrom: '2024-01-01',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.insPlanId = String(b.id);
    },
  },
  // beneficio
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-plans/:planId/benefits',
    name: 'happy: beneficio',
    method: 'post',
    path: (c) => `/insurance-plans/${c.vars.insPlanId}/benefits`,
    body: () => ({
      benefitCategoryConceptId: INS.BENEFIT_CATEGORY_OUTPATIENT,
      effectiveFrom: '2024-01-01',
      requiresPriorAuthorization: false,
      coveragePercent: '80',
    }),
    expectedStatus: 201,
  },
  // red de proveedores
  {
    module: 'Insurance',
    endpoint: 'POST /provider-networks',
    name: 'happy: red',
    method: 'post',
    path: () => '/provider-networks',
    body: (c) => ({
      tenantId: c.tenantId,
      insuranceCarrierId: c.vars.insCarrierId,
      networkCode: `NET-${c.u}`,
      name: 'Red Nacional',
      effectiveFrom: '2024-01-01',
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.insNetworkId = String(b.id);
    },
  },
  {
    module: 'Insurance',
    endpoint: 'POST /provider-networks/:id/memberships',
    name: 'happy: afiliación de red',
    method: 'post',
    path: (c) => `/provider-networks/${c.vars.insNetworkId}/memberships`,
    body: (c) => ({
      providerEntityId: c.adminUserId,
      practiceId: c.vars.pracPracticeId,
      contractReference: `CTR-${c.u}`,
    }),
    expectedStatus: 201,
  },
  // broker + acuerdo
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-brokers',
    name: 'happy: broker',
    method: 'post',
    path: () => '/insurance-brokers',
    body: (c) => ({
      tenantId: c.tenantId,
      brokerCode: `BRK-${c.u}`,
      legalName: 'Corredora Alovida',
      licenseNumber: `LIC-${c.u}`,
    }),
    expectedStatus: 201,
    capture: (b, c) => {
      c.vars.insBrokerId = String(b.id);
    },
  },
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-brokers/:id/agreements',
    name: 'happy: acuerdo broker',
    method: 'post',
    path: (c) => `/insurance-brokers/${c.vars.insBrokerId}/agreements`,
    body: (c) => ({
      insuranceCarrierId: c.vars.insCarrierId,
      agreementCode: `AGR-${c.u}`,
      effectiveFrom: '2024-01-01',
    }),
    expectedStatus: 201,
  },
  // grupo empleador
  {
    module: 'Insurance',
    endpoint: 'POST /employer-groups',
    name: 'happy: grupo empleador',
    method: 'post',
    path: () => '/employer-groups',
    body: (c) => ({
      tenantId: c.tenantId,
      groupCode: `EMP-${c.u}`,
      legalName: 'Empresa Alovida SAC',
    }),
    expectedStatus: 201,
  },
  // claims: dependen de paciente + cobertura reales → se cubre el 401
  {
    module: 'Insurance',
    endpoint: 'POST /insurance-claims',
    name: 'límite: sin auth (claims requieren cobertura)',
    method: 'post',
    path: () => '/insurance-claims',
    auth: false,
    body: () => ({}),
    expectedStatus: 401,
  },
];
