import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeSitesService } from './practice-sites.service';
import { PRAC } from '../practice.concepts';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PracticeErrorReason } from '../practice.error-reasons';
import {
  buildPracticeAccess,
  type AssignmentRow,
} from '../../../../test/doubles/practice-access.double';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;
const TENANT_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const TENANT_B = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Devuelve el servicio de modo que cada llamada corra con `tenantId` como
 * tenant activo, igual que lo deja el `TenantContextInterceptor`.
 *
 * @param service - Servicio bajo prueba.
 * @param tenantId - Tenant del contexto de la petición.
 * @returns Un proxy que ejecuta cada método dentro de `runWithTenant`.
 */
function inTenant<T extends object>(service: T, tenantId: string): T {
  return new Proxy(service, {
    get(target, property, receiver) {
      const value = Reflect.get(target, property, receiver);
      if (typeof value !== 'function') return value;
      return (...args: unknown[]) =>
        runWithTenant(tenantId, () => value.apply(target, args));
    },
  });
}

/**
 * Mock de `PracticesRepository.findById`. Las prácticas de prueba son del tenant
 * activo (`TENANT_A`) salvo que la propia práctica declare otro `tenantId`; sin
 * configurar, resuelve una práctica del tenant activo (la dueña de los hijos).
 *
 * @returns Un `jest.fn` cuyo `mockResolvedValue` sella el tenant de la práctica.
 */
