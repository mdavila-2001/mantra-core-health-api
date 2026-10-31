/**
 * Tipos de objetivo de un permiso de apoyo. Una fila con un solo objetivo cubre
 * esa dimensión; una fila con dos objetivos los CRUZA (ambos a la vez); «todos»
 * existe por nivel. Varias filas se SUMAN.
 */
export const SUPPORT_TARGET_KINDS = [
  'PRACTITIONER',
  'SERVICE',
  'LOCATION',
  'PRACTITIONER_SERVICE',
  'PRACTITIONER_LOCATION',
  'SERVICE_LOCATION',
  'ALL_PRACTITIONERS',
  'ALL_SERVICES',
  'ALL_LOCATIONS',
  'ALL',
] as const;

/** Tipo de objetivo de un permiso de apoyo. */
export type SupportTargetKind = (typeof SUPPORT_TARGET_KINDS)[number];

/** Modo de expansión: sigue a la estructura (DYNAMIC) o queda congelado (FIXED). */
export type ExpansionMode = 'DYNAMIC' | 'FIXED';

/** Las tres dimensiones sobre las que un permiso puede acotar. */
export type TargetDimension = 'practitioner' | 'service' | 'location';

/** Cómo restringe un tipo de objetivo cada dimensión. */
export type DimensionConstraint = 'SPECIFIC' | 'ANY' | 'FREE';

/**
 * Restricción por dimensión de cada tipo: `SPECIFIC` exige coincidir con el
 * objetivo de la fila, `ANY` es «todos» (cualquier valor, mientras sea del
 * tenant) y `FREE` no acota esa dimensión.
 */
export const TARGET_CONSTRAINTS: Readonly<
  Record<SupportTargetKind, Record<TargetDimension, DimensionConstraint>>
> = {
  PRACTITIONER: { practitioner: 'SPECIFIC', service: 'FREE', location: 'FREE' },
  SERVICE: { practitioner: 'FREE', service: 'SPECIFIC', location: 'FREE' },
  LOCATION: { practitioner: 'FREE', service: 'FREE', location: 'SPECIFIC' },
  PRACTITIONER_SERVICE: {
    practitioner: 'SPECIFIC',
    service: 'SPECIFIC',
    location: 'FREE',
  },
  PRACTITIONER_LOCATION: {
    practitioner: 'SPECIFIC',
    service: 'FREE',
    location: 'SPECIFIC',
  },
  SERVICE_LOCATION: {
    practitioner: 'FREE',
    service: 'SPECIFIC',
    location: 'SPECIFIC',
  },
  ALL_PRACTITIONERS: { practitioner: 'ANY', service: 'FREE', location: 'FREE' },
  ALL_SERVICES: { practitioner: 'FREE', service: 'ANY', location: 'FREE' },
  ALL_LOCATIONS: { practitioner: 'FREE', service: 'FREE', location: 'ANY' },
  ALL: { practitioner: 'ANY', service: 'ANY', location: 'ANY' },
};

/** Qué referencias del objetivo exige cada tipo para ser válido al crear el permiso. */
export interface TargetReferences {
  /** Doctor (asignación de rol) del objetivo. */
  readonly practitionerRoleAssignmentId?: string;
  /** Servicio del objetivo. */
  readonly healthcareServiceId?: string;
  /** Espacio (edificio, piso, sala…) del objetivo. */
  readonly careSpaceId?: string;
  /** Sede del objetivo. */
  readonly practiceSiteId?: string;
}

/**
 * Valida que las referencias coincidan con el tipo: cada dimensión
 * `SPECIFIC` necesita su referencia (la ubicación admite espacio o sede) y las
 * dimensiones `ANY`/`FREE` no deben traer una.
 *
 * @param kind - Tipo de objetivo.
 * @param refs - Referencias recibidas.
 * @returns Mensaje del primer problema, o `null` si es coherente.
 */
export function validateTargetReferences(
  kind: SupportTargetKind,
  refs: TargetReferences,
): string | null {
  const c = TARGET_CONSTRAINTS[kind];
  const hasLocation = !!refs.careSpaceId || !!refs.practiceSiteId;
  if (refs.careSpaceId && refs.practiceSiteId) {
    return 'La ubicación se indica con un espacio o con una sede, no con ambos';
  }
  if (c.practitioner === 'SPECIFIC' && !refs.practitionerRoleAssignmentId) {
    return `El objetivo ${kind} exige practitionerRoleAssignmentId`;
  }
  if (c.service === 'SPECIFIC' && !refs.healthcareServiceId) {
    return `El objetivo ${kind} exige healthcareServiceId`;
  }
  if (c.location === 'SPECIFIC' && !hasLocation) {
    return `El objetivo ${kind} exige careSpaceId o practiceSiteId`;
  }
  if (c.practitioner !== 'SPECIFIC' && refs.practitionerRoleAssignmentId) {
    return `El objetivo ${kind} no admite practitionerRoleAssignmentId`;
  }
  if (c.service !== 'SPECIFIC' && refs.healthcareServiceId) {
    return `El objetivo ${kind} no admite healthcareServiceId`;
  }
  if (c.location !== 'SPECIFIC' && hasLocation) {
    return `El objetivo ${kind} no admite careSpaceId ni practiceSiteId`;
  }
  return null;
}

