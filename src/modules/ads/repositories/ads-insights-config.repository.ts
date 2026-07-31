import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  FrequencyCaps,
  InsightBreakdownDefinitions,
  InsightMetricDefinitions,
} from '../entities';

/**
 * Acceso a datos de configuración de entrega e insights de `ads`: los topes de
 * frecuencia (`frequency_caps`) y el catálogo de definiciones de desgloses
 * (`insight_breakdown_definitions`) y métricas (`insight_metric_definitions`).
 */
@Injectable()
export class AdsInsightsConfigRepository {
  // --- Topes de frecuencia (frequency_caps) ---

  /**
   * Obtiene find frequency cap by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de frequency cap.
   * @returns Resultado de find frequency cap by id conforme al contrato `Promise<FrequencyCaps | null>`.
   */
  findFrequencyCapById(
    em: EntityManager,
    id: string,
  ): Promise<FrequencyCaps | null> {
    return em.findOne(FrequencyCaps, { id });
  }

  /**
   * Lista los topes de frecuencia aplicables a un ámbito concreto.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param scopeConceptId - Identificador de scope concept.
   * @param scopeRefId - Identificador de scope ref.
   * @returns Resultado de list frequency caps by scope conforme al contrato `Promise<FrequencyCaps[]>`.
   */
  listFrequencyCapsByScope(
    em: EntityManager,
    scopeConceptId: string,
    scopeRefId: string,
  ): Promise<FrequencyCaps[]> {
    return em.find(FrequencyCaps, { scopeConceptId, scopeRefId });
  }

  // --- Definiciones de desglose (insight_breakdown_definitions) ---

  /**
   * Obtiene find breakdown definition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de breakdown definition.
   * @returns Resultado de find breakdown definition by id conforme al contrato `Promise<InsightBreakdownDefinitions | null>`.
   */
  findBreakdownDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<InsightBreakdownDefinitions | null> {
    return em.findOne(InsightBreakdownDefinitions, { id });
  }

  /**
   * Lista las definiciones de desglose disponibles para una plataforma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param platformConceptId - Identificador de platform concept.
   * @returns Resultado de list breakdown definitions by platform conforme al contrato `Promise<InsightBreakdownDefinitions[]>`.
   */
  listBreakdownDefinitionsByPlatform(
    em: EntityManager,
    platformConceptId: string,
  ): Promise<InsightBreakdownDefinitions[]> {
    return em.find(InsightBreakdownDefinitions, { platformConceptId });
  }

  // --- Definiciones de métrica (insight_metric_definitions) ---

  /**
   * Obtiene find metric definition by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de metric definition.
   * @returns Resultado de find metric definition by id conforme al contrato `Promise<InsightMetricDefinitions | null>`.
   */
  findMetricDefinitionById(
    em: EntityManager,
    id: string,
  ): Promise<InsightMetricDefinitions | null> {
    return em.findOne(InsightMetricDefinitions, { id });
  }

  /**
   * Lista las definiciones de métrica disponibles para una plataforma.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param platformConceptId - Identificador de platform concept.
   * @returns Resultado de list metric definitions by platform conforme al contrato `Promise<InsightMetricDefinitions[]>`.
   */
  listMetricDefinitionsByPlatform(
    em: EntityManager,
    platformConceptId: string,
  ): Promise<InsightMetricDefinitions[]> {
    return em.find(InsightMetricDefinitions, { platformConceptId });
  }
}
