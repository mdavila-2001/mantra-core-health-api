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
  findCarrier(
    em: EntityManager,
    id: string,
  ): Promise<InsuranceCarriers | null> {
    return em.findOne(InsuranceCarriers, { id });
  }
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

  findProduct(
    em: EntityManager,
    id: string,
  ): Promise<InsuranceProducts | null> {
    return em.findOne(InsuranceProducts, { id });
  }
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

  findPlan(em: EntityManager, id: string): Promise<InsurancePlans | null> {
    return em.findOne(InsurancePlans, { id });
  }
  createPlan(em: EntityManager, data: Record<string, unknown>): InsurancePlans {
    return em.create(
      InsurancePlans,
      { ...data, ...createdBy(data.actorUserId as string) },
      { partial: true },
    );
  }

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

  findProviderNetwork(
    em: EntityManager,
    id: string,
  ): Promise<ProviderNetworks | null> {
    return em.findOne(ProviderNetworks, { id });
  }
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

  findBroker(em: EntityManager, id: string): Promise<InsuranceBrokers | null> {
    return em.findOne(InsuranceBrokers, { id });
  }
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

  findAgreement(
    em: EntityManager,
    id: string,
  ): Promise<BrokerCarrierAgreements | null> {
    return em.findOne(BrokerCarrierAgreements, { id });
  }
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
