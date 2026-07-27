import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /telemetry/conversion-events` (UC-28-11). */
export class CreateConversionEventDto {
  @ApiProperty({ description: 'Funnel activo alcanzado', format: 'uuid' })
  @IsUUID()
  funnelDefinitionId!: string;

  @ApiProperty({
    description: 'Sujeto de analítica que convierte',
    format: 'uuid',
  })
  @IsUUID()
  analyticsSubjectId!: string;

  @ApiPropertyOptional({
    description: 'Journey de sesión asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  @ApiPropertyOptional({
    description: 'Evento de actividad que completó el último paso',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  completionEventId?: string;

  @ApiPropertyOptional({ description: 'Datos de atribución (JSON)' })
  @IsOptional()
  @IsObject()
  attributionJson?: Record<string, unknown>;
}

/** Respuesta de un evento de conversión. */
export class ConversionEventResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  funnelDefinitionId!: string;

  @ApiProperty({ format: 'uuid' })
  analyticsSubjectId!: string;

  @ApiProperty()
  convertedAt!: Date;
}
