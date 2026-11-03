import type {
  InstanceEvaluation,
  InstanceState,
} from '../../../ops_console/domain/instance-liveness';
import type { RegistryRow } from '../runtime-pieces.repository';
import {
  PIECE_KINDS,
  PIECE_STATES,
  type DiscoveredPiece,
  type HeartbeatBinding,
  type HeartbeatMode,
  type PieceKind,
  type PieceState,
  type ScanResult,
} from '../runtime-pieces.types';
import { contrastPiece, explicitlyOff } from './contrast';
import { fingerprintOf, parseProvenance } from './provenance';
import type { PieceView } from './piece-view';

export interface AssembleInput {
  readonly scan: ScanResult;
  readonly registry: readonly RegistryRow[];
  /** Veredicto de la sonda por id de instancia (`api`, `worker-<dominio>`). */
  readonly liveness: ReadonlyMap<string, InstanceEvaluation>;
  /** Ids de instancia que pesan en el veredicto global (`OPS_LIVENESS_REQUIRED_WORKERS`). */
  readonly requiredInstances: ReadonlySet<string>;
  /** Estado de catálogo «activo» y tipo por concepto, para leer las filas. */
  readonly activeStateConceptId: string;
  readonly kindByConcept: ReadonlyMap<string, PieceKind>;
  /** Entorno del proceso que consulta: sólo se usa para interruptores de piezas de la API. */
  readonly env: Readonly<Record<string, string | undefined>>;
}

const isKind = (value: string): value is PieceKind =>
  (PIECE_KINDS as readonly string[]).includes(value);

/** Une código, registro y latidos en una vista por pieza. Pura. */
export function assemblePieces(input: AssembleInput): PieceView[] {
  const registryByCode = new Map(input.registry.map((row) => [row.code, row]));
  const views: PieceView[] = [];
  const seen = new Set<string>();

  for (const piece of input.scan.pieces) {
    seen.add(piece.id);
    views.push(viewOfCode(piece, registryByCode.get(piece.id), input));
  }
  for (const row of input.registry) {
    if (seen.has(row.code)) continue;
    const view = viewOfRegistryOnly(row, input);
    if (view) views.push(view);
  }
  return views.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

function viewOfCode(
  piece: DiscoveredPiece,
  row: RegistryRow | undefined,
  input: AssembleInput,
): PieceView {
  const provenance = row ? parseProvenance(row.purpose) : null;
  const liveness = livenessOf(piece.heartbeat, piece.hosts, input.liveness);
  const onlyApi = piece.hosts.length === 1 && piece.hosts[0] === 'api';
  const verdict = contrastPiece({
    codeScanAvailable: true,
    inCode: true,
    inRegistry: row !== undefined,
    registryActive: row
      ? row.stateConceptId === input.activeStateConceptId
      : null,
    heartbeat: piece.heartbeat,
    liveness,
    flagOff: onlyApi ? explicitlyOff(piece.enable.envVars, input.env) : null,
  });
  return {
    id: piece.id,
    kind: piece.kind,
    name: piece.name,
    module: piece.module,
    hosts: piece.hosts,
    schedule: piece.schedule,
    enable: piece.enable,
    evidence: piece.evidence,
    heartbeat: piece.heartbeat,
    wired: piece.wired,
    attributes: piece.attributes,
    inCode: true,
    ...verdict,
    required: requiredOf(piece.heartbeat, piece.hosts, input.requiredInstances),
    registry: {
      present: row !== undefined,
      active: row ? row.stateConceptId === input.activeStateConceptId : null,
      provenance,
      stale: provenance
        ? provenance.fingerprint !== fingerprintOf(piece)
        : null,
    },
  };
}

function viewOfRegistryOnly(
  row: RegistryRow,
  input: AssembleInput,
): PieceView | null {
  const provenance = parseProvenance(row.purpose);
  const kind =
    input.kindByConcept.get(row.toolTypeConceptId) ??
    (provenance && isKind(provenance.kind) ? provenance.kind : null);
  if (kind === null) return null;
  const scanAvailable = input.scan.available;
  const heartbeat = parseHeartbeat(provenance?.heartbeat);
  const liveness = livenessOf(heartbeat, [], input.liveness);
  const active = row.stateConceptId === input.activeStateConceptId;
  const verdict = contrastPiece({
    codeScanAvailable: scanAvailable,
    inCode: false,
    inRegistry: true,
    registryActive: active,
    heartbeat,
    liveness,
    flagOff: null,
  });
  return {
    id: row.code,
    kind,
    name: row.name,
    module: '—',
    hosts: [],
    schedule: null,
    enable: {
      how: 'sin datos: no está en el código',
      envVars: [],
      launchers: [],
    },
    evidence: parseEvidence(provenance?.evidence),
    heartbeat,
    wired: null,
    attributes: {},
    inCode: scanAvailable ? false : null,
    ...verdict,
    required: requiredOf(heartbeat, [], input.requiredInstances),
    registry: { present: true, active, provenance, stale: null },
  };
}

const STATE_RANK: Readonly<Record<InstanceState, number>> = {
  VIVA: 0,
  DEGRADADA: 1,
  CAIDA: 2,
  SIN_DATO: 3,
};

/**
 * La instancia que decide el estado de la pieza. Una pieza alojada en un solo
 * proceso usa el suyo; si la alojan varios (el mismo job en dos workers), basta
 * que UNO viva: se elige la mejor de sus instancias, no la primera al azar.
 */
function livenessOf(
  heartbeat: HeartbeatBinding,
  hosts: readonly string[],
  liveness: ReadonlyMap<string, InstanceEvaluation>,
): InstanceEvaluation | null {
  if (heartbeat.mode === 'NONE') return null;
  if (heartbeat.instanceId !== null)
    return liveness.get(heartbeat.instanceId) ?? null;
  const candidates = hosts
    .map((host) => liveness.get(host))
    .filter((e): e is InstanceEvaluation => e !== undefined);
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) =>
      STATE_RANK[a.state] - STATE_RANK[b.state] || (a.id < b.id ? -1 : 1),
  )[0];
}

