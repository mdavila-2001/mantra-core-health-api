import { deterministicId } from '../constants/concepts';

/** Definición mínima de un concepto sembrable (código FHIR + display legible). */
export interface ConceptSeed {
  /**
   * Valor de key mantenido por la instancia.
   */
  key: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de display mantenido por la instancia.
   */
  display: string;
}

/** Forma de la definición por módulo: nombre lógico -> código + display. */
export type ConceptDefinitions = Record<
  string,
  {
    /**
     * Valor de code mantenido por la instancia.
     */
    code: string; /**
     * Valor de display mantenido por la instancia.
     */
    display: string;
  }
>;

/**
 * Declara los conceptos de un módulo y devuelve, en un solo paso:
 *  - `seeds`: la lista sembrable (para el agregador que consume el seed);
 *  - `ids`: el mapa `nombre -> UUID` determinista que consumen los servicios.
 *
 * Cada módulo llama a esta función en su archivo `<modulo>.concepts.ts`, de modo
 * que puede añadir conceptos sin tocar ningún archivo compartido (evita conflictos
 * cuando varios módulos se implementan en paralelo). El agregador central
 * `module-concepts.ts` reúne los `seeds` de todos los módulos ya integrados.
 *
 * El prefijo espacia las claves por módulo para que dos módulos puedan tener un
 * concepto "ACTIVE" sin colisionar en el UUID derivado.
 */
export function defineModuleConcepts<T extends ConceptDefinitions>(
  prefix: string,
  defs: T,
): {
  /**
   * Valor de seeds mantenido por la instancia.
   */
  seeds: ConceptSeed[]; /**
   * Valor de ids mantenido por la instancia.
   */
  ids: Record<keyof T, string>;
} {
  const seeds: ConceptSeed[] = [];
  const ids = {} as Record<keyof T, string>;
  for (const name of Object.keys(defs) as (keyof T)[]) {
    const key = `${prefix}:${String(name)}`;
    seeds.push({ key, code: defs[name].code, display: defs[name].display });
    ids[name] = deterministicId(key);
  }
  return { seeds, ids };
}
