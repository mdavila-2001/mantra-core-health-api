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
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  Audited,
  CurrentUser,
  PreconditionFailedException,
  Roles,
  type AuthenticatedUser,
} from '../../../common';
import { CorrelationId } from '../../practice/http/request-decorators';
import { ClinicalErrorReason } from '../clinical.error-reasons';
import {
  AdjustCensusDto,
  CensusQueryDto,
  CloseCensusDto,
  IndicatorsQueryDto,
} from '../dto/adt.dto';
import { InpatientCensusService } from '../services/inpatient-census.service';
import { InpatientIndicatorsService } from '../services/inpatient-indicators.service';

/** `YYYY-MM-DD` válido (calendario real). */
function asDay(value: string): string {
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00Z`)
    : null;
  if (
    !parsed ||
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new PreconditionFailedException(
      'La fecha debe ser un día válido con formato YYYY-MM-DD',
      { value },
      ClinicalErrorReason.ADT_CODE_INVALID,
    );
  }
  return value;
}

/**
 * Censo diario inmutable e indicadores de cama (CONTRATO-F2-F5 F3.3).
 *
 * El cierre manual es excepcional: lo normal es el cierre programado
 * (`POST /internal/clinical/census-close-tick`). Un censo cerrado no se edita; se
 * corrige con un ajuste auditado.
 */
@ApiTags('clinical-census')
@ApiBearerAuth()
@Controller()
export class ClinicalCensusController {
  /**
   * @param census - Censo.
   * @param indicators - Indicadores.
   */
  constructor(
    private readonly census: InpatientCensusService,
    private readonly indicators: InpatientIndicatorsService,
  ) {}

  /** Día cerrado (snapshot + ajustes) o vista previa calculada. */
  @Get('sites/:siteId/census')
  @ApiOperation({
    summary: 'Censo diario: snapshot cerrado o vista previa del día abierto',
  })
  @ApiResponse({ status: 404, description: 'Sede de otro tenant' })
  get(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: CensusQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    asDay(query.date);
    return this.census.get(siteId, query, actor);
  }

  /** Cierre manual del día (idempotente por unidad). */
  @Audited({
    action: 'CENSUS_DAY_CLOSED',
    entity: 'practice_site',
    entityId: 'param:siteId',
  })
  @Post('sites/:siteId/census/:date/close')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cerrar el censo de un día' })
  @ApiResponse({ status: 409, description: 'CENSUS_ALREADY_CLOSED' })
  @ApiResponse({ status: 422, description: 'CENSUS_DATE_NOT_ENDED' })
  close(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Param('date') date: string,
    @Body() dto: CloseCensusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.census.close(siteId, asDay(date), dto, actor, requestId);
  }

  /** Ajuste auditado de un censo cerrado. */
  @Audited({
    action: 'CENSUS_DAY_ADJUSTED',
    entity: 'inpatient_census_day',
    entityId: 'param:id',
  })
  @Post('census-days/:id/adjustments')
  @ApiOperation({
    summary: 'Ajustar un número de un censo cerrado (el snapshot no cambia)',
  })
  adjust(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdjustCensusDto,
    @CurrentUser() actor: AuthenticatedUser,
    @CorrelationId() requestId: string | undefined,
  ) {
    return this.census.adjust(id, dto, actor, requestId);
  }

  /** Indicadores OPS del período. */
  @Get('sites/:siteId/inpatient-indicators')
  @ApiOperation({
    summary:
      'Ocupación, estancia, giro, intervalo de sustitución y rotación de cama',
  })
  @ApiResponse({ status: 422, description: 'INDICATOR_RANGE_TOO_LONG' })
  indicatorsOf(
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Query() query: IndicatorsQueryDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    asDay(query.from);
    asDay(query.to);
    return this.indicators.indicators(siteId, query, actor);
  }

  /** Cierre programado: lo dispara el worker. */
  @Audited({
    action: 'CENSUS_DAYS_CLOSED_BY_SYSTEM',
    entity: 'practice_site',
  })
  @Post('internal/clinical/census-close-tick')
  @Roles('SYSTEM', 'SYSTEM_WORKER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Cierra los días de censo vencidos de todas las sedes (idempotente)',
  })
  closeTick() {
    return this.census.closeDueDays();
  }
}
