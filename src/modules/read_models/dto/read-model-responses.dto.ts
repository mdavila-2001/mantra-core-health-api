import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Resultado simple de una operación (ok/estado). */
export class OperationResultDto {
  @ApiProperty({ description: 'Indica éxito' })
  ok!: boolean;

  @ApiPropertyOptional({ description: 'Nuevo estado del recurso (concept id)' })
  status?: string;
}

/** Respuesta de creación / versión de una definición de read model. */
export class ReadModelDefinitionResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  schemaName!: string;

  @ApiProperty()
  objectName!: string;

  @ApiProperty()
  versionNumber!: number;

  @ApiProperty({ description: 'Estado (concept id)' })
  status!: string;

  @ApiProperty({ description: 'Hash del DDL/contrato' })
  definitionHash!: string;

  @ApiProperty({ description: 'Cantidad de dependencias declaradas' })
  dependencyCount!: number;

  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una corrida de refresh/backfill/reconcile. */
export class RefreshRunResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  readModelDefinitionId!: string;

  @ApiProperty({ description: 'Tipo de corrida (concept id)' })
  refreshType!: string;

  @ApiProperty({ description: 'Resultado (concept id)' })
  result!: string;

  @ApiPropertyOptional()
  rowsAffected?: string;

  @ApiPropertyOptional()
  startedAt?: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiProperty({ format: 'uuid' })
  correlationId!: string;
}

/** Respuesta de publicación de un contrato de vista. */
export class ViewContractResponseDto {
  @ApiProperty({ format: 'uuid', description: 'Id de la vista de página' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  portalSurfaceId!: string;

  @ApiProperty({ format: 'uuid' })
  frontendRouteId!: string;

  @ApiProperty()
  viewCode!: string;

  @ApiProperty({ description: 'Campos publicados' })
  fieldCount!: number;

  @ApiProperty({ description: 'Acciones publicadas' })
  actionCount!: number;

  @ApiProperty({ description: 'Estado (concept id)' })
  status!: string;
}

/** Preferencias de vista persistidas. */
export class ViewPreferencesResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  frontendPageViewId!: string;

  @ApiProperty({ description: 'Se creó (true) o se actualizó (false)' })
  created!: boolean;

  @ApiProperty({ description: 'Estado (concept id)' })
  status!: string;
}

/** Acción disponible derivada en servidor (UC-30-11). */
export class AvailableActionDto {
  @ApiProperty()
  actionCode!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty({ description: 'Tipo de acción (concept id)' })
  actionType!: string;

  @ApiProperty({ description: 'Habilitada para el estado + permisos del solicitante' })
  enabled!: boolean;
}

/** Metadata de una columna servida (masking aplicado). */
export class ServedFieldDto {
  @ApiProperty()
  fieldCode!: string;

  @ApiProperty()
  label!: string;

  @ApiProperty()
  dataType!: string;

  @ApiProperty({ description: 'Enmascarado por sensibilidad/permiso' })
  masked!: boolean;
}

/** Respuesta de `GET .../data` (UC-30-05). Contrato + proyección (sin PII cruda). */
export class ServeViewDataResponseDto {
  @ApiProperty({ format: 'uuid' })
  frontendPageViewId!: string;

  @ApiProperty()
  viewCode!: string;

  @ApiProperty({ description: 'Columnas servidas (con masking)', type: [ServedFieldDto] })
  fields!: ServedFieldDto[];

  @ApiProperty({ description: 'Filas del read model (proyección)', type: [Object] })
  data!: Record<string, unknown>[];

  @ApiProperty({ description: 'Acciones disponibles derivadas', type: [AvailableActionDto] })
  availableActions!: AvailableActionDto[];

  @ApiPropertyOptional({ description: 'Cursor de la siguiente página' })
  nextCursor?: string | null;

  @ApiPropertyOptional({ description: 'Última materialización de la MV' })
  refreshedAt?: Date | null;

  @ApiProperty({ description: 'Antigüedad en segundos respecto a la última materialización' })
  stalenessSeconds!: number;

  @ApiProperty({ description: 'Marca de generación de la respuesta' })
  generatedAt!: Date;
}

/** Fila de salud de un read model (UC-30-12). */
export class ReadModelHealthItemDto {
  @ApiProperty({ format: 'uuid' })
  definitionId!: string;

  @ApiProperty()
  schemaName!: string;

  @ApiProperty()
  objectName!: string;

  @ApiPropertyOptional()
  lastRefreshedAt?: Date | null;

  @ApiProperty()
  stalenessSeconds!: number;

  @ApiProperty({ description: 'Excede maximum_staleness_seconds' })
  stale!: boolean;
}

/** Respuesta de `GET /read-models/health`. */
export class ReadModelHealthResponseDto {
  @ApiProperty()
  generatedAt!: Date;

  @ApiProperty({ type: [ReadModelHealthItemDto] })
  items!: ReadModelHealthItemDto[];
}

/** Respuesta de una proyección pública (UC-30-10). */
export class PublicProjectionResponseDto {
  @ApiProperty({ description: 'Slug o consulta pública resuelta' })
  slug!: string;

  @ApiProperty({ description: 'Registros públicos aprobados', type: [Object] })
  records!: Record<string, unknown>[];

  @ApiPropertyOptional({ description: 'Última materialización de la MV pública' })
  refreshedAt?: Date | null;

  @ApiProperty({ description: 'Marca de generación de la respuesta' })
  generatedAt!: Date;
}
