import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { TenantAgnostic } from '../../../common/tenant/tenant-agnostic.decorator';
import { PORTAL_READ_ROLES } from '../data_catalog.constants';
import {
  BusquedaQueryDto,
  HallazgoIdParamDto,
  OperacionesQueryDto,
  OperacionIdParamDto,
  PaginacionQueryDto,
  ProcesoCodigoParamDto,
  ProcesosQueryDto,
  TablaParamDto,
  TablasQueryDto,
} from '../dto/portal-query.dto';
import {
  ArbolDto,
  DerivaCatalogoDto,
  GlosarioPaginaDto,
  GrafoDto,
  HallazgoDetalleDto,
  HallazgoResumenDto,
  LinajeDto,
  LinajeTablaDto,
  MapaPaginaDto,
  OperacionDetalleDto,
  OperacionesPaginaDto,
  PortalVersionDto,
  ProcesoDetalleDto,
  ProcesosPaginaDto,
  TablaFichaDto,
  TablasPaginaDto,
} from '../dto/portal-response.dto';
import { PortalInventoryService } from '../services/portal-inventory.service';

const NO_DISPONIBLE =
  'El inventario no está disponible o está dañado (`DEPENDENCY_UNAVAILABLE`)';

/**
 * Inventario del sistema para el portal administrativo: operaciones, flujos, catálogo de datos,
 * linaje y glosario, tal como los generó `tools/inventario`.
 *
 * Sólo lectura, sin base de datos y fuera de cualquier tenant: son datos de la plataforma, no de
 * una organización. Los cinco roles son los del catálogo de datos; la API es la autoridad y el
 * frontend sólo evita llevar a alguien a una pantalla que devolvería 403.
 */
@ApiTags('admin-portal')
@ApiBearerAuth()
@Roles(...PORTAL_READ_ROLES)
@TenantAgnostic()
@Controller('admin/portal')
@ApiResponse({ status: 503, description: NO_DISPONIBLE })
export class AdminPortalController {
  constructor(private readonly portal: PortalInventoryService) {}

  /** Versión del inventario que se está mostrando. */
  @Get('version')
  @ApiOperation({ summary: 'Versión y tamaño del inventario publicado' })
  version(): PortalVersionDto {
    return this.portal.version();
  }

  /** Catálogo de operaciones HTTP, con filtros y cursor. */
  @Get('operaciones')
  @ApiOperation({ summary: 'Listar las operaciones HTTP del sistema' })
  listarOperaciones(@Query() query: OperacionesQueryDto): OperacionesPaginaDto {
    return this.portal.listarOperaciones(query);
  }

  /** Ficha de una operación (negocio, contrato, datos, acceso, pruebas). */
  @Get('operaciones/:id')
  @ApiOkResponse({ type: OperacionDetalleDto })
  @ApiOperation({ summary: 'Ver la ficha de una operación' })
  @ApiResponse({
    status: 404,
    description: 'La operación no está en el inventario',
  })
  detalleDeOperacion(
    @Param() { id }: OperacionIdParamDto,
  ): OperacionDetalleDto {
    return this.portal.detalleDeOperacion(id);
  }

  /** Árbol de decisión de una operación. */
  @Get('operaciones/:id/arbol')
  @ApiOkResponse({ type: ArbolDto })
  @ApiOperation({ summary: 'Ver el árbol de decisión de una operación' })
  @ApiResponse({
    status: 404,
    description: 'La operación no está en el inventario',
  })
  arbol(@Param() { id }: OperacionIdParamDto): ArbolDto {
    return this.portal.arbolDeOperacion(id);
  }

  /** Mapa de operaciones (ruta, proceso, riesgo, autorización, quién la llama, señales). */
  @Get('flujos/mapa')
  @ApiOperation({ summary: 'Mapa de operaciones con sus señales' })
  mapa(@Query() query: OperacionesQueryDto): MapaPaginaDto {
    return this.portal.mapa(query);
  }

  /** Hallazgos que salen de cruzar flujos, riesgo, pruebas y consumidores. */
  @Get('flujos/hallazgos')
  @ApiOperation({ summary: 'Resumen de hallazgos del mapa' })
  hallazgos(): HallazgoResumenDto[] {
    return this.portal.hallazgos();
  }

