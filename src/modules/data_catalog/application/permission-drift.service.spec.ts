import { jest } from '@jest/globals';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CONCEPTS } from '../../../common/constants/concepts';
import { SYSTEM_ROLE_SEED } from '../../../common/seed/authz-clinical-roles-seed.service';
import type {
  RouteMetadataService,
  RouteSecurity,
} from '../../../observability/route-index/route-metadata.service';
import { DATA_CATALOG_ROLE_CODES } from '../data_catalog.roles';
import {
  IamPlatformRoleCodesAdapter,
  PLATFORM_ROLE_CODES,
} from '../infrastructure/adapters/iam-platform-role-codes.adapter';
import {
  DRIFT_ROUTES_LIST_CAP,
  PermissionDriftService,
} from './permission-drift.service';

// Fábrica de mocks con tipos sueltos: el contrato que se prueba es el del servicio, no el de jest.
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ruta = (
  method: string,
  template: string,
  roles: string[] | null,
  isPublic = false,
): RouteSecurity => ({
  method,
  template,
  controller: 'C',
  handler: 'h',
  roles,
  isPublic,
  auditedAction: null,
  notAudited: false,
});

function armar(rutas: RouteSecurity[], rolesEnBase: string[] = []) {
  const execute = mockFn(async () => rolesEnBase.map((code) => ({ code })));
  const em: Record<string, any> = {
    fork: () => em,
    getConnection: () => ({ execute }),
  };
  const routes = { all: () => rutas };
  const service = new PermissionDriftService(
    em as never,
    routes as unknown as RouteMetadataService,
    new IamPlatformRoleCodesAdapter(),
  );
  return { service, execute };
}

describe('PermissionDriftService', () => {
  it('compara los roles que exigen las rutas con los que la API siembra y con los de la base', async () => {
    const { service, execute } = armar(
      [
        ruta('GET', '/a', ['DPO']),
        ruta('GET', '/b', ['ROL_CREADO_A_MANO']),
        ruta('GET', '/c', ['ROL_NUNCA_CREADO']),
        ruta('POST', '/w', ['SYSTEM']),
        ruta('GET', '/seeded', ['QA_ADMIN', 'IDENTITY_ADMIN']),
        ruta('GET', '/pharmacy', ['PHARMACY_STAFF']),
      ],
      ['ROL_CREADO_A_MANO'],
    );
    const r = await service.report(new Date('2026-10-24T12:00:00.000Z'));
    expect(r.generatedAt).toBe('2026-10-24T12:00:00.000Z');
    expect(r.usedNotSeeded.map((u) => [u.role, u.inDatabase])).toEqual([
      ['ROL_CREADO_A_MANO', true],
      ['ROL_NUNCA_CREADO', false],
    ]);
    // DPO, QA_ADMIN e IDENTITY_ADMIN ya los siembra la API; SYSTEM es la cuenta de servicio y
    // PHARMACY_STAFF lo deriva el login de la membresía (no se siembra)
    for (const sembrado of [
      'DPO',
      'SYSTEM',
      'QA_ADMIN',
      'IDENTITY_ADMIN',
      'PHARMACY_STAFF',
    ])
      expect(r.usedNotSeeded.map((u) => u.role)).not.toContain(sembrado);
    expect(execute.mock.calls[0][1]).toEqual([CONCEPTS.STATE_ACTIVE]);
  });

  it('un rol sembrado que ninguna ruta exige se informa como sin uso', async () => {
    const { service } = armar([ruta('GET', '/a', ['DPO'])]);
    const r = await service.report();
    expect(r.seededNotUsed).toContain('AUDITOR');
    expect(r.seededNotUsed).not.toContain('DPO');
  });

  it('recorta la lista de rutas sin @Roles pero informa el total', async () => {
    const muchas = Array.from({ length: DRIFT_ROUTES_LIST_CAP + 5 }, (_, i) =>
      ruta('GET', `/s/${String(i).padStart(4, '0')}`, null),
    );
    const { service } = armar(muchas);
    const r = await service.report();
    expect(r.routes.withoutRoles).toBe(DRIFT_ROUTES_LIST_CAP + 5);
    expect(r.routesWithoutRoles).toHaveLength(DRIFT_ROUTES_LIST_CAP);
    expect(r.routesWithoutRolesTruncated).toBe(true);
  });

  it('los roles de plataforma son los globales de iam más SYSTEM', () => {
    expect(PLATFORM_ROLE_CODES).toEqual(
      expect.arrayContaining(['SECURITY_ADMIN', 'SUPERADMIN', 'SYSTEM']),
    );
  });
});

describe('roles sembrados', () => {
  it('SYSTEM_ROLE_SEED incluye los cinco roles del centro de datos', () => {
    const codigos = SYSTEM_ROLE_SEED.map((r) => r.code);
    for (const rol of DATA_CATALOG_ROLE_CODES) expect(codigos).toContain(rol);
  });

  it('no hay códigos repetidos en la siembra', () => {
    const codigos = SYSTEM_ROLE_SEED.map((r) => r.code);
    expect(new Set(codigos).size).toBe(codigos.length);
  });

  it('todo *_ROLE_SEED que declara un archivo *.roles.ts está en SYSTEM_ROLE_SEED', async () => {
    const raiz = join(process.cwd(), 'src');
    const archivos: string[] = [];
    const recorrer = (dir: string): void => {
      for (const nombre of readdirSync(dir)) {
        const ruta = join(dir, nombre);
        if (statSync(ruta).isDirectory()) recorrer(ruta);
        else if (/\.roles\.ts$/.test(nombre)) archivos.push(ruta);
      }
    };
    recorrer(raiz);
    expect(archivos.length).toBeGreaterThanOrEqual(3);
    const sembrados = new Set(SYSTEM_ROLE_SEED.map((r) => r.code));
    const faltan: string[] = [];
    for (const archivo of archivos) {
      const modulo = (await import(archivo)) as Record<string, unknown>;
      for (const [nombre, valor] of Object.entries(modulo))
        if (/_ROLE_SEED$/.test(nombre) && Array.isArray(valor))
          for (const rol of valor as { code: string }[])
            if (!sembrados.has(rol.code)) faltan.push(`${nombre}:${rol.code}`);
    }
    expect(faltan).toEqual([]);
  });
});
