import type { EntityManager } from '@mikro-orm/postgresql';

import type {
  ContactPointsRepository,
  IdentifiersRepository,
} from '../../../common/repositories';
import type {
  PatientProfilesRepository,
  PersonProfilesRepository,
  PersonsRepository,
  RelatedPersonsRepository,
} from '../../../profiles/infrastructure/repositories';
import { registerPatientRecords } from '../../../profiles/infrastructure/adapters/patient-intake';
import type {
  WalkInPatientData,
  WalkInPatientResult,
} from '../../application/ports/walk-in-patient-registry.port';

/** Repositorios de `profiles`/`common` que necesita el alta de mostrador. */
export interface WalkInPatientRepos {
  readonly persons: PersonsRepository;
  readonly personProfiles: PersonProfilesRepository;
  readonly patientProfiles: PatientProfilesRepository;
  readonly identifiers: IdentifiersRepository;
  readonly contactPoints: ContactPointsRepository;
  readonly relatedPersons: RelatedPersonsRepository;
}

/**
 * Da de alta al paciente que se presenta en el mostrador sin cuenta de
 * portal (AC-3.3).
 *
 * La escritura es la de `registerPatientRecords` (módulo `profiles`), que
 * comparte con el alta del personal de apoyo: persona → perfil → paciente →
 * identificador → contacto → tutor, sin tramo de cuenta. El llamador controla
 * la transacción.
 *
 * @param repos - Repositorios de personas, perfiles, paciente, identificador,
 *   contacto y personas relacionadas.
 * @param tx - Contexto transaccional del alta, ya abierto por el llamador.
 * @param data - Filiación declarada en el mostrador.
 * @returns Los ids de la persona y su perfil de paciente recién creados.
 * @throws ConflictException si el documento ya tiene un identificador ACTIVO
 *   registrado: hay que retomar al paciente existente, no duplicarlo.
 */
export async function createWalkInPatient(
  repos: WalkInPatientRepos,
  tx: EntityManager,
  data: WalkInPatientData,
): Promise<WalkInPatientResult> {
  const { personId, patientProfileId, patientCode } =
    await registerPatientRecords(repos, tx, data);
  return { personId, patientProfileId, patientCode };
}
