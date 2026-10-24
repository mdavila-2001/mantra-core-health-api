import {
  bindPhysicalIdentity,
  physicalContentionKey,
  physicalNamespace,
  samePhysicalObject,
  type KnownPhysicalObjectIdentity,
  type PhysicalStorageBinding,
} from './physical-object-identity';

const binding: PhysicalStorageBinding = {
  schemaVersion: 1,
  revision: 'synthetic-binding-v1',
  adapter: 's3',
  backendIdentity: 'synthetic-authority',
  physicalContainer: 'synthetic-bucket',
  configuredLocation: 'synthetic-location',
  versioning: 'UNVERSIONED',
  authorityVerified: true,
  aliasesVerified: true,
  producerCoverageVerified: true,
  legacyOperationsSettled: true,
};
function known(key = 'a/b'): KnownPhysicalObjectIdentity {
  return bindPhysicalIdentity(
    binding,
    's3',
    'synthetic-location',
    key,
  ) as KnownPhysicalObjectIdentity;
}
describe('physical identity (pure synthetic tuples, no storage I/O)', () => {
  it('does not invent a backend from a hash or URI', () => {
    expect(
      bindPhysicalIdentity(undefined, 's3', 'synthetic-location', 'hash').kind,
    ).toBe('UNKNOWN');
  });
  it.each([
    'authorityVerified',
    'aliasesVerified',
    'producerCoverageVerified',
    'legacyOperationsSettled',
  ] as const)('requires %s', (field) => {
    expect(
      bindPhysicalIdentity(
        { ...binding, [field]: false },
        's3',
        'synthetic-location',
        'key',
      ).kind,
    ).toBe('UNKNOWN');
  });
  it('rejects unverified physical mount identity', () => {
    expect(
      bindPhysicalIdentity(
        { ...binding, adapter: 'local' },
        'local',
        'synthetic-location',
        'key',
      ).kind,
    ).toBe('UNKNOWN');
  });
  it('requires exact provider version in a versioned bucket', () => {
    const versioned = { ...binding, versioning: 'VERSIONED' as const };
    for (const version of [undefined, '', 'null'])
      expect(
        bindPhysicalIdentity(
          versioned,
          's3',
          'synthetic-location',
          'key',
          version,
        ).kind,
      ).toBe('UNKNOWN');
    expect(
      bindPhysicalIdentity(versioned, 's3', 'synthetic-location', 'key', 'v1')
        .kind,
    ).toBe('KNOWN');
  });
  it('does not collapse key case, escapes, slashes, containers or authorities', () => {
    for (const key of ['A/b', 'a//b', 'a/%62', 'a/./b'])
      expect(samePhysicalObject(known(), known(key))).toBe(false);
    expect(
      samePhysicalObject(known(), { ...known(), physicalContainer: 'other' }),
    ).toBe(false);
    expect(
      samePhysicalObject(known(), { ...known(), backendIdentity: 'other' }),
    ).toBe(false);
  });
  it('versions compete for the same key and prefixes share namespace exclusion', () => {
    const v1 = {
      ...known(),
      versionSelector: { kind: 'VERSION' as const, providerVersionId: 'v1' },
    };
    const v2 = {
      ...v1,
      versionSelector: { kind: 'VERSION' as const, providerVersionId: 'v2' },
    };
    expect(samePhysicalObject(v1, v2)).toBe(false);
    expect(physicalContentionKey(v1)).toBe(physicalContentionKey(v2));
    expect(physicalNamespace(known('tenant-a/key'))).toBe(
      physicalNamespace(known('tenant-b/key')),
    );
  });
  it('binding revisions do not create another object', () => {
    expect(
      samePhysicalObject(known(), { ...known(), bindingRevision: 'v2' }),
    ).toBe(true);
  });
  it('unknown never compares equal to unknown', () => {
    expect(
      samePhysicalObject(
        { kind: 'UNKNOWN', reasonCode: 'test' },
        { kind: 'UNKNOWN', reasonCode: 'test' },
      ),
    ).toBe(false);
  });
});
