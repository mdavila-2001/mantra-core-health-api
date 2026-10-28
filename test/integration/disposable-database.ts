/**
 * Preflight del reset destructivo de las pruebas de integración y del smoke.
 *
 * `resetBusinessData()` ejecuta `TRUNCATE ... CASCADE` sobre todos los esquemas
 * de negocio de la base que indiquen `DB_HOST`, `DB_PORT`, `DB_USER`,
 * `DB_PASSWORD` y `DB_NAME`. Un `.env` que apunte a una base compartida
 * borraría los datos de otras personas, así que el reset exige tres cosas que
 * no dependen de que el operador lea un comentario:
 *
 * 1. Una bandera explícita (`ALLOW_DESTRUCTIVE_DB_RESET=yes`).
 * 2. Un host de la máquina local o uno declarado en `TEST_DB_ALLOWED_HOSTS`.
 * 3. Un nombre de base que se declare descartable (`test`, `smoke`, `ci`, `tmp`,
 *    `scratch` o `disposable` como palabra), confirmado después por la
 *    identidad que informa el propio servidor (`current_database()`).
 *
 * Los dos primeros pasos corren antes de abrir la conexión: si fallan, no se
 * envía ningún SQL. El tercero se repite con la respuesta del servidor, porque
 * un proxy o un alias de host pueden entregar una base distinta a la
 * configurada.
 */

/** Variable que autoriza un reset destructivo; sólo vale el literal `yes`. */
export const DESTRUCTIVE_RESET_FLAG = 'ALLOW_DESTRUCTIVE_DB_RESET';

/**
 * Variable que autoriza una prueba que deja historial permanente (`audit.*` es de
 * sólo inserción) en una base cuyo nombre no se declara descartable, como la
 * `mantra_redesa_health` del Postgres efímero de CI. Sólo vale el literal `yes`.
 */
export const PERMANENT_RESIDUE_FLAG = 'ALLOW_PERMANENT_TEST_RESIDUE';

/** Variable con hosts extra (separados por coma) donde se admite el reset. */
export const ALLOWED_HOSTS_VARIABLE = 'TEST_DB_ALLOWED_HOSTS';

/** Hosts que son siempre la máquina local. */
const LOOPBACK_HOSTS: ReadonlySet<string> = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
]);

/** El nombre de la base debe contener una de estas palabras delimitada por `_` o `-`. */
const DISPOSABLE_NAME =
  /(^|[_-])(test|smoke|ci|tmp|scratch|disposable)([_-]|$)/i;

/** Destino del reset tal como lo resuelve el entorno. */
export interface ResetTarget {
  /** Host del servidor PostgreSQL. */
  readonly host: string;
  /** Puerto del servidor PostgreSQL. */
  readonly port: number;
  /** Nombre de la base configurada. */
  readonly database: string;
}

/** Se lanza cuando el destino del reset no se puede probar descartable. */
export class UnsafeResetTargetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafeResetTargetError';
  }
}

/**
 * Resuelve el destino del reset con los mismos defaults que usa el arnés.
 * @param env - Variables de entorno.
 * @returns Host, puerto y base configurados.
 */
export function resolveResetTarget(env: NodeJS.ProcessEnv): ResetTarget {
  return {
    host: env.DB_HOST ?? 'localhost',
    port: Number(env.DB_PORT ?? 5434),
    database: env.DB_NAME ?? 'mantra_redesa_health',
  };
}

/**
 * Indica si el nombre de una base se declara descartable.
 * @param database - Nombre de la base.
 * @returns `true` si contiene una palabra marcadora de base de pruebas.
 */
export function isDisposableDatabaseName(database: string): boolean {
  return DISPOSABLE_NAME.test(database);
}

function allowedHosts(env: NodeJS.ProcessEnv): Set<string> {
  const extra = (env[ALLOWED_HOSTS_VARIABLE] ?? '')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter((host) => host.length > 0);
  return new Set([...LOOPBACK_HOSTS, ...extra]);
}

