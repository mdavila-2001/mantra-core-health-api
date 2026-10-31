import type { SourceTree } from './source-tree';

export interface ComposeService {
  readonly file: string;
  readonly name: string;
  readonly line: number;
  /** Nombre del worker que arranca (`messaging`), o `null` si no es un worker. */
  readonly worker: string | null;
  readonly profiles: readonly string[];
  readonly healthcheckLine: number | null;
}

export interface PackageScript {
  readonly name: string;
  readonly line: number;
  readonly worker: string;
}

export interface DeploymentIndex {
  readonly compose: readonly ComposeService[];
  readonly scripts: readonly PackageScript[];
  /** Ancla `x-worker-healthcheck` (la comprobación que comparten los workers). */
  readonly workerHealthchecks: readonly { file: string; line: number }[];
}

const COMPOSE_FILES = ['docker-compose.yml', 'docker-compose.coolify.yml'];

/**
 * Lee los archivos de compose y `package.json` por líneas (sin parser YAML: el
 * escáner no necesita más que nombre de servicio, `command`, `profiles` y
 * `healthcheck`, y una dependencia de YAML sólo para eso no se justifica).
 */
export function indexDeployment(tree: SourceTree): DeploymentIndex {
  const compose: ComposeService[] = [];
  const workerHealthchecks: { file: string; line: number }[] = [];
  for (const path of COMPOSE_FILES) {
    const file = tree.get(path);
    if (!file) continue;
    compose.push(...parseCompose(path, file.lines));
    const anchor = file.lines.findIndex((text) =>
      /^x-worker-healthcheck:/.test(text),
    );
    if (anchor >= 0) workerHealthchecks.push({ file: path, line: anchor + 1 });
  }
  const scripts: PackageScript[] = [];
  const pkg = tree.get('package.json');
  if (pkg) {
    pkg.lines.forEach((text, i) => {
      const match =
        /^\s*"(start:worker:([\w-]+))"\s*:\s*"node dist\/src\/worker-[\w-]+"/.exec(
          text,
        );
      if (match)
        scripts.push({ name: match[1], line: i + 1, worker: match[2] });
    });
  }
  return { compose, scripts, workerHealthchecks };
}

function parseCompose(
  file: string,
  lines: readonly string[],
): ComposeService[] {
  const out: ComposeService[] = [];
  let inServices = false;
  let current: {
    file: string;
    name: string;
    line: number;
    worker: string | null;
    profiles: string[];
    healthcheckLine: number | null;
  } | null = null;
  const flush = () => {
    if (current) out.push(current);
    current = null;
  };
  lines.forEach((text, i) => {
    if (/^services:\s*$/.test(text)) {
      inServices = true;
      return;
    }
    if (/^\S/.test(text) && !/^\s*#/.test(text)) {
      if (inServices) flush();
      inServices = false;
      return;
    }
    if (!inServices) return;
    const service = /^ {2}([A-Za-z0-9_.-]+):\s*(?:#.*)?$/.exec(text);
    if (service) {
      flush();
      current = {
        file,
        name: service[1],
        line: i + 1,
        worker: null,
        profiles: [],
        healthcheckLine: null,
      };
      return;
    }
    if (!current) return;
    const command = /command:.*dist\/src\/worker-([\w-]+)\.js/.exec(text);
    if (command) current.worker = command[1];
    const profiles = /^\s+profiles:\s*\[(.*)\]/.exec(text);
    if (profiles) {
      current.profiles = [...profiles[1].matchAll(/["']([^"']+)["']/g)].map(
        (m) => m[1],
      );
    }
    if (/^\s+healthcheck:/.test(text)) current.healthcheckLine = i + 1;
  });
  flush();
  return out;
}
