import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AccountingReadService } from '../services';
import {
  CockpitAccrualsDto,
  CockpitDimensionsDto,
  CockpitDocumentFlowDto,
  CockpitFiscalYearDto,
  CockpitFixedAssetsDto,
  CockpitOpenItemsPageDto,
  CockpitOpenItemsQueryDto,
} from '../dto';

/**
 * Las seis lecturas del cockpit contable (`/accounting/cockpit` del front):
 * proyecciones de solo lectura sobre lo que el módulo ya escribe. Capa fina
 * que delega en `AccountingReadService`.
 */
@ApiTags('accounting-cockpit')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingCockpitController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param accountingReadService - Las seis lecturas del cockpit.
   */
  constructor(private readonly accountingReadService: AccountingReadService) {}

  /** El ejercicio fiscal vigente de una práctica, con sus períodos. */
  @Get('fiscal-years')
  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Ejercicio fiscal vigente de una práctica',
    description:
      'El ejercicio que cubre hoy, o el más reciente si ninguno la cubre. 404 si la práctica no tiene ejercicios fiscales todavía.',
  })
  @ApiOkResponse({ type: CockpitFiscalYearDto })
  fiscalYear(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CockpitFiscalYearDto> {
    return this.accountingReadService.fiscalYear(practiceId, actor);
  }

  /** La cartera abierta de una práctica, con su antigüedad. */
  @Get('open-items')
  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Cartera abierta de una práctica',
    description: `Excluye las partidas saldadas. Sin paginación (el contrato del front no declara cursor); tope interno de ${5_000} partidas por respuesta.`,
  })
  @ApiOkResponse({ type: CockpitOpenItemsPageDto })
  openItems(
    @Query() query: CockpitOpenItemsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CockpitOpenItemsPageDto> {
    return this.accountingReadService.openItems(query, actor);
  }

  /** Debe/haber/resultado por centro de coste, centro de beneficio y segmento. */
  @Get('dimensions')
  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Dimensiones analíticas de una práctica',
    description:
      'Sólo asientos POSTEADOS. El segmento da 0.00 en casi todos los casos: el camino de escritura del módulo no imputa segmento hoy.',
  })
  @ApiOkResponse({ type: CockpitDimensionsDto })
  dimensions(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CockpitDimensionsDto> {
    return this.accountingReadService.dimensions(practiceId, actor);
  }

  /** El flujo de un asiento: su origen, él mismo, y su reversión, si la tiene. */
  @Get('journal-transactions/:id/document-flow')
  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Flujo del documento de un asiento',
    description:
      'Sólo reversiones (`ACCT_REL_REVERSES`): es lo único que el catálogo declara y ejerce hoy.',
  })
  @ApiOkResponse({ type: CockpitDocumentFlowDto })
  documentFlow(
    @Param('id', ParseUUIDPipe) transactionId: string,
  ): Promise<CockpitDocumentFlowDto> {
    return this.accountingReadService.documentFlow(transactionId);
  }

  /** El registro de activos fijos de una práctica. */
  @Get('assets')
  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER', 'PRACTITIONER')
  @ApiOperation({
    summary: 'Registro de activos fijos de una práctica',
    description:
      'La cuota mensual es la que costaría la próxima corrida en un período todavía no corrido, no una amortización ya asentada.',
  })
  @ApiOkResponse({ type: CockpitFixedAssetsDto })
  fixedAssets(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CockpitFixedAssetsDto> {
    return this.accountingReadService.fixedAssets(practiceId, actor);
  }

  /** El registro de devengos de una práctica. */
  @Get('accrual-objects')
  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER', 'PRACTITIONER')
  @ApiOperation({ summary: 'Registro de devengos de una práctica' })
  @ApiOkResponse({ type: CockpitAccrualsDto })
  accrualObjects(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CockpitAccrualsDto> {
    return this.accountingReadService.accrualObjects(practiceId, actor);
  }
}
