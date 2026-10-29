import { HttpStatus } from '@nestjs/common';

/**
 * Traducción de lo que la base rechaza (restricciones y triggers del modelo) a un
 * `reason` estable y un estado HTTP.
 *
 * POR QUÉ EXISTE. El modelo de infraestructura hospitalaria (F1–F5) defendió sus
 * invariantes **en la base**: EXCLUDE de camas, quirófanos y consultorios, únicos
 * parciales, FK compuestas por tenant y triggers que lanzan `restrict_violation`
 * (`23001`). Sin esta tabla el filtro global respondía a todo `23P01` con el
 * mensaje de «dos citas del mismo profesional se pisan» y a todo `23001` con un
 * 500.
 *
 * REGLAS (REPORTE de integración del modelo, §4):
 *
 * - `23P01`/`23505`/`23514` se resuelven por el **nombre de la restricción**.
 * - `23001` y los `23514`/`23503` que lanzan triggers no llevan nombre de
 *   restricción: se reconocen por una marca del texto que el propio modelo
 *   escribe (`inpatient_census_days: …`, `charge_captures: …`). El texto se usa
 *   **sólo para elegir el `reason`**; jamás se reenvía al cliente (puede traer
 *   ids, y describe el esquema).
 * - `23503` por cruce de tenant es **404**: nunca se revela que el recurso existe
 *   en otra organización. La excepción es `fk_space_tariffs_service_catalog_id`
 *   (el servicio es de la misma organización, sólo que de otra práctica): 422.
 *
 * Lo que no esté aquí conserva el comportamiento genérico del filtro.
 */

/** Cómo se responde a una violación reconocida. */
export interface DatabaseViolationRule {
  /** Estado HTTP. */
  readonly status: HttpStatus;
  /** `reason` estable del contrato. */
  readonly reason: string;
  /** Mensaje para personas. Sin ids ni nombres de tabla. */
  readonly message: string;
}

/** Lo que el filtro sabe de un error de PostgreSQL. */
export interface DatabaseViolation {
  /** SQLSTATE de cinco caracteres. */
  readonly sqlstate: string;
  /** Nombre de la restricción, si el driver lo trae. */
  readonly constraint?: string;
  /** Texto del servidor: sólo para elegir el `reason`, nunca sale. */
  readonly message?: string;
}

const conflict = (reason: string, message: string): DatabaseViolationRule => ({
  status: HttpStatus.CONFLICT,
  reason,
  message,
});
const unprocessable = (
  reason: string,
  message: string,
): DatabaseViolationRule => ({
  status: HttpStatus.UNPROCESSABLE_ENTITY,
  reason,
  message,
});

/** Mensaje único del 404 por cruce de tenant: el mismo que el de un id inexistente. */
export const CROSS_TENANT_NOT_FOUND_MESSAGE = 'Recurso no encontrado';

/** `reason` del 404 por cruce de tenant. */
export const CROSS_TENANT_REASON = 'RESOURCE_NOT_FOUND';

