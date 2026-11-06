import { writeManifestFile } from './scanner/manifest';
import { scanRuntimePieces } from './scanner/runtime-piece-scanner';

/**
 * Genera el manifiesto del descubrimiento. Se corre al compilar, con el código
 * fuente delante, para que la imagen de producción (que sólo trae `dist/`)
 * conserve la lista de piezas:
 *
 *   node dist/src/modules/platform_ops/runtime_pieces/runtime-pieces-manifest.cli.js dist/runtime-pieces.manifest.json
 *
 * Sale con código 1 si no hay `src/`: un manifiesto vacío sería peor que ninguno.
 */
async function main(): Promise<void> {
  const out = process.argv[2] ?? 'dist/runtime-pieces.manifest.json';
  const result = await scanRuntimePieces(process.cwd());
  if (!result.available) {
    process.stderr.write(
      `No se generó el manifiesto: ${result.reason ?? 'sin código fuente'}\n`,
    );
    process.exit(1);
  }
  await writeManifestFile(out, result, new Date());
  process.stdout.write(
    `Manifiesto de piezas: ${result.pieces.length} piezas (${result.filesRead} archivos leídos) -> ${out}\n`,
  );
}

void main();
