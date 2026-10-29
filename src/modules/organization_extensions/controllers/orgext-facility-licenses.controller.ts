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
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { OrgextFacilityLicensesService } from '../services';
import {
  CreateFacilityLicenseDto,
  VerifyLicenseDto,
  FacilityLicenseResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints de licencias de instalación (UC-22-05..06). Capa fina: valida
 * parámetros y delega en el servicio de dominio.
 */
@ApiTags('orgext-facility-licenses')
@ApiBearerAuth()
@Controller('orgext/facility-licenses')
export class OrgextFacilityLicensesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param licensesService - Valor de licenses service requerido por la operación.
   */
  constructor(
    private readonly licensesService: OrgextFacilityLicensesService,
  ) {}

  /** UC-22-05. */
  @Audited({
    action: 'FACILITY_LICENSE_REGISTERED',
    entity: 'facility_license',
    entityId: 'result.id',
  })
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar licencia de instalación' })
  register(
    @Body() dto: CreateFacilityLicenseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FacilityLicenseResponseDto> {
    return this.licensesService.register(dto, actor);
  }

  /** UC-22-06. */
  @Audited({
    action: 'FACILITY_LICENSE_VERIFIED',
    entity: 'facility_license',
    entityId: 'param:id',
  })
  @Post(':id/verify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar / rechazar licencia' })
  verify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyLicenseDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.licensesService.verify(id, dto, actor);
  }
}
