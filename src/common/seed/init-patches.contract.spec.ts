import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Los parches de `database/SQL/patches` corren en `postgres-init` sobre una base
 * nueva, con `ON_ERROR_STOP=1`: uno solo que falle deja caído el despliegue entero.
 * Hay dos causas que ya lo cortaron y que se detectan leyendo el archivo:
 *
 *  - Autor de auditoría fijo (`00000000-0000-4000-8000-000000000001`): ningún
 *    archivo de `database/SQL` siembra ese usuario y `created_by_user_id` es FK a
 *    `iam.users`. Sólo vale resuelto por consulta, que da NULL si no existe.
 *  - Cuentas sembradas por SQL (`INSERT INTO iam.users`) cuyos conceptos de estado
 *    los siembra la API después del init: tienen que ir detrás de una guarda
 *    `\if` que compruebe el catálogo.
 *
 * `PATCHES_DIR` apunta a otra carpeta, sólo para comprobar que la prueba falla
 * contra la versión anterior de los parches.
 */
const PATCHES_DIR =
  process.env.PATCHES_DIR ?? join(process.cwd(), 'database/SQL/patches');

const FIXED_ACTOR = '00000000-0000-4000-8000-000000000001';

const patches = readdirSync(PATCHES_DIR)
  .filter((name) => name.endsWith('.sql'))
  .map((name) => ({
    name,
    sql: readFileSync(join(PATCHES_DIR, name), 'utf8'),
  }));

describe('database/SQL/patches en una base nueva', () => {
  it('lee los parches', () => {
    expect(patches.length).toBeGreaterThan(0);
  });

  it('no usa el usuario fijo como autor sin comprobar que existe', () => {
    const offenders = patches
      .filter(({ sql }) => sql.includes(FIXED_ACTOR))
      .filter(({ sql }) => {
        const lookup = new RegExp(
          `SELECT\\s+id\\s+FROM\\s+iam\\.users\\s+WHERE\\s+id\\s*=\\s*'${FIXED_ACTOR}'`,
          'i',
        );
        return !lookup.test(sql);
      })
      .map(({ name }) => name);
    expect(offenders).toEqual([]);
  });

  it('guarda con \\if los parches que siembran cuentas con conceptos del catálogo', () => {
    const offenders = patches
      .filter(({ sql }) => /INSERT\s+INTO\s+iam\.users\b/i.test(sql))
      .filter(
        ({ sql }) =>
          !/^\\if\s+:\w+/m.test(sql) ||
          !/terminology\.catalog_concepts/i.test(sql),
      )
      .map(({ name }) => name);
    expect(offenders).toEqual([]);
  });
});
