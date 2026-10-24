import { jest } from '@jest/globals';

const sendNotification = jest.fn<(...args: any[]) => Promise<unknown>>();
jest.unstable_mockModule('web-push', () => ({
  default: { sendNotification },
}));

const { WebPushService, isAllowedPushEndpoint } =
  await import('./web-push.service');
const { decryptSecret } = await import('../../../common/crypto/secret-cipher');

const ENDPOINT = 'https://fcm.googleapis.com/fcm/send/abc123';
const KEYS = { p256dh: 'p'.repeat(30), auth: 'a'.repeat(12) };

function vapidOn(): void {
  process.env['VAPID_PUBLIC_KEY'] = 'public-key';
  process.env['VAPID_PRIVATE_KEY'] = 'private-key';
  process.env['VAPID_SUBJECT'] = 'mailto:soporte@alovida.test';
}
function vapidOff(): void {
  delete process.env['VAPID_PUBLIC_KEY'];
  delete process.env['VAPID_PRIVATE_KEY'];
  delete process.env['VAPID_SUBJECT'];
}

function build(devices: any[] = []) {
  const created: any[] = [];
  const tx: any = {
    findOne: jest.fn(async (_e: unknown, where: any) =>
      devices.find(
        (d) =>
          (where.id === undefined || d.id === where.id) &&
          (where.userId === undefined || d.userId === where.userId) &&
          (where.deviceFingerprint === undefined ||
            d.deviceFingerprint === where.deviceFingerprint),
      ),
    ),
    create: jest.fn((_e: unknown, data: any) => {
      created.push(data);
      devices.push({ id: `d${devices.length + 1}`, ...data });
    }),
    find: jest.fn(async () => devices.filter((d) => d.pushTokenEncrypted)),
  };
  const em: any = {
    transactional: (cb: any) => cb(tx),
    fork: () => tx,
  };
  const logger: any = { setContext: jest.fn(), warn: jest.fn() };
  return { service: new WebPushService(em, logger), devices, created, logger };
}

describe('isAllowedPushEndpoint', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/x',
    'https://updates.push.services.mozilla.com/wpush/v2/x',
    'https://wns2-par02p.notify.windows.com/w/?token=x',
    'https://web.push.apple.com/x',
  ])('acepta %s', (url) => expect(isAllowedPushEndpoint(url)).toBe(true));

  it.each([
    'http://fcm.googleapis.com/x',
    'https://evil.example.com/x',
    'https://fcm.googleapis.com.evil.com/x',
    'https://user:pass@fcm.googleapis.com/x',
    'https://127.0.0.1/x',
    'no es una url',
  ])('rechaza %s', (url) => expect(isAllowedPushEndpoint(url)).toBe(false));
});

describe('WebPushService', () => {
  afterEach(() => {
    vapidOff();
    sendNotification.mockReset();
  });

  it('sin claves VAPID queda desactivado y no envía nada', async () => {
    vapidOff();
    const { service } = build();
    expect(service.publicKey()).toBeNull();
    await service.pushToUser({ recipientUserId: 'u1', subject: 'Hola' });
    expect(sendNotification).not.toHaveBeenCalled();
    await expect(
      service.subscribe('u1', { endpoint: ENDPOINT, keys: KEYS }),
    ).rejects.toThrow();
  });

  it('guarda la suscripción cifrada y la refresca sin duplicar', async () => {
    vapidOn();
    const { service, devices, created } = build();
    await service.subscribe('u1', { endpoint: ENDPOINT, keys: KEYS });
    await service.subscribe('u1', { endpoint: ENDPOINT, keys: KEYS });

    expect(created).toHaveLength(1);
    expect(devices).toHaveLength(1);
    const token = devices[0].pushTokenEncrypted as string;
    expect(token).not.toContain('fcm.googleapis.com');
    expect(JSON.parse(decryptSecret(token)).endpoint).toBe(ENDPOINT);
  });

  it('envía el push con título fijo, sin datos de la persona', async () => {
    vapidOn();
    const { service } = build();
    await service.subscribe('u1', { endpoint: ENDPOINT, keys: KEYS });
    sendNotification.mockResolvedValue({});

    await service.pushToUser({
      recipientUserId: 'u1',
      subject: 'Su cita fue cancelada',
      route: '/appointments',
    });

    expect(sendNotification).toHaveBeenCalledTimes(1);
    const body = JSON.parse(sendNotification.mock.calls[0][1] as string);
    expect(body.title).toBe('AloVida');
    expect(body.body).toBe('Su cita fue cancelada');
    expect(body.route).toBe('/appointments');
  });

  it('borra la suscripción cuando el navegador ya no existe (410)', async () => {
    vapidOn();
    const { service, devices } = build();
    await service.subscribe('u1', { endpoint: ENDPOINT, keys: KEYS });
    sendNotification.mockRejectedValue(
      Object.assign(new Error('gone'), { statusCode: 410 }),
    );

    await service.pushToUser({ recipientUserId: 'u1', subject: 'x' });

    expect(devices[0].pushTokenEncrypted).toBeUndefined();
  });

  it('un fallo del servicio de push no lanza hacia arriba y no borra el token', async () => {
    vapidOn();
    const { service, devices, logger } = build();
    await service.subscribe('u1', { endpoint: ENDPOINT, keys: KEYS });
    sendNotification.mockRejectedValue(
      Object.assign(new Error('boom'), { statusCode: 500 }),
    );

    await expect(
      service.pushToUser({ recipientUserId: 'u1', subject: 'x' }),
    ).resolves.toBeUndefined();
    expect(devices[0].pushTokenEncrypted).toBeDefined();
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain(ENDPOINT);
  });

  it('unsubscribe quita el token de ese navegador y es idempotente', async () => {
    vapidOn();
    const { service, devices } = build();
    await service.subscribe('u1', { endpoint: ENDPOINT, keys: KEYS });
    await service.unsubscribe('u1', ENDPOINT);
    await service.unsubscribe('u1', ENDPOINT);
    await service.unsubscribe('otra-cuenta', ENDPOINT);
    expect(devices[0].pushTokenEncrypted).toBeUndefined();
  });
});
