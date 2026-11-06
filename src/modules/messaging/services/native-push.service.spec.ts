import { jest } from '@jest/globals';

const getAccessToken = jest.fn<() => Promise<{ token?: string | null }>>();
const jwtOptions: unknown[] = [];
jest.unstable_mockModule('google-auth-library', () => ({
  JWT: class {
    constructor(options: unknown) {
      jwtOptions.push(options);
    }
    getAccessToken = getAccessToken;
  },
}));

type ServiceModule = typeof import('./native-push.service');
type CipherModule = typeof import('../../../common/crypto/secret-cipher');
let NativePushService: ServiceModule['NativePushService'];
let encryptSecret: CipherModule['encryptSecret'];
beforeAll(async () => {
  const serviceModule: string = './native-push.service';
  const cipherModule: string = '../../../common/crypto/secret-cipher';
  ({ NativePushService } = (await import(serviceModule)) as ServiceModule);
  ({ encryptSecret } = (await import(cipherModule)) as CipherModule);
});

let platformIos = '';
let platformAndroid = '';
beforeAll(async () => {
  const commonModule: string = '../../../common';
  const { CONCEPTS } = (await import(commonModule)) as {
    CONCEPTS: { PLATFORM_IOS: string; PLATFORM_ANDROID: string };
  };
  platformIos = CONCEPTS.PLATFORM_IOS;
  platformAndroid = CONCEPTS.PLATFORM_ANDROID;
});

function fcmOn(): void {
  process.env['FCM_PROJECT_ID'] = 'alovida-test';
  process.env['FCM_SERVICE_ACCOUNT_JSON'] = JSON.stringify({
    client_email: 'push@alovida-test.iam.gserviceaccount.com',
    private_key: 'test-private-key',
  });
}
function fcmOff(): void {
  delete process.env['FCM_PROJECT_ID'];
  delete process.env['FCM_SERVICE_ACCOUNT_JSON'];
}

const seal = (token: string) => encryptSecret(JSON.stringify({ fcm: token }));

function build(devices: any[] = []) {
  const matches = (d: any, where: any) =>
    (where.id === undefined || d.id === where.id) &&
    (where.userId === undefined || d.userId === where.userId) &&
    (where.deviceFingerprint === undefined ||
      d.deviceFingerprint === where.deviceFingerprint) &&
    (where.platformConceptId === undefined ||
      where.platformConceptId.$in.includes(d.platformConceptId)) &&
    (where.pushTokenEncrypted === undefined || d.pushTokenEncrypted);
  const tx: any = {
    findOne: jest.fn(async (_e: unknown, where: any) =>
      devices.find((d) => matches(d, where)),
    ),
    find: jest.fn(async (_e: unknown, where: any) =>
      devices.filter((d) => matches(d, where)),
    ),
    create: jest.fn((_e: unknown, data: any) => {
      devices.push({ id: `d${devices.length + 1}`, ...data });
    }),
  };
  const forked = { ...tx, transactional: (cb: any) => cb(tx) };
  const em: any = { transactional: (cb: any) => cb(tx), fork: () => forked };
  const logger: any = { setContext: jest.fn(), warn: jest.fn() };
  return { service: new NativePushService(em, logger), devices, logger };
}

