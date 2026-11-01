import {
  externalSystemConfigJson,
  externalSystemUrlProblem,
  loadExternalSystemHostPolicy,
  normalizeBaseUrl,
  parseExternalSystemConfig,
} from './external-system';

const DEV = {
  production: false,
  allowedHosts: [] as string[],
  allowAnyHost: true,
};

describe('external system (FAR-C9 · C9-3)', () => {
  it('config_json round-trips and anything else is not a pharmacy system', () => {
    const config = {
      format: 'SIMULATED_CHAIN' as const,
      baseUrl: 'http://sim:4100/simulated-chain/api/v2',
      externalPharmacyCode: 'CHAIN-1',
    };
    expect(parseExternalSystemConfig(externalSystemConfigJson(config))).toEqual(
      config,
    );
    expect(parseExternalSystemConfig(null)).toBeNull();
    expect(parseExternalSystemConfig({ webhook: true })).toBeNull();
    expect(
      parseExternalSystemConfig({
        ...externalSystemConfigJson(config),
        format: 'SOAP',
      }),
    ).toBeNull();
    expect(
      parseExternalSystemConfig({
        ...externalSystemConfigJson(config),
        baseUrl: '',
      }),
    ).toBeNull();
  });

  it('normalizes the trailing slashes away', () => {
    expect(normalizeBaseUrl('  http://a/b//  ')).toBe('http://a/b');
  });

  it('only http(s) without credentials, query or fragment', () => {
    expect(externalSystemUrlProblem('http://sim:4100/x', DEV)).toBeNull();
    expect(externalSystemUrlProblem('ftp://sim/x', DEV)).toBe('URL_INVALID');
    expect(externalSystemUrlProblem('not a url', DEV)).toBe('URL_INVALID');
    expect(externalSystemUrlProblem('http://u:p@sim/x', DEV)).toBe(
      'URL_INVALID',
    );
    expect(externalSystemUrlProblem('http://sim/x?a=1', DEV)).toBe(
      'URL_INVALID',
    );
    expect(externalSystemUrlProblem('http://sim/x#f', DEV)).toBe('URL_INVALID');
  });

  it('with an allow-list only those hosts, exact or *.domain', () => {
    const policy = {
      production: false,
      allowedHosts: ['sim', '*.farmacia.bo'],
      allowAnyHost: false,
    };
    expect(externalSystemUrlProblem('http://sim:4100/x', policy)).toBeNull();
    expect(
      externalSystemUrlProblem('https://api.farmacia.bo', policy),
    ).toBeNull();
    expect(externalSystemUrlProblem('https://farmacia.bo', policy)).toBe(
      'HOST_NOT_ALLOWED',
    );
    expect(externalSystemUrlProblem('https://evilfarmacia.bo', policy)).toBe(
      'HOST_NOT_ALLOWED',
    );
    expect(
      externalSystemUrlProblem('http://169.254.169.254/latest', policy),
    ).toBe('HOST_NOT_ALLOWED');
  });

  it('without a list nobody is called, in any environment, unless opened on purpose', () => {
    const closed = { production: false, allowedHosts: [], allowAnyHost: false };
    expect(externalSystemUrlProblem('http://sim:4100/x', closed)).toBe(
      'HOST_NOT_ALLOWED',
    );
    expect(externalSystemUrlProblem('http://sim:4100/x', DEV)).toBeNull();
  });

  it('in production nobody is called without a list, even opened, and only https', () => {
    expect(
      externalSystemUrlProblem('https://api.farmacia.bo', {
        production: true,
        allowedHosts: [],
        allowAnyHost: true,
      }),
    ).toBe('HOST_NOT_ALLOWED');
    const policy = {
      production: true,
      allowedHosts: ['api.farmacia.bo'],
      allowAnyHost: false,
    };
    expect(
      externalSystemUrlProblem('https://api.farmacia.bo', policy),
    ).toBeNull();
    expect(externalSystemUrlProblem('http://api.farmacia.bo', policy)).toBe(
      'HOST_NOT_ALLOWED',
    );
  });

  it('reads the policy from the environment', () => {
    expect(
      loadExternalSystemHostPolicy({
        NODE_ENV: 'production',
        PHARMACY_EXTERNAL_ALLOWED_HOSTS: ' Sim , *.Farmacia.bo ,',
      }),
    ).toEqual({
      production: true,
      allowedHosts: ['sim', '*.farmacia.bo'],
      allowAnyHost: false,
    });
  });
});
