import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /forms/definition-sets/{id}/migrations/{migrationId}/run` (UC-09-13). */
export class RunMigrationDto {
  /**
   * Identificador asociado a from version.
   */
  @ApiProperty({ description: 'Versión origen (publicada)', format: 'uuid' })
  @IsUUID()
  fromVersionId!: string;

  /**
   * Identificador asociado a to version.
   */
  @ApiProperty({ description: 'Versión destino (publicada)', format: 'uuid' })
  @IsUUID()
  toVersionId!: string;

  /**
   * Identificador asociado a migration type concept.
   */
  @ApiPropertyOptional({
    description: 'Tipo de migración (concept id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  migrationTypeConceptId?: string;

  /**
   * Valor de transformation expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Expresión de transformación' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  transformationExpression?: string;

  /**
   * Valor de validation expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Expresión de validación' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  validationExpression?: string;

  /**
   * Valor de rollback expression mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Expresión de rollback' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rollbackExpression?: string;
}
