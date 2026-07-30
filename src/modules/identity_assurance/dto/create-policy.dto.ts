import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /identity/verification-policies` (soporte de UC-27-02).
 * Una política vigente es precondición para abrir un caso de verificación.
 */
export class CreatePolicyDto {
  /**
   * Valor de policy code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único de la política', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  policyCode!: string;

  /**
   * Identificador asociado a subject type concept.
   */
  @ApiProperty({ description: 'Concepto: tipo de sujeto', format: 'uuid' })
  @IsUUID()
  subjectTypeConceptId!: string;

  /**
   * Identificador asociado a transaction risk concept.
   */
  @ApiProperty({
    description: 'Concepto: riesgo de la transacción',
    format: 'uuid',
  })
  @IsUUID()
  transactionRiskConceptId!: string;

  /**
   * Identificador asociado a required identity assurance level concept.
   */
  @ApiProperty({
    description: 'Concepto: IAL requerido (NIST 800-63)',
    format: 'uuid',
  })
  @IsUUID()
  requiredIdentityAssuranceLevelConceptId!: string;

  /**
   * Identificador asociado a required authenticator assurance level concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: AAL requerido',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requiredAuthenticatorAssuranceLevelConceptId?: string;

  /**
   * Identificador asociado a required federation assurance level concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: FAL requerido',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  requiredFederationAssuranceLevelConceptId?: string;

  /**
   * Valor de evidence requirements json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Requisitos de evidencia (JSON)' })
  @IsOptional()
  @IsObject()
  evidenceRequirementsJson?: Record<string, unknown>;

  /**
   * Valor de fraud controls json mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Controles de fraude / umbrales (JSON)' })
  @IsOptional()
  @IsObject()
  fraudControlsJson?: Record<string, unknown>;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Número de versión de la política',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;
}
