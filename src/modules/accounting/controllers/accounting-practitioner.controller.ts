import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { PractitionerAccountingService } from '../services';
import {
  PaidConsultationsResponseDto,
  RegisterConsultationIncomeDto,
  RegisterSimpleEntryDto,
  PractitionerEntryResponseDto,
  CapitalizeAssetDto,
  AssetResponseDto,
  AssetSummaryDto,
  SetAutomationDto,
  RegisterAssetProgressDto,
  CreateOwnLiabilityDto,
  LiabilityCreatedResponseDto,
  LiabilitySummaryDto,
  RegisterLiabilityProgressDto,
  ProgressRegisteredResponseDto,
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

  /* ==========================================================================
      FT-26 — auto-servicio de activos y pasivos del doctor.
      ========================================================================== */

  /** Los activos de una práctica del profesional. */
  @Get('assets')
  @Roles('PRACTITIONER')
  @ApiOperation({ summary: 'Listar los activos propios de una práctica' })
  listAssets(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<readonly AssetSummaryDto[]> {
    return this.practitionerAccounting.listAssets(practiceId, actor);
  }

  /** Da de alta un activo propio. Mismo contrato que `SECURITY_ADMIN` usa en `/accounting/assets/capitalize`. */
  @Post('assets')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta un activo propio' })
  capitalizeAsset(
    @Body() dto: CapitalizeAssetDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AssetResponseDto> {
    return this.practitionerAccounting.capitalizeOwnAsset(dto, actor);
  }

  /** Prende o apaga la automatización de un activo propio. */
  @Patch('assets/:id/automation')
  @Roles('PRACTITIONER')
  @ApiOperation({ summary: 'Prender o apagar la automatización de un activo' })
  setAssetAutomation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAutomationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.practitionerAccounting.setAssetAutomation(id, dto, actor);
  }

  /** "Registrar avance": una corrida de depreciación acotada a este activo. */
  @Post('assets/:id/progress')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar el avance (depreciación) de un activo' })
  registerAssetProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterAssetProgressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProgressRegisteredResponseDto> {
    return this.practitionerAccounting.registerAssetProgress(id, dto, actor);
  }

  /** Los pasivos de una práctica del profesional. */
  @Get('liabilities')
  @Roles('PRACTITIONER')
  @ApiOperation({ summary: 'Listar los pasivos propios de una práctica' })
  listLiabilities(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<readonly LiabilitySummaryDto[]> {
    return this.practitionerAccounting.listLiabilities(practiceId, actor);
  }

  /** Da de alta un pasivo propio con su cronograma de amortización. */
  @Post('liabilities')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dar de alta un pasivo propio (préstamo)' })
  createLiability(
    @Body() dto: CreateOwnLiabilityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<LiabilityCreatedResponseDto> {
    return this.practitionerAccounting.createOwnLiability(dto, actor);
  }

  /** Prende o apaga la automatización de un pasivo propio. */
  @Patch('liabilities/:id/automation')
  @Roles('PRACTITIONER')
  @ApiOperation({ summary: 'Prender o apagar la automatización de un pasivo' })
  setLiabilityAutomation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAutomationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.practitionerAccounting.setLiabilityAutomation(id, dto, actor);
  }

  /** "Registrar avance": liquida la próxima cuota pendiente del pasivo. */
  @Post('liabilities/:id/progress')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar el avance (pago de cuota) de un pasivo' })
  registerLiabilityProgress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegisterLiabilityProgressDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProgressRegisteredResponseDto> {
    return this.practitionerAccounting.registerLiabilityProgress(id, dto, actor);
  }
}
