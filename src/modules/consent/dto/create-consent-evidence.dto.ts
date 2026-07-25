import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Tipo de sujeto polimórfico al que refiere la evidencia. */
export type EvidenceSubjectType = 'CONSENT' | 'HIPAA' | 'OBJECTION' | 'RESTRICTION' | 'TREATMENT';

/** Cuerpo de `POST /consent/consent-evidence` (UC-07-10). */
export class CreateConsentEvidenceDto {
  @ApiProperty({
    description: 'Tipo de sujeto de la evidencia',
    enum: ['CONSENT', 'HIPAA', 'OBJECTION', 'RESTRICTION', 'TREATMENT'],
  })
  @IsIn(['CONSENT', 'HIPAA', 'OBJECTION', 'RESTRICTION', 'TREATMENT'])
  subjectType!: EvidenceSubjectType;

  @ApiProperty({ description: 'Id de la fila a la que refiere la evidencia', format: 'uuid' })
  @IsUUID()
  subjectId!: string;

  @ApiPropertyOptional({ description: 'Tipo de evidencia (concept id); por defecto firma' })
  @IsOptional()
  @IsUUID()
  evidenceTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Documento firmado (file id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  documentFileId?: string;

  @ApiPropertyOptional({ description: 'Firma clínica asociada (signature id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  signatureId?: string;

  @ApiPropertyOptional({ description: 'Canal de captura (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  capturedChannelConceptId?: string;

  @ApiPropertyOptional({ description: 'Hash del snapshot de política' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  policySnapshotHash?: string;

  @ApiPropertyOptional({ description: 'Hash de la evidencia (integridad reproducible)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceHash?: string;
}