/**
 * Preflight previo a la conexión: bandera, host y nombre de base.
 * No envía SQL; el mensaje nunca incluye credenciales.
 * @param target - Destino configurado.
 * @param env - Variables de entorno.
 * @throws UnsafeResetTargetError si falta la bandera o el destino no es descartable.
 */
export function assertDisposableResetTarget(
  target: ResetTarget,
  env: NodeJS.ProcessEnv,
): void {
  if (env[DESTRUCTIVE_RESET_FLAG] !== 'yes') {
    throw new UnsafeResetTargetError(
      `Reset destructivo rechazado: falta ${DESTRUCTIVE_RESET_FLAG}=yes. ` +
        'El reset vacía todos los esquemas de negocio de la base indicada.',
    );
  }
  if (!allowedHosts(env).has(target.host.toLowerCase())) {
    throw new UnsafeResetTargetError(
      `Reset destructivo rechazado: el host "${target.host}" no es local ni ` +
        `figura en ${ALLOWED_HOSTS_VARIABLE}.`,
    );
  }
  if (!isDisposableDatabaseName(target.database)) {
    throw new UnsafeResetTargetError(
      `Reset destructivo rechazado: la base "${target.database}" no se ` +
        'declara descartable (el nombre debe contener test, smoke, ci, tmp, ' +
        'scratch o disposable como palabra).',
    );
  }
}

/**
 * Confirma la identidad que informa el servidor tras conectar y antes de borrar.
 * @param serverDatabase - Resultado de `select current_database()`.
 * @param target - Destino configurado.
 * @throws UnsafeResetTargetError si el servidor entregó otra base o una no descartable.
 */
export function assertServerIdentity(
  serverDatabase: string,
  target: ResetTarget,
): void {
  if (
    serverDatabase !== target.database ||
    !isDisposableDatabaseName(serverDatabase)
  ) {
    throw new UnsafeResetTargetError(
      `Reset destructivo rechazado: el servidor informa la base ` +
        `"${serverDatabase}", distinta de la configurada o no descartable.`,
    );
  }
}

/**
 * Preflight de una prueba que escribe historial que no se puede borrar.
 *
 * No trunca nada, pero cada corrida deja filas sintéticas en tablas de sólo
 * inserción (`audit.invoices_history`, `audit.insurance_claims_history`) y en
 * `insurance.claim_appeal_decisions` (inmutable por trigger): en una base
 * compartida esas filas quedan para siempre y aparecen en los listados de quien
 * la use. Exige un host local (o declarado en `TEST_DB_ALLOWED_HOSTS`) y que la
 * base se declare descartable por su nombre, o por `ALLOW_PERMANENT_TEST_RESIDUE=yes`
 * cuando el operador sabe que lo es aunque el nombre no lo diga. No envía SQL; el
 * mensaje nunca incluye credenciales.
 *
 * @param target - Destino configurado.
 * @param env - Variables de entorno.
 * @throws UnsafeResetTargetError si el destino no se prueba descartable.
 */
export function assertPermanentResidueTarget(
  target: ResetTarget,
  env: NodeJS.ProcessEnv,
): void {
  if (!allowedHosts(env).has(target.host.toLowerCase())) {
    throw new UnsafeResetTargetError(
      `Prueba con residuo permanente rechazada: el host "${target.host}" no es ` +
        `local ni figura en ${ALLOWED_HOSTS_VARIABLE}.`,
    );
  }
  if (
    !isDisposableDatabaseName(target.database) &&
    env[PERMANENT_RESIDUE_FLAG] !== 'yes'
  ) {
    throw new UnsafeResetTargetError(
      `Prueba con residuo permanente rechazada: la base "${target.database}" no ` +
        'se declara descartable. Deja historial de sólo inserción que no se ' +
        'puede borrar; usá una base desechable (el nombre debe contener test, ' +
        `smoke, ci, tmp, scratch o disposable como palabra) o, si lo es aunque ` +
        `el nombre no lo diga, ${PERMANENT_RESIDUE_FLAG}=yes.`,
    );
  }
}
