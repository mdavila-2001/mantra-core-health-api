import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { VirtualEncounters } from '../entities';
import { createdBy } from '../../../common';

/** Datos para abrir una sesión de telesalud (1:1 con el encuentro clínico). */
export interface CreateVirtualEncounterData {
  /**
   * Identificador asociado a encounter.
   */
  encounterId: string;
  /**
   * Identificador asociado a platform concept.
   */
  platformConceptId?: string;
  /**
   * Valor de meeting url mantenido por la instancia.
   */
  meetingUrl?: string;
  /**
   * Identificador asociado a meeting.
   */
  meetingId?: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.virtual_encounters`. */
@Injectable()
export class VirtualEncountersRepository {
  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<VirtualEncounters | null>`.
   */
  findById(em: EntityManager, id: string): Promise<VirtualEncounters | null> {
    return em.findOne(VirtualEncounters, { id });
  }

  /** Sesión virtual asociada a un encuentro (constraint 1:1). */
  findByEncounter(
    em: EntityManager,
    encounterId: string,
  ): Promise<VirtualEncounters | null> {
    return em.findOne(VirtualEncounters, { encounterId });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `VirtualEncounters`.
   */
  create(
    em: EntityManager,
    data: CreateVirtualEncounterData,
  ): VirtualEncounters {
    return em.create(
      VirtualEncounters,
      {
        encounterId: data.encounterId,
        platformConceptId: data.platformConceptId,
        meetingUrl: data.meetingUrl,
        meetingId: data.meetingId,
        statusConceptId: data.statusConceptId,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
