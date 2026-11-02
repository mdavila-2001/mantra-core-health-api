import { deterministicId } from '../../constants/concepts';
import { type TenantTypeCode } from '../../../modules/directory/directory.concepts';
import { BO_MUNICIPALITIES } from '../bo-geography.catalog';
import facilitiesDataset from '../data/bolivia/health-facilities.dataset.json';

/** Single raw facility entry as extracted from the dataset. */
export interface PadronFacility {
  readonly code: string;
  readonly nombre: string;
  readonly razonSocial: string | null;
  readonly nit: string | null;
  readonly direccion: string | null;
  readonly telefonos: readonly string[];
  readonly departamento: string;
  readonly municipio: string;
  readonly tipo: string;
  readonly naturaleza: string;
  readonly lat: number | null;
  readonly lng: number | null;
  readonly precision: string | null;
  readonly source_file: string;
  readonly source_row: number;
}

/** Configuration for how each facility category is registered. */
export interface FacilityKind {
  /** Target platform organization type. */
  readonly tenantType: TenantTypeCode;
  /** Presentation label in public directory profile. */
  readonly label: string;
  /** Whether the establishment requires regulatory documents (e.g. pharmacies, labs). */
  readonly needsPapers: boolean;
}

/** Registry mapping of dataset types to platform organization kinds. */
export const KIND_BY_TIPO: Readonly<Record<string, FacilityKind>> = {
  CLINICA_PRIVADA: {
    tenantType: 'CLINIC',
    label: 'Clínica privada',
    needsPapers: false,
  },
  HOSPITAL: { tenantType: 'HOSPITAL', label: 'Hospital', needsPapers: false },
  CAJA_SALUD: {
    tenantType: 'HOSPITAL',
    label: 'Establecimiento de la seguridad social',
    needsPapers: false,
  },
  CENTRO_SALUD: {
    tenantType: 'HEALTH_OTHER',
    label: 'Centro de salud',
    needsPapers: false,
  },
  LABORATORIO: {
    tenantType: 'DIAGNOSTIC_CENTER',
    label: 'Laboratorio',
    needsPapers: true,
  },
  IMAGEN: {
    tenantType: 'DIAGNOSTIC_CENTER',
    label: 'Centro de diagnóstico por imágenes',
    needsPapers: false,
  },
  FARMACIA: { tenantType: 'PHARMACY', label: 'Farmacia', needsPapers: true },
};

/** Prefix for legacy tenant codes loaded prior to this seed. */
export const LEGACY_CODE_PREFIX = 'CARGA_';

/** Nature identifying insurer network doctor offices (not standalone organizations). */
export const NETWORK_OFFICE = 'RED_ASEGURADORA';

/** Execution result metrics for the facility seed step. */
export interface PadronOrganizationsResult {
  /** Newly provisioned organizations. */
  created: number;
  /** Organizations that were already present. */
  existing: number;
  /** Legacy CARGA_* organizations adopted into the canonical dataset. */
  adopted: number;
  /** Adopted organizations where legacy type differs from padron type. */
  adoptedTypeMismatch: number;
  /** Codes skipped due to multiple ambiguous adoption candidates. */
  ambiguous: string[];
  /** Facilities transitioned to active without unverified claims. */
  activated: number;
  /** Facilities left pending due to missing legal documentation. */
  pendingForPapers: number;
  /** Public showcases published or updated. */
  showcases: number;
  /** Postal addresses registered. */
  addresses: number;
  /** Rows skipped due to unknown facility types. */
  skipped: string[];
  /** Facilities that failed provisioning with error message. */
  failed: string[];
  /** Reason when the entire seed step was disabled or skipped. */
  reason?: 'not-configured';
}

/** Returns all facilities qualifying as organizations (excludes insurer network offices). */
export function padronFacilities(): PadronFacility[] {
  return (facilitiesDataset.datos as unknown as PadronFacility[]).filter(
    (row) => row.naturaleza !== NETWORK_OFFICE,
  );
}

/** Determines platform tenant type for a padron facility row. */
export function padronTenantType(
  row: PadronFacility,
): TenantTypeCode | undefined {
  return KIND_BY_TIPO[row.tipo]?.tenantType;
}

/** Generates a deterministic organization UUID across all environments. */
export function padronTenantId(code: string): string {
  return deterministicId(`seed:tenant:padron:${code}`);
}

/** Generates a deterministic owner membership UUID for the seed actor. */
export function padronOwnerMembershipId(code: string): string {
  return deterministicId(`seed:tenant-membership:padron-owner:${code}`);
}

/** Converts file name into human-readable source label (e.g., LISTA_CLINICAS_1.md -> Lista clinicas). */
export function readableSource(sourceFile: string): string {
  const text = sourceFile
    .replace(/\.md$/i, '')
    .replace(/_\d+$/, '')
    .replace(/_+/g, ' ')
    .toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Normalizes institution names for accent-insensitive matching. */
export function normalizeName(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^A-Z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Santa Cruz municipalities indexed by normalized name to INE code. */
export const SANTA_CRUZ_MUNICIPALITY_BY_NAME: ReadonlyMap<string, string> =
  new Map(
    BO_MUNICIPALITIES.filter((m) => m.department === 'SC').map((m) => [
      normalizeName(m.name),
      m.ine,
    ]),
  );

/** Formats string to title case while respecting lowercase Spanish prepositions. */
export function titleCase(text: string): string {
  const small = new Set(['de', 'la', 'del', 'las', 'los', 'el', 'y']);
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && small.has(word)
        ? word
        : word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(' ');
}
