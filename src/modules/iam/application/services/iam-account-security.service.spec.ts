import { jest } from '@jest/globals';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  ResourceNotFoundException,
  loadAuthEnv,
} from '../../../../common';
import { deviceConfirmationCode } from '../../domain/device-confirmation-code';
import { IamAccountSecurityService } from './iam-account-security.service';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** Construye el servicio con dobles; la transacción ejecuta el callback tal cual. */
async function build() {
  const tx = {};
  const em = {
    fork: () => tx,
    transactional: mockFn((fn: (t: unknown) => unknown) => fn(tx)),
  };
  const credential: any = {
    secretHash: await argon2.hash('ClaveVieja1'),
    hashAlgorithmConceptId: 'x',
  };
  const credentialsRepo = {
    findActivePasswordByUser: mockFn().mockResolvedValue(credential),
  };
  const sessionsRepo = {
    findActiveByUser: mockFn().mockResolvedValue([
      {
        id: 's-actual',
        tokenId: 'sid-actual',
        createdAt: new Date(),
        expiresAt: new Date(),
        ip: '1.1.1.1',
      },
      {
        id: 's-otra',
        tokenId: 'sid-otra',
        createdAt: new Date(),
        expiresAt: new Date(),
      },
    ]),
    revokeByIds: mockFn().mockResolvedValue(1),
    findById: mockFn(),
    revokeById: mockFn().mockResolvedValue(1),
    findActiveByTokenId: mockFn((_tx: unknown, tokenId: string) =>
      Promise.resolve(
        tokenId === 'sid-actual'
          ? {
              id: 's-actual',
              userId: 'u1',
              tokenId,
              deviceId: sessionDevice.current,
            }
          : null,
      ),
    ),
  };
  // Dispositivo desde el que se abrió la sesión actual (por prueba).
  const sessionDevice: { current?: string } = {};
  const refreshRepo = {
    revokeActiveBySessionIds: mockFn().mockResolvedValue(1),
    revokeBySessionId: mockFn().mockResolvedValue(1),
  };
  const eventsRepo = {
    record: mockFn(),
    deviceCodeUsed: mockFn().mockResolvedValue(false),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const device: any = {
    id: 'd1',
    userId: 'u1',
    trusted: false,
    name: 'Chrome en Windows',
  };
  const trustedDevice: any = { id: 'd-trusted', userId: 'u1', trusted: true };
  const devicesRepo = {
    findByIdAndUser: mockFn((_tx: unknown, id: string, userId: string) =>
      Promise.resolve(
        [device, trustedDevice].find(
          (dev) => dev.id === id && dev.userId === userId,
        ) ?? null,
      ),
    ),
  };
  const emailRepo = {
    findLatestVerifiedByUser: mockFn().mockResolvedValue({
      email: 'ana.perez@clinica.bo',
    }),
  };
  const notices = { enqueueEmail: mockFn().mockResolvedValue(undefined) };
  const service = new IamAccountSecurityService(
    em as any,
    credentialsRepo as any,
    sessionsRepo as any,
    refreshRepo as any,
    eventsRepo as any,
    logger as any,
    devicesRepo as any,
    emailRepo as any,
    notices as any,
  );
  return {
    emailRepo,
    notices,
    sessionDevice,
    trustedDevice,
    service,
    credential,
    sessionsRepo,
    refreshRepo,
    eventsRepo,
    devicesRepo,
    device,
  };
}

const actor = { id: 'u1', roles: [], sessionId: 'sid-actual' } as any;

describe('IamAccountSecurityService (ID-24)', () => {
  it('cambia la contraseña y revoca sólo las otras sesiones', async () => {
    const d = await build();
    const result = await d.service.changePassword(actor, {
      currentPassword: 'ClaveVieja1',
      newPassword: 'ClaveNueva99',
    });
    expect(result).toEqual({ revokedSessions: 1 });
    expect(await argon2.verify(d.credential.secretHash, 'ClaveNueva99')).toBe(
      true,
    );
    expect(d.sessionsRepo.revokeByIds).toHaveBeenCalledWith(expect.anything(), [
      's-otra',
    ]);
    expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
      expect.anything(),
      ['s-otra'],
    );
    expect(d.eventsRepo.record).toHaveBeenCalledTimes(1);
  });

  it('con la actual incorrecta responde 422 CURRENT_PASSWORD_INVALID y no toca nada', async () => {
    const d = await build();
    const before = d.credential.secretHash;
    await expect(
      d.service.changePassword(actor, {
        currentPassword: 'mala',
        newPassword: 'ClaveNueva99',
      }),
    ).rejects.toMatchObject({
      details: { reason: 'CURRENT_PASSWORD_INVALID' },
    });
    expect(d.credential.secretHash).toBe(before);
    expect(d.sessionsRepo.revokeByIds).not.toHaveBeenCalled();
  });

  it('rechaza una contraseña nueva igual a la actual', async () => {
    const d = await build();
    await expect(
      d.service.changePassword(actor, {
        currentPassword: 'ClaveVieja1',
        newPassword: 'ClaveVieja1',
      }),
    ).rejects.toMatchObject({ details: { reason: 'PASSWORD_UNCHANGED' } });
  });

  it('lista las sesiones marcando la actual', async () => {
    const d = await build();
    const list = await d.service.listSessions(actor);
    expect(list.map((s) => [s.id, s.current])).toEqual([
      ['s-actual', true],
      ['s-otra', false],
    ]);
  });

  it('revocar una sesión ajena es 404, no 403', async () => {
    const d = await build();
    d.sessionsRepo.findById.mockResolvedValue({
      id: 'x',
      userId: 'otro',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    await expect(d.service.revokeSession(actor, 'x')).rejects.toBeInstanceOf(
      ResourceNotFoundException,
    );
    expect(d.sessionsRepo.revokeById).not.toHaveBeenCalled();
  });

  it('revoca la sesión propia y su refresh token', async () => {
    const d = await build();
    d.sessionsRepo.findById.mockResolvedValue({
      id: 's-otra',
      userId: 'u1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    await expect(d.service.revokeSession(actor, 's-otra')).resolves.toEqual({
      revoked: true,
    });
    expect(d.refreshRepo.revokeBySessionId).toHaveBeenCalledWith(
      expect.anything(),
      's-otra',
    );
  });

  it('al cerrar una sesión propia borra el sello de paso extra de su token', async () => {
    const d = await build();
    const stepUp = { clear: mockFn().mockResolvedValue(undefined) };
    (d.service as any).stepUp = stepUp;
    d.sessionsRepo.findById.mockResolvedValue({
      id: 's-otra',
      tokenId: 'sid-otra',
      userId: 'u1',
      stateConceptId: CONCEPTS.STATE_ACTIVE,
    });
    await d.service.revokeSession(actor, 's-otra');
    expect(stepUp.clear).toHaveBeenCalledWith('sid-otra');
  });

  describe('dispositivo nuevo: «Fui yo» y «No fui yo»', () => {
    const SECRET = loadAuthEnv().secret;

    it('N7: «Fui yo» desde el PROPIO dispositivo sin código no confirma nada: 422 DEVICE_CONFIRM_CODE_REQUIRED', async () => {
      const d = await build();
      d.sessionDevice.current = 'd1';
      await expect(
        d.service.confirmDevice(actor, 'd1', '1.1.1.1'),
      ).rejects.toMatchObject({
        status: 422,
        reason: 'DEVICE_CONFIRM_CODE_REQUIRED',
        details: { canRequestCode: true },
      });
      expect(d.device.trusted).toBe(false);
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    it('N7: tampoco confirma una sesión abierta desde un dispositivo que NO es de confianza', async () => {
      const d = await build();
      d.trustedDevice.trusted = false;
      d.sessionDevice.current = 'd-trusted';
      await expect(
        d.service.confirmDevice(actor, 'd1', '1.1.1.1'),
      ).rejects.toMatchObject({ reason: 'DEVICE_CONFIRM_CODE_REQUIRED' });
      expect(d.device.trusted).toBe(false);
    });

    it('N7: «Fui yo» desde una sesión abierta en OTRO dispositivo de confianza deja el dispositivo de confianza y registra el evento', async () => {
      const d = await build();
      d.sessionDevice.current = 'd-trusted';
      const res = await d.service.confirmDevice(actor, 'd1', '1.1.1.1');
      expect(res).toEqual({ confirmed: true, deviceId: 'd1' });
      expect(d.device.trusted).toBe(true);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_DEVICE_TRUST,
          userId: 'u1',
          detailJson: { flow: 'confirmed-by-trusted-device', deviceId: 'd1' },
        }),
      );
    });

    it('N7: con el código de un solo uso enviado al correo confirma, y deja la huella del código (no el código)', async () => {
      const d = await build();
      d.sessionDevice.current = 'd1';
      const code = deviceConfirmationCode(SECRET, 'u1', 'd1', new Date());
      const res = await d.service.confirmDevice(actor, 'd1', '1.1.1.1', code);
      expect(res.confirmed).toBe(true);
      expect(d.device.trusted).toBe(true);
      const [, event] = d.eventsRepo.record.mock.calls[0];
      expect(event.detailJson).toMatchObject({
        flow: 'confirmed-by-email-code',
        deviceId: 'd1',
        codeDigest: expect.stringMatching(/^[0-9a-f]{64}$/),
      });
      expect(JSON.stringify(event.detailJson)).not.toContain(code);
    });

    it('N7: un código equivocado, de otro dispositivo o ya usado es 422 DEVICE_CONFIRM_CODE_INVALID', async () => {
      const d = await build();
      d.sessionDevice.current = 'd1';
      await expect(
        d.service.confirmDevice(actor, 'd1', '1.1.1.1', '00000000'),
      ).rejects.toMatchObject({ reason: 'DEVICE_CONFIRM_CODE_INVALID' });
      const other = deviceConfirmationCode(SECRET, 'u1', 'd-otro', new Date());
      await expect(
        d.service.confirmDevice(actor, 'd1', '1.1.1.1', other),
      ).rejects.toMatchObject({ reason: 'DEVICE_CONFIRM_CODE_INVALID' });
      // Un código válido pero ya gastado.
      const code = deviceConfirmationCode(SECRET, 'u1', 'd1', new Date());
      d.eventsRepo.deviceCodeUsed.mockResolvedValue(true);
      await expect(
        d.service.confirmDevice(actor, 'd1', '1.1.1.1', code),
      ).rejects.toMatchObject({ reason: 'DEVICE_CONFIRM_CODE_INVALID' });
      expect(d.device.trusted).toBe(false);
    });

    it('«Fui yo» es idempotente: confirmar otra vez no repite el evento', async () => {
      const d = await build();
      d.device.trusted = true;
      await expect(d.service.confirmDevice(actor, 'd1')).resolves.toEqual({
        confirmed: true,
        deviceId: 'd1',
      });
      expect(d.eventsRepo.record).not.toHaveBeenCalled();
    });

    describe('N7: pedir el código de un solo uso', () => {
      it('lo manda al correo VERIFICADO de la cuenta y responde la dirección enmascarada', async () => {
        const d = await build();
        const res = await d.service.requestDeviceCode(actor, 'd1');
        expect(res).toEqual({ sent: true, sentTo: 'a***@c***.bo' });
        const [mail] = d.notices.enqueueEmail.mock.calls[0];
        expect(mail.recipientAddress).toBe('ana.perez@clinica.bo');
        const code = /: (\d{8})\n/.exec(mail.bodyText)?.[1] as string;
        expect(code).toMatch(/^\d{8}$/);
        // Y ese código es el que confirma.
        d.sessionDevice.current = 'd1';
        await expect(
          d.service.confirmDevice(actor, 'd1', '1.1.1.1', code),
        ).resolves.toMatchObject({ confirmed: true });
      });

      it('sin correo verificado no hay canal: 422 DEVICE_CONFIRM_NO_VERIFIED_EMAIL y no se envía nada', async () => {
        const d = await build();
        d.emailRepo.findLatestVerifiedByUser.mockResolvedValue(null);
        await expect(
          d.service.requestDeviceCode(actor, 'd1'),
        ).rejects.toMatchObject({
          status: 422,
          reason: 'DEVICE_CONFIRM_NO_VERIFIED_EMAIL',
        });
        expect(d.notices.enqueueEmail).not.toHaveBeenCalled();
      });

      it('un dispositivo que ya es de confianza no manda nada; uno ajeno es 404', async () => {
        const d = await build();
        d.device.trusted = true;
        await expect(d.service.requestDeviceCode(actor, 'd1')).resolves.toEqual(
          {
            sent: false,
          },
        );
        expect(d.notices.enqueueEmail).not.toHaveBeenCalled();
        d.device.userId = 'otra-persona';
        await expect(
          d.service.requestDeviceCode(actor, 'd1'),
        ).rejects.toBeInstanceOf(ResourceNotFoundException);
      });
    });

    it('el dispositivo de otra persona responde igual que uno inexistente (404)', async () => {
      const d = await build();
      d.device.userId = 'otra-persona';
      await expect(d.service.confirmDevice(actor, 'd1')).rejects.toBeInstanceOf(
        ResourceNotFoundException,
      );
      await expect(
        d.service.confirmDevice(actor, 'no-existe'),
      ).rejects.toMatchObject({
        reason: 'DEVICE_NOT_FOUND',
      });
      expect(d.device.trusted).toBe(false);
      await expect(
        d.service.reportDeviceNotMe(actor, 'd1'),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.sessionsRepo.revokeByIds).not.toHaveBeenCalled();
    });

    it('«No fui yo» cierra las demás sesiones y sus refresh tokens, conserva la actual y deja el registro', async () => {
      const d = await build();
      d.device.trusted = true;
      const res = await d.service.reportDeviceNotMe(actor, 'd1', '203.0.113.9');
      expect(res).toEqual({ revokedSessions: 1, deviceId: 'd1' });
      expect(d.device.trusted).toBe(false);
      expect(d.sessionsRepo.revokeByIds).toHaveBeenCalledWith(
        expect.anything(),
        ['s-otra'],
      );
      expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
        expect.anything(),
        ['s-otra'],
      );
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_LOGOUT_ALL,
          outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
          userId: 'u1',
          recordedByUserId: 'u1',
          ip: '203.0.113.9',
          detailJson: {
            flow: 'device-not-me',
            deviceId: 'd1',
            revokedSessions: 1,
          },
        }),
      );
    });
  });
});
