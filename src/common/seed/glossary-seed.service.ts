import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  ConceptDesignations,
  ConceptProperties,
  ConceptRelationships,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS, SEED } from '../constants/concepts';
import {
  GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SLUG_PROPERTY_CODE,
  glossaryRelationTypeConceptId,
  type GlossaryBilingualText,
} from '../../modules/terminology/glossary.constants';
import {
  GLOSSARY_ALL_TERMS,
  GLOSSARY_TAXONOMY,
  glossaryCategoryByKey,
  glossaryPreferredDesignationId,
  glossaryPropertyId,
  glossaryRelationshipId,
  glossarySynonymDesignationId,
  glossaryTagByKey,
  glossaryTermConceptId,
  glossaryValueSetCanonicalUrl,
  glossaryValueSetId,
  glossaryValueSetMemberId,
  glossaryValueSetVersionId,
} from './glossary-taxonomy';
import {
  GLOSSARY_TERMS,
  type GlossaryTermSeed,
} from './glossary-terms.catalog';

/** Única versión que recibe cada value set de la taxonomía del glosario. */
const GLOSSARY_VALUE_SET_VERSION = '1.0.0';

/** Tipo de dato de las propiedades jsonb sembradas por este servicio. */
const JSON_DATA_TYPE = 'json';
const STRING_DATA_TYPE = 'string';

/** El código FHIR de un concepto de término, derivado de su slug. */
function glossaryConceptCode(slug: string): string {
  return `GLOSSARY_${slug.toUpperCase().replace(/-/g, '_')}`;
}

/**
 * Materializa el glosario médico curado (Carril 03): la taxonomía (27 value
 * sets — 11 categorías, 15 etiquetas, 1 paraguas) y los 64 términos de
 * `GLOSSARY_TERMS`, con sus designaciones, propiedades, membresías y
 * relaciones tipadas.
 *
 * No crea tablas ni columnas nuevas: reutiliza íntegramente el motor de
 * terminología ya existente. Ver `glossary-taxonomy.ts` para por qué esto no
 * pasa por `DynamicEnumSeedService` (que resuelve un problema distinto: un
 * value set que gobierna una columna FK, no uno que agrupa términos).
 *
 * Idempotente por el mismo mecanismo que el resto del seed: todo id es
 * determinista (UUIDv5 sobre una clave estable), así que una corrida repetida
 * compara por id e inserta sólo lo que falta. Corre **después** de
 * `TerminologySeedService` (necesita `SEED.codeSystemVersionId` ya
 * materializado) — el orquestador (`SeedBootstrapService`) impone ese orden.
 */
