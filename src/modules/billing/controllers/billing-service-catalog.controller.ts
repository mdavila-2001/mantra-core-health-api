import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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
import { BillingServiceCatalogService } from '../services';
import {
  CreateServiceCatalogItemDto,
  SearchServiceCatalogResponseDto,
  ServiceCatalogItemDto,
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
}
