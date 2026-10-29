import { jest } from '@jest/globals';
import {
  HealthcareServices,
  PractitionerRoleAssignments,
} from '../../practice/entities';
import { PRAC } from '../../practice/practice.concepts';
import { PractitionerAffiliationsRepository } from './practitioner-affiliations.repository';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * `EntityManager` con afiliaciones y servicios controlados.
 *
 * @param roles - Afiliaciones que devuelve la consulta.
 * @param services - Servicios que devuelve la consulta.
 * @returns El doble y su `find`.
 */
function em(roles: any[], services: any[] = []) {
  const find = mockFn((entity: unknown) =>
    Promise.resolve(entity === PractitionerRoleAssignments ? roles : services),
  );
  return { double: { find } as any, find };
}

describe('PractitionerAffiliationsRepository', () => {
  const repo = new PractitionerAffiliationsRepository();

  it('solo cuenta la afiliación ACTIVE y vigente (INVITED, PENDING, etc. no)', async () => {
    const { double, find } = em([]);

    await repo.findActiveSites(double, ['doc'], ['s1'], ['proc']);

    expect(find).toHaveBeenCalledWith(
      PractitionerRoleAssignments,
      expect.objectContaining({
        statusConceptId: PRAC.ROLE_ASSIGNMENT_ACTIVE,
        validTo: null,
      }),
    );
  });

  it('devuelve el par (médico, sede) cuando el servicio es de un procedimiento pedido', async () => {
    const { double } = em(
      [
        {
          practitionerProfileId: 'doc',
          practiceSiteId: 's1',
          healthcareServiceId: 'hs1',
        },
      ],
      [{ id: 'hs1' }],
    );

    await expect(
      repo.findActiveSites(double, ['doc'], ['s1'], ['proc']),
    ).resolves.toEqual([
      { practitionerProfileId: 'doc', practiceSiteId: 's1' },
    ]);
  });

  it('un servicio de otro procedimiento no cuenta', async () => {
    const { double, find } = em(
      [
        {
          practitionerProfileId: 'doc',
          practiceSiteId: 's1',
          healthcareServiceId: 'hs-otro',
        },
      ],
      [],
    );

    await expect(
      repo.findActiveSites(double, ['doc'], ['s1'], ['proc']),
    ).resolves.toEqual([]);
    expect(find).toHaveBeenCalledWith(
      HealthcareServices,
      expect.objectContaining({ serviceConceptId: { $in: ['proc'] } }),
      expect.anything(),
    );
  });

  it('varias afiliaciones del mismo médico en la misma sede dan un solo par', async () => {
    const { double } = em(
      [
        {
          practitionerProfileId: 'doc',
          practiceSiteId: 's1',
          healthcareServiceId: 'a',
        },
        {
          practitionerProfileId: 'doc',
          practiceSiteId: 's1',
          healthcareServiceId: 'b',
        },
      ],
      [{ id: 'a' }, { id: 'b' }],
    );

    const pairs = await repo.findActiveSites(double, ['doc'], ['s1'], ['proc']);

    expect(pairs).toHaveLength(1);
  });

  it.each([
    ['sin médicos', [], ['s1'], ['p']],
    ['sin sedes', ['doc'], [], ['p']],
    ['sin procedimientos', ['doc'], ['s1'], []],
  ])('%s no consulta', async (_name, docs, sites, procs) => {
    const { double, find } = em([]);

    await expect(
      repo.findActiveSites(double, docs, sites, procs),
    ).resolves.toEqual([]);
    expect(find).not.toHaveBeenCalled();
  });
});
