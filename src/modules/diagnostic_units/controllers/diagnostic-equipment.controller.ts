import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
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
  constructor(private readonly equipmentService: DiagnosticEquipmentService) {}

  /** UC-23-09. */
  @Patch(':id')
  @Roles('SECURITY_ADMIN')
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
