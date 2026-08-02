import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IamEmailVerificationService } from './iam-email-verification.service';

describe('IamEmailVerificationService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const tx = { flush: fn().mockResolvedValue(undefined) };
    const em = { transactional: fn((cb: (t: unknown) => unknown) => cb(tx)) };
    const tokenService = {
      issueRefreshToken: fn(() => ({ raw: 'raw-token', hash: 'hashed' })),
    };
    const credentialsRepo = {
      findActivePasswordBySubject: fn().mockResolvedValue({
        userId: 'user-1',
      }),
    };
    const usersRepo = {
      findById: fn().mockResolvedValue({ id: 'user-1', emailVerified: false }),
    };
    const emailVerificationsRepo = {
      create: fn(),
      findLatestByUser: fn().mockResolvedValue({ email: 'quien@example.test' }),
    };
    const notificationsService = {
      createRequest: fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const service = new IamEmailVerificationService(
      em as never,
      tokenService as never,
      credentialsRepo as never,
      usersRepo as never,
      emailVerificationsRepo as never,
      notificationsService as never,
      logger as never,
    );
    return {
      service,
      tx,
      credentialsRepo,
      usersRepo,
      emailVerificationsRepo,
      notificationsService,
    };
  }

  const MENSAJE =
    'Si el identificador corresponde a una cuenta con correo pendiente de verificar, enviamos un enlace nuevo.';

  it('emite un token nuevo y lo manda al correo declarado', async () => {
    const d = build();

    const res = await d.service.resend({ identifier: 'quien@example.test' });

    expect(res.message).toBe(MENSAJE);
    expect(d.emailVerificationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ userId: 'user-1', tokenHash: 'hashed' }),
    );
    expect(d.notificationsService.createRequest).toHaveBeenCalled();
  });

  it('resuelve el correo del alta cuando el identificador es un documento', async () => {
    const d = build();

    await d.service.resend({ identifier: 'CI-4821993' });

    // Quien entra con su cédula no tiene un correo por `externalSubject`: hay
    // que recuperar el que declaró, o el token no llega a ninguna parte.
    expect(d.emailVerificationsRepo.findLatestByUser).toHaveBeenCalled();
    expect(d.emailVerificationsRepo.create).toHaveBeenCalledWith(
      d.tx,
      expect.objectContaining({ email: 'quien@example.test' }),
    );
  });

  it.each([
    [
      'un identificador sin cuenta',
      (d: ReturnType<typeof build>) =>
        d.credentialsRepo.findActivePasswordBySubject.mockResolvedValue(null),
    ],
    [
      'una cuenta ya verificada',
      (d: ReturnType<typeof build>) =>
        d.usersRepo.findById.mockResolvedValue({
          id: 'user-1',
          emailVerified: true,
        }),
    ],
    [
      'una cuenta sin correo declarado',
      (d: ReturnType<typeof build>) =>
        d.emailVerificationsRepo.findLatestByUser.mockResolvedValue(null),
    ],
  ])('responde lo mismo ante %s, y no emite token', async (_caso, preparar) => {
    const d = build();
    preparar(d);

    const res = await d.service.resend({ identifier: 'CI-4821993' });

    // Tres respuestas distinguibles convertirían el formulario en un oráculo de
    // qué direcciones tienen cuenta en una plataforma de salud.
    expect(res.message).toBe(MENSAJE);
    expect(d.emailVerificationsRepo.create).not.toHaveBeenCalled();
    expect(d.notificationsService.createRequest).not.toHaveBeenCalled();
  });

  it('el token sigue emitido aunque el correo no se pueda encolar', async () => {
    const d = build();
    d.notificationsService.createRequest.mockRejectedValue(
      new Error('mensajería caída'),
    );

    const res = await d.service.resend({ identifier: 'quien@example.test' });

    expect(res.message).toBe(MENSAJE);
    expect(d.emailVerificationsRepo.create).toHaveBeenCalled();
  });
});
