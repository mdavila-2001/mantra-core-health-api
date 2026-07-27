import { jest } from '@jest/globals';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

import { TrackingController } from './tracking.controller';

const actor = { id: 'user-1', roles: ['TRACKING_ADMIN'] };
const ID = '11111111-1111-1111-1111-111111111111';

function build() {
  const trackingService = {
    openSubject: mockFn(),
    defineMilestones: mockFn(),
    dispatchShipment: mockFn(),
    recordEvent: mockFn(),
    ingestCarrierWebhook: mockFn(),
    recordHandoff: mockFn(),
    recomputeEta: mockFn(),
    recordDeliveryProof: mockFn(),
    recordException: mockFn(),
    cancelShipment: mockFn(),
    scanSla: mockFn(),
  };
  return {
    controller: new TrackingController(trackingService as any),
    trackingService,
  };
}

describe('TrackingController', () => {
  it('delegates opening the subject (UC-37-01)', async () => {
    const d = build();
    const dto = { subjectType: 'SPECIMEN' } as any;
    d.trackingService.openSubject.mockResolvedValue({ id: ID });

    await d.controller.openSubject(dto, actor);

    expect(d.trackingService.openSubject).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the milestone catalog (UC-37-02)', async () => {
    const d = build();
    const dto = { subjectType: 'SPECIMEN', milestones: [] } as any;
    d.trackingService.defineMilestones.mockResolvedValue({ milestoneIds: [] });

    await d.controller.defineMilestones(dto, actor);

    expect(d.trackingService.defineMilestones).toHaveBeenCalledWith(dto, actor);
  });

  it('delegates the dispatch with the route id (UC-37-03)', async () => {
    const d = build();
    const dto = {} as any;
    d.trackingService.dispatchShipment.mockResolvedValue({ id: ID });

    await d.controller.dispatchShipment(ID, dto, actor);

    expect(d.trackingService.dispatchShipment).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the tracking event (UC-37-04)', async () => {
    const d = build();
    const dto = { status: 'IN_TRANSIT' } as any;
    d.trackingService.recordEvent.mockResolvedValue({ id: ID });

    await d.controller.recordEvent(ID, dto, actor);

    expect(d.trackingService.recordEvent).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates the carrier webhook without an actor (UC-37-05)', async () => {
    const d = build();
    const dto = {
      trackingNumber: 'ABC',
      externalStatusCode: 'IN_TRANSIT',
      externalEventId: 'e1',
    } as any;
    d.trackingService.ingestCarrierWebhook.mockResolvedValue({
      duplicate: false,
    });

    await d.controller.ingestCarrierWebhook('DHL', dto);

    expect(d.trackingService.ingestCarrierWebhook).toHaveBeenCalledWith(
      'DHL',
      dto,
    );
  });

  it('delegates the handoff (UC-37-06)', async () => {
    const d = build();
    const dto = { handoffType: 'TRANSFER' } as any;
    d.trackingService.recordHandoff.mockResolvedValue({ id: ID });

    await d.controller.recordHandoff(ID, dto, actor);

    expect(d.trackingService.recordHandoff).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates the ETA recompute (UC-37-07)', async () => {
    const d = build();
    const dto = {
      estimatedArrivalAt: '2026-09-01T18:00:00Z',
      method: 'CARRIER',
    } as any;
    d.trackingService.recomputeEta.mockResolvedValue({ id: ID });

    await d.controller.recomputeEta(ID, dto, actor);

    expect(d.trackingService.recomputeEta).toHaveBeenCalledWith(ID, dto, actor);
  });

  it('delegates the delivery proof (UC-37-08)', async () => {
    const d = build();
    const dto = { proofType: 'SIGNATURE', signatureFileId: ID } as any;
    d.trackingService.recordDeliveryProof.mockResolvedValue({ id: ID });

    await d.controller.recordDeliveryProof(ID, dto, actor);

    expect(d.trackingService.recordDeliveryProof).toHaveBeenCalledWith(
      ID,
      dto,
      actor,
    );
  });

  it('delegates exception and cancellation (UC-37-09, UC-37-10)', async () => {
    const d = build();
    const exceptionDto = { reason: 'ausente' } as any;
    const cancelDto = { reason: 'anulado' } as any;
    d.trackingService.recordException.mockResolvedValue({ shipmentId: ID });
    d.trackingService.cancelShipment.mockResolvedValue({ shipmentId: ID });

    await d.controller.recordException(ID, exceptionDto, actor);
    await d.controller.cancelShipment(ID, cancelDto, actor);

    expect(d.trackingService.recordException).toHaveBeenCalledWith(
      ID,
      exceptionDto,
      actor,
    );
    expect(d.trackingService.cancelShipment).toHaveBeenCalledWith(
      ID,
      cancelDto,
      actor,
    );
  });

  it('delegates the SLA scan (UC-37-11)', async () => {
    const d = build();
    const dto = {} as any;
    d.trackingService.scanSla.mockResolvedValue({ scanned: 0 });

    await d.controller.scanSla(dto, actor);

    expect(d.trackingService.scanSla).toHaveBeenCalledWith(dto, actor);
  });

  it('propagates service errors instead of swallowing them', async () => {
    const d = build();
    d.trackingService.openSubject.mockRejectedValue(new Error('boom'));

    await expect(
      d.controller.openSubject({} as any, actor as any),
    ).rejects.toThrow('boom');
  });
});
