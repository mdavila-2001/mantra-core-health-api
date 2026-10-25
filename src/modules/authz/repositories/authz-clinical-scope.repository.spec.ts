import { jest } from '@jest/globals';
import { AuthzClinicalScopeRepository } from './authz-clinical-scope.repository';
import {
  Appointments,
  CareEpisodes,
  Encounters,
} from '../../clinical/entities';
import { TenantMemberships } from '../../directory/entities';
import { PersonAccountLinks } from '../../profiles/entities';
import { AppointmentBookings } from '../../scheduling/entities';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/** `EntityManager` en doble: `counts` dice cuántas filas hay por entidad. */
function build(
  counts: Map<unknown, number>,
  link: { userId: string } | null = null,
) {
  const em = {
    count: mockFn((entity: unknown) =>
      Promise.resolve(counts.get(entity) ?? 0),
    ),
    findOne: mockFn(() => Promise.resolve(link)),
  };
  return { em, repo: new AuthzClinicalScopeRepository() };
}

describe('AuthzClinicalScopeRepository.patientHasFootprintInTenant', () => {
  it.each([
    ['un encuentro', Encounters],
    ['un turno', Appointments],
    ['una reserva', AppointmentBookings],
    ['un episodio de atención', CareEpisodes],
  ])('reconoce %s del paciente en el tenant', async (_name, entity) => {
    const d = build(new Map([[entity, 1]]));
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-1', 't1'),
    ).resolves.toBe(true);
    expect(d.em.count).toHaveBeenCalledWith(entity, {
      patientProfileId: 'pat-1',
      tenantId: 't1',
    });
  });

  it('reconoce la membresía activa de la cuenta del paciente en el tenant', async () => {
    const d = build(new Map([[TenantMemberships, 1]]), { userId: 'u-pat' });
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-1', 't1'),
    ).resolves.toBe(true);
    expect(d.em.findOne).toHaveBeenCalledWith(
      PersonAccountLinks,
      expect.objectContaining({ personId: 'pat-1' }),
    );
    expect(d.em.count).toHaveBeenCalledWith(
      TenantMemberships,
      expect.objectContaining({ userId: 'u-pat', tenantId: 't1' }),
    );
  });

  it('sin ninguna huella en el tenant no hay vínculo', async () => {
    const d = build(new Map(), { userId: 'u-pat' });
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-B', 't1'),
    ).resolves.toBe(false);
  });

  it('sin cuenta vinculada y sin huella clínica no hay vínculo ni se consulta la membresía', async () => {
    const d = build(new Map(), null);
    await expect(
      d.repo.patientHasFootprintInTenant(d.em as any, 'pat-B', 't1'),
    ).resolves.toBe(false);
    expect(d.em.count).not.toHaveBeenCalledWith(
      TenantMemberships,
      expect.anything(),
    );
  });
});
