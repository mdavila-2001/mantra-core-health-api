// =============================================================================
// HttpClient con un tope de pedidos por segundo POR INSTANCIA (una instancia =
// un host). Agrega sólo un portón de salida delante de `HttpClient.get`; los
// reintentos con backoff, la caché en disco y el límite de concurrencia son los
// del cliente compartido (`lib/glossary-es/common.mjs`, sin tocar).
//
// Existe porque la corrida de 2026-10-27 comparte la salida de red con otros
// carriles y la consigna fija ≤ 2 pedidos/s por host.
// =============================================================================

import { HttpClient, sleep } from '../../lib/glossary-es/common.mjs';

export class PoliteHttpClient extends HttpClient {
  #gap;
  #nextAt = 0;

  /** @param {{ rps?: number } & ConstructorParameters<typeof HttpClient>[0]} o */
  constructor({ rps = 2, ...rest } = {}) {
    super({ ...rest, minDelayMs: 0 });
    this.#gap = Math.ceil(1000 / rps);
  }

  async get(url, opts) {
    const now = Date.now();
    const at = Math.max(now, this.#nextAt);
    this.#nextAt = at + this.#gap;
    if (at > now) await sleep(at - now);
    return super.get(url, opts);
  }
}
