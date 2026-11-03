import { CONCEPTS } from '../../../common/constants/concepts';
import { resolveInsuranceCurrencyCode } from './insurance-currency';

describe('insurance currency domain rule', () => {
  it('uses the registered code when no concept identity is known', () => {
    expect(resolveInsuranceCurrencyCode('unknown-currency', 'USD')).toBe('USD');
  });

  it('uses the canonical code for known currency concepts', () => {
    expect(resolveInsuranceCurrencyCode(CONCEPTS.CURRENCY_BOB, 'legacy')).toBe(
      'BOB',
    );
  });

  it('returns null when the registry did not provide a currency code', () => {
    expect(
      resolveInsuranceCurrencyCode(CONCEPTS.CURRENCY_BOB, '  '),
    ).toBeNull();
    expect(resolveInsuranceCurrencyCode(undefined, undefined)).toBeNull();
  });
});
