import type { InstanceEvaluation } from '../../../ops_console/domain/instance-liveness';
import { PLATFORM_OPS } from '../../platform_ops.concepts';
import { RUNTIME_PIECE_KIND } from '../runtime-pieces.concepts';
import type { RegistryRow } from '../runtime-pieces.repository';
import type {
  DiscoveredPiece,
  PieceKind,
  ScanResult,
} from '../runtime-pieces.types';
import {
  assemblePieces,
  instancesOf,
  summarize,
  type AssembleInput,
} from './assemble';
import { findingsOf } from './findings';
import { buildPurpose } from './provenance';

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
  evidence: { file: `src/${id}.ts`, line: 1 },
  related: [],
  heartbeat: { mode: 'INHERITED', instanceId: 'worker-demo' },
  wired: true,
  attributes: {},
  ...over,
});

const row = (
  p: DiscoveredPiece,
  over: Partial<RegistryRow> = {},
): RegistryRow => ({
  id: `id-${p.id}`,
  code: p.id,
  name: p.name,
  toolTypeConceptId: RUNTIME_PIECE_KIND[p.kind],
  purpose: buildPurpose(p, '2026-10-30'),
  stateConceptId: PLATFORM_OPS.TOOL_STATE_ACTIVE,
  updatedAt: new Date('2026-10-30T00:00:00Z'),
  ...over,
});

const evaluation = (
  id: string,
  over: Partial<InstanceEvaluation> = {},
): InstanceEvaluation => ({
  id,
  label: id,
  type: id === 'api' ? 'API' : 'WORKER',
  required: true,
  state: 'VIVA',
  lastHeartbeatAt: null,
  ageSeconds: 2,
  thresholdSeconds: 60,
  cause: 'OK',
  causeDetail: 'latido fresco hace 2 s',
  evidence: {
    source: 'heartbeat',
    reportedStatus: 'running',
    startedAt: null,
    latencyMs: null,
  },
  ...over,
});

const scan = (pieces: DiscoveredPiece[], available = true): ScanResult => ({
  available,
  source: 'live',
  generatedAt: null,
  reason: available ? null : 'sin src',
  root: '/r',
  filesRead: 1,
  pieces,
  warnings: [],
});

const input = (over: Partial<AssembleInput>): AssembleInput => ({
  scan: scan([]),
  registry: [],
  liveness: new Map([['worker-demo', evaluation('worker-demo')]]),
  requiredInstances: new Set(['worker-demo']),
  activeStateConceptId: PLATFORM_OPS.TOOL_STATE_ACTIVE,
  kindByConcept: new Map(
    (Object.entries(RUNTIME_PIECE_KIND) as [PieceKind, string][]).map(
      ([k, v]) => [v, k],
    ),
  ),
  env: {},
  ...over,
});

