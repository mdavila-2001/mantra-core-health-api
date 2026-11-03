import type { DiscoveredPiece } from '../runtime-pieces.types';
import {
  buildPurpose,
  draftFor,
  fingerprintOf,
  parseProvenance,
} from './provenance';

const piece = (over: Partial<DiscoveredPiece> = {}): DiscoveredPiece => ({
  id: 'rtp.job.demo.tick',
  kind: 'JOB_PROGRAMADO',
  name: 'demo/tick',
  module: 'demo',
  hosts: ['worker-demo'],
  schedule: { type: 'interval', intervalMs: 5000, cron: null, raw: 'TICK' },
  enable: {
    how: 'dentro de worker-demo; sin interruptor propio',
    envVars: [],
    launchers: [],
  },
  evidence: { file: 'src/worker/jobs/demo/tick.job.ts', line: 5 },
  related: [],
  heartbeat: { mode: 'INHERITED', instanceId: 'worker-demo' },
  wired: true,
  attributes: { b: 2, a: 1 },
  ...over,
});

describe('procedencia de las filas del registro', () => {
  it('la huella no depende del orden de las claves y cambia si cambia la evidencia', () => {
    const a = piece({ attributes: { a: 1, b: 2 } });
    const b = piece({ attributes: { b: 2, a: 1 } });
    expect(fingerprintOf(a)).toBe(fingerprintOf(b));
    expect(fingerprintOf(a)).toMatch(/^[0-9a-f]{16}$/);
    expect(
      fingerprintOf(piece({ evidence: { file: 'src/x.ts', line: 5 } })),
    ).not.toBe(fingerprintOf(a));
    expect(
      fingerprintOf(piece({ evidence: { file: a.evidence.file, line: 6 } })),
    ).not.toBe(fingerprintOf(a));
  });

  it('el texto guardado se lee de vuelta con fuente, archivo:línea, fecha y huella', () => {
    const purpose = buildPurpose(piece(), '2026-10-31');
    expect(parseProvenance(purpose)).toEqual({
      source: 'descubrimiento-estatico',
      evidence: 'src/worker/jobs/demo/tick.job.ts:5',
      discoveredAt: '2026-10-31',
      fingerprint: fingerprintOf(piece()),
      kind: 'JOB_PROGRAMADO',
      heartbeat: 'INHERITED:worker-demo',
    });
  });

  it('la fecha no entra en la huella: cambiar de día no cambia lo descubierto', () => {
    const one = parseProvenance(buildPurpose(piece(), '2026-10-31'));
    const two = parseProvenance(buildPurpose(piece(), '2026-11-01'));
    expect(one?.fingerprint).toBe(two?.fingerprint);
  });

  it.each([
    null,
    undefined,
    '',
    'texto libre sin bloque',
    'x\n--\nfuente: otra\nhuella: abc',
  ])('una fila sin procedencia propia (%j) no se interpreta', (purpose) => {
    expect(parseProvenance(purpose)).toBeNull();
  });

  it('el borrador usa el id como code y el repositorio como proveedor', () => {
    expect(draftFor(piece(), '2026-10-31')).toMatchObject({
      code: 'rtp.job.demo.tick',
      vendor: 'mantra-core-health-api',
      kind: 'JOB_PROGRAMADO',
    });
  });
});
