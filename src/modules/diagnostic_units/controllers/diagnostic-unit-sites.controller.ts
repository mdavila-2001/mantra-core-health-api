import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  DiagnosticUnitsService,
  DiagnosticEquipmentService,
} from '../services';
import {
  CreateEquipmentDto,
  EquipmentResponseDto,
  SiteResponseDto,
  UpdateSiteDto,
} from '../dto';

/**
 * Endpoints sobre `/diagnostic-unit-sites`: actualización de un sitio (UC-23-02)
 * y registro de equipamiento en el sitio (UC-23-09).
 */
@ApiTags('diagnostic-unit-sites')
@ApiBearerAuth()
@Controller('diagnostic-unit-sites')
export class DiagnosticUnitSitesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param unitsService - Valor de units service requerido por la operación.
   * @param equipmentService - Valor de equipment service requerido por la operación.
   */
  constructor(
    private readonly unitsService: DiagnosticUnitsService,
    private readonly equipmentService: DiagnosticEquipmentService,
  ) {}

  /** UC-23-02. */
  @Patch(':siteId')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar un sitio operativo de la unidad' })
  updateSite(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: UpdateSiteDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SiteResponseDto> {
    return this.unitsService.updateSite(siteId, dto, actor);
  }

  /** UC-23-09. */
  @Post(':siteId/equipment')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar equipamiento y calibración del sitio' })
  addEquipment(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateEquipmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.addEquipment(siteId, dto, actor);
  }
}
