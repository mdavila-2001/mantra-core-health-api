import { PROF } from '../../profiles/profiles.concepts';
import { PRAC } from '../practice.concepts';
import { DEFAULT_INFRA_SETTINGS } from './ops-settings';
import {
  OpsStateService,
  computeOperationalState,
  isLifecycleActive,
} from './ops-state';
import { NOW, SITE, fn, makeRow } from './ops.testing';

describe('computeOperationalState', () => {
  const ver = (
    row = makeRow(),
    occ: any = 'OCC_FREE',
    order: string | null = null,
  ) => computeOperationalState(row, occ, order, DEFAULT_INFRA_SETTINGS, NOW);

  it('una cama activa, libre e inspeccionada es U y asignable', () => {
    expect(ver()).toMatchObject({
      v2Code: 'U',
      assignable: true,
      opsVersion: 3,
    });
  });

  it('un eje sin escribir vale su valor por omisión: limpia sin inspeccionar es H con la inspección obligatoria', () => {
    const s = ver(
      makeRow({
        hygieneStatusConceptId: null,
        operationalStatusConceptId: null,
        isolationConceptId: null,
      }),
    );
    expect(s).toMatchObject({
      availability: 'SPACE_OP_AVAILABLE',
      hygiene: 'HYG_CLEAN',
      isolation: 'ISO_NONE',
      v2Code: 'H',
      assignable: false,
    });
    const sinInspeccion = computeOperationalState(
      makeRow({ hygieneStatusConceptId: null }),
      'OCC_FREE',
      null,
      { ...DEFAULT_INFRA_SETTINGS, inspectionRequired: false },
      NOW,
    );
    expect(sinInspeccion).toMatchObject({ v2Code: 'U', assignable: true });
  });

  it('la ocupación gana a la higiene, el aislamiento a la ocupación y el bloqueo a todo', () => {
    expect(
      ver(makeRow({ hygieneStatusConceptId: PRAC.HYG_DIRTY }), 'OCC_OCCUPIED')
        .v2Code,
    ).toBe('O');
    expect(
      ver(makeRow({ isolationConceptId: PRAC.ISO_CONTACT }), 'OCC_OCCUPIED')
        .v2Code,
    ).toBe('I');
    expect(
      ver(
        makeRow({
          operationalStatusConceptId: PRAC.SPACE_OP_MAINTENANCE,
          isolationConceptId: PRAC.ISO_CONTACT,
        }),
      ).v2Code,
    ).toBe('C');
    expect(
      ver(makeRow({ hygieneStatusConceptId: PRAC.HYG_CONTAMINATED })).v2Code,
    ).toBe('K');
  });

  it('la bandera de limpieza terminal impide asignar aunque esté inspeccionada', () => {
    expect(ver(makeRow({ terminalCleaningRequired: true }))).toMatchObject({
      v2Code: 'H',
      assignable: false,
    });
  });

  it('el ciclo de vida y la vigencia deciden si el espacio está activo', () => {
    expect(isLifecycleActive(makeRow(), NOW)).toBe(true);
    expect(
      isLifecycleActive(
        makeRow({ statusConceptId: PRAC.SPACE_SUSPENDED }),
        NOW,
      ),
    ).toBe(false);
    expect(
      isLifecycleActive(
        makeRow({ validFrom: new Date(NOW.getTime() + 1000) }),
        NOW,
      ),
    ).toBe(false);
    expect(
      isLifecycleActive(
        makeRow({ validTo: new Date(NOW.getTime() - 1000) }),
        NOW,
      ),
    ).toBe(false);
    expect(ver(makeRow({ statusConceptId: PRAC.SPACE_SUSPENDED })).v2Code).toBe(
      'C',
    );
  });

  it('expone el motivo y la fecha estimada del bloqueo', () => {
    const until = new Date('2026-10-30T18:00:00Z');
    const s = ver(
      makeRow({
        operationalStatusConceptId: PRAC.SPACE_OP_MAINTENANCE,
        availabilityReasonConceptId: PRAC.BLOCK_RSN_PREVENTIVE_MAINTENANCE,
        availabilityExpectedUntil: until,
      }),
      'OCC_FREE',
      'order-9',
    );
    expect(s).toMatchObject({
      availabilityReasonCode: 'BLOCK_RSN_PREVENTIVE_MAINTENANCE',
      availabilityExpectedUntil: until,
      openCleaningOrderId: 'order-9',
    });
  });
});

