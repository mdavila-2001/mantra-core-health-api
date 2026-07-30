import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { ConsentProvisions } from '../entities';
import { createdBy } from '../../../common';

/** Datos de una provisión granular de un consentimiento. */
export interface CreateProvisionData {
  /**
   * Identificador asociado a consent.
   */
  consentId: string;
  /**
   * Identificador asociado a provision type concept.
   */
  provisionTypeConceptId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a data class concept.
   */
  dataClassConceptId?: string;
  /**
   * Identificador asociado a actor tenant.
   */
  actorTenantId?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
  /**
   * Identificador asociado a actor role concept.
   */
  actorRoleConceptId?: string;
  /**
   * Identificador asociado a purpose of use concept.
   */
  purposeOfUseConceptId?: string;
  /**
   * Identificador asociado a security label concept.
   */
  securityLabelConceptId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a created by user.
   */
  createdByUserId?: string;
}

/** Acceso a datos de `consent.consent_provisions`. */
@Injectable()
export class ConsentProvisionsRepository {
  /** Provisiones vigentes (sin `valid_to`) de un consentimiento. */
  findOpenByConsent(
    em: EntityManager,
    consentId: string,
  ): Promise<ConsentProvisions[]> {
    return em.find(ConsentProvisions, { consentId, validTo: null });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `ConsentProvisions`.
   */
  create(em: EntityManager, data: CreateProvisionData): ConsentProvisions {
    return em.create(
      ConsentProvisions,
      {
        consentId: data.consentId,
        provisionTypeConceptId: data.provisionTypeConceptId,
        actionConceptId: data.actionConceptId,
        dataClassConceptId: data.dataClassConceptId,
        actorTenantId: data.actorTenantId,
        actorUserId: data.actorUserId,
        actorRoleConceptId: data.actorRoleConceptId,
        purposeOfUseConceptId: data.purposeOfUseConceptId,
        securityLabelConceptId: data.securityLabelConceptId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.createdByUserId),
      },
      { partial: true },
    );
  }
}
