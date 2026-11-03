/**
 * Contratos TypeScript de las columnas jsonb de `dynamic_field_definitions`.
 *
 * Viven en un archivo propio, no en la entidad: el cuerpo de la entidad lo
 * regenera `salud-db/gen_entities.py` (ADR-0022), que emite `unknown` para toda
 * columna `jsonb`, y todo lo que no sea la clase se perdería en la siguiente
 * corrida. El barrel los re-exporta, así los consumidores siguen importando de
 * '../entities'.
 */

/**
 * Opciones propias de un campo de elección (`dataType: 'code'` sin
 * `valueSetId`): textos que quien arma el formulario escribió a mano, en el
 * orden en que se ofrecen.
 */
export type FieldChoiceOptions = string[];

/**
 * Estrecha el valor de la columna `options` (jsonb → `unknown`) a la lista de
 * opciones, o `undefined` si la columna está vacía o no contiene una lista de
 * textos. Valida en ejecución: la base no garantiza la forma del jsonb.
 */
export function choiceOptionsOf(
  options: unknown,
): FieldChoiceOptions | undefined {
  if (!Array.isArray(options)) return undefined;
  return options.every((option) => typeof option === 'string')
    ? options
    : undefined;
}
