import type { DiscoveredPiece } from '../runtime-pieces.types';
import type { ModuleGraph } from './module-graph';
import {
  evidenceAt,
  heartbeatFor,
  makePiece,
  moduleOf,
  resolveString,
  slug,
} from './scan-helpers';
import type { SourceFile, SourceTree } from './source-tree';

/**
 * Consumidores de cola y de eventos. Este repositorio no usa BullMQ: su cola es
 * una tabla (`message_queues`/`jobs`) que drena el worker de mensajería y su
 * outbox lo vacía un relevo. El escáner reconoce los dos mundos:
 *  - mecanismos de librería (`@Processor`, `new Worker(`, `@OnEvent`, `.subscribe(`);
 *  - los puentes propios (`registerQueueJobHandler`, y los jobs que llaman a
 *    endpoints `/internal/**` de reclamo o relevo).
 */
export function scanQueueConsumers(
  tree: SourceTree,
  graph: ModuleGraph,
): DiscoveredPiece[] {
  const out: DiscoveredPiece[] = [];
  for (const file of tree.ts()) {
    const base = file.path.replace(/^src\//, '').replace(/\.ts$/, '');
    const hostsOf = (index: number): string[] => {
      const head = file.text.slice(0, index);
      const cls = [...head.matchAll(/class\s+(\w+)/g)].pop()?.[1];
      return cls ? graph.hostsOf(cls, 'providers') : [];
    };

    for (const m of file.text.matchAll(
      /registerQueueJobHandler\(\s*([^,]+),/g,
    )) {
      if (
        file.text
          .slice(Math.max(0, m.index - 20), m.index)
          .includes('function ')
      )
        continue;
      const jobType = resolveString(tree, file, m[1]) ?? m[1].trim();
      out.push(
        makePiece({
          id: `rtp.cola.handler.${slug(jobType)}`,
          kind: 'CONSUMIDOR_COLA',
          name: `Manejador de la cola para "${jobType}"`,
          module: moduleOf(file.path),
          hosts: hostsOf(m.index),
          evidence: evidenceAt(file, m.index),
          heartbeat: heartbeatFor(hostsOf(m.index)),
          enable: {
            how: 'se registra al arrancar el worker que lo declara',
            envVars: [],
            launchers: [],
          },
          attributes: { mechanism: 'registerQueueJobHandler', jobType },
        }),
      );
    }

    for (const m of file.text.matchAll(/@Processor\(([^)]*)\)/g)) {
      out.push(
        libraryConsumer(
          file,
          m.index,
          'BullMQ @Processor',
          m[1],
          hostsOf(m.index),
        ),
      );
    }
    for (const m of file.text.matchAll(/new\s+Worker\(\s*([^,)]+)/g)) {
      out.push(
        libraryConsumer(file, m.index, 'BullMQ Worker', m[1], hostsOf(m.index)),
      );
    }
    for (const m of file.text.matchAll(/@OnEvent\(([^)]*)\)/g)) {
      out.push(
        libraryConsumer(file, m.index, '@OnEvent', m[1], hostsOf(m.index)),
      );
    }
    for (const m of file.text.matchAll(
      /\.(?:subscribe|psubscribe)\(\s*['"`]([^'"`]+)['"`]/g,
    )) {
      if (!/redis|ioredis/i.test(file.text)) continue;
      out.push(
        libraryConsumer(
          file,
          m.index,
          'Redis pub/sub',
          `'${m[1]}'`,
          hostsOf(m.index),
        ),
      );
    }

    if (file.path.startsWith('src/worker/jobs/')) {
      const bridge = /['"`](\/internal\/(?:outbox|queues)[^'"`]*)/.exec(
        file.text,
      );
      if (bridge) {
        const calls = [
          ...file.text.matchAll(
            /['"`](\/internal\/(?:outbox|queues)[^'"`$]*)/g,
          ),
        ].map((x) => x[1]);
        out.push(
          makePiece({
            id: `rtp.cola.puente.${slug(base.replace(/\//g, '.'))}`,
            kind: 'CONSUMIDOR_COLA',
            name: `Puente de cola/outbox en ${base.replace(/^worker\/jobs\//, '')}`,
            module: moduleOf(file.path),
            hosts: hostsOf(bridge.index),
            evidence: evidenceAt(file, bridge.index),
            heartbeat: heartbeatFor(hostsOf(bridge.index)),
            enable: {
              how: 'lo dispara el tick del job que lo contiene',
              envVars: [],
              launchers: [],
            },
            attributes: {
              mechanism: 'endpoint interno de reclamo/relevo',
              endpoints: [...new Set(calls)].sort().join(', '),
            },
          }),
        );
      }
    }
  }
  return out;
}

function libraryConsumer(
  file: SourceFile,
  index: number,
  mechanism: string,
  arg: string,
  hosts: string[],
): DiscoveredPiece {
  const base = file.path.replace(/^src\//, '').replace(/\.ts$/, '');
  const queue = arg.replace(/['"`{}\s]/g, '');
  return makePiece({
    id: `rtp.cola.${slug(mechanism)}.${slug(base.replace(/\//g, '.'))}.${slug(queue) || 'sin-nombre'}`,
    kind: 'CONSUMIDOR_COLA',
    name: `${mechanism} ${queue || '(sin nombre)'} en ${base}`,
    module: moduleOf(file.path),
    hosts,
    evidence: evidenceAt(file, index),
    heartbeat: heartbeatFor(hosts),
    attributes: { mechanism, target: queue || null },
  });
}
