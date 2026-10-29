/**
 * Filas que lee la operación de espacios y sus mapeos. Las lecturas de F2 son SQL
 * directo (`tx.execute`) y las escrituras son nativas (`insert`/`nativeUpdate`):
 * así ninguna operación deja entidades gestionadas desactualizadas dentro de la
 * transacción, y `row_version`/`ops_version` los incrementa la aplicación a propósito
 * (la base no lo hace, CONTRATO-F2-F5 §F2.1).
 */

/** Texto de una columna del driver (los `uuid`/`varchar` llegan como texto; las fechas, como `Date`). */
export function str(value: unknown): string {
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'bigint' ||
    typeof value === 'boolean'
  )
    return String(value);
  if (value instanceof Date) return value.toISOString();
  throw new TypeError('Valor de columna inesperado');
}

/** Como {@link str}, con `null` y `undefined` conservados como `null`. */
export function strOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : str(value);
}

/** Fecha que devuelve el driver, o `null`. */
function date(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  return value instanceof Date ? value : new Date(str(value));
}

/** Texto o `null`. */
const text = strOrNull;

/** Entero o `null` (los `numeric` llegan como texto). */
function int(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** `?, ?, ?` para una lista (el driver no convierte arreglos de JS en `any(?)`). */
export function placeholders(count: number): string {
  return Array.from({ length: count }, () => '?').join(', ');
}

/** Un espacio con las columnas que la operación necesita. */
export interface SpaceOpsRow {
  readonly id: string;
  readonly tenantId: string;
  readonly practiceSiteId: string;
  readonly parentSpaceId: string | null;
  readonly clinicalUnitId: string | null;
  readonly code: string;
  readonly name: string;
  readonly formConceptId: string | null;
  readonly spaceTypeConceptId: string;
  readonly statusConceptId: string;
  readonly validFrom: Date | null;
  readonly validTo: Date | null;
  readonly operationalStatusConceptId: string | null;
  readonly availabilityReasonConceptId: string | null;
  readonly availabilityExpectedUntil: Date | null;
  readonly availabilityChangedAt: Date | null;
  readonly hygieneStatusConceptId: string | null;
  readonly hygieneChangedAt: Date | null;
  readonly terminalCleaningRequired: boolean;
  readonly isolationConceptId: string | null;
  readonly isolationOrganismText: string | null;
  readonly isolationChangedAt: Date | null;
  readonly opsVersion: number;
  readonly pressureConceptId: string | null;
  readonly airChangesPerHour: number | null;
  /** `YYYY-MM-DD`. */
  readonly hvacValidatedOn: string | null;
}

/** Columnas de {@link SpaceOpsRow}, con el alias `cs`. */
export const SPACE_OPS_COLUMNS = `cs.id, cs.tenant_id, cs.practice_site_id, cs.parent_space_id, cs.clinical_unit_id,
  cs.code, cs.name, cs.form_concept_id, cs.space_type_concept_id, cs.status_concept_id,
  cs.valid_from, cs.valid_to, cs.operational_status_concept_id,
  cs.availability_reason_concept_id, cs.availability_expected_until, cs.availability_changed_at,
  cs.hygiene_status_concept_id, cs.hygiene_changed_at, cs.terminal_cleaning_required,
  cs.isolation_concept_id, cs.isolation_organism_text, cs.isolation_changed_at, cs.ops_version,
  cs.pressure_concept_id, cs.air_changes_per_hour, to_char(cs.hvac_validated_on, 'YYYY-MM-DD') as hvac_validated_on`;

/** Mapea una fila cruda a {@link SpaceOpsRow}. */
export function toSpaceOpsRow(raw: Record<string, unknown>): SpaceOpsRow {
  return {
    id: str(raw.id),
    tenantId: str(raw.tenant_id),
    practiceSiteId: str(raw.practice_site_id),
    parentSpaceId: text(raw.parent_space_id),
    clinicalUnitId: text(raw.clinical_unit_id),
    code: str(raw.code),
    name: str(raw.name),
    formConceptId: text(raw.form_concept_id),
    spaceTypeConceptId: str(raw.space_type_concept_id),
    statusConceptId: str(raw.status_concept_id),
    validFrom: date(raw.valid_from),
    validTo: date(raw.valid_to),
    operationalStatusConceptId: text(raw.operational_status_concept_id),
    availabilityReasonConceptId: text(raw.availability_reason_concept_id),
    availabilityExpectedUntil: date(raw.availability_expected_until),
    availabilityChangedAt: date(raw.availability_changed_at),
    hygieneStatusConceptId: text(raw.hygiene_status_concept_id),
    hygieneChangedAt: date(raw.hygiene_changed_at),
    terminalCleaningRequired: raw.terminal_cleaning_required === true,
    isolationConceptId: text(raw.isolation_concept_id),
    isolationOrganismText: text(raw.isolation_organism_text),
    isolationChangedAt: date(raw.isolation_changed_at),
    opsVersion: Number(raw.ops_version),
    pressureConceptId: text(raw.pressure_concept_id),
    airChangesPerHour: int(raw.air_changes_per_hour),
    hvacValidatedOn: text(raw.hvac_validated_on),
  };
}

/** Un bloqueo. */
export interface BlockRow {
  readonly id: string;
  readonly tenantId: string;
  readonly careSpaceId: string;
  readonly kindConceptId: string;
  readonly reasonConceptId: string;
  readonly reasonText: string | null;
  readonly startsAt: Date;
  readonly expectedEndAt: Date | null;
  readonly endedAt: Date | null;
  readonly endedByUserId: string | null;
  readonly endNote: string | null;
  readonly cancelledAt: Date | null;
  readonly cancelReason: string | null;
  readonly workOrderRef: string | null;
  readonly createdAt: Date;
  readonly createdByUserId: string | null;
  readonly rowVersion: number;
}

/** Columnas de {@link BlockRow}, con el alias `b`. */
export const BLOCK_COLUMNS = `b.id, b.tenant_id, b.care_space_id, b.kind_concept_id, b.reason_concept_id,
  b.reason_text, b.starts_at, b.expected_end_at, b.ended_at, b.ended_by_user_id, b.end_note,
  b.cancelled_at, b.cancel_reason, b.work_order_ref, b.created_at, b.created_by_user_id, b.row_version`;

/** Mapea una fila cruda a {@link BlockRow}. */
export function toBlockRow(raw: Record<string, unknown>): BlockRow {
  return {
    id: str(raw.id),
    tenantId: str(raw.tenant_id),
    careSpaceId: str(raw.care_space_id),
    kindConceptId: str(raw.kind_concept_id),
    reasonConceptId: str(raw.reason_concept_id),
    reasonText: text(raw.reason_text),
    startsAt: date(raw.starts_at)!,
    expectedEndAt: date(raw.expected_end_at),
    endedAt: date(raw.ended_at),
    endedByUserId: text(raw.ended_by_user_id),
    endNote: text(raw.end_note),
    cancelledAt: date(raw.cancelled_at),
    cancelReason: text(raw.cancel_reason),
    workOrderRef: text(raw.work_order_ref),
    createdAt: date(raw.created_at)!,
    createdByUserId: text(raw.created_by_user_id),
    rowVersion: Number(raw.row_version),
  };
}

/** Una orden de limpieza. */
export interface OrderRow {
  readonly id: string;
  readonly tenantId: string;
  readonly practiceSiteId: string;
  readonly careSpaceId: string;
  readonly clinicalUnitId: string | null;
  readonly cleaningTypeConceptId: string;
  readonly triggerConceptId: string;
  readonly sourceRefId: string | null;
  readonly previousOrderId: string | null;
  readonly priorityConceptId: string;
  readonly statusConceptId: string;
  readonly requestedAt: Date;
  readonly dueAt: Date | null;
  readonly assignedUserId: string | null;
  readonly startedAt: Date | null;
  readonly startedByUserId: string | null;
  readonly finishedAt: Date | null;
  readonly finishedByUserId: string | null;
  readonly inspectedAt: Date | null;
  readonly inspectedByUserId: string | null;
  readonly inspectionResultConceptId: string | null;
  readonly rejectionReason: string | null;
  readonly cancelReason: string | null;
  readonly createdAt: Date;
  readonly rowVersion: number;
}

/** Columnas de {@link OrderRow}, con el alias `o`. */
export const ORDER_COLUMNS = `o.id, o.tenant_id, o.practice_site_id, o.care_space_id, o.clinical_unit_id,
  o.cleaning_type_concept_id, o.trigger_concept_id, o.source_ref_id, o.previous_order_id,
  o.priority_concept_id, o.status_concept_id, o.requested_at, o.due_at, o.assigned_user_id,
  o.started_at, o.started_by_user_id, o.finished_at, o.finished_by_user_id, o.inspected_at,
  o.inspected_by_user_id, o.inspection_result_concept_id, o.rejection_reason, o.cancel_reason,
  o.created_at, o.row_version`;

/** Mapea una fila cruda a {@link OrderRow}. */
export function toOrderRow(raw: Record<string, unknown>): OrderRow {
  return {
    id: str(raw.id),
    tenantId: str(raw.tenant_id),
    practiceSiteId: str(raw.practice_site_id),
    careSpaceId: str(raw.care_space_id),
    clinicalUnitId: text(raw.clinical_unit_id),
    cleaningTypeConceptId: str(raw.cleaning_type_concept_id),
    triggerConceptId: str(raw.trigger_concept_id),
    sourceRefId: text(raw.source_ref_id),
    previousOrderId: text(raw.previous_order_id),
    priorityConceptId: str(raw.priority_concept_id),
    statusConceptId: str(raw.status_concept_id),
    requestedAt: date(raw.requested_at)!,
    dueAt: date(raw.due_at),
    assignedUserId: text(raw.assigned_user_id),
    startedAt: date(raw.started_at),
    startedByUserId: text(raw.started_by_user_id),
    finishedAt: date(raw.finished_at),
    finishedByUserId: text(raw.finished_by_user_id),
    inspectedAt: date(raw.inspected_at),
    inspectedByUserId: text(raw.inspected_by_user_id),
    inspectionResultConceptId: text(raw.inspection_result_concept_id),
    rejectionReason: text(raw.rejection_reason),
    cancelReason: text(raw.cancel_reason),
    createdAt: date(raw.created_at)!,
    rowVersion: Number(raw.row_version),
  };
}

/** ISO de una fecha, o `null`. */
export function isoOrNull(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}
