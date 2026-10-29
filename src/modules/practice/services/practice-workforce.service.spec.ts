import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PracticeWorkforceService } from './practice-workforce.service';
import { PRAC } from '../practice.concepts';
import { ForbiddenException } from '@nestjs/common';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  runWithTenant,
} from '../../../common';
import { PracticeErrorReason } from '../practice.error-reasons';

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
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const forked = { find: mockFn().mockResolvedValue([]) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    fork: mockFn(() => forked),
  };
  const practicesRepo = { findById: practiceLookupMock() };
  const sitesRepo = { findById: mockFn() };
  const unitsRepo = { findById: mockFn() };
  const servicesRepo = { findById: mockFn() };
  const rolesRepo = {
    findById: mockFn(),
    create: mockFn(),
    findByPractitioner: mockFn(),
    findByPracticePage: mockFn().mockResolvedValue([]),
    findOpenForServices: mockFn().mockResolvedValue([]),
  };
  const supportRepo = { create: mockFn() };
  const administration = {
    assertCanAdministerPractice: mockFn().mockResolvedValue({ id: 'p1' }),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeWorkforceService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    unitsRepo as any,
    servicesRepo as any,
    rolesRepo as any,
    supportRepo as any,
    administration as any,
    logger as any,
  );
  return {
    service: inTenant(service, TENANT_A),
    raw: service,
    tx,
    forked,
    practicesRepo,
    sitesRepo,
    unitsRepo,
    servicesRepo,
    rolesRepo,
    supportRepo,
    administration,
  };
}

