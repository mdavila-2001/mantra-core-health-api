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
import { FormsSchemaService } from '../services';
import {
  CreateDefinitionSetDto,
  PublishVersionDto,
  RunMigrationDto,
  DefinitionSetResponseDto,
  MigrationRunResponseDto,
  OkResultDto,
} from '../dto';

/**
 * Gobernanza del esquema dinámico sobre `/forms/definition-sets`. Operaciones de
 * administración de extensibilidad: creación de sets, publicación de versiones y
 * ejecución de migraciones. Capa fina que delega en `FormsSchemaService`.
 */
@ApiTags('forms-definition-sets')
@ApiBearerAuth()
@Controller('forms/definition-sets')
export class FormsDefinitionSetsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param schemaService - Valor de schema service requerido por la operación.
   */
  constructor(private readonly schemaService: FormsSchemaService) {}

  /** UC-09-01. */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir un set de campos dinámicos y su versión inicial',
  })
  createDefinitionSet(
    @Body() dto: CreateDefinitionSetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DefinitionSetResponseDto> {
    return this.schemaService.createDefinitionSet(dto, actor);
  }

  /** UC-09-03. */
  @Post(':id/versions/:ver/publish')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Componer miembros del set y publicar la versión' })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('ver', ParseUUIDPipe) ver: string,
    @Body() dto: PublishVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<OkResultDto> {
    return this.schemaService.publishVersion(id, ver, dto, actor);
  }

  /** UC-09-13. */
  @Post(':id/migrations/:migrationId/run')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Migrar valores entre versiones de schema' })
  runMigration(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('migrationId', ParseUUIDPipe) migrationId: string,
    @Body() dto: RunMigrationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MigrationRunResponseDto> {
    return this.schemaService.runMigration(id, migrationId, dto, actor);
  }
}
