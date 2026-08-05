import {
  BadRequestException,
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
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  ConceptMapsService,
  ConceptsService,
  ValueSetsService,
} from '../services';
import {
  ExpandValueSetDto,
  ExpandValueSetResponseDto,
  LookupResponseDto,
  TranslateConceptDto,
  TranslateResponseDto,
} from '../dto';

/**
 * Operaciones con nombre del estilo FHIR: `$expand` (UC-03-08), `$translate`
 * (UC-03-09) y `$lookup` (UC-03-11).
 *
 * Viven en su propio controlador porque cuelgan de las rutas con el nombre del
 * recurso FHIR (`ValueSet`, `ConceptMap`, `CodeSystem`), distintas de las rutas
 * administrativas del módulo.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology')
export class TerminologyFhirController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param valueSetsService - Valor de value sets service requerido por la operación.
   * @param conceptMapsService - Valor de concept maps service requerido por la operación.
   * @param conceptsService - Valor de concepts service requerido por la operación.
   */
  constructor(
    private readonly valueSetsService: ValueSetsService,
    private readonly conceptMapsService: ConceptMapsService,
    private readonly conceptsService: ConceptsService,
  ) {}

  /**
   * Ejecuta la operación expand value set.
   *
   * @param id - Identificador de id.
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de expand value set conforme al contrato `Promise<ExpandValueSetResponseDto>`.
   */
  @Post('ValueSet/:id/$expand')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-08: materializa los miembros de la expansión',
  })
  expandValueSet(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExpandValueSetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ExpandValueSetResponseDto> {
    return this.valueSetsService.expandValueSet(id, dto, user);
  }

  /**
   * Ejecuta la operación translate.
   *
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de translate conforme al contrato `Promise<TranslateResponseDto>`.
   */
  @Post('ConceptMap/$translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-09: cura o consulta un mapeo entre conceptos',
  })
  translate(
    @Body() dto: TranslateConceptDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TranslateResponseDto> {
    return this.conceptMapsService.translate(dto, user);
  }

  /**
   * Ejecuta la operación lookup.
   *
   * @param system - Valor de system requerido por la operación.
   * @param code - Valor de code requerido por la operación.
   * @returns Resultado de lookup conforme al contrato `Promise<LookupResponseDto>`.
   * @throws Error de dominio cuando no se cumplen las precondiciones de la operación.
   */
  @Get('CodeSystem/$lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-11: resuelve un concepto por sistema y código',
  })
  @ApiQuery({
    name: 'system',
    description: 'URL canónica del sistema de códigos',
  })
  @ApiQuery({ name: 'code', description: 'Código dentro del sistema' })
  lookup(
    @Query('system') system: string,
    @Query('code') code: string,
  ): Promise<LookupResponseDto> {
    // `system` y `code` son la clave completa del concepto: resolver con uno solo
    // devolvería un resultado arbitrario.
    if (!system || !code) {
      throw new BadRequestException(
        '$lookup exige los parámetros system y code',
      );
    }
    return this.conceptsService.lookupConcept(system, code);
  }
}
