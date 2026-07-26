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
import { LedgerService } from '../services';
import {
  CreateAccountDto,
  AccountResponseDto,
  PostJournalDto,
  JournalTransactionResponseDto,
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
  constructor(private readonly ledgerService: LedgerService) {}

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
  @ApiOperation({ summary: 'Registrar y postear un asiento balanceado (partida doble)' })
  postJournal(
    @Body() dto: PostJournalDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<JournalTransactionResponseDto> {
    return this.ledgerService.postJournal(dto, actor);
  }

  /** UC-16-02. */
  @Post('postings/determine-accounts')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Determinar la cuenta objetivo por reglas vigentes' })
  determineAccounts(@Body() dto: DetermineAccountsDto): Promise<DeterminedAccountResponseDto> {
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
