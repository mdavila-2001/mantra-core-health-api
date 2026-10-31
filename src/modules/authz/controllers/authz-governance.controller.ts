import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PlatformTenantOptional } from '../../../common/tenant/platform-tenant-optional.decorator';
import {
  AccessReviewDto,
  AccessReviewDueQueryDto,
  AccessReviewDuePageDto,
  EndedResourceScopeGrantDto,
  LifecycleActionDto,
  LifecycleResultDto,
  RecordAccessReviewDto,
  ResourceScopeGrantIdParamDto,
  ResourceScopeGrantsPageDto,
  ResourceScopeGrantsQueryDto,
  RoleFieldPermissionsDto,
  UserAccessReviewsDto,
  UserLifecycleDto,
} from '../dto/authz-governance.dto';
import { AuthzAccessReviewsService } from '../services/authz-access-reviews.service';
import { AuthzGovernanceReadService } from '../services/authz-governance-read.service';
import { AuthzUserLifecycleService } from '../services/authz-user-lifecycle.service';

/**
 * Gobierno de acceso de la consola: ciclo de vida de las cuentas internas, revisión periódica de
 * accesos y las lecturas de permisos por campo y por alcance de recurso. Todo es `SECURITY_ADMIN`
 * y atraviesa tenants, así que no exige un tenant resuelto.
 *
 * Las rutas viven en archivos propios del módulo para no cruzarse con `AuthzAdminController`.
 */
@ApiTags('authz-governance')
@ApiBearerAuth()
@Controller('authz')
@PlatformTenantOptional('SECURITY_ADMIN', 'SUPERADMIN')
export class AuthzGovernanceController {
  constructor(
    private readonly lifecycle: AuthzUserLifecycleService,
    private readonly reviews: AuthzAccessReviewsService,
    private readonly read: AuthzGovernanceReadService,
  ) {}

  /* ---- ciclo de vida ------------------------------------------------------- */

  @Get('users/:userId/lifecycle')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Estado de la cuenta y su historial de ciclo de vida' })
  @ApiResponse({ status: 200, type: UserLifecycleDto })
  @ApiResponse({ status: 404, description: 'USER_LIFECYCLE_USER_NOT_FOUND' })
  lifecycleOf(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.lifecycle.lifecycleOf(userId);
  }

  @Audited({
    action: 'USER_SUSPENDED',
    entity: 'user',
    entityId: 'param:userId',
  })
  @Post('users/:userId/lifecycle/suspend')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Suspender la cuenta (corta sus sesiones; reversible)' })
  @ApiResponse({ status: 200, type: LifecycleResultDto })
  @ApiResponse({ status: 409, description: 'USER_LIFECYCLE_NOT_ACTIVE' })
  @ApiResponse({ status: 422, description: 'USER_LIFECYCLE_SELF_ACTION | USER_LIFECYCLE_ANONYMIZED' })
  suspend(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: LifecycleActionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.lifecycle.suspend(userId, dto, actor);
  }

  @Audited({
    action: 'USER_REACTIVATED',
    entity: 'user',
    entityId: 'param:userId',
  })
  @Post('users/:userId/lifecycle/reactivate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reactivar una cuenta suspendida (no una dada de baja)' })
  @ApiResponse({ status: 200, type: LifecycleResultDto })
  @ApiResponse({
    status: 409,
    description: 'USER_LIFECYCLE_NOT_SUSPENDED | USER_LIFECYCLE_ALREADY_OFFBOARDED',
  })
  reactivate(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: LifecycleActionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.lifecycle.reactivate(userId, dto, actor);
  }

  @Audited({
    action: 'USER_OFFBOARDED',
    entity: 'user',
    entityId: 'param:userId',
  })
  @Post('users/:userId/lifecycle/offboard')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Dar de baja: bloquea la cuenta, corta sesiones y revoca todos sus roles',
  })
  @ApiResponse({ status: 200, type: LifecycleResultDto })
  @ApiResponse({ status: 409, description: 'USER_LIFECYCLE_ALREADY_OFFBOARDED | USER_LIFECYCLE_NOT_ACTIVE' })
  offboard(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: LifecycleActionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.lifecycle.offboard(userId, dto, actor);
  }

  /* ---- revisión periódica de accesos --------------------------------------- */

  @Get('access-reviews/due')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Cuentas con roles activos y la fecha de su última revisión',
    description:
      'Con `olderThanDays`, sólo quienes no se revisaron en ese plazo o nunca. La cadencia la fija quien pregunta.',
  })
  @ApiResponse({ status: 200, type: AccessReviewDuePageDto })
  due(@Query() q: AccessReviewDueQueryDto) {
    return this.reviews.due(q.olderThanDays);
  }

  @Get('users/:userId/access-reviews')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Historial de revisiones de accesos de una cuenta' })
  @ApiResponse({ status: 200, type: UserAccessReviewsDto })
  reviewsOf(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.reviews.historyOf(userId);
  }

  @Audited({
    action: 'ACCESS_REVIEW_RECORDED',
    entity: 'user',
    entityId: 'param:userId',
  })
  @Post('users/:userId/access-reviews')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar la revisión de accesos de una cuenta' })
  @ApiResponse({ status: 201, type: AccessReviewDto })
  @ApiResponse({ status: 422, description: 'ACCESS_REVIEW_SELF_REVIEW | ACCESS_REVIEW_ASSIGNMENT_MISMATCH' })
  recordReview(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: RecordAccessReviewDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.reviews.record(userId, dto, actor);
  }

  /* ---- permisos por campo y por alcance de recurso ------------------------- */

  @Get('roles/:roleId/field-permissions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Reglas de enmascaramiento de campos de un rol' })
  @ApiResponse({ status: 200, type: RoleFieldPermissionsDto })
  fieldPermissions(@Param('roleId', ParseUUIDPipe) roleId: string) {
    return this.read.roleFieldPermissions(roleId);
  }

  @Get('resource-scope-grants')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Permisos por alcance de recurso, paginados' })
  @ApiResponse({ status: 200, type: ResourceScopeGrantsPageDto })
  scopeGrants(@Query() q: ResourceScopeGrantsQueryDto) {
    return this.read.resourceScopeGrants(q);
  }

  @Audited({
    action: 'RESOURCE_SCOPE_GRANT_ENDED',
    entity: 'resource_scope_grant',
    entityId: 'param:grantId',
  })
  @Delete('resource-scope-grants/:grantId')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Terminar la vigencia de un permiso por alcance de recurso' })
  @ApiResponse({ status: 200, type: EndedResourceScopeGrantDto })
  @ApiResponse({ status: 409, description: 'RESOURCE_SCOPE_GRANT_ALREADY_ENDED' })
  endScopeGrant(
    @Param() p: ResourceScopeGrantIdParamDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.read.endResourceScopeGrant(p.grantId, actor);
  }
}
