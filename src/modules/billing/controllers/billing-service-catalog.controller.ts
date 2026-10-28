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
  Audited,
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  BillingServiceCatalogService,
  ProcedureImportService,
  ProcedureNomenclatureService,
} from '../services';
import {
  CreateServiceCatalogItemDto,
  ImportProceduresDto,
  ImportProceduresResponseDto,
  MyProcedureSpecialtiesResponseDto,
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
    private readonly procedureImport: ProcedureImportService,
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
  @Audited({
    action: 'BILLING_SERVICE_CREATED',
    entity: 'service_catalog',
    entityId: 'result.id',
  })
  @Post()
  // El alta es de la administración de la organización. Un profesional entra también,
  // pero sólo sobre su consultorio propio: el servicio lo comprueba y responde 404 en
  // cualquier otra práctica. El rol solo no alcanza para decidirlo.
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Dar de alta un servicio en el catálogo maestro',
    description:
      'La administración lo da de alta en cualquier práctica de su organización; un profesional, sólo en su consultorio propio.',
  })
  create(
    @Body() dto: CreateServiceCatalogItemDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ServiceCatalogItemDto> {
    return this.serviceCatalogService.create(dto, actor);
  }

  /**
   * Importa en lote al catálogo de una práctica los procedimientos del arancel.
   *
   * Mismo `@Roles` y mismo alcance que el alta individual: la administración en
   * cualquier práctica de su organización, un profesional sólo en su consultorio
   * propio, y 404 en cualquier otra. Declarada antes de `:id` junto con el resto
   * de las rutas estáticas.
   *
   * @param dto - Práctica y filtro (especialidades, códigos y/o texto).
   * @param actor - Usuario autenticado que ejecuta la operación.
   * @returns Cuántos se crearon, cuántos se saltaron y cuántos coincidían.
   */
  @Audited({
    action: 'BILLING_SERVICE_IMPORTED',
    entity: 'service_catalog',
    entityId: 'body.practiceId',
  })
  @Post('import-procedures')
  @Roles('SECURITY_ADMIN', 'PRACTITIONER', 'CLINICIAN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Importar en lote procedimientos del arancel al catálogo',
    description:
      'Crea en el catálogo de la práctica todos los procedimientos del arancel que cumplan el filtro (especialidades, códigos y/o texto, combinados con Y; al menos uno). Idempotente: salta los códigos que la práctica ya tiene. Tope de 5000 coincidencias (400 si lo excede).',
  })
  importProcedures(
    @Body() dto: ImportProceduresDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ImportProceduresResponseDto> {
    return this.procedureImport.importProcedures(dto, actor);
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
  @Audited({
    action: 'BILLING_SERVICE_UPDATED',
    entity: 'service_catalog',
    entityId: 'param:id',
  })
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
   * Las especialidades del arancel que corresponden al médico autenticado.
   *
   * Sale de las especialidades que el profesional cargó en su perfil, cruzadas
   * con las del arancel sin tildes ni mayúsculas. Vacío si no tiene ninguna
   * cargada o el usuario no es profesional. Declarada antes de `:id`.
   *
   * @param actor - Usuario autenticado.
   * @returns Las especialidades del arancel con su recuento.
   */
  @Get('procedure-specialties/mine')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Listar las especialidades del arancel que corresponden al médico',
  })
  listMyProcedureSpecialties(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyProcedureSpecialtiesResponseDto> {
    return this.procedureImport.listMySpecialties(actor);
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
    description:
      'Palabras a buscar (todas deben aparecer), sin distinguir tildes ni mayúsculas, en el nombre, el código, el grupo o la especialidad',
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
