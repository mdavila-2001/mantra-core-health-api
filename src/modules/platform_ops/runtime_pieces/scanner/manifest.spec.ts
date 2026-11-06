import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  MANIFEST_VERSION,
  parseManifest,
  readManifestFile,
  toManifest,
  writeManifestFile,
} from './manifest';
import { scanTree } from './runtime-piece-scanner';
import { SourceTree } from './source-tree';

const tree = SourceTree.fromMap({
  'src/main.ts': 'const app = await NestFactory.create(AppModule, {});',
  'src/app.module.ts': '@Module({})\nexport class AppModule {}',
  'src/worker-demo.ts': "void bootstrapWorker(DemoModule, 'demo');",
});
const scanned = scanTree(tree, '/r');
const NOW = new Date('2026-10-31T12:00:00.000Z');

describe('manifiesto del descubrimiento', () => {
  let dir: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'rtp-manifest-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('escribir y leer devuelve las mismas piezas, marcadas como del manifiesto y con su fecha', async () => {
    const path = join(dir, 'sub', 'm.json');
    await writeManifestFile(path, scanned, NOW);
    const back = await readManifestFile(path, '/r');
    expect(back).toMatchObject({
      available: true,
      source: 'manifest',
      generatedAt: NOW.toISOString(),
      reason: null,
    });
    expect(JSON.stringify(back?.pieces)).toBe(JSON.stringify(scanned.pieces));
    expect(JSON.parse(await readFile(path, 'utf8')).version).toBe(
      MANIFEST_VERSION,
    );
  });

  it('dos manifiestos del mismo código sólo difieren en la fecha', () => {
    const one = toManifest(scanned, NOW);
    const two = toManifest(scanned, new Date('2026-11-01T00:00:00.000Z'));
    expect({ ...one, generatedAt: '' }).toEqual({ ...two, generatedAt: '' });
  });

  it('un archivo ausente no es un manifiesto', async () => {
    expect(
      await readManifestFile(join(dir, 'no-existe.json'), '/r'),
    ).toBeNull();
  });

  type Editable = Record<string, unknown> & {
    pieces: Record<string, unknown>[];
  };
  const valid = () =>
    JSON.parse(JSON.stringify(toManifest(scanned, NOW))) as Editable;

  it.each([
    ['texto que no es JSON', () => 'no es json'],
    ['una lista en vez de un objeto', () => '[]'],
    [
      'otra versión del contrato',
      () => JSON.stringify({ ...valid(), version: 'otra/v9' }),
    ],
    [
      'una fecha que no es fecha',
      () => JSON.stringify({ ...valid(), generatedAt: 'ayer' }),
    ],
    [
      'piezas que no son una lista',
      () => JSON.stringify({ ...valid(), pieces: {} }),
    ],
    [
      'una pieza con un tipo inventado',
      () => {
        const m = valid();
        m.pieces[0].kind = 'INVENTADO';
        return JSON.stringify(m);
      },
    ],
    [
      'una pieza fuera del prefijo del registro',
      () => {
        const m = valid();
        m.pieces[0].id = 'otra.cosa';
        return JSON.stringify(m);
      },
    ],
    [
      'una pieza sin evidencia',
      () => {
        const m = valid();
        delete m.pieces[0].evidence;
        return JSON.stringify(m);
      },
    ],
    [
      'ids repetidos',
      () => {
        const m = valid();
        m.pieces.push({ ...m.pieces[0] });
        return JSON.stringify(m);
      },
    ],
  ])(
    'un manifiesto roto no se usa a medias: %s',
    async (_nombre, contenido) => {
      expect(parseManifest(contenido(), '/r')).toBeNull();
      const path = join(dir, 'roto.json');
      await writeFile(path, contenido(), 'utf8');
      expect(await readManifestFile(path, '/r')).toBeNull();
    },
  );
});
