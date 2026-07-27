import { ApiProperty } from '@nestjs/swagger';

/** Respuesta genérica con el id del recurso creado. */
export class IdResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;
}

/** Respuesta con una lista de ids creados (inserts en lote). */
export class IdListResponseDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  ids!: string[];
}

/** Resultado genérico de una operación de estado (publish, close, migrate). */
export class OkResultDto {
  @ApiProperty({ description: 'true si la operación se aplicó' })
  ok!: boolean;
}

/** Respuesta de creación de un set de definiciones (UC-09-01). */
export class DefinitionSetResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Versión inicial (draft) creada',
  })
  versionId!: string;

  @ApiProperty({ description: 'Estado del set (concept id)', format: 'uuid' })
  status!: string;
}

/** Respuesta de apertura de instancia (UC-09-07). */
export class FormInstanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Versión de schema congelada' })
  schemaVersion!: number;

  @ApiProperty({
    description: 'Estado de la instancia (concept id)',
    format: 'uuid',
  })
  state!: string;
}

/** Respuesta de ejecución de migración (UC-09-13). */
export class MigrationRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ description: 'Estado final (concept id)', format: 'uuid' })
  status!: string;

  @ApiProperty({ description: 'Nº de valores migrados' })
  migratedValues!: number;
}
