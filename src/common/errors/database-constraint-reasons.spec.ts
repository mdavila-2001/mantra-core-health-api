import { HttpStatus } from '@nestjs/common';
import {
  CONSTRAINT_RULES,
  CROSS_TENANT_REASON,
  resolveDatabaseViolation,
} from './database-constraint-reasons';

describe('resolveDatabaseViolation', () => {
  it('23P01: cada EXCLUDE del modelo responde 409 con su propio reason, no el de la cita', () => {
    const exclusions: Array<[string, string]> = [
      ['ex_encounter_locations_bed_occupancy', 'BED_DOUBLE_OCCUPANCY'],
      [
        'ex_encounter_locations_encounter_single_bed',
        'ENCOUNTER_ALREADY_HAS_BED',
      ],
      [
        'ex_encounter_locations_encounter_one_active_bed',
        'ENCOUNTER_ALREADY_HAS_BED',
      ],
      [
        'ex_procedure_cases_operating_room_reserved_time',
        'OPERATING_ROOM_SLOT_CONFLICT',
      ],
      ['ex_operating_room_blocks_time', 'OR_BLOCK_OVERLAP'],
      ['ex_appointments_care_space_time', 'CARE_SPACE_DOUBLE_BOOKED'],
      ['ex_care_space_blocks_time', 'BLOCK_OVERLAP'],
      ['ex_space_tariffs_validity', 'TARIFF_OVERLAP'],
      [
        'ex_care_space_category_periods_validity',
        'BED_CATEGORY_PERIOD_OVERLAP',
      ],
      ['ex_space_placements_no_overlap', 'SPACE_PLACEMENT_OVERLAP'],
    ];
    for (const [constraint, reason] of exclusions) {
      expect(
        resolveDatabaseViolation({ sqlstate: '23P01', constraint }),
      ).toMatchObject({
        status: HttpStatus.CONFLICT,
        reason,
      });
    }
  });

  it('23505: los únicos parciales del modelo tienen reason propio', () => {
    expect(
      resolveDatabaseViolation({
        sqlstate: '23505',
        constraint: 'ux_cleaning_orders_one_open_per_space',
      }),
    ).toMatchObject({ status: 409, reason: 'CLEANING_ORDER_ALREADY_OPEN' });
    expect(
      resolveDatabaseViolation({
        sqlstate: '23505',
        constraint: 'ux_charge_captures_bed_night',
      }),
    ).toMatchObject({ status: 409, reason: 'CHARGE_ALREADY_CAPTURED' });
  });

  it('23001 sin marca conocida es 409 genérico, nunca undefined (antes era 500)', () => {
    expect(
      resolveDatabaseViolation({ sqlstate: '23001', message: 'algo raro' }),
    ).toMatchObject({
      status: 409,
      reason: 'OPERATION_RESTRICTED',
    });
  });

  it('23001: se elige el reason por la marca del trigger', () => {
    const cases: Array<[string, string]> = [
      [
        'inpatient_census_days: el censo del 2026-10-29 (unidad x) está cerrado y es inmutable',
        'CENSUS_ALREADY_CLOSED',
      ],
      [
        'inpatient_census_entries: el censo x está cerrado y es inmutable',
        'CENSUS_ALREADY_CLOSED',
      ],
      [
        'billing.charge_captures: un cargo emitido no se edita; se anula con motivo',
        'CHARGE_ALREADY_INVOICED',
      ],
      [
        'billing.charge_captures: un cargo anulado no se modifica',
        'CHARGE_STATE_LOCKED',
      ],
      [
        'billing.space_tariffs: la tarifa ya tiene cargos devengados',
        'TARIFF_IN_USE',
      ],
      ['append-only: DELETE no permitido en audit.x', 'APPEND_ONLY'],
      ['append-only/immutable: UPDATE no permitido en audit.y', 'APPEND_ONLY'],
      [
        'practice.care_spaces: el espacio tiene activos contables ubicados en él y no puede pasar a una sede de otra práctica',
        'HAS_DEPENDENTS',
      ],
      [
        'PLAN_HAS_PLACED_CHILDREN: el espacio x tiene hijos',
        'PLAN_HAS_PLACED_CHILDREN',
      ],
      [
        'practice.care_space_category_periods: el período ya está cerrado',
        'CATEGORY_PERIOD_IMMUTABLE',
      ],
    ];
    for (const [message, reason] of cases) {
      expect(
        resolveDatabaseViolation({ sqlstate: '23001', message }),
      ).toMatchObject({
        status: 409,
        reason,
      });
    }
  });

  it('23514: ajuste sobre día abierto y precio ≠ tarifa son 422; un CHECK sin regla queda al filtro (undefined)', () => {
    expect(
      resolveDatabaseViolation({
        sqlstate: '23514',
        message:
          'inpatient_census_adjustments: el censo x no está cerrado (CENSUS_NOT_CLOSED); un día abierto no se ajusta',
      }),
    ).toMatchObject({ status: 422, reason: 'CENSUS_NOT_CLOSED' });
    expect(
      resolveDatabaseViolation({
        sqlstate: '23514',
        message:
          'charge_captures: servicio, precio y moneda del cargo tienen que ser la foto exacta de su tarifa',
      }),
    ).toMatchObject({ status: 422, reason: 'CHARGE_PRICE_MISMATCH' });
    expect(
      resolveDatabaseViolation({
        sqlstate: '23514',
        constraint: 'ck_cualquiera',
      }),
    ).toBeUndefined();
    expect(
      resolveDatabaseViolation({
        sqlstate: '23514',
        constraint: 'ck_placement_incidents_justification_length',
      }),
    ).toMatchObject({
      status: 422,
      reason: 'OVERRIDE_JUSTIFICATION_TOO_SHORT',
    });
  });

  it('23503: el cruce de tenant es 404 y no revela nada; una FK simple sigue siendo 422 genérico (undefined)', () => {
    for (const constraint of [
      'fk_practice_sites_history_tenant_source',
      'fk_appointments_tenant_care_space',
      'fk_space_placements_tenant_plan',
    ]) {
      const rule = resolveDatabaseViolation({ sqlstate: '23503', constraint });
      expect(rule).toMatchObject({ status: 404, reason: CROSS_TENANT_REASON });
      expect(rule!.message).toBe('Recurso no encontrado');
    }
    expect(
      resolveDatabaseViolation({
        sqlstate: '23503',
        message:
          'facility_licenses.healthcare_service_id: el servicio no existe en el tenant de la habilitación',
      }),
    ).toMatchObject({ status: 404 });
    expect(
      resolveDatabaseViolation({ sqlstate: '23503', constraint: 'fk_patient' }),
    ).toBeUndefined();
    expect(
      resolveDatabaseViolation({
        sqlstate: '23503',
        constraint: 'fk_branches_tenant_id',
      }),
    ).toBeUndefined();
  });

  it('23503 del servicio fuera de la práctica es 422 con reason propio (no es cruce de tenant)', () => {
    expect(
      resolveDatabaseViolation({
        sqlstate: '23503',
        constraint: 'fk_space_tariffs_service_catalog_id',
      }),
    ).toMatchObject({ status: 422, reason: 'TARIFF_SERVICE_NOT_IN_PRACTICE' });
  });

  it('ningún mensaje de respuesta lleva ids, tablas ni texto del servidor', () => {
    for (const rule of Object.values(CONSTRAINT_RULES)) {
      expect(rule.message).not.toMatch(
        /[0-9a-f]{8}-[0-9a-f]{4}|practice\.|billing\.|clinical\./,
      );
    }
  });

  it('un SQLSTATE sin regla devuelve undefined', () => {
    expect(
      resolveDatabaseViolation({
        sqlstate: '23P01',
        constraint: 'ex_desconocida',
      }),
    ).toBeUndefined();
    expect(resolveDatabaseViolation({ sqlstate: '40001' })).toBeUndefined();
  });
});
