import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  IntegrationContractsService,
  IntegrationAuthProfilesService,
  IntegrationWebhooksService,
  IntegrationExchangesService,
} from '../services';
import {
  ActivateVersionDto,
  AdvanceCursorDto,
  AuthProfileResponseDto,
  ContractResponseDto,
  ContractVersionResponseDto,
  CreateAuthProfileDto,
  CreateContractDto,
  CreateContractVersionDto,
  CreateWebhookSubscriptionDto,
  ExchangeAttemptResponseDto,
  ExchangeRecordResponseDto,
  ExecuteExchangeDto,
  RecordAttemptDto,
  RetireContractDto,
  RotateCredentialDto,
  StatusResultDto,
  SyncCursorResponseDto,
  WebhookSubscriptionResponseDto,
} from '../dto';

/**
 * Endpoints de gobierno de contratos B2B bajo `/integration/contracts`. Capa fina:
 * valida parámetros/rol y delega en el servicio de dominio correspondiente. Todas
 * las operaciones son administrativas/gobernadas → rol `SECURITY_ADMIN`.
 */
@ApiTags('integration-contracts')
@ApiBearerAuth()
@Roles('SECURITY_ADMIN')
@Controller('integration/contracts')
export class IntegrationContractsController {
  constructor(
    private readonly contractsService: IntegrationContractsService,
    private readonly authProfilesService: IntegrationAuthProfilesService,
    private readonly webhooksService: IntegrationWebhooksService,
    private readonly exchangesService: IntegrationExchangesService,
  ) {}

  /** UC-31-01. */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Definir un contrato de integración' })
  createContract(
    @Body() dto: CreateContractDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContractResponseDto> {
    return this.contractsService.createContract(dto, actor);
  }

  /** UC-31-02. */
  @Post(':id/versions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar una nueva versión de contrato' })
  publishVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateContractVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ContractVersionResponseDto> {
    return this.contractsService.publishVersion(id, dto, actor);
  }

  /** UC-31-10. */
  @Post(':id/versions/:versionId/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activar una versión y transicionar el estado del contrato',
  })
  activateVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('versionId', ParseUUIDPipe) versionId: string,
    @Body() dto: ActivateVersionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.contractsService.activateVersion(id, versionId, dto, actor);
  }

  /** UC-31-03. */
  @Post(':id/auth-profiles')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Configurar perfil de autenticación sender-constrained',
  })
  configureAuthProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateAuthProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AuthProfileResponseDto> {
    return this.authProfilesService.configure(id, dto, actor);
  }

  /** UC-31-11 (rotación de credenciales). */
  @Post(':id/auth-profiles/:apId/rotate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotar las credenciales de un perfil de autenticación',
  })
  rotateCredential(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('apId', ParseUUIDPipe) apId: string,
    @Body() dto: RotateCredentialDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.authProfilesService.rotate(id, apId, dto, actor);
  }

  /** UC-31-04. */
  @Post(':id/webhook-subscriptions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Suscribir un webhook al contrato' })
  subscribeWebhook(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateWebhookSubscriptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<WebhookSubscriptionResponseDto> {
    return this.webhooksService.subscribe(id, dto, actor);
  }

  /** UC-31-05. */
  @Post(':id/exchanges')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Ejecutar un intercambio idempotente (inbound)' })
  executeExchange(
    @Param('id', ParseUUIDPipe) id: string,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Body() dto: ExecuteExchangeDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExchangeRecordResponseDto> {
    return this.exchangesService.executeExchange(
      id,
      idempotencyKey,
      dto,
      actor,
    );
  }

  /** UC-31-06. */
  @Post(':id/exchanges/:recordId/attempts')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un intento de intercambio outbound' })
  recordAttempt(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('recordId', ParseUUIDPipe) recordId: string,
    @Body() dto: RecordAttemptDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExchangeAttemptResponseDto> {
    return this.exchangesService.recordAttempt(id, recordId, dto, actor);
  }

  /** UC-31-08. */
  @Post(':id/sync-cursors/:scope/advance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Avanzar el cursor de sincronización' })
  advanceCursor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('scope') scope: string,
    @Body() dto: AdvanceCursorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SyncCursorResponseDto> {
    return this.exchangesService.advanceCursor(id, scope, dto, actor);
  }

  /** UC-31-11 (retiro del contrato). */
  @Post(':id/retire')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retirar el contrato (soft-delete lógico)' })
  retireContract(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RetireContractDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StatusResultDto> {
    return this.contractsService.retireContract(id, dto, actor);
  }
}
