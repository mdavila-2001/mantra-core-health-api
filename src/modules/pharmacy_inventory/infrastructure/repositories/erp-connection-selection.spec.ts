import {
  ErpConnectionRepository,
  type ErpConnectionRecord,
} from './erp-connection.repository';
import {
  Pharmacies,
  PharmacyIntegrationConnections,
} from '../../../pharmacy/entities';
import {
  ExternalProviders,
  ProviderConnections,
  ProviderCredentials,
} from '../../../integrations/entities';

function fixture() {
  const a = {
    id: 'link-a',
    pharmacyId: 'ph',
    connectionId: 'conn-a',
    createdAt: new Date('2026-01-01'),
  };
  const b = {
    id: 'link-b',
    pharmacyId: 'ph',
    connectionId: 'conn-b',
    createdAt: new Date('2026-02-01'),
  };
  const links = [b, a];
  const connections = new Map([
    [
      'conn-a',
      {
        id: 'conn-a',
        tenantId: 'tenant-a',
        providerId: 'provider-a',
        credentialId: 'credential-a',
        configJson: {
          version: 1,
          baseUrl: 'https://synthetic.invalid',
          pharmacyCode: 'SYN',
        },
      },
    ],
    [
      'conn-b',
      {
        id: 'conn-b',
        tenantId: 'tenant-a',
        providerId: 'provider-b',
        credentialId: 'credential-b',
        configJson: {
          kind: 'PHARMACY_EXTERNAL_SYSTEM',
          format: 'ALOVIDA_STANDARD',
          baseUrl: 'https://synthetic.invalid',
          externalPharmacyCode: 'SYN',
        },
      },
    ],
  ]);
  const credentials = new Map([
    [
      'credential-a',
      { id: 'credential-a', connectionId: 'conn-a', secretRef: 'synthetic-a' },
    ],
    [
      'credential-b',
      { id: 'credential-b', connectionId: 'conn-b', secretRef: 'synthetic-b' },
    ],
  ]);
  const em = {
    find: async (_entity: unknown, filter: { id?: string }) =>
      links.filter((l) => !filter.id || l.id === filter.id),
    findOne: async (
      entity: unknown,
      filter: { id?: string; tenantId?: string; connectionId?: string },
    ) => {
      if (entity === Pharmacies) return { id: 'ph', tenantId: 'tenant-a' };
      if (entity === PharmacyIntegrationConnections)
        return links.find((l) => !filter.id || l.id === filter.id) ?? null;
      if (entity === ProviderConnections) {
        const row = connections.get(filter.id!);
        return row && (!filter.tenantId || row.tenantId === filter.tenantId)
          ? row
          : null;
      }
      if (entity === ExternalProviders) return { code: 'ALOVIDA_STANDARD' };
      if (entity === ProviderCredentials) {
        const row = credentials.get(filter.id!);
        return row &&
          (!filter.connectionId || row.connectionId === filter.connectionId)
          ? row
          : null;
      }
      throw new Error('Unexpected entity');
    },
  };
  const repo = new ErpConnectionRepository();
  const find = (options: { linkId?: string; erpOnly?: boolean }) =>
    Reflect.apply(repo.findForPharmacy.bind(repo), repo, [
      em,
      'ph',
      options,
    ]) as Promise<ErpConnectionRecord | null>;
  return { find, links, connections, credentials };
}

describe('ERP connection selection across persisted formats', () => {
  it('selects the requested older ERP link instead of a newer external connection', async () => {
    const d = fixture();
    expect((await d.find({ linkId: 'link-a' }))?.link.id).toBe('link-a');
  });
  it('selects the newest ERP independently of newer external rows', async () => {
    const d = fixture();
    expect((await d.find({ erpOnly: true }))?.link.id).toBe('link-a');
  });
  it('refuses a provider connection belonging to another tenant', async () => {
    const d = fixture();
    d.connections.get('conn-a')!.tenantId = 'tenant-b';
    expect(await d.find({ linkId: 'link-a' })).toBeNull();
  });
  it('does not load a credential assigned to another connection', async () => {
    const d = fixture();
    d.credentials.get('credential-a')!.connectionId = 'conn-b';
    expect((await d.find({ linkId: 'link-a' }))?.credential).toBeNull();
  });
});
