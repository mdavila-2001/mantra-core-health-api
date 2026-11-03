import {
  DEFAULT_LIVE_FRESHNESS_MS,
  evaluateToolHealth,
  liveFreshnessMs,
  type ToolHealthInput,
} from './tool-health';
import { TOOL_CATALOG } from './tool-catalog';

const NOW = new Date('2026-10-31T12:00:00.000Z');
const ago = (seconds: number) => new Date(NOW.getTime() - seconds * 1000);

function input(overrides: Partial<ToolHealthInput> = {}): ToolHealthInput {
  return {
    status: 'ACTIVE',
    checkType: 'LIVE',
    requiredEnvVars: [],
    lastRun: null,
    freshnessMs: 180_000,
    env: {},
    now: NOW,
    ...overrides,
  };
}

describe('evaluateToolHealth', () => {
  describe('NOT_PROBED por defecto (nunca OK si nadie midió)', () => {
    it('LIVE sin ninguna corrida → NOT_PROBED con motivo', () => {
      const { health, notProbedReason } = evaluateToolHealth(input());
      expect(health).toEqual({
        state: 'NOT_PROBED',
        checkType: 'LIVE',
        observedAt: null,
        missingEnvVars: [],
      });
      expect(notProbedReason).toMatch(/Sin corridas/);
    });

    it('sin health check registrado → NOT_PROBED / NOT_APPLICABLE', () => {
      const { health, notProbedReason } = evaluateToolHealth(
        input({ checkType: null }),
      );
      expect(health.state).toBe('NOT_PROBED');
      expect(health.checkType).toBe('NOT_APPLICABLE');
      expect(notProbedReason).toMatch(/Sin health check/);
    });

    it.each(['PLANNED', 'DEPRECATED', 'DISABLED'] as const)(
      'estado %s → NOT_PROBED aunque haya corrida verde y variables',
      (status) => {
        const { health } = evaluateToolHealth(
          input({
            status,
            checkType: 'CONFIGURATION',
            requiredEnvVars: ['A'],
            env: { A: 'x' },
            lastRun: { outcome: 'PASS', recordedAt: ago(1) },
          }),
        );
        expect(health.state).toBe('NOT_PROBED');
        expect(health.checkType).toBe('NOT_APPLICABLE');
      },
    );

    it('NOT_APPLICABLE declarado → NOT_PROBED', () => {
      const { health } = evaluateToolHealth(
        input({ checkType: 'NOT_APPLICABLE' }),
      );
      expect(health.state).toBe('NOT_PROBED');
    });
  });

  describe('CONFIGURATION: solo verifica que las variables existan', () => {
    const base = {
      checkType: 'CONFIGURATION' as const,
      requiredEnvVars: ['GMAIL_ID', 'GMAIL_SECRET'],
    };

    it('todas presentes → OK observado ahora, sin faltantes', () => {
      const { health } = evaluateToolHealth(
        input({ ...base, env: { GMAIL_ID: 'a', GMAIL_SECRET: 'b' } }),
      );
      expect(health).toEqual({
        state: 'OK',
        checkType: 'CONFIGURATION',
        observedAt: NOW.toISOString(),
        missingEnvVars: [],
      });
    });

    it('faltan variables → FAIL con los NOMBRES, nunca valores', () => {
      const { health } = evaluateToolHealth(
        input({
          ...base,
          env: { GMAIL_ID: 'valor-secreto-distintivo' },
        }),
      );
      expect(health.state).toBe('FAIL');
      expect(health.missingEnvVars).toEqual(['GMAIL_SECRET']);
      expect(JSON.stringify(health)).not.toContain('valor-secreto-distintivo');
    });

    it('cadena vacía o solo espacios cuenta como ausente', () => {
      const { health } = evaluateToolHealth(
        input({ ...base, env: { GMAIL_ID: '', GMAIL_SECRET: '   ' } }),
      );
      expect(health.missingEnvVars).toEqual(['GMAIL_ID', 'GMAIL_SECRET']);
      expect(health.state).toBe('FAIL');
    });

    it('sin variables declaradas no hay nada que verificar → NOT_PROBED, no OK', () => {
      const { health, notProbedReason } = evaluateToolHealth(
        input({ checkType: 'CONFIGURATION', requiredEnvVars: [] }),
      );
      expect(health.state).toBe('NOT_PROBED');
      expect(notProbedReason).toMatch(/nada que verificar/);
    });

    it('una corrida LIVE verde no influye en una herramienta CONFIGURATION', () => {
      const { health } = evaluateToolHealth(
        input({
          ...base,
          env: {},
          lastRun: { outcome: 'PASS', recordedAt: ago(1) },
        }),
      );
      expect(health.state).toBe('FAIL');
    });
  });

  describe('LIVE: solo con comprobación real y reciente', () => {
    it('PASS reciente → OK con la fecha de la corrida', () => {
      const { health } = evaluateToolHealth(
        input({ lastRun: { outcome: 'PASS', recordedAt: ago(30) } }),
      );
      expect(health).toEqual({
        state: 'OK',
        checkType: 'LIVE',
        observedAt: ago(30).toISOString(),
        missingEnvVars: [],
      });
    });

    it('WARN reciente no es una caída → OK', () => {
      const { health } = evaluateToolHealth(
        input({ lastRun: { outcome: 'WARN', recordedAt: ago(30) } }),
      );
      expect(health.state).toBe('OK');
    });

    it.each(['FAIL', 'TIMEOUT', 'ERROR'] as const)(
      '%s reciente → FAIL',
      (outcome) => {
        const { health } = evaluateToolHealth(
          input({ lastRun: { outcome, recordedAt: ago(30) } }),
        );
        expect(health.state).toBe('FAIL');
      },
    );

    it('justo en el borde de la ventana todavía es reciente', () => {
      const { health } = evaluateToolHealth(
        input({ lastRun: { outcome: 'PASS', recordedAt: ago(180) } }),
      );
      expect(health.state).toBe('OK');
    });

    it('un milisegundo más allá de la ventana → NOT_PROBED vencida, conserva observedAt', () => {
      const recordedAt = new Date(NOW.getTime() - 180_001);
      const { health, notProbedReason } = evaluateToolHealth(
        input({ lastRun: { outcome: 'PASS', recordedAt } }),
      );
      expect(health.state).toBe('NOT_PROBED');
      expect(health.observedAt).toBe(recordedAt.toISOString());
      expect(notProbedReason).toMatch(/vencida/);
    });

    it('una corrida vieja en FAIL tampoco cuenta como caída vigente', () => {
      const { health } = evaluateToolHealth(
        input({ lastRun: { outcome: 'FAIL', recordedAt: ago(3600) } }),
      );
      expect(health.state).toBe('NOT_PROBED');
    });
  });
});

