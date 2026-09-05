import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import {
  BillingServiceCatalogService,
  ProcedureNomenclatureService,
} from '../services';
import {
  CreateServiceCatalogItemDto,
  ProcedureNomenclatureResponseDto,
  ProcedureSpecialtiesResponseDto,
  SearchServiceCatalogResponseDto,
  ServiceCatalogItemDto,
  UpdateServiceCatalogItemDto,
} from '../dto';

/** Tope de servicios por página cuando el cliente no pide uno. */
const DEFAULT_PAGE_SIZE = 50;

/**
 * Catálogo maestro de servicios de facturación (punto 3 del reclamo): la lista
 * fija sobre la que se arman los presupuestos. La lectura no exige rol de
 * administración —cualquier profesional que cotice necesita resolverla—, el alta
 * sí, porque es la lista la que queda fija y no cada profesional inventando
 * servicios nuevos.
 */
@ApiTags('billing-service-catalog')
@ApiBearerAuth()
@Controller('billing/service-catalog')
export class BillingServiceCatalogController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param serviceCatalogService - Valor de service catalog service requerido por la operación.
   */
  constructor(
    private readonly serviceCatalogService: BillingServiceCatalogService,
    private readonly nomenclature: ProcedureNomenclatureService,
  ) {}

  /**
   * Lista el catálogo de servicios de una práctica, buscable por código o nombre.
   *
   * @param practiceId - Práctica dueña del catálogo.
   * @param query - Texto libre sobre código o nombre.
   * @param isActive - Filtra por servicios activos/inactivos.
   * @param cursor - Cursor opaco devuelto por la página anterior.
   * @param limit - Tope de servicios por página.
   * @returns Página de servicios del catálogo.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar el catálogo de servicios de la práctica',
  })
  @ApiQuery({
    name: 'practiceId',
    required: true,
    description: 'Práctica (uuid)',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en el código o el nombre',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filtra por servicios activos (`true`) o inactivos (`false`)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: `Servicios por página (por defecto ${DEFAULT_PAGE_SIZE})`,
  })
  search(
    @Query('practiceId') practiceId: string,
    @Query('q') query?: string,
    @Query('isActive') isActive?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<SearchServiceCatalogResponseDto> {
    return this.serviceCatalogService.search({
      practiceId,
      query,
      isActive: isActive === undefined ? undefined : isActive === 'true',
      cursor,
      limit: limit ?? DEFAULT_PAGE_SIZE,
    });
  }

  /**
   * Crea un servicio nuevo en el catálogo maestro.
   *
   * @param dto - Datos validados de la operación.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Servicio recién creado.
   */
  @Post()
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta un servicio en el catálogo maestro' })
  create(
    @Body() dto: CreateServiceCatalogItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceCatalogItemDto> {
    return this.serviceCatalogService.create(dto, actor);
  }

  /**
   * Corrige un servicio del catálogo de una práctica propia.
   *
   * Los roles son más anchos que los del alta a propósito: quien atiende pone el
   * precio de lo que ofrece en **su** práctica, y la cuenta administradora
   * corrige lo que dio de alta. El alcance no lo decide el rol sino la
   * vinculación —o el tenant—, y se comprueba en el servicio; un servicio de otra
   * práctica responde **404**, igual que uno inexistente.
   *
   * @param id - Servicio a corregir.
   * @param dto - Campos a corregir; los ausentes se conservan.
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns El servicio ya corregido.
   */
  @Patch(':id')
  @Roles('PRACTITIONER', 'CLINICIAN', 'SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Corregir un servicio del catálogo de mi práctica' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateServiceCatalogItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceCatalogItemDto> {
    return this.serviceCatalogService.update(id, dto, actor);
  }

  /**
   * Las especialidades del nomenclador de procedimientos, con su recuento.
   *
   * Es lo que permite dibujar el filtro **sin traer las 4408 entradas**: la
   * pantalla pide esto una vez y después pagina dentro de la especialidad
   * elegida.
   *
   * Sin `@Roles` por la misma razón que la lectura del catálogo: es un arancel
   * de referencia público, y cualquier profesional que arme un presupuesto
   * necesita resolverlo. Lo que sigue siendo administrativo es el **alta** del
   * servicio.
   *
   * @returns Las especialidades, ordenadas en español.
   */
  @Get('procedure-specialties')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar las especialidades del nomenclador de procedimientos',
  })
  listProcedureSpecialties(): Promise<ProcedureSpecialtiesResponseDto> {
    return this.nomenclature.listSpecialties();
  }

  /**
   * El nomenclador de procedimientos, por cursor.
   *
   * @param specialty - Especialidad exacta del arancel.
   * @param query - Texto libre sobre el nombre del procedimiento.
   * @param cursor - Cursor opaco devuelto por la página anterior.
   * @param limit - Entradas por página.
   * @returns La página del nomenclador.
   */
  @Get('procedures')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar el nomenclador de procedimientos (arancel de referencia)',
  })
  @ApiQuery({
    name: 'specialty',
    required: false,
    description: 'Especialidad exacta, tal cual la publica el arancel',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Texto a buscar en el nombre del procedimiento',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    description: 'Cursor opaco devuelto por la página anterior',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Entradas por página',
  })
  searchProcedures(
    @Query('specialty') specialty?: string,
    @Query('q') query?: string,
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ProcedureNomenclatureResponseDto> {
    return this.nomenclature.search({ specialty, query, cursor, limit });
  }
}
