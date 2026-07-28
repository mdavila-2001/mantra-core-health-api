import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthzCatalogService } from '../services';
import {
  CreatePermissionCategoryDto,
  CreatePermissionDto,
  AuthzIdResponseDto,
} from '../dto';

/** UC-06-01 — Catálogo global de permisos y categorías (solo Security Admin). */
@ApiTags('authz-catalog')
@ApiBearerAuth()
@Controller('authz')
export class AuthzCatalogController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param catalogService - Valor de catalog service requerido por la operación.
   */
  constructor(private readonly catalogService: AuthzCatalogService) {}

  /** UC-06-01. */
  @Post('permission-categories')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir una categoría de permiso' })
  createCategory(
    @Body() dto: CreatePermissionCategoryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.catalogService.createCategory(dto, actor);
  }

  /** UC-06-01. */
  @Post('permissions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir un permiso del catálogo global' })
  createPermission(
    @Body() dto: CreatePermissionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthzIdResponseDto> {
    return this.catalogService.createPermission(dto, actor);
  }
}
