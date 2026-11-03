import { describe, it, expect } from '@jest/globals';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { FLOW_CATALOG } from './flows';
import {
  branchCaseCode,
  casesOf,
  countFlow,
  pathMatchesTemplate,
  suiteCode,
  traversalOrder,
  validateFlow,
  type FlowDefinition,
  type FlowNode,
} from './flow-catalog';

const CATALOG_DIR = join(
  process.cwd(),
  'src/modules/qa_lab/domain/flows/catalog',
);
const OPENAPI = JSON.parse(
  readFileSync(join(process.cwd(), 'openapi/openapi.json'), 'utf8'),
) as { paths: Record<string, Record<string, unknown>> };

const HAPPY = { kind: 'HAPPY_PATH', condition: 'c', expected: 'e' } as const;

function node(overrides: Partial<FlowNode> & { id: string }): FlowNode {
  return {
    kind: 'OUTCOME',
    title: 't',
    actor: 'PATIENT',
    sourceRef: 'ítem 1',
    branches: [],
    ...overrides,
  };
}

/** Un flujo mínimo válido: pantalla → llamada → fin. */
function valid(): FlowDefinition {
  return {
    id: '9.9',
    version: 1,
    module: '9 · Prueba',
    title: 'Prueba',
    source: { document: 'doc', section: 'sección' },
    actors: ['PATIENT'],
    frontRoutes: [],
    root: 'pantalla',
    openQuestions: [],
    nodes: [
      node({
        id: 'pantalla',
        kind: 'SCREEN',
        branches: [{ ...HAPPY, next: 'llamada', reason: 'pantalla' }],
      }),
      node({
        id: 'llamada',
        kind: 'API_CALL',
        endpoint: { method: 'GET', path: '/a/{id}/b' },
        branches: [
          {
            ...HAPPY,
            next: 'fin',
            qaCase: {
              method: 'GET',
              path: '/a/x/b',
              expectedStatus: 200,
              observedOn: '2026-10-17',
            },
          },
        ],
      }),
      node({ id: 'fin' }),
    ],
  };
}

const reasons = (flow: FlowDefinition) =>
  validateFlow(flow).map((v) => v.reason);

function withNodes(patch: (nodes: FlowNode[]) => FlowNode[]): FlowDefinition {
  const flow = valid();
  return { ...flow, nodes: patch([...flow.nodes]) };
}

