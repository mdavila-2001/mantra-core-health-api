import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { PractitionerSimpleAccountingService } from '../services';
import {
  CreateSimpleAccountDto,
  CreateSimpleRecordDto,
  CreateSimpleTransactionDto,
  SimpleAccountDto,
  SimpleAccountInputDto,
  SimpleAccountingPracticeQueryDto,
  SimpleAccountsResponseDto,
  SimplePractitionerSummaryDto,
  SimpleRecordDto,
  SimpleRecordInputDto,
  SimpleRecordsQueryDto,
  SimpleRecordsResponseDto,
  SimpleSummaryQueryDto,
  SimpleTransactionDto,
  SimpleTransactionInputDto,
  SimpleTransactionsResponseDto,
} from '../dto';
import { RequirePermission } from '../../../common/auth/require-permission.decorator';

/**
 * P49 — la contabilidad simple del doctor: los tres números de arriba, las
 * cuentas, los gastos/activos/deudas con su tipo y las transacciones
 * debe/haber.
 *
 * Es la contabilidad llana del consultorio. **No** reemplaza los libros
 * (`AccountingLedgerController`) ni genera asientos. Todas las rutas exigen
 * `PRACTITIONER`; el servicio verifica además la vinculación activa del
 * profesional con la práctica (la de la fila, en las rutas por `:id`).
 *
 * Validación de contenido → 422 con el motivo en castellano; nombre repetido o
 * cuenta general o en uso → 409.
 */
@ApiTags('accounting-practitioner')
@ApiBearerAuth()
@Controller('accounting/practitioner/simple')
export class AccountingPractitionerSimpleController {
  constructor(private readonly simple: PractitionerSimpleAccountingService) {}

  /* ---- los tres números -------------------------------------------------- */

