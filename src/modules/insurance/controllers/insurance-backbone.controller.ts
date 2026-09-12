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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { InsuranceBackboneService } from '../services';
import {
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
  ResourceStatusDto,
  OkResultDto,
  UpdatePlanBenefitDto,
  UpdatePlanBenefitRulesDto,
} from '../dto';

/**
 * Backbone del aseguramiento (catálogo de aseguradoras/productos/planes/redes/
 * brokers) y UC-26-01 (alta de membresía de prestador en red). Capa fina: valida
 * parámetros y delega en el servicio. Operaciones administrativas → SECURITY_ADMIN.
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
   * Crea create product.
   *
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create product conforme al contrato `Promise<CreatedResourceDto>`.
   */
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
  @Post('insurance-products/:productId/plans')
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
  @Post('insurance-plans/:planId/benefits')
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
  @Put('insurance-plans/:planId/benefits/:benefitId')
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
  @Put('insurance-plans/:planId/benefits/:benefitId/rules')
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
   * Crea create provider network.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create provider network conforme al contrato `Promise<CreatedResourceDto>`.
   */
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
