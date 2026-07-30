import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  HealthTerminologyMappingSets,
  HealthTerminologyMappingRules,
  OmopMappingSets,
  OmopMappingRules,
} from '../entities';

/**
 * Acceso a datos de los conjuntos y reglas de mapeo de terminología y OMOP
 * (`health_data.health_terminology_mapping_sets` / `_rules` y
 * `health_data.omop_mapping_sets` / `_rules`). Un conjunto agrupa sus reglas por
 * FK; aquí se resuelve el conjunto por id y se listan sus reglas.
 */
@Injectable()
export class HealthTerminologyMappingRepository {
  /**
   * Obtiene find set by id (conjunto de mapeo de terminología).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find set by id conforme al contrato `Promise<HealthTerminologyMappingSets | null>`.
   */
  findSetById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<HealthTerminologyMappingSets | null> {
    return em.findOne(HealthTerminologyMappingSets, { id, tenantId });
  }

  /** Reglas de un conjunto de mapeo de terminología, ordenadas por código fuente. */
  listRulesBySet(
    em: EntityManager,
    healthTerminologyMappingSetId: string,
  ): Promise<HealthTerminologyMappingRules[]> {
    return em.find(
      HealthTerminologyMappingRules,
      { healthTerminologyMappingSetId },
      { orderBy: { sourceCode: 'ASC' } },
    );
  }

  /**
   * Obtiene find omop set by id (conjunto de mapeo OMOP CDM).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find omop set by id conforme al contrato `Promise<OmopMappingSets | null>`.
   */
  findOmopSetById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<OmopMappingSets | null> {
    return em.findOne(OmopMappingSets, { id, tenantId });
  }

  /** Reglas de un conjunto de mapeo OMOP, ordenadas por tabla/columna destino. */
  listOmopRulesBySet(
    em: EntityManager,
    omopMappingSetId: string,
  ): Promise<OmopMappingRules[]> {
    return em.find(
      OmopMappingRules,
      { omopMappingSetId },
      { orderBy: { targetTable: 'ASC', targetColumn: 'ASC' } },
    );
  }
}
