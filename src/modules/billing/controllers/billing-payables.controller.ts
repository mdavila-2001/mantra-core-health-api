import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { BillsService, PaymentsMadeService } from '../services';
import {
  RegisterBillDto,
  ExecutePaymentMadeDto,
  BillResponseDto,
  PaymentMadeResponseDto,
} from '../dto';

/**
 * Endpoints de cuentas por pagar (CxP) del módulo Billing: registro de facturas de
 * proveedor (three-way match) y ejecución de pagos a proveedor.
 */
@ApiTags('billing-payables')
@ApiBearerAuth()
@Controller('billing')
export class BillingPayablesController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param billsService - Valor de bills service requerido por la operación.
   * @param paymentsMadeService - Valor de payments made service requerido por la operación.
   */
  constructor(
    private readonly billsService: BillsService,
    private readonly paymentsMadeService: PaymentsMadeService,
  ) {}

  /** UC-17-04. */
  @Post('bills')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar factura de proveedor con three-way match',
  })
  registerBill(
    @Body() dto: RegisterBillDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BillResponseDto> {
    return this.billsService.register(dto, actor);
  }

  /** UC-17-05. */
  @Post('payments-made\\:execute')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ejecutar pago a proveedor con asignación' })
  executePayment(
    @Body() dto: ExecutePaymentMadeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaymentMadeResponseDto> {
    return this.paymentsMadeService.execute(dto, actor);
  }
}
