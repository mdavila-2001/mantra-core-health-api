import type { DiscoveredPiece } from '../runtime-pieces.types';
import type { ModuleGraph } from './module-graph';
import {
  envVarsIn,
  evidenceAt,
  makePiece,
  moduleOf,
  slug,
} from './scan-helpers';
import type { SourceTree } from './source-tree';

/**
 * Jobs con nombre: constantes `*_JOB_TYPE = '…'` (el `jobType` con que se encola
 * y se consume) y enums cuyo nombre contiene `Job`. Declarar un nombre de job no
 * prueba que alguien lo consuma: por eso es una pieza aparte y lleva su
 * evidencia.
 */
export function scanNamedJobs(tree: SourceTree): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const file of tree.ts()) {
    for (const m of file.text.matchAll(
      /export\s+const\s+(\w*JOB_TYPE\w*)\s*=\s*['"]([^'"]+)['"]/g,
    )) {
      out.push(
        makePiece({
          id: `rtp.jobtype.${slug(m[2])}`,
          kind: 'JOB_NOMBRADO',
          name: `Job "${m[2]}"`,
          module: moduleOf(file.path),
          evidence: evidenceAt(file, m.index),
          enable: {
            how: 'se encola desde la API; lo consume el handler registrado para ese jobType',
            envVars: [],
            launchers: [],
          },
          attributes: { constant: m[1], jobType: m[2] },
        }),
      );
    }
    for (const m of file.text.matchAll(
      /export\s+enum\s+(\w*Job\w*)\s*\{([^}]*)\}/g,
    )) {
      for (const member of m[2].matchAll(/(\w+)\s*=\s*['"]([^'"]+)['"]/g)) {
        out.push(
          makePiece({
            id: `rtp.jobtype.${slug(m[1])}.${slug(member[1])}`,
            kind: 'JOB_NOMBRADO',
            name: `${m[1]}.${member[1]}`,
            module: moduleOf(file.path),
            evidence: evidenceAt(file, m.index + m[0].indexOf(member[0])),
            attributes: { enum: m[1], member: member[1], value: member[2] },
          }),
        );
      }
    }
  }
  return out;
}

/** Marcas de E/S externa: si el archivo no tiene ninguna, no es un conector. */
const IO_MARKERS: ReadonlyArray<readonly [string, RegExp]> = [
  ['http', /\bfetch\(|\baxios\b|https?\.request\(|\bgot\(/],
  ['aws-s3', /@aws-sdk\//],
  ['redis', /from\s+'ioredis'|new\s+Redis\(/],
  ['mongodb', /from\s+'mongodb'|new\s+MongoClient\(/],
  ['opensearch', /@opensearch-project\//],
  ['websocket', /@WebSocketGateway\(|from\s+'socket\.io'/],
  ['google', /from\s+'googleapis'|google-auth-library/],
  ['tcp', /net\.(?:connect|createConnection)\(|from\s+'node:net'/],
  ['smtp', /nodemailer/],
];
const CONNECTOR_NAME =
  /(adapter|client|provider|gateway|connector|storage)(\.service)?\.ts$/;

/**
 * Conectores y adaptadores externos: archivos de nombre `*adapter|client|
 * provider|gateway|connector|storage*` que además muestran una marca de E/S
 * hacia fuera del proceso. Los «adaptadores» internos entre módulos (puertos
 * de dominio) no tienen esa marca y quedan fuera.
 */
export function scanConnectors(
  tree: SourceTree,
  graph: ModuleGraph,
): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const file of tree.ts((p) => CONNECTOR_NAME.test(p))) {
    const protocols = IO_MARKERS.filter(([, re]) => re.test(file.text)).map(
      ([name]) => name,
    );
    if (protocols.length === 0) continue;
    const cls = /export\s+class\s+(\w+)/.exec(file.text);
    const base = file.path.replace(/^src\//, '').replace(/\.ts$/, '');
    const hosts = cls ? graph.hostsOf(cls[1], 'providers') : [];
    const first = IO_MARKERS.find(([, re]) => re.test(file.text));
    const marker = first ? first[1].exec(file.text) : null;
    out.push(
      makePiece({
        id: `rtp.conector.${slug(base.replace(/\//g, '.'))}`,
        kind: 'CONECTOR',
        name: cls ? cls[1] : base,
        module: moduleOf(file.path),
        hosts,
        evidence: evidenceAt(file, marker ? marker.index : 0),
        wired: cls ? graph.isDeclared(cls[1], 'providers') : null,
        enable: {
          how: hosts.length
            ? `se instancia en ${hosts.join(', ')}`
            : 'proveedor sin proceso anfitrión resuelto',
          envVars: envVarsIn(file.text),
          launchers: [],
        },
        attributes: {
          className: cls ? cls[1] : null,
          protocols: protocols.join(', '),
        },
      }),
    );
  }
  return out;
}
