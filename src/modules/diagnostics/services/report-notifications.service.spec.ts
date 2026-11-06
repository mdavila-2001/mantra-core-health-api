import { describe, expect, it, jest } from '@jest/globals';
import { ReportNotificationsService } from './report-notifications.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const users: Record<string, string> = {
  pat: 'u-pat',
  doc: 'u-doc',
  signer: 'u-sig',
};

function build(failing = false) {
  const em: any = { fork: () => em };
  const notifications = {
    emitInApp: mockFn(async () => {
      if (failing) throw new Error('bell down');
      return { suppressed: false };
    }),
  };
  const links = {
    findActiveByPerson: mockFn(async (_em: any, id: string) =>
      users[id] ? { userId: users[id] } : null,
    ),
  };
  const logger = { setContext: mockFn(), error: mockFn() };
  return {
    service: new ReportNotificationsService(
      em,
      notifications as any,
      links as any,
      logger as any,
    ),
    notifications,
    logger,
  };
}

const facts = (over: Partial<any> = {}): any => ({
  tenantId: 'lab',
  reportId: 'r1',
  versionId: 'v1',
  studyName: 'Hemograma',
  patientProfileId: 'pat',
  visible: true,
  requesterProfileId: 'doc',
  orderCreatedByUserId: null,
  signerProfileId: 'signer',
  actorUserId: 'u-lab',
  ...over,
});

const recipients = (t: ReturnType<typeof build>) =>
  t.notifications.emitInApp.mock.calls.map((c: any[]) => [
    c[0].recipientUserId,
    c[0].subject,
  ]);

describe('ReportNotificationsService', () => {
  it('VISIBLE: requester, patient and signer get a CLINICAL notice to the report', async () => {
    const t = build();
    await t.service.published(facts());
    expect(recipients(t)).toEqual([
      ['u-doc', 'Resultado publicado: Hemograma'],
      ['u-pat', 'Tu resultado de Hemograma está listo'],
      ['u-sig', 'Se publicó un informe con tu firma'],
    ]);
    expect(t.notifications.emitInApp.mock.calls[0][0]).toMatchObject({
      category: 'CLINICAL',
      destination: { type: 'DIAGNOSTIC_REPORT', id: 'r1' },
    });
  });

  it('HELD: no patient notice, the requester (or the order creator) is asked to deliver it; the signer who publishes is skipped', async () => {
    const t = build();
    await t.service.published(
      facts({
        visible: false,
        requesterProfileId: null,
        orderCreatedByUserId: 'u-creator',
        actorUserId: 'u-sig',
      }),
    );
    expect(recipients(t)).toEqual([
      ['u-creator', 'Resultado retenido: entrégalo al paciente'],
    ]);
  });

  it('a failing bell never throws', async () => {
    const t = build(true);
    await expect(t.service.published(facts())).resolves.toBeUndefined();
    expect(t.logger.error).toHaveBeenCalled();
  });
});
