import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /identity/authorities` (UC-27-01). */
export class RegisterAuthorityDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiPropertyOptional({
    description:
      'Obsoleto: el tenant se deriva de la sesión (X-Tenant-Id). Si llega, debe coincidir con él; el servidor nunca lo toma como fuente de verdad.',
    format: 'uuid',
    deprecated: true,
  })
  @IsOptional()
  @IsUUID()
  tenantId?: string;

  /**
   * Valor de authority code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único de la autoridad', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  authorityCode!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Nombre legible de la autoridad',
    maxLength: 200,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a authority type concept.
   */
  @ApiProperty({ description: 'Concepto: tipo de autoridad', format: 'uuid' })
  @IsUUID()
  authorityTypeConceptId!: string;

  /**
   * Identificador asociado a jurisdiction concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: jurisdicción',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  /**
   * Identificador asociado a assurance framework concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto: marco de aseguramiento (NIST/eIDAS)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  assuranceFrameworkConceptId?: string;
}
