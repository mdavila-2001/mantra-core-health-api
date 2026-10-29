import { jest } from '@jest/globals';
import { FORMS, FUNCTIONS } from '../infrastructure-catalog';
import { PRAC } from '../practice.concepts';
import type { OrderRow, SpaceOpsRow } from './ops-rows';
import { conceptIdOf, CLEANING_TYPES } from '../ops-catalog';

/** `jest.fn` sin la fricción de tipos de los dobles de estas pruebas. */
export const fn = (impl?: any): any => (jest.fn as any)(impl);

export const TENANT = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
export const SITE = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
export const NOW = new Date('2026-10-29T12:00:00Z');
export const actor = { id: 'user-1', roles: ['USER'] } as any;

/** Una cama activa, disponible, limpia y sin aislamiento. */
export function makeRow(overrides: Partial<SpaceOpsRow> = {}): SpaceOpsRow {
  return {
    id: 'space-1',
    tenantId: TENANT,
    practiceSiteId: SITE,
    parentSpaceId: 'room-1',
    clinicalUnitId: 'unit-1',
    code: 'CAMA-1',
    name: 'Cama 1',
    formConceptId: FORMS.byInput('BED')!.id,
    spaceTypeConceptId: FUNCTIONS.byInput('SPACE_FN_BED_STANDARD')!.id,
    statusConceptId: PRAC.SPACE_ACTIVE,
    validFrom: null,
    validTo: null,
    operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
    availabilityReasonConceptId: null,
    availabilityExpectedUntil: null,
    availabilityChangedAt: null,
    hygieneStatusConceptId: PRAC.HYG_INSPECTED,
    hygieneChangedAt: null,
    terminalCleaningRequired: false,
    isolationConceptId: PRAC.ISO_NONE,
    isolationOrganismText: null,
    isolationChangedAt: null,
    opsVersion: 3,
    rowVersion: 1,
    pressureConceptId: null,
    airChangesPerHour: null,
    hvacValidatedOn: null,
    ...overrides,
  };
}

/** Una orden de limpieza terminada, lista para inspeccionar. */
export function makeOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: 'order-1',
    tenantId: TENANT,
    practiceSiteId: SITE,
    careSpaceId: 'space-1',
    clinicalUnitId: 'unit-1',
    cleaningTypeConceptId: conceptIdOf(CLEANING_TYPES, 'CLEAN_ROUTINE'),
    triggerConceptId: PRAC.CLN_TRG_MANUAL,
    sourceRefId: null,
    previousOrderId: null,
    priorityConceptId: PRAC.CLN_PRIO_ROUTINE,
    statusConceptId: PRAC.CLN_DONE,
    requestedAt: new Date('2026-10-29T10:00:00Z'),
    dueAt: null,
    assignedUserId: null,
    startedAt: null,
    startedByUserId: null,
    finishedAt: new Date('2026-10-29T11:00:00Z'),
    finishedByUserId: 'cleaner-1',
    inspectedAt: null,
    inspectedByUserId: null,
    inspectionResultConceptId: null,
    rejectionReason: null,
    cancelReason: null,
    createdAt: new Date('2026-10-29T10:00:00Z'),
    rowVersion: 4,
    ...overrides,
  };
}

/** Pasa a la forma cruda que devuelve el driver (snake_case). */
export function rawOrder(order: OrderRow): Record<string, unknown> {
  return {
    id: order.id,
    tenant_id: order.tenantId,
    practice_site_id: order.practiceSiteId,
    care_space_id: order.careSpaceId,
    clinical_unit_id: order.clinicalUnitId,
    cleaning_type_concept_id: order.cleaningTypeConceptId,
    trigger_concept_id: order.triggerConceptId,
    source_ref_id: order.sourceRefId,
    previous_order_id: order.previousOrderId,
    priority_concept_id: order.priorityConceptId,
    status_concept_id: order.statusConceptId,
    requested_at: order.requestedAt,
    due_at: order.dueAt,
    assigned_user_id: order.assignedUserId,
    started_at: order.startedAt,
    started_by_user_id: order.startedByUserId,
    finished_at: order.finishedAt,
    finished_by_user_id: order.finishedByUserId,
    inspected_at: order.inspectedAt,
    inspected_by_user_id: order.inspectedByUserId,
    inspection_result_concept_id: order.inspectionResultConceptId,
    rejection_reason: order.rejectionReason,
    cancel_reason: order.cancelReason,
    created_at: order.createdAt,
    row_version: order.rowVersion,
  };
}
