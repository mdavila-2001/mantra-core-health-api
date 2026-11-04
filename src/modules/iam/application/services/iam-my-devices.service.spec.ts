import { jest } from '@jest/globals';
import { createHash } from 'node:crypto';
import {
  CONCEPTS,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../../common';
import { IamMyDevicesService, maskEmail } from './iam-my-devices.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const actor = { id: 'u1', roles: [], sessionId: 'sid-1' } as any;
const hashOf = (deviceId: string, code: string): string =>
  createHash('sha256').update(`device:${deviceId}:${code}`).digest('hex');

function build(
  device: any = {
    id: 'd1',
    userId: 'u1',
    name: 'Chrome en Windows',
    trusted: false,
  },
) {
  const tx = {};
  const em = { fork: () => tx, transactional: mockFn((fn: any) => fn(tx)) };
  const devicesRepo = {
    findById: mockFn(async (_: unknown, id: string) =>
      id === device.id ? device : null,
    ),
    findByUser: mockFn().mockResolvedValue([device]),
  };
  const sessionsRepo = {
    findActiveByUser: mockFn().mockResolvedValue([
      { tokenId: 'sid-1', deviceId: 'd1' },
    ]),
    findActiveByTokenId: mockFn().mockResolvedValue({ deviceId: 'd1' }),
  };
  const usersRepo = {
    findById: mockFn().mockResolvedValue({ emailVerified: true }),
  };
  const credentialsRepo = {
    findActivePasswordByUser: mockFn().mockResolvedValue({
      externalSubject: 'lucia@alovida.bo',
    }),
  };
  const verificationsRepo = {
    create: mockFn(),
    findByTokenHash: mockFn(),
    findLatestByUser: mockFn(),
  };
  const eventsRepo = { record: mockFn() };
  const emailNotice = { enqueueEmail: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn() };
  const service = new IamMyDevicesService(
    em as any,
    devicesRepo as any,
    sessionsRepo as any,
    usersRepo as any,
    credentialsRepo as any,
    verificationsRepo as any,
    eventsRepo as any,
    emailNotice,
    logger as any,
  );
  return {
    service,
    device,
    usersRepo,
    verificationsRepo,
    eventsRepo,
    emailNotice,
  };
}

describe('IamMyDevicesService', () => {
  it('lists own devices marking the current one and its open sessions', async () => {
    const { service } = build();
    const [row] = await service.list(actor);
    expect(row).toMatchObject({
      id: 'd1',
      name: 'Chrome en Windows',
      trusted: false,
      current: true,
      activeSessions: 1,
    });
  });

  it('mails an 8-digit code bound to the device and masks the address', async () => {
    const d = build();
    await expect(d.service.requestCode(actor, 'd1')).resolves.toEqual({
      sent: true,
      sentTo: 'l***@alovida.bo',
    });
    const created = d.verificationsRepo.create.mock.calls[0][1];
    const mail = d.emailNotice.enqueueEmail.mock.calls[0][0];
    const code = /Código: (\d{8})/.exec(mail.bodyText)?.[1] ?? '';
    expect(code).toHaveLength(8);
    expect(created).toMatchObject({
      userId: 'u1',
      email: 'lucia@alovida.bo',
      tokenHash: hashOf('d1', code),
    });
    expect(mail.recipientAddress).toBe('lucia@alovida.bo');
  });

  it('refuses to send a code without a verified email', async () => {
    const d = build();
    d.usersRepo.findById.mockResolvedValue({ emailVerified: false });
    await expect(d.service.requestCode(actor, 'd1')).rejects.toBeInstanceOf(
      PreconditionFailedException,
    );
    expect(d.emailNotice.enqueueEmail).not.toHaveBeenCalled();
  });

  it('does not send anything for an already trusted device', async () => {
    const d = build({ id: 'd1', userId: 'u1', trusted: true });
    await expect(d.service.requestCode(actor, 'd1')).resolves.toEqual({
      sent: false,
    });
  });

  it('404s on a device of another account', async () => {
    const d = build({ id: 'd1', userId: 'other', trusted: false });
    await expect(d.service.requestCode(actor, 'd1')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
  });

  it('trusts the device with a valid code and consumes it', async () => {
    const d = build();
    const pending: any = {
      userId: 'u1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      expiresAt: new Date(Date.now() + 60_000),
    };
    d.verificationsRepo.findByTokenHash.mockImplementation(
      async (_: unknown, hash: string) =>
        hash === hashOf('d1', '12345678') ? pending : null,
    );
    await expect(d.service.confirm(actor, 'd1', '12345678')).resolves.toEqual({
      confirmed: true,
      deviceId: 'd1',
    });
    expect(d.device.trusted).toBe(true);
    expect(pending.consumedAt).toBeInstanceOf(Date);
    expect(d.eventsRepo.record.mock.calls[0][1]).toMatchObject({
      eventTypeConceptId: CONCEPTS.SEC_DEVICE_TRUST,
    });
  });

  it('rejects a wrong, expired or used code', async () => {
    const d = build();
    d.verificationsRepo.findByTokenHash.mockResolvedValue({
      userId: 'u1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
      expiresAt: new Date(Date.now() - 1),
    });
    await expect(
      d.service.confirm(actor, 'd1', '00000000'),
    ).rejects.toMatchObject({
      details: expect.objectContaining({
        reason: 'DEVICE_CONFIRM_CODE_INVALID',
      }),
    });
    expect(d.device.trusted).toBe(false);
  });

  it('asks for the code when confirming from the device itself', async () => {
    const d = build();
    await expect(d.service.confirm(actor, 'd1')).rejects.toMatchObject({
      details: expect.objectContaining({
        reason: 'DEVICE_CONFIRM_CODE_REQUIRED',
      }),
    });
  });

  it('masks addresses', () => {
    expect(maskEmail('juan.perez@correo.com')).toBe('j***@correo.com');
  });
});
