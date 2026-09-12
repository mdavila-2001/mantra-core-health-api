import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import {
  requireTenantId,
  ResourceNotFoundException,
  type AuthenticatedUser,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services';
import type { CatalogConcepts } from '../../terminology/entities';
import type {
  BrokerCarrierAgreements,
  InsuranceBrokers,
  InsuranceCarriers,
  InsurancePlanBenefits,
  InsurancePlans,
  InsuranceProducts,
  ProviderNetworks,
} from '../entities';
import { INS } from '../insurance.concepts';
import { APPROVAL_DOCUMENT_CODES } from '../dto/backbone.dto';
import type {
  BrokerAgreementDto,
  BrokerDirectoryResponseDto,
  BrokerPortfolioResponseDto,
  BrokerProfileDto,
  BrokerSummaryDto,
  CarrierDetailDto,
  CarrierDirectoryResponseDto,
  CarrierSummaryDto,
  InsuranceConceptDto,
  PlanBenefitDto,
  PlanDto,
  ProductDto,
  ProviderNetworkDto,
} from '../dto';
import { InsuranceReadRepository } from '../repositories';

/**
 * Lecturas del módulo 26: catálogo de la aseguradora y brokers del tenant
 * activo.
 *
 * El módulo sólo tenía escrituras. Sin estas lecturas nada de lo que se da de
 * alta se puede volver a ver, y una pantalla de aseguradora no tenía de dónde
 * sacar sus datos más que inventándolos.
 *
 * Dos reglas gobiernan todo lo de acá:
 *
 * - **Aislamiento en la raíz.** Aseguradora y broker se buscan ya acotados por
 *   `tenant_id`; sus hijos cuelgan de ellos. Un id de otra organización recibe
 *   el mismo 404 que uno inexistente, para que el código de error no sirva de
 *   sonda.
 * - **Mínimo privilegio.** La cartera del broker devuelve la relación
 *   comercial y nada más: la especificación le prohíbe el historial médico del
 *   asegurado, y la garantía es que esta lectura no tiene por dónde traerlo.
 */
@Injectable()
export class InsuranceReadService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia.
   * @param readRepo - Consultas de lectura del módulo.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly readRepo: InsuranceReadRepository,
    private readonly tenantAdministration: TenantAdministrationService,
  ) {}

  /**
   * Aseguradoras activas del tenant activo, con el volumen de su catálogo.
   *
   * @returns Listado con recuentos de productos, planes y redes.
   */
  async listCarriers(
    actor: AuthenticatedUser,
  ): Promise<CarrierDirectoryResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const carriers = await this.readRepo.findCarriersByTenant(em, tenantId);
    if (carriers.length === 0) return { items: [], count: 0 };
    const canAdminister = await this.tenantAdministration.canAdminister(
      em,
      tenantId,
      actor,
    );

    const carrierIds = carriers.map((carrier) => carrier.id);
    const [products, networks] = await Promise.all([
      this.readRepo.findActiveProducts(em, carrierIds),
      this.readRepo.findActiveNetworks(em, carrierIds),
    ]);
    const plans = await this.readRepo.findActivePlans(
      em,
      products.map((product) => product.id),
    );

    const conceptById = await this.conceptMap(
      em,
      carriers.flatMap((carrier) => [
        carrier.statusConceptId,
        carrier.verificationStatusConceptId,
        carrier.jurisdictionConceptId,
      ]),
    );

    const productCount = countBy(products, (p) => p.insuranceCarrierId);
    const carrierByProduct = new Map(
      products.map((product) => [product.id, product.insuranceCarrierId]),
    );
    const planCount = countBy(plans, (plan) =>
      carrierByProduct.get(plan.insuranceProductId),
    );
    const networkCount = countBy(networks, (n) => n.insuranceCarrierId);

    const items = carriers.map((carrier) =>
      this.toCarrierSummary(carrier, conceptById, canAdminister, {
        productCount: productCount.get(carrier.id) ?? 0,
        planCount: planCount.get(carrier.id) ?? 0,
        networkCount: networkCount.get(carrier.id) ?? 0,
      }),
    );
    return { items, count: items.length };
  }

  /**
   * Ficha de una aseguradora: producto → plan → beneficio, y sus redes.
   *
   * @param id - Aseguradora consultada.
   * @returns El catálogo comercial activo y la red de prestadores.
   * @throws ResourceNotFoundException si no pertenece al tenant activo.
   */
  async getCarrier(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<CarrierDetailDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const carrier = await this.readRepo.findCarrierByTenant(em, tenantId, id);
    if (!carrier) {
      throw new ResourceNotFoundException('Aseguradora no encontrada', {
        carrierId: id,
      });
    }
    const canAdminister = await this.tenantAdministration.canAdminister(
      em,
      tenantId,
      actor,
    );

    const [products, networks] = await Promise.all([
      this.readRepo.findActiveProducts(em, [carrier.id]),
      this.readRepo.findActiveNetworks(em, [carrier.id]),
    ]);
    const [plans, memberships] = await Promise.all([
      this.readRepo.findActivePlans(
        em,
        products.map((product) => product.id),
      ),
      this.readRepo.findActiveMemberships(
        em,
        networks.map((network) => network.id),
      ),
    ]);
    const benefits = await this.readRepo.findActiveBenefits(
      em,
      plans.map((plan) => plan.id),
    );

    const conceptById = await this.conceptMap(em, [
      carrier.statusConceptId,
      carrier.verificationStatusConceptId,
      carrier.jurisdictionConceptId,
      ...products.flatMap((product) => [
        product.productTypeConceptId,
        product.statusConceptId,
        product.marketSegmentConceptId,
      ]),
      ...plans.flatMap((plan) => [
        plan.statusConceptId,
        plan.planTypeConceptId,
        plan.currencyConceptId,
      ]),
      ...benefits.flatMap((benefit) => [
        benefit.benefitCategoryConceptId,
        benefit.serviceConceptId,
      ]),
      ...networks.flatMap((network) => [
        network.statusConceptId,
        network.networkTypeConceptId,
      ]),
    ]);

    const benefitsByPlan = groupBy(benefits, (b) => b.insurancePlanId);
    const plansByProduct = groupBy(plans, (p) => p.insuranceProductId);
    const memberCount = countBy(memberships, (m) => m.providerNetworkId);

    const summary = this.toCarrierSummary(carrier, conceptById, canAdminister, {
      productCount: products.length,
      planCount: plans.length,
      networkCount: networks.length,
    });

    return {
      ...summary,
      products: products.map((product) =>
        toProduct(
          product,
          plansByProduct.get(product.id) ?? [],
          benefitsByPlan,
          conceptById,
        ),
      ),
      networks: networks.map((network) =>
        toNetwork(network, memberCount.get(network.id) ?? 0, conceptById),
      ),
    };
  }

  /**
   * Brokers activos del tenant activo.
   *
   * `independent` y `currentCarrierCount` se derivan de los acuerdos vigentes
   * en la fecha de la consulta, nunca de un campo declarativo: es lo que impide
   * que un broker siga figurando como representante de una aseguradora después
   * de que su vinculación venció.
   *
   * @returns Listado de brokers con su situación de vinculación.
   */
  async listBrokers(): Promise<BrokerDirectoryResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const brokers = await this.readRepo.findBrokersByTenant(em, tenantId);
    if (brokers.length === 0) return { items: [], count: 0 };

    const agreements = await this.readRepo.findAgreements(
      em,
      brokers.map((broker) => broker.id),
    );
    const conceptById = await this.conceptMap(
      em,
      brokers.flatMap((broker) => [
        broker.statusConceptId,
        broker.verificationStatusConceptId,
        broker.jurisdictionConceptId,
      ]),
    );

    const now = new Date();
    const currentByBroker = countBy(
      agreements.filter((agreement) => isCurrent(agreement, now)),
      (agreement) => agreement.insuranceBrokerId,
    );

    const items = brokers.map((broker) =>
      this.toBrokerSummary(
        broker,
        conceptById,
        currentByBroker.get(broker.id) ?? 0,
      ),
    );
    return { items, count: items.length };
  }

  /**
   * Perfil de un broker con su historial de vinculaciones.
   *
   * Se devuelven los acuerdos de cualquier estado —el histórico es un requisito
   * explícito— marcando cuál está vigente hoy.
   *
   * @param id - Broker consultado.
   * @returns Perfil y acuerdos, sin cartera de clientes.
   * @throws ResourceNotFoundException si no pertenece al tenant activo.
   */
  async getBroker(id: string): Promise<BrokerProfileDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const broker = await this.readRepo.findBrokerByTenant(em, tenantId, id);
    if (!broker) {
      throw new ResourceNotFoundException('Broker no encontrado', {
        brokerId: id,
      });
    }

    const agreements = await this.readRepo.findAgreements(em, [broker.id]);
    const carriers = await this.readRepo.findCarriersByIds(
      em,
      unique(agreements.map((agreement) => agreement.insuranceCarrierId)),
    );
    const conceptById = await this.conceptMap(em, [
      broker.statusConceptId,
      broker.verificationStatusConceptId,
      broker.jurisdictionConceptId,
      ...agreements.flatMap((agreement) => [
        agreement.statusConceptId,
        agreement.commissionModelConceptId,
      ]),
    ]);

    const now = new Date();
    const carrierNameById = new Map(
      carriers.map((carrier) => [carrier.id, carrier.legalName]),
    );
    const current = agreements.filter((agreement) => isCurrent(agreement, now));

    return {
      ...this.toBrokerSummary(broker, conceptById, current.length),
      publicProfileId: broker.publicProfileId ?? null,
      agreements: agreements.map((agreement) =>
        toAgreement(agreement, carrierNameById, conceptById, now),
      ),
    };
  }

  /**
   * Cartera de un broker: quiénes son sus clientes, no qué les pasa.
   *
   * @param id - Broker cuya cartera se consulta.
   * @returns Relaciones comerciales, sin un solo dato clínico.
   * @throws ResourceNotFoundException si el broker no pertenece al tenant activo.
   */
  async listBrokerClients(id: string): Promise<BrokerPortfolioResponseDto> {
    const tenantId = requireTenantId();
    const em = this.em.fork();
    const broker = await this.readRepo.findBrokerByTenant(em, tenantId, id);
    if (!broker) {
      throw new ResourceNotFoundException('Broker no encontrado', {
        brokerId: id,
      });
    }

    const clients = await this.readRepo.findBrokerClients(em, broker.id);
    const conceptById = await this.conceptMap(
      em,
      clients.flatMap((client) => [
        client.clientTypeConceptId,
        client.statusConceptId,
      ]),
    );

    const items = clients.map((client) => ({
      id: client.id,
      patientProfileId: client.patientProfileId ?? null,
      employerGroupId: client.employerGroupId ?? null,
      clientType: concept(conceptById, client.clientTypeConceptId),
      assignedBrokerUserId: client.assignedBrokerUserId ?? null,
      effectiveFrom: dateOnly(client.effectiveFrom),
      effectiveTo: dateOnly(client.effectiveTo),
      status: concept(conceptById, client.statusConceptId),
    }));
    return { items, count: items.length };
  }

  /** Resuelve un lote de `*_concept_id` a un mapa, ignorando los ausentes. */
  private async conceptMap(
    em: EntityManager,
    ids: readonly (string | undefined)[],
  ): Promise<ReadonlyMap<string, CatalogConcepts>> {
    const concepts = await this.readRepo.findConcepts(
      em,
      unique(ids.filter((id): id is string => Boolean(id))),
    );
    return new Map(concepts.map((item) => [item.id, item]));
  }

  private toCarrierSummary(
    carrier: InsuranceCarriers,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    canAdminister: boolean,
    counts: {
      /** Productos activos. */
      productCount: number;
      /** Planes activos. */
      planCount: number;
      /** Redes activas. */
      networkCount: number;
    },
  ): CarrierSummaryDto {
    return {
      id: carrier.id,
      carrierCode: carrier.carrierCode,
      legalName: carrier.legalName,
      regulatorIdentifier: carrier.regulatorIdentifier ?? null,
      jurisdiction: optionalConcept(concepts, carrier.jurisdictionConceptId),
      status: concept(concepts, carrier.statusConceptId),
      verification: concept(concepts, carrier.verificationStatusConceptId),
      productCount: counts.productCount,
      planCount: counts.planCount,
      networkCount: counts.networkCount,
      createdAt: carrier.createdAt.toISOString(),
      canAdminister,
    };
  }

  private toBrokerSummary(
    broker: InsuranceBrokers,
    concepts: ReadonlyMap<string, CatalogConcepts>,
    currentCarrierCount: number,
  ): BrokerSummaryDto {
    return {
      id: broker.id,
      brokerCode: broker.brokerCode,
      legalName: broker.legalName,
      licenseNumber: broker.licenseNumber ?? null,
      jurisdiction: optionalConcept(concepts, broker.jurisdictionConceptId),
      status: concept(concepts, broker.statusConceptId),
      verification: concept(concepts, broker.verificationStatusConceptId),
      independent: currentCarrierCount === 0,
      currentCarrierCount,
      createdAt: broker.createdAt.toISOString(),
    };
  }
}