function reply(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('NativePushService', () => {
  let fetchSpy: jest.SpiedFunction<typeof fetch>;
  beforeEach(() => {
    fetchSpy = jest.spyOn(globalThis, 'fetch');
    getAccessToken.mockResolvedValue({ token: 'access-token' });
  });
  afterEach(() => {
    fcmOff();
    fetchSpy.mockRestore();
    getAccessToken.mockReset();
    jwtOptions.length = 0;
  });

  it('without FCM config is a no-op that warns only once', async () => {
    const d = build([
      {
        id: 'd1',
        userId: 'u1',
        platformConceptId: platformIos,
        pushTokenEncrypted: seal('t1'),
      },
    ]);
    expect(d.service.enabled()).toBe(false);
    const msg = { recipientUserId: 'u1', notificationId: 'n1', route: '/x' };
    await d.service.pushToUser(msg);
    await d.service.pushToUser(msg);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(d.logger.warn).toHaveBeenCalledTimes(1);
  });

  it('sends the FCM v1 message with a generic text and the contract data map', async () => {
    fcmOn();
    fetchSpy.mockResolvedValue(reply(200, { name: 'projects/x/messages/1' }));
    const d = build([
      {
        id: 'd1',
        userId: 'u1',
        platformConceptId: platformIos,
        pushTokenEncrypted: seal('ios-token'),
      },
      {
        id: 'd2',
        userId: 'u1',
        platformConceptId: undefined,
        pushTokenEncrypted: seal('web'),
      },
    ]);
    await d.service.pushToUser({
      recipientUserId: 'u1',
      notificationId: 'n1',
      route: '/appointments/abc',
      destinationType: 'APPOINTMENT',
      destinationId: 'abc',
      category: 'SCHEDULING',
    });
    expect(jwtOptions).toEqual([
      expect.objectContaining({
        email: 'push@alovida-test.iam.gserviceaccount.com',
        scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
      }),
    ]);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(
      'https://fcm.googleapis.com/v1/projects/alovida-test/messages:send',
    );
    expect((init.headers as Record<string, string>).authorization).toBe(
      'Bearer access-token',
    );
    expect(JSON.parse(init.body as string)).toEqual({
      message: {
        token: 'ios-token',
        notification: {
          title: 'AloVida',
          body: 'Tiene un aviso nuevo en AloVida',
        },
        data: {
          notificationId: 'n1',
          route: '/appointments/abc',
          destinationType: 'APPOINTMENT',
          destinationId: 'abc',
          category: 'SCHEDULING',
        },
        android: {
          priority: 'HIGH',
          notification: { channel_id: 'alovida_avisos' },
        },
        apns: {
          headers: { 'apns-priority': '10' },
          payload: { aps: { sound: 'default' } },
        },
      },
    });
  });

  it('falls back to /notification-center and empty strings', async () => {
    fcmOn();
    fetchSpy.mockResolvedValue(reply(200));
    const d = build([
      {
        id: 'd1',
        userId: 'u1',
        platformConceptId: platformAndroid,
        pushTokenEncrypted: seal('a'),
      },
    ]);
    await d.service.pushToUser({
      recipientUserId: 'u1',
      notificationId: 'n1',
      route: '//evil.com',
    });
    const body = JSON.parse(
      (fetchSpy.mock.calls[0][1] as RequestInit).body as string,
    );
    expect(body.message.data).toEqual({
      notificationId: 'n1',
      route: '/notification-center',
      destinationType: '',
      destinationId: '',
      category: '',
    });
  });

  it.each([
    [
      404,
      {
        error: {
          status: 'NOT_FOUND',
          details: [{ errorCode: 'UNREGISTERED' }],
        },
      },
    ],
    [
      400,
      {
        error: {
          status: 'INVALID_ARGUMENT',
          message:
            'The registration token is not a valid FCM registration token',
        },
      },
    ],
    [
      403,
      {
        error: {
          status: 'PERMISSION_DENIED',
          details: [{ errorCode: 'SENDER_ID_MISMATCH' }],
        },
      },
    ],
  ])('forgets a dead token (HTTP %s)', async (status, body) => {
    fcmOn();
    fetchSpy.mockResolvedValue(reply(status, body));
    const d = build([
      {
        id: 'd1',
        userId: 'u1',
        platformConceptId: platformIos,
        pushTokenEncrypted: seal('dead'),
      },
    ]);
    await d.service.pushToUser({
      recipientUserId: 'u1',
      notificationId: 'n1',
      route: '/x',
    });
    expect(d.devices[0].pushTokenEncrypted).toBeUndefined();
  });

  it('keeps the token on a payload error or a network failure, and never throws', async () => {
    fcmOn();
    fetchSpy
      .mockResolvedValueOnce(
        reply(400, {
          error: {
            status: 'INVALID_ARGUMENT',
            message: 'Invalid JSON payload',
          },
        }),
      )
      .mockRejectedValueOnce(new TypeError('fetch failed'));
    const d = build([
      {
        id: 'd1',
        userId: 'u1',
        platformConceptId: platformIos,
        pushTokenEncrypted: seal('t1'),
      },
      {
        id: 'd2',
        userId: 'u1',
        platformConceptId: platformAndroid,
        pushTokenEncrypted: seal('t2'),
      },
    ]);
    await expect(
      d.service.pushToUser({
        recipientUserId: 'u1',
        notificationId: 'n1',
        route: '/x',
      }),
    ).resolves.toBeUndefined();
    expect(d.devices.every((x) => x.pushTokenEncrypted)).toBe(true);
    expect(d.logger.warn).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(d.logger.warn.mock.calls)).not.toContain('t1');
  });
});
