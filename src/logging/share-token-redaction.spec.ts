import {
  REDACTED_SHARE_TOKEN,
  redactShareTokenInReferer,
  redactShareTokenInUrl,
} from './share-token-redaction';

/** Un token con la forma de los emitidos (43 caracteres base64url), sintético. */
const TOKEN = 'Q2hhbmdlTWVQbGVhc2VUaGlzSXNOb3RBUmVhbFRva2U';
/** El mismo token con un guion codificado adentro, como lo decodifica Express. */
const TOKEN_WITH_ENCODED_DASH =
  'Q2hhbmdlTWVQ%2DbGVhc2VUaGlzSXNOb3RBUmVhbFRva2U';
const UUID = '77777777-7777-4777-8777-777777777777';

/**
 * La redacción del token tolera las rutas no canónicas que un cliente puede
 * mandar y que acaban en un 404 que se loguea (S-6, RES-1/RES-2).
 */
describe('share-token-redaction', () => {
  describe('redactShareTokenInUrl: rutas no canónicas', () => {
    it.each([
      `/public//prescription-shares/${TOKEN}`,
      `/public/prescription-shares//${TOKEN}`,
      `//public///prescription-shares///${TOKEN}`,
      `/public%2Fprescription-shares/${TOKEN}`,
      `/public%2fprescription-shares%2F${TOKEN}`,
      `/public/prescription%2Dshares/${TOKEN}`,
      `/public/prescription%2dshares/${TOKEN}`,
      `/public/prescription-shares%2F${TOKEN}`,
      `/PUBLIC/Prescription%2DShares/${TOKEN}`,
      `/%70ublic/prescription-shares/${TOKEN}`,
      `/public/prescription-shares%252F${TOKEN}`,
      `/pharmacy//prescription-shares/${TOKEN}`,
      `/pharmacy%2Fprescription%2Dshares%2F${TOKEN}`,
      `/clinical/prescription-shares/by-token//${TOKEN}`,
      `/clinical/prescription-shares//by-token/${TOKEN}`,
      `/clinical%2Fprescription-shares%2Fby-token%2F${TOKEN}`,
      `/clinical/prescription-shares/by%2Dtoken/${TOKEN}`,
      `/Clinical/Prescription-Shares/BY-TOKEN/${TOKEN}`,
      `/api/v1/public/prescription-shares/${TOKEN}`,
      `/public/prescription-shares/${TOKEN_WITH_ENCODED_DASH}`,
      `/public/prescription-shares/${TOKEN}/extra?x=1`,
      `Cannot GET /public//prescription-shares/${TOKEN}`,
      `https://api.alovida.test/public%2Fprescription-shares/${TOKEN}`,
    ])('%s', (url) => {
      const redacted = redactShareTokenInUrl(url);
      expect(redacted).toContain(REDACTED_SHARE_TOKEN);
      expect(redacted).not.toContain(TOKEN);
      expect(redacted).not.toContain(TOKEN_WITH_ENCODED_DASH);
      expect(redacted).not.toContain('Q2hhbmdlTWVQ');
    });

    it('conserva la forma de la ruta y la query', () => {
      expect(
        redactShareTokenInUrl(`/public%2Fprescription-shares//${TOKEN}?x=1`),
      ).toBe('/public%2Fprescription-shares//[token]?x=1');
      expect(
        redactShareTokenInUrl(
          `Cannot GET /pharmacy/prescription%2Dshares/${TOKEN}`,
        ),
      ).toBe('Cannot GET /pharmacy/prescription%2Dshares/[token]');
    });

    it('es idempotente', () => {
      const once = redactShareTokenInUrl(
        `/public//prescription-shares/${TOKEN}`,
      );
      expect(redactShareTokenInUrl(once)).toBe(once);
    });
  });

  describe('redactShareTokenInUrl: rutas que no cambian', () => {
    it.each([
      '/clinical/prescription-shares',
      `/clinical/prescription-shares?patientProfileId=${UUID}`,
      `/clinical/prescription-shares/${UUID}/revoke`,
      `/clinical//prescription-shares/${UUID}/revoke`,
      `/public/prescriptions/${UUID}/verify`,
      '/public/prescription-shares',
      '/public/prescription-shares/',
      '/health',
      `/iam/users/${UUID}`,
      'Cannot GET /iam/users',
      'texto sin rutas',
      '',
    ])('%s', (url) => {
      expect(redactShareTokenInUrl(url)).toBe(url);
    });
  });

  describe('redactShareTokenInReferer', () => {
    it.each([
      `https://app.alovida.test/rx/${TOKEN}`,
      `https://app.alovida.test/rx//${TOKEN}`,
      `https://app.alovida.test/rx%2F${TOKEN}`,
      `https://app.alovida.test/RX%2f${TOKEN}?x=1`,
      `https://app.alovida.test/administration/pharmacy-orders/rx//${TOKEN}`,
      `https://app.alovida.test/%72x/${TOKEN}`,
      `https://api.alovida.test/public//prescription-shares/${TOKEN}`,
    ])('%s', (referer) => {
      const redacted = redactShareTokenInReferer(referer);
      expect(redacted).toContain(REDACTED_SHARE_TOKEN);
      expect(redacted).not.toContain(TOKEN);
    });

    it.each([
      `https://app.alovida.test/auth?returnUrl=%2Frx%2F${TOKEN}`,
      `https://app.alovida.test/auth?returnUrl=/rx/${TOKEN}`,
      `https://app.alovida.test/auth?returnUrl=%252Frx%252F${TOKEN}&x=1`,
      `https://app.alovida.test/auth#/rx/${TOKEN}`,
      `https://app.alovida.test/auth?next=%2Fpublic%2Fprescription-shares%2F${TOKEN}`,
    ])('en la query: %s', (referer) => {
      const redacted = redactShareTokenInReferer(referer);
      expect(redacted).toContain(REDACTED_SHARE_TOKEN);
      expect(redacted).not.toContain(TOKEN);
      expect(redacted.startsWith('https://app.alovida.test/auth')).toBe(true);
    });

    it.each([
      `https://app.alovida.test/auth?returnUrl=%2Fverify%2Frx%2F${TOKEN}`,
      `https://app.alovida.test/auth?returnUrl=%2Frxnorm%2F${TOKEN}`,
      `https://app.alovida.test/auth?q=${TOKEN}`,
    ])('una query sin ruta con token no cambia: %s', (referer) => {
      expect(redactShareTokenInReferer(referer)).toBe(referer);
    });

    it.each([
      `https://app.alovida.test/verify/rx/${UUID}`,
      `https://app.alovida.test/verify//rx/${UUID}`,
      'https://app.alovida.test/account/pharmacy/prescriptions',
      `https://app.alovida.test/proxy/${TOKEN}`,
      `https://app.alovida.test/rxnorm/${TOKEN}`,
    ])('no cambia: %s', (referer) => {
      expect(redactShareTokenInReferer(referer)).toBe(referer);
    });
  });
});
