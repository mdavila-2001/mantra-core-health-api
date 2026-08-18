import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import {
  APP_ATTR,
  TracingService,
  type TraceSpan,
} from '../../../observability';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  SEED,
  TokenService,
  type AuthenticatedUser,
} from '../../../common';
// El alta administrativa deja al profesional operativo: los roles asistenciales
// viven en `authz`, que es quien decide si un código existe y es asignable.
import { AuthzEffectiveRolesService } from '../../authz/services';
import { MESSAGING_SEED } from '../../../common/seed/messaging-seed.service';
import {
  ADMIN_GENDER_CONCEPT_BY_CODE,
  BIRTH_SEX_CONCEPT_BY_CODE,
  PROF,
} from '../../profiles/profiles.concepts';
import { composeAccountDisplayName } from '../../profiles/person-name';
import {
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  PersonAccountLinksRepository,
  PersonProfilesRepository,
  PersonsRepository,
  PractitionerLanguagesRepository,
  ProfessionalCredentialsRepository,
} from '../../profiles/repositories';
import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../common/repositories';
import { NotificationsService } from '../../messaging/services';
import { DIR } from '../../directory/directory.concepts';
import { TenantMembershipsRepository } from '../../directory/repositories';
import {
  AccountActivationsRepository,
  CredentialsRepository,
  EmailVerificationsRepository,
  SecurityEventsRepository,
  UserGlobalRolesRepository,
  UsersRepository,
} from '../repositories';
import {
  AssistedPractitionerRegistrationDto,
  AssistedPractitionerRegistrationResponseDto,
  RegisterPractitionerDto,
  RegisterPractitionerResponseDto,
} from '../dto';
import { ROLE_CONCEPT_BY_CODE } from './role-mapping';

/** Vida útil del token de verificación de correo (24 h). */
const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Vida útil del token de activación del alta administrativa (72 h).
 *
 * El mismo que el alta asistida de paciente: son el mismo trámite —un tercero
 * crea la cuenta, el titular la reclama— y dos plazos distintos para lo mismo
 * sólo se explicarían por descuido.
 */
const ACTIVATION_TTL_MS = 72 * 60 * 60 * 1000;

/**
 * Auto-registro público de profesionales de salud.
 *
 * Existe por la misma razón que el de organizaciones: obligar a que un
 * administrador cree cada médico convierte el alta en un cuello de botella
 * manual y hace imposible que la plataforma crezca por sí sola. El profesional
 * se registra solo, con su correo como identidad de login.
 *
 * Lo que **no** hace es habilitarlo para ejercer. La licencia se guarda con
 * `AUTH_PENDING`, la credencial con `CRED_PENDING` y el perfil con
 * `PRACT_VERIF_PENDING`: exactamente el mismo estado en el que los deja el alta
 * administrativa (`ProfilesPractitionersService`). Registrarse es declarar una
 * matrícula, no probarla; la verificación sigue siendo un acto de la plataforma.
 * Por eso `acceptsNewPatients` nace en `false` salvo petición explícita.
 *
 * Cruza cuatro módulos —iam (cuenta), profiles (persona, perfil, licencia),
 * common (documento y contacto) y directory (membresía)— en una sola
 * transacción: una cuenta sin perfil profesional, o un perfil sin membresía de
 * tenant, no sirve para nada y obligaría a un flujo de reparación manual.
 */
