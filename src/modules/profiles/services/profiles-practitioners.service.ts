import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  getCurrentTenantId,
  touch,
  type AuthenticatedUser,
} from '../../../common';
// Verificar la matrícula es lo que habilita a ejercer; el rol con el que se
// ejerce lo custodia `authz`.
import { AuthzEffectiveRolesService } from '../../authz/services';
import { PROF } from '../profiles.concepts';
import {
  PersonsRepository,
  PersonProfilesRepository,
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  ProfessionalCredentialsRepository,
  PractitionerSpecialtiesRepository,
  PractitionerLanguagesRepository,
  PractitionerAffiliationsRepository,
  PersonAccountLinksRepository,
} from '../repositories';
import type { PractitionerAffiliations } from '../entities';
import {
  CreatePractitionerDto,
  PractitionerResponseDto,
  CreateJurisdictionAuthorizationDto,
  JurisdictionAuthorizationResponseDto,
  VerifyCredentialDto,
  CredentialResponseDto,
  AddSpecialtyDto,
  SpecialtyResponseDto,
  CreateAffiliationDto,
  AffiliationResponseDto,
  ListAffiliationsResponseDto,
} from '../dto';
import { ProfileOwnershipService } from './profile-ownership.service';

/**
 * Casos de uso de la fuerza laboral de salud (regla GENERALIST): onboarding
 * (UC-05-03), autorización jurisdiccional (UC-05-04), verificación de credencial
 * (UC-05-05) y alta de especialidad (UC-05-06).
 *
 * Todas las escrituras son `em.transactional` con `flush` padre-antes-de-hijo,
 * porque las FK son columnas uuid planas y MikroORM no ordena inserts.
 */
