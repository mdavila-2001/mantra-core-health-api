import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthProvenanceRecords,
  HealthProvenanceTargets,
  HealthLineageEdges,
} from '../entities';

/**
 * Describe el contrato estructural de create provenance data.
 */
export interface CreateProvenanceData {
  /**
   * Identificador asociado a custodian tenant.
   */
  custodianTenantId?: string;
  /**
   * Identificador asociado a activity concept.
   */
  activityConceptId: string;
  /**
   * Valor de occurred start at mantenido por la instancia.
   */
  occurredStartAt?: Date;
  /**
   * Valor de occurred end at mantenido por la instancia.
   */
  occurredEndAt?: Date;
  /**
   * Identificador asociado a source system.
   */
  sourceSystemId?: string;
  /**
   * Identificador asociado a responsible agent type concept.
   */
  responsibleAgentTypeConceptId?: string;
  /**
   * Identificador asociado a responsible agent.
   */
  responsibleAgentId?: string;
  /**
   * Identificador asociado a on behalf of organization.
   */
  onBehalfOfOrganizationId?: string;
  /**
   * Valor de policy uris json mantenido por la instancia.
   */
  policyUrisJson?: unknown;
  /**
   * Valor de content hash mantenido por la instancia.
   */
  contentHash?: string;
}

/**
 * Describe el contrato estructural de create lineage edge data.
 */
export interface CreateLineageEdgeData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId?: string;
  /**
   * Identificador asociado a source type concept.
   */
  sourceTypeConceptId: string;
  /**
   * Identificador asociado a source.
   */
  sourceId: string;
  /**
   * Identificador asociado a target type concept.
   */
  targetTypeConceptId: string;
  /**
   * Identificador asociado a target.
   */
  targetId: string;
  /**
   * Identificador asociado a transformation type concept.
   */
  transformationTypeConceptId: string;
  /**
   * Valor de transformation version mantenido por la instancia.
   */
  transformationVersion?: string;
  /**
   * Identificador asociado a job run.
   */
  jobRunId?: string;
  /**
   * Valor de content hash mantenido por la instancia.
   */
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
  /**
   * Crea create provenance record.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create provenance record conforme al contrato `HealthProvenanceRecords`.
   */
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

  /**
   * Crea create provenance target.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create provenance target conforme al contrato `HealthProvenanceTargets`.
   */
  createProvenanceTarget(
    em: EntityManager,
    data: {
      /**
       * Identificador asociado a health provenance record.
       */
      healthProvenanceRecordId: string;
      /**
       * Identificador asociado a target type concept.
       */
      targetTypeConceptId: string;
      /**
       * Identificador asociado a target.
       */
      targetId: string;
      /**
       * Identificador asociado a role concept.
       */
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

  /**
   * Crea create lineage edge.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create lineage edge conforme al contrato `HealthLineageEdges`.
   */
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
