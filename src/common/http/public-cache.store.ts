import { Injectable } from '@nestjs/common';

/** Lo que hace falta para responder sin volver a correr el handler. */
export interface CachedRepresentation {
  /** El `ETag` débil ya calculado sobre el cuerpo. */
  readonly etag: string;
  /** El cuerpo serializable, tal cual lo devolvió el handler. */
  readonly body: unknown;
  /** El `Cache-Control` que ya se le mandó al primer cliente. */
  readonly cacheControl: string;
}

interface Entry extends CachedRepresentation {
  readonly expiresAt: number;
}

/**
 * Tope de entradas simultáneas. Un raspador que varía la query string en cada
 * pedido puede generar una clave nueva por request; sin tope, eso es memoria
 * sin límite. 500 alcanza de sobra para el tráfico legítimo de doce pantallas
 * públicas y se bota la más vieja cuando se llena.
 */
const MAX_ENTRIES = 500;

/**
 * Caché de representación en memoria para las lecturas `@Public()` (MCH-028).
 *
 * ## Por qué en memoria y no Redis
 *
 * La representación cacheada es tan efímera como el propio `Cache-Control:
 * max-age` que ya se le promete al cliente (60 o 300 segundos): no hace falta
 * que sobreviva un reinicio ni que se comparta entre instancias para cumplir
 * esa promesa. Si el proceso reinicia, la próxima lectura recalcula — ni
 * peor ni mejor que hoy sin este cambio.
 *
 * ## Por qué `clear()` entero y no invalidación por clave
 *
 * No hay hoy un mapeo confiable entre "qué escritura ocurrió" y "qué lectura
 * pública depende de esos datos" — un post nuevo cambia el feed, el muro del
 * autor y potencialmente el conteo de su ficha. Vaciar todo el store en cada
 * escritura es más caro que invalidar sólo la clave afectada, pero la
 * alternativa (una tabla de dependencias mantenida a mano) es exactamente la
 * clase de refactor amplio que esta ficha no pidió. Sobre-invalidar nunca
 * sirve un dato viejo, que es el único error que le importa a MCH-028-AC02.
 */
@Injectable()
export class PublicCacheStore {
  private readonly entries = new Map<string, Entry>();

  /** La representación cacheada para `key`, o `undefined` si no hay o venció. */
  get(key: string): CachedRepresentation | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry;
  }

  /** Guarda `value` bajo `key`, vigente por `ttlMs` a partir de ahora. */
  set(key: string, value: CachedRepresentation, ttlMs: number): void {
    if (this.entries.size >= MAX_ENTRIES && !this.entries.has(key)) {
      // `Map` conserva el orden de inserción: la primera clave es la más vieja.
      const masVieja = this.entries.keys().next().value;
      if (masVieja !== undefined) this.entries.delete(masVieja);
    }
    this.entries.set(key, { ...value, expiresAt: Date.now() + ttlMs });
  }

  /** Vacía todo lo cacheado. Ver la nota de clase sobre por qué es todo o nada. */
  clear(): void {
    this.entries.clear();
  }

  /** Cuántas representaciones hay cacheadas ahora. Sólo para pruebas/diagnóstico. */
  get size(): number {
    return this.entries.size;
  }
}
