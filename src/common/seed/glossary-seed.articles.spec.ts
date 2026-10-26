import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import type { GlossaryArticleDocument } from './glossary-articles.catalog';
import { glossaryPropertyId, glossaryTermConceptId } from './glossary-taxonomy';
import type { GlossarySeedService as GlossarySeedServiceClass } from './glossary-seed.service';
import {
  buildGlossarySeed,
  type GlossarySeedStore,
} from './glossary-seed.testing';

/**
 * El Nivel 9 del seed del glosario —los artículos enciclopédicos— contra un
 * catálogo de artículos fijo, para que la prueba no dependa de cuántos
 * artículos haya generado el front en cada momento.
 *
 * Los tres casos que importan:
 * - `fiebre`: término curado de `GLOSSARY_TERMS`, lo materializa el propio seed.
 * - `medlineplus-es-1744`: término que trae un importador de
 *   `tools/terminology-import/` con su propia fórmula de id; sólo se lo
 *   reconoce por su propiedad `glossary-slug`.
 * - `t3-total`: término que todavía no está en la base.
 */
const CURATED = 'fiebre';
const IMPORTED = 'medlineplus-es-1744';
const MISSING = 't3-total';

/** Id de un concepto cargado por un importador: nada que ver con `glossaryTermConceptId`. */
const IMPORTED_CONCEPT_ID = '6f1b0c62-5d1e-4f3a-9a77-0b6c1d2e3f40';

const article = (slug: string, text: string): GlossaryArticleDocument => ({
  conceptRef: { system: 'alovida-curated', code: slug, slug },
  lang: 'es',
  sections: [
    {
      kind: 'definition',
      text,
      lang: 'es',
      source: 'alovida-curated',
      sourceUrl: '',
      license: 'Texto original de AloVida, pendiente de revisión médica',
      retrievedAt: '2026-10-12',
      sourceVersion: '2026-10-12',
      locator: 'Introducción',
    },
  ],
  images: [],
  facts: [],
  references: [
    { title: 'Referencia', url: 'https://example.org', source: 'Ejemplo' },
  ],
});

const ARTICLES: Record<string, GlossaryArticleDocument> = {
  [CURATED]: article(CURATED, 'Texto de la fiebre.'),
  [IMPORTED]: article(IMPORTED, 'Texto del término importado.'),
  [MISSING]: article(MISSING, 'Texto de un término que no está en la base.'),
};

jest.unstable_mockModule('./glossary-articles.catalog', () => ({
  GLOSSARY_ARTICLE_SLUGS: Object.keys(ARTICLES).sort(),
  glossaryArticleFor: (slug: string) =>
    Object.hasOwn(ARTICLES, slug) ? ARTICLES[slug] : undefined,
}));

let GlossarySeedService: typeof GlossarySeedServiceClass;

beforeAll(async () => {
  // Importación diferida: el servicio tiene que ver el catálogo sustituido.
  const modulePath: string = './glossary-seed.service';
  ({ GlossarySeedService } = (await import(modulePath)) as {
    GlossarySeedService: typeof GlossarySeedServiceClass;
  });
});

/** La base después de que un importador cargó `IMPORTED` con su `glossary-slug`. */
function withImportedTerm(): GlossarySeedStore {
  return new Map([
    [
      'CatalogConcepts',
      new Map([[IMPORTED_CONCEPT_ID, { id: IMPORTED_CONCEPT_ID }]]),
    ],
    [
      'ConceptProperties',
      new Map([
        [
          'importador:slug',
          {
            id: 'importador:slug',
            conceptId: IMPORTED_CONCEPT_ID,
            propertyCode: 'glossary-slug',
            dataType: 'string',
            valueJson: IMPORTED,
          },
        ],
      ]),
    ],
  ]);
}

const articleRows = (rows: any[]) =>
  rows.filter((row) => row.propertyCode === 'glossary-article');

