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
  const COBERTURA = {
    id: 'cov-1',
    patientProfileId: 'paciente-1',
    insurancePlanId: 'plan-1',
    coverageOrder: 1,
    statusConceptId: INS.COVERAGE_ACTIVE,
  };
  const PLAN = { id: 'plan-1', insuranceProductId: 'prod-1' };
  const PRODUCTO = { id: 'prod-1', insuranceCarrierId: 'carrier-1' };
  const ASEGURADORA = { id: 'carrier-1', legalName: 'Seguros Illimani' };

  /** Un `EntityManager` que responde por tipo de entidad, en el orden real. */
  function emConTablas(tablas: {
    coberturas?: readonly unknown[];
    planes?: readonly unknown[];
    productos?: readonly unknown[];
    aseguradoras?: readonly unknown[];
  }) {
    return {
      find: (entidad: unknown) => {
        if (entidad === PatientCoverages)
          return Promise.resolve(tablas.coberturas ?? []);
        if (entidad === InsurancePlans)
          return Promise.resolve(tablas.planes ?? []);
        if (entidad === InsuranceProducts)
          return Promise.resolve(tablas.productos ?? []);
        if (entidad === InsuranceCarriers)
          return Promise.resolve(tablas.aseguradoras ?? []);
        throw new Error('Entidad inesperada en el spec');
      },
    } as never;
  }

  it('resuelve el nombre legal de la aseguradora siguiendo los tres saltos', async () => {
    const repo = new CoverageRepository();
    const em = emConTablas({
      coberturas: [COBERTURA],
      planes: [PLAN],
      productos: [PRODUCTO],
      aseguradoras: [ASEGURADORA],
    });

    const resultado = await repo.findActiveCarriersByPatients(em, [
      'paciente-1',
    ]);

    expect(resultado.get('paciente-1')).toBe('Seguros Illimani');
  });

  it('un paciente sin fila en patient_coverages no entra en el mapa — es Particular', async () => {
    const repo = new CoverageRepository();
    const em = emConTablas({ coberturas: [] });

    const resultado = await repo.findActiveCarriersByPatients(em, [
      'paciente-sin-seguro',
    ]);

    expect(resultado.has('paciente-sin-seguro')).toBe(false);
    expect(resultado.size).toBe(0);
  });

  it('con la lista vacía, no hace ninguna consulta', async () => {
    const repo = new CoverageRepository();
    let llamadas = 0;
    const em = {
      find: () => {
        llamadas++;
        return Promise.resolve([]);
      },
    } as never;

    const resultado = await repo.findActiveCarriersByPatients(em, []);

    expect(resultado.size).toBe(0);
    expect(llamadas).toBe(0);
  });

  it('resuelve varios pacientes con UNA sola consulta por tabla', async () => {
    const repo = new CoverageRepository();
    let llamadasAPlanes = 0;
    const base = emConTablas({
      coberturas: [
        COBERTURA,
        { ...COBERTURA, id: 'cov-2', patientProfileId: 'paciente-2' },
      ],
      planes: [PLAN],
      productos: [PRODUCTO],
      aseguradoras: [ASEGURADORA],
    });
    const em = {
      find: (entidad: unknown, ...resto: unknown[]) => {
        if (entidad === InsurancePlans) llamadasAPlanes++;
        return (base as { find: (...a: unknown[]) => Promise<unknown> }).find(
          entidad,
          ...resto,
        );
      },
    } as never;

    const resultado = await repo.findActiveCarriersByPatients(em, [
      'paciente-1',
      'paciente-2',
    ]);

    expect(resultado.get('paciente-1')).toBe('Seguros Illimani');
    expect(resultado.get('paciente-2')).toBe('Seguros Illimani');
    // Dos pacientes con el MISMO plan: una sola consulta a `insurance_plans`,
    // no una por paciente.
    expect(llamadasAPlanes).toBe(1);
  });
});
