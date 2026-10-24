import { GLOSSARY_ARTICLES_JSON } from './glossary-articles.generated';

/**
 * Los artículos enciclopédicos de autoría propia del glosario curado.
 *
 * El contenido nace en el front (`data/glossary/articulos/*.md`, un archivo
 * por término) y llega acá serializado por `scripts/glossary-articulos-alovida.mjs`
 * en `glossary-articles.generated.ts`. Este módulo sólo lo **lee y valida**: el
 * seed (`GlossarySeedService`) lo siembra como la propiedad `glossary-article`
 * del concepto, que `GET /terminology/concepts/:id/glossary-article` ya sirve.
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
 * términos que figuran acá. Un término curado sin artículo propio conserva el
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

/** Los slugs que tienen artículo propio, ordenados. */
export const GLOSSARY_ARTICLE_SLUGS: readonly string[] = Object.keys(
  GLOSSARY_ARTICLES_JSON,
).sort();

const parsed = new Map<string, GlossaryArticleDocument>();

/**
 * El artículo de un término, o `undefined` si no tiene uno propio.
 *
 * Se parsea la primera vez que se pide y se guarda: son ~70 KB de texto por
 * término y el seed lo consulta varias veces por corrida.
 */
export function glossaryArticleFor(
  slug: string,
): GlossaryArticleDocument | undefined {
  const cached = parsed.get(slug);
  if (cached !== undefined) return cached;
  const raw = GLOSSARY_ARTICLES_JSON[slug];
  if (raw === undefined) return undefined;
  const article = JSON.parse(raw) as GlossaryArticleDocument;
  parsed.set(slug, article);
  return article;
}
