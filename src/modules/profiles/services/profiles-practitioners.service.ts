import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { PROF } from '../profiles.concepts';
import {
  PersonsRepository,
  PersonProfilesRepository,
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  ProfessionalCredentialsRepository,
  PractitionerSpecialtiesRepository,
  PractitionerLanguagesRepository,
} from '../repositories';
import {
  CreatePractitionerDto,
  PractitionerResponseDto,
  CreateJurisdictionAuthorizationDto,
  JurisdictionAuthorizationResponseDto,
  VerifyCredentialDto,
  CredentialResponseDto,
  AddSpecialtyDto,
  SpecialtyResponseDto,
} from '../dto';

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
  constructor(
    private readonly em: EntityManager,
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly credentialsRepo: ProfessionalCredentialsRepository,
    private readonly specialtiesRepo: PractitionerSpecialtiesRepository,
    private readonly languagesRepo: PractitionerLanguagesRepository,
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
      const clash = await this.practitionersRepo.findByCode(tx, dto.practitionerCode);
      if (clash) {
        throw new ConflictException('El practitioner_code ya está en uso', {
          practitionerCode: dto.practitionerCode,
        });
      }

      // Persona: reutilizar la indicada o crear una nueva.
      let personId = dto.personId;
      if (personId) {
        const existing = await this.personsRepo.findById(tx, personId);
        if (!existing) throw new ResourceNotFoundException('Persona no encontrada', { personId });
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
        jurisdictionConceptId: dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
        licenseNumber: dto.licenseNumber,
        regulatoryAuthority: dto.regulatoryAuthority,
        stateConceptId: PROF.AUTH_PENDING,
        actorUserId: actor.id,
      });
      const credential = this.credentialsRepo.create(tx, {
        practitionerProfileId: personId,
        credentialTypeConceptId: dto.credentialTypeConceptId ?? PROF.CREDENTIAL_TYPE_DEGREE,
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
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', { profileId });
      }

      const authorization = this.authorizationsRepo.create(tx, {
        practitionerProfileId: profileId,
        jurisdictionConceptId: dto.jurisdictionConceptId ?? PROF.JURISDICTION_NATIONAL,
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
    this.logger.info({ operation: 'profiles.credential.verify', credentialId }, 'Verifying credential');
    return this.em.transactional(async (tx) => {
      const credential = await this.credentialsRepo.findById(tx, credentialId);
      if (!credential) {
        throw new ResourceNotFoundException('Credencial no encontrada', { credentialId });
      }
      if (credential.stateConceptId !== PROF.CRED_PENDING) {
        throw new PreconditionFailedException('La credencial no está pendiente de verificación', {
          credentialId,
        });
      }

      const now = new Date();
      const verified = dto.decision === 'VERIFIED';
      credential.stateConceptId = verified ? PROF.CRED_VERIFIED : PROF.CRED_REJECTED;
      credential.verifiedByUserId = actor.id;
      credential.verifiedAt = now;
      if (dto.verificationSourceUri) credential.verificationSourceUri = dto.verificationSourceUri;
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
            practitioner.verificationStatusConceptId = PROF.PRACT_VERIF_VERIFIED;
            practitioner.practiceStatusConceptId = PROF.PRACTICE_ACTIVE;
            practitioner.acceptsNewPatients = true;
            touch(practitioner, actor.id);
            practitionerVerified = true;
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
    this.logger.info({ operation: 'profiles.specialty.add', profileId }, 'Adding specialty');
    return this.em.transactional(async (tx) => {
      const practitioner = await this.practitionersRepo.findById(tx, profileId);
      if (!practitioner) {
        throw new ResourceNotFoundException('Profesional no encontrado', { profileId });
      }

      if (dto.supportingCredentialId) {
        const credential = await this.credentialsRepo.findById(tx, dto.supportingCredentialId);
        if (!credential || credential.practitionerProfileId !== profileId) {
          throw new PreconditionFailedException(
            'La credencial de soporte no pertenece al profesional',
            { supportingCredentialId: dto.supportingCredentialId },
          );
        }
        if (credential.stateConceptId !== PROF.CRED_VERIFIED) {
          throw new PreconditionFailedException('La credencial de soporte no está verificada', {
            supportingCredentialId: dto.supportingCredentialId,
          });
        }
      }

      const specialtyConceptId = dto.specialtyConceptId ?? PROF.SPECIALTY_GENERAL;
      const duplicate = await this.specialtiesRepo.findActive(tx, profileId, specialtyConceptId);
      if (duplicate) {
        throw new ConflictException('El profesional ya tiene esa especialidad activa', {
          profileId,
          specialtyConceptId,
        });
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
}
