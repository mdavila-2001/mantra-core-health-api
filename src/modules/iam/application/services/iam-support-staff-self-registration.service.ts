import { Inject, Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import {
  CONCEPTS,
  ConflictException,
  SEED,
  TokenService,
} from '../../../../common';
import { composeAccountDisplayName } from '../../../../common/text/person-name';
import { IamErrorReason } from '../../iam.error-reasons';
import {
  ADMIN_GENDER_CONCEPT_BY_CODE,
  PROF,
} from '../../../profiles/profiles.concepts';
import { PRAC } from '../../../practice/practice.concepts';
import { DIR } from '../../../directory/directory.concepts';
import {
  CredentialsRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../../infrastructure/repositories';
import type {
  RegisterSupportStaffDto,
  RegisterSupportStaffResponseDto,
} from '../../presentation/dto';
import {
  COMMON_RECORDS_PORT,
  type CommonRecordsPort,
} from '../ports/common-records.port';
import {
  DIRECTORY_REGISTRATION_PORT,
  type DirectoryRegistrationPort,
} from '../ports/directory-registration.port';
import {
  EMAIL_NOTICE_PORT,
  type EmailNoticePort,
} from '../ports/email-notice.port';
import {
  PROFILE_REGISTRATION_PORT,
  type ProfileRegistrationPort,
} from '../ports/profile-registration.port';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

/** Vida útil del token de verificación de correo (24 h), igual que el paciente. */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Alta de una secretaria (personal de apoyo hospitalario) por su cuenta.
 *
 * Es el alta del paciente ({@link IamPatientSelfRegistrationService}) con las
 * mismas piezas —cerrojo por documento, cuenta ACTIVA con su contraseña,
 * persona, vínculo cuenta-persona, documento como identificador oficial,
 * teléfono y correo— y dos diferencias que son el motivo de que exista:
 *
 * - El rol global es `SUPPORT_STAFF` (además de `USER`), no `PATIENT`, y el
 *   perfil es `profiles.secretary_profiles`, no `patient_profiles`.
 * - La membresía del tenant por defecto lleva `DIR.ROLE_SUPPORT`: abre el token
 *   (sin ella el interceptor de tenant rechaza toda ruta) sin dejar leer la
 *   organización. A un hospital sólo se entra por un vínculo aceptado.
 */
@Injectable()
export class IamSupportStaffSelfRegistrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param tokenService - Emite el token de verificación de correo.
   * @param usersRepo - `iam.users`.
   * @param credentialsRepo - Credencial por documento.
   * @param rolesRepo - Roles globales.
   * @param eventsRepo - Evento de seguridad del alta.
   * @param emailVerificationsRepo - Token de verificación de correo.
   * @param profiles - Persona, perfiles y vínculo cuenta-persona.
   * @param commonRecords - Documento, teléfono y correo.
   * @param emailNotice - Encolado del correo de verificación.
   * @param directory - Membresía del tenant por defecto.
   * @param logger - Logger estructurado.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly emailVerificationsRepo: EmailVerificationsRepository,
    @Inject(PROFILE_REGISTRATION_PORT)
    private readonly profiles: ProfileRegistrationPort,
    @Inject(COMMON_RECORDS_PORT)
    private readonly commonRecords: CommonRecordsPort,
    @Inject(EMAIL_NOTICE_PORT)
    private readonly emailNotice: EmailNoticePort,
    @Inject(DIRECTORY_REGISTRATION_PORT)
    private readonly directory: DirectoryRegistrationPort,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(IamSupportStaffSelfRegistrationService.name);
  }

  /**
   * Crea la cuenta, la persona y el perfil de secretaria.
   *
   * @param dto - Datos del alta.
   * @param ip - IP de origen, para el evento de seguridad.
   * @returns Lo creado y si salió el correo de verificación.
   * @throws ConflictException (`NATIONAL_ID_ALREADY_REGISTERED`) si el documento
   *   ya tiene una credencial viva.
   */
  async register(
    dto: RegisterSupportStaffDto,
    ip?: string,
  ): Promise<RegisterSupportStaffResponseDto> {
    this.logger.info(
      { operation: 'iam.auth.register-support-staff' },
      'Support staff self-registration',
    );

    const created = await this.em.transactional(async (tx) => {
      await this.credentialsRepo.lockSubjectForRegistration(tx, dto.nationalId);
      const existing = await this.credentialsRepo.findLivePasswordBySubject(
        tx,
        dto.nationalId,
      );
      if (existing) {
        this.logger.warn(
          {
            operation: 'iam.auth.register-support-staff',
            reason: 'identifier-in-use',
          },
          'Rejected support staff registration: national id already registered',
        );
        throw new ConflictException(
          'Ya existe una cuenta con ese documento de identidad',
          undefined,
          IamErrorReason.NATIONAL_ID_ALREADY_REGISTERED,
        );
      }

      await this.profiles.assertIsAdministrativeArea(
        tx,
        dto.issuerAdministrativeAreaConceptId,
      );

      const displayName = composeAccountDisplayName(dto);
      const user = this.usersRepo.create(tx, {
        displayName,
        statusConceptId: CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        timeZone: dto.timeZone,
      });
      await tx.flush();

      this.credentialsRepo.createPassword(tx, {
        userId: user.id,
        externalSubject: dto.nationalId,
        secretHash: await argon2.hash(dto.password),
        actorUserId: user.id,
      });
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE.USER,
        actorUserId: user.id,
      });
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE.SUPPORT_STAFF,
        actorUserId: user.id,
      });

      const person = this.profiles.createPerson(tx, {
        personStatusConceptId: PROF.PERSON_ACTIVE,
        vitalStatusConceptId: PROF.VITAL_ALIVE,
        name: dto.name,
        middleName: dto.middleName,
        lastName: dto.lastName,
        motherLastName: dto.motherLastName,
        displayName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        administrativeGenderConceptId: dto.gender
          ? ADMIN_GENDER_CONCEPT_BY_CODE[dto.gender]
          : undefined,
        actorUserId: user.id,
      });
      await tx.flush();

      this.profiles.createPersonProfile(tx, {
        personId: person.id,
        profileTypeConceptId: PROF.PROFILE_TYPE_SECRETARY,
        statusConceptId: PROF.PROFILE_ACTIVE,
        actorUserId: user.id,
      });
      const secretary = this.profiles.createSecretaryProfile(tx, {
        profileId: person.id,
        roleConceptId: PRAC.SUPPORT_ROLE_SECRETARY,
        actorUserId: user.id,
      });
      await tx.flush();

      this.profiles.createAccountLink(tx, {
        personId: person.id,
        userId: user.id,
        linkTypeConceptId: PROF.ACCOUNT_LINK_SELF,
        verificationStatusConceptId: PROF.ACCOUNT_LINK_VERIFIED,
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        validFrom: new Date(),
        actorUserId: user.id,
      });

      // El documento como identificador oficial de la PERSONA (no de un
      // paciente: `OWNER_PATIENT` implica un perfil de paciente que no existe).
      this.commonRecords.createIdentifier(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
        ownerId: person.id,
        typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
        value: dto.nationalId,
        useConceptId: CONCEPTS.USE_OFFICIAL,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        issuerAdministrativeAreaConceptId:
          dto.issuerAdministrativeAreaConceptId,
        actorUserId: user.id,
      });

      // Tenant por defecto con el rol acotado de apoyo: la cuenta funciona
      // desde el primer día sin poder leer ninguna organización.
      this.directory.createTenantMembership(tx, {
        userId: user.id,
        tenantId: SEED.tenantId,
        tenantRoleConceptId: DIR.ROLE_SUPPORT,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        actorUserId: user.id,
      });

      this.commonRecords.createContactPoint(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
        ownerId: person.id,
        systemConceptId: CONCEPTS.CONTACT_PHONE,
        value: dto.phone,
        useConceptId: CONCEPTS.CONTACT_USE_HOME,
        rank: 1,
        actorUserId: user.id,
      });

      this.commonRecords.createContactPoint(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_PERSON,
        ownerId: person.id,
        systemConceptId: CONCEPTS.CONTACT_EMAIL,
        value: dto.email,
        useConceptId: CONCEPTS.CONTACT_USE_HOME,
        actorUserId: user.id,
      });
      const { raw, hash } = this.tokenService.issueRefreshToken();
      this.emailVerificationsRepo.create(tx, {
        userId: user.id,
        email: dto.email,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        actorUserId: user.id,
      });

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        recordedByUserId: user.id,
        ip,
        detailJson: { flow: 'support-staff-self-registration' },
      });

      return {
        userId: user.id,
        personId: person.id,
        supportProfileId: secretary.profileId,
        emailVerificationToken: raw,
      };
    });

    // Fuera de la transacción, como el paciente: si la mensajería falla, la
    // cuenta ya creada no se deshace.
    const emailVerificationSent = await this.sendVerificationEmail(
      created.userId,
      dto.email,
      created.emailVerificationToken,
    );

    this.logger.info(
      { operation: 'iam.auth.register-support-staff', userId: created.userId },
      'Support staff self-registered',
    );
    return {
      userId: created.userId,
      personId: created.personId,
      supportProfileId: created.supportProfileId,
      role: 'SUPPORT_STAFF',
      emailVerificationSent,
    };
  }

  /** Encola el correo de verificación; devuelve si quedó encolado. */
  private async sendVerificationEmail(
    userId: string,
    email: string,
    token: string,
  ): Promise<boolean> {
    try {
      await this.emailNotice.enqueueEmail({
        recipientUserId: userId,
        recipientAddress: email,
        subject: 'Verifique su correo',
        bodyText:
          'Para verificar su correo, use este código: ' +
          `${token}\n\nSi no creó esta cuenta, ignore este mensaje.`,
      });
      return true;
    } catch (error) {
      this.logger.warn(
        { operation: 'iam.auth.register-support-staff', userId, err: error },
        'Could not enqueue the verification email; the account is usable anyway',
      );
      return false;
    }
  }
}
