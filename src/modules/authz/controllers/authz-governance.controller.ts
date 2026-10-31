import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiPreconditionFailedResponse,
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
import { UserIdParamDto } from '../dto/authz-admin.dto';
import {
  AccessMapDto,
  AccessReviewDto,
  AccessReviewsPageDto,
  DirectGrantsPageDto,
  DueReviewsPageDto,
  DueReviewsQueryDto,
  GrantsQueryDto,
  HoldersQueryDto,
  PermissionHoldersPageDto,
  PermissionIdParamDto,
  RestrictedFieldsPageDto,
  ReviewsQueryDto,
  ScopeGrantsPageDto,
  SimulateDecisionDto,
  SimulationResultDto,
} from '../dto/authz-governance.dto';
import { AuthzGovernanceService } from '../services/authz-governance.service';

/**
 * Gobierno de accesos (H5): «quién puede qué», revisión periódica de accesos y simulador.
 * Todo `SECURITY_ADMIN` (o `SUPERADMIN`). Es una vista de plataforma —atraviesa tenants—, así
 * que no exige un tenant resuelto, igual que `AuthzAdminController`.
 *
 * ## Contrato de rutas (H5)
 *
 * Los listados son paginados por cursor opaco: `?limit=1..200` (50 por defecto) y `?cursor=` con
 * el `nextCursor` de la página anterior; responden `{ items, nextCursor, limit }`. Un cursor
 * inválido o un `limit` fuera de rango responde 400.
 *
 * | Ruta | Query / cuerpo | Respuesta |
 * |---|---|---|
 * | `GET /authz/users/:userId/access-map` | — | `{ user, globalRoles[], assignments[], counts, lastReview }` |
 * | `GET /authz/users/:userId/permission-grants` | `show=EFFECTIVE\|ALL` | página de excepciones de permiso |
 * | `GET /authz/users/:userId/resource-scope-grants` | `show=EFFECTIVE\|ALL` | página de grants por recurso |
 * | `GET /authz/users/:userId/restricted-fields` | — | página de campos restringidos por sus roles |
 * | `GET /authz/permissions/:permissionId/holders` | `source=ROLE\|USER\|RESOURCE`, `q` | página de titulares con sus fuentes |
 * | `POST /authz/users/:userId/access-reviews` | sin cuerpo | 201 `{ id, userId, reviewerUserId, reviewedAt, … }` |
 * | `GET /authz/access-reviews` | `userId`, `reviewerId` | página de revisiones |
 * | `GET /authz/access-reviews/due` | `olderThanDays=1..3650` (90) | página de cuentas sin revisión reciente |
 * | `POST /authz/simulations` | igual que `POST /authz/decisions/evaluate` | `{ simulated: true, decision }` |
 *
 * Errores: 401 sin token · 403 `ROLE_INSUFFICIENT` · 404 `GOVERNANCE_USER_NOT_FOUND` /
 * `GOVERNANCE_PERMISSION_NOT_FOUND` · 412 `ACCESS_REVIEW_SELF_REVIEW_FORBIDDEN` · 400 validación.
 * Contrato completo: `docs/trabajo/2026-10-30-perfil-admin-medicion-gobierno/contratos/H5-permisos-y-usuarios.md`.
 *
 * Las vistas «quién puede qué» son **orientativas**: no reproducen toda la evaluación del PDP
 * (propósito de uso, alcance clínico por paciente, políticas ABAC). La decisión real la da el
 * simulador.
 */
@ApiTags('authz-governance')
@ApiBearerAuth()
@Controller('authz')
@PlatformTenantOptional('SECURITY_ADMIN', 'SUPERADMIN')
export class AuthzGovernanceController {
  constructor(private readonly governance: AuthzGovernanceService) {}

