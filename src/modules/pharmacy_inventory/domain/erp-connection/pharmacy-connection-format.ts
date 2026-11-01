import { EXTERNAL_SYSTEM_CONFIG_KIND } from '../sync/external-system';

/** Identity is independent of completeness: malformed data never changes owner. */
export function pharmacyConnectionFormat(
  value: unknown,
): 'ERP' | 'EXTERNAL' | 'UNSUPPORTED' {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return 'UNSUPPORTED';
  const raw = value as Record<string, unknown>;
  if (raw.kind === EXTERNAL_SYSTEM_CONFIG_KIND)
    return raw.version === undefined ? 'EXTERNAL' : 'UNSUPPORTED';
  return raw.kind === undefined && raw.version === 1 ? 'ERP' : 'UNSUPPORTED';
}
