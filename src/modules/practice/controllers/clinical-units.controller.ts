import {
  Body,
  Controller,
  Get,
  Headers,
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
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalUnitsAdminService } from '../services';
import {
  ClinicalUnitDetailDto,
  LifecycleChangeDto,
  UpdateClinicalUnitDto,
} from '../dto';

const IF_MATCH = {
  name: 'If-Match',
  required: true,
  description: 'rowVersion leída. Ausente o distinta: 412',
};

/** Unidades clínicas por id (F1, contrato §3). Autorización en el servicio. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('clinical-units')
export class ClinicalUnitsController {
  constructor(private readonly units: ClinicalUnitsAdminService) {}

  /** Ficha de la unidad: hijas, espacios y vínculos. */
  @Get(':id')
  @ApiOperation({ summary: 'Ficha de una unidad clínica' })
  @ApiOkResponse({ type: ClinicalUnitDetailDto })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitDetailDto> {
    return this.units.detail(id, actor, requireTenantId());
  }

  /** Editar la unidad. */
  @Audited({
    action: 'CLINICAL_UNIT_UPDATED',
    entity: 'clinical_unit',
    entityId: 'param:id',
  })
  @Patch(':id')
  @ApiOperation({ summary: 'Editar una unidad clínica' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: ClinicalUnitDetailDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateClinicalUnitDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitDetailDto> {
    return this.units.update(id, dto, ifMatch, actor, requireTenantId());
  }

  /** Cambiar el ciclo de vida (409 con bloqueos). */
  @Audited({
    action: 'CLINICAL_UNIT_LIFECYCLE_CHANGED',
    entity: 'clinical_unit',
    entityId: 'param:id',
  })
  @Post(':id/lifecycle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el ciclo de vida de una unidad clínica' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: ClinicalUnitDetailDto })
  lifecycle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LifecycleChangeDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitDetailDto> {
    return this.units.changeLifecycle(
      id,
      dto,
      ifMatch,
      actor,
      requireTenantId(),
    );
  }
}
