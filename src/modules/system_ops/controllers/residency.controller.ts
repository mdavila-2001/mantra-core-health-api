import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { ResidencyService } from '../services';
import {
  CreateCrossBorderTransferDto,
  CreateResidencyPolicyDto,
  CreateTenantResidencyBindingDto,
  IdResultDto,
} from '../dto';

/**
 * Endpoints de residencia de datos (UC-11-06) y transferencias transfronterizas
 * (UC-11-07).
 */
@ApiTags('system-ops-residency')
@ApiBearerAuth()
@Controller('admin/governance')
export class ResidencyController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: ResidencyService) {}

  /** UC-11-06. */
  @Audited({
    action: 'DATA_RESIDENCY_POLICY_CREATED',
    entity: 'data_residency_policy',
    entityId: 'result.id',
  })
  @Post('residency-policies')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir una política de residencia de datos' })
  createResidencyPolicy(
    @Body() dto: CreateResidencyPolicyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.createResidencyPolicy(dto, actor);
  }

  /** UC-11-06. */
  @Audited({
    action: 'TENANT_RESIDENCY_BOUND',
    entity: 'tenant_residency_binding',
    entityId: 'result.id',
  })
  @Post('tenant-residency-bindings')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular un tenant a una política de residencia' })
  createBinding(
    @Body() dto: CreateTenantResidencyBindingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.createBinding(dto, actor);
  }

  /** UC-11-07. */
  @Audited({
    action: 'CROSS_BORDER_TRANSFER_RECORDED',
    entity: 'cross_border_transfer_event',
    entityId: 'result.id',
  })
  @Post('cross-border-transfers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una transferencia transfronteriza (append-only)',
  })
  recordTransfer(
    @Body() dto: CreateCrossBorderTransferDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.recordTransfer(dto, actor);
  }
}
