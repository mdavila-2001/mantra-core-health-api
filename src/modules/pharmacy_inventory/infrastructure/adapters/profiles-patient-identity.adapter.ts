import { Injectable } from '@nestjs/common';
import { CONCEPTS } from '../../../../common';
import { IdentifiersRepository } from '../../../common/repositories';
import {
  PatientProfilesRepository,
  PersonsRepository,
} from '../../../profiles/infrastructure/repositories';
import type {
  PatientIdentityPort,
  PatientIdentitySnapshot,
} from '../../application/ports/patient-identity.port';
import type { UnitOfWork } from '../../application/ports/unit-of-work';

/**
 * Adaptador a la identidad del paciente: partes del nombre (`profiles.persons`)
 * y documento nacional vigente (`common.identifiers`), resueltos como lo hace
 * el PDF de la receta (`prescription-pdf.service.ts`, `resolvePatientDocument`).
 *
 * Solo lo usa quien enmascara (S-4): el valor completo no sale de
 * `pharmacy_inventory`.
 */
@Injectable()
export class ProfilesPatientIdentityAdapter implements PatientIdentityPort {
  constructor(
    private readonly patientProfiles: PatientProfilesRepository,
    private readonly persons: PersonsRepository,
    private readonly identifiers: IdentifiersRepository,
  ) {}

  async findByPatientProfile(
    uow: UnitOfWork,
    patientProfileId: string,
  ): Promise<PatientIdentitySnapshot | null> {
    const patientProfile = await this.patientProfiles.findById(
      uow,
      patientProfileId,
    );
    if (!patientProfile) return null;
    const person = await this.persons.findById(uow, patientProfile.profileId);
    const identifiers = await this.identifiers.findCurrentByOwner(
      uow,
      patientProfile.profileId,
    );
    const document = identifiers.find(
      (row) => row.typeConceptId === CONCEPTS.ID_TYPE_NATIONAL,
    );
    return {
      name: person?.name ?? null,
      middleName: person?.middleName ?? null,
      lastName: person?.lastName ?? null,
      motherLastName: person?.motherLastName ?? null,
      displayName: person?.displayName ?? null,
      nationalDocument: document?.value ?? null,
    };
  }
}