/**
 * Si un acuerdo está vigente en el momento dado.
 *
 * Activo **y** dentro de sus fechas: un acuerdo que sigue en estado activo pero
 * cuyo `effective_to` ya pasó no habilita a nadie a representar a la
 * aseguradora, y tratarlo como vigente sería precisamente lo que la
 * especificación prohíbe.
 */
function isCurrent(agreement: BrokerCarrierAgreements, now: Date): boolean {
  if (agreement.statusConceptId !== INS.AGREEMENT_ACTIVE) return false;
  if (
    agreement.effectiveFrom &&
    agreement.effectiveFrom.getTime() > now.getTime()
  ) {
    return false;
  }
  if (
    agreement.effectiveTo &&
    agreement.effectiveTo.getTime() < now.getTime()
  ) {
    return false;
  }
  return true;
}

function toAgreement(
  agreement: BrokerCarrierAgreements,
  carrierNameById: ReadonlyMap<string, string>,
  concepts: ReadonlyMap<string, CatalogConcepts>,
  now: Date,
): BrokerAgreementDto {
  return {
    id: agreement.id,
    insuranceCarrierId: agreement.insuranceCarrierId,
    carrierLegalName:
      carrierNameById.get(agreement.insuranceCarrierId) ??
      'Aseguradora no disponible',
    agreementCode: agreement.agreementCode,
    commissionModel: optionalConcept(
      concepts,
      agreement.commissionModelConceptId,
    ),
    effectiveFrom: dateOnly(agreement.effectiveFrom),
    effectiveTo: dateOnly(agreement.effectiveTo),
    status: concept(concepts, agreement.statusConceptId),
    current: isCurrent(agreement, now),
    contractFileId: agreement.contractFileId ?? null,
  };
}

