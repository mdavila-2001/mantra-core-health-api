/**
 * Qué conexión de stock manda en cada sede (H-05, regla de Itzan para C9-5).
 *
 * Una conexión de farmacia puede ser de toda la farmacia (`pharmacySiteId`
 * nulo) o de una sede. La regla:
 *
 * - **Una general y una de sucursal coexisten, y gana la sucursal** en esa
 *   sede. La general sigue mandando en las demás.
 * - **Dos conexiones del mismo nivel y alcance** (dos generales, o dos de la
 *   misma sucursal) **se rechazan al configurar**. Si aun así hubiera
 *   duplicados (datos anteriores a la regla), nunca se elige «la más nueva» o
 *   «la primera»: la sincronización responde 409 y el pedido no usa stock
 *   externo.
 * - **La sincronización general excluye las sucursales con conexión propia**:
 *   no pisa lo que escribe la conexión de la sucursal.
 *
 * La precedencia entre *sistemas* es otra cosa y no cambia: dentro de una
 * conexión, su sistema propio gana y, si no tiene, se usa el del servidor
 * (`ExternalPharmacySystemPort.resolve`).
 */

/** Lo que importa de una conexión para saber qué sedes cubre. */
export interface CoverageConnection {
  readonly id: string;
  /** Nulo = toda la farmacia. */
  readonly pharmacySiteId: string | null;
  /** Activa y con consulta de stock: la única que escribe stock. */
  readonly writesStock: boolean;
}

/**
 * Las otras conexiones de stock del **mismo nivel y alcance** que `current`
 * (ambas generales, o ambas de la misma sucursal).
 *
 * @param current - La conexión que se sincroniza o se quiere configurar.
 * @param others - Todas las conexiones de la farmacia (puede incluir `current`).
 * @returns Los ids duplicados, en el orden recibido; vacío si no hay.
 */
export function duplicateScopeStockConnections(
  current: Pick<CoverageConnection, 'id' | 'pharmacySiteId'>,
  others: readonly CoverageConnection[],
): string[] {
  return others
    .filter(
      (other) =>
        other.id !== current.id &&
        other.writesStock &&
        other.pharmacySiteId === current.pharmacySiteId,
    )
    .map((other) => other.id);
}

/**
 * Las sedes que una conexión **general** debe dejar fuera de su
 * sincronización porque tienen una conexión de sucursal propia que escribe
 * stock. Una conexión de sucursal no excluye nada.
 *
 * @param current - La conexión que se sincroniza.
 * @param others - Todas las conexiones de la farmacia (puede incluir `current`).
 * @returns Los ids de sede excluidos.
 */
export function siteIdsWithOwnStockConnection(
  current: Pick<CoverageConnection, 'id' | 'pharmacySiteId'>,
  others: readonly CoverageConnection[],
): Set<string> {
  const owned = new Set<string>();
  if (current.pharmacySiteId !== null) return owned;
  for (const other of others) {
    if (other.id !== current.id && other.writesStock && other.pharmacySiteId) {
      owned.add(other.pharmacySiteId);
    }
  }
  return owned;
}

/** Qué conexión de stock manda en una sede. */
export type StockConnectionForSite =
  | { readonly status: 'NONE' }
  | { readonly status: 'ONE'; readonly id: string }
  | { readonly status: 'DUPLICATE'; readonly ids: readonly string[] };

/**
 * La conexión de stock que manda en una sede: la de la sucursal si existe y,
 * si no, la general. Si el nivel ganador tiene más de una, es `DUPLICATE`.
 *
 * @param siteId - La sede.
 * @param connections - Todas las conexiones de la farmacia.
 */
export function stockConnectionForSite(
  siteId: string,
  connections: readonly CoverageConnection[],
): StockConnectionForSite {
  const writers = connections.filter((c) => c.writesStock);
  const branch = writers.filter((c) => c.pharmacySiteId === siteId);
  const winners =
    branch.length > 0 ? branch : writers.filter((c) => !c.pharmacySiteId);
  if (winners.length === 0) return { status: 'NONE' };
  if (winners.length > 1) {
    return { status: 'DUPLICATE', ids: winners.map((c) => c.id) };
  }
  return { status: 'ONE', id: winners[0].id };
}
