import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica con el id del recurso creado. */
export class IdResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Respuesta con una lista de ids creados (inserts en lote). */
export class IdListResponseDto {
  /**
   * Valor de ids mantenido por la instancia.
   */
  @ApiProperty({ type: [String], format: 'uuid' })
  ids!: string[];
}

/** Resultado genérico de una operación de estado (publish, close, migrate). */
export class OkResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Respuesta de creación de un set de definiciones (UC-09-01). */
export class DefinitionSetResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a version.
   */
  @ApiProperty({
    format: 'uuid',
    description: 'Versión inicial (draft) creada',
  })
  versionId!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado del set (concept id)', format: 'uuid' })
  status!: string;
}

/** Respuesta de apertura de instancia (UC-09-07). */
export class FormInstanceResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de schema version mantenido por la instancia.
   */
  @ApiProperty({ description: 'Versión de schema congelada' })
  schemaVersion!: number;

  /**
   * Valor de state mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Estado de la instancia (concept id)',
    format: 'uuid',
  })
  state!: string;
}

/** Respuesta de ejecución de migración (UC-09-13). */
export class MigrationRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado final (concept id)', format: 'uuid' })
  status!: string;

  /**
   * Valor de migrated values mantenido por la instancia.
   */
  @ApiProperty({ description: 'Nº de valores migrados' })
  migratedValues!: number;
}
