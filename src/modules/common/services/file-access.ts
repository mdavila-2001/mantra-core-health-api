/**
 * Quién puede leer un archivo de `common.files` cuando la autorización es por
 * **propiedad**, no por contexto.
 *
 * Vive aparte de `FileUploadService` porque la misma regla la necesitan dos
 * superficies que no se pueden importar entre sí sin ciclo: la descarga del
 * contenido (`FileUploadService.download`) y la emisión de la URL firmada
 * (`FilesService.generateDownloadUrl`). Cuando la regla vivía sólo dentro de
 * `download`, la segunda **no tenía ninguna** — cualquier sesión que conociera
 * un uuid obtenía una URL firmada del archivo de otro. Duplicarla en los dos
 * sitios era garantizar que volvieran a divergir.
 *
 * Esto **no** es el único camino de autorización del sistema, y no debe
 * convertirse en él: la autorización **contextual** —puedo ver este archivo
 * porque puedo ver la conversación/el post del que cuelga— la deciden los
 * módulos dueños de ese contexto, y sólo después piden los bytes. Ver
 * `CommunityMessagingReadService.getAttachmentContent` (chat) y
 * `CommunitySocialReadService.getCommentMedia` (comentarios).
 */

import type { AuthenticatedUser } from '../../../common';

/**
 * Roles cuyo trabajo exige leer archivos que no subieron ellos mismos
 * (p. ej. revisar evidencia de identidad).
 */
export const FILE_REVIEWER_ROLES = ['SECURITY_ADMIN', 'SUPERADMIN'];

/** Lo mínimo que hace falta saber del archivo para decidir. */
export interface FileOwnershipFacts {
  /** Quién lo subió. `undefined` en las pre-cargas anónimas todavía sin reclamar. */
  readonly createdByUserId?: string;
}

/**
 * Si el actor puede leer el archivo **por propiedad o por rol de revisión**.
 *
 * Un archivo sin dueño (pre-carga anónima no reclamada) no se lo atribuye
 * nadie: `createdByUserId` vacío nunca coincide con un actor, así que sólo
 * pasa un rol de revisión. Es deliberado — ese archivo todavía no pertenece a
 * ninguna historia clínica.
 *
 * @param file - El archivo del que se decide.
 * @param actor - Sesión que pide leerlo.
 * @returns `true` si puede leerlo por esta vía.
 */
export function canActorReadOwnFile(
  file: FileOwnershipFacts,
  actor: AuthenticatedUser,
): boolean {
  if (file.createdByUserId !== undefined && file.createdByUserId === actor.id) {
    return true;
  }
  return actor.roles.some((role) => FILE_REVIEWER_ROLES.includes(role));
}
