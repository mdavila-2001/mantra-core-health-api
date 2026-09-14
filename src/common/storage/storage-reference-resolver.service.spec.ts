import { jest } from '@jest/globals';
import type { FileStorageAdapter } from './file-storage.adapter';
import type { PhysicalObjectIdentity } from './physical-object-identity';
import { StorageReferenceResolver } from './storage-reference-resolver.service';
import {
  StorageReferenceRepository,
  type StorageReferenceSnapshot,
} from './storage-reference.repository';

const target: PhysicalObjectIdentity = {
  kind: 'KNOWN',
  protocolVersion: 1,
  bindingRevision: 'synthetic-v1',
  backendIdentity: 'synthetic',
  physicalContainer: 'bucket',
  exactObjectKey: 'a/hash',
  versionSelector: { kind: 'VERSION', providerVersionId: 'v1' },
};
const empty: StorageReferenceSnapshot = {
  rows: [],
  incomingReferences: 0,
  opaqueReferencesPresent: false,
};
const resolvePhysicalIdentity =
  jest.fn<(uri: string, version?: string) => PhysicalObjectIdentity>();
const resolver = new StorageReferenceResolver(
  new StorageReferenceRepository(),
  { resolvePhysicalIdentity } as unknown as FileStorageAdapter,
);
describe('reference resolution — no DB/storage I/O', () => {
  beforeEach(() => resolvePhysicalIdentity.mockReturnValue(target));
  it('requires a proven zero and treats every persisted version as live', () => {
    expect(resolver.evaluate(target, empty)).toEqual({
      state: 'ZERO',
      validReferenceCount: 0,
    });
    expect(
      resolver.evaluate(target, {
        ...empty,
        rows: [
          {
            id: 'synthetic',
            source: 'common.file_versions',
            storage_uri: 'synthetic',
          },
        ],
      }),
    ).toEqual({ state: 'REFERENCED', validReferenceCount: 1 });
  });
  it.each([
    'common.file_versions',
    'audio_assets.audio_assets',
    'object_storage.object_locations',
    'cross_store_consistency.deletion_targets',
  ])('does not exclude %s from shared object counting', (source) => {
    expect(
      resolver.evaluate(target, {
        ...empty,
        rows: [{ id: 'test', source, storage_uri: 'same' }],
      }).state,
    ).toBe('REFERENCED');
  });
  it('counts surviving FK/derivative/current-version references', () => {
    expect(
      resolver.evaluate(target, { ...empty, incomingReferences: 2 }),
    ).toEqual({ state: 'REFERENCED', validReferenceCount: 2 });
  });
  it('unknown external, multipart or physical scope blocks even with zero local rows', () => {
    expect(
      resolver.evaluate(target, { ...empty, opaqueReferencesPresent: true })
        .state,
    ).toBe('UNKNOWN');
    expect(
      resolver.evaluate({ kind: 'UNKNOWN', reasonCode: 'test' }, empty).state,
    ).toBe('UNKNOWN');
    resolvePhysicalIdentity.mockReturnValue({
      kind: 'UNKNOWN',
      reasonCode: 'encrypted',
    });
    expect(
      resolver.evaluate(target, {
        ...empty,
        rows: [{ id: 'test', source: 'external', storage_uri: 'opaque' }],
      }).state,
    ).toBe('UNKNOWN');
  });
  it('a positively distinct version is not the target; latest/unversioned is ambiguous', () => {
    resolvePhysicalIdentity.mockReturnValue({
      ...target,
      versionSelector: { kind: 'VERSION', providerVersionId: 'v2' },
    });
    const snapshot = {
      ...empty,
      rows: [{ id: 'test', source: 'versions', storage_uri: 'same-key' }],
    };
    expect(resolver.evaluate(target, snapshot).state).toBe('ZERO');
    resolvePhysicalIdentity.mockReturnValue({
      ...target,
      versionSelector: { kind: 'UNVERSIONED' },
    });
    expect(resolver.evaluate(target, snapshot).state).toBe('UNKNOWN');
  });
  it('does not silently discard metadata conflicts', () => {
    expect(
      resolver.evaluate(target, {
        ...empty,
        rows: [
          {
            id: 'test',
            source: 'versions',
            storage_uri: 'same',
            object_key: 'other',
          },
        ],
      }).state,
    ).toBe('UNKNOWN');
  });
});
