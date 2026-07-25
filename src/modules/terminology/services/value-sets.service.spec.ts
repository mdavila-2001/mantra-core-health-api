import { describe, it, expect, jest } from '@jest/globals';
import { ValueSetsService } from './value-sets.service';
import { CONCEPTS, ConflictException, type AuthenticatedUser } from '../../../common';

const actor: AuthenticatedUser = { id: 'actor-1', roles: ['SECURITY_ADMIN'] };

function build() {
  const tx = { flush: jest.fn(() => Promise.resolve()) };
  const em = { transactional: jest.fn((cb: (t: typeof tx) => unknown) => cb(tx)) } as any;
  const valueSetsRepo = {
    findByInternalCode: jest.fn(),
    createValueSet: jest.fn(),
    createVersion: jest.fn(),
    createRule: jest.fn(),
  } as any;
  const logger = { setContext: jest.fn(), info: jest.fn(), warn: jest.fn() } as any;
  const service = new ValueSetsService(em, valueSetsRepo, logger);
  return { service, tx, valueSetsRepo, logger };
}

describe('ValueSetsService', () => {
  const dto = {
    internalCode: 'vs-sex',
    name: 'Sex',
    canonicalUrl: 'http://x/vs',
    rules: [
      { codeSystemId: 'cs-1', operator: 'IN' as const },
      { codeSystemId: 'cs-2', operator: 'IS_A' as const, included: false },
    ],
  };

  it('crea conjunto, versión inicial 1.0.0 por defecto y reglas con flush por nivel', async () => {
    const { service, valueSetsRepo, tx } = build();
    valueSetsRepo.findByInternalCode.mockResolvedValue(null);
    valueSetsRepo.createValueSet.mockReturnValue({ id: 'vs-1' });
    valueSetsRepo.createVersion.mockReturnValue({ id: 'vsv-1' });
    valueSetsRepo.createRule.mockReturnValue({ id: 'r' });

    const result = await service.createValueSet(dto, actor);

    expect(valueSetsRepo.createVersion).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ valueSetId: 'vs-1', version: '1.0.0', isDefault: true }),
    );
    expect(valueSetsRepo.createRule).toHaveBeenNthCalledWith(
      1,
      expect.anything(),
      expect.objectContaining({ operatorConceptId: CONCEPTS.VS_OP_IN, included: true }),
    );
    expect(valueSetsRepo.createRule).toHaveBeenNthCalledWith(
      2,
      expect.anything(),
      expect.objectContaining({ operatorConceptId: CONCEPTS.VS_OP_IS_A, included: false }),
    );
    expect(result).toEqual({ id: 'vs-1', versionId: 'vsv-1', rulesCount: 2 });
    // Un flush por nivel: conjunto, versión, reglas.
    expect(tx.flush).toHaveBeenCalledTimes(3);
  });

  it('crea un conjunto sin reglas', async () => {
    const { service, valueSetsRepo } = build();
    valueSetsRepo.findByInternalCode.mockResolvedValue(null);
    valueSetsRepo.createValueSet.mockReturnValue({ id: 'vs-1' });
    valueSetsRepo.createVersion.mockReturnValue({ id: 'vsv-1' });

    const result = await service.createValueSet(
      { internalCode: 'vs-x', name: 'X', canonicalUrl: 'http://x' },
      actor,
    );

    expect(valueSetsRepo.createRule).not.toHaveBeenCalled();
    expect(result).toEqual({ id: 'vs-1', versionId: 'vsv-1', rulesCount: 0 });
  });

  it('rechaza código interno duplicado con ConflictException', async () => {
    const { service, valueSetsRepo } = build();
    valueSetsRepo.findByInternalCode.mockResolvedValue({ id: 'existing' });

    await expect(service.createValueSet(dto, actor)).rejects.toBeInstanceOf(ConflictException);
  });
});