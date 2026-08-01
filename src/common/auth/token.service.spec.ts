import { describe, it, expect, jest } from '@jest/globals';
import { TokenService } from './token.service';

/** El payload que `signAccessToken` le pasó al firmador. */
function build() {
  const jwt = { sign: (jest.fn as any)(() => 'firmado') } as any;
  const service = new TokenService(jwt);
  return { service, jwt };
}

/** Extrae el payload del último `sign`. */
function signedPayload(jwt: any): Record<string, unknown> {
  return jwt.sign.mock.calls.at(-1)[0];
}

describe('TokenService · claims de presentación', () => {
  it('incluye el nombre para que la interfaz no muestre el uuid', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], ['t-1'], {
      name: 'Ana Pérez',
    });

    expect(signedPayload(jwt)).toMatchObject({ name: 'Ana Pérez' });
  });

  it('incluye los nombres de tenant sin cambiar la lista de ids', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], ['t-1', 't-2'], {
      tenantNames: { 't-1': 'Clínica Norte', 't-2': 'Clínica Sur' },
    });

    const payload = signedPayload(jwt);
    // `tenants` sigue siendo la lista de uuid que valida el interceptor.
    expect(payload.tenants).toEqual(['t-1', 't-2']);
    expect(payload.tenantNames).toEqual({
      't-1': 'Clínica Norte',
      't-2': 'Clínica Sur',
    });
  });

  it('omite los claims vacíos: viajan en cada cabecera de cada petición', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], []);

    const payload = signedPayload(jwt);
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('tenantNames');
  });

  it('un mapa de nombres vacío tampoco se firma', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], [], { tenantNames: {} });

    expect(signedPayload(jwt)).not.toHaveProperty('tenantNames');
  });

  it('issueSessionTokens propaga los datos de presentación', () => {
    const { service, jwt } = build();

    service.issueSessionTokens('u-1', ['USER'], ['t-1'], { name: 'Ana' });

    expect(signedPayload(jwt)).toMatchObject({ name: 'Ana' });
  });
});
