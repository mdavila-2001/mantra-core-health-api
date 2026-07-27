import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { OrganizationDataBoundaries } from '../entities';
import { createdBy } from '../../../common';

/** Datos para definir una frontera de datos (residencia/RLS) (UC-22-08). */
export interface CreateDataBoundaryData {
  tenantId: string;
  boundaryTypeConceptId: string;
  dataControllerTenantId: string;
  dataProcessorTenantId?: string;
  jurisdictionConceptId?: string;
  residencyRegionConceptId?: string;
  allowedPurposeValueSetId?: string;
  isolationSchemaName?: string;
  isolationPolicyVersion?: string;
  statusConceptId: string;
  effectiveFrom: Date;
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
