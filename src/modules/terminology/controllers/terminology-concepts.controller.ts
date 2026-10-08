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
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  ParseUuidListPipe,
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
  GlossaryNeighborhoodDto,
  GlossaryNeighborhoodQueryDto,
  type GlossaryNeighborhoodRequest,
  DEFAULT_NEIGHBORS_PER_GROUP,
  DEFAULT_NEIGHBOR_PAGE_SIZE,
  ConceptDetailDto,
  type DesignationLanguage,
} from '../dto';
import { SUPPORTED_DESIGNATION_LANGUAGES } from '../terminology.constants';

/**
 * Valida el idioma pedido y lo normaliza a mayúsculas.
 *
 * Se rechaza lo desconocido en vez de ignorarlo: pedir `lang=pt` y recibir
 * inglés en silencio es peor que un 400 — la pantalla creería estar mostrando
 * portugués. Ausente sigue siendo válido y significa «como siempre».
 */
function parseLanguage(value?: string): DesignationLanguage | undefined {
  if (value === undefined || value === '') return undefined;
  const normalized = value.toUpperCase() as DesignationLanguage;
  if (!SUPPORTED_DESIGNATION_LANGUAGES.includes(normalized)) {
    throw new BadRequestException(
      `Idioma no admitido: "${value}". Admitidos: ${SUPPORTED_DESIGNATION_LANGUAGES.join(', ')}.`,
    );
  }
  return normalized;
}

/**
 * Lee una bandera de la cadena de consulta.
 *
 * `?includeValueSets` sin valor cuenta como verdadero, que es como se escribe
 * una bandera en una URL a mano. Cualquier otro texto que no sea `true` o `1` es
 * falso: una bandera nunca debería hacer fallar una lectura.
 */
/**
 * Tope del desplazamiento. Un millón de términos es varias veces el glosario
 * más grande que se planifica; pasarse es un error de quien llama, no una
 * página vacía que haya que recorrer.
 */
const MAX_OFFSET = 1_000_000;

/**
 * Lee `offset` como entero no negativo, o `undefined` si no vino.
 *
 * No reutiliza `ParseOptionalLimitPipe` porque ése rechaza el cero, y cero es
 * justamente el desplazamiento de la primera página.
 */
function parseOffset(value?: string): number | undefined {
  if (value === undefined || value === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_OFFSET) {
    throw new BadRequestException(
      `offset debe ser un entero entre 0 y ${MAX_OFFSET}`,
    );
  }
  return parsed;
}

