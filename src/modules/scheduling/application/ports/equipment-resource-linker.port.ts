import type { AuthenticatedUser } from '../../../../common';
import type { UnitOfWork } from './unit-of-work';

/** El equipo con el sitio y la sala que importan para ligarlo. */
export interface EquipmentRef {
  readonly id: string;
  readonly tenantId: string;
  readonly careSpaceId: string | null;
  readonly practiceSiteId: string;
  readonly practiceId: string;
  readonly schedulableResourceId: string | null;
  readonly operationalStatusConceptId: string;
  readonly label: string;
}

/** Datos de alta que el cliente puede elegir. */
export interface EquipmentResourceInput {
  readonly name?: string;
  readonly timeZone?: string;
  readonly capacity?: number;
}

/**
 * Liga el equipo de diagnóstico a la agenda como recurso `EQUIPMENT` (F5a, INV-40): equipo del
 * tenant, autoridad del actor, equipo ubicado en una sala y un solo recurso activo por equipo.
 * El `tenant_id` del recurso sale del contexto, nunca del cuerpo.
 */
export interface EquipmentResourceLinkerPort {
  /**
   * Carga el equipo del tenant, bloqueando su fila si `lock`.
   *
   * @throws ResourceNotFoundException (404 uniforme).
   */
  loadEquipment(
    tx: UnitOfWork,
    equipmentId: string,
    lock?: boolean,
  ): Promise<EquipmentRef>;

  /** Crea el recurso `EQUIPMENT` del equipo. */
  link(
    tx: UnitOfWork,
    equipmentId: string,
    input: EquipmentResourceInput,
    actor: AuthenticatedUser,
  ): Promise<{ id: string; name: string; stateConceptId: string }>;
}

/** Token de inyección del vínculo recurso–equipo. */
export const EQUIPMENT_RESOURCE_LINKER_PORT = Symbol(
  'EQUIPMENT_RESOURCE_LINKER_PORT',
);
