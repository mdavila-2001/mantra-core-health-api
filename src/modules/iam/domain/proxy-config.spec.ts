import { assessProxyConfig } from './proxy-config';

const codes = (raw: string | undefined, rules: number): string[] =>
  assessProxyConfig(raw, rules).map((f) => f.code);

describe('assessProxyConfig (TRUST_PROXY_HOPS)', () => {
  it('con reglas de red activas y 0 saltos avisa: todos los clientes valdrían la IP del proxy', () => {
    expect(codes('0', 3)).toEqual(['TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES']);
    expect(codes(undefined, 1)).toEqual([
      'TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES',
    ]);
    expect(codes('', 1)).toEqual(['TRUST_PROXY_HOPS_ZERO_WITH_NETWORK_RULES']);
  });

  it('sin reglas de red activas, 0 saltos es la configuración de desarrollo y no avisa', () => {
    expect(codes('0', 0)).toEqual([]);
    expect(codes(undefined, 0)).toEqual([]);
  });

  it('con saltos configurados y reglas, todo coherente', () => {
    expect(codes('2', 5)).toEqual([]);
    expect(codes('1', 0)).toEqual([]);
  });

  it('un valor que no es entero >= 0 es inconsistente', () => {
    for (const bad of ['dos', '-1', '1.5', 'NaN', '2 saltos']) {
      expect(codes(bad, 1)).toEqual(['TRUST_PROXY_HOPS_INVALID']);
    }
  });

  it('más de 3 saltos avisa: con más saltos que proxies el origen lo inventa el cliente', () => {
    expect(codes('4', 0)).toEqual(['TRUST_PROXY_HOPS_HIGH']);
    expect(codes('3', 0)).toEqual([]);
  });

  it('el mensaje dice qué revisar y no contiene valores sensibles', () => {
    const [finding] = assessProxyConfig('0', 2);
    expect(finding.message).toContain('GET /iam/me/network');
  });
});
