import {
  defaultAvailableQuantity,
  initialSiteQuantity,
} from './initial-quantity';

describe('initialSiteQuantity', () => {
  it.each([
    [5, false, 5],
    [0, false, 0],
    [null, false, 1],
    [null, true, 0],
    [4, true, 4],
  ])(
    'stockQuantity %p con «no tengo» %p → %p',
    (stockQuantity, outOfStockDeclared, expected) => {
      expect(initialSiteQuantity({ stockQuantity, outOfStockDeclared })).toBe(
        expected,
      );
    },
  );
});

describe('defaultAvailableQuantity', () => {
  it.each([
    [7, 7],
    [0, 1],
    [null, 1],
    [undefined, 1],
  ])('stockQuantity %p → %p', (stockQuantity, expected) => {
    expect(defaultAvailableQuantity(stockQuantity)).toBe(expected);
  });
});
