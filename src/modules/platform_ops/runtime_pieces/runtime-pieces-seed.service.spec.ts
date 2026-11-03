import {
  ConflictException,
  PreconditionFailedException,
} from '../../../common';
import { PLATFORM_OPS } from '../platform_ops.concepts';
import { buildPurpose } from './domain/provenance';
import { RUNTIME_PIECE_KIND } from './runtime-pieces.concepts';
import type {
  InsertRow,
  RegistryRow,
  RuntimePiecesRepository,
  UpdateRow,
} from './runtime-pieces.repository';
import {
  RUNTIME_PIECES_TENANT_ID,
  RuntimePiecesSeedService,
  registryIdOf,
} from './runtime-pieces-seed.service';
import type { DiscoveredPiece, ScanResult } from './runtime-pieces.types';
import type { SqlPort } from './sql-port';

/**
 * DOBLE declarado: una tabla en memoria con las mismas reglas que
 * `RuntimePiecesRepository` (unicidad de `code`, actualización sólo si cambia).
 * Prueba la LÓGICA de idempotencia del seeder; la persistencia real contra
 * Postgres se ejerce en `test/integration/runtime-pieces.int-spec.ts`.
 */
class InMemoryRegistry {
  readonly rows = new Map<string, RegistryRow & { rowVersion: number }>();
  writes = 0;
  concepts = new Set<string>([
    ...Object.values(RUNTIME_PIECE_KIND),
    PLATFORM_OPS.TOOL_STATE_ACTIVE,
  ]);
  tenantExists = true;

  asRepository(): RuntimePiecesRepository {
    return {
      listRegistered: async () =>
        [...this.rows.values()].sort((a, b) => (a.code < b.code ? -1 : 1)),
      findByCode: async (_db: SqlPort, _t: string, code: string) =>
        this.rows.get(code) ?? null,
      existingConcepts: async (_db: SqlPort, ids: readonly string[]) =>
        new Set(ids.filter((id) => this.concepts.has(id))),
      tenantExists: async () => this.tenantExists,
      lockDiscovery: async () => undefined,
      insertIfAbsent: async (_db: SqlPort, row: InsertRow) => {
        if (this.rows.has(row.code)) return false;
        this.writes += 1;
        this.rows.set(row.code, {
          id: row.id,
          code: row.code,
          name: row.name,
          toolTypeConceptId: row.toolTypeConceptId,
          purpose: row.purpose,
          stateConceptId: row.stateConceptId,
          updatedAt: row.now,
          rowVersion: 1,
        });
        return true;
      },
      updateDerived: async (_db: SqlPort, row: UpdateRow) => {
        const current = this.rows.get(row.code);
        if (!current) return false;
        if (
          current.name === row.name &&
          current.toolTypeConceptId === row.toolTypeConceptId &&
          current.purpose === row.purpose
        ) {
          return false;
        }
        this.writes += 1;
        this.rows.set(row.code, {
          ...current,
          name: row.name,
          toolTypeConceptId: row.toolTypeConceptId,
          purpose: row.purpose,
          updatedAt: row.now,
          rowVersion: current.rowVersion + 1,
        });
        return true;
      },
    } as unknown as RuntimePiecesRepository;
  }
}

const db: SqlPort = {
  query: async () => [],
  transaction: async (work) => work(db),
};

const piece = (
  id: string,
  over: Partial<DiscoveredPiece> = {},
): DiscoveredPiece => ({
  id,
  kind: 'JOB_PROGRAMADO',
  name: id,
  module: 'demo',
  hosts: ['worker-demo'],
  schedule: null,
  enable: { how: 'x', envVars: [], launchers: [] },
  evidence: { file: `src/${id}.ts`, line: 3 },
  related: [],
  heartbeat: { mode: 'INHERITED', instanceId: 'worker-demo' },
  wired: true,
  attributes: {},
  ...over,
});

