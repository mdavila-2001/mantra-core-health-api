import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import {
  TenantAffiliationDocuments,
  TenantLegalRepresentatives,
  TenantWebConfigs,
} from '../entities';
// Lectura, no escritura: `GET /tenants/me` necesita el nombre de las personas
// que representan al tenant, y `directory` no puede inyectar
// `PersonsRepository` — `ProfilesModule` importa `DirectoryModule`, así que el
// camino inverso cerraría un ciclo. Consultar la entidad de otro módulo en una
// lectura ya tiene precedente (`pharmacy-orders.repository.ts`,
// `scheduling-notice.repository.ts`). La ESCRITURA de `profiles.persons` sigue
// pasando sólo por `PersonsRepository`, desde `iam`.
import { Persons } from '../../profiles/entities';
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
  /**
   * De quién habla el documento, cuando habla de alguien (subtarea 1.4).
   *
   * El poder notariado acredita a UNA persona; sin esto la fila diría que hay
   * un poder pero no de quién, y el vínculo sólo se podría reconstruir yendo
   * al revés desde `tenant_legal_representatives`.
   */
  readonly relatedPersonId?: string;
  readonly actorUserId?: string;
}

/** Datos mínimos para registrar a quien representa legalmente al tenant (subtarea 1.4). */
export interface CreateTenantLegalRepresentativeData {
  readonly tenantId: string;
  readonly personId: string;
  readonly representativeRoleConceptId: string;
  /** CI de la persona, si el alta lo declaró. */
  readonly ciIdentifierId?: string;
  /** El poder que lo acredita, ya materializado como documento de afiliación. */
  readonly powerOfAttorneyDocumentId?: string;
  /**
   * `true` sólo para el representante legal; para el resto **se omite**.
   *
   * El tipo es `true` y no `boolean` a propósito:
   * `uk_tenant_legal_representatives_primary` es UNIQUE sobre
   * `(tenant_id, is_primary)` y no es parcial, así que un `false` repetido
   * viola la clave igual que un `true` repetido. Omitir la propiedad deja la
   * columna en `NULL`, y Postgres trata cada `NULL` como distinto.
   */
  readonly isPrimary?: true;
  readonly statusConceptId: string;
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
        relatedPersonId: data.relatedPersonId,
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

  /**
   * Construye el vínculo persona↔tenant en la unidad de trabajo (sin flush).
   *
   * `isPrimary` se omite cuando no viene: ver
   * {@link CreateTenantLegalRepresentativeData.isPrimary}.
   */
  createLegalRepresentative(
    em: EntityManager,
    data: CreateTenantLegalRepresentativeData,
  ): TenantLegalRepresentatives {
    return em.create(
      TenantLegalRepresentatives,
      {
        tenantId: data.tenantId,
        personId: data.personId,
        representativeRoleConceptId: data.representativeRoleConceptId,
        ciIdentifierId: data.ciIdentifierId,
        powerOfAttorneyDocumentId: data.powerOfAttorneyDocumentId,
        ...(data.isPrimary === undefined ? {} : { isPrimary: data.isPrimary }),
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }

  /**
   * Las personas nombradas por un conjunto de vínculos, por id.
   *
   * Una sola consulta para todas: pedirlas de a una sería N+1 sobre la lectura
   * de organizaciones, que ya recorre una membresía por vuelta.
   */
  async findPersonsByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<Map<string, Persons>> {
    if (ids.length === 0) return new Map();
    const personas = await em.find(Persons, { id: { $in: [...ids] } });
    return new Map(personas.map((persona) => [persona.id, persona]));
  }
}
