import { jest } from '@jest/globals';
import { AuthzMeService } from './authz-me.service';
import { CONCEPTS } from '../../../common';
import { AUTHZ } from '../authz.concepts';

const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const ACTOR = { id: 'u1', roles: ['PATIENT'] } as any;
const PACIENTE = 'p1';

/**
 * «Quién ve mi historia» (BR-20): lista con estado efectivo y revoca sólo lo
 * del propio paciente; lo ajeno es 404.
 */
function build() {
  const em: any = {
    fork: () => em,
    find: mockFn().mockResolvedValue([
      { id: 'doc1', displayName: 'Dra. Ana Pérez' },
    ]),
  };
  const accountLinksRepo = {
    findActiveByUser: mockFn(async (_em: any, userId: string) =>
      userId === 'u1' ? { personId: 'per' } : { personId: 'doc1' },
    ),
  };
  const patientProfilesRepo = {
    findById: mockFn().mockResolvedValue({ profileId: PACIENTE }),
  };
  const futuro = new Date(Date.now() + 86_400_000);
  const pasado = new Date(Date.now() - 86_400_000);
  const careRepo = {
    findAllByPatient: mockFn().mockResolvedValue([
      {
        id: 'r1',
        tenantId: 't1',
        practitionerProfileId: 'doc1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: pasado,
        validTo: futuro,
      },
      {
        id: 'r2',
        tenantId: 't1',
        practitionerProfileId: 'doc1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: pasado,
        validTo: pasado,
      },
    ]),
    findById: mockFn(),
  };
  const grantsRepo = {
    findAllByPatient: mockFn().mockResolvedValue([
      {
        id: 'g1',
        tenantId: 't1',
        grantedUserId: 'u2',
        reasonConceptId: AUTHZ.PURPOSE_EMERGENCY,
        accessLevelConceptId: 'lvl',
        stateConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: pasado,
        validTo: futuro,
      },
    ]),
    findById: mockFn(),
  };
  const careService = {
    revokeCareRelationship: mockFn().mockResolvedValue({
      ok: true,
      affected: 1,
    }),
  };
  const clinicalService = {
    revokeClinicalAccess: mockFn().mockResolvedValue({ ok: true, affected: 1 }),
  };
  const logger = { setContext: mockFn(), warn: mockFn() };
  const service = new AuthzMeService(
    em,
    accountLinksRepo as any,
    patientProfilesRepo as any,
    careRepo as any,
    grantsRepo as any,
    careService as any,
    clinicalService as any,
    logger as any,
  );
  return { service, careRepo, grantsRepo, careService, clinicalService };
}

describe('AuthzMeService (BR-20)', () => {
  it('lista con nombre, estado efectivo y marca de emergencia', async () => {
    const d = build();
    const out = await d.service.listMyAccess(ACTOR);
    expect(d.careRepo.findAllByPatient.mock.calls[0][1]).toBe(PACIENTE);
    expect(out.careRelationships.map((r) => [r.id, r.state])).toEqual([
      ['r1', 'ACTIVE'],
      ['r2', 'EXPIRED'],
    ]);
    expect(out.careRelationships[0].practitionerName).toBe('Dra. Ana Pérez');
    expect(out.grants[0]).toMatchObject({
      id: 'g1',
      isEmergency: true,
      state: 'ACTIVE',
      grantedName: 'Dra. Ana Pérez',
    });
  });

  it('una relación sin fin (valid_to null de la base) figura ACTIVE y no EXPIRED', async () => {
    const d = build();
    d.careRepo.findAllByPatient.mockResolvedValue([
      {
        id: 'r-abierta',
        tenantId: 't1',
        practitionerProfileId: 'doc1',
        statusConceptId: CONCEPTS.STATE_ACTIVE,
        validFrom: new Date(Date.now() - 86_400_000),
        validTo: null,
        purposeConceptId: null,
      },
    ]);
    const out = await d.service.listMyAccess(ACTOR);
    expect(out.careRelationships[0]?.state).toBe('ACTIVE');
    expect(out.careRelationships[0]?.validTo).toBeUndefined();
  });

  it('revoca la relación propia con el caso de uso de siempre', async () => {
    const d = build();
    d.careRepo.findById.mockResolvedValue({
      id: 'r1',
      patientProfileId: PACIENTE,
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    await d.service.revokeMyCareRelationship(ACTOR, 'r1');
    expect(d.careService.revokeCareRelationship).toHaveBeenCalledWith(
      'r1',
      ACTOR,
    );
  });

  it('la relación de otro paciente es 404 y no se revoca', async () => {
    const d = build();
    d.careRepo.findById.mockResolvedValue({
      id: 'r9',
      patientProfileId: 'otro',
      statusConceptId: CONCEPTS.STATE_ACTIVE,
    });
    await expect(
      d.service.revokeMyCareRelationship(ACTOR, 'r9'),
    ).rejects.toMatchObject({ status: 404 });
    expect(d.careService.revokeCareRelationship).not.toHaveBeenCalled();
  });

  it('una solicitud pendiente no se revoca: se responde (422)', async () => {
    const d = build();
    d.careRepo.findById.mockResolvedValue({
      id: 'r3',
      patientProfileId: PACIENTE,
      statusConceptId: CONCEPTS.STATE_PENDING,
    });
    await expect(
      d.service.revokeMyCareRelationship(ACTOR, 'r3'),
    ).rejects.toMatchObject({ status: 422 });
  });

  it('revoca el acceso propio y rechaza el ajeno con 404', async () => {
    const d = build();
    d.grantsRepo.findById.mockResolvedValue({
      id: 'g1',
      patientProfileId: PACIENTE,
    });
    await d.service.revokeMyClinicalGrant(ACTOR, 'g1');
    expect(d.clinicalService.revokeClinicalAccess).toHaveBeenCalledWith(
      'g1',
      ACTOR,
    );

    d.grantsRepo.findById.mockResolvedValue({
      id: 'g2',
      patientProfileId: 'otro',
    });
    await expect(
      d.service.revokeMyClinicalGrant(ACTOR, 'g2'),
    ).rejects.toMatchObject({
      status: 404,
    });
    expect(d.clinicalService.revokeClinicalAccess).toHaveBeenCalledTimes(1);
  });
});
