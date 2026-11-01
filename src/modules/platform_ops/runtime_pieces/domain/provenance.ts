import { createHash } from 'node:crypto';
import {
  PROVENANCE_SOURCE,
  type DiscoveredPiece,
  type Provenance,
} from '../runtime-pieces.types';

/** Quién figura como «proveedor» de la fila: el repositorio del que se leyó. */
export const REGISTRY_VENDOR = 'mantra-core-health-api';

/** Separa la descripción humana del bloque de procedencia dentro de `purpose`. */
const SEPARATOR = '\n--\n';

/** JSON con claves ordenadas: la misma pieza da siempre los mismos bytes. */
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => (a < b ? -1 : a > b ? 1 : 0),
    );
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`).join(',')}}`;
  }
  return JSON.stringify(value) ?? 'null';
}

/**
 * Huella del contenido descubierto: todo lo que la pieza afirma, incluida la
 * evidencia `archivo:línea`. Si cambia algo de eso, cambia la huella y el
 * registro se actualiza; si no cambia nada, el registro no se toca.
 */
export function fingerprintOf(piece: DiscoveredPiece): string {
  return createHash('sha256')
    .update(canonical(piece))
    .digest('hex')
    .slice(0, 16);
}

export const evidenceText = (piece: DiscoveredPiece): string =>
  `${piece.evidence.file}:${piece.evidence.line}`;

export const heartbeatText = (piece: DiscoveredPiece): string =>
  `${piece.heartbeat.mode}:${piece.heartbeat.instanceId ?? '-'}`;

/** Texto que se guarda en `tool_registry.purpose`: descripción + procedencia. */
export function buildPurpose(
  piece: DiscoveredPiece,
  discoveredAt: string,
): string {
  const summary = `${piece.kind}: ${piece.name}. ${piece.enable.how}.`;
  const lines = [
    `fuente: ${PROVENANCE_SOURCE}`,
    `tipo: ${piece.kind}`,
    `evidencia: ${evidenceText(piece)}`,
    `descubierto: ${discoveredAt}`,
    `huella: ${fingerprintOf(piece)}`,
    `latido: ${heartbeatText(piece)}`,
  ];
  return `${summary}${SEPARATOR}${lines.join('\n')}`;
}

/** Lee la procedencia de `purpose`; `null` si la fila no la trae (la creó otra mano). */
export function parseProvenance(
  purpose: string | null | undefined,
): Provenance | null {
  if (!purpose) return null;
  const at = purpose.indexOf(SEPARATOR);
  if (at < 0) return null;
  const fields = new Map<string, string>();
  for (const line of purpose.slice(at + SEPARATOR.length).split('\n')) {
    const colon = line.indexOf(': ');
    if (colon > 0) fields.set(line.slice(0, colon), line.slice(colon + 2));
  }
  const source = fields.get('fuente');
  const fingerprint = fields.get('huella');
  if (source !== PROVENANCE_SOURCE || !fingerprint) return null;
  return {
    source,
    evidence: fields.get('evidencia') ?? '',
    discoveredAt: fields.get('descubierto') ?? '',
    fingerprint,
    kind: fields.get('tipo') ?? '',
    heartbeat: fields.get('latido') ?? '-:-',
  };
}

/**
 * Lo que se escribe en `tool_registry` por una pieza. El `purpose` lleva la
 * fecha de descubrimiento; por eso la comparación para decidir si hay que
 * actualizar usa la HUELLA, nunca el texto completo (la fecha cambiaría sola).
 */
export interface RegistryRowDraft {
  readonly code: string;
  readonly name: string;
  readonly vendor: string;
  readonly purpose: string;
  readonly kind: DiscoveredPiece['kind'];
}

export function draftFor(
  piece: DiscoveredPiece,
  discoveredAt: string,
): RegistryRowDraft {
  return {
    code: piece.id,
    name: piece.name,
    vendor: REGISTRY_VENDOR,
    purpose: buildPurpose(piece, discoveredAt),
    kind: piece.kind,
  };
}
