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
import {
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
  };
  const supportRepo = { create: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PracticeWorkforceService(
    em as any,
    practicesRepo as any,
    sitesRepo as any,
    unitsRepo as any,
    servicesRepo as any,
    rolesRepo as any,
    supportRepo as any,
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

  describe('listPracticeAssignments (CV-14)', () => {
    it('throws 404 without distinguishing "does not exist" from "another tenant" (isolation)', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: 'tenant-b',
      });
      await expect(
        d.service.listPracticeAssignments('p1', 'tenant-a', {}),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
      expect(d.rolesRepo.findByPracticePage).not.toHaveBeenCalled();
    });

    it('lists a page scoped to the practice, with a cursor when there is more', async () => {
      const d = build();
      d.practicesRepo.findById.mockResolvedValue({
        id: 'p1',
        tenantId: 'tenant-a',
      });
      const row = (id: string) => ({
        id,
        practiceId: 'p1',
        practitionerProfileId: 'pp-1',
        statusConceptId: PRAC.ROLE_ASSIGNMENT_PENDING,
        createdAt: new Date('2026-01-01'),
      });
      d.rolesRepo.findByPracticePage.mockResolvedValue([row('a'), row('b')]);

      const res = await d.service.listPracticeAssignments('p1', 'tenant-a', {
        limit: 1,
      });

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
    ['approveAssignment', PRAC.ROLE_ASSIGNMENT_PENDING],
    ['rejectAssignment', PRAC.ROLE_ASSIGNMENT_PENDING],
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

  it('sin tenant en el contexto no se transiciona nada', async () => {
    const d = build();

    await expect(
      d.raw.approveAssignment('r1', {} as any, actor),
    ).rejects.toThrow();
    expect(d.rolesRepo.findById).not.toHaveBeenCalled();
  });
});
