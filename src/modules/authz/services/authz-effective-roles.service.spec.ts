import { jest } from '@jest/globals';
import { AuthzEffectiveRolesService } from './authz-effective-roles.service';
import { CONCEPTS } from '../../../common';

/**
 * Ejecuta la operación mock fn.
 *
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (): any => (jest.fn as any)();

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const assignmentsRepo = {
    findActiveForUser: mockFn().mockResolvedValue([]),
    findActive: mockFn().mockResolvedValue(null),
    create: mockFn(),
  };
  const em = { find: mockFn().mockResolvedValue([]), findOne: mockFn() };
  const service = new AuthzEffectiveRolesService(assignmentsRepo as never);
  return { service, assignmentsRepo, em };
}

describe('AuthzEffectiveRolesService', () => {
  describe('codesForUser', () => {
    it('devuelve los códigos de los roles asignados y activos', async () => {
      const d = build();
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'r1' },
        { roleId: 'r2' },
      ]);
      d.em.find.mockResolvedValue([
        { id: 'r2', code: 'SURGEON' },
        { id: 'r1', code: 'CLINICIAN' },
      ]);

      await expect(
        d.service.codesForUser(d.em as never, 'u1'),
      ).resolves.toEqual(['CLINICIAN', 'SURGEON']);
    });

    it('no consulta los roles si el usuario no tiene ninguna asignación', async () => {
      const d = build();

      await expect(
        d.service.codesForUser(d.em as never, 'u1'),
      ).resolves.toEqual([]);
      expect(d.em.find).not.toHaveBeenCalled();
    });
  });

  // MCH-001: el ámbito (tenantId) de cada asignación tiene que sobrevivir a la
  // resolución de roles. `codesForUser` lo descarta a propósito (compatibilidad);
  // `scopedAssignmentsForUser` es quien lo conserva para que el guard de
  // autorización pueda exigirlo.
  describe('scopedAssignmentsForUser', () => {
    it('conserva el tenant de cada asignación de rol de negocio', async () => {
      const d = build();
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'r1', tenantId: 'tenant-A' },
        { roleId: 'r2', tenantId: 'tenant-B' },
      ]);
      d.em.find.mockResolvedValue([
        { id: 'r1', code: 'STORAGE_ADMIN' },
        { id: 'r2', code: 'STORAGE_ADMIN' },
      ]);

      await expect(
        d.service.scopedAssignmentsForUser(d.em as never, 'u1'),
      ).resolves.toEqual([
        { code: 'STORAGE_ADMIN', tenantId: 'tenant-A' },
        { code: 'STORAGE_ADMIN', tenantId: 'tenant-B' },
      ]);
    });

    it('una asignación sin tenant declarado queda sin ámbito (excepción documentada)', async () => {
      const d = build();
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([
        { roleId: 'r1', tenantId: undefined },
      ]);
      d.em.find.mockResolvedValue([{ id: 'r1', code: 'PLATFORM_AUDITOR' }]);

      await expect(
        d.service.scopedAssignmentsForUser(d.em as never, 'u1'),
      ).resolves.toEqual([{ code: 'PLATFORM_AUDITOR', tenantId: undefined }]);
    });

    it('descarta el rol que ya no está activo', async () => {
      const d = build();
      d.assignmentsRepo.findActiveForUser.mockResolvedValue([{ roleId: 'r1' }]);
      // El repositorio filtra por estado: un rol desactivado no vuelve.
      d.em.find.mockResolvedValue([]);

      await expect(
        d.service.codesForUser(d.em as never, 'u1'),
      ).resolves.toEqual([]);
      expect(d.em.find).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ stateConceptId: CONCEPTS.STATE_ACTIVE }),
      );
    });
  });

  describe('ensureRoleByCode', () => {
    it('crea la asignación cuando el rol existe y es asignable', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue({
        id: 'r1',
        code: 'PRACTITIONER',
        isAssignable: true,
      });

      await expect(
        d.service.ensureRoleByCode(d.em as never, 'u1', 'PRACTITIONER', {
          tenantId: 't1',
          actorUserId: 'admin',
        }),
      ).resolves.toBe(true);
      expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
        d.em,
        expect.objectContaining({ userId: 'u1', roleId: 'r1', tenantId: 't1' }),
      );
    });

    it('no duplica la asignación que el usuario ya tiene', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue({ id: 'r1', isAssignable: true });
      d.assignmentsRepo.findActive.mockResolvedValue({ id: 'a1' });

      await expect(
        d.service.ensureRoleByCode(d.em as never, 'u1', 'PRACTITIONER'),
      ).resolves.toBe(true);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    // MCH-034: el lookup tiene que preguntar por el mismo ámbito que se va a
    // conceder, no sólo por (usuario, rol).
    it('pasa el tenant al lookup: no confunde una asignación de otro tenant con esta', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue({ id: 'r1', isAssignable: true });
      d.assignmentsRepo.findActive.mockResolvedValue(null);

      await d.service.ensureRoleByCode(d.em as never, 'u1', 'PRACTITIONER', {
        tenantId: 'tenant-B',
      });

      expect(d.assignmentsRepo.findActive).toHaveBeenCalledWith(
        d.em,
        'u1',
        'r1',
        { tenantId: 'tenant-B' },
      );
      expect(d.assignmentsRepo.create).toHaveBeenCalledWith(
        d.em,
        expect.objectContaining({ tenantId: 'tenant-B' }),
      );
    });

    it('responde false sin lanzar cuando el rol no existe', async () => {
      // Quien lo llama está completando un flujo mayor —un alta, la
      // verificación de una matrícula— y decide si eso es un fallo.
      const d = build();
      d.em.findOne.mockResolvedValue(null);

      await expect(
        d.service.ensureRoleByCode(d.em as never, 'u1', 'NO_EXISTE'),
      ).resolves.toBe(false);
      expect(d.assignmentsRepo.create).not.toHaveBeenCalled();
    });

    it('responde false cuando el rol existe pero no es asignable', async () => {
      const d = build();
      d.em.findOne.mockResolvedValue({ id: 'r1', isAssignable: false });

      await expect(
        d.service.ensureRoleByCode(d.em as never, 'u1', 'INTERNO'),
      ).resolves.toBe(false);
    });
  });
});
