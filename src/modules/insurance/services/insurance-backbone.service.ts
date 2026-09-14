import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { PinoLogger } from 'nestjs-pino';
import {
  PreconditionFailedException,
  requireTenantId,
  ResourceNotFoundException,
  touch,
  type AuthenticatedUser,
} from '../../../common';
import { TenantAdministrationService } from '../../directory/services';
import { CatalogRepository } from '../repositories';
import type { InsuranceCarriers } from '../entities';
import { INS } from '../insurance.concepts';
import {
  CarrierContactChannelsDto,
  CreateCarrierDto,
  CreateProductDto,
  CreatePlanDto,
  CreatePlanBenefitDto,
  CreateProviderNetworkDto,
  CreateBrokerDto,
  CreateEmployerGroupDto,
  CreateBrokerAgreementDto,
  CreateMembershipDto,
  OkResultDto,
  CreatedResourceDto,
  PlanPremiumDto,
  ResourceStatusDto,
  UpdateCarrierContactChannelsDto,
  UpdatePlanBenefitDto,
  UpdatePlanBenefitRulesDto,
  UpdatePlanPremiumDto,
} from '../dto';

/**
 * Backbone de aseguramiento y alta de membresías de red.
 *
 * Los endpoints de aseguradora/producto/plan/beneficio/red/broker/acuerdo son de
 * soporte (administración del catálogo) y sirven de padres para los 14 casos de
 * uso. `addMembership` implementa UC-26-01. El servicio posee la transacción y
 * hace `flush` del padre antes de leerlo/encadenar hijos (las FK intra-schema
 * están forzadas en la BD y MikroORM no ordena inserts de columnas uuid planas).
 */
@Injectable()
export class InsuranceBackboneService {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param em - Contexto de persistencia o transacción activa.
   * @param repo - Valor de repo requerido por la operación.
   * @param logger - Valor de logger requerido por la operación.
   */
  constructor(
    private readonly em: EntityManager,
    private readonly repo: CatalogRepository,
    private readonly tenantAdministration: TenantAdministrationService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(InsuranceBackboneService.name);
  }

  /**
   * Crea create carrier.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create carrier conforme al contrato `Promise<ResourceStatusDto>`.
   */
  async createCarrier(
    dto: CreateCarrierDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.em.transactional(async (tx) => {
      const carrier = this.repo.createCarrier(tx, {
        tenantId: dto.tenantId,
        carrierCode: dto.carrierCode,
        legalName: dto.legalName,
        regulatorIdentifier: dto.regulatorIdentifier,
        verificationStatusConceptId: INS.VERIFY_PENDING,
        statusConceptId: INS.CARRIER_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'insurance.carrier.create', carrierId: carrier.id },
        'Carrier created',
      );
      return {
        id: carrier.id,
        status: carrier.statusConceptId,
        createdAt: carrier.createdAt,
      };
    });
  }

  /**
   * Reemplaza los tres canales de contacto directo de la aseguradora del
   * tenant activo (subtarea 2.3).
   *
   * `administrableCarrier()` resuelve el carrier por tenant, no por `:id`:
   * el 404 por un `:id` ajeno al carrier del tenant activo se comprueba acá,
   * explícito, para que administrar la aseguradora de otro tenant no filtre
   * su existencia ni la pise por accidente.
   *
   * @param id - Aseguradora a editar; debe ser la del tenant activo.
   * @param dto - Los tres canales, reemplazo completo (`null` = quitar).
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Los canales resultantes.
   * @throws ResourceNotFoundException si `id` no es el carrier del tenant activo.
   */
  async updateContactChannels(
    id: string,
    dto: UpdateCarrierContactChannelsDto,
    actor: AuthenticatedUser,
  ): Promise<CarrierContactChannelsDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      if (carrier.id !== id) {
        throw new ResourceNotFoundException('Aseguradora no encontrada', {
          carrierId: id,
        });
      }

