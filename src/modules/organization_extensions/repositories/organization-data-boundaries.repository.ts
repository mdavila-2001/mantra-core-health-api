import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrganizationDataBoundaries } from '../entities';
import { createdBy } from '../../../common';

/** Datos para definir una frontera de datos (residencia/RLS) (UC-22-08). */
export interface CreateDataBoundaryData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a boundary type concept.
   */
  boundaryTypeConceptId: string;
  /**
   * Identificador asociado a data controller tenant.
   */
  dataControllerTenantId: string;
  /**
   * Identificador asociado a data processor tenant.
   */
  dataProcessorTenantId?: string;
  /**
   * Identificador asociado a jurisdiction concept.
   */
  jurisdictionConceptId?: string;
  /**
   * Identificador asociado a residency region concept.
   */
  residencyRegionConceptId?: string;
  /**
   * Identificador asociado a allowed purpose value set.
   */
  allowedPurposeValueSetId?: string;
  /**
   * Valor de isolation schema name mantenido por la instancia.
   */
  isolationSchemaName?: string;
  /**
   * Valor de isolation policy version mantenido por la instancia.
   */
  isolationPolicyVersion?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `organization_extensions.organization_data_boundaries`.
 * Stateless: recibe el `EntityManager` activo en cada método.
 */
@Injectable()
export class OrganizationDataBoundariesRepository {
  /** Busca una frontera vigente por (tenant, tipo) en estado dado. */
  findActiveByTenantAndType(
    em: EntityManager,
    tenantId: string,
    boundaryTypeConceptId: string,
    activeConceptId: string,
  ): Promise<OrganizationDataBoundaries | null> {
    return em.findOne(OrganizationDataBoundaries, {
      tenantId,
      boundaryTypeConceptId,
      statusConceptId: activeConceptId,
    });
  }

  /** Cuenta fronteras activas para un tenant (guard de afiliación, UC-22-07). */
  countActiveForTenant(
    em: EntityManager,
    tenantId: string,
    activeConceptId: string,
  ): Promise<number> {
    return em.count(OrganizationDataBoundaries, {
      tenantId,
      statusConceptId: activeConceptId,
    });
  }

  /** Crea la frontera de datos en la unidad de trabajo (sin flush). */
  create(
    em: EntityManager,
    data: CreateDataBoundaryData,
  ): OrganizationDataBoundaries {
    return em.create(
      OrganizationDataBoundaries,
      {
        tenantId: data.tenantId,
        boundaryTypeConceptId: data.boundaryTypeConceptId,
        dataControllerTenantId: data.dataControllerTenantId,
        dataProcessorTenantId: data.dataProcessorTenantId,
        jurisdictionConceptId: data.jurisdictionConceptId,
        residencyRegionConceptId: data.residencyRegionConceptId,
        allowedPurposeValueSetId: data.allowedPurposeValueSetId,
        isolationSchemaName: data.isolationSchemaName,
        isolationPolicyVersion: data.isolationPolicyVersion,
        statusConceptId: data.statusConceptId,
        effectiveFrom: data.effectiveFrom,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
