import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { EquipmentF5aService } from '../services/equipment-f5a.service';
import { DiagnosticEquipmentService } from '../services';
import { EquipmentResponseDto, UpdateEquipmentDto } from '../dto';

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
  constructor(
    private readonly equipmentService: DiagnosticEquipmentService,
    private readonly f5a: EquipmentF5aService,
  ) {}

  /** F5a: detalle del equipo con su sala, AE Title y recurso. */
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de un equipo con su sala (F5a)' })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.f5a.detail(id, actor);
  }

  /** F5a: recurso agendable `RES_EQUIPMENT` del equipo (409 si ya existe). */
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_RESOURCE_CREATED',
    entity: 'diagnostic_equipment',
    entityId: 'param:id',
  })
  @Post(':id/resource')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear el recurso agendable del equipo (F5a)' })
  createResource(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.f5a.createResource(id, actor);
  }

  /** F5a: estación de la Worklist DICOM (Scheduled Station AE Title/Name, SPS Location). */
  @Get(':id/mwl-station')
  @ApiOperation({ summary: 'Estación MWL del equipo (F5a)' })
  mwlStation(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.f5a.mwlStation(id, actor);
  }

  /** UC-23-09. */
  @Audited({
    action: 'DIAGNOSTIC_EQUIPMENT_UPDATED',
    entity: 'diagnostic_equipment',
    entityId: 'param:id',
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar estado/calibración de un equipo' })
  updateEquipment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEquipmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EquipmentResponseDto> {
    return this.equipmentService.updateEquipment(id, dto, actor);
  }
}
