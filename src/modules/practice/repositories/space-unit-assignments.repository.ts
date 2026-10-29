import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SpaceUnitAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Acceso a datos de `practice.space_unit_assignments` (stateless). */
@Injectable()
export class SpaceUnitAssignmentsRepository {
  /**
   * Vínculo del tenant por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Id del vínculo.
   * @param tenantId - Tenant del contexto.
   * @returns El vínculo o `null`.
   */
  findByIdInTenant(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<SpaceUnitAssignments | null> {
    return em.findOne(SpaceUnitAssignments, { id, tenantId });
  }

  /**
   * Vínculos vigentes (sin `valid_to`) de varios espacios.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param careSpaceIds - Espacios consultados.
   * @returns Los vínculos vigentes.
   */
  findOpenBySpaces(
    em: EntityManager,
    careSpaceIds: readonly string[],
  ): Promise<SpaceUnitAssignments[]> {
    if (careSpaceIds.length === 0) return Promise.resolve([]);
    return em.find(SpaceUnitAssignments, {
      careSpaceId: { $in: [...careSpaceIds] },
      validTo: null,
    });
  }

  /**
   * Vínculos vigentes de una unidad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param clinicalUnitId - Unidad consultada.
   * @returns Los vínculos vigentes.
   */
  findOpenByUnit(
    em: EntityManager,
    clinicalUnitId: string,
  ): Promise<SpaceUnitAssignments[]> {
    return em.find(SpaceUnitAssignments, { clinicalUnitId, validTo: null });
  }

  /**
   * Todos los vínculos (vigentes y cerrados) de un espacio, del más reciente al más viejo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param careSpaceId - Espacio consultado.
   * @returns Los vínculos.
   */
  findBySpace(
    em: EntityManager,
    careSpaceId: string,
  ): Promise<SpaceUnitAssignments[]> {
    return em.find(
      SpaceUnitAssignments,
      { careSpaceId },
      { orderBy: { validFrom: 'DESC' } },
    );
  }

  /**
   * Crea un vínculo.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del vínculo.
   * @returns El vínculo creado (sin flush).
   */
  create(
    em: EntityManager,
    data: {
      /** Tenant del vínculo. */
      tenantId: string;
      /** Espacio. */
      careSpaceId: string;
      /** Unidad. */
      clinicalUnitId: string;
      /** Rol (concepto). */
      roleConceptId: string;
      /** Inicio de la vigencia. */
      validFrom: Date;
      /** Quién lo creó. */
      actorUserId?: string;
    },
  ): SpaceUnitAssignments {
    return em.create(
      SpaceUnitAssignments,
      {
        tenantId: data.tenantId,
        careSpaceId: data.careSpaceId,
        clinicalUnitId: data.clinicalUnitId,
        roleConceptId: data.roleConceptId,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId, data.validFrom),
      },
      { partial: true },
    );
  }
}
