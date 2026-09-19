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
