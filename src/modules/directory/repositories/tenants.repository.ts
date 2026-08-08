import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Tenants } from '../entities';
import { createdBy } from '../../../common';

/** Datos para dar de alta un tenant (raíz o sub-tenant). */
export interface CreateTenantData {
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de legal name mantenido por la instancia.
   */
  legalName: string;
  /**
   * Valor de trade name mantenido por la instancia.
   */
  tradeName?: string;
  /**
   * Identificador asociado a tenant type concept.
   */
  tenantTypeConceptId: string;
  /**
   * Identificador asociado a legal entity type concept.
   */
  legalEntityTypeConceptId: string;
  /**
   * País de la organización. Obligatorio para los tenants de tipo `PROVIDER`,
   * que es lo que determina bajo qué regulador prestan atención.
   */
  countryConceptId?: string;
  /**
   * Jurisdicción de la organización. Obligatoria para `PROVIDER`.
   */
  jurisdictionConceptId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a data residency region concept.
   */
  dataResidencyRegionConceptId?: string;
  /**
   * Identificador asociado a parent tenant.
   */
  parentTenantId?: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `directory.tenants`. Stateless: recibe el `EntityManager`
 * activo para que el servicio controle la transacción.
 */
@Injectable()
export class TenantsRepository {
  /** Busca un tenant por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Tenants | null> {
    return em.findOne(Tenants, { id });
  }

  /** Busca un tenant por su código único global. */
  findByCode(em: EntityManager, code: string): Promise<Tenants | null> {
    return em.findOne(Tenants, { code });
  }

  /**
   * Una página del listado de organizaciones, por cursor keyset sobre `code`.
   *
   * Se pagina por el código y no por la fecha de alta porque el código es único:
   * con `created_at` dos organizaciones aprovisionadas en el mismo instante
   * -que es lo que pasa cuando las crea la misma corrida- se repetirían o se
   * saltarían entre páginas.
   *
   * @param em - Contexto de persistencia.
   * @param filters - Texto, estado, organización madre y cursor.
   * @param limit - Tope de filas a devolver.
   * @returns Organizaciones ordenadas por código ascendente.
   */
  searchPage(
    em: EntityManager,
    filters: {
      /** Texto libre sobre código, razón social y nombre comercial. */
      query?: string;
      /** Estado al que acotar. */
      statusConceptId?: string;
      /** Organización madre; `null` acota a las raíz. */
      parentTenantId?: string | null;
      /** Último código de la página anterior. */
      afterCode?: string;
    },
    limit: number,
  ): Promise<Tenants[]> {
    const where: Record<string, unknown> = {};

    if (filters.statusConceptId) {
      where.statusConceptId = filters.statusConceptId;
    }
    if (filters.parentTenantId !== undefined) {
      where.parentTenantId = filters.parentTenantId;
    }
    if (filters.afterCode !== undefined) {
      where.code = { $gt: filters.afterCode };
    }
    if (filters.query) {
      const pattern = `%${filters.query}%`;
      where.$or = [
        { code: { $ilike: pattern } },
        { legalName: { $ilike: pattern } },
        { tradeName: { $ilike: pattern } },
      ];
    }

    return em.find(Tenants, where, { orderBy: { code: 'ASC' }, limit });
  }

  /** Crea la entidad tenant en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreateTenantData): Tenants {
    return em.create(
      Tenants,
      {
        code: data.code,
        legalName: data.legalName,
        tradeName: data.tradeName,
        tenantTypeConceptId: data.tenantTypeConceptId,
        legalEntityTypeConceptId: data.legalEntityTypeConceptId,
        countryConceptId: data.countryConceptId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        statusConceptId: data.statusConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        dataResidencyRegionConceptId: data.dataResidencyRegionConceptId,
        parentTenantId: data.parentTenantId,
        timeZone: data.timeZone,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
