import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CONCEPTS, touch } from '../../../common';
import { LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE } from '../../../common/constants/legal-entity-types';
import { Addresses } from '../../common/entities/addresses.entity';
import { PracticeSites } from '../../practice/entities/practice_sites.entity';
import { Pharmacies } from '../../pharmacy/entities/pharmacies.entity';
import { DiagnosticUnits } from '../../diagnostic_units/entities/diagnostic_units.entity';
import { DUNIT } from '../../diagnostic_units/diagnostic_units.concepts';
import {
  AFFILIATION_DOCUMENT_VALUE_SETS,
  DOCUMENT_TYPE_CODE_BY_ROLE,
  type AffiliationDocumentRole,
} from '../affiliation-documents';
import { TenantAffiliationDocuments } from '../entities';
import { DirectoryTenantLegalRepository } from '../repositories';
import { AffiliationDocumentConceptsService } from './affiliation-document-concepts.service';

/**
 * Lo que una farmacia necesita para operar: los seis papeles en PDF y el punto
 * de su casa central en el mapa (P50).
 *
 * - Un rol de documento (`TAX_IDENTIFIER_DOC`, `HEALTH_AUTHORITY_CERT_DOC`…)
 *   cuando no hay un documento vivo de ese tipo.
 * - `PHARMACY_RECORD` cuando el tenant no tiene fila en `pharmacy.pharmacies`
 *   (una farmacia aprovisionada a mano antes de P50).
 * - `HEADQUARTERS_LOCATION` cuando la casa central no está enlazada o no tiene
 *   coordenadas: sin punto no hay a dónde mandar a quien compra ni desde dónde
 *   medir la sucursal más cercana.
 */
export type PharmacyOperatingRequirement =
  AffiliationDocumentRole | 'PHARMACY_RECORD' | 'HEADQUARTERS_LOCATION';

/**
 * Las clases de organización que tienen requisitos para operar.
 *
 * - `PHARMACY`: tenant de tipo farmacia (P50).
 * - `LABORATORY`: tenant `DIAGNOSTIC_CENTER` con una unidad diagnóstica de
 *   laboratorio clínico (P51, punto 6). Un centro de imágenes, o uno que
 *   todavía no declaró ninguna unidad, no tiene requisitos acá: el proceso
 *   4.1 del registro es el del laboratorio de sangre.
 */
export type OperatingKind = 'PHARMACY' | 'LABORATORY';

/**
 * Lo que puede faltarle a cualquier clase de organización para operar. Un
 * laboratorio sólo puede deber papeles: su unidad existe por definición.
 */
export type OperatingRequirement = PharmacyOperatingRequirement;

/** Resultado de evaluar a una farmacia contra sus requisitos de operación. */
export interface PharmacyOperatingReadiness {
  /** `true` si no falta nada. */
  readonly ready: boolean;
  /** Lo que falta, en orden estable. Vacío si `ready`. */
  readonly missing: readonly PharmacyOperatingRequirement[];
  /**
   * Los documentos vivos que cumplen los requisitos de papeles. Son los que la
   * verificación de la plataforma marca como verificados.
   */
  readonly documentIds: readonly string[];
}

/** Estados de verificación de un documento que ya no cuentan como presentado. */
const DEAD_VERIFICATION_CODES = ['RECHAZADO', 'VENCIDO'] as const;

/** Código del estado de verificación con el que la plataforma aprueba un papel. */
const DOCUMENT_VERIFIED_CODE = 'VERIFICADO';

/**
 * Los papeles que exige una farmacia para operar, según su tipo societario.
 *
 * Los seis del registro de procesos (Módulo Farmacia §1): constitución, NIT,
 * SEPREC, licencia de funcionamiento, certificado del SEDES y poder del
 * representante. La única excepción es la misma que ya aplica el alta (CL-43):
 * una empresa unipersonal no tiene escritura de constitución ni poder, porque
 * el titular actúa por sí.
 *
 * @param legalEntityTypeConceptId - Tipo societario del tenant.
 * @returns Los roles exigidos, en orden estable.
 */
export function requiredPharmacyDocuments(
  legalEntityTypeConceptId: string | undefined,
): AffiliationDocumentRole[] {
  const unipersonal =
    legalEntityTypeConceptId !== undefined &&
    legalEntityTypeConceptId === LEGAL_ENTITY_TYPE_CONCEPT_BY_CODE.UNIPERSONAL;
  return [
    ...(unipersonal ? [] : (['CONSTITUTION_DOC'] as const)),
    'TAX_IDENTIFIER_DOC',
    'COMMERCE_REGISTRY_DOC',
    'OPERATING_LICENSE_DOC',
    'HEALTH_AUTHORITY_CERT_DOC',
    ...(unipersonal ? [] : (['POWER_OF_ATTORNEY_DOC'] as const)),
  ];
}

