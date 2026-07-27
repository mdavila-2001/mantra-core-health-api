import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthProvidersConfigService, FederatedLoginService } from '../services';
import {
  CreateProviderDto,
  ProviderResponseDto,
  ConfigureProtocolDto,
  ProtocolConfigResponseDto,
  PublishSigningKeyDto,
  SigningKeyResponseDto,
  RotateSigningKeyDto,
  RotateKeyResponseDto,
  SetAttributeMappingsDto,
  AttributeMappingsResponseDto,
  BindTenantDto,
  BindingResponseDto,
  CreateProvisioningRuleDto,
  ProvisioningRuleResponseDto,
  StartLoginDto,
  StartLoginResponseDto,
  ProcessCallbackDto,
  CallbackResponseDto,
  RequestAccountLinkDto,
  AccountLinkRequestResponseDto,
  CompleteAccountLinkDto,
  CompleteAccountLinkResponseDto,
  UnlinkIdentityDto,
  UnlinkIdentityResponseDto,
} from '../dto';

/**
 * Endpoints de proveedores de identidad y login federado.
 *
 * Nota: los casos de uso escriben `signing-keys:rotate`; Nest 11 interpreta
 * `:` como inicio de parámetro en cualquier punto del segmento, así que la ruta
 * publicada usa segmentos planos (`signing-keys/rotate`), como en el resto del
 * proyecto.
 */
@ApiTags('auth-providers')
@ApiBearerAuth()
@Controller('auth-providers')
export class AuthProvidersController {
  constructor(
    private readonly configService: AuthProvidersConfigService,
    private readonly loginService: FederatedLoginService,
  ) {}

  /** UC-40-01. */
  @Post('identity-providers')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar un proveedor de identidad',
    description:
      'Nace en borrador: sin protocolo configurado no puede autenticar a nadie.',
  })
  createProvider(
    @Body() dto: CreateProviderDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProviderResponseDto> {
    return this.configService.createProvider(dto, actor);
  }

  /** UC-40-02. */
  @Post('identity-providers/:id/protocol-configs')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Configurar el protocolo de un entorno e importar el JWKS',
    description:
      'Reconfigurar reemplaza: sólo hay una configuración activa por entorno.',
  })
  configureProtocol(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfigureProtocolDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProtocolConfigResponseDto> {
    return this.configService.configureProtocol(id, dto, actor);
  }

  /** UC-40-03. */
  @Post('identity-providers/:id/signing-keys')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Publicar una clave de firma del proveedor' })
  publishSigningKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishSigningKeyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SigningKeyResponseDto> {
    return this.configService.publishSigningKey(id, dto, actor);
  }

  /** UC-40-11. */
  @Post('identity-providers/:id/signing-keys/rotate')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Rotar la clave de firma',
    description:
      'Las salientes quedan retirándose durante el periodo de gracia: retirarlas de golpe invalidaría los tokens en vuelo.',
  })
  rotateSigningKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RotateSigningKeyDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<RotateKeyResponseDto> {
    return this.configService.rotateSigningKey(id, dto, actor);
  }

  /** UC-40-04. */
  @Put('identity-providers/:id/attribute-mappings')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fijar el mapeo de atributos del proveedor',
    description:
      'Reemplaza el mapeo completo y exige exactamente un claim identificador.',
  })
  setAttributeMappings(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SetAttributeMappingsDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AttributeMappingsResponseDto> {
    return this.configService.setAttributeMappings(id, dto, actor);
  }

  /** UC-40-05. */
  @Post('tenant-bindings')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Vincular el proveedor a un tenant',
    description:
      'Aprovisionar automáticamente exige declarar el rol por defecto.',
  })
  bindTenant(
    @Body() dto: BindTenantDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<BindingResponseDto> {
    return this.configService.bindTenant(dto, actor);
  }

  /** UC-40-06. */
  @Post('identity-providers/:id/provisioning-rules')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Definir una regla de aprovisionamiento',
    description: 'La prioridad es única: decide la primera regla que case.',
  })
  createProvisioningRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateProvisioningRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ProvisioningRuleResponseDto> {
    return this.configService.createProvisioningRule(id, dto, actor);
  }

  /** UC-40-07. */
  @Post('identity-providers/by-code/:code/authorize')
  @Roles('IDENTITY_ADMIN', 'AUTH_SERVICE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Iniciar el login federado',
    description:
      'Registra el intento y devuelve el `state` que el callback debe presentar.',
  })
  startLogin(
    @Param('code') code: string,
    @Body() dto: StartLoginDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<StartLoginResponseDto> {
    return this.loginService.startLogin(code, dto, actor);
  }

  /** UC-40-08. */
  @Post('identity-providers/by-code/:code/callback')
  @Roles('IDENTITY_ADMIN', 'AUTH_SERVICE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Procesar el callback del proveedor',
    description:
      'Todo desenlace queda registrado. Sin identidad previa devuelve un token de vinculación en lugar de crear el usuario local.',
  })
  processCallback(
    @Param('code') code: string,
    @Body() dto: ProcessCallbackDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CallbackResponseDto> {
    return this.loginService.processCallback(code, dto, actor);
  }

  /** UC-40-09. */
  @Post('account-link-requests')
  @Roles('IDENTITY_ADMIN', 'AUTH_SERVICE')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Solicitar la vinculación de un sujeto externo',
    description:
      'El token se devuelve una sola vez; en la tabla queda su hash.',
  })
  requestAccountLink(
    @Body() dto: RequestAccountLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<AccountLinkRequestResponseDto> {
    return this.loginService.requestAccountLink(dto, actor);
  }

  /** UC-40-10. */
  @Post('account-link-requests/complete')
  @Roles('IDENTITY_ADMIN', 'AUTH_SERVICE')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar la vinculación presentando el token' })
  completeAccountLink(
    @Body() dto: CompleteAccountLinkDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CompleteAccountLinkResponseDto> {
    return this.loginService.completeAccountLink(dto, actor);
  }

  /** UC-40-12. */
  @Post('federated-identities/:id/unlink')
  @Roles('IDENTITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Desvincular una identidad federada',
    description:
      'Se revoca, no se borra: el histórico de logins apunta a ella.',
  })
  unlinkIdentity(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UnlinkIdentityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<UnlinkIdentityResponseDto> {
    return this.loginService.unlinkIdentity(id, dto, actor);
  }
}
