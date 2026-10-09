import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * El dominio de agenda no conoce a Nest, a MikroORM ni a otras capas.
 *
 * Es la regla que hace que `domain/` sea lo que dice ser: reglas, políticas,
 * máquina de estados y tipos puros que se prueban sin levantar nada. Se lee el
 * **texto** de los imports (no se importa el módulo) para que el fallo señale
 * el archivo exacto que cruzó la frontera.
 */
const DOMAIN_DIR = join(process.cwd(), 'src', 'modules', 'scheduling', 'domain');

/** Paquetes y capas que `domain/` no puede importar. */
const FORBIDDEN: readonly RegExp[] = [
  /^@nestjs\//,
  /^@mikro-orm\//,
  /^nestjs-pino$/,
  /\/application\//,
  /\/infrastructure\//,
  /\/presentation\//,
  /\/entities(\/|$)/,
  // El barril de `common` arrastra Nest; sólo se admiten sus archivos puros.
  /\/common$/,
  /\/common\/index$/,
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') && !path.endsWith('.spec.ts') ? [path] : [];
  });
}

function importedModules(path: string): string[] {
  const text = readFileSync(path, 'utf8');
  return [...text.matchAll(/from\s+'([^']+)'/g)].map((match) => match[1]);
}

describe('domain/ es puro', () => {
  const files = sourceFiles(DOMAIN_DIR);

  it('lee de verdad los archivos del dominio', () => {
    // Sin este fusible, un cambio de ruta dejaría la prueba verde sobre cero archivos.
    expect(files.length).toBeGreaterThan(10);
  });

  it.each(files.map((path) => [path.slice(DOMAIN_DIR.length + 1), path]))(
    '%s no importa Nest, MikroORM ni otras capas',
    (_name, path) => {
      const offending = importedModules(path).filter((module) =>
        FORBIDDEN.some((rule) => rule.test(module)),
      );
      expect(offending).toEqual([]);
    },
  );
});