describe('OpsStateService.cells · lo que viaja a cada rol', () => {
  const ENCOUNTER = 'enc-1';
  const aislada = makeRow({
    isolationConceptId: PRAC.ISO_AIRBORNE,
    isolationOrganismText: 'M. tuberculosis',
    isolationChangedAt: new Date('2026-10-29T09:00:00Z'),
    operationalStatusConceptId: PRAC.SPACE_OP_BLOCKED_CLINICAL,
    availabilityReasonConceptId: PRAC.BLOCK_RSN_PATIENT_CONDITION,
  });

  function build() {
    const tx = {
      execute: fn(async (sql: string) => {
        if (sql.includes('from clinical.encounter_locations'))
          return [
            {
              care_space_id: 'space-1',
              encounter_id: ENCOUNTER,
              location_status_concept_id:
                '809db700-0627-5fe3-8278-4f038f4475b3',
              period_start: new Date('2026-10-29T08:00:00Z'),
            },
          ];
        if (sql.includes('from clinical.encounters e'))
          return [
            {
              encounter_id: ENCOUNTER,
              name: 'Ana',
              last_name: 'Quispe',
              birth_date: '1986-10-29',
              administrative_gender_concept_id: PROF.GENDER_FEMALE,
            },
          ];
        if (sql.includes('from practice.care_space_blocks'))
          return [
            {
              care_space_id: 'space-1',
              reason_text: 'Insuficiencia respiratoria',
            },
          ];
        return [];
      }),
    };
    const settings = {
      forSite: fn().mockResolvedValue(DEFAULT_INFRA_SETTINGS),
    };
    return { tx, service: new OpsStateService(settings as any) };
  }

  const celda = async (visible: { patient: boolean; clinical: boolean }) => {
    const d = build();
    const [cell] = await d.service.cells(d.tx as any, SITE, [aislada], {
      now: NOW,
      patientVisible: () => visible.patient,
      clinicalVisible: () => visible.clinical,
    });
    return cell;
  };

  it('Enfermería de la unidad ve al paciente, el organismo y el texto clínico', async () => {
    const cell = await celda({ patient: true, clinical: true });
    expect(cell.occupancy).toMatchObject({
      code: 'OCC_OCCUPIED',
      encounterId: ENCOUNTER,
      patient: { initials: 'AQ', sexCode: 'F', ageYears: 40 },
    });
    expect(cell.isolation).toMatchObject({
      code: 'ISO_AIRBORNE',
      organism: 'M. tuberculosis',
    });
    expect(cell.availability.reasonText).toBe('Insuficiencia respiratoria');
  });

  it('Limpieza y Mantenimiento conservan el tipo y la fecha del aislamiento pero no el organismo, el texto clínico ni el paciente', async () => {
    const cell = await celda({ patient: false, clinical: false });
    expect(cell.isolation).toEqual({
      code: 'ISO_AIRBORNE',
      organism: null,
      since: '2026-10-29T09:00:00.000Z',
    });
    expect(cell.availability.reasonText).toBeNull();
    expect(cell.availability.reasonCode).toBe('BLOCK_RSN_PATIENT_CONDITION');
    expect(cell.occupancy.code).toBe('OCC_OCCUPIED');
    expect(cell.occupancy.patient).toBeUndefined();
    expect(cell.occupancy.encounterId).toBeUndefined();
    expect(JSON.stringify(cell)).not.toMatch(
      /tuberculosis|Quispe|respiratoria/,
    );
  });

  it('el paciente y el texto clínico se deciden por separado (Control de infecciones ve el organismo sin el paciente)', async () => {
    const cell = await celda({ patient: false, clinical: true });
    expect(cell.isolation.organism).toBe('M. tuberculosis');
    expect(cell.occupancy.patient).toBeUndefined();
  });
});