describe('liveFreshnessMs', () => {
  it('3 intervalos declarados', () => {
    expect(liveFreshnessMs(60)).toBe(180_000);
  });
  it.each([null, undefined, 0, -5])('%s → ventana por defecto', (value) => {
    expect(liveFreshnessMs(value)).toBe(DEFAULT_LIVE_FRESHNESS_MS);
  });
});

describe('TOOL_CATALOG', () => {
  it('códigos únicos', () => {
    const codes = TOOL_CATALOG.map((entry) => entry.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('requiredEnvVars son solo NOMBRES con forma de variable de entorno', () => {
    for (const entry of TOOL_CATALOG) {
      for (const name of entry.requiredEnvVars) {
        expect(name).toMatch(/^[A-Z][A-Z0-9_]*$/);
      }
    }
  });

  it('toda entrada cita su fuente y las no ACTIVE no declaran sonda', () => {
    for (const entry of TOOL_CATALOG) {
      expect(entry.source.length).toBeGreaterThan(0);
      if (entry.status !== 'ACTIVE') expect(entry.check).toBe('NOT_APPLICABLE');
    }
  });

  it('CONFIGURATION solo con variables que verificar', () => {
    for (const entry of TOOL_CATALOG.filter(
      (e) => e.check === 'CONFIGURATION',
    )) {
      expect(entry.requiredEnvVars.length).toBeGreaterThan(0);
    }
  });
});
