import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  Max,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_OBJETIVO_SEGUNDOS, RANGO_OBJETIVOS } from '../policies';

/** Resultado de comparar una restauración contra los objetivos de RPO/RTO. */
export type RestoreObjectiveStatus = 'MET' | 'BREACHED' | 'NOT_MEASURED';

/** Cuerpo de `POST /admin/ops/backup-policies` (UC-11-09). */
export class CreateBackupPolicyDto {
  /**
   * Identificador asociado a tenant.
   */
  @ApiProperty({ description: 'Tenant de la política', format: 'uuid' })
  @IsUUID()
  tenantId!: string;

  /**
   * Identificador asociado a resource scope concept.
   */
  @ApiProperty({
    description: 'Alcance del recurso (concept id)',
    format: 'uuid',
  })
  @IsUUID()
  resourceScopeConceptId!: string;

  /**
   * Identificador asociado a backup type concept.
   */
  @ApiProperty({ description: 'Tipo de backup (concept id)', format: 'uuid' })
  @IsUUID()
  backupTypeConceptId!: string;

  /**
   * Valor de rpo seconds mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'RPO objetivo en segundos: cuántos datos se tolera perder. Independiente del RTO (MCH-022); 0 es válido y significa no perder ningún dato',
    minimum: RANGO_OBJETIVOS.rpoSeconds.min,
    maximum: MAX_OBJETIVO_SEGUNDOS,
  })
  @IsInt()
  @Min(RANGO_OBJETIVOS.rpoSeconds.min)
  @Max(RANGO_OBJETIVOS.rpoSeconds.max)
  rpoSeconds!: number;

  /**
   * Valor de rto seconds mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'RTO objetivo en segundos: cuánto tiempo se tolera estar fuera de servicio. Independiente del RPO (MCH-022); al menos 1 segundo',
    minimum: RANGO_OBJETIVOS.rtoSeconds.min,
    maximum: MAX_OBJETIVO_SEGUNDOS,
  })
  @IsInt()
  @Min(RANGO_OBJETIVOS.rtoSeconds.min)
  @Max(RANGO_OBJETIVOS.rtoSeconds.max)
  rtoSeconds!: number;

  /**
   * Valor de retention days mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Días de retención de copias' })
  @IsOptional()
  @IsInt()
  @Min(0)
  retentionDays?: number;

  /**
   * Valor de immutable copy required mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  immutableCopyRequired?: boolean;

  /**
   * Valor de encryption required mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  encryptionRequired?: boolean;

  /**
   * Valor de restore test frequency days mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Frecuencia de prueba de restauración (días)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  restoreTestFrequencyDays?: number;
}

/** Cuerpo de `POST /internal/ops/restore-test-runs` (UC-11-10). */
export class CreateRestoreTestRunDto {
  /**
   * Identificador asociado a backup policy.
   */
  @ApiProperty({ description: 'Política de backup ACTIVE', format: 'uuid' })
  @IsUUID()
  backupPolicyId!: string;

  /**
   * Valor de backup reference mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Referencia del backup restaurado',
    maxLength: 200,
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  backupReference?: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @ApiProperty({ description: 'Resultado (concept id)', format: 'uuid' })
  @IsUUID()
  outcomeConceptId!: string;

  /**
   * Valor de measured rpo seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'RPO medido en segundos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  measuredRpoSeconds?: number;

  /**
   * Valor de measured rto seconds mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'RTO medido en segundos' })
  @IsOptional()
  @IsInt()
  @Min(0)
  measuredRtoSeconds?: number;

  /**
   * Valor de integrity check passed mantenido por la instancia.
   */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  integrityCheckPassed?: boolean;

  /**
   * Identificador asociado a evidence file.
   */
  @ApiPropertyOptional({
    description: 'Archivo de evidencia (common.files.id)',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  evidenceFileId?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Inicio de la prueba (ISO)' })
  @IsOptional()
  @IsDateString()
  startedAt?: string;
}

/** Respuesta de la prueba de restauración (incluye señal de breach). */
export class RestoreTestRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a outcome concept.
   */
  @ApiProperty({ format: 'uuid' })
  outcomeConceptId!: string;

  /**
   * Resultado contra los objetivos de la política (MCH-023).
   *
   * `NOT_MEASURED` no es un incumplimiento: es la falta de evidencia para
   * afirmar cumplimiento. Un consumidor no puede leerlo como «aprobado» — el
   * propio nombre lo obliga a distinguirlo.
   */
  @ApiProperty({ enum: ['MET', 'BREACHED', 'NOT_MEASURED'] })
  @ApiProperty({ description: 'true si el RPO/RTO medido supera el objetivo' })
  objectiveStatus!: RestoreObjectiveStatus;
}
