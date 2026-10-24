import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../common';
import { PaymentsCollectionsService } from '../services';
import {
  FeeSchedulePageDto,
  ListCheckoutSessionsQueryDto,
  ListFeeSchedulesQueryDto,
  ListIntentsQueryDto,
  ListPayoutsQueryDto,
  ListReconciliationRunsQueryDto,
  PaymentCheckoutSessionPageDto,
  PaymentIntentPageDto,
  PaymentsPayoutPageDto,
  PaymentsReconciliationRunPageDto,
} from '../dto';

/**
 * `GET` de colección de `payments` que el catálogo de vistas esperaba.
 *
 * Cada handler declara su `@Roles(...)`: el mismo que exigen las escrituras
 * del recurso. La página la acota al tenant del contexto el servicio.
 */
@ApiTags('payments-collections')
@ApiBearerAuth()
@Controller()
export class PaymentsCollectionsController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param collections - Lecturas de colección del módulo.
   */
  constructor(private readonly collections: PaymentsCollectionsService) {}

  /** V42-02: listar sesiones de cobro del tenant. */
  @Get('payments/checkout-sessions')
  @Roles('PAYMENTS_ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Listar sesiones de cobro del tenant' })
  @ApiOkResponse({ type: PaymentCheckoutSessionPageDto })
  listCheckoutSessions(
    @Query() query: ListCheckoutSessionsQueryDto,
  ): Promise<PaymentCheckoutSessionPageDto> {
    return this.collections.listCheckoutSessions(query);
  }

  /** V42-03: listar aranceles del tenant. */
  @Get('payments/fee-schedules')
  @Roles('PAYMENTS_ADMIN')
  @ApiOperation({ summary: 'Listar aranceles del tenant' })
  @ApiOkResponse({ type: FeeSchedulePageDto })
  listFeeSchedules(
    @Query() query: ListFeeSchedulesQueryDto,
  ): Promise<FeeSchedulePageDto> {
    return this.collections.listFeeSchedules(query);
  }

  /** V42-04: listar intenciones de pago del tenant. */
  @Get('payments/intents')
  @Roles('PAYMENTS_ADMIN', 'CASHIER')
  @ApiOperation({ summary: 'Listar intenciones de pago del tenant' })
  @ApiOkResponse({ type: PaymentIntentPageDto })
  listIntents(
    @Query() query: ListIntentsQueryDto,
  ): Promise<PaymentIntentPageDto> {
    return this.collections.listIntents(query);
  }

  /** V42-09: listar liquidaciones del tenant. */
  @Get('payments/payouts')
  @Roles('PAYMENTS_ADMIN')
  @ApiOperation({ summary: 'Listar liquidaciones del tenant' })
  @ApiOkResponse({ type: PaymentsPayoutPageDto })
  listPayouts(
    @Query() query: ListPayoutsQueryDto,
  ): Promise<PaymentsPayoutPageDto> {
    return this.collections.listPayouts(query);
  }

  /** V42-10: listar conciliaciones de pagos del tenant. */
  @Get('payments/reconciliation-runs')
  @Roles('PAYMENTS_ADMIN')
  @ApiOperation({ summary: 'Listar conciliaciones de pagos del tenant' })
  @ApiOkResponse({ type: PaymentsReconciliationRunPageDto })
  listReconciliationRuns(
    @Query() query: ListReconciliationRunsQueryDto,
  ): Promise<PaymentsReconciliationRunPageDto> {
    return this.collections.listReconciliationRuns(query);
  }
}
