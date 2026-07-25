import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Cuerpo de `POST /forms/definition-sets/{id}/migrations/{migrationId}/run` (UC-09-13). */
export class RunMigrationDto {
  @ApiProperty({ description: 'Versión origen (publicada)', format: 'uuid' })
  @IsUUID()
  fromVersionId!: string;

  @ApiProperty({ description: 'Versión destino (publicada)', format: 'uuid' })
  @IsUUID()
  toVersionId!: string;

  @ApiPropertyOptional({ description: 'Tipo de migración (concept id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  migrationTypeConceptId?: string;

  @ApiPropertyOptional({ description: 'Expresión de transformación' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  transformationExpression?: string;

  @ApiPropertyOptional({ description: 'Expresión de validación' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  validationExpression?: string;

  @ApiPropertyOptional({ description: 'Expresión de rollback' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  rollbackExpression?: string;
}