describe('GlossarySeedService — artículos de cualquier término del glosario', () => {
  it('adjunta el artículo al concepto de su `glossary-slug`, sea curado o importado', async () => {
    const g = buildGlossarySeed(GlossarySeedService, withImportedTerm());

    const result = await g.service.run();

    const rows = articleRows(g.rowsOf('ConceptProperties'));
    expect(rows).toHaveLength(2);
    expect(
      rows.find(
        (row) => row.id === glossaryPropertyId(CURATED, 'glossary-article'),
      ),
    ).toMatchObject({
      conceptId: glossaryTermConceptId(CURATED),
      dataType: 'json',
      valueJson: ARTICLES[CURATED],
    });
    expect(
      rows.find(
        (row) => row.id === glossaryPropertyId(IMPORTED, 'glossary-article'),
      ),
    ).toMatchObject({
      conceptId: IMPORTED_CONCEPT_ID,
      dataType: 'json',
      valueJson: ARTICLES[IMPORTED],
    });
    expect(result.articles).toBe(2);
    expect(result.articlesWithoutConcept).toBe(1);
  });

  it('el slug sin concepto en la base no rompe la corrida: se cuenta y se advierte una vez', async () => {
    const g = buildGlossarySeed(GlossarySeedService, withImportedTerm());

    await g.service.run();

    expect(
      g
        .rowsIn('ConceptProperties')
        .some(
          (row) => row.id === glossaryPropertyId(MISSING, 'glossary-article'),
        ),
    ).toBe(false);
    const warnings = (g.logger.warn.mock.calls as [any, string][]).filter(
      ([context]) =>
        context.operation === 'seed.glossary.article' &&
        context.withoutConcept !== undefined,
    );
    expect(warnings).toHaveLength(1);
    expect(warnings[0][0]).toMatchObject({
      withoutConcept: 1,
      total: 3,
      sample: [MISSING],
    });
  });

  it('busca los conceptos por `glossary-slug`, no por una fórmula de id', async () => {
    const g = buildGlossarySeed(GlossarySeedService, withImportedTerm());

    await g.service.run();

    expect(g.executed).toHaveLength(1);
    expect(g.executed[0].sql).toContain("value_json #>> '{}'");
    expect(g.executed[0].params).toEqual([
      'glossary-slug',
      ...Object.keys(ARTICLES).sort(),
    ]);
  });

  it('es idempotente: una segunda corrida no crea ni actualiza nada', async () => {
    const first = buildGlossarySeed(GlossarySeedService, withImportedTerm());
    await first.service.run();

    const second = buildGlossarySeed(GlossarySeedService, first.store);
    const result = await second.service.run();

    expect(second.created).toEqual([]);
    expect(second.removed).toEqual([]);
    expect(result.articles).toBe(0);
    expect(result.updated).toBe(0);
    expect(result.articlesWithoutConcept).toBe(1);
  });

  it('el término que se importa después recibe su artículo en la corrida siguiente', async () => {
    const before = buildGlossarySeed(GlossarySeedService);
    const first = await before.service.run();
    expect(first.articles).toBe(1);
    expect(first.articlesWithoutConcept).toBe(2);

    // Un importador carga el término entre dos arranques.
    const store = before.store;
    for (const [entity, rows] of withImportedTerm()) {
      for (const [id, row] of rows) store.get(entity)!.set(id, row);
    }
    const after = buildGlossarySeed(GlossarySeedService, store);
    const second = await after.service.run();

    expect(second.articles).toBe(1);
    expect(second.articlesWithoutConcept).toBe(1);
    expect(articleRows(after.rowsOf('ConceptProperties'))).toEqual([
      expect.objectContaining({
        id: glossaryPropertyId(IMPORTED, 'glossary-article'),
        conceptId: IMPORTED_CONCEPT_ID,
      }),
    ]);
  });

  it('reescribe un artículo propio desactualizado de un término importado', async () => {
    const first = buildGlossarySeed(GlossarySeedService, withImportedTerm());
    await first.service.run();
    const id = glossaryPropertyId(IMPORTED, 'glossary-article');
    first.store.get('ConceptProperties')!.get(id).valueJson = {
      ...ARTICLES[IMPORTED],
      sections: [],
    };

    const second = buildGlossarySeed(GlossarySeedService, first.store);
    const result = await second.service.run();

    expect(result.updated).toBe(1);
    expect(second.created).toEqual([]);
    expect(
      second.rowsIn('ConceptProperties').find((row) => row.id === id).valueJson,
    ).toEqual(ARTICLES[IMPORTED]);
  });

  it('no toca el artículo de otra canalización colgado de un término sin artículo propio', async () => {
    const store = withImportedTerm();
    const otherConcept = 'a3c1e7d2-0b4f-4c55-8e21-9d7a6b5c4e30';
    const foreign = {
      id: 'medlineplus:article:otro',
      conceptId: otherConcept,
      propertyCode: 'glossary-article',
      dataType: 'json',
      valueJson: { conceptRef: { slug: 'otro' }, sections: [] },
    };
    store.get('ConceptProperties')!.set(foreign.id, foreign);
    store.get('ConceptProperties')!.set('otro:slug', {
      id: 'otro:slug',
      conceptId: otherConcept,
      propertyCode: 'glossary-slug',
      dataType: 'string',
      valueJson: 'otro',
    });

    const g = buildGlossarySeed(GlossarySeedService, store);
    await g.service.run();

    expect(
      g.rowsIn('ConceptProperties').find((row) => row.id === foreign.id),
    ).toEqual(foreign);
    expect(g.removed).toEqual([]);
  });

  it('si un slug resolviera a varios conceptos, el artículo va al curado', async () => {
    const store = withImportedTerm();
    const duplicate = 'b7d9e1f3-2a4c-4e6b-8d0f-1a3c5e7b9d20';
    store.get('ConceptProperties')!.set('duplicado:slug', {
      id: 'duplicado:slug',
      conceptId: duplicate,
      propertyCode: 'glossary-slug',
      dataType: 'string',
      valueJson: CURATED,
    });

    const g = buildGlossarySeed(GlossarySeedService, store);
    await g.service.run();

    expect(
      g
        .rowsIn('ConceptProperties')
        .find(
          (row) => row.id === glossaryPropertyId(CURATED, 'glossary-article'),
        ).conceptId,
    ).toBe(glossaryTermConceptId(CURATED));
    expect(g.logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ ambiguous: 1, sample: [CURATED] }),
      expect.any(String),
    );
  });
});
