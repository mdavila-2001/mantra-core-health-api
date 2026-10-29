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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { DiagnosticEquipmentService } from '../services';
import {
  EquipmentResponseDto,
  LinkEquipmentResourceDto,
  MwlStationDto,
  UpdateEquipmentDto,
} from '../dto';

/** Endpoint sobre `/diagnostic-equipment`: actualización de equipo (UC-23-09). */
@ApiTags('diagnostic-equipment')
@ApiBearerAuth()
@Controller('diagnostic-equipment')
export class DiagnosticEquipmentController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param equipmentService - Valor de equipment service requerido por la operación.
   */
  constructor(private readonly equipmentService: DiagnosticEquipmentService) {}

  /**
   * UC-23-09 + F5a: estado, calibración, sala, AE Title y estación del equipo.
   *
   * Sin `@Roles` a propósito: quién puede lo decide el servicio contra el espacio del equipo
   * (administrador de la organización o de la sucursal; Mantenimiento sólo el estado; la
   * plataforma todo). Un equipo ajeno responde 404 y uno que el actor ve pero no puede tocar, 403.
   */
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_UPDATED',
    entity: 'diagnostic_equipment',
    entityId: 'param:id',
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Actualizar estado, calibración, sala y estación DICOM de un equipo',
  })
  updateEquipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.updateEquipment(id, dto, actor);
  }

  /** F5a: abre la agenda del equipo (recurso `EQUIPMENT` atado a su sala). */
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_RESOURCE_LINKED',
    entity: 'diagnostic_equipment',
    entityId: 'param:id',
  })
  @Post(':id/resource')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear el recurso agendable del equipo, atado a su sala',
  })
  linkResource(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LinkEquipmentResourceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<{ id: string; name: string; stateConceptId: string }> {
    return this.equipmentService.linkResource(id, dto, actor);
  }

  /** F5a: la estación DICOM del equipo (Modality Worklist). */
  @Get(':id/mwl-station')
  @ApiOperation({
    summary:
      'Estación DICOM del equipo: AE Title, nombre y sala (SPS Location)',
  })
  mwlStation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MwlStationDto> {
    return this.equipmentService.mwlStation(id, actor);
  }
}
