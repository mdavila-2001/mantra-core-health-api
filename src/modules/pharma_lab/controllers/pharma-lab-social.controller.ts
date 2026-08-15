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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, Roles, type AuthenticatedUser } from '../../../common';
import {
  CreateCostAllocationDto,
  CreatedResourceDto,
  DecideVisitorPostDto,
  SubmitVisitorPostDto,
  TransitionResultDto,
} from '../dto';
import type { VisitorPostSubmissions } from '../entities';
import {
  PharmaAnalyticsService,
  PharmaSocialService,
  type AllocationReport,
} from '../services';

/**
 * Publicaciones de visitador sujetas a aprobación (UC-17-35, UC-17-36) y
 * contabilidad analítica del laboratorio (UC-17-34).
 *
 * Van juntas en un controlador porque son las dos superficies pequeñas que
 * quedan del carril; separarlas daría dos clases de tres rutas cada una sin
 * ganar nada.
 */
@ApiTags('pharma-lab-social-accounting')
@ApiBearerAuth()
@Controller('pharma-labs')
export class PharmaLabSocialController {
  /**
   * Inicializa la instancia y sus dependencias.
   *
   * @param social - Casos de uso de publicaciones de visitador.
   * @param analytics - Casos de uso de contabilidad analítica.
   */
  constructor(
    private readonly social: PharmaSocialService,
    private readonly analytics: PharmaAnalyticsService,
  ) {}

  /** UC-17-35. */
  @Post('visitor-posts')
  @HttpCode(HttpStatus.CREATED)
  @Roles('MEDICAL_VISITOR')
  @ApiOperation({ summary: 'Proponer una publicación como visitador' })
  submitPost(
    @Body() dto: SubmitVisitorPostDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.social.submit(dto, actor);
  }

  /** Propuestas pendientes y resueltas del laboratorio. */
  @Get(':pharmaLabId/visitor-posts')
  @Roles('PHARMA_LAB_ADMIN', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Listar las publicaciones propuestas' })
  listPosts(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
  ): Promise<VisitorPostSubmissions[]> {
    return this.social.listSubmissions(pharmaLabId);
  }

  /** UC-17-36. */
  @Post(':pharmaLabId/visitor-posts/:submissionId/decision')
  @Roles('PHARMA_LAB_ADMIN', 'BUSINESS_ADMIN', 'PLATFORM_ADMIN')
  @ApiOperation({ summary: 'Aprobar o rechazar la publicación propuesta' })
  decidePost(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Param('submissionId', ParseUUIDPipe) submissionId: string,
    @Body() dto: DecideVisitorPostDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<TransitionResultDto> {
    return this.social.decide(pharmaLabId, submissionId, dto, actor);
  }

  /** UC-17-34. */
  @Post(':pharmaLabId/cost-allocations')
  @HttpCode(HttpStatus.CREATED)
  @Roles('PHARMA_LAB_ADMIN', 'ACCOUNTANT', 'FINANCE', 'PLATFORM_ADMIN')
  @ApiOperation({
    summary: 'Imputar un asiento contable a las dimensiones del laboratorio',
  })
  allocate(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Body() dto: CreateCostAllocationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ): Promise<CreatedResourceDto> {
    return this.analytics.createAllocation(pharmaLabId, dto, actor);
  }

  /** Reporte analítico del periodo. */
  @Get(':pharmaLabId/cost-allocations/report')
  @Roles('PHARMA_LAB_ADMIN', 'ACCOUNTANT', 'FINANCE', 'PLATFORM_ADMIN')
  @ApiQuery({ name: 'from', type: String, example: '2026-01-01' })
  @ApiQuery({ name: 'to', type: String, example: '2026-12-31' })
  @ApiOperation({
    summary: 'Rentabilidad por producto y costos por proyecto del periodo',
  })
  report(
    @Param('pharmaLabId', ParseUUIDPipe) pharmaLabId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ): Promise<AllocationReport> {
    return this.analytics.getReport(pharmaLabId, from, to);
  }
}
