import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

/** Equivalencias admitidas entre dos conceptos, del value set de FHIR. */
export const EQUIVALENCES = [
  'EQUIVALENT',
  'WIDER',
  'NARROWER',
  'INEXACT',
  'UNMATCHED',
] as const;
/**
 * Define el tipo de dominio equivalence.
 */
export type Equivalence = (typeof EQUIVALENCES)[number];

/**
 * Curado o consulta de un mapeo entre conceptos (UC-03-09, FHIR `$translate`).
 *
 * Con `targetConceptId` la llamada **cura** el mapa: lo crea o actualiza su
 * equivalencia. Sin él, sólo **consulta** las traducciones ya curadas del concepto
 * de origen.
 */
export class TranslateConceptDto {
  /**
   * Identificador asociado a source concept.
   */
  @ApiProperty({ description: 'Concepto de origen', format: 'uuid' })
  @IsUUID()
  sourceConceptId!: string;

  /**
   * Identificador asociado a target concept.
   */
  @ApiPropertyOptional({
    description: 'Concepto de destino. Si se envía, la llamada cura el mapeo.',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  targetConceptId?: string;

  /**
   * Valor de equivalence mantenido por la instancia.
   */
  @ApiPropertyOptional({
    enum: EQUIVALENCES,
    description: 'Equivalencia del mapeo; obligatoria al curar',
  })
  @IsOptional()
  @IsIn(EQUIVALENCES)
  equivalence?: Equivalence;

  /**
   * Valor de context mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Contexto del mapeo', maxLength: 255 })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  context?: string;

  /**
   * Valor de version mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Versión del mapeo', maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  version?: string;
}

/** Una traducción del concepto de origen. */
export class TranslationMatchDto {
  /**
   * Identificador asociado a concept map.
   */
  @ApiProperty({ description: 'Id del mapeo' })
  conceptMapId!: string;

  /**
   * Identificador asociado a target concept.
   */
  @ApiProperty({ description: 'Concepto de destino' })
  targetConceptId!: string;

  /**
   * Identificador asociado a equivalence concept.
   */
  @ApiPropertyOptional({ description: 'Equivalencia (concepto)' })
  equivalenceConceptId?: string;

  /**
   * Valor de context mantenido por la instancia.
   */
  @ApiPropertyOptional({ description: 'Contexto del mapeo' })
  context?: string;
}

/** Resultado de `$translate`. */
export class TranslateResponseDto {
  /**
   * Identificador asociado a source concept.
   */
  @ApiProperty({ description: 'Concepto de origen' })
  sourceConceptId!: string;

  /**
   * Valor de matched mantenido por la instancia.
   */
  @ApiProperty({ description: 'Verdadero si hay al menos una traducción' })
  matched!: boolean;

  /**
   * Valor de matches mantenido por la instancia.
   */
  @ApiProperty({
    type: [TranslationMatchDto],
    description: 'Traducciones encontradas',
  })
  matches!: TranslationMatchDto[];

  /**
   * Valor de curated mantenido por la instancia.
   */
  @ApiProperty({
    description:
      'Verdadero si la llamada curó un mapeo en vez de sólo consultar',
  })
  curated!: boolean;
}
