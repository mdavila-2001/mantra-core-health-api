import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import * as entities from './entities';
import {
  ProfilesPatientsController,
  ProfilesPractitionersController,
} from './controllers';
import {
  ProfilesPatientsService,
  ProfilesPractitionersService,
} from './services';
import {
  PersonsRepository,
  PersonProfilesRepository,
  PatientProfilesRepository,
  PersonAccountLinksRepository,
  HealthPractitionerProfilesRepository,
  JurisdictionAuthorizationsRepository,
  ProfessionalCredentialsRepository,
  PractitionerSpecialtiesRepository,
  PractitionerLanguagesRepository,
  PatientIdentityLinksRepository,
  PatientMergeEventsRepository,
  RelatedPersonsRepository,
  PatientPortalProxiesRepository,
} from './repositories';

/**
 * Módulo Profiles (05): personas, pacientes y fuerza laboral de salud. Cubre alta
 * de pacientes, vinculación de cuenta de portal, onboarding de profesionales,
 * autorizaciones jurisdiccionales, verificación de credenciales, especialidades,
 * vínculos de identidad (MPI), fusión/reversión de pacientes, personas
 * relacionadas, proxies de portal y defunción/anonimización.
 */
@Module({
  imports: [MikroOrmModule.forFeature(Object.values(entities))],
  controllers: [ProfilesPatientsController, ProfilesPractitionersController],
  providers: [
    // Repositorios
    PersonsRepository,
    PersonProfilesRepository,
    PatientProfilesRepository,
    PersonAccountLinksRepository,
    HealthPractitionerProfilesRepository,
    JurisdictionAuthorizationsRepository,
    ProfessionalCredentialsRepository,
    PractitionerSpecialtiesRepository,
    PractitionerLanguagesRepository,
    PatientIdentityLinksRepository,
    PatientMergeEventsRepository,
    RelatedPersonsRepository,
    PatientPortalProxiesRepository,
    // Servicios
    ProfilesPatientsService,
    ProfilesPractitionersService,
  ],
  // Los repositorios que necesita el auto-registro de pacientes (IAM crea en la
  // misma transacción la cuenta y su persona/perfil). Se exportan los
  // repositorios y no el servicio porque `registerPatient` de este módulo es
  // admin-only y abre su propia transacción.
  exports: [
    PersonsRepository,
    PersonProfilesRepository,
    PatientProfilesRepository,
    PersonAccountLinksRepository,
    // Los necesita identity_assurance para activar la matrícula (y con ella al
    // profesional) cuando la autoridad externa la aprueba.
    JurisdictionAuthorizationsRepository,
    HealthPractitionerProfilesRepository,
  ],
})
export class ProfilesModule {}
