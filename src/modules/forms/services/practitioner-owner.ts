import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { FormsErrorReason } from '../forms.error-reasons';

/**
 * The practitioner profile that owns question scripts and FAQ entries, taken
 * from the session (`hpid` claim) and never from the request. A session
 * without one is a 422, the same answer other practitioner-only acts give.
 */
export function requirePractitionerOwner(actor: AuthenticatedUser): string {
  if (!actor.practitionerProfileId) {
    throw new PreconditionFailedException(
      'La cuenta no tiene un perfil profesional asociado',
      { actorId: actor.id },
      FormsErrorReason.PRACTITIONER_PROFILE_REQUIRED,
    );
  }
  return actor.practitionerProfileId;
}
