import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Resultado simple de una operación (ok/estado). */
export class OperationResultDto {
  /**
   * Valor de ok mantenido por la instancia.
   */
  @ApiProperty({ description: 'Indica éxito' })
  ok!: boolean;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Nuevo estado del recurso (concept id)' })
  status?: string;
}

/** Respuesta de creación / versión de una definición de read model. */
export class ReadModelDefinitionResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @ApiProperty()
  schemaName!: string;

  /**
   * Valor de object name mantenido por la instancia.
   */
  @ApiProperty()
  objectName!: string;

  /**
   * Valor de version number mantenido por la instancia.
   */
  @ApiProperty()
  versionNumber!: number;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)' })
  status!: string;

  /**
   * Valor de definition hash mantenido por la instancia.
   */
  @ApiProperty({ description: 'Hash del DDL/contrato' })
  definitionHash!: string;

  /**
   * Valor de dependency count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Cantidad de dependencias declaradas' })
  dependencyCount!: number;

  /**
   * Fecha y hora en que se creó el registro.
   */
  @ApiProperty()
  createdAt!: Date;
}

/** Respuesta de una corrida de refresh/backfill/reconcile. */
export class RefreshRunResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a read model definition.
   */
  @ApiProperty({ format: 'uuid' })
  readModelDefinitionId!: string;

  /**
   * Valor de refresh type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de corrida (concept id)' })
  refreshType!: string;

  /**
   * Valor de result mantenido por la instancia.
   */
  @ApiProperty({ description: 'Resultado (concept id)' })
  result!: string;

  /**
   * Valor de rows affected mantenido por la instancia.
   */
  @ApiPropertyOptional()
  rowsAffected?: string;

  /**
   * Valor de started at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  startedAt?: Date;

  /**
   * Valor de completed at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  completedAt?: Date;

  /**
   * Identificador asociado a correlation.
   */
  @ApiProperty({ format: 'uuid' })
  correlationId!: string;
}

/** Respuesta de publicación de un contrato de vista. */
export class ViewContractResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid', description: 'Id de la vista de página' })
  id!: string;

  /**
   * Identificador asociado a portal surface.
   */
  @ApiProperty({ format: 'uuid' })
  portalSurfaceId!: string;

  /**
   * Identificador asociado a frontend route.
   */
  @ApiProperty({ format: 'uuid' })
  frontendRouteId!: string;

  /**
   * Valor de view code mantenido por la instancia.
   */
  @ApiProperty()
  viewCode!: string;

  /**
   * Valor de field count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Campos publicados' })
  fieldCount!: number;

  /**
   * Valor de action count mantenido por la instancia.
   */
  @ApiProperty({ description: 'Acciones publicadas' })
  actionCount!: number;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)' })
  status!: string;
}

/** Preferencias de vista persistidas. */
export class ViewPreferencesResponseDto {
  /**
   * Identificador único de la instancia.
   */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /**
   * Identificador asociado a frontend page view.
   */
  @ApiProperty({ format: 'uuid' })
  frontendPageViewId!: string;

  /**
   * Valor de created mantenido por la instancia.
   */
  @ApiProperty({ description: 'Se creó (true) o se actualizó (false)' })
  created!: boolean;

  /**
   * Valor de status mantenido por la instancia.
   */
  @ApiProperty({ description: 'Estado (concept id)' })
  status!: string;
}

/** Acción disponible derivada en servidor (UC-30-11). */
export class AvailableActionDto {
  /**
   * Valor de action code mantenido por la instancia.
   */
  @ApiProperty()
  actionCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiProperty()
  label!: string;

  /**
   * Valor de action type mantenido por la instancia.
   */
  @ApiProperty({ description: 'Tipo de acción (concept id)' })
  actionType!: string;

  /**
   * Valor de enabled mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Habilitada para el estado + permisos del solicitante',
  })
  enabled!: boolean;
}

/** Metadata de una columna servida (masking aplicado). */
export class ServedFieldDto {
  /**
   * Valor de field code mantenido por la instancia.
   */
  @ApiProperty()
  fieldCode!: string;

