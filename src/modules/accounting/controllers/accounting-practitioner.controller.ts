import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PractitionerAccountingService } from '../services';
import {
  PaidConsultationsResponseDto,
  RegisterConsultationIncomeDto,
  RegisterSimpleEntryDto,
  PractitionerEntryResponseDto,
} from '../dto';

/**
 * Carril 18 — auto-servicio contable del doctor: registrar ingresos por
 * consultas pagadas, gastos y otros ingresos, sin exponerle el contrato
 * completo del motor de partida doble (`AccountingLedgerController`, que
 * sigue siendo la vía para `SECURITY_ADMIN`/`ACCOUNTING_APPROVER`).
 *
 * Todas las rutas exigen `PRACTITIONER`; el servicio verifica además que el
 * profesional tenga una vinculación activa con la práctica indicada.
 */
@ApiTags('accounting-practitioner')
@ApiBearerAuth()
@Controller('accounting/practitioner')
export class AccountingPractitionerController {
  constructor(
    private readonly practitionerAccounting: PractitionerAccountingService,
  ) {}

  /** Facturas pagadas del profesional, en esa práctica, sin asiento contable todavía. */
  @Get('paid-consultations')
  @Roles('PRACTITIONER')
  @ApiOperation({
    summary: 'Consultas pagadas sin registrar contablemente',
    description:
      'Sale de citas → encuentros → facturas pagadas del profesional autenticado, filtradas por práctica y por no tener ya un asiento asociado.',
  })
  listPaidConsultations(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PaidConsultationsResponseDto> {
    return this.practitionerAccounting.listPaidConsultations(practiceId, actor);
  }

  /** Registrar el ingreso de una consulta pagada. */
  @Post('consultation-income')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar ingreso por consulta pagada',
    description:
      'El importe sale de la factura (paid_total), no del cliente. Ancla la factura al asiento creado y dispara una notificación contable in-app.',
  })
  registerConsultationIncome(
    @Body() dto: RegisterConsultationIncomeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerEntryResponseDto> {
    return this.practitionerAccounting.registerConsultationIncome(dto, actor);
  }

  /** Registrar un gasto o un ingreso que no proviene de una consulta. */
  @Post('entries')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un gasto u otro ingreso',
    description:
      'Crea un asiento en DRAFT de dos líneas balanceadas. Sigue el flujo canónico DRAFT → AUTO_CLASSIFIED → PENDING_REVIEW → APPROVED → POSTED; el profesional puede crear y enviar a revisión, no aprobar ni postear.',
  })
  registerSimpleEntry(
    @Body() dto: RegisterSimpleEntryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<PractitionerEntryResponseDto> {
    return this.practitionerAccounting.registerSimpleEntry(dto, actor);
  }
}
