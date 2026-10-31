import {
  AUTO_SCENARIOS_MAX,
  SIMULATION_MAX_SCENARIOS,
  classifyChange,
  summarizeImpact,
  type ScenarioDecision,
} from './support-explain';

const d = (
  effect: ScenarioDecision['effect'],
  reason = 'X',
  grantId?: string,
): ScenarioDecision => ({
  effect,
  allowed: effect === 'PERMIT',
  reason,
  ...(grantId ? { grantId } : {}),
});

describe('A4 · contratos de explicar y simular (§5)', () => {
  it('los topes de simulación son los del contrato: 200 automáticos y 400 en total', () => {
    expect(AUTO_SCENARIOS_MAX).toBe(200);
    expect(SIMULATION_MAX_SCENARIOS).toBe(400);
  });

  it.each([
    ['PERMIT', 'PERMIT', 'SAME'],
    ['DENY', 'DENY', 'SAME'],
    ['CHALLENGE', 'CHALLENGE', 'SAME'],
    ['PERMIT', 'DENY', 'NEWLY_DENIED'],
    ['PERMIT', 'CHALLENGE', 'NEWLY_CHALLENGED'],
    ['CHALLENGE', 'DENY', 'NEWLY_DENIED'],
    ['DENY', 'PERMIT', 'NEWLY_ALLOWED'],
    ['CHALLENGE', 'PERMIT', 'NEWLY_ALLOWED'],
    ['DENY', 'CHALLENGE', 'NEWLY_CHALLENGED'],
  ] as const)('classifyChange: %s → %s es %s', (before, after, expected) => {
    expect(classifyChange(d(before), d(after))).toBe(expected);
  });

  it('el cambio mira el efecto, no el motivo (ejemplo «Cobrar un sábado» del contrato)', () => {
    expect(
      classifyChange(d('DENY', 'ACTION_NOT_GRANTED'), d('DENY', 'TIME_WINDOW')),
    ).toBe('SAME');
  });

  it('summarizeImpact cuenta cada escenario según su cambio', () => {
    const changes = [
      'NEWLY_DENIED',
      'NEWLY_DENIED',
      'SAME',
      'NEWLY_ALLOWED',
      'NEWLY_CHALLENGED',
      'SAME',
      'SAME',
    ] as const;
    expect(summarizeImpact(changes)).toEqual({
      newlyAllowed: 1,
      newlyDenied: 2,
      unchanged: 3,
      challengesNew: 1,
    });
    expect(summarizeImpact([])).toEqual({
      newlyAllowed: 0,
      newlyDenied: 0,
      unchanged: 0,
      challengesNew: 0,
    });
  });

  it('AC-5: un borrador igual al estado actual da todo SAME y ningún cambio de impacto', () => {
    const same = [d('PERMIT'), d('DENY'), d('CHALLENGE')].map((x) =>
      classifyChange(x, { ...x }),
    );
    expect(same).toEqual(['SAME', 'SAME', 'SAME']);
    expect(summarizeImpact(same)).toEqual({
      newlyAllowed: 0,
      newlyDenied: 0,
      unchanged: 3,
      challengesNew: 0,
    });
  });
});
