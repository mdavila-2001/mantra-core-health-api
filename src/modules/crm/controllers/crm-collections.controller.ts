import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { CrmCollectionsService } from '../services';
import {
  CrmAccountPageDto,
  CrmActivityPageDto,
  CrmCasePageDto,
  LeadPageDto,
  ListAccountsQueryDto,
  ListActivitiesQueryDto,
  ListCasesQueryDto,
  ListLeadsQueryDto,
  ListOpportunitiesQueryDto,
  ListPartnershipsQueryDto,
  OpportunityPageDto,
  PartnershipPageDto,
} from '../dto';

/**
 * `GET` de colección de `crm` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('crm-collections')
@ApiBearerAuth()
@Controller()
export class CrmCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: CrmCollectionsService) {}

  /** V49-01: listar prospectos del tenant. */
  @Get('crm/leads')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @ApiOperation({ summary: 'Listar prospectos del tenant' })
  @ApiOkResponse({ type: LeadPageDto })
  listLeads(@Query() query: ListLeadsQueryDto): Promise<LeadPageDto> {
    return this.collections.listLeads(query);
  }

  /** V49-02: listar oportunidades del tenant. */
  @Get('crm/opportunities')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @ApiOperation({ summary: 'Listar oportunidades del tenant' })
  @ApiOkResponse({ type: OpportunityPageDto })
  listOpportunities(
    @Query() query: ListOpportunitiesQueryDto,
  ): Promise<OpportunityPageDto> {
    return this.collections.listOpportunities(query);
  }

  /** V49-03: listar casos de crm del tenant. */
  @Get('crm/cases')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @ApiOperation({ summary: 'Listar casos de CRM del tenant' })
  @ApiOkResponse({ type: CrmCasePageDto })
  listCases(@Query() query: ListCasesQueryDto): Promise<CrmCasePageDto> {
    return this.collections.listCases(query);
  }

  /** V49-06: listar cuentas de crm del tenant. */
  @Get('crm/accounts')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @ApiOperation({ summary: 'Listar cuentas de CRM del tenant' })
  @ApiOkResponse({ type: CrmAccountPageDto })
  listAccounts(
    @Query() query: ListAccountsQueryDto,
  ): Promise<CrmAccountPageDto> {
    return this.collections.listAccounts(query);
  }

  /** V49-09: listar actividades de crm del tenant. */
  @Get('crm/activities')
  @Roles('CRM_ADMIN', 'CRM_AGENT')
  @ApiOperation({ summary: 'Listar actividades de CRM del tenant' })
  @ApiOkResponse({ type: CrmActivityPageDto })
  listActivities(
    @Query() query: ListActivitiesQueryDto,
  ): Promise<CrmActivityPageDto> {
    return this.collections.listActivities(query);
  }

  /** V49-11: listar alianzas del tenant. */
  @Get('crm/partnerships')
  @Roles('CRM_ADMIN')
  @ApiOperation({ summary: 'Listar alianzas del tenant' })
  @ApiOkResponse({ type: PartnershipPageDto })
  listPartnerships(
    @Query() query: ListPartnershipsQueryDto,
  ): Promise<PartnershipPageDto> {
    return this.collections.listPartnerships(query);
  }
}
