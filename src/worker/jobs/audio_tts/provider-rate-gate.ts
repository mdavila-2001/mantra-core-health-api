/**
 * Espaciador de peticiones al proveedor, por proceso.
 *
 * Complementa al mamparo, no lo repite: el mamparo acota **cuántas** peticiones
 * hay en vuelo a la vez y esto acota **cada cuánto** sale una. Son límites
 * distintos porque el del proveedor es de tasa (peticiones por segundo), y dos
 * peticiones secuenciales rapidísimas no ocupan nunca más de un hueco del
 * mamparo pero sí revientan la tasa.
 *
 * El alcance es local al proceso a propósito: un limitador distribuido necesita
 * un almacén compartido (Redis) y una decisión de diseño propia. Mientras no
 * exista, la cuota se **divide** entre las réplicas declaradas
 * (`AUDIO_TTS_REPLICA_COUNT`), que es la única forma honesta de que escalar el
 * worker no multiplique en silencio la tasa real contra un servicio de pago.
 */
export class ProviderRateGate {
  private nextAllowedAt = 0;
  private readonly intervalMs: number;

  constructor(
    requestsPerSecond: number,
    replicaCount = 1,
    private readonly now: () => number = Date.now,
    private readonly sleep: (ms: number) => Promise<void> = (ms) =>
      new Promise((resolve) => setTimeout(resolve, ms)),
  ) {
    const effective = requestsPerSecond / Math.max(1, replicaCount);
    this.intervalMs = Math.ceil(1000 / Math.max(effective, 0.001));
  }

  /** ms entre peticiones que este proceso se permite. */
  get spacingMs(): number {
    return this.intervalMs;
  }

  /**
   * Espera el turno.
   *
   * La reserva del hueco (`nextAllowedAt`) se hace **antes** de esperar, no
   * después: si se actualizara al despertar, N llamadas concurrentes leerían el
   * mismo instante, calcularían la misma espera y saldrían todas juntas — que es
   * exactamente lo que este objeto existe para evitar.
   */
  async waitTurn(): Promise<void> {
    const now = this.now();
    const waitMs = Math.max(0, this.nextAllowedAt - now);
    this.nextAllowedAt = Math.max(now, this.nextAllowedAt) + this.intervalMs;
    if (waitMs > 0) await this.sleep(waitMs);
  }
}
