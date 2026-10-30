import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { SpaceUnitAssignments } from '../entities';
import { createdBy } from '../../../common';

/** Datos para vincular un espacio a una unidad. */
export interface CreateSpaceUnitAssignmentData {
  tenantId: string;
  careSpaceId: string;
  clinicalUnitId: string;
  roleConceptId: string;
  validFrom: Date;
  actorUserId?: string;
}

/** Acceso a `practice.space_unit_assignments` (stateless). */
@Injectable()
export class SpaceUnitAssignmentsRepository {
  /**
   * Un vínculo por id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Vínculo.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<SpaceUnitAssignments | null> {
    return em.findOne(SpaceUnitAssignments, { id });
  }

  /**
   * Vínculos vigentes (`valid_to` nulo) de varios espacios.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param careSpaceIds - Espacios.
   */
  findCurrentBySpaces(
    em: EntityManager,
    careSpaceIds: readonly string[],
  ): Promise<SpaceUnitAssignments[]> {
    if (careSpaceIds.length === 0) return Promise.resolve([]);
    return em.find(
      SpaceUnitAssignments,
      { careSpaceId: { $in: [...careSpaceIds] }, validTo: null },
      { orderBy: { validFrom: 'asc' } },
    );
  }

  /**
   * Vínculos vigentes de una unidad.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param clinicalUnitId - Unidad.
   */
  findCurrentByUnit(
    em: EntityManager,
    clinicalUnitId: string,
  ): Promise<SpaceUnitAssignments[]> {
    return em.find(SpaceUnitAssignments, { clinicalUnitId, validTo: null });
  }

  /**
   * Crea el vínculo (sin flush).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Datos del vínculo.
   */
  create(
    em: EntityManager,
    data: CreateSpaceUnitAssignmentData,
  ): SpaceUnitAssignments {
    return em.create(
      SpaceUnitAssignments,
      {
        tenantId: data.tenantId,
        careSpaceId: data.careSpaceId,
        clinicalUnitId: data.clinicalUnitId,
        roleConceptId: data.roleConceptId,
        validFrom: data.validFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