function requiredOf(
  heartbeat: HeartbeatBinding,
  hosts: readonly string[],
  required: ReadonlySet<string>,
): boolean | null {
  if (heartbeat.mode === 'NONE') return null;
  if (heartbeat.instanceId !== null) return required.has(heartbeat.instanceId);
  return hosts.length > 0 ? hosts.some((host) => required.has(host)) : null;
}

const HEARTBEAT_MODES: readonly HeartbeatMode[] = [
  'PROCESS',
  'SELF',
  'INHERITED',
  'NONE',
];

function parseHeartbeat(text: string | undefined): HeartbeatBinding {
  const [mode, instance] = (text ?? 'NONE:-').split(':');
  return {
    mode: (HEARTBEAT_MODES as readonly string[]).includes(mode)
      ? (mode as HeartbeatMode)
      : 'NONE',
    instanceId: instance && instance !== '-' ? instance : null,
  };
}

function parseEvidence(text: string | undefined): {
  file: string;
  line: number;
} {
  const at = (text ?? '').lastIndexOf(':');
  if (at <= 0) return { file: text ?? '', line: 0 };
  const line = Number(text?.slice(at + 1));
  return {
    file: (text as string).slice(0, at),
    line: Number.isInteger(line) ? line : 0,
  };
}

export type StateCounts = Readonly<Record<PieceState, number>>;

export interface Summary {
  readonly total: number;
  readonly byState: StateCounts;
  readonly byKind: Readonly<Record<PieceKind, number>>;
}

export function summarize(views: readonly PieceView[]): Summary {
  const byState = Object.fromEntries(PIECE_STATES.map((s) => [s, 0])) as Record<
    PieceState,
    number
  >;
  const byKind = Object.fromEntries(PIECE_KINDS.map((k) => [k, 0])) as Record<
    PieceKind,
    number
  >;
  for (const view of views) {
    byState[view.state] += 1;
    byKind[view.kind] += 1;
  }
  return { total: views.length, byState, byKind };
}

export interface InstanceView {
  readonly id: string;
  readonly label: string;
  readonly type: InstanceEvaluation['type'];
  readonly required: boolean;
  readonly state: InstanceState;
  readonly cause: InstanceEvaluation['cause'];
  readonly causeDetail: string;
  readonly lastHeartbeatAt: string | null;
  readonly ageSeconds: number | null;
  readonly startedAt: string | null;
  readonly reportedStatus: InstanceEvaluation['evidence']['reportedStatus'];
  /** Piezas que el código dice que corren dentro de esta instancia. */
  readonly pieceCount: number;
  readonly piecesByKind: Readonly<Partial<Record<PieceKind, number>>>;
}

/** Instancias (API y workers) con lo que aloja cada una. Sin sondas de infraestructura. */
export function instancesOf(
  evaluations: readonly InstanceEvaluation[],
  views: readonly PieceView[],
): InstanceView[] {
  return evaluations
    .filter((e) => e.type === 'API' || e.type === 'WORKER')
    .map((e) => {
      const hosted = views.filter((v) => v.hosts.includes(e.id));
      const piecesByKind: Partial<Record<PieceKind, number>> = {};
      for (const v of hosted)
        piecesByKind[v.kind] = (piecesByKind[v.kind] ?? 0) + 1;
      return {
        id: e.id,
        label: e.label,
        type: e.type,
        required: e.required,
        state: e.state,
        cause: e.cause,
        causeDetail: e.causeDetail,
        lastHeartbeatAt: e.lastHeartbeatAt,
        ageSeconds: e.ageSeconds,
        startedAt: e.evidence.startedAt,
        reportedStatus: e.evidence.reportedStatus,
        pieceCount: hosted.length,
        piecesByKind,
      };
    });
}
