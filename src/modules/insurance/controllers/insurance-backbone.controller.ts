import { Body, Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
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
  constructor(private readonly service: InsuranceBackboneService) {}

  @Post('insurance-carriers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de aseguradora (soporte)' })
  createCarrier(@Body() dto: CreateCarrierDto, @CurrentUser() actor: AuthenticatedUser): Promise<ResourceStatusDto> {
    return this.service.createCarrier(dto, actor);
  }

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

  @Post('insurance-products/:id/plans')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de plan (soporte)' })
  createPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePlanDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createPlan(id, dto, actor);
  }

  @Post('insurance-plans/:id/benefits')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de beneficio de plan (soporte)' })
  createBenefit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePlanBenefitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.service.createBenefit(id, dto, actor);
  }

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

  @Post('insurance-brokers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Alta de broker (soporte)' })
  createBroker(@Body() dto: CreateBrokerDto, @CurrentUser() actor: AuthenticatedUser): Promise<CreatedResourceDto> {
    return this.service.createBroker(dto, actor);
  }

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
