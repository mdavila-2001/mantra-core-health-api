/**
 * Categoría de una sede de `directory.branches` (v4.2.92, columna `branch_category`).
 *
 * Sirve para etiquetar las sucursales de cualquier organización (farmacia,
 * laboratorio, imagenología, establecimiento médico) y verlas por oleadas:
 *
 * - `default`: sin clasificar. Es el valor por omisión de la columna y el de
 *   toda fila anterior a v4.2.92 que el backfill no reconoció.
 * - `head_office`: casa matriz. **A lo sumo una por organización**; la base lo
 *   impone con `ux_branches_one_head_office` y el servicio lo adelanta con 409.
 * - `branch`: sucursal.
 *
 * Texto fijo y no concepto de catálogo, como `tenant_medical_facility_sites.site_kind`:
 * son tres valores que el CHECK `ck_branches_branch_category` repite.
 */
export const BRANCH_CATEGORIES = ['default', 'head_office', 'branch'] as const;

/** Una de las tres categorías de sede. */
export type BranchCategory = (typeof BRANCH_CATEGORIES)[number];

/** La categoría que toma una sede cuando nadie la dice. */
export const DEFAULT_BRANCH_CATEGORY: BranchCategory = 'default';

/** Nombre del índice único parcial que impide dos casas matrices en una organización. */
export const ONE_HEAD_OFFICE_INDEX = 'ux_branches_one_head_office';

/**
 * Código de sucursal a partir de su nombre: mayúsculas sin tildes, lo que no es
 * letra o dígito pasa a `-`, 90 caracteres. Si el código ya se usó (en `used`),
 * le agrega `-2`, `-3`… y lo registra.
 *
 * Es la regla de las tres altas que crean sucursales (farmacia, laboratorio e
 * imagenología, establecimiento médico) y la del backfill del parche v4.2.92.
 *
 * @param name - Nombre de la sede.
 * @param used - Códigos ya tomados dentro de la organización; se actualiza.
 * @returns Código único dentro de `used`.
 */
export function branchCodeFromName(name: string, used: Set<string>): string {
  const base =
    name
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 90) || 'SUCURSAL';
  let code = base;
  for (let n = 2; used.has(code); n += 1) code = `${base}-${n}`;
  used.add(code);
  return code;
}
