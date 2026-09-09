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
  GLOSSARY_SLUG_PROPERTY_CODE,
  glossaryRelationTypeConceptId,
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
    /** Propiedades (slug, definición clínica, resumen llano) creadas. */
    properties: number;
    /** Membresías de value set (categoría + etiquetas + paraguas) creadas. */
    memberships: number;
    /** Relaciones tipadas creadas. */
    relationships: number;
    /** Relaciones declaradas cuyo slug destino no resuelve; se omiten con advertencia. */
    orphanRelationships: number;
    /** Conceptos de término migrados de `mantra-core` al code system propio del glosario (FND-25-03). */
    codeSystemBackfilled: number;
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
        counters.relationships +
        counters.codeSystemBackfilled >
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
    const drugFactPropertyCodes = [
      GLOSSARY_DRUG_ACTIVE_INGREDIENTS_PROPERTY_CODE,
      GLOSSARY_DRUG_DOSAGE_FORM_PROPERTY_CODE,
      GLOSSARY_DRUG_ROUTE_PROPERTY_CODE,
      GLOSSARY_DRUG_MANUFACTURER_PROPERTY_CODE,
    ];
    const ids = GLOSSARY_TERMS.flatMap((term) => [
      ...propertyCodes.map((code) => glossaryPropertyId(term.slug, code)),
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
