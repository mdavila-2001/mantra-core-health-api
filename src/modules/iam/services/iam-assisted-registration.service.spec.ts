import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { UnauthorizedException } from '@nestjs/common';
import { IamAssistedRegistrationService } from './iam-assisted-registration.service';
import { CONCEPTS, ConflictException } from '../../../common';

const actor = { id: 'clinician-1', roles: ['CLINICIAN'] };

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => ({})),
  };
  const tokenService = {
    // El token de activación se emite igual que un refresh: alta entropía + hash.
    issueRefreshToken: mockFn(() => ({ raw: 'ACT-RAW', hash: 'ACT-HASH' })),
    hashRefreshToken: mockFn((raw: string) => `h:${raw}`),
  };
  const usersRepo = { create: mockFn(), findById: mockFn() };
  const credentialsRepo = {
    findLivePasswordBySubject: mockFn(),
    createPendingPassword: mockFn(),
    findPendingPasswordByUser: mockFn(),
  };
  const rolesRepo = { create: mockFn() };
  const activationsRepo = { create: mockFn(), findByTokenHash: mockFn() };
  const eventsRepo = { record: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new IamAssistedRegistrationService(
    em as any,
    tokenService as any,
    usersRepo as any,
    credentialsRepo as any,
    rolesRepo as any,
    activationsRepo as any,
    eventsRepo as any,
    logger as any,
  );
  return {
    service,
    tx,
    em,
    tokenService,
    usersRepo,
    credentialsRepo,
    rolesRepo,
    activationsRepo,
    eventsRepo,
  };
}

describe('IamAssistedRegistrationService', () => {
  describe('assistedRegistration (C-18)', () => {
    it('creates a pending account, returns a one-time token and NEVER a password', async () => {
      const d = build();
      d.credentialsRepo.findLivePasswordBySubject.mockResolvedValue(null);
      d.usersRepo.create.mockReturnValue({ id: 'u1' });

      const res = await d.service.assistedRegistration(
        {
          displayName: 'Paciente Uno',
          email: 'paciente@x.io',
          reason: 'paciente sin acceso digital',
        },
        actor as any,
      );

      // La respuesta entrega el token en claro, nunca una contraseña.
      expect(res.activationToken).toBe('ACT-RAW');
      expect(res.status).toBe('PENDING_ACTIVATION');
      expect((res as any).password).toBeUndefined();

      // La cuenta nace pendiente y con cambio de contraseña obligatorio.
      expect(d.usersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          statusConceptId: CONCEPTS.STATE_PENDING,
          mustChangePassword: true,
        }),
      );
      // Credencial de contraseña PENDIENTE, sin secreto definitivo.
      expect(d.credentialsRepo.createPendingPassword).toHaveBeenCalled();

      // Solo se persiste el HASH del token (un solo uso), no el valor en claro.
      expect(d.activationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tokenHash: 'ACT-HASH' }),
      );
      const createArg = d.activationsRepo.create.mock.calls[0][1];
      expect(createArg.tokenHash).not.toBe('ACT-RAW');

      // Evento de auditoría de la creación asistida.
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
          detailJson: expect.objectContaining({
            flow: 'assisted-registration',
          }),
        }),
      );
    });

    it('rejects when the verified identifier already exists (prefer invitation)', async () => {
      const d = build();
      d.credentialsRepo.findLivePasswordBySubject.mockResolvedValue({
        id: 'c1',
      });

      await expect(
        d.service.assistedRegistration(
          {
            displayName: 'Paciente Uno',
            email: 'paciente@x.io',
            reason: 'duplicado',
          },
          actor as any,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.usersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('activateAccount (C-18)', () => {
    it('consumes the one-time token, sets the password and activates the account', async () => {
      const d = build();
      const activation = {
        userId: 'u1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        expiresAt: new Date(Date.now() + 60_000),
        updatedAt: new Date(),
      };
      const user = {
        id: 'u1',
        statusConceptId: CONCEPTS.STATE_PENDING,
        mustChangePassword: true,
        updatedAt: new Date(),
      };
      const cred = {
        id: 'c1',
        stateConceptId: CONCEPTS.STATE_PENDING,
        secretHash: undefined as string | undefined,
        updatedAt: new Date(),
      };
      d.activationsRepo.findByTokenHash.mockResolvedValue(activation);
      d.usersRepo.findById.mockResolvedValue(user);
      d.credentialsRepo.findPendingPasswordByUser.mockResolvedValue(cred);

      const res = await d.service.activateAccount(
        { activationToken: 'ACT-RAW', newPassword: 'brand-new-pass-1' },
        '1.2.3.4',
      );

      expect(res).toEqual({ userId: 'u1', status: 'ACTIVE', activated: true });
      // La contraseña del titular se fija (hash argon2) y la credencial se activa.
      expect(cred.secretHash).toBeDefined();
      expect(cred.secretHash).not.toBe('brand-new-pass-1');
      expect(cred.stateConceptId).toBe(CONCEPTS.STATE_ACTIVE);
      // El token queda consumido (un solo uso) y la cuenta activa.
      expect(activation.stateConceptId).toBe(CONCEPTS.STATE_VERIFIED);
      expect((activation as any).consumedAt).toBeInstanceOf(Date);
      expect(user.statusConceptId).toBe(CONCEPTS.USER_ACTIVE);
      expect(user.mustChangePassword).toBe(false);
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ eventTypeConceptId: CONCEPTS.SEC_LOGIN }),
      );
    });

    it('rejects an already-used token', async () => {
      const d = build();
      d.activationsRepo.findByTokenHash.mockResolvedValue({
        userId: 'u1',
        stateConceptId: CONCEPTS.STATE_VERIFIED,
        expiresAt: new Date(Date.now() + 60_000),
      });

      await expect(
        d.service.activateAccount(
          { activationToken: 'ACT-RAW', newPassword: 'brand-new-pass-1' },
          '1.2.3.4',
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(d.usersRepo.findById).not.toHaveBeenCalled();
      // Se audita el intento fallido.
      expect(d.eventsRepo.record).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          eventTypeConceptId: CONCEPTS.SEC_LOGIN_FAILED,
        }),
      );
    });

    it('rejects an expired token and marks it expired', async () => {
      const d = build();
      const activation = {
        userId: 'u1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        expiresAt: new Date(Date.now() - 60_000),
        updatedAt: new Date(),
      };
      d.activationsRepo.findByTokenHash.mockResolvedValue(activation);

      await expect(
        d.service.activateAccount(
          { activationToken: 'ACT-RAW', newPassword: 'brand-new-pass-1' },
          '1.2.3.4',
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      expect(activation.stateConceptId).toBe(CONCEPTS.STATE_EXPIRED);
    });

    it('rejects an unknown token', async () => {
      const d = build();
      d.activationsRepo.findByTokenHash.mockResolvedValue(null);

      await expect(
        d.service.activateAccount(
          { activationToken: 'nope', newPassword: 'brand-new-pass-1' },
          '1.2.3.4',
        ),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
