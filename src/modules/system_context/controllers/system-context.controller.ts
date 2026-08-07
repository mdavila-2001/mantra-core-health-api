import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
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
  ListDynamicEnumBindingsResponseDto,
  ReadDynamicEnumResponseDto,
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
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param enumsService - Valor de enums service requerido por la operación.
   * @param contextsService - Valor de contexts service requerido por la operación.
   */
  constructor(
    private readonly enumsService: DynamicEnumsService,
    private readonly contextsService: SystemContextsService,
  ) {}

  /**
   * Cara de lectura de UC-45-04: qué campos de una tabla salen de catálogo.
   *
   * Va declarada antes que cualquier ruta con parámetro para que `bindings` no
   * sea capturado como identificador.
   *
   * No exige rol de administración, y es deliberado: escribir la enumeración
   * gobierna el sistema y por eso pide `PLATFORM_ADMIN`, pero **leer** la lista
   * de opciones válidas es lo que necesita cualquier formulario para pintarse.
   * Pedir rol de plataforma para eso dejaría el catálogo inutilizable desde el
   * cliente, que es exactamente la situación que este endpoint viene a corregir.
   * No revela dato personal alguno: son vocabularios de plataforma.
   *
   * @param schemaName - Esquema al que acotar la respuesta.
   * @param entityName - Tabla a la que acotar la respuesta.
   * @returns Amarres activos `campo -> enumeración`.
   */
  @Get('dynamic-enums/bindings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar los amarres campo -> enumeración',
    description:
      'Permite descubrir qué campos `*_concept_id` son de catálogo sin conocer ningún uuid.',
  })
  @ApiQuery({
    name: 'schema',
    required: false,
    description: 'Esquema al que acotar (por ejemplo, `profiles`)',
  })
  @ApiQuery({
    name: 'entity',
    required: false,
    description: 'Tabla a la que acotar (por ejemplo, `persons`)',
  })
  listEnumBindings(
    @Query('schema') schemaName?: string,
    @Query('entity') entityName?: string,
  ): Promise<ListDynamicEnumBindingsResponseDto> {
    return this.enumsService.listBindings({ schemaName, entityName });
  }

  /**
   * Cara de lectura de UC-45-05: las opciones válidas de un campo de catálogo.
   *
   * Se pide por la ruta del campo (`target=profiles.persons.administrative_gender_concept_id`)
   * o por el código de la enumeración (`code=administrative-gender`). Los dos son
   * constantes del código fuente; ninguno es un uuid sembrado por entorno, que es
   * lo que impedía poblar un selector.
   *
   * @param target - Campo `esquema.tabla.columna` cuyo catálogo se pide.
   * @param code - Código estable de la enumeración.
   * @returns Enumeración publicada con sus opciones habilitadas.
   */
  @Get('dynamic-enums')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Leer las opciones publicadas de una enumeración',
    description:
      'Por campo destino o por código; devuelve `conceptId` para escribir y `display` para pintar.',
  })
  @ApiQuery({
    name: 'target',
    required: false,
    description:
      'Campo destino, como `profiles.persons.sex_at_birth_concept_id`',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Código estable de la enumeración, como `sex-at-birth`',
  })
  readEnum(
    @Query('target') target?: string,
    @Query('code') code?: string,
  ): Promise<ReadDynamicEnumResponseDto> {
    return this.enumsService.readEnum({ target, code });
  }

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
