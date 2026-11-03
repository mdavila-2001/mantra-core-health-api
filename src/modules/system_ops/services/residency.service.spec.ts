import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { ResidencyService } from './residency.service';
import {
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { SystemOpsErrorReason } from '../system_ops.error-reasons';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    findPolicyByCode: mockFn(),
    createPolicy: mockFn(),
    createBinding: mockFn(),
    findBindingPolicyById: mockFn(),
    tenantExists: mockFn(),
    findConceptCodes: mockFn(),
    findTransferByReference: mockFn(),
    createTransfer: mockFn(),
  };
  const governanceRepo = { recordChange: mockFn() };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new ResidencyService(
    em as any,
    repo as any,
    governanceRepo as any,
    logger as any,
  );
  return { service, repo };
}

describe('ResidencyService', () => {
  describe('createResidencyPolicy (UC-11-06)', () => {
    it('rejects a duplicate code', async () => {
      const d = build();
      d.repo.findPolicyByCode.mockResolvedValue({ id: 'r1' });
      await expect(
        d.service.createResidencyPolicy({ code: 'R' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates the policy', async () => {
      const d = build();
      d.repo.findPolicyByCode.mockResolvedValue(null);
      d.repo.createPolicy.mockReturnValue({ id: 'r2' });
      const res = await d.service.createResidencyPolicy(
        { code: 'R' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'r2' });
    });
  });

  describe('createBinding (UC-11-06)', () => {
    const PRIMARY = 'primary-region';
    const DR = 'dr-region';
    const dto = {
      tenantId: 't',
      residencyPolicyId: 'r',
      primaryRegionConceptId: PRIMARY,
    };

    /** Cablea tenant, política activa y regiones existentes. */
    function wire(
      d: ReturnType<typeof build>,
      policy: any = { id: 'r', state: 'ACTIVE', allowedRegionCodes: [] },
    ) {
      d.repo.findBindingPolicyById.mockResolvedValue(policy);
      d.repo.tenantExists.mockResolvedValue(true);
      d.repo.findConceptCodes.mockResolvedValue(
        new Map([
          [PRIMARY, 'US-EAST'],
          [DR, 'US-WEST'],
        ]),
      );
      d.repo.createBinding.mockReturnValue({ id: 'b1' });
    }

    it('creates the tenant binding against the policy the FK points to', async () => {
      const d = build();
      wire(d);
      const res = await d.service.createBinding(dto, actor);
      expect(res).toEqual({ id: 'b1' });
      expect(d.repo.findBindingPolicyById).toHaveBeenCalledWith(
        expect.anything(),
        'r',
      );
    });

    it('accepts a binding without a disaster-recovery region', async () => {
      const d = build();
      wire(d);
      await d.service.createBinding(dto, actor);
      expect(d.repo.createBinding.mock.calls[0][1]).toMatchObject({
        primaryRegionConceptId: PRIMARY,
        disasterRecoveryRegionConceptId: undefined,
      });
    });

    it('accepts regions inside the allowed set, ignoring case', async () => {
      const d = build();
      wire(d, {
        id: 'r',
        state: 'ACTIVE',
        allowedRegionCodes: ['us-east', 'us-west'],
      });
      await d.service.createBinding(
        { ...dto, disasterRecoveryRegionConceptId: DR },
        actor,
      );
      expect(d.repo.createBinding).toHaveBeenCalled();
    });

    it('answers 404 with a stable reason when the policy does not exist (system_ops-created ids do not exist in the FK target)', async () => {
      const d = build();
      wire(d, null);
      const attempt = d.service.createBinding(dto, actor);
      await expect(attempt).rejects.toBeInstanceOf(ResourceNotFoundException);
      await expect(attempt).rejects.toMatchObject({
        reason: SystemOpsErrorReason.SYSOPS_RESIDENCY_REFERENCE_NOT_FOUND,
      });
      expect(d.repo.createBinding).not.toHaveBeenCalled();
    });

    it('answers 404 with the same reason when the tenant does not exist', async () => {
      const d = build();
      wire(d);
      d.repo.tenantExists.mockResolvedValue(false);
      await expect(d.service.createBinding(dto, actor)).rejects.toMatchObject({
        reason: SystemOpsErrorReason.SYSOPS_RESIDENCY_REFERENCE_NOT_FOUND,
      });
      expect(d.repo.createBinding).not.toHaveBeenCalled();
    });

    it('answers 404 when a region concept does not exist', async () => {
      const d = build();
      wire(d);
      await expect(
        d.service.createBinding(
          { ...dto, disasterRecoveryRegionConceptId: 'unknown' },
          actor,
        ),
      ).rejects.toMatchObject({
        reason: SystemOpsErrorReason.SYSOPS_RESIDENCY_REFERENCE_NOT_FOUND,
      });
      expect(d.repo.createBinding).not.toHaveBeenCalled();
    });

    it('refuses a retired policy', async () => {
      const d = build();
      wire(d, { id: 'r', state: 'RETIRED', allowedRegionCodes: [] });
      const attempt = d.service.createBinding(dto, actor);
      await expect(attempt).rejects.toBeInstanceOf(PreconditionFailedException);
      await expect(attempt).rejects.toMatchObject({
        reason: SystemOpsErrorReason.SYSOPS_RESIDENCY_POLICY_NOT_EFFECTIVE,
      });
      expect(d.repo.createBinding).not.toHaveBeenCalled();
    });

    it('refuses a region outside the set the policy allows', async () => {
      const d = build();
      wire(d, { id: 'r', state: 'ACTIVE', allowedRegionCodes: ['us-east'] });
      const attempt = d.service.createBinding(
        { ...dto, disasterRecoveryRegionConceptId: DR },
        actor,
      );
      await expect(attempt).rejects.toMatchObject({
        reason: SystemOpsErrorReason.SYSOPS_RESIDENCY_REGION_NOT_ALLOWED,
      });
      expect(d.repo.createBinding).not.toHaveBeenCalled();
    });
  });

  describe('recordTransfer (UC-11-07)', () => {
    it('rejects a duplicate transfer reference (idempotency)', async () => {
      const d = build();
      d.repo.findTransferByReference.mockResolvedValue({ id: 'e1' });
      await expect(
        d.service.recordTransfer({ transferReference: 'REF' } as any, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('records the append-only transfer', async () => {
      const d = build();
      d.repo.findTransferByReference.mockResolvedValue(null);
      d.repo.createTransfer.mockReturnValue({ id: 'e2' });
      const res = await d.service.recordTransfer(
        { transferReference: 'REF' } as any,
        actor,
      );
      expect(res).toEqual({ id: 'e2' });
    });
  });
});
