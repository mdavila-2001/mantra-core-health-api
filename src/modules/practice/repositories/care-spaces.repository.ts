import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CareSpaces } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear un espacio de atención bajo un sitio. */
export interface CreateCareSpaceData {
  /**
   * Identificador asociado a practice site.
   */
  practiceSiteId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a space type concept.
   */
  spaceTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a operational status concept.
   */
  operationalStatusConceptId: string;
  /**
   * Identificador asociado a clinical unit.
   */
  clinicalUnitId?: string;
  /**
   * Identificador asociado a parent space.
   */
  parentSpaceId?: string;
  /**
   * Valor de capacity mantenido por la instancia.
   */
  capacity?: number;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.care_spaces` (stateless). */
@Injectable()
export class CareSpacesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<CareSpaces | null>`.
   */
  findById(em: EntityManager, id: string): Promise<CareSpaces | null> {
    return em.findOne(CareSpaces, { id });
  }

  /**
   * Obtiene find by site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Identificador de practice site.
   * @returns Resultado de find by site conforme al contrato `Promise<CareSpaces[]>`.
   */
  findBySite(em: EntityManager, practiceSiteId: string): Promise<CareSpaces[]> {
    return em.find(CareSpaces, { practiceSiteId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `CareSpaces`.
   */
  create(em: EntityManager, data: CreateCareSpaceData): CareSpaces {
    return em.create(
      CareSpaces,
      {
        practiceSiteId: data.practiceSiteId,
        clinicalUnitId: data.clinicalUnitId,
        parentSpaceId: data.parentSpaceId,
        code: data.code,
        name: data.name,
        spaceTypeConceptId: data.spaceTypeConceptId,
        capacity: data.capacity,
        operationalStatusConceptId: data.operationalStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
