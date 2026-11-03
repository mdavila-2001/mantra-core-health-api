import { jest } from '@jest/globals';
import { GroupsRepository } from './groups.repository';
import { COMM } from '../community.concepts';
import { CONCEPTS } from '../../../common';
import { Tenants, TenantMemberships } from '../../directory/entities';
import { DIR } from '../../directory/directory.concepts';
import { Encounters } from '../../clinical/entities';
import { CLIN } from '../../clinical/clinical.concepts';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

describe('GroupsRepository · público autorizado (API#837)', () => {
  const repo = new GroupsRepository();

  describe('searchPage', () => {
    it('sin públicos ocultos sólo excluye los secretos, como antes', async () => {
      const em = { find: mockFn().mockResolvedValue([]) };
      await repo.searchPage(
        em as any,
        't1',
        COMM.GROUP_VISIBILITY_SECRET,
        undefined,
        11,
      );
      expect(em.find.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          tenantId: 't1',
          visibilityConceptId: { $ne: COMM.GROUP_VISIBILITY_SECRET },
        }),
      );
    });

    it('con públicos ocultos los excluye junto con los secretos', async () => {
      const em = { find: mockFn().mockResolvedValue([]) };
      await repo.searchPage(
        em as any,
        't1',
        COMM.GROUP_VISIBILITY_SECRET,
        undefined,
        11,
        {
          hiddenVisibilityConceptIds: [COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS],
        },
      );
      expect(em.find.mock.calls[0][1]).toEqual(
        expect.objectContaining({
          visibilityConceptId: {
            $nin: [
              COMM.GROUP_VISIBILITY_SECRET,
              COMM.GROUP_VISIBILITY_VERIFIED_DOCTORS,
            ],
          },
        }),
      );
    });
  });

  it('el tipo de organización sale de directory.tenants', async () => {
    const em = {
      findOne: mockFn().mockResolvedValue({
        tenantTypeConceptId: CONCEPTS.TENANT_TYPE_PAYER,
      }),
    };
    await expect(repo.findTenantTypeConceptId(em as any, 't1')).resolves.toBe(
      CONCEPTS.TENANT_TYPE_PAYER,
    );
    expect(em.findOne).toHaveBeenCalledWith(Tenants, { id: 't1' });

    em.findOne.mockResolvedValue(null);
    await expect(
      repo.findTenantTypeConceptId(em as any, 'nope'),
    ).resolves.toBeNull();
  });

  it('el personal es la membresía activa del usuario en la organización', async () => {
    const em = { count: mockFn().mockResolvedValue(1) };
    await expect(
      repo.isActiveTenantMember(em as any, 'u1', 't1'),
    ).resolves.toBe(true);
    expect(em.count).toHaveBeenCalledWith(TenantMemberships, {
      userId: 'u1',
      tenantId: 't1',
      statusConceptId: DIR.MEMBERSHIP_ACTIVE,
    });

    em.count.mockResolvedValue(0);
    await expect(
      repo.isActiveTenantMember(em as any, 'u1', 't1'),
    ).resolves.toBe(false);
  });

  it('paciente atendido es una atención terminada en la organización', async () => {
    const em = { count: mockFn().mockResolvedValue(2) };
    await expect(
      repo.hasFinishedEncounter(em as any, 'pp1', 't1'),
    ).resolves.toBe(true);
    expect(em.count).toHaveBeenCalledWith(Encounters, {
      patientProfileId: 'pp1',
      tenantId: 't1',
      statusConceptId: CLIN.ENCOUNTER_FINISHED,
    });

    em.count.mockResolvedValue(0);
    await expect(
      repo.hasFinishedEncounter(em as any, 'pp1', 't1'),
    ).resolves.toBe(false);
  });
});
