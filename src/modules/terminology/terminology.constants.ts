import { CONCEPTS } from '../../common';
import type { DesignationLanguage } from './dto';

/**
 * Convenciones de terminología que comparten la lectura y el seed.
 *
 * Viven acá y no en cada sitio porque son un acuerdo entre dos capas que no se
 * ven entre sí: el arranque escribe las traducciones y la búsqueda las lee. Si
 * cada uno escribiera el literal por su cuenta, el día que uno cambie el otro
 * dejaría de encontrar nada — y el modo de fallo sería silencioso: un glosario
 * que vuelve a mostrarse en inglés sin que ninguna prueba se ponga roja.
 */

/**
 * Cómo se llama la propiedad que guarda la definición de un concepto en un
 * idioma.
 *
 * `catalog_concepts.definition` es **una sola** columna, sin idioma declarado,
 * en un catálogo que es multilingüe por diseño: no hay dónde poner la segunda
 * lengua. `concept_properties` sí admite tantas como haga falta, una por código
 * de propiedad, y para eso está.
 *
 * @param language - Idioma de la definición.
 * @returns El `property_code` correspondiente, p. ej. `definition-es`.
 */
export function definitionPropertyCode(language: DesignationLanguage): string {
  return `definition-${language.toLowerCase()}`;
}

/**
 * El concepto que representa cada idioma admitido en las designaciones.
 *
 * El modelo guarda el idioma de una designación como `language_concept_id`, o
 * sea como otro concepto del catálogo; esto es la traducción entre el código que
 * viaja por la API (`ES`) y esa fila.
 */
export const LANGUAGE_CONCEPT_BY_CODE: Readonly<
  Record<DesignationLanguage, string>
> = {
  ES: CONCEPTS.LANG_ES,
  EN: CONCEPTS.LANG_EN,
};

/** Idiomas que la lectura admite en `lang`. */
export const SUPPORTED_DESIGNATION_LANGUAGES: readonly DesignationLanguage[] = [
  'ES',
  'EN',
];