describe('validateFlow', () => {
  it('acepta un flujo mínimo coherente', () => {
    expect(validateFlow(valid())).toEqual([]);
  });

  it('exige que el id sea un número de proceso del Registro', () => {
    expect(reasons({ ...valid(), id: 'agendar' })).toContain('FLOW_ID');
    expect(reasons({ ...valid(), id: '2' })).toContain('FLOW_ID');
  });

  it('detecta nodos repetidos, raíz inexistente y ramas colgantes', () => {
    const dup = withNodes((n) => [...n, node({ id: 'fin' })]);
    expect(reasons(dup)).toContain('DUPLICATE_NODE');
    expect(reasons({ ...valid(), root: 'nada' })).toContain('ROOT');
    const dangling = withNodes((n) => {
      n[0] = {
        ...n[0],
        branches: [{ ...HAPPY, next: 'no-existe', reason: 'r' }],
      };
      return n;
    });
    expect(reasons(dangling)).toContain('DANGLING_TARGET');
  });

  it('un API_CALL declara endpoint o gap, no los dos ni ninguno', () => {
    const none = withNodes((n) => {
      n[1] = { ...n[1], endpoint: undefined };
      return n;
    });
    expect(reasons(none)).toContain('API_CALL_SOURCE');
    const both = withNodes((n) => {
      n[1] = { ...n[1], gap: 'falta' };
      return n;
    });
    expect(reasons(both)).toContain('API_CALL_BOTH');
  });

  it('un API_CALL tiene exactamente una rama HAPPY_PATH', () => {
    const none = withNodes((n) => {
      n[1] = {
        ...n[1],
        branches: [{ ...n[1].branches[0], kind: 'NEGATIVE' }],
      };
      return n;
    });
    expect(reasons(none)).toContain('HAPPY_PATH_COUNT');
    const two = withNodes((n) => {
      n[1] = { ...n[1], branches: [n[1].branches[0], n[1].branches[0]] };
      return n;
    });
    expect(reasons(two)).toContain('HAPPY_PATH_COUNT');
  });

  it('una DECISION no llama a la API y cada rama lleva a otro nodo', () => {
    const withEndpoint = withNodes((n) => {
      n[0] = {
        ...n[0],
        kind: 'DECISION',
        endpoint: { method: 'GET', path: '/x' },
      };
      return n;
    });
    expect(reasons(withEndpoint)).toContain('DECISION_ENDPOINT');
    const noTarget = withNodes((n) => {
      n[0] = {
        ...n[0],
        kind: 'DECISION',
        branches: [{ ...HAPPY, reason: 'r' }],
      };
      return n;
    });
    expect(reasons(noTarget)).toContain('DECISION_BRANCH_TARGET');
  });

  it('un resultado final no tiene ramas y el resto sí', () => {
    const outcome = withNodes((n) => {
      n[2] = { ...n[2], branches: [{ ...HAPPY, reason: 'r' }] };
      return n;
    });
    expect(reasons(outcome)).toContain('OUTCOME_BRANCHES');
    const open = withNodes((n) => {
      n[0] = { ...n[0], branches: [] };
      return n;
    });
    expect(reasons(open)).toContain('NO_BRANCHES');
  });

  it('una rama sin caso de prueba dice por qué', () => {
    const silent = withNodes((n) => {
      n[0] = { ...n[0], branches: [{ ...HAPPY, next: 'llamada' }] };
      return n;
    });
    expect(reasons(silent)).toContain('NO_CASE_NO_REASON');
    const blank = withNodes((n) => {
      n[0] = {
        ...n[0],
        branches: [{ ...HAPPY, next: 'llamada', reason: '   ' }],
      };
      return n;
    });
    expect(reasons(blank)).toContain('NO_CASE_NO_REASON');
  });

  it('el caso de prueba coincide con el endpoint del nodo y no deja {parámetros}', () => {
    const base = valid();
    const patchCase = (qa: object) =>
      withNodes((n) => {
        const branch = n[1].branches[0];
        n[1] = {
          ...n[1],
          branches: [{ ...branch, qaCase: { ...branch.qaCase!, ...qa } }],
        };
        return n;
      });
    expect(base.nodes[1].branches[0].qaCase).toBeDefined();
    expect(reasons(patchCase({ method: 'POST' }))).toContain(
      'QA_ENDPOINT_METHOD',
    );
    expect(reasons(patchCase({ path: '/otra/cosa' }))).toContain(
      'QA_ENDPOINT_PATH',
    );
    expect(reasons(patchCase({ path: '/a/{id}/b' }))).toContain(
      'QA_PATH_TEMPLATE',
    );
    expect(reasons(patchCase({ expectedStatus: 999 }))).toContain('QA_STATUS');
    expect(reasons(patchCase({ observedOn: 'ayer' }))).toContain('QA_OBSERVED');
  });

  it('un ciclo por next es un error; un reintento con loopsTo no lo es', () => {
    const cycle = withNodes((n) => {
      n[2] = node({
        id: 'fin',
        kind: 'SCREEN',
        branches: [{ ...HAPPY, next: 'pantalla', reason: 'r' }],
      });
      return n;
    });
    expect(reasons(cycle)).toContain('CYCLE');
    const retry = withNodes((n) => {
      n[1] = {
        ...n[1],
        branches: [
          ...n[1].branches,
          {
            kind: 'NEGATIVE',
            condition: 'c',
            expected: 'e',
            loopsTo: 'pantalla',
            reason: 'r',
          },
        ],
      };
      return n;
    });
    expect(validateFlow(retry)).toEqual([]);
  });

  it('un nodo que no se alcanza desde la raíz es un resto de edición', () => {
    const orphan = withNodes((n) => [...n, node({ id: 'huerfano' })]);
    expect(reasons(orphan)).toContain('UNREACHABLE');
  });

  it('devuelve todas las violaciones, no sólo la primera', () => {
    const broken = {
      ...valid(),
      id: 'x',
      title: ' ',
      root: 'nada',
    } as FlowDefinition;
    expect(reasons(broken).length).toBeGreaterThanOrEqual(3);
  });
});

describe('pathMatchesTemplate', () => {
  it('casa los segmentos {parámetro} y respeta el resto', () => {
    expect(pathMatchesTemplate('/a/1/b', '/a/{id}/b')).toBe(true);
    expect(pathMatchesTemplate('/a/1/c', '/a/{id}/b')).toBe(false);
    expect(pathMatchesTemplate('/a/b', '/a/{id}/b')).toBe(false);
    expect(pathMatchesTemplate('/a/1/b?x=1', '/a/{id}/b')).toBe(true);
  });
});

