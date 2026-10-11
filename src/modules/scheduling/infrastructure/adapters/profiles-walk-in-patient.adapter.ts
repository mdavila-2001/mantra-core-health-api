import { Injectable } from '@nestjs/common';
import {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../../common/repositories';
import {
  PatientProfilesRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../../../profiles/infrastructure/repositories';
import type {
  WalkInPatientData,
  WalkInPatientRegistryPort,
  WalkInPatientResult,
} from '../../application/ports/walk-in-patient-registry.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';
import { createWalkInPatient } from './walk-in-patient';

/** Implementa el alta de pacientes de mostrador sobre `profiles` y `common`. */
@Injectable()
export class ProfilesWalkInPatientAdapter implements WalkInPatientRegistryPort {
  constructor(
    private readonly persons: PersonsRepository,
    private readonly personProfiles: PersonProfilesRepository,
    private readonly patientProfiles: PatientProfilesRepository,
    private readonly identifiers: IdentifiersRepository,
    private readonly contactPoints: ContactPointsRepository,
    private readonly relatedPersons: RelatedPersonsRepository,
  ) {}

  register(
    uow: UnitOfWork,
    data: WalkInPatientData,
  ): Promise<WalkInPatientResult> {
    return createWalkInPatient(
      {
        persons: this.persons,
        personProfiles: this.personProfiles,
        patientProfiles: this.patientProfiles,
        identifiers: this.identifiers,
        contactPoints: this.contactPoints,
        relatedPersons: this.relatedPersons,
      },
      uow,
      data,
    );
  }
}
