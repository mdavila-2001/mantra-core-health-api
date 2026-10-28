import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import {
  IsISO8601,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  INFORMED_CONSENT_TARGET_TYPES,
  type InformedConsentTargetType,
} from '../informed-consent.enums';
import { CreateConsentEvidenceDto } from './create-consent-evidence.dto';

/** Query de `GET /consent/treatment-informed-consents` (v4263). */
export class ListTreatmentInformedConsentsQueryDto {
  /**
   * Paciente titular: obligatorio, la autorización se decide sobre su historia.
   */
  @ApiProperty({ description: 'Paciente titular', format: 'uuid' })
  @IsUUID()
  patientProfileId!: string;

  /**
   * Filtra por tipo de objeto consentido.
   */
  @ApiPropertyOptional({ enum: INFORMED_CONSENT_TARGET_TYPES })
  @IsOptional()
  @IsIn(INFORMED_CONSENT_TARGET_TYPES)
  targetType?: InformedConsentTargetType;

  /**
   * Filtra por el objeto consentido.
   */
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  targetId?: string;
}

/** Cuerpo de `PATCH /consent/treatment-informed-consents/{id}/withdraw` (v4263). */
export class WithdrawTreatmentInformedConsentDto {
  /**
   * Motivo de la revocación, tal como lo expresa el paciente o su representante.
   */
  @ApiProperty({ description: 'Motivo de la revocación', maxLength: 4000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  reason!: string;
}

/**
 * Cuerpo de `PATCH /consent/treatment-informed-consents/{id}/post-emergency-information`
 * (enmienda 1): cierra el caso de excepción `EMERGENCY` dejando constancia de
 * cuándo se informó al paciente a posteriori.
 */
export class PostEmergencyInformationDto {
  /**
   * Cuándo se informó al paciente (o a su representante).
   */
  @ApiProperty({ type: String, format: 'date-time' })
  @IsISO8601()
  informedAt!: string;
}

/**
 * Cuerpo de `POST /consent/treatment-informed-consents/{id}/evidence`: la
 * evidencia de `POST /consent/evidence` sin el sujeto, que sale de la ruta.
 */
export class RecordTreatmentConsentEvidenceDto extends OmitType(
  CreateConsentEvidenceDto,
  ['subjectType', 'subjectId'] as const,
) {}
