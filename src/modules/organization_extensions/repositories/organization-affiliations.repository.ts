import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrganizationAffiliations } from '../entities';
import { createdBy } from '../../../common';

/** Datos para declarar una afiliación entre organizaciones (UC-22-07). */
export interface CreateAffiliationData {
  primaryTenantId: string;
  participatingTenantId: string;
  affiliationTypeConceptId: string;
  hostPracticeSiteId?: string;
  healthcareServiceId?: string;
  contractReference?: string;
  dataUseAgreementId?: string;
  validFrom?: Date;
  validTo?: Date;
  statusConceptId: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `organization_extensions.organization_affiliations`.
 * Stateless: recibe el `EntityManager` activo en cada método.
 */
@Injectable()
export class OrganizationAffiliationsRepository {
  /** Busca una afiliación por id; `null` si no existe. */
  findById(em: EntityManager, id: string): Promise<OrganizationAffiliations | null> {
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
  create(em: EntityManager, data: CreateAffiliationData): OrganizationAffiliations {
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
