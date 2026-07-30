import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  TenantAffiliationDocuments,
  TenantLegalRepresentatives,
  TenantWebConfigs,
} from '../entities';

/**
 * Acceso a datos de la configuración legal/web del tenant en el esquema
 * `directory`: representantes legales, documentos de afiliación y configuración
 * web. Stateless: la unidad de trabajo se recibe siempre por parámetro.
 */
@Injectable()
export class DirectoryTenantLegalRepository {
  /** Configuración web del tenant, si existe. */
  findWebConfigByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<TenantWebConfigs | null> {
    return em.findOne(TenantWebConfigs, { tenantId });
  }

  /** Representantes legales registrados para el tenant. */
  listLegalRepsByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<TenantLegalRepresentatives[]> {
    return em.find(TenantLegalRepresentatives, { tenantId });
  }

  /** Documentos de afiliación registrados para el tenant. */
  listAffiliationDocsByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<TenantAffiliationDocuments[]> {
    return em.find(TenantAffiliationDocuments, { tenantId });
  }
}