  /** Casos de un hallazgo, paginados. */
  @Get('flujos/hallazgos/:id')
  @ApiOkResponse({ type: HallazgoDetalleDto })
  @ApiOperation({ summary: 'Ver los casos de un hallazgo' })
  @ApiResponse({ status: 404, description: 'No existe ese hallazgo' })
  detalleDeHallazgo(
    @Param() { id }: HallazgoIdParamDto,
    @Query() query: PaginacionQueryDto,
  ): HallazgoDetalleDto {
    return this.portal.detalleDeHallazgo(id, query);
  }

  /** Procesos de negocio (por módulo y críticos). */
  @Get('flujos')
  @ApiOperation({ summary: 'Listar los procesos de negocio' })
  listarProcesos(@Query() query: ProcesosQueryDto): ProcesosPaginaDto {
    return this.portal.listarProcesos(query);
  }

  /** Detalle de un proceso con sus etapas y máquinas de estado. */
  @Get('flujos/:codigo')
  @ApiOkResponse({ type: ProcesoDetalleDto })
  @ApiOperation({
    summary: 'Ver un proceso con sus etapas y máquinas de estado',
  })
  @ApiResponse({ status: 404, description: 'No existe ese proceso' })
  detalleDeProceso(
    @Param() { codigo }: ProcesoCodigoParamDto,
  ): ProcesoDetalleDto {
    return this.portal.detalleDeProceso(codigo);
  }

  /** Grafo de un proceso. */
  @Get('flujos/:codigo/grafo')
  @ApiOkResponse({ type: GrafoDto })
  @ApiOperation({ summary: 'Ver el grafo de un proceso' })
  @ApiResponse({ status: 404, description: 'No existe ese proceso' })
  grafo(@Param() { codigo }: ProcesoCodigoParamDto): GrafoDto {
    return this.portal.grafoDeProceso(codigo);
  }

  /** Tablas del catálogo de datos del modelo. */
  @Get('catalogo/tablas')
  @ApiOperation({ summary: 'Listar las tablas del catálogo de datos' })
  listarTablas(@Query() query: TablasQueryDto): TablasPaginaDto {
    return this.portal.listarTablas(query);
  }

  /** Ficha de una tabla. */
  @Get('catalogo/tablas/:schema/:tabla')
  @ApiOkResponse({ type: TablaFichaDto })
  @ApiOperation({ summary: 'Ver la ficha de una tabla' })
  @ApiResponse({ status: 404, description: 'La tabla no está en el catálogo' })
  fichaDeTabla(@Param() { schema, tabla }: TablaParamDto): TablaFichaDto {
    return this.portal.fichaDeTabla(schema, tabla);
  }

  /** Deriva entre el modelo, el ORM y la base. */
  @Get('catalogo/deriva')
  @ApiOperation({
    summary: 'Deriva entre el DDL del modelo y las entidades del ORM',
  })
  deriva(): DerivaCatalogoDto {
    return this.portal.derivaDelCatalogo();
  }

  /** Métricas del linaje y dominios. */
  @Get('linaje')
  @ApiOperation({ summary: 'Métricas del linaje de datos' })
  linaje(): LinajeDto {
    return this.portal.linaje();
  }

  /** Qué operaciones tocan una tabla y con qué tablas se relaciona. */
  @Get('linaje/tablas/:schema/:tabla')
  @ApiOkResponse({ type: LinajeTablaDto })
  @ApiOperation({ summary: 'Linaje de una tabla' })
  @ApiResponse({ status: 404, description: 'La tabla no está en el linaje' })
  linajeDeTabla(@Param() { schema, tabla }: TablaParamDto): LinajeTablaDto {
    return this.portal.linajeDeTabla(schema, tabla);
  }

  /** Glosario de los términos de la API y del frontend. */
  @Get('glosario')
  @ApiOperation({ summary: 'Buscar en el glosario' })
  glosario(@Query() query: BusquedaQueryDto): GlosarioPaginaDto {
    return this.portal.glosario(query);
  }
}
