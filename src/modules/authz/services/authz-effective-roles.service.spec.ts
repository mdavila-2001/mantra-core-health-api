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
