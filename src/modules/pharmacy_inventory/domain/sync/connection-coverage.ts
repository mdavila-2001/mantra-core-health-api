/**
 * Qué conexión de stock manda en cada sede (H-05).
 *
 * Una conexión de farmacia puede ser de toda la farmacia (`pharmacySiteId`
 * nulo) o de una sede. Si a una misma sede le aplican dos conexiones activas
 * que consultan stock, cada sincronización pisaría lo que escribió la otra, y
 * elegir una «la más nueva» o «la primera» sería una decisión silenciosa sobre
 * el stock que ven los pacientes. Por eso es un error explícito: la farmacia
 * deja una sola.
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
 * Las otras conexiones que escribirían stock en alguna de las sedes que va a
 * sincronizar `current`.
 *
 * @param current - La conexión que se sincroniza.
 * @param syncedSiteIds - Las sedes activas que esa sincronización va a escribir.
 * @param others - Todas las conexiones de la farmacia (puede incluir `current`).
 * @returns Los ids de las conexiones en conflicto, en el orden recibido; vacío si no hay.
 */
export function conflictingStockConnections(
  current: Pick<CoverageConnection, 'id'>,
  syncedSiteIds: readonly string[],
  others: readonly CoverageConnection[],
): string[] {
  return others
    .filter(
      (other) =>
        other.id !== current.id &&
        other.writesStock &&
        syncedSiteIds.some(
          (siteId) =>
            other.pharmacySiteId === null || other.pharmacySiteId === siteId,
        ),
    )
    .map((other) => other.id);
}
