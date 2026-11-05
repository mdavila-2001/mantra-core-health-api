import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  PreconditionFailedException,
  type AuthenticatedUser,
} from '../../../common';
import { ServiceRequests } from '../../clinical/entities';
import {
  PatientProfilesRepository,
  PersonAccountLinksRepository,
} from '../../profiles/infrastructure/repositories';
import {
  OwnServiceRequestsPort,
  type OwnedServiceRequestRow,
} from '../ports/medical-center.ports';

/**
 * Las órdenes del titular y su identidad como paciente.
 *
 * El titular se resuelve por el vínculo cuenta↔persona y no por el claim `pid`
 * del token, que es dato de identificación y no participa de ninguna decisión
 * de autorización; ésta lo es.
 */
@Injectable()
export class OwnServiceRequestsRepository extends OwnServiceRequestsPort {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param accountLinks - Vínculo cuenta↔persona.
   * @param patientProfiles - Perfil de paciente de esa persona.
   */
  constructor(
    private readonly accountLinks: PersonAccountLinksRepository,
    private readonly patientProfiles: PatientProfilesRepository,
  ) {
    super();
  }

  /** @inheritdoc */
  async resolveOwnPatientProfileId(
    em: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<string> {
    const link = await this.accountLinks.findActiveByUser(em, actor.id);
    if (!link) {
      throw new PreconditionFailedException(
        'La cuenta no tiene una persona vinculada',
      );
    }
    const patient = await this.patientProfiles.findById(em, link.personId);
    if (!patient) {
      throw new PreconditionFailedException(
        'La cuenta no tiene perfil de paciente',
        { personId: link.personId },
      );
    }
    return patient.profileId;
  }

  /** @inheritdoc */
  async findOwned(
    em: EntityManager,
    patientProfileId: string,
    serviceRequestIds: readonly string[],
  ): Promise<OwnedServiceRequestRow[]> {
    if (serviceRequestIds.length === 0) return [];
    const orders = await em.find(ServiceRequests, {
      id: { $in: [...serviceRequestIds] },
      patientProfileId,
    });
    return orders.map((order) => ({
      id: order.id,
      codeConceptId: order.codeConceptId,
      requesterProfileId: order.requesterProfileId ?? null,
      suggestedPracticeSiteId: order.suggestedPracticeSiteId ?? null,
    }));
  }
}
