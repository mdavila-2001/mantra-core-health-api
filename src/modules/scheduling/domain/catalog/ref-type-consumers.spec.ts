import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PRACTITIONER_PROFILE_TABLES } from '../resource/practitioner-profile-tables';
import { RESOURCE_REF_TYPE_SCHEMAS, TABLE_ALIAS } from './catalog-concepts';

/**
 * Los consumidores de `resource_ref_type` comparan contra la forma canónica.
 *
 * El almacén guarda siempre el valor de `normalizeRefType` (minúsculas, sin esquema); si un
 * consumidor comparara contra otro texto (otra capitalización, con esquema) leería distinto
 * de lo que se validó. Esta prueba recorre el código de `src/modules` y falla si una
 * comparación SQL o TypeScript con `resource_ref_type` usa un literal que no sea un tipo
 * canónico o el alias heredado.
 */
const CANONICAL = new Set<string>([
  ...Object.keys(RESOURCE_REF_TYPE_SCHEMAS),
  ...Object.keys(TABLE_ALIAS),
]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.ts$/.test(name) && !/\.spec\.ts$/.test(name) ? [path] : [];
  });
}

describe('consumidores de resource_ref_type', () => {
  const files = sourceFiles(join(process.cwd(), 'src', 'modules')).filter(
    (f) =>
      !f.includes(`${join('orm', 'catalog')}`) && !f.includes('/entities/'),
  );

  it('toda comparación SQL con resource_ref_type usa literales canónicos', () => {
    const offenders: string[] = [];
    let compared = 0;
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const re = /resource_ref_type\s*(?:=|<>|!=|IN|in)\s*(\([^)]*\)|'[^']*')/g;
      for (const match of text.matchAll(re)) {
        for (const literal of match[1].matchAll(/'([^']*)'/g)) {
          compared += 1;
          if (!CANONICAL.has(literal[1]))
            offenders.push(`${file}: ${literal[1]}`);
        }
      }
    }
    expect(compared).toBeGreaterThan(0);
    expect(offenders).toEqual([]);
  });

  it('toda comparación TypeScript con resourceRefType usa literales canónicos', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = readFileSync(file, 'utf8');
      const re = /resourceRefType\s*(?:===|!==|==|!=)\s*'([^']*)'/g;
      for (const match of text.matchAll(re)) {
        if (!CANONICAL.has(match[1])) offenders.push(`${file}: ${match[1]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it('PRACTITIONER_PROFILE_TABLES sólo tiene el canónico y su alias', () => {
    for (const refType of PRACTITIONER_PROFILE_TABLES) {
      expect(CANONICAL.has(refType)).toBe(true);
      expect(TABLE_ALIAS[refType] ?? refType).toBe(
        'health_practitioner_profiles',
      );
    }
  });
});
