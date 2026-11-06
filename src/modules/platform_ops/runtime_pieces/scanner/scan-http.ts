import type { DiscoveredPiece } from '../runtime-pieces.types';
import type { DeploymentIndex } from './deployment-index';
import type { ModuleGraph } from './module-graph';
import { evidenceAt, makePiece, moduleOf, slug } from './scan-helpers';
import { lineAt, type SourceFile, type SourceTree } from './source-tree';

const ROUTE = /@(Get|Post|Put|Patch|Delete)\(\s*(?:'([^']*)'|"([^"]*)")?\s*\)/g;
const HEALTH_SEGMENT = /(^|\/)(health|liveness|readiness|ready)(\/|$)/;

interface Route {
  readonly verb: string;
  readonly path: string;
  readonly index: number;
  readonly roles: string[];
  readonly isPublic: boolean;
  readonly method: string | null;
}

const joinPath = (...parts: string[]): string =>
  '/' +
  parts
    .join('/')
    .split('/')
    .filter((p) => p.length > 0)
    .join('/');

/**
 * Endpoints que disparan trabajo (`POST …/internal/…`) y comprobaciones de salud
 * (`/health`, `/liveness`, `/readiness`, la sonda de cada worker y los
 * `healthcheck` de compose).
 */
export function scanHttp(
  tree: SourceTree,
  graph: ModuleGraph,
  deployment: DeploymentIndex,
): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const file of tree.ts()) {
    if (!file.text.includes('@Controller(')) continue;
    for (const controller of controllersIn(file)) {
      const hosts = graph.hostsOf(controller.className, 'controllers');
      const wired = graph.isDeclared(controller.className, 'controllers');
      for (const route of controller.routes) {
        const full = joinPath(controller.prefix, route.path);
        const evidence = evidenceAt(file, route.index);
        const common = {
          module: moduleOf(file.path),
          hosts,
          wired,
          evidence,
          heartbeat: hosts.includes('api')
            ? { mode: 'INHERITED' as const, instanceId: 'api' }
            : { mode: 'NONE' as const, instanceId: null },
        };
        if (HEALTH_SEGMENT.test(full) && route.verb === 'GET') {
          out.push(
            makePiece({
              ...common,
              id: `rtp.salud.http.${slug(full.replace(/\//g, '-'))}`,
              kind: 'SALUD',
              name: `GET ${full}`,
              enable: {
                how: route.isPublic
                  ? 'pública, sin autenticación'
                  : `roles: ${route.roles.join(', ') || 'sesión'}`,
                envVars: [],
                launchers: [],
              },
              attributes: {
                controller: controller.className,
                public: route.isPublic,
              },
            }),
          );
        } else if (route.verb === 'POST' && /(^|\/)internal(\/|$)/.test(full)) {
          out.push(
            makePiece({
              ...common,
              id: `rtp.http.post.${slug(full.replace(/\//g, '-').replace(/:/g, ''))}`,
              kind: 'ENDPOINT_INTERNO',
              name: `POST ${full}`,
              enable: {
                how: `lo invoca un worker o el pipeline; roles: ${route.roles.join(', ') || 'sesión'}`,
                envVars: [],
                launchers: [],
              },
              attributes: {
                controller: controller.className,
                method: route.method,
                roles: route.roles.join(', ') || null,
                systemOnly:
                  route.roles.length > 0 &&
                  route.roles.every((r) => r === 'SYSTEM'),
              },
            }),
          );
        }
      }
    }
  }
  out.push(...workerHealthRoutes(tree));
  out.push(...composeHealthchecks(deployment));
  return out;
}

interface ControllerDecl {
  readonly className: string;
  readonly prefix: string;
  readonly routes: Route[];
}

function controllersIn(file: SourceFile): ControllerDecl[] {
  const decls = [...file.text.matchAll(/@Controller\(([^)]*)\)/g)];
  return decls.flatMap((decl, i) => {
    const prefix = /['"]([^'"]*)['"]/.exec(decl[1])?.[1] ?? '';
    const end = i + 1 < decls.length ? decls[i + 1].index : file.text.length;
    const body = file.text.slice(decl.index, end);
    const className = /class\s+(\w+)/.exec(body)?.[1];
    if (!className) return [];
    const classStart = body.search(/\bclass\s+\w+/);
    const classRoles = rolesIn(
      file.text.slice(Math.max(0, decl.index - 300), decl.index + classStart),
    );
    const routes: Route[] = [];
    for (const m of body.matchAll(ROUTE)) {
      const absolute = decl.index + m.index;
      const window =
        windowBefore(file.text, absolute) +
        windowAfter(file.text, absolute + m[0].length);
      routes.push({
        verb: m[1].toUpperCase(),
        path: m[2] ?? m[3] ?? '',
        index: absolute,
        roles: rolesIn(window).length ? rolesIn(window) : classRoles,
        isPublic:
          /@Public\(\)/.test(window) ||
          /@Public\(\)/.test(
            file.text.slice(
              Math.max(0, decl.index - 300),
              decl.index + classStart,
            ),
          ),
        method: methodNameAfter(file.text, absolute + m[0].length),
      });
    }
    return [{ className, prefix, routes }];
  });
}

