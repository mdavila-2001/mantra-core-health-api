import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Pharmacies } from '../entities';
import { CONCEPTS, createdBy } from '../../../common';
import { COMM } from '../../community/community.concepts';

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
  /** Busca una farmacia por id dentro de un tenant; `null` si no existe o es de otro tenant. */
  findByIdInTenant(
    em: EntityManager,
    id: string,
    tenantId: string,
  ): Promise<Pharmacies | null> {
    return em.findOne(Pharmacies, { id, tenantId });
  }

  /**
   * La vitrina **publicada** de la organización dueña de la farmacia: el perfil
   * público que proyectó la verificación del tenant, visible y activo. `null`
   * si el tenant todavía no tiene vitrina publicada; acá no se crea ninguna.
   */
  async findTenantShowcaseId(
    em: EntityManager,
    tenantId: string,
  ): Promise<string | null> {
    const rows = await em.execute<{ id: string }[]>(
      `select prof.id
         from community.public_profiles prof
        where prof.target_id = ?
          and prof.visibility_concept_id = ?
          and prof.status_concept_id = ?
        limit 1`,
      [tenantId, COMM.PROFILE_VISIBILITY_PUBLIC, CONCEPTS.STATE_ACTIVE],
    );
    return rows?.[0]?.id ?? null;
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
