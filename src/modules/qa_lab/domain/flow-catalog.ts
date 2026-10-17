/**
 * Catálogo de flujos: el árbol de decisión de cada recorrido del usuario, con sus
 * pantallas, endpoints y casos válidos, límite e inválidos.
 *
 * Los flujos son artefactos JSON versionados (`flows/catalog/<id>.flow.json`), no
 * filas: lo que cuenta es lo que dice la **fuente** (el Registro de procesos del
 * stakeholder). Este módulo define su forma y las reglas que la hacen confiable;
 * son funciones puras, sin ORM ni HTTP.
 *
 * Reglas de oficio:
 *  - **No se inventa un paso.** Lo que la fuente pide y el sistema no tiene se
 *    declara con `gap` (el endpoint no existe) o en `openQuestions`.
 *  - **Una rama sin caso de prueba dice por qué** (`reason`): «sin correr» sin
 *    razón es una promesa vacía.
 *  - **El estado esperado de un caso es observado**, no supuesto: `observedOn` dice
 *    cuándo se vio contra una API real.
 *  - El vocabulario de las ramas es el de `qa_lab` (`caseType`): `HAPPY_PATH` =
 *    válido, `EDGE` = límite, `NEGATIVE` = inválido.
 */

export const FLOW_NODE_KINDS = [
  'SCREEN',
  'API_CALL',
  'DECISION',
  'OUTCOME',
] as const;
export type FlowNodeKind = (typeof FLOW_NODE_KINDS)[number];

export const FLOW_BRANCH_KINDS = ['HAPPY_PATH', 'EDGE', 'NEGATIVE'] as const;
export type FlowBranchKind = (typeof FLOW_BRANCH_KINDS)[number];

export const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;
export type FlowHttpMethod = (typeof HTTP_METHODS)[number];

export interface FlowEndpoint {
  readonly method: FlowHttpMethod;
  /** Plantilla del contrato (`/scheduling/slots/{id}/holds`), la misma de OpenAPI. */
  readonly path: string;
}

/** Una petición que el runner de QA puede ejecutar contra un destino aprobado. */
export interface FlowQaCase {
  readonly method: FlowHttpMethod;
  /** Ruta concreta: los `{parámetros}` ya sustituidos por valores inexistentes y fijos. */
  readonly path: string;
  readonly expectedStatus: number;
  readonly body?: unknown;
  readonly headers?: Readonly<Record<string, string>>;
  /** Día (`AAAA-MM-DD`) en que el estado esperado se observó contra una API real. */
  readonly observedOn: string;
}

export interface FlowBranch {
  readonly kind: FlowBranchKind;
  /** Cuándo ocurre, en palabras del negocio. */
  readonly condition: string;
  /** Qué debe pasar. */
  readonly expected: string;
  /** Nodo al que sigue el recorrido. */
  readonly next?: string;
  /** Vuelve a un nodo anterior (un reintento): no cuenta como ciclo. */
  readonly loopsTo?: string;
  readonly qaCase?: FlowQaCase;
  /** Por qué no hay caso: obligatorio cuando no hay `qaCase`. */
  readonly reason?: string;
}

export interface FlowNode {
  readonly id: string;
  readonly kind: FlowNodeKind;
  readonly title: string;
  readonly actor: string;
  /** Pantalla del front donde ocurre, si la hay. */
  readonly uiRoute?: string;
  readonly endpoint?: FlowEndpoint;
  /** Lo que la fuente pide aquí y el contrato no tiene: reemplaza a `endpoint`. */
  readonly gap?: string;
  readonly effects?: readonly string[];
  /** Dónde lo dice la fuente (número de ítem del Registro). */
  readonly sourceRef: string;
  readonly branches: readonly FlowBranch[];
}

export interface FlowDefinition {
  readonly id: string;
  readonly version: 1;
  /** Módulo del Registro (`2 · Médico`). */
  readonly module: string;
  readonly title: string;
  readonly source: { readonly document: string; readonly section: string };
  readonly actors: readonly string[];
  readonly frontRoutes: readonly string[];
  readonly root: string;
  readonly nodes: readonly FlowNode[];
  /** Lo que la fuente deja sin definir o que depende de una decisión que no es del equipo. */
  readonly openQuestions: readonly string[];
}

