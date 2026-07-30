import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { OrgextHospitalsService } from '../services';
import {
  CreateHospitalDto,
  ActivateHospitalDto,
  CreateServiceLineDto,
  HospitalResponseDto,
  ServiceLineResponseDto,
  StatusResultDto,
} from '../dto';

/**
 * Endpoints de gestión de hospitales y sus líneas de servicio (UC-22-01..04).
 * Capa fina: valida parámetros y delega en el servicio de dominio.
 */
@ApiTags('orgext-hospitals')
@ApiBearerAuth()
@Controller('orgext/hospitals')
export class OrgextHospitalsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param hospitalsService - Valor de hospitals service requerido por la operación.
   */
  constructor(private readonly hospitalsService: OrgextHospitalsService) {}

  /** UC-22-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Especializar practice/tenant como hospital' })
  specialize(
    @Body() dto: CreateHospitalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HospitalResponseDto> {
    return this.hospitalsService.specialize(dto, actor);
  }

  /** UC-22-02. */
  @Post(':id/activate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activar hospital y publicar perfil' })
  activate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActivateHospitalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<HospitalResponseDto> {
    return this.hospitalsService.activate(id, dto, actor);
  }

  /** UC-22-03. */
  @Post(':id/service-lines')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir línea de servicio hospitalaria' })
  addServiceLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateServiceLineDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceLineResponseDto> {
    return this.hospitalsService.addServiceLine(id, dto, actor);
  }

  /** UC-22-04. */
  @Delete(':id/service-lines/:lineId')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar (soft-delete) línea de servicio' })
  retireServiceLine(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('lineId', ParseUUIDPipe) lineId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.hospitalsService.retireServiceLine(id, lineId, actor);
  }
}
