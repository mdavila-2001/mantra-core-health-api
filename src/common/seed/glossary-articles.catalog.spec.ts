import { describe, it, expect } from '@jest/globals';
import {
  GLOSSARY_ARTICLE_SLUGS,
  glossaryArticleFor,
} from './glossary-articles.catalog';
import articleAliases from './data/glossary/glossary-article-aliases.json';
import { GLOSSARY_TERMS } from './glossary-terms.catalog';

/** Las claves de sección que el front sabe titular (`GlossarySectionKind`). */
const SECTION_KINDS = new Set([
  'definition',
  'overview',
  'symptoms',
  'causes',
  'risk_factors',
  'diagnosis',
  'treatment_overview',
  'complications',
  'prevention',
  'prognosis',
  'when_to_seek_care',
  'epidemiology',
  'genetics',
  'classification',
  'associated_conditions',
  'red_flags',
  'self_care',
  'location',
  'structure',
  'function',
  'blood_supply',
  'innervation',
  'clinical_relevance',
  'related_structures',
  'indications',
  'contraindications',
  'adverse_effects',
  'interactions',
  'pregnancy_lactation',
  'special_populations',
  'pharmacologic_class',
  'presentations',
  'purpose',
  'preparation',
  'procedure_description',
  'risks',
  'interpretation',
  'reference_values',
  'recovery',
  'alternatives',
  'scope',
  'conditions_treated',
  'subspecialties',
  'training',
  'transmission',
  'side_effects',
  'effects',
  'benefits',
  'how_it_works',
  'safe_use',
  'what_to_expect',
  'importance',
  'considerations',
  'additional_information',
]);

/** Sólo `https://` para todo enlace externo. */
const HTTPS = /^https:\/\//i;
/** Una ilustración propia: archivo de la carpeta pública del front, nada más. */
const OWN_IMAGE = /^\/glossary-images\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;

const wordsOf = (text: string): number =>
  text.split(/\s+/).filter(Boolean).length;

/** Un slug del glosario: kebab-case, el mismo formato que exige el generador del front. */
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Piso de palabras de un artículo de término curado: los de autoría manual
 * (`data/glossary/articulos/00_README.md`, «--min 2000» por omisión).
 */
const CURATED_MIN_WORDS = 2000;

/**
 * Piso de palabras de cualquier artículo: el de los artículos de
 * investigación de las capas del front (`--min 350`, ver el mismo README).
 */
const MIN_WORDS = 350;

const wordsOfArticle = (slug: string): number =>
  glossaryArticleFor(slug)!.sections.reduce(
    (total, section) => total + wordsOf(section.text),
    0,
  );

describe('Artículos enciclopédicos de autoría propia del glosario', () => {
  const termSlugs = new Set(GLOSSARY_TERMS.map((term) => term.slug));

  it('hay al menos un artículo', () => {
    expect(GLOSSARY_ARTICLE_SLUGS.length).toBeGreaterThan(0);
  });

  it('cada artículo está bajo el slug de su término, en kebab-case', () => {
    // No se exige que el término sea curado: el seed adjunta el artículo a
    // cualquier concepto del glosario por su `glossary-slug`.
    for (const slug of GLOSSARY_ARTICLE_SLUGS) {
      expect(slug).toMatch(SLUG);
      expect(glossaryArticleFor(slug)!.conceptRef.slug).toBe(slug);
    }
  });

  it('un término con alias muestra el artículo de su fuente bajo su propio slug', () => {
    // El término visible casi nunca tiene el slug del artículo («Ecografía»
    // es `medlineplus-lab-ecografia`): sin el alias quedaba sin artículo.
    const aliases = Object.entries(
      articleAliases as Record<string, string>,
    );
    for (const [term, source] of aliases) {
      expect(GLOSSARY_ARTICLE_SLUGS).toContain(term);
      const article = glossaryArticleFor(term)!;
      const original = glossaryArticleFor(source)!;
      expect(article.conceptRef.slug).toBe(term);
      expect(article.sections).toEqual(original.sections);
      expect(article.images).toEqual(original.images);
    }
  });

  it('un slug sin artículo no devuelve nada, ni siquiera uno heredado de Object', () => {
    expect(glossaryArticleFor('no-existe-este-termino')).toBeUndefined();
    expect(glossaryArticleFor('constructor')).toBeUndefined();
    expect(glossaryArticleFor('__proto__')).toBeUndefined();
  });

  it('cada artículo declara el slug de su término y su procedencia propia', () => {
    for (const slug of GLOSSARY_ARTICLE_SLUGS) {
      const article = glossaryArticleFor(slug)!;
      expect(article.conceptRef.slug).toBe(slug);
      expect(article.lang).toBe('es');
      for (const section of article.sections) {
        expect(section.source).toBe('alovida-curated');
        // Nunca se presenta como texto de una fuente externa ni como revisado.
        expect(section.license).toContain('pendiente de revisión médica');
      }
    }
  });

  it('cada artículo tiene secciones con claves conocidas y texto', () => {
    for (const slug of GLOSSARY_ARTICLE_SLUGS) {
      const article = glossaryArticleFor(slug)!;
      expect(article.sections.length).toBeGreaterThan(0);
      for (const section of article.sections) {
        expect(SECTION_KINDS.has(section.kind)).toBe(true);
        expect(section.text.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('cada artículo de un término curado llega al piso de 2.000 palabras', () => {
    const short = GLOSSARY_ARTICLE_SLUGS.filter((slug) => termSlugs.has(slug))
      .map((slug) => ({ slug, words: wordsOfArticle(slug) }))
      .filter((entry) => entry.words < CURATED_MIN_WORDS);
    expect(short).toEqual([]);
  });

  it('todo artículo llega al piso de 350 palabras', () => {
    const short = GLOSSARY_ARTICLE_SLUGS.map((slug) => ({
      slug,
      words: wordsOfArticle(slug),
    })).filter((entry) => entry.words < MIN_WORDS);
    expect(short).toEqual([]);
  });

  it('no redacta dosis, contraindicaciones ni interacciones sin fuente (regla 97.5.4)', () => {
    for (const slug of GLOSSARY_ARTICLE_SLUGS) {
      const kinds = glossaryArticleFor(slug)!.sections.map(
        (section) => section.kind,
      );
      expect(kinds).not.toContain('contraindications');
      expect(kinds).not.toContain('interactions');
      expect(kinds).not.toContain('reference_values');
    }
  });

  it('cada artículo trae sólo imágenes propias y referencias https', () => {
    // Un artículo puede no tener ilustración: los de investigación se
    // compilan con `--sin-imagen` (ver `00_README.md` del front). Las que trae
    // tienen que ser propias y describirse.
    for (const slug of GLOSSARY_ARTICLE_SLUGS) {
      const article = glossaryArticleFor(slug)!;
      for (const image of article.images) {
        expect(image.url).toMatch(OWN_IMAGE);
        expect(image.thumbUrl).toMatch(OWN_IMAGE);
        expect(image.author.trim()).not.toBe('');
        expect(image.license.trim()).not.toBe('');
        expect(image.altText.length).toBeGreaterThanOrEqual(20);
      }
      expect(article.references.length).toBeGreaterThan(0);
      for (const reference of article.references) {
        expect(reference.url).toMatch(HTTPS);
        expect(reference.title.trim()).not.toBe('');
      }
    }
  });
});
