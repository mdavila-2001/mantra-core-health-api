import {
  duplicateScopeStockConnections,
  siteIdsWithOwnStockConnection,
  stockConnectionForSite,
  type CoverageConnection,
} from './connection-coverage';

const conn = (
  id: string,
  pharmacySiteId: string | null,
  writesStock = true,
): CoverageConnection => ({ id, pharmacySiteId, writesStock });

describe('regla de conexiones de stock (C9-5)', () => {
  describe('duplicateScopeStockConnections', () => {
    it('sin otras conexiones no hay duplicado', () => {
      expect(
        duplicateScopeStockConnections(conn('a', null), [conn('a', null)]),
      ).toEqual([]);
    });
    it('una general y una de sucursal coexisten', () => {
      expect(
        duplicateScopeStockConnections(conn('a', null), [
          conn('a', null),
          conn('b', 's2'),
        ]),
      ).toEqual([]);
      expect(
        duplicateScopeStockConnections(conn('b', 's2'), [
          conn('a', null),
          conn('b', 's2'),
        ]),
      ).toEqual([]);
    });
    it('dos generales son duplicado', () => {
      expect(
        duplicateScopeStockConnections(conn('a', null), [
          conn('a', null),
          conn('b', null),
        ]),
      ).toEqual(['b']);
    });
    it('dos de la misma sucursal son duplicado; de sucursales distintas no', () => {
      expect(
        duplicateScopeStockConnections(conn('a', 's1'), [
          conn('a', 's1'),
          conn('b', 's1'),
          conn('c', 's2'),
        ]),
      ).toEqual(['b']);
    });
    it('una inactiva o sin consulta de stock no cuenta', () => {
      expect(
        duplicateScopeStockConnections(conn('a', null), [
          conn('a', null),
          conn('b', null, false),
        ]),
      ).toEqual([]);
    });
  });

  describe('siteIdsWithOwnStockConnection', () => {
    it('la general excluye las sucursales con conexión propia', () => {
      expect([
        ...siteIdsWithOwnStockConnection(conn('a', null), [
          conn('a', null),
          conn('b', 's2'),
          conn('c', 's3', false),
        ]),
      ]).toEqual(['s2']);
    });
    it('una conexión de sucursal no excluye nada', () => {
      expect(
        siteIdsWithOwnStockConnection(conn('b', 's2'), [
          conn('a', null),
          conn('b', 's2'),
          conn('c', 's3'),
        ]).size,
      ).toBe(0);
    });
  });

  describe('stockConnectionForSite', () => {
    it('sin conexiones: NONE', () => {
      expect(stockConnectionForSite('s1', [])).toEqual({ status: 'NONE' });
    });
    it('solo la general: manda la general', () => {
      expect(stockConnectionForSite('s1', [conn('a', null)])).toEqual({
        status: 'ONE',
        id: 'a',
      });
    });
    it('general y sucursal: gana la sucursal en su sede, la general en las demás', () => {
      const all = [conn('a', null), conn('b', 's1')];
      expect(stockConnectionForSite('s1', all)).toEqual({
        status: 'ONE',
        id: 'b',
      });
      expect(stockConnectionForSite('s2', all)).toEqual({
        status: 'ONE',
        id: 'a',
      });
    });
    it('duplicados en el nivel ganador: DUPLICATE, no se elige', () => {
      expect(
        stockConnectionForSite('s1', [conn('a', 's1'), conn('b', 's1')]),
      ).toEqual({ status: 'DUPLICATE', ids: ['a', 'b'] });
    });
    it('una sucursal inactiva no tapa a la general', () => {
      expect(
        stockConnectionForSite('s1', [conn('a', null), conn('b', 's1', false)]),
      ).toEqual({ status: 'ONE', id: 'a' });
    });
  });
});
