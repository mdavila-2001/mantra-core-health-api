import type { EntityManager } from '@mikro-orm/postgresql';

/** Lo que la agenda necesita saber de un espacio físico (R0, §F4.1). */
export interface CareSpaceForResource {
  readonly tenantId: string;
  readonly practiceSiteId: string;
  readonly functionCode: string | null;
  /** Perfil de función `schedulable`. */
  readonly schedulable: boolean;
  /** Ciclo de vida ACTIVE y vigente. */
  readonly active: boolean;
}

/**
 * Espacios físicos de `practice` vistos desde la agenda. El adaptador lee el
 * espacio y publica el evento de vínculo; la agenda decide.
 */
export interface CareSpaceDirectoryPort {
  /** El espacio, o `null` si no existe. */
  describe(
    tx: EntityManager,
    careSpaceId: string,
  ): Promise<CareSpaceForResource | null>;
  /** ¿Hay otro recurso ACTIVE ligado al espacio? */
  hasActiveResource(tx: EntityManager, careSpaceId: string): Promise<boolean>;
  /** Evento `scheduling.resource.linked_to_space` en la transacción. */
  announceLinked(
    tx: EntityManager,
    input: {
      tenantId: string;
      resourceId: string;
      careSpaceId: string;
      actorUserId: string;
    },
  ): Promise<void>;
}

/** Token del puerto. */
export const CARE_SPACE_DIRECTORY_PORT = Symbol('CARE_SPACE_DIRECTORY_PORT');
