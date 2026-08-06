/**
 * Registro de exclusión mutua **sin espera** por clave.
 *
 * Resuelve un problema muy concreto y muy real: `@Interval` de
 * `@nestjs/schedule` es un `setInterval`, y `setInterval` **no espera** a que
 * termine la ejecución anterior. Si el tick de `outbox-relay` (cada 5 s) tarda
 * 30 s porque la API va lenta, a los 30 s hay seis copias del mismo tick
 * corriendo a la vez sobre las mismas filas. Eso no es "un poco más lento": es
 * procesamiento duplicado, contención de locks y, cuando la lentitud persiste,
 * un crecimiento sin techo de ticks apilados hasta que el proceso muere.
 *
 * La política es **descartar, no encolar**. Un tick periódico que se solapa no
 * aporta trabajo nuevo —el siguiente tick recogerá lo que quedó—, así que
 * encolarlo sólo garantiza que la cola crezca exactamente al ritmo al que el
 * sistema va lento. Descartar convierte una degradación en una pérdida de
 * frecuencia, que es recuperable y medible (`skipped`).
 *
 * Es exclusión **por proceso**, no distribuida: coordina los ticks de un mismo
 * worker. La exclusión entre réplicas la dan los `SKIP LOCKED` / `lockedBy` que
 * los endpoints `/internal/*` ya implementan en la base de datos.
 */

/** Resultado de un intento de ejecución exclusiva. */
export type ExclusiveOutcome<T> =
  { ran: true; result: T } | { ran: false; heldForMs: number };

/** Estado observable de una clave, para la sonda de salud. */
export interface MutexSnapshot {
  key: string;
  /** ms que lleva retenida la clave, o `undefined` si está libre. */
  heldForMs?: number;
  /** Veces que se descartó una ejecución por solapamiento. */
  skipped: number;
}

export class MutexRegistry {
  /** Clave → instante en que se adquirió. Ausente = libre. */
  private readonly held = new Map<string, number>();
  private readonly skips = new Map<string, number>();

  constructor(private readonly now: () => number = () => Date.now()) {}

  /**
   * Ejecuta `fn` si la clave está libre; la descarta si no.
   *
   * El bloqueo se libera en `finally`, también cuando `fn` lanza: una clave que
   * se queda retenida por un error sería un tick que no vuelve a ejecutarse
   * nunca — un fallo silencioso peor que el original.
   */
  async runExclusive<T>(
    key: string,
    fn: () => Promise<T>,
  ): Promise<ExclusiveOutcome<T>> {
    const acquiredAt = this.held.get(key);
    if (acquiredAt !== undefined) {
      this.skips.set(key, (this.skips.get(key) ?? 0) + 1);
      return { ran: false, heldForMs: this.now() - acquiredAt };
    }

    this.held.set(key, this.now());
    try {
      return { ran: true, result: await fn() };
    } finally {
      this.held.delete(key);
    }
  }

  /** `true` si hay una ejecución en vuelo para la clave. */
  isHeld(key: string): boolean {
    return this.held.has(key);
  }

  /** ms que lleva retenida la clave, o `undefined` si está libre. */
  heldForMs(key: string): number | undefined {
    const acquiredAt = this.held.get(key);
    return acquiredAt === undefined ? undefined : this.now() - acquiredAt;
  }

  /** Claves con una ejecución en vuelo desde hace más de `thresholdMs`. */
  stuckKeys(thresholdMs: number): MutexSnapshot[] {
    const stuck: MutexSnapshot[] = [];
    for (const [key, acquiredAt] of this.held) {
      const heldForMs = this.now() - acquiredAt;
      if (heldForMs >= thresholdMs) {
        stuck.push({ key, heldForMs, skipped: this.skips.get(key) ?? 0 });
      }
    }
    return stuck;
  }

  /** Fotografía completa de todas las claves conocidas. */
  snapshot(): MutexSnapshot[] {
    const keys = new Set([...this.held.keys(), ...this.skips.keys()]);
    return [...keys].map((key) => ({
      key,
      heldForMs: this.heldForMs(key),
      skipped: this.skips.get(key) ?? 0,
    }));
  }

  /** Vuelve al estado inicial. Sólo para pruebas. */
  reset(): void {
    this.held.clear();
    this.skips.clear();
  }
}
