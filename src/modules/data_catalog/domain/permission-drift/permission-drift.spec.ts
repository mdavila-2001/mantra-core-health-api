import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  blockingDrift,
  computePermissionDrift,
  invalidAllowlist,
  MIN_REASON_LENGTH,
  routeKey,
  SAMPLE_SIZE,
  staleAllowlist,
  type DriftAllowlist,
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

describe('la lista de excepciones versionada', () => {
  const lista = JSON.parse(
    readFileSync(
      join(process.cwd(), 'tools/catalog/permission-drift-allowlist.json'),
      'utf8',
    ),
  ) as DriftAllowlist;

  it('está bien formada: cada grupo revisado trae motivo, evidencia y rutas, sin repetidas', () => {
    expect(invalidAllowlist(lista)).toEqual([]);
  });

  it('la evidencia de cada grupo apunta a un archivo que existe y nombra un símbolo que contiene', () => {
    const rotas: string[] = [];
    for (const grupo of lista.reviewed ?? [])
      for (const evidencia of grupo.evidence) {
        const [archivo, simbolo] = evidencia.split('#');
        const ruta = join(process.cwd(), archivo);
        if (!existsSync(ruta)) rotas.push(`${evidencia}: no existe el archivo`);
        else if (simbolo && !readFileSync(ruta, 'utf8').includes(simbolo))
          rotas.push(`${evidencia}: el archivo no menciona el símbolo`);
      }
    expect(rotas).toEqual([]);
  });
});

describe('rutas revisadas (grupos con motivo y evidencia)', () => {
  const informe = computePermissionDrift(entrada);
  const revisado = {
    reason: 'Autoservicio: el sujeto sale de la sesión, no de un parámetro',
    evidence: ['src/x/x.service.ts#assertOwn'],
    routes: ['GET /vacia', 'GET /whoami'],
  };

  it('una ruta revisada no bloquea igual que una de la lista heredada', () => {
    expect(
      blockingDrift(informe, {
        roles: ['PLATFORM_ADMIN'],
        reviewed: [revisado],
      }),
    ).toEqual([]);
  });

  it('una revisada que ya declara @Roles se señala como obsoleta', () => {
    expect(
      staleAllowlist(informe, {
        roles: ['PLATFORM_ADMIN'],
        reviewed: [{ ...revisado, routes: ['GET /vacia', 'GET /a'] }],
      }),
    ).toEqual([
      'excepción obsoleta, la ruta ya declara @Roles o @Public: GET /a',
    ]);
  });

  it('una lista bien formada no tiene defectos', () => {
    expect(invalidAllowlist({ reviewed: [revisado] })).toEqual([]);
    expect(invalidAllowlist()).toEqual([]);
  });

  it('un grupo sin motivo, sin evidencia o sin rutas es un defecto', () => {
    const problemas = invalidAllowlist({
      reviewed: [
        { reason: 'ok', evidence: ['a.ts'], routes: ['GET /a'] },
        { reason: revisado.reason, evidence: [], routes: ['GET /b'] },
        { reason: revisado.reason, evidence: ['a.ts'], routes: [] },
      ],
    });
    expect(problemas).toEqual([
      `grupo revisado #1 sin motivo (mínimo ${MIN_REASON_LENGTH} caracteres)`,
      `grupo revisado #2 sin evidencia: ${revisado.reason.slice(0, 40)}`,
      'grupo revisado #3 sin rutas',
    ]);
  });

  it('una ruta a la vez revisada y sin revisar, o repetida, es un defecto', () => {
    expect(
      invalidAllowlist({
        routes: ['GET /whoami'],
        reviewed: [revisado, { ...revisado, routes: ['GET /vacia'] }],
      }),
    ).toEqual([
      'ruta repetida en la lista: GET /whoami',
      'ruta repetida en la lista: GET /vacia',
    ]);
  });
});
