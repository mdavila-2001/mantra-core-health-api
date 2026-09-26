import {
  Body,
  Controller,
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
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  requireTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { PermissionSetsService } from '../services';
import {
  CreatePermissionSetDto,
  PublishSetVersionDto,
  PermissionSetVersionDto,
  ListPermissionSetsResponseDto,
} from '../dto';

/** Sets de permisos delegados y su versionado (UC-29-02). */
@ApiTags('delegated-access-permission-sets')
@ApiBearerAuth()
@Controller('delegated-permission-sets')
export class DelegatedPermissionSetsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: PermissionSetsService) {}

  /** CV-13: listado del hub, acotado al tenant del actor. */
  @Get()
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar los sets de permisos delegados del tenant' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({ name: 'limit', required: false, description: 'Sets por página' })
  list(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ListPermissionSetsResponseDto> {
    return this.service.listByTenant(requireTenantId(), { cursor, limit });
  }

  /** UC-29-02: publica el set (versión 1). */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar set de permisos delegados (scoped)' })
  createSet(
    @Body() dto: CreatePermissionSetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PermissionSetVersionDto> {
    return this.service.createSet(dto, actor);
  }

  /** UC-29-02: publica una nueva versión del set. */
  @Post(':id/versions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Versionar set de permisos delegados' })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishSetVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PermissionSetVersionDto> {
    return this.service.publishVersion(id, dto, actor);
  }
}
