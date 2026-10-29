import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import type { AuthenticatedUser } from '../../../common';

/**
 * Puerto de la agenda del equipo de diagnóstico (F5a).
 *
 * `diagnostic_units` no puede importar `scheduling` (el grafo de módulos pasa por
 * `directory`, que ya importa a `diagnostic_units`), así que la agenda se anota aquí al
 * arrancar y el servicio del equipo la consulta por este registro, igual que los bloqueos de
 * clausura se anotan en `practice`. Si nadie se anotó (una prueba, un despliegue parcial) el
 * equipo se edita igual y la agenda no se toca.
 */
export const EQUIPMENT_AGENDA_PORT = 'DIAGNOSTIC_UNITS_EQUIPMENT_AGENDA_PORT';

/** Una reserva futura sobre el equipo, con lo que hay que hacer con ella. */
export interface EquipmentCommitment {
  readonly kind: 'BOOKING';
  readonly id: string;
  readonly startsAt: string;
  readonly nextAction: string;
}

/** Lo que la agenda hace por el equipo. */
export interface EquipmentAgendaPort {
  /** Crea el recurso `EQUIPMENT` del equipo (404/403/409 propios). */
  linkResource(
    tx: EntityManager,
    equipmentId: string,
    input: { name?: string; timeZone?: string; capacity?: number },
    actor: AuthenticatedUser,
  ): Promise<{ id: string; name: string; stateConceptId: string }>;

  /** Reservas futuras (pendientes, confirmadas o recibidas) sobre el recurso del equipo. */
  futureCommitments(
    tx: EntityManager,
    equipmentId: string,
    from: Date,
  ): Promise<EquipmentCommitment[]>;

  /**
   * El estado del equipo ya cambió (y está escrito): cierra o reabre los cupos de su recurso y
   * crea o acorta la excepción de solo lectura `EQUIPMENT_STATUS`.
   */
  syncStatus(
    tx: EntityManager,
    change: {
      equipmentId: string;
      tenantId: string;
      outOfService: boolean;
      actorUserId: string | null;
      now: Date;
    },
  ): Promise<void>;

  /**
   * El equipo cambió de sala (ya escrito): las citas futuras de su recurso se mudan a la sala
   * nueva, comprobando que se pueda reservar (422) y que nadie la ocupe (409, con el
   * `EXCLUDE` de la base como red). Devuelve cuántas se mudaron.
   */
  relocateBookings(
    tx: EntityManager,
    change: {
      equipmentId: string;
      tenantId: string;
      careSpaceId: string | null;
      actorUserId: string | null;
      now: Date;
    },
  ): Promise<number>;
}

/** Registro del puerto (lo llena `scheduling` al arrancar). */
@Injectable()
export class EquipmentAgendaRegistry {
  private port: EquipmentAgendaPort | null = null;

  /** Anota la agenda del equipo. */
  set(port: EquipmentAgendaPort): void {
    this.port = port;
  }

  /** La agenda del equipo, o `null` si nadie se anotó. */
  get(): EquipmentAgendaPort | null {
    return this.port;
  }
}
