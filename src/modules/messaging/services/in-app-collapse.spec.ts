import { describe, expect, it, jest } from '@jest/globals';
import { collapseUnreadInApp, type CollapseChecks } from './in-app-collapse';

const checks = (over: Partial<CollapseChecks> = {}): CollapseChecks => ({
  optedOut: jest.fn(async () => undefined),
  silentUntil: jest.fn(async (now: Date) => now),
  ...over,
});

const unread = (availableAt: Date): any => ({
  id: 'in-app-1',
  notificationRequestId: 'req-1',
  subject: 'Nueva solicitud de visita',
  bodyText: 'Un visitador pidió una visita.',
  payloadJson: { templateCode: 'PHARMA_LAB_VISIT_REQUESTED' },
  availableAt,
  updatedAt: new Date(0),
});

const CANCELLED = {
  recipientUserId: 'doc-1',
  category: 'SCHEDULING' as const,
  subject: 'Visita cancelada',
  bodyText: 'El visitador canceló la visita.',
  payloadJson: { templateCode: 'PHARMA_LAB_VISIT_CANCELLED' },
};

describe('collapseUnreadInApp', () => {
  it('the bell row shows the newest fact and moves up; the phone buzzes', async () => {
    const row = unread(new Date(Date.now() - 60_000));
    const before = row.availableAt;

    const res = await collapseUnreadInApp(row, CANCELLED, 'actor', checks());

    expect(res).toEqual({
      inAppNotificationId: 'in-app-1',
      requestId: 'req-1',
      suppressed: false,
      renotify: true,
    });
    expect(row).toMatchObject({
      subject: 'Visita cancelada',
      bodyText: 'El visitador canceló la visita.',
      payloadJson: { templateCode: 'PHARMA_LAB_VISIT_CANCELLED' },
      updatedByUserId: 'actor',
    });
    expect(row.availableAt.getTime()).toBeGreaterThan(before.getTime());
  });

  it('quiet hours: the text is updated but nothing buzzes', async () => {
    const row = unread(new Date(Date.now() - 60_000));
    const res = await collapseUnreadInApp(
      row,
      CANCELLED,
      'actor',
      checks({
        silentUntil: async (now) => new Date(now.getTime() + 3_600_000),
      }),
    );
    expect(res.renotify).toBe(false);
    expect(row.subject).toBe('Visita cancelada');
  });

  it('category opted out: the row stays as it was and nothing buzzes', async () => {
    const row = unread(new Date(Date.now() - 60_000));
    const snapshot = { ...row };
    const res = await collapseUnreadInApp(
      row,
      CANCELLED,
      'actor',
      checks({ optedOut: async () => 'opted out' }),
    );
    expect(res.renotify).toBeUndefined();
    expect(row).toEqual(snapshot);
  });

  it('a row still deferred keeps its release time and is not pushed now', async () => {
    const later = new Date(Date.now() + 3_600_000);
    const row = unread(later);
    const res = await collapseUnreadInApp(row, CANCELLED, 'actor', checks());
    expect(res.renotify).toBe(false);
    expect(row.availableAt).toBe(later);
    expect(row.subject).toBe('Visita cancelada');
  });
});
