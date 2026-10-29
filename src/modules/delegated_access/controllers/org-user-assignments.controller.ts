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
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Audited, CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  OrgAssignmentReadService,
  OrgUserAssignmentsService,
} from '../services';
import {
  AssignmentTargetsQueryDto,
  CreateOrgUserAssignmentDto,
  UpdateOrgUserAssignmentDto,
  ResourceCreatedDto,
  OperationResultDto,
} from '../dto';
import type {
  AssignmentCatalogView,
  AssignmentTargetView,
  OrgAssignmentView,
} from '../dto/org-assignment-read.types';

/**
 * Asignaciones de usuario de organización (UC-29-01, UC-29-10) y sus selectores.
 *
 * Sin `@Roles`: la autoridad es la administración de la organización o de la
 * sucursal del objetivo (`OrgAssignmentScopeService`). Una sede, unidad, espacio o
 * membresía de otro tenant (o fuera de las sucursales del actor) responde 404.
 */
@ApiTags('delegated-access-org')
@ApiBearerAuth()
@Controller()
export class OrgUserAssignmentsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   * @param reads - Lecturas y selectores.
   */
  constructor(
    private readonly service: OrgUserAssignmentsService,
    private readonly reads: OrgAssignmentReadService,
  ) {}

  /** UC-29-01. */
  @Audited({
    action: 'ORG_USER_ASSIGNMENT_CREATED',
    entity: 'organization_user_assignment',
    entityId: 'result.id',
  })
  @Post('org/:tenantMembershipId/user-assignments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Asignar usuario de organización con alcance y vigencia',
  })
  @ApiResponse({
    status: 404,
    description:
      'Membresía, sede, unidad o espacio de otro tenant o fuera de la sucursal',
  })
  @ApiResponse({
    status: 409,
    description: '`UNIT_HEAD_ALREADY_ASSIGNED` o asignación repetida',
  })
  @ApiResponse({
    status: 422,
    description:
      '`ASSIGNMENT_SCOPE_TARGET_REQUIRED` / `ASSIGNMENT_SCOPE_TARGET_MISMATCH`',
  })
  create(
    @Param('tenantMembershipId', ParseUUIDPipe) tenantMembershipId: string,
    @Body() dto: CreateOrgUserAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResourceCreatedDto> {
    return this.service.createAssignment(tenantMembershipId, dto, actor);
  }

  /** UC-29-10. */
  @Audited({
    action: 'ORG_USER_ASSIGNMENT_UPDATED',
    entity: 'organization_user_assignment',
    entityId: 'param:id',
  })
  @Patch('org/user-assignments/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reasignar supervisor, cambiar alcance o suspender una asignación',
  })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrgUserAssignmentDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OperationResultDto> {
    return this.service.updateAssignment(id, dto, actor);
  }

  /** Catálogo de roles y alcances para el formulario. */
  @Get('org/assignment-roles')
  @ApiOperation({ summary: 'Roles asignables y alcances en los que valen' })
  catalog(): AssignmentCatalogView {
    return this.reads.catalog();
  }

  /** Selectores encadenados sede → unidad → espacio, acotados a lo que el actor otorga. */
  @Get('org/assignment-targets')
  @ApiOperation({ summary: 'Candidatos de práctica, sede, unidad o espacio' })
  targets(
    @Query() query: AssignmentTargetsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssignmentTargetView[]> {
    return this.reads.targets(query, actor);
  }

  /** Asignaciones de una membresía, con su alcance resuelto. */
  @Get('org/:tenantMembershipId/user-assignments')
  @ApiOperation({ summary: 'Asignaciones de un usuario de la organización' })
  list(
    @Param('tenantMembershipId', ParseUUIDPipe) tenantMembershipId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OrgAssignmentView[]> {
    return this.reads.listForMembership(tenantMembershipId, actor);
  }

  /** Una asignación. */
  @Get('org/user-assignments/:id')
  @ApiOperation({ summary: 'Detalle de una asignación' })
  get(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OrgAssignmentView> {
    return this.reads.get(id, actor);
  }
}
