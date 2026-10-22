/** Physical equality is a verified tuple, never a digest, tenant or DB file id. */
export type PhysicalObjectIdentity =
  | {
      kind: 'KNOWN';
      protocolVersion: 1;
      bindingRevision: string;
      backendIdentity: string;
      physicalContainer: string;
      exactObjectKey: string;
      versionSelector:
        | { kind: 'UNVERSIONED' }
        | { kind: 'VERSION'; providerVersionId: string };
    }
  | {
      kind: 'UNKNOWN';
      reasonCode: string;
      /** Omitted means that no namespace can safely be excluded. */
      affectedNamespace?: string;
    };

export type KnownPhysicalObjectIdentity = Extract<
  PhysicalObjectIdentity,
  { kind: 'KNOWN' }
>;

/** A provider has not emitted a version yet. This is a key reservation, NOT a purge identity. */
export type StorageReservationIdentity =
  | KnownPhysicalObjectIdentity
  | (Omit<KnownPhysicalObjectIdentity, 'versionSelector'> & {
      versionSelector: { kind: 'PENDING_VERSION' };
    });

export function isStorageReservationIdentity(
  value: unknown,
): value is StorageReservationIdentity {
  if (isKnownPhysicalIdentity(value)) return true;
  if (!value || typeof value !== 'object') return false;
  const candidate = value as StorageReservationIdentity;
  return (
    candidate.versionSelector?.kind === 'PENDING_VERSION' &&
    isKnownPhysicalIdentity({
      ...candidate,
      versionSelector: {
        kind: 'VERSION',
        providerVersionId: 'pending-validation-only',
      },
    })
  );
}

export function reservationKey(identity: StorageReservationIdentity): string {
  return JSON.stringify([
    physicalContentionKey(identity),
    identity.versionSelector.kind,
    identity.versionSelector.kind === 'VERSION'
      ? identity.versionSelector.providerVersionId
      : null,
  ]);
}

export function reservationAcceptsReceipt(
  target: StorageReservationIdentity,
  receipt: KnownPhysicalObjectIdentity,
): boolean {
  return (
    isKnownPhysicalIdentity(receipt) &&
    physicalContentionKey(target) === physicalContentionKey(receipt) &&
    target.bindingRevision === receipt.bindingRevision &&
    (target.versionSelector.kind === 'PENDING_VERSION'
      ? receipt.versionSelector.kind === 'VERSION'
      : reservationKey(target) === reservationKey(receipt))
  );
}

export function bindReservationIdentity(
  binding: PhysicalStorageBinding | undefined,
  adapter: 'local' | 's3',
  location: string,
  key: string,
):
  | StorageReservationIdentity
  | Extract<PhysicalObjectIdentity, { kind: 'UNKNOWN' }> {
  const identity = bindPhysicalIdentity(
    binding,
    adapter,
    location,
    key,
    binding?.versioning === 'VERSIONED' ? 'pending-validation-only' : undefined,
  );
  if (identity.kind === 'UNKNOWN') return identity;
  return binding?.versioning === 'VERSIONED'
    ? { ...identity, versionSelector: { kind: 'PENDING_VERSION' } }
    : identity;
}

/** Deployment-reviewed proof; credentials and tenant names are not authorities. */
export interface PhysicalStorageBinding {
  schemaVersion: 1;
  revision: string;
  adapter: 'local' | 's3';
  backendIdentity: string;
  physicalContainer: string;
  configuredLocation: string;
  versioning: 'UNVERSIONED' | 'VERSIONED';
  authorityVerified: boolean;
  aliasesVerified: boolean;
  producerCoverageVerified: boolean;
  legacyOperationsSettled: boolean;
  /** Local-only: physical mount, links and exclusive protocol ownership verified. */
  localFilesystemVerified?: boolean;
}