describe('PracticeWorkforceService', () => {
  describe('assignRole (UC-14-08)', () => {
    it('rejects when the practice is not active', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: 'other',
      });
      await expect(
        d.service.assignRole(
          'p1',
          { practitionerProfileId: 'hp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('creates an active role assignment', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      const created = {
        id: 'r1',
        practiceId: 'p1',
        practitionerProfileId: 'hp1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        createdAt: new Date(),
      };
      d.rolesRepo.create.mockReturnValue(created);
      const res = await d.service.assignRole(
        'p1',
        { practitionerProfileId: 'hp1' },
        actor,
      );
      expect(res.status).toBe(PRAC.ROLE_ASSIGNMENT_ACTIVE);
    });
  });

  describe('attachSupport (UC-14-09)', () => {
    it('throws when the parent role is missing', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.attachSupport(
          'r1',
          { supportProfileId: 'sp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the parent role is not active', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ENDED,
      });
      await expect(
        d.service.attachSupport(
          'r1',
          { supportProfileId: 'sp1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('attaches support to an active role', async () => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue({
        id: 'r1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
      });
      const created = {
        id: 'sa1',
        practitionerRoleAssignmentId: 'r1',
        statusConceptId: PRAC.SUPPORT_ACTIVE,
        createdAt: new Date(),
      };
      d.supportRepo.create.mockReturnValue(created);
      const res = await d.service.attachSupport(
        'r1',
        { supportProfileId: 'sp1' },
        actor,
      );
      expect(res.status).toBe(PRAC.SUPPORT_ACTIVE);
    });
  });

  describe('listMyAssignments (Carril 18)', () => {
    const professional = { id: 'u1', practitionerProfileId: 'hp1' } as any;

    it('rejects when the actor has no practitioner profile', async () => {
      const d = build();
      await expect(
        d.service.listMyAssignments({ id: 'u1' } as any),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('attaches the organization logo from its public profile, keyed by practiceId', async () => {
      const d = build();
      d.rolesRepo.findByPractitioner.mockResolvedValue([
        {
          id: 'r1',
          practiceId: 'p1',
          roleConceptId: 'role-attending',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
          isPrimary: true,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        name: 'Hospital Central',
        typeConceptId: 'org-hospital',
      });
      d.forked.find.mockResolvedValue([
        { targetId: 'p1', avatarFileId: 'file-1' },
      ]);

      const [row] = await d.service.listMyAssignments(professional);

      expect(row.avatarUrl).toBe('/public/media/file-1');
    });

    it('cada fila trae los campos de RoleAssignmentRow además de los que ya traía', async () => {
      const d = build();
      d.rolesRepo.findByPractitioner.mockResolvedValue([
        {
          id: 'r1',
          practiceId: 'p1',
          practiceSiteId: 's1',
          practitionerProfileId: 'hp1',
          healthcareServiceId: undefined,
          roleConceptId: 'role-attending',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_INVITED,
          isPrimary: false,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      d.practicesRepo.findById.mockResolvedValue({ id: 'p1', name: 'Centro' });
      d.forked.find.mockResolvedValue([]);

      const [row] = await d.service.listMyAssignments(professional);

      expect(row).toMatchObject({
        practiceSiteId: 's1',
        healthcareServiceId: null,
        serviceConceptId: null,
        serviceDisplay: null,
        statusConceptId: PRAC.ROLE_ASSIGNMENT_INVITED,
        statusCode: 'ROLE_ASG_INVITED',
        initiatedBy: 'PRACTICE',
        status: PRAC.ROLE_ASSIGNMENT_INVITED,
        practiceName: 'Centro',
      });
    });

    it('has no logo when the organization never published a public profile', async () => {
      const d = build();
      d.rolesRepo.findByPractitioner.mockResolvedValue([
        {
          id: 'r1',
          practiceId: 'p1',
          roleConceptId: 'role-attending',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
          isPrimary: false,
          createdAt: new Date('2026-01-01'),
        },
      ]);
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        name: 'Hospital Central',
        typeConceptId: 'org-hospital',
      });
      d.forked.find.mockResolvedValue([]);

      const [row] = await d.service.listMyAssignments(professional);

      expect(row.avatarUrl).toBeNull();
    });
  });

  describe('listPracticeAssignments (CV-14, A-6)', () => {
    it('el administrador de otra organización recibe 403 y no se consulta la lista', async () => {
      const d = build();
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ForbiddenException('otra organización'),
      );
      await expect(
        d.service.listPracticeAssignments('p1', actor, {}),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(d.rolesRepo.findByPracticePage).not.toHaveBeenCalled();
    });

    it('una práctica inexistente responde 404', async () => {
      const d = build();
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ResourceNotFoundException('Práctica no encontrada'),
      );
      await expect(
        d.service.listPracticeAssignments('p1', actor, {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.rolesRepo.findByPracticePage).not.toHaveBeenCalled();
    });

    it('lists a page scoped to the practice, with a cursor when there is more', async () => {
      const d = build();
      const row = (id: string) => ({
        id,
        practiceId: 'p1',
        practitionerProfileId: 'pp-1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        createdAt: new Date('2026-01-01'),
      });
      d.rolesRepo.findByPracticePage.mockResolvedValue([row('a'), row('b')]);

      const res = await d.service.listPracticeAssignments('p1', actor, {
        limit: 1,
      });

      expect(d.administration.assertCanAdministerPractice).toHaveBeenCalledWith(
        d.forked,
        'p1',
        actor,
      );
      expect(d.rolesRepo.findByPracticePage).toHaveBeenCalledWith(
        d.forked,
        'p1',
        undefined,
        undefined,
        2,
      );
      expect(res.items).toHaveLength(1);
      expect(res.nextCursor).not.toBeNull();
    });

    it('cada fila trae los campos de RoleAssignmentRow, el código de estado y lo que ya traía', async () => {
      const d = build();
      d.rolesRepo.findByPracticePage.mockResolvedValue([
        {
          id: 'a',
          practiceId: 'p1',
          practiceSiteId: 's1',
          practitionerProfileId: 'pp-1',
          healthcareServiceId: 'hs-1',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_INVITED,
          createdAt: new Date('2026-01-01'),
        },
      ]);

      const [item] = (await d.service.listPracticeAssignments('p1', actor, {}))
        .items;

      expect(item).toMatchObject({
        id: 'a',
        practiceSiteId: 's1',
        healthcareServiceId: 'hs-1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_INVITED,
        statusCode: 'ROLE_ASG_INVITED',
        initiatedBy: 'PRACTICE',
        status: PRAC.ROLE_ASSIGNMENT_INVITED,
      });
      expect(item).toHaveProperty('serviceConceptId');
      expect(item).toHaveProperty('serviceDisplay');
      expect(item).toHaveProperty('practitionerName');
    });
  });

  describe('selfRequestAffiliation con procedimiento (A-5, A-7, RN-07)', () => {
    const practitioner = { id: 'u-doc', practitionerProfileId: 'hp1' } as any;
    const activeService = (overrides: Record<string, unknown> = {}): any => ({
      id: 'hs-1',
      practiceId: 'p1',
      practiceSiteId: 's1',
      statusConceptId: PRAC.SERVICE_ACTIVE,
      ...overrides,
    });
    const created = (): any => ({
      id: 'r1',
      practiceId: 'p1',
      practitionerProfileId: 'hp1',
      statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
      createdAt: new Date(),
    });

    /**
     * Sistema bajo prueba con una práctica activa y una sede de esa práctica.
     * @returns Resultado de build.
     */
    function ready() {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        statusConceptId: PRAC.PRACTICE_ACTIVE,
      });
      d.sitesRepo.findById.mockResolvedValue({ id: 's1', practiceId: 'p1' });
      d.servicesRepo.findById.mockResolvedValue(activeService());
      d.rolesRepo.create.mockReturnValue(created());
      return d;
    }

    it('con healthcareServiceId crea una sola fila PENDING con ese procedimiento', async () => {
      const d = ready();

      const res = await d.service.selfRequestAffiliation(
        'p1',
        { practiceSiteId: 's1', healthcareServiceId: 'hs-1' },
        practitioner,
      );

      expect(d.rolesRepo.create).toHaveBeenCalledTimes(1);
      expect(d.rolesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          healthcareServiceId: 'hs-1',
          statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        }),
      );
      expect(res.status).toBe(PRAC.ROLE_ASSIGNMENT_PENDING);
    });

    it('sin healthcareServiceId se comporta como antes: una fila PENDING sin procedimiento', async () => {
      const d = ready();

      await d.service.selfRequestAffiliation(
        'p1',
        { practiceSiteId: 's1' },
        practitioner,
      );

      expect(d.servicesRepo.findById).not.toHaveBeenCalled();
      expect(d.rolesRepo.findOpenForServices).not.toHaveBeenCalled();
      expect(d.rolesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ healthcareServiceId: undefined }),
      );
    });

    it.each([
      ['de otra sede', { practiceSiteId: 's9' }],
      ['inactivo', { statusConceptId: 'inactivo' }],
      ['de otra práctica', { practiceId: 'otra' }],
    ])('un procedimiento %s da 422 y no deja filas', async (_name, change) => {
      const d = ready();
      d.servicesRepo.findById.mockResolvedValue(activeService(change));

      await expect(
        d.service.selfRequestAffiliation(
          'p1',
          { practiceSiteId: 's1', healthcareServiceId: 'hs-1' },
          practitioner,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
    });

    it('un procedimiento sin sede en la solicitud da 422', async () => {
      const d = ready();

      await expect(
        d.service.selfRequestAffiliation(
          'p1',
          { healthcareServiceId: 'hs-1' },
          practitioner,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
    });

    it('si ya hay una vinculación en curso con ese procedimiento da 409', async () => {
      const d = ready();
      d.rolesRepo.findOpenForServices.mockResolvedValue([{ id: 'previa' }]);

      await expect(
        d.service.selfRequestAffiliation(
          'p1',
          { practiceSiteId: 's1', healthcareServiceId: 'hs-1' },
          practitioner,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.rolesRepo.create).not.toHaveBeenCalled();
    });

    it('RN-07: un médico ACTIVE en otra organización puede pedir en esta', async () => {
      const d = ready();
      // La única comprobación de duplicado es sobre el mismo procedimiento de
      // la misma sede; su vinculación en otra organización no cuenta.
      d.rolesRepo.findOpenForServices.mockResolvedValue([]);

      await expect(
        d.service.selfRequestAffiliation(
          'p1',
          { practiceSiteId: 's1', healthcareServiceId: 'hs-1' },
          practitioner,
        ),
      ).resolves.toMatchObject({ status: PRAC.ROLE_ASSIGNMENT_PENDING });
      expect(d.rolesRepo.findOpenForServices).toHaveBeenCalledWith(
        d.tx,
        'hp1',
        's1',
        ['hs-1'],
        expect.any(Array),
      );
    });
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

describe('PracticeWorkforceService · alcance de tenant (PRAC-01)', () => {
  const activePractice = (tenantId = TENANT_A): any => ({
    id: 'p1',
    tenantId,
    statusConceptId: PRAC.PRACTICE_ACTIVE,
  });
  const roleOf = (statusConceptId: string): any => ({
    id: 'r1',
    practiceId: 'p-de-b',
    practitionerProfileId: 'hp1',
    statusConceptId,
    createdAt: new Date(),
  });

  it('asignar un rol en la práctica de otro tenant: 404 uniforme, igual que inexistente; no persiste', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue(activePractice(TENANT_B));
    const foreign = await expectOutOfScope(
      d.service.assignRole(
        'p1',
        { practitionerProfileId: 'hp1' } as any,
        actor,
      ),
      'Práctica no encontrada',
    );
    d.practicesRepo.findById.mockResolvedValue(null);
    const missing = await expectOutOfScope(
      d.service.assignRole(
        'p1',
        { practitionerProfileId: 'hp1' } as any,
        actor,
      ),
      'Práctica no encontrada',
    );

    expect(foreign.getResponse()).toEqual(missing.getResponse());
    expect(d.rolesRepo.create).not.toHaveBeenCalled();
    expect(d.tx.flush).not.toHaveBeenCalled();
  });

  it('asignar un rol con una unidad o un servicio que no son de la práctica se rechaza sin persistir', async () => {
    const d = build();
    d.practicesRepo.findById.mockResolvedValue(activePractice());
    d.unitsRepo.findById.mockResolvedValue({ id: 'u1', practiceSiteId: 's9' });
    d.sitesRepo.findById.mockResolvedValue({ id: 's9', practiceId: 'otra' });

    await expect(
      d.service.assignRole(
        'p1',
        { practitionerProfileId: 'hp1', clinicalUnitId: 'u1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);

    d.servicesRepo.findById.mockResolvedValue({
      id: 'sv1',
      practiceId: 'otra',
    });
    await expect(
      d.service.assignRole(
        'p1',
        { practitionerProfileId: 'hp1', healthcareServiceId: 'sv1' } as any,
        actor,
      ),
    ).rejects.toBeInstanceOf(PreconditionFailedException);

    expect(d.rolesRepo.create).not.toHaveBeenCalled();
  });

  it('adjuntar personal de apoyo a un rol de otro tenant: 404 uniforme y no persiste', async () => {
    const d = build();
    d.rolesRepo.findById.mockResolvedValue(roleOf(PRAC.ROLE_ASSIGNMENT_ACTIVE));
    d.practicesRepo.findById.mockResolvedValue(activePractice(TENANT_B));

    await expectOutOfScope(
      d.service.attachSupport('r1', { supportProfileId: 'sp1' } as any, actor),
      'Rol de profesional no encontrado',
    );

    expect(d.supportRepo.create).not.toHaveBeenCalled();
  });

  it.each([
    ['suspendAssignment', PRAC.ROLE_ASSIGNMENT_ACTIVE],
    ['endAssignment', PRAC.ROLE_ASSIGNMENT_ACTIVE],
  ] as const)(
    '%s sobre la vinculación de otro tenant: 404 uniforme; su estado no cambia',
    async (method, status) => {
      const d = build();
      const role = roleOf(status);
      d.rolesRepo.findById.mockResolvedValue(role);
      d.practicesRepo.findById.mockResolvedValue(activePractice(TENANT_B));

      const foreign = await expectOutOfScope(
        d.service[method]('r1', {} as any, actor),
        'Vinculación profesional-organización no encontrada',
      );
      d.rolesRepo.findById.mockResolvedValue(null);
      const missing = await expectOutOfScope(
        d.service[method]('r1', {} as any, actor),
        'Vinculación profesional-organización no encontrada',
      );

      expect(foreign.getResponse()).toEqual(missing.getResponse());
      expect(role.statusConceptId).toBe(status);
      expect(d.tx.flush).not.toHaveBeenCalled();
    },
  );

  it('la vinculación propia sí transiciona', async () => {
    const d = build();
    const role = { ...roleOf(PRAC.ROLE_ASSIGNMENT_PENDING), practiceId: 'p1' };
    d.rolesRepo.findById.mockResolvedValue(role);
    d.practicesRepo.findById.mockResolvedValue(activePractice());

    const res = await d.service.approveAssignment('r1', {} as any, actor);

    expect(res.status).toBe(PRAC.ROLE_ASSIGNMENT_ACTIVE);
  });

  it('sin tenant en el contexto no se suspende ni se finaliza nada', async () => {
    const d = build();

    await expect(
      d.raw.suspendAssignment('r1', {} as any, actor),
    ).rejects.toThrow();
    await expect(d.raw.endAssignment('r1', {} as any, actor)).rejects.toThrow();
    expect(d.rolesRepo.findById).not.toHaveBeenCalled();
  });
});

describe('PracticeWorkforceService · aprobar y rechazar por administración de la organización (A-6, CI-5)', () => {
  const orgAdmin = { id: 'admin-org', roles: ['USER'] } as any;
  const pendingRole = (overrides: Record<string, unknown> = {}): any => ({
    id: 'r1',
    practiceId: 'p1',
    practitionerProfileId: 'hp1',
    statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
    createdAt: new Date(),
    ...overrides,
  });

  it('el administrador de esa práctica aprueba solo esa fila sin SECURITY_ADMIN ni tenant en el contexto', async () => {
    const d = build();
    const target = pendingRole();
    const other = pendingRole({ id: 'r2' });
    d.rolesRepo.findById.mockResolvedValue(target);

    const res = await d.raw.approveAssignment('r1', {} as any, orgAdmin);

    expect(d.administration.assertCanAdministerPractice).toHaveBeenCalledWith(
      d.tx,
      'p1',
      orgAdmin,
    );
    expect(res.status).toBe(PRAC.ROLE_ASSIGNMENT_ACTIVE);
    expect(target.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_ACTIVE);
    expect(other.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_PENDING);
  });

  it('rechazar deja la fila REJECTED con validTo', async () => {
    const d = build();
    const target = pendingRole();
    d.rolesRepo.findById.mockResolvedValue(target);

    await d.raw.rejectAssignment('r1', {} as any, orgAdmin);

    expect(target.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_REJECTED);
    expect(target.validTo).toBeInstanceOf(Date);
  });

  it.each(['approveAssignment', 'rejectAssignment'] as const)(
    '%s por el administrador de otra organización: 403 y el estado no cambia',
    async (method) => {
      const d = build();
      const target = pendingRole();
      d.rolesRepo.findById.mockResolvedValue(target);
      d.administration.assertCanAdministerPractice.mockRejectedValue(
        new ForbiddenException('otra organización'),
      );

      await expect(
        d.raw[method]('r1', {} as any, orgAdmin),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(target.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_PENDING);
      expect(d.tx.flush).not.toHaveBeenCalled();
    },
  );

  it.each(['approveAssignment', 'rejectAssignment'] as const)(
    '%s sobre una vinculación inexistente: 404 y no consulta la regla',
    async (method) => {
      const d = build();
      d.rolesRepo.findById.mockResolvedValue(null);

      await expect(
        d.raw[method]('r1', {} as any, orgAdmin),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(
        d.administration.assertCanAdministerPractice,
      ).not.toHaveBeenCalled();
    },
  );

  it.each(['approveAssignment', 'rejectAssignment'] as const)(
    'CI-5: %s sobre una fila INVITED da 422: el centro no activa su propia invitación',
    async (method) => {
      const d = build();
      const invited = pendingRole({
        statusConceptId: PRAC.ROLE_ASSIGNMENT_INVITED,
      });
      d.rolesRepo.findById.mockResolvedValue(invited);

      await expect(
        d.raw[method]('r1', {} as any, orgAdmin),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
      expect(invited.statusConceptId).toBe(PRAC.ROLE_ASSIGNMENT_INVITED);
      expect(d.tx.flush).not.toHaveBeenCalled();
    },
  );
});
