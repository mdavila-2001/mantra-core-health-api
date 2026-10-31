import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../../common/repositories';
import { AdministrativeAreaCatalogService } from '../../../profiles/application/services/administrative-area-catalog.service';
import { createContactPerson } from '../../../profiles/application/services/contact-person';
import { createGuardianRelatedPerson } from '../../../profiles/application/services/guardian-related-person';
import { MedicalSpecialtyCatalogService } from '../../../profiles/application/services/medical-specialty-catalog.service';
import { PractitionerAdmissionsService } from '../../../profiles/application/services/practitioner-admissions.service';
import {
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  PersonProfilesRepository,
  PersonsRepository,
  PractitionerLanguagesRepository,
  PractitionerSpecialtiesRepository,
  ProfessionalCredentialsRepository,
  RelatedPersonsRepository,
} from '../../../profiles/infrastructure/repositories';
import { SecretaryProfiles } from '../../../profiles/entities';
import { createdBy } from '../../../../common/persistence/audit-fields';
import type {
  ContactPersonInput,
  GuardianInput,
  ProfileRegistrationPort,
} from '../../application/ports/profile-registration.port';

/**
 * Los registros de `profiles` que las altas escriben junto a la cuenta. Cada
 * método delega en el repositorio o el ayudante de `profiles` que ya es «el
 * único punto de inserción» de ese registro.
 */
@Injectable()
export class ProfilesRegistrationAdapter implements ProfileRegistrationPort {
  constructor(
    private readonly personsRepo: PersonsRepository,
    private readonly personProfilesRepo: PersonProfilesRepository,
    private readonly patientProfilesRepo: PatientProfilesRepository,
    private readonly accountLinksRepo: PersonAccountLinksRepository,
    private readonly practitionersRepo: HealthPractitionerProfilesRepository,
    private readonly authorizationsRepo: JurisdictionAuthorizationsRepository,
    private readonly professionalCredentialsRepo: ProfessionalCredentialsRepository,
    private readonly languagesRepo: PractitionerLanguagesRepository,
    private readonly specialtiesRepo: PractitionerSpecialtiesRepository,
    private readonly relatedPersonsRepo: RelatedPersonsRepository,
    private readonly identifiersRepo: IdentifiersRepository,
    private readonly contactPointsRepo: ContactPointsRepository,
    private readonly administrativeAreas: AdministrativeAreaCatalogService,
    private readonly specialtyCatalog: MedicalSpecialtyCatalogService,
    private readonly admissions: PractitionerAdmissionsService,
  ) {}

  createPerson(tx: EntityManager, data: object) {
    return this.personsRepo.create(
      tx,
      data as Parameters<PersonsRepository['create']>[1],
    );
  }

  createPersonProfile(tx: EntityManager, data: object) {
    return this.personProfilesRepo.create(
      tx,
      data as Parameters<PersonProfilesRepository['create']>[1],
    );
  }

  createPatientProfile(tx: EntityManager, data: object) {
    return this.patientProfilesRepo.create(
      tx,
      data as Parameters<PatientProfilesRepository['create']>[1],
    );
  }

  createSecretaryProfile(
    tx: EntityManager,
    data: {
      readonly profileId: string;
      readonly roleConceptId?: string;
      readonly actorUserId: string;
    },
  ): { profileId: string } {
    // `profiles` no tiene repositorio para esta tabla: la fila son tres columnas
    // y nadie más la escribe, así que se crea acá con las marcas de auditoría
    // de siempre.
    return tx.create(
      SecretaryProfiles,
      {
        profileId: data.profileId,
        roleConceptId: data.roleConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  createAccountLink(tx: EntityManager, data: object) {
    return this.accountLinksRepo.create(
      tx,
      data as Parameters<PersonAccountLinksRepository['create']>[1],
    );
  }

  findPractitionerByCode(tx: EntityManager, code: string) {
    return this.practitionersRepo.findByCode(tx, code);
  }

  createPractitionerProfile(tx: EntityManager, data: object) {
    return this.practitionersRepo.create(
      tx,
      data as Parameters<HealthPractitionerProfilesRepository['create']>[1],
    );
  }

  createJurisdictionAuthorization(tx: EntityManager, data: object) {
    return this.authorizationsRepo.create(
      tx,
      data as Parameters<JurisdictionAuthorizationsRepository['create']>[1],
    );
  }

  createProfessionalCredential(tx: EntityManager, data: object) {
    return this.professionalCredentialsRepo.create(
      tx,
      data as Parameters<ProfessionalCredentialsRepository['create']>[1],
    );
  }

  createPractitionerLanguage(tx: EntityManager, data: object) {
    return this.languagesRepo.create(
      tx,
      data as Parameters<PractitionerLanguagesRepository['create']>[1],
    );
  }

  createPractitionerSpecialty(tx: EntityManager, data: object) {
    return this.specialtiesRepo.create(
      tx,
      data as Parameters<PractitionerSpecialtiesRepository['create']>[1],
    );
  }

  openPractitionerAdmission(
    tx: EntityManager,
    data: Parameters<ProfileRegistrationPort['openPractitionerAdmission']>[1],
  ) {
    return this.admissions.openForRegistration(tx, data);
  }

  assertIsAdministrativeArea(tx: EntityManager, conceptId: string) {
    return this.administrativeAreas.assertIsAdministrativeArea(tx, conceptId);
  }

  assertIsMedicalSpecialty(tx: EntityManager, conceptId: string) {
    return this.specialtyCatalog.assertIsMedicalSpecialty(tx, conceptId);
  }

  createGuardianRelatedPerson(tx: EntityManager, data: GuardianInput) {
    return createGuardianRelatedPerson(
      {
        persons: this.personsRepo,
        relatedPersons: this.relatedPersonsRepo,
        contactPoints: this.contactPointsRepo,
      },
      tx,
      data,
    );
  }

  createContactPerson(tx: EntityManager, data: ContactPersonInput) {
    return createContactPerson(
      {
        persons: this.personsRepo,
        identifiers: this.identifiersRepo,
        contactPoints: this.contactPointsRepo,
      },
      tx,
      data,
    );
  }
}
