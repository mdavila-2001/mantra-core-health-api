/** Tamaño del pool cuando `DB_POOL_MAX` no está definida (ver `orm.env.ts`). */
export const DEFAULT_DB_POOL_MAX = 10;

/**
 * Cuántos despachos por la pasarela pueden estar a la vez DENTRO de una
 * transacción de petición (`RLS_ENFORCE=true`).
 *
 * Con RLS el `TenantContextInterceptor` retiene UNA conexión durante toda la
 * petición y cada despacho necesita OTRA (la compuerta y la asociación se
 * confirman por su cuenta). Si `DB_POOL_MAX` peticiones de cobro entran a la vez,
 * cada una retiene una conexión y espera otra: espera circular, y como `pg` espera
 * sin límite se cuelga todo acceso a la base. Con a lo sumo `ceil(max / 2) - 1`
 * despachos simultáneos —estrictamente menos de la mitad del pool— siempre queda
 * al menos una conexión libre para que alguno avance, aun con el resto del tráfico
 * ocupando conexiones que sí se liberan.
 */
export function dispatchConcurrencyLimit(poolMax: number): number {
  const max =
    Number.isFinite(poolMax) && poolMax >= 1
      ? Math.trunc(poolMax)
      : DEFAULT_DB_POOL_MAX;
  return Math.max(1, Math.ceil(max / 2) - 1);
}

/** Lee `DB_POOL_MAX` del entorno (o el valor por defecto del pool). */
export function readPoolMax(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.DB_POOL_MAX;
  const parsed = raw === undefined || raw.trim() === '' ? NaN : Number(raw);
  return Number.isFinite(parsed) ? parsed : DEFAULT_DB_POOL_MAX;
}

/**
 * Semáforo SIN cola: si no hay cupo, `tryAcquire` devuelve `undefined` al instante.
 * Hacer esperar a las peticiones excedentes sería peor que rechazarlas: cada una
 * retiene la conexión del interceptor mientras espera y reproduciría la espera
 * circular que este límite evita.
 */
export class DispatchSlots {
  private inUse = 0;

  constructor(readonly limit: number) {}

  /** Cupos ocupados ahora. */
  get busy(): number {
    return this.inUse;
  }

  /** Toma un cupo; devuelve la función que lo libera (idempotente), o `undefined` si no hay. */
  tryAcquire(): (() => void) | undefined {
    if (this.inUse >= this.limit) return undefined;
    this.inUse += 1;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.inUse -= 1;
    };
  }
}
