import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Decisión del paciente sobre el tratamiento. */
export type TreatmentDecision = 'ACCEPTED' | 'DECLINED';

/** Cuerpo de `POST /consent/treatment-informed-consents` (UC-07-08). */
export class CreateTreatmentInformedConsentDto {
  @ApiProperty({
    description: 'Paciente titular (patient profile id)',
    format: 'uuid',
  })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({
    description: 'Encuentro clínico abierto (encounter id)',
    format: 'uuid',
  })
  @IsUUID()
  encounterId!: string;

  @ApiProperty({
    description: 'Decisión del paciente',
    enum: ['ACCEPTED', 'DECLINED'],
  })
  @IsIn(['ACCEPTED', 'DECLINED'])
  decision!: TreatmentDecision;

  @ApiPropertyOptional({
    description: 'Código de procedimiento (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  procedureCodeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Versión del material informativo vigente',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  informationVersion?: string;

  @ApiPropertyOptional({
    description: 'Intérprete presente (user id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  interpreterUserId?: string;

  @ApiPropertyOptional({ description: 'Testigo (user id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  witnessUserId?: string;

  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