/** Validate again when reading persisted JSON, not only at the TS boundary. */
export function isKnownPhysicalIdentity(
  value: unknown,
): value is KnownPhysicalObjectIdentity {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<KnownPhysicalObjectIdentity>;
  return (
    v.kind === 'KNOWN' &&
    v.protocolVersion === 1 &&
    [
      v.bindingRevision,
      v.backendIdentity,
      v.physicalContainer,
      v.exactObjectKey,
    ].every((part) => typeof part === 'string' && part.length > 0) &&
    (v.versionSelector?.kind === 'UNVERSIONED' ||
      (v.versionSelector?.kind === 'VERSION' &&
        typeof v.versionSelector.providerVersionId === 'string' &&
        v.versionSelector.providerVersionId.length > 0 &&
        v.versionSelector.providerVersionId !== 'null'))
  );
}

/** Called by the owning adapter after strict, non-lossy URI parsing. */
export function bindPhysicalIdentity(
  binding: PhysicalStorageBinding | undefined,
  adapter: 'local' | 's3',
  configuredLocation: string,
  exactObjectKey: string,
  providerVersionId?: string,
): PhysicalObjectIdentity {
  if (
    !binding ||
    binding.schemaVersion !== 1 ||
    !binding.revision ||
    binding.adapter !== adapter ||
    !binding.backendIdentity ||
    !binding.physicalContainer ||
    binding.configuredLocation !== configuredLocation ||
    binding.authorityVerified !== true ||
    binding.aliasesVerified !== true
  )
    return { kind: 'UNKNOWN', reasonCode: 'BACKEND_UNBOUND' };
  if (adapter === 'local' && binding.localFilesystemVerified !== true)
    return { kind: 'UNKNOWN', reasonCode: 'LOCAL_VOLUME_UNPROVEN' };
  if (
    binding.producerCoverageVerified !== true ||
    binding.legacyOperationsSettled !== true
  )
    return { kind: 'UNKNOWN', reasonCode: 'COVERAGE_UNPROVEN' };
  const versionSelector =
    binding.versioning === 'UNVERSIONED' && !providerVersionId
      ? { kind: 'UNVERSIONED' as const }
      : binding.versioning === 'VERSIONED' &&
          providerVersionId &&
          providerVersionId !== 'null'
        ? { kind: 'VERSION' as const, providerVersionId }
        : undefined;
  if (!versionSelector || !exactObjectKey)
    return { kind: 'UNKNOWN', reasonCode: 'VERSION_UNRESOLVED' };
  return {
    kind: 'KNOWN',
    protocolVersion: 1,
    bindingRevision: binding.revision,
    backendIdentity: binding.backendIdentity,
    physicalContainer: binding.physicalContainer,
    exactObjectKey,
    versionSelector,
  };
}

/** Namespace-wide exclusion intentionally does not partition by tenant/prefix. */
export function physicalNamespace(
  identity: StorageReservationIdentity,
): string {
  return JSON.stringify([
    'storage-lifecycle:v1',
    identity.backendIdentity,
    identity.physicalContainer,
  ]);
}

/** A pending PUT protects all versions of a key, including a future version. */
export function physicalContentionKey(
  identity: StorageReservationIdentity,
): string {
  return JSON.stringify([physicalNamespace(identity), identity.exactObjectKey]);
}

export function physicalObjectKey(
  identity: KnownPhysicalObjectIdentity,
): string {
  const version = identity.versionSelector;
  return JSON.stringify([
    physicalContentionKey(identity),
    version.kind,
    version.kind === 'VERSION' ? version.providerVersionId : null,
  ]);
}

/** Binding revisions govern provenance, not physical equality. */
export function samePhysicalObject(
  left: PhysicalObjectIdentity,
  right: PhysicalObjectIdentity,
): boolean {
  return (
    left.kind === 'KNOWN' &&
    right.kind === 'KNOWN' &&
    physicalObjectKey(left) === physicalObjectKey(right)
  );
}
