import { jest } from '@jest/globals';
import { SupportPatientSearchService } from './support-patient-search.service';
import { loadPatientStanding } from './support-patient-access';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);
const ANA = { id: 'user-ana', roles: ['SUPPORT_STAFF'] } as any;
const TENANT = 'tenant-1';
const row = (id: string) => ({
  profileId: id,
  displayName: `Paciente ${id}`,
  birthDate: '1990-05-17',
  nationalId: '1234556',
  phone: '+591 71234567',
});
const grantFacts = (actions: string[]): any[] => [
  {
    engagementId: 'eng-1',
    active: true,
    templateCode: 'SECRETARY',
    validFrom: new Date('2026-01-01T00:00:00Z'),
    acceptances: [],
    grants: [
      {
        grantId: 'g1',
        targetKind: 'ALL',
        expansionMode: 'DYNAMIC',
        active: true,
        actions,
      },
    ],
  },
];

function build(found: any[], filterSearchResults?: any) {
  const tx = { execute: mockFn().mockResolvedValue([]) };
  const em = { transactional: mockFn((cb: any) => cb(tx)) };
  const policy: any = {
    loadFacts: mockFn().mockResolvedValue(grantFacts(['schedule.create'])),
  };
  if (filterSearchResults) policy.filterSearchResults = filterSearchResults;
  const engagements = {
    findEngagements: mockFn().mockResolvedValue([{ assignment: { id: 'e' } }]),
  };
  const patients = {
    findExact: mockFn().mockResolvedValue(found),
    findRepresentatives: mockFn().mockResolvedValue(new Map()),
  };
  const probes = {
    hit: mockFn().mockResolvedValue({ allowed: true, firstOverflow: false }),
  };
  const audit = { record: mockFn().mockResolvedValue(undefined) };
  const logger = { setContext: mockFn(), info: mockFn(), warn: mockFn() };
  const service = new SupportPatientSearchService(
    em as any,
    policy,
    engagements as any,
    patients as any,
    audit as any,
    probes as any,
    logger as any,
  );
  return { service, policy, audit };
}

describe('SupportPatientSearchService: las condiciones `patients` filtran el resultado', () => {
  it('un paciente fuera del alcance es indistinguible de uno inexistente: sale con menos ítems y sin asiento de coincidencia', async () => {
    const filter = mockFn().mockResolvedValue(new Set(['pat-1']));
    const d = build([row('pat-1'), row('pat-2')], filter);
    const res = await d.service.search(
      { tenantId: TENANT, nationalId: '1234556' },
      ANA,
    );
    expect(res.items.map((i: any) => i.patientProfileId)).toEqual(['pat-1']);
    expect(filter).toHaveBeenCalledWith(
      'user-ana',
      TENANT,
      ['pat-1', 'pat-2'],
      expect.anything(),
    );
    const matches = d.audit.record.mock.calls.filter(
      ([, , e]: any[]) => e.action === 'SUPPORT_PATIENT_SEARCH_MATCH',
    );
    expect(matches.map(([, , e]: any[]) => e.entityId)).toEqual(['pat-1']);
  });

  it('una política sin el filtro (doble antiguo) devuelve lo hallado como siempre', async () => {
    const d = build([row('pat-1')]);
    expect(
      (await d.service.search({ tenantId: TENANT, nationalId: '1234556' }, ANA))
        .count,
    ).toBe(1);
  });
});

describe('loadPatientStanding: las reglas de la organización también cierran la búsqueda y el alta', () => {
  const engagements = {
    findEngagements: mockFn().mockResolvedValue([{ assignment: { id: 'e' } }]),
  };
  const standing = (deniedBy: (atom: string) => boolean) => {
    const policy = {
      loadFacts: mockFn().mockResolvedValue(grantFacts(['patient.register'])),
      deniedByOrgRule: mockFn(
        async (_tx: any, _t: string, _f: any, atom: string) => deniedBy(atom),
      ),
    };
    return loadPatientStanding(
      policy as any,
      engagements as any,
      {} as any,
      'user-ana',
      TENANT,
      new Date('2026-11-03T14:30:00Z'),
    );
  };

  it('G-02: DENY_PERMISSION de patients.profile.register cierra el alta pero no la búsqueda', async () => {
    expect(
      await standing((atom) => atom === 'patients.profile.register'),
    ).toMatchObject({ linked: true, canSearch: true, canRegister: false });
  });
  it('sin regla todo sigue como siempre', async () => {
    expect(await standing(() => false)).toMatchObject({
      canSearch: true,
      canRegister: true,
    });
  });
  it('una política sin la comprobación de reglas (doble antiguo) no cambia nada', async () => {
    const policy = {
      loadFacts: mockFn().mockResolvedValue(grantFacts(['patient.register'])),
    };
    expect(
      await loadPatientStanding(
        policy as any,
        engagements as any,
        {} as any,
        'u',
        TENANT,
        new Date(),
      ),
    ).toMatchObject({ canSearch: true, canRegister: true });
  });
});
