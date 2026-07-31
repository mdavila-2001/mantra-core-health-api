import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { InstrumentSets, SterilizationLoads } from '../entities';

/**
 * Acceso de solo lectura al inventario de sets de instrumental y a las cargas de
 * esterilización de `procedures_perioperative.*`.
 *
 * Ni `instrument_sets` ni `sterilization_loads` cuelgan de un caso quirúrgico ni
 * se referencian entre sí a nivel de columna: ambos se agrupan por tenant. La
 * carga de esterilización, además, se identifica por su esterilizador y ciclo.
 */
@Injectable()
export class PeriopInstrumentsRepository {
  /**
   * Obtiene find instrument set by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find instrument set by id conforme al contrato `Promise<InstrumentSets | null>`.
   */
  findInstrumentSetById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<InstrumentSets | null> {
    return em.findOne(InstrumentSets, { id, tenantId });
  }

  /**
   * Sets de instrumental de un tenant: `instrument_sets` se agrupa por tenant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de list instrument sets by tenant conforme al contrato `Promise<InstrumentSets[]>`.
   */
  listInstrumentSetsByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<InstrumentSets[]> {
    return em.find(InstrumentSets, { tenantId });
  }

  /**
   * Obtiene find sterilization load by id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find sterilization load by id conforme al contrato `Promise<SterilizationLoads | null>`.
   */
  findSterilizationLoadById(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<SterilizationLoads | null> {
    return em.findOne(SterilizationLoads, { id, tenantId });
  }

  /**
   * Cargas de esterilización de un tenant: `sterilization_loads` se agrupa por
   * tenant.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador de tenant.
   * @returns Resultado de list sterilization loads by tenant conforme al contrato `Promise<SterilizationLoads[]>`.
   */
  listSterilizationLoadsByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<SterilizationLoads[]> {
    return em.find(SterilizationLoads, { tenantId });
  }
}