describe('unión de código, registro y latidos', () => {
  it('cubre los cinco estados pedidos a la vez', () => {
    const vive = piece('rtp.job.vive');
    const sinLatido = piece('rtp.job.sin-latido', {
      hosts: ['worker-muerto'],
      heartbeat: { mode: 'INHERITED', instanceId: 'worker-muerto' },
    });
    const noReg = piece('rtp.job.no-registrada');
    const deshab = piece('rtp.job.deshabilitada');
    const huerfana = piece('rtp.job.huerfana');
    const views = assemblePieces(
      input({
        scan: scan([vive, sinLatido, noReg, deshab]),
        registry: [
          row(vive),
          row(sinLatido),
          row(deshab, { stateConceptId: PLATFORM_OPS.TOOL_STATE_DISABLED }),
          row(huerfana),
        ],
        liveness: new Map([
          ['worker-demo', evaluation('worker-demo')],
          [
            'worker-muerto',
            evaluation('worker-muerto', {
              state: 'CAIDA',
              cause: 'HEARTBEAT_EXPIRED',
              causeDetail: 'sin latido desde hace 300 s',
            }),
          ],
        ]),
      }),
    );
    const state = (id: string) => views.find((v) => v.id === id)?.state;
    expect(state('rtp.job.vive')).toBe('VIVA');
    expect(state('rtp.job.sin-latido')).toBe('SIN_LATIDO');
    expect(state('rtp.job.no-registrada')).toBe('NO_REGISTRADA');
    expect(state('rtp.job.deshabilitada')).toBe('DESHABILITADA');
    expect(state('rtp.job.huerfana')).toBe('HUERFANA');
    expect(summarize(views)).toMatchObject({
      total: 5,
      byState: {
        VIVA: 1,
        SIN_LATIDO: 1,
        NO_REGISTRADA: 1,
        DESHABILITADA: 1,
        HUERFANA: 1,
        NO_MEDIBLE: 0,
      },
    });
  });

  it('un interruptor apagado en el entorno sólo cuenta para piezas que viven SOLO en la API', () => {
    const inApi = piece('rtp.timer.api', {
      hosts: ['api'],
      heartbeat: { mode: 'INHERITED', instanceId: 'api' },
      enable: { how: 'x', envVars: ['X_ENABLED'], launchers: [] },
    });
    const inWorker = piece('rtp.job.worker', {
      enable: { how: 'x', envVars: ['X_ENABLED'], launchers: [] },
    });
    const views = assemblePieces(
      input({
        scan: scan([inApi, inWorker]),
        registry: [row(inApi), row(inWorker)],
        liveness: new Map([
          ['api', evaluation('api')],
          ['worker-demo', evaluation('worker-demo')],
        ]),
        env: { X_ENABLED: 'false' },
      }),
    );
    expect(views.find((v) => v.id === 'rtp.timer.api')).toMatchObject({
      state: 'DESHABILITADA',
      cause: 'CONFIG_FLAG_OFF',
    });
    expect(views.find((v) => v.id === 'rtp.job.worker')?.state).toBe('VIVA');
  });

  it('la huella desactualizada se ve en la fila: el registro quedó atrás del código', () => {
    const before = piece('rtp.job.a', {
      evidence: { file: 'src/a.ts', line: 1 },
    });
    const after = piece('rtp.job.a', {
      evidence: { file: 'src/a.ts', line: 40 },
    });
    const [view] = assemblePieces(
      input({ scan: scan([after]), registry: [row(before)] }),
    );
    expect(view.registry.stale).toBe(true);
    expect(view.registry.provenance?.evidence).toBe('src/a.ts:1');
  });

  it('con el código no disponible no hay huérfanas: la fila sólo-registro se mide por su latido guardado', () => {
    const p = piece('rtp.job.a');
    const views = assemblePieces(
      input({ scan: scan([], false), registry: [row(p)] }),
    );
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({ inCode: null, state: 'VIVA' });
    expect(views[0].evidence).toEqual({ file: 'src/rtp.job.a.ts', line: 1 });
  });

  it('una fila rtp.* cuyo tipo no se puede determinar no se inventa', () => {
    const p = piece('rtp.job.a');
    const views = assemblePieces(
      input({
        registry: [
          row(p, {
            toolTypeConceptId: 'no-es-un-concepto-conocido',
            purpose: 'texto libre',
          }),
        ],
      }),
    );
    expect(views).toEqual([]);
  });

  it('el orden es estable por id', () => {
    const views = assemblePieces(
      input({ scan: scan([piece('rtp.z'), piece('rtp.a'), piece('rtp.m')]) }),
    );
    expect(views.map((v) => v.id)).toEqual(['rtp.a', 'rtp.m', 'rtp.z']);
  });
});

