import type {
  AttributeValue,
  EnableInfo,
  Evidence,
  HeartbeatBinding,
  PieceKind,
  PieceState,
  Provenance,
  Schedule,
} from '../runtime-pieces.types';
import type { EvidenceLevel, PieceCause } from './contrast';
import type { InstanceState } from '../../../ops_console/domain/instance-liveness';

/** Lo que el registro de herramientas sabe de la pieza. */
export interface RegistryInfo {
  readonly present: boolean;
  /** `true` si el estado de la fila es activo; `null` si no hay fila. */
  readonly active: boolean | null;
  readonly provenance: Provenance | null;
  /** `true` si la huella guardada ya no coincide con el código; `null` si no se puede comparar. */
  readonly stale: boolean | null;
}

/** Una pieza tal como la ve la pantalla: código + registro + latido contrastados. */
export interface PieceView {
  readonly id: string;
  readonly kind: PieceKind;
  readonly name: string;
  readonly module: string;
  readonly hosts: readonly string[];
  readonly schedule: Schedule | null;
  readonly enable: EnableInfo;
  readonly evidence: Evidence;
  readonly heartbeat: HeartbeatBinding;
  readonly wired: boolean | null;
  readonly attributes: Readonly<Record<string, AttributeValue>>;
  /** `null` cuando el código no está disponible y la fila sólo viene del registro. */
  readonly inCode: boolean | null;
  readonly state: PieceState;
  readonly cause: PieceCause;
  readonly causeDetail: string;
  readonly evidenceLevel: EvidenceLevel;
  readonly instanceState: InstanceState | null;
  /** Pesa en el veredicto global de la sonda (`OPS_LIVENESS_REQUIRED_WORKERS`); `null` si no aplica. */
  readonly required: boolean | null;
  readonly registry: RegistryInfo;
}

export const FINDING_SEVERITIES = ['ALTA', 'MEDIA', 'BAJA', 'INFO'] as const;
export type FindingSeverity = (typeof FINDING_SEVERITIES)[number];

export const FINDING_RULES = [
  'NO_REGISTRADA',
  'HUERFANA',
  'NO_CABLEADA',
  'SIN_LATIDO_REQUERIDA',
  'SIN_LATIDO',
  'FUERA_DE_SONDA',
  'NO_DESPLEGADA',
  'HUELLA_DESACTUALIZADA',
  'JOB_SIN_CONSUMIDOR',
  'SIN_PROCEDENCIA',
  'CODIGO_NO_DISPONIBLE',
] as const;
export type FindingRule = (typeof FINDING_RULES)[number];

export interface Finding {
  /** `<regla>:<pieza>`: estable entre corridas. */
  readonly id: string;
  readonly rule: FindingRule;
  readonly severity: FindingSeverity;
  readonly pieceId: string | null;
  readonly message: string;
}
