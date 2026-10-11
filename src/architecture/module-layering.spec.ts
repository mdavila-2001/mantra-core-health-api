import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import * as ts from 'typescript';

/**
 * Reglas de capas de los módulos migrados al molde DDD
 * (`docs/architecture/module-layout.md`, ADR-0026).
 *
 * Es el molde hecho ejecutable: lee el árbol de imports con la API de
 * TypeScript y falla si una capa cruza una frontera que no debe. Se aplica
 * **sólo** a los módulos de `MIGRATED_MODULES`; cada módulo que se migre se
 * suma a la lista en su mismo PR, sin romper el CI de los demás.
 */
export const MIGRATED_MODULES: readonly string[] = ['scheduling', 'profiles'];

const MODULES_DIR = join(process.cwd(), 'src', 'modules');

type Layer = 'domain' | 'application' | 'infrastructure' | 'presentation';
const LAYERS: readonly Layer[] = [
  'domain',
  'application',
  'infrastructure',
  'presentation',
];

/** Paquetes que `domain/` no puede importar. */
const DOMAIN_FORBIDDEN_PACKAGES: readonly RegExp[] = [
  /^@nestjs\//,
  /^@mikro-orm\//,
  /^nestjs-pino$/,
];

/** Los archivos de pruebas y de cableado de pruebas arman el grafo: quedan fuera. */
function isWiring(file: string): boolean {
  return /\.(spec|testing)\.ts$/.test(file);
}

function sourceFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return path.endsWith('.ts') ? [path] : [];
  });
}

interface ImportEdge {
  readonly specifier: string;
  /** Ruta absoluta del archivo destino si es relativo y se resuelve. */
  readonly target?: string;
}

function importsOf(file: string): ImportEdge[] {
  const text = readFileSync(file, 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.ES2023, true);
  const edges: ImportEdge[] = [];
  const add = (node: ts.Expression | undefined): void => {
    if (!node || !ts.isStringLiteralLike(node)) return;
    const specifier = node.text;
    if (!specifier.startsWith('.')) {
      edges.push({ specifier });
      return;
    }
    const base = resolve(dirname(file), specifier);
    const target = [`${base}.ts`, join(base, 'index.ts'), base].find(
      (candidate) => existsSync(candidate) && statSync(candidate).isFile(),
    );
    edges.push({ specifier, target: target ?? base });
  };
  const visit = (node: ts.Node): void => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier
    ) {
      add(node.moduleSpecifier);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword
    ) {
      add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return edges;
}

/** Capa y módulo a los que pertenece un archivo de `src/modules/<módulo>/`. */
function locate(
  file: string,
): { module: string; layer: Layer | 'root' | 'entities' } | null {
  const rel = relative(MODULES_DIR, file).split(sep);
  if (rel[0].startsWith('..') || rel.length < 2) return null;
  const segment = rel[1];
  if ((LAYERS as readonly string[]).includes(segment)) {
    return { module: rel[0], layer: segment as Layer };
  }
  return {
    module: rel[0],
    layer: segment === 'entities' ? 'entities' : 'root',
  };
}

/**
 * Excepción consciente y acotada: los repositorios **propios** del módulo.
 *
 * Son clases sin estado que reciben la unidad de trabajo por parámetro, y
 * `application/` las usa como su puerto de persistencia (la clase es el
 * contrato). Convertirlas en interfaces con mapeadores a un modelo de dominio
 * separado de la entidad ORM es la decisión pendiente A3 del inventario
 * (`docs/architecture/module-layout.md`, «Trampas»). Mientras tanto, y sólo
 * mientras tanto, se permite exactamente esta ruta; los adaptadores y el
 * cableado de persistencia siguen vetados para `application/`.
 */
const OWN_REPOSITORIES = /[\\/]infrastructure[\\/]repositories([\\/]|$)/;

/** Los archivos de conceptos son terminología compartida (kernel compartido). */
const isSharedConcepts = (file: string): boolean =>
  /\.concepts\.ts$/.test(file);

function violationsOf(moduleName: string): string[] {
  const moduleDir = join(MODULES_DIR, moduleName);
  const violations: string[] = [];

  for (const file of sourceFiles(moduleDir)) {
    const from = locate(file);
    if (!from || from.layer === 'entities' || from.layer === 'root') continue;
    const where = relative(process.cwd(), file);
    const wiring = isWiring(file);

    for (const edge of importsOf(file)) {
      const report = (rule: string): number =>
        violations.push(`${where} → ${edge.specifier}: ${rule}`);

      // Paquetes externos
      if (!edge.target) {
        if (
          from.layer === 'domain' &&
          DOMAIN_FORBIDDEN_PACKAGES.some((r) => r.test(edge.specifier))
        ) {
          report('domain/ no importa Nest ni MikroORM');
        }
        continue;
      }
      if (wiring) continue;

      const to = locate(edge.target);

      // Barril de `common`: arrastra Nest; el dominio sólo admite archivos puros.
      const commonBarrel = join(process.cwd(), 'src', 'common', 'index.ts');
      if (from.layer === 'domain' && edge.target === commonBarrel) {
        report('domain/ no importa el barril de common (arrastra Nest)');
      }

      if (!to) continue;

      // Otro módulo: sólo infraestructura (adaptadores) y sus conceptos.
      if (to.module !== moduleName) {
        if (from.layer !== 'infrastructure' && !isSharedConcepts(edge.target)) {
          report(
            `entra a '${to.module}' sin puerto: sólo infrastructure/ habla con otros contextos (o sus *.concepts)`,
          );
        }
        continue;
      }

      if (to.layer === 'entities' && from.layer === 'domain') {
        report('domain/ no importa entidades ORM');
      }
      if (from.layer === 'domain' && to.layer !== 'domain') {
        if (to.layer !== 'root') report(`domain/ no importa ${to.layer}/`);
      }
      if (
        from.layer === 'application' &&
        to.layer === 'infrastructure' &&
        !OWN_REPOSITORIES.test(edge.target)
      ) {
        report('application/ depende de puertos, no de infrastructure/');
      }
      if (from.layer === 'application' && to.layer === 'presentation') {
        if (!/[\\/]presentation[\\/]dto[\\/]/.test(edge.target)) {
          report('application/ sólo toma de presentation/ sus DTO');
        }
      }
      if (from.layer === 'presentation' && to.layer === 'infrastructure') {
        report('presentation/ no importa infrastructure/');
      }
      if (from.layer === 'infrastructure' && to.layer === 'presentation') {
        if (!/[\\/]presentation[\\/]dto[\\/]/.test(edge.target)) {
          report('infrastructure/ sólo toma de presentation/ sus DTO');
        }
      }
    }
  }
  return violations;
}

describe('capas de los módulos migrados', () => {
  it('hay al menos un módulo migrado y existe en disco', () => {
    expect(MIGRATED_MODULES.length).toBeGreaterThan(0);
    for (const name of MIGRATED_MODULES) {
      expect(existsSync(join(MODULES_DIR, name))).toBe(true);
    }
  });

  it.each(MIGRATED_MODULES.map((name) => [name]))(
    '%s: ninguna capa viola las reglas de dependencia',
    (name) => {
      expect(violationsOf(name)).toEqual([]);
    },
  );

  it.each(MIGRATED_MODULES.map((name) => [name]))(
    '%s: lee de verdad las cuatro capas',
    (name) => {
      const layers = new Set(
        sourceFiles(join(MODULES_DIR, name)).map((f) => locate(f)?.layer),
      );
      for (const layer of LAYERS) expect(layers).toContain(layer);
    },
  );
});
