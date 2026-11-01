/**
 * Cómo entra el stock de un pedido según la conexión de la farmacia con su
 * propio sistema: **la regla única del modo** (FAR-C9, D-7).
 *
 * - **Manual** (el valor por defecto): la farmacia no tiene conexión, la tiene
 *   sin configurar (`connection_id` nulo), desactivada o sin clave. Todas las
 *   líneas entran «por confirmar» y la sucursal las confirma con lo que tiene;
 *   nada se reserva solo. Lo que la sucursal ya marcó «No lo tengo» sigue sin
 *   stock, para que un pedido con todo así responda el 422 de siempre.
 * - **Conectada**: una conexión activa con su clave. Al pedir se consulta en
 *   vivo el stock de esa sucursal: con stock se reserva y con menos de lo
 *   pedido la línea queda sin stock. Un producto sin vínculo con el código de
 *   la farmacia no se puede preguntar: sigue lo que diga el libro de la sede,
 *   como antes de D-7 (reserva si tiene posición; si no, «por confirmar»).
 * - **Si el sistema de la farmacia falla** (no responde o rechaza la clave),
 *   el pedido se trata como manual: el paciente nunca queda bloqueado por la
 *   conexión de una farmacia.
 *
 * Volver al comportamiento anterior a D-7 (reservar lo que el libro de la sede
 * tiene) es que `decideOrderLine` devuelva `LEDGER` en el modo manual; nada más.
 *
 * Sin Nest ni MikroORM: lo usan el alta del pedido y sus pruebas.
 */

/** Los dos modos de una farmacia. */
export type PharmacyStockMode = 'MANUAL' | 'CONNECTED';

/** Tipos de sistema con adaptador (`integrations.external_providers.code`). */
export const PHARMACY_SYSTEM_CODES = [
  'ALOVIDA_STANDARD',
  'SIMULATED_CHAIN',
] as const;
export type PharmacySystemCode = (typeof PHARMACY_SYSTEM_CODES)[number];

export function isPharmacySystemCode(
  value: unknown,
): value is PharmacySystemCode {
  return (
    typeof value === 'string' &&
    (PHARMACY_SYSTEM_CODES as readonly string[]).includes(value)
  );
}

/** Lo que dice una prueba o una llamada al sistema de la farmacia. */
export type ConnectionCheckResult = 'OK' | 'UNREACHABLE' | 'AUTH_REJECTED';

/** Por qué una conexión quedó «con error». */
export type ConnectionErrorReason = Exclude<ConnectionCheckResult, 'OK'>;

/** Lo que la regla del modo necesita saber de la conexión de la farmacia. */
export interface StockModeInput {
  /** `pharmacy_integration_connections.connection_id` no nulo. */
  readonly linked: boolean;
  /** La conexión de integraciones está activa (no pausada). */
  readonly enabled: boolean;
  /** Hay una credencial activa. */
  readonly hasCredential: boolean;
  /** El tipo de sistema tiene adaptador. */
  readonly supportedSystem: boolean;
}

/** **La** regla del modo. */
export function resolveStockMode(
  connection: StockModeInput | null,
): PharmacyStockMode {
  if (
    connection !== null &&
    connection.linked &&
    connection.enabled &&
    connection.hasCredential &&
    connection.supportedSystem
  ) {
    return 'CONNECTED';
  }
  return 'MANUAL';
}

/**
 * De dónde sale el stock de las líneas de un pedido, resuelto antes de abrir
 * la transacción del alta (la consulta en vivo no retiene la transacción).
 */
export type OrderStockSource =
  | { readonly mode: 'MANUAL' }
  | {
      readonly mode: 'CONNECTED';
      /** Unidades en vivo por producto de la plataforma, solo los vinculados. */
      readonly liveQuantities: ReadonlyMap<string, number>;
    };

/** Lo que el libro de la sede dice de un producto. */
export interface SiteLedgerView {
  /** Tiene posición en alguna ubicación activa de la sede. */
  readonly hasPositions: boolean;
  /** Suma de lo disponible en esas posiciones. */
  readonly available: number;
  /** Conteo declarado en el catálogo (`null`/ausente: «hay, sin conteo»). */
  readonly declaredStock?: number | null;
}

/** Cómo entra una línea. */
export type OrderLineDecision =
  | { readonly kind: 'PENDING_CONFIRMATION' }
  /** Lo decide el libro de la sede, como antes de D-7. */
  | { readonly kind: 'LEDGER' }
  | { readonly kind: 'OUT_OF_STOCK' }
  | { readonly kind: 'RESERVE_LIVE'; readonly liveQuantity: number };

/**
 * Cómo entra una línea del pedido.
 *
 * @param source - El modo y, si está conectada, el stock en vivo.
 * @param productId - El producto de la línea.
 * @param requested - Las unidades pedidas.
 * @param ledger - Lo que el libro de la sede dice del producto.
 */
export function decideOrderLine(
  source: OrderStockSource,
  productId: string,
  requested: number,
  ledger: SiteLedgerView,
): OrderLineDecision {
  if (source.mode === 'CONNECTED') {
    const live = source.liveQuantities.get(productId);
    if (live === undefined) return { kind: 'LEDGER' };
    return live >= requested
      ? { kind: 'RESERVE_LIVE', liveQuantity: live }
      : { kind: 'OUT_OF_STOCK' };
  }
  // Manual: «No lo tengo» en la sede (libro con posición y nada disponible) o
  // un catálogo en 0 sin posición siguen sin stock, como en C3; todo lo demás
  // lo confirma la sucursal.
  const markedOut = ledger.hasPositions && ledger.available <= 0;
  const declaredOut = !ledger.hasPositions && ledger.declaredStock === 0;
  if (markedOut || declaredOut) return { kind: 'OUT_OF_STOCK' };
  return { kind: 'PENDING_CONFIRMATION' };
}

/** Cómo se muestra la clave guardada: solo sus últimos 4 caracteres. */
export function maskSecretHint(
  last4: string | null | undefined,
): string | null {
  if (!last4) return null;
  return `••••${last4}`;
}

/** Los últimos 4 caracteres de una clave, para la pista. */
export function lastFour(secret: string): string {
  return secret.slice(-4);
}
