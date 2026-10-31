import { describe, expect, it, jest } from '@jest/globals';
import { CreateResourceUseCase } from './create-resource.use-case';

/** R0 (CONTRATO-F2-F5 §F4.3): recurso agendable ligado a un espacio. */
function build(space: any, hasActive = false) {
  const tx = { flush: jest.fn<any>().mockResolvedValue(undefined) };
  const em = { transactional: jest.fn((cb: any) => cb(tx)) };
  const catalogRepo = {
    createResource: jest.fn<any>().mockReturnValue({ id: 'res-1' }),
  };
  const access = {
    assertMayCreateResource: jest.fn(),
    assertAffiliationWithOrganization: jest
      .fn<any>()
      .mockResolvedValue(undefined),
  };
  const logger = { setContext: jest.fn(), info: jest.fn() };
  const spaces = {
    describe: jest.fn<any>().mockResolvedValue(space),
    hasActiveResource: jest.fn<any>().mockResolvedValue(hasActive),
    announceLinked: jest.fn<any>().mockResolvedValue(undefined),
  };
  const uc = new CreateResourceUseCase(
    em as any,
    catalogRepo as any,
    access as any,
    logger as any,
    spaces as any,
  );
  return { uc, catalogRepo, spaces };
}

const dto = {
  tenantId: 't1',
  resourceType: 'ROOM',
  resourceRefType: 'care_spaces',
  resourceRefId: 'or-1',
  name: 'Quirófano 1',
} as any;
const actor = { id: 'u1', roles: [] } as any;
const or = {
  tenantId: 't1',
  practiceSiteId: 's1',
  functionCode: 'SPACE_FN_OPERATING_ROOM',
  schedulable: true,
  active: true,
};

describe('CreateResourceUseCase · R0', () => {
  it('permitido: escribe care_space_id y avisa el vínculo', async () => {
    const d = build(or);
    await d.uc.execute(dto, actor);
    expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        careSpaceId: 'or-1',
        resourceRefType: 'care_spaces',
      }),
    );
    expect(d.spaces.announceLinked).toHaveBeenCalled();
  });

  it('fail-closed por tenant: espacio de otro tenant → 404 y no crea', async () => {
    const d = build({ ...or, tenantId: 't2' });
    await expect(d.uc.execute(dto, actor)).rejects.toMatchObject({
      status: 404,
    });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
  });

  it('422 SPACE_NOT_SCHEDULABLE, 422 SPACE_NOT_ACTIVE, 409 RESOURCE_ALREADY_EXISTS_FOR_SPACE', async () => {
    await expect(
      build({ ...or, schedulable: false }).uc.execute(dto, actor),
    ).rejects.toMatchObject({ reason: 'SPACE_NOT_SCHEDULABLE' });
    await expect(
      build({ ...or, active: false }).uc.execute(dto, actor),
    ).rejects.toMatchObject({ reason: 'SPACE_NOT_ACTIVE' });
    await expect(build(or, true).uc.execute(dto, actor)).rejects.toMatchObject({
      reason: 'RESOURCE_ALREADY_EXISTS_FOR_SPACE',
    });
  });

  it('otros tipos de referencia no consultan espacios', async () => {
    const d = build(null);
    await d.uc.execute(
      { ...dto, resourceRefType: 'health_practitioner_profiles' },
      actor,
    );
    expect(d.spaces.describe).not.toHaveBeenCalled();
  });
});