function toProduct(
  product: InsuranceProducts,
  plans: readonly InsurancePlans[],
  benefitsByPlan: ReadonlyMap<string, InsurancePlanBenefits[]>,
  concepts: ReadonlyMap<string, CatalogConcepts>,
): ProductDto {
  return {
    id: product.id,
    productCode: product.productCode,
    name: product.name,
    productType: concept(concepts, product.productTypeConceptId),
    marketSegment: optionalConcept(concepts, product.marketSegmentConceptId),
    status: concept(concepts, product.statusConceptId),
    plans: plans.map((plan) =>
      toPlan(plan, benefitsByPlan.get(plan.id) ?? [], concepts),
    ),
  };
}

function toPlan(
  plan: InsurancePlans,
  benefits: readonly InsurancePlanBenefits[],
  concepts: ReadonlyMap<string, CatalogConcepts>,
): PlanDto {
  return {
    id: plan.id,
    planCode: plan.planCode,
    name: plan.name,
    planType: optionalConcept(concepts, plan.planTypeConceptId),
    currency: optionalConcept(concepts, plan.currencyConceptId),
    effectiveFrom: dateOnly(plan.effectiveFrom),
    effectiveTo: dateOnly(plan.effectiveTo),
    status: concept(concepts, plan.statusConceptId),
    policyDocumentFileId: plan.policyDocumentFileId ?? null,
    benefits: benefits.map((benefit) => toBenefit(benefit, concepts)),
  };
}

