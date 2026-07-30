import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases/{id}/evidence` (UC-27-03). */
export class SubmitEvidenceDto {
  /**
   * Identificador asociado a evidence type concept.
   */
  @ApiProperty({ description: 'Concepto: tipo de evidencia', format: 'uuid' })
  @IsUUID()
  evidenceTypeConceptId!: string;

  /**
   * Identificador asociado a issuer authority.
   */
  @ApiPropertyOptional({
    description: 'Autoridad emisora de la evidencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  issuerAuthorityId?: string;

  /**
   * Valor de evidence identifier hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description:
      'Hash del identificador de la evidencia (minimización de datos)',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceIdentifierHash?: string;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de evidencia (common.files)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

  /**
   * Valor de encrypted evidence reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia cifrada al payload (object storage)',
  })
  @IsOptional()
  @IsString()
  encryptedEvidenceReference?: string;

  /**
   * Identificador asociado a evidence quality concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: calidad de la evidencia',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceQualityConceptId?: string;

  /**
   * Identificador asociado a collected under consent.
   */
  @ApiPropertyOptional({
    description: 'Consentimiento bajo el que se recolectó',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  collectedUnderConsentId?: string;
}
