import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * ¿Está encendido el aislamiento por fila (RLS)? Misma bandera que lee
 * `TenantContextInterceptor`.
 *
 * @param env - Variables de entorno.
 * @returns `true` con `RLS_ENFORCE=true`.
 */
export function isRowLevelSecurityEnforced(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.RLS_ENFORCE === 'true';
}

/** Valores de contexto de una transacción, para devolverlos tal cual al terminar. */
interface SavedContext {
  readonly system: string;
  readonly tenant: string;
}

async function saveContext(tx: EntityManager): Promise<SavedContext> {
  const rows = await tx.execute<{ sc: string | null; tid: string | null }[]>(
    "select current_setting('app.system_context', true) as sc, current_setting('app.current_tenant_id', true) as tid",
  );
  return { system: rows[0]?.sc ?? 'false', tenant: rows[0]?.tid ?? '' };
}

async function restoreContext(
  tx: EntityManager,
  saved: SavedContext,
): Promise<void> {
  try {
    await tx.execute("select set_config('app.system_context', ?, true)", [
      saved.system,
    ]);
    await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
      saved.tenant,
    ]);
  } catch {
    // La transacción ya está abortada: el rollback descarta el contexto.
  }
}

/**
 * Lectura de la AUTORIDAD de una persona en el límite de autenticación (login y
 * renovación de sesión): sus membresías, las políticas de sesión y las reglas de
 * red de las organizaciones donde tiene membresía activa, y sus roles. Quien
 * autentica todavía no tiene organización activa: con RLS encendido y el rol
 * `mantra_app` esas tablas no devuelven ninguna fila y el token saldría sin
 * organizaciones.
 *
 * Abre el contexto de sistema SOLO mientras dura `read` y lo devuelve como
 * estaba en un `finally` (también si `read` lanza). Es un permiso para leer,
 * no para escribir: `read` debe filtrar por la persona que se autentica
 * (`user_id`) o por las organizaciones que esa lectura ya devolvió.
 *
 * - Sin RLS no hace nada: `read` corre con el `em` recibido, sin transacción
 *   nueva ni cambios de contexto.
 * - Con RLS y un `em` sin transacción (un fork de lectura), abre una
 *   transacción propia: `set_config(..., true)` vale solo dentro de ella.
 * - Con RLS y un `em` que ya es una transacción, fija el contexto en ella y lo
 *   restaura al terminar.
 *
 * @param em - Contexto de persistencia o transacción activa.
 * @param read - Lectura acotada; debe usar el `EntityManager` que recibe.
 * @returns Lo que devuelva `read`.
 */
export async function withSystemRead<T>(
  em: EntityManager,
  read: (db: EntityManager) => Promise<T>,
): Promise<T> {
  if (!isRowLevelSecurityEnforced()) return read(em);
  const inContext = async (tx: EntityManager): Promise<T> => {
    const saved = await saveContext(tx);
    await tx.execute("select set_config('app.system_context', 'true', true)");
    try {
      return await read(tx);
    } finally {
      await restoreContext(tx, saved);
    }
  };
  return em.isInTransaction() ? inContext(em) : em.transactional(inContext);
}

/**
 * ESCRITURA acotada de una fila que no pertenece a ninguna organización y que
 * se escribe en el límite de autenticación, donde no hay organización activa:
 * hoy solo el bloqueo de cuenta (`iam.account_lockouts`, `tenant_id` nulo). Con
 * RLS encendido y el rol `mantra_app`, la política exige `tenant_id` igual al
 * del contexto o contexto de sistema, y un `tenant_id` nulo no cumple ninguna:
 * el INSERT lanzaba y revertía con él el evento de fallo del login.
 *
 * Es deliberadamente más estrecha que {@link withSystemRead}:
 * - vuelca (`flush`) lo que haya pendiente ANTES de abrir el contexto, así que
 *   el permiso solo cubre lo que `write` registra;
 * - vuelca lo que `write` registró ANTES de cerrarlo (el INSERT/UPDATE corre
 *   con el contexto abierto, no en el commit posterior);
 * - lo devuelve como estaba en un `finally`, también si `write` lanza;
 * - exige una transacción: la escritura es atómica con la del llamador, no abre
 *   una propia que se confirmaría aparte.
 *
 * `write` debe tocar UNA fila (o las de UNA persona) y filtrar por la persona
 * que se autentica; no es un permiso para escrituras generales. Sin RLS no hace
 * más que volcar y llamar a `write`.
 *
 * @param em - Transacción activa del llamador.
 * @param write - Escritura acotada; debe usar el `EntityManager` que recibe.
 * @returns Lo que devuelva `write`.
 * @throws Error si `em` no está en una transacción.
 */
export async function withSystemWrite<T>(
  em: EntityManager,
  write: (db: EntityManager) => Promise<T>,
): Promise<T> {
  if (!em.isInTransaction()) {
    throw new Error(
      'withSystemWrite exige una transacción abierta: la escritura debe ser atómica con la del llamador',
    );
  }
  // Lo pendiente del llamador se escribe con SU contexto, no con el de sistema.
  await em.flush();
  if (!isRowLevelSecurityEnforced()) {
    const result = await write(em);
    await em.flush();
    return result;
  }
  const saved = await saveContext(em);
  await em.execute("select set_config('app.system_context', 'true', true)");
  try {
    const result = await write(em);
    await em.flush();
    return result;
  } finally {
    await restoreContext(em, saved);
  }
}