describe('una pieza alojada en varios procesos', () => {
  const shared = piece('rtp.job.shared', {
    hosts: ['worker-a', 'worker-b'],
    heartbeat: { mode: 'INHERITED', instanceId: null },
  });
  const dead = (id: string) =>
    evaluation(id, {
      state: 'CAIDA',
      cause: 'HEARTBEAT_EXPIRED',
      causeDetail: 'sin latido desde hace 300 s',
    });
  const run = (
    a: InstanceEvaluation,
    b: InstanceEvaluation,
    required = new Set(['worker-b']),
  ) =>
    assemblePieces(
      input({
        scan: scan([shared]),
        registry: [row(shared)],
        liveness: new Map([
          ['worker-a', a],
          ['worker-b', b],
        ]),
        requiredInstances: required,
      }),
    )[0];

  it('basta que UNO de sus anfitriones viva: se elige el mejor, no el primero', () => {
    expect(run(dead('worker-a'), evaluation('worker-b'))).toMatchObject({
      state: 'VIVA',
      cause: 'HOST_ALIVE',
    });
    expect(run(dead('worker-a'), evaluation('worker-b')).causeDetail).toContain(
      'worker-b',
    );
  });

  it('si ninguno vive es SIN_LATIDO; y si uno sólo está tardío, sigue VIVA con su causa', () => {
    expect(run(dead('worker-a'), dead('worker-b')).state).toBe('SIN_LATIDO');
    const tardio = evaluation('worker-b', {
      state: 'DEGRADADA',
      cause: 'HEARTBEAT_LATE',
      causeDetail: 'último latido hace 42 s',
    });
    expect(run(dead('worker-a'), tardio)).toMatchObject({
      state: 'VIVA',
      cause: 'HEARTBEAT_LATE',
    });
  });

  it('es requerida si cualquiera de sus anfitriones lo es', () => {
    expect(run(evaluation('worker-a'), evaluation('worker-b')).required).toBe(
      true,
    );
    expect(
      run(evaluation('worker-a'), evaluation('worker-b'), new Set()).required,
    ).toBe(false);
  });

  it('si ninguno de sus anfitriones está en la sonda, no se mide', () => {
    const views = assemblePieces(
      input({
        scan: scan([shared]),
        registry: [row(shared)],
        liveness: new Map(),
      }),
    );
    expect(views[0]).toMatchObject({
      state: 'NO_MEDIBLE',
      cause: 'HOST_UNRESOLVED',
    });
  });
});

describe('instancias en ejecución', () => {
  it('cada instancia dice qué aloja; la infraestructura sin latido no entra', () => {
    const views = assemblePieces(
      input({
        scan: scan([
          piece('rtp.job.a'),
          piece('rtp.job.b'),
          piece('rtp.conector.c', { kind: 'CONECTOR', hosts: ['api'] }),
        ]),
      }),
    );
    const instances = instancesOf(
      [
        evaluation('worker-demo'),
        evaluation('api'),
        { ...evaluation('postgresql'), type: 'DATABASE' },
      ],
      views,
    );
    expect(instances.map((i) => i.id)).toEqual(['worker-demo', 'api']);
    expect(instances[0]).toMatchObject({
      pieceCount: 2,
      piecesByKind: { JOB_PROGRAMADO: 2 },
    });
    expect(instances[1]).toMatchObject({
      pieceCount: 1,
      piecesByKind: { CONECTOR: 1 },
    });
  });
});

