import type { ResourceSiteDto } from '../../presentation/dto';
import type { UnitOfWork } from './unit-of-work';

/** Referencia a lo que un recurso agendable representa. */
export interface ResourceRef {
  readonly refType: string;
  readonly refId: string;
}

/**
 * Datos de los profesionales y de sus sedes que la agenda pinta junto a los
 * recursos (contextos `profiles` y `practice`).
 */
export interface PractitionerDirectoryPort {
  /** Mapa `profileId → nombre` de los profesionales dados. */
  findPractitionerNames(
    uow: UnitOfWork,
    profileIds: readonly string[],
  ): Promise<Map<string, string>>;

  /** Dónde se atiende cada recurso, en una pasada para todos. */
  resolveSitesForResources(
    refs: readonly ResourceRef[],
    tenantId: string,
  ): Promise<Map<string, ResourceSiteDto>>;

  /** Prácticas activas donde el profesional tiene un rol vigente. */
  findActivePracticeIdsForPractitioner(
    practitionerProfileId: string,
  ): Promise<string[]>;
}

/** Token de inyección del directorio de profesionales. */
export const PRACTITIONER_DIRECTORY_PORT = Symbol(
  'PRACTITIONER_DIRECTORY_PORT',
);
