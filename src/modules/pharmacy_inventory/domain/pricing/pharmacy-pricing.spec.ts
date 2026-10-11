import {
  multiplyAmounts,
  payableAmount,
  sumAmounts,
  winningPriceFor,
} from './pharmacy-pricing';

describe('pharmacy pricing domain rules', () => {
  it('sums and multiplies decimal amounts without binary floating point drift', () => {
    expect(sumAmounts(['0.10', '0.20', '1.005'])).toBe('1.31');
    expect(multiplyAmounts('33.34', '3')).toBe('100.02');
  });

  it('prefers a site price and compares the patient payable amount', () => {
    const general = { code: 'GENERAL' };
    const site = { code: 'SITE', pharmacySiteId: 'site-1' };
    const priceLists = new Map([
      ['general', general],
      ['site', site],
    ]);
    const prices = [
      {
        pharmacyProductId: 'product-1',
        pharmacyPriceListId: 'general',
        unitAmount: '1.00',
      },
      {
        pharmacyProductId: 'product-1',
        pharmacyPriceListId: 'site',
        unitAmount: '2.00',
        patientAmount: '1.50',
      },
    ];

    const winner = winningPriceFor('product-1', 'site-1', prices, priceLists);

    expect(winner?.list.code).toBe('SITE');
    expect(winner && payableAmount(winner.price)).toBe('1.50');
  });
});
