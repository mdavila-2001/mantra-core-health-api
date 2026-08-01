import { describe, it, expect, jest } from '@jest/globals';
import * as argon2 from 'argon2';
import { IamPasswordResetService } from './iam-password-reset.service';
import { CONCEPTS, UnauthorizedException } from '../../../common';

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 *
 * @returns Servicio y dobles observables.
 */
function build() {
  const tx = { flush: (jest.fn as any)(() => Promise.resolve()) };
  const em = {
    transactional: (jest.fn as any)((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as any;
  const usersRepo = { findById: (jest.fn as any)() } as any;
  const credentialsRepo = {
    findActivePasswordBySubject: (jest.fn as any)(),
  } as any;
  const emailVerificationsRepo = {
    findLatestByUser: (jest.fn as any)(() => Promise.resolve(null)),
  } as any;
  const resetsRepo = {
    create: (jest.fn as any)(),
    findByTokenHash: (jest.fn as any)(),
    revokeActiveForUser: (jest.fn as any)(() => Promise.resolve(0)),
  } as any;
  const sessionsRepo = {
    activeSessionIdsForUser: (jest.fn as any)(() => Promise.resolve(['s-1'])),
    revokeAllActiveForUser: (jest.fn as any)(() => Promise.resolve(1)),
  } as any;
  const refreshRepo = {
    revokeActiveBySessionIds: (jest.fn as any)(() => Promise.resolve(1)),
  } as any;
  const eventsRepo = { record: (jest.fn as any)() } as any;
  const tokenService = {
    issueRefreshToken: (jest.fn as any)(() => ({
      raw: 'token-en-claro',
      hash: 'hash-del-token',
    })),
    hashRefreshToken: (jest.fn as any)((raw: string) => `hash:${raw}`),
  } as any;
  const notificationsService = {
    createRequest: (jest.fn as any)(() => Promise.resolve({})),
  } as any;
  const logger = {
    setContext: (jest.fn as any)(),
    info: (jest.fn as any)(),
    warn: (jest.fn as any)(),
  } as any;

  const service = new IamPasswordResetService(
    em,
    usersRepo,
    credentialsRepo,
    resetsRepo,
    emailVerificationsRepo,
    sessionsRepo,
    refreshRepo,
    eventsRepo,
    tokenService,
    notificationsService,
    logger,
  );
  return {
    service,
    usersRepo,
    credentialsRepo,
    resetsRepo,
    emailVerificationsRepo,
    sessionsRepo,
    refreshRepo,
    eventsRepo,
    tokenService,
    notificationsService,
    logger,
  };
}

/** Solicitud viva y vigente, lista para consumirse. */
const liveReset = () => ({
  userId: 'u-1',
  externalSubject: 'alguien@redesa.test',
  stateConceptId: CONCEPTS.STATE_ACTIVE,
  expiresAt: new Date(Date.now() + 60_000),
  consumedAt: undefined as Date | undefined,
});

describe('IamPasswordResetService · requestReset', () => {
  const dto = { identifier: 'alguien@redesa.test' };

  it('emite el token y encola el correo cuando la cuenta existe', async () => {
    const d = build();
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });
    d.usersRepo.findById.mockResolvedValue({ id: 'u-1' });

    const result = await d.service.requestReset(dto, '1.2.3.4');

    expect(d.resetsRepo.create).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        userId: 'u-1',
        tokenHash: 'hash-del-token',
        requestedIp: '1.2.3.4',
      }),
    );
    expect(d.notificationsService.createRequest).toHaveBeenCalled();
    expect(result.message).toContain('Si el identificador');
  });

  it('el token en claro no se persiste: sólo viaja en el correo', async () => {
    const d = build();
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });
    d.usersRepo.findById.mockResolvedValue({ id: 'u-1' });

    await d.service.requestReset(dto);

    const persisted = d.resetsRepo.create.mock.calls[0][1];
    expect(JSON.stringify(persisted)).not.toContain('token-en-claro');
    const emailed = JSON.stringify(
      d.notificationsService.createRequest.mock.calls[0][0],
    );
    expect(emailed).toContain('token-en-claro');
  });

  it('responde IDÉNTICO cuando la cuenta no existe: no enumera cuentas', async () => {
    const d = build();
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue(null);
    const conCuenta = build();
    conCuenta.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });
    conCuenta.usersRepo.findById.mockResolvedValue({ id: 'u-1' });

    const sinCuenta = await d.service.requestReset(dto);
    const existente = await conCuenta.service.requestReset(dto);

    expect(sinCuenta).toEqual(existente);
    expect(d.resetsRepo.create).not.toHaveBeenCalled();
    expect(d.notificationsService.createRequest).not.toHaveBeenCalled();
  });

  it('pedir un enlace nuevo invalida los anteriores', async () => {
    const d = build();
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });
    d.usersRepo.findById.mockResolvedValue({ id: 'u-1' });

    await d.service.requestReset(dto);

    expect(d.resetsRepo.revokeActiveForUser).toHaveBeenCalledWith(
      expect.anything(),
      'u-1',
    );
  });

  it('quien entra con documento recibe el correo en la dirección que declaró', async () => {
    const d = build();
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });
    d.usersRepo.findById.mockResolvedValue({ id: 'u-1' });
    d.emailVerificationsRepo.findLatestByUser.mockResolvedValue({
      email: 'declarado@redesa.test',
    });

    await d.service.requestReset({ identifier: '12345678' });

    expect(d.notificationsService.createRequest).toHaveBeenCalledWith(
      expect.objectContaining({ recipientAddress: 'declarado@redesa.test' }),
      expect.anything(),
    );
  });

  it('sin correo declarado no emite token: nadie podría recibirlo', async () => {
    const d = build();
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });
    d.usersRepo.findById.mockResolvedValue({ id: 'u-1' });
    d.emailVerificationsRepo.findLatestByUser.mockResolvedValue(null);

    const result = await d.service.requestReset({ identifier: '12345678' });

    expect(d.resetsRepo.create).not.toHaveBeenCalled();
    // La respuesta sigue siendo la misma: tampoco esto puede delatar la cuenta.
    expect(result.message).toContain('Si el identificador');
  });

  it('un fallo del correo no delata la existencia de la cuenta', async () => {
    const d = build();
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });
    d.usersRepo.findById.mockResolvedValue({ id: 'u-1' });
    d.notificationsService.createRequest.mockRejectedValue(new Error('smtp'));

    const result = await d.service.requestReset(dto);

    expect(result.message).toContain('Si el identificador');
    expect(d.logger.warn).toHaveBeenCalled();
  });
});

