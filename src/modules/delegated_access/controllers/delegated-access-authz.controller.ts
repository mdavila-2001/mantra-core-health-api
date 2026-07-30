import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { DelegatedAccessEvaluationService } from '../services';
import {
  EvaluateActorDto,
  EvaluationResultDto,
  ExpirySweepResultDto,
} from '../dto';

/**
 * Operaciones de authz/sistema del módulo: barrido de expiración (UC-29-08) y
 * evaluación del actor efectivo por propósito (UC-29-09).
 */
@ApiTags('delegated-access-authz')
@ApiBearerAuth()
@Controller()
export class DelegatedAccessAuthzController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: DelegatedAccessEvaluationService) {}

  /** UC-29-08: disparador del worker de expiración (barrido de vencidos). */
  @Post('delegated-access/expiry-sweep')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Expirar delegaciones y grants vencidos (barrido)' })
  expirySweep(
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ExpirySweepResultDto> {
    return this.service.expirySweep(actor);
  }

  /** UC-29-09: evaluación en línea del actor efectivo. */
  @Post('authz/effective-actor/evaluate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Evaluar actor efectivo por propósito (step-up)' })
  evaluate(
    @Body() dto: EvaluateActorDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<EvaluationResultDto> {
    return this.service.evaluate(dto, actor);
  }
}
