import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /integration/contracts` (UC-31-01). */
export class CreateContractDto {
  /**
   * Identificador asociado a external provider.
   */
  @ApiProperty({
    description: 'Proveedor externo dueño del contrato',
    format: 'uuid',
  })
  @IsUUID()
  externalProviderId!: string;

  /**
   * Valor de contract code mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Código único del contrato por proveedor/tenant',
    maxLength: 100,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  contractCode!: string;

  /**
   * Identificador asociado a capability concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de capacidad del contrato',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  capabilityConceptId?: string;

  /**
   * Identificador asociado a data classification concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de clasificación de datos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataClassificationConceptId?: string;

  /**
   * Identificador asociado a legal basis concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de base legal de tratamiento',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  legalBasisConceptId?: string;

  /**
   * Identificador asociado a allowed purpose value set.
   */
  @ApiPropertyOptional({
    description: 'Value set de propósitos permitidos',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  allowedPurposeValueSetId?: string;

  /**
   * Identificador asociado a data use agreement.
   */
  @ApiPropertyOptional({
    description: 'Acuerdo de uso de datos (DUA)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  dataUseAgreementId?: string;
}
