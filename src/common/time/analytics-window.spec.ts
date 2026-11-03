import { WindowError, assembleFunnel, resolveWindow } from './analytics-window';

const NOW = new Date('2026-09-18T12:00:00.000Z');

describe('resolveWindow', () => {
  it('por defecto son los últimos 7 días, por día', () => {
    const window = resolveWindow({}, NOW);
    expect(window.to).toEqual(NOW);
    expect(window.from.toISOString()).toBe('2026-09-11T12:00:00.000Z');
    expect(window.interval).toBe('day');
  });

  it('una ventana corta se agrupa por hora', () => {
    expect(resolveWindow({ from: '2026-09-18T00:00:00Z' }, NOW).interval).toBe(
      'hour',
    );
  });

  it.each([
    [
      { from: '2026-09-18T12:00:00Z', to: '2026-09-18T12:00:00Z' },
      'EMPTY_WINDOW',
    ],
    [{ from: 'ayer' }, 'INVALID_DATE'],
    [{ from: '2026-01-01T00:00:00Z' }, 'WINDOW_TOO_LARGE'],
    [
      { from: '2026-09-01T00:00:00Z', interval: 'hour' as const },
      'INTERVAL_TOO_FINE',
    ],
  ])('rechaza %j con %s', (input, reason) => {
    try {
      resolveWindow(input, NOW);
      throw new Error('no lanzó');
    } catch (error) {
      expect(error).toBeInstanceOf(WindowError);
      expect((error as WindowError).reason).toBe(reason);
    }
  });

  it('92 días exactos se aceptan y 92 + 1 ms no', () => {
    const to = NOW.toISOString();
    expect(() =>
      resolveWindow({ from: '2026-06-18T12:00:00.000Z', to }, NOW),
    ).not.toThrow();
    expect(() =>
      resolveWindow({ from: '2026-06-18T11:59:59.999Z', to }, NOW),
    ).toThrow(WindowError);
  });
});

describe('assembleFunnel', () => {
  it('calcula conversión desde el inicio y desde el paso anterior', () => {
    const report = assembleFunnel([
      { stepNumber: 2, eventName: 'form_started', reached: 40 },
      { stepNumber: 1, eventName: 'page_view', reached: 100 },
      { stepNumber: 3, eventName: 'form_submitted', reached: 10 },
    ]);
    expect(report).toMatchObject({
      unit: 'session',
      denominator: 100,
      completed: 10,
      overallConversion: 0.1,
    });
    expect(
      report.steps.map((s) => [
        s.eventName,
        s.conversionFromStart,
        s.conversionFromPrevious,
        s.droppedFromPrevious,
      ]),
    ).toEqual([
      ['page_view', 1, null, null],
      ['form_started', 0.4, 0.4, 60],
      ['form_submitted', 0.1, 0.25, 30],
    ]);
  });

  it('sin entradas el ratio es null, no 0% ni 100%', () => {
    const report = assembleFunnel([
      { stepNumber: 1, eventName: 'a', reached: 0 },
      { stepNumber: 2, eventName: 'b', reached: 0 },
    ]);
    expect(report.overallConversion).toBeNull();
    expect(report.steps[1].conversionFromPrevious).toBeNull();
  });

  it('un embudo sin pasos no revienta', () => {
    expect(assembleFunnel([])).toMatchObject({
      denominator: 0,
      completed: 0,
      overallConversion: null,
      steps: [],
    });
  });
});
