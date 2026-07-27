import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  LedgerService,
  ReconciliationService,
  DunningService,
  KpiSnapshotsService,
} from '../services';
import {
  PostToLedgerDto,
  ReconciliationClearDto,
  ExecuteDunningRunDto,
  ComputeKpiSnapshotDto,
  PostingResultDto,
  ReconciliationResultDto,
  DunningRunResponseDto,
  KpiSnapshotResponseDto,
} from '../dto';

/**
 * Endpoints financieros transversales del módulo Billing: contabilización a
 * ledger, conciliación bancaria, ciclo de morosidad y snapshots de KPI.
 */
@ApiTags('billing-operations')
@ApiBearerAuth()
@Controller('billing')
export class BillingOperationsController {
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly reconciliationService: ReconciliationService,
    private readonly dunningService: DunningService,
    private readonly kpiService: KpiSnapshotsService,
  ) {}

  /** UC-17-06. */
  @Post('documents/:id\\:post-to-ledger')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Contabilizar documento (posting CxC/CxP)' })
  postToLedger(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PostToLedgerDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PostingResultDto> {
    return this.ledgerService.postToLedger(id, dto, actor);
  }

  /** UC-17-07. */
  @Post('reconciliation\\:clear')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conciliar pagos vía documento de compensación' })
  reconcile(
    @Body() dto: ReconciliationClearDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReconciliationResultDto> {
    return this.reconciliationService.clear(dto, actor);
  }

  /** UC-17-10. */
  @Post('dunning-runs\\:execute')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ejecutar ciclo de morosidad (dunning)' })
  executeDunning(
    @Body() dto: ExecuteDunningRunDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DunningRunResponseDto> {
    return this.dunningService.execute(dto, actor);
  }

  /** UC-17-12. */
  @Post('kpi-snapshots\\:compute')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Calcular snapshot de KPI financiero y aging' })
  computeKpi(
    @Body() dto: ComputeKpiSnapshotDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<KpiSnapshotResponseDto> {
    return this.kpiService.compute(dto, actor);
  }
}
