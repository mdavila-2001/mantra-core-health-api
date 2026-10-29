import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * `INSERT … ON CONFLICT DO NOTHING` **sin objetivo** falla con SQLSTATE 55000
 * (`object_not_in_prerequisite_state`) sobre una tabla con restricciones UNIQUE o
 * EXCLUDE diferibles. El modelo de infraestructura las introdujo en
 * `clinical.encounter_locations` (camas) y `practice.space_placements` (lienzo).
 * Quien necesite ignorar duplicados nombra el objetivo: `ON CONFLICT (pk) DO NOTHING`.
 *
 * Esta prueba impide que vuelva a escribirse la forma sin objetivo en el código
 * de la API (los comentarios no cuentan).
 */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === 'data' ? [] : sources(path);
    return name.endsWith('.ts') && !name.endsWith('.spec.ts') ? [path] : [];
  });
}

describe('INSERT … ON CONFLICT sin objetivo', () => {
  it('ningún fuente de la API usa `on conflict do nothing` sin objetivo', () => {
    const offenders = sources(resolve(process.cwd(), 'src')).flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .map((text, index) => ({ file, line: index + 1, text }))
        .filter(
          ({ text }) =>
            !/^\s*(\*|\/\/|\/\*)/.test(text) &&
            /on\s+conflict\s+do\s+nothing/i.test(text),
        )
        .map(({ file: f, line }) => `${f}:${line}`),
    );
    expect(offenders).toEqual([]);
  });
});
