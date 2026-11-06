import type { DiscoveredPiece, ScanResult } from '../runtime-pieces.types';
import { indexDeployment } from './deployment-index';
import { findEntryPoints, ModuleGraph } from './module-graph';
import { scanNamedJobs, scanConnectors } from './scan-named-and-connectors';
import { scanHttp } from './scan-http';
import { scanProcesses } from './scan-processes';
import { scanQueueConsumers } from './scan-queues';
import { scanSchedules } from './scan-schedules';
import { SourceTree } from './source-tree';

/** Lee el código de `root` y descubre las piezas. Sólo lectura de archivos. */
export async function scanRuntimePieces(root: string): Promise<ScanResult> {
  return scanTree(await SourceTree.load(root), root);
}

/**
 * Descubrimiento sobre un árbol ya leído. Determinista: el mismo árbol da la
 * misma lista, en el mismo orden y con los mismos ids.
 */
export function scanTree(tree: SourceTree, root: string): ScanResult {
  if (!tree.hasSource()) {
    return {
      available: false,
      source: 'live',
      generatedAt: null,
      reason:
        'No hay código fuente (src/) en la raíz indicada: el despliegue sólo trae el código compilado.',
      root,
      filesRead: tree.size,
      pieces: [],
      warnings: [],
    };
  }
  const entries = findEntryPoints(tree);
  const graph = new ModuleGraph(tree, entries);
  const deployment = indexDeployment(tree);
  const schedules = scanSchedules(
    tree,
    graph,
    tree.get('src/worker/worker.env.ts'),
  );

  const found: DiscoveredPiece[] = [
    ...scanProcesses(tree, deployment),
    ...schedules.pieces,
    ...scanQueueConsumers(tree, graph),
    ...scanNamedJobs(tree),
    ...scanHttp(tree, graph, deployment),
    ...scanConnectors(tree, graph),
  ];
  const warnings = [...schedules.warnings];
  const pieces = uniqueIds(found, warnings).map(normalize);
  pieces.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    available: true,
    source: 'live',
    generatedAt: null,
    reason: null,
    root,
    filesRead: tree.size,
    pieces,
    warnings: warnings.sort(),
  };
}

/** Dos piezas con el mismo id: la segunda y siguientes llevan `~n` por orden de evidencia. */
function uniqueIds(
  pieces: readonly DiscoveredPiece[],
  warnings: string[],
): DiscoveredPiece[] {
  const ordered = [...pieces].sort((a, b) =>
    a.evidence.file === b.evidence.file
      ? a.evidence.line - b.evidence.line
      : a.evidence.file < b.evidence.file
        ? -1
        : 1,
  );
  const seen = new Map<string, number>();
  return ordered.map((piece) => {
    const count = (seen.get(piece.id) ?? 0) + 1;
    seen.set(piece.id, count);
    if (count === 1) return piece;
    warnings.push(`id repetido "${piece.id}": se desambigua como ~${count}`);
    return { ...piece, id: `${piece.id}~${count}` };
  });
}

function normalize(piece: DiscoveredPiece): DiscoveredPiece {
  return {
    ...piece,
    hosts: [...piece.hosts].sort(),
    enable: {
      ...piece.enable,
      envVars: [...piece.enable.envVars].sort(),
    },
  };
}
