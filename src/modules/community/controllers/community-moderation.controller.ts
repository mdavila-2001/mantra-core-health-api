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
import { CommunityModerationService } from '../services';
import {
  CreateReportDto,
  ModerationDecisionDto,
  CreateAppealDto,
  ReportResponseDto,
  ModerationDecisionResponseDto,
  IdResponseDto,
} from '../dto';

/** Endpoints de confianza y seguridad: reportes, decisiones y apelaciones. */
@ApiTags('community-moderation')
@ApiBearerAuth()
@Controller('community')
export class CommunityModerationController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Valor de service requerido por la operación.
   */
  constructor(private readonly service: CommunityModerationService) {}

  /** UC-19-08 (cualquier miembro puede reportar). */
  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reportar contenido y encolar moderación' })
  report(
    @Body() dto: CreateReportDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ReportResponseDto> {
    return this.service.report(dto, actor);
  }

  /** UC-19-09 (moderador / admin de confianza y seguridad). */
  @Post('moderation/queue/:queueId/decision')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Resolver moderación (decisión + strike)' })
  decide(
    @Param('queueId', ParseUUIDPipe) queueId: string,
    @Body() dto: ModerationDecisionDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<ModerationDecisionResponseDto> {
    return this.service.decide(queueId, dto, actor);
  }

  /** UC-19-10. */
  @Post('moderation/decisions/:decisionId/appeal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Apelar una decisión de moderación' })
  appeal(
    @Param('decisionId', ParseUUIDPipe) decisionId: string,
    @Body() dto: CreateAppealDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.appeal(decisionId, dto, actor);
  }
}
