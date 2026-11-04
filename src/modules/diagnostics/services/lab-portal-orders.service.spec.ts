import { describe, expect, it } from '@jest/globals';
import { ConflictException, ResourceNotFoundException } from '../../../common';
import { DIAG } from '../diagnostics.concepts';
import { DiagnosticsErrorReason } from '../diagnostics.error-reasons';
import { LABP } from '../lab-portal.concepts';
import { LAB, actor, build, order, view } from './lab-portal-orders.testing';

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
    expect(t.work.createWorkOrder).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ statusConceptId: LABP.WORK_ORDER_COMPLETED }),
    );
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

  it.each([
    ['RECEIVE', 'RECEIVED'],
    ['PROCESS', 'DRAFT'],
    ['PROCESS', 'UPLOADED'],
    ['REJECT', 'PROCESSED'],
    ['REJECT', 'DRAFT'],
    ['REJECT', 'REJECTED'],
    ['CANCEL', 'UPLOADED'],
    ['CANCEL', 'CANCELLED'],
    ['CANCEL', 'REJECTED'],
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
      expect(t.events.record).not.toHaveBeenCalled();
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
