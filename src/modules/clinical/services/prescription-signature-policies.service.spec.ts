import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { PrescriptionSignaturePoliciesService } from './prescription-signature-policies.service';
import { ResourceNotFoundException } from '../../../common';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = {
    transactional: mockFn((cb: any) => cb(tx)),
    // isSignatureRequired/list usan directamente el em (no transaccional).
  };
  const repo = {
    findById: mockFn(),
    findByTenant: mockFn(),
    findActive: mockFn(),
    create: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new PrescriptionSignaturePoliciesService(
    em as any,
    repo as any,
    logger as any,
  );
  return { service, em, repo };
}

describe('PrescriptionSignaturePoliciesService', () => {
  describe('isSignatureRequired (fail-safe resolution)', () => {
    it('returns false when there is no policy at all (flow intact)', async () => {
      const d = build();
      d.repo.findActive.mockResolvedValue([]);
      const res = await d.service.isSignatureRequired('t1', {
        medicationType: 'm1',
      });
      expect(res).toBe(false);
    });

    it('returns true when a required tenant-wide (wildcard) policy applies', async () => {
      const d = build();
      d.repo.findActive.mockResolvedValue([
        {
          jurisdictionCode: null,
          medicationTypeConceptId: null,
          channelConceptId: null,
          signatureRequired: true,
          effectiveFrom: new Date('2026-01-01'),
        },
      ]);
      const res = await d.service.isSignatureRequired('t1', {
        medicationType: 'm1',
      });
      expect(res).toBe(true);
    });

    it('does not apply a policy scoped to a different medication type', async () => {
      const d = build();
      d.repo.findActive.mockResolvedValue([
        {
          jurisdictionCode: null,
          medicationTypeConceptId: 'controlled',
          channelConceptId: null,
          signatureRequired: true,
          effectiveFrom: new Date('2026-01-01'),
        },
      ]);
      const res = await d.service.isSignatureRequired('t1', {
        medicationType: 'ordinary',
      });
      expect(res).toBe(false);
    });

    it('picks the MOST SPECIFIC applicable policy over a broader one', async () => {
      const d = build();
      d.repo.findActive.mockResolvedValue([
        // Comodín (menos específico) que sí exigiría firma.
        {
          jurisdictionCode: null,
          medicationTypeConceptId: null,
          channelConceptId: null,
          signatureRequired: true,
          effectiveFrom: new Date('2026-01-01'),
        },
        // Específico para este medicamento que NO exige firma → gana.
        {
          jurisdictionCode: null,
          medicationTypeConceptId: 'm1',
          channelConceptId: null,
          signatureRequired: false,
          effectiveFrom: new Date('2026-02-01'),
        },
      ]);
      const res = await d.service.isSignatureRequired('t1', {
        medicationType: 'm1',
      });
      expect(res).toBe(false);
    });

    it('breaks specificity ties by the most recent effective_from', async () => {
      const d = build();
      d.repo.findActive.mockResolvedValue([
        {
          jurisdictionCode: null,
          medicationTypeConceptId: 'm1',
          channelConceptId: null,
          signatureRequired: false,
          effectiveFrom: new Date('2026-01-01'),
        },
        {
          jurisdictionCode: null,
          medicationTypeConceptId: 'm1',
          channelConceptId: null,
          signatureRequired: true,
          effectiveFrom: new Date('2026-06-01'),
        },
      ]);
      const res = await d.service.isSignatureRequired('t1', {
        medicationType: 'm1',
      });
      expect(res).toBe(true);
    });
  });

  describe('create', () => {
    it('defaults effectiveFrom to now and persists', async () => {
      const d = build();
      d.repo.create.mockReturnValue({
        id: 'pol1',
        tenantId: 't1',
        signatureRequired: true,
        effectiveFrom: new Date(),
      });
      const res = await d.service.create(
        { tenantId: 't1', signatureRequired: true },
        actor,
      );
      expect(res.id).toBe('pol1');
      expect(d.repo.create.mock.calls[0][1].effectiveFrom).toBeInstanceOf(Date);
    });
  });

  describe('deactivate (no hard delete)', () => {
    it('closes the validity window by setting effectiveTo', async () => {
      const d = build();
      const policy = {
        id: 'pol1',
        tenantId: 't1',
        signatureRequired: true,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: undefined as Date | undefined,
        updatedAt: new Date(),
      };
      d.repo.findById.mockResolvedValue(policy);
      const res = await d.service.deactivate('pol1', actor);
      expect(policy.effectiveTo).toBeInstanceOf(Date);
      expect(res.effectiveTo).toBeInstanceOf(Date);
    });

    it('throws when the policy is missing', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(null);
      await expect(
        d.service.deactivate('missing', actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });
  });
});
