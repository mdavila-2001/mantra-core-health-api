/**
 * MCH-013 · hace visible el fallback silencioso al rol propietario.
 *
 * `DB_APP_USER` es opcional: sin él, `buildOrmConfig` conecta con el rol
 * propietario de la base (`DB_USER`), que por definición tiene `BYPASSRLS` o
 * es superusuario. Eso es correcto para migraciones y el seed, pero si además
 * `RLS_ENFORCE=true` el operador está afirmando un aislamiento que ese rol no
 * respeta — la misma comprobación que hace `AppReadinessService` en caliente,
 * acá se advierte en el arranque, antes de que exista un logger de Nest.
 *
 * No cambia a qué rol se conecta: sólo dice, cuando corresponde, que la
 * combinación es contradictoria. `warn` es inyectable para no escribir a
 * stderr en cada test.
 */
export function warnIfRlsRoleFallbackIsUnsafe(
  env: { DB_APP_USER?: string; RLS_ENFORCE?: string },
  warn: (message: string) => void = (m) => process.stderr.write(m + '\n'),
): void {
  if (env.DB_APP_USER) return;
  if (env.RLS_ENFORCE !== 'true') return;
  warn(
    'RLS_ENFORCE=true sin DB_APP_USER: la aplicación va a conectarse con el ' +
      'rol propietario de la base, que ignora RLS. Definir DB_APP_USER/' +
      'DB_APP_PASSWORD con un rol sin BYPASSRLS para que el aislamiento sea real.',
  );
}

/**
 * HZ-05 · credenciales con las que la aplicación abre su conexión.
 *
 * `DB_APP_USER`/`DB_APP_PASSWORD` (rol de runtime, sin BYPASSRLS) tienen
 * precedencia; `DB_USER`/`DB_PASSWORD` (rol dueño: DDL, migraciones, seed) son
 * el respaldo. Un valor **vacío** cuenta como ausente: el compose del proceso de
 * migración declara `DB_APP_USER: ""` y debe caer al rol dueño, no mandar un
 * usuario vacío.
 *
 * Con `DB_ROLE_PURPOSE=migration` (lo declara el servicio `api-migrate` del
 * compose y lo repite `seed-cli`) se usa siempre el rol
 * dueño, aunque llegue un `DB_APP_USER`. El `""` del compose no alcanza: Coolify
 * trata el valor vacío como «sin valor» y lo rellena con la variable de la app,
 * y la migración termina como `mantra_app`, que no es dueño de las tablas
 * (`must be owner of table …`).
 */
export function resolveRuntimeCredentials(
  owner: { user: string; password: string },
  source: {
    DB_APP_USER?: string;
    DB_APP_PASSWORD?: string;
    DB_ROLE_PURPOSE?: string;
  } = process.env,
): { user: string; password: string } {
  if (source.DB_ROLE_PURPOSE === 'migration') {
    return { user: owner.user, password: owner.password };
  }
  return {
    user: source.DB_APP_USER || owner.user,
    password: source.DB_APP_PASSWORD || owner.password,
  };
}
