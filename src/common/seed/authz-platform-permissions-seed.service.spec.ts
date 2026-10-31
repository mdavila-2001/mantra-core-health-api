import { jest } from '@jest/globals';
import { AUD } from '../../modules/audit/audit.concepts';
import { AUTHZ } from '../../modules/authz/authz.concepts';
import {
  PERMISSION_CATEGORY_SEED,
  PLATFORM_PERMISSION_SEED,
  SUPPORT_STAFF_FIELD_FLOOR,
  clinicalRoleId,
} from '../../modules/authz/authz.seed';
import { AuthzPlatformPermissionsSeedService } from './authz-platform-permissions-seed.service';

/**
 * Siembra de los 73 permisos atómicos, sus 7 categorías y el piso de campos de
 * `SUPPORT_STAFF`. Mismo patrón que los demás seeds: un `em` en memoria que
 * responde `find`/`findOne`/`create`/`flush` sin tocar una base real.
 */

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

interface Fila {
  [k: string]: any;
}

/**
 * Construye el servicio con un contexto de persistencia en memoria.
 *
 * @param existentes - Filas ya presentes por entidad (`Permissions`, `PermissionCategories`, `FieldPermissions`, `Roles`).
 */
function build(existentes: Record<string, Fila[]> = {}) {
  const tablas: Record<string, Fila[]> = {
    Permissions: [],
    PermissionCategories: [],
    FieldPermissions: [],
    Roles: [{ id: clinicalRoleId('SUPPORT_STAFF'), code: 'SUPPORT_STAFF' }],
    RoleTemplates: [],
    ...existentes,
  };
  const creadas: { entity: string; data: Fila }[] = [];
  const coincide = (fila: Fila, where: Fila): boolean =>
    Object.entries(where).every(([k, v]) => {
      if (v && typeof v === 'object' && '$in' in v)
        return (v.$in as unknown[]).includes(fila[k]);
      return fila[k] === v;
    });
  const em = {
    find: mockFn((entity: any, where: Fila = {}) =>
      Promise.resolve(
        (tablas[entity.name] ?? []).filter((f) => coincide(f, where)),
      ),
    ),
    findOne: mockFn((entity: any, where: Fila) =>
      Promise.resolve(
        (tablas[entity.name] ?? []).find((f) => coincide(f, where)) ?? null,
      ),
    ),
    create: mockFn((entity: any, data: Fila) => {
      creadas.push({ entity: entity.name, data });
      (tablas[entity.name] ??= []).push(data);
      return data;
    }),
    flush: mockFn(() => Promise.resolve()),
  };
  const orm = { em: { fork: mockFn(() => em) } };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new AuthzPlatformPermissionsSeedService(
    orm as never,
    logger as never,
  );
  return { service, em, creadas, tablas, logger };
}

const de = (
  creadas: { entity: string; data: Fila }[],
  entity: string,
): Fila[] => creadas.filter((c) => c.entity === entity).map((c) => c.data);

