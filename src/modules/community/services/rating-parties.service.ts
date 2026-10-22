import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';
import { Practices } from '../../practice/entities';
import type { RatingPartyType } from '../dto/party-rating.dto';
import type { RatingParty } from '../repositories/party-ratings.repository';

/**
 * Quién es cada parte de la calificación en malla, resuelto contra la sesión.
 *
 * ## La identidad no llega en el cuerpo
 *
 * Es la misma lección de `CommunityReviewsService`: si el autor viajara en la
 * petición, cualquiera calificaría firmando como otro. El paciente y el médico
 * salen de sus claims (`pid`, `hpid`); la organización, de que la sesión sea
 * quien la administra (`practice.practices.admin_user_id`), que es la única
 * marca de administración que el modelo declara — no hay un rol de
 * administrador de organización en `RoleCode`.
 */
@Injectable()
export class RatingPartiesService {
  /**
   * Resuelve con qué identidad califica (o lee lo que calificó) la sesión.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param type - Identidad pedida.
   * @param organizationId - La organización, si `type = ORGANIZATION`.
   * @param actor - La sesión.
   * @returns La parte autora.
   * @throws ForbiddenException si la sesión no tiene esa identidad.
   * @throws BadRequestException si falta la organización.
   */
  async resolveReviewer(
    em: EntityManager,
    type: RatingPartyType,
    organizationId: string | undefined,
    actor: AuthenticatedUser,
  ): Promise<RatingParty> {
    if (type === 'PATIENT') {
      if (!actor.patientProfileId) {
        throw new ForbiddenException(
          'Su cuenta no tiene un perfil de paciente con el cual calificar',
        );
      }
      return { type, id: actor.patientProfileId };
    }
    if (type === 'PRACTITIONER') {
      if (!actor.practitionerProfileId) {
        throw new ForbiddenException(
          'Su cuenta no tiene un perfil profesional con el cual calificar',
        );
      }
      return { type, id: actor.practitionerProfileId };
    }
    if (!organizationId) {
      throw new BadRequestException(
        'Indique en nombre de qué organización califica',
      );
    }
    await this.assertAdministers(em, organizationId, actor);
    return { type, id: organizationId };
  }

  /**
   * Exige que la sesión administre la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param organizationId - `practice.practices.id`.
   * @param actor - La sesión.
   * @throws ForbiddenException si no la administra (o no existe: mismo
   *   mensaje, para no confirmar qué ids existen).
   */
  async assertAdministers(
    em: EntityManager,
    organizationId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (!(await this.administers(em, organizationId, actor))) {
      throw new ForbiddenException(
        'Sólo quien administra la organización puede calificar en su nombre',
      );
    }
  }

  /**
   * Si la sesión administra la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param organizationId - `practice.practices.id`.
   * @param actor - La sesión.
   * @returns `true` si `admin_user_id` es la sesión.
   */
  async administers(
    em: EntityManager,
    organizationId: string,
    actor: AuthenticatedUser,
  ): Promise<boolean> {
    const practice = await em.findOne(
      Practices,
      { id: organizationId },
      { fields: ['id', 'adminUserId'] },
    );
    return practice?.adminUserId === actor.id;
  }

  /**
   * La nota de un paciente la leen sólo los profesionales —médicos y quienes
   * administran una organización— y el propio paciente (decisión del
   * propietario, 2026-10-08). Nunca un endpoint público, nunca otro paciente.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param patientProfileId - Paciente cuya nota se pide.
   * @param actor - La sesión.
   * @throws ForbiddenException si la sesión no es profesional ni el paciente.
   */
  async assertCanReadPatientRatings(
    em: EntityManager,
    patientProfileId: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    if (actor.patientProfileId === patientProfileId) return;
    if (actor.practitionerProfileId) return;
    const administra = await em.count(Practices, { adminUserId: actor.id });
    if (administra > 0) return;
    throw new ForbiddenException(
      'La calificación de un paciente sólo la ven los profesionales que lo atienden',
    );
  }
}
