import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../../common';
import { InsuranceBackboneService } from '../../application/services';
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
  CreatedResourceDto,
  PlanPremiumDto,
  ResourceStatusDto,
  OkResultDto,
  UpdateCarrierContactChannelsDto,
  UpdatePlanBenefitDto,
  UpdatePlanBenefitRulesDto,
  UpdatePlanPremiumDto,
} from '../dto';

/**
 * Backbone del aseguramiento (catálogo de aseguradoras/productos/planes/redes/
 * brokers) y UC-26-01 (alta de membresía de prestador en red). Capa fina: valida
 * parámetros y delega en el servicio. Operaciones administrativas → SECURITY_ADMIN.
 *
 * Las rutas con `@Roles()` vacío (O3-3) son las de la aseguradora sobre su
 * propio catálogo: `administrableCarrier` exige ser OWNER/ADMIN del tenant
 * activo (o plataforma) y acota el plan o producto a esa aseguradora.
 */
@ApiTags('insurance-backbone')
@ApiBearerAuth()
@Controller()
export class InsuranceBackboneController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: InsuranceBackboneService) {}

  /**
   * Crea create carrier.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create carrier conforme al contrato `Promise<ResourceStatusDto>`.
   */
  @Audited({
    action: 'INSURANCE_CARRIER_CREATED',
    entity: 'insurance_carrier',
    entityId: 'result.id',
  })
  @Post('insurance-carriers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de aseguradora (soporte)' })
  createCarrier(
    @Body() dto: CreateCarrierDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.createCarrier(dto, actor);
  }

  /**
   * Configura los canales de contacto directo de la aseguradora del tenant
   * activo (subtarea 2.3 — registro de procesos, Aseguradora 6.2 · ítem 5).
   *
   * `@Roles()` vacío (sin rol global), igual que `createPlan`/`updateBenefit`: los roles
   * "ADMINISTRATOR"/"OWNER" que pediría un pedido literal no existen en
   * `role-mapping.ts`. La barrera es la membresía OWNER/ADMIN del tenant de
   * la aseguradora (o ser plataforma), que resuelve el servicio.
   *
   * @param id - Aseguradora a editar; tiene que ser la del tenant activo.
   * @param dto - Los tres canales, reemplazo completo.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Los canales resultantes.
   */
  @Audited({
    action: 'INSURANCE_CARRIER_CONTACT_CHANNELS_UPDATED',
    entity: 'insurance_carrier',
    entityId: 'param:id',
  })
  @Put('insurance-carriers/:id/contact-channels')
  @Roles()
  @ApiOperation({
    summary:
      'Configurar los canales de contacto de la aseguradora del tenant activo',
  })
  @ApiOkResponse({ type: CarrierContactChannelsDto })
  updateContactChannels(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCarrierContactChannelsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CarrierContactChannelsDto> {
    return this.service.updateContactChannels(id, dto, actor);
  }

  /**
   * Crea create product.
   *
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create product conforme al contrato `Promise<CreatedResourceDto>`.
   */
  @Audited({
    action: 'INSURANCE_PRODUCT_CREATED',
    entity: 'insurance_product',
    entityId: 'result.id',
  })
  @Post('insurance-carriers/:id/products')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de producto de aseguradora (soporte)' })
  createProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProductDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createProduct(id, dto, actor);
  }

  /**
   * Crea create plan.
   *
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create plan conforme al contrato `Promise<CreatedResourceDto>`.
   */
  @Audited({
    action: 'INSURANCE_PLAN_CREATED',
    entity: 'insurance_plan',
    entityId: 'result.id',
  })
  @Post('insurance-products/:productId/plans')
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear un plan del carrier del tenant activo' })
  createPlan(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() dto: CreatePlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createPlan(productId, dto, actor);
  }

  /**
   * Crea create benefit.
   *
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create benefit conforme al contrato `Promise<CreatedResourceDto>`.
   */
  @Audited({
    action: 'INSURANCE_PLAN_BENEFIT_CREATED',
    entity: 'insurance_plan_benefit',
    entityId: 'result.id',
  })
  @Post('insurance-plans/:planId/benefits')
  @Roles()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una cobertura de un plan administrable' })
  createBenefit(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: CreatePlanBenefitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createBenefit(planId, dto, actor);
  }

  /** Reemplaza los importes administrables de una cobertura. */
  @Audited({
    action: 'INSURANCE_PLAN_BENEFIT_UPDATED',
    entity: 'insurance_plan_benefit',
    entityId: 'param:benefitId',
  })
  @Put('insurance-plans/:planId/benefits/:benefitId')
  @Roles()
  @ApiOperation({ summary: 'Editar importes de una cobertura' })
  updateBenefit(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('benefitId', ParseUUIDPipe) benefitId: string,
    @Body() dto: UpdatePlanBenefitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.service.updateBenefit(planId, benefitId, dto, actor);
  }

  /** Reemplaza autorización previa, documentos y exclusión. */
  @Audited({
    action: 'INSURANCE_PLAN_BENEFIT_RULES_UPDATED',
    entity: 'insurance_plan_benefit',
    entityId: 'param:benefitId',
  })
  @Put('insurance-plans/:planId/benefits/:benefitId/rules')
  @Roles()
  @ApiOperation({ summary: 'Editar reglas de aprobación de una cobertura' })
  updateBenefitRules(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Param('benefitId', ParseUUIDPipe) benefitId: string,
    @Body() dto: UpdatePlanBenefitRulesDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.service.updateBenefitRules(planId, benefitId, dto, actor);
  }

  /**
   * Subtarea 3.1 (v4.2.14) — la aseguradora declara la prima de lista mensual
   * de un plan que ya existe. Reemplazo completo de un solo valor; `null` la
   * quita. `@Roles()` vacío, como `createPlan`: la barrera es la membresía
   * OWNER/ADMIN del tenant de la aseguradora (`administrableCarrier`).
   */
  @Audited({
    action: 'INSURANCE_PLAN_PREMIUM_UPDATED',
    entity: 'insurance_plan',
    entityId: 'param:planId',
  })
  @Put('insurance-plans/:planId/premium')
  @Roles()
  @ApiOperation({
    summary: 'Declarar la prima de lista mensual de un plan administrable',
  })
  @ApiOkResponse({ type: PlanPremiumDto })
  updatePlanPremium(
    @Param('planId', ParseUUIDPipe) planId: string,
    @Body() dto: UpdatePlanPremiumDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PlanPremiumDto> {
    return this.service.updatePlanPremium(planId, dto, actor);
  }

  /**
   * Crea create provider network.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create provider network conforme al contrato `Promise<CreatedResourceDto>`.
   */
  @Audited({
    action: 'PROVIDER_NETWORK_CREATED',
    entity: 'provider_network',
    entityId: 'result.id',
  })
  @Post('provider-networks')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de red de prestadores (soporte)' })
  createProviderNetwork(
    @Body() dto: CreateProviderNetworkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createProviderNetwork(dto, actor);
  }

  /** UC-26-01. */
  @Audited({
    action: 'NETWORK_PROVIDER_MEMBERSHIP_ADDED',
    entity: 'network_provider_membership',
    entityId: 'result.id',
  })
  @Post('provider-networks/:id/memberships')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de membresía de prestador en la red' })
  addMembership(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateMembershipDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceStatusDto> {
    return this.service.addMembership(id, dto, actor);
  }

  /**
   * Crea create broker.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create broker conforme al contrato `Promise<CreatedResourceDto>`.
   */
  @Audited({
    action: 'INSURANCE_BROKER_CREATED',
    entity: 'insurance_broker',
    entityId: 'result.id',
  })
  @Post('insurance-brokers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de broker (soporte)' })
  createBroker(
    @Body() dto: CreateBrokerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createBroker(dto, actor);
  }

  /**
   * Crea create agreement.
   *
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create agreement conforme al contrato `Promise<CreatedResourceDto>`.
   */
  @Audited({
    action: 'BROKER_CARRIER_AGREEMENT_CREATED',
    entity: 'broker_carrier_agreement',
    entityId: 'result.id',
  })
  @Post('insurance-brokers/:id/agreements')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de acuerdo broker–aseguradora (soporte)' })
  createAgreement(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateBrokerAgreementDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createAgreement(id, dto, actor);
  }

  /**
   * Crea create employer group.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create employer group conforme al contrato `Promise<CreatedResourceDto>`.
   */
  @Audited({
    action: 'EMPLOYER_GROUP_CREATED',
    entity: 'employer_group',
    entityId: 'result.id',
  })
  @Post('employer-groups')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de grupo empleador (soporte)' })
  createEmployerGroup(
    @Body() dto: CreateEmployerGroupDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createEmployerGroup(dto, actor);
  }
}
