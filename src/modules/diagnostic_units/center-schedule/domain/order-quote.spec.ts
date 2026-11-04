import { quoteOrder } from './order-quote';

const parts = [
  { conceptId: 'HB', amount: 20 },
  { conceptId: 'HTO', amount: 15.5 },
  { conceptId: 'PLT', amount: null },
];

describe('quoteOrder', () => {
  it('charges the panel when no component was picked', () => {
    expect(quoteOrder(60, [], parts)).toBe(60);
  });

  it('charges the panel when every component was picked', () => {
    expect(quoteOrder(60, ['HB', 'HTO', 'PLT'], parts)).toBe(60);
  });

  it('charges the panel when the center sells it only whole', () => {
    expect(quoteOrder(60, ['HB'], [])).toBe(60);
  });

  it('adds up only the picked components', () => {
    expect(quoteOrder(60, ['HB', 'HTO'], parts)).toBe(35.5);
  });

  it('gives no quote when a picked component has no price', () => {
    expect(quoteOrder(60, ['HB', 'PLT'], parts)).toBeNull();
  });

  it('gives no quote when the center lacks a picked component', () => {
    expect(quoteOrder(60, ['HB', 'VCM'], parts)).toBeNull();
  });
});
