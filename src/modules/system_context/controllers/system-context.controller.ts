import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { DynamicEnumsService, SystemContextsService } from '../services';
import {
  CreateEnumDefinitionDto,
  EnumDefinitionResponseDto,
  DraftEnumVersionDto,
  EnumVersionResponseDto,
  PublishEnumVersionResponseDto,
  CreateEnumBindingDto,
  EnumBindingResponseDto,
  ResolveEnumValueDto,
  ResolveEnumValueResponseDto,
  RetireEnumDefinitionDto,
  RetireEnumDefinitionResponseDto,
  CreateSystemContextDto,
  SystemContextResponseDto,
  RefreshSystemContextDto,
  RefreshRunResponseDto,
  ActivateContextVersionDto,
  ActivateContextVersionResponseDto,
  CreateContextBindingDto,
  ContextBindingResponseDto,
  RollbackContextDto,
  RollbackContextResponseDto,
} from '../dto';

/**
 * Endpoints de contexto de sistema: enumeraciones dinámicas y contextos
 * versionados.
 *
 * Los casos de uso escriben las acciones con `:` (`{v}:publish`, `{id}:rollback`).
 * Nest 11 trata `:` como inicio de parámetro en cualquier punto del segmento, así
 * que las rutas publicadas usan segmentos planos, como en el resto del proyecto.
 */
@ApiTags('system-context')
@ApiBearerAuth()
@Controller('system-context')
export class SystemContextController {
  constructor(
    private readonly enumsService: DynamicEnumsService,
    private readonly contextsService: SystemContextsService,
  ) {}

  /** UC-45-01. */
  @Post('dynamic-enums/definitions')
  @Roles('TERMINOLOGY_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una enumeración dinámica ligada a un value set',
    description:
      'Sin tipos ENUM nativos de PostgreSQL: el conjunto vive en filas versionadas.',
  })
  createEnumDefinition(
    @Body() dto: CreateEnumDefinitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EnumDefinitionResponseDto> {
    return this.enumsService.createDefinition(dto, actor);
  }

  /** UC-45-02. */
  @Post('dynamic-enums/definitions/:defId/versions')
  @Roles('TERMINOLOGY_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Redactar una versión con su snapshot de opciones',
    description:
      'Las opciones son inmutables: preservan la validación histórica.',
  })
  draftEnumVersion(
    @Param('defId', ParseUUIDPipe) defId: string,
    @Body() dto: DraftEnumVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EnumVersionResponseDto> {
    return this.enumsService.draftVersion(defId, dto, actor);
  }

  /** UC-45-03. */
  @Post('dynamic-enums/definitions/:defId/versions/:version/publish')
  @Roles('TERMINOLOGY_ENGINEER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publicar la versión e invalidar la caché',
    description:
      'La versión anterior queda superseded en la misma transacción.',
  })
  publishEnumVersion(
    @Param('defId', ParseUUIDPipe) defId: string,
    @Param('version', ParseIntPipe) version: number,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PublishEnumVersionResponseDto> {
    return this.enumsService.publishVersion(defId, version, actor);
  }

  /** UC-45-04. */
  @Post('dynamic-enums/definitions/:defId/bindings')
  @Roles('MODULE_OWNER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Vincular la enumeración a un campo destino',
    description:
      'Un campo no puede estar gobernado por dos enumeraciones a la vez.',
  })
  createEnumBinding(
    @Param('defId', ParseUUIDPipe) defId: string,
    @Body() dto: CreateEnumBindingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EnumBindingResponseDto> {
    return this.enumsService.createBinding(defId, dto, actor);
  }

  /** UC-45-05. */
  @Post('dynamic-enums/resolve')
  @Roles('WRITE_SERVICE', 'MODULE_OWNER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolver y validar un valor de enumeración antes de escribirlo',
    description:
      'En modo estricto se rechaza lo que no pertenece; en permisivo se usa la reserva.',
  })
  resolveEnumValue(
    @Body() dto: ResolveEnumValueDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ResolveEnumValueResponseDto> {
    return this.enumsService.resolveValue(dto, actor);
  }

  /** UC-45-11. */
  @Post('dynamic-enums/definitions/:defId/retire')
  @Roles('PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retirar la definición (borrado lógico gobernado)',
    description:
      'Sus bindings quedan deshabilitados; un campo obligatorio bloquea el retiro.',
  })
  retireEnumDefinition(
    @Param('defId', ParseUUIDPipe) defId: string,
    @Body() dto: RetireEnumDefinitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RetireEnumDefinitionResponseDto> {
    return this.enumsService.retireDefinition(defId, dto, actor);
  }

  /** UC-45-06. */
  @Post('contexts')
  @Roles('PLATFORM_ADMIN', 'GOVERNANCE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir un contexto de sistema con su versión inicial',
    description:
      'El contenido nunca lleva secretos: sólo referencias gobernadas.',
  })
  createContext(
    @Body() dto: CreateSystemContextDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SystemContextResponseDto> {
    return this.contextsService.createContext(dto, actor);
  }

  /** UC-45-07 (incluye UC-45-08). */
  @Post('contexts/:id/refresh')
  @Roles('SYSTEM', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Refrescar el contexto y snapshotear su procedencia',
    description:
      'Idempotente por clave; si el contenido no cambió, no se redacta versión.',
  })
  refreshContext(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RefreshSystemContextDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RefreshRunResponseDto> {
    return this.contextsService.refreshContext(id, dto, actor);
  }

  /** UC-45-09. */
  @Post('contexts/:id/versions/:version/activate')
  @Roles('PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Promover la versión a vigente',
    description: 'Exactamente una versión activa por contexto.',
  })
  activateContextVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('version', ParseIntPipe) version: number,
    @Body() dto: ActivateContextVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ActivateContextVersionResponseDto> {
    return this.contextsService.activateVersion(id, version, dto, actor);
  }

  /** UC-45-10. */
  @Post('contexts/:id/bindings')
  @Roles('MODULE_OWNER', 'PLATFORM_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Vincular el contexto a un consumidor',
    description:
      'Dos bindings del mismo consumidor no pueden solapar su ventana.',
  })
  createContextBinding(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContextBindingDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContextBindingResponseDto> {
    return this.contextsService.createBinding(id, dto, actor);
  }

  /** UC-45-12. */
  @Post('contexts/:id/rollback')
  @Roles('PLATFORM_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Volver a una versión anterior del contexto',
    description:
      'Sólo a una que estuvo vigente; el historial se conserva entero.',
  })
  rollbackContext(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RollbackContextDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RollbackContextResponseDto> {
    return this.contextsService.rollbackContext(id, dto, actor);
  }
}