      carrier.whatsappNumber = dto.whatsappNumber ?? undefined;
      carrier.callCenterPhone = dto.callCenterPhone ?? undefined;
      carrier.supportEmail = dto.supportEmail ?? undefined;
      touch(carrier, actor.id);
      await tx.flush();

      this.logger.info(
        {
          operation: 'insurance.carrier.updateContactChannels',
          carrierId: carrier.id,
        },
        'Carrier contact channels updated',
      );

      return {
        id: carrier.id,
        whatsappNumber: carrier.whatsappNumber ?? null,
        callCenterPhone: carrier.callCenterPhone ?? null,
        supportEmail: carrier.supportEmail ?? null,
      };
    });
  }

  /**
   * Crea create product.
   *
   * @param carrierId - Identificador de carrier.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create product conforme al contrato `Promise<CreatedResourceDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async createProduct(
    carrierId: string,
    dto: CreateProductDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.repo.findCarrier(tx, carrierId);
      if (!carrier)
        throw new ResourceNotFoundException('Aseguradora no encontrada', {
          carrierId,
        });
      const product = this.repo.createProduct(tx, {
        insuranceCarrierId: carrierId,
        productCode: dto.productCode,
        name: dto.name,
        productTypeConceptId: INS.PRODUCT_TYPE_HEALTH,
        statusConceptId: INS.PRODUCT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: product.id };
    });
  }

  /**
   * Crea create plan.
   *
   * @param productId - Identificador de product.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create plan conforme al contrato `Promise<CreatedResourceDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async createPlan(
    productId: string,
    dto: CreatePlanDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      const product = await this.repo.findProductForCarrier(
        tx,
        productId,
        carrier.id,
      );
      if (!product)
        throw new ResourceNotFoundException('Producto no encontrado', {
          productId,
        });
      const plan = this.repo.createPlan(tx, {
        insuranceProductId: productId,
        planCode: dto.planCode,
        name: dto.name,
        currencyConceptId: dto.currencyConceptId,
        monthlyPremiumAmount: dto.monthlyPremiumAmount,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        statusConceptId: INS.PLAN_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: plan.id };
    });
  }

  /**
   * Crea create benefit.
   *
   * @param planId - Identificador de plan.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create benefit conforme al contrato `Promise<CreatedResourceDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async createBenefit(
    planId: string,
    dto: CreatePlanBenefitDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      const plan = await this.repo.findPlanForCarrier(tx, planId, carrier.id);
      if (!plan)
        throw new ResourceNotFoundException('Plan no encontrado', { planId });
      const benefit = this.repo.createBenefit(tx, {
        insurancePlanId: planId,
        benefitCategoryConceptId: dto.benefitCategoryConceptId,
        serviceConceptId: dto.serviceConceptId,
        coveragePercent: dto.coveragePercent,
        copayAmount: dto.copayAmount,
        deductibleAmount: dto.deductibleAmount,
        annualLimitAmount: dto.annualLimitAmount,
        requiresPriorAuthorization: dto.requiresPriorAuthorization ?? false,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : new Date(),
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        statusConceptId: INS.BENEFIT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: benefit.id };
    });
  }

  /**
   * Declara (o quita, con `null`) la prima de lista mensual de un plan del
   * carrier del tenant activo — v4.2.14, subtarea 3.1.
   *
   * `administrableCarrier()` no mira el `:planId`: la pertenencia del plan a la
   * aseguradora la resuelve `findPlanForCarrier`, y un plan ajeno o inexistente
   * responde el mismo 404 (no se filtra existencia).
   */
  async updatePlanPremium(
    planId: string,
    dto: UpdatePlanPremiumDto,
    actor: AuthenticatedUser,
  ): Promise<PlanPremiumDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      const plan = await this.repo.findPlanForCarrier(tx, planId, carrier.id);
      if (!plan) {
        throw new ResourceNotFoundException('Plan no encontrado', { planId });
      }
      plan.monthlyPremiumAmount = dto.monthlyPremiumAmount ?? undefined;
      touch(plan, actor.id);
      await tx.flush();
      this.logger.info(
        {
          planId,
          carrierId: carrier.id,
          hasPremium: dto.monthlyPremiumAmount !== null,
        },
        'Prima de lista del plan actualizada',
      );
      return {
        id: plan.id,
        monthlyPremiumAmount: plan.monthlyPremiumAmount ?? null,
      };
    });
  }

  /** Reemplaza los cuatro valores económicos administrables de una cobertura. */
  async updateBenefit(
    planId: string,
    benefitId: string,
    dto: UpdatePlanBenefitDto,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      const benefit = await this.repo.findBenefitForPlanAndCarrier(
        tx,
        planId,
        benefitId,
        carrier.id,
      );
      if (!benefit) {
        throw new ResourceNotFoundException('Beneficio no encontrado', {
          planId,
          benefitId,
        });
      }

      Object.assign(benefit, {
        coveragePercent: dto.coveragePercent,
        copayAmount: dto.copayAmount,
        deductibleAmount: dto.deductibleAmount,
        annualLimitAmount: dto.annualLimitAmount,
      });
      touch(benefit, actor.id);
      await tx.flush();
      return { ok: true };
    });
  }

  /** Reemplaza las reglas tipadas y conserva cualquier clave ajena ya persistida. */
  async updateBenefitRules(
    planId: string,
    benefitId: string,
    dto: UpdatePlanBenefitRulesDto,
    actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.administrableCarrier(tx, actor);
      const benefit = await this.repo.findBenefitForPlanAndCarrier(
        tx,
        planId,
        benefitId,
        carrier.id,
      );
      if (!benefit) {
        throw new ResourceNotFoundException('Beneficio no encontrado', {
          planId,
          benefitId,
        });
      }

      const current = plainObject(benefit.eligibilityRuleJson);
      const next: Record<string, unknown> = {
        ...current,
        requiredDocuments: [...dto.requiredDocuments],
      };
      if (dto.exclusionNotes === null) delete next.exclusionNotes;
      else next.exclusionNotes = dto.exclusionNotes;

      benefit.requiresPriorAuthorization = dto.requiresPriorAuthorization;
      benefit.eligibilityRuleJson = next;
      touch(benefit, actor.id);
      await tx.flush();
      return { ok: true };
    });
  }

  /** Exige tenant y administración antes de resolver recursos del catálogo. */
  private async administrableCarrier(
    tx: EntityManager,
    actor: AuthenticatedUser,
  ): Promise<InsuranceCarriers> {
    const tenantId = requireTenantId();
    await this.tenantAdministration.assertCanAdminister(tx, tenantId, actor);
    const carrier = await this.repo.findCarrierByTenantId(tx, tenantId);
    if (!carrier) {
      throw new ResourceNotFoundException('Aseguradora no encontrada', {
        tenantId,
      });
    }
    return carrier;
  }

  /**
   * Crea create provider network.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create provider network conforme al contrato `Promise<CreatedResourceDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async createProviderNetwork(
    dto: CreateProviderNetworkDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const carrier = await this.repo.findCarrier(tx, dto.insuranceCarrierId);
      if (!carrier)
        throw new ResourceNotFoundException('Aseguradora no encontrada', {
          carrierId: dto.insuranceCarrierId,
        });
      const network = this.repo.createProviderNetwork(tx, {
        insuranceCarrierId: dto.insuranceCarrierId,
        networkCode: dto.networkCode,
        name: dto.name,
        networkTypeConceptId: INS.NETWORK_TYPE_PPO,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        statusConceptId: INS.NETWORK_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: network.id };
    });
  }

  /**
   * Crea create broker.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create broker conforme al contrato `Promise<CreatedResourceDto>`.
   */
  async createBroker(
    dto: CreateBrokerDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const broker = this.repo.createBroker(tx, {
        tenantId: dto.tenantId,
        brokerCode: dto.brokerCode,
        legalName: dto.legalName,
        licenseNumber: dto.licenseNumber,
        verificationStatusConceptId: INS.VERIFY_PENDING,
        statusConceptId: INS.BROKER_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: broker.id };
    });
  }

  /**
   * Crea create employer group.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create employer group conforme al contrato `Promise<CreatedResourceDto>`.
   */
  async createEmployerGroup(
    dto: CreateEmployerGroupDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const group = this.repo.createEmployerGroup(tx, {
        tenantId: dto.tenantId,
        groupCode: dto.groupCode,
        legalName: dto.legalName,
        statusConceptId: INS.EMPLOYER_GROUP_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: group.id };
    });
  }

  /**
   * Crea create agreement.
   *
   * @param brokerId - Identificador de broker.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create agreement conforme al contrato `Promise<CreatedResourceDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  async createAgreement(
    brokerId: string,
    dto: CreateBrokerAgreementDto,
    actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.em.transactional(async (tx) => {
      const broker = await this.repo.findBroker(tx, brokerId);
      if (!broker)
        throw new ResourceNotFoundException('Broker no encontrado', {
          brokerId,
        });
      const carrier = await this.repo.findCarrier(tx, dto.insuranceCarrierId);
      if (!carrier)
        throw new ResourceNotFoundException('Aseguradora no encontrada', {
          carrierId: dto.insuranceCarrierId,
        });
      const agreement = this.repo.createAgreement(tx, {
        insuranceBrokerId: brokerId,
        insuranceCarrierId: dto.insuranceCarrierId,
        agreementCode: dto.agreementCode,
        commissionModelConceptId: INS.COMMISSION_MODEL_FLAT,
        effectiveFrom: dto.effectiveFrom
          ? new Date(dto.effectiveFrom)
          : undefined,
        effectiveTo: dto.effectiveTo ? new Date(dto.effectiveTo) : undefined,
        statusConceptId: INS.AGREEMENT_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      return { id: agreement.id };
    });
  }

  /** UC-26-01: alta de membresía de prestador en una red activa y vigente. */
  async addMembership(
    networkId: string,
    dto: CreateMembershipDto,
    actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    this.logger.info(
      { operation: 'insurance.membership.add', networkId, actorId: actor.id },
      'Adding network membership',
    );
    return this.em.transactional(async (tx) => {
      const network = await this.repo.findProviderNetwork(tx, networkId);
      if (!network)
        throw new ResourceNotFoundException(
          'Red de prestadores no encontrada',
          { networkId },
        );
      if (network.statusConceptId !== INS.NETWORK_ACTIVE) {
        throw new PreconditionFailedException('La red no está activa', {
          networkId,
        });
      }
      if (network.effectiveTo && network.effectiveTo.getTime() < Date.now()) {
        throw new PreconditionFailedException('La red está fuera de vigencia', {
          networkId,
        });
      }
      const membership = this.repo.createMembership(tx, {
        providerNetworkId: networkId,
        providerTypeConceptId: INS.PROVIDER_TYPE_PRACTICE,
        providerEntityId: dto.providerEntityId,
        practiceId: dto.practiceId,
        participationLevelConceptId: INS.PARTICIPATION_IN_NETWORK,
        contractReference: dto.contractReference,
        verificationStatusConceptId: INS.VERIFY_PENDING,
        statusConceptId: INS.MEMBERSHIP_ACTIVE,
        actorUserId: actor.id,
      });
      await tx.flush();
      this.logger.info(
        { operation: 'insurance.membership.add', membershipId: membership.id },
        'Membership added',
      );
      return {
        id: membership.id,
        status: membership.statusConceptId,
        createdAt: membership.createdAt,
      };
    });
  }
}

/** Normaliza JSON desconocido a un objeto propio seguro para extender. */
function plainObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? { ...(value as Record<string, unknown>) }
    : {};
}
