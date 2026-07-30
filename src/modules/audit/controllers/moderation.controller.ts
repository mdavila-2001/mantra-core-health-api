import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import { ModerationService } from '../services';
import {
  CreateModerationDecisionDto,
  ModerationDecisionResultDto,
} from '../dto';

/** Endpoint de moderación / gobernanza sobre `/moderation/*` (UC-10-11). */
@ApiTags('audit-moderation')
@ApiBearerAuth()
@Controller('moderation')
export class ModerationController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param moderationService - Valor de moderation service requerido por la operación.
   */
  constructor(private readonly moderationService: ModerationService) {}

  /** UC-10-11. */
  @Post('decisions')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar decisión de moderación / gobernanza analítica',
  })
  recordDecision(
    @Body() dto: CreateModerationDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ModerationDecisionResultDto> {
    return this.moderationService.recordDecision(dto, actor);
  }
}
