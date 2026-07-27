import { describe, it, expect, jest } from '@jest/globals';
import { CodeSystemsService } from './code-systems.service';
import {
  ConflictException,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

function build() {
  const tx = { flush: jest.fn(() => Promise.resolve()) };
  const em = {
    transactional: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
  } as any;
  const sourcesRepo = { findByCode: jest.fn(), create: jest.fn() } as any;
  const codeSystemsRepo = {
    findByInternalCode: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  } as any;
  const versionsRepo = {
    findByCodeSystemAndVersion: jest.fn(),
    create: jest.fn(),
  } as any;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as any;
  const service = new CodeSystemsService(
    em,
    sourcesRepo,
    codeSystemsRepo,
    versionsRepo,
    logger,
  );
  return {
    service,
    tx,
    em,
    sourcesRepo,
    codeSystemsRepo,
    versionsRepo,
    logger,
  };
}

describe('CodeSystemsService', () => {
  describe('createCodeSystem', () => {
    const dto = {
      internalCode: 'icd10',
      name: 'ICD-10',
      canonicalUrl: 'http://x/cs',
      sourceCode: 'WHO',
      sourceName: 'World Health Org',
    };

    it('reutiliza la fuente existente y crea el sistema de códigos', async () => {
      const { service, sourcesRepo, codeSystemsRepo, tx } = build();
      codeSystemsRepo.findByInternalCode.mockResolvedValue(null);
      sourcesRepo.findByCode.mockResolvedValue({ id: 'src-1' });
      codeSystemsRepo.create.mockReturnValue({
        id: 'cs-1',
        internalCode: 'icd10',
      });

      const result = await service.createCodeSystem(dto, actor);

      expect(sourcesRepo.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        id: 'cs-1',
        internalCode: 'icd10',
        sourceId: 'src-1',
      });
      expect(tx.flush).toHaveBeenCalled();
    });

    it('crea la fuente cuando no existe (flush intermedio)', async () => {
      const { service, sourcesRepo, codeSystemsRepo, tx } = build();
      codeSystemsRepo.findByInternalCode.mockResolvedValue(null);
      sourcesRepo.findByCode.mockResolvedValue(null);
      sourcesRepo.create.mockReturnValue({ id: 'src-new' });
      codeSystemsRepo.create.mockReturnValue({
        id: 'cs-1',
        internalCode: 'icd10',
      });

      const result = await service.createCodeSystem(dto, actor);

      expect(sourcesRepo.create).toHaveBeenCalled();
      expect(result.sourceId).toBe('src-new');
      expect(tx.flush).toHaveBeenCalledTimes(2);
    });

    it('rechaza código interno duplicado con ConflictException', async () => {
      const { service, codeSystemsRepo } = build();
      codeSystemsRepo.findByInternalCode.mockResolvedValue({ id: 'existing' });

      await expect(service.createCodeSystem(dto, actor)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('createVersion', () => {
    const dto = { version: '1.0.0' };

    it('crea una versión en borrador', async () => {
      const { service, codeSystemsRepo, versionsRepo } = build();
      codeSystemsRepo.findById.mockResolvedValue({ id: 'cs-1' });
      versionsRepo.findByCodeSystemAndVersion.mockResolvedValue(null);
      versionsRepo.create.mockReturnValue({ id: 'v-1', version: '1.0.0' });

      const result = await service.createVersion('cs-1', dto, actor);

      expect(result).toEqual({
        id: 'v-1',
        version: '1.0.0',
        state: 'TERM_DRAFT',
      });
    });

    it('lanza NotFound si el sistema de códigos no existe', async () => {
      const { service, codeSystemsRepo } = build();
      codeSystemsRepo.findById.mockResolvedValue(null);

      await expect(
        service.createVersion('cs-x', dto, actor),
      ).rejects.toBeInstanceOf(ResourceNotFoundException);
    });

    it('rechaza versión duplicada con ConflictException', async () => {
      const { service, codeSystemsRepo, versionsRepo } = build();
      codeSystemsRepo.findById.mockResolvedValue({ id: 'cs-1' });
      versionsRepo.findByCodeSystemAndVersion.mockResolvedValue({ id: 'dup' });

      await expect(
        service.createVersion('cs-1', dto, actor),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
