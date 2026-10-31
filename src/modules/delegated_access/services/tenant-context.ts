import type { EntityManager } from '@mikro-orm/postgresql';

/**
 * Fija, para la transacción en curso, la organización con la que corren las
 * políticas de aislamiento por fila (RLS). Las rutas sin tenant activo (la
 * persona de apoyo pide a una organización o canjea un código) lo conocen recién
 * al resolver su objetivo; sin esto, con RLS encendido sus escrituras verían
 * cero filas.
 *
 * @param tx - Transacción activa.
 * @param tenantId - Organización ya resuelta y verificada.
 */
export async function applyTenantContext(
  tx: EntityManager,
  tenantId: string,
): Promise<void> {
  await tx.execute("select set_config('app.system_context', 'false', true)");
  await tx.execute("select set_config('app.current_tenant_id', ?, true)", [
    tenantId,
  ]);
}

/**
 * Abre un contexto de sistema ACOTADO a la transacción en curso, solo para una
 * lectura que no puede conocer el tenant de antemano (buscar una invitación por
 * el hash de su código). Quien la llama debe volver a un tenant concreto con
 * {@link applyTenantContext} en cuanto lo conozca.
 *
 * @param tx - Transacción activa.
 */
export async function openSystemLookup(tx: EntityManager): Promise<void> {
  await tx.execute("select set_config('app.system_context', 'true', true)");
}

/**
 * ¿Está encendido el aislamiento por fila (RLS)? Misma bandera que lee
 * `TenantContextInterceptor`: una sola fuente para que una ruta sin tenant
 * activo no decida distinto que el interceptor.
 *
 * @param env - Variables de entorno.
 * @returns `true` con `RLS_ENFORCE=true`.
 */
export function isRlsEnforced(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return env.RLS_ENFORCE === 'true';
}

/**
 * Deja la transacción SIN organización ni contexto de sistema: con RLS las
 * políticas fallan cerradas (ninguna fila) hasta que se entre a una organización
 * concreta. Se usa al abrir y al cerrar cada lectura acotada.
 *
 * @param tx - Transacción activa.
 */
export async function clearTenantContext(tx: EntityManager): Promise<void> {
  await tx.execute("select set_config('app.system_context', 'false', true)");
  await tx.execute("select set_config('app.current_tenant_id', '', true)");
}

/**
 * ¿Existe la organización? Sellar un rechazo en la bitácora de una organización
 * inventada viola la clave foránea del asiento (y el 422 que sale delata qué ids
 * existen): quien rechaza solo sella donde hay una organización a la que sellar.
 *
 * @param tx - Transacción activa.
 * @param tenantId - Organización que indicó quien llama.
 * @returns `true` si la organización existe.
 */
export async function tenantExists(
  tx: EntityManager,
  tenantId: string,
): Promise<boolean> {
  const rows = await tx.execute<{ id: string }[]>(
    'select id from directory.tenants where id = ? limit 1',
    [tenantId],
  );
  return rows.length > 0;
}

/**
 * Cómo lee una persona (ruta `@TenantAgnostic` `me/*`) sin que el contexto de
 * sistema se abra para todas las organizaciones.
 */
export interface PersonScope {
  /**
   * Lee filas **de la propia persona** (sus membresías, vínculos y solicitudes),
   * cuya organización todavía no se conoce. Abre el contexto de sistema solo
   * mientras dura `read`, y `read` debe filtrar por su usuario o por ids que ya
   * son suyos: es el único punto donde el contexto de sistema se enciende.
   *
   * @param read - Lectura acotada a la persona.
   */
  ownRows<T>(read: () => Promise<T>): Promise<T>;
  /**
   * Entra a UNA organización —ya verificada: tiene vínculo vivo en ella— mientras
   * dura `read`; las políticas RLS acotan cada consulta a esa organización.
   *
   * @param tenantId - Organización con vínculo vivo.
   * @param read - Lectura de esa organización.
   */
  inTenant<T>(tenantId: string, read: () => Promise<T>): Promise<T>;
  /**
   * Lectura que por diseño cruza organizaciones (filas sin `tenant_id` anclado)
   * pero está acotada por las llaves que ya salieron de organizaciones
   * verificadas (p. ej. los perfiles públicos de los doctores que la persona
   * atiende). Abre el contexto de sistema solo mientras dura `read`.
   *
   * @param read - Lectura cuyo SQL ya filtra por esas llaves.
   */
  keyed<T>(read: () => Promise<T>): Promise<T>;
}