@Injectable()
export class IamPractitionerSelfRegistrationService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tokenService - Emisor del token de verificación de correo.
   * @param usersRepo - Repositorio de cuentas.
   * @param credentialsRepo - Repositorio de credenciales de autenticación.
   * @param rolesRepo - Repositorio de roles globales.
   * @param emailVerificationsRepo - Repositorio de verificaciones de correo.
   * @param eventsRepo - Repositorio de eventos de seguridad.
   * @param personsRepo - Repositorio de personas.
   * @param personProfilesRepo - Repositorio de clasificación de perfiles.
   * @param practitionersRepo - Repositorio de perfiles profesionales.
   * @param authorizationsRepo - Repositorio de licencias jurisdiccionales.
   * @param professionalCredentialsRepo - Repositorio de títulos profesionales.
   * @param languagesRepo - Repositorio de idiomas de atención.
   * @param accountLinksRepo - Repositorio de vínculos cuenta-persona.
   * @param identifiersRepo - Repositorio de identificadores oficiales.
   * @param contactPointsRepo - Repositorio de puntos de contacto.
   * @param tenantMembershipsRepo - Repositorio de membresías de tenant.
   * @param effectiveRoles - Concesión de roles asistenciales (`authz`).
   * @param notificationsService - Encolado del correo de verificación.
   * @param logger - Logger estructurado.
   * @param tracing - Trazado del span de negocio.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly tokenService: TokenService,
    private readonly activationsRepo: AccountActivationsRepository,
    private readonly usersRepo: UsersRepository,
    private readonly credentialsRepo: CredentialsRepository,
    private readonly rolesRepo: UserGlobalRolesRepository,
    private readonly emailVerificationsRepo: EmailVerificationsRepository,
    private readonly eventsRepo: SecurityEventsRepository,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly professionalCredentialsRepo: ProfessionalCredentialsRepository,
    private readonly languagesRepo: PractitionerLanguagesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly tenantMembershipsRepo: TenantMembershipsRepository,
    private readonly effectiveRoles: AuthzEffectiveRolesService,
    private readonly notificationsService: NotificationsService,
    private readonly logger: PinoLogger,
    private readonly tracing: TracingService,
  ) {
    this.logger.setContext(IamPractitionerSelfRegistrationService.name);
  }

  /**
   * Da de alta al profesional, su persona, su perfil y su licencia.
   *
   * @param dto - Datos de la cuenta, la persona y la matrícula.
   * @param ip - IP de origen, para el evento de seguridad.
   * @returns Identificadores de lo creado y si salió el correo de verificación.
   * @throws ConflictException si el correo ya tiene una credencial activa.
   */
  async registerPractitioner(
    dto: RegisterPractitionerDto,
    ip?: string,
  ): Promise<RegisterPractitionerResponseDto> {
    // Privacidad: el span no lleva correo, nombre ni número de matrícula — sólo
    // los identificadores internos que el alta va creando.
    return this.tracing.runInSpan(
      'iam.practitioner.self-register',
      {
        [APP_ATTR.MODULE]: 'iam',
        [APP_ATTR.OPERATION]: 'practitioner.self-register',
        [APP_ATTR.ENTITY_TYPE]: 'profiles.health_practitioner_profiles',
      },
      (span) =>
        this.performRegisterPractitioner(
          dto,
          span,
          ip,
        ) as Promise<RegisterPractitionerResponseDto>,
    );
  }

  /**
   * Alta de un profesional **por un administrador** (P6).
   *
   * Comparte transacción, invariantes y orden con el autorregistro —el registro
   * CTI atómico de la regla 11— porque es la misma alta: cuenta, persona, perfil
   * profesional, matrícula y título, todo o nada. Lo único que cambia es **quién
   * está delante**, y de ahí salen las dos diferencias:
   *
   * - La cuenta nace PENDIENTE con un token de activación de un solo uso, en vez
   *   de ACTIVA con una contraseña. Un administrador que teclea la clave de otro
   *   crea una credencial compartida desde el primer día.
   * - Se exige un `reason`, que es la trazabilidad C-18 del alta administrativa.
   *
   * La licencia sigue naciendo `PENDING`: registrar a alguien no lo habilita a
   * ejercer, y eso no cambia porque lo cargue un tercero.
   *
   * @param dto - Datos del profesional, sin contraseña, con motivo.
   * @param actor - Administrador que da el alta.
   * @param ip - Origen de la petición, para el evento de seguridad.
   * @returns El alta, más el token de activación y su caducidad.
   */
  async assistedRegisterPractitioner(
    dto: AssistedPractitionerRegistrationDto,
    actor: AuthenticatedUser,
    ip?: string,
  ): Promise<AssistedPractitionerRegistrationResponseDto> {
    return this.tracing.runInSpan(
      'iam.practitioner.assisted-register',
      {
        [APP_ATTR.MODULE]: 'iam',
        [APP_ATTR.OPERATION]: 'practitioner.assisted-register',
        [APP_ATTR.ENTITY_TYPE]: 'profiles.health_practitioner_profiles',
      },
      (span) =>
        this.performRegisterPractitioner(dto, span, ip, {
          actor,
          reason: dto.reason,
          clinicalRoles: dto.clinicalRoles ?? [],
        }) as Promise<AssistedPractitionerRegistrationResponseDto>,
    );
  }

  /**
   * Registro propiamente dicho. Se extrajo para que `registerPractitioner` sea
   * sólo la declaración del span de negocio.
   */
  private async performRegisterPractitioner(
    dto: RegisterPractitionerDto | AssistedPractitionerRegistrationDto,
    span: TraceSpan,
    ip?: string,
    asistido?: {
      actor: AuthenticatedUser;
      reason: string;
      clinicalRoles: string[];
    },
  ): Promise<
    | RegisterPractitionerResponseDto
    | AssistedPractitionerRegistrationResponseDto
  > {
    this.logger.info(
      { operation: 'iam.auth.register-practitioner' },
      'Practitioner self-registration',
    );

    const created = await this.em.transactional(async (tx) => {
      // El correo es la identidad de login: comprobarlo antes de escribir nada
      // convierte una violación de constraint (500) en un 409 explicativo.
      const clash = await this.credentialsRepo.findLivePasswordBySubject(
        tx,
        dto.email,
      );
      if (clash) {
        this.logger.warn(
          {
            operation: 'iam.auth.register-practitioner',
            reason: 'email-in-use',
          },
          'Rejected self-registration: email already registered',
        );
        throw new ConflictException('Ya existe una cuenta con ese correo');
      }

      const practitionerCode = `PRC-${randomUUID()}`;
      const clashCode = await this.practitionersRepo.findByCode(
        tx,
        practitionerCode,
      );
      if (clashCode) {
        throw new ConflictException('El practitioner_code ya está en uso', {
          practitionerCode,
        });
      }

      // El nombre para mostrar sale de las partes; si el cliente mandó la forma
      // anterior, manda esa. Se calcula UNA vez y se usa en las dos filas
      // -la cuenta y la persona- para que no puedan divergir.
      const displayName = composeAccountDisplayName(dto);

      // 1) La cuenta. En el autorregistro nace ACTIVA porque el titular está
      // presente y fija su propia contraseña. En el alta administrativa nace
      // PENDIENTE: quien la crea no puede elegir la clave de otro, así que se
      // emite un token de activación y el titular la fija al entrar.
      const user = this.usersRepo.create(tx, {
        displayName,
        statusConceptId: asistido
          ? CONCEPTS.STATE_PENDING
          : CONCEPTS.USER_ACTIVE,
        mfaStatusConceptId: CONCEPTS.MFA_DISABLED,
        timeZone: dto.timeZone,
        ...(asistido ? { mustChangePassword: true } : {}),
      });
      // Las FK son columnas uuid planas: persistir el padre antes de los hijos.
      await tx.flush();

      if (asistido) {
        // Reserva el login sin secreto: nadie puede entrar hasta que el titular
        // consuma el token y elija su contraseña.
        this.credentialsRepo.createPendingPassword(tx, {
          userId: user.id,
          externalSubject: dto.email,
          actorUserId: asistido.actor.id,
        });
      } else {
        this.credentialsRepo.createPassword(tx, {
          userId: user.id,
          externalSubject: dto.email,
          secretHash: await argon2.hash(
            (dto as RegisterPractitionerDto).password,
          ),
          actorUserId: user.id,
        });
      }
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE.USER,
        actorUserId: user.id,
      });
      // `PRACTITIONER` en la misma transacción: quien entra por esta vía **es**
      // un profesional, y sin el rol su propia agenda le responde 403 —
      // `GET /scheduling/resources` lo exige—. Era el mismo agujero que tenía
      // `PATIENT`: sin concedérselo, el claim `roles` nunca podía contenerlo.
      //
      // `CLINICIAN` **no** se concede acá, y la diferencia importa: abre el
      // expediente de un paciente, que es PHI. La matrícula nace `PENDING` y
      // declararla no es probarla, así que ese rol lo concede un administrador
      // — el acto que sí la verifica.
      this.rolesRepo.create(tx, {
        userId: user.id,
        roleConceptId: ROLE_CONCEPT_BY_CODE.PRACTITIONER,
        actorUserId: user.id,
      });

      // 2) Persona con sus datos demográficos. El código legible del DTO se
      // traduce aquí al concepto de terminología que persiste la columna.
      const person = this.personsRepo.create(tx, {
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
        sexAtBirthConceptId: dto.sexAtBirth
          ? BIRTH_SEX_CONCEPT_BY_CODE[dto.sexAtBirth]
          : undefined,
        actorUserId: user.id,
      });
      await tx.flush();

      this.personProfilesRepo.create(tx, {
        personId: person.id,
        profileTypeConceptId: PROF.PROFILE_TYPE_PRACTITIONER,
        statusConceptId: PROF.PROFILE_ACTIVE,
        actorUserId: user.id,
      });
      await tx.flush();

      // 3) Perfil profesional. `health_practitioner_profiles.profile_id` ES
      // `persons.id` (ver ProfilesPractitionersService), no un id propio.
      const practitioner = this.practitionersRepo.create(tx, {
        profileId: person.id,
        practitionerCode,
        practitionerCategoryConceptId:
          dto.practitionerCategoryConceptId ?? PROF.PRACT_CATEGORY_GENERAL,
        professionalTitle: dto.professionalTitle,
        // PENDIENTE de verificación: el alta declara la matrícula, no la prueba.
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        acceptsNewPatients: dto.acceptsNewPatients ?? false,
        actorUserId: user.id,
      });
      await tx.flush();

      // 4) Licencia y título, ambos pendientes de validación.
      const license = this.authorizationsRepo.create(tx, {
        practitionerProfileId: person.id,
        jurisdictionConceptId:
          dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
        licenseNumber: dto.licenseNumber,
        regulatoryAuthority: dto.regulatoryAuthority,
        stateConceptId: PROF.AUTH_PENDING,
        actorUserId: user.id,
      });
      const credential = this.professionalCredentialsRepo.create(tx, {
        practitionerProfileId: person.id,
        credentialTypeConceptId:
          dto.credentialTypeConceptId ?? PROF.CREDENTIAL_TYPE_DEGREE,
        number: dto.credentialNumber,
        stateConceptId: PROF.CRED_PENDING,
        actorUserId: user.id,
      });
      this.languagesRepo.create(tx, {
        practitionerProfileId: person.id,
        languageConceptId: dto.languageConceptId ?? PROF.LANGUAGE_SPANISH,
        proficiencyConceptId: PROF.LANG_PROFICIENCY_NATIVE,
        clinicalInterpretationAllowed: true,
        actorUserId: user.id,
      });
      await tx.flush();

      // 5) Vínculo cuenta-persona: el titular es él mismo.
      this.accountLinksRepo.create(tx, {
        personId: person.id,
        userId: user.id,
        linkTypeConceptId: PROF.ACCOUNT_LINK_SELF,
        verificationStatusConceptId: PROF.ACCOUNT_LINK_VERIFIED,
        statusConceptId: PROF.ACCOUNT_LINK_ACTIVE,
        validFrom: new Date(),
        actorUserId: user.id,
      });

      if (dto.nationalId) {
        this.identifiersRepo.create(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
          ownerId: person.id,
          typeConceptId: CONCEPTS.ID_TYPE_NATIONAL,
          value: dto.nationalId,
          useConceptId: CONCEPTS.USE_OFFICIAL,
          stateConceptId: CONCEPTS.STATE_ACTIVE,
          actorUserId: user.id,
        });
      }

      // 6) Contacto: el correo siempre, el teléfono si lo aportó.
      this.contactPointsRepo.create(tx, {
        ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
        ownerId: person.id,
        systemConceptId: CONCEPTS.CONTACT_EMAIL,
        value: dto.email,
        useConceptId: CONCEPTS.CONTACT_USE_WORK,
        actorUserId: user.id,
      });
      if (dto.phone) {
        this.contactPointsRepo.create(tx, {
          ownerTypeConceptId: CONCEPTS.OWNER_PATIENT,
          ownerId: person.id,
          systemConceptId: CONCEPTS.CONTACT_PHONE,
          value: dto.phone,
          useConceptId: CONCEPTS.CONTACT_USE_WORK,
          actorUserId: user.id,
        });
      }

      // 7) Membresía en el tenant por defecto. Sin esta fila,
      // `TenantContextInterceptor` rechaza con 403 cualquier request posterior
      // del profesional: la cuenta quedaría inutilizable más allá del login.
      // Cuando se incorpore a una organización real, esa alta le dará su propia
      // membresía; ésta es el mínimo para que la cuenta funcione desde el día 1.
      this.tenantMembershipsRepo.create(tx, {
        userId: user.id,
        tenantId: SEED.tenantId,
        tenantRoleConceptId: DIR.ROLE_STAFF,
        statusConceptId: DIR.MEMBERSHIP_ACTIVE,
        accessScopeConceptId: DIR.SCOPE_ALL_TENANT,
        startDate: new Date(),
        actorUserId: user.id,
      });

      // 8) Verificación del correo. No condiciona el acceso.
      const { raw, hash } = this.tokenService.issueRefreshToken();
      this.emailVerificationsRepo.create(tx, {
        userId: user.id,
        email: dto.email,
        tokenHash: hash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        actorUserId: user.id,
      });

      // Roles asistenciales del alta administrativa. Van dentro de la misma
      // transacción que la cuenta: un rol concedido a un alta que después se
      // deshace sería un privilegio sin sujeto detrás. El autorregistro no pasa
      // por aquí (`asistido` es nulo) porque nadie ha validado quién solicita.
      const rolesConcedidos: string[] = [];
      const rolesRechazados: string[] = [];
      if (asistido) {
        for (const code of asistido.clinicalRoles) {
          const ok = await this.effectiveRoles.ensureRoleByCode(
            tx,
            user.id,
            code,
            { tenantId: SEED.tenantId, actorUserId: asistido.actor.id },
          );
          (ok ? rolesConcedidos : rolesRechazados).push(code);
        }
        if (rolesRechazados.length > 0) {
          // Fallar el alta entera es lo correcto: devolver 201 con la mitad de
          // los roles deja al administrador creyendo que el profesional quedó
          // operativo, y el fallo aparecería mucho más tarde como un 403 suelto.
          throw new PreconditionFailedException(
            'Alguno de los roles indicados no existe o no es asignable',
            { roles: rolesRechazados },
          );
        }
      }

      this.eventsRepo.record(tx, {
        eventTypeConceptId: CONCEPTS.SEC_ROLE_GRANT,
        outcomeConceptId: CONCEPTS.OUTCOME_SUCCESS,
        userId: user.id,
        recordedByUserId: user.id,
        ip,
        detailJson: {
          flow: asistido
            ? 'practitioner-assisted-registration'
            : 'practitioner-self-registration',
          ...(rolesConcedidos.length > 0
            ? { clinicalRoles: rolesConcedidos }
            : {}),
        },
      });

      // Token de activación de un solo uso, sólo en el alta administrativa: es
      // lo único que el administrador entrega al titular. Del lado del servidor
      // vive únicamente su hash.
      const activacion = asistido
        ? (() => {
            const par = this.tokenService.issueRefreshToken();
            const expiresAt = new Date(Date.now() + ACTIVATION_TTL_MS);
            this.activationsRepo.create(tx, {
              userId: user.id,
              tokenHash: par.hash,
              expiresAt,
              reason: asistido.reason,
              actorUserId: asistido.actor.id,
            });
            return { token: par.raw, expiresAt };
          })()
        : null;

      return {
        userId: user.id,
        personId: person.id,
        practitionerProfileId: practitioner.profileId,
        practitionerCode,
        licenseId: license.id,
        credentialId: credential.id,
        emailVerificationToken: raw,
        activacion,
        clinicalRoles: rolesConcedidos,
      };
    });

    // El correo se encola FUERA de la transacción: si la mensajería falla, la
    // cuenta ya creada no debe deshacerse — el profesional puede entrar igual.
    span.setAttribute(APP_ATTR.ENTITY_ID, created.practitionerProfileId);
    span.addEvent('registration.persisted');

    const emailVerificationSent = await this.sendVerificationEmail(
      created.userId,
      dto.email,
      created.emailVerificationToken,
    );

    span.setAttribute('iam.registration.email_sent', emailVerificationSent);
    this.logger.info(
      { operation: 'iam.auth.register-practitioner', userId: created.userId },
      'Practitioner self-registered',
    );

    return {
      userId: created.userId,
      personId: created.personId,
      practitionerProfileId: created.practitionerProfileId,
      practitionerCode: created.practitionerCode,
      licenseId: created.licenseId,
      credentialId: created.credentialId,
      verificationStatus: 'PENDING',
      emailVerificationSent,
      ...(created.clinicalRoles.length > 0
        ? { clinicalRoles: created.clinicalRoles }
        : {}),
      ...(created.activacion === null
        ? {}
        : {
            activationToken: created.activacion.token,
            activationExpiresAt: created.activacion.expiresAt,
          }),
    };
  }

  /**
   * Encola el correo de verificación sin dejar que su fallo tumbe el alta.
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
            subject: 'Verificá tu correo profesional',
            bodyText:
              'Para verificar tu correo, usá este código: ' +
              `${token}\n\nTu matrícula quedó registrada y está pendiente de ` +
              'verificación por parte de la plataforma.',
          },
        },
        actor,
      );
      return true;
    } catch (error) {
      this.logger.warn(
        { operation: 'iam.auth.register-practitioner', userId, err: error },
        'Could not enqueue the verification email; the practitioner is registered anyway',
      );
      return false;
    }
  }
}
