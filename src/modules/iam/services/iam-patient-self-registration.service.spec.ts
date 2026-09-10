import { jest } from '@jest/globals';
// Alias con tipado laxo: evita el 'never' que @jest/globals infiere para jest.fn() en ESM.
const fn = jest.fn as unknown as (impl?: (...a: any[]) => any) => any;
import { IamPatientSelfRegistrationService } from './iam-patient-self-registration.service';
import { TracingService } from '../../../observability';
// `UnauthorizedException` es la de Nest, no la de dominio: es la que usan el
// resto de flujos de autenticación de IAM (login, activación de cuenta).
import { UnauthorizedException } from '@nestjs/common';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { PROF } from '../../profiles/profiles.concepts';
import { DIR } from '../../directory/directory.concepts';
import { INS } from '../../insurance/insurance.concepts';
import {
  BOLIVIA_PUBLIC_INSURERS,
  carrierPlanId,
} from '../../../common/seed/bolivia-insurance.catalog';
import {
  boMunicipalityConceptId,
  boDepartmentConceptId,
} from '../../../common/seed/bo-geography.catalog';
import type { RegisterPatientDto } from '../dto';

/**
 * El alta mínima que el contrato acepta.
 *
 * Los cinco campos de abajo del documento y la contraseña entraron con la
 * TAREA 03 (AC-03-3): correo, fecha de nacimiento, teléfono, sexo y municipio
 * de residencia dejaron de ser opcionales. Sin ellos el DTO ya no valida, así
 * que este literal no es decoración: es lo que hoy define «un alta mínima».
 */
