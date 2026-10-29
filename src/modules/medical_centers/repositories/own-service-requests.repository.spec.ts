import { jest } from '@jest/globals';
import { PreconditionFailedException } from '../../../common';
import { ServiceRequests } from '../../clinical/entities';
import { OwnServiceRequestsRepository } from './own-service-requests.repository';

/**
 * Ejecuta la operación mock fn.
 *
 * @param impl - Valor de impl requerido por la operación.
 * @returns Resultado de mock fn conforme al contrato `any`.
 */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

/**
 * Construye el repositorio con identidad controlada.
 *
 * @param link - Vínculo cuenta↔persona.
 * @param patient - Perfil de paciente.
 * @returns El repositorio y sus dobles.
 */
function build(
  link: any = { personId: 'per' },
  patient: any = { profileId: 'pat' },
) {
  const accountLinks = { findActiveByUser: mockFn().mockResolvedValue(link) };
  const patientProfiles = { findById: mockFn().mockResolvedValue(patient) };
  return {
    repo: new OwnServiceRequestsRepository(
      accountLinks as any,
      patientProfiles as any,
    ),
    accountLinks,
    patientProfiles,
  };
}

describe('OwnServiceRequestsRepository', () => {
  const actor = { id: 'u1' } as any;
  const em = {} as any;

  it('resuelve al titular por el vínculo cuenta↔persona, no por el token', async () => {
    const { repo, accountLinks, patientProfiles } = build();

    await expect(repo.resolveOwnPatientProfileId(em, actor)).resolves.toBe(
      'pat',
    );
    expect(accountLinks.findActiveByUser).toHaveBeenCalledWith(em, 'u1');
    expect(patientProfiles.findById).toHaveBeenCalledWith(em, 'per');
  });

  it('una cuenta sin persona vinculada da 422', async () => {
    const { repo } = build(null);

    await expect(
      repo.resolveOwnPatientProfileId(em, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('una persona sin perfil de paciente da 422', async () => {
    const { repo } = build({ personId: 'per' }, null);

    await expect(
      repo.resolveOwnPatientProfileId(em, actor),
    ).rejects.toBeInstanceOf(PreconditionFailedException);
  });

  it('findOwned filtra por el titular en la misma consulta y proyecta lo que la búsqueda necesita', async () => {
    const { repo } = build();
    const find = mockFn().mockResolvedValue([
      {
        id: 'o1',
        codeConceptId: 'proc',
        requesterProfileId: 'doc',
        suggestedPracticeSiteId: undefined,
      },
    ]);

    const rows = await repo.findOwned({ find } as any, 'pat', ['o1', 'o2']);

    expect(find).toHaveBeenCalledWith(ServiceRequests, {
      id: { $in: ['o1', 'o2'] },
      patientProfileId: 'pat',
    });
    expect(rows).toEqual([
      {
        id: 'o1',
        codeConceptId: 'proc',
        requesterProfileId: 'doc',
        suggestedPracticeSiteId: null,
      },
    ]);
  });

  it('findOwned con la lista vacía no consulta', async () => {
    const { repo } = build();
    const find = mockFn();

    await expect(repo.findOwned({ find } as any, 'pat', [])).resolves.toEqual(
      [],
    );
    expect(find).not.toHaveBeenCalled();
  });
});
