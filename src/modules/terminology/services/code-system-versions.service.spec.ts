import { describe, it, expect, jest } from '@jest/globals';
import { CodeSystemVersionsService } from './code-system-versions.service';
import {
  CONCEPTS,
  ConflictException,
  PreconditionFailedException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

function build() {
  const tx = { flush: jest.fn(() => Promise.resolve()) };
  const em = { transactional: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)) } as any;
  const versionsRepo = { findById: jest.fn() } as any;
  const conceptsRepo = { findExistingCodes: jest.fn(), create: jest.fn() } as any;
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() } as any;
  const service = new CodeSystemVersionsService(em, versionsRepo, conceptsRepo, logger);
  return { service, tx, versionsRepo, conceptsRepo, logger };
}

describe('CodeSystemVersionsService', () => {
  describe('importConcepts', () => {
    const dto = {
      concepts: [
        { code: 'A', display: 'A' },
        { code: 'B', display: 'B' },
        { code: 'A', display: 'A dup' },
      ],
    };

    it('inserta los nuevos, omite existentes y duplicados del lote', async () => {
      const { service, versionsRepo, conceptsRepo } = build();
      versionsRepo.findById.mockResolvedValue({ id: 'v-1', stateConceptId: CONCEPTS.TERM_DRAFT });
      conceptsRepo.findExistingCodes.mockResolvedValue(new Set<string>());
      conceptsRepo.create.mockReturnValue({ id: 'c' });

      const result = await service.importConcepts('v-1', dto, actor);

      // A y B se insertan; el segundo A (duplicado en el lote) se omite.
      expect(result).toEqual({ inserted: 2, skipped: 1, total: 3 });
      expect(conceptsRepo.create).toHaveBeenCalledTimes(2);
    });

    it('omite los códigos ya presentes en la versión', async () => {
      const { service, versionsRepo, conceptsRepo } = build();
      versionsRepo.findById.mockResolvedValue({ id: 'v-1', stateConceptId: CONCEPTS.TERM_DRAFT });
      conceptsRepo.findExistingCodes.mockResolvedValue(new Set<string>(['A']));
      conceptsRepo.create.mockReturnValue({ id: 'c' });

      const result = await service.importConcepts('v-1', dto, actor);

      expect(result).toEqual({ inserted: 1, skipped: 2, total: 3 });
    });

    it('lanza NotFound si la versión no existe', async () => {
      const { service, versionsRepo } = build();
      versionsRepo.findById.mockResolvedValue(null);

      await expect(service.importConcepts('v-x', dto, actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza importar en versión no borrador (Precondition)', async () => {
      const { service, versionsRepo } = build();
      versionsRepo.findById.mockResolvedValue({ id: 'v-1', stateConceptId: CONCEPTS.TERM_ACTIVE });

      await expect(service.importConcepts('v-1', dto, actor)).rejects.toBeInstanceOf(PreconditionFailedException);
    });
  });

  describe('publishVersion', () => {
    it('transiciona de borrador a activa y fija publishedAt', async () => {
      const { service, versionsRepo, tx } = build();
      const version: any = { id: 'v-1', stateConceptId: CONCEPTS.TERM_DRAFT };
      versionsRepo.findById.mockResolvedValue(version);

      const result = await service.publishVersion('v-1', actor);

      expect(version.stateConceptId).toBe(CONCEPTS.TERM_ACTIVE);
      expect(version.publishedAt).toBeInstanceOf(Date);
      expect(result.id).toBe('v-1');
      expect(result.state).toBe('TERM_ACTIVE');
      expect(result.publishedAt).toBeInstanceOf(Date);
      expect(tx.flush).toHaveBeenCalled();
    });

    it('lanza NotFound si la versión no existe', async () => {
      const { service, versionsRepo } = build();
      versionsRepo.findById.mockResolvedValue(null);

      await expect(service.publishVersion('v-x', actor)).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza publicar una versión ya activa (Conflict)', async () => {
      const { service, versionsRepo } = build();
      versionsRepo.findById.mockResolvedValue({ id: 'v-1', stateConceptId: CONCEPTS.TERM_ACTIVE });

      await expect(service.publishVersion('v-1', actor)).rejects.toBeInstanceOf(ConflictException);
    });
  });
});