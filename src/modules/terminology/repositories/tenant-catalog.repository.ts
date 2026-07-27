import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TenantCatalogPolicies, TenantConceptConfig } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar la política de catálogo de un tenant. */
export interface UpsertTenantCatalogPolicyData {
  tenantId: string;
  valueSetId: string;
  modeConceptId?: string;
  allowSubset?: boolean;
  allowAlias?: boolean;
  allowLocalConcepts?: boolean;
  validFrom?: Date;
  validTo?: Date;
  actorUserId?: string;
}

/** Datos mínimos para materializar la configuración de un concepto por tenant. */
export interface UpsertTenantConceptConfigData {
  tenantId: string;
  conceptId: string;
  enabled: boolean;
  aliasDisplay?: string;
  ordinal?: number;
  isDefault?: boolean;
  actorUserId?: string;
}

/**
 * Acceso a datos de `terminology.tenant_catalog_policies` y
 * `terminology.tenant_concept_config` (UC-03-12): qué parte del catálogo global
 * ve cada tenant y cómo la renombra.
 */
@Injectable()
export class TenantCatalogRepository {
  /**
   * Política por su clave natural `(tenant, value set)`, bloqueada. El caso de uso
   * es un `PUT`: releerla y reescribirla sin bloqueo dejaría que dos
   * administradores del mismo tenant se pisaran.
   */
  findPolicyForUpdate(
    em: EntityManager,
    tenantId: string,
    valueSetId: string,
  ): Promise<TenantCatalogPolicies | null> {
    return em.findOne(
      TenantCatalogPolicies,
      { tenantId, valueSetId },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Crea la política en la unidad de trabajo (sin flush). */
  createPolicy(
    em: EntityManager,
    data: UpsertTenantCatalogPolicyData,
  ): TenantCatalogPolicies {
    return em.create(
      TenantCatalogPolicies,
      {
        tenantId: data.tenantId,
        valueSetId: data.valueSetId,
        modeConceptId: data.modeConceptId,
        allowSubset: data.allowSubset,
        allowAlias: data.allowAlias,
        allowLocalConcepts: data.allowLocalConcepts,
        validFrom: data.validFrom,
        validTo: data.validTo,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Configuración de un concepto para el tenant, por su clave natural. El caso de
   * uso declara `tenant_concept_config — UPSERT`.
   */
  findConfig(
    em: EntityManager,
    tenantId: string,
    conceptId: string,
  ): Promise<TenantConceptConfig | null> {
    return em.findOne(TenantConceptConfig, { tenantId, conceptId });
  }

  /**
   * Configuraciones del tenant marcadas por defecto, bloqueadas. El caso de uso
   * exige **un solo `is_default`**, y sin bloquearlas dos altas simultáneas
   * dejarían dos conceptos disputándose el valor por omisión.
   */
  findDefaultsForUpdate(
    em: EntityManager,
    tenantId: string,
    conceptIds: string[],
  ): Promise<TenantConceptConfig[]> {
    if (conceptIds.length === 0) return Promise.resolve([]);
    return em.find(
      TenantConceptConfig,
      { tenantId, isDefault: true },
      { lockMode: LockMode.PESSIMISTIC_WRITE },
    );
  }

  /** Crea la configuración del concepto en la unidad de trabajo (sin flush). */
  createConfig(
    em: EntityManager,
    data: UpsertTenantConceptConfigData,
  ): TenantConceptConfig {
    return em.create(
      TenantConceptConfig,
      {
        tenantId: data.tenantId,
        conceptId: data.conceptId,
        enabled: data.enabled,
        aliasDisplay: data.aliasDisplay,
        ordinal: data.ordinal,
        isDefault: data.isDefault,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