function toBenefit(
  benefit: InsurancePlanBenefits,
  concepts: ReadonlyMap<string, CatalogConcepts>,
): PlanBenefitDto {
  return {
    id: benefit.id,
    category: concept(concepts, benefit.benefitCategoryConceptId),
    service: optionalConcept(concepts, benefit.serviceConceptId),
    coveragePercent: benefit.coveragePercent ?? null,
    copayAmount: benefit.copayAmount ?? null,
    deductibleAmount: benefit.deductibleAmount ?? null,
    annualLimitAmount: benefit.annualLimitAmount ?? null,
    requiresPriorAuthorization: benefit.requiresPriorAuthorization ?? null,
    approvalRules: normalizeApprovalRules(benefit.eligibilityRuleJson),
    effectiveFrom: dateOnly(benefit.effectiveFrom),
    effectiveTo: dateOnly(benefit.effectiveTo),
  };
}

function normalizeApprovalRules(
  value: unknown,
): PlanBenefitDto['approvalRules'] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return { requiredDocuments: [], exclusionNotes: null };
  }
  const candidate = value as Record<string, unknown>;
  const allowed = new Set<string>(APPROVAL_DOCUMENT_CODES);
  const requiredDocuments = Array.isArray(candidate.requiredDocuments)
    ? candidate.requiredDocuments.filter(
        (item): item is string => typeof item === 'string' && allowed.has(item),
      )
    : [];
  return {
    requiredDocuments: [...new Set(requiredDocuments)],
    exclusionNotes:
      typeof candidate.exclusionNotes === 'string'
        ? candidate.exclusionNotes
        : null,
  };
}