/** Sin RLS no hay nada que fijar: el alcance lo dan los filtros de cada consulta. */
const PASSTHROUGH: PersonScope = {
  ownRows: (read) => read(),
  inTenant: (_tenantId, read) => read(),
  keyed: (read) => read(),
};

/** Apaga el contexto de sistema aunque la lectura haya fallado dentro de la transacción. */
async function closeContext(tx: EntityManager): Promise<void> {
  try {
    await clearTenantContext(tx);
  } catch {
    // La transacción ya está abortada: el rollback descarta el contexto.
  }
}

/**
 * Abre el alcance de lectura de una persona sobre rutas `me/*` (sin tenant
 * activo). Con RLS encendido corre `work` dentro de UNA transacción, sin contexto
 * de organización, y le da un {@link PersonScope} para entrar a cada
 * organización con vínculo vivo por separado; sin RLS pasa un fork y los filtros
 * de cada consulta bastan. Nunca abre el contexto de sistema para todos los
 * tenants: cada lectura es de la propia persona (`ownRows`), de una organización
 * (`inTenant`) o está acotada por llaves ya verificadas (`keyed`).
 *
 * @param em - Contexto de persistencia.
 * @param work - Lectura o escritura; debe usar la transacción que recibe, no otro fork.
 * @param options - `transactional`: abre una transacción aunque no haya RLS
 *   (una escritura la necesita siempre; una lectura, solo con RLS).
 * @returns Lo que devuelva `work`.
 */
export async function withPersonScope<T>(
  em: EntityManager,
  work: (tx: EntityManager, scope: PersonScope) => Promise<T>,
  options: { readonly transactional?: boolean } = {},
): Promise<T> {
  if (!isRlsEnforced()) {
    if (options.transactional) {
      return em.transactional((tx) => work(tx, PASSTHROUGH));
    }
    return work(em.fork(), PASSTHROUGH);
  }
  return em.transactional(async (tx) => {
    await clearTenantContext(tx);
    const scope: PersonScope = {
      ownRows: async (read) => {
        await openSystemLookup(tx);
        try {
          return await read();
        } finally {
          await closeContext(tx);
        }
      },
      inTenant: async (tenantId, read) => {
        await applyTenantContext(tx, tenantId);
        try {
          return await read();
        } finally {
          await closeContext(tx);
        }
      },
      keyed: async (read) => {
        await openSystemLookup(tx);
        try {
          return await read();
        } finally {
          await closeContext(tx);
        }
      },
    };
    return work(tx, scope);
  });
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
 * Entra a una organización VERIFICADA durante `work` y devuelve el contexto que
 * había. Es para el servicio que corre dentro de una petición con su propia
 * organización (un paciente que escribe) y necesita tocar una fila de otra (la
 * asignación de la bandeja del doctor): sin RLS no hace nada; con RLS, la
 * escritura queda acotada a esa organización y la petición no pierde la suya.
 *
 * @param tx - Transacción activa.
 * @param tenantId - Organización ya resuelta y verificada.
 * @param work - Lectura o escritura de esa organización.
 * @returns Lo que devuelva `work`.
 */
export async function withTenantContext<T>(
  tx: EntityManager,
  tenantId: string,
  work: () => Promise<T>,
): Promise<T> {
  if (!isRlsEnforced()) return work();
  const saved = await saveContext(tx);
  await applyTenantContext(tx, tenantId);
  try {
    return await work();
  } finally {
    await restoreContext(tx, saved);
  }
}

/**
 * Abre el contexto de sistema durante `work` y devuelve el que había. Solo para
 * una lectura acotada por una llave que ya se verificó (la conversación en la
 * que quien escribe participa): no es un permiso para leer por organización.
 *
 * @param tx - Transacción activa.
 * @param work - Lectura filtrada por esa llave.
 * @returns Lo que devuelva `work`.
 */
export async function withSystemKey<T>(
  tx: EntityManager,
  work: () => Promise<T>,
): Promise<T> {
  if (!isRlsEnforced()) return work();
  const saved = await saveContext(tx);
  await openSystemLookup(tx);
  try {
    return await work();
  } finally {
    await restoreContext(tx, saved);
  }
}
