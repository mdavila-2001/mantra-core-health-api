import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { AuthzPdpService } from '../services';
import {
  InvalidateCacheDto,
  EvaluateDecisionDto,
  CacheInvalidationResultDto,
  DecisionResponseDto,
} from '../dto';

/**
 * UC-06-11 (invalidar cache del PDP) y UC-06-12 (evaluar decisión efectiva).
 *
 * Nota de enrutado: la spec nombra `POST /authz/decisions:evaluate`. En Express 5
 * / path-to-regexp v8 el `:` inicia un parámetro nombrado, por lo que el endpoint
 * se expone en la ruta equivalente `POST /authz/decisions/evaluate`.
 */
@ApiTags('authz-pdp')
@ApiBearerAuth()
@Controller('authz')
export class AuthzPdpController {
  constructor(private readonly pdpService: AuthzPdpService) {}

  /** UC-06-11. */
  @Post('pdp/cache/invalidate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Invalidar la cache de decisiones del PDP' })
  invalidateCache(
    @Body() dto: InvalidateCacheDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): CacheInvalidationResultDto {
    return this.pdpService.invalidateCache(dto, actor);
  }

  /** UC-06-12 (`/authz/decisions:evaluate` según spec). */
  @Post('decisions/evaluate')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Recalcular la decisión de autorización efectiva (PDP)' })
  evaluate(
    @Body() dto: EvaluateDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<DecisionResponseDto> {
    return this.pdpService.evaluate(dto, actor);
  }
}