export interface FlowViolation {
  readonly nodeId?: string;
  readonly reason: string;
  readonly message: string;
}

const FLOW_ID = /^\d+\.\d+$/;
const NODE_ID = /^[a-z][a-z0-9-]*$/;
const OBSERVED_ON = /^\d{4}-\d{2}-\d{2}$/;

/** `/a/{id}/b` → expresión que casa `/a/<cualquier segmento>/b`. */
function templateToRegExp(template: string): RegExp {
  const source = template
    .split('/')
    .map((segment) =>
      /^\{[^}]+\}$/.test(segment)
        ? '[^/]+'
        : segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
    )
    .join('/');
  return new RegExp(`^${source}$`);
}

/** ¿La ruta concreta es una instancia de la plantilla? */
export function pathMatchesTemplate(path: string, template: string): boolean {
  return templateToRegExp(template).test(path.split('?')[0]);
}

/**
 * Reglas de forma y de coherencia de un flujo. Devuelve **todas** las violaciones,
 * no la primera: quien edita un flujo las arregla de una vez.
 */
export function validateFlow(flow: FlowDefinition): FlowViolation[] {
  const out: FlowViolation[] = [];
  const add = (reason: string, message: string, nodeId?: string) =>
    out.push({ reason, message, ...(nodeId ? { nodeId } : {}) });

  if (!FLOW_ID.test(flow.id))
    add(
      'FLOW_ID',
      `El id «${flow.id}» debe ser un número de proceso del Registro (p. ej. 2.7)`,
    );
  if (flow.version !== 1) add('VERSION', 'La única versión del formato es 1');
  if (!flow.title?.trim()) add('TITLE', 'El flujo necesita un título');
  if (!flow.source?.document || !flow.source?.section)
    add('SOURCE', 'El flujo debe citar su fuente (documento y sección)');

  const ids = new Map<string, FlowNode>();
  for (const node of flow.nodes) {
    if (!NODE_ID.test(node.id))
      add(
        'NODE_ID',
        `El id de nodo «${node.id}» debe ser minúsculas, números y guiones`,
        node.id,
      );
    if (ids.has(node.id))
      add('DUPLICATE_NODE', `El nodo «${node.id}» está repetido`, node.id);
    ids.set(node.id, node);
  }
  if (flow.nodes.length === 0) add('EMPTY', 'El flujo no tiene nodos');
  if (!ids.has(flow.root))
    add('ROOT', `La raíz «${flow.root}» no existe entre los nodos`);

  for (const node of flow.nodes) {
    if (!FLOW_NODE_KINDS.includes(node.kind))
      add(
        'NODE_KIND',
        `Tipo de nodo desconocido «${String(node.kind)}»`,
        node.id,
      );
    if (!node.title?.trim())
      add('NODE_TITLE', 'El nodo necesita un título', node.id);
    if (!node.sourceRef?.trim())
      add(
        'SOURCE_REF',
        'El nodo debe decir en qué ítem de la fuente se apoya',
        node.id,
      );

    if (node.kind === 'OUTCOME' && node.branches.length > 0)
      add('OUTCOME_BRANCHES', 'Un resultado final no tiene ramas', node.id);
    if (node.kind !== 'OUTCOME' && node.branches.length === 0)
      add(
        'NO_BRANCHES',
        'Un nodo que no es resultado final necesita al menos una rama',
        node.id,
      );

    if (node.kind === 'DECISION' && (node.endpoint || node.gap))
      add(
        'DECISION_ENDPOINT',
        'Una decisión no llama a ningún endpoint',
        node.id,
      );
    if (node.kind === 'API_CALL') {
      if (!node.endpoint && !node.gap)
        add(
          'API_CALL_SOURCE',
          'Una llamada a la API declara su endpoint o el `gap` que dice que no existe',
          node.id,
        );
      if (node.endpoint && node.gap)
        add(
          'API_CALL_BOTH',
          'Una llamada no puede tener a la vez endpoint y `gap`',
          node.id,
        );
      const happy = node.branches.filter((b) => b.kind === 'HAPPY_PATH');
      if (happy.length !== 1)
        add(
          'HAPPY_PATH_COUNT',
          `Una llamada a la API tiene exactamente una rama HAPPY_PATH (tiene ${happy.length})`,
          node.id,
        );
    }
    if (node.kind === 'SCREEN' && (node.endpoint || node.gap))
      add(
        'SCREEN_ENDPOINT',
        'Una pantalla no declara endpoint: lo hace la llamada que dispara',
        node.id,
      );
    if (node.endpoint && !HTTP_METHODS.includes(node.endpoint.method))
      add(
        'ENDPOINT_METHOD',
        `Método desconocido «${String(node.endpoint.method)}»`,
        node.id,
      );
    if (node.endpoint && !node.endpoint.path.startsWith('/'))
      add('ENDPOINT_PATH', 'La ruta del endpoint empieza con /', node.id);

    for (const branch of node.branches) {
      if (!FLOW_BRANCH_KINDS.includes(branch.kind))
        add(
          'BRANCH_KIND',
          `Tipo de rama desconocido «${String(branch.kind)}»`,
          node.id,
        );
      if (!branch.condition?.trim() || !branch.expected?.trim())
        add(
          'BRANCH_TEXT',
          'Cada rama dice cuándo ocurre y qué debe pasar',
          node.id,
        );
      for (const target of [branch.next, branch.loopsTo]) {
        if (target !== undefined && !ids.has(target))
          add(
            'DANGLING_TARGET',
            `La rama apunta a «${target}», que no existe`,
            node.id,
          );
      }
      if (
        node.kind === 'DECISION' &&
        branch.next === undefined &&
        branch.loopsTo === undefined
      )
        add(
          'DECISION_BRANCH_TARGET',
          'Cada rama de una decisión lleva a otro nodo',
          node.id,
        );
      if (!branch.qaCase && !branch.reason?.trim())
        add(
          'NO_CASE_NO_REASON',
          'Una rama sin caso de prueba dice por qué no lo tiene (`reason`)',
          node.id,
        );

      const qa = branch.qaCase;
      if (qa) {
        if (!HTTP_METHODS.includes(qa.method))
          add(
            'QA_METHOD',
            `Método de caso desconocido «${String(qa.method)}»`,
            node.id,
          );
        if (!qa.path.startsWith('/'))
          add(
            'QA_PATH',
            'La ruta del caso es concreta y empieza con /',
            node.id,
          );
        if (/\{[^}]+\}/.test(qa.path))
          add(
            'QA_PATH_TEMPLATE',
            'La ruta del caso ya no lleva {parámetros}: se sustituyen por valores fijos',
            node.id,
          );
        if (
          !Number.isInteger(qa.expectedStatus) ||
          qa.expectedStatus < 100 ||
          qa.expectedStatus > 599
        )
          add(
            'QA_STATUS',
            `Estado HTTP esperado inválido: ${String(qa.expectedStatus)}`,
            node.id,
          );
        if (!OBSERVED_ON.test(qa.observedOn))
          add(
            'QA_OBSERVED',
            'El caso dice el día en que se observó su estado (AAAA-MM-DD)',
            node.id,
          );
        if (node.endpoint) {
          if (qa.method !== node.endpoint.method)
            add(
              'QA_ENDPOINT_METHOD',
              `El caso usa ${qa.method} y el nodo declara ${node.endpoint.method}`,
              node.id,
            );
          if (!pathMatchesTemplate(qa.path, node.endpoint.path))
            add(
              'QA_ENDPOINT_PATH',
              `La ruta del caso «${qa.path}» no es una instancia de «${node.endpoint.path}»`,
              node.id,
            );
        } else {
          add(
            'QA_WITHOUT_ENDPOINT',
            'Un caso de prueba necesita que el nodo declare su endpoint',
            node.id,
          );
        }
      }
    }
  }

  // Ciclos: sólo `next` cuenta; `loopsTo` es un reintento declarado.
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string, trail: string[]): void => {
    const node = ids.get(id);
    if (!node) return;
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') {
      add(
        'CYCLE',
        `Ciclo por «next»: ${[...trail, id].join(' → ')}; un reintento se declara con «loopsTo»`,
        id,
      );
      return;
    }
    state.set(id, 'visiting');
    for (const branch of node.branches) {
      if (branch.next !== undefined) visit(branch.next, [...trail, id]);
    }
    state.set(id, 'done');
  };
  if (ids.has(flow.root)) visit(flow.root, []);

  // Alcanzabilidad desde la raíz (por next y loopsTo): un nodo suelto es un resto de edición.
  const reached = new Set<string>();
  const queue = ids.has(flow.root) ? [flow.root] : [];
  while (queue.length > 0) {
    const id = queue.pop()!;
    if (reached.has(id)) continue;
    reached.add(id);
    for (const branch of ids.get(id)?.branches ?? []) {
      for (const target of [branch.next, branch.loopsTo])
        if (target !== undefined) queue.push(target);
    }
  }
  for (const node of flow.nodes) {
    if (ids.has(flow.root) && !reached.has(node.id))
      add(
        'UNREACHABLE',
        `El nodo «${node.id}» no se alcanza desde la raíz`,
        node.id,
      );
  }
  return out;
}

