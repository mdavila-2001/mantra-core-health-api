import { CONCEPTS } from '../constants/concepts';
import { PreconditionFailedException } from '../errors/domain.exception';

/** Formatos de imagen que se aceptan como logo. */
export const LOGO_IMAGE_MIME_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
];

/** Tope de un logo: 2 MB. */
export const LOGO_MAX_BYTES = 2 * 1024 * 1024;

/**
 * Lo que un logo exige además de ser un archivo usable: que sea de
 * sensibilidad NORMAL —se muestra en membretes y vitrinas, nunca puede ser
 * PHI— y que no pase de 2 MB.
 *
 * Vive acá y no en cada caso de uso porque lo comparten el logo de la
 * organización y el del consultorio: dos copias de la misma regla terminan
 * divergiendo.
 *
 * @param file - El archivo ya validado como usable (vivo, del formato admitido).
 * @param version - Su versión vigente.
 * @throws PreconditionFailedException (422) si no es NORMAL o supera los 2 MB.
 */
export function assertLogoImage(
  file: { readonly sensitivityConceptId?: string },
  version: { readonly sizeBytes: string | number },
): void {
  if (file.sensitivityConceptId !== CONCEPTS.SENSITIVITY_NORMAL) {
    throw new PreconditionFailedException(
      'El logo debe ser una imagen de sensibilidad NORMAL',
    );
  }
  if (Number(version.sizeBytes) > LOGO_MAX_BYTES) {
    throw new PreconditionFailedException('El logo supera los 2 MB');
  }
}
