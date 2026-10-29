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
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import { ClinicalUnitsService, type ClinicalUnitDetail } from '../services';
import { LifecycleDto, UpdateClinicalUnitDto } from '../dto';
import { CorrelationId, IfMatch } from '../http/request-decorators';

const IF_MATCH = {
  name: 'If-Match',
  required: true,
  description:
    'rowVersion vigente del recurso (412 si no coincide, 428 si falta)',
};

/** Unidades clínicas (árbol organizativo) por id: ficha, edición y ciclo de vida. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('clinical-units')
export class ClinicalUnitsController {
  /**
   * @param units - Casos de uso de unidades.
   */
  constructor(private readonly units: ClinicalUnitsService) {}

  /** Ficha de la unidad: hijos y espacios vinculados. */
  @Get(':id')
  @ApiOperation({ summary: 'Ficha de una unidad clínica' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitDetail> {
    return this.units.get(id, actor);
  }

  /** Edita nombre, descripción y responsable. */
  @Audited({
    action: 'CLINICAL_UNIT_UPDATED',
    entity: 'clinical_unit',
    entityId: 'param:id',
  })
  @Patch(':id')
  @ApiHeader(IF_MATCH)
  @ApiOperation({ summary: 'Editar una unidad clínica (If-Match)' })
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicalUnitDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<ClinicalUnitDetail> {
    return this.units.patch(id, dto, expectedVersion, actor, correlationId);
  }

  /** Activa, suspende, reactiva o clausura. Con hijos, espacios o personal activos no se retira. */
  @Audited({
    action: 'CLINICAL_UNIT_LIFECYCLE_CHANGED',
    entity: 'clinical_unit',
    entityId: 'param:id',
  })
  @Post(':id/lifecycle')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH)
  @ApiOperation({
    summary: 'Cambiar el ciclo de vida de una unidad (If-Match)',
  })
  @ApiResponse({
    status: 409,
    description: 'UNIT_RETIRE_BLOCKED con `blockers`',
  })
  lifecycle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LifecycleDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<ClinicalUnitDetail> {
    return this.units.lifecycle(
      id,
      dto.action,
      dto.reason,
      expectedVersion,
      actor,
      correlationId,
    );
  }
}