/** Una fila de la foto congelada: NULL (ausente) en una dimensión = cualquiera. */
export interface FixedSnapshotRow {
  /** Asignación de rol del doctor. */
  readonly practitionerRoleAssignmentId?: string;
  /** Perfil del doctor (dato auxiliar de la API, junto al contrato del modelo). */
  readonly practitionerProfileId?: string;
  /** Servicio. */
  readonly healthcareServiceId?: string;
  /** Espacio de atención. */
  readonly careSpaceId?: string;
}

/**
 * Foto congelada de lo que cubría un permiso `FIXED` al crearlo, con la forma
 * que fija el modelo (`{"rows":[…]}`): un permiso `FIXED` solo cubre lo que
 * alguna fila lista, aunque la estructura cambie después.
 */
export interface FixedSnapshot {
  /** Filas congeladas. */
  readonly rows: readonly FixedSnapshotRow[];
}

/** Doctor tal como entra en una foto congelada. */
export interface SnapshotDoctor {
  /** Asignación de rol. */
  readonly id?: string;
  /** Perfil profesional. */
  readonly profileId?: string;
}

/** Miembros actuales de cada dimensión, ya resueltos por quien arma la foto. */
export interface SnapshotDimensions {
  /** Doctores: el del objetivo (`SPECIFIC`) o todos los de la organización (`ANY`). */
  readonly doctors: readonly SnapshotDoctor[];
  /** Servicios: el del objetivo o todos los de la organización. */
  readonly services: readonly string[];
  /** Espacios: los contenidos en la ubicación o todos los de la organización. */
  readonly spaces: readonly string[];
}

/** Tope de filas de una foto: más combinaciones se rechazan, no se truncan. */
export const MAX_SNAPSHOT_ROWS = 10_000;

/**
 * Filas de la foto congelada de un permiso `FIXED`. Cada dimensión que el tipo
 * acota (`SPECIFIC` o `ANY`) aporta sus miembros ACTUALES; la que no acota
 * (`FREE`) queda abierta. Con «todos» se congela la lista real, no una fila
 * comodín: un doctor, servicio o espacio que aparezca después no entra. Si una
 * dimensión acotada no tiene miembros hoy, la foto queda vacía y no cubre nada;
 * nunca se emite una fila sin ninguna dimensión.
 *
 * @param kind - Tipo de objetivo.
 * @param dimensions - Miembros actuales de cada dimensión.
 * @returns La foto con la forma del modelo (`{"rows":[…]}`).
 * @throws Error si el cruce supera {@link MAX_SNAPSHOT_ROWS}.
 */
export function snapshotRowsFor(
  kind: SupportTargetKind,
  dimensions: SnapshotDimensions,
): { rows: FixedSnapshotRow[] } {
  const c = TARGET_CONSTRAINTS[kind];
  const doctors: readonly SnapshotDoctor[] =
    c.practitioner === 'FREE' ? [{}] : dimensions.doctors;
  const services: readonly (string | undefined)[] =
    c.service === 'FREE' ? [undefined] : dimensions.services;
  const spaces: readonly (string | undefined)[] =
    c.location === 'FREE' ? [undefined] : dimensions.spaces;
  if (doctors.length * services.length * spaces.length > MAX_SNAPSHOT_ROWS) {
    throw new Error(
      'El permiso congelado cubre demasiadas combinaciones: acótelo a menos doctores, servicios o espacios',
    );
  }
  const rows: FixedSnapshotRow[] = [];
  for (const doctor of doctors) {
    for (const healthcareServiceId of services) {
      for (const careSpaceId of spaces) {
        const row: FixedSnapshotRow = {
          practitionerRoleAssignmentId: doctor.id,
          practitionerProfileId: doctor.profileId,
          healthcareServiceId,
          careSpaceId,
        };
        if (!isEmptySnapshotRow(row)) rows.push(row);
      }
    }
  }
  return { rows };
}

/** ¿La fila no fija ninguna dimensión? Una así cubriría todo, y nunca se admite. */
export function isEmptySnapshotRow(row: FixedSnapshotRow): boolean {
  return (
    !row.practitionerRoleAssignmentId &&
    !row.practitionerProfileId &&
    !row.healthcareServiceId &&
    !row.careSpaceId
  );
}
