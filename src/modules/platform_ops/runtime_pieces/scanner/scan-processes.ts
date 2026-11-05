import type { DiscoveredPiece } from '../runtime-pieces.types';
import type { DeploymentIndex } from './deployment-index';
import { evidenceAt, makePiece, slug } from './scan-helpers';
import type { SourceFile, SourceTree } from './source-tree';

const COOLIFY = 'docker-compose.coolify.yml';

/**
 * Procesos: `src/main.ts` (la API), cada `src/worker-<dominio>.ts` (un worker) y
 * los demás arranques de una línea con `NestFactory` (p. ej. `seed-cli.ts`).
 * Cómo se enciende sale de compose y de los scripts de `package.json`.
 */
export function scanProcesses(
  tree: SourceTree,
  deployment: DeploymentIndex,
): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const file of tree.ts((p) => /^src\/[^/]+\.ts$/.test(p))) {
    const worker = /^src\/worker-([^/]+)\.ts$/.exec(file.path);
    const boot = worker
      ? /bootstrapWorker\(\s*(\w+)\s*,\s*'([^']+)'/.exec(file.text)
      : null;
    if (worker && boot) {
      out.push(workerProcess(file, boot, deployment));
      continue;
    }
    if (file.path === 'src/main.ts') {
      const match = /NestFactory\.create(?:<[^>]*>)?\(/.exec(file.text);
      if (match) {
        out.push(
          makePiece({
            id: 'rtp.proceso.api',
            kind: 'PROCESO',
            name: 'API HTTP',
            module: 'app',
            hosts: ['api'],
            evidence: evidenceAt(file, match.index),
            heartbeat: { mode: 'SELF', instanceId: 'api' },
            enable: {
              how: 'proceso principal del contenedor `api`',
              envVars: [],
              launchers: deployment.compose
                .filter((s) => s.name === 'api')
                .map((s) => ({
                  file: s.file,
                  line: s.line,
                  what: `servicio compose "${s.name}"`,
                })),
            },
          }),
        );
      }
      continue;
    }
    const other =
      /NestFactory\.create(?:ApplicationContext)?(?:<[^>]*>)?\(/.exec(
        file.text,
      );
    if (other && file.path !== 'src/main.ts' && !worker) {
      const name = file.path.replace(/^src\//, '').replace(/\.ts$/, '');
      out.push(
        makePiece({
          id: `rtp.proceso.${slug(name)}`,
          kind: 'PROCESO',
          name: `Proceso de un solo uso: ${name}`,
          module: 'app',
          hosts: [slug(name)],
          evidence: evidenceAt(file, other.index),
          enable: {
            how: 'se invoca a mano o como paso de despliegue; termina al acabar',
            envVars: [],
            launchers: [],
          },
          attributes: { oneShot: true },
        }),
      );
    }
  }
  return out;
}

function workerProcess(
  file: SourceFile,
  boot: RegExpExecArray,
  deployment: DeploymentIndex,
): DiscoveredPiece {
  const name = boot[2];
  const compose = deployment.compose.filter((s) => s.worker === name);
  const script = deployment.scripts.find((s) => s.worker === name);
  const dev = compose.filter((s) => s.file !== COOLIFY);
  const coolify = compose.filter((s) => s.file === COOLIFY);
  const profiles = [...new Set(compose.flatMap((s) => s.profiles))].sort();
  const launchers = [
    ...compose.map((s) => ({
      file: s.file,
      line: s.line,
      what:
        `servicio compose "${s.name}"` +
        (s.profiles.length ? ` (perfil: ${s.profiles.join(', ')})` : ''),
    })),
    ...(script
      ? [
          {
            file: 'package.json',
            line: script.line,
            what: `script ${script.name}`,
          },
        ]
      : []),
  ];
  const where = [
    dev.length ? 'docker-compose.yml' : null,
    coolify.length ? COOLIFY : null,
  ].filter((x): x is string => x !== null);
  return makePiece({
    id: `rtp.proceso.worker-${slug(name)}`,
    kind: 'PROCESO',
    name: `Worker ${name}`,
    module: name,
    hosts: [`worker-${name}`],
    evidence: evidenceAt(file, boot.index),
    heartbeat: { mode: 'PROCESS', instanceId: `worker-${name}` },
    enable: {
      how: where.length
        ? `servicio de compose en ${where.join(' y ')}` +
          (profiles.length ? `; perfil opt-in ${profiles.join(', ')}` : '')
        : 'sin servicio de compose ni script: sólo se arranca a mano',
      envVars: ['WORKER_HEALTH_PORT'],
      launchers,
    },
    attributes: {
      workerModule: boot[1],
      inComposeDev: dev.length > 0,
      inCoolify: coolify.length > 0,
      optIn: profiles.length > 0,
      hasStartScript: script !== undefined,
    },
  });
}
