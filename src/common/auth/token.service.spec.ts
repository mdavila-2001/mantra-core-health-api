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

  it('incluye el tipo de cada tenant sin cambiar la lista de ids ni los nombres', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], ['t-1', 't-2'], {
      tenantNames: { 't-1': 'Seguros Andina', 't-2': 'Hospital San Lucas' },
      tenantTypes: { 't-1': 'PAYER', 't-2': 'PROVIDER' },
    });

    const payload = signedPayload(jwt);
    expect(payload.tenants).toEqual(['t-1', 't-2']);
    expect(payload.tenantNames).toEqual({
      't-1': 'Seguros Andina',
      't-2': 'Hospital San Lucas',
    });
    expect(payload.tenantTypes).toEqual({ 't-1': 'PAYER', 't-2': 'PROVIDER' });
  });

  it('incluye el perfil de paciente como `pid` para el autoservicio del portal', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER', 'PATIENT'], ['t-1'], {
      patientProfileId: 'per-1',
    });

    expect(signedPayload(jwt)).toMatchObject({ pid: 'per-1' });
  });

  it('incluye el perfil profesional como `hpid` para identificar su agenda', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER', 'PRACTITIONER'], ['t-1'], {
      practitionerProfileId: 'per-3',
    });

    expect(signedPayload(jwt)).toMatchObject({ hpid: 'per-3' });
  });

  it('omite los claims vacíos: viajan en cada cabecera de cada petición', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], []);

    const payload = signedPayload(jwt);
    expect(payload).not.toHaveProperty('name');
    expect(payload).not.toHaveProperty('tenantNames');
    expect(payload).not.toHaveProperty('tenantTypes');
    // Una cuenta que no es de un paciente no arrastra el claim.
    expect(payload).not.toHaveProperty('pid');
    // Ni la que no tiene perfil profesional el suyo.
    expect(payload).not.toHaveProperty('hpid');
  });

  it('un mapa de nombres vacío tampoco se firma', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], [], { tenantNames: {} });

    expect(signedPayload(jwt)).not.toHaveProperty('tenantNames');
  });

  it('un mapa de tipos vacío tampoco se firma', () => {
    const { service, jwt } = build();

    service.signAccessToken('u-1', 'sid-1', ['USER'], [], { tenantTypes: {} });

    expect(signedPayload(jwt)).not.toHaveProperty('tenantTypes');
  });

  it('issueSessionTokens propaga los datos de presentación', () => {
    const { service, jwt } = build();

    service.issueSessionTokens('u-1', ['USER'], ['t-1'], { name: 'Ana' });

    expect(signedPayload(jwt)).toMatchObject({ name: 'Ana' });
  });
});

describe('TokenService: tipo de cuenta (accountKind)', () => {
  it('emite accountKind ORGANIZATION si alguna organización del titular está en modo organización', () => {
    const { service, jwt } = build();
    service.signAccessToken('u1', 's1', ['USER'], ['t1', 't2'], {
      tenantAccountKinds: { t1: 'PERSON', t2: 'ORGANIZATION' },
    });
    const payload = signedPayload(jwt);
    expect(payload.accountKind).toBe('ORGANIZATION');
    expect(payload.tenantAccountKinds).toEqual({
      t1: 'PERSON',
      t2: 'ORGANIZATION',
    });
  });

  it('con todo en PERSON el claim es PERSON', () => {
    const { service, jwt } = build();
    service.signAccessToken('u1', 's1', ['USER'], ['t1'], {
      tenantAccountKinds: { t1: 'PERSON' },
    });
    expect(signedPayload(jwt).accountKind).toBe('PERSON');
  });

  it('sin organizaciones no ocupa espacio en el token', () => {
    const { service, jwt } = build();
    service.signAccessToken('u1', 's1', ['USER'], [], {});
    expect(signedPayload(jwt)).not.toHaveProperty('accountKind');
  });
});

describe('TokenService: organizaciones que niegan y alcance limitado (N2/N6)', () => {
  it('deniedTenants viaja en el token con el motivo, y las organizaciones que niegan no están en tenants', () => {
    const { service, jwt } = build();
    service.signAccessToken('u1', 's1', ['USER'], ['y'], {
      deniedTenants: { x: 'OUTSIDE_ALLOWED_HOURS' },
    });
    const payload = signedPayload(jwt);
    expect(payload.tenants).toEqual(['y']);
    expect(payload.deniedTenants).toEqual({ x: 'OUTSIDE_ALLOWED_HOURS' });
  });

  it('sin organizaciones que niegan no ocupa espacio en el token', () => {
    const { service, jwt } = build();
    service.signAccessToken('u1', 's1', ['USER'], ['y'], { deniedTenants: {} });
    expect(signedPayload(jwt)).not.toHaveProperty('deniedTenants');
    expect(signedPayload(jwt)).not.toHaveProperty('mfaEnrollment');
  });

  it('el token de alcance limitado lleva mfaEnrollment: true', () => {
    const { service, jwt } = build();
    service.signAccessToken('u1', 's1', [], [], { mfaEnrollment: true });
    expect(signedPayload(jwt).mfaEnrollment).toBe(true);
  });

  it('mfaEnrollment: false no se emite', () => {
    const { service, jwt } = build();
    service.signAccessToken('u1', 's1', ['USER'], ['t1'], {
      mfaEnrollment: false,
    });
    expect(signedPayload(jwt)).not.toHaveProperty('mfaEnrollment');
  });
});

describe('TokenService: marca de sesión con segundo factor en el refresh token', () => {
  it('un refresh token común no lleva marca; el de una sesión verificada sí', () => {
    const { service } = build();
    const plain = service.issueRefreshToken();
    const verified = service.issueRefreshToken(true);
    expect(service.isMfaVerifiedRefreshToken(plain.raw)).toBe(false);
    expect(service.isMfaVerifiedRefreshToken(verified.raw)).toBe(true);
  });

  it('la marca forma parte del secreto hasheado: quitarla o ponerla no encuentra el token', () => {
    const { service } = build();
    const verified = service.issueRefreshToken(true);
    const stripped = verified.raw.replace(/^mfa\./, '');
    expect(service.hashRefreshToken(stripped)).not.toBe(verified.hash);
    const plain = service.issueRefreshToken();
    expect(service.hashRefreshToken(`mfa.${plain.raw}`)).not.toBe(plain.hash);
  });

  it('el login emite el refresh token marcado solo si la sesión superó el factor', () => {
    const { service } = build();
    expect(
      service.isMfaVerifiedRefreshToken(
        service.issueSessionTokens('u1', ['USER'], ['t1'], {}, true)
          .refreshToken,
      ),
    ).toBe(true);
    expect(
      service.isMfaVerifiedRefreshToken(
        service.issueSessionTokens('u1', ['USER'], ['t1'], {}).refreshToken,
      ),
    ).toBe(false);
  });

  it('el refresh token sigue siendo único y de alta entropía', () => {
    const { service } = build();
    const a = service.issueRefreshToken(true).raw;
    const b = service.issueRefreshToken(true).raw;
    expect(a).not.toBe(b);
    expect(a.length).toBeGreaterThan(60);
  });
});
