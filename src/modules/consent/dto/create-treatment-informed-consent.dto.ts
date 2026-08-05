import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Decisión del paciente sobre el tratamiento. */
export type TreatmentDecision = 'ACCEPTED' | 'DECLINED';

/** Cuerpo de `POST /consent/treatment-informed-consents` (UC-07-08). */
export class CreateTreatmentInformedConsentDto {
  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({
    description: 'Paciente titular (patient profile id)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Identificador asociado a encounter.
   */
  @ApiProperty({
    description: 'Encuentro clínico abierto (encounter id)',
    format: 'uuid',
  })
  @IsUUID()
  encounterId!: string;

  /**
   * Valor de decision mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Decisión del paciente',
    enum: ['ACCEPTED', 'DECLINED'],
  })
  @IsIn(['ACCEPTED', 'DECLINED'])
  decision!: TreatmentDecision;

  /**
   * Identificador asociado a procedure code concept.
   */
  @ApiPropertyOptional({
    description: 'Código de procedimiento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  procedureCodeConceptId?: string;

  /**
   * Valor de information version mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Versión del material informativo vigente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  informationVersion?: string;

  /**
   * Identificador asociado a interpreter user.
   */
  @ApiPropertyOptional({
    description: 'Intérprete presente (user id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  interpreterUserId?: string;

  /**
   * Identificador asociado a witness user.
   */
  @ApiPropertyOptional({ description: 'Testigo (user id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  witnessUserId?: string;

  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
