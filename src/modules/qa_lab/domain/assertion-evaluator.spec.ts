import {
  evaluateAssertion,
  parseJsonPath,
  type ObservedResponse,
} from './assertion-evaluator';

const observed: ObservedResponse = {
  status: 201,
  headers: { 'Content-Type': 'application/json', 'x-request-id': 'r-1' },
  body: {
    data: {
      id: 'abc',
      items: [{ sku: 'A' }, { sku: 'B' }],
      total: 12.5,
      active: true,
      tags: ['x', 'y'],
    },
  },
  latencyMs: 180,
};

describe('evaluateAssertion', () => {
  it.each([
    [{ type: 'STATUS', operator: 'EQ', expected: '201' }, true],
    [{ type: 'STATUS', operator: 'EQ', expected: '200' }, false],
    [{ type: 'STATUS', operator: 'NEQ', expected: '500' }, true],
    [{ type: 'LATENCY', operator: 'LT', expected: '500' }, true],
    [{ type: 'LATENCY', operator: 'LT', expected: '100' }, false],
    [
      {
        type: 'HEADER',
        operator: 'CONTAINS',
        path: 'content-type',
        expected: 'json',
      },
      true,
    ],
    [{ type: 'HEADER', operator: 'EXISTS', path: 'x-missing' }, false],
    [
      { type: 'JSON_PATH', operator: 'EQ', path: '$.data.id', expected: 'abc' },
      true,
    ],
    [
      {
        type: 'JSON_PATH',
        operator: 'EQ',
        path: '$.data.items[1].sku',
        expected: 'B',
      },
      true,
    ],
    [
      {
        type: 'JSON_PATH',
        operator: 'EQ',
        path: '$.data.total',
        expected: '12.50',
      },
      true,
    ],
    [
      {
        type: 'JSON_PATH',
        operator: 'EQ',
        path: '$.data.active',
        expected: 'true',
      },
      true,
    ],
    [
      {
        type: 'JSON_PATH',
        operator: 'CONTAINS',
        path: '$.data.tags',
        expected: 'y',
      },
      true,
    ],
    [
      {
        type: 'JSON_PATH',
        operator: 'GT',
        path: '$.data.total',
        expected: '20',
      },
      false,
    ],
    [{ type: 'JSON_PATH', operator: 'EXISTS', path: '$.data.nope' }, false],
    [
      {
        type: 'JSON_PATH',
        operator: 'EQ',
        path: '$.data.items[9].sku',
        expected: 'A',
      },
      false,
    ],
  ] as const)('%j → %s', (definition, passed) => {
    expect(evaluateAssertion(definition, observed).passed).toBe(passed);
  });

  it('guarda el valor observado y explica el fallo', () => {
    expect(
      evaluateAssertion(
        { type: 'STATUS', operator: 'EQ', expected: '200' },
        observed,
      ),
    ).toEqual({
      passed: false,
      actualValue: '201',
      message: 'Se esperaba 200',
    });
  });

  it('una comparación numérica sobre texto falla con explicación, no lanza', () => {
    const verdict = evaluateAssertion(
      { type: 'JSON_PATH', operator: 'LT', path: '$.data.id', expected: '5' },
      observed,
    );
    expect(verdict).toMatchObject({
      passed: false,
      message: expect.stringMatching(/no numérico/),
    });
  });

  it('la tolerancia se aplica a igualdades numéricas', () => {
    expect(
      evaluateAssertion(
        { type: 'LATENCY', operator: 'EQ', expected: '200', tolerance: '25' },
        observed,
      ).passed,
    ).toBe(true);
  });

  it('una ruta no soportada es un fallo explicado', () => {
    for (const path of [
      '$..id',
      '$.data.items[*].sku',
      '$.data[?(@.x)]',
      'data.id',
      '$.a;process.exit()',
    ]) {
      expect(
        evaluateAssertion(
          { type: 'JSON_PATH', operator: 'EXISTS', path },
          observed,
        ),
      ).toMatchObject({
        passed: false,
        message: expect.stringMatching(/no soportada/),
      });
    }
  });

  it('no atraviesa el prototipo', () => {
    expect(
      evaluateAssertion(
        { type: 'JSON_PATH', operator: 'EXISTS', path: '$.data.constructor' },
        observed,
      ).passed,
    ).toBe(false);
    expect(
      evaluateAssertion(
        { type: 'JSON_PATH', operator: 'EXISTS', path: '$["__proto__"]' },
        observed,
      ).passed,
    ).toBe(false);
  });

  it('recorta el valor observado', () => {
    const big = { ...observed, body: { s: 'x'.repeat(5000) } };
    expect(
      evaluateAssertion(
        { type: 'JSON_PATH', operator: 'EXISTS', path: '$.s' },
        big,
      ).actualValue,
    ).toHaveLength(500);
  });
});

describe('parseJsonPath', () => {
  it('acepta sólo la forma restringida', () => {
    expect(parseJsonPath('$.a.b[0]["c d"]')).toEqual(['a', 'b', 0, 'c d']);
    expect(parseJsonPath('$')).toEqual([]);
    expect(parseJsonPath(`$${'.a'.repeat(21)}`)).toBeNull();
  });
});
