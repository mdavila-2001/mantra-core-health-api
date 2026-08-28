import { jest } from '@jest/globals';

import {
  BOLIVIA_CARRIERS,
  BOLIVIA_HEALTH_PLANS,
  BOLIVIA_PUBLIC_INSURERS,
  carrierId,
  carrierPlanId,
  carrierProductId,
  declaredPlanSector,
} from '../../../common/seed/bolivia-insurance.catalog';
import { INS } from '../insurance.concepts';
import { InsuranceCatalogService } from './insurance-catalog.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const BISA = 'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A';
const CNS = 'BO_PUB_CNS';

/**
 * Arma el servicio con un `EntityManager` que responde por tipo de entidad.
 *
 * @param filas - Aseguradoras, productos y planes que la base «tiene».
 * @returns El servicio y el espía del `find`.
 */
function build(filas: {
  carriers: unknown[];
  products: unknown[];
  plans: unknown[];
}) {
  const find = mockFn((entidad: { name: string }) => {
    if (entidad.name === 'InsuranceCarriers')
      return Promise.resolve(filas.carriers);
    if (entidad.name === 'InsuranceProducts')
      return Promise.resolve(filas.products);
    return Promise.resolve(filas.plans);
  });
  const service = new InsuranceCatalogService({ find } as never);
  return { service, find };
}

/** Una aseguradora tal como la devuelve la base. */
const carrierRow = (code: string, sigla: string) => ({
  id: carrierId(code),
  carrierCode: code,
  legalName: `${sigla} S.A.`,
  sigla,
  statusConceptId: INS.CARRIER_ACTIVE,
});

describe('InsuranceCatalogService', () => {
  it('devuelve las aseguradoras con sus planes anidados', async () => {
    const d = build({
      carriers: [carrierRow(BISA, 'BISA')],
      products: [
        { id: carrierProductId(BISA), insuranceCarrierId: carrierId(BISA) },
      ],
      plans: [
        {
          id: carrierPlanId(BISA, 'RED_MAX'),
          insuranceProductId: carrierProductId(BISA),
          planCode: `${BISA}_RED_MAX`,
          name: 'Red Max',
          statusConceptId: INS.PLAN_ACTIVE,
        },
      ],
    });

    const { carriers } = await d.service.listHealthCatalog();

    expect(carriers).toHaveLength(1);
    expect(carriers[0].name).toBe('BISA');
    expect(carriers[0].isPublic).toBe(false);
    // El código del plan se sirve sin el prefijo de su aseguradora: es lo que
    // distingue un plan de otro dentro de la misma compañía.
    expect(carriers[0].plans).toEqual([
      { id: carrierPlanId(BISA, 'RED_MAX'), code: 'RED_MAX', name: 'Red Max' },
    ]);
  });

  it('marca como público un seguro de la seguridad social', async () => {
    const d = build({
      carriers: [carrierRow(CNS, 'CNS')],
      products: [
        { id: carrierProductId(CNS), insuranceCarrierId: carrierId(CNS) },
      ],
      plans: [],
    });

    const { carriers } = await d.service.listHealthCatalog();

    expect(carriers[0].isPublic).toBe(true);
  });

  it('pide sólo los identificadores del catálogo curado, no todas las aseguradoras', async () => {
    const d = build({ carriers: [], products: [], plans: [] });

    await d.service.listHealthCatalog();

    const filtro = d.find.mock.calls[0][1] as {
      id: { $in: string[] };
      statusConceptId: string;
    };
    expect(filtro.id.$in).toHaveLength(
      BOLIVIA_CARRIERS.length + BOLIVIA_PUBLIC_INSURERS.length,
    );
    expect(filtro.statusConceptId).toBe(INS.CARRIER_ACTIVE);
  });

  it('no consulta productos ni planes si no hay aseguradoras', async () => {
    const d = build({ carriers: [], products: [], plans: [] });

    const { carriers } = await d.service.listHealthCatalog();

    expect(carriers).toEqual([]);
    expect(d.find).toHaveBeenCalledTimes(1);
  });
});

describe('catálogo de planes sembrado', () => {
  it('le da plan BASE a todas las aseguradoras, también a las que tienen planes con nombre', () => {
    // BISA publica cinco planes con nombre y aun así tiene su comodín: quien no
    // recuerda cuál tiene igual puede declarar su cobertura.
    expect(declaredPlanSector(carrierPlanId(BISA, 'BASE'))).toBe('private');
    expect(declaredPlanSector(carrierPlanId(CNS, 'BASE'))).toBe('public');
  });

  it('clasifica cada plan con nombre en el sector de su aseguradora', () => {
    for (const plan of BOLIVIA_HEALTH_PLANS) {
      const esperado = BOLIVIA_PUBLIC_INSURERS.some(
        (i) => i.code === plan.carrierCode,
      )
        ? 'public'
        : 'private';
      expect(
        declaredPlanSector(carrierPlanId(plan.carrierCode, plan.code)),
      ).toBe(esperado);
    }
  });

  it('no reconoce un plan que no es del catálogo', () => {
    expect(declaredPlanSector('00000000-0000-0000-0000-000000000000')).toBe(
      undefined,
    );
  });

  it('sólo siembra productos con componente de salud', () => {
    const codigos = BOLIVIA_HEALTH_PLANS.map((p) => p.code);
    // Vida pura, desgravamen, sepelio, SOAT y rentas vitalicias quedan fuera:
    // acá se le pregunta al paciente por su cobertura médica.
    for (const prohibido of [
      'SOAT',
      'DESGRAVAMEN',
      'SEPELIO',
      'RENTA_VITALICIA',
    ]) {
      expect(codigos).not.toContain(prohibido);
    }
  });

  it('nombra los cinco planes de salud de BISA', () => {
    const deBisa = BOLIVIA_HEALTH_PLANS.filter(
      (p) => p.carrierCode === BISA,
    ).map((p) => p.code);
    expect(deBisa).toEqual([
      'ADVANCE',
      'RED_MAX',
      'INFINITY_GREEN',
      'MUNDIAL_BLUE',
      'NARANJA_PLUS',
    ]);
  });
});
