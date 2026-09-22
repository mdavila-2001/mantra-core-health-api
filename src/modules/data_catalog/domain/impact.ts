/**
 * Análisis de impacto sobre relaciones estructurales observadas (claves
 * foráneas). Responde "si cambio o elimino esta tabla, qué otras dependen de
 * ella" (downstream) y "de qué depende ella" (upstream).
 *
 * Una FK es una relación estructural, no un flujo de datos: las aristas se
 * etiquetan así y el resultado declara su alcance. Si se corta por
 * profundidad o por tope de nodos, lo dice (`truncated`): un resultado
 * incompleto nunca se presenta como "no hay más impacto".
 */

export interface FkEdge {
  /** Tabla que contiene la FK (la que depende). */
  fromObjectId: string;
  fromColumns: string[];
  /** Tabla referenciada. */
  toObjectId: string;
  toColumns: string[];
  constraintName: string;
}

export type Direction = 'downstream' | 'upstream' | 'both';

export interface ImpactNode {
  objectId: string;
  depth: number;
}

export interface ImpactEdge extends FkEdge {
  kind: 'REFERENCES';
  provenance: 'STRUCTURAL_FK_OBSERVED';
}

export interface ImpactResult {
  root: string;
  direction: Direction;
  maxDepth: number;
  nodes: ImpactNode[];
  edges: ImpactEdge[];
  truncated: boolean;
  truncatedReason: 'MAX_DEPTH' | 'MAX_NODES' | null;
  scope: string;
}

export const MAX_IMPACT_DEPTH = 5;
export const MAX_IMPACT_NODES = 200;

/**
 * Recorrido en anchura desde la raíz. Cada nodo aparece una vez (ciclos y
 * autorreferencias no hacen bucle) con su distancia mínima.
 */
export function impactOf(
  root: string,
  edges: readonly FkEdge[],
  direction: Direction,
  maxDepth: number,
  maxNodes: number = MAX_IMPACT_NODES,
): ImpactResult {
  const depthLimit = Math.max(1, Math.min(maxDepth, MAX_IMPACT_DEPTH));
  // downstream: quién me referencia (from → to = yo). upstream: a quién referencio.
  const dependents = new Map<string, FkEdge[]>();
  const dependencies = new Map<string, FkEdge[]>();
  for (const edge of edges) {
    (
      dependents.get(edge.toObjectId) ??
      dependents.set(edge.toObjectId, []).get(edge.toObjectId)!
    ).push(edge);
    (
      dependencies.get(edge.fromObjectId) ??
      dependencies.set(edge.fromObjectId, []).get(edge.fromObjectId)!
    ).push(edge);
  }

  const seen = new Map<string, number>([[root, 0]]);
  const collected = new Map<string, ImpactEdge>();
  let frontier = [root];
  let truncatedReason: ImpactResult['truncatedReason'] = null;

  for (let depth = 1; frontier.length > 0; depth += 1) {
    const next: string[] = [];
    for (const current of frontier) {
      const neighbours: Array<{ edge: FkEdge; other: string }> = [];
      if (direction !== 'upstream') {
        for (const edge of dependents.get(current) ?? [])
          neighbours.push({ edge, other: edge.fromObjectId });
      }
      if (direction !== 'downstream') {
        for (const edge of dependencies.get(current) ?? [])
          neighbours.push({ edge, other: edge.toObjectId });
      }
      for (const { edge, other } of neighbours) {
        if (depth > depthLimit) {
          if (!seen.has(other)) truncatedReason ??= 'MAX_DEPTH';
          continue;
        }
        collected.set(`${edge.fromObjectId}|${edge.constraintName}`, {
          ...edge,
          kind: 'REFERENCES',
          provenance: 'STRUCTURAL_FK_OBSERVED',
        });
        if (seen.has(other)) continue;
        if (seen.size >= maxNodes) {
          truncatedReason ??= 'MAX_NODES';
          continue;
        }
        seen.set(other, depth);
        next.push(other);
      }
    }
    frontier = next;
  }

  const nodes = [...seen.entries()].map(([objectId, depth]) => ({
    objectId,
    depth,
  }));
  const kept = new Set(nodes.map((node) => node.objectId));
  return {
    root,
    direction,
    maxDepth: depthLimit,
    nodes,
    edges: [...collected.values()].filter(
      (edge) => kept.has(edge.fromObjectId) && kept.has(edge.toObjectId),
    ),
    truncated: truncatedReason !== null,
    truncatedReason,
    scope:
      'Sólo claves foráneas observadas en la base. No incluye dependencias por código, vistas, jobs, reportes ni integraciones: la ausencia de aristas no prueba ausencia de impacto.',
  };
}
