import { jest } from '@jest/globals';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
import { DraftService } from './draft.service';
import {
  PreconditionFailedException,
  ResourceNotFoundException,
} from '../../../common';
import { SYSOPS } from '../system_ops.concepts';

const actor = { id: 'admin-1', roles: ['SECURITY_ADMIN'] } as any;

/**
 * Construye el sistema bajo prueba con dependencias controladas.
 * @returns Resultado de build.
 */
function build() {
  const tx = { flush: mockFn().mockResolvedValue(undefined) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const repo = {
    create: mockFn(),
    findById: mockFn(),
    createRevision: mockFn(),
  };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new DraftService(em as any, repo, logger as any);
  return { service, repo };
}

describe('DraftService (UC-11-15)', () => {
  describe('createDraft', () => {
    it('creates a DRAFT owned by the actor', async () => {
      const d = build();
      d.repo.create.mockReturnValue({
        id: 'dr1',
        statusConceptId: SYSOPS.DRAFT,
      });
      const res = await d.service.createDraft(
        { schemaName: 's', tableName: 't', payloadJson: {} },
        actor,
      );
      expect(res.id).toBe('dr1');
      expect(res.statusConceptId).toBe(SYSOPS.DRAFT);
    });
  });

  describe('publishDraft', () => {
    it('throws when the draft is missing', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue(null);
      await expect(
        d.service.publishDraft('dr1', { publishReference: 'r' } as any, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rejects publishing when the actor is not the owner', async () => {
      const d = build();
      d.repo.findById.mockResolvedValue({
        id: 'dr1',
        ownerUserId: 'someone-else',
        statusConceptId: SYSOPS.DRAFT,
      });
      await expect(
        d.service.publishDraft('dr1', { publishReference: 'r' } as any, actor),
      ).rejects.toBeInstanceOf(PreconditionFailedException);
    });

    it('publishes a DRAFT and materializes a revision', async () => {
      const d = build();
      const draft: any = {
        id: 'dr1',
        ownerUserId: actor.id,
        statusConceptId: SYSOPS.DRAFT,
        schemaName: 's',
        tableName: 't',
        payloadJson: { a: 1 },
        updatedAt: new Date(),
      };
      d.repo.findById.mockResolvedValue(draft);
      const res = await d.service.publishDraft(
        'dr1',
        { publishReference: 'r' },
        actor,
      );
      expect(draft.statusConceptId).toBe(SYSOPS.PUBLISHED);
      expect(res.publishedRecordId).toBeDefined();
      expect(d.repo.createRevision).toHaveBeenCalled();
    });
  });
});