describe('códigos y conteos', () => {
  it('numera los casos por tipo dentro del nodo, en el orden del artefacto', () => {
    const n = node({
      id: 'paso',
      kind: 'API_CALL',
      branches: [
        { ...HAPPY },
        { kind: 'NEGATIVE', condition: 'c', expected: 'e' },
        { kind: 'NEGATIVE', condition: 'c2', expected: 'e2' },
      ],
    });
    expect(suiteCode('2.7')).toBe('FLOW-2.7');
    expect(branchCaseCode('2.7', n, n.branches[0])).toBe(
      'FLOW-2.7-paso-HAPPY_PATH-01',
    );
    expect(branchCaseCode('2.7', n, n.branches[2])).toBe(
      'FLOW-2.7-paso-NEGATIVE-02',
    );
  });

  it('cuenta ramas y casos; casesOf devuelve sólo las ramas con caso', () => {
    const flow = valid();
    expect(countFlow(flow)).toMatchObject({
      nodes: 3,
      apiCalls: 1,
      gaps: 0,
      withCase: 1,
      withoutCase: 1,
    });
    expect(casesOf(flow).map((c) => c.code)).toEqual([
      'FLOW-9.9-llamada-HAPPY_PATH-01',
    ]);
  });
});

describe('catálogo real de flujos', () => {
  it('registra en el índice cada *.flow.json de la carpeta, y sólo esos', () => {
    const onDisk = readdirSync(CATALOG_DIR)
      .filter((f) => f.endsWith('.flow.json'))
      .map((f) => f.replace('.flow.json', ''))
      .sort();
    expect(FLOW_CATALOG.map((f) => f.id).sort()).toEqual(onDisk);
  });

  it.each(FLOW_CATALOG.map((f) => [f.id, f] as const))(
    'el flujo %s es válido',
    (_id, flow) => {
      expect(validateFlow(flow)).toEqual([]);
    },
  );

  it.each(FLOW_CATALOG.map((f) => [f.id, f] as const))(
    'el flujo %s sólo declara endpoints que existen en openapi.json',
    (_id, flow) => {
      const missing = flow.nodes
        .filter((n) => n.endpoint)
        .filter((n) => {
          const wanted = n.endpoint!.path.replace(/\{[^}]+\}/g, '{}');
          const found = Object.entries(OPENAPI.paths).some(
            ([path, ops]) =>
              path.replace(/\{[^}]+\}/g, '{}') === wanted &&
              n.endpoint!.method.toLowerCase() in ops,
          );
          return !found;
        })
        .map((n) => `${n.id}: ${n.endpoint!.method} ${n.endpoint!.path}`);
      expect(missing).toEqual([]);
    },
  );

  it.each(FLOW_CATALOG.map((f) => [f.id, f] as const))(
    'el flujo %s usa códigos de caso únicos',
    (_id, flow) => {
      const codes = casesOf(flow).map((c) => c.code);
      expect(new Set(codes).size).toBe(codes.length);
    },
  );

  it('el flujo 2.7 tiene las dos simulaciones (con y sin seguro)', () => {
    const flow = FLOW_CATALOG.find((f) => f.id === '2.7')!;
    const decision = flow.nodes.find((n) => n.id === 'decidir-seguro')!;
    expect(decision.kind).toBe('DECISION');
    expect(decision.branches).toHaveLength(2);
  });

  it('ningún caso lleva datos de una persona ni una credencial', () => {
    const text = JSON.stringify(FLOW_CATALOG);
    expect(text).not.toMatch(/authorization|bearer|password|@[a-z0-9-]+\./i);
  });
});

describe('traversalOrder y casesOf', () => {
  it('ordena en profundidad por next, una vez por nodo', () => {
    const flow = FLOW_CATALOG.find((f) => f.id === '1.3')!;
    const order = traversalOrder(flow).map((n) => n.id);
    expect(order[0]).toBe(flow.root);
    expect(new Set(order).size).toBe(flow.nodes.length);
    // La rama «hay cupo» se recorre completa antes que «lista de espera».
    expect(order.indexOf('confirmar-cita')).toBeLessThan(
      order.indexOf('lista-espera'),
    );
  });

  it('casesOf sigue el orden de recorrido y no repite códigos', () => {
    const flow = FLOW_CATALOG.find((f) => f.id === '1.3')!;
    const codes = casesOf(flow).map((c) => c.code);
    expect(codes[0]).toBe('FLOW-1.3-buscar-api-HAPPY_PATH-01');
    expect(new Set(codes).size).toBe(codes.length);
    expect(codes.length).toBe(
      flow.nodes.flatMap((n) => n.branches).filter((b) => b.qaCase).length,
    );
  });
});
