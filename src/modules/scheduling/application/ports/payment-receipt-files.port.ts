/**
 * Puerto hacia los archivos de `common` para los comprobantes de pago.
 *
 * Los comprobantes cuelgan de `common.files`: el paciente sube el archivo por
 * el camino de siempre (escaneo, tipo real deducido de los bytes) y la agenda
 * solo guarda su id. Este puerto nombra las tres cosas que la agenda necesita
 * de ese contexto y nada más.
 */

import type { AuthenticatedUser } from '../../../../common';
import type { UnitOfWork } from './unit-of-work';

/** Lo que la agenda muestra de un archivo de comprobante. */
export interface PaymentReceiptFileInfo {
  readonly mimeType: string;
  readonly originalName: string | null;
}

/** Los bytes de un comprobante, listos para servirse por HTTP. */
export interface PaymentReceiptFileContent {
  readonly buffer: Buffer;
  readonly mimeType: string;
  readonly originalName?: string;
}

/** Archivos de los comprobantes de pago. */
export interface PaymentReceiptFilesPort {
  /**
   * Exige que el actor pueda adjuntar ese archivo como comprobante: que lo
   * haya subido él, que esté vivo, sin infectar, sea png, jpeg, webp o pdf y
   * no pase de 5 MB.
   *
   * @throws PreconditionFailedException (422) si no cumple cualquiera de esas
   *   condiciones, incluido que el archivo no exista o sea de otro usuario.
   */
  assertAttachable(
    uow: UnitOfWork,
    fileId: string,
    actor: AuthenticatedUser,
  ): Promise<PaymentReceiptFileInfo>;

  /** Tipo y nombre de varios archivos, en una consulta. */
  describe(
    uow: UnitOfWork,
    fileIds: readonly string[],
  ): Promise<Map<string, PaymentReceiptFileInfo>>;

  /**
   * Los bytes de un comprobante. **No autoriza**: quien llama ya comprobó que
   * el actor puede ver la cita de la que cuelga.
   */
  download(fileId: string): Promise<PaymentReceiptFileContent>;
}

/** Token de inyección del puerto de archivos de comprobantes. */
export const PAYMENT_RECEIPT_FILES_PORT = Symbol('PAYMENT_RECEIPT_FILES_PORT');
