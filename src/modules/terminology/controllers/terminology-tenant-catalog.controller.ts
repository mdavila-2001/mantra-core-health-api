import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { TenantCatalogService } from '../services';
import {
  TenantCatalogPolicyResponseDto,
  UpsertTenantCatalogPolicyDto,
} from '../dto';

/**
 * Política de catálogo por tenant (UC-03-12). Reservada a `SECURITY_ADMIN`: define
 * qué parte del catálogo global ve el tenant y con qué nombres.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/tenants')
export class TerminologyTenantCatalogController {
  constructor(private readonly tenantCatalogService: TenantCatalogService) {}

  @Put(':tenantId/catalog-policies')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-12: define la política de catálogo del tenant',
  })
  upsertPolicy(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: UpsertTenantCatalogPolicyDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TenantCatalogPolicyResponseDto> {
    return this.tenantCatalogService.upsertPolicy(tenantId, dto, user);
  }
}
