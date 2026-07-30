import { jest } from '@jest/globals';

// Loose-typed mock factory: keeps runtime 'jest' but avoids @jest/globals' strict Mock<never> typings under the root tsconfig.
/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { OrgextAffiliationsService } from './orgext-affiliations.service';
import { ORGEXT } from '../organization_extensions.concepts';
import {
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
  const affiliationsRepo = {
    findById: mockFn(),
    findActiveDuplicate: mockFn(),
    create: mockFn(),
  };
  const boundariesRepo = { countActiveForTenant: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };

  const service = new OrgextAffiliationsService(
    em as any,
    affiliationsRepo,
    boundariesRepo as any,
    logger as any,
  );
  return { service, tx, affiliationsRepo, boundariesRepo };
}

const baseDto = { primaryTenantId: 't1', participatingTenantId: 't2' };

describe('OrgextAffiliationsService', () => {
  describe('declare (UC-22-07)', () => {
    it('rejects when primary equals participating tenant', async () => {
      const d = build();
      await expect(
        d.service.declare(
          { primaryTenantId: 't1', participatingTenantId: 't1' } as any,
          actor,
        ),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects when the participating tenant has no active data boundary', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(0);
      await expect(
        d.service.declare(baseDto as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('rejects a duplicate active affiliation (conflict)', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(1);
      d.affiliationsRepo.findActiveDuplicate.mockResolvedValue({ id: 'a0' });
      await expect(
        d.service.declare(baseDto as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the affiliation when preconditions hold', async () => {
      const d = build();
      d.boundariesRepo.countActiveForTenant.mockResolvedValue(1);
      d.affiliationsRepo.findActiveDuplicate.mockResolvedValue(null);
      const affiliation = {
        id: 'a1',
        primaryTenantId: 't1',
        participatingTenantId: 't2',
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        createdAt: new Date(),
      };
      d.affiliationsRepo.create.mockReturnValue(affiliation);

      const res = await d.service.declare(baseDto, actor);

      expect(res.status).toBe(ORGEXT.AFFILIATION_ACTIVE);
      expect(d.tx.flush).toHaveBeenCalled();
    });
  });

  describe('terminate (UC-22-09)', () => {
    it('throws when the affiliation does not exist', async () => {
      const d = build();
      d.affiliationsRepo.findById.mockResolvedValue(null);
      await expect(
        d.service.terminate('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects when the affiliation is not active', async () => {
      const d = build();
      d.affiliationsRepo.findById.mockResolvedValue({
        id: 'a1',
        statusConceptId: ORGEXT.AFFILIATION_TERMINATED,
      });
      await expect(d.service.terminate('a1', actor)).rejects.toBeInstanceOf(
        PreconditionFailedException,
      );
    });

    it('terminates an active affiliation and stamps valid_to', async () => {
      const d = build();
      const affiliation = {
        id: 'a1',
        statusConceptId: ORGEXT.AFFILIATION_ACTIVE,
        validTo: undefined as Date | undefined,
        updatedAt: new Date(),
      };
      d.affiliationsRepo.findById.mockResolvedValue(affiliation);

      const res = await d.service.terminate('a1', actor);

      expect(res).toEqual({ ok: true, status: ORGEXT.AFFILIATION_TERMINATED });
      expect(affiliation.statusConceptId).toBe(ORGEXT.AFFILIATION_TERMINATED);
      expect(affiliation.validTo).toBeInstanceOf(Date);
    });
  });
});
