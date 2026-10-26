import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiPropertyOptional,
  ApiTags,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { NotAudited, Public, Roles, TenantAgnostic } from '../../../common';
import { ANALYTICS_READ_ROLES } from './telemetry-analytics.controller';
import {
  TelemetryOnboardingAnalyticsService,
  type OnboardingEventPayload,
} from '../services/telemetry-onboarding-analytics.service';

const ONBOARDING_EVENT_TYPES = [
  'start',
  'step_view',
  'field_interaction',
  'field_error',
  'abandon',
  'complete',
];
const ONBOARDING_INTERACTION_TYPES = ['focus', 'blur', 'change', 'error'];

/**
 * Un evento del embudo de alta, como lo manda el front
 * (`OnboardingTelemetryEvent`). Lleva decoradores porque el `ValidationPipe`
 * global corre con `forbidNonWhitelisted`: sin ellos, `events` era una
 * propiedad «ajena» y TODO lote se rechazaba con 400.
 */
export class OnboardingEventDto implements OnboardingEventPayload {
  @ApiProperty({ enum: ONBOARDING_EVENT_TYPES })
  @IsIn(ONBOARDING_EVENT_TYPES)
  readonly eventType!: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(40)
  readonly formType!: string;

  @ApiProperty({ type: String })
  @IsString()
  @MaxLength(100)
  readonly draftId!: string;

  @ApiProperty({ type: Number })
  @IsInt()
  @Min(0)
  @Max(100)
  readonly stepIndex!: number;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly stepKey?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly fieldKey?: string;

  @ApiPropertyOptional({ enum: ONBOARDING_INTERACTION_TYPES })
  @IsOptional()
  @IsIn(ONBOARDING_INTERACTION_TYPES)
  readonly interactionType?: string;

  @ApiPropertyOptional({ type: String })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  readonly errorCategory?: string;

  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  readonly durationMs?: number;

  @ApiProperty({ type: String })
  @IsISO8601()
  readonly timestamp!: string;
}

export class IngestOnboardingEventsDto {
  @ApiProperty({ type: () => [OnboardingEventDto] })
  @IsArray()
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => OnboardingEventDto)
  readonly events!: OnboardingEventDto[];
}

@ApiTags('telemetry-onboarding-analytics')
@Controller()
export class TelemetryOnboardingAnalyticsController {
  constructor(private readonly service: TelemetryOnboardingAnalyticsService) {}

  @NotAudited(
    'Pública y sin actor (audit_log.user_id es NOT NULL); los eventos del embudo de alta se acumulan sólo en la memoria del proceso, sin fila en Postgres.',
  )
  @Post('telemetry/onboarding-events')
  @Public()
  @TenantAgnostic()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Captura eventos de telemetría de alta y avance en formularios de registro',
  })
  recordEvents(@Body() dto: IngestOnboardingEventsDto): { ok: boolean } {
    return this.service.recordEvents(dto.events ?? []);
  }

  @Get('admin/analytics/onboarding/funnel')
  @ApiBearerAuth()
  @Roles(...ANALYTICS_READ_ROLES)
  @ApiOperation({
    summary:
      'Reporte de embudo y deserción paso a paso para formularios de alta',
  })
  getFunnelReport(
    @Query('formType') formType = 'patient',
    @Query('range') range = '7d',
  ) {
    return this.service.getFunnelReport(formType, range);
  }

  @Get('admin/analytics/onboarding/heatmap')
  @ApiBearerAuth()
  @Roles(...ANALYTICS_READ_ROLES)
  @ApiOperation({
    summary:
      'Mapa de calor por campo y nivel de fricción para formularios de alta',
  })
  getHeatmapReport(
    @Query('formType') formType = 'patient',
    @Query('metric')
    metric: 'interactions' | 'errors' | 'abandonment' = 'errors',
    @Query('range') range = '7d',
  ) {
    return this.service.getHeatmapReport(formType, metric, range);
  }
}
