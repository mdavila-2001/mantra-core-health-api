import { describe, expect, it, jest } from '@jest/globals';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { CLIN } from '../../clinical/clinical.concepts';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { LabPortalOrdersService } from './lab-portal-orders.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const LAB = 'lab-1';
const actor = { id: 'user-1' } as any;

const order = (over: Partial<any> = {}): any => ({
  id: 'sr-1',
  patientProfileId: 'pat-1',
  codeConceptId: 'hemograma',
  categoryConceptId: CLIN.SERVICE_REQUEST_CATEGORY_LAB,
  specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
  createdAt: new Date('2026-11-01T10:00:00Z'),
  ...over,
});

const view = (status: string, over: Partial<any> = {}): any => ({
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
function build(before: any, after: any = before, found: any = order()) {
  const tx = {
    flush: mockFn(async () => undefined),
    nativeUpdate: mockFn(async () => 1),
  };
  const em = {
    transactional: mockFn(async (cb: any) => cb(tx)),
    fork: () => tx,
  };
  const repo = { findOrder: mockFn(async () => found) };
  const specimen: any = { id: 'sp-new' };
  const specimens = {
    createAccession: mockFn(() => ({ id: 'acc-new' })),
    createSpecimen: mockFn(() => specimen),
    addAccessionSpecimen: mockFn(),
    recordCustodyEvent: mockFn(),
    findSpecimensByIds: mockFn(async () => [{ id: 'sp-1' }]),
    recordRejection: mockFn(),
    cancelTestsForSpecimen: mockFn(async () => 1),
  };
  const workOrder: any = { id: 'wo-1' };
  const work = {
    createWorkOrder: mockFn(() => workOrder),
    createWorkOrderTest: mockFn(),
  };
  const snapshot = {
    load: mockFn()
      .mockResolvedValueOnce({ orders: [before], files: [] })
      .mockResolvedValue({ orders: [after], files: [] }),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new LabPortalOrdersService(
    em as any,
    repo as any,
    specimens as any,
    work as any,
    snapshot as any,
    logger as any,
  );
  return { service, repo, specimens, work, tx, specimen, workOrder };
}

describe('LabPortalOrdersService.transition', () => {
  it('RECEIVE: performer accession ACC_RECEIVED plus the received specimen', async () => {
    const t = build(view('DRAFT', { accession: null }), view('RECEIVED'));
    const result = await t.service.transition(
      LAB,
      'sr-1',
      { action: 'RECEIVE' },
      actor,
    );
    expect(t.repo.findOrder).toHaveBeenCalledWith(
      expect.anything(),
      LAB,
      'sr-1',
    );
    expect(t.specimens.createAccession).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        custodianTenantId: LAB,
        serviceRequestId: 'sr-1',
        statusConceptId: DIAG.ACCESSION_RECEIVED,
      }),
    );
    expect(t.specimens.createSpecimen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        custodianTenantId: LAB,
        statusConceptId: DIAG.SPECIMEN_RECEIVED,
        specimenTypeConceptId: DIAG.SPECIMEN_TYPE_BLOOD_VENOUS,
      }),
    );
    expect(t.specimen.receivedAt).toBeInstanceOf(Date);
    expect(t.specimens.addAccessionSpecimen).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        laboratoryAccessionId: 'acc-new',
        statusConceptId: DIAG.ACCESSION_ITEM_RECEIVED,
      }),
    );
    expect(result.status).toBe('RECEIVED');
  });

  it('RECEIVE of an imaging order: accession only, no specimen', async () => {
    const t = build(
      view('DRAFT', {
        accession: null,
        order: order({
          categoryConceptId: DIAG.SERVICE_REQUEST_CATEGORY_IMAGING,
          specimenTypeConceptId: undefined,
        }),
      }),
      view('RECEIVED'),
    );
    await t.service.transition(LAB, 'sr-1', { action: 'RECEIVE' }, actor);
    expect(t.specimens.createAccession).toHaveBeenCalled();
    expect(t.specimens.createSpecimen).not.toHaveBeenCalled();
  });

  it('PROCESS: a completed performer work order with its test line', async () => {
    const t = build(view('RECEIVED'), view('PROCESSED'));
    const result = await t.service.transition(
      LAB,
      'sr-1',
      { action: 'PROCESS' },
      actor,
    );
    expect(t.work.createWorkOrder).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        custodianTenantId: LAB,
        laboratoryAccessionId: 'acc-1',
      }),
    );
    expect(t.workOrder.completedAt).toBeInstanceOf(Date);
    expect(t.work.createWorkOrderTest).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        laboratoryWorkOrderId: 'wo-1',
        serviceRequestId: 'sr-1',
        testCodeConceptId: 'hemograma',
        specimenId: 'sp-1',
      }),
    );
    expect(result.status).toBe('PROCESSED');
  });

  it('REJECT: a specimen rejection with the reason, tests cancelled', async () => {
    const t = build(
      view('RECEIVED'),
      view('REJECTED', { reason: 'Hemolizada' }),
    );
    const result = await t.service.transition(
      LAB,
      'sr-1',
      { action: 'REJECT', reason: '  Hemolizada ' },
      actor,
    );
    expect(t.specimens.recordRejection).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ specimenId: 'sp-1', notes: 'Hemolizada' }),
    );
    expect(t.specimens.cancelTestsForSpecimen).toHaveBeenCalledWith(
      expect.anything(),
      'sp-1',
      DIAG.TEST_CANCELLED,
    );
    expect(t.tx.nativeUpdate).toHaveBeenCalled();
    expect(result).toMatchObject({ status: 'REJECTED', reason: 'Hemolizada' });
  });

  it('REJECT without a specimen answers 422 with a stable reason', async () => {
    const t = build(view('RECEIVED', { openSpecimenIds: [] }));
    const error: any = await t.service
      .transition(LAB, 'sr-1', { action: 'REJECT' }, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.reason).toBe(
      DiagnosticsErrorReason.DIAGNOSTICS_LAB_ORDER_ACTION_UNSUPPORTED,
    );
    expect(t.specimens.recordRejection).not.toHaveBeenCalled();
  });

  it('CANCEL answers 422: the performer cannot write the requester order', async () => {
    const t = build(view('DRAFT'));
    const error: any = await t.service
      .transition(LAB, 'sr-1', { action: 'CANCEL' }, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(PreconditionFailedException);
    expect(error.reason).toBe(
      DiagnosticsErrorReason.DIAGNOSTICS_LAB_ORDER_ACTION_UNSUPPORTED,
    );
  });

  it.each([
    ['RECEIVE', 'RECEIVED'],
    ['PROCESS', 'DRAFT'],
    ['PROCESS', 'UPLOADED'],
    ['REJECT', 'PROCESSED'],
    ['CANCEL', 'UPLOADED'],
    ['CANCEL', 'CANCELLED'],
  ])(
    '%s from %s is out of order: 409 with the current state',
    async (action, status) => {
      const t = build(view(status));
      const error: any = await t.service
        .transition(LAB, 'sr-1', { action: action as any }, actor)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(ConflictException);
      expect(error.details).toEqual({ currentStatus: status });
      expect(t.specimens.createAccession).not.toHaveBeenCalled();
      expect(t.work.createWorkOrder).not.toHaveBeenCalled();
    },
  );

  it("another tenant's (or a missing) order is a uniform 404", async () => {
    const t = build(view('DRAFT'), view('DRAFT'), null);
    const error: any = await t.service
      .transition('other-lab', 'sr-1', { action: 'RECEIVE' }, actor)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ResourceNotFoundException);
    expect(error.reason).toBe(
      DiagnosticsErrorReason.DIAGNOSTICS_RESOURCE_NOT_AVAILABLE,
    );
    expect(error.details).toBeUndefined();
    expect(t.repo.findOrder).toHaveBeenCalledWith(
      expect.anything(),
      'other-lab',
      'sr-1',
    );
    expect(t.specimens.createAccession).not.toHaveBeenCalled();
  });
});
