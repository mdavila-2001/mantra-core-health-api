import { CoverageRepository } from './coverage.repository';
import { INS } from '../insurance.concepts';
import {
  PatientCoverages,
  InsurancePlans,
  InsuranceProducts,
  InsuranceCarriers,
} from '../entities';

/**
 * `findActiveCarriersByPatients` — ALV-021.
 *
 * La agenda necesita decir «Particular» o el nombre de la aseguradora en cada
 * fila, y lo pide **en lote**: una lectura por tabla para toda la página, no
 * una por paciente. El encadenado es `patient_coverages → insurance_plans →
 * insurance_products → insurance_carriers`, cada salto resuelto en una sola
 * consulta con `$in`.
 */
describe('CoverageRepository.findActiveCarriersByPatients', () => {
  const COVERAGE = {
    id: 'cov-1',
    patientProfileId: 'paciente-1',
    insurancePlanId: 'plan-1',
    coverageOrder: 1,
    statusConceptId: INS.COVERAGE_ACTIVE,
  };
  const PLAN = { id: 'plan-1', insuranceProductId: 'prod-1' };
  const PRODUCT = { id: 'prod-1', insuranceCarrierId: 'carrier-1' };
  const INSURER = { id: 'carrier-1', legalName: 'Seguros Illimani' };

  /** Un `EntityManager` que responde por tipo de entidad, en el orden real. */
  function emWithTables(tablas: {
    coberturas?: readonly unknown[];
    planes?: readonly unknown[];
    productos?: readonly unknown[];
    aseguradoras?: readonly unknown[];
  }) {
    return {
      find: (entity: unknown) => {
        if (entity === PatientCoverages)
          return Promise.resolve(tablas.coberturas ?? []);
        if (entity === InsurancePlans)
          return Promise.resolve(tablas.planes ?? []);
        if (entity === InsuranceProducts)
          return Promise.resolve(tablas.productos ?? []);
        if (entity === InsuranceCarriers)
          return Promise.resolve(tablas.aseguradoras ?? []);
        throw new Error('Entidad inesperada en el spec');
      },
    } as never;
  }

  it('resuelve el nombre legal de la aseguradora siguiendo los tres saltos', async () => {
    const repo = new CoverageRepository();
    const em = emWithTables({
      coberturas: [COVERAGE],
      planes: [PLAN],
      productos: [PRODUCT],
      aseguradoras: [INSURER],
    });

    const result = await repo.findActiveCarriersByPatients(em, [
      'paciente-1',
    ]);

    expect(result.get('paciente-1')).toBe('Seguros Illimani');
  });

  it('un paciente sin fila en patient_coverages no entra en el mapa — es Particular', async () => {
    const repo = new CoverageRepository();
    const em = emWithTables({ coberturas: [] });

    const result = await repo.findActiveCarriersByPatients(em, [
      'paciente-sin-seguro',
    ]);

    expect(result.has('paciente-sin-seguro')).toBe(false);
    expect(result.size).toBe(0);
  });

  it('con la lista vacía, no hace ninguna consulta', async () => {
    const repo = new CoverageRepository();
    let calls = 0;
    const em = {
      find: () => {
        calls++;
        return Promise.resolve([]);
      },
    } as never;

    const result = await repo.findActiveCarriersByPatients(em, []);

    expect(result.size).toBe(0);
    expect(calls).toBe(0);
  });

  it('resuelve varios pacientes con UNA sola consulta por tabla', async () => {
    const repo = new CoverageRepository();
    let callsToPlans = 0;
    const base = emWithTables({
      coberturas: [
        COVERAGE,
        { ...COVERAGE, id: 'cov-2', patientProfileId: 'paciente-2' },
      ],
      planes: [PLAN],
      productos: [PRODUCT],
      aseguradoras: [INSURER],
    });
    const em = {
      find: (entity: unknown, ...rest: unknown[]) => {
        if (entity === InsurancePlans) callsToPlans++;
        return (base as { find: (...a: unknown[]) => Promise<unknown> }).find(
          entity,
          ...rest,
        );
      },
    } as never;

    const result = await repo.findActiveCarriersByPatients(em, [
      'paciente-1',
      'paciente-2',
    ]);

    expect(result.get('paciente-1')).toBe('Seguros Illimani');
    expect(result.get('paciente-2')).toBe('Seguros Illimani');
    // Dos pacientes con el MISMO plan: una sola consulta a `insurance_plans`,
    // no una por paciente.
    expect(callsToPlans).toBe(1);
  });
});
