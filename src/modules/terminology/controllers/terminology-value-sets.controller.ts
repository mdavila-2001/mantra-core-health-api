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
import { Throttle } from '@nestjs/throttler';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Public,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { ValueSetsService } from '../services';
import {
  CreateValueSetDto,
  ReadValueSetExpansionResponseDto,
  SearchValueSetsResponseDto,
  ValueSetResponseDto,
} from '../dto';

/** Tope de miembros por página cuando el cliente no pide uno. */
const DEFAULT_EXPANSION_PAGE_SIZE = 50;

/** Tope de conjuntos por página cuando el cliente no pide uno. */
const DEFAULT_VALUE_SET_PAGE_SIZE = 50;

/**
 * Tope de lecturas por minuto e IP de las dos rutas anónimas del catálogo.
 *
 * Más holgado que el de las rutas públicas de escritura (10/min): un formulario
 * de alta resuelve el conjunto y después lee su expansión, y una pantalla con
 * varios desplegables encadena una pareja de peticiones por cada uno. Sigue
 * siendo un tope: el catálogo es de sólo lectura, pero es una consulta a la base
 * y no se deja sin límite frente a un cliente sin identificar.
 */
const PUBLIC_CATALOG_READ_THROTTLE = { default: { limit: 60, ttl: 60_000 } };

/**
 * Alta de conjuntos de valores (UC-03-07), reservada a `SECURITY_ADMIN`, y
 * lectura del catálogo —listado y expansión vigente (UC-03-08)—, abierta a
 * cualquier cliente, con o sin sesión.
 *
 * `@ApiBearerAuth()` sigue a nivel de clase por el `POST`: mismo criterio que
 * `payments-operations.controller.ts`, donde el `@Public()` convive con la
 * declaración de clase sin repetir seguridad por ruta.
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
   * Listado de conjuntos de valores, buscable por código interno o texto libre.
   *
   * Va declarado **antes** que `:id/$expand` sólo por legibilidad; no compiten,
   * porque aquél tiene dos segmentos.
   *
   * No pide rol, por el mismo motivo que la lectura de la expansión: un campo de
   * formulario necesita resolver su conjunto de valores, y exigir rol de
   * administración para eso deja el catálogo inutilizable desde el cliente.
   *
   * Y no pide **sesión**, que es un paso más allá: el registro público es un
   * formulario sin sesión y su desplegable de departamentos (`VS_BO_DEPARTMENT`)
   * empieza justamente acá. Con la ruta autenticada, esa pantalla recibía 401
   * antes de pintar el primer campo.
   *
   * Es seguro porque lo que devuelve no es de nadie: `terminology.value_sets` y
   * las tablas de su expansión no tienen `tenant_id` —son el catálogo global,
   * fuera del alcance de las políticas RLS por tenant— y ninguna fila contiene
   * datos de un paciente. Lo que sale de acá son códigos y nombres de catálogo.
   *
   * @param code - Código interno exacto, como `administrative-gender`.
   * @param query - Texto libre sobre el código interno y el nombre.
   * @param cursor - Cursor opaco devuelto por la página anterior.
   * @param limit - Tope de conjuntos por página.
   * @returns Página de conjuntos con su versión vigente.
   */
  @Get()
  @Public()
  @Throttle(PUBLIC_CATALOG_READ_THROTTLE)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar conjuntos de valores por código interno o texto',
    description:
      'Permite resolver el uuid de un conjunto desde un código estable, sin hardcodear identificadores por entorno.',
  })
  @ApiQuery({
    name: 'code',
    required: false,
    description: 'Código interno exacto del conjunto',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en el código interno o el nombre',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: `Conjuntos por página (por defecto ${DEFAULT_VALUE_SET_PAGE_SIZE})`,
  })
  searchValueSets(
    @Query('code') code?: string,
    @Query('q') query?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchValueSetsResponseDto> {
    return this.valueSetsService.searchValueSets({
      code,
      query,
      cursor,
      limit: limit ?? DEFAULT_VALUE_SET_PAGE_SIZE,
    });
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
   * Tampoco pide sesión, y va en el mismo lote que el listado de arriba a
   * propósito: resolver el conjunto y leer sus miembros son los dos pasos de una
   * misma lectura, y abrir sólo el primero deja el formulario público con el
   * identificador del catálogo y sin sus opciones.
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
  @Public()
  @Throttle(PUBLIC_CATALOG_READ_THROTTLE)
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
