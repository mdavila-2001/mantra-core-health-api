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
import { ClinicalStructureService } from '../services';
import {
  CreateClinicalUnitDto,
  CreateCareSpaceDto,
  ClinicalUnitResponseDto,
  CareSpaceResponseDto,
} from '../dto';

/** Endpoints con raíz en `/sites`: estructura clínica bajo un sitio. */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('sites')
export class SitesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param structureService - Valor de structure service requerido por la operación.
   */
  constructor(private readonly structureService: ClinicalStructureService) {}

  /** UC-14-04. */
  @Post(':siteId/clinical-units')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una unidad clínica jerárquica' })
  createClinicalUnit(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateClinicalUnitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitResponseDto> {
    return this.structureService.createClinicalUnit(siteId, dto, actor);
  }

  /** UC-14-05. */
  @Post(':siteId/care-spaces')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un espacio de atención bajo una unidad/sitio',
  })
  createCareSpace(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateCareSpaceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceResponseDto> {
    return this.structureService.createCareSpace(siteId, dto, actor);
  }
}
