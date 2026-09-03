import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  APP_ATTR,
  TracingService,
  type TraceSpan,
} from '../../../observability';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import {
  CONCEPTS,
  ConflictException,
  SEED,
  TokenService,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import {
  ADMIN_GENDER_CONCEPT_BY_CODE,
  BIRTH_SEX_CONCEPT_BY_CODE,
  PROF,
} from '../../profiles/profiles.concepts';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../../profiles/repositories';
import { composeAccountDisplayName } from '../../profiles/person-name';
import {
  AddressesRepository,
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import { NotificationsService } from '../../messaging/services';
import { DIR } from '../../directory/directory.concepts';
import { TenantMembershipsRepository } from '../../directory/repositories';
import {
  CredentialsRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../repositories';
import {
  RegisterPatientDto,
  RegisterPatientResponseDto,
  VerifyEmailDto,
  VerifyEmailResponseDto,
} from '../dto';
import {
  createResidenceAddress,
  createWorkAddress,
} from '../../common/services/residence-address';
import { createGuardianRelatedPerson } from '../../profiles/services/guardian-related-person';
import { createDeclaredCoverage } from '../../insurance/services/declared-coverage';
import {
  CatalogRepository,
  CoverageRepository,
} from '../../insurance/repositories';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

/** Vida útil del token de verificación de correo (24 h). */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Auto-registro de pacientes por documento de identidad.
 *
 * A diferencia del registro asistido (C-18), aquí el titular está presente y
 * fija su propia contraseña, así que la cuenta nace ACTIVA: no hay token de
 * activación ni `mustChangePassword`.
 *
 * El identificador de login es el **documento de identidad**, que se guarda en
 * el mismo `authentication_credentials.external_subject` donde las altas por
 * correo guardan el correo. El correo es opcional y, cuando se aporta, sólo
 * dispara un token de verificación: **no condiciona el acceso**, el paciente
 * puede usar la aplicación desde el primer momento. Verificarlo marca
 * `iam.users.email_verified`, columna que hasta ahora nadie ponía en `true`.
 *
 * El servicio cruza tres módulos (iam para la cuenta, profiles para la persona
 * y su perfil de paciente, common para documento y correo) en una sola
 * transacción, porque una cuenta sin perfil de paciente no sirve para nada y
 * dejarla a medias obligaría a un flujo de reparación que nadie va a escribir.
 */
@Injectable()
export class IamPatientSelfRegistrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tokenService - Valor de token service requerido por la operación.
   * @param usersRepo - Valor de users repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param rolesRepo - Valor de roles repo requerido por la operación.
   * @param eventsRepo - Valor de events repo requerido por la operación.
   * @param emailVerificationsRepo - Valor de email verifications repo requerido por la operación.
   * @param personsRepo - Valor de persons repo requerido por la operación.
   * @param personProfilesRepo - Valor de person profiles repo requerido por la operación.
   * @param patientProfilesRepo - Valor de patient profiles repo requerido por la operación.
   * @param accountLinksRepo - Valor de account links repo requerido por la operación.
   * @param identifiersRepo - Valor de identifiers repo requerido por la operación.
   * @param contactPointsRepo - Valor de contact points repo requerido por la operación.
   * @param notificationsService - Valor de notifications service requerido por la operación.
   * @param tenantMembershipsRepo - Valor de tenant memberships repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly emailVerificationsRepo: EmailVerificationsRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly addressesRepo: AddressesRepository,
    private readonly relatedPersonsRepo: RelatedPersonsRepository,
    private readonly insuranceCatalogRepo: CatalogRepository,
    private readonly coverageRepo: CoverageRepository,
    private readonly notificationsService: NotificationsService,
    private readonly tenantMembershipsRepo: TenantMembershipsRepository,
    private readonly logger: PinoLogger,
    private readonly tracing: TracingService,
  ) {
    this.logger.setContext(IamPatientSelfRegistrationService.name);
  }

  /**
   * Crea la cuenta del paciente, su persona y su perfil, y —si aportó correo—
   * encola el correo de verificación.
   *
   * @param dto - Datos del auto-registro.
   * @param ip - IP de origen, para el evento de seguridad.
   * @returns Identificadores de lo creado y si salió el correo de verificación.
   * @throws ConflictException si el documento ya tiene una credencial viva.
   */
  async registerPatient(
    dto: RegisterPatientDto,
    ip?: string,
  ): Promise<RegisterPatientResponseDto> {
    // Span de negocio: el auto-registro crea siete filas en cinco tablas y
    // además encola un correo fuera de la transacción. Cuando algo sale mal
    // ("se registró pero no le llegó el correo"), el span dice exactamente
    // hasta dónde llegó el flujo.
    //
    // Privacidad: no se registra el documento de identidad, ni el correo, ni la
    // fecha de nacimiento. Solo si el flujo incluía correo (booleano) y los
    // identificadores internos ya creados.
    return this.tracing.runInSpan(
      'iam.patient.self-register',
      {
        [APP_ATTR.MODULE]: 'iam',
        [APP_ATTR.OPERATION]: 'patient.self-register',
        [APP_ATTR.ENTITY_TYPE]: 'iam.users',
        'iam.registration.with_email': Boolean(dto.email),
      },
      (span) => this.performRegisterPatient(dto, span, ip),
    );
  }

  /**
   * Registro propiamente dicho. La lógica no cambió al instrumentar; se extrajo
   * para que `registerPatient` sea solo la declaración del span de negocio.
   */
  private async performRegisterPatient(
    dto: RegisterPatientDto,
    span: TraceSpan,
    ip?: string,
  ): Promise<RegisterPatientResponseDto> {
    this.logger.info(
      { operation: 'iam.auth.register-patient' },
      'Patient self-registration',
    );

    const created = await this.em.transactional(async (tx) => {
      const existing = await this.credentialsRepo.findLivePasswordBySubject(
        tx,
        dto.nationalId,
      );
      if (existing) {
        this.logger.warn(
          {
            operation: 'iam.auth.register-patient',
            reason: 'identifier-in-use',
          },
          'Rejected self-registration: national id already registered',
        );
        throw new ConflictException(
          'Ya existe una cuenta con ese documento de identidad',
        );
      }

      // 1) Cuenta ACTIVA con su contraseña definitiva.
      // El nombre para mostrar sale de las partes; si el cliente mandó la forma
      // anterior, manda esa. Se calcula UNA vez y se usa en las dos filas
      // -la cuenta y la persona- para que no puedan divergir.
      const displayName = composeAccountDisplayName(dto);

      const user = this.usersRepo.create(tx, {
        displayName,
        statusConceptId: CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        timeZone: dto.timeZone,
      });
      // Las FK son columnas uuid planas: persistir el padre antes de los hijos.
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
      // `PATIENT` es lo que exigen los endpoints de autoservicio del portal
      // (reserva de turnos, entre otros). `USER` sigue siendo el rol base de
      // toda cuenta; este se suma porque quien se auto-registra por esta vía es,
      // por definición, el titular de su propio perfil de paciente.
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE.PATIENT,
        actorUserId: user.id,
      });

      // 2) Persona + clasificación + perfil de paciente.
      const person = this.personsRepo.create(tx, {
        personStatusConceptId: PROF.PERSON_ACTIVE,
        vitalStatusConceptId: PROF.VITAL_ALIVE,
        name: dto.name,
        middleName: dto.middleName,
        lastName: dto.lastName,
        motherLastName: dto.motherLastName,
        displayName,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        // El concepto explícito gana sobre el código: es el escape hatch para
        // clientes que ya manejan el catálogo de terminología.
        administrativeGenderConceptId:
          dto.administrativeGenderConceptId ??
          (dto.gender ? ADMIN_GENDER_CONCEPT_BY_CODE[dto.gender] : undefined),
        sexAtBirthConceptId:
          dto.sexAtBirthConceptId ??
          (dto.sexAtBirth
            ? BIRTH_SEX_CONCEPT_BY_CODE[dto.sexAtBirth]
            : undefined),
        // El catálogo gana sobre el texto libre: si ambos vienen, el texto
        // libre sólo tenía sentido para cuando el paciente no encontró la
        // suya en el catálogo (T-02).
        occupationConceptId: dto.occupationConceptId,
        occupationFreeText: dto.occupationConceptId
          ? undefined
          : dto.occupationFreeText,
        // La empresa sigue exactamente la misma regla, y por el mismo motivo:
        // el texto libre sólo tenía sentido para quien no encontró la suya en
        // el catálogo, así que con el concepto elegido sobra.
        workEmployerConceptId: dto.workEmployerConceptId,
        workEmployerFreeText: dto.workEmployerConceptId
          ? undefined
          : dto.workEmployerFreeText,
        actorUserId: user.id,
      });
      await tx.flush();

      this.personProfilesRepo.create(tx, {
        personId: person.id,
        profileTypeConceptId: PROF.PROFILE_TYPE_PATIENT,
        statusConceptId: PROF.PROFILE_ACTIVE,
        actorUserId: user.id,
      });
      await tx.flush();

      // `patient_profiles.profile_id` ES `persons.id` (ver ProfilesPatientsService).
      const patientCode = `PAT-${randomUUID()}`;
      const patient = this.patientProfilesRepo.create(tx, {
        profileId: person.id,
        patientCode,
        recordLinkageStatusConceptId: PROF.LINKAGE_UNLINKED,
        actorUserId: user.id,
      });

      // 3) Vínculo cuenta-persona: el titular es él mismo.
      this.accountLinksRepo.create(tx, {
        personId: person.id,
        userId: user.id,
        linkTypeConceptId: PROF.ACCOUNT_LINK_SELF,
        // El vínculo es "verificado" en el sentido de que no hay duda de a quién
        // pertenece la cuenta: la creó el propio titular. Es independiente de
        // que su identidad esté probada, que es lo que resuelve identity_assurance.
        verificationStatusConceptId: PROF.ACCOUNT_LINK_VERIFIED,
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        validFrom: new Date(),
        actorUserId: user.id,
      });

      // 4) El documento también como identificador oficial de la persona, que es
      // donde el resto del sistema lo busca (`common.identifiers`).
      this.identifiersRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
        ownerId: person.id,
        typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
        value: dto.nationalId,
        useConceptId: CONCEPTS.USE_OFFICIAL,
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        issuerAdministrativeAreaConceptId:
          dto.issuerAdministrativeAreaConceptId,
        actorUserId: user.id,
      });

      // El NIT con el que quiere que le facturen. Va como identificador oficial
      // de tipo tributario junto con su razón social (holderName).
      if (dto.billingTaxId) {
        this.identifiersRepo.create(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
          ownerId: person.id,
          typeConceptId: CONCEPTS.ID_TYPE_TAX,
          value: dto.billingTaxId,
          holderName: dto.billingLegalName,
          useConceptId: CONCEPTS.USE_OFFICIAL,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: user.id,
        });
      }

      // 5) Membresía en el tenant por defecto (`SEED.tenantId`): sin esta fila
      // en `directory.tenant_memberships`, `TenantContextInterceptor` —global,
      // corre en TODA ruta autenticada no `@Public()`— rechaza con 403 "no
      // pertenece a ningún tenant" absolutamente cualquier request posterior
      // del paciente (subir un archivo, pedir su verificación de identidad, ver
      // su propio perfil): la cuenta recién creada quedaría inutilizable más
      // allá del login. `ROLE_STAFF`/`SCOPE_ALL_TENANT` son un default
      // pragmático — el catálogo de roles de tenant (`DIR.ROLE_*`) sólo modela
      // personal de una clínica, no hay un rol "paciente"; qué tenant/rol le
      // corresponde a un paciente directo-al-consumidor es una decisión de
      // producto pendiente, no algo que este fix deba inventar. El status es
      // `DIR.MEMBERSHIP_ACTIVE`, el concepto propio de directory: antes se
      // escribía el de promotions porque era el único que
      // `IamAuthService.loadActiveTenantIds` consultaba — ese método ya acepta
      // ambos, así que la fila puede llevar por fin el concepto que le toca.
      this.tenantMembershipsRepo.create(tx, {
        userId: user.id,
        tenantId: SEED.tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        actorUserId: user.id,
      });

      // Domicilio: el municipio elegido en el alta. El departamento lo deriva
      // el ayudante del código del INE, no viene del cliente.
      createResidenceAddress(this.addressesRepo, tx, {
        personId: person.id,
        municipalityConceptId: dto.residenceMunicipalityConceptId,
        lines: dto.homeAddressLines,
        latitude: dto.homeLatitude,
        longitude: dto.homeLongitude,
        actorUserId: user.id,
      });

      // El trabajo es una segunda dirección de la misma persona, distinguida
      // por su uso: quien lleva un medicamento necesita saber a cuál ir.
      createWorkAddress(this.addressesRepo, tx, {
        personId: person.id,
        municipalityConceptId: dto.workMunicipalityConceptId,
        lines: dto.workAddressLines,
        latitude: dto.workLatitude,
        longitude: dto.workLongitude,
        actorUserId: user.id,
      });

      // El tutor o persona autorizada, si lo declaró.
      await createGuardianRelatedPerson(
        {
          persons: this.personsRepo,
          relatedPersons: this.relatedPersonsRepo,
          contactPoints: this.contactPointsRepo,
        },
        tx,
        {
          patientProfileId: patient.profileId,
          name: dto.guardianName,
          phone: dto.guardianPhone,
          actorUserId: user.id,
        },
      );

      // Los seguros declarados. Privado y público conviven: una persona puede
      // estar afiliada a la Caja y tener además una póliza.
      const coverageRepos = {
        catalog: this.insuranceCatalogRepo,
        coverage: this.coverageRepo,
      };
      if (dto.privateInsurancePlanId) {
        await createDeclaredCoverage(coverageRepos, tx, {
          patientProfileId: patient.profileId,
          insurancePlanId: dto.privateInsurancePlanId,
          expectedSector: 'private',
          coverageOrder: 1,
          memberIdentifier: dto.nationalId,
          actorUserId: user.id,
        });
      }
      if (dto.publicInsurancePlanId) {
        await createDeclaredCoverage(coverageRepos, tx, {
          patientProfileId: patient.profileId,
          insurancePlanId: dto.publicInsurancePlanId,
          expectedSector: 'public',
          coverageOrder: 2,
          memberIdentifier: dto.nationalId,
          actorUserId: user.id,
        });
      }

      // El teléfono es independiente del correo: se guarda aunque no haya email.
      if (dto.phone) {
        this.contactPointsRepo.create(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
          ownerId: person.id,
          systemConceptId: CONCEPTS.CONTACT_PHONE,
          value: dto.phone,
          useConceptId: CONCEPTS.CONTACT_USE_HOME,
          actorUserId: user.id,
        });
      }

      let emailVerificationToken: string | undefined;
      if (dto.email) {
        this.contactPointsRepo.create(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
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
        emailVerificationToken = raw;
      }

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        recordedByUserId: user.id,
        ip,
        detailJson: { flow: 'patient-self-registration' },
      });

      return {
        userId: user.id,
        personId: person.id,
        patientProfileId: patient.profileId,
        patientCode,
        emailVerificationToken,
      };
    });

    // El correo se encola FUERA de la transacción del registro: si la mensajería
    // falla, la cuenta ya creada no debe deshacerse — el usuario puede entrar
    // igual, que es justamente el requisito, y el correo se puede reemitir.
    span.setAttribute(APP_ATTR.ENTITY_ID, created.userId);
    span.addEvent('registration.persisted');

    let emailVerificationSent = false;
    if (dto.email && created.emailVerificationToken) {
      emailVerificationSent = await this.sendVerificationEmail(
        created.userId,
        dto.email,
        created.emailVerificationToken,
      );
    }

    span.setAttribute('iam.registration.email_sent', emailVerificationSent);
    this.logger.info(
      { operation: 'iam.auth.register-patient', userId: created.userId },
      'Patient self-registered',
    );
    return {
      userId: created.userId,
      personId: created.personId,
      patientProfileId: created.patientProfileId,
      patientCode: created.patientCode,
      emailVerificationSent,
    };
  }

  /**
   * Consume el token de verificación de correo y marca la cuenta como
   * verificada. Un solo uso: un token consumido o expirado se rechaza.
   *
   * @param dto - Token recibido por correo.
   * @returns El usuario y su nuevo estado de verificación.
   * @throws UnauthorizedException si el token no existe, ya se usó o expiró.
   */
  async verifyEmail(dto: VerifyEmailDto): Promise<VerifyEmailResponseDto> {
    const tokenHash = this.tokenService.hashRefreshToken(dto.token);

    // El caso "expirado" no puede lanzar DENTRO de `em.transactional`: un throw
    // revierte toda la transacción, incluida la propia marca de expiración que
    // se quiere dejar asentada — el registro quedaría en ACTIVE para siempre
    // (el `expiresAt` se revalida en cada intento, así que era inofensivo en la
    // práctica, pero cualquier lectura directa del estado vería tokens
    // "activos" ya vencidos). Por eso este caso devuelve un resultado en vez de
    // lanzar, y el `throw` real ocurre después de que el commit ya se hizo.
    const outcome = await this.em.transactional(async (tx) => {
      const verification = await this.emailVerificationsRepo.findByTokenHash(
        tx,
        tokenHash,
      );
      if (!verification) {
        throw new UnauthorizedException('Token de verificación inválido');
      }
      if (verification.stateConceptId !== CONCEPTS.STATE_ACTIVE) {
        throw new UnauthorizedException(
          'El token de verificación ya fue utilizado',
        );
      }
      if (verification.expiresAt.getTime() < Date.now()) {
        verification.stateConceptId = CONCEPTS.STATE_EXPIRED;
        touch(verification, verification.userId);
        return { expired: true } as const;
      }

      const user = await this.usersRepo.findById(tx, verification.userId);
      if (!user) {
        throw new UnauthorizedException('Token de verificación inválido');
      }

      verification.stateConceptId = CONCEPTS.STATE_VERIFIED;
      verification.consumedAt = new Date();
      touch(verification, user.id);

      user.emailVerified = true;
      touch(user, user.id);

      this.logger.info(
        { operation: 'iam.auth.verify-email', userId: user.id },
        'Email verified',
      );
      return { expired: false, userId: user.id, emailVerified: true } as const;
    });

    if (outcome.expired) {
      throw new UnauthorizedException('El token de verificación expiró');
    }
    return { userId: outcome.userId, emailVerified: outcome.emailVerified };
  }

  /**
   * Encola el correo con el token de verificación.
   *
   * Devuelve si quedó encolado en vez de propagar el error: no poder avisar por
   * correo no invalida un registro que ya es válido sin correo.
   *
   * @param userId - Destinatario interno.
   * @param email - Dirección a la que va el correo.
   * @param token - Token en claro, que sólo viaja en el correo.
   * @returns `true` si la solicitud de notificación quedó registrada.
   */
  private async sendVerificationEmail(
    userId: string,
    email: string,
    token: string,
  ): Promise<boolean> {
    const actor: AuthenticatedUser = { id: userId, roles: [] };
    try {
      await this.notificationsService.createRequest(
        {
          channelId: MESSAGING_SEED.emailChannelId,
          recipientUserId: userId,
          recipientAddress: email,
          payloadJson: {
            subject: 'Verificá tu correo',
            bodyText:
              'Para verificar tu correo, usá este código: ' +
              `${token}\n\nSi no creaste esta cuenta, ignorá este mensaje.`,
          },
        },
        actor,
      );
      return true;
    } catch (error) {
      this.logger.warn(
        { operation: 'iam.auth.register-patient', userId, err: error },
        'Could not enqueue the verification email; the account is usable anyway',
      );
      return false;
    }
  }
}
