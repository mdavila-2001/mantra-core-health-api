import {
  Body,
  Controller,
  Delete,
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
import {
  CareSpaceLifecycleService,
  CareSpaceReadService,
  CareSpaceUpdateService,
  SpaceUnitAssignmentsService,
} from '../services';
import {
  CreateUnitAssignmentDto,
  LifecycleDto,
  MoveCareSpaceDto,
  UpdateCareSpaceDto,
} from '../dto';
import type {
  CareSpaceDetail,
  RetireCheck,
  SpaceUnitAssignmentView,
} from '../dto/infrastructure.types';
import { CorrelationId, IfMatch } from '../http/request-decorators';

const IF_MATCH = {
  name: 'If-Match',
  required: true,
  description:
    'rowVersion vigente del recurso (412 si no coincide, 428 si falta)',
};

/**
 * Espacios del árbol físico (`/care-spaces/:id`): ficha, edición, movimiento,
 * ciclo de vida, verificación de clausura y vínculos con unidades.
 *
 * Sin `@Roles`: la regla es de **organización y sucursal**, no de rol global, y
 * la decide `StructureAccessService` (un espacio de otro tenant o de otra
 * sucursal responde 404). No hay `DELETE` de espacio (INV-14): se clausura.
 */
@ApiTags('practice')
@ApiBearerAuth()
@Controller('care-spaces')
export class CareSpacesController {
  /**
   * @param reader - Lecturas.
   * @param updater - Edición y movimiento.
   * @param lifecycle - Ciclo de vida y clausura.
   * @param assignments - Vínculos con unidades.
   */
  constructor(
    private readonly reader: CareSpaceReadService,
    private readonly updater: CareSpaceUpdateService,
    private readonly lifecycle: CareSpaceLifecycleService,
    private readonly assignments: SpaceUnitAssignmentsService,
  ) {}

  /** Ficha del espacio: nodo, ruta, hijos, vínculos y recuentos derivados. */
  @Get(':id')
  @ApiOperation({
    summary: 'Ficha de un espacio (detalle, ruta, hijos, vínculos)',
  })
  @ApiResponse({
    status: 404,
    description: 'Espacio de otro tenant o fuera de la sucursal del actor',
  })
  detail(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CareSpaceDetail> {
    return this.reader.detail(id, actor);
  }

  /** Edita descriptivos y atributos. `code` y `formCode` son inmutables tras la activación. */
  @Audited({
    action: 'CARE_SPACE_UPDATED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Patch(':id')
  @ApiHeader(IF_MATCH)
  @ApiOperation({ summary: 'Editar un espacio (If-Match)' })
  @ApiResponse({ status: 412, description: 'rowVersion desactualizada' })
  @ApiResponse({
    status: 422,
    description: 'SPACE_IMMUTABLE_FIELD y reglas de forma/función/tipología',
  })
  patch(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCareSpaceDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<CareSpaceDetail> {
    return this.updater.patch(id, dto, expectedVersion, actor, correlationId);
  }

  /** Mueve el espacio (con su subárbol) bajo otro padre o a la raíz. */
  @Audited({
    action: 'CARE_SPACE_MOVED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post(':id/move')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH)
  @ApiOperation({ summary: 'Mover un espacio en el árbol (If-Match)' })
  @ApiResponse({
    status: 422,
    description: 'SPACE_CYCLE, SPACE_PARENT_RULE o PARENT_NOT_ACTIVE',
  })
  move(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoveCareSpaceDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<CareSpaceDetail> {
    return this.updater.move(
      id,
      dto.parentSpaceId,
      expectedVersion,
      actor,
      correlationId,
    );
  }

  /** Activa, suspende, reactiva o clausura. */
  @Audited({
    action: 'CARE_SPACE_LIFECYCLE_CHANGED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post(':id/lifecycle')
  @HttpCode(HttpStatus.OK)
  @ApiHeader(IF_MATCH)
  @ApiOperation({
    summary: 'Cambiar el ciclo de vida de un espacio (If-Match)',
  })
  @ApiResponse({
    status: 409,
    description:
      'SPACE_RETIRE_BLOCKED con `blockers` (cada uno con su `nextAction`)',
  })
  @ApiResponse({
    status: 422,
    description: 'PARENT_NOT_ACTIVE, motivo faltante o transición inválida',
  })
  change(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: LifecycleDto,
    @IfMatch() expectedVersion: number,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<CareSpaceDetail> {
    return this.lifecycle.change(
      id,
      dto.action,
      dto.reason,
      expectedVersion,
      actor,
      correlationId,
    );
  }

  /** Bloqueos de clausura, sin mutar (informativo: la clausura los recalcula). */
  @Get(':id/retire-check')
  @ApiOperation({ summary: 'Bloqueos de clausura de un espacio' })
  retireCheck(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetireCheck> {
    return this.lifecycle.retireCheck(id, actor);
  }

  /** Vincula el espacio con una unidad (un solo OWNER vigente). */
  @Audited({
    action: 'SPACE_UNIT_ASSIGNED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Post(':id/unit-assignments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Vincular un espacio con una unidad clínica' })
  assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateUnitAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<SpaceUnitAssignmentView> {
    return this.assignments.assign(
      id,
      dto.clinicalUnitId,
      dto.roleCode,
      actor,
      correlationId,
    );
  }

  /** Cierra la vigencia del vínculo (no borra la fila). */
  @Audited({
    action: 'SPACE_UNIT_UNASSIGNED',
    entity: 'care_space',
    entityId: 'param:id',
  })
  @Delete(':id/unit-assignments/:assignmentId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cerrar el vínculo espacio-unidad (cierra la vigencia, no borra)',
  })
  unassign(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('assignmentId', ParseUUIDPipe) assignmentId: string,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() correlationId: string | undefined,
  ): Promise<SpaceUnitAssignmentView> {
    return this.assignments.close(id, assignmentId, actor, correlationId);
  }
}