@Injectable()
export class GlossarySeedService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param orm - Acceso al contexto de persistencia.
   * @param logger - Logger estructurado del arranque.
   */
  constructor(
    private readonly orm: MikroORM,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(GlossarySeedService.name);
  }

  /**
   * Ejecuta el seed. Público para que las pruebas de integración puedan
   * garantizar el catálogo tras materializar el esquema.
   */
  async run(): Promise<{
    /** Value sets de la taxonomía creados (categoría + etiqueta + paraguas). */
    valueSets: number;
    /** Conceptos de término creados. */
    terms: number;
    /** Designaciones (preferida ES + sinónimos) creadas. */
    designations: number;
    /** Propiedades (slug, definición clínica, resumen llano) creadas. */
    properties: number;
    /** Membresías de value set (categoría + etiquetas + paraguas) creadas. */
    memberships: number;
    /** Relaciones tipadas creadas. */
    relationships: number;
    /** Relaciones declaradas cuyo slug destino no resuelve; se omiten con advertencia. */
    orphanRelationships: number;
  }> {
    this.assertUniqueSlugs();

    const em = this.orm.em.fork();
    const now = new Date();
    const counters = {
      valueSets: 0,
      terms: 0,
      designations: 0,
      properties: 0,
      memberships: 0,
      relationships: 0,
      orphanRelationships: 0,
    };

    // --- Nivel 1: value sets de la taxonomía (paraguas + categorías + etiquetas) ---
    const existingValueSets = await this.existingIds(
      em,
      ValueSets,
      GLOSSARY_TAXONOMY.map((entry) => glossaryValueSetId(entry.internalCode)),
    );
    for (const entry of GLOSSARY_TAXONOMY) {
      const id = glossaryValueSetId(entry.internalCode);
      if (existingValueSets.has(id)) continue;
      em.create(
        ValueSets,
        {
          id,
          internalCode: entry.internalCode,
          name: entry.name,
          canonicalUrl: glossaryValueSetCanonicalUrl(entry.internalCode),
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.valueSets += 1;
    }
    await em.flush();

    // --- Nivel 2: versión única de cada value set ---
    const existingVersions = await this.existingIds(
      em,
      ValueSetVersions,
      GLOSSARY_TAXONOMY.map((entry) =>
        glossaryValueSetVersionId(entry.internalCode),
      ),
    );
    for (const entry of GLOSSARY_TAXONOMY) {
      const id = glossaryValueSetVersionId(entry.internalCode);
      if (existingVersions.has(id)) continue;
      em.create(
        ValueSetVersions,
        {
          id,
          valueSetId: glossaryValueSetId(entry.internalCode),
          version: GLOSSARY_VALUE_SET_VERSION,
          validFrom: now,
          isDefault: true,
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
    }
    await em.flush();

    // --- Nivel 3: conceptos de término ---
    const existingConcepts = await this.existingIds(
      em,
      CatalogConcepts,
      GLOSSARY_TERMS.map((term) => glossaryTermConceptId(term.slug)),
    );
    for (const term of GLOSSARY_TERMS) {
      const id = glossaryTermConceptId(term.slug);
      if (existingConcepts.has(id)) continue;
      em.create(
        CatalogConcepts,
        {
          id,
          codeSystemVersionId: SEED.codeSystemVersionId,
          code: glossaryConceptCode(term.slug),
          display: term.enDisplay,
          abstract: false,
          selectable: true,
          // Todo el catálogo curado se siembra revisado y publicado: es
          // contenido de autor, no un borrador que alguien deba activar.
          stateConceptId: CONCEPTS.TERM_ACTIVE,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      counters.terms += 1;
    }
    await em.flush();

    // --- Nivel 4: designaciones (preferida ES + sinónimos) ---
    counters.designations += await this.seedDesignations(em, now);

    // --- Nivel 5: propiedades (slug, definición clínica, resumen llano) ---
    counters.properties += await this.seedProperties(em, now);

    // --- Nivel 6: membresías (categoría + etiquetas + paraguas) ---
    counters.memberships += await this.seedMemberships(em, now);

    // --- Nivel 7: relaciones tipadas ---
    const relResult = await this.seedRelationships(em, now);
    counters.relationships += relResult.created;
    counters.orphanRelationships += relResult.orphans;

    if (
      counters.valueSets +
        counters.terms +
        counters.designations +
        counters.properties +
        counters.memberships +
        counters.relationships >
      0
    ) {
      this.logger.info(
        { operation: 'seed.glossary', ...counters },
        'Glosario médico materializado',
      );
    }
    return counters;
  }

  /**
   * Falla ruidosamente si el catálogo curado declara un slug repetido. Un
   * slug duplicado colapsaría en el mismo id determinista y encubriría dos
   * términos distintos bajo una sola fila: mejor romper el arranque que
   * sembrar contenido ambiguo.
   */
  private assertUniqueSlugs(): void {
    const seen = new Set<string>();
    for (const term of GLOSSARY_TERMS) {
      if (seen.has(term.slug)) {
        throw new Error(
          `El catálogo del glosario declara el slug "${term.slug}" más de una vez`,
        );
      }
      seen.add(term.slug);
    }
  }

  /** Designación preferida (ES) y sinónimos (ES) de cada término. */
  private async seedDesignations(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const ids: string[] = [];
    for (const term of GLOSSARY_TERMS) {
      ids.push(glossaryPreferredDesignationId(term.slug));
      (term.esSynonyms ?? []).forEach((_, index) => {
        ids.push(glossarySynonymDesignationId(term.slug, index));
      });
    }
    const existing = await this.existingIds(em, ConceptDesignations, ids);

    let created = 0;
    for (const term of GLOSSARY_TERMS) {
      const conceptId = glossaryTermConceptId(term.slug);

      const preferredId = glossaryPreferredDesignationId(term.slug);
      if (!existing.has(preferredId)) {
        em.create(
          ConceptDesignations,
          {
            id: preferredId,
            conceptId,
            value: term.esName,
            languageConceptId: CONCEPTS.LANG_ES,
            designationTypeConceptId: CONCEPTS.DESIG_PREFERRED,
            preferred: true,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        created += 1;
      }

      (term.esSynonyms ?? []).forEach((synonym, index) => {
        const synonymId = glossarySynonymDesignationId(term.slug, index);
        if (existing.has(synonymId)) return;
        em.create(
          ConceptDesignations,
          {
            id: synonymId,
            conceptId,
            value: synonym,
            languageConceptId: CONCEPTS.LANG_ES,
            designationTypeConceptId: CONCEPTS.DESIG_SYNONYM,
            preferred: false,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        created += 1;
      });
    }
    await em.flush();
    return created;
  }

  /** Propiedades `glossary-slug` / `glossary-clinical-definition` / `glossary-plain-summary`. */
  private async seedProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const propertyCodes = [
      GLOSSARY_SLUG_PROPERTY_CODE,
      GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
      GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
    ];
    const ids = GLOSSARY_TERMS.flatMap((term) =>
      propertyCodes.map((code) => glossaryPropertyId(term.slug, code)),
    );
    const existing = await this.existingIds(em, ConceptProperties, ids);

    let created = 0;
    for (const term of GLOSSARY_TERMS) {
      const conceptId = glossaryTermConceptId(term.slug);

      const slugPropertyId = glossaryPropertyId(
        term.slug,
        GLOSSARY_SLUG_PROPERTY_CODE,
      );
      if (!existing.has(slugPropertyId)) {
        em.create(
          ConceptProperties,
          {
            id: slugPropertyId,
            conceptId,
            propertyCode: GLOSSARY_SLUG_PROPERTY_CODE,
            dataType: STRING_DATA_TYPE,
            valueJson: term.slug,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        created += 1;
      }

      const clinicalDefinitionId = glossaryPropertyId(
        term.slug,
        GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
      );
      if (!existing.has(clinicalDefinitionId)) {
        const value: GlossaryBilingualText = term.clinicalDefinitionEn
          ? { es: term.clinicalDefinitionEs, en: term.clinicalDefinitionEn }
          : { es: term.clinicalDefinitionEs };
        em.create(
          ConceptProperties,
          {
            id: clinicalDefinitionId,
            conceptId,
            propertyCode: GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
            dataType: JSON_DATA_TYPE,
            valueJson: value,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        created += 1;
      }

      const plainSummaryId = glossaryPropertyId(
        term.slug,
        GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
      );
      if (!existing.has(plainSummaryId)) {
        const value: GlossaryBilingualText = term.plainSummaryEn
          ? { es: term.plainSummaryEs, en: term.plainSummaryEn }
          : { es: term.plainSummaryEs };
        em.create(
          ConceptProperties,
          {
            id: plainSummaryId,
            conceptId,
            propertyCode: GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
            dataType: JSON_DATA_TYPE,
            valueJson: value,
            createdAt: now,
            updatedAt: now,
          },
          { partial: true },
        );
        created += 1;
      }
    }
    await em.flush();
    return created;
  }

  /**
   * Membresía de cada término en su categoría (exactamente una), sus
   * etiquetas (0..N) y el value set paraguas (todas).
   */
  private async seedMemberships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const memberships = this.resolveMemberships();
    const ids = memberships.map((membership) =>
      glossaryValueSetMemberId(membership.internalCode, membership.conceptId),
    );
    const existing = await this.existingIds(em, ValueSetMembers, ids);

    let created = 0;
    const ordinals = new Map<string, number>();
    for (const membership of memberships) {
      const id = glossaryValueSetMemberId(
        membership.internalCode,
        membership.conceptId,
      );
      if (existing.has(id)) continue;
      const ordinal = ordinals.get(membership.internalCode) ?? 0;
      ordinals.set(membership.internalCode, ordinal + 1);
      em.create(
        ValueSetMembers,
        {
          id,
          valueSetVersionId: glossaryValueSetVersionId(membership.internalCode),
          conceptId: membership.conceptId,
          included: true,
          ordinal,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return created;
  }

  /** Las membresías `(value set, concepto)` que declara el catálogo de términos. */
  private resolveMemberships(): {
    internalCode: string;
    conceptId: string;
  }[] {
    const memberships: { internalCode: string; conceptId: string }[] = [];
    for (const term of GLOSSARY_TERMS) {
      const conceptId = glossaryTermConceptId(term.slug);
      const category = glossaryCategoryByKey(term.categoryKey);
      memberships.push({ internalCode: category.internalCode, conceptId });
      for (const tagKey of term.tagKeys) {
        const tag = glossaryTagByKey(tagKey);
        memberships.push({ internalCode: tag.internalCode, conceptId });
      }
      memberships.push({
        internalCode: GLOSSARY_ALL_TERMS.internalCode,
        conceptId,
      });
    }
    return memberships;
  }

  /**
   * Las relaciones tipadas salientes de cada término.
   *
   * Cada relación se valida contra el conjunto de slugs conocido: un destino
   * que no resuelve se omite y se cuenta como huérfano (ver
   * `glossary-terms.catalog.ts`, nota de cabecera) en vez de violar la FK y
   * abortar el seed completo, o de inventar el término que falta.
   */
  private async seedRelationships(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<{ created: number; orphans: number }> {
    const slugToConceptId = new Map(
      GLOSSARY_TERMS.map((term) => [
        term.slug,
        glossaryTermConceptId(term.slug),
      ]),
    );

    const resolved: {
      id: string;
      sourceConceptId: string;
      targetConceptId: string;
      relationshipTypeConceptId: string;
    }[] = [];
    let orphans = 0;

    for (const term of GLOSSARY_TERMS) {
      const sourceConceptId = glossaryTermConceptId(term.slug);
      for (const relation of term.relations) {
        const targetConceptId = slugToConceptId.get(relation.targetSlug);
        if (targetConceptId === undefined) {
          orphans += 1;
          this.logger.warn(
            {
              operation: 'seed.glossary.relationship',
              sourceSlug: term.slug,
              type: relation.type,
              targetSlug: relation.targetSlug,
            },
            'Relación de glosario omitida: el slug destino no existe en el catálogo',
          );
          continue;
        }
        resolved.push({
          id: glossaryRelationshipId(
            term.slug,
            relation.type,
            relation.targetSlug,
          ),
          sourceConceptId,
          targetConceptId,
          relationshipTypeConceptId: glossaryRelationTypeConceptId(
            relation.type,
          ),
        });
      }
    }

    const existing = await this.existingIds(
      em,
      ConceptRelationships,
      resolved.map((row) => row.id),
    );

    let created = 0;
    for (const row of resolved) {
      if (existing.has(row.id)) continue;
      em.create(
        ConceptRelationships,
        {
          id: row.id,
          sourceConceptId: row.sourceConceptId,
          targetConceptId: row.targetConceptId,
          relationshipTypeConceptId: row.relationshipTypeConceptId,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
    await em.flush();
    return { created, orphans };
  }

  /**
   * Identificadores ya presentes, en una sola consulta por nivel. Evita el
   * N+1 de comprobar fila a fila — el mismo patrón que el resto del seed.
   */
  private async existingIds<T extends object>(
    em: ReturnType<MikroORM['em']['fork']>,
    entity: new () => T,
    ids: string[],
  ): Promise<Set<string>> {
    if (ids.length === 0) return new Set();
    const rows = await em.find(
      entity,
      { id: { $in: ids } },
      { fields: ['id'] as never },
    );
    return new Set(rows.map((row) => (row as { id: string }).id));
  }
}

// Re-exportado para que las pruebas puedan referenciar el tipo sin importar
// desde el catálogo directamente.
export type { GlossaryTermSeed };