/** Decoradores contiguos que preceden a la ruta (hasta el cierre del método anterior). */
function windowBefore(text: string, at: number): string {
  const head = text.slice(Math.max(0, at - 900), at);
  const cut = head.lastIndexOf('}\n');
  return cut >= 0 ? head.slice(cut + 2) : head;
}

/** Decoradores que siguen a la ruta, hasta la firma del método. */
function windowAfter(text: string, from: number): string {
  const tail = text.slice(from, from + 900);
  const signature = /\n {2}(?:async\s+)?\w+\s*\(/.exec(tail);
  return signature ? tail.slice(0, signature.index) : tail;
}

function rolesIn(window: string): string[] {
  const all = [...window.matchAll(/@Roles\(([^)]*)\)/g)];
  if (all.length === 0) return [];
  const last = all[all.length - 1][1];
  return [...last.matchAll(/'([A-Z_]+)'|\.\.\.(\w+)/g)].map((m) =>
    m[1] ? m[1] : `...${m[2]}`,
  );
}

function methodNameAfter(text: string, from: number): string | null {
  const m = /^[\s\S]*?(?:async\s+)?(\w+)\s*\(/.exec(
    text.slice(from, from + 600).replace(/@\w+\([^)]*\)/g, ''),
  );
  return m ? m[1] : null;
}

/** La sonda HTTP que cada worker levanta (`worker-health.server.ts`). */
function workerHealthRoutes(tree: SourceTree): DiscoveredPiece[] {
  const file = tree.get('src/worker/worker-health.server.ts');
  if (!file) return [];
  const seen = new Map<string, number>();
  for (const m of file.text.matchAll(
    /['"`](\/(?:health|liveness|readiness|status))['"`]/g,
  )) {
    if (!seen.has(m[1])) seen.set(m[1], m.index);
  }
  return [...seen.entries()].map(([route, index]) =>
    makePiece({
      id: `rtp.salud.worker.${slug(route)}`,
      kind: 'SALUD',
      name: `Sonda de cada worker: GET ${route}`,
      module: 'worker',
      evidence: evidenceAt(file, index),
      enable: {
        how: 'cada worker la levanta en WORKER_HEALTH_PORT (0 la deshabilita) sólo en el loopback salvo WORKER_HEALTH_HOST',
        envVars: ['WORKER_HEALTH_HOST', 'WORKER_HEALTH_PORT'],
        launchers: [],
      },
      attributes: {
        scope: 'cada proceso worker',
        line: lineAt(file.text, index),
      },
    }),
  );
}

/** `healthcheck:` de servicios de compose que no son workers, y la ancla de los workers. */
function composeHealthchecks(deployment: DeploymentIndex): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const service of deployment.compose) {
    if (service.healthcheckLine === null || service.worker !== null) continue;
    out.push(
      makePiece({
        id: `rtp.salud.compose.${slug(service.name)}${service.file.includes('coolify') ? '.coolify' : ''}`,
        kind: 'SALUD',
        name: `Healthcheck de compose: ${service.name}`,
        module: 'compose',
        hosts: [],
        evidence: { file: service.file, line: service.healthcheckLine },
        enable: {
          how: `lo ejecuta Docker en el servicio "${service.name}"`,
          envVars: [],
          launchers: [],
        },
        attributes: { service: service.name, file: service.file },
      }),
    );
  }
  for (const anchor of deployment.workerHealthchecks) {
    out.push(
      makePiece({
        id: `rtp.salud.compose.worker-template${anchor.file.includes('coolify') ? '.coolify' : ''}`,
        kind: 'SALUD',
        name: 'Healthcheck de compose compartido por los workers',
        module: 'compose',
        evidence: anchor,
        enable: {
          how: 'ancla `x-worker-healthcheck` que heredan los servicios worker',
          envVars: [],
          launchers: [],
        },
        attributes: { file: anchor.file },
      }),
    );
  }
  return out;
}
