import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsObject, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /telemetry/conversion-events` (UC-28-11). */
export class CreateConversionEventDto {
  /**
   * Identificador asociado a funnel definition.
   */
  @ApiProperty({ description: 'Funnel activo alcanzado', format: 'uuid' })
  @IsUUID()
  funnelDefinitionId!: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @ApiProperty({
    description: 'Sujeto de analítica que convierte',
    format: 'uuid',
  })
  @IsUUID()
  analyticsSubjectId!: string;

  /**
   * Identificador asociado a session journey.
   */
  @ApiPropertyOptional({
    description: 'Journey de sesión asociado',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sessionJourneyId?: string;

  /**
   * Identificador asociado a completion event.
   */
  @ApiPropertyOptional({
    description: 'Evento de actividad que completó el último paso',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  completionEventId?: string;

  /**
   * Valor de attribution json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Datos de atribución (JSON)' })
  @IsOptional()
  @IsObject()
  attributionJson?: Record<string, unknown>;
}

/** Respuesta de un evento de conversión. */
export class ConversionEventResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a funnel definition.
   */
  @ApiProperty({ format: 'uuid' })
  funnelDefinitionId!: string;

  /**
   * Identificador asociado a analytics subject.
   */
  @ApiProperty({ format: 'uuid' })
  analyticsSubjectId!: string;

  /**
   * Valor de converted at mantenido por la instancia.
   */
  @ApiProperty()
  convertedAt!: Date;
}
