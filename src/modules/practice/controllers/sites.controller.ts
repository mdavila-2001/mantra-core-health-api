import {
  Body,
  Controller,
  Get,
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
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { ClinicalStructureService, PracticeSitesService } from '../services';
import {
  CreateClinicalUnitDto,
  CreateCareSpaceDto,
  ClinicalUnitResponseDto,
  CareSpaceResponseDto,
  CareSpaceSummaryDto,
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
   * @param sitesService - Lecturas de la estructura (prácticas, sedes, espacios).
   */
  constructor(
    private readonly structureService: ClinicalStructureService,
    private readonly sitesService: PracticeSitesService,
  ) {}

  /**
   * UC-14-04.
   *
   * Sin `@Roles`: el dueño de una organización entra con rol global `USER` y
   * su poder es la membresía OWNER/ADMIN. La autorización la hace el servicio
   * (`TenantAdministrationService.assertCanAdminister`), y una sede de otro
   * tenant responde 404.
   */
  @Audited({
    action: 'CLINICAL_UNIT_CREATED',
    entity: 'clinical_unit',
    entityId: 'result.id',
  })
  @Post(':siteId/clinical-units')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una unidad clínica jerárquica' })
  createClinicalUnit(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateClinicalUnitDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ClinicalUnitResponseDto> {
    return this.structureService.createClinicalUnit(
      siteId,
      dto,
      actor,
      requireTenantId(),
    );
  }

  /**
   * Espacios de atención de la sede: quirófanos, consultas y boxes.
   *
   * Es el listado que resuelve el `operatingRoomId` de
   * `POST /procedure-cases`. Sin él, programar una intervención exigía conocer
   * de memoria el uuid de una fila que ninguna operación devolvía.
   */
  @Get(':siteId/care-spaces')
  @Roles(
    'SECURITY_ADMIN',
    'SURGERY_SCHEDULER',
    'PERIOP_ADMIN',
    'SURGEON',
    'ANESTHESIOLOGIST',
    'PERIOP_NURSE',
    'SCHEDULING_ADMIN',
  )
  @ApiOperation({ summary: 'Listar los espacios de atención de la sede' })
  listCareSpaces(
    @Param('siteId', ParseUUIDPipe) siteId: string,
  ): Promise<CareSpaceSummaryDto[]> {
    return this.sitesService.listCareSpaces(siteId, requireTenantId());
  }

  /** UC-14-05. Misma autorización que `createClinicalUnit`. */
  @Audited({
    action: 'CARE_SPACE_CREATED',
    entity: 'care_space',
    entityId: 'result.id',
  })
  @Post(':siteId/care-spaces')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un espacio de atención bajo una unidad/sitio',
  })
  createCareSpace(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: CreateCareSpaceDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceResponseDto> {
    return this.structureService.createCareSpace(
      siteId,
      dto,
      actor,
      requireTenantId(),
    );
  }
}
