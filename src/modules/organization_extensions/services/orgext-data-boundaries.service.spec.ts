import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextDataBoundariesService } from './orgext-data-boundaries.service';
import { ORGEXT } from '../organization_extensions.concepts';
import { ConflictException, runWithTenant } from '../../../common';
import { OrganizationExtensionsErrorReason } from '../organization_extensions.error-reasons';

const inTenant = <T>(fn: () => Promise<T>, tenantId = 't1'): Promise<T> =>
  runWithTenant(tenantId, fn);

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const boundariesRepo = {
    findActiveByTenantAndType: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextDataBoundariesService(
    em as any,
    boundariesRepo as any,
    logger as any,
  );
  return { service, tx, boundariesRepo };
}

const baseDto = { tenantId: 't1', dataControllerTenantId: 't1' };

describe('OrgextDataBoundariesService', () => {
  describe('define (UC-22-08)', () => {
    it('creates an active data boundary', async () => {
      const d = build();
      d.boundariesRepo.findActiveByTenantAndType.mockResolvedValue(null);
      const boundary = {
        id: 'b1',
        tenantId: 't1',
        statusConceptId: ORGEXT.BOUNDARY_ACTIVE,
        effectiveFrom: new Date(),
        createdAt: new Date(),
      };
      d.boundariesRepo.create.mockReturnValue(boundary);

      const res = await inTenant(() => d.service.define(baseDto, actor));

      expect(res.status).toBe(ORGEXT.BOUNDARY_ACTIVE);
      expect(d.tx.flush).toHaveBeenCalled();
    });

    it('rejects when an active boundary of the same type already exists (conflict)', async () => {
      const d = build();
      d.boundariesRepo.findActiveByTenantAndType.mockResolvedValue({
        id: 'b0',
      });
      await expect(
        inTenant(() => d.service.define(baseDto as any, actor)),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(d.boundariesRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('alcance de tenant (ORGEXT-01)', () => {
    it('rechaza una frontera cuyo cuerpo declara el tenant de otra organización', async () => {
      const d = build();

      await expect(
        inTenant(() =>
          d.service.define(
            { tenantId: 't2', dataControllerTenantId: 't2' },
            actor,
          ),
        ),
      ).rejects.toMatchObject({
        reason: OrganizationExtensionsErrorReason.ORGEXT_RESOURCE_NOT_AVAILABLE,
      });
      expect(d.boundariesRepo.findActiveByTenantAndType).not.toHaveBeenCalled();
      expect(d.boundariesRepo.create).not.toHaveBeenCalled();
    });

    it('persiste la frontera con el tenant del contexto', async () => {
      const d = build();
      d.boundariesRepo.findActiveByTenantAndType.mockResolvedValue(null);
      d.boundariesRepo.create.mockReturnValue({
        id: 'b1',
        tenantId: 't1',
        statusConceptId: ORGEXT.BOUNDARY_ACTIVE,
        effectiveFrom: new Date(),
        createdAt: new Date(),
      });

      await inTenant(() => d.service.define(baseDto, actor));

      expect(d.boundariesRepo.create).toHaveBeenCalledWith(
        d.tx,
        expect.objectContaining({ tenantId: 't1' }),
      );
    });
  });
});
