import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IamPatientSelfRegistrationService } from './iam-patient-self-registration.service';
import { TracingService } from '../../../observability';
// `UnauthorizedException` es la de Nest, no la de dominio: es la que usan el
// resto de flujos de autenticación de IAM (login, activación de cuenta).
import { UnauthorizedException } from '@nestjs/common';
import { CONCEPTS, ConflictException } from '../../../common';
import { PROF } from '../../profiles/profiles.concepts';
import { DIR } from '../../directory/directory.concepts';
import type { RegisterPatientDto } from '../dto';

const dto: RegisterPatientDto = {
  nationalId: '1234567',
  password: 'password123',
  displayName: 'Ana Pérez',
};

describe('IamPatientSelfRegistrationService', () => {
  const logger = { setContext: fn(), info: fn(), warn: fn(), error: fn() };

  /**
   * Construye el sistema bajo prueba con dependencias controladas.
   * @returns Resultado de build.
   */
  function build() {
    const tx = { flush: fn().mockResolvedValue(undefined) };
    const em = {
      transactional: fn((cb: (tx: unknown) => unknown) => cb(tx)),
    };
    const tokenService = {
      issueRefreshToken: fn(() => ({ raw: 'raw-token', hash: 'hashed' })),
      hashRefreshToken: fn(() => 'hashed'),
    };
    const usersRepo = {
      create: fn(() => ({ id: 'user-1' })),
      findById: fn(),
    };
    const credentialsRepo = {
      findLivePasswordBySubject: fn().mockResolvedValue(null),
      createPassword: fn(),
    };
    const rolesRepo = { create: fn() };
    const eventsRepo = { record: fn() };
    const emailVerificationsRepo = { create: fn(), findByTokenHash: fn() };
    const personsRepo = { create: fn(() => ({ id: 'person-1' })) };
    const personProfilesRepo = { create: fn() };
    const patientProfilesRepo = {
      create: fn(() => ({ profileId: 'person-1' })),
    };
    const accountLinksRepo = { create: fn() };
    const identifiersRepo = { create: fn() };
    const contactPointsRepo = { create: fn() };
    const notificationsService = {
      createRequest: fn().mockResolvedValue({ id: 'notif-1' }),
    };
    const tenantMembershipsRepo = { create: fn() };

    const service = new IamPatientSelfRegistrationService(
      em as never,
      tokenService as never,
      usersRepo as never,
      credentialsRepo as never,
      rolesRepo as never,
      eventsRepo as never,
      emailVerificationsRepo,
      personsRepo as never,
      personProfilesRepo as never,
      patientProfilesRepo as never,
      accountLinksRepo as never,
      identifiersRepo as never,
      contactPointsRepo as never,
      notificationsService as never,
      tenantMembershipsRepo as never,
      logger as never,
      new TracingService(),
    );
    return {
      service,
      tx,
      tokenService,
      usersRepo,
      credentialsRepo,
      rolesRepo,
      emailVerificationsRepo,
      personsRepo,
      patientProfilesRepo,
      accountLinksRepo,
      identifiersRepo,
      contactPointsRepo,
      notificationsService,
      tenantMembershipsRepo,
    };
  }

  describe('registerPatient', () => {
    it('creates an ACTIVE account whose login subject is the national id', async () => {
      const d = build();

      const result = await d.service.registerPatient(dto);

      // La cuenta nace activa: el titular ya fijó su propia contraseña, a
      // diferencia del registro asistido que queda pendiente de activación.
      expect(d.usersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ statusConceptId: CONCEPTS.USER_ACTIVE }),
      );
      expect(d.credentialsRepo.createPassword).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ externalSubject: dto.nationalId }),
      );
      expect(result).toMatchObject({
        userId: 'user-1',
        personId: 'person-1',
        patientProfileId: 'person-1',
        emailVerificationSent: false,
      });
      expect(result.patientCode).toMatch(/^PAT-/);
    });

    it('creates the person, its patient profile and the self account link', async () => {
      const d = build();

      await d.service.registerPatient(dto);

      expect(d.personsRepo.create).toHaveBeenCalled();
      expect(d.patientProfilesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ profileId: 'person-1' }),
      );
      expect(d.accountLinksRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          personId: 'person-1',
          userId: 'user-1',
          linkTypeConceptId: PROF.ACCOUNT_LINK_SELF,
        }),
      );
    });

    it('grants membership in the default tenant so the account is usable beyond login', async () => {
      const d = build();

      await d.service.registerPatient(dto);

      // Sin esta membresía, `TenantContextInterceptor` (global, corre en toda
      // ruta autenticada no @Public()) rechaza con 403 cualquier request
      // posterior del paciente — la cuenta quedaría inutilizable más allá del
      // login. Ver el comentario en el servicio.
      //
      // El status es el concepto de directory, que es el dominio de la tabla.
      // Antes se escribía `CONCEPTS.MEMBERSHIP_ACTIVE`, que pese al nombre es
      // el de promotions, sólo porque era el único que miraba
      // `loadActiveTenantIds`; ese método ya acepta ambos.
      expect(d.tenantMembershipsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          userId: 'user-1',
          statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        }),
      );
    });

    it('also records the national id as an official identifier of the person', async () => {
      const d = build();

      await d.service.registerPatient(dto);

      expect(d.identifiersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerId: 'person-1',
          typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
          value: dto.nationalId,
        }),
      );
    });

    it('skips every email side effect when no email is given', async () => {
      const d = build();

      await d.service.registerPatient(dto);

      expect(d.contactPointsRepo.create).not.toHaveBeenCalled();
      expect(d.emailVerificationsRepo.create).not.toHaveBeenCalled();
      expect(d.notificationsService.createRequest).not.toHaveBeenCalled();
    });

    it('issues and enqueues a verification token when an email is given', async () => {
      const d = build();

      const result = await d.service.registerPatient({
        ...dto,
        email: 'ana@example.com',
      });

      expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          systemConceptId: CONCEPTS.CONTACT_EMAIL,
          value: 'ana@example.com',
        }),
      );
      // Sólo se persiste el hash; el token en claro viaja únicamente en el correo.
      expect(d.emailVerificationsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tokenHash: 'hashed' }),
      );
      expect(d.notificationsService.createRequest).toHaveBeenCalled();
      expect(result.emailVerificationSent).toBe(true);
    });

    it('keeps the account when the email cannot be enqueued', async () => {
      const d = build();
      d.notificationsService.createRequest.mockRejectedValue(
        new Error('messaging down'),
      );

      const result = await d.service.registerPatient({
        ...dto,
        email: 'ana@example.com',
      });

      // El requisito es que el usuario pueda navegar desde el registro: que el
      // correo no salga no puede deshacer una cuenta ya válida.
      expect(result.userId).toBe('user-1');
      expect(result.emailVerificationSent).toBe(false);
      expect(logger.warn).toHaveBeenCalled();
    });

    it('rejects a national id that already has a live credential', async () => {
      const d = build();
      d.credentialsRepo.findLivePasswordBySubject.mockResolvedValue({
        id: 'cred-1',
      });

      await expect(d.service.registerPatient(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(d.usersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    /** Verificación viva por defecto, con el usuario que le corresponde. */
    function withVerification(
      d: ReturnType<typeof build>,
      overrides: Record<string, unknown> = {},
    ) {
      const user = {
        id: 'user-1',
        emailVerified: false,
        updatedAt: new Date(),
      };
      const verification = {
        userId: 'user-1',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        expiresAt: new Date(Date.now() + 60_000),
        updatedAt: new Date(),
        ...overrides,
      };
      d.emailVerificationsRepo.findByTokenHash.mockResolvedValue(verification);
      d.usersRepo.findById.mockResolvedValue(user);
      return { user, verification };
    }

    it('marks the user as verified and consumes the token', async () => {
      const d = build();
      const { user } = withVerification(d);

      const result = await d.service.verifyEmail({ token: 'raw-token' });

      expect(user.emailVerified).toBe(true);
      expect(result).toEqual({ userId: 'user-1', emailVerified: true });
    });

    it('rejects an unknown token', async () => {
      const d = build();
      d.emailVerificationsRepo.findByTokenHash.mockResolvedValue(null);

      await expect(
        d.service.verifyEmail({ token: 'raw-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects a token that was already consumed', async () => {
      const d = build();
      withVerification(d, { stateConceptId: CONCEPTS.STATE_VERIFIED });

      await expect(
        d.service.verifyEmail({ token: 'raw-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejects an expired token and persists the expired state', async () => {
      const d = build();
      const { verification } = withVerification(d, {
        expiresAt: new Date(Date.now() - 1),
      });

      await expect(
        d.service.verifyEmail({ token: 'raw-token' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
      // Antes, este `throw` ocurría dentro de `em.transactional` y revertía la
      // propia marca de expiración: el registro quedaba en ACTIVE para siempre.
      expect(verification.stateConceptId).toBe(CONCEPTS.STATE_EXPIRED);
    });
  });
});
