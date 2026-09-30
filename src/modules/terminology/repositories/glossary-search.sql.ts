/**
 * Piezas de SQL de la lectura paginada del glosario.
 *
 * ## Por qué `translate()` y no `unaccent`
 *
 * Buscar «hipertension» tiene que encontrar «Hipertensión». La forma canónica
 * en Postgres es la extensión `unaccent`, pero **no está instalada** —la única
 * extensión que declara `SQL/` es `btree_gist`— y agregarla es un cambio de
 * DDL que nace en el modelo (`.puml` → `gen_ddl.py` → `SQL/`), no en este
 * repositorio (ADR-0021). `translate(lower(x), …)` hace lo mismo para las
 * vocales acentuadas, la diéresis, la cedilla y la eñe del castellano, con
 * funciones nativas e inmutables: si algún día hace falta un índice por
 * expresión, esta misma expresión es indexable.
 *
 * La eñe se pliega a «n» **sólo para buscar** (quien no tiene la tecla escribe
 * «nino» y espera «niño»). Para ordenar se conserva: plegarla pondría «ñandú»
 * entre «nabo» y «nube», que no es el orden de ningún diccionario.
 */

/** Letras con tilde, diéresis o cedilla, y su forma plana — mismo largo, posición a posición. */
const ACCENTED = 'áàâäãéèêëíìîïóòôöõúùûüç';
const PLAIN = 'aaaaaeeeeiiiiooooouuuuc';

/**
 * Expresión SQL que pliega mayúsculas y tildes de una columna, para comparar.
 *
 * @param column - Columna o expresión SQL (se interpola tal cual: nunca un dato del usuario).
 * @returns La expresión normalizada, con la eñe plegada a «n».
 */
export function sqlSearchKey(column: string): string {
  return `translate(lower(${column}), '${ACCENTED}ñ', '${PLAIN}n')`;
}

/**
 * Expresión SQL de orden alfabético: sin mayúsculas ni tildes, con la eñe intacta.
 *
 * @param column - Columna o expresión SQL (se interpola tal cual: nunca un dato del usuario).
 * @returns La expresión de orden.
 */
export function sqlSortKey(column: string): string {
  return `translate(lower(${column}), '${ACCENTED}', '${PLAIN}')`;
}

/**
 * El texto buscado, plegado igual que {@link sqlSearchKey} pliega la columna.
 *
 * Se hace en JS con la descomposición Unicode y no con `translate` porque así
 * cubre también las tildes que no están en la lista (una «ā» pegada de otro
 * lado), y del lado de la columna sobra: el catálogo es castellano.
 *
 * @param text - Lo que escribió la persona.
 * @returns El texto sin tildes, en minúsculas y sin espacios en los bordes.
 */
export function normalizeSearchText(text: string): string {
  return text.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
}

/**
 * Patrón `LIKE` de «contiene», con los comodines del usuario escapados.
 *
 * Sin escapar, buscar «50%» o «a_b» sería pedirle a la base otra cosa que la
 * que se escribió. El escape es la barra invertida, que es el de omisión de
 * `LIKE` en Postgres.
 *
 * @param normalized - Texto ya normalizado con {@link normalizeSearchText}.
 * @returns El patrón `%texto%`.
 */
export function containsPattern(normalized: string): string {
  return `%${normalized.replace(/[\\%_]/g, (match) => `\\${match}`)}%`;
}
