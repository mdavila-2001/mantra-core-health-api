import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Practices } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta una práctica (organización raíz). */
export interface CreatePracticeData {
  tenantId: string;
  code: string;
  name: string;
  typeConceptId: string;
  adminUserId: string;
  statusConceptId: string;
  currencyConceptId?: string;
  timeZone?: string;
  actorUserId?: string;
}

/**
 * Acceso a datos de `practice.practices`. Repositorio stateless: cada método
 * recibe el `EntityManager` activo para que el servicio controle la transacción.
 */
@Injectable()
export class PracticesRepository {
  findById(em: EntityManager, id: string): Promise<Practices | null> {
    return em.findOne(Practices, { id });
  }

  create(em: EntityManager, data: CreatePracticeData): Practices {
    return em.create(
      Practices,
      {
        tenantId: data.tenantId,
        code: data.code,
        name: data.name,
        typeConceptId: data.typeConceptId,
        adminUserId: data.adminUserId,
        statusConceptId: data.statusConceptId,
        currencyConceptId: data.currencyConceptId,
        timeZone: data.timeZone,
        ...createdBy(data.actorUserId),
      },
      { partial: true },
    );
  }
}
