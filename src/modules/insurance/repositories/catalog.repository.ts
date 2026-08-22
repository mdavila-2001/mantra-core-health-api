import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { createdBy } from '../../../common';
import {
  InsuranceCarriers,
  InsuranceProducts,
  InsurancePlans,
  InsurancePlanBenefits,
  ProviderNetworks,
  NetworkProviderMemberships,
  InsuranceBrokers,
  EmployerGroups,
  BrokerCarrierAgreements,
} from '../entities';

/**
 * Acceso a datos del "backbone" de aseguramiento: aseguradoras, productos,
 * planes, beneficios, redes/membresías y brokers/acuerdos. Stateless: cada
 * método recibe el `EntityManager` activo para participar en la transacción del
 * servicio. Las FK intra-schema (carrier→product→plan, carrier→network...) están
 * forzadas en la BD, por eso el servicio hace `flush` entre padre e hijo.
 */
@Injectable()
export class CatalogRepository {
  /**
   * Obtiene find carrier.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find carrier conforme al contrato `Promise<InsuranceCarriers | null>`.
   */
  findCarrier(
    em: EntityManager,
    id: string,
  ): Promise<InsuranceCarriers | null> {
    return em.findOne(InsuranceCarriers, { id });
  }
  /**
   * Obtiene find carrier by tenant id.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param tenantId - Identificador del tenant dueño de la aseguradora.
   * @returns Resultado de find carrier by tenant id conforme al contrato `Promise<InsuranceCarriers | null>`.
   */
  findCarrierByTenantId(
    em: EntityManager,
    tenantId: string,
  ): Promise<InsuranceCarriers | null> {
    return em.findOne(InsuranceCarriers, { tenantId });
  }
  /**
   * Crea create carrier.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create carrier conforme al contrato `InsuranceCarriers`.
   */
  createCarrier(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsuranceCarriers {
    return em.create(
      InsuranceCarriers,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene find product.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find product conforme al contrato `Promise<InsuranceProducts | null>`.
   */
  findProduct(
    em: EntityManager,
    id: string,
  ): Promise<InsuranceProducts | null> {
    return em.findOne(InsuranceProducts, { id });
  }
  /**
   * Crea create product.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create product conforme al contrato `InsuranceProducts`.
   */
  createProduct(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsuranceProducts {
    return em.create(
      InsuranceProducts,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene find plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find plan conforme al contrato `Promise<InsurancePlans | null>`.
   */
  findPlan(em: EntityManager, id: string): Promise<InsurancePlans | null> {
    return em.findOne(InsurancePlans, { id });
  }
  /**
   * Crea create plan.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create plan conforme al contrato `InsurancePlans`.
   */
  createPlan(em: EntityManager, data: Record<string, unknown>): InsurancePlans {
    return em.create(
      InsurancePlans,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create benefit.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create benefit conforme al contrato `InsurancePlanBenefits`.
   */
  createBenefit(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsurancePlanBenefits {
    return em.create(
      InsurancePlanBenefits,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene find provider network.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find provider network conforme al contrato `Promise<ProviderNetworks | null>`.
   */
  findProviderNetwork(
    em: EntityManager,
    id: string,
  ): Promise<ProviderNetworks | null> {
    return em.findOne(ProviderNetworks, { id });
  }
  /**
   * Crea create provider network.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create provider network conforme al contrato `ProviderNetworks`.
   */
  createProviderNetwork(
    em: EntityManager,
    data: Record<string, unknown>,
  ): ProviderNetworks {
    return em.create(
      ProviderNetworks,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create membership.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create membership conforme al contrato `NetworkProviderMemberships`.
   */
  createMembership(
    em: EntityManager,
    data: Record<string, unknown>,
  ): NetworkProviderMemberships {
    return em.create(
      NetworkProviderMemberships,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene find broker.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find broker conforme al contrato `Promise<InsuranceBrokers | null>`.
   */
  findBroker(em: EntityManager, id: string): Promise<InsuranceBrokers | null> {
    return em.findOne(InsuranceBrokers, { id });
  }
  /**
   * Crea create broker.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create broker conforme al contrato `InsuranceBrokers`.
   */
  createBroker(
    em: EntityManager,
    data: Record<string, unknown>,
  ): InsuranceBrokers {
    return em.create(
      InsuranceBrokers,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Crea create employer group.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create employer group conforme al contrato `EmployerGroups`.
   */
  createEmployerGroup(
    em: EntityManager,
    data: Record<string, unknown>,
  ): EmployerGroups {
    return em.create(
      EmployerGroups,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

  /**
   * Obtiene find agreement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param id - Identificador de id.
   * @returns Resultado de find agreement conforme al contrato `Promise<BrokerCarrierAgreements | null>`.
   */
  findAgreement(
    em: EntityManager,
    id: string,
  ): Promise<BrokerCarrierAgreements | null> {
    return em.findOne(BrokerCarrierAgreements, { id });
  }
  /**
   * Crea create agreement.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param data - Valor de data requerido por la operación.
   * @returns Resultado de create agreement conforme al contrato `BrokerCarrierAgreements`.
   */
  createAgreement(
    em: EntityManager,
    data: Record<string, unknown>,
  ): BrokerCarrierAgreements {
    return em.create(
      BrokerCarrierAgreements,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }
}
