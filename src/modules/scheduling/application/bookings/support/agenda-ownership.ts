import type { EntityManager } from '@mikro-orm/postgresql';
import type { AppointmentBookings } from '../../../entities';
import type { SchedulingCatalogRepository } from '../../../infrastructure/repositories';
import { PRACTITIONER_PROFILE_TABLES } from '../../../domain/resource/practitioner-profile-tables';

/** De quién es cada agenda de una página de citas, y cuáles son del actor. */
export interface AgendaOwnership {
  /** `resourceId` → perfil dueño del recurso. */
  readonly owners: ReadonlyMap<string, string>;
  /** Recursos de la página que son la agenda del perfil profesional indicado. */
  readonly ownResources: ReadonlySet<string>;
}

/**
 * Resuelve, en lote, de quién son los recursos de las citas de una página.
 *
 * Es lo único que puede convertir «esta cita es de alguien» en «esta cita es
 * MÍA»: decide qué motivo se muestra y qué citas de un paciente le tocan a quien
 * atiende. Sin perfil profesional no hay agenda propia y no se consulta nada.
 *
 * @param em - Contexto de persistencia de la lectura.
 * @param catalogRepo - Lectura de recursos de agenda.
 * @param bookings - Las citas de la página.
 * @param practitionerProfileId - Perfil profesional del actor, si lo tiene.
 */
export async function resolveAgendaOwnership(
  em: EntityManager,
  catalogRepo: SchedulingCatalogRepository,
  bookings: readonly AppointmentBookings[],
  practitionerProfileId: string | undefined,
): Promise<AgendaOwnership> {
  const owners = new Map<string, string>();
  const ownResources = new Set<string>();
  if (practitionerProfileId === undefined) return { owners, ownResources };

  const ids = [
    ...new Set(
      bookings
        .map((booking) => booking.resourceId)
        .filter((id): id is string => id !== undefined && id !== null),
    ),
  ];
  for (const id of ids) {
    const resource = await catalogRepo.findResourceById(em, id);
    if (!resource) continue;
    owners.set(id, resource.resourceRefId);
    if (
      resource.resourceRefId === practitionerProfileId &&
      PRACTITIONER_PROFILE_TABLES.includes(resource.resourceRefType)
    ) {
      ownResources.add(id);
    }
  }
  return { owners, ownResources };
}
