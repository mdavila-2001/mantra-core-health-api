import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { InsuranceReadService } from '../services';
import {
  BrokerDirectoryResponseDto,
  BrokerPortfolioResponseDto,
  BrokerProfileDto,
  CarrierDetailDto,
  CarrierDirectoryResponseDto,
} from '../dto';

/**
 * Lecturas del módulo 26 sobre el tenant activo.
 *
 * **No exigen rol global**, por la misma razón que las rutas de organización de
 * `directory`: quien administra una aseguradora no es un administrador de la
 * plataforma, y pedirle `SECURITY_ADMIN` para ver su propio catálogo dejaría la
 * pantalla fuera del alcance de su único usuario legítimo. El aislamiento lo da
 * el tenant del contexto, que el interceptor sólo fija para quien pertenece a
 * él; un id de otra organización responde 404, no 403, para que el error no
 * sirva para sondear qué identificadores existen.
 *
 * Las escrituras del catálogo siguen en `InsuranceBackboneController` y siguen
 * siendo administrativas: esto añade la cara de lectura que faltaba, no
 * relaja la de escritura.
 */
@ApiTags('insurance-read')
@ApiBearerAuth()
@Controller()
export class InsuranceReadController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param readService - Servicio de lectura del módulo.
   */
  constructor(private readonly readService: InsuranceReadService) {}

  /**
   * Aseguradoras del tenant activo.
   *
   * @returns Listado con el volumen de catálogo de cada una.
   */
  @Get('insurance-carriers')
  @ApiOperation({ summary: 'Listar las aseguradoras del tenant activo' })
  @ApiOkResponse({ type: CarrierDirectoryResponseDto })
  listCarriers(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CarrierDirectoryResponseDto> {
    return this.readService.listCarriers(actor);
  }

  /**
   * Catálogo comercial y red de una aseguradora.
   *
   * @param id - Aseguradora consultada.
   * @returns Productos con sus planes y beneficios, y las redes activas.
   */
  @Get('insurance-carriers/:id')
  @ApiOperation({
    summary: 'Consultar el catálogo y la red de una aseguradora',
  })
  @ApiOkResponse({ type: CarrierDetailDto })
  getCarrier(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CarrierDetailDto> {
    return this.readService.getCarrier(id, actor);
  }

  /**
   * Brokers del tenant activo.
   *
   * @returns Listado con su situación de vinculación vigente.
   */
  @Get('insurance-brokers')
  @ApiOperation({ summary: 'Listar los brokers del tenant activo' })
  @ApiOkResponse({ type: BrokerDirectoryResponseDto })
  listBrokers(): Promise<BrokerDirectoryResponseDto> {
    return this.readService.listBrokers();
  }

  /**
   * Perfil de un broker con su historial de vinculaciones.
   *
   * @param id - Broker consultado.
   * @returns Perfil y acuerdos, marcando cuáles siguen vigentes.
   */
  @Get('insurance-brokers/:id')
  @ApiOperation({
    summary: 'Consultar el perfil y las vinculaciones de un broker',
  })
  @ApiOkResponse({ type: BrokerProfileDto })
  getBroker(@Param('id', ParseUUIDPipe) id: string): Promise<BrokerProfileDto> {
    return this.readService.getBroker(id);
  }

  /**
   * Cartera comercial de un broker.
   *
   * Devuelve a quién atiende, no qué le pasa: ni un campo clínico viaja en esta
   * respuesta.
   *
   * @param id - Broker cuya cartera se consulta.
   * @returns Relaciones broker–cliente.
   */
  @Get('insurance-brokers/:id/clients')
  @ApiOperation({
    summary: 'Listar la cartera comercial de un broker (sin datos clínicos)',
  })
  @ApiOkResponse({ type: BrokerPortfolioResponseDto })
  listBrokerClients(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BrokerPortfolioResponseDto> {
    return this.readService.listBrokerClients(id);
  }
}
