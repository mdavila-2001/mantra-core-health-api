import { UniqueConstraintViolationException } from '@mikro-orm/core';
import { ConflictException } from '../../common';
import { MarketingErrorReason } from './marketing.error-reasons';

/**
 * Ejecuta una alta cuyo código es único por tenant y traduce la violación de
 * unicidad de la base a un `409` estable. La validación previa del servicio
 * cubre el caso normal; esto cubre la carrera entre dos altas simultáneas y
 * cualquier índice que la base aplique más ancho que el servicio.
 *
 * @param persist - Alta que persiste el recurso.
 * @param message - Mensaje del conflicto (el mismo que el de la validación previa).
 * @param code - Código que se intentó registrar.
 * @returns El resultado del alta.
 * @throws ConflictException `MARKETING_CODE_ALREADY_EXISTS` si la base rechaza el código.
 */
export async function persistWithCodeConflict<T>(
  persist: () => Promise<T>,
  message: string,
  code: string,
): Promise<T> {
  try {
    return await persist();
  } catch (error) {
    if (error instanceof UniqueConstraintViolationException) {
      throw new ConflictException(
        message,
        { code },
        MarketingErrorReason.CODE_ALREADY_EXISTS,
      );
    }
    throw error;
  }
}
