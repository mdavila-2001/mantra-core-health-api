import type { InstanceEvaluation } from '../../../ops_console/domain/instance-liveness';
import { contrastPiece, explicitlyOff, type ContrastInput } from './contrast';

const evaluation = (over: Partial<InstanceEvaluation>): InstanceEvaluation => ({
  id: 'worker-demo',
  label: 'Demo',
  type: 'WORKER',
  required: true,
  state: 'VIVA',
  lastHeartbeatAt: '2026-10-31T12:00:00.000Z',
  ageSeconds: 3,
  thresholdSeconds: 60,
  cause: 'OK',
  causeDetail: 'latido fresco hace 3 s',
  evidence: {
    source: 'heartbeat',
    reportedStatus: 'running',
    startedAt: null,
    latencyMs: null,
  },
  ...over,
});

const base: ContrastInput = {
  codeScanAvailable: true,
  inCode: true,
  inRegistry: true,
  registryActive: true,
  heartbeat: { mode: 'INHERITED', instanceId: 'worker-demo' },
  liveness: evaluation({}),
  flagOff: null,
};
const run = (over: Partial<ContrastInput>) =>
  contrastPiece({ ...base, ...over });

describe('contraste código ↔ registro ↔ latidos', () => {
  it('en el registro y ya no en el código: HUERFANA', () => {
    expect(run({ inCode: false })).toMatchObject({
      state: 'HUERFANA',
      cause: 'NOT_IN_CODE',
    });
  });

  it('sin el código disponible no se afirma HUERFANA: se mide por el latido guardado', () => {
    const v = run({ inCode: false, codeScanAvailable: false });
    expect(v.state).not.toBe('HUERFANA');
    expect(v.state).toBe('VIVA');
  });

  it('en el código y no en el registro: NO_REGISTRADA, aunque el proceso esté vivo', () => {
    expect(run({ inRegistry: false, registryActive: null })).toMatchObject({
      state: 'NO_REGISTRADA',
      cause: 'NOT_IN_REGISTRY',
    });
  });

  it('el registro la marca deshabilitada: DESHABILITADA gana sobre un latido fresco', () => {
    expect(run({ registryActive: false })).toMatchObject({
      state: 'DESHABILITADA',
      cause: 'REGISTRY_DISABLED',
    });
  });

  it('un interruptor apagado por configuración: DESHABILITADA y dice cuál', () => {
    const v = run({ flagOff: 'OBS_ENABLED=false' });
    expect(v).toMatchObject({
      state: 'DESHABILITADA',
      cause: 'CONFIG_FLAG_OFF',
    });
    expect(v.causeDetail).toContain('OBS_ENABLED=false');
  });

  describe('con latido (las reglas de umbral son las de la sonda: llegan ya evaluadas)', () => {
    it('instancia VIVA: la pieza es VIVA con evidencia del anfitrión (no propia)', () => {
      expect(run({})).toMatchObject({
        state: 'VIVA',
        cause: 'HOST_ALIVE',
        evidenceLevel: 'ANFITRION',
        instanceState: 'VIVA',
      });
    });

    it('un proceso con latido propio tiene evidencia PROPIA', () => {
      expect(
        run({ heartbeat: { mode: 'PROCESS', instanceId: 'worker-demo' } }),
      ).toMatchObject({
        state: 'VIVA',
        cause: 'OK',
        evidenceLevel: 'PROPIO',
      });
    });

    it('instancia DEGRADADA (latido tardío): sigue VIVA pero lo dice y conserva la causa', () => {
      const v = run({
        liveness: evaluation({
          state: 'DEGRADADA',
          cause: 'HEARTBEAT_LATE',
          causeDetail: 'último latido hace 42 s',
        }),
      });
      expect(v).toMatchObject({
        state: 'VIVA',
        cause: 'HEARTBEAT_LATE',
        instanceState: 'DEGRADADA',
      });
      expect(v.causeDetail).toContain('degradado');
    });

    it.each([
      ['CAIDA', 'HEARTBEAT_EXPIRED'],
      ['SIN_DATO', 'NEVER_SEEN'],
      ['SIN_DATO', 'STORE_UNAVAILABLE'],
      ['SIN_DATO', 'RECORD_CORRUPT'],
    ] as const)(
      'instancia %s por %s: SIN_LATIDO, nunca VIVA',
      (state, cause) => {
        const v = run({
          liveness: evaluation({ state, cause, causeDetail: 'x' }),
        });
        expect(v).toMatchObject({
          state: 'SIN_LATIDO',
          cause,
          evidenceLevel: 'NINGUNO',
        });
      },
    );

    it('la propia API es VIVA con causa SELF', () => {
      const v = run({
        heartbeat: { mode: 'SELF', instanceId: 'api' },
        liveness: evaluation({
          id: 'api',
          type: 'API',
          cause: 'OK',
          evidence: {
            source: 'self',
            reportedStatus: 'running',
            startedAt: null,
            latencyMs: null,
          },
        }),
      });
      expect(v).toMatchObject({
        state: 'VIVA',
        cause: 'SELF',
        evidenceLevel: 'PROPIO',
      });
    });
  });

  describe('lo que no se puede medir no se pinta de verde ni de rojo', () => {
    it('una clase de pieza sin mecanismo de latido: NO_MEDIBLE', () => {
      expect(
        run({ heartbeat: { mode: 'NONE', instanceId: null } }),
      ).toMatchObject({
        state: 'NO_MEDIBLE',
        cause: 'NO_HEARTBEAT_MECHANISM',
      });
    });

    it('sin anfitrión resuelto: NO_MEDIBLE', () => {
      expect(
        run({
          heartbeat: { mode: 'INHERITED', instanceId: null },
          liveness: null,
        }),
      ).toMatchObject({
        state: 'NO_MEDIBLE',
        cause: 'HOST_UNRESOLVED',
      });
    });

    it('un anfitrión que la sonda no conoce: NO_MEDIBLE, no SIN_LATIDO', () => {
      expect(run({ liveness: null })).toMatchObject({
        state: 'NO_MEDIBLE',
        cause: 'HOST_UNRESOLVED',
      });
    });
  });
});

describe('explicitlyOff: sólo se afirma lo leído', () => {
  it('*_ENABLED=false (y sus variantes) apaga; ausente o vacío no', () => {
    expect(explicitlyOff(['X_ENABLED'], { X_ENABLED: 'false' })).toBe(
      'X_ENABLED=false',
    );
    expect(explicitlyOff(['X_ENABLED'], { X_ENABLED: ' OFF ' })).toBe(
      'X_ENABLED=off',
    );
    expect(explicitlyOff(['X_ENABLED'], {})).toBeNull();
    expect(explicitlyOff(['X_ENABLED'], { X_ENABLED: '' })).toBeNull();
    expect(explicitlyOff(['X_ENABLED'], { X_ENABLED: 'true' })).toBeNull();
  });

  it('*_DISABLED=true apaga; otras variables no son interruptores', () => {
    expect(explicitlyOff(['Y_DISABLED'], { Y_DISABLED: '1' })).toBe(
      'Y_DISABLED=1',
    );
    expect(explicitlyOff(['Y_DISABLED'], { Y_DISABLED: 'false' })).toBeNull();
    expect(explicitlyOff(['SOME_CRON'], { SOME_CRON: 'false' })).toBeNull();
  });
});
