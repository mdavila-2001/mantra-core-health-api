import { buildValueColumns } from './value-columns';
import { PreconditionFailedException } from '../../../common';

describe('buildValueColumns', () => {
  it('writes scalar columns for each basic dataType', () => {
    expect(buildValueColumns('string', 'x')).toEqual({ valueString: 'x' });
    expect(buildValueColumns('integer', 3)).toEqual({ valueInteger: '3' });
    expect(buildValueColumns('boolean', true)).toEqual({ valueBoolean: true });
    expect(buildValueColumns('json', { a: 1 })).toEqual({
      valueJson: { a: 1 },
    });
  });

  describe('dataType "code"', () => {
    it('writes valueConceptId when the field has a valueSetId', () => {
      const columns = buildValueColumns('code', 'c-123', {
        valueSetId: 'vs-1',
      });
      expect(columns).toEqual({ valueConceptId: 'c-123' });
    });

    it('writes valueCode — not valueConceptId — when the field has no valueSetId', () => {
      // Es el caso de las opciones propias (dataType "code" sin valueSetId):
      // "Ex fumador" no es un concepto del catálogo, y value_concept_id es
      // uuid con FK a terminology.catalog_concepts — escribirla ahí rompería
      // el tipo y la restricción.
      const columns = buildValueColumns('code', 'Ex fumador', {});
      expect(columns).toEqual({ valueCode: 'Ex fumador' });
    });

    it('defaults to valueCode when no field is passed at all', () => {
      const columns = buildValueColumns('code', 'Ex fumador');
      expect(columns).toEqual({ valueCode: 'Ex fumador' });
    });
  });

  it('rejects a null or undefined value regardless of dataType', () => {
    expect(() => buildValueColumns('string', null)).toThrow(
      PreconditionFailedException,
    );
    expect(() =>
      buildValueColumns('code', undefined, { valueSetId: 'vs-1' }),
    ).toThrow(PreconditionFailedException);
  });

  it('rejects an unsupported dataType', () => {
    expect(() => buildValueColumns('unknown-type', 'x')).toThrow(
      PreconditionFailedException,
    );
  });
});
