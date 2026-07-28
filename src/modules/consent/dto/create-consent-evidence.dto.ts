import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Tipo de sujeto polimórfico al que refiere la evidencia. */
export type EvidenceSubjectType =
  'CONSENT' | 'HIPAA' | 'OBJECTION' | 'RESTRICTION' | 'TREATMENT';

/** Cuerpo de `POST /consent/consent-evidence` (UC-07-10). */
export class CreateConsentEvidenceDto {
  /**
   * Valor de subject type mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Tipo de sujeto de la evidencia',
    enum: ['CONSENT', 'HIPAA', 'OBJECTION', 'RESTRICTION', 'TREATMENT'],
  })
  @IsIn(['CONSENT', 'HIPAA', 'OBJECTION', 'RESTRICTION', 'TREATMENT'])
  subjectType!: EvidenceSubjectType;

  /**
   * Identificador asociado a subject.
   */
  @ApiProperty({
    description: 'Id de la fila a la que refiere la evidencia',
    format: 'uuid',
  })
  @IsUUID()
  subjectId!: string;

  /**
   * Identificador asociado a evidence type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de evidencia (concept id); por defecto firma',
  })
  @IsOptional()
  @IsUUID()
  evidenceTypeConceptId?: string;

  /**
   * Identificador asociado a document file.
   */
  @ApiPropertyOptional({
    description: 'Documento firmado (file id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  documentFileId?: string;

  /**
   * Identificador asociado a signature.
   */
  @ApiPropertyOptional({
    description: 'Firma clínica asociada (signature id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  signatureId?: string;

  /**
   * Identificador asociado a captured channel concept.
   */
  @ApiPropertyOptional({
    description: 'Canal de captura (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  capturedChannelConceptId?: string;

  /**
   * Valor de policy snapshot hash mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Hash del snapshot de política' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  policySnapshotHash?: string;

  /**
   * Valor de evidence hash mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Hash de la evidencia (integridad reproducible)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  evidenceHash?: string;
}
