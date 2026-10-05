import { Injectable } from '@nestjs/common';
import { MikroORM } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  CatalogConcepts,
  CodeSystems,
  CodeSystemVersions,
  ConceptDesignations,
  ConceptProperties,
  ConceptRelationships,
  TerminologySources,
  ValueSetMembers,
  ValueSets,
  ValueSetVersions,
} from '../../modules/terminology/entities';
import { CONCEPTS } from '../constants/concepts';
import {
  GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
  GLOSSARY_DRUG_ACTIVE_INGREDIENTS_PROPERTY_CODE,
  GLOSSARY_DRUG_DOSAGE_FORM_PROPERTY_CODE,
  GLOSSARY_DRUG_MANUFACTURER_PROPERTY_CODE,
  GLOSSARY_DRUG_ROUTE_PROPERTY_CODE,
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
  GLOSSARY_SLUG_PROPERTY_CODE,
  glossaryRelationTypeConceptId,
  glossaryRelationTypeFromConceptId,
  type GlossaryBilingualText,
} from '../../modules/terminology/glossary.constants';
import {
  GLOSSARY_ALL_TERMS,
  GLOSSARY_CODE_SYSTEM_CANONICAL_URL,
  GLOSSARY_CODE_SYSTEM_INTERNAL_CODE,
  GLOSSARY_CODE_SYSTEM_VERSION,
  GLOSSARY_SOURCE_CODE,
  GLOSSARY_TAXONOMY,
  glossaryCategoryByKey,
  glossaryCodeSystemId,
  glossaryCodeSystemVersionId,
  glossaryPreferredDesignationId,
  glossaryPropertyId,
  glossaryRelationshipId,
  glossarySourceId,
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
import { GLOSSARY_SOURCE_REFERENCES } from './glossary-source-provenance';

/** Única versión que recibe cada value set de la taxonomía del glosario. */
const GLOSSARY_VALUE_SET_VERSION = '1.0.0';

/** Tipo de dato de las propiedades jsonb sembradas por este servicio. */
const JSON_DATA_TYPE = 'json';
const STRING_DATA_TYPE = 'string';

/**
 * Cuántos índices de sinónimo se reconocen como propios al reconciliar. Un
 * sinónimo sembrado tiene id `glossary:designation:synonym:<slug>:<i>`; el que
 * pasó ese tope no lo escribió nunca este servicio. Ningún término curado
 * declara más de tres.
 */
const MAX_OWNED_SYNONYM_INDEX = 32;

/** Los códigos de propiedad que este servicio escribe. */
const OWNED_PROPERTY_CODES = [
  GLOSSARY_SLUG_PROPERTY_CODE,
  GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
  GLOSSARY_DRUG_ACTIVE_INGREDIENTS_PROPERTY_CODE,
  GLOSSARY_DRUG_DOSAGE_FORM_PROPERTY_CODE,
  GLOSSARY_DRUG_ROUTE_PROPERTY_CODE,
  GLOSSARY_DRUG_MANUFACTURER_PROPERTY_CODE,
] as const;

/** Igualdad estructural de dos valores jsonb (el orden de las claves no cuenta). */
function sameJson(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (
    typeof a !== 'object' ||
    typeof b !== 'object' ||
    a === null ||
    b === null
  ) {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  return keysA.every((key) =>
    sameJson(
      (a as Record<string, unknown>)[key],
      (b as Record<string, unknown>)[key],
    ),
  );
}

/** El código FHIR de un concepto de término, derivado de su slug. */
function glossaryConceptCode(slug: string): string {
  return `GLOSSARY_${slug.toUpperCase().replace(/-/g, '_')}`;
}

/**
 * Materializa el glosario médico curado (Carril 03): la taxonomía (34 value
 * sets — 12 categorías, 21 etiquetas, 1 paraguas) y los 80 términos de
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
 * compara por id e inserta sólo lo que falta. Después **reconcilia** (ver
 * `reconcile`): una corrección del catálogo —texto, sinónimos, categoría,
 * etiquetas, relaciones— también llega a una base ya sembrada. Corre **después** de
 * `TerminologySeedService` (necesita `CONCEPTS.TERM_ACTIVE` y el resto de los
 * conceptos de estado ya materializados) — el orquestador
 * (`SeedBootstrapService`) impone ese orden. Desde FND-25-03 este servicio ya
 * no cuelga sus conceptos de término del `SEED.codeSystemVersionId` genérico
 * (`mantra-core`): sigue dependiendo de sus conceptos de estado, pero siembra
 * su propio `terminology_sources`/`code_systems` (Nivel 0, ver
 * `seedOwnCodeSystem`).
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
    /** Propiedades de contenido, procedencia y ficha de medicamento creadas. */
    properties: number;
    /** Membresías de value set (categoría + etiquetas + paraguas) creadas. */
    memberships: number;
    /** Relaciones tipadas creadas. */
    relationships: number;
    /** Relaciones declaradas cuyo slug destino no resuelve; se omiten con advertencia. */
    orphanRelationships: number;
    /** Conceptos de término migrados de `mantra-core` al code system propio del glosario (FND-25-03). */
    codeSystemBackfilled: number;
    /** Filas ya sembradas cuyo contenido se actualizó para coincidir con el catálogo. */
    updated: number;
    /** Filas sembradas que el catálogo ya no declara y se quitaron. */
    removed: number;
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
      codeSystemBackfilled: 0,
      updated: 0,
      removed: 0,
    };

    // --- Nivel 0: procedencia propia del catálogo curado (FND-25-03) ---
    await this.seedOwnCodeSystem(em, now);

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
          codeSystemVersionId: glossaryCodeSystemVersionId,
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

    // Corridas anteriores a FND-25-03 sembraron estos mismos conceptos bajo
    // `mantra-core` (el code system genérico de estados/enums operativos, ver
    // `glossary-taxonomy.ts`). Se corrige acá, no en una migración aparte: es
    // la única escritora de estas filas, y el criterio es idempotente (un
    // concepto que ya cuelga del code system propio no se vuelve a tocar).
    counters.codeSystemBackfilled = await this.backfillTermCodeSystem(
      em,
      existingConcepts,
      now,
    );

    // --- Nivel 4: designaciones (preferida ES + sinónimos) ---
    counters.designations += await this.seedDesignations(em, now);

    // --- Nivel 5: propiedades (contenido, procedencia y ficha de medicamento) ---
    counters.properties += await this.seedProperties(em, now);

    // --- Nivel 6: membresías (categoría + etiquetas + paraguas) ---
    counters.memberships += await this.seedMemberships(em, now);

    // --- Nivel 7: relaciones tipadas ---
    const relResult = await this.seedRelationships(em, now);
    counters.relationships += relResult.created;
    counters.orphanRelationships += relResult.orphans;

    // --- Nivel 8: reconciliación de una base ya sembrada ---
    const reconciled = await this.reconcile(em, relResult.declaredIds, now);
    counters.updated += reconciled.updated;
    counters.removed += reconciled.removed;

    if (
      counters.valueSets +
        counters.terms +
        counters.designations +
        counters.properties +
        counters.memberships +
        counters.relationships +
        counters.codeSystemBackfilled +
        counters.updated +
        counters.removed >
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

  /** Propiedades de contenido, procedencia editorial y ficha de medicamento. */
  private async seedProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<number> {
    const propertyCodes = [
      GLOSSARY_SLUG_PROPERTY_CODE,
      GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE,
      GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
    ];
    const drugFactPropertyCodes = [
      GLOSSARY_DRUG_ACTIVE_INGREDIENTS_PROPERTY_CODE,
      GLOSSARY_DRUG_DOSAGE_FORM_PROPERTY_CODE,
      GLOSSARY_DRUG_ROUTE_PROPERTY_CODE,
      GLOSSARY_DRUG_MANUFACTURER_PROPERTY_CODE,
    ];
    const ids = GLOSSARY_TERMS.flatMap((term) => [
      ...propertyCodes.map((code) => glossaryPropertyId(term.slug, code)),
      ...(GLOSSARY_SOURCE_REFERENCES[term.slug] !== undefined
        ? [
            glossaryPropertyId(
              term.slug,
              GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
            ),
          ]
        : []),
      ...(term.drugFacts !== undefined
        ? drugFactPropertyCodes.map((code) =>
            glossaryPropertyId(term.slug, code),
          )
        : []),
    ]);
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

      const sourceReferences = GLOSSARY_SOURCE_REFERENCES[term.slug];
      if (sourceReferences !== undefined) {
        const sourceReferencesId = glossaryPropertyId(
          term.slug,
          GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
        );
        if (!existing.has(sourceReferencesId)) {
          em.create(
            ConceptProperties,
            {
              id: sourceReferencesId,
              conceptId,
              propertyCode: GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
              dataType: JSON_DATA_TYPE,
              valueJson: sourceReferences,
              createdAt: now,
              updatedAt: now,
            },
            { partial: true },
          );
          created += 1;
        }
      }

      // Ficha de medicamento (FND-25-02): mismos 4 códigos que escribe el
      // importador NDC, sólo en los términos que declaran `drugFacts`.
      if (term.drugFacts !== undefined) {
        created += this.seedDrugFactProperties(
          em,
          conceptId,
          term.slug,
          term.drugFacts,
          existing,
          now,
        );
      }
    }
    await em.flush();
    return created;
  }

  /** Las 4 propiedades de la ficha de medicamento de un término (FND-25-02). */
  private seedDrugFactProperties(
    em: ReturnType<MikroORM['em']['fork']>,
    conceptId: string,
    slug: string,
    drugFacts: NonNullable<GlossaryTermSeed['drugFacts']>,
    existing: Set<string>,
    now: Date,
  ): number {
    const rows: readonly {
      readonly code: string;
      readonly dataType: string;
      readonly valueJson: unknown;
    }[] = [
      {
        code: GLOSSARY_DRUG_ACTIVE_INGREDIENTS_PROPERTY_CODE,
        dataType: JSON_DATA_TYPE,
        valueJson: drugFacts.activeIngredients,
      },
      {
        code: GLOSSARY_DRUG_DOSAGE_FORM_PROPERTY_CODE,
        dataType: STRING_DATA_TYPE,
        valueJson: drugFacts.dosageForm,
      },
      {
        code: GLOSSARY_DRUG_ROUTE_PROPERTY_CODE,
        dataType: JSON_DATA_TYPE,
        valueJson: drugFacts.route,
      },
      {
        code: GLOSSARY_DRUG_MANUFACTURER_PROPERTY_CODE,
        dataType: STRING_DATA_TYPE,
        valueJson: drugFacts.manufacturer,
      },
    ];

    let created = 0;
    for (const row of rows) {
      const id = glossaryPropertyId(slug, row.code);
      if (existing.has(id)) continue;
      em.create(
        ConceptProperties,
        {
          id,
          conceptId,
          propertyCode: row.code,
          dataType: row.dataType,
          valueJson: row.valueJson,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
      created += 1;
    }
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
  ): Promise<{ created: number; orphans: number; declaredIds: Set<string> }> {
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
    return {
      created,
      orphans,
      declaredIds: new Set(resolved.map((row) => row.id)),
    };
  }

  /**
   * Lleva una base ya sembrada al estado que declara el catálogo.
   *
   * Los niveles anteriores sólo insertan lo que falta: una corrección del
   * catálogo —un sinónimo quitado, una categoría cambiada, un resumen
   * reescrito— no llegaba nunca a una base existente. Esto compara lo que hay
   * contra lo declarado y actualiza o quita la diferencia.
   *
   * Sólo toca filas que este servicio escribió, y lo prueba por el id: todo id
   * sembrado es determinista (`glossary-taxonomy.ts`), así que una fila es
   * propia sólo si su id es exactamente el que la fórmula daría para ese
   * término. Una designación, propiedad, membresía o relación que otro agregó
   * sobre un término curado tiene otro id y no se toca. Idempotente: con la
   * base ya reconciliada no encuentra diferencias y no escribe nada.
   *
   * Las actualizaciones pasan por la unidad de trabajo (no `nativeUpdate`)
   * para que `row_version` avance como en cualquier otra escritura.
   */
  private async reconcile(
    em: ReturnType<MikroORM['em']['fork']>,
    declaredRelationshipIds: Set<string>,
    now: Date,
  ): Promise<{ updated: number; removed: number }> {
    const slugByConceptId = new Map(
      GLOSSARY_TERMS.map((term) => [glossaryTermConceptId(term.slug), term]),
    );
    const conceptIds = [...slugByConceptId.keys()];
    let updated = 0;
    let removed = 0;
    const touch = <T extends { updatedAt: Date }>(row: T): void => {
      row.updatedAt = now;
      updated += 1;
    };

    // Nombre en inglés del concepto (`display`).
    const concepts = await em.find(CatalogConcepts, {
      id: { $in: conceptIds },
    });
    for (const concept of concepts) {
      const term = slugByConceptId.get(concept.id);
      if (term !== undefined && concept.display !== term.enDisplay) {
        concept.display = term.enDisplay;
        touch(concept);
      }
    }

    // Designaciones: la preferida y los sinónimos, por índice.
    const desiredDesignations = new Map<string, string>();
    const ownedDesignations = new Set<string>();
    for (const term of GLOSSARY_TERMS) {
      const preferredId = glossaryPreferredDesignationId(term.slug);
      desiredDesignations.set(preferredId, term.esName);
      ownedDesignations.add(preferredId);
      (term.esSynonyms ?? []).forEach((synonym, index) =>
        desiredDesignations.set(
          glossarySynonymDesignationId(term.slug, index),
          synonym,
        ),
      );
      for (let index = 0; index < MAX_OWNED_SYNONYM_INDEX; index += 1) {
        ownedDesignations.add(glossarySynonymDesignationId(term.slug, index));
      }
    }
    const designations = await em.find(ConceptDesignations, {
      conceptId: { $in: conceptIds },
    });
    for (const designation of designations) {
      if (!ownedDesignations.has(designation.id)) continue;
      const value = desiredDesignations.get(designation.id);
      if (value === undefined) {
        em.remove(designation);
        removed += 1;
      } else if (designation.value !== value) {
        designation.value = value;
        touch(designation);
      }
    }

    // Propiedades: definición, resumen, slug y ficha de medicamento.
    const desiredProperties = new Map<string, unknown>();
    const ownedProperties = new Set<string>();
    for (const term of GLOSSARY_TERMS) {
      for (const code of OWNED_PROPERTY_CODES) {
        ownedProperties.add(glossaryPropertyId(term.slug, code));
      }
      for (const [code, value] of this.declaredProperties(term)) {
        desiredProperties.set(glossaryPropertyId(term.slug, code), value);
      }
    }
    const properties = await em.find(ConceptProperties, {
      conceptId: { $in: conceptIds },
    });
    for (const property of properties) {
      if (!ownedProperties.has(property.id)) continue;
      if (!desiredProperties.has(property.id)) {
        em.remove(property);
        removed += 1;
        continue;
      }
      const value = desiredProperties.get(property.id);
      if (!sameJson(property.valueJson, value)) {
        property.valueJson = value;
        touch(property);
      }
    }

    // Membresías: la categoría vieja y las etiquetas que ya no van se quitan
    // (las nuevas ya las insertó `seedMemberships`).
    const internalCodeByVersionId = new Map(
      GLOSSARY_TAXONOMY.map((entry) => [
        glossaryValueSetVersionId(entry.internalCode),
        entry.internalCode,
      ]),
    );
    const desiredMemberships = new Set(
      this.resolveMemberships().map((membership) =>
        glossaryValueSetMemberId(membership.internalCode, membership.conceptId),
      ),
    );
    const memberships = await em.find(ValueSetMembers, {
      conceptId: { $in: conceptIds },
      valueSetVersionId: { $in: [...internalCodeByVersionId.keys()] },
    });
    for (const membership of memberships) {
      const internalCode = internalCodeByVersionId.get(
        membership.valueSetVersionId,
      );
      const owned =
        internalCode !== undefined &&
        membership.id ===
          glossaryValueSetMemberId(internalCode, membership.conceptId);
      if (owned && !desiredMemberships.has(membership.id)) {
        em.remove(membership);
        removed += 1;
      }
    }

    // Relaciones entre términos curados que el catálogo ya no declara.
    const relationships = await em.find(ConceptRelationships, {
      sourceConceptId: { $in: conceptIds },
    });
    for (const relationship of relationships) {
      const source = slugByConceptId.get(relationship.sourceConceptId);
      const target = slugByConceptId.get(relationship.targetConceptId);
      const type = glossaryRelationTypeFromConceptId(
        relationship.relationshipTypeConceptId,
      );
      const owned =
        source !== undefined &&
        target !== undefined &&
        type !== undefined &&
        relationship.id ===
          glossaryRelationshipId(source.slug, type, target.slug);
      if (owned && !declaredRelationshipIds.has(relationship.id)) {
        em.remove(relationship);
        removed += 1;
      }
    }

    await em.flush();
    return { updated, removed };
  }

  /** Las propiedades que el catálogo declara para un término, por código. */
  private declaredProperties(
    term: GlossaryTermSeed,
  ): readonly (readonly [string, unknown])[] {
    const clinicalDefinition: GlossaryBilingualText = term.clinicalDefinitionEn
      ? { es: term.clinicalDefinitionEs, en: term.clinicalDefinitionEn }
      : { es: term.clinicalDefinitionEs };
    const plainSummary: GlossaryBilingualText = term.plainSummaryEn
      ? { es: term.plainSummaryEs, en: term.plainSummaryEn }
      : { es: term.plainSummaryEs };
    const rows: (readonly [string, unknown])[] = [
      [GLOSSARY_SLUG_PROPERTY_CODE, term.slug],
      [GLOSSARY_CLINICAL_DEFINITION_PROPERTY_CODE, clinicalDefinition],
      [GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE, plainSummary],
    ];
    const sourceReferences = GLOSSARY_SOURCE_REFERENCES[term.slug];
    if (sourceReferences !== undefined) {
      rows.push([GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE, sourceReferences]);
    }
    if (term.drugFacts !== undefined) {
      rows.push(
        [
          GLOSSARY_DRUG_ACTIVE_INGREDIENTS_PROPERTY_CODE,
          term.drugFacts.activeIngredients,
        ],
        [GLOSSARY_DRUG_DOSAGE_FORM_PROPERTY_CODE, term.drugFacts.dosageForm],
        [GLOSSARY_DRUG_ROUTE_PROPERTY_CODE, term.drugFacts.route],
        [GLOSSARY_DRUG_MANUFACTURER_PROPERTY_CODE, term.drugFacts.manufacturer],
      );
    }
    return rows;
  }

  /**
   * Fuente + code system + versión propios del catálogo curado (FND-25-03).
   *
   * Mismo patrón que `VademecumSeedService.seedSources`/`seedCodeSystem`/
   * `seedVersion`: una fila de `terminology_sources` describe honestamente de
   * dónde sale este contenido —autoría clínica interna, no una importación—,
   * y `code_systems`/`code_system_versions` cuelgan de ella. A diferencia del
   * vademécum no hay un dataset externo con ids propios que traducir: los tres
   * ids son deterministas (`glossary-taxonomy.ts`), así que el upsert es por
   * id como el resto de este archivo.
   */
  private async seedOwnCodeSystem(
    em: ReturnType<MikroORM['em']['fork']>,
    now: Date,
  ): Promise<void> {
    const existing = await this.existingIds(em, TerminologySources, [
      glossarySourceId,
    ]);
    if (!existing.has(glossarySourceId)) {
      em.create(
        TerminologySources,
        {
          id: glossarySourceId,
          code: GLOSSARY_SOURCE_CODE,
          name: 'Glosario médico curado (AloVida)',
          owner: 'AloVida — equipo clínico',
          // No hay una URL pública que citar: es contenido de autoría propia,
          // no una nomenclatura externa publicada. Se documenta acá, no se
          // inventa un enlace para llenar el campo.
          license:
            'Contenido original de AloVida (definición clínica y resumen llano ' +
            'escritos y revisados internamente); nomenclatura cotejada contra ' +
            'CIE-10-ES (enfermedades), DCI/ATC (principios activos) y HL7 FHIR ' +
            '(modelado de relaciones). No es una importación de esos sistemas.',
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
    }
    // Los tres niveles se vacían por separado y no en un `flush()` final.
    // `code_systems.source_id` y `code_system_versions.code_system_id` son
    // `@Property` escalares, no relaciones —así los emite el modelo—, así que
    // MikroORM no tiene arista de dependencia con la que ordenar los inserts:
    // en un flush único mandaba la versión antes que el sistema y la FK
    // reventaba (`fk_code_system_versions_code_system_id`), dejando el glosario
    // sin sembrar en toda base donde estas filas no existieran ya. Mismo
    // remedio que `VademecumSeedService`, que vacía nivel por nivel.
    await em.flush();

    // La fuente, antes que el sistema de códigos que la referencia. Ver el
    // comentario del segundo `flush`: son tres niveles encadenados por columnas
    // `uuid` sueltas, y el ORM los ordena como quiere si van juntos.
    await em.flush();

    const existingCodeSystem = await this.existingIds(em, CodeSystems, [
      glossaryCodeSystemId,
    ]);
    if (!existingCodeSystem.has(glossaryCodeSystemId)) {
      em.create(
        CodeSystems,
        {
          id: glossaryCodeSystemId,
          sourceId: glossarySourceId,
          internalCode: GLOSSARY_CODE_SYSTEM_INTERNAL_CODE,
          name: 'Glosario médico curado (AloVida) — ES',
          canonicalUrl: GLOSSARY_CODE_SYSTEM_CANONICAL_URL,
          caseSensitive: false,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
    }
    await em.flush();

    // Cada padre se escribe ANTES de crear a su hija, y por eso hay tres
    // `flush` y no uno.
    //
    // Las FK de este proyecto se mapean como columnas `uuid` sueltas, no como
    // relaciones de MikroORM: el ORM no sabe que `code_systems` depende de
    // `terminology_sources` ni que `code_system_versions` depende de
    // `code_systems`, así que ordena los INSERT como quiere. Con un solo
    // `flush` al final escribía las hijas primero y la siembra moría —primero
    // con `fk_code_system_versions_code_system_id`, después con
    // `fk_code_systems_source_id`—, lo que dejaba **toda** la suite de
    // integración sin arrancar: el arnés aborta si un seed queda omitido.
    await em.flush();

    const existingVersion = await this.existingIds(em, CodeSystemVersions, [
      glossaryCodeSystemVersionId,
    ]);
    if (!existingVersion.has(glossaryCodeSystemVersionId)) {
      em.create(
        CodeSystemVersions,
        {
          id: glossaryCodeSystemVersionId,
          codeSystemId: glossaryCodeSystemId,
          version: GLOSSARY_CODE_SYSTEM_VERSION,
          publishedAt: now,
          validFrom: now,
          isDefault: true,
          createdAt: now,
          updatedAt: now,
        },
        { partial: true },
      );
    }
    await em.flush();
  }

  /**
   * Repunta a `glossaryCodeSystemVersionId` los conceptos de término que ya
   * existían en la base bajo `mantra-core` (corridas anteriores a FND-25-03).
   *
   * No es una migración aparte porque `GlossarySeedService` es la única
   * escritora de estas filas y el criterio es el mismo que el resto del
   * archivo: comparar contra lo que ya hay y tocar sólo lo que falta —acá,
   * "falta" es "todavía apunta al code system genérico".
   */
  private async backfillTermCodeSystem(
    em: ReturnType<MikroORM['em']['fork']>,
    existingConceptIds: Set<string>,
    now: Date,
  ): Promise<number> {
    if (existingConceptIds.size === 0) return 0;
    // `nativeUpdate` en vez de leer+mutar+flushear: es un `UPDATE ... WHERE`
    // de una sola sentencia, así que en una base ya migrada (todo apunta al
    // code system propio) la condición no matchea nada y el conteo es 0 —
    // la propiedad de idempotencia se sostiene sin tener que traer las filas.
    return em.nativeUpdate(
      CatalogConcepts,
      {
        id: { $in: [...existingConceptIds] },
        codeSystemVersionId: { $ne: glossaryCodeSystemVersionId },
      },
      { codeSystemVersionId: glossaryCodeSystemVersionId, updatedAt: now },
    );
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
