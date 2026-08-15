import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * Alta de un reporte de farmacovigilancia (UC-17-29).
 *
 * No admite identificadores de paciente y no los admitirá: la spec exige
 * proteger su identidad (5593). Lo que se acepta es el seudónimo del caso y los
 * datos epidemiológicos agregados que una autoridad necesita.
 */
export class CreatePharmacovigilanceReportDto {
  /**
   * Producto involucrado.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  pharmaProductId!: string;

  /**
   * Lote.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(64)
  batchNumber?: string;

  /**
   * Fecha del evento.
   */
  @ApiProperty({ type: String, format: 'date' })
  @IsDateString()
  eventDate!: string;

  /**
   * Tipo de evento.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  eventTypeConceptId!: string;

  /**
   * Descripción, sin datos identificables del paciente.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  description!: string;

  /**
   * Nivel de gravedad.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  severityConceptId!: string;

  /**
   * Tipo de reportante.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  reporterTypeConceptId!: string;

  /**
   * Organización del reportante.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  reporterTenantId?: string;

  /**
   * Seudónimo del caso.
   */
  @ApiPropertyOptional({ description: 'Seudónimo, nunca un id de paciente' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  subjectPseudonym?: string;

  /**
   * Edad del sujeto, en años.
   */
  @ApiPropertyOptional({ minimum: 0, maximum: 130 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(130)
  subjectAgeYears?: number;

  /**
   * Sexo del sujeto.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  subjectSexConceptId?: string;
}

/** Acción de seguimiento sobre un reporte (UC-17-30). */
export class AddPharmacovigilanceActionDto {
  /**
   * Naturaleza de la acción.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  actionConceptId!: string;

  /**
   * Estado en que queda el reporte tras la acción.
   */
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  newStatusConceptId!: string;

  /**
   * Detalle de la acción.
   */
  @ApiProperty()
  @IsString()
  @MaxLength(4000)
  detail!: string;

  /**
   * Autoridad destinataria, si la acción es una comunicación.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  authorityName?: string;

  /**
   * Referencia de la comunicación.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(128)
  authorityReference?: string;
}
