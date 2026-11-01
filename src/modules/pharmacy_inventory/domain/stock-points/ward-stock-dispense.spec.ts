import { describe, expect, it } from '@jest/globals';
import { HeldByKey, wardStockCovers } from './ward-stock-dispense';

const key = {
  inventoryLocationId: 'loc',
  pharmacyProductId: 'prod',
  inventoryLotId: 'lot-1',
};

describe('dispensa desde botiquín (§F5c, revisión de seguridad)', () => {
  it('sin reserva y sin disponible → no alcanza', () => {
    expect(wardStockCovers(0, new HeldByKey([]).of(key), 2)).toBe(false);
  });
  it('reserva de otro lote no suma nada', () => {
    const held = new HeldByKey([{ ...key, inventoryLotId: 'lot-2', held: 5 }]);
    expect(held.of(key)).toBe(0);
    expect(wardStockCovers(0, held.of(key), 2)).toBe(false);
  });
  it('reserva de otro producto o ubicación no suma nada', () => {
    const held = new HeldByKey([
      { ...key, pharmacyProductId: 'otro', held: 5 },
      { ...key, inventoryLocationId: 'otra', held: 5 },
    ]);
    expect(held.of(key)).toBe(0);
  });
  it('reserva por menos cantidad → no alcanza', () => {
    const held = new HeldByKey([{ ...key, held: 1 }]);
    expect(wardStockCovers(0, held.of(key), 2)).toBe(false);
  });
  it('reserva válida para la misma clave → alcanza, y se consume', () => {
    const held = new HeldByKey([{ ...key, held: 2 }]);
    expect(wardStockCovers(0, held.of(key), 2)).toBe(true);
    held.consume(key, 2);
    expect(wardStockCovers(0, held.of(key), 1)).toBe(false);
  });
  it('disponible propio también cuenta', () => {
    expect(wardStockCovers(3, 0, 3)).toBe(true);
  });
});
