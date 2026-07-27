import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthProvenanceRecords,
  HealthProvenanceTargets,
  HealthLineageEdges,
} from '../entities';

export interface CreateProvenanceData {
  custodianTenantId?: string;
  activityConceptId: string;
  occurredStartAt?: Date;
  occurredEndAt?: Date;
  sourceSystemId?: string;
  responsibleAgentTypeConceptId?: string;
  responsibleAgentId?: string;
  onBehalfOfOrganizationId?: string;
  policyUrisJson?: unknown;
  contentHash?: string;
}

export interface CreateLineageEdgeData {
  tenantId?: string;
  sourceTypeConceptId: string;
  sourceId: string;
  targetTypeConceptId: string;
  targetId: string;
  transformationTypeConceptId: string;
  transformationVersion?: string;
  jobRunId?: string;
  contentHash?: string;
}

/**
 * Acceso a la procedencia y el linaje de `health_data.*`.
 *
 * Tiene repositorio propio porque las tres tablas las escriben cinco casos de
 * uso repartidos en cuatro servicios —ingesta, binding, de-identificación,
 * exportación y retiro—. Colgarlas de cualquiera de ellos obligaría a los demás
 * a depender de un repositorio que no es suyo.
 *
 * Las tres son inmutables: sólo hay métodos de inserción. Una procedencia que
 * se pudiera reescribir no probaría nada.
 */
@Injectable()
export class HealthProvenanceRepository {
  createProvenanceRecord(
    em: EntityManager,
    data: CreateProvenanceData,
  ): HealthProvenanceRecords {
    return em.create(
      HealthProvenanceRecords,
      {
        custodianTenantId: data.custodianTenantId,
        activityConceptId: data.activityConceptId,
        recordedAt: new Date(),
        occurredStartAt: data.occurredStartAt,
        occurredEndAt: data.occurredEndAt,
        sourceSystemId: data.sourceSystemId,
        responsibleAgentTypeConceptId: data.responsibleAgentTypeConceptId,
        responsibleAgentId: data.responsibleAgentId,
        onBehalfOfOrganizationId: data.onBehalfOfOrganizationId,
        policyUrisJson: data.policyUrisJson,
        contentHash: data.contentHash,
      },
      { partial: true },
    );
  }

  createProvenanceTarget(
    em: EntityManager,
    data: {
      healthProvenanceRecordId: string;
      targetTypeConceptId: string;
      targetId: string;
      roleConceptId?: string;
    },
  ): HealthProvenanceTargets {
    return em.create(
      HealthProvenanceTargets,
      {
        healthProvenanceRecordId: data.healthProvenanceRecordId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        roleConceptId: data.roleConceptId,
      },
      { partial: true },
    );
  }

  createLineageEdge(
    em: EntityManager,
    data: CreateLineageEdgeData,
  ): HealthLineageEdges {
    return em.create(
      HealthLineageEdges,
      {
        tenantId: data.tenantId,
        sourceTypeConceptId: data.sourceTypeConceptId,
        sourceId: data.sourceId,
        targetTypeConceptId: data.targetTypeConceptId,
        targetId: data.targetId,
        transformationTypeConceptId: data.transformationTypeConceptId,
        transformationVersion: data.transformationVersion,
        jobRunId: data.jobRunId,
        recordedAt: new Date(),
        contentHash: data.contentHash,
      },
      { partial: true },
    );
  }
}