function practiceLookupMock(): any {
  const lookup = mockFn();
  const resolve = lookup.mockResolvedValue.bind(lookup);
  const stamp = (row: any) =>
    row && typeof row === 'object' && row.tenantId === undefined
      ? Object.assign(row, { tenantId: TENANT_A })
      : row;
  lookup.mockResolvedValue = (row: any) => resolve(stamp(row));
  resolve(stamp({ id: 'p1' }));
  return lookup;
}

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build(assignments: AssignmentRow[] = []) {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const practicesRepo = {
    findByTenant: mockFn().mockResolvedValue([]),
    findActive: mockFn(),
    findById: practiceLookupMock(),
    findOwnOffice: mockFn().mockResolvedValue(null),
    findByTenantAndCode: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const sitesRepo = {
    findById: mockFn(),
    findByPractice: mockFn().mockResolvedValue([]),
    findByPracticeAndCode: mockFn(),
    create: mockFn(),
  };
  const unitsRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const spacesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const servicesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const rolesRepo = { findBySite: mockFn().mockResolvedValue([]) };
  const serviceCatalogRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  // Por omisión nadie administra la organización: lo que ya pasaba por rol sigue pasando por rol.
  const tenantAdministration = {
    administersByMembership: mockFn().mockResolvedValue(false),
  };

  const service = new PracticeSitesService(
    em as any,
    practicesRepo,
    sitesRepo,
    unitsRepo as any,
    spacesRepo as any,
    servicesRepo as any,
    rolesRepo as any,
    serviceCatalogRepo as any,
    logger as any,
    buildPracticeAccess(assignments),
    tenantAdministration as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    practicesRepo,
    sitesRepo,
    serviceCatalogRepo,
    unitsRepo,
    spacesRepo,
    servicesRepo,
    rolesRepo,
    tenantAdministration,
  };
}

describe('PracticeSitesService', () => {
  describe('createPractice (bootstrap)', () => {
    it('creates and flushes the practice', async () => {
      const d = build();
      const created = {
        id: 'p1',
        code: 'P-1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        createdAt: new Date(),
      };
      d.practicesRepo.create.mockReturnValue(created);

      const res = await d.service.createPractice(
        { tenantId: 't1', code: 'P-1', name: 'Acme' },
        actor,
      );

      expect(res).toEqual({
        id: 'p1',
        code: 'P-1',
        status: PRAC.PRACTICE_ACTIVE,
        createdAt: created.createdAt,
      });
      expect(d.tx.flush).toHaveBeenCalled();
    });

    /**
     * FT-22-R01. Una práctica que nace con el catálogo vacío le abre a quien
     * atiende una pantalla sin nada, y la consulta es lo único que ofrecen
     * todas. Va en la misma transacción que el alta a propósito.
     */
    it('la práctica nace ofreciendo una cita médica en 0.00 Bs', async () => {
      const d = build();
      d.practicesRepo.create.mockReturnValue({
        id: 'p1',
        code: 'P-1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
        createdAt: new Date(),
      });

      await d.service.createPractice(
        { tenantId: 't1', code: 'P-1', name: 'Acme' },
        actor,
      );

      expect(d.serviceCatalogRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          practiceId: 'p1',
          code: 'CITA_MEDICA',
          name: 'Cita médica',
          defaultPrice: '0.00',
          currencyConceptId: CONCEPTS.CURRENCY_BOB,
          isActive: true,
          actorUserId: actor.id,
        }),
      );
    });
  });

  describe('createSite (UC-14-01)', () => {
    it('rejects when the practice does not exist', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the practice is not active', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated site code', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue({ id: 'dup' });
      await expect(
        d.service.createSite('p1', { code: 'S-1', name: 'Site' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a site with PLANNED operational status', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findByPracticeAndCode.mockResolvedValue(null);
      const created = {
        id: 's1',
        practiceId: 'p1',
        code: 'S-1',
        statusConceptId: PRAC.SITE_ACTIVE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        createdAt: new Date(),
      };
      d.sitesRepo.create.mockReturnValue(created);

      const res = await d.service.createSite(
        'p1',
        { code: 'S-1', name: 'Site' },
        actor,
      );

      expect(res.operationalStatus).toBe(PRAC.SITE_OP_PLANNED);
      expect(d.sitesRepo.create).toHaveBeenCalled();
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('decommissionSite (UC-14-12)', () => {
    it('throws when the site is not in the practice', async () => {
      const d = build();
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'other' });
      await expect(
        d.service.decommissionSite('p1', 's1', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('soft-deletes the site and cascades to children', async () => {
      const d = build();
      const site = {
        id: 's1',
        practiceId: 'p1',
        statusConceptId: PRAC.SITE_ACTIVE,
        operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
        updatedAt: new Date(),
      };
      d.sitesRepo.findById.mockResolvedValue(site);
      const unit = { statusConceptId: PRAC.UNIT_ACTIVE, updatedAt: new Date() };
      const space = {
        statusConceptId: PRAC.SPACE_ACTIVE,
        operationalStatusConceptId: PRAC.SPACE_OP_AVAILABLE,
        updatedAt: new Date(),
      };
      const svc = {
        statusConceptId: PRAC.SERVICE_ACTIVE,
        updatedAt: new Date(),
      };
      const role = {
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        validTo: undefined,
        updatedAt: new Date(),
      };
      d.unitsRepo.findBySite.mockResolvedValue([unit]);
      d.spacesRepo.findBySite.mockResolvedValue([space]);
      d.servicesRepo.findBySite.mockResolvedValue([svc]);
      d.rolesRepo.findBySite.mockResolvedValue([role]);

      const res = await d.service.decommissionSite('p1', 's1', actor);

      expect(res).toEqual({ ok: true });
      expect(site.statusConceptId).toBe(PRAC.SITE_RETIRED);
      expect(site.operationalStatusConceptId).toBe(PRAC.SITE_OP_CLOSED);
      expect(unit.statusConceptId).toBe(PRAC.UNIT_RETIRED);
      expect(space.statusConceptId).toBe(PRAC.SPACE_RETIRED);
      expect(svc.statusConceptId).toBe(PRAC.SERVICE_SUSPENDED);
      expect(role.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_ENDED);
      expect(role.validTo).toBeInstanceOf(Date);
    });
  });
});

describe('PracticeSitesService.listPractices — acceso por vinculación', () => {
  const OWN = { id: 'prac-own', code: 'MIO', name: 'Mi consultorio' };
  const OTHER = { id: 'prac-other', code: 'AJENO', name: 'Consultorio ajeno' };
  const PENDING = { id: 'prac-pending', code: 'PEND', name: 'Pendiente' };
  const rows: AssignmentRow[] = [
    {
      practitionerProfileId: 'hp-doc',
      practiceId: OWN.id,
      statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      validTo: null,
    },
    {
      practitionerProfileId: 'hp-doc',
      practiceId: PENDING.id,
      statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
      validTo: null,
    },
  ];
  const doctor = {
    id: 'user-doc',
    roles: ['PRACTITIONER'],
    practitionerProfileId: 'hp-doc',
  } as any;

  /**
   * Servicio con las tres prácticas activas en el tenant compartido.
   * @returns El servicio y sus dobles.
   */
  function withPractices() {
    const d = build(rows);
    d.practicesRepo.findByTenant.mockResolvedValue(
      [OWN, OTHER, PENDING].map((p) => ({
        ...p,
        tenantId: 'DEFAULT',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      })),
    );
    return d;
  }

  it('el médico con vinculación ACTIVE ve sólo esa práctica', async () => {
    const d = withPractices();

    const list = await d.service.listPractices('DEFAULT', doctor);

    expect(list.map((p) => p.id)).toEqual([OWN.id]);
    expect(list[0]).toEqual({
      id: OWN.id,
      code: OWN.code,
      name: OWN.name,
      status: PRAC.PRACTICE_ACTIVE,
    });
  });

  it('el médico con vinculación pendiente o sin vinculación no ve ninguna', async () => {
    const d = withPractices();
    const newcomer = { ...doctor, practitionerProfileId: 'hp-new' };

    expect(
      (await d.service.listPractices('DEFAULT', doctor)).map((p) => p.id),
    ).not.toContain(PENDING.id);
    await expect(d.service.listPractices('DEFAULT', newcomer)).resolves.toEqual(
      [],
    );
  });

  it('el administrador ve todas las prácticas del tenant', async () => {
    const d = withPractices();

    const list = await d.service.listPractices('DEFAULT', actor);

    expect(list.map((p) => p.id)).toEqual([OWN.id, OTHER.id, PENDING.id]);
  });
});

/** Aserciones del 404 uniforme de PRAC-01. */
async function expectOutOfScope(promise: Promise<unknown>, message: string) {
  const error = await promise.then(
    () => null,
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ResourceNotFoundException);
  const exception = error as ResourceNotFoundException;
  expect(exception.getStatus()).toBe(404);
  expect(exception.message).toBe(message);
  expect(exception.reason).toBe(
    PracticeErrorReason.PRACTICE_RESOURCE_OUT_OF_SCOPE,
  );
  expect(exception.details).toBeUndefined();
  return exception;
}

describe('PracticeSitesService · alcance de tenant (PRAC-01)', () => {
  const foreignPractice = (): any => ({
    id: 'p1',
    tenantId: TENANT_B,
    statusConceptId: PRAC.PRACTICE_ACTIVE,
  });
  const ownPractice = (): any => ({
    id: 'p1',
    tenantId: TENANT_A,
    statusConceptId: PRAC.PRACTICE_ACTIVE,
  });

  it('createPractice persiste el tenant del contexto e ignora el del cuerpo', async () => {
    const d = build();
    d.practicesRepo.create.mockReturnValue({
      id: 'p-new',
      code: 'C',
      statusConceptId: PRAC.PRACTICE_ACTIVE,
      createdAt: new Date(),
    });

    await d.service.createPractice(
      { tenantId: TENANT_B, code: 'C', name: 'N' } as any,
      actor,
    );

    expect(d.practicesRepo.create.mock.calls[0][1].tenantId).toBe(TENANT_A);
  });

  it('createPractice sin tenant en el contexto se rechaza y no persiste', async () => {
    const d = build();

    await expect(
      d.raw.createPractice({ code: 'C', name: 'N' } as any, actor),
    ).rejects.toThrow();
    expect(d.practicesRepo.create).not.toHaveBeenCalled();
  });

  it('crear una sede en la práctica propia: se persiste sólo en la práctica de A', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue(ownPractice());
    d.sitesRepo.findByPracticeAndCode.mockResolvedValue(null);
    d.sitesRepo.create.mockReturnValue({
      id: 's1',
      practiceId: 'p1',
      code: 'S',
      statusConceptId: PRAC.SITE_ACTIVE,
      operationalStatusConceptId: PRAC.SITE_OP_PLANNED,
      createdAt: new Date(),
    });

    const res = await d.service.createSite(
      'p1',
      { code: 'S', name: 'Sede' } as any,
      actor,
    );

    expect(res.practiceId).toBe('p1');
    expect(d.sitesRepo.create).toHaveBeenCalledTimes(1);
  });

  it('crear una sede en la práctica de otro tenant: 404 uniforme, igual que inexistente; no persiste', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue(foreignPractice());
    const foreign = await expectOutOfScope(
      d.service.createSite('p1', { code: 'S', name: 'Sede' } as any, actor),
      'Práctica no encontrada',
    );
    d.practicesRepo.findById.mockResolvedValue(null);
    const missing = await expectOutOfScope(
      d.service.createSite('p1', { code: 'S', name: 'Sede' } as any, actor),
      'Práctica no encontrada',
    );

    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.sitesRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('sin tenant en el contexto no se crea la sede', async () => {
    const d = build();

    await expect(
      d.raw.createSite('p1', { code: 'S', name: 'Sede' } as any, actor),
    ).rejects.toThrow();
    expect(d.practicesRepo.findById).not.toHaveBeenCalled();
  });

  it('dar de baja una sede de otro tenant: 404 uniforme; la sede y sus hijos de B no cambian', async () => {
    const d = build();
    const site: any = {
      id: 's1',
      practiceId: 'p1',
      statusConceptId: PRAC.SITE_ACTIVE,
    };
    d.practicesRepo.findById.mockResolvedValue(foreignPractice());
    d.sitesRepo.findById.mockResolvedValue(site);

    await expectOutOfScope(
      d.service.decommissionSite('p1', 's1', actor),
      'Práctica no encontrada',
    );

    expect(site.statusConceptId).toBe(PRAC.SITE_ACTIVE);
    expect(d.unitsRepo.findBySite).not.toHaveBeenCalled();
    expect(d.rolesRepo.findBySite).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });
});

describe('PracticeSitesService · lectura de prácticas y sedes por quien administra la organización (A-6)', () => {
  const PRACTICE = { id: 'prac-1', code: 'CMN', name: 'Centro Médico Norte' };
  const OTHER = { id: 'prac-2', code: 'CMS', name: 'Centro Médico Sur' };
  /** El dueño de un centro: rol global `USER` y membresía `OWNER` en su tenant, ningún rol clínico ni de programación. */
  const owner = { id: 'user-owner', roles: ['USER'] } as any;
  const stranger = { id: 'user-x', roles: ['USER'] } as any;

  /** Servicio con dos prácticas activas en el tenant A y la decisión de administración que se le indique. */
  function withAdministration(administers: boolean) {
    const d = build([]);
    d.tenantAdministration.administersByMembership.mockResolvedValue(
      administers,
    );
    d.practicesRepo.findByTenant.mockResolvedValue(
      [PRACTICE, OTHER].map((p) => ({
        ...p,
        tenantId: TENANT_A,
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      })),
    );
    d.practicesRepo.findById.mockResolvedValue({
      ...PRACTICE,
      tenantId: TENANT_A,
    });
    d.sitesRepo.findByPractice.mockResolvedValue([
      {
        id: 'site-1',
        practiceId: PRACTICE.id,
        code: 'N1',
        name: 'Sede Norte 1',
        statusConceptId: PRAC.SITE_ACTIVE ?? 'st',
      },
    ]);
    return d;
  }

  /** Lo que el cliente ve: 403 con el `reason` de siempre, el mismo que daba el `RolesGuard`. */
  async function expectRoleInsufficient(promise: Promise<unknown>) {
    const error: any = await promise.then(
      () => null,
      (e: unknown) => e,
    );
    expect(error?.getStatus?.()).toBe(403);
    expect(error.getResponse()).toMatchObject({ reason: 'ROLE_INSUFFICIENT' });
  }

  it('el dueño de la organización lista todas las prácticas de su tenant, sin filtro por vinculación', async () => {
    const d = withAdministration(true);

    const list = await d.raw.listPractices(TENANT_A, owner);

    expect(list.map((p) => p.id)).toEqual([PRACTICE.id, OTHER.id]);
    // La administración se pregunta por el tenant del contexto, nunca por otro.
    expect(
      d.tenantAdministration.administersByMembership.mock.calls[0][1],
    ).toBe(TENANT_A);
  });

  it('quien no administra y no tiene un rol de la lista recibe 403 ROLE_INSUFFICIENT al listar prácticas', async () => {
    const d = withAdministration(false);

    await expectRoleInsufficient(d.raw.listPractices(TENANT_A, stranger));
    expect(d.practicesRepo.findByTenant).not.toHaveBeenCalled();
  });

  it('un médico sigue viendo sólo las prácticas donde tiene vinculación ACTIVE', async () => {
    const d = withAdministration(false);
    const doctor = {
      id: 'u-doc',
      roles: ['PRACTITIONER'],
      practitionerProfileId: 'hp-doc',
    } as any;

    const list = await d.raw.listPractices(TENANT_A, doctor);

    expect(list).toEqual([]);
  });

  it('un rol de plataforma acotado a otro tenant no autoriza: sólo cuenta en el tenant donde fue asignado', async () => {
    const d = withAdministration(false);
    // `SECURITY_ADMIN` sólo en el tenant B (`scopedRoles`); la petición llega con el tenant A.
    const scopedElsewhere = {
      id: 'u-scoped',
      roles: ['SECURITY_ADMIN'],
      scopedRoles: { [TENANT_B]: ['SECURITY_ADMIN'] },
    } as any;

    await expectRoleInsufficient(
      d.raw.listPractices(TENANT_A, scopedElsewhere),
    );
    await expectRoleInsufficient(
      d.raw.listSites(PRACTICE.id, TENANT_A, scopedElsewhere),
    );
    expect(d.practicesRepo.findByTenant).not.toHaveBeenCalled();
    expect(d.sitesRepo.findByPractice).not.toHaveBeenCalled();
  });

  it('el mismo rol sí autoriza en el tenant donde fue asignado', async () => {
    const d = withAdministration(false);
    const scopedHere = {
      id: 'u-scoped',
      roles: ['SECURITY_ADMIN'],
      scopedRoles: { [TENANT_A]: ['SECURITY_ADMIN'] },
    } as any;

    const list = await d.raw.listPractices(TENANT_A, scopedHere);

    expect(list.map((p) => p.id)).toEqual([PRACTICE.id, OTHER.id]);
  });

  it('el dueño lista las sedes de una práctica de su organización', async () => {
    const d = withAdministration(true);

    const sites = await d.raw.listSites(PRACTICE.id, TENANT_A, owner);

    expect(sites.map((s) => s.id)).toEqual(['site-1']);
  });

  it('quien tiene un rol de programación sigue listando sedes sin ser dueño', async () => {
    const d = withAdministration(false);
    const scheduler = { id: 'u-sch', roles: ['SURGERY_SCHEDULER'] } as any;

    const sites = await d.raw.listSites(PRACTICE.id, TENANT_A, scheduler);

    expect(sites).toHaveLength(1);
  });

  it('quien no administra y no tiene rol recibe 403 al listar sedes, y no se lee nada', async () => {
    const d = withAdministration(false);

    await expectRoleInsufficient(
      d.raw.listSites(PRACTICE.id, TENANT_A, stranger),
    );
    expect(d.sitesRepo.findByPractice).not.toHaveBeenCalled();
  });

  it('el dueño de otra organización no ve las sedes de una práctica ajena: 404 uniforme', async () => {
    const d = withAdministration(true);
    d.practicesRepo.findById.mockResolvedValue({
      ...PRACTICE,
      tenantId: TENANT_B,
    });

    await expect(
      d.raw.listSites(PRACTICE.id, TENANT_A, owner),
    ).rejects.toBeInstanceOf(ResourceNotFoundException);
    expect(d.sitesRepo.findByPractice).not.toHaveBeenCalled();
  });
});
