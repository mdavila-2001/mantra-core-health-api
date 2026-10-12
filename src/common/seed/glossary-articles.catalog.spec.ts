import { describe, it, expect } from '@jest/globals';
import {
  GLOSSARY_ARTICLE_SLUGS,
  glossaryArticleFor,
} from './glossary-articles.catalog';
import { GLOSSARY_TERMS } from './glossary-terms.catalog';

/** Las claves de sección que el front sabe titular (`GlossarySectionKind`). */
const SECTION_KINDS = new Set([
  'definition', 'overview', 'symptoms', 'causes', 'risk_factors', 'diagnosis',
  'treatment_overview', 'complications', 'prevention', 'prognosis',
  'when_to_seek_care', 'epidemiology', 'genetics', 'classification',
  'associated_conditions', 'red_flags', 'self_care', 'location', 'structure',
  'function', 'blood_supply', 'innervation', 'clinical_relevance',
  'related_structures', 'indications', 'contraindications', 'adverse_effects',
  'interactions', 'pregnancy_lactation', 'special_populations',
  'pharmacologic_class', 'presentations', 'purpose', 'preparation',
  'procedure_description', 'risks', 'interpretation', 'reference_values',
  'recovery', 'alternatives', 'scope', 'conditions_treated', 'subspecialties',
  'training', 'transmission', 'side_effects', 'effects', 'benefits',
  'how_it_works', 'safe_use', 'what_to_expect', 'importance', 'considerations',
  'additional_information',
]);

/** Sólo `https://` para todo enlace externo. */
const HTTPS = /^https:\/\//i;
/** Una ilustración propia: archivo de la carpeta pública del front, nada más. */
const OWN_IMAGE = /^\/glossary-images\/[a-z0-9]+(?:-[a-z0-9]+)*\.svg$/;

const wordsOf = (text: string): number =>
  text.split(/\s+/).filter(Boolean).length;

describe('Artículos enciclopédicos de autoría propia del glosario', () => {
  const termSlugs = new Set(GLOSSARY_TERMS.map((term) => term.slug));

  it('hay al menos un artículo', () => {
    expect(GLOSSARY_ARTICLE_SLUGS.length).toBeGreaterThan(0);
  });

  it('cada artículo es de un término curado que existe', () => {
    const unknown = GLOSSARY_ARTICLE_SLUGS.filter(
      (slug) => !termSlugs.has(slug),
    );
    expect(unknown).toEqual([]);
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

  it('cada artículo llega al piso de 2.000 palabras', () => {
    const short = GLOSSARY_ARTICLE_SLUGS.map((slug) => ({
      slug,
      words: glossaryArticleFor(slug)!.sections.reduce(
        (total, section) => total + wordsOf(section.text),
        0,
      ),
    })).filter((entry) => entry.words < 2000);
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

  it('cada artículo trae imágenes propias y referencias https', () => {
    for (const slug of GLOSSARY_ARTICLE_SLUGS) {
      const article = glossaryArticleFor(slug)!;
      expect(article.images.length).toBeGreaterThan(0);
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
