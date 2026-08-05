import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

/** Cuerpo de `POST /identity/assertions/{id}/revoke` (UC-27-11). */
export class RevokeAssertionDto {
  /**
   * Identificador asociado a revocation reason concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: motivo de revocación (por defecto fraude)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  revocationReasonConceptId?: string;

  /**
   * Identificador asociado a fraud signal type concept.
   */
  @ApiPropertyOptional({
    description:
      'Concepto: tipo de señal de fraude a derivar (si la revocación es por fraude)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fraudSignalTypeConceptId?: string;

  /**
   * Identificador asociado a fraud severity concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: severidad de la señal derivada',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  fraudSeverityConceptId?: string;

  /**
   * Valor de raise fraud signal mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: '¿Derivar una señal de fraude a partir de la revocación?',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  raiseFraudSignal?: boolean;
}
