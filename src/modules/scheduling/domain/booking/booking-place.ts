/** Dónde y de qué atiende realmente un doctor: sus espacios y servicios vigentes. */
export interface PractitionerPlacements {
  /** Espacios donde atiende (asignaciones de ubicación vigentes). */
  readonly spaceIds: readonly string[];
  /** Servicios propios de sus asignaciones de rol. */
  readonly serviceIds: readonly string[];
}

/** Lo que quien agenda declara (solo lo toma en cuenta la persona de apoyo). */
export interface DeclaredPlace {
  readonly careSpaceId?: string;
  readonly healthcareServiceId?: string;
}

/** Resultado: el lugar con el que nace la cita, o el motivo del rechazo. */
export type BookingPlaceResult =
  | {
      readonly careSpaceId?: string;
      readonly healthcareServiceId?: string;
      readonly rejected?: undefined;
    }
  | {
      readonly rejected:
        'CARE_SPACE_NOT_OF_PRACTITIONER' | 'SERVICE_NOT_OF_PRACTITIONER';
    };

/**
 * Espacio y servicio con los que nace una cita, **derivados de la agenda del
 * doctor** y no de lo que diga quien agenda: lo declarado se acepta solo si el
 * doctor de verdad atiende en ese espacio y presta ese servicio. Sin declarar,
 * se toma el único espacio (o servicio) que tiene; con varios no se elige y
 * queda vacío, de modo que un permiso por ubicación o servicio no cubre la
 * cita. Así un permiso acotado no se esquiva nombrando otro espacio o servicio.
 *
 * Un doctor sin servicios propios NO acepta servicio declarado (la cita puntual
 * no nace de un cupo con servicio que contrastar): aceptarlo anularía los
 * permisos por servicio, porque quien agenda elegiría el servicio que su permiso
 * cubre. Sin espacios asignados, tampoco hay espacio que declarar.
 *
 * @param declared - Lo declarado por quien agenda.
 * @param placements - Espacios y servicios reales del doctor.
 * @returns El lugar de la cita o el motivo del rechazo.
 */
export function resolveBookingPlace(
  declared: DeclaredPlace,
  placements: PractitionerPlacements,
): BookingPlaceResult {
  if (
    declared.careSpaceId &&
    !placements.spaceIds.includes(declared.careSpaceId)
  ) {
    return { rejected: 'CARE_SPACE_NOT_OF_PRACTITIONER' };
  }
  if (
    declared.healthcareServiceId &&
    !placements.serviceIds.includes(declared.healthcareServiceId)
  ) {
    return { rejected: 'SERVICE_NOT_OF_PRACTITIONER' };
  }
  const only = (ids: readonly string[]): string | undefined =>
    ids.length === 1 ? ids[0] : undefined;
  return {
    careSpaceId: declared.careSpaceId ?? only(placements.spaceIds),
    healthcareServiceId:
      declared.healthcareServiceId ?? only(placements.serviceIds),
  };
}
