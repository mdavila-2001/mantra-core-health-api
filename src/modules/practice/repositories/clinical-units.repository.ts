import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ClinicalUnits } from '../entities';
import { createdBy } from '../../../common';

/** Datos para crear una unidad clínica jerárquica. */
export interface CreateClinicalUnitData {
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
   * Identificador asociado a unit type concept.
   */
  unitTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a parent unit.
   */
  parentUnitId?: string;
  /**
   * Identificador asociado a specialty concept.
   */
  specialtyConceptId?: string;
  /**
   * Identificador asociado a service mode concept.
   */
  serviceModeConceptId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.clinical_units` (stateless). */
@Injectable()
export class ClinicalUnitsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<ClinicalUnits | null>`.
   */
  findById(em: EntityManager, id: string): Promise<ClinicalUnits | null> {
    return em.findOne(ClinicalUnits, { id });
  }

  /**
   * Obtiene find by site.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceSiteId - Identificador de practice site.
   * @returns Resultado de find by site conforme al contrato `Promise<ClinicalUnits[]>`.
   */
  findBySite(
    em: EntityManager,
    practiceSiteId: string,
  ): Promise<ClinicalUnits[]> {
    return em.find(ClinicalUnits, { practiceSiteId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ClinicalUnits`.
   */
  create(em: EntityManager, data: CreateClinicalUnitData): ClinicalUnits {
    return em.create(
      ClinicalUnits,
      {
        practiceSiteId: data.practiceSiteId,
        parentUnitId: data.parentUnitId,
        code: data.code,
        name: data.name,
        unitTypeConceptId: data.unitTypeConceptId,
        specialtyConceptId: data.specialtyConceptId,
        serviceModeConceptId: data.serviceModeConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
