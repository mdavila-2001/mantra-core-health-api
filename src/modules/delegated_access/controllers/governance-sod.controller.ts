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
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  NotAudited,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import {
  CreateSodRuleDto,
  FourEyesRequestedDto,
  ListSodExceptionsResponseDto,
  ListSodFindingsResponseDto,
  ListSodRulesResponseDto,
  RequestSodExceptionDto,
  RevokeSodExceptionDto,
  SodExceptionViewDto,
  SodRuleViewDto,
  UpdateSodRuleDto,
} from '../dto';
import { SodService } from '../services/sod.service';

/**
 * Segregación de funciones (CONTRATO-GOBIERNO §6.3): reglas, hallazgos y
 * excepciones. `SECURITY_ADMIN` opera toda la organización; un administrador
 * delegado (`SUPPORT_STAFF`) solo lee, con el átomo que cada ruta indica y
 * dentro de su alcance (lo decide el servicio, no el rol).
 */
@ApiTags('delegated-access-governance')
@ApiBearerAuth()
@Controller('org/governance')
export class GovernanceSodController {
  /** @param sod - Segregación de funciones. */
  constructor(private readonly sod: SodService) {}

  /** Reglas SoD efectivas: plataforma y organización. */
  @Get('sod-rules')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Reglas de segregación de funciones' })
  rules(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListSodRulesResponseDto> {
    return this.sod.listRules(actor);
  }

  /** Crea una regla propia o endurece una de plataforma. */
  @Audited({
    action: 'SOD_RULE_CREATED',
    entity: 'sod_rule',
    entityId: 'result.id',
  })
  @Post('sod-rules')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear o endurecer una regla de segregación de funciones',
  })
  createRule(
    @Body() dto: CreateSodRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SodRuleViewDto> {
    return this.sod.createRule(dto, actor);
  }

  /** Edita una regla propia. */
  @Audited({
    action: 'SOD_RULE_UPDATED',
    entity: 'sod_rule',
    entityId: 'param:id',
  })
  @Patch('sod-rules/:id')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Editar una regla de segregación de funciones propia',
  })
  updateRule(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSodRuleDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SodRuleViewDto> {
    return this.sod.updateRule(id, dto, actor);
  }

  /** Conflictos de hoy, con o sin excepción. */
  @Get('sod-findings')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Conflictos de segregación de funciones de hoy' })
  findings(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListSodFindingsResponseDto> {
    return this.sod.findings(actor);
  }

  /** Excepciones vigentes. */
  @Get('sod-exceptions')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @ApiOperation({ summary: 'Excepciones de segregación de funciones vigentes' })
  exceptions(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ListSodExceptionsResponseDto> {
    return this.sod.listExceptions(actor);
  }

  /** Pide una excepción: crea el cuatro ojos `SOD_EXCEPTION`. */
  @NotAudited(
    'El servicio sella SOD_EXCEPTION_REQUESTED (y FOUR_EYES_REQUESTED) en la misma transacción que crea la solicitud.',
  )
  @Post('sod-exceptions')
  @Roles('SECURITY_ADMIN', 'SUPPORT_STAFF')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Pedir una excepción de segregación de funciones (cuatro ojos)',
  })
  requestException(
    @Body() dto: RequestSodExceptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<FourEyesRequestedDto> {
    return this.sod.requestException(dto, actor);
  }

  /** Revoca una excepción vigente. */
  @NotAudited(
    'El servicio sella SOD_EXCEPTION_REVOKED en la misma transacción que revoca la excepción.',
  )
  @Post('sod-exceptions/:id/revoke')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revocar una excepción de segregación de funciones',
  })
  revokeException(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevokeSodExceptionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<SodExceptionViewDto> {
    return this.sod.revokeException(id, dto, actor);
  }
}
