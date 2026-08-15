import { Injectable } from '@nestjs/common';
import type { EntityManager } from '@mikro-orm/postgresql';
import { CatalogConcepts } from '../../terminology/entities';
import {
  BrokerCarrierAgreements,
  BrokerClients,
  InsuranceBrokers,
  InsuranceCarriers,
  InsurancePlanBenefits,
  InsurancePlans,
  InsuranceProducts,
  NetworkProviderMemberships,
  ProviderNetworks,
} from '../entities';
import { INS } from '../insurance.concepts';

/**
 * Consultas de las lecturas del módulo 26.
 *
 * Stateless, como el resto de repositorios del módulo: cada método recibe el
 * `EntityManager` con el que trabaja. Todas las entradas del árbol de lectura
 * arrancan por una aseguradora o un broker ya acotados al tenant activo — el
 * aislamiento se resuelve en la raíz y no se vuelve a comprobar hijo por hijo,
 * porque producto, plan, beneficio y red no tienen `tenant_id` propio: cuelgan
 * de la aseguradora y heredan su alcance.
 */
@Injectable()
export class InsuranceReadRepository {
  /** Aseguradoras activas del tenant, por razón social. */
  findCarriersByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<InsuranceCarriers[]> {
    return em.find(
      InsuranceCarriers,
      { tenantId, statusConceptId: INS.CARRIER_ACTIVE },
      { orderBy: { legalName: 'ASC' } },
    );
  }

  /**
   * Una aseguradora del tenant activo.
   *
   * El filtro por tenant va en la consulta y no en una comprobación posterior:
   * una aseguradora de otra organización debe ser indistinguible de una que no
   * existe, y devolver la fila para compararla después ya sería haberla leído.
   */
  findCarrierByTenant(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<InsuranceCarriers | null> {
    return em.findOne(InsuranceCarriers, { id, tenantId });
  }

  /** Productos activos de las aseguradoras dadas. */
  findActiveProducts(
    em: EntityManager,
    carrierIds: readonly string[],
  ): Promise<InsuranceProducts[]> {
    if (carrierIds.length === 0) return Promise.resolve([]);
    return em.find(
      InsuranceProducts,
      {
        insuranceCarrierId: { $in: carrierIds },
        statusConceptId: INS.PRODUCT_ACTIVE,
      },
      { orderBy: { name: 'ASC' } },
    );
  }

  /** Planes activos de los productos dados. */
  findActivePlans(
    em: EntityManager,
    productIds: readonly string[],
  ): Promise<InsurancePlans[]> {
    if (productIds.length === 0) return Promise.resolve([]);
    return em.find(
      InsurancePlans,
      {
        insuranceProductId: { $in: productIds },
        statusConceptId: INS.PLAN_ACTIVE,
      },
      { orderBy: { name: 'ASC' } },
    );
  }

  /** Beneficios activos de los planes dados. */
  findActiveBenefits(
    em: EntityManager,
    planIds: readonly string[],
  ): Promise<InsurancePlanBenefits[]> {
    if (planIds.length === 0) return Promise.resolve([]);
    return em.find(
      InsurancePlanBenefits,
      {
        insurancePlanId: { $in: planIds },
        statusConceptId: INS.BENEFIT_ACTIVE,
      },
      { orderBy: { createdAt: 'ASC' } },
    );
  }

  /** Redes de prestadores activas de las aseguradoras dadas. */
  findActiveNetworks(
    em: EntityManager,
    carrierIds: readonly string[],
  ): Promise<ProviderNetworks[]> {
    if (carrierIds.length === 0) return Promise.resolve([]);
    return em.find(
      ProviderNetworks,
      {
        insuranceCarrierId: { $in: carrierIds },
        statusConceptId: INS.NETWORK_ACTIVE,
      },
      { orderBy: { name: 'ASC' } },
    );
  }

  /** Membresías activas de las redes dadas. */
  findActiveMemberships(
    em: EntityManager,
    networkIds: readonly string[],
  ): Promise<NetworkProviderMemberships[]> {
    if (networkIds.length === 0) return Promise.resolve([]);
    return em.find(NetworkProviderMemberships, {
      providerNetworkId: { $in: networkIds },
      statusConceptId: INS.MEMBERSHIP_ACTIVE,
    });
  }

  /** Brokers activos del tenant, por razón social. */
  findBrokersByTenant(
    em: EntityManager,
    tenantId: string,
  ): Promise<InsuranceBrokers[]> {
    return em.find(
      InsuranceBrokers,
      { tenantId, statusConceptId: INS.BROKER_ACTIVE },
      { orderBy: { legalName: 'ASC' } },
    );
  }

  /** Un broker del tenant activo. Mismo criterio de aislamiento que la aseguradora. */
  findBrokerByTenant(
    em: EntityManager,
    tenantId: string,
    id: string,
  ): Promise<InsuranceBrokers | null> {
    return em.findOne(InsuranceBrokers, { id, tenantId });
  }

  /**
   * Acuerdos de los brokers dados, **de cualquier estado**.
   *
   * El histórico es parte del requisito: la especificación pide conservar «el
   * historial de las organizaciones con las que estuvo vinculado». Filtrar por
   * activo acá haría imposible mostrarlo. Cuál está vigente lo decide el
   * servicio, que es quien conoce la fecha de la consulta.
   */
  findAgreements(
    em: EntityManager,
    brokerIds: readonly string[],
  ): Promise<BrokerCarrierAgreements[]> {
    if (brokerIds.length === 0) return Promise.resolve([]);
    return em.find(
      BrokerCarrierAgreements,
      { insuranceBrokerId: { $in: brokerIds } },
      { orderBy: { effectiveFrom: 'DESC', createdAt: 'DESC' } },
    );
  }

  /** Aseguradoras por id, para nombrar la contraparte de cada acuerdo. */
  findCarriersByIds(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<InsuranceCarriers[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(InsuranceCarriers, { id: { $in: ids } });
  }

  /** Cartera de un broker: sólo la relación comercial, nunca datos clínicos. */
  findBrokerClients(
    em: EntityManager,
    brokerId: string,
  ): Promise<BrokerClients[]> {
    return em.find(
      BrokerClients,
      { insuranceBrokerId: brokerId },
      { orderBy: { createdAt: 'DESC' } },
    );
  }

  /** Conceptos por id, para resolver los `*_concept_id` a su par legible. */
  findConcepts(
    em: EntityManager,
    ids: readonly string[],
  ): Promise<CatalogConcepts[]> {
    if (ids.length === 0) return Promise.resolve([]);
    return em.find(CatalogConcepts, { id: { $in: ids } });
  }
}
