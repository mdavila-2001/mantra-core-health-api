import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { PreconditionFailedException } from '../../../common';
import {
  CatalogConceptsRepository,
  ValueSetsRepository,
} from '../../terminology/repositories';
import {
  AFFILIATION_DOCUMENT_VALUE_SETS,
  DOCUMENT_TYPE_CODE_BY_ROLE,
  BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE,
  DOCUMENT_VERIFICATION_PENDING,
  ISSUING_AUTHORITY_OTHER,
  REGISTRATION_DOCUMENT_ROLES,
} from '../affiliation-documents';

/** Los tres mapas `code -> concept_id` que gobiernan `tenant_affiliation_documents`. */
export interface AffiliationDocumentConcepts {
  readonly documentType: ReadonlyMap<string, string>;
  readonly issuingAuthority: ReadonlyMap<string, string>;
  readonly verificationStatus: ReadonlyMap<string, string>;
}

/**
 * Resuelve los tres value sets de `tenant_affiliation_documents`
 * (`vs_affiliation_document_type`, `vs_issuing_authority`,
 * `vs_affiliation_document_verification_status`) a sus concept ids vigentes.
 *
 * Mismo patrón que `MedicalSpecialtyCatalogService`: la base acepta cualquier
 * uuid del catálogo en esas tres columnas —son FK planas a
 * `terminology.catalog_concepts`—, así que la regla de «tiene que pertenecer
 * a este value set» es de dominio, no de esquema.
 *
 * A diferencia de aquél, éste SÍ cachea la resolución exitosa: los tres
 * conjuntos son propiedad de la bóveda (`gen_seeds.py`) y sólo cambian por
 * despliegue, nunca por una operación de negocio, y el autorregistro de
 * organización los necesita hasta cinco veces por request (una por
 * documento). Un fallo no se cachea a propósito: una base recién sembrada no
 * debe quedar «envenenada» por el primer intento que la encontró incompleta.
 */
@Injectable()
export class AffiliationDocumentConceptsService {
  private cache: Promise<AffiliationDocumentConcepts> | null = null;

  constructor(
    private readonly valueSets: ValueSetsRepository,
    private readonly catalogConcepts: CatalogConceptsRepository,
  ) {}

  /** Resuelve (o reutiliza) los tres mapas. */
  async resolve(em: EntityManager): Promise<AffiliationDocumentConcepts> {
    if (!this.cache) {
      this.cache = this.load(em).catch((error: unknown) => {
        this.cache = null;
        throw error;
      });
    }
    return this.cache;
  }

  /**
   * Busca el concepto de un código dentro de un mapa ya resuelto.
   *
   * Existe como último paso porque los códigos con los que trabaja el
   * llamador vienen en minúscula/mixtos desde `affiliation-documents.ts`,
   * mientras que el catálogo persiste todo en MAYÚSCULAS
   * (`concept_id()` de `gen_seeds.py` hace `code.upper()`).
   *
   * @throws PreconditionFailedException si el código no está en el mapa: es
   *   exactamente lo que pasa contra una base sin el `--refresh` que sembró
   *   el código (p. ej. el certificado del SEDES antes de cargar los seeds).
   */
  conceptIdOf(
    map: ReadonlyMap<string, string>,
    valueSet: string,
    code: string,
  ): string {
    const conceptId = map.get(code.toUpperCase());
    if (!conceptId) {
      throw new PreconditionFailedException(
        `El catálogo de documentos de afiliación no incluye el código ${code.toUpperCase()}`,
        { valueSet, code: code.toUpperCase() },
      );
    }
    return conceptId;
  }

  private async load(em: EntityManager): Promise<AffiliationDocumentConcepts> {
    const documentType = await this.resolveValueSet(
      em,
      AFFILIATION_DOCUMENT_VALUE_SETS.documentType,
      [
        ...new Set(
          REGISTRATION_DOCUMENT_ROLES.map(
            (role) => DOCUMENT_TYPE_CODE_BY_ROLE[role],
          ),
        ),
      ],
    );
    const issuingAuthority = await this.resolveValueSet(
      em,
      AFFILIATION_DOCUMENT_VALUE_SETS.issuingAuthority,
      [
        ...new Set(
          REGISTRATION_DOCUMENT_ROLES.map(
            (role) => BOLIVIAN_ISSUING_AUTHORITY_BY_ROLE[role],
          ),
        ),
        ISSUING_AUTHORITY_OTHER,
      ],
    );
    const verificationStatus = await this.resolveValueSet(
      em,
      AFFILIATION_DOCUMENT_VALUE_SETS.verificationStatus,
      [DOCUMENT_VERIFICATION_PENDING],
    );
    return { documentType, issuingAuthority, verificationStatus };
  }

  /**
   * Resuelve un value set completo a `Map<código, concept_id>` y comprueba
   * que los códigos que el autorregistro necesita estén todos presentes.
   */
  private async resolveValueSet(
    em: EntityManager,
    valueSet: string,
    requiredCodes: readonly string[],
  ): Promise<ReadonlyMap<string, string>> {
    const set = await this.valueSets.findByInternalCode(em, valueSet);
    if (!set) {
      throw new PreconditionFailedException(
        'El catálogo de documentos de afiliación no está disponible',
        { valueSet },
      );
    }
    const conceptIds = await this.valueSets.findIncludedConceptIdsByValueSet(
      em,
      set.id,
    );
    if (!conceptIds) {
      throw new PreconditionFailedException(
        'El catálogo de documentos de afiliación no está disponible',
        { valueSet },
      );
    }
    const concepts = await this.catalogConcepts.findByIds(em, conceptIds);
    const byCode = new Map<string, string>();
    for (const concept of concepts.values()) {
      byCode.set(concept.code, concept.id);
    }
    for (const code of requiredCodes) {
      if (!byCode.has(code)) {
        throw new PreconditionFailedException(
          `El catálogo de documentos de afiliación no incluye el código ${code}`,
          { valueSet, code },
        );
      }
    }
    return byCode;
  }
}
