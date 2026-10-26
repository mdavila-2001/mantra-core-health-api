import { GlossarySeedService } from './glossary-seed.service';
import { GLOSSARY_TERMS } from './glossary-terms.catalog';
import {
  GLOSSARY_ARTICLE_SLUGS,
  glossaryArticleFor,
} from './glossary-articles.catalog';
import { GLOSSARY_SOURCE_REFERENCES } from './glossary-source-provenance';
import {
  GLOSSARY_TAXONOMY,
  glossaryPreferredDesignationId,
  glossaryPropertyId,
  glossaryRelationshipId,
  glossarySynonymDesignationId,
  glossaryTermConceptId,
  glossaryValueSetMemberId,
  glossaryValueSetVersionId,
} from './glossary-taxonomy';
import {
  GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
  GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
  glossaryRelationTypeConceptId,
} from '../../modules/terminology/glossary.constants';
import {
  buildGlossarySeed,
  type GlossarySeedStore as Store,
} from './glossary-seed.testing';

/**
 * El seed con un `em` en memoria (ver `glossary-seed.testing.ts`).
 *
 * @param initial - Filas que la base ya tiene, por entidad.
 * @returns Servicio, filas creadas y quitadas, y el estado final.
 */
const build = (initial?: Store) =>
  buildGlossarySeed(GlossarySeedService, initial);

/** Una base ya sembrada con el catálogo actual. */
async function seeded(): Promise<Store> {
  const g = build();
  await g.service.run();
  return g.store;
}

/** Cuántas relaciones declara el catálogo curado (contando la huérfana conocida). */
const TOTAL_DECLARED_RELATIONS = GLOSSARY_TERMS.reduce(
  (total, term) => total + term.relations.length,
  0,
);

/** Cuántas de esas relaciones resuelven a un slug conocido. */
const KNOWN_SLUGS = new Set(GLOSSARY_TERMS.map((term) => term.slug));
const TOTAL_RESOLVABLE_RELATIONS = GLOSSARY_TERMS.reduce(
  (total, term) =>
    total +
    term.relations.filter((relation) => KNOWN_SLUGS.has(relation.targetSlug))
      .length,
  0,
);

/** Cuántas membresías `(value set, concepto)` declara el catálogo (categoría + etiquetas + paraguas). */
const TOTAL_MEMBERSHIPS = GLOSSARY_TERMS.reduce(
  (total, term) =>
    total + 1 /* categoría */ + term.tagKeys.length + 1 /* paraguas */,
  0,
);

/** Cuántas designaciones declara el catálogo (preferida ES + sinónimos). */
const TOTAL_DESIGNATIONS = GLOSSARY_TERMS.reduce(
  (total, term) => total + 1 /* preferida */ + (term.esSynonyms?.length ?? 0),
  0,
);

/**
 * Cuántas propiedades declara el catálogo: 3 por término (slug, definición
 * clínica, resumen llano), fuentes editoriales cuando están curadas y 4 más
 * (`active_ingredients`/`dosage_form`/`route`/`manufacturer`) con `drugFacts`.
 * El artículo enciclopédico va aparte (`CURATED_ARTICLE_SLUGS`).
 */
const TOTAL_PROPERTIES = GLOSSARY_TERMS.reduce(
  (total, term) =>
    total +
    3 +
    (GLOSSARY_SOURCE_REFERENCES[term.slug] !== undefined ? 1 : 0) +
    (term.drugFacts ? 4 : 0),
  0,
);

/**
 * Los artículos de términos curados: los únicos cuyo concepto existe en una
 * base vacía después de este seed. El resto los cargan los importadores.
 */
const CURATED_ARTICLE_SLUGS = GLOSSARY_ARTICLE_SLUGS.filter((slug) =>
  KNOWN_SLUGS.has(slug),
);