function toNetwork(
  network: ProviderNetworks,
  memberCount: number,
  concepts: ReadonlyMap<string, CatalogConcepts>,
): ProviderNetworkDto {
  return {
    id: network.id,
    networkCode: network.networkCode,
    name: network.name,
    networkType: optionalConcept(concepts, network.networkTypeConceptId),
    status: concept(concepts, network.statusConceptId),
    effectiveFrom: dateOnly(network.effectiveFrom),
    effectiveTo: dateOnly(network.effectiveTo),
    memberCount,
  };
}

/**
 * Un concepto resuelto.
 *
 * Cuando el id no está en el catálogo se devuelve un marcador explícito en vez
 * de omitir el campo: la pantalla debe poder decir «sin registrar» y no fingir
 * que el dato no existía.
 */
function concept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): InsuranceConceptDto {
  const value = id === undefined ? undefined : concepts.get(id);
  return value
    ? { code: value.code, display: value.display }
    : { code: 'UNKNOWN', display: 'Sin registrar' };
}

function optionalConcept(
  concepts: ReadonlyMap<string, CatalogConcepts>,
  id: string | undefined,
): InsuranceConceptDto | null {
  return id === undefined ? null : concept(concepts, id);
}

function dateOnly(value: Date | undefined): string | null {
  return value?.toISOString().slice(0, 10) ?? null;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function countBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string | undefined,
): Map<string, number> {
  const result = new Map<string, number>();
  for (const row of rows) {
    const key = keyOf(row);
    if (key !== undefined) result.set(key, (result.get(key) ?? 0) + 1);
  }
  return result;
}

function groupBy<T>(
  rows: readonly T[],
  keyOf: (row: T) => string,
): Map<string, T[]> {
  const result = new Map<string, T[]>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = result.get(key) ?? [];
    current.push(row);
    result.set(key, current);
  }
  return result;
}