/**
 * Hace cumplir «una farmacia no opera sin sus papeles» (P50, punto 4).
 *
 * El alta pública deja todo esto opcional (decisión D2: lo obligatorio es lo
 * más básico para nacer); acá se exige en el único paso que la deja operar,
 * la verificación de la plataforma (`POST /admin/tenants/{id}/verification`),
 * que es la que pasa la farmacia a `PHARMACY_ACTIVE`. Mientras no esté activa,
 * la farmacia no aparece en la vitrina ni en el catálogo público y no puede
 * dar de alta sedes (`PharmacySitesService.createSite`).
 *
 * Que el papel esté «presentado» lo dice esta regla; que sea auténtico lo
 * atestigua la plataforma al verificar, y por eso la verificación los marca
 * `VERIFICADO` ({@link PharmacyOperatingRequirementsService.markDocumentsVerified}).
 */
/**
 * Los papeles que exige un laboratorio clínico para operar (P51, punto 6).
 *
 * Los tres que habilitan a un laboratorio de sangre a atender: la matrícula del
 * SEPREC, la licencia de funcionamiento municipal y el certificado del SEDES.
 * Igual que en la farmacia, son obligatorios para operar y no para registrarse:
 * el alta pública los deja opcionales y se completan con
 * `POST /tenants/{id}/affiliation-documents`. No dependen del tipo societario.
 *
 * @returns Los roles exigidos, en orden estable.
 */
export function requiredLaboratoryDocuments(): AffiliationDocumentRole[] {
  return [
    'COMMERCE_REGISTRY_DOC',
    'OPERATING_LICENSE_DOC',
    'HEALTH_AUTHORITY_CERT_DOC',
  ];
}

/**
 * Los papeles que exige una clase de organización para operar.
 *
 * @param kind - Farmacia o laboratorio.
 * @param legalEntityTypeConceptId - Tipo societario del tenant.
 * @returns Los roles exigidos, en orden estable.
 */
export function requiredOperatingDocuments(
  kind: OperatingKind,
  legalEntityTypeConceptId: string | undefined,
): AffiliationDocumentRole[] {
  return kind === 'PHARMACY'
    ? requiredPharmacyDocuments(legalEntityTypeConceptId)
    : requiredLaboratoryDocuments();
}