const dto: RegisterPatientDto = {
  nationalId: '1234567',
  password: 'password123',
  displayName: 'Ana Pérez',
  email: 'ana@example.test',
  birthDate: '1990-05-17',
  phone: '+591 70012345',
  sexAtBirth: 'FEMALE',
  // `writeAddress` valida el municipio contra la base, con
  // `CatalogConceptsRepository.findById` (`common/services/residence-address.ts`,
  // ALV-009-bis) — el `build()` de este archivo mockea ese id como Sacaba,
  // Cochabamba. El uuid en sí no importa: es sólo la llave del mock.
  residenceMunicipalityConceptId: boMunicipalityConceptId('030301'),
  // El departamento emisor es obligatorio desde la subtarea 1.4; el `build()`
  // de este archivo mockea `administrativeAreas` para que lo acepte siempre.
  issuerAdministrativeAreaConceptId: boDepartmentConceptId('SC'),
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
    const emailVerificationsRepo = {
      create: fn(),
      findByTokenHash: fn(),
      findLatestByUser: fn(),
    };
    const personsRepo = { create: fn(() => ({ id: 'person-1' })) };
    const personProfilesRepo = { create: fn() };
    const patientProfilesRepo = {
      create: fn(() => ({ profileId: 'person-1' })),
    };
    const accountLinksRepo = { create: fn() };
    const identifiersRepo = { create: fn() };
    const contactPointsRepo = { create: fn() };
    const addressesRepo = { create: fn() };
    // El municipio del `dto` por defecto (Sacaba, Cochabamba) es el único
    // sembrado en este doble: cualquier otro id responde `null`, como haría
    // la base real con un uuid que no pertenece a `VS_BO_MUNICIPALITY`.
    const catalogConceptsRepo = {
      findById: fn((_tx: any, id: string) =>
        Promise.resolve(
          id === dto.residenceMunicipalityConceptId
            ? { code: 'CB-SACABA', display: 'Sacaba' }
            : null,
        ),
      ),
    };
    const notificationsService = {
      createRequest: fn().mockResolvedValue({ id: 'notif-1' }),
    };
    const tenantMembershipsRepo = { create: fn() };
    const relatedPersonsRepo = { create: fn() };
    const insuranceCatalogRepo = {
      findPlan: fn().mockResolvedValue({
        id: 'plan-1',
        statusConceptId: INS.PLAN_ACTIVE,
      }),
    };
    const coverageRepo = {
      findByMemberAndPlan: fn().mockResolvedValue(null),
      createCoverage: fn(),
    };
    const administrativeAreas = {
      assertIsAdministrativeArea: fn().mockResolvedValue(undefined),
    };

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
      addressesRepo as never,
      catalogConceptsRepo as never,
      relatedPersonsRepo as never,
      insuranceCatalogRepo as never,
      coverageRepo as never,
      notificationsService as never,
      tenantMembershipsRepo as never,
      logger as never,
      new TracingService(),
      administrativeAreas as never,
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
      addressesRepo,
      relatedPersonsRepo,
      insuranceCatalogRepo,
      coverageRepo,
      notificationsService,
      tenantMembershipsRepo,
      administrativeAreas,
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
        // El correo es obligatorio desde AC-03-3, así que el alta mínima ya
        // trae uno y el token de verificación sale siempre.
        emailVerificationSent: true,
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

    it('does not record a tax identifier when no NIT is given', async () => {
      const d = build();

      await d.service.registerPatient(dto);

      expect(d.identifiersRepo.create).not.toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ typeConceptId: CONCEPTS.ID_TYPE_TAX }),
      );
    });

    it('records the NIT as a tax identifier of the person with legal name', async () => {
      const d = build();

      await d.service.registerPatient({
        ...dto,
        billingTaxId: '1023456789',
        billingLegalName: 'Carlos Roca Aguilera',
      });

      expect(d.identifiersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerId: 'person-1',
          typeConceptId: CONCEPTS.ID_TYPE_TAX,
          value: '1023456789',
          holderName: 'Carlos Roca Aguilera',
        }),
      );
    });

    it('writes the street and the coordinates of the home address', async () => {
      const d = build();

      await d.service.registerPatient({
        ...dto,
        homeAddressLines: 'Av. Banzer 3er anillo #42',
        homeLatitude: -17.78,
        homeLongitude: -63.18,
      });

      expect(d.addressesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          lines: 'Av. Banzer 3er anillo #42',
          // La columna es numeric y la entidad la mapea a texto.
          latitude: '-17.78',
          longitude: '-63.18',
          useConceptId: CONCEPTS.ADDR_USE_HOME,
        }),
      );
    });

    it('writes the work address as a second row with its own use', async () => {
      const d = build();

      await d.service.registerPatient({
        ...dto,
        workAddressLines: 'Calle Ayacucho 120',
      });

      expect(d.addressesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          lines: 'Calle Ayacucho 120',
          useConceptId: CONCEPTS.ADDR_USE_WORK,
        }),
      );
    });

    /**
     * El servicio sigue sabiendo no escribir dirección cuando no le dan
     * ninguna: una fila con país y nada más no es un dato, es una fila.
     *
     * Que el DTO ya **no permita** llegar así —el municipio de residencia es
     * obligatorio desde AC-03-3— no vuelve muerta a esta rama: la validación
     * vive en el pipe, y el servicio es llamado también por el registro
     * asistido y por las pruebas de contrato. Por eso el municipio se quita a
     * propósito acá, en vez de borrar la prueba.
     */
    it('writes no address at all when nothing about it was given', async () => {
      const d = build();
      const { residenceMunicipalityConceptId: _sinMunicipio, ...sinDireccion } =
        dto;

      await d.service.registerPatient(sinDireccion as typeof dto);

      expect(d.addressesRepo.create).not.toHaveBeenCalled();
    });

    it('registers the guardian and hangs their phone off OWNER_PERSON', async () => {
      const d = build();

      await d.service.registerPatient({
        ...dto,
        guardianName: 'Rosa Quispe',
        guardianPhone: '+59171234567',
      });

      expect(d.relatedPersonsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          relationshipConceptId: PROF.RELATIONSHIP_GUARDIAN,
          isEmergencyContact: true,
          // Nadie verificó la tutela en el alta.
          isLegalGuardian: false,
        }),
      );
      expect(d.contactPointsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
          value: '+59171234567',
        }),
      );
    });

    /**
     * El parentesco declarado manda sobre el valor por defecto.
     *
     * Es la mitad que faltaba del contacto de emergencia: la columna y el
     * conjunto de valores existían, pero el alta escribía siempre «tutor o
     * representante legal», así que toda persona de contacto quedaba anotada
     * como representante legal de alguien.
     */
    it('writes the declared relationship instead of the guardian default', async () => {
      const d = build();

      await d.service.registerPatient({
        ...dto,
        guardianName: 'Rosa Quispe',
        guardianRelationshipConceptId: PROF.RELATIONSHIP_MOTHER,
      });

      expect(d.relatedPersonsRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          relationshipConceptId: PROF.RELATIONSHIP_MOTHER,
          // Declarar el parentesco describe quién es esa persona; no le otorga
          // la representación legal del paciente, que nadie verificó.
          isLegalGuardian: false,
        }),
      );
    });

    /**
     * Un parentesco sin contacto no escribe nada.
     *
     * El campo viaja aparte del nombre, así que un cliente puede mandarlo solo.
     * La regla no cambia: sin nombre no hay persona relacionada que crear.
     */
    it('ignores a declared relationship when no guardian was given', async () => {
      const d = build();

      await d.service.registerPatient({
        ...dto,
        guardianRelationshipConceptId: PROF.RELATIONSHIP_MOTHER,
      });

      expect(d.relatedPersonsRepo.create).not.toHaveBeenCalled();
    });

    it('rejects a guardian phone with no guardian name', async () => {
      const d = build();

      await expect(
        d.service.registerPatient({ ...dto, guardianPhone: '+59171234567' }),
      ).rejects.toThrow();
      expect(d.relatedPersonsRepo.create).not.toHaveBeenCalled();
    });

    it('records the declared private and public coverages in order', async () => {
      const d = build();
      const privado = carrierPlanId(
        'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
        'RED_MAX',
      );
      const publico = carrierPlanId(BOLIVIA_PUBLIC_INSURERS[0].code, 'BASE');

      await d.service.registerPatient({
        ...dto,
        privateInsurancePlanId: privado,
        publicInsurancePlanId: publico,
      });

      expect(d.coverageRepo.createCoverage).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          insurancePlanId: privado,
          coverageOrder: 1,
          // Es lo que la persona declara, no lo que la aseguradora confirmó.
          verificationStatusConceptId: INS.VERIFY_PENDING,
          memberIdentifier: dto.nationalId,
        }),
      );
      expect(d.coverageRepo.createCoverage).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ insurancePlanId: publico, coverageOrder: 2 }),
      );
    });

    it('rejects a public insurer declared as the private one', async () => {
      const d = build();

      await expect(
        d.service.registerPatient({
          ...dto,
          privateInsurancePlanId: carrierPlanId(
            BOLIVIA_PUBLIC_INSURERS[0].code,
            'BASE',
          ),
        }),
      ).rejects.toThrow();
      expect(d.coverageRepo.createCoverage).not.toHaveBeenCalled();
    });

    it('skips a coverage that is already on file instead of failing the signup', async () => {
      const d = build();
      d.coverageRepo.findByMemberAndPlan.mockResolvedValue({ id: 'cov-1' });

      await d.service.registerPatient({
        ...dto,
        privateInsurancePlanId: carrierPlanId(
          'BO_ASEG_BISA_SEGUROS_Y_REASEGUROS_S_A',
          'RED_MAX',
        ),
      });

      expect(d.coverageRepo.createCoverage).not.toHaveBeenCalled();
    });

    /**
     * Misma razón que la dirección: el DTO ya no deja llegar sin correo
     * (AC-03-3), pero la rama del servicio sigue viva para el registro asistido
     * y no se borra. Se quitan también el teléfono, que cuelga del mismo
     * repositorio de puntos de contacto.
     */
    it('skips every email side effect when no email is given', async () => {
      const d = build();
      const { email: _sinCorreo, phone: _sinTelefono, ...sinContacto } = dto;

      await d.service.registerPatient(sinContacto as typeof dto);

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

  describe('departamento emisor del documento (1.4)', () => {
    it('comprueba el departamento contra VS_BO_DEPARTMENT antes de crear nada', async () => {
      const d = build();

      await d.service.registerPatient(dto);

      expect(
        d.administrativeAreas.assertIsAdministrativeArea,
      ).toHaveBeenCalledWith(d.tx, dto.issuerAdministrativeAreaConceptId);
      expect(d.identifiersRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          issuerAdministrativeAreaConceptId:
            dto.issuerAdministrativeAreaConceptId,
        }),
      );
    });

    it('si el catálogo rechaza el departamento, el alta no escribe nada', async () => {
      const d = build();
      d.administrativeAreas.assertIsAdministrativeArea.mockRejectedValueOnce(
        new PreconditionFailedException(
          'El departamento no pertenece al catálogo de departamentos de Bolivia',
        ),
      );

      await expect(d.service.registerPatient(dto)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );

      expect(d.usersRepo.create).not.toHaveBeenCalled();
      expect(d.personsRepo.create).not.toHaveBeenCalled();
      expect(d.identifiersRepo.create).not.toHaveBeenCalled();
      expect(d.tx.flush).not.toHaveBeenCalled();
    });
  });
});
