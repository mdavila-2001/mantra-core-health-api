import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Metadatos de paginación keyset comunes a los listados del hub. */
class KeysetPageMetaDto {
  /** Cantidad devuelta en esta página. */
  @ApiProperty() count!: number;

  /** Tope aplicado a la consulta. */
  @ApiProperty() limit!: number;

  /** Cursor opaco de continuación, o `null` si ésta es la última página. */
  @ApiProperty({ nullable: true, type: String }) nextCursor!: string | null;
}

/** Una fuente de contexto de salud. */
export class HealthContextSourceSummaryDto {
  /** Identificador único de la fuente. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código único de la fuente. */
  @ApiProperty() code!: string;

  /** Nombre visible. */
  @ApiProperty() name!: string;

  /** Concepto del tipo de fuente. */
  @ApiProperty({ format: 'uuid' }) sourceTypeConceptId!: string;

  /** Entidad dueña de la fuente. */
  @ApiPropertyOptional() ownerName?: string;

  /** URL canónica. */
  @ApiPropertyOptional() canonicalUrl?: string;

  /** País al que aplica, si es de un país. */
  @ApiPropertyOptional({ format: 'uuid' }) countryConceptId?: string;

  /** Concepto del nivel de confianza. */
  @ApiPropertyOptional({ format: 'uuid' }) trustTierConceptId?: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
}

/** Página de fuentes de contexto de salud. */
export class ListHealthContextSourcesResponseDto extends KeysetPageMetaDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [HealthContextSourceSummaryDto] })
  items!: HealthContextSourceSummaryDto[];
}

/** Un agente recolector de contexto. */
export class ContextAgentSummaryDto {
  /** Identificador único del agente. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Código único del agente. */
  @ApiProperty() code!: string;

  /** Nombre visible. */
  @ApiProperty() name!: string;

  /** Concepto del tipo de agente. */
  @ApiProperty({ format: 'uuid' }) agentTypeConceptId!: string;

  /** Tenant dueño, o ausente si es de plataforma. */
  @ApiPropertyOptional({ format: 'uuid' }) ownerTenantId?: string;

  /** Último latido recibido. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastHeartbeatAt?: Date;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
}

/** Página de agentes recolectores visibles para el tenant del actor. */
export class ListContextAgentsResponseDto extends KeysetPageMetaDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [ContextAgentSummaryDto] })
  items!: ContextAgentSummaryDto[];
}

/** Una programación de recolección de contexto por país. */
export class ContextScheduleSummaryDto {
  /** Identificador único de la programación. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** País de la programación. */
  @ApiProperty({ format: 'uuid' }) countryConceptId!: string;

  /** Agente que ejecuta la programación. */
  @ApiProperty({ format: 'uuid' }) agentId!: string;

  /** Expresión de programación (cron). */
  @ApiProperty() scheduleExpression!: string;

  /** Próxima ejecución prevista. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  nextRunAt?: Date;

  /** Última ejecución exitosa. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  lastSuccessAt?: Date;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
}

/** Página de programaciones de recolección. */
export class ListContextSchedulesResponseDto extends KeysetPageMetaDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [ContextScheduleSummaryDto] })
  items!: ContextScheduleSummaryDto[];
}

/** Un contexto de salud de un país. */
export class CountryHealthContextSummaryDto {
  /** Identificador único del contexto. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** País del contexto. */
  @ApiProperty({ format: 'uuid' }) countryConceptId!: string;

  /** Concepto del dominio del contexto. */
  @ApiProperty({ format: 'uuid' }) contextDomainConceptId!: string;

  /** Clave del contexto dentro del dominio. */
  @ApiProperty() contextKey!: string;

  /** Título visible. */
  @ApiProperty() title!: string;

  /** Versión vigente, si ya se publicó una. */
  @ApiPropertyOptional({ format: 'uuid' }) currentVersionId?: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
}

/** Página de contextos de salud por país. */
export class ListCountryHealthContextsResponseDto extends KeysetPageMetaDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [CountryHealthContextSummaryDto] })
  items!: CountryHealthContextSummaryDto[];
}

/** Una versión de un contexto de salud (sin el payload). */
export class CountryHealthContextVersionSummaryDto {
  /** Identificador único de la versión. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Número de versión. */
  @ApiProperty() versionNumber!: number;

  /** Resumen legible de la versión. */
  @ApiPropertyOptional() summary?: string;

  /** Cuándo se observó. */
  @ApiProperty({ type: String, format: 'date-time' }) observedAt!: Date;

  /** Inicio de vigencia. */
  @ApiProperty({ type: String, format: 'date-time' }) effectiveFrom!: Date;

  /** Fin de vigencia. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  effectiveTo?: Date;

  /** Huella del contenido. */
  @ApiProperty() contentHash!: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;
}

/** Página de versiones de un contexto. */
export class ListCountryHealthContextVersionsResponseDto extends KeysetPageMetaDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [CountryHealthContextVersionSummaryDto] })
  items!: CountryHealthContextVersionSummaryDto[];
}

/** Una corrida de recolección de contexto. */
export class ContextCollectionRunSummaryDto {
  /** Identificador único de la corrida. */
  @ApiProperty({ format: 'uuid' }) id!: string;

  /** Programación de origen, si la hubo. */
  @ApiPropertyOptional({ format: 'uuid' }) scheduleId?: string;

  /** Agente que la ejecutó. */
  @ApiProperty({ format: 'uuid' }) agentId!: string;

  /** País recolectado. */
  @ApiProperty({ format: 'uuid' }) countryConceptId!: string;

  /** Concepto de estado. */
  @ApiProperty({ format: 'uuid' }) statusConceptId!: string;

  /** Inicio de la corrida. */
  @ApiProperty({ type: String, format: 'date-time' }) startedAt!: Date;

  /** Fin de la corrida. */
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  finishedAt?: Date;

  /** Resumen del error, si falló. */
  @ApiPropertyOptional() errorSummary?: string;
}

/** Página de corridas de recolección. */
export class ListContextCollectionRunsResponseDto extends KeysetPageMetaDto {
  /** Filas de esta página, ordenadas por `id`. */
  @ApiProperty({ type: [ContextCollectionRunSummaryDto] })
  items!: ContextCollectionRunSummaryDto[];
}
