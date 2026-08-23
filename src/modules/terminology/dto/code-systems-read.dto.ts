import { ApiProperty } from '@nestjs/swagger';

/** Un sistema de codificación en el listado. */
export class CodeSystemListItemDto {
  /** Identificador del sistema. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Código interno con el que se lo nombra. */
  @ApiProperty({ description: 'Código interno', example: 'icd10cm' })
  internalCode!: string;

  /** Nombre legible. */
  @ApiProperty({ description: 'Nombre del sistema de codificación' })
  name!: string;

  /** URL canónica declarada. */
  @ApiProperty({ description: 'URL canónica del sistema' })
  canonicalUrl!: string;
}

/** Respuesta de `GET /terminology/code-systems`. */
export class ListCodeSystemsResponseDto {
  /** Los sistemas registrados. */
  @ApiProperty({ type: [CodeSystemListItemDto] })
  items!: CodeSystemListItemDto[];
}

/** Una versión en el listado. */
export class CodeSystemVersionListItemDto {
  /** Identificador de la versión. */
  @ApiProperty({ format: 'uuid' })
  id!: string;

  /** Etiqueta de versión. */
  @ApiProperty({ description: 'Versión', example: '2026' })
  version!: string;

  /**
   * Estado, en palabra.
   *
   * `UNKNOWN` es el caso real de las versiones que dejaron los importadores
   * externos sin fijar estado: no es un error, y admiten conceptos igual.
   */
  @ApiProperty({ enum: ['DRAFT', 'ACTIVE', 'UNKNOWN'] })
  state!: 'DRAFT' | 'ACTIVE' | 'UNKNOWN';

  /** Si es la versión por defecto del sistema. */
  @ApiProperty({ description: 'Si es la versión por defecto' })
  isDefault!: boolean;

  /** Cuándo se publicó, si se publicó. */
  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  publishedAt!: Date | null;

  /** Si todavía admite conceptos nuevos. */
  @ApiProperty({ description: 'Si se le pueden importar conceptos' })
  acceptsConcepts!: boolean;
}

/** Respuesta de `GET /terminology/code-systems/{id}/versions`. */
export class ListCodeSystemVersionsResponseDto {
  /** Las versiones del sistema. */
  @ApiProperty({ type: [CodeSystemVersionListItemDto] })
  items!: CodeSystemVersionListItemDto[];
}
