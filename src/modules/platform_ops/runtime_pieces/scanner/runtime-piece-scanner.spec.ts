import { evalArithmetic } from './scan-helpers';
import { scanTree } from './runtime-piece-scanner';
import { SourceTree, stripComments } from './source-tree';

const WORKER_MODULE = `
import { Module } from '@nestjs/common';
import { TickJob } from './tick.job';
import { OtherJob } from './other.job';
@Module({ providers: [TickJob, OtherJob], imports: [SharedModule] })
export class DemoWorkerModule {}
`;

const TICK_JOB = `
import { Interval } from '@nestjs/schedule';
const TICK_MS = 5 * 60_000;
export class TickJob {
  @Interval(TICK_MS)
  async tick() { await runTick(this.logger, 'worker.demo.tick', async () => {}); }
}
`;

const BASE: Record<string, string> = {
  'src/main.ts':
    'const app = await NestFactory.create<NestExpressApplication>(AppModule, {});',
  'src/app.module.ts': `@Module({ imports: [HealthModule], controllers: [HealthController, GhostController] })
export class AppModule {}`,
  'src/worker-demo.ts': "void bootstrapWorker(DemoWorkerModule, 'demo');",
  'src/seed-cli.ts':
    'const app = await NestFactory.createApplicationContext(AppModule, {});',
  'src/worker/jobs/demo/demo.worker-module.ts': WORKER_MODULE,
  'src/worker/jobs/demo/tick.job.ts': TICK_JOB,
  'package.json':
    '{\n  "scripts": {\n    "start:worker:demo": "node dist/src/worker-demo"\n  }\n}',
  'docker-compose.yml': [
    'services:',
    '  worker-demo:',
    '    command: ["node", "dist/src/worker-demo.js"]',
    '    profiles: ["opt-in"]',
    '    healthcheck: *worker-healthcheck',
    '  redis:',
    '    image: redis',
    '    healthcheck:',
    '      test: ["CMD", "redis-cli", "ping"]',
    'volumes:',
    '  data:',
  ].join('\n'),
};

const scan = (extra: Record<string, string> = {}) =>
  scanTree(SourceTree.fromMap({ ...BASE, ...extra }), '/r');
const byKind = (result: ReturnType<typeof scan>, kind: string) =>
  result.pieces.filter((p) => p.kind === kind);

