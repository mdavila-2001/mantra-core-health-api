import { Injectable } from '@nestjs/common';
import { LockMode } from '@mikro-orm/core';
import type { EntityManager } from '@mikro-orm/postgresql';
import { TenantCatalogPolicies, TenantConceptConfig } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para materializar la política de catálogo de un tenant. */
export interface UpsertTenantCatalogPolicyData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a value set.
   */
  valueSetId: string;
  /**
   * Identificador asociado a mode concept.
   */
  modeConceptId?: string;
  /**
   * Valor de allow subset mantenido por la instancia.
   */
  allowSubset?: boolean;
  /**
   * Valor de allow alias mantenido por la instancia.
   */
  allowAlias?: boolean;
  /**
   * Valor de allow local concepts mantenido por la instancia.
   */
  allowLocalConcepts?: boolean;
  /**
   * Valor de valid from mantenido por la instancia.
   */
  validFrom?: Date;
  /**
   * Valor de valid to mantenido por la instancia.
   */
  validTo?: Date;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Datos mínimos para materializar la configuración de un concepto por tenant. */
export interface UpsertTenantConceptConfigData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Identificador asociado a concept.
   */
  conceptId: string;
  /**
   * Valor de enabled mantenido por la instancia.
   */
  enabled: boolean;
  /**
   * Valor de alias display mantenido por la instancia.
   */
  aliasDisplay?: string;
  /**
   * Valor de ordinal mantenido por la instancia.
   */
  ordinal?: number;
  /**
   * Valor de is default mantenido por la instancia.
   */
  isDefault?: boolean;
  /**
   * Identificador asociado a actor user.
   */
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
