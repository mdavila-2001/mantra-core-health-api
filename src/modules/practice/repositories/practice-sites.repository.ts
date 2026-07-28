import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PracticeSites } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un sitio de práctica. */
export interface CreateSiteData {
  /**
   * Identificador asociado a practice.
   */
  practiceId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a site type concept.
   */
  siteTypeConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a operational status concept.
   */
  operationalStatusConceptId: string;
  /**
   * Identificador asociado a physical type concept.
   */
  physicalTypeConceptId?: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /**
   * Identificador asociado a address.
   */
  addressId?: string;
  /**
   * Identificador asociado a branch.
   */
  branchId?: string;
  /**
   * Identificador asociado a managing tenant.
   */
  managingTenantId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `practice.practice_sites` (stateless). */
@Injectable()
export class PracticeSitesRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<PracticeSites | null>`.
   */
  findById(em: EntityManager, id: string): Promise<PracticeSites | null> {
    return em.findOne(PracticeSites, { id });
  }

  /**
   * Obtiene find by practice and code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param practiceId - Identificador de practice.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de find by practice and code conforme al contrato `Promise<PracticeSites | null>`.
   */
  findByPracticeAndCode(
    em: EntityManager,
    practiceId: string,
    code: string,
  ): Promise<PracticeSites | null> {
    return em.findOne(PracticeSites, { practiceId, code });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `PracticeSites`.
   */
  create(em: EntityManager, data: CreateSiteData): PracticeSites {
    return em.create(
      PracticeSites,
      {
        practiceId: data.practiceId,
        code: data.code,
        name: data.name,
        siteTypeConceptId: data.siteTypeConceptId,
        physicalTypeConceptId: data.physicalTypeConceptId,
        operationalStatusConceptId: data.operationalStatusConceptId,
        timeZone: data.timeZone,
        addressId: data.addressId,
        branchId: data.branchId,
        managingTenantId: data.managingTenantId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
