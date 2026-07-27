import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { VirtualEncounters } from '../entities';
import { createdBy } from '../../../common';

/** Datos para abrir una sesión de telesalud (1:1 con el encuentro clínico). */
export interface CreateVirtualEncounterData {
  encounterId: string;
  platformConceptId?: string;
  meetingUrl?: string;
  meetingId?: string;
  statusConceptId: string;
  actorUserId?: string;
}

/** Acceso a datos de `clinical_ext.virtual_encounters`. */
@Injectable()
export class VirtualEncountersRepository {
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
