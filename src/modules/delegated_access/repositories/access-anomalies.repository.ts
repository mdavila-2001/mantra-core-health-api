import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { randomUUID } from 'node:crypto';
import { DELEG } from '../delegated_access.concepts';
import { AccessAnomalies } from '../entities';

/** Anomalía detectada por el barrido. */
export interface DetectedAnomaly {
  /** Organización. */
  readonly tenantId: string;
  /** Persona observada. */
  readonly userId: string;
  /** Vínculo de la persona, si lo hay. */
  readonly organizationUserAssignmentId?: string;
  /** Concepto del tipo (`ANOMALY_*`). */
  readonly kindConceptId: string;
  /** Inicio de la ventana observada. */
  readonly windowStart: Date;
  /** Fin de la ventana observada. */
  readonly windowEnd: Date;
  /** Valor observado (decimal con 2 cifras, como texto). */
  readonly observedValue: string;
  /** Valor base de comparación. */
  readonly baselineValue?: string;
  /** Umbral superado. */
  readonly thresholdValue: string;
  /** Evidencia: identificadores y números, nunca datos del paciente. */
  readonly evidence: unknown;
}

/** Filtro de la lista de anomalías. */
export interface AccessAnomaliesFilter {
  /** Solo estos estados. */
  readonly statusConceptIds?: readonly string[];
  /** Solo estos tipos. */
  readonly kindConceptIds?: readonly string[];
  /** Tope de filas. */
  readonly limit?: number;
}

/** Cierre de una anomalía. */
export interface AnomalyResolution {
  /** Concepto del estado final (`ANOMALY_ACKNOWLEDGED|DISMISSED|ESCALATED`). */
  readonly statusConceptId: string;
  /** Quien resuelve. */
  readonly byUserId?: string;
  /** Comentario (mínimo 10 caracteres al descartar). */
  readonly comment?: string;
  /** Instante. */
  readonly now: Date;
}

/** Acceso a datos de `delegated_access.access_anomalies`. */
@Injectable()
export class AccessAnomaliesRepository {
  /**
   * Registra una anomalía de forma IDEMPOTENTE: el barrido puede repetirse sin
   * duplicar (`ON CONFLICT (tenant_id, user_id, kind_concept_id, window_start) DO NOTHING`).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param anomaly - Anomalía detectada.
   * @param actorUserId - Autor del asiento; ausente = el sistema.
   * @returns `true` si se creó, `false` si ya existía esa ventana.
   */
  async createIfAbsent(
    em: EntityManager,
    anomaly: DetectedAnomaly,
    actorUserId?: string,
  ): Promise<boolean> {
    const now = new Date();
    const rows = await em.execute<{ id: string }[]>(
      'insert into "delegated_access"."access_anomalies" (id, tenant_id, user_id, organization_user_assignment_id, ' +
        'kind_concept_id, window_start, window_end, observed_value, baseline_value, threshold_value, evidence_json, ' +
        'status_concept_id, created_at, updated_at, created_by_user_id, updated_by_user_id) ' +
        'values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?::jsonb, ?, ?, ?, ?, ?) ' +
        'on conflict (tenant_id, user_id, kind_concept_id, window_start) do nothing returning id',
      [
        randomUUID(),
        anomaly.tenantId,
        anomaly.userId,
        anomaly.organizationUserAssignmentId ?? null,
        anomaly.kindConceptId,
        anomaly.windowStart,
        anomaly.windowEnd,
        anomaly.observedValue,
        anomaly.baselineValue ?? null,
        anomaly.thresholdValue,
        JSON.stringify(anomaly.evidence),
        DELEG.ANOMALY_OPEN,
        now,
        now,
        actorUserId ?? null,
        actorUserId ?? null,
      ],
    );
    return rows.length > 0;
  }

  /**
   * Anomalía por id, acotada a la organización.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param id - Id de la anomalía.
   * @returns La anomalía o `null`.
   */
  findById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<AccessAnomalies | null> {
    return em.findOne(AccessAnomalies, { tenantId, id });
  }

  /**
   * Anomalías de una organización, las más nuevas primero.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param filter - Estados, tipos y tope.
   * @returns Las anomalías.
   */
  findByTenant(
    em: EntityManager,
    tenantId: string,
    filter: AccessAnomaliesFilter = {},
  ): Promise<AccessAnomalies[]> {
    return em.find(
      AccessAnomalies,
      {
        tenantId,
        ...(filter.statusConceptIds
          ? { statusConceptId: { $in: [...filter.statusConceptIds] } }
          : {}),
        ...(filter.kindConceptIds
          ? { kindConceptId: { $in: [...filter.kindConceptIds] } }
          : {}),
      },
      {
        orderBy: { createdAt: 'desc', id: 'desc' },
        ...(filter.limit ? { limit: filter.limit } : {}),
      },
    );
  }

  /**
   * Anomalías abiertas de una persona (alimentan su puntaje en el tablero).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Organización.
   * @param userId - Persona.
   * @returns Las anomalías abiertas.
   */
  findOpenByUser(
    em: EntityManager,
    tenantId: string,
    userId: string,
  ): Promise<AccessAnomalies[]> {
    return em.find(AccessAnomalies, {
      tenantId,
      userId,
      statusConceptId: DELEG.ANOMALY_OPEN,
    });
  }

  /**
   * Reconoce, escala o descarta una anomalía dejando quién, cuándo y por qué.
   *
   * @param row - Anomalía que se resuelve.
   * @param resolution - Estado final, autor, comentario e instante.
   */
  resolve(row: AccessAnomalies, resolution: AnomalyResolution): void {
    row.statusConceptId = resolution.statusConceptId;
    row.acknowledgedByUserId = resolution.byUserId;
    row.acknowledgedAt = resolution.now;
    row.resolutionCommentText = resolution.comment;
    row.updatedAt = resolution.now;
    row.updatedByUserId = resolution.byUserId;
  }
}
