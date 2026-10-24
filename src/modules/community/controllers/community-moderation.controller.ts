import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CommunityModerationService,
  CommunityModerationReadService,
} from '../services';
import {
  CreateReportDto,
  ModerationDecisionDto,
  CreateAppealDto,
  ResolveAppealDto,
  ReportResponseDto,
  ModerationDecisionResponseDto,
  IdResponseDto,
  ModerationQueueQueryDto,
  ModerationQueuePageDto,
  ModerationDecisionsQueryDto,
  ModerationDecisionPageDto,
  ModerationAppealsQueryDto,
  ModerationAppealPageDto,
  MyModerationDecisionsQueryDto,
  MyModerationDecisionPageDto,
} from '../dto';

/** Tope por defecto de filas por página, igual que en el resto de la API. */
const DEFAULT_PAGE_LIMIT = 50;

/** Endpoints de confianza y seguridad: reportes, decisiones y apelaciones. */
@ApiTags('community-moderation')
@ApiBearerAuth()
@Controller('community')
export class CommunityModerationController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param service - Escrituras de confianza y seguridad.
   * @param readService - Lecturas de la cola de trabajo.
   */
  constructor(
    private readonly service: CommunityModerationService,
    private readonly readService: CommunityModerationReadService,
  ) {}

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

  /** UC-19-10, cierre: resuelve una apelación abierta. */
  @Post('moderation/appeals/:appealId/resolve')
  @Roles('SECURITY_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolver una apelación de moderación' })
  resolveAppeal(
    @Param('appealId', ParseUUIDPipe) appealId: string,
    @Body() dto: ResolveAppealDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<IdResponseDto> {
    return this.service.resolveAppeal(appealId, dto, actor);
  }

  // --- Lecturas de la cola de trabajo (UC-19-09/10, cara de lectura) ---
  //
  // Las tres exigen `SECURITY_ADMIN`: exponen contenido reportado, el texto que
  // escribió quien reportó y quién decidió qué. Un paciente o un profesional
  // común no las abre — y el guard lo comprueba en el servidor, no el menú.

  /** Cola de moderación con filtros de trabajo. */
  @Get('moderation/queue')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Cola de moderación con filtros y cursor' })
  listQueue(
    @Query() query: ModerationQueueQueryDto,
  ): Promise<ModerationQueuePageDto> {
    return this.readService.listQueue(query, query.limit ?? DEFAULT_PAGE_LIMIT);
  }

  /**
   * UC-19-10 (AG-18) · «Mis sanciones»: el autor lee sus propias decisiones.
   *
   * Sin `@Roles`, a propósito: es la lectura que le falta a cualquier cuenta
   * para poder apelar — sin ella, el autor sancionado nunca conoce el
   * `decisionId` que `POST .../appeal` le exige. Declarada **antes** que
   * `moderation/decisions` (la de `SECURITY_ADMIN`) para que un futuro
   * `GET moderation/decisions/:id` no la capture primero.
   */
  @Get('moderation/decisions/mine')
  @ApiOperation({ summary: 'Mis propias decisiones de moderación' })
  listMyDecisions(
    @Query() query: MyModerationDecisionsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<MyModerationDecisionPageDto> {
    return this.readService.listMyDecisions(
      query.profileId,
      query,
      query.limit ?? DEFAULT_PAGE_LIMIT,
      actor,
    );
  }

  /** Decisiones tomadas, de la más reciente hacia atrás. */
  @Get('moderation/decisions')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Decisiones de moderación tomadas' })
  listDecisions(
    @Query() query: ModerationDecisionsQueryDto,
  ): Promise<ModerationDecisionPageDto> {
    return this.readService.listDecisions(
      query,
      query.limit ?? DEFAULT_PAGE_LIMIT,
    );
  }

  /** Apelaciones, con la decisión que cada una impugna. */
  @Get('moderation/appeals')
  @Roles('SECURITY_ADMIN')
  @ApiOperation({ summary: 'Apelaciones presentadas, con su decisión' })
  listAppeals(
    @Query() query: ModerationAppealsQueryDto,
  ): Promise<ModerationAppealPageDto> {
    return this.readService.listAppeals(
      query,
      query.limit ?? DEFAULT_PAGE_LIMIT,
    );
  }
}
