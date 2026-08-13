import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CurrentUser,
  ParseOptionalLimitPipe,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { LedgerReadService, LedgerService } from '../services';
import {
  ChartOfAccountsResponseDto,
  JournalTransactionDetailDto,
  ListJournalQueryDto,
  ListJournalResponseDto,
  TrialBalanceQueryDto,
  TrialBalanceResponseDto,
  CreateAccountDto,
  AccountResponseDto,
  PostJournalDto,
  JournalTransactionResponseDto,
  JournalTransitionDto,
  ReverseJournalDto,
  DetermineAccountsDto,
  DeterminedAccountResponseDto,
  AttachFileDto,
  AccountingStatusDto,
} from '../dto';

/**
 * Libro mayor: alta de cuentas, posteo de asientos por partida doble, reversas,
 * determinación de cuentas y adjuntos. Capa fina que delega en `LedgerService`.
 */
@ApiTags('accounting-ledger')
@ApiBearerAuth()
@Controller('accounting')
export class AccountingLedgerController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param ledgerService - Valor de ledger service requerido por la operación.
   */
  constructor(
    private readonly ledgerService: LedgerService,
    private readonly ledgerReadService: LedgerReadService,
  ) {}

  /* ---- Los libros. La cara de lectura que el módulo no tenía -------------
     Veinte escrituras y ninguna lectura: se podían postear asientos y no había
     forma de verlos. Sin diario, sin plan de cuentas y sin sumas y saldos, la
     contabilidad no se puede auditar — y ninguna pantalla se podía construir.

     Van declaradas **antes** que las rutas con parámetro: Nest resuelve por
     orden y `journal-transactions/:id` capturaría `journal-transactions/…`
     fijas si fueran después. */

  /** UC-16-01·L: el plan de cuentas de una práctica. */
  @Get('accounts')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Plan de cuentas de una práctica' })
  chartOfAccounts(
    @Query('practiceId', ParseUUIDPipe) practiceId: string,
    @Query('limit', new ParseOptionalLimitPipe()) limit?: number,
  ): Promise<ChartOfAccountsResponseDto> {
    return this.ledgerReadService.chartOfAccounts(practiceId, limit);
  }

  /** UC-16-06: balance de sumas y saldos. */
  @Get('trial-balance')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({
    summary: 'Balance de sumas y saldos',
    description:
      'Agrega sólo los asientos POSTEADOS: un borrador no es un hecho contable. Declara `balanced`, que es la comprobación de la que depende que el resto signifique algo.',
  })
  trialBalance(
    @Query() query: TrialBalanceQueryDto,
  ): Promise<TrialBalanceResponseDto> {
    return this.ledgerReadService.trialBalance(query);
  }

  /** UC-16-01·L: el libro diario. */
  @Get('journal-transactions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Libro diario de una práctica' })
  listJournal(
    @Query() query: ListJournalQueryDto,
  ): Promise<ListJournalResponseDto> {
    return this.ledgerReadService.listJournal(query);
  }

  /** UC-16-01·D: el asiento con sus líneas, que es lo que se audita. */
  @Get('journal-transactions/:id')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Un asiento con sus líneas' })
  getJournalTransaction(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<JournalTransactionDetailDto> {
    return this.ledgerReadService.getJournalTransaction(id);
  }

  /** Soporte: alta de cuenta del plan contable. */
  @Post('accounts')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una cuenta del plan contable' })
  createAccount(
    @Body() dto: CreateAccountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccountResponseDto> {
    return this.ledgerService.createAccount(dto, actor);
  }

  /** UC-16-01. */
  @Post('journal-transactions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar y postear un asiento balanceado (partida doble)',
  })
  postJournal(
    @Body() dto: PostJournalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.postJournal(dto, actor);
  }

  /**
   * REDESA C-17 — crea el asiento en estado DRAFT (sin postear). Punto de entrada
   * del flujo canónico DRAFT → AUTO_CLASSIFIED → PENDING_REVIEW → APPROVED → POSTED.
   */
  @Post('journal-transactions/drafts')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear un asiento en borrador (DRAFT, sin postear)',
  })
  createDraft(
    @Body() dto: PostJournalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.createDraft(dto, actor);
  }

  /** REDESA C-17 — DRAFT → AUTO_CLASSIFIED. */
  @Post('journal-transactions/:id/classify')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clasificar automáticamente el asiento' })
  classify(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: JournalTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.classify(id, dto, actor);
  }

  /** REDESA C-17 — AUTO_CLASSIFIED → PENDING_REVIEW. */
  @Post('journal-transactions/:id/submit-review')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Enviar el asiento a revisión' })
  submitReview(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: JournalTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.submitForReview(id, dto, actor);
  }

  /** REDESA C-17 — PENDING_REVIEW → APPROVED (exige rol de aprobación). */
  @Post('journal-transactions/:id/approve')
  @Roles('SECURITY_ADMIN', 'ACCOUNTING_APPROVER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar el asiento (rol de aprobación)' })
  approve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: JournalTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.approve(id, dto, actor);
  }

  /** REDESA C-17 — APPROVED → POSTED (posteo efectivo en el mayor). */
  @Post('journal-transactions/:id/post')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Postear el asiento aprobado (efecto en el mayor)',
  })
  post(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: JournalTransitionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.post(id, dto, actor);
  }

  /** UC-16-02. */
  @Post('postings/determine-accounts')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Determinar la cuenta objetivo por reglas vigentes',
  })
  determineAccounts(
    @Body() dto: DetermineAccountsDto,
  ): Promise<DeterminedAccountResponseDto> {
    return this.ledgerService.determineAccounts(dto);
  }

  /** UC-16-03. */
  @Post('journal-transactions/:id/reverse')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reversar un asiento posteado (líneas espejo)' })
  reverse(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReverseJournalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.reverseJournal(id, dto, actor);
  }

  /** UC-16-13. */
  @Post('journal-transactions/:id/files')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Adjuntar un documento soporte al asiento' })
  attachFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AttachFileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccountingStatusDto> {
    return this.ledgerService.attachFile(id, dto, actor);
  }
}