describe('GlossarySeedService', () => {
  it('materializa la taxonomía y el catálogo curado sobre una base vacía', async () => {
    const g = build();

    const result = await g.service.run();

    expect(g.rowsOf('ValueSets')).toHaveLength(GLOSSARY_TAXONOMY.length);
    expect(g.rowsOf('ValueSetVersions')).toHaveLength(GLOSSARY_TAXONOMY.length);
    expect(g.rowsOf('CatalogConcepts')).toHaveLength(GLOSSARY_TERMS.length);
    expect(g.rowsOf('ConceptDesignations')).toHaveLength(TOTAL_DESIGNATIONS);
    expect(g.rowsOf('ConceptProperties')).toHaveLength(
      TOTAL_PROPERTIES + CURATED_ARTICLE_SLUGS.length,
    );
    expect(g.rowsOf('ValueSetMembers')).toHaveLength(TOTAL_MEMBERSHIPS);
    expect(g.rowsOf('ConceptRelationships')).toHaveLength(
      TOTAL_RESOLVABLE_RELATIONS,
    );

    expect(result.valueSets).toBe(GLOSSARY_TAXONOMY.length);
    expect(result.terms).toBe(GLOSSARY_TERMS.length);
    expect(result.memberships).toBe(TOTAL_MEMBERSHIPS);
    expect(result.relationships).toBe(TOTAL_RESOLVABLE_RELATIONS);
    expect(result.properties).toBe(TOTAL_PROPERTIES);
    expect(result.articles).toBe(CURATED_ARTICLE_SLUGS.length);
    expect(result.orphanRelationships).toBe(
      TOTAL_DECLARED_RELATIONS - TOTAL_RESOLVABLE_RELATIONS,
    );
    expect(result.orphanRelationships).toBe(0);
  });

  it('todo término se siembra activo (`TERM_ACTIVE`), nunca en borrador', async () => {
    const g = build();

    await g.service.run();

    for (const concept of g.rowsOf('CatalogConcepts')) {
      expect(concept.stateConceptId).toEqual(expect.any(String));
    }
    // Todos comparten el mismo estado: el activo.
    const states = new Set(
      g.rowsOf('CatalogConcepts').map((concept) => concept.stateConceptId),
    );
    expect(states.size).toBe(1);
  });

  it('no siembra ninguna propiedad `glossary-image`: decisión deliberada, no una omisión', async () => {
    const g = build();

    await g.service.run();

    const propertyCodes = new Set(
      g.rowsOf('ConceptProperties').map((property) => property.propertyCode),
    );
    // Los cuatro códigos de FND-25-02 (`active_ingredients`/`dosage_form`/
    // `route`/`manufacturer`) sólo aparecen para los términos que declaran
    // `drugFacts`; las fuentes editoriales sólo para términos documentados.
    // Este test también fija que `glossary-image` nunca aparece.
    expect(propertyCodes.has('glossary-image')).toBe(false);
    const expected = new Set([
      'glossary-slug',
      'glossary-clinical-definition',
      'glossary-plain-summary',
      'glossary-sources',
      'glossary-article',
      'active_ingredients',
      'dosage_form',
      'route',
      'manufacturer',
    ]);
    for (const code of propertyCodes) {
      expect(expected.has(code)).toBe(true);
    }

    const sourceProperties = g
      .rowsOf('ConceptProperties')
      .filter(
        (property) =>
          property.propertyCode === GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE,
      );
    expect(sourceProperties).toHaveLength(
      Object.keys(GLOSSARY_SOURCE_REFERENCES).length,
    );
    for (const [slug, references] of Object.entries(
      GLOSSARY_SOURCE_REFERENCES,
    )) {
      const property = sourceProperties.find(
        (candidate) =>
          candidate.id ===
          glossaryPropertyId(slug, GLOSSARY_SOURCE_REFERENCES_PROPERTY_CODE),
      );
      expect(property).toMatchObject({
        conceptId: glossaryTermConceptId(slug),
        dataType: 'json',
        valueJson: references,
      });
    }
  });

  it('siembra el artículo enciclopédico propio, íntegro, en los términos curados que lo tienen', async () => {
    const g = build();

    const result = await g.service.run();

    const articles = g
      .rowsOf('ConceptProperties')
      .filter((property) => property.propertyCode === 'glossary-article');
    expect(articles.map((property) => property.conceptId).sort()).toEqual(
      CURATED_ARTICLE_SLUGS.map((slug) => glossaryTermConceptId(slug)).sort(),
    );
    // En una base vacía sólo existen los conceptos curados: el resto de los
    // artículos espera a que un importador cargue su término.
    expect(result.articlesWithoutConcept).toBe(
      GLOSSARY_ARTICLE_SLUGS.length - CURATED_ARTICLE_SLUGS.length,
    );
    for (const slug of CURATED_ARTICLE_SLUGS) {
      const property = articles.find(
        (candidate) =>
          candidate.id === glossaryPropertyId(slug, 'glossary-article'),
      );
      expect(property).toMatchObject({
        conceptId: glossaryTermConceptId(slug),
        dataType: 'json',
      });
      // Lo que se siembra es el documento tal cual: lo que el front dibuja.
      expect(property.valueJson).toEqual(glossaryArticleFor(slug));
    }
  });

  it('re-sembrar sobre una base ya poblada no duplica ninguna fila (reseed idempotente)', async () => {
    // Se siembra una vez y se vuelve a correr sobre lo que quedó — mismo
    // patrón que `DynamicEnumSeedService`.
    const second = build(await seeded());
    const result = await second.service.run();

    expect(second.created).toEqual([]);
    expect(second.removed).toEqual([]);
    expect(result).toEqual({
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
      articles: 0,
      articlesWithoutConcept:
        GLOSSARY_ARTICLE_SLUGS.length - CURATED_ARTICLE_SLUGS.length,
    });
  });

  it('los identificadores deterministas de dos corridas independientes coinciden byte a byte', async () => {
    const first = build();
    await first.service.run();
    const second = build();
    await second.service.run();

    const idsFirst = first.created.map((row) => row.data.id).sort();
    const idsSecond = second.created.map((row) => row.data.id).sort();
    expect(idsFirst).toEqual(idsSecond);
  });

  it('no deja advertencia por la relación de control de signos vitales, que ya tiene destino', async () => {
    const g = build();

    await g.service.run();

    expect(g.logger.warn).not.toHaveBeenCalledWith(
      expect.objectContaining({
        sourceSlug: 'hipertension-arterial',
        targetSlug: 'control-de-signos-vitales',
      }),
      expect.any(String),
    );
  });

  describe('reconciliación de una base sembrada con el catálogo anterior', () => {
    const PT = 'tiempo-de-protrombina';
    const BLOODCOUNT = 'hemograma-completo';

    /**
     * La base tal como la dejó el catálogo de antes de la auditoría del
     * 2026-09-30: hemograma en «Pruebas diagnósticas», «Hipertermia» como
     * sinónimo de fiebre, el INR como sinónimo del tiempo de protrombina, su
     * nombre en inglés viejo, el resumen viejo de la warfarina y una relación
     * entre curados que el catálogo ya no declara.
     */
    async function basePrevious(): Promise<Store> {
      const store = await seeded();
      const rows = (entity: string) => store.get(entity)!;
      const put = (entity: string, row: any) => rows(entity).set(row.id, row);

      const bloodCount = glossaryTermConceptId(BLOODCOUNT);
      rows('ValueSetMembers').delete(
        glossaryValueSetMemberId('glossary-category-lab', bloodCount),
      );
      put('ValueSetMembers', {
        id: glossaryValueSetMemberId(
          'glossary-category-diagnostic-test',
          bloodCount,
        ),
        valueSetVersionId: glossaryValueSetVersionId(
          'glossary-category-diagnostic-test',
        ),
        conceptId: bloodCount,
      });

      put('ConceptDesignations', {
        id: glossarySynonymDesignationId('fiebre', 1),
        conceptId: glossaryTermConceptId('fiebre'),
        value: 'Hipertermia',
      });

      rows('CatalogConcepts').get(glossaryTermConceptId(PT)).display =
        'Prothrombin time (INR)';
      rows('ConceptDesignations').get(
        glossarySynonymDesignationId(PT, 0),
      ).value = 'INR';
      put('ConceptDesignations', {
        id: glossarySynonymDesignationId(PT, 1),
        conceptId: glossaryTermConceptId(PT),
        value: 'TP',
      });

      rows('ConceptProperties').get(
        glossaryPropertyId('warfarina', GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE),
      ).valueJson = {
        es: 'Es un medicamento que hace la sangre más líquida para evitar coágulos.',
      };

      put('ConceptRelationships', {
        id: glossaryRelationshipId('dialisis', 'RELATED_TERM', 'corazon'),
        sourceConceptId: glossaryTermConceptId('dialisis'),
        targetConceptId: glossaryTermConceptId('corazon'),
        relationshipTypeConceptId:
          glossaryRelationTypeConceptId('RELATED_TERM'),
      });
      return store;
    }

    it('mueve la categoría, corrige textos y quita sinónimos y relaciones que ya no van', async () => {
      const g = build(await basePrevious());

      const result = await g.service.run();

      const bloodCount = glossaryTermConceptId(BLOODCOUNT);
      const categories = g
        .rowsIn('ValueSetMembers')
        .filter(
          (m) =>
            m.conceptId === bloodCount &&
            [
              glossaryValueSetVersionId('glossary-category-lab'),
              glossaryValueSetVersionId('glossary-category-diagnostic-test'),
            ].includes(m.valueSetVersionId),
        )
        .map((m) => m.valueSetVersionId);
      expect(categories).toEqual([
        glossaryValueSetVersionId('glossary-category-lab'),
      ]);

      const designation = (id: string) =>
        g.rowsIn('ConceptDesignations').find((d) => d.id === id);
      expect(
        designation(glossarySynonymDesignationId('fiebre', 1)),
      ).toBeUndefined();
      expect(designation(glossarySynonymDesignationId(PT, 0))?.value).toBe(
        'TP',
      );
      expect(designation(glossarySynonymDesignationId(PT, 1))).toBeUndefined();

      expect(
        g
          .rowsIn('CatalogConcepts')
          .find((c) => c.id === glossaryTermConceptId(PT))?.display,
      ).toBe('Prothrombin time (PT)');
      expect(
        g
          .rowsIn('ConceptProperties')
          .find(
            (p) =>
              p.id ===
              glossaryPropertyId(
                'warfarina',
                GLOSSARY_PLAIN_SUMMARY_PROPERTY_CODE,
              ),
          )?.valueJson.es,
      ).toContain('tarde más en coagular');

      expect(
        g
          .rowsIn('ConceptRelationships')
          .some(
            (r) =>
              r.id ===
              glossaryRelationshipId('dialisis', 'RELATED_TERM', 'corazon'),
          ),
      ).toBe(false);

      // 1 membresía nueva (lab); 3 filas actualizadas (display, sinónimo,
      // resumen); 4 quitadas (categoría vieja, 2 sinónimos, 1 relación).
      expect(result.memberships).toBe(1);
      expect(result.updated).toBe(3);
      expect(result.removed).toBe(4);
    });

    it('una segunda corrida sobre la base reconciliada no escribe nada', async () => {
      const first = build(await basePrevious());
      await first.service.run();

      const second = build(first.store);
      const result = await second.service.run();

      expect(second.created).toEqual([]);
      expect(second.removed).toEqual([]);
      expect(result.updated).toBe(0);
      expect(result.removed).toBe(0);
    });

    it('un artículo desactualizado en la base se reescribe con el del catálogo', async () => {
      const slug = CURATED_ARTICLE_SLUGS[0];
      const store = await seeded();
      const property = store
        .get('ConceptProperties')!
        .get(glossaryPropertyId(slug, 'glossary-article'));
      property.valueJson = { ...property.valueJson, sections: [] };

      const g = build(store);
      const result = await g.service.run();

      expect(result.updated).toBe(1);
      expect(
        g
          .rowsIn('ConceptProperties')
          .find(
            (row) => row.id === glossaryPropertyId(slug, 'glossary-article'),
          ).valueJson,
      ).toEqual(glossaryArticleFor(slug));
    });

    it('no toca filas ajenas colgadas de un término curado', async () => {
      const store = await seeded();
      const fever = glossaryTermConceptId('fiebre');
      const foreign: [string, any][] = [
        [
          'ConceptDesignations',
          { id: 'designacion-ajena', conceptId: fever, value: 'Calentura' },
        ],
        [
          'ConceptProperties',
          {
            id: 'propiedad-ajena',
            conceptId: fever,
            propertyCode: 'nota-local',
            valueJson: { es: 'x' },
          },
        ],
        [
          'ValueSetMembers',
          {
            id: 'membresia-ajena',
            conceptId: fever,
            valueSetVersionId: 'version-de-otro-value-set',
          },
        ],
        [
          'ConceptRelationships',
          {
            id: 'relacion-ajena',
            sourceConceptId: fever,
            targetConceptId: glossaryTermConceptId('corazon'),
            relationshipTypeConceptId:
              glossaryRelationTypeConceptId('RELATED_TERM'),
          },
        ],
        [
          'ConceptDesignations',
          {
            // Id fuera del espacio que este servicio genera para la preferida.
            id: `${glossaryPreferredDesignationId('fiebre')}-copia`,
            conceptId: fever,
            value: 'Fiebre (copia)',
          },
        ],
      ];
      for (const [entity, row] of foreign) store.get(entity)!.set(row.id, row);

      const g = build(store);
      const result = await g.service.run();

      for (const [entity, row] of foreign) {
        expect(g.rowsIn(entity).find((r) => r.id === row.id)).toEqual(row);
      }
      expect(result.updated).toBe(0);
      expect(result.removed).toBe(0);
    });
  });
});
