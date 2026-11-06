import { jest } from '@jest/globals';
import { PharmaLabNotificationsService } from './pharma-lab-notifications.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const tx = {
    create: mockFn((_entity: unknown, data: any) => ({
      id: 'notice-1',
      ...data,
    })),
    flush: mockFn().mockResolvedValue(undefined),
  };
  const inApp = {
    emitInApp: mockFn().mockResolvedValue({ suppressed: false }),
  };
  const service = new PharmaLabNotificationsService({} as any, inApp as any);
  return { service, tx, inApp };
}

const visitNotice = {
  recipientUserId: 'doctor-1',
  templateCode: 'PHARMA_LAB_VISIT_REQUESTED',
  subject: 'Nueva solicitud de visita médica',
  bodyText: 'Ana (Lab) solicitó una visita.',
  relatedResourceType: 'visit_request',
  relatedResourceId: 'vr-1',
  tenantId: 't1',
};

describe('PharmaLabNotificationsService (bell + push copy)', () => {
  it('writes the local notice and emits it in-app to the doctor visit inbox', async () => {
    const d = build();
    await d.service.notify(d.tx as any, visitNotice, 'visitor-1');

    expect(d.tx.create).toHaveBeenCalledTimes(1);
    expect(d.tx.flush).toHaveBeenCalled();
    expect(d.inApp.emitInApp).toHaveBeenCalledWith({
      recipientUserId: 'doctor-1',
      category: 'SCHEDULING',
      subject: 'Nueva solicitud de visita médica',
      bodyText: 'Ana (Lab) solicitó una visita.',
      destination: { type: 'PHARMA_LAB_DOCTOR_VISITS', id: 'vr-1' },
      tenantId: 't1',
      debounceKey: 'pharma_lab:notice:notice-1',
      payloadJson: { templateCode: 'PHARMA_LAB_VISIT_REQUESTED' },
      actorUserId: 'visitor-1',
    });
  });

  it('routes visitor decisions to the visitor screen', async () => {
    const d = build();
    await d.service.notify(d.tx as any, {
      ...visitNotice,
      recipientUserId: 'visitor-1',
      templateCode: 'PHARMA_LAB_VISIT_ACCEPTED',
    });

    expect(d.inApp.emitInApp).toHaveBeenCalledWith(
      expect.objectContaining({
        recipientUserId: 'visitor-1',
        destination: { type: 'PHARMA_LAB_VISITOR_VISITS', id: 'vr-1' },
      }),
    );
  });

  it('pharmacovigilance goes to every staff member as CLINICAL, without the event description', async () => {
    const d = build();
    await d.service.notifyAll(d.tx as any, ['s1', 's2', 's1'], {
      templateCode: 'PHARMA_LAB_PV_REPORT_RECEIVED',
      subject: 'Nuevo reporte de farmacovigilancia FV-1',
      bodyText: 'Producto: descripción del evento adverso',
      relatedResourceType: 'pharmacovigilance_report',
      relatedResourceId: 'pv-1',
    });

    expect(d.inApp.emitInApp).toHaveBeenCalledTimes(2);
    const inputs = d.inApp.emitInApp.mock.calls.map((call: any[]) => call[0]);
    expect(inputs.map((i: any) => i.recipientUserId)).toEqual(['s1', 's2']);
    for (const input of inputs) {
      expect(input.category).toBe('CLINICAL');
      expect(input.destination).toEqual({
        type: 'PHARMA_LAB_ADMIN',
        id: 'pv-1',
      });
      expect(input.bodyText).not.toContain('evento adverso');
    }
  });

  it('post moderation is SOCIAL', async () => {
    const d = build();
    await d.service.notify(d.tx as any, {
      ...visitNotice,
      templateCode: 'PHARMA_LAB_POST_APPROVED',
      relatedResourceType: 'visitor_post_submission',
    });

    expect(d.inApp.emitInApp).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'SOCIAL' }),
    );
  });
});