function parseFlag(value?: string): boolean {
  if (value === undefined) return false;
  return value === '' || value === 'true' || value === '1';
}

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
   * Con `ids` hace el camino inverso —de id a etiqueta—, que es el que necesita
   * cualquier pantalla que muestre lo que el contrato devuelve: los estados,
   * ciclos de vida y clasificaciones viajan siempre como `*ConceptId` en UUID.
   *
   * ## Los dos parámetros nuevos, y la promesa que los acompaña
   *
   * `lang` devuelve `display` y `definition` en ese idioma —resueltos desde las
   * designaciones del catálogo, cayendo al texto del sistema de codificación
   * cuando falta la traducción— e `includeValueSets` añade a cada concepto los
   * conjuntos de valores a los que pertenece.
   *
   * **Sin ellos, la respuesta es exactamente la de siempre.** No es una
   * intención: los campos que agregan son claves opcionales que ni siquiera
   * viajan en el JSON si no se piden, y hay una prueba que lo fija. Esta lectura
   * la consumen la agenda, el perfil profesional, los diagnósticos y la ficha
   * clínica a través de `readConceptLabels`, y ninguna de ellas manda estos
   * parámetros.
   *
   * @param query - Texto a buscar en el código o la denominación.
   * @param codeSystemVersionId - Versión del sistema de códigos a la que acotar.
   * @param limit - Tope de resultados.
   * @param ids - Ids de concepto a resolver, separados por coma.
   * @param lang - Idioma preferido de los textos (`ES`/`EN`).
   * @param includeValueSets - Si cada concepto trae sus conjuntos de valores.
   * @returns Conceptos que casan con el filtro.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'UC-03-13: busca conceptos por código/denominación, o resuelve ids a etiqueta',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en el código o la denominación',
  })
  @ApiQuery({
    name: 'ids',
    required: false,
    description:
      'Ids de concepto a resolver, separados por coma (máx. 200). Es la vía para traducir a etiqueta los `*ConceptId` que devuelve el resto del contrato',
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
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: SUPPORTED_DESIGNATION_LANGUAGES,
    description:
      'Idioma preferido de `display` y `definition`. Sin este parámetro la respuesta es idéntica a la histórica; con él, los conceptos sin designación en ese idioma vuelven con su texto original y `translated: false`',
  })
  @ApiQuery({
    name: 'includeValueSets',
    required: false,
    description:
      'Añade a cada concepto los conjuntos de valores a los que pertenece — el camino inverso al de `$expand`',
  })
  @ApiQuery({
    name: 'valueSetId',
    required: false,
    description:
      'Acota a los conceptos de ese conjunto de valores. Es «navegar por categoría»: se combina con `q` y devuelve lo mismo que la búsqueda, no los miembros crudos de `$expand`',
  })
  @ApiQuery({
    name: 'tagValueSetId',
    required: false,
    description:
      'Sólo glosario: además de `valueSetId`, el término tiene que llevar esta etiqueta (intersección)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description:
      'Sólo glosario: cuántos términos saltear. La respuesta trae `total` para armar la paginación',
  })
  searchConcepts(
    @Query('q') query?: string,
    @Query('codeSystemVersionId') codeSystemVersionId?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
    @Query('ids', new ParseUuidListPipe()) ids?: string[],
    @Query('lang') lang?: string,
    @Query('includeValueSets') includeValueSets?: string,
    @Query('valueSetId', new ParseUUIDPipe({ optional: true }))
    valueSetId?: string,
    @Query('tagValueSetId', new ParseUUIDPipe({ optional: true }))
    tagValueSetId?: string,
    @Query('offset') offset?: string,
  ): Promise<SearchConceptsResponseDto> {
    // Resolver por id no debe quedar recortado por el tope de la búsqueda por
    // texto: quien manda 120 ids espera los 120 de vuelta.
    const effectiveLimit = ids
      ? Math.max(limit ?? 50, ids.length)
      : (limit ?? 50);
    const language = parseLanguage(lang);
    const parsedOffset = parseOffset(offset);
    return this.conceptsService.searchConcepts(
      query,
      codeSystemVersionId,
      effectiveLimit,
      ids,
      // El objeto va siempre, pero con las dos capacidades apagadas si no se
      // pidieron: es el servicio el que decide qué consultar de más, y con
      // ambas ausentes no consulta nada de más.
      {
        ...(language === undefined ? {} : { language }),
        ...(valueSetId === undefined ? {} : { valueSetId }),
        ...(tagValueSetId === undefined ? {} : { tagValueSetId }),
        ...(parsedOffset === undefined ? {} : { offset: parsedOffset }),
        includeValueSets: parseFlag(includeValueSets),
      },
    );
  }

  /**
   * El vecindario de un término para el mapa: sus relaciones salientes y
   * entrantes por tipo, con el total real de cada grupo.
   *
   * Va **antes** de `@Get(':conceptId')`, igual que `glossary-graph`: el orden
   * de declaración es el orden de resolución, y una ruta con parámetro
   * declarada antes se comería el segmento fijo.
   *
   * Mismo acceso que `glossary-graph`: lectura del glosario público, sin rol.
   *
   * @param conceptId - Término central.
   * @param query - Idioma, muestra por grupo o página de un grupo.
   * @returns El término central y sus grupos de vecinos.
   */
  @Get(':conceptId/glossary-neighborhood')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lee el vecindario de un término del glosario: relaciones salientes y entrantes agrupadas por tipo',
    description:
      'Sin `type` ni `direction` devuelve una muestra de `perGroup` vecinos por grupo, con el `total` real. Con `type` y `direction` devuelve ese único grupo, paginado con `offset` y `limit`.',
  })
  readGlossaryNeighborhood(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Query() query: GlossaryNeighborhoodQueryDto,
  ): Promise<GlossaryNeighborhoodDto> {
    const request: GlossaryNeighborhoodRequest =
      query.type !== undefined && query.direction !== undefined
        ? {
            type: query.type,
            direction: query.direction,
            offset: query.offset ?? 0,
            limit: query.limit ?? DEFAULT_NEIGHBOR_PAGE_SIZE,
          }
        : { perGroup: query.perGroup ?? DEFAULT_NEIGHBORS_PER_GROUP };
    return this.conceptsService.readGlossaryNeighborhood(
      conceptId,
      parseLanguage(query.lang),
      request,
    );
  }

  /**
   * La ficha de un término: sus textos, sus etiquetas y sus sinónimos.
   *
   * Es lo que abre el glosario al hacer clic en una entrada. Va **después** del
   * `@Get()` de la búsqueda, que no tiene segmento: si estuviera antes, un
   * `:conceptId` se comería la ruta del listado.
   *
   * De sólo lectura y sin rol de administración, por el mismo motivo que la
   * búsqueda: el catálogo es metadato compartido, sin datos de paciente.
   *
   * @param conceptId - Término a leer.
   * @param lang - Idioma preferido de los textos.
   * @returns La ficha completa del término.
   */
  @Get(':conceptId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lee la ficha de un concepto: textos en el idioma pedido, conjuntos de valores a los que pertenece y denominaciones alternativas',
  })
  @ApiQuery({
    name: 'lang',
    required: false,
    enum: SUPPORTED_DESIGNATION_LANGUAGES,
    description: 'Idioma preferido de `display` y `definition`',
  })
  readConcept(
    @Param('conceptId', ParseUUIDPipe) conceptId: string,
    @Query('lang') lang?: string,
  ): Promise<ConceptDetailDto> {
    return this.conceptsService.readConcept(conceptId, parseLanguage(lang));
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