@Injectable()
export class PharmacyOperatingRequirementsService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param legalRepo - Documentos de afiliación del tenant.
   * @param concepts - Catálogos de tipos y estados de documento.
   */
  constructor(
    private readonly legalRepo: DirectoryTenantLegalRepository,
    private readonly concepts: AffiliationDocumentConceptsService,
  ) {}

  /**
   * Evalúa la farmacia del tenant contra sus requisitos de operación.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenant - Tenant de tipo farmacia (id y tipo societario).
   * @returns Si puede operar, qué falta y qué documentos cumplen.
   */
  async evaluate(
    em: EntityManager,
    tenant: { readonly id: string; readonly legalEntityTypeConceptId?: string },
    kind: OperatingKind = 'PHARMACY',
  ): Promise<PharmacyOperatingReadiness> {
    const concepts = await this.concepts.resolve(em);
    const liveByType = await this.liveDocumentsByType(em, tenant.id);

    const missing: OperatingRequirement[] = [];
    const documentIds: string[] = [];
    for (const role of requiredOperatingDocuments(
      kind,
      tenant.legalEntityTypeConceptId,
    )) {
      const typeConceptId = concepts.documentType.get(
        DOCUMENT_TYPE_CODE_BY_ROLE[role].toUpperCase(),
      );
      const docId =
        typeConceptId === undefined ? undefined : liveByType.get(typeConceptId);
      if (docId === undefined) missing.push(role);
      else documentIds.push(docId);
    }
    if (kind === 'LABORATORY') {
      return { ready: missing.length === 0, missing, documentIds };
    }

    const pharmacy = await em.findOne(Pharmacies, { tenantId: tenant.id });
    if (!pharmacy) {
      missing.push('PHARMACY_RECORD');
    } else if (!(await this.headquartersHasPoint(em, pharmacy))) {
      missing.push('HEADQUARTERS_LOCATION');
    }

    return { ready: missing.length === 0, missing, documentIds };
  }

  /**
   * La clase de organización del tenant a efectos de sus requisitos para
   * operar, o `undefined` si no tiene ninguno.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenant - Tenant (id y tipo).
   * @returns `PHARMACY`, `LABORATORY` o `undefined`.
   */
  async kindOf(
    em: EntityManager,
    tenant: { readonly id: string; readonly tenantTypeConceptId?: string },
  ): Promise<OperatingKind | undefined> {
    if (tenant.tenantTypeConceptId === CONCEPTS.TENANT_TYPE_PHARMACY) {
      return 'PHARMACY';
    }
    if (tenant.tenantTypeConceptId !== CONCEPTS.TENANT_TYPE_DIAGNOSTIC_CENTER) {
      return undefined;
    }
    const laboratory = await em.findOne(DiagnosticUnits, {
      tenantId: tenant.id,
      diagnosticUnitTypeConceptId: DUNIT.UNIT_TYPE_LABORATORY,
    });
    return laboratory ? 'LABORATORY' : undefined;
  }

  /**
   * Evalúa al tenant según su clase, o `undefined` si su clase no tiene
   * requisitos para operar (un hospital, un centro de imágenes…).
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenant - Tenant (id, tipo y tipo societario).
   * @returns La clase y su evaluación, o `undefined`.
   */
  async evaluateForTenant(
    em: EntityManager,
    tenant: {
      readonly id: string;
      readonly tenantTypeConceptId?: string;
      readonly legalEntityTypeConceptId?: string;
    },
  ): Promise<
    { kind: OperatingKind; readiness: PharmacyOperatingReadiness } | undefined
  > {
    const kind = await this.kindOf(em, tenant);
    if (kind === undefined) return undefined;
    return { kind, readiness: await this.evaluate(em, tenant, kind) };
  }

  /**
   * Los documentos vivos del tenant, uno por tipo: activos y no rechazados ni
   * vencidos. Es lo que cuenta como «presentado», tanto para operar como para
   * impedir que se suba dos veces el mismo papel.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Tenant dueño de los documentos.
   * @returns Mapa `document_type_concept_id → id del documento`.
   */
  async liveDocumentsByType(
    em: EntityManager,
    tenantId: string,
  ): Promise<Map<string, string>> {
    const concepts = await this.concepts.resolve(em);
    const deadStatuses = new Set(
      DEAD_VERIFICATION_CODES.map((code) =>
        concepts.verificationStatus.get(code),
      ).filter((id): id is string => id !== undefined),
    );
    const liveByType = new Map<string, string>();
    for (const doc of await this.legalRepo.listAffiliationDocsByTenant(
      em,
      tenantId,
    )) {
      if (doc.statusConceptId !== CONCEPTS.STATE_ACTIVE) continue;
      if (deadStatuses.has(doc.verificationStatusConceptId)) continue;
      if (!liveByType.has(doc.documentTypeConceptId)) {
        liveByType.set(doc.documentTypeConceptId, doc.id);
      }
    }
    return liveByType;
  }

  /**
   * Marca como verificados los documentos que cumplieron los requisitos.
   *
   * La llama la verificación de la plataforma, en su misma transacción: es el
   * acto en el que alguien de la plataforma contrastó los papeles.
   *
   * @param em - Transacción activa de la verificación.
   * @param documentIds - Los documentos que devolvió {@link evaluate}.
   * @param actorUserId - Quién verificó.
   */
  async markDocumentsVerified(
    em: EntityManager,
    documentIds: readonly string[],
    actorUserId: string,
  ): Promise<void> {
    if (documentIds.length === 0) return;
    const concepts = await this.concepts.resolve(em);
    const verifiedConceptId = this.concepts.conceptIdOf(
      concepts.verificationStatus,
      AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus,
      DOCUMENT_VERIFIED_CODE,
    );
    const now = new Date();
    for (const doc of await em.find(TenantAffiliationDocuments, {
      id: { $in: [...documentIds] },
    })) {
      doc.verificationStatusConceptId = verifiedConceptId;
      doc.verifiedByUserId = actorUserId;
      doc.verifiedAt = now;
      touch(doc, actorUserId);
    }
  }

  /** La casa central enlazada tiene dirección con latitud y longitud. */
  private async headquartersHasPoint(
    em: EntityManager,
    pharmacy: Pharmacies,
  ): Promise<boolean> {
    if (!pharmacy.primaryPracticeSiteId) return false;
    const site = await em.findOne(PracticeSites, {
      id: pharmacy.primaryPracticeSiteId,
    });
    if (!site?.addressId) return false;
    const address = await em.findOne(Addresses, { id: site.addressId });
    // `!= null` cubre las dos ausencias: la columna llega `null` desde la base.
    return (
      address !== null && address.latitude != null && address.longitude != null
    );
  }
}
