import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrganizationAffiliations } from '../entities';
import { createdBy } from '../../../common';

/** Datos para declarar una afiliación entre organizaciones (UC-22-07). */
export interface CreateAffiliationData {
  /**
   * Identificador asociado a primary tenant.
   */
  primaryTenantId: string;
  /**
   * Identificador asociado a participating tenant.
   */
  participatingTenantId: string;
  /**
   * Identificador asociado a affiliation type concept.
   */
  affiliationTypeConceptId: string;
  /**
   * Identificador asociado a host practice site.
   */
  hostPracticeSiteId?: string;
  /**
   * Identificador asociado a healthcare service.
   */
  healthcareServiceId?: string;
  /**
   * Valor de contract reference mantenido por la instancia.
   */
  contractReference?: string;
  /**
   * Identificador asociado a data use agreement.
   */
  dataUseAgreementId?: string;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
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
 * Acceso a datos de `organization_extensions.organization_affiliations`.
 * Stateless: recibe el `EntityManager` activo en cada método.
 */
@Injectable()
export class OrganizationAffiliationsRepository {
  /** Busca una afiliación por id; `null` si no existe. */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<OrganizationAffiliations | null> {
    return em.findOne(OrganizationAffiliations, { id });
  }

  /** Detecta una afiliación activa duplicada para (primary, participating, tipo). */
  findActiveDuplicate(
    em: EntityManager,
    primaryTenantId: string,
    participatingTenantId: string,
    affiliationTypeConceptId: string,
    activeConceptId: string,
  ): Promise<OrganizationAffiliations | null> {
    return em.findOne(OrganizationAffiliations, {
      primaryTenantId,
      participatingTenantId,
      affiliationTypeConceptId,
      statusConceptId: activeConceptId,
    });
  }

  /** Crea la afiliación en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateAffiliationData,
  ): OrganizationAffiliations {
    return em.create(
      OrganizationAffiliations,
      {
        primaryTenantId: data.primaryTenantId,
        participatingTenantId: data.participatingTenantId,
        affiliationTypeConceptId: data.affiliationTypeConceptId,
        hostPracticeSiteId: data.hostPracticeSiteId,
        healthcareServiceId: data.healthcareServiceId,
        contractReference: data.contractReference,
        dataUseAgreementId: data.dataUseAgreementId,
        validFrom: data.validFrom,
        validTo: data.validTo,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
