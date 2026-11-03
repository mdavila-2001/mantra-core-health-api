import {
  conflictingStockConnections,
  type CoverageConnection,
} from './connection-coverage';

const conn = (
  id: string,
  pharmacySiteId: string | null,
  writesStock = true,
): CoverageConnection => ({ id, pharmacySiteId, writesStock });

describe('conflictingStockConnections (H-05 · precedencia entre conexiones)', () => {
  it('no hay conflicto cuando es la única conexión', () => {
    expect(
      conflictingStockConnections({ id: 'a' }, ['s1', 's2'], [conn('a', null)]),
    ).toEqual([]);
  });

  it('una conexión de toda la farmacia choca con una de una sede', () => {
    expect(
      conflictingStockConnections(
        { id: 'a' },
        ['s1', 's2'],
        [conn('a', null), conn('b', 's2')],
      ),
    ).toEqual(['b']);
  });

  it('una de una sede choca con una de toda la farmacia', () => {
    expect(
      conflictingStockConnections(
        { id: 'b' },
        ['s2'],
        [conn('a', null), conn('b', 's2')],
      ),
    ).toEqual(['a']);
  });

  it('dos conexiones de la misma sede chocan', () => {
    expect(
      conflictingStockConnections(
        { id: 'a' },
        ['s1'],
        [conn('a', 's1'), conn('b', 's1')],
      ),
    ).toEqual(['b']);
  });

  it('conexiones de sedes distintas no chocan', () => {
    expect(
      conflictingStockConnections(
        { id: 'a' },
        ['s1'],
        [conn('a', 's1'), conn('b', 's2')],
      ),
    ).toEqual([]);
  });

  it('una conexión inactiva o sin consulta de stock no cuenta', () => {
    expect(
      conflictingStockConnections(
        { id: 'a' },
        ['s1'],
        [conn('a', null), conn('b', null, false)],
      ),
    ).toEqual([]);
  });

  it('sin sedes que escribir no hay conflicto', () => {
    expect(
      conflictingStockConnections(
        { id: 'a' },
        [],
        [conn('a', null), conn('b', null)],
      ),
    ).toEqual([]);
  });
});
