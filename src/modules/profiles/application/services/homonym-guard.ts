import type { EntityManager } from '@mikro-orm/postgresql';
import { ConflictException } from '../../../../common';
import { personNameKey } from '../../../../common/text/person-name';
import type { PatientProfilesRepository } from '../../infrastructure/repositories';
import { ProfilesErrorReason } from '../../profiles.error-reasons';

/** What a registration declares about the new patient's identity. */
export interface HomonymCheck {
  readonly displayName?: string;
  readonly birthDate?: Date;
  /** The operator confirmed it is a different person with the same name. */
  readonly allowHomonym?: boolean;
}

/**
 * Refuses (409 `POSSIBLE_DUPLICATE_PATIENT`) a registration whose name —ignoring
 * case, accents and spacing— and birth date (when given) already belong to a
 * live patient. A real homonym goes through by re-sending with `allowHomonym`.
 */
export async function assertNoHomonymPatient(
  em: EntityManager,
  patientProfiles: PatientProfilesRepository,
  check: HomonymCheck,
): Promise<void> {
  if (check.allowHomonym || !check.displayName?.trim()) return;
  const candidates = await patientProfiles.findHomonyms(
    em,
    personNameKey(check.displayName),
    check.birthDate,
  );
  if (candidates.length === 0) return;
  throw new ConflictException(
    'Ya hay un paciente registrado con ese nombre. Búsquelo antes de crear otro; si es una persona distinta, confirme el alta.',
    { candidateProfileIds: candidates },
    ProfilesErrorReason.POSSIBLE_DUPLICATE_PATIENT,
  );
}
