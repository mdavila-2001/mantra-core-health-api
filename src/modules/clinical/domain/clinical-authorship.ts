import { ForbiddenException } from '@nestjs/common';
import {
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';
import type { ClinicalReadScope } from './clinical-read-scope';

/**
 * Authorship rule (c) for records that carry a declared practitioner (the
 * requester of an order): the body may confirm the session's own practitioner
 * profile, never name another one. The global `SUPERADMIN` may act for anyone,
 * as in the rest of the role system. A body that declares nobody is left alone.
 *
 * @param declaredProfileId - Practitioner profile the request body declares.
 * @param actor - Session that writes.
 * @param message - 403 text, in Spanish, specific to the record.
 * @throws ForbiddenException if the declared profile is another practitioner's.
 */
export function assertDeclaredProfileIsActor(
  declaredProfileId: string | undefined,
  actor: AuthenticatedUser,
  message: string,
): void {
  if (roleAuthorizesInTenant(actor, 'SUPERADMIN', undefined)) return;
  if (declaredProfileId && declaredProfileId !== actor.practitionerProfileId) {
    throw new ForbiddenException(message);
  }
}

/** Rule (c) for orders: `requesterProfileId` is the session's practitioner. */
export function assertOrderRequesterIsActor(
  requesterProfileId: string | undefined,
  actor: AuthenticatedUser,
): void {
  assertDeclaredProfileIsActor(
    requesterProfileId,
    actor,
    'El solicitante de la orden es el profesional de la sesión: no se pide en nombre de otro perfil.',
  );
}

/**
 * Rule (c) for conditions: changing the status of, or verifying, a condition
 * someone else recorded needs read access to the WHOLE record (not a granular
 * scope), since the decision rests on what the rest of the history shows.
 * Both operations are audited with the acting user, so the change stays
 * attributable. One's own condition needs nothing more.
 *
 * @throws ForbiddenException if the condition is foreign and the actor's scope
 *   is not the full record.
 */
export async function assertOwnOrFullAccess(
  scopes: {
    resolveReadScope(
      patientProfileId: string,
      actor: AuthenticatedUser,
    ): Promise<ClinicalReadScope>;
  },
  condition: { recordedByUserId?: string; patientProfileId: string },
  actor: AuthenticatedUser,
): Promise<void> {
  if (!condition.recordedByUserId || condition.recordedByUserId === actor.id) {
    return;
  }
  const scope = await scopes.resolveReadScope(
    condition.patientProfileId,
    actor,
  );
  if (scope.kind !== 'FULL') {
    throw new ForbiddenException(
      'Sólo con acceso completo a la historia se modifica un diagnóstico que registró otro profesional.',
    );
  }
}
