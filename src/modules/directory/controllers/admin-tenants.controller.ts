import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { DirectoryTenantsService } from '../services';
import {
  CreateTenantDto,
  StatusResultDto,
  SuspendTenantDto,
  TenantResponseDto,
  VerifyTenantDto,
} from '../dto';

/**
 * Endpoints de plataforma sobre `/admin/tenants`. Operaciones fuera del contexto
 * RLS de tenant (aprovisionamiento, verificación, suspensión). Capa fina que
 * delega en `DirectoryTenantsService`.
 */
@ApiTags('directory-admin-tenants')
@ApiBearerAuth()
@Controller('admin/tenants')
export class AdminTenantsController {
  constructor(private readonly tenantsService: DirectoryTenantsService) {}

  /** UC-04-01. */
  @Post()
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Aprovisionar un tenant raíz con su membership owner',
  })
  provision(
    @Body() dto: CreateTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.provision(dto, actor);
  }

  /** UC-04-02. */
  @Post(':tenantId/verification')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar y activar un tenant' })
  verify(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: VerifyTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TenantResponseDto> {
    return this.tenantsService.verify(tenantId, dto, actor);
  }

  /** UC-04-10. */
  @Post(':tenantId/suspend')
  @Roles('SUPERADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender un tenant con cascada de revocación' })
  suspend(
    @Param('tenantId', ParseUUIDPipe) tenantId: string,
    @Body() dto: SuspendTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.tenantsService.suspend(tenantId, dto, actor);
  }
}