/** Restricción → respuesta (EXCLUDE, únicos, CHECK y FK con nombre propio). */
export const CONSTRAINT_RULES: Readonly<Record<string, DatabaseViolationRule>> =
  {
    // --- EXCLUDE (23P01) ---------------------------------------------------
    ex_care_space_blocks_time: conflict(
      'BLOCK_OVERLAP',
      'El espacio ya tiene un bloqueo en ese período',
    ),
    ex_encounter_locations_bed_occupancy: conflict(
      'BED_DOUBLE_OCCUPANCY',
      'La cama ya está ocupada o reservada en ese período',
    ),
    ex_encounter_locations_encounter_single_bed: conflict(
      'ENCOUNTER_ALREADY_HAS_BED',
      'El encuentro ya tiene una cama en ese período',
    ),
    ex_encounter_locations_encounter_one_active_bed: conflict(
      'ENCOUNTER_ALREADY_HAS_BED',
      'El encuentro ya tiene una cama activa',
    ),
    ex_procedure_cases_operating_room_reserved_time: conflict(
      'OPERATING_ROOM_SLOT_CONFLICT',
      'El quirófano ya está reservado en esa ventana (incluye preparación y limpieza)',
    ),
    ex_operating_room_blocks_time: conflict(
      'OR_BLOCK_OVERLAP',
      'El quirófano ya tiene un bloque en ese período',
    ),
    ex_appointments_care_space_time: conflict(
      'CARE_SPACE_DOUBLE_BOOKED',
      'El consultorio ya tiene una cita en ese horario',
    ),
    ex_space_tariffs_validity: conflict(
      'TARIFF_OVERLAP',
      'Ya existe una tarifa vigente para esa clase en ese período',
    ),
    ex_care_space_category_periods_validity: conflict(
      'BED_CATEGORY_PERIOD_OVERLAP',
      'La cama ya tiene una categoría vigente en ese período',
    ),
    ex_space_placements_no_overlap: conflict(
      'SPACE_PLACEMENT_OVERLAP',
      'El espacio se superpone con otro en el lienzo',
    ),
    ex_org_user_assignments_unit_head: conflict(
      'UNIT_HEAD_OVERLAP',
      'La unidad ya tiene un responsable en ese período',
    ),
    ex_pharmacy_on_call_shifts_site_overlap: conflict(
      'ON_CALL_SHIFT_OVERLAP',
      'La sucursal ya tiene un turno en ese período',
    ),
    // --- únicos parciales (23505) -----------------------------------------
    ux_cleaning_orders_one_open_per_space: conflict(
      'CLEANING_ORDER_ALREADY_OPEN',
      'El espacio ya tiene una orden de limpieza abierta',
    ),
    ux_schedulable_resources_care_space_active: conflict(
      'RESOURCE_ALREADY_EXISTS_FOR_SPACE',
      'El espacio ya tiene un recurso agendable activo',
    ),
    ux_inpatient_census_days_site_unit_date: conflict(
      'CENSUS_ALREADY_EXISTS',
      'Ya existe el censo de esa unidad para ese día',
    ),
    ux_surgical_safety_checklists_case_type: conflict(
      'CHECKLIST_ALREADY_EXISTS',
      'El caso ya tiene un check-list de ese tipo',
    ),
    ux_charge_captures_bed_night: conflict(
      'CHARGE_ALREADY_CAPTURED',
      'Ese cargo ya fue devengado',
    ),
    ux_charge_captures_encounter_bed_day: conflict(
      'CHARGE_ALREADY_CAPTURED',
      'Ese cargo ya fue devengado',
    ),
    ux_charge_captures_or_case: conflict(
      'CHARGE_ALREADY_CAPTURED',
      'Ese cargo ya fue devengado',
    ),
    ux_charge_captures_idempotency_key: conflict(
      'CHARGE_ALREADY_CAPTURED',
      'Ese cargo ya fue devengado',
    ),
    ux_cost_centers_unit_active: conflict(
      'UNIT_ALREADY_HAS_COST_CENTER',
      'La unidad ya tiene un centro de costo activo',
    ),
    ux_inventory_locations_ward_stock_unit: conflict(
      'UNIT_ALREADY_HAS_WARD_STOCK',
      'La unidad ya tiene un botiquín',
    ),
    // --- CHECK (23514) -----------------------------------------------------
    ck_placement_incidents_justification_length: unprocessable(
      'OVERRIDE_JUSTIFICATION_TOO_SHORT',
      'La justificación es demasiado corta',
    ),
    ck_encounter_locations_bed_period: unprocessable(
      'INVALID_BED_PERIOD',
      'El período de la cama no es válido',
    ),
    ck_encounter_locations_bed_period_order: unprocessable(
      'INVALID_BED_PERIOD',
      'El período de la cama no es válido',
    ),
    // --- FK que NO es de tenant (23503) ------------------------------------
    fk_space_tariffs_service_catalog_id: unprocessable(
      'TARIFF_SERVICE_NOT_IN_PRACTICE',
      'El servicio no pertenece a la práctica de la tarifa',
    ),
  };

/**
 * Violaciones de triggers, reconocidas por la marca de texto del modelo. El
 * orden importa: gana la primera que coincide.
 */
interface TriggerRule {
  readonly sqlstate: '23001' | '23514';
  /** Fragmentos que TODOS tienen que aparecer en el texto (sin distinguir mayúsculas). */
  readonly includes: readonly string[];
  readonly rule: DatabaseViolationRule;
}

