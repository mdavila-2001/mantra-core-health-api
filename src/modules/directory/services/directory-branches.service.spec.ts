import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DirectoryBranchesService } from './directory-branches.service';
import { DIR } from '../directory.concepts';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const branchesRepo = {
    findByTenantAndCode: mockFn(),
    create: mockFn(),
    findById: mockFn(),
    findHeadOffice: mockFn().mockResolvedValue(null),
  };
  const tenantsRepo = { findById: mockFn() };
  // Autorización por membresía: los tests de este servicio prueban su lógica, no la del
  // permiso; el doble deja pasar y hay un spec propio para el rechazo.
  const tenantAdmin = {
    assertCanAdminister: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new DirectoryBranchesService(
    em as any,
    branchesRepo as any,
    tenantsRepo as any,
    tenantAdmin as never,
    logger as any,
  );
  return { service, tx, branchesRepo, tenantsRepo };
}

describe('DirectoryBranchesService', () => {
  describe('create (UC-04-04)', () => {
    it('throws when the tenant does not exist', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.create('t1', { code: 'B', name: 'Main' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the tenant is suspended (precondition)', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: DIR.TENANT_SUSPENDED,
      });
      await expect(
        d.service.create('t1', { code: 'B', name: 'Main' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicated code within the tenant (conflict)', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
      });
      d.branchesRepo.findByTenantAndCode.mockResolvedValue({ id: 'b0' });
      await expect(
        d.service.create('t1', { code: 'B', name: 'Main' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates an active branch and converts lat/long to strings', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue({
        statusConceptId: CONCEPTS.TENANT_ACTIVE,
      });
      d.branchesRepo.findByTenantAndCode.mockResolvedValue(null);
      const branch = {
        id: 'b1',
        tenantId: 't1',
        code: 'B',
        name: 'Main',
        statusConceptId: DIR.BRANCH_ACTIVE,
        createdAt: new Date(),
      };
      d.branchesRepo.create.mockReturnValue(branch);

      const res = await d.service.create(
        't1',
        { code: 'B', name: 'Main', latitude: -12.05, longitude: -77.04 },
        actor,
      );

      expect(res.id).toBe('b1');
      expect(d.branchesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({
          latitude: '-12.05',
          longitude: '-77.04',
          statusConceptId: DIR.BRANCH_ACTIVE,
        }),
      );
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('categoría de la sede (v4.2.91)', () => {
    const activeTenant = { statusConceptId: CONCEPTS.TENANT_ACTIVE };

    it('sin categoría, crea la sede como default', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(activeTenant);
      d.branchesRepo.findByTenantAndCode.mockResolvedValue(null);
      d.branchesRepo.create.mockImplementation((_tx: unknown, data: any) => ({
        ...data,
        id: 'b1',
        createdAt: new Date(),
      }));

      const res = await d.service.create(
        't1',
        { code: 'B', name: 'Main' } as any,
        actor,
      );

      expect(d.branchesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ branchCategory: 'default' }),
      );
      expect(res.category).toBe('default');
      expect(d.branchesRepo.findHeadOffice).not.toHaveBeenCalled();
    });

    it('crea la casa matriz si la organización no tiene una', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(activeTenant);
      d.branchesRepo.findByTenantAndCode.mockResolvedValue(null);
      d.branchesRepo.create.mockImplementation((_tx: unknown, data: any) => ({
        ...data,
        id: 'b1',
        createdAt: new Date(),
      }));

      const res = await d.service.create(
        't1',
        { code: 'B', name: 'Main', category: 'head_office' },
        actor,
      );

      expect(res.category).toBe('head_office');
    });

    it('rechaza con 409 una segunda casa matriz y no crea nada', async () => {
      const d = build();
      d.tenantsRepo.findById.mockResolvedValue(activeTenant);
      d.branchesRepo.findByTenantAndCode.mockResolvedValue(null);
      d.branchesRepo.findHeadOffice.mockResolvedValue({
        id: 'b0',
        name: 'Casa central',
      });

      const error = await d.service
        .create(
          't1',
          { code: 'B', name: 'Main', category: 'head_office' },
          actor,
        )
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(ConflictException);
      expect((error as ConflictException).message).toContain('casa matriz');
      expect(d.branchesRepo.create).not.toHaveBeenCalled();
    });

    it('cambia la categoría al editar y la devuelve', async () => {
      const d = build();
      const branch = {
        id: 'b2',
        tenantId: 't1',
        code: 'N',
        name: 'Norte',
        branchCategory: 'default',
        statusConceptId: DIR.BRANCH_ACTIVE,
        createdAt: new Date(),
      };
      d.branchesRepo.findById.mockResolvedValue(branch);

      const res = await d.service.update(
        't1',
        'b2',
        { category: 'branch' },
        actor,
      );

      expect(res.category).toBe('branch');
      expect(d.tx.flush).toHaveBeenCalledTimes(1);
    });

    it('al editar, rechaza volver casa matriz una sede si ya hay otra', async () => {
      const d = build();
      d.branchesRepo.findById.mockResolvedValue({
        id: 'b2',
        tenantId: 't1',
        branchCategory: 'branch',
      });
      d.branchesRepo.findHeadOffice.mockResolvedValue({
        id: 'b0',
        name: 'Casa central',
      });

      await expect(
        d.service.update('t1', 'b2', { category: 'head_office' }, actor),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.tx.flush).not.toHaveBeenCalled();
    });

    it('la casa matriz actual puede guardarse otra vez como casa matriz', async () => {
      const d = build();
      d.branchesRepo.findById.mockResolvedValue({
        id: 'b0',
        tenantId: 't1',
        name: 'Casa central',
        branchCategory: 'head_office',
        createdAt: new Date(),
      });
      d.branchesRepo.findHeadOffice.mockResolvedValue({
        id: 'b0',
        name: 'Casa central',
      });

      const res = await d.service.update(
        't1',
        'b0',
        { category: 'head_office', name: 'Casa matriz' },
        actor,
      );

      expect(res.category).toBe('head_office');
      expect(res.name).toBe('Casa matriz');
    });
  });
});