@Injectable()
export class ProfilesPractitionersService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param personsRepo - Valor de persons repo requerido por la operación.
   * @param personProfilesRepo - Valor de person profiles repo requerido por la operación.
   * @param practitionersRepo - Valor de practitioners repo requerido por la operación.
   * @param authorizationsRepo - Valor de authorizations repo requerido por la operación.
   * @param credentialsRepo - Valor de credentials repo requerido por la operación.
   * @param specialtiesRepo - Valor de specialties repo requerido por la operación.
   * @param languagesRepo - Valor de languages repo requerido por la operación.
   * @param affiliationsRepo - Historial laboral (afiliaciones institucionales).
   * @param accountLinksRepo - Vínculo persona-cuenta del titular del perfil.
   * @param effectiveRoles - Concesión de roles asistenciales (`authz`).
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly credentialsRepo: ProfessionalCredentialsRepository,
    private readonly specialtiesRepo: PractitionerSpecialtiesRepository,
    private readonly languagesRepo: PractitionerLanguagesRepository,
    private readonly affiliationsRepo: PractitionerAffiliationsRepository,
    private readonly ownership: ProfileOwnershipService,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly effectiveRoles: AuthzEffectiveRolesService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ProfilesPractitionersService.name);
  }

  /** UC-05-03: onboarding de profesional con su primera licencia y credencial de soporte. */
  async onboardPractitioner(
    dto: CreatePractitionerDto,
    actor: AuthenticatedUser,
  ): Promise<PractitionerResponseDto> {
    this.logger.info(
      { operation: 'profiles.practitioner.onboard', actorId: actor.id },
      'Onboarding practitioner',
    );
    return this.em.transactional(async (tx) => {
      const clash = await this.practitionersRepo.findByCode(
        tx,
        dto.practitionerCode,
      );
      if (clash) {
        throw new ConflictException('El practitioner_code ya está en uso', {
          practitionerCode: dto.practitionerCode,
        });
      }

      // Persona: reutilizar la indicada o crear una nueva.
      let personId = dto.personId;
      if (personId) {
        const existing = await this.personsRepo.findById(tx, personId);
        if (!existing)
          throw new ResourceNotFoundException('Persona no encontrada', {
            personId,
          });
      } else {
        const person = this.personsRepo.create(tx, {
          personStatusConceptId: PROF.PERSON_ACTIVE,
          vitalStatusConceptId: PROF.VITAL_ALIVE,
          displayName: dto.displayName,
          actorUserId: actor.id,
        });
        await tx.flush();
        personId = person.id;
      }

      // person_profiles clasifica a la persona (uq_person_profiles_person_type),
      // pero NO es el destino de la FK del subtipo: health_practitioner_profiles.profile_id
      // referencia profiles.persons(id), así que el perfil profesional usa person.id.
      this.personProfilesRepo.create(tx, {
        personId,
        profileTypeConceptId: PROF.PROFILE_TYPE_PRACTITIONER,
        statusConceptId: PROF.PROFILE_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      const practitioner = this.practitionersRepo.create(tx, {
        profileId: personId,
        practitionerCode: dto.practitionerCode,
        practitionerCategoryConceptId:
          dto.practitionerCategoryConceptId ?? PROF.PRACT_CATEGORY_GENERAL,
        professionalTitle: dto.professionalTitle,
        verificationStatusConceptId: PROF.PRACT_VERIF_PENDING,
        practiceStatusConceptId: PROF.PRACTICE_ONBOARDING,
        acceptsNewPatients: false,
        actorUserId: actor.id,
      });
      await tx.flush();

      // Licencia inicial (UC-05-04) + credencial de soporte (verificable UC-05-05).
      const license = this.authorizationsRepo.create(tx, {
        practitionerProfileId: personId,
        jurisdictionConceptId:
          dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
        licenseNumber: dto.licenseNumber,
        regulatoryAuthority: dto.regulatoryAuthority,
        stateConceptId: PROF.AUTH_PENDING,
        actorUserId: actor.id,
      });
      const credential = this.credentialsRepo.create(tx, {
        practitionerProfileId: personId,
        credentialTypeConceptId:
          dto.credentialTypeConceptId ?? PROF.CREDENTIAL_TYPE_DEGREE,
        number: dto.credentialNumber,
        stateConceptId: PROF.CRED_PENDING,
        actorUserId: actor.id,
      });
      this.languagesRepo.create(tx, {
        practitionerProfileId: personId,
        languageConceptId: dto.languageConceptId ?? PROF.LANGUAGE_SPANISH,
        proficiencyConceptId: PROF.LANG_PROFICIENCY_NATIVE,
        clinicalInterpretationAllowed: true,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        { operation: 'profiles.practitioner.onboard', profileId: personId },
        'Practitioner onboarded',
      );
      return {
        profileId: practitioner.profileId,
        personId,
        practitionerCode: practitioner.practitionerCode,
        verificationStatus: practitioner.verificationStatusConceptId,
        practiceStatus: practitioner.practiceStatusConceptId,
        licenseId: license.id,
        credentialId: credential.id,
        createdAt: practitioner.createdAt,
      };
    });
  }

  /** UC-05-04: registra/renueva una autorización jurisdiccional (licencia). */
  async addJurisdictionAuthorization(
    profileId: string,
    dto: CreateJurisdictionAuthorizationDto,
    actor: AuthenticatedUser,
  ): Promise<JurisdictionAuthorizationResponseDto> {
    this.logger.info(
      { operation: 'profiles.authorization.add', profileId },
      'Adding jurisdiction authorization',
    );
    return this.em.transactional(async (tx) => {
      // El titular administra lo suyo: sin esto, un profesional auto-registrado no
      // podía crear la matrícula que su propia verificación exige.
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', {
          profileId,
        });
      }

      const authorization = this.authorizationsRepo.create(tx, {
        practitionerProfileId: profileId,
        jurisdictionConceptId:
          dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
        licenseNumber: dto.licenseNumber,
        regulatoryAuthority: dto.regulatoryAuthority,
        practiceScopeConceptId: dto.practiceScopeConceptId,
        stateConceptId: PROF.AUTH_ACTIVE,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : undefined,
        validTo: dto.validTo ? new Date(dto.validTo) : undefined,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: authorization.id,
        practitionerProfileId: profileId,
        licenseNumber: authorization.licenseNumber,
        state: authorization.stateConceptId,
        createdAt: authorization.createdAt,
      };
    });
  }

  /** UC-05-05: verifica (o rechaza) una credencial; recomputa el estado del profesional. */
  async verifyCredential(
    credentialId: string,
    dto: VerifyCredentialDto,
    actor: AuthenticatedUser,
  ): Promise<CredentialResponseDto> {
    // Verificar una matrícula sin declarar contra QUÉ se verificó no es una
    // verificación: es una afirmación. Y de esta credencial depende que el
    // profesional quede habilitado para ejercer, así que la fuente consultada
    // -el registro del colegio médico, la resolución de la autoridad- es el
    // único rastro que permite auditar después si la habilitación era legítima.
    //
    // Rechazar sí puede ir sin fuente: se rechaza por defectos de forma del
    // propio documento, sin necesidad de consultar a nadie. Mismo criterio
    // asimétrico que `OutboxService.ackDelivery`, donde solo el acuse fallido
    // está obligado a declarar qué falló.
    if (dto.decision === 'VERIFIED' && !dto.verificationSourceUri?.trim()) {
      throw new PreconditionFailedException(
        'Una credencial verificada debe declarar la fuente consultada',
        { credentialId },
      );
    }

    this.logger.info(
      { operation: 'profiles.credential.verify', credentialId },
      'Verifying credential',
    );
    return this.em.transactional(async (tx) => {
      const credential = await this.credentialsRepo.findById(tx, credentialId);
      if (!credential) {
        throw new ResourceNotFoundException('Credencial no encontrada', {
          credentialId,
        });
      }
      if (credential.stateConceptId !== PROF.CRED_PENDING) {
        throw new PreconditionFailedException(
          'La credencial no está pendiente de verificación',
          {
            credentialId,
          },
        );
      }

      const now = new Date();
      const verified = dto.decision === 'VERIFIED';
      credential.stateConceptId = verified
        ? PROF.CRED_VERIFIED
        : PROF.CRED_REJECTED;
      credential.verifiedByUserId = actor.id;
      credential.verifiedAt = now;
      if (dto.verificationSourceUri)
        credential.verificationSourceUri = dto.verificationSourceUri;
      touch(credential, actor.id);

      // Si al verificar no quedan credenciales pendientes, habilita el perfil.
      let practitionerVerified = false;
      if (verified) {
        const pending = await this.credentialsRepo.countInStateExcept(
          tx,
          credential.practitionerProfileId,
          PROF.CRED_PENDING,
          credentialId,
        );
        if (pending === 0) {
          const practitioner = await this.practitionersRepo.findById(
            tx,
            credential.practitionerProfileId,
          );
          if (practitioner) {
            practitioner.verificationStatusConceptId =
              PROF.PRACT_VERIF_VERIFIED;
            practitioner.practiceStatusConceptId = PROF.PRACTICE_ACTIVE;
            practitioner.acceptsNewPatients = true;
            touch(practitioner, actor.id);
            practitionerVerified = true;

            // Habilitado para ejercer y sin rol con el que hacerlo es un estado
            // que no sirve a nadie: hasta aquí, el profesional recién verificado
            // seguía recibiendo 403 en todo endpoint clínico porque su token
            // sólo llevaba `USER`. Se le concede `PRACTITIONER`, que es
            // exactamente lo que la verificación acaba de acreditar; los roles
            // más específicos (`SURGEON`, `ANESTHESIOLOGIST`…) siguen siendo
            // decisión explícita de un administrador, porque la matrícula no
            // dice en qué equipo trabaja.
            //
            // Es fail-closed: el rol llega tras una verificación con fuente
            // declarada, no por el mero hecho de registrarse.
            const link = await this.accountLinksRepo.findActiveByPerson(
              tx,
              credential.practitionerProfileId,
            );
            if (link) {
              const granted = await this.effectiveRoles.ensureRoleByCode(
                tx,
                link.userId,
                'PRACTITIONER',
                { tenantId: getCurrentTenantId(), actorUserId: actor.id },
              );
              if (!granted) {
                // No se rompe la verificación —que es correcta— pero tampoco se
                // oculta: sin el catálogo de roles sembrado, el profesional
                // quedará verificado y sin poder ejercer.
                this.logger.warn(
                  {
                    operation: 'profiles.credential.verify',
                    practitionerProfileId: credential.practitionerProfileId,
                    roleCode: 'PRACTITIONER',
                  },
                  'Profesional verificado sin rol asistencial: el rol no existe o no es asignable',
                );
              }
            }
          }
        }
      }
      await tx.flush();

      return {
        id: credential.id,
        state: credential.stateConceptId,
        verifiedAt: credential.verifiedAt,
        practitionerVerified,
      };
    });
  }

  /** UC-05-06: agrega una especialidad con credencial de soporte verificada. */
  async addSpecialty(
    profileId: string,
    dto: AddSpecialtyDto,
    actor: AuthenticatedUser,
  ): Promise<SpecialtyResponseDto> {
    this.logger.info(
      { operation: 'profiles.specialty.add', profileId },
      'Adding specialty',
    );
    return this.em.transactional(async (tx) => {
      // El titular administra lo suyo: sin esto, un profesional auto-registrado no
      // podía crear la matrícula que su propia verificación exige.
      await this.ownership.assertOwnsPractitionerProfile(tx, profileId, actor);
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', {
          profileId,
        });
      }

      if (dto.supportingCredentialId) {
        const credential = await this.credentialsRepo.findById(
          tx,
          dto.supportingCredentialId,
        );
        if (!credential || credential.practitionerProfileId !== profileId) {
          throw new PreconditionFailedException(
            'La credencial de soporte no pertenece al profesional',
            { supportingCredentialId: dto.supportingCredentialId },
          );
        }
        if (credential.stateConceptId !== PROF.CRED_VERIFIED) {
          throw new PreconditionFailedException(
            'La credencial de soporte no está verificada',
            {
              supportingCredentialId: dto.supportingCredentialId,
            },
          );
        }
      }

      const specialtyConceptId =
        dto.specialtyConceptId ?? PROF.SPECIALTY_GENERAL;
      const duplicate = await this.specialtiesRepo.findActive(
        tx,
        profileId,
        specialtyConceptId,
      );
      if (duplicate) {
        throw new ConflictException(
          'El profesional ya tiene esa especialidad activa',
          {
            profileId,
            specialtyConceptId,
          },
        );
      }

      const now = new Date();
      if (dto.isPrimary) {
        await this.specialtiesRepo.demotePrimary(tx, profileId, now);
      }

      const specialty = this.specialtiesRepo.create(tx, {
        practitionerProfileId: profileId,
        specialtyConceptId,
        supportingCredentialId: dto.supportingCredentialId,
        specialtyRoleConceptId: dto.specialtyRoleConceptId,
        isPrimary: dto.isPrimary ?? false,
        boardCertified: dto.boardCertified ?? false,
        verificationStatusConceptId: PROF.SPEC_VERIF_PENDING,
        validFrom: now,
        actorUserId: actor.id,
      });
      await tx.flush();

      return {
        id: specialty.id,
        specialtyConceptId: specialty.specialtyConceptId,
        isPrimary: specialty.isPrimary ?? false,
        verificationStatus: specialty.verificationStatusConceptId,
        createdAt: specialty.createdAt,
      };
    });
  }

  /* -- UC-05-16: historial laboral del profesional -------------------------- */

  /**
   * El historial laboral propio (UC-05-16·L).
   *
   * Autoservicio: el sujeto sale de la sesión. El módulo ya sabía dónde se
   * **formó** el profesional (`professional_credentials`) y qué puede
   * **ejercer** (licencias y especialidades), pero no dónde **trabajó**, que es
   * lo que el cliente pidió por nombre —«hospitales o entidades médicas»—.
   *
   * @param actor - Quien consulta su propio historial.
   * @returns Sus afiliaciones, de la más reciente a la más antigua.
   */
  async listOwnAffiliations(
    actor: AuthenticatedUser,
  ): Promise<ListAffiliationsResponseDto> {
    const em = this.em.fork();
    const profileId = await this.ownership.requireOwnPractitionerProfileId(
      em,
      actor,
    );
    const rows = await this.affiliationsRepo.findByPractitioner(em, profileId);
    const items = rows.map((row) => toAffiliation(row));
    return { items, count: items.length };
  }

  /**
   * Agrega una afiliación institucional al historial propio (UC-05-16).
   *
   * Dos reglas, y ninguna es de prudencia genérica:
   *
   * - **El fin no puede preceder al inicio.** Un período invertido no es un dato
   *   dudoso, es un dato imposible, y ordenar el currículum por fecha lo
   *   colocaría en cualquier lado.
   * - **Misma institución, mismo cargo y mismo inicio responde `409`.** Volver a
   *   trabajar en el mismo hospital años después es cierto y se registra; lo que
   *   se rechaza es el doble envío del formulario, que se distingue por empezar
   *   el mismo día.
   *
   * Lo que **no** se valida es que la institución exista en la plataforma: la
   * mayoría no está, y exigirlo convertiría un dato de currículum en un alta de
   * organizaciones.
   *
   * @param dto - Institución, cargo y período.
   * @param actor - El profesional titular del historial.
   * @returns La afiliación registrada.
   */
  async addOwnAffiliation(
    dto: CreateAffiliationDto,
    actor: AuthenticatedUser,
  ): Promise<AffiliationResponseDto> {
    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    if (endDate && endDate < startDate) {
      throw new PreconditionFailedException(
        'El fin del vínculo no puede ser anterior a su inicio',
        { startDate: dto.startDate, endDate: dto.endDate },
      );
    }

    this.logger.info(
      { operation: 'profiles.affiliation.add', actorId: actor.id },
      'Adding practitioner affiliation',
    );
    return this.em.transactional(async (tx) => {
      const profileId = await this.ownership.requireOwnPractitionerProfileId(
        tx,
        actor,
      );

      const organizationName = dto.organizationName.trim();
      const roleTitle = dto.roleTitle.trim();
      const duplicate = await this.affiliationsRepo.findSame(
        tx,
        profileId,
        organizationName,
        roleTitle,
        startDate,
      );
      if (duplicate) {
        throw new ConflictException(
          'Ese vínculo ya está en el historial laboral',
          { organizationName, roleTitle, startDate: dto.startDate },
        );
      }

      const affiliation = this.affiliationsRepo.create(tx, {
        practitionerProfileId: profileId,
        organizationName,
        roleTitle,
        departmentText: dto.departmentText?.trim() || undefined,
        practiceSiteId: dto.practiceSiteId,
        affiliationTypeConceptId:
          dto.affiliationTypeConceptId ?? PROF.AFFILIATION_TYPE_EMPLOYMENT,
        startDate,
        endDate,
        statusConceptId: PROF.AFFILIATION_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();

      this.logger.info(
        {
          operation: 'profiles.affiliation.add',
          affiliationId: affiliation.id,
        },
        'Practitioner affiliation added',
      );
      return toAffiliation(affiliation);
    });
  }
}

/**
 * Proyecta la fila al contrato de lectura.
 *
 * `current` se deriva acá y no se guarda: una columna «sigue trabajando ahí»
 * sería un dato que envejece solo y que habría que recalcular cada vez que
 * alguien cierra un período. La fecha ya lo dice.
 */
function toAffiliation(row: PractitionerAffiliations): AffiliationResponseDto {
  return {
    id: row.id,
    practitionerProfileId: row.practitionerProfileId,
    organizationName: row.organizationName,
    roleTitle: row.roleTitle,
    departmentText: row.departmentText ?? null,
    practiceSiteId: row.practiceSiteId ?? null,
    affiliationTypeConceptId: row.affiliationTypeConceptId ?? null,
    startDate: row.startDate,
    endDate: row.endDate ?? null,
    current: row.endDate === undefined || row.endDate === null,
    status: row.statusConceptId,
    createdAt: row.createdAt,
  };
}