describe('hallazgos', () => {
  const rules = (views: ReturnType<typeof assemblePieces>, available = true) =>
    findingsOf(views, available).map((f) => `${f.rule}:${f.pieceId}`);

  it('NO_REGISTRADA, HUERFANA, NO_CABLEADA y HUELLA_DESACTUALIZADA', () => {
    const lost = piece('rtp.job.lost', {
      wired: false,
      hosts: [],
      heartbeat: { mode: 'INHERITED', instanceId: null },
    });
    const stale = piece('rtp.job.stale', {
      evidence: { file: 'src/s.ts', line: 7 },
    });
    const oldStale = piece('rtp.job.stale', {
      evidence: { file: 'src/s.ts', line: 1 },
    });
    const views = assemblePieces(
      input({
        scan: scan([lost, stale, piece('rtp.job.nueva')]),
        registry: [row(lost), row(oldStale), row(piece('rtp.job.vieja'))],
      }),
    );
    expect(rules(views)).toEqual(
      expect.arrayContaining([
        'NO_CABLEADA:rtp.job.lost',
        'NO_REGISTRADA:rtp.job.nueva',
        'HUERFANA:rtp.job.vieja',
        'HUELLA_DESACTUALIZADA:rtp.job.stale',
      ]),
    );
  });

  it('un proceso requerido sin latido es ALTA; uno opcional es BAJA', () => {
    const required = piece('rtp.proceso.worker-a', {
      kind: 'PROCESO',
      hosts: ['worker-a'],
      heartbeat: { mode: 'PROCESS', instanceId: 'worker-a' },
      attributes: { inComposeDev: true, inCoolify: false },
    });
    const optional = piece('rtp.proceso.worker-b', {
      kind: 'PROCESO',
      hosts: ['worker-b'],
      heartbeat: { mode: 'PROCESS', instanceId: 'worker-b' },
      attributes: { inComposeDev: true, inCoolify: false },
    });
    const dead = (id: string) =>
      evaluation(id, {
        state: 'SIN_DATO',
        cause: 'NEVER_SEEN',
        causeDetail: 'ningún latido recibido de esta instancia',
      });
    const views = assemblePieces(
      input({
        scan: scan([required, optional]),
        registry: [row(required), row(optional)],
        liveness: new Map([
          ['worker-a', dead('worker-a')],
          ['worker-b', dead('worker-b')],
        ]),
        requiredInstances: new Set(['worker-a']),
      }),
    );
    const found = findingsOf(views, true);
    expect(
      found.find((f) => f.pieceId === 'rtp.proceso.worker-a'),
    ).toMatchObject({ rule: 'SIN_LATIDO_REQUERIDA', severity: 'ALTA' });
    expect(
      found.find((f) => f.pieceId === 'rtp.proceso.worker-b'),
    ).toMatchObject({ rule: 'SIN_LATIDO', severity: 'BAJA' });
    expect(found[0].severity).toBe('ALTA');
  });

  it('un worker que la sonda no conoce y uno sin servicio en ningún compose', () => {
    const w = piece('rtp.proceso.worker-x', {
      kind: 'PROCESO',
      hosts: ['worker-x'],
      heartbeat: { mode: 'PROCESS', instanceId: 'worker-x' },
      attributes: { inComposeDev: false, inCoolify: false },
    });
    const views = assemblePieces(
      input({ scan: scan([w]), registry: [row(w)], liveness: new Map() }),
    );
    expect(rules(views)).toEqual(
      expect.arrayContaining([
        'FUERA_DE_SONDA:rtp.proceso.worker-x',
        'NO_DESPLEGADA:rtp.proceso.worker-x',
      ]),
    );
  });

  it('un jobType nombrado sin manejador registrado es ALTA; con manejador no es hallazgo', () => {
    const named = (type: string) =>
      piece(`rtp.jobtype.${type}`, {
        kind: 'JOB_NOMBRADO',
        hosts: [],
        heartbeat: { mode: 'NONE', instanceId: null },
        attributes: { jobType: type },
      });
    const handler = piece('rtp.cola.handler.ok', {
      kind: 'CONSUMIDOR_COLA',
      attributes: { jobType: 'ok' },
    });
    const views = assemblePieces(
      input({
        scan: scan([named('ok'), named('huerfano'), handler]),
        registry: [],
      }),
    );
    const found = findingsOf(views, true).filter(
      (f) => f.rule === 'JOB_SIN_CONSUMIDOR',
    );
    expect(found.map((f) => f.pieceId)).toEqual(['rtp.jobtype.huerfano']);
    expect(found[0].severity).toBe('ALTA');
  });

  it('sin código disponible lo dice como hallazgo informativo', () => {
    expect(findingsOf([], false)).toEqual([
      expect.objectContaining({
        rule: 'CODIGO_NO_DISPONIBLE',
        severity: 'INFO',
      }),
    ]);
  });

  it('una fila del registro sin procedencia se señala', () => {
    const p = piece('rtp.job.a');
    const views = assemblePieces(
      input({ scan: scan([p]), registry: [row(p, { purpose: 'a mano' })] }),
    );
    expect(rules(views)).toContain('SIN_PROCEDENCIA:rtp.job.a');
  });
});
