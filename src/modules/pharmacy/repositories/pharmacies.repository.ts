import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Pharmacies } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta una farmacia (UC-24-01). */
export interface CreatePharmacyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
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
   * Identificador asociado a pharmacy type concept.
   */
  pharmacyTypeConceptId?: string;
  /**
   * Identificador asociado a ownership type concept.
   */
  ownershipTypeConceptId?: string;
  /**
   * Identificador asociado a default currency concept.
   */
  defaultCurrencyConceptId?: string;
  /**
   * Identificador asociado a verification status concept.
   */
  verificationStatusConceptId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `pharmacy.pharmacies`. Stateless: cada método recibe el
 * `EntityManager` activo para que el servicio controle la transacción.
 */
@Injectable()
export class PharmaciesRepository {
  /** Busca una farmacia por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<Pharmacies | null> {
    return em.findOne(Pharmacies, { id });
  }

  /** Busca una farmacia por (tenant, code) para validar unicidad. */
  findByTenantAndCode(
    em: EntityManager,
    tenantId: string,
    code: string,
  ): Promise<Pharmacies | null> {
    return em.findOne(Pharmacies, { tenantId, code });
  }

  /** Crea la entidad farmacia en la unidad de trabajo (sin flush). */
  create(em: EntityManager, data: CreatePharmacyData): Pharmacies {
    return em.create(
      Pharmacies,
      {
        tenantId: data.tenantId,
        code: data.code,
        legalName: data.legalName,
        tradeName: data.tradeName,
        pharmacyTypeConceptId: data.pharmacyTypeConceptId,
        ownershipTypeConceptId: data.ownershipTypeConceptId,
        defaultCurrencyConceptId: data.defaultCurrencyConceptId,
        verificationStatusConceptId: data.verificationStatusConceptId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
