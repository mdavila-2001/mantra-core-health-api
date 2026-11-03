import { Injectable } from '@nestjs/common';
import { join } from 'node:path';
import { readManifestFile } from './scanner/manifest';
import { scanRuntimePieces } from './scanner/runtime-piece-scanner';
import type { ScanResult } from './runtime-pieces.types';

/** Cuánto vive un escaneo en memoria: leer ~5.000 archivos en cada petición no se justifica. */
export const SCAN_TTL_MS = 60_000;

/**
 * Raíz del repositorio a escanear: `RUNTIME_PIECES_SOURCE_ROOT` o el directorio
 * de trabajo del proceso. En una imagen que sólo trae `dist/` no hay `src/`:
 * entonces rige el manifiesto generado al compilar.
 */
export const sourceRoot = (): string =>
  (process.env.RUNTIME_PIECES_SOURCE_ROOT ?? '').trim() || process.cwd();

/** Dónde está el manifiesto: `RUNTIME_PIECES_MANIFEST` o `dist/runtime-pieces.manifest.json`. */
export const manifestPath = (root: string): string =>
  (process.env.RUNTIME_PIECES_MANIFEST ?? '').trim() ||
  join(root, 'dist', 'runtime-pieces.manifest.json');

/**
 * Lee el código en vivo; si no hay `src/`, el manifiesto de compilación. Si
 * tampoco hay manifiesto (o está roto) declara el escaneo no disponible con el
 * motivo: nunca devuelve una lista vacía como si fuera un resultado.
 */
export async function discoverPieces(): Promise<ScanResult> {
  const root = sourceRoot();
  const live = await scanRuntimePieces(root);
  if (live.available) return live;
  const manifest = await readManifestFile(manifestPath(root), root);
  if (manifest) return manifest;
  return {
    ...live,
    reason:
      `${live.reason ?? 'Sin código fuente.'} Tampoco hay un manifiesto de compilación válido ` +
      '(se genera al construir la imagen con runtime-pieces-manifest.cli).',
  };
}

@Injectable()
export class ScanCache {
  private cached: { at: number; result: ScanResult } | null = null;
  private inFlight: Promise<ScanResult> | null = null;

  async get(now: number, force = false): Promise<ScanResult> {
    if (!force && this.cached && now - this.cached.at < SCAN_TTL_MS) {
      return this.cached.result;
    }
    // Dos peticiones simultáneas comparten una sola lectura de disco.
    this.inFlight ??= discoverPieces().finally(() => {
      this.inFlight = null;
    });
    const result = await this.inFlight;
    this.cached = { at: now, result };
    return result;
  }
}
