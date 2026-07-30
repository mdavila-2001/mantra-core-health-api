import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TrackingPurposeDefinitions } from '../entities';

/** Datos de alta de un propósito de tracking (UC-28-01). */
export interface CreateTrackingPurposeData {
  /**
   * Valor de purpose code mantenido por la instancia.
   */
  purposeCode: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a purpose category concept.
   */
  purposeCategoryConceptId: string;
  /**
   * Identificador asociado a legal basis concept.
   */
  legalBasisConceptId?: string;
  /**
   * Valor de requires consent mantenido por la instancia.
   */
  requiresConsent?: boolean;
  /**
   * Valor de permits marketing use mantenido por la instancia.
   */
  permitsMarketingUse?: boolean;
  /**
   * Valor de permits cross tenant aggregation mantenido por la instancia.
   */
  permitsCrossTenantAggregation?: boolean;
  /**
   * Valor de default retention days mantenido por la instancia.
   */
  defaultRetentionDays?: number;
  /**
   * Valor de version number mantenido por la instancia.
   */
  versionNumber: number;
  /**
   * Valor de effective from mantenido por la instancia.
   */
  effectiveFrom: Date;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a `telemetry.tracking_purpose_definitions`. Stateless: recibe el `em`. */
@Injectable()
export class TrackingPurposeDefinitionsRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<TrackingPurposeDefinitions | null>`.
   */
  findById(
    em: EntityManager,
    id: string,
  ): Promise<TrackingPurposeDefinitions | null> {
    return em.findOne(TrackingPurposeDefinitions, { id });
  }

  /**
   * Obtiene find by code.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param purposeCode - Valor de purpose code requerido por la operación.
   * @returns Resultado de find by code conforme al contrato `Promise<TrackingPurposeDefinitions | null>`.
   */
  findByCode(
    em: EntityManager,
    purposeCode: string,
  ): Promise<TrackingPurposeDefinitions | null> {
    return em.findOne(TrackingPurposeDefinitions, { purposeCode });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `TrackingPurposeDefinitions`.
   */
  create(
    em: EntityManager,
    data: CreateTrackingPurposeData,
  ): TrackingPurposeDefinitions {
    return em.create(
      TrackingPurposeDefinitions,
      {
        purposeCode: data.purposeCode,
        name: data.name,
        purposeCategoryConceptId: data.purposeCategoryConceptId,
        legalBasisConceptId: data.legalBasisConceptId,
        requiresConsent: data.requiresConsent,
        permitsMarketingUse: data.permitsMarketingUse,
        permitsCrossTenantAggregation: data.permitsCrossTenantAggregation,
        defaultRetentionDays: data.defaultRetentionDays,
        versionNumber: data.versionNumber,
        effectiveFrom: data.effectiveFrom,
        statusConceptId: data.statusConceptId,
        createdAt: new Date(),
        createdByUserId: data.actorUserId,
      },
      { partial: true },
    );
  }
}