const scanOf = (
  pieces: DiscoveredPiece[],
  over: Partial<ScanResult> = {},
): ScanResult => ({
  available: true,
  source: 'live',
  generatedAt: null,
  reason: null,
  root: '/r',
  filesRead: 1,
  pieces,
  warnings: [],
  ...over,
});

const NOW = new Date('2026-10-31T10:00:00.000Z');
const LATER = new Date('2026-11-02T10:00:00.000Z');
const options = { actorUserId: null, now: NOW };

describe('RuntimePiecesSeedService (doble en memoria)', () => {
  let registry: InMemoryRegistry;
  let seed: RuntimePiecesSeedService;
  const pieces = () => [
    piece('rtp.job.a'),
    piece('rtp.job.b'),
    piece('rtp.conector.c', { kind: 'CONECTOR' }),
  ];

  beforeEach(() => {
    registry = new InMemoryRegistry();
    seed = new RuntimePiecesSeedService(registry.asRepository());
  });

  it('la primera corrida inserta todo, con id determinista, tipo, estado activo y procedencia', async () => {
    const report = await seed.run(db, scanOf(pieces()), options);
    expect(report).toMatchObject({
      created: 3,
      updated: 0,
      unchanged: 0,
      orphans: 0,
      conflicts: 0,
      scanned: 3,
      discoveredAt: '2026-10-31',
    });
    const row = registry.rows.get('rtp.job.a');
    expect(row?.id).toBe(registryIdOf('rtp.job.a'));
    expect(row?.toolTypeConceptId).toBe(RUNTIME_PIECE_KIND.JOB_PROGRAMADO);
    expect(row?.stateConceptId).toBe(PLATFORM_OPS.TOOL_STATE_ACTIVE);
    expect(row?.purpose).toContain('fuente: descubrimiento-estatico');
    expect(row?.purpose).toContain('evidencia: src/rtp.job.a.ts:3');
  });

  it('la SEGUNDA corrida no inserta ni cambia nada, ni siquiera en otro día', async () => {
    await seed.run(db, scanOf(pieces()), options);
    const snapshot = JSON.stringify([...registry.rows.entries()]);
    const writes = registry.writes;

    const second = await seed.run(db, scanOf(pieces()), {
      actorUserId: null,
      now: LATER,
    });
    expect(second).toMatchObject({ created: 0, updated: 0, unchanged: 3 });
    expect(registry.writes).toBe(writes);
    expect(JSON.stringify([...registry.rows.entries()])).toBe(snapshot);
  });

  it('si cambia lo descubierto (la línea de evidencia) sólo esa fila se actualiza y sube su versión', async () => {
    await seed.run(db, scanOf(pieces()), options);
    const moved = [
      piece('rtp.job.a', { evidence: { file: 'src/rtp.job.a.ts', line: 9 } }),
      piece('rtp.job.b'),
      piece('rtp.conector.c', { kind: 'CONECTOR' }),
    ];
    const report = await seed.run(db, scanOf(moved), {
      actorUserId: null,
      now: LATER,
    });
    expect(report).toMatchObject({
      created: 0,
      updated: 1,
      unchanged: 2,
      updatedIds: ['rtp.job.a'],
    });
    const row = registry.rows.get('rtp.job.a');
    expect(row?.rowVersion).toBe(2);
    expect(row?.purpose).toContain('evidencia: src/rtp.job.a.ts:9');
    expect(row?.purpose).toContain('descubierto: 2026-11-02');
    expect(registry.rows.get('rtp.job.b')?.rowVersion).toBe(1);
  });

  it('no pisa el estado que una persona le puso a la fila', async () => {
    await seed.run(db, scanOf(pieces()), options);
    const row = registry.rows.get('rtp.job.a')!;
    registry.rows.set('rtp.job.a', {
      ...row,
      stateConceptId: PLATFORM_OPS.TOOL_STATE_DISABLED,
    });
    await seed.run(
      db,
      scanOf([
        piece('rtp.job.a', { name: 'renombrada' }),
        piece('rtp.job.b'),
        piece('rtp.conector.c', { kind: 'CONECTOR' }),
      ]),
      { actorUserId: null, now: LATER },
    );
    expect(registry.rows.get('rtp.job.a')?.stateConceptId).toBe(
      PLATFORM_OPS.TOOL_STATE_DISABLED,
    );
    expect(registry.rows.get('rtp.job.a')?.name).toBe('renombrada');
  });

  it('lo que ya no existe en el código se informa como huérfano y NO se borra', async () => {
    await seed.run(db, scanOf(pieces()), options);
    const report = await seed.run(db, scanOf([piece('rtp.job.a')]), options);
    expect(report).toMatchObject({
      orphans: 2,
      orphanIds: ['rtp.conector.c', 'rtp.job.b'],
      unchanged: 1,
    });
    expect(registry.rows.size).toBe(3);
  });

  it('una fila rtp.* sin procedencia propia no se pisa: se informa como conflicto', async () => {
    registry.rows.set('rtp.job.a', {
      id: 'x',
      code: 'rtp.job.a',
      name: 'a mano',
      toolTypeConceptId: RUNTIME_PIECE_KIND.JOB_PROGRAMADO,
      purpose: 'la escribió una persona',
      stateConceptId: PLATFORM_OPS.TOOL_STATE_ACTIVE,
      updatedAt: NOW,
      rowVersion: 1,
    });
    const report = await seed.run(db, scanOf([piece('rtp.job.a')]), options);
    expect(report).toMatchObject({
      conflicts: 1,
      conflictIds: ['rtp.job.a'],
      created: 0,
      updated: 0,
    });
    expect(registry.rows.get('rtp.job.a')?.name).toBe('a mano');
  });

  it('dryRun calcula el efecto sin escribir nada', async () => {
    const report = await seed.run(db, scanOf(pieces()), {
      ...options,
      dryRun: true,
    });
    expect(report).toMatchObject({ dryRun: true, created: 3 });
    expect(registry.rows.size).toBe(0);
    expect(registry.writes).toBe(0);
  });

  it('si otro proceso inserta la misma fila a la vez, la alta no se cuenta como nuestra', async () => {
    const repo = registry.asRepository();
    const racing = {
      ...repo,
      insertIfAbsent: async () => false,
    } as unknown as RuntimePiecesRepository;
    const report = await new RuntimePiecesSeedService(racing).run(
      db,
      scanOf([piece('rtp.job.a')]),
      options,
    );
    expect(report.created).toBe(0);
  });

  describe('contrato inválido o precondiciones ausentes', () => {
    it('sin código fuente: 409 y no escribe (un escaneo vacío no puede declarar huérfano todo)', async () => {
      const scan = scanOf([], {
        available: false,
        reason: 'No hay código fuente',
      });
      await expect(seed.run(db, scan, options)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(registry.writes).toBe(0);
    });

    it('sin los conceptos del catálogo: 422 con el motivo, no una violación de FK cruda', async () => {
      registry.concepts.clear();
      const error = await seed
        .run(db, scanOf(pieces()), options)
        .catch((e: unknown) => e);
      expect(error).toBeInstanceOf(PreconditionFailedException);
      expect(
        JSON.stringify((error as PreconditionFailedException).getResponse()),
      ).toContain('RUNTIME_PIECES_CONCEPTS_MISSING');
      expect(registry.writes).toBe(0);
    });

    it('sin el tenant de plataforma: 422', async () => {
      registry.tenantExists = false;
      await expect(
        seed.run(db, scanOf(pieces()), options),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  it('el tenant dueño es el de plataforma por omisión', () => {
    expect(RUNTIME_PIECES_TENANT_ID).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('contenido del texto de procedencia', () => {
  it('buildPurpose es estable para la misma pieza y fecha', () => {
    expect(buildPurpose(piece('rtp.job.a'), '2026-10-31')).toBe(
      buildPurpose(piece('rtp.job.a'), '2026-10-31'),
    );
  });
});
