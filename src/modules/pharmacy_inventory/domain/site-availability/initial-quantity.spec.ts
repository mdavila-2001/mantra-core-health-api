import { defaultAvailableQuantity } from './initial-quantity';

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
