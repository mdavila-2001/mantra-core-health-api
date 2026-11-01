import { jest } from '@jest/globals';

const resolve = jest.fn(() => new Promise<never>(() => undefined));
const lookup = jest.fn();
jest.unstable_mockModule('../../../../common/http/ssrf-guard', () => ({
  resolveOutboundDestination: resolve,
  pinnedLookup: lookup,
}));
let httpModule: typeof import('./pharmacy-system-http');
beforeAll(async () => {
  // Jest resuelve el módulo TypeScript después de registrar el doble ESM.
  const moduleName = './pharmacy-system-http';
  httpModule = await import(moduleName);
});

it('termina dentro del plazo aunque DNS no resuelva y no abre un socket', async () => {
  const client = httpModule.createPharmacySystemHttp(
    'https://synthetic.invalid',
    20,
    {},
  );
  await expect(httpModule.getJson(client, '/health')).rejects.toMatchObject({
    kind: 'UNREACHABLE',
  });
  expect(resolve).toHaveBeenCalledTimes(1);
  expect(lookup).not.toHaveBeenCalled();
});
