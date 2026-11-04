import dataset from './data/precios-referencia-laboratorio.json';

/** Source tariff of a suggested lab price. */
export type LabPriceSource = 'INLASA' | 'FONASA';

/** Suggested list price of one lab análisis, copied verbatim from its tariff. */
export interface LabReferencePrice {
  readonly source: LabPriceSource;
  /** Code of the item in the source tariff (e.g. `LAC-030`, `03-01-045`). */
  readonly sourceCode: string;
  readonly sourceName: string;
  /** Exact decimal string in BOB ('60.00'). */
  readonly priceBs: string;
}

interface Equivalence {
  fuente: LabPriceSource;
  codigo: string;
  nombre_fuente: string;
  precio_bs: string;
}

const index = (map: unknown): ReadonlyMap<string, LabReferencePrice> =>
  new Map(
    Object.entries((map ?? {}) as Record<string, Equivalence>).map(
      ([code, e]) => [
        code,
        {
          source: e.fuente,
          sourceCode: e.codigo,
          sourceName: e.nombre_fuente,
          priceBs: e.precio_bs,
        },
      ],
    ),
  );

/** Análisis by catalog code; components by their own, separately reviewed code. */
const BY_CODE = index(dataset.equivalencias);
const BY_COMPONENT = index((dataset as { componentes?: unknown }).componentes);

/** Where the suggested prices come from, for the screen to cite. */
export const LAB_REFERENCE_PRICE_SOURCES = {
  version: dataset.version,
  rule: dataset.regla,
} as const;

/**
 * Suggested price of a catalog análisis (`study_catalog_code`, e.g. `HB`) or of
 * a panel component (`HEMOGRAMA.HB`). A component is priced only from an
 * equivalence reviewed for that component; otherwise it has no suggestion and
 * the lab sets the amount (no price is ever derived).
 */
export function labReferencePrice(code: string): LabReferencePrice | null {
  const own = BY_CODE.get(code);
  if (own) return own;
  const dot = code.lastIndexOf('.');
  if (dot < 0) return null;
  // Never the análisis of the same code: inside a CSF or pleural panel,
  // GLUCOSA or LDH is not the blood test and is not priced like it.
  // A panel-qualified entry wins: LEUCOCITOS is a blood count in HEMOGRAMA but
  // a CSF cell count elsewhere, so only the panel says which test it is.
  return (
    BY_COMPONENT.get(code) ?? BY_COMPONENT.get(code.slice(dot + 1)) ?? null
  );
}
