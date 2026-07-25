import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

/** Cuerpo de `POST /admin/ops/backup-policies` (UC-11-09). */
export class CreateBackupPolicyDto {
  @ApiProperty({ description: 'Tenant de la política', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  @ApiProperty({ description: 'Alcance del recurso (concept id)', format: 'uuid' })
  @IsUUID()
  resourceScopeConceptId!: string;

  @ApiProperty({ description: 'Tipo de backup (concept id)', format: 'uuid' })
  @IsUUID()
  backupTypeConceptId!: string;

  @ApiProperty({ description: 'RPO objetivo en segundos' })
  @IsInt()
  @Min(0)
  rpoSeconds!: number;

  @ApiProperty({ description: 'RTO objetivo en segundos' })
  @IsInt()
  @Min(0)
  rtoSeconds!: number;

  @ApiPropertyOptional({ description: 'Días de retención de copias' })
  @IsOptional()
  @IsInt()
  @Min(0)
  retentionDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  immutableCopyRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  encryptionRequired?: boolean;

  @ApiPropertyOptional({ description: 'Frecuencia de prueba de restauración (días)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  restoreTestFrequencyDays?: number;
}

/** Cuerpo de `POST /internal/ops/restore-test-runs` (UC-11-10). */
export class CreateRestoreTestRunDto {
  @ApiProperty({ description: 'Política de backup ACTIVE', format: 'uuid' })
  @IsUUID()
  backupPolicyId!: string;

  @ApiPropertyOptional({ description: 'Referencia del backup restaurado', maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  backupReference?: string;

  @ApiProperty({ description: 'Resultado (concept id)', format: 'uuid' })
  @IsUUID()
  outcomeConceptId!: string;

  @ApiPropertyOptional({ description: 'RPO medido en segundos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  measuredRpoSeconds?: number;

  @ApiPropertyOptional({ description: 'RTO medido en segundos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  measuredRtoSeconds?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  integrityCheckPassed?: boolean;

  @ApiPropertyOptional({ description: 'Archivo de evidencia (common.files.id)', format: 'uuid' })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

  @ApiPropertyOptional({ description: 'Inicio de la prueba (ISO)' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

/** Respuesta de la prueba de restauración (incluye señal de breach). */
export class RestoreTestRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  outcomeConceptId!: string;

  @ApiProperty({ description: 'true si el RPO/RTO medido supera el objetivo' })
  objectiveBreached!: boolean;
}
