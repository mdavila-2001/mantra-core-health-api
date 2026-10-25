import { jest } from '@jest/globals';
import { ProcedureReferenceReader } from './procedure-reference.reader';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Doble del `EntityManager` que responde `execute` con las filas dadas y deja
 * constancia de cada consulta.
 *
 * @param rows - Filas de `concept_properties` que devuelve la consulta.
 * @returns El doble y el mock de `execute`.
 */
function em(rows: unknown[] = []) {
  const execute = mockFn().mockResolvedValue(rows);
  return { double: { getConnection: () => ({ execute }) } as any, execute };
}

describe('ProcedureReferenceReader', () => {
  const reader = new ProcedureReferenceReader();

  it('lee precio y unidad UMA de un procedimiento', async () => {
    const { double } = em([
      {
        concept_id: 'c1',
        property_code: 'procedure:reference-price',
        valor: '150',
      },
      { concept_id: 'c1', property_code: 'procedure:price-unit', valor: 'UMA' },
    ]);

    const map = await reader.referencesFor(double, ['c1']);

    expect(map.get('c1')).toEqual({
      referencePrice: 150,
      referenceUnit: 'UMA',
    });
  });

  it('lee la unidad USD', async () => {
    const { double } = em([
      {
        concept_id: 'c1',
        property_code: 'procedure:reference-price',
        valor: '45.5',
      },
      { concept_id: 'c1', property_code: 'procedure:price-unit', valor: 'USD' },
    ]);

    const map = await reader.referencesFor(double, ['c1']);

    expect(map.get('c1')).toEqual({
      referencePrice: 45.5,
      referenceUnit: 'USD',
    });
  });

  it('un concepto sin propiedades queda con null en ambos campos', async () => {
    const { double } = em([]);

    const map = await reader.referencesFor(double, ['c1']);

    expect(map.get('c1')).toEqual({
      referencePrice: null,
      referenceUnit: null,
    });
  });

  it('descarta una unidad desconocida y un precio que no es número', async () => {
    const { double } = em([
      {
        concept_id: 'c1',
        property_code: 'procedure:reference-price',
        valor: 'abc',
      },
      { concept_id: 'c1', property_code: 'procedure:price-unit', valor: 'BOB' },
    ]);

    const map = await reader.referencesFor(double, ['c1']);

    expect(map.get('c1')).toEqual({
      referencePrice: null,
      referenceUnit: null,
    });
  });

  it('un lote vacío no consulta', async () => {
    const { double, execute } = em();

    const map = await reader.referencesFor(double, []);

    expect(map.size).toBe(0);
    expect(execute).not.toHaveBeenCalled();
  });

  it('los repetidos se leen una sola vez', async () => {
    const { double, execute } = em([]);

    const map = await reader.referencesFor(double, ['c1', 'c1', 'c2']);

    expect(map.size).toBe(2);
    expect(execute).toHaveBeenCalledTimes(1);
    const params = execute.mock.calls[0][1] as string[];
    expect(params.filter((p) => p === 'c1')).toHaveLength(1);
  });
});
