import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Cuerpo de `POST /practices` (bootstrap de la organización raíz). No es un UC
 * numerado del módulo, pero la práctica es el agregado raíz que todos los demás
 * casos de uso presuponen; se expone para poder crearla y encadenar recursos.
 */
export class CreatePracticeDto {
  @ApiProperty({
    description: 'Tenant gestor (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Código único de la práctica', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  @ApiProperty({ description: 'Nombre de la práctica', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({
    description: 'Concepto de tipo de práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  @ApiPropertyOptional({
    description: 'Usuario administrador (por defecto el actor)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  adminUserId?: string;

  @ApiPropertyOptional({ description: 'Concepto de moneda', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  @ApiPropertyOptional({ description: 'Zona horaria IANA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}
