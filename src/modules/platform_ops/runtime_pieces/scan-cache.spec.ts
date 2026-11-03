import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  SCAN_TTL_MS,
  ScanCache,
  discoverPieces,
  manifestPath,
} from './scan-cache';
import { writeManifestFile } from './scanner/manifest';
import { scanTree } from './scanner/runtime-piece-scanner';
import { SourceTree } from './scanner/source-tree';

const FILES = {
  'src/main.ts': 'const app = await NestFactory.create(AppModule, {});',
  'src/app.module.ts': '@Module({})\nexport class AppModule {}',
};

async function writeTree(
  root: string,
  files: Record<string, string>,
): Promise<void> {
  for (const [path, text] of Object.entries(files)) {
    await mkdir(join(root, path, '..'), { recursive: true });
    await writeFile(join(root, path), text, 'utf8');
  }
}

describe('de dónde sale el descubrimiento', () => {
  let root: string;
  const saved = { ...process.env };

  beforeEach(async () => {
    root = await mkdtemp(join(tmpdir(), 'rtp-root-'));
    process.env.RUNTIME_PIECES_SOURCE_ROOT = root;
    delete process.env.RUNTIME_PIECES_MANIFEST;
  });
  afterEach(async () => {
    process.env = { ...saved };
    await rm(root, { recursive: true, force: true });
  });

  it('con src/ lee el código en vivo', async () => {
    await writeTree(root, FILES);
    const result = await discoverPieces();
    expect(result).toMatchObject({
      available: true,
      source: 'live',
      generatedAt: null,
    });
    expect(result.pieces.map((p) => p.id)).toEqual(['rtp.proceso.api']);
  });

  it('sin src/ (una imagen con sólo dist/) usa el manifiesto de compilación y lo declara', async () => {
    await writeManifestFile(
      manifestPath(root),
      scanTree(SourceTree.fromMap(FILES), root),
      new Date('2026-10-30T20:00:00.000Z'),
    );
    const result = await discoverPieces();
    expect(result).toMatchObject({
      available: true,
      source: 'manifest',
      generatedAt: '2026-10-30T20:00:00.000Z',
    });
    expect(result.pieces.map((p) => p.id)).toEqual(['rtp.proceso.api']);
  });

  it('el código en vivo gana sobre un manifiesto viejo', async () => {
    await writeManifestFile(
      manifestPath(root),
      scanTree(
        SourceTree.fromMap({
          ...FILES,
          'src/worker-x.ts': "void bootstrapWorker(XModule, 'x');",
        }),
        root,
      ),
      new Date(),
    );
    await writeTree(root, FILES);
    const result = await discoverPieces();
    expect(result.source).toBe('live');
    expect(result.pieces.map((p) => p.id)).toEqual(['rtp.proceso.api']);
  });

  it('sin src/ y sin manifiesto: no disponible, con el motivo; nunca una lista vacía como resultado', async () => {
    const result = await discoverPieces();
    expect(result).toMatchObject({ available: false, pieces: [] });
    expect(result.reason).toContain('manifiesto');
  });

  it('un manifiesto roto tampoco se usa', async () => {
    await mkdir(join(root, 'dist'), { recursive: true });
    await writeFile(manifestPath(root), '{"version":"otra"}', 'utf8');
    expect((await discoverPieces()).available).toBe(false);
  });

  it('RUNTIME_PIECES_MANIFEST cambia dónde se busca', async () => {
    const elsewhere = join(root, 'otro', 'm.json');
    await writeManifestFile(
      elsewhere,
      scanTree(SourceTree.fromMap(FILES), root),
      new Date(),
    );
    process.env.RUNTIME_PIECES_MANIFEST = elsewhere;
    expect((await discoverPieces()).source).toBe('manifest');
  });

  describe('caché', () => {
    it('reutiliza el escaneo dentro de su vida, lo repite al vencer y `force` lo ignora', async () => {
      await writeTree(root, FILES);
      const cache = new ScanCache();
      const first = await cache.get(1_000);
      await writeTree(root, {
        'src/worker-x.ts': "void bootstrapWorker(XModule, 'x');",
      });
      expect(await cache.get(1_000 + SCAN_TTL_MS - 1)).toBe(first);
      expect(
        (await cache.get(1_000 + SCAN_TTL_MS)).pieces.map((p) => p.id),
      ).toContain('rtp.proceso.worker-x');
      await writeTree(root, {
        'src/worker-y.ts': "void bootstrapWorker(YModule, 'y');",
      });
      expect(
        (await cache.get(1_000 + SCAN_TTL_MS + 1, true)).pieces.map(
          (p) => p.id,
        ),
      ).toContain('rtp.proceso.worker-y');
    });

    it('dos lecturas simultáneas comparten una sola lectura de disco', async () => {
      await writeTree(root, FILES);
      const cache = new ScanCache();
      const [a, b] = await Promise.all([
        cache.get(5, true),
        cache.get(5, true),
      ]);
      expect(a).toBe(b);
    });
  });
});
