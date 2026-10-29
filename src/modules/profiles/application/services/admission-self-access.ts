import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../../common';
import { InsufficientRoleException } from '../../../../common/errors/domain.exception';
import type { PersonAccountLinksRepository } from '../../infrastructure/repositories';
import { ProfilesErrorReason } from '../../profiles.error-reasons';

/**
 * La puerta única de «nadie toca su propia admisión».
 *
 * Quien además de tener un rol de admisiones es el profesional de la admisión
 * no la lee, no la revisa, no la resuelve ni abre sus documentos por la vista
 * del personal: su caso lo ve sólo por `GET /profiles/practitioners/me/admission`.
 * Toda ruta de `/admissions/:id/**` pasa por acá —la prueba paramétrica del
 * controlador falla si aparece una que no— y responde igual: 403
 * `ADMISSION_SELF_ACCESS`, **antes** de cualquier retorno idempotente.
 */
export async function assertNotSelfAccess(
  accountLinks: Pick<PersonAccountLinksRepository, 'findActiveByPerson'>,
  em: EntityManager,
  admission: { readonly practitionerProfileId: string },
  user: AuthenticatedUser,
): Promise<void> {
  const link = await accountLinks.findActiveByPerson(
    em,
    admission.practitionerProfileId,
  );
  if (link?.userId === user.id) {
    throw new InsufficientRoleException(
      'No puede consultar ni resolver su propia admisión por la vista del personal',
      {},
      ProfilesErrorReason.ADMISSION_SELF_ACCESS,
    );
  }
}
