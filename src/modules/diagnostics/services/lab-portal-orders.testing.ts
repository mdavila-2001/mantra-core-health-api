import { jest } from '@jest/globals';
import type { AuthenticatedUser } from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DIAG } from '../diagnostics.concepts';
import { LabPortalOrderOutcomeService } from './lab-portal-order-outcome.service';
import { LabPortalOrdersService } from './lab-portal-orders.service';

type Row = Record<string, unknown>;

type Fn = (...args: unknown[]) => unknown;
export const mockFn = (impl: Fn = () => undefined) => jest.fn(impl);
export const LAB = 'lab-1';
export const actor = { id: 'user-1' } as unknown as AuthenticatedUser;

export const order = (over: Row = {}): Row => ({
  id: 'sr-1',
  patientProfileId: 'pat-1',
  codeConceptId: 'hemograma',
  categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
  createdAt: new Date('2026-11-01T10:00:00Z'),
  ...over,
});

export const view = (status: string, over: Row = {}): Row => ({
  order: order(),
  status,
  reason: null,
  studyName: 'Hemograma',
  patientName: 'Ana',
  requesterName: 'Dra. Rojas',
  accession: { id: 'acc-1' },
  openSpecimenIds: ['sp-1'],
  reports: [],
  files: [],
  ...over,
});

/** `before` is the state the step sees; `after` what the response reads back. */
export function build(
  before: Row,
  after: Row = before,
  found: Row | null = order(),
) {
  const tx = {
    flush: mockFn(async () => undefined),
    nativeUpdate: mockFn(async () => 1),
  };
  const em = {
    transactional: mockFn(async (cb) => (cb as (tx: unknown) => unknown)(tx)),
    fork: () => tx,
  };
  const repo = { findOrder: mockFn(async () => found) };
  const specimen: Row = { id: 'sp-new' };
  const specimens = {
    createAccession: mockFn(() => ({ id: 'acc-new' })),
    createSpecimen: mockFn(() => specimen),
    addAccessionSpecimen: mockFn(),
    recordCustodyEvent: mockFn(),
    findSpecimensByIds: mockFn(async () => [{ id: 'sp-1' }]),
    recordRejection: mockFn(),
    cancelTestsForSpecimen: mockFn(async () => 1),
  };
  const workOrder: Row = { id: 'wo-1' };
  const work = {
    createWorkOrder: mockFn(() => workOrder),
    createWorkOrderTest: mockFn(),
  };
  const snapshot = {
    load: jest
      .fn<(...args: unknown[]) => Promise<unknown>>()
      .mockResolvedValueOnce({ orders: [before], files: [] })
      .mockResolvedValue({ orders: [after], files: [] }),
  };
  const events = { record: mockFn() };
  const outcome = new LabPortalOrderOutcomeService(
    events as never,
    specimens as never,
  );
  const logger = {
    setContext: mockFn(),
    info: mockFn(),
  };
  const drafts = { findByOrders: mockFn(async () => []) };
  const service = new LabPortalOrdersService(
    em as never,
    repo as never,
    specimens as never,
    work as never,
    snapshot as never,
    outcome,
    logger as never,
    drafts as never,
  );
  return {
    service,
    repo,
    specimens,
    work,
    tx,
    specimen,
    workOrder,
    events,
    drafts,
  };
}
