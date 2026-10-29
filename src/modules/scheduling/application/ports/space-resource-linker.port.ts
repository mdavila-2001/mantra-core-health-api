import type { AuthenticatedUser } from '../../../../common';
import type {
  CreateResourceDto,
  ResourceResponseDto,
} from '../../presentation/dto';
import type { UnitOfWork } from './unit-of-work';

/**
 * Vincula un recurso agendable a un espacio de infraestructura (R0 de F4, INV-40): tipo
 * `ROOM`, espacio del tenant, autoridad del actor, función agendable, espacio activo y un solo
 * recurso activo por espacio.
 */
export interface SpaceResourceLinkerPort {
  /** Crea el recurso ligado al espacio dentro de la transacción `tx`. */
  link(
    tx: UnitOfWork,
    dto: CreateResourceDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceResponseDto>;
}

/** Token de inyección del vínculo recurso–espacio. */
export const SPACE_RESOURCE_LINKER_PORT = Symbol('SPACE_RESOURCE_LINKER_PORT');
