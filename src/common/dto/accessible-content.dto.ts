import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Topes de los tres textos accesibles que acompañan a un archivo o a un
 * reporte diagnóstico (`alt_text`, `description`, `transcription`).
 *
 * Son los mismos números que los CHECK del parche v4.2.33
 * (`database/SQL/patches/2026-09-26_v4233_files_diagnostic_reports_accessibility.sql`):
 * la API responde 400 antes de llegar a la base, y la base rechaza lo que
 * entre por otro camino. Cambiar uno sin el otro deja un 500 donde debería
 * haber un 400.
 *
 * - `altText`: texto alternativo breve (WCAG 1.1.1). WCAG no fija un número;
 *   500 deja margen al texto breve sin que sirva de descripción larga, que
 *   tiene su propio campo.
 * - `description`: descripción larga cuando el texto breve no alcanza (una
 *   imagen con varios hallazgos).
 * - `transcription`: transcripción de un audio, un video o un documento
 *   escaneado.
 */
export const ACCESSIBLE_CONTENT_LIMITS = {
  altText: 500,
  description: 4000,
  transcription: 100_000,
} as const;

/**
 * Los tres textos accesibles, todos opcionales. Son PHI con la sensibilidad
 * del contenido que describen: no se loguean ni viajan en URLs.
 */
export interface AccessibleContentFields {
  /** Texto alternativo breve. */
  altText?: string;
  /** Descripción larga. */
  description?: string;
  /** Transcripción del contenido. */
  transcription?: string;
}

/**
 * Los tres textos accesibles como campos de un cuerpo de alta. Se hereda
 * (`extends`) para que la validación y el tope sean los mismos en todos los
 * DTO que los aceptan.
 *
 * Opcionales: la mayoría de los archivos llega sin ellos y exigirlos
 * obligaría a inventar texto. Una cadena vacía se acepta y se guarda tal
 * cual: es distinto de «no declarado» (una imagen decorativa lleva
 * `alt=""` a propósito).
 */
export class AccessibleContentInputDto implements AccessibleContentFields {
  /** Texto alternativo breve. */
  @ApiPropertyOptional({
    description:
      'Texto alternativo breve del contenido (WCAG 1.1.1). Dato clínico: no va en URLs.',
    maxLength: ACCESSIBLE_CONTENT_LIMITS.altText,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ACCESSIBLE_CONTENT_LIMITS.altText)
  altText?: string;

  /** Descripción larga. */
  @ApiPropertyOptional({
    description:
      'Descripción larga del contenido, cuando el texto breve no alcanza.',
    maxLength: ACCESSIBLE_CONTENT_LIMITS.description,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ACCESSIBLE_CONTENT_LIMITS.description)
  description?: string;

  /** Transcripción del contenido. */
  @ApiPropertyOptional({
    description:
      'Transcripción del contenido (audio, video o documento escaneado).',
    maxLength: ACCESSIBLE_CONTENT_LIMITS.transcription,
  })
  @IsOptional()
  @IsString()
  @MaxLength(ACCESSIBLE_CONTENT_LIMITS.transcription)
  transcription?: string;
}

/**
 * Los tres textos accesibles en una respuesta. Ausentes (no `null`) cuando
 * nadie los escribió, igual que el resto de los opcionales de estos DTO.
 */
export class AccessibleContentResponseDto implements AccessibleContentFields {
  /** Texto alternativo breve. */
  @ApiPropertyOptional({ description: 'Texto alternativo breve.' })
  altText?: string;

  /** Descripción larga. */
  @ApiPropertyOptional({ description: 'Descripción larga del contenido.' })
  description?: string;

  /** Transcripción del contenido. */
  @ApiPropertyOptional({ description: 'Transcripción del contenido.' })
  transcription?: string;
}

/**
 * Copia los tres textos de una fila (entidad) a una respuesta, omitiendo los
 * que la base devolvió `null`.
 *
 * @param source - Fila con los tres campos, posiblemente `null`.
 * @returns Sólo los campos presentes.
 */
export function pickAccessibleContent(source: {
  altText?: string | null;
  description?: string | null;
  transcription?: string | null;
}): AccessibleContentFields {
  return {
    ...(source.altText != null ? { altText: source.altText } : {}),
    ...(source.description != null ? { description: source.description } : {}),
    ...(source.transcription != null
      ? { transcription: source.transcription }
      : {}),
  };
}
