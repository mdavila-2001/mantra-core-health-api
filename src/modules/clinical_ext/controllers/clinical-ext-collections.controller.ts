import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { ClinicalExtCollectionsService } from '../services';
import {
  CdsRulePageDto,
  ImmunizationSchedulePageDto,
  ListCdsRulesQueryDto,
  ListImmunizationSchedulesQueryDto,
  ListOrderSetsQueryDto,
  OrderSetPageDto,
} from '../dto';

/**
 * `GET` de colección de `clinical_ext` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('clinical-ext-collections')
@ApiBearerAuth()
@Controller()
export class ClinicalExtCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: ClinicalExtCollectionsService) {}

  /** V18-09: listar las reglas de apoyo a la decisión clínica del tenant. */
  @Get('cds-rules')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Listar las reglas de apoyo a la decisión clínica del tenant',
  })
  @ApiOkResponse({ type: CdsRulePageDto })
  listCdsRules(@Query() query: ListCdsRulesQueryDto): Promise<CdsRulePageDto> {
    return this.collections.listCdsRules(query);
  }

  /** V18-05: listar los conjuntos de órdenes del tenant. */
  @Get('order-sets')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar los conjuntos de órdenes del tenant' })
  @ApiOkResponse({ type: OrderSetPageDto })
  listOrderSets(
    @Query() query: ListOrderSetsQueryDto,
  ): Promise<OrderSetPageDto> {
    return this.collections.listOrderSets(query);
  }

  /** V18-12: listar los esquemas de inmunización del tenant. */
  @Get('immunization-schedules')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Listar los esquemas de inmunización del tenant' })
  @ApiOkResponse({ type: ImmunizationSchedulePageDto })
  listImmunizationSchedules(
    @Query() query: ListImmunizationSchedulesQueryDto,
  ): Promise<ImmunizationSchedulePageDto> {
    return this.collections.listImmunizationSchedules(query);
  }
}
