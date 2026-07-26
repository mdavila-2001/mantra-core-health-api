import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /identity/verification-cases/{id}/evidence` (UC-27-03). */
export class SubmitEvidenceDto {
  @ApiProperty({ description: 'Concepto: tipo de evidencia', format: 'uuid' })
  @IsUUID()
  evidenceTypeConceptId!: string;

  @ApiPropertyOptional({ description: 'Autoridad emisora de la evidencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  issuerAuthorityId?: string;

  @ApiPropertyOptional({ description: 'Hash del identificador de la evidencia (minimización de datos)', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceIdentifierHash?: string;

  @ApiPropertyOptional({ description: 'Archivo de evidencia (common.files)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

  @ApiPropertyOptional({ description: 'Referencia cifrada al payload (object storage)' })
  @IsOptional()
  @IsString()
  encryptedEvidenceReference?: string;

  @ApiPropertyOptional({ description: 'Concepto: calidad de la evidencia', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceQualityConceptId?: string;

  @ApiPropertyOptional({ description: 'Consentimiento bajo el que se recolectó', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  collectedUnderConsentId?: string;
}
