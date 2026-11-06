import { ForbiddenException } from '@nestjs/common';
import {
  roleAuthorizesInTenant,
  type AuthenticatedUser,
} from '../../../common';

/** Rol comodín que puede firmar en nombre de cualquier perfil profesional. */
const SUPERADMIN_ROLE = 'SUPERADMIN';

/**
 * D-7: una nota la firma su propio profesional; nadie firma en nombre de
 * otro perfil. Como el firmante sólo puede ser el perfil de la sesión, el
 * servidor lo deriva y el cliente no tiene que mandarlo (informe B, C5: el
 * cuerpo `{}` de la pantalla daba 400). Si el cuerpo lo trae, se confirma.
 * `SUPERADMIN` tiene paso franco, igual que en el resto del sistema de
 * roles, y firma con el perfil que declare (o el suyo, si tiene).
 *
 * @param declared - Perfil que trajo el cuerpo, si trajo alguno.
 * @param actor - Sesión que pide firmar o cofirmar.
 * @returns El perfil profesional que queda como firmante.
 * @throws ForbiddenException si la sesión no tiene perfil profesional (ni
 *   uno declarado, en el caso de `SUPERADMIN`), o si el perfil declarado no
 *   es el suyo.
 */
export function resolveNoteSigner(
  declared: string | undefined,
  actor: AuthenticatedUser,
): string {
  if (actor.roles.includes(SUPERADMIN_ROLE)) {
    const chosen = declared ?? actor.practitionerProfileId;
    if (!chosen) {
      throw new ForbiddenException(
        'Una firma clínica necesita un perfil profesional firmante.',
      );
    }
    return chosen;
  }
  if (!actor.practitionerProfileId) {
    throw new ForbiddenException(
      'La sesión no tiene un perfil profesional con el que firmar.',
    );
  }
  if (declared !== undefined && declared !== actor.practitionerProfileId) {
    throw new ForbiddenException(
      'Una nota la firma su profesional: no se puede firmar en nombre de otro perfil.',
    );
  }
  return actor.practitionerProfileId;
}

/**
 * CL-20 (BR-13): el autor de una nota, de una versión o de una enmienda es
 * el profesional de la sesión, nunca el que diga el cuerpo. La misma regla
 * que {@link resolveNoteSigner}, aplicada a escribir en vez de a
 * firmar: el DTO conserva `authorProfileId` por compatibilidad —si viene, se
 * confirma; si difiere, 403— y si no viene, el autor es el perfil de la
 * sesión. `SUPERADMIN` pasa con lo que declare.
 *
 * @param declared - Lo que trajo el cuerpo, si trajo algo.
 * @param actor - La sesión que escribe.
 * @returns El perfil profesional que queda como autor.
 */
export function resolveNoteAuthor(
  declared: string | undefined,
  actor: AuthenticatedUser,
): string {
  if (actor.roles.includes(SUPERADMIN_ROLE)) {
    const chosen = declared ?? actor.practitionerProfileId;
    if (!chosen) {
      throw new ForbiddenException(
        'Una nota clínica necesita un profesional autor.',
      );
    }
    return chosen;
  }
  if (!actor.practitionerProfileId) {
    throw new ForbiddenException(
      'La sesión no tiene un perfil profesional con el que escribir la nota.',
    );
  }
  if (declared !== undefined && declared !== actor.practitionerProfileId) {
    throw new ForbiddenException(
      'El autor de la nota es el profesional de la sesión: no se escribe en nombre de otro perfil.',
    );
  }
  return actor.practitionerProfileId;
}

/**
 * Authorship rule (c): nobody edits what another practitioner wrote. Only the
 * author of the note (the author of the version being built upon, signed or
 * amended) may add a version, sign or amend it. The global `SUPERADMIN` is the
 * wildcard, as in the rest of the role system. A version with no recorded
 * author cannot be claimed by someone else, so it does not block.
 *
 * @param authorProfileId - Author recorded on the version.
 * @param actor - Session that wants to modify the note.
 * @throws ForbiddenException if the author is another practitioner.
 */
export function assertNoteAuthoredByActor(
  authorProfileId: string | undefined | null,
  actor: AuthenticatedUser,
): void {
  if (roleAuthorizesInTenant(actor, SUPERADMIN_ROLE, undefined)) return;
  if (authorProfileId && authorProfileId !== actor.practitionerProfileId) {
    throw new ForbiddenException(
      'Sólo el autor de la nota puede modificarla: lo escrito por otro profesional no se edita.',
    );
  }
}
