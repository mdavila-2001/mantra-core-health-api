import { jest } from '@jest/globals';
import { loadPatientStanding } from './support-patient-access';

/** Mock laxo: evita el tipado estricto `Mock<never>` del runtime de jest. */
const mockFn = (impl?: any): any => (jest.fn as any)(impl);

const NOW = new Date('2026-11-03T14:30:00Z');
const tx: any = {};
const live = (atom: string): any => ({
  engagementId: 'e1',
  active: true,
  validFrom: new Date('2026-01-01'),
  templateCode: 'FRONT_DESK',
  grants: [
    {
      grantId: 'g1',
      targetKind: 'ALL',
      active: true,
      effect: 'ALLOW',
      actions: [atom],
    },
  ],
  acceptances: [],
});

function build(opts: { denied: boolean; atom: string }) {
  const policy: any = {
    loadFacts: mockFn().mockResolvedValue([live(opts.atom)]),
    deniedByOrgRule: mockFn().mockResolvedValue(opts.denied),
    recordOrgRuleDenial: mockFn().mockResolvedValue(undefined),
  };
  const engagements: any = {
    findEngagements: mockFn().mockResolvedValue([{ assignment: { id: 'e1' } }]),
  };
  return { policy, engagements };
}

describe('loadPatientStanding: asiento de la denegación por regla de la organización (caso 16)', () => {
  it('con intención de registrar y la regla DENY_PERMISSION cerrando el alta, deja el asiento ORG_RULE_DENY de ese átomo', async () => {
    const { policy, engagements } = build({
      denied: true,
      atom: 'patients.profile.register',
    });
    const standing = await loadPatientStanding(
      policy,
      engagements,
      tx,
      'lucia',
      'org-1',
      NOW,
      'register',
    );
    expect(standing.canRegister).toBe(false);
    expect(policy.recordOrgRuleDenial).toHaveBeenCalledWith(
      tx,
      'org-1',
      'lucia',
      'patients.profile.register',
    );
  });

  it('con intención de buscar, el asiento es el de la búsqueda', async () => {
    const { policy, engagements } = build({
      denied: true,
      atom: 'patients.search.exact',
    });
    await loadPatientStanding(
      policy,
      engagements,
      tx,
      'lucia',
      'org-1',
      NOW,
      'search',
    );
    expect(policy.recordOrgRuleDenial).toHaveBeenCalledWith(
      tx,
      'org-1',
      'lucia',
      'patients.search.exact',
    );
  });

  it('sin intención (lectura de contexto) no deja asiento', async () => {
    const { policy, engagements } = build({
      denied: true,
      atom: 'patients.profile.register',
    });
    await loadPatientStanding(policy, engagements, tx, 'lucia', 'org-1', NOW);
    expect(policy.recordOrgRuleDenial).not.toHaveBeenCalled();
  });

  it('si ninguna regla de la organización lo cierra, no deja asiento', async () => {
    const { policy, engagements } = build({
      denied: false,
      atom: 'patients.profile.register',
    });
    const standing = await loadPatientStanding(
      policy,
      engagements,
      tx,
      'lucia',
      'org-1',
      NOW,
      'register',
    );
    expect(standing.canRegister).toBe(true);
    expect(policy.recordOrgRuleDenial).not.toHaveBeenCalled();
  });
});
