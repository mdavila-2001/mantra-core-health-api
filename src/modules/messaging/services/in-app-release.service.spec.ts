import { jest } from '@jest/globals';
import { LockMode } from '@mikro-orm/core';
import { CONCEPTS } from '../../../common';
import { NOTIFICATION_CATEGORY_CONCEPT } from '../notifications.contract';
import { InAppReleaseService } from './in-app-release.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build(rows: any[]) {
  const tx: any = {
    find: mockFn(() => Promise.resolve(rows)),
    flush: mockFn(() => Promise.resolve()),
  };
  const em: any = { transactional: mockFn((cb: any) => cb(tx)) };
  const logger: any = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const gateway: any = { notifyUser: mockFn() };
  const webPush: any = { pushToUser: mockFn(() => Promise.resolve()) };
  const nativePush: any = { pushToUser: mockFn(() => Promise.resolve()) };
  const service = new InAppReleaseService(
    em,
    logger,
    gateway,
    webPush,
    nativePush,
  );
  return { service, tx, gateway, webPush, nativePush };
}

function deferredRow(overrides: Record<string, unknown> = {}): any {
  return {
    id: 'n-1',
    recipientUserId: 'u-1',
    categoryConceptId: NOTIFICATION_CATEGORY_CONCEPT.MESSAGES,
    subject: 'Mensaje nuevo',
    bodyText: 'Le escribieron',
    relatedResourceType: 'CONVERSATION',
    relatedResourceId: 'c-1',
    payloadJson: null,
    statusConceptId: CONCEPTS.INAPP_UNREAD,
    availableAt: new Date(Date.now() - 30_000),
    sentAt: undefined,
    ...overrides,
  };
}

describe('InAppReleaseService.releaseDue', () => {
  it('claims due unannounced rows with SKIP LOCKED and stamps sent_at before announcing', async () => {
    const row = deferredRow();
    const d = build([row]);

    const res = await d.service.releaseDue(10);

    const [, where, options] = d.tx.find.mock.calls[0];
    expect(where).toMatchObject({
      sentAt: null,
      statusConceptId: CONCEPTS.INAPP_UNREAD,
      availableAt: { $lte: expect.any(Date) },
    });
    expect(options).toMatchObject({
      lockMode: LockMode.PESSIMISTIC_PARTIAL_WRITE,
      limit: 10,
    });
    expect(row.sentAt).toBeInstanceOf(Date);
    expect(d.tx.flush).toHaveBeenCalled();
    expect(res).toEqual({ released: 1, announced: 1 });
  });

  it('announces like any fresh row: socket + web + native push with the resolved route', async () => {
    const d = build([deferredRow()]);

    await d.service.releaseDue();

    expect(d.gateway.notifyUser).toHaveBeenCalledWith(
      'u-1',
      expect.objectContaining({
        id: 'n-1',
        category: 'MESSAGES',
        destination: { type: 'CONVERSATION', id: 'c-1' },
      }),
    );
    for (const sender of [d.webPush, d.nativePush]) {
      expect(sender.pushToUser).toHaveBeenCalledWith(
        expect.objectContaining({
          notificationId: 'n-1',
          route: '/messaging/c-1?responder=1',
          category: 'MESSAGES',
        }),
      );
    }
  });

  it('a row that became visible hours ago is released silently (no late buzz)', async () => {
    const d = build([
      deferredRow({ availableAt: new Date(Date.now() - 3 * 60 * 60_000) }),
    ]);

    const res = await d.service.releaseDue();

    expect(res).toEqual({ released: 1, announced: 0 });
    expect(d.webPush.pushToUser).not.toHaveBeenCalled();
    expect(d.gateway.notifyUser).not.toHaveBeenCalled();
  });

  it('nothing due: nothing announced', async () => {
    const d = build([]);

    expect(await d.service.releaseDue()).toEqual({ released: 0, announced: 0 });
  });
});
