import {
  Body,
  Controller,
  Delete,
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
  ApiCreatedResponse,
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
import {
  CareSpacesAdminService,
  InfrastructureReadService,
} from '../services';
import {
  AssignmentRemovedDto,
  CareSpaceDetailDto,
  CreateUnitAssignmentDto,
  LifecycleChangeDto,
  MoveCareSpaceDto,
  RetireCheckDto,
  SpaceUnitAssignmentDto,
  UpdateCareSpaceDto,
} from '../dto';

const IF_MATCH = {
  name: 'If-Match',
  required: true,
  description: 'rowVersion leída (3, "3" o W/"3"). Ausente o distinta: 412',
};

/**
 * Espacios de atención por id (F1, contrato §3). Sin `@Roles`: la
 * autorización es por tenant y por sede en el servicio (`StructureAccessService`);
 * un espacio de otro tenant responde 404.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('care-spaces')
export class CareSpacesController {
  constructor(
    private readonly read: InfrastructureReadService,
    private readonly admin: CareSpacesAdminService,
  ) {}

  /** Ficha del espacio: camino, hijos, vínculos y recuentos derivados. */
  @Get(':id')
  @ApiOperation({ summary: 'Ficha de un espacio de atención' })
  @ApiOkResponse({ type: CareSpaceDetailDto })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceDetailDto> {
    return this.read.spaceDetail(id, actor, requireTenantId());
  }

  /** Editar descriptivos y atributos; `code`/`formCode` sólo en PLANNED. */
  @Audited({ action: 'CARE_SPACE_UPDATED', entity: 'care_space', entityId: 'param:id' })
  @Patch(':id')
  @ApiOperation({ summary: 'Editar un espacio de atención' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CareSpaceDetailDto })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareSpaceDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceDetailDto> {
    return this.admin.update(id, dto, ifMatch, actor, requireTenantId());
  }

  /** Mover bajo otro padre (regla padre→hijo y anti-ciclo). */
  @Audited({ action: 'CARE_SPACE_MOVED', entity: 'care_space', entityId: 'param:id' })
  @Post(':id/move')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mover un espacio de atención' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CareSpaceDetailDto })
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveCareSpaceDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceDetailDto> {
    return this.admin.move(id, dto, ifMatch, actor, requireTenantId());
  }

  /** Activar, suspender, reactivar o retirar (409 con bloqueos). */
  @Audited({
    action: 'CARE_SPACE_LIFECYCLE_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post(':id/lifecycle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cambiar el ciclo de vida de un espacio' })
  @ApiHeader(IF_MATCH)
  @ApiOkResponse({ type: CareSpaceDetailDto })
  lifecycle(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LifecycleChangeDto,
    @Headers('if-match') ifMatch: string | undefined,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceDetailDto> {
    return this.admin.changeLifecycle(id, dto, ifMatch, actor, requireTenantId());
  }

  /** Lo que impediría retirarlo, para mostrar antes de confirmar. */
  @Get(':id/retire-check')
  @ApiOperation({ summary: 'Bloqueos para retirar un espacio' })
  @ApiOkResponse({ type: RetireCheckDto })
  retireCheck(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetireCheckDto> {
    return this.admin.retireCheck(id, actor, requireTenantId());
  }

  /** Vincular a una unidad clínica (un solo OWNER vigente). */
  @Audited({
    action: 'CARE_SPACE_UNIT_ASSIGNED',
    entity: 'space_unit_assignment',
    entityId: 'result.id',
  })
  @Post(':id/unit-assignments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular un espacio a una unidad clínica' })
  @ApiCreatedResponse({ type: SpaceUnitAssignmentDto })
  addAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateUnitAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SpaceUnitAssignmentDto> {
    return this.admin.addAssignment(id, dto, actor, requireTenantId());
  }

  /** Cerrar un vínculo vigente (no se borra: queda con `valid_to`). */
  @Audited({
    action: 'CARE_SPACE_UNIT_UNASSIGNED',
    entity: 'space_unit_assignment',
    entityId: 'param:assignmentId',
  })
  @Delete(':id/unit-assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desvincular un espacio de una unidad clínica' })
  @ApiOkResponse({ type: AssignmentRemovedDto })
  removeAssignment(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssignmentRemovedDto> {
    return this.admin.removeAssignment(id, assignmentId, actor, requireTenantId());
  }
}
