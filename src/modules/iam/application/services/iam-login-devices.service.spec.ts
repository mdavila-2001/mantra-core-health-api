import { jest } from '@jest/globals';
import { CONCEPTS } from '../../../../common';
import {
  describeUserAgent,
  IamLoginDevicesService,
} from './iam-login-devices.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const CHROME_WIN =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

function build(known: any = null) {
  const tx = { flush: mockFn() };
  const devicesRepo = {
    findByFingerprint: mockFn().mockResolvedValue(known),
    create: mockFn((_: unknown, data: any) => ({ id: 'new-device', ...data })),
  };
  return {
    tx,
    devicesRepo,
    service: new IamLoginDevicesService(devicesRepo as any),
  };
}

describe('IamLoginDevicesService', () => {
  it('registers an unknown device, untrusted, with an account-scoped fingerprint', async () => {
    const d = build();
    const id = await d.service.link(d.tx as any, 'u1', {
      'x-device-id': 'browser-key-123',
      'user-agent': CHROME_WIN,
    });
    expect(id).toBe('new-device');
    const data = d.devicesRepo.create.mock.calls[0][1];
    expect(data).toMatchObject({
      userId: 'u1',
      name: 'Chrome en Windows',
      platformConceptId: CONCEPTS.PLATFORM_WEB,
    });
    expect(data.trusted).toBeUndefined();
    expect(data.deviceFingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(d.tx.flush).toHaveBeenCalled();
  });

  it('gives the same browser key a different fingerprint per account', async () => {
    const a = build();
    const b = build();
    await a.service.link(a.tx as any, 'u1', {
      'x-device-id': 'browser-key-123',
    });
    await b.service.link(b.tx as any, 'u2', {
      'x-device-id': 'browser-key-123',
    });
    expect(a.devicesRepo.create.mock.calls[0][1].deviceFingerprint).not.toBe(
      b.devicesRepo.create.mock.calls[0][1].deviceFingerprint,
    );
  });

  it('reuses a known device and stamps last_seen_at', async () => {
    const known: any = { id: 'd1', trusted: true };
    const d = build(known);
    await expect(
      d.service.link(d.tx as any, 'u1', { 'x-device-id': 'browser-key-123' }),
    ).resolves.toBe('d1');
    expect(known.lastSeenAt).toBeInstanceOf(Date);
    expect(known.trusted).toBe(true);
    expect(d.devicesRepo.create).not.toHaveBeenCalled();
  });

  it('names devices from the user agent', () => {
    expect(describeUserAgent(CHROME_WIN).name).toBe('Chrome en Windows');
    expect(
      describeUserAgent(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Version/17 Mobile Safari/604.1',
      ),
    ).toMatchObject({
      name: 'Safari en iOS',
      platformConceptId: CONCEPTS.PLATFORM_IOS,
    });
    expect(describeUserAgent('').name).toBe('Dispositivo desconocido');
  });
});
