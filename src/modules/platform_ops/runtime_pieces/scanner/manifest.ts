import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  PIECE_KINDS,
  REGISTRY_CODE_PREFIX,
  type DiscoveredPiece,
  type ScanResult,
} from '../runtime-pieces.types';

/**
 * Manifiesto del descubrimiento: la misma lista del escáner, congelada al
 * compilar. Existe porque la imagen de producción sólo trae `dist/` (no `src/`
 * ni los compose): sin esto el escáner no vería nada en un contenedor y la
 * pantalla sólo mostraría lo ya registrado.
 */
export const MANIFEST_VERSION = 'runtime-pieces-manifest/v1';

export interface RuntimePiecesManifest {
  readonly version: typeof MANIFEST_VERSION;
  readonly generatedAt: string;
  readonly filesRead: number;
  readonly warnings: readonly string[];
  readonly pieces: readonly DiscoveredPiece[];
}

export function toManifest(
  result: ScanResult,
  now: Date,
): RuntimePiecesManifest {
  return {
    version: MANIFEST_VERSION,
    generatedAt: now.toISOString(),
    filesRead: result.filesRead,
    warnings: result.warnings,
    pieces: result.pieces,
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

function isPiece(value: unknown): value is DiscoveredPiece {
  if (!isRecord(value)) return false;
  const evidence = value.evidence;
  const heartbeat = value.heartbeat;
  const enable = value.enable;
  return (
    typeof value.id === 'string' &&
    value.id.startsWith(REGISTRY_CODE_PREFIX) &&
    typeof value.kind === 'string' &&
    (PIECE_KINDS as readonly string[]).includes(value.kind) &&
    typeof value.name === 'string' &&
    typeof value.module === 'string' &&
    Array.isArray(value.hosts) &&
    isRecord(evidence) &&
    typeof evidence.file === 'string' &&
    typeof evidence.line === 'number' &&
    isRecord(heartbeat) &&
    isRecord(enable) &&
    Array.isArray(enable.envVars) &&
    Array.isArray(enable.launchers) &&
    isRecord(value.attributes)
  );
}

/**
 * Interpreta el texto de un manifiesto. Devuelve `null` si no cumple el
 * contrato: un manifiesto roto no se usa a medias.
 */
export function parseManifest(text: string, root: string): ScanResult | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isRecord(parsed) || parsed.version !== MANIFEST_VERSION) return null;
  if (
    typeof parsed.generatedAt !== 'string' ||
    Number.isNaN(Date.parse(parsed.generatedAt))
  )
    return null;
  if (!Array.isArray(parsed.pieces) || !parsed.pieces.every(isPiece))
    return null;
  const ids = parsed.pieces.map((piece) => piece.id);
  if (new Set(ids).size !== ids.length) return null;
  return {
    available: true,
    source: 'manifest',
    generatedAt: parsed.generatedAt,
    reason: null,
    root,
    filesRead: typeof parsed.filesRead === 'number' ? parsed.filesRead : 0,
    pieces: parsed.pieces,
    warnings: Array.isArray(parsed.warnings)
      ? parsed.warnings.filter((w): w is string => typeof w === 'string')
      : [],
  };
}

export async function writeManifestFile(
  path: string,
  result: ScanResult,
  now: Date,
): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    `${JSON.stringify(toManifest(result, now), null, 2)}\n`,
    'utf8',
  );
}

/** `null` si el archivo no existe o no es un manifiesto válido. */
export async function readManifestFile(
  path: string,
  root: string,
): Promise<ScanResult | null> {
  try {
    return parseManifest(await readFile(path, 'utf8'), root);
  } catch {
    return null;
  }
}
