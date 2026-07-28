import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { AnalyticsGovernanceLog } from '../entities';

/** Registro de gobernanza analítica (export/disclosure, UC-10-07/08/11). */
export interface RecordGovernanceData {
  /**
   * Identificador asociado a actor user.
   */
  actorUserId: string;
  /**
   * Identificador asociado a action concept.
   */
  actionConceptId: string;
  /**
   * Identificador asociado a approval status concept.
   */
  approvalStatusConceptId: string;
  /**
   * Identificador asociado a purpose definition.
   */
  purposeDefinitionId?: string;
  /**
   * Valor de export reference mantenido por la instancia.
   */
  exportReference?: string;
  /**
   * Valor de affected subject count mantenido por la instancia.
   */
  affectedSubjectCount?: number;
  /**
   * Valor de query hash mantenido por la instancia.
   */
  queryHash?: string;
}

/**
 * Acceso a `audit.analytics_governance_log` — tabla append-only (solo `occurred_at`).
 * `query_hash` + `export_reference` identifican de forma única una exportación para
 * evitar duplicados. Stateless.
 */
@Injectable()
export class AnalyticsGovernanceLogRepository {
  /** ¿Ya existe una exportación con este `query_hash`? (idempotencia, UC-10-07). */
  existsByQueryHash(em: EntityManager, queryHash: string): Promise<number> {
    return em.count(AnalyticsGovernanceLog, { queryHash });
  }

  /** Encola una fila de gobernanza; sin flush. */
  record(
    em: EntityManager,
    data: RecordGovernanceData,
  ): AnalyticsGovernanceLog {
    return em.create(
      AnalyticsGovernanceLog,
      {
        actorUserId: data.actorUserId,
        actionConceptId: data.actionConceptId,
        purposeDefinitionId: data.purposeDefinitionId,
        exportReference: data.exportReference,
        affectedSubjectCount:
          data.affectedSubjectCount === undefined
            ? undefined
            : String(data.affectedSubjectCount),
        queryHash: data.queryHash,
        approvalStatusConceptId: data.approvalStatusConceptId,
        occurredAt: new Date(),
      },
      { partial: true },
    );
  }
}
