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
  @ApiProperty({ description: 'Código único de la política', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  policyCode!: string;

  @ApiProperty({ description: 'Concepto: tipo de sujeto', format: 'uuid' })
  @IsUUID()
  subjectTypeConceptId!: string;

  @ApiProperty({ description: 'Concepto: riesgo de la transacción', format: 'uuid' })
  @IsUUID()
  transactionRiskConceptId!: string;

  @ApiProperty({ description: 'Concepto: IAL requerido (NIST 800-63)', format: 'uuid' })
  @IsUUID()
  requiredIdentityAssuranceLevelConceptId!: string;

  @ApiPropertyOptional({ description: 'Concepto: AAL requerido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredAuthenticatorAssuranceLevelConceptId?: string;

  @ApiPropertyOptional({ description: 'Concepto: FAL requerido', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  requiredFederationAssuranceLevelConceptId?: string;

  @ApiPropertyOptional({ description: 'Requisitos de evidencia (JSON)' })
  @IsOptional()
  @IsObject()
  evidenceRequirementsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Controles de fraude / umbrales (JSON)' })
  @IsOptional()
  @IsObject()
  fraudControlsJson?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Número de versión de la política', default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  versionNumber?: number;
}
