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
  getCurrentTenantId,
  type AuthenticatedUser,
} from '../../../common';
import { FormsReadService, FormsSchemaService } from '../services';
import {
  CreateDefinitionSetDto,
  PublishVersionDto,
  RunMigrationDto,
  DefinitionSetResponseDto,
  DefinitionSetDetailResponseDto,
  DefinitionSetListResponseDto,
  MigrationRunResponseDto,
  OkResultDto,
} from '../dto';

/**
 * Gobernanza del esquema dinámico sobre `/forms/definition-sets`. Operaciones de
 * administración de extensibilidad: creación de sets, publicación de versiones y
 * ejecución de migraciones. Capa fina que delega en `FormsSchemaService`.
 *
 * Las lecturas admiten también a los roles clínicos: el esquema de un
 * formulario lo consulta quien lo va a completar, no sólo quien lo gobierna.
 */
@ApiTags('forms-definition-sets')
@ApiBearerAuth()
@Controller('forms/definition-sets')
export class FormsDefinitionSetsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param schemaService - Valor de schema service requerido por la operación.
   * @param readService - Lecturas de sets, versiones y campos.
   */
  constructor(
    private readonly schemaService: FormsSchemaService,
    private readonly readService: FormsReadService,
  ) {}

  /** Fase 1 de lecturas: listar los sets visibles (globales y del tenant). */
  @Get()
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar los sets de definiciones visibles' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope del listado (por defecto 50)',
  })
  listDefinitionSets(
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<DefinitionSetListResponseDto> {
    return this.readService.listDefinitionSets(
      getCurrentTenantId(),
      limit ?? 50,
    );
  }

  /** Fase 1 de lecturas: el esquema completo de un set, para render. */
  @Get(':id')
  @Roles('CLINICIAN', 'PRACTITIONER', 'SECURITY_ADMIN')
  @ApiOperation({
    summary:
      'Leer un set con sus versiones, campos (reglas, dependencias, i18n) y secciones',
  })
  getDefinitionSet(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DefinitionSetDetailResponseDto> {
    return this.readService.getDefinitionSet(id, getCurrentTenantId());
  }

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
