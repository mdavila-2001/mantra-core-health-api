import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PlatformScopeOptional } from '../../../common/tenant/platform-scope';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import { AccessLogged } from '../../../common/audit-trail';
import { DsarListQueryDto } from '../dto/audit-oversight.dto';
import { AuditOversightReadService } from '../services/audit-oversight-read.service';
import { ComplianceService } from '../services';
import { AUDIT_READ_ROLES } from './audit-query.controller';
import { CreateDsarDto, UpdateDsarDto, DsarResponseDto } from '../dto';

/** Endpoints DSAR del titular sobre `/privacy/*` (UC-10-08). */
@ApiTags('audit-privacy')
@ApiBearerAuth()
@Controller('privacy')
export class PrivacyController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param complianceService - Valor de compliance service requerido por la operación.
   */
  constructor(
    private readonly complianceService: ComplianceService,
    private readonly oversight: AuditOversightReadService,
  ) {}

  /**
   * Lectura de las solicitudes DSAR. `@PlatformScopeOptional()` va por método (no en la clase: el
   * `POST`/`PATCH` sí exigen una organización). `dsar_requests` no tiene tenant: es del titular.
   * Cada lectura queda sellada en `data_access_log` (identifica a titulares).
   */
  @Get('dsar')
  @Roles(...AUDIT_READ_ROLES)
  @PlatformScopeOptional()
  @PlatformTenantOptional(...AUDIT_READ_ROLES, 'SUPERADMIN')
  @AccessLogged({ resourceType: 'DSAR_REQUEST', purpose: 'SECURITY_OVERSIGHT' })
  @ApiOperation({ summary: 'Solicitudes DSAR, la más reciente primero' })
  listDsar(@Query() q: DsarListQueryDto) {
    return this.oversight.dsarList(q);
  }

  @Get('dsar/:id')
  @Roles(...AUDIT_READ_ROLES)
  @PlatformScopeOptional()
  @PlatformTenantOptional(...AUDIT_READ_ROLES, 'SUPERADMIN')
  @AccessLogged({ resourceType: 'DSAR_REQUEST', purpose: 'SECURITY_OVERSIGHT' })
  @ApiOperation({ summary: 'Una solicitud DSAR (sin el archivo resultante)' })
  getDsar(@Param('id', ParseUUIDPipe) id: string) {
    return this.oversight.dsar(id);
  }

  /** UC-10-08 (alta). */
  @Audited({
    action: 'DSAR_INTAKE',
    entity: 'dsar_request',
    entityId: 'result.id',
  })
  @Post('dsar')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tramitar DSAR (solicitud del titular)' })
  createDsar(
    @Body() dto: CreateDsarDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DsarResponseDto> {
    return this.complianceService.createDsar(dto, actor);
  }

  /** UC-10-08 (transición de estado). */
  @Audited({
    action: 'DSAR_UPDATE',
    entity: 'dsar_request',
    entityId: 'param:id',
  })
  @Patch('dsar/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Avanzar la máquina de estados de una solicitud DSAR',
  })
  updateDsar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDsarDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DsarResponseDto> {
    return this.complianceService.updateDsar(id, dto, actor);
  }
}
