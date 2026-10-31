import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Ip,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  Audited,
  CurrentUser,
  TenantAgnostic,
  type AuthenticatedUser,
} from '../../../../common';
import { IamStepUpService } from '../../application/services';
import {
  StepUpDto,
  StepUpResultDto,
  StepUpStatusDto,
  StepUpStatusQueryDto,
} from '../dto';

/**
 * Paso extra de la propia sesión (verificación en dos pasos fresca). Sin
 * `@Roles`: cualquier sesión autenticada opera sobre lo suyo, el servicio actúa
 * sobre el `id` y el `sid` del token. `@TenantAgnostic` porque no toca datos de
 * ningún tenant. Los clientes lo llaman cuando una acción responde 403
 * `STEP_UP_REQUIRED` y reintentan la misma petición.
 */
@ApiTags('iam-auth')
@ApiBearerAuth()
@TenantAgnostic()
@Controller('iam')
export class IamStepUpController {
  /**
   * @param service - Paso extra de la propia sesión.
   */
  constructor(private readonly service: IamStepUpService) {}

  /** Verifica el código de la app autenticadora y sella la sesión. */
  @Audited({ action: 'SUPPORT_STEP_UP_VERIFIED', entity: 'session' })
  @Post('me/step-up')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirmar mi identidad con el código de mi app autenticadora',
    description:
      'Sella la sesión en curso con un paso extra de vigencia limitada. ' +
      'Errores: 422 `MFA_NOT_ENROLLED` (sin factor confirmado), 422 ' +
      '`MFA_CODE_INVALID`, 429 (límite de tasa o demasiados códigos ' +
      'incorrectos) y 503 `STEP_UP_UNAVAILABLE` (no se pudo guardar el sello).',
  })
  verify(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: StepUpDto,
    @Ip() ip: string,
  ): Promise<StepUpResultDto> {
    return this.service.verify(actor, dto, ip);
  }

  /** Estado del paso extra de la sesión en curso. */
  @Get('me/step-up')
  @ApiOperation({
    summary: 'Ver si mi sesión tiene un paso extra vigente',
    description:
      '`fresh` es verdadero si hay un sello de `maxAgeMinutes` (1-60, por ' +
      'defecto 10) o menos. 503 `STEP_UP_UNAVAILABLE` si no se puede comprobar.',
  })
  status(
    @CurrentUser() actor: AuthenticatedUser,
    @Query() query: StepUpStatusQueryDto,
  ): Promise<StepUpStatusDto> {
    return this.service.status(actor, query.maxAgeMinutes);
  }
}