  @Get('users/:userId/access-map')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary:
      '«Quién puede qué» de un usuario: roles, conteos y última revisión',
  })
  @ApiOkResponse({ type: AccessMapDto })
  @ApiResponse({ status: 404, description: 'No existe el usuario' })
  accessMap(@Param() p: UserIdParamDto): Promise<AccessMapDto> {
    return this.governance.accessMap(p.userId);
  }

  @Get('users/:userId/permission-grants')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Excepciones de permiso por usuario, paginadas' })
  @ApiOkResponse({ type: DirectGrantsPageDto })
  @ApiResponse({ status: 404, description: 'No existe el usuario' })
  directGrants(
    @Param() p: UserIdParamDto,
    @Query() q: GrantsQueryDto,
  ): Promise<DirectGrantsPageDto> {
    return this.governance.directGrants(p.userId, q);
  }

  @Get('users/:userId/resource-scope-grants')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary:
      'Grants sobre un recurso concreto cuyo sujeto es el usuario, paginados',
  })
  @ApiOkResponse({ type: ScopeGrantsPageDto })
  @ApiResponse({ status: 404, description: 'No existe el usuario' })
  scopeGrants(
    @Param() p: UserIdParamDto,
    @Query() q: GrantsQueryDto,
  ): Promise<ScopeGrantsPageDto> {
    return this.governance.scopeGrants(p.userId, q);
  }

  @Get('users/:userId/restricted-fields')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary:
      'Campos restringidos que alcanzan al usuario por sus roles efectivos',
    description:
      'Sin lectura, sin escritura o enmascarados. Incluye las reglas de los roles padre que hereda.',
  })
  @ApiOkResponse({ type: RestrictedFieldsPageDto })
  @ApiResponse({ status: 404, description: 'No existe el usuario' })
  restrictedFields(
    @Param() p: UserIdParamDto,
    @Query() q: GrantsQueryDto,
  ): Promise<RestrictedFieldsPageDto> {
    return this.governance.restrictedFields(p.userId, q);
  }

  @Get('permissions/:permissionId/holders')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Quiénes tienen un permiso, con el camino por el que lo tienen',
    description:
      'Por rol (propio o heredado), por excepción directa o por grant de recurso; sólo lo vigente. Una fila por usuario.',
  })
  @ApiOkResponse({ type: PermissionHoldersPageDto })
  @ApiResponse({ status: 404, description: 'No existe el permiso' })
  holders(
    @Param() p: PermissionIdParamDto,
    @Query() q: HoldersQueryDto,
  ): Promise<PermissionHoldersPageDto> {
    return this.governance.holdersOf(p.permissionId, q);
  }

  @Audited({
    action: 'ACCESS_REVIEWED',
    entity: 'user',
    entityId: 'param:userId',
  })
  @Post('users/:userId/access-reviews')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar que revisaste los accesos de una cuenta',
    description:
      'Cada llamada suma una revisión (quién, a quién, cuándo). No cambia ningún permiso. Nadie revisa los propios.',
  })
  @ApiResponse({ status: 201, type: AccessReviewDto })
  @ApiResponse({ status: 404, description: 'No existe el usuario' })
  @ApiPreconditionFailedResponse({ description: 'Es tu propia cuenta' })
  recordReview(
    @Param() p: UserIdParamDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccessReviewDto> {
    return this.governance.recordReview(p.userId, actor);
  }

  // `access-reviews/due` se declara antes que cualquier ruta con parámetro bajo `access-reviews`.
  @Get('access-reviews/due')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Cuentas con acceso administrativo sin revisión reciente',
  })
  @ApiOkResponse({ type: DueReviewsPageDto })
  dueReviews(@Query() q: DueReviewsQueryDto): Promise<DueReviewsPageDto> {
    return this.governance.dueReviews(q);
  }

  @Get('access-reviews')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Historia de revisiones de accesos, paginada' })
  @ApiOkResponse({ type: AccessReviewsPageDto })
  reviews(@Query() q: ReviewsQueryDto): Promise<AccessReviewsPageDto> {
    return this.governance.reviews(q);
  }

  @Audited({
    action: 'ACCESS_DECISION_SIMULATED',
    entity: 'user',
    entityId: 'body.userId',
  })
  @Post('simulations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Simular una decisión de acceso con el PDP real',
    description:
      'Misma entrada y misma decisión que `POST /authz/decisions/evaluate`. No concede ni cambia nada.',
  })
  @ApiOkResponse({ type: SimulationResultDto })
  @ApiResponse({ status: 404, description: 'No existe el usuario' })
  simulate(
    @Body() dto: SimulateDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimulationResultDto> {
    return this.governance.simulate(dto, actor);
  }
}