  /**
   * Valor de label mantenido por la instancia.
   */
  @ApiProperty()
  label!: string;

  /**
   * Valor de data type mantenido por la instancia.
   */
  @ApiProperty()
  dataType!: string;

  /**
   * Valor de masked mantenido por la instancia.
   */
  @ApiProperty({ description: 'Enmascarado por sensibilidad/permiso' })
  masked!: boolean;
}

/** Respuesta de `GET .../data` (UC-30-05). Contrato + proyección (sin PII cruda). */
export class ServeViewDataResponseDto {
  /**
   * Identificador asociado a frontend page view.
   */
  @ApiProperty({ format: 'uuid' })
  frontendPageViewId!: string;

  /**
   * Valor de view code mantenido por la instancia.
   */
  @ApiProperty()
  viewCode!: string;

  /**
   * Valor de fields mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Columnas servidas (con masking)',
    type: [ServedFieldDto],
  })
  fields!: ServedFieldDto[];

  /**
   * Valor de data mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Filas del read model (proyección)',
    type: [Object],
  })
  data!: Record<string, unknown>[];

  /**
   * Valor de available actions mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Acciones disponibles derivadas',
    type: [AvailableActionDto],
  })
  availableActions!: AvailableActionDto[];

  /**
   * Valor de next cursor mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Cursor de la siguiente página' })
  nextCursor?: string | null;

  /**
   * Valor de refreshed at mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Última materialización de la MV' })
  refreshedAt?: Date | null;

  /**
   * Valor de staleness seconds mantenido por la instancia.
   */
  @ApiProperty({
    description: 'Antigüedad en segundos respecto a la última materialización',
  })
  stalenessSeconds!: number;

  /**
   * Valor de generated at mantenido por la instancia.
   */
  @ApiProperty({ description: 'Marca de generación de la respuesta' })
  generatedAt!: Date;
}

/** Fila de salud de un read model (UC-30-12). */
export class ReadModelHealthItemDto {
  /**
   * Identificador asociado a definition.
   */
  @ApiProperty({ format: 'uuid' })
  definitionId!: string;

  /**
   * Valor de schema name mantenido por la instancia.
   */
  @ApiProperty()
  schemaName!: string;

  /**
   * Valor de object name mantenido por la instancia.
   */
  @ApiProperty()
  objectName!: string;

  /**
   * Valor de last refreshed at mantenido por la instancia.
   */
  @ApiPropertyOptional()
  lastRefreshedAt?: Date | null;

  /**
   * Valor de staleness seconds mantenido por la instancia.
   */
  @ApiProperty()
  stalenessSeconds!: number;

  /**
   * Valor de stale mantenido por la instancia.
   */
  @ApiProperty({ description: 'Excede maximum_staleness_seconds' })
  stale!: boolean;
}

/** Respuesta de `GET /read-models/health`. */
export class ReadModelHealthResponseDto {
  /**
   * Valor de generated at mantenido por la instancia.
   */
  @ApiProperty()
  generatedAt!: Date;

  /**
   * Valor de items mantenido por la instancia.
   */
  @ApiProperty({ type: [ReadModelHealthItemDto] })
  items!: ReadModelHealthItemDto[];
}

/** Respuesta de una proyección pública (UC-30-10). */
export class PublicProjectionResponseDto {
  /**
   * Valor de slug mantenido por la instancia.
   */
  @ApiProperty({ description: 'Slug o consulta pública resuelta' })
  slug!: string;

  /**
   * Valor de records mantenido por la instancia.
   */
  @ApiProperty({ description: 'Registros públicos aprobados', type: [Object] })
  records!: Record<string, unknown>[];

  /**
   * Valor de refreshed at mantenido por la instancia.
   */
  @ApiPropertyOptional({
    description: 'Última materialización de la MV pública',
  })
  refreshedAt?: Date | null;

  /**
   * Valor de generated at mantenido por la instancia.
   */
  @ApiProperty({ description: 'Marca de generación de la respuesta' })
  generatedAt!: Date;
}
