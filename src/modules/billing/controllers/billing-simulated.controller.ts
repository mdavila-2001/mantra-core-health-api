import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, type AuthenticatedUser } from '../../../common';
import { BillingSimulatedService } from '../services/billing-simulated.service';
import {
  SimulatedAnnulDto,
  SimulatedEmailDto,
  SimulatedIssueInvoiceDto,
  SimulatedInstancePaymentDto,
  SimulatedRegisterPaymentDto,
} from '../dto';

/**
 * Facturación SIAT SIMULADA (`/billing/simulated/*`), respaldada por el modelo
 * real de billing (ver `BillingSimulatedService`). Sin `@Roles` a propósito:
 * el paciente y el médico no tienen rol de facturación y SÍ tienen qué mirar o
 * hacer; el permiso lo decide `billing-simulated.access.ts` (administración
 * todo; médico sólo sus consultas; paciente sólo «Mis facturas»). Fuera de su
 * alcance, 404; sin rol operativo, 403.
 */
@ApiTags('billing-simulated')
@ApiBearerAuth()
@Controller('billing/simulated')
export class BillingSimulatedController {
  constructor(private readonly service: BillingSimulatedService) {}

  @Get('status')
  @ApiOperation({
    summary: 'Estado fiscal simulado: emisores y credenciales sintéticas',
  })
  status(@CurrentUser() user: AuthenticatedUser) {
    return this.service.status(user);
  }

  @Get('catalogs')
  @ApiOperation({ summary: 'Catálogos paramétricos del SIAT simulado' })
  catalogs() {
    return this.service.catalogs();
  }

  @Get('charges')
  @ApiOperation({
    summary: 'Cobros de consultas (opcionalmente de una persona)',
  })
  charges(
    @CurrentUser() user: AuthenticatedUser,
    @Query('patientProfileId') patientProfileId?: string,
  ) {
    return this.service.listCharges(user, patientProfileId);
  }

  @Post('charges/:chargeId/payment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar el pago real de un cobro' })
  payment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chargeId') chargeId: string,
    @Body() dto: SimulatedRegisterPaymentDto,
  ) {
    return this.service.registerPayment(user, chargeId, dto.methodCode);
  }

  @Post('charges/:chargeId/instances/:instanceId/payments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Pago de una instancia de plan (no soportado: 409 NOT_A_PLAN)',
  })
  instancePayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chargeId') chargeId: string,
    @Param('instanceId') instanceId: string,
    @Body() dto: SimulatedInstancePaymentDto,
  ) {
    return this.service.registerInstancePayment(
      user,
      chargeId,
      instanceId,
      dto,
    );
  }

  @Post('charges/:chargeId/invoices')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Emitir la factura SIAT simulada de un cobro pagado',
  })
  issue(
    @CurrentUser() user: AuthenticatedUser,
    @Param('chargeId') chargeId: string,
    @Body() dto: SimulatedIssueInvoiceDto,
  ) {
    return this.service.issueInvoice(user, chargeId, dto);
  }

  @Get('invoices/:invoiceId')
  @ApiOperation({
    summary: 'Una factura simulada, dentro del alcance de quien la pide',
  })
  invoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.service.invoice(user, invoiceId);
  }

  @Post('invoices/:invoiceId/annulment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Anular la factura (sólo administración)' })
  annul(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: SimulatedAnnulDto,
  ) {
    return this.service.annul(user, invoiceId, dto);
  }

  @Post('invoices/:invoiceId/annulment-reversal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Revertir la anulación (sólo administración)' })
  revert(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.service.revertAnnulment(user, invoiceId);
  }

  @Post('invoices/:invoiceId/email')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Encolar el envío (simulado, no se envía) de la factura',
  })
  email(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
    @Body() dto: SimulatedEmailDto,
  ) {
    return this.service.email(user, invoiceId, dto);
  }

  @Get('outbox')
  @ApiOperation({ summary: 'Bandeja de correo simulada (sólo administración)' })
  outbox(@CurrentUser() user: AuthenticatedUser) {
    return this.service.outbox(user);
  }

  @Get('my-invoices')
  @ApiOperation({
    summary: 'Mis facturas: recibidas (paciente) o emitidas (quien factura)',
  })
  myInvoices(@CurrentUser() user: AuthenticatedUser) {
    return this.service.myInvoices(user);
  }

  @Get('my-invoices/:invoiceId')
  @ApiOperation({ summary: 'Una de mis facturas' })
  myInvoice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('invoiceId') invoiceId: string,
  ) {
    return this.service.myInvoice(user, invoiceId);
  }
}
