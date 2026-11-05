import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import { IdentityAssuranceErrorReason } from '../identity_assurance.error-reasons';

/** The only read these guards need from the practitioners repository. */
interface PractitionerLookup {
  findById(em: EntityManager, personId: string): Promise<unknown>;
}

/**
 * Fails unless the person has a practitioner profile.
 *
 * Guards the practitioner identity and license paths.
 */
export async function assertIsPractitioner(
  repo: PractitionerLookup,
  em: EntityManager,
  personId: string,
): Promise<void> {
  if (!(await repo.findById(em, personId))) {
    throw new PreconditionFailedException(
      'La cuenta no tiene un perfil profesional',
    );
  }
}

/**
 * Fails when a practitioner tries the patient identity path.
 *
 * A practitioner verifies through the practitioner path (stricter policy,
 * followed by the license). Its assertion also counts as the person's
 * identity, so the patient path would only be a weaker duplicate.
 */
export async function assertNotPractitioner(
  repo: PractitionerLookup,
  em: EntityManager,
  personId: string,
): Promise<void> {
  if (await repo.findById(em, personId)) {
    throw new PreconditionFailedException(
      'Un profesional verifica su identidad por el trámite profesional',
      { path: '/identity/me/practitioner/identity-verification' },
      IdentityAssuranceErrorReason.PRACTITIONER_IDENTITY_PATH_REQUIRED,
    );
  }
}
