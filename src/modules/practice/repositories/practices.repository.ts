import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { Practices } from '../entities';
import { createdBy } from '../../../common';

/** Datos mínimos para dar de alta una práctica (organización raíz). */
export interface CreatePracticeData {
  /**
   * Identificador asociado a tenant.
   */
  tenantId: string;
  /**
   * Valor de code mantenido por la instancia.
   */
  code: string;
  /**
   * Valor de name mantenido por la instancia.
   */
  name: string;
  /**
   * Identificador asociado a type concept.
   */
  typeConceptId: string;
  /**
   * Identificador asociado a admin user.
   */
  adminUserId: string;
  /**
   * Identificador asociado a status concept.
   */
  statusConceptId: string;
  /**
   * Identificador asociado a currency concept.
   */
  currencyConceptId?: string;
  /**
   * Valor de time zone mantenido por la instancia.
   */
  timeZone?: string;
  /**
   * Identificador asociado a actor user.
   */
  actorUserId?: string;
}

/**
 * Acceso a datos de `practice.practices`. Repositorio stateless: cada método
 * recibe el `EntityManager` activo para que el servicio controle la transacción.
 */
@Injectable()
export class PracticesRepository {
  /** Prácticas cuyo estado coincide con el indicado. */
  findActive(
    em: EntityManager,
    activeStatusConceptId: string,
  ): Promise<Practices[]> {
    return em.find(Practices, { statusConceptId: activeStatusConceptId });
  }

  /**
   * Obtiene find by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find by id conforme al contrato `Promise<Practices | null>`.
   */
  findById(em: EntityManager, id: string): Promise<Practices | null> {
    return em.findOne(Practices, { id });
  }

  /**
   * Crea create.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create conforme al contrato `Practices`.
   */
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
