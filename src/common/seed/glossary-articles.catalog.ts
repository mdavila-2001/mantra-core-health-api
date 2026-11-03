import articleAliasesDataset from './data/glossary/glossary-article-aliases.json';
import articlesDataset from './data/glossary/glossary-articles.json';

/**
 * Los artículos enciclopédicos de autoría propia del glosario.
 *
 * El contenido nace en el front (`data/glossary/articulos/*.md`, un archivo
 * por término) y llega acá serializado por `scripts/glossary-articulos-alovida.mjs`
 * en `data/glossary/glossary-articles.json`. Este módulo sólo lo **lee y
 * valida**: el seed (`GlossarySeedService`) lo siembra como la propiedad
 * `glossary-article` del concepto cuyo `glossary-slug` coincide —sea un
 * término curado de `GLOSSARY_TERMS` o uno de los que cargan los importadores
 * de `tools/terminology-import/`—, que
 * `GET /terminology/concepts/:id/glossary-article` ya sirve.
 *
 * ## Por qué un `.json` de cadenas
 *
 * Son cientos de artículos y varios MB de texto. Como dato (`.json` en
 * `data/`, igual que los demás datasets del seed) no pasa por el linter ni por
 * la cobertura, y `tsc` lo copia a `dist/` tal cual, sin mapa de fuentes. Cada
 * artículo va como **cadena** JSON y no como objeto: así el tipo que infiere
 * `tsc` es `{ [slug]: string }` y no la forma completa de cada documento, y el
 * parseo de cada uno es perezoso (`glossaryArticleFor`).
 *
 * ## Procedencia
 *
 * El texto es **original del equipo y está pendiente de revisión médica**:
 * cada sección lo declara (`source`, `license`) y el front lo muestra en la
 * cita. Las referencias del artículo son lecturas recomendadas, no la
 * procedencia literal de cada frase. Dosis, contraindicaciones, interacciones
 * y rangos de referencia no se redactan sin fuente (regla 97.5.4).
 *
 * ## Por qué sólo los términos que tienen artículo
 *
 * El seed adopta la propiedad `glossary-article` **únicamente** de los
 * términos que figuran acá. Un término sin artículo propio conserva el
 * que le haya adjuntado otra canalización (la de MedlinePlus), en vez de
 * quedar borrado por una reconciliación.
 */

/** Una sección con su texto y su cita; el espejo de `GlossaryArticleSection` del front. */
export interface GlossaryArticleSectionDocument {
  readonly kind: string;
  readonly text: string;
  readonly lang: 'es' | 'en';
  readonly items?: readonly string[];
  readonly source: string;
  readonly sourceUrl: string;
  readonly license: string;
  readonly retrievedAt: string;
  readonly sourceVersion: string;
  readonly locator: string;
}

/** Una ilustración original servida por el front desde `/glossary-images/`. */
export interface GlossaryArticleImageDocument {
  readonly url: string;
  readonly thumbUrl: string;
  readonly kind: 'photo' | 'image' | 'diagram';
  readonly caption: string;
  readonly altText: string;
  readonly altTextQuality: 'caption' | 'generic';
  readonly author: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly sourcePage: string;
  readonly retrievedAt: string;
}

/** El documento tal como lo espera `GlossaryArticle` en el front (TAREA-41 §12.3). */
export interface GlossaryArticleDocument {
  readonly conceptRef: {
    readonly system: string;
    readonly code: string;
    readonly slug: string;
  };
  readonly lang: 'es' | 'en';
  readonly sections: readonly GlossaryArticleSectionDocument[];
  readonly images: readonly GlossaryArticleImageDocument[];
  readonly facts: readonly {
    readonly label: string;
    readonly value: string;
    readonly source: string;
    readonly sourceUrl: string;
  }[];
  readonly references: readonly {
    readonly title: string;
    readonly url: string;
    readonly source: string;
  }[];
}

/** Un artículo `GlossaryArticle` serializado como JSON, por slug del término. */
const GLOSSARY_ARTICLES_JSON: Readonly<Record<string, string>> =
  articlesDataset;

/**
 * Término visible → artículo que se le muestra.
 *
 * El slug de un artículo casi nunca es el del término que la gente abre: la
 * «Ecografía» del glosario es `medlineplus-lab-ecografia` (y su duplicado
 * `wikidata-prueba-q234904`), no `ecografia`. Sin esta tabla el seed buscaba
 * el concepto `ecografia`, no lo encontraba y el término quedaba sin artículo.
 * La escribe el generador del front (`articulos-terminos.json`, al revés).
 */
const GLOSSARY_ARTICLE_ALIASES: Readonly<Record<string, string>> =
  articleAliasesDataset;

/**
 * Los slugs de término con artículo, ordenados: los que tienen uno propio y
 * los que muestran uno por `glossary-article-aliases.json`.
 */
export const GLOSSARY_ARTICLE_SLUGS: readonly string[] = [
  ...new Set([
    ...Object.keys(GLOSSARY_ARTICLES_JSON),
    ...Object.keys(GLOSSARY_ARTICLE_ALIASES).filter((slug) =>
      Object.hasOwn(
        GLOSSARY_ARTICLES_JSON,
        GLOSSARY_ARTICLE_ALIASES[slug],
      ),
    ),
  ]),
].sort();

const parsed = new Map<string, GlossaryArticleDocument>();

/**
 * El artículo de un término, o `undefined` si no tiene uno.
 *
 * Un término con alias recibe el artículo de su fuente con `conceptRef`
 * reescrito a su propio slug: el documento declara siempre el término al que
 * cuelga. Se parsea la primera vez que se pide y se guarda: son ~70 KB de
 * texto por término y el seed lo consulta varias veces por corrida.
 */
export function glossaryArticleFor(
  slug: string,
): GlossaryArticleDocument | undefined {
  const cached = parsed.get(slug);
  if (cached !== undefined) return cached;
  let article: GlossaryArticleDocument;
  if (Object.hasOwn(GLOSSARY_ARTICLES_JSON, slug)) {
    article = JSON.parse(GLOSSARY_ARTICLES_JSON[slug]) as GlossaryArticleDocument;
  } else if (Object.hasOwn(GLOSSARY_ARTICLE_ALIASES, slug)) {
    const source = GLOSSARY_ARTICLE_ALIASES[slug];
    if (!Object.hasOwn(GLOSSARY_ARTICLES_JSON, source)) return undefined;
    const original = JSON.parse(
      GLOSSARY_ARTICLES_JSON[source],
    ) as GlossaryArticleDocument;
    article = {
      ...original,
      conceptRef: { ...original.conceptRef, code: slug, slug },
    };
  } else {
    return undefined;
  }
  parsed.set(slug, article);
  return article;
}