describe('escáner de piezas ejecutables', () => {
  it('sin src/ declara el escaneo no disponible en vez de devolver una lista vacía', () => {
    const result = scanTree(SourceTree.fromMap({ 'package.json': '{}' }), '/r');
    expect(result.available).toBe(false);
    expect(result.pieces).toEqual([]);
    expect(result.reason).toMatch(/src\//);
  });

  describe('procesos', () => {
    it('detecta la API, el worker y el arranque de un solo uso, con cómo se enciende', () => {
      const result = scan();
      const ids = byKind(result, 'PROCESO').map((p) => p.id);
      expect(ids).toEqual([
        'rtp.proceso.api',
        'rtp.proceso.seed-cli',
        'rtp.proceso.worker-demo',
      ]);
      const worker = result.pieces.find(
        (p) => p.id === 'rtp.proceso.worker-demo',
      );
      expect(worker?.evidence).toEqual({ file: 'src/worker-demo.ts', line: 1 });
      expect(worker?.heartbeat).toEqual({
        mode: 'PROCESS',
        instanceId: 'worker-demo',
      });
      expect(worker?.attributes).toMatchObject({
        inComposeDev: true,
        inCoolify: false,
        optIn: true,
        hasStartScript: true,
      });
      expect(
        worker?.enable.launchers.map((l) => `${l.file}:${l.line}`),
      ).toEqual(['docker-compose.yml:2', 'package.json:3']);
      const api = result.pieces.find((p) => p.id === 'rtp.proceso.api');
      expect(api?.heartbeat).toEqual({ mode: 'SELF', instanceId: 'api' });
      const seed = result.pieces.find((p) => p.id === 'rtp.proceso.seed-cli');
      expect(seed?.attributes.oneShot).toBe(true);
    });
  });

  describe('trabajo programado', () => {
    it('resuelve el intervalo (constante y aritmética), el anfitrión y el cableado', () => {
      const piece = scan().pieces.find((p) => p.id === 'rtp.job.demo.tick');
      expect(piece).toMatchObject({
        kind: 'JOB_PROGRAMADO',
        hosts: ['worker-demo'],
        wired: true,
        schedule: { type: 'interval', intervalMs: 300_000, raw: 'TICK_MS' },
        evidence: { file: 'src/worker/jobs/demo/tick.job.ts', line: 5 },
        heartbeat: { mode: 'INHERITED', instanceId: 'worker-demo' },
      });
      expect(piece?.attributes.ticks).toBe('worker.demo.tick');
    });

    it('una clase con @Interval que ningún módulo registra queda wired=false y sin anfitrión', () => {
      const piece = scan({
        'src/worker/jobs/demo/other.job.ts':
          'export class OtherJob {\n  @Interval(1000)\n  tick() {}\n}',
        'src/worker/jobs/demo/lost.job.ts':
          'export class LostJob {\n  @Interval(1000)\n  tick() {}\n}',
      }).pieces.find((p) => p.id === 'rtp.job.demo.lost');
      expect(piece).toMatchObject({ wired: false, hosts: [] });
    });

    it('@Cron y @Timeout se reconocen; un argumento que no se resuelve avisa y no se inventa', () => {
      const result = scan({
        'src/worker/jobs/demo/cron.job.ts':
          "export class CronThing {\n  @Cron('*/5 * * * *')\n  a() {}\n}",
        'src/worker/jobs/demo/wait.job.ts':
          'export class WaitThing {\n  @Timeout(unknownThing)\n  a() {}\n}',
      });
      const cron = result.pieces.find((p) => p.id === 'rtp.job.demo.cron');
      expect(cron?.schedule).toMatchObject({
        type: 'cron',
        cron: '*/5 * * * *',
      });
      const wait = result.pieces.find((p) => p.id === 'rtp.job.demo.wait');
      expect(wait?.schedule).toMatchObject({
        type: 'timeout',
        intervalMs: null,
        raw: 'unknownThing',
      });
      expect(result.warnings.some((w) => w.includes('unknownThing'))).toBe(
        true,
      );
    });

    it('un decorador mencionado en un comentario o en una cadena de texto no es una pieza', () => {
      const result = scan({
        'src/worker/jobs/demo/comment.job.ts':
          '/** usa @Interval(1000) */\n// @Cron("* * * * *")\nexport class C {}',
      });
      expect(result.pieces.some((p) => p.id.includes('comment'))).toBe(false);
    });

    it('lee el interruptor *_ENABLED del archivo de configuración importado y la guarda this.env', () => {
      const piece = scan({
        'src/worker/worker.env.ts':
          'MESSAGING_QUEUE_CODES: Joi.string(), TS_ADMIN_TENANT_ID: Joi.string()',
        'src/worker/jobs/demo/flag.job.ts': [
          "import { cfg } from '../../../common/flag.env';",
          'export class FlagJob {',
          '  @Interval(1000)',
          '  tick() {',
          '    if (this.env.messagingQueueCodes.length === 0) return;',
          '    use(this.env.tsAdminTenantId);',
          '  }',
          '}',
        ].join('\n'),
        'src/common/flag.env.ts':
          'export const x = process.env.DEMO_SCAN_ENABLED;',
      }).pieces.find((p) => p.id === 'rtp.job.demo.flag');
      expect(piece?.enable.envVars).toEqual([
        'DEMO_SCAN_ENABLED',
        'MESSAGING_QUEUE_CODES',
      ]);
    });

    it('CronJob.from con la expresión por omisión de la configuración', () => {
      const piece = scan({
        'src/worker/jobs/demo/sweep.job.ts': [
          "import { DEFAULTS } from '../../../common/sweep.config';",
          'export class SweepJob {',
          '  schedule() {',
          '    const job = CronJob.from({ cronTime: expression, onTick: () => 1 });',
          '  }',
          '}',
        ].join('\n'),
        'src/common/sweep.config.ts':
          "export const DEFAULTS = { sweepCron: '0 * * * *' }; // SWEEP_ENABLED",
      }).pieces.find((p) => p.id === 'rtp.job.demo.sweep.cron');
      expect(piece?.schedule).toMatchObject({
        type: 'cron',
        cron: '0 * * * *',
      });
    });

    it('setInterval en un servicio es un temporizador', () => {
      const piece = scan({
        'src/modules/x/x.service.ts':
          'export class XService {\n  start() { this.t = setInterval(() => 1, 30 * 1000); }\n}',
      }).pieces.find((p) => p.kind === 'TEMPORIZADOR');
      expect(piece?.schedule).toMatchObject({ intervalMs: 30_000 });
    });
  });

  describe('anfitriones', () => {
    it('lo que arma el arranque común de los workers (WorkerRootModule) corre en todos ellos', () => {
      const result = scan({
        'src/worker/bootstrap.ts':
          '@Module({ imports: [domainModule], providers: [WorkerHeartbeatService] })\nclass WorkerRootModule {}',
        'src/worker/worker-heartbeat.service.ts':
          'export class WorkerHeartbeatService {\n  go() { this.t = setInterval(() => 1, 15000); }\n}',
        'src/worker-other.ts':
          "void bootstrapWorker(OtherWorkerModule, 'other');",
        'src/worker/jobs/other/other.worker-module.ts':
          '@Module({ providers: [] })\nexport class OtherWorkerModule {}',
      });
      const timer = result.pieces.find(
        (p) => p.id === 'rtp.timer.worker.worker-heartbeat.service',
      );
      expect(timer?.hosts).toEqual(['worker-demo', 'worker-other']);
      expect(timer?.heartbeat).toEqual({ mode: 'INHERITED', instanceId: null });
    });

    it('un job que sólo vive en un proceso lo nombra; en varios, no elige uno al azar', () => {
      const result = scan({
        'src/worker-other.ts':
          "void bootstrapWorker(OtherWorkerModule, 'other');",
        'src/worker/jobs/other/other.worker-module.ts':
          '@Module({ imports: [DemoWorkerModule] })\nexport class OtherWorkerModule {}',
      });
      expect(
        result.pieces.find((p) => p.id === 'rtp.job.demo.tick')?.heartbeat,
      ).toEqual({ mode: 'INHERITED', instanceId: null });
      expect(
        scan().pieces.find((p) => p.id === 'rtp.job.demo.tick')?.heartbeat,
      ).toEqual({ mode: 'INHERITED', instanceId: 'worker-demo' });
    });
  });

  describe('colas y eventos', () => {
    it('registerQueueJobHandler resuelve el jobType de una constante; en un comentario no cuenta', () => {
      const result = scan({
        'src/worker/jobs/demo/handler.job.ts': [
          "import { AUDIO_TYPE } from './types';",
          '// registerQueueJobHandler(FAKE, h)',
          'export class H {',
          '  init() { registerQueueJobHandler(AUDIO_TYPE, () => 1); }',
          '}',
        ].join('\n'),
        'src/worker/jobs/demo/types.ts':
          "export const AUDIO_TYPE = 'audio.generate';",
      });
      const handlers = byKind(result, 'CONSUMIDOR_COLA');
      expect(handlers.map((h) => h.id)).toEqual([
        'rtp.cola.handler.audio.generate',
      ]);
      expect(handlers[0].attributes.jobType).toBe('audio.generate');
    });

    it('reconoce @Processor, @OnEvent y el puente de outbox, y no confunde un comentario', () => {
      const result = scan({
        'src/modules/q/q.processor.ts':
          "@Processor('mail')\nexport class P {\n  @OnEvent('order.created')\n  h() {}\n}\n// @Processor('fake')",
        'src/worker/jobs/demo/outbox.job.ts':
          "export class O { go() { return api.post('/internal/outbox/relay/run', {}); } }",
      });
      const ids = byKind(result, 'CONSUMIDOR_COLA').map((p) => p.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/^rtp\.cola\.bullmq-processor\./),
          expect.stringMatching(/^rtp\.cola\.onevent\./),
          'rtp.cola.puente.worker.jobs.demo.outbox.job',
        ]),
      );
      expect(ids.filter((id) => id.includes('fake'))).toEqual([]);
    });

    it('un jobType declarado sin manejador se ve como pieza JOB_NOMBRADO', () => {
      const result = scan({
        'src/modules/a/a.constants.ts': "export const A_JOB_TYPE = 'a.run';",
      });
      expect(byKind(result, 'JOB_NOMBRADO')[0]).toMatchObject({
        id: 'rtp.jobtype.a.run',
      });
    });
  });

  describe('endpoints internos y salud', () => {
    const CONTROLLER = [
      "@Roles('SYSTEM')",
      "@Controller('internal')",
      'export class InternalController {',
      "  @Post('jobs/:id/complete')",
      "  @Roles('SYSTEM', 'MESSAGING_ADMIN')",
      '  complete() {}',
      "  @Post('plain')",
      '  plain() {}',
      "  @Get('pending')",
      '  pending() {}',
      '}',
      "@Controller('public')",
      'export class OtherController {',
      "  @Post('internal-looking')",
      '  nope() {}',
      '}',
    ].join('\n');

    it('sólo los POST bajo /internal disparan trabajo; los roles salen del método o de la clase', () => {
      const result = scan({
        'src/modules/i/internal.controller.ts': CONTROLLER,
        'src/app.module.ts':
          '@Module({ controllers: [InternalController] })\nexport class AppModule {}',
      });
      const endpoints = byKind(result, 'ENDPOINT_INTERNO');
      expect(endpoints.map((e) => e.name)).toEqual([
        'POST /internal/jobs/:id/complete',
        'POST /internal/plain',
      ]);
      expect(endpoints[0].attributes).toMatchObject({
        roles: 'SYSTEM, MESSAGING_ADMIN',
        systemOnly: false,
      });
      expect(endpoints[1].attributes).toMatchObject({
        roles: 'SYSTEM',
        systemOnly: true,
      });
      expect(endpoints[0].hosts).toEqual(['api']);
    });

    it('un controlador que ningún módulo declara queda wired=false', () => {
      const piece = byKind(
        scan({ 'src/modules/i/internal.controller.ts': CONTROLLER }),
        'ENDPOINT_INTERNO',
      )[0];
      expect(piece).toMatchObject({ wired: false, hosts: [] });
    });

    it('detecta /health, la sonda del worker y los healthcheck de compose', () => {
      const result = scan({
        'src/app.controller.ts':
          "@Controller()\nexport class AppController {\n  @Public()\n  @Get('health')\n  h() {}\n  @Get('status')\n  s() {}\n}",
        'src/worker/worker-health.server.ts':
          "if (url === '/liveness') {}\nif (url === '/readiness') {}",
      });
      const names = byKind(result, 'SALUD').map((p) => p.name);
      expect(names).toEqual(
        expect.arrayContaining([
          'GET /health',
          'Sonda de cada worker: GET /liveness',
          'Sonda de cada worker: GET /readiness',
          'Healthcheck de compose: redis',
        ]),
      );
      expect(names).not.toContain('GET /status');
      expect(names.some((n) => n.includes('worker-demo'))).toBe(false);
    });
  });

  describe('conectores', () => {
    it('un cliente con E/S externa es conector; un adaptador interno sin E/S no', () => {
      const result = scan({
        'src/modules/p/pay.client.ts':
          'export class PayClient { go() { return fetch(process.env.PAY_URL!); } }',
        'src/modules/p/internal.adapter.ts':
          'export class InternalAdapter { go() { return 1; } }',
      });
      const connectors = byKind(result, 'CONECTOR');
      expect(connectors.map((c) => c.id)).toEqual([
        'rtp.conector.modules.p.pay.client',
      ]);
      expect(connectors[0].enable.envVars).toEqual(['PAY_URL']);
      expect(connectors[0].attributes.protocols).toBe('http');
    });
  });

  describe('estabilidad', () => {
    it('el mismo código da exactamente la misma lista, sin importar el orden de lectura', () => {
      const forward = scan();
      const reversed = scanTree(
        SourceTree.fromMap(Object.fromEntries(Object.entries(BASE).reverse())),
        '/r',
      );
      expect(JSON.stringify(reversed.pieces)).toBe(
        JSON.stringify(forward.pieces),
      );
    });

    it('dos piezas con el mismo id se desambiguan con ~n y se avisa', () => {
      const result = scan({
        'src/modules/a/dup.client.ts': 'export class A { x() { fetch("u"); } }',
        'src/modules/a/dup/client.ts': 'export class B { x() { fetch("u"); } }',
        'src/modules/a/dup.client.service.ts':
          'export class C { x() { fetch("u"); } }',
      });
      const ids = result.pieces.map((p) => p.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});

describe('aritmética de los intervalos', () => {
  it.each([
    ['5_000', 5000],
    ['5 * 60_000', 300_000],
    ['(2 + 3) * 10', 50],
    ['-4 + 10', 6],
    ['1.5 * 2', 3],
  ])('%s = %s', (expression, expected) => {
    expect(evalArithmetic(expression)).toBe(expected);
  });

  it.each(['process.exit(1)', '1 +', '2 ** 3', 'a * 2', '', '(1'])(
    'no ejecuta ni acepta "%s"',
    (expression) => {
      expect(evalArithmetic(expression)).toBeNull();
    },
  );
});

describe('stripComments', () => {
  it('conserva los saltos de línea y respeta // dentro de cadenas', () => {
    const out = stripComments("a // c\nb = 'http://x' /* m\nn */ c");
    expect(out.split('\n')).toHaveLength(3);
    expect(out).toContain("'http://x'");
    expect(out).not.toContain('c\n');
    expect(out).not.toContain('m');
  });
});