describe('IamPasswordResetService · resetPassword', () => {
  const dto = { token: 'raw', newPassword: 'clave-nueva-123' };

  it('reescribe la credencial con argon2id y consume la solicitud', async () => {
    const d = build();
    const reset = liveReset();
    const credential: any = { userId: 'u-1', secretHash: 'viejo' };
    d.resetsRepo.findByTokenHash.mockResolvedValue(reset);
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue(credential);

    const result = await d.service.resetPassword(dto, '1.2.3.4');

    expect(credential.secretHash).not.toBe('viejo');
    await expect(
      argon2.verify(credential.secretHash, dto.newPassword),
    ).resolves.toBe(true);
    expect(credential.hashAlgorithmConceptId).toBe(CONCEPTS.HASH_ARGON2ID);
    expect(reset.stateConceptId).toBe(CONCEPTS.STATE_VERIFIED);
    expect(reset.consumedAt).toBeInstanceOf(Date);
    expect(result).toEqual({ userId: 'u-1', revokedSessions: 1 });
  });

  it('cierra todas las sesiones y sus refresh tokens', async () => {
    const d = build();
    d.resetsRepo.findByTokenHash.mockResolvedValue(liveReset());
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'u-1',
    });

    await d.service.resetPassword(dto);

    expect(d.sessionsRepo.revokeAllActiveForUser).toHaveBeenCalledWith(
      expect.anything(),
      'u-1',
    );
    expect(d.refreshRepo.revokeActiveBySessionIds).toHaveBeenCalledWith(
      expect.anything(),
      ['s-1'],
    );
  });

  it('rechaza un token inexistente', async () => {
    const d = build();
    d.resetsRepo.findByTokenHash.mockResolvedValue(null);

    await expect(d.service.resetPassword(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza reutilizar un token ya consumido', async () => {
    const d = build();
    d.resetsRepo.findByTokenHash.mockResolvedValue({
      ...liveReset(),
      stateConceptId: CONCEPTS.STATE_VERIFIED,
    });

    await expect(d.service.resetPassword(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('marca el token vencido como expirado y recién después lanza', async () => {
    const d = build();
    const reset = { ...liveReset(), expiresAt: new Date(Date.now() - 1) };
    d.resetsRepo.findByTokenHash.mockResolvedValue(reset);

    await expect(d.service.resetPassword(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    // El throw fuera de la transacción es lo que deja asentada la expiración.
    expect(reset.stateConceptId).toBe(CONCEPTS.STATE_EXPIRED);
  });

  it('rechaza el token si la credencial se revocó entre la solicitud y el consumo', async () => {
    const d = build();
    d.resetsRepo.findByTokenHash.mockResolvedValue(liveReset());
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue(null);

    await expect(d.service.resetPassword(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rechaza un token cuyo sujeto apunta a otro usuario', async () => {
    const d = build();
    d.resetsRepo.findByTokenHash.mockResolvedValue(liveReset());
    d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue({
      userId: 'otro',
    });

    await expect(d.service.resetPassword(dto)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
