import { Inject, Injectable } from '@nestjs/common';
import {
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import {
  evaluateInstance,
  type InstanceEvaluation,
} from '../../ops_console/domain/instance-liveness';
import type { InstanceLivenessEnv } from '../../ops_console/domain/instance-liveness.env';
import { buildInstanceRegistry } from '../../ops_console/domain/instance-registry';
import { PLATFORM_OPS } from '../platform_ops.concepts';
import { assemblePieces, instancesOf, summarize } from './domain/assemble';
import { findingsOf } from './domain/findings';
import type { Finding, PieceView } from './domain/piece-view';
import { HeartbeatReader } from './heartbeat-reader';
import type {
  DiscoverRuntimePiecesDto,
  RuntimePiecesQueryDto,
} from './runtime-pieces.dto';
import { RuntimePiecesErrorReason } from './runtime-pieces.error-reasons';
import { RuntimePiecesRepository } from './runtime-pieces.repository';
import {
  KIND_BY_CONCEPT,
  RUNTIME_PIECES_TENANT_ID,
  RuntimePiecesSeedService,
} from './runtime-pieces-seed.service';
import { ScanCache } from './scan-cache';
import type { SqlPort } from './sql-port';

export const RUNTIME_PIECES_SQL = Symbol('RUNTIME_PIECES_SQL');
export const RUNTIME_PIECES_LIVENESS_ENV = Symbol(
  'RUNTIME_PIECES_LIVENESS_ENV',
);
export const RUNTIME_PIECES_CLOCK = Symbol('RUNTIME_PIECES_CLOCK');

/** Lo que esta lectura NO mide; viaja en la respuesta para que no se lea como «todo bien». */
export const NOT_MEASURED: readonly string[] = [
  'TICK_INDIVIDUAL: sólo se observa el latido del proceso anfitrión, no que cada tick corra',
  'REPLICAS: varias réplicas de un mismo worker comparten identificador y no se distinguen',
  'CODIGO_DINAMICO: rutas, jobs o cron que se arman en tiempo de ejecución sin literal en el código no los ve el escáner estático',
  'ENTORNO_DE_OTROS_PROCESOS: los interruptores de las piezas que corren en workers se leen del código, no del entorno de ese worker',
];

interface Snapshot {
  readonly now: Date;
  readonly views: readonly PieceView[];
  readonly evaluations: readonly InstanceEvaluation[];
  readonly findings: readonly Finding[];
  readonly scanAvailable: boolean;
  readonly scanReason: string | null;
  readonly scanSource: 'live' | 'manifest';
  readonly scanGeneratedAt: string | null;
  readonly filesRead: number;
  readonly warnings: readonly string[];
  readonly store: { status: 'up' | 'down'; reason: string | null };
}

@Injectable()
export class RuntimePiecesService {
  constructor(
    private readonly scans: ScanCache,
    private readonly repo: RuntimePiecesRepository,
    private readonly heartbeats: HeartbeatReader,
    private readonly seed: RuntimePiecesSeedService,
    @Inject(RUNTIME_PIECES_SQL) private readonly sql: SqlPort,
    @Inject(RUNTIME_PIECES_LIVENESS_ENV)
    private readonly livenessEnv: InstanceLivenessEnv,
    @Inject(RUNTIME_PIECES_CLOCK) private readonly clock: () => Date,
  ) {}

  /** `GET /admin/ops/runtime-pieces`. */
  async list(query: RuntimePiecesQueryDto) {
    const snapshot = await this.snapshot();
    const withFinding = new Set(
      snapshot.findings
        .map((f) => f.pieceId)
        .filter((id): id is string => id !== null),
    );
    const needle = query.q?.trim().toLowerCase();
    const filtered = snapshot.views.filter(
      (v) =>
        (!query.kind || v.kind === query.kind) &&
        (!query.state || v.state === query.state) &&
        (!query.host || v.hosts.includes(query.host)) &&
        (!query.module || v.module === query.module) &&
        (!query.withFindings || withFinding.has(v.id)) &&
        (!needle ||
          v.id.toLowerCase().includes(needle) ||
          v.name.toLowerCase().includes(needle) ||
          v.evidence.file.toLowerCase().includes(needle)),
    );
    const start = (query.page - 1) * query.pageSize;
    const { thresholds } = this.livenessEnv;
    return {
      data: filtered.slice(start, start + query.pageSize),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / query.pageSize),
      },
      evaluatedAt: snapshot.now.toISOString(),
      summary: summarize(snapshot.views),
      scan: {
        available: snapshot.scanAvailable,
        source: snapshot.scanSource,
        generatedAt: snapshot.scanGeneratedAt,
        reason: snapshot.scanReason,
        filesRead: snapshot.filesRead,
        warnings: snapshot.warnings,
      },
      heartbeatStore: snapshot.store,
      thresholds: {
        workerHeartbeatIntervalSeconds: Math.floor(
          thresholds.workerHeartbeatIntervalMs / 1000,
        ),
        degradedAfterSeconds: Math.floor(thresholds.degradedAfterMs / 1000),
        downAfterSeconds: Math.floor(thresholds.downAfterMs / 1000),
      },
      instances: instancesOf(snapshot.evaluations, snapshot.views),
      findings: snapshot.findings,
      notMeasured: [...NOT_MEASURED],
    };
  }

  /** `GET /admin/ops/runtime-pieces/:id`. */
  async get(id: string) {
    const snapshot = await this.snapshot();
    const view = snapshot.views.find((v) => v.id === id);
    if (!view) {
      throw new ResourceNotFoundException(
        'Pieza no encontrada',
        { id },
        RuntimePiecesErrorReason.RUNTIME_PIECE_NOT_FOUND,
      );
    }
    return {
      ...view,
      evaluatedAt: snapshot.now.toISOString(),
      findings: snapshot.findings.filter((f) => f.pieceId === id),
      launchers: view.enable.launchers,
    };
  }

  /** `POST /admin/ops/runtime-pieces/discover`. */
  async discover(dto: DiscoverRuntimePiecesDto, actor: AuthenticatedUser) {
    const now = this.clock();
    const scan = await this.scans.get(now.getTime(), true);
    const report = await this.seed.run(this.sql, scan, {
      actorUserId: actor.id,
      now,
      dryRun: dto.dryRun === true,
    });
    return { ...report, warnings: [...scan.warnings] };
  }

  private async snapshot(): Promise<Snapshot> {
    const now = this.clock();
    const scan = await this.scans.get(now.getTime());
    const registry = await this.sql.transaction((tx) =>
      this.repo.listRegistered(tx, RUNTIME_PIECES_TENANT_ID),
    );
    const beats = await this.heartbeats.read();
    const definitions = buildInstanceRegistry(this.livenessEnv.requiredWorkers);
    const apiStartedAt = new Date(
      now.getTime() - process.uptime() * 1000,
    ).toISOString();
    const evaluations = definitions.map((definition) =>
      evaluateInstance(definition, {
        now: now.getTime(),
        thresholds: this.livenessEnv.thresholds,
        heartbeats: beats.records,
        probes: {},
        apiStartedAt,
      }),
    );
    const views = assemblePieces({
      scan,
      registry,
      liveness: new Map(evaluations.map((e) => [e.id, e])),
      requiredInstances: new Set(
        definitions.filter((d) => d.required).map((d) => d.id),
      ),
      activeStateConceptId: PLATFORM_OPS.TOOL_STATE_ACTIVE,
      kindByConcept: KIND_BY_CONCEPT,
      env: process.env,
    });
    return {
      now,
      views,
      evaluations,
      findings: findingsOf(views, scan.available),
      scanAvailable: scan.available,
      scanReason: scan.reason,
      scanSource: scan.source,
      scanGeneratedAt: scan.generatedAt,
      filesRead: scan.filesRead,
      warnings: scan.warnings,
      store: { status: beats.status, reason: beats.reason },
    };
  }
}
