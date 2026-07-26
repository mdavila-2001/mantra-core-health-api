import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsISO8601,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { ConsentProvisionInputDto } from './consent-provision.dto';

/** Cuerpo de `POST /consent/consents` (UC-07-01). */
export class CreateConsentDto {
  @ApiProperty({ description: 'Paciente titular de los datos (patient profile id)', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  @ApiProperty({ description: 'Propósito de procesamiento activo (processing_purpose id)', format: 'uuid' })
  @IsUUID()
  processingPurposeId!: string;

  @ApiPropertyOptional({ description: 'Base legal de procesamiento vigente', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  processingLegalBasisId?: string;

  @ApiPropertyOptional({ description: 'Categoría del consentimiento (concept id); por defecto privacidad' })
  @IsOptional()
  @IsUUID()
  categoryConceptId?: string;

  @ApiPropertyOptional({ description: 'Tenant propietario', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  @ApiPropertyOptional({ description: 'Usuario que otorga (si no es representante)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  grantedByUserId?: string;

  @ApiPropertyOptional({ description: 'Persona relacionada que otorga (representante legal)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  grantedByRelatedPersonId?: string;

  @ApiPropertyOptional({ description: 'URI de la política aceptada' })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  policyUri?: string;

  @ApiPropertyOptional({ description: 'Versión de la política aceptada' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  policyVersion?: string;

  @ApiPropertyOptional({ description: 'Inicio de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validFrom?: string;

  @ApiPropertyOptional({ description: 'Fin de vigencia (ISO-8601)' })
  @IsOptional()
  @IsISO8601()
  validTo?: string;

  @ApiPropertyOptional({ description: 'Provisiones granulares iniciales', type: [ConsentProvisionInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => ConsentProvisionInputDto)
  provisions?: ConsentProvisionInputDto[];
}
