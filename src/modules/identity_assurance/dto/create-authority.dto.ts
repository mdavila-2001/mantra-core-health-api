import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/** Cuerpo de `POST /identity/authorities` (UC-27-01). */
export class RegisterAuthorityDto {
  @ApiProperty({ description: 'Tenant propietario de la autoridad', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Código único de la autoridad', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  authorityCode!: string;

  @ApiProperty({ description: 'Nombre legible de la autoridad', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'Concepto: tipo de autoridad', format: 'uuid' })
  @IsUUID()
  authorityTypeConceptId!: string;

  @ApiPropertyOptional({ description: 'Concepto: jurisdicción', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  jurisdictionConceptId?: string;

  @ApiPropertyOptional({ description: 'Concepto: marco de aseguramiento (NIST/eIDAS)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  assuranceFrameworkConceptId?: string;
}
