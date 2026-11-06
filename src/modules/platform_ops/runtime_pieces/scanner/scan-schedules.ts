import type {
  DiscoveredPiece,
  EnableInfo,
  Schedule,
} from '../runtime-pieces.types';
import type { ModuleGraph } from './module-graph';
import {
  callArguments,
  heartbeatFor,
  envVarsIn,
  evidenceAt,
  makePiece,
  moduleOf,
  resolveNumber,
  resolveString,
  slug,
  toUpperSnake,
} from './scan-helpers';
import {
  findLine,
  lineAt,
  type SourceFile,
  type SourceTree,
} from './source-tree';

const DECORATOR = /@(Interval|Cron|Timeout)\(([^)]*)\)/g;
const CRON_JOB =
  /(?:new\s+CronJob\(\s*|CronJob\.from\(\s*\{\s*cronTime:\s*)([^,)}]+)/g;
const SET_INTERVAL = /\bsetInterval\(/g;

/**
 * Trabajo programado: `@Interval/@Cron/@Timeout` (NestJS Schedule), `CronJob`
 * explícito y `setInterval` en servicios. Es el corazón de «qué corre solo».
 */
export function scanSchedules(
  tree: SourceTree,
  graph: ModuleGraph,
  workerEnvFile: SourceFile | undefined,
): { pieces: DiscoveredPiece[]; warnings: string[] } {
  const pieces: DiscoveredPiece[] = [];
  const warnings: string[] = [];
  for (const file of tree.ts()) {
    pieces.push(...decorated(tree, file, graph, workerEnvFile, warnings));
    pieces.push(...cronJobs(tree, file, graph, workerEnvFile, warnings));
    pieces.push(...timers(tree, file, graph, workerEnvFile));
  }
  return { pieces, warnings };
}

function enclosingClass(file: SourceFile, index: number): string | null {
  const head = file.text.slice(0, index);
  const all = [...head.matchAll(/(?:export\s+)?class\s+(\w+)/g)];
  return all.length ? all[all.length - 1][1] : null;
}

function methodAfter(file: SourceFile, from: number): string | null {
  const tail = file.text.slice(from);
  const match = /^[\s\S]*?(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::[^{]+)?\{/.exec(
    tail,
  );
  return match ? match[1] : null;
}

/** Nombre legible: `worker/jobs/<dominio>/<job>.job.ts` → `<dominio>/<job>`. */
function jobName(path: string): string {
  const job = /^src\/worker\/jobs\/([^/]+)\/([^/]+?)(?:\.job)?\.ts$/.exec(path);
  if (job) return `${job[1]}/${job[2]}`;
  return path.replace(/^src\//, '').replace(/\.ts$/, '');
}

function hostsFor(graph: ModuleGraph, className: string | null): string[] {
  return className ? graph.hostsOf(className, 'providers') : [];
}

function decorated(
  tree: SourceTree,
  file: SourceFile,
  graph: ModuleGraph,
  workerEnvFile: SourceFile | undefined,
  warnings: string[],
): DiscoveredPiece[] {
  const matches = [...file.text.matchAll(DECORATOR)];
  const out: DiscoveredPiece[] = [];
  matches.forEach((match) => {
    const kind = match[1];
    const arg = match[2].trim();
    const className = enclosingClass(file, match.index);
    const method = methodAfter(file, match.index + match[0].length);
    const schedule = buildSchedule(tree, file, kind, arg);
    if (schedule.type !== 'cron' && schedule.intervalMs === null) {
      warnings.push(
        `${file.path}:${lineAt(file.text, match.index)}: no se resolvió el argumento "${arg}" de @${kind}`,
      );
    }
    const hosts = hostsFor(graph, className);
    const several = matches.length > 1;
    out.push(
      makePiece({
        id: `rtp.job.${slug(jobName(file.path).replace('/', '.'))}${several && method ? `.${slug(method)}` : ''}`,
        kind: 'JOB_PROGRAMADO',
        name: jobName(file.path) + (several && method ? `#${method}` : ''),
        module: moduleOf(file.path),
        hosts,
        schedule,
        evidence: evidenceAt(file, match.index),
        heartbeat: heartbeatFor(hosts),
        wired: className ? graph.isDeclared(className, 'providers') : null,
        enable: enableOf(tree, file, workerEnvFile, hosts),
        attributes: {
          decorator: `@${kind}`,
          className,
          method,
          ticks: tickNames(file).join(', ') || null,
        },
      }),
    );
  });
  return out;
}

function buildSchedule(
  tree: SourceTree,
  file: SourceFile,
  kind: string,
  arg: string,
): Schedule {
  if (kind === 'Cron') {
    const expression = resolveString(tree, file, arg.split(',')[0]);
    return { type: 'cron', intervalMs: null, cron: expression, raw: arg };
  }
  return {
    type: kind === 'Interval' ? 'interval' : 'timeout',
    intervalMs: resolveNumber(tree, file, arg),
    cron: null,
    raw: arg,
  };
}

/** Nombres de operación que pasa a `runTick(…, 'worker.x.y', …)`. */
function tickNames(file: SourceFile): string[] {
  return [
    ...new Set(
      [...file.text.matchAll(/runTick\(\s*[\w.]+\s*,\s*'([^']+)'/g)].map(
        (m) => m[1],
      ),
    ),
  ];
}

function cronJobs(
  tree: SourceTree,
  file: SourceFile,
  graph: ModuleGraph,
  workerEnvFile: SourceFile | undefined,
  warnings: string[],
): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const match of file.text.matchAll(CRON_JOB)) {
    const className = enclosingClass(file, match.index);
    const expression =
      resolveString(tree, file, match[1]) ?? cronDefault(tree, file);
    if (expression === null) {
      warnings.push(
        `${file.path}:${lineAt(file.text, match.index)}: no se resolvió la expresión cron "${match[1].trim()}"`,
      );
    }
    const hosts = hostsFor(graph, className);
    out.push(
      makePiece({
        id: `rtp.job.${slug(jobName(file.path).replace('/', '.'))}.cron`,
        kind: 'JOB_PROGRAMADO',
        name: `${jobName(file.path)} (cron)`,
        module: moduleOf(file.path),
        hosts,
        schedule: {
          type: 'cron',
          intervalMs: null,
          cron: expression,
          raw: match[1].trim(),
        },
        evidence: evidenceAt(file, match.index),
        heartbeat: heartbeatFor(hosts),
        wired: className ? graph.isDeclared(className, 'providers') : null,
        enable: enableOf(tree, file, workerEnvFile, hosts),
        attributes: {
          decorator: 'CronJob',
          className,
          ticks: tickNames(file).join(', ') || null,
        },
      }),
    );
  }
  return out;
}

/** Expresión cron por omisión declarada en los imports de configuración (`expireSweepCron: '0 * * * *'`). */
function cronDefault(tree: SourceTree, file: SourceFile): string | null {
  for (const source of [file, ...envImports(tree, file)]) {
    const m = /[Cc]ron\w*\s*:\s*['"]([0-9*/,\- ]{5,})['"]/.exec(source.text);
    if (m) return m[1];
  }
  return null;
}

function envImports(tree: SourceTree, file: SourceFile): SourceFile[] {
  const out: SourceFile[] = [];
  for (const m of file.text.matchAll(
    /from\s+'(\.[^']*\.env|\.[^']*-config|\.[^']*\.config)'/g,
  )) {
    const target = tree.resolveImport(file.path, m[1]);
    if (target) out.push(target);
  }
  return out;
}

function timers(
  tree: SourceTree,
  file: SourceFile,
  graph: ModuleGraph,
  workerEnvFile: SourceFile | undefined,
): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const match of file.text.matchAll(SET_INTERVAL)) {
    const args = callArguments(file.text, match.index + match[0].length - 1);
    if (args.length < 2) continue;
    const delay = args[args.length - 1];
    const className = enclosingClass(file, match.index);
    const hosts = className ? graph.hostsOf(className, 'providers') : [];
    const base = file.path.replace(/^src\//, '').replace(/\.ts$/, '');
    out.push(
      makePiece({
        id: `rtp.timer.${slug(base.replace(/\//g, '.'))}`,
        kind: 'TEMPORIZADOR',
        name: `Temporizador de ${className ?? base}`,
        module: moduleOf(file.path),
        hosts,
        schedule: {
          type: 'interval',
          intervalMs: resolveNumber(tree, file, delay),
          cron: null,
          raw: delay,
        },
        evidence: evidenceAt(file, match.index),
        heartbeat: heartbeatFor(hosts),
        wired: className ? graph.isDeclared(className, 'providers') : null,
        enable: enableOf(tree, file, workerEnvFile, hosts),
        attributes: { className },
      }),
    );
  }
  return out;
}

/**
 * Cómo se enciende: variables `*_ENABLED/*_DISABLED` del archivo y de sus
 * imports de configuración (`*.env`), y guardas `this.env.<prop>` que se pueden
 * rastrear a una variable de `worker.env.ts`. Sólo NOMBRES de variables.
 */
function enableOf(
  tree: SourceTree,
  file: SourceFile,
  workerEnvFile: SourceFile | undefined,
  hosts: readonly string[],
): EnableInfo {
  const sources: SourceFile[] = [file, ...envImports(tree, file)];
  const found = new Map<string, { file: string; line: number }>();
  for (const source of sources) {
    // `process.env.X`, claves Joi (`X:`) y nombres citados en textos (`'X=false …'`).
    const names = new Set([
      ...envVarsIn(source.text),
      ...(source.text.match(
        /\b[A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_(?:ENABLED|DISABLED|CRON)\b/g,
      ) ?? []),
    ]);
    for (const name of names) {
      if (!/(_ENABLED|_DISABLED|_CRON)$/.test(name)) continue;
      const line = findLine(source, new RegExp(`\\b${name}\\b`)) ?? 1;
      if (!found.has(name)) found.set(name, { file: source.path, line });
    }
  }
  if (workerEnvFile) {
    // Sólo las guardas `if (… this.env.x …) return`: usar un valor de config no es un interruptor.
    for (const m of file.text.matchAll(
      /if\s*\([^)]*this\.env\.(\w+)[^)]*\)\s*\{?\s*return/g,
    )) {
      const name = toUpperSnake(m[1]);
      if (
        new RegExp(`\\b${name}\\b`).test(workerEnvFile.text) &&
        !found.has(name)
      ) {
        found.set(name, { file: file.path, line: lineAt(file.text, m.index) });
      }
    }
  }
  const envVars = [...found.keys()].sort();
  const where = hosts.length
    ? `dentro de ${hosts.join(', ')}`
    : 'sin proceso anfitrión resuelto';
  return {
    how: envVars.length
      ? `${where}; condicionada por ${envVars.join(', ')}`
      : `${where}; sin interruptor propio`,
    envVars,
    launchers: [...found.entries()]
      .map(([name, ev]) => ({ ...ev, what: `lee ${name}` }))
      .sort((a, b) => (a.what < b.what ? -1 : 1)),
  };
}
