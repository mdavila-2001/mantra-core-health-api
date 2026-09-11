import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  TenantAffiliationDocuments,
  TenantLegalRepresentatives,
  TenantWebConfigs,
} from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para registrar un documento legal de afiliación ya reclamado. */
export interface CreateTenantAffiliationDocumentData {
  readonly tenantId: string;
  readonly documentTypeConceptId: string;
  readonly issuingAuthorityConceptId: string;
  readonly fileId: string;
  readonly verificationStatusConceptId: string;
  readonly statusConceptId: string;
  /** Sólo se declara para el rol `TAX_IDENTIFIER_DOC` (el NIT que el formulario ya captura). */
  readonly documentNumber?: string;
  readonly registeredAt?: Date;
  readonly isRequiredForAffiliation?: boolean;
  readonly actorUserId?: string;
}

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

  /** Busca el documento de afiliación que ya envuelve un archivo, si existe. */
  findAffiliationDocumentByFile(
    em: EntityManager,
    fileId: string,
  ): Promise<TenantAffiliationDocuments | null> {
    return em.findOne(TenantAffiliationDocuments, { fileId });
  }

  /** Construye la entidad en la unidad de trabajo (sin flush). */
  createAffiliationDocument(
    em: EntityManager,
    data: CreateTenantAffiliationDocumentData,
  ): TenantAffiliationDocuments {
    return em.create(
      TenantAffiliationDocuments,
      {
        tenantId: data.tenantId,
        documentTypeConceptId: data.documentTypeConceptId,
        issuingAuthorityConceptId: data.issuingAuthorityConceptId,
        fileId: data.fileId,
        documentNumber: data.documentNumber,
        registeredAt: data.registeredAt,
        verificationStatusConceptId: data.verificationStatusConceptId,
        isRequiredForAffiliation: data.isRequiredForAffiliation,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
        // `partial: true`: `row_version` tiene DEFAULT en BD y la gestiona
        // MikroORM; el tipo la exigiría sin este relajo (mismo patrón que
        // `FilesRepository.create`).
      },
      { partial: true },
    );
  }
}
