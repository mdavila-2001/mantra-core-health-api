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
  type AuthenticatedUser,
} from '../../../common';
import { ConceptsService } from '../services';
import {
  CreateDesignationDto,
  DesignationResponseDto,
  CreateRelationshipDto,
  RelationshipResponseDto,
  UpsertConceptPropertiesDto,
  ConceptPropertiesResponseDto,
  DeprecateConceptDto,
  DeprecateConceptResponseDto,
  SearchConceptsResponseDto,
} from '../dto';

/**
 * Endpoints sobre conceptos existentes: designaciones (UC-03-05), propiedades
 * (UC-03-05), relaciones (UC-03-06) y retirada (UC-03-10). Reservados a
 * `SECURITY_ADMIN`.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/concepts')
export class TerminologyConceptsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param conceptsService - Valor de concepts service requerido por la operación.
   */
  constructor(private readonly conceptsService: ConceptsService) {}

  /**
   * UC-03-13: busca conceptos por texto para poder rellenar cualquier campo
   * `*ConceptId` del contrato.
   *
   * Es de sólo lectura y no exige rol de administración: el catálogo es
   * metadato compartido, sin datos de paciente, y cualquier cliente
   * autenticado necesita resolver estos ids para poder crear recursos.
   *
   * @param query - Texto a buscar en el código o la denominación.
   * @param codeSystemVersionId - Versión del sistema de códigos a la que acotar.
   * @param limit - Tope de resultados.
   * @returns Conceptos que casan con el filtro.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-13: busca conceptos del catálogo por código o denominación',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en el código o la denominación',
  })
  @ApiQuery({
    name: 'codeSystemVersionId',
    required: false,
    description: 'Acota la búsqueda a una versión de sistema de códigos',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Tope de resultados (por defecto 50)',
  })
  searchConcepts(
    @Query('q') query?: string,
    @Query('codeSystemVersionId') codeSystemVersionId?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchConceptsResponseDto> {
    return this.conceptsService.searchConcepts(
      query,
      codeSystemVersionId,
      limit ?? 50,
    );
  }

  /**
   * Crea add designation.
   *
   * @param conceptId - Identificador de concept.
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de add designation conforme al contrato `Promise<DesignationResponseDto>`.
   */
  @Post(':conceptId/designations')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-05: añade una designación (y opcionalmente propiedades)',
  })
  addDesignation(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: CreateDesignationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DesignationResponseDto> {
    return this.conceptsService.addDesignation(conceptId, dto, user);
  }

  /**
   * Crea add relationship.
   *
   * @param conceptId - Identificador de concept.
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de add relationship conforme al contrato `Promise<RelationshipResponseDto>`.
   */
  @Post(':conceptId/relationships')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-06: crea una relación dirigida entre conceptos',
  })
  addRelationship(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: CreateRelationshipDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<RelationshipResponseDto> {
    return this.conceptsService.addRelationship(conceptId, dto, user);
  }

  /**
   * Ejecuta la operación upsert properties.
   *
   * @param conceptId - Identificador de concept.
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de upsert properties conforme al contrato `Promise<ConceptPropertiesResponseDto>`.
   */
  @Post(':conceptId/properties')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-05: alta o actualización de propiedades del concepto',
  })
  upsertProperties(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: UpsertConceptPropertiesDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ConceptPropertiesResponseDto> {
    return this.conceptsService.upsertProperties(conceptId, dto, user);
  }

  /**
   * Ejecuta la operación deprecate concept.
   *
   * @param conceptId - Identificador de concept.
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de deprecate concept conforme al contrato `Promise<DeprecateConceptResponseDto>`.
   */
  @Post(':conceptId/$deprecate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-10: retira el concepto y lo excluye de las expansiones',
  })
  deprecateConcept(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Body() dto: DeprecateConceptDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<DeprecateConceptResponseDto> {
    return this.conceptsService.deprecateConcept(conceptId, dto, user);
  }
}