  @Get('summary')
  @Roles('PRACTITIONER')
  @ApiOperation({
    summary: 'Pacientes atendidos, cobrado y esperado de las aseguradoras',
    description:
      '`patientsSeen`: personas distintas con consulta atendida en el período. `collected`: consultas pagadas del período. `expectedFromInsurers`: a hoy, solicitudes enviadas sin dictamen (por lo facturado) más aprobadas sin pagar (por lo aprobado).',
  })
  summary(
    @Query() query: SimpleSummaryQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimplePractitionerSummaryDto> {
    return this.simple.summary(query.practiceId, query.period, actor);
  }

  /* ---- cuentas ----------------------------------------------------------- */

  @Get('accounts')
  @Roles('PRACTITIONER')
  @ApiOperation({
    summary: 'Cuentas de la contabilidad simple de una práctica',
    description:
      'Incluye las 26 generales (`seeded: true`), que se siembran por práctica al primer acceso, y las propias del doctor.',
  })
  listAccounts(
    @Query() query: SimpleAccountingPracticeQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleAccountsResponseDto> {
    return this.simple.listAccounts(query.practiceId, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_ACCOUNT_CREATED',
    entity: 'practitioner_simple_account',
    entityId: 'result.id',
  })
  @Post('accounts')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear una cuenta (o un tipo de gasto, activo o deuda)',
    description:
      'El código lo asigna el servidor. Nombre único por clase, sin distinguir tildes ni mayúsculas (409).',
  })
  createAccount(
    @Body() dto: CreateSimpleAccountDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleAccountDto> {
    return this.simple.createAccount(dto, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_ACCOUNT_UPDATED',
    entity: 'practitioner_simple_account',
    entityId: 'param:id',
  })
  @Put('accounts/:id')
  @Roles('PRACTITIONER')
  @ApiOperation({
    summary: 'Renombrar una cuenta',
    description:
      'Una cuenta general se renombra pero no cambia de clase; tampoco una que ya usa algún registro o transacción (409).',
  })
  updateAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SimpleAccountInputDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleAccountDto> {
    return this.simple.updateAccount(id, dto, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_ACCOUNT_DELETED',
    entity: 'practitioner_simple_account',
    entityId: 'param:id',
  })
  @Delete('accounts/:id')
  @Roles('PRACTITIONER')
  @RequirePermission('accounting.simple_accounts.delete', {
    resourceIdParam: 'id',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Borrar una cuenta propia',
    description:
      '409 si es una cuenta general o si la usa algún registro o transacción.',
  })
  deleteAccount(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.simple.deleteAccount(id, actor);
  }

  /* ---- gastos, activos y deudas ------------------------------------------ */

  @Get('records')
  @Roles('PRACTITIONER')
  @ApiOperation({
    summary: 'Gastos, activos y deudas de una práctica',
    description:
      'Con `kind` filtra por una de las tres; sin él, devuelve las tres. Más recientes primero.',
  })
  listRecords(
    @Query() query: SimpleRecordsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleRecordsResponseDto> {
    return this.simple.listRecords(query.practiceId, query.kind, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_RECORD_CREATED',
    entity: 'practitioner_simple_record',
    entityId: 'result.id',
  })
  @Post('records')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un gasto, un activo o una deuda',
    description:
      'El tipo es una cuenta de la clase que corresponde: gasto → EXPENSE, activo → ASSET, deuda → LIABILITY. No genera asiento.',
  })
  createRecord(
    @Body() dto: CreateSimpleRecordDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleRecordDto> {
    return this.simple.createRecord(dto, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_RECORD_UPDATED',
    entity: 'practitioner_simple_record',
    entityId: 'param:id',
  })
  @Put('records/:id')
  @Roles('PRACTITIONER')
  @ApiOperation({ summary: 'Editar un gasto, un activo o una deuda' })
  updateRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SimpleRecordInputDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleRecordDto> {
    return this.simple.updateRecord(id, dto, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_RECORD_DELETED',
    entity: 'practitioner_simple_record',
    entityId: 'param:id',
  })
  @Delete('records/:id')
  @Roles('PRACTITIONER')
  @RequirePermission('accounting.simple_records.delete', {
    resourceIdParam: 'id',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borrar un gasto, un activo o una deuda' })
  deleteRecord(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.simple.deleteRecord(id, actor);
  }

  /* ---- transacciones debe/haber ------------------------------------------ */

  @Get('transactions')
  @Roles('PRACTITIONER')
  @ApiOperation({
    summary: 'Transacciones debe/haber de una práctica',
    description: 'Más recientes primero.',
  })
  listTransactions(
    @Query() query: SimpleAccountingPracticeQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleTransactionsResponseDto> {
    return this.simple.listTransactions(query.practiceId, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_TRANSACTION_CREATED',
    entity: 'practitioner_simple_transaction',
    entityId: 'result.id',
  })
  @Post('transactions')
  @Roles('PRACTITIONER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar una transacción debe/haber',
    description:
      'Las cuentas del debe y del haber son distintas. No es un asiento del libro mayor.',
  })
  createTransaction(
    @Body() dto: CreateSimpleTransactionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleTransactionDto> {
    return this.simple.createTransaction(dto, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_TRANSACTION_UPDATED',
    entity: 'practitioner_simple_transaction',
    entityId: 'param:id',
  })
  @Put('transactions/:id')
  @Roles('PRACTITIONER')
  @ApiOperation({ summary: 'Editar una transacción debe/haber' })
  updateTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SimpleTransactionInputDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SimpleTransactionDto> {
    return this.simple.updateTransaction(id, dto, actor);
  }

  @Audited({
    action: 'PRACTITIONER_SIMPLE_TRANSACTION_DELETED',
    entity: 'practitioner_simple_transaction',
    entityId: 'param:id',
  })
  @Delete('transactions/:id')
  @Roles('PRACTITIONER')
  @RequirePermission('accounting.simple_transactions.delete', {
    resourceIdParam: 'id',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Borrar una transacción debe/haber' })
  deleteTransaction(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<void> {
    return this.simple.deleteTransaction(id, actor);
  }
}
