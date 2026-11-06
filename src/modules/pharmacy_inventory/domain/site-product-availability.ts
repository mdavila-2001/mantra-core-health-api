import { PHARM } from '../../pharmacy/pharmacy.concepts';
import { PINV } from './pharmacy_inventory.concepts';

/**
 * Qué productos tiene **disponibles** cada sede de farmacia: la regla única.
 *
 * Hay dos fuentes de existencias y no compiten: cada par (sede, producto) usa
 * una.
 *
 * 1. **Inventario por lotes** (`pharmacy_inventory.inventory_stock_positions`):
 *    si el producto tiene al menos una posición en alguna ubicación activa de
 *    la sede, **manda el libro**: está disponible si la suma de su
 *    `available_quantity` en esas ubicaciones es mayor que cero.
 * 2. **Existencia declarada en el catálogo** (P47:
 *    `pharmacy_products.stock_quantity`): si el producto no tiene posición en
 *    la sede, vale lo que la farmacia declaró en «Inventario»: disponible si no
 *    tiene conteo (`NULL`, «hay / no hay») o si el conteo es mayor que cero.
 *
 * La decisión es por producto y no por sede: que la sede lleve lotes de unos
 * productos no apaga los demás. Antes bastaba una posición para pasar la sede
 * entera al libro, y un producto publicado después no aparecía en ella hasta
 * que alguien le escribiera una posición. D-06-3 resolvía eso al revés
 * —completando posiciones para todos los productos de la sede—; esta regla
 * por producto lo reemplazó y dejó de inicializar desde el catálogo, porque
 * `stock_quantity` es de toda la farmacia y se copiaba a cada sede.
 *
 * Lo que se ofrece por lo declarado no tiene unidades en el libro: un pedido
 * lo recibe «por confirmar», sin reservar, y la farmacia dice al confirmarlo
 * si lo tiene y con cuánto (`application/pharmacy-orders/pending-order-lines.ts`).
 *
 * Siempre, en las dos: lo que la farmacia marcó «no tengo»
 * (`out_of_stock_declared`) **no** está disponible aunque el libro diga otra
 * cosa, y sólo cuentan productos publicados (`PHARM_PRODUCT_ACTIVE`: un
 * borrador o un retirado no se ofrecen) de sedes activas.
 *
 * ## Por qué un fragmento SQL y no una función
 *
 * Tres lecturas filtran y ordenan con esto en la base (la receta entre
 * sucursales de P37, la disponibilidad por sede del buscador de productos y el
 * catálogo público de P31); traer todo a memoria para decidir en TypeScript
 * sería traer el catálogo entero. Por eso la regla vive **una sola vez**, acá,
 * como tabla derivada, y cada lectura la acota con su propio `WHERE` sobre las
 * columnas que expone (Postgres empuja esos predicados adentro).
 *
 * Decisión registrada (26/10/2026, cierre de P37/P34/P47, defecto A1 de la
 * prueba visual): antes la receta y el buscador sólo leían el libro, y una
 * farmacia dada de alta por el portal —que declara existencias pero no lleva
 * lotes— aparecía sin nada aunque su catálogo dijera «hay».
 */
export interface SiteProductAvailabilitySql {
  /**
   * `SELECT` con una fila por (sede, producto) **disponible**. Columnas:
   * `site_id`, `pharmacy_id`, `product_id`, `available_quantity` (numérico, o
   * `NULL` si el producto no tiene posición en la sede y se declaró sin
   * conteo) y
   * `source` (`'LEDGER'` o `'DECLARED'`).
   */
  readonly sql: string;
  /** Los parámetros posicionales del fragmento, en orden. */
  readonly params: readonly unknown[];
}

/**
 * El fragmento de la regla, para usar como tabla derivada:
 * `FROM (${a.sql}) av WHERE av.site_id IN (…)`, con `...a.params` delante de
 * los parámetros propios de la consulta.
 */
export function siteProductAvailabilitySql(): SiteProductAvailabilitySql {
  return {
    sql: `SELECT site.id          AS site_id,
                 site.pharmacy_id AS pharmacy_id,
                 prod.id          AS product_id,
                 COALESCE(lots.available, prod.stock_quantity) AS available_quantity,
                 CASE WHEN lots.available IS NOT NULL THEN 'LEDGER'
                      ELSE 'DECLARED'
                 END              AS source
            FROM pharmacy.pharmacy_sites site
            JOIN pharmacy.pharmacy_products prod
              ON prod.pharmacy_id = site.pharmacy_id
             AND prod.status_concept_id = ?
             AND prod.out_of_stock_declared IS NOT TRUE
       LEFT JOIN LATERAL (
                   SELECT SUM(st.available_quantity) AS available
                     FROM pharmacy_inventory.inventory_locations loc
                     JOIN pharmacy_inventory.inventory_stock_positions st
                       ON st.inventory_location_id = loc.id
                      AND st.pharmacy_product_id = prod.id
                    WHERE loc.pharmacy_site_id = site.id
                      AND loc.status_concept_id = ?
                 ) lots ON true
           WHERE site.status_concept_id = ?
             AND CASE WHEN lots.available IS NOT NULL THEN lots.available > 0
                      ELSE prod.stock_quantity IS NULL OR prod.stock_quantity > 0
                 END`,
    params: [PHARM.PRODUCT_ACTIVE, PINV.LOCATION_ACTIVE, PHARM.SITE_ACTIVE],
  };
}
