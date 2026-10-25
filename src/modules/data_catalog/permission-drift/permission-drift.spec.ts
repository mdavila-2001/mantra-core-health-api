import {
  blockingDrift,
  computePermissionDrift,
  routeKey,
  SAMPLE_SIZE,
  staleAllowlist,
  type DriftRoute,
} from './permission-drift';

const ruta = (
  method: string,
  template: string,
  roles: string[] | null,
  isPublic = false,
): DriftRoute => ({
  method,
  template,
  controller: 'C',
  handler: 'h',
  roles,
  isPublic,
});

const RUTAS: DriftRoute[] = [
  ruta('GET', '/a', ['DPO']),
  ruta('GET', '/b', ['DPO', 'PLATFORM_ADMIN']),
  ruta('POST', '/c', ['PLATFORM_ADMIN']),
  ruta('GET', '/d', ['SECURITY_ADMIN']),
  ruta('POST', '/worker', ['SYSTEM']),
  ruta('GET', '/health', null, true),
  ruta('GET', '/whoami', null),
  ruta('GET', '/vacia', []),
];

const entrada = {
  routes: RUTAS,
  seededRoleCodes: ['DPO', 'AUDITOR'],
  platformRoleCodes: ['SECURITY_ADMIN', 'SUPERADMIN', 'SYSTEM'],
  databaseRoleCodes: ['DPO', 'AUDITOR', 'PLATFORM_ADMIN'],
};

describe('computePermissionDrift', () => {
  const informe = computePermissionDrift(entrada);

  it('cuenta rutas públicas, con roles y sin roles', () => {
    expect(informe.routes).toEqual({
      total: 8,
      public: 1,
      withRoles: 5,
      withoutRoles: 2,
    });
  });

  it('un rol que una ruta exige y nadie siembra aparece con sus rutas', () => {
    expect(informe.usedNotSeeded).toEqual([
      {
        role: 'PLATFORM_ADMIN',
        routeCount: 2,
        inDatabase: true,
        sample: [
          { method: 'GET', template: '/b', controller: 'C', handler: 'h' },
          { method: 'POST', template: '/c', controller: 'C', handler: 'h' },
        ],
      },
    ]);
  });

  it('los roles globales de iam y SYSTEM no cuentan como sin sembrar', () => {
    const roles = informe.usedNotSeeded.map((u) => u.role);
    expect(roles).not.toContain('SECURITY_ADMIN');
    expect(roles).not.toContain('SYSTEM');
  });

  it('un rol sembrado que ninguna ruta exige aparece como sin uso', () => {
    expect(informe.seededNotUsed).toEqual(['AUDITOR']);
  });

  it('una ruta autenticada sin @Roles (o con la lista vacía) aparece; una pública no', () => {
    expect(informe.routesWithoutRoles.map(routeKey)).toEqual([
      'GET /vacia',
      'GET /whoami',
    ]);
  });

  it('sin consultar la base, inDatabase es null: no se afirma lo que no se midió', () => {
    const sinBase = computePermissionDrift({
      ...entrada,
      databaseRoleCodes: null,
    });
    expect(sinBase.usedNotSeeded[0].inDatabase).toBeNull();
  });

  it('una ruta con el mismo rol repetido cuenta una vez', () => {
    const r = computePermissionDrift({
      ...entrada,
      routes: [ruta('GET', '/x', ['FOO', 'FOO'])],
    });
    expect(r.usedNotSeeded[0].routeCount).toBe(1);
  });

  it('acota los ejemplos y ordena por cantidad de rutas', () => {
    const muchas = Array.from({ length: SAMPLE_SIZE + 3 }, (_, i) =>
      ruta('GET', `/m/${i}`, ['MUCHAS']),
    );
    const r = computePermissionDrift({
      ...entrada,
      routes: [...muchas, ruta('GET', '/p', ['POCAS'])],
    });
    expect(r.usedNotSeeded.map((u) => u.role)).toEqual(['MUCHAS', 'POCAS']);
    expect(r.usedNotSeeded[0].sample).toHaveLength(SAMPLE_SIZE);
  });

  it('es determinista: el orden de las rutas de entrada no cambia el informe', () => {
    const invertido = computePermissionDrift({
      ...entrada,
      routes: [...RUTAS].reverse(),
    });
    expect(invertido).toEqual(informe);
  });
});

describe('blockingDrift (lo que un gate de CI rechazaría)', () => {
  const informe = computePermissionDrift(entrada);

  it('sin lista de excepciones, todo lo que hay bloquea', () => {
    expect(blockingDrift(informe)).toEqual([
      'rol usado sin sembrar: PLATFORM_ADMIN (2 rutas)',
      'ruta sin @Roles ni @Public: GET /vacia',
      'ruta sin @Roles ni @Public: GET /whoami',
    ]);
  });

  it('lo que está en la lista de excepciones no bloquea', () => {
    expect(
      blockingDrift(informe, {
        roles: ['PLATFORM_ADMIN'],
        routes: ['GET /vacia', 'GET /whoami'],
      }),
    ).toEqual([]);
  });

  it('un rol sembrado sin uso no bloquea', () => {
    expect(
      blockingDrift(informe, {
        roles: ['PLATFORM_ADMIN'],
        routes: ['GET /vacia', 'GET /whoami'],
      }),
    ).not.toContain(expect.stringContaining('AUDITOR'));
  });
});

describe('staleAllowlist (la lista de excepciones sólo puede encogerse)', () => {
  const informe = computePermissionDrift(entrada);

  it('una lista que coincide con la deriva no tiene excepciones obsoletas', () => {
    expect(
      staleAllowlist(informe, {
        roles: ['PLATFORM_ADMIN'],
        routes: ['GET /vacia', 'GET /whoami'],
      }),
    ).toEqual([]);
  });

  it('un rol que ya se sembró y una ruta que ya declara @Roles se señalan', () => {
    expect(
      staleAllowlist(informe, {
        roles: ['PLATFORM_ADMIN', 'DPO'],
        routes: ['GET /vacia', 'GET /a', 'GET /health'],
      }),
    ).toEqual([
      'excepción obsoleta, el rol ya no está sin sembrar: DPO',
      'excepción obsoleta, la ruta ya declara @Roles o @Public: GET /a',
      'excepción obsoleta, la ruta ya declara @Roles o @Public: GET /health',
    ]);
  });

  it('sin lista no hay nada obsoleto', () => {
    expect(staleAllowlist(informe)).toEqual([]);
  });
});
