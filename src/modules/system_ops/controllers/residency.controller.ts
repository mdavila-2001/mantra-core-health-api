import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
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
  constructor(private readonly service: ResidencyService) {}

  /** UC-11-06. */
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
  @Post('cross-border-transfers')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar una transferencia transfronteriza (append-only)' })
  recordTransfer(
    @Body() dto: CreateCrossBorderTransferDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResultDto> {
    return this.service.recordTransfer(dto, actor);
  }
}
