import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /profiles/patients/{profileId}/identity-links` (UC-05-07). */
export class AddIdentityLinkDto {
  /**
   * Identificador asociado a source tenant.
   */
  @ApiProperty({
    description: 'Tenant origen de la identidad externa',
    format: 'uuid',
  })
  @IsUUID()
  sourceTenantId!: string;

  /**
   * Valor de source patient identifier mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Identificador del paciente en el sistema origen',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  sourcePatientIdentifier!: string;

  /**
   * Valor de source system uri mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'URI del sistema origen' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  sourceSystemUri?: string;

  /**
   * Identificador asociado a link type concept.
   */
  @ApiPropertyOptional({
    description: 'Concept id del tipo de vínculo',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  linkTypeConceptId?: string;

  /**
   * Valor de confidence score mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Puntuación de confianza [0..1]',
    minimum: 0,
    maximum: 1,
  })
  @IsNumber()
  @Min(0)
  @Max(1)
  confidenceScore!: number;

  /**
   * Valor de verified mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Marca el vínculo como verificado' })
  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

/** Respuesta de vínculo de identidad. */
export class IdentityLinkResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a patient profile.
   */
  @ApiProperty({ format: 'uuid' })
  patientProfileId!: string;

  /**
   * Valor de verification status mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Concept id del estado de verificación',
    format: 'uuid',
  })
  verificationStatus!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({
    description: 'true si el registro se creó, false si se actualizó (upsert)',
  })
  created!: boolean;
}