export interface FlowCounts {
  readonly nodes: number;
  readonly apiCalls: number;
  readonly gaps: number;
  readonly branches: Readonly<Record<FlowBranchKind, number>>;
  readonly withCase: number;
  readonly withoutCase: number;
}

/** Cuántas ramas hay de cada tipo y cuántas tienen caso de prueba. */
export function countFlow(flow: FlowDefinition): FlowCounts {
  const branches = flow.nodes.flatMap((n) => n.branches);
  const byKind = (kind: FlowBranchKind) =>
    branches.filter((b) => b.kind === kind).length;
  return {
    nodes: flow.nodes.length,
    apiCalls: flow.nodes.filter((n) => n.kind === 'API_CALL').length,
    gaps: flow.nodes.filter((n) => n.gap !== undefined).length,
    branches: {
      HAPPY_PATH: byKind('HAPPY_PATH'),
      EDGE: byKind('EDGE'),
      NEGATIVE: byKind('NEGATIVE'),
    },
    withCase: branches.filter((b) => b.qaCase).length,
    withoutCase: branches.filter((b) => !b.qaCase).length,
  };
}

/**
 * Códigos estables de la suite y de cada caso en `qa_lab`:
 * `FLOW-<flujo>` y `FLOW-<flujo>-<nodo>-<KIND>-<nn>`. El `nn` cuenta las ramas del
 * mismo tipo dentro del nodo, en el orden del artefacto, así que reordenar el JSON
 * de un nodo renumera sus casos: se agregan ramas al final.
 */
export const suiteCode = (flowId: string): string => `FLOW-${flowId}`;

export function branchCaseCode(
  flowId: string,
  node: FlowNode,
  branch: FlowBranch,
): string {
  const index =
    node.branches.filter((b) => b.kind === branch.kind).indexOf(branch) + 1;
  return `FLOW-${flowId}-${node.id}-${branch.kind}-${String(index).padStart(2, '0')}`;
}

/** Los casos que el seed escribe: sólo las ramas con `qaCase`, en orden de recorrido. */
export function casesOf(flow: FlowDefinition): {
  readonly code: string;
  readonly nodeId: string;
  readonly branch: FlowBranch;
  readonly qaCase: FlowQaCase;
}[] {
  return flow.nodes.flatMap((node) =>
    node.branches
      .filter(
        (b): b is FlowBranch & { qaCase: FlowQaCase } => b.qaCase !== undefined,
      )
      .map((branch) => ({
        code: branchCaseCode(flow.id, node, branch),
        nodeId: node.id,
        branch,
        qaCase: branch.qaCase,
      })),
  );
}
