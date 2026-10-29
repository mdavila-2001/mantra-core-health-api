import { canonicalJson } from '../../common/crypto/webhook-signature';
import type { ProviderReceiptDto } from './dto';

/**
 * Cadena que el proveedor firma en un acuse: un arreglo JSON con el proveedor y
 * **todos** los campos que deciden qué se concilia.
 *
 * Antes sólo se firmaba `rawPayloadJson` (opcional: sin él se firmaba `{}`), así
 * que una firma capturada de un acuse servía para fabricar otro con cualquier
 * `providerMessageRef` y `receiptType` —un rebote falso sobre la entrega de
 * otra persona—. Con el arreglo, cambiar cualquier campo cambia el HMAC.
 *
 * @param providerCode - Código del proveedor de la ruta.
 * @param dto - Cuerpo del acuse.
 * @returns La cadena sobre la que se calcula el HMAC.
 */
export function providerReceiptSignedString(
  providerCode: string,
  dto: Pick<
    ProviderReceiptDto,
    | 'providerMessageRef'
    | 'receiptType'
    | 'providerStatus'
    | 'occurredAt'
    | 'rawPayloadJson'
  >,
): string {
  return canonicalJson([
    providerCode,
    dto.providerMessageRef,
    dto.receiptType,
    dto.providerStatus ?? null,
    dto.occurredAt ?? null,
    dto.rawPayloadJson ?? null,
  ]);
}
