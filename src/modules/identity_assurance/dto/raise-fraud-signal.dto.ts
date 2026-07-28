import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNumberString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases/{id}/fraud-signals` (UC-27-07). */
export class RaiseFraudSignalDto {
  /**
   * Identificador asociado a signal type concept.
   */
  @ApiProperty({
    description: 'Concepto: tipo de señal de fraude',
    format: 'uuid',
  })
  @IsUUID()
  signalTypeConceptId!: string;

  /**
   * Identificador asociado a severity concept.
   */
  @ApiProperty({
    description: 'Concepto: severidad de la señal',
    format: 'uuid',
  })
  @IsUUID()
  severityConceptId!: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Puntaje de confianza (0..1)',
    example: '0.75',
  })
  @IsOptional()
  @IsNumberString()
  confidenceScore?: string;

  /**
   * Identificador asociado a source concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: fuente de la señal',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  sourceConceptId?: string;

  /**
   * Valor de evidence reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia a la evidencia de la señal',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceReference?: string;
}