const TRIGGER_RULES: readonly TriggerRule[] = [
  {
    sqlstate: '23514',
    includes: ['CENSUS_NOT_CLOSED'],
    rule: unprocessable(
      'CENSUS_NOT_CLOSED',
      'Un día abierto no se ajusta: cerrá el censo primero',
    ),
  },
  {
    sqlstate: '23514',
    includes: ['charge_captures', 'tarifa'],
    rule: unprocessable(
      'CHARGE_PRICE_MISMATCH',
      'El cargo no coincide con su tarifa vigente',
    ),
  },
  {
    sqlstate: '23001',
    includes: ['inpatient_census', 'cerrado'],
    rule: conflict('CENSUS_ALREADY_CLOSED', 'El censo del día está cerrado'),
  },
  {
    sqlstate: '23001',
    includes: ['PLAN_HAS_PLACED_CHILDREN'],
    rule: conflict(
      'PLAN_HAS_PLACED_CHILDREN',
      'El espacio tiene hijos ubicados en el lienzo; quitalos primero',
    ),
  },
  {
    sqlstate: '23001',
    includes: ['space_tariffs'],
    rule: conflict(
      'TARIFF_IN_USE',
      'La tarifa ya tiene cargos devengados o no se borra: cerrala y abrí otra',
    ),
  },
  {
    sqlstate: '23001',
    includes: ['charge_captures', 'emitido'],
    rule: conflict(
      'CHARGE_ALREADY_INVOICED',
      'El cargo ya fue emitido: se anula con motivo',
    ),
  },
  {
    sqlstate: '23001',
    includes: ['charge_captures'],
    rule: conflict(
      'CHARGE_STATE_LOCKED',
      'El cargo no admite ese cambio en su estado actual',
    ),
  },
  {
    sqlstate: '23001',
    includes: ['care_space_category_periods'],
    rule: conflict(
      'CATEGORY_PERIOD_IMMUTABLE',
      'Un período de categoría sólo se cierra; para cambiar la categoría se abre otro',
    ),
  },
  {
    sqlstate: '23001',
    includes: ['no puede pasar a'],
    rule: conflict(
      'HAS_DEPENDENTS',
      'No se puede mover: tiene dependientes que lo referencian',
    ),
  },
  {
    sqlstate: '23001',
    includes: ['append-only'],
    rule: conflict('APPEND_ONLY', 'Ese registro es de sólo inserción'),
  },
  {
    sqlstate: '23001',
    includes: ['immutable'],
    rule: conflict('APPEND_ONLY', 'Ese registro es de sólo inserción'),
  },
];

/** `restrict_violation` sin marca conocida: 409 con un `reason` genérico, nunca 500. */
const GENERIC_RESTRICT: DatabaseViolationRule = conflict(
  'OPERATION_RESTRICTED',
  'La operación no está permitida en el estado actual del registro',
);

/**
 * Nombre de FK compuesta por tenant: `fk_<tabla>_tenant_<algo>` (p. ej.
 * `fk_practice_sites_history_tenant_source`). Una FK simple `…_tenant_id`
 * apunta a `directory.tenants` y no es un cruce.
 */
const COMPOSITE_TENANT_FK = /_tenant_(?!id$)[a-z0-9_]+$/;

/** Texto de los triggers de coherencia de tenant/sede que lanzan `23503`. */
const CROSS_REFERENCE_TEXT =
  /no existe en|no existe para este tenant|otro tenant|no pertenece a la sede|no existe; no se puede derivar/i;

/**
 * Resuelve cómo responder a una violación de la base.
 *
 * @param violation - SQLSTATE, restricción y texto del servidor.
 * @returns La regla, o `undefined` si no se reconoce (el filtro aplica su mapeo genérico).
 */
export function resolveDatabaseViolation(
  violation: DatabaseViolation,
): DatabaseViolationRule | undefined {
  const { sqlstate, constraint, message } = violation;
  if (constraint && CONSTRAINT_RULES[constraint]) {
    return CONSTRAINT_RULES[constraint];
  }

  if (sqlstate === '23503') {
    const crossesTenant =
      (constraint !== undefined && COMPOSITE_TENANT_FK.test(constraint)) ||
      (message !== undefined && CROSS_REFERENCE_TEXT.test(message));
    return crossesTenant
      ? {
          status: HttpStatus.NOT_FOUND,
          reason: CROSS_TENANT_REASON,
          message: CROSS_TENANT_NOT_FOUND_MESSAGE,
        }
      : undefined;
  }

  if (sqlstate === '23001' || sqlstate === '23514') {
    const text = (message ?? '').toLowerCase();
    const hit = TRIGGER_RULES.find(
      (candidate) =>
        candidate.sqlstate === sqlstate &&
        candidate.includes.every((part) => text.includes(part.toLowerCase())),
    );
    if (hit) return hit.rule;
    return sqlstate === '23001' ? GENERIC_RESTRICT : undefined;
  }

  return undefined;
}
