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
import { ValueSetsService } from '../services';
import {
  CreateValueSetDto,
  ReadValueSetExpansionResponseDto,
  ValueSetResponseDto,
} from '../dto';

/** Tope de miembros por página cuando el cliente no pide uno. */
const DEFAULT_EXPANSION_PAGE_SIZE = 50;

/**
 * Alta de conjuntos de valores (UC-03-07), reservada a `SECURITY_ADMIN`, y
 * lectura de su expansión vigente (UC-03-08), abierta a cualquier cliente
 * autenticado.
 */
@ApiTags('terminology')
@ApiBearerAuth()
@Controller('terminology/value-sets')
export class TerminologyValueSetsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param valueSetsService - Valor de value sets service requerido por la operación.
   */
  constructor(private readonly valueSetsService: ValueSetsService) {}

  /**
   * Crea create value set.
   *
   * @param dto - Datos validados de la operación.
   * @param user - Usuario autenticado que ejecuta la operación.
   * @returns Resultado de create value set conforme al contrato `Promise<ValueSetResponseDto>`.
   */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-03-07: crea un conjunto de valores con versión y reglas',
  })
  createValueSet(
    @Body() dto: CreateValueSetDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ValueSetResponseDto> {
    return this.valueSetsService.createValueSet(dto, user);
  }

  /**
   * UC-03-08: lee una página de la expansión vigente del conjunto de valores.
   *
   * Es la contraparte de lectura del `POST ValueSet/:id/$expand`, que
   * **materializa** los miembros y por eso exige `SECURITY_ADMIN`. Ésta sólo los
   * devuelve, así que no pide rol de administración: un campo de formulario
   * necesita la lista de opciones válidas, y exigir rol de seguridad para leerla
   * dejaría el catálogo inutilizable desde el cliente.
   *
   * Pagina por cursor y no por página numerada: la expansión se reemplaza entera
   * cada vez que se re-expande, y con `offset` una re-expansión a mitad de
   * recorrido saltaría o repetiría miembros sin que el cliente se entere.
   *
   * @param id - Conjunto de valores a leer.
   * @param valueSetVersionId - Versión concreta; por defecto, la vigente.
   * @param cursor - Cursor opaco devuelto por la página anterior.
   * @param limit - Tope de miembros por página.
   * @returns Página de miembros con su concepto resuelto.
   */
  @Get(':id/$expand')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-03-08: lee la expansión vigente de un conjunto de valores',
  })
  @ApiQuery({
    name: 'valueSetVersionId',
    required: false,
    description: 'Versión concreta a leer; por defecto la vigente',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: `Miembros por página (por defecto ${DEFAULT_EXPANSION_PAGE_SIZE})`,
  })
  readExpansion(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('valueSetVersionId', new ParseUUIDPipe({ optional: true }))
    valueSetVersionId?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ReadValueSetExpansionResponseDto> {
    return this.valueSetsService.readExpansion(id, {
      valueSetVersionId,
      cursor,
      limit: limit ?? DEFAULT_EXPANSION_PAGE_SIZE,
    });
  }
}
