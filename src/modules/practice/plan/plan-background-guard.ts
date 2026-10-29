import { PreconditionFailedException } from '../../../common';
import { sniffMimeType } from '../../../common/storage/upload-content-type';
import { BACKGROUND_RULES } from './floor-plan.constants';
import { FloorPlanReason } from './floor-plan.error-reasons';
import { readImageSize } from './plan-image';

/** Imagen de fondo ya verificada por su contenido real. */
export interface VerifiedBackgroundImage {
  /** Tipo real, deducido de los magic bytes; nunca el declarado por quien subió el archivo. */
  readonly mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  readonly width: number;
  readonly height: number;
}

/**
 * Verifica por **el contenido** que unos bytes son un PNG, JPEG o WebP legible
 * (CONTRATO-PLANO §1.6). Es la única puerta por la que pasa un fondo, tanto al
 * adjuntarlo como al servirlo.
 *
 * Nunca cae al tipo declarado: un HTML, un SVG o un script subido como
 * `image/png` no tiene firma de imagen y se rechaza, así que no puede servirse
 * al navegador como si fuera una imagen (XSS almacenado).
 *
 * @param buffer - Bytes de la versión exacta que se adjunta o se sirve.
 * @returns Tipo real y dimensiones.
 * @throws PreconditionFailedException (422 `BACKGROUND_FILE_INVALID`) si el contenido no es una imagen permitida.
 */
export function verifyBackgroundBytes(buffer: Buffer): VerifiedBackgroundImage {
  const real = sniffMimeType(buffer);
  if (
    !real ||
    !(BACKGROUND_RULES.mimeTypes as readonly string[]).includes(real)
  ) {
    throw new PreconditionFailedException(
      'El fondo debe ser una imagen PNG, JPEG o WebP (el SVG no se admite)',
      { cause: 'MIME', allowed: BACKGROUND_RULES.mimeTypes },
      FloorPlanReason.BACKGROUND_FILE_INVALID,
    );
  }
  const size = readImageSize(buffer, real);
  if (!size) {
    throw new PreconditionFailedException(
      'No se pudieron leer las dimensiones de la imagen',
      { cause: 'DIMENSIONS' },
      FloorPlanReason.BACKGROUND_FILE_INVALID,
    );
  }
  return {
    mimeType: real as VerifiedBackgroundImage['mimeType'],
    width: size.width,
    height: size.height,
  };
}
