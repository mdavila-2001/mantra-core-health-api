import { jest } from '@jest/globals';
import { withTenantTransactionCompletion } from '../../../common/tenant/tenant-transaction-completion';
import { PushFanout, type InboxAnnouncement } from './push-fanout';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

function build() {
  const logger: any = { warn: mockFn() };
  const gateway: any = { notifyUser: mockFn() };
  const webPush: any = { pushToUser: mockFn(() => Promise.resolve()) };
  const nativePush: any = { pushToUser: mockFn(() => Promise.resolve()) };
  const fanout = new PushFanout(logger, gateway, webPush, nativePush);
  return { fanout, logger, gateway, webPush, nativePush };
}

const NOTICE: InboxAnnouncement = {
  recipientUserId: 'u-1',
  notificationId: 'n-1',
  category: 'MESSAGES',
  subject: 'Mensaje nuevo',
  bodyText: 'Le escribieron',
  destination: { type: 'CONVERSATION', id: 'c-1' },
  availableAt: '2026-11-06T10:00:00.000Z',
};

describe('PushFanout', () => {
  it('inside a request transaction nothing leaves before COMMIT', async () => {
    const d = build();
    await withTenantTransactionCompletion(async () => {
      d.fanout.announce(NOTICE);
      d.fanout.push(NOTICE);
      // Still inside the transaction: neither the socket nor the push fired.
      expect(d.gateway.notifyUser).not.toHaveBeenCalled();
      expect(d.webPush.pushToUser).not.toHaveBeenCalled();
    });
    expect(d.gateway.notifyUser).toHaveBeenCalledTimes(1);
    expect(d.webPush.pushToUser).toHaveBeenCalledTimes(2);
    expect(d.nativePush.pushToUser).toHaveBeenCalledTimes(2);
  });

  it('a rolled-back transaction announces nothing', async () => {
    const d = build();
    await expect(
      withTenantTransactionCompletion(async () => {
        d.fanout.announce(NOTICE);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(d.gateway.notifyUser).not.toHaveBeenCalled();
    expect(d.webPush.pushToUser).not.toHaveBeenCalled();
    expect(d.nativePush.pushToUser).not.toHaveBeenCalled();
  });

  it('a throwing socket never fails the committed request', async () => {
    const d = build();
    d.gateway.notifyUser.mockImplementation(() => {
      throw new Error('socket down');
    });
    await expect(
      withTenantTransactionCompletion(async () => {
        d.fanout.announce(NOTICE);
        return 'ok';
      }),
    ).resolves.toBe('ok');
    expect(d.logger.warn).toHaveBeenCalled();
  });

  it('announce: socket notification:new plus web and native push with the same contract payload', () => {
    const d = build();

    d.fanout.announce(NOTICE);

    expect(d.gateway.notifyUser).toHaveBeenCalledWith('u-1', {
      id: 'n-1',
      category: 'MESSAGES',
      subject: 'Mensaje nuevo',
      bodyText: 'Le escribieron',
      destination: { type: 'CONVERSATION', id: 'c-1' },
      availableAt: NOTICE.availableAt,
    });
    const expected = {
      recipientUserId: 'u-1',
      notificationId: 'n-1',
      route: '/messaging/c-1?responder=1',
      destinationType: 'CONVERSATION',
      destinationId: 'c-1',
      category: 'MESSAGES',
    };
    expect(d.webPush.pushToUser).toHaveBeenCalledWith(expected);
    expect(d.nativePush.pushToUser).toHaveBeenCalledWith(expected);
  });

  it('push: never carries subject or body (PHI stays out of the push channel)', () => {
    const d = build();

    d.fanout.announce(NOTICE);

    const sent = JSON.stringify(d.webPush.pushToUser.mock.calls[0][0]);
    expect(sent).not.toContain('Mensaje nuevo');
    expect(sent).not.toContain('Le escribieron');
  });

  it('push only (renotify) does not touch the socket; empty strings when there is no destination', () => {
    const d = build();

    d.fanout.push({
      recipientUserId: 'u-1',
      notificationId: 'n-1',
      category: null,
      destination: null,
      explicitRoute: '/account/profile',
    });

    expect(d.gateway.notifyUser).not.toHaveBeenCalled();
    expect(d.nativePush.pushToUser).toHaveBeenCalledWith({
      recipientUserId: 'u-1',
      notificationId: 'n-1',
      route: '/account/profile',
      destinationType: '',
      destinationId: '',
      category: '',
    });
  });

  it('works without any sender and swallows a rejected sender', async () => {
    expect(() => new PushFanout({} as any).announce(NOTICE)).not.toThrow();
    const d = build();
    d.nativePush.pushToUser.mockReturnValue(Promise.reject(new Error('x')));

    d.fanout.announce(NOTICE);
    await new Promise((resolve) => setImmediate(resolve));

    expect(d.logger.warn).toHaveBeenCalledTimes(1);
    expect(d.webPush.pushToUser).toHaveBeenCalled();
  });
});
