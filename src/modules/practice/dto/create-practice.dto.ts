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
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({
    description: 'Tenant gestor (directory.tenants)',
    format: 'uuid',
  })
  @IsUUID()
  tenantId!: string;

  /**
   * Valor de code mantenido por la instancia.
   */
  @ApiProperty({ description: 'Código único de la práctica', maxLength: 100 })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code!: string;

  /**
   * Valor de name mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nombre de la práctica', maxLength: 200 })
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  /**
   * Identificador asociado a type concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de tipo de práctica',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  typeConceptId?: string;

  /**
   * Identificador asociado a admin user.
   */
  @ApiPropertyOptional({
    description: 'Usuario administrador (por defecto el actor)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  adminUserId?: string;

  /**
   * Identificador asociado a currency concept.
   */
  @ApiPropertyOptional({ description: 'Concepto de moneda', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  currencyConceptId?: string;

  /**
   * Valor de time zone mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Zona horaria IANA' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  timeZone?: string;
}