describe('AuthzPlatformPermissionsSeedService: catálogo de apoyo', () => {
  it('en una base vacía siembra 7 categorías, los permisos del catálogo y el piso de campos', async () => {
    const { service, creadas } = build();

    const r = await service.run();

    expect(de(creadas, 'PermissionCategories')).toHaveLength(7);
    expect(de(creadas, 'Permissions')).toHaveLength(
      PLATFORM_PERMISSION_SEED.length,
    );
    expect(de(creadas, 'FieldPermissions')).toHaveLength(
      SUPPORT_STAFF_FIELD_FLOOR.length,
    );
    expect(r.inserted).toBeGreaterThanOrEqual(
      7 + PLATFORM_PERMISSION_SEED.length + SUPPORT_STAFF_FIELD_FLOOR.length,
    );
  });

  it('confirma las categorías ANTES de crear los permisos: category_id es FK sin relación en el ORM y el orden del commit no está garantizado (hallazgo del humo real)', async () => {
    const { service, em } = build();
    const eventos: string[] = [];
    const create = em.create;
    em.create = mockFn((entity: any, data: Fila) => {
      eventos.push(`create:${entity.name}`);
      return create(entity, data);
    });
    em.flush = mockFn(() => {
      eventos.push('flush');
      return Promise.resolve();
    });
    await service.run();
    const primerFlush = eventos.indexOf('flush');
    const ultimaCategoria = eventos.lastIndexOf('create:PermissionCategories');
    const primerPermiso = eventos.indexOf('create:Permissions');
    expect(primerFlush).toBeGreaterThan(ultimaCategoria);
    expect(primerFlush).toBeLessThan(primerPermiso);
  });

  it('cada átomo se inserta con su categoría, ámbito de organización y metadatos de gobierno', async () => {
    const { service, creadas } = build();
    await service.run();
    const permisos = de(creadas, 'Permissions');
    const verificado = permisos.find(
      (p) => p.code === 'patients.profile.edit_verified',
    )!;
    expect(verificado).toMatchObject({
      sensitivityConceptId: AUTHZ.SENSITIVITY_CRITICAL,
      requiresReason: true,
      requiresStepUp: true,
      approvalModeConceptId: AUTHZ.APPROVAL_SECOND_APPROVER,
      purposeOfUseConceptId: AUTHZ.PURPOSE_TREATMENT,
      legalBasisConceptId: AUD.LEGAL_BASIS_LEGAL_OBLIGATION,
      touchesClinicalData: false,
      supportAssignable: true,
      isDangerous: true,
      isFieldLevel: false,
      defaultScopeConceptId: AUTHZ.SCOPE_TENANT,
      allowDirectUserGrant: false,
      isRoleRestricted: false,
    });
    const categoria = PERMISSION_CATEGORY_SEED.find(
      (c) => c.code === 'SUPPORT_PATIENTS',
    )!;
    expect(verificado.categoryId).toBe(categoria.id);

    const campo = permisos.find(
      (p) => p.code === 'agenda.appointment.view.reason',
    )!;
    expect(campo).toMatchObject({
      isFieldLevel: true,
      touchesClinicalData: true,
      sensitivityConceptId: AUTHZ.SENSITIVITY_HIGH,
      approvalModeConceptId: undefined,
    });

    const noAsignable = permisos.find((p) => p.code === 'team.sod.manage')!;
    expect(noAsignable.supportAssignable).toBe(false);
    expect(noAsignable.legalBasisConceptId).toBe(
      AUD.LEGAL_BASIS_HEALTHCARE_OPERATIONS,
    );
  });

  it('el rol de sistema SUPPORT_STAFF no recibe permisos: solo piso de lectura denegada', async () => {
    const { service, creadas } = build();
    await service.run();
    const piso = de(creadas, 'FieldPermissions');
    expect(piso.map((f) => f.id).sort()).toEqual(
      SUPPORT_STAFF_FIELD_FLOOR.map((f) => f.id).sort(),
    );
    for (const fila of piso) {
      expect(fila.roleId).toBe(clinicalRoleId('SUPPORT_STAFF'));
      expect(fila.canRead).toBe(false);
      expect(fila.canWrite).toBe(false);
    }
    expect(de(creadas, 'RolePermissions')).toHaveLength(0);
  });

  it('es idempotente: la segunda pasada no inserta ni actualiza nada', async () => {
    const { service, creadas } = build();
    await service.run();
    const antes = creadas.length;

    const r = await service.run();

    expect(r.inserted).toBe(0);
    expect(r.updated).toBe(0);
    expect(creadas.length).toBe(antes);
  });

  it('un código antiguo ya sembrado se completa (asignable a apoyo + sensibilidad) sin ganar obligaciones', async () => {
    const vista = PLATFORM_PERMISSION_SEED.find(
      (p) => p.code === 'schedule.edit_hours',
    )!;
    const { service, tablas } = build({
      Permissions: [
        {
          id: vista.id,
          code: 'schedule.edit_hours',
          name: 'Cambiar horarios',
          supportAssignable: false,
          requiresReason: false,
          requiresStepUp: false,
          isDangerous: false,
        },
      ],
    });

    const r = await service.run();

    const fila = tablas.Permissions.find((p) => p.id === vista.id)!;
    expect(r.updated).toBeGreaterThanOrEqual(1);
    expect(fila.supportAssignable).toBe(true);
    expect(fila.sensitivityConceptId).toBe(AUTHZ.SENSITIVITY_HIGH);
    expect(fila.requiresReason).toBe(false);
    expect(fila.requiresStepUp).toBe(false);
    expect(fila.approvalModeConceptId ?? null).toBeNull();
    // Regla de no regresión: no se toca lo que el alias ya tenía.
    expect(fila.isDangerous).toBe(false);
    expect(fila.categoryId ?? null).toBeNull();
    expect(fila.name).toBe('Cambiar horarios');
  });

  it('un átomo ya sembrado con metadatos viejos se alinea con el catálogo vigente', async () => {
    const semilla = PLATFORM_PERMISSION_SEED.find(
      (p) => p.code === 'billing.receipt.void',
    )!;
    const { service, tablas } = build({
      Permissions: [
        {
          id: semilla.id,
          code: semilla.code,
          name: semilla.name,
          sensitivityConceptId: AUTHZ.SENSITIVITY_LOW,
          requiresReason: false,
          requiresStepUp: false,
          supportAssignable: false,
        },
      ],
    });

    await service.run();

    const fila = tablas.Permissions.find((p) => p.id === semilla.id)!;
    expect(fila.sensitivityConceptId).toBe(AUTHZ.SENSITIVITY_CRITICAL);
    expect(fila.requiresReason).toBe(true);
    expect(fila.requiresStepUp).toBe(true);
    expect(fila.approvalModeConceptId).toBe(AUTHZ.APPROVAL_SECOND_APPROVER);
    expect(fila.supportAssignable).toBe(true);
  });

  it('respeta un permiso que un administrador creó a mano con el mismo código y otro id', async () => {
    const { service, creadas, tablas } = build({
      Permissions: [
        { id: 'id-manual', code: 'agenda.appointment.view', name: 'Mío' },
      ],
    });

    await service.run();

    expect(
      de(creadas, 'Permissions').some(
        (p) => p.code === 'agenda.appointment.view',
      ),
    ).toBe(false);
    expect(tablas.Permissions.find((p) => p.id === 'id-manual')?.name).toBe(
      'Mío',
    );
  });

  it('sin el rol SUPPORT_STAFF materializado no inventa el piso: lo avisa y sigue', async () => {
    const { service, creadas, logger } = build({ Roles: [] });

    const r = await service.run();

    expect(de(creadas, 'FieldPermissions')).toHaveLength(0);
    expect(de(creadas, 'Permissions').length).toBeGreaterThan(70);
    expect(r.inserted).toBeGreaterThan(70);
    expect(logger.warn).toHaveBeenCalled();
  });
});
