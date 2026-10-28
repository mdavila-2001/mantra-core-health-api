import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../../common';
import {
  HealthPractitionerProfiles,
  Persons,
} from '../../../profiles/entities';
import { InsuranceCarriers, PractitionerInsurerRequests } from '../../entities';

/**
 * Acceso a `insurance.practitioner_insurer_requests`: lo que el médico le pide a
 * una aseguradora y lo que ésta decide.
 *
 * Toda lectura viene acotada por quien pregunta —el médico por su perfil, la
 * aseguradora por su compañía— **en la consulta**, no filtrada después: no hay
 * un paso intermedio donde pudiera colarse la solicitud de otro.
 */
@Injectable()
export class PractitionerInsurerRequestsRepository {
  /** La solicitud del par médico–aseguradora, si existe (hay una sola). */
  findPair(
    em: EntityManager,
    practitionerProfileId: string,
    insuranceCarrierId: string,
  ): Promise<PractitionerInsurerRequests | null> {
    return em.findOne(PractitionerInsurerRequests, {
      practitionerProfileId,
      insuranceCarrierId,
    });
  }

  /** Las solicitudes de un médico, de la más reciente a la más vieja. */
  listByPractitioner(
    em: EntityManager,
    practitionerProfileId: string,
  ): Promise<PractitionerInsurerRequests[]> {
    return em.find(
      PractitionerInsurerRequests,
      { practitionerProfileId },
      { orderBy: { createdAt: 'desc' } },
    );
  }

  /** Una solicitud del médico, o `null` si no existe o es de otro. */
  findOwn(
    em: EntityManager,
    id: string,
    practitionerProfileId: string,
  ): Promise<PractitionerInsurerRequests | null> {
    return em.findOne(PractitionerInsurerRequests, {
      id,
      practitionerProfileId,
    });
  }

  /**
   * Las solicitudes que recibió una aseguradora en los estados pedidos, las
   * pendientes primero por orden de llegada.
   */
  listByCarrier(
    em: EntityManager,
    insuranceCarrierId: string,
    statusConceptIds: readonly string[],
  ): Promise<PractitionerInsurerRequests[]> {
    return em.find(
      PractitionerInsurerRequests,
      { insuranceCarrierId, statusConceptId: { $in: [...statusConceptIds] } },
      { orderBy: { createdAt: 'asc' } },
    );
  }

  /** Una solicitud recibida por esta aseguradora, o `null` si es de otra. */
  findForCarrier(
    em: EntityManager,
    id: string,
    insuranceCarrierId: string,
  ): Promise<PractitionerInsurerRequests | null> {
    return em.findOne(PractitionerInsurerRequests, { id, insuranceCarrierId });
  }

  /** Alta de una solicitud nueva. */
  create(
    em: EntityManager,
    data: {
      practitionerProfileId: string;
      insuranceCarrierId: string;
      statusConceptId: string;
      actorUserId: string;
    },
  ): PractitionerInsurerRequests {
    const { actorUserId, ...rest } = data;
    return em.create(
      PractitionerInsurerRequests,
      { ...rest, ...createdBy(actorUserId) },
      { partial: true },
    );
  }

  /** Las aseguradoras nombradas, para validar el pedido y rotular la bandeja. */
  findCarriers(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<InsuranceCarriers[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(InsuranceCarriers, { id: { $in: [...ids] } });
  }

  /**
   * Cómo se llama cada médico y con qué título se presenta, para la bandeja de
   * la aseguradora. El perfil profesional comparte id con su persona (CTI).
   */
  async findPractitionerCards(
    em: EntityManager,
    profileIds: readonly string[],
  ): Promise<
    Map<
      string,
      { displayName: string | null; professionalTitle: string | null }
    >
  > {
    if (profileIds.length === 0) return new Map();
    const [persons, profiles] = await Promise.all([
      em.find(Persons, { id: { $in: [...profileIds] } }),
      em.find(HealthPractitionerProfiles, {
        profileId: { $in: [...profileIds] },
      }),
    ]);
    const nameById = new Map(persons.map((p) => [p.id, p.displayName ?? null]));
    return new Map(
      profileIds.map((id) => [
        id,
        {
          displayName: nameById.get(id) ?? null,
          professionalTitle:
            profiles.find((p) => p.profileId === id)?.professionalTitle ?? null,
        },
      ]),
    );
  }
}
