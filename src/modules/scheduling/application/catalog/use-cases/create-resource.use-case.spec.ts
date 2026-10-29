import { jest } from '@jest/globals';
import { CreateResourceUseCase } from './create-resource.use-case';
import { SchedulingErrorReason } from '../../../scheduling.error-reasons';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const TENANT = '11111111-1111-4111-8111-111111111111';
const REF = '22222222-2222-4222-8222-222222222222';
const admin = { id: 'u1', roles: ['SCHEDULING_ADMIN'], tenantIds: [TENANT] };

const body = (resourceRefType: string, over: Record<string, unknown> = {}) =>
  ({
    tenantId: TENANT,
    resourceType: 'ROOM',
    resourceRefType,
    resourceRefId: REF,
    name: 'Recurso',
    ...over,
  }) as any;

function build() {
  const tx = { execute: mockFn().mockResolvedValue([{ id: REF }]) };
  const em = { transactional: mockFn(async (cb: any) => cb(tx)) };
  const catalogRepo = {
    createResource: mockFn().mockReturnValue({ id: 'res-1' }),
  };
  const access = {
    assertMayCreateResource: mockFn(),
    assertAffiliationWithOrganization: mockFn().mockResolvedValue(undefined),
  };
  const logger = { setContext: mockFn(), info: mockFn() };
  const spaceLinker = { link: mockFn().mockResolvedValue({ id: 'res-sp' }) };
  const equipmentLinker = {
    link: mockFn().mockResolvedValue({ id: 'res-eq' }),
  };
  const useCase = new CreateResourceUseCase(
    em as any,
    catalogRepo as any,
    access as any,
    logger as any,
    spaceLinker as any,
    equipmentLinker as any,
  );
  return { useCase, catalogRepo, access, spaceLinker, equipmentLinker, tx };
}

describe('CreateResourceUseCase · el tipo de referencia (diferencial de analizador)', () => {
  it.each([
    'care_spaces',
    'Care_Spaces ',
    ' CARE_SPACES',
    'practice.care_spaces',
    'PRACTICE.Care_Spaces ',
    'ＣＡＲＥ＿ＳＰＡＣＥＳ',
  ])(
    '%j va por la validación estricta del espacio y nunca llega al alta libre',
    async (raw) => {
      const d = build();
      const res = await d.useCase.execute(body(raw), admin as any);
      expect(res).toEqual({ id: 'res-sp' });
      expect(d.spaceLinker.link).toHaveBeenCalledTimes(1);
      // El linker recibe el valor CANÓNICO, no el crudo.
      expect(d.spaceLinker.link.mock.calls[0][1]).toMatchObject({
        resourceRefType: 'care_spaces',
      });
      expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
      expect(d.access.assertMayCreateResource).not.toHaveBeenCalled();
    },
  );

  it.each([
    'rooms',
    'users',
    'care_spaces;',
    'care_spaces​',
    'evil.care_spaces',
    'public.care_spaces',
    '',
  ])(
    '%j se rechaza con 422 RESOURCE_REF_TYPE_NOT_ALLOWED y no se guarda nada',
    async (raw) => {
      const d = build();
      await expect(
        d.useCase.execute(body(raw), admin as any),
      ).rejects.toMatchObject({
        status: 422,
        reason: SchedulingErrorReason.RESOURCE_REF_TYPE_NOT_ALLOWED,
      });
      expect(d.spaceLinker.link).not.toHaveBeenCalled();
      expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
    },
  );

  it.each([
    ['Practitioner_Profiles ', 'health_practitioner_profiles', 'PRACTITIONER'],
    [
      'profiles.health_practitioner_profiles',
      'health_practitioner_profiles',
      'PRACTITIONER',
    ],
    ['PRACTICE_SITES', 'practice_sites', 'ROOM'],
  ])(
    '%j se guarda siempre en su forma canónica %j, nunca la cruda',
    async (raw, canonical, resourceType) => {
      const d = build();
      await d.useCase.execute(body(raw, { resourceType }), admin as any);
      expect(d.catalogRepo.createResource).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ resourceRefType: canonical }),
      );
      // El control de acceso también ve el valor canónico.
      expect(d.access.assertMayCreateResource.mock.calls[0][0]).toMatchObject({
        resourceRefType: canonical,
      });
    },
  );
});

describe('CreateResourceUseCase · la referencia deja de ser libre (F5a/F5d)', () => {
  it('«Diagnostic_Equipment» va por el vínculo del equipo con su forma canónica y no al alta libre', async () => {
    const d = build();
    const res = await d.useCase.execute(
      body('Diagnostic_Equipment', { resourceType: 'EQUIPMENT' }),
      admin as any,
    );
    expect(res).toEqual({ id: 'res-eq' });
    expect(d.equipmentLinker.link).toHaveBeenCalledWith(
      d.tx,
      REF,
      expect.objectContaining({ name: 'Recurso' }),
      admin,
    );
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
    expect(d.access.assertMayCreateResource).not.toHaveBeenCalled();
  });

  it.each([
    ['PRACTITIONER', 'practice_sites'],
    ['PRACTITIONER', 'diagnostic_equipment'],
    ['ROOM', 'health_practitioner_profiles'],
    ['ROOM', 'diagnostic_equipment'],
    ['EQUIPMENT', 'health_practitioner_profiles'],
    ['EQUIPMENT', 'practice_sites'],
  ])(
    'un recurso %s que referencia %s es 422 RESOURCE_REF_TYPE_MISMATCH y no escribe nada',
    async (resourceType, refType) => {
      const d = build();
      await expect(
        d.useCase.execute(body(refType, { resourceType }), admin as any),
      ).rejects.toMatchObject({
        status: 422,
        reason: SchedulingErrorReason.RESOURCE_REF_TYPE_MISMATCH,
      });
      expect(d.spaceLinker.link).not.toHaveBeenCalled();
      expect(d.equipmentLinker.link).not.toHaveBeenCalled();
      expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
    },
  );

  it('una sede que no es del tenant es 404 RESOURCE_REF_NOT_FOUND y no se guarda el recurso', async () => {
    const d = build();
    d.tx.execute.mockResolvedValue([]);
    await expect(
      d.useCase.execute(body('practice_sites'), admin as any),
    ).rejects.toMatchObject({
      status: 404,
      reason: SchedulingErrorReason.RESOURCE_REF_NOT_FOUND,
    });
    expect(d.catalogRepo.createResource).not.toHaveBeenCalled();
  });

  it('una sede se busca en el tenant del recurso, no en uno que mande el cliente por otra vía', async () => {
    const d = build();
    await d.useCase.execute(body('practice_sites'), admin as any);
    expect(d.tx.execute.mock.calls[0][1]).toEqual([REF, TENANT]);
  });
});
